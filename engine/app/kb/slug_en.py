# -*- coding: utf-8 -*-
"""EN-ALL GĐ 2 (docs/PROMPT-EN-TOAN-BO.md mục 3.2) — slug TIẾNG ANH của mọi trang kiến thức, sinh tất định.

`tinh(loai, ten)` nhận đúng khoá mà `kb/trang.py` dùng để dựng trang (tên Việt của sao / cung, mã dấu hiệu, số…) và trả
slug Anh: từ bảng tên riêng `ten_en.json` (pinyin / tên tiếng Anh) hoặc bảng soạn tay `slug_en.json` cho loại không suy
được. Không phụ thuộc ngôn ngữ của lượt gọi (cùng đầu vào → cùng slug), không đổi slug bản Việt. Slug đã công bố là
CỐ ĐỊNH: test khoá duy nhất + ổn định (`tests/test_slug_en.py`, golden `fixtures/golden/slug_en.json`); đổi = 308 ở web.
"""
from __future__ import annotations

import re
import unicodedata

from app import ngon_ngu
from app.kb import nap, ten as _ten

TEP = "slug_en.json"


def _slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s.replace("Đ", "D").replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return "-".join(re.sub(r"[^a-z0-9]+", " ", s).split())


def _en(nhom: str, vi: str) -> str:
    m = _ten.muc(nhom, vi)
    if not m or not (m.get("en") or m.get("pinyin")):
        raise KeyError(f"slug_en: thiếu tên tiếng Anh cho {nhom} «{vi}» trong ten_en.json")
    return m.get("en") or m["pinyin"]


def _bang() -> dict:
    return nap._doc_tho(nap.duong(TEP))


def _hoa(vi: str) -> str:
    """"Lu (Prosperity)" → "hua-lu"."""
    return "hua-" + _slug(_en("hoa", vi).split("(")[0])


def tinh(loai: str, ten: object) -> str:
    """Slug tiếng Anh của một trang kiến thức. `ten` = khoá dựng trang của `kb/trang.py` cho loại đó."""
    if loai in ("so", "so_kep", "no_nghiep", "nam_ca_nhan"):
        return str(ten)
    if loai in ("nghe", "tinh_yeu"):
        return f"life-path-{ten}"
    if loai == "cap_so":
        a, b = str(ten).split("-")
        return f"{a}-and-{b}"
    if loai == "menh_nam":
        return f"born-{ten}"
    if loai == "que":
        return f"{int(str(ten))}-{_slug(_en('que', str(int(str(ten)))))}"
    if loai == "sao":
        return _slug(_en("chinh_tinh", str(ten)))
    if loai == "cung":
        return _slug(_en("cung", str(ten)))
    if loai == "thap_than":
        return _slug(_en("thap_than", str(ten)))
    if loai == "nhat_chu":
        m = _ten.muc("can", str(ten)) or {}
        return _slug(f"{_en('can', str(ten))} {m.get('nghia', '')}")
    if loai == "sao_cung":
        sao, cung = ten  # type: ignore[misc]
        return f"{_slug(_en('chinh_tinh', sao))}-in-{_slug(_en('cung', cung))}"
    if loai == "hoa_cung":
        hoa, cung = ten  # type: ignore[misc]
        return f"{_hoa(hoa)}-in-{_slug(_en('cung', cung))}"
    if loai == "la_bai":
        from app.kb import tarot_kb, trang_tarot  # noqa: PLC0415 — slug lá bài có từ QTE-3 (giữ nguyên)
        with ngon_ngu.dung("vi"):
            return trang_tarot.slug_en(tarot_kb.la()[str(ten)]["en"])
    if loai in ("dau_hieu", "bo_vi", "co_thu"):
        s = (_bang().get(loai) or {}).get(str(ten))
        if not s:
            raise KeyError(f"slug_en: thiếu slug cho {loai} «{ten}» trong {TEP}")
        return s
    raise KeyError(f"slug_en: chưa có luật cho loại «{loai}»")


def _cap_loai(loai: str) -> list[tuple[object, str]]:
    from app.kb import trang as t  # noqa: PLC0415 — trang import ngược module này
    if loai == "so":
        return [(s, f"so-{s}") for s in t._SO]
    if loai == "que":
        return t._ds_que()
    if loai == "sao":
        return t._ds_sao()
    return t._TRANG[loai][0]()


_NHO: dict[str, dict[str, str]] = {}


def bang(loai: str) -> dict[str, str]:
    """{slug Việt: slug Anh} của một loại trang (nhớ trong tiến trình; không phụ thuộc ngôn ngữ lượt gọi)."""
    if loai not in _NHO:
        with ngon_ngu.dung("vi"):
            _NHO[loai] = {s: tinh(loai, k) for k, s in _cap_loai(loai)}
    return _NHO[loai]


def cua(loai: str, slug_vi: str) -> str | None:
    return bang(loai).get(slug_vi)


def ve_viet(loai: str, slug: str) -> str | None:
    """Slug Anh (hoặc slug Việt) → slug Việt; không có → None."""
    b = bang(loai)
    if slug in b:
        return slug
    return next((v for v, e in b.items() if e == slug), None)
