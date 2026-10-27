// DH-PC2 — khung bản đồ vệ tinh (Google Maps JavaScript API) nhúng bằng <iframe> trong "Đo hướng nhà".
// Vì sao là trang riêng: Maps JS API cần 'unsafe-eval' trong CSP; đặt nó ở tài liệu riêng này (proxy.ts không gắn CSP chung
// cho đường dẫn này) để phần còn lại của site giữ CSP-2 chặt. Khung chỉ nhận lệnh từ trang cùng origin và chỉ gửi TOẠ ĐỘ HAI
// ĐIỂM người dùng chấm cho trang mẹ — trang mẹ gọi engine tính góc (web không tự tính). Không lưu gì, không index.
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

function csp(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https: blob:`,
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    "img-src data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com",
    "connect-src https://*.googleapis.com https://*.google.com https://*.gstatic.com data: blob:",
    "font-src https://fonts.gstatic.com",
    "frame-src https://*.google.com",
    "worker-src blob:",
    "frame-ancestors 'self'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

const MA_JS = String.raw`(function () {
  var K = __KHOA__, goc = location.origin, g, map, m1 = null, m2 = null, line = null;
  function gui(o) { o.nguon = "hbt-ve-tinh"; parent.postMessage(o, goc); }
  function r6(x) { return Math.round(x * 1e6) / 1e6; }
  function diem(m) { var p = m.getPosition(); return [r6(p.lat()), r6(p.lng())]; }
  function bao() {
    if (line && m1 && m2) line.setPath([m1.getPosition(), m2.getPosition()]);
    var o = { su_kien: "diem", buoc: m2 ? 2 : (m1 ? 1 : 0) };
    if (m1) o.tam = diem(m1);
    if (m2) o.truoc = diem(m2);
    gui(o);
  }
  function ghim(ll, so, ten) {
    var m = new g.Marker({ map: map, position: ll, draggable: true, title: ten,
      label: { text: so, color: "#1b1b1b", fontWeight: "700" } });
    m.addListener("dragend", bao);
    return m;
  }
  function cham(ll) {
    if (!m1) m1 = ghim(ll, "1", "Tâm nhà (kéo để chỉnh)");
    else if (!m2) {
      m2 = ghim(ll, "2", "Trước mặt nhà (kéo để chỉnh)");
      line = new g.Polyline({ map: map, path: [m1.getPosition(), ll], strokeColor: "#e8c26a", strokeWeight: 3,
        icons: [{ icon: { path: g.SymbolPath.FORWARD_CLOSED_ARROW, scale: 4, strokeColor: "#e8c26a", fillColor: "#e8c26a", fillOpacity: 1 }, offset: "100%" }] });
    } else m2.setPosition(ll);
    bao();
  }
  function viTri() {
    if (!navigator.geolocation) { gui({ su_kien: "vi_tri", ok: false }); return; }
    navigator.geolocation.getCurrentPosition(function (p) {
      map.setCenter({ lat: p.coords.latitude, lng: p.coords.longitude });
      // Máy tính đoán vị trí theo wifi (lệch hàng chục – trăm mét): chỉ để mở gần khu nhà, người dùng tự tìm mái nhà.
      map.setZoom(p.coords.accuracy > 150 ? 17 : 19);
      gui({ su_kien: "vi_tri", ok: true });
    }, function () { gui({ su_kien: "vi_tri", ok: false }); }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
  }
  window.gm_authFailure = function () { gui({ su_kien: "loi", ma: "khoa" }); };
  window.__hbtSan = function () {
    g = google.maps;
    map = new g.Map(document.getElementById("ban-do"), { center: { lat: 16.0, lng: 106.5 }, zoom: 6, mapTypeId: "hybrid", tilt: 0,
      rotateControl: false, streetViewControl: false, fullscreenControl: true, mapTypeControl: false, clickableIcons: false,
      gestureHandling: "greedy" });
    map.addListener("click", function (e) { cham(e.latLng); });
    gui({ su_kien: "san" });
    viTri();
  };
  addEventListener("message", function (e) {
    if (e.origin !== goc || e.source !== parent || !map) return;
    var d = e.data || {};
    if (d.lenh === "tim") {
      new g.Geocoder().geocode({ address: String(d.q || "").slice(0, 200), region: "VN" }).then(function (r) {
        var k = r.results && r.results[0];
        if (!k) { gui({ su_kien: "tim", ok: false }); return; }
        map.setCenter(k.geometry.location); map.setZoom(19);
        gui({ su_kien: "tim", ok: true });
      }).catch(function () { gui({ su_kien: "tim", ok: false }); });
    } else if (d.lenh === "vi_tri") viTri();
    else if (d.lenh === "lam_lai") {
      [m1, m2, line].forEach(function (x) { if (x) x.setMap(null); });
      m1 = m2 = line = null; bao();
    }
  });
  var s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(K) + "&v=weekly&loading=async&language=vi&region=VN&callback=__hbtSan";
  s.async = true; s.nonce = __NONCE__;
  s.onerror = function () { gui({ su_kien: "loi", ma: "mang" }); };
  document.head.appendChild(s);
})();`;

export function GET(): Response {
  const khoa = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "").trim();
  if (!khoa) return new Response("Không có bản đồ vệ tinh", { status: 404, headers: { "x-robots-tag": "noindex" } });
  const nonce = randomBytes(16).toString("base64");
  const js = MA_JS.replace("__KHOA__", JSON.stringify(khoa)).replace("__NONCE__", JSON.stringify(nonce));
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Bản đồ vệ tinh</title>
<style>html,body,#ban-do{height:100%;margin:0;background:#11131c}</style></head>
<body><div id="ban-do" role="application" aria-label="Bản đồ vệ tinh: bấm vào mái nhà, rồi bấm mặt đường trước cửa"></div>
<script nonce="${nonce}">${js}</script></body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": csp(nonce),
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
