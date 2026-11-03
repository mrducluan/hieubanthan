# A — Kiểm kê URL, giá trị index và mục tiêu GEO (hieuban.com, 2026-11-03)

Phạm vi: chỉ đọc repo, đo trên site thật. Khoảng 280 lượt gọi (≤ 4 song song), UA trình duyệt, kèm vài lượt Googlebot và OAI-SearchBot.
Đã đọc trước: `docs/AUDIT-AIO-SEO-2026-10.md`, `docs/QUY-HOACH-URL.md`, các dòng SEO-K, SEO-L, SEO-M trong CLAUDE.md,
`web/app/robots.ts`, `web/app/sitemap.ts`, `web/app/sitemap-ngay.xml/route.ts`, `web/app/sitemap-cum.xml/route.ts`.
Không lặp các mục đã sửa trong báo cáo cũ (robots chặn cặp số, H1 kép NotFair, schema Draft, neo H2…).

Cách đo: "chữ" = số từ trong `<main>` của HTML máy chủ (gồm cả chữ trong hình SVG). "TLN ở từ thứ" = khối "Trả lời nhanh" bắt đầu
sau bao nhiêu từ trong `<main>`. "Phần riêng" = tỉ lệ cụm 5 từ của một trang không xuất hiện ở trang nào khác trong mẫu cùng nhóm
(mẫu 6–12 trang; đây là cận dưới, mẫu lớn hơn thì số thấp hơn). Không có số liệu lượt tìm/nhấp, nên không đoán traffic.

---

## 1. Tổng số và phân nhóm

Sitemap: `/sitemap.xml` 1.169 URL + `/sitemap-ngay.xml` 406 URL = **1.575 URL index được**. 17 sitemap cụm (`/sitemap-cum-*.xml`,
626 URL) là tập con của `/sitemap.xml` — không thêm URL mới, không lỗi.

| Nhóm | Mẫu đường dẫn | Số URL | Ghi chú |
|---|---|---:|---|
| **(a) Công cụ / trang trụ** | `/`, `/than-so`, `/tu-vi`, `/bat-tu`, `/kinh-dich`, `/phong-thuy`, `/hop-doi`, `/hom-nay`, `/thoi-gian-toi`, `/xem-ngay-tot`, `/xem-tuoi-lam-nha`, `/tuoi-xong-dat`, `/xem-sao-han`, `/doi-lich-am-duong`, `/nam`, `/lich-am`, `/huyen-hoc`, `/kien-thuc`, `/tu-dien` | 19 | kết quả riêng cần nhập hồ sơ |
| **(b) Engine dựng theo ngày / năm / tuổi** | | **1.015** | |
| | `/xem-ngay-tot/{yyyy-mm-dd}` | 406 | −6 … +399 ngày |
| | `/xem-ngay-tot/{việc}-thang-{m}-{yyyy}` (6 việc) | 150 | tháng này → +24 |
| | `/xem-ngay-tot/thang-{m}-{yyyy}` | 37 | −12 … +24 tháng |
| | `/nam/{năm}/tuoi-{năm sinh}` | 92 | 2026, 2027 × 1960–2005 |
| | `/xem-tuoi-lam-nha/{năm}/tuoi-{ns}` | 92 | như trên |
| | `/tuoi-xong-dat/{năm}/tuoi-{ns}` | 92 | như trên |
| | `/bat-tu/menh-theo-nam/sinh-nam-{1950…2027}-menh-gi` | 78 | |
| | `/phong-thuy/huong-hop-tuoi/tuoi-{1960…2005}` | 46 | |
| | Bảng theo năm: `/xem-tuoi-lam-nha/{n}`, `/tuoi-xong-dat/{n}`, `/xem-sao-han/{n}` (2026–27), `/lich-am/{2024…2029}`, `/phong-thuy/huong-xau-nam/{2025…2028}` | 16 | |
| | `/nam/{n}`, `/nam/{n}/sinh-con`, `/nam/{n}/cuoi-hoi` | 6 | |
| **(c) Kiến thức từ KB** | 19 trang mục lục cụm + 486 trang lá + 6 lá số mẫu | **511** | |
| | `/tu-vi/sao-o-cung/*` | 168 | |
| | `/kinh-dich/que/*` | 64 | |
| | `/tu-vi/tu-hoa/*` | 48 | |
| | `/hop-doi/cap-so/*` | 45 | |
| | `/than-so/so-kep/*` | 43 | |
| | `/phong-thuy/dau-hieu/*` | 23 | |
| | chính tinh 14 · cung 12 · ý nghĩa số 12 · nghề 12 · tình yêu 12 · thập thần 10 · nhật chủ 10 · năm cá nhân 9 · nợ nghiệp 4 | 95 | |
| | `/tu-vi/la-so-mau/*` | 6 | |
| **(d) Blog** | `/blog`, `/blog/{slug}` | 23 | |
| **(e) Pháp lý / tiện ích** | giới thiệu, liên hệ, 3 trang pháp lý, `/tac-gia`, `/tac-gia/duc-luan` | 7 | |
| **Tổng** | | **1.575** | |

Ngoài sitemap nhưng vẫn `index, follow` (xem mục 4): ngày tốt theo việc của 12 tháng đã qua (~72 URL), lịch âm ±10 năm ngoài 2024–2029 (~15 URL).

---

## 2. Đo mẫu trên site thật

### 2.1 Từng nhóm (trung vị của mẫu)

| Nhóm | Mẫu | Mã | TTFB (s) | HTML gzip | Chữ main | TLN ở từ thứ | Link nội bộ | Phần riêng | `.md` | data-nosnippet |
|---|---:|---|---:|---:|---:|---:|---:|---:|---|---:|
| Ngày tốt từng ngày | 12 | 200 | 0,83 | 30 KB | 1.150–1.370 | 15 | 39 | 0,23 | không | 0 |
| Ngày tốt theo việc | 12 | 200 | 0,64 | 21 KB | 358–582 | 27 | 16 | 0,43 (min 0,06) | không | 0 |
| Lịch tháng | 6 | 200 | 0,78 | 22 KB | 533–580 | 23 | 42 | 0,54 | không | 0 |
| Tử vi năm theo tuổi `/nam/*/tuoi-*` | 10 | 200 | 0,47 | 24 KB | 919–1.124 | **67** | 13 | **0,25** (min 0,14) | không | 0 |
| Làm nhà theo tuổi | 10 | 200 | 0,66 | 23 KB | 455–592 | 22 | 13 | **0,22** | không | có |
| Xông đất theo tuổi | 10 | 200 | 0,67 | 21 KB | 490–560 | 25 | 15 | **0,20** (min 0,08) | không | 0 |
| Lịch âm năm | 6 | 200 | 0,56 | 20 KB | **285–297** | 18 | 16 | 0,66 | không | 0 |
| Hướng hợp tuổi | 10 | 200 | 0,62 | 28 KB | 1.665–1.734 | 45 | 14 | **0,18** | có | 0 |
| Mệnh theo năm | 10 | 200 | 0,64 | 27 KB | 1.104–1.132 | **136** | 8,5 | 0,40 | có | 0 |
| Sao ở cung | 10 | 200 | 0,75 | 27 KB | 909–1.142 | **155** | 18 | 0,46 (min 0,27) | có | 1/10 |
| Tứ hoá ở cung | 10 | 200 | 0,70 | 31 KB | 1.553–1.613 | **152** | 25 | 0,52 | có | 1/10 |
| Quẻ | 10 | 200 | 0,73 | 26 KB | 846–1.000 | **124** | 8 | 0,76 | có | 0 |
| Cặp số | 10 | 200 | 0,47 | 28 KB | 1.138–1.370 | **139** | 11 | 0,59 | có | 0 |
| Số kép | 10 | 200 | 0,62 | 28 KB | 1.214–1.334 | **114** | 9 | 0,55 | có | 0 |

Toàn bộ 195 trang mẫu: 100 % trả 200, canonical tự trỏ đúng, `index, follow`, đúng 1 H1, tiêu đề ≤ 70 ký tự, mô tả ≤ 160.
TTFB p50 0,65 s · p90 0,93 s · max 1,39 s (`/xem-ngay-tot/thang-12-2026`, `/xem-ngay-tot/thang-11-2028`). Mọi trang render động (CSP-2).

### 2.2 Trang lẻ (công cụ, blog, pháp lý)

| URL | TTFB | Chữ main | TLN | JSON-LD chính | Ghi chú |
|---|---:|---:|---|---|---|
| `/` | 0,50 | 830 | không | WebSite, Organization, WebApplication | |
| `/than-so` | 0,54 | 555 | không | WebApplication, WebPage, FAQPage | form không có trong HTML máy chủ (0 `<input>`) |
| `/tu-vi` | 0,69 | 564 | không | như trên | H1 chỉ "Tử vi" |
| `/bat-tu` | 0,88 | 410 | không | như trên | H1 chỉ "Bát tự" |
| `/hom-nay` | 0,56 | **242** | không | như trên | dưới ngưỡng mỏng 300 từ của SEO-M |
| `/doi-lich-am-duong` | 1,05 | 320 | không | như trên | |
| `/xem-ngay-tot` | 0,80 | 1.602 | không | như trên | có 2 `<input>` máy chủ |
| `/nam/2027` | 0,50 | 1.120 | 25 | FAQPage, WebPage | |
| `/xem-sao-han/2027` | 0,45 | 2.028 | 22 | FAQPage, WebPage | 94 link nhưng chỉ 2 link sang trang khác (còn lại là `#neo`) |
| `/tu-vi/la-so-mau/tu-phu-dong-cung` | 1,21 | 4.895 | **không** | Article | 46 KB gzip, không `.md`, không TLN |
| `/blog/bat-tu-la-gi-cach-doc-tu-tru` | 0,87 | 3.463 | 73 | Article, FAQPage | |
| `/blog/cach-tinh-than-so-hoc-tu-ngay-sinh-va-ho-ten` | 0,83 | 2.287 | **không** | BlogPosting | bài NotFair chưa chuẩn hoá |
| `/dieu-khoan` | 0,47 | 2.216 | — | WebApplication | |
| `/tac-gia/duc-luan` | 0,47 | 501 | — | ProfilePage | |
| `/tu-dien` | 0,71 | 6.031 | — | DefinedTerm | 66 KB gzip, 0 link trong `<main>` |

### 2.3 Thứ tự thẻ đầu trang và bot

- Với **Googlebot** và **OAI-SearchBot**: `<title>`, mô tả, canonical nằm trong `<head>` (nhờ `htmlLimitedBots` trong
  `web/next.config.mjs:58`). Đạt.
- Với **trình duyệt thường**: 52/196 trang mẫu có `<title>` đầu tiên nằm ở **thân trang** (metadata stream, vị trí byte 150–300 nghìn),
  và trước nó là `<title>` của hình SVG (vd "Sao Cự Môn (巨門) ở cung Huynh Đệ — vòng 12 cung Tử vi"). Không hại Google/Bing.
  Rủi ro thấp: bot AI hay công cụ xem trước có UA không chứa chữ "bot/crawl/spider…" sẽ đọc nhầm tiêu đề hình. Ghi để biết.
- "Trả lời nhanh" **có trong HTML máy chủ** ở mọi trang có khối này (đo bằng curl, không chạy JS). Đạt.

---

## 3. Phát hiện chính

### F1 (cao) — Trang kiến thức: "Trả lời nhanh" bị đẩy xuống sau ~110–155 từ "nhiễu"
Thứ tự hiện tại ở `web/components/kien-thuc/TrangKienThuc.tsx:155–158`: H1 → `DongTacGia` (dòng ngày + byline + tiểu sử
chủ biên ~60 từ) → `MinhHoa` (chữ trong SVG, chú thích hình **lặp hai lần**, dải QR "hieuban.com /tu-vi/… Quét để mở bài này"
ở `web/components/minh-hoa/MinhHoa.tsx:50–66`) → mới tới "Trả lời nhanh". Ví dụ `/tu-vi/sao-o-cung/tu-vi-cung-menh`: TLN ở từ thứ 152.
Áp cho ~500 trang. Bộ trích đoạn của máy tìm kiếm và bot AI ưu tiên đoạn đầu `<main>`.
**Đề xuất**: đặt "Trả lời nhanh" ngay sau H1 (byline gọn một dòng, tiểu sử chủ biên dời xuống cuối như BLOG-8 đã làm cho blog),
gắn `data-nosnippet` cho dải QR + chú thích hình + tiểu sử. SEO-M mục (4) mới gắn `data-nosnippet` cho mục sức khoẻ, chưa cho các khối này.

### F2 (cao) — Bốn họ trang theo tuổi có phần riêng thấp (0,18–0,25)
`/phong-thuy/huong-hop-tuoi/*` 0,18 · `/tuoi-xong-dat/*/tuoi-*` 0,20 (min 0,08) · `/xem-tuoi-lam-nha/*/tuoi-*` 0,22 ·
`/nam/*/tuoi-*` 0,25 (min 0,14). Đây là mẫu 10 trang; trên cả họ 46–92 trang số còn thấp hơn. Ngưỡng tự `noindex` hiện là 20 %
(`engine/app/kb/do_rieng.py`) và chỉ áp cho trang KB, **không áp cho các họ trang tuổi/năm này**. SEO-M đề xuất nâng lên 30 %.
Nguyên nhân: khối giải thích chung (cách tính tuổi mụ, Kim lâu là gì, Hoang ốc đếm thế nào, lời "dân gian thường…") lặp nguyên văn.
Mỗi năm sinh có dữ kiện khác thật (tuổi mụ, Hoang ốc cung nào, tuổi hợp), nên **không** cần bỏ, chỉ cần rút khối chung thành một câu + link.

### F3 (cao) — Một năm sinh có 5–6 trang cạnh tranh nhau
Ví dụ tuổi 1985 năm 2027: `/nam/2027/tuoi-1985`, `/xem-tuoi-lam-nha/2027/tuoi-1985`, `/tuoi-xong-dat/2027/tuoi-1985`,
`/bat-tu/menh-theo-nam/sinh-nam-1985-menh-gi`, `/phong-thuy/huong-hop-tuoi/tuoi-1985`, dòng 1985 trong `/xem-sao-han/2027`.
Trùng chữ giữa các trang thấp (1–13 %), ý định tìm khác nhau → **không gộp**. Nhưng `/nam/{n}/tuoi-*` đã chứa cả Kim lâu, Hoang ốc,
Tam tai, sao hạn (trùng ý định với trang làm nhà và trang sao hạn). Cần định vai rõ: `/nam/…/tuoi-*` = "tổng quan năm", trang làm nhà =
câu trả lời có/không chi tiết. Liên kết chéo còn thiếu: trang mệnh theo năm (8,5 link) không link sang `/nam/{năm}/tuoi-{ns}`,
làm nhà, xông đất; `/xem-sao-han/2027` không link sang 46 trang `/nam/2027/tuoi-*`.

### F4 (trung bình) — Ngày tốt "mua xe" theo tháng: 9/25 trang có 0 ngày, 10/25 chỉ 1 ngày
Chạy `viec_thang` của engine cho 6 việc × 25 tháng trong sitemap: cưới hỏi, động thổ, xuất hành đủ ngày mọi tháng; khai trương, nhập trạch
2/25 tháng chỉ 2 ngày; **mua xe** 0 ngày ở 11/2026, 1/2027, 5/2027, 7–9/2027, 7–9/2028. Trang 0 ngày có "Trả lời nhanh" kiểu
"không có ngày nào đủ điều kiện — nên xem tháng kế tiếp" và chỉ ~358 chữ (vd `/xem-ngay-tot/mua-xe-thang-1-2027`).
**Đề xuất**: trang có 0 ngày → `noindex, follow` + bỏ khỏi sitemap (giữ trang cho người bấm vào), hoặc xem lại luật chọn ngày mua xe.

### F5 (trung bình) — Robots meta lệch sitemap ở hai chỗ
| Chỗ | Robots meta | Sitemap | Đề xuất |
|---|---|---|---|
| Ngày tốt theo việc của tháng đã qua, vd `/xem-ngay-tot/cuoi-hoi-thang-10-2026` | `index, follow` (cửa sổ `thangIndex` −12…+24, `web/lib/hoang-lich.ts:156–162`) | không có (sitemap chỉ từ tháng này, `web/app/sitemap.ts:48`) | `noindex` cho tháng đã qua của trang theo việc (chọn ngày cưới cho tháng đã qua không còn dùng được) — giữ trang tháng chung −12 nếu muốn |
| `/lich-am/2023`, `/lich-am/2035` | `index, follow` (±10 năm, `web/app/lich-am/[nam]/page.tsx:2,25`) | chỉ 2024–2029 (`sitemap.ts`) | đưa đủ ±10 năm vào sitemap **hoặc** thu cửa sổ index về −2…+3 cho khớp |

Ngoài cửa sổ, các họ khác đều đúng: `/xem-ngay-tot/2028-06-01`, `/2026-10-20`, `/thang-1-2020`, `/nam/2025`, `/nam/2028`,
`/nam/2027/tuoi-1950`, `/xem-tuoi-lam-nha/2028/tuoi-1990`, `/xem-sao-han/2025`, `/phong-thuy/huong-xau-nam/2024` → 200 + `noindex, follow`.
Ngoài dải dữ liệu → 404 + `noindex` (`sinh-nam-1940`, `huong-hop-tuoi/tuoi-1950`, `/lich-am/1900`, `/blog/trang/2`).
URL cũ → 308 một bước (`/kham-pha`, `/phong-thuy/tuoi-1990-nam`, `/kien-thuc/sao-cung/…`, `/la-so-mau`). Đạt.
Không thấy URL nào trong sitemap trả 3xx/404 trong 195 URL đã đo (chưa quét đủ 1.575 vì giới hạn số lượt gọi; bộ
`web/scripts/kiem-tra-seo.mjs` đã rà toàn sitemap ở SEO-M).

### F6 (trung bình) — Trang mỏng dưới 300 từ
`/lich-am/{năm}` 285–297 từ (6 trang, bảng 12 tháng là chính), `/hom-nay` 242 từ. Lịch âm có giá trị thật (Tết, nhuận) — thêm
một đoạn "năm này có gì đáng nhớ" (ngày Tết, Lập xuân, rằm tháng Giêng/Vu Lan/Trung thu, năm nhuận gần nhất) từ engine là đủ.
`/hom-nay` cần phần chung của ngày ở HTML máy chủ (âm lịch, can chi, giờ hoàng đạo, ngày phổ quát) + "Trả lời nhanh".

### F7 (trung bình) — Thiếu lastmod và bản `.md` ở mọi họ trang engine dựng
Sitemap: 0/1.015 URL nhóm (b) có `<lastmod>` (trừ mệnh theo năm), 0/46 `/phong-thuy/huong-hop-tuoi/*` (cả trong
`sitemap-cum-huong-hop-tuoi.xml`), 0/6 lá số mẫu, 0/19 công cụ. KB có lastmod đúng (SEO-L5).
`.md`: `/xem-ngay-tot/2026-11-05.md`, `/nam/2027/tuoi-1990.md` → 404 (SEO-L mục 6 còn mở). `llms.txt` (97 KB) chưa nhắc `/nam/{năm}`,
`/nam/{năm}/tuoi-{ns}`, `/thoi-gian-toi`; ví dụ ngày `xem-ngay-tot/2026-10-13` trong llms.txt nay đã `noindex`.

### F8 (thấp) — Khác
- Tiêu đề họ trang theo ngày/tháng/tuổi **cùng một khuôn** (1 mẫu cho cả họ, chỉ đổi số). Không trùng chính xác, đúng kiểu tìm
  "ngày X tốt hay xấu". Không cần sửa; riêng tiêu đề trang ngày nên gắn đặc điểm ngày (vd "Ngày 05/11/2026: hắc đạo, Tam Nương — giờ tốt…")
  để kết quả tìm kiếm khác nhau và dễ bấm hơn.
- `/than-so/y-nghia-so/so-11` ("Số 11 trong thần số học…") và `/than-so/so-kep/so-kep-11` ("Số kép 11 thần số Chaldea…") cùng nhắm
  "số 11 thần số học" (22, 33 tương tự). Trùng chữ chỉ 9 %, tiêu đề đã tách phái. Nên link qua lại hai chiều kèm một câu phân biệt.
- Form công cụ không có trong HTML máy chủ (0 `<input>` ở `/than-so`, `/tu-vi`, `/hom-nay`, `/`) — audit P1-7 cũ còn mở.
- `/tu-vi/la-so-mau/*`: 4.895 từ, 46 KB gzip, TTFB 1,2 s, không TLN, không `.md`, không lastmod.
- Trang quẻ chỉ 8 link nội bộ, không có lối "gieo quẻ cho câu hỏi của bạn" có tham số.
- H1 trang công cụ ngắn ("Tử vi", "Bát tự") — từ khoá đã ở `<title>`, không gấp.

---

## 4. Quyết định index và vai trò GEO theo nhóm

"Mồi" = đoạn ngắn để AI trích nguyên văn. "Sau cú bấm" = phần chỉ có khi người dùng nhập dữ liệu (không đưa vào trang công khai).

| Nhóm | Index? | Mồi GEO (đoạn nên được trích) | Sau cú bấm (giữ trong công cụ) |
|---|---|---|---|
| Công cụ / trang trụ (19) | Có | Câu 1 của hỏi đáp: "X là gì, cần nhập gì, nhận gì" (vd "Thần số học tính số chủ đạo từ ngày sinh; 24/10/1988 ra 33 hoặc 6 tuỳ cách cộng") | Mọi con số của chính người dùng, báo cáo 12 chương |
| Ngày tốt từng ngày (406) | Có, nhưng **xem lại cửa sổ +399 ngày** — trang xa hơn ~3–6 tháng gần như chỉ đổi số và trùng ý với trang "theo việc" + lịch tháng. Đề xuất: giữ −7…+400 trong index nếu GSC cho thấy có hiển thị ở ngày xa; nếu 90 ngày không có hiển thị thì thu về −7…+180 | Câu TLN hiện có (đã tốt): thứ, âm lịch, can chi, hoàng/hắc đạo, trực, nên/kiêng, xung tuổi, giờ hoàng đạo | Ngày có xung **tuổi của bạn** không, giờ hợp tuổi |
| Ngày tốt theo việc (150) | Có; **noindex khi 0 ngày** (F4) và **noindex tháng đã qua** (F5) | "Tháng 12/2026 có 4 ngày tốt cưới hỏi: … Đẹp nhất 17/12" | Lọc theo tuổi cô dâu/chú rể, Kim lâu (đã có ở `/xem-ngay-tot` chọn cả nhà) |
| Lịch tháng (37) | Có (−12…+24) | Số ngày hoàng đạo, ngày đẹp nhất tháng | — |
| `/nam/{n}/tuoi-*` (92) | Có, 2 năm âm; rút khối chung (F2) | "Năm 2027, tuổi Canh Ngọ 1990 (tuổi mụ 38): lục hợp với năm Mùi; sao nam Thổ Tú, nữ Vân Hán" | Năm của **chính bạn** theo lá số (`/thoi-gian-toi`) |
| Làm nhà / xông đất theo tuổi (184) | Có, 2 năm; rút khối chung (F2) | "Tuổi 1985 năm 2027 (tuổi mụ 43) không phạm Kim lâu, Hoang ốc, Tam tai" / "Gia chủ 1980 Tết 2027 nên nhờ tuổi 1988, 1989, 2002" | Tuổi theo ngày sinh âm thật (sinh trước Tết), hướng nhà |
| Bảng năm (16) + `/nam/{n}` (6) | Có | Một câu tóm năm (Tết ngày nào, nhuận không, Thái Tuế ở đâu) | — |
| Mệnh theo năm (78) | Có | "Sinh 1990: Canh Ngọ, Lộ Bàng Thổ; sinh trước 27/01/1990 thì Kỷ Tỵ, Đại Lâm Mộc" | Bát tự đầy đủ, dụng thần |
| Hướng hợp tuổi (46) | Có, nhưng phần riêng thấp nhất (0,18) → rút khối chung | "Tuổi 1995: nam mệnh Khôn, nữ mệnh Khảm; 4 hướng tốt …" | Hướng nhà đo thật, khảo sát nhà |
| KB sao/hoá/quẻ/số (486) | Có | TLN — **nhưng phải đưa lên đầu** (F1) | Sao/hoá đó nằm ở cung nào **trên lá số của bạn** |
| Lá số mẫu (6) | Có | Thêm TLN: "Lá số Tử Phủ đồng cung có nét chính …" | Lá số của bạn |
| Blog (23) | Có | TLN (bài CMS đã có; bài NotFair thiếu) | CTA công cụ |
| Pháp lý (7) | Có (giữ), không phải mục tiêu GEO | — | — |

---

## 5. Ngân sách thu thập

| | Số URL |
|---|---:|
| Index được trong sitemap | 1.575 |
| Index được ngoài sitemap (việc tháng đã qua, lịch âm ngoài 2024–29) | ~87 |
| **Tổng index được** | **~1.660** |
| Trang `noindex, follow` vẫn trả 200 và được link (ngày ngoài cửa sổ từ lịch tháng, năm ±1 từ trang tuổi, `/xem-tuoi-lam-nha/2026/tuoi-*`→ link sang năm cũ) | không giới hạn trên lý thuyết (mọi ngày, mọi năm đều mở được) |

Ước lượng giá trị riêng (từ phần riêng đo được, không phải số traffic):

| Mức | Nhóm | URL |
|---|---|---:|
| Riêng rõ (≥ 0,4) | quẻ, cặp số, số kép, tứ hoá, sao ở cung, mệnh theo năm, lịch tháng, lịch âm, KB nhỏ, blog | ~620 |
| Riêng vừa, chủ yếu là dữ kiện tính (0,2–0,4) | ngày tốt từng ngày, ngày theo việc | ~556 |
| Riêng thấp (< 0,25) | hướng hợp tuổi, xông đất, làm nhà, Tử vi năm theo tuổi | ~322 |
| Không có câu trả lời | mua xe 0 ngày | 9 |

Hơn một nửa URL index (≈ 880/1.660) là trang lập trình có phần riêng dưới 0,45 hoặc không có đáp án. Máy chủ trả trung vị 0,65 s mỗi
trang và không cache HTML, nên mỗi lượt Googlebot quét cụm ngày/tuổi đều tốn một lượt render đầy đủ.

---

## 6. Việc nên làm (xếp theo lợi ích)

1. **TLN lên ngay dưới H1 ở ~500 trang KB** + `data-nosnippet` cho dải QR, chú thích hình, tiểu sử chủ biên (F1). Sửa một khung chung.
2. **Rút khối giải thích chung** ở 4 họ trang theo tuổi thành một câu + link sang trang trụ năm; áp ngưỡng phần riêng cho cả họ (b) (F2).
3. **`noindex` + bỏ sitemap** cho trang ngày-theo-việc có 0 ngày và cho tháng đã qua (F4, F5).
4. Khớp cửa sổ lịch âm giữa robots meta và sitemap (F5).
5. Liên kết chéo theo năm sinh: mệnh theo năm ↔ `/nam/{năm}/tuoi-*` ↔ làm nhà ↔ xông đất; bảng sao hạn link từng tuổi (F3).
6. Thêm `<lastmod>` cho họ (b) (ngày dữ liệu đổi = ngày dựng trang theo năm/tháng) và bản `.md` cho ngày/tuổi/năm; bổ sung `/nam/*`,
   `/thoi-gian-toi` vào `llms.txt`, đổi ví dụ ngày trong llms.txt sang mẫu tương đối (F7).
7. Bổ sung chữ cho `/lich-am/{năm}` và `/hom-nay` (F6).
8. Theo dõi GSC 90 ngày cho trang ngày ở xa (+180…+400) rồi mới quyết thu cửa sổ.
