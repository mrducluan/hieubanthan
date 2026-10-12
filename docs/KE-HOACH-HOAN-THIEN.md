# Kế hoạch hoàn thiện hệ thống chạy E2E (lập 2026-10-12)

> Góc nhìn: DevOps + kiến trúc back-end + kỹ sư AI. Đối chiếu vòng tăng trưởng (CLAUDE.md):
> **thu hút → quay lại → mời bạn → nạp Sao**. Mỗi mục ghi khâu nó đẩy và ai làm.
> Việc của anh (cần quyền tài khoản) ghi chi tiết ở `docs/VIEC-CUA-ANH.md`. File này là bản đồ tổng.

## 1. Bản đồ hệ thống hiện tại

| Thành phần | Chạy ở | Trạng thái 2026-10-12 |
|---|---|---|
| Web `hieuban.com` (Next 15) | Vercel `hieubanthan` | ✅ chạy, mở công khai |
| CMS `cms.hieuban.com` (Payload 3) | Vercel `hieubanthan-cms` | ✅ chạy, anh đã đăng nhập. Bản Preview lỗi vì chưa có biến cho Preview (không ảnh hưởng bản thật) |
| Engine tính toán (FastAPI) | Render `hieubanthan-engine-sg` | ⚠ cần sửa cấu hình Docker + kiểm vùng/gói (VIEC-CUA-ANH mục 11, 5b) |
| Postgres + Auth + Storage | Supabase | ✅ chạy. **Vùng thực tế là Tokyo** (tài liệu ghi Singapore) — chậm hơn ~40–70 ms mỗi truy vấn |
| Bài trao đổi SEO | NotFair | ⚠ cần đặt lại khoá mới (khoá cũ đã lộ) |
| Thanh toán | payOS | ⏳ code xong, chờ bật tài khoản + khoá payOS |

**Web ↔ CMS đã có sẵn đường nối** (CMS-1): web đọc bài qua REST, CMS báo web xoá cache khi xuất bản, xem trước bản
nháp bằng link có ký. Chỉ cần anh đặt 5 biến ở Vercel project **web** (bước CMS5–6) là bài CMS hiện trên `/blog`.

## 2. Module bài viết (làm trong PR này)

| Hạng mục | Trạng thái |
|---|---|
| Soạn bài: tiêu đề H1, slug tiếng Việt, sapo, Trả lời nhanh (GEO), thân bài (H2–H4, bảng, ảnh, video YouTube, khối ghi chú/kêu gọi/trích dẫn), FAQ, nguồn | ✅ CMS-1/2 |
| SEO: từ khoá chính/phụ, meta title/description/ảnh OG có xem trước Google, canonical, noindex, llms.txt | ✅ |
| E-E-A-T: chữ ký Ban biên tập / tác giả / thẩm định có xác nhận | ✅ |
| Kiểm định 30 luật khi gõ + chặn xuất bản khi có lỗi chặn | ✅ |
| Kiểm trùng nội dung (bài khác + kho tri thức) | ✅ CG-6 |
| Quy trình: nháp tự lưu, lịch xuất bản, lịch sử phiên bản, gửi duyệt cộng tác viên | ✅ |
| **Nháp chưa đặt tiêu đề** hiện "(Chưa đặt tiêu đề)" (trước là `<No Tiêu đề bài>`), không sinh slug, chặn xuất bản | ✅ mới |
| **Loại bài**: Bài viết → `BlogPosting`, **Tin tức** → `NewsArticle` + giờ đăng, Hướng dẫn → `Article` | ✅ mới |
| **Chuyên mục**: chip trên `/blog`, trang `/blog/chuyen-muc/{slug}` (CollectionPage + ItemList, sitemap, trống thì noindex), breadcrumb trong bài | ✅ mới |
| `/blog`: bài mới nhất nổi bật, thẻ có nhãn loại bài + chuyên mục, cả thẻ bấm được, hiệu ứng tôn trọng giảm chuyển động | ✅ mới |
| RSS `/blog/rss.xml` cho trình đọc tin, Zalo/Facebook bot | ✅ mới |
| Sitemap tin tức Google News (bài < 48 giờ) | ⏳ HT-6 — chỉ có ích khi đăng tin đều và đăng ký Google Publisher Center |
| Tìm kiếm trong blog, phân trang | ⏳ HT-7 — cần khi > 30 bài |

## 3. Lỗ hổng vận hành và kế hoạch

| Mã | Việc | Khâu | Ai | Ghi chú |
|---|---|---|---|---|
| HT-1 | Nối web ↔ CMS: 5 biến `CMS_*` ở Vercel web | Thu hút | Anh | VIEC-CUA-ANH CMS5–6 |
| HT-2 | Engine Render ổn định (Docker context, Starter SG) + UptimeRobot 2 monitor | Mọi khâu | Anh | Engine sập = 5 mảng sập |
| HT-3 | **Email cho CMS** (quên mật khẩu, báo "Gửi duyệt") — Payload hiện chưa có bộ gửi thư nên **quên mật khẩu không gửi được** | Cộng đồng tác giả | Em + anh duyệt dependency (`@payloadcms/email-nodemailer` hoặc Resend) | = CG-3 |
| HT-4 | MFA (TOTP) cho tài khoản CMS Quản trị/Chủ biên | Bảo mật | Em | = CG-7; trước khi mở cho cộng tác viên ngoài |
| HT-5 | Giới hạn kết nối DB của CMS (serverless mở nhiều kết nối; pooler Session có trần) — đặt `pool.max` nhỏ, cân nhắc Transaction pooler | Ổn định | Em (khi log có `max clients`) | Theo dõi log Vercel |
| HT-6 | Sitemap Google News + đăng ký Publisher Center | Thu hút | Em + anh | Khi đăng tin ≥ 2 bài/tuần |
| HT-7 | Tìm kiếm + phân trang blog | Quay lại | Em | Khi > 30 bài |
| HT-8 | Bật tài khoản (mục F) → chạy migration 0012 → payOS | Nạp Sao | Anh rồi em | Doanh thu bắt đầu từ đây |
| HT-9 | Sentry (lỗi máy chủ) cho web + engine + CMS | Vận hành | Anh tạo DSN, em nối | Hiện lỗi chỉ thấy trong log Vercel |
| HT-10 | Sao lưu: Supabase Free không có PITR → lịch dump tuần (GitHub Actions + lưu riêng) khi có dữ liệu người dùng | An toàn dữ liệu | Em | Làm cùng HT-8 |
| HT-11 | Chuyển Supabase về Singapore (tạo project mới, chuyển dữ liệu) | Tốc độ | Anh + em | Làm trước HT-8 thì rẻ nhất (chưa có dữ liệu người dùng) |
| HT-12 | AI soạn nháp từng đoạn trong CMS (dùng lại engine `/v1/quan-tri/soan-nhap` + kiểm định), người duyệt vẫn là người | Thu hút | Em | Cần `OPENROUTER_API_KEY` trên Render |
| HT-14 | Kiểm trùng CG-6 đang tải TOÀN BỘ thân bài mọi bài mỗi lần Gửi duyệt/Xuất bản — lưu vân tay mỗi bài khi lưu (trường ẩn) rồi chỉ so vân tay | Ổn định | Em | Khi > 200 bài (audit 2026-10-12) |
| HT-13 | Chạy bộ 55 câu hỏi AI thật, chấm, sửa (mục L) | Quay lại | Anh nạp khoá, em chạy | Trước khi bật AI rộng |

**Thứ tự khuyến nghị:** HT-1 → HT-2 → HT-11 (nếu chuyển) → HT-8 → HT-3/HT-4 → HT-9/HT-10 → còn lại.

## 4. Kiểm thử E2E đang có (CI chạy mỗi PR)

- `cms` job: kiểm định (node --test), migration lên → xuống → lên, tích hợp trên Postgres thật (29 ca: phân quyền,
  chặn xuất bản, kiểm trùng, nháp chưa đặt tên, loại bài…), **e2e xuyên CMS → web** bản build (soạn bài trên trình
  duyệt, kiểm định, xuất bản, web hiện bài + JSON-LD + mục lục + FAQ, chuyên mục, Tin tức, xem trước nháp, đổi slug
  308, phân quyền biên tập viên, công tắc tính năng).
- `web`, `e2e`, `engine`, `supabase`: toàn bộ web (5 mảng, SEO 0 lỗi, CSP, di động, trợ năng, thanh toán giả).
- Chưa tự động: thử trên điện thoại thật (la bàn), tốc độ thật từ Việt Nam (xem Vercel Speed Insights / PageSpeed).
