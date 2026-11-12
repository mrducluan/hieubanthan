# -*- coding: utf-8 -*-
"""GN-2 — ô "Góc nhìn chuyên gia" để trống cho chuyên gia tự điền (kb/data/goc_nhin.json).

Quy tắc: ô trống không hiện gì; chữ chỉ hiện khi do chính chuyên gia điền + có ngày + qua luật nội dung; điền ô KHÔNG làm trang
thành "đã thẩm định"; mọi ô khớp một trang có thật; gợi ý chỉ là câu hỏi và không lộ ra đầu ra công khai."""
import json
import re

import pytest

from app.kb import tham_dinh, trang

DOC = tham_dinh._doc_goc_nhin()
NGUOI = tham_dinh._doc_so()["chuyen_gia"]


def test_nguoi_la_chuyen_gia_da_khai_bao():
    assert DOC["nguoi"] in NGUOI


@pytest.mark.parametrize("khoa", sorted(DOC["trang"]))
def test_o_hop_le(khoa):
    loai, slug = khoa.split("/", 1)
    assert trang.lay(loai, slug) is not None, f"ô {khoa} không khớp trang nào"
    o = DOC["trang"][khoa]
    assert 3 <= len(o["goi_y"]) <= 5 and all(g.strip().endswith(("?", ")")) for g in o["goi_y"]), f"{khoa}: gợi ý"
    van = " ".join((o["noi_dung"] or "").split())
    if van:   # đã có người điền → bắt buộc đạt luật + có ngày (CI chặn PR điền sai)
        assert not tham_dinh.kiem_goc_nhin(van), f"{khoa}: {tham_dinh.kiem_goc_nhin(van)}"
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", o["ngay"].strip()), f"{khoa}: thiếu ngày YYYY-MM-DD"


def test_o_trong_khong_hien_gi():
    for khoa in DOC["trang"]:
        loai, slug = khoa.split("/", 1)
        t = trang.lay(loai, slug)
        if not (DOC["trang"][khoa]["noi_dung"] or "").strip() and not (t["tham_dinh"] and (t["goc_nhin"] or {})):
            assert t["goc_nhin"] is None, khoa
        assert "goi_y" not in json.dumps(t, ensure_ascii=False)


def test_dien_o_hien_goc_nhin_nhung_khong_thanh_da_thẩm_dinh(monkeypatch):
    van = "Người có Tử Vi mà tôi gặp hay nhận phần quyết định rất sớm; việc khó là họ ngại hỏi ý người khác trước khi chốt."
    gia = json.loads(json.dumps(DOC))
    gia["trang"]["sao/sao-tu-vi"].update(noi_dung=van, ngay="2026-11-12")
    monkeypatch.setattr(tham_dinh, "_doc_goc_nhin", lambda: gia)
    t = trang.lay("sao", "sao-tu-vi")
    assert t["goc_nhin"] == {"noi_dung": van, "nguoi": "duc-luan", "ngay": "2026-11-12"}
    assert t["trang_thai"] == "nhap_ai" and t["tham_dinh"] is None          # điền góc nhìn ≠ thẩm định


@pytest.mark.parametrize("sai", ["Ngắn quá.", "Bạn sẽ phá sản vào năm sau, chắc chắn như vậy nhé, đó là điều số phận đã định sẵn rồi.",
                                 "Tôi từng thấy rất nhiều người như vậy, xem thêm tại https://example.com để biết chi tiết nhiều hơn nữa."])
def test_van_sai_khong_hien(monkeypatch, sai):
    gia = json.loads(json.dumps(DOC))
    gia["trang"]["sao/sao-tu-vi"].update(noi_dung=sai, ngay="2026-11-12")
    monkeypatch.setattr(tham_dinh, "_doc_goc_nhin", lambda: gia)
    assert trang.lay("sao", "sao-tu-vi")["goc_nhin"] is None


def test_thieu_ngay_khong_hien(monkeypatch):
    gia = json.loads(json.dumps(DOC))
    gia["trang"]["sao/sao-tu-vi"].update(noi_dung="Người có Tử Vi mà tôi gặp thường nhận phần quyết định rất sớm trong nhóm.", ngay="")
    monkeypatch.setattr(tham_dinh, "_doc_goc_nhin", lambda: gia)
    assert trang.lay("sao", "sao-tu-vi")["goc_nhin"] is None
