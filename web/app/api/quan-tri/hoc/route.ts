// POST /api/quan-tri/hoc — TS-V3 tầng HỌC: biên tập / chủ sở hữu đổi trạng thái một cụm góp ý "chưa đúng"
// (theo dõi → chờ duyệt → đã sửa / bỏ qua) và ghi luật đề xuất. Không bao giờ tự sửa KB: sửa ở Kho tri thức (PR).
import { NextResponse } from "next/server";
import { z } from "zod";
import { congApi, loiSql } from "@/lib/quan-tri-api";

const DauVao = z.object({
  id: z.number().int().positive(),
  trang_thai: z.enum(["theo_doi", "cho_duyet", "da_sua", "bo_qua"]),
  luat: z.string().trim().max(1000).optional(),
}).strict();

export async function POST(req: Request) {
  const p = await congApi(req, ["chu_so_huu", "bien_tap"]);
  if (p instanceof NextResponse) return p;
  const vao = DauVao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });
  const { error } = await p.sb.rpc("qt_cap_nhat_cum", { p_id: vao.data.id, p_trang_thai: vao.data.trang_thai, p_luat: vao.data.luat || null });
  if (error) return loiSql(error);
  return NextResponse.json({ ok: true });
}
