// POST /api/chia-se/sao2 — CHANG-4: mã có KÝ cho thẻ "Hợp đôi chiêm tinh". Máy chủ gọi engine `/v1/chiem-tinh/hop-doi`
// (chủ đề tương tác) và `/v1/chiem-tinh/ban-do` cho từng người (cung Mặt Trời) rồi ký. Mã CHỈ mang tên người gửi (tuỳ
// chọn), cung Mặt Trời hai người, ≤ 3 chủ đề (mã + tên engine) — KHÔNG tên người kia, ngày giờ / nơi sinh, điểm số.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { kyMaSao2, tuTuMa } from "@/lib/ma-moi";
import { traLoiChiaSe } from "@/lib/loi-chia-se";
import { baCung, NguoiSao } from "@/lib/sao-chia-se";

const Nguoi = NguoiSao.pick({ ngay_sinh: true, gio_sinh: true, noi_sinh: true }).strict();
const Input = z.object({
  nguoi_a: Nguoi, nguoi_b: Nguoi, dong_y_tu_nguyen: z.literal(true),
  ten_hien_thi: z.string().trim().max(24).default(""),
}).strict();

const HopDoi = z.object({
  cac_chieu_tuong_tac: z.array(z.object({
    ma: z.string().regex(/^[a-z_]{3,30}$/), ten: z.string().min(1).max(80), goc_chieu: z.array(z.unknown()),
  }).passthrough()),
}).passthrough();

export const maxDuration = 25;

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { nguoi_a, nguoi_b, ten_hien_thi } = p.data;
  const hdr = dauNguoiGoi(req);
  const [h, a, b] = await Promise.all([
    goiEngineDaKiem({ nguoi_a, nguoi_b, dong_y_tu_nguyen: true }, "/v1/chiem-tinh/hop-doi", hdr),
    baCung(nguoi_a, hdr),
    baCung(nguoi_b, hdr),
  ]);
  if (!h.ok) return h.res;
  if (!a.ok) return a.res ?? NextResponse.json({ error: a.tuoi ? "Thẻ hợp đôi chiêm tinh dành cho người từ 16 tuổi." : "Chưa đọc lại được bản đồ sao." }, { status: a.tuoi ? 422 : 502 });
  if (!a.cung.s) return NextResponse.json({ error: "Ngày sinh của bạn Mặt Trời đổi cung — nhập giờ sinh để tạo thẻ." }, { status: 422 });
  const hd = HopDoi.safeParse(h.body);
  const chuDe = hd.success ? hd.data.cac_chieu_tuong_tac.filter((c) => c.goc_chieu.length > 0).slice(0, 3).map((c) => [c.ma, c.ten] as [string, string]) : [];
  if (!chuDe.length) return NextResponse.json({ error: "Chưa đọc lại được chỗ hai bản đồ sao tương tác." }, { status: 502 });
  try {
    const ma = kyMaSao2({ a: ten_hien_thi, s: a.cung.s, k: b.ok ? b.cung.s : null, c: chuDe });
    return NextResponse.json({ ma, tu: tuTuMa("sd", ma) });
  } catch (e) {
    return traLoiChiaSe(e, "sao2");
  }
}
