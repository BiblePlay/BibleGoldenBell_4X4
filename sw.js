const CACHE='biblegoldenbell-4x4-shell-v28';
const SHELL=[
  './index.html',
  './church-remote-final.html',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(key=>key.startsWith('biblegoldenbell-4x4-shell-')&&key!==CACHE)
          .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return;

  const isHtmlNavigation = req.mode==='navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/church-remote-final.html');

  if(isHtmlNavigation){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(resp=>{
          if(resp&&resp.ok){
            const copy=resp.clone();
            caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
          }
          return resp;
        })
        .catch(async()=>{
          const exact=await caches.match(req);
          return exact || await caches.match('./church-remote-final.html');
        })
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(resp=>{
        if(resp&&resp.ok){
          const copy=resp.clone();
          caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
        }
        return resp;
      })
      .catch(()=>caches.match(req))
  );
});
