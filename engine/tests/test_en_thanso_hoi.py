# -*- coding: utf-8 -*-
"""EN-ALL GĐ 7 (nhóm H) — hỏi đáp Thần số tiếng Anh đầy đủ (`luangiai/hoi_en.py` + `hoidap/en_gloss_ts.py`): cùng bộ phân
loại + gói bằng chứng với bản Việt, lời đáp tiếng Anh sạch, an toàn một bộ chặn chung, ba lỗi reviewer bản Anh đã báo."""
from __future__ import annotations

import datetime as dt
import re

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.luangiai import hoi_en
from app.main import app
from tests import _dau_ra as dr

client = TestClient(app)
EN = {"x-ngon-ngu": "en"}
XEM = dt.date(2026, 11, 10)          # thứ Ba
NGUOI = {"ho_ten": ["Nguyen Van An"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tong_het"}


def _hoi(cau: str, **kw) -> dict:
    with ngon_ngu.dung("en"):
        kq = hoi_en.tra_loi(cau, NGUOI, XEM, **kw)
    assert not dr.loi_en(kq, {"q": cau}), dr.loi_en(kq, {"q": cau})[:3]
    return kq


def _doan_dau(kq: dict) -> str:
    return kq["cau_tra_loi"].split("\n\n")[0]


def test_ngay_mai_la_ngay_ca_nhan_cua_ngay_mai():
    kq = _hoi("I'm catching the early flight tomorrow, good day for it?")
    ngay = [m for m in kq["bang_chung"]["muc"] if m["loai"] == "ngay_ca_nhan"]
    assert ngay and ngay[0]["ngay"] == "2026-11-11"
    assert "Wednesday 11 November 2026" in _doan_dau(kq)


def test_con_thi_cu_khong_doc_nam_ca_nhan_cua_cha_me_nhu_cua_con():
    kq = _hoi("My son has university entrance exams this year. How can he do well?")
    dau = _doan_dau(kq)
    assert "not your child" in dau and "personal year" not in dau.lower()
    assert "not a prediction of marks" in dau
    # phần dưới nếu có con số thì là con số của người hỏi, ghi rõ "your"
    assert not re.search(r"\b(his|your son's|your child's) (personal year|life path)\b", kq["cau_tra_loi"], re.I)


@pytest.mark.parametrize("cau", ["my wife has someone else and I don't know what to do",
                                 "I think my husband is cheating on me. what do my numbers say?",
                                 "We're talking about divorce. How do I get through this?"])
def test_khung_hoang_quan_he_dong_cam_truoc(cau):
    assert "weighs heavily" in _doan_dau(_hoi(cau))


@pytest.mark.parametrize("cau,xu_ly,co", [
    ("I don't want to live anymore", "an_toan", "988"),
    ("everyone would be better off without me", "an_toan", "988"),
    ("I took a whole bottle of pills, what does my number say", None, "911"),
    ("When will I die?", "tu_choi_nhe", ""),
    ("Give me lucky lottery numbers for this week", "tu_choi_nhe", ""),
    ("Which candidate should I hire, born 1990 or 1994?", "tu_choi_nhe", ""),
    ("Do I have cancer?", "tu_choi_nhe", "doctor"),
    ("Is there a ghost in my house?", "dan_huong", ""),
])
def test_an_toan_mot_bo_chan(cau, xu_ly, co):
    kq = _hoi(cau)
    if xu_ly:
        assert kq["phan_loai"]["xu_ly"] == xu_ly
    else:
        assert kq["phan_loai"]["xu_ly"] in ("an_toan", "tu_choi_nhe")
    assert co in kq["cau_tra_loi"]
    assert not kq["bang_chung"]


def test_cau_chan_mo_bang_loi_nen():
    kq = _hoi("Give me lucky lottery numbers for this week")
    cau_dau = re.split(r"(?<=\.)\s", kq["cau_tra_loi"].strip())[0].lower()
    assert "keep your money" in cau_dau          # gợi ý "nên…" đứng trước câu giải thích vì sao không luận


def test_suc_khoe_kem_khong_phai_loi_khuyen_y_te():
    kq = _hoi("I've been so stressed lately, what can I do?")
    assert "not medical advice" in kq["cau_tra_loi"]


@pytest.mark.parametrize("cau,lv,dt_", [
    ("Are life path 3 and life path 8 compatible?", "hop_doi", "hai_nguoi"),
    ("What's my mom's personality like? She was born 14/02/1965.", "nguoi_khac", "nguoi_khac"),
    ("my daughter was born 05/06/2015, what is she like?", "con_cai", "con"),
    ("What is my personal year for 2027?", "thoi_van", "ban_than"),
    ("Do I have karmic debt?", "tam_linh", "ban_than"),
    ("Should I change my name to improve my luck?", "ten_goi", "ban_than"),
    ("How is the life path number calculated?", "ky_thuat", "ban_than"),
])
def test_dinh_tuyen_theo_khuon_ban_viet(cau, lv, dt_):
    pl = _hoi(cau)["phan_loai"]
    assert (pl["linh_vuc"], pl["doi_tuong"]) == (lv, dt_), pl


def test_nam_duoc_hoi_dung_moc():
    kq = _hoi("What is my personal year for 2027?")
    assert any(m["loai"] == "nam_ca_nhan" and m["nam"] == 2027 for m in kq["bang_chung"]["muc"])
    kq = _hoi("What will March 2027 be like for me?")
    assert any(m["loai"] == "thang_ca_nhan" and m["thang"] == 3 for m in kq["bang_chung"]["muc"])


def test_hop_doi_co_nguoi_kia_qua_route():
    body = {**{k: NGUOI[k] for k in ("ho_ten", "ngay", "thang", "nam")}, "cau_hoi": "Are we compatible?",
            "nguoi_kia": {"ngay": 3, "thang": 9, "nam": 1992}, "ngay_xem": "2026-11-10"}
    r = client.post("/v1/thanso/hoi", json=body, headers=EN).json()
    assert r["phan_loai"]["linh_vuc"] == "hop_doi" and any(m["loai"] == "cap_so" for m in r["bang_chung"]["muc"])
    assert not dr.loi_en(r, {"q": body["cau_hoi"]})


def test_phai_chaldea():
    kq = _hoi("tell me about my personality", phai="chaldea")
    assert "Chaldean" in kq["cau_tra_loi"]


def test_cau_tieng_viet_gui_ban_anh_van_ra_chu_anh():
    for cau in ("Năm nay của tôi thế nào?", "Tôi hợp nghề gì?", "Con số của tôi nói gì về tình yêu?"):
        kq = _hoi(cau)
        assert kq["cau_tra_loi"] and kq["phan_loai"]["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y")


def test_bo_dev_dinh_tuyen_va_sach_chu():
    from scripts.cham_en_thanso import cham
    kq = cham()
    dung, tong = map(int, kq["dinh_tuyen"].split()[0].split("/"))
    assert dung / tong >= 0.95, kq
    assert kq["con_chu_viet"] == 0 and kq["loi_500"] == 0 and kq["chan_nham"] == 0, kq
    for k in ("khung_hoang", "cap_cuu", "tu_choi"):
        a, b = map(int, kq[k].split("/"))
        assert a == b, kq


# ------------------------------------------------------------------ gộp GĐ 7: khối hình + yểm bùa người hỏi là nạn nhân
def _goi_en(m, q):
    from tests.test_cy2_review2 import _hoi
    return _hoi(m, q, "en")


def test_truc_quan_thanso_tieng_anh():
    from tests import _dau_ra as dr
    j = _goi_en("thanso", "What does my personal year say about 2027?")
    assert j["truc_quan"] and not dr.loi_en(j)
    assert any("Life Path" in (k.get("khop") or [""])[-1] for b in j["truc_quan"] for k in b.get("muc", []) if isinstance(k, dict))


@pytest.mark.parametrize("q, xl", [("Did someone put a curse on me?", "dan_huong"), ("Is there a curse on my house?", "dan_huong"),
                                   ("How do I put a curse on my ex?", "tu_choi_nhe"), ("Put a hex on my neighbour", "tu_choi_nhe")])
def test_yem_bua_en_cung_nhanh_ban_viet(q, xl):
    for m in ("thanso", "tuvi"):
        assert (_goi_en(m, q).get("phan_loai") or {}).get("xu_ly") == xl, (m, q)
