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
| **Q-I1** ✅ đã làm 05/11 | Thu cửa sổ index trang ngày −7 … +400 → **−7 … +90** ngay (thay mốc 01/02/2027 của Q4), sitemap việc-tháng tới **+6 tháng** (thay +24 của NAM-3) | Bớt ~410 URL nhóm C khỏi hàng đợi | Người tìm ngày cưới xa hơn 3 tháng vào trang tháng / trang việc thay vì trang ngày |
| **Q-I2** ✅ đã làm 05/11 | Bỏ Googlebot khỏi `htmlLimitedBots` (Googlebot chạy JS, Next mặc định cũng không xếp Googlebot vào nhóm này) | Googlebot nhận byte đầu sớm ~0,25 giây | Metadata tới trong luồng; phải chạy lại `kiem-tra-seo.mjs` + Kiểm tra URL trực tiếp để chắc thẻ title / canonical vẫn đúng |
| **Q-I3** | Cache HTML trang kiến thức / ngày / tuổi ở CDN (CSP theo hash / SRI hoặc PPR cho các trang này; trang công cụ giữ nonce) — việc SEO-K (4) để ngỏ "chờ số production"; số đã có ở mục 2 | Phản hồi ~1 giây → dưới 0,2 giây; bớt lượt chạy hàm Vercel | Việc lớn, đụng CSP-2; làm riêng một PR có e2e `csp.spec.ts` |

Không khuyên: xoá trang nhóm A/B khỏi sitemap, đặt `noindex` hàng loạt, hay bấm yêu cầu lập chỉ mục từng URL con.

## 5. Đối chiếu danh sách thật (file xuất Search Console 05/11) + Thống kê thu thập

Chủ dự án xuất đủ danh sách (`Table.csv`, 862 URL). Số liệu báo cáo dừng ở **23/10** (`Chart.csv`: 132 → 607 ngày 13/10 → 856
ngày 17/10 → 862 từ 20/10) — Search Console cập nhật báo cáo này chậm 1–2 tuần với site mới, nên các trang thêm sau 23/10
(dấu hiệu trong nhà, năm 2027 theo tuổi, cung phi, trang ngày) chưa có trong danh sách.

Chạy `phan-loai-gsc.mjs` trên danh sách:

| Nhóm | URL | Kết luận |
|---|---:|---|
| **Không còn trong sitemap** — để chưa index là ĐÚNG | **190** | 92 trang hướng hợp tuổi theo năm sinh cũ (`/phong-thuy/huong-hop-tuoi/tuoi-{năm}-{nam\|nu}`, 308 về trang cung phi đúng giới, AUD-Q2) · 92 trang tuổi năm **2026** (`/xem-tuoi-lam-nha/2026/…`, `/tuoi-xong-dat/2026/…`: `noindex` vì AUD-Q1 chỉ index năm 2027) · 5 bài blog slug cũ có chữ "đ" (308 về slug không dấu, BLOG-7) · `/xem-ngay-tot/thang-10-2025` (ngoài cửa sổ, `noindex`) |
| **A — phải index** (còn trong sitemap) | **563** | Gần như **toàn bộ kho kiến thức**: sao ở cung 168/168, 64/64 quẻ, tứ hoá 48/48, cặp số 45/45, số kép 43/43, mệnh theo năm 75/78, chính tinh, cung, ý nghĩa số, nghề, tình yêu, thập thần, nhật chủ, lá số mẫu… + 15 trang hub |
| **B — index, chờ được** | **109** | 92 trang tuổi làm nhà / xông đất 2027 + 17 trang lịch tháng |
| C (ngày, việc-tháng) | 0 | Không có trong danh sách (chưa vào báo cáo) |

**Đọc ra:** tới 23/10 Google gần như **chưa tải trang kiến thức nào**. Đây là nhóm có giá trị nhất, nên việc cần làm là kéo suất
thu thập về nhóm A — đúng hướng Q-I1 (bớt ~410 URL ngày / việc-tháng) + Q-I2 (trả trang nhanh hơn cho Googlebot) + yêu cầu lập
chỉ mục bằng tay các hub còn trong danh sách:

`/tu-vi/tu-hoa`, `/kinh-dich/que`, `/bat-tu/menh-theo-nam`, `/hop-doi/cap-so`, `/than-so/so-kep`, `/tu-vi/chinh-tinh`,
`/tu-vi/cung`, `/than-so/y-nghia-so`, `/than-so/tinh-yeu`, `/than-so/nghe-nghiep`, `/than-so/nam-ca-nhan`, `/than-so/no-nghiep`,
`/tu-vi/la-so-mau`, `/phong-thuy/huong-xau-nam` (`/tu-vi/sao-o-cung` không có trong danh sách — đã được tải).

**Thống kê thu thập (ảnh chủ dự án gửi, 07/10 → 04/11):**

- 2.260 lượt / ~4 tuần ≈ **50–100 lượt mỗi ngày**, 98 % trả 200, không lỗi máy chủ đáng kể, host `www` chỉ 8 lượt → máy chủ khoẻ,
  Google chỉ đang cho site mới suất nhỏ.
- Thời gian phản hồi trung bình **673 ms**, vọt lên ~1.350 ms quanh 24–26/10 (đúng đợt Google tải nhiều nhất) rồi số lượt giảm
  theo — Google hạ tốc độ khi máy chủ chậm. Q-I2 bớt ~0,1–0,25 giây mỗi trang; Q-I3 (cache HTML) mới đưa về dưới 200 ms.
- Chỉ **44 % lượt là HTML**; 42 % JavaScript + 9 % CSS ("Page resource load" 51 %). Mỗi lần deploy, tên tệp JS đổi nên Googlebot
  tải lại bộ JS để dựng trang. Không sửa gấp, nhưng gom deploy web (ít lần / ngày) cũng đỡ phần này; Q-I3 làm trang dựng sẵn
  còn giúp nhiều hơn.
- "Refresh" 58 % / "Discovery" 42 %: Google dành hơn nửa suất để tải lại trang đã biết (trang chủ, trang công cụ, trang ngày) —
  thêm lý do thu nhóm C.

Việc tiếp: 2–3 tuần sau khi deploy, xuất lại danh sách → `node web/scripts/phan-loai-gsc.mjs Table.csv`; nhóm A phải giảm rõ. Xuất
thêm danh sách "Đã thu thập – hiện chưa lập chỉ mục" (nếu có) — trạng thái đó mới là tín hiệu Google chê nội dung.
