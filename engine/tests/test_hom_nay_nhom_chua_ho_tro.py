# -*- coding: utf-8 -*-
"""HN-4 — đo ý định: câu gõ KHÔNG nhận ra ý định nào → engine trả `nhom_chua_ho_tro` = mã trong từ điển cố định
(không trả, không lưu câu). Viết TRƯỚC hàm."""
import datetime as dt
import json

from app.luangiai import hom_nay

SINH = (17, 5, 1990)
D = dt.date(2026, 10, 13)


def test_khong_nhan_ra_tra_nhom_co_dinh():
    kq = hom_nay.the_hom_nay(*SINH, D, None, "chiều nay đi khám bệnh ở bệnh viện")
    assert kq["nhan_ra"] is False and kq["nhom_chua_ho_tro"] == ["kham_benh"]
    kq = hom_nay.the_hom_nay(*SINH, D, None, "sáng mai đi lễ chùa cầu an")
    assert kq["nhan_ra"] is False and kq["nhom_chua_ho_tro"] == ["le_bai"]
    kq = hom_nay.the_hom_nay(*SINH, D, None, "tối nay làm móng rồi đi khám răng")
    assert kq["nhan_ra"] is False and set(kq["nhom_chua_ho_tro"]) == {"lam_dep", "kham_benh"}


def test_khong_lo_cau_go():
    cau = "đi lễ chùa Bà Đanh với Nguyễn Văn Tèo 0912345678"
    kq = hom_nay.the_hom_nay(*SINH, D, None, cau)
    s = json.dumps(kq, ensure_ascii=False)
    assert "Tèo" not in s and "0912345678" not in s and "Bà Đanh" not in s


def test_nhan_ra_hoac_khong_go():
    kq = hom_nay.the_hom_nay(*SINH, D, None, "chiều nay đi phỏng vấn")
    assert kq["nhan_ra"] is True and kq["nhom_chua_ho_tro"] == []
    kq = hom_nay.the_hom_nay(*SINH, D)
    assert kq["nhan_ra"] is None and kq["nhom_chua_ho_tro"] == []
    kq = hom_nay.the_hom_nay(*SINH, D, None, "abc xyz qwe")
    assert kq["nhan_ra"] is False and kq["nhom_chua_ho_tro"] == ["khac"]


def test_nhom_khong_trung_y_dinh():
    """Từ khoá nhóm chưa hỗ trợ không được trùng từ khoá ý định đã có (nếu trùng thì đã nhận ra)."""
    co = {k for ds in hom_nay.TU_KHOA_Y_DINH.values() for k in ds}
    for ma, ds in hom_nay.NHOM_CHUA_HO_TRO.items():
        assert ma != "khac" and not (set(ds) & co), ma


def test_khong_bat_nham_tu_ngan():
    # "giờ", "vắng", "rằm" đứng một mình không được xếp vào nhóm giỗ/đầu tư/lễ bái
    assert hom_nay.nhom_chua_ho_tro("3 giờ chiều nhà vắng người") == ["khac"]
