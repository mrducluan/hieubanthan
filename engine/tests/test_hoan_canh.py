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


GIA_DINH = ("bố mẹ", "anh chị em", "của con", "với con", "nhà riêng", "hai bên", "uống thuốc", "rượu bia", "công ty",
            "vợ chồng", "ông bà", "con cháu", "dạy con")


def test_kb_khong_gia_dinh_hoan_canh():
    """Review V4: "có đôi" không có nghĩa đã cưới / sống chung / có con; không mặc định bố mẹ còn, có anh chị em, đang dùng
    thuốc, uống rượu, làm ở công ty. Chỉ được nói khi câu có "nếu"."""
    for ch, muc, nhom, tt in hc.moi_to_hop():
        o = hc.loi(ch, muc, nhom, tt)
        for cau in re.split(r"(?<=[.;:!?])\s+|\s+[—–]\s+", f"{o['tieu_de']}. {o['noi_dung']}"):
            thap = cau.lower()
            for c in GIA_DINH:
                assert c not in thap or "nếu" in thap, (ch, muc, nhom, tt, cau)


def test_tinh_trang_doi_loi_tinh_cam():
    a = hc.loi("tinh_cam", "thuan", "t25_44", "doc_than")
    b = hc.loi("tinh_cam", "thuan", "t25_44", "co_doi")
    assert a["noi_dung"] != b["noi_dung"]


def test_hop_duoi_18_khong_co():
    assert hc.hop("tinh_cam", "thuan", dt.date(2010, 1, 1), XEM, "doc_than", "ds") is None


def test_hop_ma_mau_hop_le_sql_va_khong_mang_tinh_trang():
    """Review C1: mã kiểm chứng (ghi DB + đo lường) chỉ dựng từ dữ kiện ĐÃ TÍNH — không mang tình trạng tự khai."""
    h = hc.hop("gia_dinh", "can_chu_dong", dt.date(1990, 1, 1), XEM, None, "ds.bt")
    assert SQL_DS.match(h["ma_mau"]) and len(h["ma_mau"]) <= 60
    assert h["ma_mau"] == "ds.bt.gia_dinh.hoan_canh.can_chu_dong.t25_44" and h["loai"] == "loi_khuyen"
    for tt in ("co_doi", "doc_than"):           # một mã ↔ một lời: lời theo tình trạng không nhận phiếu, không gộp tỉ lệ
        assert "ma_mau" not in hc.hop("gia_dinh", "can_chu_dong", dt.date(1990, 1, 1), XEM, tt, "ds.bt")
    h2 = hc.hop("su_nghiep", "thuan", dt.date(1990, 1, 1), XEM, "co_doi", "ds")
    assert h2["ma_mau"] == "ds.su_nghiep.hoan_canh.thuan.t25_44"     # chương không đọc tình trạng: luôn có mã


def test_tinh_trang_la_khong_hop_le_coi_nhu_chua_noi():
    a = hc.hop("tinh_cam", "thuan", dt.date(1990, 1, 1), XEM, "hen_ho", "ds")
    b = hc.hop("tinh_cam", "thuan", dt.date(1990, 1, 1), XEM, None, "ds")
    assert a["noi_dung"] == b["noi_dung"] == hc.loi("tinh_cam", "thuan", "t25_44", "chua_noi")["noi_dung"]


def test_chuong_khong_doc_tinh_trang():
    a = hc.hop("su_nghiep", "thuan", dt.date(1990, 1, 1), XEM, "doc_than", "ds")
    b = hc.hop("su_nghiep", "thuan", dt.date(1990, 1, 1), XEM, "co_doi", "ds")
    assert a == b and a["ma_mau"] == "ds.su_nghiep.hoan_canh.thuan.t25_44"


def test_hop_suc_khoe_kem_cau_bac_si():
    h = hc.hop("suc_khoe", "can_chu_dong", dt.date(1960, 1, 1), XEM, None, "ds")
    assert "không thay lời bác sĩ" in h["noi_dung"]


def _hop_hc(bc):
    return {c["ma"]: ([c["loi_hoan_canh"]] if c.get("loi_hoan_canh") else []) for c in bc["chuong"]}


def _ma_tat_ca(bc):
    return [h.get("ma_mau") for c in bc["chuong"] for h in c["hop"]]


@pytest.mark.parametrize("mang", ["tuvi", "battu"])
def test_bao_cao_co_hop_hoan_canh_dung_chuong(mang, monkeypatch):
    lap = toan_bo.tuvi if mang == "tuvi" else toan_bo.battu
    sinh = {**(SINH_TV if mang == "tuvi" else SINH_BT), "tinh_trang": "co_doi"}
    bc = lap(sinh, ngay_xem=XEM)
    hh = _hop_hc(bc)
    for ch in hc.CHUONG:
        c = next(x for x in bc["chuong"] if x["ma"] == ch)
        assert len(hh[ch]) == 1 and len([h for h in c["hop"] if ".yb." not in (h.get("ma_mau") or "")]) <= 6, (mang, ch)
        if ch not in hc.CHUONG_THEO_TINH_TRANG:
            assert f".{c['muc']}." in hh[ch][0]["ma_mau"], "lời theo đúng mức chương"
        assert not any(".hoan_canh." in (h.get("ma_mau") or "") for h in c["hop"])
    for ch, ds in hh.items():
        if ch not in hc.CHUONG:
            assert not ds
    assert not any(".hoan_canh." in (h.get("ma_mau") or "") for h in bc["cot_loi"])
    # Review C2: không xoá / thay hộp nào đã có — mọi mã của báo cáo khi tắt lớp hoàn cảnh vẫn còn nguyên.
    monkeypatch.setattr(hc, "ap", lambda *a, **k: None)
    goc = lap(sinh, ngay_xem=XEM)
    assert _ma_tat_ca(bc) == _ma_tat_ca(goc)
    assert [c["hop"] for c in bc["chuong"]] == [c["hop"] for c in goc["chuong"]]


@pytest.mark.parametrize("mang", ["tuvi", "battu"])
def test_dau_ra_khong_mang_tinh_trang(mang):
    """Review C1: đầu ra (lưu bài, phiếu, đo lường đều lấy từ đây) không có giá trị tình trạng ở trường nào."""
    import json
    lap = toan_bo.tuvi if mang == "tuvi" else toan_bo.battu
    for tt in ("co_doi", "doc_than"):
        chu = json.dumps(lap({**(SINH_TV if mang == "tuvi" else SINH_BT), "tinh_trang": tt}, ngay_xem=XEM), ensure_ascii=False)
        assert tt not in chu and "tinh_trang" not in chu


def test_khong_chon_tinh_trang_thi_chua_noi():
    bc = toan_bo.tuvi(SINH_TV, ngay_xem=XEM)
    h = _hop_hc(bc).get("tinh_cam")
    assert h
    if h:
        assert h[0]["noi_dung"] == hc.loi("tinh_cam", next(c for c in bc["chuong"] if c["ma"] == "tinh_cam")["muc"],
                                            "t25_44", "chua_noi")["noi_dung"]


def test_dong_tinh_trang_doi_dung_hop_tinh_cam_gia_dinh():
    a = toan_bo.tuvi({**SINH_TV, "tinh_trang": "doc_than"}, ngay_xem=XEM)
    b = toan_bo.tuvi({**SINH_TV, "tinh_trang": "co_doi"}, ngay_xem=XEM)
    ha, hb = _hop_hc(a), _hop_hc(b)
    for ch in ("tinh_cam", "gia_dinh"):
        assert ha[ch] and hb[ch]
        if ha.get(ch):
            assert ha[ch][0]["noi_dung"] != hb[ch][0]["noi_dung"] and "ma_mau" not in ha[ch][0]
    for ch in ("su_nghiep", "tien_bac", "suc_khoe"):
        assert ha.get(ch) == hb.get(ch)
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
    lhc = [ch["loi_hoan_canh"] for ch in r.json()["chuong"] if ch.get("loi_hoan_canh")]
    assert len(lhc) == 5 and "doc_than" not in r.text
    assert sum(1 for x in lhc if x.get("ma_mau")) == 3          # tình yêu + gia đình theo tình trạng: không nhận phiếu
    r2 = c.post("/v1/tuvi/luan-giai", json={"la_so": {**la, "tinh_trang": "goa"}, "ngay_xem": "2026-11-02"})
    assert r2.status_code == 422


def test_api_battu_nhan_tinh_trang():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    la = {"birth_date": "1990-05-17", "birth_time": "08:00", "gender": "nu", "noi_sinh": "ha-noi", "tinh_trang": "co_doi"}
    r = c.post("/v1/battu/luan-giai", json={"la_so": la, "ngay_xem": "2026-11-02"})
    assert r.status_code == 200, r.text
    lhc = [ch["loi_hoan_canh"] for ch in r.json()["chuong"] if ch.get("loi_hoan_canh")]
    ma = [x["ma_mau"] for x in lhc if x.get("ma_mau")]
    assert len(lhc) == 5 and len(ma) == 3 and all(m.startswith("ds.bt.") for m in ma) and "co_doi" not in r.text


def test_hoc_ha_loi_hoan_canh_khi_ty_le_thap():
    goc = toan_bo.tuvi(SINH_TV, ngay_xem=XEM)
    ma = next(c for c in goc["chuong"] if c["ma"] == "su_nghiep")["loi_hoan_canh"]["ma_mau"]
    b = toan_bo.tuvi(SINH_TV, ngay_xem=XEM, trong_so={ma: {"dung": 10, "chua_dung": 110}})
    c = next(x for x in b["chuong"] if x["ma"] == "su_nghiep")
    assert "loi_hoan_canh" not in c and any("Đang xem lại" in str(x) for x in c["can_cu"])
    b2 = toan_bo.tuvi(SINH_TV, ngay_xem=XEM, trong_so={ma: {"dung": 30, "chua_dung": 10}})
    h = next(x for x in b2["chuong"] if x["ma"] == "su_nghiep")["loi_hoan_canh"]
    assert h["ty_le_dung"] == 0.75 and h["so_phieu"] == 40


def test_nguoi_xem_cham_chua_dung_thi_an_voi_ho():
    goc = toan_bo.tuvi(SINH_TV, ngay_xem=XEM)
    ma = next(c for c in goc["chuong"] if c["ma"] == "tien_bac")["loi_hoan_canh"]["ma_mau"]
    b = toan_bo.tuvi(SINH_TV, ngay_xem=XEM, ca_nhan={ma: "chua_dung"})
    assert "loi_hoan_canh" not in next(c for c in b["chuong"] if c["ma"] == "tien_bac")
