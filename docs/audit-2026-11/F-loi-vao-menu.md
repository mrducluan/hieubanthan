# F — Kiểm toán lối vào & menu (kiến trúc thông tin), 2026-11-03

Phạm vi: mọi cụm trang công khai dưới 5 mảng (Tử vi, Bát tự, Phong thuỷ, Kinh Dịch, Thần số) + Hợp đôi, Năm, lịch & tuổi,
thư viện. CHỈ đọc code trong `web/` (và `cms/src/globals/MenuDauTrang.ts`), không chạy server. Số trang lấy lại từ
`docs/audit-2026-11/A-url-inventory.md` (1.575 URL, kiểm trên site thật) — không đếm lại. Không đề xuất phương án UI.

Quy ước "độ sâu" = số cú bấm từ trang chủ theo lối NGẮN NHẤT mà người dùng nhìn thấy (menu cấp 1 = 1 bấm, menu con
thả xuống = 1 bấm nếu rê chuột mở được bảng, trang trụ rồi cuộn xuống khối = 2 bấm, …). Chân trang có ở mọi trang nên
luôn là 1 bấm — nhưng được xếp là lối YẾU vì nằm cuối trang, chữ nhỏ (`components/khung/ChanTrang.tsx:65-77`).

## 0. Các lối vào tồn tại trong code (để tra bảng)

| Mã lối | Ở đâu | Bằng chứng |
|---|---|---|
| M1 | Menu cấp 1 (6 mục cha: Bản thân · Hợp đôi · Huyền học · Năm {nam} · Blog · Tài khoản) | `web/lib/menu-dau-trang.ts:7-52` |
| M2 | Menu con cấp 2 (bảng thả xuống máy tính / nút Menu điện thoại) — Huyền học 12 mục, Năm 12 mục, Bản thân 3, Hợp đôi 3 | `menu-dau-trang.ts:8-47`; `components/khung/DieuHuong.tsx:4-5,65-66,103-104` |
| TC | Trang chủ: form thần số (hero), 4 thẻ mảng (Tử vi · Kinh Dịch · Bát tự · Phong thuỷ — **không có Thần số/Hợp đôi** vì hero đã là thần số), link "xem tất cả" → /huyen-hoc, khối ngày tốt + 6 chip lịch & tuổi | `app/page.tsx:44-49,107-121`; `components/hoang-lich/NgayTotTrangChu.tsx:43-50` |
| HUB | Hub /huyen-hoc: 6 câu băn khoăn, 5 thẻ mảng (mỗi thẻ ≤ 4 chip cụm tra cứu), 12 ô lịch & tuổi | `app/huyen-hoc/page.tsx:54,97-182`; `lib/huyen-hoc.ts:11-32` |
| TV | Thư viện /kien-thuc: 6 silo × mọi cụm (`dsCumTru`) + thẻ bù | `app/kien-thuc/page.tsx:52-77` |
| KT | Khối "Kiến thức {mảng}" trên trang công cụ (`CumKienThucTru`), sau công cụ + sau khối CMS "dưới", trước "Bài viết liên quan" và "Về công cụ" | `components/cms/TrangCongCu.tsx:31-40`; `components/kien-thuc/CumKienThucTru.tsx:16-41` |
| GT | "Đọc thêm:" trong khối "Về công cụ…" (`GioiThieuCongCu`, `lien_ket` của sổ trang) — đứng SAU khối KT và bài viết | `components/seo/GioiThieuCongCu.tsx:54-55`; `lib/so-trang.ts:86,100,114,130,145,160,180` |
| BC | Breadcrumb (JSON-LD + `<nav aria-label="Đường dẫn">`) trên trang cụm / trang con | `components/kien-thuc/TrangChuDe.tsx:44-46`; `TrangKienThuc.tsx:140-163`; `app/xem-ngay-tot/[duong]/page.tsx:76-77,156-157` |
| CT | Chân trang 4 cột (Huyền học 15 link · Kiến thức 9 link · Về chúng tôi · Pháp lý) | `lib/menu-chan-trang.ts:5-27` |
| LĐ | Thẻ bù "lối đi tiếp" (CTA-2) trong các lưới cuối trang | `lib/loi-di-tiep-mac-dinh.json` |
| SM | Chỉ sitemap (`app/sitemap.ts`, 17 sitemap cụm `lib/sitemap-cum.ts:12` = 16 khoá `CHU_DE` + `huong-hop-tuoi`) | |
| NT | Lối ngữ cảnh: link trong câu trả lời hỏi đáp ("Đọc kỹ" `duongTrangKb`), "Mới làm quen Tử vi? xem 6 lá số mẫu", trang con ↔ trang con | `components/hoi/TrucQuan.tsx:444`; `app/tu-vi/TuVi.tsx:125-127`; `app/nam/[nam]/page.tsx:116,164` |

Thanh điều hướng phụ (sub-nav / tab) TRONG một mảng: **không có** — `DauMang` chỉ là tiêu đề + lời dẫn
(`components/huyen-hoc/KhungMang.tsx:14-33`); grep `sub-nav|ThanhPhu|TabMang|DieuHuongMang` trong `app/`, `components/`
không có kết quả. Cách duy nhất đi từ công cụ xuống cụm là cuộn tới khối KT (sau toàn bộ công cụ) hoặc dùng menu con
Huyền học → Thư viện → cụm.

## 1. Bảng kiểm kê cụm / trang

Cột "Lối vào": mã ở mục 0, kèm vị trí cụ thể. "Sâu" = số bấm ngắn nhất (nhìn thấy được). Đánh giá: **Tốt** = có mặt
ở menu (M1/M2) hoặc trang chủ / hub ở nửa trên; **Yếu** = chỉ tới được qua khối cuối trang công cụ, chân trang, thư viện
(2–3 bấm, phải cuộn) ; **Mồ côi** = chỉ breadcrumb ngược / sitemap / link trong trang con cùng cụm.

### 1a. Tử vi (/tu-vi)

| Cụm / trang | Số trang | Lối vào hiện có | Sâu | Đánh giá | Tầm quan trọng |
|---|---:|---|---:|---|---|
| `/tu-vi` công cụ | 1 | M2 Huyền học → Tử vi; TC thẻ mảng; HUB thẻ; CT; HOI_HH câu 3 | 1 | Tốt | Cao — trụ của 242 trang |
| `/tu-vi/chinh-tinh` (14 chính tinh) | 1+14 | KT cuối /tu-vi; HUB chip 1/4; TV; CT cột Kiến thức ("14 chính tinh Tử vi"); GT /tu-vi | 2 (cuộn) | Yếu | Vừa |
| `/tu-vi/cung` (12 cung) | 1+12 | KT; HUB chip 2/4; TV; GT; trang sao-ở-cung `xem_them` | 2 (cuộn) | Yếu | Vừa |
| `/tu-vi/sao-o-cung` (14 × 12) | 1+**168** | KT; HUB chip 3/4; TV; `trang_con` từ trang sao / trang cung (`TrangKienThuc.tsx:232`); NT "Đọc kỹ" trong hỏi đáp (`TrucQuan.tsx:444`) | 2 (cuộn) | Yếu | **Cao** — cụm lớn nhất site (168 trang, 33 % số trang KB), ý định tìm kiếm "sao X ở cung Y" rõ |
| `/tu-vi/tu-hoa` (4 × 12) | 1+48 | KT; HUB chip 4/4; TV; `trang_con_hoa` từ trang cung | 2 (cuộn) | Yếu | Vừa |
| `/tu-vi/la-so-mau` | 1+6 | NT dòng "Mới làm quen Tử vi?" ngay đầu /tu-vi (`TuVi.tsx:125-127`); KT (cụm phụ `CUM_PHU`, `lib/kien-thuc.ts:77`); CT cột Kiến thức; GT; **HUB không có** (`slice(0, 4)` cắt cụm thứ 5, `app/huyen-hoc/page.tsx:54`) | 2 | Tốt (nhờ link đầu /tu-vi) | Vừa — trang nặng 46 KB, không .md (A §3) |
| `/tu-vi#hop-tham` (Xem lá số 2 người) | khối | M2 Hợp đôi; LĐ; `HopDoi.tsx:96` | 1 | Tốt | Cao (khâu MỜI) |

### 1b. Bát tự (/bat-tu)

| Cụm / trang | Số trang | Lối vào hiện có | Sâu | Đánh giá | Tầm quan trọng |
|---|---:|---|---|---|---|
| `/bat-tu` công cụ | 1 | M2 Huyền học; TC; HUB; CT | 1 | Tốt | Cao |
| `/bat-tu/thap-than` | 1+10 | KT cuối /bat-tu; HUB chip; TV; GT | 2 (cuộn) | Yếu | Vừa |
| `/bat-tu/nhat-chu` | 1+10 | KT; HUB chip; TV; GT | 2 (cuộn) | Yếu | Vừa |
| `/bat-tu/menh-theo-nam` (sinh năm X mệnh gì) | 1+**78** | KT; HUB chip; TV; LĐ nhóm /tu-vi (`loi-di-tiep-mac-dinh.json` nhóm "/tu-vi"); từ trang tuổi/`trang_menh` engine; **không có trong M2, không có CT, không có trang chủ** | 2 (cuộn) | **Yếu** | **Cao** — 78 trang, từ khoá phổ biến nhất của Bát tự với người Việt ("sinh năm 1990 mệnh gì"), tra cứu không cần giờ sinh; nằm dưới /bat-tu nhưng người tìm "mệnh" không nghĩ tới Bát tự |

### 1c. Phong thuỷ (/phong-thuy)

| Cụm / trang | Số trang | Lối vào hiện có | Sâu | Đánh giá | Tầm quan trọng |
|---|---:|---|---|---|---|
| `/phong-thuy` công cụ | 1 | M2; TC; HUB; CT; HOI_HH câu 5 | 1 | Tốt | Cao |
| `/phong-thuy/dau-hieu` (23 dấu hiệu) | 1+23 | **M2 Huyền học mục 10**; KT; HUB chip; TV; từ Khảo sát nhà "Đọc kỹ" | 1 | Tốt | Vừa |
| `/phong-thuy/huong-hop-tuoi` (mục lục + 8 cung phi + 46 neo năm) | 1+8 | **M2 Huyền học mục 9**; HUB ô lịch 7/12; KT (cụm phụ); CT cột Kiến thức; GT /phong-thuy | 1 | Tốt | Cao (mùa mua/xây nhà) |
| `/phong-thuy/huong-hop-tuoi/cung-*` 8 trang | 8 | chỉ từ mục lục cha + chéo nhau (`cung_cung_nhom`); BC; SM cụm `huong-hop-tuoi` | 2 | Tốt (cha mạnh) | Vừa |
| `/phong-thuy/huong-xau-nam` (+ `/{năm}` 4 trang) | 1+4 | **M2 Huyền học mục 6 + M2 Năm mục 9**; HUB ô 6; TC chip; KT cụm phụ; GT; CT ("Xem theo năm" không, nhưng link từ `/nam/{năm}:164`, `/xem-tuoi-lam-nha/{năm}:94`) | 1 | Tốt | Cao (mùa Tết, động thổ) |

### 1d. Kinh Dịch (/kinh-dich)

| Cụm / trang | Số trang | Lối vào hiện có | Sâu | Đánh giá | Tầm quan trọng |
|---|---:|---|---|---|---|
| `/kinh-dich` công cụ | 1 | M2; TC; HUB; CT; HOI_HH câu 4 | 1 | Tốt | Cao |
| `/kinh-dich/que` (64 quẻ) | 1+**64** | KT cuối /kinh-dich (silo 1 cụm → 2 thẻ bù `/hom-nay#que-ngay`, `/tu-dien`); HUB chip 1/3 (kèm 2 chip `TRA_CUU_THEM` không phải KB); TV; **CT cột Kiến thức "64 quẻ Kinh Dịch"**; GT; **không M2** | 2 (cuộn) / 1 (chân trang) | Yếu | **Cao** — 64 trang, phần riêng cao nhất site (0,76, A §2), từ khoá "quẻ X" tìm độc lập công cụ; trang quẻ là nội dung đọc được không cần gieo |

### 1e. Thần số (/than-so) + Hợp đôi (/hop-doi)

| Cụm / trang | Số trang | Lối vào hiện có | Sâu | Đánh giá | Tầm quan trọng |
|---|---:|---|---|---|---|
| `/than-so` công cụ | 1 | M2 Bản thân mục 1; TC hero (form) + nút `/huyen-hoc`; HUB thẻ + nút chính; CT | 1 | Tốt | Cao — cửa chính |
| `/than-so/y-nghia-so` (12 số) | 1+12 | KT cuối /than-so (6 cụm → không thẻ bù); HUB chip 1/4; TV; **CT cột Kiến thức**; GT; LĐ nhóm /hop-doi | 2 (cuộn) | Yếu | Cao — 12 trang chuyên gia tự viết (EEAT-1), giá trị tin cậy |
| `/than-so/nghe-nghiep` | 1+12 | KT; HUB chip 2/4; TV; GT | 2 (cuộn) | Yếu | Vừa |
| `/than-so/tinh-yeu` | 1+12 | KT /than-so; HUB chip 3/4; TV (silo Thần số vì `truCua(duong)`, dù `mang: "/hop-doi"` — `lib/kien-thuc.ts:23,71`); GT /hop-doi; LĐ nhóm /hop-doi | 2 (cuộn) | Yếu | Vừa |
| `/than-so/nam-ca-nhan` | 1+9 | KT; HUB chip 4/4; TV; GT /than-so + /hom-nay | 2 (cuộn) | Yếu | Vừa (nối với Hôm nay — khâu QUAY LẠI) |
| `/than-so/no-nghiep` | 1+4 | KT; TV; GT; **HUB không có** (cụm thứ 5, bị `slice(0, 4)`) | 2 (cuộn) | Yếu | Thấp |
| `/than-so/so-kep` (43 số kép Chaldea) | 1+43 | KT; TV; GT; **HUB không có** (cụm thứ 6) | 2 (cuộn) | Yếu | Vừa (43 trang nhưng ý định tìm kiếm tiếng Việt thấp) |
| `/hop-doi` công cụ | 1 | **M1** (mục cha) + M2; HOI_HH câu 2; CT; `ThanSo.tsx:91`; **không có ở TC 4 thẻ mảng, không có ở HUB 5 thẻ** | 1 | Tốt | Cao (khâu MỜI) |
| `/hop-doi/cap-so` (45 cặp số) | 1+45 | **M2 Hợp đôi mục 3**; KT /hop-doi (1 cụm + 2 thẻ bù); TV; CT; GT; LĐ nhóm /than-so | 1 | Tốt | Vừa |

### 1f. Năm (/nam) + Thời gian tới

| Cụm / trang | Số trang | Lối vào hiện có | Sâu | Đánh giá | Tầm quan trọng |
|---|---:|---|---|---|---|
| `/nam` mục lục | 1 | M2 Năm mục 12 "Các năm khác"; TC chip "Xem theo năm"; HUB ô 11; CT "Xem theo năm" | 1 | Tốt | Vừa |
| `/nam/{năm}` | 2 | **M1 "Năm {nam}"** (`thayNamMenu`); M2 mục 2; `/lich-am:48`; BC | 1 | Tốt | Cao (mùa Tết) |
| `/nam/{năm}/tuoi-{ns}` | **92** | M2 "Tử vi năm {nam} theo tuổi" → `/nam/{nam}#theo-tuoi` (neo lưới 46 chip, `app/nam/[nam]/page.tsx:116`); BC | 2 | Tốt | Cao (mùa Tết; A §1 cảnh báo phần riêng 0,19–0,25) |
| `/nam/{năm}/sinh-con`, `/cuoi-hoi` | 2+2 | M2 Năm mục 6, 7; HUB ô 12 (chỉ cưới hỏi); từ `/nam/{năm}` | 1 | Tốt | Vừa |
| `/thoi-gian-toi` | 1 | **M2 Năm mục 1**; TC chip; HUB ô 10; CT; `/nam:65`, `/nam/{năm}:92` | 1 | Tốt | Cao (khâu NẠP Sao) |

### 1g. Lịch & tuổi

| Cụm / trang | Số trang | Lối vào hiện có | Sâu | Đánh giá | Tầm quan trọng |
|---|---:|---|---|---|---|
| `/xem-ngay-tot` | 1 | M2 Bản thân mục 3; TC khối ngày tốt (`NgayTotTrangChu`); HUB ô 2 + HOI_HH câu 6; CT; LĐ | 1 | Tốt | Cao (sitemap priority 0,9) |
| `/xem-ngay-tot/{yyyy-mm-dd}` | 406 | Lịch tháng trong công cụ (`XemNgayTot.tsx:41,109`); thẻ "ngày mai / ngày tốt gần" (`TheNgay.tsx:178-185`); `/doi-lich-am-duong` (`DoiLich.tsx:64`); BC | 2 | Tốt (quy luật) | Vừa |
| `/xem-ngay-tot/thang-{m}-{yyyy}` | 37 | nút ← → tháng trong công cụ (`XemNgayTot.tsx:29-31`); BC từ trang ngày | 2 | Tốt | Vừa |
| `/xem-ngay-tot/{việc}-thang-{m}-{yyyy}` (6 việc) | **150** | CHỈ từ trang tháng (`[duong]/page.tsx:120,126`) và trang việc cùng tháng (`:181-185`); **không có từ công cụ `/xem-ngay-tot`, không M2, không HUB, không CT** | 3 | **Yếu** | **Cao** — 150 trang, từ khoá "ngày tốt cưới hỏi tháng 12/2026" là ý định giao dịch mạnh (SEO-L2) |
| `/xem-tuoi-lam-nha` (+ `/{năm}` 2, `/{năm}/tuoi-*` 92) | 95 | **M2 Huyền học mục 5 + M2 Năm mục 5**; TC chip; HUB ô 3; CT; LĐ nhóm /phong-thuy; bảng năm → tuổi (`[nam]/page.tsx:63`) | 1 | Tốt | Cao (A: phần riêng trang tuổi 0,22) |
| `/tuoi-xong-dat` (+ `/{năm}`, `/{năm}/tuoi-*` 92) | 95 | M2 Huyền học mục 7 + M2 Năm mục 8; TC chip; HUB ô 4; CT; LĐ | 1 | Tốt | Cao (mùa Tết) |
| `/xem-sao-han` (+ `/{năm}` 2) | 3 | M2 Huyền học mục 8 + M2 Năm mục 4; TC chip; HUB ô 5; CT; LĐ nhóm /phong-thuy | 1 | Tốt | Vừa (A §3: 94 link nhưng 92 là `#neo`) |
| `/lich-am` (mục lục) | 1 | **không M2** (menu chỉ có `/lich-am/{nam}`), **không HUB** (ô 8 trỏ `/lich-am/{năm}`), không CT; từ `/doi-lich-am-duong` (`DoiLich.tsx:66` → năm) và breadcrumb trang năm trỏ về **`/doi-lich-am-duong`** chứ không về `/lich-am` (`app/lich-am/[nam]/page.tsx:43`) | 2 | **Mồ côi** (mục lục) | Thấp — mục lục; trang năm có menu |
| `/lich-am/{năm}` | 6 | M2 Năm mục 10; HUB ô 8; ← → năm (`:79-80`); `DoiLich.tsx:66` | 1 | Tốt | Vừa (A: 285–297 chữ, mỏng) |
| `/doi-lich-am-duong` | 1 | M2 Năm mục 11; HUB ô 9; CT; `/lich-am:48` | 1 | Tốt | Vừa |
| `/hom-nay` | 1 | M2 Bản thân mục 2; HUB ô 1; CT; LĐ nhóm chung; `start_url` app | 1 | Tốt | Cao (QUAY LẠI) |

### 1h. Thư viện

| Cụm / trang | Số trang | Lối vào hiện có | Sâu | Đánh giá | Tầm quan trọng |
|---|---:|---|---|---|---|
| `/huyen-hoc` hub | 1 | M1 mục cha "Huyền học" (bấm tên mục = vào hub); TC link "xem tất cả"; CT "Tất cả các mảng"; GT /phong-thuy; BC của mọi công cụ gốc (`GioiThieuCongCu.tsx:36-38`) | 1 | Tốt | Cao (trang trụ của 12 công cụ) |
| `/kien-thuc` thư viện | 1 | M2 Huyền học mục 11; CT cột Kiến thức mục 1; LĐ nhóm chung; `sitemap` 0,9 | 1 | Tốt | Cao (mục lục đầy đủ 16 cụm) |
| `/tu-dien` | 1 | M2 Huyền học mục 12; CT; GT 4 công cụ; LĐ; HUB chip Kinh Dịch | 1 | Tốt | Vừa (A: 0 link trong `<main>`, 66 KB) |
| `/blog`, chuyên mục | 23 | M1 "Blog" + menu con tự sinh từ chuyên mục (`ganChuyenMucBlog`); CT; "Bài viết liên quan" mọi trang công cụ | 1 | Tốt | Vừa |

## 2. Cụm "mồ côi / yếu" xếp theo tầm quan trọng giảm dần

1. **`/tu-vi/sao-o-cung` — 168 trang (cụm lớn nhất site), lối vào Yếu.** Không có trong menu con Huyền học
   (`lib/menu-dau-trang.ts:18-31` — 12 mục, không mục nào là cụm Tử vi), không có ở chân trang (`lib/menu-chan-trang.ts:12-15`
   chỉ có "14 chính tinh"), không có ở trang chủ. Lối duy nhất người dùng nhìn thấy: khối "Kiến thức Tử vi" nằm SAU lá số +
   luận giải + hỏi đáp của `/tu-vi` (`components/cms/TrangCongCu.tsx:33` đặt sau `{children}`), chip thứ 3 trên thẻ Tử vi của
   hub, hoặc thư viện. Mọi lối đều cần cuộn qua trang dài; `/tu-vi` có kết quả thì trang cao hơn nhiều màn hình.
2. **`/xem-ngay-tot/{việc}-thang-*` — 150 trang, lối vào Yếu (độ sâu 3).** Công cụ `/xem-ngay-tot` không link tới trang
   "việc – tháng" (grep `duongViecThang` chỉ có ở `app/xem-ngay-tot/[duong]/page.tsx:44,120,126,146,181-185`); phải vào
   trang tháng trước. Không M2, không HUB, không CT. Sitemap có 150 URL nhưng trang chỉ có breadcrumb ngược + link ngang.
3. **`/bat-tu/menh-theo-nam` — 78 trang, lối vào Yếu.** Không M2 (menu Huyền học có "Hướng nhà hợp tuổi", "Dấu hiệu
   trong nhà" nhưng không có "Sinh năm nào mệnh gì"), không CT, không TC; chỉ KT cuối `/bat-tu`, chip hub, thư viện, thẻ bù
   nhóm `/tu-vi` (`lib/loi-di-tiep-mac-dinh.json` nhóm "/tu-vi" thẻ 1). Ý định tìm kiếm cao, không đòi giờ sinh — nhưng nằm
   dưới trụ Bát tự là môn ít người biết nhất.
4. **`/kinh-dich/que` — 64 trang, lối vào Yếu (có chân trang).** Không M2; KT cuối `/kinh-dich` chỉ hiện sau khung gieo
   (`app/kinh-dich/KinhDich.tsx` → `TrangCongCu` đặt sau children); hub chip 1/3 bên cạnh 2 chip không phải KB
   (`lib/huyen-hoc.ts:31`). Chân trang có "64 quẻ Kinh Dịch" (`menu-chan-trang.ts:12`) nên không mồ côi, nhưng là lối cuối trang.
5. **`/than-so/y-nghia-so` — 12 trang chuyên gia tự viết, lối vào Yếu.** Trang chủ hero đưa thẳng vào form `/than-so`; cụm
   chỉ có ở KT cuối `/than-so` (sau 4 số, chân dung, Bản đồ con số, chiều sâu, nỗi đau, hỏi đáp — `app/than-so/ThanSo.tsx:236-338`),
   hub chip, thư viện, chân trang. Menu con "Bản thân" (3 mục) không có cụm nào của thần số (`menu-dau-trang.ts:8-12`).
6. **`/than-so/no-nghiep`, `/than-so/so-kep` (4 + 43 trang), `/tu-vi/la-so-mau` — bị hub cắt.** `app/huyen-hoc/page.tsx:54`
   lấy `dsCumTru(...).slice(0, 4)`: Thần số có 6 cụm (`lib/kien-thuc.ts:16-30` + `truCua`), Tử vi 5 → cụm thứ 5–6 không hiện ở
   hub. Lá số mẫu còn link đầu `/tu-vi`; nợ nghiệp + số kép chỉ còn KT, thư viện, GT.
7. **`/than-so/{nghe-nghiep, tinh-yeu, nam-ca-nhan}`, `/bat-tu/{thap-than, nhat-chu}`, `/tu-vi/{chinh-tinh, cung, tu-hoa}`
   (≈ 100 trang) — Yếu.** Cùng mẫu: không M2 / không TC; chỉ KT cuối trang công cụ + hub chip + thư viện (+ CT cho chính tinh,
   ý nghĩa số). `tinh-yeu` còn lệch silo: `mang: "/hop-doi"` nhưng URL `/than-so/tinh-yeu` nên khối KT của `/hop-doi` không
   liệt kê (`cumCuaTru` lọc theo `truCua(duong)`, `lib/kien-thuc.ts:71`), chỉ tới qua "Đọc thêm" `/hop-doi` và thẻ bù.
8. **`/lich-am` (mục lục) — Mồ côi.** Không có ở menu, hub, chân trang (tất cả trỏ `/lich-am/{năm}`); breadcrumb của
   `/lich-am/{năm}` trỏ về `/doi-lich-am-duong` (`app/lich-am/[nam]/page.tsx:43`). Chỉ `/doi-lich-am-duong`? — không:
   `DoiLich.tsx:66` cũng trỏ năm. Thực tế không có link nào tới `/lich-am` ngoài sitemap (`app/sitemap.ts:17` priority 0,6).
   Tầm quan trọng thấp (mục lục), nhưng là URL index.
9. **`/phong-thuy/huong-hop-tuoi/cung-*` — 8 trang mới (AUD-Q2), chỉ tới từ mục lục cha.** Cha mạnh (M2) nên chấp nhận được;
   ghi để theo dõi vì sitemap cụm riêng (`lib/sitemap-cum.ts:22-25`).

Không có cụm nào "mồ côi hoàn toàn" (chỉ sitemap) trong 5 mảng; thư viện `/kien-thuc` liệt kê đủ 16 cụm KB + 3 cụm phụ nên
mọi cụm đều có ít nhất một lối 2 bấm (Huyền học → Thư viện → cụm). Vấn đề là lối đó đi qua trang trung gian và cuộn.

## 3. Thứ tự khối trên 5 trang công cụ

Khung chung `TrangCongCu` (`components/cms/TrangCongCu.tsx:26-43`), áp cho cả 5 + `/hop-doi`:
`{truoc}` → `DauCms` (H1 + lời dẫn + khối CMS trên) bọc **công cụ client (children)** → khối CMS "dưới" → **`CumKienThucTru`
"Kiến thức {mảng}"** → `BaiLienQuanMang` (bài blog) → `GioiThieuCongCu` ("Về công cụ…": giới thiệu, hỏi đáp FAQPage, "Đọc
thêm:" `lien_ket`) → `{sau}` → khối CMS "cuối" → chân trang (layout).

Hệ quả chung: **khối lối vào cụm kiến thức luôn là khối thứ 2 SAU toàn bộ công cụ**, bất kể người dùng đã nhập hồ sơ hay
chưa — nó nằm trong server component nên có mặt trong HTML ngay cả khi chưa có hồ sơ (khác `CuoiBaiDoc`), nhưng vị trí là
sau mọi nội dung công cụ. Không trang nào có tab / sub-nav trong mảng.

### /tu-vi (`app/tu-vi/TuVi.tsx:116-272`)
1. `DauMang` tiêu đề + lời dẫn (`:117`; render cả lúc chờ hồ sơ `:118`).
2. Section "Lá số": `XinThemDuLieu` nếu thiếu giờ/giới/nơi (`:124`); **dòng "Mới làm quen Tử vi? Xem 6 lá số mẫu" (`:125-127`) —
   lối vào KB duy nhất ở đầu trang, có cả khi chưa có hồ sơ**; thanh điều khiển (giao diện, trường phái); lá số SVG (`:181`);
   4 khối mở lưới: Đường bay tứ hoá (`:198`), 3 tháng tới (`:203`), Định giờ sinh (`:208`), Xem lá số 2 người `#hop-tham` (`:215`).
3. Section "Luận giải toàn bộ" + `CuoiBaiDoc moDun="tuvi"` (`:232-235`) — chỉ khi có lá số; `CuoiBaiDoc` chứa góp ý + CTA-1
   "Đọc tiếp về bạn" (chéo mảng, Sao, Bản đồ 5 mảng, mời) — **không chứa link cụm kiến thức**.
4. Section "Hỏi đáp chuyên sâu" (`:238-272`) — câu trả lời có khối hình `minh_hoa` với link "Đọc kỹ" sang trang KB (`TrucQuan.tsx:444`).
5. (TrangCongCu) khối CMS dưới → **"Kiến thức Tử vi" — khối thứ 6 từ trên, 5 cụm + 1 thẻ bù** → Bài viết liên quan → Về công cụ
   (Đọc thêm: 14 chính tinh, 12 cung, lá số mẫu — `so-trang.ts:130`) → chân trang.
Trước khi nhập hồ sơ: người dùng thấy 1 → `XinThemDuLieu` + dòng lá số mẫu → (bỏ qua 3) → khung hỏi đáp → Kiến thức Tử vi.
Vậy khối KT cách đầu trang ≈ 3 khối khi chưa có hồ sơ, ≈ 6 khối (nhiều màn hình) khi đã có lá số.

### /bat-tu (`app/bat-tu/BatTu.tsx:82-280`)
1. `DauMang` (`:82`). 2. Section "Tứ trụ": `XinThemDuLieu` (`:95`), thanh giao diện + năm xem (`:159-169`), lá số (`:188`),
khối gập Thai nguyên / Mệnh cung. 3. Section "Luận giải toàn bộ" `#luan-giai` + `CuoiBaiDoc moDun="battu"` (`:263-268`, chỉ khi có lá).
4. Hỏi đáp (`:271-280`). 5. (TrangCongCu) Kiến thức Bát tự (3 cụm, thẻ bù nếu cần) → bài viết → Về công cụ (Đọc thêm: thập thần,
nhật chủ, từ điển — `so-trang.ts:145`). **Không có link KB nào trong phần công cụ** (grep `Link href="/` trong BatTu.tsx: 0).
`/bat-tu/menh-theo-nam` (78 trang) chỉ xuất hiện ở khối KT thứ 5.

### /kinh-dich (`app/kinh-dich/KinhDich.tsx`)
1. Tiêu đề. 2. Khung hỏi: ô câu hỏi + chip chủ đề (`:265`), chế độ (`:274`), cách ra quẻ (`:279`), ô Mai Hoa (`:288-298`).
3. Kết quả quẻ (`DocQue`). 4. `LichSuQue` (`:310`). 5. `CuoiBaiDoc moDun="kinhdich"` chỉ khi `coQue` (`:311`). 6. (TrangCongCu)
"Kiến thức Kinh Dịch" = 1 cụm `/kinh-dich/que` + 2 thẻ bù (`/hom-nay#que-ngay`, `/tu-dien`) → bài viết → Về công cụ (Đọc thêm: 64 quẻ,
từ điển — `so-trang.ts:160`). **Không link `/kinh-dich/que` trong phần công cụ** (grep: 0). Người chưa gieo thấy khung gieo → KT ngay
sau (độ sâu cuộn ngắn hơn Tử vi), nhưng vẫn là khối sau công cụ.

### /phong-thuy (`app/phong-thuy/PhongThuy.tsx:68-120`)
1. `DauMang` (`:68`). 2. `HanhTrinhNha` 5 bước (`:72`). 3. Section "Mệnh quái" `#menh-quai`: `XinThemDuLieu` giới tính, khung
trường phái, la bàn (`:73-105`). 4. `DoHuongDienThoai` (`:107`). 5. `NhaCuaBan` `#nha-cua-ban` (`:113`). 6. `KhaoSatNha`
`#khao-sat-nha` (`:114`) — có link "Đọc kỹ" sang `/phong-thuy/dau-hieu/*` theo engine `trang` (Y5). 7. `HuyenKhong`
`#huyen-khong` (`:115`). 8. `CuoiBaiDoc moDun="phongthuy"` chỉ khi có mệnh quái (`:116`). 9. Hỏi đáp (`:118-120`).
10. (TrangCongCu) "Kiến thức Phong thuỷ" (3 cụm: dấu hiệu, hướng hợp tuổi, hướng xấu năm) → bài viết → Về công cụ (Đọc thêm:
hướng xấu năm, tuổi làm nhà, hướng hợp tuổi, từ điển, /huyen-hoc — `so-trang.ts:180`). Trang dài nhất (7 khối công cụ) trước
khi tới KT; bù lại 3 cụm Phong thuỷ đều có ở M2.
Hành trình nhà có neo `#menh-quai / #nha-cua-ban / #khao-sat-nha / #huyen-khong` — là điều hướng NỘI trang, không phải tới cụm.

### /than-so (`app/than-so/ThanSo.tsx:181-338`)
1. Tiêu đề; chưa hồ sơ → form (`:181`). 2. Khung "Cách xem" (trường phái, thu gọn, `:211-232`). 3. Section "Bốn con số cốt lõi"
(`:236`). 4. "Chân dung 4 mặt" (`:244-248`) + góp ý. 5. `BanDoConSo` (`:252`). 6. "Chiều sâu" `#dong-doi` (`:254-318`).
7. `CuoiBaiDoc moDun="thanso_sau" khongGopY` (`:320`). 8. `NoiDau` `#noi-dau` (`:323`). 9. Hỏi đáp `#hoi` (`:325-338`).
10. (TrangCongCu) "Kiến thức Thần số học" (6 cụm, kín lưới) → bài viết → Về công cụ (Đọc thêm 7 link — `so-trang.ts:86`).
Link ra ngoài duy nhất trong phần công cụ: nút "Nhập ngày sinh người ấy ở mục Hợp đôi" (`:91`). 12 trang "Ý nghĩa số" (chuyên gia
viết) nằm ở khối thứ 10.

Tóm tắt cho 5 trang: khối lối vào cụm = khối thứ **5–10** từ trên; hiện cả khi chưa nhập hồ sơ (server render) nhưng không
có trang nào đặt lối vào cụm ở nửa trên ngoài dòng "lá số mẫu" của Tử vi; `CuoiBaiDoc`/CTA-1 chỉ hiện khi có kết quả và
không trỏ cụm kiến thức; không có sub-nav.

## 4. Menu

- **Cấp 3: không hỗ trợ.** CMS `MenuDauTrang` có `muc` (mục cha, `maxRows: 7`, `cms/src/globals/MenuDauTrang.ts:83,92`) →
  `con` (menu con, `maxRows: 12`, `:107`) với trường `truongLienKet` + `mo_ta` (`:111-114`); không có mảng lồng thêm. Web
  `MucMenu.con: MenuCon[]` cũng phẳng (`web/lib/menu-dau-trang.ts:4-5`). Validate thêm: ≤ 5 mục cha hiện ở tab dưới điện
  thoại (`MenuDauTrang.ts:93`). Mặc định hiện dùng 6/7 cha (Bản thân · Hợp đôi · Huyền học · Năm · Blog · Tài khoản), 5/5 tab
  điện thoại (Blog `di_dong: false`); Huyền học **12/12** con, Năm **12/12** con — cả hai đã chạm trần, không thêm được mục
  con nào nếu không bỏ mục khác.
- **Menu con "Huyền học" (12 mục, `menu-dau-trang.ts:19-30`)**: Tử vi · Bát tự · Kinh Dịch · Phong thuỷ · Tuổi làm nhà · Hướng
  xấu năm · Tuổi xông đất · Sao hạn · Hướng nhà hợp tuổi · Dấu hiệu trong nhà · Thư viện · Từ điển. Tức là 4 công cụ gốc + 4
  công cụ lịch/tuổi + **2 cụm Phong thuỷ** + 2 trang thư viện. **Không có cụm nào của Tử vi, Bát tự, Kinh Dịch, Thần số**:
  thiếu `/tu-vi/sao-o-cung` (168), `/tu-vi/chinh-tinh` (14), `/tu-vi/cung` (12), `/tu-vi/tu-hoa` (48), `/tu-vi/la-so-mau` (6),
  `/kinh-dich/que` (64), `/bat-tu/menh-theo-nam` (78), `/bat-tu/thap-than` (10), `/bat-tu/nhat-chu` (10), và mọi cụm thần số
  (`/than-so/*` 92 trang). Tổng ≈ **512/536 trang kiến thức (95 %) không có mục menu nào trỏ tới cụm của mình**; chỉ Phong
  thuỷ (31 trang KB + tuổi) và `/hop-doi/cap-so` (45, ở menu Hợp đôi) có.
- Mảng Phong thuỷ chiếm 6/12 mục Huyền học (4 công cụ lịch/tuổi dân gian + 2 cụm), các mảng khác mỗi mảng 1 mục.
- Mục "Bản thân" (3 con) là mục cha của `/than-so` nhưng không chứa cụm thần số nào; mục "Hợp đôi" chứa `/hop-doi/cap-so`
  nhưng không chứa `/than-so/tinh-yeu` (cụm được khai `mang: "/hop-doi"`, `lib/kien-thuc.ts:23`).
- Menu "Năm {nam}" 12 con lặp 4 đích đã có ở Huyền học theo năm (sao hạn, làm nhà, xông đất, hướng xấu) — hợp lý cho mùa Tết
  nhưng tiêu 4/12 chỗ.
- `dangOMuc`/`mucDangO` (`menu-dau-trang.ts:55-87`): đang ở `/tu-vi/sao-o-cung/x` → mục cha "Huyền học" sáng (prefix `/tu-vi`),
  đúng; đang ở `/than-so/y-nghia-so/so-7` → "Bản thân" sáng; `/xem-ngay-tot/*` → "Bản thân"; `/nam/2027/tuoi-1990` → "Năm 2027".
  `/lich-am` và `/lich-am/2027`: "Năm" sáng nhờ con `/lich-am/{nam}` (prefix `/lich-am/2027` không khớp `/lich-am/2026`? —
  `thayNamMenu` thay bằng MỘT năm nên `/lich-am/2025` không làm mục nào sáng; tương tự `/xem-sao-han/2026` khi menu đang là 2027
  vẫn sáng nhờ `/xem-sao-han` ở Huyền học).

## 5. Lỗ hổng IA lớn nhất

1. **Cụm kiến thức không có lối vào cấp menu**: ≈ 512/536 trang KB (95 %) chỉ tới được qua khối cuối trang công cụ, hub, thư
   viện hoặc chân trang; 3 cụm lớn nhất (sao-ở-cung 168, mệnh theo năm 78, 64 quẻ 64 = 310 trang, 58 % KB) đều ở nhóm này
   (`menu-dau-trang.ts:18-31` không có mục cụm nào ngoài Phong thuỷ).
2. **Khối "Kiến thức {mảng}" đặt sau toàn bộ công cụ** (`TrangCongCu.tsx:33`): trên `/tu-vi` là khối thứ 6, `/phong-thuy` thứ 10,
   `/than-so` thứ 10. Người tới trang trụ qua Google để "đọc" (không nhập hồ sơ) phải cuộn qua form + khung hỏi đáp mới thấy
   cụm. Dòng lá số mẫu ở đầu `/tu-vi` (`TuVi.tsx:125`) là ngoại lệ duy nhất.
3. **Không có sub-nav trong mảng**: `DauMang` không có tab (`KhungMang.tsx:14-33`); từ `/tu-vi/sao-o-cung/x` sang
   `/tu-vi/tu-hoa` phải qua breadcrumb → trụ → cuộn xuống KT, hoặc menu → Thư viện → cụm (3 bấm + cuộn).
4. **Hub /huyen-hoc cắt cụm**: `slice(0, 4)` (`app/huyen-hoc/page.tsx:54`) bỏ lá số mẫu, nợ nghiệp, số kép (53 trang); Hợp đôi
   không có thẻ ở hub (`MANG_HH` 5 mảng, `lib/huyen-hoc.ts:11-17`) dù hub được khai là trụ "mọi công cụ".
5. **Menu Huyền học và Năm đã đầy 12/12** (`MenuDauTrang.ts:107`), 7 cha dùng 6; muốn thêm một cụm vào menu là phải bỏ một mục —
   hiện Phong thuỷ chiếm 6/12 (4 lịch-tuổi + 2 cụm) trong khi 4 mảng kia mỗi mảng 1 mục.
6. **150 trang ngày tốt theo việc ở độ sâu 3**: công cụ `/xem-ngay-tot` không link tới chúng (`duongViecThang` chỉ trong
   `[duong]/page.tsx`); đây là cụm có ý định giao dịch cao (cưới hỏi, khai trương) nhưng người dùng công cụ không thấy.
7. **Trang chủ chỉ mở 4 mảng + thần số**: `MANG` 4 thẻ (`app/page.tsx:44-49`), không có Hợp đôi, không thẻ nào trỏ cụm kiến
   thức; lối "kiến thức" từ trang chủ = chân trang hoặc 2 bấm qua hub/menu.
8. **Chân trang là lối "mạnh" nhất cho nhiều cụm**: `/kinh-dich/que`, `/tu-vi/chinh-tinh`, `/than-so/y-nghia-so`, lá số mẫu,
   cặp số chỉ có ở cột "Kiến thức" chân trang (`menu-chan-trang.ts:12-15`) ngoài khối cuối trang; cột này 9 link cho 16 cụm.
9. **Lệch silo nhỏ**: `/than-so/tinh-yeu` khai `mang: "/hop-doi"` nhưng xếp vào trụ Thần số bởi `truCua` (`lib/kien-thuc.ts:23,71`)
   → khối KT của `/hop-doi` không có nó; `/lich-am` mục lục không có link vào nào (breadcrumb trang năm về `/doi-lich-am-duong`,
   `app/lich-am/[nam]/page.tsx:43`).
10. **Thẻ bù CTA-2 bù lưới nhưng không bù lối**: thẻ bù đổi theo mảng (`loi-di-tiep-mac-dinh.json`), 5/6 nhóm trỏ công cụ hoặc
    từ điển, chỉ nhóm `/tu-vi` và `/hop-doi`/`/than-so` trỏ cụm KB của mảng khác — không giúp cụm của chính mảng lên cao hơn.

Số liệu tham chiếu: 1.575 URL (A §1); 536 trang KB + 6 lá số mẫu (A: 511 gồm 19 mục lục + 486 lá + 6 mẫu); menu 6 cha / 42 con;
hub 6 câu + 5 thẻ (≤ 4 chip/thẻ) + 12 ô; chân trang 15 + 9 link huyền học/kiến thức; 17 sitemap cụm (`lib/sitemap-cum.ts:12`).
