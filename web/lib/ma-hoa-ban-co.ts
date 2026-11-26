// Chặng 2 — Mã hoá đầu-cuối phía trình duyệt (Zero-Knowledge Client-Side E2EE) cho "Bàn Cờ Đối Tác & Mặt Bằng".
// Dùng WebCrypto chuẩn (`crypto.subtle`): PBKDF2-HMAC-SHA256 (210.000 vòng, salt 16 byte ngẫu nhiên) → AES-GCM 256-bit
// (IV 12 byte ngẫu nhiên mỗi lượt lưu). Mật khẩu chỉ tồn tại trong bộ nhớ phiên mở trang; máy chủ không bao giờ thấy
// mật khẩu, bản rõ hay bản mã. Nếu quên mật khẩu, không ai khôi phục được — giao diện nhắc rõ tải bản sao lưu khi cần.

export const KHOA_BAN_CO_E2EE = "hbt.ban_co_kinh_doanh.e2ee.v1";
const SO_VONG_PBKDF2 = 210_000;

export interface DoiTacBanCo {
  id: string;
  ten: string;
  vai_tro_du_kien: string;
  ngay: number;
  thang: number;
  nam: number;
  gioi_tinh: "nam" | "nu";
  gio?: string;
  ty_le_du_kien?: number;
}

export interface MatBangBanCo {
  id: string;
  ten_diem: string;
  loai_hinh: "van_phong" | "cua_hang" | "quan_ca_phe" | "xuong_kho";
  do_huong: number;
  nam_xay?: number;
  ghi_chu?: string;
}

export interface DuLieuBanCoKinhDoanh {
  phien_ban: 1;
  ten_ban_co: string;
  ghi_chu: string;
  doi_tac: DoiTacBanCo[];
  mat_bang: MatBangBanCo[];
}

export interface GoiMaHoaBanCo {
  v: "hbt_e2ee_v1";
  salt_b64: string;
  iv_b64: string;
  ct_b64: string;
  cap_nhat_luc: string;
}

function sangB64(buf: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(buf).toString("base64");
  let s = "";
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]!);
  return btoa(s);
}

function tuB64(b64: string): Uint8Array<ArrayBuffer> {
  if (typeof Buffer !== "undefined") {
    const b = Buffer.from(b64, "base64");
    const ra = new Uint8Array(new ArrayBuffer(b.length));
    ra.set(b);
    return ra;
  }
  const bin = atob(b64);
  const ra = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) ra[i] = bin.charCodeAt(i);
  return ra;
}

async function danKhoaAes(matKhau: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const mk = matKhau.trim();
  if (mk.length < 8) {
    throw new Error("Mật khẩu khoá bàn cờ cần từ 8 ký tự trở lên.");
  }
  const subt = globalThis.crypto.subtle;
  const goc = await subt.importKey("raw", new TextEncoder().encode(mk), "PBKDF2", false, ["deriveKey"]);
  return subt.deriveKey(
    { name: "PBKDF2", salt, iterations: SO_VONG_PBKDF2, hash: "SHA-256" },
    goc,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function maHoaBanCo(duLieu: DuLieuBanCoKinhDoanh, matKhau: string): Promise<GoiMaHoaBanCo> {
  const salt = new Uint8Array(new ArrayBuffer(16));
  const iv = new Uint8Array(new ArrayBuffer(12));
  globalThis.crypto.getRandomValues(salt);
  globalThis.crypto.getRandomValues(iv);
  const khoa = await danKhoaAes(matKhau, salt);
  const plain = new TextEncoder().encode(JSON.stringify(duLieu));
  const ct = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, khoa, plain);
  return {
    v: "hbt_e2ee_v1",
    salt_b64: sangB64(salt),
    iv_b64: sangB64(iv),
    ct_b64: sangB64(new Uint8Array(ct)),
    cap_nhat_luc: new Date().toISOString(),
  };
}

export async function giaiMaBanCo(goi: GoiMaHoaBanCo, matKhau: string): Promise<DuLieuBanCoKinhDoanh> {
  if (!goi || goi.v !== "hbt_e2ee_v1" || !goi.salt_b64 || !goi.iv_b64 || !goi.ct_b64) {
    throw new Error("Tệp bàn cờ mã hoá không đúng định dạng.");
  }
  const salt = tuB64(goi.salt_b64);
  const iv = tuB64(goi.iv_b64);
  const ct = tuB64(goi.ct_b64);
  const khoa = await danKhoaAes(matKhau, salt);
  try {
    const plainBuf = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv }, khoa, ct);
    const parsed = JSON.parse(new TextDecoder().decode(plainBuf)) as DuLieuBanCoKinhDoanh;
    if (!parsed || parsed.phien_ban !== 1 || !Array.isArray(parsed.doi_tac) || !Array.isArray(parsed.mat_bang)) {
      throw new Error("Dữ liệu bàn cờ không hợp lệ.");
    }
    return parsed;
  } catch {
    throw new Error("Sai mật khẩu hoặc dữ liệu mã hoá đã bị thay đổi.");
  }
}

export function docGoiBanCoMay(): GoiMaHoaBanCo | null {
  try {
    const raw = localStorage.getItem(KHOA_BAN_CO_E2EE);
    if (!raw) return null;
    const p = JSON.parse(raw) as GoiMaHoaBanCo;
    return p?.v === "hbt_e2ee_v1" ? p : null;
  } catch {
    return null;
  }
}

export function luuGoiBanCoMay(goi: GoiMaHoaBanCo): void {
  localStorage.setItem(KHOA_BAN_CO_E2EE, JSON.stringify(goi));
}

export function xoaGoiBanCoMay(): void {
  localStorage.removeItem(KHOA_BAN_CO_E2EE);
}
