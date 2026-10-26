# -*- coding: utf-8 -*-
"""Trục 2 UX (2026-10-26) — đầu trang /bat-tu: một câu lời thường về nhật chủ ("Bạn giống thanh thép…") đứng TRƯỚC bảng
kỹ thuật. Viết TRƯỚC khi sửa route. Câu lấy nguyên văn từ KB `battu_doi_song_kb.nhat_chu` (cùng câu mở đầu chương "Con
người bạn" của luận giải) — web chỉ hiển thị, không tự viết.
"""
from fastapi.testclient import TestClient

from app.kb import battu_doi_song_kb as kb
from app.main import app

client = TestClient(app)


def test_la_so_co_cau_loi_thuong_nhat_chu():
    r = client.post("/v1/battu/la-so", json={"birth_date": "1998-03-14", "birth_time": "09:30", "gender": "nu", "noi_sinh": "ha-noi"})
    assert r.status_code == 200, r.text
    j = r.json()
    lt = j["loi_thuong"]
    n = kb.nhat_chu(j["nhat_chu"]["can"])
    assert lt["chan_dung"] == n["chan_dung"] and lt["chan_dung"].startswith("Bạn giống")
    assert lt["hinh_tuong"] == n["hinh_tuong"]
    assert lt["cau_tu_soi"] == n["cau_tu_soi"]


def test_moi_nhat_chu_deu_co_cau_loi_thuong():
    for can in ("Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"):
        n = kb.nhat_chu(can)
        assert n and n["chan_dung"] and n["hinh_tuong"], can
