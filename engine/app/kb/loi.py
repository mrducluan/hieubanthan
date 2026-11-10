# -*- coding: utf-8 -*-
"""QTE-2 mục 4.3 — LỜI theo ngôn ngữ cho chuỗi nằm trong mã Python của tầng RULES (tiêu đề chương, câu nối, nhãn).

`L("tarot.ten_ng.tien", "tiến")` → tiếng Việt: trả nguyên chữ Việt truyền vào; ngôn ngữ khác: tra `kb/data/<ngôn ngữ>/
loi_khuon.json` theo mã, thay `{slot}`; thiếu mã → chữ Việt (test `tests/test_en_*` quét chữ Việt còn sót để bắt thiếu).
Không gettext từng chuỗi, không dịch lúc chạy: mẫu câu tiếng Anh do ban biên tập viết (hoặc máy chuyển ngữ rồi người
bản xứ duyệt) và nằm trong git như KB. Mã kiểm chứng (`ma_mau`) KHÔNG đi qua đây — mã không phụ thuộc ngôn ngữ.
"""
from __future__ import annotations

import json
from typing import Any

from app import ngon_ngu
from app.kb import nap

TEP = "loi_khuon.json"
_NHO: dict[str, dict] = {}


THU_MUC = "loi"   # EN-ALL: mẫu câu chia theo cụm module — `data/<ngôn ngữ>/loi/<cụm>.json`, gộp với `loi_khuon.json`


def _doc_mot(p) -> dict:
    d: Any = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    return {k: v for k, v in d.items() if not k.startswith("_")} if isinstance(d, dict) else {}


def _doc_bang(nn: str) -> dict:
    """Bảng mẫu câu của một ngôn ngữ = `loi_khuon.json` + mọi tệp `loi/*.json`. Một mã chỉ được có ở MỘT tệp."""
    ra = _doc_mot(nap.duong(TEP, nn))
    thu_muc = nap.duong(THU_MUC, nn)
    if thu_muc.is_dir():
        for p in sorted(thu_muc.glob("*.json")):
            d = _doc_mot(p)
            trung = sorted(set(d) & set(ra))
            if trung:
                raise ValueError(f"loi: mã trùng giữa {p.name} và tệp khác: {trung[:5]}")
            ra.update(d)
    return ra


def bang(ngon_ngu_: str | None = None) -> dict:
    """Bảng mẫu câu của một ngôn ngữ (rỗng với tiếng Việt / chưa có tệp). Ý7: khi lượt gọi có biến thể thị trường
    ("en-us"), bảng = bản ngôn ngữ chồng thêm bản biến thể (vài chuỗi khác chính tả / cách nói)."""
    nn = ngon_ngu_ or ngon_ngu.hien_tai()
    if nn == ngon_ngu.MAC_DINH:
        return {}
    bt = None if ngon_ngu_ else ngon_ngu.bien_the()
    if nn not in _NHO:
        _NHO[nn] = _doc_bang(nn)
    if not bt:
        return _NHO[nn]
    if bt not in _NHO:
        _NHO[bt] = {**_NHO[nn], **_doc_bang(bt)}
    return _NHO[bt]


def co(ma: str, ngon_ngu_: str | None = None) -> bool:
    return ma in bang(ngon_ngu_)


def L(ma: str, vi: str, **slot) -> str:  # noqa: N802 — tên ngắn cố ý, đọc như "lời"
    """Chuỗi hiển thị theo ngôn ngữ hiện tại. `vi` là bản tiếng Việt (mặc định, cũng là tài liệu cho người dịch)."""
    mau = bang().get(ma)
    s = mau if isinstance(mau, str) else vi
    if slot:
        try:
            return s.format(**slot)
        except (KeyError, IndexError, ValueError):
            return vi.format(**slot) if s is not vi else s
    return s


def xoa_nho() -> None:
    _NHO.clear()


# ------------------------------------------------------------------ HTT-1: bộ hiện thực bề mặt (surface realizer) nhẹ
# Ý lấy từ "MorphologicalASTAssembler" của tài liệu Drive: chỗ RULES ghép danh sách / mạo từ / viết hoa phải theo ngôn
# ngữ, không nối chuỗi cứng " và ". Chỉ tiếng Việt + Anh (lộ trình QTE-1); ngôn ngữ khác rơi về cách nối tiếng Anh.
_NOI = {"vi": (", ", " và "), "en": (", ", " and ")}


def danh_sach(muc: list[str] | tuple[str, ...], *, ngon_ngu_: str | None = None) -> str:
    """["A"] → "A"; ["A","B"] → "A và B" / "A and B"; ["A","B","C"] → "A, B và C" / "A, B and C". Rỗng → ""."""
    ds = [str(x).strip() for x in muc if x is not None and str(x).strip()]
    if not ds:
        return ""
    if len(ds) == 1:
        return ds[0]
    phay, va = _NOI.get(ngon_ngu_ or ngon_ngu.hien_tai(), _NOI["en"])
    return phay.join(ds[:-1]) + va + ds[-1]


_NGUYEN_AM = set("aeiou")
# Chữ đầu phát âm nguyên âm / phụ âm khác mặt chữ (tiếng Anh): "an hour", "a one-card", "a university".
_AN_DAC_BIET = ("hour", "honest", "heir", "honour", "honor")
_A_DAC_BIET = ("one", "uni", "use", "user", "euro", "eu")


def mao_tu(tu: str, *, ngon_ngu_: str | None = None) -> str:
    """Tiếng Anh: "a"/"an" + từ ("an obstacle", "a reversed card", "an hour"); tiếng Việt: trả nguyên từ."""
    nn = ngon_ngu_ or ngon_ngu.hien_tai()
    t = (tu or "").strip()
    if nn == "vi" or not t:
        return t
    tl = t.lower()
    an = tl[0] in _NGUYEN_AM
    if tl.startswith(_AN_DAC_BIET):
        an = True
    if tl.startswith(_A_DAC_BIET):
        an = False
    return ("an " if an else "a ") + t


def hoa_dau(cau: str) -> str:
    """Viết hoa chữ cái đầu câu, giữ nguyên phần còn lại (không như str.capitalize làm thường cả câu)."""
    s = (cau or "").lstrip()
    return s[:1].upper() + s[1:] if s else s
