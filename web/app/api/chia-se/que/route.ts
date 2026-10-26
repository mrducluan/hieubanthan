// POST /api/chia-se/que — UI-KD 6: mã có KÝ cho thẻ "Quẻ của tôi". Máy chủ gọi engine `/v1/kinhdich/khoi-que` với đúng 6 giá
// trị hào (gieo tay, tất định — không ghi nhật ký hỏi đáp, không cần câu hỏi) để lấy tên quẻ bản / quẻ biến rồi ký: client
// không tự khai tên quẻ. Mã CHỈ mang tên hiển thị, 6 giá trị, tên quẻ, tên chủ đề (đối chiếu danh mục engine) — KHÔNG câu hỏi,
// KHÔNG giờ gieo, KHÔNG lời đọc.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { kyMaQue, tuTuMa } from "@/lib/ma-moi";
import { traLoiChiaSe } from "@/lib/loi-chia-se";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Input = z.object({
  gia_tri_hao: z.array(z.number().int().min(6).max(9)).length(6),
  chu_de: z.string().regex(/^[a-z_]{2,40}$/).optional(),
  ten_hien_thi: z.string().trim().max(24).default(""),
}).strict();

const Que = z.object({
  quai_ban: z.object({ ten: z.string().min(1).max(24) }).passthrough(),
  quai_bien: z.object({ ten: z.string().min(1).max(24) }).passthrough().nullable(),
}).passthrough();

async function tenChuDe(ma: string | undefined): Promise<string | null> {
  if (!ma) return null;
  try {
    const r = await fetch(`${ENGINE_URL}/v1/kinhdich/chu-de`, { headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}, next: { revalidate: 3600 } });
    const d = (await r.json().catch(() => null)) as { chu_de?: { ma: string; ten: string }[] } | null;
    const cd = d?.chu_de?.find((x) => x.ma === ma);
    return cd?.ten?.slice(0, 40) ?? null;
  } catch { return null; }
}

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { gia_tri_hao, chu_de, ten_hien_thi } = p.data;
  const [r, c] = await Promise.all([
    goiEngineDaKiem({ cau_hoi: "Thẻ chia sẻ quẻ", truong_phai: "nghia_ly", gia_tri_hao }, "/v1/kinhdich/khoi-que", dauNguoiGoi(req)),
    tenChuDe(chu_de),
  ]);
  if (!r.ok) return r.res;
  const q = Que.safeParse(r.body);
  if (!q.success) return NextResponse.json({ error: "Chưa đọc lại được quẻ." }, { status: 502 });
  try {
    const ma = kyMaQue({ t: ten_hien_thi, g: gia_tri_hao, q: q.data.quai_ban.ten, b: q.data.quai_bien?.ten ?? null, c });
    return NextResponse.json({ ma, tu: tuTuMa("qu", ma) });
  } catch (e) {
    return traLoiChiaSe(e, "que");
  }
}
