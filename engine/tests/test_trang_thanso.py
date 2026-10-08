# -*- coding: utf-8 -*-
"""SEO-G — cụm trang thần số học theo nhu cầu tìm kiếm, dựng từ KB (không sinh nghĩa mới).

- cap_so: "Số chủ đạo A và B có hợp nhau không?" — 45 cặp 1–9 (KB thanso_cap_so). KHÔNG chấm điểm hợp/khắc
  (quyết định chủ dự án): trình bày điểm dễ hoà, điểm dễ va, cách cùng làm.
- nghe: "Số chủ đạo N hợp nghề gì?" — 12 số (KB linh vực sự nghiệp + tiền bạc + học tập).
- tinh_yeu: "Số chủ đạo N trong tình yêu" — 12 số (KB linh vực tình yêu + vai trong quan hệ người yêu).
- nam_ca_nhan: "Năm cá nhân số N nên làm gì" — 9 số (KB depth.nam_ca_nhan) + cách tính.
- no_nghiep: "Nợ nghiệp 13/14/16/19 là gì" — 4 trang (KB chỉ số phụ).
"""
from __future__ import annotations

import pytest

from app.kb import trang


def test_so_luong_trang_moi():
    ds = trang.danh_sach()
    dem = {l: sum(1 for t in ds if t["loai"] == l) for l in ("cap_so", "nghe", "tinh_yeu", "nam_ca_nhan", "no_nghiep")}
    assert dem == {"cap_so": 45, "nghe": 12, "tinh_yeu": 12, "nam_ca_nhan": 9, "no_nghiep": 4}


def test_cap_so():
    t = trang.lay("cap_so", "so-chu-dao-3-va-6")
    assert t is not None and t["tieu_de"].startswith("Số chủ đạo 3 và 6 có hợp nhau không")
    assert [m["tieu_de"] for m in t["muc"]][:3] == ["Dễ hoà ở đâu", "Dễ va ở đâu", "Cùng làm gì để êm"]
    assert "điểm" not in t["tra_loi_nhanh"].lower() or "không chấm điểm" in t["tra_loi_nhanh"].lower()
    assert t["minh_hoa"] == {"kieu": "cap_so", "a": 3, "b": 6}
    # thứ tự ngược cũng tìm được nhưng chỉ có MỘT trang chuẩn (a ≤ b)
    assert trang.lay("cap_so", "so-chu-dao-6-va-3") is None
    assert len(t["hoi_dap"]) >= 3


def test_nghe_va_tinh_yeu():
    n = trang.lay("nghe", "so-7-hop-nghe-gi")
    assert n["tieu_de"].startswith("Số chủ đạo 7 hợp nghề gì") and n["minh_hoa"]["kieu"] == "so"
    assert any("nghiên cứu" in (m.get("doan") or "") for m in n["muc"])
    y = trang.lay("tinh_yeu", "so-22-trong-tinh-yeu")
    assert y is not None and "22" in y["tieu_de"] and y["minh_hoa"]["so_cai"] is True


def test_nam_ca_nhan():
    t = trang.lay("nam_ca_nhan", "nam-ca-nhan-5")
    assert t["tieu_de"].startswith("Năm cá nhân số 5")
    assert any(m["tieu_de"] == "Cách tính năm cá nhân" for m in t["muc"])
    assert trang.lay("nam_ca_nhan", "nam-ca-nhan-11") is None


def test_no_nghiep():
    t = trang.lay("no_nghiep", "no-nghiep-13")
    assert "13" in t["tieu_de"] and "kỷ luật" in t["tra_loi_nhanh"]
    assert t["trang_thai"] == "nhap_ai"


@pytest.mark.parametrize("loai", ["cap_so", "nghe", "tinh_yeu", "nam_ca_nhan", "no_nghiep"])
def test_moi_trang_day_du(loai):
    for m in [x for x in trang.danh_sach() if x["loai"] == loai]:
        t = trang.lay(loai, m["slug"])
        assert t["tra_loi_nhanh"] and t["muc"] and t["hoi_dap"] and t["nguon"] and t["lien_quan"]
        assert len(t["mo_ta"]) <= 160 and t["minh_hoa"]
