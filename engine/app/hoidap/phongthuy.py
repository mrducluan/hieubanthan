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
    db = chung.dac_biet(t)
    if db:
        kq.update(xu_ly=db, loai="dac_biet")
        return kq
    if chung.co(t, [r"vat pham", r"chieu tai", r"trung so", r"yem bua", r"bua"]):
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
    elif chung.co(t, NAM_VIEC) and (chung.co(t, NAM_KW) or chung.co(t, [r"tuoi toi", r"xem tuoi"])):
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


# ------------------------------------------------------------------ NARRATIVE (template)
def _doan(m: dict) -> tuple[str, str | None]:
    l = m["loai"]
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
        return f"{m['tieu_de']}{nhan}: {m['noi_dung']} Gợi ý thực tế: {m['goi_y']}", None
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
            dung_llm: bool = False) -> dict:
    """`sinh` = {"nam": int, "gioi_tinh": "nam"|"nu", "ngay": date|None}."""
    pl = phan_loai(cau_hoi)
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    nam_xem = pl["nam_xem"] or (ngay_xem.year + (1 if chung.co(pl["cau_chuan_hoa"], [r"nam sau"]) else 0))
    goi = goi_bang_chung(pl, sinh, nam_xem)
    van = van_template(goi)
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi, cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi)
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {str(e)[:120]}"]
    dac_biet = pl["xu_ly"] in ("an_toan", "tu_choi_nhe") or bool(goi["can_them"])
    return {"phan_loai": goi["phan_loai"], "bang_chung": goi, "cau_tra_loi": van, "che_do_van": che_do_van,
            "loi_kiem_tra": loi, "can_them": goi["can_them"], "co_canh_bao": goi["co_canh_bao"],
            "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong"}
