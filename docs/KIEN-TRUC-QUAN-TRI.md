# Kiến trúc trang quản trị `/quan-tri`

> Chủ dự án chốt 2026-10-09: **tự xây trong Next.js** (không dùng CMS dựng sẵn), **tri thức xuất bản qua PR git**,
> bắt đầu QT-0 sau khi bật đăng nhập Google.

## Vì sao không dùng CMS dựng sẵn

hieuban.com không phải blog. Hơn 1.000 trang được engine dựng từ kho tri thức có cấu trúc (`engine/app/kb/data/*.json`)
cộng với phép tính. Muốn sửa nội dung thì sửa **mục tri thức**, không sửa thành phẩm. Payload, Strapi, Directus hay
Sanity sẽ thêm một hệ dữ liệu thứ hai, và chúng không hiểu các luật bắt buộc của dự án: `source_id`/`school_id`, nhãn
nháp AI, sổ thẩm định, golden test. Tự xây cho phép dùng lại Supabase Auth và RLS, shadcn, CSP nonce có sẵn, và gần
như không thêm thư viện.

## Hai loại dữ liệu

| Loại | Nguồn gốc | Đường đi khi sửa |
|---|---|---|
| **Nội dung tri thức** | git (`engine/app/kb/data`) | Sửa trong `/quan-tri` → bản nháp và phiên bản trên Supabase → **Xuất bản** = mở PR → CI (pytest, golden, rà SEO, e2e) → chủ dự án merge → Render/Vercel triển khai |
| **Vận hành** (công tắc, vai trò, nhật ký, Sao) | Supabase | Sửa là có hiệu lực ngay (cache ngắn), mọi thay đổi ghi `nhat_ky_quan_tri` |

**Khoá bí mật chỉ nằm ở biến môi trường.** Giao diện chỉ báo "đã đặt" hay "chưa đặt", không bao giờ hiện hay sửa giá trị.

## Ba lớp cổng (QT-0)

1. **Đăng nhập Supabase.** `getUser()` hỏi lại máy chủ, không tin cookie suông. Middleware làm mới phiên, chỉ cho `/quan-tri`.
2. **Có vai trò** trong bảng `vai_tro_quan_tri`. Có 5 vai trò: Chủ sở hữu, Biên tập, Chuyên gia thẩm định, Hỗ trợ,
   Chỉ xem. Người thường không có dòng nào trong bảng này.
3. **MFA bằng TOTP** (phiên `aal2`). Lớp này được chặn **trong cơ sở dữ liệu**: mọi policy và hàm quản trị dùng
   `vai_tro_hieu_luc()`, hàm này trả `null` khi phiên chưa qua `aal2`. Nếu lộ mật khẩu email/Google của quản trị
   viên, kẻ xấu vẫn chưa đọc được gì.

Thêm vào đó:
- `/quan-tri` luôn gắn `X-Robots-Tag: noindex` và `Cache-Control: no-store`, và bị chặn trong robots.txt.
- Bảng nhật ký chỉ thêm được: không sửa, không xoá, kể cả chủ sở hữu.
- Thống kê chỉ trả **số tổng**. Quản trị viên không đọc được hồ sơ hay ngày giờ sinh của ai (NĐ 13/2023).

## Phân hệ và lộ trình

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| **QT-0** | Migration 0010 (`vai_tro_quan_tri`, `nhat_ky_quan_tri`, `cau_hinh`). Cổng 3 lớp. Bảng điều khiển chỉ đọc: engine, tài khoản & Sao (số tổng), cấu hình env, kho tri thức (số trang, đã duyệt, thẩm định), nhật ký, liên kết bảng điều khiển ngoài | ✅ Chạy thật 2026-10-09 |
| **QT-1** | Xưởng kho tri thức `/quan-tri/tri-thuc`: đọc 20 file từ GitHub (main); duyệt cây, tìm chữ không dấu, sửa **giá trị chuỗi đã có** (không thêm/xoá mục, không đổi kiểu); xem khác biệt; **Xuất bản = nhánh `quan-tri/…` + commit + PR** (mô tả PR có bảng trước/sau, chỉ ghi vai trò + mã rút gọn, không email). Sửa **đúng vị trí chuỗi trong văn bản gốc** (`lib/kb-sua.ts`) → định dạng file giữ nguyên từng byte, PR chỉ có dòng thật sự đổi. Chặn: khác Origin, chưa aal2, vai trò Hỗ trợ/Chỉ xem, file `tham_dinh.json` (sửa bằng `scripts/tham_dinh.py`), file trên main đã đổi (sha), giá trị cũ không khớp. Ghi `nhat_ky_quan_tri` (`kb.de_xuat`) | ✅ Code xong, cần token `QUAN_TRI_GITHUB_TOKEN` (VIEC-CUA-ANH Q5). Bỏ bảng nháp/phiên bản trên Supabase: PR **là** bản nháp, git **là** lịch sử phiên bản → không cần migration |
| **QT-2** | Cài đặt site (công tắc chuyển từ env vào `cau_hinh`); SEO và chuyển hướng; người dùng và cấp vai trò; Sao (chỉ bút toán có lý do, không sửa số dư); nhật ký hỏi đáp | Cần duyệt danh sách công tắc |
| **QT-3** | Trợ lý AI: soạn nháp mục thiếu theo skill `thanso-kb`/`huyenhoc-kb`; kiểm định (bịa, lệch cổ thư, vùng cấm, SEO); tìm lỗ hổng từ nhật ký hỏi đáp + Search Console; máy chủ MCP để Claude thao tác CMS. **Mọi thao tác ghi của AI = bản nháp hoặc PR, người duyệt** | Cần hạn mức chi phí AI riêng |
| **QT-4** | Tìm kiếm ngữ nghĩa (pgvector); kéo số liệu Search Console/GA4 qua API | Cần bật extension pgvector |

## Luật cho lớp AI trong quản trị

- AI là công cụ biên tập, **không phải tầng sinh dữ kiện**. Không chạm CALC, không tự xuất bản.
- Kết quả luôn mang trạng thái `nhap_ai`, kèm `can_doi_chieu` khi chưa đối chiếu nguồn.
- Model đi qua OpenRouter như lớp narrative. Hạn mức dùng `ngan_sach.py`.

## File

- `supabase/migrations/0010_quan_tri.sql` (+ `.down.sql`)
- `web/lib/quan-tri.ts`: cổng 3 lớp
- `web/lib/supabase/may-chu.ts`: Supabase phía máy chủ, chạy theo quyền người dùng
- `web/middleware.ts`: làm mới phiên và gắn noindex cho `/quan-tri`
- `web/app/quan-tri/`: bảng điều khiển và `xac-thuc/` (đăng ký hoặc nhập mã TOTP)
- `web/e2e/quan-tri.spec.ts`
- QT-1: `web/lib/kb-sua.ts` (sửa đúng vị trí, kiểm lại cấu trúc) · `web/lib/github-quan-tri.ts` · `web/app/quan-tri/tri-thuc/`
  · `web/app/api/quan-tri/tri-thuc/route.ts` · `web/e2e/kb-sua.spec.ts` (chạy trên mọi file KB thật)
