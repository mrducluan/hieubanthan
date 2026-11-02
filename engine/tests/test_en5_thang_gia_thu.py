# -*- coding: utf-8 -*-
"""EN-5.1 (2026-11-02) — tháng "đại lợi / tiểu lợi" theo tuổi cô dâu (viết TRƯỚC `tuoi_dan_gian.thang_gia_thu` và phần
ghép trong `luangiai/chon_ngay_nhieu.py`).

Nguồn: Hiệp Kỷ Biện Phương Thư q.36 (quy tắc đọc thẳng nguyên văn) — golden `fixtures/golden/thang_gia_thu.json` tính tay.
Sách gốc bác thuyết này → hệ thống chỉ hiện làm THÔNG TIN TẬP QUÁN: không đổi thứ tự ngày, không loại ngày, không đưa
bốn nhóm tháng "phương …" (lời doạ). So sánh 3 phương án: docs/QUYET-DINH-EN5-EN6.md."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import hoang_lich as hl
from app.calc import tuoi_dan_gian as t
from app.luangiai import chon_ngay_nhieu as cn

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "thang_gia_thu.json").read_text(encoding="utf-8"))
CUOI = [{"vai": "co_dau", "nam_sinh": 1998}, {"vai": "chu_re", "nam_sinh": 1996}]   # cô dâu Mậu Dần
TU, DEN = dt.date(2027, 1, 1), dt.date(2027, 12, 31)


@pytest.mark.parametrize("chi", list(G["bang"]))
def test_khop_golden(chi):
    kq = t.thang_gia_thu(chi)
    assert kq["dai_loi"] == G["bang"][chi]["dai_loi"]
    assert kq["tieu_loi"] == G["bang"][chi]["tieu_loi"]
    # tên chi tháng (nguyệt kiến): tháng 1 = Dần … tháng 12 = Sửu
    assert kq["dai_loi_chi"] == [t.CHI[(m + 1) % 12] for m in kq["dai_loi"]]


def test_bang_la_hinh_vuong_latin():
    """Mỗi tuổi chia 12 tháng thành 6 cặp; theo cột, mỗi cặp tháng đại lợi / tiểu lợi xuất hiện đúng hai tuổi (xung nhau)."""
    for k in ("dai_loi", "tieu_loi"):
        dem = {}
        for chi in t.CHI:
            dem.setdefault(tuple(t.thang_gia_thu(chi)[k]), []).append(chi)
        assert len(dem) == 6 and all(len(v) == 2 for v in dem.values())
        for a, b in dem.values():
            assert (t.CHI.index(a) - t.CHI.index(b)) % 12 == 6
    for chi in t.CHI:
        x = t.thang_gia_thu(chi)
        assert not set(x["dai_loi"]) & set(x["tieu_loi"])
        assert x["dai_loi"][1] - x["dai_loi"][0] == 6


@pytest.fixture(scope="module")
def kq():
    return cn.chon("cuoi_hoi", TU, DEN, CUOI)


def test_chon_ngay_co_khoi_tham_khao(kq):
    g = kq["thang_gia_thu"]
    assert g["co_dau"]["con_giap"] == "Dần"
    assert g["dai_loi"] == [2, 8] and g["tieu_loi"] == [3, 9]
    assert "Hiệp Kỷ Biện Phương Thư" in g["nguon"]
    assert "không" in g["loi"] and "xếp" in g["loi"]          # nói rõ không dùng để xếp / loại ngày


def test_gan_nhan_tung_ngay_theo_thang_tiet(kq):
    g = kq["thang_gia_thu"]
    for n in kq["ngay"]:
        chi_thang = t.CHI[hl.ZHI.index(cn.L._calc(dt.date.fromisoformat(n["ngay"]))["thang_gz"][1])]
        mong = "dai_loi" if chi_thang in g["dai_loi_chi"] else "tieu_loi" if chi_thang in g["tieu_loi_chi"] else None
        assert n.get("gia_thu") == mong, n["ngay"]
    assert any(n.get("gia_thu") == "dai_loi" for n in kq["ngay"])


def test_khong_doi_thu_tu_khong_loai_ngay(kq):
    """Phương án B: nhãn không vào khoá xếp, không loại ngày — danh sách và thứ tự như khi không có nhãn."""
    ngay = kq["ngay"]
    khoa = lambda n: (bool(n["luu_y"]), -len(n["hop"]) - len(n["diem_cong"]), n["ngay"])  # noqa: E731
    assert [n["ngay"] for n in kq["ngay_noi_bat"]] == [n["ngay"] for n in sorted(ngay, key=khoa)[:6]]
    for th in kq["thang"]:
        trong = [n for n in ngay if n["ngay"].startswith(th["thang"])]
        assert [n["ngay"] for n in th["ngay"]] == sorted(n["ngay"] for n in sorted(trong, key=khoa)[:3])
    assert all(not any("lợi" in y for y in n["luu_y"]) for n in ngay)


def test_khong_co_dau_thi_khong_co_khoi():
    k = cn.chon("cuoi_hoi", dt.date(2027, 3, 1), dt.date(2027, 3, 31), [{"vai": "chu_re", "nam_sinh": 1996}])
    assert k.get("thang_gia_thu") is None and all("gia_thu" not in n for n in k["ngay"])
    k = cn.chon("khai_truong", dt.date(2027, 3, 1), dt.date(2027, 3, 31), [{"vai": "chu", "nam_sinh": 1990}])
    assert k.get("thang_gia_thu") is None


def test_loi_khong_doa(kq):
    g = kq["thang_gia_thu"]
    chu = g["loi"] + " " + g["nguon"] + " " + " ".join(g["nhan"].values())
    for c in ("mai mối", "bố mẹ chồng", "kỵ", "hại", "khắc", "chết", "tai", "xui", "cúng", "giải hạn"):
        assert c not in chu.lower(), c
    assert "chua_xet" not in kq or "đại lợi" not in (kq.get("chua_xet") or "")
