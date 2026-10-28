# -*- coding: utf-8 -*-
"""LG-ĐS — RULES "Luận giải Tử vi đời sống" (`docs/LUAN-GIAI-DOI-SONG.md` mục 2). Tất định, không LLM, không DB.

Đọc lá số (dạng gọn `hoidap.tuvi.tom_tat`) → CHẤM từng cung → chọn câu đời thường từ KB `tuvi_doi_song_kb`
→ ghép 12 chương có hộp nổi bật (`hop`), thân bài (`doan`), "Vì sao nói vậy" (`can_cu`, thuật ngữ chỉ ở đây).

Chấm cung (mục 2.1): chính tinh theo độ sáng Nam phái (Miếu/Vượng +2, Đắc +1, Bình 0, Hãm −2) + tứ hoá sinh niên
trong cung (Lộc +2, Quyền +1, Khoa +1, Kỵ −2) + lục cát (Tả, Hữu, Xương, Khúc, Khôi, Việt, Lộc Tồn: +1) + lục sát
(Kình, Đà, Hoả, Linh, Không, Kiếp: −1) + NỬA tổng điểm gốc của cung xung chiếu và hai cung tam hợp (cắt về 0).
Tuần/Triệt → cờ `cham`, không cộng trừ. Cung vô chính diệu mượn chính tinh cung xung chiếu (khi đó phần chính tinh
của cung xung không tính lại vào nửa điểm, tránh đếm hai lần). Mức: ≥ 4 `thuan` (VH-1: trước là 3 — 55% cung "Thuận
lợi" trên 60 lá golden), ≤ −2 `can_chu_dong` (nhãn "Cần lưu ý"), còn lại `can_bang`. Đường bay theo thang riêng
(`NGUONG_BAY`); Lời khuyên và Vận hạn không mang mức. Điểm không trả ra cho người dùng. Chương "Mười năm tới & điều nên tránh (vận hạn)"
(VH-1): luật điểm năm ở chú thích trên `dong_muoi_nam`.

Tự học (mục 3 — ranh giới): `trong_so` (tỉ lệ công khai theo `ma_mau`) chỉ gắn số / hạ hộp có tỉ lệ đúng thấp,
`ca_nhan` chỉ xếp lại hộp người này đã bấm "chưa đúng". Không sinh câu mới, không sửa KB.
"""
from __future__ import annotations

import datetime as dt
import re

from app import config
from app.calc import lunar, tuvi_an_sao as az
from app.calc import tuvi_luu_nguyet as ln
from app.calc import tuvi_phi_hoa as phi_calc
from app.kb import tuvi_doi_song_kb as kb
from app.kb import tuvi_kb
from app.luangiai import tuvi_nhip_3_thang as nhip3
from app.luangiai import tuvi_phi_hoa as phl
from app.luangiai import doi_song_chung as dsc
from app.luangiai import doi_song_khuon as kh
from app.luangiai.doi_song_chung import (  # noqa: F401 — tách dùng chung với Bát tự (BT-ĐS), giữ tên cũ
    MA_MAU_RE, TOI_DA_HOP, _ap_hoc, _cac_cau, _cau_dau, _hoa_dau, _ma, _sach, _sap, _tieu_de, slug, trong_so_xem_lai)

PHIEN_BAN = "doi_song_1"

DIEM_SANG = {"Miếu": 2, "Vượng": 2, "Đắc": 1, "Bình": 0, "Hãm": -2}
DIEM_HOA = {"Lộc": 2, "Quyền": 1, "Khoa": 1, "Kỵ": -2}
LUC_CAT = ("Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Lộc Tồn")
LUC_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp")
DAO_HOA = ("Hàm Trì", "Hồng Loan", "Thiên Hỷ", "Thiên Diêu")
TUAN_TRIET = {"Tuần Không": "Tuần", "Triệt Lộ": "Triệt"}
# VH-1 (2026-10-21): ngưỡng Thuận lợi 3 → 4 — đo 60 lá golden: ngưỡng 3 cho 55% cung (và 67% chương Công việc)
# "Thuận lợi", nhãn ai cũng nhận thì không còn nghĩa. Bảng trước/sau: docs/LUAN-GIAI-DOI-SONG.md mục 8.
NGUONG_THUAN, NGUONG_CHU_DONG = 4, -2
NGUONG_BAY = (1, -3)
CUNG_UU_TIEN = ("Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê")

# (ma, tiêu đề, câu hỏi chuẩn — giữ cho tương thích, các cung đọc)
CHUONG = [
    ("tong_quan", "Con người bạn", "Rốt cuộc tôi là người thế nào?", ["Mệnh", "Phúc Đức"]),
    ("cuoc_doi", "Các giai đoạn cuộc đời", "Đời tôi đi qua những giai đoạn nào?", []),
    ("su_nghiep", "Công việc & sự nghiệp", "Tôi hợp làm việc thế nào?", ["Quan Lộc"]),
    ("tien_bac", "Tiền bạc", "Tôi kiếm và giữ tiền ra sao?", ["Tài Bạch", "Điền Trạch"]),
    ("tinh_cam", "Tình yêu & hôn nhân", "Tôi yêu và sống chung thế nào?", ["Phu Thê"]),
    ("gia_dinh", "Gia đình: cha mẹ, anh em, con cái", "Tôi và người nhà hợp nhau ra sao?",
     ["Phụ Mẫu", "Huynh Đệ", "Tử Nữ"]),
    ("suc_khoe", "Sức khoẻ & năng lượng", "Tôi nên giữ sức thế nào?", ["Tật Ách"]),
    ("quan_he", "Bạn bè, đồng nghiệp, môi trường bên ngoài", "Tôi đi ra ngoài, làm với người khác thế nào?",
     ["Nô Bộc", "Thiên Di"]),
    ("nha_cua", "Nhà cửa, nơi ở", "Chuyện nhà cửa của tôi thế nào?", ["Điền Trạch"]),
    ("duong_bay", "Mảng đời nào kéo mảng đời nào", "Mảng đời nào đang tác động lên mảng nào?", []),
    ("nam_nay", "Năm nay & 3 tháng tới", "Năm nay và 3 tháng tới của tôi thế nào?", []),
    ("van_han", "Mười năm tới & điều nên tránh (vận hạn)", "Mười năm tới năm nào nên đi chậm, và chậm ở chuyện gì?", []),
    ("loi_khuyen", "Lời khuyên dành cho bạn", "Tôi nên làm gì từ đây?", []),
]
CHUONG_COT_LOI = ("tong_quan", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "quan_he", "nha_cua", "duong_bay")

_TEN_MAC_DINH = dict(phl.MANG, **{"Mệnh": "con người bạn"})
# Lý do của MỨC một cung, nói bằng lời đời thường (không tên sao, không độ sáng) — tóm tắt chương và dòng thời gian
# nói "vì sao" thay cho câu mô tả mức chung chung (rà 2026-10-21). (lý do, dấu: +1 đỡ / −1 vướng / 0 trung tính)
_LY_DO_SANG = {"Miếu": "nét mạnh của bạn ở đây phát huy rõ", "Vượng": "nét mạnh của bạn ở đây phát huy rõ",
               "Đắc": "nét mạnh của bạn ở đây dùng được việc", "Hãm": "nét của bạn ở đây dễ lệch khi gặp áp lực",
               "Bình": "nét của bạn ở đây không nổi hẳn"}
_LY_DO_HOA = {"Lộc": "có thêm nguồn thuận tự tìm đến", "Quyền": "bạn nắm được phần quyết định",
              "Khoa": "bạn có tiếng tốt, nói ra dễ được tin", "Kỵ": "bạn hay bận lòng về mảng này"}
# Cung Tật Ách: độ sáng nói về SỨC, không nói "nét mạnh".
_LY_DO_SANG_SK = {"Miếu": "sức bạn khá bền", "Vượng": "sức bạn khá bền", "Đắc": "sức bạn đủ dùng nếu giữ nếp",
                  "Hãm": "sức bạn dễ hao khi gặp áp lực", "Bình": "sức bạn ở mức vừa phải"}
_HOA_MAC_DINH = {
    "Lộc": ("Chuyện {t} có thêm thuận lợi, bạn dễ được giúp ở mảng này.",
            "Nên giữ lại một phần điều tốt đến từ mảng này thay vì dùng hết ngay."),
    "Quyền": ("Ở chuyện {t}, bạn có tiếng nói và hay được giao việc cầm trịch.",
              "Nên hỏi ý người liên quan trước khi tự quyết thay cả nhóm."),
    "Khoa": ("Ở chuyện {t}, bạn có uy tín, mọi việc dễ rõ ràng.",
             "Nên giữ thói quen ghi chép, nói rõ để uy tín ấy bền."),
    "Kỵ": ("Chuyện {t} dễ làm bạn bận tâm hơn mức cần.",
           "Nên làm chậm lại, nói rõ và ghi lại điều đã thống nhất."),
}
_NHOM_MAC_DINH = {
    "cat": ("Ở chuyện {t}, bạn hay có người giúp đúng lúc.", "Nên mở lời nhờ sớm và nhớ đáp lại người đã giúp."),
    "sat": ("Chuyện {t} hay có việc gấp, việc bất ngờ chen vào.", "Nên chừa thời gian dự phòng và tránh quyết vội."),
    "dao_hoa": ("Bạn có sức hút trong chuyện {t}.", "Nên giữ chừng mực và nói rõ điều mình muốn."),
}
_HUONG_MAC_DINH = "Nên làm chậm lại, chuẩn bị sớm và hỏi thêm người có kinh nghiệm."
_HUONG_TT = "Nên chuẩn bị sớm, kiên nhẫn và đừng bỏ ngang khi chưa thấy kết quả."
_SK_MAC_DINH = "Nên giữ giờ ngủ, ăn uống đều, vận động nhẹ mỗi ngày và khám sức khoẻ định kỳ."
_THU_TU_LOP = ("dai_han", "luu_nien", "tieu_han")
_MUC_THANG = {"thuan": "thuan", "binh": "can_bang", "can_than": "can_chu_dong"}
_NHAN_LOP = {"thuan": "mảng này đang thuận", "can_bang": "mảng này ở mức cân bằng",
             "can_chu_dong": "mảng này cần lưu ý hơn"}
# Hướng xử lý dự phòng trong mã (KB thiếu ô) — `scripts/do_chung_chung_tuvi.py` đếm là "hướng chung".
HUONG_DU_PHONG = (_HUONG_MAC_DINH, _HUONG_TT, _SK_MAC_DINH, *(v[1] for v in _HOA_MAC_DINH.values()),
                  *(v[1] for v in _NHOM_MAC_DINH.values()))


# ------------------------------------------------------------------ tiện ích
def _ten(cung: str) -> str:
    return kb.ten_doi_thuong(cung) or _TEN_MAC_DINH.get(cung, cung.lower())


_MENH_THAY = (("Ở chuyện con người bạn, bạn ", "Bạn "), ("Ở chuyện con người bạn, ", "Với bản thân bạn, "),
              ("Chuyện con người bạn ", "Bản thân bạn "), ("trong chuyện con người bạn", "quanh bạn"),
              ("chính chuyện con người bạn", "chính bạn"), ("chuyện con người bạn", "chính bạn"),
              ("Điểm mạnh về con người bạn", "Điểm mạnh của bạn"), ("Điều dễ vấp về con người bạn", "Điều bạn dễ vấp"),
              ("về con người bạn", "về bản thân bạn"))


def _sua_menh(s: str | None) -> str | None:
    """Câu mẫu "chuyện {lĩnh vực}" gặp cung Mệnh ("con người bạn") → nói thẳng về "bạn"."""
    if not s:
        return s
    for a, b in _MENH_THAY:
        s = s.replace(a, b)
    return s


def _muc(diem: float) -> str:
    return "thuan" if diem >= NGUONG_THUAN else "can_chu_dong" if diem <= NGUONG_CHU_DONG else "can_bang"


def _hop(loai: str, tieu_de: str, noi_dung: str, can_cu: list[str], ma_mau: str, trong: float,
         huong: str | None = None, **them) -> dict:
    h = {"loai": loai, "tieu_de": _sua_menh(tieu_de), "noi_dung": _sua_menh(noi_dung.strip()),
         "can_cu": [c for c in can_cu if c], "ma_mau": ma_mau, "_w": trong}
    if "loi_khuyen" in them:
        them["loi_khuyen"] = _sua_menh(them["loi_khuyen"])
    if loai == "luu_y":
        h["huong_xu_ly"] = _sua_menh(huong) or _HUONG_MAC_DINH
        if h["huong_xu_ly"] not in h["noi_dung"]:
            h["noi_dung"] = f"{h['noi_dung']} {h['huong_xu_ly']}"
    h.update(them)
    return h


# ------------------------------------------------------------------ chấm cung
def _sao_cung(c: dict) -> tuple[list[str], list[str], list[str], list[str]]:
    p = c["phu_tinh"]
    return ([s for s in p if s in LUC_CAT], [s for s in p if s in LUC_SAT], [s for s in p if s in DAO_HOA],
            [TUAN_TRIET[s] for s in p if s in TUAN_TRIET])


def _diem_chinh(chinh: list[dict]) -> int:
    return sum(DIEM_SANG.get(s.get("do_sang") or "", 0) for s in chinh)


def _diem_phu(ls: dict, c: dict) -> int:
    cat, sat, _, _ = _sao_cung(c)
    hoa = sum(DIEM_HOA[x["hoa"]] for x in ls["tu_hoa"] if x["cung"] == c["ten"])
    return hoa + len(cat) - len(sat)


def cham_cung(ls: dict) -> dict[str, dict]:
    """→ {tên cung: {diem, muc, cham, chinh: [{ten, do_sang, muon}], muon_tu, hoa, cat, sat, dao_hoa, tuan_triet,
    lan_can: [xung, tam hợp 1, tam hợp 2]}}. Tất định theo lá số."""
    cung = ls["cung"]
    goc = {c["ten"]: _diem_chinh(c["chinh_tinh"]) + _diem_phu(ls, c) for c in cung}
    ra = {}
    for i, c in enumerate(cung):
        xung, th1, th2 = cung[(i + 6) % 12], cung[(i + 4) % 12], cung[(i + 8) % 12]
        chinh = [{"ten": s["ten"], "do_sang": s["do_sang"], "muon": False} for s in c["chinh_tinh"]]
        muon_tu = None
        nua = goc[xung["ten"]] + goc[th1["ten"]] + goc[th2["ten"]]
        if not chinh and xung["chinh_tinh"]:
            muon_tu = xung["ten"]
            chinh = [{"ten": s["ten"], "do_sang": s["do_sang"], "muon": True} for s in xung["chinh_tinh"]]
            nua -= _diem_chinh(xung["chinh_tinh"])
        diem = _diem_chinh(chinh) + _diem_phu(ls, c) + int(nua / 2)
        cat, sat, dao, tt = _sao_cung(c)
        ra[c["ten"]] = {"ten": c["ten"], "diem": diem, "muc": _muc(diem), "cham": bool(tt), "chinh": chinh,
                        "nua": int(nua / 2),
                        "muon_tu": muon_tu, "hoa": [x for x in ls["tu_hoa"] if x["cung"] == c["ten"]],
                        "cat": cat, "sat": sat, "dao_hoa": dao, "tuan_triet": tt,
                        "lan_can": [xung["ten"], th1["ten"], th2["ten"]],
                        # điểm riêng của 3 cung chiếu về (để gọi TÊN mảng đang đỡ / kéo trong lời "vì sao")
                        "_lan_can_diem": [(n["ten"], goc[n["ten"]] - (_diem_chinh(n["chinh_tinh"])
                                                                      if n is xung and muon_tu else 0))
                                          for n in (xung, th1, th2)]}
    return ra


# ------------------------------------------------------------------ hộp theo cung
def _sao_van(sao: str, cung: str, nhom: str) -> dict:
    """Câu đời thường cho chính tinh × cung × sáng/hãm; thiếu ô → câu chung dựng từ điểm mạnh / mặt tối của sao."""
    m = kb.sao_linh_vuc(sao, cung, nhom) or {}
    ct = tuvi_kb.chinh_tinh(sao) or {}
    t = _ten(cung)
    dm = ct.get("diem_manh") or "kiên trì với việc mình chọn"
    mt = ct.get("mat_toi") or "làm theo cảm hứng"
    return {"manh": m.get("manh") or f"Ở chuyện {t}, bạn có lợi thế: {dm}.",
            "de_vap": m.get("de_vap") or f"Ở chuyện {t}, điều dễ vấp là: {mt}.",
            "loi_khuyen": m.get("loi_khuyen") or (f"Nên dựa vào chỗ mạnh ({dm.split(',')[0]}) và chậm lại khi thấy "
                                                   f"mình {mt.split(',')[0]}.")}


def _hop_cung(ch: str, ten: str, cc: dict, ghep: bool) -> list[dict]:
    """Ứng viên hộp của một cung, đã gắn trọng số `_w` (càng lớn càng đáng nói)."""
    t = _ten(ten)
    hau = f"+{slug(ten)}" if ghep else ""
    ra: list[dict] = []
    for s in cc["chinh"]:
        ds = s["do_sang"] or "Bình"
        nhom = "ham" if ds == "Hãm" else "sang"
        van = _sao_van(s["ten"], ten, nhom)
        trang = ("muon_" if s["muon"] else "") + nhom
        cu = (f"{s['ten']} ({ds}) mượn từ cung {cc['muon_tu']}, chiếu sang {ten} (vô chính diệu)" if s["muon"]
              else f"{s['ten']} ({ds}) ở cung {ten}")
        w = abs(DIEM_SANG.get(ds, 0)) or 0.5
        if s["muon"]:
            w *= 0.75
        goc = slug(s["ten"]) + hau
        bo_manh = ds == "Bình" and cc["muc"] == "can_chu_dong"
        if not bo_manh:
            ra.append(_hop("diem_manh", _tieu_de(van["manh"], f"Điểm mạnh về {t}"), van["manh"], [cu],
                           _ma("ds", ch, goc, trang, "manh"), w if nhom == "sang" else 0.4))
        ra.append(_hop("luu_y", _tieu_de(van["de_vap"], f"Điều dễ vấp về {t}"), van["de_vap"], [cu],
                       _ma("ds", ch, goc, trang, "vap"), w if nhom == "ham" else w * 0.45,
                       huong=van["loi_khuyen"]))
    for x in cc["hoa"]:
        m = kb.hoa_linh_vuc(x["hoa"], ten) or {}
        y0, lk0 = _HOA_MAC_DINH[x["hoa"]]
        y, lk = m.get("y") or y0.format(t=t), m.get("loi_khuyen") or lk0
        cu = f"Hoá {x['hoa']} ({x['sao']}) ở cung {ten}"
        goc = "hoa_" + slug(x["hoa"]) + hau
        if x["hoa"] == "Kỵ":
            ra.append(_hop("luu_y", _tieu_de(y, f"Điều cần chăm chút về {t}"), y, [cu],
                           _ma("ds", ch, goc, "sinh", "vap"), 2.1, huong=lk))
        else:
            ra.append(_hop("diem_manh", _tieu_de(y, f"Điểm thuận về {t}"), y, [cu],
                           _ma("ds", ch, goc, "sinh", "manh"), abs(DIEM_HOA[x["hoa"]]) + 0.1, loi_khuyen=lk))
    for nhom, sao in (("cat", cc["cat"]), ("sat", cc["sat"])):
        if not sao:
            continue
        m = kb.nhom_sao_linh_vuc(nhom, ten) or {}
        y0, lk0 = _NHOM_MAC_DINH[nhom]
        y, lk = m.get("y") or y0.format(t=t), m.get("loi_khuyen") or lk0
        if nhom == "sat":
            lk = kb.sat_loi_khuyen(ten, sao) or lk
        ve = list(dict.fromkeys(v for v in (kb.nhom_sao_chi_tiet(x) for x in sao) if v))[:2]
        if ve:
            y = f"{y.rstrip('. ')}; {', '.join(ve)}."
        cu = f"{', '.join(sao)} ở cung {ten} ({'lục cát' if nhom == 'cat' else 'lục sát'})"
        goc = nhom + hau
        if nhom == "cat":
            ra.append(_hop("diem_manh", _tieu_de(y, f"Người giúp bạn trong chuyện {t}"), y, [cu],
                           _ma("ds", ch, goc, "co", "manh"), 0.6 + 0.3 * len(sao), loi_khuyen=lk))
        else:
            ra.append(_hop("luu_y", _tieu_de(y, f"Việc bất ngờ trong chuyện {t}"), y, [cu],
                           _ma("ds", ch, goc, "co", "vap"), 0.6 + 0.3 * len(sao), huong=lk))
    if cc["cham"]:
        cu = f"{' và '.join(cc['tuan_triet'])} ở cung {ten}: việc đến chậm, cần kiên nhẫn"
        tt = kb.tuan_triet(ten) or {}
        # Triệt: lúc trẻ hay bị ngắt, về sau thông; Tuần: chậm mà bền. Có cả hai → lời Triệt (rõ hơn ở tiền vận).
        triet = "Triệt" in cc["tuan_triet"]
        y = tt.get("triet" if triet else "tuan") or f"Ở chuyện {t}, việc thường đến chậm hơn bạn mong."
        ra.append(_hop("luu_y", _tieu_de(y, f"Chuyện {t} đến chậm hơn mong đợi"), y,
                       [cu], _ma("ds", ch, "tuan_triet" + hau, "cham", "vap"), 1.0,
                       huong=(tt.get("loi_khuyen_triet") if triet else None) or tt.get("loi_khuyen") or _HUONG_TT))
    for i, h in enumerate(ra):
        h["_w"] += -0.001 * i            # hoà điểm → giữ thứ tự sinh (tất định)
        h["_cung"] = ten
    return ra


def _hop_dao_hoa(ch: str, ten: str, cc: dict) -> list[dict]:
    if not cc["dao_hoa"]:
        return []
    m = kb.nhom_sao_linh_vuc("dao_hoa", ten) or {}
    y0, lk0 = _NHOM_MAC_DINH["dao_hoa"]
    y, lk = m.get("y") or y0.format(t=_ten(ten)), m.get("loi_khuyen") or lk0
    return [_hop("diem_manh", _tieu_de(y, "Sức hút trong chuyện tình cảm"), f"{y} {lk}",
                 [f"{', '.join(cc['dao_hoa'])} ở cung {ten} (nhóm đào hoa)"],
                 _ma("ds", ch, "dao_hoa+" + slug(ten), "co", "manh"), 0.9 + 0.2 * len(cc["dao_hoa"]), _cung=ten)]


# ------------------------------------------------------------------ dựng chương
def _chuong(ma: str, muc: str, tom_tat: str, hop: list[dict], doan: list[str], can_cu: list[str],
            cau_tu_soi: str | None, **them) -> dict:
    t = next(x for x in CHUONG if x[0] == ma)
    # Web hiện cả hộp lẫn thân bài → thân bài KHÔNG chép lại câu của hộp (chỉ tóm tắt, câu nối, giải thích mức).
    cau_hop = {c for h in hop for c in _cac_cau(h["noi_dung"])}
    sach, da = [], set()
    for d in (x.strip() for x in doan if x and x.strip()):
        giu = [c for c in _cac_cau(d) if c not in cau_hop and c not in da]
        da.update(giu)
        if giu:
            sach.append(" ".join(giu))
    if not sach or not sach[0].startswith(tom_tat):
        sach.insert(0, tom_tat)
    return {"ma": ma, "tieu_de": t[1], "cau_hoi": t[2], "muc": muc, "nhan_muc": kb.nhan_muc(muc) if muc else None,
            "tom_tat": tom_tat, "hop": hop, "doan": sach[:4], "can_cu": list(dict.fromkeys(c for c in can_cu if c)),
            "cau_tu_soi": cau_tu_soi, **them}


def _thuong(s: str) -> str:
    s = s.rstrip("…. ")
    return s[:1].lower() + s[1:]          # tiêu đề hộp không mở bằng tên riêng (thuật ngữ chỉ ở can_cu)


# Trục 1 (2026-10-26): bỏ "đoạn nối" liệt kê lại tiêu đề hộp ("Trong công việc, bạn dựa được vào: …. Còn chỗ hay
# vấp: …") — web đã hiện hộp ngay trên, đoạn ấy chỉ chép lại. Thân chương còn câu tóm tắt + câu riêng của chương.


def _ten_lan(cung: str) -> str:
    return "sức của chính bạn" if cung == "Mệnh" else f"chuyện {_ten(cung)}"


def ly_do(x: dict) -> list[tuple[str, int]]:
    """Lý do (đời thường) làm nên mức của cung `x` (một mục của `cham_cung`), xếp theo sức nặng — tất định."""
    ra: list[tuple[str, int, float]] = []
    for s in x["chinh"][:1]:                                  # chính tinh đầu (cung có hai sao: sao đứng trước)
        ds = s["do_sang"] or "Bình"
        if s["muon"]:
            ra.append(("không có nét riêng nổi hẳn, bạn hay làm theo nếp của người bên cạnh", 0, 1.0))
        else:
            bang = _LY_DO_SANG_SK if x.get("ten") == "Tật Ách" else _LY_DO_SANG
            ra.append((bang[ds], 1 if DIEM_SANG.get(ds, 0) > 0 else -1 if ds == "Hãm" else 0,
                       abs(DIEM_SANG.get(ds, 0)) or 0.5))
    for h in x["hoa"]:
        ra.append((_LY_DO_HOA[h["hoa"]], -1 if h["hoa"] == "Kỵ" else 1, abs(DIEM_HOA[h["hoa"]]) + 0.1))
    if x["cat"]:
        ra.append(("hay có người giúp đúng lúc" if len(x["cat"]) < 2 else "có nhiều người sẵn lòng giúp", 1,
                   0.6 + 0.3 * len(x["cat"])))
    if x["sat"]:
        ra.append(("hay có việc bất ngờ chen vào" if len(x["sat"]) < 2 else "nhiều việc bất ngờ chen vào", -1,
                   0.6 + 0.3 * len(x["sat"])))
    if x["cham"]:
        ra.append(("việc thường đến chậm hơn bạn mong", 0, 0.8))
    lc = x.get("_lan_can_diem") or []
    if x.get("nua", 0) >= 1:
        ten = [_ten_lan(t) for t, d in sorted(lc, key=lambda v: -v[1]) if d > 0][:2]
        ra.append((f"{' lẫn '.join(ten)} đỡ thêm cho mảng này" if ten else "các mảng đời liên quan đỡ thêm", 1,
                   0.4 + 0.1 * x["nua"]))
    elif x.get("nua", 0) <= -1:
        ten = [_ten_lan(t) for t, d in sorted(lc, key=lambda v: v[1]) if d < 0][:2]
        ra.append((f"{' lẫn '.join(ten)} cũng đang cần bạn lo" if ten else "các mảng đời liên quan cũng cần bạn lo",
                   -1, 0.4 - 0.1 * x["nua"]))
    ra.sort(key=lambda r: -r[2])
    return [(a, b) for a, b, _ in ra]


def _ly_do_hop_muc(x: dict) -> list[str]:
    """Lý do xếp theo độ hợp với mức của cung (thuận: đỡ trước; cần lưu ý: vướng trước; cân bằng: trung tính)."""
    ld = ly_do(x)
    tot = [a for a, d in ld if d > 0]
    vuong = [a for a, d in ld if d < 0]
    trung = [a for a, d in ld if d == 0]
    return {"thuan": tot + trung + vuong, "can_chu_dong": vuong + trung + tot}.get(x["muc"], trung + vuong + tot)


def ly_do_cau(x: dict, toi_da: int = 2) -> str:
    """Nối 1–2 lý do hợp với mức: thuận → điều đỡ trước; cần lưu ý → điều vướng trước; cân bằng → một đỡ, một
    vướng ("…, nhưng …")."""
    ld = ly_do(x)
    tot = [a for a, d in ld if d > 0]
    vuong = [a for a, d in ld if d < 0]
    trung = [a for a, d in ld if d == 0]
    if x["muc"] == "can_bang" and tot and (vuong or trung) and toi_da > 1:
        return f"{tot[0]}, nhưng {(vuong + trung)[0]}"
    return "; ".join(_ly_do_hop_muc(x)[:toi_da])


def _tom_tat_cung(ds: list[tuple[str, dict]]) -> str:
    """ds = [(tên cung, mục chấm cung)] → một câu: mức + VÌ SAO (lý do từ chính lá số)."""
    if len(ds) == 1:
        ten, x = ds[0]
        dau = "Con người bạn" if ten == "Mệnh" else f"Chuyện {_ten(ten)}"
        ld = ly_do_cau(x)
        if ten == "Mệnh":
            ld = (ld.replace("không có nét riêng nổi hẳn", "bạn không có một nét nổi hẳn").replace(" ở đây", "")
                  .replace("cho mảng này", "cho bạn").replace("về mảng này", "về chính mình"))
        return f"{dau} ở mức {kb.nhan_muc(x['muc']).lower()}" + (f": {ld}." if ld else ".")
    phan, da = [], set()
    for t, x in ds:
        # lý do đầu tiên hợp mức mà chưa nói ở mảng trước (ba mảng gia đình cùng "thuận" không lặp một lý do)
        ld = next((a for a in _ly_do_hop_muc(x) if a not in da), "")
        da.add(ld)
        ld = ld.replace(" ở đây", "")
        phan.append(f"{_ten(t)} ở mức {kb.nhan_muc(x['muc']).lower()}" + (f" ({ld})" if ld else ""))
    return _hoa_dau("; ".join(phan)) + "."


def _tom_tat_menh(x: dict) -> str:
    """Câu tóm tắt chương "Con người bạn" KHÔNG nói mức: lý do đời thường xếp như mức cân bằng (một điều đỡ, một điều
    vướng — "…, nhưng …"), cùng bộ lý do `ly_do` của cung Mệnh."""
    def sua(s: str) -> str:
        return (s.replace("không có nét riêng nổi hẳn", "bạn không có một nét nổi hẳn").replace(" ở đây", "")
                .replace("cho mảng này", "cho bạn").replace("về mảng này", "về chính mình"))
    ld = ly_do(x)
    tot = [a for a, d in ld if d > 0]
    con = [a for a, d in ld if d == 0] + [a for a, d in ld if d < 0]
    if tot:          # có điều đỡ → nói điều đỡ trước, một điều cần chăm sau
        return f"Con người bạn: {sua(tot[0])}" + (f", nhưng {sua(con[0])}." if con else ".")
    if con:          # chỉ có điều cần chăm → nói MỘT điều, gọi đúng tên là "điểm cần chăm" (không phán)
        return f"Điểm cần chăm ở bạn: {sua(con[0])}."
    return "Con người bạn có cả chỗ mạnh lẫn chỗ dễ vấp, như ai cũng vậy."


def _hop_muc(ma: str, ten: str, cc: dict, ghep: bool) -> dict:
    """Hộp dự phòng khi cung có ít điểm nhấn: nói theo mức của cung + việc nên làm của KB đại hạn."""
    x, t = cc[ten], _ten(ten)
    k = kb.dai_han(ten) or {}
    nen = k.get(x["muc"]) or k.get("nen_lam") or "Nên làm từng bước và ghi lại điều đã thống nhất."
    goc = "muc" + (f"+{slug(ten)}" if ghep else "")
    cu = [f"Cung {ten}: chính tinh, tứ hoá, cát/sát và cung chiếu về cộng lại ở mức {kb.nhan_muc(x['muc']).lower()}"]
    ld = ly_do_cau(x).replace(" ở đây", "")
    if x["muc"] == "can_chu_dong":
        return _hop("luu_y", f"Chuyện {t} cần bạn chủ động",
                    f"Chuyện {t} cần bạn chủ động" + (f" vì {ld}." if ld else "."), cu,
                    _ma("ds", ma, goc, x["muc"], "vap"), 0.3, huong=nen, _cung=ten)
    return _hop("diem_manh", f"Chuyện {t}: điều đang đỡ bạn",
                f"Ở chuyện {t}, " + (f"{ld}." if ld else "chưa có điểm nhấn rõ.") + f" {_hoa_dau(nen)}", cu,
                _ma("ds", ma, goc, x["muc"], "manh"), 0.3, loi_khuyen=nen, _cung=ten)


def _chuong_cung(ma: str, cung: list[str], cc: dict, hoc: tuple, da_dung: set[str], them_cand=(),
                 chi_phu: dict | None = None, loc: dict | None = None) -> dict:
    ghep = len(cung) > 1
    cand: list[dict] = list(them_cand)
    for k, ten in enumerate(cung):
        ds = _hop_cung(ma, ten, cc[ten], ghep)
        if (loc or {}).get(ten):
            ds = [h for h in ds if loc[ten](h)]
        gioi = (chi_phu or {}).get(ten)
        if gioi is not None:
            ds = _sap(ds)[:gioi]
        for h in ds:
            h["_w"] += 0.25 if k == 0 else 0
        cand += ds
    cand = [h for h in _sap(cand) if h["noi_dung"] not in da_dung]
    hop, xem_lai = _ap_hoc(cand, *hoc)
    if len(hop) < 2:
        hop += [h for h in (_hop_muc(ma, t, cc, ghep) for t in cung) if h["ma_mau"] not in {x["ma_mau"] for x in hop}
                and not (trong_so_xem_lai(h, hoc))][: 2 - len(hop)]
    da_dung.update(h["noi_dung"] for h in hop)
    diem = sum(cc[t]["diem"] for t in cung) / len(cung)
    muc = cc[cung[0]]["muc"] if not ghep else _muc(int(diem))
    can_cu = [c for h in hop for c in h["can_cu"]] + xem_lai
    for t in cung:
        x = cc[t]
        can_cu.append(f"Cung {t} đọc kèm nửa phần cung xung chiếu {x['lan_can'][0]} và hai cung tam hợp "
                      f"{x['lan_can'][1]}, {x['lan_can'][2]}")
    ts = (tuvi_kb.cung(cung[0]) or {}).get("cau_tu_soi")
    tom = _tom_tat_cung([(t, cc[t]) for t in cung])
    return _chuong(ma, muc, tom, hop, [tom], can_cu, ts)


TRONG_PHA_CACH = 0.9        # cách cục tốt bị phá: bằng nửa cách nguyên vẹn (1,8)
PHA_CACH_LOI = "Nét này dễ bị giảm khi gặp áp lực, nên bạn cần tự chủ nhiều hơn để giữ được nó."
# Phá cách theo đúng nhóm sát tinh hội về → nói nét ấy mờ đi KHI NÀO (thay một câu chung cho mọi cách).
_PHA_KHI = (({"Kình Dương", "Đà La"}, "khi bị chen ép hay việc dây dưa"),
            ({"Hỏa Tinh", "Hoả Tinh", "Linh Tinh"}, "khi bạn nóng vội hay lo ngầm"),
            ({"Địa Không", "Địa Kiếp"}, "khi kế hoạch hay tiền bạc hụt bất ngờ"))


def pha_cach_loi(sat_hoi: list[str], thu: int = 0) -> str:
    """`thu` = thứ tự hộp phá cách trong chương (hộp thứ hai nói khác, không lặp nguyên câu)."""
    khi = [k for nhom, k in _PHA_KHI if nhom & set(sat_hoi or [])]
    if not khi:
        return PHA_CACH_LOI if not thu else "Nét này cũng cần bạn tự chủ nhiều hơn mới giữ được lâu."
    if thu:
        return f"Giống nét trên, nó dễ yếu đi {khi[-1]}; bạn cần tự chủ nhiều hơn để giữ."
    return f"Nét này dễ mờ đi {' hoặc '.join(khi[:2])}, nên bạn cần tự chủ nhiều hơn để giữ được nó."


def _chuong_tong_quan(ls: dict, cc: dict, hoc: tuple, da_dung: set[str]) -> dict:
    them = []
    than = next((c for c in ls["cung"] if c["la_than"]), None)
    if than and than["ten"] != "Mệnh":
        t = _ten(than["ten"])
        k = kb.than_cu(than["ten"]) or {}
        y = k.get("y") or f"Càng lớn tuổi, bạn càng dồn tâm sức cho chuyện {t}."
        lk = k.get("loi_khuyen") or (kb.dai_han(than["ten"]) or {}).get("nen_lam") or ""
        them.append(_hop("loi_khuyen", "Nơi bạn dồn sức về sau", f"{y} {lk}".strip(),
                         [f"Thân cư cung {than['ten']}"], _ma("ds", "tong_quan", "than_cu", slug(than["ten"]), "khuyen"),
                         1.2))
    n_pha = 0
    for c in [c for c in ls.get("cach_cuc", [])][:2]:
        k = tuvi_kb.cach_cuc(c["ma"]) or {}
        y = kb.cach_cuc_doi_thuong(c["ma"], k.get("ten"))
        if not y:
            continue
        cu = f"Cách cục: {k.get('ten', c['ma'])}" + (f" ({k['ten_han']})" if k.get("ten_han") else "")
        if c.get("sat_hoi"):
            cu += f"; tam phương có {', '.join(c['sat_hoi'])} hội về (sách xưa gọi là phá cách)"
        if k.get("nhom") == "hung":
            phan = re.split(r";|—", y, maxsplit=1)
            them.append(_hop("luu_y", _tieu_de(phan[0], "Điểm cần để ý ở con người bạn"), phan[0].strip() + ".",
                             [cu], _ma("ds", "tong_quan", "cach", slug(c["ma"]), "vap"), 1.8,
                             huong=_hoa_dau(phan[1].strip()) if len(phan) > 1 else None))
        elif c.get("sat_hoi"):
            # Phá cách: nét tốt của cách bị giảm khi sát tinh hội về → hạ trọng số, không lên "Điều quan trọng nhất"
            # như điểm mạnh, lời luôn kèm "cần tự chủ nhiều hơn".
            them.append(_hop("diem_manh", _tieu_de(y, "Nét nổi bật của bạn"),
                             f"{y.rstrip('. ')}. {pha_cach_loi(c.get('sat_hoi'), n_pha)}", [cu],
                             _ma("ds", "tong_quan", "cach", slug(c["ma"]), "pha"), TRONG_PHA_CACH, _pha_cach=True))
            n_pha += 1
        else:
            them.append(_hop("diem_manh", _tieu_de(y, "Nét nổi bật của bạn"), y, [cu],
                             _ma("ds", "tong_quan", "cach", slug(c["ma"]), "manh"), 1.8))
    ch = _chuong_cung("tong_quan", ["Mệnh", "Phúc Đức"], cc, hoc, da_dung, them, chi_phu={"Phúc Đức": 2})
    # Trục 1 (2026-10-26): "Con người bạn" không mang chip mức (như Lời khuyên, Vận hạn — VH-1) — người mới đọc chương
    # đầu thấy "Cần lưu ý" là thấy mình "có vấn đề". Mức cung Mệnh vẫn chấm (dòng thời gian, cột lõi dùng), chỉ không hiện.
    ch["tom_tat"] = _tom_tat_menh(cc["Mệnh"])
    ch["doan"] = [ch["tom_tat"]]
    ch["muc"], ch["nhan_muc"] = None, None
    ch["can_cu"] += [f"Mệnh chủ {ls['menh_chu']}, Thân chủ {ls['than_chu']}, {ls['cuc']}"]
    return ch


def _chuong_suc_khoe(cc: dict, hoc: tuple) -> dict:
    x = cc["Tật Ách"]
    cand = []
    nguon = [(s, "Tật Ách") for s in x["chinh"]] + [(s, "Mệnh") for s in cc["Mệnh"]["chinh"][:1]]
    # Vòng thử người dùng mới 2 (UX v3 M3): MỘT hộp cho mọi phần cơ thể sách xưa nhắc (trước: mỗi sao một hộp, hai hộp
    # cùng tiêu đề "Phần cơ thể nên chăm sóc" → người mới tưởng lỗi lặp, thấy như phải lo đủ mọi bộ phận). Chỉ ghép câu KB
    # `bo_phan` đã có; thói quen + việc nên làm lấy của nguồn ĐẦU (sao ở Tật Ách trước, rồi sao ở Mệnh); mọi nguồn nằm ở
    # "Vì sao nói vậy". Mã kiểm chứng = mã của nguồn đầu (đã có trong danh mục SQL, phiếu cũ của sao đó vẫn đếm tiếp).
    co = [(s, noi, sk) for s, noi in nguon if (sk := kb.suc_khoe(s["ten"]))]
    if co:
        s0, noi0, sk0 = co[0]
        bp_ta = list(dict.fromkeys(sk["bo_phan"] for _, noi, sk in co if noi == "Tật Ách" and sk.get("bo_phan")))
        bp_menh = [b for b in dict.fromkeys(sk["bo_phan"] for _, noi, sk in co if noi == "Mệnh" and sk.get("bo_phan"))
                   if b not in bp_ta]
        cau = []
        if bp_ta:
            cau.append(f"Theo sách xưa, phần cơ thể bạn nên chăm sóc phòng ngừa là {'; '.join(bp_ta)}.")
        if bp_menh:
            cau.append(f"Với tính cách của bạn, sách xưa nhắc {'thêm' if bp_ta else 'chăm sóc phòng ngừa'} "
                       f"{'; '.join(bp_menh)}.")
        nd = " ".join([*cau, sk0.get("thoi_quen") or ""]).strip() or "Bạn nên để ý nhịp nghỉ của mình."
        cu = [f"{s['ten']} ({s['do_sang'] or 'Bình'}) ở cung {noi}" + (" (mượn)" if s["muon"] else "") for s, noi, _ in co]
        tieu = "Phần cơ thể nên chăm sóc" if bp_ta or noi0 == "Tật Ách" else "Nhịp sức của chính bạn"
        lk = sk0.get("loi_khuyen") or _SK_MAC_DINH
        ma = _ma("ds", "suc_khoe", slug(s0["ten"]) + ("" if noi0 == "Tật Ách" else "+menh"),
                 "muon" if s0["muon"] else "sao", "vap")
        w = 2.0 if noi0 == "Tật Ách" else 1.0
        # Sao sáng ở cung không cần lưu ý → đây là lời chăm sóc phòng ngừa, không phải "lưu ý" (tránh chương
        # "Thuận lợi" mà toàn hộp lưu ý). Xét theo nhóm nguồn đầu (Tật Ách; không có thì Mệnh) — như hộp của nguồn đầu
        # trước khi gộp. Mã giữ nguyên để phiếu kiểm chứng không đổi.
        if any(s["do_sang"] == "Hãm" or cc[noi]["muc"] == "can_chu_dong" for s, noi, _ in co if noi == noi0):
            cand.append(_hop("luu_y", tieu, nd, cu, ma, w, huong=lk))
        else:
            cand.append(_hop("loi_khuyen", tieu, f"{nd} {lk}", cu, ma, w))
    if x["sat"]:
        # theo từng sát tinh (sao đầu tiên trong cung); KB thiếu → câu chung của nhóm
        sk = next((k for k in (kb.suc_khoe_sat(t) for t in x["sat"]) if k and k.get("thoi_quen")), None) \
            or kb.suc_khoe("sat") or {}
        cand.append(_hop("luu_y", "Thói quen dễ hao sức", sk.get("thoi_quen") or "Bạn dễ làm quá sức rồi mới nghỉ.",
                         [f"{', '.join(x['sat'])} ở cung Tật Ách (lục sát)"], _ma("ds", "suc_khoe", "sat", "co", "vap"),
                         1.5, huong=sk.get("loi_khuyen") or _SK_MAC_DINH))
    if not cand:
        cand.append(_hop("loi_khuyen", "Nếp sinh hoạt nên giữ", kb.suc_khoe_vo_chinh_dieu() or _SK_MAC_DINH,
                         ["Cung Tật Ách không có điểm nhấn rõ"], _ma("ds", "suc_khoe", "chung", "nep", "khuyen"), 1.0))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    chung = kb.suc_khoe_chung()
    # Tóm tắt nêu đúng chỗ nên giữ của LÁ NÀY (bộ phận sách xưa gắn với sao ở Tật Ách, không có thì sao ở Mệnh)
    bp = next((((kb.suc_khoe(s_["ten"]) or {}).get("bo_phan") or "") for s_, _ in nguon
               if (kb.suc_khoe(s_["ten"]) or {}).get("bo_phan")), "")
    bp = ", ".join(p.strip() for p in re.split(r",| và ", bp)[:2] if p.strip())
    cho = f"; chỗ nên giữ kỹ nhất là {bp}" if bp else ""
    nhip = {"thuan": f"Sức của bạn khá bền{cho}.",
            "can_bang": f"Sức của bạn lên xuống theo nếp ăn ngủ{cho}.",
            "can_chu_dong": f"Bạn dễ hao sức hơn mình nghĩ{cho}; nên nghỉ trước khi thấy mệt."}[x["muc"]]
    doan = [nhip, chung]
    return _chuong("suc_khoe", x["muc"], nhip, hop, doan, [c for h in hop for c in h["can_cu"]] + xem_lai,
                   (tuvi_kb.cung("Tật Ách") or {}).get("cau_tu_soi"), mien_tru=chung)


TUOI_BAT_DAU_TOI_DA = 86      # dòng thời gian bỏ giai đoạn bắt đầu sau 86 tuổi (trừ giai đoạn đang đi)
TUOI_NHO = 12                 # giai đoạn bắt đầu từ tuổi này trở xuống: lời cho tuổi đi học


def thoi_gian_bieu(ls: dict, cc: dict, tuoi_mu: int | None, nam_am_sinh: int) -> list[dict]:
    ra = []
    for c in sorted(ls["cung"], key=lambda c: c["dai_han"][0]):
        tu, den = c["dai_han"]
        if tu > TUOI_BAT_DAU_TOI_DA and not (tuoi_mu is not None and tu <= tuoi_mu <= den):
            continue
        k = kb.dai_han(c["ten"]) or {}
        chu_de = k.get("chu_de") or tuvi_kb.chu_de_han_ngan(c["ten"]) or _ten(c["ten"])
        muc = cc[c["ten"]]["muc"]
        mot = {"thuan": "Giai đoạn thuận", "can_bang": "Giai đoạn cân bằng",
               "can_chu_dong": "Giai đoạn cần lưu ý"}[muc]
        # Việc nên làm theo MỨC của giai đoạn (thuận: tận dụng; cần lưu ý: phòng trước) + một lý do cụ thể nhất của
        # cung. Giai đoạn bắt đầu ≤ TUOI_NHO tuổi dùng lời tuổi đi học (không nói cưới xin, nhà đất với một đứa trẻ).
        nen = ((k.get("tuoi_nho") if tu <= TUOI_NHO else None) or k.get(muc) or k.get("nen_lam")
               or "Nên dồn sức cho chủ đề này.")
        x = cc[c["ten"]]
        ve = "" if c["ten"] == "Mệnh" else f" về {_ten(c['ten'])}"
        ds_ld = _ly_do_hop_muc(x)
        ld1 = next((r for r in ds_ld[:2] if not r.startswith(("nét", "sức bạn"))), ds_ld[0] if ds_ld else "")
        if tu <= TUOI_NHO:                    # tuổi đi học: không nêu mảng tiền bạc, công việc đỡ / kéo
            ld1 = next((r for r in ds_ld if "chuyện " not in r and "sức của chính bạn" not in r), "")
        ld1 = ld1.replace(" ở đây", "")
        ra.append({"tu_tuoi": tu, "den_tuoi": den, "nam_tu": nam_am_sinh + tu - 1, "nam_den": nam_am_sinh + den - 1,
                   "cung": c["ten"], "chu_de": chu_de, "muc": muc,
                   "mot_cau": f"{mot}" + (f" ({ld1})" if ld1 else "") + f": {_thuong(nen)}.",
                   "de_vap": k.get("de_vap"), "hien_tai": tuoi_mu is not None and tu <= tuoi_mu <= den,
                   "_ly_do": ly_do_cau(x).replace(" ở đây", ve), "_nen": k.get("nen_lam")})
    return ra


def _chuong_cuoc_doi(tgb: list[dict], tuoi_mu: int, hoc: tuple) -> dict:
    cand = []
    i_ht = next((i for i, g in enumerate(tgb) if g["hien_tai"]), None)

    def cau(g: dict) -> str:
        return f"Từ {g['tu_tuoi']} đến {g['den_tuoi']} tuổi ({g['nam_tu']}–{g['nam_den']}): {g['chu_de']}."

    def nd(g: dict, them: str | None = None) -> str:
        """Giai đoạn + VÌ SAO (lấy từ chính cung đại hạn) + một việc — không chép lại `mot_cau` của dòng thời gian."""
        vi_sao = f"Mười năm này, {g['_ly_do']}." if g.get("_ly_do") else ""
        return " ".join(x for x in (cau(g), vi_sao, them or "") if x)

    if i_ht is not None:
        g = tgb[i_ht]
        cand.append(_hop("thoi_diem", "Giai đoạn bạn đang đi", nd(g, g["de_vap"] if g["muc"] == "can_chu_dong" else None),
                         [f"Đại hạn cung {g['cung']}"],
                         _ma("ds", "cuoc_doi", "dh_" + slug(g["cung"]), g["muc"], "hien_tai"), 3.0,
                         tu_tuoi=g["tu_tuoi"], den_tuoi=g["den_tuoi"]))
        if i_ht + 1 < len(tgb):
            g = tgb[i_ht + 1]
            cand.append(_hop("thoi_diem", "Giai đoạn kế tiếp",
                             nd(g, g["de_vap"] if g["muc"] == "can_chu_dong" else None),
                             [f"Đại hạn cung {g['cung']}"],
                             _ma("ds", "cuoc_doi", "dh_" + slug(g["cung"]), g["muc"], "tiep"), 2.5,
                             tu_tuoi=g["tu_tuoi"], den_tuoi=g["den_tuoi"]))
    da_noi = {tgb[j]["cung"] for j in (i_ht, (i_ht or 0) + 1) if i_ht is not None and j < len(tgb)}
    sap = [g for g in tgb if g["den_tuoi"] >= tuoi_mu and g["tu_tuoi"] <= tuoi_mu + 30 and g["cung"] not in da_noi] or \
        [g for g in tgb if g["den_tuoi"] >= tuoi_mu and g["cung"] not in da_noi]
    thuan = next((g for g in sap if g["muc"] == "thuan"), None)
    chu_dong = next((g for g in sap if g["muc"] == "can_chu_dong"), None)
    if thuan:
        cand.append(_hop("diem_manh", "Giai đoạn nên tận dụng", nd(thuan),
                         [f"Đại hạn cung {thuan['cung']}"], _ma("ds", "cuoc_doi", "dh_" + slug(thuan["cung"]),
                                                                 "thuan", "manh"), 2.0))
    else:
        qua = next((g for g in reversed(tgb) if g["den_tuoi"] < tuoi_mu and g["muc"] == "thuan"), None)
        if qua:
            cand.append(_hop("diem_manh", "Giai đoạn thuận bạn đã đi qua",
                             f"{cau(qua)} " + (f"Mười năm ấy, {qua['_ly_do']}; " if qua.get("_ly_do") else "")
                             + "những gì bạn gây dựng hồi ấy là vốn để dựa vào bây giờ.",
                             [f"Đại hạn cung {qua['cung']}"], _ma("ds", "cuoc_doi", "dh_" + slug(qua["cung"]),
                                                                   "thuan", "da_qua"), 2.0))
    if chu_dong:
        cand.append(_hop("luu_y", "Giai đoạn nên chuẩn bị trước",
                         nd(chu_dong, chu_dong["de_vap"] or "Việc thường cần nhiều sức hơn bạn tính."),
                         [f"Đại hạn cung {chu_dong['cung']}"],
                         _ma("ds", "cuoc_doi", "dh_" + slug(chu_dong["cung"]), "can_chu_dong", "vap"), 2.0,
                         huong=(f"Trước {chu_dong['tu_tuoi']} tuổi, {_thuong(chu_dong['_nen'])}." if chu_dong["_nen"]
                                else chu_dong["mot_cau"].split(": ", 1)[-1])))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    muc = tgb[i_ht]["muc"] if i_ht is not None else tgb[0]["muc"]
    tom = (f"Bạn đang ở giai đoạn {tgb[i_ht]['tu_tuoi']}–{tgb[i_ht]['den_tuoi']} tuổi, xoay quanh {tgb[i_ht]['chu_de']}."
           if i_ht is not None else f"Đời bạn chia thành từng giai đoạn mười năm, bắt đầu từ {tgb[0]['tu_tuoi']} tuổi.")
    # Dòng thời gian (`thoi_gian_bieu`) đã liệt kê đủ các giai đoạn → thân bài chỉ tóm lại, không kể lại từng giai đoạn.
    dem = {m: sum(g["muc"] == m for g in tgb) for m in ("thuan", "can_bang", "can_chu_dong")}
    phan = [f"{n} giai đoạn {kb.nhan_muc(m).lower()}" for m, n in dem.items() if n]
    # Quãng thuận liền nhau dài nhất (dữ kiện riêng của lá, không có trong hộp) thay cho câu an ủi chung.
    dai, cur = [], []
    for g in tgb:
        cur = cur + [g] if g["muc"] == "thuan" else []
        if len(cur) > len(dai):
            dai = cur
    quang = ("" if len(dai) == len(tgb) else
             f" Quãng thuận dài nhất của bạn là từ {dai[0]['tu_tuoi']} đến {dai[-1]['den_tuoi']} tuổi." if len(dai) >= 2
             else f" Giai đoạn thuận đầu tiên bắt đầu từ {dai[0]['tu_tuoi']} tuổi." if dai else "")
    doan = [tom, f"Trên dòng thời gian của bạn có {', '.join(phan)}.{quang}"]
    return _chuong("cuoc_doi", muc, tom, hop, doan, [f"{g['tu_tuoi']}–{g['den_tuoi']} tuổi: đại hạn cung {g['cung']}"
                                                     for g in tgb] + xem_lai,
                   "Giai đoạn nào trong đời bạn thấy mình sống đúng nhất, và vì sao?")


def _sinh_kw(sinh: dict) -> dict:
    return {"tz_lich": sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
            "thang_nhuan": sinh.get("thang_nhuan", "thang_sau"), "lich": sinh.get("lich", "viet")}


def _chuong_nam_nay(sinh: dict, ls: dict, cc: dict, vh: dict, ngay_xem: dt.date, hoc: tuple) -> dict:
    cand, da_cung, can_cu = [], set(), []
    ten_lop = {"dai_han": "Mười năm này", "luu_nien": "Năm nay", "tieu_han": "Riêng năm nay"}
    for k, lop in enumerate(_THU_TU_LOP):
        o = vh[lop]
        cung = ls["cung"][o["chi_so"]]["ten"]
        kd = kb.dai_han(cung) or {}
        chu_de = kd.get("chu_de") or _ten(cung)
        muc = cc[cung]["muc"]
        cu = {"dai_han": f"Đại hạn cung {cung} ({o['can']} {o['chi']}), {o.get('tu_tuoi')}–{o.get('den_tuoi')} tuổi",
              "luu_nien": f"Lưu niên cung {cung} ({o['can']} {o['chi']})",
              "tieu_han": f"Tiểu hạn cung {cung} ({o['can']} {o['chi']})"}[lop]
        can_cu.append(cu)
        if o.get("tu_hoa"):
            can_cu.append(f"Tứ hoá {ten_lop[lop].lower()}: " + ", ".join(
                f"{h} {s}" for h, s in zip(("Lộc", "Quyền", "Khoa", "Kỵ"), o["tu_hoa"])))
        if cung in da_cung:
            continue
        da_cung.add(cung)
        nen = kd.get("nen_lam") or ""
        if lop == "dai_han":
            chua = vh["tuoi_mu"] < (o.get("tu_tuoi") or 0)      # trẻ nhỏ: chưa vào giai đoạn mười năm đầu
            nd = (f"Giai đoạn mười năm đầu tiên bắt đầu từ {o['tu_tuoi']} tuổi, xoay quanh {chu_de}. {nen}" if chua
                  else f"Từ {o['tu_tuoi']} đến {o['den_tuoi']} tuổi, trọng tâm của bạn là {chu_de}. {nen}")
            tieu = ("Mười năm đầu tiên sắp tới" if chua else f"Mười năm này: {chu_de}")
        else:
            dau = "Năm nay" if lop == "luu_nien" else "Thêm một lớp riêng của năm nay"
            nd = f"{dau}, việc hay xoay quanh {chu_de}; {_NHAN_LOP[muc]}. {nen}"
            tieu = f"{'Năm nay' if lop == 'luu_nien' else 'Lớp riêng của năm'}: {chu_de}"
        cand.append(_hop("thoi_diem", tieu if len(tieu) <= 60 else ten_lop[lop], nd, [cu],
                         _ma("ds", "nam_nay", lop, slug(cung), muc), 3.0 - 0.1 * k, muc=muc))
    nhip = None
    try:
        nhip = nhip3.lap(sinh, ngay_xem, sinh.get("luu_nguyet") or ln.MAC_DINH, ls=ls)
    except (ValueError, StopIteration):
        nhip = None
    # NHIP-2: mỗi tháng đã có lời riêng (kết luận + việc nên làm theo cung tháng × mức) nên không còn gộp tháng.
    # Mã kiểm chứng theo CUNG tháng + mức + lý do đầu (trước đây theo số thứ tự tháng trong khung — vô nghĩa khi so).
    for i, t in enumerate((nhip or {}).get("thang", []), 1):
        ten_t = f"Tháng {t['thang']}{' nhuận' if t['nhuan'] else ''} âm lịch"
        if t["phan"] in ("nua_dau", "nua_sau"):
            ten_t = f"{t['nhan_thang']} âm lịch"
        ly = t["ly_do"][0]["ma"] if t["ly_do"] else "chung"
        cand.append(_hop("thoi_diem", ten_t, f"{t['tieu_de_thang']}. {t['goi_y']}", t["can_cu"],
                         _ma("ds", "nam_nay", "thang", slug(t["cung_goc"]), t["muc"], slug(ly)),
                         2.0 - 0.1 * i, muc=_MUC_THANG[t["muc"]], tu=t["tu"], den=t["den"],
                         cau_tu_soi=t["cau_tu_soi"]))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    cung_dh = ls["cung"][vh["dai_han"]["chi_so"]]["ten"]
    muc = cc[cung_dh]["muc"]
    cung_ln = ls["cung"][vh["luu_nien"]["chi_so"]]["ten"]
    cd_dh = (kb.dai_han(cung_dh) or {}).get("chu_de") or _ten(cung_dh)
    cd_ln = (kb.dai_han(cung_ln) or {}).get("chu_de") or _ten(cung_ln)
    tom = (f"Mười năm này xoay quanh {cd_dh}" + (f"; năm nay thêm chuyện {cd_ln}" if cung_ln != cung_dh else "")
           + ".")
    doan = [tom, (f"Ba tháng tới: {nhip['tom_tat_3_thang'][:1].lower()}{nhip['tom_tat_3_thang'][1:]}"
                  if nhip else ""),
            "Khi các lớp nói khác nhau, ưu tiên mười năm trước, rồi đến năm, rồi mới đến tháng."]
    if nhip:
        can_cu += [f"Phái lưu nguyệt: {nhip['ten_phai_luu_nguyet']}", "Ưu tiên: đại hạn > lưu niên > tiểu hạn > lưu nguyệt"]
    return _chuong("nam_nay", muc, tom, hop, doan, can_cu + [c for h in hop for c in h["can_cu"]] + xem_lai,
                   "Việc nào năm nay đáng để bạn dồn sức nhất?", tuoi_mu=vh["tuoi_mu"])


# ---- VH-1: vận hạn 10 năm & điều nên tránh (`docs/LUAN-GIAI-DOI-SONG.md` mục 8)
# Mỗi năm âm lịch (Tết Việt) từ năm đang xem: tứ hoá theo can năm (bảng tứ hoá — `calc.tuvi_phi_hoa.phi_tu_can`, chỉ
# ĐỌC), cung đại hạn chứa tuổi mụ năm ấy (mức cung đã chấm), cung lưu niên = cung mang chi của năm. Điểm năm:
#   Kỵ năm nhập cung chính (Mệnh, Tài Bạch, Quan Lộc, Phu Thê, Điền Trạch) −2 (trùng cung Kỵ gốc: −1 nữa) · Kỵ năm ở
#   cung đối diện, chiếu cung chính −1 · Lộc năm nhập cung chính +2 · song Lộc (Lộc năm gặp Lộc gốc / Lộc Tồn) +1 ·
#   Kỵ năm / Lộc năm rơi đúng cung đang đi (cung lưu niên hoặc cung đại hạn của năm) −1 / +1 · đại hạn Thuận lợi +1 /
#   Cần lưu ý −1 (ưu tiên đại hạn > lưu niên > tiểu hạn).
# Mức: ≥ 2 Thuận lợi · điểm âm mà Kỵ năm chạm một cung chính (nhập / chiếu) → Cần lưu ý · còn lại Cân bằng (đo 60 lá ×
# 10 năm — bảng ở docs mục 8). Cờ dân gian (năm tuổi, xung tuổi, va tuổi, tam tai — theo chi
# năm sinh âm lịch) chỉ thêm lời nhắc, KHÔNG đổi mức. Lời "nên tránh / nên làm" theo mảng chịu tác động × tuổi (KB
# `van_han`); trẻ dưới 18 tuổi dùng lời cho cha mẹ (không vay, bảo lãnh, cưới xin).
CUNG_VAN_HAN = ("Mệnh", "Tài Bạch", "Quan Lộc", "Phu Thê", "Điền Trạch")
NGUONG_NAM = (2, 0)          # thuận ≥ 2 · cần lưu ý < 0 (kèm Kỵ chạm cung chính)
_DIEM_DH = {"thuan": 1, "can_chu_dong": -1}


def _loi_vh(loai: str, cung: str | None, gd: str) -> dict:
    """Lời KB cho (loại tác động, cung, giai đoạn tuổi): ô của cung (nhan, mang; ky_chieu / loc_nhap có luôn y, tranh,
    lam) đè bởi ô của giai đoạn tuổi (tre / lon, thiếu thì giai đoạn kia). Dưới 18 tuổi: lời cho cha mẹ (`nho`)."""
    if not cung:
        return {}
    if gd == "nho":                          # lời cho cha mẹ, theo mảng của con (sức, tiền tiêu vặt, học, bạn, chỗ ở)
        nhom = "loc" if loai in ("loc_nhap", "song_loc") else "ky"
        return {**{k: v for k, v in (kb.van_han_loi("nho", nhom) or {}).items() if v},
                **{k: v for k, v in (kb.van_han_loi("nho", nhom, cung) or {}).items() if v}}
    goc = {k: v for k, v in (kb.van_han_loi(loai, cung) or {}).items() if v}
    tuoi = kb.van_han_loi(loai, cung, gd) or kb.van_han_loi(loai, cung, "lon" if gd == "tre" else "tre") or {}
    return {**goc, **{k: v for k, v in tuoi.items() if v}}


def _thuong_dau(s: str) -> str:
    return s[:1].lower() + s[1:] if s else s


def dong_muoi_nam(ls: dict, cc: dict, nam_am_xem: int, nam_am_sinh: int, gioi_tinh: str | None = None) -> list[dict]:
    """Mười năm tới (năm âm lịch Việt), luật ở chú thích trên. Khoá `_…` là nội bộ (hộp ứng viên, mẫu).
    `gioi_tinh` (MT-ĐS B3) → mỗi năm kèm `sao_han` {sao, han} theo tục xếp theo tuổi — chỉ để hiện, KHÔNG đổi mức."""
    _, chi_sinh = lunar.can_chi_nam(nam_am_sinh)
    goc = {x["hoa"]: x["cung"] for x in ls["tu_hoa"]}
    loc_ton = next((c["ten"] for c in ls["cung"] if "Lộc Tồn" in c["phu_tinh"]), None)
    ra = []
    for k in range(dsc.SO_NAM_VAN_HAN):
        nam = nam_am_xem + k
        can, chi = lunar.can_chi_nam(nam)
        tuoi = nam - nam_am_sinh + 1
        gd = dsc.giai_doan_tuoi(tuoi)
        hoa = {x["hoa"]: x for x in phi_calc.phi_tu_can(can, ls["cung"])}
        c_ln = next(c["ten"] for c in ls["cung"] if c["chi"] == chi)
        dh = next((c["ten"] for c in ls["cung"] if c["dai_han"][0] <= tuoi <= c["dai_han"][1]), None)
        diem, cu, tac, tot = 0, [], None, None
        ky, loc = hoa["Kỵ"], hoa["Lộc"]
        if ky["den_cung"] in CUNG_VAN_HAN:
            diem -= 2
            tac = ("ky_nhap", ky["den_cung"])
            cu.append(f"Hoá Kỵ năm ({ky['sao']}) nhập cung {ky['den_cung']} −2")
            if goc.get("Kỵ") == ky["den_cung"]:
                diem -= 1
                cu.append("trùng cung Hoá Kỵ gốc (chồng Kỵ) −1")
        elif ky["xung_cung"] in CUNG_VAN_HAN:
            diem -= 1
            tac = ("ky_chieu", ky["xung_cung"])
            cu.append(f"Hoá Kỵ năm ({ky['sao']}) ở cung {ky['den_cung']}, chiếu sang {ky['xung_cung']} −1")
        elif ky["den_cung"]:
            cu.append(f"Hoá Kỵ năm ({ky['sao']}) ở cung {ky['den_cung']} (ngoài năm cung chính) 0")
        if loc["den_cung"] in CUNG_VAN_HAN:
            diem += 2
            tot = loc["den_cung"]
            cu.append(f"Hoá Lộc năm ({loc['sao']}) nhập cung {loc['den_cung']} +2")
        if loc["den_cung"] and loc["den_cung"] in (goc.get("Lộc"), loc_ton):
            diem += 1
            tot = tot or loc["den_cung"]
            cu.append(f"Hoá Lộc năm gặp Lộc gốc / Lộc Tồn ở cung {loc['den_cung']} (song Lộc) +1")
        dang = {x for x in (c_ln, dh) if x}          # cung đang "đi" của năm: lưu niên + đại hạn
        if ky["den_cung"] in dang:
            diem -= 1
            cu.append(f"Hoá Kỵ năm rơi đúng cung đang đi ({ky['den_cung']}) −1")
        if loc["den_cung"] in dang:
            diem += 1
            cu.append(f"Hoá Lộc năm rơi đúng cung đang đi ({loc['den_cung']}) +1")
        if dh:
            m_dh = cc[dh]["muc"]
            diem += _DIEM_DH.get(m_dh, 0)
            cu.append(f"Đại hạn cung {dh} ({kb.nhan_muc(m_dh)}) {'+1' if m_dh == 'thuan' else '−1' if m_dh == 'can_chu_dong' else '0'}")
        # Cần lưu ý = điểm âm VÀ Kỵ năm chạm một cung chính (nhập / chiếu) — luôn gọi được tên mảng chịu tác động.
        muc = "thuan" if diem >= NGUONG_NAM[0] else "can_chu_dong" if diem < 0 and tac else "can_bang"
        co = dsc.co_dan_gian(chi_sinh, chi)
        chu_de = (kb.dai_han(c_ln) or {}).get("chu_de") or _ten(c_ln)
        nen_tranh = nen_lam = mang = None
        if muc == "can_chu_dong" and tac:
            o = _loi_vh(tac[0], tac[1], gd)
            mang = o.get("mang") or _vat(tac[1])
            y = o.get("y") or f"{_chu(tac[1])} dễ làm bạn bận lòng hơn thường lệ."
            nen_tranh, nen_lam = o.get("tranh"), o.get("lam")
        elif muc == "thuan" and tot:
            o = _loi_vh("loc_nhap", tot, gd)
            mang = o.get("mang") or _vat(tot)
            y = o.get("y") or f"việc thuận dễ đến từ {_vat(tot)}."
            nen_lam = o.get("lam")
        else:
            y = f"nhịp khá đều; việc hay xoay quanh {chu_de}."
        cu = [f"Năm {nam} {can} {chi} (âm lịch), tuổi mụ {tuoi}: {'; '.join(cu) or 'không có điểm cộng trừ'} → "
              f"{kb.nhan_muc(muc)}", f"Cung lưu niên năm {nam}: {c_ln}"]
        if co:
            cu.append(f"Chi năm sinh {chi_sinh}, chi năm {chi}: " + ", ".join(dsc.NHAN_CO[x] for x in co)
                      + " (tập quán dân gian, không đổi mức)")
        ra.append({"nam": nam, "tuoi": tuoi, "muc": muc, "nhan_muc": kb.nhan_muc(muc), "hien_tai": k == 0,
                   "co": [dsc.co_ra(x, kb.van_han_loi("co", x)) for x in co], "sao_han": dsc.sao_han_nam(tuoi, gioi_tinh),
                   "mang": mang, "y": f"Năm {nam}, {_thuong_dau(_sua_menh(y))}", "nen_tranh": _sua_menh(nen_tranh),
                   "nen_lam": _sua_menh(nen_lam), "can_cu": cu, "_tac": tac, "_tot": tot, "_gd": gd, "_diem": diem, "_k": k,
                   "_cln": c_ln})
    for g in ra:
        g["_hop"] = _hop_nam(g)
    return ra


def _hop_nam(g: dict) -> list[dict]:
    """Hộp ứng viên của một năm (năm Cần lưu ý · năm thuận · cờ dân gian năm tuổi / xung tuổi / tam tai)."""
    nam, ra = g["nam"], []
    k = g["_k"]
    if g["muc"] == "can_chu_dong" and g["_tac"]:
        loai, cung = g["_tac"]
        nd = g["y"] + (f" Nên tránh: {_thuong_dau(g['nen_tranh'])}." if g["nen_tranh"] else "")
        huong = f"Nên làm: {_thuong_dau(g['nen_lam'])}." if g["nen_lam"] else None
        tieu = (_loi_vh(loai, cung, g["_gd"]).get("nhan") or f"đi chậm ở {g['mang']}")
        ra.append(_hop("luu_y", f"Năm {nam}: {tieu}", nd, g["can_cu"][:1],
                       _ma("ds", "van_han", loai, slug(cung), g["_gd"]), 3.0 - 0.01 * k, huong=huong, _vai="can",
                       nam=nam, muc=g["muc"]))
    elif g["muc"] == "thuan" and g["_tot"]:
        cung = g["_tot"]
        nd = g["y"] + (f" Nên làm: {_thuong_dau(g['nen_lam'])}." if g["nen_lam"] else "")
        tieu = _loi_vh("loc_nhap", cung, g["_gd"]).get("nhan") or f"thuận cho {g['mang']}"
        loai = "loc_nhap" if cung in CUNG_VAN_HAN else "song_loc"
        ra.append(_hop("diem_manh", f"Năm {nam}: {tieu}", nd, g["can_cu"][:1],
                       _ma("ds", "van_han", loai, slug(cung), "nho" if g["_gd"] == "nho" else ""), 2.5 - 0.01 * k,
                       _vai="thuan", nam=nam, muc=g["muc"]))
    return ra


def _hop_du_phong(dong: list[dict], hop: list[dict]) -> list[dict]:
    """Chương còn < 2 hộp (mười năm đều, ít năm nổi): năm nên giữ nhịp hơn cả (điểm thấp nhất) + năm đáng dồn sức nhất
    (điểm cao nhất), chưa có hộp — lời theo chủ đề cung lưu niên của chính năm ấy."""
    ra, da = [], {h.get("nam") for h in hop}
    if len(hop) >= 2:
        return ra
    con = [g for g in dong if g["nam"] not in da]
    if con:
        g = min(con, key=lambda x: (x["_diem"], x["nam"]))
        k = kb.dai_han(g["_cln"]) or {}
        ra.append(_hop("luu_y", f"Năm {g['nam']}: năm nên giữ nhịp hơn cả", g["y"], g["can_cu"][:1],
                       _ma("ds", "van_han", "giu_nhip", slug(g["_cln"])), 1.1, nam=g["nam"], muc=g["muc"],
                       huong=k.get("can_bang") or k.get("nen_lam")))
        da.add(g["nam"])
    con = [g for g in dong if g["nam"] not in da]
    if con and len(hop) + len(ra) < 2:
        g = max(con, key=lambda x: (x["_diem"], -x["nam"]))
        k = kb.dai_han(g["_cln"]) or {}
        ra.append(_hop("diem_manh", f"Năm {g['nam']}: năm đáng dồn sức nhất",
                       f"{g['y']} {k.get('thuan') or ''}".strip(), g["can_cu"][:1],
                       _ma("ds", "van_han", "don_suc", slug(g["_cln"])), 1.0, nam=g["nam"], muc=g["muc"]))
    return ra


def _chuong_van_han(dong: list[dict], vh: dict, ls: dict, hoc: tuple) -> dict:
    hop, xem_lai = dsc.chon_hop_van_han(dong, hoc)
    hop += _hop_du_phong(dong, hop)
    thuan = [g for g in dong if g["muc"] == "thuan"]
    can = [g for g in dong if g["muc"] == "can_chu_dong"]
    if thuan:
        g = thuan[0]
        tom = (f"Trong mười năm tới, năm thuận gần nhất là {g['nam']}: "
               f"{_loi_vh('loc_nhap', g['_tot'], g['_gd']).get('nhan') or 'hợp để dồn sức'}.")
    else:
        g = max(dong, key=lambda x: (x["_diem"], -x["nam"]))
        tom = f"Mười năm tới của bạn không có năm nào vượt hẳn; năm đáng dồn sức nhất là {g['nam']}."
    if can:
        cham = "Những năm nên đi chậm: " + ", ".join(f"{g['nam']} ({g['mang']})" for g in can[:4]) + "."
    else:
        g = min(dong, key=lambda x: (x["_diem"], x["nam"]))
        cham = f"Không có năm nào phải đi chậm hẳn; năm nên giữ nhịp hơn cả là {g['nam']}."
    co = [(g["nam"], c["nhan"]) for g in dong for c in g["co"] if c["ma"] in ("nam_tuoi", "xung_tuoi")]
    dg = (f"Theo tập quán dân gian, {' và '.join(f'{n} là {t}' for n, t in co)} của bạn; xem như lời nhắc giữ nếp, "
          "không phải điềm báo." if co else "")
    th = vh["tieu_han"]
    can_cu = ["Ưu tiên: đại hạn > lưu niên > tiểu hạn",
              f"Mức mỗi năm: Hoá Kỵ năm nhập cung chính −2, chiếu −1, chồng Kỵ −1; Hoá Lộc năm nhập cung chính +2, song "
              f"Lộc +1; Kỵ / Lộc năm rơi đúng cung đang đi −1 / +1; đại hạn Thuận lợi +1 / Cần lưu ý −1. ≥ {NGUONG_NAM[0]} Thuận "
              f"lợi; điểm âm và Kỵ năm chạm cung chính → Cần lưu ý",
              f"Cung chính: {', '.join(CUNG_VAN_HAN)}",
              f"Tiểu hạn năm nay: cung {th.get('cung_goc')} ({th['can']} {th['chi']}) — đọc kèm, xếp sau đại hạn và lưu niên",
              *(c for g in dong for c in g["can_cu"]), *xem_lai,
              "Năm tuổi, xung tuổi, va tuổi, tam tai: tập quán dân gian theo chi năm sinh, không đổi mức của năm"]
    dong_ra = [{k: v for k, v in g.items() if not k.startswith("_")} for g in dong]
    return _chuong("van_han", None, tom, hop, [tom, cham, dg], can_cu,
                   "Năm nào trong mười năm tới bạn muốn dành cho việc lớn nhất, và năm nào nên giữ sức?",
                   dong_nam=dong_ra)


# ---- đường bay (phi hoá) — lời đời thường do RULES phi hoá dựng sẵn (KB phi hoá viết theo cặp mảng phát → mảng
# đích, tên cung/sao/hoá chỉ ở `can_cu`); ở đây chỉ chọn hộp, tránh lặp việc nên làm, gắn mã kiểm chứng.
def _chu(cung: str) -> str:
    """Chủ ngữ: "Chuyện tiền bạc" / "Bản thân bạn" (Mệnh)."""
    return "Bản thân bạn" if cung == "Mệnh" else f"Chuyện {_ten(cung)}"


def _vat(cung: str) -> str:
    """Bổ ngữ: "chuyện tiền bạc" / "chính bạn" (Mệnh)."""
    return "chính bạn" if cung == "Mệnh" else f"chuyện {_ten(cung)}"


def _hop_bay(n: dict, da_lk: set[str] | None = None) -> dict:
    d = n["duong"]
    den_c = d["den_cung"] or d["tu_cung"]
    hoa = d["hoa"]
    lk = n["viec_nen_lam"]
    if lk in (da_lk or set()):              # hai đường bay cùng việc nên làm → lời theo đúng cặp mảng
        lk = (f"Khi {_vat(d['tu_cung'])} đang căng, hoãn quyết định lớn về {_vat(den_c)} vài ngày và nói rõ với "
              "người liên quan." if hoa == "Kỵ" else
              f"Khi {_vat(d['tu_cung'])} đang thuận, dành một phần kết quả ấy cho {_vat(den_c)}.")
    if n.get("ma_mau"):
        goc = slug(n["ma_mau"])
    elif d["tu_hoa"]:
        goc = f"tu+{slug(d['tu_cung'])}"
    else:
        goc = f"{slug(d['tu_cung'])}+{slug(d['den_cung'])}"
    tt = [n["ghi_chu_tuan_triet"]] if n.get("ghi_chu_tuan_triet") else []
    tieu = n["tieu_de"] if len(n["tieu_de"]) <= 60 else "Mảng đời tác động lẫn nhau"
    cu = list(n.get("can_cu") or [phl.can_cu_duong(d)]) + tt
    if hoa == "Kỵ":
        return _hop("luu_y", tieu, n["nghia"], cu, _ma("ds", "duong_bay", goc, slug(hoa), "vap"), 2.0, huong=lk,
                    _linh=d["tu_cung"])
    return _hop("diem_manh", tieu, n["nghia"], cu, _ma("ds", "duong_bay", goc, slug(hoa), "manh"),
                1.5 if hoa == "Lộc" else 1.0, loi_khuyen=lk, _linh=d["tu_cung"])


def _chuong_duong_bay(ls: dict, hoc: tuple) -> dict:
    phi = phl.lap(ls, ls["can_nam"]) if ls.get("can_nam") else None
    cand, da_lk = [], set()
    for n in (phi or {}).get("noi_bat", [])[:6]:
        h = _hop_bay(n, da_lk)
        da_lk.add(h.get("huong_xu_ly") or h.get("loi_khuyen") or "")
        cand.append(h)
    for i, h in enumerate(cand):
        h["_w"] -= 0.001 * i
    hop, xem_lai = _ap_hoc(_sap(cand), *hoc)
    n_loc = sum(h["ma_mau"].endswith((".loc.manh",)) for h in hop)
    n_ky = sum(h["loai"] == "luu_y" for h in hop)
    # VH-1: thang riêng của đường bay (số đường Lộc − số đường Kỵ nổi bật): ≥ 1 thuận, ≤ −3 cần lưu ý. Thang cung
    # (≥ 4 / ≤ −2) cho 60% lá "Cần lưu ý" vì thẻ nổi bật vốn ưu tiên đường Kỵ.
    d_bay = n_loc - n_ky
    muc = "thuan" if d_bay >= NGUONG_BAY[0] else "can_chu_dong" if d_bay <= NGUONG_BAY[1] else "can_bang"
    do = next((_vat(h["_linh"]) for h in hop if h["loai"] == "diem_manh" and h.get("_linh")), None)
    keo = next((_vat(h["_linh"]) for h in hop if h["loai"] == "luu_y" and h.get("_linh")), None)
    if do and keo and do != keo:
        tom = f"Mảng hay đỡ cho các mảng khác là {do}; mảng hay kéo bận tâm sang chỗ khác là {keo}."
    elif do:
        tom = f"Mảng hay đỡ cho các mảng khác là {do}" + (", dù chính nó cũng có chỗ vướng." if keo else ".")
    elif keo:
        tom = f"Mảng hay kéo bận tâm sang chỗ khác là {keo}; biết vậy thì tách nó ra khỏi các quyết định khác."
    else:
        tom = "Các mảng đời của bạn ít kéo nhau; mỗi mảng đọc riêng ở các chương trên."
    can_cu = [c for h in hop for c in h["can_cu"]] + xem_lai
    if phi:
        can_cu += [f"Lai nhân cung: {phi['lai_nhan']['cung']} ({phi['lai_nhan']['can']} {phi['lai_nhan']['chi']})",
                   phi["phai"]["ghi_chu"]]
    doan = [tom, "Đây là cách các mảng đời tác động lẫn nhau, không phải lời đoán sự kiện."]
    return _chuong("duong_bay", muc, tom, hop, doan, can_cu,
                   "Mảng đời nào của bạn đang âm thầm kéo theo mảng khác?")


_CUNG_CHUONG = {c: ma for ma, _, _, ds in CHUONG for c in ds}


def _linh_vuc(h: dict) -> str:
    """Mảng đời của một hộp (hộp đường bay tính theo cung nguồn) — để không chọn hai ý cùng một mảng."""
    return _CUNG_CHUONG.get(h.get("_linh") or "", h["_ch"]) if h.get("_linh") else h["_ch"]


def _chuong_loi_khuyen(ds_chuong: list[dict], muc: str, hoc: tuple) -> dict:
    nguon = [h for c in ds_chuong if c["ma"] in CHUONG_COT_LOI for h in c["hop"] if not h.get("_chua_dung")]
    nguon = _sap(nguon)

    def ba(loai: str) -> list[dict]:
        ra, mang, huong = [], set(), set()

        def duoc(h: dict) -> bool:          # không lặp cùng một việc nên làm (vd câu Tuần/Triệt ở hai chương)
            return (h["loai"] == loai and h not in ra and h.get("huong_xu_ly") not in huong
                    and not h.get("_pha_cach"))         # cách bị phá không tính là "điểm mạnh nên dùng"

        for h in nguon:                         # mỗi mảng đời một ý trước, đủ 3 thì dừng
            if duoc(h) and _linh_vuc(h) not in mang:
                ra.append(h)
                mang.add(_linh_vuc(h))
                if h.get("huong_xu_ly"):
                    huong.add(h["huong_xu_ly"])
        for h in nguon:
            if len(ra) >= 3:
                break
            if duoc(h):
                ra.append(h)
                if h.get("huong_xu_ly"):
                    huong.add(h["huong_xu_ly"])
        return ra[:3]

    manh, vap = ba("diem_manh"), ba("luu_y")
    viec = list(dict.fromkeys([h["huong_xu_ly"] for h in vap] or
                              [h.get("loi_khuyen") for h in manh if h.get("loi_khuyen")]))
    cand = []
    if manh:
        cand.append(_hop("diem_manh", "Ba điểm mạnh nên dùng", " ".join(_cau_dau(h["noi_dung"]) for h in manh),
                         [c for h in manh for c in h["can_cu"][:1]], "ds.loi_khuyen.tong_hop.ba.manh", 3.0))
    if vap:
        # Việc nên làm của từng điều nằm ở hộp "Ba việc nên làm" ngay dưới — không chép lại lần hai.
        mang_vap = list(dict.fromkeys(_ten_mang(h) for h in vap))
        cand.append(_hop("luu_y", "Ba điều nên để ý", " ".join(_cau_dau(h["noi_dung"]) for h in vap),
                         [c for h in vap for c in h["can_cu"][:1]], "ds.loi_khuyen.tong_hop.ba.vap", 2.9,
                         huong=(f"Nên gỡ lần lượt: {', rồi '.join(mang_vap)} — việc cụ thể ở hộp ngay dưới."
                                if viec else None)))
    if viec:
        cand.append(_hop("loi_khuyen", "Ba việc nên làm", " ".join(viec), [], "ds.loi_khuyen.tong_hop.ba.khuyen", 2.8))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    m_manh = [_ten_mang(h) for h in manh]
    m_vap = [_ten_mang(h) for h in vap]
    tom = (f"Chỗ dựa lớn nhất của bạn nằm ở {m_manh[0]}" + (f"; chỗ nên gỡ trước nằm ở {m_vap[0]}." if m_vap else ".")
           if m_manh else f"Chỗ nên gỡ trước nằm ở {m_vap[0]}." if m_vap else
           "Lá số của bạn ít điểm nhấn mạnh; các chương trên đã nêu việc nên làm cho từng mảng.")
    doan = [tom, (f"Nếu tuần này chỉ làm được một việc, hãy bắt đầu từ {m_vap[0]}: {_thuong(viec[0])}."
                  if m_vap and viec else "")]
    return _chuong("loi_khuyen", muc, tom, hop, doan, [c for h in hop for c in h["can_cu"]] + xem_lai,
                   "Trong ba việc nên làm, việc nào bạn bắt đầu được ngay tuần này?")


def _cung_cua(h: dict) -> str | None:
    return h.get("_cung") or h.get("_linh")


_TEN_CHUONG = {"tong_quan": "chính con người bạn", "su_nghiep": "chuyện công việc", "tien_bac": "chuyện tiền bạc",
               "tinh_cam": "chuyện tình cảm", "gia_dinh": "chuyện gia đình", "quan_he": "chuyện bạn bè, người ngoài",
               "nha_cua": "chuyện nhà cửa", "duong_bay": "cách các mảng đời kéo nhau"}


def _ten_mang(h: dict) -> str:
    c = _cung_cua(h)
    return _vat(c) if c else _TEN_CHUONG.get(h.get("_ch", ""), "mảng này")


def chon_cot_loi(ds_chuong: list[dict], toi_da: int = 5) -> list[dict]:
    """3–5 hộp quan trọng nhất cả bài: |trọng số| lớn nhất, ưu tiên Mệnh/Quan Lộc/Tài Bạch/Phu Thê; luôn có ít nhất
    một điểm mạnh và một lưu ý (kèm hướng xử lý). Bỏ hộp đang xem lại và hộp người này đã bấm "chưa đúng"."""
    nguon = [h for c in ds_chuong if c["ma"] in CHUONG_COT_LOI for h in c["hop"]
             if h["loai"] in ("diem_manh", "luu_y") and not h.get("_chua_dung") and not h.get("dang_xem_lai")
             and not h.get("_pha_cach")]

    def diem(h: dict) -> float:
        return h["_w"] + (0.6 if h.get("_cung") in CUNG_UU_TIEN else 0)

    nguon.sort(key=lambda h: -diem(h))
    chon: list[dict] = []

    def con_cho(h: dict, toi_da_loai: int = 3) -> bool:
        """Cân hai phía (≤ 3 điểm mạnh, ≤ 3 lưu ý) và ≤ 2 hộp cùng một mảng đời."""
        return (h not in chon and sum(x["loai"] == h["loai"] for x in chon) < toi_da_loai
                and sum(_linh_vuc(x) == _linh_vuc(h) for x in chon) < 2)

    for loai in ("diem_manh", "luu_y"):
        h = next((h for h in nguon if h["loai"] == loai), None)
        if h:
            chon.append(h)
    for h in nguon:
        if len(chon) >= toi_da:
            break
        if diem(h) >= 1.0 and con_cho(h):
            chon.append(h)
    for h in nguon:
        if len(chon) >= 3:
            break
        if con_cho(h, 5):
            chon.append(h)
    chon.sort(key=lambda h: -diem(h))
    return [{**h, "loai": "cot_loi", "loai_goc": h["loai"], "tu_chuong": h["_ch"]} for h in chon]


# ------------------------------------------------------------------ điểm vào
def lap(sinh: dict, ngay_xem: dt.date | None = None, trong_so: dict | None = None,
        ca_nhan: dict | None = None, ls: dict | None = None, vh: dict | None = None) -> dict:
    """`sinh` như `hoidap.tuvi.tra_loi` (+ `luu_nguyet` tuỳ chọn). → báo cáo `doi_song_1` (chưa có moi_xem / phí —
    `toan_bo.tuvi` gắn)."""
    from app.hoidap.tuvi import tom_tat          # tránh vòng import

    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    kw = _sinh_kw(sinh)
    if ls is None:
        ls = tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN",
                                   hoa_linh=sinh.get("hoa_linh", "viet"), **kw))
    vh = vh or az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], ngay_xem, **kw)   # MT-ĐS B2: hỏi đáp đưa vh đã tính
    tz_xem = az.TZ_TRUNG if kw["lich"] == "trung" else config.CALENDAR_MERIDIAN_TZ
    nam_am_xem = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, tz_xem)[2]
    nam_am_sinh = nam_am_xem - vh["tuoi_mu"] + 1
    cc = cham_cung(ls)
    hoc = (trong_so, ca_nhan)
    da_dung: set[str] = set()
    tgb = thoi_gian_bieu(ls, cc, vh["tuoi_mu"], nam_am_sinh)
    dong = dong_muoi_nam(ls, cc, nam_am_xem, nam_am_sinh, sinh.get("gioi_tinh"))

    ds: list[dict] = []
    for ma, _, _, cung in CHUONG:
        if ma == "tong_quan":
            c = _chuong_tong_quan(ls, cc, hoc, da_dung)
        elif ma == "cuoc_doi":
            c = _chuong_cuoc_doi(tgb, vh["tuoi_mu"], hoc)
        elif ma == "tinh_cam":
            dao = _hop_dao_hoa(ma, "Phu Thê", cc["Phu Thê"]) + _hop_dao_hoa(ma, "Mệnh", cc["Mệnh"])
            c = _chuong_cung(ma, cung, cc, hoc, da_dung, dao)
        elif ma == "suc_khoe":
            c = _chuong_suc_khoe(cc, hoc)
        elif ma == "tien_bac":
            # Điền Trạch ở chương tiền bạc chỉ lấy lớp tích luỹ (tứ hoá, cát/sát); chính tinh để chương nhà cửa.
            c = _chuong_cung(ma, cung, cc, hoc, da_dung, chi_phu={"Điền Trạch": 2},
                             loc={"Điền Trạch": lambda h: ".sinh." in h["ma_mau"] or ".co." in h["ma_mau"]})
        elif ma == "duong_bay":
            c = _chuong_duong_bay(ls, hoc)
        elif ma == "nam_nay":
            c = _chuong_nam_nay(sinh, ls, cc, vh, ngay_xem, hoc)
        elif ma == "van_han":
            c = _chuong_van_han(dong, vh, ls, hoc)
        elif ma == "loi_khuyen":
            c = _chuong_loi_khuyen(ds, None, hoc)     # VH-1: chương tổng hợp không mang mức riêng
        else:
            c = _chuong_cung(ma, cung, cc, hoc, da_dung)
        for h in c["hop"]:
            h["_ch"] = ma
        ds.append(c)
    cot_loi = dsc.them_cot_loi_van_han(chon_cot_loi(ds), ds, nam_am_xem)
    # Trục 1: thân hộp không lặp tiêu đề · một mã một hộp đầy đủ · đoạn thân không chép hộp (chỉ cắt câu đã có).
    kh.gon_bao_cao({"cot_loi": cot_loi, "chuong": ds})
    from app.luangiai import luu_y_mang as lym  # noqa: PLC0415
    luu_y_mang = lym.dung(ds, "tuvi", muc_cung={k: v["muc"] for k, v in cc.items()})
    return _sach({"phien_ban": PHIEN_BAN, "cot_loi": cot_loi, "thoi_gian_bieu": tgb, "chuong": ds, "luu_y_mang": luu_y_mang,
                  "tuoi_mu": vh["tuoi_mu"], "ngay_xem": ngay_xem.isoformat(), **kb.meta()})
