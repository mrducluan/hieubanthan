# -*- coding: utf-8 -*-
"""SEO-L1 (chủ dự án duyệt 2026-10-22) — trang trụ theo năm: "tuổi nào làm nhà năm X", "tuổi xông đất Tết năm X".
Ghép từ đúng các hàm tính của từng tuổi (không phép tính mới): mỗi dòng của bảng năm phải khớp trang con cùng tuổi."""
import json

from fastapi.testclient import TestClient

from app.luangiai import tuoi_dan_gian as L
from app.main import app

client = TestClient(app)
CAM = ("đại hung", "chết", "tai hoạ", "tai họa", "xui xẻo", "giải hạn", "mất mạng", "bệnh nặng", "vật phẩm")


def test_lam_nha_nam_2027_khop_trang_con():
    kq = L.lam_nha_nam(2027)
    assert kq["nam"] == 2027 and kq["can_chi"] == "Đinh Mùi"
    assert [x["nam_sinh"] for x in kq["ds"]] == list(range(1960, 2006))
    for x in kq["ds"]:
        con = L.xem_tuoi_lam_nha(x["nam_sinh"], 2027)
        assert x["tuoi_mu"] == con["tuoi_mu"] and x["can_chi"] == con["can_chi"]
        assert x["thuan"] == (con["ket_luan"]["ma"] == "thuan")
    # tính tay: 1990 → tuổi mụ 38 (38 % 9 = 2, không Kim lâu); 1991 → 37 (Kim lâu Thân)
    ds = {x["nam_sinh"]: x for x in kq["ds"]}
    assert ds[1990]["tuoi_mu"] == 38 and ds[1990]["kim_lau"] is None
    assert ds[1991]["kim_lau"] == "Kim lâu Thân" and not ds[1991]["thuan"]
    assert kq["so_thuan"] == sum(x["thuan"] for x in kq["ds"]) and str(kq["so_thuan"]) in kq["tra_loi_nhanh"]
    assert kq["hoi_dap"] and kq["han_nam"]["nam"] == 2027
    s = json.dumps(kq, ensure_ascii=False).lower()
    assert not any(c in s for c in CAM)


def test_xong_dat_nam_2027_khop_trang_con():
    kq = L.xong_dat_nam(2027)
    assert kq["nam"]["can_chi"] == "Đinh Mùi" and len(kq["ds"]) == 46
    for x in kq["ds"][::9]:
        con = L.xong_dat_luan(2027, x["nam_sinh"])
        assert [h["nam_sinh"] for h in x["tuoi_hop"]] == [h["nam_sinh"] for h in con["tuoi_hop"][:3]]
        assert x["can_chi"] == con["chu"]["can_chi"]
    assert kq["mung_mot"]["ngay"] == "2027-02-06"                       # Tết Đinh Mùi (lịch Việt)
    assert any("Sửu" in n for n in kq["nen_tranh"])                    # tuổi Sửu xung năm Mùi
    assert kq["tra_loi_nhanh"] and kq["hoi_dap"]


def test_api_theo_nam():
    r = client.get("/v1/tuoi/lam-nha-nam/2027")
    assert r.status_code == 200 and len(r.json()["ds"]) == 46
    r = client.get("/v1/tuoi/xong-dat-nam/2027")
    assert r.status_code == 200 and len(r.json()["ds"]) == 46
    assert client.get("/v1/tuoi/lam-nha-nam/1800").status_code == 422
