// robots.txt — mở cho máy tìm kiếm và bot AI (GEO: muốn được trích dẫn trong câu trả lời AI).
// Chặn trang cá nhân/khoá theo người (tài khoản, lời mời, thẻ riêng) và API.
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const CHAN = ["/api/", "/tai-khoan", "/dang-nhap", "/auth/", "/chia-se", "/hop-doi/", "/the/"];
const BOT_AI = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Bytespider", "meta-externalagent",
  "DuckAssistBot", "cohere-ai", "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: CHAN },
      { userAgent: BOT_AI, allow: ["/", "/llms.txt", "/llms-full.txt"], disallow: CHAN },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
