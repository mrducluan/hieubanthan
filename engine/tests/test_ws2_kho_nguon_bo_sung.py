# -*- coding: utf-8 -*-
"""WS-2 — sách không có trang riêng trên Wikisource, lấy từ nơi chép trọn và có kiểm chứng:
- Cổ Kim Đồ Thư Tập Thành (1725) trên Wikisource: 陽宅十書, 神相全編, 照膽經;
- bản Văn Uyên Các Tứ khố toàn thư (Kanseki): 靈城精義, 催官篇, 發微論.
Đúng khuôn, đủ chữ, sạch vỏ wiki và KHÔNG mang chấm câu thời nay (CC BY-SA, không phải của sách)."""
import json
import re
from pathlib import Path

import pytest

NGUON = Path(__file__).parent.parent / "fixtures" / "nguon"
# mã → (số thiên tối thiểu, số chữ tối thiểu, chữ phải có — mốc nội dung đúng sách)
SACH = {
    "than_tuong_toan_bien": (300, 130_000, ["十二宮", "流年運氣", "五行", "氣色"]),
    "chieu_dam_kinh": (40, 20_000, ["五行正形"]),
    "duong_trach_thap_thu": (20, 15_000, ["宅"]),
    "kham_du_tu_kho": (5, 40_000, ["形氣章正訣", "評龍篇", "剛柔篇"]),
}
_CHAM = re.compile(r"[，。、；：？！「」『』《》“”‘’]")


def _doc(ma):
    return json.loads((NGUON / f"{ma}.json").read_text("utf-8"))


@pytest.mark.parametrize("ma", sorted(SACH))
def test_dung_khuon_du_chu_sach_vo(ma):
    d = _doc(ma)
    so_thien, so_chu, moc = SACH[ma]
    assert d["can_doi_chieu"] is True and d["source_id"] == ma and d["school_id"]
    assert "Cổ thư công cộng" in d["_nguon"] and "CHƯA đối chiếu" in d["ban"]
    assert len(d["thien"]) >= so_thien
    van = "".join(t["van"] for t in d["thien"])
    assert len(van) >= so_chu
    for m in moc:
        assert m in van or any(m in t["ten"] for t in d["thien"]), (ma, m)
    for t in d["thien"]:
        assert t["ten"] and len(t["van"]) >= 40
        assert not re.search(r"\{\{|\}\}|\[\[|<[a-z/]|&[a-z]+;|¶|pb:", t["van"]), (ma, t["ten"])
        assert not _CHAM.search(t["van"]), (ma, t["ten"])   # chấm câu của người gõ đã bỏ


def test_co_kim_do_thu_ghi_nguon_va_khong_lan_sach_khac():
    for ma in ("than_tuong_toan_bien", "chieu_dam_kinh", "duong_trach_thap_thu"):
        d = _doc(ma)
        assert "古今圖書集成" in d["_nguon"] and "Wikisource" in d["ban"]
        ten_sach = {"than_tuong_toan_bien": "神相全編", "chieu_dam_kinh": "照膽經", "duong_trach_thap_thu": "陽宅十書"}[ma]
        assert all(t["ten"].startswith(ten_sach) for t in d["thien"]), ma
    # quyển 631 chép 相兒經, 人相篇 trước Thần Tướng Toàn Biên — không được lọt vào
    tt = _doc("than_tuong_toan_bien")["thien"]
    assert "兒初生" not in tt[0]["van"]
    assert {t["quyen"] for t in tt} == set(range(631, 645))


def test_kham_du_tu_kho_ba_sach_bo_de_yeu():
    d = _doc("kham_du_tu_kho")
    assert set(d["sach"]) == {"linh_thanh", "thoi_quan", "phat_vi"}
    assert {t["sach"] for t in d["thien"]} == set(d["sach"])
    van = "".join(t["van"] for t in d["thien"])
    assert "提要" not in "".join(t["ten"] for t in d["thien"])   # đề yếu của quán Tứ khố không phải chữ sách
    assert "宇宙有大闗合氣運為主" in van                       # câu mở đầu Linh Thành Tinh Nghĩa
