# DN-1 — Cách đăng nhập: Google · Apple · Facebook · email; tắt số điện thoại

Chủ dự án yêu cầu 2026-11-17: thêm đăng nhập Facebook / Apple, bỏ đăng nhập bằng số điện thoại (mỗi SMS tốn phí) — mở lại khi
doanh thu cao. Khâu vòng tăng trưởng: **MỜI + NẠP** (tài khoản là điều kiện nhận thưởng mời, ví Sao); đo tỉ lệ
`/dang-nhap` → đăng nhập thành công theo từng cách.

## 1. Code đã làm

- Một env công khai **`NEXT_PUBLIC_DANG_NHAP`** (dự án Vercel **web**) quyết định nút nào hiện:
  `google,apple,facebook` — thêm `sdt` khi muốn mở lại số điện thoại. Chưa đặt = chỉ Google (+ email luôn có).
  Đọc ở `web/lib/dang-nhap.ts`, test `web/e2e/dang-nhap.spec.ts`.
- Trang `/dang-nhap`: nút Google → Apple → Facebook, dưới là ô email nhận mã. Tab "Số điện thoại" chỉ hiện khi env có `sdt`
  (mã gửi SMS vẫn giữ nguyên, không xoá).
- Chính sách quyền riêng tư: thêm dòng nhà cung cấp đăng nhập (Google, Apple, Facebook), hiệu lực 17/11/2026.
- Không đổi DB, không thêm thư viện: Supabase Auth đã có sẵn ba nhà cung cấp, cùng đường `/auth/callback` với Google.

> Quan trọng: env chỉ **ẩn nút**. Phải tắt **Phone** trong Supabase (mục 2) thì người ngoài mới không gọi thẳng API để gửi SMS.

## 2. Tắt số điện thoại (5 phút — làm ngay)

1. supabase.com → dự án → **Authentication → Sign In / Providers → Phone** → tắt **Enable Phone provider** → Save.
2. Nhà cung cấp SMS (Twilio / Vonage… nếu đã gắn): huỷ số / gói trả trước để khỏi bị trừ tiền định kỳ.
3. Tài khoản cũ đăng ký bằng số điện thoại sẽ không đăng nhập được nữa. Nếu đã có người dùng thật như vậy, báo em — em làm
   bước "gắn email vào tài khoản" trước khi tắt.

Mở lại sau: bật lại Phone ở Supabase + thêm `sdt` vào `NEXT_PUBLIC_DANG_NHAP` + bật CAPTCHA cho đăng nhập (chống gửi SMS rác).

## 3. Facebook (miễn phí, ~30 phút)

Cần: tài khoản Facebook cá nhân của anh. Lấy trước **Callback URL** ở Supabase → Authentication → Providers → **Facebook**
(dạng `https://<mã dự án>.supabase.co/auth/v1/callback`).

1. developers.facebook.com → **My Apps → Create App** → mục đích **"Authenticate and request data from users with Facebook
   Login"** → loại **Consumer** (nếu được hỏi) → tên app "Hiểu Bản Thân", email liên hệ.
2. **Use cases → Authentication and account creation → Customize**: bật quyền **email** (public_profile có sẵn).
3. **Facebook Login → Settings → Valid OAuth Redirect URIs**: dán Callback URL của Supabase → Save.
4. **App settings → Basic**:
   - App domains: `hieuban.com`
   - Privacy Policy URL: `https://hieuban.com/chinh-sach-rieng-tu`
   - Terms of Service URL: `https://hieuban.com/dieu-khoan`
   - User data deletion → *Data deletion instructions URL*: `https://hieuban.com/chinh-sach-rieng-tu#quyen` (trang có hướng dẫn
     xoá tài khoản; người dùng xoá được ở Tài khoản → Dữ liệu của tôi)
   - App icon 1024×1024 (dùng `docs/brand/Hieuban-Brand-Kit.zip` → avatar), Category: Lifestyle.
   - Chép **App ID** và **App Secret**.
5. Bật app sang **Live** (công tắc đầu trang). Quyền email + public_profile là quyền chuẩn, không cần App Review. Nếu Meta đòi
   xác minh doanh nghiệp / cá nhân thì làm theo màn hình (giấy tờ của anh).
6. Supabase → Providers → **Facebook** → bật, dán App ID (Client ID) + App Secret → Save.
7. Vercel (dự án web) → `NEXT_PUBLIC_DANG_NHAP` = `google,facebook` → Redeploy.
8. Thử: mở hieuban.com/dang-nhap trên điện thoại → "Tiếp tục với Facebook" → về `/tai-khoan` là xong.

## 4. Apple (99 USD / năm, ~45 phút + gia hạn khoá 6 tháng một lần)

Cần: **Apple Developer Program** (99 USD/năm, đăng ký bằng Apple ID của anh — cá nhân được; duyệt 1–2 ngày).

1. developer.apple.com → **Certificates, Identifiers & Profiles → Identifiers → +**:
   - **App IDs** → loại App → mô tả "Hieuban", Bundle ID `com.hieuban.app` → tích **Sign in with Apple** → Register.
   - Lại **+ → Services IDs** → mô tả "Hieuban Web", Identifier `com.hieuban.web` → Register → mở lại → tích
     **Sign in with Apple → Configure**: Primary App ID = `com.hieuban.app`; **Domains**: `<mã dự án>.supabase.co`;
     **Return URLs**: Callback URL của Supabase (như Facebook) → Save → Continue → Save.
2. **Keys → +** → tên "Hieuban Sign in" → tích **Sign in with Apple** → Configure → chọn `com.hieuban.app` → Register →
   **Download** tệp `.p8` (chỉ tải được MỘT lần — cất kỹ, không gửi qua chat), ghi **Key ID**.
3. Ghi **Team ID** (góc phải trên trang Membership).
4. Supabase → Providers → **Apple** → bật:
   - Client IDs: `com.hieuban.web`
   - Secret Key: Supabase cần một chuỗi JWT tạo từ tệp `.p8` + Team ID + Key ID + Services ID. Ngay dưới ô đó Supabase có
     link công cụ tạo khoá (chạy trong trình duyệt của anh) — dán nội dung `.p8` vào đó, chép JWT ra ô Secret Key → Save.
5. Vercel → `NEXT_PUBLIC_DANG_NHAP` = `google,apple,facebook` → Redeploy. Thử trên iPhone (Safari) và máy Android.
6. **Đặt lịch nhắc 5 tháng**: JWT của Apple tối đa 6 tháng là hết hạn → tạo lại ở bước 4 (cùng tệp `.p8`), không thì nút
   Apple báo lỗi. Em có thể đặt nhắc tự động nếu anh muốn.

Ghi chú Apple: người dùng có thể chọn "Ẩn email" → Supabase nhận email dạng `…@privaterelay.appleid.com`. Đăng nhập vẫn
chạy bình thường; chỉ khi muốn gửi thư cho họ mới cần đăng ký tên miền gửi thư ở mục *Sign in with Apple for Email
Communication*. Hiện site không gửi thư tiếp thị nên chưa cần.

## 5. Em khuyên thứ tự

1. Tắt Phone ở Supabase (hết rủi ro tốn tiền SMS) — ngay.
2. Facebook — miễn phí, phần lớn người dùng Việt có sẵn tài khoản.
3. Apple — khi lượng người dùng iPhone đủ lớn để đáng 99 USD/năm + việc gia hạn khoá; Google + email đã đăng nhập được trên
   iPhone nên không gấp.
