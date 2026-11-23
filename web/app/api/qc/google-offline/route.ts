// GET /api/qc/google-offline — QC-G: tệp chuyển đổi offline cho Google Ads (lịch tải "HTTPS" trong Google Ads → Công cụ →
// Chuyển đổi → Tải lên → Lịch). Basic Auth bằng env GOOGLE_OFFLINE_USER + GOOGLE_OFFLINE_PASS (≥ 16 ký tự); chưa đặt → 404.
// Nội dung: đơn đã trả ≤ 90 ngày có mã lượt bấm Google (gclid), số tiền VND, giờ trả; cột Email = SHA-256 của email tài
// khoản thật (tắt: GOOGLE_OFFLINE_EMAIL=0). Tên chuyển đổi = env GOOGLE_OFFLINE_TEN (mặc định "Nap Sao") — phải trùng tên
// chuyển đổi tạo trong Google Ads. Không cache.
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { choGuiEmail, dungMatKhau, layDongXuat, taoCsv } from "@/lib/google-offline";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(process.env.GOOGLE_OFFLINE_USER ?? "").trim() || (process.env.GOOGLE_OFFLINE_PASS ?? "").trim().length < 16) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!dungMatKhau(req.headers.get("authorization"))) {
    return new NextResponse("Unauthorized", { status: 401, headers: { "www-authenticate": 'Basic realm="hieuban"', "cache-control": "no-store" } });
  }
  const dv = khachDichVu();
  if (!dv) return new NextResponse("Unavailable", { status: 503 });
  const coEmail = choGuiEmail("GOOGLE_OFFLINE_EMAIL");
  const ds = await layDongXuat(dv, coEmail).catch(() => null);
  if (!ds) return new NextResponse("Unavailable", { status: 503 });
  return new NextResponse(taoCsv(ds, process.env.GOOGLE_OFFLINE_TEN ?? "Nap Sao", coEmail), {
    headers: { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
