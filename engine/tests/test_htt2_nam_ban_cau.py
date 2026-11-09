# -*- coding: utf-8 -*-
"""HTT-2 H1 — cờ "Nam bán cầu" cho Bát tự (docs/DANH-GIA-HYBRID-TWO-TIER.md mục 5, chủ dự án duyệt 2026-11-09).

Chỉ tác động lớp ĐIỀU HẬU (cách 1 lấy dụng thần: nóng – lạnh theo mùa thực nơi sinh); trụ, cách cục, cách 2 không đổi;
mặc định tắt; chỉ mở cho thành phố nằm ngoài chí tuyến Nam (vĩ độ ≤ −23,44° — vùng nhiệt đới không có mùa đảo).
Không đảo trụ tháng như tài liệu Drive (không có cổ thư). Viết trước hàm."""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.calc import battu as bt
from app.main import app

client = TestClient(app)
SYDNEY = {"gender": "nam", "calendar_type": "duong", "birth_date": "1990-05-17", "birth_time": "12:30",
          "noi_sinh": "nuoc_ngoai", "mui_gio": "au-sydney"}


def test_calc_nam_ban_cau_chi_doi_dieu_hau():
    goc = bt.la_so(dt.datetime(1990, 5, 17, 12, 30), "nam")
    nbc = bt.la_so(dt.datetime(1990, 5, 17, 12, 30), "nam", nam_ban_cau=True)
    # Tháng Tỵ: Bắc bán cầu cần Thủy (mùa hạ); Nam bán cầu đang giữa mùa đông → cần Hỏa.
    assert goc["dung_than"]["dieu_hau"]["hanh"] == ["Thủy"]
    assert nbc["dung_than"]["dieu_hau"]["hanh"] == ["Hỏa"]
    assert nbc["dung_than"]["dieu_hau"]["thuyet"] == "nam_ban_cau" and "thuyết hiện đại" in nbc["dung_than"]["dieu_hau"]["giai_thich"]
    assert "thuyet" not in goc["dung_than"]["dieu_hau"]
    # Mọi thứ khác y hệt: trụ, nhật chủ, ngũ hành, thân, phù ức, cách cục, đại vận.
    for k in ("tru", "nhat_chu", "ngu_hanh", "than", "dai_van"):
        assert nbc[k] == goc[k]
    assert nbc["dung_than"]["phu_uc"] == goc["dung_than"]["phu_uc"] and nbc["dung_than"]["cach_cuc"] == goc["dung_than"]["cach_cuc"]


def test_calc_thang_on_hoa_va_thang_dong():
    # Tháng Tý (tháng 12 dương): Bắc cần Hỏa, Nam cần Thủy. Tháng Mão (xuân / thu): hai bán cầu đều ôn hoà.
    dong = dt.datetime(1990, 12, 20, 10, 0)
    assert bt.la_so(dong, "nu")["dung_than"]["dieu_hau"]["hanh"] == ["Hỏa"]
    assert bt.la_so(dong, "nu", nam_ban_cau=True)["dung_than"]["dieu_hau"]["hanh"] == ["Thủy"]
    xuan = dt.datetime(1990, 3, 20, 10, 0)
    assert bt.la_so(xuan, "nu")["dung_than"]["dieu_hau"]["hanh"] == [] == bt.la_so(xuan, "nu", nam_ban_cau=True)["dung_than"]["dieu_hau"]["hanh"]


def _la_so(**kw) -> dict:
    r = client.post("/v1/battu/la-so", json={**SYDNEY, **kw})
    assert r.status_code == 200, r.text
    return r.json()


def test_api_mac_dinh_bac_ban_cau_va_bao_kha_dung():
    a = _la_so()
    assert a["dung_than"]["dieu_hau"]["hanh"] == ["Thủy"]
    assert a["tuy_chon"] == {"dieu_hau": "bac_ban_cau", "nam_ban_cau_kha_dung": True}
    assert "dieu_hau_nam_ban_cau" not in {c["loai"] for c in a["co_canh_bao"]}
    # Thành phố nhiệt đới Nam bán cầu (Jakarta −6°) và Bắc bán cầu: không mở lựa chọn.
    for tp in ("id-jakarta", "jp-tokyo"):
        b = _la_so(mui_gio=tp)
        assert b["tuy_chon"]["nam_ban_cau_kha_dung"] is False


def test_api_dieu_hau_noi_sinh():
    a = _la_so(dieu_hau="noi_sinh")
    assert a["dung_than"]["dieu_hau"]["hanh"] == ["Hỏa"]
    co = {c["loai"]: c["chi_tiet"] for c in a["co_canh_bao"]}
    assert "dieu_hau_nam_ban_cau" in co and "Sydney" in co["dieu_hau_nam_ban_cau"] and "thuyết hiện đại" in co["dieu_hau_nam_ban_cau"]
    assert a["tuy_chon"]["dieu_hau"] == "noi_sinh"
    # Chọn "theo nơi sinh" nhưng sinh ở Bắc bán cầu / nhiệt đới → không đổi gì, không lỗi, không cờ.
    b = _la_so(dieu_hau="noi_sinh", mui_gio="jp-tokyo")
    assert b["dung_than"]["dieu_hau"]["hanh"] == ["Thủy"] and "dieu_hau_nam_ban_cau" not in {c["loai"] for c in b["co_canh_bao"]}
    # Tỉnh Việt Nam (Bắc bán cầu): chọn "theo nơi sinh" không lỗi, không đổi gì (UI không hiện công tắc, nhưng API phải chịu được).
    r = client.post("/v1/battu/la-so", json={"gender": "nam", "calendar_type": "duong", "birth_date": "1990-05-17", "birth_time": "12:30",
                                             "noi_sinh": "ha-noi", "dieu_hau": "noi_sinh"})
    assert r.status_code == 200 and r.json()["dung_than"]["dieu_hau"]["hanh"] == ["Thủy"] and r.json()["tuy_chon"]["nam_ban_cau_kha_dung"] is False
    # Không có vĩ độ (múi giờ IANA / "khác") → 422 như công tắc giờ mặt trời.
    r = client.post("/v1/battu/la-so", json={**SYDNEY, "mui_gio": "Australia/Sydney", "dieu_hau": "noi_sinh"})
    assert r.status_code == 422


def test_luan_giai_doi_song_theo_dieu_hau_noi_sinh():
    goc = client.post("/v1/battu/luan-giai", json={"la_so": SYDNEY}).json()
    nbc = client.post("/v1/battu/luan-giai", json={"la_so": {**SYDNEY, "dieu_hau": "noi_sinh"}}).json()
    c1 = lambda bc: next(c for c in bc["chuong"] if c["ma"] == "ngu_hanh")   # noqa: E731
    # Cách 1 (phù ức + điều hậu) đổi hành điều hậu → căn cứ chương Năng lượng ghi Hỏa thay Thủy; cách 2 giữ nguyên.
    assert any("Điều hậu" in x and "Thủy" in x for x in c1(goc)["can_cu"])
    assert any("Điều hậu" in x and "Hỏa" in x and "thuyết hiện đại" in x for x in c1(nbc)["can_cu"])
