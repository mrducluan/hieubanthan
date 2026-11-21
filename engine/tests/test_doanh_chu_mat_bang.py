# -*- coding: utf-8 -*-
"""Mặt bằng & Khai trương (POST /v1/doanh-chu/mat-bang). Rà soát PR #329 (2026-11-21): mỗi lỗi đã sửa có một ca khoá."""
from __future__ import annotations

import datetime as dt
import re

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import huyen_khong as hk
from app.calc import phongthuy as pt
from app.luangiai import doanh_chu_mat_bang as mb
from app.luangiai import hoang_lich as hl
from app.main import app

_VIET = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.IGNORECASE)
D0 = dt.date(2026, 6, 1)


def _kq(do=180.0, nam_xay=2024, ngay=15, thang=8, nam=1986, gt="nam", loai="cua_hang", tu=D0):
    return mb.kiem_tra_mat_bang(do, nam_xay, ngay, thang, nam, gt, loai, tu)


def _khu(kq, ma):
    return next(k for k in kq["danh_sach_khu_vuc"] if k["ma"] == ma)


def _chuoi(o, bo: set[str]):
    if isinstance(o, dict):
        for k, v in o.items():
            if k not in bo:
                yield from _chuoi(v, bo)
    elif isinstance(o, list):
        for v in o:
            yield from _chuoi(v, bo)
    elif isinstance(o, str):
        yield o


def test_tat_dinh_du_5_khu_va_hai_chieu():
    a, b = _kq(), _kq()
    assert a == b
    assert [k["ma"] for k in a["danh_sach_khu_vuc"]] == ["thu_ngan", "giam_doc", "cua_chinh", "phong_hop", "khu_tinh"]
    for k in a["danh_sach_khu_vuc"]:
        assert k["thuan_loi"] and k["nen_chu_y"] and k["can_cu"]
    m = a["mat_bang"]
    assert (m["phuong_huong"], m["son_huong"], m["son_toa"]) == ("Nam", "Ngọ", "Tý")
    assert m["canh_bao_kiem_huong"] is None and m["co_phi_tinh"] is True


def test_menh_quai_theo_lap_xuan():
    """Lỗi 1: nam sinh 20/01/1986 (trước Lập xuân) là Càn, không phải Khôn."""
    kq = _kq(ngay=20, thang=1)
    assert kq["mat_bang"]["menh_quai"] == pt.menh_quai(1986, "nam", dt.date(1986, 1, 20))["quai"] == "Càn"


def test_kiem_huong_lap_the_quai_trung_cong_cu_phong_thuy():
    """Lỗi 2: lệch > 3° → bàn thế quái, đúng bàn của /v1/phongthuy/huyen-khong (độ TOẠ = độ hướng + 180)."""
    kq = _kq(do=200.0, nam_xay=2010)
    m = kq["mat_bang"]
    assert m["canh_bao_ma"] == "kiem_huong" and m["phep"] == "the_quai"
    assert "kiêm hướng" in m["canh_bao_kiem_huong"] and "ranh giới" not in m["canh_bao_kiem_huong"]
    r = TestClient(app).post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2010, "do": 20.0}).json()
    tb = hk.trach_ban(2010, hk.son_tu_do(20.0)["son"], the_quai=True)
    assert {c["cung"]: (c["son"], c["huong"]) for c in r["cung"]} == {c["cung"]: (c["son"], c["huong"]) for c in tb["cung"]}
    assert "thế quái" in _khu(kq, "thu_ngan")["can_cu"]


def test_khong_vong_canh_bao_rieng():
    kq = _kq(do=22.5)
    assert kq["mat_bang"]["canh_bao_ma"] == "khong_vong"
    assert "ranh giới" in kq["mat_bang"]["canh_bao_kiem_huong"]


def test_khong_ro_nam_xay_khong_lap_ban():
    """Lỗi 3: không rõ năm xây → không đoán vận, gợi ý theo Bát trạch + sao năm."""
    kq = _kq(nam_xay=None)
    m = kq["mat_bang"]
    assert m["co_phi_tinh"] is False and m["van"] is None and m["khong_ro_nam_xay"]
    for ma in ("thu_ngan", "giam_doc", "phong_hop"):
        assert "Bát trạch" in _khu(kq, ma)["can_cu"]
    assert "Vận" not in kq["tong_quan"]


def test_nam_sao_luu_nien_doi_o_lap_xuan():
    """Lỗi 4: 15/01/2027 vẫn là năm phong thuỷ 2026, sang 10/02/2027 mới là 2027."""
    truoc, sau = _kq(tu=dt.date(2027, 1, 15)), _kq(tu=dt.date(2027, 2, 10))
    assert truoc["mat_bang"]["nam_xem"] == 2026 and sau["mat_bang"]["nam_xem"] == 2027
    assert "2026" in _khu(truoc, "khu_tinh")["ten"]


def test_mac_dinh_ngay_theo_gio_viet_nam(monkeypatch):
    monkeypatch.setattr(mb, "hom_nay_vn", lambda: dt.date(2027, 1, 15))
    assert mb.kiem_tra_mat_bang(180.0, 2024, 15, 8, 1986)["mat_bang"]["nam_xem"] == 2026


def test_ba_khu_khong_trung_phia():
    """Lỗi 6: quầy thu ngân, chỗ chủ ngồi, phòng họp luôn ở ba phía khác nhau."""
    for do in range(0, 360, 15):
        for nx in (None, 1995, 2010, 2024):
            kq = _kq(do=float(do), nam_xay=nx)
            p = [_khu(kq, m)["phuong_ma"] for m in ("thu_ngan", "giam_doc", "phong_hop")]
            assert len(set(p)) == 3, (do, nx, p)
            tinh = set(_khu(kq, "khu_tinh")["phuong_ma"].split(", "))
            assert not tinh & set(p), (do, nx, p, tinh)       # không đặt quầy / chỗ chủ / phòng họp vào khu nên giữ yên


def test_sao_8_khong_duoc_coi_la_vuong_o_van_9():
    assert hk.trang_thai(8, 9) == "thoái" and mb._HANG_SAO["thoái"] < mb._HANG_SAO["sinh"]


def test_cua_xau_co_loi_bu_khong_khen():
    """Lỗi 5: cửa rơi vào phía kém của mệnh chủ → 'Nên chú ý' + cách bù, không lời khen."""
    bh = pt.bang_huong(pt.menh_quai(1986, "nam", dt.date(1986, 8, 15))["quai"])
    xau = 0
    for do in range(0, 360, 45):
        c = _khu(_kq(do=float(do), nam_xay=2010), "cua_chinh")
        if bh[pt.huong_tu_do(do)] not in mb.DU_NIEN_TOT:
            xau += 1
            assert "chưa hợp" in c["nen_chu_y"] and "Nên chú ý" in c["nen_chu_y"] and "đục" in c["nen_chu_y"]
            assert "hợp mệnh" not in c["thuan_loi"]
    assert xau == 4


def test_ngay_khai_truong_tu_chon_ngay_theo_thoi_gian():
    """Lỗi 7: ngày lấy từ chon_ngay (hợp việc, không xung tuổi), hiện theo thời gian, kèm điểm cộng + giờ Kỳ Môn."""
    ds = _kq()["ngay_khai_truong"]
    goc = {x["ngay"] for x in hl.chon_ngay("khai_truong", D0, D0 + dt.timedelta(days=60), 1986, 8, 15)["ngay"]}
    assert 1 <= len(ds) <= 5
    assert [x["ngay"] for x in ds] == sorted(x["ngay"] for x in ds)
    assert all(x["ngay"] in goc and x["quan_he_tuoi"] != "xung" for x in ds)
    assert all("diem_cong" in x and "gio_ky_mon" in x for x in ds) and any(x["gio_ky_mon"] for x in ds)
    sach = [x for x in ds if not x["ky_dan_gian"] and not x["luu_y_ngay"]]
    assert sach, "phải ưu tiên được ngày sạch kiêng dân gian khi có"


def test_ban_anh_khong_chu_viet():
    bo = {"can_chi", "truc", "luu_y_ngay", "ky_dan_gian", "diem_cong", "son_toa", "son_huong", "phuong_ma", "quan_he_tuoi", "am"}
    with ngon_ngu.dung("en"):
        for nx in (2024, None):
            for do in (200.0, 22.5, 135.0):
                kq = _kq(do=do, nam_xay=nx, gt="nu", loai="van_phong")
                ro = [s for s in _chuoi(kq, bo) if _VIET.search(s)]
                assert ro == [], ro[:3]


def test_loi_khong_cum_cam_giong_ai():
    from app.kb.tuvi_doi_song_kb import tim_cum_cam  # noqa: PLC0415
    from app.luangiai.doi_song_khuon import cum_cam_chung  # noqa: PLC0415
    for nx in (2024, None):
        for s in _chuoi(_kq(nam_xay=nx), set()):
            assert not tim_cum_cam(s, cum_cam_chung()), s


def test_api_http_nam_xay_tuy_chon_va_422():
    c = TestClient(app)
    base = {"do_huong": 180.0, "ngay_sinh": 15, "thang_sinh": 8, "nam_sinh": 1986, "gioi_tinh": "nam", "loai_hinh": "quan_ca_phe"}
    r = c.post("/v1/doanh-chu/mat-bang", json={**base, "nam_xay": 2024})
    assert r.status_code == 200, r.text
    assert r.json()["khong_luu_du_lieu"] is True and r.json()["mat_bang"]["co_phi_tinh"] is True
    r = c.post("/v1/doanh-chu/mat-bang", json=base)
    assert r.status_code == 200 and r.json()["mat_bang"]["co_phi_tinh"] is False
    assert c.post("/v1/doanh-chu/mat-bang", json={**base, "do_huong": 400.0}).status_code == 422
    assert c.post("/v1/doanh-chu/mat-bang", json={**base, "ngay_sinh": 31, "thang_sinh": 2}).status_code == 422
