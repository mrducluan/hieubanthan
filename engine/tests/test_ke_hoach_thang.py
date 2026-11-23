# -*- coding: utf-8 -*-
"""KH-1 — "Việc bạn định làm: tháng nào hợp" (RULES, tất định). Viết TRƯỚC hàm.

Khoá: một bộ tính (tháng cá nhân = calc.thanso_mo_rong, ngày = hoang_lich.chon_ngay, Tử vi / Bát tự = đúng hàm tháng của
Thời gian tới); không điểm số; tháng xung tuổi không bao giờ "Hợp nhất"; ngày gợi ý không xung tuổi, không kiêng dân gian,
không ở quá khứ; Kim lâu chỉ xét cô dâu; không doạ, không cụm giọng AI."""
from __future__ import annotations

import datetime as dt
import json
import re

import pytest
from fastapi.testclient import TestClient

from app.calc import thanso_mo_rong as mr
from app.luangiai import hoang_lich as hl
from app.luangiai import ke_hoach_thang as K
from app.main import app

NS = dt.date(1990, 5, 17)
HOM_NAY = dt.date(2026, 11, 23)
LS = {"birth_date": "1990-05-17", "birth_time": "11:30", "gender": "nam", "noi_sinh": "ha-noi"}
CAM = re.compile(r"chắc chắn|sẽ (thất bại|mất|phá sản|ly hôn|bị)|đại kỵ|tai hoạ|xui xẻo|điểm \d|/100", re.I)


def test_danh_muc_viec_co_dinh():
    ds = K.danh_muc()
    assert [x["ma"] for x in ds] == list(K.KB["viec"])
    assert all(x["ten"] and x["cau_hoi"] for x in ds)
    # mỗi số hợp phải là số 1–9 có trong thanso_ban_do.thang_hop, việc lịch phải có trong hoang_lich
    for ma, v in K.KB["viec"].items():
        assert v["viec_lich"] in hl._VIEC, ma
        assert set(v["so_hop"]) <= {str(i) for i in range(1, 10)}, ma


def test_12_thang_bat_dau_tu_thang_nay_va_thang_ca_nhan_mot_nguon():
    kq = K.lap("doi_viec", NS, HOM_NAY)
    assert len(kq["thang"]) == 12
    assert kq["thang"][0]["thang"] == "11/2026" and kq["thang"][-1]["thang"] == "10/2027"
    for x in kq["thang"]:
        m, y = (int(p) for p in x["thang"].split("/"))
        assert x["so"] == mr.thang_ca_nhan(NS.day, NS.month, y, m)


def test_khong_diem_so_va_quy_tac_dem_lop():
    for ma in K.KB["viec"]:
        kq = K.lap(ma, NS, HOM_NAY)
        for x in kq["thang"]:
            assert set(x) >= {"thang", "so", "nhip", "nhan_nhip", "dau", "cham", "ngay"}
            assert "diem" not in x
            d, c = len(x["dau"]), len(x["cham"])
            assert x["nhip"] == ("thuan" if d >= 2 and not c else "duoc" if d and not c else "can_nhac" if d and c
                                 else "cham" if c else "binh")


def test_thang_xung_tuoi_khong_bao_gio_hop_nhat():
    for ma in K.KB["viec"]:
        for x in K.lap(ma, NS, HOM_NAY)["thang"]:
            if any("xung tuổi" in c for c in x["cham"]):
                assert x["nhip"] in ("can_nhac", "cham")


def test_ngay_goi_y_dung_chon_ngay_khong_qua_khu_khong_kieng():
    kq = K.lap("khoi_su", NS, HOM_NAY)
    for x in kq["thang"]:
        m, y = (int(p) for p in x["thang"].split("/"))
        tu = max(dt.date(y, m, 1), HOM_NAY)
        den = dt.date(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(days=1)
        hop = {n["ngay"] for n in hl.chon_ngay("khai_truong", tu, den, NS.year, NS.month, NS.day)["ngay"] if not n["ky_dan_gian"]}
        assert len(x["ngay"]) <= 3
        for n in x["ngay"]:
            assert n["ngay"] in hop and n["ngay"] >= HOM_NAY.isoformat()
        assert x["so_ngay"] == len(hop)


def test_thang_tot_nhat_lay_tu_thang_hop_nhat_roi_moi_den_thang_duoc():
    kq = K.lap("ky_ket", NS, HOM_NAY)
    thuan = [x["thang"] for x in kq["thang"] if x["nhip"] == "thuan"]
    duoc = [x["thang"] for x in kq["thang"] if x["nhip"] == "duoc"]
    tot = [x["thang"] for x in kq["tot_nhat"]]
    assert len(tot) <= 3
    if thuan:
        assert set(tot) <= set(thuan)
    else:
        assert set(tot) <= set(duoc)
    assert kq["tra_loi"]


def test_kim_lau_chi_xet_co_dau():
    nu = K.lap("cuoi_hoi", dt.date(1999, 3, 2), HOM_NAY, gioi_tinh="nu")
    nam = K.lap("cuoi_hoi", dt.date(1999, 3, 2), HOM_NAY, gioi_tinh="nam")
    khong = K.lap("cuoi_hoi", dt.date(1999, 3, 2), HOM_NAY)
    assert any("tuổi mụ" in x for x in nu["nam_luu_y"])
    assert not re.search(r"Kim lâu (Thân|Thê|Tử|Lục súc)", " ".join(nu["nam_luu_y"]))   # NAM-2: chỉ ghi "Kim lâu"
    assert nam["nam_luu_y"] == [K.KB["nam"]["kim_lau_nam"]]
    assert khong["nam_luu_y"] == [K.KB["nam"]["kim_lau_thieu"]]
    assert K.lap("doi_viec", NS, HOM_NAY)["nam_luu_y"] == []


def test_lam_nha_dung_ham_tuoi_lam_nha():
    kq = K.lap("xay_nha", NS, HOM_NAY)
    assert kq["nam_luu_y"] and all("tuổi mụ" in x for x in kq["nam_luu_y"])


def test_co_la_so_them_lop_tu_vi_bat_tu():
    from app.tuvi_api import TuanTrietInput
    sinh = K.sinh_tu_la_so(TuanTrietInput(**LS))
    kq = K.lap("doi_viec", NS, HOM_NAY, gioi_tinh="nam", **sinh)
    assert kq["thieu"] == []
    loai = {d for x in kq["thang"] for d in x["dau"] + x["cham"]}
    assert any(s.startswith(("Tử vi", "Bát tự")) for s in loai)
    assert K.lap("doi_viec", NS, HOM_NAY)["thieu"] == ["gio_sinh"]


def test_loi_khong_doa_khong_giong_ai():
    from app.kb.tuvi_doi_song_kb import tim_cum_cam  # noqa: PLC0415
    from app.luangiai.doi_song_khuon import cum_cam_chung  # noqa: PLC0415 — một danh sách cụm "giọng AI" cho mọi mảng
    for ma in K.KB["viec"]:
        s = json.dumps(K.lap(ma, NS, HOM_NAY, gioi_tinh="nu"), ensure_ascii=False)
        assert not CAM.search(s), ma
        assert not tim_cum_cam(s, cum_cam_chung()), ma


def test_route():
    c = TestClient(app)
    r = c.post("/v1/thoi-gian-toi/ke-hoach", json={"ke_hoach": "mua_nha", "ngay_sinh": "1990-05-17", "ngay_xem": "2026-11-23"})
    assert r.status_code == 200
    j = r.json()
    assert j["ke_hoach"]["ma"] == "mua_nha" and len(j["thang"]) == 12
    assert "1990" not in json.dumps(j)                                     # đầu ra không mang ngày sinh
    assert c.post("/v1/thoi-gian-toi/ke-hoach", json={"ke_hoach": "x", "ngay_sinh": "1990-05-17"}).status_code == 422
    assert c.get("/v1/thoi-gian-toi/ke-hoach").json()["viec"][0]["ma"] == "doi_viec"
    r = c.post("/v1/thoi-gian-toi/ke-hoach", json={"ke_hoach": "doi_viec", "ngay_sinh": "1990-05-17", "la_so": LS,
                                                  "ngay_xem": "2026-11-23"})
    assert r.status_code == 200 and r.json()["thieu"] == []


@pytest.mark.parametrize("ma", list(K.KB["viec"]))
def test_moi_viec_tra_loi_mot_cau_ro(ma):
    kq = K.lap(ma, NS, HOM_NAY)
    assert kq["tra_loi"].startswith(K.KB["viec"][ma]["ten"])
