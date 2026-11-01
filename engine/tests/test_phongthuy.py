# -*- coding: utf-8 -*-
"""HH-4 — Phong thuỷ Bát trạch (tầng CALC). Test viết TRƯỚC.

Đối chiếu ĐỘC LẬP: bảng 8 mệnh quái × 8 hướng chép tay (bảng Bát trạch phổ thông), trong khi code
tính bằng phép "lật hào" du niên (Phục vị → Sinh khí → Ngũ quỷ → Diên niên → Lục sát → Hoạ hại →
Thiên y → Tuyệt mệnh). Mệnh quái: bảng tay theo năm/giới; mốc Lập xuân (không phải 1/1, không phải Tết).
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import phongthuy as pt

H = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]
# mệnh quái → (Sinh Khí, Thiên Y, Diên Niên, Phục Vị, Hoạ Hại, Lục Sát, Ngũ Quỷ, Tuyệt Mệnh)
BANG = {
    "Khảm": ("Đông Nam", "Đông", "Nam", "Bắc", "Tây", "Tây Bắc", "Đông Bắc", "Tây Nam"),
    "Khôn": ("Đông Bắc", "Tây", "Tây Bắc", "Tây Nam", "Đông", "Nam", "Đông Nam", "Bắc"),
    "Chấn": ("Nam", "Bắc", "Đông Nam", "Đông", "Tây Nam", "Đông Bắc", "Tây Bắc", "Tây"),
    "Tốn": ("Bắc", "Nam", "Đông", "Đông Nam", "Tây Bắc", "Tây", "Tây Nam", "Đông Bắc"),
    "Càn": ("Tây", "Đông Bắc", "Tây Nam", "Tây Bắc", "Đông Nam", "Bắc", "Đông", "Nam"),
    "Đoài": ("Tây Bắc", "Tây Nam", "Đông Bắc", "Tây", "Bắc", "Đông Nam", "Nam", "Đông"),
    "Cấn": ("Tây Nam", "Tây Bắc", "Tây", "Đông Bắc", "Nam", "Đông", "Bắc", "Đông Nam"),
    "Ly": ("Đông", "Đông Nam", "Bắc", "Nam", "Đông Bắc", "Tây Nam", "Tây", "Tây Bắc"),
}
DU = ["Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị", "Hoạ Hại", "Lục Sát", "Ngũ Quỷ", "Tuyệt Mệnh"]


@pytest.mark.parametrize("quai", sorted(BANG))
def test_bang_du_nien_khop_bang_tay(quai):
    assert pt.bang_huong(quai) == {h: d for d, h in zip(DU, BANG[quai])}


@pytest.mark.parametrize("nam,gioi,quai", [
    (1980, "nam", "Khôn"), (1980, "nu", "Tốn"), (1988, "nam", "Chấn"), (1988, "nu", "Chấn"),
    (1990, "nam", "Khảm"), (1990, "nu", "Cấn"), (2000, "nam", "Ly"), (2000, "nu", "Càn"),
    (1986, "nam", "Khôn"), (1995, "nam", "Khôn"), (1995, "nu", "Khảm"), (1981, "nu", "Cấn"), (1977, "nu", "Khảm"),
])
def test_menh_quai(nam, gioi, quai):
    assert pt.menh_quai(nam, gioi)["quai"] == quai


def test_lap_xuan_la_moc_nam():
    # sinh 01/02/1990 (trước Lập xuân 04/02/1990) → tính năm 1989 → nam Khôn
    a = pt.menh_quai(1990, "nam", dt.date(1990, 2, 1))
    b = pt.menh_quai(1990, "nam", dt.date(1990, 2, 10))
    assert (a["quai"], a["nam_tinh"], b["quai"]) == ("Khôn", 1989, "Khảm")


def test_nhom_dong_tay():
    assert pt.nhom("Khảm") == "Đông tứ mệnh" and pt.nhom("Càn") == "Tây tứ mệnh"


@pytest.mark.parametrize("huong,trach,nhom", [
    ("Nam", "Khảm", "Đông tứ trạch"), ("Bắc", "Ly", "Đông tứ trạch"), ("Đông Bắc", "Khôn", "Tây tứ trạch"),
    ("Tây", "Chấn", "Đông tứ trạch"),
])
def test_trach_theo_toa(huong, trach, nhom):
    t = pt.trach(huong)
    assert (t["toa"], t["quai"], t["nhom"]) == ({"Nam": "Bắc", "Bắc": "Nam", "Đông Bắc": "Tây Nam", "Tây": "Đông"}[huong], trach, nhom)


def test_cua_chu_bep():
    # Cửa Bắc (Khảm), phòng chủ Đông (Chấn), bếp Đông Nam (Tốn): cùng Đông tứ → các cặp đều cát
    k = pt.cua_chu_bep("Bắc", "Đông", "Đông Nam")
    assert [c["du_nien"] for c in k["cap"]] == ["Thiên Y", "Sinh Khí", "Diên Niên"]
    assert k["cung_nhom"] is True
    k2 = pt.cua_chu_bep("Bắc", "Tây", None)
    assert k2["cap"][0]["du_nien"] == "Hoạ Hại" and k2["cung_nhom"] is False


@pytest.mark.parametrize("nam,ngu_hoang,thai_tue,tue_pha,tam_sat", [
    (2018, "Bắc", "Tây Bắc", "Đông Nam", "Bắc"), (2019, "Tây Nam", "Tây Bắc", "Đông Nam", "Tây"),
    (2022, "Trung cung", "Đông Bắc", "Tây Nam", "Bắc"), (2024, "Tây", "Đông Nam", "Tây Bắc", "Nam"),
    (2026, "Nam", "Nam", "Bắc", "Bắc"),
])
def test_sao_nam(nam, ngu_hoang, thai_tue, tue_pha, tam_sat):
    s = pt.sao_nam(nam)
    assert (s["ngu_hoang"], s["thai_tue"], s["tue_pha"], s["tam_sat"]) == (ngu_hoang, thai_tue, tue_pha, tam_sat)


def test_tuoi_lam_nha_mau():
    # EN-1 DU-1: một bộ tính — tuổi làm nhà chỉ còn ở calc.tuoi_dan_gian (bản trùng trong calc.phongthuy đã gỡ).
    from app.luangiai import tuoi_dan_gian as tdg
    x = tdg.xem_tuoi_lam_nha(1990, 2026)            # Canh Ngọ, năm Bính Ngọ: tuổi mụ 37
    assert x["tuoi_mu"] == 37 and x["kim_lau"] and x["hoang_oc"]["ma"] == "tu_tan_tai" and x["tam_tai"] is None
    assert not hasattr(pt, "tuoi_lam_nha") and not hasattr(pt, "kim_lau")


@pytest.mark.parametrize("tuoi,kim_lau", [(37, True), (39, True), (42, True), (44, True), (38, False),
                                          (40, False), (45, False)])
def test_kim_lau(tuoi, kim_lau):
    from app.calc import tuoi_dan_gian as t
    assert bool(t.kim_lau(tuoi)) is kim_lau


@pytest.mark.parametrize("tuoi,cung", [(10, "nhat_cat"), (20, "nhi_nghi"), (30, "tam_dia_sat"), (40, "tu_tan_tai"),
                                       (50, "ngu_tho_tu"), (60, "luc_hoang_oc"), (37, "tu_tan_tai"),
                                       (41, "ngu_tho_tu"), (46, "tu_tan_tai")])
def test_hoang_oc(tuoi, cung):
    from app.calc import tuoi_dan_gian as t
    assert t.HOANG_OC[t.hoang_oc(tuoi)] == cung


@pytest.mark.parametrize("chi_sinh,nam,co", [("Ngọ", 2028, True), ("Ngọ", 2029, True), ("Ngọ", 2030, True),
                                             ("Ngọ", 2026, False), ("Tý", 2034, True), ("Mão", 2025, True)])
def test_tam_tai(chi_sinh, nam, co):
    from app.calc import tuoi_dan_gian as t
    assert bool(t.pham_tam_tai(chi_sinh, t.can_chi_nam(nam)[1])) is co


def test_api_menh_quai_danh_dau_huong_cat():
    # UI la bàn tô cát/hung theo dữ liệu engine, web không tự phân loại.
    from fastapi.testclient import TestClient
    from app.main import app

    r = TestClient(app).post("/v1/phongthuy/menh-quai", json={"birth_date": "1990-05-17", "gender": "nam"})
    d = r.json()
    assert r.status_code == 200 and d["quai"] == "Khảm"
    assert sorted(d["huong_cat"]) == sorted(["Bắc", "Đông", "Đông Nam", "Nam"])


def test_api_menh_quai_kem_nghia_du_nien_cho_la_ban_song():
    # UI-PT 1 "la bàn sống": web đọc tên du niên + ý nghĩa + "dùng cho" từ engine (KB du_nien) — không tự giữ bảng nghĩa.
    from fastapi.testclient import TestClient
    from app.main import app

    d = TestClient(app).post("/v1/phongthuy/menh-quai", json={"birth_date": "1990-05-17", "gender": "nam"}).json()
    y = d["du_nien_y"]
    assert set(y) == set(d["bang_huong"].values()) and len(y) == 8
    for ten, v in y.items():
        assert v["loai"] in ("cát", "hung") and v["y_nghia"] and v["dung_cho"]
        assert (v["loai"] == "cát") == (ten in {d["bang_huong"][h] for h in d["huong_cat"]})
