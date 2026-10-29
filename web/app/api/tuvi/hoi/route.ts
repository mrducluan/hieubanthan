// POST /api/tuvi/hoi — proxy hỏi đáp Tử vi tới engine (giữ ENGINE key server-side).
// Web không tự an sao, không tự tính hạn: lá số và vận hạn do engine (iztro) tính.
// LG-ĐS mục 4: luật từ khoá không nhận ra ý định (engine trả co_the_goi_y) → xin engine vectơ câu ĐÃ LỌC → láng giềng
// gần nhất trong kho ý định (tim_y_dinh_gan, cos ≥ 0,82) → hỏi lại engine với y_dinh_goi_y. Engine vẫn tự chặn câu
// khủng hoảng / ngoài phạm vi trước mọi gợi ý. Lỗi ở nhánh này → trả câu trả lời gốc. Câu hỏi không được lưu ở đây.
import { voiCuaHoi } from "@/lib/cua-sao";
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { LaSoVao } from "@/lib/la-so-vao";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { MO_HINH_NHUNG, NGUONG_Y_DINH } from "@/lib/hoc-tuvi";

const LaSo = LaSoVao;

const Input = z.object({
  cau_hoi: z.string().min(3).max(500),
  che_do: z.enum(["tham_khao", "chi_tiet"]).default("tham_khao"),
  la_so: LaSo.optional(),
}).strict();

type TraLoi = { co_the_goi_y?: boolean; nhan_ra_y_dinh?: boolean; y_dinh_tu_goi_y?: boolean; phan_loai?: { xu_ly?: string } };

// SAO-2: hạn mức câu miễn phí / trừ Sao khi vượt (lib/cua-sao.ts, tắt mặc định).
export async function POST(req: Request): Promise<NextResponse> {
  return voiCuaHoi(req, "tuvi", () => xuLy(req));
}

async function xuLy(req: Request): Promise<NextResponse> {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  }
  const dau = dauNguoiGoi(req);
  const kq = await goiEngineDaKiem(parsed.data, "/v1/tuvi/hoi", dau);
  if (!kq.ok) return kq.res;
  const goc = kq.body as TraLoi;
  if (goc?.co_the_goi_y && !goc.nhan_ra_y_dinh && !["an_toan", "tu_choi_nhe", "dan_huong"].includes(goc.phan_loai?.xu_ly ?? "")) {
    const goiY = await thuGoiY(parsed.data, dau).catch((e: unknown) => { baoLoi(e, { noi: "api", duong: "/api/tuvi/hoi#vec" }); return null; });
    if (goiY) return NextResponse.json(goiY);
  }
  return NextResponse.json(goc);
}

/** Nhánh kho vectơ: null = không có gợi ý (thiếu Supabase, chưa chạy 0017, không đủ gần, engine lỗi…). */
async function thuGoiY(d: z.infer<typeof Input>, dau: Record<string, string>): Promise<object | null> {
  const dv = khachDichVu();
  if (!dv) return null;
  const nh = await goiEngineDaKiem({ cau: [d.cau_hoi.slice(0, 300)] }, "/v1/nhung", dau);
  if (!nh.ok) return null;
  const { vec, mo_hinh } = nh.body as { vec?: number[][]; mo_hinh?: string };
  if (!vec?.[0] || mo_hinh !== MO_HINH_NHUNG) return null;
  const { data, error } = await dv.rpc("tim_y_dinh_gan", {
    p_mo_dun: "tuvi", p_vec: vec[0], p_mo_hinh: mo_hinh, p_nguong: NGUONG_Y_DINH, p_so: 1,
  });
  const gan = !error && Array.isArray(data) ? (data[0] as { id: number; y_dinh: string; do_gan: number } | undefined) : undefined;
  if (!gan) return null;
  const lai = await goiEngineDaKiem({ ...d, y_dinh_goi_y: gan.y_dinh }, "/v1/tuvi/hoi", dau);
  if (!lai.ok || !(lai.body as TraLoi)?.y_dinh_tu_goi_y) return null;
  return { ...(lai.body as object), goi_y_vec: { id: gan.id, y_dinh: gan.y_dinh, do_gan: Math.round(gan.do_gan * 1000) / 1000 } };
}
