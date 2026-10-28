# -*- coding: utf-8 -*-
"""Hỏi đáp Phong thuỷ (HH-4) — RULES: phân loại, tính mệnh quái / du niên / trạch / cửa–chủ–bếp /
sao năm (CALC app.calc.phongthuy), gói bằng chứng từ KB; NARRATIVE: template (+ LLM có kiểm tra).

Ranh giới: không bán/gợi ý vật phẩm "hoá giải", không bùa ngải, không phán bệnh hay may rủi do mộ
phần; mục dân gian luôn ghi rõ là dân gian kèm lý do thực tế.
"""
from __future__ import annotations

import datetime as dt
import re

from app.calc import phongthuy as pt
from app.hoidap import chung
from app.kb import phongthuy_kb as kb
from app.luangiai import hoi as _h
from app.narrative import hoi_van
from app.narrative.ngan_sach import mo_ta_loi

HUONG_KD = {"dong bac": "Đông Bắc", "dong nam": "Đông Nam", "tay bac": "Tây Bắc", "tay nam": "Tây Nam",
            "bac": "Bắc", "nam": "Nam", "dong": "Đông", "tay": "Tây"}
_H_RX = r"(dong bac|dong nam|tay bac|tay nam|bac|nam|dong|tay)"
TIEN_TO = r"(huong|phia|goc|phuong|mat tien|can huong|cua chinh huong|quay)"
QUAI_KD = {"kham": "Khảm", "khon": "Khôn", "chan": "Chấn", "ton": "Tốn", "can": "Càn", "doai": "Đoài",
           "ly": "Ly"}
DU_NIEN_KD = {chung.chuan_hoa(k): k for k in ["Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị", "Hoạ Hại",
                                              "Lục Sát", "Ngũ Quỷ", "Tuyệt Mệnh"]}
CA_NHAN = [r"toi", r"cua minh", r"minh co", r"em co", r"tuoi toi", r"hop voi toi", r"gia chu"]
HUONG_CA_NHAN = [r"hop huong", r"huong nha", r"huong gi", r"huong nao", r"cung phi", r"menh quai",
                 r"dong tu menh", r"tay tu menh", r"ke giuong", r"dau giuong", r"ban lam viec", r"huong bep",
                 r"cua chinh", r"huong tot", r"huong xau", r"sinh khi", r"tuyet menh", r"ngu quy", r"chon can",
                 r"huong ban", r"quay dau", r"phong ngu", r"hop khong",
                 r"nha huong (dong|tay|nam|bac)( (nam|bac))?\b.{0,20}\b(tot|xau|hop)\b"]       # HH-CT3: "nhà hướng Tây có xấu không"
NAM_KW = [r"nam nay", r"nam sau", r"nam 20\d\d"]
NAM_VIEC = [r"sua nha", r"lam nha", r"dong tho", r"xay nha", r"ngu hoang", r"tranh dong", r"kim lau",
            r"hoang oc", r"tam tai", r"thai tue", r"xem tuoi"]
HOP = [r"vo chong", r"ca hai", r"hai vo chong", r"vo toi", r"chong toi"]
AM_TRACH = [r"mo phan", r"dat mo", r"tang thu", r"long mach", r"hai cot", r"boc mo", r"xay mo"]


def _huong_nhac(t: str) -> list[str]:
    """Các phương trong câu, theo thứ tự xuất hiện; cần tiền tố để tránh nhầm 'nam' (giới/năm)."""
    ds = []
    for m in re.finditer(TIEN_TO + r"\s+" + _H_RX + r"(?!\w)", t):
        ds.append(HUONG_KD[m.group(2)])
    return ds


def _nam_gioi(cau: str, t: str) -> tuple[int | None, str | None]:
    m = re.search(r"sinh (?:nam )?(19\d\d|20\d\d)", t)
    nam = int(m.group(1)) if m else None
    thap = cau.lower()
    gioi = "nu" if re.search(r"(?<!\w)nữ(?!\w)", thap) else \
        "nam" if re.search(r"(?:,|là|tôi)\s*nam\s*(?:,|$|\s+giới|\s+sinh)", thap) or re.search(r"\(nam\)", thap) else None
    return nam, gioi


def _khop(bang: dict, t: str) -> list[str]:
    return [ma for ma, m in bang.items() if chung.co(t, m["tu_khoa"])]


def phan_loai(cau_hoi: str) -> dict:
    _, t_chinh = _h._tach_gioi_thieu(cau_hoi)
    t = chung.chuan_hoa(cau_hoi)
    if "," in cau_hoi:                     # "Tôi sắp mua nhà, …" — lời dẫn, không phải câu hỏi cá nhân
        dau, sau = cau_hoi.split(",", 1)
        if re.match(r"(toi|em|minh|anh|chi|nha toi) (sap|dang|moi|vua|muon|chuan bi)\b", chung.chuan_hoa(dau)) \
                and chung.chuan_hoa(sau):
            t_chinh = chung.chuan_hoa(sau)
    nam, gioi = _nam_gioi(cau_hoi, t)
    kq = {"cau_chuan_hoa": t, "loai": None, "xu_ly": "tra_loi", "huong": _huong_nhac(t),
          "quai": next((QUAI_KD[m] for m in re.findall(r"menh quai (kham|khon|chan|ton|can|doai|ly)\b", t)
                        + re.findall(r"quai (kham|khon|chan|ton|can|doai|ly)\b", t)), None),
          "du_nien": [v for k, v in DU_NIEN_KD.items() if re.search(rf"(?<!\w){k}(?!\w)", t)],
          "bo_tri": _khop(kb.bo_tri_tat_ca(), t), "am_trach": _khop(kb.am_trach_tat_ca(), t),
          "giai_thich": _khop(kb.giai_thich_tat_ca(), t), "ca_nhan": chung.co(t_chinh, CA_NHAN),
          "nam_sinh_cau": nam, "gioi_tinh_cau": gioi,
          "nam_xem": int(re.search(r"nam (20\d\d)", t).group(1)) if re.search(r"nam (20\d\d)", t) else None}
    # MT-ĐS B1: gương / chuông gió / hình bát quái treo cửa = vật trang trí → trả lời kèm lưu ý, không từ chối, không tâm linh.
    vat_treo = chung.co(t, [r"bat quai", r"chuong gio", r"treo guong", r"guong .{0,15}(chong|phan tac dung|tru)"])
    db = None if vat_treo else chung.dac_biet(t)
    if db:
        kq.update(xu_ly=db, loai="dac_biet")
        return kq
    if vat_treo:
        kq.update(loai="vat_treo", xu_ly="tra_loi_kem_luu_y")
        return kq
    if chung.co(t, [r"vat pham", r"chieu tai", r"trung so", r"yem bua", r"(?<!\w)bua(?!\w)"]):
        kq.update(xu_ly="tu_choi_nhe", loai="dac_biet")
        return kq
    m_van = re.search(r"van ([1-9])(?!\d)", t)
    kq["van"] = int(m_van.group(1)) if m_van else None
    # HH-CT2: "phi tinh năm 2027 sao nào đến hướng Nam" = sao LƯU NIÊN (năm), không phải tinh bàn nhà theo vận
    if not kq["van"] and chung.co(t, NAM_KW) and chung.co(t, [r"phi tinh", r"sao (nao|gi)", r"cuu tinh",
                                                    r"nhat bach|nhi hac|tam bich|tu luc|ngu hoang|luc bach|that xich|bat bach|cuu tu"]) \
            and not chung.co(t, [r"huyen khong", r"tinh ban", r"trach van"]):
        kq.update(loai="nam", xu_ly="tra_loi_kem_luu_y")
        return kq
    if kq["huong"] and (kq["van"] or chung.co(t, [r"huyen khong", r"phi tinh", r"tinh ban", r"trach van"])):
        kq["loai"] = "huyen_khong"
        return kq
    if kq["quai"] and kq["huong"]:
        kq["loai"] = "menh_quai_chung"
    elif kq["du_nien"] and not kq["ca_nhan"] and chung.co(t, [r"nghia la", r"la gi", r"y nghia", r"la huong (gi|nao)",
                                                               r"(xau|tot) (the nao|ra sao|khong|gi)", r"anh huong gi"]):
        kq["loai"] = "du_nien_chung"
    elif chung.co(t, [r"bep"]) and chung.co(t, [r"cua"]) and len(kq["huong"]) >= 2:
        kq["loai"] = "cua_bep"
    elif chung.co(t, AM_TRACH) or kq["am_trach"]:
        kq.update(loai="am_trach", xu_ly="tra_loi_kem_luu_y")
    elif chung.co(t, NAM_VIEC) and (chung.co(t, NAM_KW) or chung.co(t, [r"tuoi toi", r"xem tuoi"])) \
            or chung.co(t, [r"kim lau", r"hoang oc", r"tam tai", r"nam tuoi", r"sao han", r"muon tuoi"]):   # MT-ĐS B1
        kq.update(loai="nam", xu_ly="tra_loi_kem_luu_y")
    elif chung.co(t, [r"(?<!vo )(vo|chong) (toi|minh) (sinh|tuoi|nam)"]) and nam and not chung.co(t, [r"vo chong"]):
        kq["loai"], kq["kia_ro"] = "hop", True   # nêu rõ năm sinh vợ/chồng → tính luôn mệnh quái hai người
    elif chung.co(t, HOP) and (kq["ca_nhan"] or chung.co(t, [r"ca hai", r"hai vo chong"])) \
            and chung.co(t, [r"huong", r"hop", r"menh"]) \
            and ("vo_chong_khac_menh" not in kq["giai_thich"] or chung.co(t, [r"xem huong", r"cua toi", r"tuoi toi"])) \
            and "vo_chong_ngu" not in kq["bo_tri"] and "cai_nhau" not in kq["bo_tri"]:
        kq["loai"] = "hop"
    elif kq["giai_thich"] and not kq["ca_nhan"]:
        kq["loai"] = "ky_thuat"
    elif kq["bo_tri"]:
        kq["loai"] = "bo_tri"
        if any(kb.bo_tri(m)["nguon"] == "dan_gian" for m in kq["bo_tri"]):
            kq["xu_ly"] = "tra_loi_kem_luu_y"
    elif chung.co(t, HUONG_CA_NHAN) or kq["ca_nhan"]:
        kq["loai"] = "huong_ca_nhan"
    else:
        kq["loai"] = "ky_thuat"
    return kq


# ------------------------------------------------------------------ gói bằng chứng
def _m_du_nien(ten: str, huong: str | None = None, vai: str = "") -> dict:
    d = kb.du_nien(ten)
    return {**{k: v for k, v in d.items() if k != "loai"}, "loai": "du_nien", "cat_hung": d["loai"],
            "ten": ten, "huong": huong, "vai": vai}


def _m_menh(mq: dict) -> dict:
    q = kb.quai(mq["quai"])
    bang = pt.bang_huong(mq["quai"])
    return {"loai": "menh_quai", **{k: mq[k] for k in ("quai", "so", "nhom", "nam_tinh")},
            "tinh_chat": q["tinh_chat"], "ngu_hanh": q["ngu_hanh"],
            "tot": [f"{d} ({h})" for h, d in bang.items() if d in pt.CAT],
            "xau": [f"{d} ({h})" for h, d in bang.items() if d not in pt.CAT], **kb.meta()}


def _mq(pl: dict, sinh: dict | None) -> dict | None:
    if sinh:
        return pt.menh_quai(sinh["nam"], sinh["gioi_tinh"], sinh.get("ngay"), sinh.get("moc_nam", "lap_xuan"))
    if pl["nam_sinh_cau"] and pl["gioi_tinh_cau"]:
        return pt.menh_quai(pl["nam_sinh_cau"], pl["gioi_tinh_cau"])
    return None


def goi_bang_chung(pl: dict, sinh: dict | None, nam_xem: int) -> dict:
    goi = {"phan_loai": {k: pl[k] for k in ("loai", "xu_ly", "huong")},
           "muc": [], "can_them": [], "mau": None, "luu_y": None, "co_canh_bao": []}
    muc = goi["muc"]
    if pl["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        from app.kb import kinhdich_kb  # noqa: PLC0415 — mẫu dùng chung Huyền học
        goi["mau"] = kinhdich_kb.mau("an_toan" if pl["xu_ly"] == "an_toan" else "tu_choi")
        if pl["xu_ly"] == "tu_choi_nhe":
            goi["mau"] += " " + kb.mau("tu_choi_vat_pham")
        return chung.ket(goi)
    if pl["xu_ly"] == "dan_huong":
        goi["mau"] = chung.mau_dan_huong(pl["cau_chuan_hoa"])
        return chung.ket(goi)
    if pl["loai"] == "vat_treo":
        goi["mau"] = kb.luu_y("vat_treo")
        return chung.ket(goi)
    for ma in pl["giai_thich"][:2]:
        g = kb.giai_thich(ma)
        if g:
            muc.append({"loai": "giai_thich", "ma": ma, **g})
    loai = pl["loai"]
    if loai == "menh_quai_chung":
        for h in pl["huong"][:2]:
            muc.append(_m_du_nien(pt.bang_huong(pl["quai"])[h], h, f"mệnh {pl['quai']}"))
        muc.append({"loai": "trach", **pt.trach(pl["huong"][0]), **kb.meta()})
        goi["luu_y"] = kb.luu_y("bat_trach")
        return chung.ket(goi)
    if loai == "du_nien_chung":
        for d in pl["du_nien"][:2]:
            muc.append(_m_du_nien(d))
        return chung.ket(goi)
    if loai == "cua_bep":
        cua, bep = pl["huong"][0], pl["huong"][1]
        k = pt.cua_chu_bep(cua, None, bep)
        muc.append({"loai": "cua_chu_bep", **k, **kb.meta()})
        for c in k["cap"]:
            muc.append(_m_du_nien(c["du_nien"], c["den"], c["cap"]))
        muc.append({"loai": "giai_thich", "ma": "tam_yeu", **kb.giai_thich("tam_yeu")})
        goi["luu_y"] = kb.luu_y("bat_trach")
        return chung.ket(goi)
    if loai == "am_trach":
        for ma in (pl["am_trach"] or ["long_mach"])[:2]:
            muc.append({"loai": "am_trach", **kb.am_trach(ma)})
        goi["luu_y"] = kb.luu_y("am_trach")
        return chung.ket(goi)
    if loai == "nam":
        s = pt.sao_nam(nam_xem)
        muc.append({"loai": "sao_nam", **s, **kb.meta()})
        muc.append({"loai": "giai_thich", "ma": "ngu_hoang", **kb.giai_thich("ngu_hoang")})
        nam_sinh = (sinh or {}).get("nam") or pl["nam_sinh_cau"]
        if nam_sinh:
            muc.append({"loai": "tuoi_lam_nha", **pt.tuoi_lam_nha(nam_sinh, nam_xem), "nam_xem": nam_xem,
                        "source_id": "dan_gian", "school_id": "dan_gian"})
        elif chung.co(pl["cau_chuan_hoa"], [r"tuoi toi", r"xem tuoi"]):
            goi["can_them"] = ["nam_sinh"]
            goi["mau"] = kb.mau("can_nam_sinh")
        goi["luu_y"] = kb.luu_y("nam")
        return chung.ket(goi)
    if loai == "huyen_khong":
        from app.calc import huyen_khong as hk  # noqa: PLC0415
        van = pl["van"] or hk.van_cua_nam(nam_xem)
        nam_xay = 1864 + (van - 1) * 20 + 1                     # một năm bất kỳ trong vận
        hq = next(q for q, v in hk.QUAI.items() if v[1] == pl["huong"][0])
        toa_q = hk.DOI[hq]
        ds = []
        for (h_son, _), (t_son, _) in zip(hk.QUAI[hq][2], hk.QUAI[toa_q][2]):
            b = hk.trach_ban(nam_xay, t_son)
            ds.append({"huong_son": h_son, "toa_son": t_son, "cuc": b["cuc"], "cuc_ten": b["cuc_ten"],
                       "y": kb.huyen_khong()["cuc"][b["cuc"]]["y"],
                       })
        muc.append({"loai": "huyen_khong", "huong": pl["huong"][0], "van": van,
                    "tu_nam": 1864 + (van - 1) * 20, "den_nam": 1864 + van * 20 - 1, "ds": ds, "so_son": len(ds),
                    **{k: kb.huyen_khong()[k] for k in ("source_id", "school_id", "trang_thai")}})
        goi["luu_y"] = kb.huyen_khong()["luu_y"]
        return chung.ket(goi)
    if loai == "hop":
        muc.append({"loai": "giai_thich", "ma": "vo_chong_khac_menh", **kb.giai_thich("vo_chong_khac_menh")})
        nam_kia = pl["nam_sinh_cau"]
        if sinh and nam_kia and pl.get("kia_ro"):    # "vợ tôi sinh 1992…" → tính luôn mệnh quái người kia
            ban = pt.menh_quai(sinh["nam"], sinh["gioi_tinh"], sinh.get("ngay"), sinh.get("moc_nam", "lap_xuan"))
            gioi_kia = pl["gioi_tinh_cau"] or ("nu" if chung.co(pl["cau_chuan_hoa"], [r"vo toi", r"vo minh"])
                                               else "nam" if chung.co(pl["cau_chuan_hoa"], [r"chong toi", r"chong minh"])
                                               else ("nu" if sinh["gioi_tinh"] == "nam" else "nam"))
            kia = pt.menh_quai(nam_kia, gioi_kia)
            muc[:] = [m for m in muc if m.get("ma") != "vo_chong_khac_menh"]   # thay lời chung bằng kết quả tính
            muc.append(_m_menh(ban))
            muc.append({**_m_menh(kia), "vai": f"người kia (sinh {nam_kia})"})
            muc.append({"loai": "so_nhom", "cung_nhom": ban["nhom"][:6] == kia["nhom"][:6],
                        "ban": ban["nhom"], "kia": kia["nhom"]})
            goi["luu_y"] = kb.luu_y("bat_trach")
            return chung.ket(goi)
        goi["can_them"] = ["nam_sinh_hai_nguoi"]
        goi["mau"] = kb.mau("hop")
        return chung.ket(goi)
    if loai == "ky_thuat":
        if chung.co(pl["cau_chuan_hoa"], [r"thuoc quai nao"]) and pl["huong"]:
            muc.append({"loai": "trach", **pt.trach(pl["huong"][0]), **kb.meta()})
        return chung.ket(goi)
    if loai == "bo_tri":
        for ma in pl["bo_tri"][:2]:
            muc.append({"loai": "bo_tri", "ma": ma, **kb.bo_tri(ma)})
        mq = _mq(pl, sinh)
        if mq:
            muc.append(_m_menh(mq))
            goi["co_canh_bao"] = mq["co_canh_bao"]
        goi["luu_y"] = kb.luu_y("dan_gian" if any(m.get("nguon") == "dan_gian" for m in muc) else "bat_trach")
        return chung.ket(goi)
    # huong_ca_nhan
    mq = _mq(pl, sinh)
    if mq is None:
        goi["can_them"] = ["nam_sinh"]
        goi["mau"] = kb.mau("can_nam_sinh")
        return chung.ket(goi)
    goi["co_canh_bao"] = mq["co_canh_bao"]
    muc.append(_m_menh(mq))
    for h in pl["huong"][:2]:
        muc.append(_m_du_nien(pt.bang_huong(mq["quai"])[h], h, "của bạn"))
    if pl["huong"] and chung.co(pl["cau_chuan_hoa"], [r"nha huong", r"can huong", r"cua chinh huong"]):
        tr = pt.trach(pl["huong"][0])
        muc.append({"loai": "trach", **tr, "hop_nhom": (tr["nhom"][:6] == mq["nhom"][:6]), **kb.meta()})
    bang = pt.bang_huong(mq["quai"])
    xau = [h for h, d in bang.items() if d not in pt.CAT]
    theo = {d: h for h, d in bang.items()}
    t = pl["cau_chuan_hoa"]
    if not pl["huong"] and chung.co(t, [r"bep"]):
        muc.append({"loai": "goi_y_vi_tri", "doi_tuong": "bếp", "noi_dung": (
            f"Bát trạch dùng nguyên tắc 'toạ hung hướng cát' cho bếp: đặt bếp (lưng bếp) ở phương xấu của bạn "
            f"({', '.join(xau)}) để 'đè' hung khí, còn hướng bếp — hướng miệng bếp/người đứng nấu nhìn về — "
            f"quay về phương tốt, ưu tiên Thiên Y ({theo['Thiên Y']}) hoặc Diên Niên ({theo['Diên Niên']}). "
            "Thực tế bếp còn cần thông gió, xa nguồn nước bồn rửa một khoảng và không nằm ngay lối cửa chính.")})
    elif not pl["huong"] and chung.co(t, [r"giuong", r"dau giuong", r"quay dau", r"phong ngu", r"ngu quay"]):
        muc.append({"loai": "goi_y_vi_tri", "doi_tuong": "giường", "noi_dung": (
            f"Đầu giường (hướng đỉnh đầu khi nằm) theo Bát trạch nên quay về phương tốt của người nằm: Thiên Y "
            f"({theo['Thiên Y']}) cho giấc ngủ, sức khoẻ; Diên Niên ({theo['Diên Niên']}) cho vợ chồng hoà thuận; "
            f"Phục Vị ({theo['Phục Vị']}) cho sự ổn định. Tránh {', '.join(xau)}. "
            "Thực tế: đầu giường nên tựa tường đặc, không ngay dưới xà, không đối thẳng cửa.")})
    elif not pl["huong"]:
        muc.append(_m_du_nien("Sinh Khí", None, ""))
    goi["luu_y"] = kb.luu_y("bat_trach")
    return chung.ket(goi)


# ------------------------------------------------------------------ Y6: đọc hồ sơ nhà người hỏi
# Hồ sơ nhà nằm trên máy người dùng (KC-2); web gửi kèm theo lượt hỏi, engine KHÔNG lưu. Câu hỏi nhắc phòng nào / "nhà tôi"
# → trả lời theo đúng nhà đó (vị trí phòng, du niên, dấu hiệu đã khai / đã xử lý, luật thực hành) thay vì chung chung.
PHONG_KW = {"bep": [r"bep", r"phong bep", r"mieng bep"],
            "phong_ngu_chinh": [r"giuong", r"phong ngu", r"dau giuong"],
            "cua_chinh": [r"cua chinh", r"cua nha", r"cua ra vao", r"cua truoc"],
            "ve_sinh": [r"nha ve sinh", r"toilet", r"\bwc\b", r"phong tam", r"nha tam"],
            "ban_tho": [r"ban tho"],
            "phong_lam_viec": [r"ban lam viec", r"phong lam viec", r"ban hoc", r"goc hoc"]}
NHA_TOI = [r"nha (cua )?(toi|minh|em|chung toi)", r"can ho (cua )?(toi|minh|em)", r"nha nay", r"can nha nay"]


def _bo_cuc_tu_nha(nha: dict) -> dict:
    """Đầu vào `nha` (như /luan-giai: huong_do|huong, bo_cuc?) → BoCuc cho `phongthuy_bo_cuc.luan`."""
    bc = dict(nha.get("bo_cuc") or {})
    if "huong_nha_do" not in bc and "huong_nha" not in bc:
        if nha.get("huong_do") is not None:
            bc["huong_nha_do"] = nha["huong_do"]
        elif nha.get("huong"):
            bc["huong_nha"] = nha["huong"]
    return bc


def muc_nha(pl: dict, sinh: dict | None, nha: dict) -> dict | None:
    """Mục `nha_rieng` khi câu hỏi nhắc phòng / "nhà tôi" / một dấu hiệu bố trí. None khi câu hỏi không liên quan nhà."""
    from app.kb import phongthuy_do_thi as do_thi  # noqa: PLC0415
    from app.luangiai import phongthuy_bo_cuc as bc  # noqa: PLC0415
    t = pl["cau_chuan_hoa"]
    phong = [p for p, kw in PHONG_KW.items() if chung.co(t, kw)]
    nhac_nha = chung.co(t, NHA_TOI)
    hoi_dh = [m for m in pl["bo_tri"] if m in bc.DAU_HIEU]
    if not (phong or nhac_nha or hoi_dh):
        return None
    vao = _bo_cuc_tu_nha(nha)
    try:
        r = bc.luan(vao, sinh)
    except (ValueError, TypeError):
        return None
    d = r["da_tinh"]
    khai = (vao.get("dau_hieu") or {})
    # co:false = người dùng khai "đã xử lý" HOẶC bấm "không có" (web gộp hai loại) → trạng thái trung tính "khong_con".
    khong_con = {ma for ma, x in khai.items() if isinstance(x, dict) and x.get("co") is False}
    co = {x["ma"]: x for x in r["dien_giai"]["dau_hieu"]}
    vi_tri = {x["phong"]: x for x in d["vi_tri"]}
    kv = kb.bo_cuc()["vi_tri_phong"]
    phong_ra = []
    for p in phong:
        x = vi_tri.get(p)
        phong_ra.append({"phong": p, "ten": bc.TEN_PHONG[p], "cung": x["cung"] if x else None,
                         "du_nien": (x["du_nien_menh"] or x["du_nien_trach"]) if x else None,
                         "theo": ("menh" if x["du_nien_menh"] else "trach" if x["du_nien_trach"] else None) if x else None,
                         "hop": x["hop"] if x else None, "nen": kv[p]["noi_dung"]})
    # Dấu hiệu nêu ra: đúng dấu hiệu câu hỏi nhắc + dấu hiệu đã khai ở phòng câu hỏi nhắc; chỉ hỏi "nhà tôi" → dấu hiệu
    # nên xử lý trước (veto) đã khai.
    dh_phong = do_thi.dau_hieu_o_phong(phong) if phong else set()
    lien = [m for m in co if m in hoi_dh or m in dh_phong or (nhac_nha and not phong and co[m]["veto"])]
    dau_hieu = [{"ma": m, "tieu_de": co[m]["tieu_de"], "veto": co[m]["veto"], "tot": co[m]["tot"],
                 "viec_0": next((v["lam"] for v in co[m]["viec"] if v["chi_phi"] == "khong_ton"), None),
                 "trang": co[m].get("trang")} for m in lien]
    hoi_ra = [{"ma": m, "tieu_de": kb.bo_tri(m)["tieu_de"],
               "trang_thai": "khong_con" if m in khong_con else "co" if m in co else "chua_khai"} for m in hoi_dh]
    ma_lien = set(lien) | set(hoi_dh)
    quy_tac = [q for q in r["quy_tac"] if set((kb.quy_tac_thuc_hanh().get(q["ma"]) or {}).get("ap_dung", {}).get("dau_hieu") or []) & ma_lien]
    return {"loai": "nha_rieng", "huong": d["huong_nha"], "trach": (d["trach"] or {}).get("quai"),
            "cung_nhom": d["cung_nhom"], "menh_quai": (d["menh_quai"] or {}).get("quai"),
            "loai_nha": vao.get("loai_nha"), "noi_ve_nha": nhac_nha or not phong,
            "phong": phong_ra, "dau_hieu": dau_hieu, "dau_hieu_hoi": hoi_ra, "quy_tac": quy_tac,
            "source_id": kb.SOURCE_ID, "school_id": kb.SCHOOL_ID}


def _doan_nha(m: dict) -> str:
    cau = []
    if m["huong"] and m["noi_ve_nha"]:
        s = f"Theo hồ sơ nhà bạn lưu: nhà hướng {m['huong']}" + (f", {m['trach']} trạch" if m["trach"] else "") + "."
        if m["cung_nhom"] is not None:
            s += (" Cùng nhóm Đông/Tây với mệnh quái của bạn." if m["cung_nhom"]
                  else " Khác nhóm Đông/Tây với mệnh quái của bạn — bù bằng hướng cửa, bếp, giường theo hướng tốt của bạn.")
        cau.append(s)
    for p in m["phong"]:
        if not p["cung"]:
            cau.append(f"{p['ten']}: hồ sơ nhà chưa ghi vị trí — đặt phòng ở Khảo sát nhà (hoặc vẽ mặt bằng) để xem theo đúng nhà bạn.")
            continue
        theo = "với mệnh quái của bạn" if p["theo"] == "menh" else "theo trạch của nhà (chưa có năm sinh)"
        if p["cung"] != "Trung cung" and not p["du_nien"]:
            cau.append(f"{p['ten']} nhà bạn ở phía {p['cung']}. Hồ sơ nhà chưa có hướng nhà và bạn chưa nhập năm sinh nên chưa xét "
                       f"được phương này hợp hay không. {p['nen']}")
            continue
        if p["cung"] == "Trung cung":
            cau.append(f"{p['ten']} nhà bạn nằm ở giữa nhà (trung cung). {p['nen']}")
        else:
            danh_gia = "" if p["hop"] is None else (" — đúng cách sách dặn." if p["hop"] else " — chưa đúng cách sách dặn.")
            cau.append(f"{p['ten']} nhà bạn ở phía {p['cung']}: {theo} là {p['du_nien']}{danh_gia} {p['nen']}")
    for d in m["dau_hieu"]:
        s = f"Bạn đã ghi nhà có “{d['tieu_de'].lower()}”" + (" — nhóm nên xử lý trước." if d["veto"] else ".")
        if d["viec_0"]:
            s += f" Việc không tốn tiền: {d['viec_0']}"
        cau.append(s)
    for d in m["dau_hieu_hoi"]:
        if d["trang_thai"] == "khong_con":
            cau.append(f"Hồ sơ nhà ghi nhà bạn không còn “{d['tieu_de'].lower()}” (đã xử lý hoặc không có) — bài đọc Nhà của bạn không xét dấu hiệu này.")
        elif d["trang_thai"] == "chua_khai":
            cau.append(f"Hồ sơ nhà chưa ghi “{d['tieu_de'].lower()}” — nếu nhà bạn có, tích ở Khảo sát nhà để bài đọc xếp việc cho đúng.")
    for q in m["quy_tac"]:
        cau.append(f"{q['tieu_de']}: {q['noi_dung']}")
    return " ".join(cau)


# ------------------------------------------------------------------ NARRATIVE (template)
def _doan(m: dict) -> tuple[str, str | None]:
    l = m["loai"]
    if l == "sao_han":
        return chung.doan_sao_han(m), None
    if l == "menh_quai":
        ai = m.get("vai") or "bạn"
        return (f"Mệnh quái (cung phi) của {ai}: {m['quai']} ({m['nhom']}, tính theo năm {m['nam_tinh']}; "
                f"hành {m['ngu_hanh']}, tính chất {m['tinh_chat']}). Hướng tốt: {', '.join(m['tot'])}. "
                f"Hướng xấu: {', '.join(m['xau'])}.", None)
    if l == "du_nien":
        dau = f"Hướng {m['huong']} " if m.get("huong") else ""
        vai = f"({m['vai']}) " if m.get("vai") else ""
        return (f"{dau}{vai}— {m['ten']} ({'hướng tốt' if m['cat_hung'] == 'cát' else 'hướng xấu'}): "
                f"{m['y_nghia']} Hợp dùng cho: {m['dung_cho']}.", None)
    if l == "trach":
        s = f"Nhà hướng {m['huong']} thì toạ {m['toa']} → {m['quai']} trạch ({m['nhom']})."
        if "hop_nhom" in m:
            s += " Cùng nhóm với mệnh quái của bạn." if m["hop_nhom"] else " Khác nhóm với mệnh quái của bạn — Bát trạch gợi ý bù bằng hướng cửa, bếp, giường theo hướng tốt của bạn."
        return s, None
    if l == "cua_chu_bep":
        ds = "; ".join(f"{c['cap']} ({c['tu']} → {c['den']}): {c['du_nien']}" for c in m["cap"])
        return (f"Cửa–bếp theo Dương Trạch Tam Yếu: {ds}. "
                f"{'Cùng nhóm Đông/Tây tứ — thuận.' if m['cung_nhom'] else 'Khác nhóm Đông/Tây tứ — kém thuận; có thể xoay miệng bếp về hướng tốt.'}", None)
    if l == "bo_tri":
        nhan = " (quan niệm dân gian)" if m["nguon"] == "dan_gian" else ""
        # Q4/Q5: thêm cách nhìn đời sống + việc 0 đồng (KB bo_tri.viec) cho các dấu hiệu có trong form khảo sát.
        them = f" Nhìn theo đời sống: {m['giai_thich_hien_dai']}" if m.get("giai_thich_hien_dai") else ""
        v0 = next((v["lam"] for v in (m.get("viec") or []) if v["chi_phi"] == "khong_ton"), None)
        viec = f" Việc không tốn gì: {v0}" if v0 else ""
        return f"{m['tieu_de']}{nhan}: {m['noi_dung']}{them} Gợi ý thực tế: {m['goi_y']}{viec}", None
    if l == "am_trach":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "sao_nam":
        return (f"Năm {m['nam']} ({m['chi']}): Ngũ Hoàng ở {m['ngu_hoang']}; Thái Tuế ở {m['thai_tue']}, "
                f"Tuế Phá ở {m['tue_pha']}; Tam Sát ở {m['tam_sat']}. Truyền thống kiêng động thổ lớn ở các phương này.",
                None)
    if l == "tuoi_lam_nha":
        kl, ho, tt = m["kim_lau"], m["hoang_oc"], m["tam_tai"]
        return (f"Tuổi làm nhà năm {m['nam_xem']} (quan niệm dân gian, tuổi mụ {m['tuoi_mu']}): "
                f"{'phạm ' + kl['loai'] if kl['pham'] else 'không phạm Kim Lâu'}; Hoang Ốc: {ho['cung']} "
                f"({'tốt' if ho['tot'] else 'xấu'}); {'phạm Tam Tai' if tt['pham'] else 'không phạm Tam Tai'}.", None)
    if l == "goi_y_vi_tri":
        return f"Vị trí {m['doi_tuong']}: {m['noi_dung']}", None
    if l == "so_nhom":
        return (f"Hai người {'cùng nhóm' if m['cung_nhom'] else 'khác nhóm'} ({m['ban']} – {m['kia']}). "
                + ("Có thể chọn hướng nhà hợp cả hai." if m["cung_nhom"] else
                   "Cách phổ biến: hướng cửa/nhà theo người trụ cột, phòng ngủ và bàn làm việc chọn theo từng người."),
                None)
    if l == "huyen_khong":
        ds = "; ".join(f"hướng {x['huong_son']} (toạ {x['toa_son']}): {x['cuc_ten']}" for x in m["ds"])
        y = {x["cuc_ten"]: x["y"] for x in m["ds"]}
        return (f"Huyền Không — nhà hướng {m['huong']} nhập trạch/xây trong vận {m['van']} "
                f"({m['tu_nam']}–{m['den_nam']}). Hướng {m['huong']} gồm {m['so_son']} sơn, mỗi sơn ra một cục: {ds}. "
                + " ".join(f"{k}: {v}" for k, v in y.items())
                + " Muốn biết đúng sơn và đủ 9 cung, đo độ la bàn rồi lập trạch bàn ở mục Phong thuỷ.", None)
    if l == "giai_thich":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "nha_rieng":
        return _doan_nha(m), None
    return "", None


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    doan = [d for d, _ in (_doan(m) for m in goi["muc"]) if d]
    if goi["mau"]:
        doan.append(goi["mau"])
    doan.append("Câu hỏi để tự soi: Ngoài hướng, ngôi nhà này có đủ ánh sáng, thông gió và yên tĩnh cho người ở chưa?")
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(hoi_van.KET)
    return "\n\n".join(doan)


def tra_loi(cau_hoi: str, sinh: dict | None = None, ngay_xem: dt.date | None = None,
            dung_llm: bool = False, nha: dict | None = None) -> dict:
    """`sinh` = {"nam": int, "gioi_tinh": "nam"|"nu", "ngay": date|None}. `nha` (Y6) = hồ sơ nhà trên máy người hỏi
    ({huong_do|huong, bo_cuc?}) — chỉ dùng trong lượt gọi, không lưu."""
    pl = phan_loai(cau_hoi)
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    nam_xem = pl["nam_xem"] or (ngay_xem.year + (1 if chung.co(pl["cau_chuan_hoa"], [r"nam sau"]) else 0))
    goi = goi_bang_chung(pl, sinh, nam_xem)
    if chung.sao_han_hoi(pl["cau_chuan_hoa"]) and sinh and sinh.get("gioi_tinh") and not goi["can_them"]:   # MT-ĐS B3
        from app.calc import lunar  # noqa: PLC0415
        from app.config import CALENDAR_MERIDIAN_TZ  # noqa: PLC0415
        nam_am = pl["nam_xem"] or lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, CALENDAR_MERIDIAN_TZ)[2] \
            + (1 if chung.co(pl["cau_chuan_hoa"], [r"nam sau"]) else 0)
        ng = sinh.get("ngay")
        goi["muc"].insert(0, chung.muc_sao_han(nam_am, sinh["nam"], sinh["gioi_tinh"], ng.month if ng else None, ng.day if ng else None))
        chung.ket(goi)
    if nha and pl["xu_ly"] not in chung.DAC_BIET:
        mn = muc_nha(pl, sinh, nha)
        if mn:
            goi["muc"].insert(0, mn)                 # trả lời theo đúng nhà trước, kiến thức chung sau
            goi["phan_loai"]["theo_nha"] = True
    van = van_template(goi)
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi, cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi)
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {mo_ta_loi(e)}"]
    dac_biet = pl["xu_ly"] in chung.DAC_BIET or bool(goi["can_them"])
    return {"phan_loai": goi["phan_loai"], "bang_chung": goi, "cau_tra_loi": van, "che_do_van": che_do_van,
            "loi_kiem_tra": loi, "can_them": goi["can_them"], "co_canh_bao": goi["co_canh_bao"],
            "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong"}
