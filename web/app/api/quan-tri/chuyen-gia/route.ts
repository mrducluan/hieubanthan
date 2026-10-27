// POST /api/quan-tri/chuyen-gia — chuyên gia (chủ sở hữu / thẩm định, MFA, cùng origin) xử lý hàng đợi "Hỏi chuyên gia" (0029):
//   tinh {id}             đọc một câu (ghi nhật ký) + gọi engine lập bảng số theo mảng từ ảnh chụp hồ sơ (nếu người hỏi đồng ý)
//   tra_loi {id, tra_loi} SQL kiểm lại độ dài + link / số liên lạc; nội dung KHÔNG vào nhật ký (chỉ mã + độ dài)
//   hoan {id, ly_do}      chỉ chủ sở hữu, sau khi đã chuyển tiền ngoài hệ thống
//   qua_han               đánh dấu mọi câu quá hạn (cron ngày cũng làm)
import { NextResponse } from "next/server";
import { z } from "zod";
import { congApi, loiSql } from "@/lib/quan-tri-api";
import { bangSoChuyenGia } from "@/lib/chuyen-gia-may-chu";
import { MANG_CG, TRA_LOI_TOI_DA, type HoSoCg, type MangCg } from "@/lib/chuyen-gia-hoi";

const Vao = z.discriminatedUnion("viec", [
  z.object({ viec: z.literal("tinh"), id: z.number().int().positive() }),
  z.object({ viec: z.literal("tra_loi"), id: z.number().int().positive(), tra_loi: z.string().trim().min(20).max(TRA_LOI_TOI_DA) }),
  z.object({ viec: z.literal("hoan"), id: z.number().int().positive(), ly_do: z.string().trim().min(5).max(120) }),
  z.object({ viec: z.literal("qua_han") }),
]);

const BAO: Record<string, string> = {
  co_lien_he: "Câu trả lời có link, email hoặc số điện thoại — bỏ đi rồi gửi lại.",
  tra_loi_khong_hop_le: "Câu trả lời cần 20–6.000 ký tự.",
  khong_doi: "Câu này không còn ở trạng thái chờ trả lời.", khong_co: "Không thấy câu hỏi.",
  thieu_ly_do: "Cần lý do 5–120 ký tự.", khong_hoan_duoc: "Câu này không hoàn được (chưa thanh toán, miễn phí hoặc đã hoàn).",
};

export async function POST(req: Request) {
  const vao = Vao.safeParse(await req.clone().json().catch(() => null));
  const p = await congApi(req, vao.success && vao.data.viec === "hoan" ? ["chu_so_huu"] : ["chu_so_huu", "tham_dinh"]);
  if (p instanceof NextResponse) return p;
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });
  const v = vao.data;
  if (v.viec === "tinh") {
    const { data, error } = await p.sb.rpc("doc_cau_hoi_chuyen_gia", { p_id: v.id });
    if (error) return loiSql(error);
    const c = data as { mang?: string; ho_so?: HoSoCg | null } | null;
    if (!c || !MANG_CG.includes(c.mang as MangCg)) return NextResponse.json({ error: "Không thấy câu hỏi." }, { status: 404 });
    return NextResponse.json(await bangSoChuyenGia(c.mang as MangCg, c.ho_so ?? null));
  }
  const { data, error } = v.viec === "tra_loi" ? await p.sb.rpc("tra_loi_cau_hoi", { p_id: v.id, p_tra_loi: v.tra_loi })
    : v.viec === "hoan" ? await p.sb.rpc("hoan_cau_hoi", { p_id: v.id, p_ly_do: v.ly_do })
    : await p.sb.rpc("danh_dau_qua_han_chuyen_gia");
  if (error) return loiSql(error);
  if (v.viec === "qua_han") return NextResponse.json({ so: typeof data === "number" ? data : 0 });
  const kq = data as { ket_qua: string };
  if (kq.ket_qua in BAO) return NextResponse.json({ error: BAO[kq.ket_qua], ...kq }, { status: 409 });
  return NextResponse.json(kq);
}
