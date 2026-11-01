# -*- coding: utf-8 -*-
"""EN-3 (mục 2) — câu không khớp tín hiệu nào (rơi về mặc định) → `hoi_lai` (câu hỏi + lựa chọn cụ thể); câu rõ ràng thì
không có. Mỗi lựa chọn phải tự định tuyến đúng mảng của nó (không lặp lại mặc định)."""
import pytest

from app.hoidap import hieu_cau
from tests.test_en3_hieu_cau_chay import chay

MO_HO = {"thanso": "Xem giúp mình với", "tuvi": "Lá số của tôi thì sao", "battu": "Bát tự tôi thế nào ạ",
         "phongthuy": "Phong thuỷ cho tôi"}
RO = {"thanso": "Năm nay công việc của tôi thế nào", "tuvi": "Tình duyên của tôi theo lá số thế nào",
      "battu": "Bát tự của tôi hợp nghề gì", "phongthuy": "Bếp nên quay hướng nào"}


@pytest.mark.parametrize("md", list(MO_HO))
def test_mo_ho_co_hoi_lai(md):
    kq = chay(md, MO_HO[md])
    hl = kq.get("hoi_lai")
    assert hl and hl["cau"] and len(hl["chon"]) >= 3, (md, kq["phan_loai"])


@pytest.mark.parametrize("md", list(RO))
def test_ro_rang_khong_hoi_lai(md):
    assert not chay(md, RO[md]).get("hoi_lai"), md


@pytest.mark.parametrize("md", list(MO_HO))
def test_lua_chon_tu_dinh_tuyen(md):
    for c in hieu_cau.hoi_lai(md)["chon"]:
        kq = chay(md, c)
        assert not kq.get("hoi_lai"), (md, c, kq["phan_loai"])
