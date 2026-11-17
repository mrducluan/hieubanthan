// UD-1 — đọc cấu hình đợt ưu đãi + đếm suất đã dùng (chỉ MÁY CHỦ). Đếm bằng service role trong sổ Sao: các dòng "dung"
// có ghi chú mang dấu của đợt (dauGhiChu) — không cần bảng mới. Không có service role / lỗi → không đếm được (null):
// ưu đãi vẫn chạy theo hạn chót, giao diện không hiện dòng suất (không bịa số).
import { layCauHinh } from "@/lib/cau-hinh";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { dauGhiChu, MA_HOP_LE, tinhUuDai, type CauHinhUuDai, type UuDai } from "@/lib/uu-dai";

const nho = new Map<string, { luc: number; so: number }>();
const NHO_MS = 30_000;

async function daDung(ma: string, tuoi: boolean): Promise<number | null> {
  if (!MA_HOP_LE.test(ma)) return null;
  const co = nho.get(ma);
  if (!tuoi && co && Date.now() - co.luc < NHO_MS) return co.so;
  const sb = khachDichVu();
  if (!sb) return null;
  try {
    const { count, error } = await sb.from("so_cai_sao").select("id", { count: "exact", head: true })
      .eq("loai", "dung").like("ghi_chu", `%${dauGhiChu(ma)}`);
    if (error || typeof count !== "number") return co?.so ?? null;
    nho.set(ma, { luc: Date.now(), so: count });
    return count;
  } catch { return co?.so ?? null; }
}

export async function cauHinhUuDai(): Promise<CauHinhUuDai> {
  const [bat, ten, giamPt, hetHan, soSuat, ma] = await Promise.all([
    layCauHinh<boolean>("luan_giai.uu_dai.bat"), layCauHinh<string>("luan_giai.uu_dai.ten"),
    layCauHinh<number>("luan_giai.uu_dai.giam_pt"), layCauHinh<string>("luan_giai.uu_dai.het_han"),
    layCauHinh<number>("luan_giai.uu_dai.so_suat"), layCauHinh<string>("luan_giai.uu_dai.ma"),
  ]);
  return { bat: Boolean(bat), ten: String(ten ?? ""), giamPt: Number(giamPt) || 0, hetHan: String(hetHan ?? ""), soSuat: Number(soSuat) || 0, ma: String(ma ?? "") };
}

/** Ưu đãi đang chạy cho một báo cáo giá `giaGoc` Sao; null = không có. `tuoi`: đếm suất mới (lúc sắp trừ Sao). Lỗi → null. */
export async function uuDaiCho(giaGoc: number, tuoi = false): Promise<UuDai | null> {
  try {
    const c = await cauHinhUuDai();
    if (!c.bat) return null;
    return tinhUuDai(c, giaGoc, c.soSuat > 0 ? await daDung(c.ma, tuoi) : null);
  } catch { return null; }
}
