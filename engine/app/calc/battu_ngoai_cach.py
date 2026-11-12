# -*- coding: utf-8 -*-
"""CALC — nhận diện cách cục đặc biệt ("ngoại cách") theo thiên «Luận tạp cách» của Tử Bình Chân Thuyên (KT-TT4).

Thuần, tất định, CHỈ nhận diện: không đổi cách cục theo nguyệt lệnh, dụng thần hay mức nào của lá số. Điều kiện đặt
CHẶT theo chữ của sách (bảo thủ — thà sót còn hơn nhận bừa); lá không đủ điều kiện → None.

Bốn loại sách cho là có lý (các "cách vô lý" sách bảo bỏ thì không làm; đảo xung, triều dương, hợp lộc, tỉnh lan,
hình hợp, dao hợp — những cách "mượn chữ không có" — cũng không làm):
- chuyen_vuong «取五行一方秀气»: nhật chủ hành X, sinh tháng X, địa chi đủ tam hợp / tam hội X (Thổ: cả bốn chi Thổ),
  can không lộ Quan Sát («要干头无官无煞»), Tài không lộ quá một («财透两位则亦以财为重»).
- hoa_khi «从化取格»: can ngày ngũ hợp với can tháng hoặc can giờ, hành hoá «得时乘令，四支局全», can không lộ
  hành khắc hành hoá.
- tong_tai «弃命保财»: «四柱皆财而身无气» — nhật chủ không có gốc ở chi nào; Ấn không vừa lộ vừa có gốc
  («透印则身赖印生而不从»); không lộ Quan Sát («无从财兼从煞之理»).
- tong_sat «弃命从煞»: «四柱皆煞而日主无根»; không lộ Thực Thương, không lộ Ấn («有伤食…有印…而不从»).
Hỷ / kỵ của vận: đúng câu sách (xem TRICH).
"""
from __future__ import annotations

from app.calc.battu import CAN, CAN_NH, KHAC, SINH, TANG_CAN

_TAM_HOP = {"Thủy": ("Thân", "Tý", "Thìn"), "Hỏa": ("Dần", "Ngọ", "Tuất"), "Kim": ("Tỵ", "Dậu", "Sửu"),
            "Mộc": ("Hợi", "Mão", "Mùi")}
_TAM_HOI = {"Mộc": ("Dần", "Mão", "Thìn"), "Hỏa": ("Tỵ", "Ngọ", "Mùi"), "Kim": ("Thân", "Dậu", "Tuất"),
            "Thủy": ("Hợi", "Tý", "Sửu")}
# ngũ hợp thiên can → hành hoá
_NGU_HOP = {frozenset(("Giáp", "Kỷ")): "Thổ", frozenset(("Ất", "Canh")): "Kim", frozenset(("Bính", "Tân")): "Thủy",
            frozenset(("Đinh", "Nhâm")): "Mộc", frozenset(("Mậu", "Quý")): "Hỏa"}

# câu sách cho hỷ / kỵ của vận — phải là chuỗi con nguyên văn `fixtures/nguon/tu_binh_chan_thuyen.json` (test khoá)
TRICH = {
    "chuyen_vuong": "运亦喜印绶比劫之乡，财食亦吉，官煞则忌矣",
    "hoa_khi": "运喜所化之物，与所化之印绶，财伤亦可，不利官煞",
    "tong_tai": "运喜伤食财乡，不宜身旺",
    "tong_sat": "运喜财官，不宜身旺，食伤则尤忌矣",
}


def _nh(can: str) -> str:
    return CAN_NH[CAN.index(can)]


def _sinh_ra(h: str) -> str:
    """Hành sinh ra `h`."""
    return next(a for a, b in SINH.items() if b == h)


def _khac(h: str) -> str:
    """Hành khắc `h`."""
    return next(a for a, b in KHAC.items() if b == h)


def _ban_khi(chi: str) -> str:
    return _nh(TANG_CAN[chi][0])


def _du_cuc(chi: list[str], h: str) -> tuple[str, tuple] | None:
    """Địa chi có đủ một cục của hành `h` không → (mã cục, các chi của cục). Thổ: cả bốn chi là Thổ."""
    if h == "Thổ":
        return ("bon_tho", tuple(chi)) if all(_ban_khi(c) == "Thổ" for c in chi) else None
    if all(c in chi for c in _TAM_HOP[h]):
        return "tam_hop", _TAM_HOP[h]
    if all(c in chi for c in _TAM_HOI[h]):
        return "tam_hoi", _TAM_HOI[h]
    return None


def _co_goc(chi: list[str], h: str) -> bool:
    return any(_nh(c) == h for z in chi for c in TANG_CAN[z])


def nhan_dien(tru: list[dict]) -> dict | None:
    """`tru` = 4 trụ năm, tháng, ngày, giờ ({can, chi}).

    Trả {ma, hanh, hy, ky, trich, cuc?: mã cục, chi_cuc?: [chi], can_hop?: can, tru_hop?: 1 | 3} hoặc None.
    Chỉ trả MÃ và tên can / chi / hành (tầng RULES dựng lời theo ngôn ngữ)."""
    can = [t["can"] for t in tru]
    chi = [t["chi"] for t in tru]
    nc = can[2]
    x = _nh(nc)                                   # hành nhật chủ
    khac_x, sinh_x = _khac(x), _sinh_ra(x)        # Quan Sát, Ấn
    con, tai = SINH[x], KHAC[x]                   # Thực Thương, Tài
    lo = [_nh(c) for i, c in enumerate(can) if i != 2]
    bk = [_ban_khi(c) for c in chi]
    thang = bk[1]

    # 1) chuyên vượng — «喜印露而体纯»: chi ngoài cục cũng không được là Quan Sát
    cuc = _du_cuc(chi, x)
    if cuc and thang == x and khac_x not in lo and khac_x not in bk and lo.count(tai) <= 1:
        return {"ma": "chuyen_vuong", "hanh": x, "hy": [sinh_x, x], "ky": [khac_x], "trich": TRICH["chuyen_vuong"],
                "cuc": cuc[0], "chi_cuc": list(cuc[1])}

    # 2) hoá khí
    for i in (1, 3):
        h = _NGU_HOP.get(frozenset((nc, can[i])))
        if not h or thang != h:
            continue
        cuc = _du_cuc(chi, h)
        if cuc and _khac(h) not in [_nh(c) for j, c in enumerate(can) if j not in (2, i)]:
            return {"ma": "hoa_khi", "hanh": h, "hy": [h, _sinh_ra(h)], "ky": [_khac(h)], "trich": TRICH["hoa_khi"],
                    "cuc": cuc[0], "chi_cuc": list(cuc[1]), "can_hop": can[i], "tru_hop": i}

    # 3) tòng tài / tòng sát — nhật chủ không có gốc
    if _co_goc(chi, x):
        return None
    an_lo, an_goc = sinh_x in lo, _co_goc(chi, sinh_x)

    def _day(h: str) -> bool:      # «四柱皆…»: tháng + ít nhất ba chi là h, chi còn lại (nếu có) sinh h
        return thang == h and bk.count(h) >= 3 and all(b in (h, _sinh_ra(h)) for b in bk)

    if _day(tai) and khac_x not in lo and not (an_lo and an_goc):
        return {"ma": "tong_tai", "hanh": tai, "hy": [con, tai], "ky": [x, sinh_x], "trich": TRICH["tong_tai"]}
    if _day(khac_x) and con not in lo and not an_lo:
        return {"ma": "tong_sat", "hanh": khac_x, "hy": [tai, khac_x], "ky": [x, sinh_x, con],
                "trich": TRICH["tong_sat"]}
    return None
