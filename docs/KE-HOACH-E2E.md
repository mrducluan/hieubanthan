# Kế hoạch chạy End-to-End — HieuBanThan

> Lập ngày 2026-09-30, trong một cloud session. Đọc cùng `NHAT-KY-DU-AN.md` (lịch sử)
> và `CLAUDE.md` (luật bất biến). File này là **bản đồ việc còn lại**, không mở lại
> các quyết định đã chốt.

---

## 0. Hiện trạng đã kiểm chứng (chạy thật trong session, không lấy từ trí nhớ)

| Hạng mục | Kết quả |
|---|---|
| Test engine | **120 passed, 2 skipped** (`pytest -q`) |
| Web | `npm run typecheck` xanh, `npm run build` xanh (routes `/`, `/than-so`, `/api/thanso/hoi`, `/api/tuvi/chart`) |
| Endpoint engine | `/health`, `/v1/kb/status`, `/v1/thanso/{do-nhay,luan-giai,van,hoi,chu-ky}`, `/v1/timebase/resolve`, `/v1/tuvi/tuan-triet` |
| iztro | Bản mới nhất trên npm: **2.6.1, MIT**. Chưa có dòng code nào trong `engine/app` gọi iztro — mới chỉ có golden. |
| CI | **Chưa có** (`.github/` không tồn tại). Test chỉ chạy tay. |
| Kinh Dịch | Mới có `source-skills/kinh-dich/gieoque.py` (207 dòng), **chưa port vào engine**. |
| Nhân tướng | Chưa bắt đầu (kanxiang MIT mới nằm trong kế hoạch). |
| KB | ~10% khối lượng cần cho sản phẩm 299–499k (mục 9 nhật ký). |

**Kết luận:** chỉ **thần số học** đang chạy E2E thật (trình duyệt → Next.js → engine →
KB Supabase → narrative). Tử vi mới tới Tuần/Triệt. Kinh Dịch, nhân tướng, thanh toán,
CI chưa có.

---

## 1. Định nghĩa "chạy End-to-End" (mục tiêu của kế hoạch này)

Một người dùng thật, trên domain thật, làm được trọn chuỗi:

1. Nhập họ tên + ngày giờ sinh (có cờ giờ Tý 23:xx rõ ràng).
2. Nhận **thần số** + **lá số tử vi đầy đủ** (iztro cục bộ) + luận giải từ KB có nguồn.
3. Gieo **một quẻ Kinh Dịch** cho một câu hỏi, có luận theo một trường phái đã chốt.
4. Mở khoá phần trả phí (Q&A hỏi sâu) qua thanh toán hợp lệ.
5. Mọi bước được **test tự động** (unit + golden + E2E trình duyệt) chạy trên CI mỗi lần push.
6. Không dữ liệu luận giải nào gắn `user_id`, không ảnh nào được lưu (luật CLAUDE.md).

---

## 2. Các luồng việc (workstream) — mỗi luồng = một cloud session riêng

Ký hiệu: 🟢 làm song song được ngay · 🟡 cần anh quyết một điểm trước · 🔴 cần việc ngoài đời thực (pháp lý, tiền, người viết).

### WS-1 ✅ CI: GitHub Actions — XONG 2026-09-30 (PR #1: `ci.yml` job engine + web)
- `pytest` engine + `typecheck` + `build` web trên mỗi push/PR.
- Chạy test drift Tuần/Triệt (`test_tuan_triet_drift.py`) và golden.
- Không thêm dependency nào. **Nên làm đầu tiên** để các luồng song song không làm vỡ nhau.

### WS-2 ✅ SPEC-005 wiring: an sao tử vi đầy đủ qua iztro — XONG phần engine + API 2026-09-30
- **Đã làm:** `engine/ziwei/` (iztro **ghim 2.6.0** + lockfile, `an_sao.mjs`), `app/calc/tuvi_an_sao.py` (subprocess, tất định,
  cache), `POST /v1/tuvi/an-sao` (cùng tiền xử lý âm lịch/múi giờ/cờ với tuần-triệt, cờ `ty_conflict` cho 23:xx, cờ
  `nam_phai`), web `POST /api/tuvi/la-so` (zod hai chiều; **không** đổi `/api/tuvi/chart` v0 đã duyệt). 8/8 lá golden khớp
  tuyệt đối. Dockerfile hai tầng (node:22-trixie-slim → python:3.12-slim) đã build + chạy thử. CI cài iztro trước pytest/E2E.
- **Phát hiện phụ:** lỗi đổi lịch âm (Tết 1990 lệch 1 tháng) → PR sửa riêng, WS-2 dựng trên bản sửa.
- **Còn lại:** UI hiển thị lá số; đối chiếu bộ phụ tinh Nam phái (rủi ro dưới); WS-6 RULES tử vi.
- Endpoint `/v1/tuvi/an-sao`: Python gọi Node subprocess chạy iztro (đã duyệt 2026-08-15).
- Test **viết trước**, so từng cung với `engine/fixtures/golden/ziwei_golden.json` (8 lá).
- Cờ `_ty_conflict` cho người sinh 23:00–23:59 (tử vi SWITCH_AT_2300 vs thần số SWITCH_AT_0000).
- `engine/Dockerfile` phải có Node + iztro ghim phiên bản (khuyến nghị ghim đúng bản đã sinh golden; nâng 2.6.1 phải sinh lại golden và tăng `ENGINE_VERSION`).
- Web: thay `/api/tuvi/chart` sang lá số đầy đủ, validate bằng `chart.schema.json` v0.
- ⚠️ **Rủi ro dữ liệu (từ skill `tuvi-vn` mục 1):** iztro là Tử Vi Đẩu Số Trung Quốc, không phải Nam phái. Tuần/Triệt đã có bản vendor riêng; bộ ~110 phụ tinh Việt (Lưu Hà, Thiên Trù, Thiên Y…) và vòng Thái Tuế phải **đối chiếu và gắn cờ chỗ lệch**, không tự "sửa" iztro.

### WS-3 ✅ Kinh Dịch vào tầng CALC — XONG 2026-09-30
- Port `source-skills/kinh-dich/gieoque.py` → `engine/app/calc/kinhdich.py`, deterministic khi có seed (gieo ngẫu nhiên nằm ở web/API, hàm tính nhận kết quả gieo làm đầu vào).
- Golden `engine/fixtures/golden_kinhdich.json`: 64 quẻ, hào động, quẻ biến, hỗ quái — test trước.
- Endpoint `/v1/kinhdich/khoi-que`. Chốt **một trường phái mỗi lượt** (luật của skill).
- **Đã làm:** `app/calc/kinhdich_vendor.py` (bản sao nguyên văn gieoque.py) + `app/calc/kinhdich.py`
  (hàm thuần) + `app/kinhdich_api.py`. Golden `fixtures/golden/kinhdich.json` (64 quẻ + 10 ca biến
  chiêm). Test chống trôi quét đủ 4096 tổ hợp so với bản gốc. Bất biến độc lập: cặp King Wen
  tống/thác, bát cung 8×8, thế–ứng cách 3, phân phối thệ pháp 3/5/7/1.
- **Nguồn: chỉ bản gốc của chủ dự án.** KHÔNG dùng `horosa-skill` (AGPL-3.0, clean-room — mục 4 nhật ký).
- Bước sau: thể–dụng Mai Hoa, vượng suy nguyệt kiến/nhật thần/tuần không cho Lục Hào (bản gốc
  chưa có — cần anh viết/duyệt quy tắc trước), KB lời quẻ, trang web gieo quẻ.

### WS-4 🟡 Nâng cấp dữ liệu KB (khoản đầu tư chính của dự án)
Mục tiêu từ nhật ký: 50.000–150.000 từ, hiện ~10.700. Chia theo nguồn **hợp pháp**:

| Kho | Khối lượng khung | Nguồn đề xuất (phải xác minh bản quyền từng bản trước khi nạp) |
|---|---|---|
| Thần số (mở rộng) | số 1–9, 11, 22, 33 × 6 chỉ số + chiều sâu | Dòng Balliett–Jordan (bản gốc đầu TK20); tự viết lại, giữ mặt tối + phản chứng |
| Tử vi | 14 chính tinh × 12 cung = **168 đoạn nền**; tứ hoá sinh niên; Tuần/Triệt theo cung; ~110 phụ tinh | Tự viết theo khung `tuvi-vn`; thư tịch cổ hết bảo hộ |
| Kinh Dịch | 64 quái từ + 384 hào từ + Tượng truyện | Chu Dịch cổ kinh (công cộng). Bản dịch Việt cũ: cần kiểm tra tác giả mất > 50 năm (Luật SHTT VN) — ví dụ Phan Bội Châu, Ngô Tất Tố — **xác minh trước khi dùng** |
| Nhân tướng | 9.771 từ kanxiang (MIT) | Giữ thông báo bản quyền MIT |

- Mọi bảng mới: có `source_id` + `school_id`, migration + `.down.sql` (luật CLAUDE.md), **chờ anh duyệt schema**.
- AI có thể soạn **bản nháp có cấu trúc** (JSON theo schema, mỗi đoạn gắn nguồn + mặt tối + phản chứng), nhưng **người có nghề phải duyệt** trước khi lên production — nhật ký đã dự trù 30–60tr cho việc này.
- Trường phái tử vi gốc: Nguyễn Phát Lộc (đã duyệt). Bản dịch Kinh Dịch nền: còn mở, xác minh bản quyền trước.

### WS-5 ✅ E2E test trình duyệt — XONG 2026-09-30 (phần thần số + API tử vi)
- `@playwright/test` **1.56.1** (ghim, khớp Chromium 1194 có sẵn ở `/opt/pw-browsers`) — devDependency đã duyệt.
- `web/playwright.config.ts`: `webServer` tự bật engine (uvicorn :8000) + web (`next dev` :3000); ép rỗng
  `ENGINE_API_KEY`/`OPENROUTER_API_KEY`/`SUPABASE_*` → template + KB file, tất định, không gọi LLM.
- `web/e2e/than-so.spec.ts`: ca chốt Nguyễn Đức Luân 24/10/1988 → DD33 (số cái)/SM9/LH6/NC3, kèm mặt tối/tự kiểm/nguồn,
  chiều sâu (dải đời, thử thách, năm cá nhân); Q&A chỉ kiểm 8 chip gợi ý, **không bấm** (không gọi LLM).
- `web/e2e/tuvi-api.spec.ts`: `POST /api/tuvi/chart` (200 + đúng âm lịch/can chi/Tuần Triệt; 422 khi sai định dạng).
- Chạy: `cd web && npm run e2e`. CI: job riêng `.github/workflows/e2e.yml`.
- Còn lại khi có UI: thêm bước lá số (WS-2) và quẻ (UI Kinh Dịch) vào luồng.

### WS-10 ✅ Thần số v2 — trả lời "hàng nghìn câu hỏi" — XONG phần kỹ thuật 2026-09-30
- Kho 2.023 câu hỏi có nhãn → đo v1: 0% câu trả lời có căn cứ. v2: **90,2%** (không cần LLM), 0% không căn cứ, khủng hoảng 100%.
- CALC chỉ số mở rộng, KB v2 (~17.000 chữ, bản nháp AI), RULES định tuyến câu hỏi, NARRATIVE template + kiểm tra LLM, nhật ký ẩn danh, skill `thanso-kb` + `thanso-tu-cai-thien`.
- Chi tiết + giới hạn: `docs/DANH-GIA-THANSO.md`; thiết kế: `docs/KIEN-TRUC-THANSO-V2.md`.
- Còn lại (việc của anh): chạy migration 0003/0004 + seed, bật `NHAT_KY_HOI=1`, thuê người duyệt KB v2.

### WS-6 🟡 Tầng RULES cho tử vi
- Ghép luận theo priority **đại hạn > lưu niên > tiểu hạn**, config Nguyễn Phát Lộc — sau khi WS-2 xong và WS-4 có KB tử vi.
- Narrative LLM dùng lại `app/narrative/llm.py` (đã có kiểm soát "cấm thêm dữ kiện").

### WS-7 🔴 Thanh toán + tài khoản + cổng pháp lý "Tuần 0"
- Pháp nhân, merchant (VNPay/MoMo/PayOS…), luật sư duyệt disclaimer (NĐ 38/2021), đánh giá NĐ 13/2023 về dữ liệu cá nhân.
- Supabase Auth; paywall cho Q&A. Không lưu luận giải theo `user_id` (chỉ lưu quyền truy cập/giao dịch).
- Phần code làm được trong cloud; phần giấy tờ là việc của anh.

### WS-8 🟢 SEO/organic (Giai đoạn C — kênh sống chính theo nhật ký)
- Nghiên cứu từ khoá, cụm chủ đề, đối thủ; trang nội dung tĩnh cho từng con số / chính tinh / quẻ (tận dụng chính KB của WS-4).
- `llms.txt`, sitemap, schema.org.

### WS-9 🟢 Hạ tầng production
- Render Free ngủ sau 15' → cold start làm hỏng trải nghiệm E2E: lên gói trả phí hoặc chuyển host khi public.
- Domain thật, đã bỏ Basic Auth (mở công khai 2026-10-08), log lỗi, giám sát `/health`.

---

## 3. Thứ tự & phụ thuộc

```
Tuần 1:  WS-1 (CI) ──┬──> WS-2 (iztro wiring) ──> WS-6 (RULES tử vi)
                     ├──> WS-3 (Kinh Dịch CALC)
                     └──> WS-8 (SEO research, độc lập)
Tuần 1–4: WS-4 (KB) chạy nền liên tục — nháp AI + người duyệt
Tuần 2:  WS-5 (E2E Playwright) — sau khi anh duyệt dependency
Tuần 3+: WS-7 (thanh toán + pháp lý) ──> WS-9 (production) ──> PUBLIC
```

Mỗi luồng: nhánh riêng → PR → CI xanh → anh merge. Cập nhật `NHAT-KY-DU-AN.md` khi xong.

---

## 4. Quyết định (anh duyệt 2026-09-30)

| # | Câu hỏi | Kết quả |
|---|---|---|
| 1 | Thêm `@playwright/test` (devDependency web) cho WS-5 | ✅ **Duyệt** |
| 2 | Trường phái tử vi cho KB/RULES | ✅ Nguyễn Phát Lộc (khớp CLAUDE.md). Bản dịch Kinh Dịch nền: **còn mở** — phải xác minh bản quyền từng bản trước khi nạp |
| 3 | Phiên bản iztro | ✅ **Ghim bản đã sinh golden**; nâng 2.6.1 là việc riêng (sinh lại golden + tăng `ENGINE_VERSION`) |
| 4 | Cổng thanh toán | ✅ Làm ở WS-7, chọn cổng khi xong pháp nhân (chưa chốt nhà cung cấp) |
| 5 | Render | ✅ Giữ Free cho staging; **nâng gói trả phí trước khi public** (việc anh làm trên dashboard Render) |

---

## 5. Công cụ/skill đã có sẵn để dùng cho từng luồng

Kho `skills.sh` bị chặn bởi network policy của cloud session (403), nên không tìm thêm
được skill ngoài. Các skill **đã có trong tài khoản** và khớp việc:

| Luồng | Skill |
|---|---|
| WS-2, WS-4, WS-6 | `tuvi-vn` (khung Nam phái, bản gốc trong `source-skills/`) |
| WS-3, WS-4 | `thanso-hoc`; skill `kinh-dich` lưu ở `source-skills/kinh-dich/` |
| WS-4 narrative | `prompt-engineer` |
| WS-1, WS-9 | `devops-automator`, `sre-site-reliability-engineer` |
| WS-7 | `payments-billing-engineer`, `privacy-engineer`, `data-privacy-officer` (NĐ 13/2023) |
| WS-8 | `keyword-research`, `keyword-clustering`, `competitive-landscape`, `seo-project-setup`, `aeo-foundations-architect` |
| Schema KB | `database-optimizer` |
| UX trang đọc | `ux-researcher`, `persona-walkthrough-specialist` |

Connector Canva / Open_SEO / Porter_metrics cần anh authorize trên claude.ai trước khi dùng.

---

## 6. Giới hạn của cloud session (để khỏi bất ngờ)

- Không có secrets Supabase/Render/OpenRouter trong container → test chạy chế độ file KB + template; không deploy thay anh được.
- aov.cc và nhiều domain ngoài có thể bị network policy chặn → golden mới sinh bằng iztro cục bộ (npm truy cập được).
- Container xoá khi hết phiên → mọi việc phải commit + push lên nhánh.
