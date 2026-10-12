import { slugViet } from "../kiem-dinh/kiem-dinh";

/** Slug tiếng Việt cho slugField của Payload (kiểu Slugify chưa được export ở gói gốc) (mặc định của Payload không bỏ được "đ"). */
export const taoSlug = ({ valueToSlugify }: { valueToSlugify?: unknown }): string | undefined =>
  typeof valueToSlugify === "string" && valueToSlugify.trim() ? slugViet(valueToSlugify) : undefined;
