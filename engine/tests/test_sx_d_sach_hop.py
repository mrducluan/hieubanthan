# -*- coding: utf-8 -*-
"""SX-D (2026-11-24): câu Toàn Thư đi cùng hộp luận báo cáo Tử vi đời sống.

Khoá: câu gắn vào hộp đi qua ĐÚNG bộ chọn của khối "Sách xưa ghi" (một nguồn), khớp kho nguồn, mỗi câu một lần, tuổi
dưới 18 không nhận nhóm C, bản Anh không có, và báo cáo bỏ trường `sach` thì y hệt báo cáo khi tắt lớp này (không đổi
mức, nội dung, mã kiểm chứng)."""
from __future__ import annotations

import copy
import datetime as dt
import json
from pathlib import Path

import pytest

from app import ngon_ngu
from app.kb import sach_ghi as sg
from app.luangiai import sach_ghi_mon as sm, sach_hop, tuvi_doi_song as tds

NGAY_XEM = dt.date(2026, 11, 24)
KB = json.loads((Path(__file__).resolve().parents[1] / "app/kb/data/tuvi_sach_ghi.json").read_text("utf-8"))["muc"]
HAN_KB = {m["han"]: m for cs in KB.values() for ds in cs.values() for m in ds}
LA = [({"ngay": dt.date(y, m, 17), "ti": ti, "gioi_tinh": "nu" if y % 2 else "nam"})
      for y, m, ti in [(1960, 3, 0), (1972, 7, 4), (1985, 1, 8), (1988, 10, 5), (1993, 5, 2), (1999, 12, 10),
                       (1979, 9, 6), (1966, 2, 11)]]


def _sach(bc):
    return [(ch["ma"], h, x) for ch in bc["chuong"] for h in ch["hop"] for x in h.get("sach") or []]


@pytest.fixture(scope="module")
def bao_cao():
    return [tds.lap(s, NGAY_XEM) for s in LA]


def test_co_cau_sach_va_khop_kho(bao_cao):
    tong = 0
    for bc in bao_cao:
        da = set()
        for _, h, x in _sach(bc):
            tong += 1
            m = HAN_KB[x["han"]]                                   # trỏ về đúng mục KB (một nguồn)
            assert sg.chuan(m["han"]) in sg.van_nguon(m["nguon"])
            assert sach_hop._NHOM_HOP[x["nhom"]] == h["loai"]
            assert x["han"] not in da, "một câu sách chỉ hiện một lần trong bài"
            da.add(x["han"])
            assert len(h["sach"]) <= sach_hop.TOI_DA_MOI_HOP
    assert tong >= 20


def test_khong_doi_phan_con_lai(monkeypatch):
    s = LA[3]
    co = tds.lap(s, NGAY_XEM)
    monkeypatch.setattr(sach_hop, "gan_tuvi", lambda *a, **k: 0)
    khong = tds.lap(s, NGAY_XEM)

    def bo(x):
        x = copy.deepcopy(x)
        for ch in x["chuong"]:
            for h in ch["hop"]:
                h.pop("sach", None)
        return x
    assert bo(co) == khong


def test_duoi_18_khong_nhom_c():
    bc = tds.lap({"ngay": dt.date(2012, 4, 9), "ti": 3, "gioi_tinh": "nam"}, NGAY_XEM)
    assert all(x["nhom"] != "C" for _, _, x in _sach(bc))


def test_ban_anh_khong_co():
    with ngon_ngu.dung("en"):
        bc = tds.lap(LA[3], NGAY_XEM)
    assert not _sach(bc)


def test_cau_mieu_chi_khi_sao_mieu_vuong():
    m = [x for x in KB["Thái Dương"]["Điền Trạch"] if "入庙" in x["han"]]
    assert m
    for ds, co in (("Miếu", True), ("Vượng", True), ("Đắc", False), ("Bình", False), ("Hãm", False)):
        ra = sm.chon_tuvi_sao("Thái Dương", "Điền Trạch", ds, {"Thái Dương"}, set(), "Mão")
        assert any("入庙" in x["han"] for x, _ in ra) is co, ds


def test_sao_dung_mot_minh():
    """«武曲单居旺地得祖父大业» chỉ khi Vũ Khúc đứng một mình ở cung."""
    mot = sm.chon_tuvi_sao("Vũ Khúc", "Điền Trạch", "Miếu", {"Vũ Khúc"}, set(), "Thìn")
    doi = sm.chon_tuvi_sao("Vũ Khúc", "Điền Trạch", "Miếu", {"Vũ Khúc", "Thiên Phủ"}, set(), "Thìn")
    assert any("单居" in x["han"] for x, _ in mot)
    assert not any("单居" in x["han"] for x, _ in doi)


def test_doi_chieu_hop_le():
    n = 0
    for m in HAN_KB.values():
        dc = m.get("doi_chieu")
        if not dc:
            continue
        n += 1
        assert dc["o"] in ("sang", "ham")
        assert 0 < len(dc["khac"]) <= 230
        assert not sg.kiem_loi(dc["khac"]), dc["khac"]
        assert "Sách xưa nói" in dc["khac"]
    assert n >= 10


def test_khac_chi_hien_dung_o():
    m = next(x for x in HAN_KB.values() if x.get("doi_chieu"))
    o = m["doi_chieu"]["o"]
    assert "khac" in sach_hop.muc_hop(m, "x", o)
    assert "khac" not in sach_hop.muc_hop(m, "x", "ham" if o == "sang" else "sang")
