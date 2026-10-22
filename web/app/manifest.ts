// Web app manifest — tên, màu, biểu tượng khi người dùng "Thêm vào màn hình chính" / "Cài ứng dụng".
// Chrome cần PNG 192 + 512 (có bản maskable cho Android) mới hiện nút cài; lối tắt khi nhấn giữ biểu tượng app.
import type { MetadataRoute } from "next";
import { MO_TA_SITE, TEN_SITE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${TEN_SITE} — thần số học & huyền học phương Đông`,
    short_name: TEN_SITE,
    description: MO_TA_SITE,
    lang: "vi",
    dir: "ltr",
    start_url: "/hom-nay?tu=app",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a17",
    theme_color: "#0a0a17",
    categories: ["lifestyle", "education"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/bieu-tuong/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/bieu-tuong/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/bieu-tuong/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Hôm nay của bạn", short_name: "Hôm nay", url: "/hom-nay?tu=app", icons: [{ src: "/bieu-tuong/192", sizes: "192x192" }] },
      { name: "Thần số học", short_name: "Thần số", url: "/than-so?tu=app", icons: [{ src: "/bieu-tuong/192", sizes: "192x192" }] },
      { name: "Xem ngày tốt", short_name: "Ngày tốt", url: "/xem-ngay-tot?tu=app", icons: [{ src: "/bieu-tuong/192", sizes: "192x192" }] },
    ],
  };
}
