# ĐÁNH GIÁ KHẮT KHE (RED-TEAM AUDIT): TỪ CODEBASE, DB, KB ĐẾN BÀI TOÁN KINH DOANH & LỘ TRÌNH THỰC THI THÔNG MINH 10X

**Ngày lập:** 2026-11-26  
**Phương pháp:** Đọc trực tiếp mã nguồn `engine/app/`, 42 migration Supabase, `web/`, tài liệu vận hành mới nhất tới PR #353 (`RA-SOAT-PR-347-353.md`, `CHIEN-LUOC-GOOGLE-ADS.md`, `GOI-XEM-VA-GIA-2026-11.md`, `RA-SOAT-LUAN-HOI-VA-THU-SAO.md`, `CHAN-DUNG-TONG-HOP.md`, `DO-TIN-KHO-TRI-THUC.md`, `DANH-GIA-HYBRID-TWO-TIER.md`) và mổ trực tiếp **16 file `.sqlite` trong 15 kho `projects/*-kb/`**.  
**Mục tiêu:** Không tô hồng — chỉ thẳng **(1) `hieubanthan` đang thật sự thiếu và sai ở đâu**, **(2) chính bản kế hoạch đề xuất hôm qua có 7 lỗ hổng chí mạng nào**, **(3) cách khai thác thông minh hơn 10 lần + 6 ý tưởng đột phá**, và **(4) các bước triển khai tiếp theo theo từng Sprint thực chiến**.

---

## PHẦN 1. `HIEUBANTHAN` ĐANG THẬT SỰ THIẾU & HỔNG Ở ĐÂU? (TỪ KỸ THUẬT ĐẾN KINH DOANH)

Nếu chỉ nhìn danh sách tính năng bề mặt thì `hieubanthan` đã có rất nhiều (12 mảng huyền học, hơn 600 trang SEO, 97 trang `/en`, Pay2S, Lì xì Tết 2027, Chuyên gia 1-1, Web Push, CMS, pgvector). Nhưng khi mổ khắt khe từ **mã nguồn chạy thật** sang **dòng tiền kinh doanh**, có **6 điểm hổng cốt tử**:

### 1.1. Hổng ở Toán kinh doanh (Unit Economics đang âm nặng trên kênh trả phí)
- Theo số thật trong `docs/CHIEN-LUOC-GOOGLE-ADS.md` (§0.4): với phễu hiện tại (`CPC 2.000 ₫ × 25% tạo hồ sơ × 3% mở khóa × 50% thanh toán`), chi phí để có **1 đơn hàng là ~530.000 ₫ (CAC)**, trong khi đơn đầu tiên thu về chỉ **59.000 ₫ (gói lần đầu `0040`) – 99.000 ₫ (gói lẻ `GIA-99`)**, kỳ vọng trung bình **178.000–226.000 ₫**.
- **Nguyên nhân gốc rễ của độ rò rỉ này nằm ngay trong cấu trúc sản phẩm (`GOI-XEM-VA-GIA-2026-11.md` §4):**
  1. **Nghịch lý "Đắt cho miễn phí, Rẻ mới thu tiền":** Toàn bộ các công cụ đánh trúng túi tiền của người có khả năng chi trả cao nhất — **Đội ngũ/Đối tác & Mặt bằng kinh doanh (`/quan-ly-nhan-su`), Phong thủy nhà ở (`/phong-thuy`), Xem hợp đôi 2 người (`/tu-vi#hop-tham`, `/hop-doi`), Chọn ngày đại sự (`/xem-ngay-tot`)** — hiện đều đang **MIỄN PHÍ 100% (0 Sao)**! Thứ đang khóa 99 Sao chỉ là báo cáo đọc cá nhân 1 người.
  2. **Kênh `/en` (97 URL chuẩn SEO 0 lỗi, TTFB 124 ms) đang thu `0 USD`:** Đã tốn công xây máy chuyển ngữ 3 lượt, hreflang, Wikidata, kiểm chứng tiếng Anh (`HTT-3`), nhưng chưa gắn cổng thanh toán quốc tế (Merchant of Record như LemonSqueezy / Paddle), bỏ phí tệp khách sẵn sàng trả **$9.99–$29.00** (cao gấp 2,5–7 lần ARPU Việt Nam).

### 1.2. Hổng ở Mảng "Kinh doanh / Doanh Chủ" (Cả về Toán Bát Tự lẫn Định vị Thương mại)
1. **Lỗi toán học nghiêm trọng trong `engine/app/calc/doanh_chu.py` (dòng 150):**
   ```python
   ls = battu.la_so(dt.datetime(nam, thang, ngay, 12, 0), gioi_tinh)
   ```
   Khi phân tích Ông Chủ và 1–8 thành viên, hàm `_ho_so_co_ban()` **gán cứng giờ sinh là `12:00` (Giờ Ngọ)** cho TẤT CẢ mọi người (kể cả khi người dùng có biết giờ sinh thật, API `/doi-ngu` cũng không có trường `gio`!).
   - *Dưới góc nhìn Bát Tự chuyên sâu:* Giờ Ngọ mang Địa chi **Ngọ (tàng Đinh Hỏa + Kỷ Thổ)** rất mạnh. Gán cứng 12:00 tương đương **bơm thêm Hỏa/Thổ giả tạo vào lá số của mọi ông chủ và nhân sự**, làm lệch tỷ lệ 5 hành (`ty_le_ngu_hanh`), sai `hanh_manh`/`hanh_yeu` và kéo lệch `dung_than`! Khi khuyết giờ sinh, chuẩn mệnh lý bắt buộc phải tính **Tam Trụ (6 chữ Năm–Tháng–Ngày, `khong_gio=True`)**, tuyệt đối không bịa giờ Ngọ.
2. **Định vị `/quan-ly-nhan-su` an toàn pháp lý lao động nhưng "trật tâm lý mua hàng" của Chủ Doanh Nghiệp:**
   - Đổi `/doanh-chu` → `/quan-ly-nhan-su` (PR `QLNS-1`, 25/11/2026) là bước đi đúng để tránh rủi ro phân biệt đối xử tuyển dụng theo Bộ luật Lao động.
   - **Nhưng cái giá phải trả:** Chủ doanh nghiệp nhỏ, chủ shop, nhà đầu tư ở Việt Nam **hiếm khi rút ví vì cụm "quản lý nhân sự theo ngũ hành"** (nghe như công cụ HR nội bộ). Họ trằn trọc mất ngủ và sẵn sàng chi tiền lớn vì **Quan hệ Thương mại / Dân sự** (vốn hoàn toàn hợp pháp, không thuộc phạm vi Bộ luật Lao động):
     - *"Hùn vốn / Mở công ty cùng đối tác X có bền không, ai giữ két, ai đứng mũi chịu sào?"*
     - *"Mặt bằng này năm 2027 (Đinh Mùi) đặt quầy thu ngân, bàn giám đốc ở đâu để tụ tài, khai trương ngày giờ nào?"*
     - *"12 tháng tới tháng nào bung vốn nhập hàng, tháng nào thu hồi công nợ nằm im?"*
3. **Mất trắng dữ liệu sau F5 (`khong_luu_du_lieu: True` cực đoan):**
   - Chủ doanh nghiệp gõ tay ngày sinh 6 cộng sự + thông số mặt bằng xong, đóng tab mở lại là **trắng tinh**. Không có "Bàn cờ Doanh Chủ" lưu lại thì không thể bán gói đồng hành theo quý/năm!

### 1.3. Hổng giữa Khung Chat Hỏi Đáp (`hoidap`) và Báo cáo Trả phí (`luan_hoi` 99 Sao)
- Như chính `docs/RA-SOAT-LUAN-HOI-VA-THU-SAO.md` (mục `D2`) đã chỉ ra: báo cáo Tử Vi & Bát Tự vừa được nâng cấp rất mạnh với **27 câu hỏi thẳng (`LH-1`, `LH-2`, `LH-3`)** (có cả nhãn mạnh như *"dễ hai lần đò"*, *"dấu hiệu người thứ ba"*, *"giữ tiền kém"*), **NHƯNG khung chat hỏi đáp (`hoidap/tuvi.py`, `hoidap/battu.py`) vẫn chạy bộ luật cũ riêng rẽ**!
- Hệ quả kép:
  1. Khách đọc báo cáo 99 Sao thấy một kết luận, xuống khung chat hỏi lại câu đó ra câu trả lời khác → **sập niềm tin ngay lập tức**.
- **Đính chính chính xác sau khi đối chiếu cuối tệp `MA-TRAN-CAU-HOI-DOI-SONG.md` (§8) & `an_toan.py` (2.262 dòng):** Các bước `B0–B6` và `EN-1..4` **đã vá xong khủng hoảng lên 16/16 (100%)** và nâng định tuyến đơn môn lên **87% (Tử Vi) / 90% (Bát Tự)**, đồng thời chứng minh thực nghiệm `bam512_v1` đạt `0/85` câu lạ. **Điểm hổng THẬT SỰ còn lại ở tầng Hỏi Đáp lúc này là:** (a) **Mục `D2` chưa làm** (`hoidap` chưa đọc 27 nhãn `luan_hoi` của PR `LH-1/LH-2` ngày 17/11), (b) **Chưa có 1 cửa hỏi đáp liên mảng chung** (người dùng vẫn phải tự đoán nên gõ câu hỏi vào trang Tử Vi, Bát Tự hay Phong Thủy), và (c) **`cot_loi` của `/thoi-gian-toi` vẫn đang trả mảng rỗng** (`KH-1` mục 4).

### 1.4. Hổng ở Hạ tầng Vận hành khi bắt đầu đổ tiền chạy Ads (từ 01/12/2026)
- `PROJECT_STATE.yaml` đã tụt hậu từ `2026-10-08` (lệch gần 2 tháng so với thực tế PR #353 ngày `2026-11-25`) → nguy cơ các phiên AI/dev đọc nhầm trạng thái cũ.
- Bộ đếm hạn mức lượt AI (`gioi_han.py` / `RL-1`) vẫn nằm trong RAM tiến trình đơn; khi chạy chiến dịch Tết tăng instance trên Render sẽ lệch hạn mức.
- Kho lời `tuvi_luan_hoi_kb.json` và `battu_luan_hoi_kb.json` (nội dung khách trả 99.000 ₫ để mở!) vẫn đang ở trạng thái **bản nháp biên tập chưa soát tay xong** (`VIEC-CUA-ANH.md` mục `4aw`).

---

## PHẦN 2. TỰ PHẢN BIỆN KHẮT KHE: 7 LỖ HỔNG CHÍ MẠNG TRONG KẾ HOẠCH EM ĐỀ XUẤT HÔM QUA

Đọc lại bản `CHIEN-LUOC-INSIGHT-KB-UI-ASK-MY-LIFE-2026-11.md` hôm qua dưới lăng kính kiểm toán mã nguồn sáng nay, em phải tự gạch bỏ/sửa **7 lỗ hổng lớn** mà nếu cứ thế lao vào code sẽ tốn tiền, vỡ tiến độ Tết hoặc sập test:

| # | Lỗ hổng trong kế hoạch hôm qua | Bằng chứng thực tế mổ từ Code / DB / KB sáng nay | Hậu quả nếu không sửa |
|---|---|---|---|
| **1** | **Ảo tưởng "Viết script Python ETL nhanh từ 4,8 GB kho `*-kb`"** | Kiểm tra trực tiếp 15 kho `*-kb` (tổng 5,78 GiB): **97,8% dung lượng là ảnh PNG scan (4,05 GB), PDF (1,1 GB) và `.venv` (770 MB)**! Toàn bộ 16 file `.sqlite` chỉ nặng **138,5 MB**, trong đó **~90% (~8.274 dòng) là văn xuôi OCR/VLM thô**, **8 kho tiếng Hán có `0% translation_vi`**, **4 kho tiếng Anh thuần**. `bazi-kb` **không hề có** bảng `Dụng thần × 5 Hành`; `fengshui-xuankong-kb` **không hề có** bảng Vận 9 × 8 hướng × phòng (chỉ có 610 ca nhà Vận 2–3 năm 1928 trong *Trạch Vận Tân Án*). Thậm chí `bazi_rules` (236 dòng) và `xuankong` (61 dòng) còn lẫn dữ liệu từ `.skill` ngoài không rõ bản quyền! | Sa lầy hàng tháng làm ETL mà sinh ra văn dịch máy chất lượng thấp, đồng thời **vi phạm trực tiếp chuẩn nguồn gốc `SX-C` (`DO-TIN-KHO-TRI-THUC.md`)** của dự án. |
| **2** | **Đề xuất "Thanh Đồng Thuận Đa Môn (`2/3 môn Thuận`)" theo kiểu bỏ phiếu ngang hàng** | Trong `docs/CHAN-DUNG-TONG-HOP.md` (§6 Ý4), dự án đã chạy kiểm nghiệm trên **1.000 lá số mẫu** (`dong_thuan_thong_ke.json`) và chứng minh mức chấm của Tử Vi và Bát Tự có **Cohen's Kappa $\approx 0,00$ (−0,03 đến +0,04)** ở cả 6 mảng đời — tức trùng nhau ~33% đúng bằng xác suất ngẫu nhiên! | ~65% câu hỏi sẽ ra cảnh Tử Vi và Bát Tự lệch/ngược nhau → thanh biểu quyết biến thành "mâu thuẫn nội bộ" hoặc tạo **độ chính xác giả** mà dự án đã bác bỏ. |
| **3** | **Nguy cơ "Tự ăn thịt" (Cannibalize) Báo cáo 99 Sao & Lì xì Tết 2027** | Nếu mở khung `/hoi-thay` trả lời miễn phí trọn gói (Phán quyết + Lịch 12 tháng + Hóa giải) cho các câu hỏi đời sống, người dùng không còn lý do gì bỏ **99 Sao** mở báo cáo 13 chương (`LH-1/LH-2`) hay mua **Lì xì Tết 99k–399k** (`0042`). | Tăng lượt chat tốn token AI nhưng **kéo tụt tỷ lệ `unlock_succeeded` và doanh thu Tết**. |
| **4** | **Đặt tên `/hoi-thay`, `"AI Thầy Riêng"`, `"Thử thầy"`, `"Giải hạn"` phạm luật Quảng cáo** | `docs/CHIEN-LUOC-GOOGLE-ADS.md` (§6) quy định cấm tuyệt đối các từ **`"thầy"`, `"bói"`, `"giải hạn"`, `"năm hạn"`, `"đoán đúng tương lai"`** vì khiến Google Ads & Meta xếp vào nhóm tâm linh nhạy cảm / từ chối mẫu quảng cáo và phạm Luật Quảng cáo VN. | Hỏng chiến dịch Google Ads mở màn ngày **01/12/2026** và Meta CAPI đang chạy. |
| **5** | **Quên mất ">60% người dùng mới KHÔNG biết giờ sinh"** | Bộ điều phối liên mảng `Tử Vi + Bát Tự + Phong Thủy` nếu yêu cầu đủ lá số Tử Vi ngay bước đầu sẽ biến thành **ngõ cụt** với >60% khách vào từ Google/Facebook chỉ nhớ ngày sinh dương lịch (giống điểm nghẽn hiện tại của `/chan-dung`). | Rơi rụng 60% khách ngay màn hình đầu tiên, kéo Cost/Lead tăng vọt. |
| **6** | **Nhân đôi văn bản 2 chế độ làm nổ trần 190 KB / 256 KB của `luan_giai_luu`** | Báo cáo Tử Vi / Bát Tự hiện đã nặng **~142 KB** (`RA-SOAT-LUAN-HOI-VA-THU-SAO.md` §3.1); bộ test chặn cứng ở **190 KB** và cột JSONB `luan_giai_luu.noi_dung` chặn ở **256 KB**. Nhét song song văn bản 2 chế độ vào JSON báo cáo sẽ vượt trần ngay lập tức, đồng thời nhân đôi khối lượng dịch `/en`. | Gãy CI test kích thước báo cáo, lỗi lưu bài vào tài khoản và tắc nghẽn tiến độ `/en`. |
| **7** | **Lệch nhịp Mùa Vàng Tết Đinh Mùi (còn đúng 72 ngày tới 06/02/2027!)** | Hôm nay đã là **26/11/2026**; đỉnh tìm kiếm *"tử vi 2027, sao hạn 2027, khai trương, làm nhà, lì xì đầu năm"* nổ ra từ **15/12/2026 đến 20/02/2027**. Một kế hoạch GĐ1 nặng nề kéo dài 2 tháng sẽ bỏ lỡ mỏ vàng doanh thu lớn nhất năm. | Có tính năng hay nhưng ra mắt **sau Rằm tháng Giêng** — lúc lưu lượng tự nhiên giảm 70%. |

---

## PHẦN 3. CÁCH KHAI THÁC THÔNG MINH HƠN 10 LẦN & 6 Ý TƯỞNG ĐỘT PHÁ

Thay vì đập đi xây lại hay làm theo lối mòn tốn kém, chúng ta tận dụng **90% linh kiện tinh hoa đã có sẵn trong repo** nhưng lắp ghép lại theo **6 cơ chế thông minh gấp 10 lần**:

### Đột phá #1 — Thay "Biểu quyết Đồng thuận" ($\kappa \approx 0$) bằng **"Tam Tài Phân Vai Trực Giao" (Orthogonal Diagnostic Engine)**
Một bậc thầy 100 năm thật sự không bao giờ bắt Tử Vi, Bát Tự và Phong Thủy "bỏ phiếu xem tốt hay xấu", vì mỗi môn đo một chiều vật lý hoàn toàn khác nhau. Ta phân vai cứng trong tầng `RULES`:
- **Chiều 1 — THIÊN THỜI & NỘI LỰC (`Bát Tự` — chạy được cả 3 trụ không giờ lẫn 4 trụ có giờ):** Trả lời *"Sức bền và kho chứa của bạn năm nay rộng hay hẹp? Cần thêm hành nào để cân bằng?"*
- **Chiều 2 — NHÂN SỰ & TÌNH HUỐNG (`Tử Vi` — bật khi có giờ sinh, hoặc `Thần Số` khi thiếu giờ sinh):** Trả lời *"Biến số nằm ở ai và khâu nào?"* (tận dụng thẳng dữ liệu `nguoi_quanh` & `phi_hoa`: vợ/chồng, cộng sự, khách hàng, giấy tờ).
- **Chiều 3 — ĐỊA LỢI & ĐÒN BẨY HÀNH ĐỘNG (`Phong Thủy Vận 9` + `Hoàng Lịch`):** Trả lời *"Ngày mai bạn tự tay chỉnh được cái gì?"* (hướng ngồi, khu vực nhà cần giữ tĩnh tránh Ngũ Hoàng/Nhị Hắc, 3 ngày đẹp cụ thể để xuất chiêu).

👉 **Hiệu quả:** Khi Bát Tự *Thuận* mà Tử Vi *Cần lưu ý*, hệ thống không còn lúng túng mà tạo ra nhận định đắt giá nhất: *"Thời điểm mở rộng đã chín (Bát Tự thuận), NHƯNG rủi ro nằm ở khâu ràng buộc với người đồng hành (Tử Vi Nô Bộc cần lưu ý) — hãy khóa kỹ điều khoản trước khi xuống tiền vào các ngày đẹp tháng X."* Người đọc nổi da gà vì độ sắc sảo!

---

### Đột phá #2 — Khai thác 15 kho `*-kb` bằng **"Máy Biên Dịch Quy Tắc Toán Học (Rule-Compiler) + Trích Dẫn Cổ Thư SX-C"**
Tuyệt đối **KHÔNG** dịch máy 8.274 đoạn OCR thô và **LOẠI BỎ NGAY** 236 dòng `bazimbtifenxi.skill` + 61 dòng `fengshui.skill` không rõ nguồn bản quyền khỏi luồng nạp! Cách khai thác thông minh gấp 10 lần:
1. **Dùng chính `engine/app/calc/` sinh Khung Tổ Hợp hữu hạn**, rồi viết quy tắc gọn nhẹ theo Toán Ngũ Hành:
   - *Ví dụ Phong Thủy Vận 9:* Không cần lục sách năm 1928 tìm nhà Vận 9! Ta dùng `calc/huyen_khong.py` lấy cặp **(Sao Vận/Hướng × Sao Lưu Niên/Lưu Nguyệt)** → áp dụng **Bảng 25 Phép Điều Hòa Ngũ Hành Chính Tông** (*Thổ sát [5, 2] dùng Kim [6, 7] tiết khí; Mộc Hỏa tương sinh [4-9] kích Văn Xương/Danh tiếng; Thủy Hỏa ký tế [1-9] kích Tài vị Vận 9*) → tự động phủ **100% mọi căn nhà & mặt bằng Vận 9** chỉ với 1 file JSON `< 25 KB`!
2. **Dùng SQLite FTS5 của 15 kho `*-kb` như "Kho Tra Cứu Nguyên Văn Cổ Thư" (Offline Citation Lookup):**
   - Viết 1 script nhỏ tìm đúng câu chữ Hán gốc trong các sách công cộng sạch bản quyền (`Trạch Vận Tân Án`, `Thẩm Thị Huyền Không`, `Dương Trạch Thập Thư`, `Tử Bình Chân Thuyên`, `Thiên Lý Mệnh Cảo`, `Tăng San Bốc Dịch`, `Kỳ Môn Cổ Kim Đồ Thư`) gắn vào trường `sach_ghi` và khóa bằng unit test `test_*_khop_nguyen_van` giống hệt chuẩn `DO-TIN-KHO-TRI-THUC.md`!
3. **Khai thác kho vàng bị bỏ quên trong 15 kho `*-kb` kèm Hàng rào Bản quyền PR #320 (`TK-2`):**
   - **Cảnh báo Pháp lý & CI cực gắt (mới phát hiện khi rà sâu):**
     - `bazi_cases` (1.681 mệnh lệ trong `bazi_kb.sqlite`) mang giấy phép **GPL-3.0 (`Coaixy/bazi-case-list`)** → **chỉ dùng chạy backtest/hiệu chuẩn công thức OFFLINE ngoài repo**, tuyệt đối không chép bất kỳ dòng nào vào git của `hieubanthan` (tránh lây nhiễm GPL-3.0).
     - `physiognomy-kb/data/tarot_kb.sqlite` chứa nguyên văn sách bản quyền Bunning/Pollack; `YZSY_QING` (162 dòng) & `BTMK_QING` (171 dòng) trong `physiognomy-kb` ghi nhãn đời Thanh nhưng thực chất là OCR sách dịch tiếng Việt hiện đại; `ziwei-liang-kb` có 188 dòng `needs_review=1` và cờ `restored_from_memory=1` (VLM tự điền từ trí nhớ) → **phải lọc bỏ 100% bằng điều kiện SQL trước khi đọc**.
     - Bộ test CI (`test_duong_trach_tam_yeu_nguon.py`, PR #320) chặn cứng chữ `.sqlite`, `opencc`, `白話` và tên các repo `*-kb` trong mã nguồn.
   - **Danh sách "Vàng Sạch" chưa khai thác hết (làm tiếp rất an toàn & giá trị cao):**
     - **Huyền Không (`fengshui-xuankong-kb`):** Hoàn thiện nốt **53/81 cặp tổ hợp Phi Tinh** (hiện `phongthuy_huyen_khong.json` mới có 28/81 cặp!) từ cổ thư công cộng + dùng **610 ca nhà thật của *Trạch Vận Tân Án* (1928, Public Domain)** làm bộ kiểm chuẩn `calc/huyen_khong.py`.
     - **Tử Vi Lương Phái (`ziwei-liang-kb`, lọc `restored_from_memory=0 AND needs_review=0`):** Rút luật logic **Kỵ chuyển Kỵ (`LRY_127_V_HANT`)** theo Phương án C của PR #320 (`tom_y` tự biên soạn hai mặt + ghi số trang đối chiếu, 0 chữ nguyên văn).
     - **Tử Vi Tử Vân (`ziwei-ziyun-kb`):** Rút khung logic **định giờ sinh & ứng kỳ lưu niên** (~228 trang còn lại) theo chuẩn `tom_y` để nâng cấp công cụ `tuvi_dinh_gio.py`.
     - **Kỳ Môn (`qimen-miji-kb`):** **430 mục cổ thư công cộng** (*Kỳ Môn Bí Kíp Đại Toàn*) sạch bản quyền cho Giai đoạn 2.

---

### Đột phá #3 — Công tắc 2 Chế độ **"Zero-Bloat"** (`Đời sống Thực tế` ⇄ `Học thuật Cổ điển`)
- **Đổi tên chuẩn chính sách Google Ads & Luật Quảng cáo:**
  - Chế độ 1: **`Đời sống & Hành động`** (mặc định — gần gũi, dễ làm ngay).
  - Chế độ 2: **`Học thuật Cổ điển & Ngũ hành`** (thay cho chữ "Huyền học chính tông / Giải hạn" dễ vướng kiểm duyệt quảng cáo; bên trong vẫn hiển thị đầy đủ *Dụng thần, Hỷ/Kỵ thần, Tứ Hóa, Phi Tinh Vận 9, Hướng, Màu sắc/Chất liệu ngũ hành, Giờ đẹp, Nguyên văn cổ thư*).
- **Kiến trúc kỹ thuật "0 KB phình báo cáo":**
  - Không lưu 2 bản văn vào `luan_giai_luu`! Báo cáo giữ nguyên cấu trúc hiện tại (~142 KB < trần 190 KB).
  - Tạo 1 bảng ánh xạ tĩnh siêu gọn `kb/data/ung_dung_co_dien_kb.json` (~20 KB, có bản phủ `en/`): từ mã `hanh_can_bu` (Kim/Mộc/Thủy/Hỏa/Thổ), `cung`, `sao_phi_tinh` (1..9), `truc_ngay` → render tức thì thẻ **"Ứng dụng Ngũ hành & Không gian"** ngay trên UI khi người dùng gạt công tắc! Tốc độ **0 ms**, chi phí LLM **0 đồng**, không bao giờ nổ giới hạn 256 KB!

---

### Đột phá #4 — Kiến trúc Kinh doanh **"Song Kiếm"**: Giữ `/quan-ly-nhan-su` + Mở mới **`/co-van-kinh-doanh` (High-Ticket B2B / Chủ Shop / Nhà Đầu Tư)**
Để giải bài toán `CAC 530k vs AOV 99k`, ta cần những gói giá trị cao **249k – 599k – 1.990k** đánh trúng nỗi đau tiền tươi thóc thật của người kinh doanh:
1. **Sửa ngay lỗi `12:00` trong `calc/doanh_chu.py`:** Hỗ trợ **Tam Trụ chuẩn xác khi thiếu giờ sinh** + dùng **Tứ Trụ & Tử Vi Tài Bạch/Nô Bộc đầy đủ khi có giờ sinh**.
2. **Tách riêng trang thương mại `/co-van-kinh-doanh` ("Bản đồ Hợp tác Kinh doanh, Mặt bằng & Thời điểm"):**
   - Tập trung 100% vào **quyết định thương mại & dân sự** (Soi độ bù khuyết với Co-founder / Người góp vốn / Đối tác chiến lược; Chấm mặt bằng cửa hàng/văn phòng Vận 9 + vị trí quầy thu ngân/bàn chủ sự; Lịch 12 tháng bung vốn / ký kết / thu hồi công nợ; 5 ngày giờ đẹp khai trương).
   - **Gắn cổng Sao hợp lý:** Xem thử 1 đối tác / tổng quan miễn phí → Mở trọn bộ **Hồ sơ Thương vụ / Mặt bằng / Lịch 12 tháng Doanh Chủ = 99–199 Sao** (hoặc thúc thẳng lên **Hội viên Năm 599.000 ₫** / **Hội viên Chuyên gia 1.990.000 ₫** kèm câu hỏi Chuyên gia 1-1!).
3. **Kho lưu trữ "Bàn cờ Doanh Chủ E2EE" (Zero-PII tuyệt đối trên Server, giữ chân 100% trên Client):**
   - Dữ liệu đối tác & mặt bằng được mã hóa **AES-GCM ngay trên trình duyệt** bằng khóa riêng của người dùng trước khi đồng bộ lên cột blob nhỏ trên tài khoản (hoặc lưu qua mã mời HMAC khi đối tác tự nhập). Máy chủ `hieuban.com` mù hoàn toàn với ngày sinh đối tác (an toàn tuyệt đối Luật 91/2025), nhưng Chủ doanh nghiệp mở điện thoại hay laptop đều thấy nguyên danh sách đối tác & mặt bằng của mình để xem lại mỗi đầu tháng!

---

### Đột phá #5 — Biến Khung Chat thành **"Phễu Chẩn Đoán 3 Bước"** (Hợp nhất `D2`, Không ăn thịt 99 Sao, Tăng vọt tỷ lệ chuyển đổi)
Thay vì để `KhungChat` hoạt động rời rạc hay cho không nội dung trả phí:
1. **Hợp nhất nguồn sự thật (`D2`):** Khi người dùng hỏi trong chat bất kỳ câu nào thuộc 27 chủ đề lớn (`hợp nghề gì`, `giữ tiền`, `hôn nhân bền không`, `năm 2027 thế nào`, `tháng nào đổi việc/mở tiệm`), `hoidap` gọi **đúng hàm RULES của `luan_hoi` + `ke_hoach_thang`** → Cam kết **100% nhất quán giữa Chat và Báo cáo**!
2. **Công thức trả lời "Chẩn đoán 3 Bước" kích thích mở khóa:**
   - **Bước 1 — Đối chiếu Quá khứ (Miễn phí 100% để tạo chữ TIN):** Tự động chèn 1 câu kiểm chứng từ `battu_doi_chieu` / đại hạn vừa qua (*"Giai đoạn 2023–2024 vừa rồi lá số báo dễ hao hụt hoặc đổi hướng công việc — điểm này có khớp với bạn không?"*). Khách bấm *"Đúng"* → niềm tin tăng vọt!
   - **Bước 2 — Định hướng Trực giao Tam Tài (Trả lời thật, không úp mở rẻ tiền):** Cho biết rõ kết luận chính (*Thuận / Cân bằng / Cần lưu ý*) và nguyên nhân gốc.
   - **Bước 3 — Mở khóa Đòn bẩy Chi tiết (99 Sao / Lì xì / Chuyên gia 299k):** Dẫn thẳng tới chương khóa chứa *danh sách tháng/ngày cụ thể, chân dung "Người quanh bạn" chi tiết và bảng ứng dụng Ngũ hành 2 chế độ*, hoặc nút **"Nhờ Chuyên gia đọc sâu ca này (299.000 ₫)"** với những lá số có tổ hợp phức tạp!

---

### Đột phá #6 — Hai Cỗ Máy Tăng Trưởng Tự Nhiên (CAC = 0 ₫) & Doanh Thu Quốc Tế USD
1. **"Link Soi Độ Ăn Ý Hợp Tác Làm Ăn" (B2B Viral Loop):**
   - Nâng cấp cơ chế link mời HMAC hiện có (vốn mới dùng cho tình yêu/bạn bè) thêm mẫu thẻ **"Bản đồ Phối hợp Kinh doanh & Dự án 2027"**: Founder A gửi link qua Zalo cho Đối tác B → B tự nhập ngày sinh → Cả hai nhận ngay biểu đồ Radar 5 hành bù khuyết + *"Ai nên giữ tay hòm chìa khóa, ai nên đi chốt khách, điều khoản nào cần thống nhất trước"*. Mỗi lượt mời kéo về **1 khách hàng nhóm kinh doanh có tiền** với chi phí quảng cáo = **0 đồng**!
2. **Mở vòi thu USD trên `/en` trước Tết Dương lịch:**
   - `/en` đã có 97 trang chuẩn SEO và công cụ Tarot / Thần số / Tử vi / Bát tự. Chỉ cần gắn cổng **LemonSqueezy hoặc Paddle** (họ đứng tên Merchant of Record xử lý thuế toàn cầu, trả tiền sạch về VN) cho báo cáo tiếng Anh giá **$9.99** và gói năm **$29.99** → thu ngoại tệ ngay trên tập Việt kiều (`Ý3: /sinh-o-nuoc-ngoai` 15 nước đã xây sẵn!) và khách quốc tế!

---

## PHẦN 4. CÁC BƯỚC TRIỂN KHAI TIẾP THEO (CHIA SPRINT THỰC CHIẾN THEO LỊCH TẾT 2027)

Thay vì dàn trải, toàn bộ kế hoạch được sắp lại thành **4 Sprint sắc gọn**, ưu tiên tuyệt đối cho **mốc chạy Google Ads 01/12/2026** và **cao điểm Tết Đinh Mùi (15/12/2026 – 20/02/2027)**:

### 🚀 SPRINT 0 (Ngay tuần này — chỉ 2 đến 3 ngày nhờ `B0–B6` đã có sẵn!): Vá Đúng 3 Lỗ Hổng Thật & Khóa Phễu Trước Ngày 01/12
*Đẩy khâu: NIỀM TIN + NẠP SAO · Rủi ro kỹ thuật cực thấp, tiết kiệm 2 ngày công nhờ không làm lại `B0–B1`.*
1. **S0.1 — Làm ngay mục `D2`: Đồng bộ 27 Nhãn `luan_hoi` (`LH-1/LH-2`) vào Khung Chat (`hoidap`) + Cửa dẫn 99 Sao:**
   - Hỏi trong chat bất kỳ câu nào trong 27 câu trọng tâm (`hợp nghề gì`, `giữ tiền`, `hai lần đò`, `người thứ ba`...) đều trả đúng nhãn của báo cáo và dẫn thẳng tới chương khóa 99 Sao / Lì xì Tết 2027.
2. **S0.2 — Điền `cot_loi` đang rỗng của `/thoi-gian-toi` (`KH-1` mục 4) + Nút "Nhắc tôi đầu tháng thuận":**
   - Đây là sản phẩm chủ lực chạy quảng cáo Tết (`S-2027` 40k–200k/ngày và `Lì xì Tết 2027` 99k–399k) — lấp ngay hộp *"Điều quan trọng nhất năm 2027"* đang bị trống để tăng tỷ lệ mở khóa!
3. **S0.3 — Sửa lỗi toán học `12:00` Giờ Ngọ trong `calc/doanh_chu.py` & Đồng bộ `PROJECT_STATE.yaml`:**
   - Chuyển `_ho_so_co_ban()` sang tính **Tam Trụ chuẩn xác khi thiếu giờ sinh (`khong_gio=True`)** và nhận `gio` thật khi có; cập nhật `PROJECT_STATE.yaml` khớp thực tế ngày 26/11/2026.

---

### ⚡ SPRINT 1 (Tuần 2–3 · Đầu tháng 12/2026): Công tắc 2 Chế độ "Zero-Bloat" + Cố vấn Liên mảng "Tam Tài" (`/co-van`)
*Đẩy khâu: TRẢI NGHIỆM "WOW" + QUAY LẠI + NẠP SAO — Kịp đón trọn đỉnh tìm kiếm "Năm 2027" từ 15/12.*
1. **S1.1 — Xây `ung_dung_co_dien_kb.json` (< 25 KB, chuẩn SX-C, có bản `/en`) & Công tắc 2 Chế độ trên UI:**
   - Gạt tức thì `[Đời sống & Hành động]` ⇄ `[Học thuật Cổ điển & Ngũ hành]` trên Báo cáo Tử Vi, Bát Tự, Phong Thủy và Khung Chat mà **không tăng 1 byte lưu trữ DB**.
2. **S1.2 — Ra mắt Bộ điều phối Liên mảng "Tam Tài" (`POST /v1/co-van` & UI 5 Khối Trực Quan):**
   - Hỗ trợ **Graceful Degradation 3 bậc đầu vào** (Chỉ ngày sinh → Có thêm khoảng giờ/biến cố quá khứ → Có thêm hướng nhà/đối tác) — **0% ngõ cụt**!
   - Ghép trực giao: **Nội lực (Bát Tự)** × **Tình huống & Người quanh bạn (Tử Vi / Thần Số)** × **Đòn bẩy Không gian & Ngày đẹp (Phong Thủy Vận 9 + Hoàng Lịch)** + Phễu Chẩn đoán 3 Bước.
3. **S1.3 — Backtest `battu_doi_song` trên 1.681 mệnh lệ thật của `bazi_kb.sqlite`:**
   - Lọc sạch các dòng `.skill` ngoài bản quyền khỏi danh sách nguồn, chỉ giữ cổ thư công cộng chuẩn `SX-C`.

---

### 💼 SPRINT 2 (Nửa cuối tháng 12/2026 – Tháng 01/2027): Mũi nhọn "Cố Vấn Kinh Doanh & Đối Tác" (High-Ticket & Viral B2B)
*Đẩy khâu: MỜI (CAC = 0₫) + TĂNG AOV/LTV (249k – 599k – 1.990k) đúng mùa Khai trương / Chốt kế hoạch năm Đinh Mùi.*
1. **S2.1 — Mở chuyên trang thương mại `/co-van-kinh-doanh` (song song `/quan-ly-nhan-su`):**
   - Tích hợp trọn bộ: **Soi Co-founder / Đối tác góp vốn** + **Chấm Mặt bằng & Quầy thu ngân Vận 9** + **Lịch Quyết định Kinh doanh 12 tháng 2027** + **Chọn ngày Khai trương / Ký hợp đồng**.
2. **S2.2 — Tung "Link Soi Độ Ăn Ý Hợp Tác Làm Ăn" (HMAC Zero-PII) + Kho lưu "Bàn cờ Doanh Chủ E2EE":**
   - Biến mỗi chủ doanh nghiệp thành 1 điểm phát tán viral mời đối tác; lưu bàn cờ mã hóa đầu-cuối để giữ chân mở lại hàng tháng.
3. **S2.3 — Gắn cổng Sao thông minh cho nhóm công cụ High-Ticket & Nối nút "Hỏi Chuyên Gia 299k" (`D5`):**
   - Khóa phần phân tích sâu (đa đối tác, hóa giải chi tiết mặt bằng, chọn ngày giờ chuyên sâu) vào gói Sao / Hội viên 599k, giải trực tiếp bài toán hòa vốn và có lãi trên Google Ads / Meta Ads!

---

### 🌍 SPRINT 3 (Sau Tết Đinh Mùi — Từ cuối tháng 02/2027): Khai thác Trọn Hệ Sinh Thái 9 Môn, Thu USD `/en` & Xây Chiêm Tinh Phương Tây
1. **S3.1 — Bật cổng thanh toán quốc tế (Paddle / LemonSqueezy) cho `/en` + Cụm Việt kiều 15 nước (`/sinh-o-nuoc-ngoai`).**
2. **S3.2 — Nối Kỳ Môn Độn Giáp (`qimen-*-kb` cổ thư sạch) & Lục Hào (`iching-kb`) vào `/co-van-kinh-doanh`** làm tầng "Chiến thuật Thương vụ & Đàm phán".
3. **S3.3 — Xây mới Engine Chiêm tinh Phương Tây (`pyswisseph`: Natal, Transit, Solar/Saturn Return, Synastry, SVG Đêm sao) + 6 kho KB Chiêm tinh (có Cầu nối Đông–Tây độc quyền).**
