// SAO-2 — cửa Sao phía trình duyệt: bản xem trước Luận giải toàn bộ (chương khoá + lời mời), mở khoá cần đăng nhập /
// nạp nhanh, hỏi đáp vượt lượt miễn phí → hộp đồng ý trừ Sao rồi gửi lại kèm x-dong-y-sao. Máy chủ được giả lập bằng
// page.route (e2e không có Supabase); quy tắc máy chủ kiểm ở supabase/kiem_thu/thu_sao_2.sql + test thuần bên dưới.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo, hoi } from "./_hoso";
import { catXemTruoc } from "../lib/sao-xem-truoc";
import { ghiLuot } from "../lib/hoi-mang";

const MOI = (cau: string) => ({ diem_nhan: "Trong lá số của bạn, Thiên Đồng ở cung Phu Thê (Đắc)", cau_hoi: cau, so_doan: 4, phut_doc: 2 });
const XEM_TRUOC = {
  mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 2,
  chuong: [
    { ma: "tong_quan", tieu_de: "Tổng quan bản mệnh", doan: ["Đoạn mở miễn phí."] },
    { ma: "tinh_cam", tieu_de: "Tình cảm, hôn nhân", khoa: true, moi_xem: MOI("Bạn thật sự tìm gì ở người bạn đời?") },
    { ma: "van_han", tieu_de: "Vận hạn hiện tại", khoa: true, moi_xem: MOI("Mười năm này xoay quanh chủ đề gì?") },
  ],
  phi: { sao: 10, ly_do: "xem_truoc", khoa: true, dang_nhap: false, so_du: null, thuong_chao_mung: 10 },
};
const DAY_DU = { ...XEM_TRUOC, so_khoa: 0, phi: { sao: 10, ly_do: "da_tru_sao", so_du: 20 }, chuong: [
  { ma: "tong_quan", tieu_de: "Tổng quan bản mệnh", doan: ["Đoạn mở miễn phí."] },
  { ma: "tinh_cam", tieu_de: "Tình cảm, hôn nhân", doan: ["Nội dung chương tình cảm đã mở."] },
  { ma: "van_han", tieu_de: "Vận hạn hiện tại", doan: ["Nội dung vận hạn đã mở."] },
] };

async function giaLapLuanGiai(page: Page, moKhoa: (route: Parameters<Parameters<Page["route"]>[1]>[0]) => Promise<void>) {
  await page.route("**/api/luan-giai/phi", (r) => r.fulfill({ json: { thu: true, gia: 10 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.request().headers()["x-mo-khoa"] === "1" ? moKhoa(r) : r.fulfill({ json: XEM_TRUOC }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
}

test("thuần: cắt bản xem trước bỏ hẳn đoạn văn chương khoá; dòng lượt hỏi", () => {
  const bc = { mo_dun: "tuvi", chuong: [
    { ma: "a", tieu_de: "A", doan: ["mở"] },
    { ma: "b", tieu_de: "B", doan: ["BÍ MẬT"], van_ai: "BÍ MẬT AI", moi_xem: MOI("Hỏi?") },
  ] };
  const x = catXemTruoc(bc, 1);
  expect(x.so_khoa).toBe(1);
  expect(JSON.stringify(x)).not.toContain("BÍ MẬT");
  expect(x.chuong[1]).toEqual({ ma: "b", tieu_de: "B", khoa: true, moi_xem: MOI("Hỏi?") });
  expect(catXemTruoc(bc, 0).so_khoa).toBe(2);
  expect(catXemTruoc(bc, 9).so_khoa).toBe(0);
  expect(ghiLuot({ con_lai: 5, tran: 10, tai_khoan: true })).toBeUndefined();
  expect(ghiLuot({ con_lai: 2, tran: 10, tai_khoan: true })).toBe("Còn 2 câu miễn phí hôm nay.");
  expect(ghiLuot({ con_lai: 0, tran: 3, tai_khoan: false })).toContain("Đăng nhập để hỏi thêm");
  expect(ghiLuot({ sao_da_tru: 1, so_du: 4 })).toBe("Đã dùng 1 Sao cho câu này · ví còn 4 Sao.");
});

test("xem trước: chương đầu đọc được, chương sau khoá kèm điểm nhấn + câu hỏi; mở khoá khi chưa đăng nhập → mời đăng nhập", async ({ page }) => {
  await giaLapLuanGiai(page, (r) => r.fulfill({ status: 402, json: { error: "Đăng nhập để mở toàn bộ báo cáo (10 Sao).", can: "dang_nhap", gia: 10, thuong: 10 } }));
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toContainText("Đoạn mở miễn phí.");
  const khoa = page.getByTestId("lg-phan-khoa");
  await expect(khoa).toContainText("Đã đọc 1/3 chương");
  await expect(page.getByTestId("lg-chuong-khoa")).toHaveCount(2);
  await expect(khoa).toContainText("Bạn thật sự tìm gì ở người bạn đời?");
  await expect(khoa).toContainText("tặng 10 Sao — đủ mở báo cáo này");
  await page.getByTestId("lg-mo-khoa").click();
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "dang_nhap");
  await expect(hop.getByTestId("sao-dang-nhap")).toHaveAttribute("href", "/dang-nhap?tiep=%2Ftu-vi");
  // Báo cáo chờ mở lưu ở localStorage (sống qua tab mới), gắn route + lá số, có hạn.
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem("lg:cho-mo")))!)).toMatchObject({ d: "/api/tuvi/luan-giai" });
  // Bấm đóng ("để sau") → bỏ chờ, không tự bật lại khi quay về.
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => localStorage.getItem("lg:cho-mo"))).toBeNull();
});

test("mở khoá thiếu Sao → nạp nhanh ngay trong hộp, gợi ý gói nhỏ nhất đủ dùng", async ({ page }) => {
  await page.route("**/api/thanh-toan/goi", (r) => r.fulfill({ json: { cong: "payos", goi: [
    { ma: "thu", ten: "Thử", gia_vnd: 29000, sao: 30, nhan: null, mo_ta: "Đủ 3 lần" },
    { ma: "pho_bien", ten: "Phổ biến", gia_vnd: 99000, sao: 110, nhan: "Phổ biến", mo_ta: null },
  ] } }));
  await giaLapLuanGiai(page, (r) => r.fulfill({ status: 402, json: { error: "Cần 10 Sao, ví bạn còn 3 Sao.", can: "nap", gia: 10, so_du: 3 } }));
  await page.getByTestId("lg-mo-khoa").click();
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "nap");
  await expect(hop.getByTestId("nap-nhanh-nut")).toHaveText(/Quét QR nạp 30 Sao · 29\.000/);
});

test("mở khoá đủ Sao → báo cáo đầy đủ, hết phần khoá", async ({ page }) => {
  await giaLapLuanGiai(page, (r) => r.fulfill({ json: DAY_DU }));
  await page.getByTestId("lg-mo-khoa").click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toContainText("Nội dung chương tình cảm đã mở.");
  await expect(page.getByTestId("lg-phan-khoa")).toHaveCount(0);
});

test("hỏi đáp hết lượt miễn phí: hộp đồng ý 1 Sao → gửi lại kèm x-dong-y-sao, hiện Sao đã dùng", async ({ page }) => {
  let dongY = "";
  await page.route("**/api/tuvi/hoi", (r) => {
    if (r.request().headers()["x-dong-y-sao"] !== "1") {
      return r.fulfill({ status: 402, json: { error: "Hết 10 câu miễn phí hôm nay. Hỏi tiếp: 1 Sao mỗi câu.", can: "xac_nhan_sao", gia: 1, so_du: 5, tran: 10 } });
    }
    dongY = "1";
    return r.fulfill({ json: { cau_tra_loi: "Câu trả lời sau khi dùng Sao.", che_do: "template", luot: { sao_da_tru: 1, so_du: 4 } } });
  });
  await napHoSo(page);
  await page.goto("/tu-vi");
  const traLoi = hoi(page, "Cung Mệnh của tôi nói gì?");
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "xac_nhan_sao");
  await expect(hop).toContainText("ví còn 5 Sao");
  await hop.getByTestId("sao-dong-y").click();
  await expect(await traLoi).toContainText("Câu trả lời sau khi dùng Sao.");
  expect(dongY).toBe("1");
  await expect(page.getByTestId("ghi-luot").last()).toContainText("Đã dùng 1 Sao cho câu này · ví còn 4 Sao.");
});

test("hỏi đáp: khách hết lượt → mời đăng nhập, khung chat báo lỗi nhẹ", async ({ page }) => {
  await page.route("**/api/tuvi/hoi", (r) => r.fulfill({ status: 402, json: { error: "Bạn đã dùng hết 3 câu hỏi miễn phí hôm nay.", can: "dang_nhap", tran: 3, thuong: 10 } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  void hoi(page, "Cung Mệnh của tôi nói gì?");
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "dang_nhap");
  await expect(hop).toContainText("Hết câu hỏi miễn phí hôm nay");
  await page.keyboard.press("Escape");
  await expect(page.getByText("Bạn đã dùng hết 3 câu hỏi miễn phí hôm nay.").last()).toBeVisible();
});
