# Kế hoạch backlink báo chí + mở rộng kho tri thức + GEO — hieuban.com

> Lập 29/10/2026. Đây là bản tổng hợp có chọn lọc từ 3 agent: PR & Communications Manager, SEO Specialist và AI Citation
> Strategist. Chi tiết đầy đủ (danh sách báo, nguồn URL, 22 ý tưởng, bộ 40 câu hỏi) nằm ở `docs/seo-ke-hoach/PHU-LUC-A/B/C`.
> **Khâu của vòng tăng trưởng:** THU HÚT (thứ hạng, lượt trích AI, lượt tìm tên thương hiệu) → MỜI (nhờ thẻ chia sẻ có QR).
> **Hạn chót theo mùa:** Tết Đinh Mùi rơi vào 06/02/2027. Báo đời sống bắt đầu đăng bài xông đất / làm nhà từ 3–4 tháng
> trước Tết, nên bộ tư liệu cho báo phải xong **trước 15/11** (đợt 1) và **trước 15/12** (đợt 2).

---

## 0. Ba nguyên tắc em giữ cứng (vì sao kế hoạch trông "chậm" hơn các gói backlink ngoài thị trường)

1. **Link mua thì không truyền điểm.** Theo chính sách của Google, bài PR trả tiền mà có link truyền điểm xếp hạng là link spam,
   nên phải gắn `rel="sponsored"` hoặc `nofollow`. Vì vậy chia ba luồng:
   - **(a) Bài báo tự viết nhờ dữ liệu.** Đây là luồng duy nhất ra link thật (dofollow), chiếm **≥ 40 % công sức**.
   - **(b) Bài PR trả tiền.** Không mua để có link; mua để có tên thương hiệu, để chuyên gia được báo nhắc tới (E-E-A-T) và
     để có lượt vào từ bài báo.
   - **(c) Không làm:** hệ thống web vệ tinh (PBN), "gói 100 báo vệ tinh", mua link dofollow, đổi link.
2. **Pháp lý Việt Nam.**
   - Luật Quảng cáo sửa đổi (hiệu lực 01/01/2026): bài trả tiền phải có dấu hiệu nhận diện là quảng cáo; cấm so sánh trực
     tiếp với sản phẩm cùng loại.
   - Đã có tiền lệ báo bị phạt vì nội dung mê tín dị đoan (Người Đưa Tin, 2015).
   - Vì vậy mọi góc bài đi theo **văn hoá – phong tục – dữ liệu – công nghệ – tâm lý tự soi**. Không phán hung, không vật
     phẩm giải hạn, không tên bệnh.
   - Mẫu chính: bài xông đất của Tuổi Trẻ dẫn lời PGS văn hoá học. Mình cung cấp dữ kiện, chuyên gia văn hoá độc lập bình luận.
3. **Bí mật kinh doanh (BM-1).** Bài báo không nêu thư viện mã nguồn hay nhà cung cấp hạ tầng. Chỉ nói "thuật toán âm
   lịch Hồ Ngọc Đức" (công khai), "múi giờ Việt Nam UTC+7".

---

## 1. P0 — làm trong tuần này, trước khi gửi bất kỳ bài nào

| # | Việc | Ai | Vì sao |
|---|---|---|---|
| 1 | **Sửa xung đột tên thương hiệu.** Tìm "Hiểu Bản Thân" ra **hieubanthan.com**, một site khác chuyên bài test MBTI/IQ. Cách sửa: dùng tên chuẩn **"Hiểu Bản Thân (hieuban.com)"** ở mọi nơi bên ngoài; Organization thêm `alternateName` (hiện chưa có — em đã kiểm `web/lib/seo.ts`); `/gioi-thieu` thêm một câu định nghĩa 40–50 chữ | Em (code) + anh (dùng đúng tên trong bài báo) | Nếu không sửa, lượt nhắc tên trên báo có thể bị AI và Google tính cho site kia |
| 2 | **Hồ sơ thật của Đức Luân**: LinkedIn, Facebook công khai, YouTube → điền vào env `CHUYEN_GIA_SAME_AS_DUC_LUAN`, `MXH_*` | Anh | Nhà báo và AI kiểm "chuyên gia này có thật không" trước khi trích |
| 3 | **Đo mốc ban đầu** (trước 05/11): GSC page × query 3 tháng, số tên miền đang dẫn link, lượt tìm tên thương hiệu, 40 câu hỏi × 4 nền tảng AI (danh sách ở Phụ lục C mục 4.1) | Anh xuất GSC; em chạy bộ câu hỏi | Không có mốc thì không biết tiền chi cho báo có hiệu quả không |
| 4 | **Xuất bản bài "Gieo quẻ 3 đồng xu"** (đã có nháp BLOG-6 trong CMS) | Anh duyệt | Agent GEO thấy truy vấn này trên SERP chỉ có quảng cáo app và trang rác — khoảng trống dễ lấy nhất |
| 5 | **Trang tư liệu báo chí** `/bao-chi`: giới thiệu, ảnh chuyên gia, bộ dữ kiện Tết 2027, ảnh có QR, email liên hệ | Em dựng, anh duyệt | Ở Việt Nam không có nền tảng kiểu HARO (nhà báo tìm chuyên gia), nên phải có nơi để nhà báo tự lấy dữ kiện |

---

## 2. Tài sản để báo và AI tự dẫn về (em chọn 5 trong 7 agent đề xuất)

Đây là những thứ chỉ hieuban.com có, vì engine tính tất định.

| Tài sản | Trang | Hạn | Ghi chú |
|---|---|---|---|
| **"Tết Đinh Mùi 2027 bằng con số"**: Lập xuân 04/02 so với Tết 06/02 (ai sinh giữa hai mốc đổi con giáp), năm cá nhân phổ quát 2027, Ngũ Hoàng / Tam Sát, Kim lâu / Hoang ốc / Tam tai, số ngày tốt tháng Giêng | `/bao-cao/tet-2027` + CSV + ảnh có QR | 15/12 | Mọi con số lấy từ engine, không chép tay |
| **"Lịch âm Việt khác lịch Trung Quốc"**: những năm Tết lệch nhau, miền Nam 1960–1975 | `/lich-am/viet-khac-trung` | 15/11 | Dữ liệu độc quyền (LS60 tìm ra 1.376 ngày lệch giai đoạn 1930–2025 — xuất lại số chính xác trước khi công bố) |
| **"Hai cách tính, hai con số đời"**: 24/10/1988 ra 33 hoặc 6, kèm bảng các ngày sinh lệch | `/than-so` + bảng | 14/11 | Phải **xuất bảng ngày lệch** (hiện chưa có); ghi rõ "phân bố trên lịch, không phải thống kê dân số" |
| **Bảng tra in được (PDF A4)**: lịch âm 2027, bảng tuổi làm nhà / xông đất 2027, mệnh nạp âm 1940–2027 | QR về trang tương ứng | 01/12 | Báo, blog, nhóm Facebook hay đăng lại ảnh, mỗi lần đăng lại là thêm một lượt nhắc tên |
| **Bộ dữ liệu mở lịch âm 1900–2100** (CC BY: ai dùng phải ghi nguồn, link về hieuban.com) | `/du-lieu/lich-am` + GitHub + Zenodo | Q1/2027 | **Cần anh duyệt giấy phép** |

Để sau: widget nhúng (cần nới CSP riêng cho đường dẫn nhúng — rủi ro bảo mật, làm khi đã có traffic), bảng so sánh các phái (gộp vào mục 3 dạng nội dung).

---

## 3. Kho tri thức — cụm mới (em chọn 10 trong 18 ý của agent SEO, xếp theo mùa)

SERP thật: đầu trang toàn blog bán lẻ (fptshop, dienmayxanh, viettelstore…), có trang còn **sai dữ kiện** (ghi năm 2027 mệnh "Thiên Thượng Hoả", trong khi đúng là Thiên Hà Thuỷ). Đối thủ thắng nhờ domain mạnh, không nhờ độ sâu. Lợi thế của mình là dữ kiện đúng và câu "Nhầm lẫn hay gặp" sửa chỗ họ sai. Mọi cụm theo khuôn SEO-M (câu đầu trả lời thẳng, một bảng thật, phần riêng ≥ 30 %, viết golden test trước).

**Đợt 1 — 01 → 30/11/2026 (trước mùa Tết)**

| Cụm | URL | Số trang | Lưu ý |
|---|---|---|---|
| Năm 2027 Đinh Mùi với 12 con giáp | `/tuoi/2027/{con-giap}` | 12 + trụ | Tam hợp / xung / năm tuổi, link chéo xông đất, làm nhà |
| Hạn năm 2027 theo tuổi (sao chiếu mệnh Cửu Diệu + 8 hạn) | `/han-nam/2027/tuoi-{năm}` (gộp nam + nữ) | ~76 | **Nhạy cảm nhất**: chỉ ghi "theo tục lệ dân gian", không giải hạn, không lời doạ về La Hầu / Kế Đô. **Cần anh duyệt** |
| 30 nạp âm + 5 hành (trang thực thể) | `/bat-tu/nap-am/{slug}` | 35 | Định nghĩa một câu, sửa lỗi "Thiên Thượng Hoả" |
| 24 tiết khí | `/lich-am/tiet-khi/{slug}` | 24 | Ngày giờ giao tiết theo giờ Việt Nam nhiều năm — trang luôn có người tìm |
| Giờ hoàng đạo | `/xem-ngay-tot/gio-hoang-dao` | 1 + 6 | Làm nhanh, engine đã có |

**Đợt 2 — 12/2026 → 02/2027 (mùa Tết)**

| Cụm | URL | Số trang | Lưu ý |
|---|---|---|---|
| Tuổi cưới 2027 theo năm sinh cô dâu | `/xem-tuoi-cuoi/2027/tuoi-{năm}` | ~46 | Kim lâu cưới, Tam tai — chỉ tham khảo, không ghi "không nên lấy" |
| Báo cáo Tết 2027 (mục 2) + bài blog Tết | — | — | Bài nào cũng đi kèm ảnh tóm tắt có QR |

**Đợt 3 — 03 → 06/2027 (khoảng trống chiều sâu: các truy vấn này gần như không có trang tiếng Việt chuyên đề)**

| Cụm | URL | Số trang |
|---|---|---|
| 62 cách cục Tử vi | `/tu-vi/cach-cuc/{slug}` | 62 |
| Phụ tinh Tử vi (~30 sao) | `/tu-vi/phu-tinh/{slug}` | ~30 |
| Chính tinh toạ Mệnh theo chi ("Thiên Cơ Thái Âm tại Thân") | `/tu-vi/menh/{sao}-tai-{chi}` | ~70 |
| Ba lớp số tên: Linh hồn / Nhân cách / Sứ mệnh | `/than-so/{linh-hon,nhan-cach,su-menh}/{số}` | 36 |

Đợt sau nữa, khi có số GSC: 384 hào động, nhật trụ 60 hoa giáp, thần sát Bát tự, 28 tú + 12 trực, Huyền Không 24 sơn, số ngày sinh 1–31.

**Không làm** (lý do chi tiết ở Phụ lục B):
- tử vi trọn đời theo năm sinh (đi kèm lời phán thọ yểu — cấm);
- tuổi hợp làm ăn A × B (3.600 trang doorway);
- tách URL quẻ × chủ đề (dùng neo trong trang quẻ thay thế);
- 366 trang ngày sinh;
- lá số người nổi tiếng (rủi ro dữ liệu cá nhân, phỉ báng).

**Trước khi chốt tiêu đề phải lấy GSC.** Ví dụ "lịch âm tháng 11 2026" có thể đang bị `/xem-ngay-tot/thang-11-2026` và `/lich-am/2026` tranh nhau → giao cho một trang.

---

## 4. Báo chí — danh sách báo, 14 bài pitch, lịch

Danh sách báo đầy đủ 3 hạng ở Phụ lục A mục 1:
- **Hạng 1:** VnExpress, Tuổi Trẻ, Thanh Niên, Znews, Vietnamnet…
- **Hạng 2 (đời sống):** 24h, Afamily, Eva, Kenh14, VTC…
- **Hạng 3 (ngách):** CafeF Gia chủ, CafeLand, Batdongsan, Báo Đầu tư, Brands Vietnam, báo địa phương.

**Giá:** chỉ một bảng giá công khai đã xác minh — Batdongsan.com.vn, 5,5 triệu/bài ở tab "Tư vấn & phong thuỷ". Giá các báo khác phải hỏi lại trước khi chi.

**Lịch pitch rút gọn** (14 bài, chi tiết ở Phụ lục A mục 2):

| Thời gian | Bài | Trang đích | Luồng |
|---|---|---|---|
| 03–14/11 | "Cùng ngày sinh 24/10/1988, vì sao hai ứng dụng ra hai 'con số đời' khác nhau?" | /than-so | Báo tự viết — mục Số hoá, Nhịp sống số |
| 10–21/11 | Lịch âm 2027: Tết 6/2, tháng đủ/thiếu, vì sao lịch Việt có năm khác lịch Trung | /lich-am/2027 | Báo tự viết + PR hạng 2 |
| 24/11–05/12 | Tuổi nào làm nhà 2027 — bảng 46 tuổi và vì sao các bài báo liệt kê khác nhau | /xem-tuoi-lam-nha/2027 | CafeF Gia chủ + Batdongsan |
| 01–12/12 | 2027 "kiêng" động thổ phía nào — đọc đúng Ngũ Hoàng, Tam Sát mà không hoảng | /phong-thuy/huong-xau-nam/2027 | Ngách bất động sản |
| 15/12–05/01 | Xông đất Tết Đinh Mùi — bảng 46 tuổi + chuyên gia văn hoá độc lập | /tuoi-xong-dat/2027 | Tuổi Trẻ, Vietnamnet, báo địa phương |
| 22/12–10/01 | Startup Việt số hoá hoàng lịch: tách phép tính khỏi lời diễn giải để không phán bừa | /huyen-hoc | Báo khởi nghiệp / marketing |
| 01–10/02 | Đầu năm gieo một quẻ: Kinh Dịch như câu hỏi tự soi, không phải lời phán | /kinh-dich | Znews, Kenh14 |

**Tỉ lệ anchor text:**
- tên thương hiệu 45–55 %;
- URL trần 20–25 %;
- chữ chung chung ("xem tại đây") ~20 %;
- **từ khoá chính xác ≤ 3 %**.

Ngoài báo:
- Spiderum: bài khách mời đứng tên Đức Luân.
- Podcast văn hoá / khởi nghiệp.
- Webtretho (cưới hỏi, nhà cửa), Voz: tham gia thật, khai rõ mình là người làm hieuban.
- YouTube: tận dụng `video-ngan/` đang dựng, mô tả video có định nghĩa + link trang trụ.
- Mời blog bán lẻ (fptshop Sforum, dienmayxanh) dùng bảng / ảnh có ghi nguồn — họ chính là nguồn AI đang trích.

**Wikipedia:** chưa đủ độ nổi bật → **không** tạo bài, không chèn link (sẽ bị gỡ). Wikidata làm sau khi có 1–2 bài báo độc lập nhắc tên.

---

## 5. Ngân sách đề xuất

Ba mức chi tiết ở Phụ lục A mục 5:
- Tiết kiệm: ~30 / 45 triệu mỗi quý (Q4/2026 / Q1/2027).
- Chuẩn: ~105 / 175 triệu.
- Mạnh: ~265 / 355 triệu.

**Em khuyên:** Q4/2026 chạy **mức Tiết kiệm** (~30 triệu: bộ tư liệu báo chí + 2 bài ngách bất động sản + luật sư duyệt mẫu
nhãn quảng cáo). Nếu sau 6 tuần bài báo tự viết có ≥ 3 tên miền dẫn link mới, Q1/2027 nâng lên **Chuẩn**. Chưa có kết
quả thì sửa góc pitch trước, không tăng tiền mua bài.

---

## 6. KPI (đo kết quả thật, không đếm số bài)

| KPI | Công cụ | Mục tiêu 31/03/2027 |
|---|---|---|
| Tên miền dẫn link mới (không tính link sponsored) | Ahrefs / GSC Links | ≥ 15 |
| Lượt tìm tên thương hiệu ("hieuban", "hiểu bản thân hieuban") | GSC | ×3 so với mốc ban đầu |
| Top 10 cho 5 cụm Tết (xông đất, làm nhà, lịch âm, ngày tốt, hướng xấu 2027) | GSC | ≥ 3/5 cụm |
| Tỉ lệ được trích trong bộ 40 câu hỏi × 4 nền tảng AI | Chạy tay hằng tháng | ≥ 20 % câu có hieuban |
| Lượt vào từ bài báo / AI (`?tu=`, UTM, referrer chatgpt / perplexity) | PostHog, GA4 | Theo dõi xu hướng |

Ahrefs có trong plugin nhưng chưa kết nối. Muốn em đo mốc số tên miền dẫn link thì anh cần cấp quyền qua `/mcp` ở terminal `claude`.

---

## 7. Quyết định chờ anh

1. **Mức ngân sách** Q4/2026 (em khuyên Tiết kiệm, ~30 triệu).
2. **Cụm "Hạn năm 2027 / sao chiếu mệnh"**: làm hay không. Từ khoá rất lớn nhưng nhạy cảm (mê tín). Em đề xuất làm, lời chỉ là tục lệ, không giải hạn.
3. **Mở `Google-Extended`** theo đường dẫn, thử 90 ngày, chỉ cho `/lich-am`, `/tuoi-xong-dat`, `/xem-tuoi-lam-nha`, `/xem-ngay-tot`, `/doi-lich-am-duong`, `/gioi-thieu`.
   - Lợi: Gemini app trích được dữ kiện lịch.
   - Hại: lệch BM-2.
   - Chặn token này **không** ảnh hưởng AI Overviews / AI Mode.
   - Em nghiêng về mở thử vì các trang này là dữ kiện tính được, không phải văn biên soạn.
4. **Bộ dữ liệu mở lịch âm** (giấy phép CC BY).
5. **Tên thương hiệu dùng ngoài site**: "Hiểu Bản Thân (hieuban.com)". Có cân nhắc đổi hẳn sang "HieuBan" để tránh trùng với hieubanthan.com không?

## 8. Tiến độ (cập nhật 29/10/2026 — anh duyệt "P0 + đợt 1", ngân sách Q4 mức Tiết kiệm)

- [x] P0-1: `alternateName` + `disambiguatingDescription` cho Organization/WebSite, câu định nghĩa đầu `/gioi-thieu`.
- [x] P0-5: trang `/bao-chi` (chân trang, llms.txt, sitemap).
- [x] Đợt 1: `/bat-tu/nap-am` (30), `/bat-tu/tiet-khi` (24), `/bat-tu/con-giap-nam` (12, năm 2027), `/xem-ngay-tot/gio-hoang-dao`.
- [—] Hạn năm / sao chiếu mệnh: đã có sẵn ở `/xem-sao-han/{năm}` (MT-ĐS) — không làm cụm theo tuổi.
- [ ] Còn lại: bảng "ngày sinh ra hai số Đường đời khác nhau", trang "lịch âm Việt khác Trung", bộ 40 câu đo AI, báo cáo Tết 2027 (đợt 2).

## 9. Kế hoạch gốc — việc em làm được khi anh gật

- P0-1: thêm `alternateName` cho Organization + câu định nghĩa ở `/gioi-thieu`.
- P0-5: trang `/bao-chi`.
- Xuất bảng "ngày sinh ra hai số Đường đời khác nhau" và số "lịch Việt ≠ Trung" từ engine.
- Đợt 1 kho tri thức: 12 con giáp 2027, nạp âm, tiết khí, giờ hoàng đạo, kèm golden test trước.
- Chạy bộ 40 câu hỏi đo mốc AI.
