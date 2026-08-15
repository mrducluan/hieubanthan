# CLAUDE.md — HieuBanThan

## Stack (KHÔNG được đổi khi chưa hỏi)
Next.js 14 App Router + TypeScript strict / Supabase (Postgres, Auth, Storage - region SG)
/ Python FastAPI cho engine tính toán / LLM chỉ qua lớp narrative, model qua OpenRouter

## Kiến trúc 4 tầng (bất biến)
1. CALC: an sao, thần số, quẻ dịch — Python thuần, deterministic, KHÔNG gọi LLM
2. KB: Postgres, mọi bảng nghĩa bắt buộc có source_id + school_id
3. RULES: ghép luận theo priority đại hạn > lưu niên > tiểu hạn, config Nguyễn Phát Lộc
4. NARRATIVE: LLM chỉ diễn đạt JSON từ tầng 1-3, cấm thêm dữ kiện ngoài input

## Quy tắc code
- Mọi hàm tính toán phải có test trước khi viết hàm (golden dataset trong /fixtures)
- Không lưu nội dung luận giải gắn user_id. Không lưu ảnh người dùng.
- Đổi lịch âm: thuật toán Hồ Ngọc Đức, xử lý múi giờ VN trước 1975
- Ranh giới giờ Tý: **ĐÃ CHỐT `SWITCH_AT_0000`** (quyết định người vận hành,
  2026-08-15) — sinh 23:00–23:59 thuộc ngày hôm đó, giờ Tý. Hằng
  `TY_BOUNDARY_POLICY` trong `engine/app/config.py`. Đổi = tăng ENGINE_VERSION.
- Secrets qua env, không hardcode. Mọi migration có rollback.

## Cấm tuyệt đối
- Không refactor ngoài phạm vi task được giao
- Không thêm dependency mới khi chưa hỏi
- Không đổi schema DB khi chưa có migration được duyệt

---

## Bố cục repo

```
engine/          Tầng 1 CALC — Python thuần + FastAPI, không LLM, không DB
  app/config.py    Chính sách bất biến: ranh giới giờ Tý, bảng múi giờ lịch sử
  app/calc/        Hàm tính thuần: timebase, lunar (Hồ Ngọc Đức), thanso
  fixtures/        Golden dataset — nguồn chân lý cho test
  tests/           Viết TRƯỚC hàm, theo quy tắc code
web/             Next.js 14 App Router, TS strict — chỉ gọi engine, không tự tính
supabase/        Migration, mỗi file .sql có file .down.sql đi kèm
```

## Ranh giới giữa các tầng

| Tầng | Được làm | Cấm |
|---|---|---|
| CALC | Tính toán thuần, cùng đầu vào ra cùng kết quả | Gọi LLM, chạm DB, giữ trạng thái |
| KB | Lưu và tra bảng nghĩa | Sinh nghĩa mới |
| RULES | Ghép luận theo priority | Gọi LLM |
| NARRATIVE | Diễn đạt JSON tầng 1–3 thành văn | Thêm bất kỳ dữ kiện nào ngoài input |

Engine không biết Supabase tồn tại. Web không tự tính bất cứ thứ gì.

## Quyết định đã chốt (không mở lại nếu không có lý do mới)

| Ngày | Quyết định |
|---|---|
| 2026-08-15 | Giờ Tý: `SWITCH_AT_0000`. `chart.schema.json` v0: đã duyệt. |
| 2026-08-15 | SPEC-005 (an sao đầy đủ): nguồn tri thức đối chiếu = skill `aov-mingyu-api` (aov.cc). **Khuyến nghị kiến trúc đã ghi nhận**: dùng aov.cc làm ORACLE sinh golden (lá số mẫu đối chiếu khi phát triển), an sao chạy CỤC BỘ trong engine — ngày giờ sinh của khách không gửi ra máy chủ ngoài (NĐ 13/2023, không SLA). |
| 2026-08-15 | **aov.cc = lớp bọc quanh `iztro` (MIT, SylarLong)** — đã kiểm chứng iztro cục bộ trùng khít aov.cc (14 chính tinh + tứ hoá, 12/12 cung). aov.cc `/ziwei/calculate` chập chờn (Cloudflare 1102). → An sao dùng **iztro chạy cục bộ**, không phụ thuộc aov.cc runtime. |
| 2026-08-15 | **Kiến trúc an sao: Python engine gọi iztro qua Node subprocess.** Chấp nhận thêm Node vào tầng engine (lệch CLAUDE.md "Python FastAPI" — đã hỏi và duyệt). Không viết lại logic an sao. |
| 2026-08-15 | **Giờ Tý cho tử vi: theo iztro (SWITCH_AT_2300, 23:00 sang ngày mới).** Thần số học + bát tự giữ SWITCH_AT_0000. Hai module hai quy ước — bắt buộc gắn cờ cho người dùng sinh 23:00–23:59. |

**Golden SPEC-005:** `engine/fixtures/golden/ziwei_golden.json` (8 lá, sinh cục bộ bằng iztro qua `_generate_ziwei_golden.mjs`). `ziwei_oracle_raw/` giữ 2 lá aov.cc thật làm bằng chứng đối chứng độc lập. Ca `nam_muon_ty` (timeIndex 12) mang `_ty_conflict=true`.

## Chạy dự án

```bash
# engine
cd engine && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python -m pytest              # phải xanh trước khi chạy server
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000

# web
cd web && npm install && npm run dev        # http://localhost:3000
```
