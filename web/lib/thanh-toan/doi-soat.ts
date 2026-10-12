// Đối soát với payOS: tra trạng thái đơn ở cổng; đã trả đủ thì cộng Sao (hàm SQL idempotent theo mã đơn).
import type { SupabaseClient } from "@supabase/supabase-js";
import { cauHinhPayos, traCuu } from "@/lib/thanh-toan/payos";

/** true nếu vừa cộng Sao. Lỗi mạng / chưa trả → false (lần sau thử lại). */
export async function doiSoatMotDon(dv: SupabaseClient, maDon: number): Promise<boolean> {
  const c = cauHinhPayos();
  if (!c) return false;
  try {
    const t = await traCuu(c, maDon);
    if (t.status !== "PAID") return false;
    const { data } = await dv.rpc("nap_sao_tu_cong", {
      p_ma_don: maDon, p_so_tien: t.amountPaid || t.amount, p_cong: "payos", p_ma_giao_dich: t.reference || `doi-soat:${maDon}`,
    });
    return (data as { ket_qua?: string } | null)?.ket_qua === "da_nap";
  } catch {
    return false;
  }
}
