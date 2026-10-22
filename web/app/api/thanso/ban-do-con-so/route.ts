// POST /api/thanso/ban-do-con-so — gói Sao "Bản đồ con số" (Luận giải toàn bộ thần số): chương Tổng quan miễn phí,
// Nghịch lý bên trong · 12 tháng tới · Sự nghiệp & tiền bạc mở bằng Sao khi bật thu Sao (lib/luan-giai-sao). Engine
// ghép từ CALC + KB, không lưu. Tầng HỌC (rà 2026-10-22): kèm tỉ lệ công khai + phiếu của chính người xem cho mã
// `ds.thanso.*` để engine hạ/xếp hộp như Tử vi, Bát tự (không vào khoá "đã mở hôm nay").
import { z } from "zod";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";

const Input = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
}).strict();

// Khoá "đã mở hôm nay" chỉ theo NGƯỜI (tên chính + ngày sinh): đổi cách tính Đường đời hay thêm tên thường gọi trong ngày
// không bị trừ Sao lần hai (báo cáo chỉ đọc tên chính).
const khoaTheoNguoi = (d: Record<string, unknown>) => [(d.ho_ten as string[])[0], d.ngay, d.thang, d.nam];

export function POST(req: Request) {
  return luanGiaiCoSao(req, Input, "/v1/thanso/ban-do-con-so", "thanso", khoaTheoNguoi,
    () => themHocLuanGiai({ loai: "doi_song", tienTo: "ds.thanso." }));
}
