// POST /api/quan-tri/ai — trợ lý AI trong Kho tri thức (QT-3). Chỉ vai trò được sửa KB, phiên aal2, cùng origin.
//   viec "soan": AI soạn NHÁP cho một ô chuỗi → trả về cho người quản trị đọc/sửa; không ghi đâu cả. Xuất bản vẫn là PR.
//   viec "kiem": kiểm định bằng luật cố định (không AI) cho các ô đang sửa — chạy trước khi mở PR.
// Engine giữ khoá OpenRouter + hạn mức lượt AI quản trị riêng. Nhật ký quản trị chỉ ghi file + vị trí, không ghi nội dung.
import { NextResponse } from "next/server";
import { z } from "zod";
import { SUA_KB } from "@/lib/quan-tri";
import { congApi } from "@/lib/quan-tri-api";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { DAI_TOI_DA, khoaDuong } from "@/lib/kb-sua";
import { TEN_TEP } from "@/lib/github-quan-tri";

const DauVao = z.discriminatedUnion("viec", [
  z.object({
    viec: z.literal("soan"), tep: z.string().regex(TEN_TEP),
    duong: z.array(z.union([z.string().max(200), z.number().int().min(0)])).min(1).max(12),
    hien_tai: z.string().max(DAI_TOI_DA),
    hanh_dong: z.enum(["viet_lai", "mo_rong", "rut_gon", "soat_loi", "doi_thuong"]),
    yeu_cau: z.string().max(500).default(""),
    ngu_canh: z.record(z.string(), z.unknown()).default({}),
  }),
  z.object({
    viec: z.literal("kiem"),
    muc: z.array(z.object({ moi: z.string().max(DAI_TOI_DA), cu: z.string().max(DAI_TOI_DA).optional() })).min(1).max(200),
  }),
]);

export async function POST(req: Request) {
  const p = await congApi(req, SUA_KB);
  if (p instanceof NextResponse) return p;
  const vao = DauVao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });
  const { viec, ...du } = vao.data;
  const kq = await goiEngineDaKiem(du, viec === "soan" ? "/v1/quan-tri/soan-nhap" : "/v1/quan-tri/kiem-dinh", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  if (vao.data.viec === "soan") {
    await p.sb.rpc("ghi_nhat_ky_quan_tri", {
      p_hanh_dong: "ai.soan_nhap", p_doi_tuong: `${vao.data.tep}:${khoaDuong(vao.data.duong)}`.slice(0, 200),
      p_chi_tiet: { hanh_dong: vao.data.hanh_dong },
    });
  }
  return NextResponse.json(kq.body);
}
