# -*- coding: utf-8 -*-
"""HTT-1 — thống kê lệch tỉ lệ "Đúng với mình" theo ngôn ngữ (luangiai/lech_ngon_ngu.py) + route quản trị. Viết trước hàm.
Số liệu mẫu lấy từ bảng kiểm thử của chính tài liệu Drive (Bước 6): 420/490 vi vs 118/230 ko → Z ≈ 9,8 (lệch);
380/450 vs 162/200 → Z ≈ 1,09 (không lệch)."""
from __future__ import annotations

import os

from fastapi.testclient import TestClient

from app.luangiai import lech_ngon_ngu as ln
from app.main import app

client = TestClient(app)


def test_z_hai_ti_le_khop_vi_du_drive():
    z, p = ln.z_hai_ti_le(420, 490, 118, 230)
    assert 9.6 <= z <= 10.1 and p < 1e-6
    z2, p2 = ln.z_hai_ti_le(380, 450, 162, 200)
    assert 1.0 <= z2 <= 1.2 and 0.1 <= p2 <= 0.16
    assert ln.z_hai_ti_le(0, 0, 5, 10) == (0.0, 1.0) and ln.z_hai_ti_le(10, 10, 10, 10) == (0.0, 1.0)


def _dong(mau, nn, dung, chua):
    return {"mau": mau, "ngon_ngu": nn, "dung": dung, "chua_dung": chua}


def test_quet_chi_bao_cap_du_mau_va_lech_co_y_nghia():
    dong = [_dong("ds.a.x", "vi", 420, 70), _dong("ds.a.x", "en", 118, 112),      # lệch 34 điểm, Z ≈ 9,8
            _dong("ds.b.y", "vi", 380, 70), _dong("ds.b.y", "en", 162, 38),       # lệch 3 điểm → không
            _dong("ds.c.z", "vi", 90, 10), _dong("ds.c.z", "en", 20, 30),         # bản gốc < 100 phiếu → bỏ qua
            _dong("ds.d.w", "vi", 150, 50), _dong("ds.d.w", "en", 100, 90),       # lệch 22 điểm, Z ≈ 4,8 → lệch
            _dong("ds.e.v", "en", 150, 50)]                                        # không có bản gốc → bỏ qua
    kq = ln.quet(dong)
    assert [(x["mau"], x["ngon_ngu"]) for x in kq["lech"]] == [("ds.a.x", "en"), ("ds.d.w", "en")]   # xếp theo delta giảm
    a = kq["lech"][0]
    assert a["n_goc"] == 490 and a["n"] == 230 and a["ti_le_goc"] == 0.857 and a["ti_le"] == 0.513 and a["delta"] == 0.344
    assert "không tự sửa" in a["de_xuat"] and "kb/data/en/" in a["de_xuat"]
    assert kq["so_ma_so"] == 4 and kq["so_cap_du"] == 3
    # Ngưỡng tuỳ chỉnh: hạ tối thiểu → cặp c đủ mẫu nhưng Δ = 0,5 và Z lớn → lệch.
    kq2 = ln.quet(dong, toi_thieu=50)
    assert ("ds.c.z", "en") in [(x["mau"], x["ngon_ngu"]) for x in kq2["lech"]]


def test_quet_bo_dong_hong_va_gop_trung():
    dong = [_dong("ds.a.x", "vi", 100, 0), _dong("ds.a.x", "vi", 100, 50), _dong("ds.a.x", "en", 60, 60),
            {"mau": "ds.a.x", "ngon_ngu": "en", "dung": "nhiều"}, {"mau": "x"}]
    kq = ln.quet(dong)
    assert kq["lech"][0]["n_goc"] == 250 and kq["lech"][0]["ti_le_goc"] == 0.8


def test_route_quan_tri_lech_ngon_ngu():
    body = {"dong": [_dong("ds.a.x", "vi", 420, 70), _dong("ds.a.x", "en", 118, 112)]}
    r = client.post("/v1/quan-tri/lech-ngon-ngu", json=body)
    assert r.status_code == 200, r.text
    assert r.json()["lech"][0]["mau"] == "ds.a.x" and r.json()["nguong"]["delta"] == 0.15
    # Khoá quản trị (SEC-2): đặt env → thiếu khoá bị 403.
    os.environ["ENGINE_QUAN_TRI_KEY"] = "khoa-thu"
    try:
        assert client.post("/v1/quan-tri/lech-ngon-ngu", json=body).status_code == 403
        assert client.post("/v1/quan-tri/lech-ngon-ngu", json=body, headers={"x-quan-tri-key": "khoa-thu"}).status_code == 200
    finally:
        del os.environ["ENGINE_QUAN_TRI_KEY"]
    assert client.post("/v1/quan-tri/lech-ngon-ngu", json={"dong": [{"mau": "ds.a", "ngon_ngu": "en", "dung": -1, "chua_dung": 0}]}).status_code == 422
