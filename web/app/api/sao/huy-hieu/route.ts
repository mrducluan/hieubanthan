// SAO-HH (migration 0030, phần 2) — huy hiệu thành tựu của chính người đang đăng nhập.
//   GET: chưa bật tài khoản → {tai_khoan:false} · khách → {dang_nhap:false} (trang chỉ hiện huy hiệu máy) ·
//        đã đăng nhập → huy_hieu_cua_toi() bằng phiên người dùng (chỉ đọc, không ghi gì). Chưa chạy 0030 / lỗi → san_sang:false.
//   Không nhận đầu vào nào từ client. Huy hiệu không mua bán, không đổi ra Sao / tiền.
import { NextResponse } from "next/server";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { MA_HUY_HIEU_MAY_CHU, type HuyHieuMayChu, type TrangThaiHuyHieu } from "@/lib/huy-hieu";

export const dynamic = "force-dynamic";
const KHONG_CACHE = { headers: { "cache-control": "private, no-store" } };
const tra = (d: TrangThaiHuyHieu) => NextResponse.json(d, KHONG_CACHE);

function hopLe(d: unknown): d is HuyHieuMayChu[] {
  return Array.isArray(d) && d.every((x) => x && typeof x === "object"
    && (MA_HUY_HIEU_MAY_CHU as readonly string[]).includes(String((x as { ma?: unknown }).ma))
    && typeof (x as { dat?: unknown }).dat === "boolean");
}

export async function GET() {
  if (!coTaiKhoan()) return tra({ tai_khoan: false });
  const phien = await phienNguoiDung().catch(() => null);
  if (!phien) return tra({ tai_khoan: true, dang_nhap: false });
  const { data, error } = await phien.sb.rpc("huy_hieu_cua_toi");
  if (error || !hopLe(data)) return tra({ tai_khoan: true, dang_nhap: true, san_sang: false });
  return tra({ tai_khoan: true, dang_nhap: true, san_sang: true,
    huy_hieu: data.map((h) => ({ ma: h.ma, dat: h.dat, luc: typeof h.luc === "string" ? h.luc : null })) });
}
