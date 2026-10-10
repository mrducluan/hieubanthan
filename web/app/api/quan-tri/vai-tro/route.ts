// POST /api/quan-tri/vai-tro — chủ sở hữu cấp / đổi / gỡ vai trò quản trị (QT-2). Người được cấp phải đã đăng nhập
// hieuban.com ít nhất một lần. Không tự đổi / tự gỡ chính mình (tránh khoá mất quyền chủ sở hữu). Ghi nhật ký trong SQL.
import { NextResponse } from "next/server";
import { z } from "zod";
import { congApi, loiSql } from "@/lib/quan-tri-api";

const DauVao = z.discriminatedUnion("viec", [
  z.object({ viec: z.literal("cap"), email: z.string().email().max(200),
    vai_tro: z.enum(["chu_so_huu", "bien_tap", "tham_dinh", "ho_tro", "xem"]) }),
  z.object({ viec: z.literal("go"), user_id: z.string().uuid() }),
]);

const BAO: Record<string, string> = {
  chua_co_tai_khoan: "Email này chưa có tài khoản — nhờ người đó đăng nhập hieuban.com một lần trước.",
  khong_tu_doi: "Không tự đổi vai trò của chính mình.", khong_tu_go: "Không tự gỡ chính mình.",
  khong_co: "Người này không còn vai trò.", vai_tro_khong_hop_le: "Vai trò không hợp lệ.",
};

export async function POST(req: Request) {
  const p = await congApi(req, ["chu_so_huu"]);
  if (p instanceof NextResponse) return p;
  const vao = DauVao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });
  const { data, error } = vao.data.viec === "cap"
    ? await p.sb.rpc("cap_vai_tro", { p_email: vao.data.email, p_vai_tro: vao.data.vai_tro })
    : await p.sb.rpc("go_vai_tro", { p_user_id: vao.data.user_id });
  if (error) return loiSql(error);
  const kq = (data as { ket_qua: string }).ket_qua;
  if (kq in BAO) return NextResponse.json({ error: BAO[kq] }, { status: 409 });
  return NextResponse.json({ ok: true, ket_qua: kq });
}
