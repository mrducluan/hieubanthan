// POST /api/hoi/xac-nhan-y-dinh — LG-ĐS mục 4: người dùng bấm "Đúng ý bạn hỏi?" dưới câu trả lời Tử vi.
//   dung=false → chỉ đo (PostHog ở trình duyệt), không ghi gì.  dung=true → engine LỌC câu (ngày, năm, giờ, số điện
//   thoại, email, tên) + nhúng → xac_nhan_y_dinh: gộp vào câu gần trùng cùng ý định (cos ≥ 0,95) hoặc thêm "chờ duyệt";
//   đủ 3 người khác nhau xác nhận → câu vào kho hoạt động (quản trị tắt được ở /quan-tri/hoc).
// Không user_id trong kho: khoá xác nhận = HMAC máy chủ (user_id | IP). Chữ người dùng chỉ là dữ liệu cho người duyệt và
// cho so khớp vectơ — không bao giờ vào lời nhắc AI. Chưa bật → {ok:false, ly_do:"chua_bat"}.
import { NextResponse } from "next/server";
import { z } from "zod";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { khacNguon, khoaHoc, MO_HINH_NHUNG, taoHanMuc, Y_DINH_TUVI } from "@/lib/hoc-tuvi";
import { baoLoi } from "@/lib/giam-sat";

const quaTay = taoHanMuc(20);

const Input = z.object({
  mo_dun: z.literal("tuvi"),
  cau: z.string().trim().min(3).max(300),
  y_dinh: z.enum(Y_DINH_TUVI),
  dung: z.boolean(),
}).strict();

export async function POST(req: Request) {
  if (khacNguon(req)) return NextResponse.json({ error: "Sai nguồn gửi." }, { status: 403 });
  const vao = Input.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  if (!vao.data.dung) return NextResponse.json({ ok: true, da_luu: false });
  const dv = coTaiKhoan() ? khachDichVu() : null;
  if (!dv) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
  if (quaTay(req)) return NextResponse.json({ ok: true, da_luu: false, ly_do: "qua_nhanh" });
  try {
    const phien = await phienNguoiDung();
    const khoa = khoaHoc(req, phien?.user.id ?? null, "y-dinh");
    if (!khoa) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
    // Câu khủng hoảng / ngoài phạm vi (cùng luật RULES của hỏi đáp) KHÔNG BAO GIỜ vào kho — route này nhận câu từ
    // trình duyệt, không tin rằng câu đã đi qua /api/tuvi/hoi. Engine lỗi → không lưu (đóng an toàn).
    const db = await goiEngineDaKiem({ cau_hoi: vao.data.cau.slice(0, 500) }, "/v1/hoi/dac-biet", dauNguoiGoi(req));
    if (!db.ok) return NextResponse.json({ ok: false, ly_do: "engine" });
    if ((db.body as { loai?: string | null })?.loai) return NextResponse.json({ ok: true, da_luu: false, ly_do: "khong_luu" });
    const nh = await goiEngineDaKiem({ cau: [vao.data.cau] }, "/v1/nhung", dauNguoiGoi(req));
    if (!nh.ok) return NextResponse.json({ ok: false, ly_do: "engine" });
    const b = nh.body as { mo_hinh?: string; vec?: number[][]; cau_da_loc?: string[] };
    if (b.mo_hinh !== MO_HINH_NHUNG || !b.vec?.[0] || !b.cau_da_loc?.[0]) return NextResponse.json({ ok: false, ly_do: "engine" });
    const { data, error } = await dv.rpc("xac_nhan_y_dinh", {
      p_mo_dun: "tuvi", p_y_dinh: vao.data.y_dinh, p_cau: b.cau_da_loc[0], p_vec: b.vec[0], p_mo_hinh: b.mo_hinh, p_khoa: khoa,
      p_dang_nhap: Boolean(phien?.user.id),
    });
    if (error) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
    const r = data as { ok?: boolean; trang_thai?: string };
    return NextResponse.json({ ok: true, da_luu: Boolean(r?.ok), trang_thai: r?.trang_thai ?? null });
  } catch (e) {
    baoLoi(e, { noi: "api", duong: "/api/hoi/xac-nhan-y-dinh" });
    return NextResponse.json({ ok: false, ly_do: "loi" });
  }
}
