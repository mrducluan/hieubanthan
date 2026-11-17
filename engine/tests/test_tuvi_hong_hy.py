# -*- coding: utf-8 -*-
"""LH-1 — Hồng Loan / Thiên Hỷ theo chi năm (dùng cho "năm có duyên gặp gỡ, cưới hỏi"). Test viết trước hàm.

Golden tính tay theo khẩu quyết "Hồng Loan: năm Tý ở Mão, đi nghịch; Thiên Hỷ ở cung đối" + đối chứng 1.000 lá engine an
(vị trí Hồng Loan, Thiên Hỷ GỐC của lá số = cùng công thức với chi năm sinh)."""
from __future__ import annotations

from app.calc import tuvi_hong_hy as hh
from app.hoidap.tuvi import tom_tat
from tests._tuvi_1000 import la_1000

TAY = {"Tý": ("Mão", "Dậu"), "Sửu": ("Dần", "Thân"), "Dần": ("Sửu", "Mùi"), "Mão": ("Tý", "Ngọ"),
       "Thìn": ("Hợi", "Tỵ"), "Tỵ": ("Tuất", "Thìn"), "Ngọ": ("Dậu", "Mão"), "Mùi": ("Thân", "Dần"),
       "Thân": ("Mùi", "Sửu"), "Dậu": ("Ngọ", "Tý"), "Tuất": ("Tỵ", "Hợi"), "Hợi": ("Thìn", "Tuất")}


def test_bang_tinh_tay():
    for chi, (hong, hy) in TAY.items():
        assert hh.hong_loan(chi) == hong and hh.thien_hy(chi) == hy, chi


def test_khop_vi_tri_goc_1000_la():
    for la in la_1000():
        chi_nam = la["chineseDate"].split(" - ")[0].split()[-1]
        ls = tom_tat(la)
        vi = {s: c["chi"] for c in ls["cung"] for s in c["phu_tinh"] if s in ("Hồng Loan", "Thiên Hỷ")}
        assert vi == {"Hồng Loan": hh.hong_loan(chi_nam), "Thiên Hỷ": hh.thien_hy(chi_nam)}, la["solarDate"]


def test_nam_hy_tra_cung_cua_la_so():
    ls = tom_tat(la_1000()[0])
    ra = hh.nam_hy(ls["cung"], 2026, 10, ("Mệnh", "Phu Thê"))
    assert all(2026 <= x["nam"] <= 2035 and x["cung"] in ("Mệnh", "Phu Thê") and x["sao"] in ("Hồng Loan", "Thiên Hỷ")
               for x in ra)
    # 12 chi quay một vòng: trong 10 năm liền, mỗi sao tới mỗi cung nhiều nhất một lần
    assert len({(x["sao"], x["cung"]) for x in ra}) == len(ra)
