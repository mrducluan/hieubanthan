# Kiểm toán SEO + GEO toàn site hieuban.com (AUD, 2026-11-03)

Chủ dự án giao: gọi agent SEO/GEO giỏi, audit toàn site, phân loại URL nào là trang engine dựng, URL nào cần SEO/GEO
(AI trích một phần nhỏ rồi người đọc bấm về web), kiểm xem có dính "nội dung AI tạo hàng loạt" không, lấy dữ liệu
engine bù nội dung, đề xuất cách làm tốt nhất. **Khâu của vòng tăng trưởng: THU HÚT** (Search + câu trả lời AI → công
cụ). Đo bằng: hiển thị/nhấp Search Console theo sitemap cụm, `landing_viewed` có nguồn AI, tỉ lệ trang được index.

Bốn agent làm độc lập trên site thật (~1.300 lượt tải, không sửa repo), em đối chiếu chéo và tự kiểm lại các phát
hiện quan trọng nhất. Báo cáo gốc từng agent (số đo, bảng, script tái lập được):

| Tệp | Nội dung |
|---|---|
| [`audit-2026-11/A-url-inventory.md`](audit-2026-11/A-url-inventory.md) | Kiểm kê 1.575 URL, phân loại, robots ↔ sitemap ↔ canonical, trang mỏng, ngân sách thu thập |
| [`audit-2026-11/B-noi-dung-hang-loat.md`](audit-2026-11/B-noi-dung-hang-loat.md) | Đo trùng lặp theo cụm (cụm 5–6 từ, Jaccard), giọng AI, tỉ lệ nháp / thẩm định, 15 URL tệ nhất |
| [`audit-2026-11/C-geo.md`](audit-2026-11/C-geo.md) | AI có lấy được câu trả lời không, mẫu "câu mồi trích dẫn" 8 loại trang, data-nosnippet, đo lượt từ AI |
| [`audit-2026-11/D-du-lieu-engine.md`](audit-2026-11/D-du-lieu-engine.md) | Phép tính engine chưa lên trang, khuôn trang "dữ kiện trước", kho dữ kiện có mã |

## 1. Kết luận ngắn

1. **Kỹ thuật nền tốt.** 195/195 trang mẫu trả 200, canonical tự trỏ, 1 H1, tiêu đề/mô tả đúng độ dài, nội dung
   nằm trong HTML máy chủ, bot AI (OAI-SearchBot, PerplexityBot) và Googlebot nhận giống người dùng. TTFB p50 0,65 s.
2. **Rủi ro "nội dung hàng loạt" có thật nhưng KHÔNG nằm ở trang kiến thức** — nằm ở **~322 trang theo tuổi** (xông
   đất, làm nhà, hướng hợp tuổi, năm theo tuổi): phần riêng chỉ 15–22 %, nhiều cặp trang gần trùng (hướng hợp tuổi:
   146/1.035 cặp Jaccard > 0,6 — vì cung phi lặp 9 năm, thực chất ~9 bài). Trang kiến thức (quẻ, cung, chính tinh, thập
   thần, nhật chủ, số, cặp số, tứ hoá, dấu hiệu…) **an toàn**: phần riêng 54–96 %, không cặp nào gần trùng.
3. **Giọng AI không phải vấn đề chính** (0–0,9 lần/1.000 từ). Có một lỗi thật: câu "điều quan trọng là" (nằm trong
   danh sách cấm `cum_cam`) hiện trên mọi trang `/nam/*/tuoi-*` — **đã sửa trong PR này**.
4. **GEO: câu trả lời bị chôn.** Ở ~600 trang kiến thức, "Trả lời nhanh" đứng sau ~110–150 chữ lặp (khung tác giả,
   chú thích hình, dải QR "Quét để mở bài này" là chữ HTML thật) → **đã sửa trong PR này**. Còn lại: câu đầu chưa tự
   đứng (không nêu tên đối tượng), lý do để bấm nằm cuối trang và giống hệt mọi trang.
5. **Uy tín (E-E-A-T) là điểm yếu lớn nhất còn lại**: 51/51 tệp KB ở trạng thái nháp, sổ thẩm định có **0** trang đã
   thẩm định (chỉ 12 trang ý nghĩa số chuyên gia tự viết). Máy không làm thay được phần này.

## 2. URL nào là gì — và nên đối xử thế nào

| Nhóm | Số URL | Ví dụ | Vai trò | Index | Mồi GEO (lộ ra để AI trích) | Giữ sau cú bấm |
|---|---|---|---|---|---|---|
| (a) Công cụ / trang trụ | 19 | `/tu-vi`, `/than-so`, `/xem-ngay-tot` | Trang trụ của silo, nơi chuyển đổi | Có | 1 câu "công cụ này cho bạn biết gì + cần nhập gì" ở đầu (hiện chưa có) | Kết quả cá nhân |
| (b) Trang ENGINE dựng theo ngày / năm / tuổi | 1.015 | `/xem-ngay-tot/2026-12-12`, `/nam/2027/tuoi-1990`, `/tuoi-xong-dat/2027/tuoi-1985`, `/bat-tu/menh-theo-nam/…` | Đón truy vấn mùa vụ dài đuôi | **Có, nhưng cửa sổ hẹp + chỉ khi có dữ kiện riêng** | Dữ kiện chung đúng-cho-mọi-người: "Tuổi 1985 năm 2027 (tuổi mụ 43) không phạm Kim lâu…", "Tháng 12/2026 có 4 ngày tốt cưới hỏi…" | Xung tuổi riêng, lá số riêng, sao ở cung nào trên lá của mình |
| (c) Trang KIẾN THỨC từ KB | 511 | `/tu-vi/sao-o-cung/…`, `/kinh-dich/que/que-1-can`, `/than-so/y-nghia-so/so-7` | Nền tri thức, được AI trích nhiều nhất | Có | Câu định nghĩa tự đứng: "Trong Tử vi Đẩu Số, sao Tử Vi ở cung Mệnh…" + 1 dữ kiện tính được | "Trên lá số của bạn sao này nằm ở đâu" |
| (d) Blog | 23 | `/blog/than-so-hoc-la-gi` | Bài trụ chủ đề rộng | Có (gộp hai bài trùng ý định "thần số học là gì") | Đoạn trả lời thẳng đầu bài | Công cụ |
| (e) Pháp lý / tiện ích | 7 | `/dieu-khoan` | Niềm tin | Có | — | — |

Ngoài sitemap còn ~87 URL đang `index` (trang ngày theo việc của tháng đã qua, `/lich-am` ngoài 2024–2029) → lệch
robots ↔ sitemap, xem P1.

## 3. Cách tiếp cận đề xuất: "Dữ kiện trước, ít trang hơn, câu mồi tự đứng"

So ba hướng: (A) viết thêm văn cho trang mỏng — **loại**: thêm văn AI đúng là thứ Google gọi là nội dung hàng loạt;
(B) noindex hàng loạt — an toàn nhưng mất truy vấn mùa Tết; (C) **chọn**: mỗi trang chỉ được index khi có **dữ kiện
riêng do engine tính** (con số, bảng, quan hệ kiểm lại được), phần giải thích chung dời lên trang mẹ một lần, câu đầu
"Trả lời nhanh" tự đứng và mang một dữ kiện mà AI muốn trả lời đúng thì phải trích kèm.

Ba nguyên tắc:

1. **Dữ kiện trước, văn sau.** Khuôn trang: Trả lời nhanh (dữ kiện) → bảng tính → sách xưa nói gì → giải thích ngắn
   → câu tự soi → mời dùng công cụ. Engine đã tính sẵn rất nhiều thứ chưa lên trang (báo cáo D, 15 mục): quẻ có bát
   cung, thế/ứng, nạp giáp 6 hào, hỗ/thác/tổng quái, 6 quẻ biến; sao ở cung biết cung Mệnh luôn có sao gì (86/154 cặp);
   mệnh theo năm có 12 trụ tháng kèm ngày giao tiết riêng từng năm; trang ngày có năm sinh xung với ngày đó.
2. **Mỗi trang phải có lý do tồn tại.** Đo phần riêng trên **chữ trang thật** cho cả trang engine (hiện `do_rieng`
   chỉ đo 13 họ trang KB). Dưới ngưỡng → gộp/noindex tự động, như lưới an toàn của SEO-K.
3. **Câu mồi trích dẫn.** Mẫu đã có sẵn và tốt: "Sinh trước Tết 27/01/1990 thì tính theo năm 1989" — dữ kiện thật, AI
   muốn đúng phải trích, tự gợi người đọc kiểm tra trường hợp của mình. Báo cáo C có chữ mẫu cho 8 loại trang.

## 4. Đã làm trong PR này (an toàn, có test)

| Mã | Việc | Test |
|---|---|---|
| AUD-1 | Trang kiến thức (~600): "Trả lời nhanh" lên ngay dưới tiêu đề, trước hình + dải QR; dải QR và khung tác giả mang `data-nosnippet` (vẫn hiện cho người đọc, schema tác giả không đổi) | `web/e2e/aud-geo.spec.ts` |
| AUD-11 | Bỏ "điều quan trọng là", "Hãy để" khỏi KB trang năm (`nam_tong_quan_kb.json`) | `test_kb_nam_khong_giong_ai` |
| AUD-12 | Câu "trùng chu kỳ" bỏ "~22 triệu người" (ước tính dân số, trái TS-V3c) — chỉ nói điều suy ra từ phép tính | `test_thanso_trung_chu_ky.py` |

Không migration, không dependency, không đổi phép tính → không tăng `ENGINE_VERSION`.

## 4b. Đợt 2 (chủ dự án duyệt Q1–Q6 + "làm các việc theo đề xuất", 2026-11-03)

| Mã | Đã làm | Số đo / test |
|---|---|---|
| Q1 | Trang theo tuổi (`/xem-tuoi-lam-nha/*/tuoi-*`, `/nam/*/tuoi-*`) index **một** năm = năm menu (`namTuoiSeo`, năm tới khi Tết sau còn ≤ 120 ngày); xông đất = Tết sắp tới. Sitemap + link "Cùng tuổi" theo đúng năm đó. Bàn 9 cung và mùng 1 Tết (giống hệt 46 trang) rút còn một câu + link trang năm | 3 × 92 → 3 × 46 URL index; e2e `aud-geo` |
| Q2 | 46 trang năm → **8 trang cung phi** `/phong-thuy/huong-hop-tuoi/cung-{kham-bac…}` + mục lục bảng 46 năm × nam/nữ (neo `#tuoi-{năm}`); mọi URL năm cũ 308 một bước về đúng dòng; .md, sitemap, sitemap cụm, llms.txt, mẫu cụm CMS (migration dữ liệu `aud_q2_cung_phi`); trang mệnh theo năm link sang trang cung nam + nữ | Phần riêng (dữ liệu engine) **0,13 → 0,38–0,39**; engine `test_phongthuy_cung_phi`, e2e `tuoi-huong` |
| Q3 | Engine `/v1/lich/viec-thang-dem` đếm ngày tốt (đúng `chon_ngay`); trang việc-tháng 0 ngày → noindex + ra khỏi sitemap; việc-tháng của tháng đã qua thôi index (khớp sitemap) | 9 trang "mua xe" bỏ index; `test_viec_thang` |
| Q4 | Cửa sổ trang ngày thành MỘT hằng `NGAY_SAU` — đổi 400 → 180 sau 90 ngày theo dõi (mốc 01/02/2027, `VIEC-CUA-ANH` 4u) | — |
| Q5 | Bỏ `data-nosnippet` câu "tập quán, không phải tiên đoán" ở `/nam`, sinh con, `/xem-sao-han/*` | e2e `aud-geo` |
| Q6 | Robots mở `Google-Extended` (lưu ý: Google không tách grounding với huấn luyện Gemini) | e2e `seo` |
| P0-1 | 168 trang "sao ở cung": mục "Khi X ở cung Y, cung Mệnh có sao gì" (Tử Vi toạ Mệnh: tam phương) — CALC `tuvi_vi_tri.sao_o_cung_cach_menh / tom_tat_cung_khac`, câu khung KB `su_kien_kb.json`; Mệnh cố định → câu + link (không bảng trùng) | khớp **60/60 lá** lasotuvi; 86/154 cặp có sao Mệnh cố định |
| P0-2 | 64 trang quẻ: khối "Cấu trúc quẻ" (bát cung, thế/ứng, nạp giáp, lục thân, hỗ/thác/tổng, quẻ biến từng hào + link) | `test_trang_que_cau_truc` (quẻ Khảm đối chiếu truyền thống) |
| P0-3 | Câu đầu "Trả lời nhanh" tự đứng (nêu đối tượng + bộ môn): quẻ, sao ở cung, dấu hiệu nhà, cặp số, nghề, tình yêu | `test_tra_loi_nhanh_tu_dung` |
| P0-4 | Khoá các con số gõ tay trong `bo_sung_*.json` bằng test đối chiếu calc (Đường đời 2 cách, thập thần 100 ô, tháng cá nhân, 18 câu "x% số ngày") | `test_bo_sung_so_lieu` |
| P0-5 | `landing_viewed` thêm mã nguồn vào `den_tu` (ai / tim_kiem / mxh / truc_tiep / noi_bo / khac) + `ai` (tên trợ lý) — chỉ mã, không URL | e2e `nguon-vao` |
| P0-6 | `llms.txt` 98 KB → **≤ 15 KB**: thư viện một dòng mỗi cụm, mục "Mùa Tết — năm {năm menu}", ví dụ ngày/tháng theo hôm nay | e2e `aud-geo` |
| P0-7 | `engine/scripts/do_rieng_cong_cu.py` — đo phần riêng họ trang engine (tuổi, năm, cung phi) | xem dưới |

**Số đo phần riêng (dữ liệu engine, năm 2027):** làm nhà 0,06 · xông đất 0,08 · năm theo tuổi 0,12 · cung phi 0,39.
Trang tuổi vẫn mỏng ở tầng dữ liệu (engine trả kèm dữ kiện chung của năm) — web đã rút khối chung, nhưng bước tiếp nên
là engine **tách hẳn dữ kiện chung của năm khỏi gói trang tuổi** (P1 mới, dưới). Thước đo cụm 6 từ phạt cả câu dữ kiện
viết theo khung: mục "cung Mệnh có sao gì" là dữ kiện mới thật nhưng làm điểm cụm 6 từ của họ "sao ở cung" giảm trung
bình 0,015 (thấp nhất vẫn 0,311 > ngưỡng 0,30) — nên làm chỉ số thứ hai `su_kien_rieng` (P2-2) trước khi thêm dữ kiện.

## 4c. Rà soát đợt 3 — review code độc lập + 3 agent đóng vai người dùng (2026-11-03)

Chạy trên bản build production cục bộ (code mới). Báo cáo gốc: `audit-2026-11/E-REVIEW.md` (review code), `E-persona-A.md`
(chị 46 tuổi, nhà cửa + Tết), `E-persona-B.md` (bạn 27 tuổi, thần số / Tử vi / quẻ), `E-persona-C.md` (máy trả lời AI đọc
HTML thô: **178/210 điểm**). Bộ rà SEO toàn sitemap (992 trang): **0 lỗi**, TTFB p50 37 ms.

Đã sửa ngay:
- **BM-1 lọt**: trang dấu hiệu nhà ghi "Nháp AI tổng hợp …" ở mục Nguồn → luật lọc `cong_khai` + test quét MỌI trang kiến thức.
- Link cũ `…/huong-hop-tuoi/tuoi-1981-nu|nam` 308 thẳng tới **trang cung của đúng người** (`…/cung-can-dong-bac#nu-1981`); bảng
  mục lục ghi **hướng tốt nhất** cạnh từng cung; trang cung có câu "nhà quay hướng xấu thì có phải đổi nhà không".
- Quẻ: **tên đầy đủ** trong tiêu đề + trả lời nhanh ("Thuần Khảm", "Thủy Lôi Truân"); khối Cấu trúc quẻ có chú giải Thế/Ứng,
  nạp giáp, lục thân, hỗ/thác/tổng quái; từ điển thêm Nạp giáp, Thác quái, Tổng quái, Bát cung.
- Tử vi: "Khi Tử Vi hãm" → "kém sáng" khi sao không có vị trí hãm; giải thích "toạ Mệnh", "vô chính diệu"; trang Hoá × cung
  bỏ câu "Vũ Khúc ở đây ứng với các năm Nhâm" (đọc như ai cũng có) → "Tuỳ sao nằm ở cung này trên lá số của bạn: …".
- llms.txt: xông đất theo **Tết sắp tới** (trước trỏ Tết vừa qua, noindex); URL trần bọc `<…>`, mẫu `{…}` bọc `` `…` ``.
- Cặp số gõ ngược (`7-va-2`) 308 về `2-va-7` (trước 404); trang năm có cả "Giao thừa đón Tết {năm}" lẫn đêm cuối năm;
  bảng sao hạn có neo `#tuoi-{năm}`; câu "có 0 ngày tốt" → "chưa có ngày nào đủ điều kiện".
- Lời mời cuối trang kiến thức **theo loại trang** ("Trên lá số của bạn, sao này nằm ở cung nào, sáng hay hãm…") + `data-nosnippet`
  (cả khối kêu gọi CMS, khối "năm của riêng bạn").
- Review code: link bảng năm có chặn năm < 2006 (404), route đếm ngày tốt không vượt 12/2099, đo nguồn AI nhận `utm_source=chatgpt`,
  không coi mail/docs.google.com là tìm kiếm.

Cần chủ dự án quyết (luật / nội dung đã có từ trước, em không tự đổi): xem mục 6b.

## 5. Lộ trình tiếp theo

### P0 — ĐÃ LÀM (mục 4b)

1. **Khối "Cấu trúc quẻ"** cho 64 trang quẻ (dữ kiện engine đã có, chỉ chưa xuất ra).
2. **Sao ở cung: "cung Mệnh / tam phương luôn có sao gì"** (`tuvi_vi_tri`, đối chứng 60 lá) — họ trang này đang sát ngưỡng phần riêng (thấp nhất 0,33).
3. **Khoá 250 con số gõ tay trong `bo_sung_*.json`** bằng test đối chiếu calc (hiện đúng cả 250 nhưng không có gì giữ khi calc đổi).
4. **Câu 1 "Trả lời nhanh" tự đứng** (nêu tên đối tượng + bộ môn) cho quẻ, dấu hiệu nhà, sao ở cung, cặp số — sửa ở engine, có test "câu đầu chứa tên đối tượng".
5. **Bộ đo phần riêng cho trang engine** (đo trên chữ trang thật, báo cáo — chưa tự noindex) để có số trước khi quyết P1.
6. **Đo lượt từ AI**: `landing_viewed` thêm mã nguồn `ai` (từ referrer chatgpt/perplexity/gemini/copilot/claude, không lưu URL đầy đủ).
7. **`llms.txt` gọn ≤ 15 KB** + thêm cụm mùa Tết (`/nam/*`, `/thoi-gian-toi`); bỏ ví dụ ngày đã noindex.

### P1 mới (sau đợt 2)

- ✅ **AUD-P1 (đã làm 2026-11-03)** — engine tách dữ kiện chung của năm khỏi gói trang tuổi (`luangiai/trang_tuoi.py`,
  GET công khai `?gon=1`; không có `gon` = bản đầy đủ cũ, nên web cũ trong lúc deploy lệch không vỡ; công cụ POST giữ
  nguyên): bàn 9 cung → tên + phương; mùng 1 Tết → ngày, can chi, hoàng đạo; bỏ câu cách tính / cách chọn (link bảng
  năm); sao hạn → tên + hạn (link `/xem-sao-han/{năm}#sao-…`); tứ hoá → tên sao; bỏ câu hỏi đáp lặp câu rào. Thêm dữ
  kiện RIÊNG của tuổi, tính bằng đúng hàm công cụ: **10 năm tới làm nhà**, **tuổi hợp 4 Tết tới**, **10 năm tới theo
  tuổi**. Phần riêng (dữ liệu engine, năm 2027, thấp nhất; thước đo nay đếm cả con số hiện trên trang):
  làm nhà **0,07 → 0,31** · xông đất **0,04 → 0,12** · Tử vi theo tuổi **0,11 → 0,19**. Hai họ sau chưa tới 0,30: phần
  còn lặp là lời giải thích từng mối hợp / xung và lý do từng tuổi hợp — người đọc cần, không xoá để chạy theo con số.
  Test `test_trang_tuoi.py` chặn lùi (0,30 / 0,11 / 0,18). Lựa chọn còn lại nếu muốn an toàn tuyệt đối với xông đất:
  chỉ index bảng năm `/tuoi-xong-dat/{năm}` (đã có đủ 46 gia chủ), trang từng gia chủ `noindex` — cần anh quyết.
- Thêm `do_rieng_cong_cu` vào lưới tự noindex (hiện chỉ báo cáo).

### P1 — ĐÃ QUYẾT (chủ dự án 2026-11-03: làm cả 6 — xem mục 4b)

| # | Đề xuất | Lý do (số đo) | Đụng quyết định |
|---|---|---|---|
| Q1 | Trang theo tuổi (xông đất, làm nhà, năm theo tuổi): **dời khối giải thích chung lên trang năm**, trang tuổi chỉ giữ dữ kiện riêng; **index chỉ năm âm sắp tới** (bỏ năm đang qua sau Tết) | Phần riêng 15–22 %; cùng tuổi khác năm Jaccard 0,47–0,57 | SEO-L (index năm hiện tại + năm sau) |
| Q2 | **Gộp hướng hợp tuổi 46 → ~9 trang theo cung phi** (năm sinh → 308 về trang cung phi, giữ dòng riêng năm sinh trong bảng) | 146/1.035 cặp gần trùng, Jaccard tối đa 0,71 | SEO-K (gộp nam+nữ thành 46 trang) |
| Q3 | Trang ngày tốt theo việc **có 0 ngày tốt → noindex + bỏ khỏi sitemap** (vd "mua xe": 9/25 tháng 0 ngày) | Trang không có câu trả lời | SEO-L (2) |
| Q4 | Rút cửa sổ index trang ngày +399 → +180 ngày **sau 90 ngày theo dõi Search Console** | 406 trang, 68 % chữ chung | SEO-K (6) |
| Q5 | Câu "tập quán, không phải tiên đoán" ở `/nam`, `/xem-sao-han` **bỏ data-nosnippet** để AI trích kèm | AI trích lời tục lệ mà thiếu câu rào thì sai tinh thần hơn | SEO-M (4) |
| Q6 | Mở `Google-Extended` (grounding trong Gemini; không ảnh hưởng AI Overviews) | Thêm một kênh AI trích dẫn | BM-2 |

### P2 — nền móng nội dung + dữ liệu

1. **Kho dữ kiện có mã** `engine/app/kb/su_kien.py`: mỗi con số một mã ổn định (vd `sk.que.29.ho_quai`), dùng chung
   cho trang, Trả lời nhanh, llms.txt, hỏi đáp; ảnh chụp giá trị `fixtures/golden/su_kien.json` + test → PR nào làm
   calc đổi số là thấy ngay. Chữ KB viết chỗ giữ `{sk:mã}` thay vì gõ số. **Không cần Postgres** (git vẫn là nguồn KB).
2. **Chỉ số thứ hai `su_kien_rieng`** (đếm dữ kiện riêng mỗi trang) — chỉ số cụm 6 từ hiện phạt câu dữ kiện viết
   theo khung (thêm câu "Mệnh luôn có…" làm điểm giảm 0,328 → 0,318 dù trang hay hơn).
3. **`bo_sung_menh_nam.json`** (78 trang, phần riêng 34 %, chưa có bổ sung).
4. **Gắn `source_id` từng mục** cho `tuvi_kb`, `battu_kb` (hiện chỉ nguồn chung cả tệp, vẫn `can_doi_chieu`).
5. **`citation` thành CreativeWork có URL** (ctext) thay chuỗi chữ; Person Đức Luân thêm `sameAs` (chờ link thật — 4i).
6. Trang công cụ trụ có câu trả lời ở đầu; lá số mẫu có Trả lời nhanh + `.md`; trang ngày/tuổi/năm có dòng cập nhật + biên soạn.
7. Gộp hai bài blog trùng ý định "thần số học là gì" (giữ bài mạnh hơn, 308 bài kia).

## 6. Việc của anh (máy không làm thay được)

- **Thẩm định thật theo Search Console** (`scripts/tham_dinh.py hang-doi --gsc Trang.csv`): mỗi trang anh đọc + duyệt
  là một trang E-E-A-T thật. Đề xuất 10 trang/tuần, bắt đầu từ cụm có hiển thị cao. Đây là đòn bẩy uy tín lớn nhất.
- **`sameAs`** cho tổ chức + anh (mục 4i `VIEC-CUA-ANH.md`) — AI cần thấy nơi khác trên web nhắc tới site / anh.
- **Kênh GA4 "AI assistants"** (mục D `DE-XUAT-CHAT-LUONG-NOI-DUNG.md`) + mỗi tháng tự hỏi 20 câu cố định trên ChatGPT/Perplexity/Gemini xem site có được trích không.
- Quyết Q1–Q6 ở mục 5.

## 6b. Câu hỏi cho anh (sau rà soát đợt 3)

1. **Trang ngày vs trang "ngày tốt theo việc" nói ngược nhau**: `/xem-ngay-tot/2027-01-01` ghi ngày hắc đạo nhưng "hợp cưới
   hỏi" (theo mục Nên của sách lịch), còn `/xem-ngay-tot/cuoi-hoi-thang-1-2027` không liệt kê ngày đó (luật chọn ngày loại vì
   kiêng Nạp thái / Kết ước). Đề xuất: câu đầu trang ngày dùng đúng luật chọn ngày ("sách lịch ghi nên cưới hỏi, nhưng ngày
   kiêng Nạp thái nên không xếp vào ngày tốt cưới hỏi"), và trang tháng ghi hoàng đạo / hắc đạo cạnh từng ngày.
2. **Làm nhà "Thuận" nhưng là năm tuổi** (vd 1981 năm 2029): luật làm nhà chỉ xét Kim lâu, Hoang ốc, Tam tai. Có xét thêm năm
   tuổi / xung tuổi không (nhiều nhà vẫn kiêng)? Đề xuất: không đổi mức, thêm dòng "năm tuổi — nhiều gia đình vẫn kiêng".
3. **Trang "Sinh năm X mệnh gì" gợi hướng theo ngũ hành** (Mộc → Đông) có thể ngược Bát trạch của chính người đó (nữ 1981 Cấn:
   Đông là Lục Sát). Đề xuất: bỏ gợi hướng theo ngũ hành ở trang mệnh, chỉ link sang trang cung phi nam / nữ.
4. **Số 7 hai trang nói khác** (ý nghĩa số xếp 7 cùng nhóm 1, 5; trang tình yêu nói hợp 4, 7, 9) — trang ý nghĩa số do anh
   biên soạn, em không sửa; anh muốn thống nhất theo bảng nào?
5. **Công cụ "Nhà của bạn"** (nhà hướng Đông Nam): ghi "cùng nhóm hướng Tây — bố trí dễ" và gợi đặt cửa Tây Nam — cần em điều
   tra luật Phong thuỷ đời sống không? (ngoài phạm vi SEO, có từ trước.)
6. **CMS**: mẫu cụm "Hướng hợp tuổi" cũ có thể dùng biến `{nam}` — trang cung không có biến này nên sẽ hiện nguyên `{nam}`. Anh
   (hoặc em khi có quyền CMS) kiểm mẫu cụm sau deploy.

## 7. Ghi chú về độ tin

- Số đo phần riêng của agent B đo trên chữ trang thật (bỏ menu/chân trang), nên thấp hơn số `do_rieng` của engine
  (chỉ đo chữ engine trả). Hai cách đo cùng chiều kết luận.
- Nguồn bên ngoài về llms.txt / GA4 phần lớn từ bên bán dịch vụ; thông tin Google-Extended lấy từ bài tóm tắt bên thứ
  ba — cần đối chiếu trang gốc của Google trước khi quyết Q6.
- Kiểm tra đợt 2 (2026-11-03): engine 6.736 test xanh; CMS 85 test unit + tsc xanh; migration dữ liệu
  `aud_q2_cung_phi` chạy thử up → up lần 2 → down trên Postgres 16 tạm (đúng, idempotent); e2e web đầy đủ 609/614 ở
  lượt đầu → sửa 1 test do PR (`seo.spec` còn đòi llms.txt liệt kê quẻ 64). 2 test cảm biến (lắc điện thoại
  `kinh-dich.spec:309`, la bàn giả lập `phong-thuy.spec:107`) hỏng y hệt trên code gốc trước PR (môi trường chạy thử dùng
  bản trình duyệt khác bản dự án ghim) — không thuộc phạm vi audit; `ux-v3b.spec:49` Bát tự chập chờn (lần đầu khi
  máy chủ dev còn biên dịch, chạy lại 2/2 xanh).
