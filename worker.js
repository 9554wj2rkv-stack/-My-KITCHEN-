/**
 * Smart Treats — AI recipe server (Cloudflare Worker)
 *
 *   POST /api/recipes/generate   → recipe ideas from the pantry (OpenAI Responses API, Structured Outputs)
 *   POST /api/recipes/substitute → "Use what I have instead"
 *
 * Secrets / settings (set with `wrangler secret put` or in the Cloudflare dashboard):
 *   OPENAI_API_KEY   required — your OpenAI key. Never put it in index.html.
 *   OPENAI_MODEL     optional — defaults to "gpt-4.1-mini"; set to any current model that supports Structured Outputs.
 *   ALLOWED_ORIGIN   required — your app's address, e.g. https://yourname.github.io
 */
const NUM_OR_NULL = { type: ["number", "null"] };
const ING = { type: "object", additionalProperties: false, required: ["name", "amount", "unit", "inPantry"],
  properties: { name: { type: "string" }, amount: { type: ["string", "null"] }, unit: { type: "string" }, inPantry: { type: "boolean" } } };
const RECIPE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["recipes"],
  properties: { recipes: { type: "array", items: {
    type: "object", additionalProperties: false,
    required: ["title", "description", "category", "servings", "prepTime", "cookTime", "ingredients", "missingIngredients", "instructions", "tags", "nutrition"],
    properties: {
      title: { type: "string" }, description: { type: "string" }, category: { type: "string" },
      servings: NUM_OR_NULL, prepTime: NUM_OR_NULL, cookTime: NUM_OR_NULL,
      ingredients: { type: "array", items: ING },
      missingIngredients: { type: "array", items: ING },
      instructions: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
      nutrition: { type: "object", additionalProperties: false, required: ["calories", "protein", "carbs", "fat", "fiber", "estimated"],
        properties: { calories: NUM_OR_NULL, protein: NUM_OR_NULL, carbs: NUM_OR_NULL, fat: NUM_OR_NULL, fiber: NUM_OR_NULL, estimated: { type: "boolean" } } }
    } } } }
};
const SUB_SCHEMA = { type: "object", additionalProperties: false, required: ["possible", "pantryItem", "amount", "unit", "note", "confidence"],
  properties: { possible: { type: "boolean" }, pantryItem: { type: ["string", "null"] }, amount: { type: ["string", "null"] }, unit: { type: ["string", "null"] }, note: { type: "string" }, confidence: { type: "string", enum: ["high", "medium", "low"] } } };

const list = (a, max = 80) => (Array.isArray(a) ? a : []).slice(0, max).map(x => String(typeof x === "object" && x ? x.name ?? "" : x).slice(0, 80)).filter(Boolean);

function cors(env, req) {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return { ok, headers: { "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" } };
}
const json = (body, status, headers) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

async function callOpenAI(env, instructions, input, name, schema) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 40000);
  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: ctl.signal,
      headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-4.1-mini", instructions, input,
        text: { format: { type: "json_schema", name, schema, strict: true } } })
    });
    if (r.status === 429) throw { status: 429, error: "rate_limited" };
    if (!r.ok) throw { status: 502, error: "openai_error", detail: (await r.text()).slice(0, 300) };
    const data = await r.json();
    const text = data.output_text ?? (data.output || []).flatMap(o => o.content || []).find(c => c.type === "output_text")?.text;
    if (!text) throw { status: 502, error: "empty_response" };
    try { return JSON.parse(text); } catch { throw { status: 502, error: "invalid_json" }; }
  } catch (e) {
    if (e && e.name === "AbortError") throw { status: 504, error: "timeout" };
    throw e;
  } finally { clearTimeout(t); }
}

export default {
  async fetch(req, env) {
    const c = cors(env, req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: c.headers });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, c.headers);
    if (!c.ok) return json({ error: "origin_not_allowed" }, 403, c.headers);
    if (!env.OPENAI_API_KEY) return json({ error: "missing_api_key" }, 500, c.headers);
    let body; try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400, c.headers); }
    const path = new URL(req.url).pathname;
    try {
      if (path.endsWith("/api/recipes/generate")) {
        // Only food data is accepted and forwarded — nothing personal.
        const req2 = { pantry: list(body.pantry), restrictions: list(body.restrictions, 20), avoidIngredients: list(body.avoidIngredients, 40),
          preferences: list(body.preferences, 20), dislikes: list(body.dislikes, 20), recipeType: String(body.recipeType || "any treat").slice(0, 120),
          goal: String(body.goal || "").slice(0, 160), maxMissingIngredients: Math.max(0, Math.min(3, Number(body.maxMissingIngredients) || 0)),
          numberOfRecipes: Math.max(1, Math.min(10, Number(body.numberOfRecipes) || 8)) };
        const instructions = `You create realistic home-baking and snack recipes from a person's pantry.
Be creative — the pantry is a pool of ingredients, not a shopping list for one classic recipe.
Hard rules: every recipe must comply with ALL restrictions; never use any avoided ingredient; use at most ${req2.maxMissingIngredients} ingredients not in the pantry (list them in missingIngredients).
Every recipe must physically work: enough liquid, binder and leavening where needed, realistic amounts, oven temperature and times, and a complete method.
Do not invent precise nutrition: set nutrition values to null unless you are confident, and always set estimated to true. No health claims.`;
        const out = await callOpenAI(env, instructions, JSON.stringify(req2), "pantry_recipes", RECIPE_SCHEMA);
        return json({ recipes: (out.recipes || []).slice(0, req2.numberOfRecipes) }, 200, c.headers);
      }
      if (path.endsWith("/api/recipes/substitute")) {
        const instructions = `Decide whether ONE item from the pantry can genuinely replace the requested ingredient in this specific recipe, doing the same job (structure, fat, liquid, binder, sweetener, flavour). Only say possible=true if the recipe would still work. Respect the restrictions and avoided ingredients. pantryItem must be copied exactly from the pantry list.`;
        const out = await callOpenAI(env, instructions, JSON.stringify({ ingredient: body.ingredient, recipe: body.recipe, pantry: list(body.pantry), restrictions: list(body.restrictions, 20), avoidIngredients: list(body.avoidIngredients, 40) }), "pantry_substitute", SUB_SCHEMA);
        return json(out, 200, c.headers);
      }
      return json({ error: "not_found" }, 404, c.headers);
    } catch (e) {
      return json({ error: e.error || "server_error" }, e.status || 500, c.headers);
    }
  }
};
