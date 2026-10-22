// POST /api/phongthuy/luan-giai — PT-ĐS: báo cáo "Nhà của bạn" (engine dựng mọi chữ; web chỉ vẽ). Miễn phí, không lưu.
// HỌC-ĐS: kèm `trong_so` (tỉ lệ "thấy đúng" công khai theo mã, ≥ 30 phiếu, cache 1 giờ) + `ca_nhan` (phiếu của chính
// người xem khi đăng nhập) như Tử vi — engine chỉ hạ / xếp lại hộp. Không chữ người dùng, không ngày sinh đi kèm phiếu.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";
import { BoCucZ, Do, GocNhinZ } from "@/lib/bo-cuc-zod";

const Sinh = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birth_year: z.number().int().min(1860).max(2150).optional(),
  gender: z.enum(["nam", "nu"]),
  moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
}).strict();

const Input = z.object({
  sinh: Sinh.optional(),
  nha: z.object({
    huong_do: Do.optional(),
    huong: z.enum(["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]).optional(),
    nam_xay: z.number().int().min(1864).max(2150).optional(),
    toa: z.string().max(10).optional(),
    theo: z.enum(["cua", "ban_cong"]).optional(),
    bo_cuc: BoCucZ.optional(),
  }).strict(),
  thanh_vien: z.array(Sinh.extend({ vai: z.enum(["vo", "chong", "con", "cha_me", "khac"]).optional() }).strict()).max(6).optional(),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Q4 góc nhìn giải thích dấu hiệu · đồ thị tri thức: ý định chung → mục "Theo điều bạn đang băn khoăn".
  goc_nhin: GocNhinZ.optional(),
  y_dinh: z.string().regex(/^[a-z_]{3,30}$/).optional(),
}).strict();

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const them = await themHocLuanGiai({ loai: "doi_song", tienTo: "ds.phongthuy." }).catch(() => ({}));
  const dau = dauNguoiGoi(req);
  let kq = await goiEngineDaKiem({ ...parsed.data, ...them }, "/v1/phongthuy/luan-giai", dau);
  if (!kq.ok && Object.keys(them).length) kq = await goiEngineDaKiem(parsed.data, "/v1/phongthuy/luan-giai", dau);
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}
