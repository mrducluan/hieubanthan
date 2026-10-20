# -*- coding: utf-8 -*-
"""Thần số Qabalah Hermetic (phương Tây) — TS-V3, phái thứ ba.

Tên tiếng Việt (bỏ dấu, Đ = D) được chuyển sang chữ Hebrew theo bảng tương ứng Latin→Hebrew DỰA TRÊN truyền thống
Golden Dawn (A. Crowley, *777*, 1909 — phạm vi công cộng; 777 có A B G D H/E V/U Z Ch T I/Y K L M N S O P Tz Q R Sh Th),
sản phẩm BỔ SUNG C, F, J, W, X và chữ ghép tiếng Việt (KH; H câm trong NH, GH, NGH), rồi cộng giá trị chữ Hebrew chuẩn
(mispar hechrechi) thành gematria. Từ đó (rút gọn về con đường/Sephirah là quy ước thần số hiện đại, không phải thực
hành của Golden Dawn):
  - Con đường của tên: rút gọn (cộng chữ số) tới khi ≤ 22 → chữ Hebrew thứ n. Trên Cây Sự sống chữ này là con đường
    số n + 10 theo cách đánh số Golden Dawn (Aleph = 11 … Tav = 32) — trả cả hai để người tra sách không nhầm.
  - Sephirah của tên và của ngày sinh: rút gọn tới khi ≤ 10 → một trong 10 Sephirah (10 = Malkuth).
Đây là bản PHỎNG THEO cho tên không viết bằng chữ Hebrew — Kabbalah Do Thái giáo chỉ làm gematria trên chữ Hebrew.
Bảng chuyển chữ có biến thể (O, S, T, C) → trả thêm `con_duong_khac` để nói thật độ nhạy, như `thanso.do_nhay`.

Tầng CALC: thuần tuý, tất định, không LLM, không DB. Nghĩa ở KB `thanso_kabbalah.json`.
Đáp án tính tay: fixtures/golden/thanso_kabbalah.json.
"""
from __future__ import annotations

import itertools

from app.calc import thanso

CHU_HEBREW = ["Aleph", "Beth", "Gimel", "Daleth", "He", "Vav", "Zayin", "Cheth", "Teth", "Yod", "Kaph",
              "Lamed", "Mem", "Nun", "Samekh", "Ayin", "Pe", "Tzaddi", "Qoph", "Resh", "Shin", "Tav"]
GIA_TRI = {"Aleph": 1, "Beth": 2, "Gimel": 3, "Daleth": 4, "He": 5, "Vav": 6, "Zayin": 7, "Cheth": 8, "Teth": 9,
           "Yod": 10, "Kaph": 20, "Lamed": 30, "Mem": 40, "Nun": 50, "Samekh": 60, "Ayin": 70, "Pe": 80,
           "Tzaddi": 90, "Qoph": 100, "Resh": 200, "Shin": 300, "Tav": 400}

# Chữ ghép xét trước chữ đơn (theo thứ tự trong danh sách).
CHU_GHEP = {"TZ": "Tzaddi", "CH": "Cheth", "KH": "Cheth", "SH": "Shin", "TH": "Tav", "PH": "Pe",
            "NH": "Nun", "GH": "Gimel"}   # tiếng Việt: H câm trong NH, GH (NGH = N + GH)
CHU_DON = {"A": "Aleph", "B": "Beth", "C": "Kaph", "D": "Daleth", "E": "He", "F": "Pe", "G": "Gimel", "H": "He",
           "I": "Yod", "J": "Yod", "K": "Kaph", "L": "Lamed", "M": "Mem", "N": "Nun", "O": "Ayin", "P": "Pe",
           "Q": "Qoph", "R": "Resh", "S": "Samekh", "T": "Teth", "U": "Vav", "V": "Vav", "W": "Vav", "X": "Samekh",
           "Y": "Yod", "Z": "Zayin"}
# Các chữ mà những bảng Hermetic khác nhau gán khác nhau → dùng để tính độ nhạy.
BIEN_THE = {"O": "Vav", "S": "Shin", "T": "Tav", "C": "Qoph"}


def _cong_chu_so(n: int) -> int:
    return sum(int(c) for c in str(n))


def ve_con_duong(n: int) -> int:
    """Rút gọn về 1–22 (một trong 22 chữ / con đường)."""
    while n > 22:
        n = _cong_chu_so(n)
    return n


def ve_sephirah(n: int) -> int:
    """Rút gọn về 1–10 (một trong 10 Sephirah)."""
    while n > 10:
        n = _cong_chu_so(n)
    return n


def _tach(tu: str, bang: dict[str, str]) -> list[dict]:
    kq, i = [], 0
    while i < len(tu):
        ghep = tu[i:i + 2]
        if ghep in CHU_GHEP:
            heb, i, chu = CHU_GHEP[ghep], i + 2, ghep
        elif tu[i] in bang:
            heb, chu, i = bang[tu[i]], tu[i], i + 1
        else:
            i += 1
            continue
        kq.append({"chu": chu, "hebrew": heb, "so": GIA_TRI[heb]})
    return kq


def _theo_tu(ten: str, bang: dict[str, str]) -> list[dict]:
    out = []
    for tu in thanso.bo_dau(ten, True).upper().split():
        chu = _tach("".join(c for c in tu if c.isascii() and c.isalpha()), bang)
        if chu:
            out.append({"tu": tu, "chu": chu, "tong": sum(c["so"] for c in chu)})
    return out


def _con_duong_khac(ten: str, goc: int) -> list[int]:
    """Mọi con đường có thể ra nếu bảng chuyển chữ chọn biến thể khác cho O / S / T / C (bật tắt độc lập)."""
    co = {c for c in thanso.bo_dau(ten, True).upper() if c in BIEN_THE}
    kq: set[int] = set()
    for chon in itertools.product([False, True], repeat=len(co)):
        bang = dict(CHU_DON)
        for chu, bat in zip(sorted(co), chon):
            if bat:
                bang[chu] = BIEN_THE[chu]
        kq.add(ve_con_duong(sum(t["tong"] for t in _theo_tu(ten, bang))))
    return sorted(kq - {goc})


def sephirah_ngay_sinh(ngay: int, thang: int, nam: int) -> int:
    """Cộng mọi chữ số ngày, tháng, năm sinh, rút tới khi ≤ 10 (cùng phép như trong `tinh`)."""
    return ve_sephirah(sum(int(c) for c in f"{ngay}{thang}{nam}"))


def tinh(ho_ten: str, ngay: int, thang: int, nam: int) -> dict:
    tu = _theo_tu(ho_ten, CHU_DON)
    tong = sum(t["tong"] for t in tu)
    cd = ve_con_duong(tong) if tong else 0
    tong_ngay = sum(int(c) for c in f"{ngay}{thang}{nam}")
    return {
        "theo_tu": tu,
        "tong": tong,
        "con_duong": cd,
        "chu_con_duong": CHU_HEBREW[cd - 1] if cd else None,
        "so_duong_cay": cd + 10 if cd else None,
        "sephirah_ten": ve_sephirah(tong) if tong else 0,
        "tong_ngay_sinh": tong_ngay,
        "sephirah_ngay_sinh": ve_sephirah(tong_ngay),
        "con_duong_khac": _con_duong_khac(ho_ten, cd) if tong else [],
    }


# ---------------------------------------------------------------- TS-V3b: Cây của hai người + chữ của ngày
# Cây Sự sống theo đánh số Golden Dawn (Crowley, 777): chữ Hebrew thứ n là con đường số n + 10, nối hai Sephirah.
CAY: dict[int, tuple[int, int]] = {
    1: (1, 2), 2: (1, 3), 3: (1, 6), 4: (2, 3), 5: (2, 6), 6: (2, 4), 7: (3, 6), 8: (3, 5), 9: (4, 5), 10: (4, 6),
    11: (4, 7), 12: (5, 6), 13: (5, 8), 14: (6, 7), 15: (6, 9), 16: (6, 8), 17: (7, 8), 18: (7, 9), 19: (7, 10),
    20: (8, 9), 21: (8, 10), 22: (9, 10),
}
_KE: dict[int, list[tuple[int, int]]] = {s: [] for s in range(1, 11)}
for _chu, (_x, _y) in CAY.items():
    _KE[_x].append((_chu, _y))
    _KE[_y].append((_chu, _x))


def _moi_loi_ngan_nhat(a: int, b: int) -> list[list[int]]:
    """Mọi lối ít con đường nhất từ a tới b, mỗi lối là dãy chữ (1–22). Cây có 10 đỉnh → duyệt theo tầng là đủ."""
    tang: list[tuple[int, list[int]]] = [(a, [])]
    tham = {a}
    while tang:
        toi = [loi for s, loi in tang if s == b]
        if toi:
            return sorted(toi)
        moi: list[tuple[int, list[int]]] = []
        for s, loi in tang:
            for chu, t in _KE[s]:
                if t not in tham:
                    moi.append((t, loi + [chu]))
        tham |= {t for t, _ in moi}
        tang = moi
    return []


def duong_noi(a: int, b: int) -> dict:
    """Đường nối Sephirah a (người A) với Sephirah b (người B) trên Cây: ít con đường nhất; nhiều lối bằng nhau thì
    lấy lối có dãy chữ nhỏ nhất khi đi từ Sephirah số nhỏ sang số lớn (nên A→B và B→A là cùng một lối, đảo chiều)."""
    if not (1 <= a <= 10 and 1 <= b <= 10):
        raise ValueError("Sephirah phải từ 1 đến 10")
    thap, cao = min(a, b), max(a, b)
    loi = _moi_loi_ngan_nhat(thap, cao)
    chu = loi[0]
    seph = [thap]
    for c in chu:
        x, y = CAY[c]
        seph.append(y if seph[-1] == x else x)
    if a > b:
        chu, seph = chu[::-1], seph[::-1]
    con_duong = [{"chu": c, "ten": CHU_HEBREW[c - 1], "so_duong_cay": c + 10, "tu": seph[i], "den": seph[i + 1]}
                 for i, c in enumerate(chu)]
    return {"sephirot": seph, "con_duong": con_duong, "so_loi": len(loi), "cung_tram": a == b}


def chu_cua_ngay(ngay_sinh: int, thang_sinh: int, ngay: int, thang: int, nam: int) -> dict:
    """Chữ Hebrew của ngày cho một người: cộng chữ số ngày + tháng sinh và ngày + tháng + năm đang xem (cùng các chữ
    số làm nên ngày cá nhân), rút tới khi ≤ 22 thay vì ≤ 9 — cách rút của con đường Qabalah."""
    tong = sum(int(c) for c in f"{ngay_sinh}{thang_sinh}{ngay}{thang}{nam}")
    n = ve_con_duong(tong)
    return {"tong": tong, "chu": n, "ten": CHU_HEBREW[n - 1], "so_duong_cay": n + 10}
