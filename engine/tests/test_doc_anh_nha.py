# -*- coding: utf-8 -*-
"""PT-V2 — "máy đọc ảnh nhà" ở tầng NARRATIVE (viết TRƯỚC hàm).

Lớp tri nhận: mô hình thị giác (OpenRouter) CHỈ gắn nhãn dấu hiệu quan sát được trong ảnh, KHÔNG luận; mọi nhãn trả về
đều `can_xac_nhan` — người dùng bấm Đúng/Không rồi mới thành dấu hiệu `nguon: anh, xac_nhan: true` (luật `_nhan` có sẵn
ở phongthuy_bo_cuc). Ảnh KHÔNG ghi đĩa, KHÔNG log, KHÔNG vào Sentry — chỉ đi qua lượt gọi.
Hậu xử lý TẤT ĐỊNH: bỏ mã lạ / phòng lạ, kẹp độ tin, lọc lý do, không trả tên mô hình (BM-1).
"""
from __future__ import annotations

import base64
import json
import logging

import httpx
import pytest
from fastapi.testclient import TestClient

from app.luangiai import phongthuy_bo_cuc as bc
from app.main import app
from app.narrative import doc_anh_nha as da
from app.narrative import ngan_sach

client = TestClient(app)
ANH_B64 = base64.b64encode(b"\xff\xd8\xff\xe0" + b"anh-gia-khong-phai-jpeg-that-" * 40).decode()
DAU_VET = ANH_B64[20:60]            # một mẩu nội dung ảnh — không được xuất hiện trong log

TRA_LOI_MAU = {
    "dau_hieu": [
        {"ma": "guong_giuong", "co": True, "do_tin": 0.92, "ly_do": "Thấy gương tủ lớn đối diện giường."},
        {"ma": "xa_ngang", "co": True, "do_tin": 1.7, "ly_do": "Dầm bê tông nhô ngay trên đầu giường " + "rất dài " * 60
                                                              + " xem thêm tại https://vi-du.com/a hoặc gọi 0901234567."},
        {"ma": "ma_khong_co", "co": True, "do_tin": 0.9, "ly_do": "mã lạ"},
        {"ma": "cua_doi_nhau", "co": False, "do_tin": 0.2, "ly_do": "độ tin thấp"},
        {"ma": "be_ca", "co": True, "do_tin": -0.4, "ly_do": "âm"},
        {"ma": "cay_truoc_cua", "co": False, "do_tin": "0.5", "ly_do": "chuỗi số"},
        {"ma": "duong_dam", "co": "yes", "do_tin": 0.6, "ly_do": ""},
        {"ma": "guong_giuong", "co": True, "do_tin": 0.4, "ly_do": "trùng mã — chỉ giữ cái tin hơn"},
    ],
    "phong": [{"phong": "phong_ngu_chinh", "do_tin": 0.95}, {"phong": "phong_khach", "do_tin": 0.9},
              {"phong": "bep", "do_tin": 0.1}, {"phong": "ve_sinh", "do_tin": 0.5}, {"phong": "ban_tho", "do_tin": 0.45},
              {"phong": "phong_lam_viec", "do_tin": 0.4}],
    "luu_y": ["Ảnh hơi tối ở góc trái.", "x" * 400, "Chỉ thấy một phần phòng.", "Câu thứ tư bị bỏ."],
}


class _PhanHoi:
    def __init__(self, noi_dung: str, status: int = 200):
        self.status_code = status
        self._noi_dung = noi_dung

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("lỗi", request=None, response=None)  # type: ignore[arg-type]

    def json(self):
        return {"choices": [{"message": {"content": self._noi_dung}}]}


def _gia_client(monkeypatch, noi_dung: str, ghi: list | None = None, status: int = 200):
    """Thay httpx.Client bằng bản giả: ghi lại body gửi đi (để kiểm prompt / ảnh) và trả `noi_dung`."""
    class Client:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def post(self, url, headers=None, json=None, **k):
            if ghi is not None:
                ghi.append({"url": url, "headers": headers, "json": json})
            return _PhanHoi(noi_dung, status)
    monkeypatch.setattr(da.httpx, "Client", Client)


def _yc(**thay) -> dict:
    return {"anh": [{"du_lieu": ANH_B64, "loai": "image/jpeg"}], "goc": "phòng ngủ", "loai_nha": "can_ho", "y_dinh": "suc_khoe", **thay}


@pytest.fixture
def co_khoa(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "khoa-gia")
    monkeypatch.delenv("DOC_ANH_MODEL", raising=False)
    monkeypatch.setattr(ngan_sach, "_chung", ngan_sach.NganSach(gio_nguoi=100, gio_tong=100, ngay_tong=100))


# ----------------------------------------------------------------------------- hậu xử lý tất định
def test_hau_xu_ly_loc_ma_la_kep_do_tin_cat_ly_do(co_khoa, monkeypatch):
    ghi: list = []
    _gia_client(monkeypatch, json.dumps(TRA_LOI_MAU, ensure_ascii=False), ghi)
    r = da.doc_anh(_yc())
    assert r["da_bat"] is True and r["ly_do_tat"] is None and r["can_xac_nhan"] is True
    assert "mo_hinh" not in r and "model" not in r                                  # BM-1
    ma = [d["ma"] for d in r["dau_hieu"]]
    assert set(ma) <= set(bc.DAU_HIEU) and "ma_khong_co" not in ma and len(ma) == len(set(ma))
    assert "cua_doi_nhau" not in ma and "be_ca" not in ma                           # do_tin < 0,35 / âm → bỏ
    assert ma[0] == "xa_ngang" and ma[1] == "guong_giuong"                          # sắp giảm theo do_tin; xa_ngang kẹp = 1 > 0,92
    tin = {d["ma"]: d["do_tin"] for d in r["dau_hieu"]}
    assert tin["guong_giuong"] == 0.92 and tin["xa_ngang"] == 1.0 and tin["cay_truoc_cua"] == 0.5
    assert all(0 <= d["do_tin"] <= 1 for d in r["dau_hieu"])
    co = {d["ma"]: d["co"] for d in r["dau_hieu"]}
    assert co["cay_truoc_cua"] is False and co["duong_dam"] is True                 # "yes" → True; kiểu bool tất định
    xa = tin and next(d for d in r["dau_hieu"] if d["ma"] == "xa_ngang")
    assert len(xa["ly_do"]) <= 200 and "http" not in xa["ly_do"] and "0901234567" not in xa["ly_do"]
    assert all(isinstance(d["ly_do"], str) for d in r["dau_hieu"])
    # phòng: bỏ phòng lạ, bỏ do_tin thấp, tối đa 3, sắp giảm
    assert [p["phong"] for p in r["phong_doan"]] == ["phong_ngu_chinh", "ve_sinh", "ban_tho"]
    assert all(p["phong"] in bc.TEN_PHONG for p in r["phong_doan"])
    # lưu ý ≤ 3 câu, mỗi câu ≤ 160 ký tự
    assert len(r["luu_y"]) <= 3 and all(len(x) <= 160 for x in r["luu_y"]) and r["luu_y"][0] == "Ảnh hơi tối ở góc trái."
    # lời gọi: ảnh đi dạng data URL trong message vision, prompt hệ thống liệt kê đúng mã dấu hiệu + phòng, đòi JSON
    body = ghi[0]["json"]
    assert body["model"] == da.DEFAULT_MODEL and body.get("response_format") == {"type": "json_object"}
    he_thong = body["messages"][0]["content"]
    assert all(m in he_thong for m in bc.DAU_HIEU) and all(p in he_thong for p in bc.TEN_PHONG)
    assert "không" in he_thong.lower() and "json" in he_thong.lower()
    nd = body["messages"][1]["content"]
    assert isinstance(nd, list) and nd[0]["type"] == "text" and "phòng ngủ" in nd[0]["text"]
    assert nd[1]["type"] == "image_url" and nd[1]["image_url"]["url"].startswith("data:image/jpeg;base64,")
    assert ghi[0]["headers"]["Authorization"] == "Bearer khoa-gia"


def test_toi_da_8_dau_hieu_va_boc_json_trong_khoi_ma(co_khoa, monkeypatch):
    nhieu = {"dau_hieu": [{"ma": m, "co": True, "do_tin": 0.5 + i / 100, "ly_do": "thấy"} for i, m in enumerate(bc.DAU_HIEU)],
             "phong": [], "luu_y": []}
    _gia_client(monkeypatch, "Đây là kết quả:\n```json\n" + json.dumps(nhieu, ensure_ascii=False) + "\n```\n")
    r = da.doc_anh(_yc())
    assert r["da_bat"] and len(r["dau_hieu"]) == 8 and r["phong_doan"] == [] and r["luu_y"] == []
    assert [d["do_tin"] for d in r["dau_hieu"]] == sorted((d["do_tin"] for d in r["dau_hieu"]), reverse=True)


# ----------------------------------------------------------------------------- tắt / hết lượt / lỗi dịch vụ
def test_khong_khoa_thi_tat_khong_goi_mang(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    def cam(*a, **k):
        raise AssertionError("không được gọi mạng khi chưa có khoá")
    monkeypatch.setattr(da.httpx, "Client", cam)
    r = da.doc_anh(_yc())
    assert r == {"da_bat": False, "ly_do_tat": "chua_dat_khoa", "dau_hieu": [], "phong_doan": [], "luu_y": [], "can_xac_nhan": True}


def test_het_luot(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "khoa-gia")
    monkeypatch.setattr(ngan_sach, "_chung", ngan_sach.NganSach(gio_nguoi=0, gio_tong=0, ngay_tong=0))

    def cam(*a, **k):
        raise AssertionError("không được gọi mạng khi hết lượt")
    monkeypatch.setattr(da.httpx, "Client", cam)
    r = da.doc_anh(_yc())
    assert r["da_bat"] is False and r["ly_do_tat"] == "het_luot" and r["dau_hieu"] == []


@pytest.mark.parametrize("noi_dung,status", [("không phải json", 200), ("{\"dau_hieu\": 5}", 200), ("{}", 500)])
def test_loi_dich_vu_khong_lo_anh_trong_log(co_khoa, monkeypatch, caplog, noi_dung, status):
    _gia_client(monkeypatch, noi_dung, status=status)
    with caplog.at_level(logging.DEBUG):
        r = da.doc_anh(_yc())
    assert r["da_bat"] is False and r["ly_do_tat"] == "loi_dich_vu" and r["dau_hieu"] == [] and r["can_xac_nhan"] is True
    assert DAU_VET not in caplog.text and ANH_B64 not in caplog.text
    assert noi_dung not in caplog.text or noi_dung == "{}"           # không log thân phản hồi


def test_mang_hong_la_loi_dich_vu(co_khoa, monkeypatch, caplog):
    class Hong:
        def __init__(self, *a, **k):
            raise httpx.ConnectError("mạng giả hỏng " + DAU_VET)
    monkeypatch.setattr(da.httpx, "Client", Hong)
    with caplog.at_level(logging.DEBUG):
        r = da.doc_anh(_yc())
    assert r["ly_do_tat"] == "loi_dich_vu" and DAU_VET not in caplog.text


def test_rong_khi_mo_hinh_khong_thay_gi(co_khoa, monkeypatch):
    _gia_client(monkeypatch, json.dumps({"dau_hieu": [], "phong": [], "luu_y": []}))
    r = da.doc_anh(_yc())
    assert r["da_bat"] is True and r["ly_do_tat"] is None and r["dau_hieu"] == []


def test_doc_mo_hinh_tu_env(co_khoa, monkeypatch):
    monkeypatch.setenv("DOC_ANH_MODEL", "nha-cung-cap/mo-hinh-x")
    ghi: list = []
    _gia_client(monkeypatch, json.dumps({"dau_hieu": [], "phong": [], "luu_y": []}), ghi)
    r = da.doc_anh(_yc())
    assert ghi[0]["json"]["model"] == "nha-cung-cap/mo-hinh-x"
    assert "mo-hinh-x" not in json.dumps(r)                                        # BM-1: không lộ tên mô hình


# ----------------------------------------------------------------------------- route
def test_route_hop_dong(co_khoa, monkeypatch):
    _gia_client(monkeypatch, json.dumps(TRA_LOI_MAU, ensure_ascii=False))
    r = client.post("/v1/phongthuy/doc-anh", json=_yc())
    assert r.status_code == 200, r.text
    d = r.json()
    assert set(d) >= {"da_bat", "ly_do_tat", "dau_hieu", "phong_doan", "luu_y", "can_xac_nhan"}
    assert d["da_bat"] and d["ly_do_tat"] is None and d["can_xac_nhan"] is True
    assert {"ma", "co", "do_tin", "ly_do"} == set(d["dau_hieu"][0]) and {"phong", "do_tin"} == set(d["phong_doan"][0])
    assert "mo_hinh" not in d and "gemini" not in r.text.lower() and "openrouter" not in r.text.lower()
    # nhãn từ ảnh ghép vào bố cục: chưa xác nhận → không luận, chỉ nằm ở can_xac_nhan
    bo = {"huong_nha_do": 180, "dau_hieu": {x["ma"]: {"co": x["co"], "do_tin": x["do_tin"], "nguon": "anh"} for x in d["dau_hieu"] if x["co"]}}
    kq = bc.luan(bo, None)
    assert kq["dien_giai"]["dau_hieu"] == [] and {c["ma"] for c in kq["can_xac_nhan"]} == {x["ma"] for x in d["dau_hieu"] if x["co"]}


def test_route_khong_khoa_tra_200_tat(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    r = client.post("/v1/phongthuy/doc-anh", json=_yc())
    assert r.status_code == 200 and r.json()["da_bat"] is False and r.json()["ly_do_tat"] == "chua_dat_khoa"


def test_route_422_khi_anh_sai(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    lon = "A" * 1_600_004
    r = client.post("/v1/phongthuy/doc-anh", json=_yc(anh=[{"du_lieu": lon, "loai": "image/png"}]))
    assert r.status_code == 422 and "ảnh" in r.text.lower()
    vua = "A" * 1_400_000
    r = client.post("/v1/phongthuy/doc-anh", json=_yc(anh=[{"du_lieu": vua, "loai": "image/png"}] * 3))
    assert r.status_code == 422                                                     # tổng > 4.000.000
    assert client.post("/v1/phongthuy/doc-anh", json=_yc(anh=[])).status_code == 422
    assert client.post("/v1/phongthuy/doc-anh", json=_yc(anh=[{"du_lieu": ANH_B64, "loai": "image/jpeg"}] * 4)).status_code == 422
    assert client.post("/v1/phongthuy/doc-anh", json=_yc(anh=[{"du_lieu": "kh@ng-ph@i-base64!!", "loai": "image/jpeg"}])).status_code == 422
    assert client.post("/v1/phongthuy/doc-anh", json=_yc(anh=[{"du_lieu": "data:image/jpeg;base64," + ANH_B64, "loai": "image/jpeg"}])).status_code == 422
    assert client.post("/v1/phongthuy/doc-anh", json=_yc(anh=[{"du_lieu": ANH_B64, "loai": "image/gif"}])).status_code == 422
    assert client.post("/v1/phongthuy/doc-anh", json=_yc(goc="x" * 61)).status_code == 422
    assert client.post("/v1/phongthuy/doc-anh", json=_yc(them=1)).status_code == 422


def test_route_can_khoa_engine(monkeypatch):
    monkeypatch.setenv("ENGINE_API_KEY", "khoa-bi-mat-dai-hon-16")
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    c = TestClient(app)
    assert c.post("/v1/phongthuy/doc-anh", json=_yc()).status_code == 401
    assert c.post("/v1/phongthuy/doc-anh", json=_yc(), headers={"x-engine-key": "khoa-bi-mat-dai-hon-16"}).status_code == 200
