# UI-BLOG + kế hoạch đa ngôn ngữ (I18N) — 2026-11-08

Chủ dự án giao: rà UI Blog (đã nhóm theo chuyên mục Huyền học chưa), đối chiếu CMS, audit SEO/GEO, đưa 3 cách làm UI,
chọn một và làm; lên kế hoạch đa ngôn ngữ (front end · CMS · backend) để mở thị trường quốc tế.

Khâu vòng tăng trưởng: **THU HÚT** (cụm bài theo môn cho Google/AI, người đọc tìm đúng môn) → **công cụ** (mỗi chuyên đề
dẫn sang công cụ của đúng môn). Đo: hiển thị/nhấp Search Console `/blog/mang/*`, `$pageview` từ `/blog` sang `/blog/mang/*`
và từ chuyên đề sang công cụ (`cross_cta_*` sẵn có ở trang bài).

## 1. Audit hiện trạng

### UI `/blog` (ảnh chủ dự án gửi)
| # | Vấn đề | Tác động |
|---|---|---|
| U1 | Bìa ban biên tập vẽ (BLOG-6/7) **in sẵn tiêu đề + mô tả + QR**; thẻ nổi bật đặt bìa cạnh khối chữ → **tiêu đề hiện hai lần** cạnh nhau | Rối mắt, tốn nửa màn hình đầu, ảnh lớn làm chậm LCP |
| U2 | Bài **không nhóm theo môn Huyền học** — chỉ một dòng thời gian; chip chuyên mục chỉ hiện khi CMS có chuyên mục (hiện chưa có → không có lớp lọc nào) | Người đọc muốn "chỉ bài Tử vi" không có đường; menu Blog không có menu con |
| U3 | Lưới 2 cột, thẻ nào cũng ảnh to → mỗi màn hình chỉ 2 bài | Quét chậm, nhất là điện thoại |
| U4 | Nhãn môn không có trên thẻ (chỉ có trong ảnh) | Không phân biệt môn khi ảnh là ảnh thật |

### CMS
- Bài có trường **`mang`** (ban biên tập chọn) — đủ để nhóm; bài thiếu `mang` web tự đoán bằng luật từ khoá (`lib/blog-mang.ts`).
- **Chuyên mục chưa tạo** → nên dùng chuyên mục cho trục KHÁC môn (Hướng dẫn, Năm 2027, Mùa cưới…), không lặp môn.
- Bìa vẽ có chữ hợp để **chia sẻ** (ảnh rời trang vẫn đọc được, có QR) nhưng **không hợp làm thẻ danh sách** → web nay tự nhận
  ảnh `nguon_anh` "Ban biên tập … vẽ minh hoạ" và thay bằng hình môn (không cần sửa CMS).
- Đề xuất (chưa làm, cần duyệt): thêm trường tuỳ chọn "Ảnh thẻ (không chữ)" nếu ban biên tập muốn ảnh riêng cho danh sách.

### SEO/GEO
| # | Phát hiện | Đã xử lý |
|---|---|---|
| S1 | Không có trang cụm theo môn trong blog (chỉ chuyên mục CMS — đang trống) | ✅ `/blog/mang/{slug}` CollectionPage + ItemList + breadcrumb, sitemap; mảng không bài → noindex |
| S2 | Bài chỉ nối với nhau qua dòng thời gian | ✅ chuyên đề nối bài cùng môn + công cụ + "Kiến thức {môn}" (silo QH-URL) |
| S3 | Heading `/blog`: mọi thẻ là H2 ngang hàng, không có mục nhóm | ✅ H1 → thẻ H2 → "Đọc theo chủ đề" H2 → môn H3 |
| S4 | Thẻ đổi ảnh 1600 px → hình SVG nội dòng | ✅ bớt tải ảnh, LCP là chữ |
| S5 | `inLanguage: vi-VN` cứng, chưa có hreflang | Để I18N (mục 4) — một ngôn ngữ thì chưa cần |

## 2. Ba cách làm UI

| | A. Thư viện theo môn (chọn) | B. Tạp chí biên tập | C. Danh sách gọn + bộ lọc |
|---|---|---|---|
| Ý | Bài mới nhất nổi bật → lưới "Đọc theo chủ đề" mỗi môn một ô → trang chuyên đề thật | Bài trang bìa lớn, cột "đọc nhiều", bản tin email | Danh sách chữ dày, lọc/tìm bằng JS |
| Ưu | Đúng cấu trúc Huyền học, URL thật cho SEO/GEO, môn ít bài vẫn kín lưới, nối sang công cụ | Đẹp, cảm giác báo | Quét nhanh nhất |
| Nhược | Cần môn đúng (đã có `mang` + luật dự phòng) | Cần số "đọc nhiều" + email (chưa có), ít bài thì trống | Lọc bằng JS bot không đi được, mất cảm giác thương hiệu |

**Chọn A** — vì vừa giải U1–U4 vừa tạo cụm SEO, không cần dữ liệu/dependency mới.

## 3. Đã làm (UI-BLOG)
- `lib/blog-mang.ts`: `SLUG_MANG_BLOG`, `duongMangBlog`, `mangTuSlug`, `nhomTheoMang` (một nguồn với `mangCuaBai`).
- `components/blog/HinhMang.tsx`: hình SVG theo môn (vòng 9 số, 12 cung, tứ trụ, 6 hào, la bàn, hai vòng, lịch, mắt), nền giấy.
- `LuoiBai.tsx`: thẻ dùng ảnh thật khi ảnh không in chữ, ngược lại hình môn; nhãn môn trên thẻ; thẻ nổi bật chữ trái – hình phải;
  lưới 3 cột ≥ lg; `ThanhMangBlog` (link thật + số bài); `LuoiChuDe`; `DanhSachGon` (bài còn lại, chỉ chữ).
- `/blog`: 7 bài mới nhất → Đọc theo chủ đề → các bài khác; trang ≥ 2 giữ lưới cũ.
- `/blog/mang/{than-so-hoc|tu-vi|bat-tu|kinh-dich|phong-thuy|hop-doi|xem-ngay-tot|hieu-ban-than}` + sitemap.
- E2E `e2e-cms/blog-mang.spec.ts`.

## 4. Đa ngôn ngữ — đối chiếu kế hoạch QTE-1 (`docs/KE-HOACH-QUOC-TE.md`, PR #230)

QTE-1 (chốt qua `/grill-me` 2026-11-07) là kế hoạch gốc; mục này **không thay** nó, chỉ (a) đối chiếu phần UI-BLOG làm hôm nay và
(b) chốt ba chỗ QTE-1 còn để ngỏ: máy chuyển ngữ, cách CMS lưu bản dịch, cách blog tiếng Việt có bản tiếng Anh.

### 4.1 Đối chiếu
| QTE-1 đã chốt | UI-BLOG / đề xuất hôm nay | Khớp? |
|---|---|---|
| Thư mục con `/en/`, `/zh-hant/`, hreflang | Giữ. Tiếng Việt không thêm `/vi` | ✅ |
| Tự làm đa ngôn ngữ, không `next-intl`; bảng chữ `lib/chu` có bản `en` | Giữ; ngày/số dùng `Intl` | ✅ |
| Tiếng Anh: Bát tự → Tử vi → Phong thuỷ → Kinh Dịch; **không** Tarot/Thần số/hỏi đáp | Giữ (bản nháp đầu của em đề xuất Thần số + Tarot trước — **bỏ**, theo QTE-1) | ✅ |
| KB dịch máy vào `*_en.json`, nháp, người bản xứ duyệt; LLM không dịch lúc trả lời | Giữ; thêm máy chuyển ngữ + bộ kiểm (4.2) | ✅ bổ sung |
| CMS — chưa chốt | Hướng lai (4.3) | ➕ mới |
| Blog tiếng Anh — chưa chốt | Nút "Tạo bản tiếng Anh" tạo NHÁP nối bài gốc (4.4) | ➕ mới |
| `/blog/mang/{slug}` (hôm nay) | Bản Anh dùng slug Anh: `/en/blog/bazi`, `/en/blog/zi-wei`, `/en/blog/feng-shui`, `/en/blog/i-ching` — `SLUG_MANG_BLOG` thêm chiều ngôn ngữ khi tới tuần 3–4 | ✅ chuẩn bị sẵn |
| Mốc từ khoá tuần 2 (≥ 20.000 lượt/tháng) | Thêm đề xuất: cụm "Chinese zodiac 2027 / Year of the Fire Goat" (Tết 6/2/2027) là mùa tìm kiếm lớn, hợp với Bát tự — đưa vào lượt kiểm từ khoá tuần 2 | ➕ gợi ý |

### 4.2 Máy chuyển ngữ → **LLM chuyển ngữ có bảng thuật ngữ + máy tự kiểm + người bản xứ duyệt**
| Lựa chọn | Đánh giá |
|---|---|
| Google Translation (NMT) | Đúng nghĩa nhưng văn "dịch", thuật ngữ hay lệch |
| DeepL API (có tiếng Việt từ 06/2025) | Văn trôi; thêm nhà cung cấp + phí; dùng làm bản so sánh khi cần |
| **LLM mạnh qua OpenRouter** (nhà cung cấp đã duyệt) | **Chọn**: viết lại cho người bản xứ (transcreation), theo được bảng thuật ngữ + giọng "không phán"; chỉ chạy lúc soạn, không chạy khi người dùng đọc |
| Dịch lúc chạy | Không làm (không kiểm được, tốn mỗi lượt, Google không index tốt) |

Quy trình một kịch bản (`engine/scripts/dich_kb.py`, dùng chung KB, chữ giao diện, bài blog):
1. Bảng thuật ngữ cố định `thuat_ngu_en.json` dựng từ `tu_dien.json`: Bát tự → BaZi (Four Pillars), nhật chủ → Day Master, dụng thần →
   Useful God, Tử vi → Zi Wei Dou Shu, cung Mệnh → Life Palace, Kinh Dịch → I Ching, quẻ → hexagram, Phong thuỷ → Feng Shui, cung phi → Kua number, phi tinh → Flying Stars…
2. Quy tắc giọng tiếng Anh + `banned_phrases` (doom, curse, guaranteed, accurate, you will die…) — tương đương `cum_cam`, khớp mục pháp lý QTE-1.
3. LLM chuyển ngữ theo lô JSON (khoá giữ nguyên) → LLM thứ hai đọc như người bản xứ.
4. Máy tự kiểm, chặn: biến `{x}` + số giữ nguyên, đúng thuật ngữ, cụm cấm, độ dài, sức khoẻ có "not medical advice".
5. PR nháp → người bản xứ duyệt (đúng ngân sách 300–500 USD/tháng của QTE-1).

Skill dùng khi làm: `anthropic-skills:internationalization-engineer`, `anthropic-skills:language-translator`, `anthropic-skills:keyword-research`,
`marketing:seo-audit`, nội bộ `huyenhoc-kb`. Tham khảo Lingo.dev (CLI i18n dùng LLM, có hướng dẫn Payload) — chưa cần thêm vào repo.

### 4.3 CMS lưu bản dịch → **hướng lai**
Migration đa ngôn ngữ để CMS biết "bài này có bản tiếng Anh nào, URL nào, đã duyệt chưa" → web hiện đúng ngôn ngữ, gắn hreflang nối hai bản
(Google hiểu là một bài cho hai thị trường, không coi là trùng lặp), ban biên tập sửa từng bản riêng.

| | A. Bản địa hoá theo trường (Payload `localization`) | B. Mỗi ngôn ngữ một bài, nối quan hệ | C. CMS riêng |
|---|---|---|---|
| Migration | Lớn (bảng `_locales`, mọi hook/kiểm định phải biết ngôn ngữ; trạng thái xuất bản theo ngôn ngữ ở Payload v3 còn là cờ thử nghiệm `localizeStatus`) | Nhỏ: thêm `ngon_ngu` + `ban_goc` | Không, nhưng gấp đôi vận hành |
| Hợp với | Nội dung cùng khung: Menu, Chân trang, Chữ dùng chung, Trang website | **Bài chuyển ngữ**: bản Anh khác từ khoá, slug, ví dụ, xuất bản độc lập | — |

**Chọn: B cho Bài viết + Chuyên mục, A cho các global giao diện.** Cần chủ dự án duyệt migration Payload (up/down) khi tới tuần 3–4.

### 4.4 Blog tiếng Việt → tiếng Anh
Được, theo cách an toàn: nút **"Tạo bản tiếng Anh"** trong trình viết bài → quy trình 4.2 → bài `en` **NHÁP** nối bài gốc, slug theo
từ khoá tiếng Anh, ảnh dùng chung (ảnh có chữ vẽ lại bản Anh) → kiểm định tiếng Anh → người duyệt xuất bản. Cron có thể tạo nháp cho
bài mới, **không bao giờ tự xuất bản** (như BLOG-9d). Chỉ chuyển ngữ bài thuộc 4 mảng QTE-1 và có nhu cầu tìm kiếm tiếng Anh.
Engine: phép tính không cần dịch; phần lời (KB, RULES, an toàn) đi qua `*_en.json` + tham số `ngon_ngu` như QTE-1.

## 5. Còn chờ chủ dự án
1. Merge PR #230 (QTE-1) trước, rồi PR này (đã bỏ tệp trùng tên).
2. Duyệt hướng 4.2 (LLM qua OpenRouter) và 4.3 (lai B + A, migration Payload ở tuần 3–4).
3. Có thêm "Chinese zodiac 2027" vào lượt kiểm từ khoá tuần 2 không.
