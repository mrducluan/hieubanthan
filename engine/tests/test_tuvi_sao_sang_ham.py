# -*- coding: utf-8 -*-
"""KB-TV2b — 14 chính tinh: nghĩa riêng khi SÁNG (miếu/vượng/đắc) và khi HÃM; hỏi đáp dùng độ sáng
Nam phái (mặc định đã chốt 2026-10-01) thay vì bảng phái Trung của iztro. Test viết TRƯỚC."""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc.tuvi_cach_cuc import CHINH_TINH
from app.hoidap import tuvi as tv
from app.kb import tuvi_kb as kb
from app.narrative import hoi_van

SINH = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
XEM = dt.date(2026, 9, 30)


@pytest.mark.parametrize("sao", sorted(CHINH_TINH))
def test_kb_moi_chinh_tinh_co_khi_sang_khi_ham(sao):
    ct = kb.chinh_tinh(sao)
    assert 30 <= len(ct["khi_sang"]) <= 300 and 30 <= len(ct["khi_ham"]) <= 300
    assert ct["khi_sang"] != ct["khi_ham"]
    for c in hoi_van.CAM:
        assert c not in (ct["khi_sang"] + ct["khi_ham"]).lower()


@pytest.mark.parametrize("muc,nhom", [("Miếu", "sang"), ("Vượng", "sang"), ("Đắc", "sang"),
                                      ("Bình", None), ("Lợi", None), ("Bất", "ham"), ("Hãm", "ham"), (None, None)])
def test_nhom_do_sang(muc, nhom):
    assert kb.nhom_do_sang(muc) == nhom


def test_tom_tat_dung_nam_phai_giu_ban_trung():
    from app.calc import tuvi_an_sao
    ls = tv.tom_tat(tuvi_an_sao.an_sao_tho(SINH["ngay"], SINH["ti"], "nam"))
    phu_the = next(c for c in ls["cung"] if c["ten"] == "Phu Thê")
    ta = next(s for s in phu_the["chinh_tinh"] if s["ten"] == "Thái Âm")
    assert ta["do_sang"] == "Miếu" and ta["do_sang_trung"] == "Bất"     # Thái Âm tại Dậu


def test_tra_loi_co_sac_thai_sang_ham():
    out = tv.tra_loi("Chuyện tình cảm vợ chồng của tôi theo tử vi thế nào?", "tham_khao", SINH, XEM)
    van, cu = out["cau_tra_loi"], "\n".join(out["can_cu"])
    # Rà chung chung đợt 2: thân bài = lời đời thường theo sao × cung × SÁNG (KB đời sống); độ sáng + sắc thái
    # kỹ thuật ở "Vì sao nói vậy".
    assert "Thái Âm ở cung Phu Thê (Miếu" in cu and kb.chinh_tinh("Thái Âm")["khi_sang"] in cu
    from app.kb import tuvi_doi_song_kb as kds
    assert kds.sao_linh_vuc("Thái Âm", "Phu Thê", "sang")["manh"] in van
    assert "Thái Âm" not in van
    assert hoi_van.kiem_tra_dau_ra(van, out["bang_chung"]) == []


def test_sao_ham_dung_khi_ham():
    # Thiên Cơ tại Dần (Nam phái: Hãm) — dựng trực tiếp mục bằng chứng
    m = tv._m_sao_cung("Thiên Cơ", "Mệnh", "Hãm", "la_so")
    assert m["sac_thai"] == kb.chinh_tinh("Thiên Cơ")["khi_ham"]
    assert tv._m_sao_cung("Thiên Cơ", "Mệnh", "Bình", "la_so").get("sac_thai") is None


def test_api_an_sao_chinh_tinh_kem_giai_nghia():
    """Thẻ chi tiết cung: lời đời thường theo sao × CUNG × sáng/hãm Nam phái (KB đời sống) + một việc nên làm;
    tính chất sao + sắc thái sáng/hãm (thuật ngữ) ở `can_cu` — rà chung chung đợt 2."""
    from fastapi.testclient import TestClient
    from app.kb import tuvi_doi_song_kb as kds
    from app.main import app
    d = TestClient(app).post("/v1/tuvi/an-sao", json={"birth_date": "1990-05-17", "birth_time": "12:30",
                                                       "gender": "nam", "noi_sinh": "ha-noi"}).json()
    for c in d["cung"]:
        for s in c["chinh_tinh"]:
            g = s["giai_nghia"]
            ct = kb.chinh_tinh(s["ten"])
            nhom = "ham" if s["do_sang_nam_phai"] == "Hãm" else "sang"
            k = kds.sao_linh_vuc(s["ten"], c["ten"], nhom)
            assert k["manh"] in g["thuong_thay"] and k["de_vap"] in g["thuong_thay"]
            assert g["nen_lam"] == k["loi_khuyen"]
            assert s["ten"] not in g["thuong_thay"] + g["nen_lam"]
            assert any(ct["tinh_chat"] in x for x in g["can_cu"])
            sac = kb.nhom_do_sang(s["do_sang_nam_phai"])
            if sac:
                assert ct["khi_sang" if sac == "sang" else "khi_ham"] in g["can_cu"]
