'use strict';
/* =====================================================================
   SMART TREATS — ADAPTATION SERVICE
   One interface, two engines:
     • ClaudeEngine — real AI via the artifact `sample` capability (when available)
     • RulesEngine  — built-in, rule-based fallback. Clearly labelled "not AI".
   UI code only talks to SmartService.*, so either engine can be swapped
   for a real backend later without touching screens.
   ===================================================================== */

/* ---------- nutrition reference (typical values per 100 g) ----------
   [kcal, protein, carbs, fat, fiber, sugar, gramsPerCup, gramsPerPiece]
   General reference estimates only — always labelled "Estimated".      */
const REF={
 'almond flour':[600,21,20,52,10,4.4,100],'ground almond':[600,21,20,52,10,4.4,100],
 'coconut flour':[430,20,64,14,36,7,112],
 'oat flour':[390,14,66,8,10,1,92],'oat':[380,13,67,7,10,1,90],
 'flour':[364,10,76,1,2.7,0.3,125],'wheat flour':[364,10,76,1,2.7,0.3,125],'spelt flour':[350,14,70,2.5,10,1,120],
 'gluten free flour':[360,6,80,1.5,3,0.5,140],'rice flour':[366,6,80,1.4,2.4,0.1,158],'buckwheat flour':[335,13,71,3,10,2.6,120],
 'cornstarch':[381,0.3,91,0.1,0.9,0,128],'tapioca':[358,0.2,89,0,0.9,3.4,120],
 'cocoa':[228,20,58,14,37,1.8,86],
 'coconut oil':[862,0,0,100,0,0,218],'olive oil':[884,0,0,100,0,0,216],'oil':[884,0,0,100,0,0,218],
 'butter':[717,0.9,0.1,81,0,0.1,227],'plant butter':[700,0,0,78,0,0,227],'ghee':[900,0,0,100,0,0,205],
 'maple syrup':[260,0,67,0.1,0,60,315],'honey':[304,0.3,82,0,0.2,82,340],'agave':[310,0,76,0.5,0.2,68,330],
 'sugar':[387,0,100,0,0,100,200],'brown sugar':[380,0.1,98,0,0,97,220],'coconut sugar':[375,1,94,0.5,0,90,180],'powdered sugar':[389,0,100,0,0,98,120],
 'erythritol':[20,0,100,0,0,0,200],
 'almond milk':[15,0.6,0.3,1.2,0.2,0,240],'oat milk':[46,1,6.6,1.5,0.8,4,240],'soy milk':[38,3.3,1.8,1.8,0.6,1,243],'coconut milk':[197,2,2.8,21,0,3.3,226],
 'milk':[47,3.4,4.8,1.5,0,4.8,244],'buttermilk':[40,3.3,4.8,0.9,0,4.8,245],
 'skyr':[63,11,4,0.2,0,4,245],'greek yogurt':[59,10,3.6,0.4,0,3.2,245],'yogurt':[61,3.5,4.7,3.3,0,4.7,245],'quark':[67,12,4,0.2,0,4,245],
 'cream cheese':[250,5.5,4,24,0,3.5,232],'light cream cheese':[160,7.5,6,11,0,5,232],'cottage cheese':[98,11,3.4,4.3,0,2.7,226],
 'ricotta':[174,11,3,13,0,0.3,246],'mascarpone':[429,4.8,4,44,0,4,240],'cream':[340,2.8,2.7,36,0,2.9,238],'sour cream':[198,2.4,4.6,19,0,3.4,230],'coconut cream':[330,3.6,6.6,35,2.2,3,240],
 'egg':[143,12.6,0.7,9.5,0,0.4,243,50],'egg white':[52,11,0.7,0.2,0,0.7,243,33],'egg yolk':[322,16,3.6,27,0,0.6,243,17],
 'banana':[89,1.1,23,0.3,2.6,12,225,118],'applesauce':[42,0.2,11,0.1,1.2,10,244],'pumpkin puree':[34,1.1,8,0.3,2.9,3.3,245],'zucchini':[17,1.2,3.1,0.3,1,2.5,124,200],'carrot':[41,0.9,10,0.2,2.8,4.7,110,61],
 'blueberry':[57,0.7,14,0.3,2.4,10,148],'raspberry':[52,1.2,12,0.7,6.5,4.4,123],'strawberry':[32,0.7,7.7,0.3,2,4.9,152,12],'apple':[52,0.3,14,0.2,2.4,10,125,180],'date':[282,2.5,75,0.4,8,63,147,8],'raisin':[299,3,79,0.5,3.7,59,145],'lemon juice':[22,0.4,6.9,0.2,0.3,2.5,244],'avocado':[160,2,8.5,15,6.7,0.7,150,150],
 'baking soda':[0,0,0,0,0,0,220],'baking powder':[53,0,28,0,0.2,0,192],'salt':[0,0,0,0,0,0,288],'cinnamon':[247,4,81,1.2,53,2.2,125],'vanilla':[288,0.1,13,0.1,0,13,208],'xanthan gum':[333,0,78,0,78,0,144],
 'collagen':[360,90,0,0,0,0,96],'whey protein':[400,80,8,6,0,4,96],'gelatine':[335,86,0,0,0,0,144],'gelatin':[335,86,0,0,0,0,144],
 'peanut butter':[588,25,20,50,6,9,258],'almond butter':[614,21,19,56,10,4.4,256],'sunflower seed butter':[617,17,23,55,6,10,256],'tahini':[595,17,21,54,9,0.5,240],
 'dark chocolate':[598,7.8,46,43,11,24,170],'chocolate':[598,7.8,46,43,11,24,170],'chocolate chip':[480,4,64,30,6,55,170],'milk chocolate':[535,7.6,59,30,3.4,52,170],'white chocolate':[539,5.9,59,32,0.2,59,170],
 'instant coffee':[353,12,75,0.5,0,0,96],'espresso powder':[353,12,75,0.5,0,0,96],
 'walnut':[654,15,14,65,6.7,2.6,117],'almond':[579,21,22,50,12.5,4.4,143],'pumpkin seed':[559,30,11,49,6,1.4,129],'coconut flake':[660,6.9,24,65,16,7,80],'shredded coconut':[660,6.9,24,65,16,7,80],
 'chia seed':[486,17,42,31,34,0,192],'flaxseed':[534,18,29,42,27,1.6,112],'ground flax':[534,18,29,42,27,1.6,112],
 'water':[0,0,0,0,0,0,240],'puffed rice':[383,6,86,1,1.5,10,14]
};
const REF_KEYS=Object.keys(REF).map(k=>({k,t:toks(k)})).sort((a,b)=>b.t.length-a.t.length);
function refFor(name){
  const b=toks(name); if(!b.length)return null;
  for(const r of REF_KEYS){if(r.t.every(t=>b.includes(t)))return {key:r.k,v:REF[r.k]}}
  return null;
}
const UNIT_G={g:1,gram:1,grams:1,kg:1000,oz:28.35,lb:453.6,pinch:0.4,dash:0.6};
const UNIT_CUP={cup:1,cups:1,c:1,tbsp:1/16,tablespoon:1/16,tablespoons:1/16,spsk:1/16,tsp:1/48,teaspoon:1/48,teaspoons:1/48,tsk:1/48,ml:1/240,dl:100/240,l:1000/240,cl:10/240,'fl oz':1/8};
/** first numeric value of an amount string ("20–30" → 25 midpoint) */
function amountValue(a){
  const s=String(a||'').trim(); if(!s)return null;
  const parts=s.split(/\s*(?:–|-|to)\s*/).map(p=>p.trim()).filter(Boolean).map(toNum).filter(n=>n>0);
  if(!parts.length)return null;
  return parts.length>1?(parts[0]+parts[1])/2:parts[0];
}
function gramsOf(i){
  const v=amountValue(i.amount), u=String(i.unit||'').toLowerCase().trim(), ref=refFor(i.name);
  if(v==null)return null;
  if(UNIT_G[u]!=null)return v*UNIT_G[u];
  if(UNIT_CUP[u]!=null){if(!ref||!ref.v[6])return null;return v*UNIT_CUP[u]*ref.v[6]}
  if(!u||/^(pcs?|pieces?|stk|large|medium|small|whole)$/.test(u)){if(ref&&ref.v[7])return v*ref.v[7];return null}
  return null;
}
/** nutrition for ONE ingredient at the amount used.
    status: ok | missing (needs info) | uncounted (no amount given) */
function ingNut(i){
  const n={};
  const hasManual=i.n&&NUT.some(k=>String(i.n[k]??'').trim()!=='');
  if(hasManual&&(i.nsrc==='manual'||i.nsrc==='label'||!i.nsrc)){NUT.forEach(k=>n[k]=num(i.n[k]));return {n,status:'ok',src:i.nsrc==='label'?'label':'manual'}}
  if(amountValue(i.amount)==null)return {n:null,status:'uncounted',src:null};
  const ref=refFor(i.name), g=gramsOf(i);
  if(!ref||g==null)return {n:null,status:'missing',src:null};
  NUT.forEach((k,ix)=>n[k]=ref.v[ix]*g/100);
  return {n,status:'ok',src:'reference',grams:g,key:ref.key};
}
/** calculateNutrition(ingredients, servings) */
function calculateNutrition(list,servings){
  const t={};NUT.forEach(k=>t[k]=0);
  let any=false,missing=[],uncounted=[],srcs=new Set();
  (list||[]).forEach(i=>{if(!(i.name||'').trim())return;const r=ingNut(i);
    if(r.status==='ok'){any=true;srcs.add(r.src);NUT.forEach(k=>t[k]+=r.n[k]||0)}
    else if(r.status==='missing'){if(!i.optional)missing.push(i.name)}else uncounted.push(i.name)});
  const s=Math.max(1,Math.round(num(servings))||1), per={};NUT.forEach(k=>per[k]=t[k]/s);
  return {total:t,per,servings:s,any,complete:any&&!missing.length,missing,uncounted,
    source:srcs.size===1&&srcs.has('label')?'label':'estimated',sources:[...srcs]};
}
/** compareNutrition(a,b) per serving; only when both complete */
function compareNutrition(a,b){
  if(!a||!b||!a.complete||!b.complete)return null;
  const o={};NUT.forEach(k=>{const d=b.per[k]-a.per[k];o[k]={orig:a.per[k],mine:b.per[k],diff:d,pct:a.per[k]?d/a.per[k]*100:null}});
  return o;
}

/* ---------- requirements knowledge ---------- */
const has=(name,...words)=>words.some(w=>matchTerm(w,name));
const PLANT_MILK=['almond milk','oat milk','soy milk','coconut milk','rice milk','cashew milk','plant milk','hemp milk'];
/** returns {status:'ok'|'violates'|'unsure', note} for one ingredient and one requirement */
function checkIngredient(name,req){
  const n=String(name||'').toLowerCase(), lf=/lactose[- ]?free/.test(n), gf=/gluten[- ]?free|certified/.test(n), df=/dairy[- ]?free|vegan|plant/.test(n);
  const plantMilk=PLANT_MILK.some(p=>matchTerm(p,n));
  switch(req){
  case 'Gluten Free':
    if(gf&&!/wheat/.test(n))return ok();
    if(/\b(wheat|spelt|rye|barley|semolina|couscous|bulgur|malt|breadcrumbs?|graham|digestive|biscuits?|cookie crumbs|pasta|seitan)\b/.test(n))return bad('contains gluten grains');
    if(/\bflour\b/.test(n)&&!/(almond|coconut|rice|buckwheat|tapioca|potato|corn|chickpea|oat|sorghum|millet|teff|quinoa|cassava|banana|sunflower|hazelnut)/.test(n))return bad('regular flour contains gluten');
    if(/\boats?\b|oat flour|oatmeal/.test(n))return unsure('oats are often cross-contaminated unless certified gluten-free');
    if(/baking powder/.test(n))return unsure('some baking powders contain wheat starch');
    if(/soy sauce/.test(n))return bad('soy sauce usually contains wheat');
    return ok();
  case 'Lactose Free':
    if(lf||df||plantMilk)return ok();
    if(/peanut butter|almond butter|nut butter|seed butter|cocoa butter|apple butter/.test(n))return ok();
    if(/\b(milk|butter|cream|cheese|yogh?urt|skyr|quark|ricotta|mascarpone|whey|buttermilk|condensed|kefir)\b/.test(n)&&!/coconut/.test(n))return bad('regular dairy contains lactose');
    if(/milk chocolate|white chocolate/.test(n))return bad('contains milk');
    if(/chocolate/.test(n))return unsure('chocolate may contain milk; check the label');
    if(/ghee/.test(n))return unsure('ghee is very low in lactose but not always lactose free');
    return ok();
  case 'Dairy Free':
    if(df||plantMilk)return ok();
    if(/peanut butter|almond butter|nut butter|seed butter|cocoa butter|apple butter|coconut cream/.test(n))return ok();
    if(/\b(milk|butter|cream|cheese|yogh?urt|skyr|quark|ricotta|mascarpone|whey|casein|buttermilk|condensed|kefir|ghee)\b/.test(n)&&!/coconut/.test(n))return bad(lf?'lactose-free dairy is still dairy':'dairy ingredient');
    if(/milk chocolate|white chocolate/.test(n))return bad('contains milk');
    if(/chocolate/.test(n))return unsure('chocolate may contain milk; check the label');
    return ok();
  case 'Nut Free':
    if(/\b(almonds?|walnuts?|pecans?|hazelnuts?|cashews?|pistachios?|macadamias?|peanuts?|brazil nuts?|pine nuts?|praline|marzipan|nutella|nut butter|nuts)\b/.test(n))return bad('nut ingredient');
    if(/coconut/.test(n))return unsure('coconut is classed as a tree nut in some countries');
    return ok();
  case 'Soy Free':
    if(/\b(soy|soya|tofu|edamame|tempeh|miso|soy lecithin)\b/.test(n))return bad('soy ingredient');
    if(/chocolate/.test(n))return unsure('chocolate often contains soy lecithin');
    return ok();
  case 'Egg Free':
    if(/\b(eggs?|egg whites?|egg yolks?|yolks?|mayonnaise|meringue)\b/.test(n))return bad('egg ingredient');
    return ok();
  default:{
    const term=req.replace(/[- ]?free$/i,'').replace(/^no\s+/i,'').trim();
    if(term&&matchTerm(term,n))return bad('matches '+req);
    return term?ok():unsure('');
  }}
  function ok(){return {status:'ok'}} function bad(note){return {status:'violates',note}} function unsure(note){return {status:'unsure',note}}
}
/** checkRequirements(ingredients, requirements, avoidList) */
function checkRequirements(list,reqs,avoid=[]){
  const out=reqs.map(req=>{
    const bad=[],uns=[];
    (list||[]).forEach(i=>{if(!(i.name||'').trim())return;const c=checkIngredient(i.name,req);if(c.status==='violates')bad.push({name:i.name,note:c.note});else if(c.status==='unsure')uns.push({name:i.name,note:c.note})});
    const status=bad.length?'not_met':uns.length?'cannot_confirm':'met';
    const detail=bad.length?bad.map(b=>`${b.name}: ${b.note}`).join('; '):uns.length?uns.map(u=>`${u.name}${u.note?': '+u.note:''}`).join('; '):'No conflicting ingredients found by name.';
    return {requirement:req,status,detail,ingredients:(bad.length?bad:uns).map(x=>x.name)};
  });
  if(avoid.length){
    const hits=(list||[]).filter(i=>avoid.some(a=>matchTerm(a,i.name))).map(i=>i.name);
    out.push({requirement:'My Avoid list',status:hits.length?'not_met':'met',detail:hits.length?'Contains ingredients you marked Avoid.':'None of your Avoid ingredients are in this recipe.',ingredients:hits});
  }
  return out;
}

/* ---------- ingredient functions ---------- */
function identifyIngredientFunctions(list){
  return (list||[]).map(i=>{
    const n=(i.name||'').toLowerCase(), f=[];
    if(/flour|oats?\b|starch|almond meal|ground almond|breadcrumb|biscuit|cookie|puffed rice/.test(n))f.push('structure');
    if(/oil|butter|ghee|cream\b|mascarpone|cream cheese|coconut milk|nut butter|peanut butter|almond butter|avocado|chocolate/.test(n))f.push('fat');
    if(/sugar|syrup|honey|agave|sweetener|erythritol|stevia|monk|dates?\b|banana|maple/.test(n))f.push('sweetener');
    if(/milk|water|juice|coffee|espresso(?! powder)|applesauce|puree/.test(n))f.push('liquid');
    if(/\beggs?\b|flax|chia|gelatin|gelatine|banana|xanthan|psyllium|applesauce/.test(n))f.push('binder');
    if(/baking soda|baking powder|yeast|bicarbonate/.test(n))f.push('leavening');
    if(/vanilla|cinnamon|salt|spice|cocoa|coffee|espresso|zest|extract|nutmeg|ginger|cardamom/.test(n))f.push('flavor');
    if(/collagen|protein|whey|skyr|greek yogurt|quark|cottage|egg white/.test(n))f.push('protein');
    if(/cornstarch|gelatin|gelatine|xanthan|chia|tapioca/.test(n))f.push('thickener');
    if(/berr|chips|sprinkle|frosting|glaze|topping|nuts?\b|coconut flake/.test(n))f.push('topping');
    if(/lemon|vinegar|buttermilk|yogh?urt|skyr/.test(n))f.push('acid');
    if(/egg yolk|lecithin|\beggs?\b/.test(n))f.push('emulsifier');
    return {id:i.id,name:i.name,functions:[...new Set(f)]};
  });
}

/* ---------- local recipe reader (rules) ---------- */
const NOISE_HEADERS=/^(original|recipe|ingredients?|you(?:'|’)ll need|what you need)\s*:?$/i;
const METHOD_HEADERS=/^(method|instructions?|directions?|steps?|preparation|how to make( it)?)\s*:?$/i;
function looksLikeIngredient(l){return /^([-•*·]\s*)?(\d|½|¼|¾|⅓|⅔|a\s+(pinch|cup|handful)|pinch|dash|handful)/i.test(l)&&l.length<90&&!/^\d+[.)]\s+[A-Z][a-z]+\s+\w+\s+\w+/.test(l)}
function analyzeRecipeLocal(text){
  const raw=String(text||'').split(/\r?\n/).map(s=>s.trim());
  const L=raw.filter(Boolean);
  const out={name:'',description:'',servings:null,servingsNote:'',tempText:'',prepTime:'',cookTime:'',ingredients:[],instructions:[],storage:'',freezer:null,notes:''};
  let zone='start',group='';
  L.forEach((l,ix)=>{
    const sv=l.match(/\b(serves|servings?|makes|yield|portions?)\b\s*:?\s*(\d+)(?:\s*(?:–|-|to)\s*(\d+))?/i);
    if(sv&&!out.servings){out.servings=+sv[2];if(sv[3])out.servingsNote=`Recipe says ${sv[2]}–${sv[3]}.`;if(l.length<40)return}
    const pt=l.match(/prep(?:aration)?\s*time\s*:?\s*([^,;]+)/i); if(pt){out.prepTime=pt[1].trim();return}
    const ct=l.match(/(cook|bake|baking)\s*time\s*:?\s*([^,;]+)/i); if(ct){out.cookTime=ct[2].trim();return}
    if(NOISE_HEADERS.test(l)){if(/ingredient|need/i.test(l))zone='ing';return}
    if(METHOD_HEADERS.test(l)){zone='method';return}
    if(/^(requirements?|notes?|tips?)\s*:?$/i.test(l)){zone='skip';return}
    if(zone==='skip')return;
    if(/^[^.]{2,40}:$/.test(l)&&zone!=='method'){group=l.replace(/:$/,'').replace(/^for the\s+/i,'');group=group.charAt(0).toUpperCase()+group.slice(1);zone='ing';return}
    if(!out.name&&zone==='start'&&!looksLikeIngredient(l)&&l.length<70){out.name=l.replace(/^#+\s*/,'');return}
    if(zone==='start'&&!looksLikeIngredient(l)&&l.length>=70&&!out.description){out.description=l;return}
    if(zone!=='method'&&looksLikeIngredient(l)){const p=parseLine(l);if(p){out.ingredients.push({id:uid(),group,optional:/optional/i.test(l),...p});zone='ing'}return}
    if(zone==='ing'&&l.length<60&&!/[.!]$/.test(l)&&!/^\d+[.)]/.test(l)){const p=parseLine(l);if(p)out.ingredients.push({id:uid(),group,optional:/optional/i.test(l),...p});return}
    if(zone==='method'||/^\d+[.)]\s+/.test(l)||l.length>=40){zone='method';out.instructions.push(l.replace(/^\d+[.)]\s*/,''));return}
  });
  const all=L.join(' ');
  const t=all.match(/(\d{3})\s*°?\s*([CF])\b/); if(t)out.tempText=`${t[1]}°${t[2].toUpperCase()}`;
  if(!out.cookTime){const m=out.instructions.join(' ').match(/(\d+)\s*(?:(?:–|-|to)\s*(\d+)\s*)?min/i);if(m)out.cookTime=m[2]?`${m[1]}–${m[2]} min`:`${m[1]} min`}
  if(!out.servings){
    const nm=(out.name||'').toLowerCase();
    if(/muffin|cupcake/.test(nm)){out.servings=12;out.servingsNote='Servings not stated. A standard muffin tin holds 12 — please check.'}
    else out.servingsNote='Servings not stated — please add.';
  }
  return out;
}

/* ---------- local collagen evaluation ---------- */
function evaluateCollagenLocal(rec){
  const names=(rec.ingredients||[]).map(i=>i.name.toLowerCase()).join(' | '), nm=(rec.name||'').toLowerCase();
  if(!rec.ingredients||!rec.ingredients.length)return {verdict:'unknown',reason:'There are no ingredients to judge yet.'};
  if(/collagen/.test(names))return {verdict:'yes',amount:'Already included',where:'As written in the recipe',reduce:'',liquid:'',texture:'',reason:'This recipe already contains collagen.'};
  if(/meringue|pavlova|macaron|souffl/.test(nm)||(/egg white/.test(names)&&/whip/.test(nm)))return {verdict:'no',reason:'Whipped egg-white desserts depend on a delicate foam; collagen can weigh it down.'};
  if(/jelly|panna cotta|mousse/.test(nm))return {verdict:'yes_adjust',amount:'10–15 g',where:'Dissolve in the warm liquid',reduce:'',liquid:'',texture:'Can make the set slightly firmer.',reason:'Dissolves into warm liquids, but may change how it sets.'};
  const batter=/muffin|cake|brownie|cookie|pancake|loaf|bread|waffle|blondie|bar/.test(nm)||/flour|oats?\b/.test(names);
  const structure=(rec.ingredients||[]).filter(i=>/flour|oats?\b|ground almond/.test(i.name.toLowerCase()));
  const dryG=structure.reduce((a,i)=>a+(gramsOf(i)||0),0);
  if(batter){
    const amt=dryG?Math.max(10,Math.min(30,Math.round(dryG*0.08/5)*5)):20;
    return {verdict:'yes_adjust',amount:`${amt} g collagen peptides`,where:'Whisk into the dry ingredients',reduce:'Keep the flour as it is — collagen does not replace flour.',liquid:'Add about 1–2 tbsp extra liquid',texture:'Collagen can make baked batters a little firmer and drier.',reason:'Works well in batters with a small liquid adjustment.',grams:amt};
  }
  if(/cheesecake|no.bake|skyr|yogurt|cream cheese|pudding|truffle|ball/.test(nm+' '+names))
    return {verdict:'yes',amount:'15–20 g collagen peptides',where:'Whisk into the creamy filling',reduce:'',liquid:'',texture:'Usually blends smoothly into creamy mixtures.',reason:'Creamy, no-bake mixtures take collagen easily.',grams:20};
  return {verdict:'unknown',reason:"My Kitchen can't tell enough about this recipe's texture to say."};
}

/* ---------- local adaptation (rules) ---------- */
const NICE=[0,1/4,1/3,1/2,2/3,3/4];
const cupStr=cups=>{ // express a cup amount in clean cup / tbsp / tsp
  const w=Math.floor(cups),f=cups-w,near=NICE.concat([1]).some(x=>Math.abs(f-x)<0.03);
  if(cups>=0.25&&(near||cups>=0.5))return {amount:fmtQty(cups),unit:cups>1?'cups':'cup'};
  const tb=cups*16; if(tb>=1)return {amount:fmtQty(roundTo(tb,.5)),unit:'tbsp'};
  return {amount:fmtQty(roundTo(cups*48,.25)),unit:'tsp'};
};
function roundTo(v,s){return Math.round(v/s)*s}
function fmtAmountLike(orig,factor){ // scale an ingredient amount, preferring sensible units
  const u=String(orig.unit||'').toLowerCase(), v=amountValue(orig.amount);
  if(v==null)return {amount:orig.amount,unit:orig.unit};
  const nv=v*factor;
  if(UNIT_CUP[u]!=null&&!['ml','dl','l','cl'].includes(u)){return cupStr(nv*UNIT_CUP[u])}
  if(UNIT_G[u]!=null)return {amount:String(Math.max(1,Math.round(nv))),unit:u};
  return {amount:fmtQty(nv),unit:orig.unit};
}
const lineOf=i=>[i.amount,i.unit,i.name].filter(Boolean).join(' ');
function rulesAdapt(orig,needs,profile){
  const reqs=needs.reqs, goals=needs.goals, close=needs.keepClose;
  const ings=clone(orig.ingredients).map(i=>({...i,id:uid()}));
  let instructions=[...orig.instructions];
  const changes=[], notes=[];
  const gfOn=reqs.includes('Gluten Free'), nfOn=reqs.includes('Nut Free'), dfOn=reqs.includes('Dairy Free'), lfOn=reqs.includes('Lactose Free'), sfOn=reqs.includes('Soy Free'), efOn=reqs.includes('Egg Free');
  const want=g=>goals.includes(g);
  const lowerCal=want('Lower Calories')||want('Lower Calorie Per Portion'), lowerFat=want('Lower Fat'), lowerSugar=want('Lower Sugar')||want('Lower Carbs'), protein=want('Higher Protein')||want('More Filling'), fiber=want('Higher Fiber')||want('More Filling');
  const renameInSteps=(from,to)=>{const re=new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig');instructions=instructions.map(s=>s.replace(re,to))};
  const change=(i,before,repl,why,conf,related)=>changes.push({id:uid(),ingredient:cap(i.name),original:before,replacement:repl,why,confidence:conf,related:related||''});
  const oatFlourName=gfOn?'certified gluten-free oat flour':'oat flour';
  const plantMilk=nfOn?(gfOn?'certified gluten-free oat milk':'oat milk'):'unsweetened almond milk';

  /* 1 — requirements first (never sacrificed) */
  for(const i of ings){
    const before=lineOf(i), n=i.name.toLowerCase();
    for(const req of reqs){
      const c=checkIngredient(i.name,req); if(c.status!=='violates')continue;
      let to=null,why='',conf='high';
      if(req==='Gluten Free'){
        if(/flour/.test(n)){to='gluten-free flour blend (with xanthan gum)';why='Replaces wheat flour weight-for-weight; a blend with xanthan gum keeps the crumb together.';conf='medium'}
        else if(/breadcrumb|biscuit|graham|digestive|cookie/.test(n)){to='gluten-free biscuits';why='Same crunchy role without gluten.';conf='high'}
      }else if(req==='Lactose Free'){
        to=n.includes('chocolate')?'dark chocolate (check the label for milk)':'lactose-free '+i.name.replace(/^(regular|whole|full[- ]fat)\s+/i,'');why='Keeps the same texture and flavour while removing lactose.';conf=/chocolate/.test(n)?'medium':'high';
      }else if(req==='Dairy Free'){
        if(/milk/.test(n)&&!/chocolate/.test(n)){to=plantMilk;why='A plant milk does the same liquid job.'}
        else if(/butter|ghee/.test(n)){to='plant-based butter block';why='Behaves most like butter in baking.';conf='medium'}
        else if(/cream cheese/.test(n)){to='dairy-free cream cheese';why='Closest match for a creamy, tangy base. Sets softer in cheesecakes.';conf='experimental'}
        else if(/yogh?urt|skyr|quark/.test(n)){to=sfOn?'thick coconut yogurt':'thick soy yogurt';why='Keeps a thick, tangy texture.';conf='medium'}
        else if(/cream/.test(n)){to='coconut cream';why='Rich and thick like dairy cream; adds a light coconut flavour.';conf='medium'}
        else if(/chocolate/.test(n)){to='dairy-free dark chocolate';why='Same melting role without milk.';conf='medium'}
        else if(/cheese/.test(n)){to='dairy-free cheese alternative';why='Closest available swap; texture varies by brand.';conf='experimental'}
      }else if(req==='Nut Free'){
        if(/almond flour|ground almond|almond meal/.test(n)){const f=fmtAmountLike(i,0.75);to=`${f.amount} ${f.unit} ${oatFlourName}`.trim();i._full=true;why='Oat flour gives structure without nuts. It absorbs more liquid than almond flour, so less is used.';conf='medium'}
        else if(/milk/.test(n)){to=plantMilk;why='Nut-free plant milk with the same liquid role.'}
        else if(/butter/.test(n)){to='sunflower seed butter';why='Same creamy, rich role without nuts.'}
        else{to='pumpkin seeds';why='Gives crunch without nuts.';conf='medium'}
      }else if(req==='Soy Free'){
        if(/milk/.test(n)){to=plantMilk;why='Soy-free milk with the same liquid role.'}
        else if(/yogh?urt/.test(n)){to='thick coconut yogurt';why='Soy-free and thick.';conf='medium'}
      }else if(req==='Egg Free'&&/egg/.test(n)){
        const cnt=amountValue(i.amount)||1;to=`${fmtQty(cnt)} flax eggs (${fmtQty(cnt)} tbsp ground flaxseed + ${fmtQty(cnt*3)} tbsp water, rested 5 min)`;i._full=true;why='Flax eggs bind; they give less lift than eggs, so the crumb will be denser.';conf=cnt>=3?'experimental':'medium';
      }
      if(to){
        const oldName=i.name;
        if(i._full){const p=parseLine(to)||{amount:'',unit:'',name:to};Object.assign(i,{amount:p.amount,unit:p.unit,name:p.name})}else i.name=to;
        delete i._full; renameInSteps(oldName,i.name.replace(/\s*\(.*\)$/,''));
        change(i,before,lineOf(i),why+` Needed for ${req}.`,conf);
      }
    }
  }
  /* GF "cannot confirm" fixes that are simple */
  if(gfOn)for(const i of ings){const n=i.name.toLowerCase();
    if(/\boats?\b|oat flour/.test(n)&&!/certified|gluten[- ]free/.test(n)){const b=lineOf(i);i.name='certified gluten-free '+i.name;change(i,b,lineOf(i),'Regular oats are often cross-contaminated with gluten. Certified ones remove that doubt.','high')}
    if(/baking powder/.test(n)&&!/gluten[- ]free/.test(n)){const b=lineOf(i);i.name='gluten-free baking powder';change(i,b,lineOf(i),'Some baking powders contain wheat starch.','high')}}
  /* Avoid list */
  const avoid=profile.avoid||[];
  for(const i of ings){if(avoid.some(a=>matchTerm(a,i.name)))notes.push(`“${i.name}” is on your Avoid list. My Kitchen' built-in rules don't have a reliable swap for it — choose a replacement in “Edit it myself”.`)}

  /* 2 — goals (only change what helps) */
  const liquidIng=()=>ings.find(i=>/milk|water/.test(i.name.toLowerCase())&&!/chocolate|powder/.test(i.name.toLowerCase()));
  // fat → part fat + fruit puree
  if(lowerFat||lowerCal){
    for(const i of ings){
      const n=i.name.toLowerCase(); if(!/\b(oil|butter)\b/.test(n)||/\b(peanut|almond|seeds?|nut|cocoa|apple)\b/.test(n))continue;
      const g=gramsOf(i); if(!g||g<25)continue;
      const keep=close?0.6:0.4, before=lineOf(i);
      const kept=fmtAmountLike(i,keep);
      const removedCups=(UNIT_CUP[String(i.unit).toLowerCase()]?amountValue(i.amount)*UNIT_CUP[String(i.unit).toLowerCase()]:g/218)*(1-keep);
      const puree=cupStr(removedCups);
      const pureeName=/pumpkin|carrot|spice|cinnamon/.test(ings.map(x=>x.name).join(' ').toLowerCase())&&!/apple/.test(orig.name.toLowerCase())?'unsweetened applesauce':'unsweetened applesauce';
      i.amount=kept.amount;i.unit=kept.unit;
      const add={id:uid(),group:i.group,amount:puree.amount,unit:puree.unit,name:pureeName,optional:false};
      ings.splice(ings.indexOf(i)+1,0,add);
      renameInSteps(i.name,`${i.name} and applesauce`);
      change(i,before,`${lineOf(i)} + ${lineOf(add)}`,'Reduces fat and calories while the applesauce keeps the crumb moist.',/cookie|crisp|crust|shortbread/.test(orig.name.toLowerCase())?'experimental':'high','Bake time may run 1–3 minutes longer; check with a toothpick.');
      break;
    }
  }
  // part of almond flour → oat flour (lower calories/fat), only if nut flour present and nut-free didn't already handle it
  if((lowerCal||lowerFat)&&!close){
    const af=ings.find(i=>/almond flour|ground almond|almond meal/.test(i.name.toLowerCase()));
    if(af&&gramsOf(af)>=80){
      const before=lineOf(af), part=fmtAmountLike(af,2/3), oat=fmtAmountLike(af,1/3*0.9);
      af.amount=part.amount;af.unit=part.unit;
      const add={id:uid(),group:af.group,amount:oat.amount,unit:oat.unit,name:oatFlourName,optional:false};
      ings.splice(ings.indexOf(af)+1,0,add);
      renameInSteps('almond flour','almond flour, oat flour');
      change(af,before,`${lineOf(af)} + ${lineOf(add)}`,'Almond flour is very high in fat. Swapping a third for oat flour lowers calories and fat while keeping the structure. Oat flour absorbs more liquid, so slightly less is used.','medium','If the batter looks stiff, add 1 tbsp more liquid.');
    }
  }
  // sweetener reduction
  if(lowerSugar||lowerCal){
    const sw=ings.find(i=>/maple syrup|honey|agave|\bsugar\b|syrup/.test(i.name.toLowerCase())&&!/free|erythritol|powdered/.test(i.name.toLowerCase()));
    if(sw&&gramsOf(sw)>=20){
      const liquidSw=/syrup|honey|agave/.test(sw.name.toLowerCase()), before=lineOf(sw), f=close?0.75:(lowerSugar?0.5:0.65);
      const nw=fmtAmountLike(sw,f); sw.amount=nw.amount; sw.unit=nw.unit;
      let related='Expect lighter browning and a slightly less sweet result. Taste the batter and add a little granulated sweetener if you like.';
      if(liquidSw){const lq=liquidIng();if(lq)related+=` The collagen/liquid step below keeps moisture up; if you skip collagen, add 1–2 tbsp extra ${lq.name}.`}
      change(sw,before,lineOf(sw),liquidSw?'Cuts sugar and calories. Syrup is also a liquid, so the batter gets a little extra liquid to stay moist.':'Cuts sugar and calories. Sugar also adds moisture and tenderness, so the texture may be slightly firmer.','medium',related);
    }
  }
  // collagen
  const col=evaluateCollagenLocal({name:orig.name,ingredients:ings});
  if((want('Collagen Friendly')||protein)&&(col.verdict==='yes'||col.verdict==='yes_adjust')&&col.grams&&!ings.some(i=>/collagen/.test(i.name.toLowerCase()))){
    let lastDry=-1;ings.forEach((i,ix)=>{if(/flour|oats?\b/.test(i.name.toLowerCase()))lastDry=ix});
    const add={id:uid(),group:lastDry>=0?ings[lastDry].group:'',amount:String(col.grams),unit:'g',name:'collagen peptides',optional:false};
    ings.splice(lastDry>=0?lastDry+1:ings.length,0,add);
    if(col.verdict==='yes_adjust'){const lq=liquidIng();if(lq){const b=lineOf(lq);const v=amountValue(lq.amount),u=String(lq.unit).toLowerCase();if(v!=null&&UNIT_CUP[u]!=null){const cups=v*UNIT_CUP[u]+1.5/16;const c=cupStr(cups);lq.amount=c.amount;lq.unit=c.unit}change(lq,b,lineOf(lq),'About 1½ tbsp extra liquid offsets the firming effect of the collagen.','medium')}}
    changes.push({id:uid(),ingredient:'Collagen peptides',original:'—',replacement:lineOf(add),why:'Adds protein. Collagen is not a flour replacement, so the flour stays.'+(col.verdict==='yes_adjust'?' The batter gets a little extra liquid.':''),confidence:col.verdict==='yes'?'high':'medium',related:col.texture||''});
    const di=instructions.findIndex(x=>/dry|flour/i.test(x));
    if(di>=0)instructions[di]+=' Whisk the collagen in with the dry ingredients.';
  }
  // fiber
  if(fiber&&!ings.some(i=>/flax|chia/.test(i.name.toLowerCase()))&&/flour|oats?\b/.test(ings.map(i=>i.name).join(' ').toLowerCase())){
    const add={id:uid(),group:'',amount:'2',unit:'tbsp',name:'ground flaxseed',optional:false};ings.push(add);
    changes.push({id:uid(),ingredient:'Ground flaxseed',original:'—',replacement:lineOf(add),why:'Adds fiber with little effect on flavour. It soaks up liquid, so let the batter rest 5 minutes before baking.',confidence:'medium',related:''});
  }
  // portion
  let servings=num(orig.servings)||null;
  if(want('Lower Calorie Per Portion')&&servings){
    const ns=Math.round(servings*1.25);
    changes.push({id:uid(),ingredient:'Portion size',original:`${servings} servings`,replacement:`${ns} smaller servings`,why:'Same recipe, smaller portions. Fill each tin or slice a little less.',confidence:'high',related:'Smaller portions bake faster — check 2–4 minutes early.'});
    servings=ns;
  }
  if(want('Higher Volume')){
    if(/muffin|cake|loaf|brownie|bread/.test(orig.name.toLowerCase())&&!ings.some(i=>/zucchini/.test(i.name.toLowerCase()))){
      const add={id:uid(),group:'',amount:'100',unit:'g',name:'zucchini, finely grated and squeezed dry',optional:false};ings.push(add);
      changes.push({id:uid(),ingredient:'Zucchini',original:'—',replacement:lineOf(add),why:'Adds volume and moisture for very few calories. The flavour disappears into the batter.',confidence:'experimental',related:'Squeeze it very dry, or the crumb can turn gummy.'});
    }else notes.push("Built-in rules don't have a good volume trick for this recipe.");
  }
  let tempText=orig.tempText||'', methodNote='';
  if(!orig.instructions.length){const t=methodTemplate(orig.name,ings);if(t){instructions=t.steps;tempText=tempText||t.temp;methodNote='The original had no method, so built-in rules added a standard one for this kind of bake. Check it against your source.'}
    else{instructions=['The original recipe had no method. Add your steps with “Edit it myself”.'];}}
  if(methodNote)notes.unshift(methodNote);
  if(orig.instructions.length&&ings.some(i=>/collagen/.test(i.name.toLowerCase()))&&!instructions.some(x=>/collagen/i.test(x)))instructions.unshift('Whisk the collagen peptides into the dry ingredients.');
  const tags=[];
  return {name:smartName(orig.name),description:orig.description||'',servings,prepTime:orig.prepTime||'',cookTime:orig.cookTime||(methodNote?templateTime(orig.name):''),tempText,
    ingredients:ings,instructions,
    storage:storageGuess(orig),freezer:freezerGuess(orig),changes,collagen:col,notes:notes.join(' '),tags,engine:'rules'};
}
function methodTemplate(name,ings){
  const n=(name||'').toLowerCase(), L=ings.map(i=>i.name.toLowerCase()).join(' ');
  const has=w=>L.includes(w), collagen=has('collagen'), flax=has('flax'), berries=/berr|chip|raisin|nut/.test(L), apple=has('applesauce');
  if(/muffin|cupcake/.test(n))return {temp:'175°C / 350°F',steps:[
    'Heat the oven to 175°C / 350°F and line a 12-hole muffin tin.',
    `Whisk the dry ingredients together${collagen?', including the collagen':''}${flax?' and flaxseed':''}.`,
    `In another bowl whisk the eggs with the wet ingredients (${apple?'oil, applesauce, ':''}sweetener, milk and vanilla).`,
    'Stir the wet into the dry until just combined. Let the batter rest 5 minutes — coconut and oat flour thicken as they absorb liquid.',
    berries?'Gently fold in the berries.':'Give the batter a final gentle stir.',
    'Divide between the cases and bake 20–25 minutes, until golden and a toothpick comes out clean.',
    'Cool in the tin for 10 minutes, then on a rack.']};
  if(/cake|loaf|brownie|blondie|bread/.test(n))return {temp:'175°C / 350°F',steps:[
    'Heat the oven to 175°C / 350°F and line your tin.','Whisk the dry ingredients together.','Whisk the wet ingredients together, then stir into the dry until just combined.',
    berries?'Fold in any fruit, chips or nuts.':'Scrape the batter into the tin and smooth the top.','Bake until a toothpick comes out clean — start checking at 20 minutes for brownies, 35 for loaves.','Cool before slicing.']};
  return null;
}
function templateTime(name){const n=(name||'').toLowerCase();return /muffin|cupcake/.test(n)?'20–25 min':/cake|loaf|brownie/.test(n)?'20–45 min':''}
function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1)}
function smartName(n){n=String(n||'My treat').replace(/^(healthy|healthier|easy|best|the best|simple)\s+/i,'');return /^my\b/i.test(n)?n:'My '+n}
function storageGuess(o){const n=(o.name||'').toLowerCase()+' '+(o.ingredients||[]).map(i=>i.name).join(' ').toLowerCase();
  if(/cheesecake|cream cheese|skyr|yogurt|mousse|custard|pudding/.test(n))return 'Keep covered in the fridge. Best within about 3 days.';
  if(/muffin|cake|brownie|loaf|cookie|bar/.test(n))return 'Airtight container: about 2 days at room temperature, or up to 4 days in the fridge.';
  return '';}
function freezerGuess(o){const n=(o.name||'').toLowerCase();if(/muffin|brownie|cookie|loaf|cheesecake|truffle|ball|bar|pancake/.test(n))return true;if(/mousse|meringue|jelly|panna/.test(n))return false;return null}

/* ---------- local revision from test feedback ---------- */
function rulesRevise(rec,test){
  const ings=clone(rec.adaptedIngredients).map(i=>({...i,id:uid()}));
  let instructions=[...rec.adaptedInstructions];
  const changes=[];const L=s=>s.toLowerCase();
  const liquid=ings.find(i=>/milk|water/.test(L(i.name))&&!/powder|chocolate/.test(L(i.name)))||ings.find(i=>/applesauce|puree|yogh?urt/.test(L(i.name)));
  const flour=ings.find(i=>/flour|oats?\b/.test(L(i.name)));
  const sweet=ings.find(i=>/syrup|honey|sugar|sweetener/.test(L(i.name))&&amountValue(i.amount)!=null);
  const lev=ings.find(i=>/baking powder|baking soda/.test(L(i.name)));
  const bump=(i,f,why,conf,related)=>{const b=lineOf(i);const a=fmtAmountLike(i,f);i.amount=a.amount;i.unit=a.unit;changes.push({id:uid(),ingredient:cap(i.name),original:b,replacement:lineOf(i),why,confidence:conf,related:related||''})};
  const t=test.textureIssue;
  if(t==='dry'){
    if(liquid)bump(liquid,1.2,'You said it was too dry. More liquid is the most direct fix.','medium','Check doneness 2 minutes earlier — overbaking also dries things out.');
    else if(flour)bump(flour,0.9,'You said it was too dry. Less flour leaves more moisture in the crumb.','medium');
    else changes.push({id:uid(),ingredient:'Baking time',original:rec.cookTime||'as written',replacement:'2–3 minutes shorter',why:'You said it was too dry; a shorter bake keeps more moisture.',confidence:'medium',related:''});
  }else if(t==='wet'){
    if(flour)bump(flour,1.1,'You said it was too wet. A little more flour absorbs the extra moisture.','medium','Bake 2–3 minutes longer if the middle is still damp.');
    else if(liquid)bump(liquid,0.85,'You said it was too wet. Less liquid firms it up.','medium');
  }else if(t==='dense'){
    if(lev)bump(lev,1.25,'You said it was dense. A little more leavening gives more lift.','experimental','Mix wet and dry only until just combined — overmixing also makes it dense.');
    else changes.push({id:uid(),ingredient:'Mixing',original:'as written',replacement:'Fold gently until just combined',why:'You said it was dense. Gentle mixing keeps air in the batter.',confidence:'medium',related:''});
  }else if(t==='soft'){
    if(/no.bake|cheesecake|chill|freeze|refrigerat/i.test(instructions.join(' ')))changes.push({id:uid(),ingredient:'Chilling time',original:'as written',replacement:'Chill at least 2 hours longer',why:'You said it was too soft. More time to set is the gentlest fix.',confidence:'medium',related:''});
    else if(flour)bump(flour,1.08,'You said it was too soft. A little more flour gives more structure.','medium','Or bake 2–3 minutes longer.');
  }
  if(test.sweetness==='little'&&sweet)bump(sweet,1.2,'You said it needed more sweetness.','high');
  if(test.sweetness==='much'&&sweet)bump(sweet,0.8,'You said it was too sweet.','high');
  if(test.tolerated==='no'||test.tolerated==='unsure'){
    const notGood=ings.filter(i=>{const tl=tolFor(i.name);return !tl||tl.status!=='good'}).map(i=>i.name);
    changes.push({id:uid(),ingredient:'How it sat with you',original:test.tolerated==='no'?"You noted your body didn't tolerate it":"You weren't sure how it sat with you",replacement:'Change one ingredient at a time',why:`My Kitchen can't tell why. Ingredients not yet marked Known good: ${notGood.slice(0,6).join(', ')||'none'}. Testing one change at a time makes it easier to see what matters.`,confidence:'experimental',related:''});
  }
  if(!changes.length)changes.push({id:uid(),ingredient:'No changes',original:'',replacement:'Keep this version',why:'Your feedback didn\'t point to a specific fix. Add notes about what to change and try again.',confidence:'high',related:''});
  return {summary:'Based on your last test.',ingredients:ings,instructions,changes,engine:'rules'};
}

/* =====================================================================
   ENGINES
   ===================================================================== */
const RulesEngine={
  id:'rules', label:'Built-in rules', long:'Built-in rules (not AI)',
  async analyzeRecipe({text}){return analyzeRecipeLocal(text)},
  async generateAdaptation(orig,needs,profile){return rulesAdapt(orig,needs,profile)},
  async reviseFromTestFeedback(rec,test){return rulesRevise(rec,test)},
  canReadImages:async()=>false
};

let _sample=null,_sampleTried=false;
async function getSample(){
  if(_sampleTried)return _sample; _sampleTried=true;
  try{if(window.claude&&typeof window.claude.use==='function')_sample=await window.claude.use('sample')}catch(e){_sample=null}
  return _sample;
}
function dataURLtoBlob(d){const [h,b]=d.split(',');const m=h.match(/:(.*?);/)[1];const bin=atob(b);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:m})}
const RECIPE_SHAPE=`{"name":string,"description":string,"servings":number|null,"servingsNote":string,"prepTime":string,"cookTime":string,"temperature":string,"ingredients":[{"group":string,"amount":string,"unit":string,"name":string,"optional":boolean}],"instructions":[string],"storage":string,"freezerFriendly":true|false|null}`;
function normRecipe(j){
  const r=j||{};
  return {name:String(r.name||''),description:String(r.description||''),servings:r.servings==null||r.servings===''?null:num(r.servings)||null,servingsNote:String(r.servingsNote||''),
    prepTime:String(r.prepTime||''),cookTime:String(r.cookTime||''),tempText:String(r.temperature||r.tempText||''),
    ingredients:(Array.isArray(r.ingredients)?r.ingredients:[]).map(i=>({id:uid(),group:String(i.group||''),amount:String(i.amount??''),unit:String(i.unit||''),name:String(i.name||''),optional:!!i.optional})).filter(i=>i.name),
    instructions:(Array.isArray(r.instructions)?r.instructions:[]).map(String).filter(Boolean),
    storage:String(r.storage||''),freezer:r.freezerFriendly===true?true:r.freezerFriendly===false?false:null};
}
const ClaudeEngine={
  id:'claude', label:'Claude AI', long:'Claude (AI)',
  denied:false,
  async available(){return !this.denied&&!!(await getSample())},
  async canReadImages(){if(this.denied)return false;const s=await getSample();if(!s)return false;try{const l=await s.limits();return !!(l&&l.images)}catch(e){return false}},
  async maxImages(){const s=await getSample();try{const l=await s.limits();return l.images?l.images.maxCount:0}catch(e){return 0}},
  async analyzeRecipe({text,photos,url},opts={}){
    const s=await getSample(); if(!s)throw {code:'unavailable'};
    const prompt=`Read this dessert recipe${photos&&photos.length?' from the attached photo(s)':''} and structure it. Copy quantities exactly as written — do not convert, guess or invent anything. If servings are not stated, use null and explain in servingsNote. Keep section names like "Crust" or "Filling" in "group". Put each instruction step as one string, without step numbers.
${url?`Source link (for reference only, you cannot open it): ${url}\n`:''}${text?`RECIPE TEXT:\n${text.slice(0,12000)}\n`:''}
Reply with only JSON in this shape: ${RECIPE_SHAPE}`;
    const o={signal:opts.signal,onText:opts.onText};
    if(photos&&photos.length)o.images=photos.map(dataURLtoBlob);
    return normRecipe(await s.json(prompt,o));
  },
  async generateAdaptation(orig,needs,profile,opts={}){
    const s=await getSample(); if(!s)throw {code:'unavailable'};
    const pr=needs.priorities.map((p,ix)=>`${ix+1}. ${p.key} — ${p.level.toUpperCase()}`).join('\n');
    const prompt=`You are the recipe adaptation engine in My Kitchen, a personal dessert app. Create this person's version of the ORIGINAL recipe below.

How to adapt:
- Think about the WHOLE recipe, not word swaps. For each ingredient consider its function (structure, fat, sweetener, liquid, binder, leavening, flavor, protein, thickener, topping, acid, emulsifier), plus moisture, binding, sweetness, flour absorption, baking behaviour, texture and serving size.
- REQUIRED items must be fully satisfied. Never trade a requirement away to improve macros.
- Ingredients on the person's Avoid list must not appear in the adapted recipe. (This is their own category — do not call it an allergy.) Prefer ingredients they love; avoid ones they dislike when a reasonable option exists.
- Change an ingredient only if it breaks a requirement or meaningfully helps a goal. Keep everything that already works.
- When you change something, adjust what depends on it (liquid, leavening, bake time, method) and say so.
- If an ingredient's name alone can't confirm it meets a requirement (e.g. oats for gluten free, chocolate for dairy free), mark that requirement "cannot_confirm", name the ingredient and suggest checking the label.
- Collagen does not behave like flour. Never replace flour 1:1 with collagen. Only add it if it makes sense for this recipe.
- Rate every change: "high", "medium" or "experimental". Never promise results.
- Use the original's measuring style (cups or grams). Use plain, common ingredient names (e.g. "unsweetened applesauce", "certified gluten-free oat flour") so they can be matched to a nutrition table. Do NOT include any nutrition numbers.
- Rewrite the method so it matches the new ingredients.

The person:
Priorities (most important first):
${pr||'(none chosen)'}
Keep it as close to the original as possible: ${needs.keepClose?'YES — make the smallest changes that meet the requirements and goals':'no'}
Avoid list: ${(profile.avoid||[]).join(', ')||'none'}
Caution list: ${(profile.caution||[]).join(', ')||'none'}
Loves: ${(profile.love||[]).join(', ')||'none'}
Dislikes: ${(profile.dislike||[]).join(', ')||'none'}

ORIGINAL RECIPE (JSON):
${JSON.stringify({name:orig.name,servings:orig.servings,temperature:orig.tempText,prepTime:orig.prepTime,cookTime:orig.cookTime,ingredients:orig.ingredients.map(i=>({group:i.group,amount:i.amount,unit:i.unit,name:i.name,optional:i.optional})),instructions:orig.instructions})}

Reply with only JSON in this shape:
{"name":"short appealing name for the new version","description":string,"servings":number,"prepTime":string,"cookTime":string,"temperature":string,
"ingredients":[{"group":string,"amount":string,"unit":string,"name":string,"optional":boolean,"functions":[string]}],
"instructions":[string],"storage":string,"freezerFriendly":true|false|null,
"changes":[{"ingredient":string,"original":"amount + ingredient as in the original, or — if added","replacement":"new amount + ingredient(s)","why":"one or two plain sentences","relatedAdjustments":string,"confidence":"high"|"medium"|"experimental"}],
"requirementChecks":[{"requirement":string,"status":"met"|"not_met"|"cannot_confirm","detail":string,"ingredients":[string]}],
"collagen":{"verdict":"yes"|"yes_adjust"|"no"|"unknown","amount":string,"where":string,"reduce":string,"liquid":string,"texture":string,"reason":string},
"notes":string}`;
    const j=await s.json(prompt,{signal:opts.signal,onText:opts.onText,cache:false});
    const base=normRecipe(j);
    return {...base,name:base.name||smartName(orig.name),
      changes:(Array.isArray(j.changes)?j.changes:[]).map(c=>({id:uid(),ingredient:String(c.ingredient||''),original:String(c.original||''),replacement:String(c.replacement||''),why:String(c.why||''),related:String(c.relatedAdjustments||c.related||''),confidence:['high','medium','experimental'].includes(c.confidence)?c.confidence:'medium'})),
      aiChecks:(Array.isArray(j.requirementChecks)?j.requirementChecks:[]).map(c=>({requirement:String(c.requirement||''),status:['met','not_met','cannot_confirm'].includes(c.status)?c.status:'cannot_confirm',detail:String(c.detail||''),ingredients:Array.isArray(c.ingredients)?c.ingredients.map(String):[]})),
      functions:(Array.isArray(j.ingredients)?j.ingredients:[]).map(i=>({name:String(i.name||''),functions:Array.isArray(i.functions)?i.functions.map(String):[]})),
      collagen:Object.assign({verdict:'unknown',amount:'',where:'',reduce:'',liquid:'',texture:'',reason:''},j.collagen||{}),
      notes:String(j.notes||''),engine:'claude'};
  },
  async reviseFromTestFeedback(rec,test,opts={}){
    const s=await getSample(); if(!s)throw {code:'unavailable'};
    const lab={little:'too little',right:'perfect',much:'too much',dry:'too dry',perfect:'perfect',wet:'too wet',dense:'too dense',soft:'too soft',yes:'yes',no:'no',unsure:'unsure'};
    const prompt=`You are the recipe adaptation engine in My Kitchen. The person made the recipe below and gave feedback. Propose the NEXT version.
- Make targeted changes that address the feedback (e.g. "too dry" → adjust moisture, bake time or flour; not random changes).
- Keep all of these requirements satisfied: ${(rec.userRequirements||[]).join(', ')||'none recorded'}. Keep the goals in mind: ${(rec.nutritionGoals||[]).join(', ')||'none recorded'}.
- If they did not tolerate it, do not diagnose why. You may suggest testing one ingredient change at a time.
- Rate each change "high", "medium" or "experimental". Do NOT include nutrition numbers.

CURRENT RECIPE (JSON): ${JSON.stringify({name:rec.name,servings:rec.servings,temperature:rec.tempText,cookTime:rec.cookTime,ingredients:rec.adaptedIngredients.map(i=>({group:i.group,amount:i.amount,unit:i.unit,name:i.name,optional:i.optional})),instructions:rec.adaptedInstructions})}

FEEDBACK: taste ${test.taste||'?'}/5, texture ${test.texture||'?'}/5, sweetness ${lab[test.sweetness]||'not given'}, texture issue ${lab[test.textureIssue]||'not given'}, body tolerated it: ${lab[test.tolerated]||'not given'}. Notes: ${[test.worked&&'Worked: '+test.worked,test.didnt&&"Didn't: "+test.didnt,test.change&&'Change: '+test.change].filter(Boolean).join(' | ')||'none'}

Reply with only JSON: {"summary":string,"ingredients":[{"group":string,"amount":string,"unit":string,"name":string,"optional":boolean}],"instructions":[string],"cookTime":string,"changes":[{"ingredient":string,"original":string,"replacement":string,"why":string,"relatedAdjustments":string,"confidence":"high"|"medium"|"experimental"}]}`;
    const j=await s.json(prompt,{signal:opts.signal,onText:opts.onText,cache:false});
    const b=normRecipe(j);
    return {summary:String(j.summary||''),ingredients:b.ingredients,instructions:b.instructions,cookTime:b.cookTime,
      changes:(Array.isArray(j.changes)?j.changes:[]).map(c=>({id:uid(),ingredient:String(c.ingredient||''),original:String(c.original||''),replacement:String(c.replacement||''),why:String(c.why||''),related:String(c.relatedAdjustments||''),confidence:['high','medium','experimental'].includes(c.confidence)?c.confidence:'medium'})),engine:'claude'};
  }
};

/* =====================================================================
   SmartService — the only thing the UI calls
   ===================================================================== */
const SmartService={
  async engine(){
    const pref=(typeof DB!=='undefined'&&DB&&DB.preferences.engine)||'auto';
    if(pref==='rules')return RulesEngine;
    return (await ClaudeEngine.available())?ClaudeEngine:RulesEngine;
  },
  async aiAvailable(){return ClaudeEngine.available()},
  async analyzeRecipe(input,opts){const e=input.photos&&input.photos.length&&await ClaudeEngine.canReadImages()?ClaudeEngine:await this.engine();const r=await e.analyzeRecipe(input,opts);r.engine=e.id;return r},
  identifyIngredientFunctions,
  checkRequirements,
  async generateAdaptation(orig,needs,profile,opts){
    const e=await this.engine();
    const a=await e.generateAdaptation(orig,needs,profile,opts);
    return finishAdaptation(orig,a,needs,profile);
  },
  calculateNutrition, compareNutrition,
  generateSubstitutionReasons:a=>(a.changes||[]).map(c=>({ingredient:c.ingredient,why:c.why,confidence:c.confidence})),
  evaluateCollagen:evaluateCollagenLocal,
  async reviseFromTestFeedback(rec,test,opts){const e=await this.engine();return e.reviseFromTestFeedback(rec,test,opts)}
};
/** post-processing shared by both engines: local safety-net checks + nutrition + goal feedback */
function finishAdaptation(orig,a,needs,profile){
  a.servings=a.servings||orig.servings||null;
  const local=checkRequirements(a.ingredients,needs.reqs,profile.avoid||[]);
  // the local check is a safety net: a local "not met" always wins over an AI "met"
  a.requirementChecks=local.map(l=>{const ai=(a.aiChecks||[]).find(c=>c.requirement.toLowerCase()===l.requirement.toLowerCase());
    if(l.status==='not_met')return l; if(ai&&ai.status!=='met')return {...ai,requirement:l.requirement}; if(l.status==='cannot_confirm')return l; return ai?{...ai,requirement:l.requirement}:l});
  a.functions=a.functions&&a.functions.length?a.functions:identifyIngredientFunctions(a.ingredients).map(f=>({name:f.name,functions:f.functions}));
  a.origNutrition=calculateNutrition(orig.ingredients,orig.servings);
  a.nutrition=calculateNutrition(a.ingredients,a.servings);
  a.goalFeedback=goalFeedback(orig,a,needs);
  const tags=[];a.requirementChecks.forEach(c=>{if(c.status==='met'&&BODY_REQS.concat(needs.reqs).includes(c.requirement))tags.push(c.requirement)});
  a.goalFeedback.forEach(g=>{if(g.status==='met')tags.push(g.goal)});
  if(a.freezer===true)tags.push('Freezer Friendly');
  a.tags=[...new Set(tags)];
  return a;
}
function goalFeedback(orig,a,needs){
  const cmp=compareNutrition(a.origNutrition,a.nutrition), out=[];
  const pct=(k)=>cmp&&cmp[k].pct!=null?Math.abs(Math.round(cmp[k].pct)):null;
  const g1=v=>Math.abs(Math.round(v*10)/10);
  for(const g of needs.goals){
    let status='unknown',text='Nutrition estimate incomplete, so this can’t be calculated.';
    const need=k=>{if(!cmp)return false;return true};
    switch(g){
      case 'Lower Calories': if(need()){const d=cmp.kcal.diff;status=d<0?'met':'not_met';text=d<0?`Estimated ${pct('kcal')}% reduction (${Math.round(cmp.kcal.orig)} → ${Math.round(cmp.kcal.mine)} kcal per serving)`:`No reduction found (${Math.round(cmp.kcal.orig)} → ${Math.round(cmp.kcal.mine)} kcal)`}break;
      case 'Lower Calorie Per Portion': if(need()){const d=cmp.kcal.diff;status=d<0?'met':'not_met';text=d<0?`Estimated ${Math.abs(Math.round(d))} kcal less per serving`:'No reduction per serving found'}break;
      case 'Lower Fat': if(need()){const d=cmp.fat.diff;status=d<0?'met':'not_met';text=d<0?`Estimated ${g1(d)} g less fat per serving (${pct('fat')}%)`:'No fat reduction found'}break;
      case 'Lower Carbs': if(need()){const d=cmp.carbs.diff;status=d<0?'met':'not_met';text=d<0?`Estimated ${g1(d)} g fewer carbs per serving`:'No carb reduction found'}break;
      case 'Lower Sugar': if(need()){const d=cmp.sugar.diff;status=d<0?'met':'not_met';text=d<0?`Estimated ${g1(d)} g less sugar per serving`:'No sugar reduction found'}break;
      case 'Higher Protein': if(need()){const d=cmp.protein.diff;status=d>0?'met':'not_met';text=d>0?`Estimated +${g1(d)} g protein per serving`:'No protein increase found'}break;
      case 'Higher Fiber': if(need()){const d=cmp.fiber.diff;status=d>0?'met':'not_met';text=d>0?`Estimated +${g1(d)} g fiber per serving`:'No fiber increase found'}break;
      case 'More Filling': if(need()){const dp=cmp.protein.diff,df=cmp.fiber.diff;status=dp+df>0?'met':'not_met';text=`Protein ${dp>=0?'+':''}${g1(dp)===0?0:(dp<0?'-':'')+g1(dp)} g, fiber ${df>=0?'+':'-'}${g1(df)} g per serving`.replace('+-','-')}break;
      case 'Higher Volume':{const ch=(a.changes||[]).some(c=>/volume|zucchini|portion/i.test(c.ingredient+c.why));status=ch?'met':'unknown';text=ch?'Volume added — see the changes below':'No volume change made';break}
      case 'Collagen Friendly':{const v=a.collagen&&a.collagen.verdict;const inR=(a.ingredients||[]).some(i=>/collagen/i.test(i.name));status=inR?'met':v==='no'?'not_met':'unknown';text=inR?'Collagen added to the recipe':v==='no'?'Collagen not recommended for this recipe':'Collagen not added';break}
    }
    out.push({goal:g,status,text});
  }
  if(needs.keepClose){const n=(a.changes||[]).length;out.push({goal:'Close to the original',status:'met',text:`${n} ${n===1?'change':'changes'} made`})}
  return out;
}
