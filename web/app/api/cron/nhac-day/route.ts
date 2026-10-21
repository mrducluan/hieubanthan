// GET /api/cron/nhac-day — KC-4 GĐ1: 8:03 sáng giờ VN gửi Web Push cho người có mốc nhac_viec đúng hôm nay và đã bật
// nhắc trên thiết bị (push_dang_ky, migration 0019). ≤ 1 thông báo / người / ngày (SQL loại người đã gửi → chạy lại
// không trùng). Nội dung chỉ nhãn do engine soạn + đường dẫn trong site. Vercel Cron gửi Bearer CRON_SECRET.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { goiThongBao, guiPush, homNayVn, khoaVapid, type DangKyPush, type KetQuaGui } from "@/lib/web-push";

export const maxDuration = 60;

function dungKhoa(req: Request): boolean {
  const bi = process.env.CRON_SECRET;
  const dua = req.headers.get("authorization") ?? "";
  if (!bi || bi.length < 16) return false;
  const a = Buffer.from(dua), b = Buffer.from(`Bearer ${bi}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Hang = { user_id: string; nhac: { nhan: string; duong: string | null }[]; thiet_bi: (DangKyPush & { id: string })[] };

export async function GET(req: Request) {
  if (!dungKhoa(req)) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  const dv = khachDichVu(), k = khoaVapid();
  if (!dv || !k) return NextResponse.json({ error: "Chưa cấu hình (Supabase service role / VAPID)" }, { status: 503 });
  const ngay = homNayVn();
  const { data, error } = await dv.rpc("push_hang_doi", { p_ngay: ngay });
  if (error) return NextResponse.json({ error: "Chưa đọc được hàng đợi (chạy migration 0018 + 0019?)" }, { status: 502 });
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
  return NextResponse.json({ ngay, nguoi: hang.length, ...dem });
}
