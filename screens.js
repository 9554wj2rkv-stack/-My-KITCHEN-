'use strict';
/* ============ router ============ */
const ui={screen:'home',id:null,step:1,stack:[],q:'',rq:'',have:'',haveRes:null,filters:new Set(),cat:'',rtab:'all',servings:{},checks:{},profFilter:'all',from:'home',aiReady:null,aiImages:false};
function nav(screen,opts={}){
  if(opts.reset)ui.stack=[];
  else if(opts.push!==false)ui.stack.push({screen:ui.screen,id:ui.id,step:ui.step});
  ui.screen=screen; if('id' in opts)ui.id=opts.id; if(opts.step)ui.step=opts.step;
  render(); window.scrollTo(0,0);
}
function goBack(){
  const p=ui.stack.pop();
  if(p&&(!p.id||getR(p.id)||p.screen==='add')){ui.screen=p.screen;ui.id=p.id;ui.step=p.step||ui.step}else{ui.screen='home';ui.id=null}
  render(); window.scrollTo(0,0);
}
function render(){
  const s=SCREENS[ui.screen]||SCREENS.home;
  const main=$('#main'); main.innerHTML=s(); main.className=$('.footbar',main)?'has-foot':'';
  const tabKey=['recipe','test','revise'].includes(ui.screen)?(ui.from||'recipes'):ui.screen==='edit'?'add':ui.screen;
  $$('.tab').forEach(t=>{const on=t.dataset.s===tabKey;t.classList.toggle('on',on);t.setAttribute('aria-current',on?'page':'false')});
}
const unitNoun=r=>{const n=(r.name||'').toLowerCase();for(const [re,w] of [[/muffin/,'muffin'],[/cupcake/,'cupcake'],[/cookie/,'cookie'],[/brownie/,'brownie'],[/\bballs?\b|truffle/,'ball'],[/\bbars?\b/,'bar'],[/pancake/,'pancake']])if(re.test(n))return w;return 'serving'};

/* ============ HOME ============ */
function homeResults(){
  if(!ui.q.trim())return '';
  const res=DB.recipes.filter(r=>matchesQuery(r,ui.q)).slice(0,6);
  return `<div class="card" style="margin-top:12px;padding:6px 16px">${res.length?res.map(r=>`<button class="hres" data-act="open" data-id="${r.id}"><div class="mini">${photoHTML(r)}</div><div><b>${esc(r.name)}</b><span class="need">${esc(r.category)} — ${STATUS_LABEL[r.status]}</span></div></button>`).join(''):`<p style="padding:14px 0" class="muted">No recipes match “${esc(ui.q)}”.</p>`}</div>`;
}
function haveResultsHTML(){
  const res=ui.haveRes; if(!res)return '';
  if(!res.length)return `<p class="note">None of your saved recipes use those ingredients yet.</p>`;
  return `<div style="margin-top:12px">${res.map(x=>{
    const all=x.have===x.total;
    return `<button class="hres" data-act="open" data-id="${x.r.id}"><div class="mini">${photoHTML(x.r)}</div><div style="flex:1;min-width:0"><b>${esc(x.r.name)}</b>
    <span class="have-line">${all?`You have all ${x.total} ingredients on the list.`:`You already have ${x.have} of ${x.total} ingredients.`}</span>
    <div class="meter"><i style="width:${Math.round(x.have/x.total*100)}%"></i></div>
    ${all?'':`<span class="need">Still need: ${esc(x.missing.slice(0,4).join(', '))}${x.missing.length>4?` +${x.missing.length-4} more`:''}</span>`}</div></button>`}).join('')}</div>`;
}
function runHave(){
  const terms=ui.have.split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean);
  if(!terms.length){ui.haveRes=null;toast('Type at least one ingredient first.');return}
  ui.haveRes=DB.recipes.map(r=>{
    const req=requiredIngs(r); if(!req.length)return null;
    const got=req.filter(i=>terms.some(t=>matchTerm(t,i.name)));
    return {r,have:got.length,total:req.length,missing:req.filter(i=>!got.includes(i)).map(i=>i.name)};
  }).filter(x=>x&&x.have>0).sort((a,b)=>b.have-a.have||(b.have/b.total)-(a.have/a.total));
}
function section(title,list,emptyMsg,emptySmall,link){
  return `<section><div class="sec-head"><h2>${title}</h2>${list.length&&link?link:''}</div>${list.length?`<div class="hscroll">${list.map(r=>card(r,'h')).join('')}</div>`:empty(emptyMsg,emptySmall)}</section>`;
}
function screenHome(){
  const byUpd=(a,b)=>b.updatedAt-a.updatedAt;
  const adapted=DB.recipes.filter(r=>['adapted','ready','tested'].includes(r.status)).sort(byUpd).slice(0,8);
  const favs=DB.recipes.filter(r=>r.favorite).sort(byUpd);
  const waiting=DB.recipes.filter(r=>r.status==='ready'||r.status==='tested').sort(byUpd);
  const appr=DB.recipes.filter(r=>r.status==='approved').sort((a,b)=>(b.approvedAt||b.updatedAt)-(a.approvedAt||a.updatedAt)).slice(0,8);
  const hasDraft=draft&&(draft.name||draft.originalRecipe||draft.referencePhoto||draft.originalIngredients);
  const wizOn=W&&((W.stage&&W.stage!=='import')||W.text||W.photos.length);
  let cont='';
  if(wizOn)cont+=`<button class="continue" data-act="add"><span class="dot">${I.spark}</span><span><b>Pick up where you left off</b><span>${esc((W.found&&W.found.name)||'Your recipe in progress')}</span></span></button>`;
  if(hasDraft)cont+=`<button class="continue" data-act="manual-resume"><span class="dot">${I.pen}</span><span><b>Unfinished manual recipe</b><span>${esc(draft.name||'Untitled')}</span></span></button>`;
  return `
  <header class="hero"><div class="awning" aria-hidden="true"></div>
    <div class="hero-in"><div class="sticker" aria-hidden="true">baked your way</div>
      <h1 class="wordmark">MY <i>KITCHEN</i></h1>
      <p class="hero-line">Your recipes. Your body. Your goals.</p>
      <p class="hero-sub">Turn recipes you love into recipes that work for you.</p>
    </div></header>
  <div style="margin-top:20px"><button class="btn btn-primary btn-hero" data-act="add-new">${I.spark} Make a recipe mine</button></div>
  ${cont}
  <div class="tiles">
    <button class="tile" data-act="tab" data-s="recipes"><span class="ic y">${I.book}</span><span><b>My Recipes</b><small style="display:block">${DB.recipes.length} saved</small></span></button>
    <button class="tile" data-act="tab" data-s="kitchen"><span class="ic g">${I.whisk}</span><span><b>Test Kitchen</b><small style="display:block">${waiting.length} waiting</small></span></button>
  </div>
  <div class="search" style="margin-top:20px">${I.search}<input id="home-q" type="search" placeholder="Search my recipes..." value="${esc(ui.q)}" autocomplete="off" aria-label="Search my recipes"></div>
  <div id="home-results">${homeResults()}</div>
  ${section('Recently adapted',adapted,'Nothing adapted yet.','Tap “Make a recipe mine” to start.')}
  ${section('Favorites',favs,'Recipes you love will live here.','Tap the heart on any recipe to keep it close.',`<button class="linkbtn" data-act="go-favs">See all</button>`)}
  ${section('Waiting for testing',waiting,'Nothing waiting to be tested.','Send a recipe to the Test Kitchen when you plan to make it.',`<button class="linkbtn" data-act="tab" data-s="kitchen">Test Kitchen</button>`)}
  ${appr.length?section('Recently approved',appr,'','',`<button class="linkbtn" data-act="go-book">My cookbook</button>`):''}
  <section class="card have">
    <h2>What do I have?</h2>
    <p class="sub">Type what's in your kitchen, one per line or with commas.</p>
    <textarea id="have" class="inp" rows="3" placeholder="Banana&#10;Oats&#10;Skyr" aria-label="Ingredients I have">${esc(ui.have)}</textarea>
    <button class="btn btn-soft" data-act="have">Find something I can make</button>
    <div id="have-res">${haveResultsHTML()}</div>
  </section>
  <section>
    <div class="sec-head"><h2>Quick filters</h2></div>
    <div class="chips">${QUICK.map(k=>`<button class="chip" data-act="quick" data-f="${k}">${FILTERS[k].label}</button>`).join('')}</div>
  </section>`;
}

/* ============ RECIPES ============ */
function filteredRecipes(){
  let rs=DB.recipes.slice();
  if(ui.rtab==='book')rs=rs.filter(r=>r.status==='approved');
  if(ui.rtab==='fav')rs=rs.filter(r=>r.favorite);
  if(ui.cat)rs=rs.filter(r=>r.category===ui.cat);
  ui.filters.forEach(k=>{if(FILTERS[k])rs=rs.filter(FILTERS[k].fn)});
  rs=rs.filter(r=>matchesQuery(r,ui.rq));
  const order={approved:0,tested:1,ready:2,adapted:3,idea:4};
  return rs.sort((a,b)=>(ui.rtab==='all'?order[a.status]-order[b.status]:0)||b.updatedAt-a.updatedAt);
}
function recipeList(){
  const rs=filteredRecipes(), view=DB.preferences.view==='grid'?'g':'l';
  if(!rs.length){
    const filtered=ui.filters.size||ui.cat||ui.rq.trim();
    if(filtered)return empty('No recipes match these filters.','Try removing a filter or two.',`<button class="btn btn-ghost" data-act="fclear">Clear filters</button>`);
    if(ui.rtab==='book')return empty('Your personal cookbook starts with the first recipe that earns its place.','Approved recipes from the Test Kitchen will live here.',`<button class="btn btn-soft" data-act="tab" data-s="kitchen">Go to Test Kitchen</button>`);
    if(ui.rtab==='fav')return empty('Recipes you love will live here.','Tap the heart on any recipe.');
    return empty('No recipes yet.','Start with a dessert that caught your eye.',`<button class="btn btn-primary" data-act="add-new">${I.spark} Make a recipe mine</button>`);
  }
  return `<p class="count">${rs.length} ${rs.length===1?'recipe':'recipes'}</p><div class="${view==='g'?'rgrid':'rlist'}">${rs.map(r=>card(r,view)).join('')}</div>`;
}
function screenRecipes(){
  const used=[...new Set(DB.recipes.map(r=>r.category))];
  const fcount=ui.filters.size;
  return `
  <header class="page-head"><h1 class="page-title">${ui.rtab==='book'?'My cookbook':ui.rtab==='fav'?'Favorites':'My recipes'}</h1>
    <div class="seltoggle" role="group" aria-label="Layout"><button class="${DB.preferences.view!=='grid'?'on':''}" data-act="view" data-v="list" aria-label="List view">${I.list}</button><button class="${DB.preferences.view==='grid'?'on':''}" data-act="view" data-v="grid" aria-label="Grid view">${I.grid}</button></div></header>
  <div class="search">${I.search}<input id="rq" type="search" placeholder="Search my recipes..." value="${esc(ui.rq)}" autocomplete="off" aria-label="Search my recipes"></div>
  <div class="tabs3" role="tablist">${[['all','All'],['book','Cookbook'],['fav','♡ Favorites']].map(([k,l])=>`<button role="tab" aria-selected="${ui.rtab===k}" class="${ui.rtab===k?'on':''}" data-act="rtab" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="chips scroll" style="margin-top:14px">
    <button class="chip ${fcount?'on':''}" data-act="filters">${I.sliders} Filters${fcount?` (${fcount})`:''}</button>
    ${[...ui.filters].map(k=>`<button class="chip" data-act="fremove" data-f="${k}" aria-label="Remove filter ${FILTERS[k].label}">${FILTERS[k].label} ${I.x}</button>`).join('')}
  </div>
  <div class="chips scroll">
    <button class="chip ${!ui.cat?'on':''}" data-act="cat" data-v="">All categories</button>
    ${used.map(c=>`<button class="chip ${ui.cat===c?'on':''}" data-act="cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}
  </div>
  <div id="rlist">${recipeList()}</div>`;
}

/* ============ KITCHEN ============ */
function kcard(r){
  const n=r.tests.length, last=r.tests[n-1];
  const meta=`Version ${r.currentVersion||1} — ${n?`tested ${n} ${n===1?'time':'times'}`:'not tested yet'}`;
  return `<div class="kcard"><div class="top" data-act="open" data-id="${r.id}" data-from="kitchen"><div class="thumb">${photoHTML(r)}</div><div><h3>${esc(r.name)}</h3><p class="meta">${meta}</p><div class="badges" style="margin-top:8px">${statusPill(r)}</div></div></div>
  ${last&&(last.change||last.didnt)?`<div class="last"><b>Last time:</b> ${esc(last.change||last.didnt)}</div>`:''}
  ${r.pendingRevision&&r.pendingRevision.state==='ready'?`<div class="last" style="margin-top:8px;background:var(--rasp-soft)"><b>Version ${nextVersionN(r)} is waiting for your review.</b></div>`:''}
  <div class="acts"><div class="row-btns"><button class="btn btn-ghost" data-act="open" data-id="${r.id}" data-from="kitchen">Let's make it</button><button class="btn btn-primary" data-act="howdid" data-id="${r.id}">How did it go?</button></div></div></div>`;
}
function screenKitchen(){
  const ready=DB.recipes.filter(r=>r.status==='ready'||r.status==='tested').sort((a,b)=>b.updatedAt-a.updatedAt);
  const prep=DB.recipes.filter(r=>r.status==='adapted'||r.status==='idea').sort((a,b)=>b.updatedAt-a.updatedAt);
  return `
  <header class="page-head" style="display:block"><h1 class="page-title">Test Kitchen</h1><p class="page-sub">Good recipes earn their place.</p></header>
  <section style="margin-top:6px"><div class="sec-head"><h2>Waiting to be tested</h2></div>
  ${ready.length?`<div class="stack">${ready.map(kcard).join('')}</div>`:empty('Nothing waiting to be tested.',prep.length?'Move one of the recipes below in when you are ready to make it.':'Make a recipe yours and send it here.')}
  </section>
  ${prep.length?`<section><div class="sec-head"><h2>Not in the kitchen yet</h2></div><div class="stack">${prep.map(r=>`<div class="kcard"><div class="top" data-act="open" data-id="${r.id}" data-from="kitchen"><div class="thumb">${photoHTML(r)}</div><div><h3>${esc(r.name)}</h3><div class="badges" style="margin-top:8px">${statusPill(r)}</div></div></div><div class="acts">${r.status==='adapted'?`<button class="btn btn-soft" data-act="to-kitchen" data-id="${r.id}">Send to Test Kitchen</button>`:`<button class="btn btn-soft" data-act="readapt" data-id="${r.id}">${I.spark} Make it mine</button>`}</div></div>`).join('')}</div></section>`:''}`;
}

/* ============ PROFILE — MY FOOD RULES ============ */
function ingRow(t){return `<button class="tolrow" data-act="tol-edit" data-tid="${t.id}"><span><b>${esc(t.name)}</b>${t.notes?`<small>${esc(t.notes)}</small>`:''}</span><span class="pills">${t.pref?`<span class="pill pref-${t.pref}">${t.pref==='love'?'♥ Love':'Dislike'}</span>`:''}<span class="pill tol-${t.status}">${TOL[t.status].ic} ${TOL[t.status].label}</span></span></button>`}
function engineCard(){
  const pref=DB.preferences.engine||'auto', ai=ui.aiReady;
  return `<section class="card"><h2>How My Kitchen adapts</h2>
  <p class="sub">${ai===null?'Checking whether Claude is available here…':ai?'Claude (AI) is available here. It reads recipes and photos and plans adaptations. Each use asks permission first and uses your Claude account.':'Claude isn\'t available here (for example on your own website). My Kitchen uses its built-in rules — they are not AI and handle common swaps only.'}</p>
  <div class="seg" style="margin-top:14px">${[['auto','Use Claude when available'],['rules','Built-in rules only']].map(([k,l])=>`<button class="${pref===k?'on':''}" data-act="engine" data-v="${k}">${l}</button>`).join('')}</div></section>`;
}
function screenProfile(){
  const f=ui.profFilter, P=DB.preferences;
  const ings=DB.ingredients.filter(t=>f==='all'||t.status===f||t.pref===f).sort((a,b)=>a.name.localeCompare(b.name));
  const bodyOpts=[...BODY_REQS,...P.customReqs.filter(c=>!GOALS.includes(c))];
  return `
  <header class="page-head" style="display:block"><h1 class="page-title">My Food Rules</h1><p class="page-sub">Saved here, pre-selected every time you make a recipe yours.</p></header>
  <section class="card" style="margin-top:0"><h2>Dietary requirements</h2><p class="sub">Treated as required: never traded away for better macros.</p>
    <div class="chips" style="margin-top:14px">${bodyOpts.map(q=>`<button class="chip req ${P.bodyReqs.includes(q)?'on':''}" data-act="defbody" data-v="${esc(q)}" aria-pressed="${P.bodyReqs.includes(q)}">${esc(q)}</button>`).join('')}<button class="chip add" data-act="req-custom" data-scope="profile">+ Add my own sensitivity</button></div>
  </section>
  <section class="card"><h2>My common goals</h2>
    <div class="chips" style="margin-top:14px">${GOALS.map(q=>`<button class="chip goal ${P.goals.includes(q)?'on':''}" data-act="defgoal" data-v="${esc(q)}" aria-pressed="${P.goals.includes(q)}">${esc(q)}</button>`).join('')}</div>
  </section>
  <section class="card"><div class="sec-head" style="margin-bottom:4px"><h2>My ingredients</h2><button class="linkbtn" data-act="tol-edit">+ Add</button></div>
    <p class="sub">Ingredients you tolerate, avoid, love or dislike — in your own words. My Kitchen keeps anything marked Avoid out of new versions, but never treats it as a diagnosis.</p>
    <div class="chips scroll" style="margin-top:12px">${[['all','All'],['good','Tolerate'],['caution','Caution'],['avoid','Avoid'],['unknown','Unknown'],['love','Love'],['dislike','Dislike']].map(([k,l])=>`<button class="chip ${f===k?'on':''}" data-act="proffilter" data-v="${k}">${l}</button>`).join('')}</div>
    <div>${ings.length?ings.map(ingRow).join(''):`<div class="empty" style="margin-top:10px"><p>${DB.ingredients.length?'Nothing here yet.':'No ingredients recorded yet.'}</p><small>Add them here, or tap any ingredient in a recipe's “Does this work for me?” check.</small></div>`}</div>
  </section>
  ${engineCard()}
  <section class="card"><div class="sec-head" style="margin-bottom:4px"><h2>Custom categories</h2><button class="linkbtn" data-act="cat-new">+ Add</button></div>
    <div class="chips" style="margin-top:10px">${DB.categories.custom.length?DB.categories.custom.map(c=>`<button class="chip" data-act="cat-del" data-v="${esc(c)}" aria-label="Remove ${esc(c)}">${esc(c)} ${I.x}</button>`).join(''):'<p class="sub">Built-in categories cover cakes to pancakes. Add your own here.</p>'}</div>
  </section>
  <section class="card"><h2>Nutrition settings</h2><p class="sub">Used by the “High protein”, “Lower fat” and “Higher fiber” filters, per serving.</p>
    <label class="thr"><span>High protein: at least (g)</span><input class="inp" inputmode="decimal" data-pref="protein" value="${esc(P.thresholds.protein)}"></label>
    <label class="thr"><span>Lower fat: at most (g)</span><input class="inp" inputmode="decimal" data-pref="fat" value="${esc(P.thresholds.fat)}"></label>
    <label class="thr"><span>Higher fiber: at least (g)</span><input class="inp" inputmode="decimal" data-pref="fiber" value="${esc(P.thresholds.fiber)}"></label>
    <div class="field"><span>Values I type in come from</span><div class="seg">${[['estimated','My estimates'],['label','Product labels']].map(([k,l])=>`<button class="${P.nutritionStatus===k?'on':''}" data-act="defnstat" data-v="${k}">${l}</button>`).join('')}</div></div>
  </section>
  <section class="card"><h2>Backup &amp; print</h2><p class="sub">Your cookbook lives on this device. Export a backup now and then.</p>
    <div class="stack" style="margin-top:14px">
      <button class="btn btn-primary" data-act="export">${I.download} Export my cookbook</button>
      <button class="btn btn-ghost" data-act="import">${I.upload} Import my cookbook</button>
      <button class="btn btn-ghost" data-act="print-sheet">${I.print} Print cookbook</button>
    </div>
  </section>
  <section class="card about"><h2>About My Kitchen</h2>
    <p class="sub" style="margin-top:10px">Your personal recipe adaptation assistant. You bring the inspiration; My Kitchen does the complicated part: reading the recipe, checking it against your food rules, rebalancing it for your goals and calculating nutrition.</p>
    <p class="sub">Nutrition is estimated from a general reference table or from values you enter, and is never exact. Adaptations are suggestions to test, not guarantees, and nothing here is medical advice.</p>
    <div class="stack" style="margin-top:14px"><button class="btn btn-ghost" data-act="restore-examples">Add the example recipes again</button></div>
  </section>`;
}

/* ============ shared recipe bits ============ */
function groupIngs(list){const g=[];list.forEach(i=>{const k=(i.group||'').trim();let x=g.find(y=>y.k===k);if(!x){x={k,items:[]};g.push(x)}x.items.push(i)});return g}
function checksFor(id){return ui.checks[id]||(ui.checks[id]={ing:new Set(),step:new Set()})}
function tolSection(r){
  const cs=tolChecks(r);
  if(!cs.length)return `<p class="sub">Add ingredients to see how they line up with My Ingredients.</p>`;
  const av=cs.filter(c=>c.status==='avoid').length, ca=cs.filter(c=>c.status==='caution').length, un=cs.filter(c=>c.status==='unknown').length;
  let b='';
  if(av)b+=`<div class="banner tol-avoid">This recipe contains an ingredient you've marked Avoid.</div>`;
  if(ca)b+=`<div class="banner tol-caution">You've marked ${ca===1?'one ingredient':ca+' ingredients'} Caution.</div>`;
  if(un)b+=`<div class="banner tol-unknown">${un===1?'One ingredient has':un+' ingredients have'} no tolerance recorded yet. Tap to record.</div>`;
  const msg={avoid:"You've marked this ingredient Avoid.",caution:"You've marked this ingredient Caution.",unknown:"You haven't recorded your tolerance for this ingredient yet.",good:''};
  return b+cs.map(c=>`<button class="tolrow" data-act="tol-edit" ${c.tol?`data-tid="${c.tol.id}"`:`data-name="${esc(c.name)}"`}><span><b>${esc(c.name)}</b><small>${c.tol&&c.tol.notes?esc(c.tol.notes):msg[c.status]}</small></span><span class="pill tol-${c.status}">${TOL[c.status].ic} ${TOL[c.status].label}</span></button>`).join('');
}
function nutTable(cols){
  return `<table class="ntable"><thead><tr><th></th>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead><tbody>${NUT.map(k=>`<tr><td>${NUTL[k]}</td>${cols.map((c,ix)=>`<td>${c.per?(ix===cols.length-1?'<b>':'')+fmtN(c.per[k],k)+(k==='kcal'?'':' g')+(ix===cols.length-1?'</b>':''):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function missingNote(c){
  if(!c)return '';
  let h='';
  if(c.missing.length)h+=`<p class="note y"><b>Nutrition estimate incomplete.</b> Nutrition information needed for: ${esc(c.missing.join(', '))}. Add values from the product label in “Edit it myself → Nutrition”.</p>`;
  if(c.uncounted.length)h+=`<p class="sub" style="margin-top:10px">Not counted (no amount given): ${esc(c.uncounted.join(', '))}.</p>`;
  return h;
}
function nutritionDetails(r){
  const c=nut(r),s=servingsOf(r);
  if(!c.any)return `<p class="sub">Nutrition information needed.</p>${missingNote(c)}<button class="btn btn-soft" style="margin-top:12px" data-act="edit" data-id="${r.id}" data-step="4">Add nutrition</button>`;
  let h=`<p class="sub">${nLabel(r)} — ${c.sources.includes('reference')?'calculated from typical values for each ingredient':'from the values you entered'}. Never exact.</p><div class="calc">`;
  NUT.forEach(k=>{h+=`<div><b>${NUTL[k]}</b><span>${fmtN(c.total[k],k)} ${unitOf(k)} ÷ ${s} = <b>${fmtN(c.per[k],k)} ${unitOf(k)}</b></span></div>`});
  h+='</div>'+missingNote(c);
  const op=origPer(r);
  if(op&&c.complete)h+=`<h3 style="margin-top:20px">Original vs my version</h3><p class="sub">Per serving.</p>${nutTable([{label:'Original',per:op},{label:'Mine',per:c.per}])}`;
  return h;
}
function cmpTable(r){const op=origPer(r);return op?nutTable([{label:'Original',per:op},{label:'My version',per:ps(r)}]):''}
function testsHTML(r){
  if(!r.tests.length)return `<p class="sub">No tests yet.</p>`;
  const lab={yes:'Yes',no:'No',unsure:'Unsure',maybe:'Maybe with changes',little:'Too little',right:'Perfect',much:'Too much',dry:'Too dry',perfect:'Perfect',wet:'Too wet',dense:'Too dense',soft:'Too soft'};
  return r.tests.slice().reverse().map((t,i)=>`<div class="test"><h4>Test ${r.tests.length-i}${t.version?` — version ${t.version}`:''} — ${new Date(t.date).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}${t.outcome==='approved'?' — final':''}</h4>
  <div class="facts">${t.taste?`<span class="badge">Taste ${t.taste}/5</span>`:''}${t.texture?`<span class="badge">Texture ${t.texture}/5</span>`:''}${t.ease?`<span class="badge">Ease ${t.ease}/5</span>`:''}${t.sweetness?`<span class="badge">Sweetness: ${lab[t.sweetness]}</span>`:''}${t.textureIssue?`<span class="badge">${lab[t.textureIssue]}</span>`:''}${t.tolerated?`<span class="badge">Tolerated: ${lab[t.tolerated]}</span>`:''}${t.filling?`<span class="badge">Filling: ${lab[t.filling]}</span>`:''}${t.again?`<span class="badge">Again: ${t.again==='yes'?'Absolutely':lab[t.again]}</span>`:''}</div>
  ${t.worked?`<p><b>Worked:</b> ${esc(t.worked)}</p>`:''}${t.didnt?`<p><b>Didn't:</b> ${esc(t.didnt)}</p>`:''}${t.change?`<p><b>Change next time:</b> ${esc(t.change)}</p>`:''}</div>`).join('');
}
function fold(title,body,extra='',open=false){return `<details class="fold"${open?' open':''}><summary>${title}${extra!==''&&extra!=null?`<small>${extra}</small>`:''}${I.chev}</summary><div class="fold-body">${body}</div></details>`}
function changeCard(c){
  return `<div class="chg"><div class="chg-top"><h4>${esc(c.ingredient||'Change')}</h4><span class="pill conf-${c.confidence||'medium'}">${CONF_LABEL[c.confidence]||'Medium confidence'}</span></div>
  ${c.original?`<div class="row"><small>Original</small><span>${esc(c.original)}</span></div>`:''}
  <div class="row new"><small>My version</small><span>${esc(c.replacement)}</span></div>
  ${c.why?`<p class="why">${esc(c.why)}</p>`:''}${c.effect?`<p class="rel"><b>Estimated effect:</b> ${esc(c.effect)}</p>`:''}${c.related?`<p class="rel">${esc(c.related)}</p>`:''}</div>`;
}
function goalRows(checks,feedback){
  const icon={met:I.check,not_met:I.x,cannot_confirm:'?',unknown:'?'};
  const reqTxt={met:'Requirement met',not_met:'Not met',cannot_confirm:'I cannot confirm this'};
  let h='';
  (checks||[]).forEach(c=>{h+=`<div class="gl"><span class="ok s-${c.status}">${icon[c.status]}</span><div><b>${esc(c.requirement)}</b><small>${reqTxt[c.status]}${c.status!=='met'&&c.detail?` — ${esc(c.detail)}`:''}${c.status==='cannot_confirm'?' Check the label to be sure.':''}</small></div></div>`});
  (feedback||[]).forEach(g=>{h+=`<div class="gl"><span class="ok s-${g.status}">${icon[g.status]}</span><div><b>${esc(g.goal)}</b><small>${esc(g.text)}</small></div></div>`});
  return h||'<p class="sub">No requirements or goals were chosen.</p>';
}
function collagenCard(c,plain){
  if(!c)return '';
  const v={yes:'Yes',yes_adjust:'Yes, with adjustment',no:'Not recommended',unknown:'Not enough information'}[c.verdict]||'Not enough information';
  const cls={yes:'s-met',yes_adjust:'s-cannot_confirm',no:'s-not_met',unknown:'s-unknown'}[c.verdict]||'s-unknown';
  return `<div class="${plain?'':'card'}"><div class="chg-top"><h3>Can I add collagen?</h3><span class="pill ${cls}">${v}</span></div>
  ${c.reason?`<p class="sub" style="margin-top:8px">${esc(c.reason)}</p>`:''}
  ${c.amount?`<div class="kv"><b>Amount</b><span>${esc(c.amount)}</span></div>`:''}${c.where?`<div class="kv"><b>Where to add it</b><span>${esc(c.where)}</span></div>`:''}
  ${c.reduce?`<div class="kv"><b>Other dry ingredients</b><span>${esc(c.reduce)}</span></div>`:''}${c.liquid?`<div class="kv"><b>Liquid</b><span>${esc(c.liquid)}</span></div>`:''}${c.texture?`<div class="kv"><b>Texture</b><span>${esc(c.texture)}</span></div>`:''}
  <p class="note">${COLLAGEN_NOTE}</p></div>`;
}
function ingListHTML(list,f=1,rid=null){
  const ck=rid?checksFor(rid):null;
  return groupIngs(list).map(g=>`${g.k?`<p class="grp">${esc(g.k)}</p>`:''}${g.items.map(i=>{const t=ingText(i,f);const d=ck&&ck.ing.has(i.id);const st=ingNut(i).status;
    const inner=`<span class="t">${t.q?`<span class="amt">${esc(t.q)}</span> `:''}${esc(t.name)}${i.optional?' <span class="opt">(optional)</span>':''}${!rid&&st==='missing'?' <span class="opt">· nutrition info needed</span>':''}</span>`;
    return rid?`<button class="chk ${d?'done':''}" data-act="chk-ing" data-id="${rid}" data-i="${i.id}" role="checkbox" aria-checked="${!!d}"><span class="box">${I.check}</span>${inner}</button>`:`<div class="chk" style="cursor:default"><span class="box" style="border-color:var(--line)"></span>${inner}</div>`}).join('')}`).join('');
}
function stepsListHTML(steps,rid=null){
  const ck=rid?checksFor(rid):null;
  return steps.filter(s=>s.trim()).map((s,i)=>{const d=ck&&ck.step.has(i);return rid?`<button class="mstep ${d?'done':''}" data-act="chk-step" data-id="${rid}" data-i="${i}" role="checkbox" aria-checked="${!!d}"><span class="num">${d?I.check:String(i+1).padStart(2,'0')}</span><span class="t">${esc(s)}</span></button>`:`<div class="mstep"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="t">${esc(s)}</span></div>`}).join('');
}
function metaHTML(o){
  const items=[['Prep',o.prepTime],['Cook',o.cookTime],['Oven',o.tempText]].filter(x=>x[1]);
  return items.length?`<div class="meta3">${items.map(([k,v])=>`<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>`:'';
}

/* ============ RECIPE VIEW ============ */
const nextVersionN=r=>Math.max(0,...r.versions.map(v=>v.n))+1;
function screenRecipe(){
  const r=getR(ui.id); if(!r){ui.screen='home';return screenHome()}
  const base=servingsOf(r), sv=ui.servings[r.id]||base, f=sv/base, p=ps(r);
  const si=STATUSES.findIndex(s=>s[0]===r.status);
  let primary='';
  if(r.status==='idea')primary=`<button class="btn btn-primary" data-act="readapt" data-id="${r.id}">${I.spark} Make it mine</button>`;
  else if(r.status==='adapted')primary=`<button class="btn btn-primary" data-act="to-kitchen" data-id="${r.id}">Send to Test Kitchen</button>`;
  else if(r.status==='ready'||r.status==='tested')primary=`<button class="btn btn-primary" data-act="howdid" data-id="${r.id}">I made it — how did it go?</button>`;
  const changes=r.ingredientSubstitutions.length?r.ingredientSubstitutions:r.smartSwaps.map(s=>({ingredient:s.original,original:s.original,replacement:s.swap,why:s.why,confidence:s.confidence||''}));
  const c=r.collagen, cl=Object.fromEntries(COLLAGEN_OPTS);
  const lastNote=[...r.tests].reverse().find(t=>t.change||t.worked||t.didnt);
  const O=r.original;
  const vs=O?`<div class="vs"><div><h4>Original${O.servings?` (${O.servings})`:''}</h4><ul>${O.ingredients.map(i=>`<li>${esc(lineOf(i))}</li>`).join('')}</ul></div><div class="mine"><h4>My version (${base})</h4><ul>${r.adaptedIngredients.map(i=>`<li>${esc(lineOf(i))}</li>`).join('')}</ul></div></div>
    ${hasOrig(r)&&p.complete?`<h3 style="margin-top:18px">Per serving</h3>${cmpTable(r)}`:''}
    ${O.instructions.length?`<div class="kv"><b>Original method</b><span class="pre">${esc(O.instructions.map((s,i)=>`${i+1}. ${s}`).join('\n'))}</span></div>`:''}`:'';
  const raw=`${r.referencePhoto?`<div class="photo-box"><img src="${r.referencePhoto}" alt="Reference image"></div>`:''}${r.originalSource?`<div class="kv"><b>Source</b><span style="word-break:break-word">${esc(r.originalSource)}</span></div>`:''}${r.notes?`<div class="kv"><b>Why I wanted it</b><span>${esc(r.notes)}</span></div>`:''}${!O&&r.originalIngredients?`<div class="kv"><b>Ingredients</b><span class="pre">${esc(r.originalIngredients)}</span></div>`:''}${!O&&r.originalInstructions?`<div class="kv"><b>Instructions</b><span class="pre">${esc(r.originalInstructions)}</span></div>`:''}${r.originalRecipe?`<div class="kv"><b>Recipe text as imported</b><span class="pre">${esc(r.originalRecipe)}</span></div>`:''}`;
  return `
  <div class="topbar"><div class="left"><button class="iconbtn" data-act="back" aria-label="Back">${I.back} Back</button></div>
  <div class="right"><button class="iconbtn" data-act="print-one" data-id="${r.id}" aria-label="Print recipe">${I.print}</button><button class="iconbtn" data-act="edit" data-id="${r.id}">${I.pen} Edit</button></div></div>
  <div class="rhero">${photoHTML(r)}<button class="addphoto" data-act="photo-pick" data-target="mine" data-id="${r.id}">${I.camera} ${r.photo?'Change photo':'Add my photo'}</button></div>
  <div class="rhead"><div><p class="cat-line">${esc(r.category)} ${starsSm(r.rating)}</p><h1 class="rtitle">${esc(r.name)}</h1>
    <div class="badges" style="margin-top:10px"><span class="badge y">Version ${r.currentVersion||1}${r.finalApprovedVersion===r.currentVersion&&r.status==='approved'?' — final':''}</span>${r.adaptationEngine?`<span class="badge">${r.adaptationEngine==='claude'?'Adapted by Claude (AI)':'Adapted with built-in rules'}</span>`:''}</div></div>${heartBtn(r)}</div>
  ${r.description?`<p class="rdesc">${esc(r.description)}</p>`:''}
  <ol class="track" aria-label="Status: ${STATUS_LABEL[r.status]}">${STATUSES.map(([k,l],i)=>`<li class="${i<si?'past':i===si?'cur':''}"><i></i>${l}</li>`).join('')}</ol>
  <div class="card nsum">${p.any?`<div><div class="big">${fmtN(p.kcal,'kcal')} <small>kcal per ${unitNoun(r)}</small></div><p class="macros">${g0(p.protein)}g protein • ${g0(p.carbs)}g carbs • ${g0(p.fat)}g fat</p><div class="badges" style="margin-top:10px"><span class="badge">${nLabel(r)}</span>${p.complete?'':'<span class="badge y">Incomplete</span>'}${badgesHTML(r,6)}</div></div>`:`<div><p class="macros">Nutrition information needed</p><div class="badges" style="margin-top:8px">${badgesHTML(r,6)}</div></div>`}</div>
  ${metaHTML(r)}
  ${r.pendingRevision&&r.pendingRevision.state==='ready'?`<div style="margin-top:14px"><button class="btn btn-butter" data-act="open-revise" data-id="${r.id}">${I.spark} Review version ${nextVersionN(r)} suggestion</button></div>`:''}
  ${primary?`<div style="margin-top:14px">${primary}</div>`:''}
  <section class="card"><div class="servings"><h2>Servings</h2><div class="stepper"><button data-act="serv" data-id="${r.id}" data-d="-1" aria-label="Fewer servings">−</button><output aria-live="polite">${sv}</output><button data-act="serv" data-id="${r.id}" data-d="1" aria-label="More servings">+</button></div></div>
  ${sv!==base?`<p class="scale-note">Quantities scaled from ${base} to ${sv} servings. Per-serving nutrition stays the same. <button class="linkbtn" data-act="serv-reset" data-id="${r.id}">Reset</button></p>`:''}</section>
  <section><h2 style="margin-bottom:4px">Ingredients</h2>${r.adaptedIngredients.length?ingListHTML(r.adaptedIngredients,f,r.id):'<p class="sub">No ingredients yet.</p>'}</section>
  <section><h2 style="margin-bottom:4px">Method</h2>${stepsListHTML(r.adaptedInstructions,r.id)||'<p class="sub">No method yet.</p>'}</section>
  ${r.versionNotes?`<div class="note y" style="margin-top:20px">${esc(r.versionNotes)}</div>`:''}
  ${r.storage||r.freezer!=null?`<div class="note" style="margin-top:12px">${r.storage?`<b>Storage:</b> ${esc(r.storage)} `:''}${r.freezer===true?'<b>Freezer friendly.</b>':r.freezer===false?'<b>Not ideal for freezing.</b>':''}</div>`:''}
  <section style="margin-top:28px">
  ${fold('Nutrition details',nutritionDetails(r),p.any?nLabel(r):'')}
  ${r.requirementChecks.length||r.goalFeedback.length?fold('Did we hit your goals?',goalRows(r.requirementChecks,r.goalFeedback)):''}
  ${fold('What My Kitchen changed',changes.length?`<div class="stack" style="margin-top:6px">${changes.map(changeCard).join('')}</div>`:'<p class="sub">No changes recorded.</p>',changes.length||'')}
  ${fold('Collagen notes',r.collagenRecommendation?collagenCard(r.collagenRecommendation,true):`<div class="kv"><b>Can I add collagen?</b><span>${cl[c.status]||'Not enough information'}</span></div>${c.amount?`<div class="kv"><b>Amount</b><span>${esc(c.amount)}</span></div>`:''}${c.texture?`<div class="kv"><b>Texture</b><span>${esc(c.texture)}</span></div>`:''}${c.how?`<div class="kv"><b>How to add it</b><span>${esc(c.how)}</span></div>`:''}<p class="note">${COLLAGEN_NOTE}</p>`)}
  ${fold('Does this work for me?',tolSection(r))}
  ${fold('My test notes',lastNote?`${lastNote.worked?`<div class="kv"><b>What worked</b><span>${esc(lastNote.worked)}</span></div>`:''}${lastNote.didnt?`<div class="kv"><b>What didn't</b><span>${esc(lastNote.didnt)}</span></div>`:''}${lastNote.change?`<div class="kv"><b>Change next time</b><span>${esc(lastNote.change)}</span></div>`:''}`:'<p class="sub">Notes from your latest test show up here.</p>')}
  ${fold('Test history',testsHTML(r),r.tests.length||'')}
  ${fold('Versions',r.versions.slice().reverse().map(v=>`<div class="ver"><div><b>Version ${v.n}${v.n===r.currentVersion?' — current':''}${v.n===r.finalApprovedVersion?' — final':''}</b><small>${v.source==='claude'?'Claude (AI)':v.source==='rules'?'Built-in rules':v.source==='revision'?'From test feedback':'Made by me'} — ${new Date(v.createdAt).toLocaleDateString(undefined,{day:'numeric',month:'short'})}${v.changes&&v.changes.length?` — ${v.changes.length} changes`:''}</small></div>${v.n!==r.currentVersion?`<button class="btn btn-ghost" style="width:auto;min-height:46px;font-size:15px" data-act="use-version" data-id="${r.id}" data-v="${v.n}">Use this</button>`:''}</div>`).join(''),r.versions.length)}
  ${fold('Original recipe',(vs+raw)||'<p class="sub">Nothing saved from the original.</p>',O?'Preserved':'')}
  </section>
  <section class="stack">
    <button class="btn btn-soft" data-act="readapt" data-id="${r.id}">${I.spark} Make it mine again</button>
    <button class="btn btn-ghost" data-act="status-sheet" data-id="${r.id}">Change status</button>
    <button class="btn btn-danger" data-act="del-recipe" data-id="${r.id}">${I.trash} Delete recipe</button></section>`;
}

/* ============ MAKE IT MINE — wizard ============ */
const WIZ_STAGES=['import','found','needs','result'];
function wizBar(){const ix=WIZ_STAGES.indexOf(W.stage==='reading'?'import':W.stage==='working'?'needs':W.stage==='error'?(W.errBack||'import'):W.stage);return `<div class="wiz-steps" aria-hidden="true">${WIZ_STAGES.map((s,i)=>`<i class="${i<ix?'done':i===ix?'on':''}"></i>`).join('')}</div>`}
function engineBadge(kind){
  const ai=kind==='claude'||(kind==null&&ui.aiReady&&DB.preferences.engine!=='rules');
  return `<span class="engine ${ai?'ai':'rules'}">${ai?I.spark+' Claude (AI)':I.layers+' Built-in rules — not AI'}</span>`;
}
function wizTop(title){return `<div class="topbar"><div class="left"><button class="iconbtn" data-act="${W.stage==='import'?'tab':'wiz-back'}" data-s="home" aria-label="Back">${I.back} ${W.stage==='import'?'Home':'Back'}</button></div><div class="topbar-title">${title}</div><div class="right">${W.stage!=='import'||W.text||W.photos.length?`<button class="iconbtn" data-act="wiz-reset">Start over</button>`:'<span style="min-width:48px"></span>'}</div></div>`}
function wizImport(){
  const m=W.mode;
  const opt=(k,ic,cls,l,s)=>`<button class="opt ${m===k?'on':''}" data-act="wiz-mode" data-v="${k}"><span class="ic ${cls}">${ic}</span><span>${l}<small>${s}</small></span></button>`;
  let body='';
  if(m==='photos'){
    body=`<section style="margin-top:22px"><h2>Your photos</h2>
    ${W.photos.length?`<div class="thumbs">${W.photos.map((p,ix)=>`<div><img src="${p}" alt="Recipe photo ${ix+1}"><button data-act="wiz-photo-del" data-i="${ix}" aria-label="Remove photo">${I.x}</button></div>`).join('')}</div>`:''}
    <button class="btn btn-ghost" style="margin-top:12px" data-act="wiz-photo-add">${I.camera} ${W.photos.length?'Add another photo':'Choose photos or screenshots'}</button>
    ${ui.aiImages?`<p class="note g">Claude will read the text in your photos. You'll check everything before anything changes.</p>`:`<p class="note y"><b>Reading photos needs Claude</b>, which isn't available here. Your photos are kept as a reference — paste the recipe text below and My Kitchen will structure it.</p>
    <label class="field"><span>Recipe text</span><textarea class="inp" rows="8" data-w="text" placeholder="Paste the ingredients and method here">${esc(W.text)}</textarea></label>`}</section>`;
  }else if(m==='text'){
    body=`<label class="field" style="margin-top:22px"><span>Paste the recipe</span><small>Everything is fine — title, ingredients, method, even chatty intros.</small><textarea class="inp" rows="12" data-w="text" id="w-text" placeholder="Healthy Blueberry Muffins&#10;&#10;2 cups almond flour&#10;3 eggs&#10;…">${esc(W.text)}</textarea></label>`;
  }else if(m==='url'){
    body=`<label class="field" style="margin-top:22px"><span>Recipe link</span><input class="inp" data-w="url" id="w-url" inputmode="url" value="${esc(W.url)}" placeholder="https://…"></label>
    <p class="note y">My Kitchen can't open web pages from here, so the link is saved as the source. Copy the recipe text from the page and paste it below.</p>
    <label class="field"><span>Recipe text from the page</span><textarea class="inp" rows="9" data-w="text" placeholder="Paste the ingredients and method">${esc(W.text)}</textarea></label>`;
  }
  const canRead=(m==='photos'&&(ui.aiImages?W.photos.length:W.text.trim()))||(m&&m!=='photos'&&W.text.trim());
  return `${wizTop('Add a recipe')}${wizBar()}
  <h1 class="wtitle">Add a recipe</h1>
  <p class="sub" style="font-size:17.5px">Found something delicious? Bring it here and we'll make it work for you.</p>
  <div class="opts">
    ${opt('photos',I.camera,'r','Add photos','Photos or screenshots')}
    ${opt('text',I.paste,'y','Paste recipe','Text from anywhere')}
    ${opt('url',I.link,'g','Paste link','Plus the recipe text')}
    <button class="opt" data-act="manual-start"><span class="ic p">${I.pen}</span><span>Enter manually<small>Full control</small></span></button>
  </div>
  ${body}
  ${m?`<div class="footbar"><div class="footbar-in"><button class="btn btn-primary" data-act="wiz-read" id="w-read" ${canRead?'':'disabled'}>${I.spark} Read recipe</button></div></div>`:''}`;
}
function wizReading(){
  return `${wizTop('Reading')}${wizBar()}<div class="working"><div class="whisker">${I.whisk}</div><h1 class="wtitle">Reading your recipe…</h1>
  <p class="sub">Finding the name, servings, ingredients and steps.</p>${engineBadge(W.readingEngine)}
  <div class="stream" id="w-stream" ${W.readingEngine==='claude'?'':'hidden'}>Thinking…</div>
  ${W.readingEngine==='claude'?`<button class="btn btn-ghost" style="margin-top:22px" data-act="wiz-stop">${I.stop} Stop</button>`:''}</div>`;
}
function wIngRow(i){
  return `<div class="ingrow"><div class="top"><input class="inp" data-wing="${i.id}" data-f="amount" value="${esc(i.amount)}" placeholder="Amount" aria-label="Amount"><input class="inp" data-wing="${i.id}" data-f="unit" value="${esc(i.unit)}" placeholder="Unit" list="units" aria-label="Unit"><button class="delbtn" data-act="wing-del" data-v="${i.id}" aria-label="Remove ingredient">${I.trash}</button></div>
  <input class="inp" data-wing="${i.id}" data-f="name" value="${esc(i.name)}" placeholder="Ingredient" aria-label="Ingredient name">
  <div class="meta"><input class="inp" data-wing="${i.id}" data-f="group" value="${esc(i.group)}" placeholder="Section (optional)" aria-label="Section"><label class="optlab"><input type="checkbox" data-wing="${i.id}" data-f="optional" ${i.optional?'checked':''}> Optional</label></div></div>`;
}
function wizFound(){
  const F=W.found;
  return `${wizTop('Check the recipe')}${wizBar()}
  <h1 class="wtitle">Here's what I found</h1>
  <p class="sub">Fix anything that looks off. You won't need to retype it later.</p>${engineBadge(F.engine)}
  ${F.engine==='rules'?'<p class="note">Read with built-in text rules, which can miss things. Give it a quick check.</p>':''}
  <label class="field"><span>Recipe name</span><input class="inp" data-wf="name" value="${esc(F.name)}" placeholder="Name this recipe"></label>
  <label class="field"><span>Description</span><input class="inp" data-wf="description" value="${esc(F.description)}" placeholder="Optional"></label>
  <div class="found-meta">
    <label class="field"><span>Servings</span><input class="inp ${F.servingsNote?'warn':''}" data-wf="servings" inputmode="numeric" value="${esc(F.servings??'')}" placeholder="?"></label>
    <label class="field"><span>Oven</span><input class="inp" data-wf="tempText" value="${esc(F.tempText)}" placeholder="—"></label>
    <label class="field"><span>Cook time</span><input class="inp" data-wf="cookTime" value="${esc(F.cookTime)}" placeholder="—"></label>
  </div>
  ${F.servingsNote?`<p class="note y" style="margin-top:10px">${esc(F.servingsNote)}</p>`:''}
  <label class="field"><span>Category</span><select class="inp" data-wf="category">${allCats().map(c=>`<option ${c===(W.category||guessCat(F.name))?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
  <section><h2>Ingredients <span class="muted" style="font-size:16px">(${F.ingredients.length})</span></h2>
  <div class="stack" style="margin-top:12px">${F.ingredients.map(wIngRow).join('')}</div>
  <button class="btn btn-ghost" style="margin-top:12px" data-act="wing-add">${I.plus} Add ingredient</button></section>
  <section><h2>Method</h2>${F.instructions.length?'':'<p class="sub">No steps found. Add them, or leave it — My Kitchen can still adapt the ingredients.</p>'}
  <div class="stack" style="margin-top:12px">${F.instructions.map((s,i)=>`<div class="steprow"><span class="n">${i+1}</span><div><textarea class="inp" data-wstep="${i}" rows="2">${esc(s)}</textarea><div class="tools"><button data-act="wstep-del" data-i="${i}" aria-label="Remove step">${I.trash}</button></div></div></div>`).join('')}</div>
  <button class="btn btn-ghost" style="margin-top:12px" data-act="wstep-add">${I.plus} Add step</button></section>
  ${W.photos.length?`<section>${fold('Your photos',`<div class="thumbs">${W.photos.map(p=>`<div><img src="${p}" alt=""></div>`).join('')}</div>`)}</section>`:''}
  <div class="footbar"><div class="footbar-in"><button class="btn btn-primary" data-act="wiz-to-needs">Looks right — continue</button></div></div>`;
}
function rebuildPriorities(){
  const N=W.needs, keep=N.priorities.filter(p=>(p.kind==='req'&&N.reqs.includes(p.key))||(p.kind==='goal'&&N.goals.includes(p.key))||(p.kind==='close'&&N.keepClose));
  const reqs=N.reqs.map(k=>keep.find(p=>p.kind==='req'&&p.key===k)||{key:k,kind:'req',level:'required'});
  let goals=keep.filter(p=>p.kind!=='req');
  N.goals.forEach(k=>{if(!goals.some(p=>p.kind==='goal'&&p.key===k))goals.push({key:k,kind:'goal',level:goals.length?'preferred':'high'})});
  if(N.keepClose&&!goals.some(p=>p.kind==='close'))goals.push({key:'Keep the original texture & taste',kind:'close',level:'preferred'});
  if(goals.length&&!goals.some(g=>g.level==='high'))goals[0].level='high';
  N.priorities=[...reqs,...goals];
}
function wizNeeds(){
  const N=W.needs, P=DB.preferences;
  const bodyOpts=[...new Set([...BODY_REQS,...P.customReqs.filter(c=>!GOALS.includes(c)),...N.reqs])];
  const avoid=DB.ingredients.filter(t=>t.status==='avoid').map(t=>t.name);
  const goalsP=N.priorities.filter(p=>p.kind!=='req');
  return `${wizTop('Your needs')}${wizBar()}
  <h1 class="wtitle">Let's make it yours</h1>
  <p class="sub" style="font-size:17.5px">What matters for <b>${esc(W.found.name||'this recipe')}</b>?</p>
  <section><h2>My body &amp; food requirements</h2><p class="sub">${P.bodyReqs.length?'Pre-selected from My Food Rules. Turn any off for this recipe.':'Always treated as required.'}</p>
    <div class="chips" style="margin-top:12px">${bodyOpts.map(q=>`<button class="chip req ${N.reqs.includes(q)?'on':''}" data-act="wiz-req" data-v="${esc(q)}" aria-pressed="${N.reqs.includes(q)}">${N.reqs.includes(q)?I.check:''}${esc(q)}</button>`).join('')}<button class="chip add" data-act="req-custom" data-scope="wizard">+ Add my own sensitivity</button></div>
    ${avoid.length?`<p class="note r" style="margin-top:12px">I'll also keep out ingredients you've marked Avoid: <b>${esc(avoid.join(', '))}</b>.</p>`:''}
  </section>
  <section><h2>My goal for this recipe</h2><p class="sub">Pick as many as you like.</p>
    <div class="chips" style="margin-top:12px">${GOALS.map(q=>`<button class="chip goal ${N.goals.includes(q)?'on':''}" data-act="wiz-goal" data-v="${esc(q)}" aria-pressed="${N.goals.includes(q)}">${N.goals.includes(q)?I.check:''}${esc(q)}</button>`).join('')}</div>
    <button class="chip ${N.keepClose?'on':''}" style="margin-top:10px;white-space:normal;text-align:left;min-height:50px" data-act="wiz-close" aria-pressed="${N.keepClose}">${N.keepClose?I.check:''}${KEEP_CLOSE}</button>
  </section>
  ${N.priorities.length?`<section><h2>What matters most?</h2><p class="sub">Requirements always come first. Order your goals in case they pull in different directions.</p>
  <div class="rank">${N.priorities.map((p,ix)=>{const gi=goalsP.indexOf(p);return `<div class="rank-row"><span class="n">${ix+1}</span><div><b>${esc(p.key)}</b>${p.kind==='req'?`<span class="lock">Required</span>`:`<div class="lvl">${[['high','High priority'],['preferred','Preferred']].map(([k,l])=>`<button class="${p.level===k?'on':''}" data-act="wiz-level" data-i="${ix}" data-v="${k}">${l}</button>`).join('')}</div>`}</div>
  ${p.kind==='req'?'<span></span>':`<div class="mv"><button data-act="wiz-move" data-i="${ix}" data-d="-1" aria-label="Move up" ${gi===0?'disabled':''}>${I.up}</button><button data-act="wiz-move" data-i="${ix}" data-d="1" aria-label="Move down" ${gi===goalsP.length-1?'disabled':''}>${I.down}</button></div>`}</div>`}).join('')}</div></section>`:''}
  <p style="margin-top:22px">${engineBadge()}</p>
  <div class="footbar"><div class="footbar-in"><button class="btn btn-primary btn-xl" data-act="wiz-make" ${N.reqs.length||N.goals.length||N.keepClose?'':'disabled'}>${I.spark} Make It Mine</button></div></div>`;
}
function wizWorking(){
  const steps=['Reading what each ingredient does','Checking your requirements','Balancing moisture, structure & sweetness','Calculating nutrition'];
  const on=W.workStep||0;
  return `${wizTop('Making it yours')}${wizBar()}<div class="working"><div class="whisker">${I.whisk}</div><h1 class="wtitle">Making it yours…</h1>
  <p class="sub">${W.workEngine==='claude'?'Claude is working through the whole recipe. This can take up to a minute.':'Applying built-in rules.'}</p>${engineBadge(W.workEngine)}
  <div class="wsteps">${steps.map((s,i)=>`<div class="${i<on?'on':''}"><i>${i<on?I.check:''}</i>${s}</div>`).join('')}</div>
  <div class="stream" id="w-stream" ${W.workEngine==='claude'?'':'hidden'}>Thinking…</div>
  ${W.workEngine==='claude'?`<button class="btn btn-ghost" style="margin-top:22px" data-act="wiz-stop">${I.stop} Stop</button>`:''}</div>`;
}
function wizResult(){
  const A=W.result, O=W.found, cmp=compareNutrition(A.origNutrition,A.nutrition), noun=unitNoun({name:O.name});
  const k=cmp&&cmp.kcal;
  const ba=k?`<div class="ba"><div class="side"><small>Original</small><b>${Math.round(k.orig)}</b><span>kcal per ${noun}</span></div><span class="arrow">${I.arrowRight}</span><div class="side mine"><small>Your version</small><b>${Math.round(k.mine)}</b><span>kcal per ${noun}</span></div></div>
    <p class="delta ${k.diff>0?'up':''}">${k.diff<=0?'−':'+'}${Math.abs(Math.round(k.diff))} kcal per ${noun} <span class="muted" style="font-weight:700;font-size:15px">· Estimated</span></p>`
    :`<p class="note y"><b>Nutrition estimate incomplete,</b> so there's no before-and-after yet.${A.nutrition.missing.length?` Information needed for: ${esc(A.nutrition.missing.join(', '))}.`:''}${A.origNutrition.missing.length?` Original: ${esc(A.origNutrition.missing.join(', '))}.`:''}</p>`;
  return `${wizTop('Your recipe')}${wizBar()}
  <span class="ready-badge">${I.check} Your recipe is ready</span>
  <h1 class="rname">${esc(A.name)}</h1>
  ${A.tags.length?`<div class="badges" style="margin-top:12px">${A.tags.map(t=>`<span class="badge ${GOALS.includes(t)?'y':''}">${esc(t)}</span>`).join('')}</div>`:''}
  <div>${engineBadge(A.engine)}</div>
  ${ba}
  <section class="card"><h2>Did we hit your goals?</h2><div style="margin-top:8px">${goalRows(A.requirementChecks,A.goalFeedback)}</div></section>
  ${A.notes?`<p class="note y">${esc(A.notes)}</p>`:''}
  <section><h2>What I changed</h2>${A.changes.length?`<div class="stack" style="margin-top:12px">${A.changes.map(changeCard).join('')}</div>`:'<p class="sub" style="margin-top:8px">Nothing needed changing — this recipe already fits what you chose.</p>'}</section>
  <section>${collagenCard(A.collagen)}</section>
  <section class="card"><h2>My Recipe</h2>
    <div class="meta3"><div><small>Makes</small><b>${A.servings||'—'} ${A.servings?noun+(A.servings>1?'s':''):''}</b></div><div><small>Prep</small><b>${esc(A.prepTime||'—')}</b></div><div><small>Cook</small><b>${esc(A.cookTime||'—')}</b></div></div>
    ${A.tempText?`<p class="note" style="margin-top:10px"><b>Oven:</b> ${esc(A.tempText)}</p>`:''}
    <h3 style="margin-top:18px">Ingredients</h3>${ingListHTML(A.ingredients)}
    <h3 style="margin-top:22px">Method</h3>${stepsListHTML(A.instructions)}
    ${A.storage?`<p class="note"><b>Storage:</b> ${esc(A.storage)}</p>`:''}
    <p class="note"><b>Freezer friendly:</b> ${A.freezer===true?'Yes':A.freezer===false?'Not ideal':'Not sure'}</p>
  </section>
  <section class="card"><h2>Nutrition</h2><p class="sub">Per ${noun}. ${A.nutrition.source==='label'?'Label-based':'Estimated'} from typical ingredient values — never exact.</p>
    ${nutTable([{label:'Original',per:A.origNutrition.complete?A.origNutrition.per:null},{label:'Mine',per:A.nutrition.any?A.nutrition.per:null}])}
    ${missingNote(A.nutrition)}</section>
  <section>${fold('Original recipe',`<div class="vs"><div><h4>Original</h4><ul>${O.ingredients.map(i=>`<li>${esc(lineOf(i))}</li>`).join('')}</ul></div><div class="mine"><h4>Mine</h4><ul>${A.ingredients.map(i=>`<li>${esc(lineOf(i))}</li>`).join('')}</ul></div></div>`,'Kept safe')}</section>
  <section class="card" style="text-align:center"><h3>Want full control?</h3><p class="sub">Save it and open the ingredient and method editor.</p>
    <button class="btn btn-ghost" style="margin-top:12px" data-act="wiz-save" data-v="edit">${I.pen} Edit it myself</button>
    <div class="row-btns" style="margin-top:10px"><button class="btn btn-ghost" data-act="wiz-again">${I.refresh} Try again</button><button class="btn btn-ghost" data-act="wiz-goto" data-v="needs">Change needs</button></div></section>
  <div class="footbar"><div class="footbar-in"><button class="btn btn-ghost" style="flex:1" data-act="wiz-save" data-v="adapted">Save recipe</button><button class="btn btn-primary" style="flex:1.4" data-act="wiz-save" data-v="ready">Send to Test Kitchen</button></div></div>`;
}
function wizError(){
  return `${wizTop('Something went wrong')}${wizBar()}<div class="working"><h1 class="wtitle">That didn't work</h1><p class="sub" style="margin-top:8px">${esc(W.err||'Something went wrong.')}</p>
  <div class="stack" style="margin-top:22px">${W.errRetry?`<button class="btn btn-primary" data-act="${W.errRetry}">${I.refresh} Try again</button>`:''}${W.errRules?`<button class="btn btn-soft" data-act="${W.errRetry}" data-rules="1">Use built-in rules instead</button>`:''}<button class="btn btn-ghost" data-act="wiz-goto" data-v="${W.errBack||'import'}">Go back</button></div></div>`;
}
function screenAdd(){
  if(!W)resetWizard();
  switch(W.stage){case 'reading':return wizReading();case 'found':return wizFound();case 'needs':return wizNeeds();case 'working':return wizWorking();case 'result':return W.result?wizResult():wizNeeds();case 'error':return wizError();default:return wizImport()}
}

/* ============ REVISION (Improve this recipe) ============ */
function screenRevise(){
  const r=getR(ui.id); if(!r||!r.pendingRevision){ui.screen='kitchen';return screenKitchen()}
  const R=r.pendingRevision, n=nextVersionN(r);
  const top=`<div class="topbar"><div class="left"><button class="iconbtn" data-act="back">${I.back} Back</button></div><div class="topbar-title">Version ${n}</div><div class="right" style="min-width:48px"></div></div>`;
  if(R.state==='working')return `${top}<div class="working"><div class="whisker">${I.whisk}</div><h1 class="wtitle">Improving ${esc(r.name)}…</h1><p class="sub">Using your test notes to plan version ${n}.</p>${engineBadge(R.engine)}<div class="stream" id="w-stream" ${R.engine==='claude'?'':'hidden'}>Thinking…</div></div>`;
  if(R.state==='error')return `${top}<div class="working"><h1 class="wtitle">That didn't work</h1><p class="sub">${esc(R.error||'')}</p><div class="stack" style="margin-top:20px"><button class="btn btn-primary" data-act="revise-run" data-id="${r.id}">${I.refresh} Try again</button><button class="btn btn-soft" data-act="revise-run" data-id="${r.id}" data-rules="1">Use built-in rules instead</button><button class="btn btn-ghost" data-act="revise-discard" data-id="${r.id}">Not now</button></div></div>`;
  const P=R.proposal, c=calculateNutrition(P.ingredients,r.servings), cur=nut(r);
  return `${top}
  <span class="ready-badge">${I.spark} Version ${n} suggestion</span>
  <h1 class="rname">${esc(r.name)}</h1>${engineBadge(R.engine)}
  ${P.summary?`<p class="note">${esc(P.summary)}</p>`:''}
  <section><h2>What I'd change</h2><div class="stack" style="margin-top:12px">${P.changes.map(changeCard).join('')}</div></section>
  ${cur.complete&&c.complete?`<section class="card"><h2>Nutrition per ${unitNoun(r)}</h2>${nutTable([{label:`Version ${r.currentVersion}`,per:cur.per},{label:`Version ${n}`,per:c.per}])}</section>`:''}
  <section class="card"><h2>Version ${n}</h2><h3 style="margin-top:14px">Ingredients</h3>${ingListHTML(P.ingredients)}<h3 style="margin-top:22px">Method</h3>${stepsListHTML(P.instructions)}</section>
  <section class="stack"><button class="btn btn-ghost" data-act="revise-accept" data-id="${r.id}" data-edit="1">${I.pen} Use it, then edit myself</button><button class="btn btn-ghost" data-act="revise-discard" data-id="${r.id}">Not now</button></section>
  <div class="footbar"><div class="footbar-in"><button class="btn btn-primary" data-act="revise-accept" data-id="${r.id}">Use version ${n}</button></div></div>`;
}

/* ============ MANUAL EDITOR (Edit it myself) ============ */
const E=()=>ui.id?getR(ui.id):draft;
function ensureDraft(){if(!draft){draft={step:1,source:'',name:'',category:'Other',referencePhoto:null,originalSource:'',originalRecipe:'',originalIngredients:'',originalInstructions:'',notes:''};saveDraft()}}
function stepsBar(){
  const isNew=!ui.id, labels=['Source','Details','My version','Nutrition'];
  return `<div class="steps">${labels.map((l,i)=>{const n=i+1,locked=isNew&&n>2,done=n<ui.step;return `<button class="stepb ${n===ui.step?'on':''} ${done?'done':''}" data-act="step" data-v="${n}" ${locked?'disabled':''} aria-current="${n===ui.step?'step':'false'}"><i>${done?I.check:n}</i>${l}</button>`}).join('')}</div>`;
}
function catSelect(cur){return `<select class="inp" data-bind="category" id="cat-sel">${allCats().map(c=>`<option ${c===cur?'selected':''}>${esc(c)}</option>`).join('')}<option value="__new">+ New category…</option></select>`}
function edStep1(o){
  const src=o.source||'';
  const opt=(k,ic,l,w)=>`<button class="src ${w?'wide':''} ${src===k?'on':''}" data-act="source" data-v="${k}">${ic}<span>${l}</span></button>`;
  return `<h1 class="ed-title">What caught your eye?</h1><p class="sub">Manual mode: you type it, you decide every change.</p>
  <div class="sources">${opt('photo',I.camera,'Take photo')}${opt('shot',I.image,'Upload screenshot')}${opt('paste',I.paste,'Paste recipe')}${opt('link',I.link,'Paste link')}${opt('type',I.pen,'Type it myself',1)}</div>
  ${o.referencePhoto?`<div class="photo-box"><img src="${o.referencePhoto}" alt="Reference image"></div><div class="row-btns" style="margin-top:10px"><button class="btn btn-ghost" data-act="photo-pick" data-target="ref">Replace</button><button class="btn btn-ghost" data-act="photo-remove">Remove</button></div><p class="note">Saved as a reference image on this device.</p>`:''}
  ${!ui.id&&draft&&(draft.name||draft.originalRecipe||draft.referencePhoto||draft.originalIngredients)?`<button class="btn btn-ghost" style="margin-top:22px" data-act="draft-discard">Discard this draft and start fresh</button>`:''}
  <div class="footbar"><div class="footbar-in"><button class="btn btn-primary" data-act="next">Next</button></div></div>`;
}
function edStep2(o){
  const isNew=!ui.id;
  return `<h1 class="ed-title">Recipe details</h1><p class="sub">Only the name is needed. Fill in what helps.</p>
  <label class="field"><span>Recipe name</span><input class="inp" data-bind="name" value="${esc(o.name)}" placeholder="e.g. Lemon cheesecake bars" id="f-name"></label>
  <label class="field"><span>Category</span>${catSelect(o.category)}</label>
  <label class="field"><span>Original source</span><small>A link, book, or account name.</small><input class="inp" data-bind="originalSource" value="${esc(o.originalSource)}" placeholder="https://… or @baker" id="f-src" inputmode="url"></label>
  ${!o.referencePhoto?`<div class="field"><span>Reference image</span><button class="btn btn-ghost" data-act="photo-pick" data-target="ref">${I.image} Add a photo or screenshot</button></div>`:`<div class="field"><span>Reference image</span><div class="photo-box"><img src="${o.referencePhoto}" alt="Reference image"></div><div class="row-btns" style="margin-top:10px"><button class="btn btn-ghost" data-act="photo-pick" data-target="ref">Replace</button><button class="btn btn-ghost" data-act="photo-remove">Remove</button></div></div>`}
  <label class="field"><span>Original recipe text</span><small>Paste the whole thing here if you have it.</small><textarea class="inp" data-bind="originalRecipe" id="f-paste" rows="5">${esc(o.originalRecipe)}</textarea></label>
  <label class="field"><span>Original ingredients</span><small>One per line.</small><textarea class="inp" data-bind="originalIngredients" rows="5" placeholder="200 g almond flour&#10;2 eggs">${esc(o.originalIngredients)}</textarea></label>
  <label class="field"><span>Original instructions</span><small>One step per line.</small><textarea class="inp" data-bind="originalInstructions" rows="5">${esc(o.originalInstructions)}</textarea></label>
  <label class="field"><span>What made you want this recipe?</span><textarea class="inp" data-bind="notes" rows="3">${esc(o.notes)}</textarea></label>
  <div class="footbar"><div class="footbar-in"><button class="btn btn-ghost sq" data-act="prev" aria-label="Previous step">${I.back}</button><button class="btn btn-primary" data-act="${isNew?'save-original':'next'}">${isNew?'Save original & start adapting':'Next: my version'}</button></div></div>`;
}
function ingRowEd(i){
  return `<div class="ingrow"><div class="top"><input class="inp" data-ing="${i.id}" data-f="amount" value="${esc(i.amount)}" placeholder="100" aria-label="Amount"><input class="inp" data-ing="${i.id}" data-f="unit" value="${esc(i.unit)}" placeholder="g" list="units" aria-label="Unit"><button class="delbtn" data-act="ing-del" data-v="${i.id}" aria-label="Remove ingredient">${I.trash}</button></div>
  <input class="inp" data-ing="${i.id}" data-f="name" value="${esc(i.name)}" placeholder="Ingredient name" aria-label="Ingredient name">
  <div class="meta"><input class="inp" data-ing="${i.id}" data-f="group" value="${esc(i.group)}" placeholder="Section, e.g. Crust (optional)" aria-label="Section"><label class="optlab"><input type="checkbox" data-ing="${i.id}" data-f="optional" ${i.optional?'checked':''}> Optional</label></div></div>`;
}
function edStep3(r){
  const c=r.collagen, custom=DB.preferences.customReqs||[];
  const reqs=[...new Set([...REQS,...custom,...r.requirements])];
  const hasOrigTxt=r.original||r.originalIngredients||r.originalInstructions||r.originalRecipe||r.referencePhoto;
  const origList=r.original?r.original.ingredients.map(lineOf).join('\n'):r.originalIngredients;
  const origSteps=r.original?r.original.instructions.join('\n'):r.originalInstructions;
  return `<h1 class="ed-title">My version</h1><p class="sub">Full control. Changes save as you type.</p>
  ${hasOrigTxt?fold('Original',`${r.referencePhoto?`<div class="photo-box"><img src="${r.referencePhoto}" alt=""></div>`:''}${origList?`<div class="kv"><b>Ingredients</b><span class="pre">${esc(origList)}</span></div>`:''}${origSteps?`<div class="kv"><b>Instructions</b><span class="pre">${esc(origSteps)}</span></div>`:''}${r.originalRecipe?`<div class="kv"><b>Recipe text</b><span class="pre">${esc(r.originalRecipe)}</span></div>`:''}`):''}
  ${!r.adaptedIngredients.length&&(r.originalIngredients||r.originalRecipe||r.original)?`<div class="card" style="margin-top:16px;text-align:center"><h3>Let My Kitchen do this?</h3><p class="sub">It can read the original and build your version for you.</p><button class="btn btn-primary" style="margin-top:12px" data-act="readapt" data-id="${r.id}">${I.spark} Make it mine</button></div>`:''}
  <div class="mine-div">${I.arrowDown}My version${I.arrowDown}</div>
  <label class="field"><span>Recipe name</span><input class="inp" data-bind="name" value="${esc(r.name)}"></label>
  <label class="field"><span>Short description</span><input class="inp" data-bind="description" value="${esc(r.description)}" placeholder="What is it like?"></label>
  <div class="grid3"><label class="field"><span>Servings</span><input class="inp" data-bind="servings" value="${esc(r.servings)}" inputmode="numeric"></label><label class="field"><span>Prep</span><input class="inp" data-bind="prepTime" value="${esc(r.prepTime)}" placeholder="15 min"></label><label class="field"><span>Cook</span><input class="inp" data-bind="cookTime" value="${esc(r.cookTime)}" placeholder="20 min"></label></div>
  <div class="grid2"><label class="field"><span>Oven</span><input class="inp" data-bind="tempText" value="${esc(r.tempText)}" placeholder="175°C"></label><label class="field"><span>Category</span>${catSelect(r.category)}</label></div>
  <section><h2>Labels</h2><p class="sub">What this version is designed to be.</p>
  <div class="chips" style="margin-top:12px">${reqs.map(q=>`<button class="chip ${r.requirements.includes(q)?'on':''}" data-act="req" data-v="${esc(q)}" aria-pressed="${r.requirements.includes(q)}">${esc(q)}</button>`).join('')}<button class="chip add" data-act="req-custom" data-scope="recipe">+ Add your own</button></div></section>
  <section><h2>Ingredients</h2><p class="sub">Amount, unit and name. Use sections for crust, filling and so on.</p>
  ${!r.adaptedIngredients.length&&(r.originalIngredients||r.original)?`<button class="btn btn-soft" style="margin-top:12px" data-act="ing-from-orig">Copy the original ingredients</button>`:''}
  <div class="stack" id="ing-list" style="margin-top:12px">${r.adaptedIngredients.map(ingRowEd).join('')}</div>
  <button class="btn btn-ghost" style="margin-top:12px" data-act="ing-add">${I.plus} Add ingredient</button></section>
  <section><h2>Method</h2>
  ${!r.adaptedInstructions.length&&(r.originalInstructions||r.original)?`<button class="btn btn-soft" style="margin-top:12px" data-act="steps-from-orig">Copy the original method</button>`:''}
  <div class="stack" style="margin-top:12px">${r.adaptedInstructions.map((s,i)=>`<div class="steprow"><span class="n">${i+1}</span><div><textarea class="inp" data-stepi="${i}" rows="2" aria-label="Step ${i+1}">${esc(s)}</textarea><div class="tools"><button data-act="step-move" data-i="${i}" data-d="-1" aria-label="Move up" ${i===0?'disabled':''}>${I.up}</button><button data-act="step-move" data-i="${i}" data-d="1" aria-label="Move down" ${i===r.adaptedInstructions.length-1?'disabled':''}>${I.down}</button><button data-act="step-del" data-i="${i}" aria-label="Remove step">${I.trash}</button></div></div></div>`).join('')}</div>
  <button class="btn btn-ghost" style="margin-top:12px" data-act="step-add">${I.plus} Add step</button></section>
  <section><h2>Does this work for me?</h2><p class="sub">Compared with My Ingredients. Tap any row to record your tolerance.</p><div class="card" style="margin-top:12px;padding:10px 16px" id="tolcheck">${tolSection(r)}</div></section>
  <section><h2>Changes &amp; why</h2><p class="sub">What you changed from the original, and why.</p>
  <div class="stack" style="margin-top:12px">${r.smartSwaps.map(s=>`<div class="swap"><label class="field" style="margin-top:0"><span>Original</span><input class="inp" data-swap="${s.id}" data-f="original" value="${esc(s.original)}" placeholder="Almond flour"></label><div class="arrow">${I.arrowDown}</div><label class="field" style="margin-top:0"><span>Swap</span><input class="inp" data-swap="${s.id}" data-f="swap" value="${esc(s.swap)}" placeholder="Certified gluten-free oat flour"></label><label class="field"><span>Why</span><textarea class="inp" data-swap="${s.id}" data-f="why" rows="2">${esc(s.why)}</textarea></label><button class="btn btn-ghost" style="margin-top:10px;min-height:48px" data-act="swap-del" data-v="${s.id}">Remove</button></div>`).join('')}</div>
  <button class="btn btn-ghost" style="margin-top:12px" data-act="swap-add">${I.plus} Add a change</button></section>
  <section><h2>Can I add collagen?</h2>
  <div class="seg wrap" style="margin-top:12px">${COLLAGEN_OPTS.map(([k,l])=>`<button class="${c.status===k?'on':''}" data-act="collagen" data-v="${k}">${l}</button>`).join('')}</div>
  <label class="field"><span>Suggested amount</span><input class="inp" data-bind="collagen.amount" value="${esc(c.amount)}" placeholder="e.g. 20 g in the filling"></label>
  <label class="field"><span>Texture considerations</span><textarea class="inp" data-bind="collagen.texture" rows="2">${esc(c.texture)}</textarea></label>
  <label class="field"><span>How to add it</span><textarea class="inp" data-bind="collagen.how" rows="2">${esc(c.how)}</textarea></label>
  <p class="note">${COLLAGEN_NOTE} Don't swap it 1:1 for flour.</p></section>
  <section><h2>Notes for this version</h2><textarea class="inp" style="margin-top:10px" data-bind="versionNotes" rows="3" placeholder="Anything to remember when making it">${esc(r.versionNotes)}</textarea></section>
  <section><h2>Storage</h2><textarea class="inp" style="margin-top:10px" data-bind="storage" rows="2" placeholder="How to keep it">${esc(r.storage)}</textarea></section>
  <div class="footbar"><div class="footbar-in"><button class="btn btn-ghost sq" data-act="prev" aria-label="Previous step">${I.back}</button><button class="btn btn-primary" data-act="next">Next: nutrition</button></div></div>`;
}
function nutriSummary(r){
  const c=nut(r),s=c.servings;
  return `<h2>Total recipe</h2><div class="calc">${NUT.map(k=>`<div><b>${NUTL[k]}</b><span>${fmtN(c.total[k],k)} ${unitOf(k)}</span></div>`).join('')}</div>
  <h2 style="margin-top:20px">Per serving</h2><p class="sub">Total ÷ ${s} servings — updates when servings change.</p><div class="calc">${NUT.map(k=>`<div><b>${NUTL[k]}</b><span>${fmtN(c.total[k],k)} ÷ ${s} = <b>${fmtN(c.per[k],k)} ${unitOf(k)}</b></span></div>`).join('')}</div>
  <p class="sub" style="margin-top:12px">${nLabel(r)} — never exact.</p>${missingNote(c)}`;
}
function edStep4(r){
  const ready=['idea','adapted'].includes(r.status);
  const srcLab={reference:['Typical values','tol-good'],manual:['Entered by me','pref-love'],label:['From label','pref-love']};
  return `<h1 class="ed-title">Nutrition</h1><p class="sub">Calculated automatically from typical values where My Kitchen knows the ingredient. Type label values to override — enter them for the amount you use, not per 100 g.</p>
  <div class="field"><span>Values I type in come from</span><div class="seg">${[['estimated','My estimates'],['label','Product labels']].map(([k,l])=>`<button class="${r.nutritionStatus===k?'on':''}" data-act="nstat" data-v="${k}">${l}</button>`).join('')}</div></div>
  <label class="field"><span>Servings</span><input class="inp" data-bind="servings" value="${esc(r.servings)}" inputmode="numeric" style="max-width:140px"></label>
  <section><h2>Per ingredient</h2>
  ${r.adaptedIngredients.length?`<div class="stack" style="margin-top:12px">${r.adaptedIngredients.map(i=>{const t=ingText(i);const res=ingNut(i);const manual=i.nsrc==='manual'||i.nsrc==='label';
    const tag=res.status==='missing'?['Nutrition information needed','tol-caution']:res.status==='uncounted'?['No amount — not counted','tol-unknown']:srcLab[res.src]||['','tol-unknown'];
    return `<div class="nut-ing"><h4>${esc(t.name||'Unnamed')} <small>${esc(t.q)}</small></h4><div class="srcrow"><span class="pill ${tag[1]}" id="src-${i.id}">${tag[0]}</span>${manual?`<button class="linkbtn" data-act="nut-reset" data-v="${i.id}">Use typical values</button>`:''}</div>
    <div class="nut-grid">${NUT.map(k=>`<label>${NUTS[k]}<input class="inp" inputmode="decimal" data-ing="${i.id}" data-n="${k}" value="${manual?esc(i.n&&i.n[k]||''):''}" placeholder="${res.status==='ok'&&!manual?fmtN(res.n[k],k):'—'}" aria-label="${NUTL[k]} for ${esc(t.name)}"></label>`).join('')}</div></div>`}).join('')}</div>`:`<p class="note">Add ingredients in “My version” first.</p>`}
  </section>
  <section class="sumbox" id="nsum">${nutriSummary(r)}</section>
  <section>${fold('Compare with the original',`<p class="sub">${r.original?'Calculated from the preserved original when its nutrition is complete. ':''}Or type per-serving values for the original here.</p><div class="nut-grid" style="margin-top:12px">${NUT.map(k=>`<label>${NUTS[k]}<input class="inp" inputmode="decimal" data-bind="originalNutrition.${k}" value="${esc(r.originalNutrition[k]??'')}" placeholder="—"></label>`).join('')}</div><div id="cmpbox">${hasOrig(r)&&totals(r).any?cmpTable(r):''}</div>`)}</section>
  <div class="footbar"><div class="footbar-in"><button class="btn btn-ghost sq" data-act="prev" aria-label="Previous step">${I.back}</button><button class="btn btn-primary" data-act="finish">${ready?'Send to Test Kitchen':'Save my version'}</button></div></div>`;
}
function screenEdit(){
  if(!ui.id){ensureDraft(); if(ui.step>2)ui.step=2}
  const o=E(); if(!o){ui.screen='home';return screenHome()}
  const body=ui.step===1?edStep1(o):ui.step===2?edStep2(o):ui.step===3?edStep3(o):edStep4(o);
  return `<div class="topbar"><div class="left"><button class="iconbtn" data-act="${ui.id?'back':'tab'}" data-s="home" aria-label="Close">${I.back} ${ui.id?'Done':'Home'}</button></div><div class="topbar-title">${ui.id?esc(o.name||'Edit recipe'):'Enter manually'}</div><div class="right" style="min-width:48px"></div></div>
  ${stepsBar()}${body}`;
}

/* ============ TEST ============ */
function screenTest(){
  const r=getR(ui.id); if(!r){ui.screen='kitchen';return screenKitchen()}
  const d=r.testDraft||(r.testDraft={});
  const stars=k=>`<div class="stars" role="radiogroup">${[1,2,3,4,5].map(v=>`<button class="${(d[k]||0)>=v?'on':''}" data-act="tstar" data-k="${k}" data-v="${v}" role="radio" aria-checked="${d[k]===v}" aria-label="${v} of 5">${I.star}</button>`).join('')}</div>`;
  const seg=(k,opts,wrap)=>`<div class="seg ${wrap?'wrap':''}">${opts.map(([v,l])=>`<button class="${d[k]===v?'on':''}" data-act="tseg" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  return `<div class="topbar"><div class="left"><button class="iconbtn" data-act="back">${I.back} Back</button></div><div class="topbar-title">Test ${r.tests.length+1} — version ${r.currentVersion||1}</div><div class="right" style="min-width:48px"></div></div>
  <h1 class="ed-title" style="margin-top:12px">How did it go?</h1><p class="sub">${esc(r.name)}</p>
  <div class="qblock"><h3>Taste</h3>${stars('taste')}</div>
  <div class="qblock"><h3>Texture</h3>${stars('texture')}</div>
  <div class="qblock"><h3>Sweetness</h3>${seg('sweetness',[['little','Too little'],['right','Perfect'],['much','Too much']])}</div>
  <div class="qblock"><h3>Texture was…</h3>${seg('textureIssue',[['perfect','Perfect'],['dry','Too dry'],['wet','Too wet'],['dense','Too dense'],['soft','Too soft']],true)}</div>
  <div class="qblock"><h3>Did my body tolerate it?</h3>${seg('tolerated',[['yes','Yes'],['unsure','Unsure'],['no','No']])}</div>
  <div class="qblock"><h3>Easy to make</h3>${stars('ease')}</div>
  <div class="qblock"><h3>Filling and satisfying?</h3>${seg('filling',[['yes','Yes'],['unsure','Unsure'],['no','No']])}</div>
  <label class="field qblock"><span>Notes — what would I change?</span><textarea class="inp" rows="4" data-test="change">${esc(d.change||'')}</textarea></label>
  <label class="field"><span>What worked?</span><textarea class="inp" rows="2" data-test="worked">${esc(d.worked||'')}</textarea></label>
  <label class="field"><span>What didn't?</span><textarea class="inp" rows="2" data-test="didnt">${esc(d.didnt||'')}</textarea></label>
  <section class="card" style="text-align:center"><h3>Not quite there?</h3><p class="sub">My Kitchen uses these notes to suggest version ${nextVersionN(r)}.</p>
    <button class="btn btn-soft" style="margin-top:12px" data-act="test-improve">${I.spark} Improve this recipe</button>
    <button class="btn btn-ghost" style="margin-top:10px" data-act="test-again">Just save this test</button></section>
  ${r.tests.length?`<section>${fold('Earlier tests',testsHTML(r),r.tests.length)}</section>`:''}
  <div class="footbar"><div class="footbar-in"><button class="btn btn-primary" data-act="test-approve">${I.check} Perfect — save as my final recipe</button></div></div>`;
}
const SCREENS={home:screenHome,recipes:screenRecipes,kitchen:screenKitchen,profile:screenProfile,recipe:screenRecipe,edit:screenEdit,test:screenTest,add:screenAdd,revise:screenRevise};
