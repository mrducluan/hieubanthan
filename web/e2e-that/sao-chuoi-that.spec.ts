// SAO-2 chuỗi THẬT (không page.route): trình duyệt → web (route handler thật) → engine thật → Supabase thu nhỏ
// (GoTrue đăng nhập OTP qua thư, PostgREST + RLS + hàm SQL dung_sao / dung_luot_hoi / nhan_chao_mung, cổng nạp giả).
// Ví và sổ Sao kiểm trực tiếp trong DB bằng khoá service_role. Dựng: e2e-that/stack/len.sh.
// SAO-3 (test cuối): nhiệm vụ kiếm Sao trên /ban-than — dùng lại tài khoản của test đầu (đã lưu hồ sơ, đã hỏi ≥ 3 câu).
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
  // Cửa Sao v2 — lối miễn phí ngay trong hộp: thẻ mời bạn (mã mời thật của tài khoản) + phép tính đủ giá 10 Sao.
  const moi = hop(page).getByTestId("the-moi-ban");
  await expect(moi).toContainText("+20 Sao / bạn");
  await expect(moi.getByTestId("moi-ban-ket-qua")).toHaveText("Mời 1 bạn là đủ mở báo cáo này.");
  await expect(moi.getByTestId("moi-ban-dieu-kien")).toContainText("đăng nhập và lưu hồ sơ");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await expect(moi.getByTestId("moi-ban-nut")).toBeEnabled({ timeout: 30_000 });
  await moi.getByTestId("moi-ban-nut").click();
  await expect(moi.getByTestId("moi-ban-nut")).toContainText("Đã chép lời mời");
  const chep = await page.evaluate(() => navigator.clipboard.readText());
  const maMoi = (await (await fetch(`${SB}/rest/v1/ma_gioi_thieu?user_id=eq.${await uid(EMAIL)}&select=ma`, { headers: H })).json()) as { ma: string }[];
  expect(chep).toMatch(/\/hop-doi\/[^?\s]+\?gt=/);              // link mời xem hợp đôi (mã HMAC, không ngày sinh)
  expect(maMoi).toHaveLength(1);
  expect(chep).toContain(`gt=${maMoi[0]!.ma}`);
  expect(chep).not.toMatch(/1990|17\/0?5/);                       // không lộ ngày sinh người mời
  await page.getByTestId("nap-nhanh-nut").click();
  await page.getByRole("button", { name: "Giả lập đã trả" }).click();
  await expect(page.getByTestId("ket-qua-nap")).toHaveAttribute("data-trang-thai", "da_tra");
  await expect(page).toHaveURL(/\/bat-tu/, { timeout: 30_000 });
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("lg-phan-khoa")).toHaveCount(0);
  v = await so(EMAIL);
  expect([v.du, v.dem("mua"), v.dem("dung")]).toEqual([20, 1, 2]);

  // 6. Hỏi đáp có tài khoản: 2 câu miễn phí → câu 3 hỏi đồng ý → trừ 3 Sao (giá câu vượt lượt, chủ dự án chốt 26/10) SAU khi trả lời.
  await page.goto("/tu-vi");
  for (const c of ["Cung Mệnh của tôi nói gì?", "Cung Quan Lộc thế nào?"]) {
    const n = await hoi(page, c);
    await expect(page.getByTestId("cau-tra-loi")).toHaveCount(n + 1, { timeout: 60_000 });
  }
  const n3 = await hoi(page, "Cung Tài Bạch thế nào?");
  await expect(hop(page)).toHaveAttribute("data-can", "xac_nhan_sao");
  await page.getByTestId("sao-dong-y").click();
  await expect(page.getByTestId("cau-tra-loi")).toHaveCount(n3 + 1, { timeout: 60_000 });
  await expect.poll(async () => (await so(EMAIL)).du).toBe(17);   // 20 − 3

  // 7. Câu khủng hoảng khi đã hết lượt → luôn trả lời, không hỏi Sao, không trừ.
  const n4 = await hoi(page, "Tôi muốn tự tử");
  await expect(page.getByTestId("cau-tra-loi")).toHaveCount(n4 + 1, { timeout: 60_000 });
  await expect(hop(page)).toHaveCount(0);
  expect((await so(EMAIL)).du).toBe(17);
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

test("SAO-3 nhiệm vụ: tiến độ thật (hồ sơ, câu hỏi đã đếm, lời mời) → nhận Sao một lần mỗi nhiệm vụ", async ({ page }) => {
  // Tài khoản của test đầu: đã lưu hồ sơ + đã hỏi 4 câu trả lời được (2 miễn phí, 1 trả Sao, 1 câu khủng hoảng).
  const id = await uid(EMAIL);
  await page.goto("/dang-nhap?tiep=/ban-than");
  await dangNhap(page, EMAIL);
  await expect(page).toHaveURL(/\/ban-than/);
  const hopNv = page.getByTestId("nhiem-vu-sao");
  await expect(hopNv).toHaveAttribute("data-trang-thai", "tai_khoan", { timeout: 60_000 });
  await expect(page.getByTestId("nhiem-vu-tien-do-luu_ho_so")).toHaveText("1/1");
  await expect(page.getByTestId("nhiem-vu-tien-do-hoi_3_cau")).toHaveText("3/3");
  await expect(page.getByTestId("nhiem-vu-tien-do-moi_1_ban")).toHaveText("0/1");
  await expect(page.getByTestId("nhiem-vu-nhan-moi_1_ban")).toHaveCount(0);
  const dem = (await (await fetch(`${SB}/rest/v1/dem_hoi_tai_khoan?user_id=eq.${id}&select=so`, { headers: H })).json()) as { so: number }[];
  expect(dem[0]!.so).toBeGreaterThanOrEqual(3);

  const truoc = (await so(EMAIL)).du;
  await page.getByTestId("nhiem-vu-nhan-luu_ho_so").click();
  await expect(page.getByTestId("nhiem-vu-da-nhan-luu_ho_so")).toHaveText("Đã nhận +5");
  await page.getByTestId("nhiem-vu-nhan-hoi_3_cau").click();
  await expect(page.getByTestId("nhiem-vu-da-nhan-hoi_3_cau")).toHaveText("Đã nhận +5");
  // Nhận lại qua API (bấm hai lần / gọi thẳng) → da_nhan, không cộng thêm.
  expect(await (await page.request.post("/api/sao/nhiem-vu", { data: { ma: "luu_ho_so" } })).json()).toMatchObject({ ket_qua: "da_nhan" });
  expect(await (await page.request.post("/api/sao/nhiem-vu", { data: { ma: "moi_1_ban" } })).json()).toMatchObject({ ket_qua: "chua_dat" });
  let v = await so(EMAIL);
  expect([v.du - truoc, v.dem("nhiem_vu")]).toEqual([10, 2]);

  // Bạn bè tạo tài khoản + nhận lời mời (dòng gioi_thieu do hàm SQL ghi — ở đây ghi thẳng bằng service role).
  const ban = (await (await fetch(`${SB}/auth/v1/admin/users`, { method: "POST", headers: { ...H, "content-type": "application/json" },
    body: JSON.stringify({ email: `ban${Date.now()}@thu.local`, email_confirm: true }) })).json()) as { id: string };
  const r = await fetch(`${SB}/rest/v1/gioi_thieu`, { method: "POST", headers: { ...H, "content-type": "application/json" },
    body: JSON.stringify({ duoc_moi_id: ban.id, nguoi_moi_id: id, ma: "thunv001", thuong_nguoi_moi: false }) });
  expect(r.status).toBe(201);
  await page.reload();
  await expect(page.getByTestId("nhiem-vu-tien-do-moi_1_ban")).toHaveText("1/1", { timeout: 60_000 });
  await page.getByTestId("nhiem-vu-nhan-moi_1_ban").click();
  await expect(hopNv.getByRole("status")).toContainText("+5 Sao");
  v = await so(EMAIL);
  expect([v.du - truoc, v.dem("nhiem_vu")]).toEqual([15, 3]);
  // Xong cả ba → tải lại thì hộp tự ẩn.
  await page.reload();
  await expect(page.getByTestId("lien-ket-hom-nay")).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1_500);
  await expect(hopNv).toHaveCount(0);
});

// KV-THANG (migration 0032) — chuỗi thật: đã đăng nhập mở Hôm nay → diem_danh(p_so) ghi nhat_ky_ghe (ngày + số ngày cá nhân);
// lật lá → cùng dòng có `la`; tháng trước gieo bằng service role (12 ngày, đủ 9 số) → tổng kết nguồn tai_khoan + huy hiệu
// du_9_nhip (tài khoản) ở Bản thân; lịch tháng này lấy từ máy chủ. Dùng lại tài khoản EMAIL của test đầu.
test("KV-THANG: nhật ký ghé theo tài khoản, tổng kết tháng trước từ máy chủ, huy hiệu Đủ 9 nhịp", async ({ page }) => {
  const id = await uid(EMAIL);
  const homNay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const [y, m] = homNay.split("-").map(Number) as [number, number];
  const truoc = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const ymd = (d: number) => `${truoc.y}-${String(truoc.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  await fetch(`${SB}/rest/v1/nhat_ky_ghe?user_id=eq.${id}`, { method: "DELETE", headers: H });
  const gieo = await fetch(`${SB}/rest/v1/nhat_ky_ghe`, { method: "POST", headers: { ...H, "content-type": "application/json" },
    body: JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ user_id: id, ngay: ymd(i + 1), so: (i % 9) + 1, la: i < 3 ? "gio" : null }))) });
  expect(gieo.status).toBe(201);

  await page.goto("/dang-nhap?tiep=/hom-nay");
  await dangNhap(page, EMAIL);
  await expect(page).toHaveURL(/\/hom-nay/);
  await expect(page.getByTestId("the-hom-nay")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("chuoi-ngay")).toHaveAttribute("data-nguon", "tai_khoan", { timeout: 60_000 });
  const so = Number(await page.getByTestId("so-ngay-ca-nhan").innerText());
  const dong = async () => (await (await fetch(`${SB}/rest/v1/nhat_ky_ghe?user_id=eq.${id}&ngay=eq.${homNay}&select=so,la`, { headers: H })).json()) as { so: number; la: string | null }[];
  await expect.poll(dong).toEqual([{ so, la: null }]);
  // Lịch tháng này: hôm nay (máy chủ); tổng kết tháng trước từ máy chủ: 12 ngày, 3 lá, đủ 9 nhịp.
  await expect(page.getByTestId("chuoi-lich").locator("[data-ghe]")).toHaveCount(1);
  const tk = page.getByTestId("tong-ket-thang");
  await expect(tk).toHaveAttribute("data-nguon", "tai_khoan", { timeout: 30_000 });
  await expect(tk).toHaveAttribute("data-so-ngay", "12");
  await expect(tk.getByTestId("tong-ket-cau")).toContainText("Bạn đã lật 3 lá bài đầu ngày.");
  await expect(tk.getByTestId("tong-ket-cau")).toContainText("đủ 9 nhịp");
  await expect(tk).not.toContainText("Đếm trên máy này");
  // Lật lá → cùng dòng có la (diem_danh gọi lại trong ngày không cộng chuỗi).
  await page.getByTestId("la-bai-up").click();
  await expect(page.getByTestId("la-bai-noi-dung")).toBeVisible();
  await expect.poll(async () => (await dong())[0]?.la, { timeout: 15_000 }).toMatch(/^(viec|cau_hoi|gio)$/);
  // Bản thân: huy hiệu tài khoản du_9_nhip đạt (bản máy ẩn), tổng kết đọc bảng (không ghi lượt ghé mới).
  await page.goto("/ban-than");
  const hh = page.getByTestId("huy-hieu");
  await expect(hh).toBeVisible({ timeout: 60_000 });
  await expect(hh.getByTestId("hh-du_9_nhip")).toHaveAttribute("data-dat", "1");
  await expect(hh.getByTestId("hh-du_9_nhip_may")).toHaveCount(0);
  await expect(page.getByTestId("tong-ket-thang")).toHaveAttribute("data-nguon", "tai_khoan", { timeout: 30_000 });
  const soDong = (await (await fetch(`${SB}/rest/v1/nhat_ky_ghe?user_id=eq.${id}&select=ngay`, { headers: H })).json()) as unknown[];
  expect(soDong).toHaveLength(13);
});
