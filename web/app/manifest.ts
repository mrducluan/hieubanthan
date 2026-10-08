// Web app manifest — tên, màu, biểu tượng khi người dùng "Thêm vào màn hình chính".
import type { MetadataRoute } from "next";
import { MO_TA_SITE, TEN_SITE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${TEN_SITE} — thần số học & huyền học phương Đông`,
    short_name: TEN_SITE,
    description: MO_TA_SITE,
    lang: "vi",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a17",
    theme_color: "#0a0a17",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
