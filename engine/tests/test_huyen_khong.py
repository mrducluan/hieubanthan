# -*- coding: utf-8 -*-
"""PT-HK — Huyền Không phi tinh (hạ quái bàn). Test viết TRƯỚC.

Golden: fixtures/golden/huyen_khong.json — 9 vận × 24 sơn = 216 trạch bàn từ ORACLE
@soul-atelier/xuankong 0.3.0 (MIT): vận bàn, sơn bàn, hướng bàn, cục, tổ hợp cách cục.
Lưu niên phi tinh: tâm năm = 2027 − năm (mod 9) — 2026 Nhất Bạch nhập trung.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import huyen_khong as hk
from app.main import app

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "huyen_khong.json").read_text("utf-8"))["cases"]
HAN_SON = dict(zip("壬子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥",
                   ["Nhâm", "Tý", "Quý", "Sửu", "Cấn", "Dần", "Giáp", "Mão", "Ất", "Thìn", "Tốn", "Tỵ",
                    "Bính", "Ngọ", "Đinh", "Mùi", "Khôn", "Thân", "Canh", "Dậu", "Tân", "Tuất", "Càn", "Hợi"]))
KEY = {"kan": "Khảm", "gen": "Cấn", "zhen": "Chấn", "xun": "Tốn", "li": "Ly", "kun": "Khôn", "dui": "Đoài",
       "qian": "Càn", "center": "Trung cung"}
CUC = {"旺山旺向": "vuong_son_vuong_huong", "上山下水": "thuong_son_ha_thuy",
       "双星到向": "song_tinh_dao_huong", "双星到坐": "song_tinh_dao_toa"}
TO_HOP = {"父母三般卦": "phu_mau_tam_ban", "连珠三般卦": "lien_chau_tam_ban", "山星合十": "son_tinh_hop_thap",
          "向星合十": "huong_tinh_hop_thap", "全盘伏吟（山星）": "toan_ban_phuc_ngam_son",
          "全盘伏吟（向星）": "toan_ban_phuc_ngam_huong", "全盘反吟（山星）": "toan_ban_phan_ngam_son",
          "全盘反吟（向星）": "toan_ban_phan_ngam_huong", "单宫伏吟（山星）": "don_cung_phuc_ngam_son",
          "单宫伏吟（向星）": "don_cung_phuc_ngam_huong", "单宫反吟（山星）": "don_cung_phan_ngam_son",
          "单宫反吟（向星）": "don_cung_phan_ngam_huong", "山星入囚": "son_tinh_nhap_tu",
          "向星入囚": "huong_tinh_nhap_tu", "七星真打劫": "that_tinh_chan_da_kiep", "七星假打劫": "that_tinh_gia_da_kiep"}


@pytest.mark.parametrize("c", G, ids=lambda c: f"v{c['van']}-{c['toa']}")
def test_khop_oracle(c):
    b = hk.trach_ban(c["nam"], HAN_SON[c["toa"]])
    assert b["van"] == c["van"]
    assert b["huong"]["son"] == HAN_SON[c["huong"]]
    assert b["cuc"] == CUC[c["cach"]]
    cung = {x["cung"]: (x["van"], x["son"], x["huong"]) for x in b["cung"]}
    for k, v in c["cung"].items():
        assert cung[KEY[k]] == tuple(v), k
    assert sorted(t["ma"] for t in b["to_hop"]) == sorted(TO_HOP[n] for n in c["to_hop"])


@pytest.mark.parametrize("nam,van", [(1864, 1), (2003, 7), (2004, 8), (2023, 8), (2024, 9), (2043, 9), (2044, 1)])
def test_van(nam, van):
    assert hk.van_cua_nam(nam) == van


@pytest.mark.parametrize("nam,tam", [(2024, 3), (2025, 2), (2026, 1), (2027, 9), (2035, 1)])
def test_luu_nien_tam(nam, tam):
    assert hk.luu_nien(nam)["tam"] == tam


@pytest.mark.parametrize("do,son,canh_bao", [
    (0, "Tý", None), (345, "Nhâm", None), (350, "Nhâm", "kiem_huong"), (5, "Tý", "kiem_huong"),
    (352.4, "Nhâm", "khong_vong"), (22.5, "Sửu", "khong_vong"), (90, "Mão", None), (359.9, "Tý", None),
])
def test_son_tu_do(do, son, canh_bao):
    s = hk.son_tu_do(do)
    assert s["son"] == son and s["canh_bao"] == canh_bao


def test_trang_thai_sao_van_9():
    b = hk.trach_ban(2026, "Tý")
    t = {x["sao"]: x["trang_thai"] for x in b["trang_thai_sao"]}
    assert t[9] == "vượng" and t[1] == "sinh" and t[2] == "sinh" and t[8] == "thoái" and t[5] == "tử"


def test_api():
    r = TestClient(app).post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2008, "toa": "Tý", "nam_xem": 2026})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["cuc"] == "song_tinh_dao_huong" and d["cuc_ten"] == "Song tinh đáo hướng"
    assert d["luu_nien"]["tam"] == 1 and len(d["cung"]) == 9
    assert any(t["ma"] == "that_tinh_chan_da_kiep" for t in d["to_hop"])
    r2 = TestClient(app).post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2008, "do": 352.4})
    assert r2.json()["toa"]["son"] == "Nhâm" and r2.json()["canh_bao"]


def test_api_dau_vao_sai():
    c = TestClient(app)
    assert c.post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2008}).status_code == 422
    assert c.post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2008, "toa": "Abc"}).status_code == 422


@pytest.mark.parametrize("t,nam", [
    ((2026, 1, 15, 3, 0), 2025),      # trước Lập xuân 2026 (~4/2) → vẫn năm 2025: Nhị Hắc nhập trung
    ((2026, 2, 3, 20, 0), 2025),      # Lập xuân 2026 = 3/2 20:02 UTC (4/2 03:02 giờ VN)
    ((2026, 2, 3, 20, 5), 2026),
    ((2026, 12, 31, 12, 0), 2026),
])
def test_nam_theo_lap_xuan(t, nam):
    import datetime as dt
    assert hk.nam_theo_lap_xuan(dt.datetime(*t)) == nam


def test_api_nam_xem_mac_dinh_theo_lap_xuan(monkeypatch):
    import datetime as dt
    from app import phongthuy_api
    monkeypatch.setattr(phongthuy_api, "_bay_gio_utc", lambda: dt.datetime(2026, 1, 20))
    d = TestClient(app).post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2008, "toa": "Tý"}).json()
    assert d["luu_nien"]["nam"] == 2025 and d["luu_nien"]["tam"] == 2


# ---- PT-HK2: thế quái (kiêm hướng) — khẩu quyết Thẩm thị (test viết trước) -----------------
# Chưa có oracle độc lập (không gói MIT nào lập bàn thế quái) → test theo khẩu quyết + bàn tính tay.
THE_TINH = {"Tý": 1, "Quý": 1, "Giáp": 1, "Thân": 1, "Nhâm": 2, "Mão": 2, "Ất": 2, "Mùi": 2, "Khôn": 2,
            "Càn": 6, "Hợi": 6, "Thìn": 6, "Tốn": 6, "Tỵ": 6, "Tuất": 6, "Dậu": 7, "Tân": 7, "Sửu": 7, "Cấn": 7,
            "Bính": 7, "Dần": 9, "Ngọ": 9, "Canh": 9, "Đinh": 9}


def test_bang_the_tinh_du_24_son():
    assert hk.THE_TINH == THE_TINH and sorted(hk.THE_TINH) == sorted(hk.SON_24)


def test_the_quai_van_8_toa_ty_tinh_tay():
    # Vận 8 toạ Tý: vận tinh tại Khảm = 4, tại Ly = 3.
    # Sơn: 4 → sơn thiên nguyên của Tốn = Tốn → thế 6, thuận theo Tốn (+).
    # Hướng: 3 → sơn thiên nguyên của Chấn = Mão → thế 2, nghịch theo Mão (−).
    b = hk.trach_ban(2008, "Tý", the_quai=True)
    assert b["phep"] == "the_quai"
    assert b["the_tinh"] == {"son": {"goc": 4, "the": 6, "thuan": True}, "huong": {"goc": 3, "the": 2, "thuan": False}}
    cung = {x["cung"]: (x["son"], x["huong"]) for x in b["cung"]}
    assert cung == {"Trung cung": (6, 2), "Càn": (7, 1), "Đoài": (8, 9), "Cấn": (9, 8), "Ly": (1, 7),
                    "Khảm": (2, 6), "Khôn": (3, 5), "Chấn": (4, 4), "Tốn": (5, 3)}


@pytest.mark.parametrize("c", G[:216:7], ids=lambda c: f"v{c['van']}-{c['toa']}")
def test_the_quai_trung_ha_quai_khi_the_tinh_khong_doi(c):
    toa = HAN_SON[c["toa"]]
    ha, the = hk.trach_ban(c["nam"], toa), hk.trach_ban(c["nam"], toa, the_quai=True)
    if the["the_tinh"]["son"]["goc"] == the["the_tinh"]["son"]["the"] and \
       the["the_tinh"]["huong"]["goc"] == the["the_tinh"]["huong"]["the"]:
        assert [(x["son"], x["huong"]) for x in ha["cung"]] == [(x["son"], x["huong"]) for x in the["cung"]]
    assert [x["van"] for x in ha["cung"]] == [x["van"] for x in the["cung"]]   # vận bàn không đổi


def test_sao_6_khong_bao_gio_bi_thay():
    for son in hk.SON_24:
        for nam in range(1864, 2044, 20):
            b = hk.trach_ban(nam, son, the_quai=True)
            for k in ("son", "huong"):
                if b["the_tinh"][k]["goc"] == 6:
                    assert b["the_tinh"][k]["the"] == 6


def test_api_do_kiem_huong_lap_the_quai():
    c = TestClient(app)
    d = c.post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2008, "do": 4.0}).json()       # Tý lệch 4° → kiêm
    assert d["phep"] == "the_quai" and d["the_tinh"]["son"]["the"] == 6
    assert d["ha_quai"]["cuc"] and d["the_quai_trang_thai"] == "chua_doi_chieu_oracle"
    d = c.post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2008, "do": 2.0}).json()       # lệch 2° → hạ quái
    assert d["phep"] == "ha_quai" and "the_tinh" not in d
