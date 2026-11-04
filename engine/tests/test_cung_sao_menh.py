# -*- coding: utf-8 -*-
"""TV-ZW "Cùng sao Mệnh" — tầng RULES: ghép tỉ lệ (CALC) + lời KB. Viết trước hàm."""
from __future__ import annotations

from app.calc import tuvi_sao_menh as sm
from app.kb.tuvi_doi_song_kb import tim_cum_cam
from app.luangiai import cung_sao_menh as csm
from app.luangiai.doi_song_khuon import cum_cam_chung
from tests._tuvi_1000 import la_1000

THUAT_NGU = ("chính tinh", "vô chính diệu", "canh giờ", "Cục", "âm lịch")


def _tach(k: str) -> tuple[list[str], bool]:
    muon = k.startswith("vô chính diệu")
    ten = k[len("vô chính diệu (mượn "):-1] if muon else k
    return ten.split(" + "), muon


def test_moi_to_hop_deu_co_loi():
    cam = cum_cam_chung()
    for k in sm.bang()["dem"]:
        sao, muon = _tach(k)
        r = csm.dung(sao, muon)
        assert r is not None, k
        assert r["khoa"] == k and r["muc"] in ("pho_bien", "it_gap")
        assert "Cùng sao Mệnh, không cùng cuộc đời" in r["loi"]
        assert not any(t in r["loi"] for t in THUAT_NGU), r["loi"]          # thuật ngữ chỉ ở "Vì sao nói vậy"
        assert "{" not in r["loi"] + r["can_cu"] + r["nhan_ngan"]
        assert tim_cum_cam(r["loi"], cam) == [], r["loi"]
        assert r["source_id"] and r["school_id"] and r["trang_thai"] == "nhap_ai"


def test_muc_theo_nguong():
    for k, n in sm.bang()["dem"].items():
        r = csm.dung(*_tach(k))
        assert r["muc"] == ("pho_bien" if n / sm.bang()["tong"] >= csm.NGUONG_PHO_BIEN else "it_gap")
        assert r["mot_trong"] == round(sm.bang()["tong"] / n)


def test_tu_la_so_doc_cung_menh():
    for la in la_1000()[:40]:
        r = csm.tu_la_so(la)
        p = la["palaces"]
        i = next(k for k, x in enumerate(p) if x["name"] == "Mệnh")
        muon = not p[i]["majorStars"]
        sao = [s["name"] for s in (p[(i + 6) % 12] if muon else p[i])["majorStars"]]
        assert r["khoa"] == sm.khoa(sao, muon) and r["muon"] == muon


def test_to_hop_la_tra_none():
    assert csm.dung(["Tử Vi", "Thất Sát", "Phá Quân"], False) is None
    assert csm.dung([], False) is None


def test_mot_hai_muon_dung_lua_chon_loi():
    assert "sao Thiên Đồng ở cung Mệnh" in csm.dung(["Thiên Đồng"], False)["loi"]
    assert "cặp sao Tử Vi và Thiên Phủ ở cung Mệnh" in csm.dung(["Thiên Phủ", "Tử Vi"], False)["loi"]
    assert "mượn cặp sao Thái Dương và Thái Âm" in csm.dung(["Thái Dương", "Thái Âm"], True)["loi"]


def test_api_an_sao_co_cung_sao_menh():
    from fastapi.testclient import TestClient

    from app.main import app
    c = TestClient(app)
    body = {"birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam", "calendar_type": "duong",
            "noi_sinh": "ha-noi"}
    j = c.post("/v1/tuvi/an-sao", json=body).json()
    m = next(p for p in j["cung"] if p["la_menh"])
    muon = not m["chinh_tinh"]
    doi = next(p for p in j["cung"] if p["chi"] == sm.CHI[(sm.CHI.index(m["chi"]) + 6) % 12])
    sao = [s["ten"] for s in (doi if muon else m)["chinh_tinh"]]
    assert j["cung_sao_menh"]["khoa"] == sm.khoa(sao, muon)
    assert "1990" not in j["cung_sao_menh"]["loi"]
    j2 = c.post("/v1/tuvi/an-sao", json={**body, "do_tin_gio": "unknown"}).json()
    assert j2["cung_sao_menh"] is None                           # giờ tạm → cung Mệnh tạm → không hiện
