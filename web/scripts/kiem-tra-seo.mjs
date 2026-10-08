#!/usr/bin/env node
// Rà SEO kỹ thuật trên một bản đã chạy (local hoặc production): đọc sitemap.xml, mở từng trang, kiểm tra
// title · description · canonical · H1 · robots · Open Graph · JSON-LD · alt ảnh · link nội bộ hỏng · bản .md.
// Không cần thư viện ngoài. Thoát mã 1 nếu có LỖI (cảnh báo không làm hỏng).
//
//   node scripts/kiem-tra-seo.mjs https://hieuban.com
//   node scripts/kiem-tra-seo.mjs http://localhost:3000 --goc-canonical https://hieuban.com
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

async function lay(url, opt = {}) {
  for (let i = 0; i < 3; i++) {
    try { return await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(60_000), ...opt }); } catch (e) { if (i === 2) throw e; }
  }
}

const sm = await (await lay(`${goc}/sitemap.xml`)).text();
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(gocCanonical, goc));
console.log(`Sitemap: ${urls.length} URL`);

const tieuDe = new Map();
const moTa = new Map();
const linkNoiBo = new Set();
let i = 0;
for (const url of urls) {
  i++;
  const r = await lay(url);
  if (r.status !== 200) { ghi(loi, url, `HTTP ${r.status}`); continue; }
  const html = await r.text();
  const duong = url.replace(goc, "") || "/";
  const t = giaiMa(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  if (!t) ghi(loi, url, "thiếu <title>");
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
  for (const k of ["og:title", "og:description", "og:image", "og:url"]) if (!meta(html, "property", k)) ghi(canh, url, `thiếu ${k}`);
  if (!meta(html, "name", "twitter:card")) ghi(canh, url, "thiếu twitter:card");
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) ghi(canh, url, "không có JSON-LD riêng của trang (chỉ có của site)");
  for (const m of ld) { try { JSON.parse(m[1]); } catch { ghi(loi, url, "JSON-LD hỏng"); } }
  const loaiLd = ld.map((m) => m[1].match(/"@type":"([^"]+)"/g)?.join(",")).join(",");
  if (ld.length <= 1 && !/BreadcrumbList/.test(loaiLd) && duong !== "/") ghi(canh, url, "thiếu BreadcrumbList");
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) if (!/\balt="/.test(img)) ghi(loi, url, `ảnh thiếu alt: ${img.slice(0, 80)}`);
  if (!/<html lang="vi"/.test(html)) ghi(loi, url, "thiếu lang=vi");
  for (const m of html.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)) linkNoiBo.add(m[1]);
  if (duong.startsWith("/kien-thuc") && !/type="text\/markdown"/.test(html)) ghi(canh, url, "thiếu link alternate .md");
  if (i % 25 === 0) console.log(`  …${i}/${urls.length}`);
}
for (const [t, ds] of tieuDe) if (ds.length > 1) canh.push(`title trùng "${t}": ${ds.join(", ")}`);
for (const [d, ds] of moTa) if (ds.length > 1) canh.push(`description trùng (${ds.length} trang): ${ds.slice(0, 4).join(", ")}`);

const daQuet = new Set(urls.map((u) => u.replace(goc, "") || "/"));
const conLai = [...linkNoiBo].filter((l) => !daQuet.has(l));
console.log(`Link nội bộ ngoài sitemap: ${conLai.length}`);
for (const l of conLai) {
  const r = await lay(`${goc}${l}`);
  if (r.status >= 400) loi.push(`link hỏng ${l}: HTTP ${r.status}`);
  else if (r.status >= 300) canh.push(`link nội bộ qua chuyển hướng ${l} → ${r.headers.get("location")}`);
}
for (const u of ["/robots.txt", "/llms.txt", "/llms-full.txt", "/manifest.webmanifest", "/index.md"]) {
  const r = await lay(`${goc}${u}`);
  if (r.status !== 200) loi.push(`${u}: HTTP ${r.status}`);
}

console.log(`\nLỖI (${loi.length}):`); for (const x of loi) console.log("  ✗ " + x);
console.log(`\nCẢNH BÁO (${canh.length}):`); for (const x of canh) console.log("  ! " + x);
process.exit(loi.length ? 1 : 0);
