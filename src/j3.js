
/* ================= Selección, cámara y UI ================= */
const ROOM_KEYS=['o:claude','o:copilot','o:gemini','o:openai','o:otro','o:jefe','o:rec','meet','lounge','kitchen'];
function roomRect(k){if(k.startsWith('o:')){const o=OFFS[k.slice(2)];return o?{x:o.ox,y:o.oy,w:7,h:k==='o:jefe'?14:6}:null}return {meet:{x:7,y:8,w:12,h:6},lounge:{x:19,y:8,w:9,h:6},kitchen:{x:28,y:8,w:7,h:6}}[k]||null}
function defName(k){if(k==='o:jefe')return 'Oficina de '+CFG.name;if(k.startsWith('o:'))return PROVIDERS[k.slice(2)].office;return {meet:'Sala principal',lounge:'Lounge · juegos',kitchen:'Cocina'}[k]}
function roomName(k){return (CFG.names&&CFG.names[k])||defName(k)}
function renameRoom(k,v){v=(v||'').trim();CFG.names=CFG.names||{};if(!v||v===defName(k))delete CFG.names[k];else CFG.names[k]=v;saveCfg();fillTarget();renderRoster();renderTeam();renderSettings();if(selRoom===k)renderRoom()}
function setName(a,v){v=(v||'').trim();if(!v)return;if(a.isMe){CFG.name=v;saveCfg()}else if(a.adv){CFG.advName=v;saveCfg()}a.name=v;if(!a.isMe&&!a.adv)save();fillTarget();updateHud();renderRoster();renderTeam();renderSettings();if(selRoom)renderRoom()}
function setLook(a,k){a.lookIdx=k;a.look=LOOKS[k];if(a.isMe){CFG.look=k;saveCfg()}else if(a.adv){CFG.advLook=k;saveCfg()}else save();renderRoster();renderTeam();if(selected===a)renderDetail();if(selRoom)renderRoom()}
function lookPicker(a){const w=el('div','looks');LOOKS.forEach((L,k)=>{const cn=document.createElement('canvas');drawPortrait(cn,{look:L,provider:a.provider},38);cn.className=a.lookIdx===k?'on':'';cn.title='Aspecto '+(k+1);cn.onclick=()=>setLook(a,k);w.appendChild(cn)});return w}
function roomPeople(k){if(k==='o:jefe'||k==='o:rec')return actors().filter(a=>(a.cur&&a.cur.room===k)&&!a.hidden);
 if(k.startsWith('o:'))return agents.filter(a=>a.provider===k.slice(2));
 return actors().filter(a=>a.cur&&a.cur.room===k&&!a.hidden)}
function roomChatList(k){if(k==='o:jefe')return [];if(k==='o:rec')return [ADV];if(k.startsWith('o:'))return agents.filter(a=>a.provider===k.slice(2));return agents.filter(a=>a.cur&&a.cur.room===k)}
function fitZoom(r){const tw=baseTW||20,zw=(W*0.56)/((r.w+r.h)*tw),zh=(H*0.6)/(((r.w+r.h)/2+3)*tw);return Math.max(0.9,Math.min(4,zw,zh))}
function selectAgent(a){
 selRoom=null;selected=a;zoomT=3.3;axT=0.36;ayT=0.63;
 const th=Math.atan2(a.face[1],a.face[0]),atWall=a.cur&&a.cur.wall&&!a.path.length;rot=angW(rot);rotTarget=atWall?0:Math.PI/4-0.3-th;
 fillTarget();$('#target').value='a'+a.id;setPh();renderRoster();renderDetail();renderTeam()}
function selectRoom(k){const r=roomRect(k);if(!r)return;selected=null;selRoom=k;camTx=r.x+r.w/2;camTy=r.y+r.h/2;zoomT=fitZoom(r);axT=0.36;ayT=0.56;rot=angW(rot);rotTarget=0;
 fillTarget();$('#target').value=k.startsWith('o:')&&roomChatList(k).length?(k==='o:rec'?'brief':'g:'+k):'brief';setPh();renderRoster();renderRoom();renderTeam()}
function newJob(){setChat(true);showTab('chat');selectRoom('o:rec');$('#target').value='brief';setPh();$('#inp').focus();addMsg('sys','',`📝 Pasaste por la recepción: contale el trabajo a ${ADV.name}. Ella arma una reunión con el equipo y reparte las tareas.`)}
function deselect(){selected=null;selRoom=null;zoomT=0.94;axT=0.5;ayT=0.46;camTx=21;camTy=7.4;rot=angW(rot);rotTarget=0;$('#detail').classList.remove('on');renderRoster();renderTeam()}
$('#bSpin').onclick=()=>{if(selected||selRoom)deselect();spin=Math.PI*2};
$('#bView').onclick=()=>{deselect();spin=0};
$('#bMeet').onclick=async()=>{if(running)return;
 if(!results.length){addMsg('sys','','Todavía no hay trabajo para rendir. Dale una tarea al equipo primero.');return}
 if(summoned)await dismissSummon();
 running=true;try{await Promise.all(agents.map(stopBeh));await meeting()}finally{running=false}};
const sm=$('#summonMenu');
$('#bSummon').onclick=e=>{e.stopPropagation();$('#mBack').style.display=summoned?'':'none';sm.classList.toggle('on')};
document.addEventListener('click',()=>sm.classList.remove('on'));
sm.querySelectorAll('button').forEach(b=>b.onclick=()=>{sm.classList.remove('on');const m=b.dataset.m;if(m==='back')dismissSummon();else summon(m,null,b.dataset.w)});
$('#bAway').onclick=()=>setAway(!CFG.away);
$('#bLife').onclick=()=>{CFG.life=!CFG.life;saveCfg();updateHud()};
$('#bTheme').onclick=()=>{DARK=!DARK;CFG.dark=DARK;saveCfg();applyTheme()};
function applyTheme(){document.body.classList.toggle('light',!DARK);$('#bTheme').textContent=DARK?'🌙 Oscuro':'☀ Claro'}
function updateHud(){const b=$('#bAway');b.textContent=CFG.away?'🧑‍💼 Ausente · atiende '+ADV.name:'🧑‍💼 Estoy presente';b.classList.toggle('on',CFG.away);
 const l=$('#bLife');l.textContent=CFG.life?'☕ Vida libre: sí':'☕ Vida libre: no';l.classList.toggle('on',CFG.life)}

function setChat(o){CFG.chat=o;saveCfg();$('#mainGrid').classList.toggle('noaside',!o);$('#bChat').style.display=o?'none':''}
$('#bClose').onclick=()=>setChat(false);$('#bChat').onclick=()=>setChat(true);
function showTab(t){if(!CFG.chat)setChat(true);document.querySelectorAll('#tabs button[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id==='p-'+t))}
document.querySelectorAll('#tabs button[data-t]').forEach(b=>b.onclick=()=>showTab(b.dataset.t));
const feed=$('#feed');
function addMsg(kind,who,text){const m=el('div','msg '+kind);if(who&&kind!=='sys')m.appendChild(el('div','who',who));m.appendChild(document.createTextNode(text));feed.appendChild(m);feed.scrollTop=feed.scrollHeight;return m}
function fillTarget(){const s=$('#target'),v=s.value;s.innerHTML='';const add=(val,txt)=>{const o=el('option',null,txt);o.value=val;s.appendChild(o)};
 if(ADV)add('brief',`Nuevo trabajo → ${ADV.name} (te escucha y lo reparte al equipo)`);
 add('team','Mandar directo a todo el equipo (sin pasar por la asesora)');
 if(ADV)add('a'+ADV.id,`Charlar solo con ${ADV.name} (tu asesor/a)`);
 agents.forEach(a=>add('a'+a.id,`Hablar solo con ${a.name} (${a.role})`));
 PO.forEach(p=>{if(agents.some(a=>a.provider===p))add('g:o:'+p,'Hablar con toda la oficina: '+roomName('o:'+p))});
 if([...s.options].some(o=>o.value===v))s.value=v;setPh()}
function setPh(){const v=$('#target').value;$('#inp').placeholder=v==='brief'?`Contale el trabajo a ${ADV.name}: ella lo reparte al equipo…`:v==='team'?'Dale una tarea al equipo…':'Escribí tu mensaje…'}
$('#target').addEventListener('change',setPh);
function renderChips(){const c=$('#chips');c.innerHTML='';const mk=(a,b)=>{const x=el('span','chip');x.appendChild(document.createTextNode(a+' '));x.appendChild(el('b',null,b));c.appendChild(x)};
 mk('Claude real:',sampleState);mk('Tu PC:',PC.on?'conectada':'sin conectar');mk('APIs conectadas:',String(PO.filter(p=>conn({provider:p})).length));mk('Agentes:',String(agents.length));mk('Tokens usados:',fmtN(totalTok()));mk('Tareas hechas:',String(tasksDone))}

/* --- barra lateral: navegación, departamentos y agentes --- */
let RREF=[];
const asking=a=>a.state==='asking';
function renderRoster(){
 const box=$('#side');if(!box)return;box.innerHTML='';RREF=[];
 const br=el('div','sbrand');br.appendChild(el('span','slogo','🏢'));br.appendChild(el('b',null,'OFICINA IA'));box.appendChild(br);
 const nb=el('button','snew','+ Nuevo trabajo');nb.onclick=newJob;box.appendChild(nb);
 const item=(ico,txt,fn,sel,key,cls)=>{const r=el('div','sitem'+(sel?' sel':''));r.appendChild(typeof ico==='string'?el('span','sico',ico):ico);r.appendChild(el('span','stx',txt));const bd=el('span','sbd '+(cls||'red'));r.appendChild(bd);r.onclick=fn;box.appendChild(r);RREF.push({bd,key});return r};
 item('🌐','El mundo',()=>{deselect();spin=0},!selected&&!selRoom);
 item('📊','Dashboard',()=>showTab('res'),false,{n:()=>results.length},'blue');
 item('🧑‍💼','Para '+CFG.name,()=>selectRoom('o:jefe'),selRoom==='o:jefe');
 item('✋','Te toca',()=>{const a=agents.find(asking);if(a)selectAgent(a);showTab('chat')},false,{n:()=>agents.filter(asking).length});
 box.appendChild(el('div','shead','Departamentos'));
 ['o:jefe','o:rec',...PO.filter(p=>agents.some(a=>a.provider===p)).map(p=>'o:'+p),'meet','kitchen'].forEach(k=>{
  const col=k==='o:jefe'?'#e0a526':k==='o:rec'?'#e0577a':k==='meet'?'#8f9bb8':k==='kitchen'?'#e0803a':PROVIDERS[k.slice(2)].color;
  const sq=el('span','dsq');sq.style.background=col;
  item(sq,roomName(k),()=>selRoom===k?deselect():selectRoom(k),selRoom===k,{n:()=>k.startsWith('o:')&&k!=='o:jefe'&&k!=='o:rec'?agents.filter(a=>a.provider===k.slice(2)&&asking(a)).length:0})});
 box.appendChild(el('div','shead','Tus agentes'));
 [ADV,...agents].forEach(a=>{const c=el('div','sag'+(selected===a?' sel':''));const cn=document.createElement('canvas');c.appendChild(cn);
  const m=el('div','mid');const nm=el('div','nm');nm.appendChild(el('span',null,a.name));const ch=el('span','pchip',prov(a).ini);ch.style.background=prov(a).color;ch.style.fontSize='9px';nm.appendChild(ch);
  const tk=el('div','tk');const sd=el('span','sdot');sd.style.width=sd.style.height='7px';const tt=el('span');tk.appendChild(sd);tk.appendChild(tt);
  const sb=el('div','sb');m.appendChild(nm);m.appendChild(tk);m.appendChild(sb);c.appendChild(m);c.onclick=()=>selected===a?deselect():selectAgent(a);box.appendChild(c);
  drawPortrait(cn,a,34);RREF.push({a,c,sd,tt,sb})});
 updateRoster()}
function updateRoster(){
 RREF.forEach(r=>{
  if(r.bd){const n=r.key?r.key.n():0,t=n>0?String(n):'';if(r.bd._t!==t){r.bd._t=t;r.bd.textContent=t;r.bd.classList.toggle('on',n>0)}return}
  const a=r.a,col=STATE_COL[a.state]||'#9aa6bd',tx=(a.used||0)+' msj · '+a.tasks.length+' tarea'+(a.tasks.length===1?'':'s'),
   sb=asking(a)?'te necesita':(a.act||(a.state==='working'?a.doing:'')||a.role),sig=col+tx+sb+asking(a);
  if(r.sig===sig)return;r.sig=sig;r.sd.style.background=col;r.sd.title=STATE_ES[a.state]||'';r.tt.textContent=tx;r.sb.textContent=sb;r.sb.title=sb;r.c.classList.toggle('ask',asking(a))})}

/* --- tarjeta de detalle --- */
let DREF=null;
function renderDetail(){
 const a=selected,d=$('#detail');if(!a){d.classList.remove('on');return}
 d.innerHTML='';d.classList.add('on');DREF={};
 const hd=el('div','hd');const cn=document.createElement('canvas');hd.appendChild(cn);
 const nm=el('div');const h=el('h3',null,a.name);nm.appendChild(h);nm.appendChild(el('div','small',a.role));
 const l2=el('div');l2.style.cssText='display:flex;gap:6px;align-items:center;margin-top:3px';const ch=el('span','pchip',prov(a).label);ch.style.background=prov(a).color;l2.appendChild(ch);l2.appendChild(el('span','small',planName(a)));
 const bd=el('span','badge '+(conn(a)?'real':'sim'),conn(a)?'API':'SIM');l2.appendChild(bd);nm.appendChild(l2);hd.appendChild(nm);
 const x=el('button','x','✕');x.onclick=deselect;hd.appendChild(x);d.appendChild(hd);drawPortrait(cn,a,58);
 const mk=(t)=>{const s=el('div');s.appendChild(el('h4',null,t));return s};
 const st=mk('Estado');DREF.st=el('div','box');st.appendChild(DREF.st);d.appendChild(st);
 const qh=mk('Qué hace');const qb=el('div','box');qb.appendChild(el('div',null,roleDesc(a)));DREF.doing=el('div','small');DREF.doing.style.marginTop='4px';qb.appendChild(DREF.doing);qh.appendChild(qb);d.appendChild(qh);
 const th=mk('Tareas a cargo');DREF.tasks=el('div','box');th.appendChild(DREF.tasks);d.appendChild(th);
 const tl=mk('Herramientas');const tw=el('div','tools');prov(a).tools.forEach(t=>tw.appendChild(el('span',null,t)));tl.appendChild(tw);d.appendChild(tl);
 const qu=mk('Cupo · ventana de 5 h');const bar=el('div','bar');DREF.bi=el('i');bar.appendChild(DREF.bi);qu.appendChild(bar);DREF.qt=el('div','small');qu.appendChild(DREF.qt);d.appendChild(qu);
 {const pe=mk('Personalizar');const ni=el('input','nmin');ni.value=a.name;ni.placeholder='Nombre';ni.onchange=()=>setName(a,ni.value);pe.appendChild(ni);pe.appendChild(lookPicker(a));d.appendChild(pe)}
 const ch2=mk('Hablar con '+a.name);DREF.reply=el('div','box');DREF.reply.style.display='none';DREF.reply.style.marginBottom='6px';DREF.reply.style.whiteSpace='pre-wrap';ch2.appendChild(DREF.reply);
 const mini=el('div','mini');const inp=el('input');inp.placeholder='Escribile algo…';const go=el('button','pri','Enviar');go.style.padding='6px 12px';
 const send=async()=>{const v=inp.value.trim();if(!v)return;inp.value='';if(pending){addMsg('user','Vos',v);const p=pending;pending=null;p(v);return}if(running){addMsg('sys','','Hay una tarea en curso, esperá a que termine.');return}addMsg('user','Vos → '+a.name,v);await directChat(a,v)};
 go.onclick=send;inp.addEventListener('keydown',e=>{if(e.key==='Enter')send()});mini.appendChild(inp);mini.appendChild(go);ch2.appendChild(mini);if(!a.isMe)d.appendChild(ch2);
 updateDetail()}
function updateDetail(){const a=selected;if(!a||!DREF)return;rollWin(a);
 DREF.st.innerHTML='';const row=el('div');row.style.cssText='display:flex;align-items:center;gap:8px';const dot=el('span','sdot');dot.style.background=STATE_COL[a.state]||'#9aa6bd';row.appendChild(dot);row.appendChild(el('b',null,STATE_ES[a.state]||a.state));
 row.appendChild(el('span','small',a.path.length?'· caminando':a.seated?'· sentado/a':'· de pie'));DREF.st.appendChild(row);
 if(a.state==='working'){const b=el('div','bar');b.style.marginTop='6px';const i=el('i');i.style.width=Math.round(a.progress*100)+'%';i.style.background=prov(a).color;b.appendChild(i);DREF.st.appendChild(b)}
 DREF.doing.textContent=a.act||a.doing;
 DREF.tasks.innerHTML='';if(!a.tasks.length)DREF.tasks.appendChild(el('div','small','Todavía no tiene tareas.'));else{const ul=el('ul');a.tasks.slice(-5).forEach(t=>{const li=el('li',null,(t.st==='hecho'?'✔ ':t.st==='corregido'?'↻ ':t.st==='en curso'?'● ':'• ')+t.text+' ');li.appendChild(el('span','small','('+t.st+')'));ul.appendChild(li)});DREF.tasks.appendChild(ul)}
 const lim=limit(a);DREF.bi.style.width=Math.min(100,a.used/lim*100)+'%';DREF.bi.style.background=a.used>=lim?'var(--bad)':'var(--acc)';
 DREF.qt.textContent=`${a.used}/${lim} mensajes (estimado, plan ${planName(a)})`+(a.winStart?` · se reinicia en ${resetIn(a)}`:'');
 if(a.lastReply){DREF.reply.style.display='block';DREF.reply.textContent=a.lastReply}}

/* --- tarjeta de oficina (grupo) --- */
let GREF=null,RSIG='';
function renderRoom(){
 const k=selRoom,d=$('#detail');if(!k)return;
 d.innerHTML='';d.classList.add('on');
 const people=roomPeople(k);
 const hd=el('div','hd');const nm=el('div');{const ri=el('input','rname');ri.value=roomName(k);ri.title='Tocá para cambiarle el nombre a este espacio';ri.onchange=()=>renameRoom(k,ri.value);nm.appendChild(ri)}
 nm.appendChild(el('div','small',people.length?people.length+(people.length===1?' persona':' personas')+(k.startsWith('o:')?'':' ahora'):'Nadie por ahora'));hd.appendChild(nm);
 const x=el('button','x','✕');x.onclick=deselect;hd.appendChild(x);d.appendChild(hd);
 const mem=el('div');mem.appendChild(el('h4',null,'Quiénes están'));
 if(!people.length)mem.appendChild(el('div','small','La sala está vacía.'));
 people.forEach(a=>{const r=el('div','mrow');const cn=document.createElement('canvas');r.appendChild(cn);const t=el('div');t.appendChild(el('div','nm',a.name));
  t.appendChild(el('div','ro',a.isMe?(a.act||'Vos'):a.role+' · '+(a.act||STATE_ES[a.state]||'')));r.appendChild(t);r.onclick=()=>selectAgent(a);mem.appendChild(r);drawPortrait(cn,a,34)});
 d.appendChild(mem);
 const chat=roomChatList(k);
 if(chat.length){const h=el('div');h.appendChild(el('h4',null,k==='o:rec'?'Contale el trabajo a '+ADV.name:'Hablar con '+(chat.length>1?'toda la oficina':chat[0].name)));
  GREF={reply:el('div','box')};GREF.reply.style.cssText='display:none;margin-bottom:6px;white-space:pre-wrap';h.appendChild(GREF.reply);
  const mini=el('div','mini');const inp=el('input');inp.placeholder=chat.length>1?'Escribile a todos…':'Escribile…';const go=el('button','pri','Enviar');go.style.padding='6px 12px';
  const send=async()=>{const v=inp.value.trim();if(!v)return;inp.value='';addMsg('user','Vos → '+roomName(k),v);await groupSend(k,v)};
  go.onclick=send;inp.addEventListener('keydown',e=>{if(e.key==='Enter')send()});mini.appendChild(inp);mini.appendChild(go);h.appendChild(mini);d.appendChild(h)}
 if(k==='o:rec'){const b=el('button','pri','Contarle un trabajo nuevo');b.onclick=()=>{$('#target').value='brief';setPh();showTab('chat');$('#inp').focus()};d.appendChild(b)}
 if(k==='o:jefe'){const b=el('button',null,CFG.away?'Volví: estoy presente':'Me voy: que atienda '+ADV.name);b.onclick=()=>setAway(!CFG.away);d.appendChild(b)}
 else if(k.startsWith('o:')&&k!=='o:rec'&&chat.length){const b=el('button',null,'Que vengan a mi oficina');b.onclick=()=>summon('custom',chat,'office');d.appendChild(b);const b2=el('button',null,'Que vengan a la sala de reuniones');b2.onclick=()=>summon('custom',chat,'meet');d.appendChild(b2)}
 RSIG=roomSig()}
const roomSig=()=>selRoom?roomPeople(selRoom).map(a=>a.id+a.state+(a.act||'')+(a.cur?a.cur.room:'')).join('|'):'';

/* --- pestaña Equipo --- */
const ROLE_LIST=Object.keys(ROLES);
function renderTeam(){
 const box=$('#teamBox');if(box.contains(document.activeElement)&&document.activeElement.tagName==='INPUT')return;box.innerHTML='';
 const dl=el('datalist');dl.id='roles';ROLE_LIST.forEach(r=>{const o=el('option');o.value=r;dl.appendChild(o)});box.appendChild(dl);
 box.appendChild(el('div','small','Los productores trabajan en este orden; el rol QA/Revisor verifica al final y devuelve lo que falla. Cada IA tiene su oficina (hasta 4 personas por IA).'));
 {const c=el('div','card');c.appendChild(el('b',null,'Tu oficina y tu asesor/a'));
  const g1=el('div','grid');const nm=el('input');nm.value=CFG.name;nm.placeholder='Tu nombre';nm.onchange=()=>{CFG.name=nm.value.trim()||CFG.name;ME.name=CFG.name;saveCfg();fillTarget();updateHud();renderRoster()};
  const lk=el('select');LOOKS.forEach((l,k)=>{const o=el('option',null,'Tu aspecto '+(k+1));o.value=k;lk.appendChild(o)});lk.value=CFG.look;lk.onchange=()=>{CFG.look=+lk.value;ME.lookIdx=CFG.look;ME.look=LOOKS[CFG.look];saveCfg()};
  g1.appendChild(nm);g1.appendChild(lk);c.appendChild(g1);
  c.appendChild(el('div','small','Asesor/a: te representa cuando estás ausente y responde las dudas del equipo.'));
  const g2=el('div','grid');const an=el('input');an.value=CFG.advName;an.onchange=()=>{CFG.advName=an.value.trim()||CFG.advName;ADV.name=CFG.advName;saveCfg();fillTarget();updateHud();renderRoster()};
  const al=el('select');LOOKS.forEach((l,k)=>{const o=el('option',null,'Aspecto '+(k+1));o.value=k;al.appendChild(o)});al.value=CFG.advLook;al.onchange=()=>{CFG.advLook=+al.value;ADV.lookIdx=CFG.advLook;ADV.look=LOOKS[CFG.advLook];saveCfg();renderRoster()};
  const ap=el('select');PROVIDERS.claude.plans.forEach((n,k)=>{const o=el('option',null,'Plan '+n);o.value=k;ap.appendChild(o)});ap.value=CFG.advPlan;ap.onchange=()=>{CFG.advPlan=+ap.value;ADV.planIdx=CFG.advPlan;saveCfg()};
  g2.appendChild(an);g2.appendChild(al);g2.appendChild(ap);c.appendChild(g2);
  const row=el('div','top');const b1=el('button',null,'Ver mi oficina');b1.onclick=()=>selectRoom('o:jefe');const b2=el('button',null,CFG.away?'Volví':'Me ausento');b2.onclick=()=>setAway(!CFG.away);row.appendChild(b1);row.appendChild(b2);c.appendChild(row);box.appendChild(c)}
 agents.forEach((a,i)=>{rollWin(a);const p=prov(a);const c=el('div','card'+(selected===a?' sel':''));
  const top=el('div','top');const cn=document.createElement('canvas');cn.style.cssText='width:34px;height:34px;border-radius:50%;background:#e8eefb';top.appendChild(cn);
  const nm=el('input');nm.value=a.name;nm.style.cssText='font-weight:700;flex:1;min-width:0';nm.onchange=()=>{a.name=nm.value.trim()||a.name;save();fillTarget();renderRoster()};top.appendChild(nm);
  {const k=conn(a);top.appendChild(el('span','badge '+(k?'real':'sim'),k?(k.pc?'API · PC':'API'):'SIN KEY'))}
  const ar=el('div','arrows');const up=el('button',null,'↑'),dn=el('button',null,'↓');up.disabled=running||i===0;dn.disabled=running||i===agents.length-1;
  up.onclick=()=>{[agents[i-1],agents[i]]=[agents[i],agents[i-1]];save();renderTeam();renderRoster()};dn.onclick=()=>{[agents[i+1],agents[i]]=[agents[i],agents[i+1]];save();renderTeam();renderRoster()};ar.appendChild(up);ar.appendChild(dn);top.appendChild(ar);c.appendChild(top);
  const g=el('div','grid');
  const ps=el('select');PO.forEach(k=>{const o=el('option',null,PROVIDERS[k].label+' · '+roomName('o:'+k));o.value=k;ps.appendChild(o)});ps.value=a.provider;
  ps.onchange=()=>{if(running){ps.value=a.provider;return}const n=agents.filter(x=>x.provider===ps.value&&x!==a).length;if(n>=4){addMsg('sys','','Esa oficina ya tiene 4 personas. Elegí otra IA.');ps.value=a.provider;return}
   a.provider=ps.value;a.model='';a.planIdx=Math.min(a.planIdx,prov(a).plans.length-1);resetPlacement();save();renderTeam();renderRoster()};
  const pl=el('select');p.plans.forEach((n,k)=>{const o=el('option',null,n);o.value=k;pl.appendChild(o)});pl.value=a.planIdx;pl.onchange=()=>{a.planIdx=+pl.value;save();renderTeam();renderRoster()};
  const role=el('input');role.setAttribute('list','roles');role.value=a.role;role.placeholder='Rol';role.onchange=()=>{a.role=role.value.trim()||a.role;save();fillTarget();renderRoster();updateDetail()};
  const mp=modelPicker(a.provider,a.model,v=>{a.model=(v===DEFMODEL[a.provider]?'':v);save();renderTeam()});g.appendChild(mp);
  g.appendChild(ps);g.appendChild(pl);g.appendChild(role);const lk=el('select');LOOKS.forEach((l,k)=>{const o=el('option',null,'Aspecto '+(k+1));o.value=k;lk.appendChild(o)});lk.value=a.lookIdx;lk.onchange=()=>{a.lookIdx=+lk.value;a.look=LOOKS[a.lookIdx];save();renderRoster();renderTeam()};g.appendChild(lk);c.appendChild(g);
  const lim=limit(a),bar=el('div','bar'),bi=el('i');bi.style.width=Math.min(100,a.used/lim*100)+'%';if(a.used>=lim)bi.style.background='var(--bad)';bar.appendChild(bi);c.appendChild(bar);
  c.appendChild(el('div','small',`Tokens: ${fmtN(a.tokIn||0)} entrada · ${fmtN(a.tokOut||0)} salida · ${a.calls||0} llamadas`+(conn(a)?'':' · sin API key (no responde)')));
  c.appendChild(el('div','small',`Ventana de 5 h: ${a.used}/${lim} mensajes (estimado)`+(a.winStart?` · se reinicia en ${resetIn(a)}`:'')));
  const row=el('div','top');const b1=el('button',null,'Acercar cámara');b1.onclick=()=>selectAgent(a);
  const b2=el('button',null,'Quitar');b2.disabled=running;b2.onclick=()=>{agents.splice(i,1);if(selected===a)deselect();resetPlacement();save();fillTarget();renderTeam();renderChips();renderRoster()};
  row.appendChild(b1);row.appendChild(b2);c.appendChild(row);box.appendChild(c);drawPortrait(cn,a,34)});
 if(!agents.length){const c=el('div','card');c.appendChild(el('div','small','No hay agentes. Sumá el primero abajo (por ejemplo uno de Claude y uno de Gemini).'));box.appendChild(c)}
 if(agents.length){const wipe=el('button',null,'Eliminar todos los agentes');wipe.disabled=running;wipe.onclick=()=>{if(!confirm('¿Eliminar a todos los agentes del equipo? (Tu oficina y tu asesora no se tocan.)'))return;removeAllAgents()};box.appendChild(wipe)}
 addAgentCard(box);
}
function removeAllAgents(){agents.forEach(a=>{if(a.beh)a.beh.stop=true});agents.length=0;if(selected&&!selected.isMe&&!selected.adv)deselect();summoned=null;resetPlacement();save();fillTarget();renderTeam();renderSettings();renderChips();renderRoster()}
function modelPicker(provider,cur,onSet){
 const list=MODELS[provider];
 if(!list){const i=el('input');i.type='text';i.placeholder='Modelo (por defecto: '+(DEFMODEL[provider]||'')+')';i.value=cur||'';i.onchange=()=>onSet(i.value.trim());return i}
 const sel=el('select');const cv=cur||DEFMODEL[provider];
 list.forEach(m=>{const o=el('option',null,m.label);o.value=m.id;sel.appendChild(o)});
 if(!list.some(m=>m.id===cv)){const o=el('option',null,'Personalizado · '+cv);o.value=cv;sel.appendChild(o)}
 const oo=el('option',null,'Otro modelo (escribir el ID)…');oo.value='__otro';sel.appendChild(oo);sel.value=cv;
 sel.onchange=()=>{if(sel.value==='__otro'){const v=(prompt('ID exacto del modelo (por ejemplo '+DEFMODEL[provider]+'):')||'').trim();if(!v){sel.value=cv;return}const o=el('option',null,'Personalizado · '+v);o.value=v;sel.insertBefore(o,oo);sel.value=v}onSet(sel.value)};
 return sel}
function addAgentCard(box){
 if(agents.length<8){const f=el('div','add');f.appendChild(el('b',null,'Sumar un empleado'));const g=el('div','grid');
  const ps=el('select');PO.forEach(k=>{const full=agents.filter(x=>x.provider===k).length>=4;const o=el('option',null,PROVIDERS[k].label+(full?' (oficina llena)':''));o.value=k;o.disabled=full;ps.appendChild(o)});ps.value=PO.find(k=>agents.filter(x=>x.provider===k).length<4)||'otro';
  const nm=el('input');nm.placeholder='Nombre de la persona';nm.value=NAMEPOOL.find(n=>!agents.some(a=>a.name===n))||'';const rl=el('input');rl.setAttribute('list','roles');rl.placeholder='Rol (ej. Frontend)';
  const pl=el('select');const fillPl=()=>{pl.innerHTML='';PROVIDERS[ps.value].plans.forEach((n,k)=>{const o=el('option',null,n);o.value=k;pl.appendChild(o)})};fillPl();let newModel='';const mw=el('div');mw.style.display='contents';const fillMd=()=>{newModel='';mw.innerHTML='';mw.appendChild(modelPicker(ps.value,'',v=>{newModel=v}))};fillMd();ps.onchange=()=>{fillPl();fillMd()};
  g.appendChild(ps);g.appendChild(pl);g.appendChild(mw);g.appendChild(nm);g.appendChild(rl);f.appendChild(g);
  const ad=el('button','pri','Agregar');ad.onclick=()=>{if(running)return;const a=mkAgent({provider:ps.value,name:nm.value.trim()||NAMEPOOL[agents.length%NAMEPOOL.length],role:rl.value.trim()||'Colaborador',planIdx:+pl.value,model:newModel,look:agents.length});
   agents.push(a);resetPlacement();save();fillTarget();renderTeam();renderSettings();renderChips();renderRoster()};
  f.appendChild(ad);f.appendChild(el('div','small','Si esa IA tiene su API key en Ajustes, responde con la IA real; si no, en modo simulado.'));box.appendChild(f)}

}
/* --- pestaña Ajustes: conexiones, departamentos y empleados --- */
function renderSettings(){
 const box=$('#setBox');if(!box)return;const ae=document.activeElement;if(box.contains(ae)&&(ae.tagName==='INPUT'||ae.tagName==='SELECT'))return;box.innerHTML='';
 const pc=el('div','card');const pt=el('div','top');pt.appendChild(el('b',null,'Conexión a tu PC'));const pb=el('span','badge '+(PC.on?'real':'sim'),PC.on?'CONECTADA':'SIN CONECTAR');pb.style.marginLeft='auto';pt.appendChild(pb);pc.appendChild(pt);
 if(PC.on){pc.appendChild(el('div','small','Carpeta de trabajo: '+PC.info.workspace+'. Los agentes guardan ahí lo que hacen y el QA verifica la sintaxis del código de verdad. Las API keys se guardan en tu PC, no en el navegador.'));
  const r=el('div','top');const ls=el('button',null,'Ver archivos');const lo=el('div','pre');lo.style.display='none';
  ls.onclick=async()=>{try{const walk=async(d,dep)=>{const it=(await pcFetch('/api/fs/list?path='+encodeURIComponent(d))).items;let t='';for(const x of it.slice(0,25)){t+='  '.repeat(dep)+(x.dir?'📁 ':'📄 ')+x.name+'\n';if(x.dir&&dep<3)t+=await walk((d?d+'/':'')+x.name,dep+1)}return t};lo.textContent=(await walk('',0))||'(carpeta vacía)';lo.style.display='block'}catch(e){lo.textContent='✖ '+e.message;lo.style.display='block'}};
  const dc=el('button',null,'Desconectar');dc.onclick=pcDisconnect;r.appendChild(ls);r.appendChild(dc);pc.appendChild(r);pc.appendChild(lo)}
 else{pc.appendChild(el('div','small','1) Abrí el servidor en tu PC (start.bat en Windows o ./start.sh). 2) Entrá al link que muestra, o pegá acá la dirección y la clave de acceso.'));
  const st=el('div','stack');const ui=el('input');ui.type='text';ui.value=CFG.pc.url;ui.placeholder='http://localhost:8787';const ti=el('input');ti.type='password';ti.placeholder='Clave de acceso (la muestra el servidor)';ti.value=CFG.pc.token||'';ti.autocomplete='off';st.appendChild(ui);st.appendChild(ti);pc.appendChild(st);
  const out=el('div','small');out.textContent=PC.err||'';const cb=el('button','pri','Conectar');cb.onclick=async()=>{CFG.pc.url=ui.value.trim()||'http://localhost:8787';CFG.pc.token=ti.value.trim();saveCfg();out.textContent='Conectando…';await pcConnect(true);if(!PC.on)out.textContent='✖ '+PC.err};pc.appendChild(cb);pc.appendChild(out)}
 box.appendChild(pc);
 const h=el('div','card');h.appendChild(el('b',null,'Conexiones · API keys'));h.appendChild(el('div','small',PC.on?'Pegá la clave de cada proveedor: se guarda en tu PC (server/data/config.json) y las llamadas a la IA salen desde ahí. Sin clave, esa IA responde en modo simulado.':'Pegá la clave de cada proveedor. Sin servidor en tu PC se guarda en este navegador (texto plano) y se envía directo al proveedor. Con la PC conectada se guarda en tu computadora. Sin clave, esa IA responde en modo simulado.'));const sr=el('label','small');sr.style.cssText='display:flex;gap:8px;align-items:center;margin-top:8px;cursor:pointer';const ck=el('input');ck.type='checkbox';ck.checked=CFG.strict!==false;ck.onchange=()=>{CFG.strict=ck.checked;saveCfg()};sr.appendChild(ck);sr.appendChild(document.createTextNode('Modo real: si un agente no tiene API key, no responde (sin respuestas de ejemplo)'));h.appendChild(sr);
 box.appendChild(h);
 PO.forEach(p=>{const P=PROVIDERS[p],onPC=PC.on&&PC.info.keys[p],K=PC.on?(onPC||{}):(CFG.keys[p]||{});const c=el('div','card');
  const top=el('div','top');const t=el('b',null,P.label);t.style.color=P.color;top.appendChild(t);top.appendChild(el('span','small',roomName('o:'+p)));
  const has=PC.on?!!onPC:!!(K.key||K.base);const bd=el('span','badge '+(has?'real':'sim'),has?(PC.on?'CONECTADA (PC)':'CONECTADA'):'SIMULADA');bd.style.marginLeft='auto';top.appendChild(bd);c.appendChild(top);
  const st=el('div','stack');const key=el('input');key.type='password';key.placeholder=PC.on&&onPC?'•••• guardada en tu PC (escribí otra para cambiarla)':KEYHINT[p];key.value=PC.on?'':(K.key||'');key.autocomplete='off';
  const mdl=el('input');mdl.type='text';mdl.placeholder='Modelo (por defecto: '+DEFMODEL[p]+')';mdl.value=K.model||'';
  const base=el('input');base.type='text';base.placeholder=p==='otro'?'URL base compatible con OpenAI (ej. https://openrouter.ai/api/v1)':'URL base (opcional)';base.value=K.base||'';
  st.appendChild(key);st.appendChild(mdl);st.appendChild(base);c.appendChild(st);
  const out=el('div','small');const row=el('div','top');
  const saveK=async()=>{const v={key:key.value.trim(),model:mdl.value.trim(),base:base.value.trim()};
   if(PC.on){try{await pcFetch('/api/keys',{method:'PUT',body:{provider:p,key:v.key,keepKey:!v.key&&!!onPC,model:v.model,base:v.base}});PC.info=await pcFetch('/api/status')}catch(e){out.textContent='✖ '+e.message}}
   else{if(!v.key&&!v.base)delete CFG.keys[p];else CFG.keys[p]=v;saveCfg()}renderChips();renderTeam()};
  const sv=el('button','pri','Guardar');sv.onclick=async()=>{await saveK();key.blur();renderSettings()};
  const ts=el('button',null,'Probar');ts.onclick=async()=>{await saveK();out.textContent='Probando…';try{const r=await (PC.on?ADAPTERS.pc:ADAPTERS.api)({provider:p},[{role:'user',content:'Respondé solo con la palabra OK.'}],'Sos un asistente de prueba.');out.textContent='✔ Conectó. Respondió: '+short(r,80)}catch(e){out.textContent='✖ '+(e.message||e)}};
  const rm=el('button',null,'Quitar clave');rm.onclick=async()=>{if(PC.on){try{await pcFetch('/api/keys',{method:'PUT',body:{provider:p,remove:true}});PC.info=await pcFetch('/api/status')}catch(e){}}delete CFG.keys[p];saveCfg();renderChips();renderTeam();renderSettings()};
  row.appendChild(sv);row.appendChild(ts);row.appendChild(rm);c.appendChild(row);c.appendChild(out);box.appendChild(c)});
 const dp=el('div','card');dp.appendChild(el('b',null,'Nombres de los departamentos'));
 const g=el('div','stack');['o:jefe','o:rec',...PO.map(p=>'o:'+p),'meet','lounge','kitchen'].forEach(k=>{const r=el('div');r.style.cssText='display:flex;gap:8px;align-items:center';
  const sq=el('span','dsq');sq.style.background=k==='o:jefe'?'#e0a526':k==='o:rec'?'#e0577a':k.startsWith('o:')?PROVIDERS[k.slice(2)].color:k==='meet'?'#8f9bb8':'#e0803a';r.appendChild(sq);
  const i=el('input');i.type='text';i.value=roomName(k);i.placeholder=defName(k);i.onchange=()=>renameRoom(k,i.value);r.appendChild(i);g.appendChild(r)});
 dp.appendChild(g);const rs=el('button',null,'Restaurar nombres originales');rs.onclick=()=>{CFG.names={};saveCfg();fillTarget();renderRoster();renderTeam();renderSettings()};dp.appendChild(rs);box.appendChild(dp);
 addAgentCard(box)}
function renderResults(){
 const box=$('#resBox');box.innerHTML='';
 if(!results.length){box.appendChild(el('div','small','Acá van a aparecer los resultados de cada agente y el veredicto de QA cuando termine una tarea.'));return}
 const prods=results.filter(r=>r.kind!=='qa');const last=prods[prods.length-1];
 if(last){const fin=el('div','card final');fin.appendChild(el('b',null,'Entrega final · '+last.agent.name+' ('+last.agent.role+')'));fin.appendChild(el('div','pre',last.text));box.appendChild(fin)}
 if(verdict){const v=el('div','card');v.style.borderColor=verdict.ok?'#9ad8bf':'#f0a3a6';v.appendChild(el('b',null,(verdict.ok?'✔ QA aprobó':'✖ QA no pudo aprobar')+' · '+verdict.agent.name+(verdict.rounds>1?` (${verdict.rounds} rondas)`:'')));v.appendChild(el('div','pre',verdict.text));v.appendChild(el('div','small',lastCheck?(lastCheck.checked?`Además se verificó la sintaxis real de ${lastCheck.checked} archivo(s) en tu PC: ${lastCheck.bad?lastCheck.bad+' con errores':'sin errores'}. Carpeta: ${lastCheck.dir}`:`Guardado en tu PC: ${lastCheck.dir}`):'Revisión por lectura. Conectá tu PC en Ajustes para guardar archivos y verificar la sintaxis de verdad.'));box.appendChild(v)}
 prods.slice(0,-1).forEach(r=>{const d=el('details','card');d.appendChild(el('summary',null,`${r.agent.name} · ${r.agent.role}`));d.appendChild(el('div','pre',r.text));box.appendChild(d)})}
EXAMPLES.forEach(t=>{const b=el('button',null,t.length>46?t.slice(0,44)+'…':t);b.title=t;b.onclick=()=>{$('#inp').value=t;$('#target').value='team'};$('#ex').appendChild(b)});

/* ================= Conexión a tu PC (fase 2) ================= */
const PC={on:false,info:null,err:''};
async function pcFetch(path,o){o=o||{};
 const base=(CFG.pc.url||'http://localhost:8787').replace(/\/$/,'');let r;
 try{r=await fetch(base+path,{method:o.method||'GET',headers:{'x-office-token':CFG.pc.token||'','content-type':'application/json'},body:o.body?JSON.stringify(o.body):undefined})}
 catch(e){throw new Error('No encuentro el servidor en '+base+'. ¿Lo iniciaste en tu PC?')}
 const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||('Error '+r.status));if(j.quota)e.quota=true;e.status=r.status;throw e}return j}
async function pcConnect(silent){
 try{PC.info=await pcFetch('/api/status');PC.on=true;PC.err='';saveCfg()}
 catch(e){PC.on=false;PC.info=null;PC.err=e.message||String(e);if(!silent)addMsg('sys','','⚠ '+PC.err)}
 renderChips();renderTeam();renderSettings();return PC.on}
function pcDisconnect(){PC.on=false;PC.info=null;CFG.pc.token='';saveCfg();renderChips();renderTeam();renderSettings()}
function pcBoot(){
 const m=/[#&]token=([\w-]+)/.exec(location.hash||'');
 if(m){CFG.pc.token=m[1];if(/^https?:$/.test(location.protocol)&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname))CFG.pc.url=location.origin;saveCfg();try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}pcConnect(true).then(ok=>{if(ok)addMsg('sys','','🖥 Conectado a tu PC. Las API keys y los archivos de trabajo ahora viven en tu computadora.')});return}
 if(CFG.pc.token)pcConnect(true)}
const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'x';
const pad2=n=>String(n).padStart(2,'0');
let projDir='',lastCheck=null;
const EXT={js:'js',javascript:'js',node:'js',mjs:'mjs',ts:'ts',typescript:'ts',py:'py',python:'py',json:'json',sh:'sh',bash:'sh',shell:'sh',html:'html',css:'css',sql:'sql',md:'md',java:'java',c:'c',cpp:'cpp',go:'go',rs:'rs',rust:'rs'};
function extractCode(text,agent,used){const out=[];const re=/```([^\n`]*)\n([\s\S]*?)```/g;let m,n=0;
 while((m=re.exec(text))){n++;const info=(m[1]||'').trim().split(/\s+/)[0].toLowerCase();let ext=EXT[info]||'txt',code=m[2].replace(/\s+$/,'')+'\n';
  const h=/^\s*(?:\/\/|#|--|<!--|\/\*)\s*(?:archivo|file|nombre)\s*:\s*([\w.\/-]+)/i.exec(code);let name=h&&!/\.\./.test(h[1])&&!/^\//.test(h[1])?h[1]:null;
  if(!name){name=slug(agent.name)+'-'+n+'.'+ext;if(ext==='js'&&/^\s*(import\s.+from|export\s)/m.test(code))name=name.replace(/\.js$/,'.mjs')}
  if(used[name]){const d=name.lastIndexOf('.');name=name.slice(0,d)+'-'+n+name.slice(d)}used[name]=1;out.push({name,code})}
 return out}
async function pcSync(task){
 if(!PC.on)return null;
 try{
  if(!projDir){const d=new Date();projDir='proyectos/'+d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+'-'+pad2(d.getHours())+pad2(d.getMinutes())+'-'+slug(task).slice(0,28)}
  const last={};results.filter(r=>r.kind!=='qa').forEach(r=>last[r.agent.id]=r);
  const files=[],codeFiles=[],used={};let i=0;
  await pcFetch('/api/fs/write',{method:'POST',body:{path:projDir+'/TAREA.md',content:'# Tarea\n\n'+task+'\n'}});
  for(const r of Object.values(last)){i++;const f=projDir+'/'+pad2(i)+'-'+slug(r.agent.name)+'-'+slug(r.agent.role)+'.md';
   await pcFetch('/api/fs/write',{method:'POST',body:{path:f,content:'# '+r.agent.name+' · '+r.agent.role+'\n\n'+r.text+'\n'}});files.push(f);
   for(const c of extractCode(r.text,r.agent,used)){const cf=projDir+'/codigo/'+c.name;await pcFetch('/api/fs/write',{method:'POST',body:{path:cf,content:c.code}});codeFiles.push(cf)}}
  let res=[];if(codeFiles.length)res=(await pcFetch('/api/check',{method:'POST',body:{files:codeFiles}})).results;
  const real=res.filter(x=>!x.skipped),bad=real.filter(x=>!x.ok);
  lastCheck={dir:projDir,files:files.length,code:codeFiles.length,checked:real.length,bad:bad.length,res};
  let report;
  if(!codeFiles.length)report='No hay archivos de código en el trabajo del equipo (no había nada para compilar).';
  else if(!real.length)report=`Se guardaron ${codeFiles.length} archivo(s) de código pero ninguno es de un tipo verificable (js, json, py, sh).`;
  else report=(bad.length?`${bad.length} de ${real.length} archivo(s) NO pasan la verificación de sintaxis:\n`:`Los ${real.length} archivo(s) verificables pasan la verificación de sintaxis.\n`)+real.map(x=>(x.ok?'✔ ':'✖ ')+x.file.split('/').pop()+(x.ok?'':': '+x.output.split('\n').filter(Boolean).slice(0,4).join(' | '))).join('\n');
  addMsg('sys','',(bad.length?'🔧 Compilación real ✖ ':'🔧 Compilación real ✔ ')+report.split('\n')[0]+(bad.length?'\n'+report.split('\n').slice(1).join('\n'):''));
  return report
 }catch(e){addMsg('sys','','⚠ No pude guardar/verificar en tu PC: '+(e.message||e));return null}}

/* ================= Adaptadores (fase 2: se enchufan APIs reales acá) ================= */
function persona(a){if(a.adv)return `Sos ${a.name}, asesor/a personal y representante de ${CFG.name} dentro de una oficina de agentes de IA. Cuando ${CFG.name} no está, respondés las dudas del equipo con criterio y decisiones concretas. Respondé siempre en español, claro y conciso.`;return `Sos ${a.name}, un agente de IA (motor ${prov(a).label}) con el rol de "${a.role}" dentro de una oficina de agentes que trabaja en equipo. Respondé siempre en español, claro y concreto.`+(isQA(a)?' Todavía no podés ejecutar ni compilar código: revisás por lectura que todo esté completo, que las piezas encajen entre sí y que no haya errores evidentes de sintaxis o lógica.':'')}
function canned(a,msgs){
 const all=msgs.map(m=>m.content).join(' ');
 if(/representante de/.test(all)&&/Pregunta:/.test(all))return 'Dale con la opción más simple y estándar; dejá anotados los supuestos y después lo ajustamos.';
 if(a.adv)return '[Respuesta de ejemplo, sin IA conectada]\nTe represento cuando no estás: decime qué querés priorizar y lo coordino con el equipo.';
 if(/Ronda: (\d)/.test(all)){const r=+all.match(/Ronda: (\d)/)[1],nm=((all.match(/Nombres válidos: ([^\n.]+)/)||[])[1]||'').split(',')[0].trim()||'el primer agente';
  return r<2?`RECHAZADO: ${nm}: falta contemplar un caso límite (entrada vacía) y dejar explícitos los supuestos.`:'APROBADO: todo es coherente y las piezas encajan.'}
 const task=((all.match(/Tarea del usuario: ([^\n]*)/)||[])[1]||'la tarea').slice(0,90);
 if(/Feedback de QA/.test(all))return `[Respuesta de ejemplo, sin IA conectada]\nCorregido: ahora manejo el caso límite que marcó QA y dejé escritos los supuestos para "${task}".`;
 return `[Respuesta de ejemplo, sin IA conectada]\nComo ${a.role}, sobre "${task}": definí los puntos clave, los ordené por prioridad y dejé listo lo necesario para el siguiente compañero.`}
const ADAPTERS={
 async sample(a,msgs,sys){
  if(!sampleFn){if(CFG.strict!==false)throw new Error(`${a.name} (${prov(a).label}) no tiene API key. Cargala en Ajustes (modo real: sin respuestas simuladas).`);await sleep(1800+Math.random()*1500);return canned(a,msgs)}
  const m=[{role:'user',content:sys+'\n\n'+msgs[0].content},...msgs.slice(1)];
  try{const r=await sampleFn(m,{cache:false});return (r.text||'').trim()}
  catch(e){if(e&&e.code==='not_granted'){sampleFn=null;sampleState='sin permiso';renderChips();if(CFG.strict!==false)throw new Error('Sin permiso para usar Claude desde la página: cargá una API key en Ajustes.');addMsg('sys','','No hay permiso para usar Claude desde la página: sigo con respuestas de ejemplo.');return canned(a,msgs)}
   if(e&&e.code==='rate_limited')throw new Error('Se alcanzó el límite de uso de Claude. Probá en unos minutos.');throw e}},
 async pc(a,msgs,sys){const m=msgs.map(x=>({role:x.role==='assistant'?'assistant':'user',content:x.content}));
  try{const j=await pcFetch('/api/llm',{method:'POST',body:{provider:a.provider,model:a.model||'',system:sys,messages:m}});addUsage(a,j.usage);return j.text}
  catch(e){if(e.quota){const q=new Error(e.message);q.quota=true;throw q}throw e}},
 async api(a,msgs,sys){const K=CFG.keys[a.provider]||{},kind=KIND[a.provider]||'openai',model=a.model||K.model||DEFMODEL[a.provider];
  const m=msgs.map(x=>({role:x.role==='assistant'?'assistant':'user',content:x.content}));let url,headers={'content-type':'application/json'},body,pick,use=()=>null;
  if(kind==='anthropic'){url=(K.base||'https://api.anthropic.com')+'/v1/messages';headers['x-api-key']=K.key;headers['anthropic-version']='2023-06-01';headers['anthropic-dangerous-direct-browser-access']='true';
   body={model,max_tokens:2048,system:sys,messages:m};pick=j=>(j.content||[]).map(c=>c.text||'').join('');use=j=>({in:j.usage?.input_tokens||0,out:j.usage?.output_tokens||0})}
  else if(kind==='gemini'){url=(K.base||'https://generativelanguage.googleapis.com/v1beta')+`/models/${model}:generateContent?key=${encodeURIComponent(K.key)}`;
   body={systemInstruction:{parts:[{text:sys}]},contents:m.map(x=>({role:x.role==='assistant'?'model':'user',parts:[{text:x.content}]}))};pick=j=>((j.candidates||[])[0]?.content?.parts||[]).map(c=>c.text||'').join('');use=j=>({in:j.usageMetadata?.promptTokenCount||0,out:(j.usageMetadata?.candidatesTokenCount||0)+(j.usageMetadata?.thoughtsTokenCount||0)})}
  else{const base=(K.base||DEFBASE[a.provider]||'').replace(/\/$/,'');if(!base)throw new Error('Falta la URL base de la API para '+PROVIDERS[a.provider].label);
   url=base+'/chat/completions';if(K.key)headers.Authorization='Bearer '+K.key;body={model,messages:[{role:'system',content:sys},...m]};pick=j=>j.choices?.[0]?.message?.content||'';use=j=>({in:j.usage?.prompt_tokens||0,out:j.usage?.completion_tokens||0})}
  let r;try{r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)})}catch(e){throw new Error('No pude conectar con '+PROVIDERS[a.provider].label+' (¿clave, URL o CORS?)')}
  const raw=await r.text();let j={};try{j=JSON.parse(raw)}catch(e){}
  if(!r.ok){const msg=j.error?.message||j.error||raw.slice(0,160);const e=new Error(`${PROVIDERS[a.provider].label} respondió ${r.status}: ${typeof msg==='string'?msg:JSON.stringify(msg)}`);if(r.status===429)e.quota=true;throw e}
  const t=(pick(j)||'').trim();if(!t)throw new Error('Respuesta vacía de '+PROVIDERS[a.provider].label);addUsage(a,use(j));return t}
};
function addUsage(a,u){if(!u)return;a.tokIn=(a.tokIn||0)+(u.in||0);a.tokOut=(a.tokOut||0)+(u.out||0);a.calls=(a.calls||0)+1;save();renderChips();if(typeof renderTeam==='function')renderTeam()}
const fmtN=n=>n>=1e6?(n/1e6).toFixed(2)+' M':n>=1e3?(n/1e3).toFixed(1)+' mil':String(n);
const totalTok=()=>agents.concat(ADV?[ADV]:[]).reduce((t,a)=>t+(a.tokIn||0)+(a.tokOut||0),0);
const KIND={claude:'anthropic',openai:'openai',gemini:'gemini',copilot:'openai',otro:'openai'};
const MODELS={
 claude:[{id:'claude-fable-5-2',label:'Fable 5.2 · el más potente'},{id:'claude-opus-5-5',label:'Opus 5.5 · muy potente'},{id:'claude-sonnet-5-5',label:'Sonnet 5.5 · equilibrado'},{id:'claude-haiku-5-5',label:'Haiku 5.5 · el más barato y rápido'}],
 gemini:[{id:'gemini-3.1-pro-preview',label:'Gemini 3.1 Pro · el más potente'},{id:'gemini-3.8-flash',label:'Gemini 3.8 Flash · rápido y capaz'},{id:'gemini-2.5-pro',label:'Gemini 2.5 Pro · razonamiento'},{id:'gemini-3.5-flash-lite',label:'Gemini 3.5 Flash-Lite · barato'},{id:'gemini-2.5-flash-lite',label:'Gemini 2.5 Flash-Lite · el más barato'}]};
const DEFMODEL={claude:'claude-sonnet-5-5',openai:'gpt-4o-mini',gemini:'gemini-3.8-flash',copilot:'openai/gpt-4.1',otro:'llama-3.1-70b-instruct'};
const DEFBASE={openai:'https://api.openai.com/v1',copilot:'https://models.github.ai/inference',otro:''};
const KEYHINT={claude:'sk-ant-… (console.anthropic.com)',openai:'sk-… (platform.openai.com)',gemini:'AIza… (aistudio.google.com)',copilot:'Token de GitHub con permiso "models"',otro:'Clave de tu proveedor (opcional si es local)'};
const conn=a=>{if(PC.on&&PC.info&&PC.info.keys&&PC.info.keys[a.provider])return {pc:true};const K=CFG.keys&&CFG.keys[a.provider];return K&&(K.key||(a.provider==='otro'&&K.base))?K:null};
async function callAgent(a,msgs,sys){
 const K=conn(a);
 if(!K){rollWin(a);if(a.used>=limit(a)){const e=new Error('Sin cupo');e.quota=true;throw e}}
 if(!a.winStart)a.winStart=Date.now();a.used++;save();renderTeam();
 return K?(K.pc?ADAPTERS.pc:ADAPTERS.api)(a,msgs,sys||persona(a)):ADAPTERS.sample(a,msgs,sys||persona(a));
}

/* ================= Coordinación ================= */
const short=(t,n)=>{t=t.replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1)+'…':t};
const summary=t=>{const s=t.replace(/\[Respuesta de ejemplo[^\]]*\]\s*/,'').replace(/\s+/g,' ').trim();const k=s.search(/[.!?]\s/);return k>20&&k<110?s.slice(0,k+1):(s.length>100?s.slice(0,98)+'…':s)};
function buildPrompt(a,task,outs){
 const prev=outs.map(o=>`### ${o.agent.name} (${o.agent.role})\n${o.text}`).join('\n\n');
 return `Tarea del usuario: ${task}\n`+(prev?`\nTrabajo previo del equipo:\n${prev}\n`:'')+
 `\nHacé SOLO tu parte según tu rol de "${a.role}", en español y conciso (máximo ~150 palabras). Si tu rol es técnico, entregá código breve y comentado que encaje con lo que ya hicieron tus compañeros. Si te falta un dato imprescindible, respondé únicamente con UNA línea que empiece con "PREGUNTA:" seguida de la pregunta.`}
function waitAnswer(a,q){if(CFG.away&&ADV)return advisorAnswer(a,q);
 return new Promise(res=>{a.state='asking';a.pose='think';a.bubble='❓ '+q;a.doing='Te hizo una pregunta y espera tu respuesta.';const m=addMsg('q','❓ '+a.name+' te pregunta',q);showTab('chat');
 $('#inp').placeholder='Respondele a '+a.name+'…';$('#inp').focus();
 pending=ans=>{setPh();a.bubble='';a.pose=null;a.state='working';a.doing='Retomó el trabajo con tu respuesta.';res(ans)}})}
async function work(a,task,outs,extra){
 const hist=[{role:'user',content:buildPrompt(a,task,outs)+(extra||'')}];a.askLeft=2;
 const info=classify(task);startBeh(a,info);const t0=Date.now();
 try{
  for(;;){const txt=await callAgent(a,hist);const m=txt.match(/^\s*PREGUNTA:\s*([\s\S]+)/i);
   if(m&&a.askLeft>0){a.askLeft--;await stopBeh(a);const ans=await waitAnswer(a,m[1].trim().split('\n')[0]);
    hist.push({role:'assistant',content:txt},{role:'user',content:'Respuesta del usuario: '+ans+'\nAhora hacé tu parte; no hagas más preguntas.'});startBeh(a,info);continue}
   const rest=info.minMs-(Date.now()-t0);if(rest>0)await sleep(rest);
   return m?m[1].trim():txt}
 }finally{await stopBeh(a)}}
async function moveTo(a,spot,sit){if(a._mv)await a._mv;const p=route(a.cur,spot);a.cur=spot;const pr=goTo(a,p,sit,spot.f);a._mv=pr;await pr;if(a._mv===pr)a._mv=null}
/* caminar a la oficina de otra persona (como en el video de Iterhub) */
async function visit(from,to,msg,reply){
 addMsg('sys','',`🚶 ${from.name} va a la oficina de ${to.name} (${roomName(to.home?to.home.room:'o:'+to.provider)}).`);
 await moveTo(from,visitSpot(to),false);
 from.bubble=msg;await sleep(2400);from.bubble='';
 if(reply){to.bubble=reply;to.wave=1.2;await sleep(1300);to.bubble=''}
 moveTo(from,homeSpot(from),true)}
async function sendToLounge(a){if(a.away)return;a.away=true;a.doing='Descansando: se quedó sin cupo en su ventana de 5 h.';const spot=LOUNGE[agents.indexOf(a)%LOUNGE.length];
 await moveTo(a,spot,true);a.bubble='😴 Descansando hasta que se reinicie mi cupo';await sleep(3500);if(a.state==='blocked')a.bubble=''}
async function returnFromLounge(a){if(!a.away)return;a.away=false;a.bubble='';a.doing='Volvió a su escritorio.';await moveTo(a,homeSpot(a),true)}
async function meeting(){
 await Promise.all(agents.map(stopBeh));
 const parts=[];results.forEach(r=>{if(!parts.includes(r.agent))parts.push(r.agent)});
 addMsg('sys','','🏢 Reunión en la sala principal');
 await Promise.all(parts.map((a,i)=>moveTo(a,SEATS[i%SEATS.length],true)));
 for(const r of results){r.agent.bubble=summary(r.text);r.agent.wave=0;addMsg('sys','','📣 '+r.agent.name+': '+summary(r.text));await sleep(2600);r.agent.bubble=''}
 await Promise.all(parts.map(a=>moveTo(a,homeSpot(a),true)));
 renderResults();showTab('res')}
function parseVerdict(txt,prods){
 if(/RECHAZADO/i.test(txt)){const m=txt.match(/RECHAZADO:?\s*([^:\n]+?)\s*:\s*([\s\S]+)/i);const nameStr=m?m[1]:txt;
  const who=prods.find(p=>nameStr.toLowerCase().includes(p.name.toLowerCase()))||prods[prods.length-1];return {ok:false,who,reason:(m?m[2]:txt).trim().split('\n')[0]}}
 return {ok:true,reason:txt.replace(/^\s*APROBADO:?\s*/i,'').trim()}}
async function verifyLoop(task,qa,prods){
 let rounds=0;
 for(;;){
  rounds++;qa.state='working';qa.progress=0;qa.doing=`Verificando el trabajo de ${prods.map(p=>p.name).join(', ')} (ronda ${rounds}).`;
  addMsg('sys','',`🔎 ${qa.name} (${qa.role}) revisa el trabajo de todos · ronda ${rounds}.`);
  const outs=results.filter(r=>r.kind!=='qa'&&prods.includes(r.agent));
  const lastOut={};outs.forEach(r=>lastOut[r.agent.id]=r);
  const body=Object.values(lastOut).map(o=>`### ${o.agent.name} (${o.agent.role})\n${o.text}`).join('\n\n');
  const rep=await pcSync(task);
  const pr=`Tarea del usuario: ${task}\n\nTrabajo del equipo:\n${body}\n\n${rep?'Resultado de la compilación real (ejecutada en la PC del usuario, es un hecho, no una opinión):\n'+rep+'\nSi hay archivos que no pasan, RECHAZÁ señalando al agente dueño de ese archivo.\n\n':''}Ronda: ${rounds}\nNombres válidos: ${prods.map(p=>p.name).join(', ')}.\n\nVerificá que el conjunto esté completo, que las piezas encajen entre sí (por ejemplo que el frontend use lo que expone el backend) y que no haya errores evidentes que impidan que compile o funcione. Respondé SOLO con una de estas dos formas: "APROBADO: <una frase>" o "RECHAZADO: <Nombre del agente>: <motivo concreto en una frase>".`;
  let txt;const t1=Date.now();startBeh(qa,{kind:'analyze',complex:false,minMs:8000});
  try{txt=await callAgent(qa,[{role:'user',content:pr}]);const rest=8000-(Date.now()-t1);if(rest>0)await sleep(rest)}catch(e){qa.state='done';throw e}finally{await stopBeh(qa)}
  const v=parseVerdict(txt,prods);
  if(v.ok||rounds>=3){qa.state='done';qa.progress=1;verdict={ok:v.ok,text:v.ok?v.reason:('Quedó pendiente: '+v.reason),agent:qa,rounds};
   addMsg('qa'+(v.ok?'':' bad'),`${qa.name} · QA`,(v.ok?'✔ APROBADO: ':'✖ Sigue observado: ')+v.reason);
   qa.tasks.forEach(t=>{if(t.st==='en curso')t.st=v.ok?'hecho':'rechazado'});return v}
  addMsg('qa bad',`${qa.name} · QA`,`✖ RECHAZADO (${v.who.name}): ${v.reason}`);
  qa.state='done';qa.doing=`Encontró un problema en el trabajo de ${v.who.name}.`;
  await visit(qa,v.who,'Encontré un problema: '+short(v.reason,80),'Entendido, lo corrijo.');
  const bad=v.who;bad.state='working';bad.progress=0;bad.doing=`Corrigiendo lo que marcó ${qa.name}: ${short(v.reason,70)}`;
  const mine=lastOut[bad.id];bad.tasks.push({text:'Corrección: '+short(v.reason,50),st:'en curso'});
  let fixed;try{fixed=await work(bad,task,results.filter(r=>r.kind!=='qa'&&r.agent!==bad),`\n\nTu trabajo anterior:\n${mine?mine.text:''}\n\nFeedback de QA (${qa.name}): ${v.reason}\nCorregí lo señalado y devolvé tu parte completa y actualizada.`)}
  catch(e){if(e.quota){bad.state='blocked';sendToLounge(bad);verdict={ok:false,text:'No se pudo corregir: sin cupo.',agent:qa,rounds};return {ok:false}}throw e}
  bad.state='done';bad.progress=1;bad.doing='Entregó la corrección.';bad.tasks.forEach(t=>{if(t.st==='en curso')t.st='corregido'});
  results.push({agent:bad,text:fixed,kind:'fix'});addMsg('agent',`${bad.name} · ${bad.role} (corrección)`,fixed);
  await visit(bad,qa,'🔧 Ya lo corregí: '+summary(fixed).replace(/^Corregido:\s*/i,'').slice(0,60),'Lo reviso de nuevo.');
 }}
async function runTask(task){
 if(!agents.length){addMsg('sys','','Todavía no hay agentes en el equipo. Sumá uno en la pestaña Equipo o en Ajustes.');return}
 running=true;t0=Date.now();results=[];verdict=null;currentTask=task;projDir='';lastCheck=null;renderResults();const team=agents.slice();$('#send').disabled=true;
 await Promise.all(agents.map(stopBeh));
 if(CFG.away)addMsg('sys','',`🧑‍💼 ${CFG.name} está ausente: ${ADV.name} atiende al equipo y responde sus dudas.`);
 for(const a of team){rollWin(a);if(a.state==='blocked'&&a.used<limit(a)){a.state='idle';await returnFromLounge(a)}a.tasks.push({text:short(task,48),st:'en curso'})}
 let qa=team.find(isQA);const prods=team.filter(x=>x!==qa);nTeam=prods.length+(qa?1:0);
 try{
  for(let i=0;i<prods.length;i++){
   turn=i+1;const a=prods[i];
   if(a.state==='blocked'){continue}
   a.state='working';a.progress=0;a.bubble='';a.doing=`Trabajando en: «${short(task,60)}»`;addMsg('sys','',`▶ ${a.name} (${a.role}) se puso a trabajar en la oficina de ${prov(a).label}.`);
   let text;
   try{text=await work(a,task,results.filter(r=>r.kind!=='qa'))}
   catch(e){if(e.quota){a.state='blocked';a.bubble='Sin cupo';a.tasks.forEach(t=>{if(t.st==='en curso')t.st='sin cupo'});addMsg('sys','',`⛔ ${a.name} se quedó sin cupo del plan ${planName(a)} (se reinicia en ${resetIn(a)}). Se va al lounge a descansar.`);renderTeam();sendToLounge(a);continue}throw e}
   a.state='done';a.progress=1;a.doing='Entregó su parte: '+summary(text).slice(0,90);a.tasks.forEach(t=>{if(t.st==='en curso')t.st='hecho'});
   results.push({agent:a,text,kind:'work'});addMsg('agent',`${a.name} · ${a.role}`,text);renderTeam();
   const next=prods.slice(i+1).find(x=>x.state!=='blocked')||(qa&&qa.state!=='blocked'?qa:null);
   if(next)await visit(a,next,'📨 Te paso lo mío: '+summary(text).slice(0,60),next===qa?'Recibido, lo reviso.':'Recibido ✓');
  }
  if(qa){rollWin(qa);if(qa.state==='blocked'||qa.used>=limit(qa)){addMsg('sys','',`${qa.name} (QA) no tiene cupo: la entrega sale sin verificar.`)}
   else if(results.length){turn=nTeam;await verifyLoop(task,qa,prods.filter(p=>results.some(r=>r.agent===p)))}}
  if(results.length&&PC.on&&!lastCheck)await pcSync(task);
  if(results.length){await meeting();tasksDone++;if(PC.on&&projDir)addMsg('sys','','📁 Guardado en tu PC: '+PC.info.workspace+'/'+projDir)}else addMsg('sys','','Nadie pudo trabajar (sin cupo o error).');
 }catch(e){addMsg('sys','','⚠ '+(e&&e.message||'Error inesperado'))}
 finally{running=false;pending=null;$('#send').disabled=false;agents.forEach(a=>{if(a.state!=='blocked'){a.state='idle';a.bubble='';a.doing='Esperando una tarea.'}});renderTeam();renderChips();renderRoster()}
}
async function chatOne(a,text){
 a.chat.push({role:'user',content:text});a.state='working';a.progress=0;a.doing='Te está respondiendo.';a.wave=0;
 try{const r=await callAgent(a,a.chat,persona(a));a.chat.push({role:'assistant',content:r});addMsg('agent',a.name,r);a.lastReply=r;a.bubble=summary(r).slice(0,80);setTimeout(()=>{a.bubble=''},4000);return a.name+': '+r}
 catch(e){const m=e.quota?`⛔ ${a.name} no tiene más cupo en esta ventana (se reinicia en ${resetIn(a)}).`:'⚠ '+(e.message||'Error');addMsg('sys','',m);a.chat.pop();return m}
 finally{if(a.state!=='blocked'){a.state='idle';a.progress=0;a.doing='Esperando una tarea.'}}}
async function directChat(a,text){
 running=true;$('#send').disabled=true;
 try{await stopBeh(a);await chatOne(a,text)}finally{running=false;$('#send').disabled=false;renderTeam();updateDetail()}}
async function groupSend(k,text){
 const list=roomChatList(k);if(!list.length)return;
 if(running){addMsg('sys','','Hay una tarea en curso, esperá a que termine.');return}
 running=true;$('#send').disabled=true;
 try{await Promise.all(list.map(stopBeh));const outs=await Promise.all(list.map(a=>chatOne(a,text)));
  if(GREF&&selRoom===k){GREF.reply.style.display='block';GREF.reply.textContent=outs.join('\n\n')}}
 finally{running=false;$('#send').disabled=false;renderTeam()}}
async function onSend(){
 const inp=$('#inp'),text=inp.value.trim();if(!text)return;inp.value='';
 if(pending){addMsg('user','Vos',text);const p=pending;pending=null;p(text);return}
 if(running){addMsg('sys','','Hay una tarea en curso, esperá a que termine.');return}
 addMsg('user','Vos',text);const t=$('#target').value;
 if(t==='brief')await briefAdvisor(text);
 else if(t==='team'){
  if(summoned){const sd=summoned;sd.list.forEach(x=>{x.bubble='';x.pose='listen'});sd.host.bubble=short(text,70);await sleep(2600);sd.host.bubble='';await dismissSummon()}
  await runTask(text)}
 else if(t.startsWith('g:'))await groupSend(t.slice(2),text);
 else{const a=actors().find(x=>'a'+x.id===t);if(a)await directChat(a,text)}
}

/* ===== Nuevo trabajo: se lo contás a la asesora y ella lo reparte, como en la vida real ===== */
const assignOf=(a,qa)=>a===qa?'revisar todo al final y devolver lo que falle':'la parte de '+(a.role||'trabajo').toLowerCase();
async function briefAdvisor(text){
 if(!agents.length){addMsg('sys','','Todavía no hay agentes en el equipo: sumá uno en la pestaña Equipo antes de pasarle un trabajo a '+ADV.name+'.');return}
 const adv=ADV;running=true;$('#send').disabled=true;
 try{
  if(summoned){const sd=summoned;summoned=null;sd.list.forEach(a=>{a.pose=null;a.bubble=''});sd.host.bubble='';await Promise.all([...sd.list.map(a=>moveTo(a,homeSpot(a),true)),moveTo(sd.host,homeSpot(sd.host),true)])}
  await Promise.all(actors().map(stopBeh));
  const present=!CFG.away,team=agents.filter(a=>{rollWin(a);return !(a.state==='blocked'&&a.used>=limit(a))});
  const qa=team.find(isQA);
  adv.state='working';adv.progress=0;adv.doing=`Escucha el pedido de ${CFG.name}.`;
  if(present){addMsg('sys','',`🚶 ${CFG.name} va a hablar con ${adv.name}.`);await moveTo(ME,visitSpot(adv),false);ME.bubble=short(text,80);adv.pose='listen';await sleep(2800);ME.bubble='';adv.pose=null}
  adv.bubble='Anotado 📝 Lo armo y lo reparto.';
  addMsg('agent',`${adv.name} · asesor/a`,`Entendido${present?', '+CFG.name:''}. Convoco a una reunión de arranque en la sala principal y les reparto el trabajo.`);
  await sleep(1400);adv.bubble='';
  if(present)moveTo(ME,homeSpot(ME),true);
  // ella va a la sala principal y llama al equipo
  adv.doing='Reúne al equipo para repartir el trabajo.';
  const goAdv=moveTo(adv,HEAD,false);
  team.forEach(a=>{a.doing=`${adv.name} los convocó a la sala principal.`;a.bubble='📞 Voy';});
  await Promise.all([goAdv,...team.map((a,i)=>moveTo(a,SEATS[i%SEATS.length],true))]);
  team.forEach(a=>{a.bubble='';a.pose='listen'});
  addMsg('sys','','🏢 Reunión de arranque en la sala principal');
  for(const a of team){adv.bubble=`${a.name}: te toca ${assignOf(a,qa)}.`;a.wave=0;await sleep(1500);a.bubble='Dale 👍';a.wave=1.2;await sleep(650);a.bubble=''}
  adv.bubble='Eso es todo, ¡a trabajar!';team.forEach(a=>{a.pose=null});
  await Promise.all([...team.map(a=>moveTo(a,homeSpot(a),true)),moveTo(adv,homeSpot(adv),true)]);adv.bubble='';
  adv.state='idle';adv.progress=0;adv.doing='Esperando una tarea.';
  await runTask(text);
  // informa de vuelta
  running=true;$('#send').disabled=true;
  if(results.length){const sm=results.filter(r=>r.kind==='work').map(r=>r.agent.name).filter((x,i,ar)=>ar.indexOf(x)===i);
   if(present){await moveTo(adv,visitSpot(ME),false);adv.bubble=`${CFG.name}, terminamos 🎉`;await sleep(2200);adv.bubble=''}
   addMsg('agent',`${adv.name} · asesor/a`,`${present?CFG.name+', t':'T'}erminamos. Participaron ${sm.join(', ')||'el equipo'}. Tenés el detalle en la pestaña Resultados.`);
   if(present)await moveTo(adv,homeSpot(adv),true)}
 }catch(e){addMsg('sys','','⚠ '+(e&&e.message||'Error inesperado'))}
 finally{running=false;$('#send').disabled=false;adv.bubble='';adv.state='idle';adv.doing='Esperando una tarea.';renderTeam();renderRoster()}}
$('#send').onclick=onSend;
$('#inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();onSend()}});

/* ================= Comportamiento: pizarra, café, cocina, vida libre ================= */
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
function wpick(pool,avoid){const p=pool.filter(x=>x[0]!==avoid),t=p.reduce((n,x)=>n+x[1],0);let r=Math.random()*t;for(const x of p){r-=x[1];if(r<=0)return x[0]}return p[0][0]}
function sleepI(c,ms){return new Promise(res=>{const t0=performance.now(),iv=setInterval(()=>{if(c.stop||performance.now()-t0>=ms){clearInterval(iv);res()}},50)})}
const go=async(a,c,spot,sit)=>{if(c.stop)return false;await moveTo(a,spot,sit);return !c.stop};
async function hold(a,c,pose,prop,ms,act,thought){a.pose=pose;a.prop=prop||null;if(act)a.act=act;a.thought=thought||'';await sleepI(c,ms);a.pose=null;a.prop=null;a.thought=''}
const HELLO=['¿Cómo viene tu parte?','¿Tomamos un café?','Qué día largo, ¿no?','¿Viste lo que armó el resto?','Necesito despejarme un rato.'];
const REPLY=['Bien, avanzando.','¡Dale, en un rato!','Ni me digas 😅','Todavía no, pero ya lo miro.','Te entiendo, jaja.'];
const ACT={
 async type(a,c){await hold(a,c,null,null,rnd(2500,4500),'',a.state==='working'?'💻':'')},
 async think(a,c){await hold(a,c,'think',null,rnd(2600,4200),'Piensa cómo encarar el problema.','💡')},
 async sipSeat(a,c){await hold(a,c,'sip','mug',rnd(3500,5200),'Toma un café sin levantarse.','☕')},
 async readDoc(a,c){await hold(a,c,'read','paper',rnd(3800,5600),'Lee un documento con atención.','📄')},
 async stretch(a,c){await hold(a,c,'stretch',null,rnd(2400,3400),'Estira las piernas y la espalda.','😌')},
 async phone(a,c){await hold(a,c,'phone','phone',rnd(3500,5500),'Mira el celular.','📱')},
 async board(a,c){const p=ownerP(a),B=BOARDS[p];a.act='Va a la pizarra de su oficina.';if(!await go(a,c,boardSpot(p),false))return;
  const n=Math.round(rnd(2,3));
  for(let i=0;i<n&&!c.stop;i++){await hold(a,c,'write','marker',rnd(1700,2600),'Anota ideas en la pizarra.','📝');B.fill=Math.min(1,B.fill+0.11);if(!c.stop&&i<n-1)await hold(a,c,'think',null,rnd(900,1500),'Piensa qué anotar.','')}
  if(B.fill>0.95)B.fill=0.3},
 async coffee(a,c){a.act='Va a la cocina por un café.';if(!await go(a,c,KSPOT.coffee,false))return;
  KIT.coffee++;try{await hold(a,c,'brew',null,rnd(1800,2400),'Prepara un café.','☕')}finally{KIT.coffee--}
  if(c.stop)return;await hold(a,c,'sip','mug',rnd(3500,5200),'Toma su café.','😌')},
 async cook(a,c){a.act='Va a cocinar algo.';if(!await go(a,c,KSPOT.stove,false))return;
  KIT.stove++;try{await hold(a,c,'stir','spoon',rnd(4200,6200),'Cocina algo rico.','🍳')}finally{KIT.stove--}
  if(c.stop)return;if(!await go(a,c,pick(STOOLS),true))return;await hold(a,c,'eat','fork',rnd(5000,7500),'Come lo que cocinó.','😋')},
 async snack(a,c){a.act='Va a buscar algo de comer.';if(!await go(a,c,KSPOT.fridge,false))return;
  await hold(a,c,'brew',null,rnd(1400,2000),'Mira qué hay en la heladera.','🧊');if(c.stop)return;
  if(!await go(a,c,pick(STOOLS),true))return;await hold(a,c,'eat','fork',rnd(4200,6000),'Pica algo en la isla.','🍎')},
 async water(a,c){a.act='Va a tomar agua.';if(!await go(a,c,KSPOT.sink,false))return;await hold(a,c,'sip','glass',rnd(2600,3600),'Toma un vaso de agua.','💧')},
 async lounge(a,c){a.act='Se va a descansar un rato al lounge.';if(!await go(a,c,pick(LOUNGE),true))return;await hold(a,c,'phone','phone',rnd(4500,7000),'Descansa en el lounge.','📱')},
 async ps(a,c){const free=LSOFA.filter(q=>!actors().some(x=>x!==a&&x.cur===q));if(!free.length)return ACT.lounge(a,c);
  a.act='Se va a jugar a la PlayStation al lounge.';if(!await go(a,c,pick(free),true))return;PLAY.lounge++;
  try{await hold(a,c,'play','pad',rnd(7000,12000),'Juega a la PlayStation en el lounge.','🎮')}finally{PLAY.lounge--}},
 async loungeCoffee(a,c){a.act='Va a tomar un café al lounge.';if(!await go(a,c,LCOFFEE,false))return;
  KIT.lcoffee++;try{await hold(a,c,'brew',null,rnd(1800,2400),'Prepara un café.','☕')}finally{KIT.lcoffee--}
  if(c.stop)return;await hold(a,c,'sip','mug',rnd(3500,5200),'Toma un café en el lounge.','😌')},
 async psMe(a,c){a.act='Se tira en el sofá a jugar a la PlayStation.';if(!await go(a,c,pick(JSOFA),true))return;PLAY.jefe++;
  try{await hold(a,c,'play','pad',rnd(8000,14000),'Juega a la PlayStation en su oficina.','🎮')}finally{PLAY.jefe--}},
 async poolMe(a,c){a.act='Se va a jugar un partido de pool.';if(!await go(a,c,pick(JPOOL),false))return;await hold(a,c,'stir',null,rnd(6000,9500),'Juega al pool en su oficina.','🎱')},
 async barMe(a,c){a.act='Se sirve algo en su minibar.';if(!await go(a,c,pick(JBAR),true))return;await hold(a,c,'sip','glass',rnd(4500,6500),'Toma algo en su minibar.','🥃')},
 async chat(a,c){const cand=actors().filter(x=>x!==a&&!x.hidden&&!x.beh&&x.state==='idle'&&atHome(x)&&x.alpha>0.9);
  if(!cand.length)return ACT.stretch(a,c);
  const b=pick(cand);a.act=`Va a charlar con ${b.name}.`;if(!await go(a,c,visitSpot(b),false))return;
  a.bubble=pick(HELLO);await sleepI(c,2400);a.bubble='';if(c.stop)return;b.bubble=pick(REPLY);b.wave=1;await sleepI(c,2200);b.bubble=''}
};
async function runAct(a,c,name){a.act='';try{await ACT[name](a,c)}finally{a.act='';a.thought='';a.pose=null;a.prop=null}}
async function settle(a,c){a.pose=null;a.prop=null;a.act='';a.thought='';
 if(!atHome(a)){try{await moveTo(a,homeSpot(a),true)}catch(e){}}
 if(a.beh===c)a.beh=null}
async function stopBeh(a){const c=a.beh;if(!c)return;c.stop=true;a.hurry=true;try{await c.done}finally{a.hurry=false}}
/* qué tipo de tarea es → qué animaciones elige mientras trabaja */
function classify(task){const T=(task||'').toLowerCase();let kind='generic';
 if(/planific|diseñ|estructur|\bidea|estrateg|roadmap|organiz|portfolio|\bplan\b/.test(T))kind='plan';
 else if(/analiz|document|revis|investig|compar|\bleer\b|informe|estudi|auditor|resum/.test(T))kind='analyze';
 else if(/redact|escrib|texto|art[ií]culo|carta|mail|copy|\bpost\b/.test(T))kind='write';
 else if(/arm[aá]|constru|cre[aá]|sistema|\bapp\b|\bapi\b|login|backend|frontend|c[oó]digo|program|desarroll|implement|base de datos|\bweb\b|hac[eé]/.test(T))kind='build';
 const complex=kind==='build'&&(/sistema|completo|plataforma|arquitectura|autentic|login|base de datos|\bapi\b|aplicaci|e-?commerce/.test(T)||T.length>90);
 return {kind,complex,minMs:({build:complex?14000:10000,analyze:11500,plan:10500,write:9000,generic:7500})[kind]}}
function planPool(a,info){const R=(a.role||'').toLowerCase();let pool;
 if(info.kind==='analyze')pool=[['readDoc',3],['board',4],['think',2],['type',2]];
 else if(info.kind==='plan')pool=[['board',5],['think',2],['type',2],['sipSeat',1]];
 else if(info.kind==='write')pool=[['type',4],['think',3],['sipSeat',2],['stretch',1]];
 else if(info.kind==='build')pool=[['type',5],['coffee',info.complex?3.5:1],['stretch',2],['think',2],['board',1]];
 else pool=[['type',5],['think',2],['sipSeat',1],['stretch',0.6]];
 if(/investig|analist/.test(R))pool.push(['readDoc',3],['board',2]);
 if(/dise[ñn]|ux/.test(R))pool.push(['board',3]);
 if(/devops|backend/.test(R)&&info.kind!=='analyze')pool.push(['coffee',2]);
 if(/qa|revisor|tester/.test(R))pool.push(['readDoc',2],['board',2]);
 return pool}
function startBeh(a,info){if(a.beh)return a.beh;const c={stop:false};a.beh=c;
 c.done=(async()=>{try{
  await sleepI(c,rnd(1500,2600));let last=null;
  while(!c.stop){const act=wpick(planPool(a,info),last);last=act;await runAct(a,c,act);if(c.stop)break;
   if(!atHome(a))await go(a,c,homeSpot(a),true);if(c.stop)break;await runAct(a,c,'type')}
 }catch(e){console.error(e)}finally{await settle(a,c)}})();return c}
/* vida libre: si no hay tareas, hacen lo suyo (como los Sims) */
function pickLife(a){const L=a.isMe?[['psMe',3.5],['poolMe',2.5],['barMe',2],['coffee',2],['sipSeat',2],['stretch',1.5],['readDoc',1.5],['think',1],['phone',1],['ps',1.5]]
 :a.adv?[['coffee',2],['loungeCoffee',1.5],['readDoc',2],['sipSeat',2],['board',2],['stretch',1.5],['think',1],['chat',2],['snack',1],['ps',0.6]]
 :[['coffee',2.5],['cook',1],['snack',1],['water',1],['board',1.5],['stretch',2],['sipSeat',1.5],['readDoc',1],['think',1],['ps',3],['loungeCoffee',1.5],['lounge',1],['chat',1.5],['phone',1]];return wpick(L)}
function lifeStart(a){if(a.beh)return;const c={stop:false};a.beh=c;
 c.done=(async()=>{try{const n=Math.random()<0.3?2:1;for(let i=0;i<n&&!c.stop;i++)await runAct(a,c,pickLife(a))}catch(e){console.error(e)}finally{await settle(a,c)}})()}
function lifeTick(){if(!CFG.life||running||pending||summoned)return;const AC=actors();if(AC.filter(a=>a.beh).length>=3)return;
 for(const a of AC){if(a.beh||a.hidden||a.state!=='idle'||a.alpha<0.9||!atHome(a))continue;if(Math.random()<0.05){lifeStart(a);break}}}
setInterval(lifeTick,1000);

/* ================= Convocatoria a la oficina del usuario ================= */
const reps=()=>PO.map(p=>agents.find(a=>a.provider===p&&a.state!=='blocked')).filter(Boolean);
async function summon(mode,custom,wh){
 const toMeet=wh==='meet';
 if(running){addMsg('sys','','Hay una tarea en curso, esperá a que termine.');return}
 if(summoned)await dismissSummon();
 running=true;$('#send').disabled=true;
 try{
  await Promise.all(actors().map(stopBeh));
  const list=custom||(mode==='all'?agents.filter(a=>a.state!=='blocked'):reps());
  if(!list.length){addMsg('sys','','No hay nadie para convocar.');return}
  const host=CFG.away?ADV:ME;
  addMsg('sys','',`📣 A ${toMeet?'la sala de reuniones':'la oficina de '+CFG.name}: ${list.map(a=>a.name).join(', ')}${mode==='reps'?' (uno por oficina)':''}.`);
  list.forEach(a=>{a.doing=toMeet?'Fue a la sala de reuniones a escuchar el proyecto.':'Fue a la oficina de '+CFG.name+' a escuchar el proyecto.'});
  const mv=list.map((a,i)=>moveTo(a,toMeet?SEATS[i%SEATS.length]:BRIEF[i%BRIEF.length],toMeet).then(()=>{a.pose='listen'}));
  mv.push(moveTo(host,toMeet?HEAD:PODIUM,false));await Promise.all(mv);
  summoned={mode,list,host,where:toMeet?'meet':'office'};host.bubble=CFG.away?`Escuchen: les cuento el proyecto de parte de ${CFG.name}.`:'Bueno equipo, les cuento lo que necesito…';
  setTimeout(()=>{if(host.bubble&&!summoned)host.bubble=''},3500);setTimeout(()=>{if(summoned&&summoned.host===host)host.bubble=''},3800);
  addMsg('sys','',`Ya están en ${toMeet?'la sala de reuniones':'tu oficina'}. Contales el proyecto en el chat (equipo): cuando lo mandes, vuelven a sus oficinas y arrancan.`);
 }finally{running=false;$('#send').disabled=false}}
async function dismissSummon(){const s=summoned;if(!s)return;summoned=null;running=true;
 try{s.list.forEach(a=>{a.pose=null;a.bubble=''});s.host.bubble='';
  await Promise.all([...s.list.map(a=>moveTo(a,homeSpot(a),true)),moveTo(s.host,homeSpot(s.host),true)]);
  if(s.mode==='reps'){s.list.forEach(a=>{a.bubble='Les cuento a mi oficina lo que hablamos.';agents.filter(x=>x.provider===a.provider&&x!==a).forEach(m=>{m.wave=1.2;m.thought='👍'})});
   await sleep(2600);s.list.forEach(a=>{a.bubble=''});agents.forEach(m=>{if(m.thought==='👍')m.thought=''})}
 }finally{running=false}}

/* ================= Ausencia: el asesor/a te representa ================= */
function hideMe(){ME.hidden=true;ME.alpha=0;ME.alphaT=0;ME.cur=ENTRY;ME.x=ENTRY.x;ME.y=ENTRY.y;ME.seated=false;ME.sitK=0;ME.face=[0,-1]}
async function setAway(v){if(v===CFG.away)return;CFG.away=v;saveCfg();updateHud();
 await stopBeh(ME);
 if(v){addMsg('sys','',`🚪 ${CFG.name} se fue. ${ADV.name} (asesor/a) atiende al equipo y responde sus dudas en su lugar.`);await moveTo(ME,ENTRY,false);ME.alphaT=0;ME.hidden=true}
 else{ME.hidden=false;ME.alphaT=1;ME.alpha=1;ME.cur=ENTRY;ME.x=ENTRY.x;ME.y=ENTRY.y;ME.seated=false;ME.sitK=0;ME.path=[];
  addMsg('sys','',`👋 ${CFG.name} volvió. ${ADV.name} deja de responder por vos.`);await moveTo(ME,homeSpot(ME),true)}
 if(selRoom==='o:jefe')renderRoom();renderTeam()}
async function advisorAnswer(a,q){
 const adv=ADV;await stopBeh(adv);
 a.state='asking';a.pose='think';a.bubble='❓ '+short(q,70);a.doing=`Le preguntó a ${adv.name} porque no estás.`;
 addMsg('q','❓ '+a.name+' pregunta',q);
 adv.state='working';adv.progress=0;adv.doing=`Atiende a ${a.name} en lugar de ${CFG.name}.`;
 await moveTo(adv,visitSpot(a),false);
 let ans;
 try{ans=await callAgent(adv,[{role:'user',content:`Sos ${adv.name}, asesor/a y representante de ${CFG.name}, que no está. ${a.name} (${a.role}) necesita una decisión.\nTarea del equipo: ${currentTask}\nPregunta: ${q}\nRespondé en 1-2 oraciones con una decisión concreta y razonable, en nombre de ${CFG.name}.`}],persona(adv))}
 catch(e){ans=e&&e.quota?'Hacelo de la forma más simple y estándar; después lo ajustamos.':'Seguí con la opción más razonable y dejá anotados los supuestos.'}
 adv.bubble=short(ans,90);addMsg('agent',`${adv.name} · responde por ${CFG.name}`,ans);await sleep(2800);adv.bubble='';
 a.bubble='Gracias 👍';a.pose=null;a.state='working';a.doing=`Retomó el trabajo con la respuesta de ${adv.name}.`;await sleep(1200);a.bubble='';
 await moveTo(adv,homeSpot(adv),true);adv.state='idle';adv.progress=0;adv.doing='Esperando una tarea.';
 return ans}
function resetPlacement(){agents.forEach(a=>{if(a.beh)a.beh.stop=true});agents.forEach(placeAtDesk)}
function mkSpecial(){
 ME=mkAgent({provider:'jefe',name:CFG.name,role:'Jefe',planIdx:0,look:CFG.look});ME.home=deskSeat('jefe',0);ME.isMe=true;
 ADV=mkAgent({provider:'claude',name:CFG.advName,role:'Asesor/a',planIdx:CFG.advPlan,look:CFG.advLook});ADV.home=deskSeat('rec',0);ADV.adv=true;
 placeAtDesk(ME);placeAtDesk(ADV);if(CFG.away)hideMe()}

/* ================= Arranque ================= */
setInterval(()=>{const s=$('#status');
 if(running&&t0){const sec=Math.floor((Date.now()-t0)/1000);s.textContent=`Trabajando · ${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')} · ${Math.min(turn,nTeam)} de ${nTeam}`;s.className='on'}
 else{s.className='';s.textContent=`En espera · ${agents.filter(a=>a.state!=='blocked').length} de ${agents.length} disponibles`}
 updateRoster();updateDetail();
 if(selRoom&&!$('#detail').contains(document.activeElement)&&roomSig()!==RSIG)renderRoom()},500);
setInterval(()=>{agents.forEach(a=>{if(a.state==='blocked'){rollWin(a);if(a.used<limit(a)&&!running){a.state='idle';returnFromLounge(a);addMsg('sys','',`🌴 ${a.name} volvió de descansar: su cupo se reinició.`);renderTeam();renderRoster()}}})},15000);
load();mkSpecial();agents.forEach(placeAtDesk);applyTheme();buildStatic();fillTarget();updateHud();setChat(CFG.chat!==false);renderTeam();renderSettings();renderResults();renderChips();renderRoster();pcBoot();
addMsg('sys','','Cada IA tiene su oficina. Dale una tarea al equipo o hacé clic en una persona para acercarte y hablarle. Si alguien necesita un dato, te lo pregunta acá.');
new ResizeObserver(resize).observe(cv);resize();requestAnimationFrame(frame);
window._office={getState:()=>({selRoom,summoned:!!summoned,running,away:CFG.away,beh:actors().map(a=>a.name+':'+(a.beh?(a.act||'beh'):'-'))}),act:(i,n)=>{const a=actors()[i];if(a.beh)return;const c={stop:false};a.beh=c;c.done=(async()=>{try{await runAct(a,c,n)}finally{await settle(a,c)}})()},summon,setAway,selectRoom,classify,setRot:v=>{rot=v;rotTarget=null},setZoom:v=>{zoom=zoomT=v},agents:()=>agents,select:i=>selectAgent(agents[i]),deselect,sample:()=>sampleFn};
try{if(window.claude&&claude.use){claude.use('sample').then(s=>{sampleFn=s||null;sampleState=s?'disponible':'no disponible';renderChips()}).catch(()=>{sampleState='no disponible';renderChips()})}else{sampleState='no disponible';renderChips()}}catch(e){sampleState='no disponible';renderChips()}
})();
</script>
</body>
</html>
