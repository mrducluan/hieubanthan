# Kế hoạch nâng cấp engine (EN-V3) — 2026-11-01

Chủ dự án giao: "gọi nhiều agent tốt nhất, nghiên cứu và lập kế hoạch nâng cấp engine tốt nhất". Năm agent độc lập
chạy song song, mỗi agent một hướng, có chạy thử engine thật (không sửa repo):

| # | Hướng | Cách làm | Kết luận một câu |
|---|---|---|---|
| A | Chất lượng lời luận | 10 hồ sơ đa dạng × 9 loại báo cáo, đo câu trùng giữa hồ sơ, đọc như người dùng | Lời **khuôn sáo** và có chỗ **tự mâu thuẫn** — mất niềm tin đúng lúc người dùng trả Sao |
| B | Độ đúng phép tính | So oracle độc lập (lunar-python, lasotuvi, ephem) trên ~150.000 ngày, 29.000 tứ trụ, 2.774 lá số | Lõi tính **rất chắc** (tứ trụ, hoàng lịch, 14 chính tinh 0 lệch); lỗi nằm ở **lớp ghép** và vài biên |
| C | Hỏi đáp | 261 câu MỚI viết độc lập (đã lưu `engine/fixtures/cau_hoi/holdout_v2.jsonl`) | Định tuyến 77%, trả lời thẳng 69%, **an toàn 68%** — kho cũ báo 100% vì luật viết theo kho |
| D | Thị trường, đối thủ | Nghiên cứu web (VN, quốc tế, Trung Quốc) có nguồn | Tiền nằm ở **hôn nhân/quan hệ** và **mua lẻ theo chủ đề/năm**; giữ chân nhờ **bạn bè + thông báo đáng chụp** |
| E | Kiến trúc, hiệu năng | Đo latency, profile, thử tải, đọc lớp AI | Tử vi gọi Node 3–4 lần/lượt, **có thể hết RAM** trên gói Starter; lớp AI thiếu nguyên liệu |

Em đã tự chạy lại để xác nhận hai phát hiện nặng nhất trước khi viết kế hoạch:
- **Bộ chặn khủng hoảng lọt.** `/v1/hoi/dac-biet` trả `loai: null` cho "chắc em sinh ra là gánh nặng cho mọi người,
  đi đâu đó thật xa cho xong" và "mọi thứ vô nghĩa, chẳng muốn dậy nữa". Câu thứ nhất còn nhận lại danh sách sát tinh
  kèm "Địa Kiếp".
- **Lịch âm lỗi "ngày 0".** `lunar.solar_to_lunar(26, 3, 2009, 8.0)` trả `(0, 3, 2009, 0)`.

---

## 1. Những gì đang tốt — giữ nguyên

- **Lõi tính.**
  - Tứ trụ: năm, ngày, giờ lệch 0/29.272 ca. Trụ tháng chỉ lệch ở ca cách giờ giao tiết dưới 1 phút, nằm trong sai
    số đã công bố.
  - Hoàng lịch: 0 lệch trên 36.890 ngày.
  - Tử vi: Mệnh, Thân, 14 chính tinh, đại hạn, tiểu hạn đều 0 lệch so với lasotuvi. Tứ hoá Canh/Nhâm khác là do khác
    phái, đã biết và có ghi chú.
- **Nguyên tắc sản phẩm** (không doạ, không giải hạn, có nguồn sách, 3 lớp) là **lợi thế niềm tin thật** so với đối
  thủ người thật đang dính tin "bẫy giải hạn online" (agent D).
- **Điểm "aha" thật**: Linh hồn × Nhân cách của Bản đồ con số; "Xem lá số 2 người"; đường bay tứ hoá khi khuôn đúng.

## 2. Vấn đề xếp theo mức nguy hiểm

### P0 — sửa ngay (an toàn, đúng, sống còn)

| Mã | Vấn đề | Bằng chứng | Nguồn |
|---|---|---|---|
| AT-1 | Câu khủng hoảng **gián tiếp**, bạo lực gia đình, bệnh nặng, "mấy tuổi thì mất" lọt bộ chặn | Lọt 8/25 câu nhạy cảm. Thần số dùng bộ chặn riêng (`hoi.AN_TOAN`), không chung với `chung.AN_TOAN_HH` | C, đã xác nhận |
| DU-1 | Hỏi đáp Phong thuỷ tính **tuổi làm nhà bằng năm dương** và dùng **bộ tính thứ hai** | Ca sinh 20/01/1990: hỏi đáp ra tuổi 37 + Kim lâu; trang `/xem-tuoi-lam-nha` ra tuổi 38, không Kim lâu. Trùng hàm ở `calc/phongthuy.py:156-185` | B |
| DU-2 | Hỏi đáp Bát tự / Phong thuỷ hiểu "năm nay" là **năm dương** | Hỏi ngày 20/01/2027 → máy đọc lưu niên Đinh Mùi; đúng phải là Bính Ngọ (Lập xuân 4/2). Sai đúng mùa Tết | B |
| DU-3 | Kim lâu bảo **đàn ông** tránh cưới | `tuoi_dan_gian.xem_tuoi_lam_nha`, trái NAM-1 (Kim lâu cưới chỉ xét tuổi cô dâu) | A |
| DU-4 | Lịch âm trả **"ngày 0"** | 7 ngày lỗi trong 1900–2100 (vd 26/03/2009 lịch Trung). Lỗi có sẵn từ bản gốc Hồ Ngọc Đức; sửa một dòng, đã thử khớp oracle | B, đã xác nhận |
| HT-1 | Có thể **hết RAM** khi khoảng 6 người xem Tử vi cùng lúc | Không giới hạn số tiến trình Node chạy cùng lúc; mỗi tiến trình 67 MB, gói Starter có 512 MB | E |
| HT-2 | Mục lục KB mất **1,35 giây/lượt** và làm chậm route khác (giữ khoá GIL) | `kb/trang.py:_slug` bị gọi 2,09 triệu lần. Thêm bộ nhớ đệm: 1.776 → 70 ms, kết quả giống hệt | E |

### P1 — làm người dùng mất niềm tin hoặc không muốn trả Sao

| Mã | Vấn đề | Bằng chứng |
|---|---|---|
| ND-1 | **Tự mâu thuẫn** | Tử vi và Bát tự cùng mảng ngược hẳn nhau ở 10/56 ô mà không giải thích. Ngoài ra: chip mức lệch câu tóm tắt ngay dưới (12/60 chương); "Năm nay" có chip "Cần lưu ý" nhưng hộp ngay dưới ghi "thuận lợi"; Lời khuyên bảo "gỡ" đúng mảng vừa chấm "Thuận lợi" |
| ND-2 | **Khuôn sáo** | Câu giống hệt giữa các hồ sơ: Nhà của bạn 84%, Hôm nay 78%, Thần số 78%, Thời gian tới 72%. "Nét mạnh của bạn phát huy rõ" lặp 42 lần trên 10 hồ sơ. Tóm tắt chương 1 miễn phí có chỗ chỉ một câu khuôn |
| ND-3 | **Ghép câu gãy** | ≥ 18% hộp Tử vi bị cắt đôi câu khi tách tiêu đề. Đường bay có tiêu đề một mảng, thân nói mảng khác (7/17). Mệnh đề đuôi lắp sai chỗ |
| ND-4 | **Rào đón dày** | Bát tự lặp "hai cách đọc…" 11–25 lần mỗi bài. Sức khoẻ liệt kê tới 10 bộ phận cơ thể, kể cả khi mức "Thuận lợi" |
| ND-5 | **Thuật ngữ lọt** vào lời chính | Nhà của bạn: 15% câu có du niên / quái. Kinh Dịch: thể–dụng, hào đại diện. Xem 2 người: tóm tắt đầy tên cung |
| ND-6 | **Kinh Dịch kết luận ngược lời quẻ** | Hỏi kết hôn ra "Thuận lợi", trong khi lời hào chủ là "muốn tụ mà không được, buồn khóc" và quẻ biến là Bĩ |
| ND-7 | Lời **không theo tuổi, hoàn cảnh** | Người 61 tuổi được khuyên "bàn chuyện lên chức"; lời mặc định người đọc đã có đôi |
| ND-8 | Thời gian tới (TG-V2) **quá tải** | ~135 chữ mỗi tháng × 12 tháng; câu "không khoan đục, không dồn đồ nặng" lặp 150 lần trên 10 hồ sơ; "Tóm lại: tháng thuận" dù chỉ dựa vào một lớp |
| HD-1 | Hỏi đáp **rơi im lặng về câu mặc định** | ~30/261 câu: "có nên nhảy việc" → chân dung số chủ đạo; "nhà cuối ngõ cụt" → bài 43 chữ |
| HD-2 | **Bỏ qua thời gian trong câu hỏi** | "Tháng 3 năm sau có nên cưới" → trả tháng này. Hỏi tháng cụ thể chỉ Tử vi trả đúng; ba mảng còn lại đúng 0/6 câu |
| HD-3 | **Hỏi về người khác lại trả lá của người hỏi** | "Xem giúp lá số chồng em sinh 1988" → trả cung Mệnh của chính người hỏi |
| AI-1 | Lớp AI được **quá ít nguyên liệu** nhưng prompt đòi viết dài | `doan` chỉ 1–3 câu mà prompt đòi 6–12 câu, nên AI buộc phải thêm ý. Bộ kiểm không bắt ý mới, không bắt số viết bằng chữ; `/v1/thanso/van` không kiểm gì |

### P2 — sai biên ít gặp, cần anh chốt (đổi kết quả cũ → tăng `ENGINE_VERSION` 0.1.6)

| Mã | Vấn đề | Cần anh quyết |
|---|---|---|
| BI-1 | Miền Nam **01/04/1947 – 01/07/1955** dùng giờ UTC+8 (theo tzdata IANA), bảng múi giờ đang thiếu → người sinh miền Nam giai đoạn này có thể lệch giờ sinh 1 canh | Có thêm không? Âm lịch vẫn chỉ áp UTC+8 cho 1960–1975 như đã chốt |
| BI-2 | **Giờ Tý muộn rơi vào ngày cuối tháng âm** (Tử vi) → 118/120 lá khác với lá "sang ngày mới" (mùng 1 tháng sau); đêm giao thừa còn lệch Hoả/Linh | Áp đúng quyết định "23:00 sang ngày mới" bằng cách an như sinh ngày hôm sau, giờ Tý? |
| BI-3 | **Sinh ở nước ngoài**: Bát tự so mốc tiết khí bằng "giờ địa phương − 7" → người sinh ở Mỹ sát Lập xuân bị sai năm, tháng | Thêm múi giờ nơi sinh chỉ để so mốc tiết? |
| BI-4 | Thần số âm thầm bỏ qua chữ lạ ("Ð" U+00D0 nhìn giống "Đ") → Sứ mệnh 33 thay vì 1 | (em làm luôn: quy đổi Ð→D, chữ lạ khác báo lỗi) |

---

## 3. Lộ trình (6 đợt, xếp theo rủi ro × giá trị)

Mỗi đợt một PR, có test viết trước và thước đo trước/sau. Thước đo chung:
- `holdout_v2` (261 câu, **đóng băng**, không viết luật nhìn theo nó).
- Bộ đo câu trùng của agent A, đưa vào `engine/scripts`.
- Latency p95 từng route.

### EN-1 · An toàn + đúng (1 tuần) — nền móng, chặn rủi ro pháp lý / đạo đức
1. **Một module an toàn duy nhất** dùng cho cả 5 router và `/v1/hoi/dac-biet`:
   - tín hiệu khủng hoảng gián tiếp ("gánh nặng", "đi thật xa cho xong", "không muốn dậy", "sống được bao lâu");
   - bạo lực gia đình, tên bệnh, co giật / sốt cao ở trẻ, "mấy tuổi thì mất";
   - mức **an toàn mềm**: tín hiệu yếu thì đặt lời hỗ trợ lên đầu, vẫn trả lời.
   
   Bộ test gồm 25 câu nhạy cảm của holdout_v2 và **50 câu nhạy cảm mới** viết riêng. Chặn nhầm phải giữ ở 0.
2. **Hỏi đáp dùng đúng bộ tính một nguồn**:
   - tuổi làm nhà → `calc.tuoi_dan_gian` theo năm âm; xoá hàm trùng trong `calc/phongthuy.py`;
   - "năm nay" của Bát tự, phi tinh → theo Lập xuân;
   - Kim lâu theo giới.
   
   Test: "câu trả lời hỏi đáp = trang công cụ" và các ngày 1/1–4/2.
3. Sửa lịch âm "ngày 0" (vòng `while`), thêm test toàn dải 1900–2100 hai múi giờ (~2 giây). Thần số quy đổi Ð.
4. Lịch âm miền Nam 1960–1975 áp nốt ở tuổi dân gian, mệnh quái mốc Tết, Bát tự đời sống, Thời gian tới (B9). Tuổi
   Bát tự đời sống tính theo sinh nhật.
5. Hạ tầng:
   - semaphore 2–3 tiến trình Node;
   - bộ nhớ đệm mục lục KB;
   - ngày mặc định theo giờ VN (5 chỗ đang dùng `date.today()` theo UTC);
   - ngày sinh hợp lệ 1900–2100, lỗi đầu vào trả 422 (đang trả 500/503);
   - đếm byte thật của thân yêu cầu + `extra="forbid"`.

Thước đo: an toàn holdout 68% → **100%**; p95 kb/trang 1.354 → < 100 ms; không còn lỗi 500 với ngày sinh lạ.

### EN-2 · Nhất quán + lời luận (2–3 tuần) — khâu NẠP Sao (bán được chương thứ hai)
> **Trạng thái 2026-11-01: đã làm** mục 1, 2, 3 (lý do theo sao, lời mời theo hộp riêng), 4, 6, 7, 8 — chi tiết ở dòng EN-2
> của `CLAUDE.md`. **Chưa làm mục 5** (lời theo nhóm tuổi / tình trạng độc thân – có đôi): cần ô chọn tình trạng trên hồ sơ
> (người dùng tự chọn) → để chung đợt với EN-3 (hỏi đáp đã có trích ô người thứ hai / quan hệ). Thước đo câu trùng giữa hồ
> sơ chưa đo lại bằng số — `scripts/do_chung_chung_tuvi.py` + test `test_tuvi_doi_song_chung_chung` vẫn xanh.

1. **Lớp nhất quán liên mảng** (RULES `luangiai/nhat_quan.py`):
   - cùng mảng mà Tử vi, Bát tự, Thần số **cùng mức** → thành điểm nhấn "nhiều cách cùng thấy";
   - **khác mức** → một câu giải thích vì sao (mỗi môn nhìn một mặt, kèm việc nên làm chung).
   
   Test CI chặn: chip lệch tóm tắt, Lời khuyên ngược mức chương, "năm nay" ngược vận hạn.
2. **Sửa ghép câu một lượt**:
   - hàm tách tiêu đề không cắt giữa câu;
   - bỏ mệnh đề đuôi lắp sai;
   - KB đường bay sửa khuôn thay chữ.
   
   Test bắt hộp mở đầu bằng từ nối hoặc mẩu không có vị ngữ.
3. **Bớt khuôn**:
   - lý do theo sao × cung cụ thể thay cụm "nét mạnh phát huy rõ";
   - tóm tắt + lời mời chương khoá lấy **hộp đặc thù nhất** của chính người đó (mã mẫu hiếm nhất) thay câu cố định.
   
   Thước đo: câu trùng giữa hồ sơ ở Tử vi 44% → ≤ 30%, Thần số 78% → ≤ 50%.
4. **Bớt rào**:
   - Bát tự gom "hai cách đọc" thành một khung đầu bài;
   - sức khoẻ tối đa 2 phần cơ thể, chọn theo sao mạnh nhất;
   - không biết giờ sinh thì các chương phụ thuộc giờ nói rõ "đang đọc theo giờ tạm".
5. **Lời theo tuổi và hoàn cảnh**: biến thể KB theo nhóm tuổi (< 25 · 25–45 · 45–60 · > 60) và theo tình trạng (độc
   thân / có đôi — chỉ khi người dùng tự chọn, không suy đoán).
6. **Thuật ngữ về "Vì sao nói vậy"** ở Nhà của bạn, Kinh Dịch, Xem 2 người. Nhà của bạn khi chưa khai bố cục vẫn có ít
   nhất một nhận xét riêng cho căn đó.
7. **Kinh Dịch**:
   - kết luận dung hoà hào chủ với quẻ biến; mức không được ngược lời hào chủ;
   - KB "Hiểu đơn giản" viết theo 6 chủ đề hay hỏi;
   - ánh xạ câu hỏi vào 20 chủ đề đã có thay vì 6 lĩnh vực.
8. **Thời gian tới gọn lại** (sửa TG-V2 theo phản hồi agent A):
   - mỗi tháng hiện "Tóm lại" + **một việc nên làm**, các lớp gập dưới "Xem từng cách";
   - "Tóm lại: tháng thuận" chỉ khi ≥ 2 lớp cùng chiều;
   - câu "giữ yên góc…" chỉ nói khi đổi so với tháng trước;
   - Hôm nay thêm **một câu tổng hợp** ghép các tín hiệu trong ngày.

### EN-3 · Hỏi đáp v2 (3–4 tuần) — khâu QUAY LẠI + NẠP (3 Sao/câu)
> **Trạng thái 2026-11-01 (đợt 1 đã làm)** — đo bằng `engine/scripts/cham_holdout_v2.py` (holdout đóng băng; luật viết theo
> bộ phát triển `dev_en3.jsonl` 250 câu do agent viết độc lập, không nhìn holdout):
>
> | Thước đo (holdout_v2) | Trước EN-3 | Sau | Mục tiêu |
> |---|---|---|---|
> | Định tuyến | 80% (209/261) | **90%** (235/261) | ≥ 90% ✓ |
> | Trả lời thẳng (đoạn 1–2) | 64% | **74%** | ≥ 85% ✗ |
> | Đúng mốc thời gian | 26/33 | **29/33** | ≥ 5/6 mỗi mảng ✓ (Kinh Dịch không có câu thời gian trong holdout) |
> | An toàn | 25/25 | 25/25 (+10/10 dev) | 100% ✓ |
> | Teencode / viết tắt (dev) | — | 32/36 | ≥ 14/16 ✓ |
>
> Đã làm: mục 1 (module `hoidap/hieu_cau.py`: kiểu câu, mốc thời gian, người thứ hai; mở viết tắt `chuan_hoa_cau`), mục 2
> (`hoi_lai` + khối chọn trên web), một phần mục 3 (`chung.tra_loi_truoc` + đoạn mốc thời gian lên đầu), mục 4 (vợ/chồng có
> năm sinh tính luôn; câu kiến thức trả bằng từ điển, không cá nhân hoá), mục 5 (9 mục `bo_tri` + 10 thuật ngữ). **Còn lại
> (EN-3b)**: "trả lời thẳng" 74 → 85% cần đoạn mở đầu soạn theo đúng điều được hỏi ở từng mảng (hiện mới sắp lại đoạn có
> sẵn); mục 6 (bộ phân xử Naive Bayes) chưa cần — luật hoà điểm hiếm.

1. **Module "Hiểu câu hỏi" dùng chung 5 mảng** (RULES, tất định):
   - chuẩn hoá + từ điển viết tắt (ck, vk, cv, sk, bh…);
   - **trích ô dữ kiện**:
     - thời gian: nhiều khoảng, âm/dương, so sánh "2027 hay 2028";
     - người thứ hai: quan hệ, năm/ngày sinh, con giáp;
     - chỉ số / sao / cung / quẻ / hướng được nêu;
     - kiểu câu: mô tả · khi nào · có nên · so sánh · kiến thức · người khác;
   - **chấm điểm nhiều nhãn** có độ tin (thay "khớp mẫu đầu tiên").
2. **Độ tin thấp → chip hỏi lại**, không bao giờ âm thầm rơi về "Bản thân" hay "kỹ thuật".
3. **Trả lời trước**: đoạn 1 nêu mức + một lý do + một việc, đúng mảng và đúng thời gian được hỏi; các lớp hạn gập vào
   "Vì sao nói vậy". Mục tiêu dưới 150 chữ cho màn hình đầu.
4. **Đủ dữ kiện thì tính luôn**:
   - Phong thuỷ tính quái của vợ/chồng từ năm sinh;
   - hỏi tên khác thì tính số tên đó;
   - câu kiến thức ("là gì", "khác nhau", "tính sao") trả kiến thức, không gieo quẻ, không cá nhân hoá;
   - hỏi về người khác mà không đủ dữ kiện → dẫn sang "Xem lá số 2 người", **không** trả lá của người hỏi.
5. Bổ sung khoảng 8 mục KB `bo_tri` (góc khuyết, két sắt, ngõ cụt, giếng cũ…) và khoảng 10 mục giải thích kiến thức.
6. **Tuỳ chọn**: bộ phân xử cục bộ (n-gram ký tự + Naive Bayes viết bằng Python thuần, trọng số trong git) chỉ dùng khi
   luật hoà điểm. **Không** LLM phân loại lúc chạy; **chưa** pgvector với embedding thật (giữ ngưỡng ≥ 500 câu không
   nhận ra mỗi tháng).

Thước đo trên holdout_v2:
- định tuyến 77% → **≥ 90%**;
- trả lời thẳng 69% → **≥ 85%**;
- đúng tháng được hỏi 0/6 → **≥ 5/6** ở mọi mảng;
- an toàn **100%**;
- teencode 8/16 → ≥ 14/16.

### EN-4 · Hiệu năng + lớp AI (2–3 tuần) — nền móng GĐ2, giảm chi phí
> **Trạng thái 2026-11-01: đã làm** (đo trên máy dev, cùng bộ lá golden):
>
> | Thước đo | Trước | Sau |
> |---|---|---|
> | An sao một lá (iztro) | 110 ms | **30 ms** (tiến trình Node chạy sẵn) |
> | Luận giải Tử vi đời sống | 355 ms | **72 ms** (lá số + mọi ngày xem trong một lượt gọi) |
> | Hỏi đáp Tử vi | 357 ms | **67 ms** |
> | Thời gian tới | 503 ms | **166 ms** |
> | Toàn bộ pytest | 190 s | 108 s |
>
> Đã làm: mục 1 (`ziwei/may_chu.mjs` + pool Python có thời hạn chờ, tự dựng lại, thay tiến trình sau N lượt, quay về
> đường cũ khi lỗi; trùng khít đường cũ trên golden; Windows dùng đường cũ), mục 2 theo cách khác — gộp lời gọi thay vì
> dựng ít chương (đã đủ nhanh, không phải tách luồng dựng chương), mục 3 (`narrative/ai_goi.goi_chat`: `max_tokens` theo
> nguồn, thử lại một lần khi 429/5xx/lỗi mạng — hết giờ thì không thử lại, bản bị cắt (`finish_reason=length`) là lỗi,
> nhớ theo mã băm chỉ khi bản AI qua bộ kiểm; `narrative/kiem_ai.kiem` một bộ kiểm cho hỏi đáp + luận giải: liên kết, số
> kể cả số viết bằng chữ, thuật ngữ ≥ 2 âm tiết theo từ điển 5 mảng, cụm cấm, từ y tế, vật phẩm / giải hạn, câu ý mới,
> độ dài; hỏi đáp kiểm với gói + bản mẫu đã dựng; quản trị không trừ lượt của người dùng; xoá `/v1/thanso/van`), mục 4
> một phần (làm nóng lúc khởi động `ENGINE_LAM_NONG`, một luật HỌC `doi_song_khuon.danh_gia_phieu`).
> **Chưa làm / cần anh**: chọn mô hình mặc định mới (mục 4 của tài liệu); chạy lại bộ 55 câu AI thật
> (`docs/CHAY-55-CAU-AI-THAT.md`) — cần khoá OpenRouter thật, môi trường cloud không có; gộp regex BM-1 và tách `tom_tat`
> (dọn mã, không đổi hành vi — để EN-6 cùng đợt gom khuôn).
1. **Node chạy sẵn** (pool 1–2, nhận việc theo từng dòng JSON, có timeout, tự khởi động lại, thay tiến trình sau N
   lượt) + **lời gọi gộp** "lá số + các ngày xem".
   - Tử vi luận giải 400 → khoảng 130 ms; Thời gian tới 490 → khoảng 150 ms (ước tính của agent E).
   - Golden 60 lá chạy qua cả đường cũ lẫn đường mới.
2. Hỏi đáp Tử vi chỉ dựng chương cần, không dựng cả 12 chương (355 ms → khoảng 40 ms).
3. **Lớp AI**:
   - nguồn = hộp + đoạn của chương; chương ngắn thì không gọi AI;
   - độ dài bản AI ≤ 1,5 lần nguồn;
   - **bộ kiểm chung** cho mọi lời gọi AI: số (cả số viết bằng chữ), tên sao/cung theo mảng, cụm cấm KB, liên kết, từ y tế;
   - kiểm từng câu AI viết phải trùng từ với nguồn (bắt ý mới);
   - xoá `/v1/thanso/van`;
   - client HTTP dùng chung, `max_tokens`, thử lại có giãn cách;
   - **lưu kết quả AI theo mã băm** (gói đầu vào + mô hình + bản prompt): xem lại không tốn lượt;
   - cập nhật mô hình mặc định (cần anh chọn, xem mục 4).
   
   Chạy lại bộ 55 câu AI thật (`docs/CHAY-55-CAU-AI-THAT.md`).
4. Gộp regex BM-1, làm nóng lúc khởi động, gom 3 bản logic HỌC về `kh.ap_hoc`, chuyển `tom_tat` ra module CALC riêng
   (xoá vòng import).

### EN-5 · Phép tính mới có giá trị cao (3–4 tuần) — khâu NẠP + THU HÚT
> **Trạng thái 2026-11-01: đã làm mục 1–4, mục 3 một phần, mục 5 để sau.**
>
> - **Mục 1 chọn ngày cho cả nhà** — `luangiai/chon_ngay_nhieu.py` + `/v1/lich/chon-ngay-nhieu`, khối "Chọn ngày cho cả
>   nhà" trên `/xem-ngay-tot`: ngày hợp việc theo sách lịch, không xung tuổi ai (≤ 8 người); người chính (cô dâu, chú rể,
>   người đứng tên) có lưu ý tháng xung tuổi, Kim lâu cô dâu, tuổi làm nhà, Tam tai (không loại ngày, xếp sau); 12 tháng có
>   nhãn ngắn + một khối giải thích; gợi ý năm âm không vướng. Chỉ nhập năm sinh, không lưu. **Bảng tháng đại lợi /
>   tiểu lợi theo tuổi cô dâu chưa đưa vào** — chưa tìm được nguồn đối chiếu (không bịa công thức).
> - **Mục 2 sao lưu năm Tử vi** — vị trí đọc từ iztro (Lộc Tồn, Kình Dương, Đà La, Thiên Mã, Khôi Việt, Xương Khúc lưu +
>   Thái Tuế, Tang Môn, Bạch Hổ lưu), đối chứng khẩu quyết 12 năm; lời đời thường KB `tuvi_sao_luu_kb.json` (nháp); khối
>   trong chương Vận hạn (tên sao chỉ ở "Vì sao nói vậy", khoá SAO-2 không lộ); hỏi đáp "năm nay có Kình Đà lưu không".
>   Sao lưu không đổi mức của năm.
> - **Mục 3 Bát tự** — Thai nguyên, Mệnh cung, Thân cung (+ nạp âm), tiểu vận trước khởi đại vận: golden 42 ca oracle
>   lunar-typescript; thần sát thêm Thiên Y, Hàm Trì (= Đào Hoa). **Chưa làm**: Thiên La Địa Võng, Học Đường, Kim Thần
>   (sách chép nhiều cách khác nhau, cần chủ dự án chọn phái); chọn ngày theo Bát tự cá nhân (cần cả ngày giờ sinh từng
>   người — để đợt sau, dùng lại khung mục 1).
> - **Mục 4 cửa sổ quyết định** — "có nên / khi nào … trong N tháng tới" → `luangiai/cua_so.py` dùng đúng hàm tháng của
>   Thời gian tới (Tử vi tháng âm, Bát tự tháng tiết), đoạn đầu câu trả lời nêu tháng thuận / tháng nên đi chậm, không
>   trả lời có/không.
> - **Mục 5 dòng mốc đời → hiệu chỉnh**: để sau — đối chiếu cách Bát tự (BT-DC) và định giờ sinh đã chạy riêng; gộp thành
>   một luồng chủ yếu là việc giao diện, giá trị engine thấp hơn các mục trên.
Xếp theo bằng chứng thị trường (agent D) × khả thi (agent B):
1. **Chọn ngày theo nhiều người** — cưới hỏi (cô dâu, chú rể, bố mẹ hai bên), khai trương (chủ + đối tác):
   - ghép Kim lâu cô dâu, tháng đại lợi / tiểu lợi, xung từng tuổi;
   - trả cửa sổ 12 tháng kèm lý do theo từng người, không điểm số;
   - người kia **tự nhập** qua link mời (Luật BVDLCN).
   
   Bằng chứng: "xem tuổi vợ chồng" là từ khoá hàng đầu của tuvi.vn; ~65% doanh thu Astrotalk đến từ câu hỏi hôn nhân;
   Lịch Việt bán "Chọn ngày tốt 1 năm".
2. **Tử vi sao lưu năm** trong vận hạn (lưu Kình, Đà, Lộc, Mã, Khôi Việt, Xương Khúc — iztro đã có; thêm lưu Thái
   Tuế / Tang Môn / Bạch Hổ). Người Việt hay hỏi "năm nay có Kình Đà lưu không".
3. **Bát tự**:
   - tiểu vận cho người chưa khởi vận;
   - thần sát hay hỏi: Thiên La Địa Võng, Hàm Trì, Học Đường, Kim Thần, Thiên Y…;
   - Mệnh cung, Thai nguyên;
   - **chọn ngày theo Bát tự cá nhân** (xung/hợp trụ ngày, dụng thần hai cách).
4. **Hỏi về một quyết định có khung thời gian** ("có nên đổi việc trong 6 tháng tới"): trả **cửa sổ tháng** thuận /
   cần lưu ý từ Thời gian tới + Bát tự 12 tháng tiết, kèm điều kiện và việc nên làm — không trả lời có/không. Dùng lại
   EN-3.
5. **Dòng mốc đời → hiệu chỉnh**: người dùng đánh dấu 3–5 mốc đã qua (lưu trên máy) → gộp đối chiếu cách Bát tự
   (BT-DC) và định giờ sinh thành một luồng "đọc theo cách khớp với đời bạn".

### EN-6 · Nền móng dài hạn (song song, mỗi đợt một ít)
- **Golden mở rộng trong CI**:
  - âm lịch toàn dải;
  - ~2.400 ngày mùng 1 lịch Trung Quốc;
  - 5.000 tứ trụ (gồm ca sát tiết, ca 23:xx);
  - hoàng lịch 1930–2030 dạng băm;
  - 1.000 lá Tử vi so lasotuvi;
  - test bất biến giờ Tý muộn;
  - test bảng múi giờ so với tzdata;
  - test tên có ký tự lạ.
- **Gom khuôn `doi_song_1`** cho Tử vi, Bát tự, Kinh Dịch, Phong thuỷ (đang tự viết hàm riêng), có golden bảo đảm mã
  mẫu không đổi (giữ phiếu kiểm chứng của người dùng).
- **Bộ đếm hạn mức ra kho chung** khi chạy nhiều tiến trình (cùng hạ tầng GĐ2).
- Khoá bản dependency (pydantic, anyio), cùng Python 3.12 giữa máy dev và image.
- **Đo theo người dùng thật**: tỉ lệ "Đúng với mình" theo mảng/chương (đã có số ở `/quan-tri/hoc`) làm thước đo chất
  lượng lời luận sau EN-2.

---

## 4. Cần anh quyết

1. **Ba sửa đổi biên làm đổi kết quả cũ** (gộp lên `ENGINE_VERSION` 0.1.6): BI-1 giờ miền Nam 1947–1955 · BI-2 giờ
   Tý muộn cuối tháng âm · BI-3 múi giờ nơi sinh ở nước ngoài cho Bát tự. Em khuyên **làm cả ba**: đều là sửa cho đúng
   quy tắc đã chốt, không phải đổi phái.
2. **Mô hình AI diễn đạt**: mặc định hiện là `anthropic/claude-3.5-sonnet` (đã cũ). Chọn mô hình mới qua OpenRouter
   (cân chất lượng tiếng Việt và chi phí; ước tính ~0,08–0,12 USD/báo cáo với mô hình cỡ Sonnet, sẽ giảm mạnh khi lưu
   kết quả theo mã băm).
3. **Luật Trí tuệ nhân tạo 134/2025** (hiệu lực 01/3/2026, agent D): bắt buộc gắn nhãn nội dung AI và báo trước khi
   người dùng tương tác với AI. "Hỏi đáp chuyên sâu" đã bỏ chữ AI ở tiêu đề (HD-CS) → **nên hỏi luật sư**, ghi vào
   `docs/PHAP-LY-2026.md`.
4. **Sản phẩm mới ngoài 4 mảng** (agent D đề xuất, em **chưa** đưa vào lộ trình), mỗi mục một quyết định:
   - **Báo cáo chủ đề giá thấp** 9–15 Sao ("Tình duyên 2027", "Tiền & việc 2027") — hạ ngưỡng nạp lần đầu, rủi ro ăn
     bớt báo cáo 29 Sao.
   - **Đặt tên con** theo ngũ hành / Bát tự (dịch vụ thị trường từ 495.000 ₫; KB lớn, nguồn không thống nhất).
   - **Sổ người thân + nhịp quan hệ** (giống Co–Star/The Pattern; dữ liệu người thứ ba).
   - **Bản đồ nhóm** 3–8 người (đẩy lan truyền qua nhóm Zalo; phải tránh so năng lực).
   - **Xem số** SIM / biển số (từ khoá dài; không gắn bán số).
   - **Tarot** Rider–Waite 1910 (người trẻ; lệch phạm vi 4 mảng).
   - **Đọc thành tiếng** (cần dịch vụ ngoài + nhãn AI).

## 5. Thứ tự em đề xuất

**EN-1 ngay** (an toàn + đúng, ~1 tuần) → **EN-2** (lời luận, đẩy nạp Sao) → **EN-3** (hỏi đáp v2) → **EN-4**
(hiệu năng + AI, trước khi mở quảng cáo / GĐ2) → **EN-5** (chọn ngày nhiều người trước, kịp mùa cưới cuối năm và Tết)
→ EN-6 xen kẽ.

## Phụ lục — dữ liệu của các agent
- Bộ câu hỏi mới đã gắn nhãn: `engine/fixtures/cau_hoi/holdout_v2.jsonl` (261 câu, đóng băng; mỗi vòng viết thêm
  ~100 câu mới thay vì sửa câu cũ).
- Script đo câu trùng, latency, oracle: nằm trong thư mục tạm của phiên này. EN-1/EN-2 sẽ đưa bản sạch vào
  `engine/scripts/` (đo câu trùng, bench route, kiểm âm lịch toàn dải).
- Nguồn thị trường: báo cáo agent D (semrush, ahrefs, App Store, Statista, báo VN — URL trong báo cáo; số liệu doanh thu
  app phần lớn là ước tính của bên thứ ba).
