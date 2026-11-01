# -*- coding: utf-8 -*-
"""EN-2 (mục 1) — RULES lớp nhất quán liên mảng. Chỉ ĐỌC mức các môn đã chấm (không tính lại, không điểm số, không đổi
mức của môn nào). Cùng mức → một điểm nhấn "nhiều cách cùng thấy"; khác mức → một câu giải thích vì sao (mỗi môn nhìn
một mặt) kèm việc nên làm chung. Lời ở KB `nhat_quan_kb.json` (nháp ban biên tập)."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.luangiai import doi_song_khuon as kh

_KB = Path(__file__).parents[1] / "kb" / "data" / "nhat_quan_kb.json"
TEN = {"tuvi": "Tử vi", "battu": "Bát tự", "thanso": "Thần số"}
_LOAI = {"thuan": "diem_manh", "can_bang": "loi_khuyen", "can_chu_dong": "luu_y"}


@lru_cache(maxsize=1)
def kb() -> dict:
    return json.loads(_KB.read_text("utf-8"))


def nam(nam_xem: int, muc: dict[str, str | None]) -> dict | None:
    """`muc` = {môn: mức năm} — cần ít nhất hai môn có mức. → một hộp `doi_song_1` hoặc None."""
    co = {k: v for k, v in muc.items() if v in kh.NHAN_MUC}
    if len(co) < 2:
        return None
    ten = [TEN.get(k, k) for k in co]
    noi = ", ".join(ten[:-1]) + " và " + ten[-1]
    k = kb()["nam"]
    cu = [f"{TEN.get(m, m)}: năm {nam_xem} {kh.NHAN_MUC[v].lower()}" for m, v in co.items()]
    if len(set(co.values())) == 1:
        m = next(iter(co.values()))
        o = k["cung"][m]
        return kh.hop(_LOAI[m], o["tieu_de"].format(nam=nam_xem, noi=noi), o["noi_dung"].format(nam=nam_xem, noi=noi),
                      huong_xu_ly=o.get("huong_xu_ly"), can_cu=cu, muc=m,
                      ma=kh.ma_mau("tgt", "nhat_quan", "nam", "cung", m))
    # khác mức: mỗi môn nhìn một mặt — nói rõ môn nào thấy gì, rồi việc nên làm chung theo mức thấp nhất
    thu_tu = ("can_chu_dong", "can_bang", "thuan")
    thap = min(co.values(), key=thu_tu.index)
    mat = "; ".join(f"{TEN.get(m, m)} ({k['mat'][m]}) thấy năm {kh.NHAN_MUC[v].lower()}" for m, v in co.items())
    o = k["khac"]
    return kh.hop("loi_khuyen", o["tieu_de"].format(nam=nam_xem),
                  o["noi_dung"].format(nam=nam_xem, mat=mat),
                  huong_xu_ly=o["huong_xu_ly"][thap], can_cu=cu,
                  ma=kh.ma_mau("tgt", "nhat_quan", "nam", "khac", "".join(sorted(co.values()))[:20]))
