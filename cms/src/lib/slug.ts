import { slugViet, TIEU_DE_TAM } from "../kiem-dinh/kiem-dinh";

/** Slug tiếng Việt cho slugField của Payload (kiểu Slugify chưa được export ở gói gốc) (mặc định của Payload không bỏ được "đ").
 *  Tiêu đề tạm "(Chưa đặt tiêu đề)" không sinh slug — nếu không, nháp chưa đặt tên thứ hai sẽ trùng slug với nháp đầu. */
export const taoSlug = ({ valueToSlugify, req }: { valueToSlugify?: unknown; req?: { context?: Record<string, unknown> } }): string | undefined =>
  typeof valueToSlugify === "string" && valueToSlugify.trim() && !valueToSlugify.startsWith(TIEU_DE_TAM)
    // BLOG-3: bài nhập từ NotFair giữ NGUYÊN slug gốc (có thể có dấu) — đối tác kiểm tra đúng URL /blog/{slug} đó.
    ? (req?.context?.giuSlugGoc ? valueToSlugify.trim() : slugViet(valueToSlugify)) : undefined;

/** Slug trống → sinh từ trường tên TRƯỚC khi kiểm "bắt buộc" (slugField chỉ tự sinh ở beforeChange, sau bước kiểm,
 *  nên tạo qua REST/Local API không gửi slug sẽ bị từ chối "Slug không hợp lệ"). */
export const slugTuTruong = (truong: string) =>
  ({ data, originalDoc }: { data?: Record<string, unknown>; originalDoc?: Record<string, unknown> }) => {
    if (!data) return data;
    const slug = String(data.slug ?? originalDoc?.slug ?? "");
    const goc = data[truong] ?? originalDoc?.[truong];
    if (!slug.trim() && typeof goc === "string" && goc.trim()) data.slug = taoSlug({ valueToSlugify: goc });
    return data;
  };
