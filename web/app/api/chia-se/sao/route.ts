// POST /api/chia-se/sao — CHANG-4: mã có KÝ cho thẻ "Bản đồ sao của tôi". Máy chủ gọi engine `/v1/chiem-tinh/ban-do` với
// ngày giờ / nơi sinh người dùng gửi (lib/sao-chia-se.ts) để đọc lại cung Mặt Trời / Mặt Trăng / Mọc rồi ký — client không
// tự khai cung. Mã CHỈ mang tên hiển thị + ba cung + mã biến thể câu mời — KHÔNG ngày giờ sinh, nơi sinh.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi } from "@/lib/proxy";
import { kyMaSao, tuTuMa } from "@/lib/ma-moi";
import { traLoiChiaSe } from "@/lib/loi-chia-se";
import { baCung, NguoiSao } from "@/lib/sao-chia-se";

const Input = NguoiSao.extend({ ten_hien_thi: z.string().trim().max(24).default("") }).strict();

export const maxDuration = 25;

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_hien_thi, ...nguoi } = p.data;
  const r = await baCung(nguoi, dauNguoiGoi(req));
  if (!r.ok) return r.res ?? NextResponse.json({ error: r.tuoi ? "Thẻ bản đồ sao dành cho người từ 16 tuổi." : "Chưa đọc lại được bản đồ sao." }, { status: r.tuoi ? 422 : 502 });
  if (!r.cung.s) return NextResponse.json({ error: "Ngày này Mặt Trời đổi cung — nhập giờ sinh để tạo thẻ." }, { status: 422 });
  try {
    const ma = kyMaSao({ t: ten_hien_thi, s: r.cung.s, m: r.cung.m, a: r.cung.a, b: Math.floor(Math.random() * 3) });
    return NextResponse.json({ ma, tu: tuTuMa("st", ma) });
  } catch (e) {
    return traLoiChiaSe(e, "sao");
  }
}
