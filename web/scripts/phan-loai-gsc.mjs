#!/usr/bin/env node
// Phân loại danh sách URL xuất từ Search Console (Lập chỉ mục trang → một lý do, vd "Đã phát hiện – hiện chưa lập chỉ mục"
// → Xuất → CSV) theo cụm trang, đối chiếu sitemap đang chạy, và ghi khuyến nghị index / không cho từng nhóm.
// Không thư viện ngoài, không ghi gì lên site. URL không còn trong sitemap được kiểm tra trạng thái (308/404/noindex) — chỉ
// những URL đó, để không quét lại cả site (mỗi lượt là một lần chạy hàm Vercel).
//
//   node scripts/phan-loai-gsc.mjs Table.csv
//   node scripts/phan-loai-gsc.mjs Table.csv --goc https://hieuban.com --khong-kiem
// Báo cáo nguồn: docs/AUDIT-INDEX-2026-11.md
import { readFileSync } from "node:fs";

const tep = process.argv[2];
if (!tep) { console.error("Cách dùng: node scripts/phan-loai-gsc.mjs <tệp CSV xuất từ Search Console>"); process.exit(2); }
const iGoc = process.argv.indexOf("--goc");
const goc = (iGoc > 0 ? process.argv[iGoc + 1] : "https://hieuban.com").replace(/\/$/, "");
const kiem = !process.argv.includes("--khong-kiem");

// Cụm → [mức, lời khuyên]. Mức: A = nên index, ưu tiên · B = nên index, chờ được · C = nên thu hẹp / không cần index.
const KHUYEN = {
  "tru": ["A", "Trang trụ / hub / công cụ — phải index. Yêu cầu lập chỉ mục bằng tay nếu chưa có."],
  "tu-vi/sao-o-cung": ["A", "Kiến thức riêng (phần trùng ~0,35 = khung chung). Giữ index."],
  "tu-vi/tu-hoa": ["A", "Kiến thức riêng (trùng ~0,41). Giữ index."],
  "kinh-dich/que": ["A", "64 quẻ, trùng ~0,26. Giữ index."],
  "hop-doi/cap-so": ["A", "Trùng ~0,32. Giữ index."],
  "than-so/so-kep": ["A", "Trùng ~0,40. Giữ index."],
  "kb-nho": ["A", "Cụm kiến thức nhỏ (chính tinh, cung, ý nghĩa số, nghề, tình yêu, thập thần, nhật chủ, dấu hiệu…). Giữ index."],
  "bat-tu/menh-theo-nam": ["A", "Nhu cầu tìm lớn ('sinh năm X mệnh gì') nhưng trùng 0,55–0,62 (năm cách 60 năm cùng can chi). Giữ index, tăng phần riêng."],
  "blog": ["A", "Bài viết. Giữ index."],
  "tuoi-theo-nam": ["B", "Tuổi làm nhà / xông đất / Tử vi năm theo tuổi: trùng 0,54–0,56, trang ngắn. Index theo mùa Tết; Google sẽ lấy dần."],
  "xem-ngay-tot/thang": ["B", "Lịch tháng: trùng ~0,37. Giữ index."],
  "lich-am": ["B", "Lịch âm theo năm. Giữ index."],
  "xem-ngay-tot/viec-thang": ["C", "Ngày tốt theo việc × tháng: trùng ~0,55; tháng xa ít người tìm. Đề xuất thu cửa sổ sitemap (xem báo cáo)."],
  "xem-ngay-tot/ngay": ["C", "Trang từng ngày: trùng ~0,51; ngày xa hơn ~90 ngày gần như không ai tìm. Đề xuất thu cửa sổ index."],
  "khac": ["?", "Chưa phân loại — xem tay."],
};

function cum(duong) {
  const p = duong.replace(/^\/|\/$/g, "").split("/");
  if (p[0] === "xem-ngay-tot" && p.length === 2) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(p[1])) return "xem-ngay-tot/ngay";
    return p[1].startsWith("thang-") ? "xem-ngay-tot/thang" : "xem-ngay-tot/viec-thang";
  }
  if (["xem-tuoi-lam-nha", "tuoi-xong-dat", "nam"].includes(p[0]) && /^tuoi-\d{4}$/.test(p[2] ?? "")) return "tuoi-theo-nam";
  if (p[0] === "lich-am") return "lich-am";
  if (p[0] === "blog" && p.length >= 2 && p[1] !== "chuyen-muc" && p[1] !== "trang") return "blog";
  const hai = p.slice(0, 2).join("/");
  if (p.length >= 3 && KHUYEN[hai]) return hai;
  if (p.length >= 3) return "kb-nho";
  return "tru";
}

const docLoc = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const laySm = async (d) => { const r = await fetch(`${goc}${d}`); return r.ok ? docLoc(await r.text()) : []; };
const trongSm = new Set([...(await laySm("/sitemap.xml")), ...(await laySm("/sitemap-ngay.xml"))]);

const dong = readFileSync(tep, "utf8").split(/\r?\n/).slice(1).filter(Boolean);
const urls = [...new Set(dong.map((d) => d.split(",")[0].replace(/^"|"$/g, "")).filter((u) => u.startsWith("http")))];
const nhom = new Map();
const ngoaiSm = [];
for (const u of urls) {
  const duong = decodeURIComponent(new URL(u).pathname);
  if (!trongSm.has(new URL(u).pathname)) { ngoaiSm.push(u); continue; }
  const k = cum(duong);
  nhom.set(k, [...(nhom.get(k) ?? []), duong]);
}

console.log(`${urls.length} URL trong tệp · ${urls.length - ngoaiSm.length} có trong sitemap đang chạy · ${ngoaiSm.length} không còn trong sitemap\n`);
const thu = { A: 0, B: 1, C: 2, "?": 3 };
for (const [k, ds] of [...nhom].sort((a, b) => thu[KHUYEN[a[0]][0]] - thu[KHUYEN[b[0]][0]] || b[1].length - a[1].length)) {
  const [muc, loi] = KHUYEN[k];
  console.log(`[${muc}] ${k} — ${ds.length} URL\n    ${loi}\n    vd: ${ds.slice(0, 3).join(" · ")}`);
}

if (ngoaiSm.length) {
  console.log(`\nURL không còn trong sitemap (thường là URL cũ đã 308 / ngày ngoài cửa sổ — để chưa index là ĐÚNG):`);
  for (const u of ngoaiSm) {
    if (!kiem) { console.log(`    ${u}`); continue; }
    try {
      const r = await fetch(u, { redirect: "manual", headers: { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" } });
      const html = r.status === 200 ? await r.text() : "";
      const ni = /<meta[^>]+name="robots"[^>]+noindex/i.test(html) ? " noindex" : "";
      console.log(`    ${r.status}${ni}${r.headers.get("location") ? ` → ${r.headers.get("location")}` : ""}  ${u}`);
    } catch (e) { console.log(`    lỗi ${e.message}  ${u}`); }
  }
}
