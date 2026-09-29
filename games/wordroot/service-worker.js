const CACHE='wordroot-shell-v3';
const PRECACHE=[
  './manifest.webmanifest',
  './assets/backgrounds/bg-home-01.webp',
  './assets/backgrounds/bg-pasture.webp',
  './assets/ui/logo-main.webp',
  './assets/icons/icon-48.png',
  './assets/icons/icon-72.png',
  './assets/icons/icon-96.png',
  './assets/icons/icon-144.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/sheep/sheep-basic.webp',
  './assets/sheep/sheep-read.webp',
  './assets/sheep/sheep-think.webp',
  './assets/sheep/sheep-recite.webp'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  const isNavigation=event.request.mode==='navigate'||event.request.destination==='document'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/wordroot/');

  if(isNavigation){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response&&response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
          }
          return response;
        })
        .catch(()=>caches.match('./index.html').then(r=>r||caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>{
      const network=fetch(event.request).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }).catch(()=>cached);
      return cached||network;
    })
  );
});
