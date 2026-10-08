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

## Nhắc việc chủ dự án
Đầu mỗi phiên: đọc `docs/VIEC-CUA-ANH.md`, nhắc ngắn các mục chưa `[x]` (biến env bắt buộc, Search Console, pháp lý,
hạ tầng…). Chủ dự án báo xong mục nào → đánh `[x]` trong file đó.

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
web/             Next.js 14 App Router, TS strict, Tailwind + shadcn/ui — chỉ gọi engine, không tự tính
supabase/        Migration, mỗi file .sql có file .down.sql đi kèm
.claude/skills/  thanso-kb, thanso-tu-cai-thien (thần số) · huyenhoc-kb, huyenhoc-tu-cai-thien (4 mảng Huyền học)
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
| 2026-09-30 | Duyệt thêm devDependency `@playwright/test` (E2E web). iztro **ghim bản đã sinh golden**. Kinh Dịch vào engine từ `source-skills/kinh-dich/gieoque.py` — **không** dùng horosa (AGPL). |
| 2026-08-15 | **Giờ Tý cho tử vi: theo iztro (SWITCH_AT_2300, 23:00 sang ngày mới).** Thần số học + bát tự giữ SWITCH_AT_0000. Hai module hai quy ước — bắt buộc gắn cờ cho người dùng sinh 23:00–23:59. |
| 2026-09-30 | **Thần số v2 (chủ dự án chốt):** mở câu hỏi về người khác / hợp đôi / con như thị trường · bản nháp KB do AI viết **hiển thị mọi nơi** (giữ cột `trang_thai` để duyệt dần) · nhật ký hỏi lưu câu hỏi đã lọc + câu trả lời, **không** user_id / tên / ngày sinh · thêm biểu đồ ngày sinh + mũi tên, tháng/ngày cá nhân, số ngày sinh/thái độ/trưởng thành, nợ nghiệp/bài học nghiệp. Sản phẩm **lệch có chủ ý** skill gốc `source-skills/thanso-hoc` (cổng G6, cấm hợp đôi) — skill gốc giữ làm công cụ phân tích riêng, không sửa. Vẫn giữ: câu khủng hoảng → hỗ trợ; xổ số / ngày chết / chẩn đoán bệnh / tuyển dụng → không trả lời. Thiết kế: `docs/KIEN-TRUC-THANSO-V2.md`. |
| 2026-09-30 | **iztro ghim 2.6.0** (`engine/ziwei/package-lock.json`): 2.5.8/2.6.0/2.6.1 cho kết quả trùng khít 8 lá golden; 2.6.0 là bản mới nhất lúc commit golden. Lá số đầy đủ ở route MỚI `/v1/tuvi/an-sao` + `/api/tuvi/la-so`; `/api/tuvi/chart` v0 giữ nguyên. Sửa lỗi port Hồ Ngọc Đức (INT=floor, dấu NewMoon) → `ENGINE_VERSION` 0.1.1. |
| 2026-09-30 | **Bát tự (HH-3):** tiết khí tự tính bằng VSOP87 rút gọn trong Python (sai ≤ 0,63 phút so với lunar-typescript) — lunar-typescript **chỉ** làm oracle sinh golden, không chạy runtime. Giờ Tý bát tự giữ SWITCH_AT_0000; sinh 23:xx: trụ ngày hôm đó, trụ giờ = Tý ngày sau (dạ Tý), gắn cờ. Ngũ hành/thân vượng theo thang điểm công bố trong `battu.THANG_DIEM`; dụng thần luôn trình bày hai cách, không tự chọn. |
| 2026-09-30 | **Huyền học 4 mảng** (chủ dự án chốt): Tử vi · Kinh Dịch · Bát tự · Phong thuỷ, theo danh mục 9 cổ thư (`docs/KIEN-TRUC-HUYEN-HOC.md`). Nguồn: mở mạng ctext.org để đối chiếu nguyên văn (chưa mở → nháp AI gắn `can_doi_chieu`). Kinh Dịch: 3 chế độ `tu_dong`/`nghia_ly`/`day_du`, LLM không chọn quẻ. Tử vi: 2 chế độ `tham_khao`/`chi_tiet`. Mọi chế độ vẫn chặn khủng hoảng, ngày chết, chẩn đoán bệnh, xổ số, tuyển dụng. |
| 2026-09-30 | **Làm lại UI (UI-0…UI-6, chủ dự án chốt):** Thần số làm cửa chính (Phase 1 Blueprint v1.1), 4 mảng Huyền học ở mục "Khám phá". Phong cách "Đêm sao phương Đông" (tối, huyền bí) nhưng luôn tách 3 lớp ĐÃ TÍNH / DIỄN GIẢI / TỰ SOI. Duyệt thêm dependency web: Tailwind 3 + shadcn/ui (Radix), `motion`, `lucide-react`, `posthog-js`, `@supabase/ssr`+`@supabase/supabase-js`. Hồ sơ: lưu trên máy mặc định + tài khoản tuỳ chọn (email/Google/SMS) — **nới quy tắc**: ngày giờ sinh được lưu trong bảng hồ sơ khi người dùng CHỦ ĐỘNG bấm lưu, RLS chủ sở hữu, xoá ngay; vẫn cấm lưu luận giải gắn user_id. Làm luôn hợp đôi + link mời (Phase 2) — lệch Blueprint có chủ ý, bắt buộc đo funnel tách pha. Hỏi đáp: mỗi mảng một khung chat. Link mời/thẻ chia sẻ = **mã HMAC có ký** (chỉ tên hiển thị + con số, không ngày sinh, không bảng DB; env `LOI_MOI_SECRET`). Hợp đôi **không chấm điểm** hợp/khắc. Bảng `ho_so` (migration 0006, RLS chủ sở hữu) chờ chủ dự án duyệt + chạy. Thiết kế: `docs/THIET-KE-UI.md`. |
| 2026-09-30 | **Hồ sơ Tử vi · SEO · Sao (chủ dự án chốt):** Tử vi/Bát tự bắt buộc giờ sinh + giới tính + **nơi sinh** (63 tỉnh theo giấy khai sinh, hoặc nước ngoài); **sinh ở nước ngoài lập theo GIỜ ĐỊA PHƯƠNG** (`ABROAD_LOCAL_TIME`), giờ mùa hè trừ 1 giờ; **giờ mặt trời thực chỉ cảnh báo**, không đổi lá số (`SOLAR_TIME_ADJUST=False`); nhập ngày âm miền Nam 1960–13/06/1975 đổi theo lịch UTC+8 → `ENGINE_VERSION` 0.1.2. Trang kiến thức SEO dựng từ KB, **index cả nháp AI** (luôn gắn nhãn nháp), mở robots cho bot AI, có llms.txt. **Sao** = credit nội bộ, không đổi ra tiền, không chuyển nhượng; thưởng mời hai phía **một tầng**; không phát hành token/crypto, không hoa hồng nhiều tầng (đa cấp). Migration 0007, 0008 chờ duyệt + chạy. Đề xuất kinh doanh: `docs/DE-XUAT-KINH-TE-CONG-DONG.md`. |
| 2026-09-30 | **Hạ tầng (phân tích `docs/KIEN-TRUC-VAN-HANH.md`):** giữ Vercel + Render + Supabase (phương án A; KHÔNG chuyển Neon/Clerk/R2 — viết lại auth/RLS rủi ro cao với cách làm vibe coding). GĐ1 (thử nghiệm nội bộ 2 tháng): engine Render **Singapore, gói Starter** (không ngủ, dịch vụ mới `hieubanthan-engine-sg`), Vercel hàm vùng **`sin1`**, duyệt dependency **`@sentry/nextjs` + `sentry-sdk[fastapi]`** — chỉ bật khi có DSN, tắt thu body/query/cookie/user/IP. GĐ2 khi mở công khai: Vercel Pro, Supabase Pro, Upstash rate limit, cổng AI. |
| 2026-10-01 | **Lá số trực quan + kho tri thức (chủ dự án chốt):** lá số Tử vi/Bát tự vẽ SVG, **2 giao diện có nút chuyển** (Đêm sao mặc định / Giấy cổ), hỏi đáp đặt **dưới** lá số. Nguồn KB: cổ thư công cộng (ctext) + PDF chủ dự án gửi — sách hiện đại chỉ tóm ý, ghi nguồn, không chép nguyên văn. "Luận giải toàn bộ" miễn phí 2 tháng thử nghiệm rồi trừ Sao. Thứ tự: UI lá số → kho tri thức. `la_menh` = cung tên "Mệnh" (iztro `isOriginalPalace` là Lai nhân cung → `la_lai_nhan`). Phông chữ Hán trang trí Noto Serif TC qua next/font (không thêm gói npm). Kế hoạch: `docs/KE-HOACH-TRUC-QUAN-VA-TRI-THUC.md`. |
| 2026-10-01 | **Độ sáng sao Tử vi: hiện cả hai** (chủ dự án chốt): mặc định bảng Nam phái lối Việt cho 14 chính tinh (`calc/tuvi_do_sang_vn.py`, đối chứng 8/8 điểm với lá số Việt), công tắc xem bảng phái Trung (iztro). Chỉ thêm trường `do_sang_nam_phai`, không đổi an sao. **Nguồn AGPL (horosa, mingyu-core) vẫn KHÔNG chép mã/dữ liệu vào dự án** — clone không đổi giấy phép; chỉ được chạy riêng làm oracle đối chiếu (như aov.cc). `tuvi-neo` không có giấy phép → không dùng. |
| 2026-10-02 | **Huyền Không thế quái** (chủ dự án duyệt làm): khẩu quyết thế tinh Thẩm thị, thuận nghịch theo âm dương **sơn gốc**, sao 5 tra chính toạ/hướng sơn; kiêm hướng = lệch tâm sơn **> 3°** (nhập độ thì tự lập thế quái, kèm cục hạ quái để so). Không có oracle MIT nào lập bàn thế quái (`suangua` chỉ có bảng; gói PyPI duy nhất là GPL) → kết quả gắn `chua_doi_chieu_oracle` cho tới khi có ví dụ sách. Đổi lịch âm: `lunar_to_solar` chặn ngày 30 của tháng thiếu (bản gốc Hồ Ngọc Đức âm thầm trôi sang tháng sau). |
| 2026-10-02 | **Bát tự cách cục Tử Bình Chân Thuyên** (KB-3b): định cách theo nguyệt lệnh — tàng can thấu ra can năm/tháng/giờ (bản → trung → dư khí, bỏ Tỷ Kiếp), không thấu lấy bản khí; chi tháng là Lộc/Kiếp → Kiến Lộc / Dương Nhận / Nguyệt Kiếp (cách, dụng xét can lộ khác). Thay quy tắc giản lược cũ (lệch 12% lá số) → **`ENGINE_VERSION` 0.1.3**. |
| 2026-10-02 | **Độ sáng Nam phái đã đối chứng độc lập**: bảng 14 chính tinh khớp **156/156 ô** với `lasotuvi` 0.1.2 (MIT, doanguyen; Thiên Phủ lasotuvi không ghi) → không cần chờ lá số mẫu. Thêm độ sáng lối Việt cho 16 phụ tinh/tạp diệu + Hoá Kỵ từ cùng nguồn (golden `do_sang_lasotuvi.json`). Repo không giấy phép (vd `tuongotpho/tuvi`, `kabalavn/La-So-Tu-Vi`) → chỉ tham khảo cách làm, KHÔNG chép. |
| 2026-10-02 | **Tử vi dùng âm lịch VIỆT NAM** (LS60): iztro tự đổi âm theo lịch Trung Quốc (UTC+8) → 1.376 ngày 1930–2025 sai tháng/Mệnh/Cục. Sửa bằng cách thay KẾT QUẢ ĐỔI LỊCH (lunar-lite) cho đúng ngày sinh/ngày xem bằng âm lịch Hồ Ngọc Đức (miền Nam 1960–1975 UTC+8) — quy tắc an sao vẫn của iztro → **`ENGINE_VERSION` 0.1.4**. Golden 60 + 12 lá đối chiếu `lasotuvi` (MIT) trong CI. Khác phái (tháng nhuận nửa sau, Hoả/Linh, tứ hoá Canh/Nhâm, Khôi Việt…) **chưa đổi, chờ chốt** — `docs/DOI-CHIEU-TUVI-60.md`. |
| 2026-10-02 | **Trường phái Tử vi "hiện cả hai"** (chủ dự án chốt): Hoả/Linh mặc định **lối Việt** (`tuvi_hoa_linh_vn`, khớp lasotuvi 72/72), công tắc Trung Châu; nửa sau tháng nhuận mặc định **tính tháng sau**, công tắc "như tháng chính" (chỉ hiện khi áp dụng). Tứ hoá Canh/Nhâm, Khôi Việt: **giữ iztro**, ghi chú khác bản. Tuỳ chọn `hoa_linh`, `thang_nhuan` trong đầu vào lá số. |
| 2026-10-02 | **Giá Luận giải toàn bộ: 10 Sao/báo cáo, CHƯA thu** (chủ dự án chốt): công tắc `LUAN_GIAI_THU_SAO=1` (mặc định tắt). Trừ Sao ở máy chủ bằng phiên người dùng (`dung_sao`), engine tính trước rồi mới trừ, khoá giao dịch theo lá số + ngày (không trừ hai lần trong ngày). Hướng dẫn bật: `docs/TRIEN-KHAI.md`. |
| 2026-10-02 | **Giải nghĩa đời thường xuyên mọi mảng** (chủ dự án yêu cầu): từ điển KB `tu_dien.json` (221 thuật ngữ, 5 mảng) — engine tra (`tu_dien.nhan_dien`), web chỉ gạch chân + khung "Giải nghĩa" + trang `/tu-dien`. Kinh Dịch: "nói nôm na" cho 64 quẻ + 384 hào + Dụng, Thoán truyện có dịch nghĩa (đều nháp AI, đi kèm chứ không thay nguyên văn). Tử vi: 14 chính tinh có nghĩa riêng khi sáng/hãm; **hỏi đáp + luận giải + thẻ cung dùng độ sáng Nam phái** (trước đó hỏi đáp còn dùng bảng iztro, lệch lá số). Cách cục Tử vi 37 → 62 (danh mục đối chiếu TuViMCP, MIT; cổ ca chỉ giữ phiên âm Hán Việt — phần dịch của sách hiện đại không chép). |
| 2026-10-02 | **Tách trường phái Tử vi cho người dùng chọn** (chủ dự án yêu cầu): thêm **âm lịch Việt Nam (mặc định) ↔ lịch Trung Quốc** (`lich`, Trung = để iztro tự đổi UTC+8), cờ `lich_khac` + ghi chú ở form hồ sơ khi ngày sinh lệch hai lịch; tên vòng Thái Tuế theo phái (Nam phái khớp lasotuvi 72/72). Mọi công tắc (lịch, độ sáng/tên sao, Hoả Linh, tháng nhuận) gom vào khung "Trường phái" có giải thích — đổi phái có thể ra lá gần giống hoặc khác hẳn, hỏi đáp/luận giải theo đúng phái đang xem. Mặc định không đổi → không tăng `ENGINE_VERSION`. PR #3 (WS-2 cũ) đóng: main đã làm thay. |
| 2026-10-07 | **Thần số chiều sâu + hợp đôi theo quan hệ** (chủ dự án yêu cầu): rà nguồn mở — `anko-ki-maya` (MIT) chỉ dùng làm KHUNG mục (bản gốc theo mulank Ấn Độ, không chép văn); `gr8monk3ys/numerology` là **GPL** và `Ultimate-SoulCodex` **không giấy phép** → không dùng. Thêm KB `thanso_chan_dung.json` (12 số × 4 mặt: tổng quan/tình cảm/công việc/biến cố) + lớp riêng từ Linh hồn/Nhân cách/Sứ mệnh/Thử thách; CALC `thanso_dong_doi` (giai đoạn + thử thách P1↔T1…P4↔T4, chu kỳ 9 năm, năm bước ngoặt) + route đối chiếu năm biến cố (không lưu); hợp đôi nhận `quan_he` (người yêu · bạn bè · đồng nghiệp · sếp · gia đình, mặc định người yêu) với KB `thanso_quan_he.json` + nhịp năm hai người; cặp số viết lại trung tính. Đều nháp AI. Kết quả số cũ không đổi → không tăng `ENGINE_VERSION`. |
| 2026-10-08 | **Lưu nguyệt Tử vi — người dùng chọn phái** (chủ dự án chốt): 5 phái (`calc/tuvi_luu_nguyet.PHAI`): Đẩu Quân từ Thái Tuế (**mặc định**, khớp iztro 680/680) · Đẩu Quân từ Tiểu hạn · tháng Giêng tại Tiểu hạn · tại cung lưu niên · theo địa chi tháng. Tứ hoá theo can tháng (bảng iztro); tháng nhuận theo `thang_nhuan`. Mỗi tháng kèm cung theo cả 5 phái để so; ưu tiên đại hạn > lưu niên > tiểu hạn > lưu nguyệt. Chưa an sao lưu tháng, không lưu nhật. Không đổi kết quả cũ → không tăng `ENGINE_VERSION`. `docs/LUU-NGUYET-TUVI.md`. |
| 2026-10-08 | **Phong thuỷ từ bố cục nhà (PT-V0)**: schema `engine/app/schemas/bo_cuc.schema.json` (BoCuc 0.1: hướng nhà, vị trí 6 loại phòng theo 9 phương nhìn từ tâm nhà, hướng vật dụng, 18 dấu hiệu quan sát được = mã `bo_tri` KB). RULES `luangiai/phongthuy_bo_cuc.py` luận theo mệnh gia chủ (không có thì theo trạch), mỗi kết luận trỏ mục KB. Dấu hiệu nguồn ảnh/video **chưa xác nhận thì không luận** (trả `can_xac_nhan`). Hôm nay nhập qua form "Khảo sát nhà"; ảnh (PT-V2) chờ 50–100 bộ ảnh có phiếu đồng ý — **ảnh không vào git**. |
| 2026-10-08 | **Mở công khai hieuban.com** (chủ dự án chốt): gỡ hẳn Basic Auth staging (`web/middleware.ts`), **bỏ Gate 0** người thử riêng — đo người dùng thật bằng PostHog + Search Console. **Chưa bật tài khoản** (không đặt khoá Supabase trên web → nút đăng nhập tự ẩn, hồ sơ lưu trên máy; ví Sao/link mời có thưởng chờ bật). `siteUrl()` bản build production mặc định `https://hieuban.com`. Giới hạn lượt AI: RL-1 (dòng dưới). Danh sách việc: `docs/VIEC-CUA-ANH.md` (mục G, H, E). |
| 2026-10-08 | **RL-1 hạn mức lượt AI**: `narrative/ngan_sach.py` — cửa sổ trượt trong bộ nhớ engine (một tiến trình uvicorn), theo người gọi (IP web chuyển qua header `x-nguoi-goi`, engine băm có muối, không lưu) + tổng giờ + tổng ngày, env `LLM_LUOT_*` (mặc định 40/400/3000). `kiem_luot()` đặt **trong** mọi hàm gọi OpenRouter; hết lượt → `HetLuot` → nơi gọi rơi về template (người dùng không thấy lỗi). Không dùng dependency mới (Upstash để GĐ2 nếu chạy nhiều tiến trình). |
| 2026-10-08 | **SEO-D + đo lường Google** (chủ dự án yêu cầu): mỗi trang kiến thức/từ điển/thư viện có **bản Markdown** cùng URL + `.md` (rewrite → `app/md/[...duong]`, header `Link: rel=canonical` về HTML, `<link rel=alternate type=text/markdown>`), `/index.md` = llms.txt; llms.txt trỏ `.md`. Schema Organization có `legalName`/email/contactPoint; từ điển `DefinedTermSet`; manifest; thẻ xác minh Google/Bing qua env; production `*.vercel.app` → 308 về hieuban.com. Đơn vị vận hành mặc định **Hieu Ban Co Ltd · contact@hieuban.com** (env ghi đè). **GTM `GTM-KNZL39CS` chỉ nạp sau khi người dùng bấm "Đồng ý"** (hộp hỏi cookie, không tích sẵn, đổi ý ở chân trang; quảng cáo luôn denied) — không dán snippet GTM thẳng vào `<head>`. PostHog (ẩn danh, không cookie) không phụ thuộc hộp hỏi. |
| 2026-10-08 | **SEO-E rà kỹ thuật** (chủ dự án yêu cầu): `web/scripts/kiem-tra-seo.mjs` quét toàn sitemap (title ≤ 70 kể cả hậu tố, description ≤ 170, canonical, đúng 1 H1, OG/Twitter, JSON-LD, breadcrumb, alt, link hỏng) — giữ **0 lỗi 0 cảnh báo**. Trang công cụ (client) phải có `<h1>` ngay trong HTML máy chủ (tiêu đề render cả lúc chờ hồ sơ) + khối `GioiThieuCongCu` (giới thiệu, hỏi đáp, schema WebPage/FAQPage/Breadcrumb). Metadata trang tĩnh dùng `metaTrang()` (openGraph trang **thay** bản layout, không gộp → luôn khai đủ). Tiêu đề > 52 ký tự bỏ hậu tố thương hiệu (`tieuDeSeo`), mô tả cắt ≤ 160 (`catMoTa`). Header bảo mật trong `next.config.mjs` (Permissions-Policy giữ cảm biến cho la bàn). IndexNow: khoá công khai `/indexnow.txt`, workflow báo sau mỗi lần merge main. |
| 2026-10-08 | **TP-LICH — chọn âm lịch Việt/Trung + trường phái ở mọi mảng** (chủ dự án yêu cầu): `config.TZ_LICH_AM` = {viet: UTC+7, trung: UTC+8}. Đổi lịch hồ sơ `lich` (+ `am_viet` luôn trả về); Kinh Dịch Mai Hoa `lich`; Phong thuỷ mệnh quái `moc_nam` = `lap_xuan` (mặc định) / `tet_viet` / `tet_trung`, API trả `so_sanh_moc` + `moc_khac`; Bát tự `gio_ty` = `da_ty` (mặc định) / `sang_ngay` (trụ ngày hôm sau, trụ giờ như nhau). Tử vi đã có từ TV-LICH. Web: khung "Trường phái" (`KhungPhai.tsx`) ở Bát tự, Phong thuỷ; chọn lịch ở Mai Hoa và form nhập âm lịch; lựa chọn đi theo MỌI lời gọi (lá số, hỏi đáp, luận giải, đo hướng, khảo sát nhà). Mặc định không đổi → không tăng `ENGINE_VERSION`. |

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
