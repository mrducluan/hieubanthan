// Thanh toán nạp Sao (TT-1/TT-2, PAY2S-1 2026-11-12: Pay2S thay payOS) + ủng hộ. Chuỗi ký Pay2S so NGUYÊN VĂN với mẫu
// trong tài liệu docs.pay2s.vn (others/signature, api/instant-payment-notification); HMAC tính lại bằng node:crypto độc
// lập. Luồng có Supabase thật thử bằng supabase/kiem_thu (thu_cong_pay2s_0037.sql).
import { napHoSo } from "./_hoso";
import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { chuoiIpn, chuoiTaoDon, docHook, docTaiKhoan, dungTokenHook, kiemIpn, kyIpn, kyTaoDon, ngayVn, timGiaoDich } from "../lib/thanh-toan/pay2s";
import { maDonQuayVe, maDonTrongNoiDung, maDonTuPay2s, maPay2s } from "../lib/thanh-toan/ma-don";
import { dsViUngHo, nganHangUngHo } from "../lib/ung-ho";

const C = { partnerCode: "PAY2SE2E", accessKey: "e2e-access", secretKey: "e2e-pay2s-secret-0000" };
const hmac = (k: string, s: string) => createHmac("sha256", k).update(s, "utf8").digest("hex");
const IPN = {
  partnerCode: "PAY2SE2E", orderId: "HBT0100001", requestId: "998877", amount: 99000, orderInfo: "HBT0100001",
  orderType: "pay2s", transId: 2588659987, resultCode: 0, message: "Giao dịch thành công.", payType: "qr",
  responseTime: 1762900000000, extraData: "",
};

test("Pay2S: mã đơn ↔ orderId, nội dung CK 10–32 ký tự chữ + số; trang quay về đọc được mã khi Pay2S nối ?…", () => {
  expect(maPay2s(100001)).toBe("HBT0100001");
  expect(maPay2s(123456789)).toBe("HBT123456789");
  for (const n of [100001, 9999999, 123456789012]) expect(maPay2s(n)).toMatch(/^[A-Z0-9]{10,32}$/);
  expect(maDonTuPay2s("HBT0100001")).toBe(100001);
  for (const x of ["HBT01", "XHBT0100001", "HBT0100001 ", 100001, null]) expect(maDonTuPay2s(x)).toBeNull();
  expect(maDonQuayVe("100001", null)).toBe("100001");
  expect(maDonQuayVe("100001?partnerCode=PAY2SE2E", "HBT0100001")).toBe("100001");
  expect(maDonQuayVe(null, "HBT0100002")).toBe("100002");
  expect(maDonQuayVe("abc", "khac")).toBe("");
  expect(docTaiKhoan("0123456789|acb; 99999999|MBB\nsai|; <x>|VCB")).toEqual([
    { account_number: "0123456789", bank_id: "ACB" }, { account_number: "99999999", bank_id: "MBB" }]);
  expect(docTaiKhoan(undefined)).toEqual([]);
});

test("Pay2S: chuỗi ký tạo đơn đúng thứ tự tài liệu (bankAccounts=Array cố định), HMAC-SHA256 hex", () => {
  const r = { requestId: "HBT0100001-1", amount: 99000, orderId: "HBT0100001", orderInfo: "HBT0100001",
    redirectUrl: "https://hieuban.com/nap-sao/ket-qua?ma=100001", ipnUrl: "https://hieuban.com/api/thanh-toan/webhook/pay2s" };
  const raw = "accessKey=e2e-access&amount=99000&bankAccounts=Array&ipnUrl=https://hieuban.com/api/thanh-toan/webhook/pay2s" +
    "&orderId=HBT0100001&orderInfo=HBT0100001&partnerCode=PAY2SE2E&redirectUrl=https://hieuban.com/nap-sao/ket-qua?ma=100001" +
    "&requestId=HBT0100001-1&requestType=pay2s";
  expect(chuoiTaoDon(r, C)).toBe(raw);
  expect(kyTaoDon(r, C)).toBe(hmac(C.secretKey, raw));
  // Vector HMAC công khai trong tài liệu Pay2S (kiểm thư viện).
  expect(hmac("key", "The quick brown fox jumps over the lazy dog")).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
});

test("Pay2S IPN: đúng m2signature + đúng partnerCode thì nhận; sửa số tiền / sai khoá / sai đối tác / orderId lạ thì từ chối", () => {
  const raw = "accessKey=e2e-access&amount=99000&extraData=&message=Giao dịch thành công.&orderId=HBT0100001" +
    "&orderInfo=HBT0100001&orderType=pay2s&partnerCode=PAY2SE2E&payType=qr&requestId=998877&responseTime=1762900000000" +
    "&resultCode=0&transId=2588659987";
  expect(chuoiIpn(IPN, C.accessKey)).toBe(raw);
  const sig = hmac(C.secretKey, raw);
  expect(kyIpn(IPN, C)).toBe(sig);
  expect(kiemIpn({ ...IPN, m2signature: sig }, C)).toMatchObject({ maDon: 100001, amount: 99000, resultCode: 0, transId: "2588659987" });
  expect(kiemIpn({ ...IPN, m2signature: sig.toUpperCase() }, C)?.maDon).toBe(100001);
  // extraData thiếu = rỗng (vẫn có "&extraData=" trong chuỗi ký).
  const { extraData: _bo, ...khongExtra } = IPN;
  expect(kiemIpn({ ...khongExtra, m2signature: sig }, C)?.maDon).toBe(100001);
  expect(kiemIpn({ ...IPN, amount: 1000, m2signature: sig }, C)).toBeNull();
  expect(kiemIpn({ ...IPN, m2signature: sig }, { ...C, secretKey: "khac" })).toBeNull();
  expect(kiemIpn({ ...IPN, m2signature: sig }, { ...C, partnerCode: "KHAC" })).toBeNull();
  const la = { ...IPN, orderId: "DH123456789" };
  expect(kiemIpn({ ...la, m2signature: kyIpn(la, C) }, C)).toBeNull();
  expect(kiemIpn({ ...IPN }, C)).toBeNull();
  expect(kiemIpn({ ...IPN, m2signature: "deadbeef" }, C)).toBeNull();
  expect(kiemIpn([IPN], C)).toBeNull();
  expect(kiemIpn(null, C)).toBeNull();
  const loi = { ...IPN, resultCode: 2, message: "Giao dịch đã hủy" };
  expect(kiemIpn({ ...loi, m2signature: kyIpn(loi, C) }, C)?.resultCode).toBe(2);
});

test("Pay2S đối soát: chỉ khoản VÀO mang đúng mã đơn (bỏ ký tự ngân hàng chèn), không khớp nhầm mã dài hơn; ngày theo giờ VN", () => {
  const ds = [
    { id: "1", amount: 99000, description: "MBVCB.123 HBT 0100001 . CT tu 0123", type: "OUT" },
    { id: "2", amount: 29000, description: "HBT01000012 GD 9", type: "IN" },
    { id: "3", amount: 99000, description: "QR - hbt0100001 GD 750915-080324", type: "IN" },
  ];
  expect(timGiaoDich(ds, 100001)?.id).toBe("3");
  expect(timGiaoDich(ds.slice(0, 2), 100001)).toBeNull();
  expect(timGiaoDich(ds, 1000001)).toBeNull();
  expect(timGiaoDich([{ id: "4", amount: 1, description: "HBT1000001", type: "IN" }], 1000001)?.id).toBe("4");
  expect(ngayVn(new Date("2026-11-11T17:30:00Z"))).toBe("12/11/2026");
});

test("Pay2S webhook ngân hàng: đọc mã đơn trong nội dung CK mọi kiểu ngân hàng ghi; token Hook so đúng; thân 1 giao dịch hay mảng đều đọc", () => {
  expect(maDonTrongNoiDung("MBVCB.12345.HBT0100001.CT tu 0123 NGUYEN VAN A")).toBe(100001);
  expect(maDonTrongNoiDung("QR - hbt0100001 GD 750915-080324 02:23:07")).toBe(100001);
  expect(maDonTrongNoiDung("HBT 0100001 123456")).toBe(100001);
  expect(maDonTrongNoiDung("IBFT-HBT0100001-FT26316")).toBe(100001);
  expect(maDonTrongNoiDung("HBT01000012 GD 9")).toBe(1000012);
  for (const x of ["HBT01 GD", "DOIXU119052 GD 6276", "ung ho HBT", "", null]) expect(maDonTrongNoiDung(x)).toBeNull();
  const tk = "e2e-pay2s-hook-token-0000";
  expect(dungTokenHook(`Bearer ${tk}`, tk)).toBe(true);
  expect(dungTokenHook(`Bearer ${tk}x`, tk)).toBe(false);
  expect(dungTokenHook(null, tk)).toBe(false);
  expect(dungTokenHook("Bearer ngan", "ngan")).toBe(false); // token < 16 ký tự → khoá
  const g = { id: 32756283, gateway: "ACB", transactionNumber: "24936", content: "HBT0100001 GD 6276", transferType: "IN", transferAmount: 99000 };
  expect(docHook({ transactions: [g, { id: "x" }] })).toEqual([{ id: "32756283", amount: 99000, noiDung: "HBT0100001 GD 6276", vao: true }]);
  expect(docHook(g)).toHaveLength(1);
  expect(docHook({ ...g, transferType: "OUT" })?.[0]?.vao).toBe(false);
  expect(docHook([g])).toBeNull();
  expect(docHook(null)).toBeNull();
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

test("route IPN Pay2S: sai chữ ký 401; JSON hỏng 400; giao dịch không thành công 200 không cộng; đúng chữ ký nhưng máy chủ chưa có service role → 503 (Pay2S gửi lại sau)", async ({ request }) => {
  const sai = await request.post("/api/thanh-toan/webhook/pay2s", { data: { ...IPN, m2signature: "0".repeat(64) } });
  expect(sai.status()).toBe(401);
  expect(await sai.json()).toMatchObject({ success: false });
  const hong = await request.post("/api/thanh-toan/webhook/pay2s", { data: Buffer.from("{khong-phai-json"), headers: { "content-type": "application/json" } });
  expect(hong.status()).toBe(400);
  const loi = { ...IPN, resultCode: 2, message: "Giao dịch đã hủy" };
  const boQua = await request.post("/api/thanh-toan/webhook/pay2s", { data: { ...loi, m2signature: kyIpn(loi, C) } });
  expect(boQua.status()).toBe(200);
  expect(await boQua.json()).toMatchObject({ success: true, bo_qua: "khong_thanh_cong" });
  const dung = await request.post("/api/thanh-toan/webhook/pay2s", { data: { ...IPN, m2signature: kyIpn(IPN, C) } });
  expect(dung.status()).toBe(503);
  // Webhook giao dịch ngân hàng: thiếu / sai token 401; khoản không mang mã đơn 200 bỏ qua; có mã đơn nhưng máy chủ
  // chưa có service role → 503 (Pay2S gửi lại).
  const NH = "/api/thanh-toan/webhook/pay2s-ngan-hang", auth = { authorization: "Bearer e2e-pay2s-hook-token-0000" };
  const gd = (content: string) => ({ transactions: [{ id: 1, content, transferType: "IN", transferAmount: 99000 }] });
  expect((await request.post(NH, { data: gd("HBT0100001") })).status()).toBe(401);
  expect((await request.post(NH, { data: gd("HBT0100001"), headers: { authorization: "Bearer sai" } })).status()).toBe(401);
  const khac = await request.post(NH, { data: gd("DOIXU119052 GD 6276"), headers: auth });
  expect(khac.status()).toBe(200);
  expect(await khac.json()).toMatchObject({ success: true, bo_qua: 1 });
  expect((await request.post(NH, { data: gd("MBVCB.1.HBT0100001.CT"), headers: auth })).status()).toBe(503);
  expect((await request.get("/api/thanh-toan/doi-soat")).status()).toBe(401);
  expect((await request.post("/api/thanh-toan/tao-don", { data: { goi: "thu" } })).status()).toBe(503);
  expect((await request.post("/api/thanh-toan/gia", { data: { ma_don: 1 } })).status()).toBe(404);
});

test("/nap-sao: 3 gói, chưa bật tài khoản thì nói rõ chưa cần nạp + khối gói làm mờ, không chọn được; /ung-ho + chân trang hiện ví", async ({ page }) => {
  await page.goto("/nap-sao");
  await expect(page.locator("h1")).toHaveText("Nạp Sao");
  // Rà UX mục 8: không chỗ nào thu Sao (e2e không Supabase → công tắc tắt) → câu rõ ở đầu trang, trước bảng giá.
  await expect(page.getByTestId("nap-mien-phi")).toHaveText("Hiện mọi luận giải đang miễn phí — bạn chưa cần nạp.");
  await expect(page.locator('[data-testid^="goi-"]')).toHaveCount(3);
  await expect(page.getByTestId("goi-pho_bien")).toContainText("110 Sao");
  await expect(page.getByTestId("goi-pho_bien")).toContainText("99.000 ₫");
  await expect(page.getByTestId("nap-chua-mo")).toContainText("Nạp Sao chưa mở");
  // Cổng chưa mở → khối gói bị khoá: không chọn sẵn, bấm không chọn được, không nút nạp (không ngõ cụt có dấu ✓).
  await expect(page.getByTestId("khoi-goi")).toHaveAttribute("disabled", "");
  await expect(page.locator('input[value="gia_dinh"]')).toBeDisabled();
  for (const ma of ["thu", "pho_bien", "gia_dinh"]) await expect(page.locator(`input[value="${ma}"]`)).not.toBeChecked();
  await page.getByTestId("goi-gia_dinh").click({ force: true });
  await expect(page.locator('input[value="gia_dinh"]')).not.toBeChecked();
  await expect(page.getByTestId("nut-nap")).toHaveCount(0);
  // Đo tỉ lệ rời /nap-sao theo trạng thái: checkout_viewed mang mien_phi (1 = chưa chỗ nào thu Sao).
  await expect.poll(async () => (await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string }[] }).__hbt_su_kien ?? []))
    .find((e) => e.su_kien === "checkout_viewed")).toMatchObject({ kind: "chua_mo", mien_phi: 1 });
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
