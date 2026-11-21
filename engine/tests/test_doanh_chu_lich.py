# -*- coding: utf-8 -*-
"""Lịch quyết định 12 tháng (POST /v1/doanh-chu/lich-12-thang). Rà soát PR #328 (2026-11-21): mỗi lỗi đã sửa có một ca khoá."""
from __future__ import annotations

import datetime as dt
import re

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.luangiai import battu_doi_song as bt
from app.luangiai import doanh_chu_lich as lich
from app.luangiai import hoang_lich as hl
from app.main import app

_VIET = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.IGNORECASE)
HN = dt.date(2026, 11, 21)


def _kq(gio="09:30", muc="tang_truong", cap="chu_dn", tu=HN, nam_xem=None):
    return lich.lich_quyet_dinh_12_thang(15, 8, 1986, "nam", gio, cap, muc, nam_xem=nam_xem, tu=tu)


def _chuoi(o, bo):
    if isinstance(o, dict):
        for k, v in o.items():
            if k not in bo:
                yield from _chuoi(v, bo)
    elif isinstance(o, list):
        for v in o:
            yield from _chuoi(v, bo)
    elif isinstance(o, str):
        yield o


def test_tat_dinh_12_thang_ke_tu_thang_hien_tai():
    """Lỗi: lịch cũ là tháng 1–12 cố định của nam_xem (tháng đã qua vẫn hiện, nhãn năm sai khi vắt năm)."""
    a, b = _kq(), _kq()
    assert a == b
    ds = a["muoi_hai_thang"]
    assert [(t["nam"], t["thang"]) for t in ds][:3] == [(2026, 11), (2026, 12), (2027, 1)]
    assert len(ds) == 12 and ds[-1]["nhan_thang"] == "T10/2027"
    for t in ds:
        assert t["nhip_thang"] in ("day_manh", "can_bang", "phong_thu")
        assert t["nen_lam"] and t["nen_chu_y"] and t["tom_lai"] and t["lop"]
        assert all(x["ngay"] >= HN.isoformat() for x in t["ngay_dep"])          # không gợi ngày đã qua
        assert all(x["ngay"].startswith(f"{t['nam']}-{t['thang']:02d}-") for x in t["ngay_dep"])
    assert _kq(nam_xem=2028)["muoi_hai_thang"][0]["nhan_thang"] == "T1/2028"


def test_bat_tu_hai_cach_dung_than_mot_bo_tinh():
    """Lỗi: bản cũ dùng một cách dụng thần + giờ giả 12:00. Nay mức Bát tự = `muc_thang` (hai cách) như Thời gian tới."""
    kq = _kq()
    ptb = bt.phan_tich(bt._la_so({"lich": dt.datetime(1986, 8, 15, 9, 30), "gioi_tinh": "nam"}))
    for t in kq["muoi_hai_thang"]:
        th = bt.ba_thang_tiet(ptb, dt.date(t["nam"], t["thang"], 15), so=1)[0]
        muc = bt.muc_thang(ptb, th["can"], th["chi"])[2]
        lop = next(x for x in t["lop"] if x["ma"] == "battu")
        assert th["can"] in lop["tieu"] and {"thuan": "thuan", "can_chu_dong": "can_bang"}.get(muc, "trung") == lop["loai"]
    assert set(kq["ho_so_nguoi_xem"]["dung_than_hai_cach"]) == {"cach_1", "cach_2"}


def test_khong_gio_khong_doc_bat_tu():
    kq = _kq(gio=None)
    assert kq["ho_so_nguoi_xem"]["co_gio"] is False and kq["ho_so_nguoi_xem"]["thieu_gio"]
    assert all(x["ma"] != "battu" for t in kq["muoi_hai_thang"] for x in t["lop"])


def test_ngay_tot_tu_chon_ngay_khong_xung():
    for muc, viec in (("ra_mat", "khai_truong"), ("ky_ket", "ky_ket")):
        for t in _kq(muc=muc)["muoi_hai_thang"][:4]:
            den = dt.date(t["nam"] + (t["thang"] == 12), t["thang"] % 12 + 1, 1) - dt.timedelta(days=1)
            goc = {x["ngay"] for x in hl.chon_ngay(viec, max(dt.date(t["nam"], t["thang"], 1), HN), den, 1986, 8, 15)["ngay"]}
            assert all(x["ngay"] in goc and x["quan_he_tuoi"] != "xung" for x in t["ngay_dep"])
            assert [x["ngay"] for x in t["ngay_dep"]] == sorted(x["ngay"] for x in t["ngay_dep"])


def test_nhip_khong_lech_mot_phia():
    from collections import Counter  # noqa: PLC0415
    c = Counter()
    for y in range(1960, 2004, 2):
        k = lich.lich_quyet_dinh_12_thang(10, y % 12 + 1, y, "nu", "08:00", tu=HN)
        c.update(t["nhip_thang"] for t in k["muoi_hai_thang"])
    tong = sum(c.values())
    # Cùng luật đếm lớp với "Thời gian tới": "đẩy mạnh" / "giữ nhịp" chỉ khi ≥ 2 lớp cùng chiều và không lớp ngược,
    # nên phần lớn tháng là "cân bằng"; "giữ nhịp" hiếm nhưng phải có (tháng xung tuổi + Bát tự cần lưu ý).
    assert 0.08 <= c["day_manh"] / tong <= 0.5 and c["can_bang"] / tong <= 0.9 and c["phong_thu"] >= 1, c


def test_nhip_khop_cau_tom_lai():
    """Nhãn nhịp và câu "Tóm lại" không bao giờ nói ngược nhau (rà soát #328)."""
    for y in range(1960, 2004, 3):
        for gio in ("08:00", None):
            for t in lich.lich_quyet_dinh_12_thang(10, y % 12 + 1, y, "nam", gio, tu=HN)["muoi_hai_thang"]:
                if t["nhip_thang"] == "day_manh":
                    assert "tháng thuận" in t["tom_lai"], t["tom_lai"]
                elif t["nhip_thang"] == "phong_thu":
                    assert "đi chậm" in t["tom_lai"], t["tom_lai"]
                else:
                    assert "tháng thuận —" not in t["tom_lai"] and "đi chậm một nhịp —" not in t["tom_lai"], t["tom_lai"]


def test_cap_quan_ly_va_muc_tieu_doi_loi():
    a = _kq(cap="truong_nhom")["muoi_hai_thang"][0]["nen_lam"]
    b = _kq(cap="giam_doc")["muoi_hai_thang"][0]["nen_lam"]
    assert a != b


def test_ban_anh_khong_chu_viet():
    bo = {"can_chi", "luu_y_ngay", "ky_dan_gian", "quan_he_tuoi", "am"}
    with ngon_ngu.dung("en"):
        for gio in ("09:30", None):
            kq = _kq(gio=gio, muc="ky_ket", cap="giam_doc")
            ro = [s for s in _chuoi(kq, bo) if _VIET.search(s)]
            assert ro == [], ro[:3]


def test_loi_khong_cum_cam():
    from app.kb.tuvi_doi_song_kb import tim_cum_cam  # noqa: PLC0415
    from app.luangiai.doi_song_khuon import cum_cam_chung  # noqa: PLC0415
    for s in _chuoi(_kq(), set()):
        assert not tim_cum_cam(s, cum_cam_chung()), s


def test_api_http_va_422():
    c = TestClient(app)
    base = {"ngay": 15, "thang": 8, "nam": 1986, "gioi_tinh": "nam", "cap_quan_ly": "truong_nhom", "muc_tieu": "ra_mat"}
    r = c.post("/v1/doanh-chu/lich-12-thang", json={**base, "gio": "09:30"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["khong_luu_du_lieu"] is True and d["muc_tieu"]["ma"] == "ra_mat" and len(d["muoi_hai_thang"]) == 12
    assert c.post("/v1/doanh-chu/lich-12-thang", json=base).status_code == 200
    assert c.post("/v1/doanh-chu/lich-12-thang", json={**base, "gio": "25:00"}).status_code == 422
    assert c.post("/v1/doanh-chu/lich-12-thang", json={**base, "ngay": 31, "thang": 2}).status_code == 422
