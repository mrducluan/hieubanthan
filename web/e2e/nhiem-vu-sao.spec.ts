// SAO-3 — hộp "Nhiệm vụ kiếm Sao" trên /ban-than. e2e không có Supabase: hộp phải ẨN (không vỡ trang); trạng thái
// khách / đã đăng nhập giả lập bằng page.route. Điều kiện + mức thưởng thật kiểm ở supabase/kiem_thu/thu_nhiem_vu.sql
// và chuỗi thật web/e2e-that/sao-chuoi-that.spec.ts.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";

const MUC = { luu_ho_so: 5, hoi_3_cau: 5, moi_1_ban: 5 };
const nv = (ma: string, can: number, tien_do: number, da_nhan = false) =>
  ({ ma, can, tien_do, dat: tien_do >= can, sao: 5, da_nhan, sao_da_nhan: da_nhan ? 5 : null });

async function moBanThan(page: Page) {
  await napHoSo(page);
  await page.goto("/ban-than");
  // Lần đầu biên dịch /ban-than ở dev có thể chậm.
  await expect(page.getByTestId("lien-ket-hom-nay")).toBeVisible({ timeout: 45_000 });
}

test("chưa bật tài khoản: API báo tai_khoan=false, /ban-than không hiện hộp nhiệm vụ", async ({ page, request }) => {
  const r = await request.get("/api/sao/nhiem-vu");
  expect(await r.json()).toEqual({ tai_khoan: false });
  expect((await request.post("/api/sao/nhiem-vu", { data: { ma: "luu_ho_so" } })).status()).toBe(503);
  await moBanThan(page);
  await page.waitForTimeout(500);
  await expect(page.getByTestId("nhiem-vu-sao")).toHaveCount(0);
});

test("khách, thưởng đang bật: ba nhiệm vụ + mời đăng nhập qua hộp thoại Sao dùng chung", async ({ page }) => {
  await page.route("**/api/sao/nhiem-vu", (r) => r.fulfill({ json: { tai_khoan: true, dang_nhap: false, bat: true, muc: MUC, chao_mung: 10 } }));
  await moBanThan(page);
  const hop = page.getByTestId("nhiem-vu-sao");
  await expect(hop).toHaveAttribute("data-trang-thai", "khach");
  await expect(hop.getByRole("heading")).toHaveText("Ba bước nhỏ, nhận 15 Sao");
  for (const ten of ["Lưu hồ sơ", "Hỏi 3 câu", "Mời 1 bạn"]) await expect(hop).toContainText(ten);
  await expect(hop.getByText("+5 Sao")).toHaveCount(3);
  await page.getByTestId("nhiem-vu-dang-nhap").click();
  const thoai = page.getByTestId("hop-thoai-sao");
  await expect(thoai).toHaveAttribute("data-can", "dang_nhap");
  await expect(thoai).toContainText("Đăng nhập để nhận Sao");
  await expect(thoai.getByTestId("qua-dang-nhap")).toContainText("nhận ngay 10 Sao");
  await expect(page.getByTestId("sao-dang-nhap")).toHaveAttribute("href", /\/dang-nhap\?tiep=%2Fban-than/);
});

test("khách, thưởng đang tắt: không hiện hộp (không hứa Sao chưa phát)", async ({ page }) => {
  await page.route("**/api/sao/nhiem-vu", (r) => r.fulfill({ json: { tai_khoan: true, dang_nhap: false, bat: false, muc: MUC, chao_mung: 10 } }));
  await moBanThan(page);
  await page.waitForTimeout(500);
  await expect(page.getByTestId("nhiem-vu-sao")).toHaveCount(0);
});

test("đã đăng nhập: tiến độ, nhận Sao nhiệm vụ đã xong, đo credit_earned", async ({ page }) => {
  let daNhan = false;
  await page.route("**/api/sao/nhiem-vu", (r) => {
    if (r.request().method() === "POST") {
      expect(r.request().postDataJSON()).toEqual({ ma: "luu_ho_so" });
      daNhan = true;
      return r.fulfill({ json: { ket_qua: "da_thuong", sao: 5 } });
    }
    return r.fulfill({ json: { tai_khoan: true, dang_nhap: true, san_sang: true, bat: true,
      nhiem_vu: [nv("luu_ho_so", 1, 1, daNhan), nv("hoi_3_cau", 3, 2), nv("moi_1_ban", 1, 0)] } });
  });
  await moBanThan(page);
  const hop = page.getByTestId("nhiem-vu-sao");
  await expect(hop).toHaveAttribute("data-trang-thai", "tai_khoan");
  await expect(page.getByTestId("nhiem-vu-tien-do-hoi_3_cau")).toHaveText("2/3");
  await expect(page.getByTestId("nhiem-vu-nhan-hoi_3_cau")).toHaveCount(0);
  await expect(hop.getByRole("link", { name: "Đặt câu hỏi" })).toHaveAttribute("href", "/than-so#hoi");
  await page.getByTestId("nhiem-vu-nhan-luu_ho_so").click();
  await expect(hop.getByRole("status")).toContainText("+5 Sao");
  await expect(page.getByTestId("nhiem-vu-da-nhan-luu_ho_so")).toHaveText("Đã nhận +5");
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  expect(sk).toContainEqual(expect.objectContaining({ su_kien: "credit_earned", kind: "nhiem_vu", nhiem_vu: "luu_ho_so", so_sao: 5 }));
});

test("đã đăng nhập, thưởng tắt: vẫn hiện tiến độ, không có nút nhận; chưa chạy 0014 → ẩn", async ({ page }) => {
  let sanSang = true;
  await page.route("**/api/sao/nhiem-vu", (r) => r.fulfill({ json: sanSang
    ? { tai_khoan: true, dang_nhap: true, san_sang: true, bat: false, nhiem_vu: [nv("luu_ho_so", 1, 1), nv("hoi_3_cau", 3, 0), nv("moi_1_ban", 1, 0)] }
    : { tai_khoan: true, dang_nhap: true, san_sang: false } }));
  await moBanThan(page);
  const hop = page.getByTestId("nhiem-vu-sao");
  await expect(hop).toContainText("Thưởng Sao cho nhiệm vụ sẽ mở sau");
  await expect(page.getByTestId("nhiem-vu-tien-do-luu_ho_so")).toHaveText("1/1");
  await expect(page.getByRole("button", { name: /Nhận \d+ Sao/ })).toHaveCount(0);
  sanSang = false;
  await page.reload();
  await expect(page.getByTestId("lien-ket-hom-nay")).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(500);
  await expect(hop).toHaveCount(0);
});
