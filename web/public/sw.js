// KC-4 — service worker cho Web Push nhắc việc + trang ngoại tuyến của app đã cài. Được đăng ký khi người dùng bấm "Bật
// nhắc" (lib/web-push-trinh-duyet.ts) hoặc khi mở từ biểu tượng app đã cài (components/khung/DangKyApp.tsx).
// KHÔNG cache trang, không chặn tài nguyên: chỉ lượt MỞ TRANG (navigate) đi mạng như thường; mất mạng thì trả trang
// "Bạn đang ngoại tuyến" dựng tại chỗ (thẻ hôm nay + mốc đã đánh dấu đọc từ máy này, nút Thử lại).
// Gói từ máy chủ (/api/cron/hang-ngay): { title, body, url, tag, hoi? } — url luôn là đường dẫn trong site.
// GĐ2 "Hôm qua việc X — đúng không?": `hoi` là mẫu câu (KB); ý định hôm qua đọc từ IndexedDB "hbt"/"kv"/"y_dinh" do trang
// Hôm nay ghi (lib/hom-qua.ts) — máy chủ không biết ý định. Bấm "Đúng / Chưa đúng" → phiếu kiểm chứng ẩn danh (mã ds.hn.*).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => null);
  await self.clients.claim();
})()));

// ---- Trang ngoại tuyến. Dữ liệu chỉ đọc ở trình duyệt (localStorage cùng site) và gắn bằng textContent — không chèn HTML.
const TRANG_NGOAI_TUYEN = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Ngoại tuyến · Hiểu Bản Thân</title><style>
:root{color-scheme:dark}body{margin:0;min-height:100vh;background:#0a0a17;color:#ecebf7;font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:30rem;margin:0 auto;padding:3rem 1rem}h1{font:500 1.9rem/1.2 Georgia,serif;margin:.4rem 0}.nho{color:#8a88ac;font-size:.85rem;letter-spacing:.12em;text-transform:uppercase}
.mo{color:#b3b1cf}.the{margin-top:1.5rem;border:1px solid rgba(233,196,106,.35);background:rgba(233,196,106,.06);border-radius:1rem;padding:1.1rem}
.so{font:500 2.6rem/1 Georgia,serif;color:#e9c46a}.soi{margin-top:.8rem;border-radius:.75rem;background:rgba(185,167,255,.08);padding:.8rem}
ul{padding-left:1.1rem;margin:.4rem 0 0}button{margin-top:1.8rem;min-height:44px;padding:.6rem 1.4rem;border:0;border-radius:999px;background:#e9c46a;color:#0a0a17;font-weight:600;font-size:1rem}
[hidden]{display:none}</style></head><body><main data-testid="ngoai-tuyen">
<p class="nho">Hiểu Bản Thân</p><h1>Bạn đang ngoại tuyến</h1>
<p class="mo">Có mạng lại là trang mở tiếp. Trong lúc chờ, đây là những gì đã lưu trên máy này:</p>
<section class="the" id="the" hidden><p class="nho">Hôm nay của bạn</p><p>Ngày cá nhân <span class="so" id="so"></span></p><p id="nghia"></p>
<div class="soi"><p class="nho">Câu hỏi tự soi</p><p id="tu_soi"></p></div></section>
<section class="the" id="nhac" hidden><p class="nho">Mốc bạn đã đánh dấu</p><ul id="ds"></ul></section>
<p class="mo" id="trong" hidden>Chưa có gì lưu trên máy này — mở Hôm nay khi có mạng là lần sau xem được ở đây.</p>
<button type="button" id="lai">Thử lại</button></main><script>
(function(){var h=new Date(Date.now()+7*36e5).toISOString().slice(0,10),co=false;
function j(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}}
var t=j("hbt.ngoai_tuyen.v1");if(t&&t.ngay===h&&typeof t.so==="number"){co=true;document.getElementById("so").textContent=String(t.so);
document.getElementById("nghia").textContent=String(t.nghia||"");document.getElementById("tu_soi").textContent=String(t.tu_soi||"");document.getElementById("the").hidden=false}
var n=j("hbt.nhac.v1");if(Array.isArray(n)){var ds=n.filter(function(x){return x&&typeof x.ngay==="string"&&x.ngay>=h&&typeof x.nhan==="string"}).sort(function(a,b){return a.ngay<b.ngay?-1:1}).slice(0,5);
if(ds.length){co=true;var ul=document.getElementById("ds");ds.forEach(function(x){var li=document.createElement("li");li.textContent=(x.ngay===h?"Hôm nay":x.ngay.split("-").reverse().join("/"))+" — "+x.nhan;ul.appendChild(li)});document.getElementById("nhac").hidden=false}}
if(!co)document.getElementById("trong").hidden=false;
function lai(){location.reload()}document.getElementById("lai").onclick=lai;addEventListener("online",lai);})();
</script></body></html>`;

self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate" || e.request.method !== "GET") return;   // mọi thứ khác: trình duyệt tự đi mạng
  e.respondWith((async () => {
    try {
      const truoc = await e.preloadResponse;
      return truoc || await fetch(e.request);
    } catch {
      return new Response(TRANG_NGOAI_TUYEN, { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
  })());
});

const trongSite = (u) => (typeof u === "string" && u.startsWith("/") && !u.startsWith("//") ? u : "/hom-nay");

// ---- IndexedDB tối thiểu (cùng tên kho với lib/hom-qua.ts)
function kho() {
  return new Promise((ok, loi) => {
    const r = indexedDB.open("hbt", 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("kv"); };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => loi(r.error);
  });
}
async function kv(che, f) {
  try {
    const db = await kho();
    return await new Promise((ok) => { const q = f(db.transaction("kv", che).objectStore("kv")); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); });
  } catch { return undefined; }
}
const homNayVn = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const homQuaVn = () => new Date(Date.now() + 7 * 3600000 - 86400000).toISOString().slice(0, 10);
const MA = /^[a-z_]{2,30}$/, NHIP = /^(thuan|trung_tinh|can_nhac)$/;

/** Ý định hôm qua còn chưa hỏi → { cau, ma_phieu } và đánh dấu đã hỏi (mỗi ý định chỉ hỏi một lần). */
async function hoiHomQua(hoi) {
  if (!hoi || typeof hoi.cau !== "string") return null;
  const y = await kv("readonly", (s) => s.get("y_dinh"));
  if (!y || y.ngay !== homQuaVn() || y.da_hoi || y.da_tra_loi || !Array.isArray(y.ds) || !y.ds.length) return null;
  const dau = y.ds[0];
  if (!MA.test(dau.ma) || !NHIP.test(dau.nhip) || !Number.isInteger(y.so_ngay)) return null;
  await kv("readwrite", (s) => s.put({ ...y, da_hoi: true }, "y_dinh"));
  const nhip = (hoi.nhip && hoi.nhip[dau.nhip]) || "";
  return { cau: hoi.cau.replace("{ten}", String(dau.ten || "").toLowerCase()).replace("{nhip}", nhip).slice(0, 160),
    mau: `ds.hn.${dau.ma}.${dau.nhip}.n${y.so_ngay}`, dung: String(hoi.dung || "Đúng").slice(0, 30), chua: String(hoi.chua_dung || "Chưa đúng").slice(0, 30) };
}

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {}; }
  const title = typeof d.title === "string" && d.title ? d.title.slice(0, 120) : "Hiểu Bản Thân";
  e.waitUntil((async () => {
    const h = await hoiHomQua(d.hoi).catch(() => null);
    const body = typeof d.body === "string" ? d.body.slice(0, 200) : "Mốc bạn đã đánh dấu cho hôm nay.";
    await self.registration.showNotification(title, {
      body: h ? `${body}\n${h.cau}` : body,
      icon: "/bieu-tuong/192",
      tag: typeof d.tag === "string" ? d.tag : `nhac-${homNayVn()}`,
      lang: "vi",
      // Thông báo có câu hỏi lại hôm qua và trỏ Hôm nay → mở thẳng khối "Hôm qua của bạn" (câu đang hỏi nằm ở đó; iPhone
      // không có nút trên thông báo). Trang khác (vd tháng tiết phía cửa nhà) giữ nguyên.
      data: { url: h && /^\/hom-nay(#|$)/.test(trongSite(d.url)) ? "/hom-nay#hom-qua" : trongSite(d.url), mau: h ? h.mau : null },
      // Android / máy tính hiện hai nút; iPhone không có nút → bấm mở Hôm nay, khối "Hôm qua của bạn" hỏi lại.
      ...(h ? { actions: [{ action: "dung", title: h.dung }, { action: "chua_dung", title: h.chua }] } : {}),
    });
  })());
});

async function ghiPhieu(mau, kq) {
  const y = await kv("readonly", (s) => s.get("y_dinh"));
  if (y) await kv("readwrite", (s) => s.put({ ...y, da_hoi: true, da_tra_loi: kq }, "y_dinh"));
  await fetch("/api/kiem-chung", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
    body: JSON.stringify({ loai: "doi_song", mau, phai: "pitago", ket_qua: kq }) }).catch(() => null);
}

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const mau = e.notification.data && e.notification.data.mau;
  if ((e.action === "dung" || e.action === "chua_dung") && typeof mau === "string" && /^ds\.hn\.[a-z_]+\.[a-z_]+\.n\d$/.test(mau)) {
    e.waitUntil(ghiPhieu(mau, e.action));   // trả lời ngay trên thông báo, không mở trang
    return;
  }
  const u = new URL(trongSite(e.notification.data && e.notification.data.url), self.location.origin);
  u.searchParams.set("tu", "push");
  e.waitUntil((async () => {
    const ds = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const cung = ds.find((c) => new URL(c.url).origin === self.location.origin);
    if (cung) {
      const ok = await cung.navigate(u.href).then(() => true).catch(() => false);
      if (ok) return cung.focus();
    }
    return self.clients.openWindow(u.href);
  })());
});

// Trình duyệt tự đổi subscription (hết hạn khoá) → đăng ký lại với cùng khoá máy chủ, báo trang lần tới mở ra đồng bộ.
self.addEventListener("pushsubscriptionchange", (e) => {
  const cu = e.oldSubscription;
  if (!cu || !cu.options || !cu.options.applicationServerKey) return;
  e.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cu.options.applicationServerKey })
    .then(() => self.clients.matchAll({ includeUncontrolled: true }))
    .then((ds) => ds.forEach((c) => c.postMessage({ loai: "push_doi" })))
    .catch(() => null));
});
