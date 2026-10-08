// /llms-full.txt — toàn văn thư viện kiến thức dạng Markdown để mô hình ngôn ngữ đọc một lần.
import { CHU_DE, mucLuc, trang } from "@/lib/kien-thuc";
import { mdTrang, NGUYEN_TAC } from "@/lib/markdown";
import { MO_TA_SITE, TEN_SITE } from "@/lib/seo";

export const revalidate = 21600;

export async function GET() {
  const ds = await mucLuc();
  const phan: string[] = [`# ${TEN_SITE} — thư viện kiến thức (toàn văn)`, "", `> ${MO_TA_SITE}`, "", ...NGUYEN_TAC, ""];
  for (const cd of Object.values(CHU_DE)) {
    phan.push(`# ${cd.ten}`, "");
    const muc = ds.filter((t) => t.loai === cd.loai);
    for (let i = 0; i < muc.length; i += 8) {
      const lo = await Promise.all(muc.slice(i, i + 8).map((t) => trang(t.loai, t.slug)));
      for (const t of lo) if (t) phan.push(mdTrang(t, 2));
    }
  }
  return new Response(phan.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
