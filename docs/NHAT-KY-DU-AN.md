# Nhật ký dự án HieuBanThan

> Bản ghi người-đọc-được của toàn bộ quá trình xây dựng, để khôi phục ngữ cảnh
> sau khi cài lại máy — hoặc để một AI/người khác đọc là hiểu ngay đang ở đâu.
> Cập nhật lần cuối: 2026-09-30.

---

## 1. Dự án là gì

Nền tảng web luận giải cổ học cho thị trường Việt Nam: **thần số học, nhân
tướng (xem tướng qua ảnh), tử vi, Kinh Dịch**. Định vị pháp lý: **nội dung văn
hoá tham khảo / giải trí**, KHÔNG phải dịch vụ dự báo — để tránh Nghị định
38/2021 về mê tín dị đoan.

Mục tiêu kinh doanh của chủ dự án: một **tài sản** tạo doanh thu, **không phụ
thuộc vào việc chủ ngồi làm** thủ công. Vốn 200–500tr, làm toàn thời gian.

---

## 2. Vì sao chọn ngách này (kết luận phiên phản biện)

- Tận dụng **hiệu ứng Barnum**: người ta nhận ra chính mình trong mô tả tổng
  quát → không cần hứa hẹn gì vẫn thấy "đúng". Nghĩa là **không cần** ngôn ngữ
  dự báo (thứ gây rủi ro pháp lý).
- Chủ dự án đã sở hữu 3 module tự viết (xem mục 4) + kỹ năng marketing/SEO/
  dashboard → lợi thế thật, triển khai được ngay.
- Rủi ro lớn nhất đã nhận diện: chính sách quảng cáo (Meta/TikTok hạn chế),
  mùa vụ, ranh giới pháp lý. → Sống bằng SEO + organic, KHÔNG bằng ads scale.

---

## 3. Kiến trúc 4 tầng (bất biến — xem `CLAUDE.md`)

1. **CALC** — an sao, thần số, quẻ dịch. Python thuần, tất định, KHÔNG LLM.
2. **KB** — Postgres (Supabase), mọi bảng nghĩa có `source_id` + `school_id`.
3. **RULES** — ghép luận theo priority, cấu hình Nguyễn Phát Lộc.
4. **NARRATIVE** — LLM CHỈ diễn đạt JSON từ tầng 1–3, cấm thêm dữ kiện.

Nguyên tắc cốt lõi: **LLM là biên tập viên, không phải thầy.** Không có quy tắc
khớp thì im lặng — im lặng là hành vi đúng.

---

## 4. Bản đồ quyền sở hữu & giấy phép (RẤT QUAN TRỌNG)

| Nguồn | Chủ | Giấy phép | Dùng được? |
|---|---|---|---|
| `tuvi-vn`, `kinh-dich`, `thanso-hoc` | **Chủ dự án tự viết** | — | ✅ Sở hữu 100% |
| `kanxiang` (xem tướng) | timerzz | MIT | ✅ Giữ thông báo bản quyền |
| `iztro` (an sao tử vi) | SylarLong | MIT | ✅ Chạy cục bộ tự do |
| `lunar-javascript` | 6tail | MIT | ✅ |
| Thư tịch cổ | — | Hết hạn bảo hộ | ✅ |
| **`horosa`** | Horace-Maxwell | **AGPL-3.0** | ❌ **KHÔNG dùng** |
| **`aov.cc` API** | bên thứ ba | dịch vụ ngoài | ⚠️ Chỉ làm oracle golden |

**Cảnh báo AGPL:** `horosa` là AGPL-3.0 — dùng nó (kể cả fork/self-host) buộc
phải mở mã nguồn toàn bộ nền tảng. Bản clone tại `C:\Users\mrduc\horosa-skill`
phải cách ly khỏi vùng làm việc; không công cụ AI nào được đọc nó (clean-room).

**Phát hiện then chốt:** `aov.cc` chỉ là lớp bọc quanh `iztro` (MIT). Đã kiểm
chứng iztro chạy cục bộ cho kết quả **trùng khít** aov.cc (14 chính tinh + tứ
hoá, 12/12 cung). → An sao dùng iztro cục bộ, KHÔNG phụ thuộc aov.cc runtime
(aov.cc chập chờn, lỗi Cloudflare 1102, không SLA, và gửi dữ liệu khách ra máy
chủ nước ngoài — chạm Nghị định 13/2023).

---

## 5. Các quyết định đã chốt (không mở lại nếu không có lý do mới)

| Ngày | Quyết định |
|---|---|
| 2026-08-15 | Giờ Tý cho thần số/bát tự = **SWITCH_AT_0000** (sinh 23:00–23:59 thuộc ngày hôm đó). |
| 2026-08-15 | Giờ Tý cho **tử vi = theo iztro (23:00 sang ngày mới)** — nhiều trường phái Tử vi dùng vậy. Hai module hai quy ước, phải gắn cờ cho người sinh 23:xx. |
| 2026-08-15 | An sao = **iztro qua Node subprocess** gọi từ engine Python. Chấp nhận thêm Node vào tầng engine (đã hỏi và duyệt). |
| 2026-08-15 | Deploy = **Đường 2**: web trên Vercel + engine trên host riêng (Render). Khớp kiến trúc, khỏi dời nhà khi thêm iztro. |
| 2026-08-15 | Giai đoạn staging đầu chỉ dựng 2 mảnh (web + engine), **chưa cần Supabase** vì thần số/tử-vi-tuần-triệt không lưu gì. |

---

## 6. Đã làm được gì (theo commit)

- `b978da9` — Nền tảng: engine CALC (thần số port trung thực, timebase múi giờ
  lịch sử VN, lịch âm Hồ Ngọc Đức, tuần/triệt vendor nguyên văn), web Next.js
  14, endpoint SPEC-004a `/v1/tuvi/tuan-triet` + `/api/tuvi/chart` (zod).
- `c173a95` — SPEC-005 golden: an sao tử vi qua iztro cục bộ, đối chiếu aov.cc.
  8 lá golden + 2 lá aov.cc thật làm bằng chứng.
- `baf867d` — Chuẩn bị deploy: auth web↔engine (`X-Engine-Key`), Dockerfile +
  `render.yaml`, Basic Auth staging, `.env.example`.
- **Deploy staging XONG** — web: Vercel (`hieubanthan-nine.vercel.app`), engine:
  Render (`hieubanthan-engine.onrender.com`). Auto-deploy khi push GitHub. Có
  Basic Auth (mrduc / xem env Vercel). Engine Render gói Free ngủ sau 15'.
- `2877f16` — **Giai đoạn B (thần số): tầng KB+RULES+NARRATIVE theo Cách B.**
  KB có nguồn (`app/kb/`, dòng Balliett-Jordan, mỗi số có mặt tối + phản chứng
  chống Barnum), tầng luận giải `app/luangiai/thanso.py` (chỉ ghép từ KB, tôn
  trọng độ nhạy, chế độ template không cần LLM), endpoint `/v1/thanso/luan-giai`,
  web hiện luận giải đầy đủ. Schema Supabase sẵn ở `supabase/migrations/`.

**Trạng thái kiểm thử:** 88/88 test engine xanh, web typecheck xanh, toàn chuỗi
chạy thật tại máy (trình duyệt → Next.js → engine → tính toán).

**Đã kiểm chứng đúng 2 ca hiểm:** sinh trước Tết 05/02/1988 → năm Đinh Mão
1987; giờ Tý 23:00 vs 00:00 lệch trụ ngày.

---

## 7. Bài học kỹ thuật đã ghi vào code

- **Mốc golden phải có nguồn, không lấy từ trí nhớ.** (Từng khẳng định
  30/04/1975 = 19/3 âm theo trí nhớ — SAI; engine đúng 20/3, lịch vạn niên xác
  nhận. Ghi trong docstring `test_lunar.py`.)
- Console Windows cp1252 làm hỏng in tiếng Việt/Trung → luôn đặt
  `PYTHONIOENCODING=utf-8`.
- aov.cc chặn User-Agent urllib (403) và fingerprint bot (503/1102) → gọi bằng
  `curl` khi cần.

---

## 8. Còn phải làm (theo thứ tự)

1. ✅ ~~Deploy staging~~ — XONG.
2. ✅ ~~Giai đoạn B thần số (pipeline luận giải)~~ — XONG, chạy trên KB file.
2b. ✅ ~~Khoá quy tắc Y (deterministic)~~ — XONG. `chi_so_xac_dinh` (Y theo ngữ
   cảnh âm tiết, giữ số cái). Nguyễn Đức Luân 24/10/1988 → DD33/SM9/LH6/NC3.
2c. ✅ ~~Lớp LLM NARRATIVE (env-gated)~~ — XONG. `app/narrative/llm.py`, endpoint
   `/v1/thanso/van`. Không key = template; có key OpenRouter = văn mượt (cấm
   thêm dữ kiện). Key thêm vào Render env sau: `OPENROUTER_API_KEY`.
3. ✅ ~~Chuyển KB vào Supabase~~ — XONG và đã kiểm chứng. KB chạy qua Supabase
   REST (không thêm dep, dùng httpx). Env trên Render: `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`. Endpoint chẩn đoán `/v1/kb/status` báo nguồn thật
   (supabase/file) — đã xác nhận `nguon: supabase`. Cache 60s + fallback file.
   **Tự quản trị:** sửa nội dung ngay trong Supabase Table Editor →
   `thanso_so_meanings`, web tự cập nhật trong 1 phút. RLS chỉ-đọc công khai.
4. ✅ ~~#2 Chiều sâu thần số~~ — XONG. Nội dung `app/kb/data/thanso_depth.json`
   (đỉnh cao 1–9,11,22 · thử thách 0–8 · năm cá nhân 1–9), viết theo Balliett-
   Jordan, giữ chống Barnum. `luan_chieu_sau()` ghép phép tính engine + nghĩa KB;
   năm cá nhân dự báo 3 năm tới. Web hiện đầy đủ. **Nội dung chiều sâu đang ở
   FILE (chưa Supabase)** — chuyển sau khi cấu trúc ổn định (có thể đổi khi #4).
5. ✅ ~~#4 Thiết kế lại trang đọc — premium~~ — XONG. Hệ thiết kế "lịch số ngọc
   bích": `app/globals.css` (tokens sáng/tối), font `next/font` (Newsreader +
   Be Vietnam Pro), layout mới. Chữ ký: `PinnacleArc.tsx` — dải đời SVG chia 4
   giai đoạn theo tuổi, đánh dấu tuổi hiện tại. Build + typecheck xanh, live.
   (Chưa soi được bằng screenshot do môi trường — chờ chủ dự án review mắt thường.)
6. ✅ ~~Chiều sâu lên Supabase~~ — schema `0002`, store hợp nhất (đọc chiều sâu
   chịu lỗi riêng). Seed `supabase/seed_thanso_depth.sql` — chủ dự án chạy trong
   SQL Editor để tự quản trị cả phần chiều sâu.
7. ✅ ~~Q&A hỏi sâu~~ — endpoint `/v1/thanso/hoi` + prompt giữ định vị (cấm dự
   đoán, chỉ dùng dữ liệu con số, giữ mặt tối). Web `QandA.tsx`: chip gợi ý câu
   hỏi theo nhóm + ô nhập tự do. **Cần key `OPENROUTER_API_KEY` trên Render để bật.**
8. **CHƯA làm — paywall Q&A:** "trả phí" cần hệ thanh toán + tài khoản (chưa có).
   Hiện Q&A chạy tự do trên staging để thử. Paywall = giai đoạn thanh toán (kèm
   cổng pháp lý Tuần 0). Định vị Q&A: THAM KHẢO, không dự đoán (giữ pháp lý).
9. ✅ ~~Kinh Dịch vào engine~~ — XONG 2026-09-30. `/v1/kinhdich/khoi-que`: cấu trúc quẻ
   (bản/biến/hỗ/thác/tống, bát cung, thế ứng, nạp giáp, lục thân, quy tắc biến chiếm Chu
   Hy). Vendor nguyên văn từ `source-skills/kinh-dich/gieoque.py` + test chống trôi 4096 tổ
   hợp. Lục Hào thiếu dụng thần → 422. Chưa có luận giải/KB lời quẻ. Phát hiện: ví dụ nhật
   ký ở SKILL.md mục 9 (quẻ 26 động [3,6] → 41) lệch; đúng là → 19, ra 41 khi chỉ động hào 3.
   Kế hoạch tổng: `docs/KE-HOACH-E2E.md`.
5. ✅ ~~SPEC-005 wiring (WS-2)~~ — XONG 2026-09-30 (engine; web chưa đụng).
   `POST /v1/tuvi/an-sao`: giờ đồng hồ → timebase (múi giờ lịch sử) → timeIndex
   iztro → `app/calc/ziwei.py` gọi Node subprocess `app/calc/ziwei_node/an_sao.mjs`
   (JSON stdin/stdout, timeout 10s, env tối thiểu, mỗi lần một tiến trình).
   Trả 12 cung: tên cung, can chi, cờ Mệnh/Thân/Lai Nhân, chính tinh + độ sáng +
   tứ hoá, phụ tinh, tạp tinh, 4 vòng 12 thần, đại hạn, tuổi tiểu hạn — tên zh-CN
   (khoá đối chiếu) + vi-VN (bản dịch có sẵn của iztro). Máy thiếu Node → 503;
   test skip rõ ràng. Auth `X-Engine-Key` qua middleware chung.
   - **iztro ghim 2.6.0** (`package.json` ghim cứng + `package-lock.json`, hằng
     `config.IZTRO_VERSION`; engine từ chối chạy nếu bản cài khác). Bản đã sinh
     golden **không được ghi lại**; đã chạy lại generator với 2.5.8, 2.6.0, 2.6.1
     → cả ba khớp golden 100%. Chọn 2.6.0 vì là bản mới nhất trên npm lúc commit
     golden (2.6.0 phát hành 2026-08-15 03:14 UTC; golden commit 09:02 UTC cùng ngày).
   - **Giờ Tý:** `config.TUVI_TY_BOUNDARY = SWITCH_AT_2300` (mô tả hành vi iztro),
     thần số giữ `SWITCH_AT_0000`. Sinh 23:00–23:59 (theo giờ kinh tuyến UTC+7,
     sau quy đổi múi giờ) → `_ty_conflict=true` + cờ `ty_conflict`.
   - **Golden có trường đặt tên sai:** `la_menh` trong `ziwei_golden.json` thực ra
     là `isOriginalPalace` của iztro = cung **Lai Nhân** (来因宫), chỉ trùng cung
     Mệnh ở 1/8 lá. Không sửa golden; engine trả `la_lai_nhan` (so với trường đó)
     và `la_menh` đúng nghĩa (cung 命宫, kiểm bằng `soulPalaceBranch`).
   - Cờ `lich_am_lech`: đối chiếu lịch âm HND của engine với lịch âm của iztro.
   - Docker: đa tầng `node:22-bookworm-slim` (`npm ci` theo lock) → chép binary
     `node` + `node_modules` sang `python:3.12-slim`; smoke test an sao ngay lúc
     build. Đã build + chạy container thật trong cloud session (401 khi thiếu
     khoá, Tý muộn trả `_ty_conflict=true`).
   - Còn lại của WS-2: web thay `/api/tuvi/chart` sang lá số đầy đủ, validate
     `chart.schema.json` v0 (PR riêng — PR này không đụng web).

   **Lệch iztro so với Nam phái (`source-skills/tuvi-vn/SKILL.md` mục 1) — ghi
   nhận, KHÔNG sửa logic iztro.** Đối chiếu sơ bộ trên 8 lá golden, cần người có
   nghề xác nhận trước khi dùng cho RULES/KB:
   | Điểm | iztro 2.6.0 trả gì | Nam phái cần gì |
   |---|---|---|
   | Phái | 紫微斗数全书 (Trung Quốc) | Nam phái (Nguyễn Phát Lộc) — response ghi rõ `truong_phai_an_sao` |
   | Bộ sao | 14 chính + 14 phụ tinh + 38 tạp tinh ≈ 66 sao | ~110–118 sao; thiếu hẳn nhiều sao Việt (Lưu Hà, Thiên Y, Quốc Ấn, Đường Phù, Thiên/Địa Giải, Thiên La/Địa Võng…). Thiên Trù có |
   | Tuần/Triệt | Là tạp tinh đơn `旬空`/`截路` trong một cung | Trụ cột luận, án ngữ cặp cung → dùng `/v1/tuvi/tuan-triet` (vendor Nam phái) |
   | Vòng Thái Tuế | 岁前12神: Tuế Kiện, Hối Khí, Tang Môn, Quán Tác, Quan Phù, Tiểu Hao, Đại Hao, Long Đức, Bạch Hổ, Thiên Đức, Điếu Khách, Bệnh Phù | Thái Tuế, Thiếu Dương, Tang Môn, Thiếu Âm, Quan Phù, Tử Phù, Tuế Phá, Long Đức, Bạch Hổ, Phúc Đức, Điếu Khách, Trực Phù — 6/12 tên khác |
   | Tứ hoá | Chỉ tứ hoá sinh niên (đúng hướng Nam phái); response không phi hoá | Như iztro — không dùng phi tinh |
   | Lịch âm | lunar-lite (lịch Trung Quốc, UTC+8) | Lịch Việt UTC+7 — lệch thật ở một số tháng (vd. Tết 1968, 1985) → cờ `lich_am_lech` |

   **⚠️ Phát hiện lỗi ngoài phạm vi WS-2 — `app/calc/lunar.py` (chưa sửa):** bản
   port Python lệch thuật toán Hồ Ngọc Đức ở 2 chỗ: (1) `get_sun_longitude` dùng
   `int()` (cắt về 0) thay cho `INT` = `floor` của bản gốc → với ngày trước ~2000
   kinh độ âm, ra `-2` thay vì `10`, làm sai tháng 11/tháng nhuận; (2)
   `get_new_moon_day` đảo dấu 3 hạng tử (`+0.0161·sin 2M'`, `+0.0004·sin(2F+M)`,
   `−0.0006·sin(2F+M')`). Đo 1950–2030: engine lệch HND đúng ở **3.106 ngày**
   (vd. 27/01/1952 — Tết Nhâm Thìn — ra 1/12/1951; 20/02/2023 ra 1/1 nhuận thay
   vì 1/2). Bằng chứng bản sửa đúng: HND đã sửa chạy ở UTC+8 khớp lịch iztro
   29.585/29.586 ngày. Sửa = đổi can chi năm/tháng âm của lá số cũ → phải tăng
   `ENGINE_VERSION`, soát lại golden `test_lunar`/`tuvi_tuan_triet` → làm ở PR riêng.
6. **Lớp LLM (tầng NARRATIVE nâng cao)** — OpenRouter, chỉ diễn đạt lại các
   trường từ KB, cấm thêm dữ kiện. Hiện đang chạy chế độ template không LLM.
7. **Giai đoạn C** — trang tự quản trị nội dung + bài SEO.
8. **Cổng pháp lý Tuần 0** (TRƯỚC khi công khai) — merchant thanh toán, luật sư
   duyệt disclaimer, pháp nhân.

---

## 9. Kho quy tắc — con số quyết định

Kho diễn giải hiện có ~10.700 từ (983 tự viết + 9.771 của kanxiang MIT). Sản
phẩm bán 299–499k cần 50.000–150.000 từ → **đang ở ~10%**. Đây là khoản đầu tư
chính của dự án (thuê người có nghề viết 300–500 đoạn luận giải nền, ~30–60tr),
KHÔNG phải server hay giao diện.

---

## 10. Liên kết ngoài (trên claude.ai, sống sót khi cài lại máy)

- Kế hoạch 90 ngày: https://claude.ai/code/artifact/3aba4375-de5e-44a1-944e-01f29f9cbea3
- Hướng dẫn deploy staging: https://claude.ai/code/artifact/242370f6-15e5-43f4-b025-fff6f4fc0365
