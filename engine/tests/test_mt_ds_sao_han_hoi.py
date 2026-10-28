# -*- coding: utf-8 -*-
"""MT-ĐS B3 — sao hạn trong hỏi đáp (Tử vi · Bát tự · Phong thuỷ) và dòng mười năm của chương Vận hạn.
Tập quán đứng TRƯỚC phần lá số, miễn phí, không đổi mức, không thành hộp."""
from __future__ import annotations

import datetime as dt

from app.hoidap import battu as bh
from app.hoidap import phongthuy as ph
from app.hoidap import tuvi as tv
from app.luangiai import battu_doi_song as bds
from app.luangiai import tuvi_doi_song as tds
from app.narrative import hoi_van

SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 11, 30), "gioi_tinh": "nam"}
SINH_PT = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)}
NGAY = dt.date(2026, 10, 28)


def _dau(r: dict) -> dict:
    return next(m for m in r["bang_chung"]["muc"] if m["loai"] == "sao_han")


def test_tuvi_sao_han_dung_truoc_la_so():
    r = tv.tra_loi("Năm nay tôi sao gì chiếu mệnh, có phải Thái Bạch không?", sinh=SINH_TV, ngay_xem=NGAY)
    m = _dau(r)
    assert m["sao"]["ten"] == "La Hầu" and m["tuoi_mu"] == 37 and r["bang_chung"]["muc"][0]["loai"] == "sao_han"
    van = r["cau_tra_loi"]
    assert van.startswith("Theo tục xếp theo tuổi") and "không tính từ ngày giờ sinh hay lá số" in van
    assert van.index("Theo tục") < van.index("đại hạn")                # tập quán trước, lá số sau
    assert hoi_van.kiem_tra_dau_ra(van, r["bang_chung"]) == []


def test_tuvi_nam_sau_va_hoi_dich_danh():
    r = tv.tra_loi("Năm sau tôi có bị sao Kế Đô không?", sinh=SINH_TV, ngay_xem=NGAY)
    assert _dau(r)["nam"]["nam"] == 2027 and _dau(r)["sao"]["ten"] == "Thổ Tú"
    assert "Kế Đô" not in r["cau_tra_loi"].split("Theo tục")[1].split(".")[0]       # nói đúng sao của tuổi, không "có/không"


def test_thai_duong_la_chinh_tinh_khong_phai_sao_han():
    r = tv.phan_loai("Thái Dương ở cung Mệnh có tốt không?")
    assert not r["sao_han"]
    assert tv.phan_loai("Năm nay sao Thái Dương chiếu mệnh thì sao?")["sao_han"]


def test_khong_co_la_so_thi_hoi_du_lieu():
    r = tv.tra_loi("Năm nay tôi sao gì?", ngay_xem=NGAY)
    assert r["can_them"] and not [m for m in r["bang_chung"]["muc"] if m["loai"] == "sao_han"]


def test_battu_va_phongthuy():
    r = bh.tra_loi("Năm nay tôi hạn Tam Kheo phải không?", sinh=SINH_BT, ngay_xem=NGAY)
    assert _dau(r)["han"]["ten"] == "Tam Kheo" and hoi_van.kiem_tra_dau_ra(r["cau_tra_loi"], r["bang_chung"]) == []
    r = ph.tra_loi("Năm nay tôi sao La Hầu, có nên sửa nhà không?", sinh=SINH_PT, ngay_xem=NGAY)
    assert _dau(r)["sao"]["ten"] == "La Hầu" and hoi_van.kiem_tra_dau_ra(r["cau_tra_loi"], r["bang_chung"]) == []


def test_dong_muoi_nam_co_sao_han_khong_doi_muc():
    bc = tds.lap(SINH_TV, NGAY)
    vh = next(c for c in bc["chuong"] if c["ma"] == "van_han")
    g = vh["dong_nam"][0]
    assert g["sao_han"] == {"sao": "La Hầu", "han": "Tam Kheo"} and g["tuoi"] == 37
    assert all(x["sao_han"] for x in vh["dong_nam"]) and not any(c["ma"] == "sao_han" for x in vh["dong_nam"] for c in x["co"])
    assert not any("sao hạn" in h["tieu_de"].lower() or "La Hầu" in h["noi_dung"] for h in vh["hop"])
    bc2 = bds.lap(SINH_BT, NGAY)
    g2 = next(c for c in bc2["chuong"] if c["ma"] == "van_han")["dong_nam"][0]
    assert g2["sao_han"]["sao"] == "La Hầu"
