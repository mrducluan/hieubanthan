---
name: do-y-dinh
description: Đo "ý định hôm nay" của HieuBanThan — đếm ý định người dùng chọn/gõ nhiều nhất và các NHÓM VIỆC trong câu gõ mà engine chưa nhận ra (chỉ đếm mã, không lưu câu), rồi bổ sung từ khoá nhận diện ý định trong engine theo số thật, có test trước/sau. Kích hoạt khi nghe "đo ý định", "ý định hôm nay", "câu gõ không nhận ra", "bổ sung từ khoá Hôm nay", "intent", hoặc theo lịch định kỳ (2 tuần một lần).
---

# Đo ý định hôm nay (HN-2 → vòng cải thiện từ khoá)

Trang `/hom-nay` cho người dùng chọn ≤ 3 ý định (11 mã) hoặc gõ một câu. Engine nhận diện ý định bằng luật từ khoá
`TU_KHOA_Y_DINH` trong `engine/app/luangiai/hom_nay.py`. Câu gõ **không bao giờ được lưu hay gửi đi** — kể cả cho
việc đo. Vì vậy việc đo chỉ dựa trên **mã**:

| Số đo | Nguồn | Ý nghĩa |
|---|---|---|
| Ý định hay chọn nhất | sự kiện PostHog `daily_intent_set`, thuộc tính `y_dinh` (mã nối dấu phẩy) | Nội dung nào cần viết sâu thêm trong `thanso_hom_nay.json` |
| Tỉ lệ câu gõ không nhận ra | `daily_intent_set` có `go_tay = 1` và `nhan_ra = 0` | Từ khoá đang thiếu bao nhiêu |
| Nhóm việc trong câu không nhận ra | thuộc tính `nhom_chua_ho_tro` = mã trong `NHOM_CHUA_HO_TRO` (từ điển CỐ ĐỊNH, engine trả về) | Người dùng hay định làm gì mà ta chưa phục vụ |

## Hợp đồng

- **Không lưu câu gõ**, không thêm trường nào chứa chữ người dùng gõ vào sự kiện/nhật ký. Chỉ mã trong từ điển cố định.
- Câu khủng hoảng luôn đi nhánh hỗ trợ (115/113/111) trước mọi nhận diện — test `test_hom_nay_y_dinh.py` giữ nguyên.
- Thêm từ khoá = thêm **test trước** (câu mẫu tự soạn, không lấy câu thật của người dùng).

## Các bước

1. **Lấy số** (cần `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` — chủ dự án đặt ở Vercel; trong phiên không có
   khoá thì nhờ chủ dự án mở `/quan-tri/tang-truong` → khung "Ý định hôm nay" và gửi ảnh/số). HogQL tham khảo:
   ```sql
   SELECT arrayJoin(splitByChar(',', toString(properties.y_dinh))) AS ma, count() AS n
   FROM events WHERE event = 'daily_intent_set' AND timestamp > now() - INTERVAL 14 DAY
   GROUP BY ma ORDER BY n DESC
   ```
   ```sql
   SELECT arrayJoin(splitByChar(',', toString(properties.nhom_chua_ho_tro))) AS nhom, count() AS n
   FROM events WHERE event = 'daily_intent_set' AND properties.nhan_ra = 0 AND timestamp > now() - INTERVAL 14 DAY
   GROUP BY nhom ORDER BY n DESC
   ```
2. **Đọc**: tỉ lệ `nhan_ra = 0` trên `go_tay = 1`. Mục tiêu < 25%. Nhóm "khac" lớn → cần thêm mục vào
   `NHOM_CHUA_HO_TRO` (đoán theo thị trường, không theo câu thật).
3. **Sửa**:
   - Nhóm chưa hỗ trợ nào gần với một ý định có sẵn (vd `di_cho` ≈ `chi_tieu`) → chuyển từ khoá sang
     `TU_KHOA_Y_DINH[ma]`, xoá khỏi `NHOM_CHUA_HO_TRO`.
   - Nhóm đủ lớn mà không khớp ý định nào (vd `kham_benh`, `le_bai`) → đề xuất ý định MỚI cho chủ dự án (cần nội dung
     KB `thanso_hom_nay.json` + mã lucide icon), không tự thêm.
   - Từ khoá mới: viết câu mẫu vào `engine/tests/test_hom_nay_y_dinh.py` trước, rồi thêm regex (đã bỏ dấu, khớp nguyên
     từ — xem `chung.dem`).
4. **Kiểm**: `cd engine && python -m pytest tests/test_hom_nay_y_dinh.py tests/test_hom_nay.py -q` + e2e
   `web/e2e/hom-nay.spec.ts`.
5. **PR**: bảng số trước/sau (tỉ lệ không nhận ra, top 5 nhóm), ghi khâu vòng tăng trưởng = QUAY LẠI.
