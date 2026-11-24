# -*- coding: utf-8 -*-
"""PR #320 (chủ dự án quyết 2026-11-20): quy tắc cổ thư Nhân tướng (Thần Tướng Toàn Biên, Liễu Trang tướng pháp) và câu
sách Cửu Độn (Độn Giáp Diễn Nghĩa) đi ra người dùng theo khuôn SX-C — câu Hán khớp kho nguồn, có nơi dẫn, giọng nói giảm,
nhóm C không tới người chưa đủ 18 / chưa rõ tuổi, không đổi mức nào."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.kb import sach_ghi as sg, tuong_hoc_dot4_kb as d4
from app.luangiai import sach_ghi_mon as sgm

DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
KB = json.loads((DATA / "nhantuong_ngu_hanh_va_co_thu.json").read_text("utf-8"))
NET = json.loads((DATA / "nhan_tuong_kb.json").read_text("utf-8"))["dac_diem"]
GIU = KB["quy_tac_co_thu"]


@pytest.mark.parametrize("m", GIU, ids=[m["ma"] for m in GIU])
def test_moi_quy_tac_qua_bo_kiem_va_co_nguon(m):
    assert not sg.kiem_muc(m, m["ma"])
    assert sg.chuan(m["han"]) in sg.van_nguon(m["nguon"])              # câu Hán là chuỗi con kho nguồn
    assert m["nguon"] in sgm.SACH and m.get("chuong")                  # nơi dẫn: sách + quyển / thiên / mục
    assert m["y"].startswith(("Sách", "Người", "Dáng", "Mày", "Trán", "Mũi", "Cằm", "Hai", "Mắt", "Ba", "Thần", "Hình",
                              "Lòng", "Chăm", "Đừng", "Muốn", "Sắc", "Xem", "Khoảng", "Tướng", "Vai", "Với", "Chính"))
    assert "bạn sẽ" not in (m["y"] + m.get("ham_y", "")).lower()
    if m["nhom"] == "C":
        assert m["ham_y"].startswith("Hàm ý")
        assert not any(c.isdigit() for c in m["y"] + m["ham_y"])     # nhóm C không số tuổi
    assert m.get("chung") or (m.get("dac_diem") and all(x in NET for x in m["dac_diem"]))


def test_quy_tac_khong_dua_co_ly_do():
    bo = KB["quy_tac_khong_dua"]
    assert len(GIU) + len(bo) == 150
    assert all(set(x) == {"ma", "ly_do"} and x["ly_do"] for x in bo)


def test_bai_doc_chon_dung_net_va_loc_nhom_c():
    k = sgm.nhan_tuong(["cot_tro", "tran_cao_rong"], tuoi=40)
    ma = [n["ma"] for n in k["nhom"]]
    assert "net_co_thu" in ma and "dan" in ma
    co_thu = next(n for n in k["nhom"] if n["ma"] == "net_co_thu")["muc"]
    assert any(m["nhom"] == "C" and "khám" in (m["loi"] + m.get("viec", "")) for m in co_thu)
    assert all("quyển" in m["sach"] or "Quyển" in m["sach"] for m in co_thu)
    for tuoi in (15, None):                                              # chưa đủ 16 (TUOI-16) hoặc chưa rõ tuổi → không nhóm C
        k = sgm.nhan_tuong(["cot_tro", "tran_cao_rong"], tuoi=tuoi)
        assert all(m["nhom"] != "C" for n in k["nhom"] for m in n["muc"])
    assert sgm.nhan_tuong(["cot_tro"], tuoi=15) is None or all(
        m["nhom"] != "C" for n in sgm.nhan_tuong(["cot_tro"], tuoi=15)["nhom"] for m in n["muc"])


def test_gioi_va_can_du():
    nu = sgm.nhan_tuong(["moi_nhat"], tuoi=30, gioi="nu")
    nam = sgm.nhan_tuong(["moi_nhat"], tuoi=30, gioi="nam")
    ma_nu = {m["sach"] for n in nu["nhom"] if n["ma"] == "net_co_thu" for m in n["muc"]}
    assert ma_nu and not (nam and any(n["ma"] == "net_co_thu" for n in nam["nhom"]))
    mot = sgm._co_thu(["tran_cao_rong"], None)[0]
    assert not any(m.get("can_du") for m, _ in mot)                      # cần đủ nét thì một nét chưa đủ


def test_dan_xoay_tat_dinh():
    a = sgm._co_thu(["tran_cao_rong"], None)[1]
    b = sgm._co_thu(["tran_cao_rong"], None)[1]
    assert [m["ma"] for m, _ in a] == [m["ma"] for m, _ in b] and len(a) == sgm.CO_THU_DAN


def test_cuu_don_cau_sach_khop_kho_nguon():
    for ma, muc in d4.kymon_cuu_don()["cuu_don"].items():
        m = muc["sach_ghi"]
        assert not sg.kiem_muc(m, ma) and m["nguon"] == "don_giap_dien_nghia" and m["chuong"]
    ra = d4.tra_cuu_don_cung("Ất", "Kỷ", "Khai", "Trực Phù", 6)
    assert ra[0]["sach_ghi"]["nguon"].startswith("Độn Giáp Diễn Nghĩa")
