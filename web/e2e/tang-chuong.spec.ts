// SAO-V "Tặng một chương" — trang nhận quà /qua/<mã>, nút tặng sau khi mở báo cáo bằng Sao, ghi chú chương được tặng,
// công tắc thu Sao từng mảng (?mo_dun=). Máy chủ được giả lập bằng page.route (e2e không có Supabase: trang /qua đọc
// quà ở máy chủ không được → trình duyệt thử lại qua /api/qua/<mã>, chính route bị giả lập). Quy tắc SQL (trần 30 ngày,
// mỗi người một quà / mảng, link 7 ngày dùng một lần) kiểm ở supabase/kiem_thu.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { DUONG_BAO_CAO, mangLuanGiai } from "../lib/luan-giai-mang";
import { lamSachUrl } from "../lib/do-luong";

const MA = "abcde12345";
const HAN = new Date(Date.now() + 5 * 86_400_000).toISOString();

async function giaLapQua(page: Page, tt: object, nhan?: object) {
  await page.route(`**/api/qua/${MA}`, (r) => r.request().method() === "POST"
    ? r.fulfill({ json: nhan ?? { ket_qua: "da_nhan", mo_dun: "battu" } })
    : r.fulfill({ json: tt }));
}

test("thuần: bí danh mảng → mảng luận giải; mã quà không lọt lên đo lường", () => {
  expect(mangLuanGiai("thanso_sau")).toBe("thanso");
  expect(mangLuanGiai("tu_vi")).toBe("tuvi");
  expect(mangLuanGiai("battu")).toBe("battu");
  expect(mangLuanGiai("kinhdich")).toBeNull();
  expect(mangLuanGiai(null)).toBeNull();
  expect(DUONG_BAO_CAO.thanso).toBe("/than-so#ban-do-con-so");
  expect(lamSachUrl(`/qua/${MA}?gt=abcd1234`)).toBe("/qua/:ma?gt=abcd1234");
  expect(lamSachUrl(`https://hieuban.com/qua/${MA}`)).toBe("https://hieuban.com/qua/:ma");
  expect(lamSachUrl("/tu-vi/chinh-tinh")).toBe("/tu-vi/chinh-tinh");
});

test("trang nhận quà — khách: lời mời + nút đăng nhập quay lại đúng link, noindex", async ({ page }) => {
  await giaLapQua(page, { qua: { mo_dun: "tuvi", het_han: HAN, con_dung: true }, dang_nhap: false, co_ho_so: false });
  await page.goto(`/qua/${MA}?gt=abcd1234`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Một người bạn tặng bạn một chương Luận giải Tử vi");
  await expect(page.getByTestId("nhan-qua")).toContainText("chính bạn");
  await expect(page.getByTestId("nhan-qua-dang-nhap")).toHaveAttribute("href", `/dang-nhap?tiep=%2Fqua%2F${MA}`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  // ?gt= được layout lưu như link mời thường.
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.gt") ?? "null")?.ma)).toBe("abcd1234");
});

test("trang nhận quà — quà hết hạn / đã dùng: câu nhẹ nhàng + công cụ miễn phí", async ({ page }) => {
  await giaLapQua(page, { qua: { mo_dun: "thanso", het_han: HAN, con_dung: false }, dang_nhap: false, co_ho_so: false });
  await page.goto(`/qua/${MA}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Món quà này đã được mở");
  await expect(page.getByRole("link", { name: /Xem Bản đồ con số của bạn/ })).toHaveAttribute("href", "/than-so#ban-do-con-so");
  await expect(page.getByTestId("nhan-qua-dang-nhap")).toHaveCount(0);
});

test("trang nhận quà — mã sai: không gọi máy chủ, vẫn có công cụ miễn phí", async ({ page }) => {
  await page.goto("/qua/KHONG-HOP-LE");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Link quà không đúng");
});

test("trang nhận quà — có tài khoản chưa lưu hồ sơ: hướng dẫn lưu", async ({ page }) => {
  await giaLapQua(page, { qua: { mo_dun: "battu", het_han: HAN, con_dung: true }, dang_nhap: true, co_ho_so: false });
  await page.goto(`/qua/${MA}`);
  await expect(page.getByTestId("nhan-qua-luu-ho-so")).toContainText("Lưu vào tài khoản");
  await expect(page.getByTestId("nhan-qua-nut")).toHaveCount(0);
});

test("trang nhận quà — đủ điều kiện: Nhận quà → chuyển tới trang công cụ của mảng", async ({ page }) => {
  await giaLapQua(page, { qua: { mo_dun: "battu", het_han: HAN, con_dung: true }, dang_nhap: true, co_ho_so: true });
  await page.goto(`/qua/${MA}`);
  await page.getByTestId("nhan-qua-nut").click();
  await page.waitForURL("**/bat-tu");
});

test("trang nhận quà — đã nhận quà mảng này trước đó: báo nhẹ, không chuyển trang", async ({ page }) => {
  await giaLapQua(page, { qua: { mo_dun: "tuvi", het_han: HAN, con_dung: true }, dang_nhap: true, co_ho_so: true },
    { ket_qua: "da_co_qua", mo_dun: "tuvi" });
  await page.goto(`/qua/${MA}`);
  await page.getByTestId("nhan-qua-nut").click();
  await expect(page.getByTestId("nhan-qua-trang-thai")).toContainText("đã nhận một chương tặng");
});

const MOI = { diem_nhan: "", cau_hoi: "Chương này nói gì?", so_doan: 2, phut_doc: 1 };

test("báo cáo: hỏi công tắc đúng mảng; chương được tặng ghi chú; mở bằng Sao → nút tặng + link quà", async ({ page }) => {
  let moDunPhi = "";
  await page.route("**/api/luan-giai/phi*", (r) => { moDunPhi = new URL(r.request().url()).searchParams.get("mo_dun") ?? ""; return r.fulfill({ json: { thu: true, gia: 10 } }); });
  const xemTruoc = {
    mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 1,
    chuong: [
      { ma: "tong_quan", tieu_de: "Tổng quan", doan: ["Đoạn miễn phí."] },
      { ma: "tinh_cam", tieu_de: "Tình cảm", doan: ["Đoạn được tặng."] },
      { ma: "van_han", tieu_de: "Vận hạn", khoa: true, moi_xem: MOI },
    ],
    phi: { sao: 10, ly_do: "xem_truoc", khoa: true, dang_nhap: true, so_du: 20, thuong_chao_mung: null, chuong_tang: 1, chuong_tang_ma: "tinh_cam" },
  };
  const dayDu = { ...xemTruoc, so_khoa: 0, phi: { sao: 10, ly_do: "da_tru_sao", so_du: 10 }, chuong: [
    { ma: "tong_quan", tieu_de: "Tổng quan", doan: ["Đoạn miễn phí."] },
    { ma: "tinh_cam", tieu_de: "Tình cảm", doan: ["Đoạn được tặng."] },
    { ma: "van_han", tieu_de: "Vận hạn", doan: ["Đoạn vận hạn đã mở."] },
  ] };
  await page.route("**/api/tuvi/luan-giai", (r) => r.fulfill({ json: r.request().headers()["x-mo-khoa"] === "1" ? dayDu : xemTruoc }));
  let taoMoDun = "";
  await page.route("**/api/qua", (r) => {
    if (r.request().method() === "POST") {
      taoMoDun = (r.request().postDataJSON() as { mo_dun: string }).mo_dun;
      return r.fulfill({ json: { ket_qua: "da_tao", ma: MA, het_han: HAN, con_lai: 1, tran: 3 } });
    }
    return r.fulfill({ json: { bat: true, tran: 3, da_gui_30_ngay: 1, co_the_tang: true } });
  });
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  expect(moDunPhi).toBe("tuvi");
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toContainText("Đoạn được tặng.");
  await expect(page.getByTestId("chuong-qua")).toHaveText("Chương này là quà của một người bạn");
  await expect(page.getByTestId("tang-chuong")).toHaveCount(0);           // chưa mở bằng Sao → chưa tặng được

  await page.getByTestId("lg-mo-khoa").click();
  await expect(bc).toContainText("Đoạn vận hạn đã mở.");
  const tang = page.getByTestId("tang-chuong");
  await expect(tang.getByTestId("tang-chuong-con")).toHaveText("Bạn còn 2/3 quà trong 30 ngày.");
  await tang.getByTestId("tang-chuong-nut").click();
  await expect(tang.getByTestId("tang-chuong-link")).toHaveValue(new RegExp(`/qua/${MA}$|/qua/${MA}\\?gt=`));
  expect(taoMoDun).toBe("tuvi");
  await expect(tang.getByTestId("tang-chuong-con")).toHaveText("Bạn còn 1/3 quà trong 30 ngày.");
});

test("nút tặng: hết lượt 30 ngày → câu trung tính, không có nút", async ({ page }) => {
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 10 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.fulfill({ json: {
    mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 0,
    chuong: [{ ma: "tong_quan", tieu_de: "Tổng quan", doan: ["Đoạn."] }], phi: { sao: 0, ly_do: "da_mo_hom_nay" },
  } }));
  await page.route("**/api/qua", (r) => r.fulfill({ json: { bat: true, tran: 3, da_gui_30_ngay: 3, co_the_tang: true } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  const tang = page.getByTestId("tang-chuong");
  await expect(tang).toContainText("Bạn đã gửi đủ 3 quà trong 30 ngày qua");
  await expect(tang.getByTestId("tang-chuong-nut")).toHaveCount(0);
});

test("API: công tắc thu Sao từng mảng — chưa bật tài khoản thì luôn miễn phí", async ({ request }) => {
  for (const m of ["", "thanso", "tuvi", "battu", "khac"]) {
    expect(await (await request.get(`/api/luan-giai/phi${m ? `?mo_dun=${m}` : ""}`)).json()).toEqual({ thu: false, gia: 10 });
  }
  expect(await (await request.get("/api/qua")).json()).toMatchObject({ bat: false, co_the_tang: false });
  expect((await request.post("/api/qua", { data: { mo_dun: "tuvi" } })).status()).toBe(401);
  expect((await request.get(`/api/qua/${MA}`)).status()).toBe(503);
});
