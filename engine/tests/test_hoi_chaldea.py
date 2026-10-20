# -*- coding: utf-8 -*-
"""TS-PHAI-2 — hỏi đáp theo phái Chaldea: câu về bản thân/tên/ý nghĩa số → trả lời bằng số Chaldea (số kép + gốc,
nghĩa KB `thanso_chaldean`); chủ đề phái Chaldea không có (năm cá nhân, đỉnh cao, biểu đồ, hợp đôi…) → trả lời theo
Pythagoras và ghi rõ. Câu khủng hoảng / ngoài phạm vi giữ nguyên xử lý. Viết TRƯỚC hàm."""
import datetime as dt

from fastapi.testclient import TestClient

from app.calc import thanso_chaldean as ch
from app.main import app
from app.narrative import hoi_van

NGUOI = {"ho_ten": ["Nguyễn Văn An"], "ngay": 17, "thang": 5, "nam": 1990}
D = dt.date(2026, 10, 13)
client = TestClient(app)


def test_cau_ban_than_tra_so_chaldea():
    kq = hoi_van.tra_loi("tính cách của tôi thế nào", NGUOI, None, D, dung_llm=False, phai="chaldea")
    so = ch.tinh("Nguyễn Văn An", 17, 5, 1990)
    loai = [m["loai"] for m in kq["bang_chung"]["muc"]]
    assert loai and all(l == "chaldea" for l in loai)
    assert f"số gốc {so['duong_doi']['goc']}" in kq["cau_tra_loi"]
    assert "Chaldea" in kq["cau_tra_loi"] and kq["phai"] == "chaldea"


def test_cau_ve_ten_uu_tien_ten_goi():
    kq = hoi_van.tra_loi("tên của tôi có ý nghĩa gì", NGUOI, None, D, dung_llm=False, phai="chaldea")
    assert kq["bang_chung"]["muc"][0]["ma"] in ("ten_goi", "so_ten")


def test_chu_de_khong_co_trong_chaldea_ve_pitago_va_ghi_ro():
    kq = hoi_van.tra_loi("năm nay của tôi thế nào", NGUOI, None, D, dung_llm=False, phai="chaldea")
    assert any(m["loai"] == "nam_ca_nhan" for m in kq["bang_chung"]["muc"])
    assert "Pythagoras" in kq["cau_tra_loi"]


def test_khung_hoang_giu_nguyen():
    a = hoi_van.tra_loi("tôi muốn chết", NGUOI, None, D, dung_llm=False, phai="chaldea")
    b = hoi_van.tra_loi("tôi muốn chết", NGUOI, None, D, dung_llm=False)
    assert a["cau_tra_loi"] == b["cau_tra_loi"]


def test_mac_dinh_pitago_khong_doi():
    a = hoi_van.tra_loi("tính cách của tôi thế nào", NGUOI, None, D, dung_llm=False)
    assert a["phai"] == "pitago" and all(m["loai"] != "chaldea" for m in a["bang_chung"]["muc"])


def test_api_phai():
    r = client.post("/v1/thanso/hoi", json={"ho_ten": ["Nguyễn Văn An"], "ngay": 17, "thang": 5, "nam": 1990,
                                           "cau_hoi": "tính cách của tôi thế nào", "phai": "chaldea"})
    assert r.status_code == 200 and r.json()["phai"] == "chaldea"
    assert client.post("/v1/thanso/hoi", json={"ho_ten": ["An"], "ngay": 17, "thang": 5, "nam": 1990,
                                               "cau_hoi": "abc def", "phai": "vedic"}).status_code == 422
