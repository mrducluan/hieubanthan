# -*- coding: utf-8 -*-
"""SAO-2 — web hỏi engine "câu này có phải khủng hoảng / từ chối nhẹ không" TRƯỚC khi chặn vì hết lượt miễn phí:
câu khủng hoảng luôn được trả lời (đường dây hỗ trợ), không bao giờ gặp hộp nạp Sao. RULES thuần, không LLM."""
from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)


def test_khung_hoang_la_an_toan():
    for cau in ("Tôi không muốn sống nữa", "dạo này em muốn chết", "Tôi thấy mình vô dụng quá"):
        r = c.post("/v1/hoi/dac-biet", json={"cau_hoi": cau})
        assert r.status_code == 200 and r.json() == {"loai": "an_toan"}, cau


def test_tu_choi_nhe_va_binh_thuong():
    assert c.post("/v1/hoi/dac-biet", json={"cau_hoi": "Cho tôi con số đánh đề hôm nay"}).json() == {"loai": "tu_choi_nhe"}
    assert c.post("/v1/hoi/dac-biet", json={"cau_hoi": "Cung Mệnh của tôi nói gì?"}).json() == {"loai": None}


def test_dau_vao():
    assert c.post("/v1/hoi/dac-biet", json={}).status_code == 422
    assert c.post("/v1/hoi/dac-biet", json={"cau_hoi": "x" * 501}).status_code == 422
