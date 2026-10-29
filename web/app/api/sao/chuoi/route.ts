// SAO-V (migration 0025, phần 4) — chuỗi ngày ghé cho trang "Hôm nay".
//   POST (trang mở): chưa bật tài khoản → {tai_khoan:false} · khách → công tắc + mức (để mời đăng nhập, không ghi gì) ·
//        đã đăng nhập → diem_danh() bằng phiên người dùng (giờ VN; gọi nhiều lần trong ngày không cộng thêm).
//   Chưa chạy 0025 / lỗi RPC → san_sang:false: trang giữ chuỗi đếm trên máy như cũ.
//   SAO-HH (0030): thêm da_nghi / nghi_con (ngày nghỉ chuỗi miễn phí) — DB chưa chạy 0030 thì không có, trang không hiện.
//   KV-THANG (0032): thân JSON tuỳ chọn {so: số ngày cá nhân engine trả 1–9, la: mã lá đã lật} → diem_danh(p_so, p_la) ghi
//   nhật ký ngày ghé; trả ngay_ghe_thang + thang_truoc. DB chưa chạy 0032 (hàm không nhận tham số) → gọi lại không tham số.
import { NextResponse } from "next/server";
import { z } from "zod";
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

const Than = z.object({ so: z.number().int().min(1).max(9).optional(), la: z.enum(["viec", "cau_hoi", "gio"]).optional() }).strict();
const laMang = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 31);
function thangTruocHopLe(v: unknown): v is NonNullable<DiemDanh["thang_truoc"]> {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return so(x.nam) && so(x.thang) && so(x.so_ngay) && so(x.so_la) && so(x.so_khac) && typeof x.du_9 === "boolean" && laMang(x.ngay);
}

export async function POST(req: Request) {
  if (!coTaiKhoan()) return tra({ tai_khoan: false });
  const than = Than.safeParse(await req.json().catch(() => ({})));
  const p = than.success ? than.data : {};
  const phien = await phienNguoiDung().catch(() => null);
  if (!phien) {
    const [bat, moc, sao] = await Promise.all([
      layCauHinh<boolean>("sao.chuoi.bat"), layCauHinh<number>("sao.chuoi.moc"), layCauHinh<number>("sao.chuoi.sao"),
    ]).catch(() => [false, 0, 0] as const);
    return tra({ tai_khoan: true, dang_nhap: false, bat: Boolean(bat), moc: Number(moc) || 0, sao_moc: Number(sao) || 0 });
  }
  let { data, error } = await phien.sb.rpc("diem_danh", { p_so: p.so ?? null, p_la: p.la ?? null });
  if (error && (error.code === "PGRST202" || /diem_danh/.test(error.message ?? ""))) ({ data, error } = await phien.sb.rpc("diem_danh"));   // DB chưa chạy 0032: hàm cũ không nhận tham số (không gọi lại khi lỗi khác)
  if (error || !hopLe(data)) return tra({ tai_khoan: true, dang_nhap: true, san_sang: false });
  const d = data;
  return tra({ tai_khoan: true, dang_nhap: true, san_sang: true, ngay: d.ngay, chuoi: d.chuoi, dai_nhat: d.dai_nhat, moi: d.moi,
    bat: d.bat, moc: d.moc, sao_moc: d.sao_moc, con_ngay: d.con_ngay, sao: d.sao,
    ...(typeof d.da_nghi === "boolean" ? { da_nghi: d.da_nghi } : {}), ...(typeof d.nghi_con === "boolean" ? { nghi_con: d.nghi_con } : {}),
    ...(laMang(d.ngay_ghe_thang) ? { ngay_ghe_thang: d.ngay_ghe_thang } : {}),
    ...(thangTruocHopLe(d.thang_truoc) ? { thang_truoc: d.thang_truoc } : {}) });
}
