// Mã mời đội ngũ (HMAC-SHA256) và Mã xác nhận đồng ý của nhân sự (mã hóa AES-256-GCM) — CHỈ chạy phía server.
// Tuân thủ Luật BVDLCN 91/2025/QH15 & nguyên tắc không lưu dữ liệu ngày sinh trên DB (THIET-KE-UI §8):
//   1. Ông chủ tạo mã mời gắn `nonce` riêng cho phiên đội ngũ (hạn 7 ngày).
//   2. Nhân sự tự mở link trên thiết bị của mình, đọc phạm vi tham khảo giao tiếp và tự bấm đồng ý.
//   3. Server mã hóa thông tin thành viên bằng AES-256-GCM (kèm AuthTag + AAD) → trả về `tv_token` ngắn.
//      Ngay cả ông chủ cũng KHÔNG đọc ngược được ngày sinh từ `tv_token`.
//   4. Chỉ proxy máy chủ (/api/doanh-chu) giải mã, kiểm tra đúng `scope`, đúng `nonce`, còn hạn rồi mới đặt
//      `dong_y_tu_nguyen = true` gửi sang engine.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const PHIEN_BAN_DONG_Y = "nd13-2023-v1" as const;
const HAN_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày
const AAD_TV = Buffer.from("doanh-chu-tv-v1", "utf8");
const NONCE_RE = /^[a-f0-9]{16,32}$/;

function biMatGoc(): string {
  const k = process.env.LOI_MOI_SECRET || process.env.SAO_KHOA_SECRET;
  if (k && k.length >= 16) return k;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Thiếu LOI_MOI_SECRET (≥16 ký tự) — không tạo/giải mã được mã đội ngũ.");
  }
  return "chi-dung-khi-phat-trien-local-doanh-chu";
}

function khoaHmacMoi(): Buffer {
  return createHash("sha256").update(`doanh-chu-moi|${biMatGoc()}`).digest();
}

function khoaAesTv(): Buffer {
  return createHash("sha256").update(`doanh-chu-tv-aes256gcm|${biMatGoc()}`).digest();
}

export interface NoiDungMoiDoiNgu {
  v: 1;
  scope: "doanh-chu-moi";
  nonce: string;
  ten_nhom: string;
  phien_ban_dong_y: typeof PHIEN_BAN_DONG_Y;
  iat: number;
  exp: number;
}

export interface NoiDungDongYThanhVien {
  v: 1;
  scope: "doanh-chu-tv";
  nonce: string;
  phien_ban_dong_y: typeof PHIEN_BAN_DONG_Y;
  thoi_diem_dong_y: string;
  exp: number;
  biet_danh: string;
  vai_tro: string;
  ngay: number;
  thang: number;
  nam: number;
  gioi_tinh: "nam" | "nu";
}

function kiemNoiDungMoi(x: unknown): NoiDungMoiDoiNgu | null {
  if (!x || typeof x !== "object" || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length !== 7) return null;
  if (o.v !== 1 || o.scope !== "doanh-chu-moi" || o.phien_ban_dong_y !== PHIEN_BAN_DONG_Y) return null;
  if (typeof o.nonce !== "string" || !NONCE_RE.test(o.nonce)) return null;
  if (typeof o.ten_nhom !== "string" || o.ten_nhom.trim().length < 1 || o.ten_nhom.length > 50) return null;
  if (typeof o.iat !== "number" || !Number.isInteger(o.iat) || o.iat <= 0) return null;
  if (typeof o.exp !== "number" || !Number.isInteger(o.exp) || o.exp <= o.iat) return null;
  return {
    v: 1,
    scope: "doanh-chu-moi",
    nonce: o.nonce,
    ten_nhom: o.ten_nhom.trim(),
    phien_ban_dong_y: PHIEN_BAN_DONG_Y,
    iat: o.iat,
    exp: o.exp,
  };
}

function kiemNoiDungTv(x: unknown): NoiDungDongYThanhVien | null {
  if (!x || typeof x !== "object" || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length !== 12) return null;
  if (o.v !== 1 || o.scope !== "doanh-chu-tv" || o.phien_ban_dong_y !== PHIEN_BAN_DONG_Y) return null;
  if (typeof o.nonce !== "string" || !NONCE_RE.test(o.nonce)) return null;
  if (typeof o.thoi_diem_dong_y !== "string" || o.thoi_diem_dong_y.length < 10 || o.thoi_diem_dong_y.length > 40) return null;
  if (typeof o.exp !== "number" || !Number.isInteger(o.exp) || o.exp <= 0) return null;
  if (typeof o.biet_danh !== "string" || o.biet_danh.trim().length < 1 || o.biet_danh.length > 40) return null;
  if (typeof o.vai_tro !== "string" || o.vai_tro.length > 60) return null;
  if (typeof o.ngay !== "number" || !Number.isInteger(o.ngay) || o.ngay < 1 || o.ngay > 31) return null;
  if (typeof o.thang !== "number" || !Number.isInteger(o.thang) || o.thang < 1 || o.thang > 12) return null;
  if (typeof o.nam !== "number" || !Number.isInteger(o.nam) || o.nam < 1930 || o.nam > 2025) return null;
  if (o.gioi_tinh !== "nam" && o.gioi_tinh !== "nu") return null;
  return {
    v: 1,
    scope: "doanh-chu-tv",
    nonce: o.nonce,
    phien_ban_dong_y: PHIEN_BAN_DONG_Y,
    thoi_diem_dong_y: o.thoi_diem_dong_y,
    exp: o.exp,
    biet_danh: o.biet_danh.trim(),
    vai_tro: o.vai_tro.trim(),
    ngay: o.ngay,
    thang: o.thang,
    nam: o.nam,
    gioi_tinh: o.gioi_tinh,
  };
}

/** Tạo mã mời đội ngũ có chữ ký HMAC-SHA256 và nonce riêng (hạn 7 ngày). */
export function kyLoiMoiDoiNgu(tenNhom: string, bayGioMs = Date.now()): { ma: string; noi_dung: NoiDungMoiDoiNgu } {
  const noi_dung: NoiDungMoiDoiNgu = {
    v: 1,
    scope: "doanh-chu-moi",
    nonce: randomBytes(10).toString("hex"),
    ten_nhom: tenNhom.trim().slice(0, 50) || "Đội ngũ cốt cán",
    phien_ban_dong_y: PHIEN_BAN_DONG_Y,
    iat: bayGioMs,
    exp: bayGioMs + HAN_MS,
  };
  const than = Buffer.from(JSON.stringify(noi_dung), "utf8").toString("base64url");
  const sig = createHmac("sha256", khoaHmacMoi()).update(than).digest("base64url").slice(0, 24);
  return { ma: `dcm1.${than}.${sig}`, noi_dung };
}

/** Xác thực mã mời đội ngũ. Trả null nếu sai định dạng, giả mạo hoặc đã hết hạn. */
export function docLoiMoiDoiNgu(ma: string, bayGioMs = Date.now()): NoiDungMoiDoiNgu | null {
  if (!ma || ma.length > 600) return null;
  const parts = ma.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "dcm1") return null;
  const [, than, sig] = parts;
  if (!than || !sig) return null;
  const dung = createHmac("sha256", khoaHmacMoi()).update(than).digest("base64url").slice(0, 24);
  const a = Buffer.from(sig);
  const b = Buffer.from(dung);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = kiemNoiDungMoi(JSON.parse(Buffer.from(than, "base64url").toString("utf8")));
    if (!parsed || bayGioMs > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Mã hóa AES-256-GCM thông tin xác nhận đồng ý tự nguyện của nhân sự → `tv_token` (không lộ ngày sinh). */
export function maHoaDongYThanhVien(
  duLieu: {
    nonce: string;
    biet_danh: string;
    vai_tro: string;
    ngay: number;
    thang: number;
    nam: number;
    gioi_tinh: "nam" | "nu";
  },
  bayGioMs = Date.now(),
): { tv_token: string; het_han: number } {
  const het_han = bayGioMs + HAN_MS;
  const payload = kiemNoiDungTv({
    v: 1,
    scope: "doanh-chu-tv",
    nonce: duLieu.nonce,
    phien_ban_dong_y: PHIEN_BAN_DONG_Y,
    thoi_diem_dong_y: new Date(bayGioMs).toISOString(),
    exp: het_han,
    biet_danh: duLieu.biet_danh.trim().slice(0, 40) || "Cộng sự",
    vai_tro: duLieu.vai_tro.trim().slice(0, 60),
    ngay: duLieu.ngay,
    thang: duLieu.thang,
    nam: duLieu.nam,
    gioi_tinh: duLieu.gioi_tinh,
  });
  if (!payload) throw new Error("Dữ liệu thành viên không hợp lệ.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", khoaAesTv(), iv);
  cipher.setAAD(AAD_TV);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    tv_token: `dc1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ct.toString("base64url")}`,
    het_han,
  };
}

/** Giải mã & kiểm tra AuthTag + scope + nonce + hạn của `tv_token`. Trả null nếu bất kỳ điều kiện nào sai. */
export function giaiMaDongYThanhVien(
  tvToken: string,
  expectedNonce: string,
  bayGioMs = Date.now(),
): NoiDungDongYThanhVien | null {
  if (!tvToken || tvToken.length > 900) return null;
  const parts = tvToken.trim().split(".");
  if (parts.length !== 4 || parts[0] !== "dc1") return null;
  const [, ivB64, tagB64, ctB64] = parts;
  if (!ivB64 || !tagB64 || !ctB64) return null;
  try {
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const ct = Buffer.from(ctB64, "base64url");
    if (iv.length !== 12 || tag.length !== 16 || ct.length === 0) return null;
    const decipher = createDecipheriv("aes-256-gcm", khoaAesTv(), iv);
    decipher.setAAD(AAD_TV);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
    const parsed = kiemNoiDungTv(JSON.parse(plain));
    if (!parsed || parsed.nonce !== expectedNonce || bayGioMs > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}
