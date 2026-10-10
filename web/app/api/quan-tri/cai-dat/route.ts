// POST /api/quan-tri/cai-dat — chủ sở hữu lưu / xoá (về mặc định) một cài đặt site (QT-2). Chỉ khoá có trong CAI_DAT.
// Hàm SQL dat_cau_hinh kiểm lại vai trò + aal2 và ghi nhật ký (giá trị cũ → mới) trong cùng giao dịch.
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { caiDat, chuanHoa, TAG_CAU_HINH } from "@/lib/cau-hinh";
import { congApi, loiSql } from "@/lib/quan-tri-api";

const DauVao = z.object({ khoa: z.string().max(60), gia_tri: z.unknown().optional(), xoa: z.boolean().optional() });

export async function POST(req: Request) {
  const p = await congApi(req, ["chu_so_huu"]);
  if (p instanceof NextResponse) return p;
  const vao = DauVao.safeParse(await req.json().catch(() => null));
  const c = vao.success ? caiDat(vao.data.khoa) : undefined;
  if (!vao.success || !c) return NextResponse.json({ error: "Cài đặt không hợp lệ." }, { status: 422 });

  if (vao.data.xoa) {
    const { error } = await p.sb.rpc("xoa_cau_hinh", { p_khoa: c.khoa });
    if (error) return loiSql(error);
  } else {
    const r = chuanHoa(c, vao.data.gia_tri);
    if (!r.ok) return NextResponse.json({ error: r.loi }, { status: 422 });
    const { error } = await p.sb.rpc("dat_cau_hinh", { p_khoa: c.khoa, p_gia_tri: r.giaTri, p_mo_ta: c.ten });
    if (error) return loiSql(error);
  }
  revalidateTag(TAG_CAU_HINH);
  return NextResponse.json({ ok: true });
}
