// POST /api/chia-se/tao — tạo mã chia sẻ/lời mời có KÝ. Server tự gọi engine tính số (client không
// tự khai số được); link chỉ mang tên hiển thị + các con số, không mang ngày sinh (lib/ma-moi.ts).
import { NextResponse } from "next/server";
import { z } from "zod";
import { kyMa } from "@/lib/ma-moi";
import type { LuanGiaiResult } from "@/lib/engine";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Input = z.object({
  ten_hien_thi: z.string().trim().min(1).max(40),
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
}).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_hien_thi, ...nguoi } = p.data;
  try {
    const r = await fetch(`${ENGINE_URL}/v1/thanso/luan-giai`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}) },
      body: JSON.stringify(nguoi),
      cache: "no-store",
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tính được lúc này." }, { status: r.status });
    const kq = (await r.json()) as LuanGiaiResult;
    const so = kq.cac_vi_tri.map((v) => v.gia_tri);
    const k = kq.cac_vi_tri.find((v) => v.vi_tri === "duong_doi")?.nghia?.tu_khoa;
    return NextResponse.json({ ma: kyMa({ t: ten_hien_thi, so, ...(k ? { k } : {}) }) });
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("LOI_MOI_SECRET") ? e.message : "Không kết nối được máy tính toán.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
