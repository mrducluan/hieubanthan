# -*- coding: utf-8 -*-
"""VT-1 — "Đứng giữa nhà, chĩa điện thoại": phép tính số độ → vị trí (viết TRƯỚC hàm, golden tính tay)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.calc import phongthuy as pt
from app.calc import vi_tri_vat as vt
from app.main import app

client = TestClient(app)


# ───────── trung bình góc vòng ─────────
def test_trung_binh_goc_qua_0():
    m, lech = vt.trung_binh_goc([358.0, 2.0, 0.0])
    assert m == pytest.approx(0.0, abs=1e-6)
    assert lech < 2.5


def test_trung_binh_goc_mot_mau():
    m, lech = vt.trung_binh_goc([123.4])
    assert m == pytest.approx(123.4) and lech == 0.0


def test_trung_binh_goc_dao_dong_manh_bi_danh_dau():
    _, lech = vt.trung_binh_goc([10, 40, 70, 100])
    assert lech > vt.NGUONG_DAO_DONG


def test_trung_binh_goc_rong_loi():
    with pytest.raises(ValueError):
        vt.trung_binh_goc([])


# ───────── sửa lệch theo trục nhà ─────────
@pytest.mark.parametrize("huong, truc, lech", [
    (180.0, 188.0, 8.0),     # đo dọc tường lệch +8° so với trục
    (180.0, 92.0, 2.0),      # tường ngang: trục 90/270 → lệch +2°
    (10.0, 355.0, -15.0),    # vòng qua 0
    (45.0, 45.0, 0.0),
])
def test_lech_truc(huong, truc, lech):
    assert vt.lech_truc(truc, huong) == pytest.approx(lech)


def test_lech_truc_bien_45_ve_duong():
    assert vt.lech_truc(45.0, 0.0) == pytest.approx(45.0)


def test_sua_do():
    assert vt.sua_do(200.0, 8.0) == pytest.approx(192.0)
    assert vt.sua_do(3.0, 8.0) == pytest.approx(355.0)


# ───────── khung tỉ lệ (máy tính) ─────────
def test_khung_diem_phia_truoc_la_huong_nha():
    # nhà 4 × 20 m hướng Nam (180°): điểm sát mặt trước, giữa bề ngang → đúng hướng nhà
    assert vt.do_tu_khung(4, 20, 0.5, 0.0, 180.0) == pytest.approx(180.0)


def test_khung_diem_phia_sau_la_toa():
    assert vt.do_tu_khung(4, 20, 0.5, 1.0, 180.0) == pytest.approx(0.0)


def test_khung_dung_ti_le_that():
    # nhà ống 4 × 20, hướng Bắc (0°). Bếp ở góc phải phía sau (x=1, y=1): lệch (2 m phải, 10 m sau) → gần chính sau (180°)
    d = vt.do_tu_khung(4, 20, 1.0, 1.0, 0.0)
    assert 160 < d < 180          # nghiêng phải-sau ~ 168,7°
    # cùng điểm nếu coi nhà vuông 3×3 → 135° (Đông Nam): lưới 3×3 ước lượng sai một phương
    assert pt.huong_tu_do(d) == "Nam"


def test_khung_luoi_chu_l_doi_tam():
    # nhà 10 × 10, khuyết góc trước-phải: trọng tâm dịch về sau-trái → điểm chính giữa nhìn từ tâm lệch về trước-phải
    luoi = ["1100", "1111", "1111", "1111"]
    d = vt.do_tu_khung(10, 10, 0.5, 0.5, 0.0, luoi)
    assert 0 < d < 90


def test_khung_diem_trung_tam_loi():
    with pytest.raises(ValueError):
        vt.do_tu_khung(10, 10, 0.5, 0.5, 0.0)


# ───────── vị trí một vật ─────────
def test_vi_tri_canh_ranh():
    v = vt.vi_tri(179.0)
    assert v["phuong"] == "Nam" and v["quai"] == "Ly" and v["son"] == "Ngọ"
    assert v["sat_ranh_8"] is None
    w = vt.vi_tri(158.0)               # ranh Nam / Đông Nam ở 157,5°
    assert w["phuong"] == "Nam" and w["sat_ranh_8"] == "Đông Nam"
    assert vt.vi_tri(22.6)["sat_ranh_8"] == "Bắc"


# ───────── route ─────────
def _goi(**kw):
    return client.post("/v1/phongthuy/vi-tri-vat", json=kw)


def test_route_mot_tang_ba_cap_mot_bo_tinh():
    r = _goi(huong_nha_do=180.0, tang=[{"so": 1, "vat": [
        {"loai": "cua_chinh", "mau": [181.0, 179.0]},
        {"loai": "phong_ngu_chinh", "mau": [5.0]},
        {"loai": "bep", "mau": [240.0]},
    ]}])
    assert r.status_code == 200, r.text
    d = r.json()
    t1 = d["tang"][0]
    ph = {v["loai"]: v["phuong"] for v in t1["vat"]}
    assert ph == {"cua_chinh": "Nam", "phong_ngu_chinh": "Bắc", "bep": "Tây Nam"}
    goc = pt.cua_chu_bep("Nam", "Bắc", "Tây Nam")
    assert [c["du_nien"] for c in t1["tam_yeu"]["cap"]] == [c["du_nien"] for c in goc["cap"]]
    assert d["luu_y_tham_khao"]


def test_route_sua_lech_truc():
    r = _goi(huong_nha_do=180.0, truc_do=190.0, tang=[{"so": 1, "vat": [{"loai": "bep", "mau": [168.0]}]}]).json()
    assert r["lech"]["do"] == pytest.approx(10.0)
    v = r["tang"][0]["vat"][0]
    assert v["do"] == pytest.approx(158.0) and v["do_do"] == pytest.approx(168.0)


def test_route_lech_lon_bao_canh():
    r = _goi(huong_nha_do=180.0, truc_do=210.0, tang=[{"so": 1, "vat": [{"loai": "bep", "mau": [100.0]}]}]).json()
    assert r["lech"]["nhieu_manh"] is True
    assert r["lech"]["ap_dung"] is False         # lệch > ngưỡng: không tự sửa, báo đo lại


def test_route_dao_dong_bao_do_lai():
    r = _goi(tang=[{"so": 1, "vat": [{"loai": "bep", "mau": [10, 60, 110]}]}]).json()
    assert r["tang"][0]["vat"][0]["chua_on_dinh"] is True


def test_route_tang_tren_lay_dau_cau_thang_lam_cua():
    r = _goi(huong_nha_do=0.0, tang=[
        {"so": 1, "vat": [{"loai": "cua_chinh", "mau": [0.0]}]},
        {"so": 2, "vat": [{"loai": "cau_thang", "mau": [90.0]}, {"loai": "phong_ngu_chinh", "mau": [270.0]}]},
    ]).json()
    t2 = r["tang"][1]
    assert t2["cua_tang"] == "cau_thang"
    assert t2["tam_yeu"]["huong"]["cua"] == "Đông" and t2["tam_yeu"]["huong"]["chu"] == "Tây"
    assert t2["tam_yeu"]["cap"][0]["ten"] == "Đầu cầu thang với phòng chính"
    assert r["tang"][0].get("tam_yeu") is None and r["tang"][0]["chua_du"]


def test_route_khung_ti_le():
    r = _goi(huong_nha_do=0.0, khung={"rong": 4, "sau": 20}, tang=[{"so": 1, "vat": [
        {"loai": "bep", "diem": [1.0, 1.0]}]}]).json()
    assert r["tang"][0]["vat"][0]["phuong"] == "Nam"
    assert r["tang"][0]["vat"][0]["nguon"] == "khung"


def test_route_khung_can_huong_nha():
    assert _goi(khung={"rong": 4, "sau": 20}, tang=[{"so": 1, "vat": [{"loai": "bep", "diem": [1, 1]}]}]).status_code == 422


def test_route_huyen_khong_sao_tung_vat():
    r = _goi(huong_nha_do=180.0, nam_xay=2010, tang=[{"so": 1, "vat": [{"loai": "bep", "mau": [90.0]}]}]).json()
    v = r["tang"][0]["vat"][0]
    from app.calc import huyen_khong as hk
    ban = hk.trach_ban(2010, pt.do_huong(180.0)["son_toa"])
    o = next(c for c in ban["cung"] if c["phuong"] == "Đông")
    assert v["sao"] == {"van": o["van"], "son": o["son"], "huong": o["huong"]}
    assert r["huyen_khong"]["van"] == ban["van"]


def test_route_menh_quai_du_nien():
    r = _goi(huong_nha_do=180.0, sinh={"birth_date": "1990-05-17", "gender": "nam"},
             tang=[{"so": 1, "vat": [{"loai": "phong_ngu_chinh", "mau": [0.0]}]}]).json()
    v = r["tang"][0]["vat"][0]
    assert v["du_nien_menh"]["du_nien"] == pt.bang_huong("Khảm")["Bắc"]


def test_route_tu_choi_vat_khong_co_do():
    assert _goi(tang=[{"so": 1, "vat": [{"loai": "bep"}]}]).status_code == 422


def test_route_ban_anh_khong_chu_viet():
    import re
    r = client.post("/v1/phongthuy/vi-tri-vat?ngon_ngu=en", json={"huong_nha_do": 180.0, "truc_do": 190.0, "tang": [
        {"so": 1, "vat": [{"loai": "cua_chinh", "mau": [180]}, {"loai": "bep", "mau": [158.0]}]}]}).json()
    viet = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)
    chu = [r["lech"]["loi"]] + [c for t in r["tang"] for v in t["vat"] for c in v.get("canh_bao", [])]
    for c in chu:
        assert not viet.search(c), c


def test_route_truc_mau_trung_binh():
    r = _goi(huong_nha_do=180.0, truc_mau=[189.0, 191.0], tang=[{"so": 1, "vat": [{"loai": "bep", "mau": [168.0]}]}]).json()
    assert r["lech"]["do"] == pytest.approx(10.0)
