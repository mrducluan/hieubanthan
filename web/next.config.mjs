/** @type {import("next").NextConfig} */
const nextConfig = {
  // AIO: bản Markdown cho bot AI — "<trang>.md" → route /md/<trang> (chuẩn llmstxt.org). "/index.md" = trang chủ.
  // Header bảo mật cơ bản (tín hiệu tin cậy; không chặn tính năng nào đang dùng — la bàn cần cảm biến chuyển động).
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        // SEC-1: CSP nền — không nhúng trang vào khung web lạ (chống clickjacking), không <base>/plugin lạ, form chỉ gửi
        // về chính site. Chưa khoá script-src (Next + GTM + PostHog cần inline/nonce — để bước sau).
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
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
  // Ảnh thẻ chia sẻ (/og) đọc font OFL từ assets/fonts — đưa vào gói deploy. (Next 15: instrumentation.ts bật sẵn.)
  outputFileTracingIncludes: { "/og": ["./assets/fonts/**"] },
};
export default nextConfig;
