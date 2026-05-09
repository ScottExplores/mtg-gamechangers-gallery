import fs from 'fs';

const listCategories = {
  White:["Drannith Magistrate","Enlightened Tutor","Farewell","Humility","Serra's Sanctum","Smothering Tithe","Teferi's Protection"],
  Blue:["Consecrated Sphinx","Cyclonic Rift","Force of Will","Fierce Guardianship","Gifts Ungiven","Intuition","Mystical Tutor","Narset, Parter of Veils","Rhystic Study","Thassa's Oracle"],
  Black:["Ad Nauseam","Bolas's Citadel","Braids, Cabal Minion","Demonic Tutor","Imperial Seal","Necropotence","Opposition Agent","Orcish Bowmasters","Tergrid, God of Fright","Vampiric Tutor"],
  Red:["Gamble","Jeska's Will","Underworld Breach"],
  Green:["Biorhythm","Crop Rotation","Gaea's Cradle","Natural Order","Seedborn Muse","Survival of the Fittest","Worldly Tutor"],
  Multicolor:["Aura Shards","Coalition Victory","Grand Arbiter Augustin IV","Notion Thief"],
  Colorless:["Ancient Tomb","Chrome Mox","Field of the Dead","Glacial Chasm","Grim Monolith","Lion's Eye Diamond","Mana Vault","Mishra's Workshop","Mox Diamond","Panoptic Mirror","The One Ring","The Tabernacle at Pendrell Vale"]
};
const bannedCommander=["Shahrazad","Sundering Titan","Sylvan Primordial","Time Vault","Time Walk","Tinker","Tolarian Academy","Trade Secrets","Upheaval","Yawgmoth's Bargain","Ancestral Recall","Balance","Biorhythm","Black Lotus","Channel","Chaos Orb","Dockside Extortionist","Emrakul, the Aeons Torn","Erayo, Soratami Ascendant","Falling Star","Fastbond","Flash","Golos, Tireless Pilgrim","Griselbrand","Hullbreacher","Iona, Shield of Emeria","Jeweled Lotus","Karakas","Leovold, Emissary of Trest","Library of Alexandria","Limited Resources","Lutri, the Spellchaser","Mana Crypt","Mox Emerald","Mox Jet","Mox Pearl","Mox Ruby","Mox Sapphire","Nadu, Winged Wisdom","Paradox Engine","Primeval Titan","Prophet of Kruphix","Recurring Nightmare","Rofellos, Llanowar Emissary"];

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
async function fetchJson(url){for(let i=0;i<4;i++){const r=await fetch(url,{headers:{'User-Agent':'mardy-mtg-dashboard/1.0'}});if(r.status===429){await sleep(Number(r.headers.get('retry-after')||'60')*1000);continue;}if(!r.ok) return null;return await r.json();}return null;}
async function getCard(name){await sleep(120);let c=await fetchJson(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);if(c&&c.object!=='error') return c;await sleep(120);c=await fetchJson(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);if(c&&c.object!=='error') return c;return null;}
async function resolveCards(names){const cards=[];const missing=[];for(const n of names){const c=await getCard(n);const image=c?.image_uris?.normal||c?.card_faces?.[0]?.image_uris?.normal||'';if(!image) missing.push(n);cards.push({name:n,image,scryfall:c?.scryfall_uri||'',colorIdentity:c?.color_identity||[]});}return {cards,missing};}

const listData={}; let missing=[];
for(const [cat,names] of Object.entries(listCategories)){const out=await resolveCards(names);listData[cat]=out.cards;missing.push(...out.missing);}
const bannedOut=await resolveCards(bannedCommander);missing.push(...bannedOut.missing);
const listAll=Object.entries(listData).flatMap(([cat,cards])=>cards.map(c=>({...c,category:cat})));

const bracketImage='https://i.imgur.com/6A6f6qH.jpeg';
const SUPABASE_URL='https://xifjhxopdfapmqxkxzvd.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_Z2uJRk9tWBcTriazBQuseQ_6_iNgX90';

const css=`body{font-family:Inter,system-ui,Arial;background:#0b1020;color:#fff;margin:0;padding:14px}h1{margin:0 0 8px;font-size:24px}.top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 14px}.select,.btn,input{background:#1a2750;color:#dbe5ff;border:1px solid #395090;border-radius:10px;padding:8px 10px;font-size:13px}.tabs{display:flex;gap:8px;margin:10px 0 14px;flex-wrap:wrap}.tab{background:#111a33;border:1px solid #2a355d;border-radius:10px;padding:8px 12px;cursor:pointer}.tab.active{background:#21346f}.pane{display:none}.pane.active{display:block}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(var(--card-min,180px),1fr))}.card{background:#111a33;border:1px solid #2a355d;border-radius:12px;padding:6px;transition:transform .15s ease;transform-origin:center}.card img{width:100%;border-radius:10px;display:block}.name{font-size:12px;margin-top:6px;line-height:1.2}.section{margin:14px 0}.section h2{margin:0 0 8px;color:#9fb4ff;font-size:18px}.meta{font-size:12px;color:#aab7e6}a{color:#c9d6ff;text-decoration:none}a:hover{text-decoration:underline}body.tiny .card:hover,body.tiny .card:focus-within,body.tiny .card.touched{transform:scale(1.9);z-index:20;position:relative}.panel{background:#111a33;border:1px solid #2a355d;border-radius:12px;padding:10px}.row{display:flex;gap:8px;flex-wrap:wrap}.profile{margin-top:10px}.bracketImg{max-width:100%;border-radius:10px;border:1px solid #2a355d}`;

let html=`<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>MTG Dashboard</title><style>${css}</style></head><body><h1>MTG Dashboard</h1><div class='top'><label class='meta'>Card size</label><select id='sizeSelect' class='select'><option value='220'>Large</option><option value='180' selected>Medium</option><option value='150'>Small</option><option value='120'>Tiny</option></select><div class='meta'>${missing.length===0?'All card images found ✅':`Missing ${[...new Set(missing)].length}`}</div></div><div class='tabs'><button class='tab active' data-pane='listPane'>List</button><button class='tab' data-pane='bannedPane'>Banned Commander Cards</button><button class='tab' data-pane='bracketPane'>Commander Brackets</button><button class='tab' data-pane='wantedPane'>Cards You Want</button></div>`;

html += `<section id='listPane' class='pane active'><div class='controls'><select id='listSort' class='select'><option value='alpha'>Sort: A → Z</option><option value='reverse'>Sort: Z → A</option><option value='color'>Sort: Color</option></select><select id='listColor' class='select'><option value='all'>Color filter: All</option><option value='W'>White</option><option value='U'>Blue</option><option value='B'>Black</option><option value='R'>Red</option><option value='G'>Green</option><option value='multi'>Multicolor</option><option value='colorless'>Colorless</option></select></div><div class='section'><h2>Game Changer List (${listAll.length})</h2><div id='listGrid' class='grid'></div></div></section>`;

html += `<section id='bannedPane' class='pane'><div class='controls'><select id='bannedSort' class='select'><option value='alpha'>Sort: A → Z</option><option value='reverse'>Sort: Z → A</option><option value='color'>Sort: Color</option></select><select id='bannedColor' class='select'><option value='all'>Color filter: All</option><option value='W'>White</option><option value='U'>Blue</option><option value='B'>Black</option><option value='R'>Red</option><option value='G'>Green</option><option value='multi'>Multicolor</option><option value='colorless'>Colorless</option></select></div><div class='section'><h2>Banned Commander Cards (${bannedOut.cards.length})</h2><div id='bannedGrid' class='grid'></div></div></section>`;

html += `<section id='bracketPane' class='pane'><div class='section'><h2>Commander Brackets</h2><p class='meta'>Quick reference image.</p><img class='bracketImg' src='${bracketImage}' alt='Commander Brackets'/></div></section>`;

html += `<section id='wantedPane' class='pane'><div class='panel'><h2 style='margin-top:0'>Cards You Want</h2><div class='row'><input id='playerName' placeholder='Your name (e.g. Scott)' value='Scott' /><button id='switchProfileBtn' class='btn'>Switch / Create Profile</button><input id='cardSearch' placeholder='Search card name...' autocomplete='off' /><button id='searchBtn' class='btn'>Search</button><button id='addBtn' class='btn' disabled>Add to Profile</button></div><div id='suggestions' class='panel' style='display:none;margin-top:8px;padding:6px'></div><div id='searchResult' class='section'></div><div class='profile'><h3 id='profileTitle'>Scott\'s Wanted Cards</h3><div id='wantedGrid' class='grid'></div></div></div></section>`;

html += `<script type='module'>
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase=createClient('${SUPABASE_URL}','${SUPABASE_ANON_KEY}');
const root=document.documentElement, body=document.body;
const colorOrder={W:1,U:2,B:3,R:4,G:5,multi:6,colorless:7};
const listCards=${JSON.stringify(listAll)};
const bannedCards=${JSON.stringify(bannedOut.cards)};
const sizeSelect=document.getElementById('sizeSelect');
const listSort=document.getElementById('listSort'), listColor=document.getElementById('listColor');
const bannedSort=document.getElementById('bannedSort'), bannedColor=document.getElementById('bannedColor');
const listGrid=document.getElementById('listGrid'), bannedGrid=document.getElementById('bannedGrid');
const playerName=document.getElementById('playerName'), cardSearch=document.getElementById('cardSearch');
const switchProfileBtn=document.getElementById('switchProfileBtn');
const searchBtn=document.getElementById('searchBtn'), addBtn=document.getElementById('addBtn');
const suggestions=document.getElementById('suggestions');
const searchResult=document.getElementById('searchResult'), wantedGrid=document.getElementById('wantedGrid'), profileTitle=document.getElementById('profileTitle');
let selectedCard=null, suggestTimer=null, activeGroup='default-group', activeProfile=null, activeProfileRow=null;
function ownerToken(){ let t=localStorage.getItem('owner_token'); if(!t){t=crypto.randomUUID(); localStorage.setItem('owner_token',t);} return t; }
function colorBucket(ci){ if(!ci||ci.length===0) return 'colorless'; if(ci.length>1) return 'multi'; return ci[0]; }
function colorMatch(card, filter){ const b=colorBucket(card.colorIdentity||[]); return filter==='all' ? true : b===filter; }
function sorter(mode){ return (a,b)=> mode==='reverse' ? b.name.localeCompare(a.name) : mode==='color' ? ((colorOrder[colorBucket(a.colorIdentity)]-colorOrder[colorBucket(b.colorIdentity)])||a.name.localeCompare(b.name)) : a.name.localeCompare(b.name); }
function cardHtml(c, editable=false){ const notes=editable?`<div class='row' style='margin-top:6px'><input data-note-id='${c.id||''}' value='${(c.note||'').replace(/'/g,"&#39;")}' placeholder='Note' /><button class='btn' data-save-id='${c.id||''}'>Save</button><button class='btn' data-del-id='${c.id||''}'>Delete</button></div>`:''; return "<div class='card'><img src='"+c.image+"' alt='"+c.name+"'/><div class='name'><a href='"+c.scryfall+"' target='_blank' rel='noreferrer'>"+c.name+"</a></div>"+notes+"</div>"; }
function render(grid,cards,sortSel,colorSel){ let arr=[...cards].filter(c=>colorMatch(c,colorSel.value)).sort(sorter(sortSel.value)); grid.innerHTML=arr.map(c=>cardHtml(c,false)).join(''); bindTinyTouch(grid); }
function applySize(){ root.style.setProperty('--card-min', sizeSelect.value+'px'); body.classList.toggle('tiny', sizeSelect.value==='120'); }
function bindTinyTouch(scope){ for(const c of scope.querySelectorAll('.card')) c.onclick=()=>{ if(!body.classList.contains('tiny')) return; scope.querySelectorAll('.card.touched').forEach(x=>x.classList.remove('touched')); c.classList.add('touched'); }; }
async function ensureGroup(slug='default-group',name='Default Trade Group'){ const {data}=await supabase.from('trade_groups').select('*').eq('slug',slug).maybeSingle(); if(data) return data; const ins=await supabase.from('trade_groups').insert({slug,name}).select().single(); return ins.data; }
async function switchProfile(){ const name=(playerName.value||'').trim(); if(!name) return; const g=await ensureGroup(activeGroup,'Default Trade Group'); const {data:row}=await supabase.from('profiles').select('*').eq('group_id',g.id).eq('name',name).maybeSingle(); if(row){ activeProfileRow=row; activeProfile=row.id; } else { const r=await supabase.from('profiles').insert({group_id:g.id,name,owner_token:ownerToken()}).select().single(); activeProfileRow=r.data; activeProfile=r.data.id; }
 await loadWanted(); }
async function loadWanted(){ if(!activeProfile){wantedGrid.innerHTML=''; return;} const {data}=await supabase.from('wanted_cards').select('*').eq('profile_id',activeProfile).order('updated_at',{ascending:false}); profileTitle.textContent=(playerName.value||'Player')+"'s Wanted Cards"; wantedGrid.innerHTML=(data||[]).map(c=>cardHtml({id:c.id,name:c.card_name,image:c.image,scryfall:c.scryfall,note:c.note}, activeProfileRow?.owner_token===ownerToken())).join(''); bindTinyTouch(wantedGrid); bindWantedActions(); }
async function bindWantedActions(){ for(const b of wantedGrid.querySelectorAll('[data-del-id]')) b.onclick=async()=>{await supabase.from('wanted_cards').delete().eq('id',b.dataset.delId); await loadWanted();}; for(const b of wantedGrid.querySelectorAll('[data-save-id]')) b.onclick=async()=>{const id=b.dataset.saveId; const note=wantedGrid.querySelector(`[data-note-id='${id}']`)?.value||''; await supabase.from('wanted_cards').update({note}).eq('id',id); await loadWanted();}; }
async function searchCard(){ const q=cardSearch.value.trim(); if(!q) return; searchBtn.disabled=true; addBtn.disabled=true; searchResult.innerHTML='<div class="meta">Searching...</div>'; try{ const r=await fetch('https://api.scryfall.com/cards/named?fuzzy='+encodeURIComponent(q)); const c=await r.json(); if(c.object==='error') throw new Error(); const image=c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal; selectedCard={name:c.name,image,scryfall:c.scryfall_uri,colorIdentity:c.color_identity||[]}; searchResult.innerHTML=cardHtml(selectedCard,false); addBtn.disabled=false; }catch{ searchResult.innerHTML='<div class="meta">Not found.</div>'; selectedCard=null; } finally{ searchBtn.disabled=false; }}
async function fetchSuggestions(){ const q=cardSearch.value.trim(); if(q.length<2){ suggestions.style.display='none'; suggestions.innerHTML=''; return; } const r=await fetch('https://api.scryfall.com/cards/autocomplete?q='+encodeURIComponent(q)); const j=await r.json(); const list=(j.data||[]).slice(0,8); if(!list.length){ suggestions.style.display='none'; suggestions.innerHTML=''; return; } suggestions.innerHTML=list.map(n=>"<div class='meta' style='padding:6px;cursor:pointer;border-radius:6px' data-name='"+n.replace(/'/g,'&#39;')+"'>"+n+"</div>").join(''); suggestions.style.display='block'; for(const el of suggestions.querySelectorAll('[data-name]')) el.onclick=()=>{ cardSearch.value=el.getAttribute('data-name'); suggestions.style.display='none'; searchCard(); }; }
sizeSelect.addEventListener('change',()=>{applySize(); render(listGrid,listCards,listSort,listColor); render(bannedGrid,bannedCards,bannedSort,bannedColor); loadWanted();});
[listSort,listColor].forEach(el=>el.addEventListener('change',()=>render(listGrid,listCards,listSort,listColor)));
[bannedSort,bannedColor].forEach(el=>el.addEventListener('change',()=>render(bannedGrid,bannedCards,bannedSort,bannedColor)));
searchBtn.addEventListener('click', searchCard); cardSearch.addEventListener('keypress',e=>{if(e.key==='Enter') searchCard();});
cardSearch.addEventListener('input',()=>{ clearTimeout(suggestTimer); suggestTimer=setTimeout(fetchSuggestions,180); });
addBtn.addEventListener('click',async()=>{ if(!selectedCard||!activeProfile) return; await supabase.from('wanted_cards').insert({profile_id:activeProfile,card_name:selectedCard.name,image:selectedCard.image,scryfall:selectedCard.scryfall,note:''}); selectedCard=null; cardSearch.value=''; searchResult.innerHTML=''; suggestions.style.display='none'; addBtn.disabled=true; await loadWanted();});
switchProfileBtn.addEventListener('click', switchProfile);
applySize(); render(listGrid,listCards,listSort,listColor); render(bannedGrid,bannedCards,bannedSort,bannedColor); await switchProfile();
for(const b of document.querySelectorAll('.tab')) b.addEventListener('click',()=>{ document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active')); document.getElementById(b.dataset.pane).classList.add('active'); });
</script></body></html>`;

fs.writeFileSync('index.html',html);
console.log('built index.html');
console.log('missing unique:', [...new Set(missing)].length ? [...new Set(missing)].join(', ') : 'none');
