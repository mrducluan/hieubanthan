// SAO-V (migration 0025, phần 4) — chuỗi ngày ghé cho trang "Hôm nay".
//   POST (trang mở): chưa bật tài khoản → {tai_khoan:false} · khách → công tắc + mức (để mời đăng nhập, không ghi gì) ·
//        đã đăng nhập → diem_danh() bằng phiên người dùng (giờ VN; gọi nhiều lần trong ngày không cộng thêm).
//   Chưa chạy 0025 / lỗi RPC → san_sang:false: trang giữ chuỗi đếm trên máy như cũ. Không nhận đầu vào nào từ client.
import { NextResponse } from "next/server";
import { layCauHinh } from "@/lib/cau-hinh";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import type { TrangThaiChuoi } from "@/lib/chuoi-ngay";
import type { DiemDanh } from "@/lib/sao";

export const dynamic = "force-dynamic";
const KHONG_CACHE = { headers: { "cache-control": "private, no-store" } };
const tra = (d: TrangThaiChuoi) => NextResponse.json(d, KHONG_CACHE);

const so = (v: unknown) => typeof v === "number" && Number.isFinite(v);
function hopLe(d: unknown): d is DiemDanh {
  if (!d || typeof d !== "object") return false;
  const x = d as Record<string, unknown>;
  return typeof x.ngay === "string" && so(x.chuoi) && so(x.dai_nhat) && typeof x.moi === "boolean" && typeof x.bat === "boolean"
    && so(x.moc) && so(x.sao_moc) && so(x.con_ngay) && so(x.sao);
}

export async function POST() {
  if (!coTaiKhoan()) return tra({ tai_khoan: false });
  const phien = await phienNguoiDung().catch(() => null);
  if (!phien) {
    const [bat, moc, sao] = await Promise.all([
      layCauHinh<boolean>("sao.chuoi.bat"), layCauHinh<number>("sao.chuoi.moc"), layCauHinh<number>("sao.chuoi.sao"),
    ]).catch(() => [false, 0, 0] as const);
    return tra({ tai_khoan: true, dang_nhap: false, bat: Boolean(bat), moc: Number(moc) || 0, sao_moc: Number(sao) || 0 });
  }
  const { data, error } = await phien.sb.rpc("diem_danh");
  if (error || !hopLe(data)) return tra({ tai_khoan: true, dang_nhap: true, san_sang: false });
  const d = data;
  return tra({ tai_khoan: true, dang_nhap: true, san_sang: true, ngay: d.ngay, chuoi: d.chuoi, dai_nhat: d.dai_nhat, moi: d.moi,
    bat: d.bat, moc: d.moc, sao_moc: d.sao_moc, con_ngay: d.con_ngay, sao: d.sao });
}
