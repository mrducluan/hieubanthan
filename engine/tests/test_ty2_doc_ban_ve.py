# -*- coding: utf-8 -*-
"""TY-2 đợt 4 — máy đọc bản vẽ mặt bằng (viết TRƯỚC khi nối web). Lớp tri nhận chỉ trả CHỖ gợi ý (toạ độ theo ảnh) +
đường bao nhà, mọi chỗ `can_xac_nhan`; hậu xử lý tất định; ảnh không vào log; không khoá → tắt êm."""
from __future__ import annotations

import base64
import json
import logging

import httpx
from fastapi.testclient import TestClient

from app.luangiai import phongthuy_vi_tri as pvt
from app.main import app
from app.narrative import doc_ban_ve as dbv
from app.narrative import ngan_sach

client = TestClient(app)
ANH = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"ban-ve-gia-" * 60).decode()
DAU_VET = ANH[30:70]


def test_danh_muc_khop_so_do():
    assert dbv.LOAI == pvt.LOAI


def test_hau_xu_ly_tat_dinh():
    tho = {"la_ban_ve": True, "khung": {"x0": 0.9, "y0": 0.1, "x1": 0.1, "y1": 0.95},
           "cho": [{"ma": "bep", "x": 0.5, "y": 0.9, "do_tin": 0.8, "ly_do": "chữ BẾP https://x.vn 0901234567"},
                   {"ma": "bep", "x": 0.4, "y": 0.8, "do_tin": 0.6},
                   {"ma": "cua_chinh", "x": 0.5, "y": 1.03, "do_tin": 0.9},          # sát mép → kẹp
                   {"ma": "ve_sinh", "x": 1.4, "y": 0.5, "do_tin": 0.9},             # ngoài ảnh → bỏ
                   {"ma": "phong_khach", "x": 0.2, "y": 0.2, "do_tin": 0.9},         # mã lạ → bỏ
                   {"ma": "ban_tho", "x": 0.2, "y": 0.2, "do_tin": 0.2},             # dưới ngưỡng → bỏ
                   {"ma": "cau_thang", "x": True, "y": 0.2, "do_tin": 0.9}],
           "luu_y": ["Ảnh hơi nghiêng", "", "a", "b", "c"]}
    r = dbv.hau_xu_ly(tho)
    assert r["khung"] == {"x0": 0.1, "y0": 0.1, "x1": 0.9, "y1": 0.95}
    assert [c["ma"] for c in r["cho"]] == ["cua_chinh", "bep"]                     # theo thứ tự danh mục
    bep = r["cho"][1]
    assert (bep["x"], bep["y"], bep["do_tin"]) == (0.5, 0.9, 0.8)
    assert "http" not in bep["ly_do"] and "0901" not in bep["ly_do"]
    assert r["cho"][0]["y"] == 1.0
    assert len(r["luu_y"]) == 3 and r["can_xac_nhan"] is True
    assert dbv.hau_xu_ly(tho) == r


def test_khong_phai_ban_ve_thi_khong_goi_y():
    r = dbv.hau_xu_ly({"la_ban_ve": False, "khung": {"x0": 0, "y0": 0, "x1": 1, "y1": 1},
                       "cho": [{"ma": "bep", "x": 0.5, "y": 0.5, "do_tin": 0.9}]})
    assert r["cho"] == [] and r["khung"] is None and r["la_ban_ve"] is False


def test_khung_qua_nho_bo():
    assert dbv.hau_xu_ly({"khung": {"x0": 0.4, "y0": 0.4, "x1": 0.45, "y1": 0.9}})["khung"] is None


def test_khong_khoa_tat_em(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/phongthuy/doc-ban-ve", json={"anh": {"du_lieu": ANH, "loai": "image/png"}, "tang": 1})
    assert r.status_code == 200
    assert r.json()["da_bat"] is False and r.json()["ly_do_tat"] == "chua_dat_khoa" and r.json()["cho"] == []


def test_route_goi_mo_hinh_va_khong_log_anh(monkeypatch, caplog):
    monkeypatch.setenv("OPENROUTER_API_KEY", "k")
    monkeypatch.setattr(ngan_sach, "kiem_luot", lambda *a, **k: None)
    gui: dict = {}
    noi = {"la_ban_ve": True, "khung": {"x0": 0.05, "y0": 0.05, "x1": 0.95, "y1": 0.95},
           "cho": [{"ma": "cua_chinh", "x": 0.5, "y": 0.95, "do_tin": 0.9, "ly_do": "cửa ở mặt tiền"}]}

    class Gia:
        """Thay httpx.Client của module (không vá lớp httpx.Client — TestClient là lớp con của nó)."""
        def __init__(self, *a, **k): ...
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def post(self, url, headers=None, json=None):  # noqa: A002
            gui.update(json)
            return httpx.Response(200, json={"choices": [{"message": {"content": "```json\n" + __import__("json").dumps(noi) + "\n```"}}]},
                                  request=httpx.Request("POST", url))

    monkeypatch.setattr(dbv.httpx, "Client", Gia)
    with caplog.at_level(logging.DEBUG):
        r = client.post("/v1/phongthuy/doc-ban-ve", json={"anh": {"du_lieu": ANH, "loai": "image/png"}, "loai_nha": "nha_pho"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["da_bat"] and d["cho"][0]["ma"] == "cua_chinh" and d["khung"]["x1"] == 0.95
    assert "model" not in json.dumps(d)                                              # BM-1
    assert gui["messages"][1]["content"][1]["image_url"]["url"].startswith("data:image/png;base64,")
    assert DAU_VET not in caplog.text


def test_loi_dich_vu_tat_em(monkeypatch, caplog):
    monkeypatch.setenv("OPENROUTER_API_KEY", "k")
    monkeypatch.setattr(ngan_sach, "kiem_luot", lambda *a, **k: None)
    class Hong:
        def __init__(self, *a, **k): ...
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def post(self, *a, **k): raise httpx.ConnectError("x")

    monkeypatch.setattr(dbv.httpx, "Client", Hong)
    r = client.post("/v1/phongthuy/doc-ban-ve", json={"anh": {"du_lieu": ANH, "loai": "image/png"}})
    assert r.json()["ly_do_tat"] == "loi_dich_vu" and DAU_VET not in caplog.text


def test_dau_vao_la_bi_tu_choi():
    assert client.post("/v1/phongthuy/doc-ban-ve", json={"anh": {"du_lieu": ANH, "loai": "image/gif"}}).status_code == 422
    assert client.post("/v1/phongthuy/doc-ban-ve", json={"anh": {"du_lieu": ANH, "loai": "image/png"}, "tang": 0}).status_code == 422
