# -*- coding: utf-8 -*-
"""BT-ĐS — Luận giải Bát tự "đời sống" (`luangiai/battu_doi_song.py`, `docs/LUAN-GIAI-DOI-SONG.md` mục 6).

Viết TRƯỚC hàm: hợp đồng JSON (cùng khung `doi_song_1` với Tử vi), chấm mảng đời trên lá đã tính tay, đại vận theo
HAI cách (không tự chọn), lời văn (không thuật ngữ ngoài "Vì sao nói vậy", không cụm cấm, không doạ, sức khoẻ có miễn
trừ + không tên bệnh), không lặp câu giữa các chương, hai lá khác hẳn ra lời khác hẳn, mã mẫu, tầng HỌC
(trong_so / ca_nhan), golden ≥ 10 lá (`fixtures/golden/battu_doi_song.json`).
"""
from __future__ import annotations

import collections
import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.kb import battu_doi_song_kb as kb
from app.kb import tuvi_doi_song_kb as kb_tv
from app.luangiai import battu_doi_song as bt
from app.luangiai import toan_bo
from app.main import app
from app.narrative import hoi_van

# Hồ sơ mẫu e2e (web/e2e/_hoso.ts): Canh Ngọ · Tân Tỵ · Nhâm Ngọ · Bính Ngọ, nhật chủ Nhâm, thân nhược 0,4, Thiên Tài cách
SINH = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}
XEM = dt.date(2026, 10, 21)
THU_TU = ["tong_quan", "ngu_hanh", "cuoc_doi", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "hoc_tap", "suc_khoe",
          "quan_he", "nam_nay", "loi_khuyen"]
LOAI_HOP = {"cot_loi", "diem_manh", "luu_y", "loi_khuyen", "thoi_diem"}
MUC = {"thuan", "can_bang", "can_chu_dong"}
_CAN = r"Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý"
_CHI = r"Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi"
# Thuật ngữ Bát tự chỉ được ở `can_cu` ("Vì sao nói vậy"). Tên ngũ hành (Kim, Mộc…) là chữ phổ thông — được dùng.
THUAT_NGU = re.compile(
    r"Tỷ Kiên|Kiếp Tài|Thực Thần|Thương Quan|Thiên Tài|Chính Tài|Thất Sát|Chính Quan|Thiên Ấn|Chính Ấn|"
    r"[Nn]hật chủ|[Dd]ụng thần|[Hh]ỷ thần|[Kk]ỵ thần|[Tt]hân vượng|[Tt]hân nhược|[Đđ]ại vận|[Ll]ưu niên|[Nn]guyệt lệnh|"
    r"[Tt]àng can|[Tt]hần sát|[Cc]ách cục|[Pp]hù ức|[Đđ]iều hậu|[Tt]hập thần|"
    rf"(?<!\w)(?:{_CAN}) (?:{_CHI})(?!\w)")
DOA = ["chắc chắn", "định mệnh", "số phận", "tai hoạ", "tai họa", "xui xẻo", "khắc", "phá sản", "ly hôn", "chết",
       "tai nạn", "hạn nặng", "vận xấu", "năm xấu"]
BENH = ["bệnh", "ung thư", "tiểu đường", "huyết áp", "đột quỵ", "viêm", "khối u", "sẽ bị", "bạn có bị", "trầm cảm",
        "suy thận", "xơ gan", "suy tim"]
_GF = Path(__file__).parents[1] / "fixtures" / "golden" / "battu_doi_song.json"
_G = json.loads(_GF.read_text("utf-8"))["cases"]


def _sinh(ca: dict) -> dict:
    return {"lich": dt.datetime.fromisoformat(ca["lich"]), "gioi_tinh": ca["gioi_tinh"],
            "gio_ty": ca.get("gio_ty", "da_ty")}


@pytest.fixture(scope="module")
def bc():
    return toan_bo.battu(SINH, ngay_xem=XEM)


def _hop_chuong(b: dict) -> list[dict]:
    return [h for c in b["chuong"] for h in c["hop"]]


def _chu(b: dict) -> list[str]:
    """Mọi chữ người dùng đọc ở thân bài (không gồm can_cu kỹ thuật)."""
    ra = []
    for c in b["chuong"]:
        ra += [c["tom_tat"], *c["doan"], c.get("cau_tu_soi") or ""]
        for h in c["hop"]:
            ra += [h["tieu_de"], h["noi_dung"], h.get("huong_xu_ly", "")]
    for h in b["cot_loi"]:
        ra += [h["tieu_de"], h["noi_dung"]]
    ra += [g["mot_cau"] for g in b["thoi_gian_bieu"]] + [g["chu_de"] for g in b["thoi_gian_bieu"]]
    return [s for s in ra if s]


def _cac_cau(s: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+", s or "") if c.strip()]


# ------------------------------------------------------------------ hợp đồng
def test_hop_dong(bc):
    assert bc["mo_dun"] == "battu" and bc["phien_ban"] == "doi_song_1"
    assert bc["trang_thai"] == "nhap_ai" and bc["ket"] == hoi_van.KET and bc["phi"] == toan_bo.PHI
    assert [c["ma"] for c in bc["chuong"]] == THU_TU == [m for m, _, _ in toan_bo.CHUONG_BATTU]
    assert bc["school_id"] == "tu_binh" and bc["source_id"]
    for c in bc["chuong"]:
        for k in ("ma", "tieu_de", "cau_hoi", "muc", "nhan_muc", "tom_tat", "hop", "doan", "can_cu", "cau_tu_soi",
                  "moi_xem"):
            assert k in c, (c["ma"], k)
        assert c["muc"] in MUC and c["nhan_muc"] == kb.nhan_muc(c["muc"])
        assert 1 <= len(c["doan"]) <= 4 and all(isinstance(d, str) and d for d in c["doan"])
        assert 2 <= len(c["hop"]) <= 6, c["ma"]
        for h in c["hop"]:
            assert h["loai"] in LOAI_HOP - {"cot_loi"}
            assert 0 < len(h["tieu_de"]) <= 60 and h["noi_dung"] and isinstance(h["can_cu"], list)
            assert bt.MA_MAU_RE.match(h["ma_mau"]) and h["ma_mau"].startswith(f"ds.bt.{c['ma']}."), h["ma_mau"]
            assert not any(k.startswith("_") for k in h)
            if h["loai"] == "luu_y":                       # mỗi lưu ý kèm hướng xử lý, nằm ngay trong hộp
                assert h["huong_xu_ly"] and h["huong_xu_ly"] in h["noi_dung"]
    assert 3 <= len(bc["cot_loi"]) <= 5
    assert {"diem_manh", "luu_y"} <= {h["loai_goc"] for h in bc["cot_loi"]}
    assert {h["ma_mau"] for h in bc["cot_loi"]} <= {h["ma_mau"] for h in _hop_chuong(bc)}
    # mã kiểm chứng đi qua được ràng buộc DB hiện có (0017: loai 'doi_song', mã ^ds\.…) — không cần migration mới
    assert all(re.match(r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$", h["ma_mau"]) for h in _hop_chuong(bc))


def test_ma_mau_duy_nhat(bc):
    ma = [h["ma_mau"] for h in _hop_chuong(bc)]
    assert len(ma) == len(set(ma))


def test_tat_dinh():
    a = toan_bo.battu(SINH, ngay_xem=XEM)
    b = toan_bo.battu(SINH, ngay_xem=XEM)
    assert json.dumps(a, ensure_ascii=False, sort_keys=True) == json.dumps(b, ensure_ascii=False, sort_keys=True)


# ------------------------------------------------------------------ chấm mảng (tính tay trên lá mẫu)
def test_phan_tich_la_mau():
    pt = bt.phan_tich(bt._la_so(SINH))
    # điểm ngũ hành (THANG_DIEM): Kim 2,6 · Mộc 0 · Thủy 1 · Hỏa 4,3 · Thổ 1,1 — tổng 9; nhật chủ Thủy
    assert pt["nhom_hanh"] == {"Tỷ Kiếp": "Thủy", "Ấn": "Kim", "Thực Thương": "Mộc", "Tài": "Hỏa", "Quan Sát": "Thổ"}
    assert {g: round(v, 3) for g, v in pt["ty_le"].items()} == {
        "Tỷ Kiếp": 0.111, "Ấn": 0.289, "Thực Thương": 0.0, "Tài": 0.478, "Quan Sát": 0.122}
    assert pt["muc_do"] == {"Tỷ Kiếp": "mong", "Ấn": "vua", "Thực Thương": "vang", "Tài": "dam", "Quan Sát": "vua"}
    assert pt["than"] == "yeu"
    assert pt["cach_1"]["hanh"] == ["Kim", "Thủy"] and pt["cach_1"]["ky"] == ["Mộc", "Hỏa", "Thổ"]
    # Thiên Tài cách, thân nhược → theo KB: hỷ Ấn (Kim), kỵ Tỷ Kiếp (Thủy)
    assert pt["cach_2"]["ma"] == "thien_tai" and pt["cach_2"]["hanh"] == ["Kim"] and pt["cach_2"]["ky"] == ["Thủy"]


def test_cham_mang_la_mau():
    cm = bt.cham_mang(bt.phan_tich(bt._la_so(SINH)))
    muc = {k: v["muc"] for k, v in cm.items()}
    # su_nghiep: có Quan Sát +1, Quan + Ấn (quan ấn tương sinh) +1 = 2 → thuận
    # tien_bac: có Tài +1, Tài đậm mà là hành kỵ −1 = 0 → cân bằng
    # tinh_cam (nam → Tài): +1 −1, chi ngày Ngọ tự hình với năm/giờ −1 = −1 → cần chủ động
    # gia_dinh: có Ấn +1, Ấn là hành hỷ +1, Tài đậm phá Ấn −1 = 1 → cân bằng
    # hoc_tap: có Ấn +1, Thái Cực Quý Nhân +1 = 2 → thuận
    # quan_he: Thiên Ất Quý Nhân +1, Vong Thần −1 = 0 → cân bằng
    # suc_khoe: thiếu Mộc, Hỏa chiếm 48% (≥ 45%) → cần chủ động
    # tong_quan: hành hỷ Kim có mặt rõ +1, ≥ 2 sao cát +1 = 2 → thuận
    # ngu_hanh: cách 1 có Kim rõ +1, điều hậu cần Thủy chỉ 11% → 0 = 1 → cân bằng
    assert muc == {"su_nghiep": "thuan", "tien_bac": "can_bang", "tinh_cam": "can_chu_dong", "gia_dinh": "can_bang",
                   "hoc_tap": "thuan", "quan_he": "can_bang", "suc_khoe": "can_chu_dong", "tong_quan": "thuan",
                   "ngu_hanh": "can_bang"}
    assert all(v["can_cu"] for v in cm.values())


def test_dai_van_hai_cach(bc):
    tgb = bc["thoi_gian_bieu"]
    assert [g["cung"] for g in tgb] == ["Nhâm Ngọ", "Quý Mùi", "Giáp Thân", "Ất Dậu", "Bính Tuất", "Đinh Hợi",
                                        "Mậu Tý", "Kỷ Sửu"]
    # can 1 điểm, chi (bản khí) 2 điểm: hành hỷ +, hành kỵ −. Cách 1 hỷ Kim Thủy / kỵ Mộc Hỏa Thổ; cách 2 hỷ Kim / kỵ Thủy
    assert [(g["muc_cach_1"], g["muc_cach_2"]) for g in tgb] == [
        ("can_chu_dong", "can_chu_dong"), ("can_chu_dong", "can_chu_dong"), ("thuan", "thuan"), ("thuan", "thuan"),
        ("can_chu_dong", "can_bang"), ("thuan", "can_chu_dong"), ("thuan", "can_chu_dong"),
        ("can_chu_dong", "can_bang")]
    assert [g["muc"] for g in tgb] == ["can_chu_dong", "can_chu_dong", "thuan", "thuan", "can_chu_dong", "can_bang",
                                       "can_bang", "can_chu_dong"]
    assert [g["hai_cach_khac"] for g in tgb] == [False, False, False, False, True, True, True, True]
    for g in tgb:
        if g["hai_cach_khac"]:
            assert "Hai cách đọc" in g["mot_cau"], g["mot_cau"]
        assert g["den_tuoi"] == g["tu_tuoi"] + 9 and g["nam_den"] == g["nam_tu"] + 9 and g["nhan"]
    ht = [g for g in tgb if g["hien_tai"]]
    assert len(ht) == 1 and ht[0]["cung"] == "Ất Dậu" and ht[0]["nam_tu"] == 2026


def test_nam_nay_uu_tien_va_thang_tiet(bc):
    nn = next(c for c in bc["chuong"] if c["ma"] == "nam_nay")
    ma = [h["ma_mau"] for h in nn["hop"]]
    assert ma[0].startswith("ds.bt.nam_nay.van.") and ma[1].startswith("ds.bt.nam_nay.nam.")    # vận trước năm
    thang = [h for h in nn["hop"] if ".thang" in h["ma_mau"]]
    # 21/10/2026 nằm trong tháng tiết Hàn lộ (Mậu Tuất) → Tuất, Hợi, Tý
    assert len(thang) == 3 and all(h["loai"] == "thoi_diem" and h["tu"] and h["den"] for h in thang)
    assert thang[0]["tu"] <= XEM.isoformat() <= thang[0]["den"]
    assert all(a["den"] < b["tu"] for a, b in zip(thang, thang[1:]))
    cu = " | ".join(nn["can_cu"])
    assert "Mậu Tuất" in cu and "Kỷ Hợi" in cu and "Canh Tý" in cu
    assert "Ưu tiên: đại vận > lưu niên > lưu nguyệt" in nn["can_cu"]
    assert any("tự hình" in c for c in nn["can_cu"])       # Bính Ngọ năm 2026 với chi ngày Ngọ


# ------------------------------------------------------------------ dụng thần hai cách
def test_ngu_hanh_hai_cach_khong_tu_chon(bc):
    nh = next(c for c in bc["chuong"] if c["ma"] == "ngu_hanh")
    hc = nh["hai_cach"]
    assert hc["chon"] is None and hc["cach_1"]["hanh"] == ["Kim", "Thủy"] and hc["cach_2"]["hanh"] == ["Kim"]
    ma = [h["ma_mau"] for h in nh["hop"]]
    assert any(".cach1." in m for m in ma) and any(".cach2." in m for m in ma)
    cu = " | ".join(nh["can_cu"])
    assert "phù ức" in cu and "Tử Bình Chân Thuyên" in cu and "không tự chọn" in cu
    bd = nh["bieu_do"]
    assert [x["hanh"] for x in bd["hanh"]] == ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"]
    assert abs(sum(x["ty_le"] for x in bd["hanh"]) - 1) < 0.01
    kim = next(x for x in bd["hanh"] if x["hanh"] == "Kim")
    assert kim["cach_1"] and kim["cach_2"] and kim["diem"] == 2.6
    moc = next(x for x in bd["hanh"] if x["hanh"] == "Mộc")
    assert moc["trang_thai"] == "thieu" and not moc["cach_1"]
    tq = next(c for c in bc["chuong"] if c["ma"] == "tong_quan")
    assert tq["than_do"] == {"ti_le": 0.4, "vuong_tu": 0.55, "nhuoc_duoi": 0.45, "muc": "yeu",
                             "nhan": kb.nhan_than("yeu")}


def test_hai_cach_trung_nhau_gop_mot_hop():
    for ca in _G:
        b = toan_bo.battu(_sinh(ca), ngay_xem=dt.date.fromisoformat(ca["ngay_xem"]))
        nh = next(c for c in b["chuong"] if c["ma"] == "ngu_hanh")
        h1, h2 = nh["hai_cach"]["cach_1"]["hanh"], nh["hai_cach"]["cach_2"]["hanh"]
        ma = [h["ma_mau"] for h in nh["hop"]]
        if h1 and set(h1) == set(h2):
            assert any(".hai_cach." in m for m in ma) and not any(".cach1." in m for m in ma)
        else:
            assert any(".cach1." in m for m in ma) and any(".cach2." in m for m in ma), ca["id"]


# ------------------------------------------------------------------ lời văn
def test_khong_thuat_ngu_ngoai_can_cu(bc):
    for s in _chu(bc):
        assert not THUAT_NGU.search(s), (THUAT_NGU.search(s).group(0), s)


def test_khong_cum_cam_khong_doa(bc):
    cum = kb.cum_cam()
    assert set(kb_tv.cum_cam()) <= set(cum)                # dùng chung danh sách "giọng AI" với Tử vi
    for s in _chu(bc):
        assert not kb_tv.tim_cum_cam(s, cum), (kb_tv.tim_cum_cam(s, cum), s)
        assert not kb_tv.tim_cum_cam(s, DOA), s
        assert not any(c in s.lower() for c in hoi_van.CAM), s


def test_suc_khoe_mien_tru_khong_ten_benh(bc):
    sk = next(c for c in bc["chuong"] if c["ma"] == "suc_khoe")
    assert kb.suc_khoe_chung() in sk["doan"] and sk["mien_tru"] == kb.suc_khoe_chung()
    assert "không thay lời bác sĩ" in sk["mien_tru"]
    chu = " ".join([sk["tom_tat"], *sk["doan"], *(h["noi_dung"] for h in sk["hop"])]).lower()
    for b in BENH:
        assert b not in chu, b
    assert re.search(r"khám (sức khoẻ )?định kỳ", chu)
    assert not re.search(r"(năm|tuổi) \d+.{0,20}(ốm|đau)", chu)


def test_khong_lap_cau_giua_cac_chuong(bc):
    """Câu trong hộp của một chương không lặp ở chương khác (trừ chương tổng hợp "Lời khuyên"); thân bài không chép
    lại hộp cùng chương."""
    gap: dict[str, str] = {}
    for c in bc["chuong"]:
        if c["ma"] == "loi_khuyen":
            continue
        cau_hop = set()
        for h in c["hop"]:
            for x in _cac_cau(h["noi_dung"]):
                assert x not in gap or gap[x] == c["ma"], (x, gap.get(x), c["ma"])
                gap[x] = c["ma"]
                cau_hop.add(x)
        for d in c["doan"]:
            for x in _cac_cau(d):
                assert x not in cau_hop, (c["ma"], x)
    tom = [c["tom_tat"] for c in bc["chuong"]]
    assert len(tom) == len(set(tom))


def test_hai_la_khac_han_ra_loi_khac_han(bc):
    """Lá mẫu (Nhâm, thân yếu, Tài nặng) vs lá Canh thân mạnh (Dương Nhận cách): ít câu chung."""
    khac = toan_bo.battu({"lich": dt.datetime(1960, 9, 9, 10, 10), "gioi_tinh": "nam"}, ngay_xem=XEM)

    def cau(b):
        return {x for h in _hop_chuong(b) if h["loai"] in ("diem_manh", "luu_y") for x in _cac_cau(h["noi_dung"])}

    a, b = cau(bc), cau(khac)
    assert len(a & b) / min(len(a), len(b)) < 0.25, a & b
    tq_a = next(c for c in bc["chuong"] if c["ma"] == "tong_quan")["tom_tat"]
    tq_b = next(c for c in khac["chuong"] if c["ma"] == "tong_quan")["tom_tat"]
    assert tq_a != tq_b


def test_khong_cau_barnum_tren_golden():
    """Hộp điểm mạnh / lưu ý nào xuất hiện ở > 70% lá golden là câu ai đọc cũng thấy đúng → cấm."""
    dem: collections.Counter = collections.Counter()
    for ca in _G:
        b = toan_bo.battu(_sinh(ca), ngay_xem=dt.date.fromisoformat(ca["ngay_xem"]))
        dem.update({h["noi_dung"] for h in _hop_chuong(b) if h["loai"] in ("diem_manh", "luu_y")})
    tran = 0.7 * len(_G)
    assert not [(n, s) for s, n in dem.items() if n > tran]


def test_moi_xem_va_cau_hoi_mo(bc):
    for c in bc["chuong"]:
        m = c["moi_xem"]
        assert ("battu", c["ma"]) in toan_bo.CAU_HOI_MO
        assert m["cau_hoi"].endswith("?") and any(d.startswith(m["diem_nhan"].rstrip("…")) for d in c["doan"])
        assert not kb_tv.tim_cum_cam(m["cau_hoi"], DOA)


# ------------------------------------------------------------------ dạ Tý + phái giờ Tý
def test_da_ty_va_doi_ngay():
    sinh = {"lich": dt.datetime(1978, 2, 20, 23, 40), "gioi_tinh": "nam"}
    a = toan_bo.battu(sinh, ngay_xem=XEM)
    b = toan_bo.battu({**sinh, "gio_ty": "sang_ngay"}, ngay_xem=XEM)
    cu_a = " | ".join(next(c for c in a["chuong"] if c["ma"] == "tong_quan")["can_cu"])
    cu_b = " | ".join(next(c for c in b["chuong"] if c["ma"] == "tong_quan")["can_cu"])
    assert "Nhật chủ Quý" in cu_a and "Nhật chủ Giáp" in cu_b            # đổi ngày → nhật chủ đổi
    assert any("dạ Tý" in x for x in next(c for c in a["chuong"] if c["ma"] == "tong_quan")["can_cu"])


# ------------------------------------------------------------------ tầng HỌC
def test_trong_so_gan_ty_le_va_ha_hop(bc):
    ch = {c["ma"]: c for c in bc["chuong"]}
    h0, h1 = ch["su_nghiep"]["hop"][0], ch["su_nghiep"]["hop"][1]
    ts = {h0["ma_mau"]: {"dung": 20, "chua_dung": 90},          # 110 phiếu, 18% → đang xem lại
          h1["ma_mau"]: {"dung": 30, "chua_dung": 10},          # 40 phiếu → gắn tỉ lệ
          ch["tien_bac"]["hop"][0]["ma_mau"]: {"dung": 5, "chua_dung": 5}}   # < 30 → không gắn
    b = toan_bo.battu(SINH, ngay_xem=XEM, trong_so=ts)
    c2 = {c["ma"]: c for c in b["chuong"]}
    ma = [h["ma_mau"] for h in c2["su_nghiep"]["hop"]]
    assert h0["ma_mau"] not in ma and f"Đang xem lại: {h0['tieu_de']}" in c2["su_nghiep"]["can_cu"]
    assert h0["ma_mau"] not in [h["ma_mau"] for h in b["cot_loi"]]
    g = next(h for h in c2["su_nghiep"]["hop"] if h["ma_mau"] == h1["ma_mau"])
    assert g["ty_le_dung"] == 0.75 and g["so_phieu"] == 40 and g["dang_xem_lai"] is False
    t0 = next(h for h in c2["tien_bac"]["hop"] if h["ma_mau"] == ch["tien_bac"]["hop"][0]["ma_mau"])
    assert "ty_le_dung" not in t0


def test_ca_nhan_chua_dung_xep_cuoi_khong_vao_cot_loi(bc):
    goc = bc["cot_loi"][0]
    b = toan_bo.battu(SINH, ngay_xem=XEM, ca_nhan={goc["ma_mau"]: "chua_dung"})
    c = next(c for c in b["chuong"] if c["ma"] == goc["tu_chuong"])
    assert c["hop"][-1]["ma_mau"] == goc["ma_mau"]
    assert goc["ma_mau"] not in [h["ma_mau"] for h in b["cot_loi"]] and 3 <= len(b["cot_loi"]) <= 5


def test_api_trong_so_ca_nhan(bc):
    c = TestClient(app)
    la = {"birth_date": "1990-05-17", "birth_time": "12:30", "gender": "nam", "noi_sinh": "ha-noi"}
    ma0 = next(x for x in bc["chuong"] if x["ma"] == "su_nghiep")["hop"][0]["ma_mau"]
    r = c.post("/v1/battu/luan-giai", json={"la_so": la, "ngay_xem": "2026-10-21",
                                            "trong_so": {ma0: {"dung": 10, "chua_dung": 100}},
                                            "ca_nhan": {bc["cot_loi"][0]["ma_mau"]: "chua_dung"}})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["phien_ban"] == "doi_song_1" and d["mo_dun"] == "battu" and d["cot_loi"] and len(d["thoi_gian_bieu"]) == 8
    assert ma0 not in [h["ma_mau"] for x in d["chuong"] for h in x["hop"]]
    for bad in ({"trong_so": {"MA SAI": {"dung": 1, "chua_dung": 1}}},
                {"ca_nhan": {"ds.a.b": "co_le"}},
                {"trong_so": {f"ds.x.{i}": {"dung": 1, "chua_dung": 1} for i in range(5001)}}):
        assert c.post("/v1/battu/luan-giai", json={"la_so": la, **bad}).status_code == 422


# ------------------------------------------------------------------ KB
def test_kb_hop_le():
    m = kb.meta()
    assert m["trang_thai"] == "nhap_ai" and m["source_id"] and m["school_id"] == "tu_binh"
    assert kb.suc_khoe_chung().startswith("Đây là gợi ý chăm sóc theo sách xưa")


def test_kb_phu_du():
    from app.calc.lunar import CAN
    for can in CAN:
        n = kb.nhat_chu(can)
        assert n and n["hinh_tuong"] and n["chan_dung"], can
        for th in ("manh", "yeu", "can_bang"):
            assert all((n.get(th) or {}).get(k) for k in ("manh", "de_vap", "loi_khuyen")), (can, th)
    tt = ["Tỷ Kiên", "Kiếp Tài", "Thực Thần", "Thương Quan", "Thiên Tài", "Chính Tài", "Thất Sát", "Chính Quan",
          "Thiên Ấn", "Chính Ấn"]
    for t in tt:
        assert all((kb.noi_bat(t) or {}).get(k) for k in ("y", "de_vap", "loi_khuyen")), t
        assert all((kb.van(t) or {}).get(k) for k in ("chu_de", "nen_thuan", "de_vap", "nen_chu_dong")), t
        assert kb.thang(t) and (kb.phoi_ngau(t) or {}).get("y"), t
    from app.calc.battu import TEN_CACH
    for ma in TEN_CACH:
        c = kb.cach(ma)
        assert c and c["ten"] and c["y"] and c["de_vap"] and c["nghe"] and c["hy"], ma
    for h in ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ"):
        x = kb.hanh(h)
        assert all(x.get(k) for k in ("ten", "thua", "thieu", "mau", "huong", "nghe", "thoi_quen", "co_the",
                                      "nhip_thua", "nhip_thieu", "loi_khuyen_sk", "thua_loi_khuyen",
                                      "thieu_loi_khuyen")), h
    for ch in ("su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "hoc_tap", "quan_he"):
        assert kb.tinh_huong_ds(ch), ch
        for ma, o in kb.tinh_huong_ds(ch).items():
            assert o["loai"] in ("diem_manh", "luu_y", "loi_khuyen") and o["y"] and o["loi_khuyen"], (ch, ma)


def test_kb_loi_van_sach():
    d = kb._d()
    cum = kb.cum_cam()

    def chuoi(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if k not in ("cum_cam", "_nguon", "source", "hy", "ky"):
                    yield from chuoi(v)
        elif isinstance(x, list):
            for v in x:
                yield from chuoi(v)

    for s in chuoi(d):
        assert not kb_tv.tim_cum_cam(s, cum), (kb_tv.tim_cum_cam(s, cum), s)
        assert not kb_tv.tim_cum_cam(s, DOA), s
        assert not THUAT_NGU.search(s), s
        assert not any(b in s.lower() for b in BENH if b not in ("sẽ bị", "bạn có bị")), s


def test_kb_thieu_o_van_chay(monkeypatch):
    monkeypatch.setattr(kb, "_d", lambda: {})
    b = toan_bo.battu(SINH, ngay_xem=XEM)
    assert [c["ma"] for c in b["chuong"]] == THU_TU and 3 <= len(b["cot_loi"]) <= 5
    sk = next(c for c in b["chuong"] if c["ma"] == "suc_khoe")
    assert kb.CHUNG_SUC_KHOE in sk["doan"]
    for c in b["chuong"]:
        assert c["hop"], c["ma"]
        for h in c["hop"]:
            assert h["noi_dung"] and bt.MA_MAU_RE.match(h["ma_mau"])


# ------------------------------------------------------------------ golden ≥ 10 lá
def test_golden_du_da_dang():
    assert len(_G) >= 10
    assert {c["than"] for c in _G} == {"manh", "yeu", "can_bang"}
    assert {c["gioi_tinh"] for c in _G} == {"nam", "nu"}
    assert len({c["cach"] for c in _G}) >= 8
    assert any(dt.datetime.fromisoformat(c["lich"]).hour == 23 for c in _G)          # dạ Tý


@pytest.mark.parametrize("ca", _G, ids=[c["id"] for c in _G])
def test_golden(ca):
    b = toan_bo.battu(_sinh(ca), ngay_xem=dt.date.fromisoformat(ca["ngay_xem"]))
    assert [c["ma"] for c in b["chuong"]] == THU_TU
    tq = next(c for c in b["chuong"] if c["ma"] == "tong_quan")
    assert tq["than_do"]["muc"] == ca["than"]
    assert {c["ma"]: c["muc"] for c in b["chuong"]} == ca["muc"]
    assert [g["muc"] for g in b["thoi_gian_bieu"]] == ca["dai_van"]
    assert [i for i, g in enumerate(b["thoi_gian_bieu"]) if g["hien_tai"]] == ca["hien_tai"]
    nh = next(c for c in b["chuong"] if c["ma"] == "ngu_hanh")
    assert nh["hai_cach"]["cach_2"]["ma"] == ca["cach"]
    assert 3 <= len(b["cot_loi"]) <= 5 and {"diem_manh", "luu_y"} <= {h["loai_goc"] for h in b["cot_loi"]}
    ma = [h["ma_mau"] for c in b["chuong"] for h in c["hop"]]
    assert len(ma) == len(set(ma)) and all(bt.MA_MAU_RE.match(m) for m in ma)
    for s in _chu(b):
        assert not THUAT_NGU.search(s), s
        assert not kb_tv.tim_cum_cam(s, kb.cum_cam()), s
    for c in b["chuong"]:
        assert 2 <= len(c["hop"]) <= 6 and c["doan"]
        for h in c["hop"]:
            if h["loai"] == "luu_y":
                assert h["huong_xu_ly"] in h["noi_dung"]
    sk = next(c for c in b["chuong"] if c["ma"] == "suc_khoe")
    assert kb.suc_khoe_chung() in sk["doan"]
