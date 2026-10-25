// GET /api/sao/muc — mức thưởng Sao đang áp dụng (QT-2: chủ sở hữu chỉnh ở /quan-tri/cai-dat), để ví Sao và dòng
// "mời có thưởng" dưới nút chia sẻ hiện đúng số. SAO-V (0025): thêm hoa hồng nạp Sao (một tầng) — chỉ công tắc + mức,
// không có gì riêng của ai. Số thật vẫn do hàm SQL quyết (đọc cùng khoá, kẹp trong khoảng an toàn).
import { NextResponse } from "next/server";
import { layCauHinh } from "@/lib/cau-hinh";

export const dynamic = "force-dynamic";

export async function GET() {
  const [moi_ban, duoc_moi, chao_mung, tran, hhBat, phan_tram, so_don, thang] = await Promise.all([
    layCauHinh<number>("sao.thuong.moi_ban"), layCauHinh<number>("sao.thuong.duoc_moi"),
    layCauHinh<number>("sao.thuong.chao_mung"), layCauHinh<number>("sao.tran_moi_30_ngay"),
    layCauHinh<boolean>("sao.hoa_hong.bat"), layCauHinh<number>("sao.hoa_hong.phan_tram"),
    layCauHinh<number>("sao.hoa_hong.so_don"), layCauHinh<number>("sao.hoa_hong.thang"),
  ]);
  return NextResponse.json({
    moi_ban, duoc_moi, chao_mung, tran,
    hoa_hong: { bat: Boolean(hhBat) && phan_tram > 0, phan_tram, so_don, thang },
  }, { headers: { "cache-control": "public, max-age=60" } });
}
