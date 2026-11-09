# -*- coding: utf-8 -*-
"""QTE — Tarot tiếng Anh: bản phủ `kb/data/en/tarot_kb.json` + mẫu câu `loi_khuon.json` phải phủ MỌI chữ hiện ra:
bài đọc của cả 7 trải bài, hỏi đáp, lá ngày, bộ bài → không còn một ký tự tiếng Việt nào. Bản Việt không đổi."""
from __future__ import annotations

import datetime as dt
import json
import re

import pytest

from app import ngon_ngu
from app.kb import tarot_kb as kb
from app.luangiai import tarot as tr, tarot_cau_hoi

XEM = dt.date(2026, 11, 8)
_VI = re.compile(r"[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]")
# chữ Việt không dấu hay lọt vào bản Anh khi quên dịch (nhãn / tên lá / từ nối)
_VI_KHONG_DAU = re.compile(r"\b(ngược|xuôi|lá|của|và|chuyện|bạn|Cốc|Gậy|Kiếm|Tiền|Chàng Khờ|nên|việc)\b")

CELTIC = [{"id": "kiem_hiep_si"}, {"id": "dai_16"}, {"id": "dai_2", "nguoc": True}, {"id": "coc_3"}, {"id": "dai_19"},
          {"id": "tien_8"}, {"id": "dai_9"}, {"id": "gay_hoang_hau"}, {"id": "kiem_9", "nguoc": True}, {"id": "coc_10"}]
LA_5 = [{"id": "gay_3"}, {"id": "coc_5", "nguoc": True}, {"id": "dai_17"}, {"id": "tien_vua"}, {"id": "kiem_2", "nguoc": True}]
LA_3 = [{"id": "gay_3"}, {"id": "coc_5", "nguoc": True}, {"id": "dai_17"}]
LA_1 = [{"id": "dai_0", "nguoc": True}]


def _chuoi(x, duong=""):
    if isinstance(x, dict):
        for k, v in x.items():
            yield from _chuoi(v, f"{duong}.{k}")
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from _chuoi(v, f"{duong}[{i}]")
    elif isinstance(x, str):
        yield duong, x


def _khong_viet(bc: dict, bo_qua: tuple[str, ...] = ()):
    # tên lá Marseille (tiếng Pháp, có dấu) là tên riêng — không phải chữ Việt sót
    loi = [(d, s[:80]) for d, s in _chuoi(bc) if (_VI.search(s) or _VI_KHONG_DAU.search(s)) and not d.endswith(bo_qua + (".tdm_ten",))]
    assert not loi, loi[:12]


@pytest.fixture(autouse=True)
def _en():
    with ngon_ngu.dung("en"):
        yield


def test_ban_phu_du_78_la_va_khong_chu_viet():
    la = kb.la()
    assert len(la) == 78
    for ma, x in la.items():
        assert x["ten"] == x["en"], ma
        assert x["y_nguoc"].startswith("Reversed: ") and "Ask yourself: " in x["y_nguoc"], ma
        assert "truong_phai" not in x and "viec_lv" not in x, ma   # bản phủ tắt → mã rơi về trích Waite / `viec`
        assert set(x["linh_vuc"]) >= {"tinh_cam", "cong_viec", "tien_bac", "suc_khoe"}, ma
    _khong_viet({"la": la, "mau": kb.mau(), "trai_bai": kb.trai_bai(), "chuong": kb.chuong(), "bo": kb.bo(),
                 "nguyen_to": kb.nguyen_to(), "pham_gia": kb.pham_gia(), "hanh_tinh": kb.hanh_tinh(), "dai_dien": kb.dai_dien(),
                 "viec": kb.viec_truoc_khi_quyet()}, bo_qua=(".nghia", ".nguyen_van"))   # `trich[].nghia` là ghi chú nội bộ tiếng Việt, không ra màn hình


@pytest.mark.parametrize("trai_bai,la,cau", [
    ("celtic", CELTIC, "Should I change jobs this year?"),
    ("nam_la", LA_5, "Will my relationship with my partner get better?"),
    ("hai_lua_chon", LA_5, "Should I stay in my job or start my own business?"),
    ("khi_nao", LA_3, "When should I move to a new city?"),
    ("ba_la_thoi_gian", LA_3, "How is my money situation going?"),
    ("ba_la_loi_khuyen", LA_3, "Why do I keep feeling stuck at work?"),
    ("mot_la", LA_1, None),
])
def test_bai_doc_tieng_anh_khong_con_chu_viet(trai_bai, la, cau):
    bc = tr.bao_cao(trai_bai, la, cau_hoi=cau, ngay_xem=XEM, nam_sinh=1990, gioi_tinh="nu", bo_dai_dien="coc")
    assert bc["chuong"] and bc["ten"]
    _khong_viet({k: v for k, v in bc.items() if k not in ("hieu_cau",)}, bo_qua=(".ma", ".id", ".phai", ".loai", ".ma_mau"))
    if cau:
        assert bc["hieu_cau"]["co_cau"]
        c0 = bc["chuong"][0]
        assert c0["ma"] == "tra_loi" and c0["hop"], c0


def test_hieu_cau_tieng_anh():
    hc = tarot_cau_hoi.hieu_cau("Should I change jobs this year?")
    assert hc["y_dinh"] == "quyet_dinh" and hc["viec"] == "doi_viec" and hc["linh_vuc"] == "cong_viec"
    hc = tarot_cau_hoi.hieu_cau("Should I stay in my job or start my own business?")
    assert hc["y_dinh"] == "lua_chon" and hc["lua_chon"]
    hc = tarot_cau_hoi.hieu_cau("When will I meet someone new?")
    assert hc["y_dinh"] == "thoi_diem" and hc["linh_vuc"] == "tinh_cam"


@pytest.mark.parametrize("cau", ["What does the Tower mean?", "Three of Cups reversed in love", "What is the Celtic Cross?",
                                 "What does a reversed card mean?", "Does he still love me?", "What is tarot and is it accurate?"])
def test_hoi_dap_tieng_anh(cau):
    kq = tr.hoi(cau)
    assert kq["cau_tra_loi"]
    _khong_viet(kq, bo_qua=(".la", ".xu_ly", ".linh_vuc"))


def test_hoi_dap_vi_tri_trong_trai_bai_vua_rut():
    kq = tr.hoi("What does the outcome card mean?", trai_bai="celtic", la=CELTIC)
    assert kq["xu_ly"] == "vi_tri" and kq["vi_tri"] == 9
    _khong_viet(kq, bo_qua=(".la", ".xu_ly", ".linh_vuc"))


def test_an_toan_tieng_anh_qua_mot_bo_chan():
    bc = tr.bao_cao("mot_la", LA_1, cau_hoi="I want to end it all, what do the cards say?", ngay_xem=XEM)
    assert bc["hieu_cau"]["chan"] == "an_toan"
    assert "988" in bc["chuong"][0]["doan"][0] or "crisis" in bc["chuong"][0]["doan"][0].lower()
    kq = tr.hoi("Which lottery numbers should I play this week?")
    assert kq["xu_ly"] == "tu_choi_nhe"
    _khong_viet(kq, bo_qua=(".xu_ly",))


def test_la_ngay_va_bo_bai_tieng_anh():
    _khong_viet(tr.la_ngay(XEM), bo_qua=(".id",))
    bb = tr.bo_bai()
    _khong_viet({"la": bb["la"], "bo": bb["bo"], "trai_bai": bb["trai_bai"], "chu_de": bb["chu_de"], "truong_phai": bb["truong_phai"]}, bo_qua=(".id", ".ma"))


def test_ban_viet_khong_doi():
    with ngon_ngu.dung("vi"):
        la = kb.la()["dai_0"]
        assert la["ten"] == "Chàng Khờ" and la["truong_phai"]["rws"]["loi"]
        bc = tr.bao_cao("mot_la", LA_1, cau_hoi="Tôi có nên đổi việc không?", ngay_xem=XEM)
        assert "Lá" in json.dumps(bc, ensure_ascii=False)
