// Bản Markdown cho bot AI: /<đường dẫn>.md được rewrite sang /md/<đường dẫn> (next.config.mjs).
// /index.md · /kien-thuc.md · /kien-thuc/<chủ đề>.md · /kien-thuc/<chủ đề>/<trang>.md · /tu-dien.md
import { CHU_DE, dsTuoiHuong, mucLuc, trang, tuDien, tuoiHuong } from "@/lib/kien-thuc";
import { mdChuDe, mdDsTuoi, mdThuVien, mdTrang, mdTuDien, mdTuoi, TEN_MANG, traMd } from "@/lib/markdown";
import { taoLlmsTxt } from "@/lib/llms";

export const revalidate = 21600;

const KHONG_CO = () => new Response("Không có bản Markdown cho trang này.\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

export async function GET(_req: Request, { params: thamSo }: { params: Promise<{ duong: string[] }> }) {
  const params = await thamSo;
  const p = params.duong.map(decodeURIComponent);
  if (p.length === 1 && p[0] === "index") return traMd(await taoLlmsTxt(), "/");
  if (p.length === 1 && p[0] === "tu-dien") {
    const d = await tuDien();
    return d ? traMd(mdTuDien(d.muc, TEN_MANG), "/tu-dien") : KHONG_CO();
  }
  if (p[0] === "phong-thuy" && p.length === 2) {
    if (p[1] === "huong-hop-tuoi") return traMd(mdDsTuoi(await dsTuoiHuong()), "/phong-thuy/huong-hop-tuoi");
    const t = await tuoiHuong(p[1]!);
    return t ? traMd(mdTuoi(t), `/phong-thuy/${p[1]}`) : KHONG_CO();
  }
  const [goc, khoa, slug] = p;
  if (goc !== "kien-thuc" || p.length > 3) return KHONG_CO();
  if (!khoa) return traMd(mdThuVien(await mucLuc()), "/kien-thuc");
  const cd = CHU_DE[khoa];
  if (!cd) return KHONG_CO();
  if (!slug) {
    const md = mdChuDe(khoa, await mucLuc());
    return md ? traMd(md, `/kien-thuc/${khoa}`) : KHONG_CO();
  }
  const t = await trang(cd.loai, slug);
  return t ? traMd(mdTrang(t), `/kien-thuc/${khoa}/${slug}`) : KHONG_CO();
}
