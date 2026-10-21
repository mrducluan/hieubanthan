# -*- coding: utf-8 -*-
"""LG-ĐS — Luận giải Tử vi "đời sống" (`luangiai/tuvi_doi_song.py`, `docs/LUAN-GIAI-DOI-SONG.md` mục 2).
Hợp đồng JSON, chấm cung trên lá đã biết, tất định, lời văn (không thuật ngữ trong hộp, không cụm cấm, không doạ),
sức khoẻ có miễn trừ + không tên bệnh, mã mẫu, tầng HỌC (trong_so / ca_nhan), chạy trên 60 lá golden.
"""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import tuvi_an_sao as az
from app.hoidap.tuvi import tom_tat
from app.kb import tuvi_doi_song_kb as kb
from app.luangiai import toan_bo, tuvi_doi_song as ds
from app.main import app
from app.narrative import hoi_van

SINH = {"ngay": dt.date(1990, 5, 15), "ti": 4, "gioi_tinh": "nam"}     # giờ Thìn — lá ví dụ trong doc
XEM = dt.date(2026, 10, 21)
THU_TU = ["tong_quan", "cuoc_doi", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe", "quan_he", "nha_cua",
          "duong_bay", "nam_nay", "van_han", "loi_khuyen"]
KHONG_MUC = {"van_han", "loi_khuyen"}      # VH-1: chương tổng hợp / dòng 10 năm không mang chip mức riêng
LOAI_HOP = {"cot_loi", "diem_manh", "luu_y", "loi_khuyen", "thoi_diem"}
MUC = {"thuan", "can_bang", "can_chu_dong"}
# thuật ngữ: độ sáng, tên tứ hoá ("tiêu hoá", "văn hoá" là chữ thường, không tính), tam phương
THUAT_NGU = re.compile(r"Miếu|Hãm|(?<!\w)[Hh]oá (?:Lộc|Quyền|Khoa|Kỵ)|(?<!\w)tự hoá|tam phương")
# Cấm doạ / phán (mục 2.4) — so theo ranh giới âm tiết
DOA = ["chắc chắn", "định mệnh", "số phận", "tai hoạ", "tai họa", "xui xẻo", "đại hạn xấu", "khắc", "phá sản",
       "ly hôn", "chết", "tai nạn", "hạn nặng"]
BENH = ["bệnh", "ung thư", "tiểu đường", "huyết áp", "đột quỵ", "viêm", "khối u", "sẽ bị", "bạn có bị",
        "trầm cảm", "suy thận", "xơ gan"]
_G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))["cases"]


@pytest.fixture(scope="module")
def bc():
    return toan_bo.tuvi(SINH, ngay_xem=XEM)


@pytest.fixture(scope="module")
def ls():
    return tom_tat(az.an_sao_tho(SINH["ngay"], SINH["ti"], SINH["gioi_tinh"], "vi-VN"))


def _hop_chuong(bc: dict) -> list[dict]:
    return [h for c in bc["chuong"] for h in c["hop"]]


def _chu(bc: dict) -> list[str]:
    """Mọi chữ người dùng đọc ở thân bài: tóm tắt, hộp, đoạn, câu tự soi (không gồm can_cu kỹ thuật)."""
    ra = []
    for c in bc["chuong"]:
        ra += [c["tom_tat"], *c["doan"], c.get("cau_tu_soi") or ""]
        for h in c["hop"]:
            ra += [h["tieu_de"], h["noi_dung"], h.get("huong_xu_ly", "")]
    for h in bc["cot_loi"]:
        ra += [h["tieu_de"], h["noi_dung"]]
    ra += [g["mot_cau"] for g in bc["thoi_gian_bieu"]]
    return [s for s in ra if s]


# ------------------------------------------------------------------ hợp đồng
def test_hop_dong(bc):
    assert bc["mo_dun"] == "tuvi" and bc["phien_ban"] == "doi_song_1"
    assert bc["trang_thai"] == "nhap_ai" and bc["ket"] == hoi_van.KET and bc["phi"] == toan_bo.PHI
    assert [c["ma"] for c in bc["chuong"]] == THU_TU == [m for m, _, _ in toan_bo.CHUONG_TUVI]
    for c in bc["chuong"]:
        for k in ("ma", "tieu_de", "cau_hoi", "muc", "nhan_muc", "tom_tat", "hop", "doan", "can_cu", "cau_tu_soi",
                  "moi_xem"):
            assert k in c, (c["ma"], k)
        if c["ma"] in KHONG_MUC:
            assert c["muc"] is None and c["nhan_muc"] is None
        else:
            assert c["muc"] in MUC and c["nhan_muc"] == kb.nhan_muc(c["muc"])
        assert 1 <= len(c["doan"]) <= 4 and all(isinstance(d, str) and d for d in c["doan"])
        assert len(c["hop"]) <= 6
        if c["ma"] not in ("nha_cua",):
            assert len(c["hop"]) >= 2, c["ma"]
        for h in c["hop"]:
            assert h["loai"] in LOAI_HOP - {"cot_loi"}
            assert 0 < len(h["tieu_de"]) <= 60 and h["noi_dung"] and isinstance(h["can_cu"], list)
            assert ds.MA_MAU_RE.match(h["ma_mau"]), h["ma_mau"]
            assert not any(k.startswith("_") for k in h)
            if h["loai"] == "luu_y":                       # mỗi lưu ý kèm hướng xử lý, nằm ngay trong hộp
                assert h["huong_xu_ly"] and h["huong_xu_ly"] in h["noi_dung"]
    assert 3 <= len(bc["cot_loi"]) <= 5
    goc = {h["loai_goc"] for h in bc["cot_loi"]}
    assert {"diem_manh", "luu_y"} <= goc and all(h["loai"] == "cot_loi" for h in bc["cot_loi"])
    ma_chuong = {h["ma_mau"] for h in _hop_chuong(bc)}
    assert {h["ma_mau"] for h in bc["cot_loi"]} <= ma_chuong          # cột lõi = hộp của chương, cùng mã kiểm chứng


def test_ma_mau_duy_nhat(bc):
    ma = [h["ma_mau"] for h in _hop_chuong(bc)]
    assert len(ma) == len(set(ma))
    assert all(m.startswith("ds.") for m in ma)


def test_thoi_gian_bieu(bc):
    tgb = bc["thoi_gian_bieu"]
    # bỏ giai đoạn bắt đầu sau 86 tuổi: lá Hoả lục cục 6, 16, …, 86 → 9 giai đoạn
    assert len(tgb) == 9 and [g["tu_tuoi"] for g in tgb] == sorted(g["tu_tuoi"] for g in tgb)
    assert tgb[-1]["tu_tuoi"] == 86 and all(g["tu_tuoi"] <= ds.TUOI_BAT_DAU_TOI_DA for g in tgb)
    for a, b in zip(tgb, tgb[1:]):
        assert b["tu_tuoi"] == a["den_tuoi"] + 1
    for g in tgb:
        assert g["muc"] in MUC and g["mot_cau"] and g["chu_de"]
        assert g["nam_tu"] == 1990 + g["tu_tuoi"] - 1 and g["nam_den"] == 1990 + g["den_tuoi"] - 1
    ht = [g for g in tgb if g["hien_tai"]]
    assert len(ht) == 1 and ht[0]["tu_tuoi"] <= bc["tuoi_mu"] <= ht[0]["den_tuoi"]
    assert bc["tuoi_mu"] == 37 and ht[0]["cung"] == "Điền Trạch"
    assert tgb[0]["tu_tuoi"] == 6 and tgb[0]["nam_tu"] == 1995 and tgb[0]["cung"] == "Mệnh"


def test_khong_hien_tai_khi_tuoi_ngoai_khoang():
    # tuổi mụ 2 < đại hạn đầu (6) → không giai đoạn nào "đang đi"
    b = toan_bo.tuvi(SINH, ngay_xem=dt.date(1991, 6, 1))
    assert not any(g["hien_tai"] for g in b["thoi_gian_bieu"])
    assert [c["ma"] for c in b["chuong"]] == THU_TU


def test_tat_dinh():
    a = toan_bo.tuvi(SINH, ngay_xem=XEM)
    b = toan_bo.tuvi(SINH, ngay_xem=XEM)
    assert json.dumps(a, ensure_ascii=False, sort_keys=True) == json.dumps(b, ensure_ascii=False, sort_keys=True)


# ------------------------------------------------------------------ chấm cung
def test_cham_cung_la_da_biet(ls):
    cc = ds.cham_cung(ls)
    menh, quan, tai = cc["Mệnh"], cc["Quan Lộc"], cc["Tài Bạch"]
    assert [(s["ten"], s["do_sang"]) for s in menh["chinh"]] == [("Thiên Cơ", "Đắc")]
    assert [(s["ten"], s["do_sang"]) for s in quan["chinh"]] == [("Cự Môn", "Hãm")]
    assert [(s["ten"], s["do_sang"]) for s in tai["chinh"]] == [("Thiên Đồng", "Hãm")]
    assert [x["hoa"] for x in tai["hoa"]] == ["Kỵ"] and tai["sat"] == ["Kình Dương"]
    # gốc: Mệnh +1 (Đắc) +1 (Khôi) = 2; Quan Lộc −2 −1 (Hoả) = −3; Tài Bạch −2 (Hãm) −2 (Kỵ) −1 (Kình) = −5
    # Tài Bạch (Dậu): xung Phúc Đức (−2 Hãm +1 Khoa −1 Kiếp = −2), tam hợp Quan Lộc (−3), Mệnh (2) → nửa của −3 = −1
    assert tai["diem"] == -6 and tai["muc"] == "can_chu_dong"
    # Quan Lộc (Tỵ): xung Phu Thê (−2 +2 Lộc −1 Linh = −1), tam hợp Tài Bạch (−5), Mệnh (2) → nửa của −4 = −2
    assert quan["diem"] == -5 and quan["muc"] == "can_chu_dong"
    # Mệnh (Sửu): xung Thiên Di (+1 +3 cát −2 sát = 2), tam hợp Quan Lộc (−3), Tài Bạch (−5) → nửa của −6 = −3
    assert menh["diem"] == -1 and menh["muc"] == "can_bang"
    assert cc["Phu Thê"]["cham"] and not cc["Mệnh"]["cham"]          # Tuần ở Phu Thê → việc đến chậm


def test_vo_chinh_dieu_muon_cung_xung():
    ls = {"cung": [{"chi_so": i, "ten": t, "chi": "", "can": "", "la_than": False,
                    "chinh_tinh": [] if i == 0 else ([{"ten": "Thái Dương", "do_sang": "Miếu", "tu_hoa": None}] if i == 6
                                                     else []), "phu_tinh": [], "dai_han": [0, 0]}
                   for i, t in enumerate(["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
                                          "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Nữ", "Phu Thê", "Huynh Đệ"])],
          "tu_hoa": []}
    cc = ds.cham_cung(ls)
    assert cc["Mệnh"]["muon_tu"] == "Thiên Di" and cc["Mệnh"]["chinh"][0]["muon"]
    assert cc["Mệnh"]["diem"] == 2                     # mượn +2, không đếm lại nửa điểm chính tinh cung xung
    assert cc["Thiên Di"]["diem"] == 2 and cc["Thiên Di"]["muon_tu"] is None


def test_chuong_dung_cung(bc):
    ch = {c["ma"]: c for c in bc["chuong"]}
    assert ch["su_nghiep"]["muc"] == "can_chu_dong"
    cu = " | ".join(ch["su_nghiep"]["can_cu"])
    assert "Cự Môn (Hãm) ở cung Quan Lộc" in cu
    assert "Hoá Kỵ (Thiên Đồng) ở cung Tài Bạch" in " | ".join(ch["tien_bac"]["can_cu"])
    assert "Thiên Cơ (Đắc) ở cung Mệnh" in " | ".join(ch["tong_quan"]["can_cu"])
    assert any(c.startswith("Cách cục: ") for c in ch["tong_quan"]["can_cu"])
    assert any("Tuần" in c and "Phu Thê" in c for c in ch["tinh_cam"]["can_cu"])
    assert ch["nam_nay"]["hop"][0]["ma_mau"].startswith("ds.nam_nay.dai_han.")          # đại hạn trước
    thang = [h for h in ch["nam_nay"]["hop"] if ".thang" in h["ma_mau"]]
    # NHIP-2: mỗi tháng một hộp, lời riêng theo cung tháng (trước đây tháng 10–11 cùng "Bình" bị gộp vì cùng câu)
    assert [h["tieu_de"] for h in thang] == ["Tháng 9 âm lịch", "Tháng 10 âm lịch", "Tháng 11 âm lịch"]
    assert all(h["loai"] == "thoi_diem" and h["tu"] and h["den"] for h in thang)
    assert len({h["noi_dung"] for h in thang}) == 3 and len({h["cau_tu_soi"] for h in thang}) == 3
    assert all(re.fullmatch(r"ds\.nam_nay\.thang\.[a-z_]+\.(thuan|binh|can_than)\.[a-z_]+", h["ma_mau"]) for h in thang)
    assert any(c.startswith("Tứ hoá tháng ") for h in thang for c in h["can_cu"])
    assert ch["duong_bay"]["hop"] and all(h["can_cu"][0].startswith(("Hoá ", "Cung ")) for h in ch["duong_bay"]["hop"])


# ------------------------------------------------------------------ lời văn
def test_khong_thuat_ngu_trong_hop_va_tom_tat(bc):
    for c in bc["chuong"]:
        assert not THUAT_NGU.search(c["tom_tat"]), c["tom_tat"]
        for h in c["hop"]:
            assert not THUAT_NGU.search(h["noi_dung"]), (c["ma"], h["noi_dung"])
            for sao in ("Thiên Cơ", "Cự Môn", "Thiên Đồng", "Kình Dương", "Tài Bạch", "Quan Lộc", "Tật Ách"):
                assert sao not in h["noi_dung"], (c["ma"], h["noi_dung"])


def test_khong_cum_cam_khong_doa(bc):
    cum = kb.cum_cam()
    assert len(cum) >= 20
    for s in _chu(bc):
        assert not kb.tim_cum_cam(s, cum), (kb.tim_cum_cam(s, cum), s)
        assert not kb.tim_cum_cam(s, DOA), s
        assert not any(c in s.lower() for c in hoi_van.CAM), s


def test_tim_cum_cam_ranh_gioi_tu():
    assert kb.tim_cum_cam("Bạn nghiêm khắc, biết khắc phục.", ["khắc"]) == []
    assert kb.tim_cum_cam("hai tuổi tương khắc", ["khắc"]) == ["khắc"]
    assert kb.tim_cum_cam("xui khiến", ["xui"]) == [] and kb.tim_cum_cam("gặp xui", ["xui"]) == ["xui"]
    assert kb.tim_cum_cam("Một Hành trình dài", ["hành trình"]) == ["hành trình"]


def test_suc_khoe_mien_tru_khong_ten_benh(bc):
    sk = next(c for c in bc["chuong"] if c["ma"] == "suc_khoe")
    assert kb.suc_khoe_chung() in sk["doan"] and sk["mien_tru"] == kb.suc_khoe_chung()
    chu = " ".join([sk["tom_tat"], *sk["doan"], *(h["noi_dung"] for h in sk["hop"])]).lower()
    for b in BENH:
        assert b not in chu, b


def test_moi_xem_va_cau_hoi_mo(bc):
    for c in bc["chuong"]:
        m = c["moi_xem"]
        assert ("tuvi", c["ma"]) in toan_bo.CAU_HOI_MO
        assert m["cau_hoi"].endswith("?") and any(d.startswith(m["diem_nhan"].rstrip("…")) for d in c["doan"])
        assert not kb.tim_cum_cam(m["cau_hoi"], DOA)


# ------------------------------------------------------------------ tầng HỌC
def test_trong_so_gan_ty_le_va_ha_hop(bc):
    ch = {c["ma"]: c for c in bc["chuong"]}
    h0, h1 = ch["su_nghiep"]["hop"][0], ch["su_nghiep"]["hop"][1]
    ts = {h0["ma_mau"]: {"dung": 20, "chua_dung": 90},          # 110 phiếu, 18% → đang xem lại
          h1["ma_mau"]: {"dung": 30, "chua_dung": 10},          # 40 phiếu → gắn tỉ lệ, giữ
          ch["tien_bac"]["hop"][0]["ma_mau"]: {"dung": 5, "chua_dung": 5}}   # < 30 → không gắn
    b = toan_bo.tuvi(SINH, ngay_xem=XEM, trong_so=ts)
    c2 = {c["ma"]: c for c in b["chuong"]}
    ma = [h["ma_mau"] for h in c2["su_nghiep"]["hop"]]
    assert h0["ma_mau"] not in ma and f"Đang xem lại: {h0['tieu_de']}" in c2["su_nghiep"]["can_cu"]
    assert h0["ma_mau"] not in [h["ma_mau"] for h in b["cot_loi"]]
    g = next(h for h in c2["su_nghiep"]["hop"] if h["ma_mau"] == h1["ma_mau"])
    assert g["ty_le_dung"] == 0.75 and g["so_phieu"] == 40 and g["dang_xem_lai"] is False
    t0 = next(h for h in c2["tien_bac"]["hop"] if h["ma_mau"] == ch["tien_bac"]["hop"][0]["ma_mau"])
    assert "ty_le_dung" not in t0 and "so_phieu" not in t0
    assert json.dumps(b, sort_keys=True) == json.dumps(toan_bo.tuvi(SINH, ngay_xem=XEM, trong_so=ts), sort_keys=True)


def test_ca_nhan_chua_dung_xep_cuoi_khong_vao_cot_loi(bc):
    goc = bc["cot_loi"][0]
    b = toan_bo.tuvi(SINH, ngay_xem=XEM, ca_nhan={goc["ma_mau"]: "chua_dung"})
    c = next(c for c in b["chuong"] if c["ma"] == goc["tu_chuong"])
    assert c["hop"][-1]["ma_mau"] == goc["ma_mau"]
    assert goc["ma_mau"] not in [h["ma_mau"] for h in b["cot_loi"]] and 3 <= len(b["cot_loi"]) <= 5


def test_api_trong_so_ca_nhan():
    c = TestClient(app)
    la = {"birth_date": "1990-05-15", "birth_time": "08:00", "gender": "nam", "noi_sinh": "ha-noi"}
    r = c.post("/v1/tuvi/luan-giai", json={"la_so": la, "ngay_xem": "2026-10-21",
                                           "trong_so": {"ds.su_nghiep.cu_mon.ham.vap": {"dung": 10, "chua_dung": 100}},
                                           "ca_nhan": {"ds.tien_bac.hoa_ky+tai_bach.sinh.vap": "chua_dung"}})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["phien_ban"] == "doi_song_1" and d["cot_loi"] and len(d["thoi_gian_bieu"]) == 9
    assert "ds.su_nghiep.cu_mon.ham.vap" not in [h["ma_mau"] for c in d["chuong"] for h in c["hop"]]
    for bad in ({"trong_so": {"MA SAI": {"dung": 1, "chua_dung": 1}}},
                {"trong_so": {"ds.a.b": {"dung": -1, "chua_dung": 0}}},
                {"ca_nhan": {"ds.a.b": "co_le"}},
                {"trong_so": {f"ds.x.{i}": {"dung": 1, "chua_dung": 1} for i in range(5001)}}):
        assert c.post("/v1/tuvi/luan-giai", json={"la_so": la, **bad}).status_code == 422


# ------------------------------------------------------------------ KB
def test_kb_hop_le():
    m = kb.meta()
    assert m["trang_thai"] == "nhap_ai" and m["source_id"] and m["school_id"]
    assert kb.suc_khoe_chung().startswith("Đây là gợi ý chăm sóc theo sách xưa")


def test_kb_phu_du():
    """Độ phủ KB sau khi gộp 3 mảnh (`scripts/gop_kb_doi_song.py`): 12 lĩnh vực, 14×12×2 sao×cung, 4×12 hoá,
    3×12 nhóm sao, 12 đại hạn, 14 chính tinh sức khoẻ."""
    from app.kb import tuvi_kb
    for c in tuvi_kb.ten_cung():
        assert kb.ten_doi_thuong(c) and kb.dai_han(c) and kb.dai_han(c)["chu_de"]
        for h in ("Lộc", "Quyền", "Khoa", "Kỵ"):
            assert (kb.hoa_linh_vuc(h, c) or {}).get("y"), (h, c)
        for n in ("cat", "sat", "dao_hoa"):
            assert (kb.nhom_sao_linh_vuc(n, c) or {}).get("y"), (n, c)
        for s in tuvi_kb.ten_chinh_tinh():
            for nhom in ("sang", "ham"):
                o = kb.sao_linh_vuc(s, c, nhom)
                assert o and all(o.values()), (s, c, nhom)
    for s in tuvi_kb.ten_chinh_tinh():
        assert kb.suc_khoe(s) and kb.suc_khoe(s)["bo_phan"], s


def test_kb_loi_van_sach():
    """Mọi câu KB không chứa cụm cấm của chính nó, không doạ, không tên bệnh."""
    d = kb._d()
    cum = kb.cum_cam()

    def chuoi(x):
        if isinstance(x, str):
            yield x
        elif isinstance(x, dict):
            for k, v in x.items():
                if k not in ("cum_cam", "_nguon", "source"):
                    yield from chuoi(v)
        elif isinstance(x, list):
            for v in x:
                yield from chuoi(v)

    for s in chuoi(d):
        assert not kb.tim_cum_cam(s, cum), (kb.tim_cum_cam(s, cum), s)
        assert not kb.tim_cum_cam(s, DOA), s
    for s in chuoi(d.get("suc_khoe", {})):
        assert not any(b in s.lower() for b in BENH if b not in ("sẽ bị", "bạn có bị")), s


def test_kb_thieu_o_van_chay(monkeypatch):
    monkeypatch.setattr(kb, "_d", lambda: {})
    b = toan_bo.tuvi(SINH, ngay_xem=XEM)
    assert [c["ma"] for c in b["chuong"]] == THU_TU and 3 <= len(b["cot_loi"]) <= 5
    sk = next(c for c in b["chuong"] if c["ma"] == "suc_khoe")
    assert kb.CHUNG_SUC_KHOE in sk["doan"]
    for c in b["chuong"]:
        for h in c["hop"]:
            assert h["noi_dung"] and ds.MA_MAU_RE.match(h["ma_mau"])
            assert not THUAT_NGU.search(h["noi_dung"]), h["noi_dung"]


# ------------------------------------------------------------------ 60 lá golden
@pytest.mark.parametrize("ca", _G, ids=[f"{c['ngay']}-{c['ti']}-{c['gioi_tinh']}" for c in _G])
def test_golden_60_la(ca):
    sinh = {"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]}
    b = toan_bo.tuvi(sinh, ngay_xem=XEM)
    assert [c["ma"] for c in b["chuong"]] == THU_TU
    assert 3 <= len(b["cot_loi"]) <= 5 and {"diem_manh", "luu_y"} <= {h["loai_goc"] for h in b["cot_loi"]}
    assert 8 <= len(b["thoi_gian_bieu"]) <= 9 and sum(g["hien_tai"] for g in b["thoi_gian_bieu"]) <= 1
    assert all(g["tu_tuoi"] <= ds.TUOI_BAT_DAU_TOI_DA for g in b["thoi_gian_bieu"])
    _khong_trung_doan_hop(b)
    tu = b["thoi_gian_bieu"][0]["tu_tuoi"]
    if tu <= b["tuoi_mu"] <= b["thoi_gian_bieu"][-1]["den_tuoi"]:
        assert sum(g["hien_tai"] for g in b["thoi_gian_bieu"]) == 1
    ma = [h["ma_mau"] for c in b["chuong"] for h in c["hop"]]
    assert len(ma) == len(set(ma)) and all(ds.MA_MAU_RE.match(m) for m in ma)
    for c in b["chuong"]:
        assert c["doan"] and (c["muc"] in MUC or c["ma"] in KHONG_MUC) and len(c["hop"]) <= 6
        for h in c["hop"]:
            assert not THUAT_NGU.search(h["noi_dung"]), (c["ma"], h["noi_dung"])
            if h["loai"] == "luu_y":
                assert h["huong_xu_ly"]
    sk = next(c for c in b["chuong"] if c["ma"] == "suc_khoe")
    assert kb.suc_khoe_chung() in sk["doan"]


# ------------------------------------------------------------------ QC hồi quy (lời văn trên nhiều lá)
def _khong_trung_doan_hop(b: dict) -> None:
    """Web hiện cả hộp lẫn thân bài → không câu nào của `doan` trùng nguyên văn câu trong hộp cùng chương."""
    for c in b["chuong"]:
        cau_hop = {x.strip() for h in c["hop"] for x in h["noi_dung"].split(". ")}
        for d in c["doan"]:
            for x in d.split(". "):
                assert x.strip() not in cau_hop, (c["ma"], x)


def test_doan_khong_chep_lai_hop(bc):
    _khong_trung_doan_hop(bc)
    ch = {c["ma"]: c for c in bc["chuong"]}
    assert all(c["doan"] for c in bc["chuong"])                      # còn đoạn cho moi_xem + diễn đạt AI
    cd = " ".join(ch["cuoc_doi"]["doan"])
    assert "Từ 6 đến 15 tuổi" not in cd and "Từ 76 đến 85 tuổi" not in cd     # không kể lại dòng thời gian


def test_tieu_de_hop_khong_cut_khong_thuat_ngu():
    """Hồi quy: "…" cắt giữa câu, vế dẫn cụt ("Trong công việc"), "Người giúp trong cha mẹ", "Kỵ chiếu về bản
    thân", "chuyện con người bạn", chương "Thuận lợi" mà toàn hộp lưu ý (sức khoẻ)."""
    tn = re.compile(r"(?<!\w)(?:Kỵ|Lộc|Quyền|Khoa|Hoá|Hóa)(?!\w)|Miếu|Hãm")
    for ca in _G[:30]:
        b = toan_bo.tuvi({"ngay": dt.date.fromisoformat(ca["ngay"]), "ti": ca["ti"], "gioi_tinh": ca["gioi_tinh"]},
                         ngay_xem=XEM)
        for c in b["chuong"]:
            if c["muc"] == "thuan" and c["hop"]:
                assert not all(h["loai"] == "luu_y" for h in c["hop"]), c["ma"]
            for h in c["hop"]:
                t = h["tieu_de"]
                assert not t.endswith("…") and not tn.search(t), t
                assert not re.fullmatch(r"(Trong|Với|Ở|Về|Khi|Lúc) [^,]{0,22}", t), t
                assert not re.search(r"trong (cha mẹ|con cái|anh chị em|tiền bạc|công việc)$", t), t
                assert "con người bạn" not in t and "chuyện con người bạn" not in h["noi_dung"], h["noi_dung"]
        # tóm tắt chương không lặp cùng một câu mô tả mức ở ≥ 3 chương
        cau = [x for c in b["chuong"] for x in c["tom_tat"].split(". ")[1:]]
        assert all(cau.count(x) < 3 for x in cau), cau


def test_loi_khuyen_khong_lap_viec_nen_lam(bc):
    lk = next(c for c in bc["chuong"] if c["ma"] == "loi_khuyen")
    vap = next(h for h in lk["hop"] if h["ma_mau"] == "ds.loi_khuyen.tong_hop.ba.vap")
    viec = next(h for h in lk["hop"] if h["ma_mau"] == "ds.loi_khuyen.tong_hop.ba.khuyen")
    assert not set(viec["noi_dung"].split(". ")) & set(vap["noi_dung"].split(". "))


def test_cot_loi_can_hai_phia(bc):
    goc = [h["loai_goc"] for h in bc["cot_loi"]]
    assert goc.count("luu_y") <= 3 and goc.count("diem_manh") <= 3
    ch = [h["tu_chuong"] for h in bc["cot_loi"]]
    assert all(ch.count(x) <= 2 for x in ch)


def test_tieu_de_cat_truoc_tu_noi():
    s = "Bạn dễ bị bạn bè kéo vào những cuộc vui tốn kém hay những lời mời đầu tư nhanh."
    assert ds._tieu_de(s, "x") == "Bạn dễ bị bạn bè kéo vào những cuộc vui tốn kém"
    assert ds._tieu_de("Trong công việc, bạn tỉ mỉ, có mắt thẩm mỹ.", "x") == "Trong công việc, bạn tỉ mỉ"
    assert ds._tieu_de("Một câu rất dài " * 6, "Mặc định") == "Mặc định"
    assert ds._sua_menh("Ở chuyện con người bạn, việc thường đến chậm.") == "Với bản thân bạn, việc thường đến chậm."
    assert ds._ma("ds", "a" * 58, "b") == "ds." + "a" * 57           # không để dấu chấm treo cuối mã


def test_nhip_3_thang_theo_phai_nguoi_dung():
    from app.calc import tuvi_luu_nguyet as ln
    ra = {}
    for phai in ("dau_quan_thai_tue", "dia_chi_thang", None):
        b = toan_bo.tuvi({**SINH, "luu_nguyet": phai}, ngay_xem=XEM)
        nn = next(c for c in b["chuong"] if c["ma"] == "nam_nay")
        ra[phai] = next(x for x in nn["can_cu"] if x.startswith("Phái lưu nguyệt: "))
    assert ra[None] == ra["dau_quan_thai_tue"] and ln.MAC_DINH == "dau_quan_thai_tue"     # None → phái mặc định
    assert ra["dia_chi_thang"] != ra["dau_quan_thai_tue"]


# ------------------------------------------------------------------ QC: phá cách + lời "bạn đời thường"
PHA = {"ngay": dt.date(1951, 5, 17), "ti": 5, "gioi_tinh": "nam"}       # Cơ Nguyệt Đồng Lương, sát tinh hội về


def test_pha_cach_ha_trong_so_khong_vao_cot_loi():
    b = toan_bo.tuvi(PHA, ngay_xem=XEM)
    tq = next(c for c in b["chuong"] if c["ma"] == "tong_quan")
    pha = [h for h in tq["hop"] if h["ma_mau"].startswith("ds.tong_quan.cach.") and h["ma_mau"].endswith(".pha")]
    assert pha, "lá có cách tốt bị sát tinh hội về phải ra hộp phá cách"
    for h in pha:
        assert "cần tự chủ nhiều hơn" in h["noi_dung"]
        assert any("phá cách" in c for c in h["can_cu"])
    ma_pha = {h["ma_mau"] for h in pha}
    assert not ma_pha & {h["ma_mau"] for h in b["cot_loi"]}
    lk = next(c for c in b["chuong"] if c["ma"] == "loi_khuyen")
    ba_manh = next((h for h in lk["hop"] if h["ma_mau"] == "ds.loi_khuyen.tong_hop.ba.manh"), None)
    assert not ba_manh or not any(c.startswith("Cách cục") and "phá cách" in c for c in ba_manh["can_cu"])


def test_pha_cach_trong_so_thap_hon_cach_nguyen():
    assert ds.TRONG_PHA_CACH < 1.8 and "cần tự chủ nhiều hơn" in ds.PHA_CACH_LOI


def test_kb_khong_co_cum_ban_doi_thuong():
    """"người bạn đời thường mang lại…" đọc nhầm thành "bạn đời bình thường" → viết lại."""
    raw = (Path(__file__).parents[1] / "app" / "kb" / "data" / "tuvi_doi_song_kb.json").read_text("utf-8")
    assert "bạn đời thường" not in raw.lower()
