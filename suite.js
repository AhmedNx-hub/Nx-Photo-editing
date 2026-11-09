// ℕ𝕩-editor — حزمة الاختبارات الآلية الثابتة
// التشغيل:  NODE_PATH=$(npm root -g) node tests/suite.js   (يتطلب playwright + chromium)
// تُنشئ صورة اختبار بنفسها، وتخرج بكود 1 عند أي فشل.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),os=require('os');
const APP='file://'+path.resolve(__dirname,'..','index.html'),TMP=fs.mkdtempSync(path.join(os.tmpdir(),'nxs-'));
let pass=0,fail=0;const ok=(n,c,x)=>{c?pass++:fail++;console.log((c?'  ✓ ':'  ✗ ')+n+(c?'':'  ← '+JSON.stringify(x)))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:420,height:860},hasTouch:true,acceptDownloads:true});const pg=await ctx.newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()=='error')errs.push(m.text())});
await pg.addInitScript(()=>{try{localStorage.setItem('nx',JSON.stringify({tour:1,hints:false}))}catch(e){}});
// صورة اختبار
await pg.goto('about:blank');const png=await pg.evaluate(()=>{const c=document.createElement('canvas');c.width=400;c.height=260;const g=c.getContext('2d');for(let y=0;y<260;y+=20)for(let x=0;x<400;x+=20){g.fillStyle=`hsl(${(x+y)%360},70%,${30+(x/400)*40}%)`;g.fillRect(x,y,20,20)}return c.toDataURL().split(',')[1]});
const img=path.join(TMP,'t.png');fs.writeFileSync(img,Buffer.from(png,'base64'));
await pg.goto(APP);await pg.waitForTimeout(800);
console.log('الإقلاع');ok('boot flag',await pg.evaluate(()=>window.__nxOK===1));
await pg.setInputFiles('#fOpen',[img]);await pg.waitForTimeout(900);ok('فتح صورة',await pg.evaluate(()=>W==400&&H==260));
console.log('تراجع/إعادة');await pg.evaluate(()=>{L[0].x.fillStyle='#f00';L[0].x.fillRect(0,0,50,50);push('t')});const n1=await pg.evaluate(()=>hist.length);await pg.evaluate(()=>undo());ok('undo',await pg.evaluate(()=>hist.length)==n1-1);await pg.evaluate(()=>redo());ok('redo',await pg.evaluate(()=>hist.length)==n1);
console.log('النص: تحريك/تكبير/تدوير/تعديل');
await pg.evaluate(()=>setTool('text'));await pg.waitForTimeout(200);
const box=()=>pg.evaluate(()=>{const r=ov.getBoundingClientRect();return[r.x,r.y,r.width,r.height,W,H]});let[x,y,w,h,W,H]=await box();const P=(a,c)=>[x+a/W*w,y+c/H*h];
await pg.mouse.click(...P(W*.3,H*.4));await pg.waitForTimeout(400);await pg.fill('#f_s','اختبار');await pg.click('#ok');await pg.waitForTimeout(400);
const T=()=>pg.evaluate(()=>{const t=L[act].t;return t&&{x:t.x,y:t.y,fs:t.fs,rot:t.rot||0,w:t.w,h:t.h,rtl:t.rtl}});const vis=()=>pg.evaluate(()=>{const e=document.querySelector('#f_s');return !!e&&e.offsetParent!==null});
let t0=await T();ok('إنشاء نص',!!t0);
let m=P(t0.x+(t0.rtl?-t0.w/2:t0.w/2),t0.y+t0.h/2);await pg.mouse.move(...m);await pg.mouse.down();await pg.mouse.move(m[0]+40,m[1]+30,{steps:6});await pg.mouse.up();await pg.waitForTimeout(250);
let t1=await T();ok('السحب يحرّك النص',t1.x>t0.x+20&&t1.y>t0.y+10,[t0,t1]);ok('السحب لا يفتح نافذة التعديل',!(await vis()));
let hs=await pg.evaluate(()=>txHandles(L[act].t));let s=P(...hs.sz);await pg.mouse.move(...s);await pg.mouse.down();await pg.mouse.move(s[0]+60,s[1]+40,{steps:6});await pg.mouse.up();await pg.waitForTimeout(250);
let t2=await T();ok('المقبض يكبّر النص',t2.fs>t1.fs*1.5,[t1.fs,t2.fs]);ok('التكبير لا يفتح التعديل',!(await vis()));
hs=await pg.evaluate(()=>txHandles(L[act].t));let r=P(...hs.rt);await pg.mouse.move(...r);await pg.mouse.down();await pg.mouse.move(r[0]+70,r[1]+10,{steps:6});await pg.mouse.up();await pg.waitForTimeout(250);
let t3=await T();ok('المقبض العلوي يدوّر',Math.abs(t3.rot)>5,t3.rot);
const c=await pg.evaluate(()=>{const t=L[act].t;return txG(t,(t.rtl?-t.w:0)+t.w/2,t.h/2)});await pg.mouse.click(...P(...c));await pg.waitForTimeout(400);ok('اللمسة السريعة تفتح التعديل',await vis());await pg.click('#ok').catch(()=>{});await pg.waitForTimeout(300);
console.log('الضبط التلقائي حسب النوع');
ok('تصنيف الأنواع',await pg.evaluate(()=>{const mk2=f=>{const d=new Uint8ClampedArray(96*60*4);for(let i=0;i<d.length;i+=4){const[r,g,b]=f(i/4);d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255}return d};return classify(mk2(()=>[20,25,40])).k=='night'&&classify(mk2(()=>[210,150,120])).k=='portrait'&&classify(mk2(i=>i<2880?[90,150,230]:[60,150,60])).k=='landscape'&&classify(mk2(()=>[220,120,40])).k=='food'&&classify(mk2(()=>[140,140,140])).k=='gen'}));
await pg.evaluate(()=>applyLook('تلقائي'));await pg.waitForTimeout(300);ok('تلقائي يضيف طبقة فلتر',await pg.evaluate(()=>!!lookLay()));
console.log('ماسكات الإضاءة');
await pg.evaluate(()=>{A.local()});await pg.waitForTimeout(300);await pg.selectOption('#f_au','lsh');await pg.click('#ok');await pg.waitForTimeout(600);ok('قناع الظلال',await pg.evaluate(()=>{const l=L[act];return l.type=='adj'&&!!l.msk&&/الظلال/.test(l.name)}));
await pg.evaluate(()=>{delete document.body.dataset.sub});
console.log('الوضع المبسّط');await pg.evaluate(()=>{S.sm=1;applyA11y()});const vb=await pg.evaluate(()=>[...document.querySelectorAll('#bnav button')].filter(b=>b.offsetParent).map(b=>b.dataset.bn));ok('يظهر فلاتر/قص/نص فقط',vb.join()=='look,crop,text',vb);await pg.evaluate(()=>{S.sm=0;applyA11y()});
console.log('المنظور');await pg.evaluate(()=>{act=0;pqStart()});await pg.evaluate(()=>{PQ[0]=[W*.3,H*.2];PQ[1]=[W*.7,H*.2]});const hb=await pg.evaluate(()=>hist.length);await pg.evaluate(()=>pqApply());ok('تطبيق المنظور يضيف خطوة',await pg.evaluate(()=>hist.length)==hb+1);ok('خروج من وضع المنظور',await pg.evaluate(()=>PQ===null));await pg.evaluate(()=>undo());
console.log('الاستنساخ');await pg.evaluate(()=>{act=0;setTool('clone');S.size=40;S.hard=30;S.op=100;cloneSrc=[W*.2,H*.2]});
[x,y,w,h,W,H]=await box();const before=await pg.evaluate(()=>[...L[0].ix.getImageData(Math.round(W*.6),Math.round(H*.6),1,1).data]);await pg.mouse.move(...P(W*.6,H*.6));await pg.mouse.down();await pg.mouse.move(...P(W*.65,H*.6),{steps:5});await pg.mouse.up();await pg.waitForTimeout(250);
ok('الاستنساخ يغيّر البكسلات',(await pg.evaluate(()=>[...L[0].ix.getImageData(Math.round(W*.6),Math.round(H*.6),1,1).data])).join()!=before.join());
console.log('الإطارات (Mockups)');for(const t of['phone','laptop','browser']){await pg.evaluate(()=>{A.mock()});await pg.waitForTimeout(300);await pg.selectOption('#f_t',t);await pg.click('#ok');await pg.waitForTimeout(800);ok('إطار '+t,await pg.evaluate(()=>W>400&&H>260))}
console.log('الجلسة: تصدير واستيراد');
const[d]=await Promise.all([pg.waitForEvent('download'),pg.evaluate(()=>sesExp())]);const sf=path.join(TMP,'s.nxs');await d.saveAs(sf);const dn=await pg.evaluate(()=>docs.length);ok('ملف الجلسة',fs.statSync(sf).size>1000);
const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push('p2 '+e.message));await p2.goto(APP);await p2.waitForTimeout(700);await p2.evaluate(async b64=>{const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);await sesImp(new File([u],'s.nxs'))},fs.readFileSync(sf).toString('base64'));await p2.waitForTimeout(1500);ok('استيراد الجلسة يعيد كل المستندات',await p2.evaluate(()=>docs.length)==dn,[dn]);await p2.close();
console.log('الدفعة الذكية بالمعاينة');
await pg.evaluate(()=>{applyLook('تلقائي')});await pg.waitForTimeout(300);const[fc]=await Promise.all([pg.waitForEvent('filechooser'),pg.evaluate(()=>A.fbatch())]);await fc.setFiles([img,img]);await pg.waitForTimeout(900);ok('نافذة المعاينة',await pg.evaluate(()=>!!document.querySelector('#bdlg')));
const px=()=>pg.evaluate(()=>[...document.querySelector('#bpv').getContext('2d').getImageData(50,50,1,1).data].join());const a100=await px();await pg.fill('#bin','0');await pg.dispatchEvent('#bin','input');await pg.waitForTimeout(200);const a0=await px();ok('الشدة 0 = الأصل والشدة 100 مختلفة',a0!=a100);
const[dz]=await Promise.all([pg.waitForEvent('download'),pg.click('#bgo')]);await dz.saveAs(path.join(TMP,'b.zip'));ok('تصدير الدفعة',fs.statSync(path.join(TMP,'b.zip')).size>500);
console.log('مشاركة ضبط برابط/QR');
await pg.evaluate(()=>{const q=nl('x');q.type='adj';q.params={...D0,br:20,ct:15};q.name='ضبط: اختبار';L.push(q);act=L.length-1;push()});await pg.evaluate(()=>A.shpre());await pg.waitForTimeout(400);const link=await pg.inputValue('#qrl');ok('كود الضبط',/^nx[01]\./.test(link),link.slice(0,20));
ok('فك الكود يعيد القيم',await pg.evaluate(async l=>{const o=await unpackPre(l);return o&&o.p.br==20&&o.p.ct==15},link));
console.log('أخطاء الصفحة');ok('لا أخطاء JS',errs.length==0,errs);
await b.close();console.log(`\nالنتيجة: ${pass} نجح، ${fail} فشل`);process.exit(fail?1:0)})();
