# -*- coding: utf-8 -*-
"""AUD-P0-bis (kiểm toán SEO/GEO 2026-11): 64 trang quẻ có khối "Cấu trúc quẻ" — dữ kiện TÍNH sẵn trong
`calc/kinhdich_vendor` (bát cung, thế/ứng, nạp giáp, lục thân, hỗ/thác/tổng quái, quẻ biến khi động từng hào) —
và câu đầu "Trả lời nhanh" tự đứng (nêu tên quẻ + Kinh Dịch) để AI trích đúng."""
from __future__ import annotations

from app.kb import trang


def _t(k: str) -> dict:
    slug = dict(trang._ds_que())[k]
    return trang._trang_que(k, slug)


def _muc(t: dict) -> dict:
    ds = [m for m in t["muc"] if m.get("ma") == "cau_truc_que"]
    assert len(ds) == 1
    return ds[0]


def test_khan_29_cau_truc_truyen_thong():
    m = _muc(_t("29"))
    for chu in ("cung Khảm", "Bát thuần", "hào thế 6", "hào ứng 3", "Hỗ quái là Di", "thác quái", "Ly", "tổng quái", "Khảm"):
        assert chu in m["doan"], chu
    dong = m["bang"]["dong"]
    assert [d[2] for d in dong] == ["Dần", "Thìn", "Ngọ", "Thân", "Tuất", "Tý"]          # nạp giáp hào 1 → 6
    assert [d[-1] for d in dong] == ["Tiết", "Tỷ", "Tỉnh", "Khốn", "Sư", "Hoán"]          # động từng hào → quẻ biến
    assert dong[5][5] == "Thế" and dong[2][5] == "Ứng"


def test_moi_que_co_khoi_va_link_que_bien():
    slugs = {s for _, s in trang._ds_que()}
    for k, _ in trang._ds_que():
        t = _t(k)
        m = _muc(t)
        assert len(m["bang"]["dong"]) == 6
        assert len(m["xem_them"]) >= 6 and all(x["loai"] == "que" and x["slug"] in slugs for x in m["xem_them"])


def test_tra_loi_nhanh_tu_dung():
    for k, _ in trang._ds_que():
        t = _t(k)
        ten = trang._doc("kinhdich_kb.json")["que"][k]["ten"]
        assert t["tra_loi_nhanh"].startswith("Quẻ ") and ten in t["tra_loi_nhanh"][:40] and "Kinh Dịch" in t["tra_loi_nhanh"][:90], k


def test_ten_day_du_va_chu_giai():
    # tên thường gọi: quẻ trên + quẻ dưới + tên; quẻ thuần → "Thuần …" (người tìm "quẻ Thuần Khảm", "Thủy Lôi Truân")
    assert trang.ten_que_day_du("29") == "Thuần Khảm" and trang.ten_que_day_du("1") == "Thuần Càn"
    assert trang.ten_que_day_du("3") == "Thủy Lôi Truân" and trang.ten_que_day_du("63") == "Thủy Hỏa Ký Tế"
    t = _t("29")
    assert "Thuần Khảm" in t["tieu_de"] and t["tra_loi_nhanh"].startswith("Quẻ Thuần Khảm")
    assert any(x.startswith("Thế:") for x in _muc(t)["danh_sach"])
