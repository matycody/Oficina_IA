
/* ================= Render base ================= */
const cv=$('#cv'),ctx=cv.getContext('2d');
let W=800,H=600,TW=20,TH=10,ZH=22,OX=0,OY=0,C=1,S=0,baseTW=20,axT=0.5,ayT=0.46,ax=0.5,ay=0.46;
/* modo oscuro: reescribe cada color del edificio (los personajes no pasan por acá) */
let RAW=false;const DCACHE=new Map();
function D(c){if(!DARK||RAW||typeof c!=='string')return c;let r=DCACHE.get(c);if(r!==undefined)return r;r=dmap(c);DCACHE.set(c,r);return r}
function dmap(c){let r,g,b,a=1,m;
 if(c[0]==='#'){let h=c.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');if(h.length!==6)return c;const n=parseInt(h,16);r=(n>>16)&255;g=(n>>8)&255;b=n&255}
 else if((m=c.match(/^rgba?\(([^)]+)\)/))){const v=m[1].split(',').map(parseFloat);r=v[0];g=v[1];b=v[2];if(v.length>3)a=v[3]}
 else return c;
 r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;
 if(d>0){s=d/(1-Math.abs(2*l-1));if(mx===r)h=((g-b)/d+6)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60}
 const Ln=0.07+0.18*l,Lc=0.09+0.27*l,L2=Ln+(Lc-Ln)*Math.min(1,s*1.4);
 let h2=h,s2=Math.min(1,s*0.95);if(s<0.25&&1-s/0.25>0.5){h2=228;s2=0.26}
 return `hsla(${h2.toFixed(0)},${(s2*100).toFixed(0)}%,${(L2*100).toFixed(1)}%,${a})`}
function hexRGB(h){const n=parseInt(h.slice(1),16);return ((n>>16)&255)+','+((n>>8)&255)+','+(n&255)}
function resize(){const r=cv.getBoundingClientRect();const d=window.devicePixelRatio||1;W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
function setCam(){C=Math.cos(rot);S=Math.sin(rot);baseTW=Math.min(W/61,H/28);TW=baseTW*zoom;TH=TW/2;ZH=TW*1.12;OX=W*ax;OY=H*ay}
function proj(x,y,z){const dx=x-camX,dy=y-camY;const rx=dx*C-dy*S,ry=dx*S+dy*C;return {x:OX+(rx-ry)*TW,y:OY+(rx+ry)*TH-z*ZH}}
function rd(x,y){const dx=x-camX,dy=y-camY;return (dx*C-dy*S)+(dx*S+dy*C)}
function shade(h,f){const n=parseInt(h.slice(1),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;r=Math.min(255,r*f)|0;g=Math.min(255,g*f)|0;b=Math.min(255,b*f)|0;return `rgb(${r},${g},${b})`}
function poly(p,fill,stroke){ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);ctx.closePath();ctx.fillStyle=D(fill);ctx.fill();if(stroke){ctx.strokeStyle=(DARK&&stroke==='rgba(30,40,70,.16)')?'rgba(150,175,255,.11)':D(stroke);ctx.lineWidth=1;ctx.stroke()}}
function box(b){const {x,y,z,w,d,h,col,o}=b;const al=o.al!=null?o.al:1;ctx.globalAlpha=al;const edge=o.edge||'rgba(30,40,70,.16)';
 const sides=[[1,0,[x+w,y],[x+w,y+d]],[-1,0,[x,y],[x,y+d]],[0,1,[x,y+d],[x+w,y+d]],[0,-1,[x,y],[x+w,y]]];
 for(const [nx,ny,a,c2] of sides){const rx=nx*C-ny*S,ry=nx*S+ny*C;if(rx+ry<=0.0001)continue;
  poly([proj(a[0],a[1],z),proj(c2[0],c2[1],z),proj(c2[0],c2[1],z+h),proj(a[0],a[1],z+h)],shade(col,(rx-ry)>0?0.72:0.88),edge)}
 if(!o.noTop)poly([proj(x,y,z+h),proj(x+w,y,z+h),proj(x+w,y+d,z+h),proj(x,y+d,z+h)],shade(col,1.08),edge);ctx.globalAlpha=1}
function blob(x,y,r,c1,c2){const g=ctx.createRadialGradient(x-r*0.3,y-r*0.35,r*0.1,x,y,r);g.addColorStop(0,D(c2));g.addColorStop(1,D(c1));ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=g;ctx.fill()}
function quadY(py,x0,x1,z0,z1,col){poly([proj(x0,py,z0),proj(x1,py,z0),proj(x1,py,z1),proj(x0,py,z1)],col)}
function quadX(px,y0,y1,z0,z1,col){poly([proj(px,y0,z0),proj(px,y1,z0),proj(px,y1,z1),proj(px,y0,z1)],col)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

/* ================= Personas (esqueleto 3D proyectado) =================
   Cada articulación vive en coordenadas del mundo (u adelante, v lateral, z altura)
   y se proyecta con la misma cámara que el edificio: al girar la vista el cuerpo gira de verdad. */
function smooth(g,pts){g.beginPath();const n=pts.length;g.moveTo((pts[n-1][0]+pts[0][0])/2,(pts[n-1][1]+pts[0][1])/2);
 for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n];g.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2)}g.closePath()}
function limb(g,p,q,w,col,hi){g.lineCap='round';g.strokeStyle='rgba(15,20,40,.32)';g.lineWidth=w+1.6;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke();
 g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke();
 if(hi){g.strokeStyle='rgba(255,255,255,.16)';g.lineWidth=Math.max(1,w*0.28);g.beginPath();g.moveTo(p.x-w*0.18,p.y);g.lineTo(q.x-w*0.18,q.y);g.stroke()}}

function drawHead(g,L,hx,hy,rx,ry,tw,lt,o){
 o=o||{};const hair=L.hair,skin=L.skin,hs=L.hs;const front=tw>-0.12;
 const hairMass=(dx)=>{g.fillStyle=hair;g.beginPath();g.ellipse(hx+dx,hy-ry*0.06,rx*1.07,ry*1.06,0,0,7);g.fill()};
 // masa de pelo detrás
 if(hs==='long'||hs==='wavy'){const bot=hs==='long'?1.9:1.2;g.fillStyle=hair;
  if(front){[-1,1].forEach(s=>{const x0=hx+s*rx*1.0-rx*0.3-lt*rx*0.1;rrg(g,x0,hy-ry*0.3,rx*0.6,ry*(bot+0.3),rx*0.3);g.fill()})}
  else{g.beginPath();g.moveTo(hx-rx*1.08,hy-ry*0.3);g.quadraticCurveTo(hx-rx*1.3,hy+ry*bot*0.7,hx-rx*0.95,hy+ry*bot);g.lineTo(hx+rx*0.95,hy+ry*bot);g.quadraticCurveTo(hx+rx*1.3,hy+ry*bot*0.7,hx+rx*1.08,hy-ry*0.3);g.closePath();g.fill()}}
 if(front)hairMass(-lt*rx*0.18);
 // orejas y cabeza
 g.fillStyle=shade(skin,0.9);[-1,1].forEach(s=>{g.beginPath();g.ellipse(hx+s*rx*0.98,hy+ry*0.1,rx*0.16,ry*0.2,0,0,7);g.fill()});
 const gr=g.createRadialGradient(hx-rx*0.35,hy-ry*0.4,rx*0.1,hx,hy,ry*1.15);gr.addColorStop(0,shade(skin,1.1));gr.addColorStop(1,shade(skin,0.9));
 g.fillStyle=gr;g.beginPath();g.ellipse(hx,hy,rx,ry,0,0,7);g.fill();
 g.strokeStyle='rgba(60,30,20,.22)';g.lineWidth=1;g.stroke();
 if(front){
  const fx=hx+lt*rx*0.78,sep=rx*0.42*Math.max(tw,0.28),ey=hy-ry*0.02;
  // barba
  if(L.beard){g.save();g.beginPath();g.ellipse(hx,hy,rx,ry,0,0,7);g.clip();g.fillStyle='rgba(30,20,15,.55)';g.beginPath();g.moveTo(hx-rx*1.1,hy+ry*0.15);g.quadraticCurveTo(fx,hy+ry*0.4,hx+rx*1.1,hy+ry*0.15);g.lineTo(hx+rx*1.1,hy+ry*1.2);g.lineTo(hx-rx*1.1,hy+ry*1.2);g.closePath();g.fill();g.fillStyle=shade(skin,0.78);g.beginPath();g.ellipse(fx,hy+ry*0.55,rx*0.2*Math.max(tw,.4),ry*0.07,0,0,7);g.fill();g.restore()}
  // cejas y ojos
  g.strokeStyle=hair;g.lineWidth=Math.max(1.2,rx*0.1);g.lineCap='round';
  [-1,1].forEach(s=>{const ex=fx+s*sep;if(Math.abs(tw)<0.45&&((lt>0&&s<0)||(lt<0&&s>0)))return;
   g.beginPath();g.moveTo(ex-rx*0.17,ey-ry*0.26);g.lineTo(ex+rx*0.17,ey-ry*0.3);g.stroke();
   g.fillStyle='#fff';g.beginPath();g.ellipse(ex,ey,rx*0.15,ry*0.095,0,0,7);g.fill();
   g.fillStyle='#2a2f3f';g.beginPath();g.arc(ex+lt*rx*0.05,ey,rx*0.085,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(ex+lt*rx*0.05-rx*0.025,ey-rx*0.025,rx*0.03,0,7);g.fill()});
  // nariz y boca
  g.strokeStyle=shade(skin,0.72);g.lineWidth=Math.max(1,rx*0.07);g.beginPath();g.moveTo(fx+lt*rx*0.06,ey+ry*0.08);g.lineTo(fx+lt*rx*0.16,ey+ry*0.38);g.lineTo(fx+lt*rx*0.02,ey+ry*0.42);g.stroke();
  g.strokeStyle='#8f4a3c';g.lineWidth=Math.max(1.2,rx*0.09);const mw=rx*0.27*(0.45+0.55*Math.max(tw,0));
  const talk=o.talk?Math.abs(Math.sin(performance.now()/110))*ry*0.07:0;
  g.beginPath();g.moveTo(fx-mw,hy+ry*0.58);g.quadraticCurveTo(fx,hy+ry*(0.7+(o.talk?0.05:0.1))+talk,fx+mw,hy+ry*0.58);g.stroke();
  g.fillStyle='rgba(240,120,110,.18)';[-1,1].forEach(s=>{g.beginPath();g.ellipse(fx+s*sep*1.25,hy+ry*0.38,rx*0.13,ry*0.08,0,0,7);g.fill()});
  if(L.glasses){g.strokeStyle='#232a3b';g.lineWidth=Math.max(1.3,rx*0.09);[-1,1].forEach(s=>{const ex=fx+s*sep;g.beginPath();g.ellipse(ex,ey,rx*0.25,ry*0.2,0,0,7);g.stroke()});g.beginPath();g.moveTo(fx-sep+rx*0.25,ey);g.lineTo(fx+sep-rx*0.25,ey);g.stroke();g.fillStyle='rgba(180,210,255,.18)';[-1,1].forEach(s=>{g.beginPath();g.ellipse(fx+s*sep,ey,rx*0.24,ry*0.19,0,0,7);g.fill()})}
  // flequillo / casquete
  g.save();g.beginPath();g.ellipse(hx,hy,rx*1.01,ry*1.01,0,0,7);g.clip();g.fillStyle=hair;
  const top=hs==='bun'||hs==='long'?0.33:hs==='short'?0.4:0.32;
  g.beginPath();g.moveTo(hx-rx*1.2,hy-ry*1.3);g.lineTo(hx+rx*1.2,hy-ry*1.3);g.lineTo(hx+rx*1.2,hy-ry*top*0.5);
  const side=(hs==='long'||hs==='wavy')?-lt*rx*0.25:lt*rx*0.15;
  g.quadraticCurveTo(hx+rx*0.5+side,hy-ry*(top+0.3),hx+side*0.3,hy-ry*(top-0.05));g.quadraticCurveTo(hx-rx*0.5+side,hy-ry*(top+0.15),hx-rx*1.2,hy-ry*top*0.4);g.closePath();g.fill();
  if(hs==='short'||hs==='short2'||hs==='curly'){g.fillRect(hx-rx*1.12,hy-ry*0.5,rx*0.24,ry*0.62);g.fillRect(hx+rx*0.88,hy-ry*0.5,rx*0.24,ry*0.62)}
  if(hs==='short2'){g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.ellipse(hx-rx*0.2,hy-ry*0.82,rx*0.5,ry*0.12,-0.3,0,7);g.fill()}
  g.restore();
 }else{
  hairMass(0);g.fillStyle='rgba(0,0,0,.14)';g.beginPath();g.ellipse(hx,hy+ry*0.15,rx*0.95,ry*0.85,0,0,7);g.fill();
 }
 if(hs==='bun'){g.fillStyle=hair;g.beginPath();g.arc(hx-lt*rx*0.3,hy-ry*1.12,rx*0.42,0,7);g.fill();g.fillStyle='rgba(255,255,255,.14)';g.beginPath();g.arc(hx-lt*rx*0.3-rx*0.1,hy-ry*1.2,rx*0.15,0,7);g.fill()}
 if(hs==='curly'){g.fillStyle=hair;for(let i=0;i<9;i++){const an=Math.PI*(1.0+i/8);g.beginPath();g.arc(hx+Math.cos(an)*rx*1.0,hy-ry*0.1+Math.sin(an)*ry*1.0,rx*0.3,0,7);g.fill()}}
}

function vfac(ang){const f=[Math.cos(ang),Math.sin(ang)],fr=[f[0]*C-f[1]*S,f[0]*S+f[1]*C];return {tw:(fr[0]+fr[1])*0.7071,lt:(fr[0]-fr[1])*0.7071}}
const lerp=(a,b,k)=>a+(b-a)*k;
function drawProp(g,kind,A,t){const x=A.wr.x,y=A.wr.y,u=ZH;
 if(kind==='pad'){g.fillStyle='#1d2030';rr(x-0.08*u,y-0.03*u,0.16*u,0.07*u,3);g.fill();g.fillStyle='#ff4d6d';g.fillRect(x+0.03*u,y-0.01*u,0.025*u,0.025*u);g.fillStyle='#4da3ff';g.fillRect(x-0.05*u,y-0.01*u,0.025*u,0.025*u);return}
 if(kind==='mug'||kind==='glass'){g.fillStyle=kind==='mug'?'#f4efe6':'rgba(190,225,255,.8)';g.strokeStyle='rgba(15,20,40,.45)';g.lineWidth=1;rr(x-0.05*u,y-0.12*u,0.1*u,0.13*u,2);g.fill();g.stroke();
  if(kind==='mug'){g.strokeStyle='#f4efe6';g.lineWidth=1.6;g.beginPath();g.arc(x+0.055*u,y-0.06*u,0.032*u,-1.4,1.4);g.stroke();g.fillStyle='#6b4226';g.fillRect(x-0.04*u,y-0.115*u,0.08*u,0.02*u);
   g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1.2;for(let i=0;i<2;i++){const bx=x-0.02*u+i*0.04*u;g.beginPath();g.moveTo(bx,y-0.14*u);g.quadraticCurveTo(bx+Math.sin(t*3+i)*0.03*u,y-0.19*u,bx,y-0.25*u);g.stroke()}}}
 else if(kind==='marker'){g.strokeStyle='#e5484d';g.lineWidth=2.6;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(x-0.07*u,y-0.03*u);g.stroke()}
 else if(kind==='spoon'||kind==='fork'){g.strokeStyle='#d5dbe6';g.lineWidth=2;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(x+0.02*u,y-0.16*u);g.stroke();g.fillStyle='#d5dbe6';g.beginPath();g.ellipse(x+0.02*u,y-0.17*u,0.03*u,0.022*u,0,0,7);g.fill()}
 else if(kind==='phone'){g.fillStyle='#161b2d';g.strokeStyle='#5a6483';g.lineWidth=1;rr(x-0.025*u,y-0.1*u,0.05*u,0.1*u,2);g.fill();g.stroke()}
}
function drawChar(a,now){
 const L=a.look,g=ctx,t=now/1000,dtf=a._dt||0.016;
 const ang=a.ang||0,f=[Math.cos(ang),Math.sin(ang)],pr=[-f[1],f[0]];
 const sc=L.hgt,X=a.x,Y=a.y;
 const bv=vfac(ang),tw=bv.tw,lt=bv.lt,hv=vfac(ang+a.hy);
 const J=(u,v,z)=>proj(X+f[0]*u+pr[0]*v,Y+f[1]*u+pr[1]*v,z);
 const sxv=((pr[0]*C-pr[1]*S)-(pr[0]*S+pr[1]*C))*TW,sxu=((f[0]*C-f[1]*S)-(f[0]*S+f[1]*C))*TW;
 const sk=a.sitK,sp=Math.min(1,a.v/2.3)*(1-sk),walking=a.v>0.15&&a.path.length>0;
 const w=a.walkPh,breath=Math.sin(t*1.9+a.phase)*0.006;
 const talking=!!a.bubble&&!walking,working=a.state==='working';
 const pose=a.pose||((a.state==='blocked'&&sk>0.5)?'sleep':(working&&sk>0.5)?'type':null);
 const bob=Math.abs(Math.sin(w))*0.035*sp;
 const vs=(1-sk)*(1-sp)*Math.sin(t*0.8+a.phase)*0.012;
 const ph=lerp(0.93*sc,0.6,sk)+bob;
 let leanP=0;if(pose==='stretch')leanP=-0.07;else if(pose==='write'||pose==='read'||pose==='stir'||pose==='brew')leanP=0.05;
 const zS=ph+0.52*sc+breath,lean=lerp(0.04*sp,working?0.09:0.03,sk)+leanP;
 const skin=L.skin,col=L.top,pc=L.pants,ink='rgba(15,20,40,.3)';
 g.globalAlpha=Math.max(0,Math.min(1,a.alpha));
 // sombra de contacto
 const gp=proj(X,Y,0);g.fillStyle=DARK?'rgba(0,0,0,.35)':'rgba(25,40,80,.2)';g.beginPath();g.ellipse(gp.x,gp.y,TW*0.4,TH*0.4,0,0,7);g.fill();
 const dT=rd(X,Y),lw=0.125*sc*ZH;
 // --- piernas (se mezclan entre pose de pie y sentada) ---
 const legs=[];
 for(const s of [-1,1]){
  const hip=J(0,s*0.09*sc,ph),c1=Math.sin(w+(s>0?Math.PI:0))*sp,lift=Math.max(0,Math.cos(w+(s>0?Math.PI:0)))*sp*0.11;
  const au=0.3*c1*sc,az=0.07+lift;
  const knee=J(lerp(au*0.5+0.07*sp,0.42,sk),s*0.1*sc,lerp((ph+az)/2+0.02,0.64,sk));
  const ank=J(lerp(au,0.46,sk),s*0.1*sc,lerp(az,0.1,sk));
  const toe=J(lerp(au+0.16,0.62,sk),s*0.1*sc,lerp(az-0.02,0.06,sk));
  legs.push({d:rd(X+pr[0]*s*0.09,Y+pr[1]*s*0.09),fn:()=>{limb(g,hip,knee,lw*1.05,pc,1);limb(g,knee,ank,lw*0.88,pc,1);limb(g,ank,toe,lw*0.78,L.shoe,0)}});
 }
 legs.sort((p,q)=>p.d-q.d);legs.forEach(l=>l.fn());
 {const c=J(0,vs,ph),hw=sc*Math.hypot(0.17*sxv,0.1*sxu);g.fillStyle=pc;g.beginPath();g.ellipse(c.x,c.y,hw,0.07*ZH,0,0,7);g.fill()}
 // --- brazos: objetivo según la pose y suavizado (nada salta de golpe) ---
 const arms={};
 for(const s of [-1,1]){
  const R=s>0,swv=Math.sin(w+(R?0:Math.PI))*sp;
  let e=[0.09*swv*sc,s*0.235*sc,zS-0.27],wr=[0.18*swv*sc+0.05,s*0.22*sc,zS-0.5-Math.abs(swv)*0.04];
  if(sk>0.5){if(pose==='type'){const jit=Math.sin(t*17+s*2+a.phase)*0.018;wr=[0.5,s*0.14*sc,0.84+Math.max(0,jit)];e=[0.16,s*0.27*sc,0.86]}else{wr=[0.46,s*0.15*sc,0.8];e=[0.14,s*0.27*sc,0.88]}}
  switch(pose){
   case 'sip':if(R){const k=0.5+0.5*Math.sin(t*0.9+a.phase),u=k*k*(3-2*k);wr=[lerp(0.3,0.17,u),lerp(0.12,0.05,u)*sc,lerp(zS-0.3,zS+0.12,u)];e=[lerp(0.12,0.1,u),0.24*sc,lerp(zS-0.33,zS-0.2,u)]}break;
   case 'brew':if(R){wr=[0.42+0.03*Math.sin(t*3),0.1*sc,zS-0.3];e=[0.16,0.25*sc,zS-0.3]}break;
   case 'write':if(R){wr=[0.46+0.03*Math.sin(t*7),0.1*sc+0.11*Math.sin(t*3.1),zS-0.04+0.07*Math.cos(t*4.7)];e=[0.2,0.26*sc,zS-0.14]}else{wr=[0.02,-0.28*sc,zS-0.55];e=[-0.02,-0.3*sc,zS-0.33]}break;
   case 'think':if(R){wr=[0.2,0.04*sc,zS+0.1+0.012*Math.sin(t*2)];e=[0.12,0.24*sc,zS-0.2]}else{wr=[0.22,-0.04*sc,zS-0.33];e=[0.06,-0.25*sc,zS-0.35]}break;
   case 'stretch':{const up=0.04*Math.sin(t*2.2);wr=[-0.02,s*0.2*sc,zS+0.62+up];e=[0,s*0.24*sc,zS+0.3]}break;
   case 'read':wr=[0.36,s*0.1*sc,zS-0.32];e=[0.1,s*0.25*sc,zS-0.36];break;
   case 'stir':if(R){wr=[0.4+0.07*Math.sin(t*5),0.08*sc+0.07*Math.cos(t*5),zS-0.42];e=[0.16,0.26*sc,zS-0.32]}else{wr=[0.38,-0.12*sc,zS-0.45];e=[0.12,-0.26*sc,zS-0.35]}break;
   case 'eat':if(R){const k=0.5+0.5*Math.sin(t*1.3+a.phase),u=k*k*(3-2*k);wr=[lerp(0.46,0.2,u),lerp(0.1,0.04,u)*sc,lerp(1.02,zS+0.06,u)];e=[0.18,0.27*sc,lerp(0.95,zS-0.2,u)]}else{wr=[0.46,-0.14*sc,1.02];e=[0.16,-0.27*sc,0.92]}break;
   case 'phone':if(R){wr=[0.14,0.15*sc,zS+0.1];e=[0.06,0.26*sc,zS-0.17]}break;
   case 'play':{const j=Math.sin(t*9+s*2)*0.02;wr=[0.4,s*0.13*sc,zS-0.34+j];e=[0.14,s*0.26*sc,zS-0.4];break}
   case 'sleep':wr=[0.2,s*0.08*sc,zS-0.4];e=[0.05,s*0.25*sc,zS-0.38];break;
  }
  if(R&&a.wave>0){const k2=Math.sin(t*9)*0.1;wr=[0.05,0.42*sc+k2,zS+0.1];e=[0.05,0.3*sc,zS-0.15]}
  else if(R&&talking&&(!a.pose||a.pose==='listen')){const k2=Math.sin(t*5)*0.07;wr=[0.34,0.3*sc,zS-0.22+k2+0.12];e=[0.14,0.3*sc,zS-0.32]}
  let Cc=a.arm[s];if(!Cc)Cc=a.arm[s]={e:e.slice(),w:wr.slice()};
  const k=Math.min(1,dtf*13);for(let i=0;i<3;i++){Cc.e[i]+=(e[i]-Cc.e[i])*k;Cc.w[i]+=(wr[i]-Cc.w[i])*k}
  arms[s]={sh:J(lean,s*0.215*sc+vs,zS-0.04),el:J(Cc.e[0],Cc.e[1],Cc.e[2]),wr:J(Cc.w[0],Cc.w[1],Cc.w[2]),d:rd(X+pr[0]*s*0.215,Y+pr[1]*s*0.215)};
 }
 const aw=0.105*sc*ZH,prop=a.prop;
 const drawArm=s=>{const A=arms[s];limb(g,A.sh,A.el,aw,col,1);limb(g,A.el,A.wr,aw*0.9,L.kind==='shirt'?shade(col,0.95):col,1);
  if(L.kind==='sweater'){g.strokeStyle=shade(col,0.7);g.lineWidth=aw*0.35;g.lineCap='butt';const dx=A.wr.x-A.el.x,dy=A.wr.y-A.el.y,l=Math.hypot(dx,dy)||1;g.beginPath();g.moveTo(A.wr.x-dx/l*aw*0.2,A.wr.y-dy/l*aw*0.2);g.lineTo(A.wr.x-dx/l*aw*0.5,A.wr.y-dy/l*aw*0.5);g.stroke()}
  g.fillStyle=skin;g.beginPath();g.arc(A.wr.x,A.wr.y,aw*0.58,0,7);g.fill();g.strokeStyle=ink;g.lineWidth=1;g.stroke();
  if(prop&&s>0&&prop!=='paper')drawProp(g,prop,A,t)};
 const farArms=[-1,1].filter(s=>arms[s].d<dT-0.02),nearArms=[-1,1].filter(s=>arms[s].d>=dT-0.02);
 farArms.forEach(drawArm);
 // --- torso ---
 {const lv=[[0,0.17,0.105],[0.2,0.15,0.098],[0.4,0.19,0.112],[0.52,0.215,0.105]];
  const C0=lv.map(q=>({c:J(lean*q[0]/0.52,vs,ph+q[0]*sc+(q[0]>0.3?breath*0.6:0)),hw:sc*Math.hypot(q[1]*sxv,q[2]*sxu)*(q[0]>0.3?1+breath*3:1)}));
  const pts=[];C0.forEach(q=>pts.push([q.c.x-q.hw,q.c.y]));
  pts.push([C0[3].c.x-C0[3].hw*0.4,C0[3].c.y-0.045*ZH],[C0[3].c.x+C0[3].hw*0.4,C0[3].c.y-0.045*ZH]);
  for(let i=3;i>=0;i--)pts.push([C0[i].c.x+C0[i].hw,C0[i].c.y]);
  pts.splice(4,0,[C0[3].c.x-C0[3].hw*0.9,C0[3].c.y-0.03*ZH]);pts.splice(7,0,[C0[3].c.x+C0[3].hw*0.9,C0[3].c.y-0.03*ZH]);
  const x0=C0[3].c.x-C0[3].hw*1.1,x1=C0[3].c.x+C0[3].hw*1.1,gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,shade(col,1.12));gr.addColorStop(0.55,shade(col,0.98));gr.addColorStop(1,shade(col,0.74));
  g.save();smooth(g,pts);g.fillStyle=gr;g.fill();g.strokeStyle=ink;g.lineWidth=1.1;g.stroke();g.clip();
  const mid=C0.map(q=>q.c),fv=tw>0.15;
  if(fv){
   const cx=(mid[1].x+mid[3].x)/2+lt*C0[3].hw*0.5;
   if((L.kind==='jacket'||L.kind==='blazer')&&L.inner){g.fillStyle=L.inner;g.beginPath();g.moveTo(cx-C0[3].hw*0.28,mid[3].y-0.02*ZH);g.lineTo(cx+C0[3].hw*0.28,mid[3].y-0.02*ZH);g.lineTo(cx+C0[1].hw*0.14,mid[0].y+0.04*ZH);g.lineTo(cx-C0[1].hw*0.14,mid[0].y+0.04*ZH);g.closePath();g.fill();
    g.strokeStyle=shade(col,0.7);g.lineWidth=1.4;g.beginPath();g.moveTo(cx-C0[3].hw*0.28,mid[3].y-0.02*ZH);g.lineTo(cx-C0[1].hw*0.14,mid[0].y+0.04*ZH);g.moveTo(cx+C0[3].hw*0.28,mid[3].y-0.02*ZH);g.lineTo(cx+C0[1].hw*0.14,mid[0].y+0.04*ZH);g.stroke()}
   if(L.kind==='shirt'){g.strokeStyle=shade(col,0.7);g.lineWidth=1.3;g.beginPath();g.moveTo(cx,mid[3].y);g.lineTo(cx,mid[0].y+0.05*ZH);g.stroke();g.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<4;i++){g.beginPath();g.arc(cx,mid[3].y+i*0.11*ZH+0.05*ZH,1.5,0,7);g.fill()}}
   if(L.kind==='hoodie'){g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=1.6;g.beginPath();g.moveTo(cx-C0[3].hw*0.18,mid[3].y+0.02*ZH);g.lineTo(cx-C0[3].hw*0.2,mid[2].y+0.1*ZH);g.moveTo(cx+C0[3].hw*0.18,mid[3].y+0.02*ZH);g.lineTo(cx+C0[3].hw*0.2,mid[2].y+0.1*ZH);g.stroke();
    g.fillStyle=shade(col,0.84);rr(cx-C0[2].hw*0.55,mid[1].y-0.02*ZH,C0[2].hw*1.1,0.1*ZH,4);g.fill()}
   if(L.kind==='sweater'){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x0,mid[0].y-0.02*ZH,x1-x0,0.06*ZH);g.strokeStyle='rgba(0,0,0,.1)';g.lineWidth=1;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(cx+i*C0[2].hw*0.22,mid[2].y);g.lineTo(cx+i*C0[2].hw*0.22,mid[0].y);g.stroke()}}
   // credencial con el color de la IA
   const bx=(mid[2].x+(lt>0?-1:1)*C0[2].hw*0.35),by=mid[2].y+0.02*ZH;
   g.strokeStyle='rgba(30,40,70,.5)';g.lineWidth=1.1;g.beginPath();g.moveTo(cx-C0[3].hw*0.2,mid[3].y);g.lineTo(bx,by);g.moveTo(cx+C0[3].hw*0.2,mid[3].y);g.lineTo(bx,by);g.stroke();
   g.fillStyle='#fff';rr(bx-0.05*ZH,by,0.1*ZH,0.13*ZH,2);g.fill();g.fillStyle=prov(a).color;g.fillRect(bx-0.05*ZH,by,0.1*ZH,0.04*ZH);g.fillStyle=prov(a).color;g.fillRect(bx-0.03*ZH,by+0.07*ZH,0.06*ZH,0.025*ZH)
  }
  g.restore();
  const nk=J(lean,vs,zS+0.02),nk2=J(lean+0.03,vs,zS+0.19);
  limb(g,nk,nk2,0.1*sc*ZH,shade(skin,0.92),0);
  if(L.kind==='sweater'||L.kind==='hoodie'){g.strokeStyle=shade(col,0.8);g.lineWidth=0.045*ZH;g.beginPath();g.ellipse(nk.x,nk.y-0.01*ZH,0.075*sc*ZH*(0.6+0.4*Math.abs(tw)),0.03*ZH,0,0,7);g.stroke()}
  if(tw>0.15&&(L.kind==='shirt'||L.kind==='blazer'||L.kind==='jacket')){g.fillStyle=L.kind==='shirt'?'#fff':(L.inner||'#fff');g.beginPath();g.moveTo(nk.x-0.07*ZH,nk.y-0.025*ZH);g.lineTo(nk.x,nk.y+0.07*ZH);g.lineTo(nk.x+0.07*ZH,nk.y-0.025*ZH);g.closePath();g.fill();g.strokeStyle=ink;g.lineWidth=1;g.stroke()}
 }
 // papel que sostiene con las dos manos
 if(prop==='paper'){const P1=arms[-1].wr,P2=arms[1].wr,mx=(P1.x+P2.x)/2,my=(P1.y+P2.y)/2-0.1*ZH,wd=Math.max(0.2*ZH,Math.abs(P1.x-P2.x)*1.4);
  g.save();g.translate(mx,my);g.rotate(Math.sin(t*0.8)*0.03);g.fillStyle='#f7f8fb';g.strokeStyle='rgba(15,20,40,.4)';g.lineWidth=1;rr(-wd/2,-0.13*ZH,wd,0.26*ZH,2);g.fill();g.stroke();
  g.strokeStyle='#9aa6bd';g.lineWidth=1.2;for(let i=0;i<4;i++){g.beginPath();g.moveTo(-wd*0.38,-0.08*ZH+i*0.055*ZH);g.lineTo(wd*(0.32-(i%2)*0.15),-0.08*ZH+i*0.055*ZH);g.stroke()}g.restore()}
 nearArms.forEach(drawArm);
 // cabeza: mira hacia donde indica la pose (hy = giro, dip = inclinación)
 const hc0=J(lean+0.03+(working&&sk>0.5?0.04:0)+a.dip*0.02,vs,zS+0.2*sc+0.03);
 const hc={x:hc0.x,y:hc0.y+a.dip*0.035*ZH};
 if(L.kind==='hoodie'&&tw<0.5){g.fillStyle=shade(col,0.85);g.beginPath();g.ellipse(hc.x,hc.y+0.1*ZH,0.12*ZH,0.1*ZH,0,0,7);g.fill()}
 const nod=working&&sk>0.5?Math.sin(t*3.1+a.phase)*0.012*ZH:0;
 drawHead(g,L,hc.x,hc.y+nod,0.105*sc*ZH,0.125*sc*ZH,hv.tw,hv.lt,{talk:talking});
 g.globalAlpha=1;
}

/* retrato para la barra y la tarjeta */
function drawPortrait(cn,a,size){const g=cn.getContext('2d'),d=window.devicePixelRatio||1;cn.width=size*d;cn.height=size*d;g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,size,size);
 const L=a.look,s=size;g.fillStyle=prov(a).color+'22';g.fillRect(0,0,s,s);
 g.fillStyle=L.top;g.beginPath();g.moveTo(s*0.12,s);g.quadraticCurveTo(s*0.16,s*0.72,s*0.5,s*0.7);g.quadraticCurveTo(s*0.84,s*0.72,s*0.88,s);g.closePath();g.fill();
 if(L.inner&&(L.kind==='jacket'||L.kind==='blazer')){g.fillStyle=L.inner;g.beginPath();g.moveTo(s*0.38,s*0.7);g.lineTo(s*0.62,s*0.7);g.lineTo(s*0.5,s*0.95);g.closePath();g.fill()}
 g.fillStyle=shade(L.skin,0.92);g.fillRect(s*0.44,s*0.58,s*0.12,s*0.16);
 drawHead(g,L,s*0.5,s*0.4,s*0.2,s*0.235,0.92,0.18,{});
 g.fillStyle='#fff';g.beginPath();g.arc(s*0.88,s*0.88,s*0.14,0,7);g.fill();g.fillStyle=prov(a).color;g.beginPath();g.arc(s*0.88,s*0.88,s*0.11,0,7);g.fill();
 g.fillStyle='#fff';g.font='800 '+Math.round(s*0.12)+'px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(prov(a).ini,s*0.88,s*0.89);g.textAlign='left';g.textBaseline='alphabetic'}
// (rr con contexto propio para el retrato)
function rrg(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}

/* ================= Etiquetas ================= */
function PAL(){return DARK?{bg:'rgba(22,28,48,.95)',fg:'#e7ecf8',mut:'#8f9bb8',ln:'rgba(140,165,255,.28)',track:'#2a3350',pill:'rgba(22,28,48,.88)',pfg:'#b9c4e2',bub:'#e9eefc',bfg:'#141a2c'}:{bg:'rgba(255,255,255,.96)',fg:'#1b2438',mut:'#6b7790',ln:'rgba(30,50,90,.12)',track:'#e3e9f3',pill:'rgba(255,255,255,.86)',pfg:'#51607e',bub:'#1f2a44',bfg:'#fff'}}
function wrapText(t,max){const w=t.split(/\s+/),L=[];let c='';for(const x of w){if((c+' '+x).trim().length>max){L.push(c);c=x}else c=(c+' '+x).trim()}if(c)L.push(c);return L.slice(0,4)}
let HITS=[];
function pill(x,y,text,opt){ctx.font=(opt.bold?'700 ':'')+(opt.size||12)+'px system-ui,sans-serif';const w=ctx.measureText(text).width+(opt.dot?26:18),h=opt.h||22;
 ctx.fillStyle=opt.bg;ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=6;rr(x-w/2,y-h/2,w,h,h/2);ctx.fill();ctx.shadowBlur=0;
 if(opt.dot){ctx.fillStyle=opt.dot;ctx.beginPath();ctx.arc(x-w/2+12,y,4.5,0,7);ctx.fill()}
 ctx.fillStyle=opt.fg;ctx.textBaseline='middle';ctx.fillText(text,x-w/2+(opt.dot?21:9),y+0.5);ctx.textBaseline='alphabetic';return w}
function chipPath(x,y,txt,col){ctx.font='800 9.5px system-ui,sans-serif';const w=ctx.measureText(txt).width+9;ctx.fillStyle=col;rr(x,y,w,15,5);ctx.fill();ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.fillText(txt,x+4.5,y+8);ctx.textBaseline='alphabetic';return w}
function drawLabel(a){
 if(a.alpha<0.06)return;
 const P=PAL(),seated=a.sitK>0.5;const hp=proj(a.x,a.y,0);const top=proj(a.x,a.y,seated?1.82:2.05).y-6;const col=prov(a).color;
 const full=a.state==='working'||a.state==='asking'||a.state==='blocked';
 let x,y,w,bh;const sel=selected===a;
 ctx.globalAlpha=a.alpha;
 if(!full){
  ctx.font='700 12.5px system-ui,sans-serif';const nw=ctx.measureText(a.name).width;w=nw+48;bh=24;x=hp.x-w/2;y=top-bh;
  ctx.fillStyle=P.bg;ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=6;rr(x,y,w,bh,12);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle=sel?'#5b8cff':P.ln;ctx.lineWidth=sel?2:1;ctx.stroke();
  chipPath(x+6,y+4.5,prov(a).ini,col);ctx.fillStyle=P.fg;ctx.font='700 12.5px system-ui,sans-serif';ctx.textBaseline='middle';ctx.fillText(a.name,x+34,y+12.5);ctx.textBaseline='alphabetic';
 }else{
  ctx.font='700 12.5px system-ui,sans-serif';const w1=ctx.measureText(a.name).width;
  const sub=a.state==='working'?`${a.role} · ${isQA(a)?'verificando':'trabajando'}`:a.state==='asking'?`${a.role} · te pregunta`:`${a.role} · descansando`;
  ctx.font='11px system-ui,sans-serif';const w2=ctx.measureText(sub).width;const working=a.state==='working';
  w=Math.max(w1+48,w2+20)+(working?36:0);bh=working?46:38;x=hp.x-w/2;y=top-bh;
  ctx.fillStyle=P.bg;ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=8;rr(x,y,w,bh,11);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle=sel?'#5b8cff':P.ln;ctx.lineWidth=sel?2:1;ctx.stroke();
  chipPath(x+7,y+5,prov(a).ini,col);ctx.fillStyle=P.fg;ctx.font='700 12.5px system-ui,sans-serif';ctx.fillText(a.name,x+35,y+17);
  ctx.fillStyle=P.mut;ctx.font='11px system-ui,sans-serif';ctx.fillText(sub,x+9,y+31);
  if(working){ctx.fillStyle='#ffd24d';ctx.beginPath();ctx.arc(x+w-19,y+17,12,0,7);ctx.fill();ctx.fillStyle='#4a3500';ctx.font='700 11px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(String(Math.round(a.progress*100)),x+w-19,y+21);ctx.textAlign='left';
   ctx.fillStyle=P.track;rr(x+9,y+38,w-18,4,2);ctx.fill();ctx.fillStyle=col;rr(x+9,y+38,Math.max(4,(w-18)*a.progress),4,2);ctx.fill()}
 }
 ctx.beginPath();ctx.moveTo(hp.x-5,y+bh);ctx.lineTo(hp.x+5,y+bh);ctx.lineTo(hp.x,y+bh+6);ctx.fillStyle=P.bg;ctx.fill();
 const btxt=a.bubble||a.thought;
 if(btxt){const isT=!a.bubble;ctx.font=(isT?'15px':'12px')+' system-ui,sans-serif';const Lh=isT?[btxt]:wrapText(btxt,34);const bw=Math.max(...Lh.map(t=>ctx.measureText(t).width))+18,bhh=Lh.length*(isT?20:15)+12;const bx=hp.x-bw/2,by=Math.max(y-bhh-10,52);
  ctx.fillStyle=P.bub;ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=8;rr(bx,by,bw,bhh,isT?14:10);ctx.fill();ctx.shadowBlur=0;
  ctx.beginPath();ctx.moveTo(hp.x-5,by+bhh);ctx.lineTo(hp.x+5,by+bhh);ctx.lineTo(hp.x,by+bhh+6);ctx.fill();
  ctx.fillStyle=P.bfg;Lh.forEach((t,i)=>ctx.fillText(t,bx+9,by+(isT?20:18)+i*15))}
 ctx.globalAlpha=1;
 HITS.push({a,x,y,w,h:bh});
 const bt=proj(a.x,a.y,seated?1.7:1.9).y,bw2=0.34*ZH;HITS.push({a,x:hp.x-bw2,y:bt,w:bw2*2,h:hp.y-bt+6});
}
function pool(x,y,r,col,al){const p=proj(x,y,0.02);ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,0.5);const R=TW*r*1.4,rgb=hexRGB(col),g=ctx.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,`rgba(${rgb},${al})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R,0,7);ctx.fill();ctx.restore()}
function drawFloor(){
 for(const f of FLOOR){const w=f.w||1,d=f.d||1,z=f.rug?0.02:0;poly([proj(f.x,f.y,z),proj(f.x+w,f.y,z),proj(f.x+w,f.y+d,z),proj(f.x,f.y+d,z)],f.c,f.rug?'rgba(0,0,0,.12)':null)}
 ctx.fillStyle=DARK?'rgba(0,0,0,.3)':'rgba(25,40,80,.14)';
 for(const b of SHAD){
  if(b.circle){const p=proj(b.x+0.3,b.y+0.3,0);ctx.beginPath();ctx.ellipse(p.x,p.y,TW*b.r,TH*b.r*1.05,0,0,7);ctx.fill();continue}
  if(b.z>0.1&&b.z<0.6&&b.h<0.3)continue;
  const zz=b.z>0.5?0.01:Math.max(0.01,b.z);const o=0.16;
  poly([proj(b.x+o,b.y+o,zz),proj(b.x+b.w+o,b.y+o,zz),proj(b.x+b.w+o,b.y+b.d+o,zz),proj(b.x+o,b.y+b.d+o,zz)],DARK?'#000000':'rgba(25,40,80,.13)',null)}
 if(DARK){ctx.save();ctx.globalCompositeOperation='lighter';
  for(const l of LIGHTS)if(!l.w||l.w())pool(l.x,l.y,l.r,l.col,l.a);
  const tt=performance.now()/1000;
  for(const a of agents){if(a.state==='working'&&a.sitK>0.5)pool(a.x,a.y+0.9,1.7,prov(a).color,0.16+0.05*Math.sin(tt*3+a.phase))}
  if(KIT.stove>0)pool(32.8,9.3,1.8,'#ff9a50',0.24+0.06*Math.sin(tt*5));
  ctx.restore()}
 for(const a of actors()){if(selected===a){const p=proj(a.x,a.y,0);ctx.strokeStyle='#5b8cff';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(p.x,p.y,TW*0.7,TH*0.7,0,0,7);ctx.stroke()}}
 if(selRoom){const r=roomRect(selRoom);if(r){const q=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].map(p=>proj(p[0],p[1],0.05));
  ctx.strokeStyle='#5b8cff';ctx.lineWidth=3;ctx.setLineDash([9,7]);ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();ctx.setLineDash([])}}
}
const angW=d=>{d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return d};
function frame(now){
 const dt=Math.min(0.05,(now-(frame.l||now))/1000);frame.l=now;
 if(spin>0){const d=dt*Math.PI*2/6;rot+=d;spin-=d;if(spin<=0){spin=0}}
 if(rotTarget!=null){const d=angW(rotTarget-rot);rot+=d*Math.min(1,dt*3);if(Math.abs(d)<0.003)rotTarget=null}
 zoom+=(zoomT-zoom)*Math.min(1,dt*4);
 if(selected){camTx=selected.x;camTy=selected.y}
 camX+=(camTx-camX)*Math.min(1,dt*5);camY+=(camTy-camY)*Math.min(1,dt*5);
 ax+=(axT-ax)*Math.min(1,dt*4);ay+=(ayT-ay)*Math.min(1,dt*4);
 const AC=actors();
 for(const a of AC){
  a._dt=dt;
  // sentarse / pararse de forma continua
  const skT=a.seated?1:0;a.sitK+=Math.sign(skT-a.sitK)*Math.min(Math.abs(skT-a.sitK),dt*3.4);
  let moving=false;
  if(a.path.length){
   const t=a.path[0],dx=t[0]-a.x,dy=t[1]-a.y,d=Math.hypot(dx,dy),last=a.path.length===1;
   const gate=Math.max(0,1-a.sitK*1.25);
   if(!last&&d<0.3){a.path.shift()}
   else{
    const vmax=(a.hurry?5.2:3.7)*gate,vt=last?Math.min(vmax,0.55+d*2.8):vmax;
    a.v+=(vt-a.v)*Math.min(1,dt*(vt>a.v?5:10));
    const st=a.v*dt;
    if(d>0.01&&gate>0.3)a.face=[dx/d,dy/d];
    if(gate>0&&d<=Math.max(st,0.004)){a.x=t[0];a.y=t[1];a.path.shift();if(!a.path.length){a.seated=a.sitAfter;if(a.faceAfter)a.face=a.faceAfter;a.v=0;if(a.pr){const r=a.pr;a.pr=null;r()}}}
    else if(gate>0&&d>0){a.x+=dx/d*st;a.y+=dy/d*st}
    moving=true}
  }else a.v*=Math.max(0,1-dt*10);
  a.walkPh+=a.v*dt*2.5;
  const tg=Math.atan2(a.face[1],a.face[0]);if(a.ang==null)a.ang=tg;a.ang+=angW(tg-a.ang)*Math.min(1,dt*(a.v>0.3?7:9));
  // hacia dónde mira la cabeza según lo que está haciendo
  let hyT=0,dipT=0;const pz=a.pose;
  if(pz==='think'){hyT=Math.sin(a.phase)>0?0.55:-0.55;dipT=-0.35}else if(pz==='stretch')dipT=-0.6;else if(pz==='read')dipT=0.5;else if(pz==='stir')dipT=0.35;
  else if(pz==='write'){hyT=0.08*Math.sin(now/900);dipT=0.05}else if(pz==='sleep'||(a.state==='blocked'&&a.sitK>0.5))dipT=0.85;else if(pz==='eat')dipT=0.2;
  else if(pz==='listen')dipT=0.12+0.2*Math.sin(now/420+a.phase);else if(pz==='phone')hyT=0.3;
  else if(a.state==='working'&&a.sitK>0.5)dipT=0.25;
  else if(!moving&&!pz){if(now>a.glanceAt){a.hyG=Math.random()<0.45?0:(Math.random()-0.5)*1.6;a.glanceAt=now+1800+Math.random()*4500}hyT=a.hyG}
  a.hy+=(hyT-a.hy)*Math.min(1,dt*5);a.dip+=(dipT-a.dip)*Math.min(1,dt*6);
  a.alpha+=((a.alphaT==null?1:a.alphaT)-a.alpha)*Math.min(1,dt*3);
  if(a.state==='working')a.progress+=(0.92-a.progress)*dt*0.35;
  if(a.wave>0)a.wave-=dt;
 }
 setCam();ctx.clearRect(0,0,W,H);
 drawFloor();
 const Lst=[];for(const o of OBJ)Lst.push({k:o.k(),f:o.f});
 for(const a of AC)if(a.alpha>0.02)Lst.push({k:rd(a.x,a.y)+(a.sitK>0.5?0.3:0.12),f:()=>drawChar(a,now)});
 Lst.sort((p,q)=>p.k-q.k);Lst.forEach(o=>o.f());
 const P=PAL();HITS=[];
 for(const pl of PILLS){const p=proj(pl.x,pl.y,pl.z);if(pl.floor&&zoom>2.6)continue;const txt=typeof pl.t==='function'?pl.t():pl.t;
  const w=pill(p.x,p.y,txt,{bold:pl.big,size:pl.big?11.5:11,bg:P.pill,fg:P.pfg,h:20,dot:pl.col});if(pl.room)HITS.push({room:pl.room,x:p.x-w/2,y:p.y-10,w,h:20})}
 AC.forEach(drawLabel);
 requestAnimationFrame(frame);
}

/* ================= Interacción del canvas ================= */
function screenToWorld(sx,sy,z){const a=(sx-OX)/TW,b=(sy+(z||0)*ZH-OY)/TH,rx=(a+b)/2,ry=(b-a)/2;return {x:camX+rx*C+ry*S,y:camY-rx*S+ry*C}}
function roomAtScreen(sx,sy){for(const z of [0,1.2]){const p=screenToWorld(sx,sy,z);for(const k of ROOM_KEYS){const r=roomRect(k);if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)return k}}return null}
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,m:0,pan:e.shiftKey||e.button===2||e.button===1};cv.setPointerCapture(e.pointerId)});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.m+=Math.abs(dx)+Math.abs(dy);
 if(drag.pan){if(selected)return;const rx=(dx/TW+dy/TH)/2,ry=(dy/TH-dx/TW)/2;camTx-=rx*C+ry*S;camTy-=-rx*S+ry*C;camX=camTx;camY=camTy}
 else{rotTarget=null;rot+=dx*0.008}});
cv.addEventListener('pointerup',e=>{const m=drag&&drag.m;drag=null;if(m>4)return;
 const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 const hit=HITS.slice().reverse().find(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);
 if(hit){if(hit.room)selectRoom(hit.room);else if(hit.a.isMe)selectRoom('o:jefe');else selectAgent(hit.a);return}
 const rk=roomAtScreen(x,y);
 if(rk){if(rk!==selRoom||selected)selectRoom(rk)}else if(selected||selRoom)deselect()});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomT=Math.max(0.55,Math.min((selected||selRoom)?7:5,zoomT*(e.deltaY<0?1.12:0.89)))},{passive:false});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(selected||selRoom))deselect()});
