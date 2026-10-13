// SAO-2 chuỗi THẬT (không page.route): trình duyệt → web (route handler thật) → engine thật → Supabase thu nhỏ
// (GoTrue đăng nhập OTP qua thư, PostgREST + RLS + hàm SQL dung_sao / dung_luot_hoi / nhan_chao_mung, cổng nạp giả).
// Ví và sổ Sao kiểm trực tiếp trong DB bằng khoá service_role. Dựng: e2e-that/stack/len.sh.
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
const EMAIL = `thu${Date.now()}@thu.local`;

async function uid(email: string): Promise<string> {
  const r = await fetch(`${SB}/auth/v1/admin/users?per_page=1000`, { headers: H });
  const d = (await r.json()) as { users: { id: string; email: string }[] };
  return d.users.find((u) => u.email === email)!.id;
}
async function so(email: string) {
  const id = await uid(email);
  const r = await fetch(`${SB}/rest/v1/so_cai_sao?user_id=eq.${id}&select=so_luong,loai`, { headers: H });
  const ds = (await r.json()) as { so_luong: number; loai: string }[];
  return { du: ds.reduce((t, x) => t + x.so_luong, 0), dem: (loai: string) => ds.filter((x) => x.loai === loai).length };
}
async function coHoSo(email: string): Promise<boolean> {
  const r = await fetch(`${SB}/rest/v1/ho_so?user_id=eq.${await uid(email)}&select=user_id`, { headers: H });
  return ((await r.json()) as unknown[]).length > 0;
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
async function hoi(page: Page, cau: string) {
  const truoc = await page.getByTestId("cau-tra-loi").count();
  await page.getByRole("textbox", { name: /Câu hỏi/ }).first().fill(cau);
  await page.getByRole("button", { name: "Gửi câu hỏi" }).first().click();
  return truoc;
}
const hop = (page: Page) => page.getByTestId("hop-thoai-sao");

test.beforeAll(async () => {
  // Lượt hỏi đếm theo ngày + khoá khách (HMAC IP) — xoá để chạy lại trên máy không vướng lượt cũ.
  await fetch(`${SB}/rest/v1/luot_hoi?khoa=not.is.null`, { method: "DELETE", headers: H });
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript((h) => { if (!localStorage.getItem("hbt.hoso.v1")) localStorage.setItem("hbt.hoso.v1", h); }, JSON.stringify(HO_SO_MAU));
});

test("báo cáo: khách đọc chương 1 → mở khoá → đăng nhập OTP → nhận quà lưu hồ sơ → tự mở, trừ 1 lần · nạp giả → quay về tự mở", async ({ page }) => {
  // 1. Bản xem trước: chương khoá KHÔNG có đoạn văn trong phản hồi mạng.
  const xemTruoc = page.waitForResponse((r) => r.url().endsWith("/api/tuvi/luan-giai") && r.status() === 200);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  const bc = (await (await xemTruoc).json()) as { chuong: { khoa?: boolean; doan?: string[]; van_ai?: string; moi_xem?: { cau_hoi: string } }[] };
  const khoa = bc.chuong.filter((c) => c.khoa);
  expect(khoa.length).toBeGreaterThan(2);
  for (const c of khoa) { expect(c.doan).toBeUndefined(); expect(c.van_ai).toBeUndefined(); expect(c.moi_xem?.cau_hoi).toBeTruthy(); }
  expect(bc.chuong[0]!.doan!.length).toBeGreaterThan(0);
  await expect(page.getByTestId("lg-chuong-khoa")).toHaveCount(khoa.length);

  // 2. Chưa đăng nhập → hộp đăng nhập; sang /dang-nhap thì hộp đóng (không đè form).
  await page.getByTestId("lg-mo-khoa").click();
  await expect(hop(page)).toHaveAttribute("data-can", "dang_nhap");
  await page.getByTestId("sao-dang-nhap").click();
  await expect(hop(page)).toHaveCount(0);
  await dangNhap(page, EMAIL);
  await expect(page).toHaveURL(/\/tu-vi/);

  // 3. Quay về tự mở → ví 0 → mời lưu hồ sơ nhận quà (chưa bấm = chưa lưu) → bấm → mở toàn bộ.
  await expect(hop(page)).toHaveAttribute("data-can", "nap", { timeout: 90_000 });
  await expect(page.getByTestId("nhan-chao-mung")).toContainText("10 Sao");
  expect(await coHoSo(EMAIL)).toBe(false);
  await page.getByTestId("nhan-chao-mung-nut").click();
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("lg-phan-khoa")).toHaveCount(0);
  expect(await coHoSo(EMAIL)).toBe(true);
  let v = await so(EMAIL);
  expect([v.du, v.dem("chao_mung"), v.dem("dung")]).toEqual([0, 1, 1]);

  // 4. Xem lại trong ngày → đầy đủ ngay, không trừ lần hai.
  await page.reload();
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("lg-phan-khoa")).toHaveCount(0);
  expect((await so(EMAIL)).dem("dung")).toBe(1);

  // 5. Bát tự: ví 0, đã nhận quà → nạp nhanh (cổng giả) → /nap-sao/ket-qua → tự về /bat-tu → tự mở, trừ 10.
  await page.goto("/bat-tu");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await page.getByTestId("lg-mo-khoa").click();
  await expect(page.getByTestId("nap-nhanh")).toBeVisible();
  await expect(page.getByTestId("nhan-chao-mung")).toHaveCount(0);
  await expect(hop(page).getByRole("link", { name: "mời bạn bè" })).toBeVisible();
  await page.getByTestId("nap-nhanh-nut").click();
  await page.getByRole("button", { name: "Giả lập đã trả" }).click();
  await expect(page.getByTestId("ket-qua-nap")).toHaveAttribute("data-trang-thai", "da_tra");
  await expect(page).toHaveURL(/\/bat-tu/, { timeout: 30_000 });
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("lg-phan-khoa")).toHaveCount(0);
  v = await so(EMAIL);
  expect([v.du, v.dem("mua"), v.dem("dung")]).toEqual([20, 1, 2]);

  // 6. Hỏi đáp có tài khoản: 2 câu miễn phí → câu 3 hỏi đồng ý → trừ 1 Sao SAU khi trả lời.
  await page.goto("/tu-vi");
  for (const c of ["Cung Mệnh của tôi nói gì?", "Cung Quan Lộc thế nào?"]) {
    const n = await hoi(page, c);
    await expect(page.getByTestId("cau-tra-loi")).toHaveCount(n + 1, { timeout: 60_000 });
  }
  const n3 = await hoi(page, "Cung Tài Bạch thế nào?");
  await expect(hop(page)).toHaveAttribute("data-can", "xac_nhan_sao");
  await page.getByTestId("sao-dong-y").click();
  await expect(page.getByTestId("cau-tra-loi")).toHaveCount(n3 + 1, { timeout: 60_000 });
  await expect.poll(async () => (await so(EMAIL)).du).toBe(19);

  // 7. Câu khủng hoảng khi đã hết lượt → luôn trả lời, không hỏi Sao, không trừ.
  const n4 = await hoi(page, "Tôi muốn tự tử");
  await expect(page.getByTestId("cau-tra-loi")).toHaveCount(n4 + 1, { timeout: 60_000 });
  await expect(hop(page)).toHaveCount(0);
  expect((await so(EMAIL)).du).toBe(19);
});

test("khách: hết lượt hỏi → mời đăng nhập; 'Để sau' ở báo cáo → tải lại không tự bật hộp", async ({ page }) => {
  await fetch(`${SB}/rest/v1/luot_hoi?khoa=like.k:*`, { method: "DELETE", headers: H });
  await page.goto("/tu-vi");
  for (const c of ["Cung Mệnh của tôi?", "Cung Phu Thê?"]) {
    const n = await hoi(page, c);
    await expect(page.getByTestId("cau-tra-loi")).toHaveCount(n + 1, { timeout: 60_000 });
  }
  await hoi(page, "Cung Tử Tức?");
  await expect(hop(page)).toHaveAttribute("data-can", "dang_nhap");
  await page.keyboard.press("Escape");
  await expect(hop(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await page.getByTestId("lg-mo-khoa").click();
  await expect(hop(page)).toHaveAttribute("data-can", "dang_nhap");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).waitFor();
  await page.waitForTimeout(3_000);
  await expect(hop(page)).toHaveCount(0);
});
