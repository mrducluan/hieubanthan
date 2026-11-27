// CHT-1 — cụm "12 cung hoàng đạo" dưới /chiem-tinh: trang cụm (bảng năm nay + ô tra theo ngày sinh), 12 trang con
// (bảng giờ đổi cung 1976–2035, giáp ranh, schema), bản .md, sitemap, thanh mảng, liên kết từ trang công cụ.
import { test, expect } from "@playwright/test";

const CUM = "/chiem-tinh/cung-hoang-dao";
const SLUG = ["bach-duong", "kim-nguu", "song-tu", "cu-giai", "su-tu", "xu-nu", "thien-binh", "bo-cap", "nhan-ma", "ma-ket", "bao-binh", "song-ngu"];

test("trang cụm: H1, bảng 12 cung năm nay, 12 link, schema CollectionPage + breadcrumb Chiêm tinh", async ({ request }) => {
  const r = await request.get(CUM);
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<title>[^<]*cung hoàng đạo[^<]*<\/title>/i);
  expect(html).toMatch(/<h1[^>]*>12 cung hoàng đạo: sinh ngày nào thuộc cung gì\?<\/h1>/);
  expect(html).toContain("Lịch 12 cung hoàng đạo năm");
  expect(html).toContain("Trả lời nhanh");
  for (const s of SLUG) expect(html, s).toContain(`href="${CUM}/${s}"`);
  expect(html).toContain('"@type":"CollectionPage"');
  expect(html).toContain('"numberOfItems":12');
  expect(html).toMatch(/"name":"Chiêm tinh","item":"[^"]*\/chiem-tinh"/);
  expect(html).toContain('data-tra-cung=""');
  expect(html).toContain('data-thanh-mang="chiemtinh"');
});

test("trang một cung: trả lời nhanh, bảng 60 năm, giáp ranh, FAQ, .md, 404 với slug lạ", async ({ request }) => {
  const r = await request.get(`${CUM}/bach-duong`);
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Cung Bạch Dương \(20\/3–19\/4\): tính cách, tình yêu, công việc<\/h1>/);
  expect(html).toContain("Cung Bạch Dương (Aries) là cung thứ 1 của vòng hoàng đạo");
  expect(html).toContain("Sinh ngày 20/3: trong 60 năm 1976–2035");
  expect((html.match(/<tr/g) ?? []).length).toBeGreaterThanOrEqual(60);
  expect(html).toContain("20/3 lúc 10:06");              // 2024: Mặt Trời vào Bạch Dương 03:06 UTC
  expect(html).toContain('"@type":"FAQPage"');
  expect(html).toContain('data-testid="minh-hoa"');
  expect(html).toContain(`href="${CUM}/thien-binh"`);       // cung đối diện
  expect(html).toContain('href="/chiem-tinh"');
  const md = await request.get(`${CUM}/bach-duong.md`);
  expect(md.status()).toBe(200);
  expect(await md.text()).toContain("Bạch Dương");
  expect((await request.get(`${CUM}/khong-co-cung-nay`)).status()).toBe(404);
});

test("ô tra theo ngày sinh: ngày giáp ranh hỏi giờ, có giờ thì chốt cung + link trang cung", async ({ page }) => {
  await page.goto(CUM);
  const o = page.locator("[data-tra-cung]");
  await o.locator('input[type="date"]').fill("2024-03-20");
  await o.getByRole("button", { name: "Xem cung" }).click();
  await expect(o.locator("[data-ket-qua-cung]")).toContainText("ngày giáp ranh");
  await expect(o.locator("[data-ket-qua-cung]")).toContainText("10:06");
  await o.locator('input[type="time"]').fill("11:30");
  await o.getByRole("button", { name: "Xem cung" }).click();
  await expect(o.locator("[data-ket-qua-cung]")).toContainText("cung Bạch Dương");
  await expect(o.getByRole("link", { name: /Đọc về cung Bạch Dương/ })).toHaveAttribute("href", `${CUM}/bach-duong`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("sitemap + sitemap cụm + trang công cụ trỏ xuống cụm + thư viện kiến thức", async ({ request }) => {
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain(`${CUM}</loc>`);
  expect(sm).toContain(`${CUM}/song-ngu</loc>`);
  const cum = await request.get("/sitemap-cum-cung-hoang-dao.xml");
  expect(cum.status()).toBe(200);
  expect((((await cum.text()).match(/<loc>/g)) ?? []).length).toBe(13);
  expect(await (await request.get("/chiem-tinh")).text()).toContain(`href="${CUM}"`);
  expect(await (await request.get("/kien-thuc")).text()).toContain(`href="${CUM}"`);
  expect(await (await request.get("/llms.txt")).text()).toContain(CUM);
});
