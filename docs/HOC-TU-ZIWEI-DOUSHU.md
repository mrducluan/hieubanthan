# Học từ repo `Renhuai123/ziwei-doushu` (2026-11-04)

Chủ dự án giao: nghiên cứu repo Tử vi mã nguồn mở này, học tính năng hay, bổ sung cái còn thiếu cho HieuBanThan.
Ba agent phân tích độc lập (engine an sao · giao diện/sản phẩm · cổ thư + giấy phép), em tổng hợp và chọn việc làm.

## 1. Giấy phép — được lấy gì

| Phần của repo | Giấy phép | Với HieuBanThan |
|---|---|---|
| Mã `lib/`, `app/`, `components/` | MIT | Được đọc lấy ý tưởng; không chép mã (stack khác: engine mình là Python) |
| Bộ dữ liệu 518.400 / 674.976 lá số | CC BY 4.0 (bắt buộc ghi nguồn công khai) | **Không dùng** — trái BM-1 (không nêu nguồn nội bộ), lại theo phái Nghê Hải Hạ, không cần |
| Lời giảng Nghê Hải Hạ (`docs/tianji-ziwei/`, `lib/nihai/*`, `heming-knowledge.ts`) | CC BY-NC-SA 4.0 — **cấm thương mại** | **Không dùng** (site bán Sao). Nhiều câu còn phán hung ("非生离即死别"), gắn sao với bệnh |
| "Cổ thư" `lib/classics/data/*` (Cốt Tủy Phú, Toàn Tập, Toàn Thư) | Ghi "công cộng" | **Không phải nguyên văn**: văn hiện đại viết giả giọng cổ (chữ giản thể, gạch ngang, từ "逆袭", "气场"). Câu thật như "命無正曜，夭折孤貧" không có. Không dùng, kể cả để đối chiếu |

## 2. So sánh

**Engine** — repo kia là iztro + "bản vá trường phái" giống phần mềm Trung Quốc. Mình đã hơn ở: âm lịch Việt, độ sáng Nam phái
đối chứng lasotuvi, phi hoá 48 đường, lưu nguyệt 5 phái, luận giải đời sống 12 chương. Họ hơn mình ở:
- **Cách cục**: 41 hàm có điều kiện *cần / cộng / phá* theo độ sáng; mình 62 cách nhưng phá cách chỉ là "có sát tinh ở tam phương".
  Họ có ~12 cách mình chưa có (Đồng Lương, Liêm Tướng, Vũ Sát, Tử Vi độc toạ thiếu Tả Hữu, Kỵ nhập Thiên Di, Liêm Sát Dương,
  Cự Hoả Dương, Linh Xương Đà Vũ, Lộc Tồn thủ Mệnh/Thân, Thiên Mã, Khoa Quyền hội, ba sao Cơ Nguyệt Đồng Lương).
  Một số điều kiện của họ **sai** (Minh châu xuất hải, Phủ Tướng triều viên) — mình giữ bản cổ điển.
- **Tháng nhuận**: họ có 4 cách, mình có 2 — thiếu "cả tháng nhuận tính tháng sau".
- **Vòng Tướng tiền / Tuế tiền theo đại hạn và năm**: mình chỉ đọc Tuế tiền năm.
- **Test bất biến** (12 cung khác nhau, Phủ–Tướng cách 4, Sát Phá Tham một tam hợp, Kình Đà kẹp Lộc Tồn, mọi cách cục phải
  xuất hiện ít nhất một lá) — mình chưa có loại test này.

**Giao diện** — phần luận giải, hợp hôn, thẻ chia sẻ của họ *không mở mã* (README tự ghi); nhiều thành phần không trang nào dùng.
Đáng học: **vẽ tứ hoá đại hạn/lưu niên lên lá số** (engine mình đã tính nhưng web chưa vẽ), **bấm sao mở chi tiết sao**,
khung cách cục tách điều kiện, (thiếu ở cả hai) dải nhảy nhanh theo đại hạn.

## 3. Làm đợt này

| # | Việc | Khâu vòng tăng trưởng · đo bằng |
|---|---|---|
| 1 | ~12 cách cục mới (thêm CUỐI `DANH_SACH`, mã cũ không đổi) + điều kiện có / điểm cộng / điểm trừ | QUAY LẠI / NẠP (lời luận có căn cứ hơn) · tỉ lệ "Đúng với mình" `ds.*.cach.*` |
| 2 | Test bất biến lá số + test độ phủ cách cục trên bộ golden | nền móng (lá số đúng mới giữ được niềm tin) |
| 3 | Tứ hoá đại hạn / lưu niên vẽ trên lá số + dòng tóm tắt năm | QUAY LẠI (mỗi năm có cái mới để xem) · `chart_interacted{kind=doi_nam\|lop_han}` |
| 4 | Bấm sao → chi tiết sao, "Đọc kỹ" sang trang sao ở cung, "Hỏi về sao này" | THU HÚT (link vào silo) · `chart_interacted{kind=chon_sao\|hoi_sao}` |
| 5 | Dải 12 đại hạn bấm để nhảy năm | QUAY LẠI · `chart_interacted{kind=nhay_dai_han}` |
| 6 | Tuỳ chọn tháng nhuận "cả tháng tính tháng sau" (mặc định không đổi) | nền móng trường phái |
| 7 | Vòng Tướng tiền / Tuế tiền theo đại hạn + năm (engine trả, web vẽ đợt sau) | nền móng |

## 4. Không làm và vì sao

- **"Người nổi tiếng có lá số giống bạn"** (`famous.ts`, 12 người thật, giờ sinh nhiều chỗ "ước chừng"): ngày sinh người nổi tiếng vẫn là
  dữ liệu cá nhân (Luật 91/2025); giờ đoán + lời phán chạm danh dự, uy tín (BLDS Điều 32/34); trái EEAT-1/BM-1.
  **Thay bằng** (đề xuất, chờ duyệt): "X % ngày sinh 1940–2010 có cùng chính tinh Mệnh với bạn" — tính như `thanso_ty_le.py`,
  ghi rõ "cùng sao Mệnh, không cùng số phận", gắn vào thẻ Bản đồ 5 mảng.
- Ngày/giờ lưu tứ hoá, đồng hạn (童限), Khôi Việt bản Tân năm đổi, Đại Hao theo chi năm: trái quyết định đã chốt hoặc là quy ước
  Trung Quốc không có ở sách Việt.
- Giờ mặt trời thực tự đổi giờ: đã chốt chỉ cảnh báo (`SOLAR_TIME_ADJUST=False`).
- Ngày sinh dạng chữ trên URL chia sẻ (`share.ts`): trái quy tắc link ký HMAC.

## 5. Đề xuất đợt sau (chờ chủ dự án)

1. **Cụm "Cốt Tủy Phú"** `/tu-vi/co-thu/cot-tuy-phu`: nguyên văn chữ phồn thể từ bản in thật (Tục Đạo Tạng / Tứ khố — đọc tay hoặc
   API trả phí ctext, không cào), phiên âm Hán Việt, nghĩa đời thường (nháp), mỗi câu nối trang cách cục / sao ở cung + dòng tính
   "câu này ứng với lá số bạn khi …". Lấp 47 cách cục chưa có `co_ca`. Công: L.
2. Vẽ vòng Tướng tiền / Tuế tiền vận hạn trên lá số (engine đã trả ở đợt này).
3. ~~"Cùng sao Mệnh" thay người nổi tiếng (mục 4).~~ **Đã làm (TV-ZW-CSM, 2026-11-04)**:
   CALC `engine/app/calc/tuvi_sao_menh.py` — đường tính nhanh chính tinh cung Mệnh bằng Python thuần (cung Mệnh theo tháng ×
   giờ, Ngũ Hổ Độn → Cục nạp âm, an Tử Vi theo ngày âm + Cục, 13 sao còn lại `tuvi_vi_tri`; nửa sau tháng nhuận tính tháng
   sau, Tý muộn = Tý ngày sau) **chỉ để đếm mẫu**, test khoá trùng iztro trên 1.000 lá `lasotuvi_1000` + ~130 ngày dễ lệch;
   lá số người dùng vẫn do iztro an. Bảng `engine/app/calc/data/tuvi_sao_menh_ty_le.json` (50 tổ hợp, mọi ngày 1940–2010 ×
   12 canh = 311.196 thời điểm, âm lịch Việt UTC+7 cả nước — không phải thống kê dân số) dựng bằng
   `engine/scripts/sinh_tuvi_sao_menh.py`, test dựng lại toàn bộ và so từng số. Một sao đứng một mình ≈ 4,1–4,3 % (1 trong
   ~23), cặp sao / vô chính diệu ≈ 1,3–1,5 % (1 trong ~70) → ngưỡng "khá phổ biến" ≥ 3 %, dưới là "ít gặp". RULES
   `luangiai/cung_sao_menh.py` + KB `tuvi_cung_sao_menh_kb.json` (nháp): câu "Cùng sao Mệnh, **không cùng cuộc đời**" (cụm
   "số phận" nằm trong `cum_cam` nên không dùng). `/v1/tuvi/an-sao` trả `cung_sao_menh` (null khi không biết giờ); web
   `/tu-vi` một dòng dưới dải đại hạn (`CungSaoMenh.tsx`), thẻ Bản đồ 5 mảng mang thêm `r` (1 trong r lá số — chỉ tỉ lệ
   trên mẫu, không suy ra ngày giờ sinh; mã cũ vẫn đọc được). Đo `chart_interacted{kind: cung_sao_menh}` khi mở "Vì sao
   nói vậy".
4. "Lá số người thân" lưu trên máy (≤ 5) — cần chủ dự án quyết vì là dữ liệu người thứ ba.
