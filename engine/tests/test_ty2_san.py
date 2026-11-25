# -*- coding: utf-8 -*-
"""TY-2 gói 2 — sân / giếng trời trên sơ đồ tỉ lệ: engine tự đếm lớp, tìm dãy nhà chính và đo Cửa – Chủ – Bếp theo
TỪNG SÂN như sách dặn (Dương Trạch Tam Yếu đoạn 23: la bàn đặt giữa sân trong cổng lấy cửa, sân nhà chính lấy chủ, sân bếp
lấy bếp; đoạn 160–161 «各具一太極»)."""
import pytest

from app.calc import mat_bang_khung as mk
from app.calc import phongthuy_lop as pl
from app.calc import vi_tri_vat as vt
from app.luangiai import phongthuy_vi_tri as vtr

# Nhà ống 6 × 20 m hướng Nam: cổng + dãy trước, sân 1, dãy giữa (bếp), sân 2, dãy sau (nhà chính).
SAN = [(0.30, 0.40), (0.65, 0.75)]


def test_khoi_lop_tu_san():
    assert mk.khoi_lop([]) == [(0.0, 1.0)]
    assert mk.khoi_lop(SAN) == [(0.0, 0.30), (0.40, 0.65), (0.75, 1.0)]
    assert mk.lop_cua((0.5, 0.02), SAN) == 1 and mk.lop_cua((0.5, 0.5), SAN) == 2 and mk.lop_cua((0.5, 0.9), SAN) == 3
    assert mk.lop_cua((0.5, 0.35), SAN) is None          # đứng giữa sân: không thuộc dãy nào


@pytest.mark.parametrize("xau", [[(0.5, 0.4)], [(0.2, 0.4), (0.3, 0.5)], [(-0.1, 0.2)], [(0.0, 1.0)]])
def test_san_khong_hop_le(xau):
    with pytest.raises(ValueError):
        mk.khoi_lop(xau)


def test_do_tu_tam_rieng():
    """Đo từ tâm bất kỳ: tâm nhà → trùng `do_tu_khung`; tâm sân phía trước điểm → điểm ở phía sau."""
    assert vt.do_tu_tam(6, 20, (0.5, 0.5), 0.9, 0.1, 180) == vt.do_tu_khung(6, 20, 0.9, 0.1, 180)
    assert pl_phuong(vt.do_tu_tam(6, 20, (0.5, 0.70), 0.5, 0.9, 180)) == "Bắc"


def pl_phuong(do):
    from app.calc import phongthuy as pt
    return pt.huong_tu_do(do)


def test_theo_san_ra_dung_vi_du_sach():
    """Cổng phía trước, nhà chính dãy sau: đo theo sân → cửa Ly, chủ Khảm — đúng ví dụ sách «離門坎主… 三層動宅»
    (Diên Niên, Lục Sát, Sinh Khí)."""
    r = vtr.phan_tich([{"so": 1, "vat": [{"loai": "cua_chinh", "diem": [0.5, 0.02]}, {"loai": "phong_ngu_chinh", "diem": [0.5, 0.88]},
                                          {"loai": "bep", "diem": [0.15, 0.55]}]}],
                      180.0, None, {"rong": 6, "sau": 20, "san": SAN})
    ts = r["tang"][0]["theo_san"]
    assert ts["so_lop"] == 3 and ts["lop_chu"] == 3
    assert ts["quai"] == {"cua": "Ly", "chu": "Khảm", "bep": ts["quai"]["bep"]}
    assert [x["du_nien"] for x in ts["nhieu_lop"]["lop"]] == ["Diên Niên", "Lục Sát", "Sinh Khí"]
    assert ts["tam_yeu"]["cap"][0]["du_nien"] == "Diên Niên"
    assert ts["san_do"]["cua"] == 1 and ts["san_do"]["chu"] == 2


def test_khong_san_khong_co_theo_san():
    r = vtr.phan_tich([{"so": 1, "vat": [{"loai": "cua_chinh", "diem": [0.5, 0.02]}, {"loai": "bep", "diem": [0.2, 0.8]}]}],
                      180.0, None, {"rong": 6, "sau": 20})
    assert "theo_san" not in r["tang"][0]


def test_route_nhan_san():
    from fastapi.testclient import TestClient

    from app.main import app
    c = TestClient(app)
    yc = {"huong_nha_do": 180, "khung": {"rong": 6, "sau": 20, "san": [[0.3, 0.4], [0.65, 0.75]]},
          "tang": [{"so": 1, "vat": [{"loai": "cua_chinh", "diem": [0.5, 0.02]}, {"loai": "phong_ngu_chinh", "diem": [0.5, 0.88]}]}]}
    r = c.post("/v1/phongthuy/vi-tri-vat", json=yc)
    assert r.status_code == 200, r.text
    assert r.json()["tang"][0]["theo_san"]["so_lop"] == 3
    xau = {**yc, "khung": {**yc["khung"], "san": [[0.4, 0.3]]}}
    assert c.post("/v1/phongthuy/vi-tri-vat", json=xau).status_code == 422


def test_nha_cua_ban_co_hop_nhieu_lop_khong_doi_muc():
    import datetime as dt

    from fastapi.testclient import TestClient

    from app.main import app
    c = TestClient(app)
    nha = {"huong": "Nam", "bo_cuc": {"vi_tri": {"cua_chinh": "Nam", "phong_ngu_chinh": "Bắc", "bep": "Đông"}}}
    yc = {"sinh": {"birth_year": 1985, "gender": "nam"}, "nha": {**nha, "nhieu_lop": {"so_lop": 3, "lop_chu": 3}}, "ngay_xem": "2026-11-25"}
    r = c.post("/v1/phongthuy/luan-giai", json=yc)
    assert r.status_code == 200, r.text
    goc = c.post("/v1/phongthuy/luan-giai", json={**yc, "nha": nha}).json()
    tp = lambda d: next(x for x in d["chuong"] if x["ma"] == "tung_phong")  # noqa: E731
    assert "Động trạch (3 lớp)" in [h["tieu_de"] for h in tp(r.json())["hop"]]
    assert [x.get("muc") for x in r.json()["chuong"]] == [x.get("muc") for x in goc["chuong"]]
    del dt


@pytest.mark.parametrize("nl", [None, {"so_lop": 3, "lop_chu": 3}])
def test_chuong_tung_phong_khong_trung_hop_ccb(nl):
    """Hồi quy: chen hộp nhà nhiều lớp từng làm `elif xau` rơi khỏi `if h_ty` → hộp "chưa cùng nhịp" xuất hiện hai lần."""
    import datetime as dt

    from app.luangiai import phongthuy_doi_song as ds
    nha = {"huong": "Nam", "bo_cuc": {"vi_tri": {"cua_chinh": "Nam", "phong_ngu_chinh": "Tây", "bep": "Đông Bắc"}}}
    if nl:
        nha["nhieu_lop"] = nl
    r = ds.luan_giai({"nam": 1985, "gioi_tinh": "nam"}, nha, ngay_xem=dt.date(2026, 11, 25))
    td = [h["tieu_de"] for h in next(c for c in r["chuong"] if c["ma"] == "tung_phong")["hop"]]
    assert len(td) == len(set(td)), td
