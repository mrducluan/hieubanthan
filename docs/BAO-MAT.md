# Rà soát bảo mật SEC-1 (2026-10-08)

Phạm vi: web (Next.js 14 trên Vercel), engine (FastAPI trên Render), cơ sở dữ liệu Supabase (migration 0001–0009),
kho mã (bí mật, thư viện). Cách làm: đọc toàn bộ route API, lớp proxy, middleware, migration/RLS, `npm audit`.

## Đã sửa trong PR SEC-1

| # | Mức | Lỗ hổng | Sửa |
|---|---|---|---|
| 1 | Cao | **Gian lận Sao**: khoá giao dịch "Luận giải toàn bộ" là SHA-256 của dữ liệu công khai → người dùng tự tính được khoá, gọi thẳng RPC `dung_sao(1, khoá)` rồi lấy báo cáo 10 Sao chỉ với 1 Sao (khi bật thu Sao). | Khoá ký **HMAC bằng bí mật máy chủ** (`SAO_KHOA_SECRET`, mặc định dùng `LOI_MOI_SECRET`), có cả giá trong khoá; thiếu bí mật thì không thu. |
| 2 | Trung bình | **Chuyển hướng mở** sau đăng nhập: `/auth/callback?tiep=/\evil.com` → trình duyệt hiểu `//evil.com` → đưa người dùng sang trang lừa đảo. | Chỉ nhận đích **cùng origin**. |
| 3 | Trung bình | Engine **không giới hạn số yêu cầu** (chỉ giới hạn lượt AI) → một người spam lá số Tử vi (mỗi lá chạy Node) làm chậm/sập engine cho mọi người. | Hạn mức **120 yêu cầu/phút mỗi người gọi** (`ENGINE_LUOT_PHUT`), quá → 429 lời tiếng Việt. |
| 4 | Trung bình | Lỗi iztro trả `stderr` (đường dẫn máy chủ, dòng mã) thẳng ra người dùng. | Câu chung cho người dùng; chi tiết chỉ gửi Sentry. |
| 5 | Trung bình | Next.js 14.2.33 có nhiều lỗi đã công bố (DoS Server Components, cache poisoning…). | Lên **14.2.35** (bản vá cuối dòng 14, không đổi stack). |
| 6 | Thấp | So khoá engine bằng `!=` (lộ dần khoá qua thời gian phản hồi về lý thuyết). | `hmac.compare_digest`. |
| 7 | Thấp | `/docs`, `/openapi.json` của engine mở trên production → phô bản đồ endpoint. | Tắt khi chạy trên Render. |
| 8 | Thấp | Tên trong hỏi đáp thần số không giới hạn độ dài (gửi chuỗi vài MB). | Tối đa 80 ký tự (web + engine). |
| 9 | Thấp | Thiếu chống nhúng khung (clickjacking) dạng CSP, chưa có COOP. | CSP `frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'` + COOP. |
| 10 | Thấp | `.gitignore` chỉ chặn `.env*.local` → lỡ tạo `.env` là commit được mật khẩu. | Chặn `.env`, `.env.*` (trừ `.env.example`). |
| 11 | Lỗi | `/api/hop-doi/moi` đọc thân phản hồi lỗi hai lần (lời lỗi luôn chung chung). | Đọc một lần. |

## Đã kiểm, không có vấn đề

- **Không có bí mật trong git** (quét cả lịch sử: khoá OpenRouter, JWT Supabase, khoá AWS, khoá riêng).
- Mọi route API kiểm đầu vào bằng zod `.strict()` trước khi gọi engine; engine kiểm lần hai bằng pydantic.
- JSON-LD thoát `<` → không chèn được `</script>`. Không có `dangerouslySetInnerHTML` nào khác.
- Link mời / thẻ chia sẻ: HMAC-SHA256, so sánh hằng thời gian, có hạn 90 ngày, chỉ chứa tên hiển thị + con số.
- Supabase: bảng `ho_so`, sổ Sao có **RLS chủ sở hữu**; mọi hàm ghi là `SECURITY DEFINER` + `search_path=''` +
  `revoke` khỏi `anon`; xoá tài khoản xác minh token của chính người gọi.
- iztro chạy bằng `subprocess` danh sách tham số + stdin JSON (không qua shell) → không chèn lệnh được.
- PostHog: tắt autocapture, tắt ghi phiên, che toàn bộ chữ → ô ngày sinh không bao giờ bị gửi đi.
- GTM/GA chỉ nạp sau khi người dùng bấm Đồng ý.

## Còn mở — cần anh quyết hoặc làm

1. **Kiểm khoá engine trên production (1 phút, quan trọng nhất):** mở `https://hieubanthan-engine-sg.onrender.com/health`
   (hoặc địa chỉ engine anh đang dùng) sau khi PR này deploy → phải thấy `"khoa_engine": true`. Nếu `false`: ai biết
   địa chỉ engine cũng gọi thẳng được, vượt mọi giới hạn → vào Render → Environment → thêm `ENGINE_API_KEY` (cùng chuỗi
   với Vercel) → Save.
2. **Nâng Next.js 15/16:** `npm audit` vẫn báo các lỗi chỉ vá ở 15+/16 (phần lớn thuộc tính năng dự án không dùng:
   Image Optimizer remotePatterns, Server Actions, i18n Pages Router, chạy trên Windows; Vercel còn chặn bớt ở hạ tầng).
   Đổi bản lớn = đổi stack trong CLAUDE.md → cần anh duyệt; em đề xuất làm thành một việc riêng có kiểm thử đầy đủ.
3. **Nhật ký hỏi đáp (khi bật `NHAT_KY_HOI=1`):** bảng 0004/0005 cho `anon` INSERT — khoá anon là công khai (nằm trong
   web khi bật tài khoản) → người ngoài có thể ghi rác vào nhật ký. Đề xuất trước khi bật: migration đổi sang khoá
   riêng cho engine (chưa làm vì đổi chính sách DB cần anh duyệt; nhật ký hiện đang tắt nên chưa có rủi ro).
4. **CSP đầy đủ (script-src có nonce):** chặn hẳn XSS từ script lạ. Cần chỉnh cách nạp GTM/PostHog/Next → để bước sau.
5. **Khi bật tài khoản:** bật Supabase "Leaked password protection", giới hạn gửi email/SMS OTP, tắt đăng ký ẩn danh.
