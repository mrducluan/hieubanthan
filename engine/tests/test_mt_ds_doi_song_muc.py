# -*- coding: utf-8 -*-
"""MT-ĐS B2 — hỏi đáp Tử vi / Bát tự MƯỢN chương báo cáo đời sống (RULES đã có, tất định): mỗi câu về một mảng đời
nhận thêm mục `doi_song` = mức của mảng + tóm tắt + ≤ 2 hộp (điểm sáng / nên để ý + việc nên làm). Kiểu "có bị … không"
mở bằng mức của mảng sống hằng ngày (không có/không). Viết TRƯỚC khi nối.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.hoidap import battu as bh
from app.hoidap import doi_song_muc as dsm
from app.hoidap import tuvi as tv
from app.narrative import hoi_van

SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 11, 30), "gioi_tinh": "nam"}
NGAY = dt.date(2026, 10, 28)
MUC_NHAN = ("thuận lợi", "cân bằng", "cần lưu ý")


@pytest.mark.parametrize("cau, chuong", [
    ("Năm nay tôi có bị mất tiền không?", "tien_bac"),
    ("Tôi có bị kiện tụng không?", "quan_he"),
    ("Tôi có mấy đời chồng?", "tinh_cam"),
    ("Bao giờ tôi có con?", "gia_dinh"),
    ("Tôi hợp nghề gì?", "su_nghiep"),
    ("Tôi có số đi xa không?", "quan_he"),
])
def test_tuvi_muon_chuong_doi_song(cau, chuong):
    r = tv.tra_loi(cau, sinh=SINH_TV, ngay_xem=NGAY)
    m = [x for x in r["bang_chung"]["muc"] if x["loai"] == "doi_song"]
    assert m and m[0]["chuong"] == chuong, (cau, [x["loai"] for x in r["bang_chung"]["muc"]])
    assert m[0]["tom_tat"] and 1 <= len(m[0]["hop"]) <= 2
    assert hoi_van.kiem_tra_dau_ra(r["cau_tra_loi"], r["bang_chung"]) == []


def test_tuvi_lo_so_mo_bang_muc_mang():
    r = tv.tra_loi("Năm nay tôi có bị mất tiền không?", sinh=SINH_TV, ngay_xem=NGAY)
    van = r["cau_tra_loi"]
    assert any(f"ở mức {n}" in van for n in MUC_NHAN)
    assert "không ai nói được điều đó từ ngày sinh" in van          # ranh giới ở cuối, không mở đầu
    assert van.index("ở mức") < van.index("không ai nói được")
    assert "Nên để ý" in van or "Điểm sáng" in van


@pytest.mark.parametrize("cau, chuong", [
    ("Tôi có bị kiện tụng không?", "quan_he"),
    ("Tôi có số giàu không?", "tien_bac"),
    ("Bao giờ tôi lấy vợ?", "tinh_cam"),
    ("Con cái tôi sau này thế nào?", "gia_dinh"),
    ("Tôi có hợp học thạc sĩ không?", "hoc_tap"),
    ("Tuổi già của tôi có an nhàn không?", "cuoc_doi"),
])
def test_battu_muon_chuong_doi_song(cau, chuong):
    r = bh.tra_loi(cau, sinh=SINH_BT, ngay_xem=NGAY)
    m = [x for x in r["bang_chung"]["muc"] if x["loai"] == "doi_song"]
    assert m and m[0]["chuong"] == chuong, (cau, r["phan_loai"])
    assert hoi_van.kiem_tra_dau_ra(r["cau_tra_loi"], r["bang_chung"]) == []


def test_muc_doi_song_tu_chuong():
    bc = {"chuong": [{"ma": "tien_bac", "tieu_de": "Tiền bạc", "muc": "can_chu_dong", "tom_tat": "Tiền vào ra thất thường.",
                      "hop": [{"loai": "diem_manh", "tieu_de": "A", "noi_dung": "a.", "can_cu": ["x"]},
                              {"loai": "luu_y", "tieu_de": "B", "noi_dung": "b.", "huong_xu_ly": "làm b.", "can_cu": ["y"]},
                              {"loai": "luu_y", "tieu_de": "C", "noi_dung": "c."}]}]}
    m = dsm.muc_doi_song(bc, "tien_bac", lo_so=True)
    assert m["muc"] == "can_chu_dong" and [h["loai"] for h in m["hop"]] == ["luu_y", "diem_manh"]   # lo_so: lưu ý trước
    van = dsm.doan_doi_song(m)
    assert van.startswith("Mảng tiền bạc của bạn đang ở mức cần lưu ý")
    assert "Nên để ý — B: b. Việc nên làm: làm b." in van and "Điểm sáng — A: a." in van
    assert m["can_cu_ds"] == ["y", "x"]
    assert dsm.muc_doi_song(bc, "khong_co", lo_so=False) is None


def test_xac_nhan_khong_nhan_xet_thay_khac():
    r = tv.tra_loi("Ông thầy bảo tôi là số khắc chồng, có đúng không?", sinh=SINH_TV, ngay_xem=NGAY)
    assert "không nhận xét lời người khác" in r["cau_tra_loi"]
    r = bh.tra_loi("Người ta bảo tôi Thương Quan khắc chồng, có thật không?", sinh=SINH_BT, ngay_xem=NGAY)
    assert "không nhận xét lời người khác" in r["cau_tra_loi"]
