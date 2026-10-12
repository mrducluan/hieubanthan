// API NotFair GIẢ cho e2e (không gọi notfair.co): một bài có slug tiếng Việt có dấu — đúng ca từng 404 trên
// production (Next 15 trả params đã mã hoá phần trăm, thư viện mã hoá thêm lần nữa). Chạy: node e2e/notfair-gia.mjs
import http from "node:http";

const CONG = Number(process.env.NOTFAIR_GIA_PORT || 4555);
export const SLUG_CO_DAU = "xem-than-so-hoc-numerology-cach-tinh-va-đoc-ho-so-tinh-tao";
const bai = {
  slug: SLUG_CO_DAU, title: "Thần số học: cách tính và đọc hồ sơ tinh tế", meta_description: "Bài thử nghiệm e2e.",
  content_html: "<h2>Ý chính</h2><p>Nội dung thử nghiệm.</p>", image_url: "https://notfair.co/api/seo/e2e.png",
  tags: ["than so"], published_at: "2026-10-10T00:00:00Z", created_at: "2026-10-10T00:00:00Z", reading_time_minutes: 3,
};

http.createServer((req, res) => {
  const u = new URL(req.url ?? "/", "http://x");
  if (u.pathname === "/health") return res.end("ok");
  res.setHeader("content-type", "application/json");
  if (req.headers.authorization !== "Bearer e2e") { res.statusCode = 401; return res.end("{}"); }
  const slug = u.searchParams.get("slug");
  if (slug === null) return res.end(JSON.stringify({ posts: [bai] }));
  if (slug === SLUG_CO_DAU) return res.end(JSON.stringify({ post: bai }));
  res.statusCode = 404;
  res.end("{}");
}).listen(CONG, "127.0.0.1");
