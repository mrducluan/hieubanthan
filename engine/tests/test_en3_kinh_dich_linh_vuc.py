# -*- coding: utf-8 -*-
"""EN-3 (mục 1, Kinh Dịch): câu hỏi rơi vào một trong 20 chủ đề đời sống (KB `kinhdich_doi_song.chu_de`) mà từ khoá lĩnh
vực chung không bắt → lĩnh vực lấy theo chủ đề, để câu trả lời có đoạn "Riêng về …" đúng việc được hỏi. Câu tự viết cho
test (không lấy từ holdout)."""
import pytest

from app.hoidap import kinhdich as kd


@pytest.mark.parametrize("cau, lv", [
    ("Có nên bán căn chung cư đang ở để đổi sang nhà đất không", "tien_bac"),
    ("Có nên đòi lại tiền đã cho bạn mượn không", "tien_bac"),
    ("Hồ sơ visa đi Úc của tôi có được duyệt không", "cong_viec"),
    ("Kỳ thi chứng chỉ IELTS tháng sau có qua không", "hoc_hanh"),
    ("Làm lành với người yêu cũ có nên không", "tinh_cam"),
])
def test_linh_vuc_tu_chu_de(cau, lv):
    pl = kd.phan_loai(cau)
    assert pl["linh_vuc"] == lv, (cau, pl["linh_vuc"])


@pytest.mark.parametrize("cau, lv", [
    ("Có nên rút vốn khỏi chứng khoán lúc này không", "tien_bac"),
    ("Có nên dừng dự án app đang làm dở không", "cong_viec"),
    ("Tôi có nên xin nghỉ việc để học tiếp không", "cong_viec"),
    ("Mua mảnh đất ở quê bây giờ có nên không", "gia_dinh"),   # KB: mua nhà, đất = chủ đề gia đình
    ("Khi nào tôi gặp được người phù hợp", "tinh_cam"),
])
def test_linh_vuc_du_phong(cau, lv):
    assert kd.phan_loai(cau)["linh_vuc"] == lv, (cau, kd.phan_loai(cau)["linh_vuc"])


@pytest.mark.parametrize("cau", ["Chuyến đi Đà Lạt cuối tuần có suôn sẻ không", "Con chó đi lạc có về không",
                                 "Vụ kiện đòi nợ có thắng được không"])
def test_du_doan(cau):
    assert kd.phan_loai(cau)["loai"] == "du_doan", (cau, kd.phan_loai(cau)["loai"])
