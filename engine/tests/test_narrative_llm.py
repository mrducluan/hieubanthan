# -*- coding: utf-8 -*-
"""Lớp NARRATIVE LLM — env-gated, và prompt phải ràng buộc chống bịa.

Không test lời gọi mạng thật (cần key). Test: đường không-key trả template, và
prompt luôn mang ràng buộc 'chỉ dùng dữ liệu đã cho'.
"""
from __future__ import annotations

import json

import pytest

from app import narrative
from app.narrative import llm
from app.luangiai import thanso as lg


def _reading() -> dict:
    return lg.luan_giai(["Nguyễn Đức Luân"], 24, 10, 1988)


def test_khong_key_thi_tra_template(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    out = llm.dien_dat(_reading())
    assert out["che_do"] == "template"
    assert out["van_xuoi"] is None
    assert out["luan_giai"]["cac_vi_tri"]        # vẫn giữ nguyên bản luận có cấu trúc


def test_prompt_rang_buoc_chong_bia() -> None:
    msgs = llm.dung_prompt(_reading())
    system = msgs[0]["content"]
    # Phải có ràng buộc cốt lõi
    assert "KHÔNG" in system or "TUYỆT ĐỐI" in system
    assert "MẶT TỐI" in system
    assert "PHẢN CHỨNG" in system


def test_prompt_chi_chua_du_lieu_da_cho() -> None:
    """User message phải là chính JSON dữ liệu — không nhét dữ kiện lạ."""
    reading = _reading()
    msgs = llm.dung_prompt(reading)
    user = msgs[1]["content"]
    # JSON của reading phải nằm trong prompt
    assert reading["cac_vi_tri"][0]["nghia"]["tu_khoa"] in user


def test_van_xuoi_khong_lam_mat_ban_luan_co_cau_truc() -> None:
    """Dù chế độ nào, bản luận có cấu trúc luôn còn đó (để hiển thị/kiểm tra)."""
    out = llm.dien_dat(_reading())
    assert "luan_giai" in out
    assert out["luan_giai"]["trich_nguon_chung"]
