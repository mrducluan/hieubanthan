# -*- coding: utf-8 -*-
"""Hỏi đáp Kinh Dịch (HH-1): chọn phái theo câu hỏi, dụng thần chốt TRƯỚC khi gieo,
3 chế độ, Mai Hoa theo giờ, gói bằng chứng chỉ từ KB, bộ kiểm tra đầu ra."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.hoidap import kinhdich as kd
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
KHO = [json.loads(l) for l in (Path(__file__).parents[1] / "fixtures" / "cau_hoi" /
                               "huyenhoc_cau_hoi.jsonl").open(encoding="utf-8")
       if json.loads(l)["mo_dun"] == "kinhdich"]
QUE_LY = [7, 7, 8, 7, 7, 9]          # Lý (10), động hào 6 → Đoài (58)
THOI = dt.datetime(2026, 9, 30, 10, 15)


@pytest.mark.parametrize("cau,loai,phai,dt_", [
    ("Tôi có nên nghỉ việc không, gieo quẻ giúp tôi.", "quyet_dinh", "nghia_ly", None),
    ("Buổi phỏng vấn tuần sau có đậu không?", "du_doan", "luc_hao", "Quan Quỷ"),
    ("Món nợ này có đòi được không?", "du_doan", "luc_hao", "Thê Tài"),
    ("Bao giờ bố tôi xuất viện?", "du_doan", "luc_hao", "Phụ Mẫu"),
    ("Lập quẻ Mai Hoa theo giờ hiện tại giúp tôi.", "doc_nhanh", "mai_hoa", None),
    ("Quẻ Càn nghĩa là gì?", "ky_thuat", None, None),
])
def test_chon_phai_tu_dong(cau, loai, phai, dt_):
    p = kd.phan_loai(cau, "tu_dong")
    assert p["loai"] == loai and p["truong_phai"] == phai and p["dung_than"] == dt_


def test_che_do_nghia_ly_ep_nghia_ly():
    p = kd.phan_loai("Buổi phỏng vấn tuần sau có đậu không?", "nghia_ly")
    assert p["truong_phai"] == "nghia_ly" and p["dung_than"] is None


def test_an_toan_va_tu_choi():
    assert kd.phan_loai("Gieo quẻ ra toàn hung, tôi thấy chẳng còn lý do để sống.", "tu_dong")["xu_ly"] == "an_toan"
    assert kd.phan_loai("Gieo quẻ xem số đề hôm nay.", "tu_dong")["xu_ly"] == "tu_choi_nhe"


def test_tra_loi_nghia_ly_co_que_mat_toi_tu_soi():
    out = kd.tra_loi("Tôi có nên nghỉ việc không?", "tu_dong", gia_tri_hao=QUE_LY)
    assert out["que"]["quai_ban"]["ten"] == "Lý" and out["que"]["quai_bien"]["ten"] == "Đoài"
    van = out["cau_tra_loi"]
    assert "Lý" in van and "Mặt tối" in van and "tự soi" in van
    assert hoi_van.kiem_tra_dau_ra(van, out["bang_chung"]) == []


def test_luc_hao_chi_ra_dung_than():
    out = kd.tra_loi("Món nợ này có đòi được không?", "tu_dong", gia_tri_hao=QUE_LY)
    m = [x for x in out["bang_chung"]["muc"] if x["loai"] == "dung_than"]
    assert m and m[0]["dung_than"] == "Thê Tài"
    assert any(f["loai"] == "vuong_suy_rut_gon" for f in out["co_canh_bao"])
    assert all("vuong_suy" in v for v in m[0]["vi_tri"]) and m[0]["thoi_gian"]["chi_thang"]


def test_mai_hoa_theo_gio():
    out = kd.tra_loi("Hôm nay đi gặp khách hàng có thuận không, xem nhanh giúp tôi.", "tu_dong",
                     thoi_diem=THOI)
    assert out["phan_loai"]["truong_phai"] == "mai_hoa"
    assert any(x["loai"] == "the_dung" for x in out["bang_chung"]["muc"])


def test_khong_co_que_thi_can_que():
    out = kd.tra_loi("Tôi có nên nghỉ việc không?", "tu_dong", gieo=False)
    assert out["can_them"] == ["que"]


def test_do_phu_kho_kinh_dich():
    du = sum(1 for r in KHO if kd.tra_loi(r["cau_hoi"], "tu_dong", gia_tri_hao=QUE_LY,
                                          thoi_diem=THOI)["do_phu"] == "day_du")
    assert du / len(KHO) >= 0.9, du / len(KHO)


def test_api_hoi_gieo_tay():
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "Có nên chuyển nhà trong năm nay không?",
                                              "gia_tri_hao": QUE_LY})
    assert r.status_code == 200
    d = r.json()
    assert d["que"]["quai_ban"]["so_king_wen"] == 10 and d["cau_tra_loi"]


def test_api_hoi_may_gieo():
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "Có nên nhận chức quản lý không?",
                                              "cach_ra_que": "may_gieo"})
    assert r.status_code == 200 and r.json()["que"]["quai_ban"]["ten"]


def test_api_mai_hoa():
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "Xem nhanh việc đi xa hôm nay",
                                              "cach_ra_que": "mai_hoa",
                                              "thoi_diem": "2026-09-30T10:15:00"})
    assert r.status_code == 200 and r.json()["phan_loai"]["truong_phai"] == "mai_hoa"


def test_api_cam_chon_que_bang_so():
    r = client.post("/v1/kinhdich/hoi", json={"cau_hoi": "abc xyz", "so_que": 1})
    assert r.status_code == 422
