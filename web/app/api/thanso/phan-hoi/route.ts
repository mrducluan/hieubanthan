// POST /api/thanso/phan-hoi — TS-V3 tầng HỌC: góp ý "đúng / chưa đúng" cho một câu trả lời thần số.
// Họ tên + ngày sinh chỉ dùng trong lượt gọi để engine tính CHỮ KÝ SỐ (các con số của hai phái); bảng chỉ lưu chữ ký,
// mã câu, phái, ghi chú đã lọc (khi người dùng tích đồng ý) — không tên, không ngày sinh, không user_id (migration 0016).
// Chưa bật Supabase → trả ok, luu: false (góp ý vẫn đo ẩn danh trên PostHog ở trình duyệt).
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { locGhiChu } from "@/lib/loc-ghi-chu";
import { baoLoi } from "@/lib/giam-sat";
import { dauNguoiGoi } from "@/lib/proxy";

// Chống dội góp ý (đẩy giả một cụm sang "chờ duyệt"): mỗi người gọi tối đa 12 góp ý / 10 phút trên một phiên bản máy
// chủ. Khoá = IP băm SHA-256 cắt ngắn, chỉ nằm trong bộ nhớ, không ghi đâu.
const CUA_SO_MS = 10 * 60_000, TRAN = 12;
const dem = new Map<string, number[]>();
function quaTay(req: Request): boolean {
  const ip = dauNguoiGoi(req)["x-nguoi-goi"] ?? "?";
  const k = createHash("sha256").update(ip).digest("base64url").slice(0, 16);
  const bay = Date.now();
  const ds = (dem.get(k) ?? []).filter((t) => bay - t < CUA_SO_MS);
  ds.push(bay);
  dem.set(k, ds);
  if (dem.size > 5000) dem.clear();
  return ds.length > TRAN;
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Input = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  phai: z.enum(["pitago", "chaldea", "tong_hop"]),
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
  if (quaTay(req)) return NextResponse.json({ ok: true, luu: false });
  const sb = khachDichVu();
  if (!sb) return NextResponse.json({ ok: true, luu: false });
  try {
    const r = await fetch(`${ENGINE_URL}/v1/thanso/chu-ky-so`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...dauNguoiGoi(req) },
      body: JSON.stringify({ ho_ten: d.ho_ten, ngay: d.ngay, thang: d.thang, nam: d.nam, quy_uoc_duong_doi: d.quy_uoc_duong_doi, phai: d.phai }),
      cache: "no-store",
    });
    if (!r.ok) return NextResponse.json({ ok: true, luu: false });
    const { chu_ky } = (await r.json()) as { chu_ky: Record<string, Record<string, number>> };
    const ghi = d.dong_y ? locGhiChu(d.ghi_chu) : null;
    const goi = (ghiChu: string | null) => sb.rpc("gui_phan_hoi_thanso", { p: {
      phai: d.phai, quy_uoc: d.quy_uoc_duong_doi, nguon: d.nguon, linh_vuc: d.linh_vuc ?? null, ma_cau: d.ma_cau ?? null,
      chu_ky, dung: d.dung, ghi_chu: ghiChu, dong_y: Boolean(d.dong_y && ghiChu),
    } });
    let { data, error } = await goi(ghi);
    // Ghi chú còn sót thông tin liên hệ (SQL chặn) → vẫn lưu góp ý, bỏ ghi chú; không đánh rơi cả góp ý.
    if (error && ghi) ({ data, error } = await goi(null));
    if (error) {
      // Rà vòng HỌC 2026-10-22: DB từ chối (vd chữ ký ngoài khoảng của thanso_chu_ky_hop_le) = góp ý mất âm thầm → báo
      // Sentry (chỉ mã lỗi, không chữ ký / ghi chú). Chưa chạy 0016 (PGRST202) thì im như cũ.
      if (error.code !== "PGRST202") baoLoi(new Error(`phan_hoi_thanso_${error.code ?? "loi"}`), { noi: "api", duong: "/api/thanso/phan-hoi" });
      return NextResponse.json({ ok: true, luu: false });
    }
    return NextResponse.json({ ok: true, luu: true, cho_duyet: (data as { trang_thai?: string })?.trang_thai === "cho_duyet" });
  } catch (e) {
    baoLoi(e, { noi: "api", duong: "/api/thanso/phan-hoi" });
    return NextResponse.json({ ok: true, luu: false });
  }
}
