// POST /api/thanso/kabbalah — TS-V3: thần số Qabalah Hermetic (con đường tên 1–22, Sephirah tên + ngày sinh); engine tính, không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/kabbalah");
}
