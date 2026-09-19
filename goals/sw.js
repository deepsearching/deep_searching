const CACHE="deep-searching-goals-170390c6dbfd";
const ASSETS=["./", "./app.js", "./domain/layout.js", "./domain/map.d.ts", "./domain/map.js", "./domain/tracking.js", "./domain/validation.js", "./fonts/LICENSE.txt", "./fonts/Regular.ttf", "./import/validateImport.js", "./index.html", "./migrations/index.js", "./migrations/v1.js", "./pdf/embedState.js", "./pdf/extractState.js", "./pdf/generatePdf.js", "./pdf/trackingPages.js", "./spike.html", "./storage/localStorage.js", "./style.css", "./ui/dom.js", "./ui/tracking.js", "./utils/dates.js", "./utils/ids.js", "./vendor/THIRD_PARTY.md", "./vendor/fontkit-LICENSE.txt", "./vendor/fontkit.umd.js", "./vendor/pako-LICENSE", "./vendor/pdf-lib-LICENSE.md", "./vendor/pdf-lib.js"];

self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('deep-searching-goals-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request,{ignoreSearch:true});return hit||fetch(event.request);}));
});
