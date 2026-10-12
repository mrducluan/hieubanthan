// CMS-2 — xác thực 2 bước (TOTP, RFC 6238: 6 số, bước 30 giây, HMAC-SHA1 — đúng chuẩn Google Authenticator / Authy /
// 1Password). Viết bằng node:crypto, KHÔNG thêm thư viện. Bí mật TOTP lưu MÃ HOÁ (AES-256-GCM, khoá suy từ PAYLOAD_SECRET).
// Sau khi nhập đúng mã: cookie "cms-mfa" = uid.hết_hạn.chữ_ký (HMAC) — access.ts đọc cookie này để mở quyền.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(buf: Buffer): string {
  let bits = 0, val = 0, out = "";
  for (const b of buf) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

export function tuBase32(s: string): Buffer {
  const sach = s.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0, val = 0;
  const out: number[] = [];
  for (const c of sach) {
    const i = B32.indexOf(c);
    if (i < 0) throw new Error("base32 không hợp lệ");
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export const BUOC = 30;
export const buocHienTai = (ms = Date.now()) => Math.floor(ms / 1000 / BUOC);

/** Mã TOTP cho một bước thời gian (mặc định 6 số, SHA-1 như mọi app xác thực). */
export function maTotp(biMat: Buffer, buoc: number, so = 6): string {
  const c = Buffer.alloc(8);
  c.writeBigUInt64BE(BigInt(buoc));
  const h = createHmac("sha1", biMat).update(c).digest();
  const o = h[h.length - 1]! & 0xf;
  const n = ((h[o]! & 0x7f) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!;
  return String(n % 10 ** so).padStart(so, "0");
}

/** Kiểm mã trong cửa sổ ±1 bước (lệch đồng hồ ~30 giây). Trả bước khớp (để chặn dùng lại) hoặc null. */
export function kiemMa(biMat: Buffer, ma: string, sauBuoc = -1, ms = Date.now()): number | null {
  if (!/^\d{6}$/.test(ma)) return null;
  const hien = buocHienTai(ms);
  for (const b of [hien - 1, hien, hien + 1]) {
    if (b <= sauBuoc) continue;
    const dung = Buffer.from(maTotp(biMat, b)), vao = Buffer.from(ma);
    if (timingSafeEqual(dung, vao)) return b;
  }
  return null;
}

export const taoBiMat = () => randomBytes(20);
export const uriOtp = (biMat: Buffer, email: string) =>
  `otpauth://totp/${encodeURIComponent(`Hiểu Bản Thân CMS:${email}`)}?secret=${base32(biMat)}&issuer=${encodeURIComponent("Hiểu Bản Thân CMS")}&digits=6&period=${BUOC}`;

// ---------------------------------------------------------------- mã hoá bí mật + cookie
const khoa = (muc: string) => createHash("sha256").update(`${process.env.PAYLOAD_SECRET ?? ""}|${muc}`).digest();

export function maHoa(biMat: Buffer): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", khoa("mfa-bi-mat"), iv);
  const enc = Buffer.concat([c.update(biMat), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function giaiMa(s: string): Buffer | null {
  try {
    const [iv, tag, enc] = s.split(".").map((x) => Buffer.from(x, "base64url"));
    const d = createDecipheriv("aes-256-gcm", khoa("mfa-bi-mat"), iv!);
    d.setAuthTag(tag!);
    return Buffer.concat([d.update(enc!), d.final()]);
  } catch {
    return null;
  }
}

export const TEN_COOKIE = "cms-mfa";
export const THOI_HAN_GIAY = 8 * 60 * 60;   // bằng tokenExpiration của phiên CMS

const ky = (uid: string, het: number) => createHmac("sha256", khoa("mfa-cookie")).update(`${uid}|${het}`).digest("base64url");

export function taoCookie(uid: string | number, ms = Date.now()): string {
  const het = Math.floor(ms / 1000) + THOI_HAN_GIAY;
  return `${uid}.${het}.${ky(String(uid), het)}`;
}

export function cookieHopLe(v: string | undefined | null, uid: string | number, ms = Date.now()): boolean {
  if (!v) return false;
  const [u, h, sig] = v.split(".");
  const het = Number(h);
  if (u !== String(uid) || !Number.isFinite(het) || het < ms / 1000 || !sig) return false;
  const dung = Buffer.from(ky(u, het)), vao = Buffer.from(sig);
  return dung.length === vao.length && timingSafeEqual(dung, vao);
}

export function docCookie(header: string | null | undefined, ten = TEN_COOKIE): string | null {
  for (const p of (header ?? "").split(";")) {
    const [k, ...v] = p.trim().split("=");
    if (k === ten) return decodeURIComponent(v.join("="));
  }
  return null;
}
