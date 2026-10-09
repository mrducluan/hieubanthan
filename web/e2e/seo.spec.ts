// SEO-B: trang kiến thức render phía server (HTML đủ nội dung + schema) · robots/sitemap/llms.txt cho bot tìm kiếm & AI.
import { test, expect } from "@playwright/test";

test("trang số: HTML server có h1, trả lời nhanh, JSON-LD Article + FAQPage + Breadcrumb, canonical", async ({ request }) => {
  const r = await request.get("/kien-thuc/than-so/so-7");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Số 7 trong thần số học/);
  expect(html).toContain("Trả lời nhanh");
  expect(html).toContain('rel="canonical" href="http://localhost:3000/kien-thuc/than-so/so-7"');
  const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));
  const loai = ld.flatMap((x) => x["@graph"] ?? [x]).map((n: { "@type": string }) => n["@type"]);
  for (const t of ["Article", "FAQPage", "BreadcrumbList", "Organization", "WebSite"]) expect(loai).toContain(t);
});

test("trang chưa thẩm định vẫn index, ghi Ban biên tập + Chủ biên", async ({ page }) => {
  await page.goto("/kien-thuc/kinh-dich/que-1-can");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Càn");
  await expect(page.locator("[data-dong-tac-gia]")).toContainText("Ban biên tập Hiểu Bản Thân");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);
  await page.getByRole("link", { name: "Quẻ Khôn" }).click();
  await expect(page).toHaveURL(/que-2-khon/);
});

test("robots, sitemap, llms.txt cho máy tìm kiếm và AI", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("User-Agent: GPTBot");
  expect(robots).toContain("Disallow: /tai-khoan");
  expect(robots).toContain("Sitemap: http://localhost:3000/sitemap.xml");
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/kien-thuc/than-so/so-33");
  expect(sm).toContain("/kien-thuc/tu-vi/sao-tham-lang");
  expect(sm).toContain("/kien-thuc/cung-tu-vi/cung-phu-the");
  expect(sm).toContain("/kien-thuc/thap-than/chinh-quan");
  expect(sm).toContain("/kien-thuc/nhat-chu/nhat-chu-giap");
  expect(sm).not.toContain("/tai-khoan");
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms.startsWith("# Hiểu Bản Thân")).toBe(true);
  expect(llms).toContain("/kien-thuc/kinh-dich/que-64-");
  const full = await (await request.get("/llms-full.txt")).text();
  expect(full).toContain("## Số 11 trong thần số học");
});

test("trang không tồn tại → 404; từ thẻ số trong bài đọc có link sang thư viện", async ({ page, request }) => {
  expect((await request.get("/kien-thuc/than-so/so-10")).status()).toBe(404);
  await page.addInitScript(() => localStorage.setItem("hbt.hoso.v1", JSON.stringify({ v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 24, thang: 10, nam: 1988, tao_luc: "x" })));
  await page.goto("/ban-than");
  await expect(page.getByTestId("the-duong_doi").getByRole("link", { name: "Đọc thêm về số 33" })).toHaveAttribute("href", "/kien-thuc/than-so/so-33");
});

test("SEO-C: trang cung Tử vi, thập thần, nhật chủ render phía server", async ({ request }) => {
  for (const [duong, h1] of [["/kien-thuc/cung-tu-vi/cung-phu-the", "Cung Phu Thê"], ["/kien-thuc/thap-than/chinh-quan", "Chính Quan"],
                             ["/kien-thuc/nhat-chu/nhat-chu-giap", "Nhật chủ Giáp"], ["/kien-thuc/cung-tu-vi", "12 cung Tử vi"]] as const) {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toMatch(new RegExp(`<h1[^>]*>[^<]*${h1}`));
  }
});
