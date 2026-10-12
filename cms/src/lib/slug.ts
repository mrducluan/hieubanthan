import { slugViet, TIEU_DE_TAM } from "../kiem-dinh/kiem-dinh";

/** Slug tiếng Việt cho slugField của Payload (kiểu Slugify chưa được export ở gói gốc) (mặc định của Payload không bỏ được "đ").
 *  Tiêu đề tạm "(Chưa đặt tiêu đề)" không sinh slug — nếu không, nháp chưa đặt tên thứ hai sẽ trùng slug với nháp đầu. */
export const taoSlug = ({ valueToSlugify }: { valueToSlugify?: unknown }): string | undefined =>
  typeof valueToSlugify === "string" && valueToSlugify.trim() && !valueToSlugify.startsWith(TIEU_DE_TAM)
    ? slugViet(valueToSlugify) : undefined;
