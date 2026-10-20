// POST /api/thanso/bao-cao-ba-phai — TS-V3b báo cáo ba phái theo chương (engine ghép, không lưu). Cùng khuôn Luận giải
// toàn bộ: chương đầu miễn phí, mở phần còn lại bằng Sao khi bật công tắc thu Sao (lib/luan-giai-sao). `phieu` = 3 con số
// đếm "phái nào nói đúng" trên máy người dùng — không định danh.
import { z } from "zod";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";

const Dem = z.number().int().min(0).max(1000);
const Input = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
  phieu: z.object({ pitago: Dem, chaldea: Dem, kabbalah: Dem }).strict().optional(),
}).strict();

// Khoá "đã mở hôm nay" bỏ phiếu (đổi sau mỗi lần bấm, khác nhau giữa các máy) — mở rồi thì xem lại trong ngày không trừ thêm.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const khoaKhongPhieu = ({ phieu, ...con }: Record<string, unknown>) => con;

export function POST(req: Request) {
  return luanGiaiCoSao(req, Input, "/v1/thanso/bao-cao-ba-phai", "thanso3", khoaKhongPhieu);
}
