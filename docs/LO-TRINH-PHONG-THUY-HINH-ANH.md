# Lộ trình: Phong thuỷ xem qua ảnh / video (PT-V)

> Trạng thái: **LỘ TRÌNH chờ duyệt** (2026-09-30). Chưa code. Bổ sung sau HH-4 (Phong thuỷ Bát trạch hiện có).

## 1. Mục tiêu

Người dùng chụp vài tấm ảnh hoặc quay một đoạn video ngắn quanh nhà; hệ thống **nhận diện bố cục** (cửa chính, bếp,
giường, bàn làm việc, gương, cầu thang, xà ngang, nhà vệ sinh…), kết hợp **hướng thật** (la bàn điện thoại) và mệnh
quái của gia chủ, rồi luận theo kho tri thức có nguồn — như cách một người xem phong thuỷ đến tận nhà.

## 2. Nguyên tắc kiến trúc (giữ đúng 4 tầng — CLAUDE.md)

```
Ảnh/video ──► [THỊ GIÁC: LLM đa phương thức] ──► JSON sự kiện bố cục (có độ tin)
                                                  │  người dùng XÁC NHẬN / sửa
La bàn điện thoại ──► hướng cửa, hướng bếp (độ) ──┤
Hồ sơ (năm sinh, giới tính) ──► mệnh quái (CALC) ─┤
                                                  ▼
                               [RULES] bát trạch / tình huống bố trí (KB có nguồn)
                                                  ▼
                               [NARRATIVE] diễn đạt, không thêm dữ kiện
```

- LLM thị giác **chỉ trích xuất sự kiện** ("cửa chính ở giữa tường phía trước; bếp đối diện cửa; gương đối diện
  giường"), **không phán cát hung**. Cát hung do tầng RULES (đã có ở HH-4) quyết định từ JSON đã được người dùng xác nhận.
- **Hướng không đoán từ ảnh** (ảnh không biết Bắc ở đâu): lấy từ la bàn điện thoại (`DeviceOrientationEvent`, iOS cần xin
  quyền) hoặc người dùng nhập tay; luôn nhắc đứng xa thiết bị kim loại, hiệu chỉnh độ lệch từ.
- **Quyền riêng tư** (CLAUDE.md: *không lưu ảnh người dùng*; NĐ 13/2023): ảnh xử lý tạm trong bộ nhớ, gửi tới model rồi
  bỏ; xoá EXIF/GPS phía trình duyệt trước khi gửi; nhắc không chụp mặt người; chỉ lưu JSON bố cục nếu người dùng bấm lưu.
- **Chi phí**: video tách khung phía trình duyệt (8–12 khung đại diện, nén ~1024px) thay vì gửi cả video; mỗi lượt xem
  tiêu Sao (xem `docs/DE-XUAT-KINH-TE-CONG-DONG.md`) vì model thị giác tốn tiền thật.
- Model qua **OpenRouter** (stack đã chốt), chọn model đa phương thức rẻ nhất đạt ngưỡng chất lượng trên bộ đánh giá —
  không ghim cứng nhà cung cấp.

## 3. Các bước

| Bước | Nội dung | Tiêu chí xong |
|---|---|---|
| **PT-V0** Bộ đánh giá | 50–100 bộ ảnh nhà thật (có phép dùng) + nhãn tay JSON bố cục; định nghĩa schema `bo_cuc.schema.json` | Schema duyệt; bộ nhãn đủ 10 loại phòng |
| **PT-V1** La bàn + hướng | Màn "Đứng ở cửa chính, hướng điện thoại ra ngoài": đọc la bàn, làm tròn 8 hướng/24 sơn, cho sửa tay | Sai ≤ 15° so với la bàn thật trên 3 máy iOS/Android |
| **PT-V2** Ảnh → bố cục | Tải 1–10 ảnh → LLM thị giác → JSON + độ tin → màn xác nhận (bấm đúng/sai từng mục) | ≥ 90% mục đúng trên bộ đánh giá; không lưu ảnh (kiểm bằng test) |
| **PT-V3** Luận từ bố cục | Nối JSON đã xác nhận vào RULES bát trạch + tình huống bố trí (HH-4) → bài đọc 3 lớp ĐÃ TÍNH / DIỄN GIẢI / TỰ SOI | Mỗi kết luận trỏ tới mục KB có nguồn |
| **PT-V4** Video | Quay 20–40 giây đi quanh nhà → tách khung phía trình duyệt → như PT-V2 | Chi phí mỗi lượt ≤ ngưỡng đặt ra; thời gian < 30 giây |
| **PT-V5** Sơ đồ mặt bằng | Tuỳ chọn: tải ảnh sơ đồ / vẽ nhanh 9 cung (cửu cung) để luận theo cung | Người dùng tự kéo thả phòng vào ô |

## 4. Rủi ro

- **Ảo giác thị giác** (model tưởng có gương, nhầm cửa sổ là cửa chính) → luôn có bước người dùng xác nhận; hiển thị độ tin.
- **Bán vật phẩm "hoá giải"** → cấm như HH-4; không gợi ý mua đồ.
- **Chi phí** vượt doanh thu → giới hạn số ảnh, tính bằng Sao, đo chi phí/lượt ở PostHog (sự kiện có `chi_phi_uoc_tinh`).
- **Pháp lý**: ảnh nhà có thể lộ địa chỉ, người thân → xoá EXIF, cảnh báo trước khi chụp, không lưu.
