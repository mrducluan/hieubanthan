# Kiến trúc Huyền học — Tử vi · Kinh Dịch · Bát tự · Phong thuỷ

> Lập 2026-09-30. Nền: kho **2.031 câu hỏi có nhãn** (`engine/fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl`),
> mốc đo **0%** (chưa module nào có hỏi đáp). Dùng lại khung đã chứng minh ở thần số v2
> (`docs/KIEN-TRUC-THANSO-V2.md`: 0% → 90,2%). Không đổi 4 tầng của CLAUDE.md.

## 1. Nguồn tri thức (danh mục chủ dự án) và cách dùng

| # | Mảng | Cổ thư | Dùng cho | Trạng thái nguồn |
|---|---|---|---|---|
| 1 | Dịch lý cốt lõi | 《周易》 Chu Dịch (quái từ, hào từ, Thập Dực) | KB 64 quẻ, phái Nghĩa Lý | Nguyên văn công cộng; ctext.org/book-of-changes |
| 2 | Phong thuỷ khởi nguyên | 《葬書》 Táng Thư — Quách Phác | KB âm trạch, khái niệm "khí thừa phong tắc tán" | ctext res=404104 |
| 3 | Loan đầu | 《撼龍經》《疑龍經》 — Dương Quân Tùng | KB loan đầu (hình thế, long mạch) | ctext res=889417 |
| 4 | Dương trạch | 《陽宅三要》 — Triệu Cửu Phong | Luật Cửa–Chủ–Bếp, Bát trạch | ctext res=946958 |
| 5 | Mệnh lý | 《滴天髓》 — Kinh Đồ / Lưu Bá Ôn / Nhậm Thiết Tiều | Khí thế, vượng suy, dụng thần (cách 2) | ctext chapter=126492 |
| 6 | Mệnh lý | 《淵海子平》 — Từ Tử Bình | Lấy can ngày làm trung tâm, thập thần | ctext res=307303 |
| 7 | Mệnh lý | 《子平真詮》 — Thẩm Hiếu Chiêm | Cách cục, dụng thần theo nguyệt lệnh (cách 1) | ctext res=413248 |
| 8 | Bốc Dịch | 《梅花易數》 — Thiệu Ung | Khởi quẻ theo thời gian/tượng, thể–dụng | ctext res=778643 |
| 9 | Bốc Dịch | 《增刪卜易》 — Dã Hạc Lão Nhân | Lục Hào: dụng thần, vượng suy, ứng kỳ | ctext res=958742 |
| — | Tử vi | *(danh mục chưa có)* — Tử Vi Đẩu Số Toàn Thư, khung Nam phái trong skill `tuvi-vn` | KB sao × cung, tứ hoá | Bổ sung sau |

**Quy tắc nguồn:** nguyên văn chữ Hán là công cộng; bản dịch Việt hiện đại có thể còn bản
quyền → **không chép**, chỉ tự diễn giải và trích dẫn tới sách/chương. Mọi mục KB có
`source_id` (mã sách), `school_id` (phái), `trich_dan` (chương/tiết), `trang_thai`.
Môi trường cloud hiện **chặn ctext.org** → bản nháp đầu soạn từ kiến thức sẵn có, gắn
`trang_thai = nhap_ai` và `can_doi_chieu = true`; khi mở mạng sẽ chạy vòng đối chiếu nguyên văn.

## 2. Luồng chung (dùng lại khung thần số v2)

```
câu hỏi + module + dữ liệu (ngày giờ sinh / quẻ đã gieo / hướng nhà)
   └► RULES: phân loại tất định (an toàn > ngoài phạm vi > kỹ thuật > hai người > lĩnh vực)
        └► CALC module: lá số / quẻ + thể dụng + vượng suy / tứ trụ + thập thần / mệnh quái + 8 hướng
             └► KB module: chỉ đúng khối cần → GÓI BẰNG CHỨNG (source_id, school_id, trích dẫn)
                  └► NARRATIVE: template tất định | LLM diễn đạt gói → bộ kiểm tra (số lạ, cụm tiên đoán)
                       └► nhật ký ẩn danh → vòng tự cải thiện
```

Chế độ luận (quyết định 2026-09-30, "cả hai/cả ba"):
- **Tử vi:** `tham_khao` (mặc định: xu hướng, hạn = chủ đề giai đoạn) · `chi_tiet` (bật tay:
  luận cát hung năm/hạn kiểu thị trường). Cả hai vẫn chặn: khủng hoảng, ngày chết, chẩn đoán bệnh,
  xổ số, tuyển dụng.
- **Kinh Dịch:** `tu_dong` (mặc định: "có nên/ứng xử" → Nghĩa Lý; "thành bại/bao giờ" → Lục Hào,
  dụng thần chọn theo loại việc; đọc nhanh → Mai Hoa) · `nghia_ly` (chỉ phản tư) · `day_du`
  (thành bại + ứng kỳ). Quẻ luôn do engine gieo hoặc người dùng gieo tay — **LLM không chọn quẻ**.
  Gieo lại cùng câu: `tu_dong`/`nghia_ly` gắn cờ và khuyên không gieo lại trong 30 ngày;
  `day_du` cho phép nhưng vẫn gắn cờ.

## 3. Từng module

### 3.1 Tử vi (đã có CALC iztro 2.6.0)
- CALC thêm: lưu niên / lưu tháng / đại hạn đang chạy qua `astro.horoscope()` của iztro (cùng bản ghim);
  xác định tam phương tứ chính, sát tinh chiếu.
- KB: 12 cung (ý nghĩa, câu tự soi) · 14 chính tinh (tính chất, mặt tối) · 14 × 12 sao-cung ·
  độ sáng miếu/vượng/đắc/bình/hãm · tứ hoá × 12 cung · phụ tinh chính (Tả Hữu, Xương Khúc, Khôi Việt,
  Lộc Tồn, Kình Đà, Hoả Linh, Không Kiếp, Đào Hồng Hỷ) · Tuần/Triệt (đã có engine) · chủ đề hạn.
- Hợp hôn: so cung Mệnh/Phu Thê hai lá (không phán "khắc").

### 3.2 Kinh Dịch (đã có khởi quẻ + nạp giáp + lục thân)
- CALC thêm: **Mai Hoa theo thời gian** (năm/tháng/ngày/giờ âm lịch → thượng/hạ quái, hào động),
  **thể–dụng** sinh khắc; **Lục Hào**: nguyệt kiến + nhật thần (cần tiết khí và can chi ngày),
  tuần không, vượng suy của dụng thần, ứng kỳ cơ bản.
- KB: 64 quẻ (tượng, quái từ tóm ý, ý nghĩa theo 5 lĩnh vực, mặt tối, câu tự soi) · 384 hào (tóm ý) ·
  bát quái (tượng, ngũ hành) · luật thể–dụng · dụng thần theo loại việc.

### 3.3 Bát tự (mới)
- CALC: **tiết khí chính xác** (dùng chung Lục Hào) · tứ trụ (tháng theo tiết, ngày theo can chi
  ngày, giờ theo `SWITCH_AT_0000` của bát tự — gắn cờ Tý muộn) · tàng can · thập thần · đếm ngũ hành
  · thân vượng/nhược (thang điểm công bố rõ) · đại vận (thuận/nghịch, tuổi khởi vận) · lưu niên.
  Golden: `lunar-typescript` (6tail, MIT — đã có trong `engine/ziwei/node_modules` do iztro kéo theo,
  chỉ dùng để SINH golden, không chạy runtime).
- KB: 10 nhật chủ · 10 thập thần × vị trí trụ · ngũ hành thừa/thiếu · cách cục chính (Tử Bình Chân
  Thuyên) · luật dụng thần hai cách (Chân Thuyên: nguyệt lệnh; Trích Thiên Tuỷ: phù ức/điều hậu) —
  **luôn trình bày cả hai khi lệch nhau**, không tự chọn.

### 3.4 Phong thuỷ (mới)
- CALC: mệnh quái (năm sinh + giới tính, mốc Lập xuân) · Đông/Tây tứ mệnh · 8 hướng du niên
  (Sinh Khí, Thiên Y, Diên Niên, Phục Vị, Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Hoạ Hại) · trạch quái theo
  hướng cửa (toạ) · tổ hợp Cửa–Chủ–Bếp (Dương Trạch Tam Yếu) · Ngũ Hoàng/Thái Tuế theo năm (tuỳ chọn).
- KB: 8 du niên · 8 trạch · luật Cửa–Chủ–Bếp · loan đầu định tính (Táng Thư, Hám Long) · các câu hỏi
  bố trí nội thất phổ biến (gương, xà, bếp–WC) **ghi rõ là quan niệm dân gian** khi không có trong cổ thư.

## 4. Kế hoạch (mỗi giai đoạn một PR, tiêu chí xong đo bằng kho câu hỏi)

| GĐ | Nội dung | Tiêu chí xong |
|---|---|---|
| HH-0 | Kho câu hỏi 4 mảng, đo mốc, tài liệu này | ✅ kho 2.031 câu, mốc 0% |
| HH-1 | Lõi hỏi đáp dùng chung + **Kinh Dịch** (KB 64 quẻ, Mai Hoa, thể–dụng, chọn phái) | Kinh Dịch ≥ 85% có căn cứ |
| HH-2 | **Tử vi** Q&A (KB sao × cung, tứ hoá, lưu niên, 2 chế độ) | Tử vi ≥ 85% |
| HH-3 | **Bát tự** (tiết khí, tứ trụ, thập thần, đại vận — golden oracle), Lục Hào vượng suy | golden 100%, Bát tự ≥ 80% |
| HH-4 | **Phong thuỷ** (mệnh quái, bát trạch, cửa–chủ–bếp) | golden 100%, Phong thuỷ ≥ 80% |
| HH-5 | Skill `huyenhoc-kb` + vòng tự cải thiện đa module, đối chiếu ctext khi mở mạng | vòng chạy được, báo cáo |

## 5. Ranh giới giữ nguyên ở mọi chế độ
Khủng hoảng → hỗ trợ (115/113/111) · không dự đoán ngày chết, không chẩn đoán bệnh, không xổ số,
không dùng để tuyển/sa thải · không phán "khắc" người thứ ba · phong thuỷ không bán vật phẩm "hoá giải".
