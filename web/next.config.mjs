import { readFileSync } from "node:fs";

const CHUYEN = JSON.parse(readFileSync(new URL("./lib/chuyen-huong.json", import.meta.url), "utf8"));

/** QH-URL (phương án B): URL cũ → URL silo theo mảng, 308 (giữ tín hiệu xếp hạng). Một nguồn với lib/kien-thuc.ts.
 *  Mỗi mẫu có cả bản ".md" (segment ":trang" nhận luôn đuôi .md) — không chuỗi 2 bước. */
function chuyenHuong() {
  const ds = [];
  const them = (cu, moi) => ds.push(
    { source: cu, destination: moi, permanent: true },
    { source: `${cu}.md`, destination: `${moi}.md`, permanent: true },
    { source: `${cu}/:trang`, destination: `${moi}/:trang`, permanent: true },
  );
  for (const [khoa, moi] of Object.entries(CHUYEN.chu_de)) them(`/kien-thuc/${khoa}`, moi);
  for (const [cu, moi] of CHUYEN.trang) them(cu, moi);
  // SEO-K: trang tuổi gộp nam + nữ → /phong-thuy/huong-hop-tuoi/tuoi-1990(.md). Bản một giới tính (cả đường dẫn trước
  // QH-URL /phong-thuy/tuoi-1990-nam) đi THẲNG một bước tới bản gộp.
  for (const goc of ["/phong-thuy", CHUYEN.tuoi_huong]) {
    ds.push(
      { source: `${goc}/tuoi-:nam(\\d{4})-:gioi(nam|nu)`, destination: `${CHUYEN.tuoi_huong}/tuoi-:nam`, permanent: true },
      { source: `${goc}/tuoi-:nam(\\d{4})-:gioi(nam|nu).md`, destination: `${CHUYEN.tuoi_huong}/tuoi-:nam.md`, permanent: true },
    );
  }
  return ds;
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  // AIO: bản Markdown cho bot AI — "<trang>.md" → route /md/<trang> (chuẩn llmstxt.org). "/index.md" = trang chủ.
  // Header bảo mật cơ bản (tín hiệu tin cậy; không chặn tính năng nào đang dùng — la bàn cần cảm biến chuyển động).
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        // CSP đầy đủ (nonce theo lượt tải) đặt ở proxy.ts — xem lib/csp.ts.
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), accelerometer=(self), gyroscope=(self), magnetometer=(self)" },
      ],
    }];
  },
  async redirects() {
    return chuyenHuong();
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
