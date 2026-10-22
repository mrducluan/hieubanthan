// Thanh toán nạp Sao (TT-1/TT-2) + ủng hộ. Chữ ký payOS đối chiếu VECTOR sinh bằng SDK chính thức @payos/node 1.0.10
// (không cài SDK vào dự án — chỉ dùng một lần để sinh số đúng). Luồng có Supabase thật thử bằng supabase/kiem_thu.
import { napHoSo } from "./_hoso";
import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { chuoiDuLieu, kiemWebhook, kyDuLieu, kyYeuCau, moTaChuyenKhoan } from "../lib/thanh-toan/payos";
import { dsViUngHo, nganHangUngHo } from "../lib/ung-ho";

const K = "khoa-thu-nghiem-e2e";
const DL = {
  orderCode: 100001, amount: 99000, description: "HBT100001", accountNumber: "123", reference: "FT1",
  transactionDateTime: "2026-10-12 10:00:00", currency: "VND", paymentLinkId: "abc", code: "00", desc: "success",
  counterAccountBankId: null, virtualAccountName: "",
};

test("chữ ký payOS khớp SDK chính thức (tạo link, webhook, dữ liệu có mảng)", () => {
  expect(kyYeuCau({ orderCode: 100001, amount: 99000, description: "HBT100001",
    returnUrl: "https://hieuban.com/nap-sao/ket-qua?ma=100001", cancelUrl: "https://hieuban.com/nap-sao/ket-qua?ma=100001&huy=1" }, K))
    .toBe("fc1ee7c9be4fdcabf2e3f2fa40cdbd900867b969abf71fcf77e2908a2dcbbfe8");
  expect(kyDuLieu(DL, K)).toBe("5be7db06583570f19df67ec4faf9e60f05ee740777ada57cf823d373c4727b07");
  expect(kyDuLieu({ id: "x", orderCode: 5, amount: 1, transactions: [{ reference: "r", amount: 1, accountNumber: "9" }], status: "PAID", canceledAt: null }, K))
    .toBe("c1164c76f629ce6eb623da14d063a26e09263ae5dadb7e28e09dd475d611f9ba");
  expect(chuoiDuLieu({ b: 1, a: null })).toBe("a=&b=1");
  expect(moTaChuyenKhoan(100001)).toBe("HBT100001");
});

test("webhook payOS: đúng chữ ký thì nhận, sửa số tiền / sai khoá / thiếu chữ ký thì từ chối", () => {
  const sig = kyDuLieu(DL, K);
  expect(kiemWebhook({ code: "00", data: DL, signature: sig }, K)?.orderCode).toBe(100001);
  expect(kiemWebhook({ data: { ...DL, amount: 1000 }, signature: sig }, K)).toBeNull();
  expect(kiemWebhook({ data: DL, signature: sig }, "khoa-khac")).toBeNull();
  expect(kiemWebhook({ data: DL }, K)).toBeNull();
  expect(kiemWebhook({ data: [DL], signature: sig }, K)).toBeNull();
  expect(kiemWebhook(null, K)).toBeNull();
});

test("ủng hộ: đọc ví + tài khoản từ env, bỏ dòng sai", () => {
  expect(dsViUngHo("USDT (TRC20)|TXyzAbc1234567890abcdefXYZ;Bitcoin|bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh\nSai|<script>;|x")).toEqual([
    { mang: "USDT (TRC20)", diaChi: "TXyzAbc1234567890abcdefXYZ" },
    { mang: "Bitcoin", diaChi: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  ]);
  expect(dsViUngHo(undefined)).toEqual([]);
  expect(nganHangUngHo("MB Bank|0123 456 789|NGUYEN VAN A")).toEqual({ nganHang: "MB Bank", soTk: "0123456789", chuTk: "NGUYEN VAN A" });
  expect(nganHangUngHo("MB|abc|X")).toBeNull();
});

test("route webhook: sai chữ ký 401; đúng chữ ký nhưng máy chủ chưa có service role → 503 (payOS gửi lại sau)", async ({ request }) => {
  const khoa = "e2e-payos-checksum-0000";
  const sai = await request.post("/api/thanh-toan/webhook/payos", { data: { code: "00", data: DL, signature: "deadbeef" } });
  expect(sai.status()).toBe(401);
  const dung = await request.post("/api/thanh-toan/webhook/payos", {
    data: { code: "00", data: DL, signature: createHmac("sha256", khoa).update(chuoiDuLieu(DL)).digest("hex") },
  });
  expect(dung.status()).toBe(503);
  expect((await request.get("/api/thanh-toan/doi-soat")).status()).toBe(401);
  expect((await request.post("/api/thanh-toan/tao-don", { data: { goi: "thu" } })).status()).toBe(503);
  expect((await request.post("/api/thanh-toan/gia", { data: { ma_don: 1 } })).status()).toBe(404);
});

test("/nap-sao: 3 gói, chưa bật tài khoản thì báo sắp mở; /ung-ho + chân trang hiện ví", async ({ page }) => {
  await page.goto("/nap-sao");
  await expect(page.locator("h1")).toHaveText("Nạp Sao");
  await expect(page.locator('[data-testid^="goi-"]')).toHaveCount(3);
  await expect(page.getByTestId("goi-pho_bien")).toContainText("110 Sao");
  await expect(page.getByTestId("goi-pho_bien")).toContainText("99.000 ₫");
  await expect(page.getByTestId("nap-chua-mo")).toBeVisible();
  await page.getByTestId("goi-gia_dinh").click();
  await expect(page.locator('input[value="gia_dinh"]')).toBeChecked();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  await page.goto("/ung-ho");
  await expect(page.locator("h1")).toHaveText("Ủng hộ đội ngũ phát triển");
  await expect(page.getByTestId("ung-ho-vi")).toContainText("USDT (TRC20)");
  await expect(page.getByTestId("ung-ho-vi")).toContainText("TE2eTestWalletAddress000000000000");
  await expect(page.getByTestId("chan-trang-ung-ho")).toBeVisible();
  // CTA-1: thẻ ủng hộ nằm trong khối "Đọc tiếp" cuối phần xem (hiện khi đã có kết quả — cần hồ sơ trên máy).
  await napHoSo(page);
  await page.goto("/hom-nay");
  await page.getByTestId("cuoi-phan-xem").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("ung-ho-nho")).toBeVisible();
});
