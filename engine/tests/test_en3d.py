# -*- coding: utf-8 -*-
"""EN-3d — đoạn mở đầu gọi đúng tên điều được hỏi (nhãn rõ từ danh mục cố định) + câu kiến thức Kinh Dịch có lời."""
from __future__ import annotations

import datetime as dt

import pytest

from app.hoidap import kinhdich, mo_dau
from app.luangiai.hoi import chuan_hoa_cau

GIA = [7, 8, 9, 7, 6, 8]
LUC = dt.datetime(2026, 11, 1, 9, 0)


def _kd(q: str) -> str:
    return kinhdich.tra_loi(q, "tu_dong", gia_tri_hao=GIA, thoi_diem=LUC, cach_ra_que="gieo_tay")["cau_tra_loi"]


@pytest.mark.parametrize("q,nhan", [
    ("Lần này đi xin visa Mỹ có được không?", "chuyện xin visa"),
    ("Tôi nên ở lại công ty hay nhảy việc?", "chuyện ở lại hay nhảy việc"),
    ("Mảnh đất tôi định mua có lời không?", "chuyện mua đất"),
    ("Có nên rút cọc căn hộ không?", "chuyện tiền cọc mua nhà"),
])
def test_nhan_ro(q, nhan):
    d = mo_dau.dieu_hoi(chuan_hoa_cau(q), q)
    assert d and d["nhan_ro"] == nhan


def test_nhan_ro_khong_doi_ma_va_chuong():
    """Nhãn rõ chỉ đổi chữ hiển thị — mã và chương (định tuyến) giữ như cũ."""
    d = mo_dau.dieu_hoi(chuan_hoa_cau("Lần này đi xin visa có được không?"), None)
    assert d["ma"] == "kien_tung" and mo_dau.chuong_cua(d) is None


def test_hai_viec_khac_mang_neu_ca_hai():
    q = "mk có nên vay ngân hàng mở shop ko"
    d = mo_dau.dieu_hoi(chuan_hoa_cau(q), q)
    assert "mở quán" in d["nhan_ro"] and "vay ngân hàng" in d["nhan_ro"]


def test_que_mo_dau_goi_ten_dieu_hoi():
    assert _kd("Lần này đi xin visa Mỹ có được không?").startswith("Về chuyện xin visa")


def test_khong_chep_chu_nguoi_dung():
    """Nhãn luôn lấy từ danh mục: câu lạ không sinh nhãn chứa chữ người dùng."""
    q = "Có nên mở quán bún chả Hàng Quạt ở Sài Gòn không?"
    van = _kd(q).split("\n\n")[0]
    assert "Hàng Quạt" not in van and "bún chả" not in van


def test_dong_cam_goi_ten():
    q = "Tôi có nên ly hôn không?"
    van = _kd(q)
    assert van.startswith("Chuyện ly hôn bạn đang trải qua rất nặng lòng")
    assert "Quẻ" not in van.split("\n\n")[0]          # vẫn không nêu mức quẻ ở đoạn đồng cảm


@pytest.mark.parametrize("q,co", [("Dụng thần trong lục hào là gì?", "Dụng thần là gì?"),
                                   ("Quẻ biến khác quẻ hỗ thế nào?", "Quẻ hỗ là gì?")])
def test_kien_thuc_kinh_dich_co_loi(q, co):
    """Trước EN-3d: nhánh thuật ngữ trả lời rỗng (chỉ còn câu miễn trừ)."""
    van = _kd(q)
    assert co in van and len(van.split("\n\n")) >= 2


# ---- an toàn: mẫu không dấu mơ hồ chỉ áp khi gõ không dấu (bộ dev EN-3d)
from app.hoidap import chung, phongthuy as pt  # noqa: E402
from app.luangiai import hoi  # noqa: E402


@pytest.mark.parametrize("q,ky_vong", [
    ("Vợ sinh 1993, chồng 1990, mua căn hộ hướng Đông Bắc có hợp cả hai không?", None),   # "vợ sinh" ≠ "vô sinh"
    ("vo sinh 1993 chong 1990 mua nha huong nao", None),
    ("Phi tinh năm là gì, có cần quan tâm khi sửa nhà?", None),                            # "có cần" ≠ "có căn"
    ("mk có nên nhảy việc sang startup ko, lương cao hơn mà rủi ro", None),               # "hơn mà" ≠ "hồn ma"
    ("Tôi bị vô sinh có chữa được không", "tu_choi_nhe"),
    ("toi bi vo sinh co chua duoc khong", "tu_choi_nhe"),
    ("Tôi có căn cô không?", "dan_huong"),
    ("Nhà tôi đêm nào cũng nghe tiếng bước chân, có phải người chết chưa siêu thoát?", "dan_huong"),
    ("Xem giúp tôi nhà tôi có bị ai yểm bùa không?", "dan_huong"),
    ("Yểm bùa nhà hàng xóm thế nào?", "tu_choi_nhe"),
])
def test_dac_biet_huyen_hoc(q, ky_vong):
    assert chung.dac_biet(chuan_hoa_cau(q), q) == ky_vong


@pytest.mark.parametrize("q,xl", [
    ("Tôi bị đau ngực mấy hôm nay, số 7 có phải dễ bị bệnh tim không?", "tu_choi_nhe"),
    ("toi hay kho tho ve dem, so co noi gi", "tu_choi_nhe"),
    ("Con trai tôi sinh 12/5/2015 hay mơ mộng, ít tập trung, số của bé nói gì?", "tra_loi"),  # "tập trung, số" ≠ "trúng số"
    ("Số nào dễ trúng số?", "tu_choi_nhe"),
])
def test_dac_biet_than_so(q, xl):
    assert hoi.phan_loai(q)["xu_ly"] == xl


# ---- Thần số: số người hỏi tự nêu, cặp cùng số, câu kiến thức
@pytest.mark.parametrize("q,so", [("Tôi số 6, hay ôm việc của người khác, làm sao để bớt?", {"duong_doi": 6}),
                                  ("Tôi rất cầu toàn, có phải do số 7 không?", {"duong_doi": 7}),
                                  ("nhà tôi số 8 có tốt không", {}), ("tôi số 5 người", {})])
def test_so_tu_neu(q, so):
    assert hoi.phan_loai(q)["so_nhac"] == so


def test_cung_so_la_cap():
    assert hoi.phan_loai("Hai vợ chồng tôi cùng số chủ đạo 4 thì sống chung có hay cãi nhau không?")["cap_nhac"] == (4, 4)


@pytest.mark.parametrize("q,ma", [("Thần số học xuất phát từ đâu?", "nguon_goc"),
                                   ("Số sứ mệnh và số đường đời cái nào quan trọng hơn?", "chi_so_quan_trong")])
def test_giai_thich_moi(q, ma):
    assert ma in hoi.phan_loai(q)["giai_thich"]


# ---- Phong thuỷ: tình huống bố trí mới (KB bo_tri, đủ khuôn)
@pytest.mark.parametrize("q,ma", [
    ("Bếp đặt cạnh bồn rửa sát nhau có sao không?", "bep_nuoc"),
    ("Treo tranh thác nước sau lưng ghế sofa được không?", "tranh_treo"),
    ("Đồng hồ treo đối diện giường có sao không?", "dong_ho"),
    ("Màu sơn phòng ngủ cho người mệnh Thủy?", "mau_son"),
    ("Sân nhà thấp hơn mặt đường, mưa là nước tràn vào", "nen_thap"),
    ("Nhà tôi mái dột, tường ẩm mốc, phong thuỷ có quan tâm không?", "nha_toi_am"),
    ("Đất hình tam giác có nên mua để xây nhà không?", "dat_meo"),
    ("Nhà đối diện có góc nhọn chĩa vào, hoá giải thế nào?", "goc_nhon"),
    ("Nhà cũ mua lại có cần làm gì trước khi dọn vào ở?", "nha_cu_mua_lai"),
    ("Phòng ngủ ở ngay trên gara để xe có ảnh hưởng gì?", "phong_tren_khoang_trong"),
    ("Cầu thang đổ thẳng xuống ngay cửa phòng ngủ thì sao?", "cau_thang_cua_phong"),
    ("Nhà gần đường cao tốc ồn ào, phong thuỷ nói sao?", "duong_lon_on"),
    ("Gương lớn treo ở phòng khách đối diện cửa ra vào có nên không?", "guong_cua_chinh"),
    ("Ngủ quay chân ra cửa phòng thì có kiêng không?", "giuong_sat_cua"),
])
def test_bo_tri_moi(q, ma):
    pl = pt.phan_loai(q)
    assert pl["loai"] == "bo_tri" and ma in pl["bo_tri"], (pl["loai"], pl["bo_tri"])


@pytest.mark.parametrize("ma", ["bep_nuoc", "tranh_treo", "dong_ho", "mau_son", "nen_thap", "nha_toi_am", "dat_meo", "goc_nhon",
                                "nha_cu_mua_lai", "phong_tren_khoang_trong", "cau_thang_cua_phong", "duong_lon_on"])
def test_bo_tri_moi_du_khuon(ma):
    m = pt.kb.bo_tri(ma)
    assert m["tieu_de"] and m["noi_dung"] and m["goi_y"] and m["giai_thich_hien_dai"] and m["nguon"] in ("co_thu", "dan_gian")
    assert {v["chi_phi"] for v in m["viec"]} == {"khong_ton", "it_tien", "sua_chua"}
    chu = " ".join([m["noi_dung"], m["goi_y"], m["giai_thich_hien_dai"]] + [v["lam"] for v in m["viec"]]).lower()
    for cam in ("tai hoạ", "chết", "bệnh", "xui xẻo", "mua ", "treo bát quái", "giải hạn", "bạn sẽ", "chắc chắn"):
        assert cam not in chu, (ma, cam)


# ---- mốc tháng + số trong việc nên làm (Kinh Dịch)
def test_thang_ca_nhan_dung_thang_duoc_hoi():
    from app.narrative import hoi_van
    nguoi = {"ho_ten": ["Nguyễn Thị Mai Anh"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"}
    van = hoi_van.tra_loi("Tháng 1 năm 2027 là tháng cá nhân mấy của tôi?", nguoi, None, dt.date(2026, 11, 1),
                          dung_llm=False)["cau_tra_loi"]
    assert van.split("\n\n")[0].count("Tháng 1/2027 là tháng cá nhân") == 1 and "Tháng 11 là tháng cá nhân" not in van


def test_thang_dang_m_yyyy():
    from app.hoidap import hieu_cau
    assert hieu_cau.thoi_gian(chuan_hoa_cau("Tháng 1/2027 thế nào"), dt.date(2026, 11, 1)) == [{"nam": 2027, "thang": 1}]


def test_que_mo_dau_co_so_trong_viec_nen_lam():
    """Việc nên làm của KB có con số ("dòng tiền 6 tháng") — đoạn mở đầu vẫn hiện, số vào gói bằng chứng."""
    kq = kinhdich.tra_loi("Người bạn mới quen rủ đầu tư tiền ảo, có đáng tin không?", "tu_dong", gia_tri_hao=GIA,
                          thoi_diem=LUC, cach_ra_que="gieo_tay")
    dau = kq["cau_tra_loi"].split("\n\n")[0]
    assert dau.startswith("Về chuyện tiền ảo")
    import re as _re
    assert all(int(n) in kq["bang_chung"]["so_trong_goi"] for n in _re.findall(r"\d+", dau))
