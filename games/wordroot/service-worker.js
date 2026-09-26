const CACHE='wordroot-shell-v2';
const PRECACHE=[
  './',
  './index.html',
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
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(
    caches.match(event.request).then(cached=>{
      const network=fetch(event.request).then(response=>{
        if(response&&response.ok&&new URL(event.request.url).origin===self.location.origin){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }).catch(()=>cached||caches.match('./index.html'));
      return cached||network;
    })
  );
});
