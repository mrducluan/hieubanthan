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
  // SEO-K → AUD-Q2 (chủ dự án duyệt 2026-11-03): trang năm (cả bản một giới tính, cả đường dẫn trước QH-URL
  // /phong-thuy/tuoi-1990-nam) đã gộp theo CUNG PHI → đi THẲNG một bước tới DÒNG năm trên mục lục (#tuoi-1990);
  // bản .md → mục lục .md (bảng năm sinh).
  // Bản một giới tính dưới /huong-hop-tuoi/ (tuoi-1990-nu) do TRANG xử lý: biết giới tính → 308 thẳng tới trang cung của
  // đúng người đó (#nu-1990) — cung phi do engine tính, next.config không tính được (agent rà soát 2026-11-03).
  ds.push({ source: "/phong-thuy/tuoi-:nam(\\d{4})-:gioi(nam|nu)", destination: `${CHUYEN.tuoi_huong}#tuoi-:nam`, permanent: true });
  for (const goc of ["/phong-thuy", CHUYEN.tuoi_huong]) {
    ds.push({ source: `${goc}/tuoi-:nam(\\d{4})-:gioi(nam|nu).md`, destination: `${CHUYEN.tuoi_huong}.md`, permanent: true });
  }
  ds.push(
    { source: `${CHUYEN.tuoi_huong}/tuoi-:nam(\\d{4})`, destination: `${CHUYEN.tuoi_huong}#tuoi-:nam`, permanent: true },
    { source: `${CHUYEN.tuoi_huong}/tuoi-:nam(\\d{4}).md`, destination: `${CHUYEN.tuoi_huong}.md`, permanent: true },
  );
  return ds;
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  // AIO: bản Markdown cho bot AI — "<trang>.md" → route /md/<trang> (chuẩn llmstxt.org). "/index.md" = trang chủ.
  // Header bảo mật cơ bản (tín hiệu tin cậy; không chặn tính năng nào đang dùng — la bàn cần cảm biến chuyển động).
  async headers() {
    return [{
      // ANH-3: bộ tìm điểm mốc gương mặt (~7 MB nén) — đường dẫn mang số phiên bản nên cache lâu được.
      source: "/mediapipe/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }, {
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        // CSP đầy đủ (nonce theo lượt tải) đặt ở proxy.ts — xem lib/csp.ts.
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), payment=(), accelerometer=(self), gyroscope=(self), magnetometer=(self)" },
      ],
    }];
  },
  async redirects() {
    return chuyenHuong();
  },
  async rewrites() {
    return { beforeFiles: [
      { source: "/:duong((?:[^/]+/)*[^/.]+)\\.md", destination: "/md/:duong" },
      // SEO-M: sitemap theo cụm đặt ở gốc site (luật thư mục của sitemaps.org) → route /sitemap-cum/[ten].
      { source: "/sitemap-cum-:ma([a-z-]+).xml", destination: "/sitemap-cum/:ma.xml" },
    ] };
  },
  // SEO-P0 (2026-11-25, thay Q-I2): metadata nằm trong <head> cho MỌI user-agent.
  // Q-I3 cache HTML ở CDN mà khoá cache KHÔNG tách theo user-agent (thêm Vary: User-Agent thì gần như không còn lượt HIT).
  // Trước đây bot nhận metadata trong <head>, người xem nhận bản "stream" (metadata cuối <body>) → lượt người xem đầu tiên ghi
  // bản stream vào cache rồi CDN trả bản đó cho Bingbot, GPTBot, Zalo… (không chạy JS = thấy <head> thiếu title/canonical).
  // Một kiểu HTML cho mọi người thì cache an toàn. Cái giá: lượt chưa cache chờ metadata (đọc CMS có đệm) trước khi gửi
  // byte đầu — trang công khai phần lớn là lượt HIT nên không đáng kể; e2e "SEO-P0/P1" kiểm cả Chrome lẫn Googlebot.
  htmlLimitedBots: /.*/,
  // Ảnh thẻ chia sẻ (/og) đọc font OFL từ assets/fonts — đưa vào gói deploy. (Next 15: instrumentation.ts bật sẵn.)
  // TR-5: ảnh thẻ Tarot / Ba lá vẽ tranh lá thật (JPEG nhỏ trong assets/tarot — bộ dựng ảnh không đọc webp).
  outputFileTracingIncludes: { "/og": ["./assets/fonts/**"], "/og/tarot": ["./assets/fonts/**", "./assets/tarot/**"], "/og/ba-la": ["./assets/fonts/**", "./assets/tarot/**"], "/og/li-xi": ["./assets/fonts/**", "./public/li-xi/**"] },
  // Blog: ảnh bìa bài NotFair đi qua tối ưu ảnh của Next (/_next/image).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "notfair.co", pathname: "/api/seo/**" },
    ],
  },
};
export default nextConfig;
