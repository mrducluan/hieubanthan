# Việc của chủ dự án — danh sách nhắc

> Các việc dưới đây cần quyền tài khoản (Vercel, Render, Supabase, GoDaddy, Google…) nên em không tự làm được.
> **Mỗi phiên làm việc mới, Claude đọc file này và nhắc anh những mục chưa đánh dấu `[x]`.**
> Làm xong mục nào, anh đánh `[x]` (hoặc nhắn em đánh hộ).
> Cập nhật lần cuối: 2026-10-12.

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
4d. [ ] **NotFair blog (/blog):** Vercel → Settings → Environment Variables → thêm `NOTFAIR_SEO_API_KEY` = khoá `nfbl_…`
   (Production + Preview, **không** thêm tiền tố `NEXT_PUBLIC_`) → Redeploy. Rồi mở `https://hieuban.com/blog` và một bài
   `/blog/{slug}`: thấy ảnh bìa, mục lục bấm được, bảng cuộn ngang trên điện thoại. Chưa đặt khoá thì /blog chỉ hiện "Chưa có bài viết".
   Khoá đã lộ trong khung chat → nên tạo khoá mới trong NotFair (Integrations → Next.js) rồi dùng khoá mới.
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
- [ ] **Q8. Phễu PostHog trong `/quan-tri/tang-truong`** (tuỳ chọn): PostHog → avatar → **Personal API keys → Create**
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
- [ ] CMS10. (2026-10-12) Sau khi PR "Giao diện website" merge + CMS Vercel redeploy (tự chạy migration): vào CMS → nhóm
  **Giao diện website** → *Điều hướng chân trang* (4 cột chân trang, mỗi link chọn Trang / Bài viết / Chuyên mục) và
  *Trang chủ & banner* (dải thông báo đầu trang, banner trang chủ, khối Bài viết mới + ghim bài, Bài viết liên quan).
  Bấm Lưu → hieuban.com đổi sau vài giây. Dải thông báo **không còn** ở /quan-tri/cai-dat (nếu anh từng đặt chữ ở đó thì đặt lại bên CMS; dòng cũ trong Supabase sẽ được xoá ở migration kế tiếp) (phân vai: `docs/KIEN-TRUC-CMS.md` mục 0).
- [ ] SAO2. (2026-10-12) Cơ chế miễn phí ↔ Sao đã có code, **mặc định tắt**. Để bật (sau khi bật tài khoản mục F):
  1) Supabase SQL Editor chạy `supabase/migrations/0013_sao_2.sql` (sau 0012).
  2) Vercel web: `SUPABASE_SERVICE_ROLE_KEY` (đã cần cho payOS) + `SAO_KHOA_SECRET` (chuỗi ngẫu nhiên ≥ 32 ký tự,
     không dán vào chat) → Redeploy.
  3) /quan-tri/cai-dat → nhóm "Luận giải toàn bộ" bật thu Sao; nhóm "Hỏi đáp" bật giới hạn khi chi phí AI tăng.
  4) Xem tiền + người nạp ở /quan-tri/doanh-thu. Quy tắc + lộ trình: `docs/KE-HOACH-MIEN-PHI-VA-SAO.md`.
- [ ] CMS11. (2026-10-12, CMS-2) Vercel project **cms** thêm `ENGINE_URL` + `ENGINE_API_KEY` (giống bên web) → Redeploy →
  khung **Trợ lý AI soạn nháp** ở cột phải trang viết bài chạy được (cần `OPENROUTER_API_KEY` trên Render).
- [ ] CMS12. (2026-10-12, CMS-2) Bật **xác thực 2 bước** cho chính anh: đăng xuất CMS → mở
  `https://cms.hieuban.com/admin/xac-thuc-2-buoc` sau khi đăng nhập → "Bật xác thực 2 bước" → thêm khoá vào Google
  Authenticator → nhập mã. Xong rồi mới đặt env `CMS_BAT_BUOC_MFA=1` ở Vercel cms → Redeploy (bắt buộc với Quản
  trị/Chủ biên). Mất điện thoại: một Quản trị khác đặt lại, hoặc em xoá cột MFA của tài khoản anh bằng SQL.
- [ ] CMS13. (2026-10-12, CMS-3/4) Sau khi PR merge + CMS redeploy: thử tạo **Trang đích** (Giao diện website → Trang đích)
  cho một chiến dịch (vd "Mời bạn tháng 11") → xuất bản → xem ở `hieuban.com/su-kien/{slug}`. Khi viết bài, mở khung
  **Gợi ý liên kết nội bộ** ở cột phải để chèn 2–5 link tới trang kiến thức/bài liên quan (tốt cho SEO).
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

