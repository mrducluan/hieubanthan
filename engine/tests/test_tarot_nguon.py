# TR-1b — đối chiếu KB Tarot với NGUYÊN VĂN nguồn phạm vi công cộng (không phải tóm ý):
#   · Waite 1910: Project Gutenberg #43548 (de Laurence 1918 in lại nguyên văn The Pictorial Key to the Tarot) → fixtures/nguon/tarot_waite_1910.json
#   · Book T (Golden Dawn): bản chép archive.org "book-t-the-tarot" (OCR) → fixtures/nguon/tarot_book_t.json
# Mọi câu `trich` trong KB phải là chuỗi con đúng từng chữ của nguồn; tên Book T, bảng decan, luật phẩm giá phải khớp nguồn.
import json, re
from pathlib import Path

import pytest

from app.calc import tarot as calc
from app.kb import tarot_kb as kb

NGUON = Path(__file__).resolve().parents[1] / "fixtures" / "nguon"
WAITE = json.loads((NGUON / "tarot_waite_1910.json").read_text(encoding="utf-8"))
BOOK_T = json.loads((NGUON / "tarot_book_t.json").read_text(encoding="utf-8"))


def _chuan(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def test_fixture_du_78_la_waite_va_52_la_book_t():
    assert set(calc.BO_BAI) <= set(WAITE)
    assert all(WAITE[m]["y_xuoi"] for m in calc.BO_BAI)
    assert all(WAITE[m].get("y_nguoc") for m in calc.BO_BAI if m != "coc_2")   # Waite không ghi nghĩa ngược cho Hai Cốc
    assert sum(1 for m in calc.BO_BAI if m in BOOK_T) == 52                       # 36 lá số + 16 hoàng gia (Át, ẩn chính không có trong Book T phần này)
    assert "inimical" in BOOK_T["_pham_gia"]


@pytest.mark.parametrize("ma", calc.BO_BAI)
def test_moi_trich_la_nguyen_van_cua_nguon(ma):
    l = kb.mot_la(ma)
    trich = l.get("trich") or []
    assert trich and trich[0]["sach"] == "waite_1910", ma
    for tr in trich:
        assert tr["nghia"].strip(), (ma, tr["sach"])
        if tr["sach"] == "waite_1910":
            w = WAITE[ma]
            kho = _chuan(" ".join([w["y_xuoi"], w.get("y_nguoc", ""), *w["mo_ta"], w.get("them_xuoi", ""), w.get("them_nguoc", "")]))
            assert _chuan(tr["nguyen_van"]) in kho, (ma, tr["nguyen_van"][:60])
            if tr.get("nguyen_van_nguoc"):
                assert _chuan(tr["nguyen_van_nguoc"]) in _chuan(w.get("y_nguoc", "")), (ma, "ngược")
        elif tr["sach"] == "book_t":
            b = BOOK_T[ma]
            assert tr["ten"] == b["ten"], ma
            assert _chuan(tr["nguyen_van"]) in _chuan(b["mo_ta"]), (ma, tr["nguyen_van"][:60])
        else:
            raise AssertionError(f"{ma}: nguồn trích lạ {tr['sach']} — chỉ nguồn đã có fixture nguyên văn")
    # lá có trong Book T thì phải có trích Book T (36 lá số + 16 hoàng gia)
    if ma in BOOK_T:
        assert any(tr["sach"] == "book_t" for tr in trich), ma


def test_ten_book_t_khop_nguon():
    for ma in calc.BO_BAI:
        if ma not in BOOK_T:
            continue
        ten = BOOK_T[ma]["ten"]
        la = kb.mot_la(ma)
        if ma.split("_")[1].isdigit():        # lá số: tên Thoth = tên Book T bỏ "The Lord of"
            mong = re.sub(r"^THE LORD OF ", "", re.sub(r"^The Lord of ", "", ten), flags=re.I)
            assert la["thoth_ten"].lower() == mong.lower(), (ma, la["thoth_ten"], ten)
        else:                                 # hoàng gia: tên đầy đủ, bỏ mạo từ (OCR "he King" của Book T là lỗi quét)
            mong = _chuan(re.sub(r"\b[Tt]he\b ?", "", ten).replace("; he ", "; "))
            co = _chuan(re.sub(r"\b[Tt]he\b ?", "", la["thoth_ten"]))
            assert co.lower() == mong.lower(), (ma, la["thoth_ten"], ten)
        assert la["truong_phai"]["thoth"]["ten"] == la["thoth_ten"], ma


# Book T: "Commencing from the sign Aries, the Central Decans of each sign follow the order of the Days of the Week";
# hành tinh 36 decan xoay vòng Chaldea Hoả → Mặt Trời → Kim → Thuỷ → Mặt Trăng → Thổ → Mộc bắt đầu từ Bạch Dương decan 1;
# lá số của decan: bộ theo nguyên tố của cung, số = 2 + 3 × (thứ tự cung trong nhóm nguyên tố) + (decan − 1) — bảng Book T,
# đối chiếu độc lập với kho mã MIT ootk-thoth-engine (`atlas.decan_pip`).
CHALDEA = ["hoa_tinh", "mat_troi", "kim_tinh", "thuy_tinh", "mat_trang", "tho_tinh", "moc_tinh"]
BO_THEO_NGUYEN_TO = {"hoa": "gay", "thuy": "coc", "khi": "kiem", "dat": "tien"}


def _cung_theo_thu_tu():
    cs = kb.cung_hoang_dao()
    return sorted(cs, key=lambda k: ((cs[k]["tu"][0] - 3) % 12, cs[k]["tu"][1]))   # Bạch Dương (tháng 3) đứng đầu


def test_bang_decan_36_la_khop_book_t():
    thu_tu = _cung_theo_thu_tu()
    assert len(thu_tu) == 12 and thu_tu[0] == "bach_duong"
    cs = kb.cung_hoang_dao()
    assert "Commencing from the sign Aries" in BOOK_T["_decan_mo_dau"]
    for i, cung in enumerate(thu_tu):
        for third in range(3):
            d_idx = i * 3 + third
            assert cs[cung]["decan"][third][2] == CHALDEA[d_idx % 7], (cung, third)
            so = 2 + 3 * (i % 3) + third
            ma = f"{BO_THEO_NGUYEN_TO[cs[cung]['nguyen_to']]}_{so}"
            d = calc.decan(ma)
            assert d and d["cung"] == cung and d["so"] == third + 1 and d["hanh_tinh"] == CHALDEA[d_idx % 7], (ma, d)
            # Book T ghi đúng hành tinh + cung ở mô tả lá ("the symbols of Saturn and Leo")
            ten_ht = {"hoa_tinh": "Mars", "mat_troi": "Sun", "kim_tinh": "Venus", "thuy_tinh": "Mercury", "mat_trang": "Moon", "tho_tinh": "Saturn", "moc_tinh": "Jupiter"}[CHALDEA[d_idx % 7]]
            co_ht = ten_ht in BOOK_T[ma]["mo_ta"] or (ten_ht == "Moon" and "Crescent moon" in BOOK_T[ma]["mo_ta"])   # Hai Kiếm vẽ ký hiệu trăng lưỡi liềm
            assert co_ht and cs[cung]["en"] in BOOK_T[ma]["mo_ta"], (ma, ten_ht, cs[cung]["en"])


def test_luat_pham_gia_khop_book_t():
    t = BOOK_T["_pham_gia"]
    assert "Swords are inimical to Pentacles" in t and "Wands are inimical to Cups" in t
    assert "Swords are friendly with Cups and Wands" in t and "Wands are friendly with Swords and Pentacles" in t
    assert "If a card fall between two other which are mutually contrary, it is not much affected by either" in t
    # Kiếm (Khí) ↔ Tiền (Đất) xung; Gậy (Lửa) ↔ Cốc (Nước) xung; Khí hợp Nước và Lửa; Lửa hợp Khí và Đất; cùng nguyên tố = mạnh
    assert calc.pham_gia("khi", "dat") == "xung" and calc.pham_gia("hoa", "thuy") == "xung"
    assert calc.pham_gia("khi", "thuy") == "hop" and calc.pham_gia("khi", "hoa") == "hop"
    assert calc.pham_gia("hoa", "khi") == "hop" and calc.pham_gia("hoa", "dat") == "hop"
    assert calc.pham_gia("hoa", "hoa") == "manh"
    # lá giữa hai lá xung nhau → triệt tiêu (giữ nguyên sức)
    assert calc.suc_la("hoa", "khi", "dat")["suc"] == "binh"


def test_phuong_phap_celtic_co_trong_waite():
    pp = WAITE["_phuong_phap"]
    assert any("Significator" in d for d in pp["celtic"])
    tb = kb.trai_bai()["celtic"]
    assert len(tb["vi_tri"]) == 10


def test_kb_ghi_doi_chieu():
    dc = kb._d()["doi_chieu"]
    assert set(dc) >= {"waite_1910", "book_t"}
    assert all((NGUON / Path(v["tep"]).name).exists() for v in dc.values())
