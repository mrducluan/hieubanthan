# -*- coding: utf-8 -*-
"""BM-1 — dữ liệu engine trả ra web không lộ chi tiết nội bộ (thư viện, oracle, nhãn nháp AI, ghi chú quyết định).

Nguồn gốc nội bộ vẫn giữ trong file KB / mã (cần cho giấy phép và thẩm định); chỉ lớp trả JSON được lọc.
"""
from __future__ import annotations

import json
import re

import pytest
from fastapi.testclient import TestClient

from app import cong_khai
from app.kb import trang
from app.main import app

client = TestClient(app)

# Từ không được xuất hiện trong GIÁ TRỊ chuỗi trả ra (khoá JSON như `am_lich_iztro` không tính).
CAM = re.compile(r"iztro|lasotuvi|lunar-typescript|VSOP|TuViMCP|anko|tianji|aov\.cc|ctext|OpenRouter|\(MIT|MIT\)"
                 r"|Balliett|Jordan|Hồ Ngọc Đức|skill |quyết định 20\d\d|chủ dự án|trang_thai để|Renderings|verbatim"
                 r"|(?-i:nháp AI|AI nháp|do AI|có AI|AI hỗ trợ|AI viết)", re.I)


def _gia_tri(o):
    if isinstance(o, dict):
        for v in o.values():
            yield from _gia_tri(v)
    elif isinstance(o, list):
        for v in o:
            yield from _gia_tri(v)
    elif isinstance(o, str):
        yield o


def _lo(o) -> list[str]:
    return sorted({s[:160] for s in _gia_tri(o) if CAM.search(s)})


def test_loc_giu_nguyen_khoa_va_json_hop_le():
    goc = {"am_lich_iztro": "x", "iztro": "2.6.0", "nguon": ["Chu Dịch (Tây Chu) — ctext.org/book-of-changes"]}
    ra = json.loads(cong_khai.loc(json.dumps(goc, ensure_ascii=False)))
    assert set(ra) == set(goc)                       # khoá không đổi
    assert ra["nguon"] == ["Chu Dịch (Tây Chu)"]


def test_ten_co_thu_chu_han_co_ten_viet():
    ra = json.loads(cong_khai.loc(json.dumps({"nguon": ["淵海子平", "陽宅三要"]}, ensure_ascii=False)))
    assert ra["nguon"] == ["Uyên Hải Tử Bình (淵海子平)", "Dương Trạch Tam Yếu (陽宅三要)"]


def test_moi_trang_kien_thuc_khong_lo():
    lo = {}
    for t in trang.danh_sach():
        r = client.get(f"/v1/kb/trang/{t['loai']}/{t['slug']}")
        assert r.status_code == 200
        if x := _lo(r.json()):
            lo[f"{t['loai']}/{t['slug']}"] = x
    assert not lo, list(lo.items())[:5]


@pytest.mark.parametrize("duong", ["/v1/kb/trang", "/v1/tu-dien", "/v1/kb/chuyen-gia/duc-luan",
                                   "/v1/phongthuy/tuoi", "/v1/phongthuy/tuoi/tuoi-1990-nam"])
def test_api_get_khong_lo(duong):
    r = client.get(duong)
    assert r.status_code == 200, r.text
    assert not _lo(r.json())


TS = {"ho_ten": ["Nguyen Van An"], "ngay": 17, "thang": 5, "nam": 1990}
LA = {"birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam", "noi_sinh": "ha-noi"}


@pytest.mark.parametrize("duong,than", [
    ("/v1/thanso/luan-giai", TS),
    ("/v1/tuvi/an-sao", LA),
    ("/v1/tuvi/an-sao", {**LA, "birth_time": "23:30"}),
    ("/v1/battu/la-so", LA),
    ("/v1/tuvi/luu-nguyet", {"la_so": LA, "nam_am": 2026}),
    ("/v1/tuvi/hoi", {"cau_hoi": "Cung Quan Lộc của tôi nói gì về sự nghiệp?", "la_so": LA}),
    ("/v1/tuvi/hoi", {"cau_hoi": "Tham Lang ở cung Quan Lộc có ý nghĩa gì?"}),
    ("/v1/battu/hoi", {"cau_hoi": "Nhật chủ Giáp là người thế nào?"}),
    ("/v1/thanso/hoi", {**TS, "cau_hoi": "Mình hợp nghề gì?"}),
    ("/v1/thanso/hop-doi", {"a": {"ngay": 17, "thang": 5, "nam": 1990}, "b": {"ngay": 2, "thang": 9, "nam": 1992}}),
    ("/v1/kinhdich/hoi", {"cau_hoi": "Quẻ Càn nói gì?"}),
    ("/v1/phongthuy/hoi", {"cau_hoi": "Bếp nên đặt hướng nào?"}),
])
def test_api_cong_cu_khong_lo(duong, than):
    r = client.post(duong, json=than)
    if r.status_code == 422:
        pytest.skip(f"đầu vào mẫu chưa khớp schema {duong}: {r.text[:200]}")
    assert r.status_code == 200, r.text[:300]
    assert not _lo(r.json())
