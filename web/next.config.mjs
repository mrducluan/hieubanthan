/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    // instrumentation.ts (Sentry phía server, chỉ khi có SENTRY_DSN).
    instrumentationHook: true,
    // Ảnh thẻ chia sẻ (/og) đọc font OFL từ assets/fonts — đưa vào gói deploy.
    outputFileTracingIncludes: { "/og": ["./assets/fonts/**"] },
  },
};
export default nextConfig;
