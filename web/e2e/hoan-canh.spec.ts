// EN-2 mục 5 — tình trạng (độc thân / có đôi) người dùng TỰ CHỌN, chỉ lưu trên máy, đi kèm lá số tới engine để báo cáo
// đời sống chọn lời ở chương Tình yêu / Gia đình. Người dưới 18 tuổi không được hỏi.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";

const { noi_sinh: _bo, ...THIEU_NOI_SINH } = HO_SO_MAU;

test("chọn tình trạng → lưu trên máy, gửi kèm lá số, báo cáo có hộp theo hoàn cảnh", async ({ page }) => {
  await napHoSo(page, THIEU_NOI_SINH);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Thêm giờ sinh, giới tính, nơi sinh" }).click();
  await page.getByLabel("Nơi sinh").selectOption("ha-noi");
  const tt = page.getByLabel("Tình trạng (tuỳ chọn)");
  await expect(tt).toHaveValue("");
  await expect(page.getByTestId("tinh-trang-ghi-chu")).toContainText("không lưu trên máy chủ");
  await tt.selectOption("co_doi");
  await page.getByRole("button", { name: "Lưu và xem" }).click();
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.hoso.v1")!));
  expect(h.tinh_trang).toBe("co_doi");

  const [req, res] = await Promise.all([
    page.waitForRequest((r) => r.url().endsWith("/api/tuvi/luan-giai") && r.method() === "POST"),
    page.waitForResponse((r) => r.url().endsWith("/api/tuvi/luan-giai")),
    page.getByRole("button", { name: "Xem luận giải" }).click(),
  ]);
  expect(req.postDataJSON().la_so.tinh_trang).toBe("co_doi");
  expect(res.status()).toBe(200);
  const bc = await res.json();
  const ma: string[] = bc.chuong.flatMap((c: { hop: { ma_mau?: string }[] }) => c.hop.map((x) => x.ma_mau ?? ""));
  expect(ma.some((m) => m.startsWith("ds.tinh_cam.hoan_canh.") && m.endsWith(".co_doi"))).toBe(true);
});

test("bỏ chọn tình trạng → xoá khỏi hồ sơ, không gửi", async ({ page }) => {
  await napHoSo(page, { ...THIEU_NOI_SINH, tinh_trang: "doc_than" });
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Thêm giờ sinh, giới tính, nơi sinh" }).click();
  await page.getByLabel("Nơi sinh").selectOption("ha-noi");
  const tt = page.getByLabel("Tình trạng (tuỳ chọn)");
  await expect(tt).toHaveValue("doc_than");
  await tt.selectOption("");
  await page.getByRole("button", { name: "Lưu và xem" }).click();
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.hoso.v1")!));
  expect(h.tinh_trang).toBeUndefined();
});

test("người dưới 18 tuổi không được hỏi tình trạng", async ({ page }) => {
  await napHoSo(page, { ...THIEU_NOI_SINH, nam: new Date().getFullYear() - 14 });
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Thêm giờ sinh, giới tính, nơi sinh" }).click();
  await expect(page.getByLabel("Nơi sinh")).toBeVisible();
  await expect(page.getByLabel("Tình trạng (tuỳ chọn)")).toHaveCount(0);
});

test("chính sách quyền riêng tư nêu tình trạng chỉ lưu trên máy", async ({ page }) => {
  await page.goto("/chinh-sach-rieng-tu");
  await expect(page.locator("main")).toContainText("tình trạng độc thân / có đôi nếu bạn tự chọn");
});
