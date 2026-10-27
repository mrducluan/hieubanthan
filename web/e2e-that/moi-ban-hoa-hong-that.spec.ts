// SAO-V (0025) chuỗi THẬT: A lưu hồ sơ → lấy link mời → B mở link, đăng nhập OTP, lưu hồ sơ → thưởng hai phía nhận
// NGAY khi lưu (không cần mở lại ví) → bật hoa hồng → B nạp qua cổng giả → ví A có dòng "Hoa hồng" (Sao tặng, đúng %).
// Không giả lập route nào ở máy chủ web. Sổ Sao kiểm trực tiếp trong DB bằng khoá service_role. Dựng: e2e-that/stack/len.sh.
import fs from "node:fs";
import { test, expect, type Browser, type Page } from "@playwright/test";
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
const LUC = Date.now();
const EMAIL_A = `moi${LUC}@thu.local`;
const EMAIL_B = `ban${LUC}@thu.local`;

async function uid(email: string): Promise<string> {
  const r = await fetch(`${SB}/auth/v1/admin/users?per_page=1000`, { headers: H });
  const d = (await r.json()) as { users: { id: string; email: string }[] };
  return d.users.find((u) => u.email === email)!.id;
}
async function soCai(email: string) {
  const r = await fetch(`${SB}/rest/v1/so_cai_sao?user_id=eq.${await uid(email)}&select=so_luong,loai,het_han`, { headers: H });
  return (await r.json()) as { so_luong: number; loai: string; het_han: string | null }[];
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
async function trangMoi(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript((h) => {
    localStorage.setItem("hbt.dong-y-cookie.v1", "tu_choi");
    if (!localStorage.getItem("hbt.hoso.v1")) localStorage.setItem("hbt.hoso.v1", h);
  }, JSON.stringify(HO_SO_MAU));
  return page;
}
/** /tai-khoan: tích đồng ý → "Lưu vào tài khoản" → trả câu báo (gồm Sao vừa nhận ngay sau khi lưu). */
async function luuHoSo(page: Page) {
  await page.getByLabel(/Tôi đồng ý lưu/).check();
  await page.getByRole("button", { name: "Lưu vào tài khoản" }).click();
  const bao = page.getByRole("status").filter({ hasText: "Đã lưu hồ sơ vào tài khoản." });
  await expect(bao).toBeVisible({ timeout: 30_000 });
  return bao;
}

test.afterAll(async () => {
  await fetch(`${SB}/rest/v1/cau_hinh?khoa=eq.sao.hoa_hong.bat`, { method: "DELETE", headers: H });   // về mặc định (tắt)
});

test("A mời B → B lưu hồ sơ → thưởng hai phía ngay · bật hoa hồng → B nạp (cổng giả) → ví A có Hoa hồng", async ({ browser }) => {
  // 1. A: đăng nhập, lưu hồ sơ → +Sao chào mừng ngay trong câu báo; ví hiện link mời cá nhân.
  const a = await trangMoi(browser);
  await a.goto("/dang-nhap?tiep=/tai-khoan");
  await dangNhap(a, EMAIL_A);
  await expect(a).toHaveURL(/\/tai-khoan/);
  await expect(await luuHoSo(a)).toContainText("Sao chào mừng");
  const link = a.getByLabel("Link mời cá nhân");
  await expect(link).toHaveValue(/\?gt=[a-z0-9]{8}$/, { timeout: 30_000 });
  const ma = /gt=([a-z0-9]{8})/.exec(await link.inputValue())![1]!;
  await expect(a.getByTestId("dieu-kien-moi")).not.toContainText("7 ngày");

  // 2. B: mở link mời (mã nhớ trên máy) → đăng nhập → lưu hồ sơ → nhận chào mừng + thưởng lời mời trong cùng lượt.
  // B vào từ THẺ HUY HIỆU A chia sẻ (link mang ?gt=): trang nhận nói rõ B nhận gì nếu lưu hồ sơ (chào mừng + lời mời).
  const b = await trangMoi(browser);
  await b.goto(`/the/huy-hieu/moi-1?tu=hh.0123456789&gt=${ma}`);
  await expect(b.getByRole("heading", { level: 1 })).toHaveText("Rủ được 1 người bạn");
  const qua = b.getByTestId("qua-nguoi-nhan");
  await expect(qua).toHaveAttribute("data-co-ma", "1", { timeout: 30_000 });
  await expect(qua).toContainText("Bạn được mời: lưu hồ sơ vào tài khoản là nhận 30 Sao (10 chào mừng + 20 lời mời)");
  await expect(b.getByTestId("the-huy-hieu-moi")).toHaveAttribute("href", "/hop-doi?tu=hh.0123456789");
  await expect.poll(() => b.evaluate(() => JSON.parse(localStorage.getItem("hbt.gt") ?? "null")?.ma)).toBe(ma);
  await b.goto("/dang-nhap?tiep=/tai-khoan");
  await dangNhap(b, EMAIL_B);
  await expect(b).toHaveURL(/\/tai-khoan/);
  const baoB = await luuHoSo(b);
  await expect(baoB).toContainText("Sao chào mừng");
  await expect(baoB).toContainText("Sao vì nhận lời mời của bạn bè");
  expect(await b.evaluate(() => localStorage.getItem("hbt.gt"))).toBeNull();   // đã dùng mã → quên
  const loaiB = (await soCai(EMAIL_B)).map((x) => x.loai).sort();
  expect(loaiB).toEqual(["chao_mung", "duoc_moi"]);
  expect((await soCai(EMAIL_A)).filter((x) => x.loai === "moi_ban")).toHaveLength(1);
  // A quay lại (phiên mới): "Sao vừa về" báo +20 Sao, ghi credit_earned{moi_ban} cho phễu thẻ; lần sau không báo lại.
  await a.evaluate(() => sessionStorage.clear());
  await a.goto("/ban-than");
  const ve = a.getByTestId("thuong-ve");
  await expect(ve).toContainText("+20 Sao — một người bạn vừa nhận lời mời của bạn.", { timeout: 30_000 });
  await expect(ve).not.toContainText(EMAIL_B);
  expect(await a.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []))
    .toContainEqual(expect.objectContaining({ su_kien: "credit_earned", kind: "moi_ban", so_sao: 20 }));
  await expect(ve.getByTestId("thuong-ve-moi")).toHaveAttribute("href", "/hop-doi");
  await ve.getByRole("button", { name: "Đóng" }).click();
  await expect(ve).toHaveCount(0);
  await a.evaluate(() => sessionStorage.clear());
  await a.reload();
  await expect(a.getByTestId("huy-hieu")).toBeVisible({ timeout: 30_000 });
  await a.waitForTimeout(2_000);
  await expect(a.getByTestId("thuong-ve")).toHaveCount(0);
  // Vào lại ví không nhận lần hai.
  await b.reload();
  await expect(b.getByTestId("vi-sao")).toBeVisible({ timeout: 30_000 });
  await b.waitForTimeout(1_500);
  expect((await soCai(EMAIL_B)).length).toBe(2);

  // 3. Bật hoa hồng (mặc định 20% · 1 đơn đầu · 12 tháng) → B nạp gói mặc định qua cổng giả.
  await datCauHinh("sao.hoa_hong.bat", true);
  await b.goto("/nap-sao");
  await expect(b.getByTestId("minh-bach-loi-moi")).toBeVisible();
  await b.getByTestId("nut-nap").click();
  await b.getByRole("button", { name: "Giả lập đã trả" }).click();
  await expect(b.getByTestId("ket-qua-nap")).toHaveAttribute("data-trang-thai", "da_tra", { timeout: 30_000 });
  const don = (await (await fetch(`${SB}/rest/v1/don_nap?user_id=eq.${await uid(EMAIL_B)}&trang_thai=eq.da_tra&select=sao`, { headers: H })).json()) as { sao: number }[];
  expect(don).toHaveLength(1);
  const hh = Math.floor((don[0]!.sao * 20) / 100);
  const dongHh = (await soCai(EMAIL_A)).filter((x) => x.loai === "hoa_hong");
  expect(dongHh).toHaveLength(1);
  expect(dongHh[0]!.so_luong).toBe(hh);
  expect(dongHh[0]!.het_han).not.toBeNull();   // trả bằng Sao TẶNG (có hạn)
  // B vẫn nhận đủ số Sao của gói — hoa hồng không trừ gì của người nạp.
  expect((await soCai(EMAIL_B)).filter((x) => x.loai === "mua").map((x) => x.so_luong)).toEqual([don[0]!.sao]);

  // 4. Ví A: khối Hoa hồng (ngày + số Sao + trạng thái, không lộ ai nạp) + Sao tặng / Sao mua tách riêng.
  await a.goto("/tai-khoan");
  const khoi = a.getByTestId("hoa-hong");
  await expect(khoi).toBeVisible({ timeout: 30_000 });
  await expect(a.getByTestId("hoa-hong-tong")).toHaveText(`${hh} Sao`);
  await expect(a.getByTestId("dieu-kien-hoa-hong")).toContainText("Bạn nhận 20% số Sao lần nạp đầu của mỗi bạn bè bạn mời, trong 12 tháng");
  await expect(a.getByTestId("hoa-hong-lan")).toContainText("đã cộng");
  await expect(khoi).not.toContainText(EMAIL_B);
  await expect(a.getByTestId("sao-mua")).toHaveText("0");
  await expect(a.getByTestId("sao-tang")).toHaveText(String(10 + 20 + hh));
  await a.getByText("Lịch sử Sao").click();
  await expect(a.getByTestId("vi-sao")).toContainText("Hoa hồng");
});
