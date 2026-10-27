# Hồ sơ đánh giá tác động chuyển dữ liệu cá nhân ra nước ngoài — hieuban.com

> **Bản nháp 26/10/2026.** Theo Luật BVDLCN 91/2025 + NĐ 356/2025, bên chuyển dữ liệu cá nhân của công dân Việt Nam ra
> nước ngoài lập hồ sơ đánh giá tác động chuyển và gửi cơ quan có thẩm quyền (Cục A05) theo mẫu hiện hành. Luật sư rà
> mẫu + thời hạn + trường hợp miễn trước khi nộp. Tên nhà cung cấp cụ thể dưới đây là **nội bộ** (BM-1: trang công khai chỉ
> ghi theo nhóm).

## 1. Bên chuyển

Như tệp 01, mục 1.

## 2. Danh sách bên nhận ở nước ngoài

| # | Bên nhận | Nước | Vai trò | Dữ liệu chuyển | Mục đích | Căn cứ | Cam kết bảo vệ |
|---|---|---|---|---|---|---|---|
| 1 | Supabase (Postgres, Auth, Storage) | Singapore | Bên xử lý thay | Tài khoản, hồ sơ đã lưu (khi người dùng bấm lưu), ví Sao, quan hệ mời, đơn nạp, chuỗi ngày, góp ý ẩn danh, phiếu, ký ức, mốc nhắc, câu hỏi chuyên gia | Lưu trữ và đăng nhập | Đồng ý (đăng ký/lưu) + hợp đồng dịch vụ | DPA của Supabase; mã hoá khi lưu và truyền; RLS do chúng tôi cấu hình; SOC 2 [kiểm] |
| 2 | Render (engine tính toán) | Singapore | Bên xử lý thay | Ngày giờ sinh, tên, câu hỏi — **chỉ trong bộ nhớ lúc tính, không lưu** | Tính kết quả | Đồng ý tại chỗ | Không ghi đĩa/log thân yêu cầu; khoá API; [DPA Render] |
| 3 | Vercel (web, hàm máy chủ vùng sin1; CDN toàn cầu) | Singapore / Hoa Kỳ | Bên xử lý thay | Yêu cầu HTTP (gồm dữ liệu #2 trên đường đi), cookie phiên | Chạy website | Hợp đồng dịch vụ | [DPA Vercel]; HTTPS; không log thân yêu cầu |
| 4 | OpenRouter → nhà cung cấp mô hình ngôn ngữ (vd Google, Anthropic, OpenAI) | Hoa Kỳ | Bên xử lý thay | Câu hỏi người dùng gõ + kết quả đã tính; **không** tên, ngày giờ sinh; ảnh nhà đã thu nhỏ (chỉ khi tự tích) | Diễn đạt câu trả lời; nhận diện dấu hiệu ảnh | Đồng ý từng lần (ảnh); lợi ích hợp pháp (diễn đạt) | Điều khoản không dùng để huấn luyện [kiểm từng nhà cung cấp]; không lưu ở phía chúng tôi |
| 5 | PostHog (đo lường ẩn danh) | EU hoặc Hoa Kỳ [chọn vùng EU khi tạo dự án] | Bên xử lý thay | Sự kiện sử dụng, mã ẩn danh; không tên/ngày sinh/nội dung | Đo lường sản phẩm | Lợi ích hợp pháp | Không cookie, không autocapture, che chữ |
| 6 | Google (Tag Manager, Analytics 4) | Hoa Kỳ | Bên kiểm soát độc lập / xử lý | Trang đã xem, thiết bị, cookie `_ga` | Đo lưu lượng | Consent Mode (analytics granted mặc định — người dùng tắt được) | Google Ads Data Processing Terms; không gửi tên/ngày sinh |
| 7 | Sentry (báo lỗi) | Hoa Kỳ / EU | Bên xử lý thay | Thông tin lỗi kỹ thuật; **tắt** IP, cookie, body, user | Sửa lỗi | Lợi ích hợp pháp | [DPA Sentry] |
| 8 | Google FCM / Apple / Mozilla / Microsoft (push) | Hoa Kỳ hoặc nơi nhà cung cấp đặt | Bên xử lý thay | Thông báo mã hoá đầu-cuối (RFC 8291) — chỉ thiết bị đọc được | Gửi nhắc việc opt-in | Đồng ý khi bật nhắc | Mã hoá đầu-cuối; endpoint chỉ máy chủ chính thức |
| 9 | payOS | Việt Nam | Bên xử lý thay | Mã đơn, số tiền, nội dung chuyển khoản | Thanh toán | Hợp đồng | Không chuyển ra nước ngoài (liệt kê để đủ) |

## 3. Đánh giá sự cần thiết và tối thiểu hoá

- Máy chủ đặt tại Singapore vì độ trễ và chi phí; chưa có nhà cung cấp tương đương tại Việt Nam cho Postgres + Auth quản lý.
- Dữ liệu gửi cho AI **đã loại tên, ngày giờ sinh**; ảnh nhà thu nhỏ trên máy người dùng, bỏ EXIF, không lưu.
- Người dùng **không cần tài khoản** để dùng dịch vụ chính (hồ sơ trên máy) → phần lớn người dùng không có dữ liệu lưu ở nước ngoài.

## 4. Rủi ro và biện pháp

| Rủi ro | Biện pháp |
|---|---|
| Bên nhận bị xâm nhập | Chọn nhà cung cấp có chứng nhận; dữ liệu ở Supabase có RLS + mã hoá; khoá bí mật chỉ ở env |
| Bên nhận dùng dữ liệu ngoài mục đích | DPA/điều khoản không huấn luyện; gửi tối thiểu; rà điều khoản mỗi năm |
| Yêu cầu của cơ quan nước ngoài | Dữ liệu định danh (tên + ngày sinh) chỉ có khi người dùng tự lưu; có thể xoá ngay |
| Mất khả năng truy cập | Sao lưu Supabase; kho tri thức ở git |

## 5. Quyền chủ thể dữ liệu

Người dùng được biết (Chính sách mục "Bên xử lý thay"), được yêu cầu danh sách tên cụ thể, được xoá dữ liệu — xoá lan sang
bên nhận theo cơ chế xoá của từng nhà cung cấp [ghi thời hạn theo DPA].

## 6. Phụ lục cần đính kèm khi nộp

- [ ] Bản sao / link DPA của Supabase, Vercel, Render, Sentry, PostHog, OpenRouter.
- [ ] Chính sách quyền riêng tư hieuban.com (bản in, ngày hiệu lực).
- [ ] Sơ đồ luồng dữ liệu (tệp 01 mục 3 đủ dùng).

Ngày lập: 26/10/2026 · Người lập: [chủ dự án] · Người rà: [luật sư]
