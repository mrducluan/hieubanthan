# -*- coding: utf-8 -*-
"""Chặng 1 (nâng cấp sau rà soát thực nghiệm) — RULES tất định cho 4 Mạch Gỡ Nút Đời Sống (`go_nut_doi_song`).

Tuân thủ nghiêm ngặt kiến trúc 5 tầng:
  - Mọi câu chữ / khuôn lời nằm trọn trong `go_nut_doi_song_kb.json` (+ `en/go_nut_doi_song_kb.json`), `tuvi_kb.json` và
    `battu_kb.json` — tầng RULES chỉ kiểm điều kiện lá số và điền dữ kiện đã tính.
  - Cổng định tuyến chặt: CHỈ chạy trên câu hỏi cá nhân của chính người xem (đủ giờ sinh thật, không `nguoi_than`, không
    phải câu kiến thức `kien_thuc`, không phải câu hai tuổi hay câu kể chuyện của người thứ ba).
  - Gắn trực tiếp dữ kiện ĐÃ TÍNH của lá số (`du_kien_la_so`):
    * `go_loi_phan_doa`: kiểm tra lá số thật của người hỏi có thực sự mang cấu trúc đang lo lắng (Vô Chính Diệu kèm sao
      xung chiếu mượn về, Địa Không/Địa Kiếp tại cung nào, chính tinh Thất Sát/Phá Quân/Liêm Trinh/Cự Môn/Tham Lang kèm
      độ sáng thật từ `tuvi_kb`, hoặc Thương Quan/Thất Sát/Kiếp Tài tại trụ nào từ `battu_kb`). Lá số không có -> bỏ qua.
    * `sau_do_vo`, `khac_khau_vo_chong`, `gop_von_phan_vai`: nối trực tiếp hộp hoá giải (`phat_huy`, `can_sua`, `canh_bao`)
      và nhận định chương `tinh_cam` / `quan_he` từ báo cáo đời sống thật của chính lá số người xem.
"""
from __future__ import annotations

import re
from typing import Callable

from app import ngon_ngu
from app.hoidap import chung, hieu_cau, luan_hoi_khop as lhk
from app.kb import battu_kb, nap, ten as _ten, tuvi_kb

_TEP = "go_nut_doi_song_kb.json"
_LOAI_CA_NHAN = {
    "tuvi": ("la_so", "han", "sat_tinh_la_so", "cach_cuc_la_so", "hop_hon"),
    "battu": ("la_so", "van", "hop"),
}
_CHI_DOI = {
    "Tý": "Ngọ", "Ngọ": "Tý", "Sửu": "Mùi", "Mùi": "Sửu", "Dần": "Thân", "Thân": "Dần",
    "Mão": "Dậu", "Dậu": "Mão", "Thìn": "Tuất", "Tuất": "Thìn", "Tỵ": "Hợi", "Hợi": "Tỵ",
}
_TRU_MA = ("năm", "tháng", "ngày", "giờ")
_TRU_EN = ("Year Pillar", "Month Pillar", "Day Pillar", "Hour Pillar")

_BOI_CANH_LO_DOA = re.compile(
    r"\b(xau|nang|so|lo|kho|lan dan|co doc|sat phu|sat the|thay|nghe noi|nguoi ta bao|phan|doa"
    r"|cua toi|cua minh|cua em|menh toi|menh minh|menh em|la so toi|la so minh|la so em"
    r"|bad|harsh|feared|cursed|worried|my chart|my palace)\b"
)

_MAU_3_DOI_SONG: list[tuple[str, list[str]]] = [
    ("sau_do_vo", [
        r"sau (khi )?(ly hon|ly di|chia tay|do vo|dut ganh)",
        r"(da |tung |vua |moi )(ly hon|ly di|do vo|qua mot lan do)",
        r"(tai hon|buoc nua|mo long lai|bat dau lai chuyen tinh)",
        r"\b(after (my |a )?(divorce|breakup)|remarry|open up again)\b",
    ]),
    ("khac_khau_vo_chong", [
        r"(vo chong|hai dua|nha toi|gia dao) .{0,25}(khac khau|hay cai|cai nhau|luc duc|lanh nhat|bat hoa|cang thang)",
        r"(khac khau|luc duc) .{0,20}(vo chong|gia dinh)",
        r"\b(husband|wife|spouse|partner|marriage).{0,25}(argue|clash|fight|friction)\b",
    ]),
    ("gop_von_phan_vai", [
        r"(hun von|gop von|chung von|lam an chung|mo chung|co[ -]?founder|chia co phan)",
        r"\b(pool capital|co[ -]?founder|business partner|joint venture)\b",
    ]),
]

_SAO_GIAI_OAN_TV = [
    ("Thất Sát", [r"\bthat sat\b", r"\bseven killings\b"]),
    ("Phá Quân", [r"\bpha quan\b", r"\barmy breaker\b"]),
    ("Liêm Trinh", [r"\bliem trinh\b"]),
    ("Cự Môn", [r"\bcu mon\b"]),
    ("Tham Lang", [r"\btham lang\b"]),
]
_THAP_THAN_GIAI_OAN_BT = [
    ("Thương Quan", [r"\bthuong quan\b", r"\bhurting officer\b"]),
    ("Thất Sát", [r"\bthat sat\b", r"\bseven killings\b"]),
    ("Kiếp Tài", [r"\bkiep tai\b", r"\brob wealth\b"]),
]


def _kb() -> dict:
    return nap.doc(_TEP)


def _tc(cung: str) -> str:
    return cung if ngon_ngu.la_viet() else _ten.ten("cung", cung)


def _tchi(chi: str) -> str:
    return chi if ngon_ngu.la_viet() else _ten.ten("chi", chi)


def _tsao(sao: str) -> str:
    return sao if ngon_ngu.la_viet() else _ten.ten("sao", sao)


def _giai_oan_tuvi(gop: str, ls: dict, pl: dict, mau: dict) -> dict | None:
    cung_list = ls.get("cung") or []
    if not cung_list:
        return None
    theo_ten = {c["ten"]: c for c in cung_list}
    theo_chi = {c["chi"]: c for c in cung_list}
    cung_uu_tien = list(dict.fromkeys([*(pl.get("cung") or []), "Mệnh", "Phu Thê", "Quan Lộc", "Tài Bạch"]))
    vi = ngon_ngu.la_viet()

    if chung.co(gop, [r"vo chinh dieu", r"empty palace"]):
        cung_kiem = pl.get("cung") or ["Mệnh"]
        c_vcd = next((theo_ten[ten] for ten in cung_kiem if ten in theo_ten and not theo_ten[ten].get("chinh_tinh")), None)
        if not c_vcd:
            return None
        chi_xung = _CHI_DOI.get(c_vcd["chi"], "")
        c_doi = theo_chi.get(chi_xung)
        sao_muon = [s["ten"] for s in (c_doi or {}).get("chinh_tinh", [])]
        muon_str = ", ".join(_tsao(s) for s in sao_muon) if sao_muon else mau["vcd_khong_sao"]
        diem_sang = ""
        if vi and sao_muon:
            info = tuvi_kb.chinh_tinh(sao_muon[0]) or {}
            if info.get("diem_manh") and mau.get("vcd_diem_manh"):
                diem_sang = mau["vcd_diem_manh"].format(sao=sao_muon[0], diem_manh=info["diem_manh"])
        ten_doi = _tc(c_doi["ten"]) if c_doi else _tchi(chi_xung)
        return {
            "du_kien_la_so": mau["vcd_du_kien"].format(cung=_tc(c_vcd["ten"]), chi=_tchi(c_vcd["chi"]), cung_doi=ten_doi, sao_muon=muon_str),
            "goc_nhin_rieng": mau["vcd_goc_nhin"].format(cung=_tc(c_vcd["ten"]), sao_muon=muon_str, diem_sang=diem_sang),
            "viec_them": [],
        }

    if chung.co(gop, [r"khong kiep", r"dia khong", r"dia kiep", r"sky void", r"earth robbery"]):
        co_kk = []
        for ten_c in cung_uu_tien:
            c = theo_ten.get(ten_c)
            if c:
                kk = [s for s in c.get("phu_tinh", []) if s in ("Địa Không", "Địa Kiếp")]
                if kk:
                    co_kk.append((ten_c, c["chi"], kk))
        if not co_kk:
            return None
        ten_c, chi_c, kk = co_kk[0]
        sao_str = ", ".join(_tsao(s) for s in kk)
        p_info = (tuvi_kb.phu_tinh(kk[0]) or {}) if vi else {}
        return {
            "du_kien_la_so": mau["kk_du_kien"].format(sao=sao_str, cung=_tc(ten_c), chi=_tchi(chi_c)),
            "goc_nhin_rieng": mau["kk_goc_nhin"].format(
                cung=_tc(ten_c),
                sao=sao_str,
                diem_manh=p_info.get("diem_manh") or mau["kk_diem_manh_mac_dinh"],
                mat_toi=p_info.get("mat_toi") or mau["kk_mat_toi_mac_dinh"],
            ),
            "viec_them": [],
        }

    for ten_sao, mau_sao in _SAO_GIAI_OAN_TV:
        if not chung.co(gop, mau_sao):
            continue
        tim = None
        for ten_c in cung_uu_tien + [c["ten"] for c in cung_list]:
            c = theo_ten.get(ten_c)
            if c:
                st = next((s for s in c.get("chinh_tinh", []) if s["ten"] == ten_sao), None)
                if st:
                    tim = (ten_c, c["chi"], st.get("do_sang") or "")
                    break
        if not tim:
            return None
        ten_c, chi_c, do_sang = tim
        info = (tuvi_kb.chinh_tinh(ten_sao) or {}) if vi else {}
        ds_txt = f" ({do_sang})" if (vi and do_sang) else ""
        chi_tiet = (info.get("khi_sang") if do_sang in ("Miếu", "Vượng", "Đắc") else info.get("khi_ham") or "") if vi else ""
        goc_nhin = mau["sao_goc_nhin"].format(
            sao=_tsao(ten_sao),
            cung=_tc(ten_c),
            diem_manh=info.get("diem_manh") or "",
            mat_toi=info.get("mat_toi") or "",
            chi_tiet=chi_tiet,
        ).strip()
        viec_them = [mau["sao_tu_soi"].format(sao=_tsao(ten_sao), cau_tu_soi=info["cau_tu_soi"])] if (vi and info.get("cau_tu_soi")) else []
        return {
            "du_kien_la_so": mau["sao_du_kien"].format(sao=_tsao(ten_sao), do_sang=ds_txt, cung=_tc(ten_c), chi=_tchi(chi_c)),
            "goc_nhin_rieng": goc_nhin,
            "viec_them": viec_them,
        }
    return None


def _giai_oan_battu(gop: str, ls: dict, mau: dict) -> dict | None:
    vi = ngon_ngu.la_viet()
    tt_can = list(ls.get("thap_than_can") or [])
    tt_tang = [x for nhom in (ls.get("tang_can_thap_than") or []) for x in (nhom if isinstance(nhom, list) else [])]

    for ten_tt, mau_tt in _THAP_THAN_GIAI_OAN_BT:
        if not chung.co(gop, mau_tt):
            continue
        vi_tri_can = [i for i, x in enumerate(tt_can) if x == ten_tt and i < 4]
        if not vi_tri_can and ten_tt not in tt_tang:
            return None
        info = (battu_kb.thap_than(ten_tt) or {}) if vi else {}
        ten_hien = ten_tt if vi else _ten.ten("thap_than", ten_tt)
        if vi_tri_can:
            vt_str = ", ".join((f"trụ {_TRU_MA[i]}" if vi else _TRU_EN[i]) for i in vi_tri_can)
        else:
            vt_str = mau["tt_tang_can"]
        goc_nhin = mau["tt_goc_nhin"].format(
            ten_tt=ten_hien,
            y_nghia=info.get("y_nghia") or "",
            diem_manh=info.get("tinh_cach") or "",
            mat_toi=info.get("khi_nhieu") or "",
        ).strip()
        viec_them = [mau["tt_tu_soi"].format(cau_tu_soi=info["cau_tu_soi"])] if (vi and info.get("cau_tu_soi")) else []
        return {
            "du_kien_la_so": mau["tt_du_kien"].format(ten_tt=ten_hien, vi_tri=vt_str),
            "goc_nhin_rieng": goc_nhin,
            "viec_them": viec_them,
        }
    return None


def _rut_tu_bao_cao(ma: str, bc: dict | None, mau: dict) -> tuple[str, list[str]]:
    if not bc:
        return "", []
    ch_dich = "quan_he" if ma == "gop_von_phan_vai" else "tinh_cam"
    c = next((x for x in bc.get("chuong", []) if x.get("ma") == ch_dich), None)
    if not c:
        return "", []

    vi = ngon_ngu.la_viet()
    viec: list[str] = []
    du_kien = ""

    lh = c.get("luan_hoi") or {}
    if vi and lh:
        hg = lh.get("hoa_giai") or {}
        for khoa in ("phat_huy", "can_sua", "canh_bao"):
            val = hg.get(khoa)
            if isinstance(val, str) and val:
                viec.append(val)
            elif isinstance(val, list):
                viec.extend(x for x in val if isinstance(x, str) and x)
        ds_tl = lh.get("tra_loi") or []
        if ma == "gop_von_phan_vai":
            tl_lac = next((t for t in ds_tl if t.get("ma") == "lam_an_chung"), None)
            if tl_lac and tl_lac.get("tra_loi"):
                du_kien = mau["bc_gop_von"].format(ten_chuong=c.get("tieu_de", ""), tra_loi=tl_lac["tra_loi"])
        elif ma == "sau_do_vo":
            tl_ben = next((t for t in ds_tl if t.get("ma") == "ben"), None)
            if tl_ben and tl_ben.get("giai_thich"):
                du_kien = mau["bc_sau_do_vo"].format(ten_chuong=c.get("tieu_de", ""), giai_thich=tl_ben["giai_thich"])
        elif ma == "khac_khau_vo_chong":
            nguoi = (lh.get("nguoi") or [None])[0]
            if isinstance(nguoi, dict) and nguoi.get("song_cung"):
                du_kien = mau["bc_khac_khau"].format(song_cung=nguoi["song_cung"])

    if not du_kien:
        hop0 = next((h for h in (c.get("hop") or []) if h.get("tieu_de")), None)
        if hop0:
            du_kien = f"{c.get('tieu_de', '')}: {hop0['tieu_de']}".strip(": ")
            if isinstance(hop0.get("huong_xu_ly"), str) and hop0["huong_xu_ly"]:
                viec.insert(0, hop0["huong_xu_ly"])
    dedup = list(dict.fromkeys(x for x in viec if isinstance(x, str) and x))
    return du_kien, dedup[:3]


def gan_vao_hoi(
    kq: dict,
    *,
    pl: dict,
    cau_hoi: str,
    mo_dun: str = "tuvi",
    ls: dict | None = None,
    sinh: dict | None = None,
    bc_ds: dict | None = None,
    dung_bc: Callable[[], dict | None] | None = None,
    nguoi_than: bool = False,
) -> None:
    """Gắn `go_nut_doi_song` dựa trên dữ kiện ĐÃ TÍNH của chính lá số người hỏi."""
    if not ls or not sinh or nguoi_than or sinh.get("gio_tam"):
        return
    if pl.get("xu_ly") in chung.DAC_BIET:
        return
    ct = kq.get("can_them") or []
    if any(x != "la_so_nguoi_kia" for x in ct):
        return
    loai_ok = _LOAI_CA_NHAN.get(mo_dun, ("la_so", "han", "van"))
    if pl.get("loai") not in loai_ok:
        return

    t_norm = re.sub(r"\s+", " ", (pl.get("cau_chuan_hoa") or "")).strip()
    goc_norm = re.sub(r"\s+", " ", chung.chuan_hoa_cau(cau_hoi or "")).strip()
    if hieu_cau.kieu(t_norm or goc_norm) == "kien_thuc":
        return
    if lhk.la_hai_nguoi_hoac_nguoi_khac(t_norm, goc_norm):
        return

    gop = re.sub(r"\s+", " ", f"{goc_norm} {t_norm} {(cau_hoi or '').lower()}").strip()
    k = _kb()
    kb_mach = k.get("mach") or {}
    mau = k.get("mau_la_so") or {}

    if _BOI_CANH_LO_DOA.search(gop) and pl.get("loai") not in ("hop", "hop_hon"):
        go = _giai_oan_tuvi(gop, ls, pl, mau) if mo_dun == "tuvi" else _giai_oan_battu(gop, ls, mau)
        if go and kb_mach.get("go_loi_phan_doa"):
            m = kb_mach["go_loi_phan_doa"]
            viec = list(dict.fromkeys([*go["viec_them"], *list(m["viec_thuc_te"])]))[:3]
            kq["go_nut_doi_song"] = {
                "ma": "go_loi_phan_doa",
                "tieu_de": m["tieu_de"],
                "du_kien_la_so": go["du_kien_la_so"],
                "goc_nhin_hai_mat": f"{go['goc_nhin_rieng']} {m['goc_nhin_hai_mat']}".strip(),
                "viec_thuc_te": viec,
            }
            return

    for ma, ds_mau in _MAU_3_DOI_SONG:
        if chung.co(gop, ds_mau) and kb_mach.get(ma):
            m = kb_mach[ma]
            bc = bc_ds or (dung_bc() if dung_bc else None)
            du_kien, viec_la_so = _rut_tu_bao_cao(ma, bc, mau)
            if not du_kien:
                return
            viec = list(dict.fromkeys([*viec_la_so, *list(m["viec_thuc_te"])]))[:3]
            kq["go_nut_doi_song"] = {
                "ma": ma,
                "tieu_de": m["tieu_de"],
                "du_kien_la_so": du_kien,
                "goc_nhin_hai_mat": m["goc_nhin_hai_mat"],
                "viec_thuc_te": viec,
            }
            return
