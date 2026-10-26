// BLOG-8 — khung chữ ký biên soạn của bài blog CMS: nằm ở CUỐI bài, thu gọn (≤ 3 dòng), bấm / phím Enter mới xổ ra; ba kiểu chữ ký
// (Ban biên tập · Tác giả · Thẩm định) và JSON-LD không đổi. Chạy với CMS giả (playwright.cms.config.ts).
import { test, expect, type Page } from "@playwright/test";

const CMS = "http://127.0.0.1:4666";
const BI_MAT = "e2e-cms-webhook";
const BAI = "/blog/bat-tu-la-gi";

async function datKy(page: Page, ky: "ban_bien_tap" | "tham_dinh" | "tac_gia") {
  await fetch(`${CMS}/__dat`, { method: "POST", body: JSON.stringify({ ky }) });
  const r = await page.request.post("/api/cms/lam-moi", { headers: { "x-cms-bi-mat": BI_MAT }, data: {} });
  expect(r.ok()).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fetch(`${CMS}/__dat`, { method: "POST", body: JSON.stringify({ datLai: true }) });
  await page.request.post("/api/cms/lam-moi", { headers: { "x-cms-bi-mat": BI_MAT }, data: {} });
});

test("Ban biên tập: khung ở CUỐI bài (dưới thân bài, nguồn), thu gọn ≤ 3 dòng, không còn khung ở đầu bài", async ({ page }) => {
  await page.goto(BAI);
  await expect(page.locator("h1")).toContainText("Bát tự là gì");
  const khung = page.locator("[data-dong-tac-gia]");
  await expect(khung).toHaveCount(1);                       // chỉ MỘT khung, không lặp ở đầu bài
  await expect(khung).toHaveAttribute("data-ky", "ban_bien_tap");

  // Vị trí: dưới H1, dưới thân bài và mục Nguồn tham khảo, trên "Đọc tiếp" / CTA.
  const y = async (sel: string) => (await page.locator(sel).first().boundingBox())!.y;
  const yKhung = (await khung.boundingBox())!.y;
  expect(yKhung).toBeGreaterThan(await y("h1"));
  expect(yKhung).toBeGreaterThan(await y("#nguon"));
  expect(yKhung).toBeGreaterThan(await y("h2#hoi-dap"));
  expect(yKhung).toBeLessThan(await y("#doc-tiep"));

  // Thu gọn: đóng, thấy hai dòng gọn + lời mời xổ; phần dài (vai trò, tóm tắt, quy trình) ẩn.
  await expect(khung).not.toHaveAttribute("open", "");
  await expect(khung.locator("summary")).toContainText("Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên Đức Luân duyệt xuất bản");
  await expect(khung.locator("summary")).toContainText("Xem thông tin biên soạn");
  await expect(khung.locator(".khung-ky-noi-dung")).toBeHidden();
  const cao = (await khung.boundingBox())!.height;
  expect(cao, `khung thu gọn cao ${cao}px`).toBeLessThan(130);        // ~ 3 dòng chữ + khoảng đệm
  expect(cao).toBeGreaterThan(70);
  // Vùng chạm đủ lớn cho ngón tay.
  expect((await khung.locator("summary").boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test("Bấm khung → xổ vai trò, tóm tắt, quy trình; bấm lại / Enter → thu gọn", async ({ page }) => {
  await page.goto(BAI);
  const khung = page.locator("[data-dong-tac-gia]");
  const tom = khung.locator("summary");
  await tom.scrollIntoViewIfNeeded();
  await tom.click();
  await expect(khung).toHaveAttribute("open", "");
  const noi = khung.locator(".khung-ky-noi-dung");
  await expect(noi).toBeVisible();
  await expect(noi).toContainText("Người sáng lập · Chủ biên nội dung");
  await expect(noi).toContainText("Hơn 15 năm nghiên cứu");
  await expect(noi).toContainText("Biên soạn từ sách và tài liệu tham khảo, ghi rõ nguồn");
  await expect(noi.getByRole("link", { name: "Đức Luân" })).toHaveAttribute("href", "/tac-gia/duc-luan");
  await expect(noi.getByRole("link", { name: "Đức Luân" })).toHaveAttribute("rel", "author");
  await expect(noi.getByRole("link", { name: "Quy trình biên soạn" })).toHaveAttribute("href", "/gioi-thieu#quy-trinh");
  await expect(tom).toContainText("Thu gọn");

  await tom.click();
  await expect(khung).not.toHaveAttribute("open", "");
  await expect(noi).toBeHidden();

  // Bàn phím: Tab tới khung rồi Enter mở, Enter lại đóng.
  await tom.focus();
  await page.keyboard.press("Enter");
  await expect(khung).toHaveAttribute("open", "");
  await page.keyboard.press("Enter");
  await expect(khung).not.toHaveAttribute("open", "");
});

test("Nội dung xổ ra vẫn nằm trong HTML máy chủ (bot đọc đủ) và không làm trang tràn ngang", async ({ page, request }) => {
  const html = await (await request.get(BAI)).text();
  expect(html).toContain("khung-ky-noi-dung");
  expect(html).toContain("Hơn 15 năm nghiên cứu");
  expect(html).toContain('rel="author"');
  await page.goto(BAI);
  const rong = await page.evaluate(() => ({ cuon: document.documentElement.scrollWidth, khung: document.documentElement.clientWidth }));
  expect(rong.cuon).toBeLessThanOrEqual(rong.khung);
});

test("Thẩm định / Tác giả: dòng gọn đổi theo kiểu chữ ký, thẩm định có ngày, JSON-LD reviewedBy chỉ khi thẩm định", async ({ page }) => {
  await datKy(page, "tham_dinh");
  await page.goto(BAI);
  let khung = page.locator("[data-dong-tac-gia]");
  await expect(khung).toHaveAttribute("data-ky", "tham_dinh");
  await expect(khung.locator("summary")).toContainText("Biên soạn & thẩm định: Đức Luân");
  await khung.locator("summary").click();
  await expect(khung.locator(".khung-ky-noi-dung")).toContainText("Đã thẩm định · 20/10/2026");
  let ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(ld).toContain("reviewedBy");

  await datKy(page, "tac_gia");
  await page.goto(BAI);
  khung = page.locator("[data-dong-tac-gia]");
  await expect(khung).toHaveAttribute("data-ky", "tac_gia");
  await expect(khung.locator("summary")).toContainText("Tác giả: Đức Luân");
  await khung.locator("summary").click();
  await expect(khung.locator(".khung-ky-noi-dung")).toContainText("Chuyên gia tự biên soạn");
  ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(ld).not.toContain("reviewedBy");

  // Ban biên tập: author là tổ chức, không reviewedBy (DX-1).
  await datKy(page, "ban_bien_tap");
  await page.goto(BAI);
  ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(ld).not.toContain("reviewedBy");
  // Tên miền trong JSON-LD phụ thuộc bản chạy (dev 3002, build 3000) → chỉ kiểm cấu trúc: author của bài là tổ chức.
  const bai = ((await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t) as { "@graph"?: Record<string, unknown>[] })
    .flatMap((g) => g["@graph"] ?? [])).find((n) => n["@type"] === "BlogPosting");
  expect(bai, "có node BlogPosting").toBeTruthy();
  expect((bai!.author as { "@id"?: string })["@id"]).toMatch(/\/#to-chuc$/);
});
