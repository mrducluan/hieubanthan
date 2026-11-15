# -*- coding: utf-8 -*-
"""SX-H (2026-11-15) — đoạn "Sách xưa ghi gì về điều bạn hỏi" trong hỏi đáp Tử vi · Bát tự · Phong thuỷ.

Khoá: chọn đúng phạm vi câu hỏi (cung / thần sát / cặp cửa–bếp), ≤ 2 mục (kiến thức ≤ 3), ≤ 1 nhóm C; chưa đủ 18 tuổi không
nhận nhóm C; câu đặc biệt / giờ tạm / bản tiếng Anh không có đoạn; đoạn sách KHÔNG vào gói gửi AI; thân câu trả lời Tử vi
không lộ tên sao / cung (chỉ ở "Vì sao nói vậy"); câu sách khoanh địa chi chỉ hiện ở cung đúng địa chi.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app import ngon_ngu
from app.hoidap import battu, phongthuy, sach_ghi_hoi as sgh, tuvi
from app.luangiai import sach_ghi_mon as sgm
from app.narrative import hoi_van

XEM = dt.date(2026, 11, 15)
TV = {"ngay": dt.date(1990, 5, 12), "ti": 6, "gioi_tinh": "nam"}
TV_TRE = {"ngay": dt.date(2010, 6, 20), "ti": 4, "gioi_tinh": "nam"}
BT = {"lich": dt.datetime(1990, 5, 12, 10, 30), "gioi_tinh": "nam"}
PT = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 12)}


def _s(kq: dict) -> dict | None:
    return kq["bang_chung"].get("sach_ghi_hoi")


def test_tuvi_chon_dung_cung_cua_chu_de():
    kq = tuvi.tra_loi("Tài lộc của tôi thế nào?", "tham_khao", TV, XEM)
    s = _s(kq)
    assert s and 1 <= len(s["muc"]) <= 2
    assert all("Tài Bạch" in m["ve"] for m in s["muc"])
    assert sgh.TIEU_DE in kq["cau_tra_loi"]
    assert any("«" in c for c in kq["can_cu"])                         # chữ Hán + nhãn ở "Vì sao nói vậy"


def test_tuvi_than_bai_khong_lo_thuat_ngu():
    tn = sgh._thuat_ngu_tv()
    for cau in ("Cung Mệnh của tôi nói gì?", "Tình duyên của tôi ra sao?", "Công việc của tôi thế nào?",
                "Sức khoẻ của tôi cần chú ý gì?"):
        kq = tuvi.tra_loi(cau, "tham_khao", TV, XEM)
        for d in (_s(kq) or {}).get("doan", []):
            assert not tn.search(d.split("«")[0] + d.split("»")[-1]), (cau, d)


def test_nguoi_chua_du_18_khong_nhan_nhom_c():
    for cau in ("Sức khoẻ của tôi cần chú ý gì?", "Gia đình của tôi thế nào?", "Tình duyên của tôi ra sao?"):
        s = _s(tuvi.tra_loi(cau, "tham_khao", TV_TRE, XEM))
        assert not s or all(m["nhom"] != "C" for m in s["muc"]), cau


def test_cau_dac_biet_va_gio_tam_khong_co_doan():
    assert not _s(tuvi.tra_loi("Tôi muốn chết, lá số tôi có sao xấu không?", "tham_khao", TV, XEM))
    assert not _s(tuvi.tra_loi("Tài lộc của tôi thế nào?", "tham_khao", {**TV, "gio_tam": True}, XEM))
    assert not _s(battu.tra_loi("Tính cách của tôi thế nào?", sinh={**BT, "gio_tam": True}, ngay_xem=XEM))


def test_ban_tieng_anh_khong_co_doan():
    with ngon_ngu.dung("en"):
        kq = tuvi.tra_loi("How is my wealth?", "tham_khao", TV, XEM)
    assert not _s(kq)


def test_doan_sach_khong_vao_goi_gui_ai(monkeypatch):
    bat: dict = {}

    def gia(goi, cau):
        bat["goi"] = goi
        return "Bản AI giả."

    monkeypatch.setattr(hoi_van, "_goi_llm", gia)
    kq = tuvi.tra_loi("Tài lộc của tôi thế nào?", "tham_khao", TV, XEM, dung_llm=True)
    assert "sach_ghi_hoi" not in bat["goi"]
    assert sgh.TIEU_DE in kq["cau_tra_loi"]                            # chèn vào bản cuối, bản AI hay bản mẫu đều có


def test_kien_thuc_sao_cung_khong_can_la_so():
    kq = tuvi.tra_loi("Tử Vi ở cung Mệnh có ý nghĩa gì?", "tham_khao", None, XEM)
    s = _s(kq)
    assert s and 1 <= len(s["muc"]) <= 3 and all("Tử Vi" in m["ve"] and "Mệnh" in m["ve"] for m in s["muc"])
    assert all(m["nhom"] != "C" for m in s["muc"])                       # không biết tuổi → không nhóm C


def test_battu_thanh_sat_duoc_hoi_xep_truoc():
    kq = battu.tra_loi("Lá số tôi có sao Đào Hoa không?", sinh=BT, ngay_xem=XEM)
    s = _s(kq)
    assert s and all("Đào Hoa" in m["ve"] for m in s["muc"])


def test_phongthuy_cua_bep_dung_du_nien_engine():
    kq = phongthuy.tra_loi("Cửa chính hướng Bắc, bếp hướng Nam có hợp không?", sinh=PT, ngay_xem=XEM)
    s = _s(kq)
    cap = next(c for m in kq["bang_chung"]["muc"] if m.get("loai") == "cua_chu_bep" for c in m["cap"])
    assert s and len(s["muc"]) == 1 and cap["du_nien"] in s["muc"][0]["ve"]


@pytest.mark.parametrize("han,chi,dat", [
    ("破军在子午宫多有金银宝贝蓄积辰戌旺宫亦财盛", "Dần", False),
    ("破军在子午宫多有金银宝贝蓄积辰戌旺宫亦财盛", "Tuất", True),
    ("巳亥陷宫弃祖孤单", "Tỵ", True),
    ("巳亥陷宫弃祖孤单", None, False),
    ("武曲主一子", "Tý", True),                                        # 子 = "con", không phải địa chi
])
def test_cau_sach_khoanh_dia_chi(han, chi, dat):
    assert sgm._chi_dat(han, chi) is dat


def test_so_trong_doan_sach_qua_bo_kiem_dau_ra():
    for cau in ("Tài lộc của tôi thế nào?", "Cung Mệnh của tôi nói gì?", "Tình duyên của tôi ra sao?"):
        kq = tuvi.tra_loi(cau, "tham_khao", TV, XEM)
        assert hoi_van.kiem_tra_dau_ra(kq["cau_tra_loi"], kq["bang_chung"]) == [], cau


def test_thuoc_lo_ban_dinh_tuyen_va_khong_nhac_lai_cau_sach():
    """SX-D (Dương Trạch Thập Thư phần còn lại): câu hỏi kích thước cửa / thước Lỗ Ban → mục bố trí riêng; câu sách đã
    trích trong lời mục thì đoạn "Sách xưa ghi gì" không nhắc lại, cũng không lấy điều dặn theo cung mệnh thế chỗ."""
    for cau in ("Thước Lỗ Ban là gì?", "Kích thước cửa chính bao nhiêu là đẹp?", "Cửa phòng ngủ rộng bao nhiêu thì hợp?"):
        kq = phongthuy.tra_loi(cau, sinh=PT, ngay_xem=XEM)
        assert kq["phan_loai"]["loai"] == "bo_tri", cau
        assert kq["cau_tra_loi"].count("一切門窗通氣之處") == 1 and not _s(kq), cau


def test_can_ho_nhan_cau_chia_khu_tinh_rieng():
    kq = phongthuy.tra_loi("Nhà ở chung cư thì xem hướng cửa nào?", sinh=PT, ngay_xem=XEM)
    assert any("牆隔斷" in d for d in _s(kq)["doan"])
