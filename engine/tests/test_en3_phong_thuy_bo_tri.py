# -*- coding: utf-8 -*-
"""EN-3 (mục 5): tình huống bố trí hay hỏi mà KB chưa có / từ khoá quá hẹp → định tuyến về `bo_tri` (không rơi vào
"hướng cá nhân" hay "kỹ thuật"). Câu viết riêng cho test."""
import pytest

from app.hoidap import phongthuy as pt
from app.kb import phongthuy_kb as kb


@pytest.mark.parametrize("cau, ma", [
    ("Nên để két sắt ở góc nào trong nhà", "ket_sat"),
    ("Nhà mình ở tận cuối ngõ cụt thì có sao không", "ngo_cut"),
    ("Trong vườn còn cái giếng cũ, lấp đi có được không", "gieng_cu"),
    ("Đầu giường kê sát cửa sổ có ổn không", "cua_so_dau_giuong"),
    ("giường ngủ kê sát cửa ra vào có sao k", "giuong_sat_cua"),
    ("Nhà vệ sinh tầng trên nằm ngay trên bếp có sao không", "wc_tren_bep"),
    ("Bếp đối diện cửa nhà vệ sinh có sao không", "bep_wc"),
    ("Cầu thang nằm chính giữa nhà có ảnh hưởng gì", "cau_thang_giua_nha"),
    ("nhà vệ sinh đặt giữa nhà có sao không", "wc_giua_nha"),
    ("Cửa chính nhìn thẳng ra cửa sau thì sao", "cua_doi_nhau"),
])
def test_bo_tri_nhan_ra(cau, ma):
    pl = pt.phan_loai(cau)
    assert pl["loai"] == "bo_tri" and ma in pl["bo_tri"], (cau, pl["loai"], pl["bo_tri"])


@pytest.mark.parametrize("ma", ["ket_sat", "ngo_cut", "gieng_cu", "cua_so_dau_giuong", "giuong_sat_cua", "wc_tren_bep"])
def test_muc_moi_du_khuon(ma):
    m = kb.bo_tri(ma)
    assert m["tieu_de"] and m["noi_dung"] and m["goi_y"] and m["giai_thich_hien_dai"] and m["nguon"]
    assert {v["chi_phi"] for v in m["viec"]} == {"khong_ton", "it_tien", "sua_chua"}
    chu = " ".join([m["noi_dung"], m["goi_y"], m["giai_thich_hien_dai"]] + [v["lam"] for v in m["viec"]]).lower()
    for cam in ("tai hoạ", "chết", "bệnh", "xui xẻo", "mua ", "treo bát quái", "giải hạn"):
        assert cam not in chu, (ma, cam)
