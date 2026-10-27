# -*- coding: utf-8 -*-
"""LG — Luận giải toàn bộ: RULES ghép chương từ chính các đường hỏi đáp đã có (cùng KB, cùng bộ lọc
an toàn), khử đoạn trùng giữa các chương, lời kết một lần. Không lưu gì. Test viết TRƯỚC.
"""
from __future__ import annotations

import datetime as dt

import pytest

from fastapi.testclient import TestClient

from app.luangiai import toan_bo
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
LA = {"birth_date": "1997-03-19", "birth_time": "00:30", "gender": "nam", "noi_sinh": "ha-noi"}


def test_tuvi_du_chuong_va_ket_mot_lan():
    """LG-ĐS: Tử vi theo bản đời sống (13 chương — VH-1 thêm Vận hạn); Bát tự cũng vậy từ BT-ĐS (test riêng: test_battu_doi_song)."""
    bc = toan_bo.tuvi({"ngay": dt.date(1997, 3, 19), "ti": 0, "gioi_tinh": "nam"}, ngay_xem=dt.date(2026, 10, 1))
    ma = [c["ma"] for c in bc["chuong"]]
    assert ma == [m for m, _, _ in toan_bo.CHUONG_TUVI] and len(ma) == 13 and bc["phien_ban"] == "doi_song_1"
    tat_ca = [d for c in bc["chuong"] for d in c["doan"]]
    assert hoi_van.KET not in tat_ca and bc["ket"] == hoi_van.KET  # lời kết chỉ một lần
    assert all(c["doan"] for c in bc["chuong"])
    # trong một chương không đoạn nào lặp
    assert all(len(c["doan"]) == len(set(c["doan"])) for c in bc["chuong"])
    # cách cục (KB-2) vẫn đi vào chương 1 — tên gốc ở "Vì sao nói vậy"
    assert any(x.startswith("Cách cục") for x in bc["chuong"][0]["can_cu"])


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


# Cửa Sao v2: "~N phút đọc" trên thẻ chương khoá = mọi chữ người dùng sẽ đọc trong chương (đoạn, tóm tắt, hộp, căn cứ),
# không chỉ `doan` — báo cáo đời sống để phần lớn nội dung trong hộp, trước đây chương nào cũng ghi "~1 phút".
def test_phut_doc_dem_ca_hop():
    for bc in (toan_bo.tuvi({"ngay": dt.date(1997, 3, 19), "ti": 0, "gioi_tinh": "nam"}, ngay_xem=dt.date(2026, 10, 1)),
               toan_bo.battu({"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}, ngay_xem=dt.date(2026, 10, 1))):
        for c in bc["chuong"]:
            assert c["moi_xem"]["phut_doc"] == max(1, round(toan_bo.so_chu_chuong(c) / 200))
        assert sum(c["moi_xem"]["phut_doc"] for c in bc["chuong"][1:]) >= 2 * (len(bc["chuong"]) - 1), \
            [c["moi_xem"]["phut_doc"] for c in bc["chuong"]]
    assert toan_bo.so_chu_chuong({"ma": "x y z", "doan": ["một hai"], "hop": [{"tieu_de": "ba", "noi_dung": "bốn năm"}],
                                  "moi_xem": {"cau_hoi": "bỏ qua"}}) == 5


def test_diem_nhan_cat_dung_cho():
    assert toan_bo.diem_nhan(["Cung Phu Thê: định nghĩa dài.", "Trong lá số của bạn, Thiên Đồng ở cung Phu Thê (Đắc — Sao ở vị trí khá: phát huy được.): Kỳ vọng êm đềm."]) \
        == "Trong lá số của bạn, Thiên Đồng ở cung Phu Thê (Đắc — Sao ở vị trí khá: phát huy được.)"
    assert toan_bo.diem_nhan(["Tuổi mụ tại thời điểm xem: 37.", "Đại hạn: cung Điền Trạch (Canh Thìn), từ 36 đến 45 tuổi. Giai đoạn chủ đề Điền Trạch."]) \
        == "Đại hạn: cung Điền Trạch (Canh Thìn), từ 36 đến 45 tuổi."


# TV-V2 → LG-ĐS: "Đường bay" (phi hoá) đọc trước "Năm nay & 3 tháng tới" (đại hạn > lưu niên > tiểu hạn > tháng).
def test_tv_v2_hai_chuong_moi_dung_cho():
    ma = [m for m, _, _ in toan_bo.CHUONG_TUVI]
    assert ma[0] == "tong_quan"                       # SAO-2: chương 1 (miễn phí) không đổi
    assert ma.index("duong_bay") + 1 == ma.index("nam_nay") and ma[-1] == "loi_khuyen"
    assert all(("tuvi", m) in toan_bo.CAU_HOI_MO for m in ma)


@pytest.mark.parametrize("sinh", [{"ngay": dt.date(1997, 3, 19), "ti": 0, "gioi_tinh": "nam"},
                                  {"ngay": dt.date(1990, 5, 17), "ti": 4, "gioi_tinh": "nu"}])
def test_tv_v2_noi_dung_hai_chuong(sinh):
    bc = toan_bo.tuvi(sinh, ngay_xem=dt.date(2026, 10, 19))
    ch = {c["ma"]: c for c in bc["chuong"]}
    db, nn = ch["duong_bay"], ch["nam_nay"]
    assert any(x.startswith("Lai nhân cung") for x in db["can_cu"])
    assert db["hop"] and all(h["can_cu"] for h in db["hop"])
    assert any("tự hoá" in x or x.startswith("Hoá ") for x in db["can_cu"])
    thang = [h for h in nn["hop"] if ".thang" in h["ma_mau"]]
    # NHIP-2: mỗi tháng một hộp (lời riêng theo cung tháng), mã theo cung tháng → đủ 3 tháng, không trùng lời
    assert [h["tieu_de"] for h in thang] == ["Tháng 9 âm lịch", "Tháng 10 âm lịch", "Tháng 11 âm lịch"]
    assert all(h["loai"] == "thoi_diem" and h["ma_mau"].startswith("ds.nam_nay.thang.") for h in thang)
    assert len({h["noi_dung"] for h in thang}) == 3
    assert "Ưu tiên: đại hạn > lưu niên > tiểu hạn > lưu nguyệt" in nn["can_cu"]
    assert nn["hop"][0]["ma_mau"].startswith("ds.nam_nay.dai_han.")
    # điểm nhấn của chương khoá là câu tóm tắt đã tính của chính chương
    assert db["moi_xem"]["diem_nhan"] and nn["doan"][0].startswith(nn["moi_xem"]["diem_nhan"].rstrip("…"))
