'use strict';
/* ============ basics ============ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const num=v=>{const n=parseFloat(String(v??'').replace(',','.'));return isFinite(n)?n:0};
const KEY='smartTreats.v1', DRAFT_KEY='smartTreats.draft';
const store={
  get(k){try{return localStorage.getItem(k)}catch(e){return null}},
  set(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};

const I={
home:'<svg viewBox="0 0 24 24"><path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/></svg>',
book:'<svg viewBox="0 0 24 24"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 7.5h6"/></svg>',
plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
whisk:'<svg viewBox="0 0 24 24"><path d="M12 15v6.5"/><path d="M12 15c-3.3 0-5-3.9-5-7.3C7 5 9.2 3 12 3s5 2 5 4.7c0 3.4-1.7 7.3-5 7.3z"/><path d="M12 3v12M9.6 3.8C8.9 7 9.6 12 12 15M14.4 3.8C15.1 7 14.4 12 12 15"/></svg>',
user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
heart:'<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.3 4.5c2 0 3.5 1.1 4.7 2.7 1.2-1.6 2.7-2.7 4.7-2.7 3.3 0 5.7 3.1 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>',
back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
camera:'<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
image:'<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>',
paste:'<svg viewBox="0 0 24 24"><rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 13.5h7M8.5 17h4"/></svg>',
link:'<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.8M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></svg>',
pen:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/></svg>',
print:'<svg viewBox="0 0 24 24"><path d="M7 9V3.5h10V9M7 17H4.5V9h15v8H17M7 14h10v6.5H7z"/></svg>',
trash:'<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/></svg>',
check:'<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
star:'<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/></svg>',
chev:'<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
up:'<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
down:'<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
arrowDown:'<svg viewBox="0 0 24 24"><path d="M12 4v16M6 14l6 6 6-6"/></svg>',
sliders:'<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
grid:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
list:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="5" height="5" rx="1.2"/><rect x="4" y="14" width="5" height="5" rx="1.2"/><path d="M12.5 7.5H20M12.5 16.5H20"/></svg>',
download:'<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
upload:'<svg viewBox="0 0 24 24"><path d="M12 15V4M7 9l5-5 5 5M5 20h14"/></svg>',
copy:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
spark:'<svg viewBox="0 0 24 24"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
arrowRight:'<svg viewBox="0 0 24 24"><path d="M4 12h16M14 6l6 6-6 6"/></svg>',
refresh:'<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4.5V11h-6.5"/></svg>',
stop:'<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
layers:'<svg viewBox="0 0 24 24"><path d="m12 4 9 5-9 5-9-5z"/><path d="m3 14 9 5 9-5"/></svg>',
cake:'<svg viewBox="0 0 24 24"><path d="M4 21V13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8M2.5 21h19M4 15.5c1.3 1 2.7 1 4 0s2.7-1 4 0 2.7 1 4 0 2.7-1 4 0M12 11V7.5"/><path d="M12 7.5c-1.2 0-1.8-1-1.2-2.2L12 3l1.2 2.3c.6 1.2 0 2.2-1.2 2.2z"/></svg>'
};

/* ============ vocab ============ */
const DEFAULT_CATS=['Cookie Dough','Brownies','Cookies','Cakes','Cheesecakes','Truffles & Balls','Puddings','Frozen Treats','Apple Desserts','Chocolate','Coffee','Fruit','Rice Treats','Muffins','Pancakes','Quick Treats','Other'];
const BODY_REQS=['Gluten Free','Lactose Free','Dairy Free','Nut Free','Soy Free','Egg Free'];
const GOALS=['Lower Calories','Lower Fat','Lower Carbs','Lower Sugar','Higher Protein','Higher Fiber','Collagen Friendly','More Filling','Higher Volume','Lower Calorie Per Portion'];
const KEEP_CLOSE='Keep it as close to the original as possible';
const REQS=[...BODY_REQS,...GOALS,'No Chocolate','No Bake','Freezer Friendly'];
const BADGE={'Gluten Free':'GF','Lactose Free':'LF','Dairy Free':'DF','Nut Free':'Nut free','Soy Free':'Soy free','Egg Free':'Egg free','Collagen Friendly':'Collagen','No Bake':'No bake','Freezer Friendly':'Freezer','No Chocolate':'No choc','Higher Protein':'Protein+','Higher Fiber':'Fiber+','Lower Calories':'Lighter','Lower Sugar':'Less sugar'};
const STATUSES=[['idea','Idea'],['adapted','Adapted'],['ready','Ready to test'],['tested','Tested'],['approved','Approved']];
const STATUS_LABEL=Object.fromEntries(STATUSES);
const TOL={
  good:{label:'Known good',desc:"I've eaten this successfully.",ic:'✓'},
  caution:{label:'Caution',desc:"I'm testing this or my tolerance varies.",ic:'~'},
  avoid:{label:'Avoid',desc:"I've established that I don't tolerate this.",ic:'✕'},
  unknown:{label:'Unknown',desc:"I haven't tested this.",ic:'?'}
};
const NUT=['kcal','protein','carbs','fat','fiber','sugar'];
const NUTL={kcal:'Calories',protein:'Protein',carbs:'Carbs',fat:'Fat',fiber:'Fiber',sugar:'Sugar'};
const NUTS={kcal:'Kcal',protein:'Prot',carbs:'Carb',fat:'Fat',fiber:'Fiber',sugar:'Sugar'};
const unitOf=k=>k==='kcal'?'kcal':'g';
const COLLAGEN_OPTS=[['yes','Yes'],['yes_adjust','Yes, with adjustment'],['no','Not recommended'],['unknown','Not enough information']];
const PREFS={love:'Love',dislike:'Dislike'};
const CONF_LABEL={high:'High confidence',medium:'Medium confidence',experimental:'Experimental'};
const COLLAGEN_NOTE='Collagen can add protein but does not behave like flour and does not replace complete dietary protein sources.';

/* ============ seed recipes ============ */
function ing(group,amount,unit,name,n,optional){
  const o={id:uid(),group,amount,unit,name,optional:!!optional,n:{}};
  if(n){o.nsrc='manual';NUT.forEach((k,i)=>{if(n[i]!=null)o.n[k]=String(n[i])})}
  return o;
}
function newRecipe(f={}){
  const now=Date.now();
  return Object.assign({
    id:uid(),name:'',description:'',photo:null,referencePhoto:null,
    originalSource:'',originalRecipe:'',originalIngredients:'',originalInstructions:'',
    adaptedIngredients:[],adaptedInstructions:[],servings:8,category:'Other',
    requirements:[...(DB?.preferences?.bodyReqs||[])],
    nutrition:null,nutritionStatus:DB?.preferences?.nutritionStatus||'estimated',nutritionNote:'',
    originalNutrition:{kcal:'',protein:'',carbs:'',fat:'',fiber:'',sugar:''},
    toleranceChecks:[],smartSwaps:[],
    collagen:{status:'unknown',amount:'',texture:'',how:''},
    status:'idea',favorite:false,rating:0,tests:[],notes:'',versionNotes:'',
    original:null,userRequirements:[],nutritionGoals:[],priorities:[],keepClose:false,ingredientSubstitutions:[],requirementChecks:[],goalFeedback:[],
    collagenRecommendation:null,adaptationEngine:null,prepTime:'',cookTime:'',tempText:'',storage:'',freezer:null,
    versions:[],currentVersion:1,finalApprovedVersion:null,pendingRevision:null,
    createdAt:now,updatedAt:now,approvedAt:null
  },f);
}
function seed(){
  const est='Example estimates. Replace with your own label values whenever you can.';
  const r1=newRecipe({
    name:'Light Raspberry Cheesecake',category:'Cheesecakes',status:'adapted',servings:10,
    description:'A creamy cheesecake on an oat-and-banana crust, finished with a bright raspberry layer.',
    originalSource:'Example recipe',
    requirements:['Gluten Free','Lactose Free','Collagen Friendly','No Chocolate'],
    adaptedIngredients:[
      ing('Crust','100','g','certified gluten-free oats',[375,13,60,7,10]),
      ing('Crust','100','g','ripe banana',[89,1.1,23,0.3,2.6]),
      ing('Crust','10','g','lactose-free butter',[74,0.1,0,8.2,0]),
      ing('Crust','1/2','tsp','vanilla',[6,0,0.3,0,0]),
      ing('Crust','','pinch','salt'),
      ing('Crust','','','sweetener',null,true),
      ing('Filling','300','g','lactose-free cream cheese',[675,16,12,63,0]),
      ing('Filling','300','g','lactose-free skyr',[189,33,12,0.6,0]),
      ing('Filling','20–30','g','collagen peptides',[90,22.5,0,0,0]),
      ing('Filling','1','tsp','vanilla',[12,0,0.5,0,0]),
      ing('Filling','','','sweetener, to taste'),
      ing('Filling','2–3','tbsp','lactose-free milk, if required',[17,1.3,1.8,0.6,0],true),
      ing('Filling','','','gelatine, per package directions for about 600 g filling',[34,8.5,0,0,0]),
      ing('Raspberry layer','200','g','raspberries',[104,2.4,24,1.3,13]),
      ing('Raspberry layer','','','sweetener, to taste'),
      ing('Raspberry layer','','','gelatine, enough to lightly set the fruit layer',[14,3.4,0,0,0])
    ],
    adaptedInstructions:['Blend the oats into flour.','Mix with banana, butter, vanilla and salt.','Press into a lined 20 cm springform pan.','Bake at 175°C for 10–12 minutes for a firmer crust.','Cool completely.','Mix cream cheese, skyr, collagen, vanilla and sweetener.','Prepare the gelatine according to the package directions.','Incorporate the gelatine into the filling.','Pour over the crust.','Refrigerate until it begins to set.','Blend the raspberries.','Strain out the seeds if you like.','Add the prepared gelatine.','Pour the cooled raspberry mixture over the cheesecake.','Refrigerate at least 4 hours, preferably overnight.'],
    smartSwaps:[
      {id:uid(),original:'Regular cream cheese',swap:'Lactose-free cream cheese',why:'Maintains cheesecake texture while removing lactose.'},
      {id:uid(),original:'Biscuit crust with butter',swap:'Oat and banana crust',why:'Changes the ingredient profile; banana helps bind the crust with less butter.'}
    ],
    collagen:{status:'yes',amount:'20–30 g in the filling',texture:'Mixed into the creamy filling with the cream cheese and skyr.',how:'Whisk it into the filling before adding the gelatine.'},
    versionNotes:'Individual raspberry tolerance varies. This recipe cannot guarantee symptom-free tolerance.',
    nutritionNote:est
  });
  const r2=newRecipe({
    name:'Strawberry Cheesecake Truffle Balls',category:'Truffles & Balls',status:'adapted',servings:10,
    description:'Soft little strawberry bites with a creamy cheesecake coating. Makes 10–12.',
    originalSource:'Example recipe',
    requirements:['Gluten Free','Lactose Free','Collagen Friendly','No Chocolate'],
    adaptedIngredients:[
      ing('Truffles','60','g','certified gluten-free oat flour',[225,8,36,4.2,6]),
      ing('Truffles','20','g','collagen peptides',[72,18,0,0,0]),
      ing('Truffles','80','g','lactose-free cream cheese',[180,4.3,3.2,16.8,0]),
      ing('Truffles','1','','egg',[72,6.3,0.4,4.8,0]),
      ing('Truffles','60–80','g','strawberries',[22,0.5,5.4,0.2,1.4]),
      ing('Truffles','1/2','tsp','vanilla',[6,0,0.3,0,0]),
      ing('Truffles','1/2','tsp','gluten-free baking powder',[1,0,0.3,0,0]),
      ing('Truffles','','pinch','salt'),
      ing('Truffles','','','sweetener, to taste'),
      ing('Coating','50','g','lactose-free cream cheese',[113,2.7,2,10.5,0]),
      ing('Coating','30','g','lactose-free skyr',[19,3.3,1.2,0,0]),
      ing('Coating','','','vanilla'),
      ing('Coating','','','sweetener'),
      ing('Coating','','','mashed strawberry',null,true)
    ],
    adaptedInstructions:['Mash the strawberries finely.','Combine the truffle ingredients.','The mixture should resemble thick cookie dough.','Add 5–10 g extra oat flour if it is very wet.','Scoop into 10–12 small portions.','Bake at 175°C for 10–13 minutes.','Cool completely.','Mix the coating ingredients.','Coat the balls.','Refrigerate or freeze for about 30 minutes.'],
    smartSwaps:[
      {id:uid(),original:'Wheat flour',swap:'Certified gluten-free oat flour',why:'Changes the ingredient profile and may reduce calorie density depending on quantities.'},
      {id:uid(),original:'Regular cream cheese',swap:'Lactose-free cream cheese',why:'Keeps the cheesecake flavour while removing lactose.'}
    ],
    collagen:{status:'yes',amount:'20 g in the dough',texture:'The dough should still feel like thick cookie dough. Add a little oat flour if it turns wet.',how:'Mix in with the oat flour before adding the wet ingredients.'},
    nutritionNote:est
  });
  const r3=newRecipe({
    name:'Coffee-Mocha No-Bake Cake',category:'Coffee',status:'adapted',servings:10,
    description:'A chilled coffee cake with a mocha filling and a thin espresso-chocolate top.',
    originalSource:'Example recipe',
    requirements:['Gluten Free','Lactose Free','Collagen Friendly','No Bake'],
    adaptedIngredients:[
      ing('Base','100','g','certified gluten-free oats',[375,13,60,7,10]),
      ing('Base','100','g','banana',[89,1.1,23,0.3,2.6]),
      ing('Base','20','g','collagen peptides',[72,18,0,0,0]),
      ing('Base','2','tbsp','instant coffee or espresso powder',[10,0.5,1.5,0,0]),
      ing('Base','1','tsp','cocoa',[6,0.5,0.5,0.3,0.9]),
      ing('Base','1/2','tsp','vanilla',[6,0,0.3,0,0]),
      ing('Base','','pinch','salt'),
      ing('Base','1–3','tbsp','lactose-free milk, as required',[14,1,1.5,0.5,0]),
      ing('Filling','300','g','lactose-free skyr or thick lactose-free yogurt',[189,33,12,0.6,0]),
      ing('Filling','20','g','collagen peptides',[72,18,0,0,0]),
      ing('Filling','2','tbsp','instant coffee or espresso powder',[10,0.5,1.5,0,0]),
      ing('Filling','1','tsp','cocoa',[6,0.5,0.5,0.3,0.9]),
      ing('Filling','','','vanilla',[6,0,0.3,0,0]),
      ing('Filling','','','sweetener, to taste'),
      ing('Top','40–50','g','tolerated lactose-free chocolate',[252,3.6,15,18,4.5]),
      ing('Top','1','tsp','instant espresso powder',[3,0.2,0.5,0,0])
    ],
    adaptedInstructions:['Blend the base ingredients into a sticky dough.','Press into a lined 20 cm cake tin.','Dissolve the filling coffee in about 1 tbsp hot water.','Let it cool.','Mix the filling ingredients.','Spread over the base.','Freeze for 45–60 minutes.','Melt the chocolate gently.','Stir in the espresso powder.','Spread thinly over the cold cake.','Refrigerate until firm.'],
    smartSwaps:[
      {id:uid(),original:'Large amount of nut butter',swap:'Lactose-free skyr + a smaller amount of fat',why:'Can reduce calorie density while maintaining a creamy texture.'},
      {id:uid(),original:'Brewed coffee or coffee grounds',swap:'Instant espresso powder',why:'Dissolves into the filling without adding extra liquid or grit.'}
    ],
    collagen:{status:'yes',amount:'20 g in the base + 20 g in the filling',texture:'Blends into the sticky base and the skyr filling.',how:'Add with the dry base ingredients, and whisk into the filling.'},
    versionNotes:'Use instant espresso or coffee powder rather than ordinary coffee grounds.',
    nutritionNote:est
  });
  const t=Date.now();
  r1.createdAt=r1.updatedAt=t; r2.createdAt=r2.updatedAt=t-1000; r3.createdAt=r3.updatedAt=t-2000;
  return [r1,r2,r3];
}

/* ============ storage ============ */
let DB=null, draft=null;
function defaults(){
  return {version:1,
    preferences:{requirements:[],bodyReqs:[],goals:[],customReqs:[],engine:'auto',thresholds:{protein:10,fat:5,fiber:3},nutritionStatus:'estimated',view:'list'},
    categories:{custom:[]},ingredients:[],recipes:[]};
}
function normalize(d){
  const base=defaults();
  d.preferences=Object.assign(base.preferences,d.preferences||{});
  d.preferences.thresholds=Object.assign({protein:10,fat:5,fiber:3},d.preferences.thresholds||{});
  const P=d.preferences; P.customReqs=P.customReqs||[];
  if(!d.version||d.version<2){ // v1 → v2: split old mixed requirement defaults into body requirements & goals
    (P.requirements||[]).forEach(q=>{if(BODY_REQS.includes(q)||(P.customReqs||[]).includes(q)){if(!P.bodyReqs.includes(q))P.bodyReqs.push(q)}else if(GOALS.includes(q)&&!P.goals.includes(q))P.goals.push(q)});
  }
  d.version=2;
  d.categories=Object.assign(base.categories,d.categories||{});
  d.ingredients=Array.isArray(d.ingredients)?d.ingredients:[];
  d.recipes=(Array.isArray(d.recipes)?d.recipes:[]).map(r=>{
    const n=newRecipe(); const o=Object.assign(n,r);
    o.collagen=Object.assign({status:'unknown',amount:'',texture:'',how:''},r.collagen||{});
    o.collagen.status={maybe:'yes_adjust',untested:'unknown'}[o.collagen.status]||o.collagen.status;
    o.originalNutrition=Object.assign({kcal:'',protein:'',carbs:'',fat:'',fiber:''},r.originalNutrition||{});
    o.adaptedIngredients=(o.adaptedIngredients||[]).map(i=>{const x=Object.assign({id:uid(),group:'',amount:'',unit:'',name:'',optional:false,n:{}},i);if(!x.nsrc&&x.n&&Object.values(x.n).some(v=>String(v).trim()!==''))x.nsrc='manual';return x});
    ['userRequirements','nutritionGoals','priorities','ingredientSubstitutions','requirementChecks','goalFeedback','versions'].forEach(k=>{if(!Array.isArray(o[k]))o[k]=[]});
    o.adaptedInstructions=Array.isArray(o.adaptedInstructions)?o.adaptedInstructions:[];
    o.smartSwaps=Array.isArray(o.smartSwaps)?o.smartSwaps:[];
    o.tests=Array.isArray(o.tests)?o.tests:[];
    o.requirements=Array.isArray(o.requirements)?o.requirements:[];
    if(!o.versions.length){o.versions=[{id:uid(),n:1,createdAt:o.createdAt,label:'Version 1',source:o.adaptationEngine||'manual',ingredients:clone(o.adaptedIngredients),instructions:[...o.adaptedInstructions],servings:o.servings,changes:clone(o.ingredientSubstitutions||[])}];o.currentVersion=1}
    return o;
  });
  return d;
}
function clone(x){return JSON.parse(JSON.stringify(x))}
function syncVersion(r){const v=(r.versions||[]).find(x=>x.n===r.currentVersion);if(v){v.ingredients=clone(r.adaptedIngredients);v.instructions=[...r.adaptedInstructions];v.servings=r.servings}}
function loadDB(){
  const raw=store.get(KEY);
  if(raw){try{DB=normalize(JSON.parse(raw))}catch(e){DB=null}}
  if(!DB){DB=defaults();DB.recipes=seed();persist()}
  try{const d=store.get(DRAFT_KEY);draft=d?JSON.parse(d):null}catch(e){draft=null}
}
let saveTimer=null, warned=false;
function persist(){
  clearTimeout(saveTimer);
  DB.recipes.forEach(r=>{syncVersion(r);r.nutrition=nutritionSnapshot(r);r.nutritionDataSource=r.nutrition?r.nutrition.source:null;r.toleranceChecks=tolChecks(r).map(c=>({ingredient:c.name,status:c.status}))});
  const ok=store.set(KEY,JSON.stringify(DB));
  if(!ok&&!warned){warned=true;toast("Couldn't save. Storage may be full: export a backup or remove a photo.")}
  if(ok)warned=false;
}
function persistSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(persist,300)}
function saveDraft(){if(draft)store.set(DRAFT_KEY,JSON.stringify(draft));else store.del(DRAFT_KEY)}
const getR=id=>DB.recipes.find(r=>r.id===id);
const allCats=()=>[...DEFAULT_CATS.filter(c=>c!=='Other'),...DB.categories.custom,'Other'];

/* ============ nutrition (engine lives in the service layer) ============ */
function nut(r){return calculateNutrition(r.adaptedIngredients,r.servings)}
function totals(r){const c=nut(r);return {...c.total,any:c.any}}
function servingsOf(r){return Math.max(1,Math.round(num(r.servings))||1)}
function ps(r){const c=nut(r);return {...c.per,any:c.any,complete:c.complete,missing:c.missing,uncounted:c.uncounted,sources:c.sources}}
function nutritionSnapshot(r){const c=nut(r);if(!c.any)return null;const o={total:{},perServing:{},complete:c.complete,missing:c.missing,source:nLabel(r).toLowerCase()};NUT.forEach(k=>{o.total[k]=+c.total[k].toFixed(1);o.perServing[k]=+c.per[k].toFixed(1)});return o}
const fmtN=(v,k)=>k==='kcal'?Math.round(v).toLocaleString('en-US'):String(Math.round(v*10)/10);
const g0=v=>String(Math.round(v));
/** original per-serving values: manual entries win, else calculated from the preserved original */
function origPer(r){
  if(NUT.some(k=>String(r.originalNutrition[k]??'').trim()!=='')){const o={};NUT.forEach(k=>o[k]=num(r.originalNutrition[k]));o.manual=true;return o}
  if(r.original&&r.original.ingredients&&r.original.ingredients.length){const c=calculateNutrition(r.original.ingredients,r.original.servings||r.servings);if(c.complete){const o={...c.per};return o}}
  return null;
}
function hasOrig(r){return !!origPer(r)}
const nLabel=r=>{const c=nut(r);return r.nutritionStatus==='label'&&c.sources.length&&c.sources.every(s=>s==='label'||s==='manual')?'Label-based':'Estimated'};
/* ============ amounts / scaling ============ */
const FR={'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125};
function toNum(s){
  s=String(s).trim(); if(FR[s]!=null)return FR[s];
  const u=s.match(/^(\d+)\s*([½¼¾⅓⅔⅛])$/); if(u)return +u[1]+FR[u[2]];
  const m=s.match(/^(\d+)\s+(\d+)\/(\d+)$/); if(m)return +m[1]+ +m[2]/+m[3];
  const f=s.match(/^(\d+)\/(\d+)$/); if(f)return +f[1]/+f[2];
  return num(s);
}
function fmtQty(n){
  if(n>=10)return String(Math.round(n));
  if(n<0.2)return String(Math.round(n*100)/100);
  let w=Math.floor(n);const f=n-w;
  const F=[[0,''],[1/4,'¼'],[1/3,'⅓'],[1/2,'½'],[2/3,'⅔'],[3/4,'¾'],[1,'']];
  let best=F[0];for(const x of F)if(Math.abs(f-x[0])<Math.abs(f-best[0]))best=x;
  if(best[0]===1)w++;
  const fr=best[1];
  return w?(fr?w+' '+fr:String(w)):(fr||'0');
}
function scaleAmt(a,f){
  if(!a||Math.abs(f-1)<1e-9)return a||'';
  return a.replace(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔]/g,m=>fmtQty(toNum(m)*f));
}
function ingText(i,f=1){
  const a=scaleAmt(i.amount,f), u=i.unit||'';
  const q=[a,u].filter(Boolean).join(' ');
  return {q,name:i.name||''};
}
function parseLine(line){
  line=line.trim().replace(/^[-•*·]\s*/,'');
  if(!line)return null;
  const m=line.match(/^((?:\d+(?:[.,]\d+)?|\d+\/\d+|[½¼¾])(?:\s+\d+\/\d+)?(?:\s*(?:[–-]|to)\s*(?:\d+(?:[.,]\d+)?|\d+\/\d+))?)?\s*(g|kg|ml|dl|cl|l|tsp|tbsp|tsk|spsk|cups?|pinch|pcs|stk|oz|lb)?\.?\s+(.+)$/i);
  if(m&&(m[1]||m[2]))return {amount:(m[1]||'').replace(/\s*-\s*/,'–').trim(),unit:(m[2]||'').toLowerCase(),name:m[3].trim()};
  return {amount:'',unit:'',name:line};
}
const lines=t=>String(t||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);

/* ============ matching / tolerance ============ */
function sing(w){
  if(w.length>4&&w.endsWith('ies'))return w.slice(0,-3)+'y';
  if(w.length>4&&/(ch|sh|ss|x|o)es$/.test(w))return w.slice(0,-2);
  if(w.length>3&&w.endsWith('s')&&!w.endsWith('ss'))return w.slice(0,-1);
  return w;
}
const toks=s=>String(s||'').toLowerCase().replace(/[^a-z0-9æøåäöüéè]+/g,' ').trim().split(/\s+/).filter(Boolean).map(sing);
function matchTerm(term,name){const a=toks(term),b=toks(name);return a.length>0&&a.every(t=>b.includes(t))}
function tolFor(name){
  let best=null;
  DB.ingredients.forEach(t=>{if(matchTerm(t.name,name)&&(!best||toks(t.name).length>toks(best.name).length))best=t});
  return best;
}
function tolChecks(r){
  const seen=new Set(),out=[];
  (r.adaptedIngredients||[]).forEach(i=>{
    const nm=(i.name||'').trim(); if(!nm)return;
    const key=toks(nm).join(' '); if(seen.has(key))return; seen.add(key);
    const t=tolFor(nm); out.push({name:nm,status:t?t.status:'unknown',tol:t});
  });
  return out;
}
const requiredIngs=r=>(r.adaptedIngredients||[]).filter(i=>!i.optional&&(i.name||'').trim());

/* ============ filters ============ */
const th=()=>DB.preferences.thresholds;
const hasReq=(r,q)=>(r.requirements||[]).includes(q);
const FILTERS={
  fav:{label:'Favorites',fn:r=>r.favorite},
  approved:{label:'Approved',fn:r=>r.status==='approved'},
  ready:{label:'Ready to test',fn:r=>r.status==='ready'||r.status==='tested'},
  k100:{label:'Under 100 kcal',fn:r=>{const p=ps(r);return p.any&&p.kcal<100}},
  k150:{label:'Under 150 kcal',fn:r=>{const p=ps(r);return p.any&&p.kcal<150}},
  k200:{label:'Under 200 kcal',fn:r=>{const p=ps(r);return p.any&&p.kcal<200}},
  protein:{label:'High protein',fn:r=>{const p=ps(r);return p.any&&p.protein>=th().protein}},
  fat:{label:'Lower fat',fn:r=>{const p=ps(r);return p.any&&p.fat<=th().fat}},
  fiber:{label:'Higher fiber',fn:r=>{const p=ps(r);return p.any&&p.fiber>=th().fiber}},
  gf:{label:'Gluten free',fn:r=>hasReq(r,'Gluten Free')},
  lf:{label:'Lactose free',fn:r=>hasReq(r,'Lactose Free')},
  nf:{label:'Nut free',fn:r=>hasReq(r,'Nut Free')},
  df:{label:'Dairy free',fn:r=>hasReq(r,'Dairy Free')},
  sf:{label:'Soy free',fn:r=>hasReq(r,'Soy Free')},
  ef:{label:'Egg free',fn:r=>hasReq(r,'Egg Free')},
  collagen:{label:'Collagen',fn:r=>r.collagen.status==='yes'||r.collagen.status==='yes_adjust'||hasReq(r,'Collagen Friendly')||r.adaptedIngredients.some(i=>/collagen/i.test(i.name))},
  nochoc:{label:'No chocolate',fn:r=>hasReq(r,'No Chocolate')},
  nobake:{label:'No bake',fn:r=>hasReq(r,'No Bake')},
  freezer:{label:'Freezer friendly',fn:r=>hasReq(r,'Freezer Friendly')},
  five:{label:'5 ingredients or less',fn:r=>{const n=requiredIngs(r).length;return n>0&&n<=5}}
};
const FILTER_GROUPS=[['Status',['fav','approved','ready']],['Per serving',['k100','k150','k200','protein','fat','fiber']],['Requirements',['gf','lf','df','nf','sf','ef','collagen','nochoc','nobake','freezer','five']]];
const QUICK=['k100','k150','protein','fat','collagen','nochoc','nobake','five','freezer'];
function matchesQuery(r,q){
  if(!q.trim())return true;
  const hay=[r.name,r.category,r.description,r.notes,r.versionNotes,...r.adaptedIngredients.map(i=>i.name),...(r.requirements||[])].join(' ');
  return toks(q).every(t=>toks(hay).some(h=>h.startsWith(t)));
}

/* ============ art ============ */
const PAL={
  'Muffins':['#FDF2D2','#D9A441','#FFFBF2'],'Cakes':['#FCE4E9','#D95F7A','#FFF8F5'],
  'Cheesecakes':['#FCE4E9','#D95F7A','#FFF8F5'],'Coffee':['#F1E3D6','#563C35','#FFF8F0'],'Chocolate':['#E8D8D2','#5E3B37','#FBF3EC'],
  'Brownies':['#E8D8D2','#5E3B37','#FBF3EC'],'Truffles & Balls':['#F7DDE3','#D27A93','#FFF7F4'],'Frozen Treats':['#E3ECEB','#7FA3A0','#F8FBFA'],
  'Apple Desserts':['#EEF0DA','#A7B86E','#FBFCF4'],'Fruit':['#F7DDE3','#C25A75','#FFF7F4'],'Puddings':['#F6E7D8','#C9925C','#FFF8F1']
};
function art(r){
  const [bg,main,plate]=PAL[r.category]||['#FCE4E9','#D95F7A','#FFF8F5'];
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="${bg}"/><path d="M-20 222C80 172 170 286 420 204V320H-20Z" fill="${plate}" opacity=".5"/><circle cx="196" cy="160" r="98" fill="${plate}"/><circle cx="196" cy="160" r="98" fill="none" stroke="${main}" stroke-opacity=".14" stroke-width="2"/><circle cx="196" cy="160" r="60" fill="${main}" opacity=".88"/><ellipse cx="178" cy="140" rx="17" ry="11" fill="#fff" opacity=".22"/><path d="M304 54C322 84 326 110 316 140" fill="none" stroke="#86A97C" stroke-width="3" stroke-linecap="round"/><g fill="#A8C69F"><path d="M307 72c15-6 27-2 31 6-12 6-25 4-31-6z"/><path d="M313 98c-15-4-25 2-27 10 12 4 23 0 27-10z"/><path d="M317 120c14-5 25-1 28 7-12 5-23 3-28-7z"/></g></svg>`;
}
const photoHTML=r=>(r.photo||r.referencePhoto)?`<img src="${r.photo||r.referencePhoto}" alt="">`:art(r);

/* ============ ui atoms ============ */
function statusPill(r){const s=r.status;return `<span class="pill st-${s}">${s==='approved'?I.check:''}${STATUS_LABEL[s]||s}</span>`}
function badgesHTML(r,max=3){const b=(r.requirements||[]).filter(x=>BADGE[x]).slice(0,max);return b.map(x=>`<span class="badge">${BADGE[x]}</span>`).join('')}
function starsSm(v){if(!v)return '';let s='';for(let i=1;i<=5;i++)s+=I.star.replace('<svg','<svg class="'+(i<=Math.round(v)?'on':'')+'"');return `<span class="stars-sm" aria-label="${v} out of 5">${s}</span>`}
function macroHTML(r){
  const p=ps(r); if(!p.any)return `<p class="macros">Nutrition information needed</p>`;
  return `<p class="kcal">${fmtN(p.kcal,'kcal')} kcal${p.complete?'':' <small>· incomplete</small>'}</p><p class="macros">${g0(p.protein)}g protein • ${g0(p.carbs)}g carbs • ${g0(p.fat)}g fat</p>`;
}
function heartBtn(r){return `<button class="heart ${r.favorite?'on':''}" data-act="fav" data-id="${r.id}" aria-pressed="${r.favorite}" aria-label="${r.favorite?'Remove from favorites':'Add to favorites'}">${I.heart}</button>`}
function card(r,mode='l'){
  const book=r.status==='approved';
  return `<article class="rcard ${mode}" data-act="open" data-id="${r.id}" role="button" tabindex="0" aria-label="${esc(r.name)}">
    <div class="thumb">${photoHTML(r)}${heartBtn(r)}</div>
    <div class="rbody">${book&&mode!=='h'?`<div class="cat-line">${esc(r.category)}${starsSm(r.rating)}</div>`:''}<h3>${esc(r.name||'Untitled recipe')}</h3>${macroHTML(r)}
    <div class="badges">${statusPill(r)}${badgesHTML(r,mode==='g'?1:3)}</div></div></article>`;
}
function empty(msg,small,btn){return `<div class="empty"><p>${msg}</p>${small?`<small>${small}</small>`:''}${btn||''}</div>`}
function toast(msg){const old=$('.toast');if(old)old.remove();const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}

document.querySelectorAll('.tab').forEach(b=>{b.innerHTML=b.innerHTML.replace('ICON_HOME',I.home).replace('ICON_BOOK',I.book).replace('ICON_PLUS',I.plus).replace('ICON_WHISK',I.whisk).replace('ICON_USER',I.user)});
