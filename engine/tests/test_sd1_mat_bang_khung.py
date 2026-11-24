# -*- coding: utf-8 -*-
"""SD-1 — dấu hiệu GỢI Ý từ sơ đồ nhà theo tỉ lệ: tính ở engine (trước đây web tự suy, kể cả từ hướng cửa máy tự điền)."""
from fastapi.testclient import TestClient

from app.calc import mat_bang, mat_bang_khung as mk
from app.luangiai.phongthuy_bo_cuc import DAU_HIEU
from app.main import app

client = TestClient(app)
R, S = 5.0, 15.0


def _ma(vat, luoi=None):
    return [x["ma"] for x in mk.goi_y_dau_hieu(vat, R, S, luoi)]


def test_wc_giua_nha_va_cau_thang_giua_nha():
    assert _ma([{"loai": "ve_sinh", "diem": (0.5, 0.5)}]) == ["wc_giua_nha"]
    assert _ma([{"loai": "ve_sinh", "diem": (0.9, 0.9)}]) == []
    assert _ma([{"loai": "cau_thang", "diem": (0.5, 0.45)}]) == ["cau_thang_giua_nha"]


def test_trung_cung_theo_khung_bao_phan_co_xay():
    luoi = ["1100", "1100", "1111", "1111"]
    o = mat_bang.doc_luoi(luoi)
    for d in [(0.5, 0.5), (0.4, 0.6), (0.2, 0.2), (0.7, 0.4)]:
        assert mk.trong_trung_cung(d, luoi) == mat_bang.trong_trung_cung(o, d[1] * 4, d[0] * 4)


def test_khuyet_goc_cung_nguong_voi_mat_bang_ve_tay():
    # bỏ 1 ô góc của lưới 4×4 chưa phải khuyết góc (ô Cửu cung còn phủ ≥ 40 %); bỏ cả góc 2×2 mới là khuyết
    assert _ma([], ["1110", "1111", "1111", "1111"]) == []
    assert _ma([], ["1100", "1100", "1111", "1111"]) == ["nha_chu_l"]
    assert _ma([], ["1111"] * 4) == []


def test_khong_suy_tu_gia_tri_may_tu_dien():
    # hai phòng đối nhau nhưng người dùng CHƯA chỉnh hướng cửa / kích thước → không có gợi ý nào
    vat = [{"loai": "phong_ngu_chinh", "diem": (0.2, 0.5)}, {"loai": "bep", "diem": (0.8, 0.5)}]
    assert _ma(vat) == []
    # chỉ một phòng có hướng cửa → vẫn không
    vat[0].update(kich_thuoc=(1.5, 3), huong_cua="phai")
    assert _ma(vat) == []


def test_cua_doi_nhau_khi_nguoi_dung_dat_huong_cua():
    vat = [{"loai": "phong_ngu_chinh", "diem": (0.2, 0.3), "kich_thuoc": (1.6, 3), "huong_cua": "phai"},
           {"loai": "bep", "diem": (0.8, 0.3), "kich_thuoc": (1.6, 3), "huong_cua": "trai"}]
    assert _ma(vat) == ["cua_doi_nhau"]
    vat[1]["huong_cua"] = "sau"
    assert _ma(vat) == []
    vat[1].update(huong_cua="trai", diem=(0.8, 0.8))          # lệch hẳn theo chiều sâu
    assert _ma(vat) == []


def test_bep_doi_cua_va_bep_wc():
    cua = {"loai": "cua_chinh", "diem": (0.5, 0.0)}
    bep = {"loai": "bep", "diem": (0.5, 0.6), "kich_thuoc": (2.4, 2.6), "huong_cua": "truoc"}
    assert _ma([cua, bep]) == ["bep_doi_cua"]
    assert _ma([cua, {**bep, "huong_cua": "sau"}]) == []
    assert _ma([{**cua, "diem": (0.05, 0.0)}, bep]) == []        # cửa chính lệch hẳn sang bên
    wc = {"loai": "ve_sinh", "diem": (0.82, 0.9), "kich_thuoc": (1.6, 2.0)}
    bep2 = {"loai": "bep", "diem": (0.3, 0.9), "kich_thuoc": (3.2, 2.0)}
    assert "bep_wc" in _ma([bep2, wc])
    assert "bep_wc" not in _ma([{**bep2, "diem": (0.3, 0.2)}, wc])


def test_moi_ma_goi_y_deu_co_trong_danh_muc():
    vat = [{"loai": "ve_sinh", "diem": (0.5, 0.5), "kich_thuoc": (1.6, 2), "huong_cua": "trai"},
           {"loai": "bep", "diem": (0.15, 0.5), "kich_thuoc": (1.4, 2), "huong_cua": "phai"},
           {"loai": "cua_chinh", "diem": (0.9, 0.5)}, {"loai": "cau_thang", "diem": (0.5, 0.4)}]
    ds = _ma(vat, ["1100", "1100", "1111", "1111"])
    assert ds and all(m in DAU_HIEU for m in ds)


def test_tam_khung_khop_tam_dung_de_tinh_phuong():
    assert mk.tam_khung(None) == (0.5, 0.5)
    x, y = mk.tam_khung(["1100", "1100", "1111", "1111"])
    assert x < 0.5 and y > 0.5


def test_route_vi_tri_vat_tra_goi_y_va_tam():
    yc = {"huong_nha_do": 180, "khung": {"rong": 5, "sau": 15},
          "tang": [{"so": 1, "vat": [{"loai": "cua_chinh", "diem": [0.5, 0.0]}, {"loai": "ve_sinh", "diem": [0.45, 0.45]},
                                     {"loai": "bep", "diem": [0.5, 0.7], "kich_thuoc": [2.4, 2.6], "huong_cua": "truoc"}]}]}
    r = client.post("/v1/phongthuy/vi-tri-vat", json=yc)
    assert r.status_code == 200, r.text
    d = r.json()
    gy = {x["ma"]: x for x in d["dau_hieu_goi_y"]}
    assert set(gy) == {"wc_giua_nha", "bep_doi_cua"}
    assert gy["wc_giua_nha"]["hoi"] and gy["wc_giua_nha"]["tang"] == 1 and gy["wc_giua_nha"]["nen_xu_ly_truoc"] is True
    assert d["khung"]["tam"] == [0.5, 0.5]
    # la bàn (không khung) → không có khoá mới: đầu ra cũ không đổi
    cu = client.post("/v1/phongthuy/vi-tri-vat", json={"tang": [{"so": 1, "vat": [{"loai": "bep", "mau": [90]}]}]}).json()
    assert "dau_hieu_goi_y" not in cu and "khung" not in cu
    # kích thước / hướng cửa chỉ đi với điểm trên khung
    xau = {"tang": [{"so": 1, "vat": [{"loai": "bep", "mau": [90], "huong_cua": "truoc"}]}]}
    assert client.post("/v1/phongthuy/vi-tri-vat", json=xau).status_code == 422
