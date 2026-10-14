// POST /api/chia-se/ngay — NHIP-1: mã có KÝ cho thẻ "Hôm nay {tên} là Ngày cá nhân N — còn bạn?".
// Máy chủ tự gọi engine tính số (client không tự khai số được); mã chỉ mang tên hiển thị + số ngày + chủ đề + ngày xem.
import { NextResponse } from "next/server";
import { z } from "zod";
import { goiEngineDaKiem } from "@/lib/proxy";
import { kyMaNgay } from "@/lib/ma-moi";

const Input = z.object({
  ten_hien_thi: z.string().trim().min(1).max(40),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
}).strict();

interface NhipEngine { ngay_xem: string; ngay_ca_nhan: { so: number; nghia: string | null } }

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_hien_thi, ...sinh } = p.data;
  const r = await goiEngineDaKiem(sinh, "/v1/thanso/nhip");
  if (!r.ok) return r.res;
  const d = r.body as NhipEngine;
  const k = (d.ngay_ca_nhan.nghia ?? "").replace(/^Ngày cá nhân \d+:\s*/, "").replace(/\.$/, "").slice(0, 90);
  try {
    return NextResponse.json({ ma: kyMaNgay({ t: ten_hien_thi, n: d.ngay_ca_nhan.so, d: d.ngay_xem, ...(k ? { k } : {}) }), ngay: d.ngay_xem });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Chưa tạo được thẻ." }, { status: 502 });
  }
}
