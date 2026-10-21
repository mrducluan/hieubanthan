// /api/luan-giai/tuy-chon — công tắc "tự lưu bài luận" của chính người dùng (bảng tuy_chon_hoc, RLS chủ sở hữu).
// Mặc định TẮT (không tích sẵn); mốc đồng ý do SQL đặt khi bật. GET → {tu_luu_luan_giai} · POST {tu_luu_luan_giai}.
import { NextResponse } from "next/server";
import { z } from "zod";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { khacNguon } from "@/lib/hoc-tuvi";

const Input = z.object({ tu_luu_luan_giai: z.boolean() }).strict();

export async function GET() {
  if (!coTaiKhoan()) return NextResponse.json({ ok: false, ly_do: "chua_bat", tu_luu_luan_giai: false });
  const phien = await phienNguoiDung();
  if (!phien) return NextResponse.json({ ok: true, dang_nhap: false, tu_luu_luan_giai: false });
  const { data, error } = await phien.sb.from("tuy_chon_hoc").select("tu_luu_luan_giai, dong_y_luc").maybeSingle();
  if (error) return NextResponse.json({ ok: false, ly_do: "chua_bat", tu_luu_luan_giai: false });
  return NextResponse.json({ ok: true, dang_nhap: true, tu_luu_luan_giai: Boolean(data?.tu_luu_luan_giai), dong_y_luc: data?.dong_y_luc ?? null },
    { headers: { "cache-control": "private, no-store" } });
}

export async function POST(req: Request) {
  if (khacNguon(req)) return NextResponse.json({ error: "Sai nguồn gửi." }, { status: 403 });
  if (!coTaiKhoan()) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
  const vao = Input.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const phien = await phienNguoiDung();
  if (!phien) return NextResponse.json({ error: "Đăng nhập để bật tự lưu.", can: "dang_nhap" }, { status: 401 });
  const { error } = await phien.sb.from("tuy_chon_hoc")
    .upsert({ user_id: phien.user.id, tu_luu_luan_giai: vao.data.tu_luu_luan_giai }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
  return NextResponse.json({ ok: true, tu_luu_luan_giai: vao.data.tu_luu_luan_giai });
}
