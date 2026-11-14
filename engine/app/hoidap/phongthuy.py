# -*- coding: utf-8 -*-
"""Hỏi đáp Phong thuỷ (HH-4) — RULES: phân loại, tính mệnh quái / du niên / trạch / cửa–chủ–bếp /
sao năm (CALC app.calc.phongthuy), gói bằng chứng từ KB; NARRATIVE: template (+ LLM có kiểm tra).

Ranh giới: không bán/gợi ý vật phẩm "hoá giải", không bùa ngải, không phán bệnh hay may rủi do mộ
phần; mục dân gian luôn ghi rõ là dân gian kèm lý do thực tế.
"""
from __future__ import annotations

import datetime as dt
import re

from app import ngon_ngu
from app.calc import phongthuy as pt
from app.hoidap import chung, en_gloss, en_gloss_pt, hieu_cau, mo_dau
from app.kb import phongthuy_kb as kb
from app.kb import ten as _ten
from app.kb.loi import L
from app.luangiai import hoi as _h, truc_quan
from app.narrative import hoi_van
from app.narrative.ngan_sach import mo_ta_loi

# ---- EN-ALL GĐ 5: tên riêng theo ngôn ngữ lượt gọi (bản Việt trả nguyên chữ — golden không đổi)
_HANH_MA = {"Thuỷ": "Thủy", "Hoả": "Hỏa"}


def _th(nhom: str, x):
    if not isinstance(x, str) or ngon_ngu.la_viet():
        return x
    k = _HANH_MA.get(x, x) if nhom == "hanh" else x
    return _ten.ten(nhom, k) if _ten.muc(nhom, k) else x


def _hg(x):
    return _th("huong", x)


def _dn(x):
    return _th("du_nien", x)


def _q(x):
    return _th("quai", x)


def _nhom(x):
    return _th("nhom_trach", x)


def _noi(ds) -> str:
    return L("hoi.pt.noi", ", ").join(ds)


def _noi_ds(ds) -> str:
    return L("hoi.pt.noi_ds", ", ").join(ds)




def _dn_huong(x: str) -> str:
    """"Sinh Khí (Đông Nam)" → bản Việt nguyên; bản khác "South-East: Sheng Qi (Vitality)"."""
    if ngon_ngu.la_viet():
        return x
    hai = _tach_ngoac(x)
    return L("hoi.pt.dn_huong", "{dn} ({h})", dn=_dn(hai[0]), h=_hg(hai[1])) if hai else x


def _tach_ngoac(x: str) -> tuple[str, str] | None:
    """"A (B)" → ("A", "B") tách ở " (" ĐẦU TIÊN — thay regex `(.+?) \((.+)\)` (CodeQL: ReDoS)."""
    if not x.endswith(")") or " (" not in x:
        return None
    a, b = x[:-1].split(" (", 1)
    return (a, b) if a and b else None


PT_MO_DAU = False   # EN-3b: đoạn mở đầu Phong thuỷ chưa bật — xem chỗ dùng trong tra_loi

HUONG_KD = {"dong bac": "Đông Bắc", "dong nam": "Đông Nam", "tay bac": "Tây Bắc", "tay nam": "Tây Nam",
            "bac": "Bắc", "nam": "Nam", "dong": "Đông", "tay": "Tây"}
_H_RX = r"(dong bac|dong nam|tay bac|tay nam|bac|nam|dong|tay)"
# EN-3c: "hướng nhà Đông Nam", "bếp hướng Tây Bắc" — chen tên vật giữa "hướng" và phương
TIEN_TO = r"(huong|phia|goc|phuong|mat tien|can huong|cua chinh huong|quay)(?:\s+(?:nha|bep|cua|cong|ban tho))?"
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
# SK-1: câu hỏi sức khoẻ (đã qua bộ chặn — không gồm sống chết / chữa trị)
SUC_KHOE_KW = [r"suc khoe", r"(?<!\w)benh (gi|tat)", r"hay om", r"om dau", r"om yeu", r"dau (da day|bung|dau|lung|khop)",
               r"kham (tong quat|dinh ky|suc khoe)", r"de y suc", r"chu y suc"]
NAM_VIEC = [r"sua nha", r"lam nha", r"sua (bep|phong|cong|cua|tuong|mai|lai nha)", r"sua chua", r"(dap|duc) (tuong|pha|bo)", r"dong tho", r"xay nha", r"ngu hoang", r"tranh dong", r"kim lau",
            r"hoang oc", r"tam tai", r"thai tue", r"xem tuoi"]
HOP = [r"vo chong", r"ca hai", r"hai vo chong", r"vo toi", r"chong toi"]
AM_TRACH = [r"mo phan", r"dat mo", r"tang thu", r"long mach", r"hai cot", r"boc mo", r"xay mo", r"ngoi mo",
            r"mo (cua )?(ong|ba|bo|me|to tien)", r"mo (cu|ma) trong vuon"]


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


def phan_loai(cau_hoi: str, _cum: str | None = None) -> dict:
    """EN-ALL GĐ 5: câu tiếng Anh → cụm từ khoá tiếng Việt không dấu (`en_gloss_pt`, dịch ý) rồi đi đúng luật bên dưới; bộ
    chặn an toàn xét trên CÂU GỐC (`luangiai/an_toan`, một bộ cho mọi ngôn ngữ). Câu gõ tiếng Việt ở bản Anh → phân loại
    như bản Việt. `_cum` (EN-AI): cụm thay bản dịch ý — `chung.thu_nhan_ngoai`."""
    if ngon_ngu.la_viet():
        return _phan_loai(cau_hoi)
    if en_gloss.la_cau_viet(cau_hoi):
        with ngon_ngu.dung(ngon_ngu.MAC_DINH):
            return _phan_loai(cau_hoi)
    kq = _phan_loai(_cum or en_gloss_pt.gloss(cau_hoi) or cau_hoi, goc=cau_hoi)
    if _cum is None:
        kq = chung.thu_nhan_ngoai(kq, cau_hoi, "phongthuy", lambda cum: _phan_loai(cum, goc=cau_hoi))
    return kq


_VAT_PHAM_EN = re.compile(r"\bsell me\b|\bhow much (?:is|for|does) (?:a |an |the |your )?(?:\w+ )?(?:amulet|talisman|charm|cure|statue|crystal)|"
                          r"\b(?:buy|purchase|pay)\b.{0,50}\b(?:remove|break|lift|get rid of|cure|end|fix)\b.{0,20}\b(?:bad luck|curse|"
                          r"jinx|misfortune)\b|\bbreak (?:my|the) curse\b|\bshould i pay the (?:master|monk|priest|consultant)\b|"
                          r"\b(?:amulet|talisman)s? for (?:my|the) (?:house|home)\b")


def _phan_loai(cau_hoi: str, goc: str | None = None) -> dict:
    """`goc` (bản ngôn ngữ khác): câu gốc người dùng gõ — `cau_hoi` khi đó là cụm từ khoá đã dịch ý."""
    _, t_chinh = _h._tach_gioi_thieu(cau_hoi)
    t = chung.chuan_hoa_cau(cau_hoi)
    if "," in cau_hoi:                     # "Tôi sắp mua nhà, …" — lời dẫn, không phải câu hỏi cá nhân
        dau, sau = cau_hoi.split(",", 1)
        if re.match(r"(toi|em|minh|anh|chi|nha toi) (sap|dang|moi|vua|muon|chuan bi)\b", chung.chuan_hoa_cau(dau)) \
                and chung.chuan_hoa_cau(sau):
            t_chinh = chung.chuan_hoa_cau(sau)
    nam, gioi = _nam_gioi(cau_hoi, t)
    kq = {"cau_chuan_hoa": t, "cau_goc": goc or cau_hoi, "loai": None, "xu_ly": "tra_loi", "huong": _huong_nhac(t),
          "quai": next((QUAI_KD[m] for m in re.findall(r"menh quai (kham|khon|chan|ton|can|doai|ly)\b", t)
                        + re.findall(r"quai (kham|khon|chan|ton|can|doai|ly)\b", t)), None),
          "du_nien": [v for k, v in DU_NIEN_KD.items() if re.search(rf"(?<!\w){k}(?!\w)", t)],
          "bo_tri": _khop(kb.bo_tri_tat_ca(), t), "am_trach": _khop(kb.am_trach_tat_ca(), t),
          "giai_thich": _khop(kb.giai_thich_tat_ca(), t), "ca_nhan": chung.co(t_chinh, CA_NHAN),
          "nam_sinh_cau": nam, "gioi_tinh_cau": gioi,
          "nam_xem": int(re.search(r"nam (20\d\d)", t).group(1)) if re.search(r"nam (20\d\d)", t) else None}
    # MT-ĐS B1: gương / chuông gió / hình bát quái treo cửa = vật trang trí → trả lời kèm lưu ý, không từ chối, không tâm linh.
    vat_treo = chung.co(t, [r"bat quai", r"chuong gio", r"treo guong", r"guong .{0,15}(chong|phan tac dung|tru)"])
    db = None if vat_treo else chung.dac_biet(t, cau_hoi)
    if goc is not None:     # bản ngôn ngữ khác: câu gốc qua bộ chặn chung trước; vật phẩm / bùa (tiếng Anh) như "vat pham"
        db = chung.dac_biet(chung.chuan_hoa_cau(goc), goc) or ("tu_choi_nhe" if _VAT_PHAM_EN.search(goc.lower()) else None) or db
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
    if goc is not None and (td_en := en_gloss_pt.tu_dien_kien_thuc(goc)):
        kq["loai"], kq["tu_dien"] = "ky_thuat", td_en       # câu kiến thức tiếng Anh → từ điển (không đọc mệnh quái)
        return kq
    # HH-CT2: "phi tinh năm 2027 sao nào đến hướng Nam" = sao LƯU NIÊN (năm), không phải tinh bàn nhà theo vận
    if not kq["van"] and chung.co(t, NAM_KW) and chung.co(t, [r"phi tinh", r"sao (nao|gi)", r"cuu tinh",
                                                    r"sao (xau|tot|du|lanh)", r"bay (toi|den|vao)",
                                                    r"giu yen", r"(phia|huong) nao .{0,15}(tranh|kieng|xau)",
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
    elif (n2 := hieu_cau.nguoi_thu_hai(t)) and n2["quan_he"] == "vo_chong" and n2.get("nam_sinh") \
            and re.search(r"(?<!vo )\b(chong|vo)\b(?! chong)(\s+(toi|minh|em))?\s*(sn|sinh)?\s*(nam\s*)?(19\d\d|20[0-4]\d)", t):
        # năm sinh phải gắn với MỘT vai ("vợ tôi sinh 1994", "ck sn 1985") — "vợ chồng tôi sinh 1990 và 1992" không
        # biết năm nào của ai → không đoán giới tính, hỏi thêm (nhãn kho can_them_du_lieu)
        # EN-3: nêu rõ năm sinh vợ/chồng (kể cả "ck sn 1985 vk sn 1991") → tính luôn mệnh quái hai người
        kq["loai"], kq["kia_ro"], kq["nam_sinh_kia"] = "hop", True, n2["nam_sinh"]
        kq["cac_nam_sinh"] = n2.get("cac_nam_sinh")
    elif chung.co(t, [r"\b(vo|chong)\b"]) and len(re.findall(r"menh (kim|moc|thuy|hoa|tho)\b", t)) >= 2:
        kq["loai"] = "hop"                       # EN-3: vợ chồng khác mệnh, chưa có năm sinh → hỏi năm sinh hai người
    elif chung.co(t, HOP) and (kq["ca_nhan"] or chung.co(t, [r"ca hai", r"hai vo chong"])) \
            and chung.co(t, [r"huong", r"hop", r"menh"]) \
            and ("vo_chong_khac_menh" not in kq["giai_thich"] or chung.co(t, [r"xem huong", r"cua toi", r"tuoi toi"])) \
            and "vo_chong_ngu" not in kq["bo_tri"] and "cai_nhau" not in kq["bo_tri"]:
        kq["loai"] = "hop"
    elif kq["giai_thich"] and not kq["ca_nhan"]:
        kq["loai"] = "ky_thuat"
    elif not kq["bo_tri"] and (td := hieu_cau.la_kien_thuc_tu_dien(t, cau_hoi, "phongthuy")):
        kq["loai"], kq["tu_dien"] = "ky_thuat", [m["ma"] for m in td]     # EN-3: câu kiến thức → từ điển
    elif kq["huong"] and kq["ca_nhan"] and chung.co(t, [r"hop (voi )?(toi|minh|em)", r"(on|tot|hop) (voi|cho) (toi|minh|em)",
                                                         r"hop (toi|minh|em) hon", r"hop huong", r"huong nao (hop|tot)"]):
        kq["loai"] = "huong_ca_nhan"   # EN-3c: "chung cư hướng Đông hay Tây hợp tôi hơn", "góc Tây Nam có ổn với tôi"
    elif kq["bo_tri"]:
        kq["loai"] = "bo_tri"
        if any(kb.bo_tri(m)["nguon"] == "dan_gian" for m in kq["bo_tri"]):
            kq["xu_ly"] = "tra_loi_kem_luu_y"
    elif chung.co(t, HUONG_CA_NHAN) or kq["ca_nhan"] or (kq["huong"] and chung.co(t, [
            r"(dat|ke|quay|de|xoay) (bep|giuong|ban|ban tho|cua|ban hoc)", r"(bep|giuong|ban lam viec|ban hoc|ban tho|cua chinh) "
            r".{0,25}(huong|goc|phia)"])):          # EN-3c: "nên đặt bếp ở góc Đông hay góc Nam" — chọn phương cho một vật
        kq["loai"] = "huong_ca_nhan"
        kq["do_tin_thap"] = not chung.co(t, HUONG_CA_NHAN) and not kq["huong"]   # EN-3: chỉ có "của tôi" → mời chọn
    else:
        kq["loai"] = "ky_thuat"
        kq["do_tin_thap"] = not (kq["huong"] or kq["du_nien"] or kq["quai"])
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


def _menh_rieng(pl: dict, sinh: dict | None) -> dict | None:
    """HD-CS đợt 4: câu kiến thức "vợ chồng khác mệnh chọn hướng theo ai" — vẽ la bàn của chính người hỏi (đã có năm sinh)
    để họ thấy phía mình; lời trả lời vẫn là kiến thức chung."""
    if pl["loai"] != "ky_thuat" or "vo_chong_khac_menh" not in pl["giai_thich"] or not sinh:
        return None
    mq = _mq(pl, sinh)
    return _m_menh(mq) if mq else None


def goi_bang_chung(pl: dict, sinh: dict | None, nam_xem: int, nam_am: int | None = None) -> dict:
    """`nam_xem` = năm theo Lập xuân (phi tinh, Thái Tuế); `nam_am` = năm âm lịch Việt (tuổi làm nhà, theo Tết) —
    EN-1 DU-1/DU-2: trước đây cả hai lấy năm dương lịch của ngày xem → sai từ 1/1 tới Tết / Lập xuân."""
    nam_am = nam_am or nam_xem
    goi = {"phan_loai": {k: pl[k] for k in ("loai", "xu_ly", "huong")},
           "muc": [], "can_them": [], "mau": None, "luu_y": None, "co_canh_bao": []}
    muc = goi["muc"]
    if pl["xu_ly"] in ("an_toan", "tu_choi_nhe"):
        from app.kb import kinhdich_kb  # noqa: PLC0415 — mẫu dùng chung Huyền học
        goi["mau"] = kinhdich_kb.mau("an_toan" if pl["xu_ly"] == "an_toan" else "tu_choi")
        if pl["xu_ly"] == "an_toan":              # hành vi đã xảy ra → cấp cứu đứng đầu
            goi["mau"] = chung.mau_an_toan(pl.get("cau_goc"), goi["mau"])
        if pl["xu_ly"] == "tu_choi_nhe":
            goi["mau"] += " " + kb.mau("tu_choi_vat_pham")
            goi["mau"] = chung.mau_tu_choi(pl.get("cau_goc"), pl["cau_chuan_hoa"], goi["mau"])   # SK-1
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
    if pl.get("tu_dien"):
        muc += hieu_cau.muc_tu_dien(pl["tu_dien"])
    loai = pl["loai"]
    if loai == "menh_quai_chung":
        for h in pl["huong"][:2]:
            muc.append(_m_du_nien(pt.bang_huong(pl["quai"])[h], h, L("hoi.pt.vai.menh", "mệnh {q}", q=_q(pl["quai"]))))
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
            # Một bộ tính: dùng đúng hàm của trang /xem-tuoi-lam-nha (tuổi mụ theo năm âm của NGÀY sinh khi có).
            from app.luangiai import tuoi_dan_gian as tdg  # noqa: PLC0415
            ng = (sinh or {}).get("ngay")
            # EN-3: "làm nhà năm 2027 hay 2028" → xét từng năm được hỏi (cùng hàm), không chỉ năm đầu
            for y in [y for y in (pl.get("cac_nam_hoi") or [nam_am]) if y > nam_sinh][:3]:   # năm trước năm sinh = năm sinh người khác
                x = tdg.xem_tuoi_lam_nha(nam_sinh, y, ng.month if ng else None, ng.day if ng else None)
                muc.append({"loai": "tuoi_lam_nha", "nam_xem": y, "tuoi_mu": x["tuoi_mu"], "kim_lau": x["kim_lau"],
                            "hoang_oc": x["hoang_oc"], "tam_tai": x["tam_tai"], "nam_thuan": x["nam_thuan"][:1],
                            "ket_ma": x["ket_luan"]["ma"],
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
        # EN-3: câu nêu đủ năm sinh của CẢ HAI vợ chồng mà hồ sơ là năm khác → tính đúng hai người trong câu, không
        # trộn hồ sơ trên máy vào ("ck sn 1989 vk sn 1993").
        cap = re.findall(r"\b(chong|vo)\s*(?:sn|sinh)?\s*(?:nam\s*)?(19\d\d|20\d\d)", pl["cau_chuan_hoa"])
        if len(cap) >= 2 and {v for v, _ in cap[:2]} == {"chong", "vo"} \
                and not (sinh and sinh.get("nam") in {int(y) for _, y in cap}):
            muc[:] = [m for m in muc if m.get("ma") != "vo_chong_khac_menh"]
            hai = []
            for vai, y in cap[:2]:
                q = pt.menh_quai(int(y), "nam" if vai == "chong" else "nu")
                hai.append(q)
                muc.append({**_m_menh(q), "vai": (L("hoi.pt.vai.chong", "chồng (sinh {y})", y=y) if vai == "chong"
                                                  else L("hoi.pt.vai.vo", "vợ (sinh {y})", y=y))})
            muc.append({"loai": "so_nhom", "cung_nhom": hai[0]["nhom"][:6] == hai[1]["nhom"][:6],
                        "ban": hai[0]["nhom"], "kia": hai[1]["nhom"]})
            goi["luu_y"] = kb.luu_y("bat_trach")
            return chung.ket(goi)
        nam_kia = pl.get("nam_sinh_kia") or pl["nam_sinh_cau"]
        if sinh and pl.get("cac_nam_sinh") and nam_kia == sinh.get("nam"):      # năm đầu là của chính người hỏi
            nam_kia = next((y for y in pl["cac_nam_sinh"] if y != sinh["nam"]), nam_kia)
        if sinh and nam_kia and pl.get("kia_ro"):    # "vợ tôi sinh 1992…" → tính luôn mệnh quái người kia
            ban = pt.menh_quai(sinh["nam"], sinh["gioi_tinh"], sinh.get("ngay"), sinh.get("moc_nam", "lap_xuan"))
            gioi_kia = pl["gioi_tinh_cau"] or ("nu" if chung.co(pl["cau_chuan_hoa"], [r"vo toi", r"vo minh"])
                                               else "nam" if chung.co(pl["cau_chuan_hoa"], [r"chong toi", r"chong minh"])
                                               else ("nu" if sinh["gioi_tinh"] == "nam" else "nam"))
            kia = pt.menh_quai(nam_kia, gioi_kia)
            muc[:] = [m for m in muc if m.get("ma") != "vo_chong_khac_menh"]   # thay lời chung bằng kết quả tính
            muc.append(_m_menh(ban))
            muc.append({**_m_menh(kia), "vai": L("hoi.pt.vai.kia", "người kia (sinh {y})", y=nam_kia)})
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
        muc.append(_m_du_nien(pt.bang_huong(mq["quai"])[h], h, L("hoi.pt.vai.ban", "của bạn")))
    if pl["huong"] and chung.co(pl["cau_chuan_hoa"], [r"nha huong", r"can huong", r"cua chinh huong"]):
        tr = pt.trach(pl["huong"][0])
        muc.append({"loai": "trach", **tr, "hop_nhom": (tr["nhom"][:6] == mq["nhom"][:6]), **kb.meta()})
    bang = pt.bang_huong(mq["quai"])
    xau = [h for h, d in bang.items() if d not in pt.CAT]
    theo = {d: h for h, d in bang.items()}
    t = pl["cau_chuan_hoa"]
    if not pl["huong"] and chung.co(t, [r"bep"]):
        muc.append({"loai": "goi_y_vi_tri", "doi_tuong": L("hoi.pt.vat.bep", "bếp"), "noi_dung": L("hoi.pt.goi_y.bep", (
            "Bát trạch dùng nguyên tắc 'toạ hung hướng cát' cho bếp: đặt bếp (lưng bếp) ở phương xấu của bạn "
            "({xau}) để 'đè' hung khí, còn hướng bếp — hướng miệng bếp/người đứng nấu nhìn về — "
            "quay về phương tốt, ưu tiên Thiên Y ({ty}) hoặc Diên Niên ({dn}). "
            "Thực tế bếp còn cần thông gió, xa nguồn nước bồn rửa một khoảng và không nằm ngay lối cửa chính."),
            xau=", ".join(_hg(h) for h in xau), ty=_hg(theo["Thiên Y"]), dn=_hg(theo["Diên Niên"]))})
    elif not pl["huong"] and chung.co(t, [r"giuong", r"dau giuong", r"quay dau", r"phong ngu", r"ngu quay"]):
        muc.append({"loai": "goi_y_vi_tri", "doi_tuong": L("hoi.pt.vat.giuong", "giường"), "noi_dung": L("hoi.pt.goi_y.giuong", (
            "Đầu giường (hướng đỉnh đầu khi nằm) theo Bát trạch nên quay về phương tốt của người nằm: Thiên Y "
            "({ty}) cho giấc ngủ, sức khoẻ; Diên Niên ({dn}) cho vợ chồng hoà thuận; "
            "Phục Vị ({pv}) cho sự ổn định. Tránh {xau}. "
            "Thực tế: đầu giường nên tựa tường đặc, không ngay dưới xà, không đối thẳng cửa."),
            ty=_hg(theo["Thiên Y"]), dn=_hg(theo["Diên Niên"]), pv=_hg(theo["Phục Vị"]), xau=", ".join(_hg(h) for h in xau))})
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
        s = (L("hoi.pt.nha.huong", "Theo hồ sơ nhà bạn lưu: nhà hướng {h}", h=_hg(m["huong"]))
             + (L("hoi.pt.nha.trach", ", {q} trạch", q=_q(m["trach"])) if m["trach"] else "") + ".")
        if m["cung_nhom"] is not None:
            s += (L("hoi.pt.nha.cung_nhom", " Cùng nhóm Đông/Tây với mệnh quái của bạn.") if m["cung_nhom"]
                  else L("hoi.pt.nha.khac_nhom", " Khác nhóm Đông/Tây với mệnh quái của bạn — bù bằng hướng cửa, bếp, giường theo hướng tốt của bạn."))
        cau.append(s)
    for p in m["phong"]:
        ten_p = L(f"hoi.pt.phong.{p['phong']}", p["ten"])
        if not p["cung"]:
            cau.append(L("hoi.pt.nha.chua_vi_tri", "{p}: hồ sơ nhà chưa ghi vị trí — đặt phòng ở Khảo sát nhà (hoặc vẽ mặt bằng) để xem theo đúng nhà bạn.", p=ten_p))
            continue
        theo = (L("hoi.pt.nha.theo_menh", "với mệnh quái của bạn") if p["theo"] == "menh"
                else L("hoi.pt.nha.theo_trach", "theo trạch của nhà (chưa có năm sinh)"))
        if p["cung"] != "Trung cung" and not p["du_nien"]:
            cau.append(L("hoi.pt.nha.chua_xet", "{p} nhà bạn ở phía {c}. Hồ sơ nhà chưa có hướng nhà và bạn chưa nhập năm sinh nên chưa xét "
                         "được phương này hợp hay không. {nen}", p=ten_p, c=_hg(p["cung"]), nen=p["nen"]))
            continue
        if p["cung"] == "Trung cung":
            cau.append(L("hoi.pt.nha.trung_cung", "{p} nhà bạn nằm ở giữa nhà (trung cung). {nen}", p=ten_p, nen=p["nen"]))
        else:
            danh_gia = "" if p["hop"] is None else (L("hoi.pt.nha.dung", " — đúng cách sách dặn.") if p["hop"]
                                                    else L("hoi.pt.nha.chua_dung", " — chưa đúng cách sách dặn."))
            cau.append(L("hoi.pt.nha.phong", "{p} nhà bạn ở phía {c}: {theo} là {dn}{dg} {nen}", p=ten_p, c=_hg(p["cung"]),
                         theo=theo, dn=_dn(p["du_nien"]), dg=danh_gia, nen=p["nen"]))
    for d in m["dau_hieu"]:
        s = (L("hoi.pt.nha.da_ghi", "Bạn đã ghi nhà có “{td}”", td=d["tieu_de"].lower())
             + (L("hoi.pt.nha.veto", " — nhóm nên xử lý trước.") if d["veto"] else "."))
        if d["viec_0"]:
            s += L("hoi.pt.nha.viec_0", " Việc không tốn tiền: {v}", v=d["viec_0"])
        cau.append(s)
    for d in m["dau_hieu_hoi"]:
        if d["trang_thai"] == "khong_con":
            cau.append(L("hoi.pt.nha.khong_con", "Hồ sơ nhà ghi nhà bạn không còn “{td}” (đã xử lý hoặc không có) — bài đọc Nhà của bạn không xét dấu hiệu này.",
                         td=d["tieu_de"].lower()))
        elif d["trang_thai"] == "chua_khai":
            cau.append(L("hoi.pt.nha.chua_khai", "Hồ sơ nhà chưa ghi “{td}” — nếu nhà bạn có, tích ở Khảo sát nhà để bài đọc xếp việc cho đúng.",
                         td=d["tieu_de"].lower()))
    for q in m["quy_tac"]:
        cau.append(f"{q['tieu_de']}: {q['noi_dung']}")
    return " ".join(cau)


def _vai(v: str) -> str:
    if ngon_ngu.la_viet():
        return v
    from app.luangiai import phongthuy_hien as ph  # noqa: PLC0415
    return ph.cap_ccb(v)


def _tdg_ten(x: dict | None, nhom: str) -> str:
    """Tên Kim lâu / Hoang ốc theo ngôn ngữ (KB tập quán theo mã); bản Việt giữ tên CALC."""
    if not x:
        return ""
    if ngon_ngu.la_viet():
        return x["ten"]
    from app.kb import nap  # noqa: PLC0415
    return ((nap.doc("tuoi_dan_gian_kb.json").get(nhom) or {}).get(x.get("ma")) or {}).get("ten", x["ten"])


def _cc(s: str) -> str:
    if ngon_ngu.la_viet() or not isinstance(s, str):
        return s
    from app.luangiai import phongthuy_hien as ph  # noqa: PLC0415
    return ph.can_chi(s)


# ------------------------------------------------------------------ NARRATIVE (template)
def _doan(m: dict) -> tuple[str, str | None]:
    l = m["loai"]
    if l == "sao_han":
        return chung.doan_sao_han(m), None
    if l == "menh_quai":
        ai = m.get("vai") or L("hoi.pt.ban", "bạn")
        return (L("hoi.pt.menh_quai", "Mệnh quái (cung phi) của {ai}: {q} ({nhom}, tính theo năm {nam}; "
                  "hành {hanh}, tính chất {tc}). Hướng tốt: {tot}. Hướng xấu: {xau}.", ai=ai, q=_q(m["quai"]),
                  nhom=_nhom(m["nhom"]), nam=m["nam_tinh"], hanh=_th("hanh", m["ngu_hanh"]), tc=m["tinh_chat"],
                  tot=_noi_ds(_dn_huong(x) for x in m["tot"]), xau=_noi_ds(_dn_huong(x) for x in m["xau"])), None)
    if l == "du_nien":
        dau = L("hoi.pt.du_nien.huong", "Hướng {h} ", h=_hg(m["huong"])) if m.get("huong") else ""
        vai = f"({_vai(m['vai'])}) " if m.get("vai") else ""
        return (L("hoi.pt.du_nien" if dau or vai else "hoi.pt.du_nien.tron", "{dau}{vai}— {ten} ({loai}): {y} Hợp dùng cho: {dc}.",
                  dau=dau, vai=vai, ten=_dn(m["ten"]),
                  loai=L("hoi.pt.huong_tot", "hướng tốt") if m["cat_hung"] == "cát" else L("hoi.pt.huong_xau", "hướng xấu"),
                  y=m["y_nghia"], dc=m["dung_cho"]), None)
    if l == "trach":
        s = L("hoi.pt.trach", "Nhà hướng {h} thì toạ {toa} → {q} trạch ({nhom}).", h=_hg(m["huong"]), toa=_hg(m["toa"]),
              q=_q(m["quai"]), nhom=_nhom(m["nhom"]))
        if "hop_nhom" in m:
            s += (L("hoi.pt.trach.cung", " Cùng nhóm với mệnh quái của bạn.") if m["hop_nhom"] else
                  L("hoi.pt.trach.khac", " Khác nhóm với mệnh quái của bạn — Bát trạch gợi ý bù bằng hướng cửa, bếp, giường theo hướng tốt của bạn."))
        return s, None
    if l == "cua_chu_bep":
        from app.luangiai import phongthuy_hien as ph  # noqa: PLC0415
        ds = "; ".join(f"{c['cap'] if ngon_ngu.la_viet() else ph.cap_ccb(c['cap'])} ({_hg(c['tu'])} → {_hg(c['den'])}): {_dn(c['du_nien'])}"
                       for c in m["cap"])
        return (L("hoi.pt.ccb", "Cửa–bếp theo Dương Trạch Tam Yếu: {ds}. ", ds=ds)
                + (L("hoi.pt.ccb.cung", "Cùng nhóm Đông/Tây tứ — thuận.") if m["cung_nhom"] else
                   L("hoi.pt.ccb.khac", "Khác nhóm Đông/Tây tứ — kém thuận; có thể xoay miệng bếp về hướng tốt.")), None)
    if l == "bo_tri":
        nhan = L("hoi.pt.dan_gian", " (quan niệm dân gian)") if m["nguon"] == "dan_gian" else ""
        # Q4/Q5: thêm cách nhìn đời sống + việc 0 đồng (KB bo_tri.viec) cho các dấu hiệu có trong form khảo sát.
        them = L("hoi.pt.doi_song", " Nhìn theo đời sống: {x}", x=m["giai_thich_hien_dai"]) if m.get("giai_thich_hien_dai") else ""
        v0 = next((v["lam"] for v in (m.get("viec") or []) if v["chi_phi"] == "khong_ton"), None)
        viec = L("hoi.pt.viec_0", " Việc không tốn gì: {v}", v=v0) if v0 else ""
        return L("hoi.pt.bo_tri", "{td}{nhan}: {nd}{them} Gợi ý thực tế: {gy}{viec}", td=m["tieu_de"], nhan=nhan,
                 nd=m["noi_dung"], them=them, gy=m["goi_y"], viec=viec), None
    if l == "am_trach":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "sao_nam":
        return (L("hoi.pt.sao_nam", "Năm {nam} ({chi}): Ngũ Hoàng ở {nh}; Thái Tuế ở {tt}, "
                  "Tuế Phá ở {tp}; Tam Sát ở {ts}. Truyền thống kiêng động thổ lớn ở các phương này.", nam=m["nam"],
                  chi=_th("chi", m["chi"]), nh=_hg(m["ngu_hoang"]), tt=_hg(m["thai_tue"]), tp=_hg(m["tue_pha"]),
                  ts=_hg(m["tam_sat"])), None)
    if l == "tuoi_lam_nha":
        kl, ho, tt = m["kim_lau"], m["hoang_oc"], m["tam_tai"]
        # Một câu liệt kê + MỘT câu kết (không nhắc lại phần liệt kê — review EN-1).
        nt = m.get("nam_thuan") or []
        ket = (L("hoi.pt.tln.thuan", "Theo tập quán, năm này làm nhà thuận.") if m.get("ket_ma") == "thuan" else
               L("hoi.pt.tln.tranh", "Dân gian thường tránh làm nhà năm này")
               + (L("hoi.pt.tln.gan_nhat", "; năm gần nhất không phạm là {nam} ({cc}).", nam=nt[0]["nam"], cc=_cc(nt[0]["can_chi"]))
                  if nt else ".")
               + (L("hoi.pt.tln.kl_cuoi", " Với cưới hỏi, Kim lâu chỉ xét tuổi cô dâu.") if kl else ""))
        return (L("hoi.pt.tln", "Tuổi làm nhà năm {nam} (quan niệm dân gian, tuổi mụ {tuoi}): {kl}; Hoang ốc {ho}; {tt}. {ket}",
                  nam=m["nam_xem"], tuoi=m["tuoi_mu"],
                  kl=L("hoi.pt.tln.pham", "phạm {x}", x=_tdg_ten(kl, "kim_lau")) if kl else L("hoi.pt.tln.khong_kl", "không phạm Kim lâu"),
                  ho=_tdg_ten(ho, "hoang_oc"),
                  tt=L("hoi.pt.tln.tam_tai", "năm thứ {n} của Tam tai", n=tt["nam_thu"]) if tt else L("hoi.pt.tln.khong_tt", "không phạm Tam tai"),
                  ket=ket), None)
    if l == "goi_y_vi_tri":
        return L("hoi.pt.vi_tri", "Vị trí {dt}: {nd}", dt=m["doi_tuong"], nd=m["noi_dung"]), None
    if l == "so_nhom":
        return (L("hoi.pt.so_nhom", "Hai người {cn} ({ban} – {kia}). ",
                  cn=L("hoi.pt.cung_nhom", "cùng nhóm") if m["cung_nhom"] else L("hoi.pt.khac_nhom", "khác nhóm"),
                  ban=_nhom(m["ban"]), kia=_nhom(m["kia"]))
                + (L("hoi.pt.so_nhom.cung", "Có thể chọn hướng nhà hợp cả hai.") if m["cung_nhom"] else
                   L("hoi.pt.so_nhom.khac", "Cách phổ biến: hướng cửa/nhà theo người trụ cột, phòng ngủ và bàn làm việc chọn theo từng người.")),
                None)
    if l == "huyen_khong":
        ds = "; ".join(L("hoi.pt.hk.son", "hướng {h} (toạ {t}): {c}", h=_th("son", x["huong_son"]), t=_th("son", x["toa_son"]),
                         c=_th("cuc_hk", x["cuc_ten"])) for x in m["ds"])
        y = {_th("cuc_hk", x["cuc_ten"]): x["y"] for x in m["ds"]}
        return (L("hoi.pt.hk", "Huyền Không — nhà hướng {h} nhập trạch/xây trong vận {van} ({tu}–{den}). Hướng {h} gồm {so} sơn, "
                  "mỗi sơn ra một cục: {ds}. ", h=_hg(m["huong"]), van=m["van"], tu=m["tu_nam"], den=m["den_nam"], so=m["so_son"], ds=ds)
                + " ".join(f"{k}: {v}" for k, v in y.items())
                + L("hoi.pt.hk.cuoi", " Muốn biết đúng sơn và đủ 9 cung, đo độ la bàn rồi lập trạch bàn ở mục Phong thuỷ."), None)
    if l == "giai_thich":
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "nha_rieng":
        return _doan_nha(m), None
    if l == "ghi_chu":
        return m["noi_dung"], None
    return "", None


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    doan = [d for d, _ in (_doan(m) for m in goi["muc"]) if d]
    if goi["mau"]:
        doan.append(goi["mau"])
    doan.append(L("hoi.tu_soi", "Câu hỏi để tự soi: ")
                + L("hoi.pt.tu_soi", "Ngoài hướng, ngôi nhà này có đủ ánh sáng, thông gió và yên tĩnh cho người ở chưa?"))
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(L("hoi.ket", hoi_van.KET))
    return "\n\n".join(doan)


def _them_chu_y(goi: dict, pl: dict, nha: dict | None, nam_xem: int) -> None:
    """CY-1: câu hỏi về điều người dùng lo ở một mảng (tiền bạc, giấy tờ, nhà cửa… / vận hạn) → mục "năm nên chú ý":
    sao lưu niên tới phía cửa chính (cùng hàm báo cáo Nhà của bạn) + việc + ranh giới; đứng đầu (sau sao hạn, nhà riêng)."""
    from app.luangiai import chu_y_nam as cyn  # noqa: PLC0415
    t = pl["cau_chuan_hoa"]
    mg = cyn.mang_hoi(t)
    if not mg or mg == "suc_khoe":
        return
    huong = None
    if nha:
        try:
            from app.luangiai import phongthuy_doi_song as pds  # noqa: PLC0415
            huong = pds._huong_nha(nha)[0]
        except (ValueError, TypeError, KeyError):
            huong = None
    if mg == "van_han":
        if not huong:
            return
        from app.calc import huyen_khong as hk  # noqa: PLC0415
        q = next((k for k, v in hk.QUAI.items() if v[1] == huong), None)
        if not q:
            return
        m = cyn.muc_van_han({x: cyn.phongthuy_nam(q, nam_xem, x, cyn.SO_NAM, f"cửa chính ({huong})")
                             for x in ("tien_bac", "giay_to", "nha_cua")}, [nam_xem, nam_xem + 1], cyn.noi_chac(t))
    else:
        nd = cyn.phongthuy_doan_hoi(mg, nam_xem, huong)
        if cyn.noi_chac(t):
            nd = f"{cyn.kb.mau('khong_noi_chac')} {nd}"
        m = {"loai": "ghi_chu", "ma": "chu_y_nam", "mang": mg, "noi_dung": nd, **cyn.kb.meta()}
    i = next((k for k, x in enumerate(goi["muc"]) if x.get("loai") not in ("sao_han", "nha_rieng")), len(goi["muc"]))
    goi["muc"].insert(i, m)
    chung.ket(goi)


def _cau_noi(goi: dict, pl: dict, cau_hoi: str) -> None:
    """CY-2 (2026-11-14): câu hỏi KHÔNG về nhà (người cùng làm ăn, thị phi, thi cử, con cái, thăng tiến, ra nước ngoài, mua
    xe…) → một câu nối "phong thuỷ nhà không trả lời thẳng chuyện này" + MỘT gợi ý bố trí (bàn làm việc, góc học, cửa…) +
    điều nên để ý + việc (KB `chu_y_kb`), đứng đầu; bỏ khối mệnh quái khi câu không hỏi hướng. Câu đã có mục bố trí
    (`bo_tri`) giữ nguyên."""
    from app.kb import chu_y_kb as cykb  # noqa: PLC0415
    t = pl["cau_chuan_hoa"]
    dieu = mo_dau.dieu_hoi(t, cau_hoi if ngon_ngu.la_viet() else None)
    mg = mo_dau.mang_chu_y(dieu, t, cau_hoi)
    if not mg or not cykb.pt_bo_tri(mg) or (mg not in ("hop_tac", "tieu_nhan")
                                             and any(m.get("loai") == "bo_tri" for m in goi["muc"])):
        return
    if mo_dau.la_nguoi_lam_an(t, cau_hoi):      # "partner" ở câu người cùng làm ăn không phải phòng ngủ vợ chồng
        goi["muc"] = [m for m in goi["muc"] if not str(m.get("ma") or "").startswith("vo_chong")]
    cy = next((m for m in goi["muc"] if m.get("ma") == "chu_y_nam" and m.get("mang") == mg), None)
    phan = [cykb.mau("pt_noi").format(mang=cykb.ten(mg), bo_tri=cykb.pt_bo_tri(mg))]
    phan = mo_dau.hai_mat(phan, dieu, t, cau_hoi, viec_san=bool(cy))
    if not cy and mg != "hop_tac" and cykb.ranh_gioi(mg):
        phan.append(cykb.ranh_gioi(mg))
    nd = f"{mo_dau.ve_mang(mg)}: {mo_dau.thuong(mo_dau.ghep(*phan))}"
    i = next((k for k, x in enumerate(goi["muc"]) if x.get("loai") not in ("sao_han", "nha_rieng")), len(goi["muc"]))
    goi["muc"].insert(i, {"loai": "ghi_chu", "ma": "cau_noi", "mang": mg, "noi_dung": nd, **cykb.meta()})
    if not chung.co(t, [r"(?<!\w)huong", r"menh quai", r"cung phi", r"bat trach", r"direction", r"kua"]):
        goi["muc"] = [m for m in goi["muc"] if m.get("loai") not in ("menh_quai", "du_nien")]
    chung.ket(goi)


def tra_loi(cau_hoi: str, sinh: dict | None = None, ngay_xem: dt.date | None = None,
            dung_llm: bool = False, nha: dict | None = None) -> dict:
    """`sinh` = {"nam": int, "gioi_tinh": "nam"|"nu", "ngay": date|None}. `nha` (Y6) = hồ sơ nhà trên máy người hỏi
    ({huong_do|huong, bo_cuc?}) — chỉ dùng trong lượt gọi, không lưu.

    EN-ALL GĐ 5 (mẫu hỏi đáp Bát tự / Tử vi): bản ngôn ngữ khác phân loại MỘT lần (câu gốc, đã dịch ý), dựng bản Việt
    trước để ghi quyết định dựa trên chữ (thứ tự đoạn — `doi_song_khuon.vi_quyet_dinh`), rồi dựng bản ngôn ngữ đó theo
    đúng quyết định ấy; cuối cùng đổi tên riêng / câu CALC trong gói bằng chứng và khối hình sang ngôn ngữ đó."""
    if ngon_ngu.la_viet():
        return _tra_loi(cau_hoi, sinh, ngay_xem, dung_llm, nha)
    import copy  # noqa: PLC0415
    from app.luangiai import an_toan as _at  # noqa: PLC0415
    from app.luangiai import doi_song_khuon as _dsk  # noqa: PLC0415
    pl = phan_loai(cau_hoi)
    kq = _dsk.vi_quyet_dinh(lambda: _tra_loi(cau_hoi, sinh, ngay_xem, False, nha, copy.deepcopy(pl)))()
    kq = _hien(kq)
    if pl["xu_ly"] != "an_toan" and _at.ho_tro_mem_en(cau_hoi):     # tầng hỗ trợ MỀM — chỉ bản ngôn ngữ khác tiếng Việt
        kq["ho_tro"] = _at.loi_ho_tro_mem()
    return kq


def _tra_loi(cau_hoi: str, sinh: dict | None = None, ngay_xem: dt.date | None = None,
             dung_llm: bool = False, nha: dict | None = None, pl: dict | None = None) -> dict:
    pl = pl if pl is not None else phan_loai(cau_hoi)
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    nam_xem, nam_am = chung.nam_xem_hh(pl["nam_xem"], ngay_xem, pl["cau_chuan_hoa"])
    cac = chung.nam_hoi_hh(pl["cau_chuan_hoa"], ngay_xem, "am")     # năm âm lịch Việt (tuổi làm nhà theo Tết)
    if len(cac) >= 2:
        pl["cac_nam_hoi"] = cac                 # EN-3: hỏi so hai năm (tuổi làm nhà từng năm)
    goi = goi_bang_chung(pl, sinh, nam_xem, nam_am)
    if chung.sao_han_hoi(pl["cau_chuan_hoa"]) and sinh and sinh.get("gioi_tinh") and not goi["can_them"] \
            and pl["xu_ly"] not in chung.DAC_BIET:   # MT-ĐS B3 — không chèn trước lời hỗ trợ / từ chối / dẫn hướng
        ng = sinh.get("ngay")
        goi["muc"].insert(0, chung.muc_sao_han(nam_am, sinh["nam"], sinh["gioi_tinh"], ng.month if ng else None, ng.day if ng else None))
        chung.ket(goi)
    if nha and pl["xu_ly"] not in chung.DAC_BIET:
        mn = muc_nha(pl, sinh, nha)
        if mn:
            goi["muc"].insert(0, mn)                 # trả lời theo đúng nhà trước, kiến thức chung sau
            goi["phan_loai"]["theo_nha"] = True
    if pl["xu_ly"] not in chung.DAC_BIET and not goi["can_them"] and chung.co(pl["cau_chuan_hoa"], SUC_KHOE_KW):
        # SK-1 (2026-11-04): câu sức khoẻ → năm sao lưu niên 2 / 5 tới phía phòng ngủ (cùng hàm báo cáo Nhà của bạn)
        from app.luangiai import suc_khoe_nam as skn  # noqa: PLC0415
        phuong = None
        if nha:
            try:
                from app.luangiai import phongthuy_bo_cuc as bc  # noqa: PLC0415
                vt = bc.luan(_bo_cuc_tu_nha(nha), sinh)["da_tinh"]["vi_tri"]
                phuong = next((x["cung"] for x in vt if x["phong"] == "phong_ngu_chinh" and x["cung"] != "Trung cung"), None)
            except (ValueError, TypeError, KeyError):
                phuong = None
        goi["muc"].insert(0, {"loai": "ghi_chu", "ma": "suc_khoe_nam", "noi_dung": skn.phongthuy_doan_hoi(nam_xem, phuong),
                              **skn.kb.meta()})
        if (g := chung.muc_suc_khoe_hoi(pl["cau_chuan_hoa"])):
            goi["muc"].insert(1, g)
        chung.ket(goi)
    if pl["xu_ly"] not in chung.DAC_BIET and not goi["can_them"]:
        _them_chu_y(goi, pl, nha, nam_xem)                                  # CY-1
        if not goi["phan_loai"].get("theo_nha"):
            _cau_noi(goi, pl, cau_hoi)                                      # CY-2
    if pl["xu_ly"] not in chung.DAC_BIET and mo_dau.khong_mo(pl["cau_chuan_hoa"]):
        # Review CY-1: câu khủng hoảng quan hệ (ngoại tình, ly hôn…) — Phong thuỷ cũng mở bằng câu đồng cảm như 4 mảng kia
        # (đoạn mở đầu Phong thuỷ đang tắt nên câu này vào gói như một mục đứng đầu).
        goi["muc"].insert(0, {"loai": "ghi_chu", "ma": "dong_cam",
                              "noi_dung": mo_dau.dong_cam(mo_dau.dieu_hoi(pl["cau_chuan_hoa"], cau_hoi))})
        chung.ket(goi)
    van = chung.tra_loi_truoc(van_template(goi), goi["phan_loai"].get("cau_chuan_hoa") or chung.chuan_hoa_cau(cau_hoi),
                              khoa=("hoi.pt", "truoc"))   # EN-3; EN-ALL: bản dịch theo thứ tự đoạn bản Việt

    # EN-3b: đoạn mở đầu Phong thuỷ CHƯA bật — trên holdout đóng băng trả lời thẳng lùi 72 → 68 % khi bật (đoạn mở đầu đẩy
    # đoạn bố trí ra khỏi đoạn 1–2). Hàm `mo_dau.pt_mo` giữ lại; bật khi sửa được bằng bộ dev mà holdout không lùi.
    if PT_MO_DAU and pl["xu_ly"] not in chung.DAC_BIET and not goi["phan_loai"].get("theo_nha"):
        van = mo_dau.dat_dau(van, mo_dau.pt_mo(goi, pl["cau_chuan_hoa"], cau_hoi), goi)
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi, cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi, van)   # EN-4: bản mẫu là nguồn chữ
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {mo_ta_loi(e)}"]
    dac_biet = pl["xu_ly"] in chung.DAC_BIET or bool(goi["can_them"])
    return {"hoi_lai": chung.hoi_lai_neu(pl, "phongthuy"), "phan_loai": goi["phan_loai"], "bang_chung": goi, "cau_tra_loi": van, "che_do_van": che_do_van,
            "loi_kiem_tra": loi, "can_them": goi["can_them"], "co_canh_bao": goi["co_canh_bao"],
            "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong", "truc_quan": truc_quan.phongthuy(goi, pl.get("quai"), _menh_rieng(pl, sinh)), "hoi_tiep": truc_quan.hoi_tiep_phongthuy(pl)}


# ------------------------------------------------------------------ EN-ALL GĐ 5: gói bằng chứng + khối hình theo ngôn ngữ
_TU_PT = {"tot": "dn_huong", "xau": "dn_huong", "ngu_hanh": "hanh", "chi": "chi", "ngu_hoang": "huong", "thai_tue": "huong",
          "tue_pha": "huong", "tam_sat": "huong", "cat_hung": "cat_hung", "ban": "nhom_trach", "kia": "nhom_trach",
          "trach": "quai", "menh_quai": "quai", "toa_son": "son", "huong_son": "son", "cung": "huong", "du_nien": "du_nien"}


def _hien_chuoi(k: str, v: str):
    from app.luangiai import phongthuy_hien as ph  # noqa: PLC0415
    n = _TU_PT.get(k)
    if n == "dn_huong":
        return _dn_huong(v)
    if n == "cat_hung":
        return _ten.ten("cat_hung", v) if _ten.muc("cat_hung", v) else v
    if n:
        return _th(n, v)
    if k == "can_chi" or k.startswith("can_chi"):
        return ph.can_chi(v)
    if k == "ten" and _ten.muc("du_nien", v):
        return _dn(v)
    if k == "cuc_ten":
        return _th("cuc_hk", v)
    if k in ("vai", "cap"):
        return _vai(v)
    return v


def _hien_goi(x, k: str = ""):
    if isinstance(x, dict):
        if k in ("kim_lau", "hoang_oc") and x.get("ma"):
            from app.kb import nap  # noqa: PLC0415
            m = (nap.doc("tuoi_dan_gian_kb.json").get(k) or {}).get(x["ma"]) or {}
            return {**x, **{kk: m[kk] for kk in ("ten", "nghia") if kk in m}}
        if k == "tam_tai":
            from app.kb import nap  # noqa: PLC0415
            m = nap.doc("tuoi_dan_gian_kb.json").get("tam_tai") or {}
            return {**x, **{kk: m[kk] for kk in ("ten", "nghia") if isinstance(m.get(kk), str)}}
        if isinstance(x.get("phong"), str) and isinstance(x.get("ten"), str):
            x = {**x, "ten": L(f"hoi.pt.phong.{x['phong']}", x["ten"])}
        if k == "nam" and isinstance(x.get("can_chi"), str):
            return {**x, "can_chi": _cc(x["can_chi"])}
        return {kk: _hien_goi(v, kk) for kk, v in x.items() if kk != "tu_khoa"}    # tu_khoa = mẫu so khớp tiếng Việt (nội bộ)
    if isinstance(x, list):
        return [_hien_goi(v, k) for v in x]
    if isinstance(x, str):
        return _hien_chuoi(k, x)
    return x


_TQ_GIAI = re.compile(r"^(?:(.+?)\. )?Hợp dùng cho: (.+)\.$")


def _hien_tq(ds: list[dict]) -> list[dict]:
    """Khối hình Phong thuỷ (`truc_quan.phongthuy`, dựng từ mã tiếng Việt) → chữ theo ngôn ngữ. Mã hướng (`huong`) giữ —
    web dùng làm khoá vị trí trên la bàn; tên hiển thị đi qua `ten_hien`."""
    ra = []
    for b in ds:
        b = dict(b)
        kieu = b.get("kieu")
        if kieu == "la_ban":
            muc = []
            for m in b.get("muc") or []:
                m = dict(m)
                hop = m.get("sac") == "hop"
                m["nhan"] = _dn(m["nhan"]) if hop else L("hoi.pt.tq.it_hop", "Ít hợp")
                g = m.get("giai_thich") or ""
                k = _TQ_GIAI.match(g)
                if k:
                    m["giai_thich"] = ((L("hoi.pt.tq.dn_dau", "{dn}. ", dn=_dn(k.group(1))) if k.group(1) else "")
                                       + L("hoi.pt.tq.dung_cho", "Hợp dùng cho: {x}.", x=k.group(2)))
                elif g.startswith("Nên dùng cho phòng phụ") or g.endswith("Nên dùng cho phòng phụ, kho, nhà vệ sinh."):
                    dau = g[: -len("Nên dùng cho phòng phụ, kho, nhà vệ sinh.")].rstrip(". ")
                    m["giai_thich"] = ((L("hoi.pt.tq.dn_dau", "{dn}. ", dn=_dn(dau)) if dau else "")
                                       + L("hoi.pt.tq.phong_phu", "Nên dùng cho phòng phụ, kho, nhà vệ sinh."))
                if m.get("khop"):     # cụm chữ trong lời trả lời (dòng hướng tốt của mệnh quái) — trọn cụm, không dính hướng khác
                    m["khop"] = [L("hoi.pt.dn_huong", "{dn} ({h})", dn=_dn(m["nhan"]), h=_hg(m["huong"]))]
                muc.append(m)
            b["muc"] = muc
            td = b.get("tieu_de") or ""
            if td == "Bốn hướng hợp với bạn":
                b["tieu_de"] = L("hoi.pt.tq.bon_huong", td)
            elif td.startswith("Bốn hướng hợp người mệnh "):
                b["tieu_de"] = L("hoi.pt.tq.bon_huong_q", "Bốn hướng hợp người mệnh {q}", q=_q(td.rsplit(" ", 1)[-1]))
            gc = b.get("ghi_chu")
            if gc == "Hướng tính theo năm sinh của bạn; bấm một hướng để xem hợp đặt gì.":
                b["ghi_chu"] = L("hoi.pt.tq.gc", gc)
            elif gc and gc.startswith("Đây là hướng hợp với bạn."):
                b["ghi_chu"] = L("hoi.pt.tq.gc_rieng", gc)
            elif gc and gc.startswith("Hướng bạn hỏi: "):
                hs = gc[len("Hướng bạn hỏi: "):].split(". Bấm")[0].split(", ")
                b["ghi_chu"] = L("hoi.pt.tq.gc_hoi", "Hướng bạn hỏi: {ds}. Bấm một hướng để xem hợp đặt gì.",
                                 ds=", ".join(_hg(h) for h in hs))
        elif kieu == "hai_cot":
            td = b.get("tieu_de") or ""
            k = re.match(r"^(.+) nằm trong bốn hướng (hợp|ít hợp)$", td)
            b["tieu_de"] = (L("hoi.pt.tq.nam_trong_hop" if k.group(2) == "hợp" else "hoi.pt.tq.nam_trong_it", td,
                              dn=_dn(k.group(1))) if k else L("hoi.pt.tq.tam_huong", td))
            for cot, ma in (("trai", "hoi.pt.tq.cot_hop"), ("phai", "hoi.pt.tq.cot_it")):
                c = dict(b[cot])
                c["tieu_de"] = L(ma, c["tieu_de"])
                c["ds"] = [(L("hoi.pt.tq.dong", "{dn}: {dc}", dn=_dn(x.split(": ", 1)[0]), dc=x.split(": ", 1)[1])
                            if ": " in x else _dn(x)) for x in c["ds"]]
                b[cot] = c
        elif kieu == "o":
            b["tieu_de"] = L("hoi.pt.tq.ccb", b.get("tieu_de") or "")
            b["muc"] = [{**m, "nhan": _vai(m.get("nhan") or ""), "gia_tri": _dn(m.get("gia_tri")),
                         "chu_thich": L("hoi.pt.tq.hop", "Hợp") if m.get("sac") == "hop" else L("hoi.pt.tq.it_hop", "Ít hợp")}
                        for m in b.get("muc") or []]
        ra.append(b)
    return ra


def _hien(kq: dict) -> dict:
    """Bản ngôn ngữ khác: tên riêng / câu CALC trong gói bằng chứng + khối hình theo ngôn ngữ; mã ở `phan_loai` giữ."""
    import copy  # noqa: PLC0415
    from app.luangiai import phongthuy_hien as ph  # noqa: PLC0415
    kq = dict(kq)
    goi = copy.deepcopy(kq["bang_chung"])
    phl = goi.pop("phan_loai", None)
    goi["co_canh_bao"] = ph.co_canh_bao(goi.get("co_canh_bao") or [])
    goi = _hien_goi(goi)
    if phl is not None:
        goi["phan_loai"] = phl
    kq["bang_chung"] = goi
    kq["co_canh_bao"] = ph.co_canh_bao(kq.get("co_canh_bao") or [])
    kq["truc_quan"] = _hien_tq(kq.get("truc_quan") or [])
    return kq
