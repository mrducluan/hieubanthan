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

from app import config, ngon_ngu
from app.calc import battu as bt_calc, doanh_chu as dc, lunar, phongthuy as pt, thanso, tuvi_an_sao as az
from app.hoidap import chung
from app.hoidap import luan_hoi_khop as lhk
from app.kb import kinhdich_kb, nap, ten as ten_kb
from app.kb.loi import L, danh_sach
from app.luangiai import (
    an_toan as _at,
    battu_doi_song as btd,
    doanh_chu_lich as dcl,
    doanh_chu_ngay as dcn,
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
    mach = nhan_dien_mach(cau_hoi)
    if mach is None:
        return _chuyen_huong("chua_ro", k, hom_nay, ds_mach=True)

    m_kb = k["mach"][mach]
    mau = k["mau"]
    nguon = k["nguon"]
    co_gio = bool(gio_sinh and do_tin_gio != "unknown")
    co_nha = bool(nha and nha.get("do_huong") is not None)
    co_doi_tac = bool(doi_tac and doi_tac.get("ngay_sinh"))
    bac = 3 if (co_nha or co_doi_tac) else (2 if co_gio else 1)

    lop_da_dung = [k["lop_ten"]["battu_tu_tru" if co_gio else "battu_tam_tru"], k["lop_ten"]["thanso_pitago"]]
    if co_gio:
        lop_da_dung.append(k["lop_ten"]["tuvi_phi_hoa"])
    lop_da_dung.append(k["lop_ten"]["huyen_khong_van_9" if (co_nha and nha.get("nam_xay")) else "phongthuy_menh_quai"])
    lop_da_dung.append(k["lop_ten"]["hoang_lich_30_ngay"])
    if co_doi_tac:
        lop_da_dung.append(k["lop_ten"]["tuong_tac_doi_tac"])
    goi_y_nang: list[dict] = []
    if not co_gio:
        goi_y_nang.append({"bac_tiep": 2, **k["goi_y_nang_bac"]["bac_2"]})
    if not co_nha:
        goi_y_nang.append({"bac_tiep": 3, **k["goi_y_nang_bac"]["bac_3_nha"]})
    if not co_doi_tac and mach == "gop_von_hop_tac":
        goi_y_nang.append({"bac_tiep": 3, **k["goi_y_nang_bac"]["bac_3_doi_tac"]})

    nam_cn = int(thanso.nam_ca_nhan(ngay_sinh.day, ngay_sinh.month, hom_nay.year, "duong_lich"))

    # ---- NHÂN ------------------------------------------------------------------------------------------------------
    if co_gio:
        hh, mm = (int(x) for x in str(gio_sinh).split(":"))
        lich_bt = dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, hh, mm)
        ls_bt = bt_calc.la_so(lich_bt, gioi_tinh=gioi_tinh, co_gio=True)
        bc_bt = btd.lap({"lich": lich_bt, "gioi_tinh": gioi_tinh, "gio_ty": "da_ty"}, hom_nay, ls=ls_bt)
        ch_bt = next((c for c in bc_bt["chuong"] if c["ma"] == m_kb["chuong_battu"] and c.get("muc")), None)
        bd_nh, hanh_thieu = _bieu_do_tu_battu(ls_bt, co_gio=True)
        hanh_ten = danh_sach([ten_kb.ten("hanh", h) for h in hanh_thieu])
        muc_nhan = ch_bt.get("muc") if ch_bt else None
        nx_nhan = (mau["nhan_co_gio"].format(chuong=ch_bt["tieu_de"], nhan_muc=kh.nhan_muc(muc_nhan), hanh=hanh_ten)
                   if ch_bt else mau["nhan_khong_gio"].format(hanh=hanh_ten, n=nam_cn, y=_y_nam(nam_cn)))
        nguon_nhan = nguon["battu_chuong"].format(chuong=ch_bt["tieu_de"]) if ch_bt else nguon["thanso_nam"].format(n=nam_cn)
        lk_nhan = {"ten": "Bát tự" if ngon_ngu.la_viet() else "BaZi", "duong": "/bat-tu" if ngon_ngu.la_viet() else "/en/bazi"}
    else:
        ls_bt = bt_calc.la_so(dt.datetime(ngay_sinh.year, ngay_sinh.month, ngay_sinh.day, 12, 0), gioi_tinh=gioi_tinh, co_gio=False)
        bd_nh, hanh_thieu = _bieu_do_tu_battu(ls_bt, co_gio=False)
        hanh_ten = danh_sach([ten_kb.ten("hanh", h) for h in hanh_thieu])
        muc_nhan = None
        nx_nhan = mau["nhan_khong_gio"].format(hanh=hanh_ten, n=nam_cn, y=_y_nam(nam_cn))
        nguon_nhan = nguon["thanso_nam"].format(n=nam_cn)
        lk_nhan = {"ten": "Thần số học" if ngon_ngu.la_viet() else "Numerology",
                   "duong": "/than-so" if ngon_ngu.la_viet() else "/en/numerology"}
    fmt = {"hanh_can": hanh_ten, "nam_cn": nam_cn}

    # ---- THIÊN -----------------------------------------------------------------------------------------------------
    muc_tieu_lich = ("ra_mat" if mach in ("su_nghiep_chuyen_viec", "nha_cua_mat_bang") else "ky_ket" if mach == "gop_von_hop_tac"
                     else "giu_tien" if mach == "tai_chinh_dau_tu" else "tang_truong")
    lich_12 = dcl.lich_quyet_dinh_12_thang(
        ngay=ngay_sinh.day, thang=ngay_sinh.month, nam=ngay_sinh.year, gioi_tinh=gioi_tinh,
        gio=gio_sinh if co_gio else None, muc_tieu=muc_tieu_lich, tu=hom_nay)
    nhip_12 = [{"thang": th["nhan_thang"], "nhip": th["nhip_thang"], "nhan_nhip": k["nhan_nhip_thang"][th["nhip_thang"]],
                "goi_y": th["nen_lam"]} for th in lich_12["muoi_hai_thang"]]
    th_mo = [x["thang"] for x in nhip_12 if x["nhip"] == "day_manh"][:3]
    th_giu = [x["thang"] for x in nhip_12 if x["nhip"] == "phong_thu"][:3]
    cau_lich = mau["thien_lich"].format(mo=", ".join(th_mo) or mau["khong_co"], giu=", ".join(th_giu) or mau["khong_co"])
    nguon_lich = nguon["lich_12"].format(them=nguon["lich_12_them"] if co_gio else "")
    muc_thien = None
    chuoi = None
    if co_gio:
        ti = az.time_index(hh, mm)
        bc_tv = tvd.lap({"ngay": ngay_sinh, "ti": ti, "gioi_tinh": gioi_tinh, "tz_lich": tz_lich}, hom_nay)
        ch_tv = next((c for c in bc_tv["chuong"] if c["ma"] == m_kb["cung_tuvi"] and c.get("muc")), None)
        muc_thien = ch_tv.get("muc") if ch_tv else None
        nx_thien = (mau["thien_co_gio"].format(chuong=ch_tv["tieu_de"], nhan_muc=kh.nhan_muc(muc_thien)) + " " + cau_lich
                    if ch_tv else cau_lich)
        nguon_thien = (nguon["tuvi_chuong"].format(chuong=ch_tv["tieu_de"]) + " · " + nguon_lich) if ch_tv else nguon_lich
        cung_can = _CUNG_MACH.get(mach) or set()
        if cung_can:
            from app.hoidap import tuvi as htv  # noqa: PLC0415
            ls_tv = htv.tom_tat(az.an_sao_tho(ngay_sinh, ti, gioi_tinh, "vi-VN", tz_lich=tz_lich))
            nam_am = lunar.solar_to_lunar(ngay_sinh.day, ngay_sinh.month, ngay_sinh.year, tz_lich)[2]
            ph_kq = ph_luan.lap(ls_tv, lunar.can_chi_nam(nam_am)[0], nam_xem=hom_nay.year)
            chuoi = next((c for c in ph_kq.get("chuoi_chuyen_ky") or []
                          if c.get("ma_den_cung", c.get("den_cung")) in cung_can or c.get("qua_cung") in cung_can), None)
        lk_thien = {"ten": "Tử vi" if ngon_ngu.la_viet() else "Zi Wei Dou Shu",
                    "duong": "/tu-vi" if ngon_ngu.la_viet() else "/en/zi-wei-dou-shu"}
    else:
        nx_thien = cau_lich
        nguon_thien = nguon_lich
        lk_thien = {"ten": "Lịch quyết định 12 tháng" if ngon_ngu.la_viet() else "12-month calendar",
                    "duong": "/quan-ly-nhan-su#lich-12-thang"}
    hd_thien = chuoi["viec_nen_lam"] if chuoi else nhip_12[0]["goi_y"]

    # ---- ĐỊA -------------------------------------------------------------------------------------------------------
    mq = pt.menh_quai(ngay_sinh.year, gioi_tinh, ngay_sinh)
    ten_quai = ten_kb.ten("quai", mq["quai"])
    bh = pt.bang_huong(mq["quai"])
    huong_sinh_khi = next((ten_kb.ten("huong", p) for p, dn in bh.items() if dn == "Sinh Khí"), "")
    fmt["quai"] = ten_quai
    u_co_dien = None
    muc_dia = None
    if co_nha:
        bc_pt = ptds.luan_giai(
            {"nam": ngay_sinh.year, "gioi_tinh": gioi_tinh, "ngay": ngay_sinh},
            {"huong_do": float(nha["do_huong"]), **({"nam_xay": int(nha["nam_xay"])} if nha.get("nam_xay") else {}), "theo": "cua"},
            ngay_xem=hom_nay)
        ch_pt = bc_pt["chuong"][0]
        muc_dia = ch_pt.get("muc")
        nx_dia = mau["dia_co_nha"].format(tom=ch_pt.get("tom_tat") or ch_pt["doan"][0])
        hd_dia = next((h.get("huong_xu_ly") for h in bc_pt.get("cot_loi", []) if h.get("huong_xu_ly")),
                      mau["dia_hd_khong_nha"].format(huong=huong_sinh_khi))
        nguon_dia = nguon["phongthuy"].format(do=round(float(nha["do_huong"]), 1),
                                              nam=f", {int(nha['nam_xay'])}" if nha.get("nam_xay") else "")
        if bc_pt.get("ung_dung_co_dien"):
            u_co_dien = {**bc_pt["ung_dung_co_dien"], "ma": "tam_tai_co_dien"}
    else:
        nx_dia = mau["dia_khong_nha"].format(quai=ten_quai, huong=huong_sinh_khi)
        hd_dia = mau["dia_hd_khong_nha"].format(huong=huong_sinh_khi)
        nguon_dia = nguon["menh_quai"]
    lk_dia = {"ten": "Phong thuỷ" if ngon_ngu.la_viet() else "Feng Shui",
              "duong": "/phong-thuy" if ngon_ngu.la_viet() else "/en/feng-shui"}

    try:
        ds_ngay_raw = dcn.ngay_tot(m_kb["viec_hoang_lich"], hom_nay, hom_nay + dt.timedelta(days=30), ngay_sinh, 3)
    except (KeyError, ValueError):
        ds_ngay_raw = dcn.ngay_tot("ky_ket", hom_nay, hom_nay + dt.timedelta(days=30), ngay_sinh, 3)
    ngay_dep = [{"ngay": x["ngay"], "am_lich": x.get("am") or "", "truc": x.get("truc") or "",
                 "ly_do": ", ".join(x.get("diem_cong") or [])} for x in ds_ngay_raw]

    doi_tac_ra = None
    if co_doi_tac:
        dt_ns = dt.date.fromisoformat(str(doi_tac["ngay_sinh"]))
        hs = dc._ho_so_co_ban(dt_ns.day, dt_ns.month, dt_ns.year, doi_tac.get("gioi_tinh") or "nam", hom_nay.year)
        vt_ten, vt_gt = dc._VAI_TRO_HANH[hs["hanh_manh"]]["vi" if ngon_ngu.la_viet() else "en"]
        doi_tac_ra = {"tieu_de": mau["doi_tac_tieu_de"], "vai_tro": vt_ten, "hanh_manh": ten_kb.ten("hanh", hs["hanh_manh"]),
                      "loi": mau["doi_tac"].format(vai=vt_ten, hanh=ten_kb.ten("hanh", hs["hanh_manh"]), gia_tri=vt_gt.rstrip(". "))}

    # ---- TỔNG QUAN: liệt kê, không gộp -------------------------------------------------------------------------------
    co_muc = [(k["ten_tru"][ma], m) for ma, m in (("nhan", muc_nhan), ("thien", muc_thien), ("dia", muc_dia)) if m]
    ds_txt = "; ".join(f"{ten}: {kh.nhan_muc(m)}" for ten, m in co_muc)
    if len(co_muc) >= 2 and len({m for _, m in co_muc}) == 1:
        tong = mau["tong_cung"].format(muc=kh.nhan_muc(co_muc[0][1]))
    elif len(co_muc) >= 2:
        tong = mau["tong_khac"].format(ds=ds_txt)
    elif co_muc:
        tong = mau["tong_mot"].format(ds=ds_txt)
    else:
        tong = k["ket"]

    def tru(ma: str, muc: str | None, nx: str, hd: str, nguon_tru: str, lk: dict, can_cu: list[str] | None = None) -> dict:
        return {"ma": ma, "ten_tru": k["ten_tru"][ma], "nguon": nguon_tru, "muc": muc, "nhan_muc": kh.nhan_muc(muc),
                "nhan_xet": nx, "hanh_dong": hd, "can_cu": can_cu or [], "lien_ket": lk,
                "ma_mau": kh.ma_mau(MO_DUN, mach, ma, muc or "khong_muc")}

    ba_tru = {
        "nhan": tru("nhan", muc_nhan, nx_nhan, m_kb["diem_tua"].format(**fmt), nguon_nhan, lk_nhan),
        "thien": tru("thien", muc_thien, nx_thien + (" " + chuoi["nghia"] if chuoi else ""), hd_thien, nguon_thien, lk_thien,
                     list(chuoi.get("can_cu") or []) if chuoi else None),
        "dia": tru("dia", muc_dia, nx_dia, hd_dia, nguon_dia, lk_dia),
    }
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
        "bac_dau_vao": bac,
        "lop_da_dung": lop_da_dung,
        "goi_y_nang_bac": goi_y_nang,
        "tong_quan": {"cau": tong, "nen_giu": m_kb["diem_giu"].format(**fmt), "tieu_de_nen_giu": mau["nen_giu"]},
        "ba_tru_tam_tai": ba_tru,
        "bieu_do_ngu_hanh": bd_nh,
        "nhip_12_thang": nhip_12,
        "ngay_dep_30_ngay": ngay_dep,
        **({"doi_tac": doi_tac_ra} if doi_tac_ra else {}),
        **({"ung_dung_co_dien": u_co_dien} if u_co_dien else {}),
    }


def _y_nam(n: int) -> str:
    """Nghĩa năm cá nhân từ KB Bản đồ con số (một nguồn với /than-so)."""
    return (nap.doc("thanso_ban_do.json").get("nam_doc_thang") or {}).get(str(n), "")
