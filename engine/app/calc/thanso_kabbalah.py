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
