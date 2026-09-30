# Kiến trúc vận hành — đánh giá & đề xuất (2026-09-30)

> Trạng thái: **Giai đoạn 1 đang triển khai** (PR hạ tầng GĐ1); phương án A khuyến nghị, chờ chủ dự án chốt. Giá dịch vụ ghi là **[ước tính]** — giá nhà cung cấp đổi thường
> xuyên, kiểm lại trang giá trước khi mua. Nhãn: [SỰ THẬT] kiểm được trong repo · [SUY LUẬN] · [ƯỚC TÍNH].

## 1. Hiện trạng (đọc từ repo)

```
Người dùng (VN)
   │
   ▼
Vercel — web Next.js 14 (Hobby)          vùng chạy hàm: mặc định Mỹ (không có vercel.json)   [SỰ THẬT]
   │  HTTPS + ENGINE_API_KEY
   ▼
Render — engine FastAPI + Node/iztro     gói Free, ngủ sau 15', vùng mặc định Oregon (Mỹ)     [SỰ THẬT: render.yaml]
   │  (tuỳ chọn) REST
   ▼
Supabase — Postgres + Auth (+ Storage)   vùng Singapore; migration 0001–0008, RLS              [SỰ THẬT: CLAUDE.md]
PostHog (đo lường) · OpenRouter (LLM, chỉ tầng NARRATIVE)
```

**Điểm tốt — nên giữ:** tách web / engine / dữ liệu đúng 4 tầng; engine không trạng thái (nhân bản dễ); RLS +
hàm SECURITY DEFINER cho sổ cái Sao; CI chạy engine + web + E2E.

**Điểm yếu vận hành thật sự (xếp theo mức ảnh hưởng):**

| # | Vấn đề | Hậu quả |
|---|---|---|
| 1 | Render Free ngủ sau 15 phút | Người dùng đầu tiên chờ 30–60 giây → bỏ đi; SEO bị chấm chậm |
| 2 | Ba vùng lệch nhau: Vercel (Mỹ Đông) → Render (Oregon) → Supabase (Singapore) | Mỗi yêu cầu vòng qua Thái Bình Dương 2–4 lần: +300–600 ms [SUY LUẬN] |
| 3 | Web và engine deploy lệch nhánh (lỗi "Not Found" hôm nay) | Tính năng hỏng âm thầm; đã vá bằng script kiểm tra, cần quy trình |
| 4 | Không có giới hạn tần suất (rate limit) trên API hỏi đáp | Khi bật LLM / Sao: một bot có thể đốt tiền OpenRouter, cày Sao |
| 5 | Supabase Free: tạm dừng khi không hoạt động 1 tuần, không có sao lưu tự động | Sổ cái Sao (sắp có tiền) không có backup / khôi phục theo thời điểm |
| 6 | Vercel Hobby **cấm dùng thương mại** theo điều khoản | Khi bán Sao / có quảng cáo phải lên Pro |
| 7 | iztro: mỗi lá số khởi động một tiến trình Node mới | ~100–200 ms mỗi lần, tốn RAM khi đông người [SUY LUẬN] |
| 8 | Không có theo dõi lỗi / cảnh báo sập (chỉ có `/health`) | Biết lỗi khi người dùng báo |

## 2. Đánh giá bảng đề xuất của công cụ AI

| Thành phần đề xuất | Nhận xét cho HieuBanThan | Kết luận |
|---|---|---|
| Backend Render/Railway, "Agent, SSE, tool calling" | Nơi chạy thì đúng. Nhưng engine của mình **cố ý không có agent** (CLAUDE.md tầng CALC; Blueprint: *Multi-agent MVP: REJECTED*). Streaming lời diễn đạt LLM thêm được vào tầng NARRATIVE khi cần, không cần kiến trúc agent. | ✅ Giữ Render, **bỏ gói Free**, chuyển Singapore |
| Neon (Postgres + pgvector) | Supabase **đã là Postgres có pgvector**, cộng Auth + Storage + RLS đang dùng. Chuyển sang Neon = viết lại toàn bộ RLS (`auth.uid()`), đăng nhập, 8 migration; lợi duy nhất là không bị tạm dừng — giải được bằng Supabase Pro. | ❌ Không đổi |
| Upstash Redis | Hữu ích thật: **rate limit** (điểm yếu #4), cache, hàng đợi. | ✅ Thêm khi bật LLM / mở Sao cho công chúng (cần duyệt dependency) |
| Cloudflare R2 | CLAUDE.md **cấm lưu ảnh người dùng**; phong thuỷ ảnh xử lý tạm rồi bỏ. Báo cáo PDF / ảnh OG đủ dùng Supabase Storage. | ⏸ Chưa cần |
| Clerk hoặc giữ Supabase Auth | Clerk thêm một nhà cung cấp nữa giữ dữ liệu cá nhân ở Mỹ (thêm hồ sơ chuyển dữ liệu ra nước ngoài theo NĐ 13/2023), phải nối lại RLS. Supabase Auth đã làm xong email/Google/SMS. | ❌ Giữ Supabase Auth |
| Vercel | Tốt cho Next.js. Lưu ý Hobby cấm thương mại; đặt vùng hàm Singapore. | ✅ Giữ |

**Tóm lại:** bảng đó hợp với một dự án *mới từ đầu* muốn tối đa gói miễn phí. Với HieuBanThan đã có Supabase
chạy đủ Auth + RLS + sổ cái, thêm Neon + Clerk + R2 làm **tăng số nhà cung cấp từ 4 lên 7** mà không giải điểm
yếu nào ở mục 1 tốt hơn việc nâng gói.

## 3. Các phương án

| | A. Giữ nền, nâng đúng chỗ (**khuyến nghị**) | B. Theo bảng AI đề xuất | C. Engine sang Fly.io / Cloud Run | D. Tự chạy VPS tại VN |
|---|---|---|---|---|
| Thành phần | Vercel + Render (SG) + Supabase (SG) + Upstash + Sentry | Vercel + Render + Neon + Upstash + R2 + Clerk | Vercel + Fly.io (SG, tự tắt/bật ~1–2 s) + Supabase | 1 VPS (Viettel/FPT/BizFly) + Coolify: web, engine, Postgres |
| Công chuyển đổi | Rất thấp (đổi gói, tạo lại dịch vụ Render ở SG) | Cao (viết lại auth/RLS/migration) | Trung bình (Dockerfile giữ nguyên) | Cao + tự vận hành |
| Ổn định | Tốt | Tốt nhưng nhiều điểm hỏng | Tốt | Phụ thuộc người vận hành |
| Dữ liệu ở VN | Không (SG) | Không (Mỹ/SG) | Không | **Có** |
| Chi phí giai đoạn đầu [ƯỚC TÍNH] | ~7 USD/tháng | 0–5 USD | ~2–8 USD (tính theo dùng) | ~5–15 USD |
| Hợp khi | Hầu hết giai đoạn tới | Làm lại từ đầu | Muốn rẻ mà không ngủ lâu | Luật yêu cầu dữ liệu nằm ở VN |

## 3b. A hay B — cho người làm theo kiểu vibe coding (chủ dự án hỏi 2026-09-30)

"Vibe coding" = chủ dự án điều khiển AI viết code, không tự đọc/sửa từng dòng. Tiêu chí quan trọng nhất vì thế
**không phải giá rẻ nhất**, mà là: ít chỗ có thể hỏng âm thầm, ít bảng điều khiển phải nhớ, AI viết đúng ngay lần
đầu, và khi hỏng thì tìm được nguyên nhân.

| Tiêu chí | A. Giữ Supabase (nâng đúng chỗ) | B. Neon + Clerk + R2 + Upstash |
|---|---|---|
| Số dịch vụ phải đăng ký, giữ khoá, theo dõi | 4 (Vercel, Render, Supabase, Sentry) + Upstash khi cần | 7 (Vercel, Render, Neon, Clerk, R2, Upstash, Sentry) |
| Việc phải làm lại | Không — đổi gói + vùng | Viết lại đăng nhập (Clerk), phân quyền dòng (RLS) cho Clerk, 8 migration, sổ cái Sao, xoá tài khoản |
| Rủi ro bảo mật khi AI viết lại | Thấp — phần nhạy cảm (RLS, SECURITY DEFINER) đã viết + thử | **Cao** — nối Clerk ↔ Postgres sai là lộ hồ sơ người khác; loại lỗi không hiện trên màn hình, test tay khó thấy |
| Một chỗ xem dữ liệu | Có — Supabase Studio: bảng, người dùng, SQL, log trên một trang | Không — người dùng ở Clerk, dữ liệu ở Neon, tệp ở R2 |
| AI viết code đúng | Rất nhiều mẫu Supabase + Next.js; AI quen | Mỗi ghép nối (Clerk↔Neon, R2 ký URL) là thêm một chỗ AI dễ nhầm |
| Tiền tiết kiệm | — | ~25 USD/tháng (Supabase Pro) **chỉ khi đã mở công khai** |
| Dữ liệu cá nhân ra nước ngoài | 1 nơi giữ hồ sơ (Supabase SG) | 2 nơi (Clerk + Neon) → thêm việc với hồ sơ NĐ 13/2023 |
| Nâng cấp sau này | Supabase có sẵn pgvector (RAG), hàng đợi, cron, Storage, bản sao đọc | Có, nhưng mỗi thứ thêm một nhà cung cấp |

**Khuyến nghị: chọn A.** Lý do chính: B tiết kiệm ~25 USD/tháng nhưng buộc viết lại đúng phần nguy hiểm nhất
(đăng nhập + phân quyền + sổ cái), mà lỗi ở phần này **không nhìn thấy khi bấm thử** — đúng loại lỗi vibe coding khó
bắt nhất. 2 tháng thử nghiệm nội bộ dùng Supabase Free vẫn ổn (dự án chỉ tạm dừng khi không ai dùng 1 tuần).
Nên xem lại B chỉ khi: Supabase tăng giá mạnh, hoặc cần tính năng Supabase không có.

## 4. Lộ trình hạ tầng gắn với Blueprint / kinh tế cộng đồng

> Chủ dự án chốt thời gian: **thử nghiệm nội bộ 2 tháng** trước khi mở rộng → làm Giai đoạn 1 ngay; Giai đoạn 2
> khi mở công khai / bắt đầu bán Sao.

**Giai đoạn 1 — ngay bây giờ (Gate 0–1, 20–500 người thử), ~7 USD/tháng [ƯỚC TÍNH]**
1. ✅ (code) Render: tạo lại dịch vụ engine ở **Singapore**, gói **Starter** (không ngủ) — `render.yaml`, hướng dẫn `docs/TRIEN-KHAI.md`. Vùng dịch vụ Render không đổi
   được sau khi tạo → tạo mới rồi trỏ `ENGINE_URL` sang.
2. ✅ (code) Vercel: `web/vercel.json` đặt vùng hàm **`sin1`** (Singapore) cạnh engine + Supabase.
3. Render + Vercel **cùng deploy từ `main`**; phát triển trên nhánh, merge vào `main` là lên production; chạy
   `web/scripts/kiem-tra-trien-khai.mjs` sau mỗi lần (docs/TRIEN-KHAI.md).
4. ✅ (code) Sentry (gói free) cho web + engine, lọc dữ liệu cá nhân; UptimeRobot/Better Stack gọi `/health` 5 phút/lần, báo qua email.
5. Giữ Supabase Free nhưng **xuất sao lưu thủ công hằng tuần** (pg_dump) cho tới giai đoạn 2.

**Giai đoạn 2 — mở công khai + bán Sao (Phase 3 Blueprint), ~60–80 USD/tháng [ƯỚC TÍNH]**
1. Vercel **Pro** (bắt buộc khi thương mại), Supabase **Pro** (không tạm dừng, sao lưu hằng ngày; cân nhắc
   PITR khi doanh thu Sao đáng kể).
2. **Upstash Redis**: rate limit theo IP + tài khoản cho `/api/*/hoi`, đăng nhập, nhận thưởng Sao; cache bài đọc.
3. **Cổng AI (AI Gateway — Blueprint MANDATORY)**: một lớp duy nhất gọi OpenRouter, ghi token vào/ra, chi phí,
   trần chi tiêu/ngày, trừ Sao trước khi gọi (`dung_sao` đã có). Đặt trong engine (`app/narrative`).
4. Thanh toán (payOS/VNPay/MoMo): webhook vào route Next.js → hàm SQL cộng Sao **idempotent** theo mã giao dịch.
5. Engine: giữ **một tiến trình Node thường trú** cho iztro thay vì khởi động mỗi lần; 2 bản chạy song song.

**Giai đoạn 3 — Life Advisor, cộng đồng, đối tác, marketplace (Phase 4–7)**
1. RAG / trí nhớ dài hạn: **pgvector trong Supabase** (không cần CSDL vector riêng — Blueprint: *Dedicated
   Vector DB: HOLD*).
2. Hàng đợi việc nền (báo cáo PDF, xử lý ảnh phong thuỷ, đối soát hoa hồng đối tác): Supabase Queues/pg_cron
   hoặc Upstash QStash.
3. Hoa hồng đối tác (tiền thật): bảng sổ cái riêng tách khỏi Sao, đối soát tháng, khấu trừ thuế — cùng Postgres.
4. Marketplace người luận giải: cần giữ tiền hộ → làm việc với cổng thanh toán có tài khoản tạm giữ; rà pháp lý.
5. Khi tải thật vượt 1 máy: engine nhiều bản sau cân bằng tải (Render/Fly), Supabase read replica.

**Không làm** (Blueprint + đề xuất kinh tế cộng đồng): blockchain/token đổi tiền, microservices, Kubernetes,
CSDL graph/vector riêng, tự host LLM.

## 5. Dữ liệu cá nhân & pháp lý hạ tầng

- Ngày giờ sinh, nơi sinh là dữ liệu cá nhân. Supabase (Singapore), Vercel, Render, PostHog, OpenRouter đều ở
  nước ngoài → cần **hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài** (NĐ 13/2023; Luật Bảo vệ dữ liệu cá
  nhân hiệu lực 01/01/2026). Mỗi nhà cung cấp thêm vào = thêm một dòng trong hồ sơ → lý do thêm để **không**
  thêm Clerk/Neon/R2 khi không cần.
- Nếu luật sư kết luận phải lưu dữ liệu tại VN (vd theo NĐ 53/2022 khi có yêu cầu), phương án D áp cho riêng
  bảng `ho_so` + sổ cái; phần còn lại giữ nguyên.
