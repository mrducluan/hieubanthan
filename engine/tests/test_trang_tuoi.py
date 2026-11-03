# -*- coding: utf-8 -*-
"""AUD-P1 (kiểm toán SEO/GEO 2026-11, chủ dự án giao "tách dữ kiện chung khỏi trang tuổi"): gói dữ liệu TRANG SEO
theo tuổi (GET công khai) bỏ phần chung của cả năm (bàn 9 cung, mùng 1 Tết đầy đủ, cách tính, ý nghĩa tứ hoá — đã có ở
trang năm) và thêm dữ kiện RIÊNG của tuổi đó (10 năm tới làm nhà, Tết tới xông đất, 5 năm tới theo tuổi). Không phép
tính mới: mọi số lấy lại từ đúng hàm của công cụ. Công cụ (POST) giữ gói đầy đủ."""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient

from app.luangiai import nam_tong_quan as NTQ
from app.luangiai import trang_tuoi as TT
from app.luangiai import tuoi_dan_gian as L
from app.main import app

client = TestClient(app)


def test_lam_nha_bo_chung_them_muoi_nam():
    d = TT.lam_nha(2027, 1990)
    goc = L.xem_tuoi_lam_nha(1990, 2027)
    assert d["tra_loi_nhanh"] == goc["tra_loi_nhanh"] and d["ket_luan"] == goc["ket_luan"]
    assert "phi_tinh" not in d["han_nam"] and {x["ma"] for x in d["han_nam"]["huong_tranh"]} == {x["ma"] for x in goc["han_nam"]["huong_tranh"]}
    assert all(set(x) == {"ma", "ten", "phuong"} for x in d["han_nam"]["huong_tranh"])
    assert "cach_tinh" not in d
    assert [x["nam"] for x in d["muoi_nam"]] == list(range(2027, 2037))
    for x in d["muoi_nam"]:
        g = L.xem_tuoi_lam_nha(1990, x["nam"])
        assert x["tuoi_mu"] == g["tuoi_mu"] and x["thuan"] == (g["ket_luan"]["ma"] == "thuan")
        assert x["hoang_oc"] == g["hoang_oc"]["ten"]
        assert x["kim_lau"] == (g["kim_lau"]["ten"] if g["kim_lau"] else None)
        assert x["tam_tai"] == (g["tam_tai"]["nam_thu"] if g["tam_tai"] else None)


def test_xong_dat_bo_chung_them_tet_toi():
    d = TT.xong_dat(2027, 1990)
    goc = L.xong_dat_luan(2027, 1990)
    assert d["tuoi_hop"] == goc["tuoi_hop"] and d["tra_loi_nhanh"] == goc["tra_loi_nhanh"]
    assert set(d["mung_mot"]) == {"ngay", "can_chi", "hoang_dao"} and "cach_chon" not in d
    assert [x["nam"] for x in d["tet_toi"]] == [2028, 2029, 2030, 2031]
    for x in d["tet_toi"]:
        g = L.xong_dat_luan(x["nam"], 1990)
        assert x["tuoi"] == [{"nam_sinh": h["nam_sinh"], "can_chi": h["can_chi"]} for h in g["tuoi_hop"][:4]]


def test_nam_tuoi_bo_chung_them_nam_toi():
    d = TT.nam_tuoi(2027, 1990)
    goc = NTQ.theo_tuoi(2027, 1990)
    assert d["diem_nhan"] == goc["diem_nhan"] and d["ranh_gioi"] == goc["ranh_gioi"]
    assert d["sao"] == {g: {"ten": x["ten"], "han": x["han"]} for g, x in goc["sao"].items()}
    assert all(set(h) == {"hoa", "sao"} for h in d["tu_hoa"])
    assert all(h["dap"] != d["ranh_gioi"] for h in d["hoi_dap"]) and len(d["hoi_dap"]) == len(goc["hoi_dap"]) - 1
    assert [x["nam"] for x in d["nam_toi"]] == list(range(2028, 2038))
    for x in d["nam_toi"]:
        g = NTQ.theo_tuoi(x["nam"], 1990)
        assert x["tuoi_mu"] == g["tuoi_mu"] and x["tam_tai"] == g["tam_tai"]
        assert x["sao_nam"] == (g["sao"]["nam"] or {}).get("ten") and x["sao_nu"] == (g["sao"]["nu"] or {}).get("ten")


def test_api_get_dung_ban_trang():
    assert "muoi_nam" in client.get("/v1/tuoi/lam-nha/2027/1990?gon=1").json()
    assert "tet_toi" in client.get("/v1/tuoi/xong-dat/2027/1990?gon=1").json()
    assert "nam_toi" in client.get("/v1/nam/2027/tuoi/1990?gon=1").json()
    # không xin bản gọn (web cũ trong lúc deploy lệch) → bản đầy đủ như cũ
    assert "phi_tinh" in client.get("/v1/tuoi/lam-nha/2027/1990").json()["han_nam"]
    assert "viec" in client.get("/v1/nam/2027/tuoi/1990").json()["sao"]["nam"]
    # công cụ (POST) vẫn đủ bàn 9 cung
    assert "phi_tinh" in client.post("/v1/tuoi/lam-nha", json={"nam_sinh": 1990, "nam_xay": 2027}).json()["han_nam"]


def test_phan_rieng_cac_ho_trang_tuoi():
    """Chặn lùi: làm nhà ≥ 0,30; xông đất / Tử vi theo tuổi giữ mức đã đạt (trước 0,04 / 0,11 — xem docstring module)."""
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
    import do_rieng_cong_cu as D
    ns = range(1960, 2006)
    for ten, mau, san in (("lam_nha", "/v1/tuoi/lam-nha/2027/{}?gon=1", 0.30), ("xong_dat", "/v1/tuoi/xong-dat/2027/{}?gon=1", 0.11),
                          ("nam_tuoi", "/v1/nam/2027/tuoi/{}?gon=1", 0.18)):
        kq = D.do({str(n): mau.format(n) for n in ns})
        assert kq["thap_nhat"] >= san, (ten, kq)
