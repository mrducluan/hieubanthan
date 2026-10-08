# -*- coding: utf-8 -*-
"""HH-CT vòng 2 (2026-10-08) — HOLDOUT MỚI cho hỏi đáp Huyền học.

Kho 2.031 câu đã bão hoà (100% cả 4 mảng) nên con số đó lạc quan. Bộ dưới đây viết TRƯỚC khi đọc lại router
(skill huyenhoc-tu-cai-thien): câu đời thường, có lời dẫn đầu câu, viết không dấu, hỏi gián tiếp. Tỉ lệ lần chạy
đầu ghi trong PR; sau đó sửa router/KB cho tới khi qua hết mà không hạ sàn test cũ.
"""
from __future__ import annotations

import pytest

from app.hoidap import battu as bh
from app.hoidap import kinhdich as kd
from app.hoidap import phongthuy as ph
from app.hoidap import tuvi as tv

TUVI = [
    # Nhãn đổi sau lần chạy đầu (ghi trong PR): câu GỌI TÊN cách cục → nhánh mới cach_cuc_chung (giải thích từ KB 62
    # cách cục, không đòi lá số). Lần chạy đầu em gắn sao_cung / ky_thuat — cả hai đều trả lời kém hơn.
    ("Cung mệnh có Tử Phủ đồng cung thì sao?", "cach_cuc_chung", "Mệnh"),
    ("Sao Phá Quân ở cung Phu Thê có phải hôn nhân trắc trở không?", "sao_cung", "Phu Thê"),
    ("Thiên Cơ tại Quan Lộc thì hợp nghề gì?", "sao_cung", "Quan Lộc"),
    ("Hoá Lộc nhập Điền Trạch có ý nghĩa gì", "tu_hoa_cung", "Điền Trạch"),
    ("Hoa Khoa o cung Menh la sao", "tu_hoa_cung", "Mệnh"),
    ("Theo lá số thì đường con cái của tôi ra sao?", "la_so", "Tử Nữ"),
    ("Tôi có số giàu không?", "la_so", "Tài Bạch"),
    ("Bạn bè đồng nghiệp có giúp đỡ tôi không theo lá số?", "la_so", "Nô Bộc"),
    ("Nhà cửa đất đai của tôi thế nào?", "la_so", "Điền Trạch"),
    ("Tính cách của tôi theo tử vi ra sao?", "la_so", "Mệnh"),
    ("Tôi có nên ra nước ngoài làm ăn không?", "la_so", "Thiên Di"),
    ("Phúc đức họ hàng nhà tôi thế nào?", "la_so", "Phúc Đức"),
    ("toi co hop lam kinh doanh khong theo tu vi", "la_so", "Quan Lộc"),
    ("Tháng sau tôi có gặp may không?", "han", None),
    ("Đại vận 10 năm tới của tôi tốt hay xấu?", "han", None),
    ("Năm Đinh Mùi 2027 tôi gặp hạn gì?", "han", None),
    ("Mình đang thất nghiệp, lá số có nói khi nào có việc không?", "han", None),
    ("Xem tử vi cho mẹ tôi sinh năm 1965", "nguoi_khac", None),
    ("Chồng tôi tuổi Thân, tôi tuổi Hợi, có xung không?", "hop_hon", None),
    ("Con gái tôi mới sinh, lá số của bé thế nào?", "la_so_con", None),
    ("Tuần Triệt là gì?", "ky_thuat", None),
    ("Cách cục Sát Phá Tham nghĩa là gì?", "cach_cuc_chung", None),
    ("Thân cư Phu Thê là sao?", "ky_thuat", None),
]

BATTU = [
    ("Nhật chủ Nhâm thủy là người như thế nào?", "nhat_chu_chung", None),
    ("Thiên Ấn trong bát tự nghĩa là gì?", "thap_than_chung", None),
    ("Thất Sát là sao?", "thap_than_chung", None),
    ("Tôi hợp nghề gì theo bát tự?", "la_so", "nghe_tien"),
    ("Bát tự nói gì về tài lộc của tôi?", "la_so", "nghe_tien"),
    ("Theo tứ trụ tôi có tính cách gì nổi bật?", "la_so", "tinh_cach"),
    ("Bát tự của tôi về đường vợ chồng ra sao?", "la_so", "hon_nhan"),
    ("Trụ ngày của tôi là gì?", "la_so", "tru"),
    ("Mệnh tôi thiếu Kim thì nên đeo gì?", "la_so", "ngu_hanh"),
    ("Đại vận sắp tới của tôi theo bát tự?", "van", None),
    ("Năm 2027 bát tự tôi thế nào?", "van", None),
    ("Xem bát tự cho chồng tôi", "nguoi_khac", None),
    ("Con trai tôi sinh giờ Dần có bát tự ra sao?", "con", None),
    ("Dụng thần là gì vậy?", "ky_thuat", None),
    ("Tàng can là gì?", "ky_thuat", None),
]

PHONGTHUY = [
    # Nhãn đổi sau lần chạy đầu (ghi trong PR): câu hỏi CHUNG về nhóm Đông/Tây tứ mệnh và vợ chồng khác nhóm → giải
    # thích (ky_thuat, KB dong_tay_tu_menh / vo_chong_khac_menh); bếp đối diện cửa có mục KB riêng (bo_tri bep_doi_cua).
    ("Tây tứ mệnh hợp nhà hướng nào?", "ky_thuat"),
    ("Hướng Tuyệt Mệnh xấu thế nào?", "du_nien_chung"),
    ("Bếp đặt đối diện cửa chính có sao không?", "bo_tri"),
    ("Gương chiếu thẳng vào giường ngủ có xấu không?", "bo_tri"),
    ("Cầu thang ngay giữa nhà thì sao?", "bo_tri"),
    ("Nhà vệ sinh ở trung tâm nhà có kỵ không?", "bo_tri"),
    ("Bàn thờ nên đặt hướng nào?", "bo_tri"),
    ("Nhà ở cạnh nghĩa trang có ảnh hưởng gì không?", "bo_tri"),
    ("Tôi sinh năm 1992 nữ thì hợp hướng nào?", "huong_ca_nhan"),
    ("Hướng nhà nào hợp với tôi?", "huong_ca_nhan"),
    ("Chồng Đông tứ mệnh, vợ Tây tứ mệnh thì chọn hướng nhà thế nào?", "ky_thuat"),
    ("Phi tinh năm 2027 sao nào đến hướng Nam?", "nam"),
    ("Năm nay hướng nào có sao Ngũ Hoàng?", "nam"),
    ("Đặt mộ phần ông bà hướng nào tốt?", "am_trach"),
    ("Bát trạch là gì?", "ky_thuat"),
    ("Huyền Không phi tinh khác Bát trạch thế nào?", "ky_thuat"),
]

# (câu, loại, phái, dụng thần — None = không kiểm vì phụ thuộc người hỏi)
KINHDICH = [
    ("Tôi có nên chuyển nhà vào tháng tới không?", "quyet_dinh", "nghia_ly", None),
    ("Tôi đang phân vân giữa hai lời mời làm việc, nên chọn bên nào?", "quyet_dinh", "nghia_ly", None),
    ("Có nên đầu tư vào cổ phiếu này không?", "quyet_dinh", "nghia_ly", None),
    ("Mất ví có tìm lại được không?", "du_doan", "luc_hao", "Thê Tài"),
    ("Bệnh của mẹ tôi bao giờ khỏi?", "du_doan", "luc_hao", "Phụ Mẫu"),
    ("Gieo quẻ hỏi việc ký hợp đồng này có thành không", "du_doan", "luc_hao", None),
    ("Người yêu cũ có quay lại không?", "du_doan", "luc_hao", None),
    ("Xem quẻ Mai Hoa theo giờ cho chuyện tình cảm", "doc_nhanh", "mai_hoa", None),
    ("Quẻ Thái là quẻ gì?", "ky_thuat", None, None),
    ("Hào động là gì?", "ky_thuat", None, None),
]


@pytest.mark.parametrize("cau,loai,cung", TUVI)
def test_tuvi(cau, loai, cung):
    p = tv.phan_loai(cau)
    assert p["loai"] == loai, p
    if cung:
        assert cung in p["cung"], p


@pytest.mark.parametrize("cau,loai,chu_de", BATTU)
def test_battu(cau, loai, chu_de):
    p = bh.phan_loai(cau)
    assert p["loai"] == loai, p
    if chu_de:
        assert p["chu_de"] == chu_de, p


@pytest.mark.parametrize("cau,loai", PHONGTHUY)
def test_phongthuy(cau, loai):
    p = ph.phan_loai(cau)
    assert p["loai"] == loai, p


@pytest.mark.parametrize("cau,loai,phai,dung_than", KINHDICH)
def test_kinhdich(cau, loai, phai, dung_than):
    p = kd.phan_loai(cau, "tu_dong")
    assert p["loai"] == loai and p["truong_phai"] == phai, p
    if dung_than:
        assert p["dung_than"] == dung_than, p
