# Smart Treats — AI recipe server

A tiny Cloudflare Worker that keeps your OpenAI key secret and turns your pantry into recipe ideas.
The app (index.html) never sees the key.

## Set up (about 10 minutes, free Cloudflare account)

1. Install Node.js, then in this `server` folder run: `npx wrangler login`
2. Edit `wrangler.toml` → set `ALLOWED_ORIGIN` to your app's address (e.g. `https://yourname.github.io`).
3. Add your key as a secret: `npx wrangler secret put OPENAI_API_KEY` (paste the key when asked).
4. Optional: choose the model with `OPENAI_MODEL` (any current OpenAI model that supports Structured Outputs).
5. Deploy: `npx wrangler deploy` — it prints an address like `https://smart-treats-ai.yourname.workers.dev`.
6. In Smart Treats → Profile → **Smart Recipe AI**, paste
   `https://smart-treats-ai.yourname.workers.dev/api/recipes/generate`

## Endpoints
- `POST /api/recipes/generate` — body: `{ pantry, restrictions, avoidIngredients, preferences, dislikes, recipeType, goal, maxMissingIngredients, numberOfRecipes }`
- `POST /api/recipes/substitute` — body: `{ ingredient, recipe, pantry, restrictions, avoidIngredients }`

Only these food fields are forwarded to OpenAI. Requests from other websites are refused (ALLOWED_ORIGIN).
Note: the address is public, so set a monthly spending limit in your OpenAI account.
