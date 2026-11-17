# -*- coding: utf-8 -*-
"""LH-2 — lớp "Luận theo câu hỏi" của Luận giải Bát tự đời sống (`luangiai/battu_luan_hoi.py`), cùng khuôn Tử vi LH-1."""
from __future__ import annotations

import collections
import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.kb import tuvi_doi_song_kb as kb_ds
from app.kb import tuvi_luan_hoi_kb as kb_tv
from app.luangiai import battu_doi_song as bds
from app.luangiai import battu_luan_hoi as blh
from app.luangiai import chu_y_nam as cyn
from app.luangiai import tuvi_luan_hoi as lh

NGAY_XEM = dt.date(2026, 11, 17)
SINH = [{"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nu"}, {"lich": dt.datetime(1984, 2, 9, 0, 40), "gioi_tinh": "nam"},
        {"lich": dt.datetime(1975, 11, 30, 18, 5), "gioi_tinh": "nu"}, {"lich": dt.datetime(2001, 8, 3, 13, 0), "gioi_tinh": "nam"},
        {"lich": dt.datetime(1962, 1, 20, 22, 10), "gioi_tinh": "nam"}, {"lich": dt.datetime(1996, 12, 25, 4, 45), "gioi_tinh": "nu"}]
SQL_MA = re.compile(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$")
THUAT_NGU = ["Chính Quan", "Thất Sát", "Chính Tài", "Thiên Tài", "Chính Ấn", "Thiên Ấn", "Thực Thần", "Thương Quan", "Tỷ Kiên",
             "Kiếp Tài", "Tỷ Kiếp", "Quan Sát", "dụng thần", "nhật chủ", "Dịch Mã", "Đào Hoa", "đại vận", "lưu niên", "cách cục"]


@pytest.fixture(scope="module")
def cac_bc():
    return [bds.lap(s, NGAY_XEM) for s in SINH]


def _chu_hien(x: dict):
    for t in x["tra_loi"]:
        yield from (t["cau"], t["tra_loi"], t["giai_thich"])
    for n in x["nguoi"]:
        yield from (n["ten"], n["chan_dung"], n["song_chung"], *n["ban_voi_ho"], *n["ho_voi_ban"])
    hg = x["hoa_giai"]
    yield from (*hg["phat_huy"], *hg["can_sua"], *hg["canh_bao"], *(d["loi"] for d in hg["dan_gian"]), hg["ghi_chu_dan_gian"])
    for d in x["dong_mang"]:
        yield d["y"]
    if "nghe" in x:
        yield x["nghe"]["cau"]


def test_nam_chuong_co_du_phan_cung_khuon_tuvi(cac_bc):
    for bc in cac_bc:
        co = {c["ma"]: c["luan_hoi"] for c in bc["chuong"] if "luan_hoi" in c}
        assert set(co) == set(blh.CHUONG)
        for ch, x in co.items():
            assert set(x) >= {"tra_loi", "nguoi", "hoa_giai", "dong_mang"}
            ma_kb = [c["ma"] for c in kb_tv.cau(ch)]
            assert [t["ma"] for t in x["tra_loi"]] == ma_kb, ch                     # đủ và đúng thứ tự câu của khuôn
            for t in x["tra_loi"]:
                assert len(t["tra_loi"]) >= 20 and t["can_cu"] and t["sac"] in ("thuan", "can_bang", "can_chu_dong"), t
                assert SQL_MA.match(t["ma_mau"]) and t["ma_mau"].startswith(f"ds.bt.{ch}.hoi.") and len(t["ma_mau"]) <= 60
            hg = x["hoa_giai"]
            assert hg["phat_huy"] and hg["can_sua"] and hg["dan_gian"]
            assert len(x["dong_mang"]) == 10 and [n["ma"] for n in x["nguoi"]] == list(blh.NGUOI_CHUONG.get(ch, ()))
        nghe = co["su_nghiep"]["nghe"]
        assert len(nghe["hanh"]) == 5 and set(nghe["nhan"]) == {"chinh", "phu", "khong"}
        nq = bc["nguoi_quanh"]
        assert [n["ma"] for n in nq] == ["phoi_ngau", "cha_me", "con", "anh_em", "sep", "nguoi_ngoai"]
        assert all(n["tu_chuong"] in blh.CHUONG and n["chan_dung"] for n in nq)


def test_la_ban_nghe_hai_cach_khong_chon_thay():
    pt = bds.phan_tich(bds._la_so(SINH[0]))
    n = blh.la_ban_nghe(pt)
    h1, h2 = set(pt["cach_1"]["hanh"]), set(pt["cach_2"]["hanh"])
    ten = {"Mộc": "Mộc", "Hoả": "Hỏa", "Thổ": "Thổ", "Kim": "Kim", "Thuỷ": "Thủy"}
    for x in n["hanh"]:
        h = ten[x["hanh"]]
        assert x["cap"] == ("chinh" if h in h1 and h in h2 else "phu" if h in h1 or h in h2 else "")
    assert len(n["can_cu"]) == 2                                                    # nêu cả hai cách ở "Vì sao nói vậy"


def test_khong_doi_muc_va_hop_cua_bao_cao():
    co = bds.lap(SINH[0], NGAY_XEM)
    goc = blh.ap
    try:
        blh.ap = lambda *a, **k: []
        khong = bds.lap(SINH[0], NGAY_XEM)
    finally:
        blh.ap = goc
    co.pop("nguoi_quanh")
    for c in co["chuong"]:
        c.pop("luan_hoi", None)
    assert json.dumps(co, ensure_ascii=False, sort_keys=True) == json.dumps(khong, ensure_ascii=False, sort_keys=True)


def test_giong_van_va_thuat_ngu(cac_bc):
    cam = kb_ds.cum_cam()
    for bc in cac_bc:
        for c in bc["chuong"]:
            for s in _chu_hien(c["luan_hoi"]) if "luan_hoi" in c else ():
                assert not kb_ds.tim_cum_cam(s, cam), (kb_ds.tim_cum_cam(s, cam), s)
                assert not [t for t in THUAT_NGU if t in s], s
                assert "{" not in s and "  " not in s, s


def test_kb_du_o_va_sach():
    cam = kb_ds.cum_cam()
    for ma, ds in blh.NHAN.items():
        for nhan in ds:
            assert blh._o(ma, nhan).get("tl"), (ma, nhan)
            assert nhan in lh.SAC or ma in ("kiem_bang_gi",), nhan
    for tt in blh.TT_NHOM:
        assert all((blh._kb("thap_than_nguoi", tt) or {}).get(k) for k in ("kieu", "song")), tt
    for ma in ("chinh_quan", "that_sat", "chinh_tai", "thien_tai", "chinh_an", "thien_an", "thuc_than", "thuong_quan", "ty_kiep"):
        o = blh._kb("cach_nghe", ma)
        assert o["viec"] and len(o["nganh"]) == 3 and o["kieu"] in ("chu", "chuyen_mon", "to_chuc")
    for g in ("Ấn", "Tỷ Kiếp", "Quan Sát", "Thực Thương", "Tài"):
        assert all(blh._chuoi("tac_dong", g, k) for k in ("hop", "nang", "mo", "vua")), g

    def chuoi(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if not k.startswith("_"):
                    yield from chuoi(v)
        elif isinstance(x, list):
            for v in x:
                yield from chuoi(v)
    d = json.loads((Path(kb_tv.__file__).parent / "data" / "battu_luan_hoi_kb.json").read_text("utf-8"))
    assert d["source_id"] and d["school_id"] == "tu_binh"
    for s in chuoi(d):
        assert not kb_ds.tim_cum_cam(s, cam), (kb_ds.tim_cum_cam(s, cam), s)


def test_phan_bo_nhan_1000_la():
    ten = ("ben", "nguoi_thu_ba", "som_muon", "chu_hay_cong", "di_xa", "giu_tien", "cong_danh", "kiem_bang_gi", "quy_nhan",
           "lam_an_chung", "thi_phi")
    dem = {k: collections.Counter() for k in ten}
    d0 = dt.datetime(1950, 1, 3, 1, 15)
    for i in range(1000):
        pt = bds.phan_tich(bds._la_so({"lich": d0 + dt.timedelta(days=i * 20, hours=(i * 7) % 24), "gioi_tinh": "nam" if i % 2 else "nu"}))
        for k in ten:
            dem[k][getattr(blh, "nhan_" + k)(pt)] += 1
    for k, c in dem.items():
        assert set(c) <= set(blh.NHAN[k]), (k, c)
        assert max(c.values()) <= 850, (k, c)
    assert 30 <= dem["ben"]["hai_lan_do"] <= 120 and dem["ben"]["mot_moi_ben"] >= 250
    assert dem["nguoi_thu_ba"]["it_dau_hieu"] >= 700 and dem["som_muon"]["lan_dan"] <= 150


def test_dong_mang_mot_nguon_voi_nam_nen_chu_y(cac_bc):
    for s, bc in zip(SINH, cac_bc):
        ls = bds._la_so(s)
        pt = bds.phan_tich(ls)
        tgb = bds.thoi_gian_bieu(pt, NGAY_XEM)
        dm0 = next(c for c in bc["chuong"] if "luan_hoi" in c)["luan_hoi"]["dong_mang"]
        dong = bds.dong_muoi_nam(pt, tgb, dm0[0]["nam"], s["lich"].year, bds.van_tham_chieu(tgb, NGAY_XEM))
        for c in bc["chuong"]:
            if "luan_hoi" not in c:
                continue
            cham = {x["nam"] for x in c["luan_hoi"]["dong_mang"] if x["muc"] == "can_chu_dong"}
            assert cham == {x["nam"] for x in cyn.battu_nam(ls, dong, blh.MANG_CYN[c["ma"]])}, c["ma"]


def test_nhan_ben_theo_dau_hieu_tay():
    """Lá giả: chi ngày xung + sao vợ chồng vắng + Cô Thần → nhiều dấu hiệu; chi ngày hợp + sao vợ chồng đỡ → một mối bền."""
    def pt(qh, md, fit, sat=(), gt="nu", lo=()):
        g = "Quan Sát" if gt == "nu" else "Tài"
        nhom = {"Tỷ Kiếp": "Thủy", "Ấn": "Kim", "Thực Thương": "Mộc", "Tài": "Hỏa", "Quan Sát": "Thổ"}
        return {"gioi_tinh": gt, "mr": {"quan_he": [{"loai": q, "tru": [2, 1], "mo_ta": ""} for q in qh]},
                "muc_do": {**{k: "vua" for k in nhom}, g: md, "Tỷ Kiếp": "vua"}, "nhom_hanh": nhom, "than": "can_bang",
                "cach_1": {"hanh": [nhom[g]] if fit > 0 else [], "ky": []}, "cach_2": {"hanh": [nhom[g]] if fit > 0 else [], "ky": []},
                "lo": collections.Counter(lo), "than_sat": {t: {} for t in sat}}
    assert blh.nhan_ben(pt(["lục hợp"], "vua", 1)) == "mot_moi_ben"
    assert blh.nhan_ben(pt(["lục xung", "tương hình"], "vang", 0, sat=("Cô Thần",), lo=("Chính Quan", "Thất Sát"))) == "hai_lan_do"
    assert blh.nhan_som_muon(pt([], "vua", 1)) == "som_thuan"


def test_duoi_18_tuoi_va_ban_tieng_anh_khong_co_lop_nay():
    be = bds.lap({"lich": dt.datetime(2012, 6, 1, 9, 0), "gioi_tinh": "nu"}, NGAY_XEM)
    assert "nguoi_quanh" not in be and not any("luan_hoi" in c for c in be["chuong"])
    with ngon_ngu.dung("en"):
        en = bds.lap(SINH[0], NGAY_XEM)
    assert "nguoi_quanh" not in en and not any("luan_hoi" in c for c in en["chuong"])
