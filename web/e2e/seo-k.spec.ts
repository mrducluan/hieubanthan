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
  expect(locs.length).toBeGreaterThanOrEqual(400);
  const r1 = await request.get("/blog/trang/1", { maxRedirects: 0 });
  expect(r1.status()).toBe(308);
  expect((await request.get("/blog/trang/999")).status()).toBe(404);
});

test("trang chủ + blog có tiêu đề chứa từ khoá; WebSite có keywords", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain("<title>Thần số học, Tử vi, Bát tự online miễn phí — Hiểu Bản Thân</title>");
  expect(html).toContain('"alternateName":["Hiểu Bản Thân (hieuban.com)","hieuban.com","HieuBan"]');   // KH-BL P0
  const blog = await (await request.get("/blog")).text();
  expect(blog).toMatch(/<title>Blog thần số học, Tử vi, phong thuỷ, Kinh Dịch/);
});

test("trang kiến thức: ảnh đại diện theo mảng, about có sameAs Wikipedia, Article đủ E-E-A-T", async ({ request }) => {
  const html = await (await request.get("/tu-vi/sao-o-cung/tu-vi-cung-menh")).text();
  expect(html).toMatch(/og:image" content="[^"]*mang=tu-vi/);
  expect(html).toContain('"sameAs":["https://en.wikipedia.org/wiki/Ziwei_doushu"]');
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
  expect(ln).toContain('href="/phong-thuy/huong-hop-tuoi/tuoi-1990"');
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
