# -*- coding: utf-8 -*-
"""CV-2 — Cố vấn Tam Tài trả lời ĐÚNG câu hỏi (viết trước khi sửa, từ ca người dùng báo 2026-11-27).

Lỗi gốc: kết quả chỉ phụ thuộc (mạch, mức chương) → câu "năm sau mở shop" ra y hệt "nghỉ việc ra làm riêng", 12 tháng tính từ
tháng này (bỏ qua "năm sau"), Nhân và Thiên cùng trích chương "Công việc" mức "Cân bằng", 10/12 ô tháng một câu, lời khuyên lệch
việc, hướng nhà ở bị dùng làm hướng cửa hàng. Hợp đồng mới:

1. Hiểu câu: việc cụ thể + khung thời gian + kiểu câu → `hieu_cau`; "năm sau" = năm tới, không tính từ tháng này.
2. Câu trả lời đứng đầu (`tra_loi`): nói đúng việc + khung thời gian, nêu tháng nên khởi động / nên đi chậm của ĐÚNG khung, điều kiện.
3. Thiên đọc mức của NĂM được hỏi (không phải mức chương nghề nghiệp lần nữa); các tháng giống nhau gộp thành đoạn.
4. Không có hai câu dài giống nhau trong cùng một kết quả.
5. Không gian: hỏi việc kinh doanh → cần hướng MẶT BẰNG; hướng nhà ở không được dùng làm hướng cửa hàng; việc không liên quan
   không gian (kết hôn, đầu tư…) → không có trụ Địa, không đòi hướng nhà.
"""
from __future__ import annotations

import json
import re

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests import _dau_ra as dr

_C = TestClient(app)
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_NGAY = "2026-11-27"
_SHOP = "Năm sau tôi muốn mở shop kinh doanh có được không, việc làm ăn của tôi có thuận lợi không?"
_CO_GIO = dict(ngay_sinh="1988-12-02", gioi_tinh="nam", gio_sinh="23:00", do_tin_gio="exact")


def _goi(cau: str, headers: dict | None = None, **kw):
    p = {"ngay_sinh": "1988-12-02", "gioi_tinh": "nam", "ngay_xem": _NGAY, **kw}
    r = _C.post("/v1/co-van", json={"cau_hoi": cau, **p}, headers=headers or {})
    assert r.status_code == 200, r.text
    return r.json()


def _chuoi_dai(o, ra=None):
    ra = [] if ra is None else ra
    if isinstance(o, str):
        if len(o) >= 45:
            ra.append(o)
    elif isinstance(o, dict):
        for k, v in o.items():
            if k not in ("ma_mau", "ngay_xem", "ranh_gioi_phap_ly"):
                _chuoi_dai(v, ra)
    elif isinstance(o, list):
        for v in o:
            _chuoi_dai(v, ra)
    return ra


# ---- 1. hiểu câu hỏi --------------------------------------------------------------------------------------------------
def test_hieu_viec_kieu_va_khung_thoi_gian():
    d = _goi(_SHOP, **_CO_GIO)
    h = d["hieu_cau"]
    assert h["viec"]["ma"] == "mo_cua_hang" and h["viec"]["ten"]
    assert h["kieu"] == "co_nen"
    assert h["khung"]["nam"] == 2027 and h["khung"]["thang"] is None and h["khung"]["mac_dinh"] is False


@pytest.mark.parametrize("cau,viec", [
    ("Tháng 3 năm sau tôi có nên mở quán cà phê không?", "mo_quan"),
    ("Tôi có nên nghỉ việc ra làm riêng không?", "ra_lam_rieng"),
    ("Có nên đầu tư lô đất 2 tỷ vào đầu năm sau không?", "dau_tu"),
    ("Năm sau tôi có nên kết hôn không?", "tinh_cam"),
    ("Tôi muốn mở thêm chi nhánh quý tới", "mo_rong"),
    ("Mình nên góp vốn mở công ty với bạn không", "gop_von"),
    ("Có nên mua nhà cuối năm sau không", "mua_nha"),
])
def test_nhan_dung_viec_cu_the(cau, viec):
    assert _goi(cau)["hieu_cau"]["viec"]["ma"] == viec


def test_mot_thang_cu_the_duoc_giu_lai():
    d = _goi("Tháng 3 năm sau tôi có nên mở quán cà phê không?", **_CO_GIO)
    assert d["hieu_cau"]["khung"] == {**d["hieu_cau"]["khung"], "nam": 2027, "thang": 3}
    assert d["tra_loi"]["thang_hoi"]["nhan"] == "T3/2027"
    assert "T3/2027" in d["tra_loi"]["thang_hoi"]["cau"]


def test_nam_xa_ngoai_pham_vi_noi_that_va_dung_khung_mac_dinh():
    d = _goi("Tôi định mở shop năm 2030, được không?", **_CO_GIO)
    k = d["hieu_cau"]["khung"]
    assert k["ngoai_pham_vi"] == 2030 and k["mac_dinh"] is True


# ---- 2 + 3. câu trả lời đứng đầu, đúng khung thời gian ----------------------------------------------------------------
def test_tra_loi_dung_viec_dung_nam_va_nam_tieng_nguoi():
    d = _goi(_SHOP, **_CO_GIO)
    tl = d["tra_loi"]
    assert "2027" in tl["cau"] and "cửa hàng" in tl["cau"].lower()
    assert tl["nghieng"] in ("thuan", "can_nhac", "chuan_bi")
    assert tl["dieu_kien"] and len(tl["dieu_kien"]) >= 3
    assert tl["truoc_het"]
    assert "quyết định" in tl["cau"].lower() or "quyết định" in tl["nhan_manh"].lower()


def test_thoi_gian_chi_nam_duoc_hoi_va_gop_thang_giong_nhau():
    d = _goi(_SHOP, **_CO_GIO)
    tg = d["thoi_gian"]
    thang = [t for dn in tg["doan"] for t in dn["thang"]]
    assert sorted(thang, key=lambda s: int(s[1:].split("/")[0])) == [f"T{m}/2027" for m in range(1, 13)]
    assert 1 <= len(tg["doan"]) < 12
    assert len({(dn["nhip"], dn["ly_do"]) for dn in tg["doan"]}) == len(tg["doan"])       # mỗi (nhịp, lý do) chỉ một đoạn
    assert all(dn["nhan"] for dn in tg["doan"])
    assert tg["cach_lam"] and all(c["nen_lam"] for c in tg["cach_lam"])
    assert len({c["nhip"] for c in tg["cach_lam"]}) == len(tg["cach_lam"])                 # việc nên làm theo nhịp: một lần


def test_thien_doc_muc_cua_nam_hoi_khong_lap_chuong_cong_viec():
    d = _goi(_SHOP, **_CO_GIO)
    nhan, thien = d["ba_tru_tam_tai"]["nhan"], d["ba_tru_tam_tai"]["thien"]
    assert "2027" in thien["nhan_xet"]
    assert "Công việc & sự nghiệp" not in thien["nhan_xet"]
    assert nhan["nhan_xet"] != thien["nhan_xet"]
    assert set(thien["muc_tung_mon"]) == {"tuvi", "battu"}


def test_ngay_dep_nam_trong_khung_va_co_ly_do():
    d = _goi(_SHOP, **_CO_GIO)
    nd = d["thoi_gian"]["ngay_dep"]
    assert nd and all(x["ngay"].startswith("2027-") and x["ly_do"] for x in nd)


# ---- 4. không lặp ----------------------------------------------------------------------------------------------------
@pytest.mark.parametrize("kw", [{}, _CO_GIO, {**_CO_GIO, "nha": {"do_huong": 178.8, "nam_xay": 2007, "vai": "mat_bang"},
                                              "doi_tac": {"ngay_sinh": "1984-06-25", "gioi_tinh": "nu", "dong_y_tu_nguyen": True}}])
def test_khong_co_hai_cau_dai_giong_nhau(kw):
    ds = _chuoi_dai(_goi(_SHOP, **kw))
    trung = {c for c in ds if ds.count(c) > 1}
    assert not trung, trung


def test_hai_viec_khac_nhau_ra_dieu_kien_va_diem_giu_khac_nhau():
    a = _goi(_SHOP, **_CO_GIO)
    b = _goi("Tôi có nên nghỉ việc ra làm riêng không?", **_CO_GIO)
    assert a["tra_loi"]["dieu_kien"] != b["tra_loi"]["dieu_kien"]
    assert a["tra_loi"]["truoc_het"] != b["tra_loi"]["truoc_het"]
    assert a["tra_loi"]["nen_giu"] != b["tra_loi"]["nen_giu"]
    # điều nên giữ của mở shop không được nói chuyện "chuyển việc vì bức xúc"
    assert "chuyển việc" not in a["tra_loi"]["nen_giu"]


# ---- 5. không gian ---------------------------------------------------------------------------------------------------
def test_kinh_doanh_dung_huong_mat_bang_va_noi_dung_ve_cua_hang():
    d = _goi(_SHOP, **_CO_GIO, nha={"do_huong": 178.8, "nam_xay": 2007, "vai": "mat_bang"})
    dia = d["ba_tru_tam_tai"]["dia"]
    assert dia["muc"] in ("thuan", "can_bang", "can_chu_dong")
    assert "mặt tiền" in dia["nhan_xet"].lower() and "Nam" in dia["nhan_xet"]
    assert "quầy thu ngân" in dia["hanh_dong"].lower()
    assert "can_bo_sung" not in d or d["can_bo_sung"] is None


def test_huong_nha_o_khong_duoc_dung_lam_huong_cua_hang():
    d = _goi(_SHOP, **_CO_GIO, nha={"do_huong": 178.8, "nam_xay": 2007, "vai": "nha_o"})
    assert "dia" not in d["ba_tru_tam_tai"]
    assert d["can_bo_sung"]["loai"] == "mat_bang" and "nhà ở" in d["can_bo_sung"]["ly_do"].lower()


def test_mat_bang_rieng_thang_huong_nha_o_khi_co_ca_hai():
    """Web gửi cả hồ sơ nhà ở (nha) lẫn hồ sơ cửa hàng (mat_bang): câu hỏi kinh doanh dùng mat_bang, mua nhà dùng nha."""
    kw = dict(_CO_GIO, nha={"do_huong": 90, "nam_xay": 2015, "vai": "nha_o"}, mat_bang={"do_huong": 178.8, "nam_xay": 2007})
    shop = _goi(_SHOP, **kw)["ba_tru_tam_tai"]["dia"]
    assert "178.8" in shop["nhan_xet"] and "Nam" in shop["nhan_xet"]
    nha = _goi("Có nên mua nhà cuối năm sau không", **kw)["ba_tru_tam_tai"]["dia"]
    assert "178.8" not in nha["nhan_xet"] and nha["muc"] is not None


def test_chi_co_mat_bang_khong_co_nha_van_chay():
    d = _goi(_SHOP, **_CO_GIO, mat_bang={"do_huong": 178.8, "nam_xay": 2007})
    assert d["ba_tru_tam_tai"]["dia"]["muc"] is not None and "can_bo_sung" not in d


def test_chua_co_huong_thi_noi_dung_thu_can_va_khong_bia_muc():
    d = _goi(_SHOP, **_CO_GIO)
    assert "dia" not in d["ba_tru_tam_tai"]
    cb = d["can_bo_sung"]
    assert cb["loai"] == "mat_bang" and {"ho_so", "la_ban"} <= set(cb["cach"])


def test_viec_khong_lien_quan_khong_gian_khong_dong_hoi_huong_nha():
    for cau in ("Năm sau tôi có nên kết hôn không?", "Có nên đầu tư lô đất 2 tỷ vào đầu năm sau không?"):
        d = _goi(cau, **_CO_GIO)
        assert "dia" not in d["ba_tru_tam_tai"] and not d.get("can_bo_sung")


def test_mua_nha_dung_huong_nha_o():
    d = _goi("Có nên mua nhà cuối năm sau không", **_CO_GIO, nha={"do_huong": 178.8, "nam_xay": 2007, "vai": "nha_o"})
    assert d["ba_tru_tam_tai"]["dia"]["muc"] is not None


# ---- 6. bản Anh -------------------------------------------------------------------------------------------------------
def test_ban_tieng_anh_cung_khung_va_sach_chu_viet():
    kw = dict(_CO_GIO, nha={"do_huong": 178.8, "nam_xay": 2007, "vai": "mat_bang"})
    en = _C.post("/v1/co-van", json={"cau_hoi": "Should I open a shop next year, will my business go well?", "ngay_xem": _NGAY, **kw},
                 headers={"x-ngon-ngu": "en"})
    assert en.status_code == 200, en.text
    en = en.json()
    assert en["hieu_cau"]["viec"]["ma"] == "mo_cua_hang" and en["hieu_cau"]["khung"]["nam"] == 2027
    assert not _VIET.search(json.dumps({k: v for k, v in en.items() if k != "ngay_xem"}, ensure_ascii=False))
    vi = _goi(_SHOP, **kw)
    assert dr.khung(vi) == dr.khung(en)
