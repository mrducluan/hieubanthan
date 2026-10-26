// CTA-2 — CMS GIẢ cho e2e các khối thẻ cuối trang (web/playwright.cms.config.ts). Trả đúng các đường REST web đọc:
// tính năng, trang chủ & banner, danh sách bài (lọc theo mảng), global "Lối đi tiếp cuối trang", Trang website theo URL.
// Test đổi trạng thái qua POST /__dat (JSON gộp vào trạng thái) rồi gọi webhook /api/cms/lam-moi của web để xoá cache.
import http from "node:http";

const anh = (mau) => ({ url: `http://127.0.0.1:4666/anh-${mau}.svg`, alt: "ảnh bìa thử", width: 1200, height: 675 });
const BAI = [
  { tieu_de: "Thần số học là gì? Cách đọc 4 con số", slug: "than-so-hoc-la-gi", mo_ta_ngan: "Bốn con số rút ra từ ngày sinh và họ tên.",
    anh_bia: anh("a"), mang: "than_so", publishedAt: "2026-10-20T00:00:00Z", updatedAt: "2026-10-20T00:00:00Z" },
  { tieu_de: "Self Discovery: tự hiểu mình qua lựa chọn", slug: "self-discovery", mo_ta_ngan: "Giá trị, thói quen và lựa chọn.",
    anh_bia: anh("b"), mang: "chung", publishedAt: "2026-10-19T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z" },
];
// BLOG-8 — một bài ĐẦY ĐỦ trả khi web hỏi theo slug (trước đây luôn rỗng): thân bài có 3 mục H2, hỏi đáp, nguồn; chữ ký theo `tt.ky`
// ("ban_bien_tap" mặc định | "tham_dinh" | "tac_gia") để thử khung biên soạn cuối bài.
const NGUOI = { id: 1, ten: "Đức Luân", slug: "duc-luan", chuc_danh: "Người sáng lập · Chủ biên nội dung" };
const DOAN = "Tứ trụ gồm tám chữ can chi của năm, tháng, ngày, giờ sinh; nhật chủ là can của ngày sinh và là điểm xuất phát khi đọc lá số. ";
const BAI_DAY = () => ({
  id: 99, tieu_de: "Bát tự là gì? Cách đọc tứ trụ cho người mới", slug: "bat-tu-la-gi", mang: "bat_tu", _status: "published",
  mo_ta_ngan: "Bát tự là tám chữ can chi của năm, tháng, ngày, giờ sinh. Bài hướng dẫn đọc từng bước.",
  tra_loi_nhanh: "Bát tự là tám chữ can chi của năm, tháng, ngày, giờ sinh; người mới bắt đầu từ việc tìm nhật chủ rồi xem ngũ hành thừa thiếu.",
  anh_bia: anh("c"), publishedAt: "2026-10-26T01:00:00Z", updatedAt: "2026-10-26T01:00:00Z",
  noi_dung_html: `<h2>Nhật chủ là gì?</h2><p>${DOAN.repeat(4)}</p><h2>Ngũ hành thừa thiếu</h2><p>${DOAN.repeat(4)}</p><h2>Đại vận và dụng thần</h2><p>${DOAN.repeat(4)}</p>`,
  hoi_dap: [{ cau_hoi: "Bát tự có giống Tử vi không?", tra_loi: "Không, hai hệ thống dựng trên hai cách tính khác nhau." }],
  nguon: [{ ten: "Tử Bình Chân Thuyên" }],
  ky_ten: tt.ky ?? "ban_bien_tap",
  ...(tt.ky === "tham_dinh" ? { nguoi_tham_dinh: NGUOI, ngay_tham_dinh: "2026-10-20T00:00:00Z" } : {}),
  ...(tt.ky === "tac_gia" ? { tac_gia: NGUOI } : {}),
});
const MAC_DINH = () => ({ loiDi: null, trang: {}, soBaiTheoMang: 3, ky: "ban_bien_tap" });
let tt = MAC_DINH();

const json = (res, o, code = 200) => { res.statusCode = code; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };

http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/health") return json(res, { ok: true });
  if (u.pathname === "/__dat" && req.method === "POST") {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => { const o = JSON.parse(b || "{}"); tt = o.datLai ? MAC_DINH() : { ...tt, ...o }; json(res, { ok: true }); });
    return;
  }
  if (u.pathname.startsWith("/anh-")) {
    res.setHeader("content-type", "image/svg+xml");
    return res.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#1b2340"/></svg>`);
  }
  if (u.pathname === "/api/globals/tinh-nang") return json(res, { blog_bat: true });
  if (u.pathname === "/api/globals/trang-chu") return json(res, { bai_viet: { bat: true, so_bai: 3 }, bai_theo_mang: { bat: true, so_bai: tt.soBaiTheoMang } });
  if (u.pathname === "/api/globals/loi-di-tiep") return tt.loiDi ? json(res, tt.loiDi) : json(res, {}, 404);
  if (u.pathname === "/api/bai-viet") {
    const mang = u.searchParams.get("where[mang][equals]");
    const slug = u.searchParams.get("where[slug][equals]");
    if (slug) return json(res, { docs: slug === "bat-tu-la-gi" ? [BAI_DAY()] : [] });
    return json(res, { docs: mang ? BAI.filter((b) => b.mang === mang) : BAI });
  }
  if (u.pathname === "/api/noi-dung-trang") {
    const d = u.searchParams.get("where[duong][equals]");
    const t = d && tt.trang[d];
    return json(res, { docs: t ? [{ duong: d, _status: "published", ...t }] : [] });
  }
  if (u.pathname.startsWith("/api/")) return json(res, { docs: [] });
  json(res, {}, 404);
}).listen(4666, "127.0.0.1");
