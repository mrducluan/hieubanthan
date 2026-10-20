// Mã chia sẻ / lời mời có KÝ (HMAC-SHA256) — chỉ chạy phía server.
// Chỉ chứa tên hiển thị người dùng tự chọn + các con số đã tính (không ngày sinh, không user_id),
// nên không cần bảng lưu trữ: link tự mang dữ liệu teaser, chữ ký chống giả mạo.
// Xem docs/THIET-KE-UI.md §8 (quyết định: thay bảng loi_moi bằng mã có ký).
import { createHmac, timingSafeEqual } from "node:crypto";
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
