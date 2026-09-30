/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    // Ảnh thẻ chia sẻ (/og) đọc font OFL từ assets/fonts — đưa vào gói deploy.
    outputFileTracingIncludes: { "/og": ["./assets/fonts/**"] },
  },
};
export default nextConfig;
