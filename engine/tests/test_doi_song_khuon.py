# -*- coding: utf-8 -*-
"""KC-1 — một khuôn `doi_song_1` cho mọi mảng + một bộ test giọng văn: Tử vi, Bát tự, Bản đồ con số (thần số), Nhà của bạn
(phong thuỷ), đọc quẻ (Kinh Dịch). Lớp đời thường (tiêu đề, tóm tắt, hộp, câu tự soi, việc nên làm) không có cụm giọng AI /
từ doạ; mã kiểm chứng `ds.*` hợp lệ theo migration 0017."""
from __future__ import annotations

import datetime as dt
import re

import pytest

from app.luangiai import ban_do_con_so, doi_song_khuon as kh, phongthuy_doi_song, toan_bo
from app.hoidap import kinhdich as kd

MA_DS = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")
NGAY = dt.date(2026, 5, 20)
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}


def _kiem_khuon(bc: dict, mo_dun: str):
    assert bc["phien_ban"] == "doi_song_1" and bc["chuong"]
    for c in bc["chuong"]:
        assert set(c) >= {"ma", "tieu_de", "tom_tat", "hop", "doan", "can_cu"}, c["ma"]
        assert c["hop"] and c["tom_tat"], (mo_dun, c["ma"])
        for h in c["hop"]:
            assert h["loai"] in kh.LOAI_HOP and h["tieu_de"] and h["noi_dung"]
            if h["loai"] == "luu_y":
                assert h.get("huong_xu_ly")
            if h.get("ma_mau"):
                assert MA_DS.match(h["ma_mau"]) and len(h["ma_mau"]) <= 60, h["ma_mau"]
    for h in bc.get("cot_loi", []):
        assert h.get("tu_chuong") in {c["ma"] for c in bc["chuong"]}
    assert kh.kiem_giong_van(bc) == [], kh.kiem_giong_van(bc)
    assert all("None" not in x for x in kh.lop_doi_thuong(bc))


def test_ma_mau():
    assert kh.ma_mau("thanso", "tong_quan", "Đường đời", "33") == "ds.thanso.tong_quan.duong_doi.33"
    assert len(kh.ma_mau("battu", "x" * 80)) <= 60 and MA_DS.match(kh.ma_mau("battu", "x" * 80))


def test_ban_do_con_so_theo_khuon():
    bc = ban_do_con_so.bao_cao(["Nguyễn Đức Luân"], 24, 10, 1988, NGAY, "tung_phan")
    _kiem_khuon(bc, "thanso")
    assert bc["phai"] == "pitago" and bc["cot_loi"] and bc["cot_loi"][0]["tu_chuong"] == "tong_quan"
    assert [c["ma"] for c in bc["chuong"]] == ["tong_quan", "nghich_ly", "muoi_hai_thang", "su_nghiep"]
    assert all(c["moi_xem"]["diem_nhan"] for c in bc["chuong"])            # SAO-2 giữ nguyên
    assert any(h["loai"] == "thoi_diem" and h.get("muc") == "thuan" for h in bc["chuong"][2]["hop"])


def test_battu_theo_khuon():
    """Bát tự đời sống (BT-ĐS, 13 chương) đi qua cùng khuôn + bộ test giọng văn KC-1."""
    bc = toan_bo.battu(SINH_BT, ngay_xem=NGAY)
    _kiem_khuon(bc, "battu")
    assert bc["phai"] == "tu_binh" and [c["ma"] for c in bc["chuong"]] == [m for m, _, _ in toan_bo.CHUONG_BATTU]
    assert all(c["doan"] for c in bc["chuong"])
    tq = bc["chuong"][0]
    assert tq["ma"] == "tong_quan" and tq["cau_tu_soi"]
    assert bc["thoi_gian_bieu"] and bc["cot_loi"]


def test_phong_thuy_theo_khuon():
    bc = phongthuy_doi_song.luan_giai({"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"},
                                      {"huong_do": 180, "nam_xay": 2008}, ngay_xem=NGAY)
    _kiem_khuon(bc, "phongthuy")


def test_kinh_dich_doc_que_sach_giong_van():
    out = kd.tra_loi("Tôi có nên chuyển việc sang công ty mới không?", "tu_dong", gia_tri_hao=[7, 7, 8, 7, 7, 9], thoi_diem=dt.datetime(2026, 5, 20, 10))
    assert kh.kiem_giong_van(out["doc_que"]) == []


@pytest.mark.skipif(not __import__("pathlib").Path(__file__).parents[1].joinpath("ziwei", "node_modules", "iztro").exists(),
                    reason="cần iztro cục bộ")
def test_tuvi_theo_khuon():
    sinh = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
    bc = toan_bo.tuvi(sinh, ngay_xem=NGAY)
    _kiem_khuon(bc, "tuvi")
