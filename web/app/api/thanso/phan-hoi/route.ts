// POST /api/thanso/phan-hoi — TS-V3 tầng HỌC: góp ý "đúng / chưa đúng" cho một câu trả lời thần số.
// Họ tên + ngày sinh chỉ dùng trong lượt gọi để engine tính CHỮ KÝ SỐ (các con số của ba phái); bảng chỉ lưu chữ ký,
// mã câu, phái, ghi chú đã lọc (khi người dùng tích đồng ý) — không tên, không ngày sinh, không user_id (migration 0015).
// Chưa bật Supabase → trả ok, luu: false (góp ý vẫn đo ẩn danh trên PostHog ở trình duyệt).
import { NextResponse } from "next/server";
import { z } from "zod";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { locGhiChu } from "@/lib/loc-ghi-chu";
import { baoLoi } from "@/lib/giam-sat";
import { dauNguoiGoi } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Input = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  phai: z.enum(["pitago", "chaldea", "kabbalah", "tong_hop"]),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).default("tong_het"),
  nguon: z.enum(["hoi_dap", "bai_doc", "noi_dau"]),
  linh_vuc: z.string().regex(/^[a-z_]{2,30}$/).optional(),
  ma_cau: z.string().regex(/^[a-z]{2}_[a-z_]{2,30}$/).optional(),
  dung: z.boolean(),
  ghi_chu: z.string().max(600).optional(),
  dong_y: z.boolean().optional(),
}).strict();

export async function POST(req: Request) {
  const vao = Input.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const d = vao.data;
  const sb = khachDichVu();
  if (!sb) return NextResponse.json({ ok: true, luu: false });
  try {
    const r = await fetch(`${ENGINE_URL}/v1/thanso/chu-ky-so`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...dauNguoiGoi(req) },
      body: JSON.stringify({ ho_ten: d.ho_ten, ngay: d.ngay, thang: d.thang, nam: d.nam, quy_uoc_duong_doi: d.quy_uoc_duong_doi }),
      cache: "no-store",
    });
    if (!r.ok) return NextResponse.json({ ok: true, luu: false });
    const { chu_ky } = (await r.json()) as { chu_ky: Record<string, Record<string, number>> };
    const ghi = d.dong_y ? locGhiChu(d.ghi_chu) : null;
    const { data, error } = await sb.rpc("gui_phan_hoi_thanso", { p: {
      phai: d.phai, quy_uoc: d.quy_uoc_duong_doi, nguon: d.nguon, linh_vuc: d.linh_vuc ?? null, ma_cau: d.ma_cau ?? null,
      chu_ky, dung: d.dung, ghi_chu: ghi, dong_y: Boolean(d.dong_y && ghi),
    } });
    if (error) return NextResponse.json({ ok: true, luu: false });
    return NextResponse.json({ ok: true, luu: true, cho_duyet: (data as { trang_thai?: string })?.trang_thai === "cho_duyet" });
  } catch (e) {
    baoLoi(e, { noi: "api", duong: "/api/thanso/phan-hoi" });
    return NextResponse.json({ ok: true, luu: false });
  }
}
