# Triển khai — web (Vercel) + engine (Render)

## Hai nơi deploy, PHẢI cùng một nhánh

| Thành phần | Nơi chạy | Deploy từ | Cấu hình |
|---|---|---|---|
| Web (Next.js, thư mục `web/`) | Vercel `hieubanthan-nine.vercel.app` | Production Branch trong Vercel → Settings → Git | Env ở Vercel |
| Engine (FastAPI + iztro, `engine/`) | Render `hieubanthan-engine.onrender.com` | `render.yaml` **không ghi nhánh → Render dùng nhánh mặc định `main`** | Env ở Render |

**Lỗi đã gặp (2026-09-30):** web bản mới (preview từ nhánh tính năng) gọi engine Render còn ở `main` cũ →
Hợp đôi, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch, đổi lịch trả 404 "Not Found". E2E trên CI không bắt được vì
CI chạy web và engine **cùng một commit**. Từ bản này web báo: *"Máy tính toán chưa có tính năng này (đang
chạy phiên bản cũ)…"* (HTTP 503) thay vì "Not Found".

Quy tắc: **merge nhánh phát triển vào `main` thì cả Vercel production lẫn Render cùng lên bản mới.** Bản
preview của Vercel (mỗi PR) vẫn gọi engine production — tính năng cần route engine mới sẽ chỉ chạy trên preview
sau khi engine production đã có route đó.

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
