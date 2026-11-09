# -*- coding: utf-8 -*-
"""QTE — hỏi đáp Thần số TIẾNG ANH (bản gọn, tất định): câu hỏi tiếng Anh → chủ đề (luật từ khoá) → lời đáp ghép từ
chính KB đã có bản phủ tiếng Anh (nghĩa số, chân dung 4 mặt, số × lĩnh vực, năm / tháng cá nhân). Không LLM, không lưu,
không trả lại câu hỏi. An toàn đi qua MỘT bộ chặn chung (`hoidap.chung.dac_biet` — đã có mẫu tiếng Anh ở `an_toan`).

Chỉ chạy khi ngôn ngữ lượt gọi là "en" (`main.api_hoi`); bản Việt vẫn đi đường `narrative.hoi_van` đầy đủ."""
from __future__ import annotations

import datetime as dt
import re

from app.calc import thanso, thanso_mo_rong as mr
from app.config import hom_nay_vn
from app.kb import store, thanso_v2 as kb2
from app.kb.loi import L

_RX = {
    "tinh_yeu": r"\b(love|relationship|partner|boyfriend|girlfriend|husband|wife|marriage|marry|dating|date|crush|romance|romantic|soulmate|ex\b|breakup|break up|single)",
    "gia_dinh": r"\b(family|parents?|mother|father|mom|dad|children|kids?|son|daughter|sibling|brother|sister|in-laws?)\b",
    "su_nghiep": r"\b(career|job|work|boss|promotion|interview|business|company|colleagues?|co-?workers?|profession|study|studies|exam|school|university|quit|resign)\b",
    "tai_chinh": r"\b(money|finance|finances|financial|debt|loan|salary|income|savings?|invest(?:ing|ment)?|wealth|rich|budget|spend(?:ing)?|pay)\b",
    "suc_khoe": r"\b(health|stress|stressed|anxious|anxiety|burnout|burned out|tired|exhausted|sleep|energy|well-?being|mental)\b",
}
_RX_NAM = re.compile(r"\b(this year|next year|personal year|year ahead|coming year|20\d\d|the year)\b")
_RX_THANG = re.compile(r"\b(this month|next month|personal month|the month)\b")
_RX_SO_KHAC = re.compile(r"\b(?:number|life path|path)\s+(11|22|33|[1-9])\b|\b(11|22|33|[1-9])\s+(?:life path|number)\b")
_RX_BAN_THAN = re.compile(r"\b(who am i|my (?:life path|number|numbers|personality|strengths?|weakness(?:es)?|blind spots?|purpose|core)|what (?:am|is) (?:i|my)|about me|describe me|my chart|expression|soul urge|destiny number|master number)\b")
_RX_HOP = re.compile(r"\b(compatib|match with|compatible|hop doi|together with my|with my (?:partner|boyfriend|girlfriend|husband|wife))")
_RX_CACH_TINH = re.compile(r"\b(how (?:do you|is|to) (?:calculate|compute|work out)|calculated|formula|method|pythagor|chaldean|what is numerology|is numerology (?:real|accurate|true))\b")

LV_TEN = {"tinh_yeu": "love", "gia_dinh": "family", "su_nghiep": "work", "tai_chinh": "money", "suc_khoe": "well-being", "ban_than": "yourself"}
MAT_CD = {"tinh_yeu": "tinh_cam", "su_nghiep": "cong_viec", "tai_chinh": "cong_viec", "ban_than": "tong_quan"}


def phan_loai(cau: str) -> dict:
    t = f" {re.sub(r'\s+', ' ', (cau or '').strip().lower())} "
    if _RX_HOP.search(t):
        return {"xu_ly": "hop_doi", "linh_vuc": "tinh_yeu"}
    if _RX_CACH_TINH.search(t):
        return {"xu_ly": "cach_tinh", "linh_vuc": None}
    m = _RX_SO_KHAC.search(t)
    if m and not re.search(r"\bmy\b", t):
        return {"xu_ly": "nghia_so", "linh_vuc": None, "so": int(m.group(1) or m.group(2))}
    lv = next((k for k, rx in _RX.items() if re.search(rx, t)), None)
    if _RX_NAM.search(t):
        return {"xu_ly": "nam", "linh_vuc": lv}
    if _RX_THANG.search(t):
        return {"xu_ly": "thang", "linh_vuc": lv}
    if lv:
        return {"xu_ly": "linh_vuc", "linh_vuc": lv}
    if _RX_BAN_THAN.search(t) or re.search(r"\b(strength|weakness|personality|character|tendenc)", t):
        return {"xu_ly": "ban_than", "linh_vuc": "ban_than"}
    return {"xu_ly": "chung", "linh_vuc": "ban_than"}


def _so(nguoi: dict) -> dict:
    return thanso.chi_so_xac_dinh(nguoi["ho_ten"][0], nguoi["ngay"], nguoi["thang"], nguoi["nam"], nguoi.get("quy_uoc") or "tong_het")


def _lv(so: int, lv: str) -> str | None:
    m = kb2.nghia_linh_vuc(so, lv)
    if not m:
        return None
    phan = [m.get("xu_huong"), L("thanso_en.mat_toi", "Shadow side: {x}", x=m["mat_toi"]) if m.get("mat_toi") else None,
            L("thanso_en.goi_y", "Try this: {x}", x=m["goi_y"]) if m.get("goi_y") else None]
    return " ".join(p for p in phan if p)


def tra_loi(cau: str, nguoi: dict, ngay_xem: dt.date | None = None) -> dict:
    """Kết quả cùng khung với `hoi_van.tra_loi` (những trường web dùng): cau_tra_loi, can_cu, hoi_tiep, phan_loai, do_phu."""
    from app.hoidap import chung  # noqa: PLC0415
    from app.luangiai.hoi import chuan_hoa_cau  # noqa: PLC0415
    ngay_xem = ngay_xem or hom_nay_vn()
    goc = (cau or "").strip()
    t = chuan_hoa_cau(goc)
    pl = phan_loai(goc)
    kq = {"phai": "pitago", "ngon_ngu": "en", "phan_loai": pl, "cau_tra_loi": "", "can_cu": [], "hoi_tiep": [], "che_do": "template",
          "da_bat_llm": False, "loi_kiem_tra": [], "can_them": [], "do_phu": "day_du", "truc_quan": [], "hoi_lai": None}
    db = chung.dac_biet(t, goc)
    if db == "an_toan":
        kq.update(cau_tra_loi=L("an_toan.khung_hoang", ""), phan_loai={**pl, "xu_ly": "an_toan"})
        return kq
    if db == "tu_choi_nhe":
        kq.update(cau_tra_loi=L("an_toan.tu_choi", ""), phan_loai={**pl, "xu_ly": "tu_choi_nhe"})
        return kq
    if db == "dan_huong":
        kq.update(cau_tra_loi=L("an_toan.dan_huong", ""), phan_loai={**pl, "xu_ly": "dan_huong"})
        return kq
    cs = _so(nguoi)
    dd = cs["duong_doi"]
    doan: list[str] = []
    can_cu: list[str] = []
    hoi_tiep: list[str] = []
    cd = kb2.chan_dung(dd) or {}
    if pl["xu_ly"] == "hop_doi":
        doan.append(L("thanso_en.hop_doi", "Compatibility between two charts is not part of the English reading yet. What I can tell you is how your own Life Path {so} tends to love: {x}", so=dd, x=(cd.get("tinh_cam") or {}).get("cach_yeu", "")))
        hoi_tiep += [L("thanso_en.ht.love", "How do I tend to behave in love?"), L("thanso_en.ht.year", "What is my personal year about?")]
    elif pl["xu_ly"] == "cach_tinh":
        doan.append(L("thanso_en.cach_tinh", "Pythagorean numerology maps letters to 1–9 (A=1 … I=9, then J=1 again) and reduces sums to a single digit, keeping 11, 22 and 33 as master numbers. Life Path comes from the birth date, Expression from all letters of the name, Soul Urge from the vowels, Personality from the consonants. Two ways of adding the birth date exist and can give different Life Paths; the reading shows both. None of this is a measurement of you — treat it as a set of themes to check against your own life."))
        can_cu.append(L("thanso_en.can_cu.nguon", "Source: the Balliett → Jordan line of modern Pythagorean numerology (USA 1905–1965)."))
        hoi_tiep += [L("thanso_en.ht.ban_than", "What does my Life Path number say about me?")]
    elif pl["xu_ly"] == "nghia_so":
        so = pl["so"]
        m = store.nghia_so(so) or {}
        c2 = kb2.chan_dung(so) or {}
        doan.append(L("thanso_en.nghia_so", "Number {so} — {tu_khoa}. Shadow side: {mat_toi}. Counter-question: {phan_chung}", so=so, tu_khoa=m.get("tu_khoa", ""), mat_toi=m.get("mat_toi", ""), phan_chung=m.get("phan_chung", "")))
        if c2.get("tong_quan"):
            doan.append(c2["tong_quan"]["chan_dung"])
        can_cu.append(L("thanso_en.can_cu.kb", "From the numerology knowledge base (Pythagorean, Balliett → Jordan line) — a cultural reference, not a forecast."))
        hoi_tiep += [L("thanso_en.ht.ban_than", "What does my Life Path number say about me?")]
    elif pl["xu_ly"] == "nam":
        nam = ngay_xem.year + (1 if re.search(r"\bnext year\b", goc.lower()) else 0)
        m4 = re.search(r"\b(20\d\d)\b", goc)
        if m4:
            nam = int(m4.group(1))
        ncn = int(thanso.nam_ca_nhan(nguoi["ngay"], nguoi["thang"], nam, "duong_lich"))
        n = store.nghia_nam_ca_nhan(ncn) or {}
        doan.append(L("thanso_en.nam", "{nam} is personal year {so} for you — {chu_de}. {y_nghia} Good to do: {nen} Better to avoid: {tranh}", nam=nam, so=ncn, chu_de=n.get("chu_de", ""), y_nghia=n.get("y_nghia", ""), nen=n.get("nen", ""), tranh=n.get("tranh", "")))
        if pl["linh_vuc"] and pl["linh_vuc"] != "ban_than":
            x = _lv(dd, pl["linh_vuc"])
            if x:
                doan.append(L("thanso_en.nam_lv", "On {lv}, your Life Path {so} usually reads like this: {x}", lv=LV_TEN[pl["linh_vuc"]], so=dd, x=x))
        can_cu.append(L("thanso_en.can_cu.nam", "Personal year = day + month of birth + the calendar year, reduced to 1–9 (counted from 1 January, as on the reading page)."))
        hoi_tiep += [L("thanso_en.ht.month", "What about this month?"), L("thanso_en.ht.work", "How does my number show up at work?")]
    elif pl["xu_ly"] == "thang":
        thang, nam = ngay_xem.month, ngay_xem.year
        if re.search(r"\bnext month\b", goc.lower()):
            thang, nam = (thang % 12) + 1, nam + (1 if thang == 12 else 0)
        tcn = mr.thang_ca_nhan(nguoi["ngay"], nguoi["thang"], nam, thang)
        n = kb2.nghia_phu("thang_ca_nhan", tcn) or {}
        doan.append(L("thanso_en.thang", "{thang}/{nam} is personal month {so} for you — {chu_de}. Good to do: {nen} Better to avoid: {tranh}", thang=thang, nam=nam, so=tcn, chu_de=n.get("chu_de", ""), nen=n.get("nen", ""), tranh=n.get("tranh", "")))
        can_cu.append(L("thanso_en.can_cu.thang", "Personal month = personal year + the month number, reduced to 1–9."))
        hoi_tiep += [L("thanso_en.ht.year", "What is my personal year about?")]
    elif pl["xu_ly"] == "linh_vuc":
        lv = pl["linh_vuc"]
        x = _lv(dd, lv)
        if x:
            doan.append(L("thanso_en.lv", "On {lv}, Life Path {so} is often described like this: {x}", lv=LV_TEN[lv], so=dd, x=x))
        mat = MAT_CD.get(lv)
        if mat and cd.get(mat):
            c = cd[mat]
            if mat == "tinh_cam":
                doan.append(L("thanso_en.cd_tinh_cam", "How you tend to love: {a} What you need: {b} Blind spot: {c}", a=c.get("cach_yeu", ""), b=c.get("can_duoc", ""), c=c.get("diem_mu", "")))
            elif mat == "cong_viec" and lv == "su_nghiep":
                doan.append(L("thanso_en.cd_cong_viec", "Strengths: {a} Environment that suits you: {b} The trap: {c}", a=c.get("the_manh", ""), b=c.get("moi_truong", ""), c=c.get("cai_bay", "")))
            elif mat == "cong_viec":
                doan.append(L("thanso_en.cd_tien", "With money: {a}", a=c.get("tien_bac", "")))
        if lv == "suc_khoe":
            doan.append(L("an_toan.suc_khoe_nhac", "This is a note about pace and habits, not medical advice."))
        if not doan:
            kq["do_phu"] = "khong"
            doan.append(L("thanso_en.khong_co", "The knowledge base has nothing on this topic for your number yet."))
        can_cu.append(L("thanso_en.can_cu.lv", "Life Path {so} × {lv}, from the numerology knowledge base (Pythagorean, Balliett → Jordan line). Tendencies, not predictions.", so=dd, lv=LV_TEN[lv]))
        hoi_tiep += [h for h in (L("thanso_en.ht.year", "What is my personal year about?"), L("thanso_en.ht.ban_than", "What does my Life Path number say about me?")) if h]
    else:  # ban_than / chung
        m = store.nghia_so(dd) or {}
        tq = cd.get("tong_quan") or {}
        doan.append(L("thanso_en.ban_than", "Your Life Path is {so} — {tu_khoa}. {chan_dung}", so=dd, tu_khoa=m.get("tu_khoa", ""), chan_dung=tq.get("chan_dung", "")))
        if tq.get("diem_manh"):
            doan.append(L("thanso_en.manh_mu", "Strengths often named: {manh}. Blind spots often named: {mu}.", manh="; ".join(tq["diem_manh"]), mu="; ".join(tq["diem_mu"])))
        if m.get("phan_chung"):
            doan.append(L("thanso_en.phan_chung", "Counter-question to test it: {x}", x=m["phan_chung"]))
        khac = [(L("thanso.vi_tri.su_menh", "Sứ mệnh"), cs["su_menh"]), (L("thanso.vi_tri.linh_hon", "Linh hồn"), cs["linh_hon"]), (L("thanso.vi_tri.nhan_cach", "Nhân cách"), cs["nhan_cach"])]
        doan.append(L("thanso_en.so_khac", "Your other core numbers: {ds}.", ds=", ".join(f"{a} {b}" for a, b in khac)))
        if pl["xu_ly"] == "chung":
            doan.append(L("thanso_en.goi_y_hoi", "You can also ask about love, work, money, family, well-being, this year or this month."))
        can_cu.append(L("thanso_en.can_cu.cot_loi", "Life Path from the birth date ({quy_uoc}); Expression, Soul Urge and Personality from the name on the birth certificate.", quy_uoc=L(f"thanso.quy_uoc.{nguoi.get('quy_uoc') or 'tong_het'}", "")))
        hoi_tiep += [L("thanso_en.ht.love", "How do I tend to behave in love?"), L("thanso_en.ht.work", "How does my number show up at work?"), L("thanso_en.ht.year", "What is my personal year about?")]
    kq.update(cau_tra_loi=" ".join(d for d in doan if d), can_cu=can_cu, hoi_tiep=hoi_tiep[:3],
              bang_chung={"so": cs, "linh_vuc": pl["linh_vuc"]})
    return kq
