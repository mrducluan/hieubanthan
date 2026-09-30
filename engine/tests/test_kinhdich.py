# -*- coding: utf-8 -*-
"""Kinh Dịch tầng CALC — app.calc.kinhdich.

Hai lớp kiểm:
  1. Golden (fixtures/golden/kinhdich.json, sinh từ bản gốc gieoque.py): 64 quẻ
     + 10 ca biến chiêm phải khớp 100%.
  2. Bất biến ĐỘC LẬP với bản gốc — để golden không chỉ là "code tự so với
     chính nó":
       - Cặp King Wen: quẻ lẻ n và n+1 là tống quái của nhau; nếu tống quái
         trùng chính nó (quẻ đối xứng) thì là thác quái. Đây là tính chất toán
         học của thứ tự Văn Vương, kiểm được mà không cần tra sách.
       - Mỗi cung bát cung có đúng 8 quẻ, mỗi cung đúng 1 Bát thuần/Du hồn/Quy hồn.
       - Thế và ứng luôn cách nhau 3 hào.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import pytest

from app.calc import kinhdich

GOLDEN = json.loads(
    (Path(__file__).parents[1] / "fixtures" / "golden" / "kinhdich.json").read_text("utf-8")
)


@pytest.mark.parametrize("so", list(GOLDEN["que_64"]))
def test_golden_64_que(so: str) -> None:
    ca = GOLDEN["que_64"][so]
    out = kinhdich.khoi_que(ca["gia_tri_hao"])
    exp = ca["expect"]
    assert out["quai_ban"] == exp["quai_ban"]
    assert out["hao_dong"] == exp["hao_dong"] == []
    assert out["quai_bien"] is None
    for k in ("quai_ho", "quai_thac", "quai_tong"):
        assert out[k]["so_king_wen"] == exp[k]
    assert out["quy_tac_doc"] == exp["quy_tac_doc"]


@pytest.mark.parametrize("ca_id", list(GOLDEN["bien_chiem"]))
def test_golden_bien_chiem(ca_id: str) -> None:
    ca = GOLDEN["bien_chiem"][ca_id]
    assert kinhdich.khoi_que(ca["gia_tri_hao"]) == ca["expect"]


def _bits(so: int) -> tuple[int, ...]:
    return tuple(GOLDEN["que_64"][str(so)]["expect"]["quai_ban"]["bits_hao1_den_hao6"])


def test_cap_king_wen_tong_hoac_thac() -> None:
    for n in range(1, 64, 2):
        a, b = _bits(n), _bits(n + 1)
        tong = tuple(reversed(a))
        if tong != a:
            assert b == tong, f"quẻ {n}/{n + 1} không phải cặp tống quái"
        else:
            assert b == tuple(1 - x for x in a), f"quẻ {n}/{n + 1} không phải cặp thác quái"


def test_64_que_khac_nhau_va_du_so() -> None:
    so = {kinhdich.khoi_que([7 if b else 8 for b in _bits(n)])["quai_ban"]["so_king_wen"]
          for n in range(1, 65)}
    assert so == set(range(1, 65))


def test_bat_cung_cau_truc() -> None:
    cung = Counter()
    loai = Counter()
    for n in range(1, 65):
        bc = GOLDEN["que_64"][str(n)]["expect"]["quai_ban"]["bat_cung"]
        cung[bc["cung"]] += 1
        loai[(bc["cung"], bc["loai"])] += 1
        assert abs(bc["the"] - bc["ung"]) == 3
    assert set(cung.values()) == {8} and len(cung) == 8
    for c in cung:
        for l in ("Bát thuần", "Du hồn", "Quy hồn"):
            assert loai[(c, l)] == 1


def test_mot_hao_the_mot_hao_ung() -> None:
    for n in range(1, 65):
        hao = GOLDEN["que_64"][str(n)]["expect"]["quai_ban"]["hao"]
        assert [h["the_ung"] for h in hao].count("Thế") == 1
        assert [h["the_ung"] for h in hao].count("Ứng") == 1


@pytest.mark.parametrize("sai", [[7, 8, 7, 8, 7], [7, 8, 7, 8, 7, 8, 9], [5, 7, 7, 7, 7, 7],
                                 [7, 8, 7, 8, 7, 10]])
def test_dau_vao_sai_bi_tu_choi(sai: list[int]) -> None:
    with pytest.raises(ValueError):
        kinhdich.khoi_que(sai)


def test_ham_tinh_tat_dinh() -> None:
    v = [9, 6, 7, 8, 9, 7]
    assert kinhdich.khoi_que(v) == kinhdich.khoi_que(v)


def test_phan_phoi_the_phap_dung_bang_kinh_dien(monkeypatch) -> None:
    """Thệ pháp: lão dương 3/16, thiếu dương 5/16, thiếu âm 7/16, lão âm 1/16
    (bảng mục 3 skill kinh-dich). Duyệt đủ 16 giá trị randbelow(16)."""
    from app.calc import kinhdich_vendor as v
    dem = Counter()
    for r in range(16):
        monkeypatch.setattr(v.secrets, "randbelow", lambda n, r=r: r)
        dem[v.yarrow_ideal()] += 1
    assert dem == {9: 3, 7: 5, 8: 7, 6: 1}
