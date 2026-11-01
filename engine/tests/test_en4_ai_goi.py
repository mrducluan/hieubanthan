# -*- coding: utf-8 -*-
"""EN-4 (mục 3) — một hàm gọi AI dùng chung: max_tokens, thử lại một lần có giãn cách khi 429 / 5xx / hết giờ, nhớ kết
quả theo mã băm (gói đầu vào + mô hình + bản prompt) — xem lại không tốn lượt AI; hết lượt thì không gọi mạng."""
from __future__ import annotations

import httpx
import pytest

from app.narrative import ai_goi, ngan_sach


class _Tra:
    def __init__(self, ma, noi_dung="Lời AI."):
        self.status_code, self._n = ma, noi_dung

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("x", request=httpx.Request("POST", "http://x"), response=None)

    def json(self):
        return {"choices": [{"message": {"content": self._n}}]}


def _gia(monkeypatch, lan_tra: list):
    goi = []

    class C:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def post(self, url, headers=None, json=None):
            goi.append(json)
            x = lan_tra.pop(0)
            if isinstance(x, Exception):
                raise x
            return x
    monkeypatch.setattr(httpx, "Client", C)
    monkeypatch.setattr(ai_goi.time, "sleep", lambda s: None)
    monkeypatch.setenv("OPENROUTER_API_KEY", "k")
    ai_goi.xoa_nho()
    return goi


MSG = [{"role": "user", "content": "xin chào"}]


def test_co_max_tokens_va_nho_ket_qua(monkeypatch):
    goi = _gia(monkeypatch, [_Tra(200, "A")])
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500) == "A"
    assert goi[0]["max_tokens"] == 500 and goi[0]["temperature"] == 0.4
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500) == "A"      # lần hai: lấy từ bộ nhớ
    assert len(goi) == 1


def test_thu_lai_mot_lan_khi_429_hoac_mat_ket_noi(monkeypatch):
    goi = _gia(monkeypatch, [_Tra(429), _Tra(200, "B")])
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500) == "B" and len(goi) == 2
    goi = _gia(monkeypatch, [httpx.ConnectError("c"), _Tra(200, "C")])
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500) == "C" and len(goi) == 2


def test_loi_hai_lan_thi_bao_loi(monkeypatch):
    _gia(monkeypatch, [_Tra(503), _Tra(503)])
    with pytest.raises(httpx.HTTPStatusError):
        ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500)


def test_khac_mo_hinh_khac_nho(monkeypatch):
    goi = _gia(monkeypatch, [_Tra(200, "D"), _Tra(200, "E")])
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500, mo_hinh="a") == "D"
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500, mo_hinh="b") == "E"


def test_het_luot_khong_goi_mang_nhung_nho_van_tra(monkeypatch):
    goi = _gia(monkeypatch, [_Tra(200, "F")])
    ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500)

    def het():
        raise ngan_sach.HetLuot("het")
    monkeypatch.setattr(ngan_sach, "kiem_luot", het)
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500) == "F"      # đã nhớ → không tốn lượt
    with pytest.raises(ngan_sach.HetLuot):
        ai_goi.goi_chat([{"role": "user", "content": "câu khác"}], nhiet_do=0.4, max_tokens=500)
    assert len(goi) == 1


def test_mot_luat_hoc_dung_chung():
    """EN-4 (mục 4): ngưỡng HỌC (30 phiếu gắn tỉ lệ; ≥ 100 phiếu & < 40% đúng → đang xem lại) ở MỘT chỗ."""
    from app.luangiai import doi_song_chung as dsc, doi_song_khuon as kh
    assert kh.danh_gia_phieu({"dung": 10, "chua_dung": 10}) is None
    assert kh.danh_gia_phieu({"dung": 20, "chua_dung": 10}) == (0.67, 30, False)
    assert kh.danh_gia_phieu({"dung": 39, "chua_dung": 61}) == (0.39, 100, True)
    h = [{"ma_mau": "a", "tieu_de": "A"}, {"ma_mau": "b", "tieu_de": "B"}]
    chon, xem_lai = dsc._ap_hoc(h, {"a": {"dung": 30, "chua_dung": 70}}, {"b": "chua_dung"})
    assert [x["ma_mau"] for x in chon] == ["b"] and xem_lai == ["Đang xem lại: A"]


def test_khong_nho_ban_khong_qua_kiem(monkeypatch):
    goi = _gia(monkeypatch, [_Tra(200, "xấu"), _Tra(200, "tốt")])
    kiem = lambda v: ["lỗi"] if v == "xấu" else []   # noqa: E731
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500, kiem=kiem) == "xấu"
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500, kiem=kiem) == "tốt"     # không lấy bản xấu từ bộ nhớ
    assert len(goi) == 2


def test_ban_bi_cat_la_loi(monkeypatch):
    class Cat(_Tra):
        def json(self):
            return {"choices": [{"message": {"content": "dở dang"}, "finish_reason": "length"}]}
    _gia(monkeypatch, [Cat(200)])
    with pytest.raises(ai_goi.BiCat):
        ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=50)


def test_het_gio_khong_thu_lai(monkeypatch):
    goi = _gia(monkeypatch, [httpx.ReadTimeout("t"), _Tra(200, "C")])
    with pytest.raises(httpx.ReadTimeout):
        ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500)
    assert len(goi) == 1


def test_quan_tri_khong_tru_luot_nguoi_dung(monkeypatch):
    _gia(monkeypatch, [_Tra(200, "G")])

    def het():
        raise ngan_sach.HetLuot("het")
    monkeypatch.setattr(ngan_sach, "kiem_luot", het)
    assert ai_goi.goi_chat(MSG, nhiet_do=0.4, max_tokens=500, tru_luot=False, nho=False) == "G"
