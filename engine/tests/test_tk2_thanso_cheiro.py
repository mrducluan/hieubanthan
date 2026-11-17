# -*- coding: utf-8 -*-
"""TK-2 việc 1 — phái Chaldea đối chiếu với chính sách của Cheiro + câu sách trên trang số.

Kho nguồn `fixtures/nguon/thanso_*.json` là lớp chữ máy nhận dạng (chưa hiệu đính, `can_doi_chieu`), nên:

1. BẢNG CHỮ. Trang in bảng chữ (chương XII) bị máy đọc hỏng: chỉ còn "N = O = P = / Q = / R = S = T = U = …", mất
   hết cột số. Bảng được dựng lại từ CHỖ KHÁC trong cùng cuốn sách, nơi sách tự in tên kèm hàng chữ số thẳng cột
   ("GEORGE WASHINGTON 357235 6135153475", "LIVERPOOL 316528773 = 42 = 6"…) và vài chỗ in "chữ = số". Đối chiếu được
   23 / 26 chữ; **Q, X, Z không xuất hiện trong ví dụ nào đọc được → CHƯA đối chiếu được với sách** (giá trị 1, 5, 7
   của engine theo bảng Chaldea phổ biến). Không chữ nào mang số 9 — sách nói rõ.
2. SỐ KÉP 10–52. Mỗi số trong KB có `trich` {en, chuong[, theo]}: câu tiếng Anh lấy nguyên chữ của sách. So khớp sau
   khi chuẩn hoá: chữ thường, chỉ giữ chữ + số (máy đọc làm rơi gần hết dấu chấm câu, nên dấu câu trong `en` là của
   ban biên tập đặt lại — CHỮ thì nguyên văn). 17 số sách không tả riêng ("Has the same meaning as …") mang `theo`.
3. Trang kiến thức: mục "Sách xưa nói gì" mang đúng câu ấy; 12 trang Ý nghĩa số có một câu sách xưa (ban biên tập bổ sung).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.calc import thanso_chaldean as ch
from app.kb import bo_sung, nap, trang

NGUON = Path(__file__).resolve().parents[1] / "fixtures" / "nguon"
CHEIRO = "thanso_cheiro_book_of_numbers_1926.json"
# Nhãn sách hiện công khai (kiểu sách, không tên máy chủ / bản quét) → tệp kho nguồn dùng để so chữ.
SACH_KHO = {
    "Cheiro's Book of Numbers (1926)": CHEIRO,
    "W. Wynn Westcott, Numbers: Their Occult Power and Mystic Virtues (1890; bản in 1911)": "thanso_westcott_numbers_1911.json",
    "The Philosophy of Numbers: Their Tone and Colors (1908)": "thanso_balliett_philosophy_1908.json",
    "How to Attain Success Through the Strength of Vibration (1905)": "thanso_balliett_success_1905.json",
}
# Chương của SÁCH → tên chương trong kho nguồn (đầu đề chương XIII bị máy đọc thành "XI H").
CHUONG = {"XII": "Chapter XII", "XIII": "Chapter XI H", "XXXI": "Chapter XXXI"}


def chuan(s: str) -> str:
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s.lower()).split())


def _kho(ten: str) -> dict:
    return json.loads((NGUON / ten).read_text(encoding="utf-8"))


def _van(ten: str, chuong: str | None = None) -> str:
    return chuan(" ".join(p for c in _kho(ten)["chuong"] if chuong is None or c["so"] == chuong for p in c["doan"]))


def _tho(ten: str) -> str:
    return "\n".join(p for c in _kho(ten)["chuong"] for p in c["doan"])


def _kb() -> dict:
    with ngon_ngu.dat("vi"):
        return nap.doc("thanso_chaldean.json")


# ---------------------------------------------------------------- 1. Bảng chữ
# Hàng "TÊN + chữ số thẳng cột" đúng như kho nguồn chép (mỗi chữ cái ứng một chữ số, theo thứ tự).
HANG = [
    "GEORGE WASHINGTON\n357235 6135153475", "ABRAHAM LINCOLN 1221514 3153735", "GROVER CLEVELAND 327652 335653154",
    "WARREN G HARDING 612255 3 5124153", "WOODROW WILSON 6774276 613375", "CALVIN COOLIDGE 313615 37731435",
    "HERBERT CLARK HOOVER 5522524 33122 577652", "FRANKLIN DELANO ROOSEVELT 82152315 453157 277356534",
    "SAINT LOUIS 31154 37613", "TAUNTON 4165475", "LIVERPOOL 316528773", "GLASGOW 3313376", "WOLVERHAMPTON 6736525148475",
]
# Chỗ sách in "chữ = số" còn đọc được (số 1 hay bị máy đọc thành chữ I; chữ O thành số 0).
TRUC_TIEP = [("J", 1, "J = I 0=7 H = 5 N = 5"), ("O", 7, "J = I 0=7 H = 5 N = 5"), ("Y", 1, "Y = I"),
             ("B", 2, "B = 2 A = I L - 3 D = 4"), ("D", 4, "B = 2 A = I L - 3 D = 4"), ("W", 6, "W = 6"),
             ("L", 3, "L = 3 L = 3"), ("E", 5, "E = 5"), ("R", 2, "R = 2")]
# Tổng của cả từ mà sách nêu bằng lời (số kép) — kiểm chéo thêm.
TONG = {"LLOYD": 18, "GEORGE": 25, "BALDWIN": 22, "AUSTEN": 24, "CHAMBERLAIN": 32, "SIR": 6, "RAMSAY": 12,
        "MACDONALD": 32, "JOHN": 18, "SMITH": 17, "WASHINGTON": 40, "MAINE": 16, "WARATAH": 20, "LEINSTER": 28}
CAU_TONG = ["the first word Lloyd gives the \"compound” number 18", "Takmg the vord George, the \"compound” number is 25",
            "totals up to the number 22", "The compound number 24 is also favourable", "while the compound number of 32",
            "the name Ramsay produces 3 as its simple number and 12 for its compound number", "the compound number 32 is, as m the case",
            "The word Washington works out to the compound number of 40", "the number 16 for its compound number",
            "The number of the word “Waratah” equals 20", "The word “Leinster” gives the compound number of 28"]
CHUA_DOI_CHIEU = {"Q", "X", "Z"}          # không có trong ví dụ nào đọc được của bản chép


def _chu_tu_hang() -> dict[str, set[int]]:
    ra: dict[str, set[int]] = {}
    for h in HANG:
        chu = re.sub(r"[^A-Z]", "", h)
        so = re.sub(r"[^0-9]", "", h)
        assert len(chu) == len(so), h
        for c, n in zip(chu, so):
            ra.setdefault(c, set()).add(int(n))
    return ra


def test_hang_va_cho_in_truc_tiep_co_trong_sach():
    tho = _tho(CHEIRO)
    gon = " ".join(tho.split())
    for h in HANG:
        assert " ".join(h.split()) in gon, h
    for _, _, cau in TRUC_TIEP:
        assert cau in tho, cau
    for cau in CAU_TONG:
        assert cau in tho, cau
    # sách nói rõ: không chữ nào mang số 9; C, G, L, S mang số 3
    assert "no single letter was ascnbed to it" in tho
    assert "a C, a G, an L, or an S, which in the Alphabet I gave in a previous chapter have the number 3" in tho


def test_bang_chu_engine_khop_sach():
    theo_sach = _chu_tu_hang()
    for c, n, _ in TRUC_TIEP:
        theo_sach.setdefault(c, set()).add(n)
    lech = {c: (sorted(v), ch.BANG[c]) for c, v in theo_sach.items() if v != {ch.BANG[c]}}
    assert not lech, f"bảng engine lệch sách: {lech}"
    assert set(ch.BANG) - set(theo_sach) == CHUA_DOI_CHIEU       # đúng 3 chữ chưa có chứng cứ trong sách
    assert len(theo_sach) == 23 and set(ch.BANG.values()) == set(range(1, 9))      # không chữ nào mang số 9
    for tu, tong in TONG.items():
        assert sum(ch.BANG[c] for c in tu) == tong, tu


def test_bang_chu_trong_kb_la_bang_cua_engine():
    kb = _kb()["bang_chu"]
    assert {c: int(so) for so, chu in kb.items() for c in chu.split()} == ch.BANG


def test_hanh_tinh_so_goc_khop_sach():
    """Chương của từng số 1–9 mở bằng "The number n stands in symbolism for (the Planet) X"."""
    ten = {"1": "sun", "2": "moon", "3": "jupiter", "4": "uranus", "5": "mercury", "6": "venus", "7": "neptune", "8": "saturn", "9": "mars"}
    viet = {"sun": "Mặt Trời", "moon": "Mặt Trăng", "jupiter": "Sao Mộc", "uranus": "Sao Thiên Vương", "mercury": "Sao Thuỷ",
            "venus": "Sao Kim", "neptune": "Sao Hải Vương", "saturn": "Sao Thổ", "mars": "Sao Hoả"}
    cac = _kho(CHEIRO)["chuong"]
    goc = _kb()["goc"]
    for i, n in enumerate("123456789"):
        dau = chuan(cac[3 + i]["doan"][0])[:120]
        assert re.search(rf"number \w+ stands \w+( \w+)? symbo\w+ for the (planet )?(\d )?{ten[n]}\b", dau), (n, dau)
        assert goc[n]["hanh_tinh"] == viet[ten[n]]


# ---------------------------------------------------------------- 2. Số kép 10–52
# Sách ghi "n: Has the same meaning as x" (chương XIII) — 17 số không có lời tả riêng.
THEO_SACH = {33: 24, 34: 25, 35: 26, 36: 27, 38: 29, 39: 30, 40: 31, 41: 32, 42: 24, 44: 26, 45: 27, 46: 37, 47: 29,
             48: 30, 49: 31, 50: 32, 52: 43}


def test_moi_so_kep_co_cau_sach():
    kep = _kb()["kep"]
    assert sorted(map(int, kep)) == list(range(10, 53))
    van = {c: _van(CHEIRO, ten) for c, ten in CHUONG.items()}
    vi_tri = []
    for n in range(10, 53):
        tr = kep[str(n)].get("trich")
        assert tr and tr.get("en") and tr.get("chuong") in CHUONG, n
        cau = chuan(tr["en"])
        assert len(cau.split()) >= 5, (n, "câu trích quá ngắn")
        assert len([x for x in re.split(r"(?<=[.!?…])\s+", tr["en"].strip()) if x]) <= 2, (n, "≤ 2 câu")
        p = van[tr["chuong"]].find(cau)
        assert p >= 0, (n, tr["en"])
        if n in THEO_SACH:
            x = THEO_SACH[n]
            assert tr.get("theo") == str(x), n
            assert tr["en"] == kep[str(x)]["trich"]["en"] and tr["chuong"] == kep[str(x)]["trich"]["chuong"], n
            continue
        assert "theo" not in tr, n
        if tr["chuong"] == "XIII":
            vi_tri.append((n, p))
        else:       # câu sách tự dẫn lại ở chương khác: ngay trước đó phải nêu đúng con số
            assert re.search(rf"\b{n}\b", van[tr["chuong"]][max(0, p - 400):p]), (n, "đoạn dẫn không nêu số")
    # trong chương XIII sách tả lần lượt 10 → 51: vị trí các câu phải tăng dần theo số
    assert [p for _, p in vi_tri] == sorted(p for _, p in vi_tri), vi_tri
    assert len(vi_tri) >= 22


def test_so_cung_nghia_dung_nhu_sach_ghi():
    """Dòng "Has the same meaning as …" của sách (máy đọc "meaning" thành "meanmg" ở nhiều dòng; số 39 và 51 mất con số đầu dòng)."""
    v = _van(CHEIRO, CHUONG["XIII"])
    for n, x in THEO_SACH.items():
        if n == 33:
            mau = r"33 this number has no potency of its own and consequently has the same mea\w+ as the 24"
        elif n == 39:     # mất số 39 đầu dòng: dòng nằm giữa dòng 38 và dòng 40
            mau = r"38 has the same mea\w+ as the number 29 .{0,80}? the same mea\w+ as the number 30 .{0,80}? 40 has"
        else:
            mau = rf"\b{n} has the same mea\w+ as (the number )?{x}\b"
        assert re.search(mau, v), (n, x)
    # số 51 có lời tả riêng, đứng giữa dòng 50 và dòng 52 (con số 51 bị mất)
    assert re.search(r"50 has the same mea\w+ as 32 this number has a very powerful potency of its own .{0,400}? 52 has the same", v)
    # sách dừng ở 52
    assert "we have now completed the 52 numbers" in v


# ---------------------------------------------------------------- 3. Trang kiến thức
def _trich_co_nguyen_van(loai: str):
    for slug, bs in bo_sung.doc(loai)["trang"].items():
        for x in bs.get("trich_dan", []):
            if x.get("nguyen_van"):
                yield slug, x


@pytest.mark.parametrize("loai", ["so", "so_kep"])
def test_nguyen_van_tren_trang_la_chu_cua_sach(loai):
    with ngon_ngu.dat("vi"):
        ds = list(_trich_co_nguyen_van(loai))
    assert ds
    for slug, x in ds:
        assert x["sach"] in SACH_KHO, (slug, x["sach"])
        assert x.get("ngon_ngu") == "en" and x.get("nghia"), slug
        assert chuan(x["nguyen_van"]) in _van(SACH_KHO[x["sach"]]), (slug, x["nguyen_van"])
        assert not re.search(r"internet archive|archive\.org|ocr|wikisource|nhận dạng|bản quét", json.dumps(x, ensure_ascii=False), re.I), slug


def test_trang_so_kep_mang_dung_cau_trong_kb():
    with ngon_ngu.dat("vi"):
        kep = nap.doc("thanso_chaldean.json")["kep"]
        for n in range(10, 53):
            t = trang.lay("so_kep", f"so-kep-{n}")
            muc = [m for m in t["muc"] if m.get("trich_dan")]
            assert len(muc) == 1 and muc[0]["tieu_de"].startswith("Sách xưa nói gì"), n
            x = muc[0]["trich_dan"][0]
            assert x["nguyen_van"] == kep[str(n)]["trich"]["en"], n
            # số sách không tả riêng: chú thích nói rõ câu ấy sách viết cho số nào
            assert (str(THEO_SACH[n]) in x.get("chu_thich", "")) if n in THEO_SACH else ("chu_thich" not in x), n


# Trang Ý nghĩa số: câu của Westcott phải nằm đúng mục của con số ấy trong sách (giữa hai đầu đề).
_DAU_DE = {"1": "the monad i", "2": "the dyad 2", "3": "the triad 3", "4": "the tetrad 4", "5": "the pentad 5", "6": "the hexad 6",
           "7": "theheptad 7", "8": "the ogdoad 8", "9": "the ennead 9", "10": "the decad lo"}


def test_trang_y_nghia_so_co_cau_sach_xua_va_ghi_ban_bien_tap():
    westcott = _van("thanso_westcott_numbers_1911.json")
    with ngon_ngu.dat("vi"):
        for so in trang._SO:
            t = trang.lay("so", f"so-{so}")
            muc = [m for m in t["muc"] if m.get("trich_dan")]
            assert len(muc) == 1 and muc[0].get("bien_tap") is True, so          # EEAT-1: phần ban biên tập bổ sung
            nv = [x for x in muc[0]["trich_dan"] if x.get("nguyen_van")]
            assert len(nv) == 1, so
            x = nv[0]
            if so in _DAU_DE:
                assert x["sach"].startswith("W. Wynn Westcott"), so
                p = westcott.find(chuan(x["nguyen_van"]))
                a, b = westcott.find(_DAU_DE[so]), westcott.find(_DAU_DE[str(int(so) + 1)])
                assert 0 <= a < p < b, (so, a, p, b)
            elif so == "33":
                assert chuan(x["nguyen_van"]).startswith("33 ") and x["sach"].startswith("W. Wynn Westcott")
            else:       # 11, 22: sách đầu thế kỷ 20 đặt ra "số cái" — câu phải nêu đúng con số
                assert re.search(rf"\b{so}\b", x["nguyen_van"]) and x["sach"] in SACH_KHO, so


def test_ban_tieng_anh_khong_lot_chu_viet():
    """Bản phủ tiếng Anh: câu sách (vốn tiếng Anh) hiện cả hai bản; lời diễn giải + chú thích phải là tiếng Anh."""
    dau = re.compile(r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]", re.I)
    with ngon_ngu.dat("en"):
        for loai, slugs in (("so", [f"so-{s}" for s in trang._SO]), ("so_kep", [f"so-kep-{n}" for n in range(10, 53)])):
            for slug in slugs:
                for m in trang.lay(loai, slug)["muc"]:
                    for x in m.get("trich_dan") or []:
                        assert x.get("nguyen_van"), slug
                        for k in ("sach", "chuong", "nghia", "chu_thich"):
                            assert not dau.search(x.get(k) or ""), (slug, k, x.get(k))
