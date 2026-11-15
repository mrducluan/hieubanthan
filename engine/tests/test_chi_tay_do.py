# -*- coding: utf-8 -*-
"""CT-2 — đo bàn tay từ 21 điểm mốc (CALC `calc/chi_tay_do.py`) + route `/v1/chi-tay/do-tay` + `doc` theo cung.

Tay mẫu dựng từ hình học đơn giản: độ dài xương bàn + đốt ngón người trưởng thành (cm), đặt vào ảnh với xoay / co giãn /
khung bất kỳ. Lòng bàn tay PHẢI nhìn thẳng (ảnh không lật gương): ngón cái bên PHẢI ảnh khi cổ tay ở dưới; tay trái thì ngược.
Mu bàn tay phải trông như lòng bàn tay trái (lật gương) — đó là cách máy nhận ra mu bàn tay khi người dùng đã chọn tay.
"""
from __future__ import annotations

import json
import math
import re

import pytest
from fastapi.testclient import TestClient

from app.calc import chi_tay_do as ctd
from app.kb import chi_tay_kb as kb
from app.kb import sach_ghi
from app.main import app

# --- tay mẫu ------------------------------------------------------------------------------------------------------
# Khung riêng của tay phải nhìn lòng bàn tay: x sang phía NGÓN CÁI, y hướng lên (về phía ngón), cổ tay ở gốc. Đơn vị cm.
_GOC = {"tro": (2.6, 9.1), "giua": (0.0, 9.5), "ap_ut": (-2.0, 9.0), "ut": (-4.0, 8.0)}
_HUONG = {"tro": 80, "giua": 90, "ap_ut": 98, "ut": 108}                 # độ, tính từ trục x
_DOT = {"tro": (4.0, 2.3, 1.9), "giua": (4.5, 2.8, 2.1), "ap_ut": (4.2, 2.6, 2.1), "ut": (3.3, 1.8, 1.9)}
_CAI = ((2.2, 2.5), 55, (4.6, 3.2, 2.7))                                 # khớp cổ tay ngón cái, hướng, 3 đốt


def _tay(ngon: float = 1.0, ngang: float = 1.0, dot: dict | None = None, nam: tuple = (), dep: float = 1.0) -> list:
    """21 điểm trong khung riêng. `ngon` nhân độ dài mọi ngón; `ngang` nhân bề ngang lòng bàn tay; `dot` ghi đè hệ số từng
    ngón; `nam` các ngón gập vào lòng; `dep` ép bề ngang cả bàn tay (tay nghiêng cạnh)."""
    p = [(0.0, 0.0)] * 21
    p[0] = (0.0, 0.0)
    (cx, cy), h, ds = _CAI
    pts = [(cx * ngang, cy)]
    x, y = pts[0]
    for L in ds:
        x, y = x + L * ngon * math.cos(math.radians(h)), y + L * ngon * math.sin(math.radians(h))
        pts.append((x, y))
    p[1:5] = pts
    for i, f in enumerate(("tro", "giua", "ap_ut", "ut")):
        gx, gy = _GOC[f]
        x, y = gx * ngang, gy
        pts = [(x, y)]
        k = ngon * (dot or {}).get(f, 1.0)
        h0 = _HUONG[f]
        for j, L in enumerate(_DOT[f]):
            h, L = (h0, L) if f not in nam else ((h0, L * 0.4) if j == 0 else (h0 + 180, L))  # gập: đốt 1 chĩa vào máy, 2–3 quặp xuống
            x, y = x + L * k * math.cos(math.radians(h)), y + L * k * math.sin(math.radians(h))
            pts.append((x, y))
        p[5 + 4 * i: 9 + 4 * i] = pts
    return [(x * dep, y) for x, y in p]


def _anh(p: list, tay: str = "phai", goc: float = 0.0, cao: float = 0.3, ty_le: float = 0.75,
         tam: tuple = (0.5, 0.55)) -> list:
    """Đặt tay vào ảnh: tay trái = lật gương khung riêng; xoay `goc` độ; dài lòng bàn tay = `cao` × chiều cao ảnh."""
    s = cao / 9.5
    c, si = math.cos(math.radians(goc)), math.sin(math.radians(goc))
    ra = []
    for x, y in p:
        if tay == "trai":
            x = -x
        x, y = x - 0.0, y - 9.5 / 2
        xr, yr = x * c - y * si, x * si + y * c
        ra.append([round(tam[0] + xr * s / ty_le, 6), round(tam[1] - yr * s, 6)])  # ảnh: y hướng xuống
    return ra


# --- CALC ---------------------------------------------------------------------------------------------------------
@pytest.mark.parametrize("tay", ["phai", "trai"])
@pytest.mark.parametrize("goc", [0, 25, -40])
def test_tay_mau_hop_le_va_roi_vao_dai_vua(tay, goc):
    kq = ctd.do_tay(_anh(_tay(), tay, goc), 0.75, tay)
    assert kq["hop_le"] and kq["loi"] is None
    sd = kq["so_do"]
    assert sd["dai_long"] == 1.0
    assert 0.68 <= sd["rong_long"] <= 0.72
    assert 0.97 <= sd["ngon"]["giua"] <= 1.0 and 0.84 <= sd["ngon"]["tro"] <= 0.88
    assert 0.9 <= sd["tro_ap_ut"] <= 0.94
    assert [n["ma"] for n in kq["nhan"]] == ["ngon_vua", "long_vua", "tro_ap_ut_vua"]
    assert all(n["vua"] for n in kq["nhan"])


def test_so_do_khong_doi_theo_khung_anh_va_xoay():
    a = ctd.do_tay(_anh(_tay(), ty_le=0.75), 0.75, "phai")["so_do"]
    b = ctd.do_tay(_anh(_tay(), ty_le=1.6, goc=70, cao=0.3, tam=(0.5, 0.5)), 1.6, "phai")["so_do"]
    assert a == b


@pytest.mark.parametrize("bien, ma", [
    ({"ngon": 1.2}, "ngon_dai"), ({"ngon": 0.82}, "ngon_ngan"),
    ({"ngang": 0.8}, "long_dai"), ({"ngang": 1.2}, "long_rong"),
    ({"dot": {"tro": 1.1}}, "tro_dai"), ({"dot": {"tro": 0.94, "ap_ut": 1.04}}, "ap_ut_dai"),
])
def test_bien_the_ra_dung_nhan(bien, ma):
    kq = ctd.do_tay(_anh(_tay(**bien)), 0.75, "phai")
    assert kq["hop_le"], kq
    nhan = {n["ma"]: n for n in kq["nhan"]}
    assert ma in nhan and nhan[ma]["vua"] is False


@pytest.mark.parametrize("tay_chon, tay_that", [("phai", "trai"), ("trai", "phai")])
def test_mu_ban_tay_hoac_sai_tay(tay_chon, tay_that):
    """Mu bàn tay phải nhìn như lòng bàn tay trái (và ngược lại) → báo mu bàn tay theo tay người dùng đã chọn."""
    kq = ctd.do_tay(_anh(_tay(), tay_that), 0.75, tay_chon)
    assert kq == {"hop_le": False, "loi": "mu_ban_tay", "so_do": None, "nhan": [], "cung": []}


def test_tay_nam():
    assert ctd.do_tay(_anh(_tay(nam=("tro", "giua", "ap_ut", "ut"))), 0.75, "phai")["loi"] == "tay_nam"
    assert ctd.do_tay(_anh(_tay(nam=("ut",))), 0.75, "phai")["loi"] == "tay_nam"


def test_nghieng_qua():
    assert ctd.do_tay(_anh(_tay(dep=0.35)), 0.75, "phai")["loi"] == "nghieng_qua"      # tay quay cạnh vào máy
    ngan = [(x, y * 0.4) for x, y in _tay()]                                              # ngón chĩa vào máy: lòng co dọc
    assert ctd.do_tay(_anh(ngan), 0.75, "phai")["loi"] == "nghieng_qua"


def test_khong_du_diem():
    p = _anh(_tay())
    assert ctd.do_tay(p[:20], 0.75, "phai")["loi"] == "khong_du_diem"
    assert ctd.do_tay([[0.5, 0.5]] * 21, 0.75, "phai")["loi"] == "khong_du_diem"
    assert ctd.do_tay(_anh(_tay(), cao=0.02), 0.75, "phai")["loi"] == "khong_du_diem"      # tay quá nhỏ trong ảnh
    assert ctd.do_tay([[0.5, float("nan")]] + p[1:], 0.75, "phai")["loi"] == "khong_du_diem"
    with pytest.raises(ValueError):
        ctd.do_tay(p, 0.75, "giua")


@pytest.mark.parametrize("tay", ["phai", "trai"])
def test_cung_nam_dung_phia_va_trong_anh(tay):
    p = _anh(_tay(), tay, goc=10)
    kq = ctd.do_tay(p, 0.75, tay)
    vt = {c["ma"]: c["vt"] for c in kq["cung"]}
    assert list(vt) == ["ly", "khon", "doai", "can", "kham", "can_co", "chan", "ton", "minh_duong"]
    assert all(0 <= x <= 1 and 0 <= y <= 1 for x, y in vt.values())
    cai = p[2][0]                                    # gốc ngón cái (x ảnh)
    ut = p[17][0]
    gan = lambda ma, q: abs(vt[ma][0] - q)          # noqa: E731
    for ben_cai in ("chan", "ton", "can_co"):
        assert gan(ben_cai, cai) < gan(ben_cai, ut), ben_cai
    for ben_ut in ("doai", "can", "khon"):
        assert gan(ben_ut, ut) < gan(ben_ut, cai), ben_ut
    assert vt["ly"][1] < vt["minh_duong"][1] < vt["kham"][1]           # trên → dưới khi cổ tay ở dưới
    # Minh Đường nằm trong tam giác cổ tay – gốc ngón trỏ – gốc ngón út
    md = vt["minh_duong"]
    assert min(p[0][1], p[5][1], p[17][1]) < md[1] < max(p[0][1], p[5][1], p[17][1])


def test_cung_trong_so_tong_bang_1_va_khop_do_hinh():
    ids = {p["id"] for p in kb._d()["do_hinh"]["diem"]}
    for ma, c in kb.cung_tay().items():
        assert ma in ids
        assert abs(sum(c["trong_so"].values()) - 1) < 1e-9
        assert all(0 <= int(k) <= 20 for k in c["trong_so"])


def test_cung_tay_trai_khop_do_hinh_sach():
    """Đồ hình sách vẽ tay trái (ngón cái bên trái); chiếu tay trái mẫu → thứ tự trái/phải của các cung giống đồ hình."""
    kq = ctd.do_tay(_anh(_tay(), "trai", ty_le=957 / 1224, cao=0.38, tam=(0.5, 0.6)), 957 / 1224, "trai")
    assert kq["hop_le"], kq
    vt = {c["ma"]: c["vt"] for c in kq["cung"]}
    hinh = {p["id"]: p["vt"] for p in kb._d()["do_hinh"]["diem"]}
    for a_, b_ in (("chan", "doai"), ("ton", "khon"), ("can_co", "can"), ("ton", "ly"), ("ly", "khon")):
        assert (vt[a_][0] < vt[b_][0]) == (hinh[a_][0] < hinh[b_][0]), (a_, b_)
    for a_, b_ in (("ly", "minh_duong"), ("minh_duong", "kham"), ("khon", "can")):
        assert (vt[a_][1] < vt[b_][1]) == (hinh[a_][1] < hinh[b_][1]), (a_, b_)


def test_nguong_o_kb_va_can_doi_chieu():
    cfg = kb.do_tay_cfg()
    assert cfg["can_doi_chieu"] is True
    ng = cfg["nguong"]
    assert ng["ngon_ngan"] < ng["ngon_dai"] and ng["long_dai"] < ng["long_rong"] and ng["ap_ut_dai"] < ng["tro_dai"]
    assert set(cfg["loi"]) == set(ctd.LOI)
    assert set(cfg["nhan"]) == {m for t in ctd.TRUC.values() for m in t}


# --- KB sách theo số đo / theo cung -------------------------------------------------------------------------------
def test_sach_do_tay_va_cung_qua_bo_kiem():
    van = sach_ghi.van_nguon("than_tuong_toan_bien")
    d = kb._d()
    so = 0
    for vt, m in sach_ghi.cac_muc({"a": d["sach_do_tay"], "b": d["cung_tay"]}):
        so += 1
        assert sach_ghi.kiem_muc(m, vt) == []
        assert "han_kho" not in m and m["han"] in van
    assert so >= 25
    # Không dùng câu Ngọc Chưởng Ký (玉掌記): bản này đặt các cung đó lên MẶT (乾〔右頤下〕…). Câu cung lấy từ «根基所屬».
    ngoc = next(t["van"] for t in json.loads((sach_ghi._NGUON / "than_tuong_toan_bien.json").read_text("utf-8"))["thien"]
                if t["ten"].endswith("玉掌記"))
    can_co = next(t["van"] for t in json.loads((sach_ghi._NGUON / "than_tuong_toan_bien.json").read_text("utf-8"))["thien"]
                  if t["ten"].endswith("根基所屬"))
    for ma, cg in kb.cung_tay().items():
        assert cg["vai"]["nhom"] == "A" and cg["vai"]["han"] in can_co, ma
        for ds in cg["sach"].values():
            for m in ds:
                assert sach_ghi.chuan(m["han"]) not in sach_ghi.chuan(ngoc), m["ma"]
    nhan = set(d["do_tay"]["nhan"])
    assert set(k for k in d["sach_do_tay"] if not k.startswith("_")) <= nhan
    for ma, c in kb.cung_tay().items():
        assert set(c["sach"]) <= {x["ma"] for x in c["lua_chon"]}, ma
        assert 3 <= len(c["lua_chon"]) <= 4


def test_ghim_do_hinh_khong_nhom_c_va_khong_ngoc_chuong_ky():
    """Ghim công khai trên đồ hình: câu mặc định là A/B từ «根基所屬» / «論手», không câu nhóm C, không câu Ngọc Chưởng Ký."""
    thien = json.loads((sach_ghi._NGUON / "than_tuong_toan_bien.json").read_text("utf-8"))["thien"]
    ngoc = sach_ghi.chuan(next(t["van"] for t in thien if t["ten"].endswith("玉掌記")))
    ghim = {p["id"]: p for p in kb._d()["do_hinh"]["diem"]}
    for ma in kb.cung_tay():
        p = ghim[ma]
        assert p["muc"] in ("A", "B") and p["sach_ghi"]["han"] not in ngoc and "han_kho" not in p["sach_ghi"], ma
    assert "áp út" in ghim["chu"]["y"] and "ngón giữa là chủ" in ghim["chu"]["y"]


def test_doc_do_tay_nhom_c_theo_tuoi():
    kq = ctd.do_tay(_anh(_tay(ngon=1.2)), 0.75, "phai")
    r = kb.ket_qua_do_tay(kq, "phai", None)
    assert r["hop_le"] and [m["ma"] for m in r["sach_ghi"]] == ["ngon-thon-dai", "long-thon-ho", "chu-khach-tuong-xung"]
    assert all(m["loi"].startswith("Sách xưa ghi «") for m in r["sach_ghi"])
    loi = kb.ket_qua_do_tay(ctd.do_tay(_anh(_tay(), "trai"), 0.75, "phai"), "phai", 30)
    assert loi["hop_le"] is False and loi["loi"] == "mu_ban_tay" and "tay phải" in loi["loi_nhac"]


def test_doc_theo_cung():
    r = kb.doc([], None, {"chan": "trung", "ly": "day", "minh_duong": "phang", "doai": "binh"})
    ma = [m["ma"] for m in r["muc_cung"]]
    assert ma == ["ly-cao", "minh-duong-phang"] and r["bo_nhom_c"] == 1      # A trước B; C bỏ vì chưa rõ tuổi
    assert r["muc_cung"][0]["loi"].startswith("Sách xưa ghi «若起文官加祿位仕者為官入廟堂»")
    assert r["muc_cung"][0]["cung"] == "ly" and r["muc_cung"][0]["lua_chon"] == "day"
    r = kb.doc([], 30, {"chan": "trung", "ly": "day"})
    assert [m["ma"] for m in r["muc_cung"]] == ["ly-cao", "chan-ham"] and r["bo_nhom_c"] == 0
    c = r["muc_cung"][1]
    assert "am" not in c and c["loi"].startswith("Sách xưa có nhắc «低陷此宮妻有剋». Hàm ý")
    assert r["cau_ket"].startswith(sach_ghi.CAU_KET)
    r = kb.doc([], 30, {"can_co": "van_cat"})                                  # một lựa chọn → hai câu (B rồi C)
    assert [m["ma"] for m in r["muc_cung"]] == ["can-co-ban-co", "can-co-phi-cham"]
    assert kb.doc([], 30, {"ly": "van_cat"})["muc_cung"][0]["ma"] == "ly-ham"   # sách gộp "trũng" với "vân phá"


# --- route --------------------------------------------------------------------------------------------------------
@pytest.fixture(scope="module")
def may():
    return TestClient(app)


def _than(**k):
    return {"dong_y": True, "tay": "phai", "ty_le": 0.75, "diem": _anh(_tay(ngon=1.2)), **k}


def test_route_do_tay(may):
    r = may.post("/v1/chi-tay/do-tay", json=_than(ngay_sinh="1990-05-01"))
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ("hop_le", "loi", "loi_nhac", "so_do", "nhan", "sach_ghi", "cung", "bo_nhom_c", "cau_ket"):
        assert k in j
    assert j["hop_le"] is True and j["loi"] is None
    assert set(j["so_do"]) == {"dai_long", "rong_long", "ngon", "tro_ap_ut"}
    assert set(j["so_do"]["ngon"]) == {"cai", "tro", "giua", "ap_ut", "ut"}
    assert {"ma", "ten", "vua"} <= set(j["nhan"][0])
    assert {"ma", "han", "nhom", "loi"} <= set(j["sach_ghi"][0])
    c = j["cung"][0]
    assert {"ma", "han", "ten", "vt", "y", "vai", "lua_chon"} <= set(c) and c["lua_chon"][0].keys() == {"ma", "ten"}
    assert set(c["vai"]) == {"han", "am", "loi"} and c["vai"]["loi"].startswith("Sách xưa ghi «")
    chu = json.dumps(j, ensure_ascii=False)
    assert not re.search(r"han_kho|trong_so|nguong|_ghi_chu|_nguon|sach_do_tay|wikisource|mediapipe", chu, re.I)


def test_route_do_tay_loi(may):
    r = may.post("/v1/chi-tay/do-tay", json=_than(diem=_anh(_tay(), "trai")))
    assert r.status_code == 200 and r.json()["hop_le"] is False and r.json()["loi"] == "mu_ban_tay"
    assert r.json()["loi_nhac"] and r.json()["cung"] == [] and r.json()["so_do"] is None


@pytest.mark.parametrize("sua", [
    {"dong_y": False}, {"dong_y": "true"}, {"dong_y": 1}, {"tay": "giua"}, {"ty_le": 0},
    {"diem": [[0.5, 0.5]] * 20}, {"diem": [[0.5, 0.5]] * 22}, {"diem": [[0.5, 1.2]] * 21}, {"diem": [[0.5, 0.5, 0.1]] * 21},
    {"anh": "data:image/png;base64,AAAA"}, {"ngay_sinh": "abc"},
])
def test_route_do_tay_422(may, sua):
    assert may.post("/v1/chi-tay/do-tay", json=_than(**sua)).status_code == 422


def test_route_do_tay_thieu_dong_y(may):
    t = _than()
    t.pop("dong_y")
    assert may.post("/v1/chi-tay/do-tay", json=t).status_code == 422


def test_route_doc_cung(may):
    r = may.post("/v1/chi-tay/doc", json={"cung": {"ly": "day", "khon": "van_cat"}})
    assert r.status_code == 200 and [m["ma"] for m in r.json()["muc_cung"]] == ["ly-cao"] and r.json()["bo_nhom_c"] == 1
    r = may.post("/v1/chi-tay/doc", json={"cung": {"khon": "van_cat"}, "van": ["bai-tuong"], "ngay_sinh": "1990-05-01"})
    assert [m["ma"] for m in r.json()["muc_cung"]] == ["khon-van-loan"] and [m["ma"] for m in r.json()["muc"]] == ["bai-tuong"]
    assert "han_kho" not in r.text
    for sai in ({"cung": {"ly": "xxx"}}, {"cung": {"zz": "day"}}, {}, {"van": [], "cung": {}}, {"cung": {"ton": "phang"}}):
        assert may.post("/v1/chi-tay/doc", json=sai).status_code == 422, sai
