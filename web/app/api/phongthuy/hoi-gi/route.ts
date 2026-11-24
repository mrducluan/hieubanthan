// /api/phongthuy/hoi-gi — HG-1 "Hỏi gì xem nấy".
// GET: danh mục sáu câu hỏi (chữ từ KB engine, cache dài). POST: câu trả lời riêng cho một câu từ hồ sơ nhà trên máy
// (hướng, năm xây, dấu hiệu đã khai) + năm sinh — engine dựng từ phép tính có sẵn; web chỉ kiểm đầu vào và vẽ. Không lưu.
import { NextResponse } from "next/server";
import { z } from "zod";
import { engineTheoReq, goiEngine } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const HUONG = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] as const;
const DauHieu = z.object({
  co: z.boolean(),
  nguon: z.enum(["nguoi_dung", "anh", "video"]).optional(),
  xac_nhan: z.boolean().optional(),
}).strict();
const Input = z.object({
  ma: z.enum(["cua_chinh", "bo_cuc", "gia_dinh", "han_nam", "so_sanh", "mo_quan"]),
  nha: z.object({
    huong_do: z.number().min(0).lt(360).optional(),
    huong: z.enum(HUONG).optional(),
    nam_xay: z.number().int().min(1864).max(2150).optional(),
    loai_nha: z.enum(["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"]).optional(),
    bo_cuc: z.object({
      dau_hieu: z.record(z.string().regex(/^[a-z0-9_]{2,40}$/), DauHieu).optional(),
      vi_tri: z.record(z.string().regex(/^[a-z_]{2,30}$/), z.string().max(20)).optional(),
    }).strict().optional(),
  }).strict().optional(),
  sinh: z.object({
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(["nam", "nu"]),
    moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
  }).strict().optional(),
  nguoi_2: z.object({ nam: z.number().int().min(1900).max(2100), gioi_tinh: z.enum(["nam", "nu"]) }).strict().optional(),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/hoi-gi");
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const nn = engineTheoReq(req, "/v1/phongthuy/hoi-gi");
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 21_600 },
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được danh sách câu hỏi." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=600, s-maxage=21600", vary: "x-ngon-ngu" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được danh sách câu hỏi." }, { status: 502 });
  }
}
