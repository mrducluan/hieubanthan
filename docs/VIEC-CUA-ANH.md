# Việc của chủ dự án — danh sách nhắc

> Các việc dưới đây cần quyền tài khoản (Vercel, Render, Supabase, GoDaddy, Google…) nên em không tự làm được.
> **Mỗi phiên làm việc mới, Claude đọc file này và nhắc anh những mục chưa đánh dấu `[x]`.**
> Làm xong mục nào, anh đánh `[x]` (hoặc nhắn em đánh hộ).
> Cập nhật lần cuối: 2026-10-08.

## Anh đã chốt (2026-10-08)

- **Mở web công khai luôn**: vào `hieuban.com` là dùng được, không còn hỏi tên + mật khẩu. Đã gỡ hẳn lớp mật khẩu
  staging khỏi code (PR "mở công khai"). Sau khi merge và Vercel deploy xong là có hiệu lực.
- **Bỏ giai đoạn người dùng thử (Gate 0)**: không tuyển 20–50 người thử riêng; đo trực tiếp người dùng thật bằng PostHog.
- **Chưa bật đăng nhập tài khoản**: hồ sơ lưu trên máy người dùng (vẫn dùng đủ 5 mảng). Nút đăng nhập tự ẩn khi chưa có
  khoá Supabase trên Vercel, trang Tài khoản ghi "đang được chuẩn bị". Vì vậy **không cần làm** A3 phần Supabase/Google,
  A4, B3 và phần khoá Supabase của B4. Hướng dẫn được giữ ở mục F để khi nào cần thì bật.

## Thứ tự nên làm

1. [x] Tên miền `hieuban.com` trỏ về Vercel (A1, A2)
2. [x] Chạy migration 0001–0009 (B1, B2)
3. [ ] **Ba biến môi trường bắt buộc để mở công khai** → mục G (5 phút) — **làm ngay**
4. [ ] **Merge PR "mở công khai"** → web hết hỏi mật khẩu
5. [ ] **Khai báo Google Search Console** → mục H (10 phút) — để Google index 122 trang kiến thức
6. [ ] **Điền thông tin pháp lý** → mục E — nên làm sớm vì web đã công khai
7. [ ] Các việc còn lại → mục D

---

## G. Ba biến bắt buộc trước khi mở công khai (Vercel → Settings → Environment Variables → Production → Redeploy)

| Biến | Giá trị | Thiếu thì sao |
|---|---|---|
| `LOI_MOI_SECRET` | Chuỗi ngẫu nhiên ≥ 16 ký tự (`openssl rand -hex 24`). **Đặt một lần rồi giữ nguyên** | Nút **Chia sẻ** và **link mời hợp đôi báo lỗi** trên web thật |
| `NEXT_PUBLIC_SITE_URL` | `https://hieuban.com` | Code đã tự lấy `hieuban.com` khi thiếu, nhưng nên đặt cho rõ |
| `NEXT_PUBLIC_POSTHOG_KEY` | Project API key PostHog (posthog.com, tạo project vùng EU hoặc US) | Không biết có bao nhiêu người vào, dừng ở bước nào — thay cho Gate 0 |

Kiểm tra lại hai biến web đã có từ trước (web đang chạy được thì nhiều khả năng đã đúng):
`ENGINE_URL` (địa chỉ engine Render) và `ENGINE_API_KEY` (giống hệt bên Render).

Xoá luôn `STAGING_USER`, `STAGING_PASS` trên Vercel nếu còn (code mới không đọc nữa, xoá cho gọn).

**Kiểm tra:** sau Redeploy, trên máy anh chạy

```bash
cd web && node scripts/kiem-tra-trien-khai.mjs https://hieuban.com
```

Phải ra 14/14 ✓. Mở `hieuban.com` trên điện thoại (cả trong Zalo/Facebook) — vào thẳng, không hỏi mật khẩu.

## H. Google Search Console (để Google tìm thấy web)

1. search.google.com/search-console → **Add property** → chọn **Domain** → nhập `hieuban.com`.
2. Google đưa một bản ghi **TXT** (`google-site-verification=…`). Thêm vào DNS GoDaddy (như bước A2: tab DNS → Add →
   Type TXT, Name `@`, Value dán chuỗi đó). Quay lại Google bấm **Verify** (có thể chờ vài phút đến vài giờ).
3. Mục **Sitemaps** → nhập `sitemap.xml` → Submit.
4. Tuỳ chọn: Bing Webmaster Tools → **Import from Google Search Console** (1 cú bấm), để Bing/Copilot cũng thấy.

Sau 1–2 tuần, Search Console cho biết trang nào đã được index và người ta tìm từ khoá gì để vào web.

---

## A. Gắn tên miền hieuban.com (GoDaddy → Vercel) — A1, A2 đã xong

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

## B. "Bước 2" — migration và biến môi trường — B1, B2 đã xong

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

Các bước B3 (bật đăng nhập) và phần khoá Supabase của B4 **chưa cần** vì chưa bật tài khoản → xem mục F.
Các biến bắt buộc của B4 đã gom vào mục G.

---

## C. Mở cho người dùng — ĐÃ CHỐT: mở công khai (2026-10-08)

- [x] Bỏ mật khẩu staging (gỡ khỏi code, không phụ thuộc biến trên Vercel nữa).
- [x] Bỏ giai đoạn người thử riêng; đo bằng PostHog (mục G) + Search Console (mục H).

Rủi ro em ghi lại để anh biết (anh đã chấp nhận khi chốt):
- Trang pháp lý chưa có tên đơn vị vận hành + email liên hệ (mục E) → nên điền **trong tuần đầu**.
- Chưa giới hạn số lượt gọi (rate limit). Hiện an toàn vì AI chưa bật (`OPENROUTER_API_KEY` chưa đặt) nên không tốn
  tiền theo lượt; **trước khi bật AI cho người dùng** cần em làm thêm giới hạn lượt.
- Render gói Free ngủ sau 15 phút → người vào đầu tiên chờ 30–60 giây. Nên lên gói Starter Singapore (mục D).

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

Ưu tiên điền trước: `THONG_TIN_CHU_SO_HUU` và `THONG_TIN_EMAIL` — web đã công khai nên người dùng cần biết ai vận hành và
liên hệ ở đâu để xem/sửa/xoá dữ liệu (Luật 91/2025).

Việc pháp lý đi kèm. Đây là đề xuất, cần luật sư xác nhận:

- [ ] **Chọn danh nghĩa vận hành:** cá nhân, hộ kinh doanh hay công ty. Trước khi thu tiền (mua Sao) cần có đăng ký
  kinh doanh và thông báo website thương mại điện tử với Bộ Công Thương (online.gov.vn).
- [ ] **Luật sư rà 3 trang** `/chinh-sach-rieng-tu`, `/dieu-khoan`, `/mien-tru-trach-nhiem` (web đã mở, nên rà sớm). Căn cứ: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 01/01/2026) và Nghị định 356/2025/NĐ-CP.
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

## F. Khi nào muốn bật lại đăng nhập tài khoản (CHƯA cần — giữ để tra)

Làm đủ 4 việc dưới, nút Đăng nhập tự hiện, không cần sửa code:

1. **Supabase → Authentication → Sign In / Providers:** bật Email; Google (nhập Client ID/secret từ Google Cloud
   Console); Phone (SMS) tuỳ chọn, cần Twilio… có phí.
2. **Supabase → Authentication → URL Configuration:** Site URL = `https://hieuban.com`; Redirect URLs thêm
   `https://hieuban.com/**` và `https://www.hieuban.com/**`.
3. **Google Cloud Console** (nếu bật Google): OAuth consent screen → Authorized domains thêm `hieuban.com`;
   Credentials → OAuth client → Authorized JavaScript origins thêm `https://hieuban.com`. Redirect URI giữ
   `…supabase.co/auth/v1/callback`.
4. **Vercel** (Production) rồi Redeploy:

   | Biến | Giá trị |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Supabase → Project Settings → API) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | khoá `anon` / `publishable` |
   | `SUPABASE_SERVICE_ROLE_KEY` | khoá `service_role` (**tuyệt đối không** thêm tiền tố `NEXT_PUBLIC_`) — cho nút "Xoá tài khoản" |

5. **Email gửi thư đăng nhập (SMTP)**: email mặc định của Supabase chỉ gửi vài thư mỗi giờ. Đăng ký Resend / Brevo /
   Amazon SES gửi từ `no-reply@hieuban.com`, thêm bản ghi SPF/DKIM (TXT/CNAME) vào GoDaddy, rồi nhập vào
   Supabase → Project Settings → Authentication → SMTP Settings.

Ví Sao, link mời có thưởng chỉ chạy khi đã bật tài khoản.

**Render (engine)** — đặt khi cần, không liên quan đăng nhập:

| Biến | Giá trị | Khi nào |
|---|---|---|
| `OPENROUTER_API_KEY` | Khoá openrouter.ai | **Sau** khi chạy bộ 55 câu (mục D) và em làm giới hạn lượt |
| `NHAT_KY_HOI` + `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `1` + khoá Supabase | Muốn ghi câu hỏi đã lọc (không user_id/tên/ngày sinh) cho vòng tự cải thiện |
| `SENTRY_DSN` | Tuỳ chọn | Báo lỗi engine |

## D. Các việc còn lại (nhắc ở phiên sau)

- [x] ~~Gate 0 – 20–50 người thử~~ → anh chốt bỏ, mở công khai luôn. Thay bằng: sau 1–2 tuần có PostHog, gửi em
  ảnh/số funnel (vào trang → bắt đầu → xem xong → lưu hồ sơ) và góp ý để em đọc và đề xuất sửa.
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
- [ ] **Chạy bộ 55 câu chuyên gia với AI thật**: thêm secret `OPENROUTER_API_KEY` vào GitHub
  (Settings → Secrets → Actions), rồi vào Actions → **llm-55** → Run workflow, chạy 2 model. Gửi em link kết quả.
  Hướng dẫn chi tiết: `docs/CHAY-55-CAU-AI-THAT.md`.
- [ ] **Phong thuỷ xem qua ảnh nhà:** phần không cần ảnh đã xong (form Khảo sát nhà, schema, luật, công cụ chấm).
  Anh hỗ trợ giúp em 3 việc:
  1. Thu **50–100 bộ ảnh nhà thật**: mỗi nhà 5–15 ảnh (mặt tiền, cửa chính nhìn vào, phòng khách, bếp, phòng ngủ, WC,
     cầu thang). Mỗi bộ có **phiếu đồng ý** theo `docs/MAU-DONG-Y-ANH-NHA.md`. Ảnh để ở Google Drive riêng, không gửi
     qua chat công khai.
  2. Với mỗi nhà, ghi lại: **độ hướng nhà** (đo bằng mục "Đo hướng nhà" trên web), phòng nào ở phương nào, và đánh
     dấu 18 câu hỏi dấu hiệu, chính là các câu trong form Khảo sát nhà. Em chuyển thành nhãn JSON.
     Hướng dẫn: `engine/fixtures/phongthuy_anh/README.md`.
  3. Chọn model thị giác trên OpenRouter để em chạy thử PT-V2 (dùng chung khoá OpenRouter với mục AI diễn đạt).
- [x] **Trang Chính sách quyền riêng tư + Điều khoản + Miễn trừ + Giới thiệu + Liên hệ + footer** — đã làm (PL-1);
  còn điền thông tin ở mục E.

Vẫn **chặn cho tới khi qua cổng đánh giá**: thanh toán (mua Sao), cộng đồng, marketplace, app di động.
