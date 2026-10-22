// POST /api/kiem-chung — LG-ĐS tầng HỌC (migration 0017 + 0021): phiếu "Đúng với mình / Chưa đúng" trên một thẻ.
// Chỉ MÃ tất định (phi_hoa / nhip_3_thang / doi_song "ds.*" / hai_nguoi "hn.*"), không chữ, không lá số. Một phiếu / người / mã — bấm lại
// là đổi ý (SQL cập nhật, không cộng dồn). Khoá = HMAC máy chủ của user_id (đăng nhập) hoặc IP — không lưu IP.
// Chưa bật Supabase / chưa có bí mật / chưa chạy 0017 → {ok:false, ly_do:"chua_bat"} (200; PostHog vẫn đo ở trình duyệt).
import { NextResponse } from "next/server";
import { z } from "zod";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { khacNguon, khoaHoc, taoHanMuc } from "@/lib/hoc-tuvi";
import { baoLoi } from "@/lib/giam-sat";
import { MA_DOI_SONG, MA_HAI_NGUOI, PHAI_HAI_NGUOI } from "@/lib/kiem-chung";

// Chống dội (như /api/thanso/phan-hoi): mỗi người gọi ≤ 60 phiếu / 10 phút trên một phiên bản máy chủ, khoá = IP băm.
const quaTay = taoHanMuc(60);

const Input = z.object({
  loai: z.enum(["phi_hoa", "nhip_3_thang", "doi_song", "hai_nguoi"]),
  mau: z.string().regex(/^[a-z0-9_.+-]{3,60}$/),
  phai: z.string().regex(/^[a-z0-9_]{2,32}$/),
  ket_qua: z.enum(["dung", "chua_dung"]),
}).strict()
  .refine((d) => d.loai !== "doi_song" || MA_DOI_SONG.test(d.mau), { path: ["mau"] })
  .refine((d) => d.loai !== "hai_nguoi" || (MA_HAI_NGUOI.test(d.mau) && PHAI_HAI_NGUOI.test(d.phai)), { path: ["mau"] });

// Rà vòng HỌC 2026-10-22: DB từ chối mã (ghi_kiem_chung → false) = phiếu mất âm thầm (engine/web lệch danh mục SQL, hoặc
// migration mới chưa chạy). Báo Sentry MỘT lần mỗi loại mỗi phiên bản máy chủ (không kèm mã/khoá — chỉ loại), trả
// `ly_do: "tu_choi"` để e2e thấy được; người dùng vẫn chỉ thấy "Cảm ơn".
const daBao = new Set<string>();
function baoTuChoi(loai: string, ly: string) {
  if (daBao.has(`${loai}|${ly}`)) return;
  daBao.add(`${loai}|${ly}`);
  baoLoi(new Error(`kiem_chung_${ly}`), { noi: "api", duong: "/api/kiem-chung", loai });
}

export async function POST(req: Request) {
  if (khacNguon(req)) return NextResponse.json({ error: "Sai nguồn gửi." }, { status: 403 });
  const vao = Input.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const dv = coTaiKhoan() ? khachDichVu() : null;
  if (!dv) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
  if (quaTay(req)) return NextResponse.json({ ok: true, da_luu: false, ly_do: "qua_nhanh" });
  try {
    const phien = await phienNguoiDung();
    const khoa = khoaHoc(req, phien?.user.id ?? null);
    if (!khoa) return NextResponse.json({ ok: false, ly_do: "chua_bat" });
    const d = vao.data;
    const { data, error } = await dv.rpc("ghi_kiem_chung", {
      p_khoa: khoa, p_user_id: phien?.user.id ?? null, p_loai: d.loai, p_mau: d.mau, p_phai: d.phai, p_ket_qua: d.ket_qua,
    });
    if (error) {
      // PGRST202 = chưa có hàm (chưa chạy 0017) → "chưa bật" như cũ; lỗi khác (vd vi phạm ràng buộc `loai` khi 0021
      // chưa chạy mà hàm cũ lại nhận) thì báo một lần.
      if (error.code !== "PGRST202") baoTuChoi(d.loai, "loi_db");
      return NextResponse.json({ ok: false, ly_do: "chua_bat" });
    }
    if (data !== true) {
      baoTuChoi(d.loai, "tu_choi");
      return NextResponse.json({ ok: true, da_luu: false, ly_do: "tu_choi" });
    }
    return NextResponse.json({ ok: true, da_luu: true });
  } catch (e) {
    baoLoi(e, { noi: "api", duong: "/api/kiem-chung" });
    return NextResponse.json({ ok: false, ly_do: "loi" });
  }
}
