// TDG-1 — tuổi làm nhà/cưới, hướng xấu theo năm, tuổi xông đất: trang SEO dựng ở máy chủ (H1 + schema), công cụ điền
// năm sinh từ hồ sơ trên máy, kết quả khớp engine, không lời doạ, không cuộn ngang trên điện thoại.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { docNam, docTuoi } from "../lib/tuoi-dan-gian";

const CAM = /đại hung|tai hoạ|tai họa|xui xẻo|giải hạn|vật phẩm/i;

test("đường dẫn năm/tuổi", () => {
  expect(docTuoi("tuoi-1990")).toBe(1990);
  expect(docTuoi("tuoi-99")).toBeNull();
  expect(docNam("2027")).toBe(2027);
  expect(docNam("1800")).toBeNull();
});

test("trang SEO tuổi 1990 làm nhà 2026: H1, Kim lâu Thân, Tứ Tấn Tài, năm thuận, hướng giữ yên", async ({ page, request }) => {
  const html = await (await request.get("/xem-tuoi-lam-nha/2026/tuoi-1990")).text();
  expect(html).toMatch(/<h1[^>]*>Tuổi 1990 làm nhà năm 2026 được không\?<\/h1>/);
  expect(html).toContain('"@type":"FAQPage"');
  await page.goto("/xem-tuoi-lam-nha/2026/tuoi-1990");
  await expect(page.getByTestId("nhan-kim-lau")).toHaveText("Kim lâu Thân");
  await expect(page.getByTestId("nhan-hoang-oc")).toContainText("Tứ Tấn Tài");
  await expect(page.getByTestId("ket-luan")).toHaveText("Dân gian thường tránh");
  await expect(page.getByTestId("nam-thuan").locator("a").first()).toBeVisible();
  await expect(page.getByTestId("han-nam")).toContainText("Ngũ Hoàng");
  expect(await page.locator("main").innerText()).not.toMatch(CAM);
  expect((await request.get("/xem-tuoi-lam-nha/2026/tuoi-2030")).status()).toBe(404);
});

test("công cụ làm nhà: tự điền năm sinh từ hồ sơ, xem ra kết quả", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/xem-tuoi-lam-nha");
  await expect(page.getByLabel("Năm sinh", { exact: true })).toHaveValue("1990");
  await page.getByLabel("Năm xem", { exact: true }).fill("2027");
  await page.getByRole("button", { name: "Xem ngay" }).click();
  await expect(page.getByTestId("ket-qua-lam-nha")).toContainText("38 tuổi mụ");
});

test("hướng xấu năm 2026: Ngũ Hoàng Nam, Tam Sát Bắc; trang chính có bàn 9 cung", async ({ page, request }) => {
  await page.goto("/huong-xau-nam/2026");
  const h = page.getByTestId("han-nam");
  await expect(h.getByRole("cell")).toHaveCount(9);
  await expect(h).toContainText("Ngũ Hoàng — Nam");
  await expect(h).toContainText("Tam Sát — Bắc");
  const hub = await (await request.get("/huong-xau-nam")).text();
  expect(hub).toMatch(/<h1[^>]*>Hướng xấu theo năm<\/h1>/);
});

test("tuổi xông đất Tết 2027 cho gia chủ 1990: có tuổi hợp + lý do, nên tránh Sửu/Tý, giờ mùng 1", async ({ page }) => {
  await page.goto("/tuoi-xong-dat/2027/tuoi-1990");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tuổi xông đất năm 2027 cho gia chủ sinh năm 1990");
  const kq = page.getByTestId("ket-qua-xong-dat");
  await expect(page.getByTestId("tuoi-hop").locator("li").first()).toBeVisible();
  await expect(kq).toContainText("Tuổi Sửu (xung năm Mùi)");
  await expect(kq).toContainText("Mùng 1 Tết (06/02/2027)");
  await kq.getByRole("link", { name: "Xem đầy đủ hoàng lịch mùng 1" }).click();
  await expect(page).toHaveURL(/\/xem-ngay-tot\/2027-02-06$/);
});

test("trang chủ có lối vào 3 công cụ; điện thoại 360px không cuộn ngang", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("lien-ket-tuoi").getByRole("link")).toHaveCount(3);
  await page.setViewportSize({ width: 360, height: 800 });
  for (const d of ["/xem-tuoi-lam-nha/2026/tuoi-1990", "/huong-xau-nam/2026", "/tuoi-xong-dat/2027/tuoi-1990"]) {
    await page.goto(d);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), d).toBeLessThanOrEqual(0);
  }
});
