# Đề xuất — menu "Năm 2027" và các URL xem năm (2026-10-30, CHỜ CHỦ DỰ ÁN CHỌN)

Chủ dự án hỏi: rà các URL hợp cho người xem năm 2027, có nên làm một menu lớn gom "3 tháng tới / 12 tháng tới của
bản thân" (tính bằng engine đang có) cùng xông đất, xem nhà…; tự tìm ý tưởng trong engine + KB mà nhiều người hỏi,
đề xuất 3 phương án. Ba agent đã chạy song song: kiểm kê engine/KB, rà URL/menu/SEO, nghiên cứu nhu cầu tìm kiếm.

Khâu của vòng tăng trưởng: **THU HÚT** (mùa tìm kiếm Tết, lớn nhất năm) → **QUAY LẠI** (nhịp 3/12 tháng) →
**NẠP Sao** (chương sâu về năm tới). Đo: hiển thị/nhấp Search Console các URL `…/2027`, `landing_viewed` →
`reading_started`, tỉ lệ mở chương năm tới bằng Sao.

## 1. Hiện trạng (đã rà)

**Mốc năm.** Tết Đinh Mùi = thứ Bảy 06/02/2027, năm âm tới 25/01/2028, nạp âm Thiên Hà Thuỷ. Web lấy năm âm hiện tại
(`namAmHienTai`) = 2026 → mọi cửa sổ "năm nay + năm sau" **đã index 2027**; sau 06/02/2027 tự trượt sang 2027–2028.

| URL 2027 đã có | Index | Sitemap |
|---|---|---|
| `/xem-tuoi-lam-nha/2027` + `/tuoi-{1960…2005}` | có | có |
| `/tuoi-xong-dat/2027` + `/tuoi-{…}` | có | có |
| `/xem-sao-han/2027` (một bảng 46 tuổi × 2 giới) | có | có |
| `/phong-thuy/huong-xau-nam/2027` | có | có |
| `/lich-am/2027` | có | có |
| `/xem-ngay-tot/thang-{1…12}-2027`, `/{việc}-thang-…-2027`, từng ngày | có | việc-tháng chỉ tới 10/2027 |

**Lỗ hổng URL:** `/lich-am` (gốc) trả **404**; không có trang nào gom các bảng 2027; menu và hub `/huyen-hoc` chỉ trỏ
công cụ gốc, không trỏ trang năm; `sinh-nam-2027-menh-gi` chưa có (cụm mệnh theo năm dừng ở 2025); trang ngày tốt theo
việc từ 11/2027 index nhưng thiếu trong sitemap.

**Engine đã tính được về "thời gian tới"** (đều tất định, có KB):

| Cửa sổ | Thần số | Tử vi | Bát tự | Phong thuỷ / dân gian |
|---|---|---|---|---|
| 3 tháng | tháng này + tháng tới | **nhịp 3 tháng** (có lời riêng từng tháng, miễn phí) | — (chỉ 12 tháng thô) | "Tháng này nhà bạn" 3 tháng sao cửa |
| 12 tháng | **Bản đồ con số "12 tháng tới"** (khoá Sao) | lưu nguyệt 12 tháng (thô, chưa lời) | 12 tháng theo tiết (thô; có lời trong chương khoá) | — |
| Một năm chọn được | năm cá nhân (`/chu-ky` mọi năm, chưa có trang) | lưu niên + phi hoá (`nam_xem`) | lưu niên (`nam_xem`) | hạn năm, Ngũ Hoàng, sao hạn, tam tai, kim lâu, hoang ốc, xông đất |
| 10 năm | — | chương **Vận hạn** (khoá) | chương **Vận hạn** hai cách (khoá) | tuổi làm nhà: năm tốt trong 15 năm |

**Điểm nghẽn chính:** mọi bài luận giải có lời (Tử vi/Bát tự đời sống, Bản đồ con số, nhịp 3 tháng) nhận `ngay_xem`
trong engine nhưng **web không gửi** → người dùng không xem được "năm 2027 của mình" có lời; dữ kiện năm 2027 bị rải ở
6–7 trang. Kinh Dịch không có quẻ năm (và không nên bịa).

## 2. Nhu cầu (nghiên cứu web, không có số lượt tìm chính xác — độ lớn suy từ số site làm trang + thời điểm đăng)

1. "2027 là năm con gì / mệnh gì / sinh năm 2027 mệnh gì" — lớn nhất, site bán lẻ đã đăng từ tháng 10/2026.
2. "Tử vi 2027 tuổi X nam/nữ mạng" — Shopee/MoMo làm 60 × 2 bài văn mẫu cho 2026; 2027 chưa ai làm.
3. Sao hạn / sao chiếu mệnh 2027 — ngaydep đã dựng trang tự động tới 2030.
4. Tuổi làm nhà 2027 (Kim lâu, Tam tai, Hoang ốc) — chogia có trang theo năm sinh.
5. Sinh con 2027 hợp tuổi bố mẹ — bài các nơi lệch nhau → lợi thế cho một nguồn tính nhất quán.
6. Tuổi xông đất 2027 — đỉnh hẹp 2–4 tuần trước Tết.
7. 12 con giáp 2027 · 8. tử vi tháng · 9. lịch âm / ngày tốt tháng · 10. năm cá nhân 2027 · 11. cưới năm 2027
   tuổi nào (chưa ai có danh sách) · 12. "3 tháng tới của tôi" — **không site nào cá nhân hoá**.

Mùa vụ: Google báo người Việt tìm đồ Tết từ ~3 tháng trước → nhu cầu 2027 lên từ **đầu 11/2026**, đỉnh 12/2026 → hết
tháng Giêng âm. Năm 2027: Hợi–Mão–Mùi ở năm Tam tai cuối, tuổi Mùi năm tuổi, Sửu xung Thái Tuế, năm thế giới số 2
(2+0+2+7 = 11 → 2).

Ranh giới (đã khớp quy tắc dự án): không con số may mắn, tuổi thọ, "tháng đại hạn", dâng sao, vật phẩm; Tam tai / Kim
lâu nói như tập quán + "mượn tuổi". Phạt hành chính mê tín dị đoan (NĐ 38/2021 sửa bởi NĐ 128/2022) nhắm vào gây
hoang mang, trục lợi giải hạn.

## 3. Ba phương án

### A. Trang trụ "Năm 2027" công khai (SEO) — nhanh, rẻ

- Trang `/nam/2027` (mẫu `/nam/{năm}`, index năm âm hiện tại + năm sau như các cụm năm khác → không mục nát). Trả lời
  thẳng câu nền (con giáp, nạp âm, Tết 06/02, năm âm tới 25/01/2028, Tam tai nhóm nào, năm tuổi/xung, Ngũ Hoàng, năm
  thế giới số 2) — **engine dựng** (`luangiai/nam_tong_quan.py` ghép `lich_nam`, `han_nam`, `tuoi_dan_gian`, `sao_han`).
- **Một bảng 12 con giáp × cờ năm** (năm tuổi, xung, tam tai, sao hạn nam/nữ theo năm sinh gần nhất) — bảng, không
  60×2 bài văn mẫu (tránh nội dung mỏng).
- Nhánh tới mọi trang 2027 đã có + 3 trang mới có nhu cầu, chưa ai làm tốt:
  `sinh-nam-2026/2027-menh-gi` (mở rộng cụm mệnh theo năm), **"Sinh con năm 2027 hợp tuổi bố mẹ"** (tam hợp, lục hợp,
  nạp âm — CALC có sẵn, không chấm điểm, câu nhắc hỏi bác sĩ), **"Cưới năm 2027 tuổi nào"** (Kim lâu theo tuổi mụ,
  ghi rõ các cách đếm khác).
- Sửa kèm: `/lich-am` gốc (hiện 404), sitemap việc-tháng phủ đúng cửa sổ index.
- Menu: thêm mục cha **"Năm 2027"** (mục thứ 6, tab dưới điện thoại thứ 5) trỏ trang trụ.
- Công sức: ~1 PR engine + web. Không Sao, không migration.
- Yếu: chỉ thắng truy vấn chung; không có gì "của riêng bạn" → ít lý do quay lại, không đẩy NẠP.

### B. Hub "Thời gian tới của bạn" cá nhân hoá — sâu, đẩy NẠP

- Trang `/thoi-gian-toi` (URL không gắn năm), ba tab **3 tháng tới · 12 tháng tới · Năm {năm âm tới}** (+ 10 năm trong
  chương khoá), dùng hồ sơ trên máy.
- Engine RULES mới `luangiai/thoi_gian_toi.py` chỉ ĐỌC các CALC/RULES đã có, theo khuôn `doi_song_1`:
  - 3 tháng: nhịp 3 tháng Tử vi + tháng cá nhân + 3 tháng sao cửa nhà (nếu có hồ sơ nhà) → một dòng thời gian chung,
    mỗi tháng nói mảng nào cùng "thuận" ở nhiều phái, chỗ phái khác nhau nói rõ.
  - 12 tháng: 12 tháng cá nhân + lưu nguyệt Tử vi + 12 tháng tiết Bát tự (hai cách) → "tháng then chốt".
  - Năm 2027: năm cá nhân + lưu niên Tử vi + lưu niên Bát tự + **cờ dân gian của chính người đó** (sao hạn, tam tai,
    kim lâu, năm tuổi) + hướng xấu năm cho nhà.
  - Web phải gửi `ngay_xem` / `nam_xem` (mở nghẽn mục 1).
- Miễn phí: tab 3 tháng + tóm tắt năm; khoá Sao: 12 tháng chi tiết + năm 2027 đầy đủ (dùng chung giá/công tắc
  `luan_giai.*`). Thẻ chia sẻ "Năm 2027 của tôi" (mã HMAC, chỉ tên hiển thị + nhãn đã tính).
- Công sức: lớn (engine + KB lời ghép + web + test giọng văn); trang cá nhân noindex → ít SEO.
- Yếu: không bắt được làn sóng tìm "2027" sớm; ra mắt có thể trễ mùa Tết.

### C. (Khuyên dùng) Menu lớn "Năm 2027" hai cột — làm A trước, B theo đợt

Menu cha **"Năm 2027"** với bảng thả xuống chia nhóm (dùng ≤ 12 menu con hiện có, không đổi URL công cụ — đúng
QH-URL/HH-1):

| Của riêng bạn | Tra theo tuổi 2027 | Lịch 2027 |
|---|---|---|
| 3 tháng tới của bạn | Sao hạn 2027 | Lịch âm 2027 · Tết |
| 12 tháng tới của bạn | Tuổi làm nhà / cưới 2027 | Ngày tốt tháng Giêng 2027 |
| Năm 2027 của bạn | Tuổi xông đất Tết 2027 | Hướng xấu năm 2027 |
| | Sinh con 2027 hợp tuổi | |

- **Đợt 1 (xong trước ~10/11/2026):** toàn bộ A + cột "Của riêng bạn" trỏ thẳng vào chỗ đã có
  (`/tu-vi#nhip-3-thang`, `/than-so#ban-do-con-so`, `/ban-than#muc-nhip`) và trang trụ có ô "Nhập ngày sinh — xem năm
  2027 của bạn" (lần đầu hiện tóm tắt miễn phí ghép từ route sẵn có: năm cá nhân 2027 + sao hạn + tam tai/kim lâu).
- **Đợt 2 (12/2026, trước đỉnh):** B gọn — `/thoi-gian-toi` gom lời, web gửi `nam_xem`, chương năm tới mở bằng Sao,
  thẻ chia sẻ. Cột "Của riêng bạn" chuyển trỏ về trang này.
- **Đợt 3 (sau Tết):** đo Search Console → quyết có làm "Tử vi 2027 theo tuổi" dạng bảng/hỏi đáp hay không; đổi nhãn
  menu sang năm sau (nhãn đọc biến `{nam_toi}` từ code, CMS không phải sửa tay mỗi năm).
- Vì sao chọn C: đón đúng mùa tìm kiếm (THU HÚT) bằng việc rẻ trước, rồi biến lượt vào thành "năm của tôi" (QUAY LẠI +
  NẠP) — khác biệt mà nghiên cứu cho thấy chưa đối thủ nào có. Không thay URL, không migration ở đợt 1.

## 4. Cần chủ dự án quyết

1. Chọn A / B / C (em khuyên **C**).
2. Nhãn menu: "Năm 2027" (cụ thể, khớp truy vấn — em khuyên) hay nhãn trượt "Năm mới / Vận năm".
3. URL trang trụ: `/nam/2027` (em khuyên, có năm trong URL như các cụm khác) hay `/nam-2027`.
4. "Sinh con năm 2027" và "Cưới năm 2027": duyệt làm (luật công khai, không chấm điểm hợp/khắc, ghi rõ khác phái).
5. Menu CMS: anh đã sửa "Menu đầu trang" trong CMS thì bản CMS thắng code — sau khi merge cần thêm mục tay.
