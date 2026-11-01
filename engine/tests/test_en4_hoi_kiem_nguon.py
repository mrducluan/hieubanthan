# -*- coding: utf-8 -*-
"""EN-4 (sau code-review #8): hỏi đáp kiểm bản AI với CẢ bản mẫu đã dựng (không chỉ gói JSON) — nhờ vậy bắt được thuật
ngữ lạ (tên sao / cung không có trong câu trả lời gốc) và câu ý mới; bản AI chỉ sắp lại câu của bản mẫu thì vẫn qua."""
from __future__ import annotations

import datetime as dt
import re

from app.hoidap import battu as bt
from app.hoidap import phongthuy as pt
from app.hoidap import tuvi as tv
from app.narrative import hoi_van

NGAY = dt.date(2026, 10, 21)
SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}


def _sap_lai(van: str) -> str:
    cau = [c for c in re.split(r"(?<=[.!?])\s+", van.replace("\n", " ")) if c.strip()]
    return " ".join(cau[1:] + cau[:1])


def test_ban_ai_sap_lai_cau_mau_van_qua(monkeypatch):
    goc = tv.tra_loi("Công việc của tôi thế nào?", sinh=SINH_TV, ngay_xem=NGAY, dung_llm=False)["cau_tra_loi"]
    monkeypatch.setattr(hoi_van, "_goi_llm", lambda goi, cau: _sap_lai(goc))
    out = tv.tra_loi("Công việc của tôi thế nào?", sinh=SINH_TV, ngay_xem=NGAY, dung_llm=True)
    assert out["che_do_van"] == "llm", out["loi_kiem_tra"]


def test_ban_ai_bia_ten_sao_bi_bo(monkeypatch):
    goc = tv.tra_loi("Công việc của tôi thế nào?", sinh=SINH_TV, ngay_xem=NGAY, dung_llm=False)["cau_tra_loi"]
    them = "Cung Phúc Đức có Thiên Lương chiếu nên việc làm luôn được che chở."
    assert "Thiên Lương" not in goc
    monkeypatch.setattr(hoi_van, "_goi_llm", lambda goi, cau: goc + " " + them)
    out = tv.tra_loi("Công việc của tôi thế nào?", sinh=SINH_TV, ngay_xem=NGAY, dung_llm=True)
    assert out["che_do_van"] == "template_fallback"
    assert any("thuật ngữ lạ" in x for x in out["loi_kiem_tra"]), out["loi_kiem_tra"]
    assert "Thiên Lương" not in out["cau_tra_loi"]


def test_ban_ai_goi_vat_pham_bi_bo(monkeypatch):
    sinh = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nu"}
    goc = bt.tra_loi("Tiền bạc của tôi thế nào?", sinh=sinh, ngay_xem=NGAY, dung_llm=False)["cau_tra_loi"]
    them = "Hãy mua thêm một chiếc vòng tay bằng đá thạch anh hồng màu tím để thu hút khách hàng giàu sang sung túc."
    monkeypatch.setattr(hoi_van, "_goi_llm", lambda goi, cau: goc + " " + them)
    out = bt.tra_loi("Tiền bạc của tôi thế nào?", sinh=sinh, ngay_xem=NGAY, dung_llm=True)
    assert out["che_do_van"] == "template_fallback"
    assert any(x.startswith("vật phẩm") for x in out["loi_kiem_tra"]), out["loi_kiem_tra"]


def test_phong_thuy_sap_lai_van_qua(monkeypatch):
    sinh = {"nam": 1988, "gioi_tinh": "nam"}
    cau = "Giường ngủ nên đặt hướng nào?"
    goc = pt.tra_loi(cau, sinh=sinh, ngay_xem=NGAY, dung_llm=False)["cau_tra_loi"]
    monkeypatch.setattr(hoi_van, "_goi_llm", lambda goi, c: _sap_lai(goc))
    out = pt.tra_loi(cau, sinh=sinh, ngay_xem=NGAY, dung_llm=True)
    assert out["che_do_van"] == "llm", out["loi_kiem_tra"]
