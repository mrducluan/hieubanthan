// SEO-K (chủ dự án duyệt 2026-10-21) — quyết định từ audit AIO/SEO: nội dung lập trình có phần riêng, link NotFair
// sponsored, tiêu đề có từ khoá, phân trang blog, sitemap trang ngày, ảnh đại diện theo mảng, schema E-E-A-T.
import { test, expect } from "@playwright/test";
import { laLinkNoiBo, sanitizeNotFairArticleHtml } from "../lib/notfair-article";
import { catTrang, docSoTrang, duongTrangSo, soTrang } from "../lib/phan-trang";
import { vanHanh } from "../lib/van-hanh";

test("NotFair: link ra ngoài gắn sponsored nofollow, link về hieuban.com giữ follow", () => {
  expect(laLinkNoiBo("/than-so")).toBe(true);
  expect(laLinkNoiBo("https://www.hieuban.com/blog")).toBe(true);
  expect(laLinkNoiBo("//evil.example/x")).toBe(false);
  const html = sanitizeNotFairArticleHtml('<p><a href="https://notfair.co/x">a</a> <a href="/tu-vi">b</a> <a href="https://hieuban.com/x">c</a></p>');
  expect(html).toContain('<a href="https://notfair.co/x" rel="sponsored nofollow noopener noreferrer">');
  expect(html).toContain('<a href="/tu-vi" rel="noopener noreferrer">');
  expect(html).toContain('<a href="https://hieuban.com/x" rel="noopener noreferrer">');
});

test("phân trang: 24 bài/trang, trang 1 không có /trang/1", () => {
  expect(soTrang(0)).toBe(1);
  expect(soTrang(49)).toBe(3);
  expect(catTrang(Array.from({ length: 30 }, (_, i) => i), 2)).toEqual([24, 25, 26, 27, 28, 29]);
  expect(duongTrangSo("/blog", 1)).toBe("/blog");
  expect(duongTrangSo("/blog", 3)).toBe("/blog/trang/3");
  expect(docSoTrang("01")).toBeNull();
  expect(docSoTrang("2")).toBe(2);
});

test("robots khai 2 sitemap; sitemap ngày đúng cửa sổ; /blog/trang/1 → 308, trang quá số → 404", async ({ request }) => {
  const rb = await (await request.get("/robots.txt")).text();
  expect(rb).toMatch(/Sitemap: .*\/sitemap\.xml/);
  expect(rb).toMatch(/Sitemap: .*\/sitemap-ngay\.xml/);
  const sn = await request.get("/sitemap-ngay.xml");
  expect(sn.status()).toBe(200);
  const locs = [...(await sn.text()).matchAll(/<loc>[^<]*\/xem-ngay-tot\/(\d{4}-\d{2}-\d{2})<\/loc>/g)];
  // Q-I1 (2026-11-05): cửa sổ −7…+90 (chừa 1 ngày hai đầu) → 96 URL, trước là −7…+400.
  expect(locs.length).toBe(96);
  const r1 = await request.get("/blog/trang/1", { maxRedirects: 0 });
  expect(r1.status()).toBe(308);
  expect((await request.get("/blog/trang/999")).status()).toBe(404);
});

test("trang chủ + blog có tiêu đề chứa từ khoá; WebSite có keywords", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain("<title>Hiểu Bản Thân — Thần số học và huyền học online miễn phí</title>");
  expect(html).toContain('"alternateName":["hieuban.com","Hieu Ban Than"]');
  const blog = await (await request.get("/blog")).text();
  expect(blog).toMatch(/<title>Blog thần số học, Tử vi, phong thuỷ, Kinh Dịch/);
});

// SEO-N (2026-11-10): tìm "tử vi hieuban" Google trả trang chủ — trang dịch vụ phải tự đứng tên từ khoá + thương hiệu,
// trang chủ không tranh từ "Tử vi"; WebApplication của site chỉ ở trang chủ.
test("SEO-N: trang dịch vụ có từ khoá + thương hiệu trong tiêu đề; trang chủ không tranh từ khoá", async ({ request }) => {
  const chu = await (await request.get("/")).text();
  const tieuDeChu = /<title>([^<]*)<\/title>/.exec(chu)?.[1] ?? "";
  expect(tieuDeChu).toContain("Hiểu Bản Thân");
  expect(tieuDeChu).not.toMatch(/Tử vi|Bát tự/);
  expect(chu).toMatch(/"@type":"WebApplication","@id":"[^"]*\/#ung-dung"/);
  for (const [duong, tu] of [["/tu-vi", "Xem Tử vi"], ["/bat-tu", "Xem Bát tự"], ["/kinh-dich", "Gieo quẻ Kinh Dịch"], ["/phong-thuy", "Xem phong thuỷ"], ["/than-so", "Thần số học online"]] as const) {
    const html = await (await request.get(duong)).text();
    const t = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
    expect(t.startsWith(tu), `${duong}: ${t}`).toBe(true);
    expect(t.endsWith("· Hiểu Bản Thân"), `${duong}: ${t}`).toBe(true);
    expect(t.length).toBeLessThanOrEqual(70);
    expect(html).not.toMatch(/"@type":"WebApplication","@id":"[^"]*\/#ung-dung"/);
    expect(html).toMatch(new RegExp(`"@type":"WebApplication","@id":"[^"]*${duong}#ung-dung"`));
  }
});

test("SEO-N: mọi trang dịch vụ / trang trụ mang thương hiệu trong tiêu đề (≤ 70 ký tự) và có đúng một H1 dài hơn một từ khoá trần", async ({ request }) => {
  const TRANG = ["/tu-vi", "/bat-tu", "/than-so", "/kinh-dich", "/phong-thuy", "/nhan-tuong", "/tarot", "/hop-doi", "/huyen-hoc", "/kien-thuc", "/blog",
    "/nam", "/nam/2027", "/xem-ngay-tot", "/xem-tuoi-lam-nha", "/tuoi-xong-dat", "/xem-sao-han", "/chan-dung", "/thoi-gian-toi", "/tu-dien",
    "/doi-lich-am-duong", "/lich-am", "/sinh-o-nuoc-ngoai", "/xem-tuoi-lam-nha/2027", "/tuoi-xong-dat/2027", "/xem-sao-han/2027"];
  for (const duong of TRANG) {
    const html = await (await request.get(duong)).text();
    const t = (/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "").replace(/&amp;/g, "&");
    expect(t, duong).toContain("Hiểu Bản Thân");
    expect(t.length, `${duong}: ${t}`).toBeLessThanOrEqual(70);
    expect(html.match(/<h1[\s>]/g)?.length, duong).toBe(1);
  }
  for (const [duong, tu] of [["/kinh-dich", "Gieo quẻ Kinh Dịch"], ["/phong-thuy", "Xem phong thuỷ"], ["/nhan-tuong", "Xem tướng mặt"], ["/tarot", "Xem Tarot"]] as const) {
    const html = await (await request.get(duong)).text();
    expect(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "", duong).toContain(tu);
  }
});

test("trang kiến thức: ảnh đại diện theo mảng, about có sameAs Wikipedia, Article đủ E-E-A-T", async ({ request }) => {
  const html = await (await request.get("/tu-vi/sao-o-cung/tu-vi-cung-menh")).text();
  expect(html).toMatch(/og:image" content="[^"]*mang=tu-vi/);
  expect(html).toContain('"sameAs":["https://en.wikipedia.org/wiki/Ziwei_doushu","https://www.wikidata.org/wiki/Q1056680"]');
  expect(html).toContain('"@type":"ImageObject"');
  expect(html).not.toContain('"creativeWorkStatus":"Draft"');
  const anh = await request.get("/og?tieu_de=Th%E1%BB%AD&mang=phong-thuy&tot=B%E1%BA%AFc,Nam");
  expect(anh.status()).toBe(200);
  expect(anh.headers()["content-type"]).toContain("image/png");
});

test("công cụ có WebApplication riêng; từ điển có @id từng thuật ngữ; làm nhà có WebPage + link cùng tuổi", async ({ request }) => {
  const tv = await (await request.get("/tu-vi")).text();
  expect(tv).toMatch(/"@type":"WebApplication","@id":"[^"]*\/tu-vi#ung-dung"/);
  const td = await (await request.get("/tu-dien")).text();
  expect(td).toMatch(/"@type":"DefinedTerm","@id":"[^"]*\/tu-dien#[a-z_0-9-]+"/);
  const ln = await (await request.get("/xem-tuoi-lam-nha/2027/tuoi-1990")).text();
  expect(ln).toContain('"@type":"WebPage"');
  expect(ln).toContain('href="/phong-thuy/huong-hop-tuoi#tuoi-1990"');   // AUD-Q2: dòng năm trên mục lục
  expect(ln).toContain("Cùng tuổi Canh Ngọ 1990");
});

test("chân trang + schema: kênh X (Twitter) hiện khi đặt env MXH_X (chỉ link https)", () => {
  const cu = process.env.MXH_X;
  process.env.MXH_X = "https://x.com/vi-du";
  expect(vanHanh().mangXaHoi).toContainEqual({ ten: "X (Twitter)", url: "https://x.com/vi-du" });
  process.env.MXH_X = "http://x.com/khong-https";
  expect(vanHanh().mangXaHoi.some((m) => m.ten.startsWith("X"))).toBe(false);
  if (cu === undefined) delete process.env.MXH_X; else process.env.MXH_X = cu;
});

test("robots: chặn GoogleOther, Googlebot vẫn được vào", async ({ request }) => {
  const rb = await (await request.get("/robots.txt")).text();
  const nhom = rb.split(/\n\s*\n/).find((n) => /User-Agent: GoogleOther\b/i.test(n)) ?? "";
  expect(nhom).toMatch(/Disallow: \/\s*$/m);
  expect(rb).not.toMatch(/User-Agent: Googlebot/i);       // Googlebot theo nhóm "*" (mở)
});
