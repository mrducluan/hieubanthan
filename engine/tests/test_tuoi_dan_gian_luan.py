# -*- coding: utf-8 -*-
"""TDG-1 — tầng ghép: xem tuổi làm nhà/cưới, hướng xấu năm, tuổi xông đất. Không lời doạ, không chữ nội bộ."""
import json

from fastapi.testclient import TestClient

from app.luangiai import tuoi_dan_gian as L
from app.main import app

client = TestClient(app)
CAM = ("đại hung", "chết", "tai hoạ", "tai họa", "xui xẻo", "giải hạn", "mất mạng", "bệnh nặng", "vật phẩm")


def _sach(o):
    s = json.dumps(o, ensure_ascii=False).lower()
    assert not any(c in s for c in CAM), [c for c in CAM if c in s]


def test_lam_nha_1990_nam_2026():
    kq = L.xem_tuoi_lam_nha(1990, 2026)
    assert kq["tuoi_mu"] == 37 and kq["can_chi"] == "Canh Ngọ"
    assert kq["kim_lau"]["ma"] == "than" and kq["hoang_oc"]["ten"] == "Tứ Tấn Tài"
    assert kq["tam_tai"] is None and kq["ket_luan"]["ma"] == "can_nhac"
    assert kq["nam_thuan"] and all(n["nam"] > 2026 for n in kq["nam_thuan"])
    assert {x["ma"]: x["phuong"] for x in kq["han_nam"]["huong_tranh"]}["ngu_hoang"] == "Nam"
    _sach(kq)


def test_lam_nha_thuan():
    kq = L.xem_tuoi_lam_nha(1985, 2026)                  # tuổi mụ 42 → Kim lâu Tử
    assert kq["kim_lau"]["ma"] == "tu"
    kq = L.xem_tuoi_lam_nha(1986, 2026)                  # 41: không Kim lâu, Hoang ốc Ngũ Thọ Tử
    assert kq["kim_lau"] is None
    ok = [n for n in range(1950, 2006) if L.xem_tuoi_lam_nha(n, 2027)["ket_luan"]["ma"] == "thuan"]
    assert ok


def test_han_nam_co_nghia_sao():
    h = L.han_nam_luan(2026)
    assert h["can_chi"] == "Bính Ngọ" and len(h["phi_tinh"]) == 9
    assert {"thai_tue", "tue_pha", "tam_sat", "ngu_hoang", "nhi_hac"} <= {x["ma"] for x in h["huong_tranh"]}
    _sach(h)


def test_xong_dat_tet_2027():
    kq = L.xong_dat_luan(2027, 1990)
    assert kq["nam"]["can_chi"] == "Đinh Mùi" and kq["chu"]["can_chi"] == "Canh Ngọ"
    assert 3 <= len(kq["tuoi_hop"]) <= 8 and all(x["ly_do"] for x in kq["tuoi_hop"])
    assert kq["mung_mot"]["ngay"] == "2027-02-06"          # mùng 1 Tết Đinh Mùi
    assert kq["nen_tranh"]
    _sach(kq)


def test_api():
    r = client.post("/v1/tuoi/lam-nha", json={"nam_sinh": 1990, "nam_xay": 2026})
    assert r.status_code == 200 and r.json()["tuoi_mu"] == 37
    assert client.get("/v1/tuoi/han-nam/2026").json()["can_chi"] == "Bính Ngọ"
    assert client.post("/v1/tuoi/xong-dat", json={"nam": 2027, "nam_sinh": 1990}).status_code == 200
    assert client.get("/v1/tuoi/xong-dat/2027/1990").status_code == 200
    assert client.get("/v1/tuoi/lam-nha/2027/1990").status_code == 200
    assert client.post("/v1/tuoi/lam-nha", json={"nam_sinh": 2030, "nam_xay": 2026}).status_code == 422
    assert client.get("/v1/tuoi/han-nam/1800").status_code == 422
