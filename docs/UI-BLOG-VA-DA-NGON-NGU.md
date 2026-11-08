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

## 4. Kế hoạch đa ngôn ngữ (I18N) — CHỜ CHỦ DỰ ÁN CHỐT (mục 5)

### Nguyên tắc
1. **URL thư mục con** `hieuban.com/en/…`; tiếng Việt **giữ nguyên URL hiện tại** (không thêm `/vi`) để không đổi ~1.000 URL đang index.
2. Mỗi trang dịch có `hreflang` vi-VN / en / `x-default`, sitemap theo ngôn ngữ, `inLanguage`, `og:locale`, `llms.txt` theo ngôn ngữ.
3. **Không tự chuyển ngôn ngữ theo IP** (bot Google ở Mỹ sẽ không thấy bản Việt); chỉ gợi ý một dải "Read in English".
4. Trang **chưa dịch xong thì không index** bản ngôn ngữ đó (không để trang nửa Việt nửa Anh).
5. CALC không đổi (con số không có ngôn ngữ); chỉ lớp KB/RULES lời và NARRATIVE đổi theo ngôn ngữ.
6. Dịch máy chỉ tạo **nháp**, người duyệt qua PR — như quy tắc KB hiện nay. Không dịch máy chữ người dùng lúc chạy.

### Công cụ — so sánh và đề xuất
| Lớp | Lựa chọn | Đánh giá | Đề xuất |
|---|---|---|---|
| Front end (chữ giao diện) | **next-intl** (MIT) · Paraglide JS (inlang, MIT, biên dịch sẵn, gói nhỏ nhất) · react-i18next · Lingui | next-intl hợp App Router + middleware nhất; Paraglide nhẹ nhất nhưng đổi cách viết mọi chuỗi | **Không thêm thư viện ở GĐ1**: site đã có **bảng chữ có khoá** (`lib/chu/*.ts`, ND-7) = danh mục thông điệp sẵn → thêm chiều ngôn ngữ cho `taoChu`/`useChu`; ngày/số/số nhiều dùng `Intl` có sẵn. Chỉ xin duyệt next-intl nếu cần ICU phức tạp. |
| Định tuyến | thư mục `app/[lang]` · **proxy rewrite** | Dời mọi route vào `[lang]` = refactor ~300 tệp | **`proxy.ts` rewrite** `/en/x` → `/x` + header `x-ngon-ngu: en` (layout đã render động vì nonce CSP); `Lien` tự gắn tiền tố |
| CMS | **Payload localization có sẵn** (`localization: { locales, defaultLocale: 'vi', fallback: true }`, trường `localized: true`) | Không thêm gói; cần migration Payload (bảng `_locales`) | Bật cho Bài viết, Chuyên mục, Trang website, Menu, Chữ dùng chung |
| Engine / KB | tệp phủ `kb/data/<tên>.en.json` cùng khoá + `trang_thai` | Git vẫn là nguồn; thiếu bản dịch → rơi về vi + cờ | Engine nhận `ngon_ngu`; KB `tu_dien.json` thành **bảng thuật ngữ** cố định (Tử vi → Zi Wei Dou Shu, Bát tự → BaZi, Kinh Dịch → I Ching, Thần số → Numerology, Phong thuỷ → Feng Shui, Nhân tướng → Face reading) |
| Dịch máy | LLM qua OpenRouter (đã duyệt nhà cung cấp) · DeepL API (thêm nhà cung cấp + chi phí) · Google Translate | LLM theo được bảng thuật ngữ + giọng "không phán", DeepL đều tay hơn với văn thường | Kịch bản `scripts/dich_kb.py`: dịch theo lô → kiểm tự động (giữ biến `{x}`, đúng thuật ngữ, `cum_cam` từng ngôn ngữ, độ dài) → PR nháp |
| Lời AI hỏi đáp | lời nhắc theo ngôn ngữ | bộ kiểm `kiem_ai` cần danh sách cấm theo ngôn ngữ | GĐ3 |

### Lộ trình
- **I18N-0** (nền, không đổi gì người dùng thấy): cấu hình ngôn ngữ một nguồn, `taoChu(lang)`, `Intl` cho ngày/số, `inLanguage`/hreflang lấy từ cấu hình.
- **I18N-1**: proxy rewrite `/en`, `Lien` gắn tiền tố, nút chọn ngôn ngữ, Payload localization (migration), bản Anh cho khung trang + Blog.
- **I18N-2**: engine `ngon_ngu` + KB tiếng Anh cho Thần số + Tarot (hai môn quen với thị trường quốc tế nhất) + trang kiến thức tương ứng.
- **I18N-3**: hỏi đáp/luận giải tiếng Anh, an toàn (khủng hoảng, từ chối) bằng tiếng Anh, chính sách riêng tư/điều khoản bản Anh (cần luật sư).
- **I18N-4**: Tử vi, Bát tự, Kinh Dịch, Phong thuỷ; thanh toán quốc tế (payOS chỉ VND).

## 5. Câu hỏi cho chủ dự án
1. **Ngôn ngữ và thị trường đầu tiên**: tiếng Anh cho người Việt ở nước ngoài + người nước ngoài quan tâm phương Đông? Hay tiếng Trung phồn thể / Hàn / Nhật?
2. **URL**: đồng ý `hieuban.com/en/` (khuyên dùng) hay tên miền riêng?
3. **Môn mở trước**: Thần số + Tarot (đề xuất) hay cả bảy môn?
4. **Dịch máy**: dùng OpenRouter có sẵn (không thêm nhà cung cấp) hay thêm DeepL? Ai duyệt bản tiếng Anh?
5. Duyệt **migration Payload localization** (I18N-1) và — nếu cần — dependency `next-intl`.
