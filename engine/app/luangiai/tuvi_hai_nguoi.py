# -*- coding: utf-8 -*-
"""HN-2N — RULES "Xem lá số 2 người": điểm THAM KHẢO hợp – khắc 0–100 (chủ dự án chốt 2026-10-21, chỉ cho phần
Tử vi 2 người; hợp đôi thần số vẫn không chấm điểm). Tất định, luật công khai, không gọi LLM, không lưu gì.

Luật `hai_nguoi_1` (năm = năm âm lịch của mỗi người theo CÙNG lịch người dùng chọn — Việt mặc định; riêng cung phi
lấy năm theo Lập xuân như /phong-thuy; mọi phép tính lấy từ tầng CALC có sẵn):

| Tiêu chí  | Tối đa | Cách chấm (tỉ lệ × tối đa, làm tròn nửa lên) |
|-----------|-------:|----------------------------------------------|
| Mệnh      | 20 | nạp âm (`can_chi.nap_am`) tương sinh 1.0 · bình hoà 0.7 · tương khắc 0.25 (ghi chiều ai sinh/khắc ai) |
| Can năm   | 15 | ngũ hợp 1.0 · hành can tương sinh 0.8 · cùng hành 0.6 · tương khắc 0.35 · tương xung 0.2 |
| Chi năm   | 20 | tam hợp 1.0 · lục hợp 0.9 · trùng / không xung hợp 0.6 · tứ hành xung 0.45 · lục hại, tương hình 0.35 · lục xung 0.15 |
| Cung phi  | 15 | du niên Bát trạch giữa hai mệnh quái (`phongthuy.menh_quai` năm theo Lập xuân như /phong-thuy; chỉ có năm âm → theo năm âm, ghi chú), `bang_huong`: Sinh Khí 1.0 · Diên Niên 0.95 · Thiên Y 0.9 · Phục Vị 0.7 · Hoạ Hại 0.4 · Lục Sát 0.3 · Ngũ Quỷ 0.2 · Tuyệt Mệnh 0.1. Thiếu giới tính một người → bỏ, chia lại 100 theo phần dư lớn nhất |
| Tử vi     | 30 | tứ hoá can năm người kia vào lá bạn (`tuvi_phi_hoa.phi_tu_can`): tỉ lệ 0.55 + 0.1 × r, kẹp 0..1; r = Σ hoá rơi vào cung trọng tâm của quan hệ × trọng số cung (Lộc +2, Khoa +1.5, Quyền +1, Kỵ −2) + Kỵ xung cung trọng tâm (−1 × trọng số). Đủ lá hai người → thêm chiều can năm bạn vào lá người kia, lấy trung bình |

Mức tiêu chí: tỉ lệ ≥ 0.75 Hợp · ≥ 0.5 Bình hoà · còn lại Cần dung hoà. Mức tổng: ≥ 75 Dễ hoà hợp · 55–74 Hợp nếu
hiểu nhau · 40–54 Cần dung hoà nhiều · < 40 Nhiều khác biệt — cần nói rõ. Lời (KB `tuvi_hai_nguoi_kb.json`) không
phán, không doạ, không vật phẩm; thuật ngữ chỉ ở `can_cu`. Golden tính tay: fixtures/golden/tuvi_hai_nguoi_diem.json.
"""
from __future__ import annotations

import datetime as dt
import unicodedata

from app.calc import can_chi as cc
from app.calc import lunar
from app.calc import phongthuy as pt
from app.calc import tuoi_dan_gian as tdg
from app.calc.battu_mo_rong import CAN_XUNG
from app.kb import tuvi_hai_nguoi_kb as kb
from app.luangiai import doi_song_chung as dsc
from app.luangiai.tuvi_phi_hoa import MANG

PHIEN_BAN_DIEM = "hai_nguoi_1"
TRONG_SO = {"menh": 20, "can": 15, "chi": 20, "cung_phi": 15, "tu_vi": 30}

# Cung trọng tâm theo quan hệ (trọng số 1.0 = cung chính của quan hệ).
CUNG_TRONG_TAM: dict[str, dict[str, float]] = {
    "nguoi_yeu": {"Phu Thê": 1.0, "Mệnh": 0.6, "Phúc Đức": 0.6},
    "vo_chong": {"Phu Thê": 1.0, "Phúc Đức": 0.7, "Mệnh": 0.6, "Điền Trạch": 0.4},
    "ban_be": {"Nô Bộc": 1.0, "Mệnh": 0.6, "Huynh Đệ": 0.6},
    "dong_nghiep": {"Nô Bộc": 1.0, "Quan Lộc": 0.8},
    "doi_tac": {"Tài Bạch": 1.0, "Quan Lộc": 0.8, "Nô Bộc": 0.6},
    "sep": {"Quan Lộc": 1.0, "Nô Bộc": 0.6},
    "cha_me_con": {"Phụ Mẫu": 1.0, "Tử Nữ": 1.0, "Phúc Đức": 0.6},
    "gia_dinh": {"Huynh Đệ": 1.0, "Phụ Mẫu": 0.8, "Điền Trạch": 0.8},
}
NHAN_QUAN_HE = {"nguoi_yeu": "người yêu", "vo_chong": "vợ chồng", "ban_be": "bạn bè", "dong_nghiep": "đồng nghiệp",
                "doi_tac": "đối tác", "sep": "cấp trên", "cha_me_con": "cha mẹ – con", "gia_dinh": "gia đình"}

TY_MENH = {"tuong_sinh": 1.0, "binh_hoa": 0.7, "tuong_khac": 0.25}
TY_CAN = {"ngu_hop": 1.0, "tuong_sinh": 0.8, "binh_hoa": 0.6, "tuong_khac": 0.35, "tuong_xung": 0.2}
TY_CHI = {"tam_hop": 1.0, "luc_hop": 0.9, "trung": 0.6, "binh": 0.6, "tu_hanh_xung": 0.45, "luc_hai": 0.35,
          "tuong_hinh": 0.35, "luc_xung": 0.15}
TY_CUNG_PHI = {"Sinh Khí": 1.0, "Diên Niên": 0.95, "Thiên Y": 0.9, "Phục Vị": 0.7, "Hoạ Hại": 0.4, "Lục Sát": 0.3,
               "Ngũ Quỷ": 0.2, "Tuyệt Mệnh": 0.1}
DIEM_HOA = {"Lộc": 2.0, "Khoa": 1.5, "Quyền": 1.0, "Kỵ": -2.0}
KY_XUNG = -1.0
TV_GOC, TV_BUOC = 0.55, 0.1
NGUONG_HOP, NGUONG_BINH = 0.75, 0.5
MUC_TONG = {"de_hoa_hop": 75, "hop_neu_hieu": 55, "can_dung_hoa_nhieu": 40, "nhieu_khac_biet": 0}

_NHAN_KL = {"hop": "Hợp", "binh_hoa": "Bình hoà", "can_dung_hoa": "Cần dung hoà"}
_NHAN_MUC = {"de_hoa_hop": "Dễ hoà hợp", "hop_neu_hieu": "Hợp nếu hiểu nhau", "can_dung_hoa_nhieu": "Cần dung hoà nhiều",
             "nhieu_khac_biet": "Nhiều khác biệt — cần nói rõ"}
_TEN = {"menh": "Bản mệnh năm sinh", "can": "Cách nghĩ, cách quyết", "chi": "Con giáp",
        "cung_phi": "Chỗ ở, không gian chung", "tu_vi": "Lá số Tử vi chạm nhau"}
_Y_MAC_DINH = {"hop": "Ở mặt này hai người dễ thuận nhau.", "binh_hoa": "Ở mặt này hai người không thuận cũng không vướng.",
               "can_dung_hoa": "Ở mặt này hai người khác nhau, cần nhường nhau."}
_NEN_MAC_DINH = {"hop": "Giữ những việc hai người đang làm tốt cùng nhau.",
                 "binh_hoa": "Hỏi nhau mong gì ở mặt này rồi chọn một việc làm cùng.",
                 "can_dung_hoa": "Nói rõ mong muốn của mình và hẹn một lúc bình tĩnh để bàn."}
_GOI_Y_MAC_DINH = ["Hẹn một lúc bình tĩnh mỗi tuần để nói chuyện.", "Nói rõ điều mình mong thay vì đợi người kia đoán.",
                   "Ghi lại thoả thuận chung để khỏi nhớ khác nhau."]
_LOI_DAN_MAC_DINH = ("Điểm này là tham khảo theo luật dân gian và sách Tử vi, Bát trạch. Mối quan hệ do cách hai "
                     "người cư xử với nhau.")
_CHUA_TINH_MAC_DINH = "Chưa tính phần này vì thiếu giới tính của một trong hai người."


# ------------------------------------------------------------------ tiện ích
def _hien(s: str) -> str:
    """Chính tả hiển thị của site: hoà, thuỷ (calc giữ dạng gốc)."""
    return s.replace("Hỏa", "Hoả").replace("Thủy", "Thuỷ")


def _so(x: float) -> str:
    """0.6 → '0,6' (dấu phẩy thập phân kiểu Việt)."""
    return f"{x:g}".replace(".", ",")


def _ty4(x: float) -> int:
    return max(0, min(10000, round(x * 10000)))


def _diem(ty4: int, toi_da: int) -> int:
    """Làm tròn nửa lên, số nguyên (không lệch do số thực)."""
    return (ty4 * toi_da * 2 + 10000) // 20000


def _ket_luan(ty4: int) -> str:
    return "hop" if ty4 >= NGUONG_HOP * 10000 else "binh_hoa" if ty4 >= NGUONG_BINH * 10000 else "can_dung_hoa"


def _chia_thang(ma: list[str]) -> dict[str, int]:
    """Chia 100 theo trọng số các tiêu chí được tính — phần dư lớn nhất, hoà thì theo thứ tự tiêu chí."""
    tong = sum(TRONG_SO[m] for m in ma)
    if tong == 100:
        return {m: TRONG_SO[m] for m in ma}
    tho = {m: TRONG_SO[m] * 100 / tong for m in ma}
    ra = {m: int(tho[m]) for m in ma}
    con = 100 - sum(ra.values())
    for m in sorted(ma, key=lambda m: (-(tho[m] - ra[m]), ma.index(m)))[:con]:
        ra[m] += 1
    return ra


def _nhom_tam_hop(chi: str) -> list[str]:
    i = tdg.CHI.index(chi)
    return [tdg.CHI[(i + k) % 12] for k in (0, 4, 8)]


def _nhom_tu_xung(chi: str) -> list[str]:
    g = tdg.CHI.index(chi) % 3
    return [c for i, c in enumerate(tdg.CHI) if i % 3 == g]


# ------------------------------------------------------------------ 4 tiêu chí năm sinh
def _menh(can_b, chi_b, can_k, chi_k) -> dict:
    na_b, na_k = cc.nap_am(can_b, chi_b), cc.nap_am(can_k, chi_k)
    hb, hk = _hien(na_b["hanh"]), _hien(na_k["hanh"])
    sk = cc.sinh_khac(na_b["hanh"], na_k["hanh"])
    loai, chieu, ly = {
        "sinh": ("tuong_sinh", "ban_sinh_kia", f"{hb} sinh {hk} — tương sinh, bạn là bên nâng đỡ."),
        "bị sinh": ("tuong_sinh", "kia_sinh_ban", f"{hk} sinh {hb} — tương sinh, người ấy là bên nâng đỡ."),
        "bình hoà": ("binh_hoa", "cung_hanh", f"Cùng hành {hb} — bình hoà."),
        "khắc": ("tuong_khac", "ban_khac_kia", f"{hb} khắc {hk} — tương khắc."),
        "bị khắc": ("tuong_khac", "kia_khac_ban", f"{hk} khắc {hb} — tương khắc."),
    }[sk]
    can_cu = [f"Mệnh nạp âm: bạn {_hien(na_b['ten'])} ({hb}), người ấy {_hien(na_k['ten'])} ({hk}). {ly}"]
    return {"loai": loai, "ty": _ty4(TY_MENH[loai]), "chieu": chieu, "can_cu": can_cu}


def _can(can_b, can_k) -> dict:
    hb, hk = tdg.HANH_CAN[can_b], tdg.HANH_CAN[can_k]
    cap = frozenset((can_b, can_k))
    if cap in tdg.NGU_HOP_CAN:
        loai, ly = "ngu_hop", f"{can_b} – {can_k} ngũ hợp."
    elif cap in CAN_XUNG:
        loai, ly = "tuong_xung", f"{can_b} – {can_k} tương xung."
    else:
        sk = cc.sinh_khac(hb, hk)
        loai, ly = {
            "sinh": ("tuong_sinh", f"{_hien(hb)} sinh {_hien(hk)} — tương sinh."),
            "bị sinh": ("tuong_sinh", f"{_hien(hk)} sinh {_hien(hb)} — tương sinh."),
            "bình hoà": ("binh_hoa", f"Cùng hành {_hien(hb)} — bình hoà."),
            "khắc": ("tuong_khac", f"{_hien(hb)} khắc {_hien(hk)} — tương khắc."),
            "bị khắc": ("tuong_khac", f"{_hien(hk)} khắc {_hien(hb)} — tương khắc."),
        }[sk]
    can_cu = [f"Thiên can năm: bạn {can_b} ({_hien(hb)}), người ấy {can_k} ({_hien(hk)}). {ly}"]
    return {"loai": loai, "ty": _ty4(TY_CAN[loai]), "can_cu": can_cu}


def _chi(chi_b, chi_k) -> dict:
    qh = tdg.quan_he_chi(chi_b, chi_k)
    if qh is None and tdg.tu_hanh_xung(chi_b, chi_k):
        loai, ly = "tu_hanh_xung", f"cùng nhóm tứ hành xung ({' – '.join(_nhom_tu_xung(chi_b))})"
    else:
        loai, ly = {
            "tam_hop": ("tam_hop", f"tam hợp ({' – '.join(_nhom_tam_hop(chi_b))})"),
            "luc_hop": ("luc_hop", "lục hợp"),
            "trung": ("trung", "cùng con giáp"),
            "xung": ("luc_xung", "lục xung"),
            "hai": ("luc_hai", "lục hại"),
            "hinh": ("tuong_hinh", "tương hình"),
            None: ("binh", "không xung, không hợp"),
        }[qh]
    can_cu = [f"Địa chi năm: bạn tuổi {chi_b}, người ấy tuổi {chi_k} — {ly}."]
    return {"loai": loai, "ty": _ty4(TY_CHI[loai]), "can_cu": can_cu}


def _ngay(x) -> dt.date | None:
    if x is None or isinstance(x, dt.date):
        return x
    return dt.date.fromisoformat(str(x))


def _quai_mot(p: dict, ai: str) -> tuple[str, int | None, bool, list[str]]:
    """Mệnh quái một người — năm tính từ LẬP XUÂN như /phong-thuy (`menh_quai(..., ngay_sinh, "lap_xuan")`). Không có
    ngày dương (chỉ năm âm) → cách gần nhất có sẵn: năm âm lịch, ghi chú. → (quái, năm Bát trạch, mốc khác, ghi chú)."""
    nam_am, gt = int(p["nam_am"]), p["gioi_tinh"]
    tet = pt.menh_quai(nam_am, gt)["quai"]                    # theo Tết (năm âm của lịch người dùng chọn)
    ngay = _ngay(p.get("ngay_duong"))
    if ngay is None:
        return tet, None, False, [f"{ai[0].upper() + ai[1:]}: chỉ có năm âm lịch {nam_am} — cung phi tính theo năm "
                                  "âm lịch (thiếu ngày dương lịch để xét mốc Lập xuân)."]
    mq = pt.menh_quai(ngay.year, gt, ngay, "lap_xuan")
    ghi = [f"{ai[0].upper() + ai[1:]}: {c['chi_tiet']}" for c in mq["co_canh_bao"]]
    khac = mq["quai"] != tet
    if khac:
        ghi.append(f"{ai[0].upper() + ai[1:]}: theo mốc Tết (năm âm {nam_am}) là {tet}, khác mốc Lập xuân "
                   f"({mq['quai']}) — ở đây tính theo Lập xuân như trang Phong thuỷ.")
    return mq["quai"], mq["nam_tinh"], khac, ghi


def _cung_phi(ban: dict, kia: dict) -> dict | None:
    """QC 2026-10-21: năm cung phi theo Lập xuân (trước đây theo Tết); mốc Tết cho quái khác → ghi rõ (`moc_khac`)."""
    if ban.get("gioi_tinh") not in ("nam", "nu") or kia.get("gioi_tinh") not in ("nam", "nu"):
        return None
    qb, nb_bt, kb_, gb = _quai_mot(ban, "bạn")
    qk, nk_bt, kk_, gk = _quai_mot(kia, "người ấy")
    dn = pt.bang_huong(qb)[pt.QUAI[qk][1]]
    nb, nk = pt.nhom(qb), pt.nhom(qk)
    nam = lambda n: f", năm Bát trạch {n}" if n else ""  # noqa: E731
    can_cu = [f"Cung phi Bát trạch (năm tính từ Lập xuân): bạn {qb} ({nb}{nam(nb_bt)}), người ấy {qk} ({nk}"
              f"{nam(nk_bt)}) → {dn}" + (", cùng nhóm." if nb == nk else ", khác nhóm Đông – Tây."), *gb, *gk]
    return {"loai": _slug(dn), "ty": _ty4(TY_CUNG_PHI[dn]), "can_cu": can_cu, "moc_khac": kb_ or kk_}


def _slug(s: str) -> str:
    """'Diên Niên' → 'dien_nien' (mã du niên)."""
    s = unicodedata.normalize("NFD", s.replace("đ", "d").replace("Đ", "D"))
    return "_".join("".join(c for c in s if unicodedata.category(c) != "Mn").lower().split())


# ------------------------------------------------------------------ Tử vi
def _tac_dong(duong: list[dict], trong: dict[str, float]) -> list[tuple[dict, float]]:
    ra = []
    for x in duong:
        v = 0.0
        if x.get("den_cung") in trong:
            v += DIEM_HOA.get(x["hoa"], 0.0) * trong[x["den_cung"]]
        if x["hoa"] == "Kỵ" and x.get("xung_cung") in trong:
            v += KY_XUNG * trong[x["xung_cung"]]
        ra.append((x, round(v, 4)))
    return ra


def _dong_tu_vi(can: str, ai: str, cua: str, tac: list[tuple[dict, float]]) -> list[str]:
    ra = []
    for x, v in tac:
        sao = f" ({x['sao']})" if x.get("sao") else ""
        hieu = (f"cộng {_so(v)}" if v > 0 else f"trừ {_so(-v)}" if v < 0 else "không tính (ngoài cung trọng tâm)")
        xung = f", chiếu {x['xung_cung']}" if x["hoa"] == "Kỵ" and x.get("xung_cung") else ""
        ra.append(f"Can năm {can} của {ai}: Hoá {x['hoa']}{sao} vào cung {x.get('den_cung') or '—'} của {cua}{xung} "
                  f"— {hieu}.")
    return ra


def _tu_vi(quan_he: str, can_b: str, can_k: str, vao_ban: list[dict], ban_vao: list[dict] | None) -> dict:
    trong = CUNG_TRONG_TAM[quan_he]
    t1 = _tac_dong(vao_ban, trong)
    ty1 = _ty4(TV_GOC + TV_BUOC * sum(v for _, v in t1))
    can_cu = [f"Cung trọng tâm của quan hệ {NHAN_QUAN_HE[quan_he]}: "
              + ", ".join(f"{c} (×{_so(w)})" for c, w in trong.items())
              + ". Lộc +2, Khoa +1,5, Quyền +1, Kỵ −2 khi rơi vào cung trọng tâm; Kỵ chiếu cung trọng tâm −1."]
    can_cu += _dong_tu_vi(can_k, "người ấy", "bạn", t1)
    ty = ty1
    if ban_vao:
        t2 = _tac_dong(ban_vao, trong)
        ty2 = _ty4(TV_GOC + TV_BUOC * sum(v for _, v in t2))
        ty = (ty1 + ty2 + 1) // 2
        can_cu += _dong_tu_vi(can_b, "bạn", "người ấy", t2)
        can_cu.append(f"Hai chiều: {_so(ty1 / 100)}% và {_so(ty2 / 100)}% → lấy trung bình {_so(ty / 100)}%.")
    # Chi tiết đời thường (chiều người ấy → bạn): mảng thuận rõ nhất, mảng cần để ý (Kỵ vào hoặc chiếu).
    tot = max(t1, key=lambda p: p[1], default=None)
    xau = min(t1, key=lambda p: p[1], default=None)
    cung_xau = None
    if xau and xau[1] < 0:
        cung_xau = xau[0].get("den_cung") if xau[0].get("den_cung") in trong else xau[0].get("xung_cung")
    return {"loai": _ket_luan(ty), "ty": ty, "can_cu": can_cu,
            "tot": MANG.get(tot[0].get("den_cung") or "") if tot and tot[1] > 0 else None,
            "vuong": MANG.get(cung_xau or "")}


# ------------------------------------------------------------------ ghép
def _loi(ma: str, ket: str, quan_he: str) -> tuple[str, str]:
    c = kb.cau(ma, ket, quan_he)
    return (c["y"], c["nen"]) if c else (_Y_MAC_DINH[ket], _NEN_MAC_DINH[ket])


def _muc_tong(tong: int) -> str:
    return next(m for m, nguong in MUC_TONG.items() if tong >= nguong)


def _ap_hoc_hop(hop: list[dict], trong_so: dict | None, ca_nhan: dict | None, theo_ma: dict[str, dict]) -> list[dict]:
    """Tầng HỌC (kiểm chứng loại `hai_nguoi`, migration 0020) — cùng luật LG-ĐS (`doi_song_chung._ap_hoc`): gắn
    `ty_le_dung`/`so_phieu` khi ≥ 30 phiếu; hộp ≥ 100 phiếu và < 40% đúng → bỏ khỏi hộp, thêm dòng "Đang xem lại" vào
    căn cứ của tiêu chí (web hiện ở "Vì sao nói vậy"); hộp chính người xem bấm "chưa đúng" xếp cuối. Không đổi điểm, mức,
    lời; không sinh câu mới. `hop` = mọi ứng viên theo thứ tự ưu tiên (nơi gọi cắt ≤ 3 SAU bước này)."""
    chon, xem_lai = dsc._ap_hoc(hop, trong_so, ca_nhan)
    for h, dong in zip((h for h in hop if h.get("dang_xem_lai")), xem_lai):
        theo_ma[h["ma_mau"].split(".")[1]]["can_cu"].append(dong)
    giu = {id(h) for h in chon}
    ra = [h for h in hop if id(h) in giu][:3]      # ≤ 3 hộp đầu theo thứ tự ưu tiên, rồi "chưa đúng" xuống cuối
    ra = [h for h in ra if not h.get("_chua_dung")] + [h for h in ra if h.get("_chua_dung")]
    for h in ra:
        h.pop("_chua_dung", None)
        if not h.get("dang_xem_lai"):
            h.pop("dang_xem_lai", None)
    return ra


def cham_diem(ban: dict, kia: dict, quan_he: str, vao_ban: list[dict], ban_vao: list[dict] | None = None,
              trong_so: dict | None = None, ca_nhan: dict | None = None) -> dict:
    """`ban`/`kia` = {"nam_am": năm âm lịch (theo lịch người dùng chọn), "gioi_tinh": "nam" | "nu" | None,
    "ngay_duong"?: ngày sinh dương lịch (date hoặc ISO) — có thì cung phi tính năm theo Lập xuân}. `vao_ban` = đường bay tứ hoá can
    năm người kia vào lá bạn ({hoa, sao, den_cung, xung_cung}); `ban_vao` = chiều ngược lại (có khi đủ lá hai người).
    `trong_so` = {mã: {dung, chua_dung}} (tỉ lệ công khai), `ca_nhan` = {mã: "dung" | "chua_dung"} (phiếu của chính người
    xem) — chỉ chọn/xếp hộp (`_ap_hoc_hop`), KHÔNG đổi điểm. Mã hộp: `hn.<tiêu chí>.<loại>.<quan hệ>` (khớp SQL 0020)."""
    if quan_he not in CUNG_TRONG_TAM:
        raise ValueError(f"Quan hệ không hợp lệ: {quan_he}")
    can_b, chi_b = lunar.can_chi_nam(int(ban["nam_am"]))
    can_k, chi_k = lunar.can_chi_nam(int(kia["nam_am"]))
    phan = {"menh": _menh(can_b, chi_b, can_k, chi_k), "can": _can(can_b, can_k), "chi": _chi(chi_b, chi_k),
            "cung_phi": _cung_phi(ban, kia),
            "tu_vi": _tu_vi(quan_he, can_b, can_k, vao_ban, ban_vao)}
    co = [m for m in TRONG_SO if phan[m] is not None]
    thang = _chia_thang(co)

    tieu_chi = []
    for ma in TRONG_SO:
        meta = kb.tieu_chi(ma) or {}
        ten = meta.get("ten") or _TEN[ma]
        p = phan[ma]
        if p is None:
            tieu_chi.append({"ma": ma, "ten": ten, "mo_ta": meta.get("mo_ta"), "tinh": False, "diem": 0, "toi_da": 0,
                             "ty_le": None, "loai": "chua_tinh", "ket_luan": None, "nhan_ket_luan": None,
                             "giai_thich": kb.chua_tinh_cung_phi() or _CHUA_TINH_MAC_DINH, "can_cu": []})
            continue
        ket = _ket_luan(p["ty"])
        y, nen = _loi(ma, ket, quan_he)
        chi_tiet = []
        if ma == "tu_vi":
            for loai_ct in ("tot", "vuong"):
                mau = kb.tu_vi_chi_tiet(loai_ct)
                if p.get(loai_ct) and mau and (loai_ct == "tot" or ket != "hop"):
                    chi_tiet.append(mau.replace("{mang}", p[loai_ct]))
        giai = " ".join(s for s in (y, *chi_tiet, nen) if s)
        muc = {"ma": ma, "ten": ten, "mo_ta": meta.get("mo_ta"), "tinh": True, "diem": _diem(p["ty"], thang[ma]),
               "toi_da": thang[ma], "ty_le": p["ty"] / 10000, "loai": p["loai"], "ket_luan": ket,
               "nhan_ket_luan": kb.ket_luan(ket) or _NHAN_KL[ket], "giai_thich": giai, "can_cu": p["can_cu"],
               "_nen": nen, "_w": TRONG_SO[ma]}
        if "chieu" in p:
            muc["chieu"] = p["chieu"]
        if "moc_khac" in p:
            muc["moc_khac"] = p["moc_khac"]
        if meta.get("source_id"):
            muc["nguon"] = {"source_id": meta["source_id"], "school_id": meta.get("school_id")}
        tieu_chi.append(muc)

    def _hop(t: dict, loai: str) -> dict:
        h = {"loai": loai, "tieu_de": kb.tieu_de(t["ma"], t["ket_luan"]) or f"{t['ten']}: {t['nhan_ket_luan']}",
             "noi_dung": t["giai_thich"], "can_cu": list(t["can_cu"]),
             "ma_mau": f"hn.{t['ma']}.{t['loai']}.{quan_he}"}
        if loai == "luu_y":
            h["huong_xu_ly"] = t["_nen"]
        return h

    tinh = [t for t in tieu_chi if t["tinh"]]
    manh = sorted((t for t in tinh if t["ket_luan"] == "hop"), key=lambda t: (-t["ty_le"], -t["_w"]))
    dung = sorted((t for t in tinh if t["ket_luan"] == "can_dung_hoa"), key=lambda t: (t["ty_le"], -t["_w"]))
    diem_manh, can_dung_hoa = [_hop(t, "diem_manh") for t in manh], [_hop(t, "luu_y") for t in dung]
    if trong_so or ca_nhan:
        theo_ma = {t["ma"]: t for t in tieu_chi}
        diem_manh = _ap_hoc_hop(diem_manh, trong_so, ca_nhan, theo_ma)
        can_dung_hoa = _ap_hoc_hop(can_dung_hoa, trong_so, ca_nhan, theo_ma)
    diem_manh, can_dung_hoa = diem_manh[:3], can_dung_hoa[:3]
    for t in tieu_chi:
        t.pop("_nen", None)
        t.pop("_w", None)

    tong = sum(t["diem"] for t in tieu_chi)
    muc = _muc_tong(tong)
    mt = kb.muc_tong(muc)
    goi = kb.goi_y(quan_he)
    return {"phien_ban": PHIEN_BAN_DIEM, "tong": tong, "toi_da": 100, "muc": muc,
            "nhan_muc": mt.get("nhan") or _NHAN_MUC[muc], "mo_ta_muc": mt.get("mo_ta") or _NHAN_MUC[muc] + ".",
            "tieu_chi": tieu_chi, "diem_manh": diem_manh, "can_dung_hoa": can_dung_hoa,
            "goi_y": goi[:3] if len(goi) >= 3 else _GOI_Y_MAC_DINH, "loi_dan": kb.loi_dan() or _LOI_DAN_MAC_DINH,
            "hai_chieu": bool(ban_vao), "nguon": kb.meta()}
