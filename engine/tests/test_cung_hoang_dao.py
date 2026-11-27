# -*- coding: utf-8 -*-
"""CHT-1 — cung hoàng đạo theo ngày sinh (tầng CALC `calc/cung_hoang_dao.py`), viết TRƯỚC hàm.

Mốc vào cung = thời điểm Mặt Trời đạt kinh độ 30°·k (cùng một bộ tính với tiết khí `calc.tietkhi` và bản đồ sao).
Golden độc lập: thời điểm xuân phân / hạ chí / thu phân / đông chí năm 2024 do đài thiên văn công bố (giờ UTC, làm tròn
phút) — Mặt Trời vào Bạch Dương / Cự Giải / Thiên Bình / Ma Kết đúng các lúc ấy."""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import cung_hoang_dao as chd

# (năm, mã cung, giờ UTC công bố) — điểm phân, điểm chí 2024 và xuân phân 2025.
_GOLDEN = [
    (2024, "bach_duong", dt.datetime(2024, 3, 20, 3, 6)),
    (2024, "cu_giai", dt.datetime(2024, 6, 20, 20, 51)),
    (2024, "thien_binh", dt.datetime(2024, 9, 22, 12, 44)),
    (2024, "ma_ket", dt.datetime(2024, 12, 21, 9, 20)),
    (2025, "bach_duong", dt.datetime(2025, 3, 20, 9, 1)),
]


@pytest.mark.parametrize("nam,ma,utc", _GOLDEN)
def test_moc_vao_cung_khop_diem_phan_diem_chi(nam, ma, utc):
    t = chd.vao_cung_utc(nam, ma)
    assert abs((t - utc).total_seconds()) <= 180, (ma, t, utc)


def test_mot_nam_du_12_cung_noi_lien_khong_ho():
    for nam in (1976, 2000, 2026, 2035):
        ds = chd.khoang_nam(nam)
        assert [x["ma"] for x in ds] == list(chd.CUNG)
        for x in ds:
            ngay = (x["ket_thuc_utc"] - x["bat_dau_utc"]).total_seconds() / 86400
            assert 27.0 < ngay < 32.5, (nam, x["ma"], ngay)
            # cung kề sau bắt đầu đúng lúc cung này kết thúc
            sau = chd.khoang_cung(nam + (1 if x["ma"] == "ma_ket" else 0), chd.CUNG[(chd.CUNG.index(x["ma"]) + 1) % 12])
            assert sau["bat_dau_utc"] == x["ket_thuc_utc"]
        # Bảo Bình, Song Ngư bắt đầu tháng 1, 2; Ma Kết bắt đầu tháng 12 cùng năm
        gio = {x["ma"]: x["bat_dau_utc"].month for x in ds}
        assert gio["bao_binh"] == 1 and gio["song_ngu"] == 2 and gio["bach_duong"] == 3 and gio["ma_ket"] == 12


def test_cung_luc_dung_hai_ben_moc():
    t = chd.vao_cung_utc(2024, "bach_duong")
    assert chd.cung_luc(t - dt.timedelta(minutes=2)) == "song_ngu"
    assert chd.cung_luc(t + dt.timedelta(minutes=2)) == "bach_duong"


def test_tra_ngay_thuong_khong_giap_ranh():
    kq = chd.tra_ngay(dt.date(2024, 4, 1))
    assert kq["cung"] == "bach_duong" and kq["giap_ranh"] is False and kq["moc"] is None
    assert kq["utc_lech"] == 7.0


def test_tra_ngay_giap_ranh_theo_gio():
    kq = chd.tra_ngay(dt.date(2024, 3, 20))
    assert kq["giap_ranh"] is True and kq["cung"] is None
    assert kq["cung_truoc"] == "song_ngu" and kq["cung_sau"] == "bach_duong"
    assert kq["moc"]["gio"] in ("10:05", "10:06", "10:07")        # 03:06 UTC = 10:06 giờ Việt Nam
    assert chd.tra_ngay(dt.date(2024, 3, 20), "09:00")["cung"] == "song_ngu"
    assert chd.tra_ngay(dt.date(2024, 3, 20), "11:30")["cung"] == "bach_duong"
    sat = chd.tra_ngay(dt.date(2024, 3, 20), kq["moc"]["gio"])
    assert sat["sat_moc"] is True                                  # cách mốc vài phút → báo nên xem bản đồ sao đủ giờ


def test_tra_ngay_mien_nam_truoc_1975_dong_ho_utc8():
    bac = chd.tra_ngay(dt.date(1970, 3, 21), vung="north")
    nam = chd.tra_ngay(dt.date(1970, 3, 21), vung="south")
    assert bac["utc_lech"] == 7.0 and nam["utc_lech"] == 8.0
    # cùng một thời điểm thiên văn → đồng hồ miền Nam chỉ muộn hơn đúng 1 giờ
    if bac["moc"] and nam["moc"]:
        h = lambda s: int(s[:2]) * 60 + int(s[3:])  # noqa: E731
        assert (h(nam["moc"]["gio"]) - h(bac["moc"]["gio"])) % (24 * 60) == 60


def test_ma_ket_vat_nam():
    kq = chd.tra_ngay(dt.date(2025, 1, 5))
    assert kq["cung"] == "ma_ket"
    assert chd.tra_ngay(dt.date(2024, 12, 31))["cung"] == "ma_ket"


def test_ngay_ngoai_khoang_bao_loi():
    with pytest.raises(ValueError):
        chd.tra_ngay(dt.date(1850, 1, 1))
    with pytest.raises(ValueError):
        chd.tra_ngay(dt.date(2024, 3, 20), "25:00")


def test_thong_ke_ngay_bat_dau_theo_nhieu_nam():
    tk = chd.thong_ke_bat_dau("bach_duong", 1976, 2035)
    # xuân phân giờ Việt Nam rơi vào 20 hoặc 21/3 trong giai đoạn này
    assert set(tk) <= {(3, 19), (3, 20), (3, 21)} and sum(tk.values()) == 60
    assert tk.get((3, 20), 0) > tk.get((3, 21), 0)


# ---- cụm trang kiến thức /chiem-tinh/cung-hoang-dao (kb/trang_chiem_tinh.py) + route --------------------------------
import json  # noqa: E402
import re  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402

from app import ngon_ngu  # noqa: E402
from app.kb import do_rieng, nap, trang  # noqa: E402
from app.main import app  # noqa: E402

_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_CAM_THEM = ("bạn sẽ", "chắc chắn", "định mệnh", "số phận", "xui", "tai hoạ", "bệnh", "chẩn đoán", "khắc", "tử vong")


def _trang_cung():
    return [trang.lay("cung_hd", s) for _, s in trang._TRANG["cung_hd"][0]()]


def test_du_12_trang_dung_slug_va_tieu_de():
    ds = _trang_cung()
    assert [t["slug"] for t in ds] == ["bach-duong", "kim-nguu", "song-tu", "cu-giai", "su-tu", "xu-nu", "thien-binh", "bo-cap",
                                        "nhan-ma", "ma-ket", "bao-binh", "song-ngu"]
    for t in ds:
        assert t["tieu_de"].startswith("Cung ") and len(t["tieu_de"]) <= 70 and len(t["mo_ta"]) <= 160
        assert t["index"] is True and t["y_chinh"] and t["hoi_dap"]
        bang = next(m["bang"] for m in t["muc"] if m.get("bang"))
        assert len(bang["dong"]) == 60 and bang["dong"][0][0] == "1976" and bang["dong"][-1][0] == "2035"


def test_bang_trang_khop_bo_tinh():
    t = trang.lay("cung_hd", "bach-duong")
    dong = {r[0]: r for r in next(m["bang"] for m in t["muc"] if m.get("bang"))["dong"]}
    goc = chd.gio_dia_phuong(chd.vao_cung_utc(2024, "bach_duong"))
    assert dong["2024"][1] == f"{goc.day}/{goc.month} lúc {goc.strftime('%H:%M')}"


def test_loi_khong_phan_khong_chan_doan_va_cum_cam():
    cum = nap.doc("tuvi_doi_song_kb.json")["cum_cam"]
    for t in _trang_cung():
        chu = " ".join(do_rieng.chu_trang(t))
        for c in [*cum, *_CAM_THEM]:
            assert not re.search(rf"(?<!\w){re.escape(c)}(?!\w)", chu), (t["slug"], c)


def test_phan_rieng_moi_trang_du_cao():
    tl = do_rieng.ty_le()
    for _, s in trang._TRANG["cung_hd"][0]():
        assert tl[("cung_hd", s)] >= 0.5, (s, tl[("cung_hd", s)])


def test_ban_anh_sach_chu_viet_cung_khung():
    with ngon_ngu.dung("en"):
        ds = _trang_cung()
    for t in ds:
        s = json.dumps({k: v for k, v in t.items() if k not in ("slug",)}, ensure_ascii=False)
        s = re.sub(r'"slug": "[a-z-]+"', "", s)
        assert not _VIET.search(s), (t["slug"], _VIET.findall(s)[:5])
        assert t["slug_en"] and all(l["slug_en"] for l in t["lien_quan"])
    en_tep = nap.duong("chiem_tinh_cung_hoang_dao_kb.json", "en").read_text("utf-8")
    assert not _VIET.search(en_tep)


def test_kb_co_source_id_school_id():
    d = nap.doc("chiem_tinh_cung_hoang_dao_kb.json")
    assert d["source_id"] and d["school_id"] == "chiem_tinh_tay"
    for nhom in ("nguyen_to", "pham_chat", "cung"):
        for ma, v in d[nhom].items():
            assert v.get("source_id") and v.get("school_id"), (nhom, ma)


_C = TestClient(app)


def test_route_bang_nam_va_tra_cuu():
    r = _C.get("/v1/chiem-tinh/cung-hoang-dao/nam/2026").json()
    assert [x["ma"] for x in r["cung"]] == list(chd.CUNG) and r["tra_loi"]
    assert r["cung"][0]["slug"] == "bach-duong" and r["cung"][9]["ket_thuc"].startswith("2027-01")
    assert _C.get("/v1/chiem-tinh/cung-hoang-dao/nam").status_code == 200
    assert _C.get("/v1/chiem-tinh/cung-hoang-dao/nam/1800").status_code == 422
    k = _C.post("/v1/chiem-tinh/cung-hoang-dao/tra", json={"ngay": "2024-03-20"}).json()
    assert k["giap_ranh"] and k["cung"] is None and k["cung_sau"]["slug"] == "bach-duong" and "10:0" in k["cau"]
    k = _C.post("/v1/chiem-tinh/cung-hoang-dao/tra", json={"ngay": "1990-08-10"}).json()
    assert k["cung"]["ma"] == "su_tu" and not k["giap_ranh"]
    assert _C.post("/v1/chiem-tinh/cung-hoang-dao/tra", json={"ngay": "2024-03-20", "gio": "25:00"}).status_code == 422
    assert _C.post("/v1/chiem-tinh/cung-hoang-dao/tra", json={"ngay": "2024-03-20", "x": 1}).status_code == 422
    en = _C.post("/v1/chiem-tinh/cung-hoang-dao/tra", json={"ngay": "2024-03-20"}, headers={"x-ngon-ngu": "en"}).json()
    assert not _VIET.search(en["cau"]) and "Aries" in en["cau"]
