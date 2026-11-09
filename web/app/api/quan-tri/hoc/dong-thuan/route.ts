// POST /api/quan-tri/hoc/dong-thuan — Ý4: thước "đồng thuận liên môn" cho người duyệt. Engine đọc tệp thống kê đã sinh
// (kb/data/dong_thuan_thong_ke.json: Tử vi–Bát tự cùng mức theo mảng trên lá số mẫu, kỳ vọng ngẫu nhiên, kappa) — web chỉ
// chuyển tiếp với khoá quản trị, không tính. Cổng: phiên quản trị (congApi) vai trò đọc tầng HỌC.
import { NextResponse } from "next/server";
import { congApi } from "@/lib/quan-tri-api";
import { goiEngineDaKiem } from "@/lib/proxy";

export async function POST(req: Request) {
  const p = await congApi(req, ["chu_so_huu", "bien_tap", "tham_dinh"]);
  if (p instanceof NextResponse) return p;
  const kq = await goiEngineDaKiem({}, "/v1/quan-tri/dong-thuan",
    process.env.ENGINE_QUAN_TRI_KEY ? { "x-quan-tri-key": process.env.ENGINE_QUAN_TRI_KEY } : {});
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body);
}
