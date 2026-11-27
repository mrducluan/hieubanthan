# -*- coding: utf-8 -*-
"""TP-1 (chủ dự án duyệt 2026-11-27) — Tứ Ly theo sách (sửa lỗi), Dương Công kỵ hai phái, sổ trường phái dùng chung,
`diem_khac` của các phản hồi lịch."""
from __future__ import annotations

import datetime as dt
import json
import re
import typing
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import truong_phai as tp
from app.calc import hoang_lich as hl, lunar, tietkhi
from app.calc import trach_nhat_hiep_ky as tnhk
from app.kb import sach_ghi
from app.luangiai import hoang_lich as L
from app.main import app

C = TestClient(app)
NGUON = Path(__file__).parents[1] / "fixtures" / "nguon"
KB = Path(__file__).parents[1] / "app" / "kb" / "data"
VIET = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)


def _ngay_tiet_vn(nam: int, goc: int) -> dt.date:
    return (tietkhi.thoi_diem(nam, goc) + dt.timedelta(hours=7)).date()


# ---- Tứ Ly: một ngày trước Xuân phân, Hạ chí, Thu phân, Đông chí (giờ Việt Nam) ------------------------------------
def test_tu_ly_dung_dinh_nghia_sach_2020_2025():
    mong = {_ngay_tiet_vn(n, g) - dt.timedelta(days=1) for n in range(2020, 2026) for g in (0, 90, 180, 270)}
    d, thay = dt.date(2020, 1, 1), set()
    while d < dt.date(2026, 1, 1):
        if "四离" in hl.ngay(d)["hung_sat"]:
            thay.add(d)
        d += dt.timedelta(days=1)
    assert thay == mong and len(thay) == 24


def test_tu_ly_va_tu_tuyet_mot_ham_chung():
    d = dt.date(2024, 1, 1)
    for _ in range(366 * 2):
        assert tnhk.la_tu_ly_theo_sach(d) == hl.la_tu_ly(d) == ("四离" in hl.ngay(d)["hung_sat"])
        assert tnhk.la_tu_tuyet(d) == hl.la_tu_tuyet(d)
        r = tnhk.phan_tich_ngay_hiep_ky(d)
        assert r["tu_ly"] == r["tu_ly_theo_sach"]
        d += dt.timedelta(days=1)
    # Lập xuân 2025 là tối 03/02 giờ VN → Tứ Tuyệt 02/02.
    assert hl.la_tu_tuyet(dt.date(2025, 2, 2)) and not hl.la_tu_tuyet(dt.date(2025, 2, 3))


def test_tu_ly_cau_sach_la_nguyen_van():
    raw = sach_ghi.chuan(json.dumps(json.loads((NGUON / "hiep_ky_bien_phuong_thu_du_bo.json").read_text("utf-8")),
                                    ensure_ascii=False))
    assert sach_ghi.chuan("四離冬至夏至春分秋分各前一日") in raw


# ---- Dương Công kỵ: lich_viet (8/7 + tháng nhuận) | hiep_ky (1/7, không tháng nhuận) -------------------------------
def test_duong_cong_hai_phai_calc():
    assert hl.la_duong_cong(8, 7) and not hl.la_duong_cong(1, 7)
    assert hl.la_duong_cong(1, 7, duong_cong="hiep_ky") and not hl.la_duong_cong(8, 7, duong_cong="hiep_ky")
    assert hl.la_duong_cong(29, 7, duong_cong="hiep_ky")
    assert hl.la_duong_cong(7, 4, nhuan=True)                       # lịch Việt: tháng nhuận cũng kiêng
    assert not hl.la_duong_cong(7, 4, nhuan=True, duong_cong="hiep_ky")
    assert len(hl.DUONG_CONG_HIEP_KY) == len(hl.DUONG_CONG) == 13
    with pytest.raises(ValueError):
        hl.la_duong_cong(1, 1, duong_cong="xyz")


def test_duong_cong_cau_sach_la_nguyen_van():
    so = tp.so()
    trich = [x["nguon"]["trich"] for d in so["diem"] for x in d["lua_chon"] if x["nguon"].get("trich")]
    raw = (NGUON / "hiep_ky_bien_phuong_thu_du_bo.json").read_text("utf-8")
    raw = json.loads(raw)
    van = "".join(t.get("van", "") for t in raw.get("thien", [])) if isinstance(raw.get("thien"), list) else json.dumps(raw, ensure_ascii=False)
    for t in trich:
        assert sach_ghi.chuan(t) in sach_ghi.chuan(van), t
    assert trich


def test_mac_dinh_khong_doi_va_ngu_canh():
    d1, d8 = dt.date(2025, 8, 23), dt.date(2025, 8, 30)            # mùng 1 và mùng 8 tháng 7 âm 2025
    assert L.tom_tat(d8)["ky_dan_gian"] and not L.tom_tat(d1)["ky_dan_gian"]
    with tp.dung(duong_cong="hiep_ky"):
        assert L.tom_tat(d1)["ky_dan_gian"] == ["Dương Công kỵ nhật"]
        assert not L.tom_tat(d8)["ky_dan_gian"]
        assert tnhk.phan_tich_ngay_hiep_ky(d1, duong_cong="hiep_ky")["duong_cong_ky"]
    # sau khối: bộ nhớ đệm không rò
    assert not L.tom_tat(d1)["ky_dan_gian"] and L.tom_tat(d8)["ky_dan_gian"]
    # tháng nhuận 2025 (tháng 6 nhuận): 3/6 nhuận = 27/07/2025
    nhuan = dt.date(2025, 7, 27)
    assert lunar.solar_to_lunar(27, 7, 2025, 7)[3] == 1
    assert "Dương Công kỵ nhật" in L.tom_tat(nhuan)["ky_dan_gian"]
    with tp.dung(duong_cong="hiep_ky"):
        assert "Dương Công kỵ nhật" not in L.tom_tat(nhuan)["ky_dan_gian"]


def test_api_duong_cong_query_header_va_422():
    a = C.get("/v1/lich/ngay-tot/2025-08-23").json()
    b = C.get("/v1/lich/ngay-tot/2025-08-23?duong_cong=hiep_ky").json()
    h = C.get("/v1/lich/ngay-tot/2025-08-23", headers={"x-duong-cong": "hiep_ky"}).json()
    assert not a["ky_dan_gian"] and [x["ma"] for x in b["ky_dan_gian"]] == ["duong_cong"] and h["ky_dan_gian"] == b["ky_dan_gian"]
    assert C.get("/v1/lich/ngay-tot/2025-08-23?duong_cong=lich_viet").json() == a
    r = C.get("/v1/lich/ngay-tot/2025-08-23?duong_cong=xyz")
    assert r.status_code == 422
    assert C.post("/v1/lich/chon-ngay?duong_cong=xyz", json={"viec": "cuoi_hoi", "tu": "2025-08-01", "den": "2025-08-31"}).status_code == 422
    # chọn ngày, tháng, nhiều người, năm âm, Hiệp Kỷ: mọi lối vào đều đổi theo phái
    def ky_ngay(j, ngay):
        return next(x for x in j["ngay"] if x["ngay"] == ngay)["ky_dan_gian"]
    t0 = C.get("/v1/lich/thang/2025/8").json()
    t1 = C.get("/v1/lich/thang/2025/8?duong_cong=hiep_ky").json()
    assert not ky_ngay(t0, "2025-08-23") and ky_ngay(t1, "2025-08-23")
    hk = C.post("/v1/lich/hiep-ky-doi-chieu?duong_cong=hiep_ky", json={"tu_ngay": "2025-08-23", "so_ngay": 1}).json()
    hk0 = C.post("/v1/lich/hiep-ky-doi-chieu", json={"tu_ngay": "2025-08-23", "so_ngay": 1}).json()
    assert hk["ngay_phan_tich"][0]["luu_y_hiep_ky"] != hk0["ngay_phan_tich"][0]["luu_y_hiep_ky"]


# ---- Sổ trường phái --------------------------------------------------------------------------------------------------
def test_so_moi_diem_mot_mac_dinh_va_co_nguon():
    so = tp.so()
    ma = [d["ma"] for d in so["diem"]]
    assert len(ma) == len(set(ma))
    for d in so["diem"]:
        assert d["source_id"] and d["school_id"], d["ma"]
        assert sum(bool(x.get("mac_dinh")) for x in d["lua_chon"]) == 1, d["ma"]
        assert len(d["lua_chon"]) >= 2, d["ma"]
        for x in d["lua_chon"]:
            assert x["source_id"] and x["school_id"] and x["nguon"]["sach"] and x["ten"] and x["mo_ta"], (d["ma"], x["ma"])


def _literal(model, truong):
    ann = model.model_fields[truong].annotation
    for a in (typing.get_args(ann) or (ann,)):
        if typing.get_origin(a) is typing.Literal:
            return set(typing.get_args(a))
    if typing.get_origin(ann) is typing.Literal:
        return set(typing.get_args(ann))
    raise AssertionError((model, truong, ann))


def test_so_khop_gia_tri_cua_route():
    """Sổ phải liệt kê đúng giá trị mỗi route nhận — thêm phái ở route mà quên sổ (hoặc ngược lại) là test đỏ."""
    from app import chi_tay_api, kinhdich_api, ky_mon_api, main, phongthuy_api, tuvi_api
    bang = {
        "tuvi.lich": (tuvi_api.TuanTrietInput, "lich"), "tuvi.hoa_linh": (tuvi_api.TuanTrietInput, "hoa_linh"),
        "tuvi.thang_nhuan": (tuvi_api.TuanTrietInput, "thang_nhuan"), "tuvi.luu_nguyet": (tuvi_api.TuanTrietInput, "luu_nguyet"),
        "tuvi.gio_sinh": (tuvi_api.TuanTrietInput, "gio_sinh"), "tuvi.truong_phai": (tuvi_api.TuanTrietInput, "truong_phai"),
        "battu.gio_ty": (tuvi_api.TuanTrietInput, "gio_ty"), "battu.dieu_hau": (tuvi_api.TuanTrietInput, "dieu_hau"),
        "battu.gio_sinh": (tuvi_api.TuanTrietInput, "gio_sinh"), "phongthuy.moc_nam": (phongthuy_api.SinhInput, "moc_nam"),
        "thanso.quy_uoc_duong_doi": (main.ThanSoInput, "quy_uoc_duong_doi"),
        "kymon.phep": (ky_mon_api._Chung, "phep"), "kymon.gio_ty": (ky_mon_api._Chung, "gio_ty"),  # noqa: SLF001
        "kinhdich.truong_phai": (kinhdich_api.KhoiQueInput, "truong_phai"), "chitay.phai": (chi_tay_api.DocIn, "phai"),
    }
    for ma, (model, truong) in bang.items():
        assert set(tp.gia_tri(ma)) == _literal(model, truong), ma
        d = tp.diem(ma)
        md = d.get("mac_dinh_api", tp.mac_dinh(ma))
        if not model.model_fields[truong].is_required():
            assert model.model_fields[truong].default == md, ma
    # thần số: route nhận pitago/chaldea/tong_hop; Phillips là route riêng → sổ có thêm "phillips"
    assert set(tp.gia_tri("thanso.phai")) == _literal(main.HoiInput, "phai") | {"phillips"}
    assert set(tp.gia_tri("duong_cong")) == set(hl.DUONG_CONG_PHAI)
    assert tp.mac_dinh("duong_cong") == "lich_viet"


def test_route_truong_phai_va_ban_anh():
    j = C.get("/v1/truong-phai").json()
    assert {d["ma"] for d in j["diem"]} == {d["ma"] for d in tp.so()["diem"]}
    assert "source_id" not in json.dumps(j)
    j2 = C.get("/v1/truong-phai?mon=lich").json()
    assert [d["ma"] for d in j2["diem"]] == ["duong_cong"]
    assert C.get("/v1/truong-phai?mon=xyz").status_code == 422
    en = C.get("/v1/truong-phai", headers={"x-ngon-ngu": "en"}).json()
    assert not VIET.search(json.dumps(en, ensure_ascii=False))
    assert [d["ma"] for d in en["diem"]] == [d["ma"] for d in j["diem"]]


def test_kiem_gia_tri():
    assert tp.kiem("duong_cong", None) == "lich_viet"
    assert tp.kiem("duong_cong", "hiep_ky") == "hiep_ky"
    with pytest.raises(ValueError):
        tp.kiem("duong_cong", "x")


# ---- Đợt 3: diem_khac ------------------------------------------------------------------------------------------------
def test_diem_khac_ngay_va_khoang():
    j = C.get("/v1/lich/ngay-tot/2025-08-23").json()
    assert j["diem_khac"][0]["ma"] == "duong_cong" and j["diem_khac"][0]["khac"] == "hiep_ky"
    assert not j["diem_khac"][0]["co_kieng"]
    j8 = C.get("/v1/lich/ngay-tot/2025-08-30").json()
    assert j8["diem_khac"][0]["co_kieng"]
    jh = C.get("/v1/lich/ngay-tot/2025-08-30?duong_cong=hiep_ky").json()
    assert jh["diem_khac"][0]["khac"] == "lich_viet" and not jh["diem_khac"][0]["co_kieng"]
    assert "diem_khac" not in C.get("/v1/lich/ngay-tot/2025-08-20").json()      # hai phái như nhau → không có khoá
    cn = C.post("/v1/lich/chon-ngay", json={"viec": "dong_tho", "tu": "2025-08-01", "den": "2025-09-15"}).json()
    assert cn["diem_khac"][0]["them"] == ["2025-08-30"] and cn["diem_khac"][0]["bot"] == ["2025-08-23"]
    # theo phái kia thật: danh sách đổi đúng như diem_khac báo
    cnh = C.post("/v1/lich/chon-ngay?duong_cong=hiep_ky", json={"viec": "dong_tho", "tu": "2025-08-01", "den": "2025-09-15"}).json()
    assert {x["ngay"] for x in cnh["ngay"]} == ({x["ngay"] for x in cn["ngay"]} | {"2025-08-30"}) - {"2025-08-23"}
    assert cnh["diem_khac"][0]["them"] == ["2025-08-23"] and cnh["diem_khac"][0]["bot"] == ["2025-08-30"]
    en = C.get("/v1/lich/ngay-tot/2025-08-23", headers={"x-ngon-ngu": "en"}).json()
    assert not VIET.search(en["diem_khac"][0]["loi"] + en["diem_khac"][0]["nut"])


def test_diem_khac_nhieu_nguoi():
    body = {"viec": "dong_tho", "tu": "2025-08-01", "den": "2025-09-15", "nguoi": [{"vai": "nguoi_khac", "nam_sinh": 1990}]}
    a = C.post("/v1/lich/chon-ngay-nhieu", json=body).json()
    b = C.post("/v1/lich/chon-ngay-nhieu?duong_cong=hiep_ky", json=body).json()
    sa, sb = {x["ngay"] for x in a["ngay"]}, {x["ngay"] for x in b["ngay"]}
    dk = a.get("diem_khac", [{}])[0]
    assert sb == (sa | set(dk.get("them", []))) - set(dk.get("bot", []))
