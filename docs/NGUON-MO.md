# Thành phần mã nguồn mở và nguồn đối chiếu — NỘI BỘ

> BM-1 (2026-10-09): danh mục này trước đây nằm trên trang `/gioi-thieu#nguon`. Chủ dự án coi cách hệ thống được dựng là
> bí mật kinh doanh, nên bảng chuyển về đây. **Không đưa nội dung file này lên web.**
>
> Giấy phép MIT yêu cầu giữ thông báo bản quyền khi **phân phối** phần mềm. Dịch vụ chỉ chạy trên máy chủ (người dùng
> không nhận bản sao mã) nên không bắt buộc công bố trên web; vẫn giữ ghi công đầy đủ ở đây và trong `package-lock` /
> thư mục vendor. Nếu sau này phát hành app di động hay gói tải về có kèm các thư viện này → phải đưa thông báo giấy phép
> vào app (màn hình "Giấy phép").

| Thành phần | Dùng vào | Giấy phép / cách dùng |
|---|---|---|
| iztro 2.6.0 (SylarLong) | An sao Tử vi, chạy trong engine qua Node | MIT — chạy runtime |
| Thuật toán âm lịch Hồ Ngọc Đức | Đổi âm–dương lịch theo múi giờ Việt Nam (gồm miền Nam 1960–1975) | Thuật toán công bố, tự cài đặt |
| lasotuvi 0.1.2 (doanguyen) | Golden độ sáng sao, Hoả Linh, vòng Thái Tuế lối Việt | MIT — chỉ sinh dữ liệu đối chiếu |
| lunar-typescript | Golden tiết khí, can chi cho Bát tự | Chỉ đối chiếu, không chạy runtime |
| VSOP87 rút gọn | Tiết khí cho Bát tự (sai ≤ 0,63 phút) | Mô hình thiên văn công bố, tự cài đặt |
| TuViMCP (© 2026 Manh Ha Nguyen) | Danh mục cách cục Tử vi để đối chiếu | MIT |
| opencode-tianji 0.6.0 | Bản số hoá nguyên văn Chu Dịch (quái từ, hào từ) | MIT |
| anko-ki-maya (Mahesh Koria) | Khung mục chân dung thần số (không chép nội dung) | MIT |
| aov.cc | Oracle đối chiếu lá số khi phát triển | Không chạy runtime |
| Cổ thư (ctext.org) | Nguyên văn Kinh Dịch, Tử Vi Đẩu Số Toàn Thư, Tử Bình Chân Thuyên… | Phạm vi công cộng; ctext cấm cào tự động |

**Không dùng**: mã/dữ liệu GPL, AGPL (horosa, mingyu-core, gr8monk3ys/numerology, iching-shifa) hoặc không giấy phép
(tuvi-neo, Ultimate-SoulCodex, tuongotpho/tuvi, kabalavn/La-So-Tu-Vi). Xem bảng quyết định trong `CLAUDE.md`.

Danh sách nhà cung cấp xử lý dữ liệu (trả lời khi người dùng yêu cầu theo Chính sách quyền riêng tư): Vercel (web,
Singapore) · Render (engine, Singapore) · Supabase (DB + đăng nhập, Singapore) · OpenRouter (diễn đạt AI, Hoa Kỳ) ·
PostHog (đo lường ẩn danh) · Google Tag Manager/Analytics · Sentry (báo lỗi).
