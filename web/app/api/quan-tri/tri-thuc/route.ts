// POST /api/quan-tri/tri-thuc — "Xuất bản" bản sửa kho tri thức = mở PR trên GitHub (QT-1). Không ghi thẳng main:
// CI (pytest, golden, rà SEO, e2e) chạy trên PR, chủ dự án xem khác biệt rồi merge.
// Cổng: phiên quản trị aal2 + vai trò được sửa (SUA_KB) + cùng origin. Người đề xuất ghi vào nhat_ky_quan_tri;
// mô tả PR chỉ ghi vai trò + mã rút gọn (repo có thể công khai — không lộ email).
import { NextResponse } from "next/server";
import { z } from "zod";
import { phienQuanTri, SUA_KB, TEN_VAI_TRO } from "@/lib/quan-tri";
import { apDungSua, DAI_TOI_DA, khoaDuong } from "@/lib/kb-sua";
import { CHI_XEM, docTepKb, LoiGithub, moPrSuaKb, TEN_TEP } from "@/lib/github-quan-tri";

const DauVao = z.object({
  tep: z.string().regex(TEN_TEP),
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  ghi_chu: z.string().max(500).default(""),
  sua: z.array(z.object({
    duong: z.array(z.union([z.string().max(200), z.number().int().min(0)])).min(1).max(12),
    cu: z.string().max(DAI_TOI_DA),
    moi: z.string().max(DAI_TOI_DA),
  })).min(1).max(200),
});

const cat = (s: string, n = 160) => (s.length > n ? `${s.slice(0, n)}…` : s).replace(/\s+/g, " ");

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin) return NextResponse.json({ error: "Sai nguồn gửi." }, { status: 403 });

  const p = await phienQuanTri();
  if (p.trang !== "ok") return NextResponse.json({ error: "Phiên quản trị hết hạn — tải lại trang." }, { status: 401 });
  if (!SUA_KB.includes(p.vaiTro)) return NextResponse.json({ error: "Vai trò của bạn chỉ được xem." }, { status: 403 });

  const vao = DauVao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu sửa không hợp lệ." }, { status: 422 });
  const { tep, sha, ghi_chu, sua } = vao.data;
  if (CHI_XEM.has(tep)) return NextResponse.json({ error: "File này sửa bằng công cụ riêng, không sửa ở đây." }, { status: 403 });

  try {
    const goc = await docTepKb(tep);
    if (goc.sha !== sha) return NextResponse.json({ error: "File vừa được sửa trên GitHub — tải lại trang rồi sửa lại." }, { status: 409 });
    let moi: string;
    try { moi = apDungSua(goc.text, sua); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 409 }); }
    if (moi === goc.text) return NextResponse.json({ error: "Không có gì thay đổi." }, { status: 422 });

    const ma = p.user.id.slice(0, 8);
    const tieuDe = `QT-1: sửa ${tep} (${sua.length} mục) từ trang quản trị`;
    const moTa = [
      `Đề xuất từ \`/quan-tri\` — ${TEN_VAI_TRO[p.vaiTro]} \`${ma}\`.`,
      ghi_chu.trim() ? `\n> ${ghi_chu.trim().replace(/\n/g, "\n> ")}\n` : "",
      `\n| Mục | Trước | Sau |\n|---|---|---|`,
      ...sua.map((s) => `| \`${khoaDuong(s.duong).replace(/\|/g, "\\|")}\` | ${cat(s.cu).replace(/\|/g, "\\|")} | ${cat(s.moi).replace(/\|/g, "\\|")} |`),
      `\nChỉ đổi giá trị chuỗi đã có (định dạng file giữ nguyên). Merge khi CI xanh; Render/Vercel tự triển khai.`,
    ].join("\n");
    const pr = await moPrSuaKb({ ten: tep, shaGoc: sha, text: moi, tieuDe, moTa });
    await p.sb.rpc("ghi_nhat_ky_quan_tri", {
      p_hanh_dong: "kb.de_xuat", p_doi_tuong: tep, p_chi_tiet: { pr: pr.url, so_muc: sua.length },
    });
    return NextResponse.json({ pr });
  } catch (e) {
    // Token GitHub sai/thiếu quyền (401/403 từ GitHub) ≠ phiên quản trị hết hạn → 502, kèm lời báo về token.
    if (e instanceof LoiGithub) return NextResponse.json({ error: e.message }, { status: e.status >= 500 || e.status === 401 || e.status === 403 ? 502 : e.status });
    return NextResponse.json({ error: "Chưa mở được PR, thử lại sau." }, { status: 500 });
  }
}
