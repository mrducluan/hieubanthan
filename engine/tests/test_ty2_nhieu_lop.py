# -*- coding: utf-8 -*-
"""TY-2 đợt 3 (2026-11-25) — nhà nhiều lớp (Động trạch 2–5 lớp, Biến trạch 6–10) theo Dương Trạch Tam Yếu.
Golden = ví dụ của chính sách (`fixtures/golden/phongthuy_nhieu_lop_sach.json`), mỗi ca có câu trích là chuỗi con kho nguồn."""
import json
from pathlib import Path

import pytest

from app.calc import phongthuy_lop as pl
from app.kb import sach_ghi as sg

G = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "phongthuy_nhieu_lop_sach.json").read_text("utf-8"))
Q8 = ("Khảm", "Cấn", "Chấn", "Tốn", "Ly", "Khôn", "Đoài", "Càn")


def test_golden_trich_co_trong_kho_nguon():
    v = sg.van_nguon("duong_trach_tam_yeu")
    for c in G["ca"] + G["luat"]:
        assert sg.chuan(c["trich"]) in v, c["trich"]


@pytest.mark.parametrize("ca", G["ca"], ids=lambda c: c["ma"])
def test_vi_du_trong_sach(ca):
    day = pl.day_lop(ca["chu"], ca["cua"], ca["so_lop"], ca["cua_lech"])
    assert len(day) == ca["so_lop"]
    for so, dn in ca["lop"].items():
        assert day[int(so) - 1] == dn, (ca["ma"], so)


def test_loai_trach():
    assert pl.loai(1) == "tinh"
    assert [pl.loai(n) for n in (2, 5, 6, 10, 11, 15)] == ["dong", "dong", "bien", "bien", "hoa", "hoa"]
    for n in (0, 16):
        with pytest.raises(ValueError):
            pl.loai(n)


def test_dong_trach_moi_lop_do_lop_truoc_sinh():
    for chu in Q8:
        for cua in Q8:
            day = pl.day_lop(chu, cua, 5)
            for a, b in zip(day, day[1:]):
                assert pl._SINH[pl.HANH_DU_NIEN[a]] == pl.HANH_DU_NIEN[b]
                assert b in pl.DON.values()            # sau lớp đầu: mỗi hành một sao


@pytest.mark.parametrize("n,kep", [(6, 1), (7, 2), (8, 3)])
def test_bien_trach_so_hanh_di_doi(n, kep):
    """Sáu lớp đôi một hành, bảy đôi hai, tám đôi ba (đoạn 20)."""
    for chu in Q8:
        for cua in Q8:
            day = pl.day_lop(chu, cua, n)
            doi = sum(1 for a, b in zip(day, day[1:]) if pl.HANH_DU_NIEN[a] == pl.HANH_DU_NIEN[b])
            assert doi == kep, (chu, cua, day)


def test_bien_trach_chin_muoi_lop_di_tiep_vong():
    day10 = pl.day_lop("Khôn", "Cấn", 10)
    assert day10[:8] == pl.day_lop("Khôn", "Cấn", 8)
    assert day10[8:] == ["Phục Vị", "Sinh Khí"]       # sau Văn Khúc (Thuỷ) vào lại cặp Mộc: Phụ Bật rồi Tham Lang


def test_tinh_trach_va_hoa_trach_khong_tinh_lop():
    assert pl.day_lop("Khảm", "Ly", 1) == []
    r = pl.danh_gia("Khảm", "Ly", 12)
    assert r["loai"] == "hoa" and r["lop"] is None


@pytest.mark.parametrize("ca", G["ca"], ids=lambda c: c["ma"])
def test_tu_suy_cong_lech_khop_sach(ca):
    """Không cần người dùng khai: cổng không đối diện nhà chính = cổng lệch — đúng cả 9 ví dụ sách."""
    assert pl.cong_lech(ca["chu"], ca["cua"]) is ca["cua_lech"]
    day = pl.day_lop(ca["chu"], ca["cua"], ca["so_lop"])
    for so, dn in ca["lop"].items():
        assert day[int(so) - 1] == dn


def test_cua_lech_tinh_tu_phia_cua():
    assert pl.sao_dau("Đoài", "Cấn", False) == "Tuyệt Mệnh"      # Đoài → Chấn (hướng)
    assert pl.sao_dau("Đoài", "Cấn", True) == "Lục Sát"          # Cấn → Chấn


def test_danh_gia_lop_chu_theo_sach():
    """Đoạn 65: Chấn chủ Đoài môn, lớp 3 Sinh Khí (Mộc) ở phía Chấn (Mộc) — sao tốt đúng chỗ → thuận;
    cửa – chủ là Tuyệt Mệnh → sách gọi là nhà 'đè sát' (lúc đầu thuận, lâu dần cặp cửa – chủ chọi nhau mới hiện)."""
    r = pl.danh_gia("Chấn", "Đoài", 3, 3)
    assert r["lop_chu"]["du_nien"] == "Sinh Khí" and r["lop_chu"]["quan_he"] == "ty_hoa" and r["lop_chu"]["muc"] == "thuan"
    assert r["ap_sat"] is True
    # Đoạn 164: Chấn môn Đoài chủ, lớp 5 Cự Môn (Thổ) ở phía Đoài (Kim) — sao sinh phía
    r = pl.danh_gia("Đoài", "Chấn", 5, 5)
    assert r["lop_chu"]["quan_he"] == "sao_sinh_cung" and r["lop_chu"]["muc"] == "thuan"
    # lớp nên làm cao: sao tốt và hợp hành phía nhà chính, không tính cổng
    assert 1 not in r["lop_nen_cao"] and 5 in r["lop_nen_cao"]


def test_lop_chu_ngoai_khoang():
    with pytest.raises(ValueError):
        pl.danh_gia("Khảm", "Ly", 3, 4)


def test_loi_nhieu_lop_va_route():
    import re

    from fastapi.testclient import TestClient

    from app.luangiai import phongthuy_tam_yeu as ty
    from app.main import app
    r = ty.so_do("Đoài", "Chấn", None, None, so_lop=3, lop_chu=3)
    nl = r["nhieu_lop"]
    assert nl["loai"] == "dong" and nl["ten_loai"] == "Động trạch (3 lớp)"
    assert "Tham Lang" in nl["loi_lop_chu"] and nl["ap_sat"] and nl["quy_uoc"]
    assert [x["sao"] for x in nl["lop"]] == ["Phá Quân", "Văn Khúc", "Tham Lang"]
    # không đổi kết luận Cửa – Chủ – Bếp
    assert r["ket_luan"] == ty.so_do("Đoài", "Chấn", None, None)["ket_luan"]
    assert "nhieu_lop" not in ty.so_do("Đoài", "Chấn", None, None)
    hoa = ty.nhieu_lop("Đoài", "Khảm", 12)
    assert hoa["loai"] == "hoa" and hoa["lop"] is None and "chưa tính" in hoa["y"]
    c = TestClient(app)
    q = {"cua": "Khảm", "chu": "Đoài", "so_lop": 8, "lop_chu": 6}
    ok = c.get("/v1/phongthuy/tam-yeu/so-do", params=q)
    assert ok.status_code == 200 and len(ok.json()["nhieu_lop"]["lop"]) == 8
    assert c.get("/v1/phongthuy/tam-yeu/so-do", params={**q, "lop_chu": 9}).status_code == 422
    en = c.get("/v1/phongthuy/tam-yeu/so-do", params={**q, "ngon_ngu": "en"}).json()["nhieu_lop"]
    chu = " ".join([en["ten_loai"], en["y"], en["quy_uoc"], en["loi_lop_chu"], en["loi_nen_cao"], *en["can_cu"]])
    assert not re.search(r"[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]", chu, re.I), chu
