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
| Bát tự | 2 | 1 |  | 3 |  |
| Tử vi | 1 | 3 | 4 | 6 |  |
| Kinh Dịch | 2 | 2 |  | 2 |  |
| Phong thuỷ | 2 | 2 | 1 | 3 |  |
| Nhân tướng | 4 | 2 |  |  |  |
| Tarot | 1 |  |  |  |  |
| Thần số |  |  | 11 | 12 |  |
| Lịch · tuổi · tập quán |  | 1 | 4 |  |  |
| Liên mảng · kỹ thuật |  | 1 |  | 11 | 7 |

## Phần đã có nguyên văn đối chiếu (test khoá)

| Tệp | Phần | Kho nguồn | Test | Ghi chú |
|---|---|---|---|---|
| `battu_dieu_hau.json` | (cả tệp) | `cung_thong_bao_giam.json` | `test_dieu_hau_khop_nguyen_van_tung_o` |  |
| `battu_doi_song_kb.json` | ngoai_cach | `tu_binh_chan_thuyen.json` | `test_trich_la_nguyen_van` | câu hỷ / kỵ khớp nguyên văn; lời đời thường là tóm ý |
| `battu_kb.json` | co_tho | `uyen_hai_tu_binh.json` | `test_co_tho_nhat_chu_khop_nguyen_van_uyen_hai` |  |
| `battu_kb.json` | co_van_thap_than | `uyen_hai_tu_binh.json` | `test_co_van_thap_than_khop_nguyen_van_uyen_hai` |  |
| `battu_sach_ghi.json` | (cả tệp) | `tam_menh_thong_hoi.json` | `test_moi_muc_qua_bo_kiem` | SX-C: câu Tam Mệnh Thông Hội + Uyên Hải Tử Bình (thần sát, thập thần, lục thân, tính nết, thân thể) khớp kho nguồn |
| `chi_tay_kb.json` | (cả tệp) | `than_tuong_toan_bien.json` | `test_moi_cau_la_nguyen_van` | Chỉ tay: 67 bài thơ vân tay quyển 10 + câu Ngọc Chưởng Ký / Luận thủ của đồ hình tám cung khớp kho nguồn; lời Việt nói giảm theo SX-C; 5 hình sách đoán về người vợ không đưa vào |
| `kinhdich_hao.json` | (cả tệp) | `chu_dich_truyen_nghia.json` | `test_loi_que_loi_hao_trong_kb_khop_ban_tu_kho` | kinh văn khớp nguyên văn; phần dịch và «Hiểu đơn giản» là nháp |
| `kinhdich_kb.json` | bat_quai | `chu_dich_truyen_nghia.json` | `test_loai_tuong_tam_quai_trich_dung_thuyet_quai` | loại tượng khớp Thuyết Quái |
| `kinhdich_tra_loi.json` | tinh_chat_que | `tang_san_boc_dich.json` | `test_trich_la_nguyen_van_va_kb_du_loi` |  |
| `kinhdich_tra_loi.json` | sach_xua_viec | `tang_san_boc_dich.json` | `test_cau_la_nguyen_van_trong_dung_chuong` | WS-5: câu Tăng San Bốc Dịch theo chương ứng với việc; lời Việt là tóm ý |
| `kinhdich_truyen_nghia.json` | (cả tệp) | `chu_dich_truyen_nghia.json` | `test_ngo_tat_to_ghep_dung_hao_va_du_do_phu` | bản dịch Ngô Tất Tố ghép theo chữ Hán |
| `nhan_tuong_kb.json` | luu_nien | `than_tuong_toan_bien.json` | `test_luu_nien_nhan_tuong_khop_bai_ca_than_tuong_toan_bien` | WS-2: 20 tuổi mốc khớp tên bộ vị + thứ tự của «流年運氣部位歌»; WS-4 / KT-NT3: tuổi 10–14 sửa theo chữ sách (Nhân Luân, Địa Luân) |
| `nhan_tuong_kb.json` | bai_ca_luu_nien | `than_tuong_toan_bien.json` | `test_moi_chang_la_nguyen_van_va_dung_thu_tu` | WS-4: bài ca cắt theo 67 chặng tuổi, phủ đủ 1–100; lời Việt là tóm ý |
| `nhan_tuong_kieu_hinh.json` | (cả tệp) | `than_tuong_toan_bien.json` | `test_moi_muc_qua_bo_kiem` | SX-C: 119 kiểu hình mày, mắt, mũi, tai, miệng (bài thơ từng kiểu) khớp kho nguồn; 7 mục gắn `ngo` |
| `nhan_tuong_lieu_trang.json` | (cả tệp) | `lieu_trang_tuong_phap.json` | `test_moi_muc_qua_bo_kiem` | SX-C: Liễu Trang tướng pháp — kho nguồn là bản gõ chưa hiệu đính (can_doi_chieu), chỉ trích câu ngắn |
| `nhan_tuong_sach_ghi.json` | (cả tệp) | `than_tuong_toan_bien.json` | `test_moi_muc_qua_bo_kiem` | SX-C: câu Thần Tướng Toàn Biên gắn với nét khảo sát + 12 cung trên mặt |
| `phongthuy_cung_menh.json` | (cả tệp) | `duong_trach_thap_thu.json` | `test_cung_menh_khop_phep_tinh` | SX-C: chín điều bố trí × 8 cung (東/西四位宅圖說); phương + du niên khớp phép tính Bát trạch |
| `phongthuy_kb.json` | du_nien | `duong_trach_thap_thu.json` | `test_cau_trich_kb_la_nguyen_van` | KT-PT1: 8 du niên có câu «吉星三 / 凶星五» của Dương Trạch Thập Thư; phép tính du niên + bảng cung phi 180 năm khớp sách (test_dai_du_nien_ca_khop_phep_tinh, test_bang_cung_phi_180_nam_khop_phep_tinh); lời ý nghĩa vẫn là tóm ý |
| `phongthuy_kb.json` | sach_xua_nha | `duong_trach_thap_thu.json` | `test_moi_cau_la_nguyen_van_kho_nguon` | WS-3: câu Dương Trạch Thập Thư cho khối «Sách xưa nói gì về nhà của bạn»; lời Việt là tóm ý |
| `phongthuy_sach_ghi.json` | (cả tệp) | `duong_trach_thap_thu.json` | `test_moi_muc_qua_bo_kiem` | SX-C: 116 điều về thế nhà (論宅外形, 內形篇, 何知經…) khớp kho nguồn; vế 'vì sao hợp lẽ thường' là lời biên tập |
| `tarot_kb.json` | (cả tệp) | `tarot_waite_1910.json` | `test_moi_trich_la_nguyen_van_cua_nguon` | câu trích khớp Waite / Mathers / Book T / Papus 1892 / Case 1920 / Ouspensky 1913; lời lớp Marseille, B.O.T.A., Thoth vẫn là tóm ý (Marseille đã soát với Mathers + Papus, B.O.T.A. ẩn chính với Case 1920) |
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
| Bát tự | `battu_sach_ghi.json` |  | Có nguyên văn đối chiếu | SX-C: câu Tam Mệnh Thông Hội + Uyên Hải Tử Bình (thần sát, thập thần, lục thân, tính nết, thân thể) khớp kho nguồn |
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
| Tử vi | `tuvi_phi_hoa_kb.json` |  | Tập quán / sách hiện đại tóm ý | phi tinh tứ hoá — trường phái hiện đại |
| Tử vi | `tuvi_sach_ghi.json` |  | Có nguyên văn đối chiếu | SX-C: 434 câu Toàn Thư quyển 3 (sao × cung) khớp kho nguồn; lời Việt là tóm ý đã nói giảm (A / B / C) |
| Tử vi | `tuvi_sao_luu_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Tử vi | `tuvi_y_bo_sung.json` |  | Tập quán / sách hiện đại tóm ý | rút ý lời giảng hiện đại, viết lại (TV-YBS) |
| Kinh Dịch | `bo_sung_que.json` |  | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_doi_song.json` |  | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_hao.json` |  | Có nguyên văn đối chiếu | kinh văn khớp nguyên văn; phần dịch và «Hiểu đơn giản» là nháp |
| Kinh Dịch | `kinhdich_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Kinh Dịch | `kinhdich_kb.json` | bat_quai | Có nguyên văn đối chiếu | loại tượng khớp Thuyết Quái |
| Kinh Dịch | `kinhdich_kb.json` | mau | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_kb.json` | giai_thich | Ban biên tập soạn |  |
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
| Phong thuỷ | `phongthuy_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu | KT-PT1: 7 dấu hiệu `bo_tri` có câu nguyên văn (`sach`); phần còn lại chưa khớp từng câu |
| Phong thuỷ | `phongthuy_kb.json` | du_nien | Có nguyên văn đối chiếu | KT-PT1: 8 du niên có câu «吉星三 / 凶星五» của Dương Trạch Thập Thư; phép tính du niên + bảng cung phi 180 năm khớp sách (test_dai_du_nien_ca_khop_phep_tinh, test_bang_cung_phi_180_nam_khop_phep_tinh); lời ý nghĩa vẫn là tóm ý |
| Phong thuỷ | `phongthuy_kb.json` | sach_xua_nha | Có nguyên văn đối chiếu | WS-3: câu Dương Trạch Thập Thư cho khối «Sách xưa nói gì về nhà của bạn»; lời Việt là tóm ý |
| Phong thuỷ | `phongthuy_sach_ghi.json` |  | Có nguyên văn đối chiếu | SX-C: 116 điều về thế nhà (論宅外形, 內形篇, 何知經…) khớp kho nguồn; vế 'vì sao hợp lẽ thường' là lời biên tập |
| Phong thuỷ | `phongthuy_tam_yeu.json` |  | Tập quán / sách hiện đại tóm ý | SX-C: tóm ý Dương Trạch Tam Yếu + Bát Trạch Minh Kính qua BẢN DỊCH Việt hiện đại (chưa có nguyên văn chữ Hán trong kho nguồn); du niên 64 nhà + 64 bếp khớp phép tính |
| Nhân tướng | `chi_tay_kb.json` |  | Có nguyên văn đối chiếu | Chỉ tay: 67 bài thơ vân tay quyển 10 + câu Ngọc Chưởng Ký / Luận thủ của đồ hình tám cung khớp kho nguồn; lời Việt nói giảm theo SX-C; 5 hình sách đoán về người vợ không đưa vào |
| Nhân tướng | `nhan_tuong_do_hinh.json` |  | Tóm ý cổ thư, chưa khớp từng câu | lớp phủ đồ hình: nhãn chữ Hán đọc trên bản khắc Thần Tướng Toàn Biên; toạ độ đo trên ảnh; lời Việt rút từ KB |
| Nhân tướng | `nhan_tuong_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu | KT-NT1/2 + KT-N1 + KT-NT3: cả 70 câu trích sách (`dac_diem.*.sach`) khớp kho nguồn `nhan_tuong_co_thu.json` + `than_tuong_toan_bien.json` (Thần Tướng Toàn Biên bản Cổ Kim Đồ Thư Tập Thành, Băng Giám, Tâm Tướng Thiên, Linh Khu, 4 sách Tứ khố — tests/test_kt_nt1_kho_nguon.py); lời luận vẫn là tóm ý, trường `nguon` Ma Y / Thần Tướng Toàn Biên chỉ ghi phái |
| Nhân tướng | `nhan_tuong_kb.json` | luu_nien | Có nguyên văn đối chiếu | WS-2: 20 tuổi mốc khớp tên bộ vị + thứ tự của «流年運氣部位歌»; WS-4 / KT-NT3: tuổi 10–14 sửa theo chữ sách (Nhân Luân, Địa Luân) |
| Nhân tướng | `nhan_tuong_kb.json` | bai_ca_luu_nien | Có nguyên văn đối chiếu | WS-4: bài ca cắt theo 67 chặng tuổi, phủ đủ 1–100; lời Việt là tóm ý |
| Nhân tướng | `nhan_tuong_kieu_hinh.json` |  | Có nguyên văn đối chiếu | SX-C: 119 kiểu hình mày, mắt, mũi, tai, miệng (bài thơ từng kiểu) khớp kho nguồn; 7 mục gắn `ngo` |
| Nhân tướng | `nhan_tuong_lieu_trang.json` |  | Có nguyên văn đối chiếu | SX-C: Liễu Trang tướng pháp — kho nguồn là bản gõ chưa hiệu đính (can_doi_chieu), chỉ trích câu ngắn |
| Nhân tướng | `nhan_tuong_sach_ghi.json` |  | Có nguyên văn đối chiếu | SX-C: câu Thần Tướng Toàn Biên gắn với nét khảo sát + 12 cung trên mặt |
| Tarot | `tarot_kb.json` |  | Có nguyên văn đối chiếu | câu trích khớp Waite / Mathers / Book T / Papus 1892 / Case 1920 / Ouspensky 1913; lời lớp Marseille, B.O.T.A., Thoth vẫn là tóm ý (Marseille đã soát với Mathers + Papus, B.O.T.A. ẩn chính với Case 1920) |
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
| Thần số | `thanso_quan_he.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Thần số | `thanso_xu_ly.json` |  | Ban biên tập soạn |  |
| Lịch · tuổi · tập quán | `hoang_lich_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu | bảng nghi / kỵ theo sách lịch; tên Việt + nghĩa là nháp |
| Lịch · tuổi · tập quán | `nam_tong_quan_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Lịch · tuổi · tập quán | `sao_han_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Lịch · tuổi · tập quán | `thoi_gian_lop_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Lịch · tuổi · tập quán | `tuoi_dan_gian_kb.json` |  | Tập quán / sách hiện đại tóm ý |  |
| Liên mảng · kỹ thuật | `chan_dung_kb.json` |  | Ban biên tập soạn |  |
| Liên mảng · kỹ thuật | `chu_y_kb.json` |  | Ban biên tập soạn |  |
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
