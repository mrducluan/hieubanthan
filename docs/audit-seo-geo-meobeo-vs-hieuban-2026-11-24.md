# Audit SEO / AEO / GEO: `meobeostudio.com/numerology` vs `hieuban.com/than-so`

- **Ngày kiểm toán:** 24/11/2026
- **Từ khoá mục tiêu:** `"xem thần số học"` (Google AI Overview / GEO + Top 5 Organic SEO)
- **Phạm vi kiểm chứng thực nghiệm:** HTML/HTTP thật trên production của `meobeostudio.com/numerology` và `hieuban.com` (`/`, `/than-so`, `/than-so?kw=xem-than-so-hoc`, `/than-so/y-nghia-so/so-7`), `robots.txt`, `llms.txt`, toàn bộ sitemaps, `git log` và mã nguồn `projects/hieubanthan`, đối chiếu với các báo cáo audit nội bộ `docs/AUDIT-SEO-GEO-2026-11.md` (03/11) và `docs/AUDIT-SEO-TRANG-DICH-VU-2026-11.md` (10/11).
- **Lưu ý phương pháp luận (trung thực dữ liệu):** Phân tích HTML/source code chỉ chứng minh **Mèo Béo đang làm gì trên trang (on-page, cấu trúc trích dẫn GEO, technical)** — **không thể chứng minh nguyên nhân duy nhất giúp Mèo Béo xếp hạng Top 5**. Các yếu tố off-page (tuổi domain — `hieuban.com` mới mở 08/10/2026 tức mới ~7 tuần tuổi; hệ sinh thái traffic viral Photobooth/Tarot/Lenormand của Mèo Béo; backlinks; brand mentions; CTR/dwell time) có trọng số rất lớn và cần dữ liệu Google Search Console + backlink để kiểm chứng.

---

## 1. Bằng chứng GEO trực tiếp: Tại sao Google AI Overview trích Mèo Béo Studio?

Trong ảnh chụp Google AI Overview cho `"xem thần số học"`, Google trích mục **"Các chỉ số cốt lõi thường gặp"** kèm nguồn **Mèo Béo Studio +2**:
- *Số chủ đạo (Đường đời): Định hướng chính và bài học lớn trong cuộc đời.*
- *Số linh hồn: Khao khát và mong muốn sâu thẳm bên trong.*
- *Số sứ mệnh (Biểu đạt): Tài năng bẩm sinh và cách bạn thể hiện bản thân.*
- *Số nhân cách: Ấn tượng đầu tiên người khác cảm nhận về bạn.*
- *Năm cá nhân: Năng lượng và chủ đề nổi bật của riêng năm hiện tại.*

Đối chiếu trực tiếp với HTML thật của `meobeostudio.com/numerology` dưới thẻ `<h3>Ý nghĩa các chỉ số cốt lõi</h3>`:
- `Đường Đời (Life Path): chỉ số quan trọng nhất — bài học lớn nhất và định hướng cả đời bạn.`
- `Sứ Mệnh (Destiny): tài năng thiên bẩm và mục đích bạn sinh ra để theo đuổi.`
- `Linh Hồn (Soul Urge): khao khát sâu thẳm khiến trái tim bạn thực sự hạnh phúc.`
- `Nhân Cách (Personality): ấn tượng người khác cảm nhận về bạn ở lần gặp đầu tiên.`
- `Năm Cá Nhân (Personal Year): năng lượng chủ đạo của năm nay để bạn biết nên tiến hay nên dưỡng.`

**Kết luận GEO:** Google AI Overview đã **rút trích gần như nguyên văn khối danh sách định nghĩa `H3 → ul > li > strong: định nghĩa 1 câu`** nằm hiển thị trực tiếp (visible DOM, không bị gập) trên trang trụ `/numerology` của Mèo Béo. Trong khi đó, `/than-so` của Hiểu Bản Thân **không có bất kỳ khối định nghĩa từng chỉ số cốt lõi nào trên trang trụ** — trang chỉ mô tả cách công cụ hoạt động (*"Về công cụ Thần số học"*) và gập câu trả lời nhanh duy nhất vào `<details>`.

---

## 2. Bảng so sánh trực diện: Mèo Béo Studio vs Hiểu Bản Thân (Dữ liệu đo thật 24/11/2026)

| Hạng mục | `meobeostudio.com/numerology` | `hieuban.com/than-so` | Đánh giá |
|---|---|---|---|
| **Title tag** | `Thần Số Học Online Miễn Phí — Tra Cứu Số Chủ Đạo & 13 Chỉ Số Theo Tên, Ngày Sinh \| Mèo Béo Studio` | `Tra cứu thần số học online: số chủ đạo theo ngày sinh · Hiểu Bản Thân` | Mèo Béo có `"Miễn Phí"` + con số cụ thể `"13 Chỉ Số"`; Hieuban thiếu `"miễn phí"` và `"xem thần số học"`. |
| **H1** | `Thần Số Học Online Miễn Phí` | `Thần số học theo họ tên và ngày sinh` | Mèo Béo khớp sát search intent công cụ miễn phí. |
| **Cannibalization trang chủ** | Trang chủ là hub đa dịch vụ (Photobooth, Tarot, Numerology) | Trang chủ `hieuban.com/` có Title `Hiểu Bản Thân — Thần số học và huyền học online miễn phí` + H1 `Bạn là số mấy?` | **Điểm yếu lớn của Hieuban:** Trang chủ vẫn tranh trực tiếp cụm `"thần số học online miễn phí"` với `/than-so`. |
| **Cấu trúc Heading trên trang trụ** | 1 H1 · **5 H2** · **14 H3** (`Thần số học là gì?`, `Ý nghĩa các chỉ số cốt lõi`, `Ý nghĩa 12 số chủ đạo`, `Cách tính Pythagoras`, `Cặp đôi`, `14 câu hỏi tra cứu nhiều nhất`, `FAQ`, `Review`) | 1 H1 · **3 H2** · **1 H3** (`Kiến thức Thần số học`, `Về công cụ Thần số học`, `Bài viết liên quan`, `Câu hỏi thường gặp`) | Mèo Béo phủ trọn vẹn cả **Tool Intent** + **Informational/GEO Intent** ngay trên trang trụ. Hieuban quá thiên về giới thiệu tool. |
| **Độ dài văn bản hiển thị** | ~2.914 từ (12.815 ký tự), toàn bộ Cẩm nang hiển thị mở | ~2.443 từ (10.705 ký tự), khối "Trả lời nhanh" bị gập trong `<details>` | Mèo Béo dễ được parser RAG/AIO trích từng đoạn atomic. |
| **Internal links trên trang trụ** | **32 link liên quan** (trỏ thẳng tới **12 trang số chủ đạo 1–33** + **12+ bài blog** chuyên sâu) | **11 link liên quan** (chỉ trỏ 6 trang danh mục cấp 2 như `/than-so/y-nghia-so`, **không trỏ thẳng 12 con số**, chỉ 3 bài blog) | Mèo Béo truyền PageRank + ngữ nghĩa trực tiếp từ trang trụ xuống 12 con số (depth 1). |
| **Quy mô Sitemap & Topical Depth** | 942 URL tổng · **30 URL** thần số học | **2.246 URL tổng** (4 sitemap) · **153 URL VI + 144 URL EN** thần số học | **Hieuban vượt trội 5x** về chiều sâu kho tri thức — lợi thế lớn nhưng chưa được gom sức mạnh về `/than-so`. |
| **JSON-LD / Structured Data** | 2 block: `WebApplication` (có `AggregateRating` 5/5, 12 reviews) + `FAQPage` (7 câu). Không có `Organization`, `BreadcrumbList`, `hreflang`. | 3 block `@graph`: `Organization` (`sameAs` 4 MXH, `founder` Đức Luân, `knowsAbout` Wikipedia + Wikidata QID), `WebSite`, `BreadcrumbList`, `WebPage`, `WebApplication`, `FAQPage` (4 câu), `hreflang` vi/en. | **Hieuban vượt trội hoàn toàn** về Entity Graph & Schema chuẩn SEO. |
| **`llms.txt` & AI Crawlers (`robots.txt`)** | `llms.txt` **404** (47 bytes JSON lỗi). `robots.txt` chỉ `Allow: /`. | `llms.txt` chuẩn ≤15 KB + `.md` alternates. `robots.txt` mở riêng cho `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `PerplexityBot`, `Google-Extended` và chặn bot train. | **Hieuban làm tốt hơn hẳn.** Thực chứng cho thấy `llms.txt` không phải yếu tố quyết định GEO. |
| **TTFB & Edge Cache** | Cold **0.27s** · Warm **0.24s** (Cloudflare) | Cold **0.70s** · Warm **0.33s** (`x-vercel-cache: MISS`, `cache-control: private, no-cache, no-store` trên cả `/than-so` lẫn `/than-so/y-nghia-so/so-7`) | **Điểm yếu Technical của Hieuban:** CSP nonce theo từng request trong `proxy.ts` làm tắt hoàn toàn CDN cache HTML (Q-I3 chưa được triển khai lên production). |
| **Tham số `?kw=` (Google Ads)** | Không dùng | `hieuban.com/than-so?kw=...` giữ đúng `canonical: https://hieuban.com/than-so` | **An toàn**, không gây trùng lặp index. |

---

## 3. Đánh giá khắt khe: Technical SEO của `hieuban.com` đã đủ tốt chưa?

**Kết luận thẳng thắn: Nền móng Technical SEO của `hieuban.com` đạt ~8.5/10 — thực chất VƯỢT Mèo Béo ở gần như mọi tiêu chuẩn kỹ thuật kinh điển**, NHƯNG đang **hụt ở 2 điểm kỹ thuật còn treo** và **3 điểm kiến trúc On-page / GEO quyết định trực tiếp khả năng được AI Overview trích và lên Top 5**:

### Những gì đã làm rất tốt (đã kiểm chứng trên production + `git log`)
1. **Entity & Schema Graph xuất sắc (`lib/seo.ts`, commit `86b2c66` SEO-Q):** Đã lên production đủ `Organization` + `sameAs` (Facebook, TikTok, YouTube, X) + `founder` (`/tac-gia/duc-luan`) + `knowsAbout` gắn đúng Wikidata QID & Wikipedia + `BreadcrumbList` + `WebApplication` + `FAQPage`.
2. **AI Bot Governance chuẩn mực (`robots.txt`):** Mở đúng search/grounding bots (`OAI-SearchBot`, `PerplexityBot`, `Google-Extended`...), chặn training bots; `llms.txt` đã rút gọn ≤ 15 KB.
3. **Silo tri thức khổng lồ & sạch (`AUDIT-SEO-GEO-2026-11.md` đợt 2 & 3):** 153 URL thần số học VI + 144 URL EN, đã sửa vị trí "Trả lời nhanh" trên ~600 trang kiến thức, đã gộp 46 trang hướng hợp tuổi về 8 trang cung phi, đã chuẩn hoá canonical `?kw=`.

### Những lỗ hổng còn tồn tại (Delta chưa xong + phát hiện mới từ Mèo Béo)
1. **Thiếu khối kiến thức nguyên tử (Atomic GEO Chunks) ngay trên trang trụ `/than-so`:** Không có phần định nghĩa `H2/H3 + bullet` cho *Thần số học là gì*, *Các chỉ số cốt lõi (Đường Đời, Sứ Mệnh, Linh Hồn, Nhân Cách, Năm Cá Nhân, 4 Đỉnh Cao)*, *Cách tính Pythagoras*, *12 số chủ đạo*. Khối `TraLoiNhanhDau` bị gập trong `<details>` và chỉ giới thiệu tính năng tool.
2. **Cannibalization giữa trang chủ `/` và `/than-so` vẫn còn nguyên:** Trang chủ mang Title `"Hiểu Bản Thân — Thần số học và huyền học online miễn phí"` và H1 `"Bạn là số mấy?"` trong khi `/than-so` lại không có `"miễn phí"` hay `"xem thần số học"` trong Title/H1.
3. **CDN Cache HTML (Q-I3) chưa bật trên production:** Mọi trang public (`/than-so`, `/than-so/y-nghia-so/so-7`...) vẫn trả `cache-control: private, no-cache, no-store` và `x-vercel-cache: MISS`, khiến cold TTFB ~0.70s (chậm gấp ~2.6 lần Mèo Béo). Với bot AI realtime (`ChatGPT-User`, `Perplexity-User`) và crawl budget >2.200 URL, đây là điểm nghẽn thực sự.
4. **Liên kết nội bộ trang trụ `/than-so` bị đứt tầng:** Không trỏ trực tiếp xuống 12 trang `/than-so/y-nghia-so/so-1` … `so-33` và chỉ hiện 3 bài blog, làm giảm tín hiệu Topical Hub của `/than-so`.
5. **Thiếu Social Proof thật & FAQ bám sát truy vấn thương mại/công cụ:** Chưa có 3 câu FAQ mà người tìm `"xem thần số học"` hỏi nhiều nhất (*"Xem thần số học ở đây có miễn phí không?"*, *"Nhập tên có dấu hay không dấu?"*, *"Xem thần số học cặp đôi thế nào?"*) và chưa đưa số liệu kiểm chứng thật từ hệ thống `kiem_chung` lên trang trụ.
6. **E-E-A-T thẩm định chuyên gia & Off-page (Domain mới 7 tuần tuổi):** Như audit 03/11 đã chỉ ra, sổ thẩm định chuyên gia vẫn gần như trống, và tên miền `hieuban.com` mới mở từ 08/10/2026 nên chưa tích luỹ đủ tuổi domain, backlinks và brand mentions như Mèo Béo.

---

## 4. Lộ trình đề xuất (P0 → P1 → P2) kèm tác động & chỉ số GSC

| Ưu tiên | Hạng mục cụ thể | Tác động | Công sức | Chỉ số GSC / Analytics theo dõi (sau 2–4 tuần) |
|---|---|---|---|---|
| **P0-1** | **Bổ sung khối "Cẩm nang Thần số học" mở hoàn toàn (visible DOM) dưới công cụ trên `/than-so`**: gồm các `H2/H3` chuẩn trích dẫn GEO: (1) *Thần số học là gì?* (2 câu tự đứng), (2) *Các chỉ số cốt lõi trong thần số học* (bullet `<strong>Tên chỉ số</strong>: định nghĩa 1 câu` cho Đường Đời, Sứ Mệnh, Linh Hồn, Nhân Cách, Năm Cá Nhân, 4 Đỉnh Cao — kèm câu bản lề "2 cách cộng Đường đời + giữ số cái 11, 22, 33"), (3) *Bảng 12 số chủ đạo* trỏ thẳng 12 link `/than-so/y-nghia-so/so-1..33`, (4) *Cách tính theo Pythagoras (và so sánh Chaldea)*, (5) *6–8 câu hỏi người dùng hay tra cứu nhất*. | **Rất cao (GEO + SEO)** | Thấp (1–2h, sửa `so-trang.ts` / `TrangCongCu.tsx` + 1 component bảng 12 số) | Tỉ lệ hiển thị & vị trí trung bình của `/than-so` cho `"xem thần số học"`, `"thần số học là gì"`, `"các chỉ số thần số học"`; `landing_viewed` nguồn `ai`. |
| **P0-2** | **Chấm dứt cannibalization Trang chủ `/` vs `/than-so`**: Tối ưu Title/H1 `/than-so` thành `"Xem Thần Số Học Online Miễn Phí — Tra Cứu Số Chủ Đạo & 13 Chỉ Số · Hiểu Bản Thân"` (hoặc giữ ≤ 65 ký tự: `"Xem Thần Số Học Online Miễn Phí: Số Chủ Đạo · Hiểu Bản Thân"`), H1 `"Xem Thần Số Học Online Miễn Phí theo Họ Tên & Ngày Sinh"`. Đổi Title trang chủ `/` sang định vị thương hiệu nền tảng huyền học tổng hợp (không lặp cụm `"thần số học online miễn phí"` ở đầu) và đổi H1 trang chủ không tranh trực tiếp `"số mấy"`. | **Cao (SEO)** | Rất thấp (30 phút) | Trong GSC → lọc truy vấn chứa `"thần số học"` → tab Trang: tỉ lệ impression/click đổ về `/than-so` thay vì `/` đạt >85%. |
| **P0-3** | **Mở rộng FAQPage trên `/than-so` từ 4 → 7 câu khớp đúng Search Intent**: thêm *"Xem thần số học trên Hiểu Bản Thân có miễn phí không?"*, *"Cần nhập họ tên có dấu hay không dấu?"*, *"Xem thần số học cặp đôi / hợp đôi như thế nào?"* (trỏ về `/hop-doi`). Đồng thời mở mặc định hoặc hiển thị 1 câu định nghĩa ngắn (không giấu trong `<details>`) trên đầu trang. | **Cao (AEO/GEO)** | Rất thấp (30 phút) | Impressions & CTR của `/than-so` trên các truy vấn câu hỏi dài đuôi. |
| **P1-1** | **Triển khai CDN Cache HTML (Q-I3) cho nhóm trang kiến thức & trang công cụ tĩnh-phần-vỏ**: Bỏ CSP nonce bắt buộc per-request ở các trang public kiến thức (`/than-so/y-nghia-so/*`, `/tu-vi/*`, `/kinh-dich/*`…) để bật `s-maxage=3600, stale-while-revalidate=86400` trên Vercel Edge (đưa TTFB từ 0.70s xuống <0.15s). | **Cao (Technical/Crawl/AI Bot)** | Trung bình (1 ngày, kèm E2E test CSP) | GSC → Cài đặt → Thống kê thu thập: *Thời gian phản hồi trung bình* giảm xuống <300ms; tăng số trang được index/ngày. |
| **P1-2** | **Tăng sức mạnh Internal Linking cho cụm Thần số học**: Từ `/than-so`, hiển thị đủ 12 link trực tiếp `so-1`..`so-33` + 8–10 bài blog thần số học nổi bật; ngược lại, rà 153 trang con `/than-so/*` và bài blog đảm bảo mọi trang đều có anchor text tự nhiên `"xem thần số học online miễn phí"` / `"tra cứu thần số học"` trỏ ngược về `/than-so`. | **Trung bình–Cao (SEO)** | Thấp (2–3h) | GSC → Liên kết nội bộ trỏ về `/than-so` tăng; vị trí nhóm từ khoá `"số chủ đạo X"`. |
| **P1-3** | **Đưa bằng chứng thực nghiệm thật (Original Data / Social Proof) lên `/than-so`**: Tận dụng chính điểm khác biệt mà Mèo Béo KHÔNG có — bảng tỉ lệ kiểm chứng thật từ dữ liệu `kiem_chung` của người dùng (ví dụ: *"X% người dùng xác nhận đúng các nét chính"* nếu đủ mẫu thống kê) + trích dẫn nguồn học thuật (Pythagoras / David Phillips / Chaldea) ngay trong phần cẩm nang. Không dùng review ảo. | **Trung bình–Cao (GEO + E-E-A-T + CRO)** | Trung bình | Tỉ lệ chuyển đổi (CR) xem lá số & nạp Sao; độ tin cậy E-E-A-T. |
| **P2-1** | **Đẩy E-E-A-T & Off-page Authority (bắt buộc để vào Top 5 bền vững)**: (a) Đẩy nhanh thẩm định chuyên gia (`so_tham_dinh`) cho 12 trang số chủ đạo & 10 trang trụ trước; (b) Xây dựng backlink & brand mention tự nhiên (bài PR/guest post, mô tả YouTube/TikTok/Facebook trỏ trực tiếp về `/than-so` với đúng ngữ cảnh, đẩy mạnh các công cụ viral như Lì Xì Tết 2027, Hợp đôi để kéo branded search + backlink tự nhiên). | **Rất cao (SEO dài hạn)** | Dài hạn (liên tục) | Domain Rating / Referring Domains, lượng tìm kiếm thương hiệu `"hiểu bản thân"` / `"hieuban"`, vị trí Top 10 → Top 5 `"xem thần số học"`. |

---

## 5. Dữ liệu cần anh cung cấp thêm (để khóa phần Off-page)
Để tách bạch chính xác bao nhiêu % khoảng cách đến từ **On-page/GEO** và bao nhiêu % đến từ **tuổi domain/backlink**, anh có thể xuất giúp em:
1. **Google Search Console (28 ngày gần nhất):** Truy vấn chứa `"thần số học"` (Hiển thị, Nhấp, CTR, Vị trí trung bình) và danh sách trang đang nhận hiển thị cho cụm này (`/` vs `/than-so` vs `/than-so/y-nghia-so/*`).
2. **Trạng thái index** của `sitemap.xml` và `sitemap-cum.xml` trong GSC (bao nhiêu URL đã được index / bao nhiêu URL ở trạng thái *"Đã phát hiện — hiện chưa được lập chỉ mục"*).
