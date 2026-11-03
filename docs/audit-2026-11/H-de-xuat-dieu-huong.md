# H — Đánh giá lối vào các cụm trang + 3 phương án điều hướng (2026-11-03)

> **Trạng thái:** chủ dự án "đồng ý hết" (A + C-2, menu đổi 3 mục, gom "Hiển thị", tên theo việc, đợt 1 = 6 thanh, nhãn
> sửa ở CMS) → đã làm ở TM-1 (CLAUDE.md). Lệch so với minh hoạ: Kinh Dịch "Quẻ đầu ngày" → "Quẻ theo giờ" (quẻ đầu ngày
> cần hồ sơ ở /hom-nay); bảng "Hiển thị" mở NGAY DƯỚI hàng điều khiển (không phải popover nổi) vì khung Trường phái có
> lời giải thích dài; điện thoại còn 2 hàng (không phải 1) — 4 nút không vừa 358 px.

Tổng hợp từ hai báo cáo cùng thư mục: `F-loi-vao-menu.md` (kiểm kê code: cụm nào có lối vào ở đâu) và
`G-ui-dieu-huong.md` (82 ảnh chụp thật ở 1280 px và 390 px, có / chưa có hồ sơ). Chưa sửa gì trong mã.

## 1. Kết luận ngắn

1. **Menu đầu trang chỉ có 2 cấp** (cha + con), CMS khoá cứng 7 cha / 12 con, **không có cấp 3**. Hai mục "Huyền học" và
   "Năm 2027" đã đầy 12/12. Menu con "Huyền học" chứa 4 công cụ gốc + 4 công cụ lịch & tuổi + 2 cụm Phong thuỷ + Thư viện +
   Từ điển — **không có cụm kiến thức nào của Tử vi, Bát tự, Kinh Dịch, Thần số**. Hệ quả: ≈ 512 / 536 trang kiến thức
   (95 %) không có mục menu nào trỏ tới cụm của mình.
2. **Trong thân trang công cụ, lối vào cụm kiến thức là khối "Kiến thức {mảng}" đặt SAU toàn bộ báo cáo + hỏi đáp.** Khi đã
   có hồ sơ: Thần số 8.771 px (11 màn máy tính) / 14.291 px (17 màn điện thoại); Tử vi 5.353 / 7.154 px; Phong thuỷ
   5.482 / 8.504 px; Bát tự 2.402 / 3.688 px. Chưa có hồ sơ thì ở màn 0,8–1,5 (ổn).
3. **Không mảng nào có thanh điều hướng phụ (sub-nav / tab).** 5 trang công cụ không có breadcrumb; dòng "HUYỀN HỌC" phía
   trên H1 là chữ tĩnh, nhìn như breadcrumb nhưng không bấm được. Trang cụm / trang con có breadcrumb 12 px màu mờ, 1–2
   mục, không có "Trang chủ › Huyền học" (lệch quyết định HH-1 / QH-URL).
4. **Thanh chế độ ở đầu /tu-vi** (Đêm sao / Giấy cổ · ‹ Năm 2026 › · Lớp đại hạn / Lớp lưu niên · Tải ảnh + khung Trường
   phái) trên điện thoại gãy 3 hàng, chiếm 288 px = 34 % màn hình, lá số bắt đầu ở y 859 (ngoài màn đầu). Máy tính: 6 nút
   pill không nhãn nhóm → đọc như thanh tab của mảng ("Lớp đại hạn / Lớp lưu niên" giống 2 tab, "‹ Năm 2026 ›" giống phân
   trang). Đây là lý do anh thấy "menu con" ở trang Tử vi mà không rõ nó dẫn đi đâu: nó không dẫn đi đâu cả, chỉ đổi cách
   hiển thị lá số.
5. **Trang cụm dài không có mục lục**: `/tu-vi/sao-o-cung` 168 thẻ liên tục, 13.701 px máy tính / 27.067 px điện thoại
   (32 màn), không lọc theo sao hay theo cung, 0 link sang cụm bên cạnh; `/kinh-dich/que` 64 thẻ, 11.430 px điện thoại.
6. Lỗi lẻ: hub `/huyen-hoc` cắt mỗi mảng còn 4 chip (`slice(0,4)`) → mất Nợ nghiệp, Số kép, Lá số mẫu; `/lich-am` (mục
   lục) không có link nào trỏ vào; `/phong-thuy/huong-hop-tuoi` không có link về `/phong-thuy`; cụm "tình yêu" ghi mảng
   `/hop-doi` nhưng xếp dưới trụ Thần số; 150 trang `/xem-ngay-tot/{việc}-thang-*` ở độ sâu 3, công cụ `/xem-ngay-tot`
   không link tới.

## 2. Bảng đánh giá từng cụm (menu con "ảo" của mỗi mảng)

Lối vào: M = menu con · H = hub /huyen-hoc · K = khối "Kiến thức {mảng}" cuối trang công cụ · T = thư viện /kien-thuc ·
C = chân trang · B = breadcrumb. Độ sâu = số cú bấm từ trang chủ theo đường ngắn nhất người dùng thấy được.

| Mảng | Cụm | Trang | Lối vào | Sâu | Lối vào | Quan trọng | Vì sao |
|---|---|---|---|---|---|---|---|
| Tử vi | `/tu-vi` công cụ | 1 | M H C | 1 | Tốt | Cao | trụ |
| Tử vi | `/tu-vi/sao-o-cung` | 168 | H K T | 2–3 | **Yếu** | **Cao** | 33 % KB, ý định "Tử Vi cung Mệnh" lớn |
| Tử vi | `/tu-vi/tu-hoa` | 48 | H K T | 2–3 | Yếu | Vừa | hỏi đáp dẫn tới |
| Tử vi | `/tu-vi/chinh-tinh` · `/cung` | 14 + 12 | H K T | 2–3 | Yếu | Vừa | trang gốc của sao-o-cung |
| Tử vi | `/tu-vi/la-so-mau` | 6 | dòng chữ đầu /tu-vi, K | 2 | Vừa | Vừa | hub cắt mất |
| Bát tự | `/bat-tu/menh-theo-nam` | 78 | K T (+thẻ bù) | 2–3 | **Yếu** | **Cao** | "sinh năm X mệnh gì", mùa Tết |
| Bát tự | `/bat-tu/thap-than` · `/nhat-chu` | 10 + 10 | H K T | 2–3 | Yếu | Vừa | nền để hiểu lá số |
| Kinh Dịch | `/kinh-dich/que` | 64 | K T C | 2 | **Yếu** | **Cao** | "quẻ X nghĩa gì" |
| Thần số | `/than-so/y-nghia-so` | 12 | K(thứ 10) H T | 2–3 | **Yếu** | **Cao** | chuyên gia tự viết, E-E-A-T |
| Thần số | `/nghe-nghiep` · `/tinh-yeu` · `/nam-ca-nhan` | 12+12+9 | H K T | 2–3 | Yếu | Vừa | |
| Thần số | `/no-nghiep` · `/so-kep` | 4 + 43 | K T | 3 | Yếu | Thấp–Vừa | hub cắt mất |
| Hợp đôi | `/hop-doi/cap-so` | 45 | M | 1 | Tốt | Vừa | |
| Phong thuỷ | `/dau-hieu`, `/huong-hop-tuoi`, `/huong-xau-nam` | 23 + 9 + n | M | 1 | Tốt | Cao | chiếm 6/12 mục menu |
| Năm | `/nam/*`, sao hạn, làm nhà, xông đất, cưới, sinh con | ~250 | M | 1 | Tốt | Cao (Tết) | |
| Lịch | `/xem-ngay-tot/{việc}-thang-*` | 150 | chỉ từ trang ngày | 3 | **Yếu** | Vừa | |
| Lịch | `/lich-am` mục lục | 1 | không | — | **Mồ côi** | Thấp | |

**Trả lời câu hỏi "menu con có quan trọng không":** có, nhưng không phải tất cả. Bốn cụm đáng có lối vào ngay màn đầu
của mảng: **Sao ở cung (168), Mệnh theo năm (78), 64 quẻ, Ý nghĩa số (12 trang chuyên gia)**. Các cụm "nền" (chính
tinh, cung, tứ hoá, thập thần, nhật chủ, nghề, tình yêu, năm cá nhân, nợ nghiệp, số kép) cần lối vào ổn định nhưng không
cần chiếm menu đầu trang. Phong thuỷ, Năm, Hợp đôi đã ổn.

## 3. Ba phương án

Cả ba đều kèm bốn việc nền (làm chung, nhỏ): breadcrumb thật "Trang chủ › Huyền học › Tử vi" trên trang công cụ và trang
cụm (thay dòng "HUYỀN HỌC" tĩnh); hub bỏ `slice(0,4)`; link vào `/lich-am`, link về `/phong-thuy` từ hướng hợp tuổi; công cụ
`/xem-ngay-tot` có lối tới "ngày tốt theo việc". Không đổi engine, không migration Supabase.

### Phương án A — "Thanh mảng" (sub-nav dính dưới thanh đầu trang) — **em đề xuất**

```
┌ Hiểu Bản Thân      Bản thân ˅  Hợp đôi ˅  Huyền học ˅  Năm 2027 ˅  Blog  Tài khoản ˅ ┐   ← menu giữ nguyên
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ◉ Tử vi  │ Lá số của tôi │ Chính tinh 14 │ Cung 12 │ Sao ở cung 168 │ Tứ hoá 48 │ Lá số mẫu 6 │   ← thanh mảng, dính
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ Trang chủ › Huyền học › Tử vi                                                              │   ← breadcrumb thật
│ H1 Tử vi …                                                                                │
```

- Một thanh cho MỖI mảng, hiện trên trang công cụ + mọi trang cụm + trang con của mảng đó (Tử vi 6 mục, Bát tự 4, Kinh
  Dịch 2–3, Thần số 7, Phong thuỷ 5, Hợp đôi 3). Mục đang xem sáng. Mục đầu luôn là công cụ ("Lá số của tôi" / "Số của
  tôi" / "Gieo quẻ" / "Nhà của tôi").
- Điện thoại: chip cuộn ngang, cao 44 px, dính dưới thanh đầu; mục đang xem tự cuộn vào giữa.
- Dữ liệu: một bảng `web/lib/thanh-mang.ts` dựng từ `CHU_DE` có sẵn (tên, đường, số trang) — không CMS, không migration;
  sau này cho CMS sửa nhãn qua "Chữ dùng chung" nếu cần.
- Kèm: **thanh chế độ /tu-vi gom lại** thành một hàng: `[Đêm sao|Giấy cổ]  ‹ 2026 ›  [Hiển thị ˅ : lớp hạn, trường phái]  Tải ảnh`
  → trên điện thoại còn 1–2 hàng (~96 px thay 288 px), lá số lên màn đầu; "Lớp đại hạn / lưu niên" và "Trường phái" vào
  popover "Hiển thị" (có nhãn, không còn giống tab).
- Ưu: mọi trang của mảng đều có lối ra vào, nhất quán, người dùng hiểu ngay mình "đang ở mảng nào"; mẫu quen (Wikipedia,
  Investopedia, các site tra cứu). Chỉ sửa web. Google thấy link cụm từ mọi trang cùng mảng (liên kết nội bộ mạnh hơn).
- Nhược: thêm một thanh dính → mất ~44 px chiều cao hữu ích trên điện thoại (bù lại bằng thu gọn thanh chế độ); cụm dài
  vẫn cần mục lục (phương án C-2 bên dưới nên làm kèm).

### Phương án B — "Mega-menu theo mảng" (sửa menu đầu trang)

```
Huyền học ˅
┌──────────────┬──────────────┬──────────────┬──────────────┬────────────────┐
│ TỬ VI        │ BÁT TỰ       │ KINH DỊCH    │ PHONG THUỶ   │ LỊCH & TUỔI    │
│ Lập lá số ●  │ Lập tứ trụ ● │ Gieo quẻ ●   │ Đo hướng ●   │ Xem ngày tốt   │
│ Sao ở cung   │ Mệnh theo năm│ 64 quẻ       │ Hướng hợp tuổi│ Tuổi làm nhà   │
│ Tứ hoá       │ Thập thần    │ Quẻ đầu ngày │ Dấu hiệu nhà │ Xông đất       │
│ Chính tinh   │ Nhật chủ     │              │ Hướng xấu năm│ Sao hạn        │
│ Lá số mẫu    │              │              │              │ Lịch âm        │
├──────────────┴──────────────┴──────────────┴──────────────┴────────────────┤
│ Thư viện kiến thức · Từ điển · Tất cả Huyền học                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Menu con có NHÓM (cấp 3 thật): CMS "Menu đầu trang" thêm trường `nhom` cho mỗi menu con + nới trần 12 → 24 (migration
  Payload up/down, bản mặc định trong code + CMS phải khớp như hiện nay). Thần số vào mục "Bản thân" cùng kiểu.
- Điện thoại: bảng menu thành accordion theo nhóm (bấm "Tử vi" mở 5 dòng).
- Ưu: từ BẤT KỲ trang nào (blog, trang chủ, trang năm) cũng tới được cụm; nhìn tổng thể "có gì" trong một bảng.
- Nhược: nhiều việc nhất (CMS schema + migration + component menu + e2e so khớp hai bản + nhãn CMS đã sửa tay phải
  giữ); bảng 5 cột rộng ~900 px, chỉ đẹp ≥ 1024 px; menu điện thoại càng dài (hiện đã 37 link). Không giải quyết
  "đang ở trang cụm thì làm sao về công cụ / sang cụm bên cạnh" — vẫn phải mở menu.

### Phương án C — "Cửa vào trên trang + mục lục cụm" (không chạm menu, không thanh dính)

- C-1: Ngay dưới H1 + lời dẫn của mỗi trang công cụ, trước form hồ sơ, một dải thẻ "Tra cứu Tử vi" 4–6 thẻ ngang (tên cụm,
  số trang, một dòng mô tả), cuộn ngang trên điện thoại. Có hồ sơ hay chưa đều hiện.
- C-2: Trang cụm dài (`sao-o-cung`, `que`, `tu-hoa`, `menh-theo-nam`, `so-kep`, `cap-so`) có **mục lục dính** bên trái
  (máy tính) / chip lọc trên cùng (điện thoại): sao-o-cung lọc theo 14 sao hoặc 12 cung; quẻ theo 8 quái thượng; mệnh
  theo thập kỷ; tứ hoá theo 4 hoá. Thẻ cụm bên cạnh ở cuối ("Cùng mảng: Tứ hoá · Chính tinh…").
- Ưu: rẻ nhất, không đổi cấu trúc toàn site, mỗi trang tự đủ; C-2 giải quyết trang 32 màn cuộn.
- Nhược: từ trang con (vd "Tử Vi ở cung Mệnh") về cụm khác vẫn chỉ có breadcrumb + thẻ cuối bài; dải thẻ ở đầu đẩy form
  hồ sơ xuống ~120–160 px (với người đến để lập lá số, đây là chi phí thật).

### So sánh

| | A thanh mảng | B mega-menu | C cửa vào + mục lục |
|---|---|---|---|
| Tới cụm từ trang công cụ | 1 bấm, màn đầu | mở menu → 2 bấm | 1 bấm, màn đầu |
| Tới cụm từ trang con cùng mảng | 1 bấm | 2 bấm | breadcrumb + cuối bài |
| Tới cụm từ trang ngoài mảng | menu (như nay) | 2 bấm | menu (như nay) |
| Điện thoại | chip dính 44 px | accordion dài | thẻ cuộn ngang đầu trang |
| Việc | web: 1 component + bảng + breadcrumb + gom thanh chế độ, e2e | CMS migration + menu + e2e + web | web: 2 component, e2e |
| Rủi ro | thấp | vừa (CMS, nhãn đã sửa tay) | thấp |
| Ước lượng | ~2 ngày | ~4 ngày | ~2 ngày (C-2 là phần lớn) |

**Đề xuất:** **A + C-2** (thanh mảng + mục lục / lọc cho 6 cụm dài), kèm gom thanh chế độ /tu-vi và bốn việc nền. B để
sau, nếu 60–90 ngày Search Console cho thấy người vào cụm từ ngoài mảng nhiều. Không làm C-1 nếu đã có A (trùng vai).

## 4. Câu hỏi cần anh chốt trước khi làm

1. Chọn phương án: A + C-2 (em đề xuất) · A · B · C · hay kết hợp khác?
2. Menu đầu trang: giữ nguyên 2 cấp, hay cho em sửa CMS để có nhóm (phương án B)? Nếu giữ 2 cấp nhưng muốn có cụm lớn
   trong menu "Huyền học" (đang đầy 12/12): có đồng ý đổi 3 mục trùng với menu "Năm" (Hướng xấu theo năm, Tuổi xông đất,
   Sao hạn theo tuổi) lấy chỗ cho "Sao ở cung", "64 quẻ", "Mệnh theo năm" không?
3. Thanh chế độ /tu-vi: gom "Lớp đại hạn / lưu niên" + "Trường phái" vào một nút "Hiển thị" (popover) như mô tả, hay giữ?
4. Nhãn mục đầu thanh mảng: "Lá số của tôi" / "Số của tôi" / "Gieo quẻ" / "Nhà của tôi" — hay chữ chung "Công cụ"?
5. Phạm vi đợt 1: 5 mảng + Hợp đôi (6 thanh), hay thêm cả Năm / lịch & tuổi (các trang `/nam/*`, sao hạn… đã có menu tốt,
   em nghĩ chưa cần)?
6. Nhãn CMS: thanh mảng nên cho CMS sửa nhãn ngay đợt 1 (thêm khoá vào "Chữ dùng chung" — không migration) hay để code?
