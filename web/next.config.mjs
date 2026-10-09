/** @type {import("next").NextConfig} */
const nextConfig = {
  // AIO: bản Markdown cho bot AI — "<trang>.md" → route /md/<trang> (chuẩn llmstxt.org). "/index.md" = trang chủ.
  // Header bảo mật cơ bản (tín hiệu tin cậy; không chặn tính năng nào đang dùng — la bàn cần cảm biến chuyển động).
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        // CSP đầy đủ (nonce theo lượt tải) đặt ở middleware.ts — xem lib/csp.ts.
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), accelerometer=(self), gyroscope=(self), magnetometer=(self)" },
      ],
    }];
  },
  async rewrites() {
    return { beforeFiles: [{ source: "/:duong((?:[^/]+/)*[^/.]+)\\.md", destination: "/md/:duong" }] };
  },
  // Next 15 mặc định "stream" metadata: <title>/<meta> nằm cuối <body> (JS mới dời lên <head>). Googlebot và bot AI
  // (GPTBot, ClaudeBot, PerplexityBot…) không nằm trong danh sách mặc định → bot không chạy JS đọc nhầm <title> của
  // hình SVG. Mọi bot / crawler / trình xem trước link nhận metadata ngay trong <head> (kiểm bằng scripts/kiem-tra-seo.mjs).
  htmlLimitedBots: /bot|crawl|spider|slurp|preview|facebookexternalhit|facebookcatalog|embedly|whatsapp|zalo|google-inspectiontool|google-extended|googleother|mediapartners-google|adsbot-google|storebot-google|anthropic|claude|perplexity|cohere|bytespider|meta-externalagent|ia_archiver|vkshare|yeti/i,
  // Ảnh thẻ chia sẻ (/og) đọc font OFL từ assets/fonts — đưa vào gói deploy. (Next 15: instrumentation.ts bật sẵn.)
  outputFileTracingIncludes: { "/og": ["./assets/fonts/**"] },
  // Blog: ảnh bìa bài NotFair đi qua tối ưu ảnh của Next (/_next/image).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "notfair.co", pathname: "/api/seo/**" },
    ],
  },
};
export default nextConfig;
