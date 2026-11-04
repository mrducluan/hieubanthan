# G — Rà soát điều hướng (navigation) trong các mảng, bằng ảnh chụp thật

Ngày: 2026-11-03 · Môi trường: web `next dev` + engine cục bộ (không khoá Supabase / PostHog / CMS → menu, chữ, khối
lối đi tiếp là bản mặc định trong code). Trình duyệt Chromium headless, `prefers-reduced-motion: reduce`.
Khung nhìn: **máy tính 1280×800** và **điện thoại 390×844** (deviceScaleFactor 1).
Hồ sơ mẫu trên máy (`localStorage`): Nguyễn Văn A · 24/10/1988 10:30 · nam · Hà Nội (+ đồng ý dữ liệu `dl1`).
Mỗi trang chụp **toàn trang** (`*.png`) và **màn hình đầu** (`*_man1.png`); 5 trang công cụ chụp thêm trạng thái
**chưa có hồ sơ** (`_chua`). Số đo lấy bằng `getBoundingClientRect` (px tính từ đỉnh tài liệu); "màn" = px ÷ chiều cao
khung nhìn (800 / 844). Không sửa mã nguồn.

Thư mục ảnh: `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/ui-nav/`
(83 ảnh; số đo thô: `do_dac.json`, `menu_desktop.json`, `them.txt`, kịch bản `chup.cjs`, `menu.cjs`, `them.cjs`).

---

## 0. Bộ khung điều hướng chung (đo trên mọi trang)

| Thành phần | Máy tính | Điện thoại |
|---|---|---|
| Thanh đầu trang | `header` **sticky**, cao **65 px**; 6 mục cha: Bản thân (x 534, w 110) · Hợp đôi · Huyền học (x 754, w 120) · Năm 2027 · Blog · Tài khoản. Nhãn cha là link, mũi tên là nút riêng "Mở menu …" | Logo + nút ☰ (`nut-menu`) ; **tab dưới cố định** 5 mục: Bản thân · Hợp đôi · Huyền học · Năm 2027 · Tài khoản (ảnh `mobile_tabduoi_tu-vi.png`) |
| Breadcrumb (`nav[aria-label="Đường dẫn"]`) | **Chỉ có** ở trang cụm / trang con kiến thức và `/nam/2027`; **không có** ở 5 trang công cụ, `/hop-doi`, `/huyen-hoc`, `/kien-thuc`, `/phong-thuy/huong-hop-tuoi`, `/xem-sao-han` | như máy tính |
| Thanh điều hướng phụ trong mảng (sub-nav / tab) | **Không có** ở mảng nào. Thứ duy nhất "sticky" trong `<main>` là thanh **"Các chương"** của báo cáo Bản đồ con số trên `/than-so` (nav 194 px, ở y 3758) — đó là mục lục báo cáo, không phải điều hướng mảng | như máy tính |
| Khối "Kiến thức {mảng}" | Có ở 6 trang công cụ (Tử vi 6 thẻ, Bát tự 3, Kinh Dịch 3, Phong thuỷ 3, Thần số 6, Hợp đôi 3), luôn nằm **sau** Hỏi đáp chuyên sâu, trước "Về công cụ" | như máy tính, thẻ xếp 1 cột |
| Chân trang ("Liên kết cuối trang") | 36 link, 4 cột: Huyền học (14) · Kiến thức (8) · Về chúng tôi · Pháp lý — cao 516 px | 1 cột, rất dài |

Nhận xét chung: trong mảng, người dùng chỉ có **hai lối** tới cụm kiến thức: (a) bảng thả xuống "Huyền học" / chân trang
(toàn site), (b) khối "Kiến thức {mảng}" ở gần cuối trang công cụ. Không có lối nào ở **vùng đầu trang** của mảng
(trừ một câu chữ nhỏ "Xem 6 lá số mẫu…" ở Tử vi).

---

## 1. Trang công cụ — lối vào cụm kiến thức có thấy ở màn hình đầu không?

| Trang | Trạng thái | Khối "Kiến thức {mảng}" ở độ sâu (máy tính) | (điện thoại) | Link cụm trong **màn hình đầu** | Tổng cao trang (PC / ĐT) |
|---|---|---|---|---|---|
| `/tu-vi` | có hồ sơ | **5 353 px = 6,7 màn** (sau Cung Mệnh, Lưu nguyệt, Đường bay, 3 tháng, Định giờ, 2 người, Cách cục, Đọc tiếp, Hỏi đáp) | **7 154 px = 8,5 màn** | 1 (chữ gạch chân "Xem 6 lá số mẫu được đọc từng bước" ở y 375, cỡ 15 px) | 7 393 / 10 694 |
| `/tu-vi` | chưa hồ sơ | 940 px = 1,2 màn (sau Hỏi đáp) | 1 159 px = 1,4 màn | 1 (câu trên, y 477) | 2 980 / 4 698 |
| `/bat-tu` | có hồ sơ | **2 402 px = 3,0 màn** | 3 688 px = 4,4 màn | **0** (chỉ `#luan-giai`) | 4 238 / 6 710 |
| `/bat-tu` | chưa hồ sơ | 820 px = 1,0 màn | 999 px = 1,2 màn | 0 | 2 656 / 4 020 |
| `/kinh-dich` | có / chưa (giống nhau — chưa gieo) | 959 px = 1,2 màn | 1 272 px = 1,5 màn | **0** | 2 783 / 4 351 |
| `/phong-thuy` | có hồ sơ | **5 482 px = 6,9 màn** | **8 504 px = 10,1 màn** | 0 link cụm; 5 link neo `#menh-quai… #huyen-khong` trong "Hành trình nhà bạn" | 7 338 / 11 649 |
| `/phong-thuy` | chưa hồ sơ | 3 909 px = 4,9 màn | 6 454 px = 7,7 màn | 0 (5 neo) | 5 765 / 9 599 |
| `/than-so` | có hồ sơ | **8 771 px = 11,0 màn** | **14 291 px = 16,9 màn** | 2 ("Đọc thêm về số 6 →", "số 7 →" — link một trang con, không phải cụm) | 10 870 / 17 837 |
| `/than-so` | chưa hồ sơ | 693 px = 0,87 màn (ngay dưới form) | 663 px = 0,79 màn | 3 thẻ (ý nghĩa số, nghề, tình yêu) hiện một phần | 2 792 / 4 209 |
| `/hop-doi` | có hồ sơ | 810 px = 1,0 màn | 1 286 px = 1,5 màn | 1 (`/tu-vi#hop-tham`) | 2 596 / 4 316 |

Kết luận mục 1:
- Khi **chưa có hồ sơ**, khối Kiến thức nằm ngay màn 1–1,5 (Thần số: lộ 3 thẻ ngay màn đầu) → người mới tìm được.
- Khi **đã có hồ sơ** (người quay lại — nhóm đông nhất theo mục tiêu QUAY LẠI), khối bị đẩy xuống **3–11 màn** máy tính,
  **4,4–16,9 màn** điện thoại. Ở Thần số/Tử vi/Phong thuỷ, người dùng phải cuộn qua toàn bộ báo cáo + "Đọc tiếp về bạn"
  + Hỏi đáp mới tới. Với tỉ lệ cuộn hết bài thấp (đo `reading_completed`), đa số sẽ không bao giờ thấy lối vào cụm.
- Màn hình đầu của 4/5 trang công cụ (Bát tự, Kinh Dịch, Phong thuỷ, Thần số có hồ sơ) **không có link nào** sang cụm
  kiến thức của chính mảng đó; Tử vi có đúng một dòng chữ inline.
- Hub `/huyen-hoc` và thư viện `/kien-thuc` **không được link** từ thân (`<main>`) của bất kỳ trang công cụ nào, trừ
  Phong thuỷ (link "Các hệ thống khác" → `/huyen-hoc` ở y 6 439) — tức là chỉ qua menu / chân trang.

Ảnh:
- `tu-vi_desktop_co_man1.png`, `tu-vi_desktop_co.png` (toàn trang 7 393 px), `tu-vi_desktop_chua_man1.png`,
  `tu-vi_mobile_co_man1.png`, `tu-vi_mobile_co.png`, `tu-vi_mobile_chua_man1.png`
- `bat-tu_desktop_co_man1.png`, `bat-tu_desktop_chua_man1.png`, `bat-tu_mobile_co.png`, `bat-tu_mobile_chua.png`
- `kinh-dich_desktop_co_man1.png`, `kinh-dich_mobile_co.png`
- `phong-thuy_desktop_co_man1.png`, `phong-thuy_desktop_co.png`, `phong-thuy_mobile_co.png` (11 649 px)
- `than-so_desktop_co_man1.png`, `than-so_desktop_co.png`, `than-so_desktop_chua_man1.png`, `than-so_mobile_co.png` (17 837 px)
- `hop-doi_desktop_co_man1.png`, `hop-doi_mobile_co.png`

---

## 2. Thanh điều hướng phụ trong mảng và breadcrumb

- **Không có sub-nav / tab nào ở cấp mảng** (Tử vi · Bát tự · Kinh Dịch · Phong thuỷ · Thần số). Đo mọi phần tử
  `position: sticky|fixed` trong `<main>`: chỉ có thanh "Các chương" của báo cáo Bản đồ con số (`/than-so`, y 3 758,
  cao 194 px) và nó chỉ xuất hiện sau khi cuộn tới báo cáo. Trang Tử vi / Bát tự có hồ sơ không có thanh chương sticky
  nào ở vùng đã chụp (báo cáo Tử vi gập từ chương 2 nên thanh chỉ hiện khi mở).
- **Breadcrumb**:
  - 5 trang công cụ + `/hop-doi`: **không có**. Thay vào đó là nhãn eyebrow "HUYỀN HỌC" (thẻ `<p>`, **không phải link**,
    y 117 máy tính / 101 điện thoại, chữ 11–12 px tracking rộng) — nhìn như breadcrumb nhưng không bấm được. Trên
    `/than-so` eyebrow là "THẦN SỐ HỌC CỦA BẠN" (cũng không link).
  - Trang cụm `/tu-vi/sao-o-cung`, `/kinh-dich/que`: breadcrumb có, nhưng chỉ **một mục** "Tử vi ›" / "Kinh Dịch ›",
    chữ **12 px**, màu `rgb(138,136,172)` (xám tím mờ), cao 16 px, nằm y 105 (ngay dưới header 65 px). Không có
    "Trang chủ", không có "Huyền học" (lệch với quyết định HH-1 "Trang chủ › Huyền học › {công cụ}"; QH-URL ghi breadcrumb
    = đường dẫn).
  - Trang con `/tu-vi/sao-o-cung/tu-vi-cung-menh`: 2 mục "Tử vi › Chính tinh ở từng cung Tử vi ›", cùng cỡ 12 px.
  - `/phong-thuy/huong-hop-tuoi` (trang cụm của Phong thuỷ, 8 cung phi): **không có breadcrumb**, eyebrow
    "PHONG THUỶ · BÁT TRẠCH" không link; thân trang không có link nào về `/phong-thuy` (0 link tới trang công cụ).
  - `/xem-sao-han`: không breadcrumb; eyebrow "TỤC LỆ THEO TUỔI".
  - `/nam/2027`: breadcrumb 14 px "Xem theo năm" → `/nam` (1 mục).
  - `/huyen-hoc`, `/kien-thuc`: không breadcrumb (hợp lý vì là trang trụ cấp 1).

Ảnh: `tu-vi_sao-o-cung_desktop_co_man1.png` (breadcrumb 12 px ở y 105), `tu-vi_sao-o-cung_tu-vi-cung-menh_desktop_co_man1.png`,
`kinh-dich_que_mobile_co_man1.png`, `phong-thuy_huong-hop-tuoi_desktop_co_man1.png`, `xem-sao-han_desktop_co_man1.png`,
`nam_2027_desktop_co_man1.png`.

---

## 3. Thanh "chế độ" đầu trang Tử vi + khung "Trường phái"

Đo trên `/tu-vi` có hồ sơ (ảnh `tu-vi_desktop_co_man1.png`, `tu-vi_mobile_co_man1.png`):

| Phần tử | Máy tính (y, x, w×h) | Điện thoại (y, x, w×h) |
|---|---|---|
| Đêm sao / Giấy cổ (segmented) | y 417, x 101, 113×36 + 105×36 | y 480, x 21/134 |
| ‹ Năm 2026 · Bính Ngọ › | y 417, x ~340, w ~230 | y 537, w ~230 |
| Lớp đại hạn / Lớp lưu niên | y 418, x 582/705, 111×34 | y 537/588 (xuống 2 hàng) |
| Tải ảnh | y 417, x 1076, 108×36 | y 587, x 266 |
| Khung "Trường phái" (4 chip + nút Đổi) | y 477, **1 086×72** | y 640, **356×128** |
| Lá số (SVG) bắt đầu | y **566** | y **859** |

- Máy tính: từ H1 (y 165) tới lá số (y 566) có 401 px; trong đó thanh chế độ + Trường phái chiếm **149 px** (y 417–549),
  còn lại là lời dẫn 3 dòng + chip "Diễn giải từ kho tri thức…" + câu "Mới làm quen Tử vi?". Lá số chỉ lộ **234 px** trong
  màn đầu 800 px.
- Điện thoại: thanh chế độ gãy thành **3 hàng** (y 480–624) rồi khung Trường phái **128 px** (y 640–768) → vùng điều khiển
  cao **288 px = 34 % màn**; lá số bắt đầu ở y 859 = **sau màn đầu** (844). Người dùng điện thoại nhìn màn đầu thấy:
  tiêu đề, lời dẫn, 6 nút, khung Trường phái, và không thấy lá số.
- Dễ nhầm thành điều hướng: 6 nút cùng dáng viên thuốc (pill) với chip "Diễn giải từ kho tri thức" phía trên và 4 chip
  Trường phái phía dưới; chúng nằm đúng vị trí mà sản phẩm cùng loại thường đặt **tab phụ của mảng**. "Lớp đại hạn /
  Lớp lưu niên" trông như 2 tab nhưng là công tắc lớp vẽ; "‹ Năm 2026 ›" trông như bộ chuyển trang. Không có nhãn nhóm
  ("Hiển thị:") nên toàn bộ dải đọc như một thanh nav 3 nhóm. Khung Trường phái đã thu gọn (chip tóm tắt + "Đổi") là hợp
  lý, nhưng trên điện thoại 4 chip xếp 3 hàng vẫn tốn 128 px.
- Bát tự: không có thanh chế độ; khối "Lá số chi tiết (cho người đã biết Bát tự)" gập ở y 608. Phong thuỷ: khung
  Trường phái 766×72 ở y 688 (sau Hành trình nhà bạn). Thần số: khung "Cách xem" 1 086×66 ở y 266 (ngay dưới tên) +
  4 nút "Xem cách tính" trong 4 thẻ số.

---

## 4. Menu thả xuống "Huyền học" (12 mục) và menu điện thoại

Máy tính (ảnh `menu_Huyen_hoc_desktop.png`, số đo `menu_desktop.json`):
- Bảng **576×386 px** (y 60–446), lưới **2 cột × 6 hàng** (277 px/cột), mỗi mục 59 px (mục "Sao hạn theo tuổi" 75 px do
  mô tả xuống 2 dòng). Thứ tự đọc là theo hàng (Tử vi → Bát tự → Kinh Dịch → Phong thuỷ → Tuổi làm nhà → Hướng xấu năm →
  Xông đất → Sao hạn → Hướng hợp tuổi → Dấu hiệu nhà → Thư viện → Từ điển).
- **Không có tiêu đề nhóm** và không có vạch ngăn: 4 công cụ gốc, 4 công cụ lịch & tuổi, 2 tra cứu Phong thuỷ, 2 tra cứu
  chung bị trộn trong cùng lưới; mô tả 12 px mỗi mục làm bảng dày chữ (24 dòng chữ trong 386 px).
- Thiếu trong bảng: hub `/huyen-hoc` chỉ tới được qua **nhãn cha** (link) — trong bảng không có mục "Tất cả Huyền học";
  không có cụm kiến thức của mảng (`/tu-vi/chinh-tinh`, `/tu-vi/cung`, `/tu-vi/sao-o-cung`, `/tu-vi/tu-hoa`,
  `/tu-vi/la-so-mau`, `/bat-tu/*`, `/kinh-dich/que`) — người tìm "ý nghĩa sao X ở cung Y" phải vào Thư viện kiến thức rồi
  cuộn. Thần số học và Hợp đôi nằm ở mục cha khác (Bản thân / Hợp đôi) — đúng quyết định HH-1 nhưng khiến bảng
  "Huyền học" không chứa 1/5 mảng của hub.
- Các bảng khác: Bản thân 288×243 (3 mục), Hợp đôi 288×210 (3 mục), Năm 2027 2 cột 12 mục (cùng kiểu, cùng độ dày).
- Rê chuột: bảng mở khi hover, giữ khi bấm mũi tên; Esc đóng — đúng. Bấm nhãn cha đi thẳng `/huyen-hoc`.

Điện thoại (ảnh `menu_mobile_mo.png`, `menu_mobile_mo_full.png`, `mobile_tabduoi_tu-vi.png`):
- Sheet "Menu" trượt từ dưới, chiếm gần hết màn (đỉnh y ≈ 70). Nội dung cao **1 440 px**, **37 link**, cuộn trong sheet
  (≈ 1,9 màn). Nhóm Huyền học bắt đầu ở y ≈ 548 (trong sheet), nhóm Năm 2027 (12 mục) ở màn thứ hai của sheet.
- Trong sheet, mỗi nhóm cũng xếp **2 cột** có mô tả 11–12 px (như bảng máy tính) → cột chỉ ~160 px, mô tả gãy 2–3 dòng,
  khó quét.
- Tab dưới 5 mục (Bản thân · Hợp đôi · Huyền học · Năm 2027 · Tài khoản): mục cha "Huyền học" sáng khi ở `/tu-vi`
  (đúng); bấm tab đi tới `/huyen-hoc` — tốt, nhưng từ `/tu-vi` không có cách nào nhảy sang Bát tự / Kinh Dịch nhanh hơn
  2 chạm (tab → hub → thẻ) hoặc ☰ → cuộn.
- Nút nổi "N" (Next.js dev) ở góc trái dưới là của môi trường dev, không tính.

---

## 5. Trang cụm và trang con — lối về công cụ / sang cụm bên cạnh

- `/tu-vi/sao-o-cung` (ảnh `tu-vi_sao-o-cung_desktop_co_man1.png`, toàn trang 13 701 px / điện thoại **27 067 px**):
  đầu trang chỉ có breadcrumb 12 px "Tử vi ›" là lối về công cụ; **không có** link sang cụm bên cạnh (chính tinh, cung,
  tứ hoá, lá số mẫu) ở đầu hay cuối trang (`linkCumKhac` = 0; 168 thẻ con xếp 2 cột liên tục, không mục lục theo sao,
  không nhảy nhanh). Người xem cuộn 17 màn máy tính / 32 màn điện thoại.
- `/kinh-dich/que` (`kinh-dich_que_desktop_co_man1.png`, 5 407 / 11 430 px): tương tự — breadcrumb 1 mục, 64 thẻ, 0 link
  cụm khác, không bộ lọc / mục lục 8 quái.
- `/tu-vi/sao-o-cung/tu-vi-cung-menh` (`tu-vi_sao-o-cung_tu-vi-cung-menh_desktop_co.png`): lối về: breadcrumb 12 px
  (2 mục) + nút "Xem của tôi" → `/tu-vi` ở y 3 800 (4,75 màn). Khối "Đọc tiếp" ở y 3 926 có **4 link**: Sao Tử Vi,
  Cung Mệnh, Tử Vi ở cung Huynh Đệ, Tử Vi ở cung Phụ Mẫu (trước/sau theo vòng 12 cung) — có chip inline "Cung Mệnh →",
  "Sao Tử Vi →", "Hoá Khoa cung Mệnh →"… rải trong bài. Không có link tới `/tu-vi/sao-o-cung` ngoài breadcrumb, không có
  lối sang `/tu-vi/tu-hoa` / `/tu-vi/la-so-mau`.
- `/phong-thuy/huong-hop-tuoi` (`phong-thuy_huong-hop-tuoi_desktop_co_man1.png`): **0 link** tới `/phong-thuy`,
  không breadcrumb; chỉ có 8 thẻ cung phi + bảng 46 năm. Người vào từ Google ở trang này không thấy công cụ đo hướng.
- `/xem-sao-han` (`xem-sao-han_desktop_co_man1.png`): không breadcrumb; thân có 1 link "Lá số Tử vi của bạn" và 1 link
  `/phong-thuy/huong-xau-nam` ở y 1 397.
- `/nam/2027` (`nam_2027_desktop_co_man1.png`): breadcrumb "Xem theo năm"; 12 ô "Thông tin năm" rồi "Năm 2027 của riêng
  bạn" ở y 742 — lối tới công cụ nằm ở 0,93 màn; menu con "Năm 2027" là nơi duy nhất liệt kê 12 trang con của cụm năm.
- `/huyen-hoc` (`huyen-hoc_desktop_co_man1.png`): hub tốt — 5 mảng trong hình + 6 câu băn khoăn + 5 thẻ + bảng so sánh;
  link tới cụm kiến thức bắt đầu ở y 1 616 (2 màn); link `/kien-thuc` ở y 4 647 (5,8 màn).
- `/kien-thuc` (`kien-thuc_desktop_co_man1.png`): nhóm theo mảng, mỗi nhóm có "Mở công cụ →" (12 px, góc phải, y 295…)
  — lối về công cụ nhỏ; không có mục lục nhảy theo mảng ở đầu trang (Phong thuỷ ở y 2 748 = 3,4 màn; điện thoại 6 458 px).

---

## 6. Phát hiện cụ thể (xếp theo mức độ)

| # | Trang · vị trí | Phát hiện | Số đo | Ảnh | Mức |
|---|---|---|---|---|---|
| 1 | `/than-so`, `/tu-vi`, `/phong-thuy` có hồ sơ · khối "Kiến thức {mảng}" | Lối vào cụm kiến thức của mảng chỉ xuất hiện sau toàn bộ báo cáo + Đọc tiếp + Hỏi đáp | Thần số 8 771 px (11 màn PC) / 14 291 px (16,9 màn ĐT); Tử vi 5 353 / 7 154 px; Phong thuỷ 5 482 / 8 504 px | `than-so_desktop_co.png`, `tu-vi_mobile_co.png`, `phong-thuy_mobile_co.png` | **Nặng** |
| 2 | 5 trang công cụ · màn hình đầu | Không có thẻ / tab / link cụm kiến thức nào trong màn đầu (Bát tự, Kinh Dịch, Phong thuỷ, Thần số có hồ sơ: 0 link; Tử vi: 1 dòng chữ inline 15 px) | `linkManDau` cụm = 0 / 0 / 0 / 2 (trang con) / 1 | `*_desktop_co_man1.png` | **Nặng** |
| 3 | `/tu-vi` điện thoại có hồ sơ · vùng y 480–768 | Thanh chế độ gãy 3 hàng + khung Trường phái 128 px → 288 px (34 % màn) điều khiển trước lá số; lá số bắt đầu ngoài màn đầu (y 859) | 6 nút + 4 chip + "Đổi" | `tu-vi_mobile_co_man1.png` | **Nặng** |
| 4 | `/tu-vi/sao-o-cung` · toàn trang | 168 thẻ liên tục, không mục lục theo sao / cung, không link cụm cạnh; breadcrumb về Tử vi 12 px là lối ra duy nhất ở đầu | 13 701 px PC (17 màn) · **27 067 px ĐT (32 màn)** | `tu-vi_sao-o-cung_desktop_co.png`, `tu-vi_sao-o-cung_mobile_co.png` | **Nặng** |
| 5 | Menu "Huyền học" máy tính · bảng thả xuống | 12 mục 2×6 không nhóm, không tiêu đề nhóm, trộn công cụ gốc / lịch & tuổi / tra cứu; mô tả 12 px mọi mục | 576×386 px, 24 dòng chữ | `menu_Huyen_hoc_desktop.png` | Vừa |
| 6 | Menu điện thoại (☰) | 37 link, nội dung 1 440 px cuộn trong sheet; nhóm 2 cột hẹp ~160 px với mô tả 2–3 dòng; Năm 2027 (12 mục) ở màn 2 của sheet | 1 440 px / 844 | `menu_mobile_mo.png`, `menu_mobile_mo_full.png` | Vừa |
| 7 | 5 trang công cụ + `/hop-doi` · eyebrow "HUYỀN HỌC" y 117 | Nhãn nhìn như breadcrumb cấp cha nhưng là `<p>` không link; không có breadcrumb thật dù HH-1 ghi "Trang chủ › Huyền học › {công cụ}" | `<p>`, 11–12 px, `link:false` | `tu-vi_desktop_co_man1.png`, `bat-tu_desktop_co_man1.png` | Vừa |
| 8 | Trang cụm / trang con · breadcrumb | Chữ 12 px màu `rgb(138,136,172)` cao 16 px, chỉ 1–2 mục, không "Trang chủ" / "Huyền học"; mục hiện tại không hiển thị | y 105 PC / 89 ĐT | `tu-vi_sao-o-cung_tu-vi-cung-menh_desktop_co_man1.png`, `kinh-dich_que_mobile_co_man1.png` | Vừa |
| 9 | `/phong-thuy/huong-hop-tuoi` | Trang cụm của Phong thuỷ không có breadcrumb, 0 link về `/phong-thuy`, 0 link sang `/phong-thuy/dau-hieu`, `/huong-xau-nam` trong thân | `linkTool` = [] | `phong-thuy_huong-hop-tuoi_desktop_co_man1.png`, `phong-thuy_huong-hop-tuoi_mobile_co.png` | Vừa |
| 10 | `/tu-vi` máy tính có hồ sơ · y 417–549 | 6 nút pill cùng dáng chip trên/dưới, không nhãn nhóm → đọc như thanh tab của mảng; "Lớp đại hạn / Lớp lưu niên" giống 2 tab, "‹ Năm 2026 ›" giống phân trang | lá số lộ 234 px trong màn đầu | `tu-vi_desktop_co_man1.png` | Vừa |
| 11 | `/kinh-dich/que` | 64 thẻ không lọc theo quái / không mục lục; breadcrumb 1 mục | 5 407 px PC / 11 430 px ĐT | `kinh-dich_que_desktop_co.png`, `kinh-dich_que_mobile_co.png` | Vừa |
| 12 | Trang con `/tu-vi/sao-o-cung/tu-vi-cung-menh` · cuối bài | "Đọc tiếp" 4 link (sao, cung, cung trước/sau) — không có lối tới cụm Tứ hoá / Lá số mẫu / mục lục cụm; nút "Xem của tôi" ở 4,75 màn | y 3 926 / 5 069 | `tu-vi_sao-o-cung_tu-vi-cung-menh_desktop_co.png` | Nhẹ |
| 13 | `/kien-thuc` | "Mở công cụ →" 12 px góc phải mỗi nhóm; không mục lục nhảy mảng ở đầu; Phong thuỷ ở 3,4 màn PC / 6 458 px ĐT | — | `kien-thuc_desktop_co_man1.png`, `kien-thuc_mobile_co.png` | Nhẹ |
| 14 | Hub `/huyen-hoc` | Không có link ngược từ thân trang công cụ về hub (trừ Phong thuỷ ở y 6 439); hub chỉ tới được qua nhãn cha / tab dưới; bảng thả xuống không có mục "Tất cả Huyền học" | — | `huyen-hoc_desktop_co_man1.png` | Nhẹ |
| 15 | `/xem-sao-han`, `/nam/2027` | Không breadcrumb / breadcrumb 1 mục "Xem theo năm"; từ `/xem-sao-han` không có lối tới `/nam/{năm}` hay hub lịch & tuổi ngoài menu | — | `xem-sao-han_desktop_co_man1.png`, `nam_2027_mobile_co.png` | Nhẹ |

Điểm đã làm tốt (để không sửa nhầm): nhãn cha menu là link thật + mũi tên riêng (bàn phím, Esc); tab dưới điện thoại
sáng đúng mục cha; trang chưa có hồ sơ đặt khối Kiến thức ngay màn 1–1,5; hub `/huyen-hoc` có 5 lối vào theo câu băn
khoăn; trang con có chip inline sang trang sao / cung liên quan.

---

## 7. Pattern tham khảo ở sản phẩm cùng loại (chỉ liệt kê, không đề xuất phương án)

- **Sub-nav dính dưới header** cho một mảng (vd. "Lá số · Luận giải · 3 tháng tới · Kiến thức · Lá số mẫu"), cao
  40–48 px, cuộn ngang trên điện thoại; thường dùng ở trang hồ sơ nhiều phần (ngân hàng, y tế, Notion docs).
- **Tab trong trang** tách "Của tôi" ↔ "Tra cứu" ngay dưới H1 (Co-Star, The Pattern): nội dung cá nhân và kiến thức
  không xếp nối tiếp theo chiều dọc.
- **Mega-menu 3 cột có tiêu đề nhóm** ("Công cụ" · "Lịch & tuổi" · "Tra cứu") + một link "Xem tất cả" ở chân bảng
  (Shopify, Atlassian): 12 mục vẫn quét được trong 1 giây.
- **Thẻ cụm ở đầu trang / hàng chip cuộn ngang** ngay dưới lời dẫn (báo điện tử, Wikipedia mobile "In this article"):
  người quay lại thấy cụm kiến thức mà không phải cuộn qua báo cáo.
- **Mục lục / bộ lọc dính** ở trang danh sách dài (14 sao → neo; 8 quái → lọc) và **prev/next cùng cấp + "Về mục lục"**
  ở trang con (MDN, docs).
- **Breadcrumb đủ cấp, ≥ 14 px, mục cuối là trang hiện tại** (Google SERP cũng đọc BreadcrumbList).
- **Thanh công cụ hiển thị có nhãn nhóm** ("Giao diện:", "Năm:", "Lớp:") hoặc gom vào một nút "Tuỳ chọn hiển thị"
  trên điện thoại, tách khỏi vùng nav (Figma, Google Maps lớp bản đồ).

---

## 8. Danh sách ảnh (đường dẫn tuyệt đối)

Thư mục: `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/ui-nav/`

Menu:
- `.../ui-nav/menu_Huyen_hoc_desktop.png` — bảng "Huyền học" mở (rê chuột), 1280×800
- `.../ui-nav/menu_Ban_than_desktop.png`, `.../ui-nav/menu_Hop_doi_desktop.png`, `.../ui-nav/menu_Nam_2027_desktop.png`, `.../ui-nav/menu_Tai_khoan_desktop.png`
- `.../ui-nav/menu_mobile_mo.png` — sheet Menu điện thoại (màn đầu), `.../ui-nav/menu_mobile_mo_full.png`
- `.../ui-nav/mobile_tabduoi_tu-vi.png` — tab dưới điện thoại ở `/tu-vi` (chưa hồ sơ)

Trang công cụ (mỗi trang: `_desktop_co`, `_desktop_chua`, `_mobile_co`, `_mobile_chua`, mỗi cái có bản toàn trang và `_man1`):
- `.../ui-nav/tu-vi_desktop_co.png` · `tu-vi_desktop_co_man1.png` · `tu-vi_desktop_chua.png` · `tu-vi_desktop_chua_man1.png` · `tu-vi_mobile_co.png` · `tu-vi_mobile_co_man1.png` · `tu-vi_mobile_chua.png` · `tu-vi_mobile_chua_man1.png`
- `.../ui-nav/bat-tu_desktop_co.png` · `bat-tu_desktop_co_man1.png` · `bat-tu_desktop_chua.png` · `bat-tu_desktop_chua_man1.png` · `bat-tu_mobile_co.png` · `bat-tu_mobile_co_man1.png` · `bat-tu_mobile_chua.png` · `bat-tu_mobile_chua_man1.png`
- `.../ui-nav/kinh-dich_desktop_co.png` · `kinh-dich_desktop_co_man1.png` · `kinh-dich_desktop_chua.png` · `kinh-dich_desktop_chua_man1.png` · `kinh-dich_mobile_co.png` · `kinh-dich_mobile_co_man1.png` · `kinh-dich_mobile_chua.png` · `kinh-dich_mobile_chua_man1.png`
- `.../ui-nav/phong-thuy_desktop_co.png` · `phong-thuy_desktop_co_man1.png` · `phong-thuy_desktop_chua.png` · `phong-thuy_desktop_chua_man1.png` · `phong-thuy_mobile_co.png` · `phong-thuy_mobile_co_man1.png` · `phong-thuy_mobile_chua.png` · `phong-thuy_mobile_chua_man1.png`
- `.../ui-nav/than-so_desktop_co.png` · `than-so_desktop_co_man1.png` · `than-so_desktop_chua.png` · `than-so_desktop_chua_man1.png` · `than-so_mobile_co.png` · `than-so_mobile_co_man1.png` · `than-so_mobile_chua.png` · `than-so_mobile_chua_man1.png`

Trang khác (có hồ sơ; bản toàn trang + `_man1`, máy tính + điện thoại):
- `.../ui-nav/hop-doi_desktop_co.png` · `hop-doi_desktop_co_man1.png` · `hop-doi_mobile_co.png` · `hop-doi_mobile_co_man1.png`
- `.../ui-nav/huyen-hoc_desktop_co.png` · `huyen-hoc_desktop_co_man1.png` · `huyen-hoc_mobile_co.png` · `huyen-hoc_mobile_co_man1.png`
- `.../ui-nav/kien-thuc_desktop_co.png` · `kien-thuc_desktop_co_man1.png` · `kien-thuc_mobile_co.png` · `kien-thuc_mobile_co_man1.png`
- `.../ui-nav/nam_2027_desktop_co.png` · `nam_2027_desktop_co_man1.png` · `nam_2027_mobile_co.png` · `nam_2027_mobile_co_man1.png`
- `.../ui-nav/tu-vi_sao-o-cung_desktop_co.png` · `tu-vi_sao-o-cung_desktop_co_man1.png` · `tu-vi_sao-o-cung_mobile_co.png` · `tu-vi_sao-o-cung_mobile_co_man1.png`
- `.../ui-nav/tu-vi_sao-o-cung_tu-vi-cung-menh_desktop_co.png` · `..._desktop_co_man1.png` · `..._mobile_co.png` · `..._mobile_co_man1.png`
- `.../ui-nav/kinh-dich_que_desktop_co.png` · `kinh-dich_que_desktop_co_man1.png` · `kinh-dich_que_mobile_co.png` · `kinh-dich_que_mobile_co_man1.png`
- `.../ui-nav/phong-thuy_huong-hop-tuoi_desktop_co.png` · `..._desktop_co_man1.png` · `..._mobile_co.png` · `..._mobile_co_man1.png`
- `.../ui-nav/xem-sao-han_desktop_co.png` · `xem-sao-han_desktop_co_man1.png` · `xem-sao-han_mobile_co.png` · `xem-sao-han_mobile_co_man1.png`

Số đo thô: `.../ui-nav/do_dac.json` (mọi trang), `.../ui-nav/menu_desktop.json`, `.../ui-nav/them.txt`, tóm tắt `.../ui-nav/tomtat.txt`.

Giới hạn: chạy trên `next dev` không CMS → menu / chữ là bản mặc định trong code (`lib/menu-dau-trang.ts`,
`lib/so-trang.ts`); production có thể khác nếu biên tập đã sửa menu. Hỏi đáp / luận giải AI không gọi (không khoá) nên
các khối "đang chờ AI" không ảnh hưởng vị trí đo (vị trí khối Kiến thức tính sau khi trang ổn định 8–9 giây).
