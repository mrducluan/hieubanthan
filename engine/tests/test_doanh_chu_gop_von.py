# -*- coding: utf-8 -*-
"""GV-1 — "Khi góp vốn với người khác" (tách từ PR #375, làm lại sau review): `POST /v1/doanh-chu/gop-von`.

Hợp đồng (viết TRƯỚC hàm):
- Một bộ tính: hành mạnh + vai trò của từng người lấy ĐÚNG `calc.doanh_chu._ho_so_co_ban` + `_VAI_TRO_HANH` của Bản đồ
  quản lý nhân sự (DC-1) — không bảng hành → vai trò thứ hai.
- Kết quả không phụ thuộc thứ tự nhập (đảo danh sách → cùng vai trò từng người, cùng "khâu còn trống").
- Không cộng điểm ngũ hành của nhiều người, không chấm điểm hợp / khắc, không khuyên nên / không nên hợp tác với ai.
- Bắt buộc `cam_ket_thoa_thuan` + `dong_y_tu_nguyen` từng người (thiếu → 422); người dưới 16 tuổi → 422.
- Luôn kèm `ranh_gioi_phap_ly` (nhắc hỏi luật sư, không phải lời khuyên pháp lý / đầu tư, dữ liệu không lưu).
- Tỉ lệ góp vốn tổng ≤ 100 (vượt → 422); `nganh` không còn nhận (không dùng → không giả vờ dùng).
"""
from __future__ import annotations

import itertools
import re

import pytest
from fastapi.testclient import TestClient

from app.calc import doanh_chu as dc
from app.main import app

client = TestClient(app)

A = {"ten": "Minh", "ngay": 15, "thang": 5, "nam": 1990, "gioi_tinh": "nam", "dong_y_tu_nguyen": True}
B = {"ten": "Lan", "ngay": 3, "thang": 11, "nam": 1992, "gioi_tinh": "nu", "dong_y_tu_nguyen": True}
C = {"ten": "Hùng", "ngay": 21, "thang": 1, "nam": 1985, "gioi_tinh": "nam", "dong_y_tu_nguyen": True}


def _goi(sang_lap, **them):
    return client.post("/v1/doanh-chu/gop-von", json={"sang_lap": sang_lap, "cam_ket_thoa_thuan": True,
                                                      "nam_xem": 2026, **them})


def test_vai_tro_dung_mot_bo_tinh_voi_ban_do_nhan_su():
    r = _goi([A, B])
    assert r.status_code == 200, r.text
    kq = r.json()
    for vao, ra in zip((A, B), kq["phan_vai"]):
        hs = dc._ho_so_co_ban(vao["ngay"], vao["thang"], vao["nam"], vao["gioi_tinh"], 2026)
        assert ra["hanh_manh_ma"] == hs["hanh_manh"]
        assert ra["vai_tro"] == dc._VAI_TRO_HANH[hs["hanh_manh"]]["vi"][0]


@pytest.mark.parametrize("thu_tu", list(itertools.permutations([A, B, C])))
def test_khong_phu_thuoc_thu_tu_nhap(thu_tu):
    goc = _goi([A, B, C]).json()
    dao = _goi(list(thu_tu)).json()
    assert {x["ten"]: x["lam"] for x in goc["phan_vai"]} == {x["ten"]: x["lam"] for x in dao["phan_vai"]}
    assert sorted(x["ma"] for x in goc["khau_con_trong"]) == sorted(x["ma"] for x in dao["khau_con_trong"])


def test_khong_cham_diem_khong_khuyen_hop_tac_voi_ai():
    van = str(_goi([A, B, C]).json())
    assert not re.search(r"\b(diem|điểm số|\d+/100)\b", van)
    assert not re.search(r"không nên (hợp tác|góp vốn|làm ăn) với|nên chọn .{0,20} làm đối tác|hợp nhau \d", van, re.I)
    assert "tong_diem" not in van and "hanh_khuyet" not in van


def test_bat_buoc_dong_y_va_cam_ket():
    assert _goi([A, {**B, "dong_y_tu_nguyen": False}]).status_code == 422
    r = client.post("/v1/doanh-chu/gop-von", json={"sang_lap": [A, B], "nam_xem": 2026})
    assert r.status_code == 422


def test_chan_duoi_16_tuoi():
    tre = {**B, "nam": 2015}
    assert _goi([A, tre]).status_code == 422


def test_ty_le_vuot_100_va_nganh_khong_con_nhan():
    assert _goi([{**A, "ty_le_du_kien": 70}, {**B, "ty_le_du_kien": 40}]).status_code == 422
    assert _goi([A, B], nganh="dich_vu").status_code == 422


def test_ranh_gioi_phap_ly_va_dieu_le_co_cau_luat_su():
    kq = _goi([A, B]).json()
    assert "luật sư" in kq["ranh_gioi_phap_ly"] and "không lưu" in kq["ranh_gioi_phap_ly"]
    assert kq["dieu_le_goi_y"] and all(d["tieu_de"] and d["noi_dung"] for d in kq["dieu_le_goi_y"])


def test_hai_nguoi_chia_deu_co_dieu_le_pha_the_bi():
    kq = _goi([{**A, "ty_le_du_kien": 50}, {**B, "ty_le_du_kien": 50}]).json()
    assert any(d["ma"] == "ty_le_50_50" for d in kq["dieu_le_goi_y"])


def test_ban_tieng_anh_sach_chu_viet():
    r = client.post("/v1/doanh-chu/gop-von", headers={"x-ngon-ngu": "en"},
                    json={"sang_lap": [A, B, C], "cam_ket_thoa_thuan": True, "nam_xem": 2026})
    assert r.status_code == 200, r.text
    kq = r.json()
    chu = " ".join(str(v) for k, v in kq.items() if k not in ("phan_vai",)) + " ".join(
        f"{x['vai_tro']} {x['gia_tri']} {x['nen_de_y']}" for x in kq["phan_vai"])
    assert not re.search(r"[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]", chu, re.I), chu[:300]
