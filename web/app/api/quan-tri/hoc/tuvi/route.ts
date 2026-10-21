// POST /api/quan-tri/hoc/tuvi — LG-ĐS: biên tập / chủ sở hữu bật, tắt hoặc trả về "chờ duyệt" một câu trong kho vectơ ý
// định Tử vi (duyet_cau_hoi_vec, migration 0017 — DB kiểm lại vai trò + MFA, ghi nhật ký quản trị).
import { NextResponse } from "next/server";
import { z } from "zod";
import { congApi, loiSql } from "@/lib/quan-tri-api";

const DauVao = z.object({ id: z.number().int().positive(), trang_thai: z.enum(["hoat_dong", "cho_duyet", "tat"]) }).strict();

export async function POST(req: Request) {
  const p = await congApi(req, ["chu_so_huu", "bien_tap"]);
  if (p instanceof NextResponse) return p;
  const vao = DauVao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });
  const { error } = await p.sb.rpc("duyet_cau_hoi_vec", { p_id: vao.data.id, p_trang_thai: vao.data.trang_thai });
  if (error) return loiSql(error);
  return NextResponse.json({ ok: true });
}
