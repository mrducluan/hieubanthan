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
from app.kb import ten as _ten
from app.kb import tuvi_hai_nguoi_kb as kb
from app.kb.loi import L
from app.luangiai import doi_song_chung as dsc
from app.luangiai.tuvi_phi_hoa import MANG, la_viet, mang, tc, tcan, ts
from app.luangiai.tuvi_phi_hoa import th as ten_hoa

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
    """Chính tả hiển thị của site: hoà, thuỷ (calc giữ dạng gốc). Ngôn ngữ khác: tên hành theo bảng tên."""
    if not la_viet():
        return _ten.ten("hanh", s.replace("Hoả", "Hỏa").replace("Thuỷ", "Thủy"))
    return s.replace("Hỏa", "Hoả").replace("Thủy", "Thuỷ")


def _nap_am(ten_: str) -> str:
    return _hien(ten_) if la_viet() else _ten.ten("nap_am", ten_)


def _so(x: float) -> str:
    """0.6 → '0,6' (dấu phẩy thập phân kiểu Việt; tiếng Anh giữ dấu chấm)."""
    return f"{x:g}".replace(".", ",") if la_viet() else f"{x:g}"


def _chi_t(chi: str) -> str:
    return _ten.ten("chi", chi)


def _nhan(nhom: dict, ma: str, tien_to: str) -> str:
    """Nhãn mặc định trong mã (dict `nhom`) theo ngôn ngữ."""
    return L(f"tv2.hn.{tien_to}.{ma}", nhom[ma])


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
        "sinh": ("tuong_sinh", "ban_sinh_kia", L("tv2.hn.menh.ban_sinh", "{a} sinh {b} — tương sinh, bạn là bên nâng đỡ.",
                                                 a=hb, b=hk)),
        "bị sinh": ("tuong_sinh", "kia_sinh_ban", L("tv2.hn.menh.kia_sinh", "{a} sinh {b} — tương sinh, người ấy là bên "
                                                    "nâng đỡ.", a=hk, b=hb)),
        "bình hoà": ("binh_hoa", "cung_hanh", L("tv2.hn.cung_hanh", "Cùng hành {a} — bình hoà.", a=hb)),
        "khắc": ("tuong_khac", "ban_khac_kia", L("tv2.hn.khac", "{a} khắc {b} — tương khắc.", a=hb, b=hk)),
        "bị khắc": ("tuong_khac", "kia_khac_ban", L("tv2.hn.khac", "{a} khắc {b} — tương khắc.", a=hk, b=hb)),
    }[sk]
    can_cu = [L("tv2.hn.menh.can_cu", "Mệnh nạp âm: bạn {nb} ({hb}), người ấy {nk} ({hk}). {ly}", nb=_nap_am(na_b["ten"]),
                hb=hb, nk=_nap_am(na_k["ten"]), hk=hk, ly=ly)]
    return {"loai": loai, "ty": _ty4(TY_MENH[loai]), "chieu": chieu, "can_cu": can_cu}


def _can(can_b, can_k) -> dict:
    hb, hk = tdg.HANH_CAN[can_b], tdg.HANH_CAN[can_k]
    cap = frozenset((can_b, can_k))
    if cap in tdg.NGU_HOP_CAN:
        loai, ly = "ngu_hop", L("tv2.hn.can.ngu_hop", "{a} – {b} ngũ hợp.", a=tcan(can_b), b=tcan(can_k))
    elif cap in CAN_XUNG:
        loai, ly = "tuong_xung", L("tv2.hn.can.tuong_xung", "{a} – {b} tương xung.", a=tcan(can_b), b=tcan(can_k))
    else:
        sk = cc.sinh_khac(hb, hk)
        loai, ly = {
            "sinh": ("tuong_sinh", L("tv2.hn.sinh", "{a} sinh {b} — tương sinh.", a=_hien(hb), b=_hien(hk))),
            "bị sinh": ("tuong_sinh", L("tv2.hn.sinh", "{a} sinh {b} — tương sinh.", a=_hien(hk), b=_hien(hb))),
            "bình hoà": ("binh_hoa", L("tv2.hn.cung_hanh", "Cùng hành {a} — bình hoà.", a=_hien(hb))),
            "khắc": ("tuong_khac", L("tv2.hn.khac", "{a} khắc {b} — tương khắc.", a=_hien(hb), b=_hien(hk))),
            "bị khắc": ("tuong_khac", L("tv2.hn.khac", "{a} khắc {b} — tương khắc.", a=_hien(hk), b=_hien(hb))),
        }[sk]
    can_cu = [L("tv2.hn.can.can_cu", "Thiên can năm: bạn {cb} ({hb}), người ấy {ck} ({hk}). {ly}", cb=tcan(can_b),
                hb=_hien(hb), ck=tcan(can_k), hk=_hien(hk), ly=ly)]
    return {"loai": loai, "ty": _ty4(TY_CAN[loai]), "can_cu": can_cu}


def _chi(chi_b, chi_k) -> dict:
    qh = tdg.quan_he_chi(chi_b, chi_k)
    if qh is None and tdg.tu_hanh_xung(chi_b, chi_k):
        loai, ly = "tu_hanh_xung", L("tv2.hn.chi.tu_hanh_xung", "cùng nhóm tứ hành xung ({ds})",
                                     ds=" – ".join(_chi_t(c) for c in _nhom_tu_xung(chi_b)))
    else:
        loai, ly = {
            "tam_hop": ("tam_hop", L("tv2.hn.chi.tam_hop", "tam hợp ({ds})",
                                     ds=" – ".join(_chi_t(c) for c in _nhom_tam_hop(chi_b)))),
            "luc_hop": ("luc_hop", L("tv2.hn.chi.luc_hop", "lục hợp")),
            "trung": ("trung", L("tv2.hn.chi.trung", "cùng con giáp")),
            "xung": ("luc_xung", L("tv2.hn.chi.luc_xung", "lục xung")),
            "hai": ("luc_hai", L("tv2.hn.chi.luc_hai", "lục hại")),
            "hinh": ("tuong_hinh", L("tv2.hn.chi.tuong_hinh", "tương hình")),
            None: ("binh", L("tv2.hn.chi.binh", "không xung, không hợp")),
        }[qh]
    can_cu = [L("tv2.hn.chi.can_cu", "Địa chi năm: bạn tuổi {cb}, người ấy tuổi {ck} — {ly}.", cb=_chi_t(chi_b),
                ck=_chi_t(chi_k), ly=ly)]
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
    ai_ = L(f"tv2.hn.ai.{'ban' if ai == 'bạn' else 'kia'}", ai)
    Ai = ai_[0].upper() + ai_[1:]
    if ngay is None:
        return tet, None, False, [L("tv2.hn.quai.chi_nam_am", "{Ai}: chỉ có năm âm lịch {nam} — cung phi tính theo năm "
                                    "âm lịch (thiếu ngày dương lịch để xét mốc Lập xuân).", Ai=Ai, nam=nam_am)]
    mq = pt.menh_quai(ngay.year, gt, ngay, "lap_xuan")
    ghi = [L("tv2.hn.quai.co", "{Ai}: {ct}", Ai=Ai, ct=L(f"tv2.hn.co_mq.{c['loai']}", c["chi_tiet"]))
           for c in mq["co_canh_bao"]]
    khac = mq["quai"] != tet
    if khac:
        ghi.append(L("tv2.hn.quai.moc_khac", "{Ai}: theo mốc Tết (năm âm {nam}) là {tet}, khác mốc Lập xuân ({lx}) — ở "
                     "đây tính theo Lập xuân như trang Phong thuỷ.", Ai=Ai, nam=nam_am, tet=_ten.ten("quai", tet),
                     lx=_ten.ten("quai", mq["quai"])))
    return mq["quai"], mq["nam_tinh"], khac, ghi


def _cung_phi(ban: dict, kia: dict) -> dict | None:
    """QC 2026-10-21: năm cung phi theo Lập xuân (trước đây theo Tết); mốc Tết cho quái khác → ghi rõ (`moc_khac`)."""
    if ban.get("gioi_tinh") not in ("nam", "nu") or kia.get("gioi_tinh") not in ("nam", "nu"):
        return None
    qb, nb_bt, kb_, gb = _quai_mot(ban, "bạn")
    qk, nk_bt, kk_, gk = _quai_mot(kia, "người ấy")
    dn = pt.bang_huong(qb)[pt.QUAI[qk][1]]
    nb, nk = pt.nhom(qb), pt.nhom(qk)
    nam = lambda n: L("tv2.hn.cp.nam", ", năm Bát trạch {n}", n=n) if n else ""  # noqa: E731
    can_cu = [L("tv2.hn.cp.can_cu", "Cung phi Bát trạch (năm tính từ Lập xuân): bạn {qb} ({nb}{nam_b}), người ấy {qk} "
                "({nk}{nam_k}) → {dn}", qb=_ten.ten("quai", qb), nb=_ten.ten("nhom_trach", nb), nam_b=nam(nb_bt),
                qk=_ten.ten("quai", qk), nk=_ten.ten("nhom_trach", nk), nam_k=nam(nk_bt), dn=_ten.ten("du_nien", dn))
              + (L("tv2.hn.cp.cung_nhom", ", cùng nhóm.") if nb == nk else L("tv2.hn.cp.khac_nhom", ", khác nhóm Đông – Tây.")),
              *gb, *gk]
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
    vai = "kia" if ai == "người ấy" else "ban"
    for x, v in tac:
        sao = f" ({ts(x['sao'])})" if x.get("sao") else ""
        hieu = (L("tv2.hn.tv.cong", "cộng {so}", so=_so(v)) if v > 0 else L("tv2.hn.tv.tru", "trừ {so}", so=_so(-v))
                if v < 0 else L("tv2.hn.tv.khong_tinh", "không tính (ngoài cung trọng tâm)"))
        xung = (L("tv2.hn.tv.chieu", ", chiếu {cung}", cung=tc(x["xung_cung"]))
                if x["hoa"] == "Kỵ" and x.get("xung_cung") else "")
        ra.append(L(f"tv2.hn.tv.dong.{vai}", "Can năm {can} của {ai}: Hoá {hoa}{sao} vào cung {cung} của {cua}{xung} — "
                    "{hieu}.", can=tcan(can), ai=ai, hoa=ten_hoa(x["hoa"]), sao=sao,
                    cung=tc(x["den_cung"]) if x.get("den_cung") else "—", cua=cua, xung=xung, hieu=hieu))
    return ra


def _mang_opt(cung: str | None) -> str | None:
    """MANG.get(cung) theo ngôn ngữ (None khi không phải cung)."""
    return mang(cung) if cung in MANG else None


def _tu_vi(quan_he: str, can_b: str, can_k: str, vao_ban: list[dict], ban_vao: list[dict] | None) -> dict:
    trong = CUNG_TRONG_TAM[quan_he]
    t1 = _tac_dong(vao_ban, trong)
    ty1 = _ty4(TV_GOC + TV_BUOC * sum(v for _, v in t1))
    can_cu = [L("tv2.hn.tv.trong_tam", "Cung trọng tâm của quan hệ {qh}: {ds}. Lộc +2, Khoa +1,5, Quyền +1, Kỵ −2 khi rơi "
                "vào cung trọng tâm; Kỵ chiếu cung trọng tâm −1.", qh=_nhan(NHAN_QUAN_HE, quan_he, "quan_he"),
                ds=", ".join(f"{tc(c)} (×{_so(w)})" for c, w in trong.items()))]
    can_cu += _dong_tu_vi(can_k, "người ấy", "bạn", t1)
    ty = ty1
    if ban_vao:
        t2 = _tac_dong(ban_vao, trong)
        ty2 = _ty4(TV_GOC + TV_BUOC * sum(v for _, v in t2))
        ty = (ty1 + ty2 + 1) // 2
        can_cu += _dong_tu_vi(can_b, "bạn", "người ấy", t2)
        can_cu.append(L("tv2.hn.tv.hai_chieu", "Hai chiều: {a}% và {b}% → lấy trung bình {c}%.", a=_so(ty1 / 100),
                        b=_so(ty2 / 100), c=_so(ty / 100)))
    # Chi tiết đời thường (chiều người ấy → bạn): mảng thuận rõ nhất, mảng cần để ý (Kỵ vào hoặc chiếu).
    tot = max(t1, key=lambda p: p[1], default=None)
    xau = min(t1, key=lambda p: p[1], default=None)
    cung_xau = None
    if xau and xau[1] < 0:
        cung_xau = xau[0].get("den_cung") if xau[0].get("den_cung") in trong else xau[0].get("xung_cung")
    return {"loai": _ket_luan(ty), "ty": ty, "can_cu": can_cu,
            "tot": _mang_opt(tot[0].get("den_cung")) if tot and tot[1] > 0 else None,
            "vuong": _mang_opt(cung_xau)}


# ------------------------------------------------------------------ ghép
def _loi(ma: str, ket: str, quan_he: str) -> tuple[str, str]:
    c = kb.cau(ma, ket, quan_he)
    return (c["y"], c["nen"]) if c else (_nhan(_Y_MAC_DINH, ket, "y_mac"), _nhan(_NEN_MAC_DINH, ket, "nen_mac"))


def _muc_tong(tong: int) -> str:
    return next(m for m, nguong in MUC_TONG.items() if tong >= nguong)


def _ap_hoc_hop(hop: list[dict], trong_so: dict | None, ca_nhan: dict | None, theo_ma: dict[str, dict]) -> list[dict]:
    """Tầng HỌC (kiểm chứng loại `hai_nguoi`, migration 0021) — cùng luật LG-ĐS (`doi_song_chung._ap_hoc`): gắn
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
    xem) — chỉ chọn/xếp hộp (`_ap_hoc_hop`), KHÔNG đổi điểm. Mã hộp: `hn.<tiêu chí>.<loại>.<quan hệ>` (khớp SQL 0021)."""
    if quan_he not in CUNG_TRONG_TAM:
        raise ValueError(L("tv2.loi.quan_he", "Quan hệ không hợp lệ: {quan_he}", quan_he=quan_he))
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
        ten = meta.get("ten") or _nhan(_TEN, ma, "ten")
        p = phan[ma]
        if p is None:
            tieu_chi.append({"ma": ma, "ten": ten, "mo_ta": meta.get("mo_ta"), "tinh": False, "diem": 0, "toi_da": 0,
                             "ty_le": None, "loai": "chua_tinh", "ket_luan": None, "nhan_ket_luan": None,
                             "giai_thich": kb.chua_tinh_cung_phi() or L("tv2.hn.chua_tinh", _CHUA_TINH_MAC_DINH),
                             "can_cu": []})
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
               "nhan_ket_luan": kb.ket_luan(ket) or _nhan(_NHAN_KL, ket, "kl"), "giai_thich": giai, "can_cu": p["can_cu"],
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
            "nhan_muc": mt.get("nhan") or _nhan(_NHAN_MUC, muc, "muc"),
            "mo_ta_muc": mt.get("mo_ta") or _nhan(_NHAN_MUC, muc, "muc") + ".",
            "tieu_chi": tieu_chi, "diem_manh": diem_manh, "can_dung_hoa": can_dung_hoa,
            "goi_y": goi[:3] if len(goi) >= 3 else [L(f"tv2.hn.goi_y_mac.{i}", x) for i, x in enumerate(_GOI_Y_MAC_DINH)],
            "loi_dan": kb.loi_dan() or L("tv2.hn.loi_dan", _LOI_DAN_MAC_DINH),
            "hai_chieu": bool(ban_vao), "nguon": kb.meta()}


# ------------------------------------------------------------------ TV-YBS đợt 4: hộp diễn giải (KHÔNG tính điểm)
# Ý Tử vi bổ sung (KB tuvi_y_bo_sung.json, `hien_thi = "hop"`) về Phu Thê / Mệnh của HAI lá số → hộp lời diễn giải đặt
# cạnh điểm. Điểm 0–100 và luật `hai_nguoi_1` không đọc phần này. Bộ lọc tĩnh: chỉ sao (toạ), sao vắng, hoá năm sinh
# toạ cung, cung vô chính diệu, độ sáng — ý có điều kiện khác (hạn, giáp, sát tinh, ghi chú chưa cơ học hoá) bỏ qua.
# Mã hộp `ds.hai.<ý>.<ai>.<quan hệ>` (loại `doi_song` của 0017 — ràng buộc SQL có sẵn, không migration mới);
# `ai` = ban | kia | hai. Mã chỉ từ dữ kiện đã tính (tên ý, vai, quan hệ) — không tên, ngày sinh, can chi.
TOI_DA_CACH_DOC = 4
QUAN_HE_DOI_LUA = ("nguoi_yeu", "vo_chong")
_DK_HO_TRO = {"sao", "sao_mot_trong", "sao_cap_mot_trong", "cung", "hoa", "khong_co", "khong_chinh_tinh", "do_sang",
              "gioi_tinh", "co_the_tinh"}
_SANG, _HAM = {"Miếu", "Vượng", "Đắc"}, {"Hãm"}
_NHAN_CDT = "Thêm một cách đọc"
_DAN_KIA = "Đọc từ phía người ấy — chữ “bạn” ở đây là người ấy:"
_CAN_CU_CDT = "Ý luận đoán của một trường phái Tử vi tam hợp hiện đại, ban biên tập viết lại. Không tính vào điểm."
_TIEU_DE_CDT = {"phu_the_trung_menh_nguoi_kia": "Người ấy gần với hình mẫu bạn đời trong lá số của bạn",
                "hai_nguoi_sat_pha_tham": "Hai người đều thích tự quyết",
                "dong_tinh_bu_nhau": "Một người mở việc, một người giữ nếp",
                "ban": "Lá số của bạn phác ra người bạn đời thế nào",
                "kia": "Lá số người ấy phác ra người bạn đời thế nào"}


def _l(x) -> list:
    return [] if x is None else [x] if isinstance(x, str) else list(x)


def _cung_ls(ls: dict | None, ten: str) -> dict | None:
    return next((c for c in (ls or {}).get("cung", []) if c["ten"] == ten), None)


def _chinh(c: dict | None) -> list[str]:
    return [s["ten"] for s in (c or {}).get("chinh_tinh", [])]


def _co_trong_cung(ls: dict, c: dict) -> set[str]:
    """Sao có mặt ở cung: chính tinh + phụ tinh + "Hoá X" (tứ hoá năm sinh toạ cung)."""
    hoa = {f"Hoá {h['hoa']}" for h in ls.get("tu_hoa", []) if h.get("cung") == c["ten"]}
    hoa |= {f"Hoá {s['tu_hoa']}" for s in c.get("chinh_tinh", []) if s.get("tu_hoa")}
    return set(_chinh(c)) | set(c.get("phu_tinh", [])) | hoa


def _khop_phu_the(m: dict, ls: dict, gioi_tinh: str | None) -> list[str] | None:
    """Ý Phu Thê khớp lá `ls` → danh sách sao làm căn cứ; không khớp / điều kiện không xét được → None."""
    dk = m["dieu_kien"]
    if set(dk) - _DK_HO_TRO or "Phu Thê" not in _l(dk.get("cung")):
        return None
    if dk.get("gioi_tinh") and dk["gioi_tinh"] != gioi_tinh:
        return None
    c = _cung_ls(ls, "Phu Thê")
    if c is None:
        return None
    co = _co_trong_cung(ls, c)
    sao, mot = _l(dk.get("sao")), _l(dk.get("sao_mot_trong"))
    cap = [p for p in dk.get("sao_cap_mot_trong") or [] if set(p) <= co]
    if (sao and not set(sao) <= co) or (mot and not set(mot) & co) or (dk.get("sao_cap_mot_trong") and not cap):
        return None
    if dk.get("hoa") and f"Hoá {dk['hoa']}" not in co:
        return None
    if set(_l(dk.get("khong_co"))) & co or (dk.get("khong_chinh_tinh") and _chinh(c)):
        return None
    if dk.get("do_sang") in ("sang", "ham"):
        nhom = _SANG if dk["do_sang"] == "sang" else _HAM
        if not all(s.get("do_sang") in nhom for s in c["chinh_tinh"] if s["ten"] in sao):
            return None
    if not (sao or mot or cap or dk.get("hoa") or dk.get("khong_chinh_tinh")):
        return None                                   # chỉ "cung Phu Thê" chung chung → không đủ để nói riêng lá này
    can = sao + [s for s in mot if s in co] + [s for p in cap for s in p] + ([f"Hoá {dk['hoa']}"] if dk.get("hoa") else [])
    return list(dict.fromkeys(can)) or ["không có chính tinh"]


def _nhom_menh(ls: dict | None) -> set[str]:
    from app.kb import tuvi_kb
    return {(tuvi_kb.chinh_tinh(s) or {}).get("nhom") for s in _chinh(_cung_ls(ls, "Mệnh"))} - {None}


def _hop_cdt(m: dict, ai: str, quan_he: str, can_cu: str) -> dict:
    ma = m["id"].rsplit(".", 1)[1]
    khoa = ma if ai == "hai" else ai
    return {"loai": "loi_khuyen", "nhan": kb.cach_doc_them("nhan") or L("tv2.hn.cdt.nhan", _NHAN_CDT),
            "tieu_de": kb.cach_doc_them(f"tieu_de.{khoa}") or L(f"tv2.hn.cdt.tieu_de.{khoa}", _TIEU_DE_CDT[khoa]),
            # ý Phu Thê của lá người ấy: lời ngôi thứ ba viết riêng (`loi_nguoi_ay` — review CY-1: không tả thẳng một nét
            # xấu của người thứ ba, nói như nhịp giữa hai người); KB thiếu thì giữ lời dẫn cũ
            "noi_dung": ((m.get("loi_nguoi_ay")
                          or f"{kb.cach_doc_them('dan_kia') or L('tv2.hn.cdt.dan_kia', _DAN_KIA)} {m['loi_doi_thuong']}")
                         if ai == "kia" else m["loi_doi_thuong"]),
            "huong_xu_ly": (m.get("viec_nguoi_ay") or m["viec_nen_lam"]) if ai == "kia" else m["viec_nen_lam"],
            "can_cu": [can_cu, kb.cach_doc_them("can_cu_chung") or L("tv2.hn.cdt.can_cu", _CAN_CU_CDT)],
            "ma_mau": f"ds.hai.{ma}.{ai}.{quan_he}", "phai": m["school_id"]}


_NHOM_MA = {"Tử Phủ Vũ Tướng": "tu_phu_vu_tuong", "Cơ Nguyệt Đồng Lương": "co_nguyet_dong_luong", "Cự Nhật": "cu_nhat",
            "Sát Phá Tham": "sat_pha_tham"}


def _nhom_t(nhom: str) -> str:
    """Tên nhóm chính tinh (tuvi_kb `nhom`) theo ngôn ngữ."""
    return L(f"tv2.hn.nhom.{_NHOM_MA[nhom]}", nhom) if nhom in _NHOM_MA else nhom


def _sao_t(x: str) -> str:
    """Căn cứ sao của ý Phu Thê: tên sao, "Hoá X" (tứ hoá năm sinh), "không có chính tinh" → theo ngôn ngữ."""
    if x.startswith("Hoá ") and x[4:] in ("Lộc", "Quyền", "Khoa", "Kỵ"):
        return L("tv2.hn.hoa_sao", x, hoa=ten_hoa(x[4:]))
    if x == "không có chính tinh":
        return L("tv2.hn.khong_chinh_tinh", x)
    return ts(x)


def cach_doc_them(ls_ban: dict, ls_kia: dict | None, quan_he: str, gioi_ban: str | None = None,
                  gioi_kia: str | None = None) -> list[dict]:
    """Hộp diễn giải (≤ 4): ý hai lá số trước (cần đủ lá người kia), rồi một ý Phu Thê của bạn, một của người ấy —
    ý Phu Thê chỉ cho người yêu / vợ chồng. Thứ tự ý theo KB. Không đọc, không đổi điểm."""
    from app.kb import tuvi_y_bo_sung as ybs
    y = ybs.theo_loai("hon_nhan", hien_thi="hop")
    ra: list[dict] = []
    if ls_kia is not None:
        pt_ban, menh_kia = _chinh(_cung_ls(ls_ban, "Phu Thê")), _chinh(_cung_ls(ls_kia, "Mệnh"))
        nb, nk = _nhom_menh(ls_ban), _nhom_menh(ls_kia)
        for m in (x for x in y if x["dieu_kien"].get("hai_nguoi")):
            ma, dk = m["id"].rsplit(".", 1)[1], m["dieu_kien"]
            if ma == "phu_the_trung_menh_nguoi_kia":
                chung = [s for s in pt_ban if s in menh_kia]
                if chung and quan_he in QUAN_HE_DOI_LUA:
                    ra.append(_hop_cdt(m, "hai", quan_he, L(
                        "tv2.hn.cdt.cc_trung", "Chính tinh cung Phu Thê của bạn ({pt}) có {chung} — cũng là chính tinh "
                        "cung Mệnh của người ấy.", pt=", ".join(ts(x) for x in pt_ban), chung=", ".join(ts(x) for x in chung))))
            elif dk.get("nhom_ca_hai"):
                if dk["nhom_ca_hai"] in nb and dk["nhom_ca_hai"] in nk:
                    ra.append(_hop_cdt(m, "hai", quan_he, L("tv2.hn.cdt.cc_ca_hai", "Cung Mệnh của cả hai người có sao "
                                                            "nhóm {nhom}.", nhom=_nhom_t(dk["nhom_ca_hai"]))))
            elif isinstance(dk.get("nhom"), list) and len(dk["nhom"]) == 2:
                a, b = dk["nhom"]
                if (a in nb and b in nk and b not in nb) or (b in nb and a in nk and a not in nb):
                    ra.append(_hop_cdt(m, "hai", quan_he, L("tv2.hn.cdt.cc_hai_nhom", "Cung Mệnh một người thuộc nhóm "
                                                            "{a}, người kia thuộc nhóm {b} — hai nhịp khác nhau.",
                                                            a=_nhom_t(a), b=_nhom_t(b))))
    if quan_he in QUAN_HE_DOI_LUA:
        for ai, ls, gt in (("ban", ls_ban, gioi_ban), ("kia", ls_kia, gioi_kia)):
            if ls is None:
                continue
            for m in y:
                if (sao := _khop_phu_the(m, ls, gt)) is not None:
                    ra.append(_hop_cdt(m, ai, quan_he, L(f"tv2.hn.cdt.cc_phu_the.{ai}", "Cung Phu Thê của {ai} có {ds}.",
                                                         ai="bạn" if ai == "ban" else "người ấy",
                                                         ds=", ".join(_sao_t(x) for x in sao))))
                    break
    return ra[:TOI_DA_CACH_DOC]
