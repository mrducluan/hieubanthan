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
import unicodedata

from app import config
from app.calc import lunar, tuvi_an_sao as az
from app.calc import tuvi_luu_nguyet as ln
from app.kb import tuvi_doi_song_kb as kb
from app.kb import tuvi_kb
from app.luangiai import tuvi_nhip_3_thang as nhip3
from app.luangiai import tuvi_phi_hoa as phl

PHIEN_BAN = "doi_song_1"
MA_MAU_RE = re.compile(r"^[a-z0-9_.+-]{3,60}$")

DIEM_SANG = {"Miếu": 2, "Vượng": 2, "Đắc": 1, "Bình": 0, "Hãm": -2}
DIEM_HOA = {"Lộc": 2, "Quyền": 1, "Khoa": 1, "Kỵ": -2}
LUC_CAT = ("Tả Phù", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Lộc Tồn")
LUC_SAT = ("Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp")
DAO_HOA = ("Hàm Trì", "Hồng Loan", "Thiên Hỷ", "Thiên Diêu")
TUAN_TRIET = {"Tuần Không": "Tuần", "Triệt Lộ": "Triệt"}
NGUONG_THUAN, NGUONG_CHU_DONG = 3, -2
TOI_DA_HOP = 6
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
_MUC_CAU = {
    "thuan": "Mảng này có nhiều điều đỡ cho bạn; làm đúng hướng thì dễ ra kết quả.",
    "can_bang": "Có điểm tựa, cũng có chỗ cần để ý; kết quả tuỳ nhiều vào cách bạn làm.",
    "can_chu_dong": "Mảng này không tự trôi chảy; bạn sắp xếp sớm thì mọi việc nhẹ hơn nhiều.",
}
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
_SK_MAC_DINH = "Nên giữ giờ ngủ, ăn uống đều, vận động nhẹ mỗi ngày và khám sức khoẻ định kỳ."
_THU_TU_LOP = ("dai_han", "luu_nien", "tieu_han")
_MUC_THANG = {"thuan": "thuan", "binh": "can_bang", "can_than": "can_chu_dong"}
_NHAN_LOP = {"thuan": "mảng này đang thuận", "can_bang": "mảng này ở mức cân bằng",
             "can_chu_dong": "mảng này cần bạn chủ động hơn"}


# ------------------------------------------------------------------ tiện ích
def slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s.replace("đ", "d").replace("Đ", "D"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def _ten(cung: str) -> str:
    return kb.ten_doi_thuong(cung) or _TEN_MAC_DINH.get(cung, cung.lower())


def _hoa_dau(s: str) -> str:
    return s[:1].upper() + s[1:] if s else s


def _cau_dau(s: str) -> str:
    """Câu đầu tiên của đoạn."""
    m = re.search(r"[.!?…](\s|$)", s)
    return s[: m.end()].strip() if m else s.strip()


_DAN = re.compile(r"^(?:Trong|Với|Ở|Về|Khi|Lúc|Nếu|Quan hệ|Mỗi|Sau|Trước)(?!\w)")
_NOI = re.compile(r"\s(?:hay|hoặc|và|nhưng|nên|vì|khi|mà|để|rồi|nhất là|trong khi)\s")
_TREO = {"những", "các", "một", "của", "với", "cho", "và", "hay", "là", "được", "bị", "từ", "tới", "đến", "vào",
         "như", "mà", "ở", "trong"}


def _tieu_de(s: str, mac_dinh: str) -> str:
    """Tiêu đề hộp (≤ 60 ký tự) từ câu đầu: vế đầu; vế dẫn ngắn ("Trong công việc", "Lúc nóng") ghép thêm vế sau;
    quá dài thì cắt TRƯỚC một từ nối (hay/và/khi…) — không cắt giữa cụm, không để "…"; không cắt được → `mac_dinh`."""
    cau = re.split(r"(?<=[.!?…])\s", (s or "").strip(), maxsplit=1)[0].rstrip(".!?… ")
    phan = [p for p in re.split(r"\s*[,;:—–(]\s*", cau) if p]
    v = phan[0] if phan else ""
    if len(phan) > 1 and (len(v) < 8 or (_DAN.match(v) and len(v) < 30)):
        v = f"{v}, {phan[1]}"
    if len(v) < 8:
        return mac_dinh[:60]
    if len(v) > 60:
        cat = [m.start() for m in _NOI.finditer(v) if 18 <= m.start() <= 60]
        if not cat:
            return mac_dinh[:60]
        w = v[:cat[-1]].split()
        while len(w) > 3 and w[-1].lower() in _TREO:
            w.pop()
        v = " ".join(w)
    return v


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


def _ma(*phan: str) -> str:
    ma = ".".join(p for p in phan if p)
    if len(ma) > 60:            # rút gọn phần ghép "+cung" về chữ cái đầu, vẫn tất định
        ma = ".".join("+".join(x if i == 0 else "".join(w[0] for w in x.split("_")) for i, x in enumerate(p.split("+")))
                      for p in phan if p)
    return ma[:60].rstrip(".+-")


def _muc(diem: float) -> str:
    return "thuan" if diem >= NGUONG_THUAN else "can_chu_dong" if diem <= NGUONG_CHU_DONG else "can_bang"


def _hop(loai: str, tieu_de: str, noi_dung: str, can_cu: list[str], ma_mau: str, trong: float,
         huong: str | None = None, **them) -> dict:
    h = {"loai": loai, "tieu_de": _sua_menh(tieu_de), "noi_dung": _sua_menh(noi_dung.strip()),
         "can_cu": [c for c in can_cu if c], "ma_mau": ma_mau, "_w": trong}
    if "loi_khuyen" in them:
        them["loi_khuyen"] = _sua_menh(them["loi_khuyen"])
    if loai == "luu_y":
        h["huong_xu_ly"] = _sua_menh(huong) or "Nên làm chậm lại, chuẩn bị sớm và hỏi thêm người có kinh nghiệm."
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
                        "muon_tu": muon_tu, "hoa": [x for x in ls["tu_hoa"] if x["cung"] == c["ten"]],
                        "cat": cat, "sat": sat, "dao_hoa": dao, "tuan_triet": tt,
                        "lan_can": [xung["ten"], th1["ten"], th2["ten"]]}
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
        ra.append(_hop("luu_y", "Việc đến chậm hơn mong đợi", f"Ở chuyện {t}, việc thường đến chậm hơn bạn mong.",
                       [cu], _ma("ds", ch, "tuan_triet" + hau, "cham", "vap"), 1.0,
                       huong="Nên chuẩn bị sớm, kiên nhẫn và đừng bỏ ngang khi chưa thấy kết quả."))
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


# ------------------------------------------------------------------ tự học: trọng số công khai + phiếu cá nhân
def _ap_hoc(cand: list[dict], trong_so: dict | None, ca_nhan: dict | None) -> tuple[list[dict], list[str]]:
    """Chọn ≤ TOI_DA_HOP hộp theo thứ tự ứng viên; bỏ hộp `dang_xem_lai` (đẩy sang can_cu), hộp người này bấm
    "chưa đúng" xếp cuối. → (hộp, dòng can_cu "Đang xem lại")."""
    trong_so, ca_nhan = trong_so or {}, ca_nhan or {}
    chon, xem_lai = [], []
    for h in cand:
        p = trong_so.get(h["ma_mau"])
        if p:
            dung, chua = int(p.get("dung", 0)), int(p.get("chua_dung", 0))
            tong = dung + chua
            if tong >= 30:
                h["ty_le_dung"], h["so_phieu"] = round(dung / tong, 2), tong
                h["dang_xem_lai"] = tong >= 100 and dung / tong < 0.40
        if h.get("dang_xem_lai"):
            xem_lai.append(f"Đang xem lại: {h['tieu_de']}")
            continue
        if ca_nhan.get(h["ma_mau"]) == "chua_dung":
            h["_chua_dung"] = True
        chon.append(h)
        if len(chon) == TOI_DA_HOP:
            break
    return [h for h in chon if not h.get("_chua_dung")] + [h for h in chon if h.get("_chua_dung")], xem_lai


def trong_so_xem_lai(h: dict, hoc: tuple) -> bool:
    """Hộp dự phòng cũng tôn trọng ngưỡng "đang xem lại" của bảng tỉ lệ."""
    p = (hoc[0] or {}).get(h["ma_mau"])
    if not p:
        return False
    tong = int(p.get("dung", 0)) + int(p.get("chua_dung", 0))
    return tong >= 100 and int(p.get("dung", 0)) / tong < 0.40


def _sap(cand: list[dict]) -> list[dict]:
    return sorted(cand, key=lambda h: -h["_w"])


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


def _cac_cau(s: str) -> list[str]:
    """Tách câu (theo ". ", "! ", "? ") — đơn vị so trùng giữa thân bài và hộp."""
    return [c.strip() for c in re.split(r"(?<=[.!?])\s+", s or "") if c.strip()]


def _thuong(s: str) -> str:
    s = s.rstrip("…. ")
    return s[:1].lower() + s[1:]          # tiêu đề hộp không mở bằng tên riêng (thuật ngữ chỉ ở can_cu)


def _doan_noi(hop: list[dict], dau_manh: str = "Chỗ mạnh của bạn ở mảng này", dau_vap: str = "chỗ cần để ý") -> str:
    """Câu nối tổng thể ghép từ TIÊU ĐỀ hộp (không chép nội dung hộp)."""
    manh = [_thuong(h["tieu_de"]) for h in hop if h["loai"] == "diem_manh"][:2]
    vap = [_thuong(h["tieu_de"]) for h in hop if h["loai"] == "luu_y"][:2]
    if manh and vap:
        return f"{dau_manh}: {'; '.join(manh)}. Còn {dau_vap}: {'; '.join(vap)} — mỗi điều có cách gỡ ngay trong hộp."
    if manh:
        return f"{dau_manh}: {'; '.join(manh)}."
    if vap:
        return f"{_hoa_dau(dau_vap)}: {'; '.join(vap)} — mỗi điều có cách gỡ ngay trong hộp."
    return ""


def _tom_tat_cung(ds: list[tuple[str, str]], k: int = 0) -> str:
    """ds = [(tên cung, mức)] → 1–2 câu. `k` (thứ tự chương) xoay câu mô tả mức để các chương không lặp nhau."""
    if len(ds) == 1:
        ten, muc = ds[0]
        dau = "Nhìn chung, con người bạn" if ten == "Mệnh" else f"Về {_ten(ten)}, nhìn chung bạn"
        cau = kb.muc_mo_ta_ds(muc) or [_MUC_CAU[muc]]
        return f"{dau} ở mức {kb.nhan_muc(muc).lower()}. {cau[k % len(cau)]}"
    phan = "; ".join(f"{_ten(t)}: {kb.nhan_muc(m).lower()}" for t, m in ds)
    return f"Nhìn chung — {phan}."


def _hop_muc(ma: str, ten: str, cc: dict, ghep: bool) -> dict:
    """Hộp dự phòng khi cung có ít điểm nhấn: nói theo mức của cung + việc nên làm của KB đại hạn."""
    x, t = cc[ten], _ten(ten)
    nen = (kb.dai_han(ten) or {}).get("nen_lam") or "Nên giữ nhịp đều và chuẩn bị sớm cho việc lớn."
    goc = "muc" + (f"+{slug(ten)}" if ghep else "")
    cu = [f"Cung {ten}: chính tinh, tứ hoá, cát/sát và cung chiếu về cộng lại ở mức {kb.nhan_muc(x['muc']).lower()}"]
    if x["muc"] == "can_chu_dong":
        return _hop("luu_y", f"Chuyện {t} cần bạn chủ động", f"Chuyện {t} ít khi tự trôi chảy với bạn.", cu,
                    _ma("ds", ma, goc, x["muc"], "vap"), 0.3, huong=nen, _cung=ten)
    return _hop("diem_manh", f"Chuyện {t} có điểm tựa", f"Ở chuyện {t}, bạn có sẵn điểm tựa để dựa vào. {nen}", cu,
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
    k = [x[0] for x in CHUONG].index(ma)
    tom = _tom_tat_cung([(t, cc[t]["muc"]) for t in cung], k)
    return _chuong(ma, muc, tom, hop, [tom, _doan_noi(hop)], can_cu, ts)


TRONG_PHA_CACH = 0.9        # cách cục tốt bị phá: bằng nửa cách nguyên vẹn (1,8)
PHA_CACH_LOI = "Nét này dễ bị giảm khi gặp áp lực, nên bạn cần tự chủ nhiều hơn để giữ được nó."


def _chuong_tong_quan(ls: dict, cc: dict, hoc: tuple, da_dung: set[str]) -> dict:
    them = []
    than = next((c for c in ls["cung"] if c["la_than"]), None)
    if than and than["ten"] != "Mệnh":
        t = _ten(than["ten"])
        them.append(_hop("loi_khuyen", "Nơi bạn dồn sức về sau",
                         f"Càng lớn tuổi, bạn càng dồn tâm sức cho chuyện {t}. Nên chọn sớm cách làm bền cho mảng này.",
                         [f"Thân cư cung {than['ten']}"], _ma("ds", "tong_quan", "than_cu", slug(than["ten"]), "khuyen"),
                         1.2))
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
                             f"{y.rstrip('. ')}. {PHA_CACH_LOI}", [cu],
                             _ma("ds", "tong_quan", "cach", slug(c["ma"]), "pha"), TRONG_PHA_CACH, _pha_cach=True))
        else:
            them.append(_hop("diem_manh", _tieu_de(y, "Nét nổi bật của bạn"), y, [cu],
                             _ma("ds", "tong_quan", "cach", slug(c["ma"]), "manh"), 1.8))
    ch = _chuong_cung("tong_quan", ["Mệnh", "Phúc Đức"], cc, hoc, da_dung, them, chi_phu={"Phúc Đức": 2})
    ch["tom_tat"] = _tom_tat_cung([("Mệnh", cc["Mệnh"]["muc"])])
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
        nd = f"Sách xưa gắn phần này với {sk['bo_phan']} — nên chăm sóc phòng ngừa." if sk.get("bo_phan") else ""
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
        sk = kb.suc_khoe("sat") or {}
        cand.append(_hop("luu_y", "Thói quen dễ hao sức", sk.get("thoi_quen") or "Bạn dễ làm quá sức rồi mới nghỉ.",
                         [f"{', '.join(x['sat'])} ở cung Tật Ách (lục sát)"], _ma("ds", "suc_khoe", "sat", "co", "vap"),
                         1.5, huong=sk.get("loi_khuyen") or _SK_MAC_DINH))
    if not cand:
        cand.append(_hop("loi_khuyen", "Nếp sinh hoạt nên giữ", kb.suc_khoe_vo_chinh_dieu() or _SK_MAC_DINH,
                         ["Cung Tật Ách không có điểm nhấn rõ"], _ma("ds", "suc_khoe", "chung", "nep", "khuyen"), 1.0))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    chung = kb.suc_khoe_chung()
    nhip = {"thuan": "Nhịp sức của bạn khá bền; giữ được nếp sinh hoạt là giữ được sức.",
            "can_bang": "Nhịp sức của bạn lúc lên lúc xuống, phụ thuộc nhiều vào nếp sinh hoạt.",
            "can_chu_dong": "Bạn dễ hao sức hơn mình nghĩ; nên chủ động nghỉ trước khi mệt."}[x["muc"]]
    doan = [nhip, "Các gợi ý dưới đây xoay quanh nếp ăn ngủ, vận động và khám định kỳ — làm đều mỗi ngày quan "
                  "trọng hơn làm nhiều một lúc.", chung]
    return _chuong("suc_khoe", x["muc"], nhip, hop, doan, [c for h in hop for c in h["can_cu"]] + xem_lai,
                   (tuvi_kb.cung("Tật Ách") or {}).get("cau_tu_soi"), mien_tru=chung)


TUOI_BAT_DAU_TOI_DA = 86      # dòng thời gian bỏ giai đoạn bắt đầu sau 86 tuổi (trừ giai đoạn đang đi)


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
        nen = k.get("nen_lam") or "Nên dồn sức cho chủ đề này."
        ra.append({"tu_tuoi": tu, "den_tuoi": den, "nam_tu": nam_am_sinh + tu - 1, "nam_den": nam_am_sinh + den - 1,
                   "cung": c["ten"], "chu_de": chu_de, "muc": muc, "mot_cau": f"{mot}: {nen}",
                   "de_vap": k.get("de_vap"), "hien_tai": tuoi_mu is not None and tu <= tuoi_mu <= den})
    return ra


def _chuong_cuoc_doi(tgb: list[dict], tuoi_mu: int, hoc: tuple) -> dict:
    cand = []
    i_ht = next((i for i, g in enumerate(tgb) if g["hien_tai"]), None)

    def cau(g: dict) -> str:
        return f"Từ {g['tu_tuoi']} đến {g['den_tuoi']} tuổi ({g['nam_tu']}–{g['nam_den']}): {g['chu_de']}."

    if i_ht is not None:
        g = tgb[i_ht]
        cand.append(_hop("thoi_diem", "Giai đoạn bạn đang đi", f"{cau(g)} {g['mot_cau']}", [f"Đại hạn cung {g['cung']}"],
                         _ma("ds", "cuoc_doi", "dh_" + slug(g["cung"]), g["muc"], "hien_tai"), 3.0,
                         tu_tuoi=g["tu_tuoi"], den_tuoi=g["den_tuoi"]))
        if i_ht + 1 < len(tgb):
            g = tgb[i_ht + 1]
            cand.append(_hop("thoi_diem", "Giai đoạn kế tiếp", f"{cau(g)} {g['mot_cau']}", [f"Đại hạn cung {g['cung']}"],
                             _ma("ds", "cuoc_doi", "dh_" + slug(g["cung"]), g["muc"], "tiep"), 2.5,
                             tu_tuoi=g["tu_tuoi"], den_tuoi=g["den_tuoi"]))
    da_noi = {tgb[j]["cung"] for j in (i_ht, (i_ht or 0) + 1) if i_ht is not None and j < len(tgb)}
    sap = [g for g in tgb if g["den_tuoi"] >= tuoi_mu and g["tu_tuoi"] <= tuoi_mu + 30 and g["cung"] not in da_noi] or \
        [g for g in tgb if g["cung"] not in da_noi]
    thuan = next((g for g in sap if g["muc"] == "thuan"), None)
    chu_dong = next((g for g in sap if g["muc"] == "can_chu_dong"), None)
    if thuan:
        cand.append(_hop("diem_manh", "Giai đoạn nên tận dụng", f"{cau(thuan)} {thuan['mot_cau']}",
                         [f"Đại hạn cung {thuan['cung']}"], _ma("ds", "cuoc_doi", "dh_" + slug(thuan["cung"]),
                                                                 "thuan", "manh"), 2.0))
    if chu_dong:
        cand.append(_hop("luu_y", "Giai đoạn nên chuẩn bị trước",
                         f"{cau(chu_dong)} {chu_dong['de_vap'] or 'Việc thường cần nhiều sức hơn bạn tính.'}",
                         [f"Đại hạn cung {chu_dong['cung']}"],
                         _ma("ds", "cuoc_doi", "dh_" + slug(chu_dong["cung"]), "can_chu_dong", "vap"), 2.0,
                         huong=chu_dong["mot_cau"].split(": ", 1)[-1]))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    muc = tgb[i_ht]["muc"] if i_ht is not None else tgb[0]["muc"]
    tom = (f"Bạn đang ở giai đoạn {tgb[i_ht]['tu_tuoi']}–{tgb[i_ht]['den_tuoi']} tuổi, xoay quanh {tgb[i_ht]['chu_de']}."
           if i_ht is not None else f"Đời bạn chia thành từng giai đoạn mười năm, bắt đầu từ {tgb[0]['tu_tuoi']} tuổi.")
    # Dòng thời gian (`thoi_gian_bieu`) đã liệt kê đủ các giai đoạn → thân bài chỉ tóm lại, không kể lại từng giai đoạn.
    dem = {m: sum(g["muc"] == m for g in tgb) for m in ("thuan", "can_bang", "can_chu_dong")}
    phan = [f"{n} giai đoạn {kb.nhan_muc(m).lower()}" for m, n in dem.items() if n]
    doan = [tom,
            f"Trên dòng thời gian của bạn có {', '.join(phan)}."
            + (" Giai đoạn cần chủ động không phải lúc kém may — chỉ là lúc nên chuẩn bị trước nhiều hơn."
               if dem["can_chu_dong"] else "")]
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


def _hop_bay(n: dict) -> dict:
    d = n["duong"]
    a = _ten(d["tu_cung"])
    den_c = d["den_cung"] or d["tu_cung"]
    hoa = d["hoa"]
    A = "Bản thân bạn" if d["tu_cung"] == "Mệnh" else _hoa_dau(a)
    B = "chính bạn" if den_c == "Mệnh" else _ten(den_c)
    sau = n["nghia"].split(": ", 1)[-1] if n["loai"] == "mau" else ""
    sau = _hoa_dau(sau) if sau and not _THUAT_NGU.search(sau) else ""
    if d["tu_hoa"]:
        y0, lk0 = _TU_HOA_VAN[hoa]
        y = sau or y0.format(a=a)
        cu = f"Cung {d['tu_cung']} tự hoá {hoa} ({d['sao']}, can {d['can']})"
        goc = f"tu+{slug(d['tu_cung'])}"
        tieu0 = _tieu_de(y, f"{A} tự tác động lên chính mình")
    else:
        if hoa == "Kỵ" and d["xung_cung"] == d["tu_cung"]:
            y0 = f"{_chu(d['tu_cung'])} đi sang {_vat(den_c)} rồi dội lại {_vat(d['tu_cung'])}."
            tieu0 = f"{A} vòng qua {B} rồi quay về"
        elif hoa == "Kỵ":
            y0 = (f"{_chu(d['tu_cung'])} hay dồn bận tâm vào {_vat(den_c)}, rồi kéo theo "
                  f"{_vat(d['xung_cung'] or den_c)}.")
            tieu0 = _TIEU_BAY[hoa].format(A=A, b=B)
        else:
            y0 = f"{_chu(d['tu_cung'])} {_Y_BAY[hoa]} {_vat(den_c)}."
            tieu0 = _TIEU_BAY[hoa].format(A=A, b=B)
        y = sau or y0
        lk0 = (f"Nên tách bạch {_vat(d['tu_cung'])} với {_vat(den_c)} và để thêm thời gian trước quyết định lớn."
               if hoa == "Kỵ" else f"Nên để ý cơ hội đến từ {_vat(d['tu_cung'])} và dùng nó cho {_vat(den_c)}.")
        cu = (f"Hoá {hoa} ({d['sao']}, can {d['can']}) từ cung {d['tu_cung']} vào {d['den_cung']}"
              + (f", chiếu {d['xung_cung']}" if hoa == "Kỵ" else ""))
        goc = f"{slug(d['tu_cung'])}+{slug(d['den_cung'])}"
    lk = n["viec_nen_lam"] if n["loai"] == "mau" and not _THUAT_NGU.search(n["viec_nen_lam"]) else lk0.format(a=a)
    goc = slug(n["ma_mau"]) if n.get("ma_mau") else goc
    tt = [n["ghi_chu_tuan_triet"]] if n.get("ghi_chu_tuan_triet") else []
    tieu = n["tieu_de"] if n["loai"] == "mau" else tieu0
    if _THUAT_NGU.search(tieu) or _TN_TIEU_DE.search(tieu) or len(tieu) > 60:     # vd mẫu "Kỵ chiếu về bản thân"
        tieu = tieu0 if len(tieu0) <= 60 else "Mảng đời tác động lẫn nhau"
    if hoa == "Kỵ":
        return _hop("luu_y", tieu, y, [cu, *tt], _ma("ds", "duong_bay", goc, slug(hoa), "vap"), 2.0, huong=lk,
                    _linh=d["tu_cung"])
    return _hop("diem_manh", tieu, y, [cu, *tt], _ma("ds", "duong_bay", goc, slug(hoa), "manh"),
                1.5 if hoa == "Lộc" else 1.0, loi_khuyen=lk, _linh=d["tu_cung"])


def _chuong_duong_bay(ls: dict, hoc: tuple) -> dict:
    phi = phl.lap(ls, ls["can_nam"]) if ls.get("can_nam") else None
    cand = [_hop_bay(n) for n in (phi or {}).get("noi_bat", [])[:6]]
    for i, h in enumerate(cand):
        h["_w"] -= 0.001 * i
    hop, xem_lai = _ap_hoc(_sap(cand), *hoc)
    n_loc = sum(h["ma_mau"].endswith((".loc.manh",)) for h in hop)
    n_ky = sum(h["loai"] == "luu_y" for h in hop)
    muc = _muc(n_loc - n_ky)
    tom = ("Trong đời bạn, các mảng đời kéo nhau khá rõ: " +
           ("chỗ thuận nhiều hơn chỗ vướng." if n_loc > n_ky else "có vài chỗ hay vướng, biết trước thì gỡ được."
            if n_ky > n_loc else "chỗ thuận và chỗ vướng gần ngang nhau."))
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
        cand.append(_hop("luu_y", "Ba điều nên để ý", " ".join(_cau_dau(h["noi_dung"]) for h in vap),
                         [c for h in vap for c in h["can_cu"][:1]], "ds.loi_khuyen.tong_hop.ba.vap", 2.9,
                         huong="Nên gỡ từng điều theo ba việc ngay dưới." if viec else None))
    if viec:
        cand.append(_hop("loi_khuyen", "Ba việc nên làm", " ".join(viec), [], "ds.loi_khuyen.tong_hop.ba.khuyen", 2.8))
    hop, xem_lai = _ap_hoc(cand, *hoc)
    tom = "Gom lại từ các chương trên: đây là điều bạn nên dùng, nên để ý và nên làm."
    mang = [_ten(_cung_cua(h)) for h in vap if _cung_cua(h)]
    doan = [tom, (f"Nếu tuần này chỉ làm được một việc, hãy bắt đầu từ chuyện {mang[0]} — việc nhỏ làm đều có "
                  "ích hơn kế hoạch lớn bỏ dở." if mang else "")]
    return _chuong("loi_khuyen", muc, tom, hop, doan, [c for h in hop for c in h["can_cu"]] + xem_lai,
                   "Trong ba việc nên làm, việc nào bạn bắt đầu được ngay tuần này?")


def _cung_cua(h: dict) -> str | None:
    return h.get("_cung") or h.get("_linh")


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


def _sach(x):
    """Bỏ khoá nội bộ (`_w`, `_cung`, …) trước khi trả ra."""
    if isinstance(x, dict):
        return {k: _sach(v) for k, v in x.items() if not k.startswith("_")}
    if isinstance(x, list):
        return [_sach(v) for v in x]
    return x


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
