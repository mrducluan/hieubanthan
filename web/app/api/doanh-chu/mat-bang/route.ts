// POST /api/doanh-chu/mat-bang — Proxy Kiểm tra Mặt Bằng & Khai Trương (Huyền Không + Mệnh Quái + Hoàng Lịch, Zero-PII).
import { NextResponse } from "next/server";
import { z } from "zod";
import { baoLoi } from "@/lib/giam-sat";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  do_huong: z.number().min(0).lt(360),
  nam_xay: z.number().int().min(1900).max(2043),
  ngay_sinh: z.number().int().min(1).max(31),
  thang_sinh: z.number().int().min(1).max(12),
  nam_sinh: z.number().int().min(1930).max(2025),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  loai_hinh: z.enum(["van_phong", "cua_hang", "quan_ca_phe", "xuong_kho"]).default("van_phong"),
}).strict();

function ngayHopLe(nam: number, thang: number, ngay: number): boolean {
  const d = new Date(Date.UTC(nam, thang - 1, ngay));
  return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay;
}

export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  }
  const { ngay_sinh, thang_sinh, nam_sinh } = parsed.data;
  if (!ngayHopLe(nam_sinh, thang_sinh, ngay_sinh)) {
    return NextResponse.json({ error: loiChung("khong_hop_le", en) }, { status: 422 });
  }
  try {
    const res = await goiEngineDaKiem("/v1/doanh-chu/mat-bang", parsed.data, dauNguoiGoi(req), en);
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          {
            error: en
              ? "The Site & Opening Checklist is being updated on the server. Please try again in a few minutes."
              : "Tính năng Kiểm tra Mặt bằng & Khai trương đang được cập nhật trên máy chủ. Vui lòng thử lại sau vài phút.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    return NextResponse.json(res.du_lieu, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    baoLoi(e, { noi: "api", duong: "/api/doanh-chu/mat-bang" });
    return NextResponse.json({ error: loiChung("ket_noi", en) }, { status: 502 });
  }
}
