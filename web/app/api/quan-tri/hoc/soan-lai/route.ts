// POST /api/quan-tri/hoc/soan-lai — HTT-2 H6: "Soạn lại nháp → PR" cho một mã hộp bị LỆCH theo ngôn ngữ (khung "Lệch theo
// ngôn ngữ" ở /quan-tri/hoc). Hai bước, đều do NGƯỜI DUYỆT bấm:
//   viec = "nhap": engine suy cụm KB từ mã, chạy máy chuyển ngữ QT-0 ba lượt chỉ trên cụm đó, trả nháp (không ghi gì);
//   viec = "pr":   mở PR vào kb/data/en/<tệp> qua đúng cơ chế QT-1 (chỉ đổi giá trị chuỗi đang có, nhánh quan-tri/…, CI chạy,
//                  chủ dự án merge). Máy không sửa KB, không tự bật.
// Cổng: phiên quản trị aal2 + vai trò được sửa KB + cùng origin (congApi).
import { NextResponse } from "next/server";
import { z } from "zod";
import { congApi } from "@/lib/quan-tri-api";
import { SUA_KB, TEN_VAI_TRO } from "@/lib/quan-tri";
import { apDungSua, DAI_TOI_DA, khoaDuong, type DuongDan } from "@/lib/kb-sua";
import { docTepKb, LoiGithub, moPrSuaKb, TEN_TEP } from "@/lib/github-quan-tri";
import { goiEngineDaKiem } from "@/lib/proxy";

const MA = /^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$/;
const DauVao = z.discriminatedUnion("viec", [
  z.object({ viec: z.literal("nhap"), ma: z.string().regex(MA).max(60), ngon_ngu: z.literal("en").default("en") }).strict(),
  z.object({
    viec: z.literal("pr"), ma: z.string().regex(MA).max(60), tep: z.string().regex(TEN_TEP), ghi_chu: z.string().max(500).default(""),
    sua: z.array(z.object({ duong: z.string().min(1).max(200), cu: z.string().max(DAI_TOI_DA), moi: z.string().min(1).max(DAI_TOI_DA) })).min(1).max(100),
  }).strict(),
]);

/** "la.dai_0.y_xuoi" → ["la", "dai_0", "y_xuoi"]; "muc.3.de_hieu" → ["muc", 3, "de_hieu"] (chỉ số mảng thành số). */
const duongTuChuoi = (d: string): DuongDan => d.split(".").map((k) => (/^\d+$/.test(k) ? Number(k) : k));
const cat = (s: string, n = 160) => (s.length > n ? `${s.slice(0, n)}…` : s).replace(/\s+/g, " ");

export async function POST(req: Request) {
  const p = await congApi(req, SUA_KB);
  if (p instanceof NextResponse) return p;
  const vao = DauVao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });

  if (vao.data.viec === "nhap") {
    const kq = await goiEngineDaKiem({ ma: vao.data.ma, ngon_ngu: vao.data.ngon_ngu }, "/v1/quan-tri/soan-lai-lech",
      process.env.ENGINE_QUAN_TRI_KEY ? { "x-quan-tri-key": process.env.ENGINE_QUAN_TRI_KEY } : {});
    if (!kq.ok) return kq.res;
    return NextResponse.json(kq.body);
  }

  const { ma, tep, ghi_chu, sua } = vao.data;
  if (!tep.startsWith("en/")) return NextResponse.json({ error: "Chỉ mở PR cho bản phủ tiếng Anh (en/…)." }, { status: 422 });
  try {
    const goc = await docTepKb(tep);
    const muc = sua.map((s) => ({ duong: duongTuChuoi(s.duong), cu: s.cu, moi: s.moi })).filter((s) => s.cu !== s.moi);
    if (!muc.length) return NextResponse.json({ error: "Không có gì thay đổi." }, { status: 422 });
    let moi: string;
    try { moi = apDungSua(goc.text, muc); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 409 }); }
    const maNguoi = p.user.id.slice(0, 8);
    const tieuDe = `HTT-2 H6: soạn lại bản dịch cho mã lệch \`${ma}\` (${tep}, ${muc.length} chuỗi)`;
    const moTa = [
      `Đề xuất từ \`/quan-tri/hoc\` (khung Lệch theo ngôn ngữ) — ${TEN_VAI_TRO[p.vaiTro]} \`${maNguoi}\`.`,
      `Mã hộp \`${ma}\` được bản tiếng Anh thấy "đúng" ít hơn hẳn bản Việt; máy chuyển ngữ QT-0 soạn lại nháp CHỈ cụm KB sinh hộp đó`,
      `(ba lượt: chuyển ngữ → biên tập bản xứ → kiểm định có điểm + dịch ngược; bộ kiểm luật cố định). Người bản xứ đọc rồi mới merge.`,
      ghi_chu.trim() ? `\n> ${ghi_chu.trim().replace(/\n/g, "\n> ")}\n` : "",
      `\n| Chuỗi | Trước | Sau |\n|---|---|---|`,
      ...muc.map((s) => `| \`${khoaDuong(s.duong).replace(/\|/g, "\\|")}\` | ${cat(s.cu).replace(/\|/g, "\\|")} | ${cat(s.moi).replace(/\|/g, "\\|")} |`),
      `\nChỉ đổi giá trị chuỗi đã có (định dạng file giữ nguyên). Merge khi CI xanh; Render tự triển khai.`,
    ].join("\n");
    const pr = await moPrSuaKb({ ten: tep, shaGoc: goc.sha, text: moi, tieuDe, moTa });
    await p.sb.rpc("ghi_nhat_ky_quan_tri", { p_hanh_dong: "kb.soan_lai_lech", p_doi_tuong: tep, p_chi_tiet: { pr: pr.url, ma, so_muc: muc.length } });
    return NextResponse.json({ pr });
  } catch (e) {
    if (e instanceof LoiGithub) return NextResponse.json({ error: e.message }, { status: e.status >= 500 || e.status === 401 || e.status === 403 ? 502 : e.status });
    return NextResponse.json({ error: "Chưa mở được PR, thử lại sau." }, { status: 500 });
  }
}
