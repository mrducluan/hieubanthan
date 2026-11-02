# -*- coding: utf-8 -*-
"""EN-2 mục 5 — lời theo tuổi và hoàn cảnh (Tử vi + Bát tự đời sống). Test viết TRƯỚC.

Phương án chọn (docs/KE-HOACH-NANG-CAP-ENGINE.md EN-2 mục 5): MỘT hộp "với bạn lúc này" ở 5 chương hay hỏi (công việc,
tiền bạc, tình yêu, gia đình, sức khoẻ), chọn theo MỨC chương đã chấm × nhóm tuổi (18–24 · 25–44 · 45–59 · từ 60) ×
tình trạng (độc thân / có đôi / chưa nói — chỉ khi người dùng TỰ chọn, không suy đoán; chỉ chương tình yêu + gia đình
đọc tình trạng). Dưới 18 tuổi: không thêm hộp. Không đổi mức, không đổi phép tính.
"""
from __future__ import annotations

import datetime as dt
import itertools
import re

import pytest

from app.kb import tuvi_doi_song_kb as tvkb
from app.luangiai import hoan_canh as hc
from app.luangiai import toan_bo

XEM = dt.date(2026, 11, 2)
SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 12, 0), "gioi_tinh": "nu", "gio_ty": "da_ty"}
SQL_DS = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")      # kiem_chung_ma_hop_le (0017/0021)
CAM_THEM = ("ly hôn", "chia tay", "bệnh", "ung thư", "tai hoạ", "nên lấy", "không nên lấy", "phải cưới", "ế",
            "muộn chồng", "muộn vợ", "già rồi", "hết thời", "vòng tay", "đá phong thuỷ", "cúng", "giải hạn")


@pytest.mark.parametrize("tuoi, nhom", [(17, None), (18, "t18_24"), (24, "t18_24"), (25, "t25_44"), (44, "t25_44"),
                                        (45, "t45_59"), (59, "t45_59"), (60, "t60"), (95, "t60")])
def test_nhom_tuoi(tuoi, nhom):
    assert hc.nhom_tuoi(tuoi) == nhom


def test_tuoi_tron_theo_sinh_nhat():
    assert hc.tuoi_tron(dt.date(2000, 11, 3), XEM) == 25
    assert hc.tuoi_tron(dt.date(2000, 11, 2), XEM) == 26


def test_kb_du_moi_to_hop_va_khong_trung():
    noi = []
    for ch, muc, nhom in itertools.product(hc.CHUONG, hc.MUC, hc.NHOM):
        tts = hc.TINH_TRANG if ch in hc.CHUONG_THEO_TINH_TRANG else ("chua_noi",)
        for tt in tts:
            o = hc.loi(ch, muc, nhom, tt)
            assert o and o["tieu_de"] and o["noi_dung"], (ch, muc, nhom, tt)
            assert len(o["tieu_de"]) <= 90 and o["tieu_de"] not in o["noi_dung"]
            noi.append(o["tieu_de"])
            noi.append(o["noi_dung"])
    assert len(noi) == len(set(noi)), "câu lặp giữa các tổ hợp"


def test_kb_meta_nguon_phai():
    m = hc.meta()
    assert m["source_id"] and m["school_id"]


def test_kb_khong_giong_ai_khong_doa_khong_vat_pham():
    cam = [c.lower() for c in tvkb.cum_cam()] + list(CAM_THEM)
    for ch, muc, nhom, tt in hc.moi_to_hop():
        o = hc.loi(ch, muc, nhom, tt)
        chu = f"{o['tieu_de']} {o['noi_dung']}".lower()
        for c in cam:
            assert not re.search(rf"(?<![\wà-ỹ]){re.escape(c)}(?![\wà-ỹ])", chu), (ch, muc, nhom, tt, c)


def test_tinh_trang_doi_loi_tinh_cam():
    a = hc.loi("tinh_cam", "thuan", "t25_44", "doc_than")
    b = hc.loi("tinh_cam", "thuan", "t25_44", "co_doi")
    assert a["noi_dung"] != b["noi_dung"]


def test_hop_duoi_18_khong_co():
    assert hc.hop("tinh_cam", "thuan", dt.date(2010, 1, 1), XEM, "doc_than", "ds") is None


def test_hop_ma_mau_hop_le_sql():
    h = hc.hop("gia_dinh", "can_chu_dong", dt.date(1990, 1, 1), XEM, "co_doi", "ds.bt")
    assert SQL_DS.match(h["ma_mau"]) and len(h["ma_mau"]) <= 60
    assert h["ma_mau"] == "ds.bt.gia_dinh.hoan_canh.can_chu_dong.t25_44.co_doi"
    assert h["loai"] == "loi_khuyen" and h["hoan_canh"] == {"nhom_tuoi": "t25_44", "tinh_trang": "co_doi"}


def test_tinh_trang_la_khong_hop_le_coi_nhu_chua_noi():
    h = hc.hop("tinh_cam", "thuan", dt.date(1990, 1, 1), XEM, "hen_ho", "ds")
    assert h["ma_mau"].endswith(".chua_noi")


def test_chuong_khong_doc_tinh_trang():
    h = hc.hop("su_nghiep", "thuan", dt.date(1990, 1, 1), XEM, "doc_than", "ds")
    assert h["ma_mau"].endswith(".t25_44") and "doc_than" not in h["ma_mau"]


def _hop_hc(bc):
    return {c["ma"]: [h for h in c["hop"] if ".hoan_canh." in h.get("ma_mau", "")] for c in bc["chuong"]}


@pytest.mark.parametrize("mang", ["tuvi", "battu"])
def test_bao_cao_co_hop_hoan_canh_dung_chuong(mang):
    if mang == "tuvi":
        bc = toan_bo.tuvi({**SINH_TV, "tinh_trang": "co_doi"}, ngay_xem=XEM)
    else:
        bc = toan_bo.battu({**SINH_BT, "tinh_trang": "co_doi"}, ngay_xem=XEM)
    hh = _hop_hc(bc)
    for ch in hc.CHUONG:
        assert len(hh.get(ch, [])) == 1, (mang, ch)
        c = next(x for x in bc["chuong"] if x["ma"] == ch)
        h = hh[ch][0]
        assert f".{c['muc']}." in h["ma_mau"], "hộp theo đúng mức chương"
        assert len(c["hop"]) <= 6
    assert hh["tinh_cam"][0]["ma_mau"].endswith(".co_doi")
    for ch, ds in hh.items():
        if ch not in hc.CHUONG:
            assert not ds
    assert not any(".hoan_canh." in (h.get("ma_mau") or "") for h in bc["cot_loi"])


def test_khong_chon_tinh_trang_thi_chua_noi():
    bc = toan_bo.tuvi(SINH_TV, ngay_xem=XEM)
    assert _hop_hc(bc)["tinh_cam"][0]["ma_mau"].endswith(".chua_noi")


def test_dong_tinh_trang_doi_dung_hop_tinh_cam_gia_dinh():
    a = toan_bo.tuvi({**SINH_TV, "tinh_trang": "doc_than"}, ngay_xem=XEM)
    b = toan_bo.tuvi({**SINH_TV, "tinh_trang": "co_doi"}, ngay_xem=XEM)
    ha, hb = _hop_hc(a), _hop_hc(b)
    assert ha["tinh_cam"][0]["noi_dung"] != hb["tinh_cam"][0]["noi_dung"]
    assert ha["su_nghiep"][0]["noi_dung"] == hb["su_nghiep"][0]["noi_dung"]
    # mức các chương không đổi theo tình trạng
    assert [c["muc"] for c in a["chuong"]] == [c["muc"] for c in b["chuong"]]


def test_tre_vi_thanh_nien_khong_co_hop():
    bc = toan_bo.tuvi({"ngay": dt.date(2012, 3, 3), "ti": 4, "gioi_tinh": "nam", "tinh_trang": "co_doi"}, ngay_xem=XEM)
    assert not any(_hop_hc(bc).values())


def test_api_tuvi_nhan_tinh_trang_va_tu_choi_gia_tri_la():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    la = {"birth_date": "1990-05-17", "birth_time": "08:00", "gender": "nu", "noi_sinh": "ha-noi"}
    r = c.post("/v1/tuvi/luan-giai", json={"la_so": {**la, "tinh_trang": "doc_than"}, "ngay_xem": "2026-11-02"})
    assert r.status_code == 200, r.text
    ma = [h["ma_mau"] for ch in r.json()["chuong"] for h in ch["hop"] if ".hoan_canh." in h.get("ma_mau", "")]
    assert any(m.endswith(".doc_than") for m in ma)
    r2 = c.post("/v1/tuvi/luan-giai", json={"la_so": {**la, "tinh_trang": "goa"}, "ngay_xem": "2026-11-02"})
    assert r2.status_code == 422


def test_api_battu_nhan_tinh_trang():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    la = {"birth_date": "1990-05-17", "birth_time": "08:00", "gender": "nu", "noi_sinh": "ha-noi", "tinh_trang": "co_doi"}
    r = c.post("/v1/battu/luan-giai", json={"la_so": la, "ngay_xem": "2026-11-02"})
    assert r.status_code == 200, r.text
    ma = [h["ma_mau"] for ch in r.json()["chuong"] for h in ch["hop"] if ".hoan_canh." in h.get("ma_mau", "")]
    assert any(m.startswith("ds.bt.tinh_cam.hoan_canh.") and m.endswith(".co_doi") for m in ma)
