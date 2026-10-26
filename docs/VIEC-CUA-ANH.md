# Việc của chủ dự án — danh sách nhắc

> Các việc dưới đây cần quyền tài khoản (Vercel, Render, Supabase, GoDaddy, Google…) nên em không tự làm được.
> **Mỗi phiên làm việc mới, Claude đọc file này và nhắc anh những mục chưa đánh dấu `[x]`.**
> Làm xong mục nào, anh đánh `[x]` (hoặc nhắn em đánh hộ).
> Cập nhật lần cuối: 2026-10-13.

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
3. [x] Ba biến môi trường bắt buộc (mục G) — anh báo xong 2026-10-08
4. [x] Merge PR "mở công khai" (#50) + giới hạn lượt AI (#51)
4b. [ ] **Bảo mật (SEC-1, 1 phút):** sau khi PR SEC-1 deploy, mở `https://hieubanthan-engine-sg.onrender.com/health` →
   phải thấy `"khoa_engine": true`. Nếu `false` → Render → Environment → thêm `ENGINE_API_KEY` (giống Vercel) → Save.
   Báo cáo đầy đủ + việc còn mở: `docs/BAO-MAT.md`.
4c. [ ] **Khi web vượt ~100.000 người dùng/tháng** (xem GA4): Vercel → Environment Variables → thêm
   `NEXT_PUBLIC_HOI_DONG_Y_COOKIE=1` → Redeploy — hộp hỏi đồng ý cookie hiện lại khi mở trang (quyết định 2026-10-09).
4g. [ ] **Tầng HỌC thần số (TS-V3, 2026-10-20):** sau khi merge PR, Supabase → SQL Editor → chạy
   `supabase/migrations/0016_thanso_hoc.sql` (rollback: `0016_thanso_hoc.down.sql`). Chưa chạy thì góp ý "đúng / chưa
   đúng" vẫn hiện nhưng không lưu; xem kết quả ở `/quan-tri/hoc`. Cron xoá dữ liệu hết hạn (`/api/cron/don-du-lieu-hoc`,
   3:41 sáng UTC) dùng chung `CRON_SECRET` với cron đối soát — đã có thì không cần làm gì. Đọc kỹ quy tắc riêng tư mới ở CLAUDE.md (mục Quy tắc
   code) — nhờ luật sư rà cùng chính sách quyền riêng tư (mục E).
4h. [ ] **Kiểm chứng "Xem lá số 2 người" (HN-2N, 2026-10-22):** sau khi merge PR, Supabase → SQL Editor → chạy
   `supabase/migrations/0021_kiem_chung_hai_nguoi.sql` (SAU 0017; rollback: `0021_kiem_chung_hai_nguoi.down.sql` — xoá
   phiếu loại hai người). Kiểm bằng `supabase/kiem_thu/da_chay_chua.sql` (dòng 0021 = true). Chưa chạy thì nút "Đúng với
   mình / Chưa đúng" dưới hộp điểm 2 người vẫn hiện, PostHog vẫn đếm, nhưng máy chủ không lưu phiếu (Sentry báo một lần
   `kiem_chung_tu_choi` — đó là dấu hiệu chưa chạy). Nếu chưa chạy 0018 (`hồ sơ nhà + nhắc việc`) thì chạy 0018 trước.
4d. [ ] **NotFair blog (/blog):** Vercel → Settings → Environment Variables → thêm `NOTFAIR_SEO_API_KEY` = khoá `nfbl_…`
   (Production + Preview, **không** thêm tiền tố `NEXT_PUBLIC_`) → Redeploy. Rồi mở `https://hieuban.com/blog` và một bài
   `/blog/{slug}`: thấy ảnh bìa, mục lục bấm được, bảng cuộn ngang trên điện thoại. Chưa đặt khoá thì /blog chỉ hiện "Chưa có bài viết".
   Khoá đã lộ trong khung chat → nên tạo khoá mới trong NotFair (Integrations → Next.js) rồi dùng khoá mới.
4e. [ ] **Sửa bài NotFair trong CMS (BLOG-3 / BLOG-3b, 2026-10-24):** KHÔNG cần đặt `NOTFAIR_SEO_API_KEY` cho dự án CMS nữa —
   CMS đọc bài qua hieuban.com bằng `CMS_WEBHOOK_SECRET` + `WEB_URL` (đã có). Sau khi PR merge + **deploy web trước, CMS
   sau**: vào CMS → Bài viết → "Bài trao đổi NotFair — nhập vào CMS để sửa" → **Nhập tất cả** (hoặc từng bài) → mở bài → sửa
   chữ, ảnh → Xuất bản. Giữ nguyên link của đối tác + dòng ghi nguồn cuối bài. Nếu bảng vẫn trống: kiểm `CMS_WEBHOOK_SECRET`
   hai dự án (web + CMS) có giống nhau không.
4f. [x] **Audit AIO/SEO — anh đã quyết 7 mục (2026-10-21, SEO-K)**. Còn chờ anh: ngày cập nhật thật cho kho (`CAP_NHAT`),
   slug NotFair có dấu, `/ung-ho` có index không (bảng đầu `docs/AUDIT-AIO-SEO-2026-10.md`). `GoogleOther`: em đã chặn
   (2026-10-22, không ảnh hưởng Google Search — lý do ở audit). Đề xuất SEO tiếp theo chờ anh chọn: audit mục "SEO-L".
4h. [ ] **Sau khi merge SEO-K (15 phút) — làm theo thứ tự:**
   - **(1) Engine (Render) lên bản mới.** Merge vào `main` thì Render và Vercel **tự** deploy cùng lúc, anh không phải bấm
     theo thứ tự. Chỉ cần kiểm: Render → dịch vụ `hieubanthan-engine-sg` → **Events** → dòng mới nhất "Deploy live" có
     commit SEO-K (thường 5–10 phút). Nếu sau 15 phút vẫn "Build failed"/"Deploy failed" → bấm **Manual Deploy → Deploy
     latest commit**, rồi báo em log. Trong vài phút web lên trước engine, 46 trang tuổi hợp hướng trả 404 tạm — web
     KHÔNG lưu cache lỗi (chỉ cache phản hồi 200), engine lên là trang tự hết lỗi, không cần redeploy web.
     Kiểm nhanh: mở `https://hieuban.com/phong-thuy/huong-hop-tuoi/tuoi-1990` → thấy "Nam mệnh Khảm, nữ mệnh Cấn" là xong;
     mở `https://hieuban.com/phong-thuy/huong-hop-tuoi/tuoi-1990-nam` → tự chuyển về trang trên.
   - **(2) CMS: xem log migration.** Vercel → dự án **CMS** (cms.hieuban.com) → **Deployments** → bản Production mới nhất
     (Ready) → **Build Logs** → ô tìm kiếm gõ `SEO-K`. Có 3 khả năng:
     không thấy dòng nào = anh chưa sửa trang tuổi nào trong CMS, **xong**;
     `SEO-K tuổi nam: đổi N` = N trang đã tự chuyển sang trang gộp, **xong**;
     `TRÙNG đích bỏ qua: /phong-thuy/huong-hop-tuoi/tuoi-1990-nu` = năm 1990 anh sửa riêng cả nam lẫn nữ → em giữ bản
     nam; vào CMS → **Trang website** → mở `…/tuoi-1990` → chép phần chữ cần giữ từ bản `…/tuoi-1990-nu` sang → Xuất bản
     → xoá bản `-nu`. Build CMS báo đỏ ở bước `payload migrate` → gửi em ảnh log.
   - **(3) Search Console** → Sơ đồ trang web → ô "Thêm sơ đồ trang web mới" gõ `sitemap-ngay.xml` → Gửi.
   - **(4) Đo tốc độ (TTFB) — không cần cài gì:** GitHub → repo `hieubanthan` → tab **Actions** → bên trái chọn
     **"Kiểm tra SEO"** → nút **Run workflow** (để nguyên `https://hieuban.com`) → Run. Chờ 15–30 phút (quét ~950 trang)
     → bấm vào lượt chạy → mục **Summary** có dòng `TTFB (… trang): p50 … ms · p90 … ms` → chụp/chép gửi em.
     (Lượt chạy báo đỏ nghĩa là bộ rà tìm thấy LỖI SEO — danh sách nằm ngay dưới, gửi em luôn.) Máy GitHub đặt ở Mỹ nên
     số cao hơn người dùng Việt Nam thấy ~150–250 ms; em tính phần đó khi đề xuất.
4j. [ ] **Sau khi merge SEO-L (5 phút):** Search Console → **Kiểm tra URL** → dán lần lượt `https://hieuban.com/tuoi-xong-dat/2027`,
   `https://hieuban.com/xem-tuoi-lam-nha/2027`, `https://hieuban.com/xem-ngay-tot/cuoi-hoi-thang-12-2026` → **Yêu cầu lập chỉ mục**
   (đẩy nhanh trang mùa Tết). IndexNow giờ tự chạy mỗi sáng 06:13 — không cần làm gì.
4k. [ ] **Sau khi merge SEO-M (10 phút):**
   - **Search Console** → Sơ đồ trang web → gửi `sitemap-cum.xml` (một lần; Google tự đọc 16 sitemap con). Từ đó mục
     "Trang" lọc theo từng sitemap = biết cụm nào đã/chưa lập chỉ mục. **90 ngày sau**: cụm nào không có lượt hiển thị →
     báo em gộp hoặc tạm noindex.
   - **Search Console** → Cài đặt → bật **"Search generative AI"** (báo cáo trang được AI trích) nếu tài khoản có.
   - **Bing Webmaster Tools** → Sitemaps → gửi `sitemap.xml`, `sitemap-ngay.xml`, `sitemap-cum.xml` (Bing là nguồn tìm
     trang của ChatGPT). Xem thêm mục AI Performance của Bing nếu có.
   - **Phòng duyệt / đọc nhanh**: 205 trang kiến thức có thêm 500–980 chữ (nháp ban biên tập, ghi nguồn sách). Ưu tiên
     đọc đoạn "Sách xưa nói gì" ở thập thần / nhật chủ / tứ hoá — trích dẫn cổ thư cần người đối chiếu.
   - **Ảnh AI cho trang trụ** (anh chọn "cả hai"): cần một dịch vụ tạo ảnh có khoá API (vd qua OpenRouter đang dùng) —
     báo em dịch vụ + đặt khoá vào env thì em làm; hiện mọi trang đã có ảnh tóm tắt vẽ bằng code (có QR).
   - **Quyết định còn chờ** (audit SEO-M): mở bot `Google-Extended` (Gemini app trích được site, đổi lại cho phép dùng
     huấn luyện — lệch BM-2) hay giữ chặn.
4m. [ ] **Sao viral SAO-V (2026-10-25) — chạy migration 0025** (sau 0024): Supabase → SQL Editor → dán toàn bộ
   `supabase/migrations/0025_sao_viral.sql` → Run (rollback: `0025_sao_viral.down.sql`). Kiểm bằng
   `supabase/kiem_thu/da_chay_chua.sql` (dòng 0025 = true). Sửa luôn lỗi số dư: Sao mua không bao giờ hết hạn, tiêu Sao
   luôn trừ Sao tặng trước. Sau đó vào `/quan-tri/cai-dat` bật từng phần khi muốn chạy: **Hoa hồng nạp Sao**
   (`sao.hoa_hong.bat`, mặc định 20% đơn nạp đầu), **Chuỗi ngày ghé**, **Tặng một chương**, và **Thu Sao riêng:
   Bản đồ con số** (chạy thử thu Sao một mảng trước). Tất cả mặc định TẮT. Cần tài khoản (Supabase Auth) đã bật trên web
   thì các phần này mới chạy.
4n. [ ] **Chống gian lận SAO-GL (2026-10-26) — chạy migration 0026** (SAU 0025): Supabase → SQL Editor → dán toàn bộ
   `supabase/migrations/0026_chong_gian_lan.sql` → Run (rollback: `0026_chong_gian_lan.down.sql`). Kiểm bằng
   `supabase/kiem_thu/da_chay_chua.sql` (dòng 0026 = true). **Chạy 0026 TRƯỚC khi bật hoa hồng.** Mặc định bật: một máy
   nhận lời mời cho ≥ 3 tài khoản / 30 ngày, hoặc người mời và người được mời cùng máy → người mời không được thưởng /
   hoa hồng, ghi cờ ở `/quan-tri/doanh-thu` → "Cờ gian lận lời mời". Gia đình dùng chung một máy → tăng ngưỡng ở
   `/quan-tri/cai-dat`. Cần `SAO_KHOA_SECRET` (đã có cho SAO-2) để tính mã băm thiết bị.
4l. [ ] **Bảo mật SEC-2 (2026-10-23, `docs/BAO-MAT.md` mục SEC-2) — làm theo thứ tự:**
   1. [x] Render có `ENGINE_API_KEY` — anh xác nhận 2026-10-23.
   2. [ ] **Chạy migration** (sau khi merge PR SEC-2): Supabase → **SQL Editor** → New query → dán toàn bộ nội dung
      `supabase/migrations/0023_sec2_rls_quyen.sql` → **Run**; làm tiếp với `0024_sec2_hoan_sao_hoc.sql`. Kiểm: dán
      `supabase/kiem_thu/da_chay_chua.sql` → Run → hai dòng 0023, 0024 phải là `true`.
   3. [ ] **Security Advisor (3 phút)** — "trình quét lỗi cấu hình" có sẵn của Supabase:
      - Vào https://supabase.com/dashboard → chọn dự án của hieuban.com → menu trái **Advisors** (biểu tượng cái khiên)
        → **Security Advisor** → bấm **Rerun linter** (góc phải).
      - Tab **Errors** phải **trống**. Trước 0023 sẽ thấy 7 dòng "RLS Disabled in Public" (bảng `sources`, `schools`,
        `thanso_*`) — chạy 0023 xong bấm Rerun là hết.
      - Tab **Warnings / Info** — các dòng sau là **đúng thiết kế, bỏ qua**: "RLS Enabled No Policy" ở `luot_hoi`,
        `thanso_phan_hoi`, `thanso_cum_bat_thuong`, `cau_hoi_vec`, `de_xuat_luat` (bảng chỉ máy chủ ghi, cố ý không cho ai
        đọc); hàm `cau_hinh_cong_khai` cho anon (cài đặt công khai của site, không chứa bí mật).
      - Nếu có "Leaked Password Protection Disabled": Authentication → **Sign In / Providers** → Email → bật
        **Prevent use of leaked passwords**. "Auth OTP long expiry": Email OTP Expiration ≤ 3600 giây.
      - Dòng nào khác ngoài danh sách trên → chụp màn hình gửi em, em sửa bằng migration.
      (Em đã chạy thử toàn bộ migration trên Postgres trong máy: không còn bảng tắt RLS, không hàm nào thiếu
      `search_path`.)
   3b. [ ] **Sự cố CMS 2026-10-24 (build lỗi `EMAXCONNSESSION … pool_size: 15`, /admin "This page couldn't load")** —
      không do `ENGINE_QUAN_TRI_KEY`: CMS giữ hết 15 kết nối của cổng Session 5432. Bản sửa: CMS lúc chạy tự đi cổng
      Transaction 6543 (`cms/src/lib/chuoi-db.ts`), chỉ `payload migrate` dùng 5432 — **không cần đổi biến nào**. Nếu
      build vẫn báo đầy kết nối (kết nối cũ chưa nhả): Supabase → **SQL Editor** → chạy
      `select pg_terminate_backend(pid) from pg_stat_activity where usename = 'postgres' and state = 'idle' and pid <> pg_backend_pid();`
      → Vercel CMS → Deployments → bản mới nhất → **Redeploy**.
   4. [ ] **CMS — bật xác thực 2 bước (đã sửa lỗi "chưa có quyền")**: deploy CMS xong → đăng nhập
      https://cms.hieuban.com/admin → bảng điều khiển có dòng 🔒 **"Bật ngay (1 phút)"** (hoặc mở thẳng
      https://cms.hieuban.com/admin/xac-thuc-2-buoc) → **Bật xác thực 2 bước** → mở Google Authenticator / Microsoft
      Authenticator → **Quét mã QR** → nhập mã 6 số → Xác nhận. Mọi tài khoản Quản trị / Chủ biên làm xong thì đặt
      `CMS_BAT_BUOC_MFA=1` ở Vercel dự án **CMS** → Redeploy. Tài khoản không phải Máy đọc mà đang bật "Enable API Key" → tắt.
   5. [ ] **Khoá riêng cho AI quản trị (5 phút, tuỳ chọn nhưng nên làm):** tạo một chuỗi ngẫu nhiên dài (vd
      `openssl rand -hex 32`), đặt **cùng giá trị** biến `ENGINE_QUAN_TRI_KEY` ở 3 nơi: Render (engine), Vercel dự án web,
      Vercel dự án CMS → redeploy cả ba (engine trước). Chưa đặt thì vẫn chạy như cũ.
   6. [ ] **GitHub (5 phút)** — em không có quyền đổi cài đặt repo, anh bấm:
      - Repo → **Settings** → **Advanced Security** (hoặc "Code security") → bấm **Enable** cho: *Dependency graph*,
        *Dependabot alerts*, *Dependabot security updates*, *Secret Protection* (secret scanning) + *Push protection*,
        *Code scanning → CodeQL → Default setup* (repo công khai: miễn phí).
      - **Settings → Rules → Rulesets** → mở ruleset của `main` (đã có) → tích **Restrict deletions**, **Block force
        pushes**, **Require status checks to pass** → Add checks: `engine`, `web`, `supabase`, `cms`, `e2e` → Save.
        (Giữ như mục 10: không bắt "Require approvals" hoặc thêm anh vào Bypass list để em vẫn tự merge khi CI xanh.)
   7. [ ] **Supabase Auth (khi bật tài khoản):** Authentication → **Rate Limits** (giới hạn gửi SMS/email OTP), bật
      CAPTCHA (Turnstile/hCaptcha) cho đăng nhập SMS — chống bị gửi SMS rác tốn tiền.
   8. [ ] **GA4 / GTM (tuỳ chọn):** thẻ GA4 trong GTM đặt `page_location` bỏ đoạn mã thẻ `/the/...` và `?the=` (PostHog
      em đã lọc trong code).
   9. [ ] **Vercel (tuỳ chọn, thay cho Cloudflare ở GĐ1):** Settings → Billing → **Spend Management** đặt trần chi tiêu;
      Firewall → bật Attack Challenge Mode khi thấy lưu lượng lạ.
4i. [ ] **sameAs cho Google nhận ra thương hiệu + anh (5 phút, Vercel → web → Environment Variables):** kênh của site
   `MXH_FACEBOOK`, `MXH_YOUTUBE`, `MXH_TIKTOK`, `MXH_ZALO`, `MXH_INSTAGRAM`, `MXH_LINKEDIN`, `MXH_X`, `MXH_THREADS` (link https);
   hồ sơ cá nhân của anh `CHUYEN_GIA_SAME_AS_DUC_LUAN` = các link https cách nhau dấu phẩy (Facebook cá nhân, YouTube,
   LinkedIn…). Chỉ link thật của anh — em không tự điền. Đặt biến nào thì chân trang tự hiện nút kênh đó (vd `MXH_X` →
   nút "X (Twitter)") và schema `sameAs` tự có — xong bấm **Redeploy** dự án web.
5. [x] **Search Console + GA4 trong GTM** (mục H) — anh báo xong 2026-10-09
5b. [ ] **Render engine** (mục D2): kiểm vùng Singapore + gói Starter, bấm *Save, rebuild, and deploy* sau khi sửa biến
   (anh đang đặt `NHAT_KY_HOI`, `SUPABASE_*`, `LLM_LUOT_*` — 2026-10-09)
6. [ ] **Pháp lý còn lại** → mục E (tên đơn vị + email đã có trong code; còn MST, địa chỉ, luật sư)
7. [ ] Các việc còn lại → mục D (em đã ghi rõ việc nào em làm, việc nào cần anh)
8. [ ] **Lộ trình đến Gate 2** → mục L (đọc số funnel, chạy 55 câu, bật AI, pháp lý trước khi thu tiền)
9. [ ] **Trang quản trị `/quan-tri`** → mục Q (Q1–Q4 xong 2026-10-09; còn **Q5 token GitHub** cho Kho tri thức)
10. [ ] **GitHub ruleset** (để em tự merge PR khi CI xanh): GitHub → repo → Settings → Rules → Rulesets → ruleset của
   `main` → bỏ "Require approvals" hoặc thêm anh/ứng dụng Claude vào **Bypass list** → Save.
11. [ ] **Render engine báo "Deploy failed — invalid local: … Dockerfile: not a directory"** → làm theo
   `docs/TRIEN-KHAI.md` mục **1b**: Docker Build Context Directory = `engine` (thư mục), Dockerfile Path =
   `engine/Dockerfile`, Instance Type **Starter**, Region **Singapore** (sai vùng thì tạo lại bằng Blueprint).
12. [ ] **NotFair:** bài slug có chữ "đ" bị 404 — **em đã sửa** (PR #78). Sau khi merge + deploy, mở lại bài
   `/blog/xem-than-so-hoc-numerology-cach-tinh-va-đoc-ho-so-tinh-tao` và bấm "Verify/Publish" lại trong NotFair.

---

## G. Ba biến bắt buộc trước khi mở công khai — ✅ xong 2026-10-08 (Vercel → Settings → Environment Variables → Production → Redeploy)

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

## H. Google Search Console + Google Tag Manager + Google Analytics — ✅ anh báo xong 2026-10-09

**Vì sao em không tự làm được:** công cụ Google đang kết nối với phiên làm việc này là tài khoản của một doanh nghiệp
khác (Nha Khoa Tâm Đức), không có `hieuban.com`. Em **không đụng** vào tài khoản đó. Phần code em đã làm xong
(PR SEO-D), anh chỉ cần bấm trong tài khoản Google của anh và dán mã vào Vercel.

### H1. Search Console — ✅ anh đã cài (2026-10-08)

Còn kiểm 3 việc nhỏ dưới mục "Sau khi xác minh" (sitemap, yêu cầu index, Bing). Hướng dẫn xác minh giữ lại để tra.

**Cách 1 — DNS (khuyên dùng, xác minh cả `www` lẫn mọi đường dẫn):**
1. search.google.com/search-console → **Add property** → ô **Domain** → nhập `hieuban.com` → Continue.
2. Google đưa chuỗi `google-site-verification=…`. GoDaddy → `hieuban.com` → **DNS** → **Add New Record** → Type **TXT**,
   Name `@`, Value dán nguyên chuỗi → Save.
3. Quay lại Google bấm **Verify** (DNS có thể mất vài phút đến vài giờ; báo lỗi thì đợi rồi bấm lại).

**Cách 2 — thẻ meta (nhanh, không đụng DNS):**
1. Add property → ô **URL prefix** → `https://hieuban.com` → mục **HTML tag** → chép phần `content="…"` (chỉ chuỗi
   trong ngoặc kép).
2. Vercel → Environment Variables → `GOOGLE_SITE_VERIFICATION` = chuỗi đó → **Redeploy** → quay lại Google bấm Verify.

**Sau khi xác minh:**
- [x] Mục **Sitemaps** → nhập `sitemap.xml` → Submit (gửi 2026-10-09; lúc gửi Search Console báo *Couldn't fetch* —
  xoá dòng gửi nhầm `http://hieuban.com/`, kiểm lại sau 1–2 ngày phải thành **Success**; nếu vẫn lỗi: URL Inspection →
  dán `https://hieuban.com/sitemap.xml` → **Test live URL** → gửi em ảnh). Gửi lại sau mỗi đợt trang mới (sitemap hiện có 625 URL).
- [x] Mục **URL Inspection** → dán `https://hieuban.com/` → **Request indexing** (làm thêm cho `/kien-thuc`, `/tu-dien`).
- [x] **IndexNow** (Bing, Yandex, Seznam, Naver): tự báo toàn bộ URL sau mỗi lần merge vào `main` (workflow `indexnow`,
  khoá công khai ở `/indexnow.txt`) — không cần làm gì.
- [x] Bing Webmaster Tools (bing.com/webmasters) → **Import from Google Search Console** — Bing cũng cấp dữ liệu cho
  Copilot và ChatGPT tìm kiếm. (Muốn xác minh Bing bằng thẻ meta: env `BING_SITE_VERIFICATION`.)
- [ ] Nếu muốn em tự gửi sitemap, đọc báo cáo từ khoá hằng tuần: kết nối tài khoản Google có `hieuban.com` vào
  claude.ai (Settings → Connectors) rồi nhắn em.

### H1b. Rà SEO kỹ thuật — em đã làm (2026-10-08)

Công cụ `web/scripts/kiem-tra-seo.mjs` đọc sitemap rồi mở từng trang, kiểm tra: title, description, canonical, đúng một
thẻ H1, không noindex nhầm, Open Graph và Twitter, JSON-LD hợp lệ, breadcrumb, alt ảnh, link nội bộ hỏng, file .md, llms.txt.
Lần đầu chạy ra 5 lỗi và 52 cảnh báo, em đã sửa hết, giờ là **0 lỗi, 0 cảnh báo trên 150 trang**. Muốn tự chạy lại trên web thật:

```bash
cd web && node scripts/kiem-tra-seo.mjs https://hieuban.com
```

### H2. Google Analytics 4 + Google Tag Manager

Code đã sẵn (anh chốt 2026-10-09): **GTM nạp trên mọi trang, đo lường bật mặc định**, chưa hỏi đồng ý cookie khi
traffic còn thấp; người dùng vẫn tắt được ở "Tuỳ chọn cookie" (chân trang). Vượt ~100k người dùng/tháng → mục 4c.
Chính sách quyền riêng tư đã ghi đúng cách chạy này.

- [x] **GTM đã gắn vào web**: container `GTM-KNZL39CS` (anh gửi 2026-10-08) là mặc định trong code — không cần đặt
  biến trên Vercel. Từ 2026-10-09: nạp ngay khi mở trang (mang nonce CSP nên không bị chặn) + `<noscript>` iframe.
  Thẻ bên thứ ba khác (vd Meta Pixel) cài qua GTM → thêm tên miền vào env `CSP_THEM_MIEN` trên Vercel.
1. [x] **GA4:** analytics.google.com → Admin → **Create property** "Hiểu Bản Thân", múi giờ Việt Nam, tiền VND →
   **Web stream** `https://hieuban.com` → chép **Measurement ID** dạng `G-XXXXXXX`.
   - Admin → Data retention → **14 months** (khớp chính sách quyền riêng tư).
   - Admin → Data collection → **tắt** Google signals (không cần, giảm dữ liệu cá nhân).
2. [x] **Trong GTM `GTM-KNZL39CS`:** Tags → New → **Google Tag** → Tag ID = `G-XXXXXXX` → Trigger **Initialization – All
   Pages** → Save → **Submit → Publish**. (Không có bước này thì GTM nạp nhưng chưa gửi gì sang GA4.)
3. [x] **Kiểm tra:** mở `hieuban.com` ở cửa sổ ẩn danh → GA4 → Reports → **Realtime**
   thấy 1 người đang xem. Hoặc dùng nút **Preview** trong GTM (Tag Assistant).
4. Đổi container khác: đặt env `NEXT_PUBLIC_GTM_ID` trên Vercel. Tắt hẳn: đặt `NEXT_PUBLIC_GTM_ID=off`.
5. [x] Search Console → Settings → **Associations** → liên kết với GA4 property vừa tạo (xem từ khoá ngay trong GA4).

---

## A. Gắn tên miền hieuban.com (GoDaddy → Vercel) — ✅ xong

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

## B. "Bước 2" — migration và biến môi trường — ✅ B1, B2 xong

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
- Giới hạn lượt AI đã có (RL-1): mỗi người 40 lượt/giờ, tổng 400 lượt/giờ, 3000 lượt/ngày; hết lượt thì trả bản mẫu.
  Với model tầm trung, 3000 lượt/ngày tốn khoảng vài USD/ngày là cùng. AI vẫn tắt cho tới khi anh đặt `OPENROUTER_API_KEY`.
- Render gói Free ngủ sau 15 phút → người vào đầu tiên chờ 30–60 giây. Nên lên gói Starter Singapore (mục D).

## M. Chủ biên Đức Luân — hồ sơ và thẩm định bài (EEAT-1, 2026-10-09)

Vì sao và cách làm: `docs/EEAT-VA-CHUYEN-GIA.md`. Tóm tắt: anh đứng tên **Chủ biên** trên mọi bài, **Tác giả** trên
12 bài ý nghĩa số anh tự viết, **Thẩm định** trên bài anh đã đọc và duyệt. Bài chưa duyệt ghi "biên soạn có AI hỗ trợ,
đang chờ chuyên gia thẩm định" — không ghi tên anh là người viết.

- [ ] **M1. Tiểu sử thật** cho `/tac-gia/duc-luan` (hiện chỉ ghi điều anh đã nói: người sáng lập, hơn 15 năm nghiên cứu
  5 mảng). Gửi em những gì anh muốn công bố: học từ ai/đâu, sách đã đọc kỹ, kinh nghiệm luận giải, bài báo, khoá dạy…
  **Chỉ ghi điều có thật** — em không tự thêm.
- [ ] **M2. Ảnh chân dung** (tuỳ chọn; hiện dùng chữ "ĐL"). Ảnh anh gửi được phép đăng công khai.
- [ ] **M3. Link mạng xã hội / kênh của anh** (Facebook, YouTube, TikTok…) → schema `sameAs`, giúp Google nhận ra anh.
  Từ SEO-K đặt thẳng env `CHUYEN_GIA_SAME_AS_DUC_LUAN` (mục 4i), không cần sửa code.
- [ ] **M4. Duyệt kho tri thức theo cụm tại Phòng duyệt** — https://claude.ai/artifact/5ok13DRcbdxDGF7iMQ1TP4 (trang riêng,
  chỉ anh mở và ghi được; dùng tốt trên điện thoại). 496 bài chia 14 cụm: chọn cụm → mở bài → bấm **Đạt** (đúng với hiểu
  biết và trường phái của anh) hoặc **Cần sửa** + ghi chú; ô Góc nhìn chuyên gia tuỳ chọn. Bài Đạt → web ghi "Biên soạn &
  thẩm định: Đức Luân"; bài Cần sửa → em sửa, anh duyệt lại. Xong mỗi buổi nhắn em "cập nhật duyệt". Gợi ý thứ tự: 14
  chính tinh → 12 cung → 10 nhật chủ → 10 thập thần → 64 quẻ → các cụm dài.
- [ ] **M6. Góc nhìn chuyên gia** (GN-1): khi duyệt bài, gửi kèm 2–4 câu kinh nghiệm thật của anh theo mẫu
  `duyệt <link>` + `góc nhìn: …`. Em chỉ sửa chính tả, không thêm ý. Viết như đang nói với khách: một hiểu lầm hay gặp,
  một điều sách ít nói, hoặc câu anh hay trả lời. Không phán, không bệnh tật/tiền bạc cụ thể, không vật phẩm/giải hạn,
  không số điện thoại hay link. Ưu tiên 30 bài nhiều người xem nhất.
- [ ] **M7. Số liệu Search Console cho hàng đợi thẩm định**: chọn một trong hai —
  (a) **kết nối hieuban.com** vào công cụ Search Console mà em đang dùng (hiện công cụ đó chỉ thấy trang Nha khoa Tâm
  Đức, em không động vào) → em tự kéo hằng tuần; hoặc (b) mỗi tuần vào Search Console → Hiệu suất → tab **Trang** →
  Xuất → CSV, gửi em file `Trang.csv`. Em xếp hàng đợi: bài Google đã cho hiển thị nhiều mà ít người bấm lên trước.
- [ ] **M5. Chuyên gia mảng (GĐ1)**: sau 2 tháng, chọn 3–5 người cộng tác (mỗi mảng một người) — xem lộ trình mục 4
  của tài liệu trên.

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

- [x] Tên đơn vị **Hieu Ban Co Ltd** và email **contact@hieuban.com** (anh chốt 2026-10-08): em đặt làm mặc định trong
  code, footer + trang pháp lý + schema đã hiện. Muốn đổi thì đặt env cùng tên trên Vercel (env thắng mặc định).
- [ ] **Tạo hộp thư `contact@hieuban.com`** (chưa có thì thư người dùng gửi sẽ bị trả về): Google Workspace, Zoho Mail
  (gói miễn phí) hoặc chuyển tiếp miễn phí của ImprovMX về Gmail anh. Mỗi dịch vụ đưa bản ghi **MX** (+ TXT SPF) → thêm
  vào DNS GoDaddy.
- [ ] Còn trống: `THONG_TIN_MA_SO` (mã số doanh nghiệp), `THONG_TIN_DIA_CHI` — trang pháp lý đang ghi "đang cập nhật".

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

## Q. Trang quản trị `/quan-tri` (QT-0, 2026-10-09)

Thiết kế: `docs/KIEN-TRUC-QUAN-TRI.md`. Cần **bật tài khoản trước** (mục F: Google + 3 biến Supabase trên Vercel).

- [x] **Q1. Chạy migration:** Supabase → SQL Editor → New query → dán toàn bộ `supabase/migrations/0010_quan_tri.sql`
  → Run. (Gỡ: chạy `0010_quan_tri.down.sql`.)
- [x] **Q2. Bật MFA TOTP:** Supabase → Authentication → **Multi-Factor** → TOTP = *Enabled* (thường bật sẵn) → Save.
- [x] **Q3. Tự cấp quyền chủ sở hữu:** vào `https://hieuban.com/dang-nhap`, đăng nhập bằng Google **một lần** (để có
  tài khoản), rồi SQL Editor chạy (thay email):

  ```sql
  insert into vai_tro_quan_tri (user_id, vai_tro)
  select id, 'chu_so_huu' from auth.users where email = 'email-cua-anh@gmail.com';
  ```

  Phải báo `INSERT 0 1`. Báo `INSERT 0 0` nghĩa là sai email hoặc chưa đăng nhập lần nào.
- [x] **Q4. Vào trang quản trị:** cài **Google Authenticator** trên điện thoại → mở `https://hieuban.com/quan-tri` →
  bấm **Tạo mã QR** → quét → nhập mã 6 số. Lần sau chỉ cần nhập mã 6 số.
  ⚠️ Mất điện thoại = không vào được `/quan-tri`. Khi đó vào Supabase → Authentication → Users → chọn tài khoản →
  xoá factor MFA, rồi đăng ký lại.

- [x] **Q5. Kết nối GitHub cho "Kho tri thức" (QT-1)** (anh báo xong 2026-10-10; còn bước 5 sửa thử một chữ) — để sửa nội dung ngay trong `/quan-tri/tri-thuc`:
  1. GitHub → ảnh đại diện → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
     → **Generate new token**.
  2. Token name `hieuban-quan-tri` · Expiration **1 năm** (hết hạn thì tạo lại) · Repository access: **Only select
     repositories** → chọn `hieubanthan`.
  3. Permissions → Repository permissions: **Contents = Read and write**, **Pull requests = Read and write** (còn lại
     để No access) → **Generate token** → copy (chỉ hiện một lần).
  4. Vercel → Settings → Environment Variables → **Production**: `QUAN_TRI_GITHUB_TOKEN` = token vừa copy → Save →
     **Redeploy**.
  5. Mở `hieuban.com/quan-tri/tri-thuc` → thấy 20 file. Sửa thử một chữ → **Xuất bản…** → **Xuất bản (mở PR)** → mở PR
     trên GitHub, chờ CI xanh → **Merge**. Web/engine cập nhật sau khi Vercel + Render triển khai (vài phút).

  ⚠️ Token này ghi được code của repo — chỉ đặt trên Vercel, không dán vào chat/email. Lộ thì vào GitHub xoá token
  (Revoke) rồi tạo cái mới.

Thêm người quản trị khác: sau Q6, vào `/quan-tri/nguoi-dung` → nhập email (người đó phải đăng nhập hieuban.com một
lần trước) → chọn vai trò → **Cấp / đổi vai trò**.

### QT-2 → QT-4 (2026-10-10)

- [ ] **Q6. Chạy migration `0011_quan_tri_2.sql`** (bắt buộc cho Cài đặt, Người dùng & Sao, Hỏi đáp, chuỗi tuần ở
  Tổng quan): Supabase → SQL Editor → New query → dán toàn bộ file → Run → phải báo *Success*. Chỉ thêm hàm, không
  thêm/xoá bảng, không đụng dữ liệu. Gỡ: chạy `0011_quan_tri_2.down.sql`.
- [ ] **Q7. Search Console + GA4 trong `/quan-tri/tang-truong`** (tuỳ chọn, 10 phút):
  1. console.cloud.google.com → chọn/tạo project → **APIs & Services → Library** → bật **Google Search Console API**
     và **Google Analytics Data API**.
  2. **IAM & Admin → Service Accounts → Create** (tên `hieuban-doc-so-lieu`, không cần cấp role) → vào tài khoản đó
     → **Keys → Add key → JSON** → tải file về.
  3. Search Console → hieuban.com → **Cài đặt → Người dùng và quyền → Thêm người dùng** → dán email của service
     account (dạng `…@….iam.gserviceaccount.com`) → quyền **Bị hạn chế**.
  4. GA4 → **Quản trị → Quản lý quyền truy cập thuộc tính → +** → cùng email → vai trò **Người xem**. Ghi lại
     **Mã thuộc tính** (Quản trị → Chi tiết thuộc tính, là một dãy số).
  5. Vercel → Environment Variables → Production: `GOOGLE_SERVICE_ACCOUNT_JSON` = **toàn bộ nội dung file JSON**,
     `GA4_PROPERTY_ID` = dãy số ở bước 4 (nếu thuộc tính Search Console không phải dạng tên miền thì thêm
     `GSC_SITE_URL`, vd `https://hieuban.com/`) → Save → **Redeploy**.
  ⚠️ File JSON là khoá bí mật (chỉ đọc số liệu) — chỉ dán vào Vercel, xoá file trên máy sau khi dán.
- [x] **Q8. Phễu PostHog (anh báo xong 2026-10-13) trong `/quan-tri/tang-truong`** (tuỳ chọn): PostHog → avatar → **Personal API keys → Create**
  → scope **Query: Read** (chỉ chọn project hieuban) → copy. Vercel: `POSTHOG_PERSONAL_API_KEY` = khoá,
  `POSTHOG_PROJECT_ID` = số trong URL dự án (`us.posthog.com/project/12345`) → Redeploy. (Dự án ở EU thì thêm
  `POSTHOG_API_HOST=https://eu.posthog.com`.)
- [ ] **Q9. Trợ lý AI trong Kho tri thức** dùng `OPENROUTER_API_KEY` sẵn có trên Render — không cần làm gì. Muốn đổi
  model riêng cho biên tập hoặc hạn mức: Render → Environment: `OPENROUTER_MODEL_QUAN_TRI`, `LLM_QT_LUOT_NGAY`
  (mặc định 200 lượt/ngày), `LLM_QT_LUOT_GIO` (mặc định 60).
- [ ] **Q10. Thử chiến dịch mời đầu tiên** ở `/quan-tri/cai-dat`: dải thông báo + thưởng mời (vd 30/30 trong một
  tuần), xem hệ số K ở Tổng quan tuần sau. Xem `docs/MUC-TIEU-TANG-TRUONG.md`.

---

## CMS. Phòng biên tập Payload (bản đồ tổng + kế hoạch tiếp: `docs/KE-HOACH-HOAN-THIEN.md`) — cms.hieuban.com (CMS-1, 2026-10-11)

Chi tiết + lý do chọn: `docs/KIEN-TRUC-CMS.md` mục 7. Chưa làm các bước này thì web vẫn chạy như cũ.

- [ ] CMS1. Supabase → Storage → tạo bucket `cms-media` (Public) → Settings → Storage → S3 Connection → tạo Access key.
  **Lỗi tải ảnh "There was a problem while uploading the file." (anh báo 2026-10-24) — em đã tìm ra và sửa:** khi CMS có
  biến `S3_*`, bảng ảnh cần thêm 2 cột (`prefix`, `_objectKey`) mà migration cũ chưa có → mọi lần tải ảnh đều hỏng. Sau khi
  PR merge, CMS redeploy sẽ **tự chạy migration** `cot_kho_anh_s3`. Rồi anh vào CMS → Thư viện ảnh → bấm **"Kiểm tra kho
  ảnh"** (nút đầu danh sách): tải thử một ảnh 16×16 rồi tự xoá, báo từng bước ✓/✕ + việc cần làm bằng tiếng Việt (bucket
  chưa tạo, khoá sai, bucket chưa Public…). Lỗi tải ảnh từ nay cũng báo rõ lý do thay vì câu tiếng Anh chung chung.
  Ảnh tối đa **4,5 MB** (trần của Vercel), lớn hơn thì nén trước.
  **Lần 2 (2026-10-24, ảnh anh gửi: `SignatureDoesNotMatch` / "Something went wrong." / nhập NotFair lỗi):** Supabase đã
  nhận mã khoá nhưng chữ ký sai → **khoá bí mật** (`S3_SECRET_ACCESS_KEY`) sai/dán thừa ký tự, hoặc **`S3_REGION`** khác
  vùng dự án. Sau khi PR mới merge + CMS redeploy: Thư viện ảnh → **Kiểm tra kho ảnh** → dòng "Khoá + vùng S3" nói đúng
  biến cần sửa. Thường gặp nhất = khoá bí mật: Supabase → Project Settings → Storage → S3 Connection → **New access key**
  (khoá bí mật chỉ hiện một lần) → Vercel dự án **cms** → Settings → Environment Variables → sửa CẢ HAI
  `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` (Production) → **Redeploy** → bấm Kiểm tra kho ảnh lại cho tới khi ✓.
  Bài NotFair giờ **nhập được ngay cả khi kho ảnh lỗi** (chữ đầy đủ, ảnh thành đoạn "[Ảnh chưa nhập …]" — sửa kho xong
  thì tải ảnh vào và chèn thay; còn đoạn đó thì chưa xuất bản được). Supabase vẫn không được → chuyển **Cloudflare R2**:
  `docs/LUU-TRU-MEDIA.md` mục 4 (không sửa code; lưu ý tên miền ảnh khi DNS còn ở GoDaddy).
- [x] CMS2. (anh báo deploy thành công 2026-10-12) Vercel → Add New Project → repo này, **Root Directory `cms`** → nhập biến theo `cms/.env.example`
  (`DATABASE_URI` = Session pooler, `PAYLOAD_SECRET`, `CMS_URL`, `WEB_URL`, `CMS_EMAIL_QUAN_TRI` = email của anh,
  `CMS_WEBHOOK_SECRET`, `CMS_PREVIEW_SECRET`, `CRON_SECRET`, `S3_*`). Không dán khoá vào chat.
- [ ] CMS2b. Kiểm build log CMS có dòng `[van-tay-kb] 19 tệp, … cụm` (kiểm trùng với kho tri thức, CG-6). Nếu thấy
  "không thấy engine/app/kb/data" → Vercel project cms → Settings → Build and Deployment → Root Directory → bật
  **Include files outside the root directory in the Build Step** → Redeploy.
- [x] CMS3. (xong 2026-10-12) GoDaddy: CNAME `cms` → Vercel; gắn `cms.hieuban.com` vào project CMS.
- [x] CMS4. (xong 2026-10-12) Mở `https://cms.hieuban.com/admin` → tạo tài khoản đầu tiên bằng đúng email đã khai.
- [x] CMS5. (xong 2026-10-12) CMS → Ban biên tập → tạo "Web hieuban.com", vai trò **Máy đọc**, tick Enable API Key → chép khoá.
- [x] CMS6. (xong 2026-10-12) Vercel project **web** thêm `CMS_URL`, `CMS_API_KEY`, `CMS_WEBHOOK_SECRET`, `CMS_PREVIEW_SECRET` (giống
  bên CMS), `CMS_ANH_URL` → Redeploy.
- [ ] CMS7. Tạo tài khoản cho người viết (vai trò Biên tập viên — chỉ lưu nháp; anh là Chủ biên/Quản trị bấm Xuất bản).
- [ ] CMS8. Thử quy trình **Cộng tác viên / chuyên gia** (2026-10-12): Ban biên tập → tạo tài khoản vai trò "Cộng tác
  viên / chuyên gia" → người đó viết, chọn "Duyệt bài → Gửi duyệt" → anh thấy ô **Chờ duyệt** ở Tổng quan → ghi chú
  "Cần sửa" hoặc Xuất bản. Lộ trình chuyên gia + vì sao không làm hoa hồng nhiều tầng: `docs/KE-HOACH-CHUYEN-GIA.md`.
- [ ] TDG1. (2026-10-14) Sau khi PR "Tuổi làm nhà / hướng xấu năm / xông đất" merge: nếu Menu đầu trang đã sửa trong CMS thì thêm 3 menu con dưới "Khám phá": **/xem-tuoi-lam-nha**, **/huong-xau-nam**, **/tuoi-xong-dat**; gửi lại sitemap trong Search Console (thêm ~190 trang). Nếu nhà mình theo cách đếm Hoang ốc / Kim lâu khác (vd tính tuổi dương) thì báo em — đổi một hàm.
- [ ] HL1. (2026-10-13) Sau khi PR "Xem ngày tốt" merge + Render deploy engine: nếu anh đã tự sửa **Menu đầu trang** trong CMS (Giao diện website → Menu đầu trang) thì thêm menu con **"Xem ngày tốt" → /xem-ngay-tot** dưới mục "Bản thân" (menu mặc định trong code đã có; menu CMS đã lưu thì thắng menu mặc định). Search Console → Sitemaps → gửi lại `sitemap.xml` (thêm 15 trang lịch tháng + 43 trang số kép).
- [ ] CMS10. (2026-10-12) Sau khi PR "Giao diện website" merge + CMS Vercel redeploy (tự chạy migration): vào CMS → nhóm
  **Giao diện website** → *Điều hướng chân trang* (4 cột chân trang, mỗi link chọn Trang / Bài viết / Chuyên mục) và
  *Trang chủ & banner* (dải thông báo đầu trang, banner trang chủ, khối Bài viết mới + ghim bài, Bài viết liên quan).
  Bấm Lưu → hieuban.com đổi sau vài giây. Dải thông báo **không còn** ở /quan-tri/cai-dat (nếu anh từng đặt chữ ở đó thì đặt lại bên CMS; dòng cũ trong Supabase sẽ được xoá ở migration kế tiếp) (phân vai: `docs/KIEN-TRUC-CMS.md` mục 0).
- [x] SAO2. (anh báo xong bước 1–3 ngày 2026-10-13 — tài khoản đã bật, migration 0012 + 0013 đã chạy, khoá đã đặt) (2026-10-12) Cơ chế miễn phí ↔ Sao đã có code, **mặc định tắt**. Để bật (sau khi bật tài khoản mục F):
  1) Supabase SQL Editor chạy `supabase/migrations/0013_sao_2.sql` (sau 0012).
  2) Vercel web: `SUPABASE_SERVICE_ROLE_KEY` (đã cần cho payOS) + `SAO_KHOA_SECRET` (chuỗi ngẫu nhiên ≥ 32 ký tự,
     không dán vào chat) → Redeploy.
  3) /quan-tri/cai-dat → nhóm "Luận giải toàn bộ" bật thu Sao; nhóm "Hỏi đáp" bật giới hạn khi chi phí AI tăng.
  4) Xem tiền + người nạp ở /quan-tri/doanh-thu. Quy tắc + lộ trình: `docs/KE-HOACH-MIEN-PHI-VA-SAO.md`.
- [x] SAO3. (2026-10-14) **Nhiệm vụ kiếm Sao** (Lưu hồ sơ · Hỏi 3 câu · Mời 1 bạn → nhận Sao) đã có code, **mặc định tắt**:
  1) Supabase SQL Editor chạy `supabase/migrations/0014_nhiem_vu.sql` (sau 0013). Kiểm: `supabase/kiem_thu/da_chay_chua.sql`.
  2) Không cần khoá mới — dùng `SUPABASE_SERVICE_ROLE_KEY` đã đặt (để đếm câu hỏi của người đã đăng nhập).
  3) /quan-tri/cai-dat → nhóm "Nhiệm vụ kiếm Sao": xem mức (mặc định 5/5/5 Sao — cộng THÊM ngoài 10 Sao chào mừng và
     20+20 Sao mời) rồi bật "Thưởng Sao cho nhiệm vụ". Chưa bật: người đã đăng nhập vẫn thấy tiến độ, khách không thấy hộp.
  4) Câu hỏi chỉ được đếm từ lúc chạy 0014 (trước đó không có bộ đếm theo tài khoản).
- [ ] CMS11. (2026-10-12, CMS-2) Vercel project **cms** thêm `ENGINE_URL` + `ENGINE_API_KEY` (giống bên web) → Redeploy →
  khung **Trợ lý AI soạn nháp** ở cột phải trang viết bài chạy được (cần `OPENROUTER_API_KEY` trên Render).
- [ ] CMS12. (2026-10-12, CMS-2) Bật **xác thực 2 bước** cho chính anh: đăng xuất CMS → mở
  `https://cms.hieuban.com/admin/xac-thuc-2-buoc` sau khi đăng nhập → "Bật xác thực 2 bước" → thêm khoá vào Google
  Authenticator → nhập mã. Xong rồi mới đặt env `CMS_BAT_BUOC_MFA=1` ở Vercel cms → Redeploy (bắt buộc với Quản
  trị/Chủ biên). Mất điện thoại: một Quản trị khác đặt lại, hoặc em xoá cột MFA của tài khoản anh bằng SQL.
- [ ] CMS13. (2026-10-12, CMS-3/4) Sau khi PR merge + CMS redeploy: thử tạo **Trang đích** (Giao diện website → Trang đích)
  cho một chiến dịch (vd "Mời bạn tháng 11") → xuất bản → xem ở `hieuban.com/su-kien/{slug}`. Khi viết bài, mở khung
  **Gợi ý liên kết nội bộ** ở cột phải để chèn 2–5 link tới trang kiến thức/bài liên quan (tốt cho SEO).
- [ ] CMS14. (2026-10-12) **Kiểm thử go-live trên cms.hieuban.com** (CMS production đã deploy bản mới lúc 19:28 — trước đó
  bị kẹt ở bản #81 do lỗi bước bỏ qua build, đã sửa ở PR #90). Mất ~10 phút, làm theo thứ tự:
  1) Mở `https://cms.hieuban.com/admin` → thấy nhóm **Giao diện website** (Trang đích · Trang chủ & banner · **Menu đầu
     trang** · Điều hướng chân trang). Không thấy → nhấn Ctrl+F5; vẫn không → chụp màn hình Vercel project cms → Deployments.
  2) **Menu đầu trang** (sau khi PR menu merge): mỗi *Mục cha* có ô *Menu con* — thêm "Blog" → menu con trỏ tới Chuyên
     mục / Bài viết / Trang. Lưu → hieuban.com đổi sau vài giây (máy tính: rê chuột vào mũi tên; điện thoại: nút ☰ góc phải).
  3) **Điều hướng chân trang**: cột Kiến thức đã có "Blog" mặc định; thêm chuyên mục / trang đích nếu muốn.
  4) **Bài viết → Tạo mới**: viết thử một bài ngắn; cột phải có **Kiểm định** (chấm điểm), **Gợi ý liên kết nội bộ**
     (bấm "Tìm trang liên quan") và **Trợ lý AI soạn nháp** (dán một đoạn → Soạn nháp; cần CMS11). Xuất bản → mở
     `hieuban.com/blog/{slug}`: cuối bài có "Đọc tiếp" (bài liên quan theo nghĩa, cần ≥ 2 bài).
  5) **Trang đích → Tạo mới**: thêm khối Đầu trang, Thẻ công cụ, Danh sách bài viết, Hỏi đáp, Lời mời → Xuất bản →
     `hieuban.com/su-kien/{slug}`.
  Thấy chỗ nào lỗi: chụp màn hình gửi em. Em đã chạy đúng 5 bước này trên bản sao cục bộ (ảnh trong báo cáo QC).
- [ ] QHURL. (2026-10-19, quy hoạch URL phương án B) Sau khi PR merge + deploy:
  1) Search Console → Sơ đồ trang web → gửi lại `https://hieuban.com/sitemap.xml` (≈ 640 URL mới; URL cũ tự 308).
     Theo dõi báo cáo "Trang" 4 tuần: URL cũ chuyển dần sang "Trang có chuyển hướng" là đúng.
  2) CMS redeploy tự chạy migration `qh_url_doi_duong`: mọi "Trang website" + "Mẫu cụm trang" (kể cả bản ghi đè từng URL,
     `/la-so-mau`, `/huong-xau-nam`) **tự đổi sang đường dẫn mới, giữ nguyên chữ/ảnh anh đã sửa**. Sau đó bấm
     **Đồng bộ ngay** (Trang website). Chỉ khi log deploy CMS có dòng "TRÙNG đích bỏ qua" (đồng bộ lỡ chạy trước, đã tạo
     nháp trống ở URL mới) thì xoá nháp trống ở URL mới, đổi đường dẫn dòng cũ sang URL mới.
  3) Nếu đã tự sửa **Menu đầu trang / Điều hướng chân trang** trong CMS: đổi link `/huong-xau-nam` → `/phong-thuy/huong-xau-nam`,
     `/la-so-mau` → `/tu-vi/la-so-mau`, `/kien-thuc/…` → link mới (link cũ vẫn chạy nhờ 308 nhưng nên trỏ thẳng).
- [ ] ND7. (2026-10-22, ND-7 "Chữ trên trang") Sau khi PR merge, CMS redeploy tự chạy migration `nd_7_chu_tren_trang`
  (không cần biến mới). Thử ~5 phút:
  1) CMS → **Giao diện website → Trang website** → bấm **"Đồng bộ ngay"** (mang bảng chữ mới sang CMS + 6 mẫu cụm mới).
  2) Mở trang `/` → tab **"Chữ trên trang"**: mỗi dòng có chữ gốc + ô gõ chữ mới (vd sửa chip "30 giây · không cần tài
     khoản", 9 câu "Điểm mù", từng hàng bảng so sánh, thẻ 4 mảng) → **Xuất bản** → hieuban.com đổi sau vài giây. Để trống =
     chữ gốc; `*chữ*` = đoạn nhấn (vd tiêu đề `Bạn là *số mấy?*` giữ màu vàng); giữ nguyên `{ngay}`, `{ten}`… nếu có.
  3) Trang công cụ (`/than-so`, `/tu-vi`…): tab "Chữ trên trang" sửa dòng nhỏ trên tiêu đề, tiêu đề các mục, "Hỏi đáp cùng AI",
     "Kiến thức {mảng}", "Về công cụ {ten}".
  4) **Mẫu cụm trang** → "Xem ngày tốt · trang ngày" (và tháng, tuổi làm nhà, xông đất, hướng xấu năm): đổi tiêu đề cho cả
     cụm, thêm khối (banner, ảnh, video…). Riêng một ngày/năm: Trang website → Tạo mới → nhập đường dẫn (vd `/xem-ngay-tot/2027-02-17`).
  5) Tên + mô tả thẻ chủ đề ở `/kien-thuc`: sửa **H1 / Lời dẫn** của chính trang chủ đề (vd `/tu-vi/sao-o-cung`).
  Ảnh tải lên chỉ lưu lâu dài khi đã làm **CMS1** (bucket `cms-media`).
- [ ] ND7b. (2026-10-22, ND-7 đợt 2) Sau khi PR merge, CMS redeploy tự chạy migration `nd_7_dot_2_hinh_chu_chung` (không cần
  biến mới; xem trước dùng `CMS_PREVIEW_SECRET` đã có). Thử ~5 phút:
  1) Trang website → **"Đồng bộ ngay"** (mang bảng hình + chữ dùng chung sang CMS).
  2) Mở `/` → sửa một chữ → **Lưu nháp** (chưa xuất bản) → bấm **"Xem trước"**: web hiện bản nháp + dải "Đang xem bản nháp"
     (bấm "Thoát" để về bản công khai). Mẫu cụm cũng có "Xem trước" (mở một trang ví dụ của cụm).
  3) `/` → tab **"Hình trên trang"**: thay hình lớn đầu trang, 4 biểu tượng mảng (`/kham-pha`: 5 thẻ) bằng ảnh thư viện hoặc
     tải ảnh mới (ghi mô tả ảnh) → Xuất bản. "Về hình gốc" = hình vẽ cũ. Mẫu cụm có ô **"Ảnh chia sẻ"** (ảnh hiện khi dán link
     lên Facebook/Zalo) cho cả cụm — nên ảnh 1200×630.
  4) **Giao diện website → Chữ dùng chung**: nhãn + nút form "Họ tên / Ngày sinh / Xem con số của tôi", ô vào trang chủ, ô hỏi
     đáp, "Thử lại"; từ đợt 3 thêm nút góp ý cuối bài ("Có, khá trúng / Một phần / Chưa" — đổi chữ không lệch số Gate),
     "Đúng với mình / Chưa đúng", các nút chia sẻ (gửi, chép link, tải ảnh story), "Vì sao nói vậy" — sửa một lần, mọi trang
     đổi theo. Bấm "Đồng bộ ngay" sau mỗi lần web deploy có khoá mới.
  **Ảnh cần CMS1** (bucket `cms-media`): chưa làm thì ảnh tải lên có thể mất sau lần deploy CMS kế tiếp.
- [ ] ND45. (2026-10-19, ND-4/ND-5) Sau khi PR merge, CMS redeploy tự chạy migration `nd_4_5_anh_phap_ly`. Thử ~5 phút:
  1) **Trang pháp lý** (Trang website → `/dieu-khoan`…): sửa Mục / ngày hiệu lực → chọn "Thay đổi nội dung" + ngày mới
     → **tích ô "Tôi đã đối chiếu…"** → Xuất bản. Ô tự bỏ tích sau mỗi lần xuất bản (lần sau xác nhận lại). Đổi nội dung
     chính sách nên hỏi luật sư trước (mục E).
  2) **Trang kiến thức** (~600 trang): Giao diện website → **Mẫu cụm trang** → chọn cụm (vd "Trang con · Kinh Dịch") →
     thêm khối (Ảnh, Banner, Nút kêu gọi, Đoạn văn… — gõ `{tieu_de}` để chèn tên trang) → Xuất bản → áp cho cả cụm.
     Muốn riêng một URL: Trang website → Tạo mới → nhập đường dẫn → chọn "Ẩn khối mẫu" / "Thêm sau" / "Thay".
  3) **Ảnh**: tải ảnh vào Media (ghi "Mô tả ảnh"), rồi dùng khối **Ảnh** ở bất kỳ trang nào; trang Giới thiệu / Liên hệ /
     pháp lý chèn ảnh ngay trong Mục. Chữ của trang kiến thức (nghĩa sao, quẻ…) vẫn sửa ở `/quan-tri/tri-thuc` (git).
- [ ] ND23. (2026-10-14, ND-2/ND-3) Sau khi PR merge: CMS → **Giao diện website → Trang website** → mở một trang (vd `/tu-vi`,
  `/`, `/gioi-thieu`) → sửa Tiêu đề SEO / H1 / Lời dẫn / Đoạn giới thiệu / Hỏi đáp, thêm khối (Banner, Video, Nút kêu gọi…)
  → **Xuất bản** → hieuban.com đổi sau vài giây. Để trống ô nào = chữ cũ trong code; **gỡ xuất bản** = về nguyên bản.
  /gioi-thieu, /lien-he: sửa theo **Mục** (giữ đúng neo, vd `su-menh`, `nguon`). Video chỉ tải khi người đọc bấm phát.
  Nút kêu gọi có ô "Mã đo" → xem số bấm ở PostHog sự kiện `cms_khoi_bam`. Trang pháp lý + trang kiến thức: pha sau (ND-4, ND-5).
- [x] CMS15. (2026-10-13, ND-0/ND-1 — sửa nội dung từng trang) Sau khi PR merge, CMS redeploy tự chạy migration
  `noi_dung_trang`. Không cần biến mới (dùng `WEB_URL` + `CMS_WEBHOOK_SECRET` + `ENGINE_URL` đã có). Thử ~5 phút:
  1) CMS → **Giao diện website → Trang website** → bấm **"Đồng bộ ngay"** → danh sách hiện ~39 trang (công cụ, trang
     tĩnh, pháp lý, chủ đề) + **Mẫu cụm trang** (16 mẫu cho trang kiến thức). Lần sau tự đồng bộ mỗi ngày 08:00.
  2) **Điều hướng chân trang** → nhóm *Khối thương hiệu*: sửa lời giới thiệu / 3 cam kết / lời miễn trừ → Lưu →
     hieuban.com đổi sau vài giây; để trống = chữ cũ. Cuối trang có danh sách **"Sửa nội dung các trang trong chân trang"**.
  3) Mở một *Mẫu cụm trang* (vd sao ở cung) → xem trước chữ kho tri thức + nút **"Sửa nội dung này trong Kho tri thức"**
     (cần Q5 token GitHub để sửa được).
  Trang công cụ/trang tĩnh **chưa** đọc chữ từ CMS (pha ND-2, ND-3 làm tiếp) — sửa ở đó bây giờ chưa hiện lên web.
- [ ] CMS9. Ảnh/video: giữ **Supabase Storage** bây giờ, video đăng YouTube rồi chèn khối "Video YouTube"; chuyển R2
  khi vượt ~50 GB ảnh hoặc ~200 GB băng thông/tháng (`docs/LUU-TRU-MEDIA.md`).
- [ ] CG-a. Chốt **không làm hoa hồng nhiều tầng** (đa cấp dịch vụ bị cấm; Điều 217a BLHS) — thay bằng lộ trình chuyên
  gia + chia doanh thu theo kết quả của chính mình (`docs/KE-HOACH-CHUYEN-GIA.md` mục 1–2). Anh đồng ý thì nhắn em.

## TT. Thanh toán nạp Sao (kế hoạch + các bước bật: `docs/KE-HOACH-THANH-TOAN.md` mục 0b)

Code đã làm (2026-10-12, hình thức cá nhân): `/nap-sao`, payOS, webhook, đối soát, migration 0012, trang `/ung-ho`.

- [ ] TT-0. Chạy migration **`0012_thanh_toan.sql`** (sau khi bật tài khoản — mục F).
- [ ] TT-b. Đăng ký **payOS** bằng tài khoản ngân hàng của anh → Vercel đặt `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`,
  `PAYOS_CHECKSUM_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` → Redeploy → payOS khai Webhook URL
  `https://hieuban.com/api/thanh-toan/webhook/payos`. Không dán khoá vào chat.
- [ ] TT-f. **Ủng hộ crypto**: Vercel đặt `UNG_HO_VI` = `USDT (TRC20)|<địa chỉ>;Bitcoin|<địa chỉ>` (tuỳ chọn
  `UNG_HO_NGAN_HANG` = `Ngân hàng|Số TK|Chủ TK`) → Redeploy → nút ủng hộ hiện ở chân trang, `/ung-ho`, cuối bài.
- [ ] TT-a. Hộ kinh doanh + MST (anh bổ sung sau) → em làm hoá đơn điện tử (TT-6), mở thẻ Visa (TT-3).
- [ ] TT-c. Liên hệ VNPay hoặc OnePay nếu muốn nhận thẻ Visa/Master/JCB.
- [ ] TT-d. Luật sư rà điều khoản Sao + hoàn tiền; chọn nhà cung cấp hoá đơn điện tử.
- [ ] TT-e. Quyết bật tài khoản (mục F) — Sao cần gắn tài khoản.

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
| `OPENROUTER_API_KEY` | Khoá openrouter.ai | **Sau** khi chạy bộ 55 câu (mục D). Giới hạn lượt đã có (RL-1) |
| `LLM_LUOT_NGUOI_GIO`, `LLM_LUOT_TONG_GIO`, `LLM_LUOT_TONG_NGAY` | Mặc định 40 / 400 / 3000 | Hạn mức lượt AI: mỗi người mỗi giờ / tổng mỗi giờ / tổng mỗi ngày. Hết lượt thì người dùng vẫn nhận câu trả lời bản mẫu. Chỉ đặt khi muốn đổi |
| `NHAT_KY_HOI` + `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `1` + khoá Supabase | Muốn ghi câu hỏi đã lọc (không user_id/tên/ngày sinh) cho vòng tự cải thiện |
| `SENTRY_DSN` | Tuỳ chọn | Báo lỗi engine |

## D. Các việc còn lại — em làm gì, anh cần làm gì

- [x] ~~Gate 0 – 20–50 người thử~~ → anh chốt bỏ, mở công khai luôn. Thay bằng: sau 1–2 tuần có PostHog + GA4, gửi em
  ảnh/số funnel (vào trang → bắt đầu → xem xong → lưu hồ sơ) và góp ý để em đọc và đề xuất sửa.
- [x] **Phái tính tháng hạn Tử vi (lưu nguyệt):** đã làm 5 phái (`docs/LUU-NGUYET-TUVI.md`).
- [x] **Trang pháp lý + footer** (PL-1) · **giới hạn lượt AI** (RL-1) · **SEO kỹ thuật + bản .md cho bot AI** (SEO-D).

### D1. Chạy bộ 55 câu với AI thật — anh 3 phút, phần còn lại em làm
1. [ ] openrouter.ai → đăng nhập → **Credits** nạp 5 USD → **Keys** → Create key → chép.
2. [ ] GitHub → repo `hieubanthan` → **Settings → Secrets and variables → Actions → New repository secret**: tên
   `OPENROUTER_API_KEY`, giá trị là khoá.
3. [ ] Nhắn em "đã thêm khoá". **Em tự bấm chạy workflow llm-55** với 2 model, đọc báo cáo, sửa phần lỗi, rồi đề xuất
   bật AI cho mảng nào đạt ngưỡng. Khi đó anh chỉ cần thêm cùng khoá vào **Render → Environment** (`OPENROUTER_API_KEY`).

### D2. Hạ tầng — anh làm trên tài khoản của anh (em không có quyền vào Render/Sentry)
- [ ] **Báo sập + giữ engine không ngủ (miễn phí, 5 phút, làm trước):** uptimerobot.com → Add New Monitor → HTTP(s):
  1. `https://hieuban.com` — mỗi 5 phút;
  2. địa chỉ engine + `/health` (vd `https://hieubanthan-engine-sg.onrender.com/health`) — mỗi 5 phút.

  Gõ email anh vào mục Alert. Bonus: engine Render gói Free ngủ sau 15 phút không ai gọi — UptimeRobot gọi 5 phút/lần
  nên engine luôn thức, người vào đầu tiên không phải chờ 30–60 giây.
- [ ] **Render gói Starter Singapore (7 USD/tháng)** khi người dùng thật tăng (Free chỉ 512 MB RAM, dễ chậm khi
  nhiều người cùng xem lá số): Render → New → **Blueprint** → chọn repo (đọc sẵn `render.yaml`) → nhập
  `ENGINE_API_KEY` giống Vercel → Create. Xong đổi `ENGINE_URL` trên Vercel sang địa chỉ mới → Redeploy. Chi tiết:
  `docs/TRIEN-KHAI.md`.
- [ ] **Sentry (miễn phí, tuỳ chọn):** sentry.io → tạo 2 project (Next.js, FastAPI) → chép DSN → Vercel
  `NEXT_PUBLIC_SENTRY_DSN`, Render `SENTRY_DSN`. Code đã tắt gửi body/cookie/IP.
- [ ] ~~Sao lưu Supabase hằng tuần~~ → **chưa cần** vì chưa bật tài khoản (Supabase hiện chỉ giữ kho tri thức, có bản
  gốc trong git). Bật tài khoản thì lên Supabase Pro (có sao lưu tự động).

### D3. Việc cần người thật
- [ ] **Thử la bàn đo hướng nhà trên điện thoại thật** (trang Phong thuỷ → "Đo hướng nhà"): một iPhone + một Android,
  đứng ở cửa nhìn ra ngoài, so với app la bàn của máy hoặc la bàn thật; lệch ≤ 15° là đạt. Nhắn em: máy gì, lệch bao
  nhiêu độ. Lệch nhiều thì em chỉnh.
- [ ] **Duyệt nội dung nháp AI:** quẻ, sao, chân dung thần số, hợp đôi theo quan hệ. Cần người có nghề đọc dần;
  duyệt xong file nào thì đổi `trang_thai` sang `da_duyet` (hoặc nhắn em danh sách, em đổi).
- [ ] **Phong thuỷ xem qua ảnh nhà:** phần không cần ảnh đã xong (form Khảo sát nhà, schema, luật, công cụ chấm).
  Anh hỗ trợ giúp em 3 việc:
  1. Thu **50–100 bộ ảnh nhà thật**: mỗi nhà 5–15 ảnh (mặt tiền, cửa chính nhìn vào, phòng khách, bếp, phòng ngủ, WC,
     cầu thang). Mỗi bộ có **phiếu đồng ý** theo `docs/MAU-DONG-Y-ANH-NHA.md`. Ảnh để ở Google Drive riêng, không gửi
     qua chat công khai.
  2. Với mỗi nhà, ghi lại: **độ hướng nhà** (đo bằng mục "Đo hướng nhà" trên web), phòng nào ở phương nào, và đánh
     dấu 18 câu hỏi dấu hiệu, chính là các câu trong form Khảo sát nhà. Em chuyển thành nhãn JSON.
     Hướng dẫn: `engine/fixtures/phongthuy_anh/README.md`.
  3. Chọn model thị giác trên OpenRouter để em chạy thử PT-V2 (dùng chung khoá OpenRouter ở D1).
- [ ] **PT-V2 "Để máy đọc ảnh" (2026-10-23, anh đã duyệt gửi ảnh tới dịch vụ AI bên thứ ba):** Render → dịch vụ engine →
  Environment → thêm `DOC_ANH_MODEL` (tuỳ chọn, mặc định `google/gemini-2.5-flash`; đổi model thị giác khác trên
  OpenRouter thì ghi tên vào đây). `OPENROUTER_API_KEY` đã có — có khoá là có đọc ảnh; chưa đặt khoá thì web tự báo
  "chưa bật", người dùng tích tay. Ảnh chỉ đi qua lượt gọi khi người dùng tự tích đồng ý, không lưu ở đâu. Chính sách
  riêng tư đã thêm dòng "Ảnh nhà để máy đọc" (hiệu lực 23/10/2026) — nhờ luật sư rà cùng mục E.

Vẫn **chặn cho tới khi qua cổng đánh giá**: thanh toán (mua Sao), cộng đồng, marketplace, app di động.

## L. Lộ trình đến Gate 2 (lập 2026-10-09)

Gate theo `docs/THIET-KE-UI.md` §2 và §9 (giả định G1–G4), hạ tầng theo `docs/KIEN-TRUC-VAN-HANH.md` §4.
**Ngưỡng có dấu (đề xuất) là em đề xuất — anh chốt.** Đọc số khi đủ **≥ 300 người bắt đầu bài đọc**
(`reading_started`), ít hơn thì số dao động quá mạnh.

| Cổng | Câu hỏi | Đo bằng (PostHog) | Ngưỡng |
|---|---|---|---|
| **Gate 1** — bài đọc có giá trị | Người ta có đọc hết và thấy hữu ích? | `reading_completed / reading_started` (G1) · tỉ lệ "có giúp" trong `feedback_submitted` (G4) · `profile_created / reading_completed` | ≥ 50% đọc hết (đề xuất) · ≥ 60% "có giúp" (đề xuất) · ≥ 20% lưu hồ sơ (đề xuất) |
| **Gate 2** — tự lan truyền | Người đọc có mang người khác đến? | `share_created / reading_completed` (G2) · K = `referral_signup / share_created` (G3) | ≥ 8% chia sẻ · K > 0,15 |

Qua Gate 2 → mới mở **giai đoạn 2 hạ tầng + thu tiền** (Vercel Pro, Supabase Pro, cổng AI, thanh toán Sao).

**Đọc số ở đâu (2026-10-13):** `/quan-tri/tang-truong` → khung **Gate 1 · Gate 2** tự tính 5 tỉ lệ, so ngưỡng đề xuất,
báo "chưa đủ mẫu" khi < 300 người bắt đầu, và bảng **theo mảng** (Thần số, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Hợp
đôi, Hôm nay) để thấy mảng nào rơi nhiều nhất — anh không cần tự dựng funnel trong PostHog (chỉ cần làm Q8: khoá
PostHog cá nhân). Định nghĩa sự kiện đã sửa cho đúng nghĩa cổng: `reading_started` = kết quả của một mảng hiện ra
(trước đây gắn vào lúc lưu hồ sơ → tỉ lệ sai), `reading_completed` = cuộn tới cuối bài đọc VÀ đã ở lại ≥ 10 giây, mỗi phiên một lần mỗi mảng; "lưu hồ sơ" = chủ động lưu
vào tài khoản (chưa bật tài khoản thì bảng ghi "chờ số");
góp ý 1 chạm có ở MỌI mảng; `landing_viewed` ở mọi trang vào đầu tiên (không chỉ trang chủ); link chia sẻ "Hôm nay" mang
mã → bạn bè tạo hồ sơ được tính `referral_signup` (K). Bảng Gate chỉ tính sự kiện từ bản đo mới (`gate_v1`, từ 2026-10-13) — số cũ không trộn vào.

**Bước 1 — tuần này (anh):**
- [ ] Render: kiểm dịch vụ engine đang ở **Singapore + Starter** (mục D2); `/health` có `"khoa_engine": true` (mục 4b).
- [ ] UptimeRobot 2 monitor (mục D2) — 5 phút.
- [ ] Hộp thư `contact@hieuban.com` (mục E) — địa chỉ này đang in trên footer và trang pháp lý.
- [ ] Sitemap chuyển **Success** trong Search Console (mục H1).

**Bước 2 — tuần 1–2 (anh 3 phút + em làm):** chạy bộ 55 câu với AI thật (mục D1) → em sửa lỗi → bật
`OPENROUTER_API_KEY` trên Render cho mảng đạt ngưỡng. Hỏi đáp có AI là phần giữ chân chính sau bài đọc.

**Bước 3 — tuần 1–4 (lấy người đến, anh):** đăng bài/clip giới thiệu thần số (Facebook, TikTok, nhóm Zalo) dẫn về
trang chủ — mỗi tuần vài bài; Search Console + IndexNow lo phần tìm kiếm. Mục tiêu: đủ 300 `reading_started`.

**Bước 4 — khi đủ số (em):** anh gửi em ảnh funnel PostHog (Insights → Funnel: `landing_viewed` → `reading_started` →
`reading_completed` → `profile_created` → `share_created`) + số góp ý. Em đọc, chỉ ra bước rơi nhiều nhất, đề xuất sửa
UI/nội dung, làm PR; đo lại 1–2 tuần. Lặp tới khi qua Gate 1.

**Bước 5 — Gate 2:** đo chia sẻ + K-factor (link mời hợp đôi đã chạy, không cần tài khoản). Nếu dưới ngưỡng: em đề
xuất sửa thẻ chia sẻ / lời mời. Thưởng Sao khi mời bạn **cần bật tài khoản** (mục F) — chỉ bật khi anh muốn thử đòn bẩy này.

**Trước khi thu tiền (song song, anh + luật sư):** mục E — danh nghĩa vận hành, MST, thông báo Bộ Công Thương,
luật sư rà 3 trang pháp lý, hồ sơ chuyển dữ liệu ra nước ngoài. Thiếu phần này thì **không** bật bán Sao dù đã qua Gate 2.

## TV-V2. Nâng cấp Tử vi (2026-10-19)
- [ ] Sau khi PR TV-V2 merge + Render deploy engine: mở `/tu-vi`, thử 4 khối mới (Đường bay tứ hoá, 3 tháng tới, Định giờ sinh, Xem lá số 2 người — nay có điểm tham khảo hợp – khắc) với lá số của anh.
- [x] Quyết: lưu "Không biết giờ" vào tài khoản — **đã chốt: lưu** (migration 0015 nới `do_tin_gio` nhận `unknown`).
- [x] Quyết: định giờ hiện khoảng giờ theo **giờ đồng hồ** nơi sinh (kèm dòng "theo giờ lịch" khi lệch) — **đã chốt**; chế độ 12 canh: Tý = 00:00–00:59 ngày đã nhập, nhập 23:xx thì thêm ứng viên "Giờ Tý muộn" — **đã chốt**.
- [ ] Chạy migration `supabase/migrations/0015_do_tin_gio_unknown.sql` trên Supabase → SQL Editor (sau 0007). Kiểm bằng `supabase/kiem_thu/da_chay_chua.sql` (dòng 0015). Chưa chạy thì web vẫn lưu được, chỉ là "Không biết giờ" lưu như chưa có giờ.

## LG-ĐS. Luận giải Tử vi đời sống + tầng HỌC Tử vi (2026-10-21, `docs/LUAN-GIAI-DOI-SONG.md`)
- [ ] Supabase → Database → Extensions → bật **vector** (schema `extensions`), rồi chạy `supabase/migrations/0017_tuvi_hoc.sql` (sau 0015, 0016). Kiểm bằng `supabase/kiem_thu/da_chay_chua.sql`.
- [ ] Vercel (web): đã có `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*`, `SAO_KHOA_SECRET` (hoặc `LOI_MOI_SECRET`, ≥ 16 ký tự) — thiếu thì kiểm chứng / lưu bài / kho vectơ tự tắt, trang không lỗi. Tuỳ chọn `Y_DINH_NGUONG` (mặc định 0,82).
- [ ] Sau khi chạy 0017: `/quan-tri/hoc` → bấm **"Dựng kho vectơ"** một lần (làm lại khi kho câu hỏi đổi).
- [ ] Cập nhật Chính sách quyền riêng tư: bài luận lưu (12 tháng, chỉ khi bấm Lưu/bật Tự lưu), phiếu "Đúng với mình" (24 tháng, khoá ẩn danh), câu hỏi đã lọc lưu khi người dùng chọn chủ đề / xác nhận "đúng ý tôi hỏi".
- [ ] Deploy engine Render rồi mở `/tu-vi` → "Luận giải toàn bộ" với lá số của anh, đọc thử 12 chương.
- [ ] Quyết (khi rảnh): Mệnh vô chính diệu gặp Tuần/Triệt — Nam phái thường coi là tốt, hiện bài vẫn ghi "việc đến chậm". Giữ hay đổi?

## Phiên 2026-10-21 — Xem lá số 2 người, 3 tháng tới, Bát tự đời sống, thẻ chia sẻ QR, CTA cuối trang, Vận hạn
Việc kỹ thuật đã xong trên nhánh `claude/confident-heisenberg-08dtom` (chi tiết: các dòng HN-2N, NHIP-2, BT-ĐS, TCS-1,
CTA-1, VH-1 trong CLAUDE.md). Việc của anh:
- [ ] Sau khi merge + Render deploy engine (ENGINE_VERSION 0.1.5): mở `/tu-vi` và `/bat-tu` với lá số của anh — đọc
  "Xem lá số 2 người" (điểm tham khảo), "3 tháng tới", luận giải toàn bộ (chương mới "Vận hạn & điều nên tránh"),
  khối "Điều ngày sinh còn kể về bạn" cuối trang; thử tạo thẻ "5 mảnh ghép làm nên tôi" + trò đoán số trên điện thoại.
- [ ] Quyết: thêm loại kiểm chứng `hai_nguoi` (migration nhỏ sau 0017) để bật nút "Đúng với mình" cho phần 2 người.
- [x] Quyết: Tử vi "3 tháng tới" — Kỵ tháng rơi THẲNG vào Mệnh / Tài Bạch / Quan Lộc → **có gắn "Cần thận trọng"**
  (anh chốt 2026-10-22, đã làm: luật `ky_nhap_cung_chinh`).
- [ ] Quyết 4 ý tưởng nạp Sao cần migration (`docs/MUC-TIEU-TANG-TRUONG.md`): tặng bạn một chương đã mở · thưởng Sao
  chuỗi ngày ghé · thưởng mời gắn lần nạp đầu · gói Sao theo dịp.
- [x] Quyết (khi rảnh): Bát tự — "cách nào đúng với mình" → đã làm theo đề xuất của em (2026-10-22): khối "Cách nào đúng
  với bạn?" trên `/bat-tu` hỏi lại những năm đã qua mà hai cách đọc khác nhau (`docs/LUAN-GIAI-DOI-SONG.md` mục 9).
- [ ] **Tìm người rành Tử Bình duyệt bảng hỷ/kỵ theo cách cục** — phiếu duyệt + phân tích tác động sẵn ở
  `docs/DUYET-HY-KY-BAT-TU.md` (mục 3 có 3 nghi vấn ưu tiên: Chính Quan, Tài cách thân nhược, Thực Thần thân nhược).
  Ước 1–2 giờ đọc + điền cột "Ý kiến chuyên gia". Gửi lại cho em để áp bằng PR (có đo trước/sau).
- [x] Đại vận "đang đi" tính theo ngày khởi vận (anh giao 2026-10-22, đã sửa).
- [ ] Nhờ luật sư rà thêm: điểm "Xem lá số 2 người" ghi rõ là tham khảo; chương Vận hạn dùng "Nên tránh / Nên làm",
  không doạ, không vật phẩm.

## PT-KD-ĐS. Nâng cấp Phong thuỷ + Kinh Dịch (2026-10-21, `docs/NANG-CAP-PHONG-THUY-KINH-DICH.md`)

- [ ] **Đọc mục 3 (đề xuất kiến trúc) và duyệt từng ý**: khuôn bài đọc chung mọi mảng · "hồ sơ nhà" lưu trên máy · chip ý định dùng
  chung · nhắc ứng kỳ opt-in · tín hiệu ngầm thay bình chọn. Em chưa làm mục nào trong 5 mục này.
- [ ] **Bảng lưu nguyệt trong tài liệu Drive lệch quy tắc chuẩn** (2024 Thìn ghi tháng Dần nhập trung 8; sách Thẩm thị: 5). Em dùng quy
  tắc chuẩn; nếu anh có nguồn khác cho bảng đó, báo em để thêm công tắc phái.
- [ ] Sau khi merge: mở `/kinh-dich` hỏi "Tôi nên mua hay bán căn nhà này?" → phải thấy câu hỏi lại trước khi gieo; mở `/phong-thuy` →
  khối "Nhà của bạn" dưới phần Đo hướng.

## KC. Hồ sơ nhà · nhắc việc · CTA (2026-10-21, đợt 2 của PT-KD-ĐS)

- [ ] **Chạy migration 0018** `supabase/migrations/0018_ho_so_nha_nhac_viec.sql` (rollback `.down.sql`): bảng `ho_so_nha` (lưu nhà
  vào tài khoản) + `nhac_viec` (mốc nhắc trong tài khoản). Chưa chạy thì hai nút "Lưu nhà vào tài khoản" / "cả trên tài khoản" báo
  "máy chủ chưa bật" — mọi thứ khác vẫn chạy trên máy người dùng.
- [x] **Web Push**: anh duyệt GĐ1 (2026-10-21) — em đã làm (PR #112), việc của anh ở mục **WP** cuối file.
- [ ] **Bật thu Sao theo mảng**: đọc `docs/Y-TUONG-VIRAL-VA-NAP-SAO.md` mục C.1 — hiện công tắc `luan_giai.thu_sao` là chung; anh
  chốt có tách theo mảng (Bản đồ con số + Tử vi trước) không, em làm công tắc ở /quan-tri/cai-dat.
- [ ] Sau khi merge: mở `/hom-nay` sau khi đã đo hướng nhà ở `/phong-thuy` → thấy thẻ "Tháng này nhà bạn"; cuối mỗi bài đọc có khối
  gợi mở + luận giải + rủ bạn + ủng hộ.

## WP. Nhắc việc qua thông báo điện thoại — Web Push GĐ1 (2026-10-21, `docs/NHAC-VIEC-VA-WEB-PUSH.md` mục 2b)

- [x] **WP1. Chạy migration** trên Supabase → SQL Editor, theo thứ tự: `0018_ho_so_nha_nhac_viec.sql` (nếu chưa) rồi
  `0019_push_dang_ky.sql`. Kiểm bằng `supabase/kiem_thu/da_chay_chua.sql` (dòng 0018, 0019 = true). Rollback: `.down.sql` cùng tên.
- [x] **WP2. Tạo khoá VAPID (một lần)**: máy có Node → trong thư mục `web` chạy `node scripts/tao-khoa-vapid.mjs` → in ra 3 dòng
  `VAPID_PUBLIC_KEY=…`, `VAPID_PRIVATE_KEY=…`, `VAPID_SUBJECT=mailto:contact@hieuban.com`. **Không dán khoá vào chat/git.**
  (Không có Node: nhờ em chạy rồi anh tự đổi lại sau cũng được, nhưng tốt nhất anh tự chạy để khoá riêng chỉ anh có.)
- [x] **WP3. Đặt env trên Vercel** (project web → Settings → Environment Variables → Production + Preview): 3 biến trên. Kiểm
  `CRON_SECRET` đã có (≥ 16 ký tự, cùng biến cron dọn dữ liệu) và `SUPABASE_SERVICE_ROLE_KEY`. → **Redeploy**. Đổi khoá VAPID về
  sau = mọi thiết bị đã bật phải bật lại.
- [ ] **WP4. Thử trên Android/máy tính**: đăng nhập → `/kinh-dich` gieo một quẻ → ở "Mốc đáng để ý" bấm **Nhắc tôi hôm đó** →
  `/hom-nay` (hoặc `/tai-khoan`) bấm **Bật nhắc trên điện thoại** → cho phép. Muốn thấy thông báo ngay không chờ 8h sáng: tạo một
  mốc đúng ngày hôm nay rồi Vercel → project web → Settings → Cron Jobs → `/api/cron/hang-ngay` → **Run** (cron ngày đã gộp gửi nhắc + dọn dữ liệu vì
  Hobby chỉ cho 2 cron). Kết quả trả về dạng `{"nhac":{"nguoi":1,"ok":1,…},"don":{…}}`; mỗi người chỉ 1 thông báo/ngày nên chạy lại sẽ ra `nguoi: 0`.
- [ ] **WP5. Thử trên iPhone** (iOS 16.4+): Safari mở hieuban.com → Chia sẻ → **Thêm vào màn hình chính** → mở từ biểu tượng →
  đăng nhập → Hôm nay → Bật nhắc. (Safari thường không có nút — đúng như thiết kế, trang sẽ hiện hướng dẫn 2 bước.)
- [ ] **WP6. Luật sư rà** dòng mới trong Chính sách quyền riêng tư (mục dữ liệu + bên xử lý: dịch vụ thông báo của trình duyệt),
  ngày hiệu lực đã đổi 21/10/2026. Nếu anh đã sửa trang này trong CMS thì thêm hai dòng đó ở CMS (CMS thắng code).

## PT-81 · HỌC-ĐS · kiến trúc Drive (2026-10-22)
- [x] **Quyết bảng Q1–Q8** — anh chốt làm Q1 → Q7, không Q8 (đã làm xong cùng ngày, mục Q1–Q7 bên dưới).
- [ ] Đọc lướt `docs/VONG-TU-CAI-THIEN.md` mục 3 (ranh giới máy / người) — nếu anh muốn máy được làm thêm điều gì (vd tự đổi
  phái đọc mặc định theo tín hiệu ngầm), báo em để ghi thành quyết định.
- [ ] Sau deploy: mở `/phong-thuy` → "Nhà của bạn" nhập hướng 180, năm 2008 → chương 2 có đoạn "Hướng tinh … tiền bạc" và
  "năm nên chủ động hơn"; dưới mỗi hộp có nút "Đúng với mình / Chưa đúng" (Phong thuỷ, Kinh Dịch nay cũng có). Số "x%" chỉ
  hiện khi migration 0017 đã chạy và mã đủ 30 phiếu.
## Q1–Q7 · đồ thị theo ý định · lưu ý lửa điện (2026-10-22, `docs/DANH-GIA-KIEN-TRUC-PHONG-THUY-DRIVE.md` mục 6)
- [ ] **Chạy migration `0022_kiem_chung_sau_de_xuat_luat.sql`** (sau 0017 và 0021; rollback `.down.sql`). Kiểm bằng
  `supabase/kiem_thu/da_chay_chua.sql` (dòng 0022 = true). Chưa chạy: Hôm nay vẫn hỏi lại sau 30 ngày, phiếu chỉ lên PostHog;
  `/quan-tri/hoc` khối "Đề xuất luật" báo chưa đọc được.
- [ ] **Deploy engine Render trước web** (route mới `/v1/phongthuy/huong-ban-do`, `/v1/phongthuy/do-thi/{ý định}`, BoCuc 0.2 `mat_bang`,
  `goc_nhin`, `y_dinh` — web gửi trường mới, engine cũ sẽ 422).
- [ ] **Thử sau deploy**: `/phong-thuy` → Khảo sát nhà: chọn "Căn hộ chung cư", tích "Vẽ mặt bằng", tô ô, đặt Cửa hàng 1 / WC giữa /
  Ban công hàng cuối → kết quả báo "Nhà vệ sinh ở vùng giữa nhà", "Cửa chính nhìn thẳng ra ban công", nhãn **Xử lý trước**, việc
  0 đồng / ít tiền / sửa chữa, hai luật căn hộ. Nhà của bạn: chọn một điều băn khoăn → mục "Theo điều bạn đang băn khoăn"; chương
  Việc nên làm có nút "xếp theo chi phí". Đo hướng: "Lấy hướng từ bản đồ" dán hai toạ độ.
- [ ] **Thử phiếu sau 30 ngày**: bấm "Đúng với mình" ở một hộp Nên để ý; muốn thử ngay thì trong DevTools sửa `ngay` của
  `localStorage["hbt.kc_sau.v1"]` lùi 35 ngày rồi mở `/hom-nay` → hộp "35 ngày trước bạn thấy đúng điều này".
- [ ] **Đọc 7 luật thực hành** ở `engine/app/kb/data/phongthuy_kb.json` → `quy_tac_thuc_hanh` (nháp AI viết lại từ Drive) và
  20 câu "giải thích theo đời sống" (`bo_tri[*].giai_thich_hien_dai`) — sai chỗ nào sửa ở Kho tri thức.
- [ ] Ý tưởng mới em ghi ở `docs/DANH-GIA-KIEN-TRUC-PHONG-THUY-DRIVE.md` mục 7 — anh tích cái nào em làm cái đó.

## WP-GĐ2. Sáng nay của bạn · mốc lịch · hỏi lại hôm qua · mời cài app (2026-10-22)

- [x] **WP7. Chạy migration `0020_push_tuy_chon.sql`** (sau 0018, 0019; rollback `.down.sql`). Kiểm bằng `supabase/kiem_thu/da_chay_chua.sql`
  (dòng 0020 = true). Chưa chạy thì nhắc mốc tự đánh dấu vẫn gửi, chỉ phần tuỳ chọn (sáng nay, mốc lịch) ẩn đi.
- [x] **WP8. Deploy engine Render** (route mới `/v1/push/sang-nay`) **trước** khi merge web — web gọi engine trong cron sáng.
- [ ] **WP9. Thử**: điện thoại Android đã bật nhắc → Tài khoản → tích "Sáng nay của bạn" (cần đã lưu hồ sơ vào tài khoản) →
  Vercel → Cron Jobs → `/api/cron/hang-ngay` → Run → nhận một thông báo "Sáng nay của bạn · Ngày cá nhân N". Hôm trước chọn một
  ý định ở "Hôm nay bạn định làm gì?" thì thông báo có thêm hai nút "Đúng với mình / Chưa đúng".
- [ ] **WP10. Thử cài app**: Chrome Android/máy tính mở `/hom-nay` hai ngày khác nhau → thấy thẻ "Mở Hiểu Bản Thân nhanh hơn mỗi
  sáng" → Cài. iPhone: thẻ hướng dẫn 2 bước. Sau 1–2 tuần xem `/quan-tri/tang-truong` (PostHog `pwa_*`, `landing_viewed.app`).
- [ ] **WP11. Luật sư rà** dòng "Mốc nhắc, thiết bị và tuỳ chọn nhận thông báo" + dòng Tiện ích trong Chính sách quyền riêng tư
  (hiệu lực 22/10/2026). Nếu đã sửa trang này trong CMS thì thêm ở CMS (CMS thắng code).
- [ ] **WP12. Quyết Vercel Pro** trước khi bật thu Sao / muốn chọn giờ nhận thông báo (Hobby: 2 cron, cấm thương mại).

