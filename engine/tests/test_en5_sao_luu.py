# -*- coding: utf-8 -*-
"""EN-5.2 — sao lưu năm Tử vi (viết TRƯỚC `calc.tuvi_an_sao.sao_luu_nam` + `luangiai/tuvi_sao_luu.py`).

Vị trí lấy từ CHÍNH kết quả iztro (horoscope.yearly.stars + yearlyDecStar.suiqian12) — không tự tính lại. Kiểm bằng khẩu
quyết công khai (tính tay): Lộc Tồn theo can năm, Kình Dương = Lộc + 1, Đà La = Lộc − 1, Thiên Mã theo tam hợp chi năm,
Khôi Việt theo can năm, Thái Tuế = chi năm, Tang Môn = Thái Tuế + 2, Bạch Hổ = Thái Tuế + 8 (đối Tang Môn)."""
from __future__ import annotations

import datetime as dt
import json

import pytest

from app.calc import tuvi_an_sao as az
from app.hoidap.tuvi import tom_tat
from app.luangiai import tuvi_sao_luu as sl

CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
LOC = {"Giáp": "Dần", "Ất": "Mão", "Bính": "Tỵ", "Mậu": "Tỵ", "Đinh": "Ngọ", "Kỷ": "Ngọ", "Canh": "Thân", "Tân": "Dậu",
       "Nhâm": "Hợi", "Quý": "Tý"}
MA = {"Thân": "Dần", "Tý": "Dần", "Thìn": "Dần", "Dần": "Thân", "Ngọ": "Thân", "Tuất": "Thân", "Tỵ": "Hợi",
      "Dậu": "Hợi", "Sửu": "Hợi", "Hợi": "Tỵ", "Mão": "Tỵ", "Mùi": "Tỵ"}
KHOI_VIET = {"Giáp": ("Sửu", "Mùi"), "Mậu": ("Sửu", "Mùi"), "Canh": ("Sửu", "Mùi"), "Ất": ("Tý", "Thân"),
             "Kỷ": ("Tý", "Thân"), "Bính": ("Hợi", "Dậu"), "Đinh": ("Hợi", "Dậu"), "Nhâm": ("Mão", "Tỵ"),
             "Quý": ("Mão", "Tỵ"), "Tân": ("Ngọ", "Dần")}


def _cong(chi: str, n: int) -> str:
    return CHI[(CHI.index(chi) + n) % 12]


@pytest.mark.parametrize("nam", range(2024, 2036))
def test_vi_tri_dung_khau_quyet(nam):
    x = az.sao_luu_nam(dt.date(1990, 5, 17), 6, "nam", dt.date(nam, 6, 1))
    can, chi = CAN[(nam - 4) % 10], CHI[(nam - 4) % 12]
    assert (x["can"], x["chi"]) == (can, chi)
    assert x["sao"]["loc"] == LOC[can]
    assert x["sao"]["kinh"] == _cong(LOC[can], 1)
    assert x["sao"]["da"] == _cong(LOC[can], -1)
    assert x["sao"]["ma"] == MA[chi]
    assert (x["sao"]["khoi"], x["sao"]["viet"]) == KHOI_VIET[can]
    assert x["vong"]["thai_tue"] == chi
    assert x["vong"]["tang_mon"] == _cong(chi, 2)
    assert x["vong"]["bach_ho"] == _cong(chi, 8)


def test_khong_doi_theo_nguoi():
    """Sao lưu chỉ theo can chi năm xem — hai người khác nhau cùng năm ra cùng chi."""
    a = az.sao_luu_nam(dt.date(1990, 5, 17), 6, "nam", dt.date(2027, 6, 1))
    b = az.sao_luu_nam(dt.date(1985, 11, 2), 2, "nu", dt.date(2027, 6, 1))
    assert a["sao"] == b["sao"] and a["vong"] == b["vong"]


@pytest.fixture(scope="module")
def doc():
    sinh = dt.date(1990, 5, 17)
    ls = tom_tat(az.an_sao_tho(sinh, 6, "nam", "vi-VN"))
    return sl.doc(ls, az.sao_luu_nam(sinh, 6, "nam", dt.date(2027, 6, 1)))


def test_doc_gan_cung_cua_la_so(doc):
    for m in doc["muc"]:
        assert m["cung"] and m["chi"] in CHI
        assert m["loi"] and m["nen_lam"]
    ten = {m["ma"] for m in doc["muc"]}
    assert {"loc", "kinh", "da", "ma", "thai_tue", "tang_mon", "bach_ho"} <= ten


def test_kinh_da_kep_loc(doc):
    assert "Lộc" in doc["kep_loc"] and doc["kep_loc"].endswith(".")


def test_loi_doi_thuong_khong_doa(doc):
    s = json.dumps({k: v for k, v in doc.items() if k != "can_cu"}, ensure_ascii=False).lower()
    for c in ("chết", "tai hoạ", "tang tóc", "tai nạn", "máu", "đại hung", "đại kỵ", "bệnh"):
        assert c not in s, c


def test_cung_chinh_bi_cham(doc):
    """Kình / Đà / Tang Môn / Bạch Hổ rơi cung chính (Mệnh, Tài Bạch, Quan Lộc, Phu Thê, Tật Ách) → liệt kê để chú ý."""
    for m in doc["chu_y"]:
        assert m["ma"] in ("kinh", "da", "tang_mon", "bach_ho")
        assert m["cung"] in sl.CUNG_CHU_Y


SINH = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}


@pytest.mark.parametrize("cau", ["Năm nay tôi có Kình Đà lưu không?", "Tang Môn Bạch Hổ năm 2027 của tôi ở đâu?",
                                 "Sao lưu năm sau của tôi thế nào?", "năm nay lưu kình dương rơi cung nào của mình",
                                 "Thái Tuế lưu năm nay của tôi ở cung nào?"])
def test_hoi_dap_sao_luu(cau):
    from app.hoidap import tuvi as tv
    r = tv.tra_loi(cau, sinh=SINH, ngay_xem=dt.date(2026, 11, 1), dung_llm=False)
    assert r["phan_loai"]["loai"] == "han"
    assert any(m["loai"] == "sao_luu" for m in r["bang_chung"]["muc"]), cau
    assert "Sao lưu năm" in r["cau_tra_loi"]


def test_hoi_dap_dung_nam_hoi():
    from app.hoidap import tuvi as tv
    r = tv.tra_loi("Sao lưu năm 2028 của tôi?", sinh=SINH, ngay_xem=dt.date(2026, 11, 1), dung_llm=False)
    m = next(x for x in r["bang_chung"]["muc"] if x["loai"] == "sao_luu")
    assert m["nam"] == 2028 and m["can_chi"] == "Mậu Thân"


def test_sao_duoc_hoi_tra_loi_truoc():
    from app.hoidap import tuvi as tv
    r = tv.tra_loi("Năm nay tôi có Kình Đà lưu không?", sinh=SINH, ngay_xem=dt.date(2026, 11, 1), dung_llm=False)
    van = r["cau_tra_loi"]
    assert van.index("Kình Dương lưu") < van.index("Các sao lưu khác")
    assert "Bạch Hổ lưu (" not in van           # câu "rơi đúng mảng chính" chỉ cho sao được hỏi


def test_khong_nham_cau_kien_thuc():
    from app.hoidap import tuvi as tv
    r = tv.tra_loi("Kình Dương là gì?", sinh=SINH, ngay_xem=dt.date(2026, 11, 1), dung_llm=False)
    assert not any(m["loai"] == "sao_luu" for m in r["bang_chung"]["muc"])
