# Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân — hieuban.com

> **Bản nháp 26/10/2026** do hệ thống soạn từ Chính sách quyền riêng tư, `docs/BAO-MAT.md` và mã nguồn. Chủ dự án / luật
> sư rà, điền các ô `[…]`, đối chiếu mẫu hiện hành của Bộ Công an (Cục A05) theo Luật Bảo vệ dữ liệu cá nhân
> 91/2025/QH15 + Nghị định 356/2025/NĐ-CP rồi mới nộp. Mục nào luật miễn cho doanh nghiệp nhỏ thì luật sư ghi rõ.

## 1. Bên kiểm soát và xử lý dữ liệu

| Mục | Nội dung |
|---|---|
| Tên | [Hộ kinh doanh / cá nhân kinh doanh] — vận hành website hieuban.com ("Hiểu Bản Thân") |
| Mã số thuế | [điền] |
| Địa chỉ | [điền] |
| Người phụ trách bảo vệ dữ liệu cá nhân | [Họ tên — chủ dự án], email contact@hieuban.com |
| Vai trò | Bên kiểm soát và xử lý (tự quyết mục đích + tự xử lý; một phần xử lý thuê bên ngoài — mục 5) |

## 2. Mô tả hoạt động xử lý

Dịch vụ: website tính và diễn giải thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ; tài khoản tuỳ chọn; credit nội bộ "Sao"
mua bằng VND; chương trình giới thiệu; dịch vụ hỏi chuyên gia (văn bản, trả VND). Người dùng: cá nhân tại Việt Nam, ≥ 16 tuổi
(Điều khoản). Không có xử lý dữ liệu trẻ em có chủ đích; không có quyết định tự động gây hậu quả pháp lý.

## 3. Danh mục dữ liệu cá nhân, mục đích, căn cứ, thời hạn

| # | Dữ liệu | Loại | Mục đích | Căn cứ | Nơi lưu | Thời hạn | Bảo vệ |
|---|---|---|---|---|---|---|---|
| 1 | Họ tên, ngày giờ sinh, giới tính, nơi sinh (khách) | Cơ bản | Tính kết quả tại chỗ | Đồng ý tại chỗ (nút "Đồng ý và xem kết quả") + yêu cầu của người dùng | Trình duyệt người dùng; máy chủ tính toán chỉ xử lý trong bộ nhớ | Không lưu ở máy chủ; trên máy đến khi người dùng xoá | HTTPS; engine không ghi đĩa / không log thân yêu cầu |
| 2 | Tài khoản (email / số điện thoại / Google ID) | Cơ bản | Đăng nhập | Đồng ý khi đăng ký | Supabase (Singapore) | Đến khi xoá tài khoản | Supabase Auth, OTP, MFA cho quản trị |
| 3 | Hồ sơ lưu vào tài khoản (như #1) | Cơ bản | Dùng lại hồ sơ giữa các máy | Đồng ý rõ (bấm "Lưu hồ sơ vào tài khoản", ghi `dong_y_luc`) | Supabase (Singapore), RLS chủ sở hữu | Đến khi xoá hồ sơ/tài khoản | RLS; chỉ chủ tài khoản đọc; xoá ngay |
| 4 | Ví Sao, mã mời, quan hệ mời, đơn nạp, hoa hồng | Cơ bản (tài chính nội bộ) | Vận hành credit, chương trình giới thiệu, đối soát, hoàn tiền | Thực hiện hợp đồng (Điều khoản) | Supabase (Singapore) | Đến khi xoá tài khoản | RLS; ghi chỉ qua hàm SECURITY DEFINER; sổ cái bất biến |
| 5 | Mã băm thiết bị (HMAC IP + user-agent, một chiều) | Cơ bản (gián tiếp) | Chống gian lận thưởng mời | Lợi ích hợp pháp + nêu trong Chính sách | Supabase | Cùng dòng quan hệ mời | Không lưu IP/UA; khoá bí mật máy chủ |
| 6 | Chuỗi ngày ghé (ngày cuối, độ dài) | Cơ bản | Tính năng quay lại | Đồng ý (đăng nhập) | Supabase | Đến khi xoá tài khoản | Không lưu lịch sử từng ngày |
| 7 | Quà tặng chương (người gửi/nhận, mảng, ngày) | Cơ bản | Tính năng tặng | Đồng ý khi dùng | Supabase | Tự xoá sau 30 ngày | Cron dọn hằng ngày |
| 8 | Góp ý "đúng/chưa đúng" (chỉ con số rút gọn + mã câu, ghi chú đã lọc khi tự tích) | Ẩn danh hoá | Cải thiện kho tri thức | Đồng ý từng lần | Supabase | 12 tháng | Không tên/ngày sinh/user_id; lọc email/SĐT/ngày |
| 9 | Phiếu kiểm chứng (mã mẫu, khoá HMAC) | Ẩn danh hoá | Thống kê "x% thấy đúng" | Đồng ý khi bấm | Supabase | 24 tháng | Chỉ công bố tổng khi ≥ 30 phiếu |
| 10 | "Ghi nhớ" (mã câu băn khoăn) | Cơ bản | Ký ức cá nhân | Đồng ý khi bấm | Supabase, RLS | 180 ngày | Xoá ngay được |
| 11 | Mốc nhắc, đăng ký push, tuỳ chọn | Cơ bản | Nhắc việc opt-in | Đồng ý từng ô (không tích sẵn) | Supabase, RLS | Đến khi tắt / 400 ngày | Endpoint chỉ máy chủ push chính thức; nội dung mã hoá đầu-cuối |
| 12 | Ảnh góc nhà (thu nhỏ, bỏ EXIF) | Cơ bản (có thể lộ nơi ở) | Gợi ý dấu hiệu phong thuỷ | Đồng ý từng lần (ô không tích sẵn) | Không lưu; đi qua engine tới nhà cung cấp AI thị giác (Hoa Kỳ) | Không lưu | Không ghi đĩa/log; chỉ nhãn trả về |
| 13 | Câu hỏi chuyên gia + hồ sơ snapshot (khi tự tích) | Cơ bản | Dịch vụ tư vấn trả phí | Hợp đồng + đồng ý riêng cho chia sẻ hồ sơ | Supabase, RLS | Snapshot xoá 30 ngày sau trả lời; câu + trả lời đến khi xoá tài khoản | Chỉ chuyên gia có vai trò + MFA đọc |
| 14 | Câu hỏi đã lọc (nhật ký hỏi đáp, khi bật) | Ẩn danh hoá | Cải thiện chất lượng | Lợi ích hợp pháp | Supabase | 24 tháng | Lọc tên/ngày/SĐT/email; không user_id |
| 15 | Số liệu sử dụng ẩn danh (PostHog), Google Analytics, báo lỗi (Sentry) | Kỹ thuật | Đo lường, sửa lỗi | Lợi ích hợp pháp; GA tắt được ở "Tuỳ chọn cookie" | Hoa Kỳ / EU | 12 / 14 tháng / 90 ngày | Không gửi tên/ngày sinh/nội dung; Sentry tắt IP/cookie/body |

**Dữ liệu nhạy cảm**: không thu có chủ đích. Rủi ro gián tiếp: người dùng tự gõ sức khoẻ/tôn giáo vào ô hỏi đáp hoặc ghi chú →
đã có lọc + lời nhắc "đừng ghi"; hỏi đáp chặn chẩn đoán bệnh.

## 4. Đánh giá rủi ro và biện pháp

| Rủi ro | Khả năng | Tác động | Biện pháp đã có | Còn lại |
|---|---|---|---|---|
| Lộ ngày giờ sinh + tên qua máy chủ tính | Thấp | Trung bình | HTTPS; engine không lưu/không log; khoá API engine; trần thân yêu cầu | Chấp nhận được |
| Truy cập trái phép dữ liệu tài khoản | Thấp | Cao | RLS chủ sở hữu mọi bảng; ghi chỉ qua hàm; quản trị đòi MFA aal2 trong DB; pentest SEC-1/2/3 (26/10/2026: không lỗ hổng Nghiêm trọng/Cao) | Rà định kỳ 6 tháng |
| Nhận diện lại từ bảng góp ý / phiếu | Rất thấp | Thấp | Chỉ con số rút gọn + mã; không user_id; công bố chỉ tổng ≥ 30 | — |
| Chuyển dữ liệu ra nước ngoài (SG/US/EU) | — | Trung bình | Hợp đồng/điều khoản nhà cung cấp; gửi ít nhất có thể; nêu trong Chính sách | Hồ sơ chuyển dữ liệu (tệp 02) |
| Gian lận thưởng mời bằng nhiều tài khoản | Trung bình | Thấp (Sao không đổi tiền) | Mã băm thiết bị, trần, cờ cho người duyệt; không tự khoá | — |
| Sự cố mất dữ liệu | Thấp | Trung bình | Supabase sao lưu (Pro khi bật tài khoản); git là nguồn kho tri thức | Bật Supabase Pro khi mở tài khoản |
| Nhà cung cấp AI dùng dữ liệu để huấn luyện | Thấp | Trung bình | Không gửi tên/ngày sinh cho AI; ảnh không lưu; chọn nhà cung cấp cam kết không huấn luyện | Luật sư rà điều khoản nhà cung cấp |

## 5. Bên xử lý thay (chi tiết tệp 02)

Hạ tầng web (Vercel, sin1/US), tính toán (Render, Singapore), cơ sở dữ liệu + đăng nhập (Supabase, Singapore), cổng
thanh toán (payOS, Việt Nam), AI diễn đạt + thị giác (OpenRouter → nhà cung cấp mô hình, Hoa Kỳ), đo lường (PostHog EU/US;
Google), báo lỗi (Sentry), push (Google/Apple/Mozilla/Microsoft).

## 6. Quyền của chủ thể dữ liệu và cách thực hiện

Xem, sửa, xoá hồ sơ ngay trong `/tai-khoan`; rút đồng ý từng mục (ô opt-in, "Thu hồi" ở form hồ sơ, "Tuỳ chọn cookie");
xoá hẳn tài khoản (xoá mọi dữ liệu gắn tài khoản); yêu cầu bản sao / khiếu nại qua contact@hieuban.com, phản hồi trong
[72 giờ / theo luật]. Không bán, không chia sẻ cho bên thứ ba ngoài bên xử lý thay.

## 7. Kết luận

Mức rủi ro còn lại: **thấp** với dữ liệu khách (không lưu), **trung bình–thấp** với dữ liệu tài khoản (đã có RLS, MFA, pentest).
Hồ sơ này cập nhật khi thêm loại dữ liệu / nhà cung cấp mới (quy trình: mọi migration thêm bảng dữ liệu cá nhân phải kèm
cập nhật Chính sách + tệp này).

Ngày lập: 26/10/2026 · Người lập: [chủ dự án] · Người rà: [luật sư]
