# -*- coding: utf-8 -*-
"""EN-2 (mục 1) — RULES lớp nhất quán liên mảng. Chỉ ĐỌC mức các môn đã chấm (không tính lại, không điểm số, không đổi
mức của môn nào). Cùng mức → một điểm nhấn "nhiều cách cùng thấy"; khác mức → một câu giải thích vì sao (mỗi môn nhìn
một mặt) kèm việc nên làm chung. Lời ở KB `nhat_quan_kb.json` (nháp ban biên tập)."""
from __future__ import annotations

from app.kb import nap
from app.kb.loi import L, danh_sach
from app.luangiai import doi_song_khuon as kh

_KB = "nhat_quan_kb.json"
TEN = {"tuvi": "Tử vi", "battu": "Bát tự", "thanso": "Thần số"}


def _ten(m: str) -> str:
    return L(f"mon.{m}", TEN.get(m, m))
_LOAI = {"thuan": "diem_manh", "can_bang": "loi_khuyen", "can_chu_dong": "luu_y"}


@nap.nho
def kb() -> dict:
    return nap.doc(_KB)       # EN-ALL: bản phủ theo ngôn ngữ (kb/data/<nn>/nhat_quan_kb.json)


def nam(nam_xem: int, muc: dict[str, str | None]) -> dict | None:
    """`muc` = {môn: mức năm} — cần ít nhất hai môn có mức. → một hộp `doi_song_1` hoặc None."""
    co = {k: v for k, v in muc.items() if v in kh.NHAN_MUC}
    if len(co) < 2:
        return None
    ten = [_ten(k) for k in co]
    noi = danh_sach(ten)
    k = kb()["nam"]
    cu = [L("nhat_quan.can_cu", f"{TEN.get(m, m)}: năm {nam_xem} {kh.NHAN_MUC[v].lower()}", mon=_ten(m), nam=nam_xem,
            muc=kh.nhan_muc(v).lower()) for m, v in co.items()]
    if len(set(co.values())) == 1:
        m = next(iter(co.values()))
        o = k["cung"][m]
        return kh.hop(_LOAI[m], o["tieu_de"].format(nam=nam_xem, noi=noi), o["noi_dung"].format(nam=nam_xem, noi=noi),
                      huong_xu_ly=o.get("huong_xu_ly"), can_cu=cu, muc=m,
                      ma=kh.ma_mau("tgt", "nhat_quan", "nam", "cung", m))
    # khác mức: mỗi môn nhìn một mặt — nói rõ môn nào thấy gì, rồi việc nên làm chung theo mức thấp nhất
    thu_tu = ("can_chu_dong", "can_bang", "thuan")
    thap = min(co.values(), key=thu_tu.index)
    mat = "; ".join(L("nhat_quan.mat", f"{TEN.get(m, m)} ({k['mat'][m]}) thấy năm {kh.NHAN_MUC[v].lower()}", mon=_ten(m),
                      mat=k["mat"][m], muc=kh.nhan_muc(v).lower()) for m, v in co.items())
    o = k["khac"]
    return kh.hop("loi_khuyen", o["tieu_de"].format(nam=nam_xem),
                  o["noi_dung"].format(nam=nam_xem, mat=mat),
                  huong_xu_ly=o["huong_xu_ly"][thap], can_cu=cu,
                  ma=kh.ma_mau("tgt", "nhat_quan", "nam", "khac", "".join(sorted(co.values()))[:20]))
