# -*- coding: utf-8 -*-
"""H5-en (HTT-2 mục 8, 2026-11-09) — bộ kiểm đầu ra AI cho bản tiếng Anh: cùng hàm `kiem_ai.kiem`, danh mục tiếng Anh chọn
theo ngôn ngữ lượt gọi (cụm cấm `cum_cam_en` của KB, từ y tế, vật phẩm, số viết bằng chữ, câu ý mới, độ dài, liên kết).
Viết trước mã."""
from __future__ import annotations

from app import ngon_ngu
from app.luangiai import giao_thoa
from app.narrative import kiem_ai, luan_giai_van as lgv

NGUON = ("Work: two of your three confirmed points sit in this area. You tend to move fast and carry more than your share. "
         "Try: pick one task this week to hand over, and say so out loud. This is not medical or financial advice.")


def _en(van: str, nguon: str = NGUON, **kw) -> list[str]:
    with ngon_ngu.dung("en"):
        return kiem_ai.kiem(van, nguon, **kw)


def test_ban_dien_dat_sach_qua():
    van = ("Two of the three points you confirmed are about work. You move fast and tend to carry more than your share. "
           "This week, pick one task to hand over and say so out loud. None of this is medical or financial advice.")
    assert _en(van) == []


def test_bat_cum_cam_kb_va_giong_phan():
    assert any(x.startswith("cụm cấm") for x in _en("You will certainly be promoted; this reading is 100% accurate."))
    assert any("guaranteed" in x.lower() for x in _en("Success is guaranteed if you hand over one task."))
    assert any(x.startswith("cụm cấm") for x in _en("Let's delve into the rich tapestry of your work life."))


def test_bat_tu_y_te_vat_pham_so_la_lien_ket():
    assert any(x.startswith("từ y tế") for x in _en("Hand over one task, and get checked for diabetes."))
    assert any(x.startswith("vật phẩm") for x in _en("Wear a crystal bracelet while you hand over a task."))
    assert any(x.startswith("số lạ") for x in _en("Hand over 5 tasks this week."))
    assert any("viết bằng chữ" in x for x in _en("Hand over twenty tasks this week."))
    assert any(x.startswith("liên kết") for x in _en("Read more at example.com before you hand over a task."))


def test_cau_y_moi_va_qua_dai():
    moi = "Your lucky color this season is deep green and the planets favour bold career moves right now, so act quickly."
    assert any(x.startswith("câu ý mới") for x in _en(NGUON + " " + moi))
    assert any(x.startswith("dài hơn") for x in _en(NGUON + " " + " ".join(["You move fast."] * 60)))


def test_so_co_trong_nguon_khong_bi_bat():
    assert not any(x.startswith("số lạ") for x in _en("Two of your three points are about work; try one hand-over.", "two of three points, one task"))


def test_danh_muc_viet_khong_ap_cho_ban_anh():
    """Tên sao Việt / cụm cấm KB Việt không có trong bản Anh; kiem_tra_chuong của luận giải không thêm lỗi lạ."""
    with ngon_ngu.dung("en"):
        assert lgv.kiem_tra_chuong("You move fast and carry more than your share.", NGUON) == []
    with ngon_ngu.dung("vi"):
        assert kiem_ai.kiem("Bạn sẽ chắc chắn sẽ giàu.", "Bạn hay vội.") != []


def test_loi_nhac_tieng_anh_duoc_chon(monkeypatch):
    goi = {}

    def gia(messages, **kw):
        goi["system"] = messages[0]["content"]
        return "You move fast and carry more than your share. Pick one task this week to hand over."
    from app.narrative import ai_goi
    monkeypatch.setattr(ai_goi, "goi_chat", gia)
    with ngon_ngu.dung("en"):
        lgv._goi_llm("Work", [NGUON], "giao_thoa")
    assert goi["system"].startswith("You are an editor") and "cross-check" in goi["system"] and "guaranteed" in goi["system"]
    with ngon_ngu.dung("vi"):
        lgv._goi_llm("Công việc", ["Bạn hay vội. " * 20], "tuvi")
    assert goi["system"].startswith("Bạn là biên tập viên")


def test_giao_thoa_dien_dat_tieng_anh(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "x")
    from app.narrative import ai_goi
    monkeypatch.setattr(ai_goi, "goi_chat", lambda messages, **kw: (
        "Two of the three points you confirmed are about work: you move fast and carry more than your share. "
        "This week, hand one task over and say so. Not medical or financial advice."))
    kq = {"hop": [{"tieu_de": "Work: two confirmed points", "noi_dung": "You tend to move fast and carry more than your share.",
                   "huong_xu_ly": "pick one task this week to hand over, and say so out loud"}],
          "tom_tat": "Two of your three confirmed points sit in work. This is not medical or financial advice."}
    with ngon_ngu.dung("en"):
        ra = giao_thoa.dien_dat(kq)
    assert ra["dien_dat"] == "ai" and "hand one task over" in ra["van_ai"]
    with ngon_ngu.dung("zh-hant"):
        assert giao_thoa.dien_dat(kq)["dien_dat"] == "mau"
