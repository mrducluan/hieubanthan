# DN-1 + DN-2 — Cách đăng nhập: Google · Zalo · Apple · Facebook · email; tắt số điện thoại

Chủ dự án yêu cầu 2026-11-17: thêm đăng nhập Facebook / Apple, bỏ đăng nhập bằng số điện thoại (mỗi SMS tốn phí) — mở lại khi
doanh thu cao. Khâu vòng tăng trưởng: **MỜI + NẠP** (tài khoản là điều kiện nhận thưởng mời, ví Sao); đo tỉ lệ
`/dang-nhap` → đăng nhập thành công theo từng cách.

## 1. Code đã làm

- Một env công khai **`NEXT_PUBLIC_DANG_NHAP`** (dự án Vercel **web**) quyết định nút nào hiện:
  `google,apple,facebook` — thêm `sdt` khi muốn mở lại số điện thoại. Chưa đặt = Google + email (máy dev, CI). Đã đặt thì ô email chỉ hiện khi có `email` (DN-4, tắt 18/11/2026).
  Đọc ở `web/lib/dang-nhap.ts`, test `web/e2e/dang-nhap.spec.ts`.
- Trang `/dang-nhap`: nút Google → Zalo → Apple → Facebook; ô email nhận mã chỉ khi env có `email`. Tab "Số điện thoại" chỉ hiện khi env có `sdt`
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

## 5. Zalo (DN-2, miễn phí, ~20 phút)

**Chi phí**: đăng nhập bằng Zalo (Zalo Login / Social API) không thu phí; phần tốn tiền của Zalo là tin nhắn ZNS và
gói API Official Account — site không dùng hai thứ đó. (Môi trường của em chặn trang developers.zalo.me nên em chưa đọc
được trang giá chính thức; khi tạo app anh xem lại, thấy chỗ nào đòi tiền thì báo em.)

**Khác Google / Facebook**: Supabase không có sẵn Zalo, nên máy chủ web tự làm phần đăng nhập Zalo (`web/lib/zalo.ts`,
`/auth/zalo`, `/auth/zalo/callback`, OAuth v4 + PKCE, không thư viện mới) rồi cấp phiên Supabase cho một tài khoản đại diện
có email `zalo-<mã Zalo>@hieuban.com` (không có hộp thư thật, hệ thống không gửi thư tới đó). Zalo **không** trả email;
em chỉ xin mã người dùng — không xin tên, ảnh, số điện thoại. Trang Tài khoản hiện "tài khoản Zalo" thay cho email đó.

1. developers.zalo.me → đăng nhập bằng Zalo của anh → **Tạo ứng dụng** (tên "Hiểu Bản Thân", danh mục Lifestyle /
   Giải trí, website `https://hieuban.com`).
2. Trong ứng dụng → **Đăng nhập (Social API / Zalo Login)** → Callback URL: `https://hieuban.com/auth/zalo/callback`
   (chỉ khai đúng một dòng này) → Lưu. Nếu có mục quyền, chỉ cần quyền cơ bản (thông tin công khai).
3. Mục **Cài đặt / Thông tin ứng dụng**: chép **App ID** và **Khóa bí mật (Secret key)**. Bật trạng thái ứng dụng
   **Kích hoạt / Live** (nếu Zalo đòi xác thực tên miền thì làm theo màn hình — thường là đặt một thẻ meta hoặc tệp; gửi em
   nội dung, em thêm vào site).
4. Vercel (dự án **web**) → Environment Variables (Production):
   - `ZALO_APP_ID` = App ID (chỉ chữ số)
   - `ZALO_APP_SECRET` = Secret key (bí mật — không đặt tiền tố `NEXT_PUBLIC_`)
   - `SUPABASE_SERVICE_ROLE_KEY` phải đã có (dùng để tạo tài khoản lần đầu)
   - `NEXT_PUBLIC_DANG_NHAP` = `google,zalo` (thêm `facebook` khi xong mục 3)
5. Redeploy → mở hieuban.com/dang-nhap trên điện thoại → "Tiếp tục với Zalo" → cho phép → về `/tai-khoan` là xong.
   Lỗi gì cũng quay về `/dang-nhap` với dòng "Đăng nhập chưa thành công" (không lộ chi tiết) — báo em để xem log Vercel.

Lưu ý: một người đã có tài khoản bằng email / Google mà đăng nhập Zalo sẽ thành **tài khoản thứ hai** (Zalo không cho
email để nối). Gộp tài khoản chưa làm.

## 6. Google không lộ tên miền Supabase (DN-3)

Luồng Google cũ đi qua Supabase nên màn hình chọn tài khoản ghi "to continue to <mã dự án>.supabase.co". Nay máy chủ web tự
làm OAuth với Google (`web/lib/google-dang-nhap.ts`, `/auth/google`, `/auth/google/callback`), Google trả về
`hieuban.com/auth/google/callback`, rồi đổi sang phiên Supabase bằng `signInWithIdToken`. Màn hình Google sẽ ghi
**hieuban.com**; khi anh điền thương hiệu (bước 2) và được Google duyệt thì ghi **Hiểu Bản Thân** kèm logo.
Chưa đặt env → nút Google vẫn chạy luồng cũ (không hỏng gì).

1. console.cloud.google.com → đúng dự án đang dùng cho đăng nhập Supabase → **APIs & Services → Credentials** → mở
   **OAuth 2.0 Client ID** đang dán trong Supabase → Google provider:
   - Authorized JavaScript origins: thêm `https://hieuban.com`
   - Authorized redirect URIs: **thêm** `https://hieuban.com/auth/google/callback` (giữ dòng supabase.co cũ) → Save.
2. **OAuth consent screen → Branding** (Google Auth Platform): App name `Hiểu Bản Thân`, logo (avatar 512 trong
   `docs/brand/Hieuban-Brand-Kit.zip`), Home page `https://hieuban.com`, Privacy `https://hieuban.com/chinh-sach-rieng-tu`,
   Terms `https://hieuban.com/dieu-khoan`, Authorized domains: `hieuban.com` → Save → nếu có nút "Verify branding" thì gửi
   (miễn phí, vài ngày). Quyền chỉ cần email, profile, openid — không phải xét duyệt quyền nhạy cảm.
3. Vercel (dự án web) → Environment Variables (Production): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` = **đúng** cặp
   Client ID / Secret đang dán trong Supabase (để Supabase nhận token cùng "audience") → Redeploy.
4. Supabase → Authentication → Providers → Google: giữ nguyên bật (luồng mới vẫn cần provider này để nhận token).

Lựa chọn khác (không làm): Supabase Custom Domain `auth.hieuban.com` — cần gói Pro + phí bổ sung hằng tháng.

## 7. Redeploy trên Vercel không build lại (đã sửa)

Bước "Ignored Build Step" (`web/scripts/bo-qua-build.mjs`) so commit với lần deploy trước; bấm Redeploy cùng commit thì
không có gì khác → trước đây bị bỏ qua, nên biến `NEXT_PUBLIC_*` mới không lên site. Nay Redeploy cùng commit luôn build.

## 8. Em khuyên thứ tự

1. Tắt Phone ở Supabase (hết rủi ro tốn tiền SMS) — ngay.
2. Zalo — miễn phí, gần như mọi người dùng Việt có sẵn; một chạm trên điện thoại.
3. Facebook — miễn phí.
4. Apple — khi lượng người dùng iPhone đủ lớn để đáng 99 USD/năm + việc gia hạn khoá; Google + email đã đăng nhập được trên
   iPhone nên không gấp.

## 9. Zalo — lỗi đã gặp (DN-2b / DN-2c, 18/11/2026)

| Lỗi | Ở đâu | Nguyên nhân | Cách xử lý |
|---|---|---|---|
| `-14029 The application is not approved` | trang oauth.zaloapp.com | App Zalo chưa kích hoạt | Kích hoạt app ở developers.zalo.me |
| Mã `nguoi_dung` + nhật ký `[zalo] nguoi_dung { ma: -501 … }` | sau khi đổi mã thành công | Gọi `graph.zalo.me/v2.0/me` thiếu `appsecret_proof` (SDK chính thức luôn gửi) — **hoặc** Zalo chặn máy chủ ngoài Việt Nam (Vercel chạy ở Singapore; một dự án khác gặp đúng -501 và nghi lý do này, Zalo chưa xác nhận) | DN-2c gửi `appsecret_proof = HMAC-SHA256(access_token, app secret)`. Còn -501 → hỏi hỗ trợ Zalo for Developers kèm mã lỗi + "gọi /v2.0/me từ máy chủ Singapore"; tạm ẩn nút (bỏ `zalo` khỏi `NEXT_PUBLIC_DANG_NHAP`) |

Nhật ký Vercel: dự án web → Logs, lọc `[zalo]` — chỉ có tên bước + mã lỗi Zalo / Supabase, không token, không bí mật.
