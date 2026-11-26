# -*- coding: utf-8 -*-
"""TV-BD1 — RULES "Bản đồ 12 cung Tử vi" (`POST /v1/tuvi/ban-do`). Tất định 100%, một bộ tính, không LLM, không DB.

Nguyên tắc:
- Một lượt gọi pool `iztro` (`tuvi_an_sao.nap_truoc_sinh`), chỉ ĐỌC kết quả đã kiểm chứng:
  * Mức 12 cung (`muc`): đọc thẳng `tuvi_doi_song.cham_cung(ls)` — một nguồn duy nhất với bài đọc đời thường.
  * Đại hạn 0–90 tuổi: đọc `tuvi_doi_song.thoi_gian_bieu`.
  * Mười năm tới: đọc `tuvi_doi_song.dong_muoi_nam` — một nguồn duy nhất với chương Vận hạn.
  * Đường bay tứ hoá + chuỗi chuyển Kỵ 2 chặng (`A -> B -> C`): đọc `calc.tuvi_phi_hoa` + `luangiai.tuvi_phi_hoa`.
- Khoá SAO-2 chặt ở phía máy chủ: CHỈ `nam == nam_xem` có `y`, `nen_tranh`, `nen_lam`; mọi năm tương lai (`nam > nam_xem`)
  chỉ mang mức + `khoa: True` (không gửi nội dung năm tương lai xuống trình duyệt).
- Cổng TUOI-16 (`config.TUOI_NGUOI_LON = 16`): người dưới 16 tuổi nhận `nguoi_lon: False`, cung Phu Thê / Tử Nữ dùng lời
  phù hợp lứa tuổi (không nói vợ chồng / hôn nhân / bạn đời), không dẫn sang chương tình yêu hôn nhân.
"""
from __future__ import annotations

import datetime as dt
import re
import unicodedata

from app import config
from app.calc import can_chi, lunar, tuan_triet_vendor, tuvi_an_sao as az
from app.calc import tuvi_phi_hoa as phi_calc
from app.hoidap.tuvi import tom_tat
from app.kb import nap
from app.kb import ten as _ten
from app.kb import tuvi_doi_song_kb as kb_ds
from app.kb.loi import danh_sach
from app.luangiai import hoan_canh
from app.luangiai import tuvi_doi_song as tvds
from app.luangiai import tuvi_phi_hoa as phl

PHIEN_BAN = "tuvi_ban_do_1"
_TEP = "tuvi_ban_do_kb.json"
BAY_MOI_O = 4
NAM_MOI_O = 4

MA_CUNG: dict[str, str] = dict(phl.MA_CUNG)
TEN_TU_MA: dict[str, str] = {v: k for k, v in MA_CUNG.items()}
CHI_HANH: dict[str, str] = {
    "Tý": "Thủy", "Sửu": "Thổ", "Dần": "Mộc", "Mão": "Mộc",
    "Thìn": "Thổ", "Tỵ": "Hỏa", "Ngọ": "Hỏa", "Mùi": "Thổ",
    "Thân": "Kim", "Dậu": "Kim", "Tuất": "Thổ", "Hợi": "Thủy",
}
CHUONG_CUNG: dict[str, str] = {
    "menh": "tong_quan",
    "phuc_duc": "tong_quan",
    "quan_loc": "su_nghiep",
    "tai_bach": "tien_bac",
    "dien_trach": "nha_cua",
    "phu_the": "tinh_cam",
    "phu_mau": "gia_dinh",
    "huynh_de": "gia_dinh",
    "tu_nu": "gia_dinh",
    "tat_ach": "suc_khoe",
    "no_boc": "quan_he",
    "thien_di": "quan_he",
}
_MENH_CUC_MA = {
    "Cục sinh Mệnh": "cuc_sinh_menh",
    "Mệnh sinh Cục": "menh_sinh_cuc",
    "Mệnh khắc Cục": "menh_khac_cuc",
    "Cục khắc Mệnh": "cuc_khac_menh",
    "Mệnh Cục bình hoà": "binh_hoa",
}
_UU_TIEN_CHAM = ("luu_nien", "ky_nam", "loc_nam", "quyen_nam", "khoa_nam", "ky_xung")
_HOA_CHAM = {"Lộc": "loc_nam", "Quyền": "quyen_nam", "Khoa": "khoa_nam", "Kỵ": "ky_nam"}
_HOA_TRONG = {"Lộc": 4, "Kỵ": 4, "Quyền": 2, "Khoa": 2}
_CUNG_CHINH_MA = {"menh", "quan_loc", "tai_bach", "phu_the", "dien_trach"}


@nap.nho
def _kb() -> dict:
    try:
        d = nap.doc(_TEP)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _k(*khoa: str):
    x = _kb()
    for k in khoa:
        if not isinstance(x, dict):
            return None
        x = x.get(k)
    return x


def _m(*khoa: str) -> str:
    x = _k("mau", *khoa)
    return x if isinstance(x, str) else ""


def meta() -> dict:
    d = _kb()
    return {
        "trang_thai": d.get("trang_thai", "nhap_ai"),
        "source_id": d.get("source_id", "tuvi_ban_do"),
        "school_id": d.get("school_id", "nam_phai_viet"),
    }


def loi_can_gio() -> str:
    return str(_k("can_gio") or "Cần giờ sinh để lập Bản đồ 12 cung Tử vi")


def _t(nhom: str, v: str) -> str:
    return _ten.ten(nhom, v)


def _tds(ds: str | None) -> str:
    if not ds:
        return ""
    if _ten.muc("do_sang", ds) or ds != "Hãm":
        return _ten.ten("do_sang", ds)
    return ds if _ten.ten("do_sang", "Hạn") == "Hạn" else _ten.ten("do_sang", "Hạn")


def _hoa_dau(s: str) -> str:
    return s[:1].upper() + s[1:] if s else s


def _ma_chu(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not 0x300 <= ord(c) <= 0x36F).replace("đ", "d").replace("Đ", "d").lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def _ma_phi_hoa(loai: str, d: dict) -> str:
    den = "tu" if d["tu_hoa"] else _ma_chu(d["den_cung"] or "khong")
    return ".".join([_ma_chu(loai), _ma_chu(d["tu_cung"]), _ma_chu(d["hoa"]), den])


def _nhan_muc(muc: str) -> str:
    return kb_ds.nhan_muc(muc) or str(_k("nhan_muc", muc) or muc)


def _muc_thuong(muc: str) -> str:
    return str(_k("muc_thuong", muc) or _nhan_muc(muc).lower())


def _cung_kb(ma: str) -> dict:
    return _k("cung", ma) or {}


def _ngan(ma: str, lon: bool) -> str:
    ck = _cung_kb(ma)
    return str((ck.get("ngan") if lon else ck.get("ngan_tre") or ck.get("ngan")) or ma)


def _y_cung(ma: str, lon: bool) -> str:
    ck = _cung_kb(ma)
    return str((ck.get("y") if lon else ck.get("y_tre") or ck.get("y")) or ma)


def _chu_de_han(ma: str, lon: bool) -> str:
    ck = _cung_kb(ma)
    return str((ck.get("chu_de_han") if lon else ck.get("chu_de_han_tre") or ck.get("chu_de_han")) or _ngan(ma, lon))


def _chuong(ma: str, lon: bool) -> str:
    if ma == "phu_the" and not lon:
        return "quan_he"
    return CHUONG_CUNG.get(ma, "tong_quan")


def _y_hoa(hoa: str) -> str:
    return str(_k("y_hoa", hoa) or hoa)


def _y_hoa_ngan(hoa: str) -> str:
    return str(_k("y_hoa_ngan", hoa) or hoa)


def _cham_cua_nam(cung_ln_ma: str, hoa_nam: list[dict]) -> list[dict]:
    """Thứ tự ưu tiên chạm cung trong một năm (mỗi cung tối đa 1 nhãn chính để vẽ rõ trên bánh xe)."""
    ra: dict[str, str] = {cung_ln_ma: "luu_nien"}
    for h in hoa_nam:
        loai = _HOA_CHAM.get(h["hoa"])
        den = h["den"]
        if loai and den:
            if den not in ra or _UU_TIEN_CHAM.index(loai) < _UU_TIEN_CHAM.index(ra[den]):
                ra[den] = loai
        if h["hoa"] == "Kỵ" and h["xung"]:
            xung = h["xung"]
            if xung not in ra:
                ra[xung] = "ky_xung"
    return [{"o": ma, "loai": l} for ma, l in sorted(ra.items(), key=lambda x: (_UU_TIEN_CHAM.index(x[1]), x[0]))]


def _luan_chuoi_chuyen_ky(cung: list[dict], lon: bool) -> list[dict]:
    ra: list[dict] = []
    for ch in phi_calc.chuoi_chuyen_ky(cung):
        ma_tu = MA_CUNG[ch["tu_cung"]]
        ma_qua = MA_CUNG[ch["qua_cung"]]
        ma_den = MA_CUNG[ch["den_cung"]]
        ma_xung = MA_CUNG[ch["xung_cung"]] if ch.get("xung_cung") in MA_CUNG else None
        tat = "kck" if ch["loai"] == "ky_chuyen_ky" else "lck"
        ma_mau = f"ds.duong_bay.{tat}.{ma_tu}+{ma_qua}+{ma_den}"
        mk = _k("mau", "chuoi", tat) or {}
        ngan_tu = _ngan(ma_tu, lon)
        ngan_qua = _ngan(ma_qua, lon)
        ngan_den = _ngan(ma_den, lon)
        bien = {
            "A_tu": _hoa_dau(ngan_tu),
            "ngan_tu": ngan_tu,
            "ngan_qua": ngan_qua,
            "ngan_den": ngan_den,
            "tu": _t("cung", ch["tu_cung"]),
            "qua": _t("cung", ch["qua_cung"]),
            "den": _t("cung", ch["den_cung"]),
            "can_dau": _t("can", ch["can_dau"]),
            "can_chuyen": _t("can", ch["can_chuyen"]),
            "sao_dau": _t("sao", ch["sao_dau"]),
            "sao_chuyen": _t("sao", ch["sao_chuyen"]),
        }
        ra.append({
            "loai": ch["loai"],
            "phai": ch["phai"],
            "ma_mau": ma_mau,
            "tu": ma_tu,
            "qua": ma_qua,
            "den": ma_den,
            "xung": ma_xung,
            "can_dau": ch["can_dau"],
            "can_chuyen": ch["can_chuyen"],
            "hoa_dau": ch["hoa_dau"],
            "sao_dau": ch["sao_dau"],
            "sao_chuyen": ch["sao_chuyen"],
            "tieu_de": str(mk.get("tieu_de") or "").format(**bien),
            "nghia": str(mk.get("nghia") or "").format(**bien),
            "viec_nen_lam": str(mk.get("viec_nen_lam") or "").format(**bien),
            "can_cu": [str(mk.get("can_cu") or "").format(**bien)],
        })
    return ra


def _bay_cua_cung(ten: str, ma: str, duong_all: list[dict], lon: bool) -> list[dict]:
    ung: list[tuple[int, int, dict]] = []
    for idx, d in enumerate(duong_all):
        if not d.get("den_cung"):
            continue
        tu_ma = MA_CUNG[d["tu_cung"]]
        den_ma = MA_CUNG[d["den_cung"]]
        hoa = d["hoa"]
        if d["tu_hoa"] and tu_ma == ma:
            cau = _m("bay_cung", "tu_hoa").format(ngan=_ngan(ma, lon), y_hoa_ngan=_y_hoa_ngan(hoa))
            ung.append((10 + _HOA_TRONG.get(hoa, 1), -idx, {
                "chieu": "tu_hoa", "cung_kia": ma, "hoa": hoa, "sao": d["sao"], "cau": cau,
            }))
        elif tu_ma == ma and not d["tu_hoa"]:
            w = _HOA_TRONG.get(hoa, 1) + (2 if den_ma in _CUNG_CHINH_MA else 0)
            cau = _m("bay_cung", "di").format(ngan=_ngan(ma, lon), y_hoa=_y_hoa(hoa), ngan_kia=_ngan(den_ma, lon))
            ung.append((w, -idx, {
                "chieu": "di", "cung_kia": den_ma, "hoa": hoa, "sao": d["sao"], "cau": cau,
            }))
        elif den_ma == ma and not d["tu_hoa"]:
            w = _HOA_TRONG.get(hoa, 1) + (2 if tu_ma in _CUNG_CHINH_MA else 0)
            cau = _m("bay_cung", "den").format(ngan=_ngan(ma, lon), y_hoa=_y_hoa(hoa), ngan_kia=_ngan(tu_ma, lon))
            ung.append((w, -idx, {
                "chieu": "den", "cung_kia": tu_ma, "hoa": hoa, "sao": d["sao"], "cau": cau,
            }))

    ung.sort(key=lambda x: (-x[0], -x[1]))
    ra, da = [], set()
    for _, _, item in ung:
        k = (item["chieu"], item["cung_kia"], item["hoa"])
        if k in da:
            continue
        da.add(k)
        ra.append(item)
        if len(ra) >= BAY_MOI_O:
            break
    return ra


def _lap_o(
    c: dict,
    ls: dict,
    cc: dict[str, dict],
    chi_lai: str,
    duong_all: list[dict],
    nam_10: list[dict],
    nam_am_sinh: int,
    tuoi_mu: int,
    lon: bool,
) -> dict:
    ten = c["ten"]
    ma = MA_CUNG[ten]
    cc_o = cc[ten]
    muc = cc_o["muc"]
    nhan_muc = _nhan_muc(muc)
    vo_chinh = len(c["chinh_tinh"]) == 0
    xung_ten, th1_ten, th2_ten = cc_o["lan_can"]
    xung_ma, th1_ma, th2_ma = MA_CUNG[xung_ten], MA_CUNG[th1_ten], MA_CUNG[th2_ten]
    ngan = _ngan(ma, lon)

    # Lớp 1 — `la_gi`: đời thường, không lộ thuật ngữ sao/độ sáng/tứ hoá
    la_gi: list[str] = []
    if ten == "Mệnh":
        la_gi.append(_m("la_gi", "cung_menh").format(y=_y_cung(ma, lon), muc_thuong=_muc_thuong(muc)))
    else:
        la_gi.append(_m("la_gi", "cung_mo").format(ngan=ngan, y=_y_cung(ma, lon), muc_thuong=_muc_thuong(muc)))
    if c["la_than"]:
        la_gi.append(_m("la_gi", "than_cu").format(ngan=ngan))
    if c["chi"] == chi_lai:
        la_gi.append(_m("la_gi", "lai_nhan").format(ngan=ngan))

    if not vo_chinh and (lon or ma not in ("phu_the", "tu_nu")):
        s0 = c["chinh_tinh"][0]
        ds0 = s0.get("do_sang") or "Bình"
        nhom_s = "ham" if ds0 == "Hãm" else "sang"
        sv = tvds._sao_van(s0["ten"], ten, nhom_s)  # noqa: SLF001
        cau_sao = sv["de_vap"] if muc == "can_chu_dong" else sv["manh"]
        cau_sao = tvds._sua_menh(cau_sao) or cau_sao  # noqa: SLF001
        la_gi.append(cau_sao)
    elif vo_chinh:
        la_gi.append(_m("la_gi", "vo_chinh_dieu").format(ngan_xung=_ngan(xung_ma, lon)))

    if cc_o["hoa"]:
        la_gi.append(_m("la_gi", "hoa_sinh").format(ngan=ngan, y_hoa=_y_hoa(cc_o["hoa"][0]["hoa"])))
    if cc_o["cat"]:
        la_gi.append(_m("la_gi", "cat").format(ngan=ngan))
    elif cc_o["sat"]:
        la_gi.append(_m("la_gi", "sat").format(ngan=ngan))
    if cc_o["tuan_triet"]:
        la_gi.append(_m("la_gi", "tuan_triet").format(ngan=ngan))

    # Lớp 2 — `tam_phuong`: 3 cung tam phương tứ chính đỡ hay kéo
    tp_cau = [_m("tam_phuong", "mo").format(
        ngan=ngan,
        ngan_xung=_ngan(xung_ma, lon),
        ngan_th1=_ngan(th1_ma, lon),
        ngan_th2=_ngan(th2_ma, lon),
    )]
    do_ds = [_ngan(MA_CUNG[k], lon) for k in (xung_ten, th1_ten, th2_ten) if cc[k]["muc"] == "thuan"]
    keo_ds = [_ngan(MA_CUNG[k], lon) for k in (xung_ten, th1_ten, th2_ten) if cc[k]["muc"] == "can_chu_dong"]
    if do_ds:
        tp_cau.append(_m("tam_phuong", "do").format(ds_do=danh_sach(do_ds), ngan=ngan))
    if keo_ds:
        tp_cau.append(_m("tam_phuong", "keo").format(ds_keo=danh_sach(keo_ds), ngan=ngan))
    if not do_ds and not keo_ds:
        tp_cau.append(_m("tam_phuong", "can").format(ngan=ngan))

    # Lớp 3 — `bay_cung`: đường bay tứ hoá đi / đến cung này
    bay_cung = _bay_cua_cung(ten, ma, duong_all, lon)

    # Lớp 4 — `nam`: năm nào trong 10 năm tới chạm cung này (cùng mức `dong_muoi_nam`)
    nam_cham: list[dict] = []
    for nx in nam_10:
        hit = next((ch["loai"] for ch in nx["cham"] if ch["o"] == ma), None)
        if not hit:
            continue
        ly_do = _m("nam", "ly_do", hit).format(ngan=_ngan(ma, lon and nx["tuoi"] >= config.TUOI_NGUOI_LON))
        cau_n = _m("nam", "cham").format(
            nam=nx["nam"],
            cc=f"{_t('can', nx['can'])} {_t('chi', nx['chi'])}",
            ly_do=ly_do,
            muc=nx["nhan_muc"],
        )
        nam_cham.append({
            "nam": nx["nam"],
            "can": nx["can"],
            "chi": nx["chi"],
            "muc": nx["muc"],
            "nhan_muc": nx["nhan_muc"],
            "cau": cau_n,
        })
        if len(nam_cham) >= NAM_MOI_O:
            break

    # `vi_sao`: toàn bộ thuật ngữ kỹ thuật đặt riêng tại đây
    hanh_c = CHI_HANH[c["chi"]]
    vi_sao = [_m("vi_sao", "cung").format(
        cung=_t("cung", ten), can=_t("can", c["can"]), chi=_t("chi", c["chi"]),
        hanh=_t("hanh", hanh_c), muc=nhan_muc,
    )]
    if not vo_chinh:
        ds_ct = ", ".join(
            f"{_t('sao', s['ten'])}" + (f" ({_tds(s['do_sang'])})" if s.get("do_sang") else "")
            for s in c["chinh_tinh"]
        )
        vi_sao.append(_m("vi_sao", "chinh").format(ds=ds_ct))
    elif cc_o["muon_tu"]:
        ds_muon = ", ".join(
            f"{_t('sao', s['ten'])}" + (f" ({_tds(s['do_sang'])})" if s.get("do_sang") else "")
            for s in cc_o["chinh"]
        )
        vi_sao.append(_m("vi_sao", "muon").format(xung=_t("cung", cc_o["muon_tu"]), ds=ds_muon))
    else:
        vi_sao.append(_m("vi_sao", "vo_chinh").format(chi=_t("chi", c["chi"])))

    if cc_o["hoa"]:
        ds_h = ", ".join(f"{_t('hoa', h['hoa'])} ({_t('sao', h['sao'])})" for h in cc_o["hoa"])
        vi_sao.append(_m("vi_sao", "hoa_goc").format(ds=ds_h))
    if cc_o["cat"]:
        vi_sao.append(_m("vi_sao", "cat").format(ds=", ".join(_t("sao", s) for s in cc_o["cat"])))
    if cc_o["sat"]:
        vi_sao.append(_m("vi_sao", "sat").format(ds=", ".join(_t("sao", s) for s in cc_o["sat"])))
    if cc_o["tuan_triet"]:
        vi_sao.append(_m("vi_sao", "tuan_triet").format(ds=", ".join(_t("tuan_triet", x) for x in cc_o["tuan_triet"])))
    vi_sao.append(_m("vi_sao", "tam_phuong").format(
        xung=_t("cung", xung_ten), th1=_t("cung", th1_ten), th2=_t("cung", th2_ten),
    ))

    tu_tuoi, den_tuoi = c["dai_han"]
    chinh_ra = [
        {"sao": s["ten"], "do_sang": s.get("do_sang"), "tu_hoa": s.get("tu_hoa"), "muon": False}
        for s in c["chinh_tinh"]
    ] or [
        {"sao": s["ten"], "do_sang": s.get("do_sang"), "tu_hoa": None, "muon": True}
        for s in cc_o["chinh"]
    ]

    return {
        "ma": ma,
        "chi_so": lunar.CHI.index(c["chi"]),
        "cung": ten,
        "can": c["can"],
        "chi": c["chi"],
        "hanh_cung": hanh_c,
        "muc": muc,
        "nhan_muc": nhan_muc,
        "la_menh": ten == "Mệnh",
        "la_than": bool(c["la_than"]),
        "la_lai_nhan": c["chi"] == chi_lai,
        "vo_chinh_dieu": vo_chinh,
        "tuan_triet": list(cc_o["tuan_triet"]),
        "chinh_tinh": chinh_ra,
        "dai_han": {
            "tu_tuoi": tu_tuoi,
            "den_tuoi": den_tuoi,
            "tu_nam": nam_am_sinh + tu_tuoi - 1,
            "den_nam": nam_am_sinh + den_tuoi - 1,
            "dang_di": tu_tuoi <= tuoi_mu <= den_tuoi,
        },
        "la_gi": la_gi,
        "tam_phuong": {
            "xung": xung_ma,
            "tam_hop": [th1_ma, th2_ma],
            "cau": tp_cau,
        },
        "bay_cung": bay_cung,
        "nam": nam_cham,
        "vi_sao": vi_sao,
        "chuong": _chuong(ma, lon),
    }


def _noi_bat_la_so(
    ls: dict,
    cc: dict[str, dict],
    cung_than_ma: str,
    lai_nhan_ma: str | None,
    chuoi: list[dict],
    lon: bool,
) -> list[dict]:
    ra: list[dict] = []
    c_menh = next(c for c in ls["cung"] if c["ten"] == "Mệnh")
    if cung_than_ma == "menh":
        ra.append({
            "ma": "menh_than",
            "o": ["menh"],
            "cau": _m("noi_bat", "menh_than_trung").format(
                chi=_t("chi", c_menh["chi"]), muc=_muc_thuong(cc["Mệnh"]["muc"]),
            ),
        })
    else:
        ra.append({
            "ma": "menh_than",
            "o": ["menh", cung_than_ma],
            "cau": _m("noi_bat", "menh_than_khac").format(ngan_than=_ngan(cung_than_ma, lon)),
        })

    hoa_goc = {h["hoa"]: MA_CUNG[h["cung"]] for h in ls["tu_hoa"] if h.get("cung") in MA_CUNG}
    if "Lộc" in hoa_goc and "Kỵ" in hoa_goc:
        o_lk = list(dict.fromkeys([hoa_goc["Lộc"], hoa_goc["Kỵ"]]))
        ra.append({
            "ma": "truc_loc_ky",
            "o": o_lk,
            "cau": _m("noi_bat", "truc_loc_ky").format(
                ngan_loc=_ngan(hoa_goc["Lộc"], lon),
                ngan_ky=_ngan(hoa_goc["Kỵ"], lon),
            ),
        })

    if chuoi:
        c0 = chuoi[0]
        ra.append({
            "ma": "chuoi_dau",
            "o": list(dict.fromkeys([c0["tu"], c0["qua"], c0["den"]])),
            "cau": _m("noi_bat", "chuoi_dau").format(
                ngan_tu=_ngan(c0["tu"], lon),
                ngan_qua=_ngan(c0["qua"], lon),
                ngan_den=_ngan(c0["den"], lon),
            ),
        })
    elif lai_nhan_ma:
        ra.append({
            "ma": "lai_nhan",
            "o": [lai_nhan_ma],
            "cau": _m("noi_bat", "lai_nhan").format(ngan=_ngan(lai_nhan_ma, lon)),
        })

    return ra[:3]


def _duong_bay_view(ls: dict, can_phi: str, nam_am_xem: int, lon: bool) -> tuple[dict, list[dict]]:
    phi = phl.lap(ls, can_phi, nam_am_xem)
    chuoi = _luan_chuoi_chuyen_ky(ls["cung"], lon)
    lai_cung = (phi.get("lai_nhan") or {}).get("cung")
    lai_ma = MA_CUNG[lai_cung] if lai_cung in MA_CUNG else None

    sinh_nien = [
        {"hoa": h["hoa"], "sao": h["sao"], "cung": MA_CUNG[h["cung"]]}
        for h in ls["tu_hoa"] if h.get("cung") in MA_CUNG
    ]

    noi_bat = []
    for n in phi["noi_bat"]:
        d = n["duong"]
        if not d.get("den_cung"):
            continue
        tu_ma = MA_CUNG[d["tu_cung"]]
        den_ma = MA_CUNG[d["den_cung"]]
        xung_ma = MA_CUNG[d["xung_cung"]] if d.get("xung_cung") in MA_CUNG else None
        tieu_de = n["tieu_de"]
        nghia = n["nghia"]
        viec = n.get("viec_nen_lam")
        if not lon and ({tu_ma, den_ma, xung_ma} & {"phu_the", "tu_nu"}):
            tieu_de = f"{_hoa_dau(_ngan(tu_ma, False))} -> {_ngan(den_ma, False)}"
            nghia = _m("bay_cung", "tu_hoa" if d["tu_hoa"] else "di").format(
                ngan=_ngan(tu_ma, False),
                y_hoa=_y_hoa(d["hoa"]),
                y_hoa_ngan=_y_hoa_ngan(d["hoa"]),
                ngan_kia=_ngan(den_ma, False),
            )
            viec = None
        noi_bat.append({
            "ma": _ma_phi_hoa(n["loai"], d),
            "loai": n["loai"],
            "tu": tu_ma,
            "den": den_ma,
            "xung": xung_ma,
            "hoa": d["hoa"],
            "sao": d["sao"],
            "tu_hoa": bool(d["tu_hoa"]),
            "tieu_de": tieu_de,
            "nghia": nghia,
            "viec_nen_lam": viec,
            "can_cu": list(n.get("can_cu") or []),
        })

    vao_menh = [
        {
            "tu": MA_CUNG[d["tu_cung"]],
            "den": MA_CUNG[d["den_cung"]],
            "hoa": d["hoa"],
            "sao": d["sao"],
            "tu_hoa": bool(d["tu_hoa"]),
            "nghia": (
                _m("bay_cung", "tu_hoa" if d["tu_hoa"] else "den").format(
                    ngan=_ngan("menh", False),
                    y_hoa=_y_hoa(d["hoa"]),
                    y_hoa_ngan=_y_hoa_ngan(d["hoa"]),
                    ngan_kia=_ngan(MA_CUNG[d["tu_cung"]], False),
                )
                if not lon and MA_CUNG[d["tu_cung"]] in ("phu_the", "tu_nu")
                else d["nghia"]
            ),
            "can_cu": [phl.can_cu_duong(d)],
        }
        for d in phi["vao_menh"] if d.get("den_cung") in MA_CUNG
    ]

    tu_hoa = [
        {
            "tu": MA_CUNG[d["tu_cung"]],
            "hoa": d["hoa"],
            "sao": d["sao"],
            "nghia": (
                _m("bay_cung", "tu_hoa").format(
                    ngan=_ngan(MA_CUNG[d["tu_cung"]], False),
                    y_hoa_ngan=_y_hoa_ngan(d["hoa"]),
                )
                if not lon and MA_CUNG[d["tu_cung"]] in ("phu_the", "tu_nu")
                else d["nghia"]
            ),
            "can_cu": [phl.can_cu_duong(d)],
        }
        for d in phi["tu_hoa"]
    ]

    return {
        "lai_nhan": lai_ma,
        "sinh_nien": sinh_nien,
        "noi_bat": noi_bat,
        "vao_menh": vao_menh,
        "tu_hoa": tu_hoa,
        "chuoi_chuyen_ky": chuoi,
    }, phi["duong_bay"]


def _thoi_gian(
    ls: dict,
    cc: dict[str, dict],
    tgb: list[dict],
    dong: list[dict],
    nam_am_sinh: int,
    nam_am_xem: int,
    tuoi_mu: int,
    lon: bool,
) -> tuple[dict, list[dict]]:
    theo_chi = {c["chi"]: MA_CUNG[c["ten"]] for c in ls["cung"]}
    muc_nam = {g["nam"]: g for g in dong}
    nam_cuoi = max(muc_nam) if muc_nam else nam_am_xem + 9

    dai_van = []
    for k, g in enumerate(tgb):
        ma_c = MA_CUNG[g["cung"]]
        lon_han = lon and g["den_tuoi"] >= config.TUOI_NGUOI_LON
        chu_de = _chu_de_han(ma_c, lon_han)
        muc = g["muc"]
        dai_van.append({
            "i": k,
            "cung": ma_c,
            "ten_cung": g["cung"],
            "tu_tuoi": g["tu_tuoi"],
            "den_tuoi": g["den_tuoi"],
            "tu_nam": g["nam_tu"],
            "den_nam": g["nam_den"],
            "muc": muc,
            "chu_de": chu_de,
            "hien_tai": bool(g["hien_tai"]),
            "cau": _m("thoi_gian", "dai_van").format(
                tu_tuoi=g["tu_tuoi"],
                den_tuoi=g["den_tuoi"],
                tu_nam=g["nam_tu"],
                den_nam=g["nam_den"],
                chu_de=chu_de.lower(),
                muc=_nhan_muc(muc).lower(),
            ),
        })

    dong_han = None
    if dai_van and dai_van[0]["tu_tuoi"] > 1:
        c_menh = MA_CUNG["Mệnh"]
        dong_han = {"tu_tuoi": 1, "den_tuoi": dai_van[0]["tu_tuoi"] - 1, "cung": c_menh}

    nam_ds: list[dict] = []
    nam_10: list[dict] = []
    for n in range(nam_am_sinh, nam_cuoi + 1):
        can_n, chi_n = lunar.can_chi_nam(n)
        tuoi_n = n - nam_am_sinh + 1
        lon_n = lon and tuoi_n >= config.TUOI_NGUOI_LON
        cung_ln_ma = theo_chi[chi_n]
        hoa_raw = phi_calc.phi_tu_can(can_n, ls["cung"])
        hoa_nam = [
            {
                "hoa": h["hoa"],
                "sao": h["sao"],
                "den": MA_CUNG[h["den_cung"]] if h.get("den_cung") in MA_CUNG else None,
                "xung": MA_CUNG[h["xung_cung"]] if h.get("xung_cung") in MA_CUNG else None,
            }
            for h in hoa_raw
        ]
        cham = _cham_cua_nam(cung_ln_ma, hoa_nam)
        idx_dh = next((d["i"] for d in dai_van if d["tu_tuoi"] <= tuoi_n <= d["den_tuoi"]), None)
        cau = _m("thoi_gian", "nam").format(
            nam=n,
            cc=f"{_t('can', can_n)} {_t('chi', chi_n)}",
            tuoi=tuoi_n,
            ngan_ln=_ngan(cung_ln_ma, lon_n),
        ) + _m("thoi_gian", "nam_cham").format(n=len(cham))

        chi_tiet = [
            _m("thoi_gian", "chi_tiet", ch["loai"]).format(
                ngan=_ngan(ch["o"], lon_n),
                cung=_t("cung", TEN_TU_MA[ch["o"]]),
            )
            for ch in cham[:4]
        ]

        x: dict = {
            "nam": n,
            "tuoi": tuoi_n,
            "can": can_n,
            "chi": chi_n,
            "cung_luu_nien": cung_ln_ma,
            "dai_han": idx_dh,
            "qua": n < nam_am_xem,
            "hoa_nam": hoa_nam,
            "cham": cham,
            "cau": cau,
            "chi_tiet": chi_tiet,
        }
        g = muc_nam.get(n)
        if g:
            x.update({
                "muc": g["muc"],
                "nhan_muc": g["nhan_muc"],
                "mang": g.get("mang") or "",
            })
            if n == nam_am_xem:
                # Cách a (SAO-2): CHỈ năm hiện tại có lời giải & nên tránh / nên làm
                x.update({k: g[k] for k in ("y", "nen_tranh", "nen_lam") if g.get(k)})
            else:
                # Năm tương lai (`n > nam_am_xem`): CẤM gán y / nen_tranh / nen_lam vào JSON
                x["khoa"] = True
            nam_10.append(x)

        nam_ds.append(x)

    return {
        "nam_xem": nam_am_xem,
        "dong_han": dong_han,
        "dai_van": dai_van,
        "nam": nam_ds,
        "hoi_dan": _m("thoi_gian", "hoi_dan"),
        "nam_toi": _m("thoi_gian", "nam_toi"),
    }, nam_10


def lap(sinh: dict, ngay_duong_sinh: dt.date, ngay_xem: dt.date | None = None) -> dict:
    """`sinh` từ `tuvi_v2_api._sinh` + `ngay_duong_sinh = dv.duong_goc` → dữ liệu Bản đồ 12 cung + Đường bay 2 chặng."""
    ngay_xem = ngay_xem or config.hom_nay_vn()
    sinh_c = az.chuan_sinh(sinh)
    kw = {
        "tz_lich": sinh_c.get("tz_lich", config.CALENDAR_MERIDIAN_TZ),
        "thang_nhuan": sinh_c.get("thang_nhuan", "thang_sau"),
        "lich": sinh_c.get("lich", "viet"),
    }
    az.nap_truoc_sinh(sinh_c, ngay_xem)
    la = az.an_sao_tho(
        sinh_c["ngay"], sinh_c["ti"], sinh_c["gioi_tinh"], "vi-VN",
        hoa_linh=sinh_c.get("hoa_linh", "viet"), **kw,
    )
    ls = tom_tat(la)
    vh = az.van_han(sinh_c["ngay"], sinh_c["ti"], sinh_c["gioi_tinh"], ngay_xem, **kw)

    tz_xem = az.TZ_TRUNG if kw["lich"] == "trung" else config.CALENDAR_MERIDIAN_TZ
    nam_am_xem = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, tz_xem)[2]
    tuoi_mu = int(vh["tuoi_mu"])
    nam_am_sinh = nam_am_xem - tuoi_mu + 1
    tuoi = hoan_canh.tuoi_tron(ngay_duong_sinh, ngay_xem)
    lon = tuoi >= config.TUOI_NGUOI_LON

    can_sinh, chi_sinh = lunar.can_chi_nam(nam_am_sinh)
    can_phi = ls["can_nam"] or can_sinh
    chi_lai = phi_calc.lai_nhan(can_phi)

    cc = tvds.cham_cung(ls)
    tgb = tvds.thoi_gian_bieu(ls, cc, tuoi_mu, nam_am_sinh)
    dong = tvds.dong_muoi_nam(ls, cc, nam_am_xem, nam_am_sinh, sinh_c.get("gioi_tinh"))

    duong_bay, duong_all = _duong_bay_view(ls, can_phi, nam_am_xem, lon)
    thoi_gian, nam_10 = _thoi_gian(ls, cc, tgb, dong, nam_am_sinh, nam_am_xem, tuoi_mu, lon)

    o_ds = [
        _lap_o(c, ls, cc, chi_lai, duong_all, nam_10, nam_am_sinh, tuoi_mu, lon)
        for c in sorted(ls["cung"], key=lambda x: lunar.CHI.index(x["chi"]))
    ]

    na = can_chi.nap_am(can_sinh, chi_sinh)
    h_cuc = can_chi.hanh_cuc(ls["cuc"])
    mc_goc = can_chi.menh_cuc(na["hanh"], h_cuc)
    mc_ma = _MENH_CUC_MA.get(mc_goc, "binh_hoa")
    ihg = tuan_triet_vendor.chi_so_hoa_giap(can_sinh, chi_sinh)
    tuan_chi = [tuan_triet_vendor.CHI[i] for i in tuan_triet_vendor.TUAN[ihg // 10]]
    triet_chi = [tuan_triet_vendor.CHI[i] for i in tuan_triet_vendor.TRIET[ihg % 10]]

    c_than = next((c for c in ls["cung"] if c["la_than"]), ls["cung"][0])
    cung_than_ma = MA_CUNG[c_than["ten"]]
    lai_ma = duong_bay["lai_nhan"]

    tam = {
        "cuc": ls["cuc"],
        "hanh_cuc": h_cuc,
        "nap_am": na["ten"],
        "hanh_menh": na["hanh"],
        "menh_cuc": str(_k("menh_cuc", mc_ma) or mc_goc),
        "cung_menh": "menh",
        "cung_than": cung_than_ma,
        "lai_nhan": lai_ma,
        "tuan_chi": tuan_chi,
        "triet_chi": triet_chi,
    }

    return {
        "phien_ban": PHIEN_BAN,
        "tuoi": tuoi,
        "tuoi_mu": tuoi_mu,
        "nguoi_lon": lon,
        "tam": tam,
        "o": o_ds,
        "noi_bat": _noi_bat_la_so(ls, cc, cung_than_ma, lai_ma, duong_bay["chuoi_chuyen_ky"], lon),
        "duong_bay": duong_bay,
        "thoi_gian": thoi_gian,
        "ngay_xem": ngay_xem.isoformat(),
        **meta(),
    }
