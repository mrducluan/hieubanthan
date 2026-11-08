// QTE-1 tuần 1 — người Việt ở nước ngoài: nơi sinh chọn NƯỚC + THÀNH PHỐ → engine tính múi giờ chuẩn + giờ mùa hè theo ngày
// giờ sinh, form tự điền (không phải gõ UTC); "Nơi bạn đang sống" → Hôm nay tính ngày theo nơi đó.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";

const { noi_sinh: _bo, ...THIEU_NOI_SINH } = HO_SO_MAU;

test("sinh ở California mùa hè → máy tính UTC−8 + giờ mùa hè, lưu vào hồ sơ", async ({ page }) => {
  await napHoSo(page, { ...THIEU_NOI_SINH, ngay: 15, thang: 7, nam: 1990, gio: "10:00" });
  await page.goto("/tu-vi");
  await page.getByLabel("Nơi sinh").selectOption("nuoc_ngoai");
  await page.getByLabel("Nước nơi sinh").selectOption("us");
  await page.getByLabel("Bang / thành phố").first().selectOption({ label: "California (Los Angeles, Orange County, San Jose, San Francisco, San Diego)" });
  const tinh = page.getByTestId("mui-gio-da-tinh");
  await expect(tinh).toContainText("UTC−8");
  await expect(tinh).toContainText("đang dùng giờ mùa hè");
  // Hai ô tay chỉ hiện khi chọn "tự chọn".
  await expect(page.locator("#utc-noi-sinh")).toHaveCount(0);
  await page.getByRole("button", { name: "Lập lá số của tôi" }).click();
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.hoso.v1")!));
  expect(h).toMatchObject({ noi_sinh: "nuoc_ngoai", mui_gio_sinh: "America/Los_Angeles", utc_noi_sinh: -8, gio_mua_he: true });
});

test("Nhật Bản (một múi giờ) → không hỏi thành phố, không giờ mùa hè; 'tự chọn' mở lại hai ô tay", async ({ page }) => {
  await napHoSo(page, { ...THIEU_NOI_SINH, ngay: 1, thang: 8, nam: 2000, gio: "12:00" });
  await page.goto("/tu-vi");
  await page.getByLabel("Nơi sinh").selectOption("nuoc_ngoai");
  await page.getByLabel("Nước nơi sinh").selectOption("jp");
  await expect(page.getByLabel("Bang / thành phố")).toHaveCount(0);
  await expect(page.getByTestId("mui-gio-da-tinh")).toContainText("UTC+9");
  await expect(page.getByTestId("mui-gio-da-tinh")).toContainText("không dùng giờ mùa hè");
  await page.getByLabel("Nước nơi sinh").selectOption("tu_chon");
  await expect(page.locator("#utc-noi-sinh")).toBeVisible();
});

test("API múi giờ: thành phố lạ → 422; Hôm nay gửi nơi đang sống", async ({ page, request }) => {
  expect((await request.get("/api/dia-ly/mui-gio?mui_gio=Mars/X&ngay=1990-07-15&gio=10:00")).status()).toBe(422);
  const ok = await request.get("/api/dia-ly/mui-gio?mui_gio=Australia/Sydney&ngay=1995-01-10&gio=09:00");
  expect(await ok.json()).toMatchObject({ utc_chuan: 10, gio_mua_he: true });
  await napHoSo(page, { ...HO_SO_MAU, noi_o: "America/Los_Angeles" });
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith("/api/thanso/hom-nay") && r.method() === "POST"),
    page.goto("/hom-nay"),
  ]);
  expect(req.postDataJSON().mui_gio_noi_o).toBe("America/Los_Angeles");
});
