# -*- coding: utf-8 -*-
"""Review EN-2 (#3, #4): "Nhà của bạn" — tên hướng đời thường lấy từ CHÍNH câu KB (không lệch thân hộp); chữ hiển thị
không còn thuật ngữ Huyền Không (thuật ngữ ở "Vì sao nói vậy"); hướng cửa kém không bảo "không đặt cửa chính"."""
import re

import pytest

from tests.test_phongthuy_doi_song import NGAY, SINH, ds

CAM = ["lý khí", "nhân đinh", "vận 9", "Sơn tinh", "sơn tinh", "sao sơn", "sao năm", "Sao năm", "cặp sao",
       "Kim lâu Thân", "Kim lâu Thê", "Kim lâu Tử", "Hai sao cùng hành"]


def _chu(bc):
    for c in bc["chuong"]:
        yield c.get("tom_tat") or ""
        yield from c.get("doan", [])
        for h in c.get("hop", []):
            yield h["tieu_de"]
            yield h["noi_dung"]
            yield h.get("huong_xu_ly") or ""


@pytest.mark.parametrize("do", [0, 45, 90, 135, 180, 225, 270, 315])
@pytest.mark.parametrize("nam_xay", [1995, 2008, 2019])
def test_khong_thuat_ngu_lo(do, nam_xay):
    bc = ds.luan_giai(SINH, {"huong_do": do, "nam_xay": nam_xay}, ngay_xem=NGAY)
    for s in _chu(bc):
        assert not any(x in s for x in CAM), s


@pytest.mark.parametrize("do", [0, 45, 90, 135, 180, 225, 270, 315])
def test_ten_huong_khop_than(do):
    bc = ds.luan_giai(SINH, {"huong_do": do, "nam_xay": 2008}, ngay_xem=NGAY)
    for c in bc["chuong"][:2]:
        for h in c["hop"]:
            m = re.match(r"(?:Hướng )?[\wÀ-ỹ ]+?(?: với bạn)?: (phía .+)$", h["tieu_de"])
            if m:
                assert not h["noi_dung"].lower().startswith("phía"), (h["tieu_de"], h["noi_dung"])
            if h["tieu_de"].startswith("Hướng ") and " với bạn: " in h["tieu_de"]:
                assert "không đặt cửa chính" not in h["noi_dung"], h
