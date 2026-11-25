# -*- coding: utf-8 -*-
"""PT-NHA — thẻ "Nhà của tôi": người dùng chỉ nhớ KHOẢNG năm xây (chip theo vận) → engine nhận `van_xay` thay `nam_xay`.
Bàn sao chỉ phụ thuộc vận nên kết quả trùng khít với một năm bất kỳ trong vận; lời luận nói "vận …", không bịa năm.
Huyền Không nhận thẳng độ HƯỚNG nhà (`huong_do`) — engine đổi sang toạ, web không tự cộng 180°."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.calc import huyen_khong as hk
from app.main import app

client = TestClient(app)
SINH = {"birth_date": "1990-05-17", "gender": "nam"}


def test_nam_dau_van_va_khoang():
    assert [hk.nam_dau_van(v) for v in (6, 7, 8, 9)] == [1964, 1984, 2004, 2024]
    assert hk.khoang_van(8) == (2004, 2023)
    for v in range(1, 10):
        a, b = hk.khoang_van(v)
        assert hk.van_cua_nam(a) == v and hk.van_cua_nam(b) == v
    for v in (0, 10, True):
        with pytest.raises(ValueError):
            hk.nam_dau_van(v)


def _hk(**k):
    return client.post("/v1/phongthuy/huyen-khong", json=k)


def test_huyen_khong_van_xay_trung_nam_trong_van():
    a, b = _hk(van_xay=8, toa="Tý").json(), _hk(nam_xay=2010, toa="Tý").json()
    assert a["cung"] == b["cung"] and a["cuc"] == b["cuc"] and a["van"] == 8
    assert a["nam_xay"] is None and a["khoang_xay"] == {"tu": 2004, "den": 2023}
    assert b["nam_xay"] == 2010 and "khoang_xay" not in b


def test_huyen_khong_nhan_huong_nha():
    for huong in (0.0, 172.5, 359.0, 93.0):
        a, b = _hk(nam_xay=2010, huong_do=huong).json(), _hk(nam_xay=2010, do=round((huong + 180) % 360, 2)).json()
        assert a["cung"] == b["cung"] and a["canh_bao"] == b["canh_bao"] and a["phep"] == b["phep"]
        assert a["do_toa"] == round((huong + 180) % 360, 2)


@pytest.mark.parametrize("than", [
    {"nam_xay": 2010, "van_xay": 8, "toa": "Tý"},       # hai cách nêu năm cùng lúc
    {"toa": "Tý"},                                        # thiếu năm / vận
    {"nam_xay": 2010, "toa": "Tý", "huong_do": 10},       # hai cách nêu hướng
    {"nam_xay": 2010},                                    # thiếu hướng
    {"van_xay": 10, "toa": "Tý"},
])
def test_huyen_khong_dau_vao_sai(than):
    assert _hk(**than).status_code == 422


def test_luan_giai_noi_van_khong_bia_nam():
    def lg(**nam):
        r = client.post("/v1/phongthuy/luan-giai", json={"sinh": SINH, "nha": {"huong_do": 180, "theo": "cua", **nam}, "ngay_xem": "2026-05-20"})
        assert r.status_code == 200, r.text
        return r.json()
    a, b = lg(van_xay=8), lg(nam_xay=2010)
    hop = [h for c in a["chuong"] for h in c["hop"]]
    assert any("vận 8" in h["tieu_de"] for h in hop)
    assert not any("2004" in (h["tieu_de"] + h.get("noi_dung", "")) for h in hop)
    assert a["da_tinh"]["huyen_khong"]["van"] == 8 and a["da_tinh"]["huyen_khong"]["nam_xay"] is None
    # cùng vận → cùng mức mọi chương
    assert [c.get("muc") for c in a["chuong"]] == [c.get("muc") for c in b["chuong"]]
    assert "nam_xay" not in a["thieu"]
    assert client.post("/v1/phongthuy/luan-giai", json={"nha": {"huong_do": 180, "nam_xay": 2010, "van_xay": 8}}).status_code == 422


def test_luan_giai_ban_anh_van_xay():
    r = client.post("/v1/phongthuy/luan-giai", headers={"x-ngon-ngu": "en"},
                    json={"sinh": SINH, "nha": {"huong_do": 180, "van_xay": 8}, "ngay_xem": "2026-05-20"})
    assert r.status_code == 200
    hop = [h["tieu_de"] for c in r.json()["chuong"] for h in c["hop"]]
    assert any("Period 8" in t for t in hop)


def test_thang_nay_va_hoi_gi_va_vi_tri_nhan_van_xay():
    a = client.post("/v1/phongthuy/thang-nay", json={"huong": "Nam", "van_xay": 8, "ngay_xem": "2026-05-20"}).json()
    b = client.post("/v1/phongthuy/thang-nay", json={"huong": "Nam", "nam_xay": 2010, "ngay_xem": "2026-05-20"}).json()
    assert a["huyen_khong"] and a["huyen_khong"]["van"] == 8 and a["thang"] == b["thang"]

    r = client.post("/v1/phongthuy/hoi-gi", json={"ma": "cua_chinh", "sinh": SINH, "nha": {"huong_do": 180, "van_xay": 8}})
    assert r.status_code == 200, r.text
    vs = " ".join(r.json()["vi_sao"])
    assert "trong vận 8" in vs and "2004" not in vs

    def vt(**nam):
        r = client.post("/v1/phongthuy/vi-tri-vat", json={"huong_nha_do": 180.0, "tang": [{"so": 1, "vat": [{"loai": "bep", "mau": [90.0]}]}], **nam})
        assert r.status_code == 200, r.text
        return r.json()
    assert vt(van_xay=8)["tang"][0]["vat"][0]["sao"] == vt(nam_xay=2010)["tang"][0]["vat"][0]["sao"]
