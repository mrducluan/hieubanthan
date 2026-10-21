# -*- coding: utf-8 -*-
"""TV-V2 — RULES phi tinh tứ hoá (luangiai/tuvi_phi_hoa.py). Viết TRƯỚC hàm.
Chạy được cả khi KB `tuvi_phi_hoa_kb.json` chưa có (rơi về câu mặc định)."""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import lunar, tuvi_an_sao as az, tuvi_phi_hoa as ph
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_phi_hoa_kb as pkb
from app.luangiai import tuvi_phi_hoa as luan

TU_DOA = ("báo động", "tử thần", "phá sản", "tai nạn", "bệnh", "chết", "tuyệt đối")


@pytest.fixture(scope="module")
def ls():
    return tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), 1, "nam", "vi-VN"))   # Canh Ngọ


def _chuoi(x) -> list[str]:
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        return [s for v in x.values() for s in _chuoi(v)]
    if isinstance(x, list):
        return [s for v in x for s in _chuoi(v)]
    return []


def test_lap_cau_truc(ls):
    r = luan.lap(ls, "Canh")
    assert r["can_nam_sinh"] == "Canh"
    assert r["lai_nhan"]["chi"] == ph.lai_nhan("Canh")
    assert r["lai_nhan"]["can"] == "Canh"
    assert len(r["cung"]) == 12 and sum(c["la_lai_nhan"] for c in r["cung"]) == 1
    assert sum(c["la_menh"] for c in r["cung"]) == 1
    assert set(r["cung"][0]) == {"ten", "chi", "can", "la_menh", "la_lai_nhan"}
    assert len(r["duong_bay"]) == 48
    assert all(x["nghia"] for x in r["duong_bay"])
    assert r["tu_hoa"] == [x for x in r["duong_bay"] if x["tu_hoa"]]
    assert r["vao_menh"] == [x for x in r["duong_bay"] if x["den_cung"] == "Mệnh"]
    assert 0 < len(r["noi_bat"]) <= 8
    for nb in r["noi_bat"]:
        assert nb["loai"] in ("ky_xung", "loc_nhap", "tu_hoa", "mau")
        for k in ("tieu_de", "nghia", "viec_nen_lam", "cau_tu_soi"):
            assert nb[k], k
        assert nb["duong"] in r["duong_bay"]
        if nb["duong"]["den_tuan_triet"]:
            assert nb["ghi_chu_tuan_triet"]
        else:
            assert nb["ghi_chu_tuan_triet"] is None
    # mỗi đường bay chỉ nổi bật một lần
    khoa = [(nb["duong"]["tu_cung"], nb["duong"]["hoa"]) for nb in r["noi_bat"]]
    assert len(khoa) == len(set(khoa))
    assert "luu_nien" not in r or r["luu_nien"] is None
    assert r["phai"]["ten"] == "Phi tinh tứ hoá"
    assert r["trang_thai"] == "nhap_ai"
    assert r["luu_y"]


def test_noi_bat_dung_luat(ls):
    r = luan.lap(ls, "Canh")
    for nb in r["noi_bat"]:
        d = nb["duong"]
        if nb["loai"] == "ky_xung":
            assert d["hoa"] == "Kỵ" and d["xung_cung"] in luan.CUNG_CHINH and not d["tu_hoa"]
        if nb["loai"] == "loc_nhap":
            assert d["hoa"] == "Lộc" and d["den_cung"] in luan.CUNG_LOC and not d["tu_hoa"]
        if nb["loai"] == "tu_hoa":
            assert d["tu_hoa"]


def test_luu_nien(ls):
    r = luan.lap(ls, "Canh", nam_xem=2026)
    can, chi = lunar.can_chi_nam(2026)
    assert r["luu_nien"]["nam"] == 2026 and r["luu_nien"]["can_chi"] == f"{can} {chi}" == "Bính Ngọ"
    kq = ph.phi_tu_can("Bính", ls["cung"])
    assert [(h["hoa"], h["sao"], h["den_cung"], h["xung_cung"]) for h in r["luu_nien"]["hoa"]] == \
        [(h["hoa"], h["sao"], h["den_cung"], h["xung_cung"]) for h in kq]


def test_khong_doa(ls):
    r = luan.lap(ls, "Canh", nam_xem=2026)
    for s in _chuoi(r):
        for tu in TU_DOA:
            assert tu not in s.lower(), (tu, s)


def test_khong_kb_van_chay(ls, monkeypatch):
    monkeypatch.setattr(pkb, "_d", lambda: {})
    r = luan.lap(ls, "Canh", nam_xem=2026)
    assert len(r["duong_bay"]) == 48 and all(x["nghia"] for x in r["duong_bay"])
    for nb in r["noi_bat"]:
        assert nb["tieu_de"] and nb["viec_nen_lam"] and nb["cau_tu_soi"]


def test_mau_kb_khop(ls, monkeypatch):
    duong = ph.phi_hoa(ls["cung"])
    d0 = next(x for x in duong if x["hoa"] == "Kỵ")
    mau = {"mau_duong_bay": [
        {"ma": "thu", "tu_cung": d0["tu_cung"], "hoa": "Kỵ", "den_cung": d0["den_cung"] if not d0["tu_hoa"] else "tu",
         "tieu_de": "Mẫu thử", "nghia": "Nghĩa {tu_cung}", "viec_nen_lam": "Làm chậm", "cau_tu_soi": "Hỏi mình?",
         "source_id": "s", "school_id": "phi_tinh"},
        {"ma": "sao", "tu_cung": "*", "hoa": "Lộc", "den_cung": "*", "tieu_de": "Mọi Lộc", "nghia": "x",
         "viec_nen_lam": "y", "cau_tu_soi": "z", "source_id": "s", "school_id": "phi_tinh"}]}
    monkeypatch.setattr(pkb, "_d", lambda: mau)
    r = luan.lap(ls, "Canh")
    assert r["noi_bat"][0]["loai"] == "mau" and r["noi_bat"][0]["tieu_de"] == "Mẫu thử"
    assert r["noi_bat"][0]["duong"]["tu_cung"] == d0["tu_cung"]
    assert r["noi_bat"][0]["nghia"] == f"Nghĩa {d0['tu_cung']}"
    assert len(r["noi_bat"]) <= 8
    assert sum(nb["tieu_de"] == "Mọi Lộc" for nb in r["noi_bat"]) == 1      # mẫu "*" dùng một lần


def test_kb_that_khong_lap_tieu_de(ls):
    r = luan.lap(ls, "Canh")
    td = [nb["tieu_de"] for nb in r["noi_bat"] if nb["loai"] == "mau"]
    assert len(td) == len(set(td)) and len(td) <= luan.TOI_DA_MAU


def test_ky_xung_ve_chinh_cung_khong_lap_ten():
    """QC TV-V2: Kỵ bay vào cung đối diện nên chiếu NGƯỢC về chính cung phát — tiêu đề/việc nên làm không được
    thành "chiếu sang Tài Bạch ... việc của cung Tài Bạch với việc của cung Tài Bạch"."""
    d = {"tu_cung": "Tài Bạch", "can": "Ất", "hoa": "Kỵ", "sao": "Thái Âm", "den_cung": "Phúc Đức",
         "xung_cung": "Tài Bạch", "tu_hoa": False, "den_tuan_triet": []}
    n = luan._noi_bat("ky_xung", {**d, "nghia": luan.nghia_duong(d)})
    assert n["tieu_de"] == "Tiền bạc vòng qua đời sống tinh thần rồi quay về"
    assert "quay lại làm chuyện tiền bạc thêm rối" in n["nghia"]
    assert "chuyện tiền bạc với" not in n["viec_nen_lam"]
    assert n["can_cu"][0] == "Hoá Kỵ (Thái Âm, can Ất) từ cung Tài Bạch vào Phúc Đức, chiếu Tài Bạch"
    assert not any(t in s.lower() for s in _chuoi(n) for t in TU_DOA)


def test_kb_nhip_ly_do_khong_gan_sao_thang_cho_ky_nam():
    """QC TV-V2: câu chong_ky/song_loc đúng cả khi Kỵ (Lộc) năm và tháng là HAI sao khác nhau / ở cung xung."""
    for ma in ("chong_ky", "song_loc"):
        s = pkb.nhip("ly_do", ma)
        if isinstance(s, str):
            assert "của tháng (sao {sao})" in s


def test_ky_xung_nghia_theo_cung_xung_khong_theo_cung_dich():
    """Hồi quy LG-ĐS: "Hoá Kỵ từ Tật Ách chiếu sang Quan Lộc" từng đi kèm câu của cung ĐÍCH Phu Thê
    ("đưa điều vướng vào quan hệ đôi lứa"). Nghĩa của luật ky_xung phải nói về cung bị xung (Quan Lộc)."""
    d = {"tu_cung": "Tật Ách", "can": "Giáp", "hoa": "Kỵ", "sao": "Thái Dương", "den_cung": "Phu Thê",
         "xung_cung": "Quan Lộc", "tu_hoa": False, "den_tuan_triet": []}
    n = luan._noi_bat("ky_xung", {**d, "nghia": luan.nghia_duong(d)})
    assert n["tieu_de"] == "Sức khoẻ kéo bận tâm sang công việc"
    assert pkb.ky_chieu("Quan Lộc").replace("{chu_tu}", "chuyện sức khoẻ") in n["nghia"]   # nói cả mảng bị chiếu
    assert "chiếu Quan Lộc" in n["can_cu"][0]
    assert n["ma_mau"] is None


def test_noi_bat_co_ma_mau(ls):
    r = luan.lap(ls, "Canh")
    for nb in r["noi_bat"]:
        assert "ma_mau" in nb
        if nb["loai"] == "mau":
            assert nb["ma_mau"] in {m["ma"] for m in pkb.mau_duong_bay()}
        else:
            assert nb["ma_mau"] is None
    # lá 1990-05-15 giờ Thìn (Canh Ngọ): Kỵ Tật Ách → Phu Thê, xung Quan Lộc
    ls2 = tom_tat(az.an_sao_tho(dt.date(1990, 5, 15), 4, "nam", "vi-VN"))
    nb = next(n for n in luan.lap(ls2, "Canh")["noi_bat"] if n["duong"]["tu_cung"] == "Tật Ách" and n["duong"]["hoa"] == "Kỵ")
    assert nb["duong"]["xung_cung"] == "Quan Lộc" and "ở chỗ làm bạn cũng khó tập trung" in nb["nghia"]


# ------------------------------------------------------------------ rà chung chung đợt 2 (docs/LUAN-GIAI-DOI-SONG.md mục 7)
import re  # noqa: E402

THUAT_NGU = re.compile(r"(?<!\w)[Hh]o[áa] (?:Lộc|Quyền|Khoa|Kỵ)|(?<!\w)tự ho[áa]|(?<!\w)[Cc]an [A-ZĐ]|(?<!\w)cung [A-ZĐ]|"
                       r"(?<!\w)(?:Kỵ|Lộc|Quyền|Khoa)(?!\w)|Phái|phi tinh|chiếu|"
                       + "|".join(luan.MANG) + "|" + "|".join(("Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc",
                                                              "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
                                                              "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương",
                                                              "Thất Sát", "Phá Quân")))


def _duong(tu, hoa, den, xung=None, tu_hoa=False):
    return {"tu_cung": tu, "can": "Giáp", "hoa": hoa, "sao": "Thái Dương", "den_cung": den, "xung_cung": xung,
            "tu_hoa": tu_hoa, "den_tuan_triet": []}


def test_loi_nguoi_doc_khong_thuat_ngu_moi_duong_bay():
    """Mọi cặp cung phát → cung đích × 4 hoá: tiêu đề, nghĩa, việc nên làm, tự soi không lộ tên cung / sao / hoá
    (tên ấy chỉ ở `can_cu`)."""
    cung = list(luan.MANG)
    doi = {c: cung[(i + 6) % 12] for i, c in enumerate(cung)}
    for tu in cung:
        for den in cung:
            for hoa in ("Lộc", "Quyền", "Khoa", "Kỵ"):
                d = _duong(tu, hoa, den, doi[den], tu_hoa=tu == den)
                loai = "tu_hoa" if tu == den else "ky_xung" if hoa == "Kỵ" else "loc_nhap"
                n = luan._noi_bat(loai, {**d, "nghia": luan.nghia_duong(d)})
                for k in ("tieu_de", "nghia", "viec_nen_lam", "cau_tu_soi"):
                    assert not THUAT_NGU.search(n[k]), (tu, hoa, den, k, n[k])
                    assert "{" not in n[k], n[k]
                assert n["can_cu"] and n["can_cu"][0].startswith(("Hoá ", "Cung "))


def test_mau_sao_o_cung_phat_noi_theo_cap_mang():
    """Hai mẫu "*" (Khoa vào Phụ Mẫu, Kỵ vào Thiên Di) từng ra MỘT câu cho mọi lá — nay mỗi cung phát một lời,
    giữ nguyên mã mẫu."""
    mau = {m["ma"]: m for m in pkb.mau_duong_bay()}
    for ma, hoa, den in (("khoa_vao_phu_mau", "Khoa", "Phụ Mẫu"), ("ky_xung_menh", "Kỵ", "Thiên Di")):
        loi = set()
        for tu in luan.MANG:
            if tu == den:
                continue
            xung = "Tật Ách" if den == "Phụ Mẫu" else "Mệnh"
            d = _duong(tu, hoa, den, xung)
            n = luan._noi_bat("mau", {**d, "nghia": luan.nghia_duong(d)}, mau[ma])
            assert n["ma_mau"] == ma
            loi.add((n["tieu_de"], n["nghia"], n["viec_nen_lam"]))
            assert not any(THUAT_NGU.search(n[k]) for k in ("tieu_de", "nghia", "viec_nen_lam")), n
        assert len({x[0] for x in loi}) == len({x[1] for x in loi}) == len({x[2] for x in loi}) == 11, ma


def test_kb_phi_hoa_khong_cum_cam_chung_chung():
    from app.kb import tuvi_doi_song_kb as kds
    cum, cam = kds.cum_chung_chung(), kds.cum_cam()
    d = pkb._d()

    def chuoi(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if k not in ("source_id", "school_id", "_ghi_chu", "can_cu"):
                    yield from chuoi(v)
        elif isinstance(x, list):
            for v in x:
                yield from chuoi(v)
    for khoa in ("phi_vao_cung", "ky_chieu", "tu_hoa_cung", "mau_duong_bay"):
        for s in chuoi(d[khoa]):
            assert not kds.tim_cum_cam(s, cum) and not kds.tim_cum_cam(s, cam), (khoa, s)
    for h, ds in d["phi_vao_cung"].items():
        if h.startswith("_"):
            continue
        for c, m in ds.items():
            assert m["source_id"] and m["school_id"] and m["y"] and m["viec_nen_lam"], (h, c)
