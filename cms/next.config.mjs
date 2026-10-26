import { withPayload } from "@payloadcms/next/withPayload";

// Header bảo mật cho phòng biên tập: không cho nhúng khung, không index, không đoán kiểu tệp.
const bao = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  agentRules: false,
  // Vân tay kho tri thức (CG-6) đọc bằng fs lúc chạy → ép đóng gói kèm hàm máy chủ.
  outputFileTracingIncludes: { "/**/*": ["./src/kiem-dinh/van-tay-kb.json", "./assets/fonts/*.ttf"] },
  images: { localPatterns: [{ pathname: "/api/media/file/**" }] },
  // Next 16.4 nén mã máy chủ làm mất tên lớp (APIError.name = "") → Payload trả "An unknown error occurred." thay cho
  // mọi lời báo lỗi tiếng Việt của CMS (chặn xuất bản, sai mật khẩu, email quản trị…). Chỉ tắt nén phía máy chủ.
  experimental: { turbopackMinify: { server: false, client: true } },
  async headers() {
    return [{ source: "/:path*", headers: bao }];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
