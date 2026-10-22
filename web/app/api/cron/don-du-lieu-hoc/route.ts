// GET /api/cron/don-du-lieu-hoc — TS-V3 tầng HỌC: xoá thật dữ liệu học hết hạn (góp ý > 12 tháng, ký ức > 180 ngày, mẫu
// ghi chú cụm cũ > 12 tháng; Tử vi: phiếu kiểm chứng > 24 tháng, bài luận đã lưu > 365 ngày; mốc nhắc việc > 400 ngày)
// — đúng thời hạn ghi trong Chính sách quyền riêng tư. Vercel Cron gửi Bearer CRON_SECRET.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { baoLoi } from "@/lib/giam-sat";

function dungKhoa(req: Request): boolean {
  const bi = process.env.CRON_SECRET;
  const dua = req.headers.get("authorization") ?? "";
  if (!bi || bi.length < 16) return false;
  const a = Buffer.from(dua), b = Buffer.from(`Bearer ${bi}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!dungKhoa(req)) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình" }, { status: 503 });
  // Rà vòng HỌC 2026-10-22: ba hàm dọn chạy ĐỘC LẬP — trước đây 0016 lỗi thì trả 502 ngay, phiếu kiểm chứng (0017) và
  // mốc nhắc việc (0018, `don_nhac_viec` chưa từng được gọi) không bao giờ được dọn. Hàm chưa có (migration chưa chạy)
  // → null; lỗi khác báo Sentry (chỉ tên hàm).
  const [ts, tv, nv] = await Promise.all(["don_du_lieu_hoc", "don_du_lieu_hoc_tuvi", "don_nhac_viec"].map(async (ham) => {
    const { data, error } = await dv.rpc(ham);
    if (error && error.code !== "PGRST202") baoLoi(new Error(`cron_don_${ham}`), { noi: "cron", duong: "/api/cron/don-du-lieu-hoc" });
    return error ? null : data;
  }));
  if (ts === null && tv === null && nv === null) {
    return NextResponse.json({ error: "Chưa dọn được (chạy migration 0016–0018?)" }, { status: 502 });
  }
  return NextResponse.json({ ...(ts as object | null ?? {}), tuvi: tv, nhac_viec: nv });
}
