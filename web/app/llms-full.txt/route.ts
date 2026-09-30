// /llms-full.txt — toàn văn thư viện kiến thức dạng Markdown để mô hình ngôn ngữ đọc một lần.
import { CHU_DE, duongTrang, mucLuc, trang, type TrangKienThuc } from "@/lib/kien-thuc";
import { MO_TA_SITE, TEN_SITE, urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

function md(t: TrangKienThuc): string {
  const d = [`## ${t.tieu_de}`, "", `URL: ${urlDayDu(duongTrang(t.loai, t.slug))}`,
    `Trạng thái: ${t.trang_thai === "da_duyet" ? "đã duyệt" : "bản nháp AI, đang duyệt"} · Cập nhật: ${t.cap_nhat}`, "", t.tra_loi_nhanh, ""];
  for (const m of t.muc) {
    d.push(`### ${m.tieu_de}`, "");
    if (m.doan) d.push(m.doan, "");
    if (m.danh_sach) d.push(...m.danh_sach.map((x) => `- ${x}`), "");
  }
  d.push("### Hỏi đáp", "", ...t.hoi_dap.flatMap((h) => [`**${h.hoi}** ${h.dap}`, ""]), `Nguồn: ${t.nguon.join("; ")}`, "");
  return d.join("\n");
}

export async function GET() {
  const ds = await mucLuc();
  const phan: string[] = [`# ${TEN_SITE} — thư viện kiến thức (toàn văn)`, "", `> ${MO_TA_SITE}`, ""];
  for (const cd of Object.values(CHU_DE)) {
    phan.push(`# ${cd.ten}`, "");
    const muc = ds.filter((t) => t.loai === cd.loai);
    for (let i = 0; i < muc.length; i += 8) {
      const lo = await Promise.all(muc.slice(i, i + 8).map((t) => trang(t.loai, t.slug)));
      for (const t of lo) if (t) phan.push(md(t));
    }
  }
  return new Response(phan.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
