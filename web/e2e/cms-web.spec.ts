// CMS → web: bộ lọc HTML (chống XSS kể cả khi tài khoản CMS bị lộ), mục lục, gộp nguồn blog, ký link xem trước,
// và các route nhận tín hiệu từ CMS từ chối khi sai bí mật. Không cần CMS chạy (luồng đầy đủ: cms/e2e).
import { test, expect } from "@playwright/test";
import { gopBaiBlog, type BaiBlog } from "../lib/blog-gop";
import { chuoiTruyVan, maXemTruoc, soKhop } from "../lib/cms";
import { htmlSangMd, locHtmlCms } from "../lib/cms-html";

test.beforeAll(() => {
  process.env.CMS_URL = "https://cms.hieuban.com";
  process.env.CMS_ANH_URL = "https://abc.supabase.co/storage/v1/object/public/cms-media";
});

test("lọc HTML: bỏ script, style, sự kiện, javascript:, iframe, form", () => {
  const ban = `<p onclick="x()" style="color:red">Chào<script>alert(1)</script></p>
    <a href="javascript:alert(1)">x</a><iframe src="https://evil.example"></iframe><form action="/x"><input></form>
    <img src="x" onerror="alert(1)"><svg onload="alert(1)"></svg><p class="lop-la">y</p>`;
  const { html } = locHtmlCms(ban);
  expect(html).not.toMatch(/script|onclick|onerror|onload|style=|javascript:|iframe|<form|<input|<svg|lop-la/i);
  expect(html).toContain("Chào");
});

test("lọc HTML: ảnh chỉ từ CMS / kho ảnh CMS, srcset lọc từng mục, ảnh lazy", () => {
  const { html } = locHtmlCms(`<figure><img src="https://cms.hieuban.com/api/media/file/a.webp" srcset="https://cms.hieuban.com/a-480.webp 480w, https://evil.example/b.webp 960w" alt="a"></figure>
    <img src="https://abc.supabase.co/storage/v1/object/public/cms-media/cms/b.webp" alt="b">
    <img src="https://evil.example/c.webp" alt="c"><img src="https://cms.hieuban.com.evil.example/d.webp" alt="d">`);
  expect(html).toContain('alt="a"');
  expect(html).toContain('alt="b"');
  expect(html).not.toContain('alt="c"');
  expect(html).not.toContain('alt="d"');
  expect(html).not.toContain("evil.example");
  expect(html).toContain('loading="lazy"');
});

test("lọc HTML: link ngoài có rel=noopener + target, link nội bộ giữ nguyên; giữ khối hbt-*", () => {
  const { html } = locHtmlCms(`<p><a href="https://example.com">ngoài</a> <a href="/than-so">trong</a> <a href="https://hieuban.com/tu-vi">site</a></p>
    <aside class="hbt-ghi-chu hbt-ghi-chu-tu_soi"><p class="hbt-ghi-chu-tieu-de">Tự soi</p></aside><table><tr><td>1</td></tr></table>`);
  expect(html).toMatch(/<a href="https:\/\/example.com" rel="noopener noreferrer" target="_blank">/);
  expect(html).toMatch(/<a href="\/than-so">trong<\/a>/);
  expect(html).toMatch(/<a href="https:\/\/hieuban.com\/tu-vi">site<\/a>/);
  expect(html).toContain('class="hbt-ghi-chu hbt-ghi-chu-tu_soi"');
  expect(html).toContain('class="hbt-bang"');
});

test("mục lục: id không dấu, không trùng, H2/H3", () => {
  const { html, mucLuc } = locHtmlCms("<h2>Số chủ đạo là gì?</h2><h3>Đường đời</h3><h2>Số chủ đạo là gì?</h2><h4>bỏ</h4>");
  expect(mucLuc).toEqual([
    { id: "so-chu-dao-la-gi", text: "Số chủ đạo là gì?", cap: 2 },
    { id: "duong-doi", text: "Đường đời", cap: 3 },
    { id: "so-chu-dao-la-gi-2", text: "Số chủ đạo là gì?", cap: 2 },
  ]);
  expect(html).toContain('<h2 id="so-chu-dao-la-gi-2">');
});

test("bản Markdown giữ tiêu đề, danh sách, link", () => {
  const md = htmlSangMd('<h2 id="a">Ý chính</h2><ul><li>Một</li></ul><p>Đọc <a href="/than-so">công cụ</a> &amp; <strong>đậm</strong></p>');
  expect(md).toContain("## Ý chính");
  expect(md).toContain("- Một");
  expect(md).toContain("[công cụ](/than-so)");
  expect(md).toContain("& **đậm**");
});

test("gộp blog: bài CMS thắng khi trùng slug, sắp mới nhất trước", () => {
  const cms: BaiBlog[] = [{ slug: "trung", tieuDe: "CMS", moTa: null, ngay: "2026-10-01", capNhat: null, anh: null, phut: null, nguon: "cms" }];
  const nf = [
    { slug: "trung", title: "NotFair", published_at: "2026-10-05" },
    { slug: "rieng", title: "Khác", published_at: "2026-10-09" },
  ] as never;
  const ds = gopBaiBlog(cms, nf);
  expect(ds.map((b) => `${b.slug}:${b.nguon}`)).toEqual(["rieng:notfair", "trung:cms"]);
});

test("truy vấn REST kiểu Payload + mã xem trước so thời gian hằng", () => {
  expect(chuoiTruyVan({ where: { slug: { equals: "a b" } }, limit: 1 }).join("&"))
    .toBe("where%5Bslug%5D%5Bequals%5D=a%20b&limit=1");
  const ma = maXemTruoc("so-7", "bi-mat")!;
  expect(ma).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(soKhop(ma, maXemTruoc("so-7", "bi-mat"))).toBe(true);
  expect(soKhop(ma, maXemTruoc("so-8", "bi-mat"))).toBe(false);
  expect(soKhop(ma, null)).toBe(false);
  expect(maXemTruoc("so-7", "")).toBeNull();
});

test("route từ CMS: sai bí mật bị từ chối; /blog vẫn chạy khi chưa có CMS", async ({ request, page }) => {
  expect((await request.post("/api/cms/lam-moi", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/cms/lam-moi", { headers: { "x-cms-bi-mat": "sai" }, data: {} })).status()).toBe(401);
  expect((await request.get("/api/cms/xem-truoc?slug=abc&ma=sai", { maxRedirects: 0 })).status()).toBe(401);
  expect((await request.get("/api/cms/xem-truoc?slug=../../x&ma=sai", { maxRedirects: 0 })).status()).toBe(401);
  await page.goto("/blog");
  await expect(page.locator("h1")).toHaveText("Blog");
  expect((await request.get("/blog/khong-co-bai-nay")).status()).toBe(404);
});
