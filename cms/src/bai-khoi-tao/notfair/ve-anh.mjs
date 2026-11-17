// NF-BT (2026-11-17) — vẽ ảnh cho đợt biên tập lại bài NotFair + 4 bài KW-6T tuần 3, bằng HTML + Chromium (Playwright có
// sẵn ở môi trường dev), xuất WebP (sharp). Ảnh bìa 1600×900 có tiêu đề chữ lớn, hoạ tiết theo mảng, QR góc phải dưới.
// Ảnh trong bài 1600×900 + dải chân 128 px (hieuban.com + đường dẫn bài + QR) — cùng quy ước QR-ANH của BLOG-6 / KW-6T.
// Số liệu trong ảnh lấy từ engine (chạy ngày 17/11/2026, ghi ở từng mục) — đổi bài thì sửa NOI_DUNG rồi chạy lại:
//   node src/bai-khoi-tao/notfair/ve-anh.mjs           → ghi ./anh/*.webp và ../kw6t-tuan-3/anh/*.webp
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(DIR, "../../../..");
const req = createRequire(import.meta.url);
const { chromium } = req("playwright");
const sharp = req("sharp");
const { maHoaQr, duongQr } = await import(pathToFileURL(path.join(GOC, "cms/src/lib/qr.ts")).href);
const FONT = (f) => pathToFileURL(path.join(GOC, "cms/assets/fonts", f)).href;
const LOGO = fs.readFileSync(path.join(GOC, "web/public/thuong-hieu/logo-ngang-nen-sang-trong-suot.svg"), "utf8");

const qrSvg = (url, px) => {
  const q = maHoaQr(url); const n = q.kichThuoc + 8; const o = Math.floor(px / n);
  return `<svg width="${n * o}" height="${n * o}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${duongQr(q)}" fill="#1d1830"/></svg>`;
};
const e = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const nhan = (s) => e(s).replace(/\*([^*]+)\*/g, "<b>$1</b>");

const CSS = `
@font-face{font-family:BV;src:url(${FONT("BeVietnamPro-SemiBold.ttf")})}
@font-face{font-family:NR;src:url(${FONT("Newsreader.ttf")})}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1600px;font-family:BV,sans-serif;color:#262033;background:#f6f0e2}
b{color:#a8741a;font-weight:inherit}
.k{position:relative;width:1600px;height:900px;overflow:hidden;
  background:radial-gradient(1100px 600px at 85% 15%,#fff8e6 0,transparent 60%),radial-gradient(900px 700px at 0% 100%,#efe4cc 0,transparent 60%),#f6f0e2}
.k::before{content:"";position:absolute;inset:28px;border:2px solid #d9c9a3;border-radius:28px}
.tde{font-family:NR,serif;font-weight:600;color:#2a2140}
.logo{position:absolute;left:72px;top:58px;height:44px}.logo svg{height:44px;width:auto}
.nhan{position:absolute;right:72px;top:62px;font-size:24px;color:#7b6a48;letter-spacing:.04em}
.chan{height:128px;background:#2a2140;color:#f6f0e2;display:flex;align-items:center;padding:0 60px;gap:26px}
.chan .w{font-size:34px;color:#f0c66b}.chan .u{font-size:22px;color:#d8cfbd}.chan .q{margin-left:auto;display:flex;align-items:center;gap:18px;font-size:22px;color:#d8cfbd}
table{border-collapse:separate;border-spacing:0;width:100%;font-size:30px}
th{background:#2a2140;color:#f6f0e2;text-align:left;padding:16px 22px;font-size:26px}
th:first-child{border-radius:16px 0 0 0}th:last-child{border-radius:0 16px 0 0}
td{padding:14px 22px;border-bottom:2px solid #e3d6b8;background:#fffaf0}
tr:last-child td:first-child{border-radius:0 0 0 16px}tr:last-child td:last-child{border-radius:0 0 16px 0}
td.tot{color:#2f6b4f;background:#eef6f0}td.xau{color:#a5591b;background:#fbefe0}td.noi{background:#2a2140;color:#f0c66b}
`;

// ---------- hoạ tiết ảnh bìa (560×560, chỉ hình, chữ ngắn) ----------
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const vongTron = (n, r, fn) => Array.from({ length: n }, (_, i) => {
  const a = -Math.PI / 2 + i * 2 * Math.PI / n; return fn(280 + r * Math.cos(a), 280 + r * Math.sin(a), i);
}).join("");
const hao = (bits, x, y, w, dong = []) => bits.map((b, i) => {   // bits: hào 1 → 6 (dưới lên)
  const yy = y + (5 - i) * 46, mau = dong.includes(i + 1) ? "#a8741a" : "#2a2140";
  return b ? `<rect x="${x}" y="${yy}" width="${w}" height="26" rx="6" fill="${mau}"/>`
    : `<rect x="${x}" y="${yy}" width="${w * 0.43}" height="26" rx="6" fill="${mau}"/><rect x="${x + w * 0.57}" y="${yy}" width="${w * 0.43}" height="26" rx="6" fill="${mau}"/>`;
}).join("");
const MOTIF = {
  la_so(c) {   // 12 cung theo vị trí lá số Tử vi: hàng trên Tỵ Ngọ Mùi Thân, cột trái Thìn Mão, hàng dưới Dần Sửu Tý Hợi, cột phải Dậu Tuất
    const VT = { "Tỵ": [0, 0], "Ngọ": [0, 1], "Mùi": [0, 2], "Thân": [0, 3], "Thìn": [1, 0], "Dậu": [1, 3], "Mão": [2, 0], "Tuất": [2, 3], "Dần": [3, 0], "Sửu": [3, 1], "Tý": [3, 2], "Hợi": [3, 3] };
    return `<svg viewBox="0 0 560 560" width="560" height="560">${CHI.map((chi) => {
      const [r, k] = VT[chi], on = (c.to ?? []).includes(chi), x = 20 + k * 130, y = 20 + r * 130;
      return `<rect x="${x}" y="${y}" width="122" height="122" rx="14" fill="${on ? "#2a2140" : "#fffaf0"}" stroke="${on ? "#2a2140" : "#cbb88d"}" stroke-width="3"/><text x="${x + 61}" y="${y + 72}" text-anchor="middle" font-family="NR" font-size="30" fill="${on ? "#f0c66b" : "#2a2140"}">${chi}</text>`;
    }).join("")}<text x="280" y="270" text-anchor="middle" font-family="NR" font-size="44" fill="#a8741a">${e(c.giua ?? "")}</text><text x="280" y="312" text-anchor="middle" font-family="BV" font-size="22" fill="#5d5170">${e(c.giua_phu ?? "")}</text></svg>`;
  },
  que(c) {   // quẻ bản → quẻ biến
    return `<svg viewBox="0 0 560 560" width="560" height="560">${hao(c.ban, 30, 120, 200, c.dong)}${hao(c.bien, 330, 120, 200)}
      <path d="M248 250 L310 250" stroke="#a8741a" stroke-width="6" marker-end="url(#m)"/><defs><marker id="m" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#a8741a"/></marker></defs>
      <text x="130" y="440" text-anchor="middle" font-family="NR" font-size="32" fill="#2a2140">${e(c.ten_ban ?? "")}</text><text x="430" y="440" text-anchor="middle" font-family="NR" font-size="32" fill="#2a2140">${e(c.ten_bien ?? "")}</text>
      <text x="280" y="500" text-anchor="middle" font-family="BV" font-size="22" fill="#5d5170">${e(c.giua_phu ?? "")}</text></svg>`;
  },
  so(c) {
    return `<svg viewBox="0 0 560 560" width="560" height="560">${vongTron(9, 210, (x, y, i) => {
      const n = i + 1, on = (c.to ?? []).includes(n);
      return `<circle cx="${x}" cy="${y}" r="${on ? 52 : 40}" fill="${on ? "#2a2140" : "#fffaf0"}" stroke="${on ? "#2a2140" : "#cbb88d"}" stroke-width="3"/><text x="${x}" y="${y + 13}" text-anchor="middle" font-family="NR" font-size="${on ? 44 : 34}" fill="${on ? "#f0c66b" : "#2a2140"}">${n}</text>`;
    })}<text x="280" y="270" text-anchor="middle" font-family="NR" font-size="40" fill="#a8741a">${e(c.giua ?? "")}</text><text x="280" y="310" text-anchor="middle" font-family="BV" font-size="22" fill="#5d5170">${e(c.giua_phu ?? "")}</text></svg>`;
  },
  ngu_hanh(c) {   // năm hành: vòng sinh (liền) + sao khắc (đứt)
    const H = ["Mộc", "Hoả", "Thổ", "Kim", "Thuỷ"], M = ["#5f9e7c", "#c9773a", "#b8913f", "#8a8fa3", "#4f7fb0"];
    const p = H.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [280 + 200 * Math.cos(a), 280 + 200 * Math.sin(a)]; });
    const sinh = p.map(([x, y], i) => { const [x2, y2] = p[(i + 1) % 5]; return `<path d="M${x} ${y} L${x2} ${y2}" stroke="#cbb88d" stroke-width="5"/>`; }).join("");
    const khac = p.map(([x, y], i) => { const [x2, y2] = p[(i + 2) % 5]; return `<path d="M${x} ${y} L${x2} ${y2}" stroke="#d9c9a3" stroke-width="3" stroke-dasharray="10 10"/>`; }).join("");
    return `<svg viewBox="0 0 560 560" width="560" height="560">${sinh}${khac}${p.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${(c.to ?? []).includes(H[i]) ? 70 : 60}" fill="${(c.to ?? []).includes(H[i]) ? M[i] : "#fffaf0"}" stroke="${M[i]}" stroke-width="5"/><text x="${x}" y="${y + 12}" text-anchor="middle" font-family="NR" font-size="34" fill="${(c.to ?? []).includes(H[i]) ? "#fff" : "#2a2140"}">${H[i]}</text>`).join("")}</svg>`;
  },
  tru(c) {   // tứ trụ
    return `<svg viewBox="0 0 560 560" width="560" height="560">${c.tru.map(([can, chi, ten], i) => {
      const x = 20 + i * 132, on = i === (c.on ?? 2);
      return `<rect x="${x}" y="60" width="118" height="400" rx="18" fill="${on ? "#2a2140" : "#fffaf0"}" stroke="${on ? "#2a2140" : "#cbb88d"}" stroke-width="3"/>
        <text x="${x + 59}" y="200" text-anchor="middle" font-family="NR" font-size="40" fill="${on ? "#f0c66b" : "#2a2140"}">${e(can)}</text>
        <text x="${x + 59}" y="330" text-anchor="middle" font-family="NR" font-size="40" fill="${on ? "#f0c66b" : "#2a2140"}">${e(chi)}</text>
        <text x="${x + 59}" y="505" text-anchor="middle" font-family="BV" font-size="22" fill="#5d5170">${e(ten)}</text>`;
    }).join("")}</svg>`;
  },
  la_ban(c) {   // la bàn 8 hướng, tô hướng tốt
    const H = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
    const nem = H.map((h, i) => {
      const a = -Math.PI / 2 - i * Math.PI / 4 + Math.PI;   // Bắc ở dưới như la bàn phong thuỷ? giữ Bắc ở TRÊN cho dễ đọc
      const g = -Math.PI / 2 + i * Math.PI / 4, x = 280 + 205 * Math.cos(g), y = 280 + 205 * Math.sin(g); void a;
      const on = (c.tot ?? []).includes(h);
      return `<circle cx="${x}" cy="${y}" r="56" fill="${on ? "#e9f3ec" : "#fffaf0"}" stroke="${on ? "#5f9e7c" : "#cbb88d"}" stroke-width="4"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-family="BV" font-size="${h.length > 4 ? 19 : 24}" fill="#2a2140">${h}</text>`;
    }).join("");
    return `<svg viewBox="0 0 560 560" width="560" height="560"><circle cx="280" cy="280" r="150" fill="#fffaf0" stroke="#d9c9a3" stroke-width="3"/><circle cx="280" cy="280" r="205" fill="none" stroke="#d9c9a3" stroke-width="2" stroke-dasharray="6 9"/>
      <path d="M280 150 L300 280 L280 410 L260 280 Z" fill="#2a2140"/><path d="M280 150 L300 280 L260 280 Z" fill="#a8741a"/>${nem}
      <text x="280" y="250" text-anchor="middle" font-family="NR" font-size="0"></text></svg>`;
  },
  mat(c) {   // gương mặt chia tam đình
    return `<svg viewBox="0 0 560 560" width="560" height="560"><g transform="translate(-40 0)">
      <ellipse cx="280" cy="290" rx="160" ry="225" fill="#fffaf0" stroke="#2a2140" stroke-width="6"/>
      <path d="M150 215 L410 215 M135 365 L425 365" stroke="#a8741a" stroke-width="4" stroke-dasharray="12 10"/>
      <path d="M200 255 Q225 240 250 255 M310 255 Q335 240 360 255" stroke="#2a2140" stroke-width="6" fill="none"/>
      <path d="M280 265 L262 335 L298 335" stroke="#2a2140" stroke-width="5" fill="none"/><path d="M235 410 Q280 430 325 410" stroke="#2a2140" stroke-width="6" fill="none"/></g>
      ${(c.nhan_dinh ?? ["Thượng đình", "Trung đình", "Hạ đình"]).map((t, i) => `<text x="418" y="${150 + i * 150}" font-family="BV" font-size="22" fill="#5d5170">${e(t)}</text>`).join("")}</svg>`;
  },
  hai(c) {   // hai người (hợp đôi / sếp – đồng nghiệp)
    return `<svg viewBox="0 0 560 560" width="560" height="560"><circle cx="200" cy="280" r="150" fill="#fffaf0" stroke="#2a2140" stroke-width="5"/><circle cx="360" cy="280" r="150" fill="#f6efe0" fill-opacity=".7" stroke="#a8741a" stroke-width="5"/>
      <text x="150" y="292" text-anchor="middle" font-family="NR" font-size="40" fill="#2a2140">${e(c.a ?? "A")}</text><text x="410" y="292" text-anchor="middle" font-family="NR" font-size="40" fill="#a8741a">${e(c.b ?? "B")}</text>
      <text x="280" y="292" text-anchor="middle" font-family="BV" font-size="24" fill="#5d5170">${e(c.giua ?? "")}</text></svg>`;
  },
  sao(c) {   // vòng 12 nhà chiêm tinh
    return `<svg viewBox="0 0 560 560" width="560" height="560"><circle cx="280" cy="280" r="230" fill="#fffaf0" stroke="#2a2140" stroke-width="5"/><circle cx="280" cy="280" r="150" fill="none" stroke="#cbb88d" stroke-width="3"/>
      ${vongTron(12, 230, (x, y) => `<path d="M280 280 L${x} ${y}" stroke="#d9c9a3" stroke-width="2"/>`)}${vongTron(12, 190, (x, y, i) => `<text x="${x}" y="${y + 9}" text-anchor="middle" font-family="NR" font-size="26" fill="#2a2140">${i + 1}</text>`)}
      <circle cx="280" cy="280" r="34" fill="#2a2140"/><circle cx="280" cy="280" r="14" fill="#f0c66b"/></svg>`;
  },
  bac_thang(c) {   // bậc thang nghề nghiệp / tiền bạc
    return `<svg viewBox="0 0 560 560" width="560" height="560">${(c.bac ?? ["1", "2", "3", "4"]).map((t, i) => `<rect x="${40 + i * 120}" y="${420 - i * 95}" width="120" height="${95 + i * 95}" rx="12" fill="${i === (c.on ?? 3) ? "#2a2140" : "#fffaf0"}" stroke="#cbb88d" stroke-width="3"/><text x="${100 + i * 120}" y="${470 - i * 95}" text-anchor="middle" font-family="BV" font-size="22" fill="${i === (c.on ?? 3) ? "#f0c66b" : "#2a2140"}">${e(t)}</text>`).join("")}</svg>`;
  },
  nha(c) {
    return `<svg viewBox="0 0 560 560" width="560" height="560"><path d="M80 260 L280 90 L480 260" fill="none" stroke="#2a2140" stroke-width="14" stroke-linejoin="round"/>
      <rect x="130" y="250" width="300" height="230" rx="10" fill="#fffaf0" stroke="#2a2140" stroke-width="8"/><rect x="245" y="350" width="70" height="130" rx="6" fill="#e9dcc0" stroke="#2a2140" stroke-width="6"/>
      <rect x="165" y="300" width="60" height="55" rx="5" fill="#f0c66b"/><rect x="335" y="300" width="60" height="55" rx="5" fill="#f0c66b"/>
      ${(c.chu ?? []).map((t, i) => `<g><rect x="${20 + i * 175}" y="505" width="165" height="44" rx="22" fill="${i === (c.on ?? -1) ? "#2a2140" : "#fffaf0"}" stroke="#cbb88d" stroke-width="2"/><text x="${102 + i * 175}" y="535" text-anchor="middle" font-family="BV" font-size="20" fill="${i === (c.on ?? -1) ? "#f0c66b" : "#2a2140"}">${e(t)}</text></g>`).join("")}</svg>`;
  },
};

// ---------- bố cục ----------
function bia(c, url) {
  return `<div class="k"><div class="logo">${LOGO}</div><div class="nhan">${e(c.nhan ?? "Blog Hiểu Bản Thân")}</div>
  <div style="position:absolute;left:96px;top:120px;bottom:150px;width:840px;display:flex;flex-direction:column;justify-content:center">
    <div style="font-size:28px;color:#a8741a;letter-spacing:.08em;margin-bottom:22px">${e(c.tren)}</div>
    <div class="tde" style="font-size:${c.co ?? 78}px;line-height:1.08">${nhan(c.tieu_de)}</div>
    <div style="font-size:32px;color:#4b4060;margin-top:28px;line-height:1.35">${nhan(c.phu)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:36px">${(c.chip ?? []).map((x) =>
      `<span style="font-size:25px;padding:10px 22px;border-radius:40px;background:#fffaf0;border:2px solid #d9c9a3">${nhan(x)}</span>`).join("")}</div>
  </div>
  <div style="position:absolute;right:100px;top:150px;width:560px;height:560px;transform:scale(.92);transform-origin:center">${MOTIF[c.motif](c)}</div>
  <div style="position:absolute;right:66px;bottom:62px;display:flex;flex-direction:column;align-items:center;gap:8px;background:#fff;padding:12px 12px 8px;border-radius:14px;border:2px solid #d9c9a3">
    ${qrSvg(url, 120)}<span style="font-size:18px;color:#5d5170">Quét để đọc bài</span></div>
  <div style="position:absolute;left:96px;bottom:66px;font-size:26px;color:#7b6a48">hieuban.com</div></div>`;
}
const khung = (c, than) => `<div class="k"><div class="logo">${LOGO}</div><div class="nhan">${e(c.nhan ?? "")}</div>
  <div style="position:absolute;left:96px;right:96px;top:136px">
    <div class="tde" style="font-size:${c.co ?? 54}px;line-height:1.12">${nhan(c.tieu_de)}</div>
    ${c.phu ? `<div style="font-size:27px;color:#5d5170;margin-top:12px">${nhan(c.phu)}</div>` : ""}
    <div style="margin-top:30px">${than}</div></div>
  ${c.chu_thich ? `<div style="position:absolute;left:96px;right:96px;bottom:56px;font-size:22px;color:#7b6a48;line-height:1.35">${nhan(c.chu_thich)}</div>` : ""}</div>`;
const bang = (c) => khung(c, `${c.dem ? `<style>td,th{padding:${c.dem}px 18px !important}</style>` : ""}<table style="font-size:${c.co_bang ?? 28}px"><thead><tr>${c.cot.map((x) => `<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${
  c.dong.map((r) => `<tr>${r.map((x, i) => `<td class="${typeof x === "object" ? x.l : ""}" style="${i === 0 ? "font-weight:600" : ""}">${nhan(typeof x === "object" ? x.t : x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
const buoc = (c) => khung(c, `<div style="display:grid;grid-template-columns:repeat(${c.cot_so ?? c.buoc.length},1fr);gap:22px">${c.buoc.map((b, i) =>
  `<div style="background:#fffaf0;border:2px solid #d9c9a3;border-radius:22px;padding:26px 24px;min-height:${c.cao ?? 340}px">
    <div style="width:60px;height:60px;border-radius:50%;background:#2a2140;color:#f0c66b;display:flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:18px">${b.so ?? i + 1}</div>
    <div class="tde" style="font-size:${c.co_tde ?? 34}px;line-height:1.15;margin-bottom:12px">${nhan(b.t)}</div>
    <div style="font-size:${c.co_chu ?? 24}px;line-height:1.4;color:#4b4060">${nhan(b.d)}</div></div>`).join("")}</div>`);
// Cột ngang (điểm ngũ hành, tỉ lệ…)
const cot = (c) => khung(c, `<div style="display:flex;flex-direction:column;gap:20px">${c.muc.map((m) => `
  <div style="display:grid;grid-template-columns:${c.nhan_rong ?? 220}px 1fr 160px;align-items:center;gap:22px">
    <div class="tde" style="font-size:34px">${nhan(m.t)}</div>
    <div style="height:46px;background:#efe4cc;border-radius:23px;overflow:hidden"><div style="height:100%;width:${Math.max(2, m.p)}%;background:${m.mau ?? "#2a2140"};border-radius:23px"></div></div>
    <div style="font-size:30px;color:#2a2140">${nhan(m.so)}</div></div>`).join("")}</div>`);
// Hai quẻ cạnh nhau, có nhãn hào
const haiQue = (c) => khung(c, `<div style="display:flex;gap:60px;align-items:flex-start">${c.que.map((q) => `
  <div style="flex:1;background:#fffaf0;border:2px solid #d9c9a3;border-radius:22px;padding:24px 30px">
    <div class="tde" style="font-size:36px;margin-bottom:6px">${nhan(q.ten)}</div><div style="font-size:23px;color:#5d5170;margin-bottom:14px">${nhan(q.phu)}</div>
    <svg width="560" height="300" viewBox="0 0 560 300">${q.bits.map((b, i) => {
      const y = 10 + (5 - i) * 48, dong = (q.dong ?? []).includes(i + 1), mau = dong ? "#a8741a" : "#2a2140";
      const vach = b ? `<rect x="90" y="${y}" width="300" height="28" rx="6" fill="${mau}"/>` : `<rect x="90" y="${y}" width="130" height="28" rx="6" fill="${mau}"/><rect x="260" y="${y}" width="130" height="28" rx="6" fill="${mau}"/>`;
      return `${vach}<text x="0" y="${y + 22}" font-family="BV" font-size="20" fill="#7b6a48">hào ${i + 1}</text>${q.ghi?.[i] ? `<text x="408" y="${y + 22}" font-family="BV" font-size="20" fill="${dong ? "#a8741a" : "#5d5170"}">${e(q.ghi[i])}</text>` : ""}`;
    }).join("")}</svg></div>`).join("")}</div>`);
// Lá số 12 cung (lưới 4×4)
const laSo = (c) => {
  const o = { "Tỵ": [0, 0], "Ngọ": [0, 1], "Mùi": [0, 2], "Thân": [0, 3], "Thìn": [1, 0], "Dậu": [1, 3], "Mão": [2, 0], "Tuất": [2, 3], "Dần": [3, 0], "Sửu": [3, 1], "Tý": [3, 2], "Hợi": [3, 3] };
  return khung(c, `<div style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,128px);gap:10px;font-size:20px">
    ${c.cung.map((g) => { const [r, k] = o[g.chi]; return `<div style="grid-row:${r + 1};grid-column:${k + 1};background:${g.l === "nhan" ? "#2a2140" : g.l === "phu" ? "#f3ead6" : "#fffaf0"};color:${g.l === "nhan" ? "#f6f0e2" : "#2a2140"};border:2px solid ${g.l ? "#a8741a" : "#d9c9a3"};border-radius:14px;padding:10px 14px">
      <div style="display:flex;justify-content:space-between"><span class="tde" style="font-size:26px;color:${g.l === "nhan" ? "#f0c66b" : "#2a2140"}">${e(g.ten)}</span><span style="color:${g.l === "nhan" ? "#d8cfbd" : "#7b6a48"}">${e(g.chi)}</span></div>
      <div style="margin-top:6px;line-height:1.3">${nhan(g.sao || "(không có chính tinh)")}</div></div>`; }).join("")}
    <div style="grid-row:2/4;grid-column:2/4;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:14px;color:#4b4060;font-size:23px;line-height:1.45">${(c.giua ?? []).map((x) => `<div>${nhan(x)}</div>`).join("")}</div></div>`);
};
const BO_CUC = { bia, bang, buoc, cot, hai_que: haiQue, la_so: laSo };

// ---------- nội dung ảnh ----------
// Lá số ví dụ dùng trong nhiều ảnh: nữ, 14/9/1992 dương lịch, 08:30 (giờ Thìn) — engine /v1/tuvi/an-sao, /v1/battu/la-so.
const T3 = "../kw6t-tuan-3/anh";
const LA_SO_VI_DU = [
  { ten: "Mệnh", chi: "Tỵ", sao: "Thiên Lương (Hãm)" }, { ten: "Phụ Mẫu", chi: "Ngọ", sao: "Thất Sát (Miếu)" },
  { ten: "Phúc Đức", chi: "Mùi", sao: "" }, { ten: "Điền Trạch", chi: "Thân", sao: "Liêm Trinh (Vượng)" },
  { ten: "Quan Lộc", chi: "Dậu", sao: "" }, { ten: "Nô Bộc", chi: "Tuất", sao: "Phá Quân (Đắc)" },
  { ten: "Thiên Di", chi: "Hợi", sao: "Thiên Đồng (Đắc)" }, { ten: "Tật Ách", chi: "Tý", sao: "Vũ Khúc, Thiên Phủ" },
  { ten: "Tài Bạch", chi: "Sửu", sao: "Thái Dương, Thái Âm · Thân" }, { ten: "Tử Nữ", chi: "Dần", sao: "Tham Lang (Đắc)" },
  { ten: "Phu Thê", chi: "Mão", sao: "Thiên Cơ, Cự Môn (Miếu)" }, { ten: "Huynh Đệ", chi: "Thìn", sao: "Tử Vi, Thiên Tướng" },
];

export const NOI_DUNG = {
  // ===== ẢNH BÌA 21 bài NotFair (tiêu đề chữ trên bìa — ngắn hơn tiêu đề SEO) =====
  "bia-dai-van-tu-vi.webp": { loai: "bia", tren: "TỬ VI · ĐẠI VẬN", tieu_de: "Đọc *đại vận* lá số Tử vi", phu: "6 bước luận có căn cứ, kèm ví dụ một lá số thật", chip: ["Mỗi vận 10 năm", "Thuận / nghịch", "Đặt năm vào vận"], motif: "la_so", to: ["Dần"], giua: "36–45 tuổi", giua_phu: "vận ở cung Tử Nữ" },
  "bia-vi-du-duong-doi.webp": { loai: "bia", tren: "THẦN SỐ HỌC · VÍ DỤ", tieu_de: "Tính số *Đường đời* từng bước", phu: "14/09/1992 → 35 → 8, và vì sao có ngày ra hai số", chip: ["Cộng hết một lượt", "Rút gọn từng phần", "11 · 22 · 33"], motif: "so", to: [8], giua: "1+4+0+9+1+9+9+2", giua_phu: "= 35 → 8" },
  "bia-que-phuc-hy.webp": { loai: "bia", tren: "KINH DỊCH · GIEO XU", tieu_de: "Gieo xu, nhận *Bát quái*, lập quẻ biến", phu: "Ví dụ 7 8 9 7 8 6: Lôi Hoả Phong biến Hoả Lôi Phệ Hạp", chip: ["Ba đồng xu × 6 lượt", "Hào động 6 và 9", "Quẻ biến"], motif: "que", ban: [1, 0, 1, 1, 0, 0], dong: [3, 6], bien: [1, 0, 0, 1, 0, 1], ten_ban: "Phong (55)", ten_bien: "Phệ Hạp (21)", giua_phu: "hào 3 và hào 6 động" },
  "bia-xem-tuong.webp": { loai: "bia", tren: "NHÂN TƯỚNG HỌC", tieu_de: "*Xem tướng*: đọc nét mặt theo sách xưa", phu: "Tam đình, tuổi trên gương mặt, và chỗ dễ đọc sai", chip: ["Tam đình", "Tuổi trên mặt", "Giới hạn cần biết"], motif: "mat" },
  "bia-mai-hoa.webp": { loai: "bia", tren: "KINH DỊCH · MAI HOA", tieu_de: "Lập quẻ *Mai Hoa* theo thời điểm", phu: "Năm + tháng + ngày âm ra quẻ trên, thêm giờ ra quẻ dưới", chip: ["Thể và Dụng", "Hào động", "Ví dụ có số"], motif: "que", ban: [1, 0, 1, 0, 1, 1], dong: [5], bien: [1, 0, 1, 0, 0, 1], ten_ban: "Gia Nhân (37)", ten_bien: "Bí (22)", giua_phu: "9:15 ngày 20/11/2026" },
  "bia-tai-loc.webp": { loai: "bia", tren: "TIỀN BẠC · KẾ HOẠCH", tieu_de: "Xem *tài lộc* rồi làm gì với tiền", phu: "Biến lời gợi ý thành kế hoạch đo được", chip: ["Năm nên chú ý", "Quỹ dự phòng", "Không phải lời khuyên đầu tư"], motif: "bac_thang", bac: ["Ghi", "Giữ", "Dự phòng", "Tăng thu"], on: 2 },
  "bia-van-han.webp": { loai: "bia", tren: "TỬ VI · VẬN HẠN", tieu_de: "Đọc *vận hạn* Tử vi cho tỉnh táo", phu: "Đại hạn 10 năm, lưu niên từng năm, và chỗ lời luận dừng lại", chip: ["Đại hạn", "Lưu niên", "Nên chú ý, không doạ"], motif: "la_so", to: ["Dần", "Mùi"], giua: "10 năm", giua_phu: "một đại hạn" },
  "bia-su-nghiep.webp": { loai: "bia", tren: "SỰ NGHIỆP · BA MÔN", tieu_de: "Xem *sự nghiệp* qua ba môn", phu: "Thần số, Tử vi, Bát tự — mỗi môn trả lời một câu khác nhau", chip: ["Đường đời", "Cung Quan Lộc", "Thập thần"], motif: "bac_thang", bac: ["Thử", "Đo", "Chọn", "Đi tiếp"], on: 3 },
  "bia-cach-tinh-than-so.webp": { loai: "bia", tren: "THẦN SỐ HỌC · CÁCH TÍNH", tieu_de: "Tính thần số học từ *ngày sinh và họ tên*", phu: "Đường đời, Sứ mệnh, Linh hồn, Nhân cách — tự kiểm được", chip: ["Bảng chữ Pitago", "Y là phụ âm", "Bỏ dấu trước khi tính"], motif: "so", to: [6, 9], giua: "6 · 9 · 9 · 9", giua_phu: "Nguyễn Minh Anh, 24/10/1988" },
  "bia-ten-ngu-hanh.webp": { loai: "bia", tren: "ĐẶT TÊN · NGŨ HÀNH", tieu_de: "Đặt *tên theo ngũ hành*: 6 bước", phu: "Nghĩa trước, hành sau — tên vẫn phải dễ gọi, dễ viết", chip: ["Tiêu chí gia đình", "Hành của chữ", "Đọc thử to"], motif: "ngu_hanh", to: ["Mộc"] },
  "bia-vong-ngu-hanh.webp": { loai: "bia", tren: "NGŨ HÀNH · SƠ ĐỒ", tieu_de: "Đọc *vòng tương sinh, tương khắc*", phu: "Đường liền là sinh, đường đứt là khắc — khắc không có nghĩa là xấu", chip: ["Mộc → Hoả → Thổ → Kim → Thuỷ", "Chế ước", "Cân bằng"], motif: "ngu_hanh", to: [] },
  "bia-tu-vi-la-gi.webp": { loai: "bia", tren: "TỬ VI · NHẬP MÔN", tieu_de: "*Tử vi* là gì?", phu: "Lá số 12 cung dựng từ ngày giờ sinh âm lịch — đọc thế nào, dừng ở đâu", chip: ["12 cung", "14 chính tinh", "Giờ sinh quyết định cung Mệnh"], motif: "la_so", to: ["Tỵ"], giua: "12 cung", giua_phu: "một lá số" },
  "bia-tron-doi.webp": { loai: "bia", tren: "TỬ VI · LUẬN GIẢI", tieu_de: "Luận lá số Tử vi *trọn đời*", phu: "6 bước đọc và tự đối chiếu với đời mình", chip: ["Xác minh giờ sinh", "Cung trước, sao sau", "Đối chiếu năm đã qua"], motif: "la_so", to: ["Tỵ", "Dậu", "Sửu"], giua: "Mệnh", giua_phu: "và tam hợp" },
  "bia-ngu-hanh-la-gi.webp": { loai: "bia", tren: "NGŨ HÀNH · NHẬP MÔN", tieu_de: "*Ngũ hành* là gì?", phu: "Kim, Mộc, Thuỷ, Hoả, Thổ và các mối quan hệ — kèm ví dụ một lá Bát tự", chip: ["Tương sinh", "Tương khắc", "Mệnh năm ≠ hành ngày sinh"], motif: "ngu_hanh", to: ["Kim", "Thuỷ"] },
  "bia-tu-hieu-minh.webp": { loai: "bia", tren: "TỰ HIỂU MÌNH", tieu_de: "Tự hiểu mình qua *giá trị và thói quen*", phu: "Bắt đầu từ một tình huống có thật, không từ một nhãn tính cách", chip: ["Ghi lại", "Nhận ra", "Chọn một việc"], motif: "so", to: [], giua: "Bạn", giua_phu: "ngày hôm nay" },
  "bia-astrology.webp": { loai: "bia", tren: "CHIÊM TINH PHƯƠNG TÂY", tieu_de: "*Astrology* là gì?", phu: "Bản đồ sao, 12 nhà — và khác Tử vi, Bát tự ở đâu", chip: ["Cung Mặt Trời", "Cung mọc", "12 nhà"], motif: "sao" },
  "bia-hop-sep.webp": { loai: "bia", tren: "CÔNG VIỆC · QUAN HỆ", tieu_de: "Xem *hợp sếp, đồng nghiệp* thế nào cho hữu ích", phu: "Dùng để hiểu cách làm việc khác nhau, không để chọn người", chip: ["Nhịp làm việc", "Cách góp ý", "Không chấm người"], motif: "hai", a: "Bạn", b: "Sếp", giua: "cách làm việc" },
  "bia-hop-doi.webp": { loai: "bia", tren: "TÌNH CẢM · HỢP ĐÔI", tieu_de: "Xem *hợp đôi* theo ngày sinh", phu: "Đọc sao cho tỉnh táo — kết quả là gợi ý để hai người nói chuyện", chip: ["Thần số: không chấm điểm", "Tử vi: điểm tham khảo", "Cần cả hai đồng ý"], motif: "hai", a: "6", b: "9", giua: "hai nhịp" },
  "bia-chon-mon.webp": { loai: "bia", tren: "CHỌN ĐÚNG MÔN", tieu_de: "*Kinh Dịch, Huyền Không hay Bát tự*?", phu: "Việc nào nên hỏi môn nào — một câu hỏi, một công cụ", chip: ["Một việc cụ thể → quẻ", "Ngôi nhà → phong thuỷ", "Con người → Bát tự"], motif: "que", ban: [1, 1, 1, 0, 0, 0], dong: [], bien: [0, 0, 0, 1, 1, 1], ten_ban: "Thái (11)", ten_bien: "Bĩ (12)", giua_phu: "" },
  "bia-tu-danh-gia-nha.webp": { loai: "bia", tren: "PHONG THUỶ · NHÀ Ở", tieu_de: "Tự đánh giá *phong thuỷ nhà ở*", phu: "Hình thế trước, hướng sau — và việc nào nên làm trước", chip: ["Ánh sáng, gió, lối đi", "Hướng hợp tuổi", "Việc 0 đồng"], motif: "la_ban", tot: ["Đông Bắc", "Tây Nam", "Tây", "Tây Bắc"] },
  "bia-cach-xem-tu-vi.webp": { loai: "bia", tren: "TỬ VI · TỪNG BƯỚC", tieu_de: "Cách xem *Tử vi*: lập lá số, đọc 12 cung", phu: "Kèm ví dụ một câu hỏi về công việc trên lá số thật", chip: ["Chuẩn bị dữ liệu", "Tìm cung Mệnh", "Cung trống mượn đối cung"], motif: "la_so", to: ["Dậu", "Mão"], giua: "Quan Lộc", giua_phu: "mượn sao cung Mão" },

  // ===== KW-6T tuần 3 (4 bài) — ghi vào ../kw6t-tuan-3/anh =====
  "ts-hai-ket-qua-bia.webp": { thu: T3, loai: "bia", tren: "THẦN SỐ HỌC · CÁCH TÍNH", tieu_de: "Vì sao trang này ra *33*, trang kia ra *6*?", phu: "Ba lý do thần số học ra 2 kết quả khác nhau — và cách tự kiểm", chip: ["Cách cộng", "Tên đem tính", "Pitago / Chaldea"], motif: "so", to: [6], giua: "24/10/1988", giua_phu: "33 hay 6?" },
  "ts-hai-cach-cong-1940-2010.webp": { thu: T3, loai: "bang", nhan: "Thần số học", tieu_de: "Ngày sinh 1940–2010: hai cách cộng lệch nhau ở đâu?", phu: "Engine tính *25.933 ngày sinh*: *3.573 ngày (13,8%)* ra hai số Đường đời khác nhau — luôn chỉ ở số cái", co_bang: 27,
    cot: ["Cộng hết một lượt", "Rút gọn từng phần", "Số ngày", "Ví dụ"],
    dong: [["33", "6", "1.295", "24/10/1988"], ["11", "2", "979", "11/04/1985"], ["4", "22", "626", "11/06/1985"], ["22", "4", "430", "02/01/1990"], ["2", "11", "212", "19/08/2000"], ["6", "33", "31", "22/09/2000"]],
    chu_thich: "Không có ngày nào một cách ra 5 còn cách kia ra 8: lệch chỉ xảy ra giữa số cái và số gốc của nó (33–6, 22–4, 11–2)." },
  "ts-mot-nguoi-nhieu-con-so.webp": { thu: T3, loai: "bang", nhan: "Ví dụ minh hoạ", tieu_de: "Một người, nhiều con số: Nguyễn Minh Anh, 24/10/1988", phu: "Mọi số chạy bằng engine Hiểu Bản Thân · tên bỏ dấu trước khi tính · Y tính là phụ âm", co_bang: 26,
    cot: ["Con số", "Cách A", "Cách B", "Vì sao khác"],
    dong: [["Đường đời", "33 (cộng hết)", "6 (rút gọn từng phần)", "Hai cách cộng"], ["Sứ mệnh", "9 (Nguyễn Minh Anh)", "4 (Minh Anh)", "Tên khai sinh / tên thường gọi"], ["Linh hồn", "9", "1", "Tên khai sinh / tên thường gọi"], ["Nhân cách", "9", "3", "Tên khai sinh / tên thường gọi"], [{ t: "Tên gọi (Chaldea)", l: "noi" }, { t: "Pitago: không có", l: "noi" }, { t: "Anh: 1 + 5 + 5 = 11 → 2", l: "noi" }, { t: "Hai trường phái", l: "noi" }]] },
  "ts-do-loi-4-buoc.webp": { thu: T3, loai: "buoc", nhan: "Tự dò", tieu_de: "Hai kết quả lệch nhau: dò theo thứ tự này", co_tde: 30, co_chu: 22, cao: 330,
    buoc: [{ t: "Cách cộng", d: "Cộng hết một lượt hay rút gọn ngày, tháng, năm riêng? Lệch 33–6, 22–4, 11–2 là do đây." }, { t: "Tên đem tính", d: "Tên khai sinh đầy đủ hay tên thường gọi? Chữ Y là nguyên âm hay phụ âm?" }, { t: "Trường phái", d: "Pitago (1–9 theo bảng chữ cái) hay Chaldea (1–8 theo âm đọc)?" }, { t: "Lỗi nhập", d: "Ngày âm / dương, đảo ngày tháng, bỏ dấu, chữ Đ, năm đủ 4 số." }] },

  "ts-co-dung-khong-bia.webp": { thu: T3, loai: "bia", tren: "THẦN SỐ HỌC · TỰ KIỂM", tieu_de: "Thần số học *có đúng không*?", phu: "Tự kiểm trong 2 phút bằng 3 điểm mạnh, 3 điểm mù của số bạn", chip: ["Hiệu ứng Barnum", "Tích nét đúng", "Từ 4/6 nét"], motif: "so", to: [6, 7], giua: "6 nét", giua_phu: "3 mạnh · 3 mù" },
  "ts-forer-1949.webp": { thu: T3, loai: "buoc", nhan: "Hiệu ứng Barnum", tieu_de: "Thí nghiệm Forer năm 1949: vì sao ai đọc cũng thấy đúng", co_tde: 32, co_chu: 24, cao: 320,
    buoc: [{ t: "39 sinh viên", d: "Mỗi người nhận một bài \"phân tích tính cách riêng\"." }, { t: "Cùng một đoạn văn", d: "Thực ra cả lớp nhận chung một bản, ghép từ câu tử vi trên báo." }, { t: "Chấm *4,26 / 5*", d: "Độ đúng trung bình sinh viên tự chấm cho bài \"của mình\"." }],
    chu_thich: "Câu càng chung chung càng dễ thấy là nói về mình. Vì vậy cần kiểm bằng câu cụ thể, có cả điểm mù." },
  "ts-the-kiem-chung-6-7.webp": { thu: T3, loai: "bang", nhan: "Kho chân dung thần số", tieu_de: "Tích những nét đúng với bạn: số 6 hay số 7?", co_bang: 25,
    cot: ["", "Số 6", "Số 7"],
    dong: [[{ t: "Điểm mạnh", l: "tot" }, "Tận tâm, có trách nhiệm", "Phân tích sắc, tư duy độc lập"], ["", "Ấm áp, biết chăm sóc", "Trực giác tốt, nhìn ra điều người khác bỏ sót"], ["", "Có gu thẩm mỹ, tạo không gian dễ chịu", "Tập trung sâu, chuyên môn cao"],
      [{ t: "Điểm mù", l: "xau" }, "Lo thay, quyết thay cho người khác", "Khép kín, khó chia sẻ cảm xúc"], ["", "Hy sinh rồi mong được đền đáp", "Hoài nghi, khó tin người"], ["", "Cầu toàn, khó chấp nhận sự không hoàn hảo", "Dễ nghĩ quá nhiều mà làm quá ít"]],
    chu_thich: "Điểm mù đáng tin hơn điểm mạnh: ít ai nhận nhầm điểm mù cho vui." },
  "ts-nguong-tu-kiem.webp": { thu: T3, loai: "buoc", nhan: "Tự kiểm", tieu_de: "Tích 6 nét rồi đọc kết quả theo ngưỡng", co_tde: 34, co_chu: 25, cao: 300,
    buoc: [{ so: "4+", t: "Khá đúng", d: "Số này đáng đọc tiếp: xem hướng lớn và lúc căng thẳng của số." }, { so: "2–3", t: "Đúng một phần", d: "Có thể một con số khác của chính bạn đang trội hơn ở mặt này." }, { so: "0–1", t: "Chưa giống bạn", d: "Con số không phải khuôn. Ghi lại, và thử số khác hoặc tên thường gọi." }] },

  "tv-khong-gio-bia.webp": { thu: T3, loai: "bia", tren: "TỬ VI · GIỜ SINH", tieu_de: "Không biết *giờ sinh* có xem Tử vi được không?", co: 70, phu: "Giờ sinh quyết định cung Mệnh — và 3 cách xử lý khi quên giờ", chip: ["Khoanh khoảng giờ", "Định giờ bằng năm đã qua", "Phần không cần giờ"], motif: "la_so", to: [], giua: "Mệnh ở đâu?", giua_phu: "cần canh giờ sinh" },
  "tv-ba-cach-khong-biet-gio.webp": { thu: T3, loai: "buoc", nhan: "Không biết giờ sinh", tieu_de: "Ba cách xử lý khi không biết giờ sinh", co_tde: 32, co_chu: 23, cao: 330,
    buoc: [{ t: "Khoanh khoảng giờ", d: "Giấy chứng sinh, sổ tiêm, người thân. Chỉ cần đúng canh 2 tiếng." }, { t: "Định giờ bằng năm đã qua", d: "Chọn năm nhớ rõ, tích câu đúng cho từng canh, tự so số câu khớp." }, { t: "Dùng phần không cần giờ", d: "Ba trụ Bát tự, thần số học, hướng nhà, tuổi làm nhà, sao hạn." }] },
  "tv-phan-khong-can-gio.webp": { thu: T3, loai: "bang", nhan: "Không biết giờ sinh", tieu_de: "Chưa biết giờ sinh vẫn xem được những gì?", co_bang: 26,
    cot: ["Phần", "Cần giờ sinh?", "Xem được gì"],
    dong: [["Bát tự", { t: "Không bắt buộc", l: "tot" }, "Ba trụ năm, tháng, ngày + năm hành của ba trụ"], ["Thần số học", { t: "Không", l: "tot" }, "Bốn con số chính từ ngày sinh, họ tên"], ["Hướng nhà hợp tuổi", { t: "Không", l: "tot" }, "Cung phi, bốn hướng tốt"], ["Tuổi làm nhà, xông đất, sao hạn", { t: "Không", l: "tot" }, "Theo năm sinh âm lịch"], ["Tử vi", { t: "Có", l: "xau" }, "\"Không biết giờ\": lập tạm giờ Ngọ, ghi rõ phần chưa tin được"]] },

  "pt-nha-cu-bia.webp": { thu: T3, loai: "bia", tren: "PHONG THUỶ · MUA NHÀ", tieu_de: "Mua nhà cũ: *12 điều* nên xem trước khi đặt cọc", co: 70, phu: "Hình thế trước, hướng sau — và điện, nước, thấm, mối", chip: ["5 ngoài nhà", "4 trong nhà", "3 đất và hướng"], motif: "nha", chu: ["Ngoài nhà", "Trong nhà", "Hướng"], on: 0 },
  "pt-12-dieu-nha-cu.webp": { thu: T3, loai: "buoc", nhan: "Xem nhà cũ", tieu_de: "12 điều phong thuỷ nên xem khi mua nhà cũ", co: 44, cot_so: 4, co_tde: 23, co_chu: 18, cao: 150,
    buoc: [{ t: "Đường đâm thẳng", d: "gió, bụi dồn vào cửa" }, { t: "Ngã ba, ngã tư", d: "ồn, đèn xe nhiều phía" }, { t: "Cột điện, cây lớn", d: "chắn sáng, chắn lối" }, { t: "Nền thấp hơn đường", d: "nước, bùn chảy vào" },
      { t: "Sát đường lớn", d: "ồn, bụi, ngủ nông" }, { t: "WC giữa nhà", d: "ẩm, mùi đọng giữa nhà" }, { t: "Cửa thông ban công", d: "gió lùa, mất riêng tư" }, { t: "Bếp đối cửa", d: "gió tạt lửa, mùi dầu" },
      { t: "Xà ngang trên giường", d: "cảm giác bị đè" }, { t: "Đất méo, thóp hậu", d: "ít phần dùng được" }, { t: "Nhà chữ L", d: "góc tối, lối gãy khúc" }, { t: "Hướng so với tuổi", d: "đo la bàn, so cung phi" }] },
  "pt-4-dau-hieu-nang.webp": { thu: T3, loai: "bang", nhan: "Dấu hiệu nặng", tieu_de: "Bốn dấu hiệu nặng: xử lý từ 0 đồng", phu: "Có một trong bốn điều này, công cụ không xếp phần liên quan lên mức \"Thuận lợi\" cho tới khi xử lý", co_bang: 22,
    cot: ["Dấu hiệu", "Không tốn tiền", "Tốn ít tiền", "Phải sửa"],
    dong: [["Đường đâm thẳng", "Kê ghế, bàn lệch khỏi đường thẳng từ cửa", "Rèm dày, chậu cây tán rộng sau cửa", "Vách ngăn thấp, tủ giày cao ở sảnh"], ["Nhà vệ sinh giữa nhà", "Luôn đóng cửa, lau khô sàn", "Quạt hút đủ công suất, hẹn giờ", "Tách khô ướt, đổi chiều mở cửa"], ["Xà ngang trên giường", "Dịch giường 40–60 cm khỏi bóng dầm", "Đèn hắt lên trần", "Đóng trần phẳng giấu dầm"], ["Cửa thông ban công", "Kê sofa, kệ sách chắn một phần", "Rèm hai lớp ở ban công", "Vách sảnh bán kín + tủ giày"]],
    chu_thich: "Cách xử lý lấy từ kho tri thức phong thuỷ của Hiểu Bản Thân (mỗi dấu hiệu có trang riêng ở /phong-thuy/dau-hieu)." },
  "pt-thu-tu-xem-nha-cu.webp": { thu: T3, loai: "buoc", nhan: "Mua nhà cũ", tieu_de: "Từ lúc xem nhà đến lúc dọn vào: 5 bước", co_tde: 27, co_chu: 21, cao: 330,
    buoc: [{ t: "Xem hai buổi", d: "Sáng và chiều tối, mở mọi cửa sổ, đứng ở cửa chính nhìn vào." }, { t: "Đi 12 điều", d: "Chụp ảnh từng chỗ đáng lo." }, { t: "Nhờ người kiểm", d: "Điện, nước, vết nứt, thấm." }, { t: "Đo hướng", d: "So với tuổi người đứng tên." }, { t: "Đặt cọc, sửa, dọn vào", d: "Biết rõ chỗ sửa và chi phí trước." }] },

  // ===== ẢNH TRONG BÀI (số liệu engine) =====
  "dai-van-vi-du-1992.webp": { loai: "bang", nhan: "Ví dụ minh hoạ", tieu_de: "Bốn đại vận đầu của một lá số: nữ, 14/9/1992, giờ Thìn", phu: "Năm Nhâm Thân (dương) + nữ = Dương Nữ → đại vận đi *ngược* chiều kim đồng hồ · Hoả Lục Cục → vận đầu từ 6 tuổi", co_bang: 26,
    cot: ["Tuổi (năm dương lịch)", "Cung đại vận", "Chính tinh", "Ghi chú"],
    dong: [["6–15 (1997–2006)", "Mệnh · Tỵ", "Thiên Lương (Hãm)", "Vận đầu ngay tại cung Mệnh"], ["16–25 (2007–2016)", "Huynh Đệ · Thìn", "Tử Vi, Thiên Tướng (Vượng)", "Anh em, bạn học, người ngang hàng"],
      ["26–35 (2017–2026)", "Phu Thê · Mão", "Thiên Cơ, Cự Môn (Miếu)", "Có Triệt — việc thường khởi chậm"], [{ t: "36–45 (2027–2036)", l: "noi" }, { t: "Tử Nữ · Dần", l: "noi" }, { t: "Tham Lang (Đắc)", l: "noi" }, { t: "Có Triệt · vận bắt đầu năm 2027", l: "noi" }]],
    chu_thich: "Số liệu: engine Hiểu Bản Thân (âm lịch Việt Nam, độ sáng sao theo Nam phái). Tuổi tính theo tuổi mụ. Đây là lá số minh hoạ, không phải của một người cụ thể." },
  "hai-cach-cong-duong-doi.webp": { loai: "bang", nhan: "Thần số học", tieu_de: "Ngày sinh 1940–2010: khi nào hai cách cộng ra số khác nhau?", phu: "Đếm *25.933 ngày sinh* bằng engine: *3.573 ngày (13,8%)* ra hai số khác nhau — và chỉ khác ở số cái", co_bang: 27,
    cot: ["Cộng hết một lượt", "Rút gọn từng phần", "Số ngày", "Ví dụ"],
    dong: [["33", "6", "1.295", "24/10/1988"], ["11", "2", "979", "11/04/1985"], ["4", "22", "626", "11/06/1985"], ["22", "4", "430", "02/01/1990"], ["2", "11", "212", "19/08/2000"], ["6", "33", "31", "22/09/2000"]],
    chu_thich: "86,2% ngày sinh còn lại: hai cách cho cùng một số. Công cụ thần số trên hieuban.com mặc định \"rút gọn từng phần\" và luôn hiện cả số của cách kia khi hai số khác nhau." },
  "que-phong-bien-phe-hap.webp": { loai: "hai_que", nhan: "Ví dụ minh hoạ", tieu_de: "Sáu tổng 7 · 8 · 9 · 7 · 8 · 6 cho ra hai quẻ", phu: "Vẽ từ dưới lên · hào vàng là hào động (tổng 9 và 6) · engine Hiểu Bản Thân cho cùng kết quả", co: 46,
    que: [{ ten: "Lôi Hoả Phong (55)", phu: "Chấn trên · Ly dưới — quẻ chính", bits: [1, 0, 1, 1, 0, 0], dong: [3, 6], ghi: ["7 · dương", "8 · âm", "9 · dương động", "7 · dương", "8 · âm", "6 · âm động"] },
      { ten: "Hoả Lôi Phệ Hạp (21)", phu: "Ly trên · Chấn dưới — quẻ biến", bits: [1, 0, 0, 1, 0, 1], ghi: ["", "", "đổi thành âm", "", "", "đổi thành dương"] }],
    chu_thich: "Hai hào động: theo quy tắc đọc của công cụ, lấy hào trên (hào 6) làm chủ. Quẻ hỗ (hào 2–4 và 3–5) là Trạch Phong Đại Quá (28)." },
  "tam-dinh-tuoi.webp": { loai: "bang", nhan: "Nhân tướng học", tieu_de: "Tuổi đi trên gương mặt: sách xưa chia thế nào?", phu: "Theo bài ca *Lưu niên vận khí bộ vị* (Thần Tướng Toàn Biên) — tuổi mụ, nam xét bên trái, nữ bên phải", co_bang: 26,
    cot: ["Tuổi mụ", "Vùng trên gương mặt", "Sách xưa gọi là"],
    dong: [["1–14", "Hai tai", "Thái Thính quan"], ["15–30", "Trán (thượng đình)", "Thiên Trung, Thiên Đình, Tư Không, Trung Chính…"], ["31–40", "Lông mày, mắt, đuôi mắt", "Bảo Thọ quan, Giám Sát quan"],
      ["41–50", "Mũi, gò má (trung đình)", "Sơn Căn, Chuẩn Đầu, Lan Đài – Đình Uý"], ["51–60", "Nhân Trung, rãnh cười, miệng", "Pháp Lệnh, Xuất Nạp quan"], ["61 trở đi", "Cằm, quai hàm (hạ đình)", "Địa Các, Nô Bộc"]],
    chu_thich: "Bảng chỉ cho biết sách xưa \"nhìn vào đâu\" ở mỗi tuổi. Hình dáng gương mặt không nói được điều gì chắc chắn về sức khoẻ, tính cách hay vận may." },
  "mai-hoa-vi-du-2026.webp": { loai: "hai_que", nhan: "Ví dụ minh hoạ", tieu_de: "Mai Hoa lúc 9:15 ngày 20/11/2026 (giờ Tỵ)", phu: "Năm Ngọ (7) + tháng 10 + ngày 12 âm = *29* → dư 5: Tốn · thêm giờ Tỵ (6) = *35* → dư 3: Ly · 35 chia 6 dư 5: hào 5 động", co: 46,
    que: [{ ten: "Phong Hoả Gia Nhân (37)", phu: "Tốn trên · Ly dưới — quẻ chủ", bits: [1, 0, 1, 0, 1, 1], dong: [5], ghi: ["", "", "", "", "hào động", ""] },
      { ten: "Sơn Hoả Bí (22)", phu: "Cấn trên · Ly dưới — quẻ biến", bits: [1, 0, 1, 0, 0, 1], ghi: ["", "", "", "", "đổi thành âm", ""] }],
    chu_thich: "Quẻ có hào động là Dụng (Tốn · Mộc), quẻ không động là Thể (Ly · Hoả): Mộc sinh Hoả — \"dụng sinh thể\". Số liệu: engine Hiểu Bản Thân, âm lịch Việt Nam." },
  "la-so-12-cung-vi-du.webp": { loai: "la_so", nhan: "Ví dụ minh hoạ", tieu_de: "Lá số ví dụ: tìm cung Quan Lộc và đối cung", co: 44,
    cung: LA_SO_VI_DU.map((g) => ({ ...g, l: g.ten === "Quan Lộc" ? "nhan" : g.ten === "Phu Thê" ? "phu" : "" })),
    giua: ["Nữ · 14/9/1992 · giờ Thìn", "Nhâm Thân · Hoả Lục Cục", "Quan Lộc ở *Dậu* không có chính tinh", "→ đọc mượn sao cung đối diện *Mão*:", "Thiên Cơ, Cự Môn (Miếu)"] },
  "mot-ngay-12-gio.webp": { loai: "bang", nhan: "Cùng ngày sinh 14/9/1992 (nữ)", tieu_de: "Đổi giờ sinh, cung Mệnh đổi theo", co: 44, dem: 5, phu: "Engine lập lại lá số cho 12 canh giờ: *12 giờ → 12 cung Mệnh khác nhau*, Cục đổi 5 lần · Bát tự giữ nguyên 3 trụ năm, tháng, ngày", co_bang: 20,
    cot: ["Giờ sinh", "Cung Mệnh", "Chính tinh ở Mệnh", "Cục", "Trụ giờ Bát tự"],
    dong: [["Tý 23–1h", "Dậu", "Thiên Phủ", "Thổ Ngũ", "Nhâm Tý"], ["Sửu 1–3h", "Thân", "(không có)", "Thổ Ngũ", "Quý Sửu"], ["Dần 3–5h", "Mùi", "Thái Dương, Thái Âm", "Thuỷ Nhị", "Giáp Dần"], ["Mão 5–7h", "Ngọ", "Vũ Khúc, Thiên Phủ", "Thuỷ Nhị", "Ất Mão"],
      [{ t: "Thìn 7–9h", l: "noi" }, { t: "Tỵ", l: "noi" }, { t: "Thiên Lương", l: "noi" }, { t: "Hoả Lục", l: "noi" }, { t: "Bính Thìn", l: "noi" }], ["Tỵ 9–11h", "Thìn", "Tử Vi, Thiên Tướng", "Hoả Lục", "Đinh Tỵ"],
      ["Ngọ 11–13h", "Mão", "Thiên Đồng", "Kim Tứ", "Mậu Ngọ"], ["Mùi 13–15h", "Dần", "Thất Sát", "Kim Tứ", "Kỷ Mùi"], ["Thân 15–17h", "Sửu", "Thiên Tướng", "Mộc Tam", "Canh Thân"],
      ["Dậu 17–19h", "Tý", "Cự Môn", "Mộc Tam", "Tân Dậu"], ["Tuất 19–21h", "Hợi", "Cự Môn", "Kim Tứ", "Nhâm Tuất"], ["Hợi 21–23h", "Tuất", "Tham Lang", "Kim Tứ", "Quý Hợi"]] },
  "cung-phi-1992.webp": { loai: "bang", nhan: "Ví dụ minh hoạ", tieu_de: "Cùng sinh năm 1992 (sau Lập xuân): nam và nữ khác cung phi", phu: "Nam: cung *Cấn* · Nữ: cung *Đoài* — cả hai thuộc Tây tứ mệnh nên bốn hướng tốt trùng nhau, nhưng hướng nào tốt nhất thì khác", co_bang: 27,
    cot: ["Hướng", "Nam 1992 (Cấn)", "Nữ 1992 (Đoài)"],
    dong: [["Tây Nam", { t: "Sinh Khí", l: "tot" }, { t: "Thiên Y", l: "tot" }], ["Tây", { t: "Diên Niên", l: "tot" }, { t: "Phục Vị", l: "tot" }], ["Tây Bắc", { t: "Thiên Y", l: "tot" }, { t: "Sinh Khí", l: "tot" }], ["Đông Bắc", { t: "Phục Vị", l: "tot" }, { t: "Diên Niên", l: "tot" }],
      ["Bắc · Đông · Đông Nam · Nam", { t: "Ngũ Quỷ · Lục Sát · Tuyệt Mệnh · Hoạ Hại", l: "xau" }, { t: "Hoạ Hại · Tuyệt Mệnh · Lục Sát · Ngũ Quỷ", l: "xau" }]],
    chu_thich: "Số liệu: engine Hiểu Bản Thân, năm tính theo Lập xuân (khoảng 4/2 dương lịch). Hướng chỉ là một lớp — ánh sáng, gió, lối đi trong nhà vẫn xét trước." },
  "ngu-hanh-bat-tu-vi-du.webp": { loai: "cot", nhan: "Ví dụ minh hoạ", tieu_de: "Năm hành trong một lá Bát tự: Nhâm Thân · Kỷ Dậu · Quý Tỵ · Bính Thìn", phu: "Nữ, 14/9/1992, giờ Thìn · nhật chủ *Quý Thuỷ* · mệnh năm (nạp âm) *Kiếm Phong Kim* — hai thứ khác nhau", co: 42,
    muc: [{ t: "Kim", p: 32, so: "2,9 · 32%", mau: "#8a8fa3" }, { t: "Thuỷ", p: 27, so: "2,4 · 27%", mau: "#4f7fb0" }, { t: "Thổ", p: 20, so: "1,8 · 20%", mau: "#b8913f" }, { t: "Hoả", p: 18, so: "1,6 · 18%", mau: "#c9773a" }, { t: "Mộc", p: 3, so: "0,3 · 3%", mau: "#5f9e7c" }],
    chu_thich: "Điểm theo thang công bố của engine (can lộ + tàng can theo trọng số). Thân vượng → cách cân sức gợi ý cần thêm Mộc, Hoả, Thổ. Cách thứ hai (theo tháng sinh) có thể khác — công cụ luôn hiện cả hai, không tự chọn." },
};

NOI_DUNG["tv-12-gio-12-cung-menh.webp"] = { ...NOI_DUNG["mot-ngay-12-gio.webp"], thu: T3 };

// ---------- dựng ----------
const VIEC = [
  // [thư mục ra, slug bài (cho QR), tệp]
  ...Object.keys(NOI_DUNG).map((t) => [NOI_DUNG[t].thu ?? "anh", t]),
];
const SLUG = JSON.parse(fs.readFileSync(path.join(DIR, "slug-anh.json"), "utf8"));   // tệp → slug bài (QR trỏ bài)
const trinh = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
const trang = await trinh.newPage({ viewport: { width: 1600, height: 1028 }, deviceScaleFactor: 1 });
let n = 0;
for (const [thu, tep] of VIEC) {
  const c = NOI_DUNG[tep]; const slug = SLUG[tep];
  if (!slug) throw new Error(`thiếu slug cho ảnh ${tep} trong slug-anh.json`);
  const url = `https://hieuban.com/blog/${slug}`;
  const laBia = c.loai === "bia";
  const chan = laBia ? "" : `<div class="chan"><span class="w">hieuban.com</span><span class="u">hieuban.com/blog/${e(slug)}</span>
    <span class="q">Quét để đọc bài đầy đủ ${qrSvg(url, 104)}</span></div>`;
  await trang.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}</style><body>${BO_CUC[c.loai](c, url)}${chan}</body>`, { waitUntil: "load" });
  await trang.evaluate(() => document.fonts.ready);
  const png = await trang.screenshot({ clip: { x: 0, y: 0, width: 1600, height: laBia ? 900 : 1028 } });
  fs.mkdirSync(path.join(DIR, thu), { recursive: true });
  await sharp(png).webp({ quality: 88 }).toFile(path.join(DIR, thu, tep));
  n++;
}
await trinh.close();
console.log(`đã vẽ ${n} ảnh`);
