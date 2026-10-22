// POST /api/kiem-chung/sau — Q7 (migration 0022): PHIẾU SAU 30 NGÀY. Người từng bấm "Đúng với mình" một hộp lưu ý / lời khuyên,
// ≥ 30 ngày sau Hôm nay hỏi lại hai câu ba mức (đã làm theo chưa · thấy khác gì). Chỉ MÃ + phái + hai mức + số ngày — không chữ,
// không nhà, không ngày sinh. Khoá HMAC như /api/kiem-chung; một phiếu / người / mã. Chưa chạy 0022 → {ok:false, ly_do:"chua_bat"}.
import { NextResponse } from "next/server";
import { z } from "zod";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { khacNguon, khoaHoc, taoHanMuc } from "@/lib/hoc-tuvi";
import { baoLoi } from "@/lib/giam-sat";
import { MA_DOI_SONG, MA_HAI_NGUOI } from "@/lib/kiem-chung";

const quaTay = taoHanMuc(30);
const Input = z.object({
  loai: z.enum(["doi_song", "hai_nguoi"]),
  mau: z.string().regex(/^[a-z0-9_.+-]{3,60}$/),
  phai: z.string().regex(/^[a-z0-9_]{2,32}$/),
  da_lam: z.enum(["da_lam", "mot_phan", "chua"]),
  thay_khac: z.enum(["tot_hon", "nhu_cu", "kho_noi"]),
  sau_ngay: z.number().int().min(30).max(400),
}).strict().refine((d) => (d.loai === "doi_song" ? MA_DOI_SONG : MA_HAI_NGUOI).test(d.mau), { path: ["mau"] });

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
    const { data, error } = await dv.rpc("ghi_kiem_chung_sau", {
      p_khoa: khoa, p_user_id: phien?.user.id ?? null, p_loai: d.loai, p_mau: d.mau, p_phai: d.phai,
      p_da_lam: d.da_lam, p_thay_khac: d.thay_khac, p_sau_ngay: d.sau_ngay,
    });
    if (error) {
      if (error.code !== "PGRST202") baoLoi(new Error("kiem_chung_sau_loi_db"), { noi: "api", duong: "/api/kiem-chung/sau" });
      return NextResponse.json({ ok: false, ly_do: "chua_bat" });
    }
    return NextResponse.json({ ok: true, da_luu: data === true, ...(data === true ? {} : { ly_do: "tu_choi" }) });
  } catch (e) {
    baoLoi(e, { noi: "api", duong: "/api/kiem-chung/sau" });
    return NextResponse.json({ ok: false, ly_do: "loi" });
  }
}
