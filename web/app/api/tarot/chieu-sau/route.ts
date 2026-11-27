// POST /api/tarot/chieu-sau — Chặng 3.3B: Chiều sâu 56 lá Ẩn Phụ ngược & Phẩm giá nguyên tố.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  la: z.array(
    z.object({
      id: z.string().regex(/^[a-z]{3,4}_[a-z0-9_]{1,12}$/),
      nguoc: z.boolean().default(false),
    }).strict(),
  ).min(1).max(10),
}).strict();

export const maxDuration = 20;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/tarot/chieu-sau", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}
