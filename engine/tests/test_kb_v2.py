# -*- coding: utf-8 -*-
"""Chuẩn chất lượng KB thần số v2 — luật của skill .claude/skills/thanso-kb.

Thêm/sửa nội dung KB mà làm đỏ file này = nội dung chưa đạt chuẩn.
"""
from __future__ import annotations

import itertools
import json
import re
from pathlib import Path

import pytest

D = Path(__file__).parents[1] / "app" / "kb" / "data"
SO = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33"]
# Giọng phán quyết / tiên đoán / gây sợ — cấm trong nội dung KB.
CAM = [r"bạn sẽ", r"chắc chắn sẽ", r"định mệnh", r"số phận", r"không thể tránh", r"bẩm sinh",
       r"vốn dĩ", r"lời nguyền", r"xui xẻo", r"đại hạn", r"tai hoạ", r"chết", r"phá sản"]
CAM_TRU = {"thanso_xu_ly.json", "thanso_giai_thich.json"}   # mẫu xử lý phải nói tới các từ này


def _doc(ten):
    return json.loads((D / ten).read_text(encoding="utf-8"))


def _chuoi(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for v in x.values():
            yield from _chuoi(v)
    elif isinstance(x, list):
        for v in x:
            yield from _chuoi(v)


@pytest.mark.parametrize("ten", ["thanso_linh_vuc.json", "thanso_cap_so.json", "thanso_bieu_do.json",
                                 "thanso_chi_so_phu.json", "thanso_giai_thich.json", "thanso_xu_ly.json"])
def test_co_nguon_truong_phai_trang_thai(ten):
    d = _doc(ten)
    assert d["source_id"] and d["school_id"]
    assert d["trang_thai"] in ("nhap_ai", "da_duyet")
    assert d["source"]["id"] == d["source_id"]


def test_linh_vuc_du_12_so_moi_linh_vuc():
    d = _doc("thanso_linh_vuc.json")
    assert sorted(d["noi_dung"], key=int) == SO
    for so in SO:
        assert set(d["noi_dung"][so]) == set(d["linh_vuc"]), so


def test_moi_muc_co_mat_toi_va_cau_tu_soi():
    d = _doc("thanso_linh_vuc.json")
    for so, cac in d["noi_dung"].items():
        for lv, m in cac.items():
            for k in ("xu_huong", "mat_toi", "goi_y", "cau_tu_soi"):
                assert len(m[k].strip()) >= 15, (so, lv, k)
            assert m["cau_tu_soi"].rstrip().endswith("?"), (so, lv)


def test_xu_huong_dung_giong_tham_khao():
    """Xu hướng phải là mô tả truyền thống ('thường', 'được mô tả'), không khẳng định."""
    d = _doc("thanso_linh_vuc.json")
    for so, cac in d["noi_dung"].items():
        for lv, m in cac.items():
            assert re.search(r"thường|được mô tả|hay là|hay nhận", m["xu_huong"]), (so, lv)


def test_du_45_cap():
    cap = _doc("thanso_cap_so.json")["cap"]
    can = {f"{a}-{b}" for a, b in itertools.combinations_with_replacement(range(1, 10), 2)}
    assert set(cap) == can
    for k, m in cap.items():
        assert all(len(m[f]) >= 15 for f in ("hoa", "va", "cung_lam")), k


def test_bieu_do_va_chi_so_phu_du():
    bd = _doc("thanso_bieu_do.json")
    assert set(bd["o_so"]) == {str(i) for i in range(1, 10)}
    assert len(bd["mui_ten_du"]) == 8 and len(bd["mui_ten_trong"]) == 8
    phu = _doc("thanso_chi_so_phu.json")
    assert set(phu["ngay_sinh"]) == {str(i) for i in range(1, 32)}
    assert set(phu["no_nghiep"]) == {"13", "14", "16", "19"}
    assert set(phu["thang_ca_nhan"]) == set(phu["ngay_ca_nhan"]) == {str(i) for i in range(1, 10)}


@pytest.mark.parametrize("ten", ["thanso_linh_vuc.json", "thanso_cap_so.json",
                                 "thanso_bieu_do.json", "thanso_chi_so_phu.json"])
def test_khong_giong_phan_quyet(ten):
    vi_pham = [(c, s[:60]) for s in _chuoi(_doc(ten)) for c in CAM if re.search(c, s.lower())]
    assert vi_pham == []


def test_giai_thich_tu_khoa_khong_dau():
    for ma, m in _doc("thanso_giai_thich.json")["muc"].items():
        for tk in m["tu_khoa"]:
            assert tk == tk.lower() and not re.search(r"[À-ỹđ]", tk), (ma, tk)
