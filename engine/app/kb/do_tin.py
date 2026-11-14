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
    "battu_dieu_hau.json": {"mang": "battu", **_nv("cung_thong_bao_giam.json", f"{_T}::test_dieu_hau_khop_nguyen_van_tung_o")},
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
    # ---- Tử vi
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
    "tuvi_sao_luu_kb.json": {"mang": "tuvi", "muc": "truyen_thong"},
    "tuvi_y_bo_sung.json": {"mang": "tuvi", "muc": "truyen_thong", "ghi_chu": "rút ý lời giảng hiện đại, viết lại (TV-YBS)"},
    "tuvi_doi_song_kb.json": {"mang": "tuvi", "muc": "bien_tap"},
    "tuvi_hai_nguoi_kb.json": {"mang": "tuvi", "muc": "truyen_thong"},
    "tuvi_cung_sao_menh_kb.json": {"mang": "tuvi", "muc": "bien_tap"},
    "su_kien_kb.json": {"mang": "tuvi", "muc": "bien_tap"},
    "bo_sung_sao.json": {"mang": "tuvi", "muc": "bien_tap"},
    "bo_sung_cung.json": {"mang": "tuvi", "muc": "bien_tap"},
    "bo_sung_hoa_cung.json": {"mang": "tuvi", "muc": "bien_tap"},
    # ---- Kinh Dịch
    "kinhdich_truyen_nghia.json": {"mang": "kinhdich", **_nv(
        "chu_dich_truyen_nghia.json", f"{_T}::test_ngo_tat_to_ghep_dung_hao_va_du_do_phu", "bản dịch Ngô Tất Tố ghép theo chữ Hán")},
    "kinhdich_hao.json": {"mang": "kinhdich", **_nv(
        "chu_dich_truyen_nghia.json", "tests/test_nguon_chu_dich_truyen_nghia.py::test_loi_que_loi_hao_trong_kb_khop_ban_tu_kho",
        "kinh văn khớp nguyên văn; phần dịch và «Hiểu đơn giản» là nháp")},
    "kinhdich_kb.json": {"mang": "kinhdich", "muc": "tom_y_co_thu", "phan": {
        "bat_quai": _nv("chu_dich_truyen_nghia.json", f"{_T}::test_loai_tuong_tam_quai_trich_dung_thuyet_quai",
                        "loại tượng khớp Thuyết Quái"),
        "mau": {"muc": "bien_tap"}, "giai_thich": {"muc": "bien_tap"}}},
    "kinhdich_tra_loi.json": {"mang": "kinhdich", "muc": "tom_y_co_thu", "phan": {
        "tinh_chat_que": _nv("tang_san_boc_dich.json", "tests/test_kt_tt5_tinh_chat_que.py::test_trich_la_nguyen_van_va_kb_du_loi"),
        "mau": {"muc": "bien_tap"}, "kieu_cau": {"muc": "bien_tap"}}},
    "kinhdich_doi_song.json": {"mang": "kinhdich", "muc": "bien_tap"},
    "bo_sung_que.json": {"mang": "kinhdich", "muc": "bien_tap"},
    # ---- Phong thuỷ
    "phongthuy_kb.json": {"mang": "phongthuy", "muc": "tom_y_co_thu"},
    "phongthuy_huyen_khong.json": {"mang": "phongthuy", "muc": "tom_y_co_thu"},
    "phongthuy_doi_song.json": {"mang": "phongthuy", "muc": "bien_tap"},
    "phongthuy_do_thi.json": {"mang": "phongthuy", "muc": "bien_tap"},
    "bo_sung_dau_hieu.json": {"mang": "phongthuy", "muc": "bien_tap"},
    # ---- Nhân tướng · Tarot
    "nhan_tuong_kb.json": {"mang": "nhantuong", "muc": "tom_y_co_thu", "phan": {
        "luu_nien": _nv("than_tuong_toan_bien.json",
                        "tests/test_ws2_kho_nguon_bo_sung.py::test_luu_nien_nhan_tuong_khop_bai_ca_than_tuong_toan_bien",
                        "WS-2: 20 tuổi mốc khớp tên bộ vị + thứ tự của «流年運氣部位歌»; 80 tuổi còn lại theo cùng bài ca, chưa test từng tuổi")},
        "ghi_chu": "KT-NT1/2 + KT-N1: cả 43 câu trích sách (`dac_diem.*.sach`) khớp kho nguồn `nhan_tuong_co_thu.json` (Băng Giám, Tâm Tướng Thiên, Linh Khu, 4 sách Tứ khố — tests/test_kt_nt1_kho_nguon.py); lời luận vẫn là tóm ý, trường `nguon` Ma Y / Thần Tướng Toàn Biên chỉ ghi phái"},
    "tarot_kb.json": {"mang": "tarot", **_nv("tarot_waite_1910.json", "tests/test_tarot_nguon.py::test_moi_trich_la_nguyen_van_cua_nguon",
                                             "câu trích khớp Waite / Mathers / Book T; lớp Marseille, Thoth là tóm ý")},
    # ---- Thần số (truyền thống phương Tây hiện đại — không có "cổ thư")
    **{f: {"mang": "thanso", "muc": "truyen_thong"} for f in (
        "thanso_meanings.json", "thanso_depth.json", "thanso_chaldean.json", "thanso_cap_so.json", "thanso_chi_so_phu.json",
        "thanso_bieu_do.json", "thanso_chan_dung.json", "thanso_linh_vuc.json", "thanso_quan_he.json", "thanso_giai_thich.json",
        "thanso_doi_chieu.json")},
    **{f: {"mang": "thanso", "muc": "bien_tap"} for f in (
        "thanso_ban_do.json", "thanso_hom_nay.json", "thanso_noi_dau.json", "thanso_xu_ly.json", "thanso_do_thi.json",
        "bo_sung_so.json", "bo_sung_so_kep.json", "bo_sung_cap_so.json", "bo_sung_nghe.json", "bo_sung_tinh_yeu.json",
        "bo_sung_nam_ca_nhan.json", "bo_sung_no_nghiep.json")},
    # ---- Lịch, tuổi, tập quán
    "hoang_lich_kb.json": {"mang": "lich", "muc": "tom_y_co_thu", "ghi_chu": "bảng nghi / kỵ theo sách lịch; tên Việt + nghĩa là nháp"},
    "sao_han_kb.json": {"mang": "lich", "muc": "truyen_thong"},
    "tuoi_dan_gian_kb.json": {"mang": "lich", "muc": "truyen_thong"},
    "nam_tong_quan_kb.json": {"mang": "lich", "muc": "truyen_thong"},
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
