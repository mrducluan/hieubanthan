// HH-1 (chủ dự án 2026-10-27) — hub "Khám phá" /kham-pha → "Huyền học" /huyen-hoc. Kiểm: 308 một bước (giữ query), trang mới
// đủ SEO (một H1 có từ khoá, canonical, CollectionPage + Breadcrumb + FAQPage), liên kết xuống mọi công cụ + cụm tra cứu,
// menu + breadcrumb công cụ dùng tên mới, chip "cần gì" đổi theo hồ sơ trên máy, điện thoại không tràn ngang.
import { test, expect } from "@playwright/test";
import { napHoSo, HO_SO_MAU } from "./_hoso";

test("URL cũ /kham-pha → 308 một bước tới /huyen-hoc (giữ query); sitemap chỉ có URL mới", async ({ request }) => {
  for (const [cu, moi] of [["/kham-pha", "/huyen-hoc"], ["/kham-pha?tu=hh.0123456789", "/huyen-hoc?tu=hh.0123456789"]]) {
    const r = await request.get(cu!, { maxRedirects: 0 });
    expect(r.status(), cu).toBe(308);
    expect(r.headers().location, cu).toBe(moi);
  }
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/huyen-hoc</loc>");
  expect(sm).not.toContain("/kham-pha");
});

test("trang /huyen-hoc: H1, canonical, schema, liên kết xuống công cụ + cụm tra cứu, bảng so sánh đúng hàng", async ({ page, request }) => {
  const html = await (await request.get("/huyen-hoc")).text();
  expect(html).toMatch(/<link rel="canonical" href="[^"]*\/huyen-hoc"/);
  expect(html).toContain('"@type":"CollectionPage"');
  expect(html).toContain('"@type":"FAQPage"');
  expect(html).toMatch(/"name":"Trang chủ"[^}]*\}[^]*"name":"Huyền học"/);
  expect(html).not.toMatch(/href="\/kham-pha/);
  await page.goto("/huyen-hoc");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Huyền học");
  const main = page.locator("main");
  for (const d of ["/than-so", "/tu-vi", "/bat-tu", "/phong-thuy", "/kinh-dich", "/hop-doi", "/hom-nay", "/xem-ngay-tot",
    "/xem-tuoi-lam-nha", "/tuoi-xong-dat", "/xem-sao-han", "/phong-thuy/huong-xau-nam", "/phong-thuy/huong-hop-tuoi", "/doi-lich-am-duong",
    "/than-so/y-nghia-so", "/tu-vi/chinh-tinh", "/bat-tu/thap-than", "/kinh-dich/que", "/phong-thuy/dau-hieu", "/kien-thuc", "/tu-dien"]) {
    expect(await main.locator(`a[href="${d}"]`).count(), d).toBeGreaterThan(0);
  }
  expect(await main.locator('a[href^="/lich-am/"]').count()).toBe(1);
  const bang = page.getByTestId("bang-so-sanh");
  await expect(bang.locator("tr", { hasText: "Kinh Dịch" }).last()).toContainText("Chu Dịch");
  await expect(bang.locator("tr", { hasText: "Phong thuỷ" }).last()).toContainText("Bát trạch");
});

test("menu + breadcrumb công cụ gọi là 'Huyền học'", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/tu-vi");
  await expect(page.locator("header").getByRole("link", { name: "Huyền học" }).first()).toHaveAttribute("href", "/huyen-hoc");
  const html = await (await request.get("/than-so")).text();
  expect(html).toContain('"name":"Huyền học"');
  expect(html).not.toContain('"name":"Khám phá"');
});

test("chip 'cần gì' đổi theo hồ sơ trên máy: thiếu giờ sinh → Tử vi, Bát tự 'Cần thêm'; đủ → 'Sẵn sàng'", async ({ page }) => {
  const { gio: _g, noi_sinh: _n, ...thieu } = HO_SO_MAU;
  await napHoSo(page, thieu);
  await page.goto("/huyen-hoc");
  await expect(page.getByTestId("dong-ho-so")).toContainText("3/5");
  await expect(page.getByTestId("the-mang-tu_vi").getByTestId("chip-can")).toHaveAttribute("data-du", "0");
  await expect(page.getByTestId("the-mang-than_so").getByTestId("chip-can")).toHaveAttribute("data-du", "1");
  await expect(page.getByTestId("the-mang-phong_thuy").getByTestId("chip-can")).toContainText("Sẵn sàng");
});

test("điện thoại 390px: không tràn ngang, nút chính trong màn đầu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/huyen-hoc");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const nut = page.getByRole("link", { name: /Bắt đầu với con số của bạn/ });
  const hop = await nut.boundingBox();
  expect(hop && hop.y + hop.height).toBeLessThan(844);
});

test("AIO: /huyen-hoc.md cùng nội dung trang (canonical về HTML), /kham-pha.md → 308; HTML khai bản Markdown + schema đủ", async ({ request }) => {
  const cu = await request.get("/kham-pha.md", { maxRedirects: 0 });
  expect(cu.status()).toBe(308);
  expect(cu.headers().location).toBe("/huyen-hoc.md");
  const md = await request.get("/huyen-hoc.md");
  expect(md.status()).toBe(200);
  expect(md.headers()["content-type"]).toContain("text/markdown");
  expect(md.headers().link).toMatch(/\/huyen-hoc>; rel="canonical"/);
  const t = await md.text();
  for (const x of ["# Huyền học", "> Huyền học là", "## Bạn đang băn khoăn điều gì?", "### [Kinh Dịch]", "| Kinh Dịch |", "### Huyền học là gì?"]) expect(t, x).toContain(x);
  const html = await (await request.get("/huyen-hoc")).text();
  expect(html).toMatch(/<link rel="alternate" type="text\/markdown" href="[^"]*\/huyen-hoc\.md"/);
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].flatMap((m) => JSON.parse(m[1]!)["@graph"] ?? []);
  const trang = ld.find((n: { "@type": string }) => n["@type"] === "CollectionPage");
  expect(trang.publisher["@id"]).toMatch(/#to-chuc$/);
  expect(trang.encoding.contentUrl).toMatch(/\/huyen-hoc\.md$/);
  expect(trang.mainEntity.itemListElement.length).toBe(13);
  expect(ld.find((n: { "@type": string }) => n["@type"] === "FAQPage").mainEntity.length).toBe(6);
});
