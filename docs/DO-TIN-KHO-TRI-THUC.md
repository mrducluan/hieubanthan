# Độ tin của kho tri thức (KT-TT6)

> Tệp này do `engine/scripts/do_tin_kb.py` dựng từ sổ `engine/app/kb/do_tin.py` — **không sửa tay**. Nội bộ, không hiện
> cho người dùng. Mức nói "lời này truy được về đâu", KHÔNG phải "đã thẩm định" (thẩm định là việc của chuyên gia).

## Thang năm mức

- **Có nguyên văn đối chiếu** (`nguyen_van`)
- **Tóm ý cổ thư, chưa khớp từng câu** (`tom_y_co_thu`)
- **Tập quán / sách hiện đại tóm ý** (`truyen_thong`)
- **Ban biên tập soạn** (`bien_tap`)
- **Tệp kỹ thuật** (`he_thong`)

## Số tệp theo mảng

| Mảng | Có nguyên văn đối chiếu | Tóm ý cổ thư, chưa khớp từng câu | Tập quán / sách hiện đại tóm ý | Ban biên tập soạn | Tệp kỹ thuật |
|---|---|---|---|---|---|
| Bát tự | 3 | 1 | 1 | 4 |  |
| Tử vi | 1 | 3 | 7 | 7 |  |
| Kinh Dịch | 4 | 2 | 1 | 2 |  |
| Phong thuỷ | 2 | 2 | 1 | 3 |  |
| Nhân tướng | 5 | 2 | 2 |  |  |
| Tarot | 1 |  | 1 |  |  |
| Kỳ Môn |  | 1 |  | 1 |  |
| Thần số |  |  | 11 | 13 |  |
| Lịch · tuổi · tập quán |  | 1 | 5 |  |  |
| Liên mảng · kỹ thuật |  | 1 |  | 12 | 7 |

## Phần đã có nguyên văn đối chiếu (test khoá)

| Tệp | Phần | Kho nguồn | Test | Ghi chú |
|---|---|---|---|---|
| `battu_dieu_hau.json` | (cả tệp) | `cung_thong_bao_giam.json` | `test_dieu_hau_khop_nguyen_van_tung_o` |  |
| `battu_doi_song_kb.json` | ngoai_cach | `tu_binh_chan_thuyen.json` | `test_trich_la_nguyen_van` | câu hỷ / kỵ khớp nguyên văn; lời đời thường là tóm ý |
| `battu_kb.json` | co_tho | `uyen_hai_tu_binh.json` | `test_co_tho_nhat_chu_khop_nguyen_van_uyen_hai` |  |
| `battu_kb.json` | co_van_thap_than | `uyen_hai_tu_binh.json` | `test_co_van_thap_than_khop_nguyen_van_uyen_hai` |  |
| `battu_ngay_gio.json` | (cả tệp) | `tam_menh_thong_hoi_du_bo.json` | `test_han_la_chuoi_con_kho_nguon_dung_muc` | TK-2: 120 bài ca chung «六X日Y時斷» quyển 8–9, mỗi câu đúng mục can ngày × giờ |
| `battu_sach_ghi.json` | (cả tệp) | `tam_menh_thong_hoi.json` | `test_moi_muc_qua_bo_kiem` | SX-C: câu Tam Mệnh Thông Hội + Uyên Hải Tử Bình (thần sát, thập thần, lục thân, tính nết, thân thể) khớp kho nguồn |
| `chi_tay_kb.json` | (cả tệp) | `than_tuong_toan_bien.json` | `test_moi_cau_la_nguyen_van` | Chỉ tay: 67 bài thơ vân tay quyển 10 + câu đồ hình tám cung («根基所屬», Luận thủ) khớp kho nguồn; CT-2: câu theo số đo bàn tay (`sach_do_tay`: «論手», «相指掌») + vai và lựa chọn từng cung (`cung_tay`: «根基所屬») qua bộ kiểm SX-C (tests/test_chi_tay_do.py); ngưỡng đo `do_tay` là giả định nhân trắc, can_doi_chieu; lời Việt nói giảm theo SX-C; 5 hình sách đoán về người vợ không đưa vào |
| `chi_tay_tay_kb.json` | (cả tệp) | `chi_tay_cheiro_language_of_the_hand.json` | `test_moi_cau_trich_la_chuoi_con_kho_nguon` | TK-2 chỉ tay phương Tây: câu trích tiếng Anh Cheiro 1894 + Benham 1900 (kho nguồn lớp chữ nhận dạng, can_doi_chieu) khớp từng câu; lời Việt ban biên tập; ngưỡng số đo `do_tay` giả định, can_doi_chieu; không nhóm C |
| `chuyen_nghia_kb.json` | khai_niem | `ky_mon_co_kim_do_thu.json` | `test_moi_muc_qua_bo_kiem` | mỗi khái niệm một câu sách khớp kho nguồn; nghĩa đời nay là biên tập |
| `kinhdich_dich_lam.json` | (cả tệp) | `tieu_thi_dich_lam.json` | `test_kb_la_ban_cat_cua_kho_nguon_va_du_4096_bai` | TK-2: 4.096 bài từ Tiêu Thị Dịch Lâm (quẻ bản → quẻ biến), nguyên văn chưa dịch; bài có chữ nặng không hiện |
| `kinhdich_hao.json` | (cả tệp) | `chu_dich_truyen_nghia.json` | `test_loi_que_loi_hao_trong_kb_khop_ban_tu_kho` | kinh văn khớp nguyên văn; phần dịch và «Hiểu đơn giản» là nháp |
| `kinhdich_kb.json` | bat_quai | `chu_dich_truyen_nghia.json` | `test_loai_tuong_tam_quai_trich_dung_thuyet_quai` | loại tượng khớp Thuyết Quái |
| `kinhdich_legge.json` | (cả tệp) | `kinhdich_legge_que.json` | `test_moi_doan_la_chuoi_con_cua_nguon` | TK-2 việc 4: bản dịch Anh James Legge 1882 (PD) — chỉ quẻ qua kiểm vạch âm dương + kiểm chữ hỏng; chỉ bản /en |
| `kinhdich_tra_loi.json` | tinh_chat_que | `tang_san_boc_dich.json` | `test_trich_la_nguyen_van_va_kb_du_loi` |  |
| `kinhdich_tra_loi.json` | sach_xua_viec | `tang_san_boc_dich.json` | `test_cau_la_nguyen_van_trong_dung_chuong` | WS-5: câu Tăng San Bốc Dịch theo chương ứng với việc; lời Việt là tóm ý |
| `kinhdich_truyen_nghia.json` | (cả tệp) | `chu_dich_truyen_nghia.json` | `test_ngo_tat_to_ghep_dung_hao_va_du_do_phu` | bản dịch Ngô Tất Tố ghép theo chữ Hán |
| `ky_mon_kb.json` | cua | `ky_mon_co_kim_do_thu.json` | `test_moi_muc_qua_bo_kiem` | mỗi cửa một câu «釋八門所主» |
| `ky_mon_kb.json` | sao | `ky_mon_co_kim_do_thu.json` | `test_moi_muc_qua_bo_kiem` | mỗi sao một câu «釋九星所主» |
| `ky_mon_kb.json` | cach | `ky_mon_co_kim_do_thu.json` | `test_moi_muc_qua_bo_kiem` | điều kiện từng cách thử bằng ví dụ «假令» của sách (tests/test_ky_mon_cach.py); lời đời thường là tóm ý |
| `nhan_tuong_kb.json` | luu_nien | `than_tuong_toan_bien.json` | `test_luu_nien_nhan_tuong_khop_bai_ca_than_tuong_toan_bien` | WS-2: 20 tuổi mốc khớp tên bộ vị + thứ tự của «流年運氣部位歌»; WS-4 / KT-NT3: tuổi 10–14 sửa theo chữ sách (Nhân Luân, Địa Luân) |
| `nhan_tuong_kb.json` | bai_ca_luu_nien | `than_tuong_toan_bien.json` | `test_moi_chang_la_nguyen_van_va_dung_thu_tu` | WS-4: bài ca cắt theo 67 chặng tuổi, phủ đủ 1–100; lời Việt là tóm ý |
| `nhan_tuong_kieu_hinh.json` | (cả tệp) | `than_tuong_toan_bien.json` | `test_moi_muc_qua_bo_kiem` | SX-C: 119 kiểu hình mày, mắt, mũi, tai, miệng (bài thơ từng kiểu) khớp kho nguồn; 7 mục gắn `ngo` |
| `nhan_tuong_lieu_trang.json` | (cả tệp) | `lieu_trang_tuong_phap.json` | `test_moi_muc_qua_bo_kiem` | SX-C: Liễu Trang tướng pháp — kho nguồn là bản gõ chưa hiệu đính (can_doi_chieu), chỉ trích câu ngắn |
| `nhan_tuong_sach_ghi.json` | (cả tệp) | `than_tuong_toan_bien.json` | `test_moi_muc_qua_bo_kiem` | SX-C: câu Thần Tướng Toàn Biên gắn với nét khảo sát + 12 cung trên mặt |
| `nhantuong_ngu_hanh_va_co_thu.json` | quy_tac_co_thu | `lieu_trang_tuong_phap.json` | `test_moi_muc_qua_bo_kiem` | PR #320 (2026-11-20): 81/150 quy tắc giữ lại, mỗi câu Hán khớp kho nguồn Liễu Trang tướng pháp / Thần Tướng Toàn Biên (than_tuong_toan_bien.json); lời Việt khuôn SX-C do ban biên tập viết |
| `phongthuy_cung_menh.json` | (cả tệp) | `duong_trach_thap_thu.json` | `test_cung_menh_khop_phep_tinh` | SX-C: chín điều bố trí × 8 cung (東/西四位宅圖說); phương + du niên khớp phép tính Bát trạch |
| `phongthuy_huyen_khong.json` | to_hop_81 | `phongthuy_huyen_khong_co_thu.json` | `test_to_hop_81_sach_qua_bo_kiem_sx_c` | Gói 1A: 28 tổ hợp sao tiêu biểu có câu nguyên văn Tử Bạch Đoạn / Phi Tinh Phú qua bộ kiểm SX-C; Thành Môn Quyết + Hạ Quái/Thế Quái đối chiếu Thẩm Thị Huyền Không Học (huyen_khong_tham_thi.json) |
| `phongthuy_kb.json` | du_nien | `duong_trach_thap_thu.json` | `test_cau_trich_kb_la_nguyen_van` | KT-PT1: 8 du niên có câu «吉星三 / 凶星五» của Dương Trạch Thập Thư; phép tính du niên + bảng cung phi 180 năm khớp sách (test_dai_du_nien_ca_khop_phep_tinh, test_bang_cung_phi_180_nam_khop_phep_tinh); lời ý nghĩa vẫn là tóm ý |
| `phongthuy_kb.json` | sach_xua_nha | `duong_trach_thap_thu.json` | `test_moi_cau_la_nguyen_van_kho_nguon` | WS-3: câu Dương Trạch Thập Thư cho khối «Sách xưa nói gì về nhà của bạn»; lời Việt là tóm ý |
| `phongthuy_sach_ghi.json` | (cả tệp) | `duong_trach_thap_thu.json` | `test_moi_muc_qua_bo_kiem` | SX-C: 116 điều về thế nhà (論宅外形, 內形篇, 何知經…) khớp kho nguồn; vế 'vì sao hợp lẽ thường' là lời biên tập |
| `tarot_kb.json` | (cả tệp) | `tarot_waite_1910.json` | `test_moi_trich_la_nguyen_van_cua_nguon` | câu trích khớp Waite / Mathers / Book T / Papus 1892 / Case 1920 / Ouspensky 1913; lời lớp Marseille, B.O.T.A., Thoth vẫn là tóm ý (Marseille đã soát với Mathers + Papus, B.O.T.A. ẩn chính với Case 1920) |
| `thanso_chaldean.json` | kep | `thanso_cheiro_book_of_numbers_1926.json` | `test_moi_so_kep_co_cau_sach` | TK-2: 43/43 số kép có câu Cheiro (OCR, can_doi_chieu); bảng chữ 23/26 khớp; lời Việt là tóm ý trung tính |
| `tuvi_co_thu.json` | cau | `tu_vi_dau_so_toan_thu.json` | `test_nguyen_van_khop_kho_nguon_toan_thu_tung_chu` | 84 câu Cốt Tuỷ Phú khớp từng chữ (giản ↔ phồn); phiên âm, nghĩa là nháp; chưa so bản khắc 1600 |
| `tuvi_kb.json` | phu_tinh_cung | `tu_vi_dau_so_toan_thu.json` | `test_phu_tinh_cung_khop_nguyen_van_toan_thu` |  |
| `tuvi_sach_ghi.json` | (cả tệp) | `tu_vi_dau_so_toan_thu.json` | `test_moi_muc_qua_bo_kiem` | SX-C: 434 câu Toàn Thư quyển 3 (sao × cung) khớp kho nguồn; lời Việt là tóm ý đã nói giảm (A / B / C) |

## Toàn bộ sổ

| Mảng | Tệp | Phần | Mức | Ghi chú |
|---|---|---|---|---|
| Bát tự | `battu_dieu_hau.json` |  | Có nguyên văn đối chiếu |  |
| Bát tự | `battu_doi_song_kb.json` |  | Ban biên tập soạn |  |
| Bát tự | `battu_doi_song_kb.json` | cach | Tóm ý cổ thư, chưa khớp từng câu | ba cách Thất Sát / Chính Ấn / Thiên Ấn đã khớp «Luận dụng thần» (Q5) |
| Bát tự | `battu_doi_song_kb.json` | ngoai_cach | Có nguyên văn đối chiếu | câu hỷ / kỵ khớp nguyên văn; lời đời thường là tóm ý |
| Bát tự | `battu_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Bát tự | `battu_kb.json` | co_tho | Có nguyên văn đối chiếu |  |
| Bát tự | `battu_kb.json` | co_van_thap_than | Có nguyên văn đối chiếu |  |
| Bát tự | `battu_kb.json` | nap_am | Tập quán / sách hiện đại tóm ý |  |
| Bát tự | `battu_kb.json` | mau | Ban biên tập soạn |  |
| Bát tự | `battu_kb.json` | giai_thich | Ban biên tập soạn |  |
| Bát tự | `battu_luan_hoi_kb.json` |  | Ban biên tập soạn | lớp Luận theo câu hỏi Bát tự (LH-2) |
| Bát tự | `battu_ngay_gio.json` |  | Có nguyên văn đối chiếu | TK-2: 120 bài ca chung «六X日Y時斷» quyển 8–9, mỗi câu đúng mục can ngày × giờ |
| Bát tự | `battu_sach_ghi.json` |  | Có nguyên văn đối chiếu | SX-C: câu Tam Mệnh Thông Hội + Uyên Hải Tử Bình (thần sát, thập thần, lục thân, tính nết, thân thể) khớp kho nguồn |
| Bát tự | `battu_thien_ly_menh_cao.json` |  | Tập quán / sách hiện đại tóm ý | Đợt 3: 6 quy tắc Thập Thần & Cách Cục 2 chiều trích dẫn có phép từ Thiên Lý Mệnh Cảo (Vi Thiên Lý, 1934 — bazi-kb) |
| Bát tự | `bo_sung_nhat_chu.json` |  | Ban biên tập soạn |  |
| Bát tự | `bo_sung_thap_than.json` |  | Ban biên tập soạn |  |
| Tử vi | `bo_sung_cung.json` |  | Ban biên tập soạn |  |
| Tử vi | `bo_sung_hoa_cung.json` |  | Ban biên tập soạn |  |
| Tử vi | `bo_sung_sao.json` |  | Ban biên tập soạn |  |
| Tử vi | `su_kien_kb.json` |  | Ban biên tập soạn |  |
| Tử vi | `tuvi_cach_cuc.json` |  | Tóm ý cổ thư, chưa khớp từng câu | 7 cách có `sach_ghi` khớp «định phú / quý cục» (test_cach_cuc_sach_ghi_khop_dinh_cuc_toan_thu); 37 cách có cổ ca trỏ Cốt Tuỷ Phú; Quân thần khánh hội + Nguyệt sinh thương hải sửa theo sách (KT-TT8); Mã đầu đới kiếm, Lộc Mã bội ấn giữ cách phổ biến, gắn `khac_dieu_kien` |
| Tử vi | `tuvi_co_thu.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Tử vi | `tuvi_co_thu.json` | cau | Có nguyên văn đối chiếu | 84 câu Cốt Tuỷ Phú khớp từng chữ (giản ↔ phồn); phiên âm, nghĩa là nháp; chưa so bản khắc 1600 |
| Tử vi | `tuvi_cung_sao_menh_kb.json` |  | Ban biên tập soạn |  |
| Tử vi | `tuvi_doi_song_kb.json` |  | Ban biên tập soạn |  |
| Tử vi | `tuvi_hai_nguoi_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Tử vi | `tuvi_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Tử vi | `tuvi_kb.json` | phu_tinh_cung | Có nguyên văn đối chiếu |  |
| Tử vi | `tuvi_kb.json` | sao_nho | Tập quán / sách hiện đại tóm ý | tóm ý Tử vi đẩu số tân biên + tên phái Trung Châu; từng mục có do_tin |
| Tử vi | `tuvi_kb.json` | mau | Ban biên tập soạn |  |
| Tử vi | `tuvi_kb.json` | giai_thich | Ban biên tập soạn |  |
| Tử vi | `tuvi_kb.json` | doc_tung_buoc | Ban biên tập soạn |  |
| Tử vi | `tuvi_luan_hoi_kb.json` |  | Ban biên tập soạn | lớp Luận theo câu hỏi (LH-1); tập quán dân gian ghi theo phong tục, không phải cổ thư |
| Tử vi | `tuvi_phi_hoa_kb.json` |  | Tập quán / sách hiện đại tóm ý | phi tinh tứ hoá — trường phái hiện đại |
| Tử vi | `tuvi_phi_hoa_luong_672.json` |  | Tập quán / sách hiện đại tóm ý | Đợt 3: 577 mục Phi Tinh Tứ Hóa trích xuất có phép từ Lương Nhược Du (Thập Nhị Cung Lục Thất Nhị Tượng — ziwei-liang-kb) |
| Tử vi | `tuvi_sach_ghi.json` |  | Có nguyên văn đối chiếu | SX-C: 434 câu Toàn Thư quyển 3 (sao × cung) khớp kho nguồn; lời Việt là tóm ý đã nói giảm (A / B / C) |
| Tử vi | `tuvi_sao_luu_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Tử vi | `tuvi_trung_chau_60_tinh_he.json` |  | Tập quán / sách hiện đại tóm ý | Đợt 3: 60/60 Tinh Hệ Trung Châu trích xuất có phép từ Vương Đình Chi (Trung Châu Phái Thâm Tạo Giảng Nghĩa — ziwei-zhongzhou-kb) |
| Tử vi | `tuvi_tu_van_thai_tue.json` |  | Tập quán / sách hiện đại tóm ý | Đợt 4: 6 nguyên tắc cốt lõi Tử Vân (Thái Tuế Nhập Quái · Tam Đại Tiên Hậu Thiên · Giáp Cung — ziwei-ziyun-kb) |
| Tử vi | `tuvi_y_bo_sung.json` |  | Tập quán / sách hiện đại tóm ý | rút ý lời giảng hiện đại, viết lại (TV-YBS) |
| Kinh Dịch | `bo_sung_que.json` |  | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_dich_lam.json` |  | Có nguyên văn đối chiếu | TK-2: 4.096 bài từ Tiêu Thị Dịch Lâm (quẻ bản → quẻ biến), nguyên văn chưa dịch; bài có chữ nặng không hiện |
| Kinh Dịch | `kinhdich_doi_song.json` |  | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_hao.json` |  | Có nguyên văn đối chiếu | kinh văn khớp nguyên văn; phần dịch và «Hiểu đơn giản» là nháp |
| Kinh Dịch | `kinhdich_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Kinh Dịch | `kinhdich_kb.json` | bat_quai | Có nguyên văn đối chiếu | loại tượng khớp Thuyết Quái |
| Kinh Dịch | `kinhdich_kb.json` | mau | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_kb.json` | giai_thich | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_legge.json` |  | Có nguyên văn đối chiếu | TK-2 việc 4: bản dịch Anh James Legge 1882 (PD) — chỉ quẻ qua kiểm vạch âm dương + kiểm chữ hỏng; chỉ bản /en |
| Kinh Dịch | `kinhdich_luc_hao_thuc_chien.json` |  | Tập quán / sách hiện đại tóm ý | Đợt 2B: 8 nguyên tắc Lục Hào + 5 Lục Thân thực chiến đối chiếu & trích dẫn chữ Hán có phép từ Vương Hổ Ứng & Thiệu Vĩ Hoa (iching-kb) |
| Kinh Dịch | `kinhdich_tra_loi.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Kinh Dịch | `kinhdich_tra_loi.json` | tinh_chat_que | Có nguyên văn đối chiếu |  |
| Kinh Dịch | `kinhdich_tra_loi.json` | sach_xua_viec | Có nguyên văn đối chiếu | WS-5: câu Tăng San Bốc Dịch theo chương ứng với việc; lời Việt là tóm ý |
| Kinh Dịch | `kinhdich_tra_loi.json` | mau | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_tra_loi.json` | kieu_cau | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_truyen_nghia.json` |  | Có nguyên văn đối chiếu | bản dịch Ngô Tất Tố ghép theo chữ Hán |
| Phong thuỷ | `bo_sung_dau_hieu.json` |  | Ban biên tập soạn |  |
| Phong thuỷ | `phongthuy_cung_menh.json` |  | Có nguyên văn đối chiếu | SX-C: chín điều bố trí × 8 cung (東/西四位宅圖說); phương + du niên khớp phép tính Bát trạch |
| Phong thuỷ | `phongthuy_do_thi.json` |  | Ban biên tập soạn |  |
| Phong thuỷ | `phongthuy_doi_song.json` |  | Ban biên tập soạn |  |
| Phong thuỷ | `phongthuy_huyen_khong.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Phong thuỷ | `phongthuy_huyen_khong.json` | to_hop_81 | Có nguyên văn đối chiếu | Gói 1A: 28 tổ hợp sao tiêu biểu có câu nguyên văn Tử Bạch Đoạn / Phi Tinh Phú qua bộ kiểm SX-C; Thành Môn Quyết + Hạ Quái/Thế Quái đối chiếu Thẩm Thị Huyền Không Học (huyen_khong_tham_thi.json) |
| Phong thuỷ | `phongthuy_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu | KT-PT1: 7 dấu hiệu `bo_tri` có câu nguyên văn (`sach`); phần còn lại chưa khớp từng câu |
| Phong thuỷ | `phongthuy_kb.json` | du_nien | Có nguyên văn đối chiếu | KT-PT1: 8 du niên có câu «吉星三 / 凶星五» của Dương Trạch Thập Thư; phép tính du niên + bảng cung phi 180 năm khớp sách (test_dai_du_nien_ca_khop_phep_tinh, test_bang_cung_phi_180_nam_khop_phep_tinh); lời ý nghĩa vẫn là tóm ý |
| Phong thuỷ | `phongthuy_kb.json` | sach_xua_nha | Có nguyên văn đối chiếu | WS-3: câu Dương Trạch Thập Thư cho khối «Sách xưa nói gì về nhà của bạn»; lời Việt là tóm ý |
| Phong thuỷ | `phongthuy_sach_ghi.json` |  | Có nguyên văn đối chiếu | SX-C: 116 điều về thế nhà (論宅外形, 內形篇, 何知經…) khớp kho nguồn; vế 'vì sao hợp lẽ thường' là lời biên tập |
| Phong thuỷ | `phongthuy_tam_yeu.json` |  | Tập quán / sách hiện đại tóm ý | SX-C: tóm ý Dương Trạch Tam Yếu + Bát Trạch Minh Kính qua BẢN DỊCH Việt hiện đại (chưa có nguyên văn chữ Hán trong kho nguồn); du niên 64 nhà + 64 bếp khớp phép tính |
| Nhân tướng | `chi_tay_kb.json` |  | Có nguyên văn đối chiếu | Chỉ tay: 67 bài thơ vân tay quyển 10 + câu đồ hình tám cung («根基所屬», Luận thủ) khớp kho nguồn; CT-2: câu theo số đo bàn tay (`sach_do_tay`: «論手», «相指掌») + vai và lựa chọn từng cung (`cung_tay`: «根基所屬») qua bộ kiểm SX-C (tests/test_chi_tay_do.py); ngưỡng đo `do_tay` là giả định nhân trắc, can_doi_chieu; lời Việt nói giảm theo SX-C; 5 hình sách đoán về người vợ không đưa vào |
| Nhân tướng | `chi_tay_tay_kb.json` |  | Có nguyên văn đối chiếu | TK-2 chỉ tay phương Tây: câu trích tiếng Anh Cheiro 1894 + Benham 1900 (kho nguồn lớp chữ nhận dạng, can_doi_chieu) khớp từng câu; lời Việt ban biên tập; ngưỡng số đo `do_tay` giả định, can_doi_chieu; không nhóm C |
| Nhân tướng | `chitay_phuong_tay_kinh_dien.json` |  | Tập quán / sách hiện đại tóm ý | Đợt 4: 4 Đường Chính & 7 Gò Bàn Tay 2 chiều từ Cheiro (1916), Benham (1912) & Dale (1895) (palmistry-western-kb) |
| Nhân tướng | `nhan_tuong_do_hinh.json` |  | Tóm ý cổ thư, chưa khớp từng câu | lớp phủ đồ hình: nhãn chữ Hán đọc trên bản khắc Thần Tướng Toàn Biên; toạ độ đo trên ảnh; lời Việt rút từ KB |
| Nhân tướng | `nhan_tuong_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu | KT-NT1/2 + KT-N1 + KT-NT3: cả 70 câu trích sách (`dac_diem.*.sach`) khớp kho nguồn `nhan_tuong_co_thu.json` + `than_tuong_toan_bien.json` (Thần Tướng Toàn Biên bản Cổ Kim Đồ Thư Tập Thành, Băng Giám, Tâm Tướng Thiên, Linh Khu, 4 sách Tứ khố — tests/test_kt_nt1_kho_nguon.py); lời luận vẫn là tóm ý, trường `nguon` Ma Y / Thần Tướng Toàn Biên chỉ ghi phái |
| Nhân tướng | `nhan_tuong_kb.json` | luu_nien | Có nguyên văn đối chiếu | WS-2: 20 tuổi mốc khớp tên bộ vị + thứ tự của «流年運氣部位歌»; WS-4 / KT-NT3: tuổi 10–14 sửa theo chữ sách (Nhân Luân, Địa Luân) |
| Nhân tướng | `nhan_tuong_kb.json` | bai_ca_luu_nien | Có nguyên văn đối chiếu | WS-4: bài ca cắt theo 67 chặng tuổi, phủ đủ 1–100; lời Việt là tóm ý |
| Nhân tướng | `nhan_tuong_kieu_hinh.json` |  | Có nguyên văn đối chiếu | SX-C: 119 kiểu hình mày, mắt, mũi, tai, miệng (bài thơ từng kiểu) khớp kho nguồn; 7 mục gắn `ngo` |
| Nhân tướng | `nhan_tuong_lieu_trang.json` |  | Có nguyên văn đối chiếu | SX-C: Liễu Trang tướng pháp — kho nguồn là bản gõ chưa hiệu đính (can_doi_chieu), chỉ trích câu ngắn |
| Nhân tướng | `nhan_tuong_sach_ghi.json` |  | Có nguyên văn đối chiếu | SX-C: câu Thần Tướng Toàn Biên gắn với nét khảo sát + 12 cung trên mặt |
| Nhân tướng | `nhantuong_ngu_hanh_va_co_thu.json` |  | Tập quán / sách hiện đại tóm ý | Đợt 4: 5 Hình Tướng Ngũ Hành tóm ý theo Lillian Bridges (2012, còn bản quyền — không chép nguyên văn) |
| Nhân tướng | `nhantuong_ngu_hanh_va_co_thu.json` | quy_tac_co_thu | Có nguyên văn đối chiếu | PR #320 (2026-11-20): 81/150 quy tắc giữ lại, mỗi câu Hán khớp kho nguồn Liễu Trang tướng pháp / Thần Tướng Toàn Biên (than_tuong_toan_bien.json); lời Việt khuôn SX-C do ban biên tập viết |
| Nhân tướng | `nhantuong_ngu_hanh_va_co_thu.json` | quy_tac_khong_dua | Ban biên tập soạn | 69 quy tắc không đưa ra người dùng, chỉ còn mã + lý do |
| Tarot | `tarot_greer_nguoc.json` |  | Tập quán / sách hiện đại tóm ý | Đợt 2B: 22 Lá Ẩn Chính ngược đối chiếu & trích dẫn có phép từ Mary K. Greer (2002), phân tích 2 mặt tích cực + tiêu cực cần chú ý |
| Tarot | `tarot_kb.json` |  | Có nguyên văn đối chiếu | câu trích khớp Waite / Mathers / Book T / Papus 1892 / Case 1920 / Ouspensky 1913; lời lớp Marseille, B.O.T.A., Thoth vẫn là tóm ý (Marseille đã soát với Mathers + Papus, B.O.T.A. ẩn chính với Case 1920) |
| Kỳ Môn | `ky_mon_bi_kip_cuu_don.json` |  | Tóm ý cổ thư, chưa khớp từng câu | Cửu Độn: lời đời thường tóm ý theo Kỳ Môn Độn Giáp Bí Kíp Đại Toàn q.21; câu sách đi kèm (`sach_ghi`) là nguyên văn Độn Giáp Diễn Nghĩa quyển 2, khớp kho nguồn don_giap_dien_nghia.json qua tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem (PR #320, 2026-11-20) |
| Kỳ Môn | `ky_mon_kb.json` |  | Ban biên tập soạn | KM-2: lời đời thường về cửa, sao, thần, cách cục do ban biên tập viết |
| Kỳ Môn | `ky_mon_kb.json` | cua | Có nguyên văn đối chiếu | mỗi cửa một câu «釋八門所主» |
| Kỳ Môn | `ky_mon_kb.json` | sao | Có nguyên văn đối chiếu | mỗi sao một câu «釋九星所主» |
| Kỳ Môn | `ky_mon_kb.json` | cach | Có nguyên văn đối chiếu | điều kiện từng cách thử bằng ví dụ «假令» của sách (tests/test_ky_mon_cach.py); lời đời thường là tóm ý |
| Thần số | `bo_sung_cap_so.json` |  | Ban biên tập soạn |  |
| Thần số | `bo_sung_nam_ca_nhan.json` |  | Ban biên tập soạn |  |
| Thần số | `bo_sung_nghe.json` |  | Ban biên tập soạn |  |
| Thần số | `bo_sung_no_nghiep.json` |  | Ban biên tập soạn |  |
| Thần số | `bo_sung_so.json` |  | Ban biên tập soạn |  |
| Thần số | `bo_sung_so_kep.json` |  | Ban biên tập soạn |  |
| Thần số | `bo_sung_tinh_yeu.json` |  | Ban biên tập soạn |  |
| Thần số | `thanso_ban_do.json` |  | Ban biên tập soạn |  |
| Thần số | `thanso_bieu_do.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_cap_so.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_chaldean.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_chaldean.json` | kep | Có nguyên văn đối chiếu | TK-2: 43/43 số kép có câu Cheiro (OCR, can_doi_chieu); bảng chữ 23/26 khớp; lời Việt là tóm ý trung tính |
| Thần số | `thanso_chan_dung.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_chi_so_phu.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_depth.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_do_thi.json` |  | Ban biên tập soạn |  |
| Thần số | `thanso_doi_chieu.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_giai_thich.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_hom_nay.json` |  | Ban biên tập soạn |  |
| Thần số | `thanso_linh_vuc.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_meanings.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_noi_dau.json` |  | Ban biên tập soạn |  |
| Thần số | `thanso_phillips_kb.json` |  | Ban biên tập soạn |  |
| Thần số | `thanso_quan_he.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_xu_ly.json` |  | Ban biên tập soạn |  |
| Lịch · tuổi · tập quán | `gia_dinh_kb.json` |  | Tập quán / sách hiện đại tóm ý | GD-1: lời cặp con giáp, điều tập quán từng người — nháp |
| Lịch · tuổi · tập quán | `hoang_lich_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu | bảng nghi / kỵ theo sách lịch; tên Việt + nghĩa là nháp |
| Lịch · tuổi · tập quán | `nam_tong_quan_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Lịch · tuổi · tập quán | `sao_han_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Lịch · tuổi · tập quán | `thoi_gian_lop_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Lịch · tuổi · tập quán | `tuoi_dan_gian_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Liên mảng · kỹ thuật | `chan_dung_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `chu_y_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `chuyen_nghia_kb.json` |  | Ban biên tập soạn | nghĩa đời nay do ban biên tập viết |
| Liên mảng · kỹ thuật | `chuyen_nghia_kb.json` | khai_niem | Có nguyên văn đối chiếu | mỗi khái niệm một câu sách khớp kho nguồn; nghĩa đời nay là biên tập |
| Liên mảng · kỹ thuật | `dong_thuan_thong_ke.json` |  | Tệp kỹ thuật |  |
| Liên mảng · kỹ thuật | `giao_thoa_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `goc_nhin.json` |  | Tệp kỹ thuật |  |
| Liên mảng · kỹ thuật | `goi_y_cheo_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `hoan_canh_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `ngay_cap_nhat.json` |  | Tệp kỹ thuật |  |
| Liên mảng · kỹ thuật | `nhat_quan_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `push_sang_nay.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `sinh_nuoc_ngoai_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `slug_en.json` |  | Tệp kỹ thuật |  |
| Liên mảng · kỹ thuật | `suc_khoe_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu | hành ↔ tạng phủ theo Nội Kinh; tên bệnh hay gặp là kiến thức phổ thông (SK-2) |
| Liên mảng · kỹ thuật | `ten_en.json` |  | Tệp kỹ thuật |  |
| Liên mảng · kỹ thuật | `tham_dinh.json` |  | Tệp kỹ thuật |  |
| Liên mảng · kỹ thuật | `thuat_ngu_en.json` |  | Tệp kỹ thuật |  |
| Liên mảng · kỹ thuật | `tu_dien.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `tuan_hai_nguoi_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `y_dinh_chung.json` |  | Ban biên tập soạn |  |

## Cách nâng mức một phần

1. Nạp nguyên văn cổ thư công cộng vào `engine/fixtures/nguon/` (bộ nạp trong `engine/scripts/nap_*.py`).
2. Thêm trường trích vào KB và viết test "câu trích là chuỗi con nguyên văn".
3. Sửa sổ `do_tin.py` (ghi tên kho + tên test) rồi chạy lại script này.
