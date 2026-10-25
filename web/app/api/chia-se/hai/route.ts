// POST /api/chia-se/hai — TCS-1: mã có KÝ cho thẻ "Điểm hai người" (Xem lá số 2 người).
// Máy chủ tự gọi engine chấm lại (client không tự khai điểm được) rồi ký: mã CHỈ mang tên hiển thị người gửi (người dùng
// tự gõ, có thể trống), quan hệ, điểm tổng, mức, ≤ 3 tiêu chí (phần trăm). Ngày giờ sinh hai người chỉ đi qua lượt gọi
// để engine tính — không ghi vào mã, không lưu. Tên người kia KHÔNG nhận (NĐ 13/2023): client cũ còn gửi `ten_kia` thì
// zod bỏ trường lạ, mã không bao giờ mang tên người kia.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { kyMaHai, tuTuMa, TIEU_CHI_HAI } from "@/lib/ma-moi";
import { HopThamInput, HopThamOutput } from "../../tuvi/schema";

const Input = HopThamInput.extend({
  ten_ban: z.string().trim().max(24).default(""),
});

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_ban, ...hopTham } = p.data;
  const r = await goiEngineDaKiem(hopTham, "/v1/tuvi/hop-tham", dauNguoiGoi(req));
  if (!r.ok) return r.res;
  const out = HopThamOutput.safeParse(r.body);
  const d = out.success ? out.data.diem : null;
  if (!d) return NextResponse.json({ error: "Chưa có điểm để tạo thẻ." }, { status: 422 });
  // Ba tiêu chí cao nhất trong số đã tính (bằng nhau thì theo thứ tự cố định của engine).
  const c = d.tieu_chi
    .filter((t) => t.tinh && t.toi_da > 0)
    .map((t) => [t.ma, Math.round((t.diem / t.toi_da) * 100)] as [(typeof TIEU_CHI_HAI)[number], number])
    .sort((x, y) => y[1] - x[1] || TIEU_CHI_HAI.indexOf(x[0]) - TIEU_CHI_HAI.indexOf(y[0]))
    .slice(0, 3);
  if (!c.length) return NextResponse.json({ error: "Chưa có điểm để tạo thẻ." }, { status: 422 });
  try {
    const ma = kyMaHai({ a: ten_ban, q: hopTham.quan_he, p: d.tong, m: d.muc, c });
    return NextResponse.json({ ma, tu: tuTuMa("hp", ma) });
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("LOI_MOI_SECRET") ? e.message : "Chưa tạo được thẻ.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
