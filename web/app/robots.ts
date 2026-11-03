// robots.txt — mở cho máy tìm kiếm và bot AI TÌM KIẾM / TRẢ LỜI (GEO: được trích dẫn, người dùng bấm về hieuban.com).
// BM-2 (chủ dự án 2026-10-09): CHẶN bot thu thập để HUẤN LUYỆN mô hình — nội dung không bị nạp vào mô hình AI.
// Chặn trang cá nhân/khoá theo người (tài khoản, lời mời, thẻ riêng) và API.
// Lưu ý: Google-Extended không phải bot riêng mà là cờ cho phép Gemini dùng nội dung (grounding câu trả lời + huấn luyện) —
// AUD-Q6 (chủ dự án 2026-11-03): MỞ để Gemini trích dẫn được hieuban.com. Googlebot (Search, AI Overviews) không phụ thuộc cờ này.
// Applebot-Extended tương tự (Applebot vẫn index cho Siri/Spotlight).
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const CHAN = ["/api/", "/md/", "/quan-tri", "/tai-khoan", "/dang-nhap", "/auth/", "/chia-se", "/hop-doi/", "/the/", "/qua/", "/khung/"];
/** Mở lại cụm kiến thức nằm dưới đường dẫn bị chặn (QH-URL: cặp số dời về /hop-doi/cap-so, còn /hop-doi/{mã} là link mời).
 *  Google/Bing lấy luật khớp DÀI NHẤT → Allow này thắng Disallow "/hop-doi/". */
const MO = ["/hop-doi/cap-so"];
/** Bot AI trả lời / tìm kiếm (dẫn link về trang gốc) — mở. */
export const BOT_AI_TRA_LOI = [
  "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User",
  "DuckAssistBot", "MistralAI-User", "meta-externalfetcher",
  // AUD-Q6: Google-Extended — Google không tách được grounding với huấn luyện; chủ dự án chọn mở để được Gemini trích dẫn.
  "Google-Extended",
];
/** Bot thu thập để huấn luyện mô hình — chặn toàn site.
 *  SEO-K (2026-10-21): thêm GoogleOther (+ -Image, -Video) — bot Google dùng cho nghiên cứu / sản phẩm ngoài Search;
 *  chặn KHÔNG ảnh hưởng Googlebot, Google Search hay AI Overviews (Google ghi rõ trong tài liệu crawler), chỉ bớt tải
 *  máy chủ và giữ đúng tinh thần BM-2 (nội dung không bị lấy ngoài mục đích tìm kiếm). */
export const BOT_AI_HUAN_LUYEN = [
  "GPTBot", "ClaudeBot", "anthropic-ai", "Applebot-Extended", "CCBot", "Bytespider",
  "meta-externalagent", "cohere-ai", "cohere-training-data-crawler", "Diffbot", "Omgilibot", "Timpibot",
  "ImagesiftBot", "PanguBot", "Amazonbot", "GoogleOther", "GoogleOther-Image", "GoogleOther-Video",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", ...MO], disallow: CHAN },
      { userAgent: BOT_AI_TRA_LOI, allow: ["/", "/llms.txt", ...MO], disallow: CHAN },
      { userAgent: BOT_AI_HUAN_LUYEN, disallow: "/" },
    ],
    // SEO-K: sitemap riêng cho trang ngày tốt (≈ 400 URL, đổi hằng ngày).
    // SEO-M: chỉ mục sitemap theo cụm kiến thức — Search Console báo chỉ mục theo từng cụm.
    sitemap: [`${siteUrl()}/sitemap.xml`, `${siteUrl()}/sitemap-ngay.xml`, `${siteUrl()}/sitemap-cum.xml`],
    host: siteUrl(),
  };
}
