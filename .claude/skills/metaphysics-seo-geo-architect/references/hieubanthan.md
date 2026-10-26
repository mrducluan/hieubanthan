# Project profile: HieuBanThan (hieuban.com)

Use only when the work is for this project. Project rules (CLAUDE.md) override the generic skill.

## Content and safety
- Five systems have an engine and knowledge base: thần số, tử vi, bát tự, kinh dịch, phong thuỷ. Western astrology and tarot do not. The Western half of a bridge section may state general concepts only, never computed chart data.
- Computed facts come from the engine (one calculation source). Do not state Can Chi, nạp âm, star brightness or Đại vận from memory.
- Plain, short sentences; jargon only under "Vì sao nói vậy". The project's own banned list is `cum_cam` in `engine/app/kb/data/tuvi_doi_song_kb.json`; pass it to the validator with `--banned-file engine/app/kb/data/tuvi_doi_song_kb.json`.
- No fear, no verdicts, no disease names or "who will fall ill when"; health text includes "không thay lời bác sĩ".
- Do not name libraries, oracles, hosting providers or engine versions in public text. Sources are written as books or schools.
- Do not name competitors; compare against "nhóm chatbot AI đa năng" if needed.

## E-E-A-T and authorship
- The editor-in-chief is Đức Luân. Pages not yet reviewed read "Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên Đức Luân duyệt xuất bản". Only pages listed in `engine/app/kb/data/tham_dinh.json` may say "thẩm định". Do not add `reviewer` to the schema spec otherwise.
- Details: `docs/EEAT-VA-CHUYEN-GIA.md`.

## SEO limits and structure
- Title at most 70 characters including brand suffix, description at most 170, exactly one H1 (the skill's limits of 60 and 155 are stricter, so follow the skill). Page-level checker: `web/scripts/kiem-tra-seo.mjs` must stay at 0 errors.
- URLs are silos under the tool page: `/than-so/...`, `/tu-vi/...`, `/bat-tu/...`, `/kinh-dich/...`, `/phong-thuy/...`. Do not use the old `/kien-thuc/{cluster}` form (`docs/QUY-HOACH-URL.md`).
- Blog posts go through the CMS, whose validation blocks publishing on forbidden content. Supplemental knowledge pages follow `docs/NOI-DUNG-BO-SUNG.md`.

## Product goal
State which stage of the growth loop the cluster serves (attract, return, invite, top up) and the metric that measures it (`docs/MUC-TIEU-TANG-TRUONG.md`).
