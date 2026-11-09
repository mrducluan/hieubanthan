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


def bang(ngon_ngu_: str | None = None) -> dict:
    """Bảng mẫu câu của một ngôn ngữ (rỗng với tiếng Việt / chưa có tệp)."""
    nn = ngon_ngu_ or ngon_ngu.hien_tai()
    if nn == ngon_ngu.MAC_DINH:
        return {}
    if nn not in _NHO:
        p = nap.duong(TEP, nn)
        d: Any = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
        _NHO[nn] = {k: v for k, v in d.items() if not k.startswith("_")} if isinstance(d, dict) else {}
    return _NHO[nn]


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
