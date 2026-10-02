# -*- coding: utf-8 -*-
"""GN — Từ điển thuật ngữ dễ hiểu xuyên 5 mảng (chủ dự án yêu cầu 2026-10-02: mọi thuật ngữ / quẻ đã luận phải
có phần giải nghĩa bằng ngôn ngữ người thường). Test viết TRƯỚC.
"""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.kb import tu_dien
from app.main import app

client = TestClient(app)
MO_DUN = ("tuvi", "battu", "kinhdich", "phongthuy", "thanso")


def test_kho_du_va_dung_chuan():
    ds = tu_dien.tat_ca()
    assert len(ds) >= 200
    assert len({m["ma"] for m in ds}) == len(ds)
    for m in ds:
        assert m["mo_dun"] in MO_DUN and m["ten"] and len(m["de_hieu"]) >= 20, m["ma"]
    assert tu_dien.meta()["source_id"] and tu_dien.meta()["school_id"]
    for md in MO_DUN:
        assert len(tu_dien.tat_ca(md)) >= 10, md


@pytest.mark.parametrize("mo_dun,van,phai_co", [
    ("tuvi", "Cung Mệnh có Tử Vi (Miếu), gặp Hoá Kỵ và Tuần; đại hạn 25–34 ở Quan Lộc.",
     {"Cung Mệnh", "Tử Vi", "Miếu", "Hoá Kỵ", "Tuần", "Đại hạn", "Quan Lộc"}),
    ("battu", "Nhật chủ Nhâm thân nhược, dụng thần theo điều hậu là Thủy; Thiên Tài cách, kỵ Tỷ Kiên.",
     {"Nhật chủ", "Thân nhược", "Dụng thần", "Điều hậu", "Thiên Tài", "Tỷ Kiên"}),
    ("kinhdich", "Quẻ bản Lý, hào động ở hào 3, quẻ biến Càn. Đại Tượng dạy: vô cữu.",
     {"Quẻ bản", "Hào động", "Quẻ biến", "Đại Tượng", "Vô cữu"}),
    ("phongthuy", "Vận 9, cục Song tinh đáo hướng; sơn tinh 8, hướng tinh 9; hướng Sinh Khí.",
     {"Vận", "Song tinh đáo hướng", "Sơn tinh", "Hướng tinh", "Sinh Khí"}),
    ("thanso", "Số đường đời 5, năm cá nhân 9; có nợ nghiệp 14.", {"Số đường đời", "Năm cá nhân", "Nợ nghiệp"}),
])
def test_nhan_dien(mo_dun, van, phai_co):
    ten = {m["ten"] for m in tu_dien.nhan_dien(van, mo_dun)}
    assert phai_co <= ten, phai_co - ten


def test_dung_mo_dun_cho_thuat_ngu_trung_ten():
    tv = tu_dien.nhan_dien("Thất Sát đóng ở Mệnh.", "tuvi")
    bt = tu_dien.nhan_dien("Thất Sát lộ ở trụ tháng.", "battu")
    assert tv[0]["mo_dun"] == "tuvi" and bt[0]["mo_dun"] == "battu" and tv[0]["de_hieu"] != bt[0]["de_hieu"]


def test_khong_gach_tu_chung_va_khong_khop_giua_tu():
    ten = {m["ten"] for m in tu_dien.nhan_dien("Mỗi cung có quẻ và hào; chi tiêu hợp lý.", "tuvi")}
    assert not ({"Cung", "Quẻ", "Hào", "Địa chi"} & ten)
    assert tu_dien.nhan_dien("Bình thường thôi.", "tuvi") == []          # "Bình" là mức độ sáng nhưng không tự gạch


def test_moi_muc_tra_ve_dang_hien_thi_va_tu_khop():
    m = tu_dien.nhan_dien("Bạn có Hóa Lộc ở Tài Bạch.", "tuvi")
    loc = next(x for x in m if x["ten"] == "Hoá Lộc")
    assert "Hóa Lộc" in loc["khop"] and loc["de_hieu"] and loc["ma"]


def test_gioi_han_so_muc():
    van = " ".join(m["ten"] for m in tu_dien.tat_ca("tuvi"))
    assert len(tu_dien.nhan_dien(van, "tuvi")) <= tu_dien.TOI_DA


def test_api_tu_dien_va_hoi_tra_thuat_ngu():
    d = client.get("/v1/tu-dien").json()
    assert len(d["muc"]) >= 200 and d["nguon"]
    assert all(m["mo_dun"] == "kinhdich" for m in client.get("/v1/tu-dien?mo_dun=kinhdich").json()["muc"])
    r = client.post("/v1/tuvi/hoi", json={"cau_hoi": "Tham Lang ở cung Quan Lộc có ý nghĩa gì?"}).json()
    assert any(t["ten"] == "Tham Lang" for t in r["thuat_ngu"])
    r = client.post("/v1/battu/hoi", json={"cau_hoi": "Nhật chủ Giáp là người thế nào?"}).json()
    assert any(t["ten"] == "Nhật chủ" for t in r["thuat_ngu"])


def test_luan_giai_moi_chuong_co_thuat_ngu(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    la = {"birth_date": "1997-03-19", "birth_time": "00:30", "gender": "nam", "noi_sinh": "ha-noi"}
    d = client.post("/v1/tuvi/luan-giai", json={"la_so": la}).json()
    assert all("thuat_ngu" in c for c in d["chuong"])
    assert any(c["thuat_ngu"] for c in d["chuong"])
