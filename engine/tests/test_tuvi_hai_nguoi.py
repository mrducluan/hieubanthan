# -*- coding: utf-8 -*-
"""HN-2N — "Xem lá số 2 người": điểm tham khảo hợp – khắc (luangiai/tuvi_hai_nguoi.py, luật `hai_nguoi_1`).
Viết TRƯỚC hàm. Golden tính tay: fixtures/golden/tuvi_hai_nguoi_diem.json (14 cặp).
"""
from __future__ import annotations

import itertools
import json
import random
import re
from pathlib import Path

import pytest

from app.calc import tuoi_dan_gian as tdg
from app.kb import tuvi_doi_song_kb as dskb
from app.kb import tuvi_hai_nguoi_kb as hkb
from app.luangiai import tuvi_hai_nguoi as hn

GOLDEN = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "tuvi_hai_nguoi_diem.json")
                    .read_text("utf-8"))
QUAN_HE = ("nguoi_yeu", "vo_chong", "ban_be", "dong_nghiep", "doi_tac", "sep", "cha_me_con", "gia_dinh")
TIEU_CHI = ("menh", "can", "chi", "cung_phi", "tu_vi")
MUC = ("hop", "binh_hoa", "can_dung_hoa")
CUNG = ("Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc",
        "Điền Trạch", "Phúc Đức", "Phụ Mẫu")
TU_DOA = ("không nên lấy nhau", "đại kỵ", "chia tay", "báo động", "nguy hiểm", "giải hạn", "vật phẩm", "bùa",
          "phá sản", "tai nạn", "bệnh", "chết", "tuyệt đối", "ly hôn", "tan vỡ", "xung khắc")
MA_MAU = re.compile(r"^[a-z0-9_.+-]{3,60}$")


def _duong(ds):
    return None if ds is None else [{"hoa": h, "sao": "", "den_cung": d, "xung_cung": x} for h, d, x in ds]


def _cham(ca):
    return hn.cham_diem(ca["ban"], ca["kia"], ca["quan_he"], _duong(ca["vao_ban"]), _duong(ca["ban_vao"]))


# ------------------------------------------------------------------ hằng luật
def test_phien_ban_va_trong_so():
    assert hn.PHIEN_BAN_DIEM == GOLDEN["phien_ban"] == "hai_nguoi_1"
    assert hn.TRONG_SO == {"menh": 20, "can": 15, "chi": 20, "cung_phi": 15, "tu_vi": 30}
    assert sum(hn.TRONG_SO.values()) == 100
    assert set(hn.CUNG_TRONG_TAM) == set(QUAN_HE)
    for q, d in hn.CUNG_TRONG_TAM.items():
        assert d and all(c in CUNG for c in d), q
        assert max(d.values()) == 1.0


def test_tu_hanh_xung():
    assert tdg.tu_hanh_xung("Tý", "Dậu") and tdg.tu_hanh_xung("Mão", "Ngọ")
    assert tdg.tu_hanh_xung("Sửu", "Thìn") and tdg.tu_hanh_xung("Dần", "Hợi")
    assert not tdg.tu_hanh_xung("Tý", "Tý") and not tdg.tu_hanh_xung("Tý", "Sửu")
    assert not tdg.tu_hanh_xung("Thân", "Ngọ")
    # 3 nhóm × 4 chi, mỗi chi có đúng 3 chi cùng nhóm
    for c in tdg.CHI:
        assert sum(tdg.tu_hanh_xung(c, d) for d in tdg.CHI) == 3


# ------------------------------------------------------------------ golden tính tay
@pytest.mark.parametrize("ca", GOLDEN["ca"], ids=[c["id"] for c in GOLDEN["ca"]])
def test_golden(ca):
    r = _cham(ca)
    kv = ca["ky_vong"]
    tc = {t["ma"]: t for t in r["tieu_chi"]}
    assert list(tc) == list(TIEU_CHI)
    for ma in TIEU_CHI:
        loai, diem, toi_da, ket = kv[ma]
        assert (tc[ma]["loai"], tc[ma]["diem"], tc[ma]["toi_da"], tc[ma]["ket_luan"]) == (loai, diem, toi_da, ket), ma
    assert r["tong"] == kv["tong"]
    assert r["muc"] == kv["muc"]
    assert r["phien_ban"] == "hai_nguoi_1"
    if "chieu_menh" in kv:
        assert tc["menh"]["chieu"] == kv["chieu_menh"]
    assert r["tong"] == sum(t["diem"] for t in r["tieu_chi"])
    assert sum(t["toi_da"] for t in r["tieu_chi"]) == 100


def test_thieu_gioi_tinh_ghi_ro():
    ca = next(c for c in GOLDEN["ca"] if c["id"].startswith("D_"))
    r = _cham(ca)
    cp = next(t for t in r["tieu_chi"] if t["ma"] == "cung_phi")
    assert cp["tinh"] is False and cp["toi_da"] == 0 and cp["ket_luan"] is None
    assert "chưa tính" in cp["giai_thich"].lower() and "giới tính" in cp["giai_thich"].lower()
    # ban thiếu giới tính cũng bỏ
    r2 = hn.cham_diem({"nam_am": 1990, "gioi_tinh": None}, {"nam_am": 1992, "gioi_tinh": "nu"}, "ban_be",
                      _duong(ca["vao_ban"]))
    assert next(t for t in r2["tieu_chi"] if t["ma"] == "cung_phi")["tinh"] is False


def test_can_cu_co_thuat_ngu():
    ca = GOLDEN["ca"][0]                                 # Mậu Thìn × Bính Tý
    r = _cham(ca)
    tc = {t["ma"]: t for t in r["tieu_chi"]}
    assert any("Đại Lâm Mộc" in s and "Giản Hạ Thuỷ" in s for s in tc["menh"]["can_cu"])
    assert any("tam hợp" in s.lower() for s in tc["chi"]["can_cu"])
    assert any("Diên Niên" in s for s in tc["cung_phi"]["can_cu"])
    assert any("Phu Thê" in s and "Lộc" in s for s in tc["tu_vi"]["can_cu"])


def test_cung_phi_theo_lap_xuan_va_ghi_chu_moc():
    """QC 2026-10-21 (lỗi 3): cung phi tính năm theo Lập xuân như /phong-thuy (không theo Tết). Mốc Tết cho quái khác
    → `can_cu` ghi rõ; chỉ có năm âm → ghi rõ đang tính theo năm âm lịch."""
    o = next(c for c in GOLDEN["ca"] if c["id"].startswith("O_"))
    cp = next(t for t in _cham(o)["tieu_chi"] if t["ma"] == "cung_phi")
    cu = " ".join(cp["can_cu"])
    assert "Lập xuân" in cu and "Khôn" in cu and "Cấn" in cu
    assert "Khảm" in cu and "Ly" in cu                    # mốc Tết cho quái khác (cả hai người) → nói rõ
    assert cp["moc_khac"] is True and cu.count("theo mốc Tết") == 2
    p = next(c for c in GOLDEN["ca"] if c["id"].startswith("P_"))
    cp = next(t for t in _cham(p)["tieu_chi"] if t["ma"] == "cung_phi")
    assert "năm âm lịch" in " ".join(cp["can_cu"]) and cp["moc_khac"] is False
    # ngày dương dạng date cũng nhận; hai mốc trùng → không ghi chú mốc
    import datetime as dt
    r = hn.cham_diem({"nam_am": 1990, "gioi_tinh": "nam", "ngay_duong": dt.date(1990, 1, 30)},
                     {"nam_am": 1985, "gioi_tinh": "nu", "ngay_duong": dt.date(1985, 2, 1)}, "nguoi_yeu",
                     _duong(o["vao_ban"]))
    assert next(t for t in r["tieu_chi"] if t["ma"] == "cung_phi")["loai"] == "sinh_khi"
    r = hn.cham_diem({"nam_am": 1990, "gioi_tinh": "nam", "ngay_duong": dt.date(1990, 6, 1)},
                     {"nam_am": 1992, "gioi_tinh": "nu", "ngay_duong": dt.date(1992, 8, 21)}, "nguoi_yeu",
                     _duong(o["vao_ban"]))
    cp = next(t for t in r["tieu_chi"] if t["ma"] == "cung_phi")
    assert cp["moc_khac"] is False and "theo mốc Tết" not in " ".join(cp["can_cu"])


# ------------------------------------------------------------------ tính chất
def _ngau_nhien_duong(rd: random.Random):
    ra = []
    for h in ("Lộc", "Quyền", "Khoa", "Kỵ"):
        i = rd.randrange(12)
        ra.append((h, CUNG[i], CUNG[(i + 6) % 12]))
    return ra


def test_thang_diem_0_100_va_tong_khop():
    rd = random.Random(20261021)
    for _ in range(600):
        ban = {"nam_am": rd.randint(1940, 2010), "gioi_tinh": rd.choice(["nam", "nu", None])}
        kia = {"nam_am": rd.randint(1940, 2010), "gioi_tinh": rd.choice(["nam", "nu", None])}
        q = rd.choice(QUAN_HE)
        r = hn.cham_diem(ban, kia, q, _duong(_ngau_nhien_duong(rd)),
                         _duong(_ngau_nhien_duong(rd)) if rd.random() < 0.5 else None)
        assert 0 <= r["tong"] <= 100
        assert r["tong"] == sum(t["diem"] for t in r["tieu_chi"])
        assert sum(t["toi_da"] for t in r["tieu_chi"]) == 100
        for t in r["tieu_chi"]:
            assert 0 <= t["diem"] <= t["toi_da"]
            if t["tinh"]:
                assert 0.0 <= t["ty_le"] <= 1.0 and t["ket_luan"] in MUC
        assert r["muc"] in hn.MUC_TONG
        assert len(r["diem_manh"]) <= 3 and len(r["can_dung_hoa"]) <= 3
        assert len(r["goi_y"]) == 3


@pytest.mark.parametrize("q", QUAN_HE)
def test_don_dieu_loc_hon_ky(q):
    ban, kia = {"nam_am": 1990, "gioi_tinh": "nam"}, {"nam_am": 1992, "gioi_tinh": "nu"}
    trung_tinh = [("Quyền", "Tật Ách", "Phụ Mẫu"), ("Khoa", "Tật Ách", "Phụ Mẫu")]
    for cung in hn.CUNG_TRONG_TAM[q]:
        xung = CUNG[(CUNG.index(cung) + 6) % 12]
        loc = hn.cham_diem(ban, kia, q, _duong([("Lộc", cung, xung), *trung_tinh, ("Kỵ", "Tật Ách", "Phụ Mẫu")]))
        ky = hn.cham_diem(ban, kia, q, _duong([("Lộc", "Tật Ách", "Phụ Mẫu"), *trung_tinh, ("Kỵ", cung, xung)]))
        khong = hn.cham_diem(ban, kia, q, _duong([("Lộc", "Tật Ách", "Phụ Mẫu"), *trung_tinh,
                                                  ("Kỵ", "Tật Ách", "Phụ Mẫu")]))
        tv = lambda r: next(t for t in r["tieu_chi"] if t["ma"] == "tu_vi")["diem"]  # noqa: E731
        assert tv(loc) > tv(khong) > tv(ky), cung
        assert loc["tong"] >= ky["tong"]


def test_ky_xung_nhe_hon_ky_vao():
    ban, kia = {"nam_am": 1990, "gioi_tinh": "nam"}, {"nam_am": 1992, "gioi_tinh": "nu"}
    nen = [("Lộc", "Tật Ách", "Phụ Mẫu"), ("Quyền", "Tật Ách", "Phụ Mẫu"), ("Khoa", "Tật Ách", "Phụ Mẫu")]
    vao = hn.cham_diem(ban, kia, "nguoi_yeu", _duong([*nen, ("Kỵ", "Phu Thê", "Quan Lộc")]))
    xung = hn.cham_diem(ban, kia, "nguoi_yeu", _duong([*nen, ("Kỵ", "Quan Lộc", "Phu Thê")]))
    assert vao["tong"] < xung["tong"]


def test_quan_he_sai():
    with pytest.raises(ValueError):
        hn.cham_diem({"nam_am": 1990, "gioi_tinh": "nam"}, {"nam_am": 1992, "gioi_tinh": "nu"}, "ke_thu",
                     _duong(GOLDEN["ca"][0]["vao_ban"]))


def test_tat_dinh():
    ca = GOLDEN["ca"][4]
    assert _cham(ca) == _cham(ca)


# ------------------------------------------------------------------ hộp + lời
def _chu_thuong(r: dict) -> list[str]:
    """Mọi chữ đời thường trong `diem` (bỏ can_cu — thuật ngữ chỉ ở "Vì sao nói vậy")."""
    ra = [r["nhan_muc"], r["mo_ta_muc"], r["loi_dan"], *r["goi_y"]]
    for t in r["tieu_chi"]:
        ra += [t["ten"], t["giai_thich"]] + ([t["nhan_ket_luan"]] if t.get("nhan_ket_luan") else [])
    for h in r["diem_manh"] + r["can_dung_hoa"]:
        ra += [h["tieu_de"], h["noi_dung"]] + ([h["huong_xu_ly"]] if h.get("huong_xu_ly") else [])
    return ra


@pytest.mark.parametrize("ca", GOLDEN["ca"], ids=[c["id"] for c in GOLDEN["ca"]])
def test_hop_dung_khuon(ca):
    r = _cham(ca)
    tc = {t["ma"]: t for t in r["tieu_chi"]}
    for h in r["diem_manh"]:
        assert h["loai"] == "diem_manh" and MA_MAU.match(h["ma_mau"]) and h["ma_mau"].startswith("hn.")
        assert h["tieu_de"] and h["noi_dung"] and h["can_cu"]
    for h in r["can_dung_hoa"]:
        assert h["loai"] == "luu_y" and MA_MAU.match(h["ma_mau"]) and h["ma_mau"].startswith("hn.")
        assert h["huong_xu_ly"] and h["huong_xu_ly"] in h["noi_dung"]
    # hộp lấy đúng tiêu chí: Hợp → điểm mạnh, Cần dung hoà → cần dung hoà
    so_hop = sum(t["ket_luan"] == "hop" for t in tc.values())
    so_dh = sum(t["ket_luan"] == "can_dung_hoa" for t in tc.values())
    assert len(r["diem_manh"]) == min(3, so_hop)
    assert len(r["can_dung_hoa"]) == min(3, so_dh)
    assert len({h["ma_mau"] for h in r["diem_manh"] + r["can_dung_hoa"]}) == len(r["diem_manh"] + r["can_dung_hoa"])


@pytest.mark.parametrize("q", QUAN_HE)
def test_loi_khong_doa_khong_cum_cam(q):
    for ca in GOLDEN["ca"]:
        r = hn.cham_diem(ca["ban"], ca["kia"], q, _duong(ca["vao_ban"]), _duong(ca["ban_vao"]))
        for s in _chu_thuong(r):
            assert not dskb.tim_cum_cam(s), (s, dskb.tim_cum_cam(s))
            for tu in TU_DOA:
                assert tu not in s.lower(), (tu, s)
        assert "tham khảo" in r["loi_dan"] and "cư xử" in r["loi_dan"]


# ------------------------------------------------------------------ KB
def test_kb_du_va_co_nguon():
    m = hkb.meta()
    assert m["trang_thai"] == "nhap_ai"
    for ma in TIEU_CHI:
        tc = hkb.tieu_chi(ma)
        assert tc and tc["ten"] and tc["source_id"] and tc["school_id"], ma
        for muc in MUC:
            assert hkb.tieu_de(ma, muc), (ma, muc)
            for q in QUAN_HE:
                c = hkb.cau(ma, muc, q)
                assert c and c["y"].strip() and c["nen"].strip(), (ma, muc, q)
    for muc in hn.MUC_TONG:
        assert hkb.muc_tong(muc)["nhan"] and hkb.muc_tong(muc)["mo_ta"]
    for q in QUAN_HE:
        assert len(hkb.goi_y(q)) == 3
    assert hkb.loi_dan()


def test_kb_cau_khong_lap():
    y, nen = [], []
    for ma, muc, q in itertools.product(TIEU_CHI, MUC, QUAN_HE):
        c = hkb.cau(ma, muc, q)
        y.append(c["y"])
        nen.append(c["nen"])
    assert len(y) == len(set(y)) == 120
    assert len(nen) == len(set(nen)) == 120
    tieu_de = [hkb.tieu_de(ma, muc) for ma, muc in itertools.product(TIEU_CHI, MUC)]
    assert len(tieu_de) == len(set(tieu_de))
    goi = [s for q in QUAN_HE for s in hkb.goi_y(q)]
    assert len(goi) == len(set(goi))


def _chuoi(x):
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        return [s for k, v in x.items() if k not in ("source_id", "school_id", "_nguon", "source") for s in _chuoi(v)]
    if isinstance(x, list):
        return [s for v in x for s in _chuoi(v)]
    return []


def test_kb_khong_cum_cam_khong_doa():
    raw = json.loads((Path(__file__).parents[1] / "app" / "kb" / "data" / "tuvi_hai_nguoi_kb.json").read_text("utf-8"))
    for s in _chuoi({k: v for k, v in raw.items() if k != "can_cu_mau"}):
        assert not dskb.tim_cum_cam(s), (s, dskb.tim_cum_cam(s))
        for tu in TU_DOA:
            assert tu not in s.lower(), (tu, s)


def test_khong_kb_van_chay(monkeypatch):
    monkeypatch.setattr(hkb, "_d", lambda: {})
    r = _cham(GOLDEN["ca"][1])
    assert r["tong"] == GOLDEN["ca"][1]["ky_vong"]["tong"]
    assert all(t["giai_thich"] for t in r["tieu_chi"])
    assert r["loi_dan"] and len(r["goi_y"]) == 3


# ------------------------------------------------------------------ tầng HỌC (kiểm chứng "hai_nguoi", migration 0021)
# Như LG-ĐS: `trong_so` (tỉ lệ công khai, mã ≥ 30 phiếu) gắn "x% thấy đúng"; hộp ≥ 100 phiếu và < 40% đúng → bỏ khỏi
# hộp, chuyển một dòng "Đang xem lại" xuống "Vì sao nói vậy" của tiêu chí; hộp chính người xem bấm "chưa đúng" xếp
# cuối. KHÔNG đổi điểm, mức, lời — chỉ chọn/xếp hộp đã có.
def _cham_hoc(ca, trong_so=None, ca_nhan=None):
    return hn.cham_diem(ca["ban"], ca["kia"], ca["quan_he"], _duong(ca["vao_ban"]), _duong(ca["ban_vao"]),
                        trong_so=trong_so, ca_nhan=ca_nhan)


def _ca_co_hop(toi_thieu: int, khoa: str = "diem_manh"):
    return next(c for c in GOLDEN["ca"] if len(_cham(c)[khoa]) >= toi_thieu)


def test_hoc_mac_dinh_y_nguyen():
    for ca in GOLDEN["ca"]:
        assert _cham_hoc(ca) == _cham(ca) == _cham_hoc(ca, {}, {})


def test_hoc_khong_doi_diem_muc_loi():
    for ca in GOLDEN["ca"]:
        goc = _cham(ca)
        hop = goc["diem_manh"] + goc["can_dung_hoa"]
        # mọi ứng viên (cả tiêu chí ngoài 3 hộp đầu) — hạ hết thì không còn hộp thay chỗ
        ung_vien = [f"hn.{t['ma']}.{t['loai']}.{ca['quan_he']}" for t in goc["tieu_chi"]
                    if t["ket_luan"] in ("hop", "can_dung_hoa")]
        ts = {m: {"dung": 1, "chua_dung": 199} for m in ung_vien}
        cn = {m: "chua_dung" for m in ung_vien}
        r = _cham_hoc(ca, ts, cn)
        assert (r["tong"], r["muc"], r["nhan_muc"]) == (goc["tong"], goc["muc"], goc["nhan_muc"])
        for a, b in zip(r["tieu_chi"], goc["tieu_chi"]):
            assert (a["diem"], a["toi_da"], a["ket_luan"], a["giai_thich"]) == (b["diem"], b["toi_da"], b["ket_luan"],
                                                                                  b["giai_thich"])
        # mọi hộp đều bị hạ → không còn hộp, mỗi hộp để lại đúng một dòng "Đang xem lại" ở tiêu chí của nó
        assert r["diem_manh"] == [] and r["can_dung_hoa"] == []
        for h in hop:
            ma = h["ma_mau"].split(".")[1]
            tc = next(t for t in r["tieu_chi"] if t["ma"] == ma)
            assert tc["can_cu"].count(f"Đang xem lại: {h['tieu_de']}") == 1


def test_hoc_gan_ty_le_tu_30_phieu():
    ca = _ca_co_hop(2)
    goc = _cham(ca)
    a, b = goc["diem_manh"][0]["ma_mau"], goc["diem_manh"][1]["ma_mau"]
    r = _cham_hoc(ca, {a: {"dung": 24, "chua_dung": 6}, b: {"dung": 20, "chua_dung": 9}})
    ha = {h["ma_mau"]: h for h in r["diem_manh"]}
    assert ha[a]["ty_le_dung"] == 0.8 and ha[a]["so_phieu"] == 30
    assert "ty_le_dung" not in ha[b] and "so_phieu" not in ha[b]          # 29 phiếu: chưa đủ ngưỡng
    assert [h["ma_mau"] for h in r["diem_manh"]] == [h["ma_mau"] for h in goc["diem_manh"]]
    for h in r["diem_manh"]:
        assert not any(k.startswith("_") for k in h) and "dang_xem_lai" not in h


def test_hoc_ha_hop_it_nguoi_thay_dung():
    ca = _ca_co_hop(2)
    goc = _cham(ca)
    ma0 = goc["diem_manh"][0]["ma_mau"]
    # 99 phiếu (dưới 100) dù tỉ lệ thấp: chưa hạ
    r = _cham_hoc(ca, {ma0: {"dung": 10, "chua_dung": 89}})
    assert r["diem_manh"][0]["ma_mau"] == ma0
    # ≥ 100 phiếu, đúng 40%: chưa hạ (ngưỡng < 40%)
    r = _cham_hoc(ca, {ma0: {"dung": 40, "chua_dung": 60}})
    assert ma0 in [h["ma_mau"] for h in r["diem_manh"]]
    # ≥ 100 phiếu, < 40%: hạ xuống "Vì sao nói vậy"
    r = _cham_hoc(ca, {ma0: {"dung": 39, "chua_dung": 61}})
    assert ma0 not in [h["ma_mau"] for h in r["diem_manh"]]
    so_hop = sum(t["ket_luan"] == "hop" for t in goc["tieu_chi"])
    assert len(r["diem_manh"]) == min(3, so_hop - 1)                    # tiêu chí "Hợp" kế tiếp (nếu có) thay chỗ
    tc = next(t for t in r["tieu_chi"] if t["ma"] == ma0.split(".")[1])
    assert f"Đang xem lại: {goc['diem_manh'][0]['tieu_de']}" in tc["can_cu"]


def test_hoc_ca_nhan_chua_dung_xep_cuoi():
    ca = _ca_co_hop(2)
    goc = _cham(ca)
    ds = [h["ma_mau"] for h in goc["diem_manh"]]
    r = _cham_hoc(ca, ca_nhan={ds[0]: "chua_dung", ds[1]: "dung"})
    assert [h["ma_mau"] for h in r["diem_manh"]] == ds[1:] + ds[:1]
    assert all(not any(k.startswith("_") for k in h) for h in r["diem_manh"])


def test_ma_mau_khong_lo_nhan_than():
    """Mã chỉ gồm tiêu chí · loại quan hệ giữa hai năm sinh · quan hệ người dùng chọn — không năm, can, chi, tên."""
    for ca in GOLDEN["ca"]:
        r = _cham(ca)
        for h in r["diem_manh"] + r["can_dung_hoa"]:
            p = h["ma_mau"].split(".")
            assert len(p) == 4 and p[0] == "hn" and p[1] in TIEU_CHI and p[3] in QUAN_HE
            assert not re.search(r"\d", h["ma_mau"])


def test_api_hop_tham_nhan_trong_so_ca_nhan():
    from fastapi.testclient import TestClient

    from app.main import app
    c = TestClient(app)
    la = {"birth_date": "1990-05-15", "birth_time": "02:00", "gender": "nam", "noi_sinh": "ha-noi"}
    kia = {"birth_date": "1992-08-21", "gender": "nu"}
    goc = c.post("/v1/tuvi/hop-tham", json={"la_so": la, "nguoi_kia": kia})
    assert goc.status_code == 200, goc.text
    d0 = goc.json()["diem"]
    hop = d0["diem_manh"] + d0["can_dung_hoa"]
    assert hop
    ma0 = hop[0]["ma_mau"]
    r = c.post("/v1/tuvi/hop-tham", json={"la_so": la, "nguoi_kia": kia,
                                          "trong_so": {ma0: {"dung": 5, "chua_dung": 120}},
                                          "ca_nhan": {ma0: "chua_dung"}})
    assert r.status_code == 200, r.text
    d = r.json()["diem"]
    assert ma0 not in [h["ma_mau"] for h in d["diem_manh"] + d["can_dung_hoa"]]
    assert d["tong"] == d0["tong"]
    for bad in ({"trong_so": {"MA SAI": {"dung": 1, "chua_dung": 1}}}, {"ca_nhan": {"hn.a.b.c": "co_le"}},
                {"trong_so": {f"hn.x.{i}": {"dung": 1, "chua_dung": 1} for i in range(5001)}}):
        assert c.post("/v1/tuvi/hop-tham", json={"la_so": la, "nguoi_kia": kia, **bad}).status_code == 422
