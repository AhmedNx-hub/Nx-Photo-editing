// ℕ𝕩-editor — اختبار لقطات الشاشة (مقارنة بصرية)
// الاستخدام:
//   NODE_PATH=$(npm root -g) node tests/visual.js --update   ← يحفظ اللقطات المرجعية (baseline) أول مرة أو بعد تغيير مقصود
//   NODE_PATH=$(npm root -g) node tests/visual.js            ← يقارن بالمرجع ويفشل لو تغيّر أكثر من 0.5% من البكسلات
// تُحفظ لقطات الفروقات في tests/diff/ عند الفشل.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'..','index.html'),BASE=path.join(__dirname,'baseline'),DIFF=path.join(__dirname,'diff'),UPD=process.argv.includes('--update'),LIM=.005;
fs.mkdirSync(BASE,{recursive:true});fs.mkdirSync(DIFF,{recursive:true});
(async()=>{const b=await chromium.launch();const pg=await(await b.newContext({viewport:{width:420,height:860},deviceScaleFactor:1,hasTouch:true})).newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.addInitScript(()=>{try{localStorage.setItem('nx',JSON.stringify({tour:1,hints:false,nq:1}))}catch(e){}});
await pg.goto(APP);await pg.waitForTimeout(700);
const png=await pg.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=400;const g=c.getContext('2d');for(let y=0;y<400;y+=25)for(let x=0;x<600;x+=25){g.fillStyle=`hsl(${(x*.6+y)%360},65%,${35+x/600*35}%)`;g.fillRect(x,y,25,25)}return c.toDataURL().split(',')[1]});
const img=path.join(require('os').tmpdir(),'nx-vis.png');fs.writeFileSync(img,Buffer.from(png,'base64'));
const quiet=()=>pg.addStyleTag({content:'#toast,#hint,#dn,#xy,#sv,.busy{visibility:hidden!important}*{animation:none!important;transition:none!important}'});
const shots=[];const snap=async n=>{await pg.waitForTimeout(350);const f=path.join(UPD?BASE:DIFF,n+'.png');await pg.screenshot({path:f});shots.push(n)};
await quiet();await snap('01-home');
await pg.setInputFiles('#fOpen',[img]);await pg.waitForTimeout(900);await pg.evaluate(()=>{const q=document.querySelector('#qe');if(q)q.hidden=true});await snap('02-editor');
await pg.evaluate(()=>{setTool('text')});await pg.evaluate(()=>{const t={s:'Nx',x:200,y:150,fs:80,font:'sans-serif',bold:true,ital:false,outl:false,shad:false,rtl:false,rot:0,col:'#fff',bg:'#000'};const l=nl('نص');l.t=t;reText(l);L.push(l);act=L.length-1;drawOv()});await snap('03-text-selected');
await pg.evaluate(()=>{setTool('move');act=0;pqStart()});await pg.evaluate(()=>{PQ[0]=[W*.25,H*.15];PQ[1]=[W*.78,H*.2];G={pqa:0};pqPreview()});await pg.waitForTimeout(300);await snap('04-perspective');await pg.evaluate(()=>pqEnd());
await pg.evaluate(()=>{S.sm=1;applyA11y();delete document.body.dataset.sub});await snap('05-simple-mode');await pg.evaluate(()=>{S.sm=0;applyA11y()});
await pg.evaluate(()=>{openSettings()});await snap('06-settings');
await b.close();
if(UPD){console.log('تم حفظ '+shots.length+' لقطة مرجعية في tests/baseline');return}
// المقارنة
const b2=await chromium.launch();const cp=await(await b2.newContext()).newPage();let bad=0;
for(const n of shots){const a=path.join(BASE,n+'.png'),d=path.join(DIFF,n+'.png');if(!fs.existsSync(a)){console.log('  ? '+n+' لا يوجد مرجع (شغّل --update)');bad++;continue}
 const r=await cp.evaluate(async([x,y])=>{const L=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u}),A=await L(x),B=await L(y);if(A.width!=B.width||A.height!=B.height)return{size:1};const c=document.createElement('canvas');c.width=A.width;c.height=A.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(A,0,0);const p=g.getImageData(0,0,c.width,c.height).data;g.drawImage(B,0,0);const q=g.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<p.length;i+=4)if(Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2])>48)n++;return{frac:n/(p.length/4)}},['data:image/png;base64,'+fs.readFileSync(a).toString('base64'),'data:image/png;base64,'+fs.readFileSync(d).toString('base64')]);
 const ok=!r.size&&r.frac<=LIM;console.log((ok?'  ✓ ':'  ✗ ')+n+(r.size?' (اختلف المقاس)':' فرق '+(r.frac*100).toFixed(2)+'%'));if(ok)fs.unlinkSync(d);else bad++}
if(errs.length){console.log('  ✗ أخطاء JS',errs);bad++}
await b2.close();console.log(bad?`\nفشل: ${bad}`:'\nكل اللقطات مطابقة');process.exit(bad?1:0)})();
