# -*- coding: utf-8 -*-
"""Q&A — trả lời câu hỏi gắn vào con số. Prompt phải giữ định vị tham khảo."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.narrative import llm
from app.luangiai import thanso as lg

client = TestClient(app)


def _reading():
    return lg.luan_giai(["Nguyễn Đức Luân"], 24, 10, 1988)


def test_khong_key_bao_chua_bat(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    out = llm.tra_loi_cau_hoi(_reading(), "Tôi hợp nghề gì?")
    assert out["da_bat_llm"] is False
    assert out["cau_tra_loi"] is None


def test_prompt_hoi_cam_du_doan() -> None:
    """System prompt phải cấm dự đoán và ràng buộc chỉ dùng dữ liệu đã cho."""
    sys = llm._SYSTEM_HOI
    assert "KHÔNG dự đoán" in sys
    assert "bạn sẽ" in sys           # nêu rõ cụm cấm
    assert "tham khảo văn hoá" in sys


def test_endpoint_hoi_bat_buoc_cau_hoi() -> None:
    r = client.post("/v1/thanso/hoi", json={
        "ho_ten": ["Nguyen Duc Luan"], "ngay": 24, "thang": 10, "nam": 1988,
    })
    assert r.status_code == 422    # thiếu cau_hoi


def test_endpoint_hoi_khong_key_tra_thong_bao(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/thanso/hoi", json={
        "ho_ten": ["Nguyen Duc Luan"], "ngay": 24, "thang": 10, "nam": 1988,
        "cau_hoi": "Tôi hợp nghề gì theo con số của mình?",
    })
    assert r.status_code == 200
    assert r.json()["da_bat_llm"] is False
