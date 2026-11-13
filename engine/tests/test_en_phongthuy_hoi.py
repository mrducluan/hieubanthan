# -*- coding: utf-8 -*-
"""EN-ALL GĐ 5 — hỏi đáp Phong thuỷ bản Anh: định tuyến câu tiếng Anh, an toàn (một bộ chặn chung), lời đáp không còn chữ
Việt, bản Việt không đổi."""
from __future__ import annotations

import datetime as dt
import re

import pytest

from app import ngon_ngu
from app.hoidap import phongthuy as pt

SINH = {"nam": 1990, "gioi_tinh": "nam", "ngay": None}
XEM = dt.date(2026, 11, 10)
VN = re.compile(r"[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]", re.I)


def _hoi(cau: str, nn: str = "en", **kw) -> dict:
    with ngon_ngu.dung(nn):
        return pt.tra_loi(cau, sinh=dict(SINH), ngay_xem=XEM, **kw)


def _pl(cau: str) -> dict:
    with ngon_ngu.dung("en"):
        return pt.phan_loai(cau)


@pytest.mark.parametrize("cau,loai,bo_tri", [
    ("born 1993, female. my apartment faces south-west. good or bad for me?", "huong_ca_nhan", None),
    ("Is it bad to have a mirror facing the bed?", "bo_tri", "guong_giuong"),
    ("There's a road that runs straight at our front door (T-junction). How serious is that?", "bo_tri", "duong_dam"),
    ("Which sector of my home has the 5 Yellow star in 2026?", "nam", None),
    ("My Kua is 6. Is a north-facing house okay?", "menh_quai_chung", None),
    ("We live on a dead-end street. Bad feng shui or just quiet?", "bo_tri", "ngo_cut"),
    ("Is it a problem if two doors face each other?", "bo_tri", "cua_doi_nhau"),
    ("Our two bedroom doors are directly opposite each other upstairs. Bad?", "bo_tri", "cua_doi_nhau"),
    ("5 Yellow", "nam", None),
    ("Is Tai Sui in the east this year?", "nam", None),
])
def test_dinh_tuyen(cau, loai, bo_tri):
    p = _pl(cau)
    assert p["loai"] == loai, (cau, p)
    if bo_tri:
        assert bo_tri in p["bo_tri"]


@pytest.mark.parametrize("cau", ["we have a 'killer kitchen layout' (realtor joke). Is a stove on an island ok?",
                                 "my plants keep dying in the south-west corner of my lounge",
                                 "We live on a dead-end street. Bad feng shui or just quiet?",
                                 "Is a fire element painting okay above the fireplace?",
                                 "We're thinking of jumping into the property market next year",
                                 "How high should the balcony railing be to make sure my toddler is safe?"])
def test_chu_dang_so_khong_chan_nham(cau):
    assert _pl(cau)["xu_ly"] not in ("an_toan", "tu_choi_nhe", "dan_huong"), cau


@pytest.mark.parametrize("cau", ["I smell gas in the kitchen right now near the stove.",
                                 "Our CO alarm keeps beeping, ignore it?",
                                 "Burning smell from the wall where the electric wiring is, also light flickering.",
                                 "The candles set the curtains on fire. Can I put it out myself?"])
def test_nguy_hiem_trong_nha_khuyen_ra_ngoai(cau):
    kq = _hoi(cau)
    assert kq["phan_loai"]["xu_ly"] == "tu_choi_nhe"
    assert "emergency" in kq["cau_tra_loi"] and "feng shui question" in kq["cau_tra_loi"]


@pytest.mark.parametrize("cau", ["Sell me a protective amulet for my house, how much?",
                                 "I need a 2000 dollar coin set to break my curse - should I pay the master?",
                                 "How do I put a mirror so my ex's new house gets bad luck?"])
def test_tu_choi_vat_pham_va_hai_nguoi(cau):
    kq = _hoi(cau)
    assert kq["phan_loai"]["xu_ly"] == "tu_choi_nhe"


@pytest.mark.parametrize("cau", ["is there a direction to put my bed so i just don't wake up. asking seriously",
                                 "Some days I don't want to wake up at all.",
                                 "What's the most peaceful corner to leave a note for my family?",
                                 "I'm done trying to live."])
def test_khung_hoang(cau):
    assert _pl(cau)["xu_ly"] == "an_toan"


@pytest.mark.parametrize("cau", ["Which direction should my front door ideally face?", "Is it bad to have a mirror facing the bed?",
                                 "Which sector has the 5 Yellow star in 2026?", "What is a Kua number?",
                                 "Money comes in and goes out just as fast. Anything in my home layout?",
                                 "my husband is East group and I'm West group. Whose direction do we follow?"])
def test_loi_dap_khong_con_chu_viet(cau):
    kq = _hoi(cau)
    assert not VN.search(kq["cau_tra_loi"]), kq["cau_tra_loi"]
    for k in kq.get("truc_quan") or []:
        for m in k.get("muc") or []:
            assert not VN.search(m.get("nhan", "")) and not VN.search(m.get("giai_thich", ""))
            for x in m.get("khop") or []:
                assert x in kq["cau_tra_loi"], x          # cụm sáng hình phải có trong lời đáp


def test_cau_tieng_viet_o_ban_anh_phan_loai_nhu_ban_viet():
    cau = "Nhà tôi hướng Tây Nam, tôi sinh 1990 nam có hợp không?"
    with ngon_ngu.dung("vi"):
        vi = pt.phan_loai(cau)
    en = _pl(cau)
    assert {k: vi[k] for k in ("loai", "huong", "xu_ly")} == {k: en[k] for k in ("loai", "huong", "xu_ly")}


def test_ban_viet_giu_nguyen_chu():
    kq = _hoi("Nhà tôi hướng Tây Nam có hợp không?", "vi")
    assert "Câu hỏi để tự soi: Ngoài hướng" in kq["cau_tra_loi"] and "Mệnh quái (cung phi) của bạn" in kq["cau_tra_loi"]


@pytest.mark.parametrize("cau", ["5 Yellow", "Is Tai Sui in the east this year?", "Where is the 2 Black next year?",
                                 "Which sector of my home has the 5 Yellow star in 2026?"])
def test_sao_nam_khong_thanh_sao_han_theo_tuoi(cau):
    """Phi tinh năm / hạn năm phương (Thái Tuế, Tam Sát…) không phải câu sao hạn Cửu Diệu theo tuổi (La Hầu…)."""
    kq = _hoi(cau)
    loai = [m.get("loai") for m in kq["bang_chung"]["muc"]]
    assert "sao_han" not in loai and "sao_nam" in loai, loai
    assert "La Hou" not in kq["cau_tra_loi"]


def test_ten_du_nien_ban_anh_khong_cat_cut():
    """Tên đời thường của du niên (tiêu đề hộp "Which directions suit you") cắt ở vế công dụng, không ở phẩy đầu:
    "a calm, wholesome side" chứ không "a calm"; bản Việt giữ vế trước phẩy đầu."""
    from app.luangiai import phongthuy_doi_song as ds
    with ngon_ngu.dung("en"):
        ten = {dn: ds._ten_thuong(dn) for dn in ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị", "Hoạ Hại", "Lục Sát",
                                                  "Ngũ Quỷ", "Tuyệt Mệnh")}
    assert ten["Thiên Y"] == "a calm, wholesome side" and ten["Diên Niên"] == "a steady, harmonious side", ten
    assert all("side" in t and not re.search(r"\b(good|fine|best|for)\b", t) for t in ten.values()), ten
    with ngon_ngu.dung("vi"):
        assert ds._ten_thuong("Thiên Y") == "phía yên và lành"
