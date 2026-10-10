// GET /api/sao/muc — mức thưởng Sao đang áp dụng (QT-2: chủ sở hữu chỉnh ở /quan-tri/cai-dat), để ví Sao hiện đúng số.
import { NextResponse } from "next/server";
import { layCauHinh } from "@/lib/cau-hinh";

export const dynamic = "force-dynamic";

export async function GET() {
  const [moi_ban, duoc_moi, chao_mung, tran] = await Promise.all([
    layCauHinh<number>("sao.thuong.moi_ban"), layCauHinh<number>("sao.thuong.duoc_moi"),
    layCauHinh<number>("sao.thuong.chao_mung"), layCauHinh<number>("sao.tran_moi_30_ngay"),
  ]);
  return NextResponse.json({ moi_ban, duoc_moi, chao_mung, tran }, { headers: { "cache-control": "public, max-age=60" } });
}
