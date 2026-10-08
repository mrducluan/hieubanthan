/** @type {import("next").NextConfig} */
const nextConfig = {
  // AIO: bản Markdown cho bot AI — "<trang>.md" → route /md/<trang> (chuẩn llmstxt.org). "/index.md" = trang chủ.
  async rewrites() {
    return { beforeFiles: [{ source: "/:duong((?:[^/]+/)*[^/.]+)\\.md", destination: "/md/:duong" }] };
  },
  experimental: {
    // instrumentation.ts (Sentry phía server, chỉ khi có SENTRY_DSN).
    instrumentationHook: true,
    // Ảnh thẻ chia sẻ (/og) đọc font OFL từ assets/fonts — đưa vào gói deploy.
    outputFileTracingIncludes: { "/og": ["./assets/fonts/**"] },
  },
};
export default nextConfig;
