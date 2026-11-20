// POST /api/doanh-chu/moi — tạo mã mời đội ngũ có chữ ký HMAC-SHA256 & nonce riêng (hạn 7 ngày, không lưu DB).
import { NextResponse } from "next/server";
import { z } from "zod";
import { kyLoiMoiDoiNgu } from "@/lib/doanh-chu-ma";
import { laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  ten_nhom: z.string().trim().min(1).max(50).default("Đội ngũ cốt cán"),
}).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  }
  const { ma, noi_dung } = kyLoiMoiDoiNgu(parsed.data.ten_nhom);
  return NextResponse.json({
    ma_moi: ma,
    ten_nhom: noi_dung.ten_nhom,
    het_han: noi_dung.exp,
    phien_ban_dong_y: noi_dung.phien_ban_dong_y,
  });
}
