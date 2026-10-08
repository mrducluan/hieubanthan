# -*- coding: utf-8 -*-
"""HH-CT3 (2026-10-08) — HOLDOUT VÒNG 3 cho hỏi đáp Huyền học.

Viết TRƯỚC khi đọc lại router (skill huyenhoc-tu-cai-thien). Trọng tâm: lối hỏi Việt hay gặp mà v2 chưa phủ —
"X cư/thủ/toạ Y" (khớp cụm trang SEO-H), hỏi kèm năm sinh/âm lịch, viết tắt (tv, pt), câu dài có lời dẫn,
hỏi phong thuỷ đời thường (cây, cá, màu, ban công), gieo quẻ việc cụ thể. Tỉ lệ lần chạy đầu ghi trong PR.
"""
from __future__ import annotations

import pytest

from app.hoidap import battu as bh
from app.hoidap import kinhdich as kd
from app.hoidap import phongthuy as ph
from app.hoidap import tuvi as tv

TUVI = [
    ("Thái Âm cư Mệnh có tốt không?", "sao_cung", "Mệnh"),
    ("Thất Sát thủ mệnh là người thế nào", "sao_cung", "Mệnh"),
    ("Liêm Trinh toạ Quan Lộc nghĩa là gì?", "sao_cung", "Quan Lộc"),
    ("Cự Môn ở cung phu thê có hay cãi nhau không", "sao_cung", "Phu Thê"),
    ("Tham Lang nằm ở cung Tài Bạch", "sao_cung", "Tài Bạch"),
    ("vu khuc o cung tai bach co giau khong", "sao_cung", "Tài Bạch"),
    ("Hoá Kỵ ở cung Tật Ách có đáng lo không?", "tu_hoa_cung", "Tật Ách"),
    ("Hóa Quyền nhập cung Quan Lộc", "tu_hoa_cung", "Quan Lộc"),
    ("Em năm nay 28 tuổi, chưa có người yêu, lá số tử vi nói gì về chuyện tình duyên của em?", "la_so", "Phu Thê"),
    ("Lá số của tôi về sức khoẻ thế nào?", "la_so", "Tật Ách"),
    ("Cha mẹ có giúp được gì cho tôi không theo tử vi?", "la_so", "Phụ Mẫu"),
    ("Anh chị em trong nhà có hoà thuận không?", "la_so", "Huynh Đệ"),
    ("Theo tử vi tôi có nên đi xa lập nghiệp không?", "la_so", "Thiên Di"),
    ("Lưu niên năm nay của tôi có gì đáng chú ý?", "han", None),
    ("Tiểu hạn năm 2026 tôi thế nào?", "han", None),
    ("Tháng 7 âm lịch này có xui không?", "han", None),
    ("Lá số tử vi cho bố tôi sinh năm 1958", "nguoi_khac", None),
    ("Vợ tuổi Dần chồng tuổi Tỵ có hợp không?", "hop_hon", None),
    ("Mệnh vô chính diệu là gì?", "ky_thuat", None),
    ("Cục trong tử vi là gì?", "ky_thuat", None),
    ("Cách cục Cơ Nguyệt Đồng Lương là sao?", "cach_cuc_chung", None),
]

BATTU = [
    ("Nhật chủ Bính hỏa sinh mùa đông thì sao?", "nhat_chu_chung", None),
    ("Thương Quan là gì trong tứ trụ?", "thap_than_chung", None),
    ("Chính Tài nghĩa là gì?", "thap_than_chung", None),
    ("Theo bát tự tôi có hợp làm kinh doanh không?", "la_so", "nghe_tien"),
    ("Tôi hợp màu gì theo ngũ hành bát tự?", "la_so", "ngu_hanh"),
    ("Bát tự nói gì về chuyện hôn nhân muộn của tôi?", "la_so", "hon_nhan"),
    ("Tứ trụ của tôi mạnh hay yếu?", "la_so", None),
    ("Năm sau bát tự của tôi có đổi vận không?", "van", None),
    ("Xem tứ trụ giúp vợ tôi", "nguoi_khac", None),
    ("Thân vượng thân nhược là gì?", "ky_thuat", None),
    ("Thập thần là gì?", "ky_thuat", None),
]

PHONGTHUY = [
    ("Nên trồng cây gì trước cửa nhà?", "bo_tri"),
    ("Bể cá đặt ở phòng khách có tốt không?", "bo_tri"),
    ("Giường ngủ kê dưới xà ngang có sao không?", "bo_tri"),
    ("Cửa chính đối diện cửa sau thì sao?", "bo_tri"),
    ("Nhà hướng Tây có nóng và xấu không?", "huong_ca_nhan"),   # nhãn sửa: tốt/xấu tuỳ mệnh quái gia chủ
    ("Sinh năm 1987 nam hợp hướng nào?", "huong_ca_nhan"),
    ("Tôi tuổi Ất Sửu 1985 thì kê bàn làm việc hướng nào?", "bo_tri"),   # nhãn sửa: KB có mục phong_lam_viec
    ("Hướng Sinh Khí là gì?", "du_nien_chung"),
    ("Năm 2026 Nhị Hắc bay vào hướng nào?", "nam"),
    ("Mệnh quái là gì?", "ky_thuat"),
    ("Xây mộ cho bố hướng nào hợp?", "am_trach"),
]

KINHDICH = [
    ("Có nên nhận lời cầu hôn của anh ấy không?", "quyet_dinh", "nghia_ly", None),
    ("Tôi nên ở lại công ty hay nghỉ để khởi nghiệp?", "quyet_dinh", "nghia_ly", None),
    ("Gieo quẻ xem con tôi thi đại học có đỗ không", "du_doan", "luc_hao", None),
    ("Chó nhà tôi đi lạc có tìm được không?", "du_doan", "luc_hao", None),
    ("Vụ kiện này tôi có thắng không?", "du_doan", "luc_hao", None),
    ("Bao giờ tôi bán được nhà?", "du_doan", "luc_hao", None),
    ("Quẻ Khôn nghĩa là gì?", "ky_thuat", None, None),
    ("Lục hào khác Mai Hoa thế nào?", "ky_thuat", None, None),
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
