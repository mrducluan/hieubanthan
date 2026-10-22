// Mã chia sẻ / lời mời có KÝ (HMAC-SHA256) — chỉ chạy phía server.
// Chỉ chứa tên hiển thị người dùng tự chọn + các con số đã tính (không ngày sinh, không user_id),
// nên không cần bảng lưu trữ: link tự mang dữ liệu teaser, chữ ký chống giả mạo.
// Xem docs/THIET-KE-UI.md §8 (quyết định: thay bảng loi_moi bằng mã có ký).
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const NoiDungMa = z.object({
  v: z.literal(1),
  /** Tên hiển thị — người dùng tự chọn, có thể là biệt danh. */
  t: z.string().trim().min(1).max(40),
  /** Bốn số: đường đời, sứ mệnh, linh hồn, nhân cách (sứ mệnh… có thể thiếu khi không có tên). */
  so: z.array(z.number().int().min(1).max(33)).min(1).max(4),
  /** Từ khoá số đường đời (từ KB, engine trả). */
  k: z.string().max(80).optional(),
  /** Ngày tạo (YYYY-MM-DD) — để hết hạn. */
  d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type NoiDungMa = z.infer<typeof NoiDungMa>;

const HAN_NGAY = 90;

function khoa(): string {
  const k = process.env.LOI_MOI_SECRET;
  if (k && k.length >= 16) return k;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Thiếu LOI_MOI_SECRET (≥16 ký tự) — không tạo được link chia sẻ.");
  }
  return "chi-dung-khi-phat-trien-local";
}

function b64u(buf: Buffer): string {
  return buf.toString("base64url");
}

export function kyMa(nd: Omit<NoiDungMa, "v" | "d">, homNay = new Date()): string {
  const day = NoiDungMa.parse({ ...nd, v: 1, d: homNay.toISOString().slice(0, 10) });
  const than = b64u(Buffer.from(JSON.stringify(day), "utf8"));
  const chu_ky = b64u(createHmac("sha256", khoa()).update(than).digest()).slice(0, 22);
  return `${than}.${chu_ky}`;
}

/** Giải mã + kiểm chữ ký + hạn. Trả null nếu sai/giả/hết hạn. */
export function docMa(ma: string, homNay = new Date()): NoiDungMa | null {
  const [than, chu_ky] = ma.split(".");
  if (!than || !chu_ky || ma.length > 600) return null;
  const dung = b64u(createHmac("sha256", khoa()).update(than).digest()).slice(0, 22);
  const a = Buffer.from(chu_ky), b = Buffer.from(dung);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const nd = NoiDungMa.parse(JSON.parse(Buffer.from(than, "base64url").toString("utf8")));
    const tuoi = (homNay.getTime() - Date.parse(nd.d)) / 86_400_000;
    return tuoi <= HAN_NGAY ? nd : null;
  } catch {
    return null;
  }
}

/** Mã ngắn để gán nguồn giới thiệu trong đo lường (không định danh người). */
export function maNgan(ma: string): string {
  return (ma.split(".")[1] ?? "").slice(0, 10);
}

// ---------------------------------------------------------------- NHIP-1: thẻ "Hôm nay mình là Ngày cá nhân N"
// Mã riêng (khoá HMAC tách miền bằng tiền tố "ngay|") → không dùng lẫn được với mã thẻ hồ sơ/lời mời ở trên.
export const NoiDungMaNgay = z.object({
  v: z.literal(1),
  t: z.string().trim().min(1).max(40),
  /** Ngày cá nhân 1–9 (engine tính). */
  n: z.number().int().min(1).max(9),
  /** Chủ đề ngày (KB, engine trả). */
  k: z.string().max(90).optional(),
  /** TS-V3b: số nổi bật qua hai phái (gốc 1–9) — engine tính; thẻ cũ không có. Trường lạ của mã cũ bị bỏ khi đọc. */
  s: z.number().int().min(1).max(9).optional(),
  /** Ngày xem (YYYY-MM-DD, giờ Việt Nam) — thẻ nói về đúng ngày này; cũng dùng để hết hạn. */
  d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type NoiDungMaNgay = z.infer<typeof NoiDungMaNgay>;

const kyNgay = (than: string) => b64u(createHmac("sha256", khoa()).update(`ngay|${than}`).digest()).slice(0, 22);

export function kyMaNgay(nd: Omit<NoiDungMaNgay, "v">): string {
  const than = b64u(Buffer.from(JSON.stringify(NoiDungMaNgay.parse({ ...nd, v: 1 })), "utf8"));
  return `${than}.${kyNgay(than)}`;
}

export function docMaNgay(ma: string, homNay = new Date()): NoiDungMaNgay | null {
  const [than, chu_ky] = ma.split(".");
  if (!than || !chu_ky || ma.length > 600) return null;
  const a = Buffer.from(chu_ky), b = Buffer.from(kyNgay(than));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const nd = NoiDungMaNgay.parse(JSON.parse(Buffer.from(than, "base64url").toString("utf8")));
    return (homNay.getTime() - Date.parse(nd.d)) / 86_400_000 <= HAN_NGAY ? nd : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- TCS-1: thẻ "Điểm hai người" (Xem lá số 2 người)
// Mã riêng miền "hai|". Chỉ mang: tên hiển thị hai người (người dùng tự gõ, có thể trống), quan hệ, điểm tổng, mức và
// ≤ 3 điểm tiêu chí (phần trăm) — engine chấm, máy chủ ký. KHÔNG ngày sinh, không can chi / con giáp / mệnh (đủ để suy
// năm sinh). Gói gọn thành mảng JSON + chữ ký 16 ký tự (96 bit) để link ngắn → mã QR trên ảnh nhỏ, dễ quét.
export const QUAN_HE_HAI = ["nguoi_yeu", "vo_chong", "ban_be", "dong_nghiep", "doi_tac", "sep", "cha_me_con", "gia_dinh"] as const;
export const MUC_HAI = ["de_hoa_hop", "hop_neu_hieu", "can_dung_hoa_nhieu", "nhieu_khac_biet"] as const;
export const TIEU_CHI_HAI = ["menh", "can", "chi", "cung_phi", "tu_vi"] as const;

export const NoiDungMaHai = z.object({
  v: z.literal(1),
  /** Tên hiển thị người chia sẻ / người kia — trống = "Bạn" / "Người ấy". */
  a: z.string().trim().max(24),
  b: z.string().trim().max(24),
  q: z.enum(QUAN_HE_HAI),
  /** Điểm tham khảo 0–100 (engine, luật hai_nguoi_1). */
  p: z.number().int().min(0).max(100),
  m: z.enum(MUC_HAI),
  /** 1–3 tiêu chí: mã + phần trăm điểm của tiêu chí đó. */
  c: z.array(z.tuple([z.enum(TIEU_CHI_HAI), z.number().int().min(0).max(100)])).min(1).max(3),
  /** Ngày tạo (YYYY-MM-DD) — để hết hạn. */
  d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type NoiDungMaHai = z.infer<typeof NoiDungMaHai>;

const NGAY_GOC = Date.UTC(2026, 0, 1);
const kyHai = (than: string) => b64u(createHmac("sha256", khoa()).update(`hai|${than}`).digest()).slice(0, 16);

/** Ký mã thẻ Điểm hai người. Gói: [1, a, b, quan hệ, điểm, mức, [tiêu chí, %, …], số ngày từ 1/1/2026]. */
export function kyMaHai(nd: Omit<NoiDungMaHai, "v" | "d">, homNay = new Date()): string {
  const x = NoiDungMaHai.parse({ ...nd, v: 1, d: homNay.toISOString().slice(0, 10) });
  const goi = [1, x.a, x.b, QUAN_HE_HAI.indexOf(x.q), x.p, MUC_HAI.indexOf(x.m),
    x.c.flatMap(([ma, pt]) => [TIEU_CHI_HAI.indexOf(ma), pt]), Math.round((Date.parse(x.d) - NGAY_GOC) / 86_400_000)];
  const than = b64u(Buffer.from(JSON.stringify(goi), "utf8"));
  return `${than}.${kyHai(than)}`;
}

export function docMaHai(ma: string, homNay = new Date()): NoiDungMaHai | null {
  const [than, chu_ky] = ma.split(".");
  if (!than || !chu_ky || ma.length > 300) return null;
  const a = Buffer.from(chu_ky), b = Buffer.from(kyHai(than));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const g = JSON.parse(Buffer.from(than, "base64url").toString("utf8")) as unknown;
    if (!Array.isArray(g) || g.length !== 8 || !Array.isArray(g[6]) || g[6].length % 2) return null;
    const c = g[6] as number[];
    const nd = NoiDungMaHai.parse({
      v: g[0], a: g[1], b: g[2], q: QUAN_HE_HAI[g[3] as number], p: g[4], m: MUC_HAI[g[5] as number],
      c: Array.from({ length: c.length / 2 }, (_, i) => [TIEU_CHI_HAI[c[2 * i]!], c[2 * i + 1]]),
      d: new Date(NGAY_GOC + Number(g[7]) * 86_400_000).toISOString().slice(0, 10),
    });
    return (homNay.getTime() - Date.parse(nd.d)) / 86_400_000 <= HAN_NGAY ? nd : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- CTA-1: thẻ "Bản đồ 5 mảng của tôi"
// Mã riêng miền "bd|". Chỉ mang: tên hiển thị (người dùng tự gõ), các NHÃN engine đã tính — đường đời + từ khoá, nhật chủ
// + hình ảnh, chính tinh cung Mệnh, cung phi + hướng tốt, quẻ đầu ngày — ba lựa chọn của trò "Đoán số" và mã biến thể
// câu mời. KHÔNG ngày sinh, giờ sinh, can chi năm, con giáp, nạp âm (đủ để suy năm sinh). Mảnh thiếu (chưa có giờ /
// giới tính) = chuỗi rỗng.
export const NoiDungMaBanDo = z.object({
  v: z.literal(1),
  t: z.string().trim().min(1).max(24),
  /** Đường đời 1–33 (engine) + từ khoá KB. */
  s: z.number().int().min(1).max(33),
  k: z.string().max(60),
  /** Nhật chủ ("Nhâm Thủy") + hình ảnh KB ("sông lớn, biển cả"). */
  n: z.string().max(16),
  h: z.string().max(40),
  /** Chính tinh cung Mệnh ("" = chưa có giờ sinh). */
  m: z.string().max(30),
  /** Cung phi + hướng tốt nhất ("" = chưa có giới tính). */
  c: z.string().max(8),
  g: z.string().max(12),
  /** Quẻ đầu ngày (tên) — chung cho mọi người trong ngày tạo thẻ. */
  q: z.string().max(16),
  /** Ba lựa chọn trò "Đoán số" (có đáp án s). */
  o: z.array(z.number().int().min(1).max(33)).length(3),
  /** Mã biến thể câu mời 0–2. */
  b: z.number().int().min(0).max(2),
  d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine((x) => x.o.includes(x.s));
export type NoiDungMaBanDo = z.infer<typeof NoiDungMaBanDo>;

const kyBanDo = (than: string) => b64u(createHmac("sha256", khoa()).update(`bd|${than}`).digest()).slice(0, 16);

/** Gói: [1, t, s, k, n, h, m, c, g, q, o, b, số ngày từ 1/1/2026]. */
export function kyMaBanDo(nd: Omit<NoiDungMaBanDo, "v" | "d">, homNay = new Date()): string {
  const x = NoiDungMaBanDo.parse({ ...nd, v: 1, d: homNay.toISOString().slice(0, 10) });
  const goi = [1, x.t, x.s, x.k, x.n, x.h, x.m, x.c, x.g, x.q, x.o, x.b, Math.round((Date.parse(x.d) - NGAY_GOC) / 86_400_000)];
  const than = b64u(Buffer.from(JSON.stringify(goi), "utf8"));
  return `${than}.${kyBanDo(than)}`;
}

export function docMaBanDo(ma: string, homNay = new Date()): NoiDungMaBanDo | null {
  const [than, chu_ky] = ma.split(".");
  if (!than || !chu_ky || ma.length > 700) return null;
  const a = Buffer.from(chu_ky), b = Buffer.from(kyBanDo(than));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const g = JSON.parse(Buffer.from(than, "base64url").toString("utf8")) as unknown[];
    if (!Array.isArray(g) || g.length !== 13) return null;
    const nd = NoiDungMaBanDo.parse({
      v: g[0], t: g[1], s: g[2], k: g[3], n: g[4], h: g[5], m: g[6], c: g[7], g: g[8], q: g[9], o: g[10], b: g[11],
      d: new Date(NGAY_GOC + Number(g[12]) * 86_400_000).toISOString().slice(0, 10),
    });
    return (homNay.getTime() - Date.parse(nd.d)) / 86_400_000 <= HAN_NGAY ? nd : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- UI-PT2 P7: thẻ "Nhà của bạn"
// Mã riêng miền "nha|". Chỉ mang: tên hiển thị (người dùng tự gõ, có thể trống), hướng nhà (1 trong 8), loại nhà, mức
// "ngôi nhà này với bạn" và ≤ 6 phòng [phòng, phương, mức] — engine chấm, máy chủ ký. KHÔNG địa chỉ, toạ độ, độ la bàn
// chính xác, năm xây, năm sinh, mệnh quái (mệnh + giới tính suy ra được khoảng năm sinh).
export const HUONG_8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] as const;
export const CUNG_9 = [...HUONG_8, "Trung cung"] as const;
export const LOAI_NHA_THE = ["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"] as const;
export const MUC_THE = ["thuan", "can_bang", "can_chu_dong"] as const;
export const PHONG_THE = ["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "phong_lam_viec"] as const;

export const NoiDungMaNha = z.object({
  v: z.literal(1),
  t: z.string().trim().max(24),
  h: z.enum(HUONG_8),
  l: z.enum(LOAI_NHA_THE).nullable(),
  /** Mức chương "Ngôi nhà này với bạn" (null khi chưa có năm sinh). */
  m: z.enum(MUC_THE).nullable(),
  /** Phòng: [mã phòng, phương, mức]. */
  p: z.array(z.tuple([z.enum(PHONG_THE), z.enum(CUNG_9), z.enum(MUC_THE).nullable()])).max(6),
  d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type NoiDungMaNha = z.infer<typeof NoiDungMaNha>;

const kyNha = (than: string) => b64u(createHmac("sha256", khoa()).update(`nha|${than}`).digest()).slice(0, 16);
const idx = <T extends readonly string[]>(ds: T, v: string | null) => (v == null ? -1 : ds.indexOf(v as T[number]));

/** Gói: [1, t, hướng, loại, mức, [[phòng, phương, mức], …], số ngày từ 1/1/2026] — chỉ số thay chữ để link ngắn. */
export function kyMaNha(nd: Omit<NoiDungMaNha, "v" | "d">, homNay = new Date()): string {
  const x = NoiDungMaNha.parse({ ...nd, v: 1, d: homNay.toISOString().slice(0, 10) });
  const goi = [1, x.t, HUONG_8.indexOf(x.h), idx(LOAI_NHA_THE, x.l), idx(MUC_THE, x.m),
    x.p.map(([ph, c, m]) => [PHONG_THE.indexOf(ph), CUNG_9.indexOf(c), idx(MUC_THE, m)]),
    Math.round((Date.parse(x.d) - NGAY_GOC) / 86_400_000)];
  const than = b64u(Buffer.from(JSON.stringify(goi), "utf8"));
  return `${than}.${kyNha(than)}`;
}

export function docMaNha(ma: string, homNay = new Date()): NoiDungMaNha | null {
  const [than, chu_ky] = ma.split(".");
  if (!than || !chu_ky || ma.length > 400) return null;
  const a = Buffer.from(chu_ky), b = Buffer.from(kyNha(than));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const g = JSON.parse(Buffer.from(than, "base64url").toString("utf8")) as unknown[];
    if (!Array.isArray(g) || g.length !== 7 || !Array.isArray(g[5])) return null;
    const tai = <T extends readonly string[]>(ds: T, i: unknown) => (typeof i === "number" && i >= 0 ? ds[i] ?? null : null);
    const nd = NoiDungMaNha.parse({
      v: g[0], t: g[1], h: tai(HUONG_8, g[2]), l: tai(LOAI_NHA_THE, g[3]), m: tai(MUC_THE, g[4]),
      p: (g[5] as unknown[][]).map((r) => [tai(PHONG_THE, r[0]), tai(CUNG_9, r[1]), tai(MUC_THE, r[2])]),
      d: new Date(NGAY_GOC + Number(g[6]) * 86_400_000).toISOString().slice(0, 10),
    });
    return (homNay.getTime() - Date.parse(nd.d)) / 86_400_000 <= HAN_NGAY ? nd : null;
  } catch {
    return null;
  }
}

/** Mã ?tu= suy ra từ mã thẻ (tiền tố 2 chữ + 10 hex) — để ảnh (QR), trang nhận và nút chia sẻ cùng một mã gán nguồn
 *  mà không cần lưu gì. Chỉ là nhãn đo lường (không bí mật), không định danh người. */
export function tuTuMa(tienTo: string, ma: string): string {
  return `${tienTo}.${createHash("sha256").update(`tu|${ma}`).digest("hex").slice(0, 10)}`;
}
