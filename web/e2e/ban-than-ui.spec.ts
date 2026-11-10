// BT-UI — đầu trang /ban-than: hai cột cao bằng nhau (không còn khoảng trống), chia sẻ + QR ngay trên thẻ "Hồ sơ bản thân".
import { expect, test } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { duongQr, maHoaQr } from "../lib/qr";

test("Bản thân (máy tính): thẻ danh tính và cột lối đi cao bằng nhau, cùng mép trên", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await napHoSo(page);
  await page.goto("/ban-than");
  const the = page.getByTestId("the-danh-tinh");
  const cot = page.getByTestId("ban-than-loi-di");
  await expect(the).toBeVisible();
  await expect(page.getByTestId("huy-hieu-tom-tat")).toBeVisible();
  const [a, b] = [await the.boundingBox(), await cot.boundingBox()];
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
  expect(Math.abs(a!.height - b!.height)).toBeLessThan(2);
  // Bốn ô lối đi kín lưới 2 × 2, ô Sửa hồ sơ mở bảng sửa.
  await expect(cot.getByRole("link", { name: /Xem hợp đôi/ })).toHaveAttribute("href", "/hop-doi");
  await expect(cot.getByRole("link", { name: /Thời gian tới/ })).toHaveAttribute("href", "/thoi-gian-toi");
  await page.getByTestId("sua-ho-so").click();
  await expect(page.getByRole("dialog")).toContainText("Sửa hồ sơ");
});

test("Bản thân: Chia sẻ thẻ ngay trên thẻ → QR đúng link thẻ, tải ảnh, link không mang ngày sinh", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/ban-than");
  const khoi = page.getByTestId("chia-se-the-ho-so");
  await expect(khoi).toContainText("không có ngày sinh");
  await page.getByTestId("nut-chia-se-the").click();
  await expect(page.getByTestId("qr-the-ho-so")).toBeVisible();
  const href = await page.getByTestId("tai-anh-the-ho-so").getAttribute("href");
  expect(href).toMatch(/^\/og\?ma=.+&khung=doc$/);
  const ma = decodeURIComponent(href!.slice("/og?ma=".length, -"&khung=doc".length));
  expect(ma).not.toMatch(/1990|1988|2000/);
  // QR vẽ đúng ma trận của link thẻ (cùng bộ mã hoá → cùng đường vẽ).
  const link = `${new URL(page.url()).origin}/the/${ma}`;
  expect(await page.getByTestId("qr-the-ho-so").locator("path").getAttribute("d")).toBe(duongQr(maHoaQr(link), 4));
  const anh = await page.request.get(href!);
  expect(anh.status()).toBe(200);
  expect(anh.headers()["content-type"]).toContain("image/png");
  // Trang nhận thẻ mở được.
  const r = await page.request.get(`/the/${ma}`);
  expect(r.status()).toBe(200);
});

test("Bản thân (điện thoại): không tràn ngang, thẻ trước rồi tới lối đi", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await napHoSo(page);
  await page.goto("/ban-than");
  await expect(page.getByTestId("the-danh-tinh")).toBeVisible();
  await page.getByTestId("nut-chia-se-the").click();
  await expect(page.getByTestId("qr-the-ho-so")).toBeVisible();
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(0);
  const [a, b] = [await page.getByTestId("the-danh-tinh").boundingBox(), await page.getByTestId("ban-than-loi-di").boundingBox()];
  expect(b!.y).toBeGreaterThan(a!.y + a!.height - 1);
});
