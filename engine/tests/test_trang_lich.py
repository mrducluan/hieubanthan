# -*- coding: utf-8 -*-
"""KH-BL đợt 1 (2026-10-29) — cụm nạp âm, tiết khí, 12 con giáp theo năm (kb/trang_lich.py) và bảng giờ hoàng đạo.
Mọi con số lấy từ CALC (can chi, nạp âm, tiết khí, tuổi mụ) — test khoá dữ kiện đã biết và lời không phán / không doạ."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.calc import tietkhi as tk
from app.kb import do_rieng, trang
from app.luangiai import hoang_lich as L
from app.main import app

client = TestClient(app)
CAM = ("đại hung", "tai hoạ", "giải hạn", "cúng sao", "chết", "bệnh", "vật phẩm", "xui xẻo", "đen đủi")


def _chu(t: dict) -> str:
    return str({k: t[k] for k in ("tieu_de", "tra_loi_nhanh", "muc", "hoi_dap")}).lower()


def test_nap_am_2027_la_thien_ha_thuy_va_nam_sinh_dung():
    t = trang.lay("nap_am", "thien-ha-thuy")
    assert "Bính Ngọ" in t["tra_loi_nhanh"] and "Đinh Mùi" in t["tra_loi_nhanh"]
    assert "2026, 2027" in t["tra_loi_nhanh"] and "1966, 1967" in t["tra_loi_nhanh"]
    bang = next(m["bang"] for m in t["muc"] if m.get("bang"))
    assert ["2027", "Đinh Mùi", "06/02/2027", "25/01/2028"] in bang["dong"]
    assert {"loai": "menh_nam", "slug": "sinh-nam-1966-menh-gi"} in [{k: x[k] for k in ("loai", "slug")} for x in t["lien_quan"]]
    # Năm khác không lọt vào: Hải Trung Kim là Giáp Tý / Ất Sửu
    t2 = trang.lay("nap_am", "hai-trung-kim")
    assert all(d[1] in ("Giáp Tý", "Ất Sửu") for d in next(m["bang"] for m in t2["muc"] if m.get("bang"))["dong"])


def test_tiet_khi_gio_viet_nam_va_thang_bat_tu():
    t = trang.lay("tiet_khi", "lap-xuan")
    assert "08:46 ngày 04/02/2027" in t["tra_loi_nhanh"]          # 01:46 UTC + 7 giờ
    assert any("mở đầu tháng Dần" in s for m in t["muc"] for s in m.get("danh_sach") or [])
    dong = trang.lay("tiet_khi", "dong-chi")
    assert any("không đổi ở đây" in s for m in dong["muc"] for s in m.get("danh_sach") or [])
    ds = [s for _, s in trang._TRANG["tiet_khi"][0]()]
    assert ds[0] == "lap-xuan" and ds[-1] == "dai-han" and len(set(ds)) == 24
    assert tk.thoi_diem(2027, 315).isoformat() == "2027-02-04T01:46:13"


def test_con_giap_quan_he_va_tam_tai_2027():
    mui = trang.lay("con_giap_nam", "tuoi-mui-nam-2027")
    assert "năm tuổi" in mui["tra_loi_nhanh"] and "năm thứ 3 của Tam tai" in mui["tra_loi_nhanh"]
    assert "lục xung" in trang.lay("con_giap_nam", "tuoi-suu-nam-2027")["tra_loi_nhanh"]
    assert "lục hại" in trang.lay("con_giap_nam", "tuoi-ty-nam-2027")["tra_loi_nhanh"]
    assert "tam hợp" in trang.lay("con_giap_nam", "tuoi-mao-nam-2027")["tra_loi_nhanh"]
    assert trang.lay("con_giap_nam", "tuoi-ti-nam-2027")["slug"] == "tuoi-ti-nam-2027"   # Tỵ ≠ Tý
    bang = next(m["bang"] for m in mui["muc"] if m.get("bang"))
    assert ["1967", "Đinh Mùi", "Thiên Hà Thủy", "61", "Không", "Nhất Cát"] in bang["dong"]


def test_seo_khong_doa_va_phan_rieng():
    for loai in ("nap_am", "tiet_khi", "con_giap_nam"):
        for _, slug in trang._TRANG[loai][0]():
            t = trang.lay(loai, slug)
            assert len(t["tieu_de"]) <= 70 and 50 <= len(t["mo_ta"]) <= 160, slug
            assert t["index"] and t["minh_hoa"] and all(h["hoi"].endswith("?") for h in t["hoi_dap"])
            low = _chu(t)
            for c in CAM:
                assert c not in low, (slug, c)
            assert do_rieng.ty_le()[(loai, slug)] >= do_rieng.NGUONG, slug


def test_gio_hoang_dao_bang_dung_lich_van_nien():
    b = L.gio_hoang_dao_bang()
    ty = next(n for n in b["nhom"] if n["ngay"] == ["Tý", "Ngọ"])
    assert [g["chi"] for g in ty["gio"]] == ["Tý", "Sửu", "Mão", "Ngọ", "Thân", "Dậu"]
    dan = next(n for n in b["nhom"] if n["ngay"] == ["Dần", "Thân"])
    assert [g["chi"] for g in dan["gio"]] == ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"]
    assert ty["gio"][0]["khung"] == "23:00–00:59"
    assert len(b["than"]) == 12 and sum(t["loai"] == "hoàng đạo" for t in b["than"]) == 6
    r = client.get("/v1/lich/gio-hoang-dao")
    assert r.status_code == 200 and r.json()["nhom"] == b["nhom"]


def test_route_kb_cum_moi():
    for loai, slug in (("nap_am", "dai-hai-thuy"), ("tiet_khi", "thanh-minh"), ("con_giap_nam", "tuoi-hoi-nam-2027")):
        r = client.get(f"/v1/kb/trang/{loai}/{slug}")
        assert r.status_code == 200 and r.json()["lien_quan"], slug
    assert client.get("/v1/kb/trang/tiet_khi/khong-co").status_code == 404
