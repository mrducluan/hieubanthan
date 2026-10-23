# -*- coding: utf-8 -*-
"""SEO-M — câu "Trả lời nhanh" (trả lời trước, ≤ ~80 từ) cho trang ngày, tháng, tuổi làm nhà, xông đất, hướng xấu năm.
Dựng từ đúng các trường engine đã tính (không phép tính mới); trang tháng thêm tóm tắt + ngày tốt theo 6 việc + hỏi đáp."""
import datetime as dt
import re

from fastapi.testclient import TestClient

from app.luangiai import hoang_lich as HL
from app.luangiai import tuoi_dan_gian as TD
from app.main import app

client = TestClient(app)
_so_tu = lambda s: len(s.split())  # noqa: E731


def test_ngay_xem_tra_loi_nhanh():
    d = HL.ngay_xem(dt.date(2026, 12, 17))
    tl = d["tra_loi_nhanh"]
    assert "17/12/2026" in tl and d["am"]["chu"] in tl and d["can_chi"]["ngay"] in tl
    assert ("hoàng đạo" if d["hoang_dao"] else "hắc đạo") in tl
    assert f"trực {d['truc']['ten']}" in tl
    assert d["xung_tuoi"]["ten"] in tl
    assert _so_tu(tl) <= 90


def test_ngay_xem_ky_dan_gian_neu_co():
    # 2026-12-01: Nguyệt Kỵ + Dương Công kỵ nhật (bảng tháng) → câu trả lời phải nêu.
    d = HL.ngay_xem(dt.date(2026, 12, 1))
    assert d["ky_dan_gian"]
    for k in d["ky_dan_gian"]:
        assert k["ten"] in d["tra_loi_nhanh"]


def test_thang_tom_tat_theo_viec_hoi_dap():
    t = HL.thang(2026, 12)
    dep = [n for n in t["ngay"] if n["dep"]]
    assert len(t["ngay"]) == 31
    assert f"{len(dep)} ngày" in t["tra_loi_nhanh"]
    assert t["tom_tat"]["so_hoang_dao"] == sum(n["hoang_dao"] for n in t["ngay"])
    assert t["tom_tat"]["so_dep"] == len(dep)
    # ngày vướng kiêng dân gian: gom theo tên, đúng ngày
    for k in t["tom_tat"]["ky_dan_gian"]:
        assert k["ngay"] == [n["ngay"] for n in t["ngay"] if k["ten"] in n["ky_dan_gian"]]
    # 6 việc, số ngày = đúng chon_ngay cả tháng; "đẹp nhất" không vướng kiêng dân gian
    assert [v["viec"]["ma"] for v in t["theo_viec"]] == [v["ma"] for v in HL.VIEC_SEO]
    for v in t["theo_viec"]:
        kq = HL.chon_ngay(v["viec"]["ma"], dt.date(2026, 12, 1), dt.date(2026, 12, 31))
        assert v["so_ngay"] == len(kq["ngay"])
        assert v["dep_nhat"] is None or not v["dep_nhat"]["ky_dan_gian"]
    assert len(t["hoi_dap"]) >= 3 and all(h["hoi"] and h["dap"] for h in t["hoi_dap"])
    assert "âm lịch" in t["thang_am"]


def test_lam_nha_tra_loi_nhanh():
    d = TD.xem_tuoi_lam_nha(1990, 2027)
    tl = d["tra_loi_nhanh"]
    assert tl.startswith(d["ket_luan"]["chu"])
    assert d["can_chi"] in tl
    if d["ket_luan"]["ma"] != "thuan" and d["nam_thuan"]:
        assert str(d["nam_thuan"][0]["nam"]) in tl
    assert _so_tu(tl) <= 90


def test_xong_dat_tra_loi_nhanh():
    d = TD.xong_dat_luan(2027, 1990)
    tl = d["tra_loi_nhanh"]
    for x in d["tuoi_hop"][:3]:
        assert f"{x['nam_sinh']} ({x['can_chi']})" in tl
    assert "Tết" in tl and _so_tu(tl) <= 90


def test_han_nam_tra_loi_nhanh_hoi_dap():
    d = TD.han_nam_luan(2027)
    tl = d["tra_loi_nhanh"]
    for h in d["huong_tranh"]:
        assert h["phuong"] in tl
    assert d["can_chi"] in tl
    assert len(d["hoi_dap"]) >= 3


def test_api_tra_ve_tra_loi_nhanh():
    for u in ("/v1/lich/ngay-tot/2026-12-17", "/v1/lich/thang/2026/12", "/v1/tuoi/lam-nha/2027/1990",
              "/v1/tuoi/xong-dat/2027/1990", "/v1/tuoi/han-nam/2027"):
        r = client.get(u)
        assert r.status_code == 200, u
        assert r.json()["tra_loi_nhanh"], u
        assert not re.search(r"Hồ Ngọc Đức|lunar|iztro", r.text), u
