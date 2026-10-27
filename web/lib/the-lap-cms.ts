// CTA-2 — phía máy chủ: đọc cấu hình "Lối đi tiếp cuối trang" từ CMS (cache cùng thẻ "cms" — webhook CMS xoá ngay khi
// sửa) và, khi ban biên tập bật "Tự xếp theo lượt bấm", tỉ lệ bấm từng thẻ bù 28 ngày từ PostHog (cache 6 giờ; thiếu
// khoá / lỗi → không xếp lại). Hàm chọn thẻ vẫn thuần (lib/the-lap.ts).
import { unstable_cache } from "next/cache";
import { goiCms } from "@/lib/cms";
import { cauHinhTuCms, CAU_HINH_MAC_DINH, type CauHinhLoiDi } from "@/lib/loi-di-tiep";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";
import { hogql } from "@/lib/so-lieu-ngoai";
import type { TuyChonLap } from "@/lib/the-lap";

export async function cauHinhLoiDi(): Promise<CauHinhLoiDi> {
  const g = await goiCms<unknown>("/api/globals/loi-di-tiep?depth=0", { hanMs: 1_500 });
  return g ? cauHinhTuCms(g) : CAU_HINH_MAC_DINH;
}

/** Ngưỡng mẫu: một thẻ cần ≥ MAU_THE lượt thấy mới được xếp theo số (ít hơn → giữ thứ tự biên tập). */
export const MAU_THE = 30;
/** Tỉ lệ bấm làm mượt (Laplace) — thẻ mới ít lượt thấy không nhảy lên đầu vì 1 cú bấm may mắn. */
export const tiLeMuot = (bam: number, thay: number) => (bam + 1) / (thay + 20);

export function tinhTiLe(rows: [unknown, unknown, unknown][]): Record<string, number> {
  const ra: Record<string, number> = {};
  for (const [den, thay, bam] of rows) {
    const t = Number(thay), b = Number(bam);
    if (typeof den === "string" && den.startsWith("/") && t >= MAU_THE) ra[den] = tiLeMuot(b, t);
  }
  return ra;
}

const tiLeCache = unstable_cache(async () => tinhTiLe(await hogql<[unknown, unknown, unknown]>(
  `SELECT toString(properties.den) AS den, countIf(event = 'end_cta_viewed'), countIf(event = 'end_cta_clicked')
   FROM events WHERE timestamp > now() - INTERVAL 28 DAY AND event IN ('end_cta_viewed', 'end_cta_clicked')
     AND properties.lap = 1 GROUP BY den LIMIT 500`)), ["cta2-ti-le"], { revalidate: 6 * 3600 });

export async function tiLeBam(): Promise<Record<string, number>> {
  try { return await tiLeCache(); } catch { return {}; }
}

/** Gói cấu hình + tỉ lệ cho theLap()/theLapBlog() ở trang máy chủ. */
export async function boLap(): Promise<Required<Pick<TuyChonLap, "cauHinh">> & Pick<TuyChonLap, "tiLe">> {
  const cauHinh = await cauHinhLoiDi();
  return { cauHinh, tiLe: cauHinh.tu_xep ? await tiLeBam() : undefined };
}

/** Như boLap() + thẻ ưu tiên của URL `duong` (tab "Lối đi tiếp" của Trang website). Không có `duong` → không ưu tiên. */
export async function boLapTrang(duong?: string | null): Promise<Required<Pick<TuyChonLap, "cauHinh" | "uuTien">> & Pick<TuyChonLap, "tiLe">> {
  const [b, nd] = await Promise.all([boLap(), duong ? layNoiDungTrang(duong).catch(() => null) : Promise.resolve(null)]);
  return { ...b, uuTien: nd?.loiDiTiep ?? [] };
}
