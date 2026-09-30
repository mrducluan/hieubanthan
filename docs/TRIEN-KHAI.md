# Triển khai — web (Vercel) + engine (Render)

## Hai nơi deploy, PHẢI cùng một nhánh

| Thành phần | Nơi chạy | Deploy từ | Cấu hình |
|---|---|---|---|
| Web (Next.js, thư mục `web/`) | Vercel `hieubanthan-nine.vercel.app` | Production Branch trong Vercel → Settings → Git | Env ở Vercel |
| Engine (FastAPI + iztro, `engine/`) | Render `hieubanthan-engine-sg.onrender.com` (Singapore, Starter; bản cũ Oregon Free sẽ xoá) | Nhánh `main` | Env ở Render |

**Lỗi đã gặp (2026-09-30):** web bản mới (preview từ nhánh tính năng) gọi engine Render còn ở `main` cũ →
Hợp đôi, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch, đổi lịch trả 404 "Not Found". E2E trên CI không bắt được vì
CI chạy web và engine **cùng một commit**. Từ bản này web báo: *"Máy tính toán chưa có tính năng này (đang
chạy phiên bản cũ)…"* (HTTP 503) thay vì "Not Found".

Quy tắc: **merge nhánh phát triển vào `main` thì cả Vercel production lẫn Render cùng lên bản mới.** Bản
preview của Vercel (mỗi PR) vẫn gọi engine production — tính năng cần route engine mới sẽ chỉ chạy trên preview
sau khi engine production đã có route đó.

## Chuyển hạ tầng GĐ1 sang Singapore + không ngủ (làm một lần, ~20 phút)

Lý do và phương án: `docs/KIEN-TRUC-VAN-HANH.md`. Làm theo thứ tự; bước nào lỗi thì dừng, dịch vụ cũ vẫn chạy.

**1. Tạo engine mới ở Singapore (Render)**
1. Render → **New → Blueprint** → chọn repo `hieubanthan`, nhánh `main`. Render đọc `render.yaml` và đề xuất
   dịch vụ `hieubanthan-engine-sg`, vùng Singapore, gói Starter (tính phí theo tháng — xem trang giá Render).
2. Nhập biến môi trường khi được hỏi: `ENGINE_API_KEY` = **đúng chuỗi đang dùng ở Vercel**; `SENTRY_DSN` để trống
   nếu chưa làm bước 3. Nếu dịch vụ cũ có thêm biến (`OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `NHAT_KY_HOI`…), chép sang dịch vụ mới (Render → dịch vụ cũ → Environment).
3. Chờ build xong (5–10 phút, lần đầu cài iztro). Mở `https://hieubanthan-engine-sg.onrender.com/health` → thấy
   `"ok":true` và `"engine_version":"0.1.2"`.

**2. Trỏ web sang engine mới (Vercel)**
1. Vercel → dự án → Settings → Environment Variables → sửa `ENGINE_URL` =
   `https://hieubanthan-engine-sg.onrender.com` (Production + Preview).
2. `web/vercel.json` đã đặt vùng hàm `sin1` (Singapore) — không cần bấm gì thêm.
3. Deployments → Redeploy bản mới nhất. Chạy `node scripts/kiem-tra-trien-khai.mjs https://hieubanthan-nine.vercel.app`
   → 14/14 ✓.
4. Dùng thử 1–2 ngày ổn định → Render → dịch vụ cũ `hieubanthan-engine` (Oregon) → Settings → **Delete**.

**3. Giám sát lỗi (Sentry, miễn phí gói Developer)**
1. sentry.io → tạo tổ chức → **2 project**: `hieubanthan-web` (Next.js) và `hieubanthan-engine` (FastAPI).
   Chọn vùng dữ liệu nếu được hỏi.
2. Lấy **DSN** mỗi project (Settings → Client Keys).
3. Vercel: `NEXT_PUBLIC_SENTRY_DSN` = DSN web → Redeploy. Render (engine mới): `SENTRY_DSN` = DSN engine.
4. Mỗi project → Alerts → bật email khi có lỗi mới. Code đã tắt gửi body, query, cookie, người dùng, IP.

**4. Báo sập (UptimeRobot hoặc Better Stack, miễn phí)**
Tạo 2 monitor HTTP 5 phút/lần: `https://hieubanthan-engine-sg.onrender.com/health` và
`https://hieubanthan-nine.vercel.app/` → gửi email khi sập.

**5. Sao lưu Supabase trong 2 tháng thử nghiệm (gói Free chưa có sao lưu tự động)**
Mỗi tuần: Supabase → Database → Backups (nếu có) hoặc Project Settings → Database → lấy chuỗi kết nối, chạy
`pg_dump "<chuỗi>" > backup-YYYY-MM-DD.sql` trên máy anh, cất vào Google Drive. Lên Supabase Pro khi mở công khai.

## Sau mỗi lần deploy: chạy kiểm tra thật

```bash
cd web
node scripts/kiem-tra-trien-khai.mjs https://hieubanthan-nine.vercel.app
# bật Basic Auth staging thì thêm:
STAGING_USER=… STAGING_PASS=… node scripts/kiem-tra-trien-khai.mjs https://hieubanthan-nine.vercel.app
```

Script gọi thật 14 tính năng (bài đọc, hỏi đáp, hợp đôi, đổi lịch, tử vi, bát tự, phong thuỷ, kinh dịch, link
chia sẻ, thư viện, sitemap, llms.txt) và in ✓/✗ kèm lời báo lỗi. Render gói Free ngủ sau 15 phút — lần gọi
đầu có thể mất 30–60 giây, script chờ tới 90 giây.

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| 503 "đang chạy phiên bản cũ" | Engine Render cũ hơn web | Merge vào `main` (hoặc đổi nhánh deploy của Render) |
| 502 "Không kết nối được máy tính toán" | `ENGINE_URL` sai / Render lỗi | Kiểm env Vercel `ENGINE_URL`, log Render |
| 502 "từ chối kết nối" | `ENGINE_API_KEY` hai bên khác nhau | Đặt cùng một chuỗi ở Vercel và Render |
| Link chia sẻ lỗi | Thiếu `LOI_MOI_SECRET` trên Vercel | Đặt chuỗi ngẫu nhiên ≥ 16 ký tự |

## Thứ tự migration Supabase

`0001 → … → 0005 → 0006 (ho_so) → 0007 (nơi sinh, âm lịch) → 0008 (Sao)`. Mỗi file có `.down.sql`.
Engine và web đều chạy được khi migration mới chưa chạy (tính năng tương ứng ẩn đi / ghi nhật ký bỏ qua).
