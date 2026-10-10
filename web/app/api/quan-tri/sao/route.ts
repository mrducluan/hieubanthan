// POST /api/quan-tri/sao — tra cứu (chủ sở hữu + hỗ trợ) và bút toán điều chỉnh Sao (chủ sở hữu) — QT-2.
// Không sửa số dư: mọi thay đổi là một dòng mới trong sổ cái có lý do; khoá do giao diện sinh → bấm hai lần không ghi hai lần.
// Mỗi lần tra cứu đều ghi nhật ký quản trị (ai tra, tài khoản nào).
import { NextResponse } from "next/server";
import { z } from "zod";
import { congApi, loiSql } from "@/lib/quan-tri-api";

const DauVao = z.discriminatedUnion("viec", [
  z.object({ viec: z.literal("tra"), email: z.string().email().max(200) }),
  z.object({ viec: z.literal("dieu_chinh"), email: z.string().email().max(200), so: z.number().int().min(-1000).max(1000),
    ly_do: z.string().trim().min(5).max(120), khoa: z.string().regex(/^[a-z0-9-]{8,60}$/) }),
]);

const BAO: Record<string, string> = {
  khong_thay: "Không thấy tài khoản với email này.", so_khong_hop_le: "Số Sao phải khác 0, tối đa ±1000.",
  thieu_ly_do: "Cần lý do 5–120 ký tự.", am_so_du: "Trừ quá số dư hiện có.", khoa_khong_hop_le: "Mở lại biểu mẫu rồi thử lại.",
};

export async function POST(req: Request) {
  const vao = DauVao.safeParse(await req.clone().json().catch(() => null));
  const p = await congApi(req, vao.success && vao.data.viec === "dieu_chinh" ? ["chu_so_huu"] : ["chu_so_huu", "ho_tro"]);
  if (p instanceof NextResponse) return p;
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });
  const { data, error } = vao.data.viec === "tra"
    ? await p.sb.rpc("tra_cuu_sao", { p_email: vao.data.email })
    : await p.sb.rpc("dieu_chinh_sao", { p_email: vao.data.email, p_so: vao.data.so, p_ly_do: vao.data.ly_do, p_khoa: vao.data.khoa });
  if (error) return loiSql(error);
  const kq = data as { ket_qua: string };
  if (kq.ket_qua in BAO) return NextResponse.json({ error: BAO[kq.ket_qua], ...kq }, { status: 409 });
  return NextResponse.json(kq);
}
