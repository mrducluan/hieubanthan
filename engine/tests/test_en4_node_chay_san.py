# -*- coding: utf-8 -*-
"""EN-4 (mục 1) — Node chạy sẵn: một tiến trình iztro nhận việc theo từng dòng JSON thay vì mỗi lượt một tiến trình
(~110 ms khởi động). Kết quả phải TRÙNG KHÍT đường cũ (mỗi lượt một tiến trình) trên 60 lá golden; tiến trình chết /
treo thì tự dựng lại hoặc quay về đường cũ — người dùng không thấy lỗi."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import tuvi_an_sao as az

_TV = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"]


def _vao(ca, ngay_xem=""):
    d = dt.date.fromisoformat(ca["ngay"])
    return dict(ngay=az._d(d), ti=ca["ti"], gioi_tinh=ca["gioi_tinh"], ngon_ngu="vi-VN", ngay_xem=ngay_xem,
                am=az._am(d, 7.0), am_xem=az._am(dt.date(2026, 11, 1), 7.0) if ngay_xem else "", fix_leap=True)


@pytest.mark.parametrize("i", range(0, 60, 3))
def test_chay_san_trung_duong_cu(i):
    v = _vao(_TV[i])
    assert json.loads(az._may().goi(v)) == json.loads(az._chay_node(**v))


@pytest.mark.parametrize("i", range(1, 60, 6))
def test_chay_san_trung_duong_cu_co_ngay_xem(i):
    v = _vao(_TV[i], "2026-11-1")
    assert json.loads(az._may().goi(v)) == json.loads(az._chay_node(**v))


def test_hai_lan_lien_tiep_khong_dinh_lich_cua_lan_truoc():
    """Bản vá âm lịch Việt trong Node là theo TỪNG lượt — lượt sau không được dùng lại âm lịch của lượt trước."""
    a, b = _vao(_TV[0]), _vao(_TV[5])
    m = az._may()
    m.goi(a)
    assert json.loads(m.goi(b)) == json.loads(az._chay_node(**b))


def test_tien_trinh_chet_thi_dung_lai():
    m = az._may()
    v = _vao(_TV[2])
    m.goi(v)
    for w in m._ds:
        if w.p:
            w.p.kill()
            w.p.wait()
    assert json.loads(m.goi(v)) == json.loads(az._chay_node(**v))


def test_tat_bang_env(monkeypatch):
    monkeypatch.setenv("NODE_CHAY_SAN", "0")
    assert az._dung_chay_san() is False
