// POST /api/phongthuy/luan-giai — PT-ĐS: báo cáo "Nhà của bạn" (engine dựng mọi chữ; web chỉ vẽ). Miễn phí, không lưu.
// HỌC-ĐS: kèm `trong_so` (tỉ lệ "thấy đúng" công khai theo mã, ≥ 30 phiếu, cache 1 giờ) + `ca_nhan` (phiếu của chính
// người xem khi đăng nhập) như Tử vi — engine chỉ hạ / xếp lại hộp. Không chữ người dùng, không ngày sinh đi kèm phiếu.
import { NextResponse } from "next/server";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";
import { LuanGiaiPTZ as Input } from "@/lib/bo-cuc-zod";

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const them = await themHocLuanGiai({ loai: "doi_song", tienTo: "ds.phongthuy." }).catch(() => ({}));
  const dau = dauNguoiGoi(req);
  let kq = await goiEngineDaKiem({ ...parsed.data, ...them }, "/v1/phongthuy/luan-giai", dau);
  if (!kq.ok && Object.keys(them).length) kq = await goiEngineDaKiem(parsed.data, "/v1/phongthuy/luan-giai", dau);
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}
