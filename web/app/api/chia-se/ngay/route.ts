// POST /api/chia-se/ngay — NHIP-1: mã có KÝ cho thẻ "Hôm nay {tên} là Ngày cá nhân N — còn bạn?".
// Máy chủ tự gọi engine tính số (client không tự khai số được); mã chỉ mang tên hiển thị + số ngày + chủ đề + ngày xem
// (TS-V3b: + số nổi bật qua ba phái khi có họ tên + thứ tự chữ Hebrew của ngày). Không mang họ tên, ngày sinh.
import { NextResponse } from "next/server";
import { z } from "zod";
import { goiEngineDaKiem } from "@/lib/proxy";
import { kyMaNgay } from "@/lib/ma-moi";

const Input = z.object({
  ten_hien_thi: z.string().trim().min(1).max(40),
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5).optional(),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
}).strict();

interface TheNgayEngine {
  ngay_xem: string; ngay_ca_nhan: { so: number; nghia: string | null };
  so_noi_bat: { goc: number } | null; chu_ngay: { chu: number; ten: string };
}

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_hien_thi, ...sinh } = p.data;
  const r = await goiEngineDaKiem(sinh, "/v1/thanso/the-ngay");
  if (!r.ok) return r.res;
  const d = r.body as TheNgayEngine;
  const k = (d.ngay_ca_nhan.nghia ?? "").replace(/^Ngày cá nhân \d+:\s*/, "").replace(/\.$/, "").slice(0, 90);
  try {
    return NextResponse.json({ ma: kyMaNgay({ t: ten_hien_thi, n: d.ngay_ca_nhan.so, d: d.ngay_xem, ...(k ? { k } : {}),
      ...(d.so_noi_bat ? { s: d.so_noi_bat.goc } : {}), h: d.chu_ngay.chu, hn: d.chu_ngay.ten }), ngay: d.ngay_xem });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Chưa tạo được thẻ." }, { status: 502 });
  }
}
