# D — Dữ liệu engine cho trang kiến thức (audit 2026-11-03)

Phạm vi: chỉ đọc repo. Đã chạy Python trong venv tạm ở scratchpad (cài `engine/requirements.txt`, không đụng repo), đọc 7 trang thật trên hieuban.com.
Script đo: `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/kiem.py`, `.../sim.py`, `.../sim2.py`.

## 0. Hiện trạng — điều đã thấy

| Điều | Số đo / bằng chứng |
|---|---|
| Phần riêng (cụm 6 từ, `do_rieng`) thấp nhất | `menh_nam` 0,31 (trung vị 0,36) · `sao_cung` 0,33 (0,39) · `hoa_cung` 0,50 · `so_kep` 0,53. Các họ khác ≥ 0,6. Ngưỡng 0,30 → hai họ lớn nhất (168 + 78 trang) sát ngưỡng. |
| Trang quẻ (64) | Có lời kinh đủ, nhưng **không có** dữ kiện cấu trúc mà `calc/kinhdich_vendor.py` đã tính: bát cung, thế/ứng, nạp giáp 6 hào, lục thân, hỗ/thác/tổng quái, 6 quẻ biến. Trang quẻ không nằm trong `_TRANG` nên `do_rieng` không đo. |
| Trang "sao ở cung" | Mọi dữ kiện tính (đồng cung, xung chiếu, độ sáng) **giống nhau** cho 12 trang cùng một sao — vì quan hệ không gian không đổi theo tên cung. Đây là gốc của trùng lặp. |
| Số liệu viết tay trong KB | `bo_sung_*.json` có 250 ô số tính sẵn gõ tay (ví dụ ngày sinh → Đường đời, can → thập thần, tháng cá nhân) và câu "11,1% số ngày 1940–2010". Em đối chiếu lại bằng calc: **250/250 đúng**, nhưng **không test nào khoá** — đổi calc thì KB lệch âm thầm (trái "một bộ tính"). |
| Hai mẫu ngày khác nhau | `thanso_ty_le` dùng 1940–2010; `thanso.phan_bo_duong_doi` dùng 1950–2010. Cùng một loại số, hai mẫu. |
| Câu trái TS-V3c | `thanso.so_nguoi_trung_chu_ky()` trả "~22 triệu người", "1/366 dân số" — là ước tính **dân số**, trả qua `/v1/thanso/chu-ky` (main.py:647). Nên đổi thành "1/366 tổ hợp ngày–tháng". |
| Trang tháng xem ngày | Đã có số đếm (15 ngày hoàng đạo, 4 ngày đẹp…). Trang ngày chưa có số theo năm sinh. |

## 1. Kho phép tính chưa lên trang kiến thức

Ghi chú "trung thực": mọi tỉ lệ là **trên mẫu ngày / trên vị trí an sao**, không phải tỉ lệ người.

| # | Phép tính (có sẵn) | Cụm trang được làm giàu | Câu / bảng ví dụ (số thật đã chạy) | Chi phí | Trung thực? |
|---|---|---|---|---|---|
| 1 | `tuvi_vi_tri.vi_tri_chinh_tinh` × chỉ số cung | `sao_cung` (168) | "Khi Thái Dương ở cung Phu Thê, cung Mệnh **luôn có Thiên Cơ**; Thiên Cơ đứng một mình ở 6/12 vị trí, đi cùng Thái Âm / Cự Môn / Thiên Lương mỗi loại 2/12." · "Thái Dương ở Tài Bạch thì Mệnh **không có chính tinh** ở 6/12 vị trí." · 86/154 cặp (sao, cung ≠ Mệnh) có một sao Mệnh cố định. | Rẻ (µs), tính lúc dựng trang | Có, ghi "xét đủ 12 vị trí của Tử Vi, mỗi vị trí một lần". |
| 2 | Như trên, cho cung Mệnh | `sao_cung` cung Mệnh (14) | "Tử Vi tọa Mệnh: Quan Lộc luôn có Liêm Trinh, Tài Bạch luôn có Vũ Khúc." Bảng 6 hàng (chi · độ sáng · Tài · Quan · Di). | Rẻ | Có |
| 3 | `kinhdich_vendor.info / BAT_CUNG / ho_quai / thac_quai / tong_quai / _flip` | `que` (64) | Quẻ 29 Khảm: cung Khảm (Thủy), Bát thuần, thế hào 6, ứng hào 3; nạp giáp Dần–Thìn–Ngọ–Thân–Tuất–Tý; hỗ = Di, thác = Ly, tổng = Khảm; động hào 1…6 → Tiết, Tỷ, Tỉnh, Khốn, Sư, Hoán. | Rẻ | Có (bảng cổ, tất định). |
| 4 | `kinhdich_maihoa.khoi_que_tu_so` (ngược lại) | `que` | "Mai Hoa theo số: thượng quái ≡ 6 (mod 8), hạ quái ≡ 6 → ra Khảm; hai số 6 và 14…" | Rẻ | Có |
| 5 | `hoang_lich.gz_thang` theo năm | `menh_nam` (78) | "Sinh năm 1990: trụ tháng Mậu Dần từ 04/02, Kỷ Mão từ 06/03, … Mậu Tý từ 07/12." Ngày giao tiết **khác nhau mỗi năm** → riêng từng trang. | Rẻ (365 ngày) | Có |
| 6 | `can_chi.nap_am` × năm 1900–2100 | `menh_nam` | "Lộ Bàng Thổ gồm các năm 1930, 1931, 1990, 1991, 2050, 2051." | Rẻ | Có |
| 7 | `thanso.duong_doi` trên các ngày của MỘT năm | `menh_nam`, `so` | "Trong 365 ngày của năm 1990 (cách rút gọn): số 1 ra 40 ngày, 11 ra 34 ngày, **không ngày nào ra 22 hay 33**." 14/71 năm 1940–2010 không có ngày 22; 8 năm không có 33. | Rẻ | Có, ghi "trên các ngày của năm". |
| 8 | `tuoi_dan_gian.sao_han / bat_han / kim_lau / hoang_oc / pham_tam_tai` | `menh_nam`, `/nam/{năm}/tuoi-{ns}` | Bảng 2026–2030 tuổi 1990: 2026 La Hầu/Kế Đô, Kim lâu Thân · 2027 Thổ Tú/Vân Hán · 2028 Thủy Diệu/Mộc Đức, Tam tai năm 1 … | Rẻ | Có (tập quán, ghi "dân gian"). |
| 9 | `battu_mo_rong.truong_sinh` | `nhat_chu` (10) | Bảng 12 chi: Giáp trường sinh ở Hợi, lâm quan ở Dần… (bảng "được lệnh" đã có; trường sinh chưa). | Rẻ | Có |
| 10 | `thanso_ty_le` theo năm sinh | `so` (12) | "Năm có nhiều ngày ra 33 nhất trong 1940–2010: 1957, 1966, 1975 (27 ngày mỗi năm)." | Rẻ (26k ngày, lru) | Có |
| 11 | Tích hai tỉ lệ Đường đời | `cap_so` (45) | "Hai ngày sinh lấy ngẫu nhiên trong 1940–2010 ra cặp 7–9 ở khoảng 2,5% số cặp." | Rẻ | Có, phải ghi "cặp ngày", không "cặp đôi". |
| 12 | `hoang_lich.quan_he_tuoi`, `ngay_tot_gan` | trang ngày (≈400) | "Xung tuổi Đinh Hợi — người sinh 1947, 2007." · "Ngày Quý Tỵ kế tiếp: 14/01/2027." · "Ngày hợp cưới hỏi gần nhất: …" | Rẻ | Có |
| 13 | `huyen_khong.luu_nien` × hướng cát mệnh quái | `huong-hop-tuoi` (46) | "Năm 2027, sao Nhất Bạch bay tới phía Sinh Khí của nam 1990." Trùng giữa các tuổi cùng quái (chỉ 8 quái) → giá trị thấp hơn. | Rẻ | Có |
| 14 | iztro trên lưới (can năm × tháng âm × giờ × ngày âm ≈ 43.200 tổ hợp) | `sao`, `sao_cung` | "X ở Mệnh ở ~8,3% tổ hợp" — gần đều, **ít giá trị**; chỉ đáng nếu tách theo độ sáng. | Đắt: ~20–25 phút offline với pool; phải chụp ảnh JSON | Có nếu ghi "tổ hợp", nhưng xếp P2. |
| 15 | `tuvi_phi_hoa.ngu_ho_don` + bảng tứ hoá | `sao_cung` | "Tử Vi ở Mệnh tại Dần, người sinh năm Giáp/Kỷ: cung Dần can Bính → tự hoá …" | Rẻ | Có, nhưng khó đọc → P2. |

Không nên làm: tỉ lệ "người" mang số nào; điểm số; câu dự báo bệnh/chết từ sao Tật Ách.

## 2. Khuôn trang "dữ kiện trước" theo cụm

Thứ tự chung: **Trả lời nhanh (dữ kiện)** → **Bảng/biểu đồ tính** → **Sách xưa nói gì** → **Giải thích ngắn** → **Câu tự soi** → **Mời dùng công cụ cá nhân**.

| Cụm | 1. Trả lời nhanh | 2. Bảng tính | 3. Sách xưa | 4. Giải thích | 5. Tự soi | 6. CTA |
|---|---|---|---|---|---|---|
| `sao_cung` | ENGINE: "Mệnh luôn có …", số vị trí vô chính diệu | ENGINE: tổ hợp sao Mệnh × số vị trí /12; độ sáng 12 chi | KB `tuvi_kb` (nguyên văn có sẵn) | KB đời thường sáng/hãm (đã có) | KB | Lá số của bạn → `/tu-vi` |
| `que` | KB `y_chinh` + ENGINE "cung Khảm, thế 6" | ENGINE: 6 hào (chi, hành, lục thân, thế/ứng); hỗ/thác/tổng; 6 quẻ biến (link) | KB lời kinh (có) | KB "hiểu đơn giản" | KB | Gieo quẻ → `/kinh-dich` |
| `menh_nam` | ENGINE: can chi, nạp âm, Tết + Lập xuân | ENGINE: 12 trụ tháng + ngày giao tiết; năm cùng nạp âm; sao hạn/Kim lâu/Tam tai 5 năm; Đường đời theo ngày của năm | KB `nap_am` (Tam Mệnh Thông Hội — cần trích) | KB | KB | Lá Bát tự → `/bat-tu` |
| `so` | KB chuyên gia (giữ) | ENGINE: tỉ lệ ngày hai cách; năm nhiều/ít số này; ví dụ ngày sinh **sinh tự động** | KB | KB chuyên gia | KB | `/than-so` |
| `cap_so` | KB | ENGINE: tỉ lệ cặp ngày | — | KB | KB | `/hop-doi` |
| `nhat_chu`, `thap_than` | KB | ENGINE: bảng được lệnh (có), trường sinh 12 chi (mới), can↔thập thần (sinh tự động thay gõ tay) | KB trích Tử Bình | KB | KB | `/bat-tu` |
| Ngày xem | ENGINE (có) | ENGINE: năm sinh xung/hợp; ngày cùng can chi kế tiếp; ngày đẹp gần nhất theo 6 việc | KB hoàng lịch | KB | — | Chọn ngày cho cả nhà |
| `/nam/{n}/tuoi-{ns}` | ENGINE (có) | ENGINE: vòng 9 năm sao hạn + Kim lâu/Hoang ốc/Tam tai | KB | KB | KB | `/thoi-gian-toi` |

Chuyên gia: chỉ ở "Góc nhìn chuyên gia" + thẩm định (EEAT-1), không đứng tên phần dữ kiện máy tính.

## 3. Cải tiến nội dung / cấu trúc / dữ liệu

1. **Kho dữ kiện có mã (`su_kien`)** — `engine/app/kb/su_kien.py`:
   - Mỗi dữ kiện một mã ổn định: `ts.dd.tung_phan.7`, `ts.dd_nam.1990`, `tv.menh_khi.thai-duong.phu-the`, `kd.que.29.cau_truc`, `bt.tru_thang.1990`.
   - Trả `{ma, gia_tri, mau, phuong_phap, ham_calc, cau}`; câu khung đọc từ KB mới `su_kien_kb.json` (có `source_id`, `school_id`).
   - Một mã dùng cho trang, "Trả lời nhanh", llms.txt, hỏi đáp → cùng một số ở mọi nơi.
2. **Ảnh chụp có kiểm** — `scripts/sinh_su_kien.py` ghi `engine/fixtures/golden/su_kien.json` (chỉ giá trị, giống `ngay_cap_nhat.json`); test so lúc chạy với ảnh chụp → đổi calc thì PR thấy diff. Đây không phải bộ tính thứ hai: chỉ là đầu ra của calc.
3. **Chỗ giữ trong KB**: chữ KB viết `{sk:ts.dd.tung_phan.7}` thay "11,1%"; `bo_sung.ap` thay giá trị. Test cấm số % trần trong KB khi chưa gắn mã.
4. **Bảng tính sinh tự động**: bảng ví dụ ngày sinh / thập thần / tháng cá nhân trong `bo_sung_*.json` chuyển thành "đặc tả" (danh sách ngày, danh sách can) — giá trị do calc điền lúc dựng.
5. **Đo đúng thứ cần đo**: `do_rieng` đếm cụm 6 từ, nên câu khung lặp làm hạ điểm dù dữ kiện khác (em đo: thêm câu "Mệnh luôn có…" vào 168 trang làm min 0,328 → 0,318; thêm bảng → 0,285). Đề xuất thêm chỉ số `su_kien_rieng(t)` = số dữ kiện có giá trị khác mọi trang cùng họ; yêu cầu ≥ 3. Viết khung câu ngắn, để giá trị đứng trước.
6. Trường trang mới `su_kien: [mã…]` để web hiện khối "Số liệu tính" và schema (`Dataset` nhỏ hoặc `PropertyValue` trong Article) — web chỉ hiển thị.
7. **Postgres: không cần.** Mọi số tính trong < 1 giây hoặc có ảnh chụp JSON trong git.
8. Sửa câu dân số trong `so_nguoi_trung_chu_ky`; gộp mẫu 1950–2010 về 1940–2010 (hoặc ghi rõ hai mẫu).

## 4. Kế hoạch ưu tiên

| Mức | Việc | Công sức | Cụm hưởng |
|---|---|---|---|
| **P0** | Dữ kiện "cung Mệnh / tam phương khi sao ở cung" cho `sao_cung` + test khoá 250 số gõ tay trong `bo_sung` | 1 ngày | `sao_cung` (168 trang, phần riêng thấp nhất nhì) |
| P0-bis | Khối "Cấu trúc quẻ" (bát cung, 6 hào nạp giáp, hỗ/thác/tổng, 6 quẻ biến có link) | 0,5–1 ngày | `que` (64) |
| P1 | `menh_nam`: 12 trụ tháng theo tiết, năm cùng nạp âm, Đường đời theo ngày của năm, sao hạn 5 năm | 1–2 ngày | `menh_nam` (78, thấp nhất) |
| P1 | Kho `su_kien` + ảnh chụp + chỗ giữ trong KB; bảng bo_sung sinh tự động | 2–3 ngày | `so`, `no_nghiep`, `thap_than`, `nam_ca_nhan` |
| P1 | Trang ngày: năm sinh xung/hợp, ngày cùng can chi kế tiếp, ngày đẹp gần nhất theo việc | 1 ngày | ≈400 trang ngày |
| P1 | Sửa `so_nguoi_trung_chu_ky`, thống nhất mẫu ngày | 0,5 ngày | uy tín |
| P2 | Trường sinh nhật chủ; tỉ lệ cặp ngày cho `cap_so`; vòng sao hạn ở `/nam/*/tuoi-*`; phi tinh cho tuổi hợp hướng; Mai Hoa theo số | 2–3 ngày | nhiều |
| P2 | Lưới iztro offline (chỉ nếu tách theo độ sáng); chỉ số `su_kien_rieng` | 2 ngày | `sao` |

### P0 chi tiết (engine-only, test trước)

**A. CALC** — `engine/app/calc/tuvi_vi_tri.py` thêm:
- `sao_o_cung_cach_menh(sao: str, k: int) -> list[dict]`: với 12 vị trí Tử Vi, sao ở chi `c` thì cung chỉ số `k` (0 Mệnh … 11 Phụ Mẫu, đi nghịch) cách Mệnh `k` → chi Mệnh = `CHI[(c + k) % 12]`. Trả `[{chi_sao, chi_menh, menh: [chính tinh], do_sang_sao}]`.
- `tom_tat_cung_khac(sao: str, k: int, lech: int) -> dict`: gom theo cung lệch `lech` (Mệnh = k; với k = 0 dùng 4 Quan Lộc, 8 Tài Bạch, 6 Thiên Di) → `{luon_co: [...], to_hop: [{sao: [...], so_vi_tri: n}], vo_chinh_dieu: n}`. Không đọc KB (CALC thuần, nhận k là số).

**B. Test viết trước** — `engine/tests/test_tuvi_vi_tri_menh.py`:
- `test_khop_lasotuvi_60`: với 60 lá `fixtures/golden/lasotuvi_60.json`, mọi chính tinh ở cung chỉ số k → chính tinh Mệnh thật thuộc kết quả hàm tại đúng chi.
- `test_thai_duong_phu_the_menh_luon_thien_co`, `test_tham_lang_tai_bach_menh_luon_that_sat`, `test_thai_duong_tai_bach_vo_chinh_dieu_6`.
- `test_tong_vi_tri_bang_12` (mọi sao × k).
- `test_tu_vi_menh_quan_loc_luon_liem_trinh`.

**C. KB/trang** — `engine/app/kb/trang_tuvi.py` `trang_sao_cung`: thêm mục trước "Câu hỏi tự soi":
- k ≠ 0: tiêu đề "Khi {sao} ở cung {cung}, cung Mệnh có sao gì"; `doan` một câu "luôn có … / không có chính tinh ở n trong 12 vị trí"; `bang` cột [Sao ở cung Mệnh, Số vị trí trên 12]; link sang trang `sao_cung` của sao Mệnh tương ứng.
- k = 0: "Tam phương khi {sao} tọa Mệnh" (Tài, Quan, Di).
- Câu khung ở KB mới `engine/app/kb/data/su_kien_kb.json` (`source_id: "tuvi_vi_tri_v1"`, `school_id: "nam_phai"`), ghi "xét đủ 12 vị trí của Tử Vi, mỗi vị trí tính một lần — không phải tỉ lệ người".
- Test `engine/tests/test_trang_tuvi_menh.py`: `test_moi_trang_sao_cung_co_muc_menh`, `test_khong_noi_ty_le_nguoi` (cấm "người", "dân số", "%" trong mục), `test_bang_khop_calc`, `test_cum_cam_va_giong_ai` (dùng `cum_cam`).
- Chạy `scripts/ngay_cap_nhat.py` (sổ ngày đổi vì nội dung đổi) — test sổ ngày sẽ bắt nếu quên.

**D. Khoá số gõ tay** — `engine/tests/test_bo_sung_so_lieu.py`:
- `test_bang_ngay_sinh_so_khop_duong_doi` (bo_sung_so, 2 quy ước), `test_bang_thap_than_khop_calc`, `test_bang_thang_ca_nhan_khop_calc` (`rut_gon(n+th, giu_master=False)`), `test_phan_tram_so_ngay_khop_thanso_ty_le` (regex "x,y% số ngày … 1940–2010" so `bang_duong_doi`, sai số 0,05).
- Hiện tại 250/250 ô đúng → test xanh ngay; giá trị là chặn lệch về sau.

Không migration, không dependency, không đổi phép tính → không tăng `ENGINE_VERSION`; web không phải sửa (khối `bang` đã render).
