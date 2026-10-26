# Quy trình ứng phó sự cố dữ liệu cá nhân (72 giờ) — hieuban.com

> Áp dụng cho mọi sự cố có thể làm lộ, mất, sửa trái phép dữ liệu cá nhân. Luật BVDLCN 91/2025 + NĐ 356/2025 yêu cầu
> thông báo cơ quan có thẩm quyền trong thời hạn luật định sau khi phát hiện (luật sư xác nhận mốc giờ và mẫu). Mốc 72 giờ
> dưới đây là mục tiêu nội bộ, không muộn hơn luật.

## 0. Người và kênh

| Vai | Ai | Kênh |
|---|---|---|
| Phụ trách sự cố (quyết định, ký thông báo) | [Chủ dự án] | Điện thoại cá nhân, contact@hieuban.com |
| Kỹ thuật (điều tra, khắc phục) | [Chủ dự án / người hỗ trợ kỹ thuật] | GitHub, Vercel, Supabase, Render |
| Pháp lý | [Luật sư] | [email] |
| Cơ quan nhận thông báo | Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (A05), Bộ Công an | Cổng/địa chỉ theo hướng dẫn NĐ 356 [điền] |

## 1. Phát hiện (giờ 0)

Nguồn: Sentry/UptimeRobot báo; Supabase Security Advisor; người dùng báo qua contact@; cờ bất thường ở `/quan-tri`
(doanh thu, cờ gian lận, nhật ký quản trị `nhat_ky_quan_tri`); GitHub Dependabot/CodeQL.

Ngay khi nghi ngờ: ghi **giờ phát hiện** vào sổ sự cố (`docs/ho-so-dlcn/su-co/YYYY-MM-DD.md`, mẫu ở mục 6).

## 2. Khoanh vùng và chặn (0–4 giờ)

1. Xác định phạm vi: bảng/dịch vụ nào, bao nhiêu tài khoản, loại dữ liệu (theo bảng tệp 01 mục 3).
2. Chặn ngay nếu cần: đổi khoá bí mật bị nghi lộ (`SAO_KHOA_SECRET`, `LOI_MOI_SECRET`, `ENGINE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `PAYLOAD_SECRET`, `CMS_WEBHOOK_SECRET`, VAPID, payOS) → Redeploy; thu hồi phiên Supabase (Auth → Users → sign out all);
   tắt công tắc liên quan ở `/quan-tri/cai-dat`; tạm tắt route lỗi.
3. Giữ bằng chứng: xuất nhật ký Vercel/Supabase/Render của khoảng thời gian; không xoá.
4. Không trả lời công khai trước khi có đánh giá (mục 3).

## 3. Đánh giá (4–24 giờ)

Trả lời bằng văn bản trong sổ sự cố:
- Dữ liệu nào bị ảnh hưởng, của bao nhiêu người, có dữ liệu định danh (tên + ngày sinh, email, SĐT) không.
- Nguyên nhân gốc (lỗi mã, cấu hình, nhà cung cấp, tài khoản quản trị bị chiếm).
- Mức rủi ro cho người dùng: thấp (chỉ dữ liệu ẩn danh/con số rút gọn) · trung bình (email/tên) · cao (tên + ngày giờ sinh + nơi sinh, ảnh nhà, câu hỏi chuyên gia kèm hồ sơ).
- Có phải thông báo cơ quan / người dùng không (luật sư quyết trong vòng 24 giờ).

## 4. Thông báo (trước 72 giờ)

**Cơ quan có thẩm quyền** (nếu thuộc diện): theo mẫu NĐ 356 — mô tả sự cố, thời điểm, loại và số lượng dữ liệu, hậu quả
có thể, biện pháp đã/đang làm, đầu mối liên hệ. Lưu bản gửi + xác nhận.

**Người dùng bị ảnh hưởng** (khi rủi ro trung bình/cao): email/thông báo trong tài khoản — nói **điều gì đã xảy ra, dữ liệu
nào, chúng tôi đã làm gì, bạn nên làm gì** (đổi mật khẩu/khoá, xoá hồ sơ nếu muốn), cách liên hệ. Ngôn ngữ đời thường, không
đổ lỗi, không làm nhẹ.

**Công khai** (khi ảnh hưởng rộng): một trang `/thong-bao-su-co` + dải thông báo CMS (Trang chủ & banner).

## 5. Khắc phục và rút kinh nghiệm (≤ 30 ngày)

- Vá lỗi bằng PR có test; thêm ca pentest tương ứng vào `web/e2e-that` / `supabase/kiem_thu`.
- Cập nhật `docs/BAO-MAT.md`, tệp 01 (rủi ro), Chính sách nếu cơ chế đổi.
- Họp rút kinh nghiệm: nguyên nhân gốc, vì sao không phát hiện sớm, thay đổi quy trình.

## 6. Mẫu sổ sự cố

```
# Sự cố YYYY-MM-DD — <tên ngắn>
Phát hiện lúc: …  Bởi: …  Kênh: …
Phạm vi: bảng/dịch vụ … · số tài khoản … · loại dữ liệu …
Giờ 0–4 (chặn): …
Giờ 4–24 (đánh giá): nguyên nhân … · mức rủi ro … · cần thông báo: cơ quan [có/không] · người dùng [có/không]
Thông báo: cơ quan lúc … (bản gửi: …) · người dùng lúc … (nội dung: …)
Khắc phục: PR … · test … · tài liệu …
Rút kinh nghiệm: …
```

## 7. Diễn tập

Mỗi 6 tháng chạy một kịch bản giả (vd "khoá service role lộ trên GitHub") theo đúng 5 bước, đo thời gian từng bước, ghi vào
`docs/ho-so-dlcn/su-co/dien-tap-YYYY-MM-DD.md`.

Ngày lập: 26/10/2026 · Người lập: [chủ dự án] · Người rà: [luật sư]
