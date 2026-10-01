# -*- coding: utf-8 -*-
"""VZ-3 — Bát tự mở rộng. Test viết TRƯỚC hàm.

1. Nạp âm 4 trụ, 12 trường sinh của nhật chủ tại 4 chi, tuần không (năm, ngày) — khớp ORACLE
   lunar-typescript (fixtures/golden/battu_mo_rong.json, cùng 42 ca với battu.json).
2. Thần sát: bảng công bố trong `battu_mo_rong.THAN_SAT` (Tam Mệnh Thông Hội), kiểm bằng ca tay.
3. Quan hệ can chi giữa 4 trụ: hợp/xung/hình/hại/phá, tam hợp, tam hội, can ngũ hợp/tương xung.
4. Endpoint: /v1/battu/la-so có khoá `mo_rong`; /v1/battu/luu-nien.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import battu as bt, battu_mo_rong as mr
from app.main import app

client = TestClient(app)
G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "battu_mo_rong.json")
               .read_text(encoding="utf-8"))["cases"]
HAN_CHI = dict(zip("子丑寅卯辰巳午未申酉戌亥", mr.CHI))
HAN_SINH = dict(zip(["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"], mr.TRUONG_SINH))


def _ls(inp: dict) -> dict:
    y, m, d = (int(x) for x in inp["ngay"].split("-"))
    h, mi = (int(x) for x in inp["gio"].split(":"))
    return bt.la_so(dt.datetime(y, m, d, h, mi), inp["gioi_tinh"])


@pytest.mark.parametrize("i", range(len(G)))
def test_khop_oracle(i):
    g = G[i]["expect"]
    m = mr.mo_rong(_ls(G[i]["input"]))
    assert [x["han"] for x in m["nap_am"]] == g["nap_am"]
    assert m["truong_sinh"] == [HAN_SINH[x] for x in g["truong_sinh"]]
    assert m["khong_vong"]["ngay"] == [HAN_CHI[c] for c in g["khong_vong_ngay"]]
    assert m["khong_vong"]["nam"] == [HAN_CHI[c] for c in g["khong_vong_nam"]]


@pytest.mark.parametrize("can,chi,giai", [
    ("Giáp", "Hợi", "Trường Sinh"), ("Giáp", "Mão", "Đế Vượng"), ("Giáp", "Ngọ", "Tử"),
    ("Ất", "Ngọ", "Trường Sinh"), ("Ất", "Dần", "Đế Vượng"),
    ("Nhâm", "Thân", "Trường Sinh"), ("Quý", "Mão", "Trường Sinh"), ("Canh", "Tỵ", "Trường Sinh"),
])
def test_truong_sinh_tay(can, chi, giai):
    assert mr.truong_sinh(can, chi) == giai


def _tru(*gz: str) -> list[dict]:
    return [{"can": x.split()[0], "chi": x.split()[1]} for x in gz]


def _ten_o(ts: list[dict]) -> dict[str, set[int]]:
    return {t["ten"]: set(t["tru"]) for t in ts}


def test_than_sat_ca_tay_1990():
    # Canh Ngọ / Tân Tỵ / Nhâm Ngọ / Bính Ngọ — tính tay theo bảng.
    ts = _ten_o(mr.than_sat(_tru("Canh Ngọ", "Tân Tỵ", "Nhâm Ngọ", "Bính Ngọ")))
    assert ts["Thiên Ất Quý Nhân"] == {1}          # Nhâm → Mão, Tỵ
    assert ts["Thái Cực Quý Nhân"] == {1}          # Nhâm → Tỵ, Thân
    assert ts["Thiên Đức"] == {1}                  # tháng Tỵ → can Tân
    assert ts["Nguyệt Đức"] == {0}                 # tháng Tỵ (Tỵ Dậu Sửu) → can Canh
    assert ts["Vong Thần"] == {1}                  # Dần Ngọ Tuất → Tỵ
    assert ts["Tướng Tinh"] == {0, 2, 3}           # Dần Ngọ Tuất → Ngọ (không tự tính trụ gốc)
    for k in ("Văn Xương", "Lộc Thần", "Dương Nhận", "Đào Hoa", "Dịch Mã", "Hoa Cái", "Khôi Cương"):
        assert k not in ts


def test_than_sat_dao_hoa_dich_ma_loc():
    # Giáp Tý / Bính Dần / Giáp Thân / Quý Dậu
    ts = _ten_o(mr.than_sat(_tru("Giáp Tý", "Bính Dần", "Giáp Thân", "Quý Dậu")))
    assert ts["Đào Hoa"] == {3}                    # Thân Tý Thìn → Dậu
    assert ts["Dịch Mã"] == {1}                    # Thân Tý Thìn → Dần
    assert ts["Lộc Thần"] == {1}                   # Giáp lộc tại Dần
    assert "Thiên Ất Quý Nhân" not in ts          # Giáp → Sửu, Mùi: không có


def test_khoi_cuong():
    ts = _ten_o(mr.than_sat(_tru("Giáp Tý", "Bính Dần", "Canh Thìn", "Quý Mùi")))
    assert ts["Khôi Cương"] == {2}


def test_moi_than_sat_co_loai_va_nguon():
    for t in mr.than_sat(_tru("Canh Ngọ", "Tân Tỵ", "Nhâm Ngọ", "Bính Ngọ")):
        assert t["loai"] in ("cát", "hung", "trung") and t["y"] and t["tru"]


def _qh(tru) -> set[tuple[str, tuple[int, ...]]]:
    return {(q["loai"], tuple(q["tru"])) for q in mr.quan_he(tru)}


def test_quan_he_chi():
    q = _qh(_tru("Giáp Tý", "Đinh Mão", "Canh Ngọ", "Đinh Sửu"))
    assert ("lục xung", (0, 2)) in q              # Tý–Ngọ
    assert ("tương hình", (0, 1)) in q            # Tý–Mão vô lễ
    assert ("lục hợp", (0, 3)) in q               # Tý–Sửu
    assert ("tương phá", (1, 2)) in q             # Mão–Ngọ
    assert ("lục hại", (2, 3)) in q               # Ngọ–Sửu


def test_quan_he_tam_hop_tu_hinh_va_can():
    q = _qh(_tru("Giáp Thân", "Kỷ Tý", "Canh Thìn", "Canh Thìn"))
    assert ("tam hợp", (0, 1, 2, 3)) in q          # Thân Tý Thìn (Thìn hai trụ)
    assert ("tự hình", (2, 3)) in q               # Thìn–Thìn
    assert ("can ngũ hợp", (0, 1)) in q           # Giáp–Kỷ
    assert ("can tương xung", (0, 2)) in q        # Giáp–Canh


def test_ban_hop_va_tam_hoi():
    q = _qh(_tru("Giáp Dần", "Đinh Mão", "Mậu Thìn", "Nhâm Tuất"))
    assert ("tam hội", (0, 1, 2)) in q            # Dần Mão Thìn
    assert ("bán hợp", (0, 3)) not in q           # Dần–Tuất thiếu trung thần Ngọ → không tính bán hợp


DUA_VAO = {"birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam", "noi_sinh": "ha-noi"}


def test_api_la_so_co_mo_rong():
    r = client.post("/v1/battu/la-so", json=DUA_VAO)
    assert r.status_code == 200, r.text
    m = r.json()["mo_rong"]
    assert [x["ten"] for x in m["nap_am"]] == ["Lộ Bàng Thổ", "Bạch Lạp Kim", "Dương Liễu Mộc", "Thiên Hà Thủy"]
    assert len(m["truong_sinh"]) == 4 and len(m["tu_toa"]) == 4
    assert m["than_sat"] and m["quan_he"]


def test_api_luu_nien():
    r = client.post("/v1/battu/luu-nien", json={"la_so": DUA_VAO, "nam_xem": 2026})
    assert r.status_code == 200, r.text
    v = r.json()
    assert (v["can"], v["chi"]) == ("Bính", "Ngọ") and v["nam"] == 2026
    assert v["thap_than"] == "Thiên Tài"           # Nhâm gặp Bính
    assert v["nap_am"]["ten"] == "Thiên Hà Thủy"
    assert v["dai_van"] is not None
    assert {"loai", "tru", "mo_ta"} <= set(v["quan_he"][0])
    assert len(v["luu_nguyet"]) == 12


def test_api_luu_nien_ngoai_khoang():
    assert client.post("/v1/battu/luu-nien", json={"la_so": DUA_VAO, "nam_xem": 1700}).status_code == 422


def test_vai_tro_hanh():
    assert mr.vai_tro_hanh("Thủy") == {"Thủy": "Tỷ Kiếp", "Kim": "Ấn", "Mộc": "Thực Thương",
                                       "Hỏa": "Tài", "Thổ": "Quan Sát"}


def test_mo_rong_co_vai_tro_va_thap_than_dai_van():
    ls = _ls({"ngay": "1990-05-17", "gio": "12:30", "gioi_tinh": "nam"})
    m = mr.mo_rong(ls)
    assert m["vai_tro_hanh"]["Thủy"] == "Tỷ Kiếp"            # nhật chủ Nhâm
    assert len(m["dai_van_thap_than"]) == len(ls["dai_van"]["ds"])
    assert m["dai_van_thap_than"][0] == bt.thap_than("Nhâm", ls["dai_van"]["ds"][0]["can"])


def test_bang_hanh():
    b = mr.bang_hanh()
    assert b["can"]["Giáp"] == "Mộc" and b["can"]["Quý"] == "Thủy" and len(b["can"]) == 10
    assert b["chi"]["Thìn"] == "Thổ" and b["chi"]["Hợi"] == "Thủy" and len(b["chi"]) == 12
