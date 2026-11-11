// KW-6T tuần 1–2 — vẽ 32 ảnh minh hoạ (4 ảnh × 8 bài) bằng HTML + Chromium (Playwright có sẵn trong môi trường dev).
//   node src/bai-khoi-tao/kw6t/ve-anh.mjs            → ghi PNG vào ./anh
// Ảnh bìa 1600×900 (QR góc dưới phải); ảnh trong bài 1600×900 + dải chân 128 px (hieuban.com + đường dẫn bài + QR) — cùng
// quy ước QR-ANH của BLOG-6. Nền giấy sáng (BLOG-7: ảnh tối chìm vào nền site). Số liệu trong ảnh khớp bài và engine
// (tuoi_dan_gian.py): đổi bài thì sửa NOI_DUNG ở dưới rồi chạy lại.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(DIR, "../../../..");
const { chromium } = createRequire(import.meta.url)("playwright");
const { maHoaQr, duongQr } = await import(pathToFileURL(path.join(GOC, "cms/src/lib/qr.ts")).href);
const FONT = (f) => pathToFileURL(path.join(GOC, "cms/assets/fonts", f)).href;
const LOGO = fs.readFileSync(path.join(GOC, "web/public/thuong-hieu/logo-ngang-nen-sang-trong-suot.svg"), "utf8");

const qrSvg = (url, px) => {
  const q = maHoaQr(url); const n = q.kichThuoc + 8; const o = Math.floor(px / n);   // cạnh = số ô × px nguyên
  return `<svg width="${n * o}" height="${n * o}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${duongQr(q)}" fill="#1d1830"/></svg>`;
};
const e = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const nhan = (s) => e(s).replace(/\*([^*]+)\*/g, "<b>$1</b>");

const CSS = `
@font-face{font-family:BV;src:url(${FONT("BeVietnamPro-SemiBold.ttf")})}
@font-face{font-family:NR;src:url(${FONT("Newsreader.ttf")})}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1600px;font-family:BV,sans-serif;color:#262033;background:#f6f0e2}
.k{position:relative;width:1600px;height:900px;overflow:hidden;
  background:radial-gradient(1100px 600px at 85% 15%,#fff8e6 0,transparent 60%),radial-gradient(900px 700px at 0% 100%,#efe4cc 0,transparent 60%),#f6f0e2}
.k::before{content:"";position:absolute;inset:28px;border:2px solid #d9c9a3;border-radius:28px}
.tde{font-family:NR,serif;font-weight:600;color:#2a2140}
.vang{color:#a8741a}.xanh{color:#2f6b4f}.ho{color:#a5591b}
.logo{position:absolute;left:72px;top:58px;height:44px}.logo svg{height:44px;width:auto}
.nhan{position:absolute;right:72px;top:62px;font-size:24px;color:#7b6a48;letter-spacing:.04em}
.chan{height:128px;background:#2a2140;color:#f6f0e2;display:flex;align-items:center;padding:0 60px;gap:26px}
.chan .w{font-size:34px;color:#f0c66b}.chan .u{font-size:24px;color:#d8cfbd}.chan .q{margin-left:auto;display:flex;align-items:center;gap:18px;font-size:22px;color:#d8cfbd}
table{border-collapse:separate;border-spacing:0;width:100%;font-size:30px}
th{background:#2a2140;color:#f6f0e2;text-align:left;padding:16px 22px;font-size:26px}
th:first-child{border-radius:16px 0 0 0}th:last-child{border-radius:0 16px 0 0}
td{padding:14px 22px;border-bottom:2px solid #e3d6b8;background:#fffaf0}
tr:last-child td:first-child{border-radius:0 0 0 16px}tr:last-child td:last-child{border-radius:0 0 16px 0}
.tot{color:#2f6b4f}.xau{color:#a5591b}
`;

// ---------- bố cục ----------
function bia(c, url) {
  return `<div class="k"><div class="logo">${LOGO}</div><div class="nhan">${e(c.nhan ?? "hieuban.com")}</div>
  <div style="position:absolute;left:96px;top:190px;width:${c.motif ? 820 : 1300}px">
    <div style="font-size:30px;color:#a8741a;letter-spacing:.06em;margin-bottom:22px">${e(c.tren)}</div>
    <div class="tde" style="font-size:${c.co ?? 82}px;line-height:1.08">${nhan(c.tieu_de)}</div>
    <div style="font-size:34px;color:#4b4060;margin-top:30px;line-height:1.35">${nhan(c.phu)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:40px">${(c.chip ?? []).map((x) =>
      `<span style="font-size:26px;padding:10px 22px;border-radius:40px;background:#fffaf0;border:2px solid #d9c9a3">${nhan(x)}</span>`).join("")}</div>
  </div>
  ${c.motif ? `<div style="position:absolute;right:110px;top:170px;width:560px;height:560px">${MOTIF[c.motif](c)}</div>` : ""}
  <div style="position:absolute;right:66px;bottom:62px;display:flex;flex-direction:column;align-items:center;gap:8px;background:#fff;padding:12px 12px 8px;border-radius:14px;border:2px solid #d9c9a3">
    ${qrSvg(url, 132)}<span style="font-size:18px;color:#5d5170">Quét để đọc bài</span></div>
  <div style="position:absolute;left:96px;bottom:66px;font-size:26px;color:#7b6a48">hieuban.com</div></div>`;
}
const khung = (c, than) => `<div class="k"><div class="logo">${LOGO}</div><div class="nhan">${e(c.nhan ?? "")}</div>
  <div style="position:absolute;left:96px;right:96px;top:140px">
    <div class="tde" style="font-size:${c.co ?? 58}px;line-height:1.12">${nhan(c.tieu_de)}</div>
    ${c.phu ? `<div style="font-size:28px;color:#5d5170;margin-top:12px">${nhan(c.phu)}</div>` : ""}
    <div style="margin-top:34px">${than}</div></div>
  ${c.chu_thich ? `<div style="position:absolute;left:96px;right:96px;bottom:58px;font-size:23px;color:#7b6a48">${nhan(c.chu_thich)}</div>` : ""}</div>`;
const bang = (c) => khung(c, `<table style="font-size:${c.co_bang ?? 30}px"><thead><tr>${c.cot.map((x) => `<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${
  c.dong.map((r) => `<tr>${r.map((x, i) => `<td class="${typeof x === "object" ? x.l : ""}" style="${i === 0 ? "font-weight:600" : ""}">${nhan(typeof x === "object" ? x.t : x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
const buoc = (c) => khung(c, `<div style="display:grid;grid-template-columns:repeat(${c.cot_so ?? c.buoc.length},1fr);gap:22px">${c.buoc.map((b, i) =>
  `<div style="background:#fffaf0;border:2px solid #d9c9a3;border-radius:22px;padding:28px 26px;min-height:${c.cao ?? 360}px">
    <div style="width:64px;height:64px;border-radius:50%;background:#2a2140;color:#f0c66b;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px">${b.so ?? i + 1}</div>
    <div class="tde" style="font-size:${c.co_tde ?? 36}px;line-height:1.15;margin-bottom:12px">${nhan(b.t)}</div>
    <div style="font-size:${c.co_chu ?? 25}px;line-height:1.4;color:#4b4060">${nhan(b.d)}</div></div>`).join("")}</div>`);
const luoi = (c) => khung(c, `${(c.nhom ?? [{ o: c.o }]).map((g) => `${g.ten ? `<div style="font-size:28px;color:#a8741a;margin:6px 0 12px">${nhan(g.ten)}</div>` : ""}
  <div style="display:grid;grid-template-columns:repeat(${c.cot_so ?? 4},1fr);gap:16px;margin-bottom:18px">${g.o.map((x) =>
  `<div style="background:${x.l === "xau" ? "#fbefe0" : x.l === "tot" ? "#e9f3ec" : "#fffaf0"};border:2px solid ${x.l === "xau" ? "#e2b98a" : x.l === "tot" ? "#9cc7ad" : "#d9c9a3"};border-radius:18px;padding:${c.dem ?? 18}px 20px">
    <div class="tde" style="font-size:${c.co_o ?? 38}px">${nhan(x.t)}</div>${x.d ? `<div style="font-size:${c.co_d ?? 23}px;color:#4b4060;margin-top:6px;line-height:1.3">${nhan(x.d)}</div>` : ""}</div>`).join("")}</div>`).join("")}`);
const haiCot = (c) => khung(c, `<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">${c.cot.map((k) =>
  `<div style="background:#fffaf0;border:2px solid #d9c9a3;border-radius:22px;padding:30px 34px">
    <div class="tde vang" style="font-size:42px;margin-bottom:6px">${nhan(k.t)}</div><div style="font-size:25px;color:#5d5170;margin-bottom:18px">${nhan(k.d)}</div>
    ${k.ds.map((x) => `<div style="font-size:27px;line-height:1.35;padding:10px 0 10px 40px;position:relative;border-top:1px dashed #e3d6b8"><span style="position:absolute;left:0;top:9px;color:#2f6b4f">✓</span>${nhan(x)}</div>`).join("")}</div>`).join("")}</div>`);
function vong(c) {
  const n = c.muc.length, R = 294 - (c.r ?? 70), cx = 360, cy = 300;
  const o = c.muc.map((m, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const mau = m.l === "xau" ? ["#fbefe0", "#d58c45"] : m.l === "tot" ? ["#e9f3ec", "#5f9e7c"] : m.l === "nhan" ? ["#2a2140", "#2a2140"] : ["#fffaf0", "#cbb88d"];
    return `<g><circle cx="${x}" cy="${y}" r="${c.r ?? 70}" fill="${mau[0]}" stroke="${mau[1]}" stroke-width="4"/>
      <text x="${x}" y="${y + (m.d ? -4 : 10)}" text-anchor="middle" font-family="NR" font-size="${c.co_vong ?? 27}" fill="${m.l === "nhan" ? "#f0c66b" : "#2a2140"}">${e(m.t)}</text>
      ${m.d ? `<text x="${x}" y="${y + 26}" text-anchor="middle" font-family="BV" font-size="19" fill="${m.l === "nhan" ? "#f6f0e2" : "#5d5170"}">${e(m.d)}</text>` : ""}</g>`;
  }).join("");
  return khung(c, `<div style="display:flex;gap:40px;align-items:flex-start"><svg width="720" height="600" viewBox="0 0 720 600" style="flex:none">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#d9c9a3" stroke-width="3" stroke-dasharray="8 10"/>${o}
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="NR" font-size="40" fill="#a8741a">${e(c.giua ?? "")}</text>
    <text x="${cx}" y="${cy + 32}" text-anchor="middle" font-family="BV" font-size="22" fill="#5d5170">${e(c.giua_phu ?? "")}</text></svg>
    <div style="flex:1;font-size:27px;line-height:1.45;color:#3a3150;padding-top:20px">${(c.ghi ?? []).map((x) => `<p style="margin-bottom:18px">${nhan(x)}</p>`).join("")}</div></div>`);
}
const MOTIF = {
  giap(c) {   // vòng 12 con giáp, tô các chi được nhấn
    const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
    return `<svg viewBox="0 0 560 560" width="560" height="560"><circle cx="280" cy="280" r="215" fill="none" stroke="#d9c9a3" stroke-width="3" stroke-dasharray="6 9"/>${CHI.map((t, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 6, x = 280 + 215 * Math.cos(a), y = 280 + 215 * Math.sin(a), on = (c.to ?? []).includes(t), xa = (c.xam ?? []).includes(t);
      return `<circle cx="${x}" cy="${y}" r="44" fill="${on ? "#2a2140" : xa ? "#fbefe0" : "#fffaf0"}" stroke="${on ? "#2a2140" : xa ? "#d58c45" : "#cbb88d"}" stroke-width="3"/><text x="${x}" y="${y + 10}" text-anchor="middle" font-family="NR" font-size="28" fill="${on ? "#f0c66b" : "#2a2140"}">${t}</text>`;
    }).join("")}<text x="280" y="270" text-anchor="middle" font-family="NR" font-size="58" fill="#a8741a">${e(c.giua ?? "")}</text><text x="280" y="318" text-anchor="middle" font-family="BV" font-size="24" fill="#5d5170">${e(c.giua_phu ?? "")}</text></svg>`;
  },
  so(c) {
    return `<svg viewBox="0 0 560 560" width="560" height="560">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 9, x = 280 + 210 * Math.cos(a), y = 280 + 210 * Math.sin(a), on = (c.to ?? []).includes(n);
      return `<circle cx="${x}" cy="${y}" r="${on ? 52 : 40}" fill="${on ? "#2a2140" : "#fffaf0"}" stroke="${on ? "#2a2140" : "#cbb88d"}" stroke-width="3"/><text x="${x}" y="${y + 13}" text-anchor="middle" font-family="NR" font-size="${on ? 44 : 34}" fill="${on ? "#f0c66b" : "#2a2140"}">${n}</text>`;
    }).join("")}<text x="280" y="268" text-anchor="middle" font-family="NR" font-size="34" fill="#a8741a">${e(c.giua ?? "")}</text><text x="280" y="310" text-anchor="middle" font-family="BV" font-size="22" fill="#5d5170">${e(c.giua_phu ?? "")}</text></svg>`;
  },
  sao(c) {   // vòng 9 sao Cửu Diệu, tô La Hầu, Kế Đô
    const S = ["La Hầu", "Thổ Tú", "Thuỷ Diệu", "Thái Bạch", "Thái Dương", "Vân Hán", "Kế Đô", "Thái Âm", "Mộc Đức"];
    return `<svg viewBox="0 0 560 560" width="560" height="560"><circle cx="280" cy="280" r="205" fill="none" stroke="#d9c9a3" stroke-width="3" stroke-dasharray="6 9"/>${S.map((t, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 9, x = 280 + 205 * Math.cos(a), y = 280 + 205 * Math.sin(a), on = t === "La Hầu" || t === "Kế Đô";
      return `<circle cx="${x}" cy="${y}" r="${on ? 62 : 52}" fill="${on ? "#2a2140" : "#fffaf0"}" stroke="${on ? "#2a2140" : "#cbb88d"}" stroke-width="3"/><text x="${x}" y="${y + 8}" text-anchor="middle" font-family="NR" font-size="${on ? 25 : 21}" fill="${on ? "#f0c66b" : "#2a2140"}">${t}</text>`;
    }).join("")}<text x="280" y="270" text-anchor="middle" font-family="NR" font-size="40" fill="#a8741a">${e(c.giua ?? "")}</text><text x="280" y="310" text-anchor="middle" font-family="BV" font-size="22" fill="#5d5170">${e(c.giua_phu ?? "")}</text></svg>`;
  },
  nha(c) {   // ngôi nhà + mốc
    return `<svg viewBox="0 0 560 560" width="560" height="560"><path d="M80 260 L280 90 L480 260" fill="none" stroke="#2a2140" stroke-width="14" stroke-linejoin="round"/>
      <rect x="130" y="250" width="300" height="230" rx="10" fill="#fffaf0" stroke="#2a2140" stroke-width="8"/><rect x="245" y="350" width="70" height="130" rx="6" fill="#e9dcc0" stroke="#2a2140" stroke-width="6"/>
      <rect x="165" y="300" width="60" height="55" rx="5" fill="#f0c66b"/><rect x="335" y="300" width="60" height="55" rx="5" fill="#f0c66b"/>
      ${(c.chu ?? []).map((t, i) => `<g><rect x="${60 + i * 150}" y="505" width="140" height="44" rx="22" fill="${i === (c.on ?? -1) ? "#2a2140" : "#fffaf0"}" stroke="#cbb88d" stroke-width="2"/><text x="${130 + i * 150}" y="535" text-anchor="middle" font-family="BV" font-size="20" fill="${i === (c.on ?? -1) ? "#f0c66b" : "#2a2140"}">${e(t)}</text></g>`).join("")}</svg>`;
  },
  cua(c) {   // cánh cửa mở + chân bước vào
    return `<svg viewBox="0 0 560 560" width="560" height="560"><rect x="150" y="70" width="260" height="420" rx="12" fill="#2a2140"/>
      <path d="M160 80 L330 120 L330 470 L160 480 Z" fill="#fffaf0" stroke="#cbb88d" stroke-width="4"/><circle cx="305" cy="300" r="10" fill="#a8741a"/>
      <path d="M200 80 L200 480" stroke="#f0c66b" stroke-width="2" opacity=".0"/>
      <g fill="#f0c66b">${[0, 1, 2].map((i) => `<circle cx="${370 + i * 30}" cy="${150 + i * 60}" r="6"/>`).join("")}</g>
      <text x="280" y="535" text-anchor="middle" font-family="NR" font-size="34" fill="#a8741a">${e(c.giua ?? "")}</text></svg>`;
  },
};

// ---------- nội dung 32 ảnh (khớp từng bài) ----------
const NOI_DUNG = {
  // ===== K001 cách chọn người xông đất =====
  "xong-dat-bia.png": { loai: "bia", tren: "TẾT ĐINH MÙI 2027", tieu_de: "Cách chọn người *xông đất* đầu năm", phu: "4 bước tự làm, không cần thầy", chip: ["1 · Năm sinh gia chủ", "2 · Tuổi nên tránh", "3 · Tuổi hợp", "4 · Giờ đẹp mùng 1"], motif: "cua", giua: "Mùng 1 · 6/2/2027" },
  "xong-dat-tuoi-tranh-2027.png": { loai: "bang", nhan: "Xông đất 2027", tieu_de: "Bước 2: tuổi dân gian thường tránh năm Đinh Mùi", cot: ["Nhóm tuổi", "Vì sao", "Năm 2027"], dong: [["Xung với năm", "Chi đối diện năm trên vòng 12 con giáp", { t: "Tuổi *Sửu*", l: "xau" }], ["Xung với gia chủ", "Chi đối diện tuổi gia chủ", { t: "Gia chủ Thìn → tránh *Tuất*", l: "xau" }], ["Đang Tam tai", "Năm thứ ba của Tam tai", { t: "Tuổi *Hợi, Mão, Mùi*", l: "xau" }]], chu_thich: "Lời nhắc của tập quán, không phải điều cấm: người các tuổi này vẫn đi chúc Tết bình thường." },
  "xong-dat-vi-du-gia-chu-1988.png": { loai: "bang", nhan: "Ví dụ minh hoạ", tieu_de: "Gia chủ sinh 1988 (Mậu Thìn) mời ai xông đất?", co_bang: 28, cot: ["Tuổi người xông", "Vì sao hợp"], dong: [[{ t: "Bính Ngọ 1966", l: "tot" }, "Ngọ lục hợp năm Mùi · can Bính sinh Mậu · Thiên Hà Thuỷ sinh Mộc"], [{ t: "Tân Dậu 1981", l: "tot" }, "Dậu lục hợp Thìn · Thạch Lựu Mộc cùng hành gia chủ"], [{ t: "Canh Thân 1980", l: "tot" }, "Thân tam hợp Thìn · Thạch Lựu Mộc cùng hành"], [{ t: "Bính Tý 1996", l: "tot" }, "Tý tam hợp Thìn · can Bính sinh Mậu · Giản Hạ Thuỷ sinh Mộc"]], chu_thich: "Kết quả của công cụ tuổi xông đất Tết 2027 trên hieuban.com. Năm sinh gia chủ khác → danh sách khác." },
  "xong-dat-gio-hoang-dao-mung-1.png": { loai: "luoi", nhan: "Mùng 1 Tết Đinh Mùi", tieu_de: "Thứ Bảy 6/2/2027 · ngày Bính Thìn, hoàng đạo", phu: "Giờ hoàng đạo trong ngày — buổi sáng hợp để đến xông đất", cot_so: 3, o: [{ t: "Giờ Dần", d: "3:00 – 4:59 · hơi sớm", l: "" }, { t: "Giờ Thìn", d: "7:00 – 8:59 · hợp nhiều nhà", l: "tot" }, { t: "Giờ Tỵ", d: "9:00 – 10:59", l: "tot" }, { t: "Giờ Thân", d: "15:00 – 16:59" }, { t: "Giờ Dậu", d: "17:00 – 18:59" }, { t: "Giờ Hợi", d: "21:00 – 22:59" }], chu_thich: "Hỷ thần, Tài thần ngày mùng 1: hướng Tây Nam. Người xông đất ở lại 15–30 phút, chúc ngắn rồi về." },

  // ===== K002 không có người hợp tuổi xông đất =====
  "khong-hop-tuoi-xong-dat-bia.png": { loai: "bia", tren: "XÔNG ĐẤT TẾT 2027", co: 72, tieu_de: "Không có người *hợp tuổi* xông đất thì làm sao?", phu: "5 cách tập quán nhiều nhà vẫn dùng", chip: ["Gia chủ tự xông", "Nhờ người trong nhà", "Nới tiêu chí", "Mời trẻ nhỏ", "Để tự nhiên"], motif: "cua", giua: "Mở cửa đón năm mới" },
  "nam-cach-khi-khong-co-nguoi-xong-dat.png": { loai: "buoc", nhan: "Xông đất 2027", tieu_de: "Năm cách khi không có người hợp tuổi xông đất", co_tde: 30, co_chu: 22, cao: 430, buoc: [{ t: "Gia chủ tự xông", d: "Ra ngoài trước giao thừa, vào lại ngay sau giao thừa" }, { t: "Người trong nhà", d: "Vợ, chồng hoặc con không xung năm, không Tam tai" }, { t: "Nới tiêu chí", d: "Giữ 3 điều chính, bỏ phần can và mệnh" }, { t: "Trẻ nhỏ, hàng xóm", d: "Người vui tính, được quý mến, đến sáng mùng 1" }, { t: "Để tự nhiên", d: "Khách đến trước là người xông đất, đón vui vẻ" }] },
  "vi-du-gia-dinh-4-nguoi-xong-dat.png": { loai: "bang", nhan: "Ví dụ minh hoạ", tieu_de: "Gia đình 4 người, gia chủ sinh 1988: ai xông đất?", co_bang: 28, cot: ["Người trong nhà", "Tuổi", "Năm 2027"], dong: [["Chồng · gia chủ", "Mậu Thìn 1988", "Người được tính tuổi"], ["Vợ", "Canh Ngọ 1990", { t: "Ngọ lục hợp năm Mùi · dùng được", l: "tot" }], ["Con lớn", "Bính Thân 2016", { t: "Thân tam hợp Thìn · hợp nhất", l: "tot" }], ["Con nhỏ", "Kỷ Hợi 2019", { t: "Hợi đang Tam tai · thường không chọn", l: "xau" }]], chu_thich: "Gia đình này có thể để bố dắt con lớn ra ngoài trước giao thừa, rồi cho con bước vào nhà trước." },
  "ba-dieu-kien-chinh-xong-dat.png": { loai: "buoc", nhan: "Xông đất 2027", tieu_de: "Nới tiêu chí: chỉ giữ 3 điều kiện chính", buoc: [{ t: "Không xung năm", d: "Năm 2027 Đinh Mùi: tránh tuổi *Sửu*" }, { t: "Không xung gia chủ", d: "Gia chủ Thìn tránh Tuất · gia chủ Tý tránh Ngọ" }, { t: "Không đang Tam tai", d: "Năm 2027: tuổi *Hợi, Mão, Mùi*" }], chu_thich: "Đạt 3 điều này là đủ để yên tâm theo tập quán; can và mệnh hợp thì coi là điểm cộng." },

  // ===== K003 Tam tai =====
  "tam-tai-bia.png": { loai: "bia", tren: "TẬP QUÁN THEO TUỔI", tieu_de: "*Tam tai* là gì?", phu: "Cách tự tính trong 3 bước · năm 2027 tuổi nào gặp", chip: ["4 nhóm tam hợp", "3 năm liền", "2027: Hợi · Mão · Mùi"], motif: "giap", to: ["Hợi", "Mão", "Mùi"], giua: "2027", giua_phu: "Đinh Mùi" },
  "tam-tai-bon-nhom-tam-hop.png": { loai: "bang", nhan: "Tam tai", tieu_de: "Bốn nhóm tam hợp và ba năm Tam tai của mỗi nhóm", cot: ["Nhóm tuổi", "Ba năm Tam tai", "Mẹo nhớ"], dong: [["Thân · Tý · Thìn", "Dần · Mão · Thìn", "Dần xung Thân"], ["Dần · Ngọ · Tuất", "Thân · Dậu · Tuất", "Thân xung Dần"], [{ t: "Hợi · Mão · Mùi", l: "xau" }, { t: "Tỵ · Ngọ · Mùi", l: "xau" }, "Tỵ xung Hợi"], ["Tỵ · Dậu · Sửu", "Hợi · Tý · Sửu", "Hợi xung Tỵ"]], chu_thich: "Năm Tam tai đầu tiên là con giáp xung với con giáp đứng đầu nhóm." },
  "cach-tinh-tam-tai-3-buoc.png": { loai: "buoc", nhan: "Ví dụ minh hoạ", tieu_de: "Cách tính Tam tai: ví dụ người sinh năm 1991", buoc: [{ t: "Con giáp năm sinh", d: "1991 là năm *Tân Mùi* → tuổi Mùi (sinh trước Tết thì lấy năm trước)" }, { t: "Tìm nhóm tam hợp", d: "Mùi thuộc nhóm *Hợi · Mão · Mùi*" }, { t: "Đọc ba năm", d: "Tỵ 2025 · Ngọ 2026 · *Mùi 2027* = năm thứ ba, năm cuối" }] },
  "tuoi-gap-tam-tai-2027.png": { loai: "luoi", nhan: "Năm 2027 · Đinh Mùi", tieu_de: "Những năm sinh gặp Tam tai năm 2027 (năm cuối)", cot_so: 4, co_o: 34, nhom: [{ ten: "Tuổi Mão", o: [{ t: "1963", d: "Quý Mão", l: "xau" }, { t: "1975", d: "Ất Mão", l: "xau" }, { t: "1987", d: "Đinh Mão", l: "xau" }, { t: "1999", d: "Kỷ Mão", l: "xau" }] }, { ten: "Tuổi Mùi", o: [{ t: "1967", d: "Đinh Mùi", l: "xau" }, { t: "1979", d: "Kỷ Mùi", l: "xau" }, { t: "1991", d: "Tân Mùi", l: "xau" }, { t: "2003", d: "Quý Mùi", l: "xau" }] }, { ten: "Tuổi Hợi", o: [{ t: "1971", d: "Tân Hợi", l: "xau" }, { t: "1983", d: "Quý Hợi", l: "xau" }, { t: "1995", d: "Ất Hợi", l: "xau" }, { t: "2028 →", d: "Dần, Ngọ, Tuất bắt đầu" }] }], dem: 12 },

  // ===== K004 Kim lâu =====
  "kim-lau-bia.png": { loai: "bia", tren: "CƯỚI HỎI · LÀM NHÀ", tieu_de: "*Kim lâu* là gì?", phu: "Cách tính tuổi Kim lâu bằng tuổi mụ chia 9", chip: ["Dư 1 · Thân", "Dư 3 · Thê", "Dư 6 · Tử", "Dư 8 · Lục súc"], motif: "so", to: [1, 3, 6, 8], giua: "tuổi mụ ÷ 9", giua_phu: "dư 1, 3, 6, 8" },
  "kim-lau-bon-loai.png": { loai: "bang", nhan: "Kim lâu", tieu_de: "Bốn loại Kim lâu theo số dư của tuổi mụ chia 9", cot: ["Dư", "Tên gọi", "Dân gian cho là ảnh hưởng tới"], dong: [["Dư 1", { t: "Kim lâu Thân", l: "xau" }, "Chính người đứng tên, người cô dâu"], ["Dư 3", { t: "Kim lâu Thê", l: "xau" }, "Vợ hoặc chồng"], ["Dư 6", { t: "Kim lâu Tử", l: "xau" }, "Con cái"], ["Dư 8", { t: "Kim lâu Lục súc", l: "xau" }, "Vật nuôi, việc làm ăn"]], chu_thich: "Dư 0, 2, 4, 5, 7: không phạm Kim lâu. Cưới hỏi xét tuổi cô dâu; làm nhà xét tuổi người đứng tên." },
  "cach-tinh-kim-lau-vi-du-1998.png": { loai: "buoc", nhan: "Ví dụ minh hoạ", tieu_de: "Cô dâu sinh 1998 cưới năm 2027 có phạm Kim lâu?", buoc: [{ t: "Tuổi mụ", d: "2027 − 1998 + 1 = *30*" }, { t: "Chia 9", d: "30 = 9 × 3 + *3* → dư 3" }, { t: "Đối chiếu", d: "Dư 3 → *Kim lâu Thê*. Sinh 1997 thì tuổi mụ 31, dư 4: không phạm" }] },
  "tuoi-pham-kim-lau-2027.png": { loai: "luoi", nhan: "Năm 2027 · Đinh Mùi", tieu_de: "Năm sinh phạm Kim lâu năm 2027 (1980–2005)", cot_so: 4, co_o: 32, co_d: 21, dem: 12, o: [["1980", "48 · Thê"], ["1982", "46 · Thân"], ["1984", "44 · Lục súc"], ["1986", "42 · Tử"], ["1989", "39 · Thê"], ["1991", "37 · Thân"], ["1993", "35 · Lục súc"], ["1995", "33 · Tử"], ["1998", "30 · Thê"], ["2000", "28 · Thân"], ["2002", "26 · Lục súc"], ["2004", "24 · Tử"]].map(([t, d]) => ({ t, d: `tuổi mụ ${d}`, l: "xau" })), chu_thich: "Không phạm: 1981, 1983, 1985, 1987, 1988, 1990, 1992, 1994, 1996, 1997, 1999, 2001, 2003, 2005." },

  // ===== K005 Hoang ốc =====
  "hoang-oc-bia.png": { loai: "bia", tren: "XEM TUỔI LÀM NHÀ", tieu_de: "*Hoang ốc* là gì?", phu: "Cách đếm tuổi làm nhà bằng bàn tay", chip: ["Nhất Cát", "Nhì Nghi", "Tứ Tấn Tài", "Tam Địa Sát", "Ngũ Thọ Tử", "Lục Hoang Ốc"], motif: "nha", chu: ["Kim lâu", "Hoang ốc", "Tam tai"], on: 1 },
  "sau-cung-hoang-oc.png": { loai: "vong", nhan: "Hoang ốc", tieu_de: "Sáu cung Hoang ốc: ba cung tốt, ba cung xấu", r: 78, co_vong: 25, giua: "Hoang ốc", giua_phu: "đếm theo vòng", muc: [{ t: "Nhất Cát", d: "tuổi 10", l: "tot" }, { t: "Nhì Nghi", d: "tuổi 20", l: "tot" }, { t: "Tam Địa Sát", d: "tuổi 30", l: "xau" }, { t: "Tứ Tấn Tài", d: "tuổi 40", l: "tot" }, { t: "Ngũ Thọ Tử", d: "tuổi 50", l: "xau" }, { t: "Lục Hoang Ốc", d: "tuổi 60", l: "xau" }], ghi: ["Cung *một, hai, bốn* là tốt; cung *ba, năm, sáu* dân gian thường tránh làm nhà.", "Tuổi chẵn chục đứng cố định ở 6 cung; tuổi 70 quay lại Nhất Cát.", "Năm lẻ đếm tiếp từ cung của số chục, mỗi năm sang một cung."] },
  "dem-hoang-oc-vi-du-tuoi-37.png": { loai: "luoi", nhan: "Ví dụ minh hoạ", tieu_de: "Đếm Hoang ốc cho tuổi mụ 37", phu: "Bắt đầu từ 30 ở Tam Địa Sát, mỗi năm sang một cung", cot_so: 4, co_o: 30, co_d: 21, dem: 12, o: [{ t: "30", d: "Tam Địa Sát" }, { t: "31", d: "Tứ Tấn Tài" }, { t: "32", d: "Ngũ Thọ Tử" }, { t: "33", d: "Lục Hoang Ốc" }, { t: "34", d: "Nhất Cát" }, { t: "35", d: "Nhì Nghi" }, { t: "36", d: "Tam Địa Sát" }, { t: "37", d: "Tứ Tấn Tài · tốt", l: "tot" }], chu_thich: "Tính nhanh: (số chục − 1 + số lẻ) chia 6 lấy dư → 0 Nhất Cát … 5 Lục Hoang Ốc. Tuổi 37: (3 − 1 + 7) = 9, dư 3 → Tứ Tấn Tài." },
  "cung-hoang-oc-2027.png": { loai: "luoi", nhan: "Năm 2027 · Đinh Mùi", tieu_de: "Cung Hoang ốc năm 2027 theo năm sinh", cot_so: 5, co_o: 30, co_d: 20, dem: 12, o: [["1985", "Nhất Cát", "tot"], ["1986", "Lục Hoang Ốc", "xau"], ["1987", "Ngũ Thọ Tử", "xau"], ["1988", "Tứ Tấn Tài", "tot"], ["1989", "Lục Hoang Ốc", "xau"], ["1990", "Ngũ Thọ Tử", "xau"], ["1991", "Tứ Tấn Tài", "tot"], ["1992", "Tam Địa Sát", "xau"], ["1993", "Nhì Nghi", "tot"], ["1994", "Nhất Cát", "tot"], ["1995", "Lục Hoang Ốc", "xau"], ["1996", "Ngũ Thọ Tử", "xau"], ["1997", "Tứ Tấn Tài", "tot"], ["1998", "Tam Địa Sát", "xau"]].map(([t, d, l]) => ({ t, d, l })), chu_thich: "Cung tốt chưa đủ: xét thêm Kim lâu và Tam tai (vd 1991 vẫn phạm Kim lâu Thân và Tam tai năm 2027)." },

  // ===== K006 mượn tuổi =====
  "muon-tuoi-lam-nha-bia.png": { loai: "bia", tren: "TẬP QUÁN LÀM NHÀ", co: 76, tieu_de: "*Mượn tuổi* làm nhà thế nào cho đúng?", phu: "Chọn ai, làm những bước gì", chip: ["Khi nào cần", "Mượn tuổi ai", "5 bước", "Giấy tờ không đổi"], motif: "nha", chu: ["Động thổ", "Cất nóc", "Nhập trạch"], on: 0 },
  "tieu-chi-chon-nguoi-cho-muon-tuoi.png": { loai: "buoc", nhan: "Mượn tuổi làm nhà", tieu_de: "Mượn tuổi ai? Bốn tiêu chí chọn người", co_tde: 32, co_chu: 23, buoc: [{ t: "Năm đó tuổi đẹp", d: "Không phạm Kim lâu, Hoang ốc xấu, Tam tai" }, { t: "Quan hệ gần", d: "Anh em, họ hàng, bạn thân lâu năm" }, { t: "Đang vững vàng", d: "Sức khoẻ ổn, việc làm ăn thuận" }, { t: "Thật sự sẵn lòng", d: "Nhờ trước, nói rõ các buổi cần có mặt" }] },
  "vi-du-muon-tuoi-gia-chu-1986.png": { loai: "bang", nhan: "Ví dụ minh hoạ", tieu_de: "Gia chủ sinh 1986 làm nhà 2027: mượn tuổi ai?", phu: "Gia chủ tuổi mụ 42: phạm *Kim lâu Tử* và gặp *Lục Hoang Ốc*", co_bang: 27, cot: ["Người cho mượn tuổi", "Tuổi mụ", "Kim lâu", "Hoang ốc", "Tam tai"], dong: [["Anh trai · Ất Sửu 1985", "43", { t: "Không", l: "tot" }, { t: "Nhất Cát", l: "tot" }, { t: "Không", l: "tot" }], ["Em rể · Mậu Thìn 1988", "40", { t: "Không", l: "tot" }, { t: "Tứ Tấn Tài", l: "tot" }, { t: "Không", l: "tot" }], ["Bạn thân · Giáp Tuất 1994", "34", { t: "Không", l: "tot" }, { t: "Nhất Cát", l: "tot" }, { t: "Không", l: "tot" }]], chu_thich: "Năm 2027 chỉ 9 năm sinh (1960–2005) không phạm cả ba điều: 1960, 1961, 1969, 1970, 1976, 1985, 1988, 1994, 1997." },
  "nam-buoc-muon-tuoi-lam-nha.png": { loai: "buoc", nhan: "Mượn tuổi làm nhà", tieu_de: "Năm bước mượn tuổi làm nhà theo tập quán", co_tde: 29, co_chu: 21, cao: 420, buoc: [{ t: "Thống nhất", d: "Ngày động thổ, cất nóc, nhập trạch" }, { t: "Chọn ngày động thổ", d: "Hợp việc, không xung tuổi người cho mượn" }, { t: "Lễ động thổ", d: "Người cho mượn tuổi làm nhát cuốc đầu; gia chủ tạm tránh mặt" }, { t: "Các mốc khi xây", d: "Đổ mái, cất nóc: mời lại người cho mượn" }, { t: "Mua lại, nhập trạch", d: "Gia chủ nhận lại nhà tượng trưng rồi về ở" }], chu_thich: "Mượn tuổi chỉ là nghi lễ: giấy phép xây dựng, hợp đồng, sổ đỏ vẫn đứng tên chủ đất. Vướng giấy tờ thì hỏi luật sư." },

  // ===== K007 La Hầu, Kế Đô =====
  "sao-la-hau-ke-do-2027-bia.png": { loai: "bia", tren: "SAO HẠN NĂM 2027", co: 76, tieu_de: "Gặp sao *La Hầu, Kế Đô* năm 2027", phu: "Hiểu đúng theo đời thường và việc nên làm", chip: ["Theo tuổi mụ + giới tính", "9 sao Cửu Diệu", "Việc nên làm"], motif: "sao", giua: "2027", giua_phu: "Đinh Mùi" },
  "cuu-dieu-cach-tinh-sao-han.png": { loai: "vong", nhan: "Sao hạn", tieu_de: "Chín sao Cửu Diệu và cách tính sao hạn", r: 66, co_vong: 23, giua: "Tuổi 10", giua_phu: "nam: La Hầu · nữ: Kế Đô", muc: [{ t: "La Hầu", l: "nhan" }, { t: "Thổ Tú" }, { t: "Thuỷ Diệu" }, { t: "Thái Bạch" }, { t: "Thái Dương" }, { t: "Vân Hán" }, { t: "Kế Đô", l: "nhan" }, { t: "Thái Âm" }, { t: "Mộc Đức" }], ghi: ["Tuổi mụ = năm xem − năm sinh âm lịch + 1.", "Tuổi 10: *nam ở La Hầu*, *nữ ở Kế Đô*. Mỗi năm tuổi sang một sao, nam và nữ đếm theo thứ tự riêng.", "Chín năm quay lại một vòng. Dưới 10 tuổi dân gian không tính."] },
  "tuoi-gap-la-hau-ke-do-2027.png": { loai: "bang", nhan: "Năm 2027 · Đinh Mùi", tieu_de: "Năm sinh gặp sao La Hầu, Kế Đô năm 2027", co_bang: 30, cot: ["Sao", "Nam sinh năm", "Nữ sinh năm"], dong: [[{ t: "La Hầu", l: "ho" }, "1964 · 1973 · 1982 · 1991 · 2000", "1968 · 1977 · 1986 · 1995 · 2004"], [{ t: "Kế Đô", l: "ho" }, "1967 · 1976 · 1985 · 1994 · 2003", "1964 · 1973 · 1982 · 1991 · 2000"]], chu_thich: "Cùng năm sinh, khác giới có thể khác sao: nữ 1995 gặp La Hầu, nam 1995 gặp Vân Hán. Bảng đủ 9 sao: hieuban.com/xem-sao-han/2027" },
  "viec-nen-lam-nam-la-hau-ke-do.png": { loai: "hai_cot", nhan: "Năm 2027", tieu_de: "Việc nên làm trong năm gặp La Hầu, Kế Đô", cot: [{ t: "La Hầu", d: "Năm nên nói ít, nghe nhiều, giữ giấy tờ gọn", ds: ["Hỏi thẳng người trong cuộc thay vì bàn sau lưng", "Sắp lại giấy tờ quan trọng, chụp bản sao", "Đang bực thì chờ qua một đêm mới trả lời"] }, { t: "Kế Đô", d: "Năm nên bớt lo nghĩ, quan tâm gia đình", ds: ["Gọi điện cho người nhà đều đặn", "Ngủ đủ, bớt đọc tin ban đêm", "Khi lo: viết ra 3 việc nhỏ, làm ngay 1 việc"] }] },

  // ===== K008 thần số cho người mới =====
  "than-so-nguoi-moi-bia.png": { loai: "bia", tren: "THẦN SỐ HỌC · NGƯỜI MỚI", co: 74, tieu_de: "*4 con số* cần biết trước tiên", phu: "Đường đời · Sứ mệnh · Linh hồn · Nhân cách", chip: ["Từ ngày sinh", "Từ họ tên", "Đọc cùng nhau"], motif: "so", to: [6, 9], giua: "6 · 9 · 9 · 9", giua_phu: "ví dụ minh hoạ" },
  "bon-con-so-than-so-hoc.png": { loai: "bang", nhan: "Thần số học", tieu_de: "Bốn con số chính trong thần số học", cot: ["Con số", "Tính từ", "Nói về"], dong: [["Đường đời", "Ngày, tháng, năm sinh", "Xu hướng chung, bài học lớn"], ["Sứ mệnh", "Mọi chữ cái trong họ tên", "Điều bạn hướng tới, cách làm việc"], ["Linh hồn", "Nguyên âm trong họ tên", "Điều bạn thật sự cần bên trong"], ["Nhân cách", "Phụ âm trong họ tên", "Ấn tượng người khác thấy ở bạn"]] },
  "cach-tinh-duong-doi-24-10-1988.png": { loai: "buoc", nhan: "Ví dụ minh hoạ", tieu_de: "Số Đường đời của ngày sinh 24/10/1988", co_chu: 26, buoc: [{ t: "Rút gọn từng phần", d: "Ngày 2 + 4 = 6 · tháng 1 + 0 = 1 · năm 1+9+8+8 = 26 → 8" }, { t: "Cộng ba phần", d: "6 + 1 + 8 = 15 → 1 + 5 = *6*" }, { t: "Cách cộng hết", d: "2+4+1+0+1+9+8+8 = *33* (số cái) — trang khác có thể ra số này" }], chu_thich: "Hai cách đều có trong sách. Công cụ thần số trên hieuban.com cho bạn chọn cách và báo khi hai cách lệch nhau." },
  "bang-chu-cai-pitago.png": { loai: "luoi", nhan: "Bảng chữ cái Pitago", tieu_de: "Đổi chữ thành số · ví dụ NGUYEN MINH ANH", cot_so: 9, co_o: 40, co_d: 22, dem: 14, o: [["1", "A J S"], ["2", "B K T"], ["3", "C L U"], ["4", "D M V"], ["5", "E N W"], ["6", "F O X"], ["7", "G P Y"], ["8", "H Q Z"], ["9", "I R"]].map(([t, d]) => ({ t, d })), chu_thich: "Nguyễn Minh Anh → Sứ mệnh 72 → *9* · Linh hồn (U, E, I, A) 18 → *9* · Nhân cách (phụ âm) 54 → *9*. Bỏ dấu trước khi tính; Đ tính như D." },
};

// ---------- dựng ----------
const BO_CUC = { bia, bang, buoc, luoi, vong, hai_cot: haiCot };
const trinh = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
const trang = await trinh.newPage({ viewport: { width: 1600, height: 1028 }, deviceScaleFactor: 1 });
const ds = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")));
let n = 0;
for (const b of ds) {
  const url = `https://hieuban.com/blog/${b.slug}`;
  for (const a of b.anh) {
    if (a.hinh === "bang_doc") continue;   // ảnh dọc bảng tuổi: vẽ bằng ve-bang-tuoi.mjs
    const c = NOI_DUNG[a.ten_tep];
    if (!c) throw new Error(`thiếu nội dung ảnh ${a.ten_tep}`);
    const laBia = a.vi_tri === "bia";
    const than = BO_CUC[c.loai](c, url);
    const chan = laBia ? "" : `<div class="chan"><span class="w">hieuban.com</span><span class="u">hieuban.com/blog/${e(b.slug)}</span>
      <span class="q">Quét để đọc bài đầy đủ ${qrSvg(url, 104)}</span></div>`;
    await trang.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}</style><body>${than}${chan}</body>`, { waitUntil: "load" });
    await trang.evaluate(() => document.fonts.ready);
    await trang.screenshot({ path: path.join(DIR, "anh", a.ten_tep), clip: { x: 0, y: 0, width: 1600, height: laBia ? 900 : 1028 } });
    n++;
  }
}
await trinh.close();
console.log(`đã vẽ ${n} ảnh`);
