# NT-2 — Ảnh đo được thì trả lời luôn: rà engine Nhân tướng sau "Quét 3 góc"

Chủ dự án báo (2026-11-09): quét đủ 3 góc mà bài đọc vẫn ghi "Bạn chưa trả lời câu nào về Chuẩn Đầu, Lan Đài, Lưỡng
Quyền, Miệng…" ở chương Công việc & tiền, Tình cảm & gia đình. Khâu QUAY LẠI, đo `chart_interacted{kind=do_mat_xac_nhan,
xem_luon}` → `bai_doc`, và số chương còn `thieu` trên bài đọc dựng từ ảnh.

## 1. Vì sao chụp đủ ảnh vẫn phải trả lời

1. **Phép đo chỉ "trả lời hộ" khi nét lệch hẳn** (`calc/nhan_tuong_do.py`). Mặt cân đối — phần lớn người dùng — chỉ ra
   2 câu (ba đình + dáng mặt nếu lệch); cánh mũi, miệng, hàm, mắt, Ấn Đường nằm trong khoảng thường thì để trống, nên các
   chương báo thiếu. Đây là lỗi chính.
2. **Ảnh nghiêng vừa quét chưa được dùng** cho tới khi người dùng tự chấm 9 điểm đường viền (ANH-4).
3. **Nhiều bước**: đồng ý → bấm Đo → tích từng nét → "Dùng" → "Xem bài đọc".
4. **Có những điều ảnh thật sự không thấy**: độ đầy thịt (ấn tay), sắc da dưới ánh sáng thật, nếp nhăn, ánh mắt, giọng,
   dáng đi, xương gáy. 31 câu khảo sát: ảnh thẳng đo được 12 câu, ảnh nghiêng thêm 4 câu (trán, gốc mũi, sống mũi, cằm).

## 2. Ba cách làm

| | Cách | Được | Mất |
|---|---|---|---|
| A | AI nhìn ảnh đoán đủ 31 câu | Không còn khảo sát | Đoán sắc da, ánh mắt, độ đầy thịt từ ảnh điện thoại là bịa; dữ liệu sinh trắc gửi ra ngoài (ANH-1 vẫn tắt) |
| **B** | **Mỗi câu đo được đều có câu trả lời (kể cả "vừa"), máy tự đo, một nút xem bài đọc; câu ảnh không thấy thì nói rõ** | Đúng điều đo được, chương nào cũng có nội dung, ít bước | Vẫn còn ~19 câu tuỳ chọn cho người muốn bài đọc dày hơn |
| C | Đo thêm độ sâu bằng toạ độ z của lưới MediaPipe | Có thể đoán trán gồ, sống mũi cao | z của mô hình bị kéo về mặt trung bình, chưa có dữ liệu thật để hiệu chỉnh ngưỡng → độ chính xác giả |

**Chọn B.**

## 3. Đã làm

- **Engine** (`calc/nhan_tuong_do.py`, test viết trước `tests/test_nhan_tuong_do_vua.py`): nét trong khoảng thường →
  lựa chọn mới `vua` / `can_doi` (cờ `vua: true`) cho dáng mặt, Ấn Đường, mắt, cánh mũi, miệng, Nhân Trung, quai hàm;
  trán hẹp đo theo bề ngang (`tran_hep` 0,86). Không đoán những gì cần độ sâu / sắc (cao rộng đầy, dày kín, sâu nông):
  cánh mũi hẹp hơn 0,8 hay Nhân Trung dài ≥ 0,42 → để trống. Mặt quay ngang → không trả lời "vừa". Ảnh nghiêng thấy nét
  rõ thì **thắng** câu "vừa" của ảnh thẳng.
- **KB** `nhan_tuong_kb.json`: 7 lựa chọn mới + 7 đặc điểm (nháp, nói rõ phần ảnh không đo được và việc tự soi tiếp);
  lời "chưa trả lời" nói rõ phần nào ảnh chưa đo được.
- **Web**: đã đồng ý đo từ trước + máy tự đặt đủ điểm → **tự đo**; danh sách tách "nét nổi bật" / "nét cân đối"; một
  nút **"Dùng N nét và xem bài đọc"** (vẫn là người dùng xác nhận); dòng "Ảnh không đo được N câu còn lại…".
- Kết quả: mặt cân đối mẫu từ 1 câu → 8 câu; bài đọc dựng chỉ từ ảnh có đủ 6 chương nội dung (2 chương còn lại cần năm
  sinh / giờ sinh). Engine 9.654 test, e2e Nhân tướng 19/19.

## 4. Việc tiếp (đề xuất, chưa làm)

1. **Tự đặt sẵn 9 điểm đường viền trên ảnh nghiêng** từ lưới MediaPipe (người dùng kéo chỉnh như ảnh thẳng) — cần thử
   trên ảnh nghiêng thật vì máy quét chụp ở ~55–70°, chưa hẳn 90°.
2. **Tam bạch** (lòng trắng lộ dưới / trên tròng đen) đo từ 10 điểm mống mắt có sẵn trong lưới — chính xác, ít rủi ro.
3. **Sắc tương đối** trong cùng một ảnh (Ấn Đường so với trán, dưới mắt so với gò má) — chỉ gợi ý, người dùng xác nhận.
4. Ngưỡng `vua` vẫn là ngưỡng biên tập theo nhân trắc phổ biến, chờ chuyên gia duyệt (`can_doi_chieu`).
