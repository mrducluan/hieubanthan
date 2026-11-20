# -*- coding: utf-8 -*-
"""Tầng KB — SỔ ĐỘ TIN của kho tri thức (KT-TT6). Nội bộ: không route nào trả sổ này ra ngoài (BM-1).

Mỗi tệp trong `kb/data/` (và một số PHẦN trong tệp) mang MỘT mức, xếp theo "lời này truy được về đâu":

- `nguyen_van`   — có nguyên văn cổ thư trong kho nguồn `fixtures/nguon/` VÀ có test so khớp (ghi tên kho + tên test).
- `tom_y_co_thu` — tóm ý từ cổ thư nêu tên; chưa khớp từng câu với nguyên văn (việc của các đợt đối chiếu sau).
- `truyen_thong` — tập quán, truyền khẩu, hoặc sách hiện đại / trường phái gần đây (chỉ tóm ý, ghi nguồn).
- `bien_tap`     — ban biên tập soạn: lời diễn giải đời thường, ứng dụng, mẫu câu. Không có cổ thư làm gốc trực tiếp.
- `he_thong`     — tệp kỹ thuật (bảng tên, slug, sổ ngày, số thống kê): không phải tri thức để luận.

Mức KHÔNG phải nhãn "đã thẩm định" (thẩm định là việc của chuyên gia — `tham_dinh.json`) và không hiện cho người dùng.
Mức do NGƯỜI ghi vào sổ, máy chỉ kiểm tính nhất quán: tệp mới phải vào sổ; `nguyen_van` phải có kho + test thật
(`tests/test_do_tin_kb.py`). Nâng mức một phần = nạp nguyên văn vào kho nguồn + viết test so khớp, rồi sửa sổ.
"""
from __future__ import annotations

THANG = ("nguyen_van", "tom_y_co_thu", "truyen_thong", "bien_tap", "he_thong")
TEN_MUC = {"nguyen_van": "Có nguyên văn đối chiếu", "tom_y_co_thu": "Tóm ý cổ thư, chưa khớp từng câu",
           "truyen_thong": "Tập quán / sách hiện đại tóm ý", "bien_tap": "Ban biên tập soạn", "he_thong": "Tệp kỹ thuật"}

_T = "tests/test_kt_tt_kho_nguon.py"


def _nv(kho: str, test: str, ghi_chu: str = "") -> dict:
    return {"muc": "nguyen_van", "kho": kho, "test": test, "ghi_chu": ghi_chu}


# tệp → {"muc": mức mặc định của tệp, "mang": mảng, "phan": {khoá gốc trong tệp: mức riêng}, "ghi_chu"}
SO: dict[str, dict] = {
    # ---- Bát tự
    "battu_ngay_gio.json": {"mang": "battu", **_nv("tam_menh_thong_hoi_du_bo.json", "tests/test_tk2_battu_ngay_gio.py::test_han_la_chuoi_con_kho_nguon_dung_muc",
                                                "TK-2: 120 bài ca chung «六X日Y時斷» quyển 8–9, mỗi câu đúng mục can ngày × giờ")},
    "battu_sach_ghi.json": {"mang": "battu", **_nv("tam_menh_thong_hoi.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                                                "SX-C: câu Tam Mệnh Thông Hội + Uyên Hải Tử Bình (thần sát, thập thần, lục thân, tính nết, thân thể) khớp kho nguồn")},
    "battu_dieu_hau.json": {"mang": "battu", **_nv("cung_thong_bao_giam.json", f"{_T}::test_dieu_hau_khop_nguyen_van_tung_o")},
    "battu_thien_ly_menh_cao.json": {"mang": "battu", "muc": "truyen_thong",
                                     "ghi_chu": "Đợt 3: 6 quy tắc Thập Thần & Cách Cục 2 chiều trích dẫn có phép từ Thiên Lý Mệnh Cảo (Vi Thiên Lý, 1934 — bazi-kb)"},
    "battu_kb.json": {"mang": "battu", "muc": "tom_y_co_thu", "phan": {
        "co_tho": _nv("uyen_hai_tu_binh.json", f"{_T}::test_co_tho_nhat_chu_khop_nguyen_van_uyen_hai"),
        "co_van_thap_than": _nv("uyen_hai_tu_binh.json", f"{_T}::test_co_van_thap_than_khop_nguyen_van_uyen_hai"),
        "nap_am": {"muc": "truyen_thong"}, "mau": {"muc": "bien_tap"}, "giai_thich": {"muc": "bien_tap"}}},
    "battu_doi_song_kb.json": {"mang": "battu", "muc": "bien_tap", "phan": {
        "cach": {"muc": "tom_y_co_thu", "ghi_chu": "ba cách Thất Sát / Chính Ấn / Thiên Ấn đã khớp «Luận dụng thần» (Q5)"},
        "ngoai_cach": _nv("tu_binh_chan_thuyen.json", "tests/test_battu_ngoai_cach.py::test_trich_la_nguyen_van",
                          "câu hỷ / kỵ khớp nguyên văn; lời đời thường là tóm ý")}},
    "bo_sung_nhat_chu.json": {"mang": "battu", "muc": "bien_tap"},
    "bo_sung_thap_than.json": {"mang": "battu", "muc": "bien_tap"},
    # ---- Kỳ Môn
    "ky_mon_kb.json": {"mang": "kymon", "muc": "bien_tap", "ghi_chu": "KM-2: lời đời thường về cửa, sao, thần, cách cục do ban biên tập viết", "phan": {
        "cua": _nv("ky_mon_co_kim_do_thu.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem", "mỗi cửa một câu «釋八門所主»"),
        "sao": _nv("ky_mon_co_kim_do_thu.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem", "mỗi sao một câu «釋九星所主»"),
        "cach": _nv("ky_mon_co_kim_do_thu.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                    "điều kiện từng cách thử bằng ví dụ «假令» của sách (tests/test_ky_mon_cach.py); lời đời thường là tóm ý")}},
    "ky_mon_bi_kip_cuu_don.json": {"mang": "kymon", "muc": "tom_y_co_thu",
                                   "ghi_chu": "Cửu Độn: lời đời thường tóm ý theo Kỳ Môn Độn Giáp Bí Kíp Đại Toàn q.21; câu sách đi kèm "
                                              "(`sach_ghi`) là nguyên văn Độn Giáp Diễn Nghĩa quyển 2, khớp kho nguồn don_giap_dien_nghia.json "
                                              "qua tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem (PR #320, 2026-11-20)"},
    # ---- Liên mảng — kho chuyển nghĩa (2026-11-18): khái niệm cổ → nghĩa đời nay theo lĩnh vực
    "chuyen_nghia_kb.json": {"mang": "chung", "muc": "bien_tap", "ghi_chu": "nghĩa đời nay do ban biên tập viết", "phan": {
        "khai_niem": _nv("ky_mon_co_kim_do_thu.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                         "mỗi khái niệm một câu sách khớp kho nguồn; nghĩa đời nay là biên tập")}},
    # ---- Tử vi
    "tuvi_sach_ghi.json": {"mang": "tuvi", **_nv("tu_vi_dau_so_toan_thu.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                                               "SX-C: 434 câu Toàn Thư quyển 3 (sao × cung) khớp kho nguồn; lời Việt là tóm ý đã nói giảm (A / B / C)")},
    "tuvi_kb.json": {"mang": "tuvi", "muc": "tom_y_co_thu", "phan": {
        "phu_tinh_cung": _nv("tu_vi_dau_so_toan_thu.json", f"{_T}::test_phu_tinh_cung_khop_nguyen_van_toan_thu"),
        "sao_nho": {"muc": "truyen_thong", "ghi_chu": "tóm ý Tử vi đẩu số tân biên + tên phái Trung Châu; từng mục có do_tin"},
        "mau": {"muc": "bien_tap"}, "giai_thich": {"muc": "bien_tap"}, "doc_tung_buoc": {"muc": "bien_tap"}}},
    "tuvi_cach_cuc.json": {"mang": "tuvi", "muc": "tom_y_co_thu",
                           "ghi_chu": "7 cách có `sach_ghi` khớp «định phú / quý cục» (test_cach_cuc_sach_ghi_khop_dinh_cuc_toan_thu); 37 cách có cổ ca trỏ Cốt Tuỷ Phú; Quân thần khánh hội + Nguyệt sinh thương hải sửa theo sách (KT-TT8); Mã đầu đới kiếm, Lộc Mã bội ấn giữ cách phổ biến, gắn `khac_dieu_kien`"},
    "tuvi_co_thu.json": {"mang": "tuvi", "muc": "tom_y_co_thu", "phan": {
        "cau": _nv("tu_vi_dau_so_toan_thu.json", "tests/test_tuvi_co_thu.py::test_nguyen_van_khop_kho_nguon_toan_thu_tung_chu",
                   "84 câu Cốt Tuỷ Phú khớp từng chữ (giản ↔ phồn); phiên âm, nghĩa là nháp; chưa so bản khắc 1600")}},
    "tuvi_phi_hoa_kb.json": {"mang": "tuvi", "muc": "truyen_thong", "ghi_chu": "phi tinh tứ hoá — trường phái hiện đại"},
    "tuvi_phi_hoa_luong_672.json": {"mang": "tuvi", "muc": "truyen_thong",
                                    "ghi_chu": "PR #320 (2026-11-20, phương án C): 576 tượng phi hoá — TÓM Ý của ban biên tập theo phái Lương Nhược Du (sách hiện đại còn bản quyền); không nguyên văn, giữ trang để đối chiếu"},
    "tuvi_trung_chau_60_tinh_he.json": {"mang": "tuvi", "muc": "truyen_thong",
                                        "ghi_chu": "PR #320 (2026-11-20, phương án C): 60 tinh hệ — TÓM Ý của ban biên tập theo Trung Châu phái (Vương Đình Chi, sách hiện đại còn bản quyền); không nguyên văn, giữ trang"},
    "tuvi_tu_van_thai_tue.json": {"mang": "tuvi", "muc": "truyen_thong",
                                  "ghi_chu": "Đợt 4: 6 nguyên tắc cốt lõi Tử Vân (Thái Tuế Nhập Quái · Tam Đại Tiên Hậu Thiên · Giáp Cung — ziwei-ziyun-kb)"},
    "tuvi_sao_luu_kb.json": {"mang": "tuvi", "muc": "truyen_thong"},
    "tuvi_y_bo_sung.json": {"mang": "tuvi", "muc": "truyen_thong", "ghi_chu": "rút ý lời giảng hiện đại, viết lại (TV-YBS)"},
    "tuvi_doi_song_kb.json": {"mang": "tuvi", "muc": "bien_tap"},
    "battu_luan_hoi_kb.json": {"mang": "battu", "muc": "bien_tap", "ghi_chu": "lớp Luận theo câu hỏi Bát tự (LH-2)"},
    "tuvi_luan_hoi_kb.json": {"mang": "tuvi", "muc": "bien_tap", "ghi_chu": "lớp Luận theo câu hỏi (LH-1); tập quán dân gian ghi theo phong tục, không phải cổ thư"},
    "tuvi_hai_nguoi_kb.json": {"mang": "tuvi", "muc": "truyen_thong"},
    "tuvi_cung_sao_menh_kb.json": {"mang": "tuvi", "muc": "bien_tap"},
    "su_kien_kb.json": {"mang": "tuvi", "muc": "bien_tap"},
    "bo_sung_sao.json": {"mang": "tuvi", "muc": "bien_tap"},
    "bo_sung_cung.json": {"mang": "tuvi", "muc": "bien_tap"},
    "bo_sung_hoa_cung.json": {"mang": "tuvi", "muc": "bien_tap"},
    # ---- Kinh Dịch
    "kinhdich_truyen_nghia.json": {"mang": "kinhdich", **_nv(
        "chu_dich_truyen_nghia.json", f"{_T}::test_ngo_tat_to_ghep_dung_hao_va_du_do_phu", "bản dịch Ngô Tất Tố ghép theo chữ Hán")},
    "kinhdich_dich_lam.json": {"mang": "kinhdich", **_nv(
        "tieu_thi_dich_lam.json", "tests/test_tk2_dich_lam.py::test_kb_la_ban_cat_cua_kho_nguon_va_du_4096_bai",
        "TK-2: 4.096 bài từ Tiêu Thị Dịch Lâm (quẻ bản → quẻ biến), nguyên văn chưa dịch; bài có chữ nặng không hiện")},
    "kinhdich_legge.json": {"mang": "kinhdich", **_nv(
        "kinhdich_legge_que.json", "tests/test_tk2_legge.py::test_moi_doan_la_chuoi_con_cua_nguon",
        "TK-2 việc 4: bản dịch Anh James Legge 1882 (PD) — chỉ quẻ qua kiểm vạch âm dương + kiểm chữ hỏng; chỉ bản /en")},
    "kinhdich_hao.json": {"mang": "kinhdich", **_nv(
        "chu_dich_truyen_nghia.json", "tests/test_nguon_chu_dich_truyen_nghia.py::test_loi_que_loi_hao_trong_kb_khop_ban_tu_kho",
        "kinh văn khớp nguyên văn; phần dịch và «Hiểu đơn giản» là nháp")},
    "kinhdich_kb.json": {"mang": "kinhdich", "muc": "tom_y_co_thu", "phan": {
        "bat_quai": _nv("chu_dich_truyen_nghia.json", f"{_T}::test_loai_tuong_tam_quai_trich_dung_thuyet_quai",
                        "loại tượng khớp Thuyết Quái"),
        "mau": {"muc": "bien_tap"}, "giai_thich": {"muc": "bien_tap"}}},
    "kinhdich_tra_loi.json": {"mang": "kinhdich", "muc": "tom_y_co_thu", "phan": {
        "tinh_chat_que": _nv("tang_san_boc_dich.json", "tests/test_kt_tt5_tinh_chat_que.py::test_trich_la_nguyen_van_va_kb_du_loi"),
        "sach_xua_viec": _nv("tang_san_boc_dich.json", "tests/test_ws5_sach_xua_kinhdich.py::test_cau_la_nguyen_van_trong_dung_chuong",
                             "WS-5: câu Tăng San Bốc Dịch theo chương ứng với việc; lời Việt là tóm ý"),
        "mau": {"muc": "bien_tap"}, "kieu_cau": {"muc": "bien_tap"}}},
    "kinhdich_doi_song.json": {"mang": "kinhdich", "muc": "bien_tap"},
    "bo_sung_que.json": {"mang": "kinhdich", "muc": "bien_tap"},
    # ---- Phong thuỷ
    "phongthuy_cung_menh.json": {"mang": "phongthuy", **_nv("duong_trach_thap_thu.json", "tests/test_sx_c_sach_ghi.py::test_cung_menh_khop_phep_tinh",
                                                     "SX-C: chín điều bố trí × 8 cung (東/西四位宅圖說); phương + du niên khớp phép tính Bát trạch")},
    "phongthuy_sach_ghi.json": {"mang": "phongthuy", **_nv("duong_trach_thap_thu.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                                                    "SX-C: 116 điều về thế nhà (論宅外形, 內形篇, 何知經…) khớp kho nguồn; vế 'vì sao hợp lẽ thường' là lời biên tập")},
    "phongthuy_tam_yeu.json": {"mang": "phongthuy", "muc": "truyen_thong",
                               "ghi_chu": "SX-C: tóm ý Dương Trạch Tam Yếu + Bát Trạch Minh Kính qua BẢN DỊCH Việt hiện đại (chưa có nguyên văn chữ Hán trong kho nguồn); du niên 64 nhà + 64 bếp khớp phép tính"},
    "phongthuy_kb.json": {"mang": "phongthuy", "muc": "tom_y_co_thu", "phan": {
        "du_nien": _nv("duong_trach_thap_thu.json", "tests/test_kt_pt1_kho_nguon.py::test_cau_trich_kb_la_nguyen_van",
                       "KT-PT1: 8 du niên có câu «吉星三 / 凶星五» của Dương Trạch Thập Thư; phép tính du niên + bảng cung phi "
                       "180 năm khớp sách (test_dai_du_nien_ca_khop_phep_tinh, test_bang_cung_phi_180_nam_khop_phep_tinh); "
                       "lời ý nghĩa vẫn là tóm ý"),
        "sach_xua_nha": _nv("duong_trach_thap_thu.json", "tests/test_ws3_sach_xua_nha.py::test_moi_cau_la_nguyen_van_kho_nguon",
                            "WS-3: câu Dương Trạch Thập Thư cho khối «Sách xưa nói gì về nhà của bạn»; lời Việt là tóm ý")},
        "ghi_chu": "KT-PT1: 7 dấu hiệu `bo_tri` có câu nguyên văn (`sach`); phần còn lại chưa khớp từng câu"},
    "phongthuy_huyen_khong.json": {
        "mang": "phongthuy", "muc": "tom_y_co_thu",
        "phan": {
            "to_hop_81": _nv("phongthuy_huyen_khong_co_thu.json",
                             "tests/test_huyen_khong_tham_thi.py::test_to_hop_81_sach_qua_bo_kiem_sx_c",
                             "Gói 1A: 28 tổ hợp sao tiêu biểu có câu nguyên văn Tử Bạch Đoạn / Phi Tinh Phú qua bộ kiểm SX-C; "
                             "Thành Môn Quyết + Hạ Quái/Thế Quái đối chiếu Thẩm Thị Huyền Không Học (huyen_khong_tham_thi.json)"),
        },
    },
    "phongthuy_doi_song.json": {"mang": "phongthuy", "muc": "bien_tap"},
    "phongthuy_do_thi.json": {"mang": "phongthuy", "muc": "bien_tap"},
    "bo_sung_dau_hieu.json": {"mang": "phongthuy", "muc": "bien_tap"},
    # ---- Nhân tướng · Tarot
    "nhan_tuong_sach_ghi.json": {"mang": "nhantuong", **_nv("than_tuong_toan_bien.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                                                     "SX-C: câu Thần Tướng Toàn Biên gắn với nét khảo sát + 12 cung trên mặt")},
    "nhan_tuong_kieu_hinh.json": {"mang": "nhantuong", **_nv("than_tuong_toan_bien.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                                                      "SX-C: 119 kiểu hình mày, mắt, mũi, tai, miệng (bài thơ từng kiểu) khớp kho nguồn; 7 mục gắn `ngo`")},
    "nhan_tuong_lieu_trang.json": {"mang": "nhantuong", **_nv("lieu_trang_tuong_phap.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                                                       "SX-C: Liễu Trang tướng pháp — kho nguồn là bản gõ chưa hiệu đính (can_doi_chieu), chỉ trích câu ngắn")},
    "nhantuong_ngu_hanh_va_co_thu.json": {"mang": "nhantuong", "muc": "truyen_thong",
                                          "ghi_chu": "Đợt 4: 5 Hình Tướng Ngũ Hành tóm ý theo Lillian Bridges (2012, còn bản quyền — không chép nguyên văn)", "phan": {
        "quy_tac_co_thu": _nv("lieu_trang_tuong_phap.json", "tests/test_sx_c_sach_ghi.py::test_moi_muc_qua_bo_kiem",
                              "PR #320 (2026-11-20): 81/150 quy tắc giữ lại, mỗi câu Hán khớp kho nguồn Liễu Trang tướng pháp / "
                              "Thần Tướng Toàn Biên (than_tuong_toan_bien.json); lời Việt khuôn SX-C do ban biên tập viết"),
        "quy_tac_khong_dua": {"muc": "bien_tap", "ghi_chu": "69 quy tắc không đưa ra người dùng, chỉ còn mã + lý do"}}},
    "chitay_phuong_tay_kinh_dien.json": {"mang": "nhantuong", **_nv("chi_tay_cheiro_palmistry_for_all.json",
                                         "tests/test_rs3_chitay_kinh_dien.py::test_moi_cau_trich_la_chuoi_con_kho_nguon",
                                         "RS-3: 4 đường chính + 7 gò; 11 câu trích tiếng Anh khớp kho nguồn Cheiro, Palmistry "
                                         "for All (1916) và Dale, Indian Palmistry (1895) (chi_tay_dale_indian_palmistry.json, "
                                         "bản Gutenberg); lời Việt hai mặt ban biên tập viết, nháp")},
    "chi_tay_tay_kb.json": {"mang": "nhantuong", **_nv("chi_tay_cheiro_language_of_the_hand.json",
                                                    "tests/test_tk2_chi_tay_tay.py::test_moi_cau_trich_la_chuoi_con_kho_nguon",
                                                    "TK-2 chỉ tay phương Tây: câu trích tiếng Anh Cheiro 1894 + Benham 1900 (kho nguồn lớp chữ "
                                                    "nhận dạng, can_doi_chieu) khớp từng câu; lời Việt ban biên tập; ngưỡng số đo `do_tay` "
                                                    "giả định, can_doi_chieu; không nhóm C")},
    "chi_tay_kb.json": {"mang": "nhantuong", **_nv("than_tuong_toan_bien.json", "tests/test_chi_tay.py::test_moi_cau_la_nguyen_van",
                                             "Chỉ tay: 67 bài thơ vân tay quyển 10 + câu đồ hình tám cung («根基所屬», Luận thủ) khớp kho nguồn; "
                                             "CT-2: câu theo số đo bàn tay (`sach_do_tay`: «論手», «相指掌») + vai và lựa chọn từng cung "
                                             "(`cung_tay`: «根基所屬») qua bộ kiểm SX-C (tests/test_chi_tay_do.py); ngưỡng đo `do_tay` "
                                             "là giả định nhân trắc, can_doi_chieu; lời Việt nói giảm theo SX-C; 5 hình sách đoán về "
                                             "người vợ không đưa vào")},
    "nhan_tuong_do_hinh.json": {"mang": "nhantuong", "muc": "tom_y_co_thu",
                                "ghi_chu": "lớp phủ đồ hình: nhãn chữ Hán đọc trên bản khắc Thần Tướng Toàn Biên; toạ độ đo trên ảnh; lời Việt rút từ KB"},
    "nhan_tuong_kb.json": {"mang": "nhantuong", "muc": "tom_y_co_thu", "phan": {
        "luu_nien": _nv("than_tuong_toan_bien.json",
                        "tests/test_ws2_kho_nguon_bo_sung.py::test_luu_nien_nhan_tuong_khop_bai_ca_than_tuong_toan_bien",
                        "WS-2: 20 tuổi mốc khớp tên bộ vị + thứ tự của «流年運氣部位歌»; WS-4 / KT-NT3: tuổi 10–14 sửa theo chữ sách (Nhân Luân, Địa Luân)"),
        "bai_ca_luu_nien": _nv("than_tuong_toan_bien.json", "tests/test_ws4_bai_ca_luu_nien.py::test_moi_chang_la_nguyen_van_va_dung_thu_tu",
                               "WS-4: bài ca cắt theo 67 chặng tuổi, phủ đủ 1–100; lời Việt là tóm ý")},
        "ghi_chu": "KT-NT1/2 + KT-N1 + KT-NT3: cả 70 câu trích sách (`dac_diem.*.sach`) khớp kho nguồn `nhan_tuong_co_thu.json` + `than_tuong_toan_bien.json` (Thần Tướng Toàn Biên bản Cổ Kim Đồ Thư Tập Thành, Băng Giám, Tâm Tướng Thiên, Linh Khu, 4 sách Tứ khố — tests/test_kt_nt1_kho_nguon.py); lời luận vẫn là tóm ý, trường `nguon` Ma Y / Thần Tướng Toàn Biên chỉ ghi phái"},
    "tarot_kb.json": {"mang": "tarot", **_nv("tarot_waite_1910.json", "tests/test_tarot_nguon.py::test_moi_trich_la_nguyen_van_cua_nguon",
                                             "câu trích khớp Waite / Mathers / Book T / Papus 1892 / Case 1920 / Ouspensky 1913; lời lớp Marseille, "
                                             "B.O.T.A., Thoth vẫn là tóm ý (Marseille đã soát với Mathers + Papus, B.O.T.A. ẩn chính với Case 1920)")},
    "tarot_greer_nguoc.json": {"mang": "tarot", "muc": "truyen_thong",
                               "ghi_chu": "Đợt 2B: 22 Lá Ẩn Chính ngược đối chiếu & trích dẫn có phép từ Mary K. Greer (2002), phân tích 2 mặt tích cực + tiêu cực cần chú ý"},
    "kinhdich_luc_hao_thuc_chien.json": {"mang": "kinhdich", "muc": "truyen_thong",
                                         "ghi_chu": "Đợt 2B: 8 nguyên tắc Lục Hào + 5 Lục Thân thực chiến đối chiếu & trích dẫn chữ Hán có phép từ Vương Hổ Ứng & Thiệu Vĩ Hoa (iching-kb)"},
    # ---- Thần số (truyền thống phương Tây hiện đại — không có "cổ thư")
    **{f: {"mang": "thanso", "muc": "truyen_thong"} for f in (
        "thanso_meanings.json", "thanso_depth.json", "thanso_chaldean.json", "thanso_cap_so.json", "thanso_chi_so_phu.json",
        "thanso_bieu_do.json", "thanso_chan_dung.json", "thanso_linh_vuc.json", "thanso_quan_he.json", "thanso_giai_thich.json",
        "thanso_doi_chieu.json")},
    # TK-2: số kép 10–52 có câu nguyên văn Cheiro (khoá `kep.*.trich`) — phần này lên mức có nguyên văn đối chiếu
    "thanso_chaldean.json": {"mang": "thanso", "muc": "truyen_thong", "phan": {
        "kep": _nv("thanso_cheiro_book_of_numbers_1926.json", "tests/test_tk2_thanso_cheiro.py::test_moi_so_kep_co_cau_sach",
                   "TK-2: 43/43 số kép có câu Cheiro (OCR, can_doi_chieu); bảng chữ 23/26 khớp; lời Việt là tóm ý trung tính")}},
    **{f: {"mang": "thanso", "muc": "bien_tap"} for f in (
        "thanso_ban_do.json", "thanso_hom_nay.json", "thanso_noi_dau.json", "thanso_xu_ly.json", "thanso_do_thi.json",
        "thanso_phillips_kb.json",
        "bo_sung_so.json", "bo_sung_so_kep.json", "bo_sung_cap_so.json", "bo_sung_nghe.json", "bo_sung_tinh_yeu.json",
        "bo_sung_nam_ca_nhan.json", "bo_sung_no_nghiep.json")},
    # ---- Lịch, tuổi, tập quán
    "hoang_lich_kb.json": {"mang": "lich", "muc": "tom_y_co_thu", "ghi_chu": "bảng nghi / kỵ theo sách lịch; tên Việt + nghĩa là nháp"},
    "sao_han_kb.json": {"mang": "lich", "muc": "truyen_thong"},
    "tuoi_dan_gian_kb.json": {"mang": "lich", "muc": "truyen_thong"},
    "nam_tong_quan_kb.json": {"mang": "lich", "muc": "truyen_thong"},
    "gia_dinh_kb.json": {"mang": "lich", "muc": "truyen_thong", "ghi_chu": "GD-1: lời cặp con giáp, điều tập quán từng người — nháp"},
    "thoi_gian_lop_kb.json": {"mang": "lich", "muc": "truyen_thong"},
    # ---- Liên mảng (lời ghép, ranh giới, mẫu câu)
    "suc_khoe_kb.json": {"mang": "chung", "muc": "tom_y_co_thu", "ghi_chu": "hành ↔ tạng phủ theo Nội Kinh; tên bệnh hay gặp là kiến thức phổ thông (SK-2)"},
    **{f: {"mang": "chung", "muc": "bien_tap"} for f in (
        "chu_y_kb.json", "chan_dung_kb.json", "giao_thoa_kb.json", "goi_y_cheo_kb.json", "hoan_canh_kb.json", "nhat_quan_kb.json",
        "push_sang_nay.json", "sinh_nuoc_ngoai_kb.json", "tuan_hai_nguoi_kb.json", "tu_dien.json", "y_dinh_chung.json")},
    # ---- Tệp kỹ thuật
    **{f: {"mang": "chung", "muc": "he_thong"} for f in (
        "dong_thuan_thong_ke.json", "goc_nhin.json", "ngay_cap_nhat.json", "slug_en.json", "ten_en.json", "tham_dinh.json",
        "thuat_ngu_en.json")},
}


def muc(tep: str, phan: str | None = None) -> str | None:
    """Mức của một tệp (hoặc một phần gốc trong tệp — phần không ghi riêng thì theo mức của tệp)."""
    t = SO.get(tep)
    if not t:
        return None
    return ((t.get("phan") or {}).get(phan) or t)["muc"] if phan else t["muc"]


def bang() -> list[dict]:
    """Sổ dạng phẳng, một dòng mỗi tệp / phần: {tep, phan, mang, muc, kho, test, ghi_chu} — cho script báo cáo."""
    ra = []
    for tep in sorted(SO):
        t = SO[tep]
        ra.append({"tep": tep, "phan": None, "mang": t["mang"], "muc": t["muc"], "kho": t.get("kho"), "test": t.get("test"),
                   "ghi_chu": t.get("ghi_chu", "")})
        for p, x in (t.get("phan") or {}).items():
            ra.append({"tep": tep, "phan": p, "mang": t["mang"], "muc": x["muc"], "kho": x.get("kho"), "test": x.get("test"),
                       "ghi_chu": x.get("ghi_chu", "")})
    return ra
