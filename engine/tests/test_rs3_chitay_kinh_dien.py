# -*- coding: utf-8 -*-
"""RS-3 — kho Chỉ tay phương Tây kinh điển (`chitay_phuong_tay_kinh_dien.json`): câu trích có thật, lời không phán.

Khoá:
  - mọi `sach_ghi.trich` là CHUỖI CON (chuẩn hoá khoảng trắng) của kho nguồn ứng với sách ghi ở `nguon`
    (Cheiro, Palmistry for All 1916 · Mrs. J. B. Dale, Indian Palmistry 1895 — bản Project Gutenberg);
  - kho nguồn đủ khuôn kho nguồn tiếng Anh (`can_doi_chieu`, `chuong[].doan`), không còn vỏ giấy phép Gutenberg;
  - lời Việt không tên bệnh, không tuổi / tuổi thọ, không "sẽ"; câu trích không nói sống chết / bệnh;
  - đầu ra phái Tây `/v1/chi-tay/doc`: đường / gò đang có mang `kinh_dien` (một lần mỗi đường / gò), bản Anh không có.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.kb import tuong_hoc_dot4_kb as d4
from app.main import app

NGUON = Path(__file__).resolve().parents[1] / "fixtures" / "nguon"
KHO = {"Palmistry for All": "chi_tay_cheiro_palmistry_for_all", "Indian Palmistry": "chi_tay_dale_indian_palmistry"}
CAM_VI = ("bệnh", "ốm", "tuổi thọ", "sống lâu", "chết", "qua đời", "yểu", " sẽ ", "tuổi", "sức khoẻ", "sức khỏe", "tai nạn")
CAM_EN = re.compile(r"\b(death|die[sd]?|length of life|illness|disease|health|sick\w*|fatal\w*)\b", re.I)


def _chuan(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip()


@pytest.fixture(scope="module")
def van() -> dict[str, str]:
    ra = {}
    for ten, tep in KHO.items():
        d = json.loads((NGUON / f"{tep}.json").read_text("utf-8"))
        ra[ten] = _chuan(" ".join(p for c in d["chuong"] for p in c["doan"]))
    return ra


def _moi_muc():
    kb = d4.chitay_phuong_tay()
    for nhom in ("duong_chinh", "bay_go"):
        for ma, m in kb[nhom].items():
            yield f"{nhom}.{ma}", m


@pytest.mark.parametrize("tep", list(KHO.values()))
def test_kho_nguon_du_khuon(tep):
    d = json.loads((NGUON / f"{tep}.json").read_text("utf-8"))
    assert d["can_doi_chieu"] is True and d["ngon_ngu"] == "en" and d["mang"] == "chi_tay" and d["source_id"] == tep
    assert "Phạm vi công cộng" in d["_nguon"] and d["so_chu"] > 5000
    van = " ".join(p for c in d["chuong"] for p in c["doan"])
    assert "Project Gutenberg License" not in van and "[Illustration" not in van


def test_moi_cau_trich_la_chuoi_con_kho_nguon(van):
    so = 0
    for ma, m in _moi_muc():
        sg = m.get("sach_ghi")
        if not sg:
            continue
        sach = next((t for t in KHO if t in sg["nguon"]), None)
        assert sach, f"{ma}: nguồn không thuộc kho nào: {sg['nguon']}"
        assert _chuan(sg["trich"]) in van[sach], (ma, sg["trich"])
        so += 1
    assert so == 11


def test_loi_khong_phan():
    for ma, m in _moi_muc():
        for k in ("mat_tich_cuc", "mat_tieu_cuc_can_chu_y"):
            s = f" {m[k].lower()} "
            assert not [c for c in CAM_VI if c in s], (ma, k, m[k])
        assert m["mat_tieu_cuc_can_chu_y"].startswith("Nên chú ý"), ma
        if m.get("sach_ghi"):
            assert not CAM_EN.search(m["sach_ghi"]["trich"]), ma


def test_doc_phai_tay_co_kinh_dien():
    c = TestClient(app)
    r = c.post("/v1/chi-tay/doc", json={"phai": "tay", "go": {"jupiter": "day", "venus": "trung"},
                                       "duong": {"sinh_cong": "rong", "sinh_dau": "dinh", "tri_huong": "thang"}})
    assert r.status_code == 200, r.text
    muc = r.json()["muc"]
    kd = [m["kinh_dien"] for m in muc if m.get("kinh_dien")]
    ten = sorted(k["ma"] for k in kd)
    assert len(ten) == len(set(ten)), "mỗi đường / gò chỉ một khối kinh điển"
    assert {"moc_tinh", "kim_tinh", "sinh_dao"} <= set(ten)
    for k in kd:
        assert k["mat_tich_cuc"] and k["mat_tieu_cuc_can_chu_y"] and k["trich"] and k["nguon"]
    r_en = c.post("/v1/chi-tay/doc?ngon_ngu=en", json={"phai": "tay", "go": {"jupiter": "day"}})
    if r_en.status_code == 200:
        assert not any(m.get("kinh_dien") for m in r_en.json()["muc"])
