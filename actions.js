'use strict';
/* ============ sheets ============ */
let sheetState={};
function openSheet(html){closeSheet();const s=document.createElement('div');s.id='sheetwrap';s.innerHTML=`<div class="scrim" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet-in"><div class="grab"></div>${html}</div></div>`;document.body.appendChild(s);document.body.style.overflow='hidden';const f=$('.sheet [autofocus]',s);if(f)setTimeout(()=>f.focus(),60)}
function closeSheet(){const s=$('#sheetwrap');if(s)s.remove();document.body.style.overflow=''}
function confirmSheet(title,msg,okLabel,fn,danger){sheetState={confirm:fn};openSheet(`<h2>${title}</h2>${msg?`<p class="sub" style="margin-top:8px">${msg}</p>`:''}<button class="btn ${danger?'btn-danger':'btn-primary'}" data-act="confirm-ok">${okLabel}</button><button class="btn btn-ghost" data-act="sheet-close">Cancel</button>`)}
function filterSheet(){
  const n=filteredRecipes().length;
  openSheet(`<h2>Filters</h2>${FILTER_GROUPS.map(([g,ks])=>`<p class="grp" style="margin-top:18px">${g}</p><div class="chips" style="margin-top:8px">${ks.map(k=>`<button class="chip ${ui.filters.has(k)?'on':''}" data-act="ftoggle" data-f="${k}" aria-pressed="${ui.filters.has(k)}">${FILTERS[k].label}</button>`).join('')}</div>`).join('')}
  <p class="sub" style="margin-top:14px">Calorie and macro filters use per-serving nutrition. Thresholds live in Profile.</p>
  <button class="btn btn-primary" data-act="sheet-close" data-rerender="1">Show ${n} ${n===1?'recipe':'recipes'}</button>${ui.filters.size?`<button class="btn btn-ghost" data-act="fclear">Clear all</button>`:''}`);
}
function tolSheet(t,name){
  sheetState={tid:t?t.id:null,status:t?t.status:'unknown',pref:t?t.pref||'':''};
  openSheet(`<h2>${t?'Edit ingredient':'Record an ingredient'}</h2>
  <label class="field"><span>Ingredient</span><small>Use a short name so it matches across recipes, like “oats” or “raspberries”.</small><input class="inp" id="tol-name" value="${esc(t?t.name:name||'')}" ${t?'':'autofocus'}></label>
  <div class="field"><span>How does it work for me?</span>${Object.entries(TOL).map(([k,v])=>`<button class="statusopt ${sheetState.status===k?'on':''}" data-act="tol-choose" data-v="${k}" aria-pressed="${sheetState.status===k}"><span class="ic tol-${k}">${v.ic}</span><span><b>${v.label}</b><small>${v.desc}</small></span></button>`).join('')}</div>
  <div class="field"><span>Do I like it?</span><div class="seg">${[['love','♥ Love'],['dislike','Dislike'],['','No preference']].map(([k,l])=>`<button class="${(sheetState.pref||'')===k?'on':''}" data-act="pref-choose" data-v="${k}">${l}</button>`).join('')}</div></div>
  <label class="field"><span>Notes</span><textarea class="inp" id="tol-notes" rows="3" placeholder="e.g. Fine in small amounts">${esc(t?t.notes:'')}</textarea></label>
  <button class="btn btn-primary" data-act="tol-save">Save</button>${t?`<button class="btn btn-ghost" data-act="tol-del">Remove from My Ingredients</button>`:''}`);
}
function textSheet(title,label,act,ph){openSheet(`<h2>${title}</h2><label class="field"><span>${label}</span><input class="inp" id="sheet-text" placeholder="${esc(ph||'')}" autofocus></label><button class="btn btn-primary" data-act="${act}">Add</button>`)}

/* ============ photos ============ */
function compress(file,max=1100,q=.8){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=()=>{let w=img.naturalWidth,h=img.naturalHeight;const s=Math.min(1,max/Math.max(w,h));w=Math.round(w*s);h=Math.round(h*s);const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);res(c.toDataURL('image/jpeg',q))};img.onerror=()=>rej(new Error('img'));img.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}
let photoTarget=null;
function pickPhoto(target,id,capture){
  photoTarget={target,id};
  const inp=$(capture?'#file-cam':'#file-img'); inp.value=''; inp.click();
}
async function onPhoto(file){
  if(!file||!photoTarget)return;
  try{
    const data=await compress(file);
    if(photoTarget.target==='mine'){const r=getR(photoTarget.id);if(r){r.photo=data;r.updatedAt=Date.now();persist()}}
    else{const o=E();if(o){o.referencePhoto=data;if(ui.id)persist();else{draft.step=Math.max(draft.step||1,1);saveDraft()}}
      if(!ui.id&&ui.step===1){ui.step=2;draft.step=2;saveDraft()}}
    render(); toast('Photo saved');
  }catch(e){toast("That image couldn't be opened. Try a JPG or PNG.")}
}

/* ============ export / import / print ============ */
async function getCap(name){try{if(window.claude&&typeof window.claude.use==='function')return await window.claude.use(name)}catch(e){}return null}
async function saveFile(filename,text,mime){
  const dl=await getCap('downloads');
  if(dl){try{await dl.save({filename,data:text});toast('Saved');return true}catch(e){if(e&&e.code==='declined'){toast('Download cancelled');return false}}}
  try{const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('Download started');return true}catch(e){toast("Download isn't available here. Use Copy instead.");return false}
}
const backupText=()=>{persist();return JSON.stringify({app:'My Kitchen',exportedAt:new Date().toISOString(),data:DB},null,1)};
function exportSheet(){
  openSheet(`<h2>Export my cookbook</h2><p class="sub" style="margin-top:8px">Everything in one file: recipes, photos, tests, My Ingredients and settings. Keep it somewhere safe.</p>
  <button class="btn btn-primary" data-act="export-dl">${I.download} Download backup file</button>
  <button class="btn btn-ghost" data-act="export-copy">${I.copy} Copy backup as text</button>
  <textarea class="inp" id="export-text" rows="3" readonly style="margin-top:14px;font-size:13px;display:none"></textarea>`);
}
function importSheet(){
  openSheet(`<h2>Import my cookbook</h2><p class="sub" style="margin-top:8px">Restores a backup exported from My Kitchen. This replaces everything currently on this device.</p>
  <button class="btn btn-primary" data-act="import-file">${I.upload} Choose backup file</button>
  <label class="field"><span>Or paste backup text</span><textarea class="inp" id="import-text" rows="4" placeholder="{&quot;app&quot;:&quot;My Kitchen&quot;…"></textarea></label>
  <button class="btn btn-ghost" data-act="import-paste">Restore from pasted text</button>`);
}
function doImport(text){
  let obj; try{obj=JSON.parse(text)}catch(e){toast("That isn't a My Kitchen backup.");return}
  const d=obj&&obj.data?obj.data:obj;
  if(!d||!Array.isArray(d.recipes)){toast("That isn't a My Kitchen backup.");return}
  confirmSheet('Replace everything?',`This backup has ${d.recipes.length} ${d.recipes.length===1?'recipe':'recipes'}. Your current data on this device will be replaced.`,'Replace with backup',()=>{DB=normalize(d);persist();ui.servings={};ui.checks={};nav('home',{reset:true});toast('Cookbook restored')},true);
}
function printRecipeHTML(r){
  const p=ps(r);
  const ings=groupIngs(r.adaptedIngredients).map(g=>`${g.k?`<h3>${esc(g.k)}</h3>`:''}<ul>${g.items.map(i=>{const t=ingText(i);return `<li>☐ ${esc(t.q)} ${esc(t.name)}${i.optional?' (optional)':''}</li>`}).join('')}</ul>`).join('');
  return `<section class="p-recipe"><h1>${esc(r.name)}</h1><p class="p-meta">${esc(r.category)} — Serves ${servingsOf(r)}${p.any?` — Per serving (${nLabel(r).toLowerCase()}): ${fmtN(p.kcal,'kcal')} kcal, ${fmtN(p.protein)} g protein, ${fmtN(p.carbs)} g carbs, ${fmtN(p.fat)} g fat, ${fmtN(p.fiber)} g fiber`:''}</p>
  ${r.description?`<p>${esc(r.description)}</p>`:''}${r.requirements.length?`<p class="p-meta">${esc(r.requirements.join(', '))}</p>`:''}
  <h2>Ingredients</h2>${ings||'<p>—</p>'}<h2>Method</h2><ol>${r.adaptedInstructions.filter(s=>s.trim()).map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
  ${r.versionNotes?`<h2>Notes</h2><p>${esc(r.versionNotes)}</p>`:''}
  ${r.smartSwaps.length?`<h2>Smart swaps</h2><ul>${r.smartSwaps.map(s=>`<li>${esc(s.original)} → ${esc(s.swap)}${s.why?` — ${esc(s.why)}`:''}</li>`).join('')}</ul>`:''}
  ${r.collagen.amount?`<h2>Collagen</h2><p>${esc(r.collagen.amount)}${r.collagen.how?` — ${esc(r.collagen.how)}`:''}</p>`:''}</section>`;
}
function doPrint(recipes){
  $('#print-root').innerHTML=recipes.map(printRecipeHTML).join('');
  closeSheet();
  setTimeout(()=>{try{window.print()}catch(e){toast("Printing isn't available here. Try “Save printable page”.")}},80);
}
function printableDoc(recipes){return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Kitchen</title><style>body{font:12pt/1.55 Georgia,serif;color:#222;max-width:700px;margin:24px auto;padding:0 18px}h1{font-size:24pt;margin:0 0 4pt}h2{font:700 13pt Helvetica,Arial,sans-serif;border-bottom:1px solid #ccc;padding-bottom:3pt;margin:16pt 0 4pt}h3{font:600 11pt Helvetica,Arial,sans-serif;margin:8pt 0 2pt}ul{list-style:none;padding:0}.p-meta{color:#555;font:10pt Helvetica,Arial,sans-serif}.p-recipe{page-break-after:always;margin-bottom:40px}.p-recipe:last-child{page-break-after:auto}</style></head><body>${recipes.map(printRecipeHTML).join('')}</body></html>`}
function printSheet(single){
  if(single){const r=getR(single);openSheet(`<h2>Print recipe</h2><p class="sub" style="margin-top:8px">${esc(r.name)}, in a clean printer-friendly layout.</p><button class="btn btn-primary" data-act="print-go" data-id="${r.id}">${I.print} Print</button><button class="btn btn-ghost" data-act="print-save" data-id="${r.id}">${I.download} Save printable page</button>`);return}
  const appr=DB.recipes.filter(r=>r.status==='approved');
  if(!appr.length){openSheet(`<h2>Print cookbook</h2>${empty('Your personal cookbook starts with the first recipe that earns its place.','Approved recipes can be printed here.')}<button class="btn btn-ghost" data-act="sheet-close">Close</button>`);return}
  openSheet(`<h2>Print cookbook</h2><p class="sub" style="margin-top:8px">Choose approved recipes to print.</p><div style="margin-top:12px">${appr.map(r=>`<label class="printpick"><input type="checkbox" class="pp" value="${r.id}" checked> ${esc(r.name)}</label>`).join('')}</div>
  <button class="btn btn-primary" data-act="print-go">${I.print} Print selected</button><button class="btn btn-ghost" data-act="print-save">${I.download} Save printable page</button>`);
}
const pickedForPrint=el=>el.dataset.id?[getR(el.dataset.id)]:$$('.pp').filter(x=>x.checked).map(x=>getR(x.value)).filter(Boolean);

/* ============ actions ============ */
function touch(){const o=E();if(!o)return;if(ui.id){o.updatedAt=Date.now();persistSoon()}else saveDraft()}
function setPath(o,path,v){const ks=path.split('.');let x=o;for(let i=0;i<ks.length-1;i++)x=x[ks[i]];x[ks[ks.length-1]]=v}
function refreshTol(){const b=$('#tolcheck');const r=E();if(b&&r&&ui.id)b.innerHTML=tolSection(r,true)}
function updNutri(){const r=E();if(!r||!ui.id)return;const n=$('#nsum');if(n)n.innerHTML=nutriSummary(r);const c=$('#cmpbox');if(c)c.innerHTML=hasOrig(r)&&totals(r).any?cmpTable(r):''}
function celebrate(cb){const k=document.createElement('div');k.className='keeper';k.setAttribute('role','status');k.innerHTML=`<div class="k"><div class="ring">${I.check}</div><h2>This one's a keeper.</h2><p>Added to your cookbook.</p></div>`;document.body.appendChild(k);setTimeout(()=>{k.remove();cb&&cb()},1500)}
function startAdd(fresh){
  if(fresh&&draft&&(draft.name||draft.originalRecipe||draft.referencePhoto||draft.originalIngredients)){ui.id=null;ui.step=draft.step||1;nav('edit',{id:null,step:draft.step||1,reset:true});return}
  if(fresh||!draft){draft=null;ensureDraft()}
  nav('edit',{id:null,step:draft.step||1,reset:true});
}
function goStep(n){
  const o=E(); if(!o)return;
  if(ui.id&&ui.step===3&&n!==3&&o.status==='idea'&&o.adaptedIngredients.length){o.status='adapted';persist()}
  ui.step=n; if(!ui.id){draft.step=n;saveDraft()}
  render(); window.scrollTo(0,0);
}
function saveOriginal(){
  const d=draft; if(!d.name.trim()){toast('Give the recipe a name first.');const f=$('#f-name');if(f)f.focus();return}
  const r=newRecipe({name:d.name.trim(),category:d.category||'Other',referencePhoto:d.referencePhoto,originalSource:d.originalSource,originalRecipe:d.originalRecipe,originalIngredients:d.originalIngredients,originalInstructions:d.originalInstructions,notes:d.notes,status:'idea'});
  DB.recipes.unshift(r); persist(); draft=null; saveDraft();
  ui.stack=[]; ui.id=r.id; ui.step=3; render(); window.scrollTo(0,0); toast('Original saved');
}
const ACT={
  tab:el=>{const s=el.dataset.s;if(s==='add'||s==='edit')return openWizard();ui.from=s;nav(s,{reset:true,id:null})},
  'add-new':()=>openWizard(), add:()=>openWizard(),
  'manual-start':()=>startAdd(true), 'manual-resume':()=>startAdd(false),
  back:()=>goBack(),
  open:el=>{ui.from=el.dataset.from||(ui.screen==='recipe'?ui.from:ui.screen==='home'?'home':ui.screen==='kitchen'?'kitchen':'recipes');nav('recipe',{id:el.dataset.id})},
  fav:el=>{const r=getR(el.dataset.id);if(!r)return;r.favorite=!r.favorite;persist();const y=window.scrollY;render();window.scrollTo(0,y);$$(`.heart[data-id="${r.id}"]`).forEach(h=>h.classList.add('pop'))},
  have:()=>{runHave();$('#have-res').innerHTML=haveResultsHTML()},
  quick:el=>{ui.filters=new Set([el.dataset.f]);ui.rtab='all';ui.cat='';ui.rq='';ui.from='recipes';nav('recipes',{reset:true})},
  'go-favs':()=>{ui.rtab='fav';ui.filters.clear();ui.from='recipes';nav('recipes',{reset:true})},
  'go-book':()=>{ui.rtab='book';ui.filters.clear();ui.from='recipes';nav('recipes',{reset:true})},
  rtab:el=>{ui.rtab=el.dataset.v;render()},
  view:el=>{DB.preferences.view=el.dataset.v;persist();render()},
  filters:()=>filterSheet(),
  ftoggle:el=>{const k=el.dataset.f;ui.filters.has(k)?ui.filters.delete(k):ui.filters.add(k);filterSheet()},
  fclear:()=>{ui.filters.clear();ui.cat='';ui.rq='';closeSheet();render()},
  fremove:el=>{ui.filters.delete(el.dataset.f);render()},
  cat:el=>{ui.cat=el.dataset.v;render()},
  'sheet-close':el=>{closeSheet();if(el.dataset.rerender)render()},
  'confirm-ok':()=>{const f=sheetState.confirm;closeSheet();f&&f()},
  /* editor */
  source:el=>{const v=el.dataset.v;if(!ui.id)ensureDraft();const o=E();o.source=v;touch();render();
    if(v==='photo')return pickPhoto('ref',null,true);
    if(v==='shot')return pickPhoto('ref',null,false);
    ui.srcFocus=v;goStep(2);setTimeout(()=>{const f=v==='paste'?$('#f-paste'):v==='link'?$('#f-src'):$('#f-name');if(f)f.focus()},80)},
  step:el=>goStep(+el.dataset.v),
  next:()=>{if(ui.step===3&&ui.id){const r=E();if(r.status==='idea'&&r.adaptedIngredients.length){r.status='adapted'}persist()}goStep(Math.min(4,ui.step+1))},
  prev:()=>goStep(Math.max(1,ui.step-1)),
  'save-original':()=>saveOriginal(),
  'draft-discard':()=>confirmSheet('Discard this draft?','What you entered for this unfinished recipe will be removed.','Discard draft',()=>{draft=null;saveDraft();ensureDraft();ui.step=1;render()},true),
  edit:el=>{ui.from=ui.from||'recipes';nav('edit',{id:el.dataset.id,step:+(el.dataset.step||3)})},
  'photo-pick':el=>pickPhoto(el.dataset.target,el.dataset.id,false),
  'photo-remove':()=>{const o=E();o.referencePhoto=null;touch();if(ui.id)persist();render()},
  req:el=>{const r=E(),v=el.dataset.v,i=r.requirements.indexOf(v);i>=0?r.requirements.splice(i,1):r.requirements.push(v);el.classList.toggle('on');el.setAttribute('aria-pressed',i<0);touch()},
  'req-custom':el=>{sheetState={scope:el.dataset.scope};textSheet('Add a requirement','Requirement','req-save','e.g. Low FODMAP-friendly')},
  'req-save':()=>{const v=($('#sheet-text').value||'').trim();if(!v)return;const P=DB.preferences;P.customReqs=P.customReqs||[];if(!REQS.includes(v)&&!P.customReqs.includes(v))P.customReqs.push(v);
    if(sheetState.scope==='recipe'){const r=E();if(!r.requirements.includes(v))r.requirements.push(v);touch()}
    else if(sheetState.scope==='wizard'){if(!W.needs.reqs.includes(v))W.needs.reqs.push(v);rebuildPriorities();saveW()}
    else if(!P.bodyReqs.includes(v))P.bodyReqs.push(v);
    persist();closeSheet();render()},
  'ing-add':()=>{const r=E();r.adaptedIngredients.push({id:uid(),group:(r.adaptedIngredients.at(-1)||{}).group||'',amount:'',unit:'',name:'',optional:false,n:{}});touch();persist();render();const l=$$('#ing-list .ingrow').at(-1);if(l){l.scrollIntoView({block:'center'});$('input',l).focus()}},
  'ing-del':el=>{const r=E();r.adaptedIngredients=r.adaptedIngredients.filter(i=>i.id!==el.dataset.v);touch();persist();render()},
  'ing-from-orig':()=>{const r=E();r.adaptedIngredients=r.original?clone(r.original.ingredients).map(i=>({...i,id:uid(),n:{}})):lines(r.originalIngredients).map(parseLine).filter(Boolean).map(p=>({id:uid(),group:'',optional:false,n:{},...p}));touch();persist();render();toast('Copied. Now make your changes.')},
  'steps-from-orig':()=>{const r=E();r.adaptedInstructions=r.original?[...r.original.instructions]:lines(r.originalInstructions).map(s=>s.replace(/^\d+[.)]\s*/,''));touch();persist();render()},
  'step-add':()=>{const r=E();r.adaptedInstructions.push('');touch();persist();render();const t=$$('[data-stepi]').at(-1);if(t){t.scrollIntoView({block:'center'});t.focus()}},
  'step-del':el=>{const r=E();r.adaptedInstructions.splice(+el.dataset.i,1);touch();persist();render()},
  'step-move':el=>{const r=E(),i=+el.dataset.i,j=i+ +el.dataset.d;if(j<0||j>=r.adaptedInstructions.length)return;const a=r.adaptedInstructions;[a[i],a[j]]=[a[j],a[i]];touch();persist();render()},
  'swap-add':()=>{const r=E();r.smartSwaps.push({id:uid(),original:'',swap:'',why:''});touch();persist();render()},
  'swap-del':el=>{const r=E();r.smartSwaps=r.smartSwaps.filter(s=>s.id!==el.dataset.v);touch();persist();render()},
  collagen:el=>{const r=E();r.collagen.status=el.dataset.v;touch();$$('[data-act="collagen"]').forEach(b=>b.classList.toggle('on',b===el))},
  nstat:el=>{const r=E();r.nutritionStatus=el.dataset.v;touch();persist();render()},
  finish:()=>{const r=E();if(['idea','adapted'].includes(r.status)){if(!r.adaptedIngredients.length){toast('Add your ingredients in “My version” first.');return}r.status='ready';r.updatedAt=Date.now();persist();ui.from='kitchen';nav('kitchen',{reset:true});toast('Saved to Test Kitchen')}else{persist();ui.stack=[];nav('recipe',{id:r.id,push:false});toast('Saved')}},
  /* tolerance */
  'tol-edit':el=>{const t=el.dataset.tid?DB.ingredients.find(x=>x.id===el.dataset.tid):null;tolSheet(t,el.dataset.name||'')},
  'tol-choose':el=>{sheetState.status=el.dataset.v;$$('.statusopt').forEach(b=>{const on=b.dataset.v===el.dataset.v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})},
  'tol-save':()=>{const name=($('#tol-name').value||'').trim();if(!name){toast('Add the ingredient name.');return}const notes=$('#tol-notes').value;
    let t=sheetState.tid?DB.ingredients.find(x=>x.id===sheetState.tid):DB.ingredients.find(x=>x.name.toLowerCase()===name.toLowerCase());
    if(!t){t={id:uid(),name,status:sheetState.status,pref:sheetState.pref||'',notes,updatedAt:Date.now()};DB.ingredients.push(t)}else Object.assign(t,{name,status:sheetState.status,pref:sheetState.pref||'',notes,updatedAt:Date.now()});
    persist();closeSheet();const y=window.scrollY;render();window.scrollTo(0,y);toast('Saved to My Ingredients')},
  'tol-del':()=>{DB.ingredients=DB.ingredients.filter(x=>x.id!==sheetState.tid);persist();closeSheet();render()},
  proffilter:el=>{ui.profFilter=el.dataset.v;render()},
  defbody:el=>{const P=DB.preferences,v=el.dataset.v,i=P.bodyReqs.indexOf(v);i>=0?P.bodyReqs.splice(i,1):P.bodyReqs.push(v);persist();el.classList.toggle('on');el.setAttribute('aria-pressed',i<0)},
  defgoal:el=>{const P=DB.preferences,v=el.dataset.v,i=P.goals.indexOf(v);i>=0?P.goals.splice(i,1):P.goals.push(v);persist();el.classList.toggle('on');el.setAttribute('aria-pressed',i<0)},
  engine:el=>{DB.preferences.engine=el.dataset.v;persist();render()},
  'pref-choose':el=>{sheetState.pref=el.dataset.v;$$('[data-act="pref-choose"]').forEach(b=>b.classList.toggle('on',b===el))},
  defnstat:el=>{DB.preferences.nutritionStatus=el.dataset.v;persist();render()},
  'cat-new':()=>{sheetState={};textSheet('New category','Category name','cat-save','e.g. Breakfast Treats')},
  'cat-save':()=>{const v=($('#sheet-text').value||'').trim();if(!v)return;if(!allCats().includes(v))DB.categories.custom.push(v);if(sheetState.forRecipe){const o=E();if(o){o.category=v;touch()}}persist();closeSheet();render()},
  'cat-del':el=>{const v=el.dataset.v;confirmSheet(`Remove “${esc(v)}”?`,'Recipes in this category keep their label.','Remove',()=>{DB.categories.custom=DB.categories.custom.filter(c=>c!==v);persist();render()},true)},
  /* recipe view */
  serv:el=>{const r=getR(el.dataset.id);const cur=ui.servings[r.id]||servingsOf(r);ui.servings[r.id]=Math.max(1,cur+ +el.dataset.d);const y=window.scrollY;render();window.scrollTo(0,y)},
  'serv-reset':el=>{delete ui.servings[el.dataset.id];const y=window.scrollY;render();window.scrollTo(0,y)},
  'chk-ing':el=>{const s=checksFor(el.dataset.id).ing,i=el.dataset.i;s.has(i)?s.delete(i):s.add(i);el.classList.toggle('done');el.setAttribute('aria-checked',s.has(i))},
  'chk-step':el=>{const s=checksFor(el.dataset.id).step,i=+el.dataset.i;s.has(i)?s.delete(i):s.add(i);el.classList.toggle('done');el.setAttribute('aria-checked',s.has(i));$('.num',el).innerHTML=s.has(i)?I.check:String(i+1).padStart(2,'0')},
  'to-kitchen':el=>{const r=getR(el.dataset.id);r.status='ready';r.updatedAt=Date.now();persist();render();toast('Moved to Test Kitchen')},
  howdid:el=>{ui.from='kitchen';nav('test',{id:el.dataset.id})},
  'status-sheet':el=>{const r=getR(el.dataset.id);openSheet(`<h2>Change status</h2><p class="sub" style="margin-top:6px">Idea → Adapted → Ready to test → Tested → Approved</p>${STATUSES.map(([k,l])=>`<button class="statusopt ${r.status===k?'on':''}" data-act="status-set" data-id="${r.id}" data-v="${k}"><span class="ic st-${k}">${k==='approved'?'✓':STATUSES.findIndex(s=>s[0]===k)+1}</span><span><b>${l}</b></span></button>`).join('')}`)},
  'status-set':el=>{const r=getR(el.dataset.id);r.status=el.dataset.v;if(r.status==='approved'){if(!r.approvedAt)r.approvedAt=Date.now();r.finalApprovedVersion=r.currentVersion}r.updatedAt=Date.now();persist();closeSheet();render()},
  'del-recipe':el=>{const r=getR(el.dataset.id);confirmSheet('Delete this recipe?',`“${esc(r.name)}” and its test history will be removed from this device.`,'Delete recipe',()=>{DB.recipes=DB.recipes.filter(x=>x.id!==r.id);persist();nav('home',{reset:true});toast('Recipe deleted')},true)},
  /* test */
  tstar:el=>{const r=getR(ui.id),k=el.dataset.k,v=+el.dataset.v;r.testDraft[k]=r.testDraft[k]===v?0:v;persistSoon();$$(`[data-act="tstar"][data-k="${k}"]`).forEach(b=>{b.classList.toggle('on',+b.dataset.v<=r.testDraft[k]);b.setAttribute('aria-checked',+b.dataset.v===r.testDraft[k])})},
  tseg:el=>{const r=getR(ui.id),k=el.dataset.k;r.testDraft[k]=r.testDraft[k]===el.dataset.v?'':el.dataset.v;persistSoon();$$(`[data-act="tseg"][data-k="${k}"]`).forEach(b=>b.classList.toggle('on',b.dataset.v===r.testDraft[k]))},
  'test-again':()=>{const r=getR(ui.id);r.tests.push(makeTest(r,'again'));r.testDraft={};r.status='tested';r.updatedAt=Date.now();updateRating(r);persist();ui.from='kitchen';nav('kitchen',{reset:true});toast('Test saved. It stays in the Test Kitchen.')},
  'test-improve':()=>{const r=getR(ui.id);const t=makeTest(r,'improve');r.tests.push(t);r.testDraft={};r.status='tested';r.updatedAt=Date.now();updateRating(r);runRevise(r,t,false);persist();ui.from='kitchen';ui.stack=[];nav('revise',{id:r.id,push:false})},
  'test-approve':()=>{const r=getR(ui.id);const go=()=>{r.tests.push(makeTest(r,'approved'));r.testDraft={};r.status='approved';r.finalApprovedVersion=r.currentVersion;r.approvedAt=Date.now();r.updatedAt=Date.now();updateRating(r);persist();celebrate(()=>{ui.from='recipes';ui.stack=[];nav('recipe',{id:r.id,push:false})})};
    if(r.testDraft&&r.testDraft.tolerated==='no')confirmSheet('Add to cookbook anyway?',"You noted your body didn't tolerate it this time.",'Add to my cookbook',go);else go()},
  /* data */
  export:()=>exportSheet(),
  'export-dl':()=>saveFile(`smart-treats-backup-${new Date().toISOString().slice(0,10)}.json`,backupText(),'application/json'),
  'export-copy':async()=>{const t=$('#export-text');t.value=backupText();t.style.display='block';t.select();let ok=false;try{await navigator.clipboard.writeText(t.value);ok=true}catch(e){try{ok=document.execCommand('copy')}catch(e2){}}toast(ok?'Backup copied':'Select the text above and copy it')},
  import:()=>importSheet(),
  'import-file':()=>{const i=$('#file-json');i.value='';i.click()},
  'import-paste':()=>{const t=($('#import-text').value||'').trim();if(!t){toast('Paste the backup text first.');return}doImport(t)},
  'print-sheet':()=>printSheet(),
  'print-one':el=>printSheet(el.dataset.id),
  'print-go':el=>{const rs=pickedForPrint(el);if(!rs.length){toast('Choose at least one recipe.');return}doPrint(rs)},
  'print-save':el=>{const rs=pickedForPrint(el);if(!rs.length){toast('Choose at least one recipe.');return}saveFile(rs.length===1?`${rs[0].name.replace(/[^\w]+/g,'-').toLowerCase()}.html`:'smart-treats-cookbook.html',printableDoc(rs),'text/html')},
  'restore-examples':()=>{const names=new Set(DB.recipes.map(r=>r.name));const add=seed().filter(r=>!names.has(r.name));if(!add.length){toast('The example recipes are already here.');return}DB.recipes.push(...add);persist();toast(`Added ${add.length} example ${add.length===1?'recipe':'recipes'}`)}
};
function makeTest(r,outcome){const d=r.testDraft||{};return {id:uid(),date:Date.now(),version:r.currentVersion||1,textureIssue:d.textureIssue||'',taste:d.taste||0,texture:d.texture||0,ease:d.ease||0,sweetness:d.sweetness||'',tolerated:d.tolerated||'',filling:d.filling||'',again:d.again||'',worked:(d.worked||'').trim(),didnt:(d.didnt||'').trim(),change:(d.change||'').trim(),outcome}}
function updateRating(r){const t=r.tests.filter(x=>x.taste);r.rating=t.length?Math.round(t.reduce((a,x)=>a+x.taste,0)/t.length*10)/10:0}


/* ============ MAKE IT MINE — wizard logic ============ */
const WIZ_KEY='smartTreats.wizard';
let W=null, wizCtl=null, wTimer=null;
function freshW(){return {stage:'import',mode:'',text:'',url:'',photos:[],found:null,category:'',needs:{reqs:[],goals:[],keepClose:false,priorities:[],set:false},result:null,targetId:null,baseIsOriginal:true}}
function resetWizard(){W=freshW();saveW()}
function loadW(){try{const w=JSON.parse(store.get(WIZ_KEY)||'null');if(w&&w.stage){if(w.stage==='reading')w.stage='import';if(w.stage==='working')w.stage='needs';if(w.stage==='error')w.stage=w.errBack||'import';return Object.assign(freshW(),w)}}catch(e){}return freshW()}
function saveW(){if(!W)return;if(!store.set(WIZ_KEY,JSON.stringify(W))){const p=W.photos;W.photos=[];store.set(WIZ_KEY,JSON.stringify(W));W.photos=p}}
let wTimer2=null;function saveWSoon(){clearTimeout(wTimer2);wTimer2=setTimeout(saveW,300)}
function openWizard(){if(!W)resetWizard();ui.from='add';nav('add',{reset:true,id:null})}
function wizCanRead(){const m=W.mode;return !!((m==='photos'&&(ui.aiImages?W.photos.length:W.text.trim()))||(m&&m!=='photos'&&W.text.trim()))}
function guessCat(name){const n=String(name||'').toLowerCase();for(const [re,c] of [[/cheesecake/,'Cheesecakes'],[/muffin|cupcake/,'Muffins'],[/brownie/,'Brownies'],[/cookie dough/,'Cookie Dough'],[/cookie|biscuit/,'Cookies'],[/pancake|waffle/,'Pancakes'],[/truffle|\bballs?\b|bites/,'Truffles & Balls'],[/pudding|mousse|chia/,'Puddings'],[/ice cream|frozen|popsicle|nice cream/,'Frozen Treats'],[/apple/,'Apple Desserts'],[/coffee|mocha|espresso|tiramisu/,'Coffee'],[/rice/,'Rice Treats'],[/cake|loaf/,'Cakes'],[/chocolate|cocoa/,'Chocolate'],[/berr|fruit|lemon|peach|banana/,'Fruit']])if(re.test(n))return c;return 'Other'}
function profileForAI(){const by=s=>DB.ingredients.filter(t=>t.status===s).map(t=>t.name), pf=p=>DB.ingredients.filter(t=>t.pref===p).map(t=>t.name);return {avoid:by('avoid'),caution:by('caution'),love:pf('love'),dislike:pf('dislike')}}
function errMsg(e){
  const c=e&&e.code;
  if(['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(c)){ClaudeEngine.denied=true;ui.aiReady=false;ui.aiImages=false;return "My Kitchen can't use Claude in this view. The built-in rules can still help."}
  return ({rate_limited:'Claude is busy or your usage limit was reached. Try again in a little while.',session_expired:'Please sign in to Claude again, then try again.',image_rejected:"One of the photos couldn't be read. Try a clearer photo or a screenshot.",images_unavailable:"Photos can't be read here. Paste the recipe text instead.",refused:"Claude couldn't help with this recipe.",invalid_json:"The answer came back in a shape My Kitchen couldn't read. Try again.",empty_recipe:"I couldn't find any ingredients. Check the text and try again.",prompt_too_large:'That recipe is too long. Try pasting just the ingredients and method.',unavailable:"Claude isn't available here."})[c]||'Something went wrong. Try again.';
}
function streamTo(prefix){return ({text})=>{const s=$('#w-stream');if(s){s.hidden=false;s.textContent=`${prefix} — ${text.length.toLocaleString()} characters so far`}}}
async function addWizPhotos(files){
  const max=ui.maxImages||6;
  for(const f of [...(files||[])]){if(W.photos.length>=max){toast(`Up to ${max} photos at a time.`);break}try{W.photos.push(await compress(f,1500,.82))}catch(e){toast("That image couldn't be opened.")}}
  saveW();render();
}
function wizOriginal(){const F=W.found;return {...F,servings:num(F.servings)||null,ingredients:F.ingredients.filter(i=>(i.name||'').trim()),instructions:F.instructions.filter(s=>(s||'').trim())}}
async function wizRead(useRules){
  const input={text:W.text.trim(),url:W.url.trim(),photos:W.mode==='photos'&&ui.aiImages&&!useRules?W.photos:[]};
  if(!input.text&&!input.photos.length){toast('Add the recipe first.');return}
  const eng=useRules?RulesEngine:input.photos.length?ClaudeEngine:await SmartService.engine();
  W.stage='reading';W.readingEngine=eng.id;render();
  wizCtl=new AbortController();
  try{
    const r=await eng.analyzeRecipe(input,{signal:wizCtl.signal,onText:streamTo('Reading')});
    r.engine=eng.id;
    if(!r.ingredients.length)throw {code:'empty_recipe'};
    if(!r.name)r.name='My new treat';
    W.found=r;W.category=guessCat(r.name);W.needs.set=false;W.result=null;W.stage='found';saveW();render();window.scrollTo(0,0);
  }catch(e){
    if(e&&e.code==='cancelled'){W.stage='import';render();return}
    Object.assign(W,{stage:'error',err:errMsg(e),errRetry:'wiz-read',errRules:eng.id==='claude'&&!!input.text,errBack:'import'});render();
  }
}
function wizToNeeds(){
  const F=W.found;
  if(!(F.name||'').trim()){toast('Give the recipe a name.');return}
  if(!F.ingredients.some(i=>(i.name||'').trim())){toast('Add at least one ingredient.');return}
  if(!num(F.servings)){toast('How many servings does it make?');const s=$('[data-wf="servings"]');if(s){s.focus();s.scrollIntoView({block:'center'})}return}
  if(!W.needs.set){const P=DB.preferences;W.needs={reqs:[...P.bodyReqs],goals:[...P.goals],keepClose:false,priorities:[],set:true};rebuildPriorities()}
  W.stage='needs';saveW();render();window.scrollTo(0,0);
}
async function wizMake(useRules){
  const eng=useRules?RulesEngine:await SmartService.engine();
  const orig=wizOriginal(), prof=profileForAI();
  W.stage='working';W.workEngine=eng.id;W.workStep=0;render();window.scrollTo(0,0);
  const tick=()=>{W.workStep=Math.min(3,(W.workStep||0)+1);const box=$('.wsteps');if(box)$$('div',box).forEach((d,i)=>{const on=i<W.workStep;d.classList.toggle('on',on);$('i',d).innerHTML=on?I.check:''})};
  clearInterval(wTimer);wTimer=setInterval(tick,eng.id==='claude'?7000:380);
  wizCtl=new AbortController();
  try{
    const a=await eng.generateAdaptation(orig,W.needs,prof,{signal:wizCtl.signal,onText:streamTo('Writing your recipe')});
    const A=finishAdaptation(orig,a,W.needs,prof);
    if(eng.id==='rules')await new Promise(r=>setTimeout(r,1400));
    clearInterval(wTimer);W.workStep=4;tick();
    W.result=A;W.stage='result';saveW();render();window.scrollTo(0,0);
  }catch(e){
    clearInterval(wTimer);
    if(e&&e.code==='cancelled'){W.stage='needs';render();return}
    console.error(e);
    Object.assign(W,{stage:'error',err:errMsg(e),errRetry:'wiz-make',errRules:eng.id==='claude',errBack:'needs'});render();
  }
}
function wizSave(kind){
  const A=W.result,O=wizOriginal(),status=kind==='ready'?'ready':'adapted';
  const ings=clone(A.ingredients).map(i=>({id:uid(),group:i.group||'',amount:i.amount||'',unit:i.unit||'',name:i.name,optional:!!i.optional,n:{}}));
  const fields={name:A.name,description:A.description||O.description||'',servings:A.servings||O.servings||8,prepTime:A.prepTime||'',cookTime:A.cookTime||'',tempText:A.tempText||'',
    adaptedIngredients:ings,adaptedInstructions:[...A.instructions],requirements:A.tags.slice(),userRequirements:[...W.needs.reqs],nutritionGoals:[...W.needs.goals],priorities:clone(W.needs.priorities),keepClose:W.needs.keepClose,
    ingredientSubstitutions:clone(A.changes),smartSwaps:A.changes.map(c=>({id:uid(),original:c.original,swap:c.replacement,why:c.why})),requirementChecks:clone(A.requirementChecks),goalFeedback:clone(A.goalFeedback),
    collagenRecommendation:clone(A.collagen),collagen:{status:A.collagen.verdict||'unknown',amount:A.collagen.amount||'',texture:A.collagen.texture||'',how:[A.collagen.where,A.collagen.liquid,A.collagen.reduce].filter(Boolean).join('. ')},
    adaptationEngine:A.engine,storage:A.storage||'',freezer:A.freezer,versionNotes:A.notes||'',originalNutrition:{kcal:'',protein:'',carbs:'',fat:'',fiber:'',sugar:''}};
  let r=W.targetId&&getR(W.targetId);
  if(r){
    syncVersion(r);const n=nextVersionN(r);
    const keepOrig=r.original;Object.assign(r,fields);r.original=keepOrig||(W.baseIsOriginal?clone(O):null);
    r.versions.push({id:uid(),n,createdAt:Date.now(),label:'Version '+n,source:A.engine,ingredients:clone(ings),instructions:[...A.instructions],servings:fields.servings,changes:clone(A.changes)});
    r.currentVersion=n;r.status=status;r.updatedAt=Date.now();
  }else{
    r=newRecipe({...fields,category:W.category||guessCat(O.name),referencePhoto:W.photos[0]||null,originalSource:W.url||'',originalRecipe:W.text||'',originalIngredients:O.ingredients.map(lineOf).join('\n'),originalInstructions:O.instructions.join('\n'),original:clone(O),status});
    r.versions=[{id:uid(),n:1,createdAt:Date.now(),label:'Version 1',source:A.engine,ingredients:clone(ings),instructions:[...A.instructions],servings:r.servings,changes:clone(A.changes)}];r.currentVersion=1;
    DB.recipes.unshift(r);
  }
  persist();resetWizard();
  if(kind==='edit'){ui.from='recipes';nav('edit',{id:r.id,step:3,reset:true});toast('Saved. Edit anything you like.')}
  else if(kind==='ready'){ui.from='kitchen';nav('kitchen',{reset:true});toast('Sent to the Test Kitchen')}
  else{ui.from='recipes';nav('recipe',{id:r.id,reset:true});toast('Saved to My Recipes')}
}
function readapt(r){
  let O,base=true;
  if(r.original)O=clone(r.original);
  else if(r.originalIngredients.trim()){const st=lines(r.originalInstructions).map(s=>s.replace(/^\d+[.)]\s*/,''));O={name:r.name,description:r.description,servings:r.servings,tempText:r.tempText,prepTime:r.prepTime,cookTime:r.cookTime,ingredients:lines(r.originalIngredients).map(parseLine).filter(Boolean).map(p=>({id:uid(),group:'',optional:false,...p})),instructions:st,engine:'rules'}}
  else if(r.adaptedIngredients.length){base=false;O={name:r.name,description:r.description,servings:r.servings,tempText:r.tempText,prepTime:r.prepTime,cookTime:r.cookTime,ingredients:clone(r.adaptedIngredients).map(i=>({id:uid(),group:i.group,amount:i.amount,unit:i.unit,name:i.name,optional:i.optional})),instructions:[...r.adaptedInstructions],engine:'rules'}}
  W=freshW();W.targetId=r.id;W.category=r.category;W.baseIsOriginal=base;
  if(!O){W.mode='text';W.text=r.originalRecipe||'';saveW();openWizard();toast('Paste or check the recipe text, then tap Read recipe.');return}
  O.ingredients=O.ingredients.map(i=>({...i,id:i.id||uid()}));
  W.found=O;const P=DB.preferences;
  W.needs={reqs:r.userRequirements.length?[...r.userRequirements]:[...P.bodyReqs],goals:r.nutritionGoals.length?[...r.nutritionGoals]:[...P.goals],keepClose:!!r.keepClose,priorities:clone(r.priorities||[]),set:true};
  rebuildPriorities();W.stage=num(O.servings)?'needs':'found';saveW();openWizard();
}
function runRevise(r,t,useRules){
  const eng=useRules||!ui.aiReady||DB.preferences.engine==='rules'?RulesEngine:ClaudeEngine;
  r.pendingRevision={state:'working',engine:eng.id,testId:t.id};
  (async()=>{
    try{
      const p=await eng.reviseFromTestFeedback(r,t,{onText:streamTo('Planning the next version')});
      if(!p.ingredients||!p.ingredients.length)throw {code:'invalid_json'};
      if(eng.id==='rules')await new Promise(x=>setTimeout(x,900));
      r.pendingRevision={state:'ready',engine:eng.id,testId:t.id,proposal:p};
    }catch(e){r.pendingRevision={state:'error',engine:eng.id,testId:t.id,error:errMsg(e)}}
    persist();if(ui.screen==='revise'&&ui.id===r.id){render();window.scrollTo(0,0)}
    else if(r.pendingRevision.state==='ready')toast(`Version ${nextVersionN(r)} of ${r.name} is ready to review`);
  })();
}
Object.assign(ACT,{
  'wiz-mode':el=>{W.mode=el.dataset.v;saveW();render();if(W.mode==='photos'&&!W.photos.length)ACT['wiz-photo-add']();setTimeout(()=>{const f=$('#w-text')||$('#w-url');if(f&&W.mode!=='photos')f.focus()},60)},
  'wiz-photo-add':()=>{const i=$('#file-multi');i.value='';i.click()},
  'wiz-photo-del':el=>{W.photos.splice(+el.dataset.i,1);saveW();render()},
  'wiz-read':el=>wizRead(!!el.dataset.rules),
  'wiz-stop':()=>{if(wizCtl)wizCtl.abort()},
  'wiz-back':()=>{const back={found:'import',needs:'found',result:'needs',error:W.errBack||'import'}[W.stage]||'import';W.stage=back;saveW();render();window.scrollTo(0,0)},
  'wiz-goto':el=>{W.stage=el.dataset.v;saveW();render();window.scrollTo(0,0)},
  'wiz-reset':()=>confirmSheet('Start over?','The recipe you are working on here will be cleared. Saved recipes are not affected.','Start over',()=>{resetWizard();render()},true),
  'wing-add':()=>{W.found.ingredients.push({id:uid(),group:(W.found.ingredients.at(-1)||{}).group||'',amount:'',unit:'',name:'',optional:false});saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wing-del':el=>{W.found.ingredients=W.found.ingredients.filter(i=>i.id!==el.dataset.v);saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wstep-add':()=>{W.found.instructions.push('');saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wstep-del':el=>{W.found.instructions.splice(+el.dataset.i,1);saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wiz-to-needs':()=>wizToNeeds(),
  'wiz-req':el=>{const a=W.needs.reqs,v=el.dataset.v,i=a.indexOf(v);i>=0?a.splice(i,1):a.push(v);rebuildPriorities();saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wiz-goal':el=>{const a=W.needs.goals,v=el.dataset.v,i=a.indexOf(v);i>=0?a.splice(i,1):a.push(v);rebuildPriorities();saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wiz-close':()=>{W.needs.keepClose=!W.needs.keepClose;rebuildPriorities();saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wiz-level':el=>{W.needs.priorities[+el.dataset.i].level=el.dataset.v;saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wiz-move':el=>{const P=W.needs.priorities,i=+el.dataset.i,d=+el.dataset.d,j=i+d;if(j<0||j>=P.length||P[j].kind==='req')return;[P[i],P[j]]=[P[j],P[i]];saveW();const y=window.scrollY;render();window.scrollTo(0,y)},
  'wiz-make':el=>wizMake(!!el.dataset.rules),
  'wiz-again':()=>wizMake(false),
  'wiz-save':el=>wizSave(el.dataset.v),
  readapt:el=>{const r=getR(el.dataset.id);if(r)readapt(r)},
  'use-version':el=>{const r=getR(el.dataset.id),v=r.versions.find(x=>x.n===+el.dataset.v);if(!v)return;syncVersion(r);r.adaptedIngredients=clone(v.ingredients);r.adaptedInstructions=[...v.instructions];if(v.servings)r.servings=v.servings;r.currentVersion=v.n;r.updatedAt=Date.now();persist();render();toast(`Now using version ${v.n}`)},
  'open-revise':el=>nav('revise',{id:el.dataset.id}),
  'revise-run':el=>{const r=getR(el.dataset.id);const t=r.tests.find(x=>x.id===(r.pendingRevision||{}).testId)||r.tests.at(-1);if(!t){toast('Save a test first.');return}runRevise(r,t,!!el.dataset.rules);render()},
  'revise-accept':el=>{const r=getR(el.dataset.id),R=r.pendingRevision;if(!R||!R.proposal)return;const P=R.proposal;syncVersion(r);const n=nextVersionN(r);
    r.adaptedIngredients=P.ingredients.map(i=>({id:uid(),group:i.group||'',amount:i.amount||'',unit:i.unit||'',name:i.name,optional:!!i.optional,n:{}}));
    r.adaptedInstructions=[...P.instructions];if(P.cookTime)r.cookTime=P.cookTime;
    r.versions.push({id:uid(),n,createdAt:Date.now(),label:'Version '+n,source:'revision',engine:R.engine,ingredients:clone(r.adaptedIngredients),instructions:[...r.adaptedInstructions],servings:r.servings,changes:clone(P.changes),fromTest:R.testId});
    r.currentVersion=n;r.status='ready';r.pendingRevision=null;r.updatedAt=Date.now();persist();
    if(el.dataset.edit){ui.from='recipes';nav('edit',{id:r.id,step:3,reset:true})}else{ui.from='kitchen';nav('recipe',{id:r.id,reset:true})}
    toast(`Version ${n} is ready to test`)},
  'revise-discard':el=>{const r=getR(el.dataset.id);r.pendingRevision=null;persist();ui.from='kitchen';nav('kitchen',{reset:true})},
  'nut-reset':el=>{const r=E(),i=r.adaptedIngredients.find(x=>x.id===el.dataset.v);if(!i)return;i.n={};delete i.nsrc;touch();persist();const y=window.scrollY;render();window.scrollTo(0,y)}
});

/* ============ events ============ */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el||el.disabled)return;
  const fn=ACT[el.dataset.act]; if(!fn)return;
  e.preventDefault(); fn(el,e);
});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('article[data-act]')){e.preventDefault();ACT.open(e.target)}
  if(e.key==='Escape')closeSheet();
});
document.addEventListener('input',e=>{
  const t=e.target, d=t.dataset;
  if(t.id==='home-q'){ui.q=t.value;$('#home-results').innerHTML=homeResults();return}
  if(t.id==='rq'){ui.rq=t.value;$('#rlist').innerHTML=recipeList();return}
  if(t.id==='have'){ui.have=t.value;return}
  if(d.pref){DB.preferences.thresholds[d.pref]=num(t.value);persistSoon();return}
  if(d.test){const r=getR(ui.id);r.testDraft[d.test]=t.value;persistSoon();return}
  if(ui.screen==='add'&&W){
    if(d.w){W[d.w]=t.value;saveWSoon();const b=$('#w-read');if(b)b.disabled=!wizCanRead();return}
    if(d.wf&&d.wf!=='category'){W.found[d.wf]=t.value;if(d.wf==='servings'){W.found.servingsNote='';t.classList.remove('warn')}saveWSoon();return}
    if(d.wing){const i=W.found.ingredients.find(x=>x.id===d.wing);if(i){i[d.f]=t.type==='checkbox'?t.checked:t.value;saveWSoon()}return}
    if(d.wstep!=null){W.found.instructions[+d.wstep]=t.value;saveWSoon();return}
  }
  const o=E(); if(!o)return;
  if(d.bind&&d.bind!=='category'){setPath(o,d.bind,t.value);touch();if(d.bind==='servings'||d.bind.startsWith('originalNutrition'))updNutri();return}
  if(d.ing){const i=o.adaptedIngredients.find(x=>x.id===d.ing);if(!i)return;
    if(d.n){i.n=i.n||{};
      if(i.nsrc!=='manual'&&i.nsrc!=='label'){const res=ingNut(i);i.n={};NUT.forEach(k=>{i.n[k]=res.status==='ok'?String(Math.round(res.n[k]*10)/10):''});
        $$(`[data-ing="${i.id}"][data-n]`).forEach(x=>{if(x!==t)x.value=i.n[x.dataset.n]})}
      i.n[d.n]=t.value;i.nsrc=o.nutritionStatus==='label'?'label':'manual';const p=$('#src-'+i.id);if(p){p.textContent=i.nsrc==='label'?'From label':'Entered by me';p.className='pill pref-love'}updNutri()}
    else i[d.f]=t.type==='checkbox'?t.checked:t.value;touch();return}
  if(d.stepi!=null){o.adaptedInstructions[+d.stepi]=t.value;touch();return}
  if(d.swap){const s=o.smartSwaps.find(x=>x.id===d.swap);if(s){s[d.f]=t.value;touch()}}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='file-cam'||t.id==='file-img'){onPhoto(t.files&&t.files[0]);return}
  if(t.id==='file-multi'){addWizPhotos(t.files);return}
  if(t.dataset.wf==='category'&&W){W.category=t.value;saveW();return}
  if(t.id==='file-json'){const f=t.files&&t.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>doImport(String(fr.result));fr.readAsText(f);return}
  if(t.id==='cat-sel'){const o=E();if(t.value==='__new'){t.value=o.category;sheetState={forRecipe:true};textSheet('New category','Category name','cat-save','e.g. Breakfast Treats');return}o.category=t.value;touch();return}
  if(t.dataset.ing&&t.dataset.f==='name')refreshTol();
  if(t.dataset.ing&&t.dataset.f==='optional'){const o=E();const i=o.adaptedIngredients.find(x=>x.id===t.dataset.ing);if(i){i.optional=t.checked;touch()}}
});
window.addEventListener('pagehide',()=>{persist();saveDraft()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){persist();saveDraft()}});

/* ============ init ============ */
loadDB();
W=loadW();
DB.recipes.forEach(r=>{if(r.pendingRevision&&r.pendingRevision.state==='working')r.pendingRevision={state:'error',error:'That was interrupted. Try again.',engine:r.pendingRevision.engine}});
render();
(async()=>{
  try{ui.aiReady=await SmartService.aiAvailable();ui.aiImages=ui.aiReady&&await ClaudeEngine.canReadImages();ui.maxImages=ui.aiImages?await ClaudeEngine.maxImages():0}catch(e){ui.aiReady=false}
  const a=document.activeElement;if(!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))&&['home','add','profile'].includes(ui.screen)&&!['reading','working'].includes(W&&W.stage)){const y=window.scrollY;render();window.scrollTo(0,y)}
})();

/* ============ offline support ============ */
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})})}
