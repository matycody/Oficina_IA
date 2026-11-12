(()=>{
'use strict';
const $=s=>document.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};

/* ================= Proveedores (fase 2: acá se enchufan las APIs reales) ================= */
const PROVIDERS={
 claude :{label:'Claude' ,ini:'CL',color:'#e0714b',plans:['Free','Pro','Max'],mode:'real',tools:['Código','Razonamiento largo','Documentos'],office:'Backend'},
 copilot:{label:'Copilot',ini:'CP',color:'#8b5cf6',plans:['Free','Pro'],mode:'sim',tools:['VS Code','GitHub','Terminal'],office:'Frontend'},
 gemini :{label:'Gemini' ,ini:'GE',color:'#4a86f7',plans:['Free','Pro (estudiante)','Ultra'],mode:'sim',tools:['Búsqueda web','Multimodal','Pruebas'],office:'Datos e investigación'},
 openai :{label:'ChatGPT',ini:'GP',color:'#14a37f',plans:['Free','Plus','Pro'],mode:'sim',tools:['Redacción','Ideas','Datos'],office:'Contenido y redacción'},
 otro   :{label:'Otra IA',ini:'IA',color:'#7b8aa6',plans:['Free','Pago'],mode:'sim',tools:['General'],office:'Calidad (QA)'},
 jefe   :{label:'Vos',ini:'YO',color:'#f2b01e',plans:['—'],mode:'real',tools:['Decisiones','Prioridades'],office:'Tu oficina'},
 rec    :{label:'Asesora',ini:'AS',color:'#e0577a',plans:['—'],mode:'real',tools:['Agenda','Delegación'],office:'Recepción'}
};
const PO=['claude','copilot','gemini','openai','otro'];
const QUOTA=[8,40,100];
const WIN=5*3600*1000;
const LS='oficina-ia-v3';
const ROLES={
 'Backend':'Diseña la lógica del servidor, los datos y la API.',
 'Frontend':'Construye la interfaz y la experiencia de usuario.',
 'QA':'Verifica el trabajo de todos: que esté completo, coherente y que compile. Devuelve lo que falla.',
 'Investigador':'Busca y ordena información de distintas fuentes.',
 'Analista':'Compara opciones y saca conclusiones con criterio.',
 'Redactor':'Redacta y documenta con claridad.',
 'Diseñador UX':'Piensa los flujos y el aspecto de la interfaz.',
 'DevOps':'Prepara el despliegue y la infraestructura.',
 'Revisor':'Revisa y mejora el trabajo de otros.',
 'Colaborador':'Ayuda donde haga falta.',
 'Asesor/a':'Te representa cuando no estás: atiende al equipo, responde sus dudas con tu criterio y lo orienta.'};
const isQA=a=>/^(qa|tester|verific|revisor)/i.test((a.role||'').trim());
const roleDesc=a=>ROLES[a.role]||('Cumple el rol de "'+a.role+'" dentro del equipo.');
const LOOKS=[
 {skin:'#d9a47a',hair:'#2a1d15',hs:'short',beard:1,top:'#3d5a80',kind:'sweater',pants:'#2f3a52',shoe:'#1f2430',glasses:0,hgt:1.0},
 {skin:'#f1c9a5',hair:'#8a431f',hs:'long',beard:0,top:'#5e6b4e',kind:'jacket',inner:'#efe7d6',pants:'#3b3f55',shoe:'#e8e2d6',glasses:0,hgt:0.94},
 {skin:'#c68b62',hair:'#1c1512',hs:'bun',beard:0,top:'#8fb4e8',kind:'blazer',inner:'#ffffff',pants:'#2b3042',shoe:'#2b2b33',glasses:1,hgt:0.95},
 {skin:'#f3d2b4',hair:'#c8a05a',hs:'short2',beard:0,top:'#d9a23a',kind:'sweater',pants:'#47546e',shoe:'#3a2f2a',glasses:0,hgt:1.03},
 {skin:'#8d5a3b',hair:'#15110f',hs:'curly',beard:0,top:'#c85d6a',kind:'shirt',pants:'#33384a',shoe:'#1f2430',glasses:1,hgt:1.0},
 {skin:'#e9bf98',hair:'#3a2a20',hs:'wavy',beard:0,top:'#4aa08a',kind:'hoodie',pants:'#2f3a52',shoe:'#f2f2f2',glasses:0,hgt:0.95},
 {skin:'#d9a47a',hair:'#1c1512',hs:'short',beard:0,top:'#2d3748',kind:'jacket',inner:'#f2b01e',pants:'#232838',shoe:'#1f2430',glasses:0,hgt:1.0},
 {skin:'#f1c9a5',hair:'#5a3825',hs:'bun',beard:0,top:'#7a5ac8',kind:'blazer',inner:'#f4efe6',pants:'#2b3042',shoe:'#2b2b33',glasses:1,hgt:0.96}];
const DEFAULTS=[
 {provider:'gemini',dept:'claude',name:'Mateo',role:'Backend',planIdx:1,model:'',look:0},
 {provider:'gemini',dept:'copilot',name:'Andrea',role:'Frontend',planIdx:1,model:'',look:1},
 {provider:'gemini',dept:'gemini',name:'Valentina',role:'Analista de datos',planIdx:1,model:'gemini-3.5-flash-lite',look:2},
 {provider:'gemini',dept:'openai',name:'Lucas',role:'Redactor',planIdx:1,model:'gemini-2.5-flash-lite',look:3},
 {provider:'gemini',dept:'otro',name:'Sofía',role:'QA',planIdx:1,model:'gemini-2.5-flash',look:4}];
const NAMEPOOL=['Valentina','Joaquín','Camila','Tomás','Martina','Nicolás','Julieta','Bruno'];
const EXAMPLES=[
 'Armá un sistema de login con usuarios y contraseñas para una web',
 'Hacé una app de lista de tareas con API y pantalla',
 'Planificá un portfolio web: estructura, textos y revisión',
 'Analizá este informe y resumí los puntos clave'];

/* ================= Estado ================= */
let agents=[],running=false,t0=0,turn=0,nTeam=0,tasksDone=0,results=[],pending=null,selected=null,verdict=null;
let sampleFn=null,sampleState='comprobando';
let rot=0,spin=0,uidN=0,rotTarget=null;
let camX=21,camY=7.4,zoom=0.94,zoomT=0.94,camTx=21,camTy=7.4;
const PLAY={jefe:0,lounge:0};
let selRoom=null,summoned=null,currentTask='',ME=null,ADV=null;
const CFGK='oficina-ia-v4';
const CFG=Object.assign({name:'Matías',look:6,advName:'Elena',advLook:7,advPlan:1,away:false,dark:true,life:true,names:{},keys:{},chat:true,strict:true,teamV3:false,pc:{url:'http://localhost:8787',token:''}},(()=>{try{return JSON.parse(localStorage.getItem(CFGK)||'{}')}catch(e){return {}}})());
const saveCfg=()=>{try{localStorage.setItem(CFGK,JSON.stringify(CFG))}catch(e){}};
let DARK=CFG.dark;
const actors=()=>ME?[...agents,ME,ADV]:agents;

function mkAgent(c){
 const n=++uidN,li=(c.look!=null?c.look:n-1)%LOOKS.length;
 return {id:n,provider:c.provider,dept:c.dept||c.provider,name:c.name,role:c.role,planIdx:c.planIdx||0,model:c.model||'',tokIn:c.tokIn||0,tokOut:c.tokOut||0,calls:c.calls||0,used:c.used||0,winStart:c.winStart||0,lookIdx:li,look:LOOKS[li],
  x:0,y:0,face:[0,1],path:[],pr:null,sitAfter:false,seated:true,state:'idle',progress:0,bubble:'',chat:[],askLeft:2,
  phase:Math.random()*6,away:false,cur:null,doing:'Esperando una tarea.',tasks:[],lastReply:'',wave:0,
  sitK:1,v:0,walkPh:0,hy:0,hyG:0,glanceAt:0,dip:0,arm:{},pose:null,prop:null,thought:'',act:'',alpha:1,alphaT:1,hurry:false,beh:null,hidden:false}
}
function save(){try{localStorage.setItem(LS,JSON.stringify(agents.map(a=>({provider:a.provider,dept:a.dept||a.provider,name:a.name,role:a.role,planIdx:a.planIdx,model:a.model||'',tokIn:a.tokIn||0,tokOut:a.tokOut||0,calls:a.calls||0,used:a.used,winStart:a.winStart,look:a.lookIdx}))))}catch(e){}}
function load(){let c=null;try{c=JSON.parse(localStorage.getItem(LS)||'null')}catch(e){}
 let base=Array.isArray(c)?c:DEFAULTS;if(!CFG.teamV3){base=DEFAULTS;CFG.teamV3=true;saveCfg()}
 agents=base.map(mkAgent);if(base===DEFAULTS)save()}
const prov=a=>PROVIDERS[a.provider]||PROVIDERS.otro;
const planName=a=>prov(a).plans[a.planIdx]||prov(a).plans[0];
const limit=a=>QUOTA[a.planIdx]??QUOTA[0];
function rollWin(a){if(a.winStart&&Date.now()-a.winStart>=WIN){a.used=0;a.winStart=0}}
function resetIn(a){if(!a.winStart)return '';const tot=Math.ceil(Math.max(0,WIN-(Date.now()-a.winStart))/60e3);return `${Math.floor(tot/60)}h ${String(tot%60).padStart(2,'0')}m`}
const STATE_ES={idle:'libre',working:'trabajando',done:'listo',asking:'te pregunta',blocked:'descansando'};
const STATE_COL={idle:'#9aa6bd',working:'#3b7bff',done:'#16a679',asking:'#f2b01e',blocked:'#8a93a8'};

/* ================= Geometría del edificio =================
   Fila superior (y 0..6): 4 oficinas de 7x6.  Pasillo y 6..8.
   Fila inferior (y 8..14): Oficina abierta (0..7), Sala principal (7..19), Lounge (19..28). */
const SLOT={claude:14,copilot:21,gemini:28,openai:35};
const OFFS={};PO.forEach(p=>{const top=p!=='otro';OFFS[p]={p,ox:top?SLOT[p]:35,oy:top?0:8,doorY:top?6:8,chairY:top?1.65:9.65}});
OFFS.jefe={p:'jefe',ox:0,oy:0,doorY:7,chairY:1.65};OFFS.rec={p:'rec',ox:7,oy:0,doorY:6,chairY:1.65};
const deskX=(p,s)=>p==='rec'?OFFS.rec.ox+3.55:p==='jefe'?3.5:OFFS[p].ox+((s&1)?5.1:1.9);
const chairYOf=(p,s)=>OFFS[p].chairY+((p==='jefe'||p==='rec')?0:(s>>1)*2.45);
const JIN=[[8,7],[7,7],[5.6,7]];
function deskSeat(p,s){const o=OFFS[p],dx=o.ox+3.5,cx=deskX(p,s),cy=chairYOf(p,s);
 if(p==='jefe')return {room:'o:jefe',x:cx,y:o.chairY,f:[0,1],in:[...JIN,[5.6,o.chairY],[cx,o.chairY]]};
 if(p==='rec')return {room:'o:rec',x:cx,y:o.chairY,f:[0,1],in:[[dx,7],[dx,6],[dx,5],[o.ox+5.9,5],[o.ox+5.9,o.chairY],[cx,o.chairY]]};
 return {room:'o:'+p,x:cx,y:cy,f:[0,1],in:[[dx,7],[dx,o.doorY],[dx,cy],[cx,cy]]}}
function seatOf(a){if(a.home)return a.home;const s=agents.filter(x=>x.dept===a.dept).indexOf(a);return deskSeat(a.dept,Math.max(0,s)%4)}
function visitSpot(t){if(t.isMe)return {room:'o:jefe',x:3.5,y:3.7,f:[0,-1],in:[...JIN,[5.6,3.7],[3.5,3.7]]};
 if(t.adv){const o=OFFS.rec,dx=o.ox+3.5;return {room:'o:rec',x:dx,y:5,f:[0,-1],in:[[dx,7],[dx,6],[dx,5]]}}
 const op=t.home?'jefe':t.dept,o=OFFS[op],dx=o.ox+3.5,ts=seatOf(t);
 return {room:'o:'+op,x:dx,y:ts.y,f:[ts.x<dx?-1:1,0],in:[[dx,7],[dx,o.doorY],[dx,ts.y]]}}
const MIN=[[13,7],[13,8],[13,9]];
const SEATS=(()=>{const a=[];
 [10.75,12.25,13.75,15.25].forEach(x=>a.push({x,y:9.7,f:[0,1],via:[[x,9]]}));
 [10.75,12.25].forEach(x=>a.push({x,y:12.7,f:[0,-1],via:[[8.4,9],[8.4,12.7],[x,12.7]]}));
 [13.75,15.25].forEach(x=>a.push({x,y:12.7,f:[0,-1],via:[[17.6,9],[17.6,12.7],[x,12.7]]}));
 a.push({x:9.2,y:11.2,f:[1,0],via:[[8.4,9],[8.4,11.2]]});
 a.push({x:16.8,y:11.2,f:[-1,0],via:[[17.6,9],[17.6,11.2]]});
 a.forEach(s=>{s.room='meet';s.in=[...MIN,...s.via,[s.x,s.y]]});return a})();
const LIN=[[24,7],[24,8],[24,9]];
const LOUNGE=(()=>{const a=[];
 [20.55,21.4,22.25].forEach(x=>a.push({x,y:11.05,f:[0,-1],via:[[24,11.05]],sofa:1}));
 a.push({x:26.0,y:10.4,f:[-1,0],via:[[24,10.4]]});a.push({x:26.0,y:12.2,f:[-1,0],via:[[24,12.2]]});
 a.forEach(s=>{s.room='lounge';s.in=[...LIN,...s.via,[s.x,s.y]]});return a})();
const LSOFA=LOUNGE.filter(s=>s.sofa);
const LCOFFEE={room:'lounge',x:26.7,y:9.3,f:[0,-1],wall:1,in:[...LIN,[24,9.3],[26.7,9.3]]};

const dd=a=>a.filter((p,i)=>i===0||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]);
function laneOf(room){if(room==='kitchen')return 9.4;if(room&&room.startsWith('o:')){const o=OFFS[room.slice(2)];return o?o.oy+2.12:null}return null}
const COLX={lounge:24,'o:jefe':5.6};
function route(from,to){
 if(!from)return [[to.x,to.y]];
 if(from.room===to.room&&COLX[from.room]!=null){const cx=COLX[from.room];return dd([[from.x,from.y],[cx,from.y],[cx,to.y],[to.x,to.y]]).slice(1)}
 if(from.room===to.room){const ln=laneOf(from.room);if(ln==null)return [[to.x,to.y]];
  return dd([[from.x,from.y],[from.x,ln],[to.x,ln],[to.x,to.y]]).slice(1)}
 const out=from.in.slice(0,-1).reverse();return dd([...out,...to.in])}
function goTo(a,p,sit,face){return new Promise(res=>{if(a.pr){const r0=a.pr;a.pr=null;r0()}a.seated=false;a.path=p.map(q=>q.slice());a.sitAfter=!!sit;a.faceAfter=face||null;a.pr=res;if(!p.length){a.seated=!!sit;if(face)a.face=face;a.pr=null;res()}})}
async function moveTo(a,spot,sit){const p=route(a.cur,spot);a.cur=spot;await goTo(a,p,sit,spot.f)}
function placeAtDesk(a){const s=seatOf(a);if(a.pr){const r=a.pr;a.pr=null;r()}a._mv=null;a.cur=s;a.x=s.x;a.y=s.y;a.face=s.f;a.path=[];a.seated=true;a.away=false;a.sitK=1;a.v=0;a.pose=null;a.prop=null;a.act='';a.thought='';a.hurry=false}
const homeSpot=a=>seatOf(a);
const ownerP=a=>a.home?a.home.room.slice(2):a.dept;
const atHome=a=>{const h=seatOf(a),c=a.cur;return !!c&&c.room===h.room&&c.x===h.x&&c.y===h.y&&a.seated&&!a.path.length};
/* --- lugares de actividad --- */
function boardSpot(p){const o=OFFS[p],dx=o.ox+3.5;if(p==='jefe')return {room:'o:jefe',wall:1,x:0.7,y:1.5,f:[-1,0],in:[...JIN,[5.6,2.12],[0.7,2.12],[0.7,1.5]]};return {room:'o:'+p,wall:1,x:o.ox+0.7,y:o.oy+1.5,f:[-1,0],in:[[dx,7],[dx,o.doorY],[dx,o.oy+2.1],[o.ox+0.7,o.oy+2.1],[o.ox+0.7,o.oy+1.5]]}}
const KIN=[[31,7],[31,8],[31,9],[31,9.4]];
const kSp=(x,y,f,wall)=>({room:'kitchen',x,y,f,wall,in:dd([...KIN,[x,9.4],[x,y]])});
const KSPOT={coffee:kSp(34.15,9.4,[0,-1],1),stove:kSp(32.75,9.4,[0,-1],1),sink:kSp(29.6,9.4,[0,-1],1),fridge:kSp(28.75,9.4,[0,-1],1)};
const STOOLS=[30.6,31.8,33.0].map(x=>kSp(x,10.45,[0,1]));
const KIT={stove:0,coffee:0,lcoffee:0};
/* despacho del usuario: convocatoria */
const BRIEF=(()=>{const a=[];const mk=(x,y)=>a.push({room:'o:jefe',x,y,f:[0,-1],in:[...JIN,[x,7],[x,y]]});
 [6.4,7.4,8.4,9.4].forEach(y=>[4.2,5.2,6.2].forEach(x=>mk(x,y)));return a})();
const PODIUM={room:'o:jefe',x:5.2,y:5.2,f:[0,1],in:[...JIN,[5.2,7],[5.2,5.2]]};
const JSOFA=[6.9,7.7,8.5].map(y=>({room:'o:jefe',x:2.75,y,f:[-1,0],in:[...JIN,[5.6,y],[2.75,y]]}));
const JBAR=[0.9,1.8,2.7].map(x=>({room:'o:jefe',x,y:12.35,f:[0,1],in:[...JIN,[5.6,10.0],[x,10.0],[x,12.35]]}));
const JPOOL=[{room:'o:jefe',x:5.4,y:10.4,f:[0,1],in:[...JIN,[5.6,10.4],[5.4,10.4]]},{room:'o:jefe',x:3.7,y:11.6,f:[1,0],in:[...JIN,[5.6,10.0],[3.7,10.0],[3.7,11.6]]}];
/* sala de reuniones: lugar de la anfitriona/o al frente */
const HEAD={room:'meet',x:13,y:9.05,f:[0,1],in:[...MIN,[13,9.05]]};
const ENTRY={room:'out',x:25,y:15.7,f:[0,-1],in:[[24,7],[24,8],[24,9],[25,9.8],[25,13.4],[25,14.6],[25,15.7]]};

/* ================= Escena estática ================= */
let FLOOR=[],SHAD=[],OBJ=[],PILLS=[];
function addBox(x,y,z,w,d,h,col,o){const b={x,y,z,w,d,h,col,o:o||{}};
 OBJ.push({k:()=>rd(x+w/2,y+d/2)+(b.o.dk||0),f:()=>box(b)});if(b.o.sh!==false&&h>0.25)SHAD.push(b);return b}
function addCustom(cx,cy,f,dk){OBJ.push({k:()=>rd(cx,cy)+(dk||0),f})}
const vis=(nx,ny)=>(nx*C-ny*S)+(nx*S+ny*C)>0.02;
const WALL='#f7f8fb',GLASS='#a9d6f5';
/* pared: tipo 'outer' (opaca, con corte de vista) o 'part' (base sólida + vidrio) */
function addWall(x,y,len,axis,kind,gaps,normal,o){o=o||{};
 for(let i=0;i<len;i++){const u=(axis==='x'?x:y)+i;if(gaps&&gaps.includes(u))continue;
  const seg=axis==='x'?{x:u,y:y-0.1,w:1,d:0.2}:{x:x-0.1,y:u,w:0.2,d:1};
  OBJ.push({k:()=>rd(seg.x+seg.w/2,seg.y+seg.d/2),f:()=>{
   if(kind==='part'){
    box({x:seg.x,y:seg.y,z:0,w:seg.w,d:seg.d,h:0.9,col:o.col||'#e4e9f2',o:{}});
    box({x:seg.x,y:seg.y,z:0.9,w:seg.w,d:seg.d,h:1.5,col:GLASS,o:{al:0.28,edge:'rgba(80,130,180,.5)'}});
    box({x:seg.x,y:seg.y,z:2.4,w:seg.w,d:seg.d,h:0.08,col:o.trim||'#c9d2e2',o:{}});return}
   let h=2.6;if(normal){const rx=normal[0]*C-normal[1]*S,ry=normal[0]*S+normal[1]*C;if(rx+ry>0.12)h=0.5}
   box({x:seg.x,y:seg.y,z:0,w:seg.w,d:seg.d,h,col:o.col||WALL,o:{}});
   if(h>2&&(i%3===1))box({x:seg.x-(axis==='y'?0.03:0),y:seg.y-(axis==='x'?0.03:0),z:0.9,w:seg.w+(axis==='y'?0.06:0),d:seg.d+(axis==='x'?0.06:0),h:1.1,col:'#a8d3f2',o:{al:.9}})}})}
}
function doorFrame(cx,wy,axis,w,col){col=col||'#b8946a';
 if(axis==='x'){addBox(cx-w/2-0.07,wy-0.14,0,0.14,0.28,2.45,col,{sh:false,dk:0.1});addBox(cx+w/2-0.07,wy-0.14,0,0.14,0.28,2.45,col,{sh:false,dk:0.1});addBox(cx-w/2-0.07,wy-0.14,2.45,w+0.14,0.28,0.12,col,{sh:false,dk:0.1})}
 else{addBox(wy-0.14,cx-w/2-0.07,0,0.28,0.14,2.45,col,{sh:false,dk:0.1});addBox(wy-0.14,cx+w/2-0.07,0,0.28,0.14,2.45,col,{sh:false,dk:0.1});addBox(wy-0.14,cx-w/2-0.07,2.45,0.28,w+0.14,0.12,col,{sh:false,dk:0.1})}}
function doorLeaf(cx,wy,w,dir,col){ // puerta entreabierta (hoja a 90°)
 addBox(cx-w/2+0.02,wy+(dir>0?0.08:-0.08-0.9),0,0.07,0.9,2.1,col||'#c9a070',{sh:false,dk:0.12})}
function addPotted(x,y,s,g){s=s||1;
 addBox(x-0.2*s,y-0.2*s,0,0.4*s,0.4*s,0.45*s,g||'#c0714a');
 addCustom(x,y,()=>{const p=proj(x,y,0.5*s);const r=TW*0.55*s;
  blob(p.x-r*0.5,p.y-r*0.3,r*0.7,'#2f9a52','#44b86a');blob(p.x+r*0.45,p.y-r*0.4,r*0.75,'#2a8a49','#3fae62');blob(p.x,p.y-r*0.95,r*0.8,'#37a85a','#58c97a')},0.3)}
function addTallPlant(x,y,s){s=s||1;addBox(x-0.25*s,y-0.25*s,0,0.5*s,0.5*s,0.5*s,'#3b3f4f');
 addCustom(x,y,()=>{const p=proj(x,y,0.6*s),r=TW*0.5*s;for(let i=0;i<5;i++){blob(p.x+Math.sin(i*2.1)*r*0.5,p.y-i*r*0.75,r*0.62,'#2a8a49','#4cc070')}},0.3)}
function addTree(x,y,s,kind){s=s||1;kind=kind||0;
 addBox(x-0.14*s,y-0.14*s,0,0.28*s,0.28*s,1.1*s,'#7b5334',{sh:false});
 SHAD.push({circle:true,x,y,r:1.0*s});
 addCustom(x,y,()=>{const p=proj(x,y,1.5*s);const r=TW*1.0*s;const A=kind?['#e7a1b4','#f6c3d0']:['#2e8f4c','#4cb86b'];const B=kind?['#d98aa0','#f2b5c4']:['#287f43','#41a85f'];
  blob(p.x-r*0.5,p.y+r*0.35,r*0.8,B[0],B[1]);blob(p.x+r*0.55,p.y+r*0.3,r*0.8,B[0],B[1]);blob(p.x,p.y,r,A[0],A[1]);blob(p.x-r*0.2,p.y-r*0.75,r*0.7,A[0],A[1])},0.35)}
function addBush(x,y,s){s=s||1;SHAD.push({circle:true,x,y,r:0.6*s});
 addCustom(x,y,()=>{const p=proj(x,y,0.35*s),r=TW*0.55*s;blob(p.x-r*0.5,p.y,r*0.7,'#2c8a49','#46b066');blob(p.x+r*0.5,p.y,r*0.7,'#2c8a49','#46b066');blob(p.x,p.y-r*0.35,r*0.8,'#35a058','#58c479')},0.2)}
function addChair(cx,cy,f,col){col=col||'#56668a';
 addBox(cx-0.07,cy-0.07,0,0.14,0.14,0.42,'#2b3347',{sh:false,dk:-0.1});
 addBox(cx-0.3,cy-0.3,0.42,0.6,0.6,0.14,col,{dk:-0.1});
 const bx=-f[0],by=-f[1];
 if(Math.abs(bx)>Math.abs(by))addBox(cx+bx*0.3-0.05,cy-0.3,0.56,0.1,0.6,0.62,col,{dk:-0.08,sh:false});
 else addBox(cx-0.3,cy+by*0.3-0.05,0.56,0.6,0.1,0.62,col,{dk:-0.08,sh:false})}
function addSofa(x,y,w,col){const c2=shade(col,0.86);
 addBox(x,y,0,w,0.95,0.42,col);addBox(x,y,0.42,w,0.28,0.55,c2,{dk:-0.05});
 addBox(x,y,0.42,0.24,0.95,0.3,c2,{dk:0.02,sh:false});addBox(x+w-0.24,y,0.42,0.24,0.95,0.3,c2,{dk:0.02,sh:false})}
function addBookshelf(x,y,w,d,h,cols){addBox(x,y,0,w,d,h,'#a47b52');
 addCustom(x+w/2,y+d/2,()=>{if(!vis(0,1))return;cols=cols||['#e0714b','#4a86f7','#f2c14b','#14a37f','#8b5cf6','#e5484d'];
  const n=Math.max(3,Math.round(w*2.4));
  for(let r=0;r<Math.floor(h/0.55);r++)for(let c=0;c<n;c++){const zz=0.14+r*0.55,t=x+0.08+c*(w-0.16)/n;const hh=0.3+((r*7+c*13)%4)*0.06;
   quadY(y+d+0.01,t,t+(w-0.16)/n-0.03,zz,zz+hh,cols[(r*5+c)%cols.length])}},0.05)}
/* arte en la cara +y de una pared (y=wy) */
function wallArt(wy,x0,x1,z0,z1,col,fn,frame){addCustom((x0+x1)/2,wy+0.12,()=>{if(!vis(0,1))return;
 if(frame)quadY(wy+0.115,x0-0.06,x1+0.06,z0-0.06,z1+0.06,frame);quadY(wy+0.12,x0,x1,z0,z1,col);if(fn)fn(wy+0.13)},0.07)}
function wallArtX(wx,y0,y1,z0,z1,col,fn,frame){addCustom(wx+0.12,(y0+y1)/2,()=>{if(!vis(1,0))return;
 if(frame)quadX(wx+0.115,y0-0.06,y1+0.06,z0-0.06,z1+0.06,frame);quadX(wx+0.12,y0,y1,z0,z1,col);if(fn)fn(wx+0.13)},0.07)}

/* ---- escritorio temático ---- */
function agentOfDesk(p,s){if(p==='jefe')return ME;if(p==='rec')return ADV;return agents.filter(a=>a.dept===p)[s]}
function stCol(a,pc){return !a?'#3a4258':a.state==='working'?pc:a.state==='done'?'#34c98d':a.state==='asking'?'#f2c14b':a.state==='blocked'?'#8a93a8':'#4a5370'}
function addDesk(p,s,th){const o=OFFS[p],cx=deskX(p,s),y=o.oy+2.4+((p==='jefe'||p==='rec')?0:(s>>1)*2.45),P=PROVIDERS[p];
 addBox(cx-1.15,y,0.74,2.3,1.0,0.07,th.desk,{});
 addBox(cx-1.07,y+0.05,0,0.09,0.9,0.74,th.deskLeg,{sh:false});addBox(cx+0.98,y+0.05,0,0.09,0.9,0.74,th.deskLeg,{sh:false});
 addBox(cx+0.4,y+0.1,0.1,0.5,0.8,0.5,th.deskLeg,{sh:false,dk:0.01}); // cajonera
 addCustom(cx,y+0.55,()=>{const a=agentOfDesk(p,s),on=a&&(a.state==='working'||(a.isMe&&a.sitK>0.6&&a.alpha>0.5)),t=performance.now()/1000;
  const pulse=on?0.55+0.45*Math.sin(t*4+s):0;
  const g=on?`rgba(${hexRGB(P.color)},${0.35+0.35*pulse})`:null;
  if(th.multi){ // dos pantallas laterales + central bajo
   for(const dx of [-1.0,0.42]){box({x:cx+dx,y:y+0.55,z:0.86,w:0.58,d:0.05,h:0.5,col:'#161a28',o:{}});
    if(vis(0,1)){quadY(y+0.605,cx+dx+0.05,cx+dx+0.53,0.92,1.3,on?'#2a2160':'#1e2235');if(on){for(let i=0;i<4;i++){const ln=0.25+0.2*Math.abs(Math.sin(t*2+i+dx));quadY(y+0.61,cx+dx+0.09,cx+dx+0.09+ln,1.22-i*0.08,1.26-i*0.08,'rgba(190,170,255,.9)')}}}}
   box({x:cx-0.45,y:y+0.55,z:0.8,w:0.9,d:0.3,h:0.03,col:'#202538',o:{}});
   for(let i=0;i<9;i++)quadY(y+0.86,cx-0.42+i*0.1,cx-0.35+i*0.1,0.835,0.845,on?`hsl(${(i*40+t*120)%360},90%,62%)`:'#3b4262');
  }else{ // laptop
   box({x:cx-0.4,y:y+0.1,z:0.81,w:0.8,d:0.5,h:0.03,col:'#cfd5e0',o:{}});
   box({x:cx-0.4,y:y+0.56,z:0.84,w:0.8,d:0.04,h:0.47,col:'#b9c1d0',o:{}});
   if(vis(0,1)){const lc=g||'rgba(120,130,150,.5)';ctx.fillStyle=lc;ctx.beginPath();const q=proj(cx,y+0.62,1.08);ctx.arc(q.x,q.y,TW*0.12,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(q.x,q.y,TW*0.045,0,7);ctx.fill()}}
  // luz de estado y accesorios
  box({x:cx+0.78,y:y+0.12,z:0.81,w:0.14,d:0.14,h:0.1,col:stCol(a,P.color),o:{}});
  box({x:cx-0.95,y:y+0.12,z:0.81,w:0.2,d:0.2,h:0.17,col:th.mug,o:{}});
  th.deskExtra&&th.deskExtra(cx,y,s,on,t);
 },0.02);
 addChair(cx,chairYOf(p,s),[0,1],th.chair)}

/* ---- temas por proveedor ---- */
const THEME={
 claude:{floor:['#e9cfa6','#e3c69a'],wall:'#f2e3d0',trim:'#c9633f',rug:'#d98a68',rug2:'#f1d6b8',desk:'#b9824f',deskLeg:'#7e5834',chair:'#c9633f',mug:'#fff3e6'},
 copilot:{floor:['#403a63','#383259'],wall:'#d8d2ee',trim:'#8b5cf6',rug:'#231f3d',rug2:'#8b5cf6',desk:'#2c2748',deskLeg:'#1b1830',chair:'#6d4fd6',mug:'#8b5cf6',multi:1},
 gemini:{floor:['#f2f6fc','#e7eef9'],wall:'#f6f9ff',trim:'#4a86f7',rug:'#c4d8fb',rug2:'#4a86f7',desk:'#e3e9f3',deskLeg:'#aeb9cf',chair:'#4a86f7',mug:'#ffffff'},
 openai:{floor:['#e4f4ec','#daeee4'],wall:'#f1faf6',trim:'#14a37f',rug:'#a9ddc8',rug2:'#14a37f',desk:'#d8c49b',deskLeg:'#9a8458',chair:'#14a37f',mug:'#fff7d6'},
 otro:{floor:['#e6e8ed','#dfe2e8'],wall:'#f4f5f8',trim:'#7b8aa6',rug:'#c3c9d6',rug2:'#7b8aa6',desk:'#cdbf9f',deskLeg:'#8f8365',chair:'#7b8aa6',mug:'#ffffff'},
 jefe:{floor:['#8a5f3d','#815838'],wall:'#efe6da',trim:'#f2b01e',rug:'#5a1f2b',rug2:'#d4a017',desk:'#3a2418',deskLeg:'#1b110b',chair:'#22252f',mug:'#fff3e6'},
 rec:{floor:['#f0e4eb','#e9dbe3'],wall:'#fbf1f5',trim:'#e0577a',rug:'#f2c9d6',rug2:'#e0577a',desk:'#e9dfd0',deskLeg:'#a8947a',chair:'#e0577a',mug:'#ffffff'}
};
THEME.claude.deskExtra=(cx,y,s,on,t)=>{box({x:cx+0.55,y:y+0.45,z:0.81,w:0.3,d:0.35,h:0.07,col:'#f3e7d3',o:{}});box({x:cx+0.58,y:y+0.48,z:0.88,w:0.24,d:0.3,h:0.05,col:'#e0714b',o:{}});
 box({x:cx-0.72,y:y+0.5,z:0.81,w:0.08,d:0.08,h:0.5,col:'#6b4a2f',o:{}});box({x:cx-0.8,y:y+0.46,z:1.28,w:0.24,d:0.16,h:0.1,col:'#f2c14b',o:{}})};
THEME.gemini.deskExtra=(cx,y,s,on,t)=>{box({x:cx+0.55,y:y+0.3,z:0.81,w:0.28,d:0.4,h:0.04,col:'#fff',o:{}});
 if(vis(0,1)){for(let i=0;i<3;i++){quadY(y+0.705,cx+0.58,cx+0.6,0.86+i*0.03,0.88+i*0.03,'#34c98d');quadY(y+0.705,cx+0.62,cx+0.78,0.86+i*0.03,0.875+i*0.03,'#9db1d6')}}
 box({x:cx-0.85,y:y+0.35,z:0.81,w:0.2,d:0.3,h:0.04,col:'#222a3d',o:{}});box({x:cx-0.83,y:y+0.37,z:0.85,w:0.16,d:0.26,h:0.01,col:on?'#4a86f7':'#556080',o:{}})};
THEME.openai.deskExtra=(cx,y,s,on,t)=>{[['#ffe27a',0.55],['#ff9db7',0.72],['#8ad6a4',0.55]].forEach((n,i)=>{box({x:cx+n[1]-0.1+(i%2)*0.12,y:y+0.1+i*0.14,z:0.81,w:0.14,d:0.14,h:0.012,col:n[0],o:{}})});
 box({x:cx-0.8,y:y+0.5,z:0.81,w:0.26,d:0.34,h:0.06,col:'#fff',o:{}})};

THEME.jefe.deskExtra=(cx,y,s,on,t)=>{box({x:cx+0.55,y:y+0.1,z:0.81,w:0.45,d:0.3,h:0.05,col:'#d4a017',o:{}});box({x:cx+0.62,y:y+0.14,z:0.86,w:0.3,d:0.2,h:0.03,col:'#fff3c4',o:{}});
 box({x:cx-0.98,y:y+0.35,z:0.81,w:0.06,d:0.06,h:0.45,col:'#d4a017',o:{}});box({x:cx-1.05,y:y+0.3,z:1.26,w:0.2,d:0.16,h:0.1,col:'#f7e3a0',o:{}});
 box({x:cx-0.55,y:y+0.7,z:0.81,w:0.1,d:0.1,h:0.14,col:'rgba(220,170,90,.9)',o:{}})};
/* texto sobre la cara +y de una pared (queda deformado en perspectiva) */
function wallText(wy,x,z,txt,col,px,glow){addCustom(x,wy+0.2,()=>{if(!vis(0,1))return;const t=typeof txt==='function'?txt():txt;
 const p0=proj(x,wy+0.14,z),p1=proj(x+1,wy+0.14,z),p2=proj(x,wy+0.14,z+1);
 ctx.save();ctx.transform(p1.x-p0.x,p1.y-p0.y,p2.x-p0.x,p2.y-p0.y,p0.x,p0.y);ctx.scale(0.01,-0.01);
 ctx.font='800 '+Math.round(px*100)+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 if(glow){ctx.shadowColor=col;ctx.shadowBlur=14}ctx.fillStyle=col;ctx.fillText(t,0,0);ctx.restore()},0.09)}
function addSofaN(x,y,w,col){const c2=shade(col,0.86); // sofá mirando al norte (hacia la tele)
 addBox(x,y,0,w,0.95,0.42,col);addBox(x,y+0.67,0.42,w,0.28,0.32,c2,{dk:0.05});
 addBox(x,y,0.42,0.24,0.95,0.3,c2,{dk:0.02,sh:false});addBox(x+w-0.24,y,0.42,0.24,0.95,0.3,c2,{dk:0.02,sh:false})}
/* pizarra de cada oficina: se llena de anotaciones cuando alguien escribe */
const BOARDS={};
function addBoard(p){const o=OFFS[p],bx=o.ox+0.14,by=o.oy+0.85;BOARDS[p]={fill:0.18};
 addBox(bx,by+0.05,0,0.05,0.08,0.7,'#8a93a8',{sh:false});addBox(bx,by+1.17,0,0.05,0.08,0.7,'#8a93a8',{sh:false});
 addBox(bx-0.02,by,0.7,0.1,1.3,1.45,'#cfd6e4',{dk:0.02});
 addCustom(bx+0.08,by+0.65,()=>{if(!vis(1,0))return;const x=bx+0.083;quadX(x,by+0.06,by+1.24,0.76,2.09,'#f7f9fc');
  const n=Math.round(BOARDS[p].fill*9),cols=['#3b7bff','#e5484d','#14a37f','#8b5cf6','#f2a01e'];
  for(let i=0;i<n;i++){const z=1.95-i*0.14,len=0.35+((i*37)%7)*0.09;quadX(x+0.004,by+0.14,by+0.14+Math.min(1.0,len),z,z+0.045,cols[i%5]);if(i%3===2)quadX(x+0.004,by+0.14,by+0.3,z-0.07,z-0.03,'#9aa6bd')}},0.06)}

function buildOffice(p){const o=OFFS[p],th=THEME[p],{ox,oy}=o;
 const HH=p==='jefe'?14:6;for(let x=0;x<7;x++)for(let y=0;y<HH;y++)FLOOR.push({x:ox+x,y:oy+y,c:th.floor[(x+y)%2]});
 if(p!=='jefe'){FLOOR.push({x:ox+0.5,y:oy+1.1,w:6,d:4.7,c:th.rug,rug:1});FLOOR.push({x:ox+0.7,y:oy+1.3,w:5.6,d:4.3,c:th.rug2,rug:1,border:1})}
 if(p==='jefe'||p==='rec')addDesk(p,0,th);else{addDesk(p,0,th);addDesk(p,1,th);addDesk(p,2,th);addDesk(p,3,th)}
 const T={
 claude(){
  addBookshelf(ox+0.25,oy+0.2,1.9,0.55,2.2);addBookshelf(ox+4.85,oy+0.2,1.9,0.55,2.2);
  wallArt(oy+0.1,ox+2.45,ox+4.45,1.1,2.1,'#f7ead8',(py)=>{if(!vis(0,1))return;const q=proj(ox+3.45,py,1.6);ctx.fillStyle='#e0714b';ctx.beginPath();ctx.arc(q.x,q.y,TW*0.62,0,7);ctx.fill();ctx.fillStyle='#f2c14b';ctx.beginPath();ctx.arc(q.x+TW*0.2,q.y-TW*0.15,TW*0.26,0,7);ctx.fill()},'#8a5a3a');
  wallArt(oy+0.1,ox+2.8,ox+4.1,2.2,2.45,'#8a5a3a');
  // rincón de lectura
  addSofa(ox+0.35,oy+4.5,1.7,'#c9633f');addBox(ox+0.55,oy+4.0,0,0.5,0.5,0.55,'#8a5a3a');
  addBox(ox+2.5,oy+4.6,0,0.7,0.7,0.5,'#8a5a3a');addBox(ox+2.62,oy+4.72,0.5,0.46,0.46,0.06,'#fff3e6');
  addBox(ox+5.9,oy+4.9,0,0.1,0.1,1.6,'#6b4a2f',{sh:false});addBox(ox+5.72,oy+4.82,1.6,0.46,0.26,0.3,'#f7d9a8',{sh:false});
  addTallPlant(ox+6.4,oy+3.4,1.1);addPotted(ox+0.5,oy+3.7,1.1);addPotted(ox+6.45,oy+5.4,1);
 },
 copilot(){
  wallArt(oy+0.1,ox+0.3,ox+6.7,2.35,2.45,'#a98bff');
  wallArt(oy+0.1,ox+2.2,ox+4.8,0.95,2.15,'#12131f',(py)=>{if(!vis(0,1))return;const t=performance.now()/700;
   for(let i=0;i<9;i++){const ln=0.4+0.9*Math.abs(Math.sin(i*1.7+Math.floor(t)*0.2));const ind=(i%3)*0.18;quadY(py,ox+2.35+ind,ox+2.35+ind+ln,1.95-i*0.115,2.01-i*0.115,['#a98bff','#6fd0ff','#ffd47a','#8ae0a8'][i%4])}},'#3a3560');
  wallArt(oy+0.1,ox+0.35,ox+1.7,1.2,2.1,'#1c1833',(py)=>{quadY(py,ox+0.5,ox+1.55,1.8,1.9,'#8b5cf6');quadY(py,ox+0.5,ox+1.2,1.55,1.62,'#6fd0ff');quadY(py,ox+0.5,ox+1.4,1.35,1.42,'#ffd47a')},'#8b5cf6');
  wallArt(oy+0.1,ox+5.3,ox+6.65,1.2,2.1,'#1c1833',(py)=>{quadY(py,ox+5.45,ox+6.3,1.85,1.95,'#ff6fb1');quadY(py,ox+5.45,ox+6.5,1.6,1.67,'#6fd0ff');quadY(py,ox+5.45,ox+6.0,1.4,1.47,'#8ae0a8')},'#8b5cf6');
  // rack de servidores
  addBox(ox+6.15,oy+3.6,0,0.7,1.0,2.0,'#1a1d2c');
  addCustom(ox+6.5,oy+4.1,()=>{if(!vis(1,0))return;const t=performance.now()/300;for(let r=0;r<6;r++){quadX(ox+6.86,oy+3.7,oy+4.5,0.2+r*0.3,0.4+r*0.3,'#262a40');for(let l=0;l<4;l++)quadX(ox+6.87,oy+3.75+l*0.12,oy+3.8+l*0.12,0.27+r*0.3,0.31+r*0.3,((Math.floor(t+r*3+l*5))%3?'#34c98d':'#8b5cf6'))}},0.06);
  // puf y nevera
  addCustom(ox+1.0,oy+4.7,()=>{const p=proj(ox+1.0,oy+4.7,0.35);blob(p.x,p.y,TW*0.8,'#5a3fb8','#8b6cf0')},0.2);
  addBox(ox+2.4,oy+4.9,0,0.7,0.7,1.1,'#3a3f56');addBox(ox+2.45,oy+5.5,0.6,0.6,0.02,0.3,'#8b5cf6',{sh:false});
  addPotted(ox+0.5,oy+3.6,1.0,'#352f58');addPotted(ox+6.5,oy+5.5,1.1,'#352f58');
 },
 gemini(){
  // tablero de verificación
  wallArt(oy+0.1,ox+0.35,ox+3.4,1.0,2.2,'#ffffff',(py)=>{if(!vis(0,1))return;quadY(py,ox+0.35,ox+3.4,2.05,2.2,'#4a86f7');
   for(let i=0;i<4;i++){quadY(py,ox+0.55,ox+0.75,1.8-i*0.27,1.95-i*0.27,i===3?'#e5484d':'#34c98d');quadY(py,ox+0.9,ox+0.9+1.6-(i%2)*0.5,1.84-i*0.27,1.9-i*0.27,'#b9c6e0')}},'#aeb9cf');
  // estantería de dispositivos
  addBox(ox+3.9,oy+0.2,0,2.9,0.5,1.9,'#dfe6f2');
  addCustom(ox+5.35,oy+0.5,()=>{if(!vis(0,1))return;for(let r=0;r<3;r++){quadY(oy+0.71,ox+3.95,ox+7.0,0.55+r*0.6,0.57+r*0.6,'#b8c4da');
   for(let c=0;c<6;c++){const w=0.22+(c%3)*0.07;quadY(oy+0.715,ox+4.05+c*0.46,ox+4.05+c*0.46+w,0.6+r*0.6,0.6+r*0.6+0.38,['#222a3d','#4a86f7','#f2f6fc','#34c98d'][(r+c)%4])}}},0.05);
  // mesa de pruebas a la derecha y semáforo
  addBox(ox+5.6,oy+4.1,0,1.2,1.5,0.8,'#e7edf7');addBox(ox+5.65,oy+4.15,0.8,1.1,1.4,0.05,'#aeb9cf');
  addBox(ox+5.8,oy+4.4,0.85,0.4,0.28,0.04,'#222a3d');addBox(ox+6.2,oy+4.9,0.85,0.3,0.4,0.04,'#222a3d');addBox(ox+5.85,oy+5.0,0.85,0.25,0.3,0.14,'#34c98d');
  addBox(ox+0.35,oy+4.2,0,0.5,0.5,1.5,'#cfd8ea');
  addCustom(ox+0.6,oy+4.45,()=>{const q=proj(ox+0.6,oy+4.45,1.9);[['#e5484d',0],['#f2c14b',0.28],['#34c98d',0.56]].forEach(c=>{const z=proj(ox+0.6,oy+4.45,1.2+c[1]);ctx.fillStyle=c[0];ctx.beginPath();ctx.arc(z.x,z.y,TW*0.12,0,7);ctx.fill()})},0.2);
  addPotted(ox+2.7,oy+4.9,1.0,'#e7edf7');addPotted(ox+6.5,oy+3.3,1.0,'#e7edf7');
 },
 openai(){
  // muro de ideas
  wallArt(oy+0.1,ox+0.35,ox+6.65,0.95,2.3,'#ffffff',(py)=>{if(!vis(0,1))return;const cols=['#ffe27a','#ff9db7','#8ad6a4','#8ec9f5','#ffc58a'];
   for(let r=0;r<3;r++)for(let c=0;c<8;c++){const x=ox+0.55+c*0.76+((r*3+c)%3)*0.03,z=1.15+r*0.36;quadY(py,x,x+0.5,z,z+0.28,cols[(r*3+c*2)%5])}
   ctx.strokeStyle='#14a37f';ctx.lineWidth=2;ctx.beginPath();let q=proj(ox+1.1,py,2.15);ctx.moveTo(q.x,q.y);q=proj(ox+3.3,py,2.2);ctx.lineTo(q.x,q.y);q=proj(ox+5.6,py,2.12);ctx.lineTo(q.x,q.y);ctx.stroke()},'#aab8b0');
  // mesa redonda con banquetas
  addBox(ox+0.5,oy+4.0,0,0.18,0.18,0.7,'#9a8458',{sh:false});addBox(ox+0.1,oy+3.6,0.7,1.0,1.0,0.07,'#e8d9b0');
  [[0.25,3.4],[1.1,4.2],[0.3,4.75]].forEach(q=>addBox(ox+q[0],oy+q[1],0,0.4,0.4,0.45,'#14a37f',{dk:0.02}));
  addSofa(ox+4.2,oy+4.7,2.1,'#14a37f');addBox(ox+4.7,oy+4.05,0,1.0,0.5,0.4,'#e8d9b0');
  addTallPlant(ox+6.5,oy+3.3,1.1);addPotted(ox+2.5,oy+5.3,1.1);
  addBox(ox+2.9,oy+4.5,0,0.6,0.5,1.0,'#cfeadf');
 },
 jefe(){
  for(let x=0;x<7;x++)for(let y=11;y<14;y++)FLOOR.push({x,y,c:(x+y)%2?'#e8e4dc':'#2a2d3a'});
  FLOOR.push({x:1.0,y:1.0,w:5.2,d:4.2,c:'#5a1f2b',rug:1});FLOOR.push({x:1.2,y:1.2,w:4.8,d:3.8,c:'#d4a017',rug:1,border:1});
  FLOOR.push({x:0.7,y:5.9,w:3.0,d:3.7,c:'#14223f',rug:1});FLOOR.push({x:0.85,y:6.05,w:2.7,d:3.4,c:'#d4a017',rug:1,border:1});
  // ---- zona de trabajo (norte)
  addBookshelf(0.25,0.2,1.9,0.55,2.2,['#f2b01e','#d4a017','#e5484d','#14a37f','#8b5cf6']);
  addBookshelf(4.85,0.2,1.9,0.55,2.2,['#d4a017','#f2c14b','#caa24a','#f7e3a0','#e5484d']);
  wallText(0.1,3.5,2.05,()=>CFG.name.toUpperCase(),'#ff5fa8',0.32,true);
  wallArt(0.1,2.75,4.25,1.1,1.65,'#161a2b',(py)=>{if(!vis(0,1))return;const bars=[0.3,0.5,0.4,0.7,0.9,0.8];for(let i=0;i<6;i++)quadY(py,2.9+i*0.22,3.04+i*0.22,1.15,1.15+bars[i]*0.42,i>=4?'#34c98d':'#f2b01e')},'#f2b01e');
  addChair(2.9,4.2,[0,-1],'#8a4b2a');addChair(4.1,4.2,[0,-1],'#8a4b2a');
  addBox(6.2,1.1,0,0.6,0.7,0.85,'#3a3f4a');addBox(6.25,1.78,0.45,0.1,0.02,0.14,'#d4a017',{sh:false});
  addBox(6.3,2.55,0,0.1,0.1,0.8,'#d4a017',{sh:false});
  addCustom(6.35,2.6,()=>{const q=proj(6.35,2.6,1.15);blob(q.x,q.y,TW*0.42,'#2b6fd1','#5fa8ff');ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(q.x,q.y,TW*0.42,TW*0.14,0,0,7);ctx.stroke()},0.2);
  addBox(6.4,5.0,0,0.1,0.1,1.6,'#d4a017',{sh:false});addBox(6.22,4.92,1.6,0.46,0.26,0.3,'#f7d9a8',{sh:false});
  wallArtX(0,3.1,4.9,1.2,2.2,'#14223f',(px)=>{if(!vis(1,0))return;quadX(px,3.3,4.0,1.4,2.0,'#d4a017');quadX(px,4.1,4.7,1.4,1.8,'#e5484d');quadX(px,3.3,4.7,1.25,1.33,'#f2f4f8')},'#d4a017');
  // ---- sala de estar con tele (oeste)
  wallArtX(0,6.2,9.2,0.95,2.45,'#06080e',(px)=>{if(!vis(1,0))return;const on=PLAY.jefe>0,t=performance.now()/1000;RAW=true;
   if(on){quadX(px,6.28,9.12,1.03,2.37,'#16315e');for(let i=0;i<9;i++){const k=(i*37)%7,y=6.35+((i*0.43+t*0.8)%2.5);quadX(px,y,y+0.2,1.1+k*0.15,1.22+k*0.15,`hsl(${(i*47+t*70)%360},85%,62%)`)}quadX(px,6.28,9.12,1.03,1.1,'#34c98d')}
   else{quadX(px,6.28,9.12,1.03,2.37,'#10182e');quadX(px,7.2,8.2,1.55,1.65,'#2b3a6b')}
   RAW=false},'#0b0b10');
  addBox(0.15,6.2,0,0.6,3.0,0.55,'#2a1f18');addBox(0.3,7.4,0.55,0.32,0.2,0.46,'#f4f6fa');addBox(0.3,8.3,0.55,0.3,0.35,0.1,'#15171f');
  addBox(0.2,5.85,0,0.3,0.24,1.15,'#14161f');addBox(0.2,9.25,0,0.3,0.24,1.15,'#14161f');
  addBox(2.4,6.2,0,0.95,3.0,0.42,'#8a4b2a');addBox(3.07,6.2,0.42,0.28,3.0,0.32,'#6f3a1f',{dk:0.05});addBox(2.4,6.2,0.42,0.95,0.24,0.3,'#6f3a1f',{dk:0.02,sh:false});addBox(2.4,8.96,0.42,0.95,0.24,0.3,'#6f3a1f',{dk:0.02,sh:false});
  addBox(1.1,6.9,0,0.8,1.6,0.4,'#c9a56f');addBox(1.3,7.2,0.4,0.16,0.2,0.04,'#1d2030',{sh:false});addBox(1.3,7.8,0.4,0.16,0.2,0.04,'#e5484d',{sh:false});
  addTallPlant(0.5,5.0,1.0);addPotted(0.5,9.9,1.1);
  // ---- bar y pool (sur)
  addBox(0.3,13.05,0,3.0,0.65,1.05,'#2a1f18');addBox(0.25,13.0,1.05,3.1,0.75,0.06,'#e9dfd0');
  addCustom(1.8,13.4,()=>{for(let i=0;i<9;i++){const q=proj(0.5+i*0.32,13.4,1.15);ctx.fillStyle=['#2b7a4a','#7a3b1a','#caa24a','#2b4f8a','#8a2b3a','#3a8a8a'][i%6];ctx.fillRect(q.x-TW*0.05,q.y-TW*0.28,TW*0.1,TW*0.28);ctx.fillRect(q.x-TW*0.02,q.y-TW*0.38,TW*0.04,TW*0.1)}},0.08);
  JBAR.forEach(q=>{addBox(q.x-0.18,q.y-0.18,0,0.36,0.36,0.6,'#d4a017',{dk:0.02})});
  [[4.4,11.0],[6.2,11.0],[4.4,12.0],[6.2,12.0]].forEach(l=>addBox(l[0],l[1],0,0.2,0.2,0.7,'#3a2a1c',{sh:false}));
  addBox(4.2,10.9,0.7,2.4,1.4,0.16,'#5a3a22');addBox(4.32,11.02,0.86,2.16,1.16,0.02,'#1f7a4a',{sh:false});
  addCustom(5.4,11.6,()=>{const cols=['#f2c14b','#e5484d','#2b4f8a','#8b5cf6','#ff8a3d','#34c98d','#111','#f4f4f4'];for(let i=0;i<8;i++){const x=4.7+(i%4)*0.35+(i>3?0.17:0),y=11.15+Math.floor(i/4)*0.42+0.1,q=proj(x,y,0.92);ctx.fillStyle=cols[i];ctx.beginPath();ctx.arc(q.x,q.y,TW*0.07,0,7);ctx.fill()}},0.2);
  addBox(4.5,12.15,0.88,1.4,0.04,0.04,'#d9b27c',{sh:false});
  addTallPlant(6.5,13.3,1.1);addPotted(3.5,13.4,1.1);
  LIGHTS.push({x:1.5,y:7.7,r:3.4,col:'#6fa8ff',a:0.2,w:()=>PLAY.jefe>0});
 },
 rec(){
  wallText(oy+0.1,ox+3.5,2.05,'RECEPCIÓN','#e0577a',0.3,false);
  wallArt(oy+0.1,ox+2.2,ox+4.8,1.5,1.7,'#fbf1f5',null,'#e0577a');
  wallArt(oy+0.1,ox+4.9,ox+6.6,1.0,1.9,'#ffffff',(py)=>{if(!vis(0,1))return;quadY(py,ox+5.05,ox+6.45,1.55,1.8,'#f2c9d6');quadY(py,ox+5.05,ox+6.0,1.35,1.4,'#e0577a');quadY(py,ox+5.05,ox+6.2,1.15,1.2,'#aeb9cf')},'#e0577a');
  addBookshelf(ox+0.25,oy+0.2,1.9,0.55,2.0,['#e0577a','#f2c9d6','#aeb9cf','#34c98d','#f2b01e']);
  // mostrador de recepción
  addBox(ox+1.0,oy+3.6,0,3.9,0.6,1.05,'#c9a07a');addBox(ox+0.95,oy+3.55,1.05,4.0,0.7,0.07,'#fbf6ee');
  wallText(oy+4.2,ox+2.95,0.55,()=>ADV.name+' · Asesora y secretaria','#e0577a',0.17,false);
  addBox(ox+4.0,oy+3.7,1.12,0.2,0.2,0.1,'#d4a017',{sh:false});addBox(ox+1.2,oy+3.75,1.12,0.5,0.3,0.05,'#e0577a',{sh:false});
  // sala de espera
  addSofa(ox+0.3,oy+4.9,1.9,'#e0577a');addBox(ox+0.5,oy+4.2,0,0.8,0.5,0.4,'#c9a07a');addBox(ox+0.62,oy+4.28,0.4,0.3,0.34,0.03,'#fff',{sh:false});
  addBox(ox+6.3,oy+0.3,0,0.4,0.4,1.1,'#cfeaf5');addBox(ox+6.35,oy+0.35,1.1,0.3,0.3,0.3,'#8ec9f5',{sh:false});
  addTallPlant(ox+6.5,oy+3.4,1.1);addPotted(ox+6.45,oy+5.5,1.1);addPotted(ox+2.6,oy+5.6,1.0);
 },
 otro(){
  addBookshelf(ox+0.25,oy+0.2,2.3,0.55,2.0);
  wallArt(oy+0.1,ox+3.3,ox+5.3,1.1,2.0,'#fff',(py)=>{quadY(py,ox+3.5,ox+5.1,1.3,1.8,'#c3c9d6')},'#7b8aa6');
  addBox(ox+5.6,oy+0.3,0,0.9,0.7,1.0,'#dfe3ea');addPotted(ox+0.5,oy+4.1,1.1);addPotted(ox+6.5,oy+4.9,1.1);
  addSofa(ox+3.6,oy+4.7,1.9,'#7b8aa6');
 }};
 (T[p]||T.otro)();addBoard(p);
 // piso con luz de la oficina (cartel en el pasillo)
 const dx=o.ox+3.5;PILLS.push({x:dx,y:p==='otro'?7.55:p==='jefe'?5.2:6.45,z:0.05,t:()=>roomName('o:'+p),big:1,col:PROVIDERS[p].color,floor:1,room:'o:'+p});
}

let LIGHTS=[];
function buildStatic(){
 FLOOR=[];SHAD=[];OBJ=[];PILLS=[];LIGHTS=[];
 for(let x=-6;x<52;x++)for(let y=-6;y<24;y++){const k=(x*3+y*5)%4;FLOOR.push({x,y,c:['#8fd07b','#88ca75','#94d481','#8cce78'][k]})}
 // camino de entrada
 for(let y=14;y<24;y++)for(let x=24;x<26;x++)FLOOR.push({x,y,c:(x+y)%2?'#e5e0d2':'#dcd6c6'});
 // pasillo
 for(let x=7;x<42;x++)for(let y=6;y<8;y++)FLOOR.push({x,y,c:(x+y)%2?'#d3d9e6':'#cbd2e1'});
 FLOOR.push({x:7.4,y:6.7,w:34.2,d:0.6,c:'#aeb9d2',rug:1});
 // oficinas (4 arriba + abierta abajo + la del usuario)
 PO.forEach(buildOffice);buildOffice('jefe');buildOffice('rec');
 // sala principal
 for(let x=7;x<19;x++)for(let y=8;y<14;y++)FLOOR.push({x,y,c:(x+y)%2?'#b7c2d6':'#b1bdd1'});
 FLOOR.push({x:8.4,y:9.4,w:9.2,d:4.0,c:'#41527f',rug:1});FLOOR.push({x:8.6,y:9.6,w:8.8,d:3.6,c:'#4d6091',rug:1});
 // lounge
 for(let x=19;x<28;x++)for(let y=8;y<14;y++)FLOOR.push({x,y,c:(x+y)%2?'#ecdcc3':'#e7d6bb'});
 FLOOR.push({x:19.6,y:9.9,w:3.6,d:2.4,c:'#c96b5a',rug:1});FLOOR.push({x:23.2,y:13.1,w:2,d:0.9,c:'#5a4a42',rug:1});
 // cocina
 for(let x=28;x<35;x++)for(let y=8;y<14;y++)FLOOR.push({x,y,c:(x+y)%2?'#efe9dd':'#e3dccb'});
 FLOOR.push({x:29.6,y:12.5,w:4.4,d:1.1,c:'#c9786a',rug:1});
 // losa base
 addBox(-0.3,-0.3,-0.4,35.6,14.6,0.4,'#f4f6fa',{sh:false,dk:-50,noTop:1});addBox(35.3,-0.3,-0.4,7.0,14.6,0.4,'#f4f6fa',{sh:false,dk:-50,noTop:1});
 // paredes exteriores
 addWall(0,0,42,'x','outer',[],[0,-1]);
 addWall(0,0,14,'y','outer',[],[-1,0]);
 addWall(42,0,14,'y','outer',[],[1,0]);
 addWall(0,14,42,'x','outer',[24,25],[0,1]);
 // paredes interiores (base sólida + vidrio)
 addWall(7,6,35,'x','part',[10,17,24,31,38]);
 addWall(7,8,35,'x','part',[12,13,23,24,30,31,38]);
 addWall(7,0,14,'y','part',[6,7]);[14,21,28,35].forEach(x=>addWall(x,0,6,'y','part',[]));
 [19,28,35].forEach(x=>addWall(x,8,6,'y','part',[]));
 // marcos y puertas
 [10.5,17.5,24.5,31.5,38.5].forEach(x=>{doorFrame(x,6,'x',1.0);doorLeaf(x,6,1.0,1)});
 doorFrame(38.5,8,'x',1.0);doorLeaf(38.5,8,1.0,1);doorFrame(7,7,'y',2.0,'#d4a017');
 doorFrame(13,8,'x',2.0,'#8a93a8');doorFrame(24,8,'x',2.0,'#8a93a8');doorFrame(31,8,'x',2.0,'#8a93a8');
 doorFrame(25,14,'x',2.0);addBox(24.05,14.1,0,0.07,0.95,2.1,'#c9a070',{sh:false,dk:0.12});
 PILLS.push({x:25,y:14.6,z:0.05,t:'Entrada',big:1,floor:1});
 PILLS.push({x:13,y:8.7,z:0.05,t:()=>roomName('meet'),big:1,floor:1,room:'meet'});PILLS.push({x:24,y:8.7,z:0.05,t:()=>roomName('lounge'),big:1,floor:1,room:'lounge'});PILLS.push({x:31,y:8.7,z:0.05,t:()=>roomName('kitchen'),big:1,floor:1,room:'kitchen'});
 // sala de reunión
 addBox(10,10.3,0.72,6,1.8,0.1,'#d7b684',{dk:0.1});addBox(10.3,10.5,0,0.2,1.4,0.72,'#8f6f48',{sh:false});addBox(15.5,10.5,0,0.2,1.4,0.72,'#8f6f48',{sh:false});
 SEATS.forEach(s=>addChair(s.x,s.y,s.f,'#56668a'));
 addBox(9.2,8.2,1.0,5.0,0.12,1.3,'#1b2133',{dk:0.05});
 addCustom(11.7,8.3,()=>{if(!vis(0,1))return;RAW=true;quadY(8.33,9.3,14.1,1.05,2.25,'#27406e');
  for(let i=0;i<6;i++)quadY(8.34,9.6+i*0.7,9.6+i*0.7+0.45,1.2,1.2+0.3+((i*37)%7)*0.1,['#4a86f7','#14a37f','#f2c14b','#e0714b','#8b5cf6','#34c98d'][i]);RAW=false},0.06);
 wallArt(8.1,15.2,18.4,1.0,2.2,'#ffffff',(py)=>{[[15.5,1.9,'#f2c14b'],[16.3,2.0,'#7cc4f0'],[17.1,1.8,'#f08aa0'],[15.7,1.4,'#8ad6a4'],[16.6,1.35,'#f2c14b']].forEach(n=>quadY(py,n[0],n[0]+0.55,n[1]-0.2,n[1]+0.15,n[2]))},'#aab8c8');
 addPotted(7.6,13.3,1.3);addPotted(18.4,13.3,1.3);addPotted(7.6,8.7,1.1);addBox(16.4,8.3,0,2.0,0.55,0.9,'#eef1f6');
 // lounge = sala de entretenimiento: tele con PlayStation, sofá, sillones y rincón de café
 wallArt(8.1,19.7,22.9,0.95,2.45,'#06080e',(py)=>{if(!vis(0,1))return;const on=PLAY.lounge>0,t=performance.now()/1000;RAW=true;
  if(on){quadY(py,19.78,22.82,1.03,2.37,'#3a1a5e');for(let i=0;i<9;i++){const k=(i*37)%7,x=19.9+((i*0.46+t*0.9)%2.7);quadY(py,x,x+0.2,1.1+k*0.15,1.22+k*0.15,`hsl(${(i*53+t*80)%360},85%,62%)`)}quadY(py,19.78,22.82,1.03,1.1,'#ff6f61')}
  else{quadY(py,19.78,22.82,1.03,2.37,'#10182e');quadY(py,20.7,21.9,1.6,1.7,'#2b3a6b')}RAW=false},'#0b0b10');
 addBox(19.7,8.2,0,3.2,0.6,0.55,'#2b2f3d');addBox(20.6,8.3,0.55,0.2,0.32,0.46,'#f4f6fa');addBox(21.4,8.3,0.55,0.35,0.3,0.1,'#15171f');
 addBox(19.25,8.25,0,0.24,0.3,1.1,'#14161f');addBox(22.95,8.25,0,0.24,0.3,1.1,'#14161f');
 addBox(20.4,9.35,0,1.8,0.7,0.4,'#c9a56f');addBox(20.7,9.5,0.4,0.18,0.12,0.04,'#1d2030',{sh:false});addBox(21.2,9.55,0.4,0.18,0.12,0.04,'#e5484d',{sh:false});
 addSofaN(19.9,10.7,2.9,'#4f7fa8');
 addBox(25.5,9.9,0,0.9,1.0,0.5,'#d66f5b');addBox(26.2,9.9,0.5,0.25,1.0,0.5,'#c55f4b');
 addBox(25.5,11.7,0,0.9,1.0,0.5,'#d66f5b');addBox(26.2,11.7,0.5,0.25,1.0,0.5,'#c55f4b');
 // rincón de café del lounge
 addBox(26.0,8.15,0,1.8,0.65,0.95,'#c9a56f');addBox(25.95,8.1,0.95,1.9,0.75,0.05,'#eef1f6');addBox(26.55,8.25,1.0,0.42,0.36,0.52,'#2b3040');
 addCustom(26.76,8.62,()=>{if(!vis(0,1))return;const on=ME&&false,t=performance.now()/500;RAW=true;quadY(8.62,26.6,26.9,1.32,1.4,(Math.floor(t)%2&&KIT.lcoffee>0)?'#ff5a4f':'#9a3b3b');RAW=false},0.1);
 addBox(27.3,8.3,1.0,0.14,0.14,0.14,'#fff3e6',{sh:false});
 addBox(19.4,12.9,0,1.4,0.7,1.1,'#e9edf4');
 addPotted(27.3,13.3,1.4);addPotted(19.5,12.5,1.1);
 LIGHTS.push({x:21.3,y:10,r:3.4,col:'#b388ff',a:0.22,w:()=>PLAY.lounge>0});
 // cocina: heladera + bacha a la izquierda de la puerta, mesada con hornalla y cafetera a la derecha
 addBox(28.25,8.15,0,0.85,0.8,1.9,'#d5dbe6');addBox(28.3,8.96,1.15,0.75,0.03,0.05,'#8a93a8',{sh:false});
 addBox(29.15,8.15,0,0.8,0.7,0.9,'#c9a56f');addBox(29.15,8.15,0.9,0.8,0.7,0.05,'#eef1f6');addBox(29.3,8.28,0.95,0.5,0.4,0.03,'#7fa3c4',{sh:false});addBox(29.5,8.2,0.98,0.06,0.06,0.3,'#9aa6bd',{sh:false});
 addBox(32.1,8.15,0,2.8,0.7,0.9,'#c9a56f');addBox(32.1,8.15,0.9,2.8,0.7,0.05,'#eef1f6');
 addBox(32.3,8.25,0.95,1.0,0.5,0.06,'#2b3040');
 addCustom(32.8,8.5,()=>{const on=KIT.stove>0,t=performance.now()/1000;for(const dx of [0.28,0.72]){const q=proj(32.3+dx,8.5,1.02);ctx.strokeStyle=on?`rgba(255,${120+Math.round(60*Math.sin(t*6+dx*9))},60,.95)`:'#4a5266';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q.x,q.y,TW*0.17,TH*0.17,0,0,7);ctx.stroke()}
  if(on){const q=proj(32.8,8.5,1.1);ctx.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(q.x+Math.sin(t*2+i*2)*TW*0.1,q.y-((t*18+i*13)%34),2.4,0,7);ctx.fill()}}},0.08);
 addBox(33.7,8.3,0.95,0.45,0.36,0.55,'#2b3040');addBox(34.35,8.3,0.95,0.45,0.36,0.3,'#aab3c4');
 addCustom(33.95,8.7,()=>{if(!vis(0,1))return;const on=ME&&false;const t=performance.now()/500;RAW=true;quadY(8.68,33.78,34.0,1.25,1.4,(Math.floor(t)%2&&KIT.coffee>0)?'#ff5a4f':'#9a3b3b');RAW=false},0.1);
 addBox(30.0,11.0,0,3.6,0.9,0.95,'#c9a56f');addBox(29.95,10.95,0.95,3.7,1.0,0.07,'#eef1f6');
 addBox(31.2,11.2,1.02,0.5,0.4,0.16,'#e5484d',{sh:false});addBox(32.4,11.3,1.02,0.2,0.2,0.12,'#fff3e6',{sh:false});
 STOOLS.forEach(q=>addBox(q.x-0.2,q.y-0.2,0,0.4,0.4,0.55,'#d66f5b',{dk:0.02}));
 wallArtX(28,9.8,12.2,1.15,2.1,'#24332f',(px)=>{if(!vis(1,0))return;quadX(px,10.1,11.4,1.8,1.86,'rgba(240,240,230,.85)');quadX(px,10.1,10.9,1.6,1.65,'rgba(240,240,230,.7)');quadX(px,10.1,11.1,1.4,1.45,'rgba(240,240,230,.7)');quadX(px,11.5,11.9,1.4,1.9,'#e0a35c')},'#8a6a45');
 addPotted(34.5,13.3,1.3);addPotted(28.6,13.3,1.2);addTallPlant(34.4,10.2,1.1);
 // luces ambientales (se ven en modo oscuro)
 PO.forEach(p=>{const o=OFFS[p];LIGHTS.push({x:o.ox+3.5,y:o.oy+3,r:3.6,col:PROVIDERS[p].color,a:0.13})});
 LIGHTS.push({x:3.5,y:3,r:4,col:'#f2b01e',a:0.16},{x:3.5,y:10,r:4,col:'#ffb070',a:0.1},{x:10.5,y:3,r:3.8,col:'#e0577a',a:0.12},{x:13,y:11.2,r:5.4,col:'#5b8cff',a:0.13},{x:23.5,y:11,r:4.2,col:'#ffb070',a:0.12},{x:31.5,y:11,r:4,col:'#ffd9a0',a:0.15},{x:17,y:7,r:2.6,col:'#8aa0ff',a:0.08},{x:28,y:7,r:2.6,col:'#8aa0ff',a:0.08},{x:38,y:7,r:2.6,col:'#8aa0ff',a:0.08});
 // pasillo: plantas y bancos
 [[41.4,7.0],[8.5,6.4],[15.5,7.6],[20.5,6.4],[27.5,7.5]].forEach(q=>addPotted(q[0],q[1],1.0));
 addBox(36.0,7.4,0,1.8,0.4,0.45,'#c9a56f');addBox(36.0,7.7,0.45,1.8,0.1,0.45,'#c9a56f');
 // jardín
 [[-3,1.5,1.3,0],[-3.4,6,1.5,1],[-3,10,1.2,0],[3,-3.2,1.4,0],[10,-3.4,1.6,0],[17,-3.2,1.3,1],[24,-3.3,1.5,0],[31,-3.3,1.4,0],[45,2.2,1.4,0],[45.6,7,1.2,1],[45,12,1.3,0],[-1.5,17,1.3,0],[13,18,1.2,1],[19,19,1.4,0],[29,18,1.2,0],[4,19.5,1.4,0],[9,21,1.2,1],[34,18.5,1.3,0]].forEach(t=>addTree(t[0],t[1],t[2]*0.72,t[3]));
 [[4.2,15.4],[10,15.6],[14,15.4],[1,15.3],[21,15.4],[28.3,15.5],[22,15.5],[32,15.4]].forEach(b=>addBush(b[0],b[1],1));
 [[-1.2,4.5],[-1.2,9],[43.2,5],[43.1,10],[43.3,13]].forEach(b=>addBush(b[0],b[1],0.8));
 addBox(10,17.3,0,2,0.5,0.45,'#c9a56f');addBox(10,17.7,0.45,2,0.12,0.5,'#c9a56f');
 addBox(3,17.3,0,2,0.5,0.45,'#c9a56f');addBox(3,17.7,0.45,2,0.12,0.5,'#c9a56f');
 [[23.2,16.5],[26.8,16.5]].forEach(q=>{addBox(q[0],q[1],0,0.12,0.12,1.3,'#4a5266',{sh:false});addBox(q[0]-0.1,q[1]-0.1,1.3,0.32,0.32,0.22,'#ffe8a3',{sh:false})});
}
