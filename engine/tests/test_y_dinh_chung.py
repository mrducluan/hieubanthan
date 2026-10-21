# -*- coding: utf-8 -*-
"""KC-3 — từ điển ý định dùng chung: mọi mã riêng của các mảng ánh xạ được, link chỉ trong site, gợi mở bỏ mảng đang đứng."""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.hoidap import kinhdich as kd
from app.kb import kinhdich_doi_song_kb, y_dinh_chung as kb
from app.main import app

client = TestClient(app)


def test_moi_chu_de_kinh_dich_co_ma_chung():
    for ma in kinhdich_doi_song_kb.chu_de_tat_ca():
        assert kb.tu_ma_rieng("kinhdich", ma), ma


def test_moi_y_dinh_tu_vi_va_hom_nay_co_ma_chung():
    from app.hoidap.tuvi import Y_DINH_KW
    from app.luangiai.hom_nay import TU_KHOA_Y_DINH
    for ma in Y_DINH_KW:
        assert kb.tu_ma_rieng("tuvi", ma), ma
    for ma in TU_KHOA_Y_DINH:
        assert kb.tu_ma_rieng("hom_nay", ma), ma


def test_link_trong_site_va_bo_mang_dang_dung():
    for ma, y in kb.tat_ca().items():
        assert y["ten"] and y["lien_ket"]
        for lk in y["lien_ket"]:
            assert lk["duong"].startswith("/") and "://" not in lk["duong"] and lk["nhan"]
    g = kb.goi_mo("cong_viec", "kinhdich")
    assert g and all(x["mo_dun"] != "kinhdich" for x in g["lien_ket"]) and len(g["lien_ket"]) <= 3 and g["tuvi_cung"] == "Quan Lộc"
    assert kb.tu_ma_rieng("thanso", "su_nghiep_tien_bac") in ("cong_viec", "kinh_doanh_tien", "hoc_hanh")


def test_doc_que_co_goi_mo():
    out = kd.tra_loi("Tôi có nên chuyển việc sang công ty mới không?", "tu_dong", gia_tri_hao=[7, 7, 8, 7, 7, 9], thoi_diem=dt.datetime(2026, 5, 20, 10))
    dq = out["doc_que"]
    assert dq["y_dinh_chung"] == "cong_viec" and dq["goi_mo"]["lien_ket"] and all(x["mo_dun"] != "kinhdich" for x in dq["goi_mo"]["lien_ket"])


def test_api():
    r = client.get("/v1/y-dinh")
    assert r.status_code == 200 and len(r.json()["y_dinh"]) >= 10
    r = client.get("/v1/y-dinh/goi-mo", params={"ma": "tien_no", "mo_dun": "kinhdich"})
    assert r.status_code == 200 and r.json()["ma"] == "kinh_doanh_tien"
    r = client.get("/v1/y-dinh/goi-mo", params={"ma": "su_nghiep_tien_bac", "mo_dun": "thanso", "toi_da": 2})
    assert r.status_code == 200 and len(r.json()["lien_ket"]) == 2 and all(x["mo_dun"] != "thanso" for x in r.json()["lien_ket"])
    assert client.get("/v1/y-dinh/goi-mo", params={"ma": "khong_co"}).status_code == 404
