// robots.txt — mở cho máy tìm kiếm và bot AI TÌM KIẾM / TRẢ LỜI (GEO: được trích dẫn, người dùng bấm về hieuban.com).
// BM-2 (chủ dự án 2026-10-09): CHẶN bot thu thập để HUẤN LUYỆN mô hình — nội dung không bị nạp vào mô hình AI.
// Chặn trang cá nhân/khoá theo người (tài khoản, lời mời, thẻ riêng) và API.
// Lưu ý: Google-Extended chỉ là cờ huấn luyện/grounding Gemini — Googlebot (Search, AI Overviews) vẫn được vào.
// Applebot-Extended tương tự (Applebot vẫn index cho Siri/Spotlight).
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const CHAN = ["/api/", "/md/", "/quan-tri", "/tai-khoan", "/dang-nhap", "/auth/", "/chia-se", "/hop-doi/", "/the/"];
/** Mở lại cụm kiến thức nằm dưới đường dẫn bị chặn (QH-URL: cặp số dời về /hop-doi/cap-so, còn /hop-doi/{mã} là link mời).
 *  Google/Bing lấy luật khớp DÀI NHẤT → Allow này thắng Disallow "/hop-doi/". */
const MO = ["/hop-doi/cap-so"];
/** Bot AI trả lời / tìm kiếm (dẫn link về trang gốc) — mở. */
export const BOT_AI_TRA_LOI = [
  "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User",
  "DuckAssistBot", "MistralAI-User", "meta-externalfetcher",
];
/** Bot thu thập để huấn luyện mô hình — chặn toàn site. */
export const BOT_AI_HUAN_LUYEN = [
  "GPTBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "Applebot-Extended", "CCBot", "Bytespider",
  "meta-externalagent", "cohere-ai", "cohere-training-data-crawler", "Diffbot", "Omgilibot", "Timpibot",
  "ImagesiftBot", "PanguBot", "Amazonbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", ...MO], disallow: CHAN },
      { userAgent: BOT_AI_TRA_LOI, allow: ["/", "/llms.txt", ...MO], disallow: CHAN },
      { userAgent: BOT_AI_HUAN_LUYEN, disallow: "/" },
    ],
    // SEO-K: sitemap riêng cho trang ngày tốt (≈ 400 URL, đổi hằng ngày).
    sitemap: [`${siteUrl()}/sitemap.xml`, `${siteUrl()}/sitemap-ngay.xml`],
    host: siteUrl(),
  };
}
