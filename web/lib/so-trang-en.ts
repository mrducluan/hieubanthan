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

export const SO_TRANG_EN: Readonly<Record<string, TrangCongCuEn>> = {
  "/bat-tu": {
    ten: "BaZi (Four Pillars)",
    tieu_de_seo: "Free BaZi calculator: Four Pillars chart and five elements · Hieuban",
    mo_ta_seo: "Free BaZi (Four Pillars of Destiny) calculator: see which of the five elements you lack, your Day Master, the Useful God read two ways and your 10-year luck.",
    tra_loi_nhanh: {
      hoi: "What does this BaZi calculator give you?",
      dap: "From your birth date, time and place it sets up the four pillars by the solar terms, scores the five elements so you can see which are strong and which are thin, shows the Useful God read two ways and your 10-year Luck Pillars, then explains each area of life in plain words. The chart and the full reading are free.",
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
      cum: {
        "/bat-tu/thap-than": { ten: "The Ten Gods", mo_ta: "What each of the ten relationships to your Day Master means, when there is too much or too little." },
        "/bat-tu/nhat-chu": { ten: "The ten Day Masters", mo_ta: "The person behind each Day Master, from Jia Wood to Gui Water." },
        "/bat-tu/menh-theo-nam": { ten: "Element by birth year", mo_ta: "The Na Yin element of each birth year and how it differs from your BaZi element." },
      },
    },
  },
};

export const trangCongCuEn = (duongVi: string): TrangCongCuEn | null => SO_TRANG_EN[duongVi] ?? null;
