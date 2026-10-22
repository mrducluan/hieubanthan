# -*- coding: utf-8 -*-
"""TV-V2 — RULES "Nhịp 3 tháng tới" (luangiai/tuvi_nhip_3_thang.py). Viết TRƯỚC hàm.

Luật công khai:
- chong_ky: Kỵ tháng cùng trục (đích hoặc xung) với Kỵ năm → can_than
- ky_xung_cung_chinh: Kỵ tháng xung Mệnh / Tài Bạch / Quan Lộc → can_than
- loc_nhap_cung_chinh: Lộc tháng vào Mệnh / Tài Bạch / Quan Lộc / Điền Trạch → thuan
- song_loc: Lộc tháng + Lộc năm cùng cung → thuan
- khoa_giai: Khoa tháng vào cung đang chồng Kỵ → thêm lý do (không đổi mức)
Có lý do can_than → can_than; không thì có lý do thuan → thuan; còn lại binh.
"""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest

from app.calc import lunar, tuvi_an_sao as az, tuvi_phi_hoa as ph
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_doi_song_kb as dkb, tuvi_phi_hoa_kb as pkb
from app.luangiai import tuvi_nhip_3_thang as nh

SINH = {"ngay": dt.date(1990, 5, 15), "ti": 1, "gioi_tinh": "nam"}
XUNG = {"Mệnh": "Thiên Di", "Thiên Di": "Mệnh", "Tài Bạch": "Phúc Đức", "Phúc Đức": "Tài Bạch",
        "Quan Lộc": "Phu Thê", "Phu Thê": "Quan Lộc", "Tật Ách": "Phụ Mẫu", "Phụ Mẫu": "Tật Ách",
        "Điền Trạch": "Tử Nữ", "Tử Nữ": "Điền Trạch", "Nô Bộc": "Huynh Đệ", "Huynh Đệ": "Nô Bộc"}


def _ma(ly_do):
    return [x["ma"] for x in ly_do]


def test_xep_muc_chong_ky_dich_va_xung():
    nam = {"Lộc": "Nô Bộc", "Kỵ": "Tử Nữ"}
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Mệnh", "Khoa": "Phúc Đức", "Kỵ": "Tử Nữ"}, nam, XUNG)
    assert muc == "can_than" and "chong_ky" in _ma(ly)
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Mệnh", "Khoa": "Phúc Đức", "Kỵ": "Điền Trạch"}, nam, XUNG)
    assert muc == "can_than" and "chong_ky" in _ma(ly)        # Kỵ tháng ở cung xung của Kỵ năm


def test_xep_muc_ky_xung_cung_chinh():
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Thiên Di"},
                         {"Lộc": "Nô Bộc", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "can_than" and _ma(ly) == ["ky_xung_cung_chinh"]


def test_xep_muc_ky_nhap_cung_chinh():
    """Chủ dự án chốt 2026-10-22: Kỵ tháng rơi THẲNG vào Mệnh / Tài Bạch / Quan Lộc → Cần thận trọng (trước: Bình)."""
    for c in ("Mệnh", "Tài Bạch", "Quan Lộc"):
        muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": c},
                             {"Lộc": "Phúc Đức", "Kỵ": "Tật Ách"}, XUNG)
        assert muc == "can_than" and _ma(ly) == ["ky_nhap_cung_chinh"], c
        assert ly[0]["cung"] == c
    # Điền Trạch không thuộc nhóm cung chính của luật Kỵ (chỉ của luật Lộc) → vẫn Bình
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Điền Trạch"},
                         {"Lộc": "Phúc Đức", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "binh"


def test_xep_muc_thuan():
    muc, ly = nh.xep_muc({"Lộc": "Điền Trạch", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Huynh Đệ"},
                         {"Lộc": "Phụ Mẫu", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "thuan" and _ma(ly) == ["loc_nhap_cung_chinh"]
    muc, ly = nh.xep_muc({"Lộc": "Phụ Mẫu", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Huynh Đệ"},
                         {"Lộc": "Phụ Mẫu", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "thuan" and _ma(ly) == ["song_loc"]


def test_xep_muc_binh_va_khoa_giai():
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Phụ Mẫu"},
                         {"Lộc": "Phúc Đức", "Kỵ": "Thiên Di"}, XUNG)
    assert muc == "binh" and ly == []
    muc, ly = nh.xep_muc({"Lộc": "Huynh Đệ", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Tử Nữ"},
                         {"Lộc": "Phúc Đức", "Kỵ": "Tử Nữ"}, XUNG)
    assert muc == "can_than" and "khoa_giai" in _ma(ly)
    # can_than thắng thuan khi cùng có
    muc, ly = nh.xep_muc({"Lộc": "Mệnh", "Quyền": "Nô Bộc", "Khoa": "Tử Nữ", "Kỵ": "Thiên Di"},
                         {"Lộc": "Phúc Đức", "Kỵ": "Tật Ách"}, XUNG)
    assert muc == "can_than" and set(_ma(ly)) == {"loc_nhap_cung_chinh", "ky_xung_cung_chinh"}


def test_lap_ba_thang_trong_nam():
    r = nh.lap(SINH, dt.date(2026, 10, 19))      # âm 10/9/2026
    assert r["phai_luu_nguyet"] == "dau_quan_thai_tue"
    assert r["ngay_xem"] == "2026-10-19"
    assert [t["thang"] for t in r["thang"]] == [9, 10, 11]
    assert r["luu_nien"]["nam_am"] == 2026 and r["luu_nien"]["can_chi"] == "Bính Ngọ"
    ls = tom_tat(az.an_sao_tho(SINH["ngay"], 1, "nam", "vi-VN"))
    assert [(x["hoa"], x["sao"], x["cung_goc"]) for x in r["luu_nien"]["tu_hoa"]] == \
        [(x["hoa"], x["sao"], x["den_cung"]) for x in ph.phi_tu_can("Bính", ls["cung"])]
    t0 = r["thang"][0]
    assert t0["tu"] <= "2026-10-19" <= t0["den"]
    for t in r["thang"]:
        assert t["muc"] in ("thuan", "binh", "can_than")
        assert t["nhan_muc"] in ("Thuận", "Bình", "Cần thận trọng")
        assert t["goi_y"] and t["cau_tu_soi"] and t["cung_goc"] and t["can_chi"]
        assert len(t["tu_hoa_thang"]) == 4
        for x in t["ly_do"]:
            assert x["ma"] in ("chong_ky", "song_loc", "loc_nhap_cung_chinh", "ky_xung_cung_chinh", "khoa_giai")
            assert x["noi_dung"]
    assert "lưu nguyệt" in r["uu_tien"]["ghi_chu"]
    assert r["uu_tien"]["thu_tu"] == ["dai_han", "luu_nien", "tieu_han", "luu_nguyet"]
    assert r["luu_y"]


def test_lap_vat_sang_nam_sau():
    r = nh.lap(SINH, dt.date(2027, 1, 20))      # âm 13/12/2026 → tháng 12, Giêng, Hai năm 2027
    assert [(t["thang"], t["nam_am"]) for t in r["thang"]] == [(12, 2026), (1, 2027), (2, 2027)]
    assert r["luu_nien_sau"]["nam_am"] == 2027 and r["luu_nien_sau"]["can_chi"] == "Đinh Mùi"


def test_muc_khop_luat_tren_du_lieu_that():
    r = nh.lap(SINH, dt.date(2026, 3, 1))
    ln = {r["luu_nien"]["nam_am"]: r["luu_nien"]}
    if r.get("luu_nien_sau"):
        ln[r["luu_nien_sau"]["nam_am"]] = r["luu_nien_sau"]
    ls = tom_tat(az.an_sao_tho(SINH["ngay"], 1, "nam", "vi-VN"))
    chi = {c["ten"]: c["chi"] for c in ls["cung"]}
    xung = {a: next(b for b in chi if lunar.CHI.index(chi[b]) == (lunar.CHI.index(chi[a]) + 6) % 12) for a in chi}
    for t in r["thang"]:
        nam = {x["hoa"]: x["cung_goc"] for x in ln[t["nam_am"]]["tu_hoa"]}
        th = {x["hoa"]: x["cung_goc"] for x in t["tu_hoa_thang"]}
        muc, ly = nh.xep_muc(th, nam, xung)
        assert t["muc"] == muc and _ma(t["ly_do"]) == _ma(ly)


def test_khong_kb_van_chay(monkeypatch):
    monkeypatch.setattr(pkb, "_d", lambda: {})
    r = nh.lap(SINH, dt.date(2026, 10, 19))
    assert len(r["thang"]) == 3 and all(t["goi_y"] for t in r["thang"])


def test_phai_khac_va_phai_sai():
    r = nh.lap(SINH, dt.date(2026, 10, 19), phai="dia_chi_thang")
    assert r["phai_luu_nguyet"] == "dia_chi_thang"
    with pytest.raises(ValueError):
        nh.lap(SINH, dt.date(2026, 10, 19), phai="sai")


# ================================================================== NHIP-2 (2026-10-21): lời từng tháng cụ thể
# Chủ dự án báo: ba tháng cùng "Bình" thì "Diễn giải" + "Tự soi" giống hệt nhau (gợi ý chỉ theo 3 mức). Nay mỗi tháng
# dựng từ dữ kiện RIÊNG: cung tháng × mức (Nên làm), nơi Lộc tháng rơi (Điểm sáng), nơi Kỵ tháng rơi (Nên để ý, có
# hướng xử lý), Quyền/Khoa khi chạm cung tháng/cung chính, trùng cung hạn năm (ưu tiên). Thuật ngữ chỉ ở `can_cu`.
CUNG12 = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc",
          "Điền Trạch", "Phúc Đức", "Phụ Mẫu"]
SAO_HOA = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
           "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân", "Văn Xương", "Văn Khúc",
           "Tả Phù", "Hữu Bật"]
# Thuật ngữ cấm trong lời chính: tên cung Hán, tên sao, "hoá", tên tứ hoá đứng riêng, "lưu nguyệt/niên", "can".
THUAT_NGU = re.compile("|".join([*map(re.escape, CUNG12 + SAO_HOA)]) +
                       r"|(?<!\w)[Hh]oá(?!\w)|(?<!\w)(?:Lộc|Kỵ|Quyền|Khoa)(?!\w)|[Ll]ưu (?:nguyệt|niên)|đại hạn|tiểu hạn")
DOA = ["chắc chắn", "định mệnh", "số phận", "tai hoạ", "tai họa", "xui xẻo", "khắc", "phá sản", "ly hôn", "chết",
       "tai nạn", "hạn nặng", "bệnh", "báo động", "nguy hiểm"]
_G60 = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"]
# 3 ngày xem: giữa năm · vắt sang năm âm sau · có tháng nhuận (2025 nhuận tháng 6: 6 → 6 nhuận nửa đầu → nửa sau)
NGAY_XEM = [dt.date(2026, 10, 19), dt.date(2027, 1, 20), dt.date(2025, 7, 10), dt.date(2025, 8, 12)]


def _sinh(c: dict) -> dict:
    return {"ngay": dt.date.fromisoformat(c["ngay"]), "ti": c["ti"], "gioi_tinh": c["gioi_tinh"]}


@pytest.fixture(scope="module")
def nhieu_la() -> list[dict]:
    """24 lá golden × 4 ngày xem (+ 2 phái khác cho 4 lá) — mỗi phần tử là kết quả `lap` của một khung 3 tháng."""
    ra = []
    for k, c in enumerate(_G60[:24]):
        s = _sinh(c)
        ls = tom_tat(az.an_sao_tho(s["ngay"], s["ti"], s["gioi_tinh"], "vi-VN"))
        for x in NGAY_XEM:
            ra.append(nh.lap(s, x, ls=ls))
        if k < 4:
            ra.append(nh.lap(s, dt.date(2027, 1, 20), phai="tieu_han", ls=ls))
            ra.append(nh.lap({**s, "thang_nhuan": "thang_chinh"}, dt.date(2025, 7, 10), ls=ls))
    return ra


def _chu_chinh(r: dict) -> list[str]:
    """Mọi chữ người dùng đọc ở lớp chính (không gồm `can_cu` — phần "Vì sao nói vậy")."""
    ra = [r["tom_tat_3_thang"]]
    for t in r["thang"]:
        ra += [t["tieu_de_thang"], t["chu_de_thang"], t["goi_y"], t["cau_tu_soi"], t["nhan_thang"]]
        for h in t["hop"]:
            ra += [h["nhan"], h["tieu_de"], h["noi_dung"], h.get("huong_xu_ly") or ""]
    return [s for s in ra if s]


def test_hop_dong_moi_moi_thang():
    r = nh.lap(SINH, dt.date(2026, 10, 19))
    assert isinstance(r["tom_tat_3_thang"], str) and len(r["tom_tat_3_thang"]) > 20
    assert len(r["cung"]) == 12 and {c["ten"] for c in r["cung"]} == set(CUNG12)
    assert all(c["chi"] in lunar.CHI and c["nhan_ngan"] for c in r["cung"])
    for t in r["thang"]:
        assert t["tieu_de_thang"].startswith("Tháng ") and len(t["tieu_de_thang"]) <= 70
        assert t["chu_de_thang"] and t["goi_y"] and t["cau_tu_soi"].endswith("?")
        assert t["nhan_thang"].startswith(("Tháng ", "Nửa "))
        loai = [h["loai"] for h in t["hop"]]
        assert 2 <= len(loai) <= 3 and loai == sorted(loai, key=["diem_manh", "luu_y", "loi_khuyen"].index)
        assert "loi_khuyen" in loai
        for h in t["hop"]:
            assert h["nhan"] == {"diem_manh": "Điểm sáng", "luu_y": "Nên để ý", "loi_khuyen": "Nên làm"}[h["loai"]]
            assert h["tieu_de"] and h["noi_dung"] and h["can_cu"] and len(h["tieu_de"]) <= 70
            if h["loai"] == "luu_y":
                assert h["huong_xu_ly"]
        lk = next(h for h in t["hop"] if h["loai"] == "loi_khuyen")
        assert lk["noi_dung"] == t["goi_y"]
        cu = " | ".join(t["can_cu"])
        assert f"Tứ hoá tháng {t['can_chi']}" in cu and "Tứ hoá năm" in cu and t["cung_goc"] in cu
        # điểm sáng / nên để ý trỏ đúng cung của Lộc / Kỵ tháng
        th = {x["hoa"]: x["cung_goc"] for x in t["tu_hoa_thang"]}
        assert t["diem_sang"] == th["Lộc"] and t["de_y"] == th["Kỵ"]


def test_tieu_de_thang_theo_muc_va_tieu_diem():
    r = nh.lap(SINH, dt.date(2026, 3, 1))
    for t in r["thang"]:
        ma = {x["ma"] for x in t["ly_do"]}
        th = {x["hoa"]: x["cung_goc"] for x in t["tu_hoa_thang"]}
        if t["muc"] == "thuan":
            assert t["tieu_diem"] == th["Lộc"]
        elif t["muc"] == "can_than":
            ky_x = next((x["cung"] for x in t["ly_do"] if x["ma"] == "ky_xung_cung_chinh"), None)
            assert t["tieu_diem"] == (ky_x or th["Kỵ"]) and ma & {"chong_ky", "ky_xung_cung_chinh", "ky_nhap_cung_chinh"}
        else:
            assert t["tieu_diem"] == t["cung_goc"]


def test_ba_thang_khong_bao_gio_trung_loi(nhieu_la):
    assert len(nhieu_la) >= 24 * 4
    for r in nhieu_la:
        ts = r["thang"]
        for k in ("tieu_de_thang", "goi_y", "cau_tu_soi"):
            v = [t[k] for t in ts]
            assert len(set(v)) == 3, (k, v, [(t["cung_goc"], t["can_chi"]) for t in ts])
        hop = [tuple((h["tieu_de"], h["noi_dung"]) for h in t["hop"]) for t in ts]
        assert len(set(hop)) == 3


def test_khong_thuat_ngu_khong_cum_cam(nhieu_la):
    cum = dkb.cum_cam()
    for r in nhieu_la:
        for s in _chu_chinh(r):
            assert not THUAT_NGU.search(s), (THUAT_NGU.search(s).group(0), s)
            assert not dkb.tim_cum_cam(s, cum), (dkb.tim_cum_cam(s, cum), s)
            assert not dkb.tim_cum_cam(s, DOA), s
        # can_cu thì được (và phải) có thuật ngữ
        assert any(THUAT_NGU.search(c) for t in r["thang"] for c in t["can_cu"])


def test_co_du_ca_kho(nhieu_la):
    """Bộ mẫu thật sự gồm tháng nhuận nối tiếp, vắt năm, cả ba mức và các luật."""
    muc, ma, noi_tiep, nhuan, vat = set(), set(), 0, 0, 0
    for r in nhieu_la:
        for t in r["thang"]:
            muc.add(t["muc"])
            ma |= {x["ma"] for x in t["ly_do"]}
            noi_tiep += t["noi_tiep"]
            nhuan += t["nhuan"]
            vat += t["nam_am"] != r["luu_nien"]["nam_am"]
    assert muc == {"thuan", "binh", "can_than"}
    assert {"chong_ky", "ky_xung_cung_chinh", "loc_nhap_cung_chinh"} <= ma
    assert noi_tiep and nhuan and vat


def test_thang_nhuan_noi_tiep():
    # 10/7/2025 = tháng 6 → 6 nhuận nửa đầu (cùng cung, cùng can với tháng 6) → nửa sau (như tháng 7).
    r = nh.lap(SINH, dt.date(2025, 7, 10))
    a, b, c = r["thang"]
    assert (a["thang"], a["nhuan"]) == (6, False) and (b["phan"], c["phan"]) == ("nua_dau", "nua_sau")
    assert (a["cung_goc"], a["can_chi"]) == (b["cung_goc"], b["can_chi"])
    assert not a["noi_tiep"] and b["noi_tiep"] and not c["noi_tiep"]
    # QC 2026-10-21 (lỗi 7): nửa sau mang can chi THÁNG SAU → nhãn nói rõ "tính như tháng 7" để can chi đứng cạnh
    # không trông như lỗi; trả `thang_tinh` cho web vẽ nhãn trục riêng hai nửa.
    assert b["nhan_thang"] == "Nửa đầu tháng 6 nhuận"
    assert c["nhan_thang"] == "Nửa sau tháng 6 nhuận (tính như tháng 7)"
    assert (a["thang_tinh"], b["thang_tinh"], c["thang_tinh"]) == (6, 6, 7)
    assert "nửa sau tháng 6 nhuận (tính như tháng 7)" in r["tom_tat_3_thang"]
    assert c["can_chi"] == "Giáp Thân"                             # nửa sau tính như tháng 7 (QC lỗi can chi)
    assert any("tháng 7" in x for x in c["can_cu"])
    assert a["muc"] == b["muc"] and a["ly_do"] == b["ly_do"]       # mức theo luật, không đổi vì lời nối tiếp


def test_cung_thang_trung_han_nam_duoc_neu():
    """Cung tháng trùng cung hạn của năm → câu ưu tiên trong "Nên làm" (lớp cao nhất: đại hạn > lưu niên > tiểu hạn)."""
    gap = 0
    for d in (dt.date(2026, 3, 1), dt.date(2026, 6, 1), dt.date(2026, 9, 1), dt.date(2026, 12, 1)):
        r = nh.lap(SINH, d)
        han = {lop: v["cung_goc"] for lop, v in r["uu_tien"]["han_nam"].items()}
        for t in r["thang"]:
            lop = next((l for l in ("dai_han", "luu_nien", "tieu_han") if han[l] == t["cung_goc"]), None)
            if lop and not t["noi_tiep"]:
                gap += 1
                assert nh._bo_sung(f"trung_{lop}") in t["goi_y"]
    assert gap


def test_tom_tat_ba_thang_neu_du_ba_thang():
    r = nh.lap(SINH, dt.date(2026, 10, 19))
    s = r["tom_tat_3_thang"]
    for t in r["thang"]:
        assert t["tieu_de_thang"][len("Tháng "):] in s
    assert s.startswith("Tháng 9 ") and "tháng 10 " in s and "tháng 11 " in s


def test_kb_nhip_moi_du_va_sach():
    kbn = nh.kb.nhip_lay
    for nhom in ("cung_thang", "loc_dich", "ky_dich", "quyen_dich", "khoa_dich"):
        g = kbn(nhom)
        assert isinstance(g, dict) and g.get("source_id") and g.get("school_id"), nhom
        assert set(CUNG12) <= set(g), nhom
    kx = kbn("ky_xung")
    assert {"Mệnh", "Tài Bạch", "Quan Lộc"} <= set(kx) and kx.get("source_id")
    tu_soi = []
    for c in CUNG12:
        e = kbn("cung_thang", c)
        assert e["nhan"] and e["nhan_ngan"] and len(e["nhan_ngan"]) <= 10 and e["chu_de"]
        assert isinstance(e["tu_soi"], list) and len(e["tu_soi"]) >= 2
        tu_soi += e["tu_soi"]
        for m in ("thuan", "binh", "can_than"):
            assert e["muc"][m]["ket_luan"].startswith("Tháng ") and e["muc"][m]["viec"] and e["muc"][m]["nen_lam"]
        assert kbn("ky_dich", c)["huong_xu_ly"]
    assert len(set(tu_soi)) == len(tu_soi)
    # mọi chuỗi KB mới: không thuật ngữ, không cụm cấm
    cum = dkb.cum_cam()

    def chuoi(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if k not in ("source_id", "school_id"):
                    yield from chuoi(v)
        elif isinstance(x, list):
            for v in x:
                yield from chuoi(v)
    for nhom in ("cung_thang", "loc_dich", "ky_dich", "ky_xung", "quyen_dich", "khoa_dich", "bo_sung"):
        for s in chuoi(kbn(nhom)):                               # khoá dict là tên cung — chỉ soát GIÁ TRỊ
            assert not THUAT_NGU.search(s), s
            assert not dkb.tim_cum_cam(s, cum) and not dkb.tim_cum_cam(s, DOA), s


def test_khong_kb_van_khong_trung(monkeypatch):
    monkeypatch.setattr(pkb, "_d", lambda: {})
    r = nh.lap(SINH, dt.date(2026, 10, 19))
    for k in ("tieu_de_thang", "goi_y", "cau_tu_soi"):
        assert len({t[k] for t in r["thang"]}) == 3, k
    assert r["tom_tat_3_thang"] and all(t["hop"] for t in r["thang"])


def _t(thang: int, muc: str, loc: str | None, ky: str | None = None) -> dict:
    return {"thang": thang, "nhuan": False, "phan": None, "muc": muc, "diem_sang": loc, "de_y": ky,
            "tieu_de_thang": f"Tháng {thang} đều nhịp"}


def test_tom_tat_khi_khong_co_thang_thuan_van_chi_ro_thang_va_mang():
    """Không tháng nào thuận: vẫn nêu tháng nhẹ nhất (ưu tiên Bình hơn Cần thận trọng) + mảng có Lộc tháng —
    không còn câu chung "giữ nhịp đều" giống nhau cho mọi lá."""
    s = nh.tom_tat_ba_thang([_t(9, "can_than", "Tài Bạch"), _t(10, "binh", "Quan Lộc"), _t(11, "binh", "Mệnh")])
    assert "tháng 10" in s and "công việc" in s
    assert "giữ nhịp đều, làm chắc việc đang có" not in s
    # cả ba tháng cần thận trọng → vẫn chọn tháng đầu có Lộc tháng, câu khác hẳn
    s2 = nh.tom_tat_ba_thang([_t(9, "can_than", None), _t(10, "can_than", "Điền Trạch"), _t(11, "can_than", "Mệnh")])
    assert "tháng 10" in s2 and "nhà cửa" in s2 and s2 != s


def test_tom_tat_khong_thuan_khac_nhau_giua_cac_lua_chon():
    a = nh.tom_tat_ba_thang([_t(9, "binh", "Phu Thê"), _t(10, "binh", "Tài Bạch"), _t(11, "binh", "Mệnh")])
    b = nh.tom_tat_ba_thang([_t(9, "binh", "Nô Bộc"), _t(10, "binh", "Tài Bạch"), _t(11, "binh", "Mệnh")])
    assert a.split(". ")[-1] != b.split(". ")[-1]


def test_nhan_thang_nhuan_hai_nua():
    """QC 2026-10-21 (lỗi 7): nhãn tháng (engine nhịp + hỏi đáp) phân biệt hai nửa tháng nhuận và nói rõ nửa sau tính
    như tháng sau — can chi in cạnh là của tháng sau."""
    from app.hoidap.tuvi import _ten_thang
    t = {"thang": 6, "nhuan": True, "phan": "nua_sau", "can_chi": "Giáp Thân"}
    assert nh.nhan_thang(t) == "nửa sau tháng 6 nhuận (tính như tháng 7)"
    assert _ten_thang(t) == "nửa sau tháng 6 nhuận âm (tính như tháng 7, Giáp Thân)"
    t0 = {**t, "phan": "nua_dau", "can_chi": "Quý Mùi"}
    assert nh.nhan_thang(t0) == "nửa đầu tháng 6 nhuận" and _ten_thang(t0) == "nửa đầu tháng 6 nhuận âm (Quý Mùi)"
    t12 = {"thang": 12, "nhuan": True, "phan": "nua_sau", "can_chi": "Giáp Dần"}
    assert nh.nhan_thang(t12) == "nửa sau tháng 12 nhuận (tính như tháng 1 năm sau)"
    assert _ten_thang({"thang": 9, "nhuan": False, "phan": "ca_thang", "can_chi": "Mậu Tuất"}) == \
        "tháng 9 âm (Mậu Tuất)"
