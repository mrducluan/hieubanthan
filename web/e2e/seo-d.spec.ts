// SEO-D — bản Markdown cho bot AI, llms.txt trỏ .md, schema đơn vị vận hành, manifest, hộp hỏi cookie điều khiển Consent Mode của GTM.
import { test, expect } from "@playwright/test";

test("bản .md: trang kiến thức, chủ đề, thư viện, từ điển, trang chủ — có canonical về HTML", async ({ request }) => {
  const r = await request.get("/than-so/y-nghia-so/so-7.md");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toContain("text/markdown");
  expect(r.headers()["link"]).toContain('<http://localhost:3000/than-so/y-nghia-so/so-7>; rel="canonical"');
  const md = await r.text();
  expect(md).toMatch(/^# /);
  expect(md).toContain("## Trả lời nhanh");
  expect(md).toContain("## Nguồn");
  for (const [duong, chu] of <[string, string][]>[
    ["/than-so/y-nghia-so.md", "/than-so/y-nghia-so/so-7.md"],
    ["/kien-thuc.md", "/kinh-dich/que.md"],
    ["/tu-dien.md", "## Tử vi"],
    ["/index.md", "Hieu Ban Co Ltd"],
  ]) {
    const x = await request.get(duong);
    expect(x.status(), duong).toBe(200);
    expect(await x.text(), duong).toContain(chu);
  }
  expect((await request.get("/than-so/y-nghia-so/khong-co.md")).status()).toBe(404);
  expect((await request.get("/dieu-khoan.md")).status()).toBe(404);
});

test("HTML khai bản .md (link alternate); llms.txt trỏ trang HTML + đơn vị vận hành; manifest", async ({ page, request }) => {
  await page.goto("/than-so/y-nghia-so/so-7");
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute("href", /\/than-so\/y-nghia-so\/so-7\.md$/);
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("/than-so/y-nghia-so/so-7)");
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

test("cookie: GTM nạp ngay, đo lường bật mặc định (chưa hỏi khi traffic thấp); Tuỳ chọn cookie → Từ chối = denied; Đồng ý = granted", async ({ page }) => {
  const goiGoogle: string[] = [];
  await page.route(/googletagmanager\.com|google-analytics\.com/, (r) => { goiGoogle.push(r.request().url()); return r.abort(); });
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));
  await page.reload();
  const hop = page.getByTestId("hoi-dong-y-cookie");
  // chủ dự án chốt 2026-10-09: GTM nạp ngay; chưa tới ~100k người dùng/tháng thì không hỏi khi mở trang
  await expect.poll(() => goiGoogle.some((u) => u.includes("gtm.js?id=GTM-E2ETEST"))).toBe(true);
  await expect(hop).toBeHidden();
  const dongY = () => page.evaluate(() => JSON.stringify(((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [])
    .filter((x) => x && typeof x === "object" && "0" in (x as object))
    .map((x) => Array.from(x as ArrayLike<unknown>)).filter((a) => a[0] === "consent")));
  await expect.poll(dongY).toContain('"default",{"analytics_storage":"granted"');
  // người dùng vẫn tắt được ở chân trang
  await expect(page.getByTestId("chan-trang")).toHaveCount(1);
  await page.getByTestId("chan-trang").getByRole("button", { name: "Tuỳ chọn cookie" }).click();
  await expect(hop).toBeVisible();
  await hop.getByRole("button", { name: "Từ chối" }).click();
  await expect(hop).toBeHidden();
  await expect.poll(dongY).toContain('"update",{"analytics_storage":"denied"}');
  expect(await page.evaluate(() => localStorage.getItem("hbt.dong-y-cookie.v1"))).toBe("tu_choi");
  // từ chối thì lần mở sau vẫn denied ngay từ đầu
  await page.reload();
  await expect.poll(dongY).toContain('"default",{"analytics_storage":"denied"');
  await expect(page.getByTestId("chan-trang")).toHaveCount(1);
  await page.getByTestId("chan-trang").getByRole("button", { name: "Tuỳ chọn cookie" }).click();
  await hop.getByRole("button", { name: "Đồng ý" }).click();
  await expect.poll(dongY).toContain('"update",{"analytics_storage":"granted"}');
});

test("trang công cụ: HTML máy chủ có <h1>, phần giới thiệu + hỏi đáp, schema WebPage/FAQ/Breadcrumb, ảnh OG", async ({ request }) => {
  for (const [duong, ten] of [["/tu-vi", "Tử vi"], ["/bat-tu", "Bát tự"], ["/phong-thuy", "Phong thuỷ"], ["/kinh-dich", "Kinh Dịch"],
    ["/than-so", "Thần số học"], ["/hop-doi", "Hợp đôi"]] as const) {
    const html = await (await request.get(duong)).text();
    expect((html.match(/<h1[\s>]/g) ?? []).length, duong).toBe(1);
    expect(html, duong).toContain(`Về công cụ ${ten}`);
    for (const loai of ['"@type":"WebPage"', '"@type":"FAQPage"', '"@type":"BreadcrumbList"']) expect(html, duong).toContain(loai);
    expect(html, duong).toMatch(/<meta property="og:image" content="[^"]*\/og\?tieu_de=/);
  }
});

test("IndexNow, biểu tượng iOS, header bảo mật", async ({ request }) => {
  expect(await (await request.get("/indexnow.txt")).text()).toMatch(/^[a-f0-9]{32}$/);
  const icon = await request.get("/apple-icon");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toContain("image/png");
  const h = (await request.get("/")).headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("magnetometer=(self)");
});
