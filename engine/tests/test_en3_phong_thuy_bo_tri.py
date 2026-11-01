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


@pytest.mark.parametrize("cau, kia", [
    ("ck sn 1985 vk sn 1991, nhà hướng Nam thì theo ai", 1985),
    ("Vợ tôi sinh 1994, tôi 1990, hai vợ chồng khác cung có ở nhà hướng Tây được không", 1994),
    ("Chồng mình sinh năm 1987, nhà hướng Đông Nam có hợp cả hai không", 1987),
])
def test_vo_chong_co_nam_sinh_tinh_luon(cau, kia):
    """EN-3 (mục 4): đủ dữ kiện thì tính luôn — năm sinh vợ/chồng trong câu → mệnh quái hai người."""
    pl = pt.phan_loai(cau)
    assert pl["loai"] == "hop" and pl.get("kia_ro") and pl["nam_sinh_kia"] == kia, (cau, pl["loai"], pl.get("nam_sinh_kia"))


def test_vo_chong_khac_menh_khong_nam():
    pl = pt.phan_loai("Chồng tôi mệnh Kim, tôi mệnh Mộc, xây nhà nên quay theo ai")
    assert pl["loai"] == "hop"


@pytest.mark.parametrize("cau", ["Năm nay hướng Tây Bắc có sao xấu bay tới không", "Năm sau hướng Nam có sao gì chiếu"])
def test_sao_nam_toi_huong(cau):
    assert pt.phan_loai(cau)["loai"] == "nam", cau


def test_bep_nha_toi_doi_dien_ve_sinh():
    pl = pt.phan_loai("Bếp nhà tôi đối diện cửa nhà vệ sinh thì có sao không")
    assert pl["loai"] == "bo_tri" and "bep_wc" in pl["bo_tri"]


def test_du_hai_nam_trong_cau_khong_tron_ho_so():
    from tests.test_en3_hieu_cau_chay import chay
    s = chay("phongthuy", "ck sn 1989 vk sn 1993, nhà hướng Tây thì theo ai")["cau_tra_loi"]   # hồ sơ mẫu: 1990
    assert "chồng (sinh 1989)" in s and "vợ (sinh 1993)" in s and "năm 1990" not in s


@pytest.mark.parametrize("cau, ma", [
    ("Để chậu cây trong phòng ngủ có ảnh hưởng gì không", "cay_trong_phong_ngu"),
    ("Nhà mình ở gần đình làng thì có sao không", "gan_chua"),
    ("Mua nhà đối diện nhà thờ có nên không", "gan_chua"),
    ("Cửa phòng ngủ nhìn thẳng cửa nhà vệ sinh thì sao", "cua_phong_doi_wc"),
    ("Cửa sổ to đối diện giường ngủ có sao không", "cua_so_dau_giuong"),
])
def test_bo_tri_dot_2(cau, ma):
    pl = pt.phan_loai(cau)
    assert pl["loai"] == "bo_tri" and ma in pl["bo_tri"], (cau, pl["loai"], pl["bo_tri"])


def test_mo_phan_trong_vuon_la_am_trach():
    assert pt.phan_loai("Trong vườn có ngôi mộ của ông, giờ muốn xây nhà thì sao")["loai"] == "am_trach"


@pytest.mark.parametrize("ma", ["cay_trong_phong_ngu", "gan_chua", "cua_phong_doi_wc"])
def test_muc_dot_2_du_khuon(ma):
    test_muc_moi_du_khuon(ma)


@pytest.mark.parametrize("cau", ["Vợ chồng tôi sinh 1990 và 1992, nhà hướng Nam có hợp không",
                                 "Hai vợ chồng sinh năm 1988 và 1991 thì chọn hướng nào"])
def test_vo_chong_khong_ro_ai_sinh_nam_nao_thi_hoi_them(cau):
    """Kho (skill huyenhoc-tu-cai-thien): không biết năm nào của chồng, năm nào của vợ → không đoán giới tính, hỏi thêm."""
    from tests.test_en3_hieu_cau_chay import chay
    pl = pt.phan_loai(cau)
    assert not pl.get("kia_ro"), pl
    s = chay("phongthuy", cau)["cau_tra_loi"]
    assert "người kia (sinh" not in s and "chồng (sinh" not in s and "vợ (sinh" not in s, s[:300]
