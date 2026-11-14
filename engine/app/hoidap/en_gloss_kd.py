# -*- coding: utf-8 -*-
"""EN-ALL GĐ 6 — hiểu câu hỏi Kinh Dịch TIẾNG ANH bằng cách dịch Ý sang cụm từ khoá không dấu mà `hoidap/kinhdich.phan_loai`,
`luangiai/kinhdich_doi_song.chu_de_tu_cau`, `kinhdich_tra_loi.kieu_cau / vai_trong_cau` đã nhận (như `en_gloss` của Bát tự /
Tử vi, `en_gloss_pt` của Phong thuỷ; tệp riêng để không đụng hai tệp đó).

Câu tiếng Anh → cụm tiếng Việt: quẻ đã gieo ("Hexagram 5", "got 49 Ge", "44, Coming to Meet", "7,8,9,7,6,8" sáu giá trị
hào → số quẻ do CALC dựng) + hào động ("line 2 moving"), câu KIẾN THỨC (hào động, quẻ biến, quẻ hỗ, Mai Hoa, Lục Hào, Thập
Dực…), chủ đề đời sống (20 chủ đề KB Kinh Dịch), vai (con, bố mẹ, vợ / chồng, người ấy, sếp, đối tác, bạn bè), kiểu câu (có
nên · có thành không · người kia nghĩ gì · khi nào · làm thế nào), câu hai lựa chọn ("A or B" → "A hay B" để bộ làm rõ hỏi
lại trước khi gieo), mốc thời gian. Bộ chặn an toàn xét trên CÂU GỐC tiếng Anh (`luangiai/an_toan`). Tất định, không LLM,
không lưu câu.
"""
from __future__ import annotations

import re

from app.hoidap import en_gloss

# ------------------------------------------------------------------ 64 quẻ: tên tiếng Anh (Wilhelm / Legge / thường gặp) + pinyin
# (tên, số). Tên nhiều chữ đứng trước; tên một chữ thông dụng ("Peace", "Return") chỉ nhận khi câu đang nói về quẻ.
_TEN_ANH: list[tuple[str, int]] = [
    ("the creative", 1), ("creative force", 1), ("the receptive", 2), ("difficulty at the beginning", 3), ("difficult beginnings?", 3),
    ("initial difficulty", 3), ("sprouting", 3), ("youthful folly", 4), ("youthful ignorance", 4), ("inexperience", 4),
    ("waiting", 5), ("conflict", 6), ("contention", 6), ("the army", 7), ("holding together", 8), ("union", 8),
    ("small taming", 9), ("taming power of the small", 9), ("treading", 10), ("conduct", 10), ("peace", 11), ("standstill", 12),
    ("stagnation", 12), ("fellowship(?: with men)?", 13), ("great possession", 14), ("possession in great measure", 14),
    ("modesty", 15), ("enthusiasm", 16), ("following", 17), ("work on what has been spoiled", 18), ("repairing decay", 18),
    ("decay", 18), ("approach", 19), ("contemplation", 20), ("view", 20), ("biting through", 21), ("grace", 22),
    ("splitting apart", 23), ("stripping", 23), ("return", 24), ("turning point", 24), ("innocence", 25), ("the unexpected", 25),
    ("great taming", 26), ("taming power of the great", 26), ("nourishment", 27), ("corners of the mouth", 27),
    ("preponderance of the great", 28), ("great excess", 28), ("the abysmal(?: water)?", 29), ("the abyss", 29), ("abyss", 29),
    ("the clinging(?: fire)?", 30), ("influence", 31), ("wooing", 31), ("duration", 32), ("retreat", 33),
    ("power of the great", 34), ("great power", 34), ("progress", 35), ("darkening of the light", 36), ("the family", 37),
    ("the clan", 37), ("opposition", 38), ("obstruction", 39), ("deliverance", 40), ("decrease", 41), ("increase", 42),
    ("breakthrough", 43), ("resoluteness", 43), ("coming to meet", 44), ("gathering(?: together)?", 45), ("pushing upward", 46),
    ("oppression", 47), ("exhaustion", 47), ("the well", 48), ("revolution", 49), ("molting", 49), ("the cauldron", 50),
    ("arousing(?: thunder)?", 51), ("shock", 51), ("keeping still", 52), ("mountain", 52), ("gradual progress", 53),
    ("development", 53), ("the marrying maiden", 54), ("marrying maiden", 54), ("abundance", 55), ("fullness", 55),
    ("the wanderer", 56), ("wanderer", 56), ("the gentle(?: wind)?", 57), ("the joyous(?: lake)?", 58), ("dispersion", 59),
    ("dissolution", 59), ("limitation", 60), ("inner truth", 61), ("small excess", 62), ("preponderance of the small", 62),
    ("after completion", 63), ("before completion", 64),
]
# Tên chỉ nhận khi viết hoa trong câu gốc hoặc đứng sau số / chữ "hexagram" (dễ trùng chữ thường).
_TEN_THUONG = {"waiting", "conflict", "peace", "following", "approach", "view", "grace", "return", "innocence", "influence",
               "duration", "retreat", "progress", "opposition", "obstruction", "deliverance", "decrease", "increase",
               "breakthrough", "oppression", "exhaustion", "revolution", "shock", "mountain", "development", "abundance",
               "dispersion", "limitation", "decay", "union", "conduct", "treading", "modesty", "enthusiasm", "stagnation",
               "standstill", "fullness", "contention", "nourishment", "sprouting", "inexperience", "stripping", "abyss", "wanderer"}
_PINYIN: list[tuple[str, int]] = [
    ("xiao xu", 9), ("xiao chu", 9), ("tong ren", 13), ("da you", 14), ("shi he", 21), ("wu wang", 25), ("da xu", 26),
    ("da chu", 26), ("da guo", 28), ("da zhuang", 34), ("ming yi", 36), ("jia ren", 37), ("gui mei", 54), ("zhong fu", 61),
    ("xiao guo", 62), ("ji ji", 63), ("wei ji", 64),
    ("qian", 1), ("kun", 2), ("zhun", 3), ("meng", 4), ("xu", 5), ("song", 6), ("shi", 7), ("bi", 8), ("lu", 10), ("lv", 10),
    ("tai", 11), ("pi", 12), ("yu", 16), ("sui", 17), ("gu", 18), ("lin", 19), ("guan", 20), ("bo", 23), ("fu", 24), ("yi", 27),
    ("kan", 29), ("li", 30), ("xian", 31), ("heng", 32), ("dun", 33), ("jin", 35), ("kui", 38), ("jian", 39), ("xie", 40),
    ("jie", 60), ("sun", 41), ("guai", 43), ("gou", 44), ("cui", 45), ("sheng", 46), ("jing", 48), ("ge", 49), ("ding", 50),
    ("zhen", 51), ("gen", 52), ("feng", 55), ("xun", 57), ("dui", 58), ("huan", 59),
]
_NGU_CANH_QUE = re.compile(r"\b(?:hexagrams?|hex|gua|got|get|drew|draw|drawn|cast|casted|casting|threw|thrown|came up|comes up|"
                           r"received|pulled|reading|oracle|coins?|yijing|yi jing|i ching|iching|line|lines|changing|moving|"
                           r"turning into|changes? (?:in)?to|keep getting)\b")


def _vi_tri_cau(cau: str) -> list[str]:
    """Các câu (giữ nguyên chữ hoa) — để biết tên quẻ một chữ có viết hoa không."""
    return [c for c in re.split(r"(?<=[.!?])\s+|\n+", (cau or "").strip()) if c.strip()]


def que_trong_cau(cau: str) -> tuple[int | None, list[int]]:
    """(số quẻ bản người hỏi nêu / đã gieo, các hào động họ nêu). Không có → (None, []). So khớp trên chữ gốc thường hoá (bộ
    chuẩn hoá chung đổi "got" → "have", sẽ mất ngữ cảnh "got 49")."""
    t = " ".join(re.sub(r"[^a-z0-9 ]+", " ", (cau or "").lower().replace("’", "'").replace("'s", " s")).split())
    # sáu giá trị hào 6/7/8/9 (đồng xu) → CALC dựng quẻ
    m = re.search(r"(?<!\d)([6-9])[\s,/-]+([6-9])[\s,/-]+([6-9])[\s,/-]+([6-9])[\s,/-]+([6-9])[\s,/-]+([6-9])(?!\d)", cau or "")
    if m:
        vals = [int(x) for x in m.groups()]
        if re.search(r"top (?:to|down to) bottom|from the top", t):
            vals = vals[::-1]
        from app.calc import kinhdich  # noqa: PLC0415
        try:
            q = kinhdich.khoi_que(vals)
            return q["quai_ban"]["so_king_wen"], [i + 1 for i, v in enumerate(vals) if v in (6, 9)]
        except Exception:  # noqa: BLE001 — giá trị lạ: bỏ qua, không đoán
            pass
    so = None
    m = re.search(r"\b(?:hexagram|hex|gua|no|number|#)\s*(?:no\s*|number\s*|#\s*)?(\d{1,2})\b", t) or \
        re.search(r"\b(?:got|get|drew|drawn|cast|casted|threw|received|pulled|came up with|reading is|reading)\s+(?:a |the |hexagram )?"
                  r"(\d{1,2})\b(?! ?(?:k|%|years?|yrs?|months?|days?|dollars?|bucks|grand|times|people|hours?|weeks?|percent))", t) or \
        re.search(r"\b(\d{1,2})\s*,?\s*(?:the )?(?:" + "|".join(n for n, _ in _TEN_ANH + _PINYIN) + r")\b", t)
    if m and 1 <= int(m.group(1)) <= 64:
        so = int(m.group(1))
    if so is None and _NGU_CANH_QUE.search(t):
        hoa = " ".join(_vi_tri_cau(cau))
        for ten, n in _TEN_ANH:
            for k in re.finditer(r"\b(?:" + ten + r")\b", t):
                if ten.split("(")[0].strip() in _TEN_THUONG:
                    # chữ thường: chỉ nhận khi câu gốc viết hoa đúng chữ đó, hoặc ngay sau "hexagram"
                    if not (re.search(r"\b" + re.escape(k.group(0).title()) + r"\b", hoa)
                            or re.search(r"\bhexagram (?:of )?(?:the )?$", t[:k.start()])):
                        continue
                so = n
                break
            if so:
                break
    if so is None and _NGU_CANH_QUE.search(t):
        hoa = " ".join(_vi_tri_cau(cau))
        for ten, n in _PINYIN:
            # pinyin: viết hoa trong câu gốc (tên riêng), hoặc ngay sau "hexagram" / "got"
            if re.search(r"\b" + ten.title().replace(" ", r"\s") + r"\b", hoa) or \
                    re.search(r"\b(?:hexagram|got|drew|gua)\s+(?:the )?" + ten + r"\b", t):
                so = n
                # tên trùng hai quẻ: tên tiếng Anh đi kèm quyết định
                if n == 2 and re.search(r"oppress|exhaust|confin", t):
                    so = 47
                elif n == 1 and re.search(r"modest", t):
                    so = 15
                elif n == 8 and re.search(r"\bgrace\b", t):
                    so = 22
                elif n == 27 and re.search(r"\bincrease\b", t):
                    so = 42
                elif n == 10 and re.search(r"wander|travell", t):
                    so = 56
                elif n == 39 and re.search(r"gradual", t):
                    so = 53
                break
    hao: list[int] = []
    for m in re.finditer(r"\blines?\s+((?:[1-6](?:\s*(?:and|&|,)\s*)?)+)\s*(?:is |are )?(?:changing|moving|chang\w*|mov\w*)?|"
                         r"\b(?:changing|moving) lines?\s+((?:[1-6](?:\s*(?:and|&|,)\s*)?)+)|\b([1-6])(?:st|nd|rd|th) line\b|"
                         r"\b(first|second|third|fourth|fifth|sixth|top|bottom) line\b", t):
        if m.group(4):
            hao.append({"first": 1, "bottom": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "top": 6}[m.group(4)])
            continue
        for x in re.findall(r"[1-6]", m.group(1) or m.group(2) or m.group(3) or ""):
            if int(x) not in hao:
                hao.append(int(x))
    return so, hao


# ------------------------------------------------------------------ câu kiến thức → cụm kho giải thích / mã từ điển
_GIAI_THICH: list[tuple[str, str]] = [   # (mẫu tiếng Anh, cụm `tu_khoa` của mục KB `giai_thich` Kinh Dịch)
    (r"all six (?:lines )?(?:changing|moving)|six changing|six moving|(?:all|every) (?:line|lines) (?:are )?(?:changing|moving)", "sau hao dong"),
    (r"same question (?:twice|again|more than once)|(?:cast|ask)(?:ing)? twice|twice for the same|recast|re cast|cast again|ask again|keep getting the same|same hexagram", "gieo lai"),
    (r"yarrow|stalks?|coin method|three coin|3 coin|coins? vs|coins? or", "dong xu va co thi"),
    (r"nuclear|inner hexagram|hidden hexagram|hu gua", "que ho la gi"),
    (r"relating hexagram|resulting hexagram|second hexagram|changed hexagram|future hexagram|primary (?:hexagram )?(?:and|vs|versus|or)|"
     r"what (?:it|the hexagram) changes (?:in)?to|turning into|changes? (?:in)?to", "que bien la gi"),
    (r"(?:no|zero|without|without any) (?:changing|moving) lines?|changing lines?|moving lines?|old yin|old yang|young yin|young yang|"
     r"\b6 7 8 (?:and )?9\b|6 7 8 9|six seven eight|line values|"
     r"(?:explain|about|mean\w*)(?: \w+){0,3} line [1-6]|line [1-6] (?:mean\w*|in detail)", "hao dong la gi"),
    (r"plum blossom|mei ?hua|meihua", "mai hoa la gi"),
    (r"use god|yong shen|useful god|which line (?:represents|stands for)", "dung than la gi"),
    (r"self line|other line|shi ying|shi and ying|subject line|object line", "the ung la gi"),
    (r"ten wings|confucius|commentar(?:y|ies)|shi yi", "thap duc"),
    (r"fortune ?telling|philosophy|divination or|superstition|oracle or|is it just|really work|does it work|scientific", "co phai de boi"),
    (r"void|empty branch|xun kong|month breaker|month break", "tuan khong"),
    (r"phrase|ask (?:a )?good question|how (?:do|should) i ask|right way to ask|how to ask|good question", "hoi que the nao"),
]
_TU_DIEN: list[tuple[str, str]] = [     # (mẫu, mã từ điển Kinh Dịch `tu_dien.json`)
    (r"eight trigrams|8 trigrams|trigrams?|bagua|ba gua", "bat_quai"), (r"upper trigram|outer trigram", "thuong_quai"),
    (r"lower trigram|inner trigram", "ha_quai"), (r"judg(?:e)?ment|tuan ci|gua ci", "quai_tu"), (r"\bimage\b|great image|da xiang", "dai_tuong"),
    (r"line text|line statement|yao ci", "hao_tu"), (r"\byin\b.{0,20}\byang\b|\byang\b.{0,20}\byin\b|broken line|solid line", "hao_duong"),
    (r"najia|na jia|liu yao|six yao|six lines? (?:method|divination)|wen wang gua", "luc_hao"),
    (r"six relatives|liu qin|six kin", "luc_than"), (r"six (?:spirits|beasts|animals)|liu shen|liu shou", "luc_thu"),
    (r"king wen|fu ?xi|sequence|order of the hexagrams", "que"), (r"64 hexagrams|sixty four", "que"),
    (r"how old|who wrote|history|origin|come from|ancient|zhou yi|zhouyi|book of changes", "que"),
    (r"translation|wilhelm|legge|book to read|best book|beginners?", "que"),
    (r"yuan heng li zhen|four virtues", "nguyen_hanh_loi_trinh"), (r"no blame|without blame|wu jiu", "vo_cuu"),
    (r"\bauspicious\b|\bgood fortune\b|\bji\b", "cat"), (r"\bmisfortune\b|\bxiong\b", "hung"), (r"\bremorse\b|\bregret\b", "hoi"),
    (r"humiliation", "lan"), (r"month (?:branch|pillar|ruler)", "nguyet_kien"), (r"day (?:branch|ruler|pillar)", "nhat_than"),
    (r"eight palaces|8 palaces|palace of the hexagram", "bat_cung"), (r"opposite hexagram|cuo gua|mutual opposite", "thac_quai"),
    (r"inverse hexagram|upside down|zong gua|reversed hexagram", "tong_quai"),
]
_KHONG_I = re.compile(r"\bi ching\b|\bi chings\b")      # "I Ching" không phải đại từ "I"
_CA_NHAN = re.compile(r"\b(?:my|me|mine|myself|i|i m|im|we|our|us)\b")
_HOI_KT = re.compile(r"\b(?:what|whats|how|why|who|which|when was|is the|are the|does|do|explain|meaning|mean|difference|define|vs|versus|"
                     r"tell me about|is it|did)\b")


def tu_dien_kien_thuc(cau: str) -> list[str]:
    """Mã từ điển cho câu KIẾN THỨC thuần (không nói về việc của chính người hỏi, không nêu quẻ). Không phải → []."""
    t = en_gloss.chuan(cau)
    if not _HOI_KT.search(t) or _ca_nhan(t) or que_trong_cau(cau)[0]:
        return []
    if any(re.search(r"\b(?:" + m + r")\b", t) for m, _ in _GIAI_THICH):
        return []
    ma: list[str] = []
    for mau, m in _TU_DIEN:
        if re.search(r"\b(?:" + mau + r")", t) and m not in ma:
            ma.append(m)
    return ma[:2]


def _ca_nhan(t: str) -> bool:
    """Câu nói về việc của chính người hỏi ("my", "I"…) — trừ "how do I phrase / should I ask / can I ask" (hỏi cách dùng)."""
    t = _KHONG_I.sub("yijing", t)
    bo = re.sub(r"\b(?:how (?:do|should|can) i (?:phrase|ask|read|cast|use|interpret|throw)|(?:should|can|may) i (?:ask|cast|recast|use|read)|"
                r"do i (?:read|use|need)|am i (?:doing something wrong|reading|casting)|i keep getting|if i don t like)\b", " ", t)
    return bool(_CA_NHAN.search(bo))


def _giai_thich(t: str) -> str | None:
    for mau, vn in _GIAI_THICH:
        if re.search(r"\b(?:" + mau + r")", t):
            return vn
    return None


# ------------------------------------------------------------------ chủ đề đời sống (thứ tự = ưu tiên), vai, kiểu câu
_CHU_DE: list[tuple[str, str]] = [
    # vợ chồng lục đục / ngoại tình / ly hôn
    (r"divorc\w*|separat\w*|save (?:the |our |my )?marriage|marriage (?:counsel\w*|problems?|trouble)|distant from (?:my )?(?:husband|wife|spouse)|"
     r"forgive (?:my )?(?:husband|wife|spouse|partner)|(?:husband|wife|spouse|partner) (?:lied|lies|lying|cheated|cheats|is cheating|"
     r"has an affair|had an affair)|(?:he|she|husband|wife|partner|boyfriend|girlfriend|spouse|bf|gf) (?:\w+ ){0,2}cheat\w*|cheated on me|"
     r"cheated once|(?:an |the )affair|unfaithful|(?:husband|wife|spouse) and i (?:\w+ ){0,2}(?:fight|argue|quarrel|bicker)\w*|"
     r"(?:fix|repair|rescue) (?:our|my|the) marriage|(?:fight|argue|quarrel)\w* with (?:my )?(?:husband|wife|spouse)", "luc duc"),
    # cưới hỏi
    (r"marry|married|marriage|wedding|engag\w*|propos\w*|fianc\w*|maid of honou?r|best man", "ket hon"),
    # tình cảm
    (r"\bex\b|crush|boyfriend|girlfriend|\bbf\b|\bgf\b|dating|date with|second date|first date|relationship|situationship|break ?up|"
     r"broke up|back together|get back with|text (?:him|her|my ex)|confess|feelings for|met someone|meet someone|find love|find (?:the )?one|"
     r"soul ?mate|long ?distance|move in together|moving in together|love (?:me|him|her|life)|romanc\w*|romantic|commit\w*|"
     r"walk away|the guy|the girl|this guy|this girl|still love|in love|single\b|someone online|dating app|(?:the |a )?(?:person|someone|guy|girl) i "
     r"(?:like|love|fancy|have a crush on)", "nguoi yeu"),
    # con cái
    (r"second child|another (?:baby|child)|try(?:ing)? for (?:a )?(?:baby|child|kids?)|have (?:a )?(?:baby|kids|children)|pregnan\w*|conceiv\w*|"
     r"\b(?:my|our) (?:son|daughter|kid|kids|child|children|baby|toddler|teen\w*|\d+ ?(?:yo|year old))\b|\b\d+ ?yo\b", "con toi"),
    # cha mẹ, gia đình
    (r"\b(?:my|our|his|her) (?:mum|mom|mother|dad|father|parents?|grand\w+|in ?laws?|mother in law|father in law|sister|brother|"
     r"siblings?|family|aunt|uncle|cousin|nan|nana)\b|\bin ?laws?\b|family (?:home|business|house)|care home|nursing home|whole family",
     "gia dinh"),
    # thi cử, học hành
    (r"\bexams?\b|\bbar exam\b|\btests?\b|ielts|toefl|\bgre\b|gmat|\bsat\b|\bcpa\b|\bcfa\b|\bacca\b|board exam|entrance|"
     r"master s|masters|\bmba\b|\bphd\b|degree|\buni\b|university|college|secondary school|high school|\bschool\b|scholarship|"
     r"\bstudy\w*|course|thesis|dissertation|learn\w*|drop out|dropout|gap year|medicine or|engineering|back to school", "hoc tiep"),
    # kiện tụng, tranh chấp
    (r"lawsuit|\bsue\b|suing|\bcourt\b|legal action|lawyer|dispute|custody|inheritance|claim against|small claims|tribunal|"
     r"confront (?:my |the )?landlord|deposit", "tranh chap"),
    # đòi nợ, cho vay
    (r"\blent\b|\blend\w*|borrow\w*|\bowes?\b|\bowed\b|debts?|credit cards?|\bloan\b|guarantor|pay (?:me )?back|get (?:it|my money) back|"
     r"repay\w*|mortgage", "doi no"),
    # bán nhà / mua nhà / xe
    (r"sell\w* (?:my |our |the |the family |his |her )?(?:flat|house|home|apartment|condo|property|land|unit)", "ban nha"),
    (r"buy\w* (?:a |my |our |the |first )?(?:flat|house|home|apartment|condo|property|land|unit)|rent or buy|buy or rent|"
     r"property (?:market|prices)|first home|renovat\w*", "mua nha"),
    (r"\b(?:buy|buying|get|getting) (?:a |new |the )?car\b|\bnew car\b|\ba car\b", "mua xe"),
    # mất đồ
    (r"\blost (?:my |the |our )?(?:wallet|phone|ring|keys|passport|bag|cat|dog|watch|laptop)|stolen|missing (?:wallet|ring|cat|dog|"
     r"item|keys)|find (?:my )?(?:lost|missing)", "mat do"),
    # hợp tác
    (r"business partner|partnership|joint venture|co ?found\w*|partner (?:in|on) (?:the |a |my )?business|team up with", "hop tac"),
    # kinh doanh, đầu tư
    (r"crypto|bitcoin|\bstocks?\b|\bshares\b|invest\w*|\bgold\b|portfolio|\bfunds?\b|\bproperty investment", "dau tu"),
    (r"(?:start|open|launch|run|expand|grow|close|keep)\w* (?:my |a |our |the |his |her )?(?:own )?(?:business|bakery|shop|store|cafe|"
     r"restaurant|startup|company|brand|online store|franchise|practice|clinic|second store|second shop|salon|studio|band)|"
     r"franchise|side (?:business|hustle)|\b(?:my|our|the|father s|dad s) (?:shop|store|restaurant|cafe|business|startup)\b|"
     r"freelanc\w*|self employed|go(?:ing)? solo|\blaunch\b|clients?\b|customers?|\b(?:restaurant|bakery|cafe|salon|"
     r"online store|e ?commerce)\b", "kinh doanh"),
    # sống bằng tiền tiết kiệm / bỏ tiền tiết kiệm vào đâu
    (r"live (?:off|on) (?:my |our )?savings|(?:put|use|spend) (?:my |our )?(?:life )?savings|savings (?:into|on)", "tien tiet kiem"),
    # thăng tiến, phỏng vấn
    (r"interview|promot\w*|senior role|passed over|appraisal|performance review|shortlist\w*|selected|be chosen|management role|"
     r"lead role|team lead", "thang chuc"),
    # chuyển việc
    (r"job offer|offer letter|accept\w* (?:the |an |a )?(?:job|offer|position|role)|new (?:job|role|position|team)|change (?:jobs?|careers?)|"
     r"career change|switch (?:jobs?|careers?)|job hunt\w*|(?:find|get|land) (?:a )?(?:new )?job|look\w* for (?:a )?(?:new )?(?:job|role|work)|"
     r"laid off|redundan\w*|unemploy\w*|resign\w*|quit\w* (?:my |the |this )?(?:job|work|role|position)|quit to\b|quitting to\b|leave (?:my |the )?(?:job|company|firm)|go back to (?:work|nursing|"
     r"teaching|\w+ing)|return to work|corporate job|industry job|ngo|stay (?:at|in) (?:my )?(?:stable |current )?(?:job|role)|"
     r"take over the family business|transfer|job\b|career", "chuyen viec"),
    # giấy tờ, hợp đồng, visa
    (r"visa|permit|residency|citizenship|paperwork|documents?|(?:be|get|got|been) approved|approval|licen[cs]e|application|contract|sign\w* (?:the|a)|lease|"
     r"renew\w*", "giay to"),
    # sức khoẻ, nhịp sống (không phải câu cấp cứu / bệnh — bộ chặn chung đã xét trước)
    (r"health|burn ?t? ?out|burnout|exhausted|tired|energy|sleep\w*|insomnia|anxiety|anxious|stress\w*|smoking|quit smoking|diet|"
     r"weight|recover\w*|recovery|chemo|night shifts?|getting sick|keep getting sick|surgery|operation", "suc khoe"),
    # đi xa, chuyển chỗ ở
    (r"\bmove to\b|moving to|move (?:abroad|overseas|countries|cities|house|home|back)|relocat\w*|abroad|overseas|emigrat\w*|"
     r"immigrat\w*|go home\b|travel\w*|\btrip\b|holiday|\bsydney\b|\bperth\b|\bmelbourne\b|\bshanghai\b|\bhong kong\b|singapore office",
     "di xa"),
    # tiền bạc chung
    (r"money|financ\w*|savings?|income|wealth|salary|\braise\b|pay rise|bonus|budget|cash|earn\w*|spend\w*", "tien bac"),
    # bạn bè, đồng nghiệp, đối thủ
    (r"best friend|\bfriends?\b|coworkers?|co workers?|colleagues?|team ?mates?|rival|competitor", "ban be"),
]
_TANG_LUONG = re.compile(r"\b(?:raise|pay rise|bonus|salary)\b")
_VAI: list[tuple[str, str]] = [
    (r"\b(?:my|our) (?:son|daughter|kid|kids|child|children|baby|toddler|teen\w*|\d+ ?yo|\d+ year old)\b|\b\d+ ?yo\b", "con toi"),
    (r"(?:^|[.?!] )(?:son|daughter|kid)\b|\b(?:son|daughter) (?:wants|is|has|keeps|won t|says|just)\b", "con toi"),
    (r"\b(?:my|our)? ?(?:mum|mom|mother|mama)\b", "me toi"), (r"\b(?:my|our)? ?(?:dad|father|papa)\b", "bo toi"),
    (r"\b(?:my|our) parents\b|\bin ?laws?\b|\bparents\b", "bo me"),
    (r"\bmy (?:husband|hubby|hus)\b", "chong toi"), (r"\bmy (?:wife|wifey)\b", "vo toi"),
    (r"\bmy (?:partner|boyfriend|girlfriend|bf|gf|fianc\w*|ex)\b|\bex\b|crush", "nguoi yeu"),
    (r"\b(?:my )?(?:boss|manager|supervisor)\b", "sep"), (r"\bbusiness partner\b", "doi tac"),
    (r"\b(?:my )?best friend\b", "ban than"), (r"\b(?:my )?(?:coworker|co worker|colleague)s?\b", "dong nghiep"),
]
_ANH_AY = re.compile(r"\b(?:he|him|his)\b")
_CO_AY = re.compile(r"\b(?:she|her|hers)\b")

_NGUOI_KIA = re.compile(
    r"\b(?:does|do|is|are|will|would|did|has|have)\s+(?:he|she|they|my (?:\w+ ){0,2}\w+|the (?:guy|girl|man|woman)|this (?:guy|girl))\s+"
    r"(?:still |really |even |actually )?(?:love|loves|like|likes|miss|misses|care|cares|want|wants|think|thinks|have feelings|has feelings|"
    r"being honest|honest|lying|lie|cheating|hiding|plan|planning|mean it|serious|faithful|loyal|sincere|genuine|interested|regret)\b|"
    r"\bwhat (?:does|do|did) (?:he|she|they|my (?:\w+ ){0,2}\w+) (?:really )?(?:think|feel|want)\b|what s going on with (?:him|her|them)|"
    r"hidden agenda|good influence|bad influence|(?:true |real )?intentions|(?:honest|lying) (?:with|to) me")
_KHI_NAO = re.compile(r"^(?:\w+ )?when\b|\bwhen (?:will|is|should|can|would|do|does)\b|how long (?:until|till|before|will)|how soon|"
                      r"\bby when\b|what (?:month|year|time|week|day)|which (?:month|year|week|day)")
_CO_NEN_LUC = re.compile(r"good time to|right time|best time|(?:is )?(?:now|this) (?:the|a) (?:right |good )?time|timing (?:is )?right|"
                         r"too (?:soon|early|late)|now or (?:later|wait)|wait until|wait or")
_CACH_LAM = re.compile(r"\bhow (?:do|can|should|could) (?:i|we)\b(?! (?:phrase|ask|read|cast|use))|\bhow to\b|what s the (?:best )?(?:way|approach)|"
                       r"\bwhat (?:should|can) (?:i|we) do\b|best approach|position myself|how (?:should|can) (?:we|i) (?:support|help|respond)|"
                       r"the way back|way forward")
_CO_NEN = re.compile(r"\bshould (?:i|we)\b|\bshall (?:i|we)\b|\bis it (?:wise|smart|worth|a good idea|ok|okay|right)\b|\bwise\b|\bgood idea\b|"
                     r"\bworth (?:it|going|the)\b|\bdo i (?:take|go|say|keep|accept|stay|move|tell|let|fight|confront|step|reach|trust|"
                     r"forgive|quit|leave|sign|ask|wait|walk|propose|confess|push|retake|apply|report|pull)\b|\byes or no\b|"
                     r"\baccept or refuse\b|\bor not\b|\bwhich\??$|help me (?:decide|choose|read)|\bwalk away\b|\bam i ready\b|"
                     r"\b(?:keep going|stay|go|wait|quit|leave|sell|buy|rent|accept|refuse) or (?:\w+ ){0,3}\w+\??$|\bor\b.{0,40}\?$")
_KET_QUA = re.compile(r"\bwill (?:i|we|he|she|they|it|my|the|this|things)\b|\bwould (?:i|we|it)\b|\bam i going to\b|\bis it going to\b|"
                      r"\bgoing to (?:work|happen|last|succeed)\b|\bdoes (?:that|this|it) mean\b|\bany (?:hope|chance)\b|\bis there (?:a |any )?chance\b|"
                      r"\bcan (?:i|we) (?:get|win|pass|make|save|fix)\b|\bget (?:it|them|him|her) back\b|\b(?:pass|succeed|approved|work out|"
                      r"make it|go well|last)\b.{0,10}\?|\bgoing anywhere\b|\bam i in trouble\b|\bgood sign\b|\bbad (?:omen|sign)\b")
_XIN_QUE = re.compile(r"what (?:does|do|would|will) (?:the )?(?:i ching|iching|yijing|oracle|coins|hexagram) (?:say|suggest|think)|"
                      r"\b(?:i ching|oracle) view\b|help me read|read (?:this|it)|\bthoughts\b|asking (?:the )?(?:coins|oracle|yijing|i ching)|"
                      r"what (?:does|is) (?:it|that) (?:telling|want|suggest)|main message|what s it telling")
_Y_NGHIA = re.compile(r"\bwhat does (?:it|that|this) (?:mean|suggest|say|want)\b|\bmeaning\b|\bwhat s (?:it|that) (?:mean|about)\b|"
                      r"\bconfused\b|\binterpret\b")


def _cau_chinh(cau: str) -> list[str]:
    """Các câu đã chuẩn hoá, câu hỏi thật trước (câu có "?" từ cuối lên), rồi câu kể (từ cuối lên)."""
    return en_gloss._cau(cau)          # noqa: SLF001 — dùng chung bộ tách câu của en_gloss


def _chu_de(cau: str, t: str) -> list[str]:
    """Cụm chủ đề (≤ 2: chủ đề chính + chủ đề thứ hai cho câu hai lựa chọn) — câu hỏi thật trước."""
    ra: list[str] = []
    for c in _cau_chinh(cau):
        cua_cau = [vn for mau, vn in _CHU_DE if re.search(r"\b(?:" + mau + r")(?!\w)", c)]
        if cua_cau and (not ra or ra == ["tien bac"]):
            ra += [x for x in cua_cau if x not in ra]       # câu hỏi chỉ nói chung "tiền" → lấy chủ đề cụ thể từ câu kể
        if ra and ra != ["tien bac"]:
            break
    if "tien bac" in ra and len(ra) > 1:
        ra = [x for x in ra if x != "tien bac"] + ["tien bac"]
    return list(dict.fromkeys(ra))[:3]


def _vai(t: str) -> list[str]:
    ra = [vn for mau, vn in _VAI if re.search(mau, t)]
    if not ra and re.search(r"\b(?:still love|text|ex|crush|date|dating|commit|the guy|this guy|met someone)\b", t):
        if _ANH_AY.search(t):
            ra.append("anh ay")
        elif _CO_AY.search(t):
            ra.append("co ay")
    return ra[:2]


def _kieu(cau: str, t: str) -> str:
    c = _cau_chinh(cau)[0]
    if _NGUOI_KIA.search(c) or (_NGUOI_KIA.search(t) and not _CO_NEN.search(c)):
        return "nghi gi co that long khong"
    if _KHI_NAO.search(c):
        return "khi nao"
    if _CO_NEN_LUC.search(c):
        return "luc nay co nen khong"
    if _CACH_LAM.search(c):
        return "nen lam the nao"
    if _CO_NEN.search(c):
        return "co nen khong"
    if _KET_QUA.search(c):
        return "co duoc khong"
    if _XIN_QUE.search(c) or _XIN_QUE.search(t):
        return "dinh huong xin mot que"
    if _CO_NEN.search(t):
        return "co nen khong"
    if _KET_QUA.search(t):
        return "co duoc khong"
    return ""


def _hai_lua_chon(cau: str) -> bool:
    """"A or B" thật sự là hai việc (không phải "… or not", "… or wait", "… or is it too much")."""
    c = _cau_chinh(cau)[0]
    if re.search(r"\bor (?:not|no|nah|wait|later|is it|just|should|am i|let it go|stay on|stay put)\b|"
                 r"\b(?:accept|yes|keep going|keep|stay|agree|go|confront) or (?:refuse|decline|no|reject|leave|not|close|quit|wait|"
                 r"stop|just)\b", c):
        return False
    return bool(re.search(r"\b\w+(?: \w+){0,4} or (?:a |an |the |my |stay |go |move |do |take )?\w+", c)) and "?" in (cau or "")


def _moc(t: str) -> list[str]:
    ra = [x.removeprefix("luu nguyet ") for x in en_gloss._moc(t)]   # noqa: SLF001
    if re.search(r"\bnext year\b|\bcoming year\b", t) and not any(x.startswith("nam 20") for x in ra):
        ra.append("nam sau")
    elif re.search(r"\b(?:this|the) year\b|end of (?:the|this) year|year end", t) and not any("nam" in x for x in ra):
        ra.append("nam nay")
    if re.search(r"\bnext month\b", t):
        ra.append("thang sau")
    return list(dict.fromkeys(ra))


def gloss(cau: str) -> str:
    """Câu tiếng Anh → cụm từ khoá tiếng Việt không dấu cho `kinhdich.phan_loai`. Câu gõ tiếng Việt → "" (đọc thẳng câu gốc)."""
    if en_gloss.la_cau_viet(cau):
        return ""
    t = en_gloss.chuan(cau)
    so, hao = que_trong_cau(cau)
    ca_nhan = _ca_nhan(t)
    gt = _giai_thich(t)
    ra: list[str] = []
    # 1. câu kiến thức (không về việc của chính người hỏi): quẻ được nêu → tra quẻ; thuật ngữ → mục giải thích / từ điển
    if not ca_nhan and _HOI_KT.search(t):
        if so:
            ra.append(f"que so {so}" + (f" hao {hao[0]}" if hao else "") + " y nghia la gi")
            if gt:
                ra.append(gt)
            return " ".join(ra)
        if gt:
            return gt
    if gt == "gieo lai":
        return gt
    # 1b. "What does the changing line mean for me?", "Explain line 1 in detail" — hỏi tiếp về hào của quẻ VỪA gieo (không nêu
    # quẻ, không chủ đề mới) → giải thích hào động, không gieo một quẻ mới cho câu này.
    if gt == "hao dong la gi" and not so and not _chu_de(cau, t):
        return gt
    # 2. quẻ người hỏi đã gieo được
    if so:
        ra.append(f"gieo duoc que so {so}" + (f" hao {hao[0]}" if hao else ""))
        if gt in ("sau hao dong",):
            ra.append(gt)
    elif gt == "gieo lai" or (gt and not ca_nhan):
        return gt
    # 3. chủ đề, vai, kiểu câu, mốc
    cd = _chu_de(cau, t)
    if re.search(r"\b(?:buy\w*|purchas\w*) or sell\w*\b|\bsell\w* or (?:buy|purchas)\w*\b", t):
        cd = ["mua hay ban nha"] + [x for x in cd if x not in ("mua nha", "ban nha")]     # bộ làm rõ hỏi lại: mua hay bán
    if "tien bac" in cd and _TANG_LUONG.search(t):
        cd = [("tien bac luong" if x == "tien bac" else x) for x in cd]
    vai = _vai(t)
    kieu = _kieu(cau, t)
    if so and _Y_NGHIA.search(t) and kieu in ("", "dinh huong xin mot que"):
        kieu = "y nghia"
    hai = _hai_lua_chon(cau) and len(cd) >= 2
    viec = " hay ".join(cd[:2]) if hai else " ".join(cd)
    ra += [x for x in (viec, " ".join(vai)) if x]
    if kieu:
        ra.append(kieu)
    ra += _moc(t)
    return " ".join(x for x in ra if x)


# ------------------------------------------------------------------ độ tin: câu không nhận ra chủ đề / quẻ / kiến thức
def do_tin_thap(cau: str) -> bool:
    """Câu tiếng Anh mà luật không nhận ra điều gì (không quẻ, không chủ đề, không thuật ngữ, không kiểu câu) — mời chọn
    câu cụ thể ("Did you mean…"); lời đáp chung vẫn có."""
    if en_gloss.la_cau_viet(cau):
        return False
    t = en_gloss.chuan(cau)
    return not (que_trong_cau(cau)[0] or _giai_thich(t) or tu_dien_kien_thuc(cau) or _chu_de(cau, t) or _kieu(cau, t))
