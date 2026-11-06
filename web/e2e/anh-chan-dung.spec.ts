// ANH-1 — "Tải ảnh chân dung" đầu trang Nhân tướng học: thoả thuận riêng (không tích sẵn), máy chủ web bắt buộc `dong_y`,
// gợi ý → người dùng xác nhận → điền khảo sát trên máy. Engine thật trong e2e TẮT đọc ảnh → trạng thái "chờ bật" là thật;
// luồng bật giả lập bằng route mock (không gửi ảnh đi đâu).
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

// PNG 1×1 hợp lệ (trình duyệt đọc được để thu nhỏ qua canvas).
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const TEP = { name: "chan-dung.png", mimeType: "image/png", buffer: PNG };

test("engine tắt → khối báo chờ bật, không có ô chọn ảnh; thoả thuận chưa ghi", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/nhan-tuong");
  const k = page.getByTestId("anh-chan-dung");
  await expect(k).toHaveAttribute("data-bat", "0", { timeout: 20_000 });
  await expect(k).toContainText("đang chờ bật");
  await expect(page.getByTestId("anh-input-thang")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("hbt.dong_y_anh_mat.v1"))).toBeNull();
});

test("bật (giả lập): ảnh + thoả thuận mới gửi; máy chủ nhận dong_y + góc; gợi ý xác nhận → điền khảo sát; rút thoả thuận", async ({ page }) => {
  await napHoSo(page);
  await page.route("**/api/nhan-tuong/cau-hinh", (r) => r.fulfill({ json: { doc_anh: true } }));
  const thanGui: unknown[] = [];
  await page.route("**/api/nhan-tuong/doc-anh", async (r) => {
    thanGui.push(r.request().postDataJSON());
    await r.fulfill({ json: { da_bat: true, ly_do_tat: null, can_xac_nhan: true, kiem_tra: { thay_mat: true, so_nguoi: 1, nhin_thang: true, du_sang: false },
      luu_y: ["Ảnh hơi tối — gợi ý về sắc da, khí sắc có thể lệch."],
      // engine đã lọc câu không đọc được từ ảnh (giọng, dáng…); web chỉ lọc thêm mã lạ ngoài bộ câu
      tra_loi: [{ cau: "khuon_mat", lua_chon: "vuong", do_tin: 0.86 }, { cau: "an_duong", lua_chon: "rong_sang", do_tin: 0.7 },
        { cau: "khong_co", lua_chon: "x", do_tin: 0.9 }, { cau: "khuon_mat", lua_chon: "ma_la", do_tin: 0.9 }] } });
  });
  await page.goto("/nhan-tuong");
  const k = page.getByTestId("anh-chan-dung");
  await expect(k).toHaveAttribute("data-bat", "1", { timeout: 20_000 });
  const nut = page.getByTestId("anh-doc");
  await expect(nut).toBeDisabled();
  await expect(page.getByTestId("anh-dong-y")).not.toBeChecked();      // không tích sẵn
  await page.getByTestId("anh-input-thang").setInputFiles(TEP);
  await expect(page.getByTestId("anh-goc-thang").locator("img")).toBeVisible();
  await expect(nut).toBeDisabled();                                       // có ảnh nhưng chưa đồng ý
  await page.getByTestId("anh-input-nghieng_trai").setInputFiles(TEP);
  await page.getByTestId("anh-dong-y").check();
  await expect(nut).toBeEnabled();
  await nut.click();
  const goiY = page.getByTestId("anh-goi-y");
  await expect(goiY).toBeVisible({ timeout: 15_000 });
  // thoả thuận ghi đúng lúc bấm; thân gửi có dong_y + góc; ảnh là base64 jpeg đã thu nhỏ
  const dy = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.dong_y_anh_mat.v1") ?? "null"));
  expect(dy?.phien_ban).toBe("am1");
  expect(thanGui).toHaveLength(1);
  const than = thanGui[0] as { dong_y: boolean; anh: { goc: string; loai: string; du_lieu: string }[] };
  expect(than.dong_y).toBe(true);
  expect(than.anh.map((a) => a.goc)).toEqual(["thang", "nghieng_trai"]);
  expect(than.anh.every((a) => a.loai === "image/jpeg" && /^[A-Za-z0-9+/]+={0,2}$/.test(a.du_lieu))).toBe(true);
  // gợi ý: chỉ nét thuộc bộ câu (khong_co, mã lựa chọn lạ bị bỏ), lời kiểm ảnh hiện, mặc định tích
  await expect(goiY).toContainText("Máy thấy 2 nét");
  await expect(goiY).toContainText("hơi tối");
  await expect(goiY.getByRole("checkbox")).toHaveCount(2);
  await goiY.getByRole("checkbox").nth(1).uncheck();
  await page.getByTestId("anh-dung").click();
  await expect(page.getByTestId("anh-da-dung")).toContainText("Đã điền 1 nét");
  await expect(page.getByTestId("so-cau-da-tra-loi")).toHaveText("1");
  await expect(page.getByTestId("cau-khuon_mat").getByRole("button", { name: "Vuông vức, góc cạnh rõ" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("anh-xem-bai-doc")).toBeVisible();
  // tải lại: thoả thuận đã nhớ → không hiện ô tích, có "Rút thoả thuận"
  await page.goto("/nhan-tuong");
  await expect(page.getByTestId("anh-da-dong-y")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Rút thoả thuận" }).click();
  await expect(page.getByTestId("anh-dong-y")).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("hbt.dong_y_anh_mat.v1"))).toBeNull();
});

test("Dữ liệu của tôi liệt kê thoả thuận ảnh và rút được", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => localStorage.setItem("hbt.dong_y_anh_mat.v1", JSON.stringify({ phien_ban: "am1", luc: "2026-11-06T01:00:00Z" })));
  await page.goto("/tai-khoan");
  const d = page.getByTestId("dl-anh-mat");
  await expect(d).toContainText("Đã đồng ý ngày");
  await page.getByTestId("dl-anh-mat-rut").click();
  await expect(d).toContainText("Chưa đồng ý");
});
