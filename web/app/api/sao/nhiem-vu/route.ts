// SAO-3 — nhiệm vụ kiếm Sao (migration 0014). Điều kiện + mức thưởng kiểm trong SQL bằng phiên người dùng (RLS):
//   GET  trạng thái: chưa bật tài khoản → {tai_khoan:false} · khách → công tắc + mức (để mời đăng nhập) ·
//        đã đăng nhập → tiến độ từng nhiệm vụ (chưa chạy 0014 → san_sang:false, hộp tự ẩn).
//   POST {ma} nhận thưởng — idempotent ở SQL (mỗi nhiệm vụ một lần mỗi tài khoản).
import { NextResponse } from "next/server";
import { z } from "zod";
import { layCauHinh } from "@/lib/cau-hinh";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { KHOA_MUC, MA_NHIEM_VU, type KetQuaNhiemVu, type MaNhiemVu, type NhiemVu, type TrangThaiNhiemVu } from "@/lib/nhiem-vu";

export const dynamic = "force-dynamic";
const KHONG_CACHE = { headers: { "cache-control": "private, no-store" } };

export async function GET() {
  const tra = (d: TrangThaiNhiemVu) => NextResponse.json(d, KHONG_CACHE);
  if (!coTaiKhoan()) return tra({ tai_khoan: false });
  const phien = await phienNguoiDung().catch(() => null);
  if (!phien) {
    const [bat, chaoMung, ...so] = await Promise.all([
      layCauHinh<boolean>("sao.nhiem_vu.bat"), layCauHinh<number>("sao.thuong.chao_mung"),
      ...MA_NHIEM_VU.map((m) => layCauHinh<number>(KHOA_MUC[m])),
    ]);
    const muc = Object.fromEntries(MA_NHIEM_VU.map((m, i) => [m, Number(so[i] ?? 0)])) as Record<MaNhiemVu, number>;
    return tra({ tai_khoan: true, dang_nhap: false, bat: Boolean(bat), muc, chao_mung: Number(chaoMung) || 0 });
  }
  const { data, error } = await phien.sb.rpc("nhiem_vu_cua_toi");
  const d = data as { bat?: boolean; nhiem_vu?: NhiemVu[] } | null;
  if (error || !d || !Array.isArray(d.nhiem_vu)) return tra({ tai_khoan: true, dang_nhap: true, san_sang: false });
  return tra({ tai_khoan: true, dang_nhap: true, san_sang: true, bat: Boolean(d.bat), nhiem_vu: d.nhiem_vu });
}

const Vao = z.object({ ma: z.enum(MA_NHIEM_VU) });

export async function POST(req: Request) {
  if (!coTaiKhoan()) return NextResponse.json({ error: "Tài khoản chưa được bật." }, { status: 503 });
  const vao = Vao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const phien = await phienNguoiDung().catch(() => null);
  if (!phien) return NextResponse.json({ error: "Hãy đăng nhập để nhận Sao.", can: "dang_nhap" }, { status: 401 });
  const { data, error } = await phien.sb.rpc("nhan_thuong_nhiem_vu", { p_ma: vao.data.ma });
  if (error || !data) return NextResponse.json({ error: "Chưa nhận được Sao, thử lại sau ít phút." }, { status: 502 });
  return NextResponse.json(data as KetQuaNhiemVu, KHONG_CACHE);
}
