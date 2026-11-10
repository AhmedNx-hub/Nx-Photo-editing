// Service Worker — اسم الكاش يُشتق من رقم الإصدار المركزي (NX_VER في index.html) عبر ?v=
const V=new URL(self.location.href).searchParams.get('v')||'dev',C='nx-'+V;
const CORE=['./','index.html'],OPT=['manifest.webmanifest','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(C);
  // الملفات الأساسية إلزامية: لو فشل أحدها يفشل التثبيت بدل تثبيت نسخة ناقصة (والمتصفح يعيد المحاولة لاحقاً)
  await Promise.all(CORE.map(u=>c.add(u)));
  // الملفات الاختيارية: فشلها لا يمنع التثبيت
  await Promise.allSettled(OPT.map(u=>c.add(u)));
  self.skipWaiting()})())});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('nx-')&&x!=C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!='GET'||u.origin!==self.location.origin)return;               // لا نخزّن إلا موارد التطبيق نفسه
  if(r.mode=='navigate'){                                                    // الصفحة: الشبكة أولاً ليصل التحديث، والكاش عند انقطاع الاتصال
    e.respondWith(fetch(r).then(n=>{const k=n.clone();caches.open(C).then(c=>c.put('index.html',k));return n}).catch(()=>caches.match('index.html').then(m=>m||caches.match('./'))));return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(n=>{if(n.ok){const k=n.clone();caches.open(C).then(c=>c.put(r,k))}return n})))});
