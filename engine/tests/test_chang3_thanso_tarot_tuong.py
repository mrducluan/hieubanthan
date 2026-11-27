# -*- coding: utf-8 -*-
"""Chặng 3.2 & 3.3 — Đối chiếu Tướng–Mệnh (Saint-Germain 1897), Thần số 5 phái & Tarot 56 lá Ẩn Phụ ngược."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import nhan_tuong as nt_calc, tarot as tr_calc
from app.luangiai import doi_song_khuon as dsk
from app.luangiai import tarot_chieu_sau as tcs, thanso_da_phai as tsdp, tuong_menh_doi_chieu as tmdc
from app.main import app
from tests import _dau_ra as dr

ROOT = Path(__file__).resolve().parents[1]
NGUON = ROOT / "fixtures" / "nguon"
KB_DIR = ROOT / "app" / "kb" / "data"
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_C = TestClient(app)
_TEP_MOI = ("su_vu_chien_thuat_kb.json", "tuong_menh_doi_chieu_kb.json", "thanso_da_phai_kb.json", "tarot_an_phu_nguoc_kb.json")


def _doan(ten: str) -> list[str]:
    return [p for c in json.loads((NGUON / ten).read_text("utf-8"))["chuong"] for p in c.get("doan", [])]


def _kb(ten: str, en: bool = False) -> dict:
    return json.loads((KB_DIR / ("en/" + ten if en else ten)).read_text("utf-8"))


# ------------------------------------------------------------------ nguồn & KB
def test_bon_kb_moi_co_source_id_school_id_ca_ban_anh():
    for ten in _TEP_MOI:
        for en in (False, True):
            d = _kb(ten, en)
            assert d.get("source_id") and d.get("school_id"), (ten, en)
    for en in (False, True):
        for cid, m in _kb("tarot_an_phu_nguoc_kb.json", en)["la_an_phu"].items():
            assert m.get("source_id") and m.get("school_id"), cid
        sv = _kb("su_vu_chien_thuat_kb.json", en)
        for ma, th in sv["tinh_huong"].items():
            for k in ("trich_ky_mon", "trich_luc_hao"):
                assert th[k].get("source_id") and th[k].get("school_id"), (ma, k)
        sg = _kb("tuong_menh_doi_chieu_kb.json", en)["saint_germain_1897"]
        assert sg.get("source_id") and sg.get("school_id")


def test_saint_germain_trich_tron_cau_trong_mot_doan_va_khong_cau_suc_khoe():
    doan = _doan("chi_tay_saint_germain_1897.json")
    for en in (False, True):
        sg = _kb("tuong_menh_doi_chieu_kb.json", en)["saint_germain_1897"]
        assert "Practical Palmistry" in sg["sach"]
        for ma, item in sg["muc"].items():
            q = item["nguyen_van_en"]
            assert len(q) >= 30 and any(q in p for p in doan), f"Lệch nguyên văn Saint-Germain ở {ma}"
            assert q.rstrip().endswith((".", "”", '"')), f"Câu cắt giữa chừng ở {ma}: {q}"   # trọn câu
            assert not re.search(r"brain|blood|disease|death|illness|consumption", q, re.I), ma   # TK-2 / SK-1
            assert "Saint-Germain" not in item["y_ung_dung"]   # tên sách chỉ ở trường `sach`


def test_thanso_trich_la_chuoi_con_mot_doan_va_dung_con_so():
    bl_doan = _doan("thanso_balliett_philosophy_1908.json")
    tc = _kb("thanso_da_phai_kb.json")["trich_co_dien"]
    assert "westcott_1911" not in tc and "sepharial_kabala" not in tc   # câu tiểu sử / câu chung đã bỏ
    for so, q in tc["balliett_1908"]["theo_so"].items():
        assert any(q in p for p in bl_doan), so
        assert re.search(rf"\b{so}\b", q) and re.search(r"birth", q, re.I), (so, q)   # nói về đúng birth number đó
    def chuan(x: str) -> str:   # cùng cách so của TK-2 (chữ OCR: bỏ dấu câu, hoa thường, nối đoạn)
        return " ".join(re.sub(r"[^a-z0-9]+", " ", x.lower()).split())
    wc = chuan(" ".join(_doan("thanso_westcott_numbers_1911.json")))
    for so in range(1, 10):
        q = tsdp._westcott(so)
        assert q and chuan(q["nguyen_van"]) in wc, so
    cheiro = chuan(" ".join(_doan("thanso_cheiro_book_of_numbers_1926.json")))
    with ngon_ngu.dung("vi"):
        r = tsdp.doi_chieu_da_phai(ngay_sinh=dt.date(1988, 11, 22), ho_ten="Le Hoang Nam", ngay_xem=dt.date(2026, 11, 27))
    ch = next(p for p in r["nam_phai"] if p["ma"] == "chaldea_cheiro")
    assert ch["trich_nguon"] and "Cheiro" in ch["trich_nguon"]["sach"] and "Sepharial" not in ch["trich_nguon"]["sach"]
    assert chuan(ch["trich_nguon"]["nguyen_van_en"]) in cheiro


def test_tarot_56_an_phu_nguoc_khop_waite_1910_va_mathers_1888():
    tw = json.loads((NGUON / "tarot_waite_1910.json").read_text("utf-8"))
    tm = json.loads((NGUON / "tarot_mathers_1888.json").read_text("utf-8"))
    tr_kb = _kb("tarot_an_phu_nguoc_kb.json")
    assert len(tr_kb["la_an_phu"]) == 56
    for cid, m in tr_kb["la_an_phu"].items():
        w_expected = tw[cid]["y_nguoc"] or tw[cid].get("them_nguoc")
        assert m["trich_waite_1910_nguoc"] == w_expected, cid
        assert m["trich_mathers_1888_nguoc"] == tm[cid]["y_nguoc"], cid


def test_tarot_56_loi_rieng_tung_la_khong_khuon_va_khong_giong_ai():
    cam = [re.compile(rf"(?<!\w){re.escape(c.lower())}(?!\w)") for c in dsk.cum_cam_chung()]
    for en in (False, True):
        la = _kb("tarot_an_phu_nguoc_kb.json", en)["la_an_phu"]
        for k in ("chieu_nguoc_go_mo", "viec_nho_go_nut", "cau_hoi_tu_soi"):
            vals = [m[k] for m in la.values()]
            assert len(set(vals)) == 56, f"Lời {k} lặp giữa các lá ({'en' if en else 'vi'})"
        for cid, m in la.items():
            s = " ".join((m["chieu_nguoc_go_mo"], m["viec_nho_go_nut"], m["cau_hoi_tu_soi"]))
            assert "((" not in s and "(Gậy (" not in s and "(Wands (" not in s, cid
            if en:
                assert not _VIET.search(s), cid
            else:
                assert "nên chú ý" in m["chieu_nguoc_go_mo"].lower(), cid   # không phán, nói bằng "nên chú ý"
                for pat in cam:
                    assert not pat.search(s.lower()), (cid, pat.pattern)
    # Át Gậy ngược: Waite = sa sút / niềm vui bị che — lời không được nói ngược ("chín muồi")
    assert "chín muồi" not in _kb("tarot_an_phu_nguoc_kb.json")["la_an_phu"]["gay_1"]["chieu_nguoc_go_mo"]


def test_tarot_chieu_sau_khong_doc_fixtures_luc_chay():
    src = Path(tcs.__file__).read_text("utf-8")
    assert "fixtures" not in src.split('"""', 2)[2] and "read_text" not in src


def test_tarot_pham_gia_dung_calc_book_t():
    # Book T: Lửa–Đất, Nước–Khí là HỢP (không phải trung tính); Lửa–Nước, Khí–Đất nghịch; cùng nguyên tố mạnh lên.
    assert tr_calc.pham_gia("hoa", "dat") == "hop" and tr_calc.pham_gia("thuy", "khi") == "hop"
    ds = [{"id": "gay_1", "nguoc": True}, {"id": "tien_3"}, {"id": "kiem_2"}, {"id": "coc_4"}, {"id": "gay_5"}, {"id": "gay_6"}]
    r = tcs.phan_tich_chieu_sau(ds)
    assert [x["quan_he"] for x in r["pham_gia_nguyen_to"]] == ["tuong_tro", "doi_nghich", "tuong_tro", "doi_nghich", "cung_nguyen_to"]
    assert "trung_tinh" not in _kb("tarot_an_phu_nguoc_kb.json")["pham_gia_chuoi"]
    for v in _kb("tarot_an_phu_nguoc_kb.json")["pham_gia_chuoi"].values():
        assert "Lá giữa" not in v and "Hai lá" in v   # lời nói về một CẶP lá kề nhau


# ------------------------------------------------------------------ tướng – mệnh
def test_tuong_menh_luu_nien_nam_ta_nu_huu_va_tuoi_mu_am_lich():
    ngay = dt.date(2027, 1, 20)   # trước Tết 2027: năm âm vẫn 2026
    nam = tmdc.doi_chieu_tuong_menh(ngay_sinh=dt.date(1990, 5, 15), gioi_tinh="nam", ngay_xem=ngay)
    nu = tmdc.doi_chieu_tuong_menh(ngay_sinh=dt.date(1990, 5, 15), gioi_tinh="nu", ngay_xem=ngay)
    assert nam["goc_tuong_luu_nien"]["tuoi_mu"] == 37 == nu["goc_tuong_luu_nien"]["tuoi_mu"]
    ln_nam, ln_nu = nt_calc.luu_nien(37, "nam"), nt_calc.luu_nien(37, "nu")
    assert nam["goc_tuong_luu_nien"]["bo_vi_ma"] == ln_nam["bo_vi"]
    assert ln_nam["ben"] != ln_nu["ben"] and "trái" in nam["goc_tuong_luu_nien"]["loi_quan_sat"] and "phải" in nu["goc_tuong_luu_nien"]["loi_quan_sat"]
    gia = tmdc.doi_chieu_tuong_menh(ngay_sinh=dt.date(1927, 3, 1), ngay_xem=dt.date(2026, 11, 27))
    assert gia["goc_tuong_luu_nien"]["tuoi_mu"] == 100   # không kẹp 99


def test_tuong_menh_nam_can_chi_doi_o_lap_xuan():
    r = tmdc.doi_chieu_tuong_menh(ngay_sinh=dt.date(1990, 5, 15), ngay_xem=dt.date(2027, 1, 20))
    assert r["goc_menh_nam_nay"]["can_chi_nam"] == "Bính Ngọ" and r["goc_menh_nam_nay"]["nam_xem"] == 2026
    r2 = tmdc.doi_chieu_tuong_menh(ngay_sinh=dt.date(1990, 5, 15), ngay_xem=dt.date(2027, 2, 10))
    assert r2["goc_menh_nam_nay"]["can_chi_nam"] == "Đinh Mùi"


def test_api_tuong_menh_doi_chieu_song_ngu_va_tuoi_16():
    nho = _C.post("/v1/nhan-tuong/doi-chieu-menh", json={"ngay_sinh": "2014-05-10", "ngay_xem": "2026-11-27"}).json()
    assert nho["chuyen_huong_tuoi"]["tuoi"] < 16 and "goc_menh_nam_nay" not in nho
    p = {"ngay_sinh": "1990-05-15", "gioi_tinh": "nam", "gio_sinh": "08:30", "do_lech_hai_tay": "thuan_troi", "ngay_xem": "2026-11-27"}
    vi = _C.post("/v1/nhan-tuong/doi-chieu-menh", json=p).json()
    en = _C.post("/v1/nhan-tuong/doi-chieu-menh", json=p, headers={"x-ngon-ngu": "en"}).json()
    assert "diem" not in vi and vi["goc_tuong_luu_nien"]["tuoi_mu"] == 37
    assert len(vi["goc_chi_tay_dong_tay"]["diem_doi_chieu"]) == 3
    assert not _VIET.search(json.dumps(en, ensure_ascii=False)), en
    assert dr.khung(vi) == dr.khung(en)
    # người sinh trước 1930 vẫn xem được
    assert _C.post("/v1/nhan-tuong/doi-chieu-menh", json={"ngay_sinh": "1925-04-01", "ngay_xem": "2026-11-27"}).status_code == 200


# ------------------------------------------------------------------ thần số 5 phái
@pytest.mark.parametrize("ho_ten", ["", "   "])
def test_thanso_5_phai_khong_ho_ten_khong_loi(ho_ten):
    r = _C.post("/v1/thanso/doi-chieu-phai", json={"ngay_sinh": "1988-11-22", "ho_ten": ho_ten, "ngay_xem": "2026-11-27"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["co_ho_ten"] is False
    ch = next(p for p in j["nam_phai"] if p["ma"] == "chaldea_cheiro")
    assert ch["can_ho_ten"] is True and ch["chi_so_chinh"] == "22/4"


def test_thanso_nam_ca_nhan_moc_1_1_la_so_nguyen():
    r = tsdp.doi_chieu_da_phai(ngay_sinh=dt.date(1988, 11, 22), ngay_xem=dt.date(2026, 3, 1))
    from app.calc import thanso
    assert isinstance(r["nam_ca_nhan"], int) and r["nam_ca_nhan"] == thanso.nam_ca_nhan(22, 11, 2026, moc="duong_lich")
    assert "(" not in r["nam_phai"][0]["nhan_xet"].split(".")[0]


def test_bon_route_khong_lo_ten_noi_bo_bm1():
    from tests.test_cong_khai import _lo
    goi = [("/v1/thanso/doi-chieu-phai", {"ngay_sinh": "1988-11-22", "ho_ten": "Nguyen Van Minh", "ngay_xem": "2026-11-27"}),
           ("/v1/tarot/chieu-sau", {"la": [{"id": "gay_1", "nguoc": True}, {"id": "dai_0", "nguoc": True}]}),
           ("/v1/nhan-tuong/doi-chieu-menh", {"ngay_sinh": "1990-05-15", "ngay_xem": "2026-11-27"}),
           ("/v1/co-van/su-vu", {"cau_hoi": "Cần chuẩn bị gì cho buổi ký hợp đồng?", "tinh_huong": "ky_ket_hop_dong",
                                 "ngay_xem": "2026-12-01", "gio_xem": "09:00", "hat_giong": "abcd"})]
    for lang in ("vi", "en"):
        for duong, p in goi:
            r = _C.post(duong, json=p, headers={"x-ngon-ngu": lang})
            assert r.status_code == 200 and not _lo(r.json()), (duong, lang, _lo(r.json()))


def test_thanso_ten_sach_chi_o_can_cu():
    sach = ("Balliett", "Westcott", "Sepharial", "Cheiro", "Phillips")
    for lang in ("vi", "en"):
        with ngon_ngu.dung(lang):
            r = tsdp.doi_chieu_da_phai(ngay_sinh=dt.date(1988, 11, 22), ho_ten="Nguyen Van Minh", ngay_xem=dt.date(2026, 11, 27))
        for p in r["nam_phai"]:
            assert not any(s in p["nhan_xet"] for s in sach), (lang, p["ma"], p["nhan_xet"])
        assert not any(s in r["khung"]["phu_de"] for s in sach)


def test_api_thanso_5_phai_va_tarot_chieu_sau_song_ngu():
    p_ts = {"ngay_sinh": "1988-11-22", "ho_ten": "Nguyen Van Minh", "ngay_xem": "2026-11-27"}
    vi_ts = _C.post("/v1/thanso/doi-chieu-phai", json=p_ts).json()
    en_ts = _C.post("/v1/thanso/doi-chieu-phai", json=p_ts, headers={"x-ngon-ngu": "en"}).json()
    assert len(vi_ts["nam_phai"]) == 5 and "diem" not in vi_ts
    assert not _VIET.search(json.dumps(en_ts, ensure_ascii=False)), en_ts
    assert dr.khung(vi_ts) == dr.khung(en_ts)
    loi = _C.post("/v1/thanso/doi-chieu-phai", json={"ngay_sinh": "1890-01-01"}, headers={"x-ngon-ngu": "en"})
    assert loi.status_code == 422 and not _VIET.search(loi.json()["detail"])

    p_tr = {"la": [{"id": "gay_1", "nguoc": True}, {"id": "kiem_3", "nguoc": False},
                   {"id": "coc_2", "nguoc": True}, {"id": "dai_0", "nguoc": True}]}
    vi_tr = _C.post("/v1/tarot/chieu-sau", json=p_tr).json()
    en_tr = _C.post("/v1/tarot/chieu-sau", json=p_tr, headers={"x-ngon-ngu": "en"}).json()
    assert vi_tr["so_la_nguoc"] == 3
    # Lửa–Khí hợp; Khí–Nước hợp (Book T); Nước–Khí (Chàng Khờ = Khí) hợp
    assert [x["quan_he"] for x in vi_tr["pham_gia_nguyen_to"]] == ["tuong_tro", "tuong_tro", "tuong_tro"]
    assert not _VIET.search(json.dumps(en_tr, ensure_ascii=False)), en_tr
    assert dr.khung(vi_tr) == dr.khung(en_tr)
    for la in vi_tr["la_nguoc"]:
        assert la["can_cu"] and not any(s in la["chieu_nguoc_go_mo"] for s in ("Waite", "Mathers", "Book T"))


def test_chaldea_khong_gan_cau_phan_xau_vao_ket_qua_ca_nhan():
    # "Nguyen Van An" → số kép 43, Cheiro ghi "This is an unfortunate number." — không đặt lên kết quả của chính người đọc.
    from fastapi.testclient import TestClient
    from app.main import app
    d = TestClient(app).post("/v1/thanso/doi-chieu-phai", json={"ngay_sinh": "1988-10-24", "ho_ten": "Nguyen Van An"}).json()
    ch = next(p for p in d["nam_phai"] if p["ma"] == "chaldea_cheiro")
    assert ch["chi_so_chinh"].startswith("43/")
    assert ch["trich_nguon"] is None
