# -*- coding: utf-8 -*-
"""Thẻ kiểm chứng (thay "Tự soi" — chủ dự án 2026-10-20): mỗi con số cốt lõi có 3 nét mạnh + 3 điểm mù thường gặp
(kho chân dung theo số), lời đọc kết quả theo số nét người dùng tích (đếm trên máy) và gợi ý số khác của chính họ
khi chưa khớp. RULES thuần từ KB, không LLM."""
from __future__ import annotations

from app.kb import thanso_v2 as kb2
from app.luangiai import thanso

LUAN = (["Nguyễn Đức Luân"], 24, 10, 1988)


def test_moi_vi_tri_co_the_kiem_chung():
    kq = thanso.luan_giai(*LUAN, quy_uoc="tung_phan")
    for vt in kq["cac_vi_tri"]:
        kc = vt["kiem_chung"]
        cd = kb2.chan_dung(vt["gia_tri"])["tong_quan"]
        assert [n["chu"] for n in kc["net"] if n["loai"] == "manh"] == cd["diem_manh"][:3]
        assert [n["chu"] for n in kc["net"] if n["loai"] == "mu"] == cd["diem_mu"][:3]
        assert kc["huong_lon"] == cd["huong_lon"] and kc["khi_cang_thang"] == cd["khi_cang_thang"]
        assert set(kc["ket_qua"]) == {"khop", "mot_phan", "chua_khop"} and all(kc["ket_qua"].values())
        assert kc["nguong"] == {"khop": 4, "mot_phan": 2}


def test_goi_y_so_khac_khi_chua_khop():
    kq = thanso.luan_giai(*LUAN, quy_uoc="tung_phan")      # DD 6 · SM 9 · LH 6 · NC 3
    theo = {v["vi_tri"]: v["kiem_chung"] for v in kq["cac_vi_tri"]}
    # Đường đời 6: số khác đầu tiên của chính người này là Sứ mệnh 9 → gợi ý đọc số 9.
    assert "Sứ mệnh 9" in theo["duong_doi"]["ket_qua"]["mot_phan"]
    assert "Đường đời 6" not in theo["duong_doi"]["ket_qua"]["mot_phan"]
    assert "6" in theo["nhan_cach"]["ket_qua"]["mot_phan"] or "9" in theo["nhan_cach"]["ket_qua"]["mot_phan"]


def test_ten_khong_chu_cai_khong_co_the():
    kq = thanso.luan_giai(["123"], 24, 10, 1988)
    for vt in kq["cac_vi_tri"]:
        if not vt["gia_tri"]:
            assert vt["kiem_chung"] is None
