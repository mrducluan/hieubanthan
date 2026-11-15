# -*- coding: utf-8 -*-
"""EN-AI — nhãn NGOÀI cho MỘT câu hỏi đang được trả lời (hiện chỉ có lớp phân loại AI của câu tiếng Anh,
`narrative/phan_loai_en.py`). Tầng RULES chỉ ĐỌC nhãn ở đây, không bao giờ tự gọi AI.

Nhãn chỉ sống trong ngữ cảnh của lượt gọi (`contextvars`), gắn với đúng chữ câu hỏi đã đăng ký — câu khác (cụm từ khoá
đã dịch ý, câu của lượt gọi khác) không thấy nhãn. Không có nhãn → mọi hàm trả None (bản Việt, AI tắt: không đổi gì).

Khoá:
- `an_toan` ∈ MUC_AN_TOAN; `tu_choi` = mã từ chối (khi `an_toan == "tu_choi"`). Luật hợp nhất ở `luangiai/an_toan.py`:
  nhãn ngoài CHỈ được nâng mức (khủng hoảng > cấp cứu > từ chối > hỗ trợ mềm > bình thường), không bao giờ hạ.
- `y_dinh` (mã chủ đề trong danh mục cố định của mảng), `nam` (năm 1900–2100 hoặc None) — hỏi đáp chỉ dùng khi luật
  độ tin thấp (`hoidap/chung.thu_nhan_ngoai`).
"""
from __future__ import annotations

import contextvars
from collections.abc import Iterator
from contextlib import contextmanager

MUC_AN_TOAN = ("binh_thuong", "ho_tro_mem", "tu_choi", "cap_cuu", "khung_hoang")   # nhẹ → nặng
MA_TU_CHOI = ("suc_khoe_the_chat", "du_doan_cu_the", "may_rui", "ngoai_pham_vi")

_NHAN: contextvars.ContextVar[tuple[str, dict] | None] = contextvars.ContextVar("nhan_ngoai", default=None)


def _khoa(cau: str | None) -> str:
    return " ".join((cau or "").split())


@contextmanager
def dung(cau: str, nhan: dict | None) -> Iterator[None]:
    """Đăng ký nhãn ngoài cho câu `cau` trong suốt khối `with`. `nhan` rỗng / None → không đăng ký gì."""
    if not nhan or not _khoa(cau):
        yield
        return
    tok = _NHAN.set((_khoa(cau), dict(nhan)))
    try:
        yield
    finally:
        _NHAN.reset(tok)


def lay(cau: str | None) -> dict | None:
    v = _NHAN.get()
    return v[1] if v and cau and _khoa(cau) == v[0] else None


def an_toan(cau: str | None) -> str | None:
    """Mức an toàn nhãn ngoài gán cho câu (None nếu không có)."""
    n = lay(cau)
    m = n.get("an_toan") if n else None
    return m if m in MUC_AN_TOAN else None


def tu_choi(cau: str | None) -> str | None:
    """Mã từ chối nhãn ngoài gán (chỉ khi mức là `tu_choi`)."""
    n = lay(cau)
    if not n or n.get("an_toan") != "tu_choi":
        return None
    return n.get("tu_choi") if n.get("tu_choi") in MA_TU_CHOI else "ngoai_pham_vi"
