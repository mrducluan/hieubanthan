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
// Bài dài có mục lục NotFair chèn sẵn (nav.nf-toc) + 4 H2 / 1 H3 — kiểm khung đọc (mục lục cột phải, scroll-spy, CTA theo mảng).
const doan = (n) => Array.from({ length: n }, (_, i) => `<p>Đoạn ${i + 1}: cửa chính thông thoáng, bếp không đối diện cửa, bàn làm việc quay về hướng hợp tuổi.</p>`).join("");
export const SLUG_PHONG_THUY = "phong-thuy-nha-o-cho-nguoi-moi";
const baiPhongThuy = {
  slug: SLUG_PHONG_THUY, title: "Phong thuỷ nhà ở cho người mới: 4 điều nên xem trước", meta_description: "Hướng nhà, bếp, giường, bàn làm việc.",
  content_html: `<nav class="nf-toc" aria-label="Mục lục"><p class="nf-toc-title">Mục lục</p><ul><li class="nf-toc-l2"><a href="#huong-nha">Hướng nhà</a></li></ul></nav>`
    + `<h2 id="huong-nha">Hướng nhà và cửa chính</h2>${doan(6)}<h2>Bếp đặt ở đâu</h2>${doan(6)}<h3>Bếp và cửa</h3>${doan(4)}`
    + `<h2>Giường ngủ</h2>${doan(6)}<h2>Bàn làm việc</h2>${doan(6)}<p class="nf-attribution">Authored with <a href="https://notfair.co">NotFair SEO</a></p>`,
  image_url: "https://notfair.co/api/seo/e2e-pt.png", tags: ["phong thuy", "nha o"],
  published_at: "2026-10-12T00:00:00Z", created_at: "2026-10-12T00:00:00Z", reading_time_minutes: 7,
};

http.createServer((req, res) => {
  const u = new URL(req.url ?? "/", "http://x");
  if (u.pathname === "/health") return res.end("ok");
  res.setHeader("content-type", "application/json");
  if (req.headers.authorization !== "Bearer e2e") { res.statusCode = 401; return res.end("{}"); }
  const slug = u.searchParams.get("slug");
  if (slug === null) return res.end(JSON.stringify({ posts: [bai, baiPhongThuy] }));
  if (slug === SLUG_CO_DAU) return res.end(JSON.stringify({ post: bai }));
  if (slug === SLUG_PHONG_THUY) return res.end(JSON.stringify({ post: baiPhongThuy }));
  res.statusCode = 404;
  res.end("{}");
}).listen(CONG, "127.0.0.1");
