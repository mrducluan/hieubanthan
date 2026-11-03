# -*- coding: utf-8 -*-
"""AUD-rà soát (2026-11-03, agent đóng vai người dùng bắt được): trang dấu hiệu nhà lộ "Nháp AI tổng hợp …" ở mục Nguồn
(BM-1 cấm nhãn AI trên bài). Quét MỌI trang kiến thức + trang cung phi: chữ trả ra không còn nhãn nháp AI nội bộ."""
from __future__ import annotations

import re

from fastapi.testclient import TestClient

from app.kb import trang
from app.luangiai import phongthuy_tuoi as pt
from app.main import app

client = TestClient(app)
_CAM = re.compile(r"(?i)nháp ai|ai nháp|chưa đối chiếu nguyên văn")


def test_moi_trang_kien_thuc_khong_lo_nhan_nhap_ai():
    lot = []
    ho = list(trang._TRANG.items()) + [("que", (trang._ds_que, None)), ("sao", (trang._ds_sao, None))]
    for loai, (ds, _) in ho:
        for _, slug in ds():
            m = _CAM.search(client.get(f"/v1/kb/trang/{loai}/{slug}").text)
            if m:
                lot.append((loai, slug, m.group()))
    for _, _, s in pt.CUNG_PHI:
        m = _CAM.search(client.get(f"/v1/phongthuy/cung-phi/{s}").text)
        if m:
            lot.append(("cung_phi", s, m.group()))
    assert lot == [], lot[:5]
