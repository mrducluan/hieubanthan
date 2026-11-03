// SEO-F → SEO-K → AUD-Q2 (chủ dự án duyệt 2026-11-03): "tuổi X hợp hướng nào" gộp theo CUNG PHI — 8 trang cung
// (/phong-thuy/huong-hop-tuoi/cung-…) + mục lục có bảng 46 năm sinh × nam/nữ; trang năm cũ 308 về đúng dòng năm trên mục lục.
import { test, expect } from "@playwright/test";

test("trang cung Khảm: HTML máy chủ có H1, trả lời nhanh tự đứng, hướng tốt, năm sinh, schema, link cung cùng nhóm", async ({ request }) => {
  const r = await request.get("/phong-thuy/huong-hop-tuoi/cung-kham-bac");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect((html.match(/<h1[\s>]/g) ?? []).length).toBe(1);
  expect(html).toContain("Cung Khảm hợp hướng nào?");
  expect(html).toMatch(/Cung phi Khảm \(mệnh quái số 1, hành Thuỷ, thuộc Đông tứ mệnh\)/);
  for (const loai of ['"@type":"Article"', '"@type":"FAQPage"', '"@type":"BreadcrumbList"', '"@type":"ImageObject"']) expect(html).toContain(loai);
  expect(html).toMatch(/og:image" content="[^"]*mang=phong-thuy/);
  expect(html).toMatch(/"datePublished":"\d{4}-\d{2}-\d{2}"/);
  expect(html).toContain("Đông Nam");                                             // hướng tốt nhất (Sinh Khí)
  expect(html).toContain('id="nam-1990"');                                        // nam 1990 có cung Khảm
  for (const c of ["cung-ly-nam", "cung-chan-dong", "cung-ton-dong-nam"]) expect(html).toContain(`href="/phong-thuy/huong-hop-tuoi/${c}"`);
  expect((await request.get("/phong-thuy/huong-hop-tuoi/cung-abc")).status()).toBe(404);
});

test("mục lục: 8 cung + bảng 46 năm sinh có neo, bản .md, sitemap chỉ có trang cung", async ({ request, page }) => {
  await page.goto("/phong-thuy/huong-hop-tuoi");
  const ml = page.getByTestId("huong-hop-tuoi");
  await expect(ml.locator('a[href^="/phong-thuy/huong-hop-tuoi/cung-"]').first()).toBeVisible();
  await expect(ml.locator('tr[id^="tuoi-"]')).toHaveCount(46);
  const dong = ml.locator("#tuoi-1990");
  await expect(dong).toContainText("Canh Ngọ");
  await expect(dong).toContainText("Khảm");
  await expect(dong).toContainText("Cấn");
  const md = await (await request.get("/phong-thuy/huong-hop-tuoi.md")).text();
  expect(md).toContain("| 1990 | Canh Ngọ |");
  const mdCung = await request.get("/phong-thuy/huong-hop-tuoi/cung-ly-nam.md");
  expect(mdCung.status()).toBe(200);
  expect(await mdCung.text()).toContain("## Trả lời nhanh");
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/phong-thuy/huong-hop-tuoi/cung-can-dong-bac</loc>");
  expect(sm).not.toMatch(/huong-hop-tuoi\/tuoi-\d{4}/);
});

test("trang năm cũ (cả bản một giới tính, .md) 308 một bước về dòng năm trên mục lục", async ({ request }) => {
  for (const [cu, den] of [
    ["/phong-thuy/huong-hop-tuoi/tuoi-1990", "/phong-thuy/huong-hop-tuoi#tuoi-1990"],
    ["/phong-thuy/huong-hop-tuoi/tuoi-1990-nu", "/phong-thuy/huong-hop-tuoi/cung-can-dong-bac#nu-1990"],   // biết giới tính → trang cung
    ["/phong-thuy/huong-hop-tuoi/tuoi-1990-nam", "/phong-thuy/huong-hop-tuoi/cung-kham-bac#nam-1990"],
    ["/phong-thuy/tuoi-1985-nam", "/phong-thuy/huong-hop-tuoi#tuoi-1985"],
    ["/phong-thuy/huong-hop-tuoi/tuoi-1990.md", "/phong-thuy/huong-hop-tuoi.md"],
    ["/phong-thuy/tuoi-1990-nam.md", "/phong-thuy/huong-hop-tuoi.md"],
  ] as const) {
    const r = await request.get(cu, { maxRedirects: 0 });
    expect(r.status(), cu).toBe(308);
    const u = new URL(r.headers()["location"]!, "http://x");
    expect(u.pathname + u.hash, cu).toBe(den);
  }
});
