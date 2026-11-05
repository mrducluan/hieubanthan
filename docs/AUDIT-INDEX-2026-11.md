# Audit lập chỉ mục — "Đã phát hiện – hiện chưa lập chỉ mục" (05/11/2026)

Chủ dự án gửi ảnh Search Console: **862 URL** ở trạng thái *Discovered – currently not indexed*, cột "Lần thu thập gần
nhất" = N/A (ví dụ `/bat-tu/menh-theo-nam`, `/bat-tu/menh-theo-nam/sinh-nam-1950-menh-gi`, `/tu-vi/sao-o-cung/pha-quan-cung-*`,
`/tu-vi/sao-o-cung/thai-am-cung-*`). Báo cáo này kiểm tra trên site thật hôm nay: các URL đó có lỗi không, trang nào nên
index, trang nào không cần.

Công cụ đi kèm: `web/scripts/phan-loai-gsc.mjs` — xuất danh sách 862 URL từ Search Console (nút Xuất → CSV) rồi chạy
`node scripts/phan-loai-gsc.mjs Table.csv` để biết từng URL thuộc nhóm nào dưới đây.

## 1. Kết luận

**Không có lỗi kỹ thuật chặn index.** "Đã phát hiện – chưa lập chỉ mục" nghĩa là Google *biết* URL (qua sitemap / link) nhưng
**chưa tải trang lần nào** — trang đang xếp hàng, không phải bị từ chối. Google chưa đọc nội dung nên cũng chưa thể chê nội
dung. Nút "Xác thực bản sửa lỗi" (bắt đầu 22/10) không giúp gì cho trạng thái này — không cần bấm lại.

Đã kiểm tra mẫu **162 URL, đủ mọi cụm** (đọc như Googlebot):

| Kiểm tra | Kết quả |
|---|---|
| Mã trạng thái | 200 ở mọi URL trong sitemap |
| robots meta / `X-Robots-Tag` | `index, follow` ở mọi URL trong sitemap; ngày ngoài cửa sổ (vd `/xem-ngay-tot/2028-06-01`) đúng là `noindex` |
| robots.txt | không chặn URL nào trong sitemap (`/hop-doi/cap-so` được `Allow` dài hơn `Disallow: /hop-doi/`) |
| canonical | tự trỏ về chính nó ở mọi URL |
| URL cũ (trước QH-URL 19/10, SEO-K, AUD-Q2) | 308 **một bước** về URL mới — để URL cũ chưa index là đúng |
| Nội dung | 1.000–1.600 chữ ở trang kiến thức, 450–1.000 chữ ở trang tuổi / ngày |

Sitemap đang khai **1.394 URL** (988 ở `sitemap.xml` + 406 ở `sitemap-ngay.xml`), nên 862 ≈ 62 %.

## 2. Vì sao Google chưa tải

Xếp theo mức ảnh hưởng:

1. **Site mới, nhiều URL cùng lúc.** Mở công khai 08/10 (4 tuần), sitemap ~1.400 URL, khoảng **80 % là trang dựng theo mẫu**
   (ngày, tháng, tuổi, sao × cung…). Với tên miền mới, ít link từ ngoài, Google cho mỗi ngày một "suất" tải nhỏ và tải
   thử một ít mỗi cụm trước, rồi mới tải tiếp. Biểu đồ tăng vọt 10/10 → 17/10 đúng lúc thêm các cụm lớn.
2. **Máy chủ phản hồi chậm với Googlebot.** Đo hôm nay từ Mỹ (nơi Googlebot chạy): thời gian tới byte đầu
   **0,8–1,35 giây**, tải xong 1,2–2 giây, trang nặng ~200 KB, `cache-control: no-store` (mọi trang dựng lại mỗi lượt vì nonce
   CSP-2), đi `iad1 → sin1` (máy chủ Singapore). Googlebot còn chậm hơn người xem ~0,25 giây vì `htmlLimitedBots` trong
   `next.config.mjs` khớp chữ "bot" → bắt Googlebot chờ đủ metadata mới nhận byte đầu. Google giảm tốc độ tải khi máy chủ
   chậm (trên ~1 giây là chậm).
3. **Đổi URL hàng loạt 3 lần** (QH-URL 19/10, gộp tuổi 21/10, cung phi 03/11): Google phải tải URL cũ, gặp 308, xếp URL mới
   vào hàng lại — tốn suất tải của URL mới.
4. **Sự cố Vercel 02/11** (402 cả site, mở lại cùng ngày): ngắn, nhưng lỗi máy chủ làm Google tải chậm lại vài ngày.

## 3. Trang nào nên index, trang nào không

Đo độ trùng: tỉ lệ cụm 5 chữ của trang A cũng có ở trang B **cùng cụm** (chỉ phần `<main>`). Hai trang khác hẳn loại chỉ trùng
~0,07, nên phần trùng ở dưới gần như là chữ khung của mẫu.

| Mức | Nhóm | URL | Trùng giữa 2 trang cùng cụm | Khuyến nghị |
|---|---|---:|---|---|
| **A — phải index** | Trang trụ, hub cụm, công cụ, pháp lý | 54 | — | Giữ. Yêu cầu lập chỉ mục bằng tay các hub (mục 4) |
| A | Sao ở cung (14 × 12) | 168 | 0,34–0,35 | Giữ — phần riêng tốt |
| A | Cụm kiến thức nhỏ (chính tinh, cung, ý nghĩa số, nghề, tình yêu, năm cá nhân, nợ nghiệp, thập thần, nhật chủ, dấu hiệu, lá số mẫu, cổ thư, hướng hợp tuổi theo cung, hướng xấu năm, sao hạn) | 141 | 0,26–0,67 | Giữ |
| A | Mệnh theo năm sinh | 78 | **0,55–0,62** (1950 ↔ 2010 cùng can chi) | Giữ (người tìm nhiều) — nên tăng phần riêng theo năm |
| A | 64 quẻ · tứ hoá × cung · cặp số · số kép | 200 | 0,26–0,41 | Giữ |
| A | Blog | 24 | — | Giữ |
| **B — index, chờ được** | Làm nhà / xông đất / Tử vi năm 2027 theo tuổi | 138 | **0,54–0,56**, trang ngắn | Giữ cho mùa Tết; Google sẽ lấy dần, ưu tiên trang năm (`/tuoi-xong-dat/2027`…) |
| B | Lịch tháng · lịch âm theo năm | 44 | 0,34–0,37 | Giữ |
| **C — nên thu hẹp** | Ngày tốt từng ngày (−7 … +400 ngày) | 406 | 0,51 | Đề xuất Q-I1: chỉ index −7 … +90 ngày (còn ~97) |
| C | Ngày tốt theo việc × tháng (6 việc, tới +24 tháng) | 141 | 0,55 | Đề xuất Q-I1: sitemap tới +6 tháng (còn ~40) |

Tổng: A 665 · B 182 · C 547. **Không có trang nào đang index mà đáng lẽ phải chặn**; trang cần chặn (URL cũ, ngày ngoài cửa sổ,
việc-tháng 0 ngày, trang cá nhân `/the/…`, `/api/…`) đã chặn đúng. Vấn đề là thứ tự: 547 URL nhóm C (gần 40 % sitemap) đang giành
suất tải với các trang nhóm A.

## 4. Việc nên làm

**Không cần code (anh làm, ~15 phút / ngày trong một tuần):**

- Search Console → **Cài đặt → Thống kê thu thập dữ liệu**: xem "Thời gian phản hồi trung bình" và số lượt lỗi máy chủ quanh
  02/11 — chụp gửi em. Nếu trung bình > 1.000 ms thì Q-I2/Q-I3 là việc chính.
- **Kiểm tra URL → Yêu cầu lập chỉ mục** cho các hub (hạn mức ~10 URL/ngày), theo thứ tự:
  `/tu-vi/sao-o-cung`, `/bat-tu/menh-theo-nam`, `/kinh-dich/que`, `/tu-vi/tu-hoa`, `/hop-doi/cap-so`, `/than-so/so-kep`,
  `/phong-thuy/dau-hieu`, `/tu-vi/co-thu/cot-tuy-phu`, `/nam/2027`, `/tuoi-xong-dat/2027`, `/xem-tuoi-lam-nha/2027`,
  `/xem-sao-han/2027`, `/lich-am/2027`, `/xem-ngay-tot`. Không yêu cầu từng trang con — Google đi theo link từ hub.
- Gửi `sitemap-cum.xml` (nếu chưa) để thấy tỉ lệ index **từng cụm** trong Sơ đồ trang web.
- **Link từ ngoài** về trang chủ và các hub (trang cá nhân / fanpage / bài trên diễn đàn có thật) — với tên miền mới, đây là thứ
  làm Google tăng suất tải nhanh nhất.
- Theo dõi: sau 3–4 tuần, nhóm A phải chuyển dần sang "Đã lập chỉ mục" hoặc "Đã thu thập – chưa lập chỉ mục". Trạng thái sau mới
  là tín hiệu Google chê nội dung (khi đó dùng `phan-loai-gsc.mjs` trên danh sách đó).

**Cần anh duyệt (đụng quyết định cũ):**

| Mã | Việc | Lợi | Đánh đổi |
|---|---|---|---|
| **Q-I1** | Thu cửa sổ index trang ngày −7 … +400 → **−7 … +90** ngay (thay mốc 01/02/2027 của Q4), sitemap việc-tháng tới **+6 tháng** (thay +24 của NAM-3) | Bớt ~410 URL nhóm C khỏi hàng đợi | Người tìm ngày cưới xa hơn 3 tháng vào trang tháng / trang việc thay vì trang ngày |
| **Q-I2** | Bỏ Googlebot khỏi `htmlLimitedBots` (Googlebot chạy JS, Next mặc định cũng không xếp Googlebot vào nhóm này) | Googlebot nhận byte đầu sớm ~0,25 giây | Metadata tới trong luồng; phải chạy lại `kiem-tra-seo.mjs` + Kiểm tra URL trực tiếp để chắc thẻ title / canonical vẫn đúng |
| **Q-I3** | Cache HTML trang kiến thức / ngày / tuổi ở CDN (CSP theo hash / SRI hoặc PPR cho các trang này; trang công cụ giữ nonce) — việc SEO-K (4) để ngỏ "chờ số production"; số đã có ở mục 2 | Phản hồi ~1 giây → dưới 0,2 giây; bớt lượt chạy hàm Vercel | Việc lớn, đụng CSP-2; làm riêng một PR có e2e `csp.spec.ts` |

Không khuyên: xoá trang nhóm A/B khỏi sitemap, đặt `noindex` hàng loạt, hay bấm yêu cầu lập chỉ mục từng URL con.
