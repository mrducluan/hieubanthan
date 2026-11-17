# -*- coding: utf-8 -*-
"""TK-2 việc 3 — lời sách theo NGÀY sinh × GIỜ sinh (Tam Mệnh Thông Hội quyển 8–9, «六X日Y時斷»).

Mỗi can ngày × chi giờ là một mục «六甲日甲子時斷»… ; mở đầu mỗi mục là bài ca chung bốn câu bảy chữ (28 chữ), sau đó
mới tới lời giải «甲日甲子時…» và sáu đoạn riêng từng trụ ngày. KB `battu_ngay_gio.json` chỉ lấy bài ca chung.
"""
from __future__ import annotations

import datetime as dt
import importlib.util
import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.calc import battu
from app.kb import sach_ghi as sg
from app.luangiai import sach_ghi_mon as sgm

GOC = Path(__file__).resolve().parents[1]
KB = json.loads((GOC / "app" / "kb" / "data" / "battu_ngay_gio.json").read_text("utf-8"))
MUC = KB["muc"]
CAN_HAN, CHI_HAN = "甲乙丙丁戊己庚辛壬癸", "子丑寅卯辰巳午未申酉戌亥"


def _nap():
    s = importlib.util.spec_from_file_location("nap_tm", GOC / "scripts" / "nap_tam_menh_ngay_gio.py")
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    return m


NAP = _nap()
CAT = NAP.cat()


def test_du_120_khoa():
    mong = {f"{c}|{h}" for c in battu.CAN for h in battu.CHI}
    assert set(MUC) == mong and len(MUC) == 120


def test_kb_khop_bo_cat():
    """Bộ cắt chạy lại không đổi gì trong KB (han / trụ giờ / quyển)."""
    assert NAP.main.__module__  # tệp nạp được
    for k, m in MUC.items():
        assert m["tru_gio"] == CAT[k]["tru_gio"] and m["quyen"] == CAT[k]["quyen"], k
        assert m["han"] in CAT[k]["han"], k


@pytest.mark.parametrize("khoa", sorted(MUC))
def test_han_la_chuoi_con_kho_nguon_dung_muc(khoa):
    m = MUC[khoa]
    assert sg.chuan(m["han"]) == m["han"]
    assert m["han"] in sg.van_nguon("tam_menh_thong_hoi_du_bo")
    c = CAT[khoa]
    # Mục đúng can ngày + chi giờ; bài ca chung là 28 chữ đầu, ngay sau là lời giải «X日…» của đúng can ngày.
    i_can, i_chi = battu.CAN.index(khoa.split("|")[0]), battu.CHI.index(khoa.split("|")[1])
    chi_dau = {"夘": "卯"}.get(c["dau_muc"][-3], c["dau_muc"][-3])
    assert chi_dau == CHI_HAN[i_chi], c["dau_muc"]
    can_dau = c["dau_muc"][1]
    assert can_dau == CAN_HAN[i_can] or (i_can == 5 and can_dau in "已巳"), c["dau_muc"]
    chu = "".join(NAP._HAN.findall(NAP._CHU_NHO.sub("", c["doan"])))
    assert chu.startswith(c["han"]) and len(c["han"]) == 28
    assert re.match(rf"六?[{CAN_HAN[i_can]}{'已巳' if i_can == 5 else ''}]日", chu[28:]), (khoa, chu[28:40])
    # Bài ca nêu trụ giờ của chính mục (sách có vài chỗ chép lẫn can giờ — cho phép, chỉ đòi đúng chi giờ).
    assert re.search(rf"[{CHI_HAN[i_chi]}{'夘' if i_chi == 3 else ''}]", c["han"][:14]), khoa


@pytest.mark.parametrize("khoa,tru", [("Giáp|Tý", "甲子"), ("Ất|Tý", "丙子"), ("Bính|Tý", "戊子"), ("Mậu|Hợi", "癸亥"),
                                      ("Kỷ|Ngọ", "庚午"), ("Canh|Dần", "戊寅"), ("Quý|Hợi", "癸亥"), ("Nhâm|Ngọ", "丙午")])
def test_tru_gio_ngu_thu_don(khoa, tru):
    """Trụ giờ theo Ngũ Thử Độn (Giáp Kỷ khởi Giáp Tý, Ất Canh Bính Tý, Bính Tân Mậu Tý, Đinh Nhâm Canh Tý, Mậu Quý Nhâm Tý) —
    tính tay. Canh|Dần: bài ca chép «庚寅» nhưng lời giải ngay sau ghi «庚日戊寅時» — trụ đúng là Mậu Dần."""
    assert MUC[khoa]["tru_gio"] == tru


def test_moi_muc_qua_bo_kiem_va_giong_van():
    n, loi = sg.kiem_tep(GOC / "app" / "kb" / "data" / "battu_ngay_gio.json")
    assert n == 120 and not loi, loi[:10]
    from app.kb import tuvi_doi_song_kb as kds
    cam, cum = kds.cum_cam(), kds.cum_chung_chung()
    for k, m in MUC.items():
        assert m["nguon"] == "tam_menh_thong_hoi_du_bo"
        for f in ("y", "ham_y", "viec"):
            t = m.get(f) or ""
            assert not kds.tim_cum_cam(t, cam) and not kds.tim_cum_cam(t, cum), (k, f)
        if m["nhom"] == "C":
            assert m["chu_de"] in ("suc_khoe", "suc_ben", "gia_dinh", "con_cai"), k


def test_nguon_kb():
    assert KB["source_id"] and KB["school_id"] == "tu_binh" and KB["trang_thai"].startswith("nhap")


# ───────────────────────── RULES: chọn mục theo lá số ─────────────────────────

def _ls(gio: dt.datetime) -> dict:
    return battu.la_so(gio, "nam")


def test_chon_dung_ngay_gio_tinh_tay():
    """17/5/1990 12:00 → trụ ngày Nhâm Ngọ, giờ Ngọ; ngày Nhâm khởi Canh Tý → giờ Bính Ngọ (tính tay) = mục Nhâm|Ngọ."""
    ls = _ls(dt.datetime(1990, 5, 17, 12, 0))
    assert ls["tru"][2]["can"] == "Nhâm" and (ls["tru"][3]["can"], ls["tru"][3]["chi"]) == ("Bính", "Ngọ")
    cac = sgm.battu_ngay_gio(ls)
    assert [(m["han"], ve) for m, ve in cac] == [(MUC["Nhâm|Ngọ"]["han"], "Sinh ngày Nhâm giờ Ngọ")]


def test_da_ty_khong_khop_tru_gio_sach_thi_khong_chon():
    """Sinh 23:30 (dạ Tý): trụ ngày giữ hôm đó (Nhâm), trụ giờ là Tý của ngày sau (Nhâm Tý) — sách cho ngày Nhâm giờ Canh Tý
    → trụ giờ khác sách, không chọn (thà thiếu còn hơn sai)."""
    ls = _ls(dt.datetime(1990, 5, 17, 23, 30))
    assert ls["tru"][2]["can"] == "Nhâm" and ls["tru"][3]["can"] == "Nhâm" and ls["tru"][3]["chi"] == "Tý"
    assert sgm.battu_ngay_gio(ls) == []


def test_moi_ngay_gio_mau_deu_khop_mot_muc():
    for d in range(1, 29):
        for gio in (1, 5, 9, 13, 17, 21):
            ls = _ls(dt.datetime(2001, 3, d, gio, 10))
            cac = sgm.battu_ngay_gio(ls)
            assert len(cac) == 1, (d, gio)


def test_khoi_la_so_co_muc_va_nhom_c_khong_toi_tre_hoac_khong_biet_tuoi():
    ls = _ls(dt.datetime(1990, 5, 17, 12, 0))
    from app.calc import battu_mo_rong
    k = sgm.battu(ls, battu_mo_rong.mo_rong(ls), tuoi=30, gioi="nam")
    ng = [n for n in k["nhom"] if n["ma"] == "ngay_gio"]
    assert len(ng) == 1 and len(ng[0]["muc"]) == 1
    assert ng[0]["muc"][0]["sach"] == "Tam Mệnh Thông Hội" and ng[0]["muc"][0]["ve"] == "Sinh ngày Nhâm giờ Ngọ"
    c = next((m, f"Sinh ngày {k_.split('|')[0]} giờ {k_.split('|')[1]}") for k_, m in MUC.items() if m["nhom"] == "C")
    assert sgm.khoi([("ngay_gio", "x", [c])], tuoi=30)["so_muc"] == 1
    assert sgm.khoi([("ngay_gio", "x", [c])], tuoi=15) is None
    assert sgm.khoi([("ngay_gio", "x", [c])], tuoi=None) is None


def test_ban_tieng_anh_khong_co():
    ls = _ls(dt.datetime(1990, 5, 17, 12, 0))
    from app.calc import battu_mo_rong
    with ngon_ngu.dung("en"):
        assert sgm.battu(ls, battu_mo_rong.mo_rong(ls), tuoi=30) is None


def test_hoi_dap_khong_doi():
    """Hỏi đáp dùng `battu_nhom` — nhóm ngày × giờ chỉ ở khối lá số, không chen vào hỏi đáp."""
    ls = _ls(dt.datetime(1990, 5, 17, 12, 0))
    from app.calc import battu_mo_rong
    assert "ngay_gio" not in {ma for ma, _, _ in sgm.battu_nhom(ls, battu_mo_rong.mo_rong(ls))}
