// SEO-D — bản Markdown cho bot AI, llms.txt trỏ .md, schema đơn vị vận hành, manifest, hộp hỏi cookie trước GA/GTM.
import { test, expect } from "@playwright/test";

test("bản .md: trang kiến thức, chủ đề, thư viện, từ điển, trang chủ — có canonical về HTML", async ({ request }) => {
  const r = await request.get("/kien-thuc/than-so/so-7.md");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toContain("text/markdown");
  expect(r.headers()["link"]).toContain('<http://localhost:3000/kien-thuc/than-so/so-7>; rel="canonical"');
  const md = await r.text();
  expect(md).toMatch(/^# /);
  expect(md).toContain("## Trả lời nhanh");
  expect(md).toContain("## Nguồn");
  for (const [duong, chu] of <[string, string][]>[
    ["/kien-thuc/than-so.md", "/kien-thuc/than-so/so-7.md"],
    ["/kien-thuc.md", "/kien-thuc/kinh-dich.md"],
    ["/tu-dien.md", "## Tử vi"],
    ["/index.md", "Hieu Ban Co Ltd"],
  ]) {
    const x = await request.get(duong);
    expect(x.status(), duong).toBe(200);
    expect(await x.text(), duong).toContain(chu);
  }
  expect((await request.get("/kien-thuc/than-so/khong-co.md")).status()).toBe(404);
  expect((await request.get("/dieu-khoan.md")).status()).toBe(404);
});

test("HTML khai bản .md (link alternate); llms.txt trỏ .md + đơn vị vận hành; manifest", async ({ page, request }) => {
  await page.goto("/kien-thuc/than-so/so-7");
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute("href", /\/kien-thuc\/than-so\/so-7\.md$/);
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("/kien-thuc/than-so/so-7.md)");
  expect(llms).toContain("Hieu Ban Co Ltd");
  expect(llms).toContain("contact@hieuban.com");
  const mf = await (await request.get("/manifest.webmanifest")).json();
  expect(mf.lang).toBe("vi");
  expect(mf.short_name).toBe("Hiểu Bản Thân");
});

test("schema: Organization có tên pháp lý + email; từ điển là DefinedTermSet", async ({ page }) => {
  await page.goto("/");
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(ld).toContain('"legalName":"Hieu Ban Co Ltd"');
  expect(ld).toContain('"email":"contact@hieuban.com"');
  await page.goto("/tu-dien");
  const ld2 = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(ld2).toContain('"@type":"DefinedTermSet"');
  expect(ld2).toContain('"@type":"DefinedTerm"');
});

test("cookie: chưa đồng ý thì không tải Google; Đồng ý → tải GTM; đổi ý ở chân trang → Từ chối", async ({ page }) => {
  const goiGoogle: string[] = [];
  await page.route(/googletagmanager\.com|google-analytics\.com/, (r) => { goiGoogle.push(r.request().url()); return r.abort(); });
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));
  await page.reload();
  const hop = page.getByTestId("hoi-dong-y-cookie");
  await expect(hop).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  expect(goiGoogle).toEqual([]);
  await hop.getByRole("button", { name: "Đồng ý" }).click();
  await expect(hop).toBeHidden();
  await expect.poll(() => goiGoogle.some((u) => u.includes("gtm.js?id=GTM-E2ETEST"))).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { dataLayer: unknown[] }).dataLayer.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => localStorage.getItem("hbt.dong-y-cookie.v1"))).toBe("dong_y");
  await page.getByTestId("chan-trang").getByRole("button", { name: "Tuỳ chọn cookie" }).click();
  await expect(hop).toBeVisible();
  await hop.getByRole("button", { name: "Từ chối" }).click();
  await expect(hop).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("hbt.dong-y-cookie.v1"))).toBe("tu_choi");
});
