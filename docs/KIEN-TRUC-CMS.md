# CMS cho hieuban.com — phân tích mô hình, lựa chọn, triển khai (CMS-1, 2026-10-11)

> **Đẩy khâu:** 1 · Thu hút (bài viết chuẩn SEO/GEO, nhiều bài hơn, nhanh hơn) và 2 · Trải nghiệm (mỗi bài đều dẫn
> người đọc tới công cụ). **Đo bằng:** Search Console (lượt hiển thị/nhấp của `/blog/*`), lượt AI trích dẫn,
> `landing_viewed` có nguồn `/blog/*` → `reading_started`. Trong CMS: điểm kiểm định trung bình, số bài dưới 70 điểm.

## 0. Phân vai CMS ↔ /quan-tri (chốt 2026-10-12)

Hai trang quản trị, **không trùng việc**. Quy tắc một câu: *chữ và hình người đọc nhìn thấy → CMS; con số, công tắc
đụng tới tiền, Sao, AI, dữ liệu người dùng, kho tri thức → /quan-tri.*

| Việc | `cms.hieuban.com/admin` (Payload) | `hieuban.com/quan-tri` (tự xây) |
|---|---|---|
| Bài viết `/blog`, chuyên mục, tác giả, thư viện ảnh/video | ✅ | — |
| **Điều hướng chân trang** (4 cột Khám phá · Kiến thức · Về chúng tôi · Pháp lý: link trang trong site, bài viết, chuyên mục) | ✅ global `dieu-huong` | — |
| **Trang chủ & banner**: dải thông báo đầu trang, banner trang chủ (ảnh, nút, khung ngày), khối "Bài viết mới" (ghim bài), "Bài viết liên quan" ở trang công cụ / Khám phá / Kiến thức | ✅ global `trang-chu` | — |
| Công tắc nội dung (bật/tắt blog, cột bài trên web) | ✅ global `tinh-nang` | — |
| Kho tri thức engine (nghĩa số, quẻ, sao…) — git là nguồn gốc, xuất bản = PR | — | ✅ |
| Mức thưởng Sao, trần lời mời, thu Sao luận giải, gói nạp, đơn nạp, điều chỉnh Sao | — | ✅ (Supabase, MFA) |
| Vai trò quản trị, nhật ký, nhật ký hỏi đáp ẩn danh, số liệu GSC/GA4/PostHog | — | ✅ |
| Biến bí mật (khoá API, payOS…) | chỉ env Vercel/Render | chỉ báo đã đặt / chưa |

- Dải thông báo trước nằm ở `/quan-tri/cai-dat` (`site.thong_bao`) → **chuyển sang CMS** (chưa có dữ liệu thật vì
  migration 0011 chưa chạy). Khoá `site.*` trong `web/lib/cau-hinh.ts` đã gỡ.
- Thanh tab (4 tab: Bản thân · Hợp đôi · Khám phá · Tài khoản) **vẫn trong code**: đổi nó là đổi sản phẩm, không phải nội dung.
- Web đọc globals qua REST (`web/lib/cms.ts`: `dieuHuongCms`, `trangChuCms`, `baiTheoMang`, `baiTrangChu`), cache thẻ
  `cms`; lưu global → webhook làm mới ngay. CMS chưa nối / lỗi → web dùng mặc định trong code (`ChanTrang.COT`), không vỡ.
- Link nhập ở CMS chỉ nhận **đường dẫn trong site** (`/…`, chặn `//x`, `/\x`, `https:`, `javascript:`) — kiểm ở cả CMS
  (validate) lẫn web (`duongLienKet`). Link tới bài chưa xuất bản bị bỏ qua (không hiện link chết).

**Vì sao "chuyên mục" không quản lý cột chân trang:** chuyên mục là *phân loại bài viết* (taxonomy, có trang
`/blog/chuyen-muc/…`, schema CollectionPage). Bốn cột chân trang là *menu điều hướng* trỏ tới trang công cụ, trang kiến
thức, trang pháp lý — phần lớn không phải bài viết. Gộp hai thứ làm hỏng cả hai (chuyên mục "Pháp lý" sẽ thành trang
blog rỗng bị index). Vì vậy: menu = global "Điều hướng chân trang" (mỗi link chọn trang / bài / chuyên mục), chuyên mục
giữ vai trò phân loại, và trang Khám phá / Kiến thức / công cụ **tự kéo bài cùng mảng** (trường "Mảng" của bài).

## 1. Tóm tắt khuyến nghị

**Chọn phương án C: Payload CMS 3 chạy thành app RIÊNG (`cms/`, tên miền `cms.hieuban.com`), dữ liệu ở schema `cms`
trên chính Supabase Postgres. Web hieuban.com chỉ ĐỌC qua REST.** Payload quản lý:

- toàn bộ **bài viết** `/blog/*`, gồm chuyên mục, tác giả và thư viện ảnh;
- **công tắc tính năng nội dung**.

Phần còn lại giữ nguyên:

- **Kho tri thức của engine vẫn ở git** (`engine/app/kb/data`), sửa ở `/quan-tri`, xuất bản bằng PR.
- **Kinh tế Sao vẫn ở Supabase** (`/quan-tri/cai-dat`, có MFA, SQL tự kẹp giá trị).

Mô hình 6 tầng trong tài liệu tham khảo được thiết kế cho một nền tảng tin tức + thương mại điện tử + chợ nhiều người
bán. Hiểu Bản Thân chỉ cần **tầng 1 (Payload)**, và chỉ phần biên tập. Tầng 2 dùng lại Postgres sẵn có. Các tầng
3–6 (Kafka, AI định giá, chống gian lận, cổng AI riêng, Langfuse) để sau, khi có số liệu chứng minh cần.

## 2. Đối chiếu mô hình 6 tầng trong tài liệu

| Tầng trong tài liệu | Nội dung | Hợp với hieuban? | Quyết định |
|---|---|---|---|
| 1. Payload CMS v3 core | multi-tenant, nhà bán, xuất bản theo khối, danh mục sản phẩm, đơn hàng/escrow/hoa hồng | **Một phần.** Cần phần biên tập (bài, khối, SEO, phiên bản, lịch xuất bản). Không có nhà bán, sản phẩm, escrow. "Hoa hồng nhiều tầng" trái ranh giới đã chốt (thưởng mời **một tầng**). | **Làm phần biên tập** |
| 2. PostgreSQL 16 + pgvector + Redis | dữ liệu, vector, cache | Postgres đã có (Supabase). pgvector để sau, khi làm "bài liên quan theo nghĩa". Redis chưa cần: cache của Next + webhook làm mới là đủ. | **Dùng Postgres sẵn có** (schema `cms`) |
| 3. Kafka/RabbitMQ + BullMQ | hàng đợi sự kiện | Lưu lượng hiện tại không cần. Lịch xuất bản dùng hàng đợi job có sẵn của Payload + Vercel Cron. | **Không làm** |
| 4. AI engine (gợi ý, định giá động, chống gian lận, chấm E-E-A-T/AIO) | | **Chấm E-E-A-T/AIO là phần đáng lấy**, nhưng làm bằng **luật cố định, không gọi AI** (kiểm được, không tốn tiền, không bịa). Định giá động / chống gian lận: không có hàng hoá để định giá. | **Làm khung Kiểm định** |
| 5. AI gateway (LiteLLM, prompt registry) | | Đã có lớp narrative + OpenRouter + hạn mức (RL-1) và AI biên tập quản trị (QT-3). Thêm gateway = thêm hạ tầng phải nuôi. | **Dùng lại cái có**; nối AI soạn nháp vào CMS ở CMS-2 |
| 6. Observability (Langfuse, OpenTelemetry) | | Sentry + PostHog đã có. | **Chưa cần** |

## 3. So sánh phương án

| Tiêu chí | A. Đủ 6 tầng | B. Payload nhúng vào web | **C. Payload app riêng (chọn)** | D. Tự xây tiếp trong `/quan-tri` |
|---|---|---|---|---|
| Hợp phiên bản | — | **Không**: Payload 3.90 chỉ hỗ trợ Next 15.2–15.4 hoặc 16.3+, web đang ở **Next 15.5.27** | Tự chọn bản Next được Payload kiểm (16.3.8) | — |
| Rủi ro cho web đang chạy | rất cao | cao: phải dời mọi route vào route group, nới CSP nonce cho admin, gói hàm phình to | **thấp**: web chỉ thêm `lib/cms.ts` đọc REST, CMS sập thì `/blog` vẫn chạy | thấp |
| Trình soạn hiện đại | có | có | **có** (Lexical, khối chèn, bảng, phiên bản, tự lưu) | phải tự viết, rất tốn công |
| Bảo mật | nhiều bề mặt | admin chung origin với site công khai | **admin ở origin riêng, noindex, header riêng** | tốt (MFA) |
| Giữ 4 tầng của dự án | khó | được | **được**: CMS không tính gì, không gọi LLM | được |
| Chi phí vận hành | cao (Kafka, Redis, cụm AI) | 0 | thêm 1 project Vercel (Hobby được) + schema trong Supabase sẵn có | 0 |
| Thời gian | nhiều tháng | 1–2 tuần + rủi ro | **đã xong CMS-1** | nhiều tuần cho một trình soạn kém hơn |

**Lệch quyết định cũ.** Mục 2026-10-09 trong CLAUDE.md ghi "tự xây, không dùng CMS dựng sẵn (Payload…)". Nay chủ dự
án yêu cầu Payload, đó là lý do mới. Phạm vi Payload được giới hạn ở **bài viết + tính năng nội dung**. Nguyên tắc cũ
vẫn giữ cho kho tri thức (git là nguồn gốc) và cho dữ liệu vận hành (Supabase).

## 4. Kiến trúc đã dựng

```
 Ban biên tập ──► cms.hieuban.com/admin (Payload 3.90.2 · Next 16.3.8)
                    │  Postgres (Supabase) schema "cms" · ảnh: Supabase Storage (S3) bucket cms-media
                    │  webhook (bí mật chung) ──────────────┐
                    ▼                                       ▼
 Người đọc ◄── hieuban.com/blog/{slug} ◄── REST (cache 5 phút, thẻ "cms") ◄── /api/cms/lam-moi xoá cache ngay
                 + sitemap · llms.txt · /blog/{slug}.md · JSON-LD
```

| Dữ liệu | Nguồn gốc | Sửa ở đâu |
|---|---|---|
| Bài viết, chuyên mục, tác giả, ảnh bài | **CMS** (Postgres schema `cms`) | `cms.hieuban.com/admin` |
| Công tắc nội dung (blog, mục lục, bài liên quan, mời dùng công cụ, llms.txt, bản .md) | **CMS** global `tinh-nang` | CMS → Hệ thống → Tính năng nội dung |
| Kho tri thức (sao, quẻ, số…) | **git** `engine/app/kb/data` | `/quan-tri/tri-thuc` → PR |
| Thưởng Sao, giá, thu Sao, dải thông báo | **Supabase** `cau_hinh` | `/quan-tri/cai-dat` (MFA) |

**Vai trò** (`cms/src/access.ts`):

| Vai trò | Quyền |
|---|---|
| Quản trị | mọi thứ, kể cả tài khoản |
| Chủ biên | xuất bản, ký thẩm định, công tắc tính năng |
| Biên tập viên | chỉ lưu **nháp**; máy chủ chặn xuất bản, không chỉ ẩn nút |
| Máy đọc | khoá API cho web xem trước nháp; không vào được admin |

**Luồng bài:**

1. Viết (nháp tự lưu sau 2 giây).
2. Khung Kiểm định chấm ngay khi gõ.
3. Chủ biên bấm **Xuất bản**. Máy chủ chạy lại kiểm định; còn **lỗi chặn** thì từ chối.
4. CMS gọi webhook, web xoá cache.
5. Bài lên `/blog/{slug}`, sitemap, llms.txt và `/blog/{slug}.md`.

**Xem trước:** nút Xem trước trong CMS tạo link `…/api/cms/xem-truoc?slug&ma=HMAC`. Web bật draft mode cho riêng
trình duyệt đó, đọc bản nháp bằng khoá Máy đọc, hiện dải "Đang xem bản nháp" và đặt noindex.

**Đổi slug** của bài đã xuất bản: CMS giữ slug cũ trong `slug_cu`, web trả 308 sang slug mới (không mất link, không
mất thứ hạng).

**Nguồn trùng slug:** bài CMS thắng bài NotFair (`gopBaiBlog`).

## 5. Trình soạn và kiểm định SEO · AI SEO/GEO · E-E-A-T

**Trình soạn Lexical** gồm:

- định dạng chữ, tiêu đề H2–H4 (gõ `## ` là ra tiêu đề), danh sách, trích dẫn;
- link nội bộ chọn bài trong CMS (tự thành `/blog/{slug}`);
- ảnh trong thân bài (`<figure>` + srcset nhỏ/vừa/gốc + chú thích), bảng, đường kẻ;
- 3 **khối riêng**: Hộp ghi chú (lưu ý / mẹo / tự soi / tóm tắt), Mời dùng công cụ (danh sách công cụ cố định),
  Trích dẫn có nguồn;
- thanh công cụ cố định + nổi, tiếng Việt toàn admin;
- lịch sử 50 phiên bản, so sánh phiên bản, lịch xuất bản.

**Trường riêng cho GEO:** Trả lời nhanh (40–80 chữ), Hỏi đáp (xuất FAQPage), Nguồn tham khảo (xuất `citation`), từ
khoá chính/phụ, noindex, canonical, "đưa vào llms.txt". **Plugin SEO** có xem trước kết quả Google, tự gợi ý tiêu đề,
mô tả, ảnh.

**Khung Kiểm định** (`cms/src/kiem-dinh/kiem-dinh.ts`) dùng chung một hàm cho trình duyệt (chấm khi gõ) và máy chủ
(chặn xuất bản). Luật cố định, không gọi AI, viết test trước (17 ca).

| Nhóm | Kiểm |
|---|---|
| SEO | độ dài tiêu đề / tiêu đề SEO / mô tả; slug không dấu; từ khoá ở tiêu đề, mô tả, 100 chữ đầu, H2; nhồi từ khoá (> 3%); độ dài bài; ≥ 2 H2; H1 thừa; nhảy cấp tiêu đề; ≥ 2 link nội bộ; link tới công cụ; ảnh bìa; alt ảnh; đoạn > 150 chữ |
| AI SEO / GEO | Trả lời nhanh 40–80 chữ; ≥ 3 câu hỏi đáp; tiêu đề dạng câu hỏi; có nguồn; có danh sách/bảng; câu mở bài dạng định nghĩa ("X là …") |
| E-E-A-T | chữ ký đúng EEAT-1/BM-1/DX-1: ký "Thẩm định" bắt buộc có người, ngày và ô xác nhận "chuyên gia đã đọc toàn bài"; ký "Tác giả" bắt buộc chọn người. Chỉ Chủ biên sửa được các trường này. |
| Ranh giới nội dung | **Chặn** khi có: vùng cấm (chết sớm, chữa bệnh, xổ số, lô đề, bùa, cúng sao, mua vật phẩm…), số điện thoại/email/Zalo, tên nội bộ (thư viện, nhà cung cấp — BM-1). **Cảnh báo** khi có: cụm nhạy cảm (giải hạn, tai nạn…), giọng phán. |

Điểm 0–100 có trọng số, lưu vào bài. Danh sách bài có cột điểm, bảng điều khiển liệt kê "nên sửa trước" các bài dưới
70 điểm.

**Phía web** (`components/blog/BaiCms.tsx`), đúng bố cục trang kiến thức:

- Thứ tự trang: H1, sapo, chữ ký E-E-A-T, Trả lời nhanh, mục lục tự động (id không dấu), thân bài, FAQ, nguồn, mời
  dùng công cụ theo mảng, "Đọc tiếp".
- JSON-LD gồm `BlogPosting`, `FAQPage` và `BreadcrumbList`. `BlogPosting` có `dateModified`, `wordCount`, `keywords`
  và `citation`. `author` là Organization, trừ khi có chuyên gia ký tên; `reviewedBy` chỉ có khi bài đã thẩm định.

## 6. Bảo mật

- **Phần quản trị:**
  - Admin ở origin riêng.
  - Header `noindex`, `X-Frame-Options`, `frame-ancestors 'self'`.
  - Tắt GraphQL và Gravatar (Gravatar gửi mã băm email ra ngoài).
- **Tài khoản đầu tiên:**
  - Chỉ email trong `CMS_EMAIL_QUAN_TRI` tạo được.
  - Máy chủ thật thiếu biến này thì không cho tạo.
- **Đăng nhập:**
  - Mật khẩu ≥ 12 ký tự.
  - Sai 5 lần khoá 15 phút.
  - Phiên 8 giờ.
- **Web không tin HTML từ CMS:**
  - Lọc lại bằng allowlist: bỏ script, style, sự kiện, iframe, form, `javascript:`.
  - Ảnh chỉ nhận từ CMS hoặc kho ảnh CMS, kể cả từng mục trong srcset.
  - CSP `img-src` chỉ mở thêm đúng hai origin này.
- **Kết nối CMS ↔ web:**
  - Webhook và link xem trước đều có bí mật chung, so khớp thời gian hằng.
  - Khoá Máy đọc chỉ dùng khi xem trước.
- **Dữ liệu:** schema `cms` tách khỏi `public`. Không có dữ liệu người dùng nào trong CMS.
- **Gói npm:** `undici` và `dompurify` ghim bản vá bằng `overrides`. Còn 2 cảnh báo không có bản vá hoặc chỉ ở công cụ
  dev: `braces` (chưa có bản nào vá) và `esbuild` cũ trong `drizzle-kit` (chỉ chạy khi tạo migration).
- **Chưa có MFA** (Payload chưa hỗ trợ sẵn). Bù lại bằng origin riêng, khoá sau 5 lần sai và mật khẩu dài. Thêm TOTP ở
  CMS-2 (mục 9).

## 7. Triển khai — việc của anh (cũng ghi ở `docs/VIEC-CUA-ANH.md` mục CMS)

1. **Supabase** → Storage → tạo bucket **`cms-media`**, bật Public. Project Settings → Storage → **S3 Connection** →
   tạo Access key.
2. **Vercel** → Add New Project → chọn repo này, **Root Directory = `cms`**. Build Command để mặc định (`vercel-build`
   tự chạy migration rồi build). Thêm biến theo `cms/.env.example`:

   | Biến | Giá trị |
   |---|---|
   | `DATABASE_URI` | chuỗi **Session pooler** của Supabase |
   | `PAYLOAD_SECRET` | `openssl rand -base64 48` |
   | `CMS_URL` | `https://cms.hieuban.com` |
   | `WEB_URL` | `https://hieuban.com` |
   | `CMS_EMAIL_QUAN_TRI` | email của anh |
   | `CMS_WEBHOOK_SECRET`, `CMS_PREVIEW_SECRET` | hai chuỗi ngẫu nhiên |
   | `CRON_SECRET` | chuỗi ngẫu nhiên |
   | `S3_*` | thông tin bucket `cms-media` vừa tạo |

3. **Tên miền**: thêm `cms.hieuban.com` vào project CMS (bản ghi CNAME ở GoDaddy như mục A).
4. Mở `https://cms.hieuban.com/admin` → tạo tài khoản đầu tiên bằng đúng email đã khai báo.
5. Trong CMS: Ban biên tập → tạo tài khoản **"Web hieuban.com"**, vai trò **Máy đọc**, tick **Enable API Key** → chép khoá.
6. **Vercel project web** thêm:

   | Biến | Giá trị |
   |---|---|
   | `CMS_URL` | `https://cms.hieuban.com` |
   | `CMS_API_KEY` | khoá vừa chép |
   | `CMS_WEBHOOK_SECRET`, `CMS_PREVIEW_SECRET` | **giống hệt** bên CMS |
   | `CMS_ANH_URL` | `https://<project>.supabase.co/storage/v1/object/public/cms-media` |

   Sau đó Redeploy.
7. **Lịch xuất bản:** Vercel Hobby chỉ cho cron 1 lần/ngày (`vercel.json` đặt 08:00 giờ VN). Bài hẹn giờ lên trong
   ngày đó. Lên Vercel Pro (GĐ2) thì đổi lịch thành mỗi 5 phút.

Không đặt các biến trên thì web chạy như cũ (blog chỉ có NotFair). CMS lỗi hoặc chậm quá 4 giây thì `/blog` bỏ qua
bài CMS, trang không vỡ.

## 8. Kiểm thử và QX (2026-10-11)

| Loại | Lệnh | Kết quả |
|---|---|---|
| Kiểm định (đơn vị, test trước hàm) | `cd cms && npm test` | **22/22** (2026-10-12: +chuẩn hoá tiếng Việt, video) |
| Tích hợp Postgres thật (phân quyền, chặn xuất bản, HTML, link nội bộ, slug cũ kể cả sau nháp tự lưu, tài khoản đầu tiên, mật khẩu, tự nâng quyền; 2026-10-12: cộng tác viên + duyệt, NFC, video) | `npm run test:tich-hop` | **23/23** |
| Migration lên → xuống → lên trên DB trống | `payload migrate`, `migrate:down` | đạt, bảng chỉ nằm trong schema `cms` |
| E2E xuyên CMS → web (trình duyệt thật) | `cd cms && npm run e2e` (dev) · `E2E_PROD=1` (bản build như CI) | **9/9** cả hai chế độ |
| Web: lọc HTML chống XSS, mục lục, gộp nguồn, mã xem trước, route từ chối sai bí mật | `web/e2e/cms-web.spec.ts` | **8/8** |
| Web hồi quy (SEO, CSP, SEO-D, E-E-A-T) | Playwright | **51/51** + `seo-d` 6/6 |
| `tsc` + `next build` | cms, web | sạch |

**QX trên trình duyệt** (desktop 1440 px + điện thoại 390 px): ảnh tải lên tự sinh webp 480/960/OG 1200×630; bài có
ảnh bìa và ảnh trong bài; không tràn ngang; ảnh có alt; **không vi phạm CSP**; đúng 1 H1.

**Hai lỗi QX tìm ra và đã sửa:**

1. Đổi slug sau khi có bản nháp tự lưu thì link cũ không chuyển hướng → sửa, thêm vào test tích hợp.
2. Bài tự lưu trước khi gõ tiêu đề thì slug trống, bấm Xuất bản báo "bắt buộc" → máy chủ tự sinh slug từ tiêu đề.

**Còn lại (ghi nhận, chưa sửa):**

- Chữ 12 px ở dòng chữ ký và đường dẫn: giống các trang kiến thức hiện có.
- Thanh trạng thái của Payload trên điện thoại cuộn ngang 78 px (giao diện gốc của Payload).
- Mở "Tạo mới" thì Payload tự lưu ngay một nháp trống. Có thể xoá trong danh sách bài.

## 8b. CMS-2 (2026-10-12): cộng tác viên, tiếng Việt, video, ảnh 1600px

Chi tiết + lộ trình chuyên gia: `docs/KE-HOACH-CHUYEN-GIA.md` mục 4. Lưu ảnh/video: `docs/LUU-TRU-MEDIA.md`.
Migration Payload `20261012_015320_cong_tac_vien_video` (up/down; down hạ cộng tác viên về Máy đọc + tắt khoá API —
không nâng quyền ai). `vercel-build` tự chạy migration khi deploy.

## 8c. CG-6 (2026-10-12): kiểm trùng nội dung

- `cms/src/kiem-dinh/trung-lap.ts` (thuần, test `trung-lap.test.ts`): vân tay = băm FNV cụm 5 từ đã bỏ dấu; độ trùng =
  tỉ lệ cụm của bài mới có trong nguồn kia. Ngưỡng `NGUONG`: 20% cảnh báo, 50% lỗi (chặn **cộng tác viên**).
- `cms/src/lib/trung-lap.ts`: so với mọi bài khác (Local API, `overrideAccess`) + vân tay kho tri thức. Bài nháp người
  khác chỉ hiện "một bài nháp khác" (không lộ tiêu đề cho cộng tác viên).
- Vân tay kho tri thức: `npm run van-tay-kb` (tự chạy trong `vercel-build`, `predev`, `pretest:tich-hop`, `pree2e`) →
  `src/kiem-dinh/van-tay-kb.json` (gitignore, chỉ mã băm). Đóng gói bằng `outputFileTracingIncludes`. Thiếu thư mục
  engine → tệp rỗng, chỉ bỏ phần so KB.
- Chạy ở hook trước khi lưu khi **Gửi duyệt / Xuất bản** (không chạy lúc tự lưu nháp) và qua nút "Kiểm trùng nội dung"
  (`POST /api/bai-viet/kiem-trung`, mọi tài khoản phòng biên tập trừ Máy đọc).
- Không bắt được bài chép từ site ngoài (cần tra web — để sau, cân nhắc chi phí).

## 8d. Chỉ build bản chính thức trên Vercel (2026-10-12)

`cms/vercel.json` → `ignoreCommand`: bỏ qua mọi bản Preview (nhánh PR). Lý do: bản Preview không có biến môi trường
(kiem-env dừng build), và nếu đặt biến trỏ DB thật thì `payload migrate` của nhánh PR sẽ chạy lên DB thật trước khi
merge. Kiểm thử CMS cho PR do GitHub Actions job `cms` đảm nhận (Postgres riêng). Cần xem trước giao diện CMS → tạo DB
riêng rồi bỏ dòng `ignoreCommand`.

## 9. Lộ trình tiếp

> Mã CMS-2…CMS-5 dưới đây là **lộ trình**. Việc đã làm ngoài lộ trình mang tên riêng: CMS-CTV (cộng tác viên, tiếng Việt,
> video), CMS-GD (giao diện website + phân vai, mục 0).

| Mã | Việc | Khâu |
|---|---|---|
| CMS-2 ✅ | AI soạn nháp từng đoạn trong CMS (khung "Trợ lý AI" cột phải → `/api/bai-viet/soan-nhap` → engine `/v1/quan-tri/soan-nhap`, kèm kiểm định; người viết tự chép vào bài) · MFA TOTP (`cms/src/lib/totp.ts`, node:crypto, RFC 6238; màn `/admin/xac-thuc-2-buoc`; cookie ký `cms-mfa` 8 giờ; thiếu cookie → `vaiTro()` = null; bắt buộc Quản trị/Chủ biên khi `CMS_BAT_BUOC_MFA=1`; sai 5 lần khoá 15 phút; chặn dùng lại mã; Quản trị đặt lại khi mất máy) | 1 |
| CMS-3 ✅ | Trang đích (landing) dựng bằng khối — collection **Trang đích** (nhóm Giao diện website): 6 khối (đầu trang, thẻ công cụ, danh sách bài, hỏi đáp → FAQPage, lời mời bạn nhận Sao, đoạn văn), link chỉ trong site, nháp + lịch xuất bản, `het_han` → web báo kết thúc + noindex + rời sitemap. Web: `/su-kien/{slug}` | 4 |
| CMS-4 ✅ | "Bài liên quan theo nghĩa" — **không dùng pgvector/AI**: vectơ từ khoá có trọng số (âm tiết + cụm 2 âm tiết, tiêu đề/từ khoá/thẻ/tiêu đề mục nặng hơn thân bài) tính khi lưu (`cms/src/kiem-dinh/vecto.ts`, trường `vecto`), web xếp cosine + idf (`web/lib/lien-quan.ts`) khi Chủ biên không chọn tay. Khung **Gợi ý liên kết nội bộ** khi viết: bài CMS + mọi trang kiến thức/công cụ (`/api/lien-ket-noi-bo` của web) xếp theo độ gần. pgvector để sau khi > 1.000 bài hoặc cần tìm theo câu hỏi tự nhiên | 1–2 |
| CMS-5 | Lên Next 16 cho web (khi ổn định) để hai app cùng một bản | nền móng |
