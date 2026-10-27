// Luồng Phase 1 (docs/THIET-KE-UI.md §6.1): landing → nhập → nghi thức → hé lộ → hồ sơ → chiều sâu → hỏi.
// Ca đã chốt (docs/NHAT-KY-DU-AN.md): Nguyễn Đức Luân 24/10/1988 → DD 6 (rút gọn con số — mặc định từ 2026-10-20;
// cộng hết chữ số ra 33) / SM9 / LH6 / NC3.
import { test, expect } from "@playwright/test";
import { hoi, napDongY, napHoSo } from "./_hoso";

const LUAN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 24, thang: 10, nam: 1988, tao_luc: "2026-09-30T00:00:00Z" };

test("landing → nhập 2 trường → hé lộ số đường đời và hồ sơ 4 số", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bạn là số mấy");
  await page.getByLabel("Họ và tên đầy đủ").fill("Nguyễn Đức Luân");
  await page.getByLabel("Ngày", { exact: true }).fill("24");
  await page.getByLabel("Tháng", { exact: true }).fill("10");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
  // ĐY-1: lần đầu chưa đồng ý → khối đồng ý + nút "Đồng ý và xem kết quả" (không ô tích sẵn, không modal).
  await expect(page.getByTestId("dong-y-du-lieu")).toContainText("không lưu");
  await page.getByRole("button", { name: "Đồng ý và xem kết quả" }).click();

  // QH-BT: nhập ở trang chủ → bài đọc /than-so (nghi thức + con số lớn ngay tại đó), không qua /ban-than.
  await expect(page.getByTestId("so-duong-doi")).toHaveText("6", { timeout: 60_000 });
  await expect(page).toHaveURL(/\/than-so$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  for (const [vt, so] of [["duong_doi", "6"], ["su_menh", "9"], ["linh_hon", "6"], ["nhan_cach", "3"]] as const) {
    await expect(page.getByTestId(`the-${vt}`).getByTestId("gia-tri")).toHaveText(so);
  }
  // Diễn giải (mặt tối + nguồn) hiện sẵn · Kiểm chứng (tích nét đúng, đếm trên máy) · Cách tính thu gọn, bấm mới mở.
  const dd = page.getByTestId("the-duong_doi");
  await expect(dd).toContainText("Mặt tối:");
  await expect(dd).toContainText("Nguồn:");
  await expect(dd).not.toContainText("6 + 1 + 8 = 15");
  await dd.getByTestId("mo-cach-tinh").click();
  await expect(dd).toContainText("6 + 1 + 8 = 15 → 6");
  const kc = dd.getByTestId("kiem-chung-duong_doi").getByRole("checkbox");
  await expect(kc).toHaveCount(6);
  for (const i of [0, 1, 2, 3]) await kc.nth(i).click();
  await expect(dd.getByTestId("ket-qua-kiem-chung-duong_doi")).toContainText("Khớp 4/6. Số 6 khá đúng với bạn.");

  await expect(page.getByTestId("chan-dung")).toBeVisible();
  // Trang của tôi: danh tính gọn + nhịp + tóm tắt bản đồ, KHÔNG lặp bốn thẻ số của bài đọc.
  await page.goto("/ban-than");
  await expect(page.getByTestId("the-danh-tinh")).toContainText("Nguyễn Đức Luân");
  await expect(page.getByTestId("the-duong_doi")).toHaveCount(0);
  await expect(page.getByTestId("chan-dung")).toHaveCount(0);
  await expect(page.getByTestId("ban-do-tom-tat")).toContainText("Bên trong & bên ngoài");
  await page.getByTestId("mo-bai-doc").click();
  await expect(page).toHaveURL(/\/than-so$/);
  await expect(page.getByTestId("so-duong-doi")).toHaveCount(0);   // hé lộ chỉ ngay sau lần nhập đầu
  // Hồ sơ giữ lại khi quay về trang chủ.
  await page.goto("/");
  await expect(page.getByText("Chào lại")).toBeVisible();
});

test("chiều sâu: dải đời, biểu đồ ngày sinh, hỏi đáp", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  await expect(page.getByTestId("ten-chinh")).toHaveText("Nguyễn Đức Luân");
  await expect(page.getByTestId("ngay-sinh")).toHaveText("Sinh 24/10/1988");   // không còn dòng kỹ thuật "quy ước / chỉ số nhạy"
  await expect(page.getByTestId("ten-lech")).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Dải đời đỉnh cao theo tuổi" })).toBeVisible();

  await page.getByRole("tab", { name: "Biểu đồ ngày sinh" }).click();
  const bd = page.getByTestId("bieu-do");
  await expect(bd.getByText("Mũi tên trống Tâm linh (Hoài nghi)")).toBeVisible();
  await expect(bd.getByText("Số vắng trong ngày sinh: 3, 5, 6, 7")).toBeVisible();

  await page.getByRole("button", { name: "Điểm mạnh cốt lõi của tôi là gì?" }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans).toContainText("Mặt tối cần để ý");
  await expect(ans).toContainText("Ghép trực tiếp từ kho tri thức có nguồn.");

  const hopDoi = await hoi(page, "Tôi và người yêu có hợp nhau không?");
  await expect(hopDoi.getByRole("link", { name: /Hợp đôi/ })).toBeVisible();
});

test("chưa có hồ sơ: trang Bản thân mời nhập", async ({ page }) => {
  await page.goto("/ban-than");
  await expect(page.getByText("Bắt đầu bằng tên và ngày sinh")).toBeVisible();
});

test("form hồ sơ chặn ngày sinh tương lai và họ tên không có chữ", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Họ và tên đầy đủ").fill("123 456");
  await page.getByLabel("Ngày", { exact: true }).fill("1");
  await page.getByLabel("Tháng", { exact: true }).fill("1");
  await page.getByLabel("Năm", { exact: true }).fill("1990");
  await page.getByRole("button", { name: "Đồng ý và xem kết quả" }).click();
  await expect(page.getByText("Nhập họ tên đầy đủ")).toBeVisible();
  // Form chặn TRƯỚC khi ghi đồng ý → vẫn là lần đầu.
  await page.getByLabel("Họ và tên đầy đủ").fill("Trần An");
  await page.getByLabel("Năm", { exact: true }).fill("2099");
  await page.getByRole("button", { name: "Đồng ý và xem kết quả" }).click();
  await expect(page.getByText("Ngày sinh chưa đúng")).toBeVisible();
  await expect(page).not.toHaveURL(/than-so/);
});

test("engine lỗi: báo rõ + thử lại được; trang lạ ra 404 tiếng Việt", async ({ page }) => {
  await napHoSo(page, LUAN);
  let hong = true;
  await page.route("**/api/thanso/luan-giai", (r) => (hong ? r.fulfill({ status: 502, contentType: "application/json", body: '{"error":"Chưa tính được lúc này."}' }) : r.fallback()));
  await page.goto("/than-so");
  await expect(page.getByRole("alert").filter({ hasText: "Chưa tính được" })).toBeVisible();
  hong = false;
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByTestId("ten-chinh")).toBeVisible();
  await page.goto("/khong-co-trang-nay");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("không có trên bản đồ sao");
});

test("nhập ngày ÂM lịch: xem trước dương lịch, bài đọc tính theo ngày dương", async ({ page }) => {
  await napDongY(page);   // xem trước đổi lịch chỉ chạy sau khi đã đồng ý gửi ngày sinh đi tính
  await page.goto("/");
  await page.getByLabel("Họ và tên đầy đủ").fill("Nguyễn Đức Luân");
  await page.getByRole("radio", { name: "Âm lịch" }).click();
  await page.getByLabel("Ngày", { exact: true }).fill("14");
  await page.getByLabel("Tháng", { exact: true }).fill("9");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
  await expect(page.getByTestId("doi-lich")).toContainText("Dương lịch: 24/10/1988 · năm Mậu Thìn");
  await page.getByRole("button", { name: "Xem con số của tôi" }).click();
  await expect(page.getByTestId("so-duong-doi")).toHaveText("6");
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.hoso.v1") ?? "{}"));
  expect([h.ngay, h.thang, h.nam, h.lich_nhap, h.am?.ngay, h.am?.thang]).toEqual([24, 10, 1988, "am", 14, 9]);
});

test("nhập dương lịch: hiện ngày âm để đối chiếu giấy tờ", async ({ page }) => {
  await napDongY(page);
  await page.goto("/");
  await page.getByLabel("Ngày", { exact: true }).fill("24");
  await page.getByLabel("Tháng", { exact: true }).fill("10");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
  await expect(page.getByTestId("doi-lich")).toContainText("Âm lịch: 14/9/1988 (Mậu Thìn) · ngày");
});

test("nhập ÂM lịch: ngày 30 của tháng thiếu bị chặn; năm có tháng nhuận được nhắc", async ({ page }) => {
  await napDongY(page);
  await page.goto("/");
  await page.getByRole("radio", { name: "Âm lịch" }).click();
  await page.getByLabel("Ngày", { exact: true }).fill("30");
  await page.getByLabel("Tháng", { exact: true }).fill("01");
  await page.getByLabel("Năm", { exact: true }).fill("2024");
  await expect(page.getByTestId("doi-lich")).toContainText("chỉ có 29 ngày");
  await page.getByLabel("Ngày", { exact: true }).fill("15");
  await page.getByLabel("Tháng", { exact: true }).fill("06");
  await page.getByLabel("Năm", { exact: true }).fill("2025");
  await expect(page.getByTestId("nhac-nhuan")).toContainText("hai tháng 6");
  await page.getByLabel("Tháng nhuận").check();
  await expect(page.getByTestId("nhac-nhuan")).toHaveCount(0);
  await expect(page.getByTestId("doi-lich")).toContainText("Dương lịch:");
});

test("TS-SAU: chân dung 4 mặt có lớp riêng; dòng đời + đối chiếu năm biến cố", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  const cd = page.getByTestId("chan-dung");
  await expect(cd).toContainText("Điểm mạnh");
  await expect(cd.getByTestId("lop-them")).toContainText("Linh hồn 6");
  await cd.getByTestId("mat-cong_viec").click();
  await expect(cd.getByTestId("nghe")).toContainText("Giáo dục");
  await expect(cd.getByTestId("lop-them")).toContainText("Sứ mệnh 9");
  await cd.getByTestId("mat-bien_co").click();
  await cd.getByRole("link", { name: /bước ngoặt trên dòng đời/ }).click();

  await expect(page).toHaveURL(/\/than-so#dong-doi/);
  const dd = page.getByTestId("dong-doi");
  await expect(dd.getByRole("img", { name: /Dòng đời/ }).first()).toBeVisible();
  await expect(dd.getByTestId("moc-sap-toi")).toContainText("2027");   // năm cá nhân 9 → khép chu kỳ
  const dc = page.getByTestId("doi-chieu-nam");
  await dc.getByLabel("Năm có biến cố").fill("2019");
  await dc.getByRole("button", { name: "Thêm năm" }).click();
  await dc.getByRole("button", { name: "Đặt lên dòng đời" }).click();
  const kq = page.getByTestId("ket-qua-doi-chieu");
  await expect(kq).toContainText("2019");
  await expect(kq).toContainText("Mở chu kỳ 9 năm mới");
  await expect(kq).toContainText("Sang giai đoạn đời mới — đỉnh số 5");
  await expect(kq).toContainText("Thường được đối chiếu với");
});

test("TV-LICH: ngày lịch Việt ≠ lịch Trung Quốc → hồ sơ nhắc lá số tử vi có thể khác", async ({ page }) => {
  await napDongY(page);
  await page.goto("/");
  await page.getByLabel("Ngày", { exact: true }).fill("30");
  await page.getByLabel("Tháng", { exact: true }).fill("1");
  await page.getByLabel("Năm", { exact: true }).fill("1985");
  await expect(page.getByTestId("doi-lich")).toContainText("theo lịch Việt Nam");
  await expect(page.getByTestId("nhac-lich-trung")).toContainText("theo lịch Trung Quốc là");
  await page.getByLabel("Ngày", { exact: true }).fill("17");
  await page.getByLabel("Tháng", { exact: true }).fill("5");
  await page.getByLabel("Năm", { exact: true }).fill("1990");
  await expect(page.getByTestId("doi-lich")).toContainText("Âm lịch:");
  await expect(page.getByTestId("nhac-lich-trung")).toHaveCount(0);
});

test("TS-PHAI: đổi sang phái Chaldea → 6 con số engine tính, có số kép + đối chiếu Pitago; lựa chọn được nhớ", async ({ page, request }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  const khung = page.getByTestId("truong-phai-than-so");
  await page.getByTestId("truong-phai-than-so-mo").click();
  await khung.getByRole("tab", { name: "Chaldea" }).click();
  await expect(page.getByTestId("bai-chaldea")).toBeVisible();
  const api = await (await request.post("/api/thanso/chaldea", { data: { ho_ten: ["Nguyễn Đức Luân"], ngay: 24, thang: 10, nam: 1988 } })).json();
  for (const s of api.cac_so as { ma: string; goc: number }[]) {
    await expect(page.getByTestId(`chaldea-${s.ma}`).getByLabel(`Số gốc ${s.goc}`)).toBeVisible();
  }
  await expect(page.getByTestId("chaldea-duong_doi")).toContainText("Phái Pitago: Đường đời 6");
  await expect(page.getByRole("tab", { name: "Biểu đồ ngày sinh" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("bai-chaldea")).toBeVisible();
  await page.getByTestId("truong-phai-than-so-mo").click();
  await page.getByTestId("truong-phai-than-so").getByRole("tab", { name: "Pitago" }).click();
  await expect(page.getByTestId("the-duong_doi")).toBeVisible();
});

test("TS-PHAI-2: phái Chaldea → hỏi đáp bản thân trả lời bằng số Chaldea; câu năm cá nhân ghi rõ theo Pythagoras", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  await page.getByTestId("truong-phai-than-so-mo").click();
  await page.getByTestId("truong-phai-than-so").getByRole("tab", { name: "Chaldea" }).click();
  await page.getByRole("button", { name: "Điểm mạnh cốt lõi của tôi là gì?" }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans).toContainText("theo phái Chaldea");
  const nam = await hoi(page, "Năm nay của tôi thế nào?");
  await expect(nam).toContainText("theo phái Pythagoras");
});
