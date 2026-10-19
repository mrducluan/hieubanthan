# -*- coding: utf-8 -*-
"""TS-NOIDAU — "giao điểm hai phái": cùng một số 13/14/16/19 mà Pitago gọi là nợ nghiệp, Chaldea đọc là số kép
(port ý tưởng cross_school_graph của bản V3, chỉ giữ cạnh có thật giữa hai phái sản phẩm đang dùng).
"""
from __future__ import annotations

import json
from pathlib import Path

from app.calc import thanso_chaldean as ch, thanso_mo_rong as mr
from app.luangiai import thanso_chaldean as lch

KB = json.loads((Path(__file__).parents[1] / "app/kb/data/thanso_doi_chieu.json").read_text(encoding="utf-8"))


def test_kb_du_bon_so_va_nguon():
    assert KB["source_id"] and KB["school_id"] and KB["trang_thai"]
    assert set(KB["so"]) == {"13", "14", "16", "19"}
    for m in KB["so"].values():
        assert m["pitago"] and m["chaldea"] and m["cach_dung"] and m["tu_soi"].endswith("?")


def test_ngay_19_ca_hai_phai_cung_so():
    # Ngày sinh 19: tổng thô như nhau ở hai phái → Pitago nợ nghiệp 19/1, Chaldea kép 19.
    kq = lch.luan_chaldea(["Nguyễn Văn An"], 19, 5, 1990)
    gd = {g["ma"]: g for g in kq["giao_diem"]}
    assert gd["ngay_sinh"]["pitago_no_nghiep"] == 19 and gd["ngay_sinh"]["chaldea_kep"] == 19
    assert gd["ngay_sinh"]["cung_so"] is True
    assert gd["ngay_sinh"]["nghia"]["pitago"]


def test_khop_calc_tung_vi_tri():
    for ten, d, m, y in [("Trần Thị Bích Ngọc", 13, 4, 1985), ("Lê Minh", 16, 7, 2001), ("Nguyễn Đức Luân", 24, 10, 1988)]:
        kq = lch.luan_chaldea([ten], d, m, y)
        no = {x["vi_tri"]: x["so"] for x in mr.no_nghiep(ten, d, m, y)}
        so = ch.tinh(ten, d, m, y)
        for g in kq["giao_diem"]:
            k = lch.VI_TRI_PITAGO[g["ma"]]
            assert g["pitago_no_nghiep"] == no.get(k)
            assert g["chaldea_kep"] == (so[g["ma"]]["kep"] if so[g["ma"]]["kep"] in (13, 14, 16, 19) else None)
            assert g["pitago_no_nghiep"] or g["chaldea_kep"]


def test_khong_co_giao_diem_thi_rong():
    kq = lch.luan_chaldea(["Nguyễn Đức Luân"], 24, 10, 1988)
    assert isinstance(kq["giao_diem"], list)
