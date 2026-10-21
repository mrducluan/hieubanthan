# -*- coding: utf-8 -*-
"""TV-V2 — CHỨNG MINH phần viết lại bằng Python của engine TypeScript v2.2 (`03_astroEngine_v2_2.ts`).

Oracle: bản sao nguyên văn `ziwei/oracle_v22/astroEngine_v2_2.ts`, chạy trên 67 lá số iztro của dự án (tên → mã
bằng `app.kb.tuvi_ma_chuan`) → golden `fixtures/golden/tuvi_v22_oracle.json` (sinh bằng
`ziwei/oracle_v22/sinh_golden.py`). Mỗi hàm TS:

| TS                               | Python                                              | Kết quả mong đợi            |
|----------------------------------|-----------------------------------------------------|-----------------------------|
| assignPalaceStemsAndLaiNhan      | calc.tuvi_phi_hoa.ngu_ho_don / lai_nhan (+ iztro)   | trùng 100%                  |
| calculateFlyingStarMatrix        | calc.tuvi_phi_hoa.phi_hoa                           | trùng 100% (48 đường)       |
|   criticalClashes                | luangiai.tuvi_phi_hoa noi_bat "ky_xung"             | CỐ Ý khác: lọc hẹp hơn      |
| calculateDouJunJanuaryBranch     | calc.tuvi_luu_nguyet (Đẩu Quân từ Thái Tuế)         | trùng, trừ nửa sau tháng nhuận |
| calculate90DayRadar              | luangiai.tuvi_luu_nguyet.lap_nam + nhip_3_thang     | cung/can/tứ hoá trùng; mức CỐ Ý khác |
| calculateMultiChartSynergy       | luangiai.tuvi_hop_tham.lap                          | cung đích trùng; điểm theo luật riêng |
| buildBirthTimeCalibrationTest    | luangiai.tuvi_dinh_gio.lap                          | cung bị xung trùng; năm do người dùng chọn |
| calculateBaZhaiGua               | calc.phongthuy.menh_quai + bang_huong               | trùng 1901–2099 (sau Lập xuân); CỐ Ý khác trước Lập xuân |

Mọi chỗ CỐ Ý khác đều được kiểm đúng chỗ khác (không bỏ qua im lặng). Bảng tóm tắt: docs/NANG-CAP-TUVI-V2.md
mục "Bảng chuyển đổi TS → Python".
"""
from __future__ import annotations

import datetime as dt
import json
from collections import Counter
from functools import lru_cache
from pathlib import Path

import pytest

from app.calc import lunar
from app.calc import phongthuy as pt
from app.calc import tuvi_an_sao as az
from app.calc import tuvi_luu_nguyet as ln
from app.calc import tuvi_phi_hoa as ph
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_ma_chuan as mc
from app.luangiai import tuvi_dinh_gio as dg
from app.luangiai import tuvi_hop_tham as ht
from app.luangiai import tuvi_luu_nguyet as luan_ln
from app.luangiai import tuvi_nhip_3_thang as nhip
from app.luangiai import tuvi_phi_hoa as lph

G = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "tuvi_v22_oracle.json")
               .read_text(encoding="utf-8"))
CASES = G["cases"]
BY_ID = {c["id"]: c for c in CASES}
IDS = [c["id"] for c in CASES]
HOA_MA = ["LOC", "QUYEN", "KHOA", "KY"]
# Luật của TS (để kiểm Python tái lập đúng điều TS làm, rồi chỉ ra chỗ Python cố ý khác)
TS_KY_XUNG = {"Mệnh", "Tài Bạch", "Quan Lộc", "Điền Trạch", "Phu Thê"}          # criticalClashes
TS_RADAR_KY_XUNG = {"Mệnh", "Tài Bạch", "Quan Lộc", "Tật Ách"}                  # RED thứ hai
TS_RADAR_LOC = {"Mệnh", "Tài Bạch", "Quan Lộc", "Điền Trạch"}                   # GREEN
VAI_QUAN_HE = {"BUSINESS_PARTNER": "doi_tac", "SPOUSE": "vo_chong", "CHILD": "cha_me_con"}


def _ngay(c: dict) -> dt.date:
    return dt.date.fromisoformat(c["ngay"])


@lru_cache(maxsize=None)
def _ls(ngay: str, ti: int, gt: str) -> dict:
    return tom_tat(az.an_sao_tho(dt.date.fromisoformat(ngay), ti, gt, "vi-VN"))


def ls_cua(c: dict) -> dict:
    return _ls(c["ngay"], c["ti"], c["gioi_tinh"])


def _sinh(c: dict, ti: int | None = None) -> dict:
    return {"ngay": _ngay(c), "ti": c["ti"] if ti is None else ti, "gioi_tinh": c["gioi_tinh"]}


def _xung(ls: dict) -> dict:
    chi = {x["ten"]: lunar.CHI.index(x["chi"]) for x in ls["cung"]}
    return {a: next(b for b in chi if chi[b] == (chi[a] + 6) % 12) for a in chi}


def _ma(ten: str | None) -> str | None:
    return mc.ma_cung(ten) if ten else None


def _ngu_ho_don_thang(can_nam: str, thang: int) -> str:
    """Can tháng âm `thang` theo Ngũ Hổ Độn (tháng Giêng = can cung Dần)."""
    return lunar.CAN[(lunar.CAN.index(ph.ngu_ho_don(can_nam, "Dần")) + thang - 1) % 10]


# ------------------------------------------------------------------ 0. golden + đầu vào tái lập được
def test_golden_du_lon():
    assert len(CASES) >= 30
    assert len(G["bazhai"]) == 400


@pytest.mark.parametrize("cid", IDS)
def test_dau_vao_ts_tai_lap_tu_la_so_du_an(cid):
    c = BY_ID[cid]
    ls = ls_cua(c)
    assert c["palaces"] == mc.cung_sang_ma(ls["cung"])
    assert c["birthYearStem"] == mc.ma_can(ls["can_nam"])
    assert c["birthHourBranch"] == mc.ma_chi(lunar.CHI[c["ti"] % 12])


# ------------------------------------------------------------------ 1. assignPalaceStemsAndLaiNhan
@pytest.mark.parametrize("cid", IDS)
def test_can_cung_va_lai_nhan_trung(cid):
    c = BY_ID[cid]
    ls = ls_cua(c)
    ts = c["assign"]
    for x in ls["cung"]:
        m = mc.ma_cung(x["ten"])
        assert ts["stems"][m] == mc.ma_can(x["can"]) == mc.ma_can(ph.ngu_ho_don(c["can_nam"], x["chi"])), m
    chi_lai = ph.lai_nhan(c["can_nam"])
    ten_lai = next(x["ten"] for x in ls["cung"] if x["chi"] == chi_lai)
    assert ts["laiNhanPalace"] == mc.ma_cung(ten_lai)
    assert lph.lap(ls, c["can_nam"])["lai_nhan"]["cung"] == ten_lai


# ------------------------------------------------------------------ 2. calculateFlyingStarMatrix
@pytest.mark.parametrize("cid", IDS)
def test_48_duong_bay_tu_hoa_xung_tuan_triet_trung(cid):
    c = BY_ID[cid]
    ls = ls_cua(c)
    py = [[mc.ma_cung(d["tu_cung"]), mc.ma_can(d["can"]), mc.ma_hoa(d["hoa"]), mc.ma_sao(d["sao"]),
           _ma(d["den_cung"]), _ma(d["xung_cung"]), d["tu_hoa"], bool(d["den_tuan_triet"])]
          for d in ph.phi_hoa(ls["cung"])]
    assert len(py) == 48
    assert py == c["matrix"]["allTransitions"]
    assert c["matrix"]["selfTransformations"] == sum(d[6] for d in py)


def test_xung_theo_ten_cung_ts_bang_xung_theo_dia_chi_python():
    # TS: PALACE_CLASH_MAP theo TÊN cung; Python: cung ở chi đối diện. Vòng 12 cung cố định → như nhau mọi lá.
    ts = {"MENH": "THIEN_DI", "HUYNH_DE": "NO_BOC", "PHU_THE": "QUAN_LOC", "TU_TUC": "DIEN_TRACH",
          "TAI_BACH": "PHUC_DUC", "TAT_ACH": "PHU_MAU"}
    ts.update({v: k for k, v in ts.items()})
    for c in CASES:
        assert {mc.ma_cung(a): mc.ma_cung(b) for a, b in _xung(ls_cua(c)).items()} == ts


@pytest.mark.parametrize("cid", IDS)
def test_truc_ky_xung_cung_chinh_loc_tuong_duong(cid):
    """criticalClashes (TS) = Kỵ mà cung bị xung ∈ {Mệnh, Tài Bạch, Quan Lộc, Điền Trạch, Phu Thê}, kể cả tự hoá.
    Python `noi_bat` loại "ky_xung" CỐ Ý hẹp hơn: chỉ Mệnh / Tài Bạch / Quan Lộc, bỏ tự hoá, tối đa 8 mục."""
    c = BY_ID[cid]
    ls = ls_cua(c)
    duong = ph.phi_hoa(ls["cung"])
    # (a) cùng luật TS áp lên đường bay Python → ra đúng tập criticalClashes của TS
    ts = {tuple(x) for x in c["matrix"]["criticalClashes"]}
    assert {(mc.ma_cung(d["tu_cung"]), "KY") for d in duong
            if d["hoa"] == "Kỵ" and d["xung_cung"] in TS_KY_XUNG} == ts
    # (b) ứng viên ky_xung của Python ⊆ criticalClashes
    ung = {(mc.ma_cung(d["tu_cung"]), "KY") for d in duong
           if d["hoa"] == "Kỵ" and not d["tu_hoa"] and d["xung_cung"] in lph.CUNG_CHINH}
    assert ung <= ts
    # (c) mỗi ứng viên có mặt trong noi_bat (dạng ky_xung hoặc mẫu KB), trừ khi đã đủ 8 mục
    nb = lph.lap(ls, c["can_nam"])["noi_bat"]
    co = {(mc.ma_cung(x["duong"]["tu_cung"]), mc.ma_hoa(x["duong"]["hoa"])) for x in nb}
    assert ung <= co or len(nb) == lph.TOI_DA_NOI_BAT
    for x in nb:
        if x["loai"] == "ky_xung":
            assert (mc.ma_cung(x["duong"]["tu_cung"]), "KY") in ts


def test_ky_xung_khac_co_y_dien_trach_phu_the_tu_hoa():
    """Đếm phần TS báo mà Python không coi là "ky_xung" — phải có thật trong dữ liệu và đúng 3 lý do đã ghi."""
    dem = Counter()
    for c in CASES:
        for d in ph.phi_hoa(ls_cua(c)["cung"]):
            if d["hoa"] != "Kỵ" or d["xung_cung"] not in TS_KY_XUNG:
                continue
            if d["tu_hoa"]:
                dem["tu_hoa"] += 1
            elif d["xung_cung"] in ("Điền Trạch", "Phu Thê"):
                dem[d["xung_cung"]] += 1
            else:
                assert d["xung_cung"] in lph.CUNG_CHINH
                dem["trung"] += 1
    assert dem["trung"] > 0 and dem["Điền Trạch"] > 0 and dem["Phu Thê"] > 0 and dem["tu_hoa"] > 0


# ------------------------------------------------------------------ 3. calculate90DayRadar (+ Đẩu Quân tháng Giêng)
@lru_cache(maxsize=None)
def _lap_nam(cid: str, nam: int) -> dict:
    c = BY_ID[cid]
    return luan_ln.lap_nam(_sinh(c), nam, "dau_quan_thai_tue", ls=ls_cua(c))


def _thang_py(cid: str, nam: int, thang: int) -> dict:
    return next(t for t in _lap_nam(cid, nam)["thang"] if t["thang"] == thang and not t["nhuan"])


def _muc_ts(ky_t, ky_n, loc_t, xung) -> str:
    """Luật alertLevel của TS, viết lại trên dữ liệu Python."""
    if ky_t == ky_n or xung.get(ky_t) == xung.get(ky_n) or xung.get(ky_t) in TS_RADAR_KY_XUNG:
        return "RED_CRITICAL_ALERT"
    if loc_t in TS_RADAR_LOC:
        return "GREEN_GOLDEN_WINDOW"
    return "YELLOW_CAUTION"


def _nam_hoa(can: str, ls: dict) -> dict:
    return {x["hoa"]: x["den_cung"] for x in ph.phi_tu_can(can, ls["cung"])}


@pytest.mark.parametrize("cid", IDS)
def test_dau_quan_thang_gieng_trung(cid):
    c = BY_ID[cid]
    r = c["radar"][0]
    gieng = _thang_py(cid, r["viewingYear"], 1)
    chi_py = next(x["chi"] for x in ls_cua(c)["cung"] if x["ten"] == gieng["cung_goc"])
    lech = 0
    if c["birthLunarLeap"] and c["birthLunarDay"] > 15:
        # nửa sau tháng nhuận: dự án (như iztro, mặc định "thang_sau") tính sang tháng sau; adapter TS nhận số
        # tháng thô → cung tháng Giêng lệch đúng 1 cung. CỐ Ý khác.
        lech = 1
    assert r["janBranch"] == mc.ma_chi(lunar.CHI[(lunar.CHI.index(chi_py) + lech) % 12])


def test_co_ca_sinh_nua_sau_thang_nhuan():
    assert any(c["birthLunarLeap"] and c["birthLunarDay"] > 15 for c in CASES)


@pytest.mark.parametrize("cid", IDS)
def test_luu_nguyet_12_thang_cung_can_tu_hoa_trung(cid):
    c = BY_ID[cid]
    ls = ls_cua(c)
    xung = _xung(ls)
    r = c["radar"][0]
    can_nam = lunar.can_chi_nam(r["viewingYear"])[0]
    leap = c["birthLunarLeap"] and c["birthLunarDay"] > 15
    assert [it["lunarMonth"] for it in r["items"]] == list(range(1, 13))
    for it in r["items"]:
        t = _thang_py(cid, r["viewingYear"], it["lunarMonth"])
        assert it["monthStem"] == mc.ma_can(t["can_chi"].split()[0]) == mc.ma_can(
            _ngu_ho_don_thang(can_nam, it["lunarMonth"]))
        if not leap:
            assert it["palaceAtMonth"] == mc.ma_cung(t["cung_goc"])
        for h, x in zip(HOA_MA, t["tu_hoa_thang"]):
            ts = it["monthlySiHua"][h]
            assert ts["star"] == mc.ma_sao(x["sao"])
            assert ts["targetPalace"] == mc.ma_cung(x["cung_goc"])
            assert ts["clashedPalace"] == mc.ma_cung(xung[x["cung_goc"]])


def _so_muc(c: dict, it: dict, can_nam: str) -> tuple[str, str, str]:
    """→ (mức TS, mức TS tái lập trên dữ liệu Python, mức Python)."""
    ls = ls_cua(c)
    xung = _xung(ls)
    th = {mc.ten_hoa(h): mc.ten_cung(v["targetPalace"]) for h, v in it["monthlySiHua"].items()}
    nam = _nam_hoa(can_nam, ls)
    muc, _ = nhip.xep_muc(th, nam, xung)
    return it["alertLevel"], _muc_ts(th["Kỵ"], nam["Kỵ"], th["Lộc"], xung), muc


def test_muc_tung_thang_ts_tai_lap_duoc_va_chi_khac_dung_cho_da_ghi():
    """Tái lập được 100% mức của TS từ dữ liệu Python; Python khác TS CHỈ ở 4 chỗ có chủ ý:
    - chong_ky_doi_truc: Kỵ tháng ở cung ĐỐI DIỆN Kỵ năm (cùng trục) → Python cần thận trọng; TS chỉ so trùng cung.
    - tat_ach: TS báo đỏ khi Kỵ tháng xung Tật Ách; Python không xếp mức theo Tật Ách (không bàn sức khoẻ).
    - song_loc: Lộc tháng trùng cung Lộc năm → Python thuận; TS không có luật này.
    - (TS GREEN mà Python can_than) chỉ do chong_ky_doi_truc."""
    dem = Counter()
    doi = {"RED_CRITICAL_ALERT": "can_than", "GREEN_GOLDEN_WINDOW": "thuan", "YELLOW_CAUTION": "binh"}
    for c in CASES:
        ls = ls_cua(c)
        xung = _xung(ls)
        r = c["radar"][0]
        can_nam = lunar.can_chi_nam(r["viewingYear"])[0]
        for it in r["items"]:
            ts, ts_lai, py = _so_muc(c, it, can_nam)
            assert ts == ts_lai, (c["id"], it["lunarMonth"])
            dem["tong"] += 1
            if doi[ts] == py:
                dem["trung"] += 1
                continue
            th = {mc.ten_hoa(h): mc.ten_cung(v["targetPalace"]) for h, v in it["monthlySiHua"].items()}
            nam = _nam_hoa(can_nam, ls)
            doi_truc = th["Kỵ"] == xung[nam["Kỵ"]]
            if py == "can_than":
                assert doi_truc, (c["id"], it["lunarMonth"])
                dem["chong_ky_doi_truc"] += 1
            elif ts == "RED_CRITICAL_ALERT":
                assert xung[th["Kỵ"]] == "Tật Ách" and th["Kỵ"] != nam["Kỵ"], (c["id"], it["lunarMonth"])
                dem["tat_ach"] += 1
            else:
                assert ts == "YELLOW_CAUTION" and py == "thuan" and th["Lộc"] == nam["Lộc"]
                dem["song_loc"] += 1
    assert dem["tong"] == 12 * len(CASES)
    assert dem["chong_ky_doi_truc"] > 0 and dem["tat_ach"] > 0 and dem["song_loc"] > 0
    assert dem["trung"] / dem["tong"] > 0.7


@lru_cache(maxsize=None)
def _nhip(cid: str) -> list[dict]:
    c = BY_ID[cid]
    return nhip.lap(_sinh(c), dt.date.fromisoformat(c["radar"][1]["ngay_xem"]), ls=ls_cua(c))["thang"]


@pytest.mark.parametrize("cid", IDS)
def test_nhip_3_thang_theo_ngay_xem(cid):
    """`nhip_3_thang.lap` (3 tháng từ ngày xem) đối chiếu calculate90DayRadar(currentLunarMonth).
    CỐ Ý khác: (1) tháng sang năm âm sau — TS vẫn dùng can năm cũ (sai can tháng + Kỵ năm), Python dùng năm mới;
    (2) tháng nhuận — TS không biết tháng nhuận, Python tách nửa đầu/nửa sau."""
    c = BY_ID[cid]
    r = c["radar"][1]
    py = _nhip(cid)
    ts = r["items"]
    assert len(py) == len(ts) == 3
    can_cu = lunar.can_chi_nam(r["viewingYear"])[0]
    ts_thang = [it["lunarMonth"] for it in ts]
    for t in py:
        if t["nhuan"]:
            # TS gọi tháng này là tháng thường cùng số; Python ghi rõ nhuận + nửa tháng
            assert t["thang"] in ts_thang and t["phan"] in ("nua_dau", "nua_sau")
            continue
        it = ts[ts_thang.index(t["thang"])]
        if t["nam_am"] != r["viewingYear"]:
            assert it["monthStem"] == mc.ma_can(_ngu_ho_don_thang(can_cu, t["thang"]))   # TS: can năm cũ
            assert it["monthStem"] != mc.ma_can(t["can_chi"].split()[0])                  # Python: năm mới
            continue
        assert it["monthStem"] == mc.ma_can(t["can_chi"].split()[0])
        leap = c["birthLunarLeap"] and c["birthLunarDay"] > 15
        if not leap:
            assert it["palaceAtMonth"] == mc.ma_cung(t["cung_goc"])
        for h, x in zip(HOA_MA, t["tu_hoa_thang"]):
            assert it["monthlySiHua"][h]["targetPalace"] == mc.ma_cung(x["cung_goc"])
        ts_muc, ts_lai, py_muc = _so_muc(c, it, can_cu)
        assert ts_muc == ts_lai and t["muc"] == py_muc


def test_nhip_co_ca_vat_nam_va_thang_nhuan():
    loai = Counter()
    for c in CASES:
        r = c["radar"][1]
        for t in _nhip(c["id"]):
            loai["nhuan"] += t["nhuan"]
            loai["vat_nam"] += t["nam_am"] != r["viewingYear"]
    assert loai["nhuan"] > 0 and loai["vat_nam"] > 0


def test_muc_python_khong_dung_nhan_doa():
    assert set(nhip.NHAN_MUC) == {"thuan", "binh", "can_than"}
    for s in list(nhip.NHAN_MUC.values()) + list(nhip._GOI_Y.values()):
        assert not any(w in s.lower() for w in ("đỏ", "báo động", "đứt gãy", "critical"))


# ------------------------------------------------------------------ 4. calculateMultiChartSynergy
@pytest.mark.parametrize("cid", IDS)
def test_hop_tham_cung_dich_trung_khong_nhan_tung_duong(cid):
    c = BY_ID[cid]
    s = c["synergy"]
    kia = BY_ID[s["partner"]]
    ls_ban, ls_kia = ls_cua(c), ls_cua(kia)
    r = ht.lap(ls_ban, c["can_nam"], kia["can_nam"], VAI_QUAN_HE[s["role"]], ls_kia=ls_kia)
    assert mc.ma_can(r["can_nam_nguoi_kia"]) == s["partnerBirthYearStem"]
    assert mc.ma_can(r["can_menh_nguoi_kia"]) == s["partnerMenhPalaceStem"]

    def gon(ds):
        return [(mc.ma_hoa(x["hoa"]), mc.ma_sao(x["sao"]), _ma(x["den_cung"]), _ma(x["xung_cung"])) for x in ds]

    def ts_gon(src, ds):
        return [(x["siHuaType"], x["starTriggered"], x["landedOnUserPalace"], x["clashedUserPalace"])
                for x in ds if x["triggerSource"] == src]

    assert gon(r["nguoi_kia_vao_ban"]) == ts_gon("PARTNER_YEAR_STEM", s["forward"])
    assert gon(r["menh_nguoi_kia_vao_ban"]) == ts_gon("PARTNER_MENH_STEM", s["forward"])
    assert gon(r["ban_vao_nguoi_kia"]) == ts_gon("PARTNER_YEAR_STEM", s["reverse"])
    # CỐ Ý khác: TS gắn impactVerdict (BENEFACTOR_BOOST / TOXIC_DRAIN_ALERT…) cho TỪNG đường bay; Python không gắn
    # nhãn lên đường bay — điểm tham khảo (HN-2N) chấm riêng bằng luật công khai luangiai/tuvi_hai_nguoi.py.
    assert r["diem"] is None
    for ds in (r["nguoi_kia_vao_ban"], r["menh_nguoi_kia_vao_ban"], r["ban_vao_nguoi_kia"]):
        for x in ds:
            assert set(x) == {"hoa", "sao", "den_cung", "xung_cung", "nghia"}
            assert not any(w in x["nghia"].lower() for w in ("cảnh báo", "tuyệt đối", "độc hại"))


def test_hop_tham_ts_co_phan_xu_ma_python_bo():
    v = Counter(x["impactVerdict"] for c in CASES for x in c["synergy"]["forward"])
    assert v["TOXIC_DRAIN_ALERT"] > 0 and v["BENEFACTOR_BOOST"] > 0


# ------------------------------------------------------------------ 5. buildBirthTimeCalibrationTest
@pytest.mark.parametrize("cid", IDS)
def test_dinh_gio_cung_bi_xung_theo_nam_trung(cid):
    c = BY_ID[cid]
    k = c["calibration"]
    nam = [y["solarYear"] for y in k["years"]]
    uv = [{"nhan": u["label"], "gio_dai_dien": "", "la_gio_nhap": u["label"] == "EXACT_HOUR_CHART",
           "sinh": _sinh(c, u["ti"])} for u in k["candidates"]]
    py = dg.lap(uv, nam, [])["ung_vien"]
    assert len(py) == len(k["result"]) == len(k["candidates"])
    for u, p, ts in zip(k["candidates"], py, k["result"]):
        assert ts["hourBranch"] == mc.ma_chi(p["chi_gio"])
        assert [s for s in ts["menhMainStars"] if s in mc.CHINH_TINH] == [mc.ma_sao(s) for s in
                                                                          p["cung_menh"]["chinh_tinh"]]
        for y, q, pn in zip(k["years"], ts["pastVerificationQuestions"], p["nam"]):
            assert pn["nam"] == q["yearToCheck"] and mc.ma_can(pn["can_chi"].split()[0]) == q["yearStem"]
            chieu = [x for x in pn["cau_hoi"] if x["hoa"] == "Kỵ" and x["cach"] == "chieu"]
            assert len(chieu) == 1 and mc.ma_cung(chieu[0]["cung"]) == q["clashedPalace"]
            # Python hỏi thêm cung Kỵ NHẬP và cung Lộc nhập (TS chỉ có cung bị xung)
            assert any(x["hoa"] == "Kỵ" and x["cach"] == "nhap" for x in pn["cau_hoi"])


def test_dinh_gio_nam_mac_dinh_khac_co_y():
    # TS cố định 2022–2024 (Nhâm, Quý, Giáp); Python: 3 năm âm gần nhất đã qua, người dùng đổi được.
    for c in CASES:
        for r in c["calibration"]["resultDefaultYears"]:
            assert [(y, s) for y, s, _ in r["years"]] == [(2022, "NHAM"), (2023, "QUY"), (2024, "GIAP")]
    assert dg.nam_mac_dinh(dt.date(2030, 6, 1)) == [2027, 2028, 2029]
    assert dg.nam_mac_dinh(dt.date(2026, 10, 20)) == [2023, 2024, 2025]


def test_dinh_gio_tat_ach_khong_hoi_benh():
    # TS: "cơ thể phát sinh bệnh lý cần điều trị"; Python hỏi nhịp sinh hoạt.
    from app.kb import tuvi_phi_hoa_kb as kb
    cau = kb.dinh_gio_cau_hoi("Tật Ách") or dg._MAC_DINH["Kỵ"]
    assert "bệnh" not in cau.lower() and "sức khỏe" not in cau.lower() and "sức khoẻ" not in cau.lower()


# ------------------------------------------------------------------ 6. TS rơi về 'MENH' khi thiếu sao
def test_thieu_sao_ts_roi_ve_menh_python_tra_none():
    t = G["thieuSao"][0]
    c = BY_ID[t["id"]]
    cung = [{**x, "phu_tinh": [s for s in x["phu_tinh"] if s != "Văn Xương"]} for x in ls_cua(c)["cung"]]
    duong = ph.phi_hoa(cung)
    mat = [d for d in duong if d["sao"] == "Văn Xương"]
    assert mat and all(d["den_cung"] is None and d["xung_cung"] is None for d in mat)
    # TS bỏ hẳn các đường bay không thấy sao (không báo) — 48 − số đường mất
    assert len(t["matrix"]["allTransitions"]) == 48 - len(mat)
    # radar: tháng 2 năm Bính = Tân Mão, Kỵ Văn Xương → TS gán 'MENH' (sai), Python None
    it = t["radar"][1]
    assert it["monthStem"] == "TAN" and it["monthlySiHua"]["KY"]["targetPalace"] == "MENH"
    menh = next(x for x in cung if x["ten"] == "Mệnh")
    assert not any(s == "Văn Xương" for s in menh["phu_tinh"])
    assert ph.phi_tu_can("Tân", cung)[3]["den_cung"] is None
    # định giờ: năm Tân → TS đặt Kỵ ở Mệnh, "xung" Thiên Di; Python không tạo câu hỏi cho đường không có đích
    assert t["calibration"][0]["pastVerificationQuestions"][0]["clashedPalace"] == "THIEN_DI"
    assert nhip.xep_muc({"Kỵ": None}, {"Kỵ": "Mệnh"}, _xung(ls_cua(c))) == ("binh", [])


# ------------------------------------------------------------------ 7. calculateBaZhaiGua
_DU = {"sinhKhi": "Sinh Khí", "thienY": "Thiên Y", "dienNien": "Diên Niên", "phucVi": "Phục Vị"}


def _ts_bz(nam: int, gt: str) -> dict:
    return next(b["result"] for b in G["bazhai"] if b["year"] == nam and b["gender"] == gt)


@pytest.mark.parametrize("gt", ["MALE", "FEMALE"])
def test_bat_trach_trung_1901_2099_sau_lap_xuan(gt):
    g = "nam" if gt == "MALE" else "nu"
    for nam in range(1901, 2100):
        ts = _ts_bz(nam, gt)
        py = pt.menh_quai(nam, g, dt.date(nam, 3, 1))
        assert py["nam_tinh"] == nam
        assert ts["kuaNumber"] == py["so"] and ts["kuaName"] == py["quai"], nam
        assert ts["group"] == {"Đông tứ mệnh": "DONG_TU_MENH", "Tây tứ mệnh": "TAY_TU_MENH"}[py["nhom"]]
        bh = pt.bang_huong(py["quai"])
        for k, du in _DU.items():
            assert bh[ts["auspiciousDirections"][k]] == du, (nam, k)


def test_bat_trach_ts_loi_nam_1900():
    # 1900: hai chữ số cuối = 00 → tổng 0 → TS ra quái số 10 (không có trong bảng). Python: Khảm (1).
    assert _ts_bz(1900, "MALE") == {"kuaNumber": 10}
    assert pt.menh_quai(1900, "nam", dt.date(1900, 3, 1))["quai"] == "Khảm"


@pytest.mark.parametrize("gt", ["MALE", "FEMALE"])
def test_bat_trach_truoc_lap_xuan_khac_co_y(gt):
    """TS lấy năm DƯƠNG; Python (quyết định Bát trạch theo Lập xuân) — sinh 20/01 thuộc năm trước."""
    g = "nam" if gt == "MALE" else "nu"
    khac = 0
    for nam in range(1902, 2100):
        py = pt.menh_quai(nam, g, dt.date(nam, 1, 20))
        assert py["nam_tinh"] == nam - 1
        assert py["so"] == _ts_bz(nam - 1, gt)["kuaNumber"]
        khac += py["so"] != _ts_bz(nam, gt)["kuaNumber"]
    assert khac > 150
