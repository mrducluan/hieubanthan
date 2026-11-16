# Đề xuất: nhập nơi sinh ngoài Việt Nam bằng ô gõ có gợi ý (NS-QT)

Ngày 2026-11-16 · trạng thái: **đề xuất, chờ chủ dự án duyệt** · khâu THU HÚT (người Việt ở nước ngoài, bản `/en`).
Đo: tỉ lệ `profile_created` có nơi sinh nước ngoài hoàn tất, `chart_interacted{kind=noi_sinh_chon|noi_sinh_khong_thay}`.

Máy trong phiên nghiên cứu không ra được mạng tới geonames.org, nên các con số về GeoNames và API ngoài là
**theo hiểu biết, cần kiểm lại** khi tải dữ liệu thật.

## 1. Hiện trạng

- `engine/app/calc/data/mui_gio.json`: 62 nước, 146 thành phố; 134 nơi có `kinh_do` / `vi_do`, 12 mục "khác" không có.
- `engine/app/calc/mui_gio.py` (`tai()`) đã dùng `zoneinfo`: trả UTC chuẩn, giờ mùa hè, độ lệch tại đúng giờ sinh.
  Mã nhận vào: `us-san_jose` hoặc mã vùng IANA.
- Toạ độ đang dùng cho: cảnh báo + công tắc giờ mặt trời thực (kinh độ), điều hậu Nam bán cầu (vĩ độ). Người chọn
  "thành phố khác" (mã IANA) hiện mất cả hai.
- Web: hai ô chọn Nước → Thành phố (`web/components/hoso/NhapHoSo.tsx`, `ChonNuocThanhPho.tsx`), không có ô gõ tìm.
- Hồ sơ lưu `mui_gio` chỉ trên máy; tài khoản mới có cột `utc_noi_sinh` (migration 0033).

## 2. Bốn phương án

| | (a) GeoNames tự lưu, tìm ở engine | (b) API ngoài qua máy chủ | (c) Lai: (a) + lối thoát | (d) Mở rộng danh sách + ô tìm |
|---|---|---|---|---|
| Trải nghiệm | Gõ → gợi ý tức thì | Tốt nhất (Google) | Như (a), không ngõ cụt | Vẫn hai bước |
| Độ phủ | ~25–33 nghìn thành phố (≥ 15.000 dân) | Gần như mọi nơi | Như (a) + nhập tay | Vài trăm |
| Toạ độ, múi giờ | Tâm thành phố ~0,01°; có sẵn mã IANA | Toạ độ tốt; múi giờ phải gọi thêm (Google), hoặc không có | Như (a) | Gõ tay |
| Riêng tư | Chữ gõ chỉ tới máy chủ mình | Chữ gõ sang bên thứ ba ở nước ngoài, phải ghi Chính sách | Như (a) | Không rời |
| Chi phí | 0 | Google tính tiền theo phiên; Nominatim cấm gợi ý khi gõ | 0 | 0 |
| Giấy phép | CC BY 4.0 (ghi công) | Điều khoản riêng, Google hạn chế lưu toạ độ | CC BY 4.0 | Tự soạn |
| Thư viện mới, CSP | Không, không đổi | Không, không đổi | Không, không đổi | Không |
| Công làm | 3–4 ngày | 2–3 ngày + pháp lý + khoá | 4–5 ngày | 1–2 ngày, bảo trì tay mãi |

Biến thể "tải tệp về trình duyệt rồi tìm tại chỗ" bị loại: ~1 MB cho một ô nhập.

## 3. Chọn (c): GeoNames `cities15000` ở engine + lối thoát

- **Dữ liệu**: `engine/scripts/nap_geonames.py` đọc tệp GeoNames, ghi `engine/app/calc/data/dia_danh.json` (~2–3 MB):
  mã, tên, tên không dấu, tên khác (Việt / Anh / bản địa), nước, tỉnh-bang, vĩ độ, kinh độ (2 chữ số), mã vùng IANA,
  dân số. Bỏ dòng Việt Nam (trong nước đã có 63 tỉnh). Cần bảng tên nước tiếng Việt ~250 dòng (đã có 62).
- **Engine**: `GET /v1/dia-ly/tim?q=san+jo&gh=8`. Chuẩn hoá bỏ dấu, khớp tiền tố tên → tiền tố từng từ → tên khác;
  xếp theo dân số. Mỗi kết quả: mã `gn-<id>`, tên, dòng phụ ("California, Hoa Kỳ"), toạ độ, vùng giờ, UTC chuẩn,
  cờ giờ mặt trời / Nam bán cầu. Múi giờ lúc sinh vẫn do `mui_gio.tai()` + tzdata tính — **không đổi phép tính**,
  không tăng `ENGINE_VERSION`.
- **Web**: một ô combobox thay hai ô chọn, dùng chung cho form hồ sơ và form người thân. Dòng gợi ý:
  "San Jose — California, Hoa Kỳ · 37,34°B 121,89°T · UTC−8". Đủ ARIA + bàn phím, mục cao ≥ 44px.
  Không thấy nơi của mình → mở ô chọn vùng giờ sẵn có, kèm hai ô vĩ độ / kinh độ tuỳ chọn.
  Chữ đang gõ **không ghi log, không gửi PostHog**; chỉ ghi mã đã chọn.
- **Tương thích**: mã cũ `us-san_jose` và mã IANA giữ nguyên; mã mới `gn-…` khớp sẵn luật kiểm hiện có.
  15 trang `/sinh-o-nuoc-ngoai` không đổi.
- **Lợi thêm**: ~25 nghìn nơi có toạ độ → giờ mặt trời thực và điều hậu Nam bán cầu mở được cho các nơi đó.
- **Test viết trước**: golden tìm kiếm ~40 ca (praha / prague, san jose ra California trước Costa Rica, melbourne ra
  Úc trước Florida, có dấu / không dấu); mọi vùng giờ phải có trong tzdata; 134 thành phố cũ lệch < 0,3° và cùng vùng
  giờ với bản GeoNames; mã `gn-` cho lá số trùng mã cũ cùng thành phố; e2e bàn phím + không có yêu cầu ra ngoài.

## 4. Rủi ro

- Tên trùng (nhiều "San Jose", "Springfield") → dòng phụ bắt buộc có bang / nước.
- Thị trấn dưới 15.000 dân chưa có → lối thoát; sau có thể chạy lại script với `cities5000`.
- Engine tốn thêm ~15–30 MB RAM (ước lượng) — phải đo trên Render Starter trước khi bật.

## 5. Cần chủ dự án quyết

1. Dùng GeoNames (CC BY 4.0) và ghi công ở `docs/NGUON-MO.md` + một dòng trên trang Giới thiệu.
2. Cỡ dữ liệu: `cities15000` (đề xuất) hay `cities5000`.
3. Mở mạng cho môi trường tới `download.geonames.org`, hoặc anh tải 3 tệp rồi gửi qua Drive.
4. Có thêm cột `ho_so.mui_gio` (migration **0039**) để đồng bộ tài khoản không. Hiện chỉ lưu trên máy.
5. Có cho nhập toạ độ tay không. "Chọn trên bản đồ" đề xuất chưa làm.
6. Bỏ hai ô chọn cũ, thay hẳn bằng combobox (đề xuất), giữ ô vùng giờ làm lối thoát.
