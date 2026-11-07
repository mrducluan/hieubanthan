// GET /api/cron/hang-ngay — cron ngày duy nhất (Vercel Hobby chỉ cho 2 cron): 8:03 sáng giờ VN dọn dữ liệu học hết hạn
// rồi gửi nhắc Web Push (KC-4 GĐ1), cuối cùng nhờ CMS nhập bài NotFair mới thành nháp (BLOG-9d). Vercel Cron gửi Bearer CRON_SECRET. Từng việc chạy tay: /api/cron/nhac-day,
// /api/cron/don-du-lieu-hoc.
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { capSaoHoiVien, donDuLieuHoc, dungKhoaCron, guiNhacNgay, tuDongNotFairCms } from "@/lib/cron";

export const maxDuration = 60;

export async function GET(req: Request) {
  const bat = Date.now();
  if (!dungKhoaCron(req)) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình" }, { status: 503 });
  const don = await donDuLieuHoc(dv);   // dọn trước: cam kết xoá đúng hạn không phụ thuộc gửi nhắc chậm
  const nhac = await guiNhacNgay(dv);
  const hoi_vien = await capSaoHoiVien(dv);   // SAO-HV: Sao tháng cho hội viên chưa mở trang trong tháng
  // BLOG-9d: chạy CUỐI, dùng thời gian còn lại (trần hàm 60 giây) — nhập + chuẩn hoá bài NotFair mới thành nháp.
  const blog = await tuDongNotFairCms(55_000 - (Date.now() - bat));
  // BLOG-9e: ghi kết quả nhập bài ra log Vercel (chỉ slug + điểm / lý do bỏ qua — không bí mật, không dữ liệu người dùng).
  console.log("[cron hang-ngay] blog", JSON.stringify(blog));
  return NextResponse.json({ nhac, don: don.ket_qua, hoi_vien, blog }, { status: don.ok ? 200 : 502 });
}
