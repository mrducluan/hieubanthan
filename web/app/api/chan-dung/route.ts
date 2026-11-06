// POST /api/chan-dung — CD-1 "Chân dung tổng hợp" (Tử vi · Bát tự · Nhân tướng theo mảng đời). Engine chỉ đọc mức ba báo
// cáo đã chấm, không lưu. Chương 1 (ma trận + mảng cùng thấy) miễn phí; chương sau mở bằng Sao khi công tắc chung bật —
// cùng giá / luồng `luanGiaiCoSao` với Luận giải toàn bộ (mô-đun "chan_dung"). Kèm `trong_so` / `ca_nhan` (tầng HỌC,
// mã `ds.*` — hộp mượn giữ mã của môn gốc nên phiếu về đúng môn) — không tính vào khoá "đã mở hôm nay".
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";

const MA = z.string().regex(/^[a-z0-9_]{2,40}$/);
const Input = z.object({
  la_so: LaSoVao,
  tra_loi: z.record(MA, MA).refine((o) => Object.keys(o).length <= 60).optional(),
}).strict();

export const maxDuration = 30;

export function POST(req: Request) {
  return luanGiaiCoSao(req, Input, "/v1/chan-dung", "chan_dung", undefined,
    () => themHocLuanGiai({ loai: "doi_song", tienTo: "ds." }));
}
