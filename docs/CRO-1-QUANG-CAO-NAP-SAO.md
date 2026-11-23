# CRO-1 — Quảng cáo Meta → nạp Sao: vì sao 0 đơn, đã sửa gì (2026-11-22)

Khâu của vòng tăng trưởng: **NẠP Sao** (và THU HÚT từ quảng cáo). Đo bằng: `paywall_viewed → unlock_clicked → checkout_started →
payment_succeeded` theo `qc=meta`; phía Meta: Lead → AddToCart → InitiateCheckout → Purchase.

## 1. Số liệu (Meta Ads API, 06–21/11/2026, tài khoản NKVN_NDT, pixel 2153819128819535)

| Chỉ số | Giá trị |
|---|---|
| Chi | 1.234.964 ₫ (chiến dịch "BAT TU|CTW", 1 nhóm, 2 quảng cáo) |
| Tối ưu | **Lượt xem trang đích** (LPV) |
| Link click → LPV | 2.550 → 2.256 (88 %) · 547 ₫ / LPV · CTR 6,9 % |
| LPV → ra kết quả (ViewContent) | 106 (4,7 %) — Bát tự 5,9 %, Thần số 3,0 % |
| InitiateCheckout / Purchase từ quảng cáo | 0 / 0 |
| Video | xem trung bình 11–13 giây, ~2 % xem hết |
| Pixel | ~30 % sự kiện từ `http://localhost/` (cả 4 Purchase thử); API chuyển đổi **chưa từng gửi** |

## 2. Nguyên nhân (đi thử phễu trên iPhone giả lập)

1. **Lỗi**: bấm "Mở toàn bộ" Bản đồ con số (/than-so) hiện hộp "Hết câu hỏi miễn phí hôm nay" — `lib/goi-api.ts` chỉ coi đường dẫn có
   chữ `luan-giai` là báo cáo; `/api/thanso/ban-do-con-so`, `/api/thoi-gian-toi`, `/api/chan-dung` bị tính là hỏi đáp.
2. **Ưu đãi không thành tiền**: báo cáo 69 Sao, quà 10 Sao, gói nhỏ nhất 99.000 ₫ → khách vẫn trả 99.000 ₫. Trang ghi hai giá (34 / 69).
   Không chỗ nào nói 1 Sao ≈ 1.000 ₫; "Còn 39/39 suất" báo hiệu chưa ai mua.
3. **Đăng nhập trong app Facebook**: khách từ quảng cáo ở trình duyệt nhúng — Google chặn đăng nhập ở đó; nút Facebook không đứng đầu.
4. **Bát tự**: ô nhập dưới màn đầu, "Không biết giờ" giấu trong danh sách, phải tự bấm mở chương 1, "Sách xưa" đứng trước bài luận.
5. Nút mua ở ~màn thứ 11 trên điện thoại; không dòng tin cậy cạnh nút trả tiền.
6. Quảng cáo tối ưu LPV → Meta tìm người bấm rẻ, không tìm người nhập hồ sơ.

## 3. Đã sửa trong code

| # | Sửa | Tệp |
|---|---|---|
| 1 | Route báo cáo + header `x-mo-khoa` → luồng mở khoá báo cáo (đi thẳng tới đăng nhập, DN-5); hộp đăng nhập ghi đúng cách đăng nhập đang mở | `lib/goi-api.ts`, `components/sao/HopThoaiSao.tsx` |
| 2 | Chỉ tải `fbevents.js` trên hieuban.com (e2e: `NEXT_PUBLIC_E2E=1`) | `components/khung/MetaPixel.tsx` |
| 3 | Giá kèm "≈ N.000 ₫" ở hộp mở khoá, lời mời, khối cuối trang; giá khối "Đọc tiếp" theo giá riêng từng báo cáo; ẩn "Còn N/N suất" khi chưa ai dùng; dòng tin cậy (QR ngân hàng · hoàn Sao chưa dùng 7 ngày · hỗ trợ) | `lib/loi-sao.ts` `giaVnd`, `LuanGiaiToanBo.tsx`, `UuDai.tsx`, `api/goi-y-cheo`, `CuoiPhanXem.tsx`, `CtaCuoiBai.tsx` |
| 4 | Trang đăng nhập nhận biết app Facebook / Instagram / Zalo → xếp Facebook (Zalo) lên đầu, Google xuống cuối + lời nhắc | `lib/trinh-duyet-nhung.ts`, `app/dang-nhap/DangNhap.tsx` |
| 5 | Bát tự: chương 1 tự mở; "Sách xưa" dời xuống dưới bài luận; nút "Không biết giờ" thấy ngay; Bát tự + Tử vi có nút "Nhập ngày giờ sinh · xem ngay" ở màn đầu điện thoại | `app/bat-tu/BatTu.tsx`, `components/hoso/NhapHoSo.tsx`, `components/huyen-hoc/NutXuongForm.tsx`, `app/tu-vi/TuVi.tsx` |
| 6 | Thanh "Đọc tiếp N chương · X Sao (≈ ₫) · Mở toàn bộ" dính đáy khi đọc qua đầu bài (khi không có đợt ưu đãi — có ưu đãi thì thẻ nổi UD-3 làm việc này) | `LuanGiaiToanBo.tsx` `ThanhMoDay` |
| 7 | **Gói "Lần đầu" 59.000 ₫ / 59 Sao** (chủ dự án duyệt): chỉ tài khoản chưa từng nạp, kiểm trong SQL (`goi_sao_dang_ban` + `goi_lan_dau_duoc_mua`), công tắc `sao.goi_lan_dau.bat` mặc định tắt. 59 + 10 Sao chào mừng = 69 Sao | `supabase/migrations/0040_goi_lan_dau.sql`, `lib/thanh-toan/nap-dau.ts`, `/api/thanh-toan/goi`, `NapSao.tsx` |
| 8 | Tiêu đề /than-so khi chưa có hồ sơ nói lời hứa ("Bạn là số mấy?…") | `lib/chu/cong-cu.ts` (CMS ghi đè được) |
| 9 | Meta: **AddToCart** khi người dùng BẤM mở khoá (một lần / mảng / phiên, value ≈ ₫) — bậc giữa Lead và Purchase để tối ưu; InitiateCheckout có `value` | `lib/meta-pixel.ts` |

Không làm (cân nhắc rồi bỏ): đưa khách sang Safari/Chrome — hồ sơ chỉ lưu trên máy (localStorage của trình duyệt nhúng), mở trình
duyệt khác là mất hồ sơ + báo cáo chờ mở. Đồng hồ đếm ngược / "chỉ còn N suất" giả — trái UD-1.

## 4. Phễu cần đạt (trên 1.000 lượt vào trang → ~1 đơn)

| Bước | Cần | Hiện nay |
|---|---|---|
| Vào trang → ra kết quả | ≥ 25 % | 4,7 % |
| → đọc tới nút mua | 50 % | ? |
| → bấm mở khoá (AddToCart) | 15 % | 0 ghi nhận |
| → đăng nhập xong | 55 % | |
| → trả tiền | 12 % | 0 |

KPI 4 tuần: chi phí / Lead ≤ 4.000 ₫; Lead → InitiateCheckout ≥ 15 %; InitiateCheckout → Purchase ≥ 30 %.
Việc của chủ dự án (Ads Manager, env, migration): `docs/VIEC-CUA-ANH.md` mục CRO-1.

## 5. CRO-2 (2026-11-23) — áp cho các money page còn lại

Rà 5 trang có báo cáo thu Sao (/than-so, /bat-tu, /tu-vi, /thoi-gian-toi, /chan-dung). Phần chung của CRO-1 (luồng mở khoá,
giá ≈ ₫, thanh dính đáy, dòng tin cậy, AddToCart, "Không biết giờ") nằm trong `LuanGiaiToanBo` / `NhapHoSo` nên đã áp cho mọi
trang; dòng giá màn đầu + `?kw=` của QC-G (#341) đã có ở 4 trang. Còn thiếu và đã sửa:

| Trang | Thiếu | Sửa |
|---|---|---|
| /tu-vi | Phải bấm "Xem luận giải" mới có chương 1; bài luận nằm dưới lá số + 4 khối nâng cao (~6 màn điện thoại); "Sách xưa" chắn trước bài luận | Chương 1 tự tải (`tuMo`, như Bát tự; bản Anh giữ nút); nút "Đọc luận giải đời thường ↓" ngay đầu lá số (`tu-vi-den-luan-giai`, đo `chart_interacted{kind=den_luan_giai}`); "Sách xưa" dời xuống dưới bài luận |
| /chan-dung | Không có dòng giá màn đầu; điện thoại không thấy chỗ nhập | `gia` (QC-G) + nút "Nhập ngày giờ sinh · xem ngay" |
| /thoi-gian-toi | Điện thoại không thấy chỗ nhập | Nút "Nhập ngày sinh · xem ngay" (`NutXuongForm` nhận `chon`) |

Tự tải chương 1 là bản xem trước (không `x-mo-khoa`) — không bao giờ trừ Sao; đo `paywall_viewed{kind=luan_giai_tu_dong}`.
