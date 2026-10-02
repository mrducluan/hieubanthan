# -*- coding: utf-8 -*-
"""KB-3b — Cách cục Tử Bình Chân Thuyên (Thẩm Hiếu Chiêm, đời Thanh — cổ thư công cộng). Test viết TRƯỚC.

Định cách theo nguyệt lệnh: tàng can của chi tháng THẤU ra can năm/tháng/giờ (không tính nhật can) thì
lấy can thấu, ưu tiên bản khí → trung khí → dư khí; không thấu thì lấy bản khí. Tỷ Kiên/Kiếp Tài không lập
cách: chi tháng là Lộc của nhật chủ → Kiến Lộc; là Dương Nhận (can dương) → Dương Nhận; còn lại → Nguyệt Kiếp.
Không có oracle mã nguồn mở → tứ trụ dựng tay, tính tay từng ca.
"""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.calc import battu, battu_mo_rong as bm
from app.main import app


def _ls(nam: str, thang: tuple[str, str], ngay: str, gio: str) -> dict:
    tru = [{"can": nam, "chi": "Tý"}, {"can": thang[0], "chi": thang[1]}, {"can": ngay, "chi": "Tý"}, {"can": gio, "chi": "Tý"}]
    return {"tru": tru, "nhat_chu": {"can": ngay}}


@pytest.mark.parametrize("ls,ma,can,nguon,thau", [
    # Nhâm sinh tháng Tỵ (Bính·Canh·Mậu), Bính thấu giờ → bản khí → Thiên Tài cách
    (_ls("Canh", ("Tân", "Tỵ"), "Nhâm", "Bính"), "thien_tai", "Bính", "ban_khi", True),
    # Giáp sinh tháng Thân (Canh·Nhâm·Mậu), chỉ Nhâm thấu → trung khí → Thiên Ấn cách
    (_ls("Nhâm", ("Bính", "Thân"), "Giáp", "Ất"), "thien_an", "Nhâm", "trung_khi", True),
    # Giáp sinh tháng Thân, không can nào thấu → bản khí Canh → Thất Sát cách
    (_ls("Đinh", ("Bính", "Thân"), "Giáp", "Ất"), "that_sat", "Canh", "ban_khi", False),
    # Bính sinh tháng Dần (Giáp·Bính·Mậu), thấu Bính (Tỷ — bỏ) và Mậu → dư khí Mậu → Thực Thần cách
    (_ls("Bính", ("Canh", "Dần"), "Bính", "Mậu"), "thuc_than", "Mậu", "du_khi", True),
    # Giáp sinh tháng Thìn (Mậu·Ất·Quý), chỉ Quý thấu → Chính Ấn cách (tứ khố xem can thấu)
    (_ls("Quý", ("Bính", "Thìn"), "Giáp", "Canh"), "chinh_an", "Quý", "du_khi", True),
    # Kỷ sinh tháng Dần, Giáp thấu → Chính Quan cách
    (_ls("Giáp", ("Bính", "Dần"), "Kỷ", "Đinh"), "chinh_quan", "Giáp", "ban_khi", True),
    # Canh sinh tháng Tý (Quý) → Thương Quan cách; Ất sinh tháng Dậu (Tân) → Thất Sát; Quý sinh tháng Ngọ (Đinh·Kỷ), Đinh thấu → Thiên Tài
    (_ls("Giáp", ("Bính", "Tý"), "Canh", "Mậu"), "thuong_quan", "Quý", "ban_khi", False),
    (_ls("Giáp", ("Quý", "Ngọ"), "Quý", "Đinh"), "thien_tai", "Đinh", "ban_khi", True),
    # Đinh sinh tháng Dậu (Tân), Tân thấu → Thiên Tài; Mậu sinh tháng Tý (Quý) không thấu → Chính Tài
    (_ls("Tân", ("Đinh", "Dậu"), "Đinh", "Giáp"), "thien_tai", "Tân", "ban_khi", True),
    (_ls("Giáp", ("Bính", "Tý"), "Mậu", "Canh"), "chinh_tai", "Quý", "ban_khi", False),
])
def test_dinh_cach(ls, ma, can, nguon, thau):
    c = bm.cach_cuc_tbct(ls)
    assert (c["ma"], c["can_lap_cach"], c["nguon_khi"], c["thau"]) == (ma, can, nguon, thau)


@pytest.mark.parametrize("ls,ma", [
    (_ls("Canh", ("Bính", "Dần"), "Giáp", "Đinh"), "kien_loc"),       # Giáp lộc tại Dần
    (_ls("Giáp", ("Ất", "Dậu"), "Canh", "Bính"), "duong_nhan"),       # Canh (dương) nhận tại Dậu
    (_ls("Giáp", ("Bính", "Thân"), "Tân", "Bính"), "nguyet_kiep"),    # Tân (âm) gặp Canh ở Thân = Kiếp
    (_ls("Giáp", ("Đinh", "Mão"), "Ất", "Bính"), "kien_loc"),         # Ất lộc tại Mão
])
def test_loc_nhan_kiep(ls, ma):
    c = bm.cach_cuc_tbct(ls)
    assert c["ma"] == ma and c["thap_than"] in ("Tỷ Kiên", "Kiếp Tài")
    assert isinstance(c["can_thau_khac"], list)


def test_kien_loc_ghi_can_thau_de_dung():
    c = bm.cach_cuc_tbct(_ls("Canh", ("Bính", "Dần"), "Giáp", "Đinh"))
    assert [x["thap_than"] for x in c["can_thau_khac"]] == ["Thất Sát", "Thực Thần", "Thương Quan"]


def test_la_so_that_va_api():
    ls = battu.la_so(dt.datetime(1990, 5, 17, 12, 30), "nam")          # Canh Ngọ · Tân Tỵ · Nhâm Ngọ · Bính Ngọ
    assert bm.cach_cuc_tbct(ls)["ma"] == "thien_tai"
    la = {"birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam", "noi_sinh": "ha-noi"}
    d = TestClient(app).post("/v1/battu/la-so", json=la).json()["mo_rong"]["cach_cuc_tbct"]
    assert d["ma"] == "thien_tai" and d["ten"] == "Thiên Tài cách" and d["hy"] and d["ky"] and d["nguon"]
