// POST /api/chia-se/thang — KV-THANG: mã có KÝ cho thẻ "Tháng N của tôi". Máy chủ tự gọi engine tính tháng cá nhân của
// tháng được tổng kết (client không tự khai số); mã chỉ mang tên hiển thị + tháng/năm + tháng cá nhân + ngày đã ghé (con số
// đếm trên máy / tài khoản — không phải huyền học, không kiểm chứng, chỉ là lời kể). Không mang họ tên, ngày sinh, chuỗi,
// huy hiệu, hạng hội viên. Tháng phải là tháng đã qua hoặc tháng này (không tổng kết tương lai).
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { kyMaThang, tuTuMa } from "@/lib/ma-moi";
import { traLoiChiaSe } from "@/lib/loi-chia-se";

const Input = z.object({
  ten_hien_thi: z.string().trim().min(1).max(40),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  nam_xem: z.number().int().min(2026).max(2100),
  thang_xem: z.number().int().min(1).max(12),
  ngay_ghe: z.array(z.number().int().min(1).max(31)).min(1).max(31),
}).strict();

const homNayVn = () => new Date(Date.now() + 7 * 3_600_000);

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_hien_thi, nam_xem, thang_xem, ngay_ghe, ...sinh } = p.data;
  const bay = homNayVn();
  if (nam_xem * 12 + thang_xem > bay.getUTCFullYear() * 12 + bay.getUTCMonth() + 1) {
    return NextResponse.json({ error: "Chỉ tổng kết tháng đã qua." }, { status: 422 });
  }
  const soNgayThang = new Date(Date.UTC(nam_xem, thang_xem, 0)).getUTCDate();
  const g = [...new Set(ngay_ghe)].filter((d) => d <= soNgayThang).sort((a, b) => a - b);
  if (!g.length) return NextResponse.json({ error: "Tháng này chưa có ngày ghé nào." }, { status: 422 });
  // Tháng cá nhân của tháng được tổng kết: engine tính theo ngày xem = ngày cuối tháng đó.
  const ngayXem = `${nam_xem}-${String(thang_xem).padStart(2, "0")}-${String(soNgayThang).padStart(2, "0")}`;
  const r = await goiEngineDaKiem({ ...sinh, ngay_xem: ngayXem }, "/v1/thanso/nhip", dauNguoiGoi(req));
  if (!r.ok) return r.res;
  const k = (r.body as { thang_ca_nhan?: { so?: number } } | null)?.thang_ca_nhan?.so;
  if (typeof k !== "number" || k < 1 || k > 9) return NextResponse.json({ error: "Chưa tính được tháng cá nhân." }, { status: 502 });
  try {
    const ma = kyMaThang({ t: ten_hien_thi, y: nam_xem, m: thang_xem, k, g });
    return NextResponse.json({ ma, tu: tuTuMa("tk", ma), k });
  } catch (e) {
    return traLoiChiaSe(e, "thang");
  }
}
