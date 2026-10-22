// POST /api/phongthuy/luan-giai — PT-ĐS: báo cáo "Nhà của bạn" (engine dựng mọi chữ; web chỉ vẽ). Miễn phí, không lưu.
// HỌC-ĐS: kèm `trong_so` (tỉ lệ "thấy đúng" công khai theo mã, ≥ 30 phiếu, cache 1 giờ) + `ca_nhan` (phiếu của chính
// người xem khi đăng nhập) như Tử vi — engine chỉ hạ / xếp lại hộp. Không chữ người dùng, không ngày sinh đi kèm phiếu.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";

const Do = z.number().min(0).lt(360);
const Sinh = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birth_year: z.number().int().min(1860).max(2150).optional(),
  gender: z.enum(["nam", "nu"]),
  moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
}).strict();
const DauHieu = z.object({ co: z.boolean(), do_tin: z.number().min(0).max(1).optional(), nguon: z.enum(["nguoi_dung", "anh", "video"]).optional(), xac_nhan: z.boolean().optional() }).strict();

const Input = z.object({
  sinh: Sinh.optional(),
  nha: z.object({
    huong_do: Do.optional(),
    huong: z.enum(["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]).optional(),
    nam_xay: z.number().int().min(1864).max(2150).optional(),
    toa: z.string().max(10).optional(),
    theo: z.enum(["cua", "ban_cong"]).optional(),
    bo_cuc: z.object({
      phien_ban: z.literal("0.1").optional(),
      huong_nha_do: Do.optional(),
      huong_nha: z.string().max(12).optional(),
      vi_tri: z.record(z.string().max(30), z.string().max(12)).optional(),
      huong_do: z.record(z.string().max(30), Do).optional(),
      dau_hieu: z.record(z.string().max(40), DauHieu).optional(),
    }).strict().optional(),
  }).strict(),
  thanh_vien: z.array(Sinh.extend({ vai: z.enum(["vo", "chong", "con", "cha_me", "khac"]).optional() }).strict()).max(6).optional(),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const them = await themHocLuanGiai("ds.phongthuy.").catch(() => ({}));
  const dau = dauNguoiGoi(req);
  let kq = await goiEngineDaKiem({ ...parsed.data, ...them }, "/v1/phongthuy/luan-giai", dau);
  if (!kq.ok && Object.keys(them).length) kq = await goiEngineDaKiem(parsed.data, "/v1/phongthuy/luan-giai", dau);
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}
