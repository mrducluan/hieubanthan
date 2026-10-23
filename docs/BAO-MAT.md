# Rà soát bảo mật — SEC-2 (2026-10-23) + SEC-1 (2026-10-08)

## SEC-2 (2026-10-23)

Đầu vào: hai tài liệu Drive của chủ dự án ("audit security… CISO" và "kiến trúc Vercel + Render + Supabase + PostHog").
Đó là danh sách kiểm **chung** cho bộ công nghệ này — em đối chiếu từng mục với mã thật (bảng cuối mục), rồi rà thêm
toàn bộ phần mới từ sau SEC-1: migration 0010–0022, ~120 route API web, engine (routers mới, đọc ảnh, LLM), CMS Payload,
GitHub Actions, thư viện (`npm audit`, `pip-audit`). Cách làm: đọc mã + chạy thử (migration trên Postgres thật 3 vòng
lên / xuống / lên lại; test engine; build web).

### Đã sửa trong PR SEC-2

| # | Mức | Lỗ hổng | Sửa |
|---|---|---|---|
| 1 | **Nghiêm trọng** | **Next.js 16.3.8 (web + CMS)** dính 2 lỗi chạy mã từ xa không cần đăng nhập đã công bố (GHSA-2464-fhr4-w9xw Image Optimizer + SVG; GHSA-673q-mjm6-r5xr `use cache`) + DoS Server Actions. DOMPurify 3.4.16 (PostHog, CMS) có lỗi vượt lọc; sanitize-html 2.18.0 đệ quy vô hạn. | **Next 16.4.2** (bản vá cùng dòng 16, Payload 3.90.2 hỗ trợ `>=16.3.3 <17`), DOMPurify 3.4.17, sanitize-html 2.18.1. `npm audit` web: 0 lỗi; CMS: hết critical (còn lỗi DoS của công cụ build — braces/sass/drizzle-kit, không chạy lúc phục vụ, chưa có bản vá). |
| 2 | **Cao** | **Bảy bảng KB thần số đời đầu (0001, 0002) KHÔNG bật RLS** — SEC-1 bỏ sót. Supabase mặc định cho `anon` mọi quyền → ai có khoá anon công khai xoá / sửa được nghĩa số qua REST. | Migration **0023**: bật RLS, chỉ cho đọc (engine vẫn đọc bằng khoá anon), thu quyền ghi. Kiểm: `supabase/kiem_thu/thu_sec2_0023.sql`. |
| 3 | **Cao** | **CMS: vượt xác thực 2 bước bằng khoá API.** Mọi yêu cầu bằng khoá API đều được miễn MFA; phiên mới chỉ có mật khẩu vẫn tự sửa được tài khoản mình → kẻ trộm mật khẩu Quản trị bật khoá API cho chính tài khoản đó rồi có đủ quyền Quản trị mà không cần mã 2 bước (cũng đổi được mật khẩu / email để khoá chủ thật ra ngoài). | Chỉ **Máy đọc** được miễn MFA khi dùng khoá API; tự sửa tài khoản cần vai trò có hiệu lực (đã qua MFA); bật / đổi khoá API chỉ Quản trị; khoá API không trả ra cho ai ngoài Quản trị. |
| 4 | Cao | **Engine thiếu `ENGINE_API_KEY` thì mở cho cả internet** (middleware bỏ qua kiểm khoá) mà vẫn khởi động bình thường — tạo lại dịch vụ / đổi vùng / xoá nhầm biến là lộ mọi route, kể cả soạn nháp AI (proxy OpenRouter miễn phí). | Trên Render thiếu khoá → **không khởi động** (deploy báo hỏng, bản cũ vẫn chạy). `/docs`, `/openapi.json` tắt cả khi có khoá ở host khác Render. |
| 5 | Trung bình | **Sentry gửi biến cục bộ** kèm stack trace (mặc định sentry-sdk 2.x) → tên, ngày giờ sinh, câu hỏi rời máy chủ, trái cam kết NĐ 13. | `include_local_variables=False` + `before_send` xoá `vars` từng khung. |
| 6 | Trung bình | **Mở chuyển hướng sau đăng nhập OTP**: `?tiep=/%09/evil.com` qua được kiểm tra (trình duyệt bỏ tab → `//evil.com`). | Cấm khoảng trắng / ký tự điều khiển / `\` trong đích (`DangNhap.tsx`, `KetQua.tsx`). |
| 7 | Trung bình | 10 route web (lá số Tử vi, định giờ 12 lá, phi hoá, lưu nguyệt, vận hạn, nhịp, hợp tham, tạo thẻ, lời mời) gọi engine **không mang IP người gọi** → lách hạn mức 120 yêu cầu/phút; mỗi lá chạy Node → spam làm nghẽn engine. | Thêm `dauNguoiGoi(req)`. |
| 8 | Thấp | Engine không giới hạn kích thước thân yêu cầu (uvicorn đọc hết trước khi pydantic kiểm). | 413 khi > 2 MB (đọc ảnh nhà 6 MB, kiểm định quản trị 9 MB). |
| 9 | Thấp | Lời lỗi lộ nội bộ: `/v1/kb/status` trả URL + mã dự án Supabase; lỗi LLM mang địa chỉ nhà cung cấp AI + tên mô hình (trái BM-1); `/api/chia-se/ngay` trả `e.message`; `/api/tuvi/{la-so,chart}` trả tên trường schema. | Bỏ URL / tên mô hình; chi tiết chỉ gửi Sentry; câu chung cho người dùng. |
| 10 | Thấp | **Mã thẻ chia sẻ / lời mời (mang tên hiển thị) lọt vào URL gửi PostHog** (`$current_url`) — trái quy tắc "đo lường chỉ mang mã". | `before_send` thay mã bằng `:ma` (`lamSachUrl`, test `e2e/bao-mat-sec2.spec.ts`). GA4 xem mục "Còn mở". |
| 11 | Thấp | `dang_ky_push()`: biết endpoint của người khác là chiếm được đăng ký (người kia mất nhắc). `don_nhac_viec()` gọi được bằng anon. TRUNCATE còn cấp cho anon/authenticated. `ky_uc_nguoi_dung.ghi_chu` nhận chữ tự do (quy tắc (b) chỉ cho mã). | Migration 0023. |
| 12 | Thấp | CMS: cộng tác viên đặt được canonical / noindex / llms / ngày đăng **lúc tạo bài** (chỉ chặn lúc sửa); phiên chưa qua MFA / khoá Máy đọc chạy được hàng việc; nhập ảnh NotFair đi theo chuyển hướng ra ngoài danh sách miền (SSRF) và đọc hết thân trước khi kiểm cỡ. | Quyền trường `create`; hàng việc chỉ Chủ biên hoặc cron; tự đi chuyển hướng + kiểm miền từng bước + chặn `content-length` lớn. |
| 13 | Thấp | CI: `so-ngay-quan-tri.yml` chèn `${{ github.head_ref }}` thẳng vào lệnh shell (tên nhánh có thể chứa `$(...)`) và để token ghi trong `.git/config` khi chạy `pip install`; `e2e.yml`, `indexnow.yml` không khai `permissions`. Chưa có Dependabot. | Biến môi trường + `persist-credentials: false`; `contents: read`; thêm `.github/dependabot.yml` (npm web/cms/ziwei, pip, actions — chỉ đề xuất PR). |

### Đã kiểm, không có vấn đề (SEC-2)

- **Không có bí mật trong git** (cây + lịch sử có trong bản clone; bản clone nông — nên quét lại bằng gitleaks trên bản đầy đủ).
  `NEXT_PUBLIC_*` chỉ có URL + khoá anon Supabase, PostHog, Sentry DSN, GA/GTM. Khoá service role chỉ ở mã máy chủ.
- **Supabase 0003–0022**: mọi bảng bật RLS, chính sách chủ sở hữu có `WITH CHECK`; mọi hàm `SECURITY DEFINER` có
  `search_path = ''` và revoke khỏi `public/anon/authenticated` (trừ `don_nhac_viec`, đã sửa). Không có view (view bỏ qua RLS).
  Vai trò quản trị: không tự cấp được; `aal2` đọc từ JWT ký. Sao: `dung_sao`, `nap_sao_tu_cong`, `hoan_don_nap`, thưởng —
  khoá dòng / khoá tư vấn, khoá giao dịch duy nhất, số tiền lấy từ `goi_sao` ở máy chủ. Endpoint push chỉ 4 máy chủ push (không SSRF).
- **Web**: mọi `/api/quan-tri/*` qua cổng đăng nhập → vai trò → MFA; payOS so chữ ký hằng thời gian; cron + webhook CMS
  từ chối khi thiếu bí mật; mã thẻ HMAC theo miền, có hạn, production thiếu `LOI_MOI_SECRET` thì báo lỗi; CSP nonce
  `strict-dynamic`, HSTS, nosniff, frame-ancestors; HTML từ CMS / NotFair qua `sanitize-html` danh sách trắng; PostHog tắt
  autocapture + ghi phiên, che toàn bộ chữ.
- **Engine**: không `eval/exec/pickle/yaml.load/shell=True`; iztro chạy danh sách tham số + stdin + hết giờ 20 s; không
  dựng đường dẫn tệp từ đầu vào (slug chỉ so với danh sách); không CORS (đúng — chỉ máy chủ web gọi); pydantic
  `extra="forbid"` + giới hạn độ dài; ảnh nhà không ghi đĩa / không log.
- **CMS**: TOTP AES-256-GCM IV ngẫu nhiên, so hằng thời gian, chống dùng lại mã, khoá 15 phút sau 5 lần sai; ảnh chỉ
  jpeg/png/webp/avif (không SVG) ≤ 5 MB; GraphQL tắt; webhook so hằng thời gian; tarball NotFair khớp hash trong lockfile.
- **Workflow**: không `pull_request_target`; bí mật duy nhất (`OPENROUTER_API_KEY`) chỉ ở job bấm tay.

### Đối chiếu hai tài liệu Drive

| Đề xuất trong tài liệu | Thực tế hệ thống | Kết luận |
|---|---|---|
| Bật RLS 100% bảng public | 0003–0022 đủ; **7 bảng 0001/0002 thiếu** | **Đã sửa (0023)** |
| Hàm RPC `SECURITY DEFINER` phải khoá `search_path`, kiểm quyền | Đúng ở mọi hàm; 1 hàm quên revoke anon | **Đã sửa (0023)** |
| Không để service role ở frontend / `NEXT_PUBLIC_` | Đúng | Giữ |
| Tắt `/docs`, `/openapi.json` FastAPI | Đã tắt từ SEC-1 | Siết thêm (tắt cả khi có khoá) |
| Path traversal khi đọc `.json` | Engine không mở tệp theo đầu vào | Không có lỗi |
| `pickle` / `eval` / RCE qua JSON | Không dùng | Không có lỗi |
| Pydantic `extra="forbid"`, giới hạn payload | Có `forbid`; thiếu trần kích thước thân | **Đã thêm 413** |
| BOLA: engine tin `user_id` từ frontend → phải xác minh JWT Supabase ở Render | **Không áp dụng**: engine KHÔNG nhận / lưu user_id, không chạm DB (CLAUDE.md). Dữ liệu theo người nằm ở Supabase dưới RLS; web máy chủ gọi engine bằng khoá dịch vụ. | Không cần JWT ở engine; đã sửa lỗ "thiếu khoá thì mở" (mục 4) |
| CORS chỉ hieuban.com, không `*` | Engine không bật CORS (trình duyệt không gọi được) | Đúng |
| Prompt injection | Câu hỏi đi vào LLM nhưng đầu ra kiểm số + cụm cấm, sai → rơi về template; ảnh nhà chỉ nhận mã trong danh sách | Còn mở mục nhỏ (lọc link trong đầu ra) |
| Token trong localStorage → dùng `@supabase/ssr` cookie | Đã dùng `@supabase/ssr`; CSP nonce chặn script lạ | Đúng |
| CSP, HSTS, X-Frame-Options | Có đủ (CSP-2) | Đúng |
| PostHog Session Replay che PII | Ghi phiên **tắt hẳn**, che toàn bộ chữ | Đúng; **đã sửa** mã thẻ trong URL |
| Cloudflare WAF + rate limit + Authenticated Origin Pulls | Vercel có lớp chống DDoS sẵn; engine có khoá dịch vụ + hạn mức theo người gọi; hạn mức AI riêng (RL-1) | **Chưa cần** ở GĐ1 — xem "Còn mở" (bật Vercel Firewall / giới hạn chi tiêu trước) |
| Dependabot | Chưa có | **Đã thêm** |
| Gom vùng Singapore | Đã chốt 2026-09-30 (Render SG, Vercel `sin1`, Supabase SG) | Chủ dự án kiểm lại mục D2 VIEC-CUA-ANH |
| orjson, nạp JSON một lần lúc khởi động, asyncpg qua pooler | KB đã nạp một lần (cache); engine không nối DB | Không cần |
| Chuyển KB `.json` vào Postgres JSONB / pgvector | Trái quyết định "git là nguồn gốc KB" | **Không làm** |
| PostHog reverse proxy `/ingest` (né trình chặn quảng cáo) | Chưa có | Tuỳ chọn — phải sửa CSP `connect-src` + chính sách riêng tư; không phải lỗi bảo mật |
| Chuyển về VPS + Coolify | Hoá đơn hiện < 50 USD/tháng, tác vụ < 1 s | **Chưa cần** (đúng ngưỡng tài liệu tự nêu) |

### SEC-2 đợt 2 (2026-10-23, cùng ngày) — đã làm các mục "còn mở"

| # | Mục | Đã làm |
|---|---|---|
| 1 | **Bật 2 bước CMS báo "chưa có quyền"** (chủ dự án gặp): màn 2 bước chỉ mở khi đã bắt buộc (`CMS_BAT_BUOC_MFA=1`) mà hướng dẫn lại bảo tự bật trước → vòng lặp. | Ai có vai trò biên tập đều tự bật được; bảng điều khiển có dòng nhắc "Bật ngay"; hiện **mã QR** (bộ QR tự viết của web, không thêm thư viện; đã giải mã thử đúng khoá). e2e "SEC-2 tự bật 2 bước". |
| 2 | Link xem trước CMS mở nháp cả site, không hết hạn. | Ký kèm hạn 1 giờ (`het`); bật thêm cookie **phạm vi** HttpOnly ký HMAC — chỉ đúng bài / trang được ký mới đọc nháp; thẻ trỏ trang khác luôn bản đã xuất bản. e2e: link hết hạn → 401; link bài A không lộ nháp bài B. |
| 3 | Trả lời có phí bấm song song. | Trừ Sao **trước** khi gọi engine, engine lỗi thì hoàn (`hoan_sao_hoi`, migration 0024, chỉ service role, đúng dòng vừa trừ ≤ 15 phút, một lần). |
| 4 | TOTP CMS: đếm sai không nguyên tử; cookie không gắn phiên; `%` hỏng làm 500; khoá suy từ `PAYLOAD_SECRET` rỗng. | Giữ chỗ lượt thử bằng một câu SQL nguyên tử trước khi kiểm mã (12 yêu cầu song song → ≤ 5 lượt, còn lại 429; e2e); ghi bước dùng mã cũng nguyên tử (chống dùng lại); cookie `cms-mfa` ký kèm `sid` phiên Payload; `docCookie` bắt lỗi; thiếu `PAYLOAD_SECRET` → báo lỗi thay vì dùng chuỗi rỗng. |
| 5 | AI quản trị chỉ dựa khoá chung. | Khoá thứ hai `ENGINE_QUAN_TRI_KEY` (header `x-quan-tri-key`) — engine đòi khi env đặt; web + CMS gửi kèm. |
| 6 | Engine treo khi ~40 lượt AI chờ cùng lúc. | Pool luồng 40 → 120 (`ENGINE_SO_LUONG`) qua lifespan; `/health` async. |
| 7 | FastAPI 0.115 / Starlette 0.46 (CVE). | **FastAPI 0.161 + Starlette ≥ 1.3.1** (đang 1.9), pytest 9; `pip-audit` sạch; 5.351 test engine xanh. |
| 8 | Bơm phiếu / ý định bằng nhiều IP. | Câu ý định tự bật cần **≥ 2 người đăng nhập** (trước 1) — migration 0024. Phiếu "x% thấy đúng" / tự hạ hộp: **giữ** (tài khoản chưa bật → chỉ tính phiếu đăng nhập sẽ tắt hẳn vòng học; ảnh hưởng chỉ là xếp hạng hộp, không sinh chữ). Xét lại khi bật tài khoản. |
| 9 | Ghi chú góp ý sống quá 12 tháng. | Mốc thời gian **từng ghi chú** (trigger) + dọn theo từng ghi chú (0024). |
| 10 | Prompt injection kiểu "viết tên miền / số điện thoại ra". | Đầu ra LLM (hỏi đáp + luận giải) mang link, tên miền (kể cả "chấm com"), Zalo/Telegram, @tài khoản, số điện thoại mà nguồn không có → loại, rơi về mẫu. |

Còn lại (thấp, chờ quyết): phiên chỉ có mật khẩu của tài khoản **chưa** bật 2 bước có thể bật trước chủ thật — cách
phòng: mọi Quản trị / Chủ biên tự bật ngay (VIEC-CUA-ANH 4l.4) trước khi đặt `CMS_BAT_BUOC_MFA=1`.

### Việc của anh (cấu hình — em không làm thay được)

Ghi ở `docs/VIEC-CUA-ANH.md` mục **4l**.

---

# Rà soát bảo mật SEC-1 (2026-10-08)

Phạm vi: web (Next.js 14 trên Vercel), engine (FastAPI trên Render), cơ sở dữ liệu Supabase (migration 0001–0009),
kho mã (bí mật, thư viện). Cách làm: đọc toàn bộ route API, lớp proxy, middleware, migration/RLS, `npm audit`.

## Đã sửa trong PR SEC-1

| # | Mức | Lỗ hổng | Sửa |
|---|---|---|---|
| 1 | Cao | **Gian lận Sao**: khoá giao dịch "Luận giải toàn bộ" là SHA-256 của dữ liệu công khai → người dùng tự tính được khoá, gọi thẳng RPC `dung_sao(1, khoá)` rồi lấy báo cáo 10 Sao chỉ với 1 Sao (khi bật thu Sao). | Khoá ký **HMAC bằng bí mật máy chủ** (`SAO_KHOA_SECRET`, mặc định dùng `LOI_MOI_SECRET`), có cả giá trong khoá; thiếu bí mật thì không thu. |
| 2 | Trung bình | **Chuyển hướng mở** sau đăng nhập: `/auth/callback?tiep=/\evil.com` → trình duyệt hiểu `//evil.com` → đưa người dùng sang trang lừa đảo. | Chỉ nhận đích **cùng origin**. |
| 3 | Trung bình | Engine **không giới hạn số yêu cầu** (chỉ giới hạn lượt AI) → một người spam lá số Tử vi (mỗi lá chạy Node) làm chậm/sập engine cho mọi người. | Hạn mức **120 yêu cầu/phút mỗi người gọi** (`ENGINE_LUOT_PHUT`), quá → 429 lời tiếng Việt. |
| 4 | Trung bình | Lỗi iztro trả `stderr` (đường dẫn máy chủ, dòng mã) thẳng ra người dùng. | Câu chung cho người dùng; chi tiết chỉ gửi Sentry. |
| 5 | Trung bình | Next.js 14.2.33 có nhiều lỗi đã công bố (DoS Server Components, cache poisoning…). | Lên **14.2.35** (bản vá cuối dòng 14, không đổi stack). |
| 6 | Thấp | So khoá engine bằng `!=` (lộ dần khoá qua thời gian phản hồi về lý thuyết). | `hmac.compare_digest`. |
| 7 | Thấp | `/docs`, `/openapi.json` của engine mở trên production → phô bản đồ endpoint. | Tắt khi chạy trên Render. |
| 8 | Thấp | Tên trong hỏi đáp thần số không giới hạn độ dài (gửi chuỗi vài MB). | Tối đa 80 ký tự (web + engine). |
| 9 | Thấp | Thiếu chống nhúng khung (clickjacking) dạng CSP, chưa có COOP. | CSP `frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'` + COOP. |
| 10 | Thấp | `.gitignore` chỉ chặn `.env*.local` → lỡ tạo `.env` là commit được mật khẩu. | Chặn `.env`, `.env.*` (trừ `.env.example`). |
| 11 | Lỗi | `/api/hop-doi/moi` đọc thân phản hồi lỗi hai lần (lời lỗi luôn chung chung). | Đọc một lần. |

## Đã kiểm, không có vấn đề

- **Không có bí mật trong git** (quét cả lịch sử: khoá OpenRouter, JWT Supabase, khoá AWS, khoá riêng).
- Mọi route API kiểm đầu vào bằng zod `.strict()` trước khi gọi engine; engine kiểm lần hai bằng pydantic.
- JSON-LD thoát `<` → không chèn được `</script>`. Không có `dangerouslySetInnerHTML` nào khác.
- Link mời / thẻ chia sẻ: HMAC-SHA256, so sánh hằng thời gian, có hạn 90 ngày, chỉ chứa tên hiển thị + con số.
- Supabase: bảng `ho_so`, sổ Sao có **RLS chủ sở hữu**; mọi hàm ghi là `SECURITY DEFINER` + `search_path=''` +
  `revoke` khỏi `anon`; xoá tài khoản xác minh token của chính người gọi.
- iztro chạy bằng `subprocess` danh sách tham số + stdin JSON (không qua shell) → không chèn lệnh được.
- PostHog: tắt autocapture, tắt ghi phiên, che toàn bộ chữ → ô ngày sinh không bao giờ bị gửi đi.
- GTM nạp mọi trang (chủ dự án chốt 2026-10-09) nhưng mang nonce CSP; CSP chỉ mở cho tên miền hệ Google (+ `CSP_THEM_MIEN` nếu đặt). Người dùng tắt đo lường được ở "Tuỳ chọn cookie".

## Còn mở — cần anh quyết hoặc làm

1. **Kiểm khoá engine trên production (1 phút, quan trọng nhất):** mở `https://hieubanthan-engine-sg.onrender.com/health`
   (hoặc địa chỉ engine anh đang dùng) sau khi PR này deploy → phải thấy `"khoa_engine": true`. Nếu `false`: ai biết
   địa chỉ engine cũng gọi thẳng được, vượt mọi giới hạn → vào Render → Environment → thêm `ENGINE_API_KEY` (cùng chuỗi
   với Vercel) → Save.
2. ~~**Nâng Next.js 15/16:**~~ → **ĐÃ LÀM (NX15):** Next 15.5.27 + React 19, `npm audit` hết lỗi của next. Ghi chú cũ: `npm audit` vẫn báo các lỗi chỉ vá ở 15+/16 (phần lớn thuộc tính năng dự án không dùng:
   Image Optimizer remotePatterns, Server Actions, i18n Pages Router, chạy trên Windows; Vercel còn chặn bớt ở hạ tầng).
   Đổi bản lớn = đổi stack trong CLAUDE.md → cần anh duyệt; em đề xuất làm thành một việc riêng có kiểm thử đầy đủ.
3. **Nhật ký hỏi đáp (khi bật `NHAT_KY_HOI=1`):** bảng 0004/0005 cho `anon` INSERT — khoá anon là công khai (nằm trong
   web khi bật tài khoản) → người ngoài có thể ghi rác vào nhật ký. Đề xuất trước khi bật: migration đổi sang khoá
   riêng cho engine (chưa làm vì đổi chính sách DB cần anh duyệt; nhật ký hiện đang tắt nên chưa có rủi ro).
4. ~~**CSP đầy đủ**~~ → **ĐÃ LÀM (CSP-2):** nonce mỗi lượt + `'strict-dynamic'`, `connect-src` giới hạn máy chủ được gửi dữ liệu,
   kiểm bằng `e2e/csp.spec.ts` (không vi phạm trên 9 trang chính, GTM chạy sau Đồng ý, `<img onerror>` chèn vào bị chặn).
5. **Khi bật tài khoản:** bật Supabase "Leaked password protection", giới hạn gửi email/SMS OTP, tắt đăng ký ẩn danh.
