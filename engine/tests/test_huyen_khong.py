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
