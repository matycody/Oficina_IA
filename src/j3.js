
/* ================= Selección, cámara y UI ================= */
function selectAgent(a){
 selected=a;zoomT=3.3;axT=0.36;ayT=0.63;
 const th=Math.atan2(a.face[1],a.face[0]);rot=angW(rot);rotTarget=Math.PI/4-0.3-th;
 fillTarget();$('#target').value='a'+a.id;renderRoster();renderDetail();renderTeam()}
function deselect(){selected=null;zoomT=1.08;axT=0.5;ayT=0.46;camTx=14;camTy=7.4;rot=angW(rot);rotTarget=0;$('#detail').classList.remove('on');renderRoster();renderTeam()}
$('#bSpin').onclick=()=>{if(selected)deselect();spin=Math.PI*2};
$('#bView').onclick=()=>{deselect();spin=0};
$('#bMeet').onclick=async()=>{if(running)return;
 if(!results.length){addMsg('sys','','Todavía no hay trabajo para rendir. Dale una tarea al equipo primero.');return}
 running=true;try{await meeting()}finally{running=false}};

function showTab(t){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id==='p-'+t))}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.t));
const feed=$('#feed');
function addMsg(kind,who,text){const m=el('div','msg '+kind);if(who&&kind!=='sys')m.appendChild(el('div','who',who));m.appendChild(document.createTextNode(text));feed.appendChild(m);feed.scrollTop=feed.scrollHeight;return m}
function fillTarget(){const s=$('#target'),v=s.value;s.innerHTML='';const o=el('option',null,'Hablar con: todo el equipo (nueva tarea)');o.value='team';s.appendChild(o);
 agents.forEach(a=>{const p=el('option',null,`Hablar solo con ${a.name} (${a.role})`);p.value='a'+a.id;s.appendChild(p)});if([...s.options].some(o=>o.value===v))s.value=v}
function renderChips(){const c=$('#chips');c.innerHTML='';const mk=(a,b)=>{const x=el('span','chip');x.appendChild(document.createTextNode(a+' '));x.appendChild(el('b',null,b));c.appendChild(x)};
 mk('Claude real:',sampleState);mk('Agentes:',String(agents.length));mk('Tareas hechas:',String(tasksDone))}

/* --- barra inferior de agentes --- */
let RREF=[];
function renderRoster(){
 const box=$('#roster');box.innerHTML='';RREF=[];
 const tk=el('div','rtasks');tk.appendChild(el('span',null,'Tareas'));const tb=el('b',null,'0');tk.appendChild(tb);box.appendChild(tk);RREF.push({tb});
 agents.forEach(a=>{const c=el('div','rc'+(selected===a?' sel':''));const cn=document.createElement('canvas');c.appendChild(cn);
  const r=el('div');r.appendChild(el('div','nm',a.name));r.appendChild(el('div','ro',a.role));
  const ln=el('div','ln');const ch=el('span','pchip',prov(a).ini);ch.style.background=prov(a).color;ch.title=prov(a).label+' · '+planName(a);const sd=el('span','sdot');const tt=el('span','tk');
  ln.appendChild(ch);ln.appendChild(sd);ln.appendChild(tt);r.appendChild(ln);c.appendChild(r);c.onclick=()=>selected===a?deselect():selectAgent(a);box.appendChild(c);
  drawPortrait(cn,a,46);RREF.push({a,sd,tt})});
 updateRoster()}
function updateRoster(){let tot=0;
 RREF.forEach(r=>{if(r.tb){tot=agents.reduce((n,a)=>n+a.tasks.filter(t=>t.st==='en curso').length,0);r.tb.textContent=String(agents.reduce((n,a)=>n+a.tasks.length,0));return}
  r.sd.style.background=STATE_COL[r.a.state]||'#9aa6bd';r.sd.title=STATE_ES[r.a.state]||'';r.tt.textContent=(STATE_ES[r.a.state]||'')+' · '+r.a.tasks.length+' tarea'+(r.a.tasks.length===1?'':'s')})}

/* --- tarjeta de detalle --- */
let DREF=null;
function renderDetail(){
 const a=selected,d=$('#detail');if(!a){d.classList.remove('on');return}
 d.innerHTML='';d.classList.add('on');DREF={};
 const hd=el('div','hd');const cn=document.createElement('canvas');hd.appendChild(cn);
 const nm=el('div');const h=el('h3',null,a.name);nm.appendChild(h);nm.appendChild(el('div','small',a.role));
 const l2=el('div');l2.style.cssText='display:flex;gap:6px;align-items:center;margin-top:3px';const ch=el('span','pchip',prov(a).label);ch.style.background=prov(a).color;l2.appendChild(ch);l2.appendChild(el('span','small',planName(a)));
 const bd=el('span','badge '+prov(a).mode,prov(a).mode==='real'?'REAL':'SIM');l2.appendChild(bd);nm.appendChild(l2);hd.appendChild(nm);
 const x=el('button','x','✕');x.onclick=deselect;hd.appendChild(x);d.appendChild(hd);drawPortrait(cn,a,58);
 const mk=(t)=>{const s=el('div');s.appendChild(el('h4',null,t));return s};
 const st=mk('Estado');DREF.st=el('div','box');st.appendChild(DREF.st);d.appendChild(st);
 const qh=mk('Qué hace');const qb=el('div','box');qb.appendChild(el('div',null,roleDesc(a)));DREF.doing=el('div','small');DREF.doing.style.marginTop='4px';qb.appendChild(DREF.doing);qh.appendChild(qb);d.appendChild(qh);
 const th=mk('Tareas a cargo');DREF.tasks=el('div','box');th.appendChild(DREF.tasks);d.appendChild(th);
 const tl=mk('Herramientas');const tw=el('div','tools');prov(a).tools.forEach(t=>tw.appendChild(el('span',null,t)));tl.appendChild(tw);d.appendChild(tl);
 const qu=mk('Cupo · ventana de 5 h');const bar=el('div','bar');DREF.bi=el('i');bar.appendChild(DREF.bi);qu.appendChild(bar);DREF.qt=el('div','small');qu.appendChild(DREF.qt);d.appendChild(qu);
 const ch2=mk('Hablar con '+a.name);DREF.reply=el('div','box');DREF.reply.style.display='none';DREF.reply.style.marginBottom='6px';DREF.reply.style.whiteSpace='pre-wrap';ch2.appendChild(DREF.reply);
 const mini=el('div','mini');const inp=el('input');inp.placeholder='Escribile algo…';const go=el('button','pri','Enviar');go.style.padding='6px 12px';
 const send=async()=>{const v=inp.value.trim();if(!v)return;inp.value='';if(pending){addMsg('user','Vos',v);const p=pending;pending=null;p(v);return}if(running){addMsg('sys','','Hay una tarea en curso, esperá a que termine.');return}addMsg('user','Vos → '+a.name,v);await directChat(a,v)};
 go.onclick=send;inp.addEventListener('keydown',e=>{if(e.key==='Enter')send()});mini.appendChild(inp);mini.appendChild(go);ch2.appendChild(mini);d.appendChild(ch2);
 updateDetail()}
function updateDetail(){const a=selected;if(!a||!DREF)return;rollWin(a);
 DREF.st.innerHTML='';const row=el('div');row.style.cssText='display:flex;align-items:center;gap:8px';const dot=el('span','sdot');dot.style.background=STATE_COL[a.state]||'#9aa6bd';row.appendChild(dot);row.appendChild(el('b',null,STATE_ES[a.state]||a.state));
 row.appendChild(el('span','small',a.path.length?'· caminando':a.seated?'· sentado/a':'· de pie'));DREF.st.appendChild(row);
 if(a.state==='working'){const b=el('div','bar');b.style.marginTop='6px';const i=el('i');i.style.width=Math.round(a.progress*100)+'%';i.style.background=prov(a).color;b.appendChild(i);DREF.st.appendChild(b)}
 DREF.doing.textContent=a.doing;
 DREF.tasks.innerHTML='';if(!a.tasks.length)DREF.tasks.appendChild(el('div','small','Todavía no tiene tareas.'));else{const ul=el('ul');a.tasks.slice(-5).forEach(t=>{const li=el('li',null,(t.st==='hecho'?'✔ ':t.st==='corregido'?'↻ ':t.st==='en curso'?'● ':'• ')+t.text+' ');li.appendChild(el('span','small','('+t.st+')'));ul.appendChild(li)});DREF.tasks.appendChild(ul)}
 const lim=limit(a);DREF.bi.style.width=Math.min(100,a.used/lim*100)+'%';DREF.bi.style.background=a.used>=lim?'var(--bad)':'var(--acc)';
 DREF.qt.textContent=`${a.used}/${lim} mensajes (estimado, plan ${planName(a)})`+(a.winStart?` · se reinicia en ${resetIn(a)}`:'');
 if(a.lastReply){DREF.reply.style.display='block';DREF.reply.textContent=a.lastReply}}

/* --- pestaña Equipo --- */
const ROLE_LIST=Object.keys(ROLES);
function renderTeam(){
 const box=$('#teamBox');if(box.contains(document.activeElement)&&document.activeElement.tagName==='INPUT')return;box.innerHTML='';
 const dl=el('datalist');dl.id='roles';ROLE_LIST.forEach(r=>{const o=el('option');o.value=r;dl.appendChild(o)});box.appendChild(dl);
 box.appendChild(el('div','small','Los productores trabajan en este orden; el rol QA/Revisor verifica al final y devuelve lo que falla. Cada IA tiene su oficina (máx. 2 personas por IA).'));
 agents.forEach((a,i)=>{rollWin(a);const p=prov(a);const c=el('div','card'+(selected===a?' sel':''));
  const top=el('div','top');const cn=document.createElement('canvas');cn.style.cssText='width:34px;height:34px;border-radius:50%;background:#e8eefb';top.appendChild(cn);
  const nm=el('input');nm.value=a.name;nm.style.cssText='font-weight:700;flex:1;min-width:0';nm.onchange=()=>{a.name=nm.value.trim()||a.name;save();fillTarget();renderRoster()};top.appendChild(nm);
  top.appendChild(el('span','badge '+p.mode,p.mode==='real'?'REAL':'SIM'));
  const ar=el('div','arrows');const up=el('button',null,'↑'),dn=el('button',null,'↓');up.disabled=running||i===0;dn.disabled=running||i===agents.length-1;
  up.onclick=()=>{[agents[i-1],agents[i]]=[agents[i],agents[i-1]];save();renderTeam();renderRoster()};dn.onclick=()=>{[agents[i+1],agents[i]]=[agents[i],agents[i+1]];save();renderTeam();renderRoster()};ar.appendChild(up);ar.appendChild(dn);top.appendChild(ar);c.appendChild(top);
  const g=el('div','grid');
  const ps=el('select');PO.forEach(k=>{const o=el('option',null,PROVIDERS[k].label+' · '+PROVIDERS[k].office);o.value=k;ps.appendChild(o)});ps.value=a.provider;
  ps.onchange=()=>{if(running){ps.value=a.provider;return}const n=agents.filter(x=>x.provider===ps.value&&x!==a).length;if(n>=2){addMsg('sys','','Esa oficina ya tiene 2 personas. Elegí otra IA.');ps.value=a.provider;return}
   a.provider=ps.value;a.planIdx=Math.min(a.planIdx,prov(a).plans.length-1);agents.forEach(placeAtDesk);save();renderTeam();renderRoster()};
  const pl=el('select');p.plans.forEach((n,k)=>{const o=el('option',null,n);o.value=k;pl.appendChild(o)});pl.value=a.planIdx;pl.onchange=()=>{a.planIdx=+pl.value;save();renderTeam();renderRoster()};
  const role=el('input');role.setAttribute('list','roles');role.value=a.role;role.placeholder='Rol';role.onchange=()=>{a.role=role.value.trim()||a.role;save();fillTarget();renderRoster();updateDetail()};
  g.appendChild(ps);g.appendChild(pl);g.appendChild(role);const lk=el('select');LOOKS.forEach((l,k)=>{const o=el('option',null,'Aspecto '+(k+1));o.value=k;lk.appendChild(o)});lk.value=a.lookIdx;lk.onchange=()=>{a.lookIdx=+lk.value;a.look=LOOKS[a.lookIdx];save();renderRoster();renderTeam()};g.appendChild(lk);c.appendChild(g);
  const lim=limit(a),bar=el('div','bar'),bi=el('i');bi.style.width=Math.min(100,a.used/lim*100)+'%';if(a.used>=lim)bi.style.background='var(--bad)';bar.appendChild(bi);c.appendChild(bar);
  c.appendChild(el('div','small',`Ventana de 5 h: ${a.used}/${lim} mensajes (estimado)`+(a.winStart?` · se reinicia en ${resetIn(a)}`:'')));
  const row=el('div','top');const b1=el('button',null,'Acercar cámara');b1.onclick=()=>selectAgent(a);
  const b2=el('button',null,'Quitar');b2.disabled=running||agents.length<=1;b2.onclick=()=>{agents.splice(i,1);if(selected===a)deselect();agents.forEach(placeAtDesk);save();fillTarget();renderTeam();renderChips();renderRoster()};
  row.appendChild(b1);row.appendChild(b2);c.appendChild(row);box.appendChild(c);drawPortrait(cn,a,34)});
 if(agents.length<8){const f=el('div','add');f.appendChild(el('b',null,'Sumar un empleado'));const g=el('div','grid');
  const ps=el('select');PO.forEach(k=>{const full=agents.filter(x=>x.provider===k).length>=2;const o=el('option',null,PROVIDERS[k].label+(full?' (oficina llena)':''));o.value=k;o.disabled=full;ps.appendChild(o)});ps.value=PO.find(k=>agents.filter(x=>x.provider===k).length<2)||'otro';
  const nm=el('input');nm.placeholder='Nombre de la persona';nm.value=NAMEPOOL.find(n=>!agents.some(a=>a.name===n))||'';const rl=el('input');rl.setAttribute('list','roles');rl.placeholder='Rol (ej. Frontend)';
  const pl=el('select');const fillPl=()=>{pl.innerHTML='';PROVIDERS[ps.value].plans.forEach((n,k)=>{const o=el('option',null,n);o.value=k;pl.appendChild(o)})};fillPl();ps.onchange=fillPl;
  g.appendChild(ps);g.appendChild(pl);g.appendChild(nm);g.appendChild(rl);f.appendChild(g);
  const ad=el('button','pri','Agregar');ad.onclick=()=>{if(running)return;const a=mkAgent({provider:ps.value,name:nm.value.trim()||NAMEPOOL[agents.length%NAMEPOOL.length],role:rl.value.trim()||'Colaborador',planIdx:+pl.value,look:agents.length});
   agents.push(a);agents.forEach(placeAtDesk);save();fillTarget();renderTeam();renderChips();renderRoster()};
  f.appendChild(ad);f.appendChild(el('div','small','Los nuevos entran en modo simulado hasta la fase 2 (APIs reales).'));box.appendChild(f)}
}
function renderResults(){
 const box=$('#resBox');box.innerHTML='';
 if(!results.length){box.appendChild(el('div','small','Acá van a aparecer los resultados de cada agente y el veredicto de QA cuando termine una tarea.'));return}
 const prods=results.filter(r=>r.kind!=='qa');const last=prods[prods.length-1];
 if(last){const fin=el('div','card final');fin.appendChild(el('b',null,'Entrega final · '+last.agent.name+' ('+last.agent.role+')'));fin.appendChild(el('div','pre',last.text));box.appendChild(fin)}
 if(verdict){const v=el('div','card');v.style.borderColor=verdict.ok?'#9ad8bf':'#f0a3a6';v.appendChild(el('b',null,(verdict.ok?'✔ QA aprobó':'✖ QA no pudo aprobar')+' · '+verdict.agent.name+(verdict.rounds>1?` (${verdict.rounds} rondas)`:'')));v.appendChild(el('div','pre',verdict.text));v.appendChild(el('div','small','Revisión por lectura. La compilación real se activa en la fase 2.'));box.appendChild(v)}
 prods.slice(0,-1).forEach(r=>{const d=el('details','card');d.appendChild(el('summary',null,`${r.agent.name} · ${r.agent.role}`));d.appendChild(el('div','pre',r.text));box.appendChild(d)})}
EXAMPLES.forEach(t=>{const b=el('button',null,t.length>46?t.slice(0,44)+'…':t);b.title=t;b.onclick=()=>{$('#inp').value=t;$('#target').value='team'};$('#ex').appendChild(b)});

/* ================= Adaptadores (fase 2: se enchufan APIs reales acá) ================= */
function persona(a){return `Sos ${a.name}, un agente de IA (motor ${prov(a).label}) con el rol de "${a.role}" dentro de una oficina de agentes que trabaja en equipo. Respondé siempre en español, claro y concreto.`+(isQA(a)?' Todavía no podés ejecutar ni compilar código: revisás por lectura que todo esté completo, que las piezas encajen entre sí y que no haya errores evidentes de sintaxis o lógica.':'')}
function canned(a,msgs){
 const all=msgs.map(m=>m.content).join(' ');
 if(/Ronda: (\d)/.test(all)){const r=+all.match(/Ronda: (\d)/)[1],nm=((all.match(/Nombres válidos: ([^\n.]+)/)||[])[1]||'').split(',')[0].trim()||'el primer agente';
  return r<2?`RECHAZADO: ${nm}: falta contemplar un caso límite (entrada vacía) y dejar explícitos los supuestos.`:'APROBADO: todo es coherente y las piezas encajan.'}
 const task=((all.match(/Tarea del usuario: ([^\n]*)/)||[])[1]||'la tarea').slice(0,90);
 if(/Feedback de QA/.test(all))return `[Respuesta de ejemplo, sin IA conectada]\nCorregido: ahora manejo el caso límite que marcó QA y dejé escritos los supuestos para "${task}".`;
 return `[Respuesta de ejemplo, sin IA conectada]\nComo ${a.role}, sobre "${task}": definí los puntos clave, los ordené por prioridad y dejé listo lo necesario para el siguiente compañero.`}
const ADAPTERS={
 async sample(a,msgs,sys){
  if(!sampleFn){await sleep(1800+Math.random()*1500);return canned(a,msgs)}
  const m=[{role:'user',content:sys+'\n\n'+msgs[0].content},...msgs.slice(1)];
  try{const r=await sampleFn(m,{cache:false});return (r.text||'').trim()}
  catch(e){if(e&&e.code==='not_granted'){sampleFn=null;sampleState='sin permiso';renderChips();addMsg('sys','','No hay permiso para usar Claude desde la página: sigo con respuestas de ejemplo.');return canned(a,msgs)}
   if(e&&e.code==='rate_limited')throw new Error('Se alcanzó el límite de uso de Claude. Probá en unos minutos.');throw e}},
 async api(){throw new Error('Conexión por API: se agrega en la fase 2')}
};
async function callAgent(a,msgs,sys){
 rollWin(a);if(a.used>=limit(a)){const e=new Error('Sin cupo');e.quota=true;throw e}
 if(!a.winStart)a.winStart=Date.now();a.used++;save();renderTeam();
 return ADAPTERS.sample(a,msgs,sys||persona(a));
}

/* ================= Coordinación ================= */
const short=(t,n)=>{t=t.replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1)+'…':t};
const summary=t=>{const s=t.replace(/\[Respuesta de ejemplo[^\]]*\]\s*/,'').replace(/\s+/g,' ').trim();const k=s.search(/[.!?]\s/);return k>20&&k<110?s.slice(0,k+1):(s.length>100?s.slice(0,98)+'…':s)};
function buildPrompt(a,task,outs){
 const prev=outs.map(o=>`### ${o.agent.name} (${o.agent.role})\n${o.text}`).join('\n\n');
 return `Tarea del usuario: ${task}\n`+(prev?`\nTrabajo previo del equipo:\n${prev}\n`:'')+
 `\nHacé SOLO tu parte según tu rol de "${a.role}", en español y conciso (máximo ~150 palabras). Si tu rol es técnico, entregá código breve y comentado que encaje con lo que ya hicieron tus compañeros. Si te falta un dato imprescindible, respondé únicamente con UNA línea que empiece con "PREGUNTA:" seguida de la pregunta.`}
function waitAnswer(a,q){return new Promise(res=>{a.state='asking';a.bubble='❓ '+q;a.doing='Te hizo una pregunta y espera tu respuesta.';const m=addMsg('q','❓ '+a.name+' te pregunta',q);showTab('chat');
 $('#inp').placeholder='Respondele a '+a.name+'…';$('#inp').focus();
 pending=ans=>{$('#inp').placeholder='Dale una tarea al equipo…';a.bubble='';a.state='working';a.doing='Retomó el trabajo con tu respuesta.';res(ans)}})}
async function work(a,task,outs,extra){
 const hist=[{role:'user',content:buildPrompt(a,task,outs)+(extra||'')}];a.askLeft=2;
 for(;;){const txt=await callAgent(a,hist);const m=txt.match(/^\s*PREGUNTA:\s*([\s\S]+)/i);
  if(m&&a.askLeft>0){a.askLeft--;const ans=await waitAnswer(a,m[1].trim().split('\n')[0]);
   hist.push({role:'assistant',content:txt},{role:'user',content:'Respuesta del usuario: '+ans+'\nAhora hacé tu parte; no hagas más preguntas.'});continue}
  return m?m[1].trim():txt}}
async function moveTo(a,spot,sit){if(a._mv)await a._mv;const p=route(a.cur,spot);a.cur=spot;const pr=goTo(a,p,sit,spot.f);a._mv=pr;await pr;if(a._mv===pr)a._mv=null}
/* caminar a la oficina de otra persona (como en el video de Iterhub) */
async function visit(from,to,msg,reply){
 addMsg('sys','',`🚶 ${from.name} va a la oficina de ${to.name} (${prov(to).office}).`);
 await moveTo(from,visitSpot(to),false);
 from.bubble=msg;await sleep(2400);from.bubble='';
 if(reply){to.bubble=reply;to.wave=1.2;await sleep(1300);to.bubble=''}
 moveTo(from,homeSpot(from),true)}
async function sendToLounge(a){if(a.away)return;a.away=true;a.doing='Descansando: se quedó sin cupo en su ventana de 5 h.';const spot=LOUNGE[agents.indexOf(a)%LOUNGE.length];
 await moveTo(a,spot,true);a.bubble='😴 Descansando hasta que se reinicie mi cupo';await sleep(3500);if(a.state==='blocked')a.bubble=''}
async function returnFromLounge(a){if(!a.away)return;a.away=false;a.bubble='';a.doing='Volvió a su escritorio.';await moveTo(a,homeSpot(a),true)}
async function meeting(){
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
  const pr=`Tarea del usuario: ${task}\n\nTrabajo del equipo:\n${body}\n\nRonda: ${rounds}\nNombres válidos: ${prods.map(p=>p.name).join(', ')}.\n\nVerificá que el conjunto esté completo, que las piezas encajen entre sí (por ejemplo que el frontend use lo que expone el backend) y que no haya errores evidentes que impidan que compile o funcione. Respondé SOLO con una de estas dos formas: "APROBADO: <una frase>" o "RECHAZADO: <Nombre del agente>: <motivo concreto en una frase>".`;
  let txt;try{txt=await callAgent(qa,[{role:'user',content:pr}])}catch(e){qa.state='done';throw e}
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
 running=true;t0=Date.now();results=[];verdict=null;renderResults();const team=agents.slice();$('#send').disabled=true;
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
  if(results.length){await meeting();tasksDone++}else addMsg('sys','','Nadie pudo trabajar (sin cupo o error).');
 }catch(e){addMsg('sys','','⚠ '+(e&&e.message||'Error inesperado'))}
 finally{running=false;pending=null;$('#send').disabled=false;agents.forEach(a=>{if(a.state!=='blocked'){a.state='idle';a.bubble='';a.doing='Esperando una tarea.'}});renderTeam();renderChips();renderRoster()}
}
async function directChat(a,text){
 running=true;$('#send').disabled=true;a.chat.push({role:'user',content:text});a.state='working';a.progress=0;a.doing='Te está respondiendo.';a.wave=0;
 try{const r=await callAgent(a,a.chat,persona(a));a.chat.push({role:'assistant',content:r});addMsg('agent',a.name,r);a.lastReply=r;a.bubble=summary(r).slice(0,80);setTimeout(()=>{a.bubble=''},4000)}
 catch(e){addMsg('sys','',e.quota?`⛔ ${a.name} no tiene más cupo en esta ventana (se reinicia en ${resetIn(a)}).`:'⚠ '+(e.message||'Error'));a.chat.pop()}
 finally{a.state=a.state==='blocked'?'blocked':'idle';if(a.state==='idle'){a.progress=0;a.doing='Esperando una tarea.'}running=false;$('#send').disabled=false;renderTeam();updateDetail()}
}
async function onSend(){
 const inp=$('#inp'),text=inp.value.trim();if(!text)return;inp.value='';
 if(pending){addMsg('user','Vos',text);const p=pending;pending=null;p(text);return}
 if(running){addMsg('sys','','Hay una tarea en curso, esperá a que termine.');return}
 addMsg('user','Vos',text);const t=$('#target').value;
 if(t==='team')await runTask(text);else{const a=agents.find(x=>'a'+x.id===t);if(a)await directChat(a,text)}
}
$('#send').onclick=onSend;
$('#inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();onSend()}});

/* ================= Arranque ================= */
setInterval(()=>{const s=$('#status');
 if(running&&t0){const sec=Math.floor((Date.now()-t0)/1000);s.textContent=`Trabajando · ${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')} · ${Math.min(turn,nTeam)} de ${nTeam}`;s.className='on'}
 else{s.className='';s.textContent=`En espera · ${agents.filter(a=>a.state!=='blocked').length} de ${agents.length} disponibles`}
 updateRoster();updateDetail()},500);
setInterval(()=>{agents.forEach(a=>{if(a.state==='blocked'){rollWin(a);if(a.used<limit(a)&&!running){a.state='idle';returnFromLounge(a);addMsg('sys','',`🌴 ${a.name} volvió de descansar: su cupo se reinició.`);renderTeam();renderRoster()}}})},15000);
load();agents.forEach(placeAtDesk);buildStatic();fillTarget();renderTeam();renderResults();renderChips();renderRoster();
addMsg('sys','','Cada IA tiene su oficina. Dale una tarea al equipo o hacé clic en una persona para acercarte y hablarle. Si alguien necesita un dato, te lo pregunta acá.');
new ResizeObserver(resize).observe(cv);resize();requestAnimationFrame(frame);
window._office={setRot:v=>{rot=v;rotTarget=null},setZoom:v=>{zoom=zoomT=v},agents:()=>agents,select:i=>selectAgent(agents[i]),deselect,sample:()=>sampleFn};
try{if(window.claude&&claude.use){claude.use('sample').then(s=>{sampleFn=s||null;sampleState=s?'disponible':'no disponible';renderChips()}).catch(()=>{sampleState='no disponible';renderChips()})}else{sampleState='no disponible';renderChips()}}catch(e){sampleState='no disponible';renderChips()}
})();
</script>
</body>
</html>
