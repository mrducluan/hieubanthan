// A11Y-1 — rà trợ năng không cần thư viện ngoài (Playwright có sẵn). Kiểm trên trình duyệt thật:
//  1) tương phản chữ/nền (WCAG AA: 4.5 chữ thường, 3 chữ lớn ≥ 24px hoặc ≥ 18.66px đậm) — nền lấy từ phần tử
//     cha đầu tiên có màu nền đặc, bỏ qua chữ trong SVG và chữ ẩn;
//  2) nút / link / ô nhập phải có tên đọc được (aria-label, nhãn, chữ bên trong, title);
//  3) ảnh <img> có alt; <svg role=img> có tên; 4) đúng 1 <h1>, không nhảy cấp tiêu đề;
//  5) phím Tab đi tới được phần tử tương tác và có viền focus nhìn thấy.
// Chạy: next build && next start -p 3001 (cần engine) rồi
//   PW_CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/kiem-tra-tro-nang.mjs [goc] [--mobile]
import { chromium } from "@playwright/test";

const goc = process.argv.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:3001";
const mobile = process.argv.includes("--mobile");
// --ho-so: nạp sẵn hồ sơ mẫu trên máy để rà cả phần kết quả (lá số, bài đọc, khung hỏi đáp)
const coHoSo = process.argv.includes("--ho-so");
const TRANG = ["/", "/than-so", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy", "/hop-doi", "/kham-pha", "/ban-than",
  "/kien-thuc", "/kien-thuc/tu-vi/sao-tu-vi", "/kien-thuc/sao-cung/thai-am-cung-phu-the", "/tu-dien",
  "/phong-thuy/tuoi-1990-nam", "/la-so-mau", "/chinh-sach-rieng-tu", "/lien-he", "/dang-nhap", "/tai-khoan"];

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH });
const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
// bỏ hộp hỏi cookie (đã chọn) để không che trang
await ctx.addInitScript((coHoSo) => { try {
  localStorage.setItem("hbt.dong-y-cookie.v1", "tu_choi");
  if (coHoSo) localStorage.setItem("hbt.hoso.v1", JSON.stringify({ v: 1, ho_ten: "Nguyễn Văn An", ngay: 17, thang: 5, nam: 1990,
    gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi", tao_luc: "2026-09-30T00:00:00Z" }));
} catch {} }, coHoSo);
let tong = 0;
for (const d of TRANG) {
  const p = await ctx.newPage();
  await p.goto(goc + d, { waitUntil: "networkidle" });
  await p.waitForTimeout(coHoSo ? 2500 : 400);
  if (process.env.A11Y_TU_KIEM) {   // tự kiểm: chèn 3 lỗi cố ý — script phải bắt được cả 3
    await p.evaluate(() => document.querySelector("main")?.insertAdjacentHTML("afterbegin",
      '<p style="color:#2a2a3a">chu mo qua</p><button style="width:24px;height:24px"></button><img src="/icon.svg">'));
  }
  const loi = await p.evaluate(() => {
    const ra = [];
    const rgba = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 }; };
    const lum = ({ r, g, b }) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const tron = (tren, duoi) => ({ r: tren.r * tren.a + duoi.r * (1 - tren.a), g: tren.g * tren.a + duoi.g * (1 - tren.a), b: tren.b * tren.a + duoi.b * (1 - tren.a), a: 1 });
    const nen = (el) => {
      const lop = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage !== "none" && e !== document.body) return null;   // nền gradient/ảnh: bỏ qua
        const c = rgba(cs.backgroundColor);
        if (c && c.a > 0) { lop.push(c); if (c.a >= 1) break; }
      }
      let kq = { r: 10, g: 10, b: 23, a: 1 };                                                         // --bg mặc định
      for (const c of lop.reverse()) kq = tron(c, kq);
      return kq;
    };
    const ten = (el) => (el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent) || el.textContent || el.getAttribute("title") || el.getAttribute("alt") || "").trim();
    const hien = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[hidden],[aria-hidden=true],.sr-only"); };
    // 1) tương phản
    const daXet = new Set();
    for (const el of document.querySelectorAll("body *:not(script):not(style):not(svg *)")) {
      if (!hien(el)) continue;
      const chu = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!chu) continue;
      const cs = getComputedStyle(el);
      if (cs.webkitTextFillColor && cs.webkitTextFillColor.includes("0, 0, 0, 0") || cs.backgroundClip === "text") continue;  // chữ gradient
      const fg = rgba(cs.color); const bg = nen(el);
      if (!fg || !bg) continue;
      const mau = tron({ ...fg, a: fg.a * Number(cs.opacity || 1) }, bg);
      const [l1, l2] = [lum(mau), lum(bg)].sort((a, b) => b - a);
      const ti = (l1 + 0.05) / (l2 + 0.05);
      const px = parseFloat(cs.fontSize); const dam = Number(cs.fontWeight) >= 700;
      const can = px >= 24 || (dam && px >= 18.66) ? 3 : 4.5;
      const khoa = `${cs.color}|${cs.fontSize}|${el.className}`;
      if (ti < can && !daXet.has(khoa)) { daXet.add(khoa); ra.push(`tương phản ${ti.toFixed(2)} < ${can}: "${el.textContent.trim().slice(0, 40)}" (${cs.color}, ${px}px, .${String(el.className).slice(0, 60)})`); }
    }
    // 2) tên đọc được
    for (const el of document.querySelectorAll("a[href], button, [role=button], [role=radio], [role=tab], summary")) {
      if (hien(el) && !ten(el) && !el.querySelector("img[alt]:not([alt=''])")) ra.push(`thiếu tên: <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 50)}">`);
    }
    for (const el of document.querySelectorAll("input:not([type=hidden]), select, textarea")) {
      if (!hien(el)) continue;
      const nhan = el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title");
      if (!nhan) ra.push(`ô nhập thiếu nhãn: <${el.tagName.toLowerCase()} name="${el.name}" placeholder="${el.placeholder}">`);
    }
    // 3) ảnh
    for (const el of document.querySelectorAll("img:not([alt])")) ra.push(`ảnh thiếu alt: ${el.src.slice(-50)}`);
    for (const el of document.querySelectorAll("svg[role=img]")) if (!ten(el) && !el.querySelector("title")) ra.push("svg role=img thiếu tên");
    // 4) tiêu đề
    const h = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(hien).map((e) => Number(e.tagName[1]));
    if (h.filter((x) => x === 1).length !== 1) ra.push(`số H1 = ${h.filter((x) => x === 1).length}`);
    for (let i = 1; i < h.length; i++) if (h[i] > h[i - 1] + 1) { ra.push(`nhảy cấp tiêu đề H${h[i - 1]} → H${h[i]}`); break; }
    if (!document.documentElement.lang) ra.push("thiếu lang");
    return ra;
  });
  // 6) chữ trong SVG lá số (Tử vi, Bát tự): so với các màu nền ô của giao diện đang xem; trang có nút
  //    "Giấy cổ" thì xét cả giao diện sáng.
  const kiemSvg = () => p.evaluate(() => {
    const ra = [];
    const so = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    for (const svg of document.querySelectorAll("svg.la-so")) {
      const cs = getComputedStyle(svg);
      const nen = ["--ls-o", "--ls-o-sang", "--ls-menh-nen"].map((v) => so(cs.getPropertyValue(v))).filter((x) => x.length >= 3);
      const da = new Set();
      for (const t of svg.querySelectorAll("text")) {
        const c = getComputedStyle(t); const mau = so(c.fill);
        if (mau.length < 3 || (mau.length > 3 && mau[3] < 0.6) || Number(c.opacity) < 0.6 || !t.textContent.trim()) continue;   // chữ trang trí mờ
        // chữ "đục" trên nhãn nền đậm (TIỂU HẠN, Tuần/Triệt): màu chữ trùng màu nền ô/giấy — nền thật là nhãn, bỏ qua
        const nenGiay = so(cs.getPropertyValue("--ls-nen"));
        if ([...nen, nenGiay].some((n) => n.slice(0, 3).every((v, i) => Math.abs(v - mau[i]) < 3))) continue;
        const ti = Math.min(...nen.map((n) => { const [a, b2] = [lum(mau), lum(n)].sort((x, y) => y - x); return (a + 0.05) / (b2 + 0.05); }));
        if (ti < 4.5 && !da.has(c.fill)) { da.add(c.fill); ra.push(`SVG lá số (${svg.classList.contains("la-so-giay") ? "Giấy cổ" : "Đêm sao"}) tương phản ${ti.toFixed(2)}: "${t.textContent.trim().slice(0, 20)}" ${c.fill}`); }
      }
    }
    return ra;
  });
  loi.push(...await kiemSvg());
  const giay = p.getByRole("tab", { name: "Giấy cổ" });
  if (await giay.count()) { await giay.first().click(); await p.waitForTimeout(400); loi.push(...await kiemSvg()); }
  // 5) bàn phím: Tab 6 lần, phần tử nhận focus phải có outline/box-shadow
  const focus = [];
  for (let i = 0; i < 6; i++) {
    await p.keyboard.press("Tab");
    await p.waitForTimeout(250);            // nút có transition-all: viền focus mọc dần, đo sau khi xong
    const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e);
      // bóng đổ chỉ tính khi có màu không trong suốt (Tailwind luôn để sẵn "rgba(0,0,0,0) 0 0 0 0")
      const bong = (cs.boxShadow || "").split(/,(?![^(]*\))/).some((x) => !/rgba\([^)]*,\s*0\)/.test(x) && x.trim() !== "none" && /\d+px \d+px/.test(x));
      const co = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || bong;
      return co ? null : `${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 30)}"`; });
    if (f) focus.push(f);
  }
  for (const f of new Set(focus)) loi.push(`focus không thấy viền: ${f}`);
  tong += loi.length;
  console.log(`\n${d} — ${loi.length} vấn đề`);
  for (const l of loi) console.log("  · " + l);
  await p.close();
}
await b.close();
console.log(`\nTỔNG: ${tong}`);
process.exit(tong ? 1 : 0);
