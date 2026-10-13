// HL-1 — "Xem ngày tốt": trang hôm nay + trang ngày/tháng dựng ở máy chủ (H1 trong HTML), cá nhân hoá tuổi từ hồ sơ
// trên máy, tìm ngày đẹp theo việc, trang chủ có khối hoàng lịch ngay dưới hồ sơ, Hôm nay có hoàng lịch + quẻ ngày.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { docDuong, ngayDangIndex } from "../lib/hoang-lich";

test("đường dẫn ngày/tháng: hợp lệ, sai dạng, cửa sổ index", () => {
  expect(docDuong("2026-10-13")).toEqual({ loai: "ngay", iso: "2026-10-13" });
  expect(docDuong("thang-10-2026")).toEqual({ loai: "thang", nam: 2026, thang: 10 });
  for (const x of ["2026-02-30", "2026-13-01", "thang-13-2026", "thang-010-2026", "1800-01-01", "abc"]) expect(docDuong(x)).toBeNull();
  expect(ngayDangIndex("2026-10-20", "2026-10-13")).toBe(true);
  expect(ngayDangIndex("2026-10-01", "2026-10-13")).toBe(false);
  expect(ngayDangIndex("2028-12-01", "2026-10-13")).toBe(false);
});

test("trang một ngày: HTML máy chủ có H1 + Kim Quỹ, trực Khai, giờ hoàng đạo (13/10/2026 như ảnh aov.cc)", async ({ page, request }) => {
  const html = await (await request.get("/xem-ngay-tot/2026-10-13")).text();
  expect(html).toMatch(/<h1[^>]*>Ngày 13\/10\/2026 tốt hay xấu\?<\/h1>/);
  expect(html).toContain("Kim Quỹ");
  await page.goto("/xem-ngay-tot/2026-10-13");
  await expect(page.getByTestId("nhan-hoang-dao")).toHaveText("Ngày Hoàng đạo · Kim Quỹ");
  await expect(page.getByTestId("truc")).toContainText("Khai");
  await expect(page.getByTestId("gio-hoang-dao").locator("li")).toHaveCount(6);
  await expect(page.getByTestId("nghi")).toContainText("Cưới hỏi");
  await expect(page.getByTestId("ky")).toContainText("An táng");
  await expect(page.getByText("Tuổi Giáp Dần")).toBeVisible();
  // Lịch tháng: ô hôm đó được đánh dấu, bấm sang ngày mai
  await expect(page.locator('[aria-current="date"]')).toContainText("13");
  await page.getByTestId("ngay-mai").click();
  await expect(page).toHaveURL(/\/xem-ngay-tot\/2026-10-14$/);
  await expect(page.getByTestId("ky-dan-gian")).toContainText("Nguyệt Kỵ");
});

test("có hồ sơ: hiện quan hệ tuổi; tìm ngày cưới hỏi bỏ ngày xung tuổi", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/xem-ngay-tot/2026-10-13");
  await expect(page.getByTestId("tuoi-ban")).toContainText("Canh Ngọ");
  await page.getByRole("button", { name: "Cưới hỏi" }).click();
  await page.getByRole("button", { name: "Tìm ngày" }).click();
  const kq = page.getByTestId("ket-qua-chon-ngay");
  await expect(kq).toContainText("không xung tuổi bạn");
  await expect(kq.locator("li").first()).toBeVisible();
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; viec?: string }[] }).__hbt_su_kien ?? []);
  expect(sk.some((e) => e.su_kien === "good_day_searched" && e.viec === "cuoi_hoi")).toBe(true);
});

test("trang tháng + trang hôm nay + noindex ngoài cửa sổ + 404 sai dạng", async ({ page, request }) => {
  await page.goto("/xem-ngay-tot/thang-11-2026");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lịch ngày tốt tháng 11/2026");
  await expect(page.getByTestId("lich-thang").locator("ol a")).toHaveCount(30);
  await expect(page.getByTestId("ngay-dep-thang").locator("li").first()).toBeVisible();
  const html = await (await request.get("/xem-ngay-tot")).text();
  expect(html).toMatch(/<h1[^>]*>Xem ngày tốt hôm nay<\/h1>/);
  const cu = await (await request.get("/xem-ngay-tot/1990-01-01")).text();
  expect(cu).toMatch(/<meta name="robots" content="noindex/);
  expect((await request.get("/xem-ngay-tot/2026-02-30")).status()).toBe(404);
  expect((await request.post("/api/lich/chon-ngay", { data: { viec: "cuoi_hoi", tu: "2026-01-01", den: "2026-12-31" } })).status()).toBe(422);
});

test("trang chủ: khối hoàng lịch ngay dưới hồ sơ thần số, gợi ý xem tuổi khi chưa có hồ sơ", async ({ page }) => {
  await page.goto("/");
  const khoi = page.getByTestId("ngay-tot-trang-chu");
  await expect(khoi).toBeVisible();
  await expect(khoi.getByTestId("tuoi-goi-y")).toBeVisible();
  // Đứng ngay sau khối hồ sơ (trước banner/“Ba lớp”)
  const thuTu = await page.evaluate(() => {
    const k = document.querySelector('[data-testid="ngay-tot-trang-chu"]')!;
    const b = document.getElementById("ba-lop")!;
    return Boolean(k.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(thuTu).toBe(true);
  await khoi.getByRole("link", { name: /Xem đầy đủ/ }).click();
  await expect(page).toHaveURL(/\/xem-ngay-tot$/);
});

test("Hôm nay: có hoàng lịch theo tuổi + quẻ đầu ngày", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/hom-nay");
  await expect(page.getByTestId("hoang-lich-hom-nay")).toBeVisible();
  await expect(page.getByTestId("hl-tuoi")).toContainText("Canh Ngọ");
  await expect(page.getByTestId("que-ngay")).toContainText("Quẻ đầu ngày");
});
