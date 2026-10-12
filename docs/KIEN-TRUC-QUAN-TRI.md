# Kiến trúc trang quản trị `/quan-tri`

> Chủ dự án chốt 2026-10-09: **tự xây trong Next.js** (không dùng CMS dựng sẵn), **tri thức xuất bản qua PR git**,
> bắt đầu QT-0 sau khi bật đăng nhập Google.

## Vì sao không dùng CMS dựng sẵn

hieuban.com không phải blog. Hơn 1.000 trang được engine dựng từ kho tri thức có cấu trúc (`engine/app/kb/data/*.json`)
cộng với phép tính. Muốn sửa nội dung thì sửa **mục tri thức**, không sửa thành phẩm. Payload, Strapi, Directus hay
Sanity sẽ thêm một hệ dữ liệu thứ hai, và chúng không hiểu các luật bắt buộc của dự án: `source_id`/`school_id`, nhãn
nháp AI, sổ thẩm định, golden test. Tự xây cho phép dùng lại Supabase Auth và RLS, shadcn, CSP nonce có sẵn, và gần
như không thêm thư viện.

## Ranh giới với CMS (2026-10-12)

/quan-tri giữ **con số và công tắc** đụng tới tiền, Sao, AI, dữ liệu người dùng, kho tri thức (git → PR). Chữ và hình
hiển thị (bài viết, menu chân trang, dải thông báo, banner trang chủ, khối bài viết) thuộc **CMS** — bảng đầy đủ ở
`docs/KIEN-TRUC-CMS.md` mục 0. Khoá `site.thong_bao`, `site.thong_bao_link` đã chuyển sang CMS (global "Trang chủ & banner").

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
| **QT-2** | Migration **0011** (chỉ thêm hàm). **Cài đặt site** `/quan-tri/cai-dat`: danh mục khoá cố định trong `lib/cau-hinh.ts` (dải thông báo + link, 3 mức thưởng Sao, trần lượt mời/30 ngày, công tắc + giá Luận giải toàn bộ), web đọc qua `cau_hinh_cong_khai()` cache 60 giây; mức thưởng Sao đọc thẳng trong SQL (`sao_muc`, kẹp 0–100) → **chạy chiến dịch mời không cần sửa code**. **Người dùng & Sao** `/quan-tri/nguoi-dung`: cấp/gỡ vai trò (chủ sở hữu, không tự đổi/gỡ mình), tra ví Sao theo email (chủ sở hữu + hỗ trợ, mỗi lần tra ghi nhật ký), bút toán điều chỉnh có lý do + khoá chống ghi trùng. Tổng quan thêm **chuỗi 12 tuần** + hệ số mời K | ✅ Code xong, cần chạy 0011 (VIEC-CUA-ANH Q6). SEO chuyển hướng: để sau (đi qua git như KB khi cần) |
| **QT-3** | **Hỏi đáp** `/quan-tri/hoi-dap`: nhật ký hỏi đáp ẩn danh → mảng nào chưa phủ, mục KB engine báo thiếu, câu chưa trả lời tốt / bị 👎. **Trợ lý AI** trong trình sửa: nút ✨ mỗi ô → 5 kiểu (viết lại, viết sâu, rút gọn, soát lỗi, nói đời thường) → nháp + cảnh báo → người bấm "Dùng bản nháp". **Kiểm định** luật cố định (giọng phán, vùng cấm, liên hệ, số lạ, độ dài) tự chạy khi mở bảng thay đổi trước Xuất bản. Engine `/v1/quan-tri/soan-nhap`, `/kiem-dinh` (`app/quan_tri_ai.py`), hạn mức AI quản trị riêng `LLM_QT_LUOT_*` | ✅ Code xong. Máy chủ MCP cho Claude thao tác CMS: để sau |
| **QT-4** | **Tăng trưởng** `/quan-tri/tang-truong`: phễu sự kiện PostHog + tỷ lệ quay lại tuần, Search Console (tổng, truy vấn, trang, **cơ hội**: vị trí 4–20 nhiều hiển thị ít nhấp), GA4 (kênh, sự kiện) — khoá chỉ đọc qua env, JWT ký bằng `node:crypto` (không thêm thư viện), cache 1 giờ. **Tìm toàn kho** (không dấu) ở Kho tri thức → mở thẳng trình sửa đúng chỗ | ✅ Code xong, cần khoá (Q7, Q8). Tìm theo nghĩa (pgvector): để sau — cần bật extension + chi phí nhúng |

## Luật cho lớp AI trong quản trị

- AI là công cụ biên tập, **không phải tầng sinh dữ kiện**. Không chạm CALC, không tự xuất bản.
- Kết quả luôn mang trạng thái `nhap_ai`, kèm `can_doi_chieu` khi chưa đối chiếu nguồn.
- Model đi qua OpenRouter như lớp narrative. Hạn mức dùng `ngan_sach.py`.

## File

- `supabase/migrations/0010_quan_tri.sql` (+ `.down.sql`)
- `web/lib/quan-tri.ts`: cổng 3 lớp
- `web/lib/supabase/may-chu.ts`: Supabase phía máy chủ, chạy theo quyền người dùng
- `web/proxy.ts` (trước Next 16: `middleware.ts`): làm mới phiên và gắn noindex cho `/quan-tri`
- `web/app/quan-tri/`: bảng điều khiển và `xac-thuc/` (đăng ký hoặc nhập mã TOTP)
- `web/e2e/quan-tri.spec.ts`
- QT-2: `supabase/migrations/0011_quan_tri_2.sql` (+ `.down.sql`) · `web/lib/cau-hinh.ts` · `web/lib/quan-tri-api.ts`
  · `web/app/quan-tri/{cai-dat,nguoi-dung}/` · `web/app/api/quan-tri/{cai-dat,vai-tro,sao}/` · `web/components/khung/ThongBaoSite.tsx`
  · `web/components/quan-tri/TangTruongTuan.tsx` · `web/app/api/sao/muc/route.ts`
- QT-3: `engine/app/quan_tri_ai.py` + `quan_tri_api.py` (+ `tests/test_quan_tri_ai.py`) · `web/app/api/quan-tri/ai/`
  · `web/app/quan-tri/hoi-dap/` · `web/app/quan-tri/tri-thuc/[tep]/TroLyAI.tsx`
- QT-4: `web/lib/so-lieu-ngoai.ts` · `web/lib/kb-tim.ts` · `web/app/quan-tri/tang-truong/` · `web/e2e/so-lieu-ngoai.spec.ts`
- QT-1: `web/lib/kb-sua.ts` (sửa đúng vị trí, kiểm lại cấu trúc) · `web/lib/github-quan-tri.ts` · `web/app/quan-tri/tri-thuc/`
  · `web/app/api/quan-tri/tri-thuc/route.ts` · `web/e2e/kb-sua.spec.ts` (chạy trên mọi file KB thật)
