// POST /api/goi-y-cheo — CTA-1: khối "Đọc tiếp về bạn" cuối phần xem. Proxy engine /v1/goi-y-cheo (engine ghép mọi câu
// từ con số đã tính + KB) và gắn thêm trạng thái hiển thị phía máy chủ: công tắc thu Sao + giá Luận giải toàn bộ,
// có ví/tài khoản ủng hộ không. Ngày giờ sinh chỉ đi qua lượt gọi để engine tính, không lưu.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { MANG_TRANG } from "@/lib/goi-y-cheo";
import { dangThuSao, giaLuanGiaiSao } from "@/lib/luan-giai-sao";
import { mangLuanGiai } from "@/lib/luan-giai-mang";
import { coUngHo } from "@/lib/ung-ho";

const Input = z.object({
  mang_hien_tai: z.enum(MANG_TRANG),
  ngay: z.number().int().min(1).max(31).optional(),
  thang: z.number().int().min(1).max(12).optional(),
  nam: z.number().int().min(1900).max(2100).optional(),
  gio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  do_tin_gio: z.enum(["exact", "approx", "unknown"]).optional(),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5).optional(),
  noi_sinh: z.string().regex(/^[a-z0-9_-]{2,40}$/).optional(),
  vung: z.enum(["north", "south"]).optional(),
  gio_mua_he: z.boolean().optional(),
  lich: z.enum(["viet", "trung"]).optional(),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
}).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const [kq, thu, gia] = await Promise.all([
    goiEngineDaKiem(p.data, "/v1/goi-y-cheo", dauNguoiGoi(req)),
    // Nút Sao của khối này mời đọc báo cáo của chính trang (Thần số / Tử vi / Bát tự); trang khác dẫn sang /tu-vi.
    dangThuSao(mangLuanGiai(p.data.mang_hien_tai) ?? "tuvi").catch(() => false),
    giaLuanGiaiSao().catch(() => 10),
  ]);
  if (!kq.ok) return kq.res;
  return NextResponse.json({ ...(kq.body as object), thu_sao: thu, gia_sao: gia, ung_ho: coUngHo() });
}
