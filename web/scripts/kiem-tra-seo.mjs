#!/usr/bin/env node
// Rà SEO kỹ thuật trên một bản đã chạy (local hoặc production): đọc sitemap.xml, mở từng trang, kiểm tra
// title · description · canonical · H1 · robots · Open Graph · JSON-LD · alt ảnh · link nội bộ hỏng · bản .md.
// Không cần thư viện ngoài. Thoát mã 1 nếu có LỖI (cảnh báo không làm hỏng).
// SEO-K: đo thêm TTFB + byte HTML (gzip) từng trang, vị trí khối "Trả lời nhanh", kiểm JSON-LD đủ chuẩn E-E-A-T
// (Article có author/publisher/ngày/ảnh; không khai "Draft"), đọc cả /sitemap-ngay.xml (mặc định 30 ngày đầu,
// --het-ngay để quét đủ). Số TTFB dùng để quyết bộ nhớ đệm HTML (CSP hash/PPR — đụng CSP-2): docs/AUDIT-AIO-SEO-2026-10.md.
//
//   node scripts/kiem-tra-seo.mjs https://hieuban.com
//   node scripts/kiem-tra-seo.mjs http://localhost:3000 --goc-canonical https://hieuban.com
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

// Trang có bản .md: thư viện /kien-thuc + mọi cụm/trang kiến thức theo silo mảng (QH-URL, lib/chuyen-huong.json).
const CHUYEN = JSON.parse(readFileSync(new URL("../lib/chuyen-huong.json", import.meta.url), "utf8"));
const GOC_MD = ["/kien-thuc", ...Object.values(CHUYEN.chu_de), CHUYEN.tuoi_huong];
const coBanMd = (d) => GOC_MD.some((g) => d === g || d.startsWith(`${g}/`));

const goc = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const iGoc = process.argv.indexOf("--goc-canonical");
const gocCanonical = (iGoc > 0 ? process.argv[iGoc + 1] : goc).replace(/\/$/, "");

const loi = [];
const canh = [];
const ghi = (ds, url, chu) => ds.push(`${url.replace(goc, "") || "/"}: ${chu}`);
const giaiMa = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (html, thuocTinh, ten) => {
  const m = html.match(new RegExp(`<meta[^>]+${thuocTinh}="${ten}"[^>]*>`, "i"));
  return m ? giaiMa(m[0].match(/content="([^"]*)"/)?.[1] ?? "") : null;
};

const UA_BOT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)";
async function lay(url, opt = {}) {
  for (let i = 0; i < 3; i++) {
    // Đọc như bot AI không chạy JS (GPTBot): metadata phải nằm sẵn trong <head> (next.config htmlLimitedBots).
    try { return await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(60_000), headers: { "user-agent": UA_BOT }, ...opt }); } catch (e) { if (i === 2) throw e; }
  }
}

const docLoc = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(gocCanonical, goc));
const sm = await (await lay(`${goc}/sitemap.xml`)).text();
const urlsChinh = docLoc(sm);
const rNgay = await lay(`${goc}/sitemap-ngay.xml`);
const urlsNgay = rNgay.status === 200 ? docLoc(await rNgay.text()) : [];
if (rNgay.status !== 200) loi.push(`/sitemap-ngay.xml: HTTP ${rNgay.status}`);
const urls = [...urlsChinh, ...(process.argv.includes("--het-ngay") ? urlsNgay : urlsNgay.slice(0, 30))];
console.log(`Sitemap: ${urlsChinh.length} URL + sitemap ngày ${urlsNgay.length} URL (quét ${urls.length - urlsChinh.length})`);
const doTtfb = [];

// URL trong sitemap mà robots.txt chặn (nhóm User-agent: *) — luật khớp dài nhất thắng, Allow thắng khi dài bằng nhau.
{
  const rb = await (await lay(`${goc}/robots.txt`)).text();
  const luat = [];
  let nhomSao = false, vuaKhaiUa = false;
  for (const dong of rb.split(/\r?\n/)) {
    const m = dong.replace(/#.*/, "").trim().match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") { nhomSao = vuaKhaiUa ? nhomSao || v === "*" : v === "*"; vuaKhaiUa = true; continue; }
    vuaKhaiUa = false;
    if (nhomSao && (k === "allow" || k === "disallow") && v) luat.push({ cho: k === "allow", duong: v });
  }
  for (const url of urls) {
    const duong = new URL(url).pathname;
    const khop = luat.filter((l) => duong.startsWith(l.duong)).sort((a, b) => b.duong.length - a.duong.length || Number(b.cho) - Number(a.cho))[0];
    if (khop && !khop.cho) ghi(loi, url, `robots.txt chặn URL có trong sitemap (Disallow: ${khop.duong})`);
  }
}

const tieuDe = new Map();
const dauH1 = new Map();
const thongKe = [];
const moTa = new Map();
const linkNoiBo = new Set();
let i = 0;
for (const url of urls) {
  i++;
  const t0 = performance.now();
  const r = await lay(url);
  const ttfb = performance.now() - t0;
  if (r.status !== 200) { ghi(loi, url, `HTTP ${r.status}`); continue; }
  const html = await r.text();
  const duong = url.replace(goc, "") || "/";
  const gz = gzipSync(html).length;
  doTtfb.push({ duong, ttfb, byte: Buffer.byteLength(html), gz });
  if (ttfb > 1500) ghi(canh, url, `TTFB ${Math.round(ttfb)} ms (> 1,5 s — bot trả lời có thể bỏ qua)`);
  if (gz > 300_000) ghi(canh, url, `HTML ${Math.round(gz / 1000)} KB gzip (> 300 KB)`);
  const viTriTl = Buffer.byteLength(html.slice(0, Math.max(0, html.indexOf("Trả lời nhanh"))));
  if (html.includes("Trả lời nhanh") && viTriTl > 100_000) ghi(canh, url, `"Trả lời nhanh" nằm sau byte ${Math.round(viTriTl / 1000)} KB`);
  const t = giaiMa(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  if (!t) ghi(loi, url, "thiếu <title>");
  else if (!/<title>/.test(html.split("</head>")[0] ?? "")) ghi(loi, url, "<title> không nằm trong <head> (bot không chạy JS đọc sai)");
  else {
    if (t.length > 70) ghi(canh, url, `title dài ${t.length} ký tự (>70): "${t}"`);
    if (t.length < 15) ghi(canh, url, `title ngắn: "${t}"`);
    tieuDe.set(t, [...(tieuDe.get(t) ?? []), duong]);
  }
  const d = meta(html, "name", "description");
  if (!d) ghi(loi, url, "thiếu meta description");
  else {
    if (d.length > 170) ghi(canh, url, `description dài ${d.length} ký tự (>170)`);
    if (d.length < 50) ghi(canh, url, `description ngắn ${d.length} ký tự`);
    moTa.set(d, [...(moTa.get(d) ?? []), duong]);
  }
  const can = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!can) ghi(loi, url, "thiếu canonical");
  else if (can.replace(gocCanonical, "") !== (duong === "/" ? "" : duong) && can.replace(gocCanonical, "") !== duong) ghi(loi, url, `canonical lệch: ${can}`);
  const robots = meta(html, "name", "robots") ?? "";
  if (/noindex/.test(robots)) ghi(loi, url, `trang trong sitemap nhưng noindex (${robots})`);
  const soH1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (soH1 !== 1) ghi(soH1 === 0 ? loi : canh, url, `${soH1} thẻ <h1>`);
  // SEO-M: cấu trúc heading — có H2, không nhảy cấp (h2 → h4), không heading rỗng, H1 không trùng giữa các trang.
  const than = html.split("</head>")[1] ?? html;
  const hds = [...than.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ cap: Number(m[1]), chu: giaiMa(m[2].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim() }));
  if (!hds.some((h) => h.cap === 2)) ghi(canh, url, "không có thẻ <h2>");
  const rong = hds.filter((h) => !h.chu);
  if (rong.length) ghi(loi, url, `${rong.length} heading rỗng (h${rong[0].cap})`);
  for (let k = 1; k < hds.length; k++) if (hds[k].cap > hds[k - 1].cap + 1) { ghi(canh, url, `heading nhảy cấp h${hds[k - 1].cap} → h${hds[k].cap} ("${hds[k].chu.slice(0, 40)}")`); break; }
  const h1 = hds.find((h) => h.cap === 1)?.chu;
  if (h1) dauH1.set(h1, [...(dauH1.get(h1) ?? []), duong]);
  // Nội dung mỏng: đếm chữ trong <main> (bỏ script/style/nav/footer). Trang kiến thức nên ≥ 300 chữ.
  const chinh = (than.match(/<main[\s\S]*?<\/main>/)?.[0] ?? than).replace(/<(script|style|nav|footer)\b[\s\S]*?<\/\1>/g, " ");
  const soChu = giaiMa(chinh.replace(/<[^>]+>/g, " ")).split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  if (soChu < 300) ghi(canh, url, `nội dung mỏng: ${soChu} chữ trong <main>`);
  const soLinkTrong = new Set([...chinh.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)].map((m) => m[1])).size;
  if (soLinkTrong < 3) ghi(canh, url, `chỉ ${soLinkTrong} link nội bộ trong nội dung chính`);
  thongKe.push({ duong, soChu, soH2: hds.filter((h) => h.cap === 2).length, soLinkTrong });
  for (const k of ["og:title", "og:description", "og:image", "og:url"]) if (!meta(html, "property", k)) ghi(canh, url, `thiếu ${k}`);
  if (!meta(html, "name", "twitter:card")) ghi(canh, url, "thiếu twitter:card");
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) ghi(canh, url, "không có JSON-LD riêng của trang (chỉ có của site)");
  for (const m of ld) {
    let goi;
    try { goi = JSON.parse(m[1]); } catch { ghi(loi, url, "JSON-LD hỏng"); continue; }
    // E-E-A-T: Article/BlogPosting phải có tác giả, nhà xuất bản, ảnh, ngày; không tự khai nháp (BM-1).
    for (const n of goi["@graph"] ?? [goi]) {
      const loai = [n["@type"]].flat();
      if (loai.some((x) => ["Article", "BlogPosting", "NewsArticle"].includes(x))) {
        for (const k of ["author", "publisher", "image", "headline"]) if (!n[k]) ghi(loi, url, `${loai[0]} thiếu ${k}`);
        if (!n.datePublished && !n.dateModified) ghi(canh, url, `${loai[0]} thiếu datePublished/dateModified`);
      }
      if (n.creativeWorkStatus === "Draft") ghi(loi, url, "schema công khai ghi creativeWorkStatus Draft (BM-1)");
    }
  }
  const loaiLd = ld.map((m) => m[1].match(/"@type":"([^"]+)"/g)?.join(",")).join(",");
  if (ld.length <= 1 && !/BreadcrumbList/.test(loaiLd) && duong !== "/") ghi(canh, url, "thiếu BreadcrumbList");
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) if (!/\balt="/.test(img)) ghi(loi, url, `ảnh thiếu alt: ${img.slice(0, 80)}`);
  if (!/<html lang="vi"/.test(html)) ghi(loi, url, "thiếu lang=vi");
  for (const m of html.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)) linkNoiBo.add(m[1]);
  if (coBanMd(duong) && !/type="text\/markdown"/.test(html)) ghi(canh, url, "thiếu link alternate .md");
  if (i % 25 === 0) console.log(`  …${i}/${urls.length}`);
}
for (const [t, ds] of tieuDe) if (ds.length > 1) canh.push(`title trùng "${t}": ${ds.join(", ")}`);
for (const [h, ds] of dauH1) if (ds.length > 1) canh.push(`H1 trùng "${h}": ${ds.slice(0, 4).join(", ")}`);
for (const [d, ds] of moTa) if (ds.length > 1) canh.push(`description trùng (${ds.length} trang): ${ds.slice(0, 4).join(", ")}`);

const daQuet = new Set(urls.map((u) => u.replace(goc, "") || "/"));
const conLai = [...linkNoiBo].filter((l) => !daQuet.has(l));
console.log(`Link nội bộ ngoài sitemap: ${conLai.length}`);
for (const l of conLai) {
  const r = await lay(`${goc}${l}`);
  if (r.status >= 400) loi.push(`link hỏng ${l}: HTTP ${r.status}`);
  else if (r.status >= 300) canh.push(`link nội bộ qua chuyển hướng ${l} → ${r.headers.get("location")}`);
}
for (const u of ["/robots.txt", "/llms.txt", "/manifest.webmanifest", "/index.md", "/blog/rss.xml"]) {
  const r = await lay(`${goc}${u}`);
  if (r.status !== 200) loi.push(`${u}: HTTP ${r.status}`);
}

if (doTtfb.length) {
  const xep = [...doTtfb].sort((a, b) => a.ttfb - b.ttfb);
  const pv = (q) => Math.round(xep[Math.min(xep.length - 1, Math.floor(q * xep.length))].ttfb);
  const gzTb = Math.round(doTtfb.reduce((s, x) => s + x.gz, 0) / doTtfb.length / 1000);
  console.log(`\nTTFB (${doTtfb.length} trang): p50 ${pv(0.5)} ms · p90 ${pv(0.9)} ms · p99 ${pv(0.99)} ms · HTML gzip TB ${gzTb} KB`);
  console.log("Chậm nhất:"); for (const x of xep.slice(-5).reverse()) console.log(`  ${Math.round(x.ttfb)} ms  ${Math.round(x.gz / 1000)} KB  ${x.duong}`);
}

if (thongKe.length) {
  const tb = (k) => Math.round(thongKe.reduce((t, x) => t + x[k], 0) / thongKe.length);
  console.log(`Nội dung (${thongKe.length} trang): TB ${tb("soChu")} chữ · ${tb("soH2")} H2 · ${tb("soLinkTrong")} link nội bộ trong <main>`);
}
console.log(`\nLỖI (${loi.length}):`); for (const x of loi) console.log("  ✗ " + x);
console.log(`\nCẢNH BÁO (${canh.length}):`); for (const x of canh) console.log("  ! " + x);
process.exit(loi.length ? 1 : 0);
