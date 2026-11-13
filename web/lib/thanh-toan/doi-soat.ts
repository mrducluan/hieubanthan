// Đối soát Pay2S (phòng IPN lỡ): Pay2S không có API tra đơn → đọc lịch sử giao dịch ngân hàng, tìm khoản tiền VÀO
// mang đúng mã chuyển khoản của đơn rồi cộng Sao bằng hàm SQL (idempotent theo mã đơn, tự so số tiền với đơn).
import type { SupabaseClient } from "@supabase/supabase-js";
import { cauHinhPay2s, lichSuGiaoDich, timGiaoDich, type GiaoDichNh } from "@/lib/thanh-toan/pay2s";

type DonCho = { ma_don: number; tao_luc: string };

async function ghiNhan(dv: SupabaseClient, maDon: number, g: GiaoDichNh): Promise<boolean> {
  const { data } = await dv.rpc("nap_sao_tu_cong", {
    p_ma_don: maDon, p_so_tien: g.amount, p_cong: "pay2s", p_ma_giao_dich: `p2s-ls:${g.id}`.slice(0, 100),
  });
  return (data as { ket_qua?: string } | null)?.ket_qua === "da_nap";
}

/** Một đơn (người mua đang chờ ở trang kết quả). true nếu vừa cộng Sao. Lỗi mạng / chưa thấy tiền → false. */
export async function doiSoatMotDon(dv: SupabaseClient, don: DonCho): Promise<boolean> {
  const c = cauHinhPay2s();
  if (!c) return false;
  try {
    const g = timGiaoDich(await lichSuGiaoDich(c, new Date(don.tao_luc)), don.ma_don);
    return g ? await ghiNhan(dv, don.ma_don, g) : false;
  } catch (e) {
    console.error("[pay2s doi-soat]", e instanceof Error ? e.message : "lỗi"); // không có khoá trong thông báo
    return false;
  }
}

/** Nhiều đơn (cron): đọc lịch sử MỘT lần từ ngày của đơn cũ nhất. Trả số đơn vừa cộng Sao. */
export async function doiSoatNhieuDon(dv: SupabaseClient, ds: DonCho[]): Promise<number> {
  const c = cauHinhPay2s();
  if (!c || !ds.length) return 0;
  const cuNhat = ds.reduce((a, d) => (d.tao_luc < a ? d.tao_luc : a), ds[0]!.tao_luc);
  let gd: GiaoDichNh[];
  try { gd = await lichSuGiaoDich(c, new Date(cuNhat)); } catch (e) {
    console.error("[pay2s doi-soat]", e instanceof Error ? e.message : "lỗi");
    return 0;
  }
  let n = 0;
  for (const d of ds) {
    const g = timGiaoDich(gd, d.ma_don);
    if (g && (await ghiNhan(dv, d.ma_don, g).catch(() => false))) n++;
  }
  return n;
}
