# -*- coding: utf-8 -*-
"""CHT-1 — rà soát độc lập cụm "12 cung hoàng đạo": (1) hằng số truyền thống khớp kho nguồn cổ điển, (2) mốc vào cung và các
thống kê trên trang khớp bộ thiên văn ngoài (golden PyEphem), (3) các biên của ô tra theo ngày sinh, (4) chất lượng bài.

Kho nguồn `fixtures/nguon/chiem_tinh_co_dien.json`: Ptolemy (Tetrabiblos, Ashmand 1822), Alan Leo (1899), Lilly (1647) — OCR
phạm vi công cộng, `can_doi_chieu`. Bảng hằng số dưới đây là chuẩn của chiêm tinh phương Tây (nguyên tố = bộ ba Ptolemy;
phẩm chất cardinal / fixed / mutable; chủ tinh cổ điển theo Ptolemy I.20; chủ tinh hiện đại: Thiên Vương 1781 cho Bảo Bình,
Hải Vương 1846 cho Song Ngư, Diêm Vương 1930 cho Bọ Cạp — quy ước hiện đại, không có trong sách cổ)."""
from __future__ import annotations

import datetime as dt
import itertools
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import cung_hoang_dao as chd
from app.kb import do_rieng, nap, trang
from app.main import app

_FIX = Path(__file__).parent.parent / "fixtures"
_C = TestClient(app)

# mã cung (thứ tự hoàng đạo) → tên tiếng Anh cổ điển
_EN = dict(zip(chd.CUNG, ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn",
                          "Aquarius", "Pisces"]))
_NGUYEN_TO = {"lua": {"Aries", "Leo", "Sagittarius"}, "dat": {"Taurus", "Virgo", "Capricorn"},
              "khi": {"Gemini", "Libra", "Aquarius"}, "nuoc": {"Cancer", "Scorpio", "Pisces"}}
_CHU_CO_DIEN = {"Aries": "hoa_tinh", "Taurus": "kim_tinh", "Gemini": "thuy_tinh", "Cancer": "mat_trang", "Leo": "mat_troi",
                "Virgo": "thuy_tinh", "Libra": "kim_tinh", "Scorpio": "hoa_tinh", "Sagittarius": "moc_tinh",
                "Capricorn": "tho_tinh", "Aquarius": "tho_tinh", "Pisces": "moc_tinh"}
_CHU_HIEN_DAI = {"Scorpio": "diem_vuong", "Aquarius": "thien_vuong", "Pisces": "hai_vuong"}
_PHAM_CHAT = {"cardinal": {"Aries", "Cancer", "Libra", "Capricorn"}, "fixed": {"Taurus", "Leo", "Scorpio", "Aquarius"},
              "mutable": {"Gemini", "Virgo", "Sagittarius", "Pisces"}}
_PC_KB = {"thong_linh": "cardinal", "kien_dinh": "fixed", "linh_hoat": "mutable"}


def _trich() -> dict[str, str]:
    d = json.loads((_FIX / "nguon" / "chiem_tinh_co_dien.json").read_text("utf-8"))
    assert d["can_doi_chieu"] is True and d["school_id"] == "chiem_tinh_tay"
    ra = {t["id"]: t["trich"] for t in d["trich"]}
    assert len(ra) == len(d["trich"]) and all(t["sach"] and t["trich"] == " ".join(t["trich"].split()) for t in d["trich"])
    return ra


def _cung_trong(txt: str) -> set[str]:
    """Tên cung có trong một câu trích (chấp nhận lỗi OCR cuối từ: Sagittariu:^)."""
    return {n for n in _EN.values() if re.search(rf"\b{n[:-1] if n == 'Sagittarius' else n}", txt)}


def test_ba_ngoi_nguyen_to_theo_ptolemy_va_ten_theo_alan_leo():
    t = _trich()
    nhom = [_cung_trong(t[k]) for k in ("pt_bo_ba_lua", "pt_bo_ba_dat", "pt_bo_ba_khi", "pt_bo_ba_nuoc")]
    assert nhom == [_NGUYEN_TO["lua"], _NGUYEN_TO["dat"], _NGUYEN_TO["khi"], _NGUYEN_TO["nuoc"]]
    # Alan Leo gọi tên nguyên tố của từng bộ ba (fiery / earthy / airy / watery)
    assert "fiery triplicity" in t["leo_su_tu"] and "earthy triplicity" in t["leo_xu_nu"]
    assert "airy triplicity" in t["leo_bao_binh"] and "watery triplicity" in t["leo_bo_cap"]
    kb = nap.doc("chiem_tinh_hanh_tinh_cung_kb.json")["cung_hoang_dao"]
    for ma, en in _EN.items():
        assert en in _NGUYEN_TO[kb[ma]["nguyen_to"]], (ma, kb[ma]["nguyen_to"])


def test_phamchat_cardinal_fixed_mutable_theo_ptolemy_lilly_leo():
    t = _trich()
    thu_tu = list(_EN.values())
    card = _cung_trong(t["pt_goc_cung_ban_dong"]) | _cung_trong(t["pt_phan_thang"])
    assert card == _PHAM_CHAT["cardinal"]
    # "fixed" = các cung đứng ngay sau bốn cung trên; "mutable" = các cung còn lại (Ptolemy I.14, Lilly)
    fixed = {thu_tu[(thu_tu.index(c) + 1) % 12] for c in card}
    assert fixed == _PHAM_CHAT["fixed"] and set(thu_tu) - card - fixed == _PHAM_CHAT["mutable"]
    assert "follow the Equinoctial" in t["lilly_co_dinh"]
    assert "third of the fixed signs" in t["leo_bo_cap"] and "last of the fixed signs" in t["leo_bao_binh"]
    kb = nap.doc("chiem_tinh_hanh_tinh_cung_kb.json")["cung_hoang_dao"]
    for ma, en in _EN.items():
        assert en in _PHAM_CHAT[_PC_KB[kb[ma]["pham_chat"]]], (ma, kb[ma]["pham_chat"])


def test_chu_tinh_co_dien_theo_ptolemy_va_hien_dai():
    t = _trich()
    assert _cung_trong(t["pt_nha_mat_troi_mat_trang"]) == {"Leo", "Cancer"}
    assert _cung_trong(t["pt_nha_tho"]) >= {"Aquarius", "Capricorn"} and "Saturn" in t["pt_nha_tho"]
    assert _cung_trong(t["pt_nha_moc"]) == {"Sagittarius", "Pisces"} and t["pt_nha_moc"].startswith("Jupiter")
    assert _cung_trong(t["pt_nha_hoa"]) == {"Aries", "Scorpio"} and t["pt_nha_hoa"].startswith("Mars")
    assert _cung_trong(t["pt_nha_kim"]) == {"Taurus", "Libra"}
    assert _cung_trong(t["pt_nha_thuy"]) == {"Gemini", "Virgo"} and t["pt_nha_thuy"].startswith("Mercury")
    assert "Neptune" in t["leo_song_ngu"] and "Pisces" in t["leo_song_ngu"]
    kb = nap.doc("chiem_tinh_hanh_tinh_cung_kb.json")["cung_hoang_dao"]
    cd = nap.doc("chiem_tinh_cung_hoang_dao_kb.json")["cung"]
    for ma, en in _EN.items():
        assert kb[ma]["chu_tinh"] == _CHU_CO_DIEN[en], (ma, kb[ma]["chu_tinh"])
        assert cd[ma].get("chu_tinh_hien_dai") == _CHU_HIEN_DAI.get(en), (ma, cd[ma].get("chu_tinh_hien_dai"))
        assert cd[ma]["ten_en"] == en


def test_cung_doi_dien_ky_hieu_va_gop_hai_hoa_theo_ptolemy():
    t = _trich()
    assert "harmonious" in t["pt_goc_hai_hoa"] and "discordant" in t["pt_goc_bat_hoa"]
    n = len(chd.CUNG)
    for i, ma in enumerate(chd.CUNG):
        dong, va = trang_chiem_tinh_hop(ma)
        # Ptolemy: lục hợp (cách 2 cung) và tam hợp (cách 4 cung) hài hoà; vuông góc (cách 3) bất hoà
        assert set(dong) == {chd.CUNG[(i + k) % n] for k in (2, -2, 4, -4)}
        assert set(va) == {chd.CUNG[(i + k) % n] for k in (3, -3)}


def trang_chiem_tinh_hop(ma):
    from app.kb import trang_chiem_tinh as tch
    return tch._hop(ma)


# ---- mốc vào cung + thống kê: đối chiếu golden thiên văn ngoài -------------------------------------------------------
_GOLD = json.loads((_FIX / "golden" / "cung_hoang_dao_doc_lap.json").read_text("utf-8"))


@pytest.mark.parametrize("nam,ma,utc", _GOLD["mau"])
def test_moc_vao_cung_khop_thien_van_ngoai_trong_2_phut(nam, ma, utc):
    ref = dt.datetime.fromisoformat(utc)
    assert abs((chd.vao_cung_utc(nam, ma) - ref).total_seconds()) <= 120, (nam, ma)


def _trang(slug):
    return trang.lay("cung_hd", slug)


@pytest.mark.parametrize("ma", chd.CUNG)
def test_thong_ke_giap_ranh_tren_trang_khop_thien_van_ngoai(ma):
    g = _GOLD["thong_ke"][ma]
    t = _trang(trang._TRANG["cung_hd"][0]()[chd.CUNG.index(ma)][1])
    txt = " ".join(" ".join(m.get("danh_sach") or []) for m in t["muc"])
    for md, n in g["dem"].items():
        thang, ngay = md.split("-")
        assert f"Sinh ngày {ngay}/{thang}: trong 60 năm 1976–2035, {n} năm" in txt, (ma, md, n)
    # "sớm nhất / muộn nhất" trong câu trả lời nhanh
    m = re.search(r"sớm nhất (\d+)/(\d+) lúc (\d\d):(\d\d) \((\d+)\) và muộn nhất (\d+)/(\d+) lúc (\d\d):(\d\d) \((\d+)\)", t["tra_loi_nhanh"])
    assert m, t["tra_loi_nhanh"]
    for (d, th, h, mi, nam), ref in ((m.group(1, 2, 3, 4, 5), g["som"]), (m.group(6, 7, 8, 9, 10), g["muon"])):
        got = dt.datetime(2001, int(th), int(d), int(h), int(mi))
        want = dt.datetime.strptime("2001-" + ref[1], "%Y-%m-%d %H:%M")
        assert abs((got - want).total_seconds()) <= 60 and int(nam) == ref[0], (ma, got, want)


# ---- ô tra theo ngày sinh: các biên ----------------------------------------------------------------------------------
def _tra(ngay, gio=None, vung="north"):
    b = {"ngay": ngay, "vung": vung, **({"gio": gio} if gio else {})}
    return _C.post("/v1/chiem-tinh/cung-hoang-dao/tra", json=b)


def test_tra_dung_phut_giap_moc_va_nua_dem():
    # xuân phân 2024 = 03:06:27 UTC = 10:06 giờ Việt Nam: trước mốc Song Ngư, sau mốc Bạch Dương, sát mốc có cờ
    assert _tra("2024-03-20", "10:05").json()["cung"]["ma"] == "song_ngu"
    assert _tra("2024-03-20", "10:07").json()["cung"]["ma"] == "bach_duong"
    assert _tra("2024-03-20", "10:07").json()["sat_moc"] is True
    assert _tra("2024-03-20", "00:00").json()["cung"]["ma"] == "song_ngu"
    assert _tra("2024-03-20", "23:59").json()["cung"]["ma"] == "bach_duong"
    assert _tra("2024-03-21", "00:00").json()["cung"]["ma"] == "bach_duong"


@pytest.mark.parametrize("ngay,ma", [("2023-12-31", "ma_ket"), ("2024-01-01", "ma_ket"), ("2024-12-31", "ma_ket"),
                                     ("2025-01-01", "ma_ket"), ("2024-02-29", "song_ngu"), ("2024-02-28", "song_ngu"),
                                     ("2024-03-01", "song_ngu"), ("1900-01-01", "ma_ket"), ("2100-12-31", "ma_ket")])
def test_tra_qua_nam_nam_nhuan_va_hai_dau_khoang(ngay, ma):
    j = _tra(ngay).json()
    assert j["giap_ranh"] is False and j["cung"]["ma"] == ma


def test_tra_ngoai_khoang_nam_422():
    assert _tra("1899-12-31").status_code == 422 and _tra("2101-01-01").status_code == 422


def test_tra_mien_nam_truoc_1975_dong_ho_utc8():
    n, s = _tra("1970-03-21").json(), _tra("1970-03-21", vung="south").json()
    assert n["utc_lech"] == 7 and s["utc_lech"] == 8 and n["giap_ranh"] and s["giap_ranh"]
    assert n["moc"]["utc"] == s["moc"]["utc"]                                    # cùng một thời điểm thiên văn
    gio = lambda j: int(j["moc"]["gio"][:2]) * 60 + int(j["moc"]["gio"][3:])     # noqa: E731
    assert gio(s) - gio(n) == 60


def test_tra_nam_trong_bang_dung_voi_gio_cua_trang():
    """Ô tra và bảng trên trang cùng một bộ tính: với mọi năm 1976–2035, giờ mốc ô tra == giờ trong bảng của trang."""
    t = _trang("bach-duong")
    bang = {r[0]: r[1] for m in t["muc"] if m.get("bang") for r in m["bang"]["dong"]}
    for nam in (1976, 1979, 2000, 2024, 2032, 2035):
        goc = chd.gio_dia_phuong(chd.vao_cung_utc(nam, "bach_duong"))
        j = _tra(f"{nam}-{goc.month:02d}-{goc.day:02d}").json()
        assert j["giap_ranh"] and bang[str(nam)] == f"{goc.day}/{goc.month} lúc {j['moc']['gio']}", nam


# ---- chất lượng bài ---------------------------------------------------------------------------------------------------
def _slugs():
    return [s for _, s in trang._TRANG["cung_hd"][0]()]


def _toks(s):
    return set(re.findall(r"\w+", s.lower()))


def _ngr(s, n=4):
    w = re.findall(r"\w+", s.lower())
    return {tuple(w[i:i + n]) for i in range(len(w) - n + 1)}


@pytest.mark.parametrize("slug", _slugs())
def test_khong_lap_y_trong_cung_mot_muc(slug):
    """Không hai ý gần như giống nhau (cùng 4 từ liền nhau, hoặc ≥ 35 % từ) trong một mục, kể cả đoạn dẫn so với từng ý."""
    t = _trang(slug)
    for m in t["muc"]:
        if m.get("bang") or (m.get("danh_sach") or [""])[0].startswith("Sinh ngày"):
            continue
        y = [m["doan"]] if m.get("doan") and m.get("danh_sach") else []
        y += list(m.get("danh_sach") or [])
        for a, b in itertools.combinations(y, 2):
            j = len(_toks(a) & _toks(b)) / max(1, len(_toks(a) | _toks(b)))
            assert not (_ngr(a) & _ngr(b)) and j < 0.35, (slug, m["tieu_de"], a, b)


def test_phan_rieng_that_khi_che_ten_cung_va_so():
    """"Phần riêng" của SEO-K gồm cả ô bảng giờ và tên cung (mỗi trang một tên) nên cao ảo. Che tên cung + số, bỏ dòng thống kê:
    chữ riêng thật của mỗi trang vẫn phải trên ngưỡng index."""
    from collections import Counter
    ten = ["Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải", "Sư Tử", "Xử Nữ", "Thiên Bình", "Bọ Cạp", "Nhân Mã", "Ma Kết",
           "Bảo Bình", "Song Ngư", "Aries"]

    def chu(t):
        p = [t["tieu_de"], t["tra_loi_nhanh"]]
        for m in t["muc"]:
            p += [m["tieu_de"], m.get("doan") or "", *[x for x in (m.get("danh_sach") or []) if not x.startswith("Sinh ngày")]]
        p += [x for h in t["hoi_dap"] for x in (h["hoi"], h["dap"])]
        s = " ".join(p)
        for n in ten:
            s = s.replace(n, "XX")
        return re.sub(r"\d+", "N", s).lower().split()

    cum = {s: do_rieng._cum(chu(_trang(s))) for s in _slugs()}
    dem = Counter(x for c in cum.values() for x in c)
    for s, c in cum.items():
        assert sum(1 for x in c if dem[x] == 1) / len(c) >= do_rieng.NGUONG, s


def test_cung_doi_dien_khong_noi_hai_dau_vong():
    for s in _slugs():
        chu = json.dumps(_trang(s), ensure_ascii=False)
        assert "hai đầu vòng" not in chu and "đối diện nhau trên vòng hoàng đạo" in chu


def test_tien_bac_khong_khuyen_dau_tu():
    cd = nap.doc("chiem_tinh_cung_hoang_dao_kb.json")["cung"]
    for ma, v in cd.items():
        assert not re.search(r"đầu tư cho|nên đầu tư|mua cổ phiếu|mua vàng|lô đề", v["tien_bac"], re.I), ma


def test_co_link_ve_o_tra_va_ghi_chu_sinh_o_nuoc_ngoai():
    t = _trang("bach-duong")
    assert any(l["duong"] == "/chiem-tinh/cung-hoang-dao" for l in t["lien_ket_ngoai"])
    gr = next(m["doan"] for m in t["muc"] if m["tieu_de"].startswith("Sinh ngày giáp ranh"))
    assert "nước ngoài" in gr and "UTC+7" in gr
