# -*- coding: utf-8 -*-
"""Hỏi đáp Bát tự (HH-3) — RULES: phân loại, chọn khối bằng chứng từ tứ trụ (CALC
app.calc.battu) + KB; NARRATIVE: template (+ LLM có kiểm tra).

Kỷ luật:
  - LLM không tính can chi, tiết khí, đại vận — engine tính (tiết khí VSOP87, golden lunar-typescript).
  - Dụng thần: trình bày cả phù ức/điều hậu (Trích Thiên Tuỷ) và cách cục (Tử Bình Chân Thuyên),
    không tự chọn. Thân vượng/nhược theo thang điểm công bố.
  - Không phán thọ, bệnh, "khắc chồng khắc con"; không chọn giờ sinh / đặt tên cho con.
"""
from __future__ import annotations

import collections
import datetime as dt
import re

from app.calc import battu_mo_rong, battu as bt
from app.hoidap import chung
from app.kb import battu_kb as kb
from app.luangiai import hoi as _h
from app.narrative import hoi_van
from app.narrative.ngan_sach import mo_ta_loi

CAN_KD = {"giap": "Giáp", "at": "Ất", "binh": "Bính", "dinh": "Đinh", "mau": "Mậu", "ky": "Kỷ",
          "canh": "Canh", "tan": "Tân", "nham": "Nhâm", "quy": "Quý"}
MUA_KW = {"xuan": r"mua xuan", "ha": r"mua (ha|he)", "thu": r"mua thu", "dong": r"mua dong"}
TT_KW = {t: chung.chuan_hoa(t) for t in ["Tỷ Kiên", "Kiếp Tài", "Thực Thần", "Thương Quan", "Thiên Tài",
                                          "Chính Tài", "Thất Sát", "Chính Quan", "Thiên Ấn", "Chính Ấn"]}
NHOM_KW = {"Tài": [r"tai tinh"], "Quan Sát": [r"quan tinh", r"phu tinh"], "Ấn": [r"an tinh"],
           "Thực Thương": [r"thuc thuong"], "Tỷ Kiếp": [r"ty kiep"]}
CA_NHAN = [r"toi", r"cua minh", r"minh co", r"em co", r"cua em", r"la so cua"]
HOP = [r"hop bat tu", r"hop nhau", r"xung nhau", r"xem hop", r"nhat chu \w+ va nhat chu", r"hai vo chong",
       r"hop voi (anh|chi|chong|vo|nguoi)"]
CON = [r"(cho|cua) con toi", r"con toi (sinh|thieu|thua)", r"sinh con gio", r"dat ten", r"be nha toi",
       r"con (gai|trai) (toi|minh|em)"]                                       # HH-CT2
NGUOI_KHAC = [r"(cho|giup) (chong|vo|me|bo|ban gai|ban trai|nguoi yeu|sep) toi",
              r"(chong|vo|me|bo|nguoi yeu|sep) toi (sinh|tuoi|co)"]
VAN = [r"dai van", r"luu nien", r"nam nay", r"nam sau", r"muoi nam", r"10 nam", r"nam nao", r"van nao",
       r"khoi van", r"nam 20\d\d"]
# QA-RV: tên thần sát (khớp không dấu) — câu "có Đào Hoa không", "quý nhân ở đâu"…
THAN_SAT_KW = {t: chung.chuan_hoa(t) for t in battu_mo_rong._Y}
THAN_SAT_KW["Thiên Ất Quý Nhân"] = r"quy nhan|thien at"
CHU_DE = [
    ("than_sat", [r"than sat", r"sao (tot|xau) (gi|nao)", r"co sao gi", r"dao hoa", r"quy nhan", r"thien at",
                  r"dich ma", r"hoa cai", r"van xuong", r"dao hoa", r"hong diem", r"co than", r"qua tu",
                  r"khoi cuong", r"duong nhan", r"loc than", r"kim du", r"thien duc", r"nguyet duc",
                  r"tuong tinh", r"kiep sat", r"vong than"]),
    ("xung_hop", [r"xung hop", r"hop xung", r"hinh xung", r"xung pha", r"luc hop", r"tam hop", r"luc xung",
                  r"tu hinh", r"tuong hinh", r"luc hai", r"ngu hop", r"co xung", r"bi xung", r"tru (nao )?xung"]),
    # HH-CT2: "tính cách gì" không phải hỏi cách cục
    ("cach_cuc", [r"cach cuc", r"(?<!tinh )cach gi", r"thuoc cach", r"(?<!tinh )cach (nao|tot|xau)"]),
    ("tru", [r"tru (nam|thang|ngay|gio)"]),
    ("hon_nhan", [r"hon nhan", r"vo chong", r"phu tinh", r"the tinh", r"nguoi yeu", r"ban doi", r"tinh duyen"]),
    ("nghe_tien", [r"nghe", r"nganh", r"kinh doanh", r"lam cong", r"quan ly", r"tai tinh", r"quan tinh",
                   r"tien", r"giau", r"tich luy", r"dau tu", r"chinh tai hay thien tai", r"tai loc", r"tai van"]),
    ("ngu_hanh", [r"thieu hanh", r"ngu hanh", r"vuong suy", r"than vuong", r"than nhuoc", r"dung than",
                  r"hy than", r"ky than", r"mau gi", r"huong gi", r"bo sung", r"can bang", r"khi hau",
                  r"hanh gi", r"lan at", r"nhat chu toi yeu",
                  r"thieu (kim|moc|thuy|hoa|tho)\b", r"(deo|mang|dung) (gi|da gi|vat gi)"]),
    ("loi_song", [r"loi song", r"sinh hoat", r"suc khoe", r"song the nao"]),
    ("gia_dinh", [r"cha me", r"to tien", r"anh em", r"con cai", r"gan bo me", r"gia dinh"]),
    ("thap_than", [r"thap than", r"tang can"]),
]
TRU_TEN = {"nam": "năm", "thang": "tháng", "ngay": "ngày", "gio": "giờ"}


def _can_nhac(t: str) -> list[str]:
    return [CAN_KD[m] for m in re.findall(r"nhat chu (giap|at|binh|dinh|mau|ky|canh|tan|nham|quy)\b", t)]


def _giai_thich_khop(t: str) -> list[str]:
    return [ma for ma, m in kb.giai_thich_tat_ca().items() if chung.co(t, m["tu_khoa"])]


def phan_loai(cau_hoi: str) -> dict:
    gioi_thieu, t_chinh = _h._tach_gioi_thieu(cau_hoi)
    t = chung.chuan_hoa(cau_hoi)
    kq = {"cau_chuan_hoa": t, "loai": None, "xu_ly": "tra_loi", "chu_de": None,
          "can": _can_nhac(t_chinh), "mua": next((k for k, m in MUA_KW.items() if re.search(m, t)), None),
          "thap_than": [k for k, m in TT_KW.items() if chung.co(t_chinh, [m])],
          "nhom": [k for k, m in NHOM_KW.items() if chung.co(t_chinh, m)],
          "tru": [TRU_TEN[m] for m in re.findall(r"tru (nam|thang|ngay|gio)", t_chinh)],
          "giai_thich": _giai_thich_khop(t_chinh), "ca_nhan": chung.co(t_chinh, CA_NHAN),
          "nam_xem": None}
    m = re.search(r"nam (20\d\d)", t)
    kq["nam_xem"] = int(m.group(1)) if m else None
    db = chung.dac_biet(t)
    if db:
        kq.update(xu_ly=db, loai="dac_biet")
        return kq
    if chung.co(t, HOP):
        kq["loai"] = "hop"
    elif chung.co(t, CON):
        kq["loai"] = "con"
    elif chung.co(t, NGUOI_KHAC):
        kq["loai"] = "nguoi_khac"
    elif kq["can"] and not kq["ca_nhan"]:
        kq["loai"] = "nhat_chu_chung"
    elif kq["thap_than"] and not kq["ca_nhan"] and not kq["giai_thich"]:
        kq["loai"] = "thap_than_chung"
    elif kq["giai_thich"] and not kq["ca_nhan"]:
        kq["loai"] = "ky_thuat"
    elif chung.co(t_chinh, VAN):
        kq.update(loai="van", xu_ly="tra_loi_kem_luu_y")
    else:
        kq["loai"] = "la_so"
        kq["chu_de"] = next((cd for cd, mau in CHU_DE if chung.co(t_chinh, mau)), None)
        if kq["thap_than"] or kq["nhom"]:
            kq["chu_de"] = kq["chu_de"] if kq["chu_de"] in ("nghe_tien", "hon_nhan") else "thap_than"
        kq["chu_de"] = kq["chu_de"] or "tinh_cach"
        if kq["chu_de"] in ("loi_song", "nghe_tien"):
            kq["xu_ly"] = "tra_loi_kem_luu_y"
    return kq


# ------------------------------------------------------------------ gói bằng chứng
def _tru_str(ls: dict) -> str:
    return " · ".join(f"{t['can']} {t['chi']}" for t in ls["tru"])


def _dem_tt(ls: dict) -> collections.Counter:
    """Đếm thập thần lộ (3 can) + bản khí 4 chi."""
    c = collections.Counter(x for i, x in enumerate(ls["thap_than_can"]) if i != 2)
    c.update(x[0] for x in ls["thap_than_chi"])
    return c


def _m_nhat_chu(ls: dict | None, can: str, mua: str | None = None) -> dict:
    n = kb.nhat_chu(can)
    m = {"loai": "nhat_chu", "can": can, **n}
    if mua:
        m["y_mua"] = n["mua"][mua]
    return m


def _m_tt(ten: str, so_lan: int | None = None, vi_tri: str | None = None) -> dict:
    return {"loai": "thap_than", "ten": ten, "so_lan": so_lan, "vi_tri": vi_tri, **kb.thap_than(ten)}


def _m_ngu_hanh(ls: dict) -> list[dict]:
    nh = ls["ngu_hanh"]
    out = [{"loai": "ngu_hanh", "diem": nh["diem"], "thieu": nh["thieu"], "nhieu_nhat": nh["nhieu_nhat"],
            "than": ls["than"], "diem_hien_thi": ", ".join(f"{h} {v:g}" for h, v in nh["diem"].items()),
            "ti_le_hien_thi": f"{ls['than']['ti_le']:g}", **kb.meta()}]
    for h in nh["thieu"][:2]:
        out.append({"loai": "hanh", "hanh": h, "vai": "thieu", **kb.ngu_hanh(h)})
    out.append({"loai": "hanh", "hanh": nh["nhieu_nhat"], "vai": "nhieu", **kb.ngu_hanh(nh["nhieu_nhat"])})
    return out


def _m_dung_than(ls: dict) -> dict:
    d = ls["dung_than"]
    b = kb.dieu_hau(ls["nhat_chu"]["can"], ls["tru"][1]["chi"])
    ctbg = battu_mo_rong.dieu_hau_ctbg(ls, b["can"]) if b else None
    return {"loai": "dung_than", "phu_uc": d["phu_uc"], "dieu_hau": d["dieu_hau"], "cach_cuc": d["cach_cuc"],
            "y_cach": kb.cach_cuc(d["cach_cuc"]["ten"]), "tbct": kb.cach_cuc_tbct(d["cach_cuc"]["ma"]),
            "chon": None, "ctbg": ctbg,
            "nhat_chu": ls["nhat_chu"]["can"], "thang": ls["tru"][1]["chi"], **kb.meta()}


def goi_bang_chung(pl: dict, ls: dict | None, gioi_tinh: str | None, nam_xem: int,
                   ngay_hien_tai: dt.date | None = None) -> dict:
    """`ngay_hien_tai`: câu hỏi về HIỆN TẠI (không nêu năm) → đại vận đang đi theo ngày khởi vận; câu nêu năm → đại vận
    giữ phần lớn năm đó."""
    goi = {"phan_loai": {k: pl[k] for k in ("loai", "chu_de", "xu_ly")},
           "muc": [], "can_them": [], "mau": None, "luu_y": None}
    muc = goi["muc"]
    if pl["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        from app.kb import kinhdich_kb  # noqa: PLC0415 — mẫu dùng chung Huyền học
        goi["mau"] = kinhdich_kb.mau("an_toan" if pl["xu_ly"] == "an_toan" else "tu_choi")
        return chung.ket(goi)
    for ma in pl["giai_thich"][:2]:
        g = kb.giai_thich(ma)
        if g:
            muc.append({"loai": "giai_thich", "ma": ma, **g})
    loai = pl["loai"]
    if loai in ("hop", "con", "nguoi_khac"):
        goi["can_them"] = ["la_so_nguoi_kia"]
        goi["mau"] = kb.mau(loai)
        if loai == "hop" and ls is not None:          # phần của chính người hỏi vẫn đọc được
            muc.append({"loai": "tru", "ten": "ngày", "noi_dung": kb.tru("ngày"),
                        "can_chi": f"{ls['tru'][2]['can']} {ls['tru'][2]['chi']}", **kb.meta()})
        return chung.ket(goi)
    if loai == "ky_thuat":
        return chung.ket(goi)
    if loai == "nhat_chu_chung":
        for c in pl["can"][:2]:
            muc.append(_m_nhat_chu(None, c, pl["mua"]))
        return chung.ket(goi)
    if loai == "thap_than_chung":
        for t in pl["thap_than"][:2]:
            muc.append(_m_tt(t))
        return chung.ket(goi)
    if ls is None:
        goi["can_them"] = ["la_so"]
        goi["mau"] = kb.mau("can_la_so")
        return chung.ket(goi)

    muc.append({"loai": "tu_tru", "tru": _tru_str(ls), "nhat_chu": ls["nhat_chu"], **kb.meta()})
    dm = ls["nhat_chu"]["can"]
    if loai == "van":
        dv = bt.dai_van_theo_ngay(ls, ngay_hien_tai) if ngay_hien_tai else bt.dai_van_tai(ls, nam_xem)
        ds = ls["dai_van"]["ds"]
        muc.append({"loai": "khoi_van", **ls["dai_van"]["khoi_van"], "thuan": ls["dai_van"]["thuan"],
                    "ngay_khoi": ls["dai_van"]["ngay_khoi"], **kb.meta()})
        if dv:
            muc.append({"loai": "dai_van", "vai": "hien_tai", **dv, "thap_than": bt.thap_than(dm, dv["can"]),
                        "y_tt": kb.thap_than(bt.thap_than(dm, dv["can"]))["y_nghia"], **kb.meta()})
            if chung.co(pl["cau_chuan_hoa"], [r"dai van toi", r"muoi nam", r"10 nam", r"van sau"]):
                sau = next((d for d in ds if d["tu_nam"] == dv["den_nam"] + 1), None)
                if sau:
                    muc.append({"loai": "dai_van", "vai": "ke_tiep", **sau, "thap_than": bt.thap_than(dm, sau["can"]),
                                "y_tt": kb.thap_than(bt.thap_than(dm, sau["can"]))["y_nghia"], **kb.meta()})
        ln = bt.luu_nien(ls, nam_xem)
        muc.append({"loai": "luu_nien", **ln, "y_tt": kb.thap_than(ln["thap_than"])["y_nghia"], **kb.meta()})
        if chung.co(pl["cau_chuan_hoa"], [r"nam nao", r"van nao"]):
            muc.append({"loai": "cac_dai_van", "ds": [{"can": d["can"], "chi": d["chi"], "tu_nam": d["tu_nam"],
                                                        "den_nam": d["den_nam"],
                                                        "thap_than": bt.thap_than(dm, d["can"])} for d in ds],
                        "dung_than_phu_uc": ls["dung_than"]["phu_uc"]["hanh"], **kb.meta()})
        goi["luu_y"] = kb.luu_y("van")
        return chung.ket(goi)

    cd = pl["chu_de"]
    tt_dem = _dem_tt(ls)
    if cd == "than_sat":
        ts = battu_mo_rong.than_sat(ls["tru"])
        hoi = [ten for ten, mau in THAN_SAT_KW.items() if re.search(mau, pl["cau_chuan_hoa"])]
        muc.append({"loai": "than_sat", "ds": ts, "hoi": hoi, "tru_ten": list(TRU_TEN.values()), **kb.meta()})
        goi["luu_y"] = ("Thần sát là lớp phụ trong Tử Bình — sách Trích Thiên Tuỷ coi nhẹ thần sát so với ngũ hành "
                        "và thập thần; đọc như sắc thái, không như điềm báo.")
        return chung.ket(goi)
    if cd == "xung_hop":
        muc.append({"loai": "xung_hop", "ds": battu_mo_rong.quan_he(ls["tru"]), **kb.meta()})
        return chung.ket(goi)
    if cd == "cach_cuc":
        muc.append(_m_dung_than(ls))
        goi["luu_y"] = kb.luu_y("ung_dung")
        return chung.ket(goi)
    if cd in ("tinh_cach", "ngu_hanh", "loi_song"):
        muc.append(_m_nhat_chu(ls, dm))
    if cd in ("ngu_hanh", "loi_song", "tinh_cach"):
        muc.extend(_m_ngu_hanh(ls))
    if cd == "ngu_hanh":
        muc.append(_m_dung_than(ls))
        goi["luu_y"] = kb.luu_y("ung_dung")
    if cd == "ngu_hanh" and re.search(r"dung than|hy than|ky than", pl["cau_chuan_hoa"]):
        dt_ = next(m for m in muc if m["loai"] == "dung_than")      # hỏi thẳng dụng thần → trả lời trước
        muc.remove(dt_)
        muc.insert(1, dt_)
    if cd == "loi_song":
        goi["luu_y"] = kb.luu_y("suc_khoe")
    if cd == "tinh_cach":
        noi = [t for t, n in tt_dem.most_common(2) if n >= 1]
        for t in noi[:1]:
            muc.append(_m_tt(t, tt_dem[t]))
    if cd == "thap_than":
        ten = pl["thap_than"] or [t for t in kb.ten_thap_than() if kb.thap_than(t)["nhom"] in pl["nhom"]]
        ten = ten or [t for t, _ in tt_dem.most_common(3)]
        for t in ten[:3]:
            muc.append(_m_tt(t, tt_dem.get(t, 0)))
        if "tang_can" in pl["giai_thich"] or chung.co(pl["cau_chuan_hoa"], [r"tang can"]):
            muc.append({"loai": "tang_can", "tang_can": ls["tang_can"], "tru_ten": list(TRU_TEN.values()),
                        **kb.meta()})
    if cd == "nghe_tien":
        for t in pl["thap_than"][:1]:
            muc.append(_m_tt(t, tt_dem.get(t, 0)))
        for t in ("Chính Tài", "Thiên Tài", "Chính Quan", "Thất Sát", "Thực Thần", "Thương Quan"):
            if tt_dem.get(t) and t not in pl["thap_than"][:1]:
                muc.append(_m_tt(t, tt_dem[t]))
        if not any(m["loai"] == "thap_than" for m in muc):
            muc.append({"loai": "ghi_chu", "noi_dung": "Lá số không lộ rõ Tài, Quan hay Thực Thương ở can và bản khí — cần xét tàng can và đại vận."})
        muc.append(_m_dung_than(ls))
        goi["luu_y"] = kb.luu_y("ung_dung")
    if cd == "hon_nhan":
        muc.append({"loai": "tru", "ten": "ngày", "noi_dung": kb.tru("ngày"),
                    "can_chi": f"{ls['tru'][2]['can']} {ls['tru'][2]['chi']}", **kb.meta()})
        sao = ("Chính Tài", "Thiên Tài") if gioi_tinh == "nam" else ("Chính Quan", "Thất Sát")
        for t in sao:
            muc.append(_m_tt(t, tt_dem.get(t, 0), "thê tinh" if gioi_tinh == "nam" else "phu tinh"))
    if cd in ("tru", "gia_dinh"):
        ten = pl["tru"] or (["năm", "tháng"] if chung.co(pl["cau_chuan_hoa"], [r"to tien", r"cha me", r"anh em", r"gan bo me", r"gia dinh"])
                            else ["giờ"])
        idx = {"năm": 0, "tháng": 1, "ngày": 2, "giờ": 3}
        for tn in ten[:2]:
            i = idx[tn]
            muc.append({"loai": "tru", "ten": tn, "noi_dung": kb.tru(tn),
                        "can_chi": f"{ls['tru'][i]['can']} {ls['tru'][i]['chi']}",
                        "thap_than": ls["thap_than_can"][i], "tang_can": ls["tang_can"][i],
                        "tang_can_tt": ls["thap_than_chi"][i], **kb.meta()})
    return chung.ket(goi)


# ------------------------------------------------------------------ NARRATIVE (template)
def _doan(m: dict) -> tuple[str, str | None]:
    l = m["loai"]
    if l == "than_sat":
        tt = m["tru_ten"]
        co = {x["ten"] for x in m["ds"]}
        dau = ""
        if m["hoi"]:
            khong = [h for h in m["hoi"] if h not in co]
            if khong:
                dau = f"Tứ trụ của bạn không có {', '.join(khong)}. "
        if not m["ds"]:
            return dau + "Tứ trụ không mang thần sát nào trong bảng hệ thống đang xét.", None
        ds = "; ".join(f"{x['ten']} ({x['loai']}, ở trụ {', '.join(tt[i] for i in x['tru'])}): {x['y']}"
                       for x in m["ds"])
        return dau + f"Thần sát trên tứ trụ — {ds}.", None
    if l == "xung_hop":
        if not m["ds"]:
            return "Các trụ không có hợp, xung, hình, hại hay phá đáng kể với nhau.", None
        return ("Quan hệ giữa các trụ: " + "; ".join(x["mo_ta"] for x in m["ds"]) +
                ". Hợp là gắn kết hay níu giữ, xung là va chạm hay thay đổi, hình là tự gây áp lực — "
                "trụ ngày–giờ liên quan bản thân và con cái, năm–tháng liên quan gốc gác, cha mẹ.", None)
    if l == "tu_tru":
        nc = m["nhat_chu"]
        return (f"Tứ trụ (năm · tháng · ngày · giờ): {m['tru']}. Nhật chủ {nc['can']} "
                f"({nc['am_duong']} {nc['ngu_hanh']}).", None)
    if l == "nhat_chu":
        s = (f"Nhật chủ {m['can']} — hình tượng {m['hinh_tuong']} (hành {m['ngu_hanh']}): {m['tinh_chat']}. "
             f"Điểm mạnh: {m['diem_manh']}. Mặt tối: {m['mat_toi']}.")
        if m.get("y_mua"):
            s += f" {m['y_mua']}"
        return s, m["cau_tu_soi"]
    if l == "thap_than":
        s = f"{m['ten']} ({m['nhom']})"
        if m.get("vi_tri"):
            s += f" — {m['vi_tri']}"
        if m.get("so_lan") is not None:
            s += f", xuất hiện {m['so_lan']} lần ở can và bản khí" if m["so_lan"] else ", không lộ ở can và bản khí"
        s += (f": {m['y_nghia']} Tính cách: {m['tinh_cach']}. Khi quá nhiều: {m['khi_nhieu']}; "
              f"khi thiếu: {m['khi_thieu']}. Với nam chỉ {m['nam']}; với nữ chỉ {m['nu']}.")
        return s, m["cau_tu_soi"]
    if l == "ngu_hanh":
        d, th = m["diem_hien_thi"], m["than"]
        s = (f"Ngũ hành (thang điểm hệ thống): {d}. Nhiều nhất: {m['nhieu_nhat']}"
             f"{'; thiếu hẳn: ' + ', '.join(m['thieu']) if m['thieu'] else ''}. Thân {th['ket_luan']} "
             f"(tỉ lệ trợ lực {m['ti_le_hien_thi']}{', đắc lệnh' if th['dac_lenh'] else ', thất lệnh'}). {th['thang_diem']}")
        return s, None
    if l == "hanh":
        vai = "Hành thiếu" if m["vai"] == "thieu" else "Hành nổi trội"
        chi = m["khi_thieu"] if m["vai"] == "thieu" else m["khi_thua"]
        return f"{vai} — {m['hanh']} ({m['tinh_chat']}): {chi}. Ứng dụng dân gian: {m['ung_dung']}.", None
    if l == "dung_than":
        pu, dh, cc = m["phu_uc"], m["dieu_hau"], m["cach_cuc"]
        s = (f"Dụng thần — hai cách, hệ thống không tự chọn. Phù ức (Trích Thiên Tuỷ, {pu['giai_thich']}): "
             f"{', '.join(pu['hanh']) or 'cân bằng, không cần phù hay ức rõ'}. Điều hậu ({dh['giai_thich']}): "
             f"{', '.join(dh['hanh']) or 'không cần'}. Cách cục theo nguyệt lệnh (Tử Bình Chân Thuyên): {cc['ten']}"
             f" (can {cc['can']}{', lộ ra thiên can' if cc['thau'] else ''}).")
        if m.get("y_cach"):
            s += f" {m['y_cach']}"
        if m.get("tbct"):
            s += f" Hỷ: {m['tbct']['hy']} Kỵ: {m['tbct']['ky']}"
        if cc.get("ma") in ("kien_loc", "duong_nhan", "nguyet_kiep"):
            khac = ", ".join(f"{x['can']} ({x['thap_than']})" for x in cc.get("can_thau_khac", []))
            s += f" Can lộ khác để xét dụng: {khac}." if khac else " Chưa có Tài, Quan, Sát hay Thực lộ ra để dùng."
        if m.get("ctbg"):
            ds = ", ".join(f"{x['can']} ({x['thap_than']}, {'đã lộ' if x['thau'] else 'tàng trong chi' if x['tang'] else 'chưa có'})"
                           for x in m["ctbg"]["chi_tiet"])
            s += (f" Theo bảng điều hậu Cùng Thông Bảo Giám, nhật chủ {m['nhat_chu']} sinh tháng {m['thang']} "
                  f"ưu tiên dùng theo thứ tự: {ds}.")
        return s, None
    if l == "tru":
        s = f"{m['noi_dung']} Trong lá số: {m['can_chi']}"
        if m.get("thap_than"):
            tc = ", ".join(f"{c} ({t})" for c, t in zip(m["tang_can"], m["tang_can_tt"]))
            s += f" (can là {m['thap_than']}; tàng can: {tc})"
        return s + ".", None
    if l == "tang_can":
        ds = "; ".join(f"trụ {n}: {', '.join(x)}" for n, x in zip(m["tru_ten"], m["tang_can"]))
        return f"Tàng can: {ds}.", None
    if l == "khoi_van":
        return (f"Đại vận đi {'thuận' if m['thuan'] else 'nghịch'}, khởi vận sau {m['nam']} năm {m['thang']} tháng "
                f"{m['ngay']} ngày (khoảng {m['ngay_khoi']}).", None)
    if l == "dai_van":
        ten = "Đại vận hiện tại" if m["vai"] == "hien_tai" else "Đại vận kế tiếp"
        return (f"{ten}: {m['can']} {m['chi']} ({m['tu_nam']}–{m['den_nam']}) — can vận là {m['thap_than']} "
                f"so với nhật chủ: {m['y_tt']}", None)
    if l == "luu_nien":
        return (f"Lưu niên {m['nam']}: {m['can']} {m['chi']} — {m['thap_than']} so với nhật chủ ({m['y_tt']}) "
                f"Chi năm với chi ngày: {m['voi_tru_ngay']}.", None)
    if l == "cac_dai_van":
        ds = "; ".join(f"{d['tu_nam']}–{d['den_nam']}: {d['can']} {d['chi']} ({d['thap_than']})" for d in m["ds"])
        return (f"Các đại vận: {ds}. Hành phù ức gợi ý: {', '.join(m['dung_than_phu_uc']) or 'không rõ'} — "
                "hệ thống không chọn 'năm tốt' thay bạn.", None)
    if l in ("giai_thich",):
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "ghi_chu":
        return m["noi_dung"], None
    return "", None


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    doan, soi = [], []
    for m in goi["muc"]:
        d, s = _doan(m)
        if d:
            doan.append(d)
        if s and not soi:
            soi.append(s)
    if goi["mau"]:
        doan.append(goi["mau"])
    if soi:
        doan.append("Câu hỏi để tự soi: " + soi[0])
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(hoi_van.KET)
    return "\n\n".join(doan)


def tra_loi(cau_hoi: str, sinh: dict | None = None, ngay_xem: dt.date | None = None,
            dung_llm: bool = False) -> dict:
    """`sinh` = {"lich": datetime theo kinh tuyến lịch UTC+7, "gioi_tinh": "nam"|"nu"}."""
    pl = phan_loai(cau_hoi)
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    nam_xem = pl["nam_xem"] or (ngay_xem.year + (1 if chung.co(pl["cau_chuan_hoa"], [r"nam sau"]) else 0))
    ls = None
    if sinh and pl["loai"] in ("la_so", "van", "hop"):
        ls = bt.la_so(sinh["lich"], sinh["gioi_tinh"], sinh.get("gio_ty", "da_ty"))
    hien_tai = ngay_xem if not pl["nam_xem"] and nam_xem == ngay_xem.year else None
    goi = goi_bang_chung(pl, ls, sinh["gioi_tinh"] if sinh else None, nam_xem, hien_tai)
    van = van_template(goi)
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi, cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi)
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {mo_ta_loi(e)}"]
    co = list(ls["co_canh_bao"]) if ls else []
    if ls:
        co.append({"loai": "thang_diem", "chi_tiet": kb.luu_y("thang_diem")})
    dac_biet = pl["xu_ly"] in ("an_toan", "tu_choi_nhe") or bool(goi["can_them"])
    return {"phan_loai": goi["phan_loai"], "la_so": ls, "bang_chung": goi, "cau_tra_loi": van,
            "che_do_van": che_do_van, "loi_kiem_tra": loi, "can_them": goi["can_them"], "co_canh_bao": co,
            "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong"}
