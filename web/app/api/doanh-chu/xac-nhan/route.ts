// POST /api/doanh-chu/xac-nhan — nhân sự tự mở link mời trên thiết bị của mình, tự bấm đồng ý (Nghị định 13/2023/NĐ-CP)
// và nhận lại `tv_token` mã hóa AES-256-GCM (không lộ ngày sinh cho ông chủ, không lưu DB).
import { NextResponse } from "next/server";
import { z } from "zod";
import { docLoiMoiDoiNgu, maHoaDongYThanhVien } from "@/lib/doanh-chu-ma";
import { laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  ma_moi: z.string().trim().min(10).max(600),
  biet_danh: z.string().trim().min(1).max(40),
  vai_tro: z.string().trim().max(60).default(""),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1930).max(2025),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  dong_y_tu_nguyen: z.literal(true),
}).strict();

function ngayHopLe(nam: number, thang: number, ngay: number): boolean {
  const d = new Date(Date.UTC(nam, thang - 1, ngay));
  return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay;
}

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  }
  const { ma_moi, biet_danh, vai_tro, ngay, thang, nam, gioi_tinh } = parsed.data;
  if (!ngayHopLe(nam, thang, ngay)) {
    return NextResponse.json({ error: loiChung("khong_hop_le", en) }, { status: 422 });
  }
  const moi = docLoiMoiDoiNgu(ma_moi);
  if (!moi) {
    return NextResponse.json(
      { error: en ? "Invite link is invalid or expired (7 days)." : "Liên kết mời không hợp lệ hoặc đã hết hạn (7 ngày)." },
      { status: 410 },
    );
  }
  const { tv_token, het_han } = maHoaDongYThanhVien({
    nonce: moi.nonce,
    biet_danh,
    vai_tro,
    ngay,
    thang,
    nam,
    gioi_tinh,
  });
  return NextResponse.json({
    tv_token,
    biet_danh,
    vai_tro,
    ten_nhom: moi.ten_nhom,
    het_han,
  });
}
