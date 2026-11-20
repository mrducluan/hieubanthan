// DH-PC2 + Gói 1A-Map — khung bản đồ vệ tinh (Google Maps JavaScript API) nhúng bằng <iframe> trong "Đo hướng nhà" & "Huyền Không".
// Vì sao là trang riêng: Maps JS API cần 'unsafe-eval' trong CSP; đặt nó ở tài liệu riêng này (proxy.ts không gắn CSP chung
// cho đường dẫn này) để phần còn lại của site giữ CSP-2 chặt. Khung chỉ nhận lệnh từ trang cùng origin và chỉ gửi TOẠ ĐỘ HAI
// ĐIỂM người dùng chấm cho trang mẹ — trang mẹ gọi engine tính góc & lập bàn Huyền Không (web không tự tính). Không lưu gì, không index.
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
  var hkData = null, hkOverlay = null, hkRadiusM = 14, hkOpacity = 0.72, hkVisible = true, hkSelected = null;
  var hudEl = null, rSlider = null, oSlider = null, toggleBtn = null;

  // 8 cung theo góc phương vị chuẩn Bắc = 0°, chiều kim đồng hồ (mỗi cung 45°).
  var SECTORS = [
    { cung: "Khảm", nhan: "Bắc", deg: 0 },
    { cung: "Cấn", nhan: "ĐB", deg: 45 },
    { cung: "Chấn", nhan: "Đông", deg: 90 },
    { cung: "Tốn", nhan: "ĐN", deg: 135 },
    { cung: "Ly", nhan: "Nam", deg: 180 },
    { cung: "Khôn", nhan: "TN", deg: 225 },
    { cung: "Đoài", nhan: "Tây", deg: 270 },
    { cung: "Càn", nhan: "TB", deg: 315 }
  ];
  // Nhãn hiển thị theo ngôn ngữ (cung giữ mã gốc để so với dữ liệu engine).
  var NHAN = __NHAN__, CHU_VAN = __CHU_VAN__, CHU_BAC = __CHU_BAC__, CHU_TRUNG = __CHU_TRUNG__;
  SECTORS.forEach(function (s, i) { s.nhan = NHAN[i]; });

  function gui(o) { o.nguon = "hbt-ve-tinh"; parent.postMessage(o, goc); }
  function r6(x) { return Math.round(x * 1e6) / 1e6; }
  function diem(m) { var p = m.getPosition(); return [r6(p.lat()), r6(p.lng())]; }
  function bao() {
    if (line && m1 && m2) line.setPath([m1.getPosition(), m2.getPosition()]);
    if (hkOverlay) hkOverlay.draw();
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
    if (!m1) m1 = ghim(ll, "1", __T1__);
    else if (!m2) {
      m2 = ghim(ll, "2", __T2__);
      line = new g.Polyline({ map: map, path: [m1.getPosition(), ll], strokeColor: "#e8c26a", strokeWeight: 3,
        icons: [{ icon: { path: g.SymbolPath.FORWARD_CLOSED_ARROW, scale: 4, strokeColor: "#e8c26a", fillColor: "#e8c26a", fillOpacity: 1 }, offset: "100%" }] });
    } else m2.setPosition(ll);
    bao();
  }

  function mucFill(muc) {
    if (muc === "thuan") return "rgba(45, 212, 160, 0.30)";
    if (muc === "can_chu_dong") return "rgba(245, 170, 80, 0.30)"; // hổ phách, không đỏ (quy ước mức của site)
    return "rgba(232, 194, 106, 0.20)";
  }
  function mucStroke(muc) {
    if (muc === "thuan") return "rgba(74, 222, 178, 0.85)";
    if (muc === "can_chu_dong") return "rgba(245, 170, 80, 0.85)";
    return "rgba(232, 194, 106, 0.65)";
  }
  function polar(cx, cy, r, deg) {
    var rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function sectorPath(cx, cy, rIn, rOut, a1, a2) {
    var p1 = polar(cx, cy, rOut, a1), p2 = polar(cx, cy, rOut, a2);
    var p3 = polar(cx, cy, rIn, a2), p4 = polar(cx, cy, rIn, a1);
    return "M" + p1[0].toFixed(1) + "," + p1[1].toFixed(1) +
      " A" + rOut + "," + rOut + " 0 0,1 " + p2[0].toFixed(1) + "," + p2[1].toFixed(1) +
      " L" + p3[0].toFixed(1) + "," + p3[1].toFixed(1) +
      " A" + rIn + "," + rIn + " 0 0,0 " + p4[0].toFixed(1) + "," + p4[1].toFixed(1) + " Z";
  }

  function buildSvg() {
    var S = 440, C = 220, R_OUT = 196, R_MID = 172, R_IN = 56;
    var byCung = {};
    (hkData.cung || []).forEach(function (x) { byCung[x.cung] = x; });
    var tmSet = {};
    (hkData.thanh_mon || []).forEach(function (c) { tmSet[c] = true; });
    var parts = [];
    parts.push('<svg viewBox="0 0 ' + S + ' ' + S + '" class="hbt-lb-svg" xmlns="http://www.w3.org/2000/svg">');
    // Vòng 24 sơn bên ngoài (mỗi 15° một vạch)
    parts.push('<circle cx="' + C + '" cy="' + C + '" r="' + R_OUT + '" fill="rgba(15,18,30,0.38)" stroke="rgba(232,194,106,0.75)" stroke-width="1.5"/>');
    for (var i = 0; i < 24; i++) {
      var a = i * 15 - 7.5;
      var q1 = polar(C, C, R_MID, a), q2 = polar(C, C, R_OUT, a);
      parts.push('<line x1="' + q1[0].toFixed(1) + '" y1="' + q1[1].toFixed(1) + '" x2="' + q2[0].toFixed(1) + '" y2="' + q2[1].toFixed(1) + '" stroke="rgba(232,194,106,0.35)" stroke-width="1"/>');
    }
    // 8 rẻ quạt cung Huyền Không
    SECTORS.forEach(function (sec) {
      var info = byCung[sec.cung] || {};
      var muc = info.muc || "can_bang";
      var sel = hkSelected === sec.cung;
      var laHuong = hkData.huong_quai === sec.cung;
      var laToa = hkData.toa_quai === sec.cung;
      var laTM = !!tmSet[sec.cung];
      var d = sectorPath(C, C, R_IN, R_MID, sec.deg - 22.5, sec.deg + 22.5);
      var stroke = sel ? "#f7d774" : (laHuong ? "#e8c26a" : mucStroke(muc));
      var sw = sel ? "3.2" : (laHuong ? "2.2" : "1.2");
      parts.push('<g class="hbt-sec' + (sel ? ' is-sel' : '') + '" data-cung="' + sec.cung + '" tabindex="0" role="button" aria-label="' + sec.nhan + '">');
      parts.push('<path d="' + d + '" fill="' + mucFill(muc) + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>');
      var ptLbl = polar(C, C, 144, sec.deg);
      var ptNum = polar(C, C, 108, sec.deg);
      var tag = laHuong ? " · H" : (laToa ? " · T" : "");
      parts.push('<text x="' + ptLbl[0].toFixed(1) + '" y="' + ptLbl[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" class="hbt-lbl">' + sec.nhan + tag + '</text>');
      if (info.son != null && info.huong != null) {
        parts.push('<text x="' + ptNum[0].toFixed(1) + '" y="' + ptNum[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" class="hbt-num">' + info.son + ' · ' + info.huong + '</text>');
      }
      if (laTM) {
        var ptTm = polar(C, C, 184, sec.deg);
        parts.push('<circle cx="' + ptTm[0].toFixed(1) + '" cy="' + ptTm[1].toFixed(1) + '" r="8" fill="#10b981" class="hbt-tm-pulse"/>');
        parts.push('<text x="' + ptTm[0].toFixed(1) + '" y="' + ptTm[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" class="hbt-tm-txt">★</text>');
      }
      parts.push('</g>');
    });
    // Trung cung
    var tc = byCung["Trung cung"] || {};
    var tcSel = hkSelected === "Trung cung";
    parts.push('<g class="hbt-sec' + (tcSel ? ' is-sel' : '') + '" data-cung="Trung cung" tabindex="0" role="button" aria-label="' + CHU_TRUNG + '">');
    parts.push('<circle cx="' + C + '" cy="' + C + '" r="' + R_IN + '" fill="' + mucFill(tc.muc || "can_bang") + '" stroke="' + (tcSel ? "#f7d774" : "rgba(232,194,106,0.85)") + '" stroke-width="' + (tcSel ? "3" : "1.6") + '"/>');
    parts.push('<text x="' + C + '" y="' + (C - 14) + '" text-anchor="middle" class="hbt-lbl">' + CHU_VAN + ' ' + (hkData.van || "") + '</text>');
    if (tc.son != null && tc.huong != null) {
      parts.push('<text x="' + C + '" y="' + (C + 10) + '" text-anchor="middle" class="hbt-num">' + tc.son + ' · ' + tc.huong + '</text>');
    }
    parts.push('</g>');
    // Chữ B / N trên viền ngoài cùng
    var pN = polar(C, C, R_OUT + 12, 0);
    parts.push('<text x="' + pN[0].toFixed(1) + '" y="' + pN[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" class="hbt-cardinal">' + CHU_BAC + '</text>');
    parts.push('</svg>');
    return parts.join("");
  }

  function ensureOverlay() {
    if (hkOverlay || !g || !map || typeof g.OverlayView !== "function") return;
    function HKOverlay() { this.div = null; }
    HKOverlay.prototype = new g.OverlayView();
    HKOverlay.prototype.onAdd = function () {
      var el = document.createElement("div");
      el.className = "hbt-lb-wrap";
      el.addEventListener("click", function (ev) {
        var target = ev.target && ev.target.closest ? ev.target.closest("[data-cung]") : null;
        if (!target) return;
        ev.stopPropagation();
        var cung = target.getAttribute("data-cung");
        if (!cung) return;
        hkSelected = cung;
        if (hkOverlay) hkOverlay.renderSvg();
        gui({ su_kien: "chon_cung", cung: cung });
      });
      this.div = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    };
    HKOverlay.prototype.renderSvg = function () {
      if (!this.div || !hkData) return;
      this.div.innerHTML = buildSvg();
      this.div.style.opacity = String(hkOpacity);
    };
    HKOverlay.prototype.draw = function () {
      if (!this.div) return;
      if (!hkData || !m1 || !hkVisible) { this.div.style.display = "none"; return; }
      var proj = this.getProjection();
      if (!proj) return;
      var pos = m1.getPosition();
      var lat = pos.lat(), lng = pos.lng();
      // Đổi bán kính mét → pixel theo vĩ độ thực tế
      var dLat = hkRadiusM / 111320;
      var pCenter = proj.fromLatLngToDivPixel(pos);
      var pNorth = proj.fromLatLngToDivPixel(new g.LatLng(lat + dLat, lng));
      var rPx = Math.max(48, Math.min(340, Math.abs(pCenter.y - pNorth.y)));
      var size = rPx * 2;
      this.div.style.display = "block";
      this.div.style.width = size + "px";
      this.div.style.height = size + "px";
      this.div.style.left = (pCenter.x - rPx) + "px";
      this.div.style.top = (pCenter.y - rPx) + "px";
      this.div.style.opacity = String(hkOpacity);
      if (!this.div.innerHTML) this.renderSvg();
    };
    HKOverlay.prototype.onRemove = function () {
      if (this.div && this.div.parentNode) this.div.parentNode.removeChild(this.div);
      this.div = null;
    };
    hkOverlay = new HKOverlay();
    hkOverlay.setMap(map);
  }

  function updateHud() {
    if (!hudEl) return;
    hudEl.style.display = (hkData && m1) ? "flex" : "none";
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
    hudEl = document.getElementById("hk-hud");
    rSlider = document.getElementById("hk-r");
    oSlider = document.getElementById("hk-o");
    toggleBtn = document.getElementById("hk-toggle");
    if (rSlider) rSlider.addEventListener("input", function () { hkRadiusM = Number(rSlider.value) || 14; if (hkOverlay) hkOverlay.draw(); });
    if (oSlider) oSlider.addEventListener("input", function () { hkOpacity = (Number(oSlider.value) || 72) / 100; if (hkOverlay) hkOverlay.draw(); });
    if (toggleBtn) toggleBtn.addEventListener("click", function () {
      hkVisible = !hkVisible;
      toggleBtn.textContent = hkVisible ? __AN_LB__ : __HIEN_LB__;
      if (hkOverlay) hkOverlay.draw();
    });
    try { ensureOverlay(); } catch (e) { hkOverlay = null; }
    gui({ su_kien: "san" });
    viTri();
  };
  addEventListener("message", function (e) {
    if (e.origin !== goc || e.source !== parent || !map) return;
    var d = e.data || {};
    if (d.lenh === "tim") {
      new g.Geocoder().geocode(Object.assign({ address: String(d.q || "").slice(0, 200) }, __VUNG__)).then(function (r) {
        var k = r.results && r.results[0];
        if (!k) { gui({ su_kien: "tim", ok: false }); return; }
        map.setCenter(k.geometry.location); map.setZoom(19);
        gui({ su_kien: "tim", ok: true });
      }).catch(function () { gui({ su_kien: "tim", ok: false }); });
    } else if (d.lenh === "vi_tri") viTri();
    else if (d.lenh === "lam_lai") {
      [m1, m2, line].forEach(function (x) { if (x) x.setMap(null); });
      m1 = m2 = line = null; hkData = null; hkSelected = null;
      if (hkOverlay) hkOverlay.draw();
      updateHud(); bao();
    } else if (d.lenh === "huyen_khong" && d.ban) {
      hkData = d.ban;
      hkSelected = d.chon || d.ban.huong_quai || null;
      hkVisible = true;
      if (toggleBtn) toggleBtn.textContent = __AN_LB__;
      ensureOverlay();
      if (hkOverlay) { hkOverlay.renderSvg(); hkOverlay.draw(); }
      updateHud();
    } else if (d.lenh === "chon_cung" && d.cung) {
      hkSelected = String(d.cung);
      if (hkOverlay && hkData) hkOverlay.renderSvg();
    }
  });
  var s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(K) + "&v=weekly&loading=async&" + __THAM_SO__ + "&callback=__hbtSan";
  s.async = true; s.nonce = __NONCE__;
  s.onerror = function () { gui({ su_kien: "loi", ma: "mang" }); };
  document.head.appendChild(s);
})();`;

const CHU = {
  vi: {
    t1: "Tâm nhà (kéo để chỉnh)", t2: "Trước mặt nhà (kéo để chỉnh)",
    title: "Bản đồ vệ tinh", aria: "Bản đồ vệ tinh: bấm vào mái nhà, rồi bấm mặt đường trước cửa",
    khong: "Không có bản đồ vệ tinh", ts: "language=vi&region=VN", vung: { region: "VN" },
    co: "Cỡ", mo: "Mờ", anLb: "Ẩn la bàn", hienLb: "Hiện la bàn", hud: "Điều chỉnh la bàn Huyền Không",
    nhan: ["Bắc", "ĐB", "Đông", "ĐN", "Nam", "TN", "Tây", "TB"], van: "Vận", bac: "B", trung: "Trung cung",
  },
  en: {
    t1: "Centre of home (drag to adjust)", t2: "In front of the home (drag to adjust)",
    title: "Satellite map", aria: "Satellite map: tap the roof, then the street in front of the door",
    khong: "No satellite map", ts: "language=en", vung: {},
    co: "Size", mo: "Opacity", anLb: "Hide compass", hienLb: "Show compass", hud: "Flying Star compass controls",
    nhan: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"], van: "Period", bac: "N", trung: "Centre palace",
  },
} as const;

export function GET(req: Request): Response {
  let ngonNgu: "vi" | "en" = "vi";
  try { if (new URL(req.url).searchParams.get("ngon_ngu") === "en") ngonNgu = "en"; } catch { /* giữ vi */ }
  const ch = CHU[ngonNgu];
  const khoa = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "").trim();
  if (!khoa) return new Response(ch.khong, { status: 404, headers: { "x-robots-tag": "noindex" } });
  const nonce = randomBytes(16).toString("base64");
  const js = MA_JS.replace("__KHOA__", JSON.stringify(khoa)).replace("__NONCE__", JSON.stringify(nonce))
    .replace("__T1__", JSON.stringify(ch.t1)).replace("__T2__", JSON.stringify(ch.t2)).replace("__VUNG__", JSON.stringify(ch.vung))
    .replace("__THAM_SO__", JSON.stringify(ch.ts))
    .replace("__NHAN__", JSON.stringify(ch.nhan)).replace("__CHU_VAN__", JSON.stringify(ch.van))
    .replace("__CHU_BAC__", JSON.stringify(ch.bac)).replace("__CHU_TRUNG__", JSON.stringify(ch.trung))
    .replaceAll("__AN_LB__", JSON.stringify(ch.anLb)).replaceAll("__HIEN_LB__", JSON.stringify(ch.hienLb));
  const html = `<!doctype html><html lang="${ngonNgu}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${ch.title}</title>
<style>
html,body,#ban-do{height:100%;margin:0;background:#11131c;font-family:system-ui,-apple-system,sans-serif}
.hbt-lb-wrap{position:absolute;pointer-events:auto;animation:hbtIn .32s cubic-bezier(.2,.8,.2,1)}
.hbt-lb-svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 2px 10px rgba(0,0,0,.55))}
.hbt-sec{cursor:pointer;transition:filter .18s ease}
.hbt-sec:hover{filter:brightness(1.22)}
.hbt-sec.is-sel path,.hbt-sec.is-sel circle{filter:drop-shadow(0 0 6px rgba(247,215,116,.65))}
.hbt-lbl{fill:#f3efe6;font-size:12px;font-weight:600;paint-order:stroke;stroke:rgba(12,14,24,.85);stroke-width:3px;pointer-events:none}
.hbt-num{fill:#fff;font-size:18px;font-weight:700;font-family:Georgia,serif;paint-order:stroke;stroke:rgba(12,14,24,.9);stroke-width:3.5px;pointer-events:none}
.hbt-cardinal{fill:#f7d774;font-size:13px;font-weight:800;paint-order:stroke;stroke:rgba(12,14,24,.9);stroke-width:3px;pointer-events:none}
.hbt-tm-txt{fill:#052e16;font-size:11px;font-weight:800;pointer-events:none}
.hbt-tm-pulse{animation:hbtPulse 2s ease-in-out infinite;transform-origin:center}
#hk-hud{position:fixed;left:10px;bottom:10px;z-index:20;display:none;flex-wrap:wrap;align-items:center;gap:10px;
  padding:7px 12px;border-radius:999px;background:rgba(17,19,28,.86);backdrop-filter:blur(8px);
  border:1px solid rgba(232,194,106,.45);color:#f3efe6;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,.4)}
#hk-hud label{display:flex;align-items:center;gap:5px}
#hk-hud input[type=range]{width:68px;accent-color:#e8c26a}
#hk-toggle{background:rgba(232,194,106,.18);color:#f7d774;border:1px solid rgba(232,194,106,.5);border-radius:999px;
  padding:3px 10px;font-size:11px;font-weight:600;cursor:pointer}
@keyframes hbtIn{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}
@keyframes hbtPulse{0%,100%{opacity:.95}50%{opacity:.45}}
@media (prefers-reduced-motion:reduce){.hbt-lb-wrap,.hbt-tm-pulse{animation:none!important}}
</style></head>
<body>
<div id="ban-do" role="application" aria-label="${ch.aria}"></div>
<div id="hk-hud" aria-label="${ch.hud}">
  <label>${ch.co}<input id="hk-r" type="range" min="6" max="36" value="14" /></label>
  <label>${ch.mo}<input id="hk-o" type="range" min="25" max="92" value="72" /></label>
  <button id="hk-toggle" type="button">${ch.anLb}</button>
</div>
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
