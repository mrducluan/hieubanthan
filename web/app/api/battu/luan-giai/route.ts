// POST /api/battu/luan-giai — LG: luận giải toàn bộ theo chương (engine ghép, không lưu). Trừ Sao khi bật công tắc (lib/luan-giai-sao).
// BT-ĐS: báo cáo "đời sống" cùng khung Tử vi — kèm `trong_so` (bảng tỉ lệ "Đúng với mình" công khai, ≥ 30 phiếu) và
// `ca_nhan` (phiếu của chính người xem khi đã đăng nhập) như Tử vi; hai trường không tính vào khoá "đã mở hôm nay".
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";

const Input = z.object({ la_so: LaSoVao }).strict();

// AI diễn đạt từng chương chạy song song phía engine (mỗi chương ≤ 40 giây).
export const maxDuration = 60;

export function POST(req: Request) {
  return luanGiaiCoSao(req, Input, "/v1/battu/luan-giai", "battu", undefined, themHocLuanGiai);
}
