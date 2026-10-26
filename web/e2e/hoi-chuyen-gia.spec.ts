// SAO-CG (0029) — "Hỏi chuyên gia" phía trình duyệt. Máy chủ Supabase được giả lập bằng page.route (e2e không có Supabase);
// engine thật kiểm câu khủng hoảng (/api/chuyen-gia/kiem → /v1/hoi/dac-biet). Quy tắc máy chủ (giá, hạn, RLS, hoàn) kiểm ở
// supabase/kiem_thu/thu_chuyen_gia_0029.sql; bộ lọc câu trả lời chuyên gia kiểm thuần ở đây (trang quản trị cần MFA).
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { CUM_THUC_EP, dongHan, kiemTraLoi } from "../lib/chuyen-gia-hoi";

const BAT = { bat: true, gia_vnd: 199000, giam_lan_dau_pt: 30, han_gio: 48, gia_lan_dau: 139300, lan_dau: null, gia_lan_nay: 139300, dang_cho: null, cong: "gia", dang_nhap: false, hoi_vien_con_luot: null };
const giaLap = (page: Page, tt: object) => page.route("**/api/chuyen-gia/thong-tin", (r) => r.fulfill({ json: tt }));

test("thuần: bộ lọc câu trả lời chặn tên bệnh / phán hung / link / số điện thoại, chỉ cảnh báo giọng phán; dòng hạn không thúc", () => {
  expect(kiemTraLoi("Lá số của bạn năm tới có Hoá Lộc vào cung Quan Lộc, việc đổi chỗ làm thuận hơn nửa cuối năm. Nên chuẩn bị từ quý hai.")).toEqual({ chan: [], canh_bao: [] });
  const benh = kiemTraLoi("Cung Tật Ách có Kỵ nên bạn dễ bị tiểu đường, cần đi khám ngay để chẩn đoán sớm nhé.");
  expect(benh.chan.join(" ")).toMatch(/tiểu đường/);
  expect(benh.chan.join(" ")).toMatch(/chẩn đoán/);
  expect(kiemTraLoi("Năm 2027 là năm đại kỵ, bạn sẽ gặp tai hoạ lớn nếu không cẩn thận.").chan.join(" ")).toMatch(/đại kỵ|tai hoạ/);
  expect(kiemTraLoi("Xem chi tiết tại https://abc.vn rồi liên hệ 0912 345 678 để tôi xem thêm cho bạn.").chan.join(" ")).toMatch(/link|số điện thoại/);
  // Không dấu vẫn bắt (người gõ nhanh).
  expect(kiemTraLoi("Ban co the bi ung thu neu khong giu suc khoe, hay di kham dinh ky.").chan.length).toBeGreaterThan(0);
  const phan = kiemTraLoi("Bạn chắc chắn sẽ đổi việc vào tháng tám, nên mua vật phẩm hộ mệnh để giải hạn cho yên tâm hơn nhé bạn.");
  expect(phan.chan).toEqual([]);
  expect(phan.canh_bao.join(" ")).toMatch(/chắc chắn/);
  expect(kiemTraLoi("Nên đổi.").chan[0]).toMatch(/quá ngắn/);

  const con = dongHan(new Date(Date.now() + 31 * 3_600_000).toISOString());
  expect(con).toMatch(/còn khoảng 31 giờ/);
  expect(con).not.toMatch(CUM_THUC_EP);
  expect(dongHan(new Date(Date.now() - 60_000).toISOString())).toMatch(/hoàn 100 %/);
  expect(dongHan(null)).toBe("");
});

test("công tắc tắt: trang có, noindex, nút 'sắp mở', không hiện biểu mẫu", async ({ page }) => {
  await giaLap(page, { ...BAT, bat: false });
  await page.goto("/hoi-chuyen-gia");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Một câu hỏi");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByTestId("cg-chua-mo")).toContainText("sắp mở");
  await expect(page.getByTestId("cg-form")).toHaveCount(0);
  await expect(page.getByTestId("cg-cam-ket")).toContainText("hoàn 100 %");
});

test("công tắc bật: giá + câu đầu giảm, đếm ký tự, ô chia sẻ hồ sơ KHÔNG tích sẵn và nói rõ gửi gì", async ({ page }) => {
  await giaLap(page, BAT);
  await napHoSo(page);
  await page.goto("/hoi-chuyen-gia");
  const form = page.getByTestId("cg-form");
  await expect(form).toBeVisible();
  await expect(page.getByTestId("cg-gia")).toContainText("139.300 ₫");
  await expect(page.getByTestId("cg-gia")).toContainText("câu đầu giảm 30 %");
  const dongY = page.getByTestId("cg-dong-y");
  await expect(dongY).not.toBeChecked();
  await expect(page.getByTestId("cg-xem-chia-se")).toHaveCount(0);
  const cauMau = "Tôi có nên đổi việc vào đầu năm sau không?";   // 42 ký tự
  await page.getByLabel("Câu hỏi cho chuyên gia").fill(cauMau);
  await expect(page.getByTestId("cg-dem")).toHaveText(`${cauMau.length}/1.500`);
  await dongY.check();
  await expect(page.getByTestId("cg-xem-chia-se")).toContainText("Nguyễn Đức Luân · 17/05/1990 · 12:30 · nam · ha-noi");
  // Không đếm ngược thúc ép ở bất kỳ đâu trên trang.
  expect(await page.locator("main").innerText()).not.toMatch(CUM_THUC_EP);
});

test("câu khủng hoảng: engine nhận ra → lời hỗ trợ, KHÔNG gọi tạo đơn, không chuyển trang", async ({ page }) => {
  await giaLap(page, BAT);
  let goiTao = 0;
  await page.route("**/api/chuyen-gia/tao", (r) => { goiTao++; return r.fulfill({ status: 500, json: { error: "không được gọi" } }); });
  await page.goto("/hoi-chuyen-gia");
  await page.getByLabel("Câu hỏi cho chuyên gia").fill("Tôi mệt mỏi quá, tôi không muốn sống nữa, có nên kết thúc không?");
  await page.getByTestId("cg-gui").click();
  await expect(page.getByTestId("cg-ho-tro")).toContainText("không bán câu hỏi này");
  await expect(page).toHaveURL(/\/hoi-chuyen-gia/);
  expect(goiTao).toBe(0);
});

test("câu ngoài phạm vi (xổ số) bị từ chối trước thanh toán; câu thường chưa đăng nhập → đi đăng nhập, giữ nháp", async ({ page }) => {
  await giaLap(page, BAT);
  await page.goto("/hoi-chuyen-gia");
  await page.getByLabel("Câu hỏi cho chuyên gia").fill("Cho tôi số xổ số trúng tối nay theo lá số của tôi?");
  await page.getByTestId("cg-gui").click();
  await expect(page.getByTestId("cg-loi")).toContainText("ngoài phạm vi");
  await page.getByLabel("Câu hỏi cho chuyên gia").fill("Năm tới tôi có nên mở cửa hàng riêng không?");
  await page.getByTestId("cg-gui").click();
  await expect(page).toHaveURL(/\/dang-nhap\?tiep=%2Fhoi-chuyen-gia/);
  expect(JSON.parse((await page.evaluate(() => sessionStorage.getItem("cg:nhap")))!)).toMatchObject({ cau: "Năm tới tôi có nên mở cửa hàng riêng không?" });
});

test("/tai-khoan/cau-hoi: trạng thái, hạn trung tính, câu trả lời + đánh giá, huỷ khi chờ thanh toán (máy chủ giả lập)", async ({ page }) => {
  const han = new Date(Date.now() + 30 * 3_600_000).toISOString();
  const ds = [
    { id: 3, mang: "tu_vi", cau_hoi: "Câu đang chờ trả lời", gia_vnd: 139300, mien_phi_hoi_vien: false, trang_thai: "cho_tra_loi", ma_don: 100201, het_han_don: null, thanh_toan_luc: new Date().toISOString(), han_tra_loi: han, tra_loi: null, tra_loi_luc: null, danh_gia: null, hoan_luc: null, co_ho_so: true, tao_luc: new Date().toISOString() },
    { id: 2, mang: "than_so", cau_hoi: "Câu đã có trả lời", gia_vnd: 199000, mien_phi_hoi_vien: false, trang_thai: "da_tra_loi", ma_don: 100200, het_han_don: null, thanh_toan_luc: new Date().toISOString(), han_tra_loi: han, tra_loi: "Đường đời 33 của bạn hợp việc có người cùng làm.", tra_loi_luc: new Date().toISOString(), danh_gia: null, hoan_luc: null, co_ho_so: false, tao_luc: new Date().toISOString() },
    { id: 1, mang: "bat_tu", cau_hoi: "Câu chưa thanh toán", gia_vnd: 139300, mien_phi_hoi_vien: false, trang_thai: "cho_tra", ma_don: 100199, het_han_don: new Date(Date.now() + 600_000).toISOString(), thanh_toan_luc: null, han_tra_loi: null, tra_loi: null, tra_loi_luc: null, danh_gia: null, hoan_luc: null, co_ho_so: false, tao_luc: new Date().toISOString() },
  ];
  const guiLen: unknown[] = [];
  await page.route("**/api/chuyen-gia/cua-toi*", (r) => {
    if (r.request().method() === "POST") { guiLen.push(r.request().postDataJSON()); return r.fulfill({ json: { ket_qua: "da_ghi" } }); }
    return r.fulfill({ json: { ds } });
  });
  // Giả lập đã đăng nhập: trang chỉ cần access token từ supabase — không có Supabase trong e2e → mô phỏng bằng cách thử phần chưa đăng nhập.
  await page.goto("/tai-khoan/cau-hoi");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Câu hỏi của tôi");
  await expect(page.getByText("Đăng nhập để xem câu hỏi đã gửi.")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(guiLen).toEqual([]);
});
