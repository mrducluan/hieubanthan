# -*- coding: utf-8 -*-
"""LG — Luận giải toàn bộ: RULES ghép chương từ chính các đường hỏi đáp đã có (cùng KB, cùng bộ lọc
an toàn), khử đoạn trùng giữa các chương, lời kết một lần. Không lưu gì. Test viết TRƯỚC.
"""
from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient

from app.luangiai import toan_bo
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
LA = {"birth_date": "1997-03-19", "birth_time": "00:30", "gender": "nam", "noi_sinh": "ha-noi"}


def test_tuvi_du_chuong_va_khong_trung():
    bc = toan_bo.tuvi({"ngay": dt.date(1997, 3, 19), "ti": 0, "gioi_tinh": "nam"}, ngay_xem=dt.date(2026, 10, 1))
    ma = [c["ma"] for c in bc["chuong"]]
    assert ma == [m for m, _, _ in toan_bo.CHUONG_TUVI]
    tat_ca = [d for c in bc["chuong"] for d in c["doan"]]
    assert len(tat_ca) == len(set(tat_ca))                         # không đoạn nào lặp
    assert hoi_van.KET not in tat_ca and bc["ket"] == hoi_van.KET  # lời kết chỉ một lần
    assert all(c["doan"] for c in bc["chuong"])
    assert any("Cách cục" in d for d in bc["chuong"][0]["doan"])   # KB-2 (#18) đi qua đường hỏi về Mệnh


def test_battu_du_chuong():
    bc = toan_bo.battu({"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}, ngay_xem=dt.date(2026, 10, 1))
    assert [c["ma"] for c in bc["chuong"]] == [m for m, _, _ in toan_bo.CHUONG_BATTU]
    assert all(c["doan"] for c in bc["chuong"])


def test_api():
    r = client.post("/v1/tuvi/luan-giai", json={"la_so": LA})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["mo_dun"] == "tuvi" and len(d["chuong"]) == len(toan_bo.CHUONG_TUVI)
    assert d["trang_thai"] == "nhap_ai" and d["phi"] == {"sao": 0, "ly_do": "mien_phi_thu_nghiem"}
    r2 = client.post("/v1/battu/luan-giai", json={"la_so": LA})
    assert r2.status_code == 200 and r2.json()["mo_dun"] == "battu"


def test_api_bat_buoc_la_so():
    assert client.post("/v1/tuvi/luan-giai", json={}).status_code == 422


# SAO-2 — lời mời xem tiếp mỗi chương (web chỉ hiện phần này cho chương bị khoá khi bật thu Sao).
_CAM_DOA = ("tai hoạ", "tai họa", "chết", "xui xẻo", "hạn nặng", "nguy hiểm", "đại hạn xấu", "phá sản", "ly hôn")


def _kiem_moi_xem(bc: dict):
    for c in bc["chuong"]:
        m = c["moi_xem"]
        assert m["cau_hoi"].endswith("?") and len(m["cau_hoi"]) <= 160
        assert 1 <= len(m["diem_nhan"]) <= 200
        # điểm nhấn là dữ kiện đã có trong chính chương đó (không thêm dữ kiện ngoài input)
        assert any(d.startswith(m["diem_nhan"].rstrip("…")) for d in c["doan"]), (c["ma"], m["diem_nhan"])
        assert m["so_doan"] == len(c["doan"]) and m["phut_doc"] >= 1
        assert not any(t in (m["cau_hoi"] + m["diem_nhan"]).lower() for t in _CAM_DOA)


def test_moi_xem_tuvi():
    _kiem_moi_xem(toan_bo.tuvi({"ngay": dt.date(1997, 3, 19), "ti": 0, "gioi_tinh": "nam"}, ngay_xem=dt.date(2026, 10, 1)))
    _kiem_moi_xem(toan_bo.tuvi({"ngay": dt.date(1990, 5, 17), "ti": 4, "gioi_tinh": "nu"}, ngay_xem=dt.date(2026, 10, 1)))


def test_moi_xem_battu():
    _kiem_moi_xem(toan_bo.battu({"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}, ngay_xem=dt.date(2026, 10, 1)))


def test_diem_nhan_cat_dung_cho():
    assert toan_bo.diem_nhan(["Cung Phu Thê: định nghĩa dài.", "Trong lá số của bạn, Thiên Đồng ở cung Phu Thê (Đắc — Sao ở vị trí khá: phát huy được.): Kỳ vọng êm đềm."]) \
        == "Trong lá số của bạn, Thiên Đồng ở cung Phu Thê (Đắc — Sao ở vị trí khá: phát huy được.)"
    assert toan_bo.diem_nhan(["Tuổi mụ tại thời điểm xem: 37.", "Đại hạn: cung Điền Trạch (Canh Thìn), từ 36 đến 45 tuổi. Giai đoạn chủ đề Điền Trạch."]) \
        == "Đại hạn: cung Điền Trạch (Canh Thìn), từ 36 đến 45 tuổi."
