// SEO-M — "Trả lời nhanh" ở trang ngày/tháng/tuổi/hướng xấu năm; nội dung bổ sung trang kiến thức (bảng thật, trích dẫn,
// "Ban biên tập bổ sung", ảnh tóm tắt có QR); sitemap theo cụm; không còn meta keywords.
import { expect, test } from "@playwright/test";

test("trang ngày, tháng, tuổi, hướng xấu năm có Trả lời nhanh", async ({ request }) => {
  for (const d of ["/xem-ngay-tot/2026-12-17", "/xem-ngay-tot/thang-12-2026", "/xem-tuoi-lam-nha/2027/tuoi-1990",
    "/tuoi-xong-dat/2027/tuoi-1990", "/phong-thuy/huong-xau-nam/2027"]) {
    const h = await (await request.get(d)).text();
    expect(h, d).toContain('data-testid="tra-loi-nhanh"');
  }
  const thang = await (await request.get("/xem-ngay-tot/thang-12-2026")).text();
  expect(thang).toMatch(/Cưới hỏi<\/b>.*?ngày tốt/);
  expect(thang).toContain('"@type":"FAQPage"');
  const xd = await (await request.get("/tuoi-xong-dat/2027/tuoi-1990")).text();
  expect(xd).toContain('href="/phong-thuy/huong-xau-nam/2027"');
});

test("trang kiến thức có bảng thật, trích dẫn, ảnh tóm tắt; trang chuyên gia ghi Ban biên tập bổ sung", async ({ request }) => {
  const h = await (await request.get("/bat-tu/thap-than/chinh-tai")).text();
  expect(h).toMatch(/<table[\s\S]*?<th scope="col"/);
  expect(h).toContain("Sách xưa nói gì");
  expect(h).toContain('src="/og/y-chinh?loai=thap_than&amp;slug=chinh-tai&amp;v=');
  const so = await (await request.get("/than-so/y-nghia-so/so-7")).text();
  expect(so).toContain("Ban biên tập bổ sung");
  // EEAT-1: hỏi đáp do ban biên tập thêm trên trang chuyên gia tự viết nằm trong nhóm riêng có ghi chú.
  expect(so).toContain('data-testid="hoi-dap-bien-tap"');
  const md = await (await request.get("/bat-tu/thap-than/chinh-tai.md")).text();
  expect(md).toMatch(/^\| .+ \|$/m);
  const anh = await request.get("/og/y-chinh?loai=thap_than&slug=chinh-tai");
  expect(anh.status()).toBe(200);
  expect(anh.headers()["content-type"]).toContain("image/png");
});

test("sitemap theo cụm + robots; không còn meta keywords", async ({ request }) => {
  const idx = await (await request.get("/sitemap-cum.xml")).text();
  expect(idx).toContain("<sitemapindex");
  expect(idx).toContain("/sitemap-cum-tu-hoa.xml");
  const cum = await (await request.get("/sitemap-cum-tu-hoa.xml")).text();
  expect((cum.match(/<loc>/g) ?? []).length).toBeGreaterThan(40);
  expect((await request.get("/sitemap-cum-khong-co.xml")).status()).toBe(404);
  expect(await (await request.get("/robots.txt")).text()).toContain("/sitemap-cum.xml");
  expect(await (await request.get("/")).text()).not.toContain('name="keywords"');
});
