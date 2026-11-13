// KW-6T ý 2 — hai ảnh DỌC 1080×1350 "Bảng tuổi 2027" để người đọc lưu về máy / chia sẻ (Zalo, Facebook):
//   anh/bang-tuoi-lam-nha-2027.png  — 46 năm sinh 1960–2005: làm nhà được, hay vướng Kim lâu / Hoang ốc / Tam tai
//   anh/bang-sao-han-2027.png       — 46 năm sinh: sao Cửu Diệu năm 2027 của nam và nữ
// Số liệu: du-lieu/bang-tuoi-2027.json, xuất từ engine (luangiai.tuoi_dan_gian.lam_nha_nam + calc.tuoi_dan_gian.sao_han) — cùng hàm
// trang /xem-tuoi-lam-nha/2027 và /xem-sao-han/2027; KHÔNG tính lại ở đây. QR trỏ về trang công cụ tương ứng.
//   node cms/src/bai-khoi-tao/kw6t/ve-bang-tuoi.mjs
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
const DS = JSON.parse(fs.readFileSync(path.join(DIR, "du-lieu", "bang-tuoi-2027.json"), "utf8"));

const qrSvg = (url, px) => {
  const q = maHoaQr(url); const n = q.kichThuoc + 8; const o = Math.floor(px / n);
  return `<svg width="${n * o}" height="${n * o}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${duongQr(q)}" fill="#1d1830"/></svg>`;
};
const e = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const CSS = `
@font-face{font-family:BV;src:url(${FONT("BeVietnamPro-SemiBold.ttf")})}
@font-face{font-family:NR;src:url(${FONT("Newsreader.ttf")})}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;font-family:BV,sans-serif;color:#262033;
  background:radial-gradient(900px 600px at 90% 0%,#fff8e6 0,transparent 60%),radial-gradient(800px 700px at 0% 100%,#efe4cc 0,transparent 60%),#f6f0e2}
.trong{padding:44px 48px 0}
.dau{display:flex;align-items:center;justify-content:space-between}.dau svg{height:38px;width:auto}
.dau span{font-size:21px;color:#7b6a48}
h1{font-family:NR,serif;font-weight:600;color:#2a2140;font-size:54px;line-height:1.1;margin-top:26px}
.phu{font-size:22px;color:#5d5170;margin-top:10px}
.luoi{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin-top:22px}
.o{border-radius:14px;padding:9px 11px;height:104px;border:2px solid #e3d6b8;background:#fffaf0}
.o b{font-family:NR,serif;font-size:29px;color:#2a2140;display:block;line-height:1}
.o i{font-style:normal;font-size:15px;color:#6d6380;display:block;margin-top:2px}
.o u{text-decoration:none;font-size:15px;line-height:1.25;display:block;margin-top:5px}
.tot{background:#e9f3ec;border-color:#9cc6ad}.tot u{color:#2f6b4f}
.vuong{background:#fbefe0;border-color:#e2b98a}.vuong u{color:#a5591b}
.nhan{color:#a5591b}
.chu{display:flex;gap:22px;flex-wrap:wrap;font-size:18px;color:#5d5170;margin-top:14px;align-items:center}
.chu em{font-style:normal;display:inline-block;width:18px;height:18px;border-radius:5px;vertical-align:-3px;margin-right:6px}
.chan{position:absolute;left:0;right:0;bottom:0;height:118px;background:#2a2140;color:#f6f0e2;display:flex;align-items:center;padding:0 48px;gap:20px}
.chan .w{font-size:30px;color:#f0c66b}.chan .u{font-size:19px;color:#d8cfbd;line-height:1.35}
.chan .q{margin-left:auto}
`;

const khung = (nhanPhai, tieuDe, phu, luoi, chu, url, moi) => `<div class="trong">
  <div class="dau">${LOGO}<span>${e(nhanPhai)}</span></div>
  <h1>${e(tieuDe)}</h1><div class="phu">${e(phu)}</div>
  <div class="luoi">${luoi}</div><div class="chu">${chu}</div></div>
  <div class="chan"><span class="w">hieuban.com</span><span class="u">${e(moi)}<br>${e(url.replace("https://", ""))}</span>
  <span class="q">${qrSvg(url, 92)}</span></div>`;

// Nhãn gọn theo NHÓM (loại Kim lâu, tên cung Hoang ốc, năm thứ mấy của Tam tai: xem trang công cụ qua QR).
const ngan = (x) => (x.startsWith("Kim lâu") ? "Kim lâu" : x.startsWith("Tam tai") ? "Tam tai" : "Hoang ốc");
const lamNha = () => {
  const luoi = DS.map((d) => d.thuan
    ? `<div class="o tot"><b>${d.n}</b><i>${e(d.cc)}</i><u>Làm nhà được</u></div>`
    : `<div class="o vuong"><b>${d.n}</b><i>${e(d.cc)}</i><u>${[...new Set(d.xau.map(ngan))].join(" · ")}</u></div>`).join("");
  const chu = `<span><em style="background:#e9f3ec;border:2px solid #9cc6ad"></em>Không vướng Kim lâu, Hoang ốc, Tam tai</span>
    <span><em style="background:#fbefe0;border:2px solid #e2b98a"></em>Dân gian thường tránh hoặc mượn tuổi</span>`;
  return khung("Năm 2027 · Đinh Mùi", "Tuổi làm nhà năm 2027", "46 năm sinh 1960–2005 · tính theo tuổi mụ, năm âm lịch Đinh Mùi",
    luoi, chu, "https://hieuban.com/xem-tuoi-lam-nha/2027", "Tra tuổi của bạn và lý do chi tiết");
};
const sao = (s) => (s === "La Hầu" || s === "Kế Đô" ? `<span class="nhan">${e(s)}</span>` : e(s));
const saoHan = () => {
  const luoi = DS.map((d) => `<div class="o"><b>${d.n}</b><i>${e(d.cc)}</i><u>Nam: ${sao(d.nam)}<br>Nữ: ${sao(d.nu)}</u></div>`).join("");
  const chu = `<span>Sao đổi theo tuổi mụ, chín năm quay lại một vòng. Tô màu: La Hầu, Kế Đô — năm nên chậm lại, giữ giấy tờ gọn.</span>`;
  return khung("Năm 2027 · Đinh Mùi", "Sao hạn năm 2027 theo năm sinh", "Sao Cửu Diệu của nam và nữ · tập quán dân gian, không phải lời phán",
    luoi, chu, "https://hieuban.com/xem-sao-han/2027", "Xem sao hạn và việc nên làm");
};

const trinh = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
const trang = await trinh.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const [ten, than] of [["bang-tuoi-lam-nha-2027.png", lamNha()], ["bang-sao-han-2027.png", saoHan()]]) {
  await trang.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}</style><body>${than}</body>`, { waitUntil: "load" });
  await trang.evaluate(() => document.fonts.ready);
  const tran = await trang.evaluate(() => document.querySelector(".chu").getBoundingClientRect().bottom);
  if (tran > 1350 - 118 - 8) throw new Error(`${ten}: nội dung đè dải chân (${Math.round(tran)} px)`);
  await trang.screenshot({ path: path.join(DIR, "anh", ten) });
}
await trinh.close();
console.log("đã vẽ 2 bảng tuổi");
