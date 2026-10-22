// KC-4 — service worker CHỈ cho Web Push nhắc việc. Không chặn fetch, không cache trang (site vẫn chạy như không có
// service worker). Chỉ được đăng ký khi người dùng bấm "Bật nhắc" (lib/web-push-trinh-duyet.ts).
// Gói từ máy chủ (/api/cron/hang-ngay): { title, body, url, tag, hoi? } — url luôn là đường dẫn trong site.
// GĐ2 "Hôm qua việc X — đúng không?": `hoi` là mẫu câu (KB); ý định hôm qua đọc từ IndexedDB "hbt"/"kv"/"y_dinh" do trang
// Hôm nay ghi (lib/hom-qua.ts) — máy chủ không biết ý định. Bấm "Đúng / Chưa đúng" → phiếu kiểm chứng ẩn danh (mã ds.hn.*).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

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
      data: { url: trongSite(d.url), mau: h ? h.mau : null },
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
