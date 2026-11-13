# -*- coding: utf-8 -*-
"""EN-ALL GĐ 6 — lớp HIỂN THỊ theo ngôn ngữ cho câu chữ mà tầng CALC Kinh Dịch trả ra (quy tắc đọc lời kinh, nguồn ra
quẻ, ứng kỳ Mai Hoa, lý do ứng kỳ Lục Hào). CALC không đọc ngôn ngữ; tên riêng (quẻ, quái, chi, lục thân…) là MÃ, bản
Anh hiển thị qua `ten_hien` (`kb/ten.KHOA_MA`). Ở đây chỉ dựng lại các CÂU từ dữ kiện đã tính.

Tiếng Việt: mọi hàm trả nguyên đối tượng (không đụng một byte). Ngôn ngữ khác: trả BẢN SAO đã thay câu.
"""
from __future__ import annotations

import copy

from app import ngon_ngu
from app.kb.loi import L

# Lý do ứng kỳ Lục Hào (calc.luc_hao._ung_ky_cho_hao) → mã mẫu câu.
_LY_DO_UNG_KY = {
    "ra khỏi tuần không (ngày trị)": "kd.uk.ra_khong",
    "ngày xung không — việc đang treo được gọi dậy": "kd.uk.xung_khong",
    "ngày xung mở mộ — việc đang bị giam lộ ra": "kd.uk.mo_mo",
    "hào động bị hợp, chờ ngày xung mở": "kd.uk.dong_hop",
    "ngày hợp với hào động": "kd.uk.hop_dong",
    "ngày trị (cùng chi)": "kd.uk.tri",
    "hào tĩnh chờ ngày xung động": "kd.uk.tinh_xung",
}
_NGUON = {
    "gieo tay (người dùng nhập)": "kd.nguon.gieo_tay",
    "Mai Hoa theo số": "kd.nguon.mh_so",
    "Mai Hoa theo phương vị": "kd.nguon.mh_phuong",
    "Mai Hoa theo thời điểm": "kd.nguon.mh_thoi_diem",
}


def ly_do_ung_ky(s: str) -> str:
    ma = _LY_DO_UNG_KY.get(s)
    return L(ma, s) if ma else s


def ung_ky(ds: list[dict] | None) -> list[dict] | None:
    """Danh sách ứng kỳ Lục Hào với lý do theo ngôn ngữ (bản sao ở ngôn ngữ khác tiếng Việt)."""
    if not ds or ngon_ngu.la_viet():
        return ds
    return [{**u, "ly_do": ly_do_ung_ky(u.get("ly_do", ""))} for u in ds]


def nguon(s: str | None) -> str | None:
    if not s or ngon_ngu.la_viet():
        return s
    if s in _NGUON:
        return L(_NGUON[s], s)
    if s.startswith("engine, ") and s.endswith(", secrets CSPRNG"):
        pp = s[len("engine, "):-len(", secrets CSPRNG")]
        return L("kd.nguon.engine", "engine, {pp}, secrets CSPRNG", pp=L(f"kd.pp.{pp}", pp))
    return s


def quy_tac_doc(que: dict) -> str:
    """Quy tắc biến chiếm (Chu Hy) dựng lại theo ngôn ngữ — cùng nhánh với `kinhdich_vendor.quy_tac_doc`."""
    dong = que.get("hao_dong") or []
    n = len(dong)
    bits = tuple((que.get("quai_ban") or {}).get("bits_hao1_den_hao6") or ())
    tinh = [i for i in range(1, 7) if i not in dong]
    if n == 0:
        return L("kd.qt.0", "0 hào động — đọc QUÁI TỪ quẻ bản. Không có quẻ biến.")
    if n == 1:
        return L("kd.qt.1", "1 hào động — đọc HÀO TỪ hào {a} của quẻ bản.", a=dong[0])
    if n == 2:
        return L("kd.qt.2", "2 hào động — đọc hào từ hào {a} và {b} của quẻ bản, LẤY HÀO TRÊN ({b}) làm chủ.", a=dong[0], b=dong[1])
    if n == 3:
        return L("kd.qt.3", "3 hào động — đọc QUÁI TỪ cả quẻ bản và quẻ biến; quẻ bản là 'trinh' (tình thế hiện tại), "
                            "quẻ biến là 'hối' (hệ quả).")
    if n == 4:
        return L("kd.qt.4", "4 hào động — đọc hào từ 2 hào TĨNH ({a}, {b}) của QUẺ BIẾN, lấy hào dưới ({a}) làm chủ.",
                 a=tinh[0], b=tinh[1])
    if n == 5:
        return L("kd.qt.5", "5 hào động — đọc hào từ hào tĩnh ({a}) của QUẺ BIẾN.", a=tinh[0])
    if bits == (1, 1, 1, 1, 1, 1):
        return L("kd.qt.6_can", "6 hào động, quẻ Càn — dùng 'Dụng Cửu'.")
    if bits == (0, 0, 0, 0, 0, 0):
        return L("kd.qt.6_khon", "6 hào động, quẻ Khôn — dùng 'Dụng Lục'.")
    return L("kd.qt.6", "6 hào động — đọc QUÁI TỪ quẻ biến.")


def que(q: dict | None) -> dict | None:
    """Cấu trúc quẻ (`calc.kinhdich.khoi_que` + nguồn) — thay quy tắc đọc và nguồn ra quẻ theo ngôn ngữ."""
    if not q or ngon_ngu.la_viet():
        return q
    q = {**q}
    if "quy_tac_doc" in q:
        q["quy_tac_doc"] = quy_tac_doc(q)
    if q.get("nguon_ngau_nhien"):
        q["nguon_ngau_nhien"] = nguon(q["nguon_ngau_nhien"])
    return q


def ung_ky_so(u: dict | None) -> dict | None:
    if not u or ngon_ngu.la_viet():
        return u
    return {**u, "y": L("kd.mh.ung_ky_so", "Số quẻ là {so}: việc gần thì tính bằng ngày, việc xa tính bằng tuần hay tháng — đây là nhịp gợi ý.",
                        so=u.get("so"))}


def mai_hoa(m: dict | None) -> dict | None:
    """Kết quả Mai Hoa (`calc.kinhdich_maihoa`) — thay câu ứng kỳ số theo ngôn ngữ."""
    if not m or ngon_ngu.la_viet():
        return m
    m = copy.deepcopy(m)
    if m.get("ung_ky_so"):
        m["ung_ky_so"] = ung_ky_so(m["ung_ky_so"])
    return m
