// payOS (VietQR chuyển khoản, Casso) — gọi REST trực tiếp bằng fetch + node:crypto, KHÔNG dùng SDK (không thêm
// dependency). Cách ký sao y SDK chính thức @payos/node 1.0.10:
//   • tạo link: HMAC-SHA256(checksumKey, "amount=…&cancelUrl=…&description=…&orderCode=…&returnUrl=…") dạng hex
//   • dữ liệu trả về + webhook: sắp khoá theo ABC, nối "k=v&…" (null/undefined → rỗng, mảng → JSON các phần tử đã
//     sắp khoá), HMAC-SHA256 hex — so khớp thời gian hằng.
// Khoá chỉ ở env máy chủ: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY (KHÔNG NEXT_PUBLIC_).
import { createHmac, timingSafeEqual } from "node:crypto";

export type CauHinhPayos = { clientId: string; apiKey: string; checksumKey: string; base: string };

export function cauHinhPayos(): CauHinhPayos | null {
  const clientId = process.env.PAYOS_CLIENT_ID, apiKey = process.env.PAYOS_API_KEY, checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!clientId || !apiKey || !checksumKey) return null;
  return { clientId, apiKey, checksumKey, base: (process.env.PAYOS_API_URL || "https://api-merchant.payos.vn").replace(/\/$/, "") };
}

const hmac = (khoa: string, chuoi: string) => createHmac("sha256", khoa).update(chuoi).digest("hex");

const sapKhoa = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));

/** Chuỗi ký cho dữ liệu payOS trả về / webhook (giống convertObjToQueryStr của SDK). */
export function chuoiDuLieu(o: Record<string, unknown>): string {
  const s = sapKhoa(o);
  return Object.keys(s).filter((k) => s[k] !== undefined).map((k) => {
    let v: unknown = s[k];
    if (Array.isArray(v)) v = JSON.stringify(v.map((x) => (x && typeof x === "object" ? sapKhoa(x as Record<string, unknown>) : x)));
    if (v === null || v === undefined || v === "undefined" || v === "null") v = "";
    return `${k}=${String(v)}`;
  }).join("&");
}

export type YeuCauLink = { orderCode: number; amount: number; description: string; returnUrl: string; cancelUrl: string };

export const kyYeuCau = (r: YeuCauLink, khoa: string) =>
  hmac(khoa, `amount=${r.amount}&cancelUrl=${r.cancelUrl}&description=${r.description}&orderCode=${r.orderCode}&returnUrl=${r.returnUrl}`);

export const kyDuLieu = (o: Record<string, unknown>, khoa: string) => hmac(khoa, chuoiDuLieu(o));

function khop(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export type DuLieuWebhook = {
  orderCode: number; amount: number; description: string; reference: string; code: string; desc?: string;
  paymentLinkId?: string; transactionDateTime?: string; [k: string]: unknown;
};

/** Webhook payOS: { code, desc, success, data, signature }. Sai/thiếu chữ ký → null. */
export function kiemWebhook(body: unknown, khoa: string): DuLieuWebhook | null {
  if (!body || typeof body !== "object") return null;
  const { data, signature } = body as { data?: unknown; signature?: unknown };
  if (!data || typeof data !== "object" || Array.isArray(data) || typeof signature !== "string") return null;
  return khop(kyDuLieu(data as Record<string, unknown>, khoa), signature) ? (data as DuLieuWebhook) : null;
}

/** Mô tả chuyển khoản ≤ 9 ký tự (giới hạn của tài khoản không liên kết payOS): "HBT" + mã đơn. */
export const moTaChuyenKhoan = (maDon: number) => `HBT${maDon}`.slice(0, 25);

async function goi(c: CauHinhPayos, duong: string, init?: RequestInit) {
  const r = await fetch(`${c.base}${duong}`, {
    ...init,
    headers: { "x-client-id": c.clientId, "x-api-key": c.apiKey, "content-type": "application/json" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const j = (await r.json().catch(() => null)) as { code?: string; desc?: string; data?: Record<string, unknown>; signature?: string } | null;
  if (!j || j.code !== "00" || !j.data) throw new Error(`payOS: ${j?.desc ?? r.status}`);
  // Dữ liệu trả về phải mang chữ ký đúng (chống giả mạo giữa đường / sai cổng).
  if (typeof j.signature !== "string" || !khop(kyDuLieu(j.data, c.checksumKey), j.signature)) throw new Error("payOS: chữ ký phản hồi sai");
  return j.data;
}

export async function taoLink(c: CauHinhPayos, r: YeuCauLink & { tenGoi: string; hetHanGiay: number }) {
  const ban = { orderCode: r.orderCode, amount: r.amount, description: r.description, returnUrl: r.returnUrl, cancelUrl: r.cancelUrl };
  const d = await goi(c, "/v2/payment-requests", {
    method: "POST",
    body: JSON.stringify({
      ...ban, items: [{ name: r.tenGoi, quantity: 1, price: r.amount }], expiredAt: r.hetHanGiay,
      signature: kyYeuCau(ban, c.checksumKey),
    }),
  });
  return { checkoutUrl: String(d.checkoutUrl), paymentLinkId: String(d.paymentLinkId ?? "") };
}

/** Tra trạng thái đơn ở payOS (đối soát khi webhook lỡ). status: PENDING | PAID | CANCELLED | EXPIRED… */
export async function traCuu(c: CauHinhPayos, maDon: number) {
  const d = await goi(c, `/v2/payment-requests/${maDon}`);
  const gd = Array.isArray(d.transactions) ? (d.transactions as { reference?: string }[]) : [];
  return { status: String(d.status), amountPaid: Number(d.amountPaid ?? 0), amount: Number(d.amount ?? 0), reference: gd[0]?.reference ?? "" };
}
