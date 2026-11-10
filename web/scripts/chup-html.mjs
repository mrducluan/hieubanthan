#!/usr/bin/env node
// EN-ALL mục 5.1 (phần web) — chụp HTML MÁY CHỦ của ~60 trang Việt đại diện để so trước / sau khi đổi khung, layout,
// catalog chữ. Bản Việt phải không đổi: mọi sửa cho bản Anh đi qua lớp ngôn ngữ, không chạm chữ / bố cục bản Việt.
//
// Chuẩn hoá trước khi lưu (chỉ bỏ thứ đổi theo lượt tải / theo bản build, KHÔNG bỏ chữ hay thuộc tính):
//   - bỏ mọi <script>…</script> (dữ liệu RSC, mã chunk theo bản build) — chữ hiển thị nằm trong HTML, không trong script;
//     JSON-LD giữ lại (là nội dung SEO, phải không đổi);
//   - bỏ thuộc tính nonce="…" (CSP-2: mỗi lượt một nonce);
//   - "/_next/static/<băm>" → "/_next/static/*", "?dpl=…" bỏ; bỏ <meta name="next-size-adjust"> (vị trí đổi theo lượt);
//   - ráp các khối stream (Suspense) về đúng chỗ — thứ tự gửi đổi theo từng lượt;
//   - xuống dòng trước mỗi thẻ để diff đọc được.
//
// Dùng (cần web đang chạy — `npm run build && npm start` — và engine):
//   node scripts/chup-html.mjs --ra <thư mục> [--goc http://localhost:3000] [--en]
//   node scripts/chup-html.mjs --so <thư mục trước> <thư mục sau>
// `--en` chụp thêm các trang /en (đổi có chủ đích ở EN-ALL — chỉ để xem, không tính là hồi quy).
// Ảnh chụp phụ thuộc ngày (trang Hôm nay, Xem ngày tốt…) → chụp trước và sau trong CÙNG một ngày; không lưu vào git.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const TRANG_VI = [
  "/", "/huyen-hoc", "/kien-thuc", "/tu-dien", "/blog",
  "/than-so", "/than-so/y-nghia-so", "/than-so/nghe-nghiep", "/than-so/tinh-yeu", "/than-so/nam-ca-nhan",
  "/than-so/no-nghiep", "/than-so/so-kep", "/hop-doi", "/hop-doi/cap-so",
  "/tarot", "/tarot/la-bai",
  "/tu-vi", "/tu-vi/chinh-tinh", "/tu-vi/cung", "/tu-vi/sao-o-cung", "/tu-vi/tu-hoa", "/tu-vi/co-thu", "/tu-vi/la-so-mau",
  "/bat-tu", "/bat-tu/thap-than", "/bat-tu/nhat-chu", "/bat-tu/menh-theo-nam",
  "/kinh-dich", "/kinh-dich/que",
  "/phong-thuy", "/phong-thuy/dau-hieu", "/phong-thuy/huong-hop-tuoi", "/phong-thuy/huong-xau-nam",
  "/nhan-tuong", "/nhan-tuong/bo-vi",
  "/hom-nay", "/ban-than", "/thoi-gian-toi", "/chan-dung",
  "/xem-ngay-tot", "/lich-am", "/doi-lich-am-duong", "/nam", "/xem-sao-han", "/xem-tuoi-lam-nha", "/tuoi-xong-dat",
  "/sinh-o-nuoc-ngoai",
  "/tac-gia", "/tac-gia/duc-luan", "/gioi-thieu", "/lien-he", "/chinh-sach-rieng-tu", "/dieu-khoan", "/mien-tru-trach-nhiem",
  "/dang-nhap", "/tai-khoan", "/nap-sao", "/ung-ho",
];
/** Cụm có trang con: chụp thêm trang con ĐẦU TIÊN (tìm trong chính trang cụm) — đủ đại diện cho mẫu trang con. */
const CUM_CO_CON = [
  "/than-so/y-nghia-so", "/than-so/nghe-nghiep", "/hop-doi/cap-so", "/tarot/la-bai", "/tu-vi/chinh-tinh", "/tu-vi/sao-o-cung",
  "/tu-vi/la-so-mau", "/bat-tu/thap-than", "/bat-tu/menh-theo-nam", "/kinh-dich/que", "/phong-thuy/dau-hieu",
  "/phong-thuy/huong-hop-tuoi", "/nhan-tuong/bo-vi", "/lich-am", "/nam", "/sinh-o-nuoc-ngoai",
];
const TRANG_EN = ["/en", "/en/numerology", "/en/numerology/life-path", "/en/numerology/life-path/7", "/en/tarot", "/en/tarot/cards",
  "/en/tarot/cards/the-fool", "/en/privacy", "/en/terms", "/en/khong-co"];

const arg = process.argv.slice(2);
const lay = (k) => { const i = arg.indexOf(k); return i >= 0 ? arg[i + 1] : undefined; };

/** Vị trí ngay sau thẻ đóng khớp với thẻ mở `<tag` tại `tu` (đếm lồng nhau). */
function hetThe(html, tu, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  re.lastIndex = tu;
  let sau = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    sau += m[0].startsWith("</") ? -1 : 1;
    if (sau === 0) return m.index + m[0].length;
  }
  return -1;
}

/** Vị trí ngay sau `<!--/$-->` khớp với ranh giới Suspense mở tại `tu` (đếm `<!--$…-->` lồng nhau). */
function hetRanhGioi(html, tu) {
  const re = /<!--\$[?!]?-->|<!--\/\$-->/g;
  re.lastIndex = tu;
  let sau = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    sau += m[0] === "<!--/$-->" ? -1 : 1;
    if (sau === 0) return m.index + m[0].length;
  }
  return -1;
}

/** Ráp phần stream: Next gửi khung trước (`<!--$?--><template id="B:n"></template>chờ…<!--/$-->`), nội dung thật tới sau
 *  trong `<div hidden id="S:n">…</div>`. Khối nào xong trước lúc gửi khung thì đã nằm sẵn tại chỗ. Thứ tự này đổi theo
 *  từng lượt → ráp mọi khối về đúng chỗ để hai lượt chụp so được với nhau. */
function rapStream(html) {
  for (let vong = 0; vong < 200; vong++) {
    const m = /<div hidden="" id="S:(\d+)">|<div hidden id="S:(\d+)">/.exec(html);
    if (!m) break;
    const n = m[1] ?? m[2];
    const het = hetThe(html, m.index, "div");
    if (het < 0) break;
    const noiDung = html.slice(m.index + m[0].length, het - "</div>".length);
    html = html.slice(0, m.index) + html.slice(het);
    const b = html.indexOf(`<template id="B:${n}"></template>`);
    const mo = b < 0 ? -1 : html.lastIndexOf("<!--$?-->", b);
    const dong = mo < 0 ? -1 : hetRanhGioi(html, mo);
    if (dong < 0) continue;
    html = html.slice(0, mo) + "<!--$-->" + noiDung + "<!--/$-->" + html.slice(dong);
  }
  return html;
}

/** Bỏ khối <script> (trừ JSON-LD) tới khi không còn gì để bỏ — ảnh chụp để so, không phải bộ lọc an toàn. */
function boScript(html) {
  let s = html, truoc;
  do { truoc = s; s = s.replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script[^>]*>/gi, ""); } while (s !== truoc);
  return s;
}

/** HTML máy chủ → bản chuẩn hoá (giữ chữ, thẻ, thuộc tính; bỏ thứ đổi theo lượt / bản build). */
export function chuanHoa(html) {
  return boScript(rapStream(html))
    .replace(/\snonce="[^"]*"/g, "")
    .replace(/\/_next\/static\/[^"'\s)]+/g, "/_next/static/*")
    .replace(/([?&])dpl=[^"&'\s]+/g, "$1")
    .replace(/<link rel="preload"[^>]*as="script"[^>]*\/?>/g, "")
    .replace(/<meta name="next-size-adjust"[^>]*\/?>/g, "")   // Next tự chèn, vị trí đổi theo lượt stream metadata
    .replace(/></g, ">\n<");
}

const tenTep = (u) => (u === "/" ? "_trang-chu" : u.replace(/^\//, "").replace(/[/?#=&]/g, "__")) + ".html";

async function tai(goc, u) {
  const r = await fetch(goc + u, { redirect: "manual", headers: { "accept-language": "vi-VN,vi;q=0.9" } });
  const loai = r.headers.get("content-type") ?? "";
  const than = loai.includes("html") ? await r.text() : "";
  return { status: r.status, vi_tri: r.headers.get("location") ?? "", than };
}

async function chup(ra, goc, coEn) {
  mkdirSync(ra, { recursive: true });
  const ds = [...TRANG_VI];
  for (const c of CUM_CO_CON) {
    const { than } = await tai(goc, c);
    const m = [...than.matchAll(/href="([^"#?]+)"/g)].map((x) => x[1]).find((h) => h.startsWith(c + "/") && h.split("/").length > c.split("/").length);
    if (m && !ds.includes(m)) ds.push(m);
  }
  if (coEn) ds.push(...TRANG_EN);
  const tom = [];
  for (const u of ds) {
    const { status, vi_tri, than } = await tai(goc, u);
    writeFileSync(path.join(ra, tenTep(u)), `<!-- ${u} · ${status}${vi_tri ? ` → ${vi_tri}` : ""} -->\n${chuanHoa(than)}`);
    tom.push(`${status}\t${u}`);
    process.stdout.write(status === 200 ? "." : `[${status} ${u}]`);
  }
  writeFileSync(path.join(ra, "_danh-sach.txt"), tom.join("\n") + "\n");
  console.log(`\n${ds.length} trang → ${ra}`);
}

function so(a, b) {
  const ds = readdirSync(a).filter((f) => f.endsWith(".html"));
  let lech = 0;
  for (const f of ds) {
    const pb = path.join(b, f);
    if (!existsSync(pb)) { console.log(`THIẾU ở bản sau: ${f}`); lech++; continue; }
    const doc = (p) => readFileSync(p, "utf8").split("\n").filter((l) => !l.startsWith('<meta name="next-size-adjust"'));
    const x = doc(path.join(a, f)), y = doc(pb);
    if (x.join("\n") === y.join("\n")) continue;
    lech++;
    const en = f.startsWith("en");
    console.log(`\n${en ? "ĐỔI (bản Anh — có chủ đích?)" : "LỆCH"}: ${f}`);
    // Diff thô theo dòng: dòng chỉ có ở một bên (đủ để thấy chỗ đổi; không cần thuật toán LCS cho vài chục dòng lệch).
    const sx = new Set(x), sy = new Set(y);
    x.filter((l) => !sy.has(l)).slice(0, 12).forEach((l) => console.log(`  - ${l.slice(0, 220)}`));
    y.filter((l) => !sx.has(l)).slice(0, 12).forEach((l) => console.log(`  + ${l.slice(0, 220)}`));
  }
  const sach = (p) => readFileSync(p, "utf8").split("\n").filter((l) => !l.startsWith('<meta name="next-size-adjust"')).join("\n");
  const viLech = ds.filter((f) => !f.startsWith("en") && (!existsSync(path.join(b, f)) || sach(path.join(a, f)) !== sach(path.join(b, f)))).length;
  console.log(`\n${ds.length} trang · ${lech} khác · bản Việt lệch ${viLech}`);
  process.exit(viLech ? 1 : 0);
}

const soA = lay("--so");
if (soA) so(soA, arg[arg.indexOf("--so") + 2]);
else {
  const ra = lay("--ra");
  if (!ra) { console.error("Dùng: --ra <thư mục> | --so <trước> <sau>"); process.exit(2); }
  await chup(ra, (lay("--goc") ?? "http://localhost:3000").replace(/\/$/, ""), arg.includes("--en"));
}
