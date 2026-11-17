# UD-1 — Ưu đãi có hạn cho Luận giải toàn bộ (2026-11-17)

Khâu của vòng tăng trưởng: **NẠP Sao**. Đo: `paywall_viewed → unlock_clicked → checkout_started → unlock_succeeded{so_sao}`
trong và ngoài đợt ưu đãi; số suất đã dùng (đếm trong sổ Sao theo mã đợt).

## 1. Ba cách tiếp cận đã cân

| | Cách làm | Được | Mất | Kết luận |
|---|---|---|---|---|
| A | **Neo giá tự đặt + khan hiếm dựng sẵn**: "giá gốc 200 Sao" gạch đi dù chưa từng bán 200; "chỉ còn 39 suất" là số gõ tay; đồng hồ đếm lại từ đầu cho mỗi người / mỗi lần vào | Ép mạnh nhất trong vài ngày đầu | Giá gốc chưa từng áp dụng = thông tin giá gây nhầm lẫn (Luật Bảo vệ quyền lợi người tiêu dùng 2023, Luật Quảng cáo); người dùng quay lại thấy đồng hồ chạy lại → mất tin, mà sản phẩm này sống bằng niềm tin ("đã tính, có nguồn"); hoàn tiền / khiếu nại tăng | **Loại** |
| B | **Đợt ưu đãi THẬT, có hạn thật**: giảm X % trên giá thường (99 → 69 Sao), gạch đúng giá thường, đồng hồ đếm tới hạn chót chủ dự án đặt, suất đếm thật từ sổ Sao; hết hạn / hết suất giá tự về 99 | Đủ ba đòn bẩy anh muốn (gạch giá, đếm ngược, còn N suất) mà mọi con số kiểm chứng được; bật / tắt ở /quan-tri, không cần sửa code, không migration | Phải giữ kỷ luật: không dời hạn liên tục | **Chọn** |
| C | **Tặng thêm Sao khi nạp trong đợt** (giữ giá 99, nạp gói được +20–30 % Sao) | Không hạ giá niêm yết | Đòn bẩy nằm ở trang nạp, không nằm ở chỗ người đọc đang muốn mở chương; cần sửa hàm SQL tạo đơn | Để sau (đã có "tặng lần nạp đầu") |

Ví dụ của anh "99 Sao (giá gốc 200 Sao)": em không làm theo đúng con số đó vì 200 Sao chưa từng là giá bán. Muốn người
đọc thấy "giảm một nửa" một cách thật: đặt mức giảm 50 % → **49 Sao ~~99 Sao~~ · tiết kiệm 50 Sao (giảm 50 %)**.

## 2. Cách chạy một đợt

`/quan-tri/cai-dat` → nhóm **"Ưu đãi có hạn"**:

| Ô | Ví dụ | Ghi chú |
|---|---|---|
| Tên đợt ưu đãi | Ưu đãi mở bán | hiện trên dải ưu đãi |
| Mức giảm (%) | 30 | tối đa 50; tính trên giá thường của từng báo cáo (Bản đồ con số 49 → 34) |
| Hạn chót | 2026-11-30 | chạy tới 23:59 ngày này, giờ Việt Nam; **để trống = không có ưu đãi** |
| Số suất ưu đãi | 100 | 0 = không giới hạn suất |
| Mã đợt | mb2611 | bắt buộc khi có số suất; mỗi đợt một mã mới để đếm lại từ 0 |
| Chạy đợt ưu đãi | Bật | bật sau cùng |

Chỉ có tác dụng khi báo cáo đang thu Sao (`luan_giai.thu_sao` + cổng nạp). Hội viên và chủ sở hữu không tính vào suất.
Đếm suất cần `SUPABASE_SERVICE_ROLE_KEY` trên web (đã có cho thanh toán); thiếu thì ưu đãi vẫn chạy theo hạn chót, không
hiện dòng suất.

## 3. Người dùng thấy gì

- **Hộp mở khoá dính cuối báo cáo** (mọi mảng): quầng vàng "thở", vệt sáng lướt qua nút — luôn có, kể cả khi không ưu đãi.
  Có ưu đãi: hàng trên là tên đợt + đồng hồ ngày / giờ / phút / giây + thanh "Còn 39/100 suất"; hàng dưới "Đọc tiếp N
  chương còn lại · **69 Sao** ~~99 Sao~~ −30 %" + "Tiết kiệm 30 Sao (giảm 30%)"; nút "Mở toàn bộ · 69 Sao".
- **Khung mời đọc** (trước khi bấm đọc chương đầu): giá ưu đãi, giá thường gạch, đồng hồ.
- **`/goi-xem`**: dải ưu đãi viền sáng chạy ở đầu trang; thẻ từng gói hiện giá ưu đãi + giá thường gạch.
- Hộp đăng nhập / nạp nhanh tự dùng giá ưu đãi (gói gợi ý vừa đủ phần thiếu theo giá mới).
- Đồng hồ về 0 → giao diện tự tải lại giá thường. Ưu đãi hết giữa lúc người dùng bấm mở → máy chủ **không trừ** theo giá
  cao hơn giá họ đang thấy, báo giá mới để họ tự quyết.
- Giảm chuyển động (prefers-reduced-motion) → mọi hiệu ứng đứng yên.

## 4. Ranh giới giữ

- Không có "giá gốc" tự đặt; con số gạch luôn là giá thường đang lưu ở `luan_giai.gia_sao[.<mã>]`.
- Không đồng hồ theo từng người, không tự gia hạn. Dời hạn chót là việc chủ dự án làm tay — nên tránh.
- Không doạ ("hạn nặng", "kẻo lỡ"); lời chỉ nêu giá, hạn, số suất.
- Giảm giá khuyến mại: trần 50 % và các điều kiện về thời gian / thông báo khuyến mại theo NĐ 81/2018 — em kẹp 50 % trong
  code; phần thủ tục (thông báo Sở Công Thương nếu thuộc diện) nên hỏi luật sư cùng lượt với `docs/PHAP-LY-2026.md`.

## 5. Tệp

`web/lib/uu-dai.ts` (thuần) · `web/lib/uu-dai-may-chu.ts` (cấu hình + đếm suất) · `web/components/sao/UuDai.tsx` ·
`web/lib/luan-giai-sao.ts` (giá áp dụng, ghi chú sổ Sao, chặn trừ giá cao hơn giá đã thấy) · `web/e2e/uu-dai.spec.ts`.
