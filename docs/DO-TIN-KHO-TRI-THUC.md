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
| Bát tự | 1 | 1 |  | 3 |  |
| Tử vi |  | 3 | 4 | 6 |  |
| Kinh Dịch | 2 | 2 |  | 2 |  |
| Phong thuỷ |  | 2 |  | 3 |  |
| Nhân tướng |  | 1 |  |  |  |
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
| `kinhdich_hao.json` | (cả tệp) | `chu_dich_truyen_nghia.json` | `test_loi_que_loi_hao_trong_kb_khop_ban_tu_kho` | kinh văn khớp nguyên văn; phần dịch và «Hiểu đơn giản» là nháp |
| `kinhdich_kb.json` | bat_quai | `chu_dich_truyen_nghia.json` | `test_loai_tuong_tam_quai_trich_dung_thuyet_quai` | loại tượng khớp Thuyết Quái |
| `kinhdich_tra_loi.json` | tinh_chat_que | `tang_san_boc_dich.json` | `test_trich_la_nguyen_van_va_kb_du_loi` |  |
| `kinhdich_truyen_nghia.json` | (cả tệp) | `chu_dich_truyen_nghia.json` | `test_ngo_tat_to_ghep_dung_hao_va_du_do_phu` | bản dịch Ngô Tất Tố ghép theo chữ Hán |
| `tarot_kb.json` | (cả tệp) | `tarot_waite_1910.json` | `test_moi_trich_la_nguyen_van_cua_nguon` | câu trích khớp Waite / Mathers / Book T; lớp Marseille, Thoth là tóm ý |
| `tuvi_co_thu.json` | cau | `tu_vi_dau_so_toan_thu.json` | `test_nguyen_van_khop_kho_nguon_toan_thu_tung_chu` | 84 câu Cốt Tuỷ Phú khớp từng chữ (giản ↔ phồn); phiên âm, nghĩa là nháp; chưa so bản khắc 1600 |
| `tuvi_kb.json` | phu_tinh_cung | `tu_vi_dau_so_toan_thu.json` | `test_phu_tinh_cung_khop_nguyen_van_toan_thu` |  |

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
| Bát tự | `bo_sung_nhat_chu.json` |  | Ban biên tập soạn |  |
| Bát tự | `bo_sung_thap_than.json` |  | Ban biên tập soạn |  |
| Tử vi | `bo_sung_cung.json` |  | Ban biên tập soạn |  |
| Tử vi | `bo_sung_hoa_cung.json` |  | Ban biên tập soạn |  |
| Tử vi | `bo_sung_sao.json` |  | Ban biên tập soạn |  |
| Tử vi | `su_kien_kb.json` |  | Ban biên tập soạn |  |
| Tử vi | `tuvi_cach_cuc.json` |  | Tóm ý cổ thư, chưa khớp từng câu | 6 cách có `sach_ghi` khớp «định phú / quý cục» (test_cach_cuc_sach_ghi_khop_dinh_cuc_toan_thu); 37 cách có cổ ca trỏ Cốt Tuỷ Phú; Quân thần khánh hội + Nguyệt sinh thương hải sửa theo sách (KT-TT8); Mã đầu đới kiếm, Lộc Mã bội ấn giữ cách phổ biến, gắn `khac_dieu_kien` |
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
| Kinh Dịch | `kinhdich_tra_loi.json` | mau | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_tra_loi.json` | kieu_cau | Ban biên tập soạn |  |
| Kinh Dịch | `kinhdich_truyen_nghia.json` |  | Có nguyên văn đối chiếu | bản dịch Ngô Tất Tố ghép theo chữ Hán |
| Phong thuỷ | `bo_sung_dau_hieu.json` |  | Ban biên tập soạn |  |
| Phong thuỷ | `phongthuy_do_thi.json` |  | Ban biên tập soạn |  |
| Phong thuỷ | `phongthuy_doi_song.json` |  | Ban biên tập soạn |  |
| Phong thuỷ | `phongthuy_huyen_khong.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Phong thuỷ | `phongthuy_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu |  |
| Nhân tướng | `nhan_tuong_kb.json` |  | Tóm ý cổ thư, chưa khớp từng câu | có câu trích sách nhưng chưa có kho nguồn |
| Tarot | `tarot_kb.json` |  | Có nguyên văn đối chiếu | câu trích khớp Waite / Mathers / Book T; lớp Marseille, Thoth là tóm ý |
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
