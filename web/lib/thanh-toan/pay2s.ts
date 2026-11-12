// Pay2S Collection Link V1 (chuyển khoản VietQR vào tài khoản ngân hàng của anh) — gọi REST trực tiếp bằng fetch +
// node:crypto, KHÔNG dùng SDK (SDK của Pay2S chỉ phát hành dạng tệp tải, không qua npm). Thay payOS (TT-2) từ 2026-11-12.
// Đặc tả (docs.pay2s.vn, đọc 2026-11-12): api/collection-link, api/instant-payment-notification, others/signature,
// history-api/tai-lieu-ky-thuat.
//   • Tạo đơn: POST https://payment.pay2s.vn/v1/gateway/api/create, chữ ký = HMAC-SHA256(secretKey) hex của chuỗi CỐ ĐỊNH
//     "accessKey=…&amount=…&bankAccounts=Array&ipnUrl=…&orderId=…&orderInfo=…&partnerCode=…&redirectUrl=…&requestId=…
//     &requestType=pay2s" (bankAccounts=Array là chữ cố định của giao thức, không phải JSON danh sách).
//   • IPN: POST JSON tới ipnUrl, chữ ký m2signature trên chuỗi "accessKey=…&amount=…&extraData=…&message=…&orderId=…
//     &orderInfo=…&orderType=…&partnerCode=…&payType=…&requestId=…&responseTime=…&resultCode=…&transId=…" (accessKey lấy
//     ở máy chủ, còn lại lấy nguyên giá trị trong IPN). Phải trả 200 {"success": true} trong 30 giây, không thì Pay2S
//     gửi lại tối đa 5 lần.
//   • Pay2S KHÔNG có API tra trạng thái đơn → đối soát (khi IPN lỡ) bằng API lịch sử giao dịch ngân hàng: tìm khoản
//     tiền VÀO có nội dung chứa đúng mã chuyển khoản của đơn. Số tiền vẫn do SQL nap_sao_tu_cong so với đơn.
// Khoá chỉ ở env máy chủ (KHÔNG NEXT_PUBLIC_): PAY2S_PARTNER_CODE, PAY2S_ACCESS_KEY, PAY2S_SECRET_KEY,
// PAY2S_BANK_ACCOUNTS ("số tài khoản|mã ngân hàng", nhiều tài khoản ngăn bằng ";", tối đa 10).
// Tuỳ chọn: PAY2S_API_URL (mặc định https://payment.pay2s.vn), PAY2S_HISTORY_URL (mặc định
// https://api.pay2s.vn/userapi/transactions), PAY2S_TOKEN (token API lịch sử; mặc định Base64(secretKey) như tài liệu).
import { createHmac, timingSafeEqual } from "node:crypto";
import { maDonTuPay2s, maPay2s } from "@/lib/thanh-toan/ma-don";

export { maDonTuPay2s, maPay2s };

export type TaiKhoanNhan = { account_number: string; bank_id: string };
export type CauHinhPay2s = {
  partnerCode: string; accessKey: string; secretKey: string; taiKhoan: TaiKhoanNhan[];
  base: string; lichSuUrl: string; token: string;
};

/** "0123456789|ACB;99999999|MBB" → danh sách tài khoản nhận. Dòng sai bị bỏ; tối đa 10 (giới hạn của Pay2S). */
export function docTaiKhoan(s: string | undefined): TaiKhoanNhan[] {
  const ds: TaiKhoanNhan[] = [];
  for (const dong of (s ?? "").split(/[;\n]/)) {
    const [so = "", nh = ""] = dong.split("|").map((x) => x.trim());
    if (/^[0-9A-Za-z]{4,40}$/.test(so) && /^[0-9A-Za-z]{2,20}$/.test(nh)) ds.push({ account_number: so, bank_id: nh.toUpperCase() });
  }
  return ds.slice(0, 10);
}

export function cauHinhPay2s(): CauHinhPay2s | null {
  const partnerCode = process.env.PAY2S_PARTNER_CODE?.trim(), accessKey = process.env.PAY2S_ACCESS_KEY?.trim();
  const secretKey = process.env.PAY2S_SECRET_KEY?.trim();
  const taiKhoan = docTaiKhoan(process.env.PAY2S_BANK_ACCOUNTS);
  if (!partnerCode || !accessKey || !secretKey || !taiKhoan.length) return null;
  return {
    partnerCode, accessKey, secretKey, taiKhoan,
    base: (process.env.PAY2S_API_URL || "https://payment.pay2s.vn").replace(/\/$/, ""),
    lichSuUrl: process.env.PAY2S_HISTORY_URL || "https://api.pay2s.vn/userapi/transactions",
    token: process.env.PAY2S_TOKEN?.trim() || Buffer.from(secretKey, "utf8").toString("base64"),
  };
}

const hmac = (khoa: string, chuoi: string) => createHmac("sha256", khoa).update(chuoi, "utf8").digest("hex");

export type YeuCauTao = { requestId: string; amount: number; orderId: string; orderInfo: string; redirectUrl: string; ipnUrl: string };

/** Chuỗi ký tạo đơn V1 — đúng thứ tự tài liệu, không URL-encode, requestType cố định "pay2s". */
export const chuoiTaoDon = (r: YeuCauTao, c: Pick<CauHinhPay2s, "accessKey" | "partnerCode">) =>
  `accessKey=${c.accessKey}&amount=${r.amount}&bankAccounts=Array&ipnUrl=${r.ipnUrl}&orderId=${r.orderId}` +
  `&orderInfo=${r.orderInfo}&partnerCode=${c.partnerCode}&redirectUrl=${r.redirectUrl}&requestId=${r.requestId}&requestType=pay2s`;

export const kyTaoDon = (r: YeuCauTao, c: Pick<CauHinhPay2s, "accessKey" | "partnerCode" | "secretKey">) =>
  hmac(c.secretKey, chuoiTaoDon(r, c));

/** Tạo link thanh toán. Thành công → payUrl (trang Pay2S có mã VietQR). Lỗi / resultCode ≠ 0 → ném lỗi (không lộ khoá). */
export async function taoLink(c: CauHinhPay2s, r: Omit<YeuCauTao, "requestId"> & { tenDon: string }) {
  const yeuCau: YeuCauTao = { requestId: `${r.orderId}-${Date.now()}`, amount: r.amount, orderId: r.orderId,
    orderInfo: r.orderInfo, redirectUrl: r.redirectUrl, ipnUrl: r.ipnUrl };
  const res = await fetch(`${c.base}/v1/gateway/api/create`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      accessKey: c.accessKey, partnerCode: c.partnerCode, partnerName: r.tenDon.slice(0, 180),
      requestId: yeuCau.requestId, amount: yeuCau.amount, orderId: yeuCau.orderId, orderInfo: yeuCau.orderInfo,
      orderType: "pay2s", bankAccounts: c.taiKhoan, redirectUrl: yeuCau.redirectUrl, ipnUrl: yeuCau.ipnUrl,
      requestType: "pay2s", lang: "vi", signature: kyTaoDon(yeuCau, c),
    }),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const j = (await res.json().catch(() => null)) as { resultCode?: unknown; payUrl?: unknown; message?: unknown } | null;
  if (!j || Number(j.resultCode) !== 0 || typeof j.payUrl !== "string" || !/^https:\/\//.test(j.payUrl)) {
    throw new Error(`Pay2S: ${typeof j?.message === "string" ? j.message.slice(0, 120) : res.status}`);
  }
  return { payUrl: j.payUrl };
}

/** Các trường IPN nằm trong chuỗi ký (thứ tự tài liệu). accessKey không có trong IPN — lấy ở máy chủ. */
const TRUONG_IPN = ["amount", "extraData", "message", "orderId", "orderInfo", "orderType", "partnerCode", "payType",
  "requestId", "responseTime", "resultCode", "transId"] as const;

const giaTri = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export const chuoiIpn = (d: Record<string, unknown>, accessKey: string) =>
  `accessKey=${accessKey}&` + TRUONG_IPN.map((k) => `${k}=${giaTri(d[k])}`).join("&");

export const kyIpn = (d: Record<string, unknown>, c: Pick<CauHinhPay2s, "accessKey" | "secretKey">) =>
  hmac(c.secretKey, chuoiIpn(d, c.accessKey));

export type DuLieuIpn = {
  partnerCode: string; orderId: string; orderInfo: string; amount: number; resultCode: number; transId: string;
  maDon: number;
};

/** Kiểm IPN: đúng m2signature (so thời gian hằng) + đúng partnerCode của mình + orderId là đơn của web này.
 *  Sai bất cứ điều gì → null. Đúng chữ ký thì trả dữ liệu (kể cả resultCode ≠ 0 — nơi gọi tự bỏ qua). */
export function kiemIpn(body: unknown, c: Pick<CauHinhPay2s, "accessKey" | "secretKey" | "partnerCode">): DuLieuIpn | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const d = body as Record<string, unknown>;
  const sig = d.m2signature;
  if (typeof sig !== "string" || !/^[0-9a-f]{64}$/i.test(sig)) return null;
  const a = Buffer.from(kyIpn(d, c)), b = Buffer.from(sig.toLowerCase());
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (giaTri(d.partnerCode) !== c.partnerCode) return null;
  const maDon = maDonTuPay2s(d.orderId);
  const amount = Number(d.amount), resultCode = Number(d.resultCode);
  if (maDon === null || !Number.isSafeInteger(amount) || !Number.isFinite(resultCode)) return null;
  return { partnerCode: c.partnerCode, orderId: String(d.orderId), orderInfo: giaTri(d.orderInfo), amount, resultCode,
    transId: giaTri(d.transId).slice(0, 80), maDon };
}

// ---------- Đối soát qua API lịch sử giao dịch (Pay2S không có API tra đơn) ----------

export type GiaoDichNh = { id: string; amount: number; description: string; type: string };

/** dd/mm/yyyy theo giờ Việt Nam (API lịch sử lọc theo ngày). */
export const ngayVn = (d: Date) => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" })
    .formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")}`;
};

const chuanNoiDung = (s: string) => s.toUpperCase().replace(/[^0-9A-Z]/g, "");

/** Khoản tiền VÀO có nội dung chứa đúng mã của đơn (bỏ dấu cách / ký tự lạ ngân hàng chèn vào). */
export function timGiaoDich(ds: GiaoDichNh[], maDon: number): GiaoDichNh | null {
  const ma = maPay2s(maDon);
  // Mã đơn dài hơn (vd HBT01000012) không được khớp nhầm với HBT0100001: sau mã phải là hết chuỗi hoặc không phải chữ số.
  const re = new RegExp(`${ma}(?![0-9])`);
  return ds.find((g) => g.type === "IN" && re.test(chuanNoiDung(g.description))) ?? null;
}

let boNho: { khoa: string; luc: number; ds: GiaoDichNh[] } | null = null;
const GIU_MS = 20_000; // người mua đang chờ hỏi 3 giây/lần → gom lại, API lịch sử giới hạn 60 lượt/phút

/** Giao dịch ngân hàng từ ngày `tu` tới hôm nay, mọi tài khoản nhận. Lỗi mạng / token sai → ném lỗi. */
export async function lichSuGiaoDich(c: CauHinhPay2s, tu: Date, den = new Date()): Promise<GiaoDichNh[]> {
  const begin = ngayVn(tu), end = ngayVn(den);
  const khoa = `${begin}|${end}`;
  if (boNho && boNho.khoa === khoa && Date.now() - boNho.luc < GIU_MS) return boNho.ds;
  const ds: GiaoDichNh[] = [];
  for (const tk of c.taiKhoan) {
    const r = await fetch(c.lichSuUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "pay2s-token": c.token },
      body: JSON.stringify({ bankAccounts: tk.account_number, begin, end }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const j = (await r.json().catch(() => null)) as { status?: unknown; transactions?: unknown } | null;
    if (!j || j.status !== true || !Array.isArray(j.transactions)) throw new Error(`Pay2S lịch sử: ${r.status}`);
    for (const g of j.transactions as Record<string, unknown>[]) {
      const amount = Number(g.amount);
      if (!Number.isSafeInteger(amount)) continue;
      ds.push({ id: giaTri(g.id ?? g.transaction_id).slice(0, 60), amount, description: giaTri(g.description), type: giaTri(g.type) });
    }
  }
  boNho = { khoa, luc: Date.now(), ds };
  return ds;
}
