# -*- coding: utf-8 -*-
"""KT-TT4 — cách cục đặc biệt (ngoại cách) theo «Luận tạp cách» của Tử Bình Chân Thuyên.

Golden = chính các mệnh ví dụ sách nêu. Hàm CHỈ nhận diện (bảo thủ), không đổi cách cục / dụng thần / mức nào.
"""
import json
from pathlib import Path

import pytest

from app.calc import battu_ngoai_cach as nc

CAN = {"甲": "Giáp", "乙": "Ất", "丙": "Bính", "丁": "Đinh", "戊": "Mậu", "己": "Kỷ", "庚": "Canh", "辛": "Tân",
       "壬": "Nhâm", "癸": "Quý"}
CHI = {"子": "Tý", "丑": "Sửu", "寅": "Dần", "卯": "Mão", "辰": "Thìn", "巳": "Tỵ", "午": "Ngọ", "未": "Mùi",
       "申": "Thân", "酉": "Dậu", "戌": "Tuất", "亥": "Hợi"}


def _tru(s: str) -> list[dict]:
    return [{"can": CAN[x[0]], "chi": CHI[x[1]]} for x in s.split()]


# (tứ trụ trong sách, mã, hành)
SACH = [
    ("癸亥 乙卯 乙未 壬午", "chuyen_vuong", "Mộc"),   # 吴相公 — 取五行一方秀气
    ("甲戌 丁卯 壬寅 甲辰", "hoa_khi", "Mộc"),        # 丁壬化木
    ("庚申 乙酉 丙申 乙丑", "tong_tai", "Kim"),       # 王十万 — 弃命保财
    ("乙酉 乙酉 乙酉 甲申", "tong_sat", "Kim"),       # 李侍郎 — 弃命从煞
]


@pytest.mark.parametrize("tru,ma,hanh", SACH)
def test_vi_du_trong_sach(tru, ma, hanh):
    r = nc.nhan_dien(_tru(tru))
    assert r and r["ma"] == ma and r["hanh"] == hanh
    assert r["hy"] and r["ky"] and not set(r["hy"]) & set(r["ky"])


def test_hy_ky_theo_sach():
    # chuyên vượng Mộc: 运喜印绶比劫之乡…官煞则忌
    r = nc.nhan_dien(_tru("癸亥 乙卯 乙未 壬午"))
    assert r["hy"][:2] == ["Thủy", "Mộc"] and r["ky"] == ["Kim"]
    # tòng tài (Bính theo Kim): 运喜伤食财乡，不宜身旺
    r = nc.nhan_dien(_tru("庚申 乙酉 丙申 乙丑"))
    assert r["hy"] == ["Thổ", "Kim"] and set(r["ky"]) == {"Hỏa", "Mộc"}
    # tòng sát (Ất theo Kim): 运喜财官，不宜身旺，食伤则尤忌
    r = nc.nhan_dien(_tru("乙酉 乙酉 乙酉 甲申"))
    assert r["hy"] == ["Thổ", "Kim"] and "Hỏa" in r["ky"] and "Mộc" in r["ky"]
    # hoá Mộc: 运喜所化之物，与所化之印绶…不利官煞
    r = nc.nhan_dien(_tru("甲戌 丁卯 壬寅 甲辰"))
    assert r["hy"] == ["Mộc", "Thủy"] and r["ky"] == ["Kim"]


@pytest.mark.parametrize("tru", [
    "癸亥 乙卯 乙未 庚辰",   # lộ Quan (Canh) — 如有官煞…无劳外格
    "癸亥 乙酉 乙未 壬午",   # không sinh tháng Mộc
    "庚申 乙酉 丙午 乙丑",   # nhật chủ có gốc (Ngọ) — không tòng
    "庚申 乙酉 丙申 壬辰",   # tòng tài mà lộ Sát
    "乙酉 乙酉 乙酉 丁亥",   # tòng sát mà lộ Thực (Đinh) + có gốc Hợi
    "甲戌 丁卯 壬寅 庚戌",   # hoá Mộc mà lộ Kim
    "甲午 己巳 丁未 庚子",   # đủ Tỵ Ngọ Mùi nhưng chi giờ Tý là Sát — thể không thuần
    "戊辰 壬戌 壬子 乙巳",   # lá thường
])
def test_khong_nhan_bua(tru):
    assert nc.nhan_dien(_tru(tru)) is None


def test_trich_la_nguyen_van():
    van = next(t["van"] for t in json.loads(
        (Path(__file__).parent.parent / "fixtures/nguon/tu_binh_chan_thuyen.json").read_text("utf-8"))["thien"]
        if t["ten"] == "论杂格")
    assert set(nc.TRICH) == {"chuyen_vuong", "hoa_khi", "tong_tai", "tong_sat"}
    for ma, c in nc.TRICH.items():
        assert c in van, ma


def test_hiem_tren_5000_la():
    g = json.loads((Path(__file__).parent.parent / "fixtures/golden/battu_5000.json").read_text("utf-8"))
    n = dem = 0
    for c in g["ca"]:
        z = c[6]
        tru = [{"can": CAN[z[i]], "chi": CHI[z[i + 1]]} for i in (0, 2, 4, 6)]
        n += 1
        dem += nc.nhan_dien(tru) is not None
    assert n >= 1000 and dem / n < 0.02   # cách đặc biệt phải hiếm


# ---- RULES: hộp "Một cách đọc khác" trong bài đọc đời sống
import datetime as dt  # noqa: E402

from app import ngon_ngu  # noqa: E402
from app.luangiai import battu_doi_song as bds  # noqa: E402
from app.luangiai import doi_song_khuon as kh  # noqa: E402

_SINH = {"lich": dt.datetime(1962, 1, 21, 8, 36), "gioi_tinh": "nu"}      # 辛丑 辛丑 己未 戊辰 — bốn chi Thổ
_XEM = dt.date(2026, 11, 12)


def _hop_nc(bc):
    ch = next(c for c in bc["chuong"] if c["ma"] == "ngu_hanh")
    return [h for h in ch["hop"] if ".ngoai_cach." in h["ma_mau"]]


def test_bai_doc_co_hop_mot_cach_doc_khac():
    bc = bds.lap(_SINH, _XEM)
    (h,) = _hop_nc(bc)
    assert h["ma_mau"] == "ds.bt.ngu_hanh.ngoai_cach.chuyen_vuong.tho.khuyen" and h["loai"] == "loi_khuyen"
    assert "Thổ" in h["tieu_de"] and "{" not in h["tieu_de"] + h["noi_dung"]
    assert "không chọn thay bạn" in h["noi_dung"]
    for thuat_ngu in ("ngoại cách", "chuyên vượng", "tòng", "dụng thần", "Quan Sát"):
        assert thuat_ngu not in (h["tieu_de"] + h["noi_dung"]).lower() or thuat_ngu == "Quan Sát" and thuat_ngu not in h["noi_dung"]
    assert any(bds.ngoai_cach_calc.TRICH["chuyen_vuong"] in c for c in h["can_cu"])
    assert not kh.kiem_giong_van(bc)


def test_hop_khong_doi_muc_nao(monkeypatch):
    co = bds.lap(_SINH, _XEM)
    monkeypatch.setattr(bds.ngoai_cach_calc, "nhan_dien", lambda tru: None)
    khong = bds.lap(_SINH, _XEM)
    assert not _hop_nc(khong)
    assert [(c["ma"], c.get("muc")) for c in co["chuong"]] == [(c["ma"], c.get("muc")) for c in khong["chuong"]]


def test_la_thuong_khong_co_hop():
    bc = bds.lap({"lich": dt.datetime(1988, 10, 24, 10, 30), "gioi_tinh": "nam"}, _XEM)
    assert not _hop_nc(bc)


def test_ban_anh_khong_con_chu_viet():
    import re
    with ngon_ngu.dung("en"):
        (h,) = _hop_nc(bds.lap(_SINH, _XEM))
    s = " ".join([h["tieu_de"], h["noi_dung"], *h["can_cu"]])
    assert "Earth" in h["tieu_de"] and "{" not in s
    assert not re.search(r"[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]", s.lower()), s
