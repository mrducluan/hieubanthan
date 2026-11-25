# -*- coding: utf-8 -*-
"""TY-2 (2026-11-25) — dùng hết kho sách Tam Yếu / Minh Kính / Thập Thư cho đúng ngôi nhà, không đổi mức nào."""
import datetime as dt
import itertools

import pytest

from app.calc import phongthuy as pt
from app.kb import nap
from app.luangiai import phongthuy_bo_cuc as bo_cuc
from app.luangiai import phongthuy_doi_song as ds
from app.luangiai import phongthuy_quan_sat as qs
from app.luangiai import phongthuy_tam_yeu as ty

Q8 = ty.QUAI_8


def _kb():
    return nap.doc(ty.TEP)


def test_moi_to_hop_dung_duoc_va_ma_co_that():
    """Mọi tổ hợp cửa × chủ × bếp (+ WC, bàn thờ, mệnh, dấu hiệu) chạy không lỗi; mã luật trả ra đều có trong KB."""
    nt = {m["ma"] for m in _kb()["nguyen_tac"]}
    mk = {m["ma"] for m in _kb()["minh_kinh"]}
    for cua, chu, bep in itertools.product(Q8, Q8 + (None,), Q8 + (None,)):
        for menh in (None, "Khảm", "Càn"):
            f = ty._su_kien(cua, chu, bep, "Khôn", "Tốn", menh, True, ["xa_ngang", "duong_dam", "bep_doi_cua"], True)
            assert set(ty._r_nguyen_tac(f)) <= nt
            assert set(ty._r_minh_kinh(f)) <= mk
            for _, _, cac in ty.nhom_sach(cua, chu, bep, menh=menh):
                assert all(ve for _, ve in cac)


def test_uu_tien_la_ma_kb():
    assert set(ty.UU_TIEN_NGUYEN_TAC) <= {m["ma"] for m in _kb()["nguyen_tac"]}


def test_nha_ba_tot_dung_dinh_nghia():
    for cua, chu in itertools.product(Q8, Q8):
        for b in ty.bep_ba_tot(cua, chu):
            assert {ty.du_nien(cua, chu), ty.du_nien(cua, b), ty.du_nien(chu, b)} == ty.BA_TOT
    # Ví dụ: cửa Khảm, chủ Ly (Diên Niên) → bếp Chấn (Thiên Y / Sinh Khí) hoặc Tốn.
    assert set(ty.bep_ba_tot("Khảm", "Ly")) == {"Chấn", "Tốn"}


def test_du_cung_mem_chi_goi_y_phia_tot_voi_cua():
    """Câu "bếp vừa bù vừa không chọi cửa" chỉ nêu phía có du niên tốt với cửa và tính âm dương ngược với cửa."""
    for cua in Q8:
        f = ty._su_kien(cua, cua, None, None, None, None, False, [], False)
        cau = ty._r_nguyen_tac(f)["du_cung_mem"]
        ds_ten = set(cau.rsplit(": ", 1)[1].rstrip(".").split(", "))
        dung = {pt.QUAI[q][1] for q in Q8 if ty.du_nien(cua, q) in pt.CAT and (q in ty.DUONG) != (cua in ty.DUONG)}
        assert ds_ten == (dung or {_kb()["cong_cu"]["ap"]["khong_co"]})


def test_nhan_sach_cho_tam_bep_khong_trai_engine():
    """Nhãn "sách chọn / sách dặn tránh" không bao giờ nói ngược mức engine (sách chọn ≠ engine "nên tránh" và ngược lại)."""
    for cua, chu in itertools.product(Q8, Q8):
        r = ty.so_do(cua, chu, None, None)
        for g in r["bep_goi_y"]:
            if g.get("sach") == "hop":
                assert g["loai"] != "tranh"
            if g.get("sach") == "tranh":
                assert g["loai"] != "hop"
        assert r["the_nha"]["du_nien"] == ty.du_nien(cua, chu)
        assert [x["du_nien"] for x in r["bep_dieu_can"]["ds"]] == ["Thiên Y", "Sinh Khí", "Diên Niên"]


def test_nhom_c_sau_cong_tuoi():
    """Nhóm C (SX-C) chỉ khi biết người đọc từ 16 tuổi; công cụ báo số mục đang ẩn khi chưa biết tuổi."""
    tre = ty.so_do("Khảm", "Ly", "Chấn", None, menh="Khảm", dau_hieu=["xa_ngang"])
    lon = ty.so_do("Khảm", "Ly", "Chấn", 30, menh="Khảm", dau_hieu=["xa_ngang"])
    nhom = lambda r: [m["nhom"] for g in r["sach_ghi"]["nhom"] for m in g["muc"]]  # noqa: E731
    assert "C" not in nhom(tre) and "C" in nhom(lon)
    assert tre["nhom_c_an"]["so"] == nhom(lon).count("C")


def test_viec_tuan_xoay_bep_khi_bep_nen_tranh():
    bc = {"vi_tri": {"cua_chinh": "Bắc", "phong_ngu_chinh": "Nam", "bep": "Tây Nam"}}
    v = bo_cuc.viec_tuan([], [], None, dt.date(2026, 11, 23), bc)["viec"]
    assert v["ma"] == bo_cuc.TAM_YEU_BEP and v["ma_mau"] == "ds.phongthuy.viec_tuan.tam_yeu_bep" and "miệng bếp" in v["lam"]
    hop = {"vi_tri": {"cua_chinh": "Bắc", "phong_ngu_chinh": "Nam", "bep": "Đông"}}
    assert bo_cuc.viec_tuan([], [], None, dt.date(2026, 11, 23), hop)["viec"] is None


def test_quan_sat_danh_muc_va_cong_tuoi():
    d = qs.danh_sach()
    ten = {k for k in qs._kb()["quan_sat_nhom"] if not k.startswith("_")}
    assert {g["ma"] for g in d["nhom"]} <= ten
    assert sum(len(g["cau"]) for g in d["nhom"]) == len(qs.ma_hop_le()) >= 40
    assert qs.doc(["khong_co_ma"], 30)["so_chon"] == 0
    r = qs.doc(["hai_hem_kep_nha", "duong_uon_truoc_mat"], None)       # hẻm kẹp nhà là nhóm C
    assert r["so_chon"] == 2 and r["nhom_c_an"] == 1


SINH = {"nam": 1985, "gioi_tinh": "nam"}
NHA = {"huong": "Nam", "bo_cuc": {"vi_tri": {"cua_chinh": "Bắc", "phong_ngu_chinh": "Nam", "bep": "Đông", "ve_sinh": "Tây Nam"}}}


@pytest.mark.parametrize("quan_sat", [[], ["tieng_nuoc_ren", "duong_uon_truoc_mat", "hai_hem_kep_nha"]])
def test_bao_cao_khong_doi_muc(quan_sat):
    """Hộp Tam Yếu + hộp quan sát chỉ thêm lời / câu sách: mức của mọi chương giữ như khi không có chúng."""
    ngay = dt.date(2026, 11, 25)
    co = ds.luan_giai(SINH, {**NHA, "quan_sat": quan_sat}, ngay_xem=ngay)
    goc = ds.luan_giai(SINH, {"huong": "Nam"}, ngay_xem=ngay)
    khong_bo_cuc = {c["ma"]: c.get("muc") for c in goc["chuong"]}
    for c in co["chuong"]:
        if c["ma"] != "tung_phong":            # chương Từng phòng có mức riêng khi khai bố cục (như trước)
            assert c.get("muc") == khong_bo_cuc[c["ma"]]
    c3 = next(c for c in co["chuong"] if c["ma"] == "tung_phong")
    h = next(h for h in c3["hop"] if h["tieu_de"] in ("Cửa, phòng chính và bếp đỡ nhau", "Cửa, phòng ngủ, bếp chưa cùng nhịp"))
    assert h.get("sach") and c3["tam_yeu"]["the_nha"]["du_nien"] == "Diên Niên"
    c2 = next(c for c in co["chuong"] if c["ma"] == "ngoi_nha_voi_ban")
    td = {h["tieu_de"] for h in c2["hop"]}
    assert ("Quanh nhà có điều sách xưa dặn để ý" in td) == bool(quan_sat)


def test_sach_noi_bat_toi_da_ba_khong_nhom_c():
    """Gói 1: mỗi nhà ~20 mục sách → web chỉ hiện trước tối đa 3 điều (nhóm B trước, không nhóm C)."""
    for cua, chu, bep in itertools.product(Q8, Q8, (None, "Khảm")):
        r = ty.so_do(cua, chu, bep, 30, menh="Khảm")
        nb = r["sach_noi_bat"]
        assert len(nb) <= 3 and all(m["nhom"] in ("A", "B") for m in nb)
        tat_ca = [m for g in (r["sach_ghi"] or {}).get("nhom", []) for m in g["muc"]]
        assert all(m in tat_ca for m in nb)
        if any(m["nhom"] == "B" for m in tat_ca):
            assert nb[0]["nhom"] == "B"
