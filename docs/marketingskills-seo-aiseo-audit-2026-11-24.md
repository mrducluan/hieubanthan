# Báo cáo Kiểm toán theo Framework `marketingskills` (`seo-audit` v2.2.10 + `ai-seo` v2.12.7)

- **Ngày thực hiện:** 24/11/2026
- **Bộ skill đã cài:** 53 skill từ `https://github.com/coreyhaines31/marketingskills` vào `workspace-main/skills/` (bao gồm `seo-audit`, `ai-seo`, `schema`, `site-architecture`, `programmatic-seo`, `competitor-profiling`, `link-building`, `content-strategy`, `cro`…).
- **Đối tượng kiểm toán:** Đối thủ `meobeostudio.com/numerology` (+ trang con `/numerology/so-chu-dao/7`) vs `hieuban.com/than-so` (+ trang chủ `/`, `/en/numerology`, `/than-so/y-nghia-so/so-7`).
- **Lưu ý trung thực dữ liệu:** Các hạng mục đo trực tiếp từ HTML/HTTP production được ghi rõ bằng chứng; các hạng mục cần quyền truy cập bên ngoài (Google Search Console Generative AI report, Bing Webmaster Tools, Brave Search index, backlink profile, Core Web Vitals field data CrUX) được đánh dấu **Chưa đo được (cần dữ liệu GSC/BWT)** theo đúng quy tắc của `seo-audit`.

---

## 1. Executive Summary (Tổng quan theo `seo-audit` + `ai-seo`)

- **Nghịch lý lớn nhất của `hieuban.com`:**
  - **Trang con (Spoke pages)** như `/than-so/y-nghia-so/so-7` đang **VƯỢT TRỘI HOÀN TOÀN** Mèo Béo (`/numerology/so-chu-dao/7`): 3.200 từ vs 1.948 từ, có `<time>` ngày đăng/cập nhật (`08/10/2026`, `17/11/2026`), có trích dẫn cổ thư (*"Sách xưa nói gì"* — Princeton GEO +27%), có thống kê & toán học (*"Đường đời số 7 có hiếm không?"* — Princeton GEO +31%), có ví dụ tính 2 cách, có `hreflang` 2 chiều hoàn chỉnh.
  - **Trang trụ (Pillar page) `/than-so`** lại đang **THUA Mèo Béo `/numerology` đúng ở lớp trích xuất AEO/GEO & liên kết nội bộ**: thiếu khối định nghĩa mở cho Query Fan-Out, thiếu `<time>` freshness, bị trang chủ `/` cannibalize cụm `"thần số học online miễn phí"`, và anchor text từ 153 trang con trỏ về `/than-so` đang quá chung chung (`"✦ Thần số"`, `"Số của tôi"`) thay vì `"xem thần số học"` / `"tra cứu thần số học miễn phí"`.

---

## 2. Chấm điểm 10 tiêu chí Extractability của `ai-seo` (Mèo Béo vs Hiểu Bản Thân)

| # | Tiêu chí `ai-seo` (Step 3: Content Extractability) | Mèo Béo `/numerology` | Hiểu Bản Thân `/than-so` | Hiểu Bản Thân `/than-so/y-nghia-so/so-7` |
|---|---|---|---|---|
| 1 | Định nghĩa rõ ràng ngay đoạn đầu (không ẩn) | **PASS** (`Thần số học là gì?` mở trực tiếp) | **FAIL** (chỉ mô tả tool, gập trong `<details>`) | **PASS** (Trả lời nhanh mở ngay dưới H1) |
| 2 | Khối trả lời tự đứng (Standalone answer blocks) | **PASS** (6 chỉ số cốt lõi dạng `<strong>X</strong>: định nghĩa`) | **FAIL** (không định nghĩa từng chỉ số cốt lõi) | **PASS** |
| 3 | Số liệu/thống kê có nguồn (Princeton GEO +31%) | **PARTIAL** ("13 chỉ số", "4 đỉnh cao") | **PARTIAL** (chưa có thống kê kiểm chứng) | **PASS** (xác suất hiếm, 2 cách tính) |
| 4 | Bảng so sánh / cấu trúc hóa (`[X] vs [Y]`) | **FAIL** (0 `<table>`) | **FAIL** (0 `<table>` so sánh Pitago vs Chaldea / 2 cách tính) | **PASS** |
| 5 | Mục FAQ bằng ngôn ngữ tự nhiên sát truy vấn | **PASS** (7 câu: miễn phí không, số chủ đạo, tên không dấu, cặp đôi…) | **PARTIAL** (4 câu; thiếu miễn phí không & cặp đôi) | **PASS** |
| 6 | Schema Markup (WebApp, FAQ, Org, Breadcrumb) | **PARTIAL** (WebApp + AggregateRating + FAQ; thiếu Org/Breadcrumb) | **PASS** (đủ `@graph` + Wikidata QID + sameAs) | **PASS** |
| 7 | Tác giả & chuyên môn (E-E-A-T Attribution) | **FAIL** (chỉ ghi brand Mèo Béo Studio) | **PARTIAL** (có trong JSON-LD, không hiện tác giả trên trang trụ) | **PASS** (Đức Luân + tiểu sử) |
| 8 | Tín hiệu tươi mới (`<time>` cập nhật < 6 tháng) | **FAIL** (không có `<time>` trên trang) | **FAIL** (`times: []` trên `/than-so`) | **PASS** (`08/10/2026`, `17/11/2026`) |
| 9 | Hệ thống Heading khớp Query Fan-Out | **PASS** (5 H2, 14 H3 phủ trọn fan-out) | **FAIL** (3 H2, 1 H3 — không phủ fan-out) | **PASS** (12 H2 sát truy vấn) |
| 10 | Chính sách AI Crawler + Machine-readable | **PARTIAL** (`Allow: /`, `llms.txt` 404) | **PASS** (tách search vs training bots, `llms.txt` ≤15KB; thiếu `/pricing.md`) | **PASS** (có `.md` alternate) |

---

## 3. Kiểm toán theo Checklist `seo-audit` v2.2.10 (Phát hiện mới)

### A. Crawlability, Redirects & International SEO (Đa ngôn ngữ)
- **Redirects (`http://`, `www.`, trailing slash `/`):** **PASS** — cả 3 đều trả `308` 1 bước thẳng về `https://hieuban.com/than-so`.
- **Hreflang & Reciprocal Links (`/than-so` ↔ `/en/numerology`):** **PASS** — `/en/numerology` trả `HTTP 200`, `content-language: en`, `lang="en"`, self-canonical `https://hieuban.com/en/numerology`, có đủ 3 thẻ `hreflang` đối xứng (`en`, `vi`, `x-default`), nội dung chính dịch trọn vẹn tiếng Anh (1.028 từ).
- **Cảnh báo nhỏ (Medium):** `proxy.ts` gắn `vary: Accept-Language` cho `/en/*` — cần đảm bảo Googlebot (IP Mỹ, không gửi `Accept-Language`) luôn nhận đúng bản `/en` chuẩn mà không bị lệch variant.
- **Ảnh thiếu `alt` (Low):** Phát hiện `imgsNoAlt: 1` trên `/en/numerology` và `/than-so/y-nghia-so/so-7` (Mèo Béo có `imgsNoAlt: 2` trên `/so-chu-dao/7`). Nên rà và thêm `alt=""` (nếu ảnh trang trí) hoặc mô tả cụ thể.

### B. Internal Linking & Anchor Text (Phát hiện đắt giá nhất từ `seo-audit`)
- **Mèo Béo `/numerology/so-chu-dao/7` trỏ ngược về `/numerology` bằng anchor bám sát từ khoá mục tiêu:**
  `"Xem thần số học"`, `"Tính số chủ đạo của bạn miễn phí"`, `"Nhập ngày sinh ở trang tra cứu thần số học"`, `"Tra cứu trọn bộ 13 chỉ số thần số học miễn phí"`.
- **Hiểu Bản Thân `/than-so/y-nghia-so/so-7` trỏ ngược về `/than-so` bằng anchor giao diện chung chung:**
  `"✦ Thần số"`, `"Số của tôi"`, `"Thần số học"`, `"Tính thần số học của tôi"` — **không có anchor `"xem thần số học"` hay `"miễn phí"`**.
- Đồng thời chiều đi từ `/than-so` xuống 12 con số đang bị ngắt qua tầng trung gian (`/than-so/y-nghia-so`), trong khi Mèo Béo đặt đủ 12 nút trỏ thẳng xuống `/so-chu-dao/1..33`.

### C. Technical Performance & Agentic Readiness (`ai-seo`)
- **Cache-Control / TTFB:** Production `hieuban.com` vẫn trả `cache-control: private, no-cache, no-store` và `x-vercel-cache: MISS` (cold 0.70s vs Mèo Béo 0.27s). Cần đưa Q-I3 CDN Cache lên production cho nhóm trang kiến thức để tối ưu crawl efficiency và bot AI realtime (`ChatGPT-User`, `Perplexity-User`).
- **Agentic Pricing (`/pricing.md`):** `hieuban.com/pricing.md`, `/bang-gia`, `/bang-gia.md`, `/llms-full.txt` đều trả **404**. Theo `ai-seo`, bổ sung `/pricing.md` (ghi rõ gói Miễn phí vs gói Sao / GIA-99 minh bạch, đơn vị VND, ngày cập nhật) và link từ `llms.txt` giúp agent AI không đoán sai giá.
- **Multi-Engine Index Coverage (Chưa đo được — cần xác minh ngay):**
  - **Google Search Console:** Kiểm tra báo cáo **Generative AI performance** (Google mở rộng từ 31/08/2026) để xem impression AI Overviews / AI Mode.
  - **Bing Webmaster Tools** (nguồn index của **ChatGPT Search** & **Copilot**): Xác nhận đã submit đủ 4 sitemap của `hieuban.com`.
  - **Brave Search** (nguồn index của **Claude**): Kiểm tra `site:hieuban.com` tại `search.brave.com` và submit URL nếu chưa có.

### D. Query Fan-Out & Citation vs. Recommendation (`ai-seo`)
Khi người dùng gõ `"xem thần số học"`, Google AI Overview & ChatGPT sẽ tách thành các truy vấn phụ (fan-out):
1. *Thần số học là gì?*
2. *Các chỉ số cốt lõi (Đường đời, Sứ mệnh, Linh hồn, Nhân cách, Năm cá nhân, 4 Đỉnh cao) có ý nghĩa gì?*
3. *Cách tính số chủ đạo (và trường hợp 11, 22, 33)?*
4. *Xem thần số học online miễn phí không cần tài khoản ở đâu?*
5. *So sánh thần số học Pythagoras vs Chaldea / 2 cách cộng đường đời?*
6. *Xem thần số học cặp đôi / hợp đôi?*

**Lưu ý cốt lõi của `ai-seo`:**
- **Citation (trích dẫn)** đến từ cấu trúc & dữ liệu trên chính `hieuban.com` (Google AIO, Perplexity, ChatGPT).
- **Recommendation (được đề xuất vào danh sách top công cụ)** đến từ **đồng thuận bên thứ ba (third-party consensus)**: YouTube (Google AIO trích YouTube rất mạnh — cần transcript/chapters/description chuẩn), bài review/roundup trên báo/blog ngoài, diễn đàn, và sự đồng nhất mô tả thương hiệu trên mọi hồ sơ `sameAs`.

---

## 4. Kế hoạch hành động tổng hợp (Cập nhật từ `seo-audit` + `ai-seo`)

| Ưu tiên | Hạng mục | Nguồn skill | Tác động | Công sức |
|---|---|---|---|---|
| **P0-1** | Bổ sung khối **"Cẩm nang Thần số học"** mở hoàn toàn (visible DOM) trên `/than-so` phủ đủ 6 nhánh Query Fan-Out: định nghĩa *Thần số học là gì*, danh sách bullet *6 chỉ số cốt lõi*, **bảng so sánh 2 cách tính Đường đời & Pitago vs Chaldea** (`<table>`), bảng 12 link trực tiếp `so-1..33`, ngày cập nhật `<time>`. | `ai-seo` (Pillar 1 + Fan-Out) | **Rất cao** | 1–2 giờ |
| **P0-2** | Chấm dứt cannibalization `/` vs `/than-so` (Title/H1 `/than-so` chứa `"Xem Thần Số Học Online Miễn Phí"`; tách Title/H1 trang chủ `/` sang định vị nền tảng huyền học tổng hợp). | `seo-audit` (Keyword Targeting) | **Cao** | 30 phút |
| **P0-3** | Nâng cấp anchor text trỏ ngược từ 153 trang con `/than-so/*` về `/than-so` (thay `"Số của tôi"` bằng `"Xem thần số học online miễn phí"` / `"Tra cứu số chủ đạo của bạn"`) + mở rộng FAQPage trên `/than-so` từ 4 → 7 câu. | `seo-audit` (Internal Linking) + `ai-seo` | **Cao** | 1 giờ |
| **P1-1** | Nộp 4 sitemap lên **Bing Webmaster Tools** (cho ChatGPT/Copilot) + kiểm tra index **Brave Search** (cho Claude) + kiểm tra **GSC Generative AI performance report**. | `ai-seo` (Step 0 Index Check) | **Cao (đa nền tảng AI)** | 30 phút (anh thao tác) |
| **P1-2** | Thêm `/pricing.md` (cấu trúc chuẩn `ai-seo`, link từ `llms.txt`) + bật CDN Cache HTML (Q-I3) cho nhóm trang kiến thức + sửa `imgsNoAlt` trên `/en/numerology` & `/so-7`. | `ai-seo` (Agentic) + `seo-audit` (Speed/Images) | **Trung bình–Cao** | 0.5–1 ngày |
| **P2-1** | Xây dựng **Third-Party Consensus** để lên nhóm *Recommended* (không chỉ *Cited*): video YouTube hướng dẫn `"Cách xem & tính thần số học chuẩn"` có chapters + transcript trỏ về `/than-so`, bài roundup/PR ngoài site, hoàn tất thẩm định chuyên gia (`so_tham_dinh`) và đưa dữ liệu thống kê thật (`kiem_chung`) lên trang trụ (Princeton GEO +31%). | `ai-seo` (Pillar 2 & 3) | **Rất cao (dài hạn)** | Liên tục |

---

## 5. Hồ sơ đối thủ theo chuẩn `competitor-profiling` v2.1.9 (Mèo Béo Studio — Snapshot 24/11/2026)

*Tuân thủ nguyên tắc 3 lớp tách bạch: **Observed** (quan sát thật trên HTML/HTTP & ảnh anh gửi) · **Inferred** (suy luận có mức tin cậy) · **Implication** (hàm ý cho Hiểu Bản Thân). Không quan sát thấy ≠ không tồn tại.*

- **Observed (Dữ kiện đo thật 24/11/2026):**
  - **Định vị & sản phẩm:** Trang đa tiện ích giải trí/huyền học (`942 URL` trong `sitemap.xml` gồm Photobooth/Selfbooth, Tarot, Lenormand, Bát Tự, Bài Tây, Xin Xăm, và 30 URL Thần số học).
  - **Mô hình kiếm tiền trên `/numerology`:** Miễn phí toàn bộ chỉ số cốt lõi + luận giải tổng quan, không cần tạo tài khoản; bán gói luận giải chuyên sâu trả phí một lần (theo nội dung FAQ trên trang).
  - **Tín hiệu SERP & AI Overview (theo 2 ảnh anh gửi):** Xuất hiện trong khối trích dẫn Google AI Overview (mục *"Các chỉ số cốt lõi thường gặp"*, ghi nguồn `Mèo Béo Studio +2`) và Top 5 kết quả tự nhiên cho truy vấn `"xem thần số học"`.
  - **Tín hiệu nội dung & liên kết:** Trang trụ `/numerology` có 2.914 từ, 5 H2 / 14 H3, 32 link liên quan (12 số chủ đạo + 12+ blog), 7 FAQ; trang con `/so-chu-dao/7` có 1.948 từ, 7 link trỏ ngược về `/numerology` với anchor sát truy vấn (`"Xem thần số học"`, `"Tra cứu thần số học"`), chưa có `<time>` ngày cập nhật và chưa có mục nguồn sách/tác giả cá nhân.
  - **Không đo được từ HTML (Chưa có dữ liệu):** Traffic thực tế, backlink profile, Domain Rating, tỉ lệ chuyển đổi, vị trí trên Bing/ChatGPT/Perplexity/Brave.
- **Inferred (Suy luận — độ tin cậy trung bình–cao):**
  - Mèo Béo hưởng lợi kép từ (a) cấu trúc khối định nghĩa mở trên `/numerology` rất dễ bị AI Overview trích, và (b) lưu lượng + tín hiệu thương hiệu chéo từ các công cụ giải trí viral khác trên cùng domain (Photobooth, Tarot).
- **Implication (Hàm ý hành động cho Hiểu Bản Thân):**
  - Hiểu Bản Thân **không nên** sao chép lối mở rộng blog đại trà hay đánh đổi tính học thuật/minh bạch — lợi thế cạnh tranh thật sự của Hiểu Bản Thân là **chiều sâu tri thức có nguồn cổ thư + tính toán minh bạch 2 cách + 153 trang con vượt trội**. Chỉ cần đưa đúng cấu trúc trích dẫn mở + bảng so sánh + anchor text chuẩn lên `/than-so` và khóa cannibalization với trang chủ là có thể cạnh tranh sòng phẳng ở lớp Citation (GEO), đồng thời đẩy Bing/Brave/YouTube/PR để xây lớp Recommendation.

