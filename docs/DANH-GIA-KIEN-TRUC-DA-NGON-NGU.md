# Đánh giá kiến trúc đa ngôn ngữ (QTE-2) — kế hoạch QTE-1 đã tốt nhất cho codebase chưa?

> Chủ dự án giao 2026-11-08: "trước khi làm tiếp, đánh giá tổng thể lại plan, bộ thuật toán engine, kiến trúc hạ tầng cho đa
> ngôn ngữ; có cách tốt hơn thì làm". Tài liệu này là bản đánh giá CÓ SỐ ĐO trên mã nguồn hiện tại, các điều chỉnh đề xuất,
> và phần đã làm ngay (QTE-2a). Kế hoạch gốc: `docs/KE-HOACH-QUOC-TE.md` (QTE-1, QTE-1b).

## 1. Kết luận ngắn

| Câu hỏi | Trả lời |
|---|---|
| Kế hoạch kinh doanh / thứ tự thị trường (QTE-1 mục 1–4, 6–8) | **Giữ nguyên.** Thư mục con + hreflang, tiếng Anh cho 4 mảng phương Đông trước, không Tarot / Thần số / hỏi đáp, thu tiền qua bên bán hộ, pháp lý — đúng. |
| Kỹ thuật "engine thêm `ngon_ngu`, đọc `*_en.json`" (QTE-1 mục 5) | **Đúng hướng nhưng ĐÁNH GIÁ THẤP một nửa vấn đề.** Dịch KB JSON chỉ phủ phần "tri thức"; LỜI LUẬN (RULES) nằm trong mã Python với **≈ 5.100 dòng chuỗi tiếng Việt** ở `luangiai/`, 1.600 ở `hoidap/`, 3.800 ở `calc/` (tên sao, can chi, bảng hoàng lịch). Không có lớp phủ KB nào ra được bài đọc tiếng Anh. |
| Bộ thuật toán engine đủ cho thị trường tiếng Anh chưa | **Phép tính đủ** (Bát tự / Tử vi / Bát trạch / Huyền Không / Kinh Dịch đều tất định, có golden, lịch Trung Quốc có sẵn). **Thiếu đầu vào múi giờ** cho người sinh ngoài Việt Nam (hai ô khai tay EN-6 BI-3 không dùng được với khách quốc tế) và **thiếu bảng tên tiếng Anh** (tên en-US của iztro không dùng được). Cả hai đã làm ở QTE-2a. |
| Hạ tầng (Vercel sin1 + Render Singapore + Supabase SG) | **Giữ**, chưa cần vùng mới. Mọi trang render động vì CSP nonce → khách Mỹ chịu thêm ~250–400 ms; bản `/en` nên là nơi thử Q-I3 (cache HTML) đầu tiên vì trang kiến thức tiếng Anh là nội dung tĩnh. |
| Có cách kiến trúc tốt hơn không | **Có:** tách rõ "dữ kiện" (tất định, không ngôn ngữ) và "lời" (theo ngôn ngữ) ở ranh giới RULES → NARRATIVE, thay vì dịch từng chuỗi Python. Chi tiết mục 4. |

## 2. Số đo trên mã nguồn (2026-11-08, nhánh main)

Đếm dòng có chuỗi tiếng Việt (có dấu) trong mã Python:

| Thư mục | Dòng chuỗi tiếng Việt | Nghĩa |
|---|---|---|
| `engine/app/kb/*.py` | 39.487 | phần lớn là trình dựng trang kiến thức (`trang_*.py`) + bảng mã; KB JSON riêng 4,0 MB / 67 tệp |
| `engine/app/luangiai/*.py` (RULES) | 5.096 | lời luận ghép bằng f-string: `tuvi_doi_song.py` 585, `battu_doi_song.py` 572, `phongthuy_doi_song.py` 252, `kinhdich_doi_song.py` 132… |
| `engine/app/calc/*.py` (CALC) | 3.805 | TÊN RIÊNG (sao, can chi, cách cục, 28 tú, hoàng lịch) — không phải lời luận, nhưng là chữ hiện ra |
| `engine/app/hoidap/*.py` | 1.626 | ngoài phạm vi tiếng Anh giai đoạn này (QTE-1 mục 3) |
| `web/` | 392 tệp `.tsx`, 103 `page.tsx`; bảng chữ `lib/chu/*.ts` mới phủ chữ CỐ ĐỊNH của ~25 trang | |

Ba phát hiện kỹ thuật khác:

1. **Bộ nhớ đệm đóng băng ngôn ngữ.** 28 điểm đọc KB dùng `@lru_cache(maxsize=1)` trên hàm không đối số; 11 module RULES
   đọc JSON thẳng từ `kb/data` (3 module đọc ở mức module: `nam_tong_quan`, `hoang_lich`, `tuoi_dan_gian`). Thêm tham số
   `ngon_ngu` mà không đổi cách nhớ thì lượt gọi đầu tiên quyết định ngôn ngữ cho cả tiến trình.
2. **Tên tiếng Anh của iztro không dùng được.** iztro có `en-US` nhưng dịch kiểu vui ("emperor", "spark", "considery(Y)",
   "judge"), không phải cách cộng đồng Zi Wei nói tiếng Anh gọi (pinyin: Zi Wei, Tian Ji, Lu Cun…). Dùng iztro `en-US` sẽ
   làm bản tiếng Anh trông nghiệp dư. (`zh-TW` của iztro thì dùng được cho phồn thể.)
3. **`python:3.12-slim` và tzdata.** Múi giờ theo thành phố cần `zoneinfo` → ảnh Docker phải có tzdata; bộ test cũ bỏ qua
   khi máy thiếu (`test_en6_mui_gio`), nên deploy thiếu sẽ không bị test bắt. Đã thêm bước kiểm lúc build.

## 3. Đánh giá từng phần của QTE-1

### 3.1 Kế hoạch sản phẩm — giữ
Thứ tự Bát tự → Tử vi → Phong thuỷ → Kinh Dịch; không mở Thần số / Tarot / hỏi đáp / nhân tướng ở bản tiếng Anh; phồn thể
chỉ khi tiếng Anh có số; thu tiền tháng 3 qua bên bán hộ. Không có lý do mới để mở lại.

**Một điều chỉnh thứ tự bên trong mỗi mảng** (mục 3 QTE-1 ghi "công cụ lập lá số, trang kiến thức, bài đọc đời sống chương 1,
thẻ chia sẻ" như một gói): nên lên theo thứ tự **(1) công cụ lập lá số → (2) trang kiến thức → (3) thẻ chia sẻ → (4) bài đọc
đời sống**. (1)–(3) chỉ cần bảng tên + KB dịch; (4) cần lớp lời theo ngôn ngữ (mục 4.3) — tốn nhất, nên đi sau khi có số
Search Console của (2).

### 3.2 "Tự làm đa ngôn ngữ, không `next-intl`" — giữ, nói rõ cách
- Không dời 103 trang vào `app/[lang]/`. Bản tiếng Anh là cây route riêng `app/en/…` với slug tiếng Anh, chỉ gồm trang được dịch.
- Khung chung (menu, chân trang, thanh mảng, hộp cookie) nằm ở root layout và đang là tiếng Việt → root layout đọc ngôn ngữ từ
  đường dẫn (`proxy.ts` đặt header `x-ngon-ngu` như đang đặt `x-nonce`) để chọn `<html lang>` + khung tiếng Anh. Không cần
  route group, không đổi import `@/app/...` hiện có.
- Bảng chữ `lib/chu` (ND-7) là bộ catalog sẵn có: thêm chiều ngôn ngữ (`bang_en` cùng khoá) thay vì làm catalog thứ hai; CMS
  ghi đè theo ngôn ngữ qua Payload `localization` (QTE-1b 4.3 A).
- hreflang cần **bảng ánh xạ đường dẫn vi ↔ en** (`lib/ngon-ngu/duong.ts`) vì slug khác nhau; `x-default` = tiếng Việt.
- Sitemap riêng `/sitemap-en.xml`; bản `.md` + llms.txt tiếng Anh dùng lại cơ chế `app/md`.

### 3.3 KB dịch máy vào `*_en.json` — giữ, đặt thành thư mục `data/en/`
Lớp phủ cùng khung khoá là đúng (chuỗi chưa dịch giữ tiếng Việt, số liệu không bao giờ bị bản dịch đổi). Đổi chỗ đặt: bản phủ
ở `kb/data/en/<tên>.json` (một thư mục mỗi ngôn ngữ, sau này `zh-hant/`), script `scripts/chuyen_ngu.py` đã đổi theo.

### 3.4 Múi giờ nơi sinh — thiếu, đã làm (QTE-2a, mục 5)

### 3.5 Hạ tầng — giữ, ghi hai việc nền
- Một tiến trình uvicorn trên Render Starter SG: bản tiếng Anh thêm tải đọc trang kiến thức → web cache 6 giờ ở tầng fetch
  đã đỡ; chưa cần vùng thứ hai (QTE-1: xét khi > 30 % lượt ngoài châu Á).
- Hạn mức AI RL-1 theo tiến trình → đã có `NganSachRedis` (EN-6) khi cần nhiều tiến trình.

## 4. Kiến trúc đề xuất: "dữ kiện tất định — lời theo ngôn ngữ"

### 4.1 Nguyên tắc
Tầng CALC và phần quyết định của RULES (mức, hộp nào, `ma_mau`, năm nào, cung nào) **không phụ thuộc ngôn ngữ**. Ngôn ngữ chỉ
đi vào ba chỗ:

| Lớp | Cơ chế | Trạng thái |
|---|---|---|
| **Ngữ cảnh ngôn ngữ của lượt gọi** | `app/ngon_ngu.py` (contextvar), middleware đọc header `x-ngon-ngu` / `?ngon_ngu=`; lạ → `vi` | ✅ QTE-2a |
| **KB** (bảng nghĩa, mẫu câu KB) | `kb/nap.doc(tệp)` gộp `data/<ngôn ngữ>/<tệp>`; `kb/nap.nho` thay `lru_cache` (khoá nhớ kèm ngôn ngữ) — 22 module KB + 6 module RULES đã chuyển | ✅ QTE-2a |
| **Tên riêng** (sao, cung, can chi, thập thần, quái, du niên, 64 quẻ…) | `kb/ten.py` + `kb/data/ten_en.json` (341 mục, pinyin + chú giải; phồn thể lấy cột `han`) | ✅ QTE-2a |
| **Lời luận RULES** (f-string tiếng Việt) | mục 4.3 | ⏳ tuần 3–4, cần duyệt |
| **Lời web** (bảng chữ `lib/chu`, khung, form) | chiều ngôn ngữ cho `BangChu` | ⏳ tuần 3–4 |

### 4.2 Vì sao không dùng gettext / dịch từng chuỗi Python
~10.000 chuỗi, nhiều chuỗi là f-string ghép theo ngữ pháp tiếng Việt (thứ tự từ, "của bạn", phân loại giới) → dịch từng mảnh
cho câu tiếng Anh gãy; đổi ~40 tệp RULES đang có 9.400 test khoá hành vi tiếng Việt = rủi ro hồi quy lớn nhất của dự án, và
trái quy tắc "không refactor ngoài phạm vi". Loại.

### 4.3 Cách làm lời tiếng Anh cho bài đọc (đề xuất, chờ chủ dự án duyệt trước tuần 3)
Bài đọc đời sống đã có khuôn `doi_song_1`: mỗi hộp mang `ma_mau` tất định (951 mã golden), `muc`, dữ kiện (`can_cu`). Lớp
lời tiếng Anh dựng **từ chính các mã + dữ kiện đó**, không dịch f-string:

1. **Hộp từ KB** (phần lớn hộp Tử vi / Bát tự / Phong thuỷ / Kinh Dịch lấy câu trong `*_doi_song_kb.json`) → lớp phủ KB là đủ.
2. **Câu nối / tóm tắt / tiêu đề chương do Python ghép** → một tệp mẫu câu tiếng Anh theo mã (`kb/data/en/loi_khuon.json`:
   `tieu_de_chuong`, `tom_tat.<mức>`, `hop.<loại>.<mã>`…) + một hàm `loi(ma, **slot)` trong `doi_song_khuon`, chỉ bật khi
   ngôn ngữ ≠ vi; thiếu mẫu → giữ tiếng Việt (web gắn nhãn "chưa dịch", không bao giờ rỗng). Phạm vi tuần 3–4: chương 1 của
   Bát tự + Tử vi (đo được: ≤ 150 mẫu câu mỗi mảng).
3. **AI diễn đạt** (`luan_giai_van`) với lời nhắc tiếng Anh + bộ kiểm tiếng Anh (`chuyen_ngu/kiem.py` đã có `cum_cam_en`) là
   lớp làm mượt tuỳ chọn, bản mẫu (2) vẫn là nền rơi về — đúng quyết định "LLM không dịch lúc trả lời": nguồn của LLM là bản
   tiếng Anh đã dựng tất định, không phải chữ tiếng Việt.

Thứ tự này giữ MỘT bộ tính, không đổi mã kiểm chứng (`ma_mau` không có ngôn ngữ), và bản Anh / Việt cùng một dữ kiện.

### 4.4 Lọc công khai + an toàn theo ngôn ngữ
`cong_khai.py` (BM-1) là regex tiếng Việt; `kiem_giong_van` / `cum_cam` cũng vậy. Khi có bản tiếng Anh: thêm bộ quy tắc EN
(`cum_cam_en` đã có trong `thuat_ngu_en.json`) và test quét bản phủ `data/en/*`. Chưa cần ở QTE-2a vì chưa có bản phủ.

## 5. Đã làm trong QTE-2a (PR này) — không đổi phép tính, không tăng `ENGINE_VERSION`

1. `app/ngon_ngu.py` + middleware (`x-ngon-ngu`, `?ngon_ngu=`; `vi` / `en` / `zh-hant`, giản thể → `vi`).
2. `app/kb/nap.py`: `doc()` có lớp phủ `data/<ngôn ngữ>/`, `nho()` thay `lru_cache`; **22 module KB + 6 module RULES** chuyển
   sang; test `tests/test_ngon_ngu_nap.py` khoá: không có bản phủ → mọi tệp y hệt JSON gốc (ở cả `vi` và `en`); tầng KB không
   còn `lru_cache` / `read_text` riêng.
3. `app/kb/ten.py` + `kb/data/ten_en.json` (341 mục): 14 chính tinh, 14 phụ tinh, 38 tạp diệu, 4 vòng × 12, 12 cung, độ sáng,
   tứ hoá, cục, sao lưu; can / chi / hành; thập thần, 12 trạng thái; 8 quái, 8 du niên, 8 hướng, 9 sao bay; 64 quẻ (pinyin + Hán
   + chú giải trung tính). Test phủ đủ mọi tên iztro có thể trả (`fixtures/golden/iztro_ten_vi.json`, sinh bằng
   `ziwei/_generate_ten_vi.mjs`) và hằng số CALC.
4. **Giai đoạn 0 tuần 1 (a):** `calc/mui_gio.py` + `calc/data/mui_gio.json` (62 nước, 146 thành phố / vùng, ưu tiên nơi đông
   người Việt) — `tai(zone, ngày, giờ)` trả múi giờ chuẩn (bội 0,25), giờ mùa hè, cờ làm tròn (giờ địa phương lẻ phút trước
   1911), cờ giờ mơ hồ lúc đổi giờ; lịch sử múi giờ do tzdata (golden 24 ca: Moskva 1990 vs 2012, Anh 1968–71, Singapore
   +7:30, Trung Quốc giờ hè 1986–91, Hàn 1987–88…). Route `GET /v1/dia-ly/mui-gio`, `POST /v1/dia-ly/mui-gio/tai`; đầu vào lá
   số thêm `mui_gio` (mã thành phố hoặc mã vùng IANA, chỉ nước ngoài) → engine tự suy `utc_noi_sinh` + `gio_mua_he`, **thắng**
   hai ô khai tay; Dockerfile kiểm tzdata lúc build. Web: form hồ sơ chọn **Nước → Thành phố** (khai tay vào mục gập), dòng
   xác nhận "Lúc sinh nơi đó dùng UTC−8, đang giờ mùa hè"; hồ sơ lưu `mui_gio` trên máy; `/api/thanso/hom-nay` nhận `ngay_xem`
   = ngày theo đồng hồ máy người dùng (người ở Mỹ 20:00 vẫn là hôm nay).
5. Script chuyển ngữ ghi bản phủ vào `data/en/<tên>.json`; `*.loi.json` không vào git.

## 6. Chưa làm / cần quyết

| Việc | Ai | Ghi chú |
|---|---|---|
| Duyệt cách làm lời tiếng Anh (mục 4.3) trước tuần 3 | chủ dự án | ảnh hưởng khối lượng tuần 3–8 |
| Cột `mui_gio` trong bảng `ho_so` (migration 0034, có .down) | chủ dự án duyệt + chạy | hiện chỉ lưu trên máy; đồng bộ tài khoản vẫn mang `utc_noi_sinh` cũ |
| Hôm nay: các khối phụ (hoàng lịch theo tuổi, quẻ ngày, tháng này nhà bạn, việc tuần) vẫn lấy ngày giờ Việt Nam; cron nhắc việc 8:03 giờ VN | tuần 2 | thẻ chính đã theo đồng hồ máy |
| Trang SEO tiếng Việt theo nước (giờ giao thừa, Tết theo giờ địa phương) — giai đoạn 0 (b) | tuần 2 | cần số GSC quốc gia (việc của anh) |
| Giờ mặt trời thực cho nơi sinh nước ngoài | — | giữ `SOLAR_TIME_ADJUST=False`, chỉ cảnh báo (quyết định 2026-09-30) |
| `goi_y_cheo` (gợi ý chéo) chưa nhận `mui_gio` / `utc_noi_sinh` | — | chỉ ảnh hưởng người sinh 23:xx giờ mùa hè ở thẻ gợi ý nhỏ |
