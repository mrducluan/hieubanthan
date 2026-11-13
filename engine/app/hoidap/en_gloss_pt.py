# -*- coding: utf-8 -*-
"""EN-ALL GĐ 5 — hiểu câu hỏi Phong thuỷ TIẾNG ANH bằng cách dịch Ý sang cụm từ khoá không dấu mà
`hoidap/phongthuy.phan_loai` đã nhận (như `en_gloss` của Bát tự / Tử vi; tệp riêng để không đụng `en_gloss.py`).

Câu tiếng Anh → cụm tiếng Việt: hướng ("faces south-west" → "huong tay nam"), độ la bàn (172° → "huong nam"), mệnh quái
từ số Kua ("my Kua is 6" → "menh quai can"), du niên (Sheng Qi → "sinh khi"), năm sinh + giới ("1988 male" → "tôi nam sinh
1988" — `_nam_gioi` đọc chữ có dấu), dấu hiệu / bố trí (bảng `_BO_TRI`, mỗi dòng một cụm khớp `tu_khoa` của đúng mục KB),
phi tinh năm / vận, việc theo năm, mốc thời gian, nỗi lo theo mảng (CY-1). Bộ chặn an toàn xét trên CÂU GỐC tiếng Anh
(`luangiai/an_toan`). Tất định, không LLM, không lưu câu.
"""
from __future__ import annotations

import re

from app.hoidap import en_gloss

_HUONG = [  # (mẫu tiếng Anh, phương không dấu) — cụm dài trước
    (r"north ?-? ?east|northeast|\bn\.?e\b", "dong bac"), (r"north ?-? ?west|northwest|\bn\.?w\b", "tay bac"),
    (r"south ?-? ?east|southeast|\bs\.?e\b", "dong nam"), (r"south ?-? ?west|southwest|\bs\.?w\b", "tay nam"),
    (r"\bnorth(?:ern|wards?)?\b", "bac"), (r"\bsouth(?:ern|wards?)?\b", "nam"), (r"\beast(?:ern|wards?)?\b", "dong"),
    (r"\bwest(?:ern|wards?)?\b", "tay"),
]
# chữ cái đơn chỉ là hướng khi đứng trong danh sách / sau "face(s)" ("units face W, S, and NE")
_MOT_CHU = {"n": "bac", "s": "nam", "e": "dong", "w": "tay"}
_TAM = ["bac", "dong bac", "dong", "dong nam", "nam", "tay nam", "tay", "tay bac"]

_DU_NIEN = [(r"sheng ?qi|life generating|vitality direction", "sinh khi"), (r"tian ?yi|heavenly doctor", "thien y"),
            (r"yan ?nian|longevity direction", "dien nien"), (r"fu ?wei|stability direction|personal growth direction", "phuc vi"),
            (r"huo ?hai|mishaps? direction", "hoa hai"), (r"liu ?sha|six killings", "luc sat"), (r"wu ?gui|five ghosts", "ngu quy"),
            (r"jue ?ming|total loss direction", "tuyet menh")]
_KUA = {1: "kham", 2: "khon", 3: "chan", 4: "ton", 6: "can", 7: "doai", 8: "can", 9: "ly"}

# Dấu hiệu / bố trí: (mẫu tiếng Anh trên câu đã chuẩn hoá, cụm khớp tu_khoa của mục KB `bo_tri`). Thứ tự = ưu tiên.
_BO_TRI: list[tuple[str, str]] = [
    (r"mirror.{0,40}\b(bed|sleep\w*)\b|\b(bed|sleep\w*)\b.{0,30}mirror|wardrobe mirror", "guong doi dien giuong"),
    (r"mirror.{0,40}(front|main|entrance|door)|(front|main) door.{0,30}mirror|mirror (behind|beside) (the )?(cash|register|counter|till)",
     "guong chieu thang cua chinh"),
    (r"\bbeams?\b.{0,40}\b(bed|desk|sofa|over|above|overhead)\b|(bed|desk|sofa).{0,30}\bbeams?\b", "duoi xa ngang"),
    (r"(back|backs) (is |are )?(to|towards|toward|facing) (the )?(door|entrance)|(desk|chair|seat) faces the wall|"
     r"(boss|manager|someone|people|door) (s )?(desk )?(is |are )?behind me|sit\w* with my back|feel watched", "ngoi quay lung ra cua"),
    (r"(stove|hob|cooker|oven|kitchen fire).{0,40}(sink|fridge|refrigerator|washing machine|dishwasher|tap)|"
     r"(sink|fridge|refrigerator|washing machine|dishwasher).{0,40}(stove|hob|cooker|oven)|water vs fire|water and fire clash",
     "bep sat bon rua"),
    (r"(stove|hob|cooker|oven|kitchen).{0,30}(faces|facing|opposite|in line with|sees) (the )?(main |front )?(door|entrance)|"
     r"(front|main) door.{0,30}(stove|hob|cooker|kitchen)", "bep doi dien cua chinh"),
    (r"(toilet|bathroom|wc|lavatory|loo).{0,40}(above|over|on top of) (the )?(kitchen|stove)", "wc tren bep"),
    (r"(toilet|bathroom|wc|loo).{0,30}(centre|center|middle|heart) of (the )?(house|home|flat|apartment)", "wc o giua nha"),
    (r"(bedroom|bed room|room) door.{0,30}(toilet|bathroom|wc)|(toilet|bathroom|wc).{0,20}door.{0,30}(bedroom|bed room)",
     "cua phong ngu doi dien nha ve sinh"),
    (r"(toilet|bathroom|wc|loo).{0,40}(kitchen|stove)|(kitchen|stove).{0,40}(toilet|bathroom|wc|loo)", "bep doi dien nha ve sinh"),
    (r"(stair|staircase|stairs).{0,40}(front|main) door|(front|main) door.{0,40}(stair|staircase|stairs)", "cau thang doi dien cua chinh"),
    (r"(spiral |the )?(stair|staircase|stairs).{0,30}(middle|centre|center|heart) of|centre staircase", "cau thang o giua nha"),
    (r"(nursery|bedroom|cot|bed|room) .{0,30}(next to|beside|near|by|at the top of) (the )?(stair|stairs|staircase)|"
     r"(stair|stairs|staircase).{0,30}(bedroom|room) door", "phong ngu sat cau thang"),
    (r"(front|main) (door|entrance).{0,40}(back|rear) door|(back|rear) door.{0,40}(front|main) door|doors? (are )?in a straight line",
     "cua chinh doi dien cua sau"),
    (r"(door|entrance).{0,40}(balcony|window|glass)|see (straight )?(through|out) (to|the) (balcony|window)", "cua chinh thang ban cong"),
    (r"t ?-? ?junction|road (that )?(runs|points|leads|coming|heads) (straight )?(at|to|into|towards)|"
     r"road running (straight )?(into|at)|end of a (long |straight )?road", "duong dam thang vao nha"),
    (r"\bcrossroads?\b|intersection|junction", "nha o nga tu"),
    (r"pylon|power (pole|line|lines|tower)|electricity (pole|tower|pylon)|lamp ?post|utility pole|telegraph pole", "cot dien truoc cua"),
    (r"(big |large |huge )?tree.{0,30}(in front of|outside|opposite|blocking|directly front) (the |my |our )?(main |front )?(door|house|entrance)",
     "cay to truoc cua"),
    (r"(cemetery|graveyard|funeral home|funeral parlou?r|crematorium|mortuary)", "gan nghia trang"),
    (r"hospital", "gan benh vien"),
    (r"\b(temple|church|pagoda|shrine|mosque)\b", "gan chua"),
    (r"dead ?-? ?end|cul ?-? ?de ?-? ?sac|no through road", "nha o cuoi ngo cut"),
    (r"(lower than|below) (the )?(road|street)|step down into|sunken (house|living)", "nha thap hon mat duong"),
    (r"\b(dark|gloomy|damp|mou?ldy|mildew|musty|humid|water stains?|drip\w*|leak\w*)\b", "nha toi am moc"),
    (r"(no|without) (a |any )?(mountain|hill|backing|support) (at |behind )?|slope\w* (going )?(down )?behind|behind (it|the house) slopes?",
     "thanh long bach ho huyen vu"),
    (r"\b(water feature|fountain)\b", "be ca"),
    (r"\bl ?-? ?shaped\b|missing (a |the )?(\w+ )?corner|(irregular|odd) (shaped )?(floor ?plan|house)|u ?-? ?shaped", "nha chu l thieu goc"),
    (r"(sharp|pointed|pointy) (corner|edge|column|pillar)|poison arrow|(roof|corner|edge|building).{0,30}points? (right |straight )?at",
     "goc nhon chia vao nha"),
    (r"(triangle|triangular|irregular|odd ?shaped|wedge ?shaped) (\w+ )?(plot|land|lot|block|site)|plot of land", "manh dat tam giac"),
    (r"(wider|narrower) at the (back|front)|narrow (front|frontage)", "no hau"),
    (r"freeway|motorway|highway|expressway|busy (road|street)|main road|railway|train (line|tracks)|flyover|overpass", "sat duong cao toc"),
    (r"(previous|former|old) (owners?|tenants?)|second ?-? ?hand (house|home)|bought (an )?old (house|home)", "mua lai nha cu"),
    (r"(bedroom|room|bed).{0,30}(over|above) (the )?(garage|carport|car park)", "phong ngu tren gara"),
    (r"(bedroom|bed).{0,30}(over|above) (the )?(kitchen|stove)", "phong ngu tren bep"),
    (r"(bed|headboard|head).{0,30}(under|below|beneath|against) (a |the )?(window|skylight)|(window|skylight).{0,30}(above|over|behind) (my |the |our )?bed",
     "cua so sau dau giuong"),
    (r"(feet|foot).{0,30}(toward|towards|to|facing|point\w*) (the )?door|coffin position|"
     r"(bed|cot|crib).{0,40}(between|facing|in line with|opposite|next to) (the |two )?(door|doors|bedroom door)|door.{0,30}foot of the bed",
     "giuong ke thang cua phong"),
    (r"(plants?|pothos|flowers?|cactus|cacti|succulents?).{0,40}(bedroom|bed room)|(bedroom|bed room).{0,40}(plants?|pothos|flowers?)",
     "cay trong phong ngu"),
    (r"\b(aquarium|fish ?tank|koi|goldfish|fish pond)\b", "be ca"),
    (r"\b(safe|cash|money box|valuables|important papers|title deeds?)\b.{0,40}(keep|put|place|store|where)|"
     r"(keep|put|place|store|where).{0,40}\b(safe|cash|valuables|important papers)\b|best place for the safe", "ket sat"),
    (r"(air ?con|aircon|air conditioner|fan|ceiling fan).{0,30}(altar|shrine)|(altar|shrine).{0,30}(air ?con|fan)",
     "dieu hoa thoi ban tho"),
    (r"\b(altar|ancestor\w*|buddha shrine|family shrine)\b", "ban tho"),
    (r"\b(painting|paintings|artwork|picture|pictures|photos?|portrait|wedding photo)\b.{0,40}(hang|wall|above|over|behind|bedroom)|"
     r"(hang|hanging).{0,30}(painting|picture|photo|artwork)", "treo tranh"),
    (r"\bclocks?\b", "treo dong ho"),
    (r"\b(colou?r|colou?rs|paint|painted|red walls?|wall colou?r|sofa colou?r)\b", "mau son"),
    (r"\b(shop|store|cafe|caf|restaurant|salon|clinic|office|boutique|business premises|cashier|cash register|till|counter|reception|"
     r"signage|shop sign|jewell?ery shop|hardware store|co ?-? ?working|showroom)\b", "cua hang van phong"),
    (r"\b(desk|home office|study|work from home|wfh|workstation|chair)\b", "ban lam viec"),
    (r"\b(kids?|children|child|son|daughter|boys|girls|baby|nursery|cot|crib|bunk beds?|toddler)\b", "phong tre"),
    (r"\b(elderly|old|aging|ageing) (father|mother|parents?|dad|mum|mom)|grand(ma|pa|mother|father|parents)", "phong nguoi gia"),
    (r"\b(argu\w*|fight\w*|quarrel\w*|bicker\w*|tension)\b", "hay cai nhau"),
    (r"\b(single|love life|in love|find love|romance|romantic|relationship|marriage|married|partner|husband and i|wife and i|mandarin ducks?|"
     r"couple|ex|separate mattresses|peach blossom)\b", "phong ngu vo chong tinh duyen"),
    (r"\b(apartment|condo|condominium|flat|high ?-? ?rise|unit|hdb|studio)\b", "can ho chung cu"),
    (r"\bwell\b(?! (being|lit|ventilated|designed|kept|known|done|maintained))", "gieng cu"),
    (r"(cure|cures|remed\w*|soften|fix|counter|neutrali[sz]e|offset|mitigate).{0,40}(direction|facing|sector|corner)|"
     r"(bad|unlucky|wrong|worst) direction|(money|wealth) (plant|tree|vase|frog|cat)|laughing buddha|pi ?xiu|lucky (cat|charm)|"
     r"crystals?|worth buying|does (it|this|that|they) (really )?work", "hoa giai huong xau"),
]
_THUONG_NHO = r"(?:(?:my|our|the|this|a) )?"


def _chuan(cau: str) -> str:
    t = " " + (cau or "").lower().replace("’", "'").replace("‘", "'") + " "
    t = re.sub(r"(\d+(?:\.\d+)?) ?(?:°|degrees?|deg)\b", r" \1 do ", t)
    t = re.sub(r"(\w)'s\b", r"\1 s", t)
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    return " ".join(t.split())


def _huong(t: str, raw: str) -> list[str]:
    ds: list[tuple[int, str]] = []
    for m in re.finditer(r"\b(\d{1,3}(?:\.\d+)?) do\b", t):
        d = float(m.group(1))
        if 0 <= d < 360:
            ds.append((m.start(), _TAM[int((d + 22.5) // 45) % 8]))
    lam = t
    for mau, vn in _HUONG:
        for m in re.finditer(mau, lam):
            ds.append((m.start(), vn))
        lam = re.sub(mau, lambda x: "#" * len(x.group(0)), lam)
    # chữ cái đơn sau "face(s) / facing" hoặc trong danh sách hướng: "options face W, S, and NE"
    for m in re.finditer(r"\b(?:faces?|facing|face is|towards?)\s+((?:[nsew]\b[\s,]*(?:and\s+|or\s+)?)+)", (raw or "").lower()):
        for k in re.findall(r"\b([nsew])\b", m.group(1)):
            ds.append((m.start() + 1, _MOT_CHU[k]))
    ra: list[str] = []
    for _, vn in sorted(ds):
        if vn not in ra:
            ra.append(vn)
    return ra


def _nguoi(t: str) -> tuple[list[str], int | None, str | None]:
    """Năm sinh + giới của người hỏi, năm sinh vợ / chồng → cụm (`_nam_gioi`, `hieu_cau.nguoi_thu_hai` đọc)."""
    ra: list[str] = []
    gt = r"(male|female|man|woman|guy|girl|lady|gentleman|m|f)"
    nam = gioi = None
    m = (re.search(rf"\b((?:19|20)\d\d) (?:born )?{gt}\b", t) or re.search(rf"\b{gt} (?:born |b |b\. |born in |in )?((?:19|20)\d\d)\b", t)
         or re.search(r"\b(?:born|b|born in|i m|i am|im|me)\s+(?:in\s+)?(?:\w+\s+){0,2}((?:19|20)\d\d)\b", t))
    if m:
        so = [g for g in m.groups() if g and re.fullmatch(r"(19|20)\d\d", g)]
        gg = [g for g in m.groups() if g and not re.fullmatch(r"(19|20)\d\d", g)]
        nam = int(so[0]) if so else None
        if gg:
            gioi = "nu" if gg[0] in ("female", "woman", "girl", "lady", "f") else "nam"
    if not gioi:
        if re.search(r"\b(i m|i am|im) (a )?(woman|female|girl|lady|mum|mom|mother|wife)\b|\b(female|woman)\b(?!.{0,20}\b(daughter|wife|mum|mom)\b)", t):
            gioi = "nu"
        elif re.search(r"\b(i m|i am|im) (a )?(man|male|guy|dad|father|husband)\b|\b(male|man)\b", t):
            gioi = "nam"
    if nam:
        ra.append(("tôi nữ" if gioi == "nu" else "tôi nam" if gioi == "nam" else "tôi") + f" sinh {nam}")
    elif gioi:
        ra.append("tôi nữ" if gioi == "nu" else "tôi nam,")
    for vai, mau in (("chong", r"husband|hubby|hus|bf|boyfriend"), ("vo", r"wife|wifey|gf|girlfriend")):
        k = re.search(rf"\b(?:{mau})\b(?: s)?(?: is| was)?(?: born)?(?: in)?\s*((?:19|20)\d\d)", t) or \
            re.search(rf"\b((?:19|20)\d\d) (?:m|f|male|female)?\s*\(?(?:{mau})\b", t)
        if k:
            ra.append(f"{vai} toi sinh {k.group(1)}")
    return ra, nam, gioi


def gloss(cau: str) -> str:
    """Câu tiếng Anh → cụm từ khoá không dấu cho `phongthuy.phan_loai`. Câu gõ tiếng Việt → "" (đọc thẳng câu gốc)."""
    if en_gloss.la_cau_viet(cau):
        return ""
    t = _chuan(cau)
    if not tu_dien_kien_thuc(cau) and (gt := giai_thich_kien_thuc(cau)):
        return gt
    ra: list[str] = []
    nguoi, _nam, _gioi = _nguoi(t)
    ca_nhan = bool(re.search(r"\b(my|me|i|mine|myself|we|our|us|im|i m)\b", t))
    huong = _huong(t, cau)
    kua = re.search(r"\bkua(?: number| no)?(?: is| =| of| s)? ?(?:about |around |maybe )?([1-9])\b|\b([1-9]) kua\b", t)
    # vận / tinh bàn (Huyền Không)
    van = None
    k = re.search(r"\bperiod ([1-9])\b", t)
    if k:
        van = int(k.group(1))
    else:
        k = re.search(r"\b(built|completed|moved in|move in|constructed|finished)\b.{0,20}\b((?:18|19|20)\d\d)\b", t)
        if k:
            y = int(k.group(2))
            van = 1 + (y - 1864) // 20 if 1864 <= y < 2044 else None
    phi = re.search(r"\b(flying stars?|natal (chart|star)|base chart|mountain star|water star|facing star|sitting star|xuan kong|"
                    r"double (8|eight|9|nine)|period [1-9]|annual stars?|monthly (flying )?stars?|(5|five) yellow|wu huang|"
                    r"(2|two) black|illness star|sickness star|robbery star|(7|seven) red|(9|nine) purple|(8|eight) white|"
                    r"(1|one) white|(6|six) white|(3|three) jade|(4|four) green|quarrel\w* star|tai sui|grand duke|three killings|"
                    r"san sha|year breaker|\b2 5 combination|star [1-9]|[1-9] star|(which|what) stars?)\b", t)
    nam_moc = en_gloss._moc(t)
    co_nam = bool(nam_moc) or bool(re.search(r"\b(this|next|coming) year\b|\byear ahead\b", t))
    if re.search(r"\bnext year\b|\bcoming year\b", t):
        nam_moc = [x for x in nam_moc if x != "nam sau"] + ["nam sau"]
    elif re.search(r"\bthis year\b|\byear ahead\b", t):
        nam_moc = [x for x in nam_moc if x != "nam nay"] + ["nam nay"]
    nam_moc = [x for x in nam_moc if not x.startswith("luu nguyet")]
    # 1. phi tinh theo năm / vận
    if phi:
        tinh_ban = re.search(r"\b(natal|base chart|mountain star|water star|facing star|sitting star|period [1-9]|double|"
                             r"built|2 5 combination|xuan kong)\b", t) and not re.search(r"\b(annual|this year|next year|20\d\d)\b", t)
        if tinh_ban and huong:
            ra.append(f"huyen khong van {van or 9} huong {huong[0]}")
            return " ".join(ra)
        if tinh_ban:
            ra.append(f"huyen khong phi tinh van {van}" if van else "huyen khong phi tinh")
            return " ".join(ra)
        ra.append("phi tinh " + (" ".join(nam_moc) or "nam nay") + " sao nao phia nao nen tranh")
        if huong:
            ra.append(f"phia {huong[0]}")
        if re.search(r"\b(renovat\w*|dig\w*|construction|build\w*|pond|break ground|knock\w*|drill\w*)\b", t):
            ra.append("sua nha dong tho")
        return " ".join(ra)
    if re.search(r"\b(renovat\w*|dig|digging|construction|break ground|knock\w* (down|out)|demolish\w*|extension|build\w* (a |an |the |our |my )?"
                 r"(house|home|extension))\b", t) and co_nam:
        ra.append("sua nha " + (" ".join(nam_moc) or "nam nay") + " phia nao nen tranh dong")
        if huong:
            ra.append(f"phia {huong[0]}")
        return " ".join(ra + nguoi)
    # 2. âm trạch
    if re.search(r"\b(grave|graves|tomb|burial|bury|buried|ancestral (plot|tomb|grave)|cemetery plot|columbarium|niche)\b", t) and \
            not re.search(r"\b(behind|near|next to|across|opposite|view)\b", t):
        return "mo phan dat mo"
    # 2b. sức khoẻ theo năm → năm nên chú ý (SK-1), không phải tuổi làm nhà
    if re.search(r"\b(health|sick|ill|illness|sleep\w*)\b", t) and re.search(r"\b(year|years|when)\b", t):
        ra.append("suc khoe nam nao nen chu y")
        if huong:
            ra.append(f"phong ngu phia {huong[0]}")
        return " ".join(ra + nguoi)
    # 2c. tín ngưỡng / nghi lễ / phong thuỷ có cần không → giải thích chung
    if re.search(r"\b(christian|muslim|catholic|religio\w*|faith|bless\w*|ritual|ceremony)\b", t):
        return "phong thuy co khoa hoc co that khong"
    # 3. năm làm nhà / mua nhà / dọn nhà (tuổi làm nhà)
    if re.search(r"\b(good|right|best|lucky|auspicious) (year|time|month|date|day)s?\b|\bkim lau\b|\bwhich year\b|\bwhen should\b", t) and \
            re.search(r"\b(build|building|buy|buying|purchase|renovat\w*|move|moving|property|house|home|flat|apartment)\b", t):
        ra.append("xem tuoi lam nha " + (" ".join(nam_moc) or "nam nay"))
        return " ".join(ra + nguoi)
    # 4. Kua + hướng = mệnh quái hỏi chung
    if kua:
        so = int(kua.group(1) or kua.group(2))
        q = _KUA.get(so) or ("khon" if _gioi != "nu" else "can")
        if huong:
            ra.append(f"menh quai {q} huong {huong[0]}")
            if len(huong) > 1:
                ra.append(f"huong {huong[1]}")
            return " ".join(ra)
    # 5. du niên
    dn = [vn for mau, vn in _DU_NIEN if re.search(r"\b(?:" + mau + r")\b", t)]
    # 6. bố trí / dấu hiệu
    bt = []
    for mau, vn in _BO_TRI:
        if re.search(mau, t) and vn not in bt:
            bt.append(vn)
    # 7. vợ chồng khác nhóm / hai mệnh quái
    if re.search(r"\b(east|west) group\b.{0,60}\b(east|west) group\b|different (kua )?groups?|(husband|wife|partner|hubby).{0,40}"
                 r"(group|kua)|(group|kua).{0,40}(husband|wife|partner|hubby)|whose (direction|kua)|which of us", t):
        ra.append("vo chong toi hop huong nao")
        ra += nguoi
        if huong:
            ra.append(f"nha huong {huong[0]}")
        return " ".join(ra)
    # 8. hướng của nhà / vật + hợp tôi
    vat = None
    if re.search(r"\b(stove|hob|cooker|oven|stove knob|kitchen)\b", t):
        vat = "huong bep"
    elif re.search(r"\b(bed|sleep|sleeping|head (of|points|point)|headboard)\b", t):
        vat = "dau giuong quay huong"
    elif re.search(r"\b(desk|chair|sit|sitting|seat|work|study)\b", t):
        vat = "ban lam viec huong"
    elif re.search(r"\b(front door|main door|entrance|door)\b", t):
        vat = "cua chinh huong"
    hop = bool(re.search(r"\b(suit|suits|compatible|good or bad|good for me|bad for me|ok for me|okay for me|right for me|match|"
                         r"good match|rank|best|lucky|favou?rable|auspicious|worst|ideally|should|okay|ok|good)\b", t))
    nha_huong = bool(re.search(r"\b(house|home|flat|apartment|unit|condo|townhouse|place|property|door|units?|options?)\b.{0,25}"
                               r"\b(faces?|facing|face)\b|\b(faces?|facing)\b.{0,5}\b(house|home|flat)\b|-?facing (house|home|flat|unit)|"
                               r"facing direction|(house|home|flat|unit) (is )?(north|south|east|west)", t))
    if dn or kua:
        bt = [x for x in bt if x not in ("ban lam viec", "phong tre", "cua hang van phong", "can ho chung cu")]
    if kua and not huong and not dn:
        ra.append("cung phi cua toi huong tot huong xau")
    if dn:
        ra.append(" ".join(dn) + (" cua toi la huong nao co xau khong hop voi toi" if ca_nhan else " la gi y nghia"))
    if re.search(r"\b(lucky|good|best|favou?rable|auspicious|bad|unlucky|worst|four|4) directions?\b|\bmy directions\b|"
                 r"\bkua (number|no)?\b|\b(east|west) group\b", t) and not bt:
        ra.append(("cung phi cua toi huong tot huong xau" if ca_nhan or nguoi else "cung phi la gi"))
    if huong:
        if nha_huong and not vat:
            ra.append(f"nha huong {huong[0]}" + (" co hop voi toi khong" if (ca_nhan or nguoi) else ""))
            for h in huong[1:3]:
                ra.append(f"huong {h}")
        elif vat:
            ra.append(f"{vat} {huong[0]}" + (" hop voi toi" if ca_nhan or nguoi else ""))
        else:
            ra.append(f"phia {huong[0]}")
    elif vat and hop and not bt and not dn and re.search(r"\b(direction|face|facing|point|points|which way|toward|towards)\b", t):
        ra.append(f"{vat} nao hop voi toi")
    ra += bt
    # 9. nỗi lo theo mảng (CY-1)
    if re.search(r"\b(money|wealth|finances?|financial\w*|income|savings|cash flow|rich|prosper\w*|cash|side hustle|hustle)\b", t) and \
            not any(x == "ket sat" for x in bt):
        ra.append("tien bac co nen chu y")
    if re.search(r"\b(health|sick|ill|illness|sleep\w*|insomnia|tired|colds?|energy)\b", t) and \
            not re.search(r"\b(illness|sickness) star\b", t):
        ra.append("suc khoe")
    if re.search(r"\b(promotion|career|job|business (has been )?slow|clients?|customers?)\b", t):
        ra.append("cong viec co nen chu y")
    ra += [x for x in nam_moc if x not in " ".join(ra)]
    if not ra and re.search(r"\b(directions?|facing|face)\b", t) and (ca_nhan or nguoi):
        ra.append("huong nao hop voi toi")
    if not ra and re.search(r"\b(house|home|flat|apartment|room|feng shui)\b", t) and ca_nhan:
        ra.append("nha toi")
    if ca_nhan and ra and not any("toi" in x for x in ra):
        ra.append("cua toi")
    ra = nguoi + ra
    return " ".join(dict.fromkeys(ra))


# ------------------------------------------------------------------ câu kiến thức → mã từ điển
_TU_DIEN: list[tuple[str, str]] = [
    (r"kua (number|no)|life gua|ming gua|personal trigram", "menh_quai"), (r"east group", "dong_tu_menh"),
    (r"west group", "tay_tu_menh"), (r"eight mansions?|ba ?zhai|8 mansions", "bat_trach"),
    (r"sheng ?qi", "sinh_khi"), (r"tian ?yi", "thien_y"), (r"yan ?nian", "dien_nien"), (r"fu ?wei", "phuc_vi"),
    (r"jue ?ming", "tuyet_menh"), (r"wu ?gui", "ngu_quy"), (r"liu ?sha", "luc_sat_phongthuy"), (r"huo ?hai", "hoa_hai"),
    (r"(eight|8) (mansions )?directions|du nian", "du_nien"), (r"sitting direction|sitting side", "toa"),
    (r"facing direction|facing of (a|the) house|find the facing|determine the facing", "huong"),
    (r"(24|twenty ?four) mountains", "24_son"), (r"luopan", "24_son"),
    (r"flying stars?|xuan kong|xuankong", "huyen_khong"), (r"\bperiod (8|9|eight|nine)\b|what is period|\bperiods?\b", "van"),
    (r"nine stars|9 stars", "cuu_tinh"), (r"mountain star", "son_tinh"), (r"water star", "huong_tinh"),
    (r"annual (flying )?stars?|(5|five) yellow|wu huang|annual star", "luu_nien_phi_tinh"),
    (r"double (8|eight|9|nine) at the facing|double facing", "song_tinh_dao_huong"),
]
_KIEN_THUC = re.compile(r"\bwhat (is|are|does|do|s)\b|\bwhats\b|\bmeaning\b|\bmean\b|\bexplain\b|\bdefine\b|\bhow (is|are|do|does) .{0,40}"
                        r"(calculated|work|move|find|determined|different)\b|\bdifference\b|\bwhy (is|are|do|does)\b|\bin simple terms\b|"
                        r"\bhistor\w*\b|\bcome from\b|\bwhere does\b|\bis .{0,30}(same|backed|science|scientific|religious)\b|"
                        r"\bdo i need\b|\bwhat .{0,20}(represent|represents)\b")


def tu_dien_kien_thuc(cau: str) -> list[str]:
    """Mã từ điển cho câu KIẾN THỨC thuần tiếng Anh (không "my / me / I" về nhà mình). Không phải → []."""
    t = _chuan(cau)
    if not _KIEN_THUC.search(t) or re.search(r"\b(my|me|our|we|i m|im)\b|\bi\b(?! (need|do))", t) or \
            re.search(r"\b(19|20)\d\d\b|\b(this|next) year\b", t):
        return []
    ma: list[str] = []
    for mau, m in _TU_DIEN:
        if re.search(mau, t) and m not in ma:
            ma.append(m)
    return ma[:2]


# Giải thích chung KB (`giai_thich`) cho câu kiến thức tiếng Anh không có thuật ngữ từ điển
_GIAI_THICH_EN: list[tuple[str, str]] = [
    (r"science|scientific|backed|real|work really|actually work|superstition", "co khoa hoc"),
    (r"form school|compass school|landform|celestial animals|four animals|green dragon|white tiger", "loan dau va ly khi"),
    (r"kitchen|three essentials|door.{0,20}stove", "tam yeu"),
    (r"bagua|black hat|btb", "bat trach la gi"),
    (r"compass|phone|measure", "la ban dien thoai do huong"),
    (r"different groups?|couple|husband|wife|partner", "vo chong khac menh"),
]


def giai_thich_kien_thuc(cau: str) -> str:
    t = _chuan(cau)
    if not _KIEN_THUC.search(t) or re.search(r"\b(my|me|our|we|i m|im)\b|\bi\b(?! (need|do))", t):
        return ""
    for mau, vn in _GIAI_THICH_EN:
        if re.search(r"\b(?:" + mau + r")\b", t):
            return vn
    return ""
