# -*- coding: utf-8 -*-
"""BT-DC — "Cách nào đúng với mình?" (`luangiai/battu_doi_chieu.py`): đối chiếu hai cách lấy dụng thần với NHỮNG NĂM
ĐÃ QUA của chính người xem. Viết TRƯỚC hàm.

Hợp đồng: chỉ hỏi năm/giai đoạn ĐÃ QUA mà hai cách đọc KHÁC nhau (ngược nhau ưu tiên trước), không hỏi tuổi nhỏ,
mỗi câu mang mức của từng cách (đã tính ở engine — web chỉ so câu trả lời với mức), không thuật ngữ trong câu hỏi,
không doạ; hệ thống KHÔNG tự chọn cách (`chon` luôn None); không lưu.
"""
from __future__ import annotations

import datetime as dt
import re

import pytest
from fastapi.testclient import TestClient

from app.luangiai import battu_doi_chieu as dc
from app.luangiai import battu_doi_song as bt
from app.main import app

SINH = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}
XEM = dt.date(2026, 10, 21)
MUC = {"thuan", "can_bang", "can_chu_dong"}
THUAT_NGU = re.compile(r"[Dd]ụng thần|[Nn]hật chủ|[Đđ]ại vận|[Ll]ưu niên|Chính Quan|Thất Sát|Thiên Tài|Chính Tài|"
                       r"Thực Thần|Thương Quan|Chính Ấn|Thiên Ấn|Tỷ Kiên|Kiếp Tài|[Hh]ỷ thần|[Kk]ỵ thần")
TU_DOA = re.compile(r"xui|xấu|hạn nặng|tai hoạ|đại kỵ|nguy", re.I)


@pytest.fixture(scope="module")
def kq():
    return dc.lap(SINH, XEM)


def test_hop_dong(kq):
    assert kq["phien_ban"] == "doi_chieu_cach_1" and kq["chon"] is None
    assert kq["co_cau_hoi"] is True and 3 <= len(kq["cau"]) <= dc.SO_CAU_TOI_DA
    assert [x["ma"] for x in kq["lua_chon"]] == ["thuan", "can_bang", "can_chu_dong", "khong_nho"]
    assert set(kq["cach"]) == {"cach_1", "cach_2"} and all(kq["cach"][c]["ten"] for c in kq["cach"])
    assert kq["luat"] == {"toi_thieu": 3, "chenh": 2}
    assert set(kq["ket_luan"]) == {"cach_1", "cach_2", "nghieng_1", "nghieng_2", "chua_ro"}
    assert kq["cach_cuc"] == "thien_tai" and kq["than"] == "yeu"


def test_chi_hoi_qua_khu_va_hai_cach_khac_nhau(kq):
    nam_xem = bt._nam_bat_tu(dt.datetime(XEM.year, XEM.month, XEM.day, 5))
    for c in kq["cau"]:
        assert c["cach_1"] in MUC and c["cach_2"] in MUC and c["cach_1"] != c["cach_2"]
        assert c["loai"] in ("nam", "van") and re.fullmatch(r"(nam|van)\.\d{4}", c["ma"])
        if c["loai"] == "nam":
            assert c["nam"] < nam_xem and c["tuoi"] >= dc.TUOI_NHO_NHAT
        else:
            assert c["den_ngay"] < XEM.isoformat() and c["tu_tuoi"] >= dc.TUOI_NHO_NHAT
        assert c["can_cu"] and c["nhan"] and c["hoi"].endswith("…")
    assert len({c["ma"] for c in kq["cau"]}) == len(kq["cau"])


def test_uu_tien_cau_nguoc_nhau(kq):
    diem = [2 if {c["cach_1"], c["cach_2"]} == {"thuan", "can_chu_dong"} else 1 for c in kq["cau"]]
    assert diem == sorted(diem, reverse=True)


def test_khong_thuat_ngu_khong_doa(kq):
    chu = [c["hoi"] for c in kq["cau"]] + [c["nhan"] for c in kq["cau"]] + list(kq["ket_luan"].values()) + \
        [x["nhan"] for x in kq["lua_chon"]] + [kq["cach"][c]["mo_ta"] for c in kq["cach"]]
    for s in chu:
        assert not THUAT_NGU.search(s), s
        assert not TU_DOA.search(s), s


def test_can_cu_neu_ro_tung_cach(kq):
    for c in kq["cau"]:
        cu = " ".join(c["can_cu"])
        assert "cân sức" in cu and "tháng sinh" in cu


def test_nguoi_tre_chua_du_nam():
    r = dc.lap({"lich": dt.datetime(2015, 3, 1, 9), "gioi_tinh": "nu"}, XEM)
    assert r["co_cau_hoi"] is False and r["cau"] == [] and r["ly_do"] == "it_nam_qua"


@pytest.mark.parametrize("nam", range(1950, 2006, 5))
def test_nhieu_la(nam):
    for gt in ("nam", "nu"):
        r = dc.lap({"lich": dt.datetime(nam, 8, 9, 14), "gioi_tinh": gt}, XEM)
        assert r["co_cau_hoi"] == bool(r["cau"]) and len(r["cau"]) <= dc.SO_CAU_TOI_DA
        if not r["co_cau_hoi"]:
            assert r["ly_do"] in ("it_nam_qua", "hai_cach_trung")
        else:
            assert len(r["cau"]) >= 3


def test_api():
    c = TestClient(app)
    r = c.post("/v1/battu/doi-chieu-cach", json={"la_so": {"birth_date": "1990-05-17", "birth_time": "12:30",
                                                         "gender": "nam", "noi_sinh": "ha-noi"},
                                                 "ngay_xem": "2026-10-21"})
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["co_cau_hoi"] and v["engine_version"]
    r = c.post("/v1/battu/doi-chieu-cach", json={"la_so": {"birth_date": "1990-05-17", "gender": "nam"}, "x": 1})
    assert r.status_code == 422
