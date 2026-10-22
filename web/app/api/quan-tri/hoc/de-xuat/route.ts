// POST /api/quan-tri/hoc/de-xuat — Q7: người duyệt đánh dấu một dòng hàng đợi "đề xuất luật" (duyet_de_xuat_luat, migration
// 0022 — DB kiểm vai trò + MFA, ghi nhật ký quản trị). Máy chỉ gom số; người sửa KB / luật qua PR rồi đánh dấu ở đây.
import { NextResponse } from "next/server";
import { z } from "zod";
import { congApi, loiSql } from "@/lib/quan-tri-api";

const DauVao = z.object({
  id: z.number().int().positive(), trang_thai: z.enum(["cho_duyet", "da_sua", "bo_qua"]), ghi_chu: z.string().trim().max(500).optional(),
}).strict();

export async function POST(req: Request) {
  const p = await congApi(req, ["chu_so_huu", "bien_tap"]);
  if (p instanceof NextResponse) return p;
  const vao = DauVao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });
  const { error } = await p.sb.rpc("duyet_de_xuat_luat", { p_id: vao.data.id, p_trang_thai: vao.data.trang_thai, p_ghi_chu: vao.data.ghi_chu ?? null });
  if (error) return loiSql(error);
  return NextResponse.json({ ok: true });
}
