# EN-ALL — tiến độ chuyển thể toàn bộ sang tiếng Anh

> Thước đo tiến độ DUY NHẤT của `docs/PROMPT-EN-TOAN-BO.md`. Cập nhật sau mỗi commit đáng kể. Phiên bị ngắt: đọc tệp này +
> `git log` rồi làm tiếp đúng chỗ.
> Cập nhật lần cuối: 2026-11-10 (xong giai đoạn 0; giai đoạn 1 xong phần lõi).

## 0. Trạng thái giai đoạn

| GĐ | Việc | Trạng thái | Ghi chú |
|---|---|---|---|
| 0 | Kiểm kê + golden | **xong** (2026-11-10) | golden bản Việt 10.509 lượt gọi (chụp lại sau khi merge main #246–#249), ổn định 2 lần chạy liên tiếp; khung test 5.2 chạy |
| 1 | Nền web (rewrite, catalog nhiều ngôn ngữ, khung đầy đủ) | **đang** — lõi xong (2026-11-10), còn 6 việc ở mục 3b | làm tiếp theo |
| 2 | Nền engine (tên riêng, `L()` cho khuôn chung, `slug_en`) | chưa | 9 nhóm route |
| 3 | Bát tự | chưa | 5 nhóm route |
| 4 | Tử vi | chưa | 12 |
| 5 | Phong thuỷ | chưa | 11 |
| 6 | Kinh Dịch | chưa | 6 |
| 7 | Thần số + Tarot đầy đủ | chưa | 18 |
| 8 | Nhịp ngày, lịch, năm, tập quán, Nhân tướng, Chân dung, Thời gian tới | chưa | 26 |
| 9 | Tài khoản & kinh tế, Web Push theo ngôn ngữ, thẻ chia sẻ | chưa | 3 nhóm route + web |
| 10 | CMS + Blog + pháp lý + hub | chưa | |
| 11 | QC tổng | chưa | |

Số nhóm route = số khoá còn trong `CHUA_XONG` của `engine/tests/test_dau_ra_en.py` (hiện **90**). Làm xong route nào, test
tự báo "đã sạch — xoá khỏi CHUA_XONG". Sau merge main #246–#249 (2026-11-10) thêm 4 nhóm: `thanso.tuan`, `thanso.hom_nay_hai` (GĐ 7), `push.tuan` (GĐ 9), `kb.chuyen_gia` (GĐ 10) → **94**.

## 1. Quyết định của chủ dự án (hỏi một lần, 2026-11-10)

| Câu | Trả lời | Hệ quả |
|---|---|---|
| Tên thương hiệu bản Anh | **Hieuban** | đổi "Hieu Ban Than" → "Hieuban" ở khung, tiêu đề, schema bản Anh (GĐ 1) |
| Bảng slug mục 4.1 | **Đồng ý**, khoá sau GĐ 1 | `/en/bazi`, `/en/zi-wei-dou-shu`, `/en/feng-shui`, `/en/i-ching`, `/en/face-reading`, `/en/compatibility`, `/en/chinese-metaphysics`, `/en/today`, `/en/me`, `/en/year-ahead`, `/en/portrait`, `/en/auspicious-dates`, `/en/lunar-calendar`, `/en/lunar-converter`, `/en/year/{n}`, `/en/vietnamese-customs/…`, `/en/born-abroad/{country}` |
| Đo điểm mốc ảnh mặt trên máy ở bản Anh (ANH-2/3/4, quét 3 góc) | **Bật** | bản Anh có đo trên máy + thoả thuận tiếng Anh (`dm1`); gửi ảnh cho AI (ANH-1) vẫn TẮT ở bản Anh |
| Điều khoản / Chính sách bản Anh | **Ràng buộc ngang bản Việt** | bản Anh phải là bản ĐẦY ĐỦ (không tóm tắt), gắn nhãn "chờ luật sư"; bỏ câu "bản tiếng Việt quyết định" — **cần luật sư rà trước khi công bố** (ghi vào `docs/VIEC-CUA-ANH.md` ở GĐ 10) |

## 2. Số đo kiểm kê (đo lại 2026-11-10, không lấy theo prompt)

| Phần | Số đo |
|---|---|
| Trang Việt (`page.tsx` ngoài `/en`) | **105** (prompt ghi ~115) |
| Route API web | **132** |
| Tệp web có chữ Việt (`components`, `app`, `lib`) | **724** tệp `.ts/.tsx` (prompt ghi ~230 — con số cũ chỉ tính `components`) |
| Route engine | **126** (prompt ghi 128) |
| Dòng có chữ Việt trong mã engine (bỏ dòng chú thích) | `luangiai` 3.583 · `hoidap` 1.049 · `calc` 1.297 · `kb` 769 · `narrative` 309 |
| KB JSON | 71 tệp gốc, 4,5 MB; bản phủ `en/` 9 tệp, `en-us/` 1 tệp |
| Test engine nền | 9.710 xanh, 5 bỏ qua, 1 xfail (trước khi sửa gì) |

## 3. Thước đo đã dựng (giai đoạn 0)

- **Golden bản Việt** `engine/fixtures/golden/dau_ra_vi/` — 10.425 lượt gọi cố định (`engine/tests/_dau_ra.py`): 40 hồ sơ
  (nam/nữ, không giờ, 23:xx, tháng nhuận, miền Nam 1960–75, UTC+8 1947–55, nước ngoài, Nam bán cầu, < 18, > 60, tên một từ,
  tên không dấu, "O'Brien") × mọi route người dùng cuối + 670 trang kiến thức + **mọi câu** trong 9 kho câu hỏi có nhãn
  (7.300 lượt hỏi đáp). Lưu băm sha256 từng phản hồi + ~5 % nguyên văn (`mau.json.gz`). Đồng hồ đóng băng 2026-11-10 09:30 giờ VN,
  không AI, không gieo ngẫu nhiên. Sinh / so: `engine/scripts/chup_dau_ra.py` (`--so`, `--xem <mã>`, `--thong-ke`).
- `tests/test_dau_ra_vi_bat_bien.py` — bản Việt trùng 100 % (tiến trình con, ~3 phút; `DAU_RA_BO_QUA=1` để bỏ qua khi lặp nhanh).
- `tests/test_dau_ra_en.py` — cùng lượt gọi với `x-ngon-ngu: en`: 0 chữ Việt, 0 `{slot}`, 0 rác ghép chuỗi; khung dữ kiện
  (đường dẫn, kiểu, số, `ma_mau`, mức) giống bản Việt. Danh sách `CHUA_XONG` / `KHUNG_CHUA_XONG` theo giai đoạn.
- Chưa dựng (làm ở GĐ 1): chụp HTML máy chủ ~60 trang Việt trước/sau; e2e `en-*.spec.ts`.

## 3b. Giai đoạn 1 — nền web

**Đã có** (e2e `web/e2e/en-nen.spec.ts`, 13 ca; `en.spec.ts` cũ + 51 ca liên quan vẫn xanh; build production qua):
- `web/lib/duong-en.json` + `lib/duong-en.ts` — MỘT bảng cặp đường dẫn Việt ↔ Anh (58 tiền tố, cờ `mo` / `rieng` / `la`),
  `duongTheo(lang, duongVi, duoi?)`, `banAnh`, `banViet`, `capHreflang`, `dichRewrite`, `suaDuongLac`, `khongCoBanAnh`.
  Trang chưa mở: URL Anh trả 404 tiếng Anh (không lộ trang Việt trong khung Anh).
- `proxy.ts`: URL Anh đã mở không có trang riêng → `rewrite` sang trang Việt + header `x-ngon-ngu`, `x-duong-hien-thi`;
  `/en/<slug-việt>` gõ lạc / slug đã đổi → 308 một bước. Matcher không đổi (không sinh thêm lượt chạy proxy).
- `lib/ngon-ngu-may-chu.ts` (`ngonNguMayChu()`), `components/khung/NgonNgu.tsx` (`NgonNguProvider`, `useNgonNgu`, `useDuong`).
- `lib/chu-trang.ts`: `MucChu.en`, `taoChu(bang, cms, "en")` không bao giờ rơi về chữ Việt, `khoaThieuEn(bang)`.
- `lib/dinh-dang.ts`: ngày / khoảng ngày / giờ (en = Anh–Anh 24 giờ, en-us = Mỹ 12 giờ), số, %, tiền, danh sách, số thứ tự, số nhiều.
- `components/khung/NutDoiNgonNgu.tsx`: nút đổi ngôn ngữ về TRANG TƯƠNG ĐƯƠNG (lấy từ hreflang của trang khi có), giữ
  `?cach=` / `#neo`. Thương hiệu bản Anh đổi thành **Hieuban** (khung, tiêu đề, OG, schema `alternateName` giữ tên cũ).

**Còn lại của GĐ 1** (theo thứ tự nên làm):
1. Khung ĐẦY ĐỦ tiếng Anh thay `KhungEn` (menu + menu con, thanh mảng, chân trang, cookie, đăng nhập, dải thông báo) — chữ
   menu / chân trang / thanh mảng vào catalog có `en`, link qua `duongTheo`, chỉ hiện mục đã mở.
2. Chiều `en` cho `CHU_CHUNG` (form hồ sơ, hỏi đáp, góp ý, kiểm chứng, chia sẻ) + `ChuChung` đọc theo ngôn ngữ.
3. Chuyển 7 URL `/en` hiện có sang hệ một-component (xoá `app/en/**` từng trang khi trang Việt tương ứng đã đọc catalog),
   gộp `components/en/BaoCaoEn.tsx`, `HoiEn.tsx` vào component chung rồi xoá.
4. Hợp nhất hồ sơ `hbt.en.profile.v1` vào hồ sơ chung (đọc cũ một lần rồi chuyển).
5. Rà khoá đệm `fetch` / `unstable_cache` có tên: thêm ngôn ngữ vào khoá + `?ngon_ngu=` trên URL engine.
6. Chụp HTML máy chủ ~60 trang Việt trước/sau (mục 5.1 phần web) — làm TRƯỚC việc 1 vì việc 1 đụng layout bản Việt.

## 4. Chỗ code khác mô tả trong prompt / phát hiện khi đo

1. **Engine không tất định giữa các tiến trình**: vài danh sách trong đầu ra dựng từ `set` (vd tên sao lưu trong hỏi đáp Tử vi,
   vài mục Kinh Dịch) → thứ tự đổi theo hạt băm chuỗi (87/10.425 lượt lệch giữa hai tiến trình). Có sẵn từ trước, không thuộc
   việc này → golden chạy với `PYTHONHASHSEED=0`. Nên sửa riêng (sắp xếp danh sách trước khi trả).
2. **Lỗi 500 có sẵn**: `POST /v1/thanso/hoi` với câu `tsq00170` (nhắc người khác, không có ngày) → `IndexError` ở
   `luangiai/hoi.py` (`pl["ngay_nhac"][0]`). Golden chụp nguyên mã 500 (hiện trạng); sửa riêng.
3. **`GET /v1/kb/trang` trả 500 khi `x-ngon-ngu: en`** (và 78 trang kiến thức lệch mã HTTP giữa vi / en) — sửa ở GĐ 2.
4. **Khung dữ kiện đang lệch giữa vi và en** ở 5 nhóm route chưa giải thích: `kb.trang` (24), `goi_y_cheo` (7),
   `thanso.ban_do` (3), `chan_dung` (1), `thoi_gian_toi` (3) → `KHUNG_CHUA_XONG`. Lệch CỐ Ý đã biết: `tarot.doc_bai` (QTE-3 tắt
   `truong_phai` / `viec_lv` ở bản phủ → ít hộp hơn; khôi phục ở GĐ 7), `hoi.thanso` (bản gọn `hoi_en`; thay ở GĐ 7).
5. **Rủi ro thiết kế — trường dữ kiện mang TÊN VIỆT**: nhiều route trả tên riêng tiếng Việt ở trường dữ liệu (`can: "Mậu"`,
   `quai: "Khảm"`, `huong: "Bắc"`, `dung_than: "Quan Quỷ"`) và web dùng chính các giá trị này làm KHOÁ (tô màu theo hành, đặt
   cung trên lá số, so hướng). Đổi thẳng sang tiếng Anh sẽ gãy logic web và đổi "khung dữ kiện". Hướng xử lý (chốt ở GĐ 2, trước
   khi làm mảng đầu tiên): giữ trường mã như cũ (giá trị Việt là MÃ ổn định), thêm trường hiển thị song song do `kb/ten.py`
   sinh (`can_ten`, hoặc một bảng `ten` kèm phản hồi) và bộ kiểm 5.2 coi các trường mã đó là "khoá được phép" theo danh sách
   tường minh — không nới chung.
6. Bộ kiểm chữ Việt bỏ qua tên lá Marseille tiếng Pháp (`tdm_ten`) và từ nước ngoài in nghiêng trong trích dẫn Waite.

## 5. Bảng kiểm kê trang (Việt → Anh)

Trạng thái: `xong` · `đang` · `chưa` · `không` (không làm + lý do). "Đã có (cũ)" = trang `/en` viết riêng từ QTE-3, sẽ chuyển
sang hệ một-component ở GĐ 1 (cùng URL).

| Trang Việt | URL Anh | Trạng thái | GĐ |
|---|---|---|---|
| `/` | `/en` | đã có (cũ) | 1, 10 |
| `/than-so` | `/en/numerology` | đã có (cũ, gọn) | 1, 7 |
| `/than-so/[cum]`, `/than-so/[cum]/[slug]` (y-nghia-so, nghe-nghiep, tinh-yeu, nam-ca-nhan, no-nghiep, so-kep) | `/en/numerology/{life-path, careers, love, personal-year, karmic-debt, compound-numbers}[/…]` | life-path đã có (cũ); còn lại chưa | 7 |
| `/hop-doi`, `/hop-doi/[ma]` | `/en/compatibility[/…]` | chưa | 7 |
| `/hop-doi/cap-so[/slug]` | `/en/compatibility/number-pairs[/…]` | chưa | 7 |
| `/tarot` | `/en/tarot` | đã có (cũ) | 1, 7 |
| `/tarot/[cum]`, `/tarot/[cum]/[slug]` (la-bai) | `/en/tarot/cards[/slug]` | đã có (cũ) | 1 |
| `/bat-tu` | `/en/bazi` | chưa | 3 |
| `/bat-tu/[cum][/slug]` (thap-than, nhat-chu, menh-theo-nam) | `/en/bazi/{ten-gods, day-masters, element-by-birth-year}[/…]` | chưa | 3 |
| `/tu-vi` | `/en/zi-wei-dou-shu` | chưa | 4 |
| `/tu-vi/[cum][/slug]` (chinh-tinh, cung, sao-o-cung, tu-hoa, co-thu) | `/en/zi-wei-dou-shu/{stars, palaces, star-in-palace, four-transformations, classics}[/…]` | chưa | 4 |
| `/tu-vi/la-so-mau[/slug]` | `/en/zi-wei-dou-shu/sample-charts[/…]` | chưa | 4 |
| `/phong-thuy` | `/en/feng-shui` | chưa | 5 |
| `/phong-thuy/[cum][/slug]` (dau-hieu) | `/en/feng-shui/home-signs[/…]` | chưa | 5 |
| `/phong-thuy/huong-hop-tuoi[/slug]` | `/en/feng-shui/best-directions[/…]` | chưa | 5 |
| `/phong-thuy/huong-xau-nam[/nam]` | `/en/feng-shui/annual-afflictions[/{year}]` | chưa | 5 |
| `/kinh-dich` | `/en/i-ching` | chưa | 6 |
| `/kinh-dich/que[/slug]` | `/en/i-ching/hexagrams[/…]` | chưa | 6 |
| `/nhan-tuong`, `/nhan-tuong/[cum][/slug]` (bo-vi) | `/en/face-reading[/face-areas/…]` | chưa | 8 |
| `/huyen-hoc` | `/en/chinese-metaphysics` | chưa | 10 |
| `/kien-thuc` | `/en/library` | chưa | 10 |
| `/tu-dien` | `/en/glossary` | chưa | 2, 10 |
| `/hom-nay` | `/en/today` | chưa | 8 |
| `/ban-than`, `/ban-than/bai-da-luu` | `/en/me`, `/en/me/saved` (noindex) | chưa | 8, 9 |
| `/thoi-gian-toi` | `/en/year-ahead` | chưa | 8 |
| `/chan-dung` | `/en/portrait` | chưa | 8 |
| `/xem-ngay-tot`, `/xem-ngay-tot/[duong]` | `/en/auspicious-dates[/…]` | chưa | 8 |
| `/lich-am[/nam]` | `/en/lunar-calendar[/{year}]` | chưa | 8 |
| `/doi-lich-am-duong` | `/en/lunar-converter` | chưa | 8 |
| `/nam`, `/nam/[nam]`, `…/[tuoi]`, `…/sinh-con`, `…/cuoi-hoi` | `/en/year[/{year}[/born-{year} · /having-a-baby · /wedding]]` | chưa | 8 |
| `/xem-sao-han[/nam]` | `/en/vietnamese-customs/yearly-star[/{year}]` | chưa | 8 |
| `/xem-tuoi-lam-nha[/nam[/tuoi]]` | `/en/vietnamese-customs/house-building-age[/…]` | chưa | 8 |
| `/tuoi-xong-dat[/nam[/tuoi]]` | `/en/vietnamese-customs/first-footer[/…]` | chưa | 8 |
| `/sinh-o-nuoc-ngoai[/nuoc]` | `/en/born-abroad[/{country}]` | chưa | 8 |
| `/dang-nhap`, `/tai-khoan` | `/en/sign-in`, `/en/account` (noindex) | chưa | 9 |
| `/chia-se`, `/the/*` (9 loại thẻ), `/qua/[ma]` | `/en/card/…`, `/en/gift/{code}` (noindex) | chưa | 9 |
| `/blog`, `/blog/[slug]`, chuyên mục, mảng, phân trang | `/en/blog[/…]` (chỉ bài `ngon_ngu = en`) | chưa | 10 |
| `/su-kien/[slug]` | `/en/events/{slug}` (khi CMS có bản Anh) | chưa | 10 |
| `/tac-gia[/slug]` | `/en/authors[/…]` | chưa | 10 |
| `/gioi-thieu`, `/lien-he` | `/en/about`, `/en/contact` | chưa | 10 |
| `/chinh-sach-rieng-tu`, `/dieu-khoan` | `/en/privacy`, `/en/terms` | đã có (cũ, TÓM TẮT) → bản đầy đủ, ràng buộc | 10 |
| `/mien-tru-trach-nhiem` | `/en/disclaimer` | chưa | 10 |
| `/nap-sao`, `/nap-sao/gia`, `/nap-sao/ket-qua`, `/hoi-vien`, `/hoi-chuyen-gia`, `/tai-khoan/cau-hoi` | — | **không** (mục 6.1: chưa có cổng thanh toán quốc tế; bản Anh hiện "Available in the Vietnamese edition" + link) | — |
| `/ung-ho` | — | **không** (ví / ngân hàng Việt Nam) | — |
| `/quan-tri/**` (11 trang) | — | **không** (nội bộ, giữ tiếng Việt) | — |
| `/khung/ve-tinh` (khung bản đồ) | dùng chung, chữ theo ngôn ngữ | chưa | 5 |

Slug cụm kiến thức tiếng Anh ở trên là **đề xuất của em** (bảng 4.1 của prompt chỉ chốt slug mảng) — khoá cùng lúc với bảng 4.1
khi xong GĐ 1; slug từng trang do engine sinh (`slug_en`).

## 6. Cần chủ dự án quyết (ngoài 4 câu đã hỏi)

- Chưa có. (Ghi tại đây khi phát sinh; em làm phần khác trong lúc chờ.)

## 7. Nhật ký

- **2026-11-10 — GĐ 0**: đọc nền đa ngôn ngữ, kiểm kê, dựng golden bản Việt + khung test tiếng Anh, hỏi 4 câu quyết định.
- **2026-11-10 — merge main #246–#249**: golden chỉ lệch `thanso.hom_nay` (main cố ý đổi) → chụp lại 10.509 lượt, thêm lượt gọi cho route mới (`/v1/thanso/tuan`, `/hom-nay-hai`, `/v1/push/tuan`); mục lục KB hết 500 ở bản Anh (mục 4.3 phần 500 đã sửa, chữ vẫn là GĐ 2); CI: golden không gửi `x-nguoi-goi`.
- **2026-11-10 — GĐ 1 (lõi)**: bảng đường dẫn, rewrite / 308 trong proxy, ngữ cảnh ngôn ngữ, catalog có chiều `en`, định dạng `Intl`, nút đổi ngôn ngữ về trang tương đương, thương hiệu Hieuban.
