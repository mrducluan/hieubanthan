// KC-4 GĐ1 — Web Push phía MÁY CHỦ: mã hoá gói (RFC 8291, aes128gcm theo RFC 8188) + chữ ký VAPID (RFC 8292).
// Tự viết bằng node:crypto, KHÔNG thêm dependency (gói `web-push` là MPL-2.0 + 5 gói con — không phải MIT như tài liệu
// ghi). Đúng từng byte với test vector RFC 8291 phụ lục A (e2e/web-push.spec.ts) và đã đối chiếu `web-push` 3.6.7 làm
// oracle ngoài repo. Env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (tạo bằng `node scripts/tao-khoa-vapid.mjs`), VAPID_SUBJECT.
import { createCipheriv, createECDH, createHmac, createPrivateKey, randomBytes, sign } from "node:crypto";

export const b64u = (b: Buffer | Uint8Array) => Buffer.from(b).toString("base64url");
export const tuB64u = (s: string) => Buffer.from(s, "base64url");
const hmac = (khoa: Buffer, ...du: Buffer[]) => { const h = createHmac("sha256", khoa); du.forEach((d) => h.update(d)); return h.digest(); };

/** Máy chủ push của trình duyệt (Chrome/Edge/Samsung qua FCM, Firefox, Safari, Edge cũ) — cùng danh sách với CHECK
 *  của bảng push_dang_ky (migration 0019). Máy chủ web chỉ POST tới các địa chỉ này. */
export const MAY_CHU_PUSH = /^https:\/\/(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)\/\S+$/;

export interface DangKyPush { endpoint: string; p256dh: string; auth: string }
export interface KhoaVapid { congKhai: string; riengTu: string; chuThe: string }

export function khoaVapid(): KhoaVapid | null {
  const congKhai = process.env.VAPID_PUBLIC_KEY?.trim(), riengTu = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!congKhai || !riengTu || tuB64u(congKhai).length !== 65 || tuB64u(riengTu).length !== 32) return null;
  return { congKhai, riengTu, chuThe: process.env.VAPID_SUBJECT?.trim() || "mailto:contact@hieuban.com" };
}

/** Mã hoá một bản ghi aes128gcm. `muoi` + `khoaMay` chỉ truyền vào khi kiểm bằng test vector; chạy thật để ngẫu nhiên. */
export function maHoa(noiDung: Buffer, uaCongKhai: Buffer, biMatAuth: Buffer, thu?: { muoi: Buffer; khoaMayRiengTu: Buffer }): Buffer {
  const ecdh = createECDH("prime256v1");
  if (thu) ecdh.setPrivateKey(thu.khoaMayRiengTu); else ecdh.generateKeys();
  const asCongKhai = ecdh.getPublicKey();                        // 65 byte, dạng không nén
  const muoi = thu?.muoi ?? randomBytes(16);
  const biMatEcdh = ecdh.computeSecret(uaCongKhai);
  // RFC 8291 §3.4: IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info" || 0x00 || ua_public || as_public, 32)
  const prkKhoa = hmac(biMatAuth, biMatEcdh);
  const ikm = hmac(prkKhoa, Buffer.from("WebPush: info\0"), uaCongKhai, asCongKhai, Buffer.from([1]));
  // RFC 8188 §2.2–2.3: CEK, NONCE từ PRK = HMAC(salt, IKM)
  const prk = hmac(muoi, ikm);
  const cek = hmac(prk, Buffer.from("Content-Encoding: aes128gcm\0"), Buffer.from([1])).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from("Content-Encoding: nonce\0"), Buffer.from([1])).subarray(0, 12);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ma = Buffer.concat([cipher.update(Buffer.concat([noiDung, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([muoi, rs, Buffer.from([asCongKhai.length]), asCongKhai, ma]);
}

/** JWT VAPID ES256 cho origin của endpoint, hạn 12 giờ. */
export function jwtVapid(endpoint: string, k: KhoaVapid, bayGio = Math.floor(Date.now() / 1000)): string {
  const pub = tuB64u(k.congKhai);
  const khoa = createPrivateKey({ format: "jwk", key: { kty: "EC", crv: "P-256", d: k.riengTu,
    x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) } });
  const dau = b64u(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const than = b64u(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: bayGio + 12 * 3600, sub: k.chuThe })));
  const ky = sign("sha256", Buffer.from(`${dau}.${than}`), { key: khoa, dsaEncoding: "ieee-p1363" });
  return `${dau}.${than}.${b64u(ky)}`;
}

export type KetQuaGui = "ok" | "het_han" | "loi";

/** Gửi một thông báo. 404/410 = trình duyệt đã huỷ đăng ký → "het_han" (xoá). */
export async function guiPush(dk: DangKyPush, goi: object, k: KhoaVapid): Promise<KetQuaGui> {
  if (!MAY_CHU_PUSH.test(dk.endpoint)) return "het_han";
  const than = maHoa(Buffer.from(JSON.stringify(goi)), tuB64u(dk.p256dh), tuB64u(dk.auth));
  try {
    const r = await fetch(dk.endpoint, {
      method: "POST", body: new Uint8Array(than), redirect: "error", signal: AbortSignal.timeout(10_000),
      headers: { authorization: `vapid t=${jwtVapid(dk.endpoint, k)}, k=${k.congKhai}`, "content-encoding": "aes128gcm",
        "content-type": "application/octet-stream", ttl: String(12 * 3600), urgency: "normal" },
    });
    if (r.ok) return "ok";
    return r.status === 404 || r.status === 410 ? "het_han" : "loi";
  } catch {
    return "loi";
  }
}

/** Ngày hôm nay theo giờ Việt Nam (UTC+7), yyyy-mm-dd. */
export const homNayVn = (ms = Date.now()) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10);

/** Gói thông báo từ các mốc của một người trong ngày (nhãn do engine soạn, đường dẫn trong site). */
export function goiThongBao(nhac: { nhan: string; duong: string | null }[], ngay: string) {
  const ds = [...nhac].sort((a, b) => a.nhan.localeCompare(b.nhan, "vi"));
  const dau = ds[0] ?? { nhan: "Mốc bạn đã đánh dấu", duong: null };
  const trongSite = (d: string | null) => (d && /^\/[a-z0-9/_?=&.#-]{0,120}$/.test(d) && !d.startsWith("//") ? d : null);
  return {
    title: ds.length > 1 ? `${dau.nhan} · +${ds.length - 1} mốc` : dau.nhan,
    body: "Mốc bạn đã đánh dấu cho hôm nay — nhịp gợi ý, không phải dự báo.",
    url: (ds.length === 1 && trongSite(dau.duong)) || "/hom-nay",
    tag: `nhac-${ngay}`,
  };
}
