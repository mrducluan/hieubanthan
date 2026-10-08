# Việc của chủ dự án — danh sách nhắc

> Các việc dưới đây cần quyền tài khoản (Vercel, Render, Supabase, GoDaddy, Google…) nên em không tự làm được.
> **Mỗi phiên làm việc mới, Claude đọc file này và nhắc anh những mục chưa đánh dấu `[x]`.**
> Làm xong mục nào, anh đánh `[x]` (hoặc nhắn em đánh hộ).
> Cập nhật lần cuối: 2026-10-08.

## Thứ tự nên làm

1. [ ] **Tên miền `hieuban.com`** → mục A (khoảng 30 phút, chờ DNS 5 phút đến vài giờ)
2. [ ] **Migration + biến môi trường** → mục B (khoảng 30 phút) — chính là "bước 2"
3. [ ] **Điền thông tin pháp lý** (mục E) → **quyết định mở cho người dùng thử** (mục C)
4. [ ] Các việc còn lại → mục D

---

## A. Gắn tên miền hieuban.com (GoDaddy → Vercel)

Web chạy trên Vercel. GoDaddy chỉ giữ tên miền, nên anh chỉ cần trỏ DNS của GoDaddy về Vercel. **Không** chuyển
tên miền khỏi GoDaddy, **không** mua hosting của GoDaddy.

### A1. Khai tên miền trên Vercel

1. Vào vercel.com → dự án web → **Settings → Domains → Add**.
2. Nhập `hieuban.com` → Add. Vercel hỏi có thêm `www.hieuban.com` không → chọn cách **đề xuất** (thường là
   `www` tự chuyển về `hieuban.com`).
3. Vercel hiện chữ **Invalid Configuration** kèm các bản ghi DNS cần tạo. **Chép đúng giá trị Vercel hiện ra.**
   Thường có dạng:

   | Loại | Tên (Host) | Giá trị |
   |---|---|---|
   | A | `@` | `76.76.21.21` (hoặc IP khác Vercel hiện, vd `216.198.79.1`) |
   | CNAME | `www` | `cname.vercel-dns.com` (hoặc chuỗi riêng dạng `xxxx.vercel-dns-0xx.com`) |

### A2. Sửa DNS trên GoDaddy

1. godaddy.com → đăng nhập → **My Products → Domains** → bấm `hieuban.com` → tab **DNS** (DNS Records).
2. **Bản ghi A có tên `@`:** GoDaddy thường để sẵn một bản ghi trỏ về trang "Parked".
   - Bấm biểu tượng bút để **sửa** bản ghi đó (đừng thêm bản ghi thứ hai).
   - Giá trị: dán IP Vercel đưa. TTL: 1 giờ (hoặc 600 giây).
3. **Bản ghi CNAME có tên `www`:** GoDaddy thường để sẵn giá trị `@`.
   - **Sửa** giá trị thành chuỗi Vercel đưa.
4. Mục **Forwarding** (chuyển tiếp tên miền) phải **để trống**. Nếu đang bật thì xoá, vì nó đè lên bản ghi A.
5. Giữ nguyên bản ghi **NS** và **SOA**. Nếu sau này có bản ghi **MX** hoặc **TXT** cho email, cũng giữ nguyên.
6. Quay lại Vercel → Domains: sau 5 phút đến vài giờ, dòng `hieuban.com` chuyển sang **Valid Configuration**.
   Vercel tự cấp chứng chỉ SSL (https), anh không cần mua SSL.

### A3. Báo cho ứng dụng biết địa chỉ mới (bắt buộc, nếu không link chia sẻ/ảnh OG/sitemap vẫn trỏ địa chỉ cũ)

1. **Vercel → Settings → Environment Variables:** đặt `NEXT_PUBLIC_SITE_URL` = `https://hieuban.com` (Production).
   Biến `NEXT_PUBLIC_*` được gắn lúc build, nên sau khi đổi phải **Deployments → Redeploy**.
2. **Supabase → Authentication → URL Configuration** (chỉ cần nếu đã bật đăng nhập):
   - **Site URL** = `https://hieuban.com`.
   - **Redirect URLs** thêm `https://hieuban.com/**` và `https://www.hieuban.com/**`.
   - Giữ dòng `*.vercel.app` và `localhost` nếu đang có.
   - Thiếu bước này thì bấm link đăng nhập trong email sẽ quay về địa chỉ cũ hoặc báo lỗi.
3. **Google Cloud Console** (chỉ cần nếu bật đăng nhập Google):
   - Vào **APIs & Services → OAuth consent screen → Authorized domains**, thêm `hieuban.com`.
   - Vào **Credentials → OAuth client**, thêm `https://hieuban.com` vào **Authorized JavaScript origins**.
   - Redirect URI vẫn là địa chỉ `…supabase.co/auth/v1/callback`, không đổi.
4. **Engine (Render):** không cần đổi gì. Web gọi engine từ phía máy chủ.
5. **Kiểm tra:** trên máy anh, chạy:

   ```bash
   cd web && node scripts/kiem-tra-trien-khai.mjs https://hieuban.com
   ```

   Kết quả phải ra 14/14 ✓. Nếu còn bật mật khẩu staging, thêm `STAGING_USER=… STAGING_PASS=…` vào trước lệnh.

### A4. Email đăng nhập (nên làm trước khi mời 20–50 người)

Email mặc định của Supabase chỉ gửi được rất ít thư mỗi giờ. Hơn 3–4 người đăng nhập cùng lúc là kẹt.

Cách khắc phục: dùng dịch vụ SMTP gửi thư từ `no-reply@hieuban.com`, ví dụ Resend, Brevo hoặc Amazon SES.

1. Đăng ký dịch vụ SMTP.
2. Dịch vụ sẽ đưa vài bản ghi **TXT/CNAME** (SPF, DKIM). Thêm các bản ghi này vào DNS GoDaddy như bước A2.
3. Vào **Supabase → Project Settings → Authentication → SMTP Settings**, nhập máy chủ, tài khoản và mật khẩu
   SMTP.

Phần này chỉ là cấu hình, không cần sửa code.

---

## B. "Bước 2" là gì — migration và biến môi trường

**Giải thích ngắn:**

- Code đã có sẵn các tính năng tài khoản, ví Sao, link mời và lời văn AI. Nhưng chúng chỉ **chạy thật** khi:
  1. cơ sở dữ liệu Supabase **đã có bảng** (tạo bằng các file *migration*), và
  2. Vercel/Render **có khoá** (biến môi trường).
- Thiếu hai thứ này, web vẫn chạy nhưng tự ẩn các phần đó: không có nút đăng nhập, hồ sơ chỉ lưu trên máy,
  link chia sẻ dùng khoá tạm, câu trả lời dùng mẫu thay cho AI.

### B1. Kiểm tra anh đã chạy migration nào chưa (1 phút)

1. Vào supabase.com → dự án → **SQL Editor → New query**.
2. Mở file `supabase/kiem_thu/da_chay_chua.sql` trong repo, chép toàn bộ, dán vào → bấm **Run**.
   File này chỉ đọc, không sửa gì.
3. Kết quả có 9 dòng, từ 0001 đến 0009. Cột `da_chay`:
   - `true` nghĩa là migration đó đã chạy;
   - `false` nghĩa là chưa chạy.

### B2. Chạy các migration còn `false` (theo đúng thứ tự số)

Mỗi file trong `supabase/migrations/` (bỏ qua file `.down.sql`):

1. Mở file trên GitHub.
2. Chép toàn bộ nội dung → dán vào SQL Editor → **Run**.
3. Thấy "Success" mới chạy file tiếp theo.

Các file đều chạy lại được, nên lỡ chạy lại một file đã chạy cũng không sao.

| File | Làm gì | Ai cần |
|---|---|---|
| `0006_ho_so.sql` | Bảng hồ sơ tài khoản (chỉ chủ hồ sơ đọc/sửa, xoá ngay khi bấm xoá) | Đăng nhập, lưu hồ sơ |
| `0007_ho_so_noi_sinh.sql` | Thêm nơi sinh, giờ mùa hè, độ tin giờ sinh vào hồ sơ | Hồ sơ Tử vi / Bát tự |
| `0008_sao_credit.sql` | Ví Sao, mã mời, thưởng mời bạn (một tầng) | Ví Sao, link mời có thưởng |
| `0009_kb_thanso_chan_dung_quan_he.sql` | Đưa 2 kho tri thức mới (chân dung 12 số × 4 mặt, hợp đôi theo 5 loại quan hệ) lên Supabase | Lưu trữ/duyệt nội dung |

Ghi chú về 0009: engine **hiện vẫn đọc kho tri thức thần số v2 từ file** trong code. Vì vậy chạy hay chưa chạy
0009 thì người dùng vẫn thấy chân dung và hợp đôi như nhau. 0009 để kho trên Supabase đầy đủ, chuẩn bị cho việc
duyệt nội dung trên bảng.

Muốn gỡ một migration thì chạy file `.down.sql` cùng tên (gỡ theo thứ tự ngược lại).

### B3. Bật đăng nhập trên Supabase

Vào **Supabase → Authentication → Sign In / Providers**:
- **Email**: bật.
- **Google**: bật, nhập Client ID và Client secret lấy từ Google Cloud Console.
- **Phone (SMS)**: tuỳ chọn. Cần nhà cung cấp SMS (Twilio…), có tính phí; có thể để sau.

### B4. Biến môi trường

Lấy khoá Supabase ở **Supabase → Project Settings → API**.

**Vercel** (Settings → Environment Variables, Production). Sửa xong phải **Redeploy**.

| Biến | Giá trị | Thiếu thì sao |
|---|---|---|
| `ENGINE_URL` | `https://hieubanthan-engine-sg.onrender.com` (hoặc engine đang dùng) | Mọi phép tính lỗi |
| `ENGINE_API_KEY` | Chuỗi ngẫu nhiên, **giống hệt** bên Render | 502 "từ chối kết nối" |
| `NEXT_PUBLIC_SITE_URL` | `https://hieuban.com` | Link chia sẻ / sitemap trỏ sai |
| `LOI_MOI_SECRET` | Chuỗi ngẫu nhiên ≥ 16 ký tự. **Đặt một lần rồi giữ nguyên** (đổi là mọi link cũ hỏng) | Link mời / thẻ chia sẻ không an toàn |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Ẩn đăng nhập |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | khoá `anon` / `publishable` | Ẩn đăng nhập |
| `SUPABASE_SERVICE_ROLE_KEY` | khoá `service_role` (**tuyệt đối không** thêm tiền tố `NEXT_PUBLIC_`) | Nút "Xoá tài khoản" không chạy |
| `NEXT_PUBLIC_POSTHOG_KEY` | Project API key PostHog | Không đo được người dùng (Gate 0) |
| `NEXT_PUBLIC_SENTRY_DSN` | Tuỳ chọn | Không báo lỗi |

**Render** (engine → Environment). Sửa xong Render tự khởi động lại.

| Biến | Giá trị | Thiếu thì sao |
|---|---|---|
| `ENGINE_API_KEY` | Giống Vercel | 502 |
| `OPENROUTER_API_KEY` | Khoá openrouter.ai (có nạp tiền) | Câu trả lời / luận giải dùng mẫu, không có lời văn AI |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Như trên | Kho tri thức v1 đọc từ file (vẫn chạy) |
| `NHAT_KY_HOI` | `1` để ghi nhật ký câu hỏi đã lọc (không có user_id/tên/ngày sinh) | Vòng tự cải thiện thiếu câu hỏi thật |
| `SENTRY_DSN` | Tuỳ chọn | Không báo lỗi |

Cách sinh chuỗi ngẫu nhiên: chạy lệnh `openssl rand -hex 24` trên máy, hoặc dùng trình quản lý mật khẩu.

**Kiểm tra bước 2 đã xong:**
- Trên web thấy nút **Đăng nhập**.
- Đăng nhập bằng email được.
- Vào **Tài khoản** thấy ví Sao (10 Sao chào mừng).
- Lệnh `kiem-tra-trien-khai.mjs` ra 14/14 ✓.

---

## C. Mở cho người dùng thử — cần anh quyết

Hiện web đang đặt **mật khẩu staging** (`STAGING_USER`/`STAGING_PASS` trên Vercel). Có hai cách:

| Cách | Làm gì | Ưu | Nhược |
|---|---|---|---|
| **Giữ mật khẩu** | Gửi kèm tên + mật khẩu cho 20–50 người thử | Kín, Google chưa thấy | Trình duyệt trong Zalo/Facebook hay không hiện ô mật khẩu; ảnh xem trước của link chia sẻ không hiện |
| **Bỏ mật khẩu** | Xoá 2 biến trên Vercel → Redeploy | Mở link là dùng được, chia sẻ đẹp, Google bắt đầu index 122 trang kiến thức | Ai cũng vào được |

**Em khuyên:** bỏ mật khẩu khi đã xong A + B + **E**. Các trang Chính sách quyền riêng tư, Điều khoản, Miễn trừ trách
nhiệm, Giới thiệu, Liên hệ và footer đầy đủ đã có (PL-1). Còn thiếu thông tin đơn vị vận hành (mục E) và bước luật sư duyệt.

---

## E. Thông tin pháp lý cho footer + trang Chính sách (PL-1)

Khung đã làm xong. Thông tin thật do anh điền trên **Vercel → Environment Variables** (Production) rồi **Redeploy**.
Biến nào để trống thì footer ẩn dòng đó, còn trang pháp lý ghi "đang cập nhật". Code không chứa thông tin thật nào.

| Biến | Ví dụ | Ghi chú |
|---|---|---|
| `THONG_TIN_CHU_SO_HUU` | `Hộ kinh doanh Hiểu Bản Thân` hoặc tên anh | Bên chịu trách nhiệm về dữ liệu |
| `THONG_TIN_MA_SO` | MST / số GCN đăng ký kinh doanh | Bắt buộc khi bán Sao (website thương mại điện tử) |
| `THONG_TIN_NOI_CAP` | `Sở KH&ĐT TP. Hà Nội, cấp ngày …` | Tuỳ chọn |
| `THONG_TIN_DIA_CHI` | Địa chỉ liên hệ | |
| `THONG_TIN_EMAIL` | `lienhe@hieuban.com` | Nên tạo email theo tên miền (mục A4) |
| `THONG_TIN_EMAIL_DU_LIEU` | `dulieu@hieuban.com` | Nhận yêu cầu xem/sửa/xoá dữ liệu; trống thì dùng email liên hệ |
| `THONG_TIN_DIEN_THOAI` | `09xx xxx xxx` | Điện thoại / Zalo |
| `THONG_TIN_BO_CONG_THUONG_URL` | link online.gov.vn | Chỉ điền **sau khi** đã thông báo Bộ Công Thương |
| `MXH_FACEBOOK`, `MXH_ZALO`, `MXH_TIKTOK`, `MXH_YOUTUBE` | `https://…` | Trống thì không hiện |

Việc pháp lý đi kèm. Đây là đề xuất, cần luật sư xác nhận:

- [ ] **Chọn danh nghĩa vận hành:** cá nhân, hộ kinh doanh hay công ty. Trước khi thu tiền (mua Sao) cần có đăng ký
  kinh doanh và thông báo website thương mại điện tử với Bộ Công Thương (online.gov.vn).
- [ ] **Luật sư rà 3 trang** `/chinh-sach-rieng-tu`, `/dieu-khoan`, `/mien-tru-trach-nhiem` trước khi bỏ mật khẩu
  staging. Căn cứ: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 01/01/2026) và Nghị định 356/2025/NĐ-CP.
- [ ] **Chuyển dữ liệu ra nước ngoài:** OpenRouter, PostHog và Sentry đặt ở Mỹ/EU. Hỏi luật sư xem dự án có thuộc diện
  miễn lập hồ sơ đánh giá tác động (doanh nghiệp nhỏ/khởi nghiệp, có điều kiện) hay phải lập và nộp Bộ Công an (A05).
- [ ] **Giữ đúng thời hạn lưu đã ghi trong chính sách:**
  - PostHog: Project settings → Data retention → 12 tháng (nếu gói cho phép; nếu không, sửa con số trong trang).
  - Sentry: mặc định ≤ 90 ngày.
  - Nhật ký câu hỏi tối đa 24 tháng: chạy định kỳ trong Supabase SQL Editor (hoặc đặt lịch bằng pg_cron):
    ```sql
    delete from thanso_hoi_nhat_ky   where created_at < now() - interval '24 months';
    delete from huyenhoc_hoi_nhat_ky where created_at < now() - interval '24 months';
    ```
- [x] Ô đồng ý lưu hồ sơ vào tài khoản **không tích sẵn** (đúng NĐ 356: cấm đồng ý mặc định), có link tới chính sách.

## D. Các việc còn lại (nhắc ở phiên sau)

- [ ] **Gate 0 – cho 20–50 người thật dùng thử.** Đây là việc quan trọng nhất. Cần có `NEXT_PUBLIC_POSTHOG_KEY`;
  sau 1–2 tuần, đọc funnel (vào trang → bắt đầu → xem xong → lưu hồ sơ) và các góp ý.
- [ ] **Hạ tầng GĐ1** (nếu chưa làm), xem `docs/TRIEN-KHAI.md`:
  - [ ] engine Render Singapore gói Starter;
  - [ ] Sentry;
  - [ ] báo sập (UptimeRobot);
  - [ ] sao lưu Supabase hằng tuần.
- [ ] **Thử la bàn đo hướng nhà trên điện thoại thật** (trang Phong thuỷ → "Đo hướng nhà"):
  - một iPhone và một Android;
  - so với la bàn thật, lệch không quá 15° là đạt.
- [ ] **Duyệt nội dung nháp AI:** quẻ, sao, chân dung thần số, hợp đôi theo quan hệ. Cần người có nghề đọc dần;
  duyệt xong file nào thì đổi `trang_thai` sang `da_duyet`.
- [x] **Phái tính tháng hạn Tử vi (lưu nguyệt):** anh chốt cho người dùng tự chọn phái → đã làm 5 phái
  (`docs/LUU-NGUYET-TUVI.md`).
- [ ] **Chạy bộ 55 câu hỏi chuyên gia với AI thật** (cần `OPENROUTER_API_KEY`) trước khi mở công khai rộng.
- [ ] **Phong thuỷ xem qua ảnh nhà (PT-V0):** cần 50–100 bộ ảnh nhà thật, có sự đồng ý của chủ nhà.
- [x] **Trang Chính sách quyền riêng tư + Điều khoản + Miễn trừ + Giới thiệu + Liên hệ + footer** — đã làm (PL-1);
  còn điền thông tin ở mục E.

Vẫn **chặn cho tới khi qua cổng đánh giá**: thanh toán (mua Sao), cộng đồng, marketplace, app di động.
