// Lexical → HTML phía CMS (web nhận HTML trong trường noi_dung_html, rồi lọc lại bằng allowlist ở web/lib/cms-html.ts).
import { LinkHTMLConverterAsync, type HTMLConvertersFunctionAsync } from "@payloadcms/richtext-lexical/html-async";
import { CONG_CU } from "../blocks";

const thoat = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const doan = (s: unknown) => thoat(s).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

const TEN_GHI_CHU: Record<string, string> = { luu_y: "Lưu ý", meo: "Mẹo", tu_soi: "Tự soi", tom_tat: "Tóm tắt" };

type AnhDoc = { url?: string; alt?: string; chu_thich?: string; mimeType?: string; width?: number; height?: number;
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null }> };

export const boChuyenHtml: HTMLConvertersFunctionAsync = ({ defaultConverters }) => ({
  ...defaultConverters,
  // Ảnh trong bài: <figure><img srcset (nhỏ/vừa/gốc)> + chú thích. Không dùng <picture> mặc định của Payload
  // (nó đưa cả cỡ "og" đã cắt 1200×630 vào, màn hình nhỏ sẽ thấy ảnh bị cắt).
  upload: async ({ node, populate }: { node: { value: unknown; relationTo: string; fields?: { alt?: string } };
    populate?: (a: { collectionSlug: string; id: number | string }) => Promise<unknown> }) => {
    let doc = node.value as AnhDoc | number | string | undefined;
    if ((typeof doc === "number" || typeof doc === "string") && populate) {
      doc = (await populate({ collectionSlug: node.relationTo, id: doc })) as AnhDoc | undefined;
    }
    if (!doc || typeof doc !== "object" || !doc.url || !String(doc.mimeType ?? "").startsWith("image")) return "";
    const nguon = [["nho", doc.sizes?.nho], ["vua", doc.sizes?.vua]]
      .filter(([, c]) => c && typeof c === "object" && (c as { url?: string }).url && (c as { width?: number }).width)
      .map(([, c]) => `${thoat((c as { url: string }).url)} ${(c as { width: number }).width}w`);
    if (doc.width) nguon.push(`${thoat(doc.url)} ${doc.width}w`);
    const alt = thoat(node.fields?.alt || doc.alt || "");
    const img = `<img src="${thoat(doc.sizes?.vua?.url || doc.url)}"${nguon.length > 1 ? ` srcset="${nguon.join(", ")}" sizes="(max-width: 768px) 100vw, 768px"` : ""} alt="${alt}"${doc.width && doc.height ? ` width="${doc.width}" height="${doc.height}"` : ""}>`;
    return `<figure>${img}${doc.chu_thich ? `<figcaption>${thoat(doc.chu_thich)}</figcaption>` : ""}</figure>`;
  },
  blocks: {
    ghi_chu: ({ node }: { node: { fields: unknown } }) => {
      const f = node.fields as { kieu?: string; tieu_de?: string; noi_dung?: string };
      const kieu = TEN_GHI_CHU[f.kieu ?? ""] ? f.kieu! : "luu_y";
      return `<aside class="hbt-ghi-chu hbt-ghi-chu-${kieu}"><p class="hbt-ghi-chu-tieu-de">${thoat(f.tieu_de || TEN_GHI_CHU[kieu])}</p>${doan(f.noi_dung)}</aside>`;
    },
    keu_goi: ({ node }: { node: { fields: unknown } }) => {
      const f = node.fields as { cong_cu?: string; loi_moi?: string; nut?: string };
      const cc = CONG_CU.find((c) => c.value === f.cong_cu);
      if (!cc) return "";
      return `<aside class="hbt-keu-goi"><p>${thoat(f.loi_moi)}</p><p><a href="${cc.value}">${thoat(f.nut || "Xem của tôi")}</a></p></aside>`;
    },
    trich_dan: ({ node }: { node: { fields: unknown } }) => {
      const f = node.fields as { cau?: string; nguon?: string; dich_nghia?: string };
      return `<figure class="hbt-trich-dan"><blockquote>${doan(f.cau)}</blockquote><figcaption>${thoat(f.nguon)}</figcaption>${f.dich_nghia ? `<div class="hbt-dich-nghia">${doan(f.dich_nghia)}</div>` : ""}</figure>`;
    },
  },
  // Link nội bộ tới bài khác trong CMS → /blog/{slug} (đường dẫn tương đối, web hiểu là trong site).
  ...LinkHTMLConverterAsync({ internalDocToHref: linkNoiBo as never }),
});

/** Link nội bộ (chọn bài trong CMS) → đường dẫn trên web. */
export async function linkNoiBo({ linkNode, populate }: {
  linkNode: { fields: { doc?: { relationTo?: string; value?: unknown } } };
  populate?: (a: { collectionSlug: string; id: number | string }) => Promise<unknown>;
}): Promise<string> {
  const d = linkNode.fields.doc;
  if (!d) return "#";
  let v = d.value as { slug?: string } | number | string | undefined;
  if ((typeof v === "number" || typeof v === "string") && populate && d.relationTo) {
    v = (await populate({ collectionSlug: d.relationTo, id: v })) as { slug?: string } | undefined;
  }
  const slug = v && typeof v === "object" ? v.slug : undefined;
  if (!slug) return "#";
  return d.relationTo === "bai-viet" ? `/blog/${slug}` : "#";
}
