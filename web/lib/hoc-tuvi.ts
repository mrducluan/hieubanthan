// LG-ĐS tầng HỌC Tử vi (migration 0017) — phần MÁY CHỦ dùng chung cho các route kiểm chứng, luận giải, kho vectơ.
// Không import ở trình duyệt (dùng node:crypto + service role).
//   * khoaHoc(): khoá ẩn danh của người bấm = HMAC-SHA256(bí mật máy chủ, user_id | IP) — không lưu IP, không lộ user_id.
//   * bangTyLe(): mọi mã ≥ 30 phiếu (≤ 5000) — cache 1 giờ, dùng cho "x% thấy đúng" công khai + trọng số luận giải.
//   * phieuCuaToi(): phiếu của chính người đang đăng nhập (RLS chủ sở hữu) — luận giải hạ hộp họ đã bấm "chưa đúng".
// Thiếu Supabase / bí mật / chưa chạy 0017 → trả rỗng / null, KHÔNG làm vỡ trang.
import { createHmac } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { biMat, phienNguoiDung } from "@/lib/cua-sao";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { MAU_KIEM_CHUNG } from "@/lib/kiem-chung";

export type TyLe = Record<string, { dung: number; chua_dung: number }>;
export type PhieuCaNhan = Record<string, "dung" | "chua_dung">;

export const MO_HINH_NHUNG = "bam512_v1";
/** Ngưỡng cosine để nhận ý định gợi ý từ kho vectơ (mặc định 0,82 — doc LG-ĐS mục 4). Env `Y_DINH_NGUONG` (0,6–0,99)
 *  cho phép hạ khi số đo cho thấy câu diễn đạt khác chữ ít khi chạm 0,82 với vectơ băm `bam512_v1`. */
export const NGUONG_Y_DINH = Math.min(0.99, Math.max(0.6, Number(process.env.Y_DINH_NGUONG) || 0.82));

/** Khoá ẩn danh (64 hex). Đăng nhập → theo user_id; khách → theo IP. Không có bí mật / IP → null (không ghi). */
export function khoaHoc(req: Request, userId: string | null, mien = "kiem-chung"): string | null {
  const bi = biMat();
  if (!bi) return null;
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const nguon = userId ? `u|${userId}` : ip ? `ip|${ip}` : null;
  return nguon ? createHmac("sha256", bi).update(`${mien}|${nguon}`).digest("hex") : null;
}

async function docTyLe(): Promise<TyLe> {
  const dv = khachDichVu();
  if (!dv) return {};
  const { data, error } = await dv.rpc("ty_le_kiem_chung", { p_mau: null, p_toi_thieu: MAU_KIEM_CHUNG });
  if (error || !Array.isArray(data)) return {};
  const kq: TyLe = {};
  for (const d of (data as { mau: string; dung: number; chua_dung: number }[]).slice(0, 5000)) {
    kq[d.mau] = { dung: d.dung, chua_dung: d.chua_dung };
  }
  return kq;
}

/** Bảng tỉ lệ công khai (mã ≥ 30 phiếu), cache 1 giờ (thẻ "kiem-chung"). */
export const bangTyLe = unstable_cache(docTyLe, ["kiem-chung-ty-le"], { revalidate: 3600, tags: ["kiem-chung"] });

/** Phiếu "đời sống" + mọi loại của chính người dùng (RLS: chỉ thấy phiếu có user_id của mình). */
export async function phieuCuaToi(sb: SupabaseClient, userId: string): Promise<PhieuCaNhan> {
  // ≤ 500 phiếu mới nhất: engine nhận `ca_nhan` tối đa 500 mã (LuanGiaiInput) — vượt thì 422 và luận giải gọi lại
  // KHÔNG kèm cả `trong_so` lẫn `ca_nhan`.
  const { data, error } = await sb.from("kiem_chung_phieu").select("mau, ket_qua").eq("user_id", userId)
    .order("cap_nhat", { ascending: false }).limit(500);
  if (error || !data) return {};
  const kq: PhieuCaNhan = {};
  for (const d of data as { mau: string; ket_qua: "dung" | "chua_dung" }[]) kq[d.mau] = d.ket_qua;
  return kq;
}

/** LG-ĐS / BT-ĐS — phần đầu vào "tầng HỌC" cho luận giải đời sống (Tử vi, Bát tự): `trong_so` (bảng tỉ lệ công khai,
 *  mã ≥ 30 phiếu, cache 1 giờ) + `ca_nhan` (phiếu của chính người đang xem, khi đã đăng nhập). Không chữ người dùng nào
 *  đi vào engine; lỗi / chưa bật → `{}` (luận giải vẫn ra như thường). */
export async function themHocLuanGiai(tienTo?: string): Promise<Record<string, unknown>> {
  const [bangTat, phien] = await Promise.all([bangTyLe().catch(() => ({})), phienNguoiDung().catch(() => null)]);
  const caNhanTat = phien ? await phieuCuaToi(phien.sb, phien.user.id).catch(() => ({})) : {};
  // HỌC-ĐS: mảng khác Tử vi chỉ cần mã của mình (`ds.phongthuy.`, `ds.kinhdich.`) — gọn gói gửi engine.
  const loc = <T,>(o: Record<string, T>) => (tienTo ? Object.fromEntries(Object.entries(o).filter(([k]) => k.startsWith(tienTo))) : o);
  const bang = loc(bangTat), ca_nhan = loc(caNhanTat);
  const them: Record<string, unknown> = {};
  if (Object.keys(bang).length) them.trong_so = bang;
  if (Object.keys(ca_nhan).length) them.ca_nhan = ca_nhan;
  return them;
}

/** Nguồn gửi khác origin (form lạ trên trang khác) → chặn thao tác ghi bằng phiên cookie. */
export function khacNguon(req: Request): boolean {
  const o = req.headers.get("origin");
  return Boolean(o && o !== new URL(req.url).origin);
}

/** 8 ý định hỏi đáp Tử vi (khớp engine hoidap/tuvi.Y_DINH_CAU_HINH và SQL y_dinh_hop_le của 0017). */
export const Y_DINH_TUVI = ["di_hay_o", "tai_van", "hoc_hanh_con", "phan_van", "ba_thang_toi", "chon_thoi_diem",
  "tong_quan_nam", "hieu_ban_than"] as const;

/** Bộ đếm chống dội trong bộ nhớ (một phiên bản máy chủ): ≤ `tran` lượt / `cuaSoMs` theo IP băm. Không ghi đâu. */
export function taoHanMuc(tran: number, cuaSoMs = 10 * 60_000): (req: Request) => boolean {
  const dem = new Map<string, number[]>();
  return (req) => {
    const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
    const k = createHmac("sha256", "han-muc").update(ip).digest("base64url").slice(0, 16);
    const bay = Date.now();
    const ds = (dem.get(k) ?? []).filter((t) => bay - t < cuaSoMs);
    ds.push(bay);
    dem.set(k, ds);
    if (dem.size > 5000) dem.clear();
    return ds.length > tran;
  };
}
