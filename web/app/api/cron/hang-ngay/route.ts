// GET /api/cron/hang-ngay — cron ngày duy nhất (Vercel Hobby chỉ cho 2 cron): 8:03 sáng giờ VN dọn dữ liệu học hết hạn
// rồi gửi nhắc Web Push (KC-4 GĐ1). Vercel Cron gửi Bearer CRON_SECRET. Từng việc chạy tay: /api/cron/nhac-day,
// /api/cron/don-du-lieu-hoc.
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { capSaoHoiVien, donDuLieuHoc, dungKhoaCron, guiNhacNgay } from "@/lib/cron";

export const maxDuration = 60;

export async function GET(req: Request) {
  if (!dungKhoaCron(req)) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình" }, { status: 503 });
  const don = await donDuLieuHoc(dv);   // dọn trước: cam kết xoá đúng hạn không phụ thuộc gửi nhắc chậm
  const nhac = await guiNhacNgay(dv);
  const hoi_vien = await capSaoHoiVien(dv);   // SAO-HV: Sao tháng cho hội viên chưa mở trang trong tháng
  return NextResponse.json({ nhac, don: don.ket_qua, hoi_vien }, { status: don.ok ? 200 : 502 });
}
