# -*- coding: utf-8 -*-
"""EN-ALL GĐ 7 (nhóm H) — hiểu câu hỏi Thần số TIẾNG ANH bằng cách dịch Ý (không dịch chữ) sang cụm từ khoá tiếng Việt
không dấu mà `luangiai.hoi.phan_loai` (bộ phân loại của bản Việt) đã nhận — một bộ phân loại, một gói bằng chứng.

Câu tiếng Anh → các vế tiếng Việt không dấu, theo thứ tự: người được hỏi (con, người thân có số / ngày sinh, hai người cần
so) → con số người hỏi tự nêu → mốc thời gian → chủ đề đời sống → ý lo / ý quyết định. Câu gốc tiếng Anh vẫn đi kèm để bộ
chặn an toàn MỘT bộ (`luangiai/an_toan.py`) xét trên chữ người dùng gõ. Tất định, không LLM, không lưu câu.

`kien_thuc(cau)` nhận câu KIẾN THỨC (không về con số của người hỏi): cách tính, phái, một con số được nêu tên, một thuật
ngữ — hỏi đáp trả bằng KB, không đọc số của người hỏi.
"""
from __future__ import annotations

import datetime as dt
import re

from app.hoidap.en_gloss import chuan, la_cau_viet

_THANG = {m: i + 1 for i, m in enumerate(("january", "february", "march", "april", "may", "june", "july", "august",
                                          "september", "october", "november", "december"))}
_THANG.update({m[:3]: i for m, i in list(_THANG.items()) if m != "may"})
_THANG["sept"] = 9
_THU = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
_SO_CHU = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
           "eleven": 11, "twenty two": 22, "thirty three": 33}
_SO = r"(11|22|33|[1-9])"

# người thân → cụm tiếng Việt (vai trong câu "X toi …")
_NGUOI = [("con gai", r"daughter|little girl|baby girl"), ("con trai", r"son|little boy|baby boy|boy"),
          ("con", r"kid|kids|child|children|baby|toddler|teen|teenager|\d{1,2} year old"),
          ("chong", r"husband|hubby"), ("vo", r"wife"), ("ban trai", r"boyfriend|bf"), ("ban gai", r"girlfriend|gf"),
          ("nguoi yeu", r"partner|fianc\w*|crush|ex"), ("me chong", r"mother in law|mil"), ("bo chong", r"father in law"),
          ("me", r"mother|mom|mum|mama"), ("bo", r"father|dad|daddy|papa"), ("chi gai", r"sister|older sister"),
          ("anh trai", r"brother|older brother"), ("em gai", r"younger sister|little sister"),
          ("em trai", r"younger brother|little brother"), ("sep", r"boss|manager|supervisor"),
          ("dong nghiep", r"colleague|coworker|co worker"), ("ban than", r"best friend|friend|bestie"),
          ("doi tac", r"business partner|cofounder|co founder|investor")]
_NGUOI_RX = "|".join(p for _, p in _NGUOI)
_CON = r"son|daughter|kid|kids|child|children|baby|toddler|teen|teenager|little boy|little girl|boy|\d{1,2} year old"

# chủ đề đời sống → từ khoá của `hoi.LINH_VUC_KW` (thứ tự = ưu tiên; mỗi mẫu khớp thêm một vế)
_CHU_DE: list[tuple[str, str]] = [
    # tình cảm
    (r"cheat\w*|affair|unfaithful|someone else|other (woman|man)|another (woman|man)", "ngoai tinh"),
    (r"divorc\w*|separat\w*", "ly hon"), (r"break ?up|broke up|split up", "chia tay"),
    (r"\bex\b|get back (together )?with|back together", "quay lai nguoi cu"),
    (r"jealous\w*", "ghen"), (r"long distance", "yeu xa"),
    (r"single|find love|find (a |the )?(partner|someone|boyfriend|girlfriend|husband|wife|one)|soul ?mate|meet (the )?(one|someone)|the one",
     "doc than tinh duyen"),
    (r"marry|married|marriage|wedding|engaged|engagement|fianc\w*|propose", "ket hon"),
    (r"crush|confess|ask (him|her) out|tell (him|her) i like", "to tinh"),
    (r"love|romance|romantic|dating|date|relationships?|boyfriend|girlfriend|husband|wife|spouse|(?<!business )partner(?! s number)|"
     r"attract\w*|wrong guys|wrong (men|women|people)|type of (partner|guy|girl|man|woman)", "tinh yeu"),
    # con cái
    (r"raise (my|a|our|the) (child|kid|kids|son|daughter|children|baby)|raising (kids|children|a child|my)|should i raise|"
     r"parenting|kind of parent|a good parent|discipline|listen to anyone|won t listen|lazy at school", "nuoi day con"),
    (r"name (for|my|our) (baby|son|daughter|child)|baby name|name should i give", "dat ten con"),
    (r"have a baby|have kids|have children|start a family|get pregnant|time to have a baby", "sinh con"),
    # gia đình
    (r"mother in law|father in law|in laws?|inlaws", "me chong"), (r"siblings?|brothers?|sisters?|cousin", "anh chi em"),
    (r"parents?|mother|mom|mum|father|dad|family|home sick|move back home", "gia dinh"),
    # học hành
    (r"ielts|toefl|sat|gmat|gre", "ielts"), (r"master s|masters|mba|phd|graduate school", "thac si"),
    (r"exams?|tests?|entrance|pass|fail(ing)? (my|the)", "thi cu"), (r"university|college|degree|major|subjects?", "dai hoc"),
    (r"study|studies|studying|school|learn\w*|focus when i study|concentrat\w*", "hoc tap"),
    # công việc
    (r"business partner|cofounder|co founder|investor", "doi tac"),
    (r"promot\w*|(a|for a|ask for a) raise|pay rise", "thang tien"), (r"interview\w*", "phong van"),
    (r"quit|resign\w*|leave my job|stay or go|stay at my job", "nghi viec"),
    (r"own business|start (a|my own) (business|company|shop)|startup|entrepreneur\w*|open(ing)? a (shop|store|cafe|restaurant)|"
     r"(product )?launch", "khoi nghiep"),
    (r"freelanc\w*", "freelancer"), (r"lead|leader\w*|manag\w*", "lam lanh dao"),
    (r"coworkers?|co workers?|colleagues?|boss|people at work|office", "dong nghiep"),
    (r"lost my job|laid off|fired|unemployed|layoffs?", "that nghiep"),
    (r"switch\w* (careers?|from|to)|career change|change (careers?|fields?)", "doi viec"),
    (r"career|job|work|working|profession|teacher|accounting|design|medicine|law|corporate|business|company", "cong viec"),
    # tiền bạc
    (r"(?<!karmic )(?<!karma )debts?|owe|loans?|borrow\w*", "no nan"), (r"lend|borrow money|loan to", "cho vay"),
    (r"invest\w*|stocks?|shares|crypto|bitcoin", "dau tu"), (r"save money|saving|savings|can t save|slip through", "tiet kiem"),
    (r"buy (a )?(house|home|flat|apartment|property|land)|real estate", "mua nha"),
    (r"rich|wealth\w*|money|financ\w*|income|salary|broke|bankrupt|budget|spend\w*", "tien bac"),
    # sức khoẻ tinh thần / nhịp sống
    (r"stress\w*|pressure", "cang thang"), (r"sleep|insomnia", "mat ngu"), (r"anxious|anxiety|worry all|overthink\w*", "lo au"),
    (r"burn(ed|t)? out|burnout|exhausted|tired all the time|tired|switch off", "kiet suc"),
    (r"balance|rest|relax\w*", "can bang cuoc song"), (r"health|healthy|well being|wellbeing", "suc khoe"),
    # bạn bè, xã hội
    (r"friends?|friendships?|lonely|loneliness|odd one out|fit in", "ban be"),
    (r"gossip\w*|backstab\w*|sabotag\w*|use me|using me|take advantage", "noi xau"),
    # nhịp sống
    (r"move (house|home|to a new)|moving house|relocat\w*", "chuyen nha"),
    (r"(job|work|working|offer|study|studying) (offer )?(abroad|overseas)", "di nuoc ngoai"),
    (r"emigrat\w*|immigrat\w*|(move|moving|live|living|settle) (abroad|overseas)|to canada|to australia", "dinh cu"),
    (r"accident\w*|travel\w*|trip|flight|fly|flying|driv\w*", "di lai"),
    # tâm linh / bài học
    (r"karmic debt|karma debt", "no nghiep"), (r"karmic lessons?", "bai hoc nghiep"),
    (r"life lesson|lesson of my life|big lesson|lesson in (this )?life", "bai hoc cuoc doi"),
    (r"purpose|meaning of my life|why am i here|mission", "muc dich song"),
    # tên
    (r"business name|shop name|company name|brand name", "ten cong ty"), (r"nickname", "biet danh"),
    (r"change my name|my name|middle name|first name|new name|spelling", "doi ten"),
    # biểu đồ ngày sinh
    (r"missing (numbers?|from)|numbers? (are |is )?missing", "so thieu bieu do ngay sinh"),
    (r"arrows?", "mui ten bieu do ngay sinh"), (r"birth (chart|grid)|lo shu", "bieu do ngay sinh"),
    # bản thân
    (r"blind spots?|weakness\w*", "diem yeu"), (r"strengths?|talents?|good at|gifts?", "diem manh tai nang"),
    (r"confiden\w*|self esteem", "tu tin"), (r"procrastinat\w*", "tri hoan"), (r"perfectionis\w*", "cau toan"),
    (r"angry|anger|temper", "nong tinh"), (r"alone|introvert\w*", "huong noi"), (r"stubborn", "kho gan"),
    (r"hate change|change", "thay doi"),
    (r"personality|character|who am i|what kind of person|what drives me|who i am|about me|describe me|"
     r"deep down|deep inside|see me|perceive me|come across|first meet", "tinh cach"),
]

# ý lo (CY-1) → cụm mà `chu_y_nam.mang_hoi` / `hoi.phan_loai` đọc
_LO: list[tuple[str, str]] = [
    (r"accident\w*", "co bi tai nan khong"), (r"sued|lawsuit|court|legal trouble", "co bi kien khong"),
    (r"go broke|bankrupt\w*|lose (all )?(my )?money|lose money|losing money", "co bi mat tien pha san khong"),
    (r"lose my job|get fired|be fired|laid off", "co bi mat viec khong"),
    (r"business (fail|go under)|fail\w* business|will my business fail", "lam an co thua lo khong"),
    (r"leave me|cheat on me|divorce me", "co bi do vo khong"),
    (r"watch out|be careful|careful|look out for|risks?", "can than chu y gi"),
    (r"honest|trust\w*|reliable", "co trung thuc dang tin khong"),
]


def _ngay_iso(d: int, m: int, y: int) -> str | None:
    try:
        dt.date(y, m, d)
    except ValueError:
        return None
    return f"{d:02d}/{m:02d}/{y}"


def _cac_ngay(cau: str) -> list[str]:
    """Ngày sinh nêu trong câu (dd/mm/yyyy, yyyy-mm-dd, "14 February 1965") → "dd/mm/yyyy" (khuôn `hoi._trich_ngay`)."""
    ra: list[str] = []
    s = (cau or "").lower()
    for a, b, c in re.findall(r"(?<!\d)(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})(?!\d)", s):
        if len(a) == 4:
            x = _ngay_iso(int(c), int(b), int(a))
        elif len(c) == 4:
            x = _ngay_iso(int(a), int(b), int(c))
        else:
            x = None
        if x:
            ra.append(x)
    ten = "|".join(sorted(_THANG, key=len, reverse=True))
    for d, m, y in re.findall(rf"\b(\d{{1,2}})(?:st|nd|rd|th)? (?:of )?({ten}),? (\d{{4}})\b", s):
        x = _ngay_iso(int(d), _THANG[m], int(y))
        if x:
            ra.append(x)
    for m, d, y in re.findall(rf"\b({ten}) (\d{{1,2}})(?:st|nd|rd|th)?,? (\d{{4}})\b", s):
        x = _ngay_iso(int(d), _THANG[m], int(y))
        if x:
            ra.append(x)
    return list(dict.fromkeys(ra))


def _moc(t: str, hom_nay: dt.date) -> list[str]:
    """Mốc thời gian tiếng Anh → cụm tiếng Việt mà `hieu_cau.thoi_gian` / `hoi._them_thoi_diem` đọc."""
    ra: list[str] = []
    ten = "|".join(sorted((m for m in _THANG if m != "may"), key=len, reverse=True))
    da_nam: set[str] = set()
    for m in re.finditer(rf"\b(?:(?:in|by|this|next|during|for|around|before|after|until|of|early|late|mid) (may)|"
                         rf"(may)(?= (?:19|20)\d\d\b)|({ten}))\b(?:,? (?:of )?((?:19|20)\d\d))?", t):
        tm = m.group(1) or m.group(2) or m.group(3)
        if re.search(r"\b(born|birth|birthday|since|last)\b[^.]{0,12}$", t[:m.start()]) or re.match(r" \d{1,2}(st|nd|rd|th)?\b", t[m.end():]):
            continue
        ra.append(f"thang {_THANG[tm]}" + (f" nam {m.group(4)}" if m.group(4) else ""))
        if m.group(4):
            da_nam.add(m.group(4))
    nam_sinh = set(re.findall(r"\b(?:born|birth|since)\b[^.]{0,20}?\b((?:19|20)\d\d)\b", t))   # regex cố định (CodeQL)
    for y in re.findall(r"\b(20\d\d)\b", t):
        if y not in da_nam and y not in nam_sinh:
            ra.append(f"nam {y}")
    bang = [(r"\bnext (three|3) years\b|\bcoming (three|3) years\b|\bnext few years\b", "ba nam toi"),
            (r"\bnext year\b|\bcoming year\b|\byear ahead\b", "nam sau"), (r"\bthis year\b|\bthe year\b(?! of)", "nam nay"),
            (r"\blast year\b", "nam ngoai"), (r"\bnext month\b", "thang sau"), (r"\bthis month\b|\bthe month\b", "thang nay"),
            (r"\btomorrow\b", "ngay mai"), (r"\btoday\b|\btonight\b", "hom nay"), (r"\bthis week\b", "tuan nay"),
            (r"\bnext week\b", "tuan sau"),
            (r"\bpersonal year\b", "nam ca nhan"), (r"\bpersonal month\b", "thang ca nhan"), (r"\bpersonal day\b", "ngay ca nhan"),
            (r"\bpinnacles?\b|\bpeak period\b|\bbest period of my life\b|\bwhich age\b|\bwhat age\b", "dinh cao"),
            (r"\bchallenge number\b|\bchallenges?\b(?= (number|in my chart))|\bpinnacle and challenge\b", "thu thach"),
            (r"\bturning points?\b|\bcycles?\b", "giai doan chu ky"),
            (r"^when\b|\bwhen (will|is|should|do|does|can|would|are|am|might)\b|\bwhich month\b|\bwhat month\b|\bwhich year\b|"
             r"\bwhat year\b|\bhow soon\b", "khi nao")]
    for mau, vn in bang:
        if re.search(mau, t):
            ra.append(vn)
    for ten_thu, so in _THU.items():
        if re.search(rf"\b(on |this |next )?{ten_thu}\b", t) and "ngay mai" not in ra and "hom nay" not in ra:
            lech = (so - hom_nay.weekday()) % 7 or 7
            if re.search(rf"\bnext {ten_thu}\b", t) and lech < 7:
                lech += 7
            d = hom_nay + dt.timedelta(days=lech)
            ra.append(f"ngay {d.day} thang {d.month}")
            break
    return ra


def _so_tu_neu(t: str) -> list[str]:
    """Con số người hỏi tự nêu về chính mình ("I'm a life path 7", "my soul urge is 3", "personal year 9")."""
    ra = []
    for ma, mau in (("linh hon", r"soul urge|heart s desire|soul number"), ("su menh", r"expression|destiny"),
                    ("nhan cach", r"personality number")):
        m = re.search(rf"\b(?:my )?(?:{mau})(?: number)? (?:is |=)?{_SO}\b", t)
        if m:
            ra.append(f"{ma} so {m.group(1)}")
    m = re.search(r"\bborn on the (\d{1,2})(?:st|nd|rd|th)?\b|\bbirth ?day number (?:is )?(\d{1,2})\b", t)
    if m and 1 <= int(m.group(1) or m.group(2)) <= 31:
        ra.append(f"so ngay sinh sinh ngay {m.group(1) or m.group(2)}")
    m = re.search(rf"\bpersonal year (?:is )?(?:a |number )?([1-9])\b", t)
    if m:
        ra.append(f"nam ca nhan {m.group(1)}")
    m = re.search(rf"\bpersonal month (?:is )?(?:a |number )?([1-9])\b", t)
    if m:
        ra.append(f"thang ca nhan {m.group(1)}")
    m = re.search(rf"\b(?:i am|i m|im|as) (?:a |an )?(?:life path |lp |number )?{_SO}s?\b(?! (year|years|month|kids?|children|times))", t) \
        or re.search(rf"\bmy (?:life path|lp|life path number|main number|number) (?:is |=)?(?:a )?{_SO}\b", t)
    if m:
        ra.append(f"toi la so {m.group(1)}")
    return ra


def _hai_nguoi(cau: str, t: str) -> str | None:
    """Câu so hai người → cụm `hop_doi` của bản Việt (cặp số, hai ngày sinh, hoặc "toi va <người> co hop nhau khong")."""
    hop = re.search(r"\bcompatib\w*|\b(good|bad|perfect|right|great) (match|fit|together)\b|\bmatch (with|for)\b|\bgood together\b|"
                    r"\bsuited\b|\bget along\b(?! better with my siblings)|\bwhat works and what doesn t\b|\bare we\b|\bwe argue\b|\bwe fight\b", t)
    cap = re.search(rf"\b(?:life path |lp |number |a |an )?{_SO}s? and (?:a |an )?(?:life path |lp |number )?{_SO}s?\b", t)
    if cap and hop and not re.search(r"\b(my|me|i)\b", t):
        return f"so {cap.group(1)} va so {cap.group(2)} co hop nhau khong"
    ngay = _cac_ngay(cau)
    nguoi = re.search(rf"\b(?:my )?({_NGUOI_RX})\b", t)
    ai = next((vn for vn, p in _NGUOI if nguoi and re.fullmatch(p, nguoi.group(1))), "nguoi yeu")
    if ai in ("con", "con trai", "con gai"):
        return None
    if hop and ai in ("me", "bo", "me chong", "bo chong", "chi gai", "anh trai", "em gai", "em trai") and not re.search(
            r"\bcompatib\w*|\bmatch\b", t) and len(ngay) < 2:
        return None          # "I don't get along with my mother-in-law" — chuyện gia đình, không phải so hai con số
    if hop and len(ngay) >= 2:
        return f"toi sinh {ngay[0]} va {ai} sinh {ngay[1]} co hop nhau khong"
    both = re.search(rf"\b(?:are |re |r )?both (?:life path |lp |number )?(?:a |an )?{_SO}s?\b|\bboth {_SO}s\b", t)
    if both and (hop or nguoi):
        so = both.group(1) or both.group(2)
        return f"toi va {ai} cung so {so} co hop khong"
    # "I'm a 3, my bf is a 6 …", "me (life path 9) and my wife (life path 2)"
    m1 = re.search(rf"\b(?:i am|i m|im|me)\s*\(?(?:a |an )?(?:life path |lp |number )?{_SO}\)?", t)
    m2 = re.search(rf"\b(?:my )?(?:{_NGUOI_RX})\s*(?:is |s )?\(?(?:a |an )?(?:life path |lp |number )?{_SO}\)?(?!\d)", t)
    if m1 and m2 and nguoi:
        return f"toi so {m1.group(1)} va anh ay so {m2.group(1)} co hop khong"
    if hop and (nguoi or re.search(r"\b(we|us|our|between me and|me and)\b", t)):
        return f"toi va {ai} co hop nhau khong"
    return None


_TRAIT_NGUOI = (r"personality|what (?:is|s) (?:he|she|they) like|what (?:kind|type) of person is|like to work for|why (?:is|does) (?:he|she)|"
                r"what (?:does|do) (?:his|her|their) (?:number|numbers|life path)|(?:his|her) (?:number|numbers|life path|character|nature)|"
                r"how do i (?:deal|handle|get along|work) with (?:him|her)|deal with (?:him|her)|control\w* everything|stubborn|"
                r"is (?:he|she) (?:a |an )?(?:good|bad|honest|right)")


def _nguoi_khac(cau: str, t: str) -> str | None:
    """Câu về tính cách / con số của NGƯỜI KHÁC (không phải con) → cụm `nguoi_khac` của bản Việt; câu về con → cụm con."""
    m = re.search(rf"\bmy (?:\w+ )?({_NGUOI_RX})\b", t)
    if not m:
        return None
    ai = next(vn for vn, p in _NGUOI if re.fullmatch(p, m.group(1)))
    ngay = _cac_ngay(cau)
    so = re.search(rf"\b(?:is|s) (?:a |an )?(?:life path |lp |number )?{_SO}\b", t[m.end():][:40])
    if ai in ("con", "con trai", "con gai"):
        phan = [f"{ai} toi"]
        if ngay:
            phan.append(f"sinh {ngay[0]}")
        if re.search(r"\bwhat is (he|she|they) like\b|\bpersonality\b|\bcharacter\b|\bwhat kind of\b|\btalent\w*\b|\bgood at\b", t):
            phan.append("tinh cach the nao")
        if so:
            phan.append(f"so chu dao {so.group(1)}")
        return " ".join(phan)
    if ai == "doi tac":
        return None
    if not (ngay or so or re.search(_TRAIT_NGUOI, t)):
        return None
    if re.search(r"\b(compatib\w*|match)\b", t):
        return None
    if ngay:
        return f"{ai} toi sinh {ngay[0]} tinh cach the nao"
    if so:
        return f"{ai} toi so chu dao {so.group(1)} tinh cach the nao"
    if re.search(r"\b(boyfriend|girlfriend|husband|wife|partner|crush|ex)\b", m.group(1)) and not re.search(
            r"\bpersonality\b|\bwhat (?:is|s) (?:he|she) like\b|\bwhat kind of person\b", t):
        return None              # "my husband cheats", "my boyfriend and I fight" — câu về chuyện tình của người hỏi
    return f"tinh cach cua {ai} toi"


_KIEN_THUC = [
    (r"\bwhat is numerology\b|\bwhat s numerology\b|\bhistory of numerology\b|\bwhere does numerology come from\b|\borigin of numerology\b",
     "nguon goc"),
    (r"\b(accurate|accuracy|scientific|science|real|legit|reliable|true)\b|\bthis stuff\b", "do_tin"),
    (r"\bpythagor\w*\b.*\bchaldean\b|\bchaldean\b.*\bpythagor\w*\b|\bdifference between\b.*\b(pythagor|chaldean)", "phai"),
    (r"\btwo ways\b|\bdifferent (life path|result|number)s?\b.*\b(site|app|website)", "hai_cach"),
    (r"\bmaster numbers?\b", "so_cai"),
    (r"\bhow (?:is|are|do you|do i|to) (?:the |my |a )?(?:\w+ ){0,3}(?:calculated|computed|worked out|work out|calculate|compute|add up)\b|"
     r"\bhow do you (?:get|find)\b|\bformula\b", "cach_tinh"),
    (r"\bkarmic debt\b", "no_nghiep"), (r"\bpersonal (year|month|day)\b", "nam_ca_nhan"), (r"\bpinnacles?\b", "dinh_cao"),
    (r"\bbirth (chart|grid)\b|\barrows?\b", "bieu_do"), (r"\bsoul urge\b", "linh_hon"), (r"\bexpression\b", "su_menh"),
    (r"\bpersonality number\b", "nhan_cach"), (r"\blife path\b", "duong_doi"),
]
_CA_NHAN = re.compile(r"\b(my|me|i|mine|myself|i m|im)\b")


def kien_thuc(cau: str) -> dict | None:
    """Câu kiến thức (không về con số của chính người hỏi) → {"ma": mã chủ đề, "so": con số được nêu (nếu có)}."""
    t = chuan(cau)
    if _CA_NHAN.search(t) or re.search(r"\bcompatib\w*|\bmatch\b|\bgood together\b", t):
        return None
    m = re.search(rf"\b(?:number|life path|lp)\s+{_SO}\b|\b{_SO}\s+(?:life path|number)\b|\bmeaning of (?:the number )?{_SO}\b|"
                  rf"\bwhat does (?:the )?(?:number )?{_SO} mean\b|\b{_SO} (?:mean|means)\b", t)
    if m and not re.search(r"\bkarmic\b|\bpersonal (year|month|day)\b", t):
        so = int(next(g for g in m.groups() if g))
        return {"ma": "nghia_so", "so": so}
    if not re.search(r"\b(what|how|why|which|is|are|does|do|can|explain|meaning|mean|difference|history|where|who)\b", t):
        return None
    return next(({"ma": ma} for mau, ma in _KIEN_THUC if re.search(mau, t)), None)


def gloss(cau: str, hom_nay: dt.date) -> str:
    """Câu tiếng Anh → cụm từ khoá tiếng Việt không dấu cho `hoi.phan_loai`. Câu gõ tiếng Việt → chuỗi rỗng (bộ phân loại
    đọc thẳng câu gốc)."""
    if la_cau_viet(cau):
        return ""
    t = chuan(cau)
    # câu tâm linh (ma, vong, bùa) → cụm `chung.TAM_LINH` của bản Việt → nhánh dẫn hướng (không luận số)
    if re.search(r"\b(ghosts?|haunted|haunting|spirits? (in|of|follow)|possess\w*)\b", t):
        return "nha toi co ma khong"
    if re.search(r"\b(curse[ds]?|hex(ed)?|black magic|jinx\w*|evil eye)\b", t) and not re.search(r"\b(on|at) (him|her|them|my)\b", t):
        return "toi co bi bua khong"
    for a, b in _SO_CHU.items():
        t = re.sub(rf"\b(life path|number|a|an) {a}\b", rf"\1 {b}", t)
    t = re.sub(r"\b(\d{1,2})s\b", r"\1", t)
    phan: list[str] = []
    hai = _hai_nguoi(cau, t)
    if hai:
        phan.append(hai)
    else:
        nk = _nguoi_khac(cau, t)
        if nk:
            phan.append(nk)
    if not hai:
        phan += _so_tu_neu(t)
    moc = _moc(t, hom_nay)
    phan += moc
    da: set[str] = set()
    for mau, vn in _CHU_DE:
        if vn in ("dong nghiep", "cong viec") and da & {"to tinh", "tinh yeu", "ngoai tinh", "ket hon"}:
            continue                   # "a crush on a coworker" — chuyện tình cảm, đồng nghiệp chỉ là bối cảnh
        if vn not in da and re.search(rf"\b(?:{mau})\b", t):
            da.add(vn)
            phan.append(vn)
    for mau, vn in _LO:
        if re.search(rf"\b(?:{mau})\b", t):
            phan.append(vn)
            break
    if re.search(r"\b(good|right|best|bad|lucky|ideal) (day|time|week|month|moment)\b|\bgood day for\b", t):
        tg = next((x for x in ("ngay mai", "hom nay", "tuan nay", "tuan sau", "thang nay", "thang sau") if x in moc), None)
        if tg:
            phan.append(f"{tg} co tot khong")
        elif any(x.startswith("ngay ") for x in moc):
            phan.append("co phai la ngay tot")
        elif re.search(r"\b(day|week)\b", t):
            phan.append("ngay nao hop")
    if re.search(r"\bshould i\b|\bis it (a )?good idea\b|\bworth it\b|\bstay or go\b", t):
        phan.append("co nen khong")
    elif re.search(r"\bhow (do|can|should) i\b|\bwhat (do|should) i do\b|\bwhat now\b|\bany (advice|tips)\b|\bhow to\b|\bhelp\b", t):
        phan.append("lam sao")
    if not phan:
        if re.search(r"\b(read|numbers?|chart|profile|reading|me)\b", t):
            return "tinh cach cua toi"
        return ""
    s = " ".join(phan)
    if not re.search(r"\b(toi|minh)\b", s) and not hai:
        s += " cua toi"
    return s
