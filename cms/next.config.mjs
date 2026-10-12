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
  images: { localPatterns: [{ pathname: "/api/media/file/**" }] },
  async headers() {
    return [{ source: "/:path*", headers: bao }];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
