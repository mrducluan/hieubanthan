// EN-ALL GĐ 3d — chữ máy chủ của TRANG CÔNG CỤ bản Anh (rewrite của trang Việt, cùng component): SEO, H1/lời dẫn, "Quick
// answer", phần "About this tool" + câu hỏi thường gặp (FAQPage), breadcrumb. Bản Việt giữ ở lib/so-trang.ts (+ CMS). Chưa
// có CMS tiếng Anh (GĐ 10) → chữ ở đây là chữ duy nhất của bản Anh; viết từ nghĩa, không dịch sát, không lời hứa "accurate".
// Mỗi trang công cụ mở bản Anh (cờ `mo` trong lib/duong-en.json) PHẢI có một mục ở đây — e2e/en-bazi.spec.ts kiểm.

export type TrangCongCuEn = {
  /** Tên ngắn (breadcrumb, JSON-LD). */ ten: string;
  /** <title> tuyệt đối (≤ 70 ký tự, gồm thương hiệu). */ tieu_de_seo: string;
  /** meta description (≤ 160 ký tự). */ mo_ta_seo: string;
  tra_loi_nhanh: { hoi: string; dap: string; lien_ket?: { href: string; ten: string }[] };
  gioi_thieu: { tieu_de: string; doan: string[]; hoi_dap_tieu_de: string; hoi_dap: { hoi: string; dap: string }[];
    /** "Read more" — chỉ URL /en đã mở (lọc lúc hiện). */ doc_them?: { tieu_de: string; lien_ket: { href: string; ten: string }[] } };
  /** Khối "Learn …" — tiêu đề + tên / mô tả từng cụm kiến thức (chỉ hiện cụm đã mở bản Anh). */
  kien_thuc?: { tieu_de: string; cum: Record<string, { ten: string; mo_ta: string }> };
};

/** EN-ALL GĐ 3d — chữ máy chủ của TRANG CỤM KIẾN THỨC bản Anh (rewrite của trang cụm Việt `TrangChuDe`), khoá = đường dẫn
 *  cụm Việt. `ten` + `mo_ta` cũng là thẻ cụm trong khối "Learn …" của trang công cụ. `tra_loi`: `{so}` = số trang của cụm
 *  (đếm từ engine). Cụm mở bản Anh (cờ `mo`) PHẢI có mục ở đây — e2e/en-bazi.spec.ts kiểm. */
export type CumEn = { ten: string; h1: string; tieu_de_seo: string; mo_ta: string; tra_loi: string };
export const CUM_EN: Readonly<Record<string, CumEn>> = {
  "/bat-tu/thap-than": {
    ten: "The Ten Gods", h1: "The Ten Gods in BaZi",
    tieu_de_seo: "The Ten Gods in BaZi: meaning of all ten relationships · Hieuban",
    mo_ta: "What each of the ten relationships to your Day Master means, from Friend to Direct Resource: traits, and what happens when there is too much or too little.",
    tra_loi: "The Ten Gods are the ten ways every other stem in a BaZi chart relates to your Day Master, the stem of your birth day: the same element (Friend, Rob Wealth), the element you produce (Eating God, Hurting Officer), the element you control (Indirect and Direct Wealth), the element that controls you (Seven Killings, Direct Officer) and the element that produces you (Indirect and Direct Resource). This section has {so} pages, one for each.",
  },
  "/bat-tu/nhat-chu": {
    ten: "The ten Day Masters", h1: "The ten Day Masters in BaZi",
    tieu_de_seo: "The ten Day Masters in BaZi: Jia Wood to Gui Water · Hieuban",
    mo_ta: "The person behind each Day Master, from Jia (Yang Wood) to Gui (Yin Water): image, strengths, blind spots and how the birth season changes them.",
    tra_loi: "Your Day Master is the Heavenly Stem of your birth day, the element that stands for you in a BaZi chart. There are ten: Yang and Yin of Wood, Fire, Earth, Metal and Water. This section has {so} pages, one per Day Master: its image in nature, its strengths and blind spots, and how it feels in each season of birth.",
  },
  "/bat-tu/menh-theo-nam": {
    ten: "Element by birth year", h1: "Your element by birth year",
    tieu_de_seo: "Element by birth year 1950–2027: Na Yin and zodiac sign · Hieuban",
    mo_ta: "The Na Yin element of every birth year from 1950 to 2027: stem and branch, zodiac sign, matching and clashing signs, Kua number, and the Lunar New Year cut-off.",
    tra_loi: "Your birth-year element is the Na Yin element of the year's stem and branch, counted by the lunar year (from Lunar New Year), such as Great Forest Wood for 1988. It is not the same as your element in BaZi, which comes from your birth day. This section has {so} pages, one per year: stem and branch, zodiac sign, Na Yin meaning, signs that match or clash, and the Kua number for men and women.",
  },
  "/tu-vi/chinh-tinh": {
    ten: "The 14 main stars", h1: "The 14 main stars of Zi Wei Dou Shu",
    tieu_de_seo: "The 14 main stars of Zi Wei Dou Shu: nature and meaning · Hieuban",
    mo_ta: "Zi Wei, Tian Ji, Tai Yang and the other main stars: element, strengths, blind spots, how each behaves bright or dim, and what it means in the 12 palaces.",
    tra_loi: "Zi Wei Dou Shu reads a chart mainly through 14 main stars, from Zi Wei (the Emperor) to Po Jun (the Breaker). Each has an element and a character, shows its best side when bright and its harder side when dim, and colours whichever palace it sits in. This section has {so} pages, one for each main star.",
  },
  "/tu-vi/cung": {
    ten: "The 12 palaces", h1: "The 12 palaces of a Zi Wei Dou Shu chart",
    tieu_de_seo: "The 12 palaces of Zi Wei Dou Shu: what each one covers · Hieuban",
    mo_ta: "The Life, Wealth, Career, Spouse and other palaces of a Zi Wei Dou Shu chart: what area of life each covers, and how each main star changes it.",
    tra_loi: "A Zi Wei Dou Shu chart is a ring of 12 palaces, each standing for one area of life: the Life Palace for who you are, then Siblings, Spouse, Children, Wealth, Health, Travel, Friends, Career, Property, Fortune and Parents. Each palace is read together with its triad and the palace opposite it. This section has {so} pages, one per palace.",
  },
  "/tu-vi/sao-o-cung": {
    ten: "Main star in each palace", h1: "Each main star in each of the 12 palaces",
    tieu_de_seo: "Zi Wei Dou Shu: each main star in each of the 12 palaces · Hieuban",
    mo_ta: "One page for each of the 14 main stars in each of the 12 palaces: meaning, brightness by branch, the stars that share or face it, and its transformations.",
    tra_loi: "The same star reads differently depending on the palace it sits in: Zi Wei in the Life Palace speaks about how you lead your own life, in the Career Palace about how you work. This section has {so} pages, one for each of the 14 main stars in each of the 12 palaces, with the brightness by branch, the stars that sit with it or face it, and which birth years transform it.",
  },
  "/tu-vi/tu-hoa": {
    ten: "Four Transformations by palace", h1: "The Four Transformations in the 12 palaces",
    tieu_de_seo: "Hua Lu, Quan, Ke and Ji in the 12 palaces of Zi Wei Dou Shu · Hieuban",
    mo_ta: "What Hua Lu (prosperity), Hua Quan (power), Hua Ke (fame) and Hua Ji (obstacle) mean in each of the 12 palaces, and which birth years bring each one.",
    tra_loi: "The Four Transformations are four changes the year's Heavenly Stem makes to four stars: Hua Lu (prosperity), Hua Quan (power), Hua Ke (fame) and Hua Ji (obstacle). Where they land shows where life flows easily and where it asks for care. This section has {so} pages, one for each transformation in each of the 12 palaces, with the birth years that bring it.",
  },
  "/tu-vi/la-so-mau": {
    ten: "Sample charts", h1: "Sample Zi Wei Dou Shu charts, read step by step",
    tieu_de_seo: "Sample Zi Wei Dou Shu charts read step by step · Hieuban",
    mo_ta: "Six illustrative Zi Wei Dou Shu charts read in order: Life Palace, main stars, brightness, triad, patterns, transformations, 10-year periods, the year.",
    tra_loi: "Each chart is a typical kind of Zi Wei Dou Shu chart, read in the order a reader usually follows: the Life Palace, its main stars, the triad and opposite palace, patterns, the Four Transformations, then the 10-year periods and the year. Every term comes with a plain-English explanation. This section has {so} charts.",
  },
  "/tu-vi/co-thu": {
    ten: "Classical texts", h1: "Classical texts of Zi Wei Dou Shu",
    tieu_de_seo: "Classical texts of Zi Wei Dou Shu: Chinese, pinyin, meaning · Hieuban",
    mo_ta: "Old verses of Zi Wei Dou Shu in the original Chinese with pinyin and a plain-English editorial translation, and what each line means on a real chart.",
    tra_loi: "The rules of Zi Wei Dou Shu were handed down as short verses in classical Chinese. This section gives the original text with pinyin, a plain-English translation by our editorial team, and what each line means when you read a chart. It has {so} page(s).",
  },
  "/kinh-dich/que": {
    ten: "The 64 hexagrams", h1: "The 64 hexagrams of the I Ching",
    tieu_de_seo: "The 64 I Ching hexagrams: meaning, lines and judgement · Hieuban",
    mo_ta: "All 64 I Ching hexagrams: the judgement and six line texts in the original Chinese, with a plain-English meaning and how each reads for your question.",
    tra_loi: "The I Ching (Book of Changes) has 64 hexagrams, each made of six lines that are either solid (yang) or broken (yin). This section has {so} page(s): for each hexagram, the judgement and the six line texts in the original Chinese, a translation, a plain-English meaning, and how it tends to read when you ask about work, money, love or a decision.",
  },
  "/phong-thuy/dau-hieu": {
    ten: "Home feng shui signs", h1: "Common feng shui signs in the home",
    tieu_de_seo: "Feng shui home signs: what they mean and what to do · Hieuban",
    mo_ta: "The home signs feng shui often mentions — a mirror facing the bed, a beam over the bed, doors in a line — what the old books say, and fixes that cost nothing.",
    tra_loi: "These are {so} signs inside and around a home that feng shui often talks about: a door facing a door, a stove facing the bathroom, stairs in the middle of the house, a bed under a beam, and more. Each page says what the sign is, what the old books and folk tradition say, how it looks through everyday life (light, air, noise, safety), and what you can do about it, starting with fixes that cost nothing.",
  },

};

export const SO_TRANG_EN: Readonly<Record<string, TrangCongCuEn>> = {
  "/bat-tu": {
    ten: "BaZi (Four Pillars)",
    tieu_de_seo: "Free BaZi calculator: Four Pillars chart and five elements · Hieuban",
    mo_ta_seo: "Free BaZi (Four Pillars of Destiny) calculator: see which of the five elements you lack, your Day Master, the Useful God read two ways and your 10-year luck.",
    tra_loi_nhanh: {
      hoi: "What does this BaZi calculator give you?",
      dap: "From your birth date, time and place it sets up the four pillars by the solar terms, scores the five elements so you can see which are strong and which are thin, shows the Useful God read two ways and your 10-year Luck Pillars, then explains each area of life in plain words. The chart and the full reading are free.",
      lien_ket: [{ href: "/en/bazi/element-by-birth-year", ten: "Element by birth year" }, { href: "/en/bazi/ten-gods", ten: "The Ten Gods" }],
    },
    gioi_thieu: {
      tieu_de: "About the BaZi calculator",
      doan: [
        "Someone told you that you lack Water, so you should wear this or place that? Before adding anything, it helps to know what you actually lack. This page sets up your four pillars from your birth date and time, scores the five elements on a published scale, and shows which elements are in excess, which are thin, and whether your own energy runs strong or weak. Lacking an element does not always mean you should add exactly that element.",
        "A common mix-up: the element tied to your birth year (such as “Sea Metal” or “Furnace Fire”) is not your element in BaZi. BaZi takes your element from the Heavenly Stem of your birth day, so two people born in the same year can have different elements. The detailed chart still shows the year element so you can compare it with what you have heard.",
        "There are several ways to find the element that balances a chart. This page shows the two most common ones, says clearly when they disagree, and does not choose for you. When they disagree, “Which reading fits you?” lets you describe a few past years as smooth or hard and compare for yourself. The reading is cultural reference; decisions stay with you. This page does not recommend or sell any objects.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "Which element am I missing, and how do I balance it?", dap: "The reading has a five-bar chart showing which elements are in excess and which are thin. Lacking an element does not always mean adding exactly that element — it depends on whether your own energy is strong or weak. The suggestions are about habits, for example a person thin in Metal may find it hard to say “no”, so a short daily task list helps." },
        { hoi: "What are BaZi and the Four Pillars?", dap: "BaZi means “eight characters”: the stem and branch of your birth year, month, day and hour. Each stem–branch pair is one pillar, so there are four pillars. From these eight characters, the old books look at how much Metal, Wood, Water, Fire and Earth there is, and where your own element — the Day Master, taken from the stem of your birth day — stands among them." },
        { hoi: "What is the Useful God, and why are there two methods?", dap: "The Useful God is the element that brings the chart into better balance. The books give several ways to find it; this page shows two common ones: balancing strength (also weighing heat and cold by birth season) and following the birth month. Sometimes they agree, sometimes not. When they differ, “Which reading fits you?” helps you compare them with your own past years." },
        { hoi: "Can I use it without knowing my birth time?", dap: "Yes, with limits. Choose “I do not know” and the chart uses 12:00 for now and says so. The year, month and day pillars are usually complete, so your element normally does not change unless you were born on the day a solar term or the Start of Spring begins; parts that rely on the hour pillar, such as the element balance, children and later life, are only a rough guide." },
        { hoi: "How are the year and day counted near Lunar New Year or at 23:00?", dap: "In BaZi the year changes at the Start of Spring (around 4 February), not on Lunar New Year, and each month changes at its solar term. If you were born 23:00–23:59, the default keeps that day and takes the next day's Zi hour for the hour pillar; under “Schools and options” you can switch to starting the new day at 23:00." },
        { hoi: "I was born outside Vietnam. Is the time handled correctly?", dap: "Pick your country and city: the time zone and any daylight saving time at your birth are worked out from that place's history, and the chart uses your local clock time. Born in the Southern Hemisphere, you can also choose to read the climate element by the actual season where you were born." },
        { hoi: "Is it free? How reliable is it?", dap: "The calculation is fixed: the same birth details always give the same four pillars and the same five-element chart. The chart and the full reading are free in English. The reading is cultural reference, not a prediction; each box has a “Resonates with me / Not quite me” button so you can judge it yourself." },
        { hoi: "Is my birth data stored?", dap: "By default your profile stays only on your device; no account is needed. Your birth details pass through one calculation and are then discarded — they are not sent to third parties." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/numerology", ten: "Numerology from your name and birth date" },
        { href: "/en/tarot", ten: "Tarot reading" },
        { href: "/en/tarot/cards", ten: "Meaning of the 78 tarot cards" },
      ] },
    },
    kien_thuc: {
      tieu_de: "Learn BaZi",
      cum: Object.fromEntries(["/bat-tu/thap-than", "/bat-tu/nhat-chu", "/bat-tu/menh-theo-nam"]
        .map((d) => [d, { ten: CUM_EN[d]!.ten, mo_ta: CUM_EN[d]!.mo_ta }])),
    },
  },
  "/tu-vi": {
    ten: "Zi Wei Dou Shu",
    tieu_de_seo: "Free Zi Wei Dou Shu chart: 12 palaces and your reading · Hieuban",
    mo_ta_seo: "Free Zi Wei Dou Shu (Purple Star Astrology) chart from your birth date, time and place: 12 palaces, 10-year periods, this year and the next 3 months.",
    tra_loi_nhanh: {
      hoi: "What does this Zi Wei Dou Shu calculator give you?",
      dap: "Enter your birth date, time, sex and birthplace and you get a 12-palace Zi Wei Dou Shu chart set up by the Vietnamese lunar calendar, with a life reading area by area: character, work, money, love, health, your 10-year periods, this year and the next three months. The chart and the full reading are free, with no account needed.",
      lien_ket: [{ href: "/en/zi-wei-dou-shu/stars", ten: "The 14 main stars" }, { href: "/en/zi-wei-dou-shu/sample-charts", ten: "How to read a chart" }],
    },
    gioi_thieu: {
      tieu_de: "About the Zi Wei Dou Shu calculator",
      doan: [
        "Enter your birth date and time, your sex and your birthplace (a Vietnamese province, or your country and city if you were born abroad). The 12-palace chart appears straight away, set up by the Vietnamese lunar calendar, with historical clock changes handled; if you were born abroad it uses the local time where you were born. Tap any palace to see its stars, how bright each star is, and a page on each star.",
        "Zi Wei Dou Shu (Purple Star Astrology) places more than a hundred stars into twelve palaces, each for one area of life. The reading on this page turns that into plain words: what tends to go well, what needs care and what you can do, for each area, then for your 10-year periods, this year and the next three months. Technical terms stay in the “Why we say this” notes.",
        "Different schools set up some parts of a chart differently: the lunar calendar used, the brightness table, how Huo Xing and Ling Xing are placed, leap months and monthly periods. The defaults follow the Vietnamese method; under “Display” you can switch and see whether your chart changes. The reading is cultural reference, not a prediction; decisions stay with you.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "What is Zi Wei Dou Shu?", dap: "Zi Wei Dou Shu, often called Purple Star Astrology, is a Chinese system that places stars into twelve palaces from your lunar birth date and hour. Each palace stands for one area of life, such as self, wealth, career or relationships, and the stars in it and around it colour how that area tends to go." },
        { hoi: "What do I need to enter?", dap: "Your birth date, birth time, sex and birthplace. The hour matters a lot: each two-hour period gives a different chart. Your sex sets the direction of the 10-year periods, and your birthplace turns the time into the right local clock time at your birth." },
        { hoi: "Can I use it without knowing my birth time?", dap: "Yes, with limits. Choose “I do not know” and the chart is set up for now at 12:00, clearly marked. The “Find your birth hour” panel lets you compare all twelve two-hour periods with years you remember clearly, then correct the time yourself." },
        { hoi: "Why does my chart differ from another website?", dap: "Mostly because of the calendar and the school. Vietnamese and Chinese lunar calendars occasionally differ by a day or a month, and schools differ on brightness, a few star placements and leap months. Open “Display” to see which options this page uses and switch them." },
        { hoi: "What are the 10-year periods and the annual layer?", dap: "Every ten years the chart's focus moves to another palace — that is your 10-year period. Each year also has its own palace. Turn on the layers to highlight both on the chart, or tap a period in the strip under the chart to jump to its first year." },
        { hoi: "Is it free? Is my data stored?", dap: "The chart and the full reading are free in English. By default your profile stays only on your device; your birth details pass through one calculation and are then discarded. The reading is cultural reference, not advice or a prediction." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/bazi", ten: "BaZi (Four Pillars) calculator" },
        { href: "/en/numerology", ten: "Numerology from your name and birth date" },
        { href: "/en/tarot", ten: "Tarot reading" },
      ] },
    },
    kien_thuc: {
      tieu_de: "Learn Zi Wei Dou Shu",
      cum: Object.fromEntries(["/tu-vi/la-so-mau", "/tu-vi/chinh-tinh", "/tu-vi/cung", "/tu-vi/sao-o-cung", "/tu-vi/tu-hoa", "/tu-vi/co-thu"]
        .map((d) => [d, { ten: CUM_EN[d]!.ten, mo_ta: CUM_EN[d]!.mo_ta }])),
    },
  },
  "/phong-thuy": {
    ten: "Feng shui",
    tieu_de_seo: "Free feng shui home reading: Kua number and directions · Hieuban",
    mo_ta_seo: "Free feng shui home reading: find your Kua number and good directions, take your home's direction with your phone, and see what to place where, room by room.",
    tra_loi_nhanh: {
      hoi: "What does this feng shui tool give you?",
      dap: "From your birth year and sex it finds your Kua number and your four good directions. Take your home's direction with your phone compass, a map or by typing degrees, and you get a plain-English reading: how the home sits with you, what to place in each room, which signs to deal with first, and which months suit repairs. It is free and never sells “cure” objects.",
      lien_ket: [{ href: "/en/feng-shui/home-signs", ten: "Common home signs" }],
    },
    gioi_thieu: {
      tieu_de: "About the feng shui tool",
      doan: [
        "This page uses two classical schools of home feng shui. Eight Mansions (Ba Zhai) looks at your Kua number — from your birth year and sex — and the direction your home faces, and sorts the eight directions into four that suit you and four that are weaker. Flying Stars (Xuan Kong) looks at the year a home was built or you moved in and its direction, and shows how the energy of each side changes by year and by month.",
        "Form comes first: what you can actually see — a road pointing at the door, a beam over the bed, a bathroom in the middle of the house — matters more than any star. If you confirm a major sign, the reading caps the related part at Balanced until you mark it as dealt with. Every suggestion starts with things that cost nothing: moving the bed, turning the desk, changing how a room is used.",
        "Different books start the year on different dates when working out the Kua number. The default is the Start of Spring (around 4 February); under “Schools and options” you can switch to Lunar New Year and see whether it changes anything for you. The reading is cultural reference for arranging your home more sensibly, not a prediction about health or money.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "What is a Kua number?", dap: "Your Kua number (also called your life trigram) comes from your birth year and sex. It places you in the East or West group and gives you four good directions — Sheng Qi, Tian Yi, Yan Nian and Fu Wei — and four weaker ones. The year is counted from the Start of Spring by default, so if you were born in January or early February, check the Schools and options panel." },
        { hoi: "How do I find which way my home faces?", dap: "Stand at the front door with your back to the house, hold your phone flat and take the compass reading. In an apartment, measure at the balcony or largest window. If the compass is unreliable, you can pick the centre of the home and a point in front of it on a map, or type the degrees from a real compass." },
        { hoi: "My home doesn't face one of my good directions. What should I do?", dap: "That is very common, and moving house is not the answer. Eight Mansions suggests making up for it inside: put the head of the bed, your desk and the stove's control side toward your good directions where you can. The reading lists these room by room, starting with changes that cost nothing." },
        { hoi: "What are Flying Stars, and do I need them?", dap: "Flying Stars works from the year your home was built (or you moved in) and its exact direction. It shows which sides are lively and which are better kept quiet in a given year or month — useful mainly for timing repairs. If you don't know the year, the rest of the reading still works." },
        { hoi: "Do I need to buy anything to fix bad feng shui?", dap: "No. This page never recommends or sells objects to “cure” anything. Light, fresh air, safe walkways and a layout that suits how you live matter more than direction. Every suggestion starts with what you can do for free." },
        { hoi: "Is my data stored?", dap: "Your profile and home details stay on your device by default; no account is needed. Birth details and home directions pass through one calculation and are then discarded. Coordinates you paste or pick on a map are only used to work out the angle." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/bazi", ten: "BaZi (Four Pillars) calculator" },
        { href: "/en/zi-wei-dou-shu", ten: "Zi Wei Dou Shu chart" },
        { href: "/en/numerology", ten: "Numerology from your name and birth date" },
      ] },
    },
    kien_thuc: {
      tieu_de: "Learn feng shui",
      cum: Object.fromEntries(["/phong-thuy/dau-hieu"].map((d) => [d, { ten: CUM_EN[d]!.ten, mo_ta: CUM_EN[d]!.mo_ta }])),
    },
  },
  "/kinh-dich": {
    ten: "I Ching",
    tieu_de_seo: "Free I Ching reading: cast a hexagram for one question · Hieuban",
    mo_ta_seo: "Free I Ching reading: ask about one matter, cast three coins six times, and get a plain-English answer with the hexagram, changing lines and original text.",
    tra_loi_nhanh: {
      hoi: "How does this online I Ching reading work?",
      dap: "Write the matter you are unsure about, then cast three coins six times. The page builds your hexagram, its changing lines and the hexagram it changes into — out of the 64 hexagrams and 384 lines — and answers your question in plain English, with the original text alongside. The hexagram is something to weigh, not a decision made for you.",
      lien_ket: [{ href: "/en/i-ching/hexagrams", ten: "Meaning of the 64 hexagrams" }],
    },
    gioi_thieu: {
      tieu_de: "About the I Ching reading",
      doan: [
        "Unsure about one thing — taking an offer, moving house, opening a shop, getting back in touch with someone? Cast one hexagram and get a short answer in plain words: whether the matter is flowing or needs a different approach, and what to do this week. The hexagram can be cast by the computer, by the hour, by two numbers or a direction you choose (Plum Blossom), or with real coins that you enter yourself — no step picks the hexagram for you.",
        "The reading covers the primary hexagram, the changing lines and the resulting hexagram, and quotes the Book of Changes in the original Chinese (the judgement, the line texts and the Commentary on the Judgement) with a translation and a plain explanation. Each reading also notes the downside and gives you a question to reflect on.",
        "If you ask the same thing again within a short time, the page reminds you, in the spirit of hexagram 4 (Youthful Folly): asking again and again muddies the answer. The reading is cultural reference; decisions stay with you.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "How should I ask the I Ching a question?", dap: "Ask about one specific matter that depends on your own choice, ideally with a time frame — for example, whether to accept this job offer this quarter. Avoid yes/no questions about fate, and avoid putting several options into one question." },
        { hoi: "What is the difference between the casting methods?", dap: "The computer casting simulates three coins; Plum Blossom builds the hexagram from the lunar year, month, day and hour of asking (or from two numbers or a direction you pick); casting by hand means you toss real coins and enter the results. The hexagram is read the same way whichever method you use." },
        { hoi: "What are changing lines?", dap: "When all three coins land the same way, that line is “moving” — it is where the matter is changing. Flip those lines and you get the resulting hexagram, which shows where things are heading." },
        { hoi: "What if no lines are changing?", dap: "Then the main text is the judgement of the hexagram itself, with the Commentary on the Judgement translated alongside." },
        { hoi: "Why are there three ways of reading the same hexagram?", dap: "Different schools read a hexagram differently: Meaning and Principle reads the classic text, Plum Blossom weighs the trigrams against each other, and Six Lines (Na Jia) looks at the line that stands for your matter and how the day and month support it. The page says which one leads your answer and keeps the other two folded below." },
        { hoi: "Is it free? Is my question stored?", dap: "The I Ching reading is free in English. Your question passes through one reading and is not stored on our side; the list of hexagrams you have cast stays only on your device, and you can delete it at any time." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/bazi", ten: "BaZi (Four Pillars) calculator" },
        { href: "/en/zi-wei-dou-shu", ten: "Zi Wei Dou Shu chart" },
        { href: "/en/tarot", ten: "Tarot reading" },
      ] },
    },
    kien_thuc: {
      tieu_de: "Learn the I Ching",
      cum: Object.fromEntries(["/kinh-dich/que"].map((d) => [d, { ten: CUM_EN[d]!.ten, mo_ta: CUM_EN[d]!.mo_ta }])),
    },
  },
};

export const trangCongCuEn = (duongVi: string): TrangCongCuEn | null => SO_TRANG_EN[duongVi] ?? null;

export const cumEn = (duongVi: string): CumEn | null => CUM_EN[duongVi] ?? null;
