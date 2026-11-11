# PROMPT — Chuyển thể TOÀN BỘ HieuBanThan sang tiếng Anh (EN-ALL)

> Prompt viết cho Claude Code. Chủ dự án dán nguyên văn tệp này (hoặc ghi "làm theo `docs/PROMPT-EN-TOAN-BO.md`") vào phiên mới.
> Viết 2026-11-10, dựa trên hiện trạng `main` sau HTT-3 (#244). Nếu khi đọc thấy code đã khác mô tả ở mục 1, **tin code**, ghi
> chỗ lệch vào `docs/EN-TIEN-DO.md` rồi làm tiếp.

---

## 0. Vai trò và mục tiêu

Em là kỹ sư chính kiêm trưởng nhóm bản địa hoá của HieuBanThan. Nhiệm vụ: đưa **mọi tính năng người dùng cuối** của hieuban.com
sang tiếng Anh tại `hieuban.com/en/…`, sao cho một người Mỹ / Anh / Úc / Canada / Singapore / Malaysia không biết tiếng Việt
dùng được **trọn vẹn**: lập hồ sơ, xem lá số, đọc bài luận, hỏi đáp, kiến thức, thẻ chia sẻ, tài khoản, nhắc việc, lưu bài,
kiểm chứng "đúng với mình" — không gặp một chữ tiếng Việt, không gặp câu dịch sát vụng về, không gặp tính năng gãy.

**Định nghĩa "xong"** (kiểm được, không cảm tính):

1. Mọi trang người dùng cuối của bản Việt (mục 1.3) có trang tương đương tiếng Anh, hoặc có quyết định ghi rõ "không có bản Anh"
   kèm lý do trong `docs/EN-TIEN-DO.md` (vd `/quan-tri`).
2. Bộ e2e tiếng Anh duyệt hết sitemap tiếng Anh: 0 ký tự tiếng Việt trong chữ HIỂN THỊ (trừ nút "Tiếng Việt" và trường được
   phép như chữ Hán), 0 link nội bộ rơi khỏi `/en` ngoài ý muốn, 0 lỗi console, 0 cuộn ngang ở 390 px.
3. **Bản tiếng Việt không đổi một byte đầu ra engine** (golden chụp trước khi sửa, mục 5.1) và mọi test cũ xanh.
4. Engine: mọi route trả lời đúng ngôn ngữ của lượt gọi; đầu ra tiếng Anh qua bộ kiểm (mục 5.2) sạch.
5. Bộ rà SEO `node web/scripts/kiem-tra-seo.mjs --chi-en` 0 lỗi 0 cảnh báo; hreflang hai chiều đúng cặp.
6. Hai vòng "người dùng nước ngoài thật" (agent đóng vai, mục 5.6) không còn phát hiện mức Cao.

---

## 1. Đọc trước khi động vào code (bắt buộc, theo thứ tự)

1. `CLAUDE.md` — đặc biệt: kiến trúc 5 tầng, "MỘT bộ tính", quy tắc riêng tư (a)–(e), SK-1, CY-1, BM-1, EEAT-1, các dòng
   **QTE-1, QTE-1b, QTE-2, QTE-3, HTT-1, HTT-2, HTT-3** trong bảng quyết định.
2. `docs/KE-HOACH-QUOC-TE.md` (QTE-1 → mục 15) và `docs/DANH-GIA-KIEN-TRUC-DA-NGON-NGU.md` (kiến trúc "dữ kiện tất định — lời
   theo ngôn ngữ").
3. `docs/DANH-GIA-HYBRID-TWO-TIER.md` mục 9 (QC SEO/GEO bản `/en` đã làm), `docs/VIEC-CUA-ANH.md` mục 4af–4aj.
4. Code nền đa ngôn ngữ đã có — đọc hết trước khi thiết kế thêm:
   - Engine: `app/ngon_ngu.py` (contextvar, header `x-ngon-ngu` / `?ngon_ngu=`, biến thể `en-us`), `app/kb/nap.py` (`doc`, `nho`,
     `gop` — lớp phủ `kb/data/<ngôn ngữ>/`), `app/kb/loi.py` (`L(mã, chữ_vi, **slot)`, `danh_sach`, `mao_tu`, `hoa_dau`),
     `app/kb/ten.py` + `kb/data/ten_en.json` (341 tên riêng, pinyin + chú giải — **không** dùng en-US của iztro),
     `kb/data/thuat_ngu_en.json` (219 thuật ngữ + `cum_cam_en`), `app/chuyen_ngu/{kiem,quy_trinh,soan_lai}.py` + `scripts/chuyen_ngu.py`,
     `luangiai/hoi_en.py`, `luangiai/an_toan.py` (đã có tiếng Anh một phần), `kb/data/en/*.json` (9 tệp), `kb/data/en-us/`.
   - Test mẫu: `tests/test_en_tarot.py`, `tests/test_en_thanso.py`, `tests/test_en_an_toan.py`, `tests/test_ngon_ngu_nap.py`.
   - Web: `proxy.ts` (đặt `x-ngon-ngu`), `app/layout.tsx` (rẽ `KhungEn` khi en), `components/en/{KhungEn,BaoCaoEn,HoiEn}.tsx`,
     `lib/en/*`, `lib/ngon-ngu.ts`, `lib/noi-dung-trang.ts` (`BAN_TIENG_ANH`), `lib/chu/*.ts` (bảng chữ ND-7), `app/en/**`,
     `app/sitemap-en.xml`, `e2e/en.spec.ts`.
5. Kiểm kê thật (đừng tin con số trong prompt): chạy lại các lệnh đếm ở mục 1.3 và ghi kết quả vào `docs/EN-TIEN-DO.md`.

### 1.1 Hiện trạng (2026-11-10)

| Phần | Đã có tiếng Anh | Chưa |
|---|---|---|
| Thần số | `/en/numerology`, Life Path 1–9/11/22/33, hỏi đáp gọn 10 kiểu câu (`hoi_en`) | Chaldea, hợp đôi, Bản đồ con số, nỗi đau, năm/tháng/ngày cá nhân đầy đủ, biểu đồ + mũi tên, ~200 trang kiến thức (`bo_sung_*`, số kép, cặp số, nghề, tình yêu, nợ nghiệp) |
| Tarot | `/en/tarot` (7 trải bài + "Khi nào", "Hai lựa chọn"), 78 trang lá | thẻ chia sẻ, lịch sử, Sao, AI diễn đạt chương trả lời bằng tiếng Anh |
| Tử vi · Bát tự · Phong thuỷ · Kinh Dịch · Nhân tướng · Chân dung · Thời gian tới · Hôm nay · Xem ngày · lịch & tuổi · Năm · Hợp đôi · Blog · tài khoản · Sao | **chưa có** | toàn bộ |
| Khung web | `KhungEn` tối giản (4 link, không menu Huyền học, không CMS, không Sao) | menu đầy đủ, thanh mảng, chân trang, form hồ sơ, hộp đồng ý, cookie, tài khoản |
| CMS | không | Payload `localization` (QTE-1b mục 2 đã duyệt hướng) |

### 1.2 Số đo đã biết (đo lại)
- Engine 128 route; ~5.100 dòng chuỗi tiếng Việt ở `luangiai/`, ~1.600 ở `hoidap/`, ~3.800 ở `calc/` (tên riêng), KB JSON ~4 MB / ~70 tệp.
- Web ~115 `page.tsx` ngoài `/en`, ~132 route API, ~230 tệp `components/**/*.tsx` có chữ tiếng Việt cứng.

### 1.3 Lệnh kiểm kê gợi ý
```bash
find web/app -name page.tsx | grep -v '^web/app/en' | sort
grep -rlP '[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]' web/components web/app web/lib --include=*.ts --include=*.tsx | wc -l
grep -rhoE '@(app|router)\.(get|post)\("[^"]+' engine/app | sort
```
Lập **bảng kiểm kê** trong `docs/EN-TIEN-DO.md`: mỗi trang Việt → URL Anh dự kiến → trạng thái (chưa / đang / xong / không làm +
lý do) → giai đoạn. Đây là thước đo tiến độ duy nhất; cập nhật sau MỖI commit đáng kể để phiên khác làm tiếp được.

---

## 2. Ràng buộc không được phá

1. **Một bộ tính.** CALC không đọc ngôn ngữ. Không chép phép tính sang JS. Ngôn ngữ chỉ đổi CHỮ, không bao giờ đổi số, mức,
   hộp nào, `ma_mau`, năm nào, cung nào. Không tăng `ENGINE_VERSION` (trừ khi sửa phép tính — không thuộc việc này).
2. **Bản Việt là bản chính và không hồi quy.** Golden chụp đầu ra trước khi sửa (mục 5.1) phải trùng từng byte sau mỗi giai đoạn.
3. **LLM không dịch lúc người dùng đọc.** Mọi chữ tiếng Anh là chữ đã soạn sẵn trong git (KB phủ, mẫu câu `loi_khuon`, bảng chữ web,
   CMS). LLM chỉ được dùng: (a) lúc SOẠN qua `chuyen_ngu` (QTE-1b) — hoặc em tự viết như ban biên tập; (b) lớp diễn đạt có sẵn
   (`luan_giai_van`, `kiem_ai`) với NGUỒN là bản tiếng Anh tất định, có bản mẫu rơi về.
4. **Riêng tư giữ nguyên quy tắc (a)–(e).** Không thêm chỗ lưu tên / ngày sinh. Ngôn ngữ người dùng chọn là sở thích giao diện,
   lưu cookie; chỉ lưu tài khoản nếu có migration được duyệt (mục 4.6).
5. **An toàn MỘT bộ chặn** (`luangiai/an_toan.py`) cho mọi ngôn ngữ; không tạo bộ chặn thứ hai cho tiếng Anh.
6. **Không dependency mới** (không `next-intl`, `i18next`, `react-intl`, `date-fns/locale`…). Dùng `Intl.*` có sẵn.
   Cần thứ gì ngoài danh sách đã duyệt → dừng, ghi vào mục "Cần chủ dự án quyết", làm phần khác.
7. **Migration**: được viết (có `.down.sql`, test trên Postgres thật / chuỗi `sao-that`), **không** tự chạy trên production;
   ghi bước chạy vào `docs/VIEC-CUA-ANH.md`. Migration Payload có up/down, thử trên Postgres thật.
8. **Không refactor ngoài phạm vi.** Đụng một tệp chỉ để đưa chữ qua lớp ngôn ngữ; không đổi tên hàm, không "dọn dẹp" thêm.
9. **BM-1**: bản Anh không lộ thư viện, oracle, nhà cung cấp, tên khoá nội bộ (iztro, lasotuvi, OpenRouter, Supabase…).
   `cong_khai.py` đã có bảng tiếng Anh — mở rộng, không viết bộ thứ hai.
10. **Pháp lý tiếng Anh** (QTE-1 §7): không "accurate / guaranteed / destiny is fixed", không lời khuyên y tế / đầu tư / pháp lý,
    không vật phẩm hoá giải, không đoán tuổi thọ / năm mất / số xổ số; thêm câu ranh giới bằng tiếng Anh tự nhiên.
11. **Không nhân đôi component.** Không tạo `components/en/TuViEn.tsx` song song bản Việt. Một component, chữ từ catalog.
    Các tệp `components/en/BaoCaoEn.tsx`, `HoiEn.tsx` hiện có: gộp vào component chung rồi xoá (giữ hành vi, e2e chứng minh).
12. **URL tiếng Anh đã công bố không được gãy**: `/en`, `/en/numerology`, `/en/numerology/life-path[/n]`, `/en/tarot`,
    `/en/tarot/cards[/slug]`, `/en/privacy`, `/en/terms` giữ nguyên (đổi thì 308 một bước).
13. Commit nhỏ, thông điệp rõ (tiếng Việt như repo), không ghi tên mô hình. Push nhánh được giao.

---

## 3. Kiến trúc đã chọn (lý do ngắn — đừng mở lại nếu không có lý do mới, có lý do mới thì ghi vào tiến độ trước khi đổi)

### 3.1 Web: "một cây component, URL tiếng Anh qua rewrite, ngôn ngữ là ngữ cảnh"

Ba lựa chọn đã cân:

| Cách | Được | Mất | Chọn |
|---|---|---|---|
| A. Cây `app/en/**` riêng như hiện nay, mỗi trang viết lại | tách bạch | ~115 trang × 2, mọi sửa bản Việt phải sửa hai nơi → hai bản lệch dần | ✗ |
| B. Dời toàn bộ vào `app/[lang]/**` | chuẩn Next | đụng ~115 trang + mọi import + CMS sổ trang + 1.000 redirect; rủi ro hồi quy lớn nhất | ✗ |
| **C. Rewrite + ngữ cảnh** | một component cho hai ngôn ngữ, URL Việt không đổi, slug Anh đẹp | cần bảng slug + quy tắc link | **✓** |

Cách C cụ thể:
- **Bảng đường dẫn một nguồn** `web/lib/duong-en.json` (trang tĩnh + mẫu cụm) — cặp `vi ↔ en` cho mọi trang; trang KB động
  lấy slug Anh từ engine (mục 3.2, trường `duong_en`). Hàm `duongTheo(lang, duongVi)` / `duongVi(duongEn)` dùng ở MỌI chỗ dựng
  link nội bộ. Không được viết cứng `"/tu-vi"` trong component có chạy ở bản Anh — e2e quét link bắt lỗi này.
- **`proxy.ts`**: `/en/<slug-anh>` → `NextResponse.rewrite` sang đường dẫn Việt tương ứng, kèm header `x-ngon-ngu` (đã có) và
  `x-duong-hien-thi` (URL gốc để dựng canonical / hreflang). `/en/<slug-việt>` lạc (vd `/en/tu-vi`) → 308 về slug Anh.
  Trang Việt mở trực tiếp vẫn là tiếng Việt. Proxy vẫn giữ CSP nonce, matcher hiện có (đừng làm prefetch quay lại — SỰ CỐ-VERCEL).
- **Ngữ cảnh ngôn ngữ**: máy chủ đọc `headers().get("x-ngon-ngu")` qua một hàm duy nhất `ngonNguMayChu()`; trình duyệt dùng
  `NgonNguProvider` (đặt ở root layout) + `useNgonNgu()`. `<html lang>` theo ngôn ngữ (đã có `langHtml`).
- **Catalog chữ**: mở rộng `lib/chu/*.ts` (ND-7) thành nhiều chiều ngôn ngữ cùng khoá: `BangChu` có `vi` (nguồn) + `en`.
  Thiếu khoá `en` → **lỗi test**, không rơi về tiếng Việt trên trang Anh. Chữ dài/ngắn khác nhau → test bố cục (mục 5.4).
  Chữ trong component chưa thuộc catalog → đưa vào catalog theo cụm component (không gettext từng chuỗi lẻ không khoá).
- **Định dạng**: `lib/dinh-dang.ts` — ngày, giờ (12/24h theo biến thể), số, tiền, khoảng ngày, số thứ tự ("1st"), số nhiều
  (`Intl.PluralRules`), danh sách (`Intl.ListFormat`). Cấm ghép "ngày/tháng/năm" thủ công ở bản Anh.
- **Khung**: bản Anh dùng ĐÚNG khung đầy đủ (menu đầu trang + menu con, thanh mảng, chân trang, hộp cookie, đăng nhập, ví Sao,
  dải thông báo) với chữ catalog/CMS tiếng Anh — `KhungEn` tối giản được thay; nút đổi ngôn ngữ trỏ tới **trang tương đương**
  (không về trang chủ), giữ query an toàn (`?cach=`, `#neo`).
- **Dữ liệu engine theo ngôn ngữ**: mọi lời gọi engine từ web gửi `x-ngon-ngu` (đã có `dauNguoiGoi`) **và** `?ngon_ngu=` trên
  URL để khoá đệm fetch / `unstable_cache` tách theo ngôn ngữ (đừng tin khoá đệm có tính header). Rà mọi khoá đệm có tên.
- **localStorage**: hồ sơ, lịch sử, phiếu dùng CHUNG giữa hai ngôn ngữ (một người đổi ngôn ngữ không mất hồ sơ). Hợp nhất
  `hbt.en.profile.v1` vào hồ sơ chung (đọc cũ một lần rồi chuyển, không xoá dữ liệu người dùng khi chưa chuyển xong).

### 3.2 Engine: "dữ kiện tất định — lời theo ngôn ngữ" (đã chốt QTE-2, làm nốt)

- **Tên riêng** chỉ qua `kb/ten.py` (bổ sung khi thiếu: 28 tú, trực, thần sát, cách cục Tử vi, cách cục Bát tự, sao hạn, Bát hạn,
  hoàng lịch nghi/kỵ, 24 tiết khí, 63 tỉnh, can chi ghép, nạp âm 30 cặp, 81 tổ hợp sơn–hướng…). Test phủ: mọi tên CALC có thể
  trả đều có bản Anh.
- **Lời RULES**: mọi chuỗi người dùng thấy trong `luangiai/`, `hoidap/`, trình dựng trang `kb/trang_*.py` đi qua `L("mã", "chữ
  Việt nguyên văn", **slot)`; bản Anh viết trong `kb/data/en/loi_khuon.json`. Chữ Việt truyền vào `L` phải **giống từng ký tự**
  chuỗi cũ (golden bắt). Mã đặt theo `<module>.<chỗ>.<ý>` ổn định, không sinh từ chữ.
  - Câu ghép theo ngữ pháp Việt (thứ tự từ, "của bạn", lượng từ) → mẫu tiếng Anh viết LẠI CẢ CÂU với slot, không dịch từng mảnh.
  - Số nhiều / mạo từ / viết hoa đầu câu dùng `loi.danh_sach`, `mao_tu`, `hoa_dau` (+ thêm `so_nhieu` nếu cần).
- **KB**: bản phủ `kb/data/en/<tệp>.json` cùng khung khoá; `null` = bỏ khoá; chuỗi chưa có bản Anh → test bản Anh FAIL (không
  để lộ tiếng Việt). Mỗi tệp phủ có `_trang_thai: bien_tap` (ban biên tập / máy soạn) → `da_duyet` khi người bản xứ duyệt.
  Giữ `source_id`, `school_id`; trích nguyên văn cổ thư thì dùng bản dịch tiếng Anh **phạm vi công cộng** có ghi nguồn
  (Legge 1882 cho Kinh Dịch; Wilhelm/Baynes **không** PD — chỉ tóm ý), không tự dịch rồi gọi là "nguyên văn".
- **Hỏi đáp**: bộ hiểu câu tiếng Anh riêng cho từng mảng (ý định, mốc thời gian "next year / in March 2027 / over the next 3
  months", người thứ hai "my husband / my boss", kiểu câu "should I / when / will I") — tất định, từ khoá + mẫu, giống kiến trúc
  `hoidap/hieu_cau.py`; câu trả lời dựng từ cùng gói bằng chứng (một bộ tính). Thần số: thay bản gọn `hoi_en` bằng đầy đủ.
- **Slug Anh của trang KB**: engine sinh tất định từ tên tiếng Anh (`slug_en`, `duong_en` trong mục lục + từng trang); không trùng;
  test khoá mọi slug Anh duy nhất và ổn định (đổi slug = 308, ghi vào bảng chuyển hướng).
- **Lọc**: `cong_khai.py` (BM-1), `kiem_ai.kiem` (đã có danh mục en), `cum_cam_en` + "giọng AI" tiếng Anh, `kiem_giong_van` phải
  chạy trên đầu ra tiếng Anh của MỌI mảng.

### 3.3 Dữ liệu & CMS
- Supabase: thêm cột ngôn ngữ chỉ ở nơi máy chủ phải tự soạn chữ gửi người dùng khi họ KHÔNG đang mở trang: Web Push
  (`push_tuy_chon` / `push_dang_ky`), email nhắc (nếu có). Bài đã lưu (`luan_giai_luu`) ghi `noi_dung.ngon_ngu` trong JSON
  (không cần cột). Phiếu kiểm chứng đã có `ngon_ngu` (0034). Đơn nạp quốc tế: **không làm** trong prompt này (mục 6.1).
- Supabase Auth email (OTP / magic link): mẫu email dùng điều kiện theo `user_metadata.lang` (`{{ if eq .Data.lang "en" }}…`),
  web đặt `lang` khi gửi OTP từ trang Anh; ghi mẫu vào `docs/VIEC-CUA-ANH.md` để chủ dự án dán vào Supabase Dashboard.
- CMS Payload (QTE-1b mục 2, đã duyệt hướng): global giao diện (Menu đầu trang, Điều hướng chân trang, Chữ dùng chung, Trang chủ
  & banner, Lối đi tiếp) + `noi-dung-trang`, `mau-cum` → Payload `localization` (`vi` mặc định, `en`); Bài viết + Chuyên mục →
  mỗi ngôn ngữ một tài liệu, trường `ngon_ngu` + `ban_goc`. Web đọc `?locale=en&fallback-locale=none`; trống → chữ mặc định
  tiếng Anh trong code, **không bao giờ** rơi về chữ Việt. Kiểm định CMS (vùng cấm, BM-1, liên hệ, chữ ký thẩm định) chạy cả
  bản Anh với cụm cấm tiếng Anh. Blog `/en/blog` chỉ hiện bài `ngon_ngu = en` đã xuất bản; NotFair giữ bản Việt.
- Giao diện quản trị (`/quan-tri`, admin Payload) **giữ tiếng Việt** — người dùng nội bộ. Ghi "không làm" trong kiểm kê.

---

## 4. Quy ước nội dung tiếng Anh

### 4.1 Tên mảng + slug (đề xuất; đổi được trước giai đoạn 1, sau đó khoá)

| Việt | Tên tiếng Anh hiển thị | Slug |
|---|---|---|
| Thần số học | Numerology | `/en/numerology` (giữ) |
| Tử vi | Zi Wei Dou Shu (Purple Star Astrology) | `/en/zi-wei-dou-shu` |
| Bát tự | BaZi (Four Pillars) | `/en/bazi` |
| Phong thuỷ | Feng Shui | `/en/feng-shui` |
| Kinh Dịch | I Ching | `/en/i-ching` |
| Tarot | Tarot | `/en/tarot` (giữ) |
| Nhân tướng | Face Reading (Mian Xiang) | `/en/face-reading` |
| Hợp đôi | Compatibility | `/en/compatibility` |
| Huyền học (hub) | Chinese Metaphysics | `/en/chinese-metaphysics` |
| Hôm nay | Today | `/en/today` |
| Bản thân | My page | `/en/me` (noindex) |
| Thời gian tới | Your year ahead | `/en/year-ahead` |
| Chân dung tổng hợp | Three-lens portrait | `/en/portrait` |
| Xem ngày tốt | Auspicious dates | `/en/auspicious-dates` |
| Lịch âm / đổi lịch | Lunar calendar / Lunar–solar converter | `/en/lunar-calendar`, `/en/lunar-converter` |
| Năm 2027 | Year of the … 2027 | `/en/year/2027` |
| Sao hạn, tuổi làm nhà, xông đất, Kim lâu, Tam tai | giữ là **tập quán dân gian Việt**, đặt tên mô tả + chú thích ("first-footer for Lunar New Year — a Vietnamese custom") | `/en/vietnamese-customs/...` |
| Sao (credit) | Stars | — |
| Sinh ở nước ngoài | Born abroad | `/en/born-abroad/{country}` |

Thương hiệu: QTE-1 §5 ghi "Hieuban"; khung Anh hiện ghi "Hieu Ban Than". **Hỏi chủ dự án một lần** (mục 7), chưa có trả lời thì
giữ "Hieu Ban Than" ở chữ và `Organization.alternateName = "Hieuban"`.

### 4.2 Giọng văn
- Tiếng Anh tự nhiên, câu ngắn, ngôi "you", thì hiện tại; thuật ngữ chỉ ở "Why we say this" (tương đương "Vì sao nói vậy").
- Thuật ngữ: pinyin + chú giải lần đầu trong trang ("Zi Wei (Purple Star)"), theo `ten_en.json` / `thuat_ngu_en.json`; một khái
  niệm một tên trên toàn site (test so bảng thuật ngữ).
- Không dịch sát kiểu Việt ("your destiny palace has…" → viết lại "In your Life palace…"). Không giọng AI ("delve", "tapestry",
  "journey of self-discovery", "unlock your potential", "embark"). Không phán ("you will divorce / go bankrupt / fall ill").
- Mức: "Favourable / Balanced / Needs care" (hoặc theo biến thể en-us "Favorable"); không đỏ, không điểm số (trừ "Xem lá số 2
  người" đã có điểm tham khảo — giữ, dịch nhãn mức).
- SK-1 / CY-1 bằng tiếng Anh: "a good year to book a check-up", "not medical advice — see a doctor", "not financial advice",
  "talk to a lawyer"; triệu chứng cấp cứu → "seek emergency care now (911 / 999 / 000 / 112)". Đường dây khủng hoảng theo nước:
  988 (US, CA), Samaritans 116 123 (UK/IE), Lifeline 13 11 14 (AU), SOS 1767 (SG), Befrienders 03-7627 2929 (MY) — một nguồn KB,
  test khoá.
- Văn hoá: Tết = "Lunar New Year (Tết)"; lịch âm mặc định ở bản Anh = lịch Trung Quốc (QTE-1 §5), khung Trường phái cho đổi sang
  lịch Việt Nam, giải thích vì sao hai lịch có thể lệch một ngày/tháng.

### 4.3 Biến thể
`en` (Anh–Anh, mặc định) + `en-us` (đã có khung Ý7): chỉ chính tả / định dạng ngày / 12h. Không tách nội dung theo nước.

---

## 5. QC — thước đo bắt buộc (viết TRƯỚC khi sửa, như quy tắc "test trước hàm")

### 5.1 Golden bản Việt (giai đoạn 0, trước mọi sửa)
- Script `engine/scripts/chup_dau_ra.py`: gọi MỌI route engine (TestClient) với bộ ~40 hồ sơ cố định (nam/nữ, có/không giờ, sinh
  23:xx, tháng nhuận, miền Nam 1960–75, nước ngoài Nam bán cầu, <18 tuổi, >60 tuổi) + `ngay_xem` cố định + mọi câu trong kho hỏi
  đáp hiện có, header `x-ngon-ngu: vi` → `fixtures/golden/dau_ra_vi/*.json` (nén nếu lớn; nếu quá lớn cho git thì lưu băm sha256
  từng phản hồi + mẫu 5 % nguyên văn).
- Test `tests/test_dau_ra_vi_bat_bien.py`: sau mọi giai đoạn, so trùng 100 %. Lệch = hồi quy, sửa code chứ không sinh lại golden
  (chỉ sinh lại khi đổi có chủ đích và ghi lý do — không thuộc prompt này).
- Web: chụp HTML máy chủ (đã bỏ nonce, mã build) của ~60 trang Việt đại diện → so trước/sau.

### 5.2 Đầu ra tiếng Anh
Test engine cho MỌI route với `x-ngon-ngu: en`:
- 0 ký tự có dấu tiếng Việt (regex dải Latin Extended Additional + ăâđêôơư), trừ khoá được phép (`ten_viet`, `han`, nút đổi ngôn ngữ).
- 0 `{slot}` chưa thay, 0 "None/undefined/NaN/null", 0 khoảng trắng kép / dấu câu đôi.
- Mọi tên riêng có trong `ten_en`; mọi thuật ngữ ≥ 2 âm tiết khớp `thuat_ngu_en`.
- `ma_mau`, mức, năm, cung, số **giống hệt** bản Việt cùng đầu vào (test cặp vi ↔ en trên golden hồ sơ).
- `cum_cam_en`, giọng AI, BM-1, y tế/tài chính/pháp lý: qua `chuyen_ngu/kiem.py` + `kiem_ai.kiem` (bản en).
- Độ dễ đọc: câu trung bình ≤ 22 từ, Flesch Reading Ease ≥ 55 cho đoạn lời (hàm tự viết, không thư viện); báo cáo, không chặn
  dưới 50 mẫu.

### 5.3 Hỏi đáp tiếng Anh
- Mỗi mảng: bộ phát triển ≥ 250 câu tiếng Anh **do agent khác viết độc lập**, nhãn (mảng, ý định, mốc thời gian, người thứ hai)
  ghi TRƯỚC khi chạy engine; holdout ≥ 150 câu đóng băng, chỉ xem tổng. Viết tắt / lỗi chính tả / tiếng Anh Singapore–Malaysia
  ("can or not", "lah") có mặt.
- Mục tiêu: định tuyến ≥ 90 %, "trả lời thẳng" ≥ 80 %, an toàn 100 % (bộ khủng hoảng / từ chối / câu thường dễ chặn nhầm tiếng
  Anh ≥ 150 câu, mở rộng `tests/test_en_an_toan.py`), đúng mốc thời gian ≥ 90 %.
- Bản Việt: holdout_v2 và mọi kho cũ giữ nguyên số (Huyền học 100 % × 4, Thần số ≥ 96,59 %).

### 5.4 Web e2e (`web/e2e/en-*.spec.ts`, Playwright, `--trace off`)
- Crawler đọc `sitemap-en.xml` + mọi link nội bộ từ trang Anh: 200, `<html lang^=en>`, canonical tự trỏ, hreflang cặp hai chiều
  (trang Việt tương ứng trỏ lại), không link nội bộ ra trang Việt (trừ nút đổi ngôn ngữ / danh sách cho phép).
- Quét **chữ hiển thị** (innerText, `aria-label`, `title`, `alt`, `placeholder`, thông báo lỗi, toast, hộp thoại) không có tiếng Việt.
- Luồng trọn vẹn cho từng mảng: nhập hồ sơ (người sinh ở Mỹ, Úc, Anh, Singapore; tên không dấu, tên có dấu nháy "O'Brien", tên
  một từ) → kết quả → bài đọc → mở chương → hỏi 3 câu → chia sẻ thẻ (mở link thẻ) → lưu bài (đăng nhập) → đổi sang tiếng Việt và
  quay lại (hồ sơ còn nguyên).
- Hai cỡ: 390×844 và 1280×800; không cuộn ngang; không chữ tràn nút (đo `scrollWidth`); CLS ≤ 0,05 trang đầu.
- Ảnh OG / thẻ chia sẻ / ảnh tải về bản Anh: chữ tiếng Anh, QR trỏ URL Anh (giải mã QR trong test như QR-ANH).
- Hộp đồng ý dữ liệu (ĐY-1), cookie, đăng nhập OTP (chuỗi `e2e-that`): chữ Anh, link chính sách Anh.

### 5.5 SEO/GEO
- `kiem-tra-seo.mjs --chi-en` 0 lỗi; title ≤ 70, description ≤ 160 (đo theo tiếng Anh), một H1, JSON-LD `inLanguage: "en"`,
  breadcrumb Anh, Organization/Person tiếng Anh, `sitemap-en.xml` tách cụm như bản Việt (`sitemap-en-cum-*.xml` nếu > 1.000 URL),
  `llms.txt` mục English đủ mảng, bản `.md` tiếng Anh, `robots` không đổi chính sách bot.
- Trang KB tiếng Anh chỉ `index` khi bản phủ đã có cho trang đó VÀ "phần riêng" (đo như `kb/do_rieng.py`, trên chữ Anh) ≥ 30 %;
  còn lại `noindex, follow` + không vào sitemap — ghi số trang index/noindex theo cụm vào tiến độ.

### 5.6 Hai vòng người dùng nước ngoài (agent đóng vai, như UX-NM)
Vòng 1 sau giai đoạn 3, vòng 2 trước khi báo xong. Ba vai: (a) người Mỹ 32 tuổi, chưa từng nghe Bát tự, đến từ Google "bazi
calculator"; (b) người Singapore gốc Hoa 45 tuổi, rành Tử vi, soi thuật ngữ; (c) người Anh 24 tuổi dùng điện thoại, đến từ thẻ
chia sẻ của bạn. Mỗi agent đi hết lộ trình, chụp màn hình, ghi phát hiện theo mức Cao / Vừa / Thấp. Em làm "art director": gộp,
chọn hướng sửa, sửa hết mức Cao + Vừa, ghi phần Thấp còn lại. Thêm một agent **dịch ngược** 100 đoạn ngẫu nhiên Anh → Việt và so
nghĩa với bản Việt (phát hiện lệch nghĩa, thêm/bớt ý) — mọi lệch nghĩa phải sửa.

### 5.7 Review code
Sau mỗi giai đoạn: skill `code-review` (mức high) trên diff + một agent review độc lập không xem kết luận của em. Sửa mọi lỗi
đúng-sai trước khi sang giai đoạn sau.

### 5.8 Lệnh phải xanh trước mỗi lần push
```bash
cd engine && python -m pytest -q
cd web && npm run build && npx playwright test --trace off
cd web && node scripts/kiem-tra-seo.mjs --chi-en        # cần server build đang chạy
cd cms && npm test && npm run test:tich-hop             # khi đụng CMS
```
Job CI `engine-docker` (dựng ảnh thật) phải xanh — thêm tệp `.mjs` mới thì thêm dòng COPY (SỰ CỐ-DOCKER).

---

## 6. Giai đoạn (mỗi giai đoạn = commit + push nhánh được giao; một PR riêng nếu chủ dự án cho phép trong phiên)

| GĐ | Việc | Cổng qua |
|---|---|---|
| **0. Kiểm kê + golden** | `docs/EN-TIEN-DO.md` (bảng kiểm kê mục 1.3, quyết định, rủi ro); golden bản Việt engine + web (5.1); khung test 5.2 chạy được (đang đỏ cho route chưa làm — đánh dấu xfail theo danh sách, xoá xfail khi xong). | golden ổn định 2 lần chạy liên tiếp |
| **1. Nền web** | Kiến trúc 3.1: `duong-en.json` + `duongTheo`, rewrite trong proxy, `ngonNguMayChu` / `NgonNguProvider`, catalog nhiều ngôn ngữ, `lib/dinh-dang.ts`, khung đầy đủ tiếng Anh, nút đổi ngôn ngữ theo trang tương đương, khoá đệm theo ngôn ngữ, hợp nhất hồ sơ localStorage; chuyển 7 URL `/en` hiện có sang hệ mới (cùng URL), gộp `BaoCaoEn`/`HoiEn`. | e2e `en.spec.ts` cũ xanh; trang Việt chụp HTML không đổi |
| **2. Nền engine** | Bổ sung `ten_en` cho mọi tên CALC; `L()` cho khuôn dùng chung (`doi_song_khuon`, `doi_song_chung`, `nhat_quan`, `giao_thoa`, `hoan_canh`, `chu_y_nam`, `suc_khoe_nam`, `luu_y_mang`, `truc_quan`, `mo_dau`, an toàn); `slug_en`/`duong_en` cho mục lục KB; test 5.2 cho khuôn. | golden vi 100 %; test khuôn en sạch |
| **3. Bát tự** | lập lá số (form, khung Trường phái, đại vận, thần sát, đối chiếu cách), bài đọc đời sống 12 chương + Vận hạn, hỏi đáp en, thẻ chia sẻ, cụm kiến thức (thập thần, nhật chủ, mệnh theo năm). | 5.2 + 5.3 + 5.4 cho mảng |
| **4. Tử vi** | lá số SVG (nhãn cung/sao Anh, hai giao diện), Trường phái, phi hoá, nhịp 3 tháng, Xem lá số 2 người, Vận hạn + sao lưu, định giờ sinh, người thân, hỏi đáp, cụm kiến thức (sao, cung, sao ở cung, tứ hoá, lá số mẫu, Cốt Tuỷ Phú: nguyên văn Hán + bản Anh của ban biên tập, ghi rõ). | như trên |
| **5. Phong thuỷ** | đo hướng (la bàn sống, bản đồ, ảnh vệ tinh), Nhà của bạn, khảo sát + mặt bằng, so hai căn, phi tinh năm/tháng, hướng hợp tuổi (cung phi), hướng xấu năm, dấu hiệu trong nhà, việc tuần, đọc ảnh nhà (giữ công tắc + đồng ý bản Anh), hỏi đáp. | như trên |
| **6. Kinh Dịch** | gieo (xu, lắc, tự gieo, Mai Hoa số/phương), Lục hào, trả lời theo việc, quẻ riêng, lịch sử, thẻ, 64 quẻ (Legge 1882 làm nguyên văn Anh PD + "In plain words"), hỏi đáp. | như trên |
| **7. Thần số + Tarot đầy đủ** | Thần số: Chaldea, hợp đôi, Bản đồ con số, nỗi đau, biểu đồ + mũi tên, nhịp, ~200 trang kiến thức, hỏi đáp đầy đủ (thay `hoi_en`). Tarot: thẻ chia sẻ, lịch sử, AI chương trả lời bản Anh (cùng `kiem_ai`). | như trên |
| **8. Nhịp ngày & lịch** | Hôm nay (ngày cá nhân, quẻ đầu ngày, lá bài đầu ngày, giờ hoàng đạo, chuỗi, tổng kết tháng, nhắc việc, hôm qua), Thời gian tới, Chân dung tổng hợp, Xem ngày tốt (+ theo việc, chọn ngày cả nhà), lịch âm + đổi lịch, Năm {n} + theo tuổi + sinh con + cưới hỏi, tập quán Việt (sao hạn, làm nhà, xông đất, hướng xấu năm), Sinh ở nước ngoài (bản Anh), Nhân tướng. | như trên |
| **9. Tài khoản & kinh tế** | đăng nhập + email OTP (mẫu điều kiện), hồ sơ, Dữ liệu của tôi, bài đã lưu, ký ức, nhiệm vụ / huy hiệu / Sao (hiển thị Anh; nạp xem mục 6.1), Web Push theo ngôn ngữ (migration), thẻ chia sẻ mọi loại + `/og/*?lang=en`, trang nhận thẻ `/en/card/...`. | chuỗi `e2e-that` bản Anh xanh |
| **10. CMS + Blog + pháp lý + hub** | Payload localization (migration up/down), `/en/blog` + chuyên mục, trang chủ Anh, hub Chinese Metaphysics, About, Contact, Privacy / Terms / Disclaimer **bản đầy đủ** (không còn tóm tắt; nhãn "chờ luật sư", điều khoản ngôn ngữ ràng buộc theo quyết định chủ dự án), tác giả / EEAT tiếng Anh (chỉ ghi điều chuyên gia đã công bố). | `npm run test:tich-hop` + e2e CMS giả |
| **11. QC tổng** | 5.5 SEO/GEO, 5.6 hai vòng người dùng + dịch ngược, 5.7 review, hiệu năng (TTFB trang Anh không tệ hơn bản Việt > 10 %), cập nhật `CLAUDE.md` (một dòng **EN-ALL** trong bảng quyết định), `docs/VIEC-CUA-ANH.md` (deploy engine trước web, migration, Search Console, mẫu email, người bản xứ duyệt), `llms.txt`. | "định nghĩa xong" mục 0 đạt đủ 6 điểm |

Làm tuần tự; giai đoạn nào kẹt quyết định thì làm giai đoạn sau không phụ thuộc, ghi rõ trong tiến độ. Phiên bị ngắt: đọc
`docs/EN-TIEN-DO.md` + `git log` rồi làm tiếp đúng chỗ.

### 6.1 Những thứ cố ý KHÔNG mở ở bản Anh trong prompt này — mặc định an toàn
| Tính năng | Mặc định ở bản Anh | Vì sao |
|---|---|---|
| Nạp Sao bằng tiền (payOS VND), Hội viên năm, Hỏi chuyên gia (trả lời tiếng Việt) | ẩn; mọi chương "đang miễn phí" theo công tắc riêng `luan_giai.thu_sao.en` (mặc định tắt) | chưa có cổng thanh toán quốc tế + luật sư (QTE-1 §6–7) |
| Gửi ảnh gương mặt cho AI (ANH-1) | tắt ở bản Anh | dữ liệu sinh trắc, QTE-1 §7 |
| Đo điểm mốc ảnh trên máy (ANH-2/3/4), quét 3 góc | **hỏi chủ dự án** (mục 7); chưa trả lời → tắt, chỉ khảo sát tự soi gương | ảnh không rời máy nhưng vẫn là xử lý ảnh mặt |
| Ủng hộ crypto / ngân hàng VN | ẩn | không hợp người nước ngoài |
| `/quan-tri`, admin CMS | tiếng Việt | nội bộ |
Mọi mục ẩn: không để link chết — thay bằng câu ngắn "Available in the Vietnamese edition" + link sang trang Việt tương ứng.

---

## 7. Cần chủ dự án quyết (hỏi MỘT lần ở đầu phiên bằng AskUserQuestion, tối đa 4 câu; chưa trả lời thì làm theo mặc định)

1. Tên thương hiệu ở bản Anh: "Hieu Ban Than" (mặc định) hay "Hieuban".
2. Bảng slug mục 4.1 — đồng ý hay sửa (sau giai đoạn 1 sẽ khoá).
3. Đo điểm mốc ảnh trên máy ở bản Anh: tắt (mặc định) hay bật.
4. Điều khoản bản Anh: bản tiếng Anh có giá trị ràng buộc ngang bản Việt, hay chỉ bản Việt ràng buộc (mặc định — giữ như hiện nay).

Các việc khác (thứ tự mảng, giọng văn, kiến trúc) em tự quyết theo prompt này; có lý do mới thì ghi vào tiến độ rồi làm.

---

## 8. Cách làm việc

- Dùng agent song song cho việc độc lập (viết bộ câu hỏi đáp tiếng Anh, chuyển ngữ từng tệp KB, vai người dùng, review), brief rõ
  mục tiêu + tệp + tiêu chí; không giao agent việc cần quyết kiến trúc. Agent viết bộ câu test **không** được thấy luật engine.
- Chuyển ngữ KB: chạy `scripts/chuyen_ngu.py` khi có `OPENROUTER_API_KEY`; không có thì em tự viết như ban biên tập, cùng
  `_trang_thai: bien_tap`, và vẫn chạy `chuyen_ngu/kiem.py` trên từng chuỗi. Đi theo cụm (một tệp / một mảng), không dịch cả kho
  một lượt rồi mới kiểm.
- Mỗi chuỗi tiếng Anh viết từ NGHĨA, đối chiếu nguồn gốc (KB Việt + nguồn cổ thư), không thêm ý, không bớt ý ranh giới.
- Không để chữ tạm "TODO", "Lorem", "[EN]" lên production; thiếu bản Anh = test đỏ.
- Báo cáo cuối mỗi giai đoạn (trong chat, ngắn): làm gì, số đo trước/sau (5.2–5.5), còn mở gì, việc của chủ dự án. Kết quả không
  đạt thì nói thẳng kèm đầu ra test, không làm tròn.
- Liên hệ vòng tăng trưởng (CLAUDE.md): việc này đẩy khâu **THU HÚT** thị trường tiếng Anh (đo Search Console `/en/*` theo nước,
  `landing_viewed{ngon_ngu}` → `reading_started` → `reading_completed`), rồi **QUAY LẠI** (Hôm nay, nhắc việc), **MỜI** (thẻ
  chia sẻ tiếng Anh, `share_created{ngon_ngu}` → `referral_signup`); **NẠP** chờ cổng quốc tế. Mọi sự kiện PostHog mang
  `ngon_ngu`.
