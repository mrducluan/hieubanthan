# -*- coding: utf-8 -*-
"""LG-ĐS — RULES "Luận giải Tử vi đời sống" (`docs/LUAN-GIAI-DOI-SONG.md` mục 2). Tất định, không LLM, không DB.

Đọc lá số (dạng gọn `hoidap.tuvi.tom_tat`) → CHẤM từng cung → chọn câu đời thường từ KB `tuvi_doi_song_kb`
→ ghép 12 chương có hộp nổi bật (`hop`), thân bài (`doan`), "Vì sao nói vậy" (`can_cu`, thuật ngữ chỉ ở đây).

Chấm cung (mục 2.1): chính tinh theo độ sáng Nam phái (Miếu/Vượng +2, Đắc +1, Bình 0, Hãm −2) + tứ hoá sinh niên
trong cung (Lộc +2, Quyền +1, Khoa +1, Kỵ −2) + lục cát (Tả, Hữu, Xương, Khúc, Khôi, Việt, Lộc Tồn: +1) + lục sát
(Kình, Đà, Hoả, Linh, Không, Kiếp: −1) + NỬA tổng điểm gốc của cung xung chiếu và hai cung tam hợp (cắt về 0).
Tuần/Triệt → cờ `cham`, không cộng trừ. Cung vô chính diệu mượn chính tinh cung xung chiếu (khi đó phần chính tinh
của cung xung không tính lại vào nửa điểm, tránh đếm hai lần). Mức: ≥ 3 `thuan`, ≤ −2 `can_chu_dong`, còn lại
`can_bang`. Điểm không trả ra cho người dùng.

Tự học (mục 3 — ranh giới): `trong_so` (tỉ lệ công khai theo `ma_mau`) chỉ gắn số / hạ hộp có tỉ lệ đúng thấp,
`ca_nhan` chỉ xếp lại hộp người này đã bấm "chưa đúng". Không sinh câu mới, không sửa KB.
"""
from __future__ import annotations

import datetime as dt
import re

from app import config
from app.calc import lunar, tuvi_an_sao as az
from app.calc import tuvi_luu_nguyet as ln
from app.kb import tuvi_doi_song_kb as kb
from app.kb import tuvi_kb
from app.kb import tuvi_phi_hoa_kb as kb_ph
from app.luangiai import tuvi_nhip_3_thang as nhip3
from app.luangiai import tuvi_phi_hoa as phl
from app.luangiai.doi_song_chung import (  # noqa: F401 — tách dùng chung với Bát tự (BT-ĐS), giữ tên cũ
    MA_MAU_RE, TOI_DA_HOP, _ap_hoc, _cac_cau, _cau_dau, _hoa_dau, _ma, _sach, _sap, _tieu_de, slug, trong_so_xem_lai)

PHIEN_BAN = "doi_song_1"

DIEM_SANG = {"Miếu": 2, "Vượng": 2, "Đắc": 1, "Bình": 0, "Hãm": -2}
DIEM_HOA = {"Lộc": 2, "Quyền": 1, "Khoa": 1, "Kỵ": -2}
LUC_CAT = ("Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Lộc Tồn")
LUC_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp")
DAO_HOA = ("Hàm Trì", "Hồng Loan", "Thiên Hỷ", "Thiên Diêu")
TUAN_TRIET = {"Tuần Không": "Tuần", "Triệt Lộ": "Triệt"}
NGUONG_THUAN, NGUONG_CHU_DONG = 3, -2
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
             "can_chu_dong": "mảng này cần bạn chủ động hơn"}
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
    return {"ma": ma, "tieu_de": t[1], "cau_hoi": t[2], "muc": muc, "nhan_muc": kb.nhan_muc(muc),
            "tom_tat": tom_tat, "hop": hop, "doan": sach[:4], "can_cu": list(dict.fromkeys(c for c in can_cu if c)),
            "cau_tu_soi": cau_tu_soi, **them}


def _thuong(s: str) -> str:
    s = s.rstrip("…. ")
    return s[:1].lower() + s[1:]          # tiêu đề hộp không mở bằng tên riêng (thuật ngữ chỉ ở can_cu)


# Câu dẫn của đoạn nối theo từng chương (không dùng một câu dẫn chung cho mọi chương).
_DAN_NOI = {
    "su_nghiep": ("Trong công việc, bạn dựa được vào", "chỗ hay vấp"),
    "tien_bac": ("Với tiền bạc, chỗ dựa của bạn là", "chỗ dễ hao"),
    "tinh_cam": ("Trong tình cảm, bạn có", "chỗ dễ va"),
    "gia_dinh": ("Trong nhà, điều tốt là", "chỗ dễ căng"),
    "quan_he": ("Với người ngoài, bạn có", "chỗ dễ vướng"),
    "nha_cua": ("Về nhà cửa, bạn có", "chỗ dễ tốn công"),
}


def _doan_noi(hop: list[dict], dau_manh: str = "Chỗ mạnh của bạn ở mảng này", dau_vap: str = "chỗ cần để ý") -> str:
    """Câu nối tổng thể ghép từ TIÊU ĐỀ hộp (không chép nội dung hộp, không câu "meta" kiểu "xem trong hộp")."""
    manh = [_thuong(h["tieu_de"]) for h in hop if h["loai"] == "diem_manh"][:2]
    vap = [_thuong(h["tieu_de"]) for h in hop if h["loai"] == "luu_y"][:2]
    if manh and vap:
        return f"{dau_manh}: {'; '.join(manh)}. Còn {dau_vap}: {'; '.join(vap)}."
    if manh:
        return f"{dau_manh}: {'; '.join(manh)}."
    if vap:
        return f"{_hoa_dau(dau_vap)}: {'; '.join(vap)}."
    return ""


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
    """Lý do xếp theo độ hợp với mức của cung (thuận: đỡ trước; cần chủ động: vướng trước; cân bằng: trung tính)."""
    ld = ly_do(x)
    tot = [a for a, d in ld if d > 0]
    vuong = [a for a, d in ld if d < 0]
    trung = [a for a, d in ld if d == 0]
    return {"thuan": tot + trung + vuong, "can_chu_dong": vuong + trung + tot}.get(x["muc"], trung + vuong + tot)


def ly_do_cau(x: dict, toi_da: int = 2) -> str:
    """Nối 1–2 lý do hợp với mức: thuận → điều đỡ trước; cần chủ động → điều vướng trước; cân bằng → một đỡ, một
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
    return _chuong(ma, muc, tom, hop, [tom, _doan_noi(hop, *_DAN_NOI.get(ma, ()))], can_cu, ts)


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
    ch["tom_tat"] = _tom_tat_cung([("Mệnh", cc["Mệnh"])])
    noi = _doan_noi(ch["hop"], "Nét nổi bật của bạn", "điều nên để ý ở chính mình")
    ch["doan"] = [ch["tom_tat"], *([noi] if noi else [])]
    ch["muc"], ch["nhan_muc"] = cc["Mệnh"]["muc"], kb.nhan_muc(cc["Mệnh"]["muc"])
    ch["can_cu"] += [f"Mệnh chủ {ls['menh_chu']}, Thân chủ {ls['than_chu']}, {ls['cuc']}"]
    return ch


def _chuong_suc_khoe(cc: dict, hoc: tuple) -> dict:
    x = cc["Tật Ách"]
    cand = []
    nguon = [(s, "Tật Ách") for s in x["chinh"]] + [(s, "Mệnh") for s in cc["Mệnh"]["chinh"][:1]]
    for s, noi in nguon:
        sk = kb.suc_khoe(s["ten"])
        if not sk:
            continue
        nd = ((f"Theo sách xưa, phần cơ thể bạn nên chăm sóc phòng ngừa là {sk['bo_phan']}." if noi == "Tật Ách" else
               f"Với tính cách của bạn, sách xưa nhắc chăm sóc phòng ngừa {sk['bo_phan']}.")
              if sk.get("bo_phan") else "")
        nd = f"{nd} {sk.get('thoi_quen') or ''}".strip()
        cu = f"{s['ten']} ({s['do_sang'] or 'Bình'}) ở cung {noi}" + (" (mượn)" if s["muon"] else "")
        tieu = "Phần cơ thể nên chăm sóc" if noi == "Tật Ách" else "Nhịp sức của chính bạn"
        nd = nd or "Bạn nên để ý nhịp nghỉ của mình."
        lk = sk.get("loi_khuyen") or _SK_MAC_DINH
        ma = _ma("ds", "suc_khoe", slug(s["ten"]) + ("" if noi == "Tật Ách" else "+menh"),
                 "muon" if s["muon"] else "sao", "vap")
        w = 2.0 if noi == "Tật Ách" else 1.0
        # Sao sáng ở cung không cần chủ động → đây là lời chăm sóc phòng ngừa, không phải "lưu ý" (tránh chương
        # "Thuận lợi" mà toàn hộp lưu ý). Mã giữ nguyên để phiếu kiểm chứng không đổi.
        if s["do_sang"] == "Hãm" or cc[noi]["muc"] == "can_chu_dong":
            cand.append(_hop("luu_y", tieu, nd, [cu], ma, w, huong=lk))
        else:
            cand.append(_hop("loi_khuyen", tieu, f"{nd} {lk}", [cu], ma, w))
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
        chu_de = k.get("chu_de") or (tuvi_kb.chu_de_han(c["ten"]) or "").split(":")[-1].strip(" .") or _ten(c["ten"])
        muc = cc[c["ten"]]["muc"]
        mot = {"thuan": "Giai đoạn thuận", "can_bang": "Giai đoạn cân bằng",
               "can_chu_dong": "Giai đoạn cần chủ động"}[muc]
        # Việc nên làm theo MỨC của giai đoạn (thuận: tận dụng; cần chủ động: phòng trước) + một lý do cụ thể nhất của
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


# ---- đường bay (phi hoá) — lời đời thường, kỹ thuật vào can_cu
_Y_BAY = {"Lộc": "có xu hướng mang thuận lợi tới", "Quyền": "thêm chủ động, trách nhiệm cho",
          "Khoa": "thêm uy tín, sự rõ ràng cho", "Kỵ": "hay dồn bận tâm vào"}
_TU_HOA_VAN = {
    "Lộc": ("Điều tốt ở chuyện {a} đến nhanh, đi cũng nhanh.", "Nên giữ lại một phần mỗi khi chuyện {a} có kết quả tốt."),
    "Quyền": ("Ở chuyện {a}, bạn hay tự quyết rất nhanh.", "Nên chờ một nhịp và hỏi thêm người liên quan trước khi đổi kế hoạch."),
    "Khoa": ("Chuyện {a} có xu hướng tự rõ ràng dần.", "Nên giữ thói quen ghi chép để điều tốt ấy bền."),
    "Kỵ": ("Bạn hay tự ôm, tự lo chuyện {a}.", "Nên kể việc đang lo với một người tin được và chia nhỏ việc ra."),
}
_THUAT_NGU = re.compile(r"Miếu|Hãm|(?<!\w)[Hh]oá (?:Lộc|Quyền|Khoa|Kỵ)|(?<!\w)tự hoá|tam phương|(?<!\w)[Cc]an (?=[A-ZĐ])|"
                        r"cung (?=[A-ZĐ])")


_TIEU_BAY = {"Lộc": "{A} đỡ cho {b}", "Quyền": "{A} thêm sức cho {b}", "Khoa": "{A} làm rõ {b}",
             "Kỵ": "{A} kéo bận tâm sang {b}"}
_TN_TIEU_DE = re.compile(r"(?<!\w)(?:Kỵ|Lộc|Quyền|Khoa)(?!\w)")


def _chu(cung: str) -> str:
    """Chủ ngữ: "Chuyện tiền bạc" / "Bản thân bạn" (Mệnh)."""
    return "Bản thân bạn" if cung == "Mệnh" else f"Chuyện {_ten(cung)}"


def _vat(cung: str) -> str:
    """Bổ ngữ: "chuyện tiền bạc" / "chính bạn" (Mệnh)."""
    return "chính bạn" if cung == "Mệnh" else f"chuyện {_ten(cung)}"


_MAU_RONG = None


def _mau_rong() -> set[str]:
    """Mã mẫu đường bay "*" ở cung phát (vd "Khoa vào Phụ Mẫu từ cung nào cũng vậy") — lời mẫu không nói mảng nào
    phát → ai có đường bay ấy cũng nhận cùng một câu. Với mẫu này dùng lời theo đúng hai mảng của lá (giữ mã mẫu)."""
    global _MAU_RONG
    if _MAU_RONG is None:
        _MAU_RONG = {m.get("ma") for m in kb_ph.mau_duong_bay() if m.get("tu_cung") in ("*", None, "")}
    return _MAU_RONG


def _cau_dich(d: dict) -> tuple[str | None, str | None]:
    """Câu theo CUNG ĐÍCH của đường bay (KB phi hoá `phi_vao_cung`), điền mảng phát bằng lời đời thường → (ý, việc
    nên làm). Bỏ câu có thuật ngữ."""
    mau = kb_ph.phi_vao_cung(d["hoa"], d["den_cung"] or "")
    if not mau:
        return None, None
    van = kb_ph.dien(mau.replace("Mảng {tu_cung}", _chu(d["tu_cung"])), tu_cung=_vat(d["tu_cung"]))
    cau = [c for c in _cac_cau(van or "") if not _THUAT_NGU.search(c) and not _TN_TIEU_DE.search(c)
           and "Phái" not in c and "{" not in c]
    y = cau[0] if cau and cau[0].startswith(_chu(d["tu_cung"])) else None
    lk = next((c for c in cau[1:] if c.startswith(("Nên", "Hợp"))), None)
    return y, lk


def _hop_bay(n: dict, da_lk: set[str] | None = None) -> dict:
    d = n["duong"]
    a = _ten(d["tu_cung"])
    den_c = d["den_cung"] or d["tu_cung"]
    hoa = d["hoa"]
    A = "Bản thân bạn" if d["tu_cung"] == "Mệnh" else _hoa_dau(a)
    B = "chính bạn" if den_c == "Mệnh" else _ten(den_c)
    rong = n["loai"] == "mau" and n.get("ma_mau") in _mau_rong()
    mau = n["loai"] == "mau" and not rong
    sau = n["nghia"].split(": ", 1)[-1] if mau else ""
    sau = _hoa_dau(sau) if sau and not _THUAT_NGU.search(sau) else ""
    y_dich, lk_dich = (None, None) if (mau or d["tu_hoa"]) else _cau_dich(d)
    if d["tu_hoa"]:
        y0, lk0 = _TU_HOA_VAN[hoa]
        y = sau or y0.format(a=a)
        cu = f"Cung {d['tu_cung']} tự hoá {hoa} ({d['sao']}, can {d['can']})"
        goc = f"tu+{slug(d['tu_cung'])}"
        tieu0 = _tieu_de(y, f"{A} tự tác động lên chính mình")
    else:
        if hoa == "Kỵ" and d["xung_cung"] == d["tu_cung"]:
            y0 = (f"Bận tâm về {_vat(d['tu_cung'])} hay lan sang {_vat(den_c)}, rồi quay lại làm "
                  f"{_vat(d['tu_cung'])} thêm rối.")
            tieu0 = f"{A} vòng qua {B} rồi quay về"
        elif hoa == "Kỵ":
            y0 = (f"{_chu(d['tu_cung'])} hay dồn bận tâm vào {_vat(den_c)}, rồi kéo theo "
                  f"{_vat(d['xung_cung'] or den_c)}.")
            tieu0 = _TIEU_BAY[hoa].format(A=A, b=B)
        else:
            y0 = f"{_chu(d['tu_cung'])} {_Y_BAY[hoa]} {_vat(den_c)}."
            tieu0 = _TIEU_BAY[hoa].format(A=A, b=B)
        # Kỵ giữ câu của mã (nói cả mảng bị kéo theo); Lộc/Quyền/Khoa dùng câu theo cung đích nếu KB có.
        y = sau or (y0 if hoa == "Kỵ" else y_dich or y0)
        lk_mau = (f"Khi {_vat(d['tu_cung'])} đang căng, hoãn quyết định lớn về {_vat(den_c)} vài ngày và nói "
                  "rõ với người liên quan." if hoa == "Kỵ" else
                  f"Khi {_vat(d['tu_cung'])} đang thuận, dành một phần kết quả ấy cho {_vat(den_c)}.")
        if lk_dich and hoa == "Kỵ":           # việc theo cung đích, gắn vào lúc mảng phát đang căng
            lk_dich = f"Khi {_vat(d['tu_cung'])} đang căng, {_thuong(lk_dich)}."
        lk0 = lk_dich if lk_dich and lk_dich not in (da_lk or set()) else lk_mau
        if hoa == "Khoa" and y_dich and y == y_dich:
            tieu0 = _tieu_de(y_dich, tieu0)
        cu = (f"Hoá {hoa} ({d['sao']}, can {d['can']}) từ cung {d['tu_cung']} vào {d['den_cung']}"
              + (f", chiếu {d['xung_cung']}" if hoa == "Kỵ" else ""))
        goc = f"{slug(d['tu_cung'])}+{slug(d['den_cung'])}"
    lk = n["viec_nen_lam"] if mau and not _THUAT_NGU.search(n["viec_nen_lam"]) else lk0.format(a=a)
    goc = slug(n["ma_mau"]) if n.get("ma_mau") else goc
    tt = [n["ghi_chu_tuan_triet"]] if n.get("ghi_chu_tuan_triet") else []
    tieu = n["tieu_de"] if mau else tieu0
    if _THUAT_NGU.search(tieu) or _TN_TIEU_DE.search(tieu) or len(tieu) > 60:     # vd mẫu "Kỵ chiếu về bản thân"
        tieu = tieu0 if len(tieu0) <= 60 else "Mảng đời tác động lẫn nhau"
    if hoa == "Kỵ":
        return _hop("luu_y", tieu, y, [cu, *tt], _ma("ds", "duong_bay", goc, slug(hoa), "vap"), 2.0, huong=lk,
                    _linh=d["tu_cung"])
    return _hop("diem_manh", tieu, y, [cu, *tt], _ma("ds", "duong_bay", goc, slug(hoa), "manh"),
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
    muc = _muc(n_loc - n_ky)
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
    doan = [tom, _doan_noi(hop, "Chỗ các mảng đời đỡ nhau", "chỗ hay vướng"),
            "Đây là cách các mảng đời tác động lẫn nhau, không phải lời đoán sự kiện."]
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


def chon_cot_loi(ds_chuong: list[dict]) -> list[dict]:
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
        if len(chon) >= 5:
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
        ca_nhan: dict | None = None, ls: dict | None = None) -> dict:
    """`sinh` như `hoidap.tuvi.tra_loi` (+ `luu_nguyet` tuỳ chọn). → báo cáo `doi_song_1` (chưa có moi_xem / phí —
    `toan_bo.tuvi` gắn)."""
    from app.hoidap.tuvi import tom_tat          # tránh vòng import

    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    kw = _sinh_kw(sinh)
    if ls is None:
        ls = tom_tat(az.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN",
                                   hoa_linh=sinh.get("hoa_linh", "viet"), **kw))
    vh = az.van_han(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], ngay_xem, **kw)
    tz_xem = az.TZ_TRUNG if kw["lich"] == "trung" else config.CALENDAR_MERIDIAN_TZ
    nam_am_xem = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, tz_xem)[2]
    nam_am_sinh = nam_am_xem - vh["tuoi_mu"] + 1
    cc = cham_cung(ls)
    hoc = (trong_so, ca_nhan)
    da_dung: set[str] = set()
    tgb = thoi_gian_bieu(ls, cc, vh["tuoi_mu"], nam_am_sinh)

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
        elif ma == "loi_khuyen":
            c = _chuong_loi_khuyen(ds, ds[0]["muc"], hoc)
        else:
            c = _chuong_cung(ma, cung, cc, hoc, da_dung)
        for h in c["hop"]:
            h["_ch"] = ma
        ds.append(c)
    cot_loi = chon_cot_loi(ds)
    return _sach({"phien_ban": PHIEN_BAN, "cot_loi": cot_loi, "thoi_gian_bieu": tgb, "chuong": ds,
                  "tuoi_mu": vh["tuoi_mu"], "ngay_xem": ngay_xem.isoformat(), **kb.meta()})
