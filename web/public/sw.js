// KC-4 GĐ1 — service worker CHỈ cho Web Push nhắc việc. Không chặn fetch, không cache trang (site vẫn chạy như
// không có service worker). Chỉ được đăng ký khi người dùng bấm "Bật nhắc" (lib/web-push-trinh-duyet.ts).
// Gói từ máy chủ (/api/cron/nhac-day): { title, body, url, tag } — url luôn là đường dẫn trong site.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

const trongSite = (u) => (typeof u === "string" && u.startsWith("/") && !u.startsWith("//") ? u : "/hom-nay");

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {}; }
  const title = typeof d.title === "string" && d.title ? d.title.slice(0, 120) : "Hiểu Bản Thân";
  e.waitUntil(self.registration.showNotification(title, {
    body: typeof d.body === "string" ? d.body.slice(0, 200) : "Mốc bạn đã đánh dấu cho hôm nay.",
    icon: "/apple-icon",
    tag: typeof d.tag === "string" ? d.tag : "nhac",
    lang: "vi",
    data: { url: trongSite(d.url) },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const u = new URL(trongSite(e.notification.data && e.notification.data.url), self.location.origin);
  u.searchParams.set("tu", "push");
  e.waitUntil((async () => {
    const ds = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const cung = ds.find((c) => new URL(c.url).origin === self.location.origin);
    if (cung) { await cung.navigate(u.href).catch(() => null); return cung.focus(); }
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
