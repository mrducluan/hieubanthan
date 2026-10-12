import type { MetadataRoute } from "next";

// CMS không bao giờ được lập chỉ mục (nội dung công khai nằm ở hieuban.com).
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
