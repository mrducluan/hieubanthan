# Kiểm toán Toàn bộ 48 Pillar Page & Money Page — `hieuban.com` (24/11/2026)

- **Phương pháp:** Hợp nhất kinh nghiệm SEO Technical/On-page + `seo-audit` (v2.2.10) + `ai-seo` (v2.12.7) + `competitor-profiling` (v2.1.9) + đo trực tiếp 48 URL trên production `https://hieuban.com` bằng Googlebot UA.
- **Lưu ý dữ liệu:** Các số đo HTTP, TTFB, DOM, Heading, Schema, FAQ, `<time>`, `<table>`, `cache-control` là dữ liệu đo thật 24/11/2026. Dữ liệu ngoài HTML (GSC impressions/clicks, Bing/Brave index, backlinks, CrUX field CWV) cần export từ GSC/BWT để đối chiếu.

---

## 1. Đánh giá khắt khe tổng thể (48 URL Pillar & Money Pages)

**Điểm mạnh đã có:**
- Kiến trúc nền (HTTPS, 308 1 bước, canonical tự trỏ, `hreflang` vi/en đối xứng, `robots.txt` tách bot AI, `Organization` + Wikidata QID + `sameAs` + `founder`) đạt **8.5/10**.
- Các trang con kiến thức (như `/than-so/y-nghia-so/so-7`) đạt **10/10** chuẩn AEO/GEO.

**6 lỗ hổng hệ thống nghiêm trọng nhất trên các Pillar Page & Money Page (đo thật 24/11/2026):**

1. **Lỗ hổng khung `TrangCongCu.tsx` đồng loạt trên 14/16 trang trụ công cụ:**
   - `/than-so`, `/bat-tu`, `/kinh-dich`, `/phong-thuy`, `/nhan-tuong`, `/tarot`, `/hop-doi`, `/hom-nay`, `/thoi-gian-toi`, `/chan-dung`, `/doi-lich-am-duong`, `/xem-sao-han`, `/xem-tuoi-lam-nha`, `/tuoi-xong-dat` đều bị chung một mẫu yếu: chỉ có **1–3 H2, 1 H3**, **0 `<table>`**, **0 `<time>`**, khối Trả lời nhanh bị gập vào `<details>` (hoặc không có hẳn ở `/hom-nay`, `/thoi-gian-toi`, `/chan-dung`), và không trỏ thẳng xuống các trang con chủ lực.
2. **2 Money Page / Pillar Page lớn bị "trần trụi" về Schema & SEO:**
   - `/ban-do-doi-ngu` (B2B Money Page, `/doanh-chu` 308 sang): **Title 98 ký tự** (bị Google cắt/viết lại), **Description 167 ký tự**, **JSON-LD = RỖNG**, **0 FAQ**, **2 H2 / 0 H3**, không có Trả lời nhanh.
   - `/chi-tay` (Pillar Page 12.074 từ, 6 H2, 33 H3): **Thiếu `WebApplication` schema**, **0 FAQ**, **thiếu thương hiệu `Hiểu Bản Thân` trong Title**, **0 `<time>`**, **0 `<table>`**.
3. **100% (48/48) trang trụ & money page thiếu tín hiệu tươi mới `<time>` và không có CDN Cache (`cache-control: private, no-store`):**
   - Dưới Googlebot UA, cold TTFB trên các trang trụ lớn lên tới **2.3s – 4.1s** (`/tu-vi` 4.09s, `/than-so` 3.08s, `/bat-tu` 2.60s, `/chi-tay` 2.60s, `/kien-thuc` 2.54s, `/` 2.33s). Đây là mức nguy hiểm cho cả crawl budget lẫn bot AI realtime (`ChatGPT-User`, `Perplexity-User`).
4. **Trang `/goi-xem` (Pricing Money Page) thiếu tính máy-đọc cho AI Agent:**
   - Có 5 FAQ nhưng thiếu `<table>` so sánh gói Miễn phí vs gói Sao, thiếu `Offer`/`Product` schema, và `/pricing.md` trả **404**.
5. **Trang chủ `/` vẫn cannibalize cụm `"thần số học online miễn phí"` với `/than-so`** (và trang chủ có 0 FAQ, 0 H3, 0 `<time>`).
6. **Liên kết ngược từ các trang con về trang trụ đang dùng anchor text chung chung** (`"Số của tôi"`, `"✦ Thần số"`) thay vì từ khoá hành động (`"Xem thần số học online miễn phí"`, `"Lập lá số Tử vi miễn phí"`...).

---

## 2. Ma trận kiểm toán từng nhóm URL (Chi tiết thiếu gì để bổ sung)

### Nhóm A — 10 Trang trụ Huyền học (Core Pillar Pages)
| URL | Từ | H2 / H3 | FAQ | TTFB | Schema hiện có | Đang THIẾU gì cần bổ sung? |
|---|---|---|---|---|---|---|
| `/than-so` | 2.443 | 3 / 1 | 4 | 3.08s | WebPage, WebApp, Breadcrumb, FAQ | Cẩm nang mở phủ Fan-Out (6 chỉ số cốt lõi), `<table>` Pitago vs Chaldea, 12 link trực tiếp `so-1..33`, thêm 3 FAQ (7 câu), `"miễn phí"` trong Title/H1, `<time>`, CDN cache |
| `/tu-vi` | 3.015 | 4 / 1 | 8 | 4.09s | WebPage, WebApp, Breadcrumb, FAQ, Image | Khối mở 12 cung / 14 chính tinh (link thẳng 14 chính tinh), `<table>` cấu trúc lá số, `<time>`, tối ưu TTFB/CDN cache |
| `/bat-tu` | 2.788 | 3 / 1 | 8 | 2.60s | WebPage, WebApp, Breadcrumb, FAQ | Khối mở Tứ trụ (Năm-Tháng-Ngày-Giờ) & 10 Thập thần (link thẳng), `<table>` Ngũ hành / Thập thần, `<time>`, CDN cache |
| `/kinh-dich` | 2.620 | 3 / 1 | 3 | 2.27s | WebPage, WebApp, Breadcrumb, FAQ | Khối mở Bát quái & cách gieo 6 hào, `<table>` 8 quẻ đơn, thêm 3–4 FAQ (6–7 câu), `<time>`, CDN cache |
| `/phong-thuy` | 2.288 | 3 / 1 | 3 | 2.31s | WebPage, WebApp, Breadcrumb, FAQ | Khối mở 8 Cung phi & Bát trạch vs Huyền Không, `<table>` 8 hướng tốt/xấu, link thẳng 8 cung phi, thêm 3–4 FAQ, `<time>` |
| `/nhan-tuong` | 2.345 | 3 / 1 | 4 | 2.41s | WebPage, WebApp, Breadcrumb, FAQ | Khối mở Tam đình – Ngũ quan – 12 cung, `<table>` đối chiếu Đông–Tây, thêm 2–3 FAQ, `<time>` |
| `/chi-tay` | 12.074 | 6 / 33 | **0** | 2.60s | WebPage, Breadcrumb, Image | **THIẾU `WebApplication`**, **THIẾU `FAQPage` (0 → 6–7 câu)**, **THIẾU thương hiệu trong Title**, thêm `<table>` tóm tắt 4 đường chỉ tay chính, `<time>` |
| `/tarot` | 2.267 | 2 / 1 | 4 | 2.30s | WebPage, WebApp, Breadcrumb, FAQ | Khối mở Ẩn Chính (22 lá) vs Ẩn Phụ (56 lá) + 4 nguyên tố, `<table>` các kiểu trải bài, thêm 2–3 FAQ, `<time>` |
| `/ky-mon` | — | — | — | 0.52s (retry) | HTTP 200 khi gọi đơn (trước đó timeout khi tải song song 10 URL) | Cần kiểm tra hiệu năng cold-start + áp dụng đủ 12 chuẩn Pillar Page (khối mở, `<table>`, `<time>`, 6–7 FAQ) |
| `/hop-doi` | 2.235 | 3 / 1 | 3 | 0.51s | WebPage, WebApp, Breadcrumb, FAQ | Khối mở các trục chấm hợp đôi (Thần số + Bát tự + Tử vi), `<table>` nhóm số hợp/khắc, thêm 3–4 FAQ, `<time>` |

### Nhóm B — Trang Money Pages & Chuyển đổi chính
| URL | Từ | H2 / H3 | FAQ | Schema hiện có | Đang THIẾU gì cần bổ sung? |
|---|---|---|---|---|---|
| `/ban-do-doi-ngu` (`/doanh-chu` 308→) | 1.996 | 2 / 0 | **0** | **RỖNG** | **NGHIÊM TRỌNG:** Rút Title 98 → ≤60 ký tự, Description 167 → ≤155, thêm `WebPage + Service/WebApplication + BreadcrumbList + FAQPage` (5–7 câu B2B), thêm khối Trả lời nhanh mở, `<table>` các gói/hạng mục đội ngũ, `<time>` |
| `/goi-xem` | 2.848 | 4 / 11 | 5 | WebPage, Breadcrumb, FAQ | Thêm `<table>` so sánh gói Miễn phí vs Sao, thêm `Offer`/`Product` schema, thêm Trả lời nhanh mở, `<time>`, tạo `/pricing.md` liên kết từ `llms.txt` |
| `/thoi-gian-toi` | 2.023 | 1 / 1 | 4 | WebPage, WebApp, Breadcrumb, FAQ | Thiếu Trả lời nhanh, H2 quá ít (1 H2), thiếu `<table>` 12 tháng / nhịp vận, thêm 2 FAQ, `<time>` |
| `/chan-dung` | 2.005 | 1 / 1 | 4 | WebPage, WebApp, Breadcrumb, FAQ | Thiếu Trả lời nhanh, H2 quá ít (1 H2), thiếu `<table>` 8 môn hợp nhất trong Chân dung, thêm 2 FAQ, `<time>` |
| `/hom-nay` | 1.953 | 2 / 1 | 3 | WebPage, WebApp, Breadcrumb, FAQ | Thiếu Trả lời nhanh, thêm 2–3 FAQ, `<time>` |
| `/li-xi-tet-2027` | — | — | — | HTTP 404 (chưa merge/deploy lên production) | Trước khi deploy từ nhánh `feat/li-xi-tet-2027`, áp dụng luôn Chuẩn SEO/GEO bên dưới (Title ≤60, FAQPage, Trả lời nhanh mở, `<time>`) |

### Nhóm C — Trang Lịch, Mùa vụ & Hub Kiến thức
- `/xem-ngay-tot` (4.204w, 12 H2, 6 H3, 5 FAQ): Rất tốt, chỉ thiếu `<time>` và `<table>` tóm tắt giờ/ngày hoàng đạo + CDN cache.
- `/nam/2027` (3.035w, 10 H2, 6 FAQ, có `<table>`): Rất tốt, chỉ thiếu `<time>`.
- `/xem-sao-han`, `/xem-tuoi-lam-nha`, `/tuoi-xong-dat`, `/doi-lich-am-duong`, `/lich-am`, `/nam`: Đều thiếu `<time>`, FAQ mỏng (3–4 câu), H2/H3 ít, thiếu `<table>` tóm tắt ở 4 trang đầu.
- `/huyen-hoc` (3.713w, 8 H2, 17 H3, 6 FAQ, có `<table>`), `/kien-thuc`, `/tu-dien`, `/blog`, `/tu-vi/la-so-mau`: Đều thiếu `<time>` và Trả lời nhanh mở đầu trang; `/kien-thuc` và `/tu-vi/la-so-mau` thiếu `FAQPage`.
- `/tac-gia`: 0 H2, 0 H3, 0 FAQ (nên thêm mục giới thiệu quy trình thẩm định E-E-A-T).
- Các trang private/noindex (`/ban-than`, `/gia-dinh`, `/nap-sao`, `/hoi-vien`, `/tai-khoan`, `/hoi-chuyen-gia`): Đúng là `noindex` (riêng `/tai-khoan` có `CANON!` & `H1=0` — không ảnh hưởng SEO vì đã `noindex`, nhưng nên dọn canonical sạch).

---

## 3. 7 Ý tưởng Thông minh Nhất (Architectural Leverage) cho Pillar Page & Money Page

Thay vì sửa tay lẻ tẻ từng trang trong 48 URL, hãy thiết kế **ở tầng kiến trúc dùng chung** để 1 lần code nâng cấp đồng loạt toàn bộ hệ thống:

1. **Ý tưởng 1 — Nâng cấp `TrangCongCu.tsx` với cấu trúc "Dual-Intent Pillar Blueprint" (1 khung → sửa cả 16 trang trụ):**
   - **Trên màn hình đầu (Tool Intent — giữ gọn cho chuyển đổi):** H1 khớp truy vấn chính + 1 câu định nghĩa ngắn hiển thị mở (25–35 từ, không gập) + Công cụ tra cứu ngay lập tức.
   - **Ngay dưới công cụ (GEO/AEO Cẩm nang mở — visible DOM):** Chuẩn hoá 5 khối dữ liệu trong `so-trang.ts` cho mọi trang trụ:
     1. `dinh_nghia` (`H2: [Bộ môn] là gì?` — đoạn 40–60 từ tự đứng).
     2. `chi_so_cot_loi` (`H2: Các thành phần / chỉ số cốt lõi` — danh sách `<ul><li><strong>Thực thể</strong>: định nghĩa 1 câu</li></ul>` — đúng định dạng AI Overview trích nguyên văn).
     3. `bang_so_sanh` (`<table>` cấu trúc hoá: ví dụ Pitago vs Chaldea, 2 cách tính Đường đời, 8 hướng Bát trạch, 4 đường chỉ tay, Miễn phí vs Gói đầy đủ).
     4. `luoi_trang_con` (Direct Spoke Hub: trỏ thẳng 1-click xuống 12 số chủ đạo / 14 chính tinh / 8 cung phi / 10 thập thần — giảm click depth từ 2 → 1).
     5. `hoi_dap` (6–8 câu FAQ sát truy vấn thương mại + kỹ thuật) + dòng `<time dateTime="...">Cập nhật: ...</time>` + chữ ký biên tập E-E-A-T.
2. **Ý tưởng 2 — Biến dữ liệu thật của `hieuban.com` thành "Original Data Moat" (vũ khí Mèo Béo không có):**
   - Theo nghiên cứu Princeton GEO (KDD 2024), **Số liệu/Thống kê (+31%)** + **Trích dẫn nguồn (+27%)** + **Trích dẫn chuyên gia (+41%)** là 3 đòn bẩy mạnh nhất.
   - Hiểu Bản Thân đã có sẵn **kho cổ thư có `source_ref`** và **hệ thống `kiem_chung`** (người dùng tích chọn nét đúng). Hãy đưa 1 khối **"Minh bạch nguồn & số liệu"** tự động lên mỗi trang trụ (số cổ thư đối chiếu, quy tắc tính 2 trường phái, tỉ lệ kiểm chứng khi đủ mẫu).
3. **Ý tưởng 3 — Chuẩn hoá Anchor Text hai chiều bằng 1 bảng cấu hình tập trung (`ANCHOR_TRU`):**
   - Thay toàn bộ anchor chung chung (`"Số của tôi"`, `"✦ Thần số"`) ở chân ~600 trang con và bài blog bằng mảng anchor tự nhiên, sát truy vấn mục tiêu của từng trang trụ (`"Xem thần số học online miễn phí"`, `"Lập lá số Tử vi trọn đời miễn phí"`, `"Xem Bát tự Tứ trụ miễn phí"`, `"Xem phong thuỷ hướng nhà hợp tuổi"`...).
4. **Ý tưởng 4 — Tách rạch ròi vai trò Trang chủ `/` vs Trang trụ (Zero Cannibalization):**
   - Trang chủ `/` giữ vai trò **Brand & Multi-Discipline Platform Hub** (*"Hiểu Bản Thân — Nền tảng Huyền học & Thấu hiểu Bản thân có nguồn cổ thư"*), không tranh cụm `"thần số học online miễn phí"` ở Title/H1 với `/than-so`.
5. **Ý tưởng 5 — Tầng Agentic Commerce & Pricing (`/pricing.md` + `Offer` Schema trên `/goi-xem`):**
   - Xuất bản `/pricing.md` động từ đúng cấu hình GIA-99 hiện hành (Miễn phí làm được gì, gói Sao giá bao nhiêu VND, không cần tài khoản để xem miễn phí) và dẫn link từ `llms.txt` + `/goi-xem` để mọi AI agent (ChatGPT, Claude, Perplexity) báo giá chính xác 100%.
6. **Ý tưởng 6 — Bật CDN Edge Cache HTML (Q-I3) để cắt Cold TTFB từ 2.5–4.1s xuống <0.2s:**
   - Giải quyết dứt điểm tình trạng `x-vercel-cache: MISS` và `no-store` trên các trang kiến thức & trang trụ công khai (giữ `no-store` chỉ cho `/tai-khoan`, `/quan-tri`, `/api/*`, phiên đăng nhập).
7. **Ý tưởng 7 — Đồng bộ Multi-Engine & Third-Party Consensus (từ Cited → Recommended):**
   - Nộp 4 sitemap vào **Bing Webmaster Tools** (nuôi ChatGPT Search & Copilot) và kiểm tra **Brave Search** (nuôi Claude).
   - Mỗi trang trụ lớn làm 1 video YouTube 3–5 phút chuẩn *YouTube AI Citations* (tiêu đề khớp truy vấn, chapters theo từng chỉ số cốt lõi, transcript sạch, link trỏ thẳng về trang trụ) — Google AI Overviews trích YouTube với tỉ lệ rất cao.

---

## 4. Bộ "Chuẩn SEO / AEO / GEO cho Pillar Page & Money Page" (Đã ghi nhớ vào OKDB Memory)

Mọi trang trụ (Pillar Page) và trang chuyển đổi (Money Page) tạo mới hoặc nâng cấp trên `hieuban.com` **BẮT BUỘC** đạt đủ 12 tiêu chuẩn sau trước khi deploy (có thể khoá bằng test tự động trong `web/e2e/seo-k.spec.ts`):

1. **URL & Redirect:** Ngắn gọn, lowercase, gạch nối; `http://`, `www.`, trailing slash 308 1 bước; canonical tự trỏ, bỏ qua query tracking (`?kw=`, `utm_*`, `gclid`).
2. **Title & H1 (Zero Cannibalization):** Title 45–62 ký tự, từ khoá hành động + `"miễn phí"` (nếu có bản free) ở đầu + hậu tố `· Hiểu Bản Thân`; đúng 1 H1 khớp intent; không tranh từ khoá với trang chủ `/`.
3. **Meta Description:** 130–158 ký tự, nêu rõ lợi ích cụ thể + số lượng chỉ số/tính năng + "miễn phí, không cần tài khoản".
4. **Màn hình đầu (Above the Fold):** H1 + 1 câu tóm tắt mở (25–35 từ, **không giấu trong `<details>`**) + công cụ/CTA chính ngay trong viewport đầu.
5. **Khối Cẩm nang GEO mở (Visible DOM):** Phủ đủ Query Fan-Out của chủ đề bằng cấu trúc `H2 → H3 → ul > li > <strong>Thực thể</strong>: định nghĩa 1 câu tự đứng`.
6. **Ít nhất 1 bảng cấu trúc (`<table>`):** So sánh phương pháp/trường phái/gói dịch vụ hoặc bảng tra nhanh (AI trích bảng chính xác hơn văn xuôi).
7. **Direct Spoke Hub (Click Depth = 1):** Trang trụ trỏ thẳng xuống các trang con chủ lực (12 số, 14 chính tinh, 8 cung phi...) thay vì chỉ trỏ trang danh mục trung gian.
8. **Reverse Contextual Anchor:** Mọi trang con & blog trong cùng silo trỏ ngược về trang trụ bằng anchor chứa từ khoá hành động tự nhiên (không dùng nhãn UI chung chung).
9. **FAQPage chuẩn intent:** Tối thiểu 6–7 câu hỏi tự nhiên (phải có câu hỏi về miễn phí/chi phí, cách nhập liệu, phạm vi/giới hạn) khớp 100% giữa DOM hiển thị và `FAQPage` JSON-LD.
10. **Schema `@graph` đầy đủ:** `WebPage` + `WebApplication` (hoặc `Service`/`Offer` với Money Page) + `BreadcrumbList` + `FAQPage` nối về `#to-chuc` và `#website`.
11. **E-E-A-T & Freshness:** Có thẻ `<time dateTime="...">` hiển thị ngày cập nhật thật, có trích dẫn nguồn/phương pháp tính (và số liệu gốc nếu có), 100% `<img>` có `alt` hợp lệ.
12. **Performance & Agentic Readiness:** TTFB < 300ms (Edge CDN Cache cho vỏ HTML public), cho phép bot AI tìm kiếm trong `robots.txt`, cập nhật `sitemap.xml`, `llms.txt` và `/pricing.md` (nếu có giá).
