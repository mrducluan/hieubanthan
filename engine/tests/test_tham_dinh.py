# -*- coding: utf-8 -*-
"""EEAT-1 — chủ biên, tác giả, thẩm định cho trang kiến thức (chủ dự án yêu cầu 2026-10-09).

Nguyên tắc minh bạch: tên chuyên gia chỉ đứng ở vai trò ĐÚNG với việc người đó đã làm.
- `chu_bien`: người chịu trách nhiệm biên tập toàn site — mọi trang.
- `tac_gia`: chỉ trang có nội dung do chính người đó viết (ý nghĩa số — chủ dự án tự viết).
- `tham_dinh`: chỉ trang người đó ĐÃ đọc và duyệt (ghi trong tham_dinh.json) → trang_thai "da_duyet".
Trang chưa thẩm định giữ `bien_soan = "ai_ho_tro"` và trang_thai "nhap_ai".
"""
from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from app.kb import tham_dinh as td
from app.kb import trang
from app.main import app

client = TestClient(app)


@pytest.fixture
def so_dang_ky(monkeypatch):
    """Sổ thẩm định giả trong bộ nhớ (không đụng file thật)."""
    so = {"chuyen_gia": ["duc-luan"], "trang": {}}
    monkeypatch.setattr(td, "_doc_so", lambda: so)
    return so


def test_moi_trang_co_chu_bien_va_cach_bien_soan():
    for t in trang.danh_sach():
        assert t["chu_bien"] == "duc-luan"
        assert t["bien_soan"] in ("chuyen_gia", "ai_ho_tro")


def test_trang_so_do_chu_du_an_viet_co_tac_gia():
    t = trang.lay("so", "so-7")
    assert t["tac_gia"] == "duc-luan" and t["bien_soan"] == "chuyen_gia" and t["trang_thai"] == "da_duyet"


def test_trang_nhap_ai_khong_gan_ten_tac_gia(so_dang_ky):
    t = trang.lay("que", "que-1-can")
    assert t["tac_gia"] is None and t["tham_dinh"] is None
    assert t["bien_soan"] == "ai_ho_tro" and t["trang_thai"] == "nhap_ai"


def test_da_tham_dinh_thi_doi_trang_thai(so_dang_ky):
    so_dang_ky["trang"]["que/que-1-can"] = {"nguoi": "duc-luan", "ngay": "2026-10-10"}
    t = trang.lay("que", "que-1-can")
    assert t["tham_dinh"] == {"nguoi": "duc-luan", "ngay": "2026-10-10"}
    assert t["trang_thai"] == "da_duyet"
    assert t["tac_gia"] is None            # thẩm định ≠ viết: vẫn ghi rõ biên soạn có AI hỗ trợ
    assert t["bien_soan"] == "ai_ho_tro"
    assert t["cap_nhat"] == "2026-10-10"   # ngày thẩm định mới hơn → ngày cập nhật trang
    muc = next(x for x in trang.danh_sach() if x["slug"] == "que-1-can")
    assert muc["trang_thai"] == "da_duyet" and muc["tham_dinh"]["nguoi"] == "duc-luan"


def test_so_that_hop_le():
    """File thật: chuyên gia đã khai báo, khoá trỏ đúng trang có thật, ngày ISO."""
    so = td._doc_so()
    co = {(t["loai"], t["slug"]) for t in trang.danh_sach()}
    for k, v in so["trang"].items():
        loai, slug = k.split("/", 1)
        assert (loai, slug) in co, k
        assert v["nguoi"] in so["chuyen_gia"], k
        assert len(v["ngay"]) == 10 and v["ngay"][4] == "-", k


def test_danh_dau_va_bo(so_dang_ky):
    td.danh_dau(so_dang_ky, "sao", "sao-tu-vi", "duc-luan", "2026-10-11")
    assert so_dang_ky["trang"]["sao/sao-tu-vi"]["nguoi"] == "duc-luan"
    with pytest.raises(ValueError):
        td.danh_dau(so_dang_ky, "sao", "khong-co", "duc-luan", "2026-10-11")
    with pytest.raises(ValueError):
        td.danh_dau(so_dang_ky, "sao", "sao-tu-vi", "nguoi-la", "2026-10-11")
    td.bo(so_dang_ky, "sao", "sao-tu-vi")
    assert "sao/sao-tu-vi" not in so_dang_ky["trang"]


def test_hang_doi_uu_tien_trang_tru_cot(so_dang_ky):
    hd = td.hang_doi()
    assert hd and all(x["trang_thai"] != "da_duyet" for x in hd)
    # Trang trụ cột (sao, cung, quẻ) đứng trước cụm trang dài (sao × cung, mệnh theo năm).
    thu_tu = [x["loai"] for x in hd]
    assert thu_tu.index("sao") < thu_tu.index("sao_cung")
    assert thu_tu.index("cung") < thu_tu.index("menh_nam")


def test_api_chuyen_gia():
    r = client.get("/v1/kb/chuyen-gia/duc-luan")
    assert r.status_code == 200
    d = r.json()
    assert d["slug"] == "duc-luan"
    assert d["so_trang"]["tac_gia"] == 12
    assert d["so_trang"]["chu_bien"] == len(trang.danh_sach())
    so_that = sum(1 for v in td._doc_so()["trang"].values() if v["nguoi"] == "duc-luan")
    assert d["so_trang"]["tham_dinh"] == so_that
    assert len(d["tham_dinh_gan_day"]) == min(so_that, 12)
    assert d["so_trang"]["cho_tham_dinh"] == d["so_trang"]["chu_bien"] - d["so_trang"]["tac_gia"] - so_that
    assert client.get("/v1/kb/chuyen-gia/khong-co").status_code == 404


def test_file_tham_dinh_dinh_dang_chuan():
    p = td._FILE
    raw = p.read_text("utf-8")
    assert raw.endswith("\n")
    assert json.loads(raw)["chuyen_gia"] == ["duc-luan"]
