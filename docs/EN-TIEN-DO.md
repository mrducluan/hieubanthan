# EN-ALL — tiến độ chuyển thể toàn bộ sang tiếng Anh

> Thước đo tiến độ DUY NHẤT của `docs/PROMPT-EN-TOAN-BO.md`. Cập nhật sau mỗi commit đáng kể. Phiên bị ngắt: đọc tệp này +
> `git log` rồi làm tiếp đúng chỗ.
> Cập nhật lần cuối: 2026-11-13 (GĐ 3 đã merge qua #256; GĐ 4 Tử vi xong, GĐ 5 Phong thuỷ engine + hỏi đáp xong, web đang làm — mục 3e, 3f; hỏi đáp lai mục 6.4).

## 0. Trạng thái giai đoạn

| GĐ | Việc | Trạng thái | Ghi chú |
|---|---|---|---|
| 0 | Kiểm kê + golden | **xong** (2026-11-10) | golden bản Việt 10.509 lượt gọi (chụp lại sau khi merge main #246–#249), ổn định 2 lần chạy liên tiếp; khung test 5.2 chạy |
| 1 | Nền web (rewrite, catalog nhiều ngôn ngữ, khung đầy đủ) | **xong** (PR #251) | khung, catalog, báo cáo + hỏi đáp chung song ngữ; 7 URL `/en` cũ chuyển hệ một-component trong giai đoạn từng mảng (mục 3b) |
| 2 | Nền engine (tên riêng, `L()` cho khuôn chung, `slug_en`) | **xong phần nền** (mục 3c) | 7 nhóm route danh mục sạch; khuôn chuyên mảng (`truc_quan`, `mo_dau`, căn cứ `chu_y_nam`/`suc_khoe_nam`/`luu_y_mang`) làm cùng mảng |
| 3 | Bát tự | **xong** (PR #256) | 5 nhóm route sạch; `/en/bazi` + 3 cụm kiến thức mở; hỏi đáp tiếng Anh (mục 3d) — câu hỏi mở: bộ dò khủng hoảng tiếng Anh (mục 6) |
| 4 | Tử vi | **xong** (2026-11-13) | 12 nhóm route sạch; `/en/zi-wei-dou-shu` + 6 cụm kiến thức; hỏi đáp tiếng Anh (mục 3e) |
| 5 | Phong thuỷ | **xong** (2026-11-13) | 12 nhóm route sạch; `/en/feng-shui` + cụm dấu hiệu trong nhà (gồm `kb.trang.dau_hieu`, `hoi.phongthuy`) — mục 3f |
| 6 | Kinh Dịch | **xong** (2026-11-14) | 6 nhóm route sạch; `/en/i-ching` + cụm 64 quẻ; hỏi đáp tiếng Anh — mục 3g |
| 7 | Thần số + Tarot đầy đủ | chưa | 18 |
| 8 | Nhịp ngày, lịch, năm, tập quán, Nhân tướng, Chân dung, Thời gian tới | chưa | 26 |
| 9 | Tài khoản & kinh tế, Web Push theo ngôn ngữ, thẻ chia sẻ | chưa | 3 nhóm route + web |
| 10 | CMS + Blog + pháp lý + hub | chưa | |
| 11 | QC tổng | chưa | |

Số nhóm route = số khoá còn trong `CHUA_XONG` của `engine/tests/test_dau_ra_en.py` (hiện **60**, 2026-11-14). Làm xong route nào, test
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

**Đã làm thêm (2026-11-10, phiên 2)** — e2e `web/e2e/en-khung.spec.ts`; chụp HTML trước/sau mỗi bước: **bản Việt lệch 0/74 trang**.
- ✅ Việc 6 — `web/scripts/chup-html.mjs`: chụp HTML máy chủ 74 trang Việt (58 trang cố định + trang con đầu của 16 cụm) +
  10 trang Anh; chuẩn hoá: bỏ script (giữ JSON-LD), nonce, mã chunk, `next-size-adjust`; **ráp khối stream Suspense về đúng
  chỗ** (thứ tự gửi đổi theo lượt — không ráp thì 15/74 trang "lệch" giữa hai lượt chụp cùng bản build). Hai lượt liên tiếp
  0 lệch. Ảnh chụp phụ thuộc ngày → chụp trước/sau cùng ngày, không lưu git (`--ra <thư mục>`, `--so <trước> <sau>`).
- ✅ Việc 1 — khung đầy đủ tiếng Anh: `/en` dùng ĐÚNG `ThanhTren` + menu điện thoại, `ThanhMang` (+ số trang), `KhungChanTrang`,
  `TabDuoi`, `HoiDongYCookie`. Chữ + lọc ở `web/lib/khung-en.ts`: `TEN_MENU_EN` (chữ Anh theo đường dẫn Việt của MỌI mục menu,
  test bắt thiếu), `menuEn()` chỉ giữ mục có bản Anh đã mở (mục cha chưa mở còn một con → con lên làm mục trên cùng),
  `cotChanTrangEn()` liệt kê sẵn cả trang chưa mở (mở ở bảng là tự hiện), `CHU_KHUNG` vi/en (bản Việt giữ đúng chữ cũ).
  So khớp menu/thanh theo đường dẫn tương đương (`duongViDeSo`, `duongEnDeSo`, `useDuongVi`). Nút "Tiếng Việt" ở thanh trên +
  chân trang. Không có ở bản Anh: chữ CMS (dải thông báo, menu CMS — GĐ 10), Sao/ví/hộp nạp (mục 6.1), mời cài app, nút ủng hộ.
  `components/en/KhungEn.tsx` đã xoá.
- ✅ Việc 2 — `CHU_CHUNG` 67 khoá + nhãn thanh mảng (`THANH_MANG[].en`, `muc[].en`) có chiều `en`; `useChuChung()` đọc theo
  ngôn ngữ trang (layout bản Anh bọc `ChuChung chu={{}}` — chưa có CMS tiếng Anh).
- ✅ Việc 4 — `lib/en/hoso.ts` thành lớp đổi tên trường trên hồ sơ chung `hbt.hoso.v1` + `hbt.thanso_dd`; `hbt.en.profile.v1`
  chuyển MỘT lần (hồ sơ chung có sẵn thắng; khoá cũ chỉ xoá sau khi ghi xong; lỗi → giữ nguyên). "Clear" bản Anh = `xoaHoSo()`.
  Đổi tên ở bản Anh giữ giờ / nơi sinh / giới tính đã nhập ở bản Việt (cùng ngày sinh).
- ✅ Việc 5 — `lib/engine-ngon-ngu.ts`: 7 thư viện máy chủ gọi engine có đệm (`kien-thuc`, `nam`, `lich-am`, `hoang-lich`,
  `tuoi-dan-gian`, `sinh-nuoc-ngoai`, `cau-chuan`) tự gắn `?ngon_ngu=` + header khi lượt tải là bản Anh (đọc header qua import
  động — module có client dùng vẫn build được); 8 route GET có đệm nhận ngôn ngữ qua header HOẶC `?ngon_ngu=` (`engineTheoReq`,
  CDN khoá theo URL → trình duyệt bản Anh nên gửi query) và trả `Vary: x-ngon-ngu`. Bản Việt giữ nguyên URL.
- 🟡 Việc 3 (nửa đầu) — khung báo cáo CHUNG song ngữ: `lib/chu/bao-cao.ts` (59 khoá, `mac_dinh` = chữ Việt cũ từng ký tự)
  + `components/luan-giai/chu-bao-cao.ts` (`useChuBaoCao`: chữ, nhãn mức, ngày theo `Intl`) cho `BaoCaoDoiSongView`,
  `HopNoiBat`, `MucLucChuong`; `KiemChung` mặc định theo ngôn ngữ trang; `GiaoThoa` nhận `en`. `/en/tarot` dùng
  `BaoCaoDoiSongView` → **`components/en/BaoCaoEn.tsx` đã xoá**. Nhãn mức bản Anh theo mục 4.2: Favourable / Balanced /
  Needs care (bản cũ ghi "Mixed / Take care").

**Còn lại của GĐ 1** (theo thứ tự nên làm):
1. `HoiEn` → `KhungChat` (+ `CauTraLoi`, `GopYCauTraLoi`, `ThuatNgu`, `TrucQuan`: ~1.100 dòng, nhiều chữ cứng) rồi xoá `HoiEn`.
2. `DongMuoiNam`, `TangChuong`, `LuuBaiLuan`, `HopNoiBat.TEN_CHI_PHI` còn chữ Việt cứng (chỉ hiện ở Tử vi / Bát tự / Phong thuỷ /
   khi có Sao — chưa mở ở bản Anh) → làm cùng GĐ 3–5.
3. Chuyển 7 URL `/en` sang hệ một-component: `/en/tarot` (Tarot.tsx + 8 component tarot còn chữ Việt), `/en/numerology`
   (`/than-so` rất lớn — làm cùng GĐ 7), trang lá / Life Path (trang KB — GĐ 2 `slug_en`), privacy/terms (GĐ 10). Thực tế mỗi
   URL chỉ chuyển được khi trang Việt tương ứng đã đọc catalog → gộp vào giai đoạn của mảng đó; bảng `rieng` trong
   `duong-en.json` bỏ cờ khi chuyển.
4. Trình duyệt ở trang rewrite gọi route GET có đệm cần thêm `?ngon_ngu=` (helper client dùng `maNgonNguTrang()`) — làm khi mở
   trang rewrite đầu tiên (GĐ 3 Bát tự).

## 3c. Giai đoạn 2 — nền engine (2026-11-10)

- ✅ **Thước đo**: `kb.trang` tách theo LOẠI (`kb.trang.<loai>`, `tests/_dau_ra.khoa_route`) — mỗi loại trang kiến thức
  chuyển thể cùng giai đoạn của mảng (GĐ 3 thập thần / nhật chủ / mệnh theo năm · GĐ 4 sao, cung, sao ở cung, tứ hoá, cổ thư ·
  GĐ 5 dấu hiệu · GĐ 6 quẻ · GĐ 7 thần số + lá bài · GĐ 8 bộ vị); mục lục `kb` sạch khi mọi loại sạch (GĐ 11). Trường chỉ
  bản Anh mang (`slug_en`, `duong_en`) không tính vào khung dữ kiện; danh sách biến thể tên (`bien_the`) được khác số phần tử.
  Bộ soát chữ thay chữ người gọi gửi vào bằng một từ giả (bỏ hẳn từng tạo "rác ghép chuỗi" giả ở `giao_thoa`).
- ✅ **7 nhóm route danh mục sạch tiếng Anh** (xoá khỏi `CHUA_XONG`): `dia_ly` (63 tỉnh — `ten_en.json` mục `dia_ly.tinh`;
  nước / thành phố dùng `ten_en` có sẵn), `tu_dien` (234 thuật ngữ — `kb/data/en/tu_dien.json`, tên theo `thuat_ngu_en.json`;
  biến thể tên bản Anh THAY HẲN danh sách Việt để nhận diện thuật ngữ trong chữ Anh), `y_dinh` + `y_dinh.goi_mo` (11 ý định +
  link gợi mở — `en/y_dinh_chung.json`; đường dẫn vẫn là URL Việt, web đổi qua `duongTheo`), `hoi` (24 câu hỏi chuẩn —
  `truc_quan.cau_hien` ở ĐẦU RA, logic so khớp vẫn chữ Việt), `giao_thoa`, `timebase` (cờ cảnh báo qua `L`).
- ✅ **Slug tiếng Anh của 668 trang kiến thức** — `kb/slug_en.py` (tất định từ `ten_en.json`; dấu hiệu nhà / bộ vị / cổ thư:
  bảng soạn tay `kb/data/slug_en.json`), golden `fixtures/golden/slug_en.json` + `tests/test_slug_en.py` (duy nhất, a–z0–9-,
  ổn định, không phụ thuộc ngôn ngữ). Bản Anh: `/v1/kb/trang/<loai>/<slug>` nhận cả slug Anh lẫn slug Việt, trang + mọi link
  tới trang kiến thức khác mang `slug_en`, mục lục có `slug_en`; bản Việt không mang trường này (golden giữ nguyên).
  Ví dụ: `zi-wei-in-life-palace`, `hua-lu-in-wealth-palace`, `1-qian`, `jia-yang-wood`, `born-1988`, `life-path-7`, `1-and-5`.
  **Sửa lỗi có sẵn**: lá bài bản Anh 404 với slug Việt (danh sách slug dựng từ tên đã phủ tiếng Anh) — mọi hàm dựng danh sách
  (khoá, slug Việt) nay chạy ở ngữ cảnh tiếng Việt (`ngon_ngu.theo_viet`).
- ✅ **Khuôn dùng chung**: `doi_song_khuon` (nhãn mức "Needs care" theo mục 4.2, cắt / sắp tiêu đề theo từ nối tiếng Anh khi
  chữ là tiếng Anh, "Under review"), `doi_song_chung` (tiêu đề hộp theo ngữ pháp Anh, `nhan_co()` cho cờ tập quán, gộp năm),
  `nhat_quan` (đọc KB qua `nap` — có bản phủ), `hoan_canh`, `chu_y_nam` (câu năm + "this year"). Bản phủ KB: `nhat_quan_kb`,
  `hoan_canh_kb`, `chu_y_kb`, `suc_khoe_kb`. Mẫu câu tách theo cụm: `kb/data/en/loi/*.json` (gộp với `loi_khuon.json`, mã trùng
  giữa tệp = lỗi). Test `tests/test_en_khuon.py`: mọi mã `L("…")` hằng trong mã có chữ Anh + slot khớp; hàm khuôn ra chữ Anh sạch.
- ✅ **Trường MÃ tên riêng** (chốt rủi ro mục 4.5): giá trị mã giữ chữ Việt (web dùng làm khoá); bản Anh tự kèm
  `ten_hien` = {nhóm: {mã: tên Anh}} cho MỌI mã có trong phản hồi — gắn ở lớp phản hồi chung `cong_khai.PhanHoiCongKhai`
  (bản Việt không có trường này). Danh sách trường mã TƯỜNG MINH ở `kb/ten.KHOA_MA` (khoá đơn `can`, `chi`, `ngu_hanh`,
  `thap_than`… hoặc khoá "cha.con" như `nap_am.ten`; dict có khoá là mã như `diem: {"Kim": 3}`). Bộ soát chữ cho phép mã ở
  đúng các trường đó **chỉ khi** `ten_hien` của phản hồi có tên hiển thị cho chính mã ấy. Bảng tên thêm: 63 tỉnh, 30 nạp âm,
  "Nhật chủ" (Day Master). Web: hiển thị mã qua `ten_hien` — làm cùng trang từng mảng (GĐ 3 trở đi).
- ✅ **"Bản Việt quyết, bản dịch theo"** (`doi_song_khuon.quyet` / `vi_quyet_dinh`): vài bước RULES quyết định CẤU TRÚC
  dựa trên CHỮ (bỏ đoạn chép lại hộp ở `gon_bao_cao`, chọn hộp theo từ khoá tiếng Việt ở `luu_y_mang`, thân ý bổ sung Tử vi
  quá ngắn) — ở bản Anh, `lap` của Tử vi + Bát tự chạy bản Việt trước, ghi các quyết định theo khoá ổn định (mã chương, chỉ
  số đoạn, mã kiểm chứng) rồi lượt bản Anh làm theo. Khung dữ kiện bài đọc Bát tự + Tử vi bản Anh trùng bản Việt 80/80
  (trước: lệch 58/80 khi chữ đổi). `phut_doc` (số phút đọc) được phép khác — đếm theo chữ của ngôn ngữ.
- Ghi nhận cho GĐ 3 (Bát tự): CALC `battu_mo_rong` trả CÂU tiếng Việt (thần sát `y` / `goc` / `cach_khac`, quan hệ `mo_ta`,
  cung thân `giai_thich`) → cần lớp hiển thị RULES theo ngôn ngữ ở route (CALC không đọc ngôn ngữ); `tu_toa` viết "Mộc Dục"
  còn bảng tên ghi "Mục Dục" (cần bí danh); `bang_hanh.can.<can>` = dict mã → hành (giá trị cũng là mã); `quan_he.loai` là MÃ
  web dùng (`KIEU_QH[q.loai]`, `startsWith("can ")`).
- Làm cùng mảng (vì chữ là của mảng, không phải khuôn): `truc_quan` (khối hình hỏi đáp từng mảng), `hoidap/mo_dau` (đoạn mở
  đầu hỏi đáp), dòng căn cứ của `chu_y_nam` / `suc_khoe_nam` / `luu_y_mang` (tên sao, cung, hành), cụm từ khoá tiếng Anh của
  `an_toan` cho hỏi đáp từng mảng.

## 3d. Giai đoạn 3 — Bát tự (đang, 2026-11-10)

- ✅ `battu.la_so`, `battu.luu_nien`, `battu.doi_chieu_cach` sạch tiếng Anh: lớp hiển thị `luangiai/battu_hien.py` (CALC
  không đọc ngôn ngữ — câu thần sát / gốc tra / quan hệ can chi / cung thân / dụng thần / cờ CALC dựng lại từ mã);
  cờ hồ sơ dùng chung Tử vi + Bát tự (`tuvi_api._DauVao._co`) qua `L()` (`kb/data/en/loi/co.json`); bảng tên thêm thần
  sát, cát/hung, quan hệ, thân vượng/nhược, cách cục, nhóm thập thần, nạp âm; bản phủ KB `en/battu_kb.json`,
  `en/battu_doi_song_kb.json` (909 chuỗi), `en/hoan_canh_kb.json`, `en/chu_y_kb.json`, `en/suc_khoe_kb.json`.
- ✅ `battu.luan_giai` sạch tiếng Anh: ~285 chuỗi trong `battu_doi_song.py` / `chu_y_nam` / `suc_khoe_nam` / `luu_y_mang`
  / `toan_bo` qua `L()` (`kb/data/en/loi/battu_doi_song.json`); chữ Việt ở bản Anh 16.588 → 0 trên 40 lượt gọi golden; khung = bản Việt.
- ✅ **Review độc lập GĐ 2 (2026-11-10) — sửa hết mức Cao + Vừa**: (Cao) bộ nhớ đệm có chữ mà khoá không kèm ngôn ngữ làm lượt
  bản Anh RÒ sang bản Việt trong cùng tiến trình (`hoidap/tuvi._LAP_CACHE`, `la_so_mau._doc`) → khoá kèm ngôn ngữ; mọi
  `lru_cache` của tầng RULES có chữ đổi sang `ngon_ngu.lru(...)`; `kb/do_rieng.ty_le` (luật index) luôn đo trên chữ Việt.
  Test mới `test_dau_ra_tieng_viet_khong_doi_khi_xen_ke_tieng_anh` (gọi bản Anh trước rồi bản Việt, mẫu 1/4: 2.585 lượt, lệch 0).
  (Vừa) mã `loi` trùng giữa tệp không còn làm 500 (log + test bắt); slug Anh thiếu tên chỉ bỏ trang đó (test bắt thiếu);
  mã kiểm chứng dựng từ tiêu đề (`gan_ma_mau`, Phong thuỷ) lấy theo bản Việt. Còn ghi nhận (Thấp): `L()` hai cách gọi,
  `lap` bản Anh chạy hai lượt, vài câu cờ ("0 day(s)", mức độ tin giờ thô).
- ✅ Hỏi đáp Bát tự tiếng Anh (5.3) — xem bảng số đo cuối mục này. Ghi chép ban đầu: bộ câu viết độc lập `fixtures/cau_hoi/en/battu_dev.jsonl` (260) +
  `battu_holdout.jsonl` (160, đóng băng); bộ chấm `engine/scripts/cham_en.py`. **Mốc trước khi làm**: định tuyến dev 15 % /
  holdout 16 %, an toàn 6/12 · 2/12, mốc thời gian 16/72 · 13/44, câu trả lời còn chữ Việt 259/260 → cần bộ hiểu câu tiếng
  Anh + lời đáp theo ngôn ngữ (mục tiêu: định tuyến ≥ 90 %, an toàn 100 %, mốc ≥ 90 %).
- ✅ **Bộ chặn tiếng Anh theo NGHĨA (GĐ 3d vòng 4, 2026-11-11)**: ba bộ viết độc lập liên tiếp lọt khủng hoảng (v3: 16/25)
  vì danh sách cụm cứ dài thêm → `luangiai/an_toan.py` thêm bộ nhận nhóm tín hiệu (phương tiện theo loại · ý chấm dứt mạnh /
  cần thêm tín hiệu · hành vi từ biệt · tự coi mình vô dụng · ý làm hại người khác có chủ thể là người nói), ghép theo luật
  trong ~15 từ, hợp với mẫu cụm cũ; quá liều ngoài ý muốn ("by mistake", "twice", "for my toothache") → cấp cứu. **Tầng hỗ trợ
  mềm**: một tín hiệu buồn yếu → vẫn trả lời, kèm trường `ho_tro` (chỉ bản Anh, `kb/data/en/loi/an_toan_mem.json`), web hiện
  khung dịu trên câu trả lời. Số đo: v3 khủng hoảng 16/25 → 25/25, cấp cứu 8/10 → 10/10; mọi bộ dev khác 100 %; chặn nhầm 0
  (v2: 1 câu thai sản theo chính sách, có từ trước). `scripts/cham_en.py --v2 --tep <tệp> --sai`. Còn: tầng mềm chưa nối
  hỏi đáp Tarot / Thần số / Tử vi bản Anh.
- ✅ **Web `/en/bazi`** (2026-11-11, một cây component): cờ `mo` của `/bat-tu` trong `lib/duong-en.json` → proxy rewrite về
  `/bat-tu` + `x-ngon-ngu`. Chữ cố định đưa vào catalog có chiều `en`: `lib/chu/bat-tu.ts` (công cụ Bát tự, bảng tứ trụ, vòng
  địa chi, ngũ giác, đại vận, dụng thần, "Which reading fits you?"), `lib/chu/giao-dien.ts` (khung Trường phái, "Quick answer",
  khối mời lập lá số, dải QR, khung luận giải, biểu đồ Bát tự trong báo cáo, dòng 10 năm, **form hồ sơ NhapHoSo**),
  `lib/chu/cong-cu.ts` (`CHU_BAT_TU` thêm `en`), `lib/chu/hoi-dap.ts` (ghi chú / lỗi / lượt hỏi của `lib/hoi-mang.ts`).
  Mã engine hiện qua `ten_hien` (`lib/ten-hien.ts`, `components/khung/TenHien.tsx`). Khung trang công cụ bản Anh
  (`TrangCongCu` nhánh en: không CMS, không blog; chữ máy chủ `lib/so-trang-en.ts`), metadata `metaCongCuEn`, hreflang hai
  chiều (bản Việt `/bat-tu` thêm 3 thẻ `alternate` — lệch HTML có chủ đích DUY NHẤT, 73/74 trang còn lại 0 lệch), sitemap-en.
  Trình duyệt gửi `x-ngon-ngu` cho route API (`fetchSao` → `kemNgonNgu`), route GET có đệm dùng `urlTheoNgonNgu`. Bản Anh:
  báo cáo miễn phí (`luan_giai_sao` bỏ thu Sao khi lượt gọi tiếng Anh), không tặng chương / lưu bài, không khối CTA chéo mảng.
  e2e `web/e2e/en-bazi.spec.ts`. **Chưa**: cụm kiến thức `/en/bazi/{ten-gods, day-masters, element-by-birth-year}` (engine đã
  sạch nhưng `TrangChuDe` / `TrangKienThuc` / `DanhSachCum` / `DongTacGia` / `MinhHoa` còn chữ Việt cứng + CMS mẫu cụm) — cờ `mo` để tắt; thẻ chia sẻ. → cụm kiến thức: xong ở dòng dưới.
- ✅ **Cụm kiến thức `/en/bazi/{ten-gods, day-masters, element-by-birth-year}[/slug]`** (2026-11-11, một cây component): cờ `mo`
  bật trong `lib/duong-en.json` → proxy rewrite về `/bat-tu/{thap-than, nhat-chu, menh-theo-nam}[/slug]`; slug con = `slug_en`
  engine (URL Anh mang slug Việt → 308 về slug Anh; URL Việt mang slug Anh → 308 về slug Việt). Chữ cố định của khối trang
  kiến thức dùng chung đưa vào `lib/chu/kien-thuc.ts` (chiều `en`): "Trả lời nhanh" (`TraLoiNhanh`), ngày / nhãn / hỏi đáp /
  nguồn / miễn trừ / lời mời của `TrangKienThuc` (tách `CacMuc`, `HoiDapBai`, `ThanMuc` dùng chung hai bản), mục lục cụm
  (`DanhSachCum`, `BoLocCum`; `mucLucCum(…, en)` — luật `menh-tuoi` có nhãn Anh, luật khác bản Anh giữ lưới phẳng), dòng tác
  giả (`DongTacGia`: bản Anh luôn "Hieuban editorial team · Editor-in-chief Duc Luan" — EEAT-1/BM-1: chuyên gia không đứng tên
  bản Anh; bản Việt đã thẩm định thì ghi "The Vietnamese edition was reviewed by…"), hình minh hoạ thập thần / nhật chủ / mệnh
  năm + dải QR (`MinhHoa` nhận `en` + `ten` từ `ten_hien`). Trang cụm + trang con bản Anh: `TrangChuDeEn` / `TrangKienThucEn`
  (cùng khối, không CMS mẫu cụm, không "Bài viết liên quan", không "Góc nhìn chuyên gia" — lời chuyên gia chỉ có tiếng Việt,
  không ảnh tóm tắt dọc — /og/y-chinh chỉ vẽ chữ Việt; link tới trang chưa có bản Anh thì ẩn). Chữ máy chủ trang cụm:
  `CUM_EN` trong `lib/so-trang-en.ts` (cũng là thẻ khối "Learn BaZi" của /en/bazi); breadcrumb `duongDanCumEn`; JSON-LD
  CollectionPage / Article (+ `translationOfWork`) / FAQPage / BreadcrumbList tiếng Anh, `ldThucTheEn`. Hreflang hai chiều:
  trang Việt của 3 cụm + trang con khai `en` (slug Anh tra mục lục bản Anh — `slugEnCua`; chỉ cụm rewrite, `banAnhRewrite`) —
  lệch HTML có chủ đích DUY NHẤT (3 thẻ `alternate` / trang), mọi trang Việt khác 0 lệch. Nút "Tiếng Việt" dựng ở máy chủ trỏ
  đúng trang Việt cùng mục (`banVietTrangEn`, không qua 308). sitemap-en thêm 3 cụm + 98 trang con (lastmod, hreflang; chỉ cụm rewrite —
  cụm viết riêng không bị liệt kê hai lần). `kiem-tra-seo.mjs --chi-en`: 199 URL, 0 lỗi, 0 cảnh báo ở /en/bazi/*. e2e
  `e2e/en-bazi.spec.ts` (+9 ca). **Còn**: thẻ chia sẻ; cột "Learn" của chân trang bản Anh chưa có 3 cụm; bản `.md` trang Anh;
  trang Việt `/tarot/la-bai`, `/than-so/y-nghia-so` (bản Anh viết riêng) vẫn chưa khai hreflang `en` ở trang cụm (có từ trước).

- ✅ **Sửa theo review độc lập GĐ 3 (2026-11-11)**: bản Anh miễn phí CHỈ cho mảng đã mở tiếng Anh (`web/lib/proxy.ts`
  `MO_DUN_MIEN_PHI_EN` — trước đó gửi header `x-ngon-ngu` là đọc hết chương khoá mọi mảng); hỏi đáp bản Anh không hạn mức Sao;
  lời chào bản Anh không gọi người Việt bằng họ (`tenGoiEn`); dòng tác giả bản Anh lấy tên theo dữ liệu; JSON-LD bản Anh bỏ
  Wikipedia tiếng Việt; engine: "dye" ≠ "die", "my last question" cần từ kết thúc, sửa lỗi gõ không nuốt chữ, "Year of the X"
  trước Tết đúng năm. Còn ghi nhận: hỏi đáp tiếng Anh chạy engine hai lượt (bản Việt quyết) ≈ 2× CPU.
- ✅ **Thai sản bản Anh theo bản Việt**: chỉ từ chối đoán kết quả cơ thể (có thai chưa, trai/gái, sảy thai, IVF, vô sinh);
  hỏi bao giờ có thai / năm nên sinh con → nhánh sinh con (ranh giới bác sĩ, tục so tuổi con); "Will I have kids?" → mảng gia đình.
- ✅ **Lưới an toàn bản Anh**: dòng cố định (988 / 116 123 / 1767 / findahelpline.com + số cấp cứu địa phương) dưới MỌI câu trả
  lời hỏi đáp bản Anh (`hoi-dap.ts` khoá `luoi_an_toan`), vì bộ dò dựa trên luật chưa bắt hết tiếng Anh tự do.

**Số đo hỏi đáp Bát tự tiếng Anh (2026-11-11)** — `engine/scripts/cham_en.py`:

| Bộ câu | Vai trò | Định tuyến | Khủng hoảng | Cấp cứu | Từ chối | Chặn nhầm | Mốc năm | Chữ Việt / 500 |
|---|---|---|---|---|---|---|---|---|
| `battu_dev.jsonl` (377) | dev | 99,7 % | an toàn 12/12 | | | 0 | 82/82 | 0 / 0 |
| `an_toan_en.jsonl` (395) | dev | | 128/128 | 17/17 | 90/90 | 0/160 | | |
| `an_toan_en_dev2.jsonl` (192) | dev | | 51/51 | 20/20 | 41/41 | 0/40 | | |
| `battu_holdout.jsonl` (160) | đã dùng điều hướng (lộ số đếm) | ~82 % | | | | | | |
| `battu_holdout_v2.jsonl` (200) | nay là dev (đã xem câu an toàn) | 92,5 % | 20/20 | 10/10 | 20/20 | 0 | 42/42 | 0 / 0 |
| `battu_holdout_v3.jsonl` (200) | nay là dev (đã xem câu lọt) | 88 % | 25/25 (trước 16/25) | 10/10 | 20/20 | 0 | 45/45 | 0 / 0 |
| **`battu_holdout_v4.jsonl` (220)** | **đóng băng — chưa ai xem nội dung** | **83,2 %** | **26/30** | **8/13** | **21/22** | **0** | **48/49** | **0 / 0** |

Kết luận đo: mỗi bộ độc lập mới vẫn tìm ra câu khủng hoảng / cấp cứu lọt (v3 64 % → v4 87 % sau khi đổi sang nhóm tín hiệu) —
bộ dò dựa trên luật có trần với tiếng Anh tự do. Đã có lưới an toàn (dòng cố định) + tầng mềm; quyết định mở hỏi đáp bản Anh
cho người dùng thật cần chủ dự án (mục 6).

## 3e. Giai đoạn 4 — Tử vi (2026-11-11 → 13)

- **Engine**: lớp hiển thị `luangiai/tuvi_hien.py` (CALC không đọc ngôn ngữ); mẫu câu `en/loi/tuvi.json`, `tuvi_v2.json`,
  `tuvi_doi_song.json`, `trang_tuvi.json`, `hoi_tuvi.json`, `sach_xua_tuvi.json`; bản phủ `en/tuvi_kb.json` (gồm 74 sao nhỏ +
  52 mục phụ tinh × cung), `tuvi_doi_song_kb`, `tuvi_y_bo_sung`, `tuvi_sao_luu_kb`, `tuvi_cach_cuc` (76 cách, cổ ca pinyin
  "editorial translation"), `tuvi_phi_hoa_kb`, `tuvi_hai_nguoi_kb`, `bo_sung_hoa_cung`, `bo_sung_sao`, `bo_sung_cung`,
  `tuvi_co_thu`, `tuvi_cung_sao_menh_kb`, `su_kien_kb`. `ten.muc()` nhận hai kiểu bỏ dấu (Thuỷ/Thủy, Hoả/Hỏa, Bát Toạ/Tọa).
  Trang `sao_cung` bản Anh có ý chính rút từ chính trang tiếng Anh (`trang_tuvi.y_chinh_en`). `sach_xua` bản Anh: nguyên văn Hán
  giữ nguyên + tóm ý bản phủ. `NguoiKiaInput.mui_gio` (Xem lá số 2 người, người kia sinh nước ngoài).
- **Sửa cả hai ngôn ngữ (anh duyệt 2026-11-12)**: câu hỏi tiền chỉ nhận ý "đọc thêm" về tiền → golden `hoi_tuvi` đổi đúng
  2/10.509 lượt (`hhq01487`, `d_tv026`).
- **Hỏi đáp tiếng Anh** (`hoidap/tuvi.py` hai lượt, `nguoi_than: bool`): bộ `en/tuvi_dev.jsonl` (260) định tuyến 98,4 %, an toàn
  100 %; **đóng băng `tuvi_holdout.jsonl` (200)**: định tuyến 82,6 %, khủng hoảng 14/26, cấp cứu 6/12, từ chối 16/18, mốc năm
  33/35, chữ Việt / 500 = 0 → trần của luật, dẫn tới quyết định hỏi đáp lai (mục 6.4).
- **Web**: `/en/zi-wei-dou-shu` + 6 cụm (main stars, palaces, star in palace, Four Transformations, sample charts, classics);
  catalog `lib/chu/tu-vi.ts` (~420 khoá); chữ độ sáng M/W/D/L/P/B/X + chú giải; chọn nước → thành phố ở hồ sơ người thân /
  hai người; `MucLucChuong` sửa vạch cuộn (áp cho cả bản Việt); `SachXuaNoi` đọc catalog báo cáo. E2E `en-zi-wei.spec.ts` 15/15.
- **Review**: code độc lập (HIGH `_KHONG_TU_HAI` nuốt khủng hoảng thật — đã sửa + test khoá) + UX 3 vai (chữ Việt lọt, lỗi tiếng
  Việt, aria, ngữ pháp câu ghép, đại từ lá số người thân, định dạng ngày) — đã sửa.
- Còn: 37/168 trang sao-ở-cung bản Anh phần riêng < 30 % (quyết noindex ở web khi đo Search Console); đoạn trùng chữ trong
  `tuvi_doi_song._chuong` bản Anh (thấp).

## 3f. Giai đoạn 5 — Phong thuỷ (2026-11-13)

- **Engine** (12 nhóm route sạch: `phongthuy`, `.bo_cuc`, `.cung_phi`, `.do_huong`, `.do_thi`, `.huyen_khong`, `.luan_giai`,
  `.menh_quai`, `.thang_nay`, `.viec_tuan`, `kb.trang.dau_hieu`, `hoi.phongthuy`): lớp hiển thị `luangiai/phongthuy_hien.py`;
  `en/loi/phongthuy.json` (~300 mã `pt.*`), bản phủ `phongthuy_kb`, `phongthuy_huyen_khong`, `phongthuy_doi_song`,
  `phongthuy_do_thi`, `bo_sung_dau_hieu`, `tuoi_dan_gian_kb` (kim lâu, hoang ốc, tam tai, hạn năm — phần còn lại GĐ 8);
  `ten_en` thêm 24 sơn, cục Huyền Không, trạng thái sao, "Middle" (Trung tâm).
- **Hỏi đáp**: `hoidap/en_gloss_pt.py`, `en/loi/hoi_phongthuy.json`; an toàn tiếng Anh thêm khủng hoảng gắn nhà cửa + **nguy hiểm
  trong nhà** (`an_toan.nha_nguy_hiem`: gas, CO, khói/điện, cháy, trần nứt, lan can, trẻ nuốt vật nhỏ → lời "ra chỗ thoáng,
  gọi cấp cứu"); từ chối chọn giới tính thai, tuyển người theo năm sinh, đoán ngoại tình, dùng gương/dao hại người.
  Số: dev (240) định tuyến 19 → 95,4 %, khủng hoảng 31/31, cấp cứu 14/14, từ chối 22/22, chặn nhầm 0; **đóng băng (180)**
  định tuyến 70 %, khủng hoảng 11/23, cấp cứu 7/11, từ chối 11/16, chặn nhầm 1; chữ Việt / 500 = 0. Bản Việt 0 lệch.
- **Còn**: web `/en/feng-shui` + cụm dấu hiệu (đang làm); 8 tình huống bố trí chưa có mục KB (TV đối cửa, bếp đảo, giày dép
  chắn cửa, đầu giường sát WC, xương rồng, cửa mở vào tường, phòng ký túc xá); "mua nhà năm sau" đang trả bằng tuổi làm nhà (như
  bản Việt); `phongthuy_tuoi.tuoi()` / `tuoi_gop()` (route cũ) chưa dịch thân bài; thống nhất "Seven Red / 7 Red", "main door /
  front door" giữa `chu_y_kb` và `ten_en`.
- **Thuật ngữ cần người bản xứ duyệt**: Kua (personal trigram), East/West Group, 24 sơn dạng "Zi (N2)", trạng thái sao timely /
  growing / retreating / fading / dormant, Kim Lau / Hoang Oc / Tam Tai (phiên âm), Three Disasters, Year Breaker, Three Killings,
  Tai Sui, "Door – master – stove", "the stove's control side".
- **Review UX 3 vai (2026-11-13) đã sửa**: chữ Việt ở kiểm tra tuổi làm nhà, bảng khảo sát (cột "Best placed on", thẻ trên điện thoại), ngày "4 Feb 2026", số Kua "Kua 2 (Kun)", lời khi chưa có hồ sơ, hướng / năm / loại nhà điền sẵn từ hồ sơ nhà, nhãn la bàn, trang dấu hiệu ("Folk tradition holds…"); engine: sao năm (Ngũ Hoàng / Thái Tuế) không lạc sang sao hạn theo tuổi, tiêu đề hướng không cắt, "cửa đối cửa". Tên du niên dịu đi: Sheng Qi (Vitality), Tian Yi (Health), Yan Nian (Harmony), Huo Hai (Minor Mishaps), Liu Sha (Friction), Wu Gui (Setbacks), Jue Ming (Depletion) — cần người bản xứ duyệt cùng "Golden Tower", "house-age count", "Longevity Wanes", "Deserted House", "Three Calamities". Chưa làm: câu mở đầu hỏi đáp chưa trả lời thẳng (thứ tự đoạn do bản Việt quyết), bảng chi phí trang dấu hiệu dạng thẻ (component chung).

## 3g. Giai đoạn 6 — Kinh Dịch (2026-11-13 → 14)

- **Engine** (nhóm route sạch: `kinhdich`, `kinhdich.khoi_que`, `kinhdich.que_rieng`, `kinhdich.hieu_cau`, `kinhdich.hoi`,
  `hoi.kinhdich`): lớp hiển thị `luangiai/kinhdich_hien.py`; `en/loi/kinhdich.json`; bản phủ `kinhdich_hao` (384 lời hào — **bản dịch
  của ban biên tập**, không phải Legge 1882), `kinhdich_doi_song`, `kinhdich_tra_loi`, `bo_sung_que`; `ten_en` thêm 8 nhóm (quẻ, quái,
  lục thân, lục thú, Thế/Ứng…). Lớp Ngô Tất Tố (Tiểu tượng, Trình Di, Chu Hy) + loại tượng Thuyết Quái **chỉ bản Việt** (bản dịch
  tiếng Việt, không có bản Anh tương đương) — `kinhdich.hoi` ở `KHUNG_BO_QUA` có ghi lý do; `kb.trang.que` còn `KHUNG_CHUA_XONG`.
- **Hỏi đáp** (`hoidap/en_gloss_kd.py`, `en/loi/hoi_kinhdich.json`, `tests/test_en_kinhdich_hoi.py`): nhận quẻ theo số / tên Anh /
  pinyin / sáu giá trị xu, câu kiến thức, chủ đề, vai, mốc năm, "A or B" (làm rõ trước khi gieo); hai lượt "bản Việt quyết" (sáu hào
  máy gieo + giờ gieo qua `quyet` → hai lượt đọc cùng một quẻ). An toàn tiếng Anh thêm nhóm khủng hoảng / cấp cứu / kẻ lạ đột nhập /
  từ chối GĐ 6. Số: **dev (220)** định tuyến 27,8 → 97,5 %, khủng hoảng 29/29, cấp cứu 12/13, từ chối 20/20, chặn nhầm 1, mốc năm 8/8;
  **đóng băng (160)** định tuyến 25 → 75,7 %, khủng hoảng 13/21, cấp cứu 7/10, từ chối 12/14, chặn nhầm 0; chữ Việt / 500 = 0. Bộ an
  toàn chung + dev ba mảng trước không lùi.
- **Chính sách đã chọn**: câu vừa khủng hoảng vừa cấp cứu (uống cả lọ thuốc) → nhánh khủng hoảng (lời đáp có câu gọi cấp cứu);
  "business partner / co-founder / investor" + trust ở câu tiếng Anh vẫn vào luật nhân sự (bảo thủ hơn bản Việt Kinh Dịch) — chờ anh
  quyết có nới cho Kinh Dịch không.
- **Thuật ngữ cần người bản xứ duyệt**: changed / resulting hexagram, Response / Other line (Ying), Use God line, Officer / Wealth /
  Parent / Offspring / Sibling line, body / use trigram (Mai Hoa), void branch, month breaker, "meaning-and-principle reading".

## 4. Chỗ code khác mô tả trong prompt / phát hiện khi đo

1. ~~**Engine không tất định giữa các tiến trình**~~ — **ĐÃ SỬA**: hai chỗ lặp qua `set` rồi đưa ra đầu ra — `kb/tu_dien._mau`
   (thứ tự `thuat_ngu[].khop` ở hỏi đáp / luận giải) và `du_nien_y` của `/v1/phongthuy/menh-quai` (thứ tự KHOÁ); thêm một chỗ
   tiềm ẩn ở `hoang_lich._ly_do`. Không quy tắc ổn định nào tái tạo được thứ tự của hạt băm 0 → golden sinh lại 166 dòng băm
   (chỉ đổi thứ tự, nội dung giữ nguyên). Test `tests/test_tat_dinh_hat_bam.py` (hai tiến trình con, hai hạt băm).
2. ~~**Lỗi 500 có sẵn**~~ — **ĐÃ SỬA**: `POST /v1/thanso/hoi` câu `tsq00170` (chọn ngày sinh cho con, không có ngày của bé) nay
   trả 200, luận theo con số người hỏi như câu cùng loại `tsq00169`; golden đổi đúng dòng `hoi.thanso.tsq00170`.
   Test `tests/test_thanso_hoi_sinh_con.py`.
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

> Cập nhật 2026-11-10: mục 1 và 2 ở trên đã được sửa ở [mrducluan/hieubanthan#250](https://github.com/mrducluan/hieubanthan/pull/250), gộp thẳng vào nhánh này; golden đã cập nhật theo (166 dòng băm đổi thứ tự, 1 dòng hết mã 500), so lại 0/10.509 lệch. Bộ chụp vẫn đặt `PYTHONHASHSEED=0` cho chắc.

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
| `/bat-tu` | `/en/bazi` | xong (rewrite) | 3 |
| `/bat-tu/[cum][/slug]` (thap-than, nhat-chu, menh-theo-nam) | `/en/bazi/{ten-gods, day-masters, element-by-birth-year}[/…]` | xong (rewrite) | 3 |
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

1. **Bộ dò khủng hoảng tiếng Anh** (hỏi đáp mọi mảng bản Anh): bộ đóng băng độc lập v4 bắt 26/30 khủng hoảng, 8/13 cấp cứu
   dù đã có nhóm tín hiệu + tầng mềm + lưới an toàn (dòng cố định dưới mọi câu trả lời). Ba hướng: (a) mở như hiện tại, tiếp tục
   vòng đo – sửa với bộ độc lập mới mỗi đợt; (b) thêm bộ phân loại an toàn bằng mô hình ngôn ngữ cho câu tiếng Anh (gửi câu hỏi
   ra nhà cung cấp AI — lệch "LLM chỉ ở tầng diễn đạt", tốn lượt, cần duyệt quyền riêng tư); (c) tạm ẩn ô hỏi đáp bản Anh, chỉ
   mở lá số + báo cáo cho tới khi có (b). Em đề xuất (a) ngay + cân nhắc (b) trước khi quảng bá bản Anh.
   **→ Anh chọn (a) (2026-11-11)**: mở như hiện tại; mỗi giai đoạn sau đo lại bằng một bộ khủng hoảng tiếng Anh viết độc lập mới
   (bộ cũ thành dev), sửa theo NHÓM tín hiệu, không vá từng câu; (b) xét lại trước khi quảng bá bản Anh.
2. **Bản Việt "Khi nào tôi có thai?"** đang trả lời bằng mức mảng gia đình (vd "cần lưu ý") — dễ đọc thành lời đoán với người
   đang mong con; bản Anh đã chuyển loại câu này sang nhánh "sinh con" (ranh giới bác sĩ). Đổi bản Việt cho giống = golden bản
   Việt đổi có chủ đích (vài lượt hỏi đáp) — cần anh đồng ý.
3. **Số đường dây nóng** trong tầng mềm + lưới an toàn (988 Mỹ, 116 123 Anh/Ireland, 1767 Singapore, Befrienders Malaysia
   03-7627 2929, 1553 Philippines, findahelpline.com): cần người kiểm lại trước khi mở bản Anh.
4. **Hỏi đáp tiếng Anh "lai" — QUYẾT (2026-11-13, thay phần "(b) xét lại trước khi quảng bá" của mục 1)**: bộ dò luật chạm
   trần (Tử vi đóng băng 14/26 khủng hoảng, 6/12 cấp cứu; Bát tự v4 26/30) → anh quyết GIỮ gõ tự do, làm cách tốt nhất:
   - **Câu gợi ý trước, gõ tự do sau** (web `/en/bazi`, `/en/zi-wei-dou-shu`): 6 chip câu chuẩn của mảng (engine
     `GET /v1/hoi/goi-y?mang=` — `truc_quan.GOI_Y_DAU`, mỗi câu đã kiểm định tuyến; web `/api/hoi/goi-y`, `lib/goi-y-dau.ts`),
     bấm là hỏi luôn. Engine trả `hoi_lai` (độ tin thấp) → khối **"Did you mean one of these?"** đứng trước, lời đáp chung GẬP
     ("Or read a general answer for now") — không đoán thay người hỏi. Bản Việt giữ nguyên chip + lời đáp như cũ.
   - **Lớp phân loại AI** `engine/app/narrative/phan_loai_en.py` (tầng NARRATIVE, qua `ai_goi.goi_chat` + hạn mức RL-1): gửi
     CHỈ chữ câu hỏi → JSON nhãn trong danh mục cố định (`an_toan` ∈ binh_thuong · ho_tro_mem · khung_hoang · cap_cuu ·
     tu_choi:<mã>; `y_dinh` ∈ `en_gloss.Y_DINH_CUM` của mảng; `nam`). Nhãn đăng ký cho đúng câu trong lượt gọi
     (`luangiai/nhan_ngoai.py`, contextvar); **luật hợp nhất**: `an_toan.py` vẫn chạy trước, nhãn AI chỉ NÂNG
     (khung_hoang > cap_cuu > tu_choi > ho_tro_mem), không bao giờ hạ; ý định AI chỉ dùng khi luật `do_tin_thap`
     (`hoidap/chung.thu_nhan_ngoai` → phân loại lại bằng cụm từ khoá của chủ đề, câu gốc vẫn qua mọi bộ chặn). AI không viết
     lời trả lời. Hạn chót 2 s, không thử lại; lỗi / hết giờ / hết lượt / thiếu khoá / JSON hỏng / nhãn ngoài danh mục → luật như
     cũ, không 5xx. Không log câu hỏi; bộ nhớ ngắn hạn khoá sha256, chỉ giữ nhãn, 10 phút. Chỉ lượt `x-ngon-ngu` khác `vi`
     và câu không phải câu gõ tiếng Việt → bản Việt 0 lệch. Mô hình env `HOI_PHAN_LOAI_MODEL` (mặc định
     `google/gemini-2.5-flash-lite`: nhỏ, rẻ, nhanh — hợp hạn chót 2 s; cùng họ mô hình `DOC_ANH_MODEL`).
   - **Bật = HAI công tắc, mặc định TẮT**: env engine `HOI_PHAN_LOAI_AI=1` VÀ công tắc quản trị `hoi.phan_loai_ai_en`
     (`/quan-tri/cai-dat`, nhóm "Hỏi đáp" — web gửi header `x-phan-loai-ai: 1`, chỉ ở lượt bản Anh).
   - **Quyền riêng tư**: `/en/privacy` + bảng bên thứ ba của Chính sách riêng tư bản Việt đã thêm dòng (câu hỏi tiếng Anh có
     thể gửi nhà cung cấp AI CHỈ để phân loại an toàn + chủ đề, không dữ liệu sinh, không lưu, không huấn luyện) — ghi "hiện
     đang tắt; ngày bắt đầu sẽ ghi ở đây".
   - Test: `engine/tests/test_phan_loai_en.py` (AI giả lập: đọc nhãn, luật hợp nhất, rơi về luật, hạn chót, route + header,
     chip định tuyến rõ); e2e `en-bazi` / `en-zi-wei` (chip bấm là hỏi, "Did you mean…" + lời chung gập).
   - **Việc của anh**: (1) chạy đo với khoá thật:
     `cd engine && OPENROUTER_API_KEY=… PYTHONHASHSEED=0 PYTHONPATH=. .venv/bin/python scripts/do_phan_loai_en.py` (bảng tắt → bật
     cho Bát tự dev / v1–v4, Tử vi dev / holdout, hai bộ an toàn; in độ trễ trung vị / p90 và số câu > 2 s; holdout chỉ in tổng;
     `--het-gio 10` để đo chất lượng nhãn tách khỏi độ trễ; `HOI_PHAN_LOAI_MODEL=…` để so mô hình); (2) nếu số tốt (khủng
     hoảng / cấp cứu tăng, chặn nhầm ≈ 0, p90 < 2 s): ghi ngày hiệu lực vào `/en/privacy` + bảng bên thứ ba bản Việt (đổi
     `NGAY_HIEU_LUC`), đặt env Render `HOI_PHAN_LOAI_AI=1`, bật `hoi.phan_loai_ai_en` ở `/quan-tri/cai-dat`.

## 7. Nhật ký

- **2026-11-10 — GĐ 0**: đọc nền đa ngôn ngữ, kiểm kê, dựng golden bản Việt + khung test tiếng Anh, hỏi 4 câu quyết định.
- **2026-11-10 — merge main #246–#249**: golden chỉ lệch `thanso.hom_nay` (main cố ý đổi) → chụp lại 10.509 lượt, thêm lượt gọi cho route mới (`/v1/thanso/tuan`, `/hom-nay-hai`, `/v1/push/tuan`); mục lục KB hết 500 ở bản Anh (mục 4.3 phần 500 đã sửa, chữ vẫn là GĐ 2); CI: golden không gửi `x-nguoi-goi`.
- **2026-11-10 — GĐ 1 (lõi)**: bảng đường dẫn, rewrite / 308 trong proxy, ngữ cảnh ngôn ngữ, catalog có chiều `en`, định dạng `Intl`, nút đổi ngôn ngữ về trang tương đương, thương hiệu Hieuban.
- **2026-11-10 — GĐ 1 (phiên 2)**: chụp HTML trang Việt (việc 6), khung đầy đủ tiếng Anh (việc 1), Chữ dùng chung `en` (việc 2), hồ sơ chung (việc 4), khoá đệm theo ngôn ngữ (việc 5), khung báo cáo chung song ngữ + xoá `BaoCaoEn` (nửa đầu việc 3). Bản Việt: HTML máy chủ 0/74 lệch.
- **2026-11-10 — GĐ 1 (phiên 3)**: khung hỏi đáp chung song ngữ (xoá `HoiEn`), sửa theo review, CodeQL; PR #251 (GĐ 0–1).
- **2026-11-10 — GĐ 2**: thước đo theo loại trang, 7 nhóm route danh mục sạch, slug Anh 668 trang (+ sửa 404 lá bài), khuôn chung song ngữ (mục 3c).
- **2026-11-11 — merge #251 (GĐ 0–2)**; GĐ 3 Bát tự: hỏi đáp tiếng Anh (lời + hiểu câu + an toàn theo nhóm tín hiệu + tầng mềm + lưới an toàn), 98 trang kiến thức tiếng Anh, web `/en/bazi` + 3 cụm, review độc lập (sửa paywall theo header, lời chào, dòng tác giả, lỗi gõ an toàn), bộ đóng băng độc lập v2 → v4.
- **2026-11-11 — anh chọn (a)** cho bộ dò khủng hoảng tiếng Anh; gộp main #255 (SEO-O2: tiêu đề nhóm cụm tự đứng — thêm bản Anh) vào PR #256.

- **2026-11-12 (KT-TT đợt 2, ngoài lộ trình EN)**: bản Việt thêm lớp tri thức chỉ có tiếng Việt — bản dịch Ngô Tất Tố (Tiểu tượng, lời Trình
  Di, Chu Hy) ở bài đọc quẻ + trang quẻ, loại tượng tám quái ở câu trả lời Mai Hoa, nghĩa sao nhỏ `cung[].nghia_sao_nho` ở lá số Tử vi.
  Bản Anh **chưa có** các trường này (engine chỉ trả khi `ngon_ngu.la_viet()`), nên khung dữ kiện lệch ở `tuvi.an_sao`, `tuvi.la_so_mau`
  (→ chuyển thể ở GĐ 4) và `kb.trang.que`, `kinhdich.hoi` (→ GĐ 6) — đã ghi vào `KHUNG_CHUA_XONG`. Golden đầu ra bản Việt sinh lại có chủ đích.
- **2026-11-11 → 13 — GĐ 4 Tử vi**: engine 12 nhóm route, hỏi đáp tiếng Anh + bộ dev/đóng băng, web `/en/zi-wei-dou-shu` + 6
  cụm, review code + UX 3 vai; anh duyệt sửa hai ngôn ngữ (golden đổi 2 lượt); gộp main (KT-TT4…SX-1: sao nhỏ, sách xưa, bổ sung
  sao/cung — đã chuyển thể).
- **2026-11-13 — hỏi đáp lai** (mục 6.4) + **GĐ 5 Phong thuỷ** engine + hỏi đáp (mục 3f).
- **2026-11-13 → 14 — GĐ 6 Kinh Dịch** (mục 3g); sửa 10 cảnh báo CodeQL (regex chậm / chèn regex) + test `test_hoi_redos.py` cho mọi route hỏi đáp.
