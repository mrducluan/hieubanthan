// QT-0 chuỗi THẬT (không page.route): đúng các bước chủ dự án làm lần đầu ở docs/VIEC-CUA-ANH.md mục Q —
// đăng nhập OTP → chưa có vai trò thì báo "không có quyền" → cấp chủ sở hữu (SQL) → tạo mã QR + nhập mã 6 số (TOTP
// tính trong test như ứng dụng xác thực) → bảng điều khiển (thẻ "Migration Supabase" đọc đúng) → mọi trang con mở được
// (không lỗi máy chủ) → đăng nhập lại chỉ cần mã 6 số → bật công tắc
// Hội viên năm ở Cài đặt → /hoi-vien bày nút mua; DB chưa chạy 0028 (E2E_DB_THIEU) → công tắc khoá, API trả 409.
import fs from "node:fs";
import { createHmac } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";

const SB = "http://localhost:54321";
const MAIL = `${process.env.SB_THU ?? "/tmp/sb-thu"}/mail`;
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const SERVICE = (() => {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ role: "service_role", iss: "supabase", iat: 1700000000, exp: 2000000000 });
  return `${h}.${p}.${createHmac("sha256", "e2e-that-jwt-chi-dung-cho-kiem-thu-0123456789").update(`${h}.${p}`).digest("base64url")}`;
})();
const H = { apikey: SERVICE, authorization: `Bearer ${SERVICE}` };
const EMAIL = `quantri${Date.now()}@thu.local`;

/** Mã 6 số TOTP (RFC 6238, SHA-1, 30 giây) từ khoá base32 — như Google Authenticator. */
function totp(base32: string, luc = Date.now()): string {
  const bang = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bit = "";
  for (const k of base32.replace(/=+$/, "").toUpperCase()) bit += bang.indexOf(k).toString(2).padStart(5, "0");
  const khoa = Buffer.from(bit.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const dem = Buffer.alloc(8);
  dem.writeBigUInt64BE(BigInt(Math.floor(luc / 1000 / 30)));
  const h = createHmac("sha1", khoa).update(dem).digest();
  const o = h[h.length - 1]! & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}
/** Tránh nhập mã sát lúc đổi (máy chủ vẫn nhận mã kề bên, nhưng không để test chập chờn). */
async function maOn(base32: string) {
  const con = 30 - (Math.floor(Date.now() / 1000) % 30);
  if (con < 4) await new Promise((r) => setTimeout(r, (con + 1) * 1000));
  return totp(base32);
}

async function uid(email: string): Promise<string> {
  const r = await fetch(`${SB}/auth/v1/admin/users?per_page=1000`, { headers: H });
  const d = (await r.json()) as { users: { id: string; email: string }[] };
  return d.users.find((u) => u.email === email)!.id;
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

const TRANG_CON = ["cai-dat", "chuyen-gia", "doanh-thu", "hoc", "hoi-dap", "nguoi-dung", "tang-truong", "tri-thuc"];

test.afterAll(async () => {
  await fetch(`${SB}/rest/v1/cau_hinh?khoa=eq.sao.hoi_vien.bat`, { method: "DELETE", headers: H });   // về mặc định (tắt)
});

test("lần đầu vào quản trị: đăng nhập → cấp chủ sở hữu → QR + mã 6 số → mọi trang mở được → bật Hội viên năm", async ({ page }) => {
  const loiTrang: string[] = [];
  page.on("pageerror", (e) => loiTrang.push(e.message));

  // 1. Chưa đăng nhập → trang đăng nhập, xong quay về /quan-tri. Chưa có vai trò → báo không có quyền (kèm email).
  await page.goto("/quan-tri");
  await dangNhap(page, EMAIL);
  await expect(page.getByTestId("qt-bao-cong")).toHaveAttribute("data-trang", "khong_quyen", { timeout: 30_000 });
  await expect(page.getByTestId("qt-bao-cong")).toContainText(EMAIL);

  // 2. Cấp chủ sở hữu như câu SQL ở mục Q3.
  const r = await fetch(`${SB}/rest/v1/vai_tro_quan_tri`, {
    method: "POST", headers: { ...H, "content-type": "application/json" },
    body: JSON.stringify({ user_id: await uid(EMAIL), vai_tro: "chu_so_huu" }),
  });
  expect(r.status).toBe(201);

  // 3. Có vai trò, chưa MFA → bước xác thực: tạo QR, nhập mã từ khoá (ứng dụng xác thực tính cùng mã này).
  await page.goto("/quan-tri");
  await expect(page).toHaveURL(/\/quan-tri\/xac-thuc/);
  await page.getByRole("button", { name: "Tạo mã QR" }).click();
  await expect(page.getByRole("img", { name: "Mã QR đăng ký xác thực hai lớp" })).toBeVisible();
  const khoa = (await page.locator("p:has-text('Nhập khoá') .font-mono").innerText()).trim();
  expect(khoa).toMatch(/^[A-Z2-7]{16,}$/);
  await page.getByLabel("Mã 6 số").fill(await maOn(khoa));
  await page.getByRole("button", { name: "Xác nhận" }).click();
  await expect(page.getByTestId("qt-tong-quan")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(EMAIL)).toBeVisible();
  // Thẻ "Migration Supabase" đọc được tình trạng (stack chạy đủ migration → không thiếu; DB đã gỡ bớt → liệt kê đúng số).
  // Một dấu hiệu đọc sai = khoá nhầm công tắc của chủ dự án → so đúng danh sách (E2E_DB_THIEU khi chạy trên DB gỡ bớt).
  const thieu = (await page.getByTestId("qt-migration").getAttribute("data-thieu")) ?? "";
  expect(thieu).toBe(process.env.E2E_DB_THIEU ?? "");

  // 4. Mọi trang con: không lỗi máy chủ, không rơi về cổng (đã qua MFA ở cả máy chủ web lẫn DB).
  for (const t of TRANG_CON) {
    const res = await page.goto(`/quan-tri/${t}`);
    expect(res?.status(), t).toBeLessThan(500);
    await expect(page.getByTestId("qt-bao-cong"), t).toHaveCount(0);
    await expect(page.getByText("Application error"), t).toHaveCount(0);
  }

  // 5. Đăng xuất rồi vào lại: đã có TOTP → chỉ ô mã 6 số, không tạo QR mới.
  await page.context().clearCookies();
  await page.goto("/quan-tri");
  await dangNhap(page, EMAIL);
  await expect(page).toHaveURL(/\/quan-tri\/xac-thuc/, { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Tạo mã QR" })).toHaveCount(0);
  // Mã vừa dùng ở bước 3 có thể còn trong cùng cửa sổ 30 giây → chờ sang mã mới (máy chủ từ chối dùng lại mã).
  const truoc = totp(khoa);
  await expect.poll(() => totp(khoa), { timeout: 35_000, intervals: [1_000] }).not.toBe(truoc);
  await page.getByLabel("Mã 6 số").fill(await maOn(khoa));
  await page.getByRole("button", { name: "Xác nhận" }).click();
  await expect(page.getByTestId("qt-tong-quan")).toBeVisible({ timeout: 30_000 });

  // 6. Cài đặt: bật Hội viên năm → lưu → DB có dòng, /hoi-vien bày nút mua (cài đặt có hiệu lực ≤ 1 phút).
  //    Supabase chưa chạy 0028 → công tắc khoá + nhãn "Cần migration 0028", API cũng từ chối bật.
  await page.goto("/quan-tri/cai-dat");
  const o = page.locator("#cd-sao\\.hoi_vien\\.bat");
  await expect(o).not.toBeChecked();
  if (thieu.includes("0028")) {
    await expect(page.getByTestId("qt-thieu-migration")).toContainText("0028");
    await expect(page.locator("div.border-b", { has: o }).getByTestId("can-migration")).toHaveText("Cần migration 0028");
    await expect(o).toBeDisabled();
    const bat = await page.evaluate(async () => {
      const r = await fetch("/api/quan-tri/cai-dat", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ khoa: "sao.hoi_vien.bat", gia_tri: true }) });
      return { status: r.status, body: await r.json() as { error?: string } };
    });
    expect(bat.status).toBe(409);
    expect(bat.body.error).toContain("0028");
  } else {
    await expect(page.getByTestId("can-migration")).toHaveCount(0);
    await o.check();
    const muc = page.locator("div.border-b", { has: o });
    await muc.getByRole("button", { name: "Lưu" }).click();
    await expect(muc.getByRole("status")).toHaveText("Đã lưu.");
    const dong = (await (await fetch(`${SB}/rest/v1/cau_hinh?khoa=eq.sao.hoi_vien.bat&select=gia_tri`, { headers: H })).json()) as { gia_tri: unknown }[];
    expect(dong[0]?.gia_tri).toBe(true);
    await expect.poll(async () => {
      await page.goto("/hoi-vien");
      return page.getByTestId("mua-hoi-vien").waitFor({ timeout: 5_000 }).then(() => true, () => false);
    }, { timeout: 90_000, intervals: [3_000] }).toBe(true);
    // Trả về mặc định bằng nút (xoá luôn bộ nhớ đệm cài đặt 60 giây) — spec sau (sao-hoi-vien) bắt đầu với công tắc tắt.
    await page.goto("/quan-tri/cai-dat");
    await muc.getByRole("button", { name: "Về mặc định" }).click();
    await expect(muc.getByRole("status")).toHaveText("Đã trả về mặc định.");
  }

  expect(loiTrang).toEqual([]);
});
