# -*- coding: utf-8 -*-
"""Chỉ tay (Thần Tướng Toàn Biên quyển 10) — KB `chi_tay_kb.json` + route `/v1/chi-tay`.

Khoá: mọi bài thơ vân và câu sách của đồ hình là nguyên văn kho nguồn; khuôn SX-C; ảnh WebP có thật, khớp kích thước;
người chưa rõ tuổi / dưới 18 không nhận nhóm C; nhóm C không mang phiên âm; không tên nội bộ (BM-1).
"""
from __future__ import annotations

import json
import re
import struct
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.kb import chi_tay_kb as kb
from app.kb import sach_ghi
from app.main import app

GOC = Path(__file__).resolve().parents[2]
ANH_VAN = GOC / "web" / "public" / "anh" / "chi-tay" / "van"
ANH_DH = GOC / "web" / "public" / "anh" / "do-hinh"
DATA = GOC / "engine" / "app" / "kb" / "data" / "chi_tay_kb.json"
NGUON = "than_tuong_toan_bien"


def _webp(p: Path) -> tuple[int, int]:
    b = p.read_bytes()
    assert b[:4] == b"RIFF" and b[8:12] == b"WEBP", p.name
    loai = b[12:16]
    if loai == b"VP8 ":
        w, h = struct.unpack("<HH", b[26:30])
        return w & 0x3FFF, h & 0x3FFF
    if loai == b"VP8L":
        v = struct.unpack("<I", b[21:25])[0]
        return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
    return int.from_bytes(b[24:27], "little") + 1, int.from_bytes(b[27:30], "little") + 1


def test_moi_muc_qua_bo_kiem_sx_c():
    n, loi = sach_ghi.kiem_tep(DATA)
    assert n >= 60 and loi == [], loi[:5]


def test_moi_cau_la_nguyen_van():
    van = sach_ghi.van_nguon(NGUON)
    for m in kb.ds_van():
        assert sach_ghi.chuan(m["han"]) in van, m["ma"]
        assert re.fullmatch(r"[一-鿿]+紋", m["ten_han"]), m["ma"]
    for p in kb._d()["do_hinh"]["diem"]:
        s = p.get("sach_ghi")
        if s:
            assert sach_ghi.chuan(s.get("han_kho") or s["han"]) in van, p["id"]
            assert sach_ghi.kiem_loi(s["y"]) == [], (p["id"], sach_ghi.kiem_loi(s["y"]))


def test_ma_duy_nhat_anh_co_that():
    ma = [m["ma"] for m in kb.ds_van()]
    assert len(ma) == len(set(ma)) == 66
    for m in kb.ds_van():
        assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", m["ma"])
        p = ANH_VAN / m["anh"]
        assert p.exists() and _webp(p) == (m["rong"], m["cao"]) and p.stat().st_size <= 60_000, m["ma"]
    d = kb._d()["do_hinh"]
    assert _webp(ANH_DH / d["tep"]) == (d["rong"], d["cao"])


def test_do_hinh_toa_do_va_nhom():
    d = kb._d()["do_hinh"]
    nhom = {n["ma"] for n in d["nhom"]}
    ids = set()
    for p in d["diem"]:
        assert p["id"] not in ids and p["nhom"] in nhom
        ids.add(p["id"])
        x, y = p["vt"]
        assert 0 < x < 1 and 0 < y < 1
        assert sach_ghi.kiem_loi(p["y"]) == [] and len(p["y"]) <= 220 and len(p["ten"]) <= 50
        assert p.get("muc") in (None, "A", "B", "C")
        if p.get("muc") == "C":
            assert p["sach_ghi"]["y"].startswith("Sách xưa có nhắc") and "Nên" in p["sach_ghi"]["y"]
    assert {p["nhom"] for p in d["diem"]} == nhom


def test_doc_bo_nhom_c_khi_chua_ro_tuoi():
    c = next(m["ma"] for m in kb.ds_van() if m["nhom"] == "C")
    a = next(m["ma"] for m in kb.ds_van() if m["nhom"] == "A")
    r = kb.doc([c, a], None)
    assert [m["ma"] for m in r["muc"]] == [a] and r["bo_nhom_c"] == 1
    assert kb.doc([c, a], 15)["bo_nhom_c"] == 1
    r = kb.doc([c, a], 30)
    # SX-C3 (2026-11-24): nhóm C nói sát nguyên văn — kèm âm Hán Việt và câu kết "chỉ trích lại"
    assert [m["ma"] for m in r["muc"]] == [a, c] and r["cau_ket"].startswith(sach_ghi.CAU_KET_TRICH)
    assert r["muc"][1]["am"]
    assert r["muc"][1]["loi"].startswith("Sách xưa ghi nguyên văn")


def test_khong_dua_vao_6_hinh_doan_nguoi_khac():
    ten = {m["ten_han"] for m in kb.ds_van()}
    for x in kb._d()["khong_dua_vao"]:
        assert x["ten_han"] not in ten or x["ten_han"] == "華蓋紋"
    assert len(kb._d()["khong_dua_vao"]) == 6


@pytest.fixture(scope="module")
def may():
    return TestClient(app)


def test_route_thu_vien(may):
    r = may.get("/v1/chi-tay")
    assert r.status_code == 200
    j = r.json()
    assert len(j["van"]) == 66 and j["do_hinh"]["ma"] == "bat-quai-ban-tay"
    chu = json.dumps(j, ensure_ascii=False)
    assert not re.search(r"wikisource|sqlite|drive|SXQB|YLZ|\.png|han_kho|_nguon", chu, re.I)
    # SX-C3: câu A và câu B / C nói sát nguyên văn (`sat`) có âm Hán Việt; câu chưa viết lại thì không
    assert all(v["am"] for v in j["van"] if v["nhom"] == "A")
    assert all(v["loi"].startswith("Sách xưa ghi nguyên văn") for v in j["van"] if v["nhom"] != "A" and v.get("am"))


def test_route_doc(may):
    r = may.post("/v1/chi-tay/doc", json={"van": ["bai-tuong", "sac-duc"], "ngay_sinh": "1990-05-01"})
    assert r.status_code == 200 and [m["ma"] for m in r.json()["muc"]] == ["bai-tuong", "sac-duc"]
    r = may.post("/v1/chi-tay/doc", json={"van": ["bai-tuong", "sac-duc"]})
    assert [m["ma"] for m in r.json()["muc"]] == ["bai-tuong"] and r.json()["bo_nhom_c"] == 1
    assert may.post("/v1/chi-tay/doc", json={"van": ["../x"]}).status_code == 422
    assert may.post("/v1/chi-tay/doc", json={"van": []}).status_code == 422


def test_thu_vien_cau_ket_suc_khoe_va_nhom_c_khong_am():
    tv = kb.thu_vien()
    assert sach_ghi.CAU_KET_SUC_KHOE in tv["cau_ket"]
    assert all(v["loi"].startswith("Sách xưa ghi nguyên văn") for v in tv["van"] if v["nhom"] == "C" and v.get("am"))   # SX-C3
    assert all(v.get("a_phu_dinh") is None for v in tv["van"])          # cờ duyệt nội bộ không ra API


def test_duong_chi_cau_hoi_va_cau_sach(may):
    tv = kb.thu_vien()["duong_chi"]
    assert {c["ma"] for c in tv["cau"]} == {"ba_duong", "do_sau", "duong_doc", "van_nho"}
    assert "sach" not in json.dumps(tv)                       # câu sách chỉ trả khi người dùng chọn
    r = may.post("/v1/chi-tay/doc", json={"duong": {"ba_duong": "lien", "van_nho": "bam"}})
    j = r.json()
    assert r.status_code == 200 and [m["ma"] for m in j["muc_duong"]] == ["ba-duong-sach", "van-bam-hua-phu", "van-bam-luan-chuong"]
    assert all({"cau", "lua_chon", "loi"} <= set(m) for m in j["muc_duong"])
    assert may.post("/v1/chi-tay/doc", json={"duong": {"ba_duong": "x"}}).status_code == 422
    assert may.post("/v1/chi-tay/doc", json={"duong": {}}).status_code == 422
