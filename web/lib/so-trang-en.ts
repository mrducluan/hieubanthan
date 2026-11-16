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
  "/than-so/y-nghia-so": {
    ten: "Numbers 1–9, 11, 22, 33", h1: "What each number means in numerology",
    tieu_de_seo: "Numerology numbers 1–9, 11, 22, 33: meaning and shadow side · Hieuban",
    mo_ta: "What numbers 1 to 9 and the master numbers 11, 22 and 33 mean in Pythagorean numerology: keywords, strengths, shadow side and a question to ask yourself.",
    tra_loi: "In Pythagorean numerology every core number (Life Path, Expression, Soul Urge, Personality) reduces to 1–9, except the master numbers 11, 22 and 33, which are kept. Each number is a set of tendencies to check against yourself, with a shadow side and a counter-question, never a verdict. This section has {so} pages, one for each number.",
  },
  "/than-so/nghe-nghiep": {
    ten: "Careers by Life Path", h1: "Which careers suit each Life Path number",
    tieu_de_seo: "Careers by Life Path number: strengths, roles, traps · Hieuban",
    mo_ta: "Which kinds of work tend to suit each Life Path number: strengths, the environment that helps, roles, the career trap to watch and money habits.",
    tra_loi: "Numerology does not pick a job for you, but each Life Path number tends to do best in certain kinds of work: some start things, some build, some care for people, some analyse. This section has {so} pages, one per Life Path number: strengths at work, the environment and roles that suit, the trap to watch, and habits around money.",
  },
  "/than-so/tinh-yeu": {
    ten: "Life Path numbers in love", h1: "How each Life Path number loves",
    tieu_de_seo: "Life Path numbers in love: how they love, blind spots · Hieuban",
    mo_ta: "How each Life Path number tends to love: what it needs, its blind spots, the kind of person who suits it, and signs the rhythm is off. No scores.",
    tra_loi: "Your Life Path number colours how you love: what you need from a partner, how you show care, and where you tend to trip. This section has {so} pages, one per Life Path number, covering how it loves, its blind spots, the kind of person who suits it, signs that the rhythm is off, and a question to ask yourself. No compatibility scores.",
  },
  "/than-so/nam-ca-nhan": {
    ten: "Personal Years 1–9", h1: "Personal Years 1 to 9 in numerology",
    tieu_de_seo: "Personal Year 1–9 in numerology: what to do and avoid · Hieuban",
    mo_ta: "What each Personal Year from 1 to 9 tends to bring in numerology: what to do, what to avoid, what often comes up, and how to work out your own Personal Year.",
    tra_loi: "Your Personal Year is your birth day and month added to the current calendar year, reduced to 1–9. The years run in a nine-year cycle, from beginnings (1) to closing and letting go (9). This section has {so} pages, one per Personal Year: what it tends to bring, what to do, what to avoid, and how to work out your own.",
  },
  "/than-so/no-nghiep": {
    ten: "Karmic debt 13, 14, 16, 19", h1: "Karmic debt numbers 13, 14, 16 and 19",
    tieu_de_seo: "Karmic debt 13, 14, 16, 19 in numerology: meaning · Hieuban",
    mo_ta: "What karmic debt numbers 13, 14, 16 and 19 mean in numerology, when they count as present, and how to read them as lessons to practise, not a sentence.",
    tra_loi: "In numerology a karmic debt number is 13, 14, 16 or 19 showing up as an unreduced total on the way to a core number. It is read as a lesson to practise, not a punishment. This section has {so} pages, one per number: what it means, when it counts as present, and a concrete way to work with it.",
  },
  "/than-so/so-kep": {
    ten: "Chaldean compound numbers 10–52", h1: "Chaldean compound numbers 10 to 52",
    tieu_de_seo: "Chaldean compound numbers 10–52: meaning of each · Hieuban",
    mo_ta: "Chaldean compound numbers 10 to 52 (after Cheiro): the image of each, its meaning and shadow side, what it reduces to, and whether your name carries it.",
    tra_loi: "In Chaldean numerology the total of a name or birth date is read before it is reduced: 10 to 52 each have their own image, from the wheel of fortune (10) upward. This section has {so} pages, one per compound number: meaning, shadow side, the single digit it reduces to, and how to tell whether your name carries it. Written neutrally — no number is called unlucky.",
  },
  "/hop-doi/cap-so": {
    ten: "Life Path number pairs", h1: "Which Life Path numbers get along",
    tieu_de_seo: "Life Path compatibility: every pair of numbers 1–9 · Hieuban",
    mo_ta: "Every pair of Life Path numbers from 1 and 1 to 9 and 9: where the two flow, where they clash, and what to do together to keep things smooth. No scores.",
    tra_loi: "Numerology compares two people mainly through their Life Path numbers. Each pair has places where it flows easily and places where it tends to clash; neither makes a match good or bad. This section has {so} pages, one for each pair from 1 and 1 to 9 and 9, with what to do together and a question to reflect on. No compatibility scores.",
  },
  "/tarot/la-bai": {
    ten: "The 78 tarot cards", h1: "Meaning of all 78 tarot cards",
    tieu_de_seo: "78 tarot card meanings: upright, reversed, love, work · Hieuban",
    mo_ta: "The 22 Major and 56 Minor Arcana in plain English from Waite 1910, Mathers 1888 and Book T: upright, reversed, love, work, money, one thing to do.",
    tra_loi: "A tarot deck has 78 cards: 22 Major Arcana for the big stages of life, and 56 Minor Arcana in four suits — Wands (will, work), Cups (feelings), Swords (thinking, conflict) and Pentacles (money, body, home). This section has {so} pages, one per card, with its upright and reversed meaning, how it reads in love, work and money, and one small thing to do. A reversed card is not a bad omen.",
  },
  "/kinh-dich/que": {
    ten: "The 64 hexagrams", h1: "The 64 hexagrams of the I Ching",
    tieu_de_seo: "The 64 I Ching hexagrams: meaning, lines and judgement · Hieuban",
    mo_ta: "All 64 I Ching hexagrams: the judgement and six line texts in the original Chinese, with a plain-English meaning and how each reads for your question.",
    tra_loi: "The I Ching (Book of Changes) has 64 hexagrams, each made of six lines that are either solid (yang) or broken (yin). This section has {so} pages, one for each hexagram: the judgement and the six line texts in the original Chinese, a translation, a plain-English meaning, and how it tends to read when you ask about work, money, love or a decision.",
  },
  "/phong-thuy/dau-hieu": {
    ten: "Home feng shui signs", h1: "Common feng shui signs in the home",
    tieu_de_seo: "Feng shui home signs: what they mean and what to do · Hieuban",
    mo_ta: "The home signs feng shui often mentions — a mirror facing the bed, a beam over the bed, doors in a line — what the old books say, and fixes that cost nothing.",
    tra_loi: "These are {so} signs inside and around a home that feng shui often talks about: a door facing a door, a stove facing the bathroom, stairs in the middle of the house, a bed under a beam, and more. Each page says what the sign is, what the old books and folk tradition say, how it looks through everyday life (light, air, noise, safety), and what you can do about it, starting with fixes that cost nothing.",
  },
  // EN-ALL GĐ 8 — Nhân tướng học: cụm bộ vị gương mặt.
  "/nhan-tuong/bo-vi": {
    ten: "Areas of the face", h1: "The areas of the face in Chinese face reading",
    tieu_de_seo: "Face reading areas: forehead, Yin Tang, nose, chin · Hieuban",
    mo_ta: "The 25 areas of the face in classic Chinese face reading, from forehead to chin: where each sits, the ages it is read for, and what to look for.",
    tra_loi: "Classic Chinese face reading divides the face into three zones (forehead, nose, chin), five features (brows, eyes, ears, nose, mouth) and named areas such as Yin Tang between the brows or Shan Gen at the root of the nose. Each area is linked to one part of life and to the ages it is read for. This section has {so} pages, one per area: where it is, what the old books say, how to look at it in a mirror, and a question to reflect on.",
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
  "/than-so": {
    ten: "Numerology",
    tieu_de_seo: "Free numerology calculator: Life Path, Expression, Soul Urge · Hieuban",
    mo_ta_seo: "Free numerology calculator: your Life Path, Expression, Soul Urge and Personality numbers from your name and birth date, each step shown. No sign-up.",
    tra_loi_nhanh: {
      hoi: "What does this numerology calculator give you?",
      dap: "Enter your full name and date of birth to get your Life Path, Expression, Soul Urge and Personality numbers, each with the step-by-step sum, a four-sided portrait, your pinnacles and personal years, and your birth chart grid. There are two ways to add the Life Path and two schools (Pythagorean and Chaldean). Free, no account.",
      lien_ket: [{ href: "/en/numerology/life-path", ten: "What each number means" }, { href: "/en/numerology/personal-year", ten: "Personal Years 1–9" }],
    },
    gioi_thieu: {
      tieu_de: "About the numerology calculator",
      doan: [
        "Numerology turns the letters of your name and the digits of your birth date into a few core numbers. The Life Path comes from your birth date; Expression, Soul Urge and Personality come from your name. Every number here comes with the sum that produced it, so you can check it yourself.",
        "Each core number is a set of tendencies, not a verdict: you get its strengths, its blind spots and a short checklist to tick the traits that fit you. The portrait reads your Life Path through love, work and turning points, with a personal layer from your other numbers.",
        "There are two common ways to add the Life Path (reducing each part first, or adding every digit at once); for some dates they give different numbers, and the page shows both. You can also switch to the Chaldean school, or see where the two schools point the same way. The reading is cultural reference, not a prediction.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "Is it free?", dap: "Yes. The numerology reading in English is free and needs no account." },
        { hoi: "Which numerology is this?", dap: "Pythagorean numerology by default — letters A–Z map to 1–9 and master numbers 11, 22 and 33 are kept — with the Chaldean school (Cheiro) as an option." },
        { hoi: "Why are there two ways to add my Life Path?", dap: "Western books reduce the day, month and year separately before adding; many sites add every digit at once. For some dates the two give different numbers, so you choose and the page shows both." },
        { hoi: "Does it predict anything?", dap: "No. Each number comes with a shadow side and a question to test whether it fits you. Personal years are a rhythm to compare with your life, not a forecast." },
        { hoi: "Is my name stored?", dap: "Your profile stays in this browser by default. Your name and date of birth are sent only to compute the numbers and are not stored with your identity." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/tarot", ten: "Tarot reading" },
        { href: "/en/bazi", ten: "BaZi (Four Pillars) calculator" },
        { href: "/en/compatibility/number-pairs", ten: "Life Path compatibility" },
      ] },
    },
    kien_thuc: {
      tieu_de: "Learn numerology",
      cum: Object.fromEntries(["/than-so/y-nghia-so", "/than-so/nghe-nghiep", "/than-so/tinh-yeu", "/than-so/nam-ca-nhan", "/than-so/no-nghiep", "/than-so/so-kep"].map((d) => [d, { ten: CUM_EN[d]!.ten, mo_ta: CUM_EN[d]!.mo_ta }])),
    },
  },
  "/tarot": {
    ten: "Tarot",
    tieu_de_seo: "Free tarot reading: draw your own cards for one question · Hieuban",
    mo_ta_seo: "Free tarot reading: type a question, shuffle and draw your own cards from the 78-card Rider–Waite deck, and get a straight answer first. No predictions.",
    tra_loi_nhanh: {
      hoi: "How does this online tarot reading work?",
      dap: "Type your question, pick a spread (one card, three cards, Two choices, When…), shuffle with your own hand and draw from the 78 cards. The reading answers exactly what you asked — leaning yes, yes with a condition, or not yet — then tells the cards in order, upright or reversed, with what to do in the next 72 hours. Tarot is a mirror for thinking, not a prediction.",
      lien_ket: [{ href: "/en/tarot/cards", ten: "Meaning of the 78 tarot cards" }],
    },
    gioi_thieu: {
      tieu_de: "About the tarot reading",
      doan: [
        "Ask about one matter in your own life — a decision, a relationship, work, money — and draw your own cards. You shuffle by holding a button; the rhythm of your hand is hashed on your device into the shuffle seed, so only a hash leaves your device. Or let the machine shuffle.",
        "Card meanings follow Waite's Pictorial Key to the Tarot (1910) and Mathers (1888), with the Golden Dawn's elemental dignities (Book T) for how neighbouring cards strengthen or hold each other back, and the Marseille way of reading where a figure is looking. A reversed card is read as a quality that is blocked or turned inward — never as a bad omen.",
        "The reading opens with the answer to what you asked, then the story the cards tell together, each position, and three small things to do. It does not predict events, does not give scores, and does not read other people. Decisions stay with you.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "Is the shuffle really random?", dap: "You shuffle by holding the button and moving your finger; the rhythm is hashed in your browser into a seed, and the server shuffles from it. Only the hash leaves your device. You can also let the machine shuffle." },
        { hoi: "Which tarot tradition is used?", dap: "Meanings follow Waite's Pictorial Key (1910) and Mathers (1888), with Golden Dawn elemental dignities (Book T) for how neighbouring cards affect each other, and the Marseille reading of numbers and gaze." },
        { hoi: "Do reversed cards mean something bad?", dap: "No. A reversed card means the quality is blocked, turned inward, delayed or overdone — the reading says so and gives a small step to take." },
        { hoi: "Which spread should I choose?", dap: "One card for a quick focus, three cards for a situation, the obstacle and advice, Two choices when you are weighing A against B, When for timing, and the Celtic Cross for a full picture. When you type a question, the page picks the spread that fits it; you can change it." },
        { hoi: "Can it read another person?", dap: "No. The cards here read the person asking. Ask what you should do about a situation and the spread can answer that." },
        { hoi: "Is it free? Is my question stored?", dap: "The tarot reading is free. Your question passes through one reading and is not stored on our side; the spreads you have drawn are saved only on your device, and you can delete them at any time." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/numerology", ten: "Numerology from your name and birth date" },
        { href: "/en/i-ching", ten: "I Ching reading" },
        { href: "/en/bazi", ten: "BaZi (Four Pillars) calculator" },
      ] },
    },
    kien_thuc: {
      tieu_de: "Learn tarot",
      cum: Object.fromEntries(["/tarot/la-bai"].map((d) => [d, { ten: CUM_EN[d]!.ten, mo_ta: CUM_EN[d]!.mo_ta }])),
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
  // EN-ALL GĐ 8 — Nhân tướng học, Chân dung tổng hợp, Thời gian tới (rewrite của trang Việt, một cây component).
  "/nhan-tuong": {
    ten: "Face reading",
    tieu_de_seo: "Free Chinese face reading: a guided look in the mirror · Hieuban",
    mo_ta_seo: "Free Chinese face reading: answer a guided mirror survey or measure a photo that never leaves your device, and get an eight-chapter reading in plain English.",
    tra_loi_nhanh: {
      hoi: "How does this online face reading work?",
      dap: "Look in a mirror and answer short questions in six steps — forehead, brows and eyes, nose, mouth and chin, ears, overall — or pick a straight-on photo and let your own device place landmarks on it (the photo is never uploaded). The page reads your answers through the three zones, five features and twelve palaces of classic face reading, in plain English. It only reads your own face.",
      lien_ket: [{ href: "/en/face-reading/face-areas", ten: "The areas of the face" }],
    },
    gioi_thieu: {
      tieu_de: "About the face reading",
      doan: [
        "Classic Chinese face reading looks at the face in three zones (forehead, middle face, lower face), five features and twelve named palaces, and links each area to one part of life. This page turns that into a guided look in the mirror: you choose what you see, area by area, and the reading puts it together in eight chapters — your face shape by the five elements, character, work and money, love and family, health habits, which area to watch this year, face and birth chart, and things to do.",
        "You can also measure a straight-on photo of yourself. Your device finds about twenty landmarks in the browser and you check them; only those coordinates are sent for one calculation of the classic proportions, then discarded. The photo never leaves your device and is not stored. Things a photo cannot show — skin tone, lines, the look in your eyes — you answer in the survey.",
        "The reading is cultural reference and self-reflection, not a judgement of anyone. There are no scores, it does not read other people, and it never suggests changing your face. Old books wrote for their own time; health notes are reminders to look after yourself, not a diagnosis.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "Do I need a photo?", dap: "No. The six-step mirror survey is enough. A photo only helps you answer the questions about proportions faster, and it stays on your device." },
        { hoi: "What happens to my photo?", dap: "Nothing leaves your device. Your browser finds landmarks on the photo and, only after you tick the agreement, sends their coordinates for one measurement that is not stored. You can withdraw the agreement at any time." },
        { hoi: "Which tradition is used?", dap: "The survey and the reading follow the classic Chinese books on physiognomy — the three zones and five features, the twelve palaces, the hundred age positions and the five element face shapes — retold in plain English by our editorial team." },
        { hoi: "Can it read someone else's face?", dap: "No. The page only reads the person using it, from what they see in their own mirror." },
        { hoi: "Is it free?", dap: "Yes. The survey, the photo measurement and the eight-chapter reading are free in English. Your answers are saved only on your device." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/portrait", ten: "Your combined portrait" },
        { href: "/en/bazi", ten: "BaZi (Four Pillars) calculator" },
        { href: "/en/zi-wei-dou-shu", ten: "Zi Wei Dou Shu chart" },
      ] },
    },
    kien_thuc: {
      tieu_de: "Learn face reading",
      cum: Object.fromEntries(["/nhan-tuong/bo-vi"].map((d) => [d, { ten: CUM_EN[d]!.ten, mo_ta: CUM_EN[d]!.mo_ta }])),
    },
  },
  "/chan-dung": {
    ten: "Your combined portrait",
    tieu_de_seo: "Zi Wei, BaZi and face reading side by side: your portrait · Hieuban",
    mo_ta_seo: "Your Zi Wei Dou Shu chart, your BaZi chart and your own face, side by side for each area of life: where the three agree and where they differ. No scores.",
    tra_loi_nhanh: {
      hoi: "What is the combined portrait?",
      dap: "It puts three ways of looking at you side by side, area by area — work, money, love, family, health and this year: your Zi Wei Dou Shu chart, your BaZi chart, and the face reading survey if you have done it. It shows where the three agree and where they see different sides, without adding them into one score.",
      lien_ket: [{ href: "/en/face-reading", ten: "Face reading" }, { href: "/en/zi-wei-dou-shu", ten: "Zi Wei Dou Shu chart" }],
    },
    gioi_thieu: {
      tieu_de: "About the combined portrait",
      doan: [
        "Each system looks at you from a different side: Zi Wei Dou Shu looks at your circumstances (work, money, home, people), BaZi at your own energy (which elements are strong or thin), and face reading at what you see in yourself now. This page does not blend them into one number; it sets them side by side for each area of life and says clearly where they agree, where they differ, and why.",
        "It needs your birth time, sex and place of birth for the two charts. The face reading survey adds a third view; without it, the page still reads the two charts. Each box in the reading is the original box from one system, so when you mark it as true for you, the vote goes back to that system.",
        "The portrait is free in English. Your birth details are not stored on our side.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "Does it add the three systems into a score?", dap: "No. Each area only shows the level each system gave in its own reading — Favourable, Balanced or Needs care — and then says whether they agree or see different sides. There is no total and no ranking." },
        { hoi: "When they disagree, which one should I trust?", dap: "None of them is wrong; each shows one side. The page suggests using the most careful reading as your safety margin and the favourable one for plans you have prepared well. An area where several systems agree is more reliable than one only a single system mentions." },
        { hoi: "What if I have not done the face reading survey?", dap: "You can still read the portrait with the two charts. The face reading column stays empty until you answer the mirror survey (about five minutes, no photo needed)." },
        { hoi: "Is numerology part of it?", dap: "Not yet. Numerology works from the solar birth date and does not give a level for each area of life the way these three systems do, so it stays on its own page." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/face-reading", ten: "Face reading" },
        { href: "/en/bazi", ten: "BaZi (Four Pillars) calculator" },
        { href: "/en/zi-wei-dou-shu", ten: "Zi Wei Dou Shu chart" },
        { href: "/en/year-ahead", ten: "Your year ahead" },
      ] },
    },
  },
  "/thoi-gian-toi": {
    ten: "Your year ahead",
    tieu_de_seo: "Your next 3 months, 12 months and year ahead, free · Hieuban",
    mo_ta_seo: "Your next 3 months, 12 months and year ahead from your birth date: numerology months, Zi Wei and BaZi months, and Vietnamese age customs, in plain English.",
    tra_loi_nhanh: {
      hoi: "What does the year-ahead reading show?",
      dap: "From your birth date it lays out the next three months, the next twelve months and the coming lunar year: your numerology Personal Months, the Zi Wei Dou Shu rhythm of each lunar month, the BaZi solar months, and the Vietnamese customs tied to your age. Months where several views agree come first. It is a rhythm to plan by, not a prediction.",
      lien_ket: [{ href: "/en/numerology", ten: "Numerology from your name and birth date" }],
    },
    gioi_thieu: {
      tieu_de: "About the year-ahead reading",
      doan: [
        "Want to know where to put your energy in the next three months, which of the next twelve months suit starting something new, and how the coming year opens? This page combines three views from your own birth date — numerology, Zi Wei Dou Shu and BaZi — with the Vietnamese customs tied to your age, and says it in plain words.",
        "Your name and birth date are enough for Personal Months, the Personal Year and the age customs. Add your birth time, sex and place of birth to get the Zi Wei and BaZi rhythm of each month; months where both charts agree, whether to push ahead or to slow down, come first.",
        "This is a suggested rhythm for planning your own time, not a forecast of events. The page does not offer rituals or sell objects, and your birth date is not stored on our side.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "How are the three views different?", dap: "Numerology counts Personal Months and Years from your solar birth day and month (the year starts on 1 January). Zi Wei Dou Shu reads each lunar month through the month's transformations on your chart. BaZi reads solar-term months, which change on the day each solar term begins, with the year starting at Li Chun. Because the calendars differ, the month boundaries do not line up exactly." },
        { hoi: "When they disagree, which should I follow?", dap: "Start with the larger layers: the ten-year period, then the year, then the month. Months where both charts give the same level are listed first in the twelve-month chapter." },
        { hoi: "When does the coming year start?", dap: "The lunar year starts at Lunar New Year (Vietnamese lunar calendar); the BaZi year starts at Li Chun (around 4 February); the numerology Personal Year starts on 1 January. Each part of the reading states which boundary it uses." },
        { hoi: "Is it free?", dap: "Yes, the whole year-ahead reading is free in English." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/numerology", ten: "Numerology from your name and birth date" },
        { href: "/en/bazi", ten: "BaZi (Four Pillars) calculator" },
        { href: "/en/zi-wei-dou-shu", ten: "Zi Wei Dou Shu chart" },
      ] },
    },
  },
  // EN-ALL GĐ 8 — lịch & Hôm nay.
  "/xem-ngay-tot": {
    ten: "Auspicious dates",
    tieu_de_seo: "Auspicious dates: is today a good day? Chinese almanac · Hieuban",
    mo_ta_seo: "Today in the Chinese almanac: Yellow or Black Path day, auspicious hours, what the almanac lists as favourable or to avoid, and good days for your plans.",
    tra_loi_nhanh: {
      hoi: "How do I know if a date is auspicious?",
      dap: "Look at three things in the traditional Chinese almanac: whether the day is a Yellow Path (auspicious) or Black Path day, its Day Officer, and the activities the almanac lists as favourable or to avoid. A date suits a plan when that activity is listed as favourable and nothing gets in the way. Add your date of birth to leave out days that clash with your birth year. The almanac is cultural reference, not a forecast.",
      lien_ket: [{ href: "/en/lunar-calendar", ten: "Lunar calendar by year" }, { href: "/en/lunar-converter", ten: "Lunar–solar date converter" }],
    },
    gioi_thieu: {
      tieu_de: "About the auspicious-dates tool",
      doan: [
        "Each day has one of twelve spirits on duty: six Yellow Path (auspicious) spirits — Azure Dragon, Bright Hall, Golden Coffer, Heavenly Virtue, Jade Hall and Life Governor — and six Black Path ones. The Day Officer (Establish, Remove, Full, Balance, Stable, Initiate, Destruction, Danger, Success, Receive, Open, Close) comes from the day's branch and the solar month.",
        "The lists of favourable and avoid activities follow the Xieji Bianfang Shu, the Qing-dynasty date-selection manual most almanacs draw on. The page also notes the folk taboo days kept in Vietnam (Tam Nuong, Moon taboo days, Duong Cong days).",
        "If your date of birth is saved on this device, the page shows whether a day clashes with, suits or is neutral to your birth year, and leaves clashing days out when you search. Your date of birth is used for the calculation only and not stored on our side.",
        "The almanac is cultural knowledge to consult, not a prediction — important plans still rest on practical preparation.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "What is a Yellow Path day?", dap: "A day guarded by one of the six auspicious spirits: Azure Dragon, Bright Hall, Golden Coffer, Heavenly Virtue, Jade Hall or Life Governor. The other six days of the cycle are Black Path days." },
        { hoi: "How are the auspicious hours worked out?", dap: "A day has twelve two-hour periods. The cycle of twelve spirits also turns through the hours, starting from the day's branch, so every day has six auspicious hours." },
        { hoi: "What does it mean that a day clashes with my birth year?", dap: "The day's earthly branch is opposite the branch of your birth year (for example, a Monkey day clashes with people born in a Tiger year). The almanac suggests thinking twice before using that day for a big event." },
        { hoi: "Is the almanac month the lunar month?", dap: "No. Day Officers and day spirits follow the solar-term month, which changes on dates such as the Start of Spring, not on the first day of the lunar month. The page computes solar terms in Vietnam time." },
        { hoi: "Is it free?", dap: "Yes. Looking up any day, month or good days for a plan is free, and your date of birth stays on your device." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/lunar-calendar", ten: "Lunar calendar by year" },
        { href: "/en/lunar-converter", ten: "Lunar–solar date converter" },
        { href: "/en/today", ten: "Your day today" },
      ] },
    },
  },
  "/doi-lich-am-duong": {
    ten: "Lunar converter",
    tieu_de_seo: "Lunar–solar date converter: today's lunar date · Hieuban",
    mo_ta_seo: "Convert a solar date to the Vietnamese lunar calendar and back, with the stem and branch of the day, month and year, leap months and Chinese-calendar gaps.",
    tra_loi_nhanh: {
      hoi: "How do I convert a solar date to a lunar date?",
      dap: "Choose the direction, enter the day, month and year, and press Convert. The page gives the date in the Vietnamese lunar calendar (Hanoi time), the stem and branch of the day, month and year, whether the lunar year has a leap month, and the Chinese-calendar date when the two calendars differ.",
      lien_ket: [{ href: "/en/lunar-calendar", ten: "Lunar calendar by year" }],
    },
    gioi_thieu: {
      tieu_de: "About the lunar–solar converter",
      doan: [
        "The Vietnamese lunar calendar is computed astronomically for Hanoi time (UTC+7): the first day of a month is the day of the new moon, and the leap month is the first month in a year with no major solar term.",
        "The Chinese calendar uses Beijing time (UTC+8), so in some years Lunar New Year differs by a day between the two calendars, and occasionally by a whole month (as in 1985). The converter says so when the two calendars differ.",
        "The result includes the stem and branch of the day, month and year and the length of the lunar month (29 or 30 days) — handy for old records, family anniversaries or full-moon days.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "Why do the Vietnamese and Chinese lunar calendars sometimes differ?", dap: "They use different time zones (UTC+7 and UTC+8). When the new moon falls between 23:00 and midnight Hanoi time, the first day of the month differs by one day; in some years even the leap month differs." },
        { hoi: "What is a leap month?", dap: "About every three lunar years one year has 13 months. The extra month is the leap month and takes the name of the month before it (for example, 2025 has a leap sixth month)." },
        { hoi: "Is the converter free?", dap: "Yes, and nothing you enter is stored." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/auspicious-dates", ten: "Auspicious dates" },
        { href: "/en/today", ten: "Your day today" },
      ] },
    },
  },
  "/hom-nay": {
    ten: "Today",
    tieu_de_seo: "Your day today: personal day number and the Chinese almanac · Hieuban",
    mo_ta_seo: "A new card every day from your name and date of birth: your personal day number, three cards for today, the good hours, the Chinese almanac and your week ahead.",
    tra_loi_nhanh: {
      hoi: "What does the daily card show?",
      dap: "Enter your name and date of birth once. Each day the page shows your personal day number (numerology) with a question to reflect on, three cards to flip — a tarot card, a number card and an hour card — the next auspicious hour, what the Chinese almanac says about the day, and your week at a glance. It is a nudge for reflection, not a forecast.",
      lien_ket: [{ href: "/en/numerology", ten: "Your numerology reading" }, { href: "/en/auspicious-dates", ten: "Auspicious dates" }],
    },
    gioi_thieu: {
      tieu_de: "About your day today",
      doan: [
        "Your personal day number comes from your birth day and month plus today's date, reduced to 1–9 as in Pythagorean numerology. Each number has a theme for the day and a question to reflect on.",
        "The three cards change every day: a tarot card that is yours for the day, a number card with a small task that fits it, and an hour card with the next auspicious hour by the traditional calendar. Everything is worked out on our side from the same rules every time — no draw for prizes, nothing to unlock.",
        "You can also pick up to three things you plan to do today, or type a short note, and see how each one fits the rhythm of the day. Your note is only used to recognise the kind of task and is not stored.",
      ],
      hoi_dap_tieu_de: "Questions people ask",
      hoi_dap: [
        { hoi: "How is my personal day number worked out?", dap: "Add your birth day and month to today's day, month and year, then reduce the total to a single digit (1–9). The personal month and year numbers are worked out the same way." },
        { hoi: "Do I need an account?", dap: "No. Your name and date of birth are saved only on this device." },
        { hoi: "Is the daily card a prediction?", dap: "No. It is a theme and a question for the day, plus traditional calendar notes as cultural reference. Decisions stay with you." },
      ],
      doc_them: { tieu_de: "Also in English:", lien_ket: [
        { href: "/en/numerology", ten: "Numerology from your name and birth date" },
        { href: "/en/tarot", ten: "Tarot reading" },
        { href: "/en/auspicious-dates", ten: "Auspicious dates" },
      ] },
    },
  },
};

export const trangCongCuEn = (duongVi: string): TrangCongCuEn | null => SO_TRANG_EN[duongVi] ?? null;

export const cumEn = (duongVi: string): CumEn | null => CUM_EN[duongVi] ?? null;
