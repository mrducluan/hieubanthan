// Việc chạy theo lịch (Vercel Cron, Bearer CRON_SECRET). Vercel Hobby chỉ cho 2 cron / project → gom việc hằng ngày vào
// MỘT route /api/cron/hang-ngay (8:03 sáng giờ VN: gửi nhắc Web Push rồi dọn dữ liệu hết hạn); đối soát thanh toán giữ
// cron riêng. Các route lẻ (/api/cron/nhac-day, /api/cron/don-du-lieu-hoc) vẫn còn để chạy tay từng việc.
import { timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { baoLoi } from "@/lib/giam-sat";
import { goiEngineDaKiem } from "@/lib/proxy";
import { ghepThongBao, guiPush, homNayVn, khoaVapid, type DangKyPush, type GoiSangNay, type KetQuaGui, type NguoiNhan } from "@/lib/web-push";

export function dungKhoaCron(req: Request): boolean {
  const bi = process.env.CRON_SECRET;
  const dua = req.headers.get("authorization") ?? "";
  if (!bi || bi.length < 16) return false;
  const a = Buffer.from(dua), b = Buffer.from(`Bearer ${bi}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Hang = NguoiNhan & { user_id: string; thiet_bi: (DangKyPush & { id: string })[] };

/** KC-4 GĐ1–GĐ2: gửi Web Push buổi sáng — mốc người dùng tự đánh dấu (nhac_viec, 0018), và nếu đã tự bật (0020): mốc
 *  lịch + "Sáng nay của bạn". ≤ 1 thông báo / thiết bị / ngày — SQL chỉ trả thiết bị chưa nhận nên chạy lại không trùng.
 *  Chưa chạy 0020 → hàng đợi 0019 (chỉ mốc tự đánh dấu). Thiếu VAPID → bỏ qua (không lỗi). */
export async function guiNhacNgay(dv: SupabaseClient): Promise<Record<string, unknown>> {
  const k = khoaVapid();
  const ngay = homNayVn();
  if (!k) return { ngay, bo_qua: "chưa đặt khoá VAPID" };
  let hang: Hang[];
  const v2 = await dv.rpc("push_hang_doi_v2", { p_ngay: ngay });
  if (!v2.error) {
    hang = (v2.data ?? []) as Hang[];
  } else {
    const v1 = await dv.rpc("push_hang_doi", { p_ngay: ngay });
    if (v1.error) return { ngay, loi: "Chưa đọc được hàng đợi (chạy migration 0018 + 0019?)" };
    hang = ((v1.data ?? []) as Hang[]).map((h) => ({ ...h, sang_nay: false, moc_lich: [], ngay_sinh: null }));
  }
  // Chữ sáng nay + mốc lịch: MỘT lời gọi engine cho cả lượt, chỉ gửi ngày-tháng sinh (không năm, không tên).
  let sn: GoiSangNay | null = null;
  if (hang.some((h) => h.sang_nay || h.moc_lich?.length)) {
    const ngaySinh = [...new Set(hang.map((h) => h.ngay_sinh).filter((x): x is string => Boolean(x)))];
    const r = await goiEngineDaKiem({ ngay_xem: ngay, ngay_sinh: ngaySinh }, "/v1/push/sang-nay");
    if (r.ok) sn = r.body as GoiSangNay;
  }
  const dem: Record<KetQuaGui | "loi_ghi" | "khong_co_gi", number> = { ok: 0, het_han: 0, loi: 0, loi_ghi: 0, khong_co_gi: 0 };
  // Từng lô 10 người — đủ nhanh cho vài nghìn người trong 60 giây, không dồn hàng nghìn kết nối một lúc. Mỗi thiết bị
  // gửi xong ghi ngay kết quả; ghi hỏng (loi_ghi) → thiết bị còn trong hàng đợi, lần chạy lại gửi tiếp (≤ 1 / thiết bị / ngày).
  for (let i = 0; i < hang.length; i += 10) {
    await Promise.all(hang.slice(i, i + 10).flatMap((h) => {
      const goi = ghepThongBao(h, sn, ngay);
      if (!goi) { dem.khong_co_gi += 1; return []; }
      return (h.thiet_bi ?? []).map(async (tb) => {
        const kq = await guiPush(tb, goi, k);
        dem[kq] += 1;
        const { error: e } = await dv.rpc("push_ket_qua", { p_id: tb.id, p_ngay: ngay, p_ket_qua: kq });
        if (e) dem.loi_ghi += 1;
      });
    }));
  }
  return { ngay, nguoi: hang.length, sang_nay: Boolean(sn), ...dem };
}

/** TS-V3 / LG-ĐS / KC-4: xoá thật dữ liệu hết hạn đúng thời hạn ghi trong Chính sách quyền riêng tư — góp ý > 12 tháng,
 *  ký ức > 180 ngày (0016); phiếu kiểm chứng > 24 tháng, bài luận đã lưu > 365 ngày (0017); mốc nhắc > 400 ngày (0018).
 *  Migration nào chưa chạy → mục đó null. */
export async function donDuLieuHoc(dv: SupabaseClient): Promise<{ ok: boolean; ket_qua: Record<string, unknown> }> {
  // Rà vòng HỌC 2026-10-22: ba hàm dọn chạy ĐỘC LẬP — trước đây 0016 lỗi thì dừng ngay, phiếu kiểm chứng (0017) và mốc
  // nhắc việc (0018) không bao giờ được dọn. Hàm chưa có (migration chưa chạy, PGRST202) → null; lỗi khác báo Sentry
  // (chỉ tên hàm).
  const [ts, tv, nv] = await Promise.all(["don_du_lieu_hoc", "don_du_lieu_hoc_tuvi", "don_nhac_viec"].map(async (ham) => {
    const { data, error } = await dv.rpc(ham);
    if (error && error.code !== "PGRST202") baoLoi(new Error(`cron_don_${ham}`), { noi: "cron", duong: "/api/cron/don-du-lieu-hoc" });
    return error ? null : data;
  }));
  if (ts === null && tv === null && nv === null) {
    return { ok: false, ket_qua: { loi: "Chưa dọn được (chạy migration 0016–0018?)" } };
  }
  return { ok: true, ket_qua: { ...(ts as object | null ?? {}), tuvi: tv, nhac_viec: nv } };
}
