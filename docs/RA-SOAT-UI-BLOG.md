# Rà soát UI đọc bài blog — BLOG-4 (2026-10-24)

Chủ dự án giao: (1) sửa đồng bộ bài NotFair vào CMS để sửa chữ/ảnh như bài thường; (2) làm lại mục lục bài (tham khảo cách
đọc của 200lab.io — video chủ dự án gửi); (3) chân bài có CTA liên kết dịch vụ, **đổi theo chủ đề bài**. Khâu vòng tăng
trưởng: **THU HÚT → công cụ** (người đọc blog từ Google thành người dùng công cụ), đo `cross_cta_viewed` / `cross_cta_clicked`
với `tu = blog` (den = mảng), `reading_completed` chưa đo ở blog (ý tưởng dưới).

## 1. Sự cố: không sửa được bài NotFair trong CMS

- Nguyên nhân: nút "Nhập vào CMS" (BLOG-3) cần `NOTFAIR_SEO_API_KEY` ở **dự án CMS** trên Vercel — chưa đặt → bảng trống
  (ảnh chủ dự án gửi: "CMS chưa có khoá NOTFAIR_SEO_API_KEY").
- Sửa (BLOG-3b): CMS **không cần khoá riêng nữa**. Web đã có khoá (dựng `/blog`) → thêm route máy chủ
  `GET /api/cms/notfair[?slug=]` trả đúng dạng API NotFair (`{posts}` / `{post}`), chỉ nhận khi header `x-cms-bi-mat` khớp
  `CMS_WEBHOOK_SECRET` (bí mật CMS đã có để báo web xoá cache). `cms/src/lib/notfair-nguon.ts`: có `NOTFAIR_SEO_API_KEY` →
  gọi thẳng NotFair; không có nhưng có `CMS_WEBHOOK_SECRET` + `WEB_URL` → đọc qua web. Khoá NotFair không rời máy chủ web.
- Thêm nút **"Nhập tất cả N bài chưa có"** (tuần tự, có hỏi lại) — một lần đồng bộ hết bài NotFair thành nháp; bảng ghi rõ
  đang đọc qua web. Quy trình sửa không đổi: Nhập → nháp cùng slug → sửa chữ, ảnh trong Lexical → Xuất bản → web hiện bản CMS.

## 2. Những gì học từ cách đọc của 200lab (video) và quyết định

| 200lab | Làm ở Hiểu Bản Thân | Ghi chú |
|---|---|---|
| Cột phải dính: thẻ "CONTEXT 48 %" + tiêu đề bài | Thẻ "Đang đọc · x %" + thanh tiến độ + tiêu đề | % tính theo vị trí thân bài (0 % khi đầu bài chạm mốc, 100 % khi cuối bài vào màn hình) |
| "MỤC LỤC BÀI VIẾT", mục đang đọc đổi màu, vạch trái | Mục đang đọc vàng (`gold`), vạch vàng **trượt** theo mục (`transition top/height`), H3 thụt | scroll-spy: mục cuối cùng có `top ≤ 112 px`; rAF mỗi khung hình |
| URL tự đổi `#neo` khi cuộn | Có — `history.replaceState`, chỉ sau khi người đọc đã cuộn | Chép link = trỏ đúng đoạn |
| Dải vạch nhỏ, mỗi mục một vạch, đã đọc sáng | Có | Nhìn một cái biết còn bao nhiêu phần |
| "J / K to jump" | Có (J mục sau, K mục trước; bỏ qua khi gõ ô nhập) | Gợi ý chỉ hiện ≥ xl |
| Thẻ sản phẩm bên lề (skill ZIP 19 000 đ) | Thẻ **CtaBen**: "Xem {mảng} của bạn" theo mảng bài | Luôn trong tầm mắt khi đọc |
| Chữ thân bài ~18 px, dòng 1,7–1,8, cột ~45 rem | 17 px điện thoại · 18 px ≥ 1024 px, dòng 1,8, cột 48 rem | Serif tiêu đề giữ tông "Đêm sao"; thêm vạch vàng ngắn trên mỗi H2 |
| Điện thoại: thanh mục lục DÍNH dưới thanh đầu trang (tên mục · dải vạch · % · mở) | **BLOG-4b (2026-10-24):** thanh 48 px dính ở `top-16` (dưới thanh đầu trang 64 px), tên mục đang đọc trượt nhẹ khi đổi, dải vạch mỗi mục (> 16 mục → một thanh liền; < 360 px ẩn), % vàng, vạch tiến độ sát mép dưới; chạm → bảng thả xuống (≤ 60vh, số thứ tự mục H2, mục đang đọc nổi bật, "còn ~N phút", "Lên đầu bài"), Esc / chạm ngoài để đóng; URL đổi `#neo` khi cuộn (như máy tính); chọn mục cuộn chừa 124 px, mốc "đang đọc" 150 px; tiêu đề chừa `scroll-margin-top: 8rem` khi mở link #neo | Một thanh thay hộp gập + thanh 2 px cũ; e2e `blog-doc` kiểm dính 64 px, tên + %, #neo, bảng, nhảy mục không bị che, không lỗi hydration |

Không chép: mục lục NotFair chèn sẵn trong thân bài (`nav.nf-toc`) bị bỏ khi lọc — không hiện hai mục lục. Giữ: dòng
`nf-attribution` (bên trao đổi yêu cầu, BM-1 lệch có chủ ý).

Tệp: `web/components/blog/MucLucBai.tsx` (client), `KhungBaiDoc.tsx` (bố cục 2 cột ≥ lg, 1 cột khi < 2 mục H2),
`web/lib/muc-luc.ts` (gắn id H2/H3, dùng chung CMS + NotFair), `app/blog/notfair-article.module.css`.

## 3. Chân bài đổi theo mảng

- `web/lib/blog-mang.ts`: mảng của bài = `mang` ban biên tập chọn trong CMS (trừ "chung"), không có → **luật từ khoá tất
  định** trên tiêu đề (×2), slug, thẻ, mô tả (vd "astrology/chiêm tinh" → Tử vi; "numerology" → Thần số); không khớp →
  "chung" (cửa chính Thần số "Bạn là số mấy?"). Không AI, không mạng.
- `CtaBlog`: thẻ lớn một mảng (tiêu đề hỏi ngược "Bài này nói về phong thuỷ. Nhà bạn thì sao?", 3 điều sẽ nhận, nút) —
  **có hồ sơ trên máy** → gọi `/api/goi-y-cheo` (CTA-1) lấy "luận giải nhỏ" của đúng mảng đó (engine ghép từ con số đã tính),
  hiện câu riêng + câu hỏi mở + nút của engine; chưa có → câu chung "Miễn phí · 30 giây". Dưới: hàng "Kiến thức {mảng}" (đường
  dẫn cụm từ `lib/kien-thuc` — một nguồn QH-URL) + `CtaCuoiBai` (KC-5: gợi mở chéo · luận giải/Sao · rủ bạn · ủng hộ/nạp Sao).
  Bỏ `UngHoNho` riêng (đã nằm trong `CtaCuoiBai`).
- Đo: `cross_cta_viewed{tu: blog, den, ca_nhan}` khi thẻ vào khung nhìn 30 %; `cross_cta_clicked{tu: blog | blog_kien_thuc |
  blog_ben, den, ca_nhan}`. Xem ở `/quan-tri/tang-truong` (khung CTA-1 lọc `tu = blog`).

## 4. Ý tưởng tiếp theo

Đã làm (chủ dự án: "em tiếp ý tưởng của em đi", 2026-10-24):

1. **`reading_completed{mo_dun: blog, mang}`** — `MocDocXong` cuối thân bài (cả bài NotFair lẫn bài CMS; bản nháp không đo)
   → `/quan-tri/tang-truong` so được tỉ lệ đọc hết → bấm CTA theo mảng bài.
2. **"Đọc tiếp" cho bài NotFair** — `baiCungMang()`: bài cùng mảng trước, rồi bài mới nhất, bỏ chính nó (bài CMS vẫn dùng
   liên quan theo nghĩa của CMS-4).
4. **"còn ~N phút"** cạnh % ở thẻ Đang đọc (từ `reading_time_minutes` / `phutDoc`, giảm theo % đã đọc).

Chờ chủ dự án chọn:

3. **Nổi bật câu trích** (bôi đen → "Chia sẻ câu này" thành thẻ ảnh có QR, như TCS-1) — khâu MỜI.
5. Ảnh bìa NotFair là ảnh mẫu giống nhau giữa các bài → khi nhập vào CMS, thay bằng ảnh thư viện riêng từng bài (giờ đã
   tải ảnh được sau khi sửa lỗi kho ảnh — mục 5).

## 5. Lỗi tải ảnh trong CMS (cùng ngày) — xem `docs/LUU-TRU-MEDIA.md` mục 5

Bảng ảnh production thiếu hai cột `prefix`, `_objectKey` mà plugin S3 cần → migration `cot_kho_anh_s3`; nút
"Kiểm tra kho ảnh" trong Thư viện ảnh tự chẩn đoán; trần ảnh 4,5 MB.
