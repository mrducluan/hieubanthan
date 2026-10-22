// Việc chạy theo lịch (Vercel Cron, Bearer CRON_SECRET). Vercel Hobby chỉ cho 2 cron / project → gom việc hằng ngày vào
// MỘT route /api/cron/hang-ngay (8:03 sáng giờ VN: gửi nhắc Web Push rồi dọn dữ liệu hết hạn); đối soát thanh toán giữ
// cron riêng. Các route lẻ (/api/cron/nhac-day, /api/cron/don-du-lieu-hoc) vẫn còn để chạy tay từng việc.
import { timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { goiThongBao, guiPush, homNayVn, khoaVapid, type DangKyPush, type KetQuaGui } from "@/lib/web-push";

export function dungKhoaCron(req: Request): boolean {
  const bi = process.env.CRON_SECRET;
  const dua = req.headers.get("authorization") ?? "";
  if (!bi || bi.length < 16) return false;
  const a = Buffer.from(dua), b = Buffer.from(`Bearer ${bi}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Hang = { user_id: string; nhac: { nhan: string; duong: string | null }[]; thiet_bi: (DangKyPush & { id: string })[] };

/** KC-4 GĐ1: gửi Web Push cho người có mốc nhac_viec đúng hôm nay (giờ VN) và đã bật nhắc (push_dang_ky, 0019).
 *  ≤ 1 thông báo / người / ngày — SQL loại người đã gửi nên chạy lại không trùng. Thiếu VAPID → bỏ qua (không lỗi). */
export async function guiNhacNgay(dv: SupabaseClient): Promise<Record<string, unknown>> {
  const k = khoaVapid();
  const ngay = homNayVn();
  if (!k) return { ngay, bo_qua: "chưa đặt khoá VAPID" };
  const { data, error } = await dv.rpc("push_hang_doi", { p_ngay: ngay });
  if (error) return { ngay, loi: "Chưa đọc được hàng đợi (chạy migration 0018 + 0019?)" };
  const dem: Record<KetQuaGui, number> = { ok: 0, het_han: 0, loi: 0 };
  const hang = (data ?? []) as Hang[];
  // Từng lô 10 người — đủ nhanh cho vài nghìn người trong 60 giây, không dồn hàng nghìn kết nối một lúc.
  for (let i = 0; i < hang.length; i += 10) {
    await Promise.all(hang.slice(i, i + 10).map(async (h) => {
      const goi = goiThongBao(h.nhac, ngay);
      for (const tb of h.thiet_bi ?? []) {
        const kq = await guiPush(tb, goi, k);
        dem[kq] += 1;
        await dv.rpc("push_ket_qua", { p_id: tb.id, p_ngay: ngay, p_ket_qua: kq });
      }
    }));
  }
  return { ngay, nguoi: hang.length, ...dem };
}

/** TS-V3 / LG-ĐS / KC-4: xoá thật dữ liệu hết hạn đúng thời hạn ghi trong Chính sách quyền riêng tư — góp ý > 12 tháng,
 *  ký ức > 180 ngày (0016); phiếu kiểm chứng > 24 tháng, bài luận đã lưu > 365 ngày (0017); mốc nhắc > 400 ngày (0018).
 *  Migration nào chưa chạy → mục đó null. */
export async function donDuLieuHoc(dv: SupabaseClient): Promise<{ ok: boolean; ket_qua: Record<string, unknown> }> {
  const { data, error } = await dv.rpc("don_du_lieu_hoc");
  if (error) return { ok: false, ket_qua: { loi: "Chưa dọn được (chạy migration 0016?)" } };
  const tv = await dv.rpc("don_du_lieu_hoc_tuvi");
  const nv = await dv.rpc("don_nhac_viec");
  return { ok: true, ket_qua: { ...(data as object), tuvi: tv.error ? null : tv.data, nhac_viec: nv.error ? null : nv.data } };
}
