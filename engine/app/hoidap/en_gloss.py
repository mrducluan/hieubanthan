# -*- coding: utf-8 -*-
"""EN-ALL GĐ 3c — hiểu câu hỏi TIẾNG ANH bằng cách dịch Ý (không dịch chữ) sang cụm từ khoá của bộ phân loại tiếng Việt.

Câu tiếng Anh → cụm tiếng Việt KHÔNG DẤU mà `phan_loai` của mảng đã nhận ("what careers suit me" → "cong viec cua toi").
Câu gốc tiếng Anh vẫn đi kèm để bộ chặn an toàn MỘT bộ (`luangiai/an_toan.py`, có bộ tiếng Anh) xét trên chữ người dùng
gõ. Tất định, không LLM, không lưu câu.

Cách dịch ý (Bát tự):
1. Câu KIẾN THỨC (không "my / me / I", có từ hỏi) → cụm giải thích của KB + câu gốc (để từ điển thuật ngữ bản tiếng Anh
   nhận "Day Master", "Ten Gods"…).
2. Câu về NGƯỜI KHÁC (lá số / vận / tính cách của chồng, mẹ, sếp, bạn…), về CON, câu HỢP NHAU → cụm loại câu tương ứng.
3. Còn lại: MỘT chủ đề chính — xét câu hỏi thật trước (câu có "?" từ cuối lên, như `battu._chu_de_cau`), mỗi câu theo
   thứ tự ưu tiên chủ đề; câu kể chuyện chỉ dùng khi câu hỏi không nêu chủ đề. Chỉ một chủ đề để bộ phân loại tiếng Việt
   (lấy chủ đề khớp đầu tiên theo thứ tự của nó) không chọn nhầm chủ đề phụ.
4. Mốc thời gian ("next March", "in '27", "after Chinese New Year", "Year of the Goat") → cụm `hieu_cau.thoi_gian` đọc.
"""
from __future__ import annotations

import datetime as dt
import re

# ---- chuẩn hoá tiếng Anh gõ tắt / sai chính tả / Singlish (chỉ để so khớp — câu gốc giữ nguyên)
_TAT = [
    (r"\bu\b", "you"), (r"\bur\b", "your"), (r"\bbf\b", "boyfriend"), (r"\bgf\b", "girlfriend"), (r"\bhubby\b", "husband"),
    (r"\bwifey\b", "wife"), (r"\brn\b", "right now"), (r"\bpls\b|\bplz\b", "please"), (r"\bwat\b|\bwut\b", "what"),
    (r"\bidk\b", "i do not know"), (r"\btbh\b|\bngl\b|\bfr\b|\blowkey\b|\bhonestly\b", ""), (r"\bim\b", "i am"),
    (r"\bdont\b", "do not"), (r"\bcan or not\b", "can i"),
    (r"\b(lah|leh|lor|meh|sia|liao|hor|anot)\b", ""), (r"\bhow ah\b", "how"), (r"\bmy chart got\b", "my chart has"), (r"\bgot\b", "have"),
    (r"\bcarrer\b|\bcarreer\b|\bcareeer\b", "career"), (r"\bfinacial\b|\bfinancal\b", "financial"), (r"\bfinancialy\b", "financially"),
    (r"\brealtionship\b|\brelationshp\b|\brelation ship\b|\brelashionship\b", "relationship"), (r"\bmariage\b|\bmarrige\b", "marriage"),
    (r"\bhelth\b|\bhealh\b|\bhealt\b", "health"), (r"\belemnt\b|\belment\b|\belemant\b|\belemet\b", "element"),
    (r"\bpersonallity\b|\bpersonalty\b|\bpersonaltiy\b", "personality"), (r"\bstrenghts?\b|\bstrenths?\b", "strengths"),
    (r"\bweakneses\b|\bweaknessess\b", "weaknesses"), (r"\bintution\b|\bintuiton\b", "intuition"),
    (r"\bbussiness\b|\bbusness\b|\bbusines\b", "business"), (r"\bdivoced\b|\bdivorse\b|\bdevorce\b", "divorce"), (r"\bmula\b|\bmoolah\b", "money"),
    (r"'(\d\d)\b", r"20\1"), (r"\bfavou?ri?ble\b|\bfavorible\b|\bfavourible\b", "favourable"), (r"\busefull\b", "useful"),
    (r"\bengadged\b|\bengagd\b", "engaged"), (r"\bacurate\b|\baccurrate\b", "accurate"), (r"\bpilar\b", "pillar"),
    (r"\bshud\b|\bshld\b|\bshd\b", "should"), (r"\bby a new\b", "buy a new"), (r"\bdiff\b", "difference"), (r"\bwats\b", "what is"),
    (r"\bn\b", "and"), (r"\bsomthing\b", "something"), (r"\bimproove\b|\bimprov\b", "improve"), (r"\binlaws\b", "in laws"),
    (r"\b4 me\b", "for me"), (r"\b4 (a|my|the)\b", r"for \1"), (r"\b2 (sign|move|buy|start)\b", r"to \1"), (r"\bwk\b", "week"),
    (r"\bb4\b", "before"), (r"\bnah\b", "not"), (r"\byr\b|\byrs\b", "year"), (r"\bmth\b|\bmths\b", "month"), (r"\bnxt\b", "next"),
    (r"\btmr\b|\btmrw\b", "tomorrow"), (r"\br\b", "are"), (r"\bw\b", "with"), (r"\bbiz\b", "business"), (r"\bcny\b", "chinese new year"),
    (r"\bkids?\b", "kid"), (r"\bhes\b", "he is"), (r"\bshes\b", "she is"), (r"\bsons\b", "son s"), (r"\bdaughters\b", "daughter s"),
    (r"\bhusbands\b", "husband s"), (r"\bwifes\b", "wife s"), (r"\bmothers\b", "mother s"), (r"\bfathers\b", "father s"),
]
_THANG = {m: i + 1 for i, m in enumerate(("january", "february", "march", "april", "may", "june", "july", "august",
                                          "september", "october", "november", "december"))}
_THANG.update({m[:3]: i for m, i in list(_THANG.items())})
_THANG["sept"] = 9
_SO = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
       "twelve": 12, "a couple of": 2, "few": 3}
_CON_GIAP = {"rat": 2020, "ox": 2021, "tiger": 2022, "rabbit": 2023, "dragon": 2024, "snake": 2025, "horse": 2026,
             "goat": 2027, "sheep": 2027, "monkey": 2028, "rooster": 2029, "dog": 2030, "pig": 2031}


def chuan(cau: str) -> str:
    t = " " + (cau or "").lower().replace("’", "'").replace("‘", "'") + " "
    t = re.sub(r"(\w)'s\b", r"\1 s", t)                      # "husband's" → "husband s" (sở hữu)
    for a, b in _TAT:
        t = re.sub(a, b, t)
    return " ".join(re.sub(r"[^a-z0-9' ]+", " ", t).replace("'", " ").split())


def _cau(cau: str) -> list[str]:
    """Các câu, câu hỏi thật trước (câu có "?" từ cuối lên), rồi câu kể (từ cuối lên) — như `battu._chu_de_cau`."""
    cac = [c for c in re.split(r"(?<=[.!?])\s+|\s*[\n;]\s*", (cau or "").strip()) if c.strip()]
    if len(cac) < 2:
        return [chuan(cau)]
    hoi = [c for c in cac if c.rstrip().endswith("?")][::-1]
    return [chuan(c) for c in hoi + [c for c in cac if not c.rstrip().endswith("?")][::-1]]


# ---- mốc thời gian chung mọi mảng → cụm tiếng Việt không dấu
_CHUNG: list[tuple[str, str]] = [
    (r"\bnext year\b|\bthe coming year\b|\bnext lunar year\b|\bcoming year\b", "nam sau"),
    (r"\bthis year\b|\bthe year ahead\b|\bfor the year\b|\ball year\b|\brest of the year\b|\bthe year\b(?! of)", "nam nay"),
    (r"\blast year\b", "nam ngoai"),
    (r"\b(this|the) month\b", "thang nay"), (r"\bnext month\b", "thang sau"),
    (r"\bnext (few|couple of|couple|two|three|several) months\b|\bcoming months\b|\bin the next \w+ months\b", "3 thang toi"),
    (r"\bnext (\d+|two|three|four|five|ten) years\b|\bcoming years\b|\bfuture\b|\blong term\b|\bnext decade\b", "tuong lai"),
    (r"\bluck pillars?\b|\bluck periods?\b|\b10 year\b|\bten year\b|\bdecade\b|\bluck cycles?\b", "dai van"),
    (r"\bannual pillar\b|\byear pillar of (this|the) year\b|\bflowing year\b", "luu nien"),
    (r"\bwhen\b|\bwhat year\b|\bwhich year\b|\bwhat month\b|\bwhich months?\b|\bhow soon\b|\bhow long until\b|\bby when\b|"
     r"\bbest (months?|years?|time)\b|\bworst (months?|years?)\b", "khi nao"),
    (r"\bshould i\b|\bshould we\b|\bis it (a )?good (time|idea)\b|\bworth it\b|\bgood time to\b|\bgood idea\b|\bwise to\b", "co nen"),
    (r"\b(will|would|am going to|going to) i (lose|go bankrupt|get fired|fail|be lonely|be scammed)\b", "co bi khong"),
]

# ---- chủ đề đời sống (thứ tự = ưu tiên trong MỘT câu): (mã, cụm tiếng Việt, mẫu tiếng Anh)
_GIA = (r"parents?|mother|mom|mum|mama|father|dad|daddy|papa|siblings?|brothers?|sisters?|family(?! business| restaurant| company| shop| firm)|in laws?|mother in law|"
        r"father in law|step ?sons?|step ?daughters?|stepmom|stepdad|step mom|step dad|grand(?:ma|pa|mother|father|parents)|relatives|"
        r"caregiver|eldest|cousins?|family reunion")
_CON = r"sons?|daughters?|kid|children|child|baby|toddler|teen(?:ager)?"
CHU_DE_EN: list[tuple[str, str, str]] = [
    ("suc_khoe", "suc khoe", r"health|healthy|sleep\w*|insomnia|fatigue|energy|body|illness|anxiety|anxious|stress|run down|"
                             r"(get|getting|fall|falling|always|sure|often|easily) sick|sickly|catch(ing)? (a )?colds?|"
                             r"(always|so|constantly|very|often) (tired|exhausted)|(no|low) energy|"
                             r"exercise|exersize|diet|weight|lungs?|kidneys?|liver|heart (health|problems?|condition|rate)|stomach|digest\w*|organs?|blood|skin|"
                             r"headaches?|back pain|wellbeing|well being|burnout|burn out|immune|physical|fitness|gym"),
    ("an_toan", "tai nan", r"accidents?|injur\w*|safe on the road|road safety|drive safely|safety"),
    ("con_gia_dinh", "gia dinh", rf"(?:my|our) (?:\w+ )?(?:{_CON})\b(?! of mine)"),   # chuyện của con → gia đình (người hỏi là cha mẹ)
    ("ngu_hanh", "thieu hanh gi", r"(what|which|lucky|best|good) colou?rs?|colou?rs? (should|to|for)|should i wear|what to wear|"
                                  r"which direction|direction (should|to|for)|face (which|north|south|east|west)|crystals?|bracelets?|"
                                  r"jewel\w*|gold or silver|lucky (numbers?|charms?|directions?|elements?)|(which|what) elements?|"
                                  r"elements? (am i|do i|i need|i lack|missing|lacking)|lacking|(missing|lack|lacking|need|no|too much|"
                                  r"more|enough) (wood|fire|earth|metal|water)|favou?rable elements?|useful god"),
    ("gia_dinh_manh", "gia dinh", r"(parents|mom and dad|mum and dad|my (mother|mom|mum|father|dad|brother|sister)) .{0,15}"
                                   r"(divorc\w*|marriage|separat\w*|fight\w*|argu\w*|split|break up)"),
    ("hoc_hanh", "hoc hanh", r"study|studies|studying|exams?|school|university|uni|college|degree|masters|phd|grades?|"
                             r"education|learning|ielts|toefl|sat|gaokao|scholarship|subjects?|(a|an|online|short|the) course|courses|my major|a major|bar exam|"
                             r"thesis|graduat\w*|academic|retake|a levels?|o levels?|psle|test results?|driving test|pass (my|the|a|this) (\w+ )?test|"
                             r"certificat\w*|qualification\w*"),
    ("con_cai", "con cai", r"have (a )?(baby|kid|children|child)|start a family|try(ing)? for a baby|(2nd|second|third|another|"
                           r"more) (kid|child|baby)|kid when|children (luck|star|palace)|become a (mother|father|parent)"),
    ("tinh_cam", "tinh duyen", r"love(?! life)|romance|romantic|dating|first date|a date|go on dates?|date (him|her|someone)|marriage|commitment|marry|married|wedding|divorce\w*|breakup|"
                               r"break up|broke up|ex|cheat\w*|affair|crush|soulmate|single|engaged|engagement|fianc\w*|"
                               r"propose|pop the question|peach blossom|move in together|renew (our )?vows|settle down|"
                               r"find (a |the )?(someone|partner|boyfriend|girlfriend|husband|wife|love|the one)|(meet|met|is (he|she)) the one|"
                               r"get back together|back together|second marriage|remarry|lonely|long distance|attract\w*|"
                               r"(wrong|right) (kind of |type of )?(men|women|guys|girls|person|people for me)|mr right|flirt\w*|jealous\w*|"
                               r"trust issues|heartbreak\w*|heart broken|broken heart|feelings for|likes? me|like me back|ghost\w*|"
                               r"situationship|intimacy|sex life|chemistry|matchmak\w*|blind date|dating apps?|tinder|bumble|hinge|"
                               r"soul ?mate|spouse palace|marriage palace|husband star|wife star|meet (a |the )?(good |right )?(man|woman|guy|girl|someone)|"
                               r"commit\w*|unfaithful|faithful|in a relationship|my type|ideal (partner|spouse|type)|fall(ing)? for|fall(ing)? in love|"
                               r"unavailable (guys|men|women|girls|people)|(is there )?someone (for|out there for) me|(boyfriend|girlfriend|partner|fianc\w*) s (mother|mom|mum|father|dad|"
                               r"parents|family)"),
    ("tien_bac", "tien bac", r"money|wealth|wealthy|rich|finances?|financial\w*|income|salary|savings?|save|saving|invest\w*|"
                             r"stocks?|shares|crypto|forex|trading|trade|property|properties|real estate|condos?|mortgage|"
                             r"refinanc\w*|debts?|loans?|borrow\w*|bankrupt\w*|profit|windfall|bonus|afford|side income|"
                             r"pay rise|raise|lose money|losing money|inheritance|buy (a |an |my |our )?(new |used |second hand )?(house|car|home|flat|"
                             r"apartment|property|condo|bto|car)|own (a |my own )?(house|home|property|flat|apartment)|lease|budget|cash|earn\w*|"
                             r"paid|pay|bills|expenses|millionaire|passive income|assets|net worth|make a fortune|gold|stock market|\$\$|make more|earn more"),
    ("ban_than_manh", "tinh cach", r"personality|traits?|who am i|who i (really )?am|core nature|what kind of person am i|"
                                   r"what (type|kind) of person|the type (who|of)|strengths?|weakness(es)?|blind spots?|"
                                   r"introvert|extrovert|thinker|doer|talents?|late bloomer|lucky person|strong will|"
                                   r"easily influenced|natural leader|am i a (good |born )?leader|leadership (style|qualities|skills)|intuition|creative (streak|side|person|type)|am i creative|creativity|anger|temper|impatient|patience|stubborn|"
                                   r"too nice|people pleas\w*|sensitive|independent|confidence|confident|overthink\w*|"
                                   r"why am i (so|always|like)|why i (am )?always|like this\b(?! (year|month|week|job|house|one))|what drives me|my nature|"
                                   r"how do (others|people) see me|character"),
    ("gia_dinh", "gia dinh", _GIA),
    ("tinh_cam_nhe", "tinh duyen", r"relationships?|in love|love life|love luck"),
    ("su_nghiep", "cong viec", r"career|careers|job|jobs|work|working|boss|promotion|promoted|resign\w*|employer|profession|"
                               r"occupation|industr\w*|field|business|startup|start up|company|entrepreneur\w*|side hustle|"
                               r"interviews?|job offers?|the offer|offer from|office|colleagues?|coworkers?|co workers?|fired|laid off|layoffs?|freelanc\w*|"
                               r"full time|part time|transfer|teaching|consulting|shop|cafe|restaurant|clients?|customers?|"
                               r"leader\w*|manag\w*|buy me out|expand|expansion|franchise|brand|rebrand|naming my|"
                               r"name for my|retail|sales|contract job|internship|hired|hiring|employ\w*|career path|entrepreneur\w*|entreprenuer|succeed|suceed|nurse|lawyer|designer|"
                               r"career change|retrain\w*|take over|family business"),
    ("di_xa", "di xa", r"travel\w*|abroad|overseas|move to (another|a new|a different) (city|country|state)|relocat\w*|"
                       r"emigrat\w*|migrat\w*|move (abroad|overseas|countries)|another city|another country|visa"),
    ("phap_ly", "phap luat", r"lawsuits?|court|legal|sue|suing|sued|contracts?|paperwork|lawyer|custody"),
    ("quan_he", "ban be", r"friends?(?! (said|says|told|thinks|tells))|friendships?|helpers?|helpful people|noble (people|person)|"
                          r"mentors?|benefactors?|who will help me|support from|people around me|social life|backstab\w*|"
                          r"gossip|enemies|rivals?|competition"),
    ("hau_van", "hau van", r"old age|retire\w*|later (life|years)|elderly|when i am old|golden years"),
    ("tinh_cam_nguoi", "tinh duyen", r"(?<!business )partner|spouse|husband|wife|boyfriend|girlfriend|in laws? to be"),
    ("ngu_hanh", "thieu hanh gi", r"elements?|wood|fire|earth|metal|water|balance|favou?rable|useful god|crystals?|"
                                  r"bracelet|lucky (colou?rs?|numbers?|directions?|charms?)|colou?rs?|wear|direction|face which|"
                                  r"which way|season|strongest|weakest|dry|cold chart|warm chart|feng shui"),
]
_NHAT_CHU = {("yang", "wood"): "giap", ("yin", "wood"): "at", ("yang", "fire"): "binh", ("yin", "fire"): "dinh",
             ("yang", "earth"): "mau", ("yin", "earth"): "ky", ("yang", "metal"): "canh", ("yin", "metal"): "tan",
             ("yang", "water"): "nham", ("yin", "water"): "quy"}
_CAN_PY = {"jia": "giap", "yi": "at", "bing": "binh", "ding": "dinh", "wu": "mau", "ji": "ky", "geng": "canh", "xin": "tan",
           "ren": "nham", "gui": "quy"}
_THAP_THAN = [(r"friend star|companion|parallel|rob wealth|rob\w* wealth", None),
              (r"eating god|eating deity", "thuc than"), (r"hurting officer|hurt(ing)? officer", "thuong quan"),
              (r"indirect wealth|unconventional wealth", "thien tai"), (r"direct wealth", "chinh tai"),
              (r"seven killings?|7 killings?|seven kill", "that sat"), (r"direct officer", "chinh quan"),
              (r"indirect (resource|seal)|unconventional resource", "thien an"), (r"direct (resource|seal)", "chinh an")]
_QUAN_HE = [("chong", r"husband"), ("vo", r"wife"), ("nguoi yeu", r"boyfriend|girlfriend|partner|fianc\w*|ex|crush"),
            ("me", r"mother|mom|mum|mama|grandma|grandmother|aunt\w*|sister|mother in law"),
            ("bo", r"father|dad|daddy|papa|grandpa|grandfather|uncle|brother|father in law|cousin"),
            ("sep", r"boss|manager|colleague|coworker|co worker|friend|best friend|client|employee|neighbou?r|teacher|"
                    r"business partner|roommate")]
_VE_HO = (r"chart|charts|bazi|four pillars|luck|luck pillar|career|job|health|personality|future|fortune|elements?|"
          r"day master|pillars?|destiny|wealth|money|finances?|love life|marriage|nature|character|traits?|stars?|year")


def _ve_nguoi_khac(t: str) -> str | None:
    """Câu hỏi về lá số / vận / tính cách của NGƯỜI KHÁC → quan hệ (chong, me, sep…); con → "con"; không phải → None."""
    nguoi = r"(?:my |our )(?:\w+ ){0,2}?(?P<ai>" + "|".join(p for _, p in _QUAN_HE) + "|" + _CON + r")"
    m = re.search(nguoi + r" s (?:\w+ )?(?:" + _VE_HO + r")\b", t)                          # "my husband's career"
    if not m:
        m = re.search(nguoi + r"\b", t)
        if not m or not re.search(r"\b(his|her|their)\b (?:\w+ ){0,2}(?:" + _VE_HO + r")\b|\bis (he|she) (a |an )?(strong|weak|yin|yang|"
                                  r"good|bad|lucky)|\b(what|which) (kind|type|sort) of person\b(?! am i)|\b(he|she) (is )?(a |an )?(yang|yin) "
                                  r"(wood|fire|earth|metal|water)\b.*\b(what|how|does|will|is)\b", t):
            return None
        if re.search(r"\b(my|me|i)\b (?:\w+ ){0,3}(chart|bazi|four pillars)\b(?!.{0,20}\b(or|and) (his|her)\b)", t) and not re.search(
                r"\b(his|her|their) (chart|bazi)\b", t):
            return None                                                          # "is it MY chart …" → câu về mình
    ai = m.group("ai")
    if re.fullmatch(_CON, ai):
        return "con gai toi" if ai.startswith("daughter") else "con trai toi"
    return next(vn for vn, p in _QUAN_HE if re.fullmatch(p, ai)) + " toi co"


def _hop_nhau(t: str) -> str | None:
    """Câu hỏi hai người hợp nhau → cụm `HOP` của bộ phân loại (người nhà → gia đình: không phải câu so hai lá)."""
    if not re.search(r"\bcompatib\w*|\b(good|bad|perfect|right) match\b|\bmatch (with|for) (him|her|me|my)\b|\bget along\b|"
                     r"\bgood together\b|\b(are|r) we (a )?(good|right|meant)\b|\b(i|we) (are|r) both\b|\bboth (yang|yin)\b|"
                     r"\bour (charts|bazi|elements|day masters)\b|\bclash with (him|her)\b", t):
        return None
    if re.search(r"\b(" + _GIA + "|" + _CON + r")\b", t) and not re.search(r"\b(boyfriend|girlfriend|husband|wife|partner|ex|crush|"
                                                                          r"fianc\w*|date|dating)\b", t):
        return "gia dinh"
    if re.search(r"\b(business partner|colleague|coworker|boss|client|cofounder|co founder)\b", t):
        return "hop lam an"
    return "toi va nguoi yeu hop nhau"


# Câu KIẾN THỨC (không về lá số người hỏi) → cụm giải thích của KB. `ca_nhan=True`: áp cả khi câu có "my / I".
KIEN_THUC: dict[str, list[tuple[str, str, bool]]] = {
    "battu": [
        (r"\b(accurate|accuracy|legit|scientific|science|reliable)\b|\b(trust|believe in) (bazi|four pillars|this|it|astrology)\b|"
         r"\b(is|it|bazi) (it )?real\b", "co chinh xac", True),
        (r"\bzi ?wei\b|\bpurple star\b|\bzwds\b", "khac tu vi", True),
        (r"\b11 ?pm\b|\b23 \d\d\b|\bwhich day counts\b|\brat hour\b|\blate (night|zi)\b|\bjust before midnight\b|\bafter 11\b", "gio ty", True),
        (r"\bsolar terms?\b|\bstart of spring\b|\blunar or solar\b|\bchinese new year or (the )?(solar|start|li ?chun|feb)|\bli chun\b|\blichun\b", "tiet khi", True),
        (r"\b(same as|different from|related to) (the |my )?(chinese zodiac|zodiac sign|animal sign|star sign)\b", "bat tu la gi", True),
        (r"\bhow many (pillars|stems|branches|elements|gods|stars|characters)\b", "bat tu la gi", False),
        (r"\bten gods?\b|\b10 gods?\b", "thap than la gi", False), (r"\buseful god\b|\bfavou?rable element\b", "dung than la gi", False),
        (r"\b(strong|weak) day master\b", "than vuong la gi", False), (r"\bhidden stems?\b", "tang can la gi", False),
        (r"\bluck pillars?\b", "dai van la gi", False), (r"\b(structure|chart pattern)s?\b", "cach cuc la gi", False),
        (r"\bclash(es)?\b|\bcombinations?\b", "xung khac", False),
        (r"\bwhat is (a |the )?day master\b|\bwhat (is|are) bazi\b|\bhow (does|do) (bazi|four pillars|it) work\b|"
         r"\bdifference between\b|\bhow is (bazi|it) different\b|\bwestern astrology\b|\bsame as (the )?chinese zodiac\b|"
         r"\bneed (the |my |a |your )?birth time\b|\bbirth time (needed|necessary|required)\b|\bwithout (a |my |the )?birth time\b|"
         r"\bsouthern hemisphere\b|\bwhat (is|are) (the )?(four pillars|eight characters|heavenly stems?|earthly branch\w*)\b|"
         r"\bwhat does .{2,30} mean\b|\bmeaning of\b|\bexplain\b|"
         r"\b(how|why) (do|does|is|are|can|did) (you|they|it|one|people|astrologers|bazi|the) .{0,40}\b(bazi|four pillars|pillars?|"
         r"day master|birth (hour|time)|stems?|branch\w*|ten gods|elements?|luck pillars?|yin|yang|chart)\b|"
         r"\bwhy (is|are|does) (the )?(birth (hour|time)|hour|day master|month pillar|day pillar|season)\b|"
         r"\bwhat (is|are) (a |an |the )?(\w+ ){0,2}(star|stars|pillar|pillars|element|elements|god|gods|stem|stems|branch|branches|"
         r"structure|palace|clash|combination|qi|officer|wealth|resource|seal|day master)\b|"
         r"\b(can|does|do) (bazi|four pillars|astrology|a chart|charts) (really )?(predict|tell|show|change|explain)\b|"
         r"\bhow (is|are) .{0,30}(calculated|determined|read|interpreted|counted)\b", "bat tu la gi", False),
    ],
}
_CA_NHAN = re.compile(r"\b(my|me|i|mine|myself)\b")
_HOI = re.compile(r"\b(what|how|why|which|is|are|does|do|can|explain|meaning|difference|same)\b|\bneed\b.*\bor not\b|\bor not\b")


def _goc_tu_dien(cau: str) -> str:
    """Câu gốc cho từ điển thuật ngữ bản tiếng Anh (tên ngắn phân biệt hoa thường: "bazi" → "BaZi")."""
    return re.sub(r"(?i)\bba ?zi\b", "BaZi", cau or "")


_TEN_THANG = "|".join(sorted((m for m in _THANG if m != "may"), key=len, reverse=True))
_TRUOC_MAY = r"(?:in|by|this|next|during|around|before|after|until|till|early|late|mid|end of|start of|beginning of|from)"


def _hom_nay() -> dt.date:
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()


def _moc(t: str) -> list[str]:
    """Mốc thời gian tiếng Anh → cụm tiếng Việt mà `hieu_cau.thoi_gian` đọc được ("thang 3 nam 2027", "nam sau"…). Tháng
    không nêu năm → để `hieu_cau` tự chọn lần tới (tháng đã qua thì năm sau). Năm sinh ("born in 1990") không là mốc."""
    ra: list[str] = []
    da_nam: set[str] = set()
    # tháng (kèm năm ngay sau nếu có: "October 2027", "march '27"); "may" chỉ khi rõ là tháng ("in May", "May 2027")
    for m in re.finditer(rf"\b(?:(?:{_TRUOC_MAY}) (may)|(may)(?= (?:19|20)\d\d\b)|({_TEN_THANG}))\b(?:,? (?:of )?((?:19|20)\d\d))?", t):
        ten = m.group(1) or m.group(2) or m.group(3)
        if re.search(r"\b(born|birth|birthday|since)\b[^.]{0,20}$", t[:m.start()]) or re.match(r" \d{1,2}(st|nd|rd|th)?,? (19|20)\d\d", t[m.end():]):
            continue                                                  # "born 14 February 1960", "since March"
        if re.search(r"\blast$", t[:m.start()].strip()):
            continue                                                  # "last March" — mốc đã qua
        ra.append(f"luu nguyet thang {_THANG[ten]}" + (f" nam {m.group(4)}" if m.group(4) else ""))
        if m.group(4):
            da_nam.add(m.group(4))
    for y in re.findall(r"\b(19\d\d|20\d\d)\b", t):
        if y in da_nam or re.search(rf"\b(born|birth|since|sinh)\b[^.]{{0,24}}\b{y}\b", t) or re.search(rf"\b{y}\b[^.]{{0,6}}\b(born|baby)\b", t):
            continue
        ra.append(f"nam {y}")
    hn = _hom_nay()
    for ten, goc in _CON_GIAP.items():
        if re.search(rf"\byear of the (?:\w+ )?{ten}\b|\b(?:wood |fire |earth |metal |water )?{ten} year\b", t) and not re.search(
                rf"\b(born|i am|my|a|an) (?:in the )?(?:year of the )?(?:\w+ )?{ten}\b|\b{ten} year pillar\b", t):
            y = goc + 12 * ((hn.year - 1 - goc) // 12 + 1)           # lần gần nhất từ năm ngoái trở đi
            ra.append(f"nam {y if y >= hn.year - 1 else y + 12}")
    if re.search(r"\b(after|post|from|since|right after|wait until after|until after) (the )?(chinese|lunar) new year\b|"
                 r"\bnext (chinese|lunar) new year\b", t):
        from app.calc import lunar  # noqa: PLC0415
        from app.config import CALENDAR_MERIDIAN_TZ  # noqa: PLC0415
        nam_am = lunar.solar_to_lunar(hn.day, hn.month, hn.year, CALENDAR_MERIDIAN_TZ)[2]
        ra.append("nam sau" if nam_am >= hn.year else "nam nay")   # Tết năm nay đã qua → Tết tới thuộc năm sau
    m = re.search(r"\bnext (\d+|" + "|".join(_SO) + r") months?\b", t)
    if m:
        n = int(m.group(1)) if m.group(1).isdigit() else _SO[m.group(1)]
        ra.append(f"{min(n, 12)} thang toi")
    return ra


def _chu_de(cau: str) -> tuple[str, str] | None:
    """(mã, cụm) chủ đề chính — câu hỏi thật trước, mỗi câu theo thứ tự ưu tiên `CHU_DE_EN`."""
    toan = chuan(cau)
    for c in _cau(cau):
        c = re.sub(r"\b(yang|yin) (wood|fire|earth|metal|water)\b|\b(wood|fire|earth|metal|water) (person|girl|guy|woman|man|"
                   r"lady|boy|day master|dm)\b", " ", c)                    # nhật chủ tự giới thiệu không phải câu hỏi ngũ hành
        for ma, vn, mau in CHU_DE_EN:
            if re.search(r"\b(?:" + mau + r")\b", c):
                if ma == "tinh_cam_nhe" and re.search(r"\b(" + _GIA + "|" + _CON + r")\b", toan) and not re.search(
                        r"\b(boyfriend|girlfriend|husband|wife|partner|spouse|fianc\w*|dating|crush|ex)\b", toan):
                    return "gia_dinh", "gia dinh"                         # "our relationship" với con / bố mẹ
                if ma == "tien_bac" and re.search(r"\blucky (numbers?|colou?rs?)\b", c) and not re.search(
                        r"\b(money|wealth|rich|income|invest\w*)\b", c):
                    continue
                return ma, vn
    return None


def _battu(cau: str, t: str) -> str:
    ra: list[str] = []
    ca_nhan = bool(_CA_NHAN.search(t))
    # 1. câu kiến thức
    if _HOI.search(t):
        kt = [v for m, v, cho in KIEN_THUC["battu"] if (cho or not ca_nhan) and re.search(m, t)]
        nc = [f"nhat chu {_NHAT_CHU[(a, b)]}" for a, b in re.findall(r"\b(yang|yin) (wood|fire|earth|metal|water)\b", t)]
        if kt or (nc and not ca_nhan and len(nc) >= 2):
            if nc and not ca_nhan:
                return " ".join(dict.fromkeys(nc)) + " khac nhau the nao"
            return " ".join(dict.fromkeys(kt)) + " " + _goc_tu_dien(cau)
        if not ca_nhan and re.search(r"\bwhat (is|are|does)\b|\bmeaning\b|\bmean\b", t):
            tt = [vn for p, vn in _THAP_THAN if vn and re.search(r"\b(" + p + r")\b", t)]
            if tt:
                return " ".join(tt) + " la gi"
    # 2. loại câu: hợp nhau / người khác / con
    hop = _hop_nhau(t)
    if hop and hop != "gia dinh":
        ra.append(hop)
    elif not hop:
        nk = _ve_nguoi_khac(t)
        if nk:
            ra.append(nk)
    # nhật chủ người hỏi tự nêu ("I'm Yin Fire") / thập thần ("Hurting Officer in my chart")
    for a, b in re.findall(r"\b(?:i am|i m|im|am i|my day master is|as an?|i am an?|i am a) (?:an? )?(yang|yin) (wood|fire|earth|metal|water)\b", t):
        ra.append(f"nhat chu {_NHAT_CHU[(a, b)]}")
    for p, vn in _THAP_THAN:
        if vn and re.search(r"\b(" + p + r")\b", t):
            ra.append(vn)
    # 3. chủ đề chính
    cd = ("gia_dinh", "gia dinh") if hop == "gia dinh" else _chu_de(cau)
    if cd:
        ma, vn = cd
        if ma == "ngu_hanh":
            vn = ("nhat chu manh hay yeu" if re.search(r"\b(strong|weak|strongest|weakest|season)\b", t)
                  else "mau gi" if re.search(r"\b(colou?rs?|wear|crystals?|bracelet|lucky (numbers?|charms?)|direction|face which|which way)\b", t)
                  else "thieu hanh gi")
        ra.append(vn)
    elif re.search(r"\b(clash|clashes|clashing|combination|combine|punishment|harm)\b", t):
        ra.append("xung hop")
    elif re.search(r"\b(structure|chart pattern|special chart|follow(ing)? chart)\b", t):
        ra.append("cach cuc")
    if re.search(r"\b(nobleman|travel+ing horse|academic star|symbolic stars?|shen sha|special stars?|peach blossom star)\b", t):
        ra.append("than sat")
    for tru in re.findall(r"\b(year|month|day|hour) pillar\b", t):
        ra.append({"year": "tru nam", "month": "tru thang", "day": "tru ngay", "hour": "tru gio"}[tru])
    # vận chung (không phải "lucky number / colour / person")
    tinh_cach = cd and cd[0] == "ban_than_manh"
    if re.search(r"\bluck(?!y)\b|\bfortune\b|\boutlook\b|\bprospects?\b|\bforecast\b|\bhoroscope\b|\bturn(ing)? around\b|"
                 r"\bpick(s)? up\b|\bbad (period|phase|patch|spell|time)\b|\bclash year\b|\bstuck\b|\b(good|lucky|bad) (year|month|time)\b|"
                 r"\bis (\w+ )?(month|year|week) (lucky|good)\b|\bkind to me\b|\bwhat to expect\b|\bwatch out\b|\bbe careful\b|"
                 r"\bbig decisions?\b|\bstart something new\b|\bin store\b|\blies ahead\b|\bahead of me\b|\bawaits?\b|\bcoming up\b|"
                 r"\bupcoming\b|\bget(ting)? better\b|\bturning point\b|\bbreakthrough\b|\bsetbacks?\b|\bobstacles?\b|\bhard times?\b|"
                 r"\bmy year\b|\byear look\w*|\bcoming my way\b|\b(period|phase|stage|time|years) of my life\b|\b(major|big) changes?\b|"
                 r"\bchanges? (soon|coming|ahead)\b|\bexpect\b|\bdifficult (time|period|year|phase)\b|\b(good|bad) (things|news)\b|\bwhat will (happen|\d{4}|next year|this year)\b", t) and not tinh_cach:
        ra.append("van tot")
    # 4. mốc thời gian (chủ đề tính cách không đổi theo năm: chỉ giữ năm nêu rõ)
    moc = _moc(t) + [v for m_, v in _CHUNG if re.search(m_, t)]
    if tinh_cach:
        moc = [v for v in moc if re.fullmatch(r"nam (19|20)\d\d|nam ngoai", v)]
    ra += moc
    if ca_nhan:
        ra.append("cua toi")
    return " ".join(dict.fromkeys(x for x in ra if x))


# GĐ 3d: câu KIẾN THỨC thuần (không "my / me / I") mà từ điển thuật ngữ không nhận tên → mã từ điển theo NGHĨA (tên gọi
# khác của cùng khái niệm; còn lại theo loại khái niệm: sao → thần sát, trụ → trụ, khác → Bát tự là gì). Không đọc lá số.
_TU_DIEN_EN: list[tuple[str, str]] = [
    (r"nobleman|noble (?:person|people|star|man)|benefactor star|heavenly noble", "thien_at_quy_nhan"),
    (r"peach blossom|academic star|intelligence star|lonely star|grave star|solitary star|sky horse|red phoenix|"
     r"symbolic stars?|shen ?sha|special stars?", "than_sat"),
    (r"(?:year|month|day|hour) pillars?|the pillars?|a pillar", "tru"),
    (r"month branch|season (?:of|you are) born|birth season", "nguyet_lenh"),
    (r"travel+ing horse", "dich_ma"),
]
_KIEN_THUC_HOI = re.compile(r"\bwhat (is|are|does|do)\b|\bmeaning\b|\bmean\b|\bexplain\b|\bdefine\b|\bdefinition\b|"
                            r"\btell me about (the |a |an )?(?!my\b)|\bwhat .{0,20}\b(represent|represents|stand for|stands for|symboli[sz]e)\b")
_KIEN_THUC_MOC = re.compile(r"\b(this|next|last) (year|month|week)\b|\b(19|20)\d\d\b|\btoday\b|\bnow\b")


def tu_dien_kien_thuc(cau: str, mang: str = "battu") -> list[str]:
    """Mã từ điển cho câu kiến thức thuần tiếng Anh (Bát tự) mà bộ phân loại chưa nhận ra; không phải câu kiến thức → []."""
    if mang != "battu":
        return []
    t = chuan(cau)
    if _CA_NHAN.search(t) or not _KIEN_THUC_HOI.search(t) or _KIEN_THUC_MOC.search(t) or _ve_nguoi_khac(t) or _hop_nhau(t):
        return []
    from app.kb import tu_dien  # noqa: PLC0415
    ma = [m["ma"] for m in tu_dien.nhan_dien(_goc_tu_dien(cau), "battu")]
    for mau, m in _TU_DIEN_EN:
        if re.search(r"\b(?:" + mau + r")\b", t) and m not in ma:
            ma.append(m)
    if not ma:
        ma = ["than_sat"] if re.search(r"\bstars?\b", t) else ["tru"] if re.search(r"\bpillars?\b", t) else []
    return ma[:2]


def gloss(cau: str, mang: str) -> str:
    """Câu tiếng Anh → cụm từ khoá tiếng Việt không dấu cho `phan_loai` của mảng. Không khớp gì → chuỗi rỗng."""
    t = chuan(cau)
    if mang == "battu":
        return _battu(cau, t)
    return ""
