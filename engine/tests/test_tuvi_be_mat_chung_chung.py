# -*- coding: utf-8 -*-
"""Rà chung chung đợt 2 (`docs/LUAN-GIAI-DOI-SONG.md` mục 7) — chặn tái phạm ở ba bề mặt NGOÀI bài luận giải:
thẻ "đường bay nổi bật" (phi hoá), lời giải nghĩa chính tinh trên thẻ 12 cung, câu trả lời hỏi đáp "Cung X của tôi
nói gì?". Đo bằng `scripts/do_chung_chung_tuvi.py --be-mat` trên 16 lá golden (mỗi lá thứ 4 của `lasotuvi_60.json`).

Số lúc chốt (60 lá): phi hoá Barnum 7 → 0, thuật ngữ 13,5 → 0 câu/lá; thẻ cung Barnum 28 → 0, trùng giữa lá
0,82 → 0,03; hỏi đáp Barnum 76 → 0, thuật ngữ 77 → 0 câu/lá, cụm cấm 4,9 → 0.
Ngưỡng: không câu nào có ở ≥ 50% số lá; không câu nào lộ tên sao / tên cung kỹ thuật / tứ hoá / độ sáng (chúng chỉ
ở `can_cu`); không cụm chung chung, không cụm cấm giọng AI; trùng giữa hai lá khác hẳn trung bình ≤ 0,15.
"""
from __future__ import annotations

import pytest

from scripts import do_chung_chung_tuvi as do


@pytest.fixture(scope="module")
def so():
    return do.do_be_mat(do.chon_la(True)[::4], chi_tiet=True)


@pytest.mark.parametrize("mat", ["phi_hoa", "the_cung", "hoi_dap"])
def test_khong_cau_barnum(so, mat):
    assert so[f"{mat}_barnum"] == 0, so.get(f"_{mat}_barnum")


@pytest.mark.parametrize("mat", ["phi_hoa", "the_cung", "hoi_dap"])
def test_khong_thuat_ngu_ngoai_can_cu(so, mat):
    assert so[f"{mat}_thuat_ngu"] == 0, so.get(f"_{mat}_thuat_ngu")


@pytest.mark.parametrize("mat", ["phi_hoa", "the_cung", "hoi_dap"])
def test_khong_cum_chung_chung_cum_cam(so, mat):
    assert so[f"{mat}_mo_ho"] == 0 and so[f"{mat}_cum_cam"] == 0


@pytest.mark.parametrize("mat", ["phi_hoa", "the_cung", "hoi_dap"])
def test_trung_giua_la_thap(so, mat):
    assert so[f"{mat}_trung_tb"] <= 0.15, so[f"{mat}_trung_tb"]


def test_hoi_dap_tra_can_cu_cho_vi_sao_noi_vay():
    """Câu trả lời về lá của chính người hỏi kèm `can_cu` (định nghĩa cung, sao + độ sáng, "Mặt tối"…)."""
    import datetime as dt
    from app.hoidap import tuvi as tv
    r = tv.tra_loi("Cung Quan Lộc của tôi nói gì?", "tham_khao",
                   {"ngay": dt.date(1990, 5, 15), "ti": 4, "gioi_tinh": "nam"}, dt.date(2026, 10, 21))
    cu = "\n".join(r["can_cu"])
    assert cu.startswith("Cung Quan Lộc:") and "Cự Môn" in cu and "Hãm" in cu
    assert "Cự Môn" not in r["cau_tra_loi"] and "Cung này cho thấy" not in r["cau_tra_loi"]


def test_kien_thuc_chung_khong_doi():
    """Câu hỏi kiến thức (không lá số) vẫn trả lời bằng tên sao/cung như cũ — không có `can_cu`."""
    from app.hoidap import tuvi as tv
    r = tv.tra_loi("Tham Lang ở cung Quan Lộc có ý nghĩa gì?")
    assert "Tham Lang ở cung Quan Lộc" in r["cau_tra_loi"] and r["can_cu"] == []


def test_chu_de_han_ngan_khong_ten_cung():
    from app.kb import tuvi_kb
    for c in ("Mệnh", "Tài Bạch", "Quan Lộc", "Phụ Mẫu"):
        s = tuvi_kb.chu_de_han_ngan(c)
        assert s and c not in s and ":" not in s
        assert tuvi_kb.chu_de_han(c).endswith(s + ".")
