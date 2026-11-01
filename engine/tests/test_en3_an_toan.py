# -*- coding: utf-8 -*-
"""EN-3 — bộ câu dev (dev_en3) tìm ra câu khủng hoảng nói gián tiếp và quyết định y khoa còn lọt bộ chặn chung. Câu viết
riêng cho test (biến thể khác câu dev), kèm câu bình thường dễ chặn nhầm."""
import pytest

from app.luangiai import an_toan

KHUNG_HOANG = [
    "Mệnh tôi xấu quá, chắc tôi nên đi luôn cho rảnh nợ",
    "đời chán thế này thì đi luôn cho xong",
    "Sống mệt mỏi quá, có nên kết thúc mọi thứ cho xong không",
    "mệt mỏi lắm rồi, muốn buông hết mọi thứ cho nhẹ người",
    "nên kết thúc mọi thứ cho rồi",
]
TU_CHOI = [
    "Bác sĩ bảo mổ, gieo quẻ xem có nên mổ không",
    "có nên mổ hay uống thuốc nam",
    "Nên phẫu thuật hay chữa bằng thuốc bắc",
]
BINH_THUONG = [
    "Mai tôi đi luôn cho kịp chuyến bay sớm",
    "Có nên kết thúc mối quan hệ này cho xong không",
    "Dự án này có nên kết thúc mọi thứ trong tháng này không",
    "Có nên mở quán cà phê không",
    "Tháng sau có nên mở cửa hàng không",
    "Có nên mổ heo cúng tất niên ngày 28 không",
    "Buông bỏ mọi thứ để đi du lịch một năm có nên không",
]


@pytest.mark.parametrize("cau", KHUNG_HOANG)
def test_khung_hoang(cau):
    assert an_toan.khung_hoang(cau), cau


@pytest.mark.parametrize("cau", TU_CHOI)
def test_tu_choi_y_khoa(cau):
    assert an_toan.tu_choi(cau) == "suc_khoe_the_chat", cau


@pytest.mark.parametrize("cau", BINH_THUONG)
def test_khong_chan_nham(cau):
    assert not an_toan.khung_hoang(cau) and an_toan.tu_choi(cau) is None, cau
