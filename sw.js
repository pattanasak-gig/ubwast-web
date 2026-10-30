// UBWast service worker (DEC-132 C1) — ทำให้ติดตั้งเป็นแอปบนมือถือได้ และเปิดเร็วขึ้น
//   หน้าเว็บ: ดึงจากเน็ตก่อนเสมอ (ได้รุ่นล่าสุดทุกครั้งหลังขึ้นเว็บใหม่) · ไม่มีเน็ตจึงใช้ฉบับที่จำไว้
//   ไลบรารีจาก CDN และไอคอน: ใช้ฉบับที่จำไว้ก่อน แล้วอัปเดตเบื้องหลัง
//   ไม่แตะคำขอข้อมูล (Supabase · ห้องเครื่อง · แผนที่ · เส้นทาง) — ข้อมูลไปที่เซิร์ฟเวอร์ตามปกติ
const V = 'ubwast-v2', SHELL = ['./', './manifest.webmanifest', './pwa/icon-192.png'];
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url), own = u.origin === location.origin;
  if (r.mode === 'navigate') {
    // cache: 'no-cache' = ถามเซิร์ฟเวอร์ทุกครั้ง (ได้ 304 ถ้าไม่เปลี่ยน) ไม่ใช้แคช HTTP ของเบราว์เซอร์ → เปิดแอปได้รุ่นล่าสุดทันทีหลังขึ้นเว็บ
    e.respondWith(fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put('./', cp)); } return res; }).catch(() => caches.match('./')));
    return;
  }
  if (CDN.test(r.url) || (own && /\/(pwa\/|manifest\.webmanifest$)/.test(u.pathname))) {
    e.respondWith(caches.match(r).then(hit => { const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => hit); return hit || net; }));
  }
});
