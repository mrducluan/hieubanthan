// POST /api/thanso/ngu-canh — TS-V3: gói ngữ cảnh ba phái cho một câu hỏi (thay fn_assemble_llm_context_payload_v3 của bản
// SQL). Qua HieuBanNumerologyEngineService (bản chạy được của tệp 08). Không lưu.
import { NextResponse } from "next/server";
import { z } from "zod";
import { HieuBanNumerologyEngineService } from "@/lib/services/numerology-engine.service";
import { dauNguoiGoi } from "@/lib/proxy";

const Input = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  cau_hoi: z.string().min(3).max(400),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
}).strict();

export async function POST(req: Request) {
  const v = Input.safeParse(await req.json().catch(() => null));
  if (!v.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const d = v.data;
  try {
    const sv = new HieuBanNumerologyEngineService(dauNguoiGoi(req));
    const ngay = `${d.nam}-${String(d.thang).padStart(2, "0")}-${String(d.ngay).padStart(2, "0")}`;
    return NextResponse.json(await sv.consultUser(d.ho_ten.join("|"), ngay, d.cau_hoi, { quyUoc: d.quy_uoc_duong_doi }));
  } catch {
    return NextResponse.json({ error: "Chưa dựng được ngữ cảnh lúc này." }, { status: 502 });
  }
}
