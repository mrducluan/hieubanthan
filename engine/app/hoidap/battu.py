# -*- coding: utf-8 -*-
"""Hỏi đáp Bát tự (HH-3) — RULES: phân loại, chọn khối bằng chứng từ tứ trụ (CALC
app.calc.battu) + KB; NARRATIVE: template (+ LLM có kiểm tra).

Kỷ luật:
  - LLM không tính can chi, tiết khí, đại vận — engine tính (tiết khí VSOP87, golden lunar-typescript).
  - Dụng thần: trình bày cả phù ức/điều hậu (Trích Thiên Tuỷ) và cách cục (Tử Bình Chân Thuyên),
    không tự chọn. Thân vượng/nhược theo thang điểm công bố.
  - Không phán thọ, không tên bệnh, không "khắc chồng khắc con"; không chọn giờ sinh / đặt tên cho con. Sức khoẻ (SK-1):
    được gợi hệ cơ quan theo hành + đi khám và năm nên chú ý sức khoẻ (lời phòng ngừa, không đoán).
"""
from __future__ import annotations

import collections
import datetime as dt
import re

from app import config
from app.calc import battu_mo_rong, battu as bt
from app import ngon_ngu
from app.hoidap import chung, en_gloss, hieu_cau, mo_dau, doi_song_muc as dsm
from app.kb import battu_kb as kb, ten as _ten
from app.kb.loi import L
from app.luangiai import an_toan as _at
from app.luangiai import battu_hien as _bth
from app.luangiai import doi_song_khuon as _dsk
from app.luangiai import hoi as _h, truc_quan
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
       r"hop voi (anh|chi|chong|vo|nguoi)", r"hop lam an",
       r"(toi|em|minh) (va|voi) (nguoi yeu|\bny\b|chong|vo|ban trai|ban gai|doi tac)\b.{0,60}(hop|khac|xung)"]
# EN-3c: "tôi với mẹ tôi có hợp nhau" — người thân (không phải bạn đời / đối tác) → câu về lá số của chính mình, mảng gia đình
_NGUOI_NHA = [r"(bo|cha) me", r"(?<!\w)(bo|me|ba|cha) (toi|em|minh)", r"anh (chi )?em", r"anh trai", r"chi gai", r"em (trai|gai)"]
_BAN_DOI = [r"vo chong", r"(chong|vo) (toi|em|minh)", r"nguoi yeu", r"\bny\b", r"ban (trai|gai)", r"doi tac", r"lam an"]
CON = [r"(cho|cua) con toi", r"con toi (sinh|thieu|thua)", r"sinh con gio", r"dat ten", r"be nha toi",
       r"con (gai|trai) (toi|minh|em)", r"chon gio sinh", r"gio sinh mo", r"con (minh|em) \d{4}", r"con (minh|em|toi) sinh"]  # HH-CT2 + MT-ĐS
# MT-ĐS B1: sinh con hợp tuổi bố mẹ → mẫu tục lệ + ranh giới y tế (không lập tứ trụ).
SINH_CON_TUOI = [r"sinh con nam (nao|\d{4}|tuoi|\w+ )", r"(co nen|nen) sinh con(?! gio)", r"sinh con .{0,25}(hop|xung|khac|kieng)",
                 r"sinh nam \w+ co (khac|xung|hop)"]
NGUOI_KHAC = [r"(cho|giup) (chong|vo|me|bo|ban gai|ban trai|nguoi yeu|sep) toi",
              r"(chong|vo|me|bo|nguoi yeu|sep) toi (sinh|tuoi|co)"]
VAN = [r"dai van", r"luu nien", r"nam nay", r"nam sau", r"muoi nam", r"10 nam", r"nam nao", r"van nao",
       r"khoi van", r"nam 20\d\d", r"bao gio", r"khi nao", r"thang nao", r"nam toi", r"tuong lai", r"luu nguyet",
       r"thang nay", r"van tot", r"vao van"]                                 # MT-ĐS B1: câu "bao giờ / khi nào" là câu vận
# QA-RV: tên thần sát (khớp không dấu) — câu "có Đào Hoa không", "quý nhân ở đâu"…
THAN_SAT_KW = {t: chung.chuan_hoa(t) for t in battu_mo_rong._Y}
THAN_SAT_KW["Thiên Ất Quý Nhân"] = r"quy nhan|thien at"
THAN_SAT_KW["Đào Hoa"] = r"dao hoa|ham tri"
THAN_SAT_KW["Thiên Y"] = r"(sao |than sat )thien y|thien y (la sao|o tru|trong (tu tru|bat tu|la so))"
CHU_DE = [
    # MT-ĐS B1 — hôn nhân / con cái / pháp lý / đi xa / an toàn / học hành / quan hệ / hậu vận đứng TRƯỚC thần sát
    # để "vận đào hoa, ế mãi" đi vào hôn nhân, "Dịch Mã có phải số đi xa" đi vào đi xa (thần sát vẫn được đọc trong mục).
    ("hon_nhan", [r"hon nhan", r"vo chong", r"phu tinh", r"the tinh", r"nguoi yeu", r"ban doi", r"tinh duyen",
                  r"lay (chong|vo)", r"ket hon", r"ly hon", r"lap gia dinh", r"doi (chong|vo)", r"ngoai tinh",
                  r"muon (chong|vo)", r"phan boi", r"(?<!\w)e (mai|qua|dai)", r"nguoi cu", r"(?<!\w)ny(?!\w)", r"cach nhau \d+ tuoi",
                  r"(chong|vo) (em|toi|minh) tuoi"]),
    ("con_cai", [r"con cai", r"may con", r"co con", r"tin vui", r"hiem muon", r"con (toi|minh|em)", r"con sau nay",
                 r"kho co con", r"cho con", r"(?<!\w)no (hoa|thuy|kim|moc|tho)"]),
    ("phap_ly", [r"(bi|di|dang|chuyen|vu|dinh|thang|thua|hay) kien(?!\w)", r"kien (tung|cao|doi|nhau|ai)", r"phap luat", r"pham phap", r"tieu nhan", r"giay to",
                 r"dieu tra", r"dung ten", r"(?<!bat )tu toi", r"(bi|ngoi|vao|dinh) tu(?!\w)", r"di tu (khong|ko|toi|day|ra)", r"tranh chap", r"tai bay", r"dam sau lung", r"hop dong"]),
    ("di_xa", [r"di xa", r"xuat khau", r"dinh cu", r"lap nghiep", r"thanh pho", r"nuoc ngoai", r"nuoc lanh", r"sang (uc|nhat|han|my|duc|canada)",
               r"dich ma", r"roi que", r"doi cho o", r"noi xa", r"lac long", r"tha huong", r"di nuoc ngoai", r"du lich"]),
    ("an_toan", [r"an toan", r"tai nan", r"do mau", r"cuop giat", r"di bien", r"lai xe", r"kiep sat", r"duong nhan",
                 r"xe tai", r"can than gi"]),
    ("hoc_hanh", [r"hoc hanh", r"thi (lai|dai hoc|dau|do|vao)", r"khoi (tu nhien|xa hoi|a|b|c|d)(?!\w)", r"nghien cuu",
                  r"hoc them", r"bang luat", r"thac si", r"tien si", r"hoc (gi|khoi|nganh|len|cao)", r"bang (cap|dai hoc)", r"lam thay", r"thay giao", r"long bong", r"thi .{0,15}dau (khong|ko)",
                  r"thi gi", r"(?<!\w)rot (roi|dai hoc)", r"hoc van", r"duong hoc"]),
    ("quan_he", [r"quy nhan", r"thien at", r"hop tac", r"nguoi lon tuoi", r"canh tranh", r"(?<!\w)ghet(?!\w)", r"ban be",
                 r"nguoi giup", r"giup do", r"nang do", r"tranh cong", r"dong nghiep",
                 r"ty kien nhieu", r"tam hop voi minh"]),
    ("hau_van", [r"hau van", r"ve gia", r"tuoi gia", r"nghi huu", r"co don", r"giao lai", r"49 chua qua", r"den gia",
                 r"dai van cuoi", r"ve gia"]),
    ("than_sat", [r"than sat", r"sao (tot|xau) (gi|nao)", r"co sao gi", r"dao hoa", r"quy nhan", r"thien at",
                  r"dich ma", r"hoa cai", r"van xuong", r"dao hoa", r"hong diem", r"co than", r"qua tu",
                  r"khoi cuong", r"duong nhan", r"loc than", r"kim du", r"thien duc", r"nguyet duc",
                  r"tuong tinh", r"kiep sat", r"vong than", r"ham tri",
                  r"(sao |than sat )thien y", r"thien y (la sao|o tru|trong (tu tru|bat tu|la so))"]),
    ("xung_hop", [r"xung hop", r"hop xung", r"hinh xung", r"xung pha", r"luc hop", r"tam hop", r"luc xung",
                  r"tu hinh", r"tuong hinh", r"luc hai", r"ngu hop", r"co xung", r"bi xung", r"tru (nao )?xung"]),
    # HH-CT2: "tính cách gì" không phải hỏi cách cục
    ("cach_cuc", [r"cach cuc", r"(?<!tinh )cach gi", r"thuoc cach", r"(?<!tinh )(?<!bang )(?<!co )(?<!mot )cach (nao|tot|xau)"]),
    ("tru", [r"tru (nam|thang|ngay|gio)"]),
    ("hon_nhan", [r"hon nhan", r"vo chong", r"phu tinh", r"the tinh", r"nguoi yeu", r"ban doi", r"tinh duyen"]),
    ("nghe_tien", [r"nghe", r"nganh", r"kinh doanh", r"lam cong", r"quan ly", r"tai tinh", r"quan tinh",
                   r"tien", r"giau", r"tich luy", r"dau tu", r"chinh tai hay thien tai", r"tai loc", r"tai van",
                   r"su nghiep", r"cong danh", r"thang chuc", r"cong viec", r"lam quan", r"mat viec", r"doi viec",
                   r"cong ty", r"gop von", r"ngheo", r"giu duoc", r"hao tien", r"bat dong san", r"mua dat", r"ban (dat|nha)",
                   r"tra no", r"(?<!\w)no(?!\w)", r"cua hang", r"nhan loi", r"mua nha", r"khoi nghiep", r"khai truong", r"mo (cua hang|quan|tiem|shop|cong ty|xuong)", r"(tang|deal|xin) luong", r"(?<!\w)luong (thang|cao|thap|bong)",
                   r"hop lam (?!nha|dau|ban)", r"lam chu", r"nhan vien", r"(?<!\w)it(?!\w)", r"lam thue",
                   # CY-1: lo chuyện tiền / việc ("có bị phá sản không", "có mất việc không")
                   r"pha san", r"vo no", r"mat (het )?tien", r"thua lo", r"lo von", r"hao tai", r"sa thai", r"that nghiep"]),
    ("ngu_hanh", [r"thieu hanh", r"ngu hanh", r"vuong suy", r"than vuong", r"than nhuoc", r"dung than",
                  r"hy than", r"ky than", r"mau gi", r"huong gi", r"bo sung", r"can bang", r"khi hau",
                  r"hanh gi", r"lan at", r"nhat chu toi yeu", r"(manh|vuong) hay (yeu|nhuoc)",
                  r"nhat chu .{0,20}(manh|yeu|vuong|nhuoc)", r"mau (sac )?(may man|hop|nao|gi)",
                  r"thieu (kim|moc|thuy|hoa|tho)\b", r"(deo|mang|dung) (gi|da gi|vat gi)"]),
    ("loi_song", [r"loi song", r"sinh hoat", r"suc khoe", r"song the nao", r"mat ngu", r"nghi ngoi", r"kieng gi",
                  r"(?<!\w)yeu(?!\w)", r"(?<!\w)met(?!\w)", r"tim mach", r"dau xuong", r"hay lanh", r"an gi", r"co hon", r"nong tinh",
                  r"(?<!\w)benh (gi|tat)", r"mac benh", r"dau (da day|bung|dau|lung|khop)", r"tieu hoa", r"kham (tong quat|dinh ky)"]),
    ("gia_dinh", [r"cha me", r"to tien", r"anh em", r"con cai", r"gan bo me", r"gia dinh", r"(?<!\w)bo (toi|em|minh)",
                  r"(?<!\w)me (toi|em|minh)", r"em trai", r"chi gai", r"anh trai", r"to nghiep", r"cham bo", r"cham me",
                  r"(?<!\w)bo .{0,12}mat som", r"co nghiep", r"ve que"]),
    ("thap_than", [r"thap than", r"tang can"]),
]
TRU_TEN = {"nam": "năm", "thang": "tháng", "ngay": "ngày", "gio": "giờ"}
LO_SO = [r"co bi .{0,30}(khong|ko|k)(?!\w)", r"co (gap|dinh|vuong|hay bi|phai|bi) .{0,30}(khong|ko|k)(?!\w)", r"so (bi|hay bi|phai)",
         r"so qua", r"lo qua", r"co nguy hiem", r"xui"]


def _chu_de_cau(raw: str, t: str) -> str | None:
    """Chủ đề đời sống của câu. EN-3c: câu kể chuyện nhiều câu ("Mình kết hôn 7 năm chưa có con, … Bát tự có nói gì về
    đường con cái không?") — câu hỏi thật đứng CUỐI: xét từ câu cuối ngược lên."""
    cac = [c for c in re.split(r"(?<=[.!?])\s+", (raw or "").strip()) if c.strip()]
    if len(cac) >= 2:
        # câu HỎI (dấu ?) trước, từ cuối lên; rồi các câu kể — "… nhiều đời chồng không? Mẹ tôi lo lắm." hỏi về hôn nhân
        cac = [c for c in cac if c.rstrip().endswith("?")][::-1] + [c for c in cac if not c.rstrip().endswith("?")][::-1]
        for c in cac:                      # câu cuối chỉ là "có nói gì về chuyện này?" → câu trước nó
            cd = next((cd for cd, mau in CHU_DE if chung.co(chung.chuan_hoa_cau(c), mau)), None)
            if cd:
                return cd
    return next((cd for cd, mau in CHU_DE if chung.co(t, mau)), None)


def _can_nhac(t: str) -> list[str]:
    return [CAN_KD[m] for m in re.findall(r"nhat chu (giap|at|binh|dinh|mau|ky|canh|tan|nham|quy)\b", t)]


def _giai_thich_khop(t: str) -> list[str]:
    return [ma for ma, m in kb.giai_thich_tat_ca().items() if chung.co(t, m["tu_khoa"])]


def phan_loai(cau_hoi: str) -> dict:
    goc = cau_hoi
    if not ngon_ngu.la_viet():
        # EN-ALL GĐ 3c: câu tiếng Anh → cụm từ khoá tiếng Việt (hoidap/en_gloss) rồi đi đúng luật định tuyến bên dưới;
        # bộ chặn an toàn xét trên CÂU GỐC tiếng Anh (luangiai/an_toan, một bộ cho mọi ngôn ngữ).
        cau_hoi = en_gloss.gloss(goc, "battu") or goc
    gioi_thieu, t_chinh = _h._tach_gioi_thieu(cau_hoi)
    t = chung.chuan_hoa_cau(cau_hoi)
    kq = {"cau_chuan_hoa": t, "cau_goc": goc, "loai": None, "xu_ly": "tra_loi", "chu_de": None,
          "can": _can_nhac(t_chinh), "mua": next((k for k, m in MUA_KW.items() if re.search(m, t)), None),
          "thap_than": [k for k, m in TT_KW.items() if chung.co(t_chinh, [m])],
          "nhom": [k for k, m in NHOM_KW.items() if chung.co(t_chinh, m)],
          "tru": [TRU_TEN[m] for m in re.findall(r"tru (nam|thang|ngay|gio)", t_chinh)],
          "giai_thich": _giai_thich_khop(t_chinh), "ca_nhan": chung.co(t_chinh, CA_NHAN),
          "nam_xem": None}
    m = re.search(r"nam (20\d\d)", t)
    kq["nam_xem"] = int(m.group(1)) if m else None
    db = chung.dac_biet(t, goc) if goc == cau_hoi else (chung.dac_biet(chung.chuan_hoa_cau(goc), goc) or chung.dac_biet(t, cau_hoi))
    if db:
        kq.update(xu_ly=db, loai="dac_biet")
        return kq
    kq["lo_so"] = chung.co(t_chinh, LO_SO)
    kq["sao_han"] = chung.sao_han_hoi(t)
    # EN-3: "trụ năm và trụ giờ CỦA TÔI có xung nhau" là câu về chính lá số; có người thứ hai thì vẫn là hợp
    if chung.co(t, HOP) and not (chung.co(t, _NGUOI_NHA) and not chung.co(t, _BAN_DOI)) and (not (kq["tru"] or chung.co(t, [r"tru nao"])) or chung.co(t, [r"vo chong", r"hai (nguoi|dua|ben)", r"ca hai",
                                                           r"nguoi (kia|ay)", r"(chong|vo|nguoi yeu) (toi|minh|em)"])):
        kq["loai"] = "hop"
    elif chung.co(t, CON):
        kq["loai"] = "con"
    elif chung.co(t, SINH_CON_TUOI):
        kq["loai"] = "sinh_con_tuoi"
    elif chung.co(t, NGUOI_KHAC) and not chung.co(t, [r"^(toi|em|minh) (voi|va) "]):   # EN-3c: "tôi với mẹ tôi…"
        kq["loai"] = "nguoi_khac"
    elif kq["can"] and not kq["ca_nhan"] and not chung.co(t_chinh, VAN):   # EN-3c: "nhật chủ Canh, năm nay cv…" = vận
        kq["loai"] = "nhat_chu_chung"
    elif kq["thap_than"] and not kq["ca_nhan"] and not kq["giai_thich"]:
        kq["loai"] = "thap_than_chung"
    elif kq["giai_thich"] and not kq["ca_nhan"]:
        kq["loai"] = "ky_thuat"
    elif td := hieu_cau.la_kien_thuc_tu_dien(t_chinh, cau_hoi, "battu"):
        kq["loai"], kq["tu_dien"] = "ky_thuat", [m["ma"] for m in td]     # EN-3: câu kiến thức → từ điển, không tứ trụ
    elif not ngon_ngu.la_viet() and (td_en := en_gloss.tu_dien_kien_thuc(goc)):
        kq["loai"], kq["tu_dien"] = "ky_thuat", td_en     # GĐ 3d: câu kiến thức tiếng Anh, tên gọi khác của thuật ngữ
    elif chung.co(t_chinh, VAN):
        kq.update(loai="van", xu_ly="tra_loi_kem_luu_y")
        kq["chu_de"] = _chu_de_cau(cau_hoi, t_chinh)   # MT-ĐS B2: mảng của câu vận
    else:
        kq["loai"] = "la_so"
        kq["chu_de"] = "cung_than" if _hoi_cung_than(cau_hoi, t_chinh) else \
            "than_sat_tk" if _hoi_ts_tk(cau_hoi, t_chinh) else _chu_de_cau(cau_hoi, t_chinh)
        if kq["thap_than"] or kq["nhom"]:
            kq["chu_de"] = kq["chu_de"] if kq["chu_de"] in ("nghe_tien", "hon_nhan", "con_cai", "phap_ly", "di_xa", "an_toan",
                                                            "hoc_hanh", "quan_he", "hau_van", "gia_dinh") else "thap_than"
        kq["do_tin_thap"] = not kq["chu_de"] and not (kq["thap_than"] or kq["nhom"] or kq["tru"])   # EN-3
        kq["chu_de"] = kq["chu_de"] or "tinh_cach"
        if kq["chu_de"] in ("loi_song", "nghe_tien", "phap_ly", "di_xa", "an_toan", "hau_van", "hoc_hanh", "quan_he"):
            kq["xu_ly"] = "tra_loi_kem_luu_y"
    return kq


# EN-5.3 (sau code-review): "mệnh cung" trùng "mệnh cũng", "thân cung" trùng "bản thân cũng", "Thái Nguyên" là tên tỉnh
# → gõ có dấu thì so trên chữ có dấu; gõ không dấu thì cần ngữ cảnh ("mệnh cung của tôi", "tiểu vận năm …").
_CT_CO_DAU = [r"mệnh cung", r"thai nguyên", r"thân cung", r"tiểu vận"]
_CT_KHONG_DAU = [r"(xem|tinh|cua|ve) (menh cung|thai nguyen|than cung)", r"(menh cung|thai nguyen|than cung) "
                 r"(cua|trong|la gi|o dau|toi|minh|em)", r"tieu van"]


def _hoi_cung_than(raw: str, t: str) -> bool:
    return chung.khop_dau(raw, t, _CT_CO_DAU, _CT_KHONG_DAU)


# EN-5.3 (2026-11-02): thần sát THAM KHẢO (Học Đường, Thiên La Địa Võng, Kim Thần). "học đường" là chữ thường (trường
# học), "kim thân" / "thiện là" trùng khi bỏ dấu → gõ có dấu so trên chữ có dấu, gõ không dấu cần ngữ cảnh.
# EN-3c (review độc lập): tên rõ nghĩa (Thiên La, Địa Võng, Kim Thần có dấu) nhận ngay; "học đường" (trường học) và
# "kim than" không dấu (trùng "Kim thân") chỉ nhận khi câu có NGỮ CẢNH lá số / sao / thần sát / trụ — cả hai nhánh.
_TK_CO_DAU = [r"thiên la", r"địa võng", r"kim thần"]
_TK_KHONG_DAU = [r"thien la dia vong", r"dia vong", r"(sao|than sat|co|pham|bi) thien la", r"thien la (o tru|trong|cua|khong)"]
_TK_MO_CO_DAU = [r"học đường"]
_TK_MO_KHONG_DAU = [r"hoc duong", r"kim than"]
_TK_NGU_CANH = [r"la so", r"bat tu", r"tu tru", r"than sat", r"(?<!\w)sao (hoc duong|kim than)", r"(?<!\w)tru (nao|nam|thang|ngay|gio)",
                r"o tru", r"trong tru"]
_TK_HOI = (("Học Đường", r"hoc duong"), ("Thiên La", r"thien la"), ("Địa Võng", r"dia vong"), ("Kim Thần", r"kim than"))


def _hoi_ts_tk(raw: str, t: str) -> bool:
    if chung.khop_dau(raw, t, _TK_CO_DAU, _TK_KHONG_DAU):
        return True
    return chung.khop_dau(raw, t, _TK_MO_CO_DAU, _TK_MO_KHONG_DAU) and chung.co(t, _TK_NGU_CANH)


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
        if pl["xu_ly"] == "tu_choi_nhe":          # SK-1: câu hỏi có bệnh → hệ cơ quan (hành yếu nhất) + đi khám
            he = None
            if ls:
                from app.kb import suc_khoe_kb  # noqa: PLC0415
                tl = ls["ngu_hanh"]["diem"]
                he = suc_khoe_kb.he_hanh(min(("Mộc", "Hỏa", "Thổ", "Kim", "Thủy"), key=lambda h: tl.get(h, 0)))
            goi["mau"] = chung.mau_tu_choi(pl.get("cau_goc"), pl["cau_chuan_hoa"], goi["mau"], he)
        return chung.ket(goi)
    if pl["xu_ly"] == "dan_huong":
        goi["mau"] = chung.mau_dan_huong(pl["cau_chuan_hoa"])
        return chung.ket(goi)
    if pl["loai"] == "sinh_con_tuoi":
        goi["mau"] = kb.mau("sinh_con_tuoi")
        goi["can_them"] = ["tuoi_cha_me"]
        return chung.ket(goi)
    for ma in pl["giai_thich"][:2]:
        g = kb.giai_thich(ma)
        if g:
            muc.append({"loai": "giai_thich", "ma": ma, **g})
    if pl.get("tu_dien"):
        muc += hieu_cau.muc_tu_dien(pl["tu_dien"])
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
        goi["luu_y"] = L("hoi.bt.luu_y.than_sat", "Thần sát là lớp phụ trong Tử Bình — sách Trích Thiên Tuỷ coi nhẹ thần sát "
                         "so với ngũ hành và thập thần; đọc như sắc thái, không như điềm báo.")
        return chung.ket(goi)
    if cd == "than_sat_tk":                       # EN-5.3 (2026-11-02)
        ds = battu_mo_rong.than_sat_tham_khao(ls["tru"])
        hoi = [ten for ten, mau in _TK_HOI if re.search(mau, pl["cau_chuan_hoa"])] or [x["ten"] for x in ds]
        muc.append({"loai": "than_sat_tk", "ds": [x for x in ds if x["ten"] in hoi], "hoi": hoi,
                    "tru_ten": list(TRU_TEN.values()), "nguon": battu_mo_rong.THAN_SAT_TK_NGUON, **kb.meta()})
        goi["luu_y"] = L("hoi.bt.luu_y.than_sat_tk", "Học Đường, Thiên La Địa Võng, Kim Thần mỗi sách chép một cách; hệ thống "
                         "theo Tam Mệnh Thông Hội và chỉ để tham khảo — các sao này không làm đổi mức nào trong bài luận giải.")
        return chung.ket(goi)
    if cd == "cung_than":                         # EN-5.3
        ct = battu_mo_rong.cung_than(ls)
        hoi = [k for k, mau in (("thai_nguyen", r"thai nguyen"), ("menh_cung", r"menh cung"),
                                ("than_cung", r"than cung"), ("tieu_van", r"tieu van"))
               if re.search(mau, pl["cau_chuan_hoa"])] or ["menh_cung", "thai_nguyen", "than_cung"]
        muc.append({"loai": "cung_than", **{k: ct[k] for k in ("thai_nguyen", "menh_cung", "than_cung")},
                    "giai_thich": ct["giai_thich"], "hoi": hoi, "tieu_van": battu_mo_rong.cac_tieu_van(ls),
                    "khoi_van": ls["dai_van"]["ds"][0]["tu_nam"], **kb.meta()})
        goi["luu_y"] = L("hoi.bt.luu_y.cung_than", "Thai nguyên, Mệnh cung, Thân cung là lớp đọc thêm của Tử Bình; luận chính "
                         "vẫn ở nhật chủ, thập thần, dụng thần.")
        return chung.ket(goi)
    if cd == "xung_hop":
        muc.append({"loai": "xung_hop", "ds": battu_mo_rong.quan_he(ls["tru"]), **kb.meta()})
        return chung.ket(goi)
    # MT-ĐS B1 — chủ đề đời sống mới: đọc đúng dữ kiện đã tính (thập thần theo lĩnh vực, thần sát liên quan, trụ, đại
    # vận) + lưu ý ranh giới; không có khối nào mới ở CALC.
    if cd in ("phap_ly", "di_xa", "an_toan", "hoc_hanh", "quan_he", "hau_van", "con_cai"):
        ts = battu_mo_rong.than_sat(ls["tru"])
        TT_CD = {"phap_ly": ("Thất Sát", "Thương Quan", "Kiếp Tài"), "di_xa": ("Thiên Tài", "Thực Thần"),
                 "an_toan": ("Thất Sát", "Kiếp Tài"), "hoc_hanh": ("Chính Ấn", "Thiên Ấn", "Thực Thần"),
                 "quan_he": ("Tỷ Kiên", "Kiếp Tài", "Chính Quan"),
                 "con_cai": ("Thực Thần", "Thương Quan") if gioi_tinh != "nam" else ("Chính Quan", "Thất Sát"),
                 "hau_van": ()}
        TS_CD = {"phap_ly": ("Kiếp Sát", "Vong Thần"), "di_xa": ("Dịch Mã",), "an_toan": ("Dương Nhận", "Kiếp Sát"),
                 "hoc_hanh": ("Văn Xương",), "quan_he": ("Thiên Ất Quý Nhân", "Thái Cực Quý Nhân"),
                 "con_cai": (), "hau_van": ()}
        for t in pl["thap_than"][:1] + [t for t in TT_CD[cd] if tt_dem.get(t) and t not in pl["thap_than"][:1]]:
            muc.append(_m_tt(t, tt_dem.get(t, 0)))
        if TS_CD[cd]:
            hoi = [x for x in TS_CD[cd] if any(s["ten"] == x for s in ts)] or list(TS_CD[cd][:1])
            muc.append({"loai": "than_sat", "ds": [s for s in ts if s["ten"] in TS_CD[cd]], "hoi": hoi, "loc": True,
                        "tru_ten": list(TRU_TEN.values()), **kb.meta()})
        if cd == "con_cai":
            muc.append({"loai": "tru", "ten": "giờ", "noi_dung": kb.tru("giờ"),
                        "can_chi": f"{ls['tru'][3]['can']} {ls['tru'][3]['chi']}", "thap_than": ls["thap_than_can"][3],
                        "tang_can": ls["tang_can"][3], "tang_can_tt": ls["thap_than_chi"][3], **kb.meta()})
        if cd == "hau_van":
            ds = ls["dai_van"]["ds"]
            muc.append({"loai": "cac_dai_van", "ds": [{"can": d["can"], "chi": d["chi"], "tu_nam": d["tu_nam"],
                                                        "den_nam": d["den_nam"], "thap_than": bt.thap_than(dm, d["can"])}
                                                       for d in ds[-3:]],
                        "dung_than_phu_uc": ls["dung_than"]["phu_uc"]["hanh"], **kb.meta()})
        if not any(m["loai"] in ("thap_than", "than_sat", "cac_dai_van", "tru") for m in muc):
            muc.append(_m_nhat_chu(ls, dm))
        goi["luu_y"] = kb.luu_y({"phap_ly": "phap_ly", "di_xa": "di_xa", "an_toan": "an_toan", "hoc_hanh": "hoc_hanh",
                                 "quan_he": "quan_he", "hau_van": "hau_van", "con_cai": "lo_so"}[cd])
        if cd == "con_cai" and not pl.get("lo_so"):
            goi["luu_y"] = None
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
    if cd == "nghe_tien" and chung.co(pl["cau_chuan_hoa"], [r"dau tu", r"vay", r"gop von", r"mua dat", r"tra no", r"chung khoan"]):
        goi["luu_y"] = kb.luu_y("tien_bac")
    if cd == "nghe_tien":
        for t in pl["thap_than"][:1]:
            muc.append(_m_tt(t, tt_dem.get(t, 0)))
        for t in ("Chính Tài", "Thiên Tài", "Chính Quan", "Thất Sát", "Thực Thần", "Thương Quan"):
            if tt_dem.get(t) and t not in pl["thap_than"][:1]:
                muc.append(_m_tt(t, tt_dem[t]))
        if not any(m["loai"] == "thap_than" for m in muc):
            muc.append({"loai": "ghi_chu", "noi_dung": L("hoi.bt.khong_lo_tai", "Lá số không lộ rõ Tài, Quan hay Thực Thương ở can "
                                                           "và bản khí — cần xét tàng can và đại vận.")})
        muc.append(_m_dung_than(ls))
        goi["luu_y"] = goi["luu_y"] or kb.luu_y("ung_dung")
    if cd == "hon_nhan" and chung.co(pl["cau_chuan_hoa"], [r"doi (chong|vo)", r"ly hon", r"phan boi", r"(chong|vo) bo", r"bo roi",
                                                            r"sat (chong|vo)", r"khac (chong|vo|anh|co ay)", r"ngoai tinh"]):
        goi["luu_y"] = kb.luu_y("hon_nhan")
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


def _them_doi_song(goi: dict, pl: dict, sinh: dict, ngay_xem: dt.date, ls: dict) -> dict | None:
    """MT-ĐS B2: mượn chương báo cáo đời sống Bát tự cho chủ đề của câu hỏi (câu vận → "Năm nay")."""
    from app.luangiai import battu_doi_song as bds  # noqa: PLC0415
    t = pl["cau_chuan_hoa"]
    if pl["loai"] == "van":
        chuong = ("cuoc_doi" if chung.co(t, [r"hau van", r"ve gia", r"tuoi gia", r"nghi huu"])
                  else dsm.CHU_DE_CHUONG.get(pl["chu_de"] or "") or "nam_nay")
    else:
        chuong = dsm.CHU_DE_CHUONG.get(pl["chu_de"] or "")
        if pl["chu_de"] == "nghe_tien" and chung.co(t, [r"tien", r"giau", r"ngheo", r"tai van", r"tich luy", r"dau tu", r"(?<!\w)no(?!\w)",
                                                        r"mua dat", r"ban (dat|nha)", r"tai loc", r"hao",
                                                        r"pha san", r"vo no", r"mat (het )?tien", r"thua lo", r"lo von"]):
            chuong = "tien_bac"
    # EN-3b: điều được hỏi (danh mục cố định) cụ thể hơn chủ đề phân loại ("khi nào tài vận khởi sắc" → Tiền bạc, không
    # phải Công việc) → mượn chương của điều được hỏi khi báo cáo có chương đó; câu năm/vận giữ "Năm nay" khi không rõ.
    cd = mo_dau.chuong_cua(mo_dau.dieu_hoi(t, _raw(pl), chuong))
    if not chuong and not cd:
        return None
    try:
        bc = bds.lap(sinh, ngay_xem, ls=ls)
    except Exception:  # noqa: BLE001
        return None
    m = (dsm.muc_doi_song(bc, cd, lo_so=bool(pl.get("lo_so"))) if cd and cd != chuong else None) \
        or dsm.muc_doi_song(bc, chuong, lo_so=bool(pl.get("lo_so")))
    if not m:
        return bc
    if pl.get("lo_so"):
        goi["muc"].insert(1 if goi["muc"] and goi["muc"][0]["loai"] == "tu_tru" else 0, m)
    else:
        goi["muc"].append(m)
    if m.get("chuong") == "suc_khoe" and (g := chung.muc_suc_khoe_hoi(t)):       # SK-1: câu nhắc bộ phận → đi khám
        goi["muc"].insert(goi["muc"].index(m) + 1, g)
    chung.ket(goi)
    return bc


def _them_chu_y(goi: dict, pl: dict, sinh: dict, ngay_xem: dt.date, ls: dict, bc: dict | None) -> None:
    """CY-1: câu hỏi về điều người dùng lo ở một mảng → năm nên chú ý của mảng (đọc lại hộp báo cáo — cùng hàm; không
    có hộp thì `chu_y_nam.battu_nam` trên dòng mười năm của báo cáo)."""
    from app.luangiai import battu_doi_song as bds  # noqa: PLC0415
    from app.luangiai import chu_y_nam as cyn  # noqa: PLC0415
    dong: list[dict] = []

    def _dong() -> list[dict]:
        if not dong:
            dong.extend(bds.dong_nam_cua(sinh, ngay_xem, ls))
        return dong

    nam0 = chung.nam_xem_hh(None, ngay_xem, "")[0]

    def tinh(mg: str) -> list[dict]:
        x = cyn.tu_bao_cao((bc or {}).get("chuong"), mg, nam0)
        return x if x is not None else cyn.battu_nam(ls, _dong(), mg)

    chung.them_chu_y(goi, pl, tinh, nam0, L("hoi.bt.theo_tu_tru", "Theo tứ trụ"), nam_hoi=chung.nam_hoi_hh(pl["cau_chuan_hoa"], ngay_xem, "lap_xuan"))


# ------------------------------------------------------------------ NARRATIVE (template)
def _t(nhom: str, v) -> str:
    """Tên riêng hiển thị theo ngôn ngữ (bản Việt: nguyên chữ)."""
    return _ten.ten(nhom, v)


def _cc(s: str) -> str:
    """"Canh Ngọ" / "Canh Ngọ · Tân Tỵ" → tên theo ngôn ngữ (bản Việt nguyên chữ)."""
    if ngon_ngu.la_viet():
        return s
    return " · ".join(" ".join(_bth._can_chi(x) for x in p.split()) for p in str(s).split(" · "))


def _ds_hanh(ds: list[str]) -> str:
    return ", ".join(_t("hanh", h) for h in ds)


def _tru_hien(t: str) -> str:
    """Tên trụ ("năm", "ngày"…) → "trụ năm" / "Year pillar"."""
    return L("hoi.bt.tru_x", "trụ {t}", t=_bth._tru(t))


def _tru_ds(tt: list[str], ds: list[int]) -> str:
    return ", ".join(_bth._tru(tt[i]) for i in ds)


def _doan(m: dict) -> tuple[str, str | None]:
    l = m["loai"]
    if l == "cua_so":
        return chung.doan_cua_so(m), None
    if l == "so_nam":
        return chung.doan_so_nam(m["nam"]), None
    if l == "doi_song":
        return dsm.doan_doi_song(m), None
    if l == "sao_han":
        return chung.doan_sao_han(m), None
    if l == "cung_than":
        ten = {"thai_nguyen": L("hoi.bt.ct.thai_nguyen", "Thai nguyên"), "menh_cung": L("hoi.bt.ct.menh_cung", "Mệnh cung"),
               "than_cung": L("hoi.bt.ct.than_cung", "Thân cung")}
        cau = [L("hoi.bt.ct.cau", "{ten} của bạn là {can} {chi} (nạp âm {nap_am}). {gt}", ten=ten[k], can=_t("can", m[k]["can"]),
                 chi=_t("chi", m[k]["chi"]), nap_am=_t("nap_am", m[k]["nap_am"]),
                 gt=L(f"battu.cung_than.{k}", m["giai_thich"][k]))
               for k in m["hoi"] if k in ten]
        if "tieu_van" in m["hoi"]:
            gt = L("battu.cung_than.tieu_van", m["giai_thich"]["tieu_van"])
            if m["tieu_van"]:
                ds = ", ".join(f"{x['nam']} {_t('can', x['can'])} {_t('chi', x['chi'])}" for x in m["tieu_van"])
                cau.append(L("hoi.bt.ct.tieu_van", "{gt} Tiểu vận của bạn (tới trước năm {khoi} vào đại vận đầu): {ds}.",
                             gt=gt, khoi=m["khoi_van"], ds=ds))
            else:
                cau.append(L("hoi.bt.ct.khong_tieu_van", "{gt} Bạn vào đại vận đầu ngay từ năm sinh nên không có năm tiểu vận.",
                             gt=gt))
        return " ".join(cau), None
    if l == "than_sat_tk":
        tt = m["tru_ten"]
        cau = []
        for x in m["ds"]:
            ten_x = _t("than_sat", x["ten"])
            y = L(f"battu.than_sat.y.{_bth._ma(x['ten'])}", x["y"])
            if x["co"]:
                s = (L("hoi.bt.tstk.co", "{ten} có ở trụ {tru}", ten=ten_x, tru=_tru_ds(tt, x["tru"]))
                     + (L("hoi.bt.tstk.chinh", " — Chính Học Đường") if x.get("chinh") else "")
                     + L("hoi.bt.tstk.y", ": {y}.", y=y))
            else:
                s = L("hoi.bt.tstk.khong", "Theo cách {phai} (gốc ở {goc}), tứ trụ của bạn không có {ten}.",
                      phai=_t("sach_battu", x["phai"]), goc=_bth._goc(x["goc"]) if not ngon_ngu.la_viet() else x["goc"], ten=ten_x)
            k = x["theo_cach_khac"]
            s += L("hoi.bt.tstk.cach_khac", " Cách khác: {ck} ", ck=L(f"battu.than_sat.cach_khac.{_bth._ma(x['ten'])}", x["cach_khac"])) + (
                L("hoi.bt.tstk.khac_co", "Theo cách đó, bạn có ở trụ {tru}.", tru=_tru_ds(tt, k)) if k
                else L("hoi.bt.tstk.khac_khong", "Theo cách đó bạn cũng không có."))
            cau.append(s)
        if {"Thiên La", "Địa Võng"} & set(m["hoi"]):
            cau.append(L("hoi.bt.tstk.bat_han", "Thiên La, Địa Võng cũng là tên hai hạn trong Bát hạn — hạn đó xếp theo tuổi mụ, "
                         "giống nhau cho mọi người cùng tuổi, khác với thần sát trong tứ trụ ở trên."))
        return " ".join(cau), None
    if l == "than_sat":
        tt = m["tru_ten"]
        co = {x["ten"] for x in m["ds"]}
        dau = ""
        if m["hoi"]:
            khong = [_t("than_sat", h) + (L("hoi.bt.ts.ham_tri", " (còn gọi Hàm Trì)") if h == "Đào Hoa" else "")
                     for h in m["hoi"] if h not in co]
            if khong:
                dau = L("hoi.bt.ts.khong_co", "Tứ trụ của bạn không có {ds}. ", ds=", ".join(khong))
        if not m["ds"]:
            return dau + (L("hoi.bt.ts.khong_mang", "Tứ trụ không có thần sát nào liên quan tới mảng này.") if m.get("loc") else
                          L("hoi.bt.ts.khong_bang", "Tứ trụ không mang thần sát nào trong bảng hệ thống đang xét.")), None
        ds = "; ".join(L("hoi.bt.ts.muc", "{ten} ({loai}, ở trụ {tru}): {y}", ten=_t("than_sat", x["ten"]),
                         loai=_t("cat_hung", x["loai"]), tru=_tru_ds(tt, x["tru"]),
                         y=L(f"battu.than_sat.y.{_bth._ma(x['ten'])}", x["y"]))
                       for x in m["ds"])
        return dau + L("hoi.bt.ts.ds", "Thần sát trên tứ trụ — {ds}.", ds=ds), None
    if l == "xung_hop":
        if not m["ds"]:
            return L("hoi.bt.xh.khong", "Các trụ không có hợp, xung, hình, hại hay phá đáng kể với nhau."), None
        mo = [x["mo_ta"] if ngon_ngu.la_viet() else _bth.mo_ta_quan_he(x) for x in m["ds"]]
        return (L("hoi.bt.xh.dau", "Quan hệ giữa các trụ: ") + "; ".join(mo) +
                L("hoi.bt.xh.giai", ". Hợp là gắn kết hay níu giữ, xung là va chạm hay thay đổi, hình là tự gây áp lực — "
                  "trụ ngày–giờ liên quan bản thân và con cái, năm–tháng liên quan gốc gác, cha mẹ."), None)
    if l == "tu_tru":
        nc = m["nhat_chu"]
        return (L("hoi.bt.tu_tru", "Tứ trụ (năm · tháng · ngày · giờ): {tru}. Nhật chủ {can} ({am_duong} {ngu_hanh}).",
                  tru=_cc(m["tru"]), can=_t("can", nc["can"]), am_duong=_t("am_duong", nc["am_duong"]),
                  ngu_hanh=_t("hanh", nc["ngu_hanh"])), None)
    if l == "nhat_chu":
        s = L("hoi.bt.nhat_chu", "Nhật chủ {can} — hình tượng {ht} (hành {nh}): {tc}. Điểm mạnh: {dm}. Mặt tối: {mt}.",
              can=_t("can", m["can"]), ht=m["hinh_tuong"], nh=_t("hanh", m["ngu_hanh"]), tc=m["tinh_chat"],
              dm=m["diem_manh"], mt=m["mat_toi"])
        if m.get("y_mua"):
            s += f" {m['y_mua']}"
        return s, m["cau_tu_soi"]
    if l == "thap_than":
        s = L("hoi.bt.tt.ten", "{ten} ({nhom})", ten=_t("thap_than", m["ten"]), nhom=_t("nhom_thap_than", m["nhom"]).split(" (")[0])
        if m.get("vi_tri"):
            s += L("hoi.bt.tt.vi_tri", " — {vt}", vt=_vi_tri(m["vi_tri"]))
        if m.get("so_lan") is not None:
            s += ((L("hoi.bt.tt.so_lan_1", ", xuất hiện {n} lần ở can và bản khí", n=m["so_lan"]) if m["so_lan"] == 1
                   else L("hoi.bt.tt.so_lan", ", xuất hiện {n} lần ở can và bản khí", n=m["so_lan"])) if m["so_lan"]
                  else L("hoi.bt.tt.khong_lo", ", không lộ ở can và bản khí"))
        s += L("hoi.bt.tt.y", ": {y} Tính cách: {tc}. Khi quá nhiều: {kn}; khi thiếu: {kt}. Với nam chỉ {nam}; với nữ chỉ {nu}.",
               y=m["y_nghia"], tc=m["tinh_cach"], kn=m["khi_nhieu"], kt=m["khi_thieu"], nam=m["nam"], nu=m["nu"])
        return s, m["cau_tu_soi"]
    if l == "ngu_hanh":
        d, th = m["diem_hien_thi"], m["than"]
        if not ngon_ngu.la_viet():
            d = ", ".join(f"{_t('hanh', h)} {v:g}" for h, v in m["diem"].items())
        thieu = (L("hoi.bt.nh.thieu", "; thiếu hẳn: {ds}", ds=_ds_hanh(m["thieu"])) if m["thieu"] else "")
        lenh = L("hoi.bt.nh.dac_lenh", ", đắc lệnh") if th["dac_lenh"] else L("hoi.bt.nh.that_lenh", ", thất lệnh")
        s = L("hoi.bt.nh.cau", "Ngũ hành (thang điểm hệ thống): {d}. Nhiều nhất: {nn}{thieu}. Thân {kl} (tỉ lệ trợ lực {tl}{lenh}). {td}",
              d=d, nn=_t("hanh", m["nhieu_nhat"]), thieu=thieu, kl=_t("than_vuong", th["ket_luan"]), tl=m["ti_le_hien_thi"],
              lenh=lenh, td=L("battu.thang_diem", th["thang_diem"]))
        return s, None
    if l == "hanh":
        vai = L("hoi.bt.hanh.thieu", "Hành thiếu") if m["vai"] == "thieu" else L("hoi.bt.hanh.noi", "Hành nổi trội")
        chi = m["khi_thieu"] if m["vai"] == "thieu" else m["khi_thua"]
        return L("hoi.bt.hanh.cau", "{vai} — {hanh} ({tc}): {chi}. Ứng dụng dân gian: {ud}.", vai=vai, hanh=_t("hanh", m["hanh"]),
                 tc=m["tinh_chat"], chi=chi, ud=m["ung_dung"]), None
    if l == "dung_than":
        pu, dh, cc = m["phu_uc"], m["dieu_hau"], m["cach_cuc"]
        pu_gt = pu["giai_thich"] if ngon_ngu.la_viet() else _bth.phu_uc_gt(pu)
        dh_gt = dh["giai_thich"] if ngon_ngu.la_viet() else _bth.dieu_hau_gt(dh, m["thang"])
        s = L("hoi.bt.dt.cau", "Dụng thần — hai cách, hệ thống không tự chọn. Phù ức (Trích Thiên Tuỷ, {pu_gt}): {pu}. "
              "Điều hậu ({dh_gt}): {dh}. Cách cục theo nguyệt lệnh (Tử Bình Chân Thuyên): {cc} (can {can}{thau}).",
              pu_gt=pu_gt, pu=_ds_hanh(pu["hanh"]) or L("hoi.bt.dt.can_bang", "cân bằng, không cần phù hay ức rõ"),
              dh_gt=dh_gt, dh=_ds_hanh(dh["hanh"]) or L("hoi.bt.dt.khong_can", "không cần"),
              cc=_t("cach_cuc_bt", cc["ten"]), can=_t("can", cc["can"]),
              thau=L("hoi.bt.dt.thau", ", lộ ra thiên can") if cc["thau"] else "")
        if m.get("y_cach"):
            s += f" {m['y_cach']}"
        if m.get("tbct"):
            s += L("hoi.bt.dt.hy_ky", " Hỷ: {hy} Kỵ: {ky}", hy=m["tbct"]["hy"], ky=m["tbct"]["ky"])
        if cc.get("ma") in ("kien_loc", "duong_nhan", "nguyet_kiep"):
            khac = ", ".join(f"{_t('can', x['can'])} ({_t('thap_than', x['thap_than'])})" for x in cc.get("can_thau_khac", []))
            s += (L("hoi.bt.dt.can_lo_khac", " Can lộ khác để xét dụng: {khac}.", khac=khac) if khac
                  else L("hoi.bt.dt.chua_lo", " Chưa có Tài, Quan, Sát hay Thực lộ ra để dùng."))
        if m.get("ctbg"):
            ds = ", ".join(L("hoi.bt.dt.ctbg_muc", "{can} ({tt}, {tt2})", can=_t("can", x["can"]), tt=_t("thap_than", x["thap_than"]),
                             tt2=(L("hoi.bt.dt.da_lo", "đã lộ") if x["thau"] else L("hoi.bt.dt.tang", "tàng trong chi") if x["tang"]
                                  else L("hoi.bt.dt.chua_co", "chưa có")))
                           for x in m["ctbg"]["chi_tiet"])
            s += L("hoi.bt.dt.ctbg", " Theo bảng điều hậu Cùng Thông Bảo Giám, nhật chủ {nc} sinh tháng {thang} ưu tiên dùng theo "
                   "thứ tự: {ds}.", nc=_t("can", m["nhat_chu"]), thang=_t("chi", m["thang"]), ds=ds)
        return s, None
    if l == "tru":
        s = L("hoi.bt.tru.cau", "{nd} Trong lá số: {cc}", nd=m["noi_dung"], cc=_cc(m["can_chi"]))
        if m.get("thap_than"):
            tc = ", ".join(f"{_t('can', c)} ({_t('thap_than', t)})" for c, t in zip(m["tang_can"], m["tang_can_tt"]))
            s += L("hoi.bt.tru.tt", " (can là {tt}; tàng can: {tc})", tt=_t("thap_than", m["thap_than"]), tc=tc)
        return s + ".", None
    if l == "tang_can":
        ds = "; ".join(f"{_tru_hien(n)}: {', '.join(_t('can', c) for c in x)}" for n, x in zip(m["tru_ten"], m["tang_can"]))
        return L("hoi.bt.tang_can", "Tàng can: {ds}.", ds=ds), None
    if l == "khoi_van":
        return (L("hoi.bt.khoi_van", "Đại vận đi {chieu}, khởi vận sau {nam} năm {thang} tháng {ngay} ngày (khoảng {ngay_khoi}).",
                  chieu=L("hoi.bt.thuan", "thuận") if m["thuan"] else L("hoi.bt.nghich", "nghịch"),
                  nam=m["nam"], thang=m["thang"], ngay=m["ngay"], ngay_khoi=_ngay_dai(m["ngay_khoi"])), None)
    if l == "dai_van":
        ten = (L("hoi.bt.dv.hien_tai", "Đại vận hiện tại") if m["vai"] == "hien_tai"
               else L("hoi.bt.dv.ke_tiep", "Đại vận kế tiếp"))
        return (L("hoi.bt.dv.cau", "{ten}: {can} {chi} ({tu}–{den}) — can vận là {tt} so với nhật chủ: {y}", ten=ten,
                  can=_t("can", m["can"]), chi=_t("chi", m["chi"]), tu=m["tu_nam"], den=m["den_nam"],
                  tt=_t("thap_than", m["thap_than"]), y=m["y_tt"]), None)
    if l == "luu_nien":
        return (L("hoi.bt.ln.cau", "Lưu niên {nam}: {can} {chi} — {tt} so với nhật chủ ({y}) Chi năm với chi ngày: {qh}.",
                  nam=m["nam"], can=_t("can", m["can"]), chi=_t("chi", m["chi"]), tt=_t("thap_than", m["thap_than"]),
                  y=m["y_tt"], qh=_qh_chi(m["voi_tru_ngay"])), None)
    if l == "cac_dai_van":
        ds = "; ".join(f"{d['tu_nam']}–{d['den_nam']}: {_t('can', d['can'])} {_t('chi', d['chi'])} ({_t('thap_than', d['thap_than'])})"
                       for d in m["ds"])
        return (L("hoi.bt.cdv", "Các đại vận: {ds}. Hành phù ức gợi ý: {hanh} — hệ thống không chọn 'năm tốt' thay bạn.",
                  ds=ds, hanh=_ds_hanh(m["dung_than_phu_uc"]) or L("hoi.bt.khong_ro", "không rõ")), None)
    if l in ("giai_thich",):
        return f"{m['tieu_de']}: {m['noi_dung']}", None
    if l == "ghi_chu":
        return m["noi_dung"], None
    return "", None


def _ngay_dai(iso: str) -> str:
    """"1997-01-02" → bản Việt giữ nguyên; bản Anh "2 Jan 1997"."""
    if ngon_ngu.la_viet() or not isinstance(iso, str) or iso.count("-") != 2:
        return iso
    y, mo, d = iso.split("-")
    return f"{chung.ngay_ngan(int(d), int(mo))} {y}"


def _vi_tri(v: str) -> str:
    return {"thê tinh": L("hoi.bt.the_tinh", "thê tinh"), "phu tinh": L("hoi.bt.phu_tinh", "phu tinh")}.get(v, v)


def _qh_chi(v: str) -> str:
    """Quan hệ chi năm ↔ chi ngày của CALC ("lục xung", "phục ngâm (trùng chi)"…) theo ngôn ngữ."""
    if ngon_ngu.la_viet():
        return v
    return {"phục ngâm (trùng chi)": L("hoi.bt.qh.phuc_ngam", "phục ngâm (trùng chi)"),
            "không xung hợp": L("hoi.bt.qh.khong", "không xung hợp")}.get(v) or _t("quan_he", v)


def van_template(goi: dict) -> str:
    if goi["mau"] and not goi["muc"]:
        return goi["mau"]
    doan, soi = [], []
    for i, m in enumerate(goi["muc"]):
        if m.get("loai") == "doi_song":
            d, s = dsm.doan_doi_song(m, "\n".join(doan), khoa=("hoi.bt.ds", i)), None
        else:
            d, s = _doan(m)
        if _dsk.quyet(("hoi.bt.doan", i), bool(d)) and d:
            doan.append(d)
        if s and not soi:
            soi.append(s)
    if goi["mau"]:
        doan.append(goi["mau"])
    if soi:
        doan.append(L("hoi.tu_soi", "Câu hỏi để tự soi: ") + soi[0])
    if goi.get("luu_y"):
        doan.append(goi["luu_y"])
    doan.append(L("hoi.ket", hoi_van.KET))
    return "\n\n".join(doan)


def _them_so_nam(goi: dict, pl: dict, sinh: dict, ngay_xem: dt.date, ls: dict) -> None:
    """EN-3: câu nêu năm → đoạn đầu nói mức của ĐÚNG các năm đó (dòng 10 năm của báo cáo Bát tự — một nguồn; năm theo
    Lập xuân, hai cách lấy dụng thần gộp như chương Vận hạn). Năm ngoài 10 năm tới bỏ qua."""
    from app.luangiai import battu_doi_song as btd  # noqa: PLC0415
    nam_hoi = chung.nam_hoi_hh(pl["cau_chuan_hoa"], ngay_xem, "lap_xuan")
    if nam_hoi:
        chung.them_so_nam(goi, btd.dong_nam_cua(sinh, ngay_xem, ls), nam_hoi, ("tu_tru", "sao_han"))


def _raw(pl: dict) -> str | None:
    """Câu gốc dùng cho các bước đọc chữ (điều được hỏi, câu kể nhiều vế) — chỉ khi câu gốc chính là câu được phân loại
    (câu tiếng Việt). Câu ngôn ngữ khác đã dịch ý sang cụm từ khoá (`en_gloss`) → các bước đó đọc trên cụm từ khoá."""
    goc = pl.get("cau_goc")
    return goc if goc and chung.chuan_hoa_cau(goc) == pl.get("cau_chuan_hoa") else None


def tra_loi(cau_hoi: str, sinh: dict | None = None, ngay_xem: dt.date | None = None,
            dung_llm: bool = False) -> dict:
    """`sinh` = {"lich": datetime theo kinh tuyến lịch UTC+7, "gioi_tinh": "nam"|"nu"}.

    EN-ALL GĐ 3c: ngôn ngữ khác tiếng Việt → phân loại MỘT lần (câu gốc), dựng câu trả lời bản Việt trước để ghi các
    quyết định dựa trên chữ (thứ tự đoạn, đoạn mở đầu, câu trùng — `doi_song_khuon.vi_quyet_dinh`), rồi dựng bản ngôn ngữ
    đó theo đúng các quyết định ấy; cuối cùng đổi chữ của lá số + gói bằng chứng sang ngôn ngữ đó (mã giữ nguyên)."""
    pl = phan_loai(cau_hoi)
    ngay_xem = ngay_xem or dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    if ngon_ngu.la_viet():
        return _tra_loi(pl, cau_hoi, sinh, ngay_xem, dung_llm)
    kq = _hien(_tra_loi_theo_vi(pl, cau_hoi, sinh, ngay_xem, False))
    # GĐ 3d vòng 4 — tầng hỗ trợ MỀM (chỉ bản ngôn ngữ khác tiếng Việt): câu có MỘT tín hiệu buồn yếu ("they keep saying
    # I'm useless", "the river looks peaceful lately") chưa đủ luật khủng hoảng → vẫn trả lời câu hỏi, kèm đoạn hỗ trợ ngắn
    # có số đường dây ở trường riêng `ho_tro` (web hiện TRÊN câu trả lời). Bản Việt không có trường này (golden giữ nguyên).
    if pl["xu_ly"] != "an_toan" and _at.ho_tro_mem_en(cau_hoi):
        kq["ho_tro"] = _at.loi_ho_tro_mem()
    return kq


def _tra_loi(pl: dict, cau_hoi: str, sinh: dict | None, ngay_xem: dt.date, dung_llm: bool) -> dict:
    import copy  # noqa: PLC0415
    pl = copy.deepcopy(pl)
    # EN-1 DU-2: lưu niên Bát tự đổi năm ở Lập xuân, không ở 1/1 (hỏi 20/01/2027 "năm nay" → Bính Ngọ 2026).
    nam_xem, nam_am = chung.nam_xem_hh(pl["nam_xem"], ngay_xem, pl["cau_chuan_hoa"])
    ls = None
    if sinh and pl["loai"] in ("la_so", "van", "hop"):
        ls = bt.la_so(sinh["lich"], sinh["gioi_tinh"], sinh.get("gio_ty", "da_ty"),
                      sinh.get("utc_lich", config.CALENDAR_MERIDIAN_TZ), nam_ban_cau=bool(sinh.get("nam_ban_cau")))
    hien_tai = ngay_xem if not pl["nam_xem"] and nam_xem == chung.nam_xem_hh(None, ngay_xem, "")[0] else None
    goi = goi_bang_chung(pl, ls, sinh["gioi_tinh"] if sinh else None, nam_xem, hien_tai)
    bc_ds = None
    if ls is not None and pl["loai"] in ("la_so", "van") and not goi["can_them"]:
        bc_ds = _them_doi_song(goi, pl, sinh, ngay_xem, ls)
    if pl.get("sao_han") and sinh and not goi["can_them"]:
        d = sinh["lich"]
        goi["muc"].insert(1 if goi["muc"] and goi["muc"][0]["loai"] == "tu_tru" else 0,
                          chung.muc_sao_han(nam_am, d.year, sinh["gioi_tinh"], d.month, d.day))
        chung.ket(goi)
    if ls is not None and sinh and not goi["can_them"] and pl["xu_ly"] in ("tra_loi", "tra_loi_kem_luu_y"):
        _them_so_nam(goi, pl, sinh, ngay_xem, ls)
        _them_chu_y(goi, pl, sinh, ngay_xem, ls, bc_ds)                  # CY-1
    if ls is not None and sinh:
        chung.them_cua_so(goi, pl, "battu", sinh, ngay_xem, ls, ("tu_tru", "sao_han"))   # EN-5.4
    if chung.xac_nhan(pl["cau_chuan_hoa"]) and goi["muc"]:
        goi["luu_y"] = kb.luu_y("xac_nhan") + (" " + goi["luu_y"] if goi.get("luu_y") else "")
        chung.ket(goi)
    van = chung.tra_loi_truoc(van_template(goi), goi["phan_loai"].get("cau_chuan_hoa") or chung.chuan_hoa_cau(cau_hoi),
                              khoa=("hoi.bt", "truoc"))   # EN-3
    if pl["xu_ly"] not in chung.DAC_BIET:            # EN-3b: đoạn mở đầu trả lời đúng điều được hỏi
        van = mo_dau.dat_dau(van, mo_dau.doi_song_mo(goi, pl["cau_chuan_hoa"], "battu", _raw(pl), khoa=("hoi.bt", "mo")), goi,
                             khoa=("hoi.bt", "dat"))
    che_do_van, loi = "template", []
    if dung_llm and goi["muc"] and not goi["can_them"]:
        try:
            v = hoi_van._goi_llm(goi, cau_hoi)
            loi = hoi_van.kiem_tra_dau_ra(v, goi, van)   # EN-4: bản mẫu là nguồn chữ
            che_do_van, van = ("llm", v) if not loi else ("template_fallback", van)
        except Exception as e:  # noqa: BLE001
            che_do_van, loi = "template_fallback", [f"llm lỗi: {mo_ta_loi(e)}"]
    co = list(ls["co_canh_bao"]) if ls else []
    if ls:
        co.append({"loai": "thang_diem", "chi_tiet": kb.luu_y("thang_diem")})
    if pl.get("lo_so") and not goi["luu_y"] and goi["muc"]:
        goi["luu_y"] = kb.luu_y("lo_so")
    dac_biet = pl["xu_ly"] in chung.DAC_BIET or bool(goi["can_them"])
    return {"hoi_lai": chung.hoi_lai_neu(pl, "battu"), "phan_loai": goi["phan_loai"], "la_so": ls, "bang_chung": goi, "cau_tra_loi": van,
            "che_do_van": che_do_van, "loi_kiem_tra": loi, "can_them": goi["can_them"], "co_canh_bao": co,
            "do_phu": "day_du" if (goi["muc"] or dac_biet) else "khong", "truc_quan": truc_quan.battu(goi, ls), "hoi_tiep": truc_quan.hoi_tiep_battu(pl)}


_tra_loi_theo_vi = _dsk.vi_quyet_dinh(_tra_loi)


def _hien(kq: dict) -> dict:
    """Bản ngôn ngữ khác: câu CALC trong lá số + gói bằng chứng theo ngôn ngữ (mã, số, danh sách giữ nguyên)."""
    from app.hoidap import battu_hien_hoi  # noqa: PLC0415
    if kq.get("la_so"):
        kq["la_so"] = _bth.la_so(kq["la_so"])
    kq["co_canh_bao"] = [_bth._co(c) for c in kq["co_canh_bao"]]
    kq["bang_chung"] = battu_hien_hoi.goi(kq["bang_chung"])
    return kq
