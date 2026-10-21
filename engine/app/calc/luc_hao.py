# -*- coding: utf-8 -*-
"""KD-V2 — Lục Hào nâng cao (tầng CALC, tất định). Bổ sung cho `vuong_suy.py` (nguyệt lệnh, nhật thần, tuần không).

Luật rút gọn từ Tăng San Bốc Dịch (Dã Hạc Lão Nhân) và Bốc Phệ Chính Tông (Vương Hồng Tự) — cổ thư công cộng:
- Lục thú an theo CAN NGÀY từ hào 1: Giáp Ất khởi Thanh Long · Bính Đinh Chu Tước · Mậu Câu Trần · Kỷ Đằng Xà ·
  Canh Tân Bạch Hổ · Nhâm Quý Huyền Vũ.
- Nguyên thần = lục thân sinh dụng thần; kỵ thần = lục thân khắc dụng thần; cừu thần = lục thân khắc nguyên thần.
- Phục thần: quẻ khuyết lục thân nào thì mượn hào cùng vị trí của quẻ BÁT THUẦN cùng cung (phi thần = hào đang hiện).
- Hào động hoá: tiến thần (Dần→Mão, Tỵ→Ngọ, Thân→Dậu, Hợi→Tý, Sửu→Thìn, Thìn→Mùi, Mùi→Tuất, Tuất→Sửu), thoái thần
  (ngược lại), hồi đầu sinh / hồi đầu khắc (hào biến sinh / khắc hào gốc), hoá tiết (gốc sinh biến), hoá khắc xuất
  (gốc khắc biến), phục ngâm (cùng chi), phản ngâm (lục xung), hoá tỷ (cùng hành khác chi không tiến/thoái).
- Nguyệt phá: hào lục xung chi tháng. Nhật xung hào tĩnh: vượng tướng → ám động; hưu tù → nhật phá.
- Nhập mộ: Mộc mộ Mùi · Hoả mộ Tuất · Kim mộ Sửu · Thuỷ và Thổ mộ Thìn (xét chi ngày, chi tháng, hào hoá ra).
- Ứng kỳ (nhịp gợi ý): dụng thần không vong → ngày xuất không (trị) hoặc xung không; động mà bị hợp → ngày xung;
  tĩnh → ngày xung động hoặc trị nhật; động → ngày hợp / trị; nhập mộ → ngày xung mộ. Chỉ nêu ngày can chi gần nhất —
  không hứa kết quả.

Không gọi LLM, không chạm DB, không giữ trạng thái.
"""
from __future__ import annotations

import datetime as dt

from app.calc import vuong_suy as vs
from app.calc.battu import CHI_NH as _CHI_NH_LIST, LUC_HOP, LUC_XUNG
from app.calc.kinhdich_vendor import KHAC, SINH, TRI_BITS, info
from app.calc.lunar import CAN, CHI, can_chi_ngay

CHI_NH = dict(zip(CHI, _CHI_NH_LIST))
LUC_THU = ["Thanh Long", "Chu Tước", "Câu Trần", "Đằng Xà", "Bạch Hổ", "Huyền Vũ"]
_KHOI_THU = {"Giáp": 0, "Ất": 0, "Bính": 1, "Đinh": 1, "Mậu": 2, "Kỷ": 3, "Canh": 4, "Tân": 4, "Nhâm": 5, "Quý": 5}
LUC_THAN = ("Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ")
# Vòng sinh của lục thân (lấy "ta" = Huynh Đệ): Phụ Mẫu sinh Huynh Đệ sinh Tử Tôn sinh Thê Tài sinh Quan Quỷ sinh Phụ Mẫu.
_SINH_LT = {"Phụ Mẫu": "Huynh Đệ", "Huynh Đệ": "Tử Tôn", "Tử Tôn": "Thê Tài", "Thê Tài": "Quan Quỷ", "Quan Quỷ": "Phụ Mẫu"}
_KHAC_LT = {"Phụ Mẫu": "Tử Tôn", "Tử Tôn": "Quan Quỷ", "Quan Quỷ": "Huynh Đệ", "Huynh Đệ": "Thê Tài", "Thê Tài": "Phụ Mẫu"}
_TIEN = {("Dần", "Mão"), ("Tỵ", "Ngọ"), ("Thân", "Dậu"), ("Hợi", "Tý"), ("Sửu", "Thìn"), ("Thìn", "Mùi"),
         ("Mùi", "Tuất"), ("Tuất", "Sửu")}
_MO = {"Mộc": "Mùi", "Hỏa": "Tuất", "Kim": "Sửu", "Thủy": "Thìn", "Thổ": "Thìn"}


# ------------------------------------------------------------------ bảng cơ bản
def luc_thu(can_ngay: str) -> list[str]:
    """Lục thú 6 hào (hào 1 → 6) theo can ngày."""
    k = _KHOI_THU[can_ngay]
    return [LUC_THU[(k + i) % 6] for i in range(6)]


def nguyen_than(dung: str) -> str:
    return next(k for k, v in _SINH_LT.items() if v == dung)


def ky_than(dung: str) -> str:
    return next(k for k, v in _KHAC_LT.items() if v == dung)


def cuu_than(dung: str) -> str:
    return ky_than(nguyen_than(dung))


def mo_cua(hanh: str) -> str:
    return _MO[hanh]


def xung(a: str, b: str) -> bool:
    return frozenset((a, b)) in LUC_XUNG


def hop(a: str, b: str) -> bool:
    return frozenset((a, b)) in LUC_HOP


def chi_xung(chi: str) -> str:
    return CHI[(CHI.index(chi) + 6) % 12]


def chi_hop(chi: str) -> str:
    return next(c for c in CHI if c != chi and hop(c, chi))


def nguyet_pha(chi_hao: str, chi_thang: str) -> bool:
    return xung(chi_hao, chi_thang)


# ------------------------------------------------------------------ phục thần
def phuc_than(quai_ban: dict) -> list[dict]:
    """Lục thân khuyết trong quẻ → phục thần mượn từ quẻ Bát thuần cùng cung: [{luc_than, vi_tri, dia_chi, ngu_hanh,
    phi_than (lục thân đang hiện ở vị trí đó)}]."""
    co = {h["luc_than"] for h in quai_ban["hao"]}
    thieu = [lt for lt in LUC_THAN if lt not in co]
    if not thieu:
        return []
    cung = quai_ban["bat_cung"]["cung"]
    thuan = info(TRI_BITS[cung] + TRI_BITS[cung])
    ra = []
    for h in thuan["hao"]:
        if h["luc_than"] in thieu:
            ra.append({"luc_than": h["luc_than"], "vi_tri": h["vi_tri"], "dia_chi": h["dia_chi"],
                       "ngu_hanh": h["ngu_hanh"], "phi_than": quai_ban["hao"][h["vi_tri"] - 1]["luc_than"],
                       "phi_dia_chi": quai_ban["hao"][h["vi_tri"] - 1]["dia_chi"]})
    return ra


# ------------------------------------------------------------------ hào động hoá ra
def hoa(chi_goc: str, chi_bien: str) -> dict:
    """Quan hệ giữa hào động và hào nó biến ra."""
    a, b = CHI_NH[chi_goc], CHI_NH[chi_bien]
    if chi_goc == chi_bien:
        loai = "phục ngâm"
    elif xung(chi_goc, chi_bien):
        loai = "phản ngâm"
    elif (chi_goc, chi_bien) in _TIEN:
        loai = "tiến thần"
    elif (chi_bien, chi_goc) in _TIEN:
        loai = "thoái thần"
    elif a == b:
        loai = "hoá tỷ"
    elif SINH[b] == a:
        loai = "hồi đầu sinh"
    elif KHAC[b] == a:
        loai = "hồi đầu khắc"
    elif SINH[a] == b:
        loai = "hoá tiết"
    else:
        loai = "hoá khắc xuất"
    return {"dia_chi": chi_bien, "ngu_hanh": b, "loai": loai}


# ------------------------------------------------------------------ trạng thái từng hào theo ngày tháng
def trang_thai_hao(chi_hao: str, hanh_hao: str, dong: bool, tg: dict) -> dict:
    d = vs.danh_gia(chi_hao, hanh_hao, tg)
    manh = d["nguyet_lenh"] in ("vượng", "tướng")
    bi_nhat_xung = xung(chi_hao, tg["chi_ngay"])
    return {
        **d,
        "nguyet_pha": nguyet_pha(chi_hao, tg["chi_thang"]),
        "am_dong": (not dong) and bi_nhat_xung and manh,
        "nhat_pha": (not dong) and bi_nhat_xung and not manh,
        "nhap_mo": _MO[hanh_hao] in (tg["chi_ngay"], tg["chi_thang"]),
        "nhat_hop": hop(chi_hao, tg["chi_ngay"]),
    }


# ------------------------------------------------------------------ ứng kỳ
def ngay_gan_nhat(chi: str, tu_ngay: dt.date) -> dt.date:
    """Ngày dương lịch gần nhất SAU `tu_ngay` có địa chi `chi` (1–12 ngày sau)."""
    hom_nay = can_chi_ngay(tu_ngay)[1]
    k = (CHI.index(chi) - CHI.index(hom_nay)) % 12 or 12
    return tu_ngay + dt.timedelta(days=k)


def _ung_ky_cho_hao(h: dict, tg: dict, tu_ngay: dt.date) -> list[dict]:
    c = h["dia_chi"]
    ra: list[tuple[str, str]] = []
    if h["tuan_khong"]:
        ra.append((c, "ra khỏi tuần không (ngày trị)"))
        ra.append((chi_xung(c), "ngày xung không — việc đang treo được gọi dậy"))
    if h["nhap_mo"]:
        ra.append((chi_xung(_MO[h["ngu_hanh"]]), "ngày xung mở mộ — việc đang bị giam lộ ra"))
    if h["dong"]:
        if h["nhat_hop"]:
            ra.append((chi_xung(c), "hào động bị hợp, chờ ngày xung mở"))
        else:
            ra.append((chi_hop(c), "ngày hợp với hào động"))
            ra.append((c, "ngày trị (cùng chi)"))
    else:
        ra.append((chi_xung(c), "hào tĩnh chờ ngày xung động"))
        ra.append((c, "ngày trị (cùng chi)"))
    thay: dict[str, dict] = {}
    for chi, ly in ra:
        if chi not in thay:
            ngay = ngay_gan_nhat(chi, tu_ngay)
            thay[chi] = {"chi": chi, "ly_do": ly, "hao": h["vi_tri"], "ngay_gan_nhat": ngay.isoformat(),
                         "sau_bao_nhieu_ngay": (ngay - tu_ngay).days}
    return sorted(thay.values(), key=lambda x: x["sau_bao_nhieu_ngay"])


# ------------------------------------------------------------------ phân tích trọn quẻ
def phan_tich(que: dict, tg: dict, dung_than: str | None, thoi_diem: dt.datetime | dt.date | None = None) -> dict:
    """`que` = kết quả `kinhdich.khoi_que`; `tg` = `vuong_suy.thoi_gian(...)`; `dung_than` = một trong 5 lục thân hoặc
    "Ứng" (hào Ứng) hoặc None. → {luc_thu, hao: [...], dung_than: {...} | None, ung_ky: [...]}"""
    ban, bien = que["quai_ban"], que.get("quai_bien")
    tu_ngay = (thoi_diem.date() if isinstance(thoi_diem, dt.datetime) else thoi_diem) or dt.date.today()
    thu = luc_thu(tg["can_ngay"])
    hao = []
    for h in ban["hao"]:
        i = h["vi_tri"]
        dong = i in que["hao_dong"]
        x = {"vi_tri": i, "am_duong": h["am_duong"], "dia_chi": h["dia_chi"], "ngu_hanh": h["ngu_hanh"],
             "luc_than": h["luc_than"], "the_ung": h["the_ung"] or None, "luc_thu": thu[i - 1], "dong": dong,
             **trang_thai_hao(h["dia_chi"], h["ngu_hanh"], dong, tg)}
        x["hoa"] = hoa(h["dia_chi"], bien["hao"][i - 1]["dia_chi"]) if (dong and bien) else None
        if x["hoa"] and x["hoa"]["dia_chi"] in tg["tuan_khong"]:
            x["hoa"]["hoa_khong"] = True
        hao.append(x)
    phuc = phuc_than(ban)
    for p in phuc:
        hao[p["vi_tri"] - 1]["phuc"] = {k: p[k] for k in ("luc_than", "dia_chi", "ngu_hanh")}
    d = None
    if dung_than:
        if dung_than in ("Ứng", "Thế"):
            vi = [h for h in hao if h["the_ung"] == dung_than]
        else:
            vi = [h for h in hao if h["luc_than"] == dung_than]
        phuc_dt = next((p for p in phuc if p["luc_than"] == dung_than), None)
        the = next(h for h in hao if h["the_ung"] == "Thế")
        d = {"ten": dung_than, "vi_tri": vi, "phuc": not vi, "phuc_than": phuc_dt, "hao_the": the["vi_tri"]}
        if dung_than not in ("Ứng", "Thế"):
            for vai, ten in (("nguyen_than", nguyen_than(dung_than)), ("ky_than", ky_than(dung_than)),
                             ("cuu_than", cuu_than(dung_than))):
                d[vai] = {"ten": ten, "vi_tri": [h["vi_tri"] for h in hao if h["luc_than"] == ten],
                          "dong": [h["vi_tri"] for h in hao if h["luc_than"] == ten and h["dong"]]}
    ung_ky: list[dict] = []
    if d:
        nguon = d["vi_tri"] or ([hao[d["phuc_than"]["vi_tri"] - 1]] if d["phuc_than"] else [])
        for h in nguon:
            ung_ky += _ung_ky_cho_hao(h, tg, tu_ngay)
        seen, gon = set(), []
        for u in sorted(ung_ky, key=lambda x: x["sau_bao_nhieu_ngay"]):
            if u["chi"] not in seen:
                seen.add(u["chi"])
                gon.append(u)
        ung_ky = gon[:4]
    return {"luc_thu": thu, "hao": hao, "dung_than": d, "ung_ky": ung_ky, "thoi_gian": tg,
            "nguon": "Tăng San Bốc Dịch (rút gọn); ứng kỳ là nhịp gợi ý, không phải dự báo."}
