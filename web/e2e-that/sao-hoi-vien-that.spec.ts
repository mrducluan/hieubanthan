// SAO-HV (0028) chuỗi THẬT (không page.route): đăng nhập OTP → bật công tắc hội viên → mua hội viên qua cổng giả → kích
// hoạt 365 ngày → mở Luận giải toàn bộ (đang thu Sao) KHÔNG trừ Sao (phi.ly_do = hoi_vien, không chương khoá) → thẻ hội
// viên ở /tai-khoan cấp Sao tháng +15 (lô 'hoi_vien', hết hạn cuối tháng) → gọi lại không cộng dồn. Sổ Sao / hội viên
// kiểm trực tiếp trong DB bằng khoá service_role. Dựng: e2e-that/stack/len.sh (luan_giai.thu_sao đã bật ở đó).
import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { HO_SO_MAU } from "../e2e/_hoso";

const SB = "http://localhost:54321";
const MAIL = `${process.env.SB_THU ?? "/tmp/sb-thu"}/mail`;
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const SERVICE = (() => {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ role: "service_role", iss: "supabase", iat: 1700000000, exp: 2000000000 });
  return `${h}.${p}.${createHmac("sha256", "e2e-that-jwt-chi-dung-cho-kiem-thu-0123456789").update(`${h}.${p}`).digest("base64url")}`;
})();
const H = { apikey: SERVICE, authorization: `Bearer ${SERVICE}` };
const EMAIL = `hoivien${Date.now()}@thu.local`;

async function uid(email: string): Promise<string> {
  const r = await fetch(`${SB}/auth/v1/admin/users?per_page=1000`, { headers: H });
  const d = (await r.json()) as { users: { id: string; email: string }[] };
  return d.users.find((u) => u.email === email)!.id;
}
async function soCai(email: string) {
  const r = await fetch(`${SB}/rest/v1/so_cai_sao?user_id=eq.${await uid(email)}&select=so_luong,loai,het_han,khoa`, { headers: H });
  return (await r.json()) as { so_luong: number; loai: string; het_han: string | null; khoa: string }[];
}
async function datCauHinh(khoa: string, giaTri: unknown) {
  const r = await fetch(`${SB}/rest/v1/cau_hinh`, {
    method: "POST", headers: { ...H, "content-type": "application/json", prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ khoa, gia_tri: giaTri }),
  });
  expect(r.status).toBeLessThan(300);
}
async function dangNhap(page: Page, email: string) {
  await expect(page).toHaveURL(/\/dang-nhap/);
  await page.locator("#email").fill(email);
  const tep = `${MAIL}/${email}.eml`;
  fs.rmSync(tep, { force: true });
  await page.getByRole("button", { name: "Gửi mã đăng nhập" }).click();
  await expect.poll(() => fs.existsSync(tep), { timeout: 20_000 }).toBe(true);
  const ma = fs.readFileSync(tep, "utf8").replace(/=\r?\n/g, "").match(/\b(\d{6})\b/)![1]!;
  await page.getByLabel("Mã xác nhận").fill(ma);
  await page.getByRole("button", { name: "Xác nhận" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((h) => {
    localStorage.setItem("hbt.dong-y-cookie.v1", "tu_choi");
    if (!localStorage.getItem("hbt.hoso.v1")) localStorage.setItem("hbt.hoso.v1", h);
  }, JSON.stringify(HO_SO_MAU));
});
test.afterAll(async () => {
  for (const k of ["sao.hoi_vien.bat", "sao.hoi_vien.cg.bat", "sao.chuyen_gia.bat"]) {
    await fetch(`${SB}/rest/v1/cau_hinh?khoa=eq.${k}`, { method: "DELETE", headers: H });   // về mặc định (tắt)
  }
});

test("mua hội viên (cổng giả) → báo cáo mở trọn không trừ Sao → Sao tháng +15 một lần", async ({ page }) => {
  // 0. Công tắc tắt: trang có, nút ẩn.
  await page.goto("/hoi-vien");
  await expect(page.getByTestId("hoi-vien-chua-mo")).toBeVisible();
  await datCauHinh("sao.hoi_vien.bat", true);

  // 1. Chưa đăng nhập → đăng nhập trước, quay về /hoi-vien. Trang máy chủ đọc công tắc qua cache 60 giây (lib/cau-hinh)
  //    → tải lại tới khi nút hiện.
  await expect.poll(async () => {
    await page.goto("/hoi-vien");
    return page.getByTestId("mua-hoi-vien").waitFor({ timeout: 5_000 }).then(() => true, () => false);
  }, { timeout: 90_000, intervals: [3_000] }).toBe(true);
  await expect(page.getByTestId("gia-hoi-vien")).toHaveText("399.000 ₫");
  await expect(page.getByTestId("hang-cg-sap-mo")).toBeVisible();   // hạng Chuyên gia chưa bật → không bày giá
  await page.getByTestId("hoi-vien-dang-nhap").click();
  await dangNhap(page, EMAIL);
  await expect(page).toHaveURL(/\/hoi-vien/);

  // 2. Mua qua cổng giả → trang kết quả báo kích hoạt (không phải "nhận 0 Sao") → về thẻ hội viên.
  await page.getByTestId("nut-mua-hoi-vien").click();
  await page.getByRole("button", { name: "Giả lập đã trả" }).click();
  await expect(page.getByTestId("ket-qua-nap")).toHaveAttribute("data-trang-thai", "da_tra", { timeout: 30_000 });
  await expect(page.getByTestId("hoi-vien-kich-hoat")).toBeVisible();
  const id = await uid(EMAIL);
  const hv = (await (await fetch(`${SB}/rest/v1/hoi_vien?user_id=eq.${id}&select=tu_ngay,den_ngay,trang_thai,cau_hoi_da_dung`, { headers: H })).json()) as
    { tu_ngay: string; den_ngay: string; trang_thai: string; cau_hoi_da_dung: number }[];
  expect(hv).toHaveLength(1);
  expect(hv[0]!.trang_thai).toBe("hieu_luc");
  expect((Date.parse(hv[0]!.den_ngay) - Date.parse(hv[0]!.tu_ngay)) / 86_400_000).toBe(365);
  const don = (await (await fetch(`${SB}/rest/v1/don_nap?user_id=eq.${id}&select=loai,sao,so_tien,trang_thai,goi`, { headers: H })).json()) as
    { loai: string; sao: number; so_tien: number; trang_thai: string; goi: string | null }[];
  expect(don).toEqual([{ loai: "hoi_vien", sao: 0, so_tien: 399000, trang_thai: "da_tra", goi: null }]);
  expect((await soCai(EMAIL)).filter((x) => x.loai === "mua")).toHaveLength(0);   // không cộng Sao mua

  // 3. Luận giải toàn bộ đang thu Sao: hội viên nhận trọn báo cáo ngay ở lượt đầu, không trừ Sao, không chương khoá.
  const phanHoi = page.waitForResponse((r) => r.url().endsWith("/api/tuvi/luan-giai") && r.status() === 200);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  const bc = (await (await phanHoi).json()) as { so_khoa?: number; phi: { sao: number; ly_do: string }; chuong: { khoa?: boolean; doan?: string[] }[] };
  expect(bc.phi).toEqual({ sao: 0, ly_do: "hoi_vien" });
  expect(bc.so_khoa ?? 0).toBe(0);
  expect(bc.chuong.length).toBeGreaterThan(2);
  for (const c of bc.chuong) { expect(c.khoa).toBeFalsy(); expect(c.doan?.length ?? 0).toBeGreaterThan(0); }
  await expect(page.getByTestId("lg-chuong-khoa")).toHaveCount(0);
  await expect(page.getByTestId("lg-mo-khoa")).toHaveCount(0);
  expect((await soCai(EMAIL)).filter((x) => x.loai === "dung")).toHaveLength(0);   // không bút toán trừ
  const mo = (await (await fetch(`${SB}/rest/v1/hoi_vien_mo?user_id=eq.${id}&select=khoa`, { headers: H })).json()) as { khoa: string }[];
  expect(mo.length).toBe(1);   // chỉ khoá báo cáo, không nội dung

  // 4. Thẻ hội viên ở /tai-khoan: cấp Sao tháng +15 (lô 'hoi_vien', hết hạn cuối tháng); tải lại không cộng dồn.
  await page.goto("/tai-khoan");
  const the = page.getByTestId("the-hoi-vien");
  await expect(the).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("hoi-vien-con-ngay")).toHaveText("365");
  await expect(page.getByTestId("hoi-vien-cau-hoi")).toHaveText("1");
  await expect(page.getByTestId("hoi-vien-hang")).toHaveText("Hội viên năm");
  // Trang kết quả tự đưa về /tai-khoan sau 2,5 giây → Sao tháng có thể đã được cấp ở lượt đó; hai câu đều đúng, DB kiểm 1 lô.
  await expect(page.getByTestId("hoi-vien-sao-thang")).toContainText(/Vừa cộng 15 Sao\.|Đã cộng vào ví\./);
  await expect(page.getByTestId("hoi-vien-nhac-gia-han")).toHaveCount(0);
  await expect(the).not.toContainText(/chỉ còn|đếm ngược|ưu đãi/i);
  const lo = (await soCai(EMAIL)).filter((x) => x.loai === "hoi_vien");
  expect(lo).toHaveLength(1);
  expect(lo[0]!.so_luong).toBe(15);
  expect(lo[0]!.het_han).not.toBeNull();
  expect(lo[0]!.khoa).toMatch(new RegExp(`^hoi_vien:${id}:\\d{4}-\\d{2}$`));
  await page.reload();
  await expect(page.getByTestId("hoi-vien-sao-thang")).toContainText("Đã cộng vào ví.", { timeout: 30_000 });
  expect((await soCai(EMAIL)).filter((x) => x.loai === "hoi_vien")).toHaveLength(1);

  // 5. Đang là hội viên còn > 30 ngày: /hoi-vien không bán chồng; /nap-sao không mời hội viên nữa.
  await page.goto("/hoi-vien");
  await expect(page.getByTestId("hoi-vien-dang-la")).toContainText("Bạn đang là hội viên tới", { timeout: 30_000 });
  await expect(page.getByTestId("nut-mua-hoi-vien")).toHaveCount(0);

  // 6. Mở hạng Chuyên gia → người hạng thường thấy "Nâng hạng" với giá đã trừ phần còn lại (SQL tính) → trả (cổng giả) →
  //    dòng thường cũ 'nang_hang', dòng Chuyên gia mới 365 ngày, 6 câu, 24 giờ; thẻ tài khoản đổi hạng.
  await datCauHinh("sao.chuyen_gia.bat", true);
  await datCauHinh("sao.hoi_vien.cg.bat", true);
  await expect.poll(async () => {
    await page.goto("/hoi-vien");
    return page.getByTestId("nut-nang-hang").waitFor({ timeout: 5_000 }).then(() => true, () => false);
  }, { timeout: 90_000, intervals: [3_000] }).toBe(true);
  await expect(page.getByTestId("gia-hoi-vien-cg")).toHaveText("1.990.000 ₫");
  await expect(page.getByTestId("nang-hang-giai-thich")).toContainText("đã trừ vào giá");
  const nutNang = await page.getByTestId("nut-nang-hang").innerText();
  const giaNang = Number(nutNang.replace(/[^\d]/g, ""));
  expect(giaNang).toBeGreaterThan(1000);
  expect(giaNang).toBeLessThan(1990000);   // đã trừ phần còn lại của gói thường
  await page.getByTestId("nut-nang-hang").click();
  await page.getByRole("button", { name: "Giả lập đã trả" }).click();
  await expect(page.getByTestId("ket-qua-nap")).toHaveAttribute("data-trang-thai", "da_tra", { timeout: 30_000 });
  const hv2 = (await (await fetch(`${SB}/rest/v1/hoi_vien?user_id=eq.${id}&select=hang,trang_thai,cau_hoi_nam,han_gio,den_ngay,tu_ngay&order=id`, { headers: H })).json()) as
    { hang: string; trang_thai: string; cau_hoi_nam: number; han_gio: number | null; den_ngay: string; tu_ngay: string }[];
  expect(hv2.map((x) => `${x.hang}:${x.trang_thai}`)).toEqual(["thuong:nang_hang", "chuyen_gia:hieu_luc"]);
  expect([hv2[1]!.cau_hoi_nam, hv2[1]!.han_gio]).toEqual([6, 24]);
  expect((Date.parse(hv2[1]!.den_ngay) - Date.parse(hv2[1]!.tu_ngay)) / 86_400_000).toBe(365);
  const don2 = (await (await fetch(`${SB}/rest/v1/don_nap?user_id=eq.${id}&loai=eq.hoi_vien&nang_hang=eq.true&select=so_tien,hang,trang_thai`, { headers: H })).json()) as
    { so_tien: number; hang: string; trang_thai: string }[];
  expect(don2).toEqual([{ so_tien: giaNang, hang: "chuyen_gia", trang_thai: "da_tra" }]);   // số trên nút = số tính tiền
  await page.goto("/tai-khoan");
  await expect(page.getByTestId("hoi-vien-hang")).toHaveText("Hội viên Chuyên gia", { timeout: 30_000 });
  await expect(page.getByTestId("hoi-vien-nang-hang")).toHaveCount(0);
});
