# -*- coding: utf-8 -*-
"""VH-1 — chương "Vận hạn & điều nên tránh" (Tử vi + Bát tự đời sống) và cân lại nhãn mức
(`docs/LUAN-GIAI-DOI-SONG.md` mục 8).

Viết trước khi nối chương vào báo cáo: luật điểm năm Tử vi trên lá dựng tay (tứ hoá theo can năm, cung chính, cờ dân
gian không đổi mức), đối chiếu bảng tứ hoá + cung lưu niên với iztro (`van_han`), Bát tự chấm năm đúng bằng
`muc_hai_cach` của lưu niên đã tính, lời văn (không thuật ngữ ngoài "Vì sao nói vậy", không doạ, không vật phẩm, không tên
bệnh, lời cho trẻ không nói vay / bảo lãnh), không câu "ai đọc cũng đúng", mã kiểm chứng đi qua ràng buộc 0017, hộp
"Điều quan trọng nhất" cho năm cần lưu ý gần nhất, khoá SAO-2 không lộ số đếm, phân bố nhãn 10–60%.
"""
from __future__ import annotations

import collections
import datetime as dt
import json
import random
import re
from pathlib import Path

import pytest

from app.calc import battu_mo_rong as mr_calc
from app.calc import lunar
from app.calc import tuvi_an_sao as az
from app.calc import tuvi_phi_hoa as phi_calc
from app.calc.tuvi_luu_nguyet import TU_HOA
from app.hoidap.tuvi import tom_tat
from app.kb import battu_doi_song_kb as kb_bt
from app.kb import tuvi_doi_song_kb as kb_tv
from app.luangiai import battu_doi_song as bt
from app.luangiai import doi_song_chung as dsc
from app.luangiai import toan_bo
from app.luangiai import tuvi_doi_song as tv
from app.narrative import hoi_van

XEM = dt.date(2026, 10, 21)
SINH_TV = {"ngay": dt.date(1990, 5, 15), "ti": 4, "gioi_tinh": "nam"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}
MUC = {"thuan", "can_bang", "can_chu_dong"}
MA_0017 = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")         # supabase/migrations/0017_tuvi_hoc.sql
_CAN = r"Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý"
_CHI = r"Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi"
TN_TV = re.compile(r"Miếu|Hãm|(?<!\w)[Hh]o[áa] (?:Lộc|Quyền|Khoa|Kỵ)|tam phương|tam hợp|xung chiếu|đại hạn|lưu niên|"
                   r"tiểu hạn|Tài Bạch|Quan Lộc|Phu Thê|Điền Trạch|Thiên Di|Phúc Đức|Tử Nữ|Nô Bộc|Tật Ách|"
                   r"Phụ Mẫu|Huynh Đệ|Thái Tuế|Kỵ năm|Lộc năm")
TN_BT = re.compile(r"Tỷ Kiên|Kiếp Tài|Thực Thần|Thương Quan|Thiên Tài|Chính Tài|Thất Sát|Chính Quan|Thiên Ấn|Chính Ấn|"
                   r"[Nn]hật chủ|[Dd]ụng thần|[Đđ]ại vận|[Ll]ưu niên|[Ll]ưu nguyệt|[Tt]hập thần|[Tt]rụ năm|[Tt]rụ ngày|"
                   rf"(?<!\w)(?:{_CAN}) (?:{_CHI})(?!\w)")
DOA = ["chắc chắn", "định mệnh", "số phận", "tai hoạ", "tai họa", "xui xẻo", "xui", "khắc", "phá sản", "ly hôn", "chết",
       "tai nạn", "hạn nặng", "vận xấu", "năm xấu", "đại hạn xấu", "giải hạn", "cúng", "bùa", "vật phẩm", "phong thuỷ",
       "bạn sẽ", "điềm xấu", "đếm ngược"]
BENH = ["bệnh", "ung thư", "tiểu đường", "huyết áp", "đột quỵ", "viêm", "khối u", "sẽ bị", "trầm cảm", "suy thận"]
NGUOI_LON = ["vay", "bảo lãnh", "cưới", "hợp đồng", "đầu tư", "góp vốn", "nhà đất"]
GOLDEN_TV = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"]


def _vh(b: dict) -> dict:
    return next(c for c in b["chuong"] if c["ma"] == "van_han")


def _chu_vh(c: dict) -> list[str]:
    """Mọi chữ người dùng đọc trong chương Vận hạn (không gồm can_cu)."""
    ra = [c["tom_tat"], *c["doan"], c.get("cau_tu_soi") or ""]
    for h in c["hop"]:
        ra += [h["tieu_de"], h["noi_dung"], h.get("huong_xu_ly") or ""]
    for g in c["dong_nam"]:
        ra += [g["y"], g.get("nen_tranh") or "", g.get("nen_lam") or "", g.get("mang") or ""]
        for x in g["co"]:
            ra += [x["nhan"], x.get("y") or "", x.get("tranh") or "", x.get("lam") or ""]
    for t in c.get("thang_toi") or []:
        ra.append(t["mang"])
    return [s for s in ra if s]


def _cau(s: str) -> list[str]:
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", s or "") if len(x.strip()) > 3]


def _sach(s: str, tn: re.Pattern, cum: list[str]) -> None:
    assert not tn.search(s), (tn.search(s).group(0), s)
    assert not kb_tv.tim_cum_cam(s, cum), (kb_tv.tim_cum_cam(s, cum), s)
    assert not kb_tv.tim_cum_cam(s, DOA), (kb_tv.tim_cum_cam(s, DOA), s)
    assert not kb_tv.tim_cum_cam(s, kb_tv.cum_chung_chung()), s
    assert not any(c in s.lower() for c in hoi_van.CAM), s
    assert not any(b in s.lower() for b in BENH), s


@pytest.fixture(scope="module")
def bc_tv():
    return toan_bo.tuvi(SINH_TV, ngay_xem=XEM)


@pytest.fixture(scope="module")
def bc_bt():
    return toan_bo.battu(SINH_BT, ngay_xem=XEM)


@pytest.fixture(scope="module")
def bt300():
    rd = random.Random(2026)
    ra = []
    for _ in range(300):
        d = dt.datetime(rd.randint(1940, 2015), rd.randint(1, 12), rd.randint(1, 28), rd.randint(0, 23),
                        rd.choice([0, 30]))
        sinh = {"lich": d, "gioi_tinh": rd.choice(["nam", "nu"])}
        ra.append((sinh, toan_bo.battu(sinh, ngay_xem=XEM)))
    return ra


@pytest.fixture(scope="module")
def tv60():
    return [toan_bo.tuvi({"ngay": dt.date.fromisoformat(c["ngay"]), "ti": c["ti"], "gioi_tinh": c["gioi_tinh"]},
                         ngay_xem=XEM) for c in GOLDEN_TV]


# ------------------------------------------------------------------ hợp đồng chung
@pytest.mark.parametrize("mo_dun", ["tuvi", "battu"])
def test_chuong_van_han_hop_dong(mo_dun, bc_tv, bc_bt):
    b = bc_tv if mo_dun == "tuvi" else bc_bt
    ma = [c["ma"] for c in b["chuong"]]
    assert ma[ma.index("nam_nay") + 1] == "van_han" and ma[-1] == "loi_khuyen"
    c = _vh(b)
    assert c["tieu_de"] == "Vận hạn & điều nên tránh" and c["muc"] is None and c["nhan_muc"] is None
    assert (mo_dun, "van_han") in toan_bo.CAU_HOI_MO
    dn = c["dong_nam"]
    assert len(dn) == dsc.SO_NAM_VAN_HAN and [g["hien_tai"] for g in dn] == [True] + [False] * 9
    assert [g["nam"] for g in dn] == list(range(dn[0]["nam"], dn[0]["nam"] + 10))
    for g in dn:
        assert g["muc"] in MUC and g["nhan_muc"] and g["y"].startswith(f"Năm {g['nam']}, ") and g["can_cu"]
        assert all(x["ma"] in dsc.NHAN_CO and x["nhan"] for x in g["co"])
        if g["muc"] == "can_chu_dong":
            assert g["mang"] and g["nen_tranh"] and g["nen_lam"], g
        assert not any(k.startswith("_") for k in g)
    assert 2 <= len(c["hop"]) <= 6
    tien_to = "ds.van_han." if mo_dun == "tuvi" else "ds.bt.van_han."
    for h in c["hop"]:
        assert MA_0017.match(h["ma_mau"]) and len(h["ma_mau"]) <= 60 and h["ma_mau"].startswith(tien_to), h["ma_mau"]
        if h["loai"] == "luu_y":
            assert h["huong_xu_ly"] in h["noi_dung"] and h["huong_xu_ly"].startswith("Nên làm")
    assert len({h["ma_mau"] for h in c["hop"]}) == len(c["hop"])
    # năm "Cần lưu ý": hộp có Nên tránh + Nên làm
    for h in c["hop"]:
        if h.get("muc") == "can_chu_dong" and h["loai"] == "luu_y":
            assert "Nên tránh:" in h["noi_dung"] and "Nên làm:" in h["noi_dung"], h
    assert any("Ưu tiên:" in x for x in c["can_cu"])


def test_tu_vi_uu_tien_trong_can_cu(bc_tv):
    c = _vh(bc_tv)
    assert "Ưu tiên: đại hạn > lưu niên > tiểu hạn" in c["can_cu"]
    assert any(x.startswith("Tiểu hạn năm nay") for x in c["can_cu"])


def test_bat_tu_uu_tien_va_thang(bc_bt):
    c = _vh(bc_bt)
    assert "Ưu tiên: đại vận > lưu niên > lưu nguyệt" in c["can_cu"]
    tt = c["thang_toi"]
    assert len(tt) == 12 and all(a["den"] < b["tu"] for a, b in zip(tt, tt[1:]))
    assert tt[0]["tu"] <= XEM.isoformat() <= tt[0]["den"]
    cham = [t for t in tt if t["muc"] == "can_chu_dong"]
    h = next((h for h in c["hop"] if h["ma_mau"].startswith("ds.bt.van_han.thang.")), None)
    assert h and h["loai"] == "thoi_diem"
    if cham:
        assert "Tháng nên đi chậm" in h["noi_dung"]


# ------------------------------------------------------------------ Tử vi: luật điểm năm trên lá dựng tay
_TEN = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Nữ",
        "Phu Thê", "Huynh Đệ"]          # chỉ số i và i + 6 đối diện nhau


def _la_tay(dat: dict[str, list[str]], phu: dict[str, list[str]] | None = None) -> dict:
    cung = []
    for i, t in enumerate(_TEN):
        cung.append({"chi_so": i, "ten": t, "chi": lunar.CHI[(i + 2) % 12], "can": "", "la_than": False,
                     "chinh_tinh": [{"ten": s, "do_sang": "Bình", "tu_hoa": None} for s in dat.get(t, [])],
                     "phu_tinh": list((phu or {}).get(t, [])), "dai_han": [0, 0]})
    return {"cung": cung, "tu_hoa": []}


def test_tu_vi_luat_nam_la_dung_tay():
    # 2027 Đinh: Kỵ Cự Môn → đặt ở Tài Bạch (nhập cung chính −2) · 2028 Mậu: Lộc Tham Lang ở Quan Lộc (+2), Kỵ Thiên Cơ
    # ở Nô Bộc (ngoài cung chính) · 2029 Kỷ: Kỵ Văn Khúc ở Thiên Di → chiếu Mệnh (−1, có Kỵ chạm cung chính → cần lưu ý)
    assert TU_HOA["Đinh"][3] == "Cự Môn" and TU_HOA["Mậu"][0] == "Tham Lang" and TU_HOA["Kỷ"][3] == "Văn Khúc"
    ls = _la_tay({"Tài Bạch": ["Cự Môn"], "Quan Lộc": ["Tham Lang"], "Nô Bộc": ["Thiên Cơ"], "Huynh Đệ": ["Vũ Khúc"]},
                 {"Thiên Di": ["Văn Khúc"]})
    cc = tv.cham_cung(ls)
    dn = {g["nam"]: g for g in tv.dong_muoi_nam(ls, cc, 2027, 1980)}         # sinh 1980 (Canh Thân), tuổi mụ 48
    g = dn[2027]
    assert g["muc"] == "can_chu_dong" and g["_tac"] == ("ky_nhap", "Tài Bạch") and g["_gd"] == "lon"
    o = kb_tv.van_han_loi("ky_nhap", "Tài Bạch", "lon")
    assert g["nen_tranh"] == o["tranh"] and g["nen_lam"] == o["lam"] and g["mang"] == "tiền bạc"
    assert any("nhập cung Tài Bạch −2" in x for x in g["can_cu"])
    g = dn[2028]
    assert g["muc"] == "thuan" and g["_tot"] == "Quan Lộc" and g["nen_tranh"] is None and g["nen_lam"]
    assert [x["ma"] for x in g["co"]] == ["nam_tuoi"]                       # Mậu Thân, cùng chi năm sinh
    g = dn[2029]
    assert g["_tac"] == ("ky_chieu", "Mệnh") and g["_diem"] == -1 and g["muc"] == "can_chu_dong"
    # cờ dân gian KHÔNG đổi mức: năm tuổi 2028 vẫn Thuận lợi; tam tai của tuổi Thân = Dần, Mão, Thìn (2034–2036)
    assert dn[2034]["co"][-1]["ma"] == "tam_tai" and dn[2034]["co"][0]["ma"] == "xung_tuoi"
    # năm không có gì: Cân bằng, lời theo chủ đề cung lưu niên
    yen = [g for g in dn.values() if not g["_tac"] and not g["_tot"]]
    assert yen and all(g["muc"] == "can_bang" and "nhịp khá đều" in g["y"] for g in yen)


def test_tu_vi_tre_nho_loi_cho_cha_me():
    ls = _la_tay({"Tài Bạch": ["Cự Môn"]})
    dn = tv.dong_muoi_nam(ls, tv.cham_cung(ls), 2027, 2020)                # tuổi mụ 8
    g = dn[0]
    assert g["_gd"] == "nho" and g["muc"] == "can_chu_dong"
    assert g["nen_tranh"] == kb_tv.van_han_loi("nho", "ky", "Tài Bạch")["tranh"]
    for x in NGUOI_LON:
        assert x not in g["nen_tranh"] + g["nen_lam"], x


def test_tu_vi_doi_chieu_iztro_nam_nay(bc_tv):
    """Một bảng tứ hoá, một cách đặt cung lưu niên: năm đầu dòng 10 năm khớp `van_han` (iztro horoscope)."""
    ls = tom_tat(az.an_sao_tho(SINH_TV["ngay"], SINH_TV["ti"], SINH_TV["gioi_tinh"], "vi-VN"))
    for ngay in (XEM, dt.date(2029, 8, 1), dt.date(2033, 8, 1)):
        vh = az.van_han(SINH_TV["ngay"], SINH_TV["ti"], SINH_TV["gioi_tinh"], ngay)
        nam = lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, 7.0)[2]
        can, chi = lunar.can_chi_nam(nam)
        assert [x["sao"] for x in phi_calc.phi_tu_can(can, ls["cung"])] == vh["luu_nien"]["tu_hoa"]
        assert ls["cung"][vh["luu_nien"]["chi_so"]]["chi"] == chi
    g0 = _vh(bc_tv)["dong_nam"][0]
    vh = az.van_han(SINH_TV["ngay"], SINH_TV["ti"], SINH_TV["gioi_tinh"], XEM)
    assert g0["tuoi"] == vh["tuoi_mu"]
    assert f"Cung lưu niên năm {g0['nam']}: {ls['cung'][vh['luu_nien']['chi_so']]['ten']}" in g0["can_cu"]


# ------------------------------------------------------------------ Bát tự: năm chấm như đại vận
def test_bat_tu_nam_cham_hai_cach(bc_bt):
    pt = bt.phan_tich(bt._la_so(SINH_BT))
    ls = pt["ls"]
    c = _vh(bc_bt)
    nn = next(x for x in bc_bt["chuong"] if x["ma"] == "nam_nay")
    assert c["dong_nam"][0]["nam"] == nn["nam_xem"]
    for g in c["dong_nam"]:
        ln = mr_calc.luu_nien(ls, g["nam"])
        m1, m2, m = bt.muc_hai_cach(pt, ln["can"], ln["chi"])
        assert (g["muc_cach_1"], g["muc_cach_2"], g["muc"]) == (m1, m2, m)
        assert g["hai_cach_khac"] == (m1 != m2)
        if m1 != m2:
            assert "Hai cách đọc" in g["y"]
        xung = any(2 in q["tru"] and q["loai"] == "lục xung" for q in ln["quan_he"])
        assert xung == any(x["ma"] == "xung_ngay" for x in g["co"])
    # Canh Ngọ: 2026 Bính Ngọ năm tuổi, 2032 Nhâm Tý xung tuổi, tam tai Thân–Dậu–Tuất
    co = {g["nam"]: [x["ma"] for x in g["co"]] for g in c["dong_nam"]}
    assert "nam_tuoi" in co[2026] and "xung_tuoi" in co[2032]
    assert all("tam_tai" in co[n] for n in (2028, 2029, 2030))


def test_bat_tu_tre_nho(bc_bt):
    b = toan_bo.battu({"lich": dt.datetime(2015, 3, 2, 8, 0), "gioi_tinh": "nu"}, ngay_xem=XEM)
    for g in _vh(b)["dong_nam"]:
        if g["tuoi"] < dsc.TUOI_VH_NHO and g["nen_tranh"]:
            for x in NGUOI_LON:
                assert x not in g["nen_tranh"] + g["nen_lam"], (g["nam"], x)


# ------------------------------------------------------------------ lời văn
def test_loi_van_tu_vi(tv60):
    cum = kb_tv.cum_cam()
    for b in tv60[::3]:
        for s in _chu_vh(_vh(b)):
            _sach(s, TN_TV, cum)


def test_loi_van_bat_tu(bt300):
    cum = kb_bt.cum_cam()
    for _, b in bt300[::5]:
        for s in _chu_vh(_vh(b)):
            _sach(s, TN_BT, cum)


def test_khong_cau_barnum_bat_tu(bt300):
    """Không câu nào của chương Vận hạn (hộp, thân bài) có ở ≥ 50% số lá — ai đọc cũng đúng thì không nói gì."""
    bai = [b for _, b in bt300[:80]]
    dem = collections.Counter()
    for b in bai:
        c = _vh(b)
        dem.update({x for s in [c["tom_tat"], *c["doan"], *(h["noi_dung"] for h in c["hop"])] for x in _cau(s)})
    assert not [(n, x) for x, n in dem.items() if n >= len(bai) / 2]


@pytest.mark.parametrize("mo_dun", ["tuvi", "battu"])
def test_khong_lap_cau_trong_chuong(mo_dun, tv60, bt300):
    ds_bai = tv60[::4] if mo_dun == "tuvi" else [b for _, b in bt300[:60]]
    for b in ds_bai:
        c = _vh(b)
        cau = [x for h in c["hop"] for x in _cau(h["noi_dung"])]
        assert len(cau) == len(set(cau)), [x for x, n in collections.Counter(cau).items() if n > 1]
        assert len(c["doan"]) == len(set(c["doan"]))


def test_kb_van_han_sach():
    for kb, tn in ((kb_tv, TN_TV), (kb_bt, TN_BT)):
        d = kb._d()["van_han"]
        assert d["source_id"] and d["school_id"]

        def chuoi(x, khoa=""):
            if isinstance(x, str):
                if not khoa.startswith("_") and khoa not in ("source_id", "school_id"):
                    yield x
            elif isinstance(x, dict):
                for k, v in x.items():
                    yield from chuoi(v, k)

        ds = list(chuoi(d))
        assert len(ds) > 60
        for s in ds:
            _sach(s, tn, kb.cum_cam())
        dai = [s for s in ds if len(s) > 40]
        assert len(dai) == len(set(dai)), [s for s, n in collections.Counter(dai).items() if n > 1]


def test_kb_van_han_du_o():
    for loai in ("ky_nhap",):
        for cung in tv.CUNG_VAN_HAN:
            assert kb_tv.van_han_loi(loai, cung)["nhan"] and kb_tv.van_han_loi(loai, cung)["mang"]
            for gd in ("tre", "lon"):
                o = kb_tv.van_han_loi(loai, cung, gd)
                assert o["y"] and o["tranh"] and o["lam"], (cung, gd)
    for cung in tv.CUNG_VAN_HAN:
        assert all(kb_tv.van_han_loi("ky_chieu", cung)[k] for k in ("nhan", "mang", "y", "tranh", "lam"))
        assert all(kb_tv.van_han_loi("loc_nhap", cung)[k] for k in ("nhan", "mang", "y", "lam"))
        assert all(kb_tv.van_han_loi("nho", "ky", cung)[k] for k in ("nhan", "mang", "y", "tranh", "lam"))
        assert all(kb_tv.van_han_loi("nho", "loc", cung)[k] for k in ("nhan", "mang", "y", "lam"))
    for tt in bt.TT_NHOM:
        assert kb_bt.van_han_loi("thap_than", tt)["mang"]
        assert kb_bt.van_han_loi("thap_than", tt, "can")["nhan"]
        assert all(kb_bt.van_han_loi("thap_than", tt, "thuan")[k] for k in ("nhan", "y", "lam"))
        for gd in ("tre", "lon"):
            o = kb_bt.van_han_loi("thap_than", tt, "can", gd)
            assert o["y"] and o["tranh"] and o["lam"], (tt, gd)
    for nhom in bt.NHOM:
        assert all(kb_bt.van_han_loi("nho", "can", nhom)[k] for k in ("nhan", "mang", "y", "tranh", "lam"))
    for kb in (kb_tv, kb_bt):
        for x in ("nam_tuoi", "xung_tuoi", "tam_tai"):
            assert all(kb.van_han_loi("co", x)[k] for k in ("nhan", "y", "tranh", "lam")), x


# ------------------------------------------------------------------ Điều quan trọng nhất + SAO-2
@pytest.mark.parametrize("mo_dun", ["tuvi", "battu"])
def test_cot_loi_tro_toi_nam_can_luu_y_gan_nhat(mo_dun, tv60, bt300):
    ds_bai = tv60 if mo_dun == "tuvi" else [b for _, b in bt300[:80]]
    co = khong = 0
    for b in ds_bai:
        c = _vh(b)
        dn = c["dong_nam"]
        gan = [g for g in dn[:dsc.NAM_GAN_COT_LOI] if g["muc"] == "can_chu_dong"]
        vh_cot = [h for h in b["cot_loi"] if h["tu_chuong"] == "van_han"]
        assert 3 <= len(b["cot_loi"]) <= 5 and {"diem_manh", "luu_y"} <= {h["loai_goc"] for h in b["cot_loi"]}
        assert [h["loai_goc"] for h in b["cot_loi"]].count("luu_y") <= 3
        hop_can = [h for h in c["hop"] if h.get("muc") == "can_chu_dong" and h["loai"] == "luu_y"]
        if gan and hop_can and hop_can[0]["nam"] < dn[0]["nam"] + dsc.NAM_GAN_COT_LOI:
            co += 1
            assert len(vh_cot) == 1 and vh_cot[0]["ma_mau"] == hop_can[0]["ma_mau"]
            assert vh_cot[0]["tieu_de"].startswith(f"Năm {gan[0]['nam']}")
        else:
            khong += 1
            assert not vh_cot
    assert co > 0 and khong > 0


@pytest.mark.parametrize("mo_dun", ["tuvi", "battu"])
def test_moi_xem_khong_doa(mo_dun, tv60, bt300):
    """Chương khoá chỉ hiện tiêu đề + lời mời: điểm nhấn là năm THUẬN / năm đáng dồn sức, không đếm năm phải tránh."""
    ds_bai = tv60[::6] if mo_dun == "tuvi" else [b for _, b in bt300[:40]]
    for b in ds_bai:
        m = _vh(b)["moi_xem"]
        assert m["cau_hoi"] == toan_bo.CAU_HOI_MO[(mo_dun, "van_han")] and not re.search(r"\d", m["cau_hoi"])
        assert "đi chậm" not in m["diem_nhan"] and "lưu ý" not in m["diem_nhan"].lower(), m["diem_nhan"]
        assert re.match(r"^(Trong mười năm tới, năm thuận gần nhất là|Mười năm tới của bạn không có năm nào vượt hẳn)",
                        m["diem_nhan"]), m["diem_nhan"]


# ------------------------------------------------------------------ phân bố nhãn (bảng ở docs mục 8)
def _phan_bo(ds_bai: list[dict]) -> dict[str, collections.Counter]:
    dem: dict[str, collections.Counter] = {}
    for b in ds_bai:
        for c in b["chuong"]:
            if c["muc"]:
                dem.setdefault(c["ma"], collections.Counter())[c["muc"]] += 1
            for g in c.get("dong_nam") or []:
                dem.setdefault("~nam_" + c["ma"], collections.Counter())[g["muc"]] += 1
    return dem


def _kiem_phan_bo(dem: dict[str, collections.Counter], ngoai_le: dict[str, str]) -> None:
    for ma, c in dem.items():
        n = sum(c.values())
        for muc in MUC:
            assert c[muc] / n < 0.60, (ma, dict(c))
        if ma not in ngoai_le:
            assert c["can_chu_dong"] / n >= 0.05, (ma, dict(c))


def test_phan_bo_nhan_bat_tu(bt300):
    dem = _phan_bo([b for _, b in bt300])
    assert set(dem) >= {"tong_quan", "ngu_hanh", "hoc_tap", "gia_dinh", "su_nghiep", "~nam_van_han"}
    assert "loi_khuyen" not in dem and "van_han" not in dem
    _kiem_phan_bo(dem, {})
    n = sum(dem["~nam_van_han"].values())
    assert all(0.10 <= dem["~nam_van_han"][m] / n <= 0.60 for m in MUC), dem["~nam_van_han"]


def test_phan_bo_nhan_tu_vi(tv60):
    dem = _phan_bo(tv60)
    assert "loi_khuyen" not in dem and "van_han" not in dem
    _kiem_phan_bo(dem, {})
    n = sum(dem["~nam_van_han"].values())
    assert all(0.10 <= dem["~nam_van_han"][m] / n <= 0.60 for m in MUC), dem["~nam_van_han"]


def test_nhan_can_luu_y():
    assert kb_tv.nhan_muc("can_chu_dong") == "Cần lưu ý" == kb_bt.nhan_muc("can_chu_dong")
    assert kb_tv.MUC_MAC_DINH["can_chu_dong"] == "Cần lưu ý" == kb_bt.MUC_MAC_DINH["can_chu_dong"]
