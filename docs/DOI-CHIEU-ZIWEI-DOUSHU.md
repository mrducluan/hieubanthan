# Đối chiếu phép tính Tử vi với đặc tả `Renhuai123/ziwei-doushu` (2026-11-04)

Việc: rà từng quy tắc an sao / vận hạn của engine so với repo `Renhuai123/ziwei-doushu` (MIT) và khẩu quyết cổ điển, tìm lỗi
thật của mình, khoá hành vi đúng bằng golden tính tay. Nối tiếp `docs/HOC-TU-ZIWEI-DOUSHU.md` (phần học tính năng).

## 1. Cách làm

- **Đọc đặc tả, không chạy mã của họ.** Không `npm install`, không chạy `tsx`/`node` trên tệp của repo kia, không chép tệp
  sang để chạy. Đọc `lib/ziwei/algorithm.ts`, `sihua.ts`, `shier-shen.ts`, `yunxian-context.ts`, `school-config.ts`,
  `school-data.ts`, `constants.ts`, `patterns.ts` và `scripts/regression/*.test.ts` như một bản **mô tả quy tắc**. Không chép mã.
- **Phía mình** chạy iztro 2.6.0 (dependency ghim của chính dự án, `engine/ziwei/an_sao_lib.mjs`) qua `tuvi_an_sao.py`, cộng
  các hàm Python `tuvi_vong_han`, `tuvi_luu_nguyet`, `tuvi_phi_hoa`, `tuvi_cach_cuc`, `tuvi_thai_tue_vn`.
- **Golden tính tay** `engine/fixtures/golden/tuvi_doi_chieu_dac_ta.json`, sinh bằng `_sinh_tuvi_doi_chieu_dac_ta.py` — khẩu
  quyết viết tay (Mệnh/Thân, Ngũ Hổ Độn, định cục, an Tử Vi, hai vòng chính tinh, Tả Hữu Xương Khúc, Hồng Loan Thiên Hỷ, đại
  hạn, đồng hạn, tiểu hạn, tuổi mụ, tứ hoá), **không gọi iztro**; chỉ dùng âm lịch Hồ Ngọc Đức (`app.calc.lunar`, có golden
  riêng). Ca 1 và ca 2 soát lại bằng tay từng bước (mục 5). 9 lá × 11 ngày xem.
- **Test**: `engine/tests/test_tuvi_doi_chieu_dac_ta.py` (58 test + 2 xfail). Mỗi khác biệt xếp loại:
  **(a)** khác trường phái đã chốt → ghi lại · **(b)** lỗi của họ → khoá bản cổ điển · **(c)** lỗi của mình → test trước, sửa
  nếu không đổi kết quả mặc định; đổi kết quả mặc định → `xfail(strict=True)` + báo chủ dự án.

## 2. Kết quả theo mảng

### 2.1 Tứ hoá đại hạn / lưu niên

| Quy tắc | Họ | Mình | Loại |
|---|---|---|---|
| Can đại hạn | can cung đại hạn (Ngũ Hổ Độn từ can năm sinh) | như vậy (iztro `TIGER_RULE` + vị trí cung) — test 1.000 lá: can cung = `ngu_ho_don` = can đại hạn | trùng |
| Can lưu niên | `getLiuNianSiHua(năm âm)`; `astro.config({yearDivide:'normal'})` = đổi năm ở Tết | iztro mặc định `yearDivide` + `horoscopeDivide` = `normal` (Tết), năm âm thay bằng **lịch Việt** (`an_sao_lib.mjs`) | trùng (khác lịch: mình dùng Tết Việt — đã chốt LS60) |
| Tết ≠ Lập xuân | Tử vi theo Tết; chỉ tứ trụ (Bát tự) theo Lập xuân | 2027-02-04/05 (sau Lập xuân, trước Tết 6/2) vẫn Bính Ngọ; 6/2 → Đinh Mùi | trùng, đã khoá |
| Tết Việt ≠ Trung Quốc | — (lịch Trung Quốc) | 1985-02-01: Việt Ất Sửu / Trung Giáp Tý; 2007-02-17: Việt Đinh Hợi / Trung Bính Tuất; `lich="trung"` cho đúng bản Trung | (a) đã chốt, khoá cả hai lịch |
| `tu_hoa_sao` (hoá → sao → cung) | — | so với vị trí sao khẩu quyết trên 9 lá golden + 40 lá đại hạn | đúng |
| Tháng Giêng sau tháng Chạp nhuận | dùng can năm SAU | `can_chi_thang(13, Y)` liền mạch = tháng Giêng năm Y+1 (kiểm 1900–2100) | tương đương |

### 2.2 Vòng Tuế tiền / Tướng tiền

| Quy tắc | Họ (`shier-shen.ts` 67–94) | Mình (`tuvi_vong_han.py`) | Loại |
|---|---|---|---|
| Tuế tiền | Tuế Kiện tại chi khởi, 11 thần đi thuận | như vậy | trùng |
| Tướng Tinh | đế vượng tam hợp: Thân Tý Thìn→Tý, Tỵ Dậu Sửu→Dậu, Dần Ngọ Tuất→Ngọ, Hợi Mão Mùi→Mão (`[0,9,6,3][chi%4]`) | `("Tý","Dậu","Ngọ","Mão")[chi%4]` | trùng |
| Chi khởi | lá gốc: chi năm sinh; đại hạn/năm: chi của lớp hạn (mặc định "theo hạn") | như vậy | trùng |
| Chỉ số | mảng theo chi (0 = Tý) | mảng theo thứ tự cung iztro (0 = Dần): thần ở cung i = `ten[(i+2−khởi) % 12]` | đã kiểm 1.000 lá với `suiqian12`/`jiangqian12` lá gốc của iztro |
| Thần thứ 7 | ghi 岁破 (Tuế Phá) | tên iztro "Đại Hao", tên sách Việt "Tuế Phá" (`tuvi_thai_tue_vn`) | (a) chỉ khác tên |

### 2.3 Tháng nhuận (`algorithm.ts` 137–203, 517–537)

| Họ | Mình | Ghi chú |
|---|---|---|
| `split` (mặc định) | `thang_sau` (mặc định) | trùng: ngày ≥ 16 tính tháng sau (iztro `fixLeap`) |
| `origin-month` (byLunar, `fixLeap=false`) | `thang_chinh` (`fix_leap=false`) | trùng |
| `prev-month` (byLunar tháng thường cùng số) | — | an sao như `origin-month` (cùng tháng, ngày, giờ, năm); chỉ khác ngày dương nhãn → không cần thêm |
| `next-month`: tháng + 1, **kẹp ngày** về số ngày tháng sau; Chạp nhuận → tháng Giêng **năm sau** | `ca_thang_sau`: tháng + 1, **không kẹp ngày**, năm giữ năm sinh | (b) kẹp ngày là hệ quả kỹ thuật (phải dựng ngày âm hợp lệ để gọi `byLunar`), không phải quy tắc sách: 30/6 nhuận Đinh Dậu (2017-08-21, tháng 7 chỉ 29 ngày) → họ an Tử Vi ở Tỵ, mình (và khẩu quyết) ở Ngọ. Đổi năm khi Chạp nhuận: 1900–2100 không có tháng Chạp nhuận (cả hai lịch) nên không phát sinh; người sinh trước Tết vẫn mang can năm cũ |
| Tháng xem nhuận (lưu nguyệt) luôn `split` | theo lựa chọn người dùng (`cac_thang`) | (a) mình nhất quán với lựa chọn tháng sinh |

### 2.4 Tý muộn, đại hạn, tiểu hạn, Thân, Lai nhân

| Quy tắc | Họ | Mình | Loại |
|---|---|---|---|
| 23:xx | form đổi sang ngày sau, giờ Tý (`next-day` mặc định) | `_ty_muon`: ngày sau, time_index 0 (EN-6 BI-2) — tránh lỗi gói ngày của iztro (30+1 → 1 mà không sang tháng) | trùng; khoá ca 23:xx ngày 30/1 âm 1985 |
| Khởi đại hạn | cung Mệnh, tuổi = số cục | như vậy | trùng |
| Chiều đại hạn | dương nam/âm nữ thuận, ngược lại nghịch (`calcYinYangGender`) | iztro: âm dương chi năm × giới | trùng (4 tổ hợp có golden) |
| Đồng hạn (tuổi < cục) | tuổi 1–5: Mệnh, −4, −5, −2, +2 so với chi Mệnh | iztro: Mệnh, Tài Bạch, Tật Ách, Phu Thê, Phúc Đức (cùng vị trí) | trùng về cung + can; **khoảng tuổi sai ở mình** — mục 3 |
| Tiểu hạn | (iztro) | Dần Ngọ Tuất→Thìn, Thân Tý Thìn→Tuất, Tỵ Dậu Sửu→Mùi, Hợi Mão Mùi→Sửu; nam thuận, nữ nghịch | đúng khẩu quyết |
| Thân / Mệnh | (iztro) | Thân = Dần + (tháng−1) + giờ, Mệnh = Dần + (tháng−1) − giờ | đúng |
| Lai nhân | (iztro) | cung Dần…Hợi có can trùng can năm (bỏ Tý, Sửu) — `tuvi_phi_hoa.lai_nhan` = iztro `isOriginalPalace` | đúng |
| Giờ | chỉ nhận 0–11, từ chối 12 / −1 / 0,5 | 0–12 (12 = Tý muộn, có chủ đích), ngoài khoảng → `ValueError` | (a) |

### 2.5 Cách cục (cách trùng nhau)

| Cách | Họ | Mình | Loại |
|---|---|---|---|
| 明珠出海 Minh châu xuất hải | Mệnh Mùi vô chính + đối cung Sửu có Nhật Nguyệt đồng cung | Mệnh Mùi vô chính, Thái Dương ở Mão + Thái Âm ở Hợi (cổ thư "日卯月亥") | (b) — test: 12 lá cấu hình của họ, ta không nhận |
| 府相朝垣 Phủ Tướng triều viên | Phủ, Tướng ở tam phương tứ chính, chỉ loại khi cả hai ở Mệnh (không thể xảy ra) → nhận cả khi một sao ngồi Mệnh | Phủ + Tướng ở tam phương ngoài Mệnh, Mệnh không chứa sao nào | (b) — test: 164 lá có một sao ngồi Mệnh và sao kia ở tam hợp (họ nhận), ta không nhận |
| 杀破狼 | cả ba sao ở tam phương tứ chính | Mệnh có một trong ba sao | **tương đương** (ba sao luôn cùng một tam hợp) — khoá "khi và chỉ khi" |
| 双禄朝垣 | Hoá Lộc + Lộc Tồn ở tam phương | `song_loc` | tương đương |
| 科权双会 | Khoa + Quyền (chính tinh) ở tam phương | `khoa_quyen_hoi_menh` = như vậy **và không có Lộc** | (a) tránh trùng Tam Kỳ / Quyền Lộc |
| 机月同梁 / 三星会 | 4/4 và đúng 3/4 | `co_nguyet_dong_luong` / `_ba` | tương đương |
| 天马入命/在迁, 禄存守命/身 | | `thien_ma_menh_di`, `loc_ton_thu_menh/than` | tương đương |
| 羊陀夹忌 | Kỵ ở Mệnh + Kình Đà giáp | `kinh_da_giap_menh` không đòi Kỵ — là cách khác (羊陀夹命); test: giáp Kình Đà ⟺ Lộc Tồn thủ Mệnh | (a) |
| 紫府同宫, 廉贞天相, 武曲七杀, 天同天梁, 日月同宫, 巨日同宫 | nhận cả khi không ở Mệnh | chỉ xét trục Mệnh | (a) thiết kế; các điều kiện chi trong cách của mình (Vũ Sát Mão/Dậu, Đồng Lương Dần/Thân…) **thừa nhưng vô hại** — đồng cung chỉ có ở các chi đó (test 1.000 lá) |
| 火贪 / 铃贪 | Tham + Hoả/Linh đồng cung hoặc hội chiếu, Tham ở tam phương | Tham + Hoả/Linh đồng cung ở Mệnh | (a) mình chặt hơn |
| 武贪格 | đồng cung hoặc đối cung, một sao ở tam phương | `tham_vu_dong_hanh`: đồng cung ở Mệnh | (a) |
| 阳梁昌禄 | đòi Lộc Tồn | Lộc Tồn **hoặc** Hoá Lộc | (a) cả hai cách đọc đều có trong chú giải |
| 君臣庆会 | Tử Vi thủ Mệnh + **Tả và Hữu** ở tam phương | Tử Vi thủ Mệnh + ≥ 3 trong {Tả, Hữu, Khôi, Việt, Xương, Khúc, Lộc Tồn} | **chờ duyệt** — mục 4 |
| 化忌入命/迁 | chỉ chính tinh, cả Mệnh và Di | Mệnh: mọi sao (gồm Xương/Khúc Kỵ); Thiên Di: chỉ chính tinh | **chờ duyệt** — mục 4 |

### 2.6 Ý tưởng regression của họ → test Python

| Test của họ | Test của mình |
|---|---|
| pan-integrity (12 cung, thứ tự nghịch, Cơ Lương chỉ Thìn/Tuất, Tử Phủ đối xứng) | `test_bat_bien_1000_la` (+ `test_tuvi_bat_bien.py` đã có) |
| hongluan-tianxi (Hồng Loan = Mão − chi năm, Thiên Hỷ đối cung) | `test_bat_bien_1000_la` (vị trí tuyệt đối, trước chỉ kiểm đối cung) + golden |
| natal-dual-sihua (1988-10-08 giờ Mùi nam) | `test_hai_hoa_sinh_nien_cung_cung_hop_le` |
| leap-policy-validation | đã có `test_tuvi_thang_nhuan_3_phai.py`; thêm ca ngày 30 không kẹp |
| solar-date-exists, gender-validation | `test_api_ngay_duong_khong_ton_tai`, `test_api_gioi_tinh_la`, `test_dau_vao_la_bi_tu_choi` |
| iztro-time-index-boundary | `test_ranh_gioi_canh_gio`, `test_ty_muon_la_ngay_sau_gio_ty` |

## 3. Lỗi của mình tìm được (chưa sửa — đổi kết quả mặc định, chờ chủ dự án)

1. **Đồng hạn báo sai khoảng tuổi** — `tuvi_an_sao.van_han`: khi tuổi mụ < số cục, iztro trả cung đồng hạn (đúng cung,
   đúng can, đúng tứ hoá) nhưng mình lấy `range` đại hạn của chính cung đó → bé 2 tuổi Hoả lục cục báo "đại hạn 86–95,
   cung Tài Bạch". Lan xuống hỏi đáp (`hoidap/tuvi.py`: "giai đoạn mười năm từ 86 đến 95 tuổi"; dòng tính số năm còn lại
   `den_tuoi − tuoi_mu + 1`), khối hình "10 năm (…tuổi)". Đề xuất: `tu_tuoi = 1`, `den_tuoi = cục − 1`, thêm cờ
   `dong_han: true` (không đổi cung/can/tứ hoá). Test `test_dong_han_khoang_tuoi` (xfail strict).
2. **Tiểu hạn tuổi ≥ 121** — iztro chỉ an 10 vòng (tuổi 1–120): tuổi mụ ≥ 121 trả `chi_so −1`, `can 'jia'`, `chi 'zi'`
   (chuỗi thô), `cung_goc` = cung cuối mảng; đại hạn cũng hỏng khi vượt hạn cuối (cục + 119). Chỉ gặp với năm sinh rất xa
   năm xem. Đề xuất: tính tiểu hạn bằng chính khẩu quyết (vòng 12) hoặc chặn năm xem. Test `test_tieu_han_tuoi_121` (xfail).

Không tìm thấy lệch nào khác: 9 lá golden × 18 sao, Mệnh/Thân/Lai nhân/Cục, 12 đại hạn, tiểu hạn, 11 ngày xem, 1.000 lá bất
biến đều khớp khẩu quyết.

## 4. Việc mở (cần người rành Tử vi / chủ dự án quyết)

- **君臣庆会 Quân thần khánh hội**: 1.000 lá — 33 lá mình nhận mà không đủ Tả + Hữu; 2 lá đủ Tả + Hữu nhưng mình không nhận
  (thiếu cát tinh thứ ba). Nhiều sách đòi "紫微得左右" là điều kiện cốt lõi. Đổi = đổi kết quả mặc định + mã kiểm chứng.
- **Hoá Kỵ thủ Mệnh vs Kỵ nhập Thiên Di**: Mệnh tính cả Xương/Khúc Kỵ, Thiên Di chỉ chính tinh — chưa nhất quán.
- Sửa hai lỗi mục 3.

## 5. Soát tay hai ca golden

**1988-10-08 giờ Mùi (ti 7), nam** — âm 28/8 Mậu Thìn. Mệnh = Dần + 7 − 7 = Dần; Thân = Dần + 14 = Thìn. Mậu: can Dần = Giáp
→ Mệnh Giáp Dần → Thuỷ nhị cục. Tử Vi: 28/2 = 14 → đếm từ Dần = 1 tới 14 → Mão. Thiên Cơ = Dần, Thiên Phủ = Sửu, Thái Âm =
Dần, Tham Lang = Mão. Hữu Bật = Tuất − 7 = Mão. Mậu: Tham Lộc, Âm Quyền, Hữu Bật Khoa, Cơ Kỵ → Mệnh (Dần) có Cơ Kỵ + Âm Quyền,
Phụ Mẫu (Mão) có Tham Lộc + Hữu Bật Khoa. Dương nam thuận: 2–11 Dần, 12–21 Mão (Ất Mão). Xem 2007-02-17 (Tết Việt): tuổi
mụ 20 → đại hạn Mão, can Ất → Cơ Lộc (Dần), Lương Quyền (Ngọ), Tử Vi Khoa (Mão), Âm Kỵ (Dần); lưu niên Đinh Hợi; tiểu hạn
Thìn khởi Tuất, thuận 19 cung → Tỵ.

**1990-05-17 giờ Ngọ (ti 6), nữ** — âm 23/4 Canh Ngọ. Mệnh = Dần + 3 − 6 = Hợi = Thân. Canh: can Dần = Mậu → Đinh Hợi → Thổ
ngũ cục; Lai nhân Canh Thìn. Tử Vi: 23 + 2 = 25 = 5 × 5, x = 2 chẵn → 5 + 2 = 7 → Thân. Dương nữ nghịch: 5–14 Hợi, 15–24 Tuất,
25–34 Dậu, 35–44 Thân (Giáp Thân). Xem 2027-02-05 (sau Lập xuân, trước Tết): năm âm 2026 Bính Ngọ, tuổi mụ 37 → đại hạn
Thân Giáp; tiểu hạn Ngọ khởi Thìn, nữ nghịch 36 cung → Thìn.
