// POST /api/giao-thoa — HTT-1: "Điểm giao thoa từ điều bạn đã xác nhận". Trình duyệt gửi CHỈ mã hộp đã bấm "Đúng với mình /
// Chưa đúng" trong phiên (không chữ, không lá số); máy chủ thêm phiếu đã lưu của chính người đang đăng nhập (`ca_nhan`, RLS)
// + bảng tỉ lệ công khai rồi chuyển cho engine /v1/giao-thoa (tất định, ngôn ngữ theo `ngon_ngu`). Không lưu gì.
import { NextResponse } from "next/server";
import { z } from "zod";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { MA_DOI_SONG } from "@/lib/kiem-chung";

const Input = z.object({
  phieu: z.array(z.object({
    ma: z.string().regex(MA_DOI_SONG).max(60),
    ket_qua: z.enum(["dung", "chua_dung"]),
  }).strict()).max(200),
  ngon_ngu: z.enum(["vi", "en"]).default("vi"),
}).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const hoc = await themHocLuanGiai({ loai: "doi_song", tienTo: "ds." }).catch(() => ({}));
  const kq = await goiEngineDaKiem({ phieu: p.data.phieu, ...hoc }, "/v1/giao-thoa",
    { ...dauNguoiGoi(req), "x-ngon-ngu": p.data.ngon_ngu });
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body);
}
