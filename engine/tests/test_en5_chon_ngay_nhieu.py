# -*- coding: utf-8 -*-
"""EN-5.1 — chọn ngày theo NHIỀU người (viết TRƯỚC `luangiai/chon_ngay_nhieu.py`).

Luật (tất định, chỉ ghép CALC/KB có sẵn — không bảng mới chưa có nguồn):
- ngày phải "tốt" cho việc theo sách lịch (đúng `hoang_lich._danh_gia_viec`) và KHÔNG xung tuổi bất kỳ ai;
- cưới hỏi: năm âm cô dâu phạm Kim lâu (tuổi mụ) → ngày trong năm đó vẫn hiện nhưng gắn lưu ý + xếp sau;
- tháng tiết xung tuổi người chính (cô dâu, chú rể, chủ) → lưu ý + xếp sau; người phụ (bố mẹ…) chỉ xét ngày xung;
- trả theo 12 tháng dương: số ngày hợp, 3 ngày đầu, lưu ý theo từng người; không điểm số.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import hoang_lich as hl
from app.calc import tuoi_dan_gian as t
from app.luangiai import chon_ngay_nhieu as cn
from app.luangiai import hoang_lich as L

TU = dt.date(2027, 1, 1)
DEN = dt.date(2027, 12, 31)
CUOI = [{"vai": "co_dau", "nam_sinh": 1998}, {"vai": "chu_re", "nam_sinh": 1996},
        {"vai": "bo_co_dau", "nam_sinh": 1970}, {"vai": "me_chu_re", "nam_sinh": 1972}]


@pytest.fixture(scope="module")
def kq():
    return cn.chon("cuoi_hoi", TU, DEN, CUOI)


def test_ngay_tot_cho_viec_va_khong_xung_ai(kq):
    chi = {x["vai"]: L.tuoi(x["nam_sinh"])["han"] for x in CUOI}
    assert kq["ngay"], "phải có ngày"
    for n in kq["ngay"]:
        d = dt.date.fromisoformat(n["ngay"])
        c = L._calc(d)
        assert L._danh_gia_viec(c, L._VIEC["cuoi_hoi"]) == "tot"
        for v, ch in chi.items():
            assert hl.quan_he_tuoi(c["ngay_gz"][1], ch) != "xung", (n["ngay"], v)


def test_khong_bo_sot_ngay_hop_le():
    """Mọi ngày tốt không xung ai đều có trong danh sách (không âm thầm cắt)."""
    k = cn.chon("cuoi_hoi", dt.date(2027, 3, 1), dt.date(2027, 3, 31), CUOI)
    chi = [L.tuoi(x["nam_sinh"])["han"] for x in CUOI]
    mong = []
    d = dt.date(2027, 3, 1)
    while d <= dt.date(2027, 3, 31):
        c = L._calc(d)
        if L._danh_gia_viec(c, L._VIEC["cuoi_hoi"]) == "tot" and all(hl.quan_he_tuoi(c["ngay_gz"][1], x) != "xung" for x in chi):
            mong.append(d.isoformat())
        d += dt.timedelta(days=1)
    assert sorted(n["ngay"] for n in k["ngay"]) == mong


def test_it_nguoi_hon_thi_nhieu_ngay_hon():
    mot = cn.chon("cuoi_hoi", TU, DEN, CUOI[:1])
    assert len(mot["ngay"]) >= len(cn.chon("cuoi_hoi", TU, DEN, CUOI)["ngay"])


def test_kim_lau_co_dau_gan_luu_y():
    # cô dâu sinh 2000: tuổi mụ năm âm 2027 = 28 → 28 % 9 = 1 → Kim lâu Thân
    assert t.kim_lau(t.tuoi_mu(2000, 2027))
    k = cn.chon("cuoi_hoi", dt.date(2027, 3, 1), dt.date(2027, 6, 30), [{"vai": "co_dau", "nam_sinh": 2000}])
    assert k["nguoi"][0]["nam"], "phải nêu năm phạm"
    assert any("Kim lâu" in x for x in k["nguoi"][0]["nam"][0]["luu_y"])
    assert all(any("Kim lâu" in y for y in n["luu_y"]) for n in k["ngay"])
    # chú rể không xét Kim lâu (chủ dự án chốt: theo tuổi cô dâu)
    k2 = cn.chon("cuoi_hoi", dt.date(2027, 3, 1), dt.date(2027, 6, 30), [{"vai": "chu_re", "nam_sinh": 2000}])
    assert not any("Kim lâu" in y for n in k2["ngay"] for y in n["luu_y"])


def test_xep_ngay_khong_luu_y_truoc(kq):
    co = [bool(n["luu_y"]) for n in kq["ngay_noi_bat"]]
    assert co == sorted(co), "ngày không vướng lưu ý đứng trước"


def test_thang_xung_tuoi_nguoi_chinh():
    """Tháng tiết có chi xung chi tuổi cô dâu → mọi ngày trong tháng đó mang lưu ý tháng xung."""
    k = cn.chon("cuoi_hoi", TU, DEN, [{"vai": "co_dau", "nam_sinh": 1998}])   # Dần → xung tháng Thân
    for n in k["ngay"]:
        chi_thang = hl.gz_thang(dt.date.fromisoformat(n["ngay"]))[1]
        xung = hl.quan_he_tuoi(chi_thang, L.tuoi(1998)["han"]) == "xung"
        assert xung == any(y.startswith("tháng") and "xung tuổi cô dâu" in y for y in n["luu_y"]), n["ngay"]
    assert all(g["loi"].endswith(".") for g in k["giai_thich"])


def test_nguoi_phu_khong_xet_thang():
    k = cn.chon("cuoi_hoi", TU, DEN, [{"vai": "co_dau", "nam_sinh": 1999}, {"vai": "bo_co_dau", "nam_sinh": 1968}])
    assert not any("bố cô dâu" in y for n in k["ngay"] for y in n["luu_y"])


def test_mười_hai_thang(kq):
    assert [m["thang"] for m in kq["thang"]] == [f"2027-{i:02d}" for i in range(1, 13)]
    for m in kq["thang"]:
        assert m["so_ngay"] == sum(n["ngay"].startswith(m["thang"]) for n in kq["ngay"])
        assert len(m["ngay"]) <= 3
        assert [n["ngay"] for n in m["ngay"]] == sorted(n["ngay"] for n in m["ngay"])


def test_hop_tung_nguoi(kq):
    for n in kq["ngay"]:
        for h in n["hop"]:
            assert h["vai"] in {x["vai"] for x in CUOI}
            assert h["quan_he"] in ("tam_hop", "luc_hop")


def test_dong_tho_xet_tuoi_lam_nha_cua_chu():
    k = cn.chon("dong_tho", TU, DEN, [{"vai": "chu", "nam_sinh": 1990}])
    # 1990: tuổi mụ 2027 = 38 → Hoang ốc? Kim lâu 38%9=2 không. Chỉ kiểm có khối nam với kết luận tuổi làm nhà
    assert k["nguoi"][0]["nam"] and "tuoi_mu" in k["nguoi"][0]["nam"][0]


def test_khong_diem_so_khong_tu_doa(kq):
    import json
    s = json.dumps(kq, ensure_ascii=False).lower()
    for c in ("điểm", "/100", "đại kỵ", "tai hoạ", "chết", "khắc chết", "phá sản"):
        assert c not in s, c


def test_gioi_han_dau_vao():
    with pytest.raises(ValueError):
        cn.chon("cuoi_hoi", TU, DEN, [])
    with pytest.raises(ValueError):
        cn.chon("cuoi_hoi", TU, DEN, [{"vai": "co_dau", "nam_sinh": 1990}] * 9)
    with pytest.raises(ValueError):
        cn.chon("cuoi_hoi", TU, TU + dt.timedelta(days=500), CUOI)


def test_api():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).post("/v1/lich/chon-ngay-nhieu", json={"viec": "cuoi_hoi", "tu": "2027-01-01", "den": "2027-03-31",
                                                               "nguoi": CUOI})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["ngay"] and j["thang"] and j["tom_tat"]
    r = TestClient(app).post("/v1/lich/chon-ngay-nhieu", json={"viec": "cuoi_hoi", "tu": "2027-01-01", "den": "2027-03-31",
                                                               "nguoi": [{"vai": "la", "nam_sinh": 1990}]})
    assert r.status_code == 422


def test_goi_y_nam_khong_vuong():
    k = cn.chon("cuoi_hoi", dt.date(2026, 11, 1), dt.date(2027, 10, 31), [{"vai": "co_dau", "nam_sinh": 2000}])
    assert k["goi_y"] and "2026" in k["goi_y"][0] and "2027" in k["goi_y"][0]
    k = cn.chon("cuoi_hoi", dt.date(2027, 3, 1), dt.date(2027, 6, 30), [{"vai": "co_dau", "nam_sinh": 2000}])
    assert k["goi_y"] == []
