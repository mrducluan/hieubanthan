// EN-2 mục 5 — tình trạng (độc thân / có đôi) người dùng TỰ CHỌN, chỉ lưu trên máy, đi kèm lá số tới engine để báo cáo
// đời sống chọn lời ở chương Tình yêu / Gia đình. Người dưới 18 tuổi không được hỏi.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, napHoSo } from "./_hoso";

const { noi_sinh: _bo, ...THIEU_NOI_SINH } = HO_SO_MAU;

test("chọn tình trạng → lưu trên máy, gửi kèm lá số, báo cáo có hộp theo hoàn cảnh", async ({ page }) => {
  await napHoSo(page, THIEU_NOI_SINH);
  await page.goto("/tu-vi");
  await page.getByLabel("Nơi sinh").selectOption("ha-noi");
  const tt = page.getByLabel("Tình trạng (tuỳ chọn)");
  await expect(tt).toHaveValue("");
  await expect(page.getByTestId("tinh-trang-ghi-chu")).toContainText("máy chủ không lưu");
  await tt.selectOption("co_doi");
  await page.getByRole("button", { name: "Lập lá số của tôi" }).click();
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
  // Lời theo hoàn cảnh ở trường riêng của chương; mã kiểm chứng + toàn bộ đầu ra KHÔNG mang tình trạng.
  type C = { ma: string; loi_hoan_canh?: { ma_mau?: string } };
  const tc = (bc.chuong as C[]).find((c) => c.ma === "tinh_cam");
  expect(tc?.loi_hoan_canh).toBeTruthy();
  expect(tc?.loi_hoan_canh?.ma_mau).toBeUndefined();            // lời theo tình trạng không nhận phiếu (một mã ↔ một lời)
  const sn = (bc.chuong as C[]).find((c) => c.ma === "su_nghiep");
  expect(sn?.loi_hoan_canh?.ma_mau).toMatch(/^ds\.su_nghiep\.hoan_canh\.[a-z_]+\.t\d+(_\d+)?$/);
  expect(JSON.stringify(bc)).not.toContain("co_doi");
  // Chương 1 (mở sẵn) không phải chương có lời hoàn cảnh; mở chương Tình yêu thấy dòng "Với bạn lúc này".
  const ch = page.getByTestId("lg-chuong-tinh_cam");
  await ch.getByTestId("lg-mo-chuong").click();
  await expect(ch.getByTestId("loi-hoan-canh")).toContainText("Với bạn lúc này");
});

test("tình trạng chỉ đi kèm luận giải toàn bộ, không theo lá số / hỏi đáp", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, tinh_trang: "doc_than" });
  const cacBody: { url: string; body: string }[] = [];
  page.on("request", (r) => { if (r.method() === "POST" && r.url().includes("/api/tuvi/")) cacBody.push({ url: r.url(), body: r.postData() ?? "" }); });
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const laSo = cacBody.filter((x) => !x.url.endsWith("/luan-giai"));
  expect(laSo.length).toBeGreaterThan(0);
  expect(laSo.every((x) => !x.body.includes("tinh_trang"))).toBe(true);
});

test("bỏ chọn tình trạng → xoá khỏi hồ sơ, không gửi", async ({ page }) => {
  await napHoSo(page, { ...THIEU_NOI_SINH, tinh_trang: "doc_than" });
  await page.goto("/tu-vi");
  await page.getByLabel("Nơi sinh").selectOption("ha-noi");
  const tt = page.getByLabel("Tình trạng (tuỳ chọn)");
  await expect(tt).toHaveValue("doc_than");
  await tt.selectOption("");
  await page.getByRole("button", { name: "Lập lá số của tôi" }).click();
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.hoso.v1")!));
  expect(h.tinh_trang).toBeUndefined();
});

test("người dưới 18 tuổi không được hỏi tình trạng", async ({ page }) => {
  await napHoSo(page, { ...THIEU_NOI_SINH, nam: new Date().getFullYear() - 14 });
  await page.goto("/tu-vi");
  await expect(page.getByLabel("Nơi sinh")).toBeVisible();
  await expect(page.getByLabel("Tình trạng (tuỳ chọn)")).toHaveCount(0);
});

test("chính sách quyền riêng tư nêu tình trạng chỉ lưu trên máy", async ({ page }) => {
  await page.goto("/chinh-sach-rieng-tu");
  await expect(page.locator("main")).toContainText("tình trạng độc thân / có đôi nếu bạn tự chọn");
});
