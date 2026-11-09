# Kế hoạch mở rộng quốc tế (QTE-1)

> Chốt qua phiên `/grill-me` ngày 2026-11-07. Chủ dự án duyệt toàn bộ, sau đó đổi ba điểm:
> lịch tính theo **tuần** (làm bằng AI code nên nhanh hơn), hỏi **cần mấy bản ngôn ngữ**,
> **bật thu tiền từ tháng thứ 3**.
> Mỗi giai đoạn khi bắt đầu code vẫn được duyệt riêng; tài liệu này chưa đụng code.

## 0. Một điều cần nói thật trước

AI code rút ngắn được phần **dựng**. Nó không rút ngắn được ba thứ:

| Việc | Thời gian thật | Vì sao |
|---|---|---|
| Google lập chỉ mục trang mới | vài tuần → vài tháng | Site đang có ~860 URL "đã phát hiện, chưa lập chỉ mục" (`docs/AUDIT-INDEX-2026-11.md`); thêm trang tiếng Anh sẽ chia thêm suất thu thập |
| Người bản xứ duyệt nội dung | theo sức người duyệt | Trang chưa duyệt vẫn hiện, ghi "editorial team" (EEAT-1) |
| Cổng thanh toán duyệt hồ sơ, luật sư | 1–4 tuần | Phải nộp ngay tuần 1 |

Vì vậy lịch dưới đây **dựng nhanh theo tuần**, nhưng **mốc đánh giá thành công vẫn ở tháng 6**.

## 1. Mục tiêu và cách đo

- Vòng tăng trưởng: đẩy **THU HÚT** trước (tuần 1–8). Sau đó bật **NẠP** từ tháng 3. **MỜI** (thẻ chia sẻ có QR) dịch ngay từ đầu vì rẻ. **QUAY LẠI** (Hôm nay, nhắc việc) đi theo.
- Chỉ số, tách theo nước và ngôn ngữ:
  - Hiển thị và nhấp trên Search Console.
  - `landing_viewed` → `reading_started` → `reading_completed`.
  - Từ tháng 3: `checkout_started`, `unlock_succeeded`.
- **Mốc tháng 6** cho mỗi thị trường thử nghiệm:
  - ≥ 1.000 lượt vào trang tự nhiên mỗi tuần.
  - Tỉ lệ `reading_started` không kém Việt Nam.
  - Có đơn nạp đầu tiên.
  - Không đạt thì dừng hoặc đổi hướng, chưa mở thêm ngôn ngữ.
- Ngân sách: 300–500 USD/tháng, chủ yếu thuê người bản xứ duyệt nội dung. Đi bằng SEO/GEO là chính; quảng cáo chỉ thử nhỏ.

## 2. Cần mấy bản ngôn ngữ

**Trả lời: 3 bản trong 6 tháng đầu, tối đa 5 bản sau 12 tháng.**

| # | Ngôn ngữ | Phục vụ ai | Khi nào | Vì sao |
|---|---|---|---|---|
| 1 | Tiếng Việt (đang có) | Việt Nam + **người Việt ở nước ngoài** (Mỹ ~2,35 triệu, Nhật ~681 nghìn, Pháp ~400 nghìn, Úc ~335 nghìn, Hàn ~300 nghìn, Canada ~275 nghìn, Đài Loan, Đức) | Tuần 1–2 | Không cần dịch, chỉ sửa giờ sinh nước ngoài + thu tiền quốc tế |
| 2 | Tiếng Anh `/en/` | Mỹ, Anh, Úc, Canada, Singapore, Malaysia | Tuần 3–8 | Các công cụ Bát tự, Tử vi, kua number, Kinh Dịch có vẻ ít đối thủ; app lớn (Nebula, Co–Star) không làm loại này |
| 3 | Tiếng Hoa phồn thể `/zh-hant/` | Đài Loan, Hồng Kông, người Hoa ở Singapore và Malaysia | Tháng 3–4, **chỉ khi tiếng Anh có số tốt ở tuần 8** | Tử vi khởi nguồn từ đây, người dùng sẵn lòng trả tiền (click108). Đối thủ nội địa mạnh nên vào sau tiếng Anh. *Đổi so với Q15 ("để 12 tháng"): lý do mới là AI code làm khung đa ngôn ngữ dùng lại được, chi phí thêm ngôn ngữ thứ 3 thấp.* |
| 4 | Tiếng Hàn | Saju (~1 tỉ USD) | Xét ở tháng 6 | Đối thủ mạnh (점신, 포스텔러), người dùng quen thanh toán nội địa |
| 5 | Tiếng Nhật | Uranai (~650 triệu USD) | Xét ở tháng 6 | Kênh phân phối nằm trong LINE, dịch đắt |

**Không làm:**
- Tiếng Trung giản thể: Trung Quốc đại lục cấm thu phí xem bói online, cần giấy phép ICP.
- Ấn Độ: chiêm tinh Vedic + gọi chuyên gia tính phút, không hợp thế mạnh.
- Tiếng Pháp, Đức: người Việt ở đó đọc bản tiếng Việt; EU kéo theo GDPR đầy đủ.

## 3. Sản phẩm theo ngôn ngữ

| Mảng | Tiếng Việt | Tiếng Anh | Phồn thể |
|---|---|---|---|
| Bát tự | có | tuần 3–4 | tháng 3–4 |
| Tử vi | có | tuần 5 | tháng 3–4 |
| Phong thuỷ (kua, phi tinh) | có | tuần 6 | tháng 4 |
| Kinh Dịch | có | tuần 7 | tháng 4 |
| Thần số học, Tarot | có | **không** (thị trường đã chật) | không |
| Nhân tướng | có | sau (ảnh khuôn mặt = dữ liệu sinh trắc) | sau |
| Hỏi đáp | có | **không** ở giai đoạn này (cần bộ luật nhận diện riêng) | không |
| Chiêm tinh phương Tây | không làm trong 12 tháng | | |

Mỗi mảng tiếng Anh gồm: công cụ lập lá số, trang kiến thức, bài đọc đời sống (chương 1 miễn phí), thẻ chia sẻ có QR.

## 4. Lịch theo tuần

| Tuần | Việc em làm (code) | Việc của anh |
|---|---|---|
| **1** | Giai đoạn 0 · người Việt ở nước ngoài: (a) form hồ sơ chọn **nước + thành phố**, máy tự tính múi giờ + giờ mùa hè theo ngày sinh (zoneinfo của Python + Intl của trình duyệt, không thư viện mới; golden test trước); (c) Hôm nay + nhắc việc theo múi giờ nơi đang sống | Nối Search Console + GA4 hieuban.com vào NotFair (hoặc gửi CSV quốc gia). Mở `trends.google.com` hoặc nối Keyword Planner. **Nộp hồ sơ cổng thanh toán** (mục 6). Tìm người duyệt bản xứ |
| **2** | (b) Trang SEO tiếng Việt theo nước: Mỹ, Nhật, Úc, Canada (giờ giao thừa, ngày Tết theo giờ địa phương, tuổi xông đất). **Kiểm mốc từ khoá**: nhóm bazi / zi wei / kua / i ching (+ cụm mùa Tết "Chinese zodiac 2027 / Year of the Fire Goat" — QTE-1b) ≥ 20.000 lượt/tháng ở 6 nước nói tiếng Anh, dưới mốc thì dừng tiếng Anh, hỏi lại anh | Gửi bản pháp lý cho luật sư |
| **3–4** | Khung đa ngôn ngữ tự làm: nhóm route `/en/…` với slug tiếng Anh, bảng chữ `lib/chu` có bản `en`, hreflang, sitemap `/en`, `lang` theo trang. Engine thêm tham số `ngon_ngu`, đọc `*_en.json`, bộ lọc BM-1 + `cum_cam` tiếng Anh có test (không đổi phép tính, không tăng `ENGINE_VERSION`). **Bát tự tiếng Anh** (BaZi calculator + trang kiến thức). Chính sách riêng tư + Điều khoản tiếng Anh. Mặc định lịch Trung Quốc ở `/en` | Người duyệt bản xứ đọc các trang Bát tự đầu tiên |
| **5** | Tử vi tiếng Anh (Zi Wei Dou Shu chart) | |
| **6** | Phong thuỷ tiếng Anh (kua number, flying stars) | |
| **6–8** | **Thanh toán quốc tế**: migration loại đơn + tiền tệ (có `.down.sql`), giá USD theo gói, gọi REST cổng thanh toán bằng `fetch` (không SDK), webhook chỉ tin chữ ký, thử sandbox | Ký hợp đồng cổng thanh toán, chạy migration |
| **7** | Kinh Dịch tiếng Anh | |
| **8** | Đo lại: số lập chỉ mục, hiển thị, `reading_started` theo ngôn ngữ. Quyết có làm phồn thể không | Duyệt kết quả đo |
| **9–12 (tháng 3)** | **Bật thu tiền** cho người Việt ở nước ngoài + bản tiếng Anh (công tắc `/quan-tri/cai-dat`, mặc định tắt). Nếu tuần 8 đạt: dựng `/zh-hant/` Bát tự + Tử vi | Bật công tắc khi luật sư đã xem |
| **Tháng 4–6** | Phồn thể phong thuỷ + Kinh Dịch; tối ưu theo số | |
| **Tháng 6** | **Mốc đánh giá** (mục 1). Quyết tiếng Hàn / Nhật, hỏi đáp tiếng Anh, nhân tướng tiếng Anh | |

Mỗi mảng đưa lên ngay khi xong, không chờ 4–6 tuần như bản trước. Bù lại, số đo ở tuần 8 và tháng 6 đọc **theo từng mảng**.

## 5. Kỹ thuật (đã chốt)

- **Tên miền:** thư mục con `hieuban.com/en/…`, `hieuban.com/zh-hant/…`, thẻ hreflang. Thương hiệu quốc tế là "Hieuban".
- **Đa ngôn ngữ trên web:** tự làm, **không thêm `next-intl`**. Chỉ áp cho các trang được dịch, không sửa ~385 tệp tiếng Việt.
- **Kho tri thức:** dịch máy **chỉ phần cần cho 4 mảng** vào tệp song song `*_en.json` (git là nguồn), giữ `source_id` + `school_id`, gắn nhãn nháp, người bản xứ duyệt dần theo số Search Console. LLM chỉ diễn đạt từ kho đã dịch; **không** để LLM tự dịch lúc trả lời.
- **Lịch:** `/en` và `/zh-hant` mặc định lịch Trung Quốc (`lich: "trung"`), bản tiếng Việt giữ lịch Việt Nam. Người dùng đổi được ở "Trường phái".
- **Hạ tầng:** giữ Singapore. Chỉ xét đặt máy chủ thêm vùng khi người dùng ngoài châu Á vượt 30 % lượt truy cập.

## 6. Thu tiền từ tháng 3

- **Đổi so với quyết định ban đầu** (6 tháng chưa thu): chủ dự án muốn bật thu tiền từ tháng 3.
- Sao vẫn giữ quy tắc cũ: không đổi ra tiền, không chuyển nhượng, không tự gia hạn.
- **Tuần 1 phải kiểm** (agent nghiên cứu chỉ có nguồn thứ cấp):
  - Stripe theo các nguồn đó không mở cho doanh nghiệp Việt Nam.
  - Paddle / Lemon Squeezy: có nhận người bán Việt Nam không, có xếp "bói toán / chiêm tinh" vào ngành bị cấm không.
  - Phương án dự phòng, theo thứ tự: một dịch vụ bán hộ khác (Polar, Dodo) → PayPal → lập pháp nhân ở Singapore để dùng Stripe.
- Giá theo USD (bản nháp có sẵn ở `docs/KE-HOACH-THANH-TOAN.md`: 4,99 / 9,99 USD). Giá chốt ở tuần 6.
- Người dùng Hàn, Nhật quen thanh toán nội địa, nên thẻ quốc tế sẽ chuyển đổi thấp. Đây là một lý do để hai thị trường này đi sau.

## 7. Pháp lý

- Bản tiếng Anh nhắm Mỹ, Anh, Úc, Canada, Singapore, Malaysia. Không chủ động nhắm EU.
- Có Chính sách riêng tư + Điều khoản tiếng Anh theo chuẩn GDPR cơ bản, vì người EU vẫn vào được trang.
- **Tắt** tính năng ảnh khuôn mặt ở bản tiếng Anh và phồn thể.
- Lời trên trang và quảng cáo không dùng "accurate / guaranteed".
  - Anh: ASA và DMCC 2024.
  - Mỹ: FTC đang để ý gói thuê bao tự gia hạn của app xem bói.
- Google Ads không cấm hẳn quảng cáo xem bói, nhưng tránh hứa kết quả, sức khoẻ, tiền bạc. LinkedIn cấm. Chính sách của Meta chưa kiểm.
- Luật sư xem bản tiếng Anh **trước tuần 9**.

## 8. Người đứng tên nội dung (E-E-A-T)

- Đức Luân là Chủ biên, có hồ sơ tiếng Anh.
- Người bản xứ am hiểu Bát tự / phong thuỷ đứng tên "Editor / Reviewer", chỉ ở những trang người đó đã duyệt.
- Trang chưa duyệt ghi "Hieuban editorial team".

## 9. Việc của chủ dự án (chép sang `docs/VIEC-CUA-ANH.md` mục 4af)

1. Nối Search Console + GA4 của hieuban.com vào NotFair, hoặc gửi CSV quốc gia của 3 tháng gần nhất.
2. Cho phép `trends.google.com` trong cài đặt mạng của môi trường, hoặc nối Google Ads Keyword Planner vào NotFair.
3. Tuần 1: nộp hồ sơ cổng thanh toán quốc tế (mục 6).
4. Tìm 1 người bản xứ nói tiếng Anh am hiểu Bát tự / phong thuỷ để duyệt nội dung (từ ngân sách 300–500 USD/tháng).
5. Luật sư xem Chính sách riêng tư + Điều khoản tiếng Anh trước tuần 9.

## 10. Nguồn số liệu

Nghiên cứu ngày 2026-11-07, chưa có số lượt tìm kiếm đã kiểm chứng cho từ khoá ngách. Mốc tuần 2 sẽ kiểm lại.

- Quy mô thị trường: MarkNtel, TBRC, Ken Research.
- Đối thủ: Statista/AppMagic (Nebula, Co–Star); Outlook Business, Inc42 (Astrotalk); Seoulz, Asiae (saju Hàn); Yano Research (Nhật 99,7 tỉ ¥); Bnext (click108).
- Người Việt ở nước ngoài: Pew, ABS 2021, Bộ Tư pháp Nhật 12/2025.
- Pháp lý: ASA, Apple 4.3(b), chính sách Google Ads.

## 11. Bổ sung QTE-1b (chủ dự án duyệt 2026-11-08)

Ba điểm QTE-1 còn để ngỏ, đề xuất ở PR UI-BLOG (`docs/UI-BLOG-VA-DA-NGON-NGU.md` mục 4), chủ dự án duyệt cả ba:

1. **Máy chuyển ngữ = LLM qua OpenRouter** (nhà cung cấp đã duyệt), chạy lúc SOẠN, hai lượt (chuyển ngữ cho người bản xứ →
   biên tập viên bản xứ đọc lại) + **bộ kiểm luật cố định** + người bản xứ duyệt. Không Google Translate / DeepL ở bước chính
   (DeepL chỉ để so sánh khi cần); không dịch lúc người dùng đọc.
   - **Đã làm (QT-0, chưa hiện gì cho người dùng):**
     - `engine/app/kb/data/thuat_ngu_en.json` — 219 thuật ngữ cố định của 4 mảng (Bát tự, Tử vi, Phong thuỷ, Kinh Dịch), mỗi mục
       trỏ `tu_dien.json` theo `ma`; `cum_cam_en` (guaranteed, accurate prediction, doomed, cursed, you will die, tên bệnh, lottery,
       lời khuyên mua bán cổ phiếu, vật phẩm giải hạn).
     - `engine/app/chuyen_ngu/kiem.py` — chặn: biến `{x}` lệch, con số mất/thêm, thuật ngữ ≥ 2 âm tiết không dùng tên trong bảng,
       cụm cấm, thiếu câu "not medical advice" khi nguồn có, còn chữ có dấu, độ dài bất thường.
     - `engine/app/chuyen_ngu/quy_trinh.py` + `engine/scripts/chuyen_ngu.py` — dịch một tệp KB theo lô 40 chuỗi → bản phủ
       `kb/data/en/<tên>.json` (`_trang_thai: nhap_may`; QTE-2 đổi chỗ từ `<tên>.en.json`), chuỗi lỗi không ghi, liệt kê ở
       `kb/data/en/<tên>.loi.json` (không vào git). Env `CHUYEN_NGU_MODEL`.
     - Test `engine/tests/test_chuyen_ngu.py` (13 ca, máy AI giả).
2. **CMS hướng lai**: Bài viết + Chuyên mục → mỗi ngôn ngữ một bài, nối `ban_goc` (migration nhỏ, chỉ thêm cột); global giao diện
   (Menu, Chân trang, Chữ dùng chung, Trang website) → Payload `localization`. Làm ở tuần 3–4 cùng khung `/en`, migration Payload
   có up/down, thử trên Postgres thật trước. Nút "Tạo bản tiếng Anh" trong trình viết bài tạo NHÁP (không tự xuất bản).
3. **Thêm cụm "Chinese zodiac 2027 / Year of the Fire Goat"** (Tết 6/2/2027) vào lượt kiểm từ khoá tuần 2.

## 12. QTE-2 — đánh giá lại kiến trúc trước khi làm tiếp (2026-11-08)

Chủ dự án yêu cầu đánh giá tổng thể plan / engine / hạ tầng cho đa ngôn ngữ. Kết quả + số đo: `docs/DANH-GIA-KIEN-TRUC-DA-NGON-NGU.md`.
Tóm tắt điều chỉnh so với mục 5:

- **Mục 5 "engine thêm `ngon_ngu`, đọc `*_en.json`" là chưa đủ**: lời luận nằm trong mã Python (≈ 5.100 dòng chuỗi tiếng Việt ở
  RULES). Kiến trúc chốt: **dữ kiện tất định — lời theo ngôn ngữ**: ngữ cảnh ngôn ngữ của lượt gọi (`app/ngon_ngu.py`) + lớp phủ KB
  `kb/data/<ngôn ngữ>/` (`kb/nap`) + bảng tên riêng (`kb/ten`, pinyin — **không** dùng en-US của iztro) + lời bài đọc dựng từ
  `ma_mau` / dữ kiện bằng mẫu câu tiếng Anh (mục 4.3 của tài liệu đánh giá, **chờ duyệt**); không gettext từng chuỗi Python.
- **Thứ tự trong mỗi mảng**: công cụ lập lá số → trang kiến thức → thẻ chia sẻ → bài đọc đời sống (bài đọc cần lớp lời, đi sau).
- **Web**: cây `app/en/…` riêng, root layout đọc ngôn ngữ từ header do `proxy.ts` đặt; bảng chữ `lib/chu` thêm chiều ngôn ngữ; bảng
  ánh xạ đường dẫn vi ↔ en cho hreflang. Không `next-intl`, không dời 103 trang.
- **Đã làm (QTE-2a)**: ngữ cảnh ngôn ngữ + lớp phủ KB (22 module KB + 6 RULES chuyển sang `nap`), bảng tên 341 mục, **giai đoạn 0
  tuần 1 (a)**: múi giờ nơi sinh theo nước + thành phố (`calc/mui_gio`, 62 nước / 146 thành phố, zoneinfo), form hồ sơ chọn nước →
  thành phố, Hôm nay theo đồng hồ máy người dùng. Không đổi phép tính, không tăng `ENGINE_VERSION`.

## 13. QTE-3 — bản tiếng Anh đầu tiên: Tarot · Thần số · hỏi đáp (2026-11-09)

Chủ dự án quyết (2026-11-08): "Làm Tarot/Thần số/hỏi đáp tiếng Anh đi em rồi merge" — **đảo** điều loại trừ ở mục 3 (bản tiếng Anh
"không tarot, thần số, hỏi đáp"). Lý do ghi nhận: hai mảng này không cần lịch Trung Quốc / giờ sinh, kho KB đã là nguồn phương Tây
(Waite, Book T, Pythagoras) nên bản tiếng Anh gần nguyên gốc hơn các mảng phương Đông, và có sẵn khung hỏi đáp tất định. Thứ tự
Bát tự → Tử vi → phong thuỷ → Kinh Dịch của mục 3 vẫn giữ cho các tuần sau.

Đã làm (chi tiết ở `CLAUDE.md` dòng QTE-3):

- Engine: mẫu câu theo ngôn ngữ (`kb/loi.py` + `kb/data/en/loi_khuon.json`), bản phủ KB tiếng Anh cho Tarot (78 lá) và Thần số
  (nghĩa số, chiều sâu, chân dung, 6 lĩnh vực, chỉ số phụ, biểu đồ), an toàn tiếng Anh trong MỘT bộ chặn, hỏi đáp Thần số gọn tất
  định (`hoi_en`), hỏi đáp Tarot nhận câu tiếng Anh, hai route kiến thức. Test chấp nhận: đầu ra tiếng Anh không còn một ký tự Việt.
- Web: `/en`, `/en/numerology`, `/en/numerology/life-path/{n}`, `/en/tarot`, `/en/tarot/cards/{slug}`, `/en/privacy`, `/en/terms`;
  `sitemap-en.xml`; hreflang hai chiều; khung tiếng Anh riêng (không CMS / Sao).

Chưa làm / chờ quyết:

- **Người bản xứ duyệt** toàn bộ `kb/data/en/*.json` (`_trang_thai: bien_tap` → `da_duyet`); đặc biệt câu sức khoẻ, tiền bạc.
- Hỏi đáp Thần số tiếng Anh là bản **gọn** (10 kiểu câu); bản đầy đủ (ma trận nỗi đau, hợp đôi, Chaldea, tổng hợp) chưa chuyển.
- Thẻ chia sẻ, lịch sử rút bài, kiểm chứng "Đúng với mình", Sao: chưa có ở `/en` (đọc miễn phí, không lưu).
- Pháp lý: `/en/privacy`, `/en/terms` là tóm tắt — luật sư xem trước tuần 9 như mục 7; bản ràng buộc vẫn tiếng Việt.
- Search Console: thêm `sitemap-en.xml`; theo dõi hiển thị / nhấp `/en/*` làm cột mốc tuần 8 (mục 6).

## 14. HTT-1 — đối chiếu bộ tài liệu "Hybrid Two-Tier 6 bước" (2026-11-09)

Chủ dự án gửi bộ tài liệu Drive (PostgreSQL 17 + Apache AGE + pgvector, Morphological AST, pipeline 4 agent, Tier 2 SSE, Coolify,
cron RLHF) và hỏi "làm được không / phương án tốt nhất". Đánh giá đầy đủ: `docs/DANH-GIA-HYBRID-TWO-TIER.md`. Tóm tắt cho kế hoạch
quốc tế:

- **Kiến trúc đa ngôn ngữ giữ như QTE-2** ("dữ kiện tất định — lời theo ngôn ngữ", bản phủ `kb/data/<ngôn ngữ>/`); không đưa lời
  vào DB, không VPS riêng. Phần lấy được của Drive đã vào HTT-1: lớp "Điểm giao thoa" tất định (vi + en), máy chuyển ngữ có lượt
  kiểm định + cấm dịch sát + cụm "giọng AI", thống kê lệch tỉ lệ "Đúng với mình" theo ngôn ngữ (migration 0034) cho người duyệt,
  giờ mặt trời thực toàn cầu + công tắc trường phái, dải gợi ý bản tiếng Anh (không chuyển hướng), Wikidata `sameAs` đã kiểm.
- **Bản `/en` có phiếu kiểm chứng** ("Resonates with me / Not quite me") từ HTT-1 → từ đây đo được bản dịch nào bản xứ không thấy
  đúng (mục 3.5 của tài liệu) — đây là số liệu quyết định cho mốc tuần 8 (mục 6) bên cạnh Search Console.
- **HTT-2 đã làm (2026-11-09)**: AI diễn đạt hộp giao thoa (công tắc quản trị, mặc định tắt, chỉ bản Việt); "Soạn lại nháp → PR"
  cho mã lệch (Tarot + Giao thoa — hai nơi /en có phiếu); điều hậu Bát tự theo mùa thực cho người sinh ngoài chí tuyến Nam.
- Còn chờ số liệu: biến thể A/B theo thị trường bằng
  bản phủ thứ hai + cờ PostHog.

