# hieuban.com — CV Microservice (ONNX Runtime · Layer 1B)

Dịch vụ Computer Vision độc lập cho **Nhân Tướng 3D** và **Chỉ Tay (Tách đường chỉ)** — tách khỏi `engine/` để giữ FastAPI engine trên Render nhẹ, khởi động nhanh (<200ms).

## Kiến trúc 2 tầng (không ảo giác, không lưu ảnh)
- **Bảo mật tuyệt đối:** Ảnh gửi lên chỉ giải mã trong **RAM** (`bytes` → mảng pixel), tính xong tọa độ hình học là hủy ngay, **0 ghi đĩa**.
- **Nhân Tướng 3D (`POST /v1/cv/face-depth`):**
  - Model ONNX: `depth_anything_v2_vits.onnx` (đo độ sâu Sơn Căn `#168` vs Chuẩn Đầu `#1`, độ nhô Quyền Cốt `#234/#454` chuẩn hóa theo IPD) + `bisenet_hair.onnx` (tìm đường chân tóc thật `trichion_y_ratio`).
- **Chỉ Tay (`POST /v1/cv/palm-lines`):**
  - Model ONNX: `palm_segformer.onnx` / `palm_unetpp.onnx` tách mask 3 đường chính (Sinh Đạo, Trí Đạo, Tâm Đạo) & đường phụ.
  - Hình học tất định (`app/geometry.py`): làm mảnh (Zhang-Suen Skeletonization) → đo độ cong (`straight | curved_up | curved_down`), phát hiện phân nhánh (`degree >= 3`), đứt gãy (Euclidean gap), và kiểm tra điểm cuối rơi vào đa giác Gò nào (`mount_jupiter | mount_saturn | mount_apollo | mount_mercury | mount_venus | mount_luna`).
- **Đầu ra JSON:** Khớp trực tiếp với lớp cầu nối `engine/app/calc/tuong_fuzzy.py` (`semantic_tag`, `z_score`, `confidence`).

## Chạy cục bộ / Docker
```bash
docker build -t hieuban-cv-service ./cv-service
docker run -p 8090:8090 -v $(pwd)/cv-models:/app/models hieuban-cv-service
```
Đặt các tệp trọng số `.onnx` vào thư mục `/app/models` (khi chưa nạp trọng số, `GET /health` báo rõ trạng thái `models_loaded: false` và các hàm hình học trong `app/geometry.py` vẫn có thể kiểm thử độc lập).
