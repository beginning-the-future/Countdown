(() => {
'use strict';
const $ = id => document.getElementById(id);
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {clocks:[], editId:null, deleteId:null, detailId:null, toastTimer:null, storageOK:true};
const icons = {
  edit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 6.5l4 4M4 20l4.6-.8L19 8.7a2.8 2.8 0 0 0-4-4L4.6 15.2 4 20Z"/></svg>',
  trash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/></svg>',
  expand:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/></svg>'
};

function isValidClock(c){return c && typeof c.name==='string' && c.name.trim() && c.name.length<=65 && typeof c.id==='string' && Number.isFinite(Number(c.target)) && Number(c.target)>0;}
function canWrite(){if(!window.TIMECloud?.ready){toast('Sign in and wait for your timeline to load.');return false;}return true;}
async function persist(items=[],deleted=[]){
  if(!canWrite())return false;
  document.querySelectorAll('#submitClock,#confirmDelete,#importBackup').forEach(b=>b.disabled=true);
  try{await window.TIMECloud.write(items,deleted);return true;}
  catch(error){toast('Not saved: '+error.message);return false;}
  finally{document.querySelectorAll('#submitClock,#confirmDelete,#importBackup').forEach(b=>b.disabled=false);}
}
window.addEventListener('time-account', event=>{
  const {user,clocks,ready}=event.detail;
  state.clocks=clocks.filter(isValidClock);
  state.accountReady=ready;
  if(state.accountUid!==user?.uid || !ready){closeForm();closeDelete();closeDetail();}
  state.accountUid=user?.uid;
  renderClocks();refreshClocks();
});
function newId(){return (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `time-${Date.now()}-${Math.random().toString(36).slice(2)}`);}
function getClock(id){return state.clocks.find(c=>c.id===id);}
function pad(n,w=2){return String(n).padStart(w,'0');}
function localInput(ms){const d=new Date(ms);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
function dateCaption(ms){return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ms)).toUpperCase();}
function countdown(ms){
  const delta = Math.max(0,Number(ms)-Date.now());
  const totalMin = Math.ceil(delta/60000);
  return {days:Math.floor(totalMin/1440),hours:Math.floor((totalMin%1440)/60),mins:totalMin%60,finished:delta<=0};
}
function progress(clock){const full=clock.target-clock.createdAt;if(full<=0)return 100;return Math.max(0,Math.min(100,(Date.now()-clock.createdAt)/full*100));}
function toast(message){const el=$('toast');el.textContent=message;el.hidden=false;window.clearTimeout(state.toastTimer);requestAnimationFrame(()=>el.classList.add('is-visible'));state.toastTimer=window.setTimeout(()=>{el.classList.remove('is-visible');window.setTimeout(()=>el.hidden=true,280);},3300);}
function updateLocalTime(){const now=new Date();$('liveTime').textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);$('liveDate').textContent=new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(now).toUpperCase();}

function mk(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function cardFor(clock,index){
  const article=mk('article','countdown-card');article.dataset.clockId=clock.id;article.tabIndex=0;article.setAttribute('aria-label',`${clock.name}, double click or press Enter to open`);
  const top=mk('div','card-top');top.append(mk('span','card-index',`MOMENT // ${pad(index+1,3)}`));
  const actions=mk('div','card-actions');
  [['edit','Edit countdown','edit'],['expand','Open fullscreen','open'],['trash','Delete countdown','delete']].forEach(([key,label,action])=>{
    const btn=mk('button','icon-button'+(action==='delete'?' icon-button--danger':''));btn.type='button';btn.setAttribute('aria-label',`${label}: ${clock.name}`);btn.dataset.action=action;btn.innerHTML=icons[key];actions.append(btn);
  });top.append(actions);article.append(top);
  article.append(mk('h3','card-name',clock.name));
  const time=mk('div','card-time');
  [['days','DAYS'],['hours','HOURS'],['mins','MINUTES']].forEach(([field,label],idx)=>{
    if(idx)time.append(mk('span','time-colon',':'));
    const piece=mk('div','time-field');const strong=mk('strong',`num-${field}`,'00');piece.append(strong,mk('span','',label));time.append(piece);
  });article.append(time);
  const bottom=mk('div','card-bottom');bottom.append(mk('span','card-target',`TARGET // ${dateCaption(clock.target)}`));const enter=mk('button','enter-hint','ENTER ↗');enter.type='button';enter.dataset.action='open';enter.setAttribute('aria-label',`Open ${clock.name} fullscreen`);enter.style.border='0';enter.style.background='none';enter.style.padding='0';bottom.append(enter);article.append(bottom);
  const bar=mk('div','card-progress');bar.append(mk('div',''));article.append(bar);
  article.addEventListener('dblclick',event=>{if(event.target.closest('button'))return;openDetail(clock.id,true);});
  article.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&!event.target.closest('button')){event.preventDefault();openDetail(clock.id,true);}});
  article.addEventListener('click',event=>{const btn=event.target.closest('[data-action]');if(!btn)return;event.stopPropagation();const action=btn.dataset.action;if(action==='edit')openForm(clock.id);else if(action==='delete')openDelete(clock.id);else if(action==='open')openDetail(clock.id,true);});
  if(!reducedMotion && window.matchMedia('(hover: hover)').matches){
    article.addEventListener('pointermove',event=>{const b=article.getBoundingClientRect(),x=(event.clientX-b.left)/b.width,y=(event.clientY-b.top)/b.height;article.style.transform=`perspective(900px) rotateY(${(x-.5)*4}deg) rotateX(${(.5-y)*4}deg) translateY(-3px)`;article.style.setProperty('--shine-x',`${x*100}%`);article.style.setProperty('--shine-y',`${y*100}%`);});
    article.addEventListener('pointerleave',()=>{article.style.transform='';});
  }
  return article;
}
function renderClocks(){
  if(!state.accountReady){$('clockGrid').replaceChildren(mk('div','empty-state','Sign in with Google to load your private countdowns.'));$('countBadge').textContent='00';return;}
  const grid=$('clockGrid');grid.replaceChildren();const sorted=[...state.clocks].sort((a,b)=>a.target-b.target);
  $('countBadge').textContent=pad(sorted.length);
  if(!sorted.length){
    const empty=mk('div','empty-state');empty.append(mk('div','empty-visual','◈'),mk('h3','','Your timeline begins here.'),mk('p','','No countdowns in orbit yet. Create your first moment and let the universe start counting.'));
    const btn=mk('button','btn btn--primary','＋ CREATE YOUR FIRST COUNTDOWN');btn.type='button';btn.addEventListener('click',()=>openForm());empty.append(btn);grid.append(empty);return;
  }
  sorted.forEach((c,i)=>grid.append(cardFor(c,i)));
  refreshClocks();
}
function refreshClocks(){
  document.querySelectorAll('.countdown-card[data-clock-id]').forEach(card=>{
    const clock=getClock(card.dataset.clockId);if(!clock)return;const c=countdown(clock.target);
    card.querySelector('.num-days').textContent=pad(c.days,2);card.querySelector('.num-hours').textContent=pad(c.hours);card.querySelector('.num-mins').textContent=pad(c.mins);
    card.classList.toggle('card-finished',c.finished);
    const target=card.querySelector('.card-target');if(target)target.textContent=c.finished?'MOMENT REACHED // '+dateCaption(clock.target):'TARGET // '+dateCaption(clock.target);
    const bar=card.querySelector('.card-progress div');bar.style.width=`${progress(clock).toFixed(2)}%`;
  });
  if(state.detailId)refreshDetail();
}
function refreshDetail(){const clock=getClock(state.detailId);if(!clock){closeDetail();return;}const c=countdown(clock.target);
  $('detailName').textContent=clock.name;
  $('detailDays').textContent=pad(c.days,3);$('detailHours').textContent=pad(c.hours);$('detailMinutes').textContent=pad(c.mins);
  $('detailTarget').textContent=`TARGET / ${dateCaption(clock.target)}`;
  $('detailStatus').innerHTML='<i class="status-dot"></i> '+(c.finished?'MOMENT REACHED':'IN PROGRESS');
  $('detailPercent').textContent=c.finished?'DESTINATION REACHED':`${Math.floor(progress(clock))}% OF THE JOURNEY`;
  $('heroProgressFill').style.width=`${progress(clock)}%`;
}
function showOverlay(id){$(id).hidden=false;document.body.style.overflow='hidden';}
function hideOverlay(id){$(id).hidden=true;if($('formOverlay').hidden && $('deleteOverlay').hidden)document.body.style.overflow=state.detailId?'hidden':'';}
function openForm(id=null){
  if(!canWrite())return;
  if(document.fullscreenElement && document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  state.editId=id;
  const clock=id?getClock(id):null;
  $('formTitle').textContent=clock?'Edit countdown':'Create countdown';
  $('submitClock').innerHTML=clock?'SAVE CHANGES <span>↗</span>':'CREATE COUNTDOWN <span>↗</span>';
  $('clockName').value=clock?clock.name:'';
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);tomorrow.setHours(9,0,0,0);
  $('clockDeadline').value=clock?localInput(clock.target):localInput(tomorrow.getTime());
  $('formError').hidden=true;showOverlay('formOverlay');setTimeout(()=>$('clockName').focus(),60);
}
function closeForm(){hideOverlay('formOverlay');state.editId=null;}
async function onSubmit(event){event.preventDefault();if(!canWrite())return;const name=$('clockName').value.trim();const dateValue=$('clockDeadline').value;const target=new Date(dateValue).getTime();
  let error='';if(!name)error='Please enter an event name.';else if(name.length>65)error='Keep your event name under 65 characters.';else if(!Number.isFinite(target))error='Please choose a valid target date and time.';else if(target<=Date.now())error='Choose a date and time in the future.';
  if(error){$('formError').textContent=error;$('formError').hidden=false;return;}
  const existing=state.editId?getClock(state.editId):null;
  const clock={id:existing?existing.id:newId(),name,target,createdAt:existing?existing.createdAt:Date.now()};
  if(await persist([clock])){closeForm();toast('Countdown saved to your account.');}
}

function openDelete(id){const clock=getClock(id);if(!clock)return;state.deleteId=id;$('deleteMessage').textContent=`“${clock.name}” will be permanently removed from your account. This cannot be undone unless you have a backup.`;showOverlay('deleteOverlay');setTimeout(()=>$('cancelDelete').focus(),50);}
function closeDelete(){hideOverlay('deleteOverlay');state.deleteId=null;}
async function confirmDelete(){if(!state.deleteId||!canWrite())return;const id=state.deleteId;if(await persist([],[id])){closeDelete();if(state.detailId===id)closeDetail();toast('Countdown deleted.');}}

function openDetail(id,tryFullscreen){if(!getClock(id))return;state.detailId=id;$('detailView').hidden=false;document.body.style.overflow='hidden';refreshDetail();
  if(tryFullscreen && $('detailView').requestFullscreen){$('detailView').requestFullscreen({navigationUI:'hide'}).catch(()=>{ /* full-viewport view still works */ });}
}
function closeDetail(){
  if(!state.detailId)return;
  state.detailId=null;document.body.style.overflow='';
  const hide=()=>{$('detailView').hidden=true;};
  // Exit browser fullscreen before hiding the fullscreen element, avoiding browser-specific compositor issues.
  if(document.fullscreenElement && document.exitFullscreen){Promise.resolve(document.exitFullscreen()).catch(()=>{}).finally(hide);}
  else hide();
}

function exportBackup(){const data=JSON.stringify({app:'TIME',version:1,exportedAt:new Date().toISOString(),clocks:state.clocks},null,2);const blob=new Blob([data],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`TIME-countdowns-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Backup downloaded.');}
async function importBackup(event){const session=state.accountUid;const file=event.target.files&&event.target.files[0];event.target.value='';if(!file||!canWrite())return;
  try{if(file.size>2000000)throw new Error('Backup exceeds 2 MB.');const parsed=JSON.parse(await file.text());if(!parsed||parsed.app!=='TIME'||!Array.isArray(parsed.clocks))throw new Error('Not a valid TIME backup.');if(parsed.clocks.length>400)throw new Error('Import at most 400 countdowns at a time.');
    const valid=parsed.clocks.filter(isValidClock).map(c=>({id:String(c.id).slice(0,100),name:c.name.trim().slice(0,65),target:Number(c.target),createdAt:Number(c.createdAt)||Date.now()}));
    if(session!==state.accountUid)throw new Error('Account changed. Select the backup again.');
    if(valid.length!==parsed.clocks.length)throw new Error('Backup contains invalid countdowns. Nothing was imported.');
    valid.forEach(c=>{c.id=newId();});
    if(valid.length && await persist(valid))toast(`${valid.length} countdowns imported into your account.`);
  }catch(err){toast(err.message||'Unable to import backup.');}
}
function initEvents(){
  $('addClockTop').addEventListener('click',()=>openForm());$('addClockGrid').addEventListener('click',()=>openForm());$('homeBrand').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});});
  $('clockForm').addEventListener('submit',onSubmit);$('closeForm').addEventListener('click',closeForm);$('cancelForm').addEventListener('click',closeForm);
  $('closeDelete').addEventListener('click',closeDelete);$('cancelDelete').addEventListener('click',closeDelete);$('confirmDelete').addEventListener('click',confirmDelete);
  document.querySelectorAll('[data-close="form"]').forEach(el=>el.addEventListener('click',closeForm));document.querySelectorAll('[data-close="delete"]').forEach(el=>el.addEventListener('click',closeDelete));
  $('exitDetail').addEventListener('click',closeDetail);$('detailEdit').addEventListener('click',()=>{if(state.detailId)openForm(state.detailId);});
  $('exportBackup').addEventListener('click',exportBackup);$('importBackup').addEventListener('click',()=>$('importFile').click());$('importFile').addEventListener('change',importBackup);
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('deleteOverlay').hidden)closeDelete();else if(!$('formOverlay').hidden)closeForm();else if(state.detailId)closeDetail();});
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&state.detailId&&$('formOverlay').hidden&&$('deleteOverlay').hidden)closeDetail();});
}

// A physically layered, mouse-reactive timeline made entirely in canvas; no WebGL/CDN required.
class Cosmos {
  constructor(canvas,mode){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.mode=mode;this.mouse={x:0,y:0};this.look={x:0,y:0};this.last=0;this.w=1;this.h=1;this.stars=Array.from({length:mode==='timeline'?235:280},(_,i)=>({x:Math.random(),y:Math.random(),z:Math.random(),r:Math.random()*1.5+.4,phase:Math.random()*6.28,hue:(i%6===0?35:190)+Math.random()*35}));this.resize();window.addEventListener('resize',()=>this.resize());window.addEventListener('pointermove',e=>{this.mouse.x=(e.clientX/window.innerWidth-.5)*2;this.mouse.y=(e.clientY/window.innerHeight-.5)*2;},{passive:true});this.raf=requestAnimationFrame(t=>this.draw(t));}
  resize(){const dpr=Math.min(window.devicePixelRatio||1,1.55);this.w=window.innerWidth;this.h=window.innerHeight;this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);this.canvas.style.width=this.w+'px';this.canvas.style.height=this.h+'px';this.ctx.setTransform(dpr,0,0,dpr,0,0);this.dpr=dpr;}
  project(p){let [x,y,z]=p;const ry=this.look.x*.37,rx=this.look.y*.24;const x1=x*Math.cos(ry)+z*Math.sin(ry),z1=-x*Math.sin(ry)+z*Math.cos(ry);const y1=y*Math.cos(rx)-z1*Math.sin(rx),z2=y*Math.sin(rx)+z1*Math.cos(rx);const perspective=3.2/(3.2+z2);return [this.w*(.5+x1*perspective*.41)+this.look.x*this.w*.025,this.h*(.49+y1*perspective*.54)+this.look.y*this.h*.025,perspective];}
  stroke3(points,color,width,glow=0){if(points.length<2)return;const ctx=this.ctx;ctx.beginPath();const first=this.project(points[0]);ctx.moveTo(first[0],first[1]);for(let i=1;i<points.length;i++){const [x,y]=this.project(points[i]);ctx.lineTo(x,y);}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.stroke();ctx.shadowBlur=0;}
  drawStars(t){const c=this.ctx;for(const s of this.stars){let x=s.x*this.w+(this.look.x*(s.z-.3)*35),y=s.y*this.h+(this.look.y*(s.z-.3)*28);const twinkle=.54+.45*Math.sin(t*.0014+s.phase);const a=Math.max(.10,(s.z*.5+.17)*twinkle);c.fillStyle=`hsla(${s.hue},100%,${66+s.z*25}%,${a})`;c.beginPath();c.arc(x,y,s.r*(.55+s.z*.7),0,Math.PI*2);c.fill();if(s.z>.94&&twinkle>.8){c.strokeStyle=`rgba(170,231,255,${a*.3})`;c.beginPath();c.moveTo(x-5,y);c.lineTo(x+5,y);c.moveTo(x,y-5);c.lineTo(x,y+5);c.stroke();}}}
  mainAt(u,t,lane=0){return [u,Math.sin(u*2.5+t*.00022)*.12+Math.sin(u*6.1-t*.0003)*.035+lane*.058,Math.cos(u*2+t*.00014)*.27+lane*.19];}
  timeline(t){const c=this.ctx;
    const halo=c.createRadialGradient(this.w*.56,this.h*.44,10,this.w*.56,this.h*.44,this.w*.55);halo.addColorStop(0,'rgba(11,124,227,.075)');halo.addColorStop(.4,'rgba(26,64,147,.027)');halo.addColorStop(1,'transparent');c.fillStyle=halo;c.fillRect(0,0,this.w,this.h);
    const lanes=[-.9,-.45,0,.45,.9];
    for(const l of lanes){const pts=[];for(let i=0;i<=92;i++){const u=-1.57+3.14*i/92;pts.push(this.mainAt(u,t,l));}
      const main=l===0;this.stroke3(pts,main?'rgba(32,143,255,.20)':'rgba(35,102,222,.075)',main?18:11,main?33:18);
      this.stroke3(pts,main?'rgba(58,173,255,.52)':'rgba(79,142,250,.24)',main?4.2:2.4,main?24:16);
      this.stroke3(pts,main?'rgba(204,248,255,.92)':'rgba(155,207,255,.55)',main?1.3:.7,11);
    }
    for(let b=0;b<19;b++){
      const root=-1.48+(b/18)*3;const dir=b%2?1:-1;const strength=.2+(b%5)*.12;const pts=[];
      for(let k=0;k<=25;k++){const q=k/25;const base=this.mainAt(root,t,0);pts.push([base[0]+q*(.11+(b%3)*.1)+Math.sin(q*3.5+b)*.024,base[1]+dir*q*strength+Math.sin(q*4+b+t*.00038)*q*.045,base[2]+q*(b%2?.44:-.33)]);}
      this.stroke3(pts,'rgba(41,133,247,.20)',6,15);this.stroke3(pts,b%4===0?'rgba(159,226,255,.8)':'rgba(92,166,250,.5)',b%4===0?1.6:1,11);
      if(b%3===0){const start=pts[15],sub=[];for(let k=0;k<=12;k++){const q=k/12;sub.push([start[0]+q*.16,start[1]+dir*q*.16,start[2]-q*.12]);}this.stroke3(sub,'rgba(109,174,255,.35)',.9,8);}
    }
    for(let i=0;i<44;i++){
      const u=((i/44+t*.00006)%1)*3.14-1.57;const p=this.project(this.mainAt(u,t,0));const size=(i%8===0?2.3:1)*p[2];c.fillStyle=i%5===0?'rgba(218,252,255,.98)':'rgba(112,200,255,.73)';c.shadowColor='#7ee6ff';c.shadowBlur=i%5===0?17:6;c.beginPath();c.arc(p[0],p[1],size,0,Math.PI*2);c.fill();c.shadowBlur=0;
    }
    // A rotating event-horizon reticle adds dimensionality without distracting from UI.
    const center=this.project([.18,-.04,.15]);c.save();c.translate(center[0],center[1]);c.rotate(t*.00004+this.look.x*.3);c.strokeStyle='rgba(71,167,255,.13)';c.lineWidth=1;c.setLineDash([3,11]);c.beginPath();c.ellipse(0,0,Math.min(this.w*.26,310),Math.min(this.h*.19,160),-.3,0,Math.PI*2);c.stroke();c.setLineDash([]);c.restore();
  }
  divine(t){const c=this.ctx;const cx=this.w*.68+this.look.x*18,cy=this.h*.48+this.look.y*14;const s=Math.min(this.w,this.h);
    for(let i=0;i<7;i++){c.save();c.translate(cx,cy);c.rotate(-.42+i*.11+t*.000008*(i%2?-1:1));c.beginPath();c.ellipse(0,0,s*(.30+i*.079),s*(.17+i*.045),0,0,Math.PI*2);c.strokeStyle=i%3===0?'rgba(234,174,104,.11)':'rgba(109,165,255,.07)';c.lineWidth=i%3===0?1.5:.7;c.shadowBlur=i%3===0?18:0;c.shadowColor='#f9d48d';c.stroke();c.restore();}
    for(let i=0;i<72;i++){const a=i*2.39996+t*.00005,r=s*(.12+(i%16)*.028);const x=cx+Math.cos(a)*r*(1+.12*this.look.x),y=cy+Math.sin(a)*r*.6;c.fillStyle=i%3===0?'rgba(248,201,137,.5)':'rgba(127,188,255,.27)';c.beginPath();c.arc(x,y,i%9===0?1.9:.75,0,Math.PI*2);c.fill();}
    const halo=c.createRadialGradient(cx,cy,0,cx,cy,s*.65);halo.addColorStop(0,'rgba(255,206,135,.10)');halo.addColorStop(.4,'rgba(92,75,169,.035)');halo.addColorStop(1,'transparent');c.fillStyle=halo;c.fillRect(0,0,this.w,this.h);
  }
  draw(t){this.raf=requestAnimationFrame(x=>this.draw(x));if(t-this.last<(reducedMotion?90:25))return;this.last=t;
    if(this.mode==='timeline'&&$('app').classList.contains('app--loading'))return;
    if(this.mode==='divine'&&$('detailView').hidden)return;
    this.look.x+=(this.mouse.x-this.look.x)*.045;this.look.y+=(this.mouse.y-this.look.y)*.045;
    const c=this.ctx;c.clearRect(0,0,this.w,this.h);this.drawStars(t);if(this.mode==='timeline')this.timeline(t);else this.divine(t);
  }
}

function startLoader(){const lights=[...document.querySelectorAll('.light-unit')],bar=$('raceProgress'),car=$('raceCar'),percent=$('loadPercentage'),msg=$('loadMessage');const duration=reducedMotion?650:4600;let started=null,done=false;
  function finish(){if(done)return;done=true;lights.forEach(l=>l.classList.add('off'));bar.style.width='100%';car.style.left='100%';percent.textContent='100%';msg.textContent='LIGHTS OUT';$('loader').classList.add('is-leaving');$('app').classList.remove('app--loading');setTimeout(()=>$('loader').hidden=true,850);}
  function animate(now){if(done)return;if(started===null)started=now;const p=Math.min(1,(now-started)/duration);const eased=p<.88?(p/.88)*.95:.95+(p-.88)/.12*.05;bar.style.width=`${eased*100}%`;car.style.left=`${eased*100}%`;percent.textContent=pad(Math.floor(eased*100),3)+'%';
    if(p<.23)msg.textContent='ENGINE IGNITION';else if(p<.65)msg.textContent='LIGHTS OUT SEQUENCE';else if(p<.94)msg.textContent='FULL THROTTLE';else msg.textContent='SYSTEM ONLINE';
    lights.forEach((l,i)=>l.classList.toggle('off',p>(.22+i*.145)));
    if(p<1)requestAnimationFrame(animate);else finish();}
  requestAnimationFrame(animate);$('skipLoader').addEventListener('click',finish);
}
function initialize(){initEvents();renderClocks();updateLocalTime();setInterval(()=>{updateLocalTime();refreshClocks();},1000);new Cosmos($('timelineCanvas'),'timeline');new Cosmos($('divineCanvas'),'divine');startLoader();if(!state.storageOK)toast('Local storage unavailable — use Export Backup to preserve clocks.');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
})();
