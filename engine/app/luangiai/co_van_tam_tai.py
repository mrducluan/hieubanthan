# -*- coding: utf-8 -*-
"""Cố vấn liên mảng Tam Tài (`POST /v1/co-van`, `mo_dun = "tam_tai"`) — làm lại sau review 2026-11-26.

Một ô hỏi, ba cách xem ĐỌC RIÊNG (không gộp thành một mức chung — CD-1, KH-1 đã loại "đồng thuận liên môn"):
  - Nhân (sức của chính bạn): có giờ sinh → mức chương Bát tự tương ứng; chưa có giờ → Bát tự 6 chữ chỉ cho hành đang ít,
    phần còn lại là năm cá nhân thần số (nói rõ nguồn, KHÔNG chấm mức, không gắn nhãn "Bát tự").
  - Thiên (thời điểm): có giờ sinh → mức chương Tử vi tương ứng + chuỗi Kỵ chuyển Kỵ chạm đúng mảng được hỏi (nếu có);
    luôn kèm Lịch quyết định 12 tháng (một bộ tính với /quan-ly-nhan-su).
  - Địa (không gian): có hướng nhà → mức chương đầu bài "Nhà của bạn"; không có → chỉ cung mệnh + hướng Sinh Khí, KHÔNG mức.
Chỉ dùng phần MIỄN PHÍ của các báo cáo (mức chương là thông tin công khai; không chép tóm tắt / hộp của chương trả phí),
nên trang này miễn phí. Thứ tự chặn trước khi tính: an toàn (MỘT bộ chặn chung `hoidap.chung.dac_biet`; câu tiếng Anh trả
lời tiếng Anh) → dưới 16 tuổi → câu về người khác / kể chuyện đã xảy ra (bộ nhận diện của hỏi đáp) → chưa rõ việc gì.
Không lưu, không đưa ngày sinh người liên quan vào lời.
"""
from __future__ import annotations

import contextlib
import datetime as dt
import re

from app import config, ngon_ngu
from app.calc import battu as bt_calc, doanh_chu as dc, lunar, phongthuy as pt, thanso, tuvi_an_sao as az
from app.hoidap import chung
from app.hoidap import luan_hoi_khop as lhk
from app.kb import kinhdich_kb, nap, ten as ten_kb
from app.kb.loi import L, danh_sach
from app.luangiai import (
    an_toan as _at,
    co_van_hieu as ch_hieu,
    doanh_chu_mat_bang as dcmb,
    battu_doi_song as btd,
    doanh_chu_lich as dcl,
    doi_song_khuon as kh,
    phongthuy_doi_song as ptds,
    tuvi_doi_song as tvd,
    tuvi_phi_hoa as ph_luan,
)

MO_DUN = "tam_tai"
_TEP = "co_van_tam_tai_kb.json"
_HANH_SLUG = {"Kim": "kim", "Mộc": "moc", "Thủy": "thuy", "Thuỷ": "thuy", "Hỏa": "hoa", "Hoả": "hoa", "Thổ": "tho"}
_HANH_NORM = {"Kim": "Kim", "Mộc": "Mộc", "Thủy": "Thủy", "Thuỷ": "Thủy", "Hỏa": "Hỏa", "Hoả": "Hỏa", "Thổ": "Thổ"}

# Mạch → cung Tử vi mà chuỗi Kỵ chuyển Kỵ phải chạm (đi qua hoặc dừng) mới được nhắc; không có thì không chọn chuỗi bừa.
_CUNG_MACH = {
    "su_nghiep_chuyen_viec": {"Quan Lộc"}, "tai_chinh_dau_tu": {"Tài Bạch"}, "gop_von_hop_tac": {"Nô Bộc", "Tài Bạch"},
    "nha_cua_mat_bang": {"Điền Trạch"}, "tinh_cam_cam_ket": {"Phu Thê"}, "gia_dao_hoa_giai": {"Phu Thê", "Phụ Mẫu", "Tử Nữ"},
    "suc_ben_nang_luong": {"Tật Ách"},
}

_MAU_MACH: list[tuple[str, list[str]]] = [
    ("gop_von_hop_tac", [
        r"(hun von|gop von|chung von|gop co phan|lam an chung|lam chung|co[ -]?founders?|chia co phan|chia 50|doi tac lam an)",
        r"\b(co[ -]?founders?|pool capital|split equity|equity split|business partners?|joint ventures?)\b",
    ]),
    ("gia_dao_hoa_giai", [
        r"(vo chong|gia dinh|gia dao|con cai|nuoi day con|noi ngoai|bo me va hai vo chong).{0,45}(cai nhau|luc duc|cang thang|bat hoa|bat dong|lanh nhat|chien tranh lanh|ngot ngat|xung dot|hoa giai|go nut)",
        r"(cai nhau|luc duc|cang thang|bat hoa|bat dong|ngot ngat|xung dot).{0,45}(vo chong|gia dinh|bo me|trong nha)",
        r"(chien tranh lanh|bat hoa gia dinh|mau thuan vo chong)",
        r"\b(marriage|spouse|husband|wife|family|in-laws).{0,35}(conflict|argue|friction|tension|cold war)\b",
    ]),
    ("suc_ben_nang_luong", [
        r"(kiet suc|met moi|mat ngu|burnout|qua tai|hut hoi|ue oai|duoi suc|chan nan|nghi phep dai|ap luc tinh than)",
        r"\b(burnout|exhausted|insomnia|stamina|overloaded|drained|overwhelmed|fatigue)\b",
    ]),
    ("tinh_cam_cam_ket", [
        r"(ket hon|dang ky ket hon|cuoi hoi|giuc cuoi|tinh cam|nguoi yeu|ban trai|ban gai|hen ho|chia tay|ly hon|mo long|moi tinh)",
        r"\b(marry|wedding|relationship|dating|breakup|divorce|boyfriend|girlfriend|romance)\b",
    ]),
    ("nha_cua_mat_bang", [
        r"(mua nha|mua can ho|chung cu|nha pho|chuyen nha|chuyen cho o|chuyen dia diem|ra o rieng|thue mat bang|doi showroom|sua nha|dat bep)",
        r"\b(buy a house|apartment|relocat|commercial lease|premises|storefront|renovat)\b",
    ]),
    ("tai_chinh_dau_tu", [
        r"(dau tu|xuong tien|giu tien|co phieu|trai phieu|gui ky han|so tiet kiem|dong tien|cong no|thu hoi no|vay them von|thanh khoan|lo dat)",
        r"\b(invest|stocks|cashflow|receivables|debt|loan|liquidity|savings)\b",
    ]),
    ("su_nghiep_chuyen_viec", [
        r"(nghi viec|nghi han|bo viec|nhay viec|chuyen viec|doi nghe|thang chuc|giam doc|san dau nguoi|tach xuong|mo tiem|mo quan|mo cua hang|mo shop|kinh doanh rieng|buon ban|khoi nghiep|ra lam rieng|lam rieng|mo cong ty|su nghiep)",
        r"\b(quit my job|leave .{0,20}job|change jobs?|career|headhunter|director|promotion|startup|go independent|launch .{0,25}(studio|shop|company|venture))\b",
    ]),
]


def _kb() -> dict:
    return nap.doc(_TEP)


def nhan_dien_mach(cau_hoi: str) -> str | None:
    """Mạch quyết định của câu hỏi; None = chưa nhận ra (không đoán, không rơi về một mạch mặc định)."""
    t = chung.chuan_hoa_cau(cau_hoi or "")
    v = ch_hieu.viec(t)
    if v:
        return v.mach
    for ma, ds in _MAU_MACH:
        if chung.co(t, ds):
            return ma
    return None


def _kiem_an_toan(cau_hoi: str) -> dict | None:
    """MỘT bộ chặn chung với hỏi đáp (`chung.dac_biet`). Câu viết tiếng Anh trên trang Việt → lời đáp tiếng Anh (có 988)."""
    t = chung.chuan_hoa_cau(cau_hoi or "")
    loai = chung.dac_biet(t, cau_hoi)
    if not loai:
        return None
    en = ngon_ngu.la_viet() and _at._la_en(cau_hoi)
    with (ngon_ngu.dung("en") if en else contextlib.nullcontext()):
        if loai == "an_toan":
            dap = chung.mau_an_toan(cau_hoi, L("an_toan.khung_hoang", kinhdich_kb.mau("an_toan") or ""))
        elif loai == "dan_huong":
            dap = L("an_toan.dan_huong", chung.mau_dan_huong(t))
        else:
            dap = chung.mau_tu_choi(cau_hoi, t, L("an_toan.tu_choi", kinhdich_kb.mau("tu_choi") or ""))
    return {"xu_ly": loai, "loai": loai, "cau_tra_loi": dap}


def _tuoi(ngay_sinh: dt.date, hom_nay: dt.date) -> int:
    return hom_nay.year - ngay_sinh.year - ((hom_nay.month, hom_nay.day) < (ngay_sinh.month, ngay_sinh.day))


def _chuyen_huong(ly_do: str, k: dict, hom_nay: dt.date, ds_mach: bool = False) -> dict:
    lk = list(k["lien_ket_chung"])
    if ds_mach:
        lk = [{"ten": v["ten"], "duong": v["lien_ket"]["duong"], "mach": m} for m, v in k["mach"].items()]
    return {"mo_dun": MO_DUN, "phien_ban": kh.PHIEN_BAN, "ngay_xem": hom_nay.isoformat(), "trang_thai": k["trang_thai"],
            "chuyen_huong": {"ly_do": ly_do, "cau": k["chuyen_huong"][ly_do], "lien_ket": lk}}


def _bieu_do_tu_battu(ls_bt: dict, co_gio: bool) -> tuple[dict, list[str]]:
    diem_raw = ls_bt["ngu_hanh"]["diem"]
    tong = sum(float(v) for v in diem_raw.values()) or 1.0
    hanh_ds = []
    thieu_ds: list[str] = []
    for h_goc in ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ"):
        d = float(diem_raw.get(h_goc, diem_raw.get("Thuỷ" if h_goc == "Thủy" else "Hoả" if h_goc == "Hỏa" else h_goc, 0.0)))
        tl = round(d / tong * 100.0, 1)
        tt = "thieu" if tl < 13.0 else "thua" if tl > 30.0 else "vua"
        if tt == "thieu":
            thieu_ds.append(h_goc)
        hanh_ds.append({
            "hanh_ma": _HANH_SLUG[h_goc],
            "ten": ten_kb.ten("hanh", h_goc),
            "diem": round(d, 2),
            "ty_le": tl,
            "trang_thai": tt,
        })
    if not thieu_ds:
        h_min = min(("Kim", "Mộc", "Thủy", "Hỏa", "Thổ"),
                    key=lambda hg: float(diem_raw.get(hg, diem_raw.get("Thuỷ" if hg == "Thủy" else "Hoả" if hg == "Hỏa" else hg, 0.0))))
        thieu_ds.append(h_min)
    can_ngay = ls_bt["nhat_chu"]["can"]
    nc_hanh = _HANH_NORM[ls_bt["nhat_chu"]["ngu_hanh"]]
    bd = {
        "nhat_chu": f"{ten_kb.ten('can', can_ngay)} ({ten_kb.ten('hanh', nc_hanh)})",
        "co_gio": co_gio,
        "hanh": hanh_ds,
    }
    return bd, thieu_ds[:2]


_MUC_TIEU = {"mo_cua_hang": "ra_mat", "mo_quan": "ra_mat", "mo_rong": "ra_mat", "ra_lam_rieng": "ra_mat", "chuyen_viec": "tang_truong",
             "dau_tu": "giu_tien", "gop_von": "ky_ket", "mua_nha": "ky_ket", "tinh_cam": "tang_truong", "gia_dao": "tang_truong",
             "suc_ben": "tang_truong"}
_CO_NGAY = frozenset({"mo_cua_hang", "mo_quan", "mo_rong", "ra_lam_rieng", "chuyen_viec", "dau_tu", "gop_von", "mua_nha"})
_TIEN_TO_TOM = re.compile(r"^(Tóm lại|In short):\s*", re.I)
_DOI_MUC_MB = {"can_chu_y": "can_chu_dong"}


_THANG_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


def _ten_thang(m: int, y: int, vi: bool) -> str:
    return f"tháng {m}/{y}" if vi else f"{_THANG_EN[m - 1]} {y}"


def _hoa(s: str) -> str:
    return s[:1].upper() + s[1:]


def _gop_nhan(thang: list[tuple[int, int]]) -> str:
    """[(2027,8),(2027,9),(2027,12)] → "T8–T9/2027, T12/2027" (gộp tháng liền nhau)."""
    ra: list[list[tuple[int, int]]] = []
    for y, m in sorted(thang):
        if ra and (ra[-1][-1][0] * 12 + ra[-1][-1][1]) + 1 == y * 12 + m:
            ra[-1].append((y, m))
        else:
            ra.append([(y, m)])
    return ", ".join(f"T{g[0][1]}/{g[0][0]}" if len(g) == 1 else
                     (f"T{g[0][1]}–T{g[-1][1]}/{g[-1][0]}" if g[0][0] == g[-1][0] else f"T{g[0][1]}/{g[0][0]}–T{g[-1][1]}/{g[-1][0]}")
                     for g in ra)


def _doan(ds: list[dict], k: dict, vk: dict, thang_hoi: int | None) -> tuple[list[dict], list[dict]]:
    """Gộp các tháng có CÙNG nhịp và CÙNG lý do thành một đoạn (trước: 12 ô, 10 ô y hệt); mỗi nhịp chỉ nêu việc nên làm MỘT lần
    (`cach_lam`). Đoạn xếp theo tháng đầu tiên của nó."""
    nhom: dict[tuple[str, str], dict] = {}
    for th in ds:
        ly_do = _TIEN_TO_TOM.sub("", th["tom_lai"] or "").strip()
        g = nhom.setdefault((th["nhip_thang"], ly_do), {"nhip": th["nhip_thang"], "ly_do": ly_do, "_ym": [], "thang": []})
        g["_ym"].append((th["nam"], th["thang"]))
        g["thang"].append(th["nhan_thang"])
    doan = []
    for g in nhom.values():
        ym = g.pop("_ym")
        g["nhan"] = _gop_nhan(ym)
        g["nhan_nhip"] = k["nhan_nhip_thang"][g["nhip"]]
        g["thang_hoi"] = bool(thang_hoi is not None and thang_hoi in [m for _, m in ym])
        doan.append(g)
    cach_lam = []
    for nhip in ("day_manh", "can_bang", "phong_thu"):
        ym = [x for g in nhom.values() if g["nhip"] == nhip for x in _ym_tu_nhan(g["thang"])]
        if ym:
            cach_lam.append({"nhip": nhip, "nhan_nhip": k["nhan_nhip_thang"][nhip], "nhan": _gop_nhan(ym), "nen_lam": vk["nen_lam"][nhip]})
    return doan, cach_lam


def _ym_tu_nhan(ds: list[str]) -> list[tuple[int, int]]:
    ra = []
    for x in ds:
        m, y = x[1:].split("/")
        ra.append((int(y), int(m)))
    return ra


def _muc_nam(nam: int, hom_nay: dt.date, tv_sinh: dict, bt_sinh: dict, ls_tv: dict, ls_bt: dict, bc_tv: dict | None, bc_bt: dict) -> dict:
    """Mức Tử vi / Bát tự của NĂM được hỏi (chương "Năm nay" — hộp lưu niên), cùng cách "Thời gian tới" đọc."""
    from app.luangiai import nam_tong_quan as ntq, thoi_gian_toi as tgt  # noqa: PLC0415
    if nam != hom_nay.year:
        ngay_nam = tgt._tet(nam)
        ngay_bt = min(max(ngay_nam, ntq._lap_xuan(nam) + dt.timedelta(days=1)), ntq._lap_xuan(nam + 1) - dt.timedelta(days=1))
        bc_tv = tvd.lap(tv_sinh, ngay_nam, ls=ls_tv)
        bc_bt = btd.lap(bt_sinh, ngay_bt, ls=ls_bt)
    ra: dict[str, str | None] = {"tuvi": None, "battu": None}
    for ma, bc, dau in (("tuvi", bc_tv, "ds.nam_nay.luu_nien."), ("battu", bc_bt, "ds.bt.nam_nay.nam.")):
        c = tgt._chuong_cua(bc, "nam_nay")
        h = next((x for x in c["hop"] if x.get("ma_mau", "").startswith(dau) and x.get("muc")), None)
        ra[ma] = h["muc"] if h else None
    return ra


def _nghieng(muc: list[str]) -> str:
    cd, thuan = muc.count("can_chu_dong"), muc.count("thuan")
    if cd >= 2:
        return "chuan_bi"
    if cd == 1:
        return "can_nhac"
    return "thuan" if thuan >= 2 else "can_nhac"


def lap(
    *,
    cau_hoi: str,
    ngay_sinh: dt.date,
    gioi_tinh: str = "nam",
    gio_sinh: str | None = None,
    do_tin_gio: str = "unknown",
    noi_sinh: str | None = None,
    tz_lich: float = 7.0,
    nha: dict | None = None,
    mat_bang: dict | None = None,
    doi_tac: dict | None = None,
    che_do: str = "doi_song",
    ngay_xem: dt.date | None = None,
    **_bo_qua,
) -> dict:
    hom_nay = ngay_xem or config.hom_nay_vn()
    k = _kb()

    chan = _kiem_an_toan(cau_hoi)
    if chan is not None:
        return {"mo_dun": MO_DUN, "phien_ban": kh.PHIEN_BAN, "ngay_xem": hom_nay.isoformat(),
                "trang_thai": k["trang_thai"], "an_toan_chan": chan}
    if _tuoi(ngay_sinh, hom_nay) < config.TUOI_NGUOI_LON:
        return _chuyen_huong("duoi_tuoi", k, hom_nay)
    t_norm = chung.chuan_hoa_cau(cau_hoi)
    if lhk.noi_ve_nguoi_khac(cau_hoi, t_norm):
        return _chuyen_huong("nguoi_khac", k, hom_nay)
    if lhk.ke_su_viec(t_norm):
        return _chuyen_huong("ke_su_viec", k, hom_nay)
    hc = ch_hieu.hieu(cau_hoi, t_norm, hom_nay)
    v = hc["viec"]
    if v is None:
        return _chuyen_huong("chua_ro", k, hom_nay, ds_mach=True)
    mach = v.mach
    m_kb = k["mach"][mach]
    vk = k["viec"][v.ma]
    mau = k["mau"]
    nguon = k["nguon"]
    khung = dict(hc["khung"])
    vi = ngon_ngu.la_viet()
    co_gio = bool(gio_sinh and do_tin_gio != "unknown")
    vai_nha = (nha or {}).get("vai") or "nha_o"
    co_nha = bool(nha and nha.get("do_huong") is not None)
    co_doi_tac = bool(doi_tac and doi_tac.get("ngay_sinh"))
    # Hướng của ĐÚNG loại không gian: mặt bằng kinh doanh ← `mat_bang` (hoặc `nha` đã khai vai mat_bang); nhà ở ← `nha` vai nha_o.
    mb_in = mat_bang if (mat_bang and mat_bang.get("do_huong") is not None) else (nha if (co_nha and vai_nha == "mat_bang") else None)
    nha_in = nha if (co_nha and vai_nha == "nha_o") else None
    huong_in = mb_in if v.khong_gian == "mat_bang" else nha_in if v.khong_gian == "nha_o" else None
    dung_dia = huong_in is not None

    # ---- LỊCH 12 THÁNG của ĐÚNG khung được hỏi ------------------------------------------------------------------------
    nam_k = khung["nam"]
    lich = dcl.lich_quyet_dinh_12_thang(
        ngay=ngay_sinh.day, thang=ngay_sinh.month, nam=ngay_sinh.year, gioi_tinh=gioi_tinh,
        gio=gio_sinh if co_gio else None, muc_tieu=_MUC_TIEU[v.ma], tu=hom_nay,
        nam_xem=nam_k if nam_k > hom_nay.year else None)
    ds_thang = lich["muoi_hai_thang"]
    if nam_k == hom_nay.year and not khung["mac_dinh"]:
        trong_nam = [t for t in ds_thang if t["nam"] == nam_k]
        if len(trong_nam) >= 3:
            ds_thang = trong_nam
        else:
            khung["mac_dinh"] = True           # năm nay chỉ còn vài tháng → dùng 12 tháng tới và nói thật
    nam_cn = int(thanso.nam_ca_nhan(ngay_sinh.day, ngay_sinh.month, nam_k, "duong_lich"))

    th_mo = [(t["nam"], t["thang"]) for t in ds_thang if t["nhip_thang"] == "day_manh"]
    th_cham = [(t["nam"], t["thang"]) for t in ds_thang if t["nhip_thang"] == "phong_thu"]
    doan, cach_lam = _doan(ds_thang, k, vk, khung["thang"])

    # ---- NHÂN: sức của chính bạn cho ĐÚNG việc này ---------------------------------------------------------------------
    ten_v, ten_v_hoa = vk["ten"], _hoa(vk["ten"])
    if co_gio:
        hh, mm = (int(x) for x in str(gio_sinh).split(":"))
        lich_bt = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, hh, mm)
        ls_bt = bt_calc.la_so(lich_bt, gioi_tinh=gioi_tinh, co_gio=True)
        sinh_bt = {"lich": lich_bt, "gioi_tinh": gioi_tinh, "gio_ty": "da_ty"}
        bc_bt = btd.lap(sinh_bt, hom_nay, ls=ls_bt)
        ch_bt = next((c for c in bc_bt["chuong"] if c["ma"] == m_kb["chuong_battu"] and c.get("muc")), None)
    else:
        ls_bt = bt_calc.la_so(dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, 12, 0), gioi_tinh=gioi_tinh, co_gio=False)
        ch_bt = None
    bd_nh, hanh_thieu = _bieu_do_tu_battu(ls_bt, co_gio=co_gio)
    hanh_ten = danh_sach([ten_kb.ten("hanh", h) for h in hanh_thieu])
    vai_ten = dc._VAI_TRO_HANH[hanh_thieu[0]]["vi" if vi else "en"][0]
    muc_nhan = ch_bt.get("muc") if ch_bt else None
    f_nhan = dict(ten=ten_v, ten_hoa=ten_v_hoa, can=vk["can"], hanh=hanh_ten, vai=vai_ten)
    if ch_bt:
        nx_nhan = k["nhan"]["co_muc"].format(**f_nhan, nhan_muc=kh.nhan_muc(muc_nhan), chuong=ch_bt["tieu_de"])
        nguon_nhan = nguon["battu_chuong"].format(chuong=ch_bt["tieu_de"])
        lk_nhan = {"ten": "Bát tự" if vi else "BaZi", "duong": "/bat-tu" if vi else "/en/bazi"}
    else:
        nx_nhan = k["nhan"]["khong_muc"].format(**f_nhan)
        nguon_nhan = nguon["thanso_nam"].format(n=nam_cn)
        lk_nhan = {"ten": "Thần số học" if vi else "Numerology", "duong": "/than-so" if vi else "/en/numerology"}
    hd_nhan = k["nhan"]["hd"].format(vai=vai_ten)

    # ---- THIÊN: mức của NĂM được hỏi (không lặp chương nghề nghiệp) + lịch tháng ---------------------------------------
    muc_mon: dict[str, str | None] = {"tuvi": None, "battu": None}
    chuoi = None
    y_nam = _y_nam(nam_cn)
    f_thien = dict(nam=nam_k, n=nam_cn, y=y_nam)
    if co_gio:
        ti = az.time_index(hh, mm)
        tv_sinh = {"ngay": ngay_sinh, "ti": ti, "gioi_tinh": gioi_tinh, "tz_lich": tz_lich}
        from app.hoidap import tuvi as htv  # noqa: PLC0415
        ls_tv = htv.tom_tat(az.an_sao_tho(ngay_sinh, ti, gioi_tinh, "vi-VN", tz_lich=tz_lich))
        bc_tv = tvd.lap(tv_sinh, hom_nay, ls=ls_tv) if nam_k == hom_nay.year else None
        muc_mon = _muc_nam(nam_k, hom_nay, tv_sinh, sinh_bt, ls_tv, ls_bt, bc_tv, bc_bt)
        a, b = muc_mon["tuvi"], muc_mon["battu"]
        if a and b and a == b:
            cau_muc = k["thien"]["cung_muc"].format(nam=nam_k, muc=kh.nhan_muc(a).lower())
        elif a and b:
            cau_muc = k["thien"]["khac_muc"].format(nam=nam_k, a=kh.nhan_muc(a).lower(), b=kh.nhan_muc(b).lower())
        else:
            mon, m = (("Tử vi" if vi else "Zi Wei"), a) if a else (("Bát tự" if vi else "BaZi"), b)
            cau_muc = k["thien"]["mot_mon"].format(nam=nam_k, mon=mon, muc=kh.nhan_muc(m).lower()) if m else ""
        nx_thien = " ".join(x for x in (cau_muc, k["thien"]["nam_ca_nhan"].format(**f_thien)) if x)
        nguon_thien = nguon["nam_hai_la_so"].format(nam=nam_k) + " · " + nguon["lich_12"].format(them=nguon["lich_12_them"])
        cung_can = _CUNG_MACH.get(mach) or set()
        if cung_can:
            nam_am = lunar.solar_to_lunar(ngay_sinh.day, ngay_sinh.month, ngay_sinh.year, tz_lich)[2]
            ph_kq = ph_luan.lap(ls_tv, lunar.can_chi_nam(nam_am)[0], nam_xem=nam_k)
            chuoi = next((c for c in ph_kq.get("chuoi_chuyen_ky") or []
                          if c.get("ma_den_cung", c.get("den_cung")) in cung_can or c.get("qua_cung") in cung_can), None)
            if chuoi:
                nx_thien += " " + chuoi["nghia"]
        lk_thien = {"ten": "Tử vi" if vi else "Zi Wei Dou Shu", "duong": "/tu-vi" if vi else "/en/zi-wei-dou-shu"}
    else:
        nx_thien = k["thien"]["khong_gio"].format(**f_thien)
        nguon_thien = nguon["lich_12"].format(them="")
        lk_thien = {"ten": "Lịch quyết định 12 tháng" if vi else "12-month calendar", "duong": "/quan-ly-nhan-su#lich-12-thang"}
    muc_thien = muc_mon["tuvi"] if (muc_mon["tuvi"] and muc_mon["tuvi"] == muc_mon["battu"]) else None
    f_hd = dict(viec_nang=vk["viec_nang"])
    if th_mo:
        hd_thien = k["thien"]["hd_thuan"].format(**f_hd, thang=_gop_nhan(th_mo))
    elif th_cham:
        hd_thien = k["thien"]["hd_cham"].format(**f_hd, thang=_gop_nhan(th_cham))
    else:
        hd_thien = k["thien"]["hd_deu"].format(**f_hd)
    if chuoi and chuoi.get("viec_nen_lam"):
        hd_thien = chuoi["viec_nen_lam"]

    # ---- ĐỊA: chỉ khi việc đụng tới không gian; đúng loại hướng (mặt bằng ≠ nhà ở) --------------------------------------
    mq = pt.menh_quai(ngay_sinh.year, gioi_tinh, ngay_sinh)
    ten_quai = ten_kb.ten("quai", mq["quai"])
    can_bo_sung = None
    ba_tru_dia = None
    u_co_dien = None
    muc_dia = None
    if dung_dia and v.khong_gian == "mat_bang":
        mb = dcmb.kiem_tra_mat_bang(
            float(huong_in["do_huong"]), int(huong_in["nam_xay"]) if huong_in.get("nam_xay") else None, ngay_sinh.day, ngay_sinh.month, ngay_sinh.year,
            gioi_tinh, v.loai_hinh or "cua_hang",
            ngay_bat_dau=hom_nay if nam_k == hom_nay.year else dt.date(nam_k, 3, 1))
        kv = {x["ma"]: x for x in mb["danh_sach_khu_vuc"]}
        cua = kv["cua_chinh"]
        muc_dia = _DOI_MUC_MB.get(cua.get("muc"), cua.get("muc"))
        m = mb["mat_bang"]
        hop = m["phuong_huong"] in (m.get("huong_tot") or [])
        f_dia = dict(phuong=m["phuong_huong"], do=m["do_huong"], nhom=m["nhom_menh"], huong_tot=", ".join(m.get("huong_tot") or []))
        nx_dia = k["dia"]["mat_bang_hop" if hop else "mat_bang_kem"].format(**f_dia) + " " + cua["thuan_loi"]
        hd_dia = k["dia"]["mat_bang_hd"].format(
            thu_ngan=kv["thu_ngan"]["phuong_goi_y"], chu=kv["giam_doc"]["phuong_goi_y"],
            tinh=(kv.get("khu_tinh") or {}).get("phuong_goi_y") or kv["cua_chinh"]["phuong_goi_y"], nam=m.get("nam_xem") or nam_k)
        nguon_dia = nguon["mat_bang"].format(do=round(float(huong_in["do_huong"]), 1),
                                              nam=f", {int(huong_in['nam_xay'])}" if huong_in.get("nam_xay") else "")
        lk_dia = {"ten": "Mặt bằng & Khai trương" if vi else "Premises & opening", "duong": "/quan-ly-nhan-su#mat-bang"}
        ba_tru_dia = (muc_dia, nx_dia, hd_dia, nguon_dia, lk_dia)
    elif dung_dia:
        bc_pt = ptds.luan_giai(
            {"nam": ngay_sinh.year, "gioi_tinh": gioi_tinh, "ngay": ngay_sinh},
            {"huong_do": float(huong_in["do_huong"]), **({"nam_xay": int(huong_in["nam_xay"])} if huong_in.get("nam_xay") else {}), "theo": "cua"},
            ngay_xem=hom_nay)
        # chương "Ngôi nhà này với bạn" mới có mức (chương đầu "Bạn hợp hướng nào" không chấm mức — trước đây lấy nhầm chương đầu)
        ch_pt = next((c for c in bc_pt["chuong"] if c["ma"] == "ngoi_nha_voi_ban" and c.get("muc")), bc_pt["chuong"][0])
        muc_dia = ch_pt.get("muc")
        hd_dia = next((h.get("huong_xu_ly") for h in bc_pt.get("cot_loi", []) if h.get("huong_xu_ly")),
                      k["dia"]["nha_o_hd"])
        nx_dia = mau["dia_co_nha"].format(tom=ch_pt.get("tom_tat") or ch_pt["doan"][0])
        nguon_dia = nguon["phongthuy"].format(do=round(float(huong_in["do_huong"]), 1),
                                              nam=f", {int(huong_in['nam_xay'])}" if huong_in.get("nam_xay") else "")
        lk_dia = {"ten": "Phong thuỷ" if vi else "Feng Shui", "duong": "/phong-thuy" if vi else "/en/feng-shui"}
        ba_tru_dia = (muc_dia, nx_dia, hd_dia, nguon_dia, lk_dia)
        if bc_pt.get("ung_dung_co_dien"):
            u_co_dien = {**bc_pt["ung_dung_co_dien"], "ma": "tam_tai_co_dien"}
    elif v.khong_gian in ("mat_bang", "nha_o"):
        cb = k["can_bo_sung"][v.khong_gian]
        ly_do = cb["ly_do_nha_o"] if (co_nha and v.khong_gian == "mat_bang" and vai_nha == "nha_o") else cb["ly_do_thieu"]
        can_bo_sung = {"loai": v.khong_gian, "nhan": cb["nhan"], "ly_do": ly_do, "cach": ["ho_so", "la_ban", "nhap_do", "chon_nhanh"]}

    # ---- NGÀY HỢP VIỆC trong đúng khung (tháng thuận / tháng được hỏi), có lý do -----------------------------------------
    ngay_dep: list[dict] = []
    if v.ma in _CO_NGAY:
        uu_tien: list[dict] = []
        if khung["thang"] is not None:
            uu_tien += [t for t in ds_thang if t["thang"] == khung["thang"]]
        uu_tien += [t for t in ds_thang if t["nhip_thang"] == "day_manh"]
        uu_tien += [t for t in ds_thang if t["nhip_thang"] == "can_bang"]
        da = set()
        for t in uu_tien:
            if t["nhan_thang"] in da or len(da) >= 2:
                continue
            xs = [x for x in t["ngay_dep"] if x.get("diem_cong") and not x.get("ky_dan_gian")][:2]
            if xs:
                da.add(t["nhan_thang"])
                ngay_dep += [{"thang": t["nhan_thang"], "ngay": x["ngay"], "am_lich": x.get("am") or "", "truc": x.get("truc") or "",
                              "ly_do": ", ".join(x["diem_cong"])} for x in xs]

    # ---- CÂU TRẢ LỜI ĐỨNG ĐẦU -----------------------------------------------------------------------------------------
    co_muc = [m for m in (muc_nhan, muc_mon["tuvi"], muc_mon["battu"], muc_dia) if m]
    ngh = _nghieng(co_muc)
    # Thần số: năm cá nhân 4 / 7 nghiêng về chuẩn bị hơn là ra mắt lớn → việc khởi sự không được báo "thuận" trơn (TS_CHAM của lịch).
    nam_cham = _MUC_TIEU[v.ma] == "ra_mat" and nam_cn in dcl.TS_CHAM
    if nam_cham and ngh == "thuan":
        ngh = "can_nhac"
    tl = k["tra_loi"]
    ten_khung = (tl["khung_trong"]["thang"].format(thang=_ten_thang(khung["thang"], nam_k, vi)) if khung["thang"] is not None and not khung["mac_dinh"]
                 else tl["khung_trong"]["mac_dinh"] if khung["mac_dinh"] else tl["khung_trong"]["nam"].format(nam=nam_k))
    if th_mo:
        thoi_diem = tl["thoi_diem"]["co_thuan"].format(thang=_gop_nhan(th_mo))
    else:
        thoi_diem = tl["thoi_diem"]["khong_thuan"]
    if th_cham:
        thoi_diem += tl["thoi_diem"]["co_cham"].format(thang=_gop_nhan(th_cham))
    thang_hoi = None
    if khung["thang"] is not None and not khung["mac_dinh"]:
        th = next((t for t in ds_thang if t["thang"] == khung["thang"]), None)
        if th:
            cau_th = tl["thang_hoi"]["mo"].format(thang=th["nhan_thang"]) + tl["thang_hoi"][th["nhip_thang"]]
            if th["nhip_thang"] != "day_manh":
                gan = [t for t in ds_thang if t["nhip_thang"] == "day_manh"]
                cau_th += (tl["thang_hoi"]["gan_nhat"].format(thang=_gop_nhan([(t["nam"], t["thang"]) for t in gan[:1]]))
                           if gan else tl["thang_hoi"]["khong_co"])
            thang_hoi = {"nhan": th["nhan_thang"], "nhip": th["nhip_thang"], "cau": cau_th}
    tra_loi = {
        "cau": tl["cau"].format(viec_hoa=ten_v_hoa, khung=ten_khung, nghieng=tl["nghieng"][ngh], thoi_diem=thoi_diem)
               + (tl["nam_cham"].format(n=nam_cn) if nam_cham else ""),
        "nghieng": ngh,
        "thang_hoi": thang_hoi,
        "tieu_de_dieu_kien": tl["dieu_kien_dau"],
        "dieu_kien": list(vk["dieu_kien"]),
        "truoc_het": vk["truoc_het"],
        "nen_giu": vk["giu"],
        "tieu_de_nen_giu": mau["nen_giu"],
        "nhan_manh": tl["nhan_manh"],
    }
    kieu_ten = k["hieu_cau"]["kieu"][hc["kieu"]]
    ten_khung_hc = (k["hieu_cau"]["khung"]["mac_dinh"] if khung["mac_dinh"] else
                    k["hieu_cau"]["khung"]["thang"].format(thang=_ten_thang(khung["thang"], nam_k, vi)) if khung["thang"] is not None
                    else k["hieu_cau"]["khung"]["nam"].format(nam=nam_k))
    hieu_cau_ra = {
        "cau": k["hieu_cau"]["dong"].format(viec=ten_v, khung=ten_khung_hc, kieu=kieu_ten),
        "viec": {"ma": v.ma, "ten": ten_v, "khong_gian": v.khong_gian}, "kieu": hc["kieu"],
        "khung": {**khung, "nhan": ten_khung_hc},
        "ghi_chu": (k["hieu_cau"]["ngoai_pham_vi"].format(nam=khung["ngoai_pham_vi"], toi_da=config.hom_nay_vn().year + 1)
                    if khung["ngoai_pham_vi"] else None),
    }

    # ---- lớp đã dùng + gợi ý mở thêm ------------------------------------------------------------------------------------
    lop_da_dung = [k["lop_ten"]["battu_tu_tru" if co_gio else "battu_tam_tru"], k["lop_ten"]["thanso_pitago"]]
    if co_gio:
        lop_da_dung.append(k["lop_ten"]["tuvi_phi_hoa"])
    if dung_dia:
        lop_da_dung.append(k["lop_ten"]["huyen_khong_van_9" if huong_in.get("nam_xay") else "phongthuy_menh_quai"])
    lop_da_dung.append(k["lop_ten"]["hoang_lich_30_ngay"])
    if co_doi_tac:
        lop_da_dung.append(k["lop_ten"]["tuong_tac_doi_tac"])
    goi_y_nang: list[dict] = []
    if not co_gio:
        goi_y_nang.append({"bac_tiep": 2, **k["goi_y_nang_bac"]["bac_2"]})
    if not co_doi_tac and v.ma == "gop_von":
        goi_y_nang.append({"bac_tiep": 3, **k["goi_y_nang_bac"]["bac_3_doi_tac"]})
    bac = 3 if (dung_dia or co_doi_tac) else (2 if co_gio else 1)

    doi_tac_ra = None
    if co_doi_tac:
        dt_ns = dt.date.fromisoformat(str(doi_tac["ngay_sinh"]))
        hs = dc._ho_so_co_ban(dt_ns.day, dt_ns.month, dt_ns.year, doi_tac.get("gioi_tinh") or "nam", hom_nay.year)
        vt_ten, vt_gt = dc._VAI_TRO_HANH[hs["hanh_manh"]]["vi" if vi else "en"]
        doi_tac_ra = {"tieu_de": mau["doi_tac_tieu_de"], "vai_tro": vt_ten, "hanh_manh": ten_kb.ten("hanh", hs["hanh_manh"]),
                      "loi": mau["doi_tac"].format(vai=vt_ten, hanh=ten_kb.ten("hanh", hs["hanh_manh"]), gia_tri=vt_gt.rstrip(". "))}

    def tru(ma: str, muc: str | None, nx: str, hd: str, nguon_tru: str, lk: dict, can_cu: list[str] | None = None, them: dict | None = None) -> dict:
        return {"ma": ma, "ten_tru": k["ten_tru"][ma], "nguon": nguon_tru, "muc": muc, "nhan_muc": kh.nhan_muc(muc),
                "nhan_xet": nx, "hanh_dong": hd, "can_cu": can_cu or [], "lien_ket": lk,
                "ma_mau": kh.ma_mau(MO_DUN, mach, ma, muc or "khong_muc"), **(them or {})}

    ba_tru = {
        "nhan": tru("nhan", muc_nhan, nx_nhan, hd_nhan, nguon_nhan, lk_nhan),
        "thien": tru("thien", muc_thien, nx_thien, hd_thien, nguon_thien, lk_thien,
                     list(chuoi.get("can_cu") or []) if chuoi else None,
                     {"muc_tung_mon": {mon: m for mon, m in muc_mon.items()}, "nhan_tung_mon": {mon: kh.nhan_muc(m) for mon, m in muc_mon.items()}}),
    }
    if ba_tru_dia:
        ba_tru["dia"] = tru("dia", *ba_tru_dia)

    return {
        "mo_dun": MO_DUN,
        "phien_ban": kh.PHIEN_BAN,
        "ten": k["ten_bao_cao"],
        "ngay_xem": hom_nay.isoformat(),
        "trang_thai": k["trang_thai"],
        "source_id": k["source_id"],
        "school_id": k["school_id"],
        "ket": k["ket"],
        "mach": mach,
        "ten_mach": m_kb["ten"],
        "lien_ket_mach": m_kb["lien_ket"],
        "hieu_cau": hieu_cau_ra,
        "tra_loi": tra_loi,
        "bac_dau_vao": bac,
        "lop_da_dung": lop_da_dung,
        "goi_y_nang_bac": goi_y_nang,
        "ba_tru_tam_tai": ba_tru,
        "bieu_do_ngu_hanh": bd_nh,
        "thoi_gian": {"nam": nam_k, "luoi": [{"thang": t["nhan_thang"], "nhip": t["nhip_thang"]} for t in ds_thang],
                      "doan": doan, "cach_lam": cach_lam, "ngay_dep": ngay_dep},
        **({"can_bo_sung": can_bo_sung} if can_bo_sung else {}),
        **({"doi_tac": doi_tac_ra} if doi_tac_ra else {}),
        **({"ung_dung_co_dien": u_co_dien} if u_co_dien else {}),
    }


def _y_nam(n: int) -> str:
    """Nghĩa năm cá nhân từ KB Bản đồ con số (một nguồn với /than-so)."""
    return (nap.doc("thanso_ban_do.json").get("nam_doc_thang") or {}).get(str(n), "")
