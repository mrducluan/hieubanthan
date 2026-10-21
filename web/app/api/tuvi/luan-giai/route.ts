// POST /api/tuvi/luan-giai — LG: luận giải toàn bộ theo chương (engine ghép, không lưu). Trừ Sao khi bật công tắc (lib/luan-giai-sao).
// LG-ĐS: kèm `trong_so` (bảng tỉ lệ "Đúng với mình" công khai, mã ≥ 30 phiếu, cache 1 giờ) và `ca_nhan` (phiếu của chính
// người đang xem, khi đã đăng nhập) — engine dùng để hiện "x% thấy đúng" và hạ hộp ít người thấy đúng / chính họ bấm
// "chưa đúng". Không chữ người dùng nào đi vào engine. Hai trường KHÔNG tính vào khoá "đã mở hôm nay" (SAO-2).
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";
import { phienNguoiDung } from "@/lib/cua-sao";
import { bangTyLe, phieuCuaToi } from "@/lib/hoc-tuvi";

const Input = z.object({ la_so: LaSoVao }).strict();

// AI diễn đạt từng chương chạy song song phía engine (mỗi chương ≤ 40 giây).
export const maxDuration = 60;

async function trongSo(): Promise<Record<string, unknown>> {
  const [bang, phien] = await Promise.all([bangTyLe().catch(() => ({})), phienNguoiDung().catch(() => null)]);
  const ca_nhan = phien ? await phieuCuaToi(phien.sb, phien.user.id).catch(() => ({})) : {};
  const them: Record<string, unknown> = {};
  if (Object.keys(bang).length) them.trong_so = bang;
  if (Object.keys(ca_nhan).length) them.ca_nhan = ca_nhan;
  return them;
}

export function POST(req: Request) {
  return luanGiaiCoSao(req, Input, "/v1/tuvi/luan-giai", "tuvi", undefined, trongSo);
}
