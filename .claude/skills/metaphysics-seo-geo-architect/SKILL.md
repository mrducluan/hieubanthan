---
name: metaphysics-seo-geo-architect
description: Plans, writes, audits and refreshes SEO, AEO and GEO content for Eastern and Western metaphysics sites (Tử vi, Bát tự, Kinh Dịch, phong thuỷ, thần số học, chiêm tinh, tarot) - keyword and question-intent matrices, anti-cannibalization topic clusters, content briefs, Vietnamese articles with direct-answer blocks and comparison tables, Article/FAQ JSON-LD, and an automated QC pass. Use whenever the user asks to plan a topic cluster, map keywords or search intent, write or rewrite a horoscope, fortune or feng shui article for Google, AI Overviews, ChatGPT or Perplexity, check content for AI cliches or fear-mongering, or generate schema markup, including Vietnamese requests such as "lập cụm chủ đề", "ma trận từ khoá", "viết bài SEO tử vi", "audit bài thần số học", "trùng ý định tìm kiếm", even when SEO is not mentioned explicitly.
---

# Metaphysics SEO, AEO & GEO Architect

Build content that search engines and AI answer engines can rank and cite, for sites about Eastern and Western metaphysics. Output language follows the site (Vietnamese by default); these instructions are in English so any agent can follow them.

## Principles (read once, they explain every rule below)

- **Helpful and verifiable beats clever.** Ranking and AI citation are consequences of an answer that is correct, specific and easy to lift out. Google does not penalise AI-assisted text as such; it penalises scaled, unhelpful, unoriginal text. So never optimise to "beat AI detectors" - detectors are unreliable. Vary rhythm because it reads better.
- **One URL owns one search intent.** Two pages for the same intent compete with each other. Decide the intent first, the keyword second.
- **No invented facts.** Chart facts (Can Chi, Ngũ hành, star brightness, planetary cycles) are checkable; SERP gaps, search volumes and Wikidata IDs are only real if you looked them up. Anything not verified is labelled `unverified`, never stated as fact.
- **Metaphysics is a symbolic reading, not a forecast.** No fear-mongering, no guarantees, no diagnoses. Frame hard configurations as energy that needs the right channel. This is also a YMYL-safety rule.

## Step 0 - Intake (ask only for what is missing)

Collect: site/domain and language; target audience; existing URLs (sitemap or list) so new pages do not cannibalise old ones; real author and reviewer identities (if none, publish as the editorial team - never invent a credentialed expert); available data (Search Console queries, analytics); whether live web search is available. If the user gives none of this, state your assumptions in one short list and continue.

## Pick one mode

| User wants | Mode | Read |
|---|---|---|
| New topic cluster / keyword plan | **A. Plan** | `references/matrix.md` |
| One page written or rewritten | **B. Write** | `references/article.md`, `references/onpage-schema.md` |
| Check existing page(s) | **C. Audit** | `references/qc.md` |
| Update an aging page | **D. Refresh** | `references/maintenance.md` |

Do one mode at a time and show the result before the next. A 5-page cluster is a plan first; write pages one by one after the user confirms the matrix. Writing all five articles in a single reply produces thin, repetitive pages.

## A. Plan a cluster

1. Build the 7-column intent matrix for 1 hybrid hub + 2 Eastern spokes + 2 Western spokes (columns and formulas in `references/matrix.md`).
2. Run `scripts/check_cannibalization.py` on the matrix (and on the existing-URL list). Merge or re-scope every pair it flags.
3. For each URL write a short brief: intent, H1/H2/H3 outline where each heading answers one real question, the table to build, entities and sources to cite, internal links in and out.
4. SERP gaps: if you can search the web, look at the current top results and name 3 concrete gaps. If you cannot, write them as hypotheses marked `unverified - check SERP`.

## B. Write one page

Follow `references/article.md`. Required shape: a vivid opening scenario, the first H2 followed by a bold 40-60 word direct answer, at least one multi-variable comparison table, a dedicated cross-system bridge (analogy, not equivalence), concrete actions, 3-5 edge-case FAQs, sources, and internal links. Then package on-page elements and JSON-LD (`references/onpage-schema.md`).

## Quality gate (every mode that produces or reviews a page)

1. Run `python scripts/seo_geo_qc_validator.py page.md --keyword "<primary keyword>"` (front matter may carry `title`, `meta_title`, `meta_description`, `slug`).
2. Fix every FAIL, read every WARN, re-run until no FAIL. Exit code 0 means no FAIL.
3. Do the manual fact-check list in `references/qc.md`; the script cannot check astrology or Tử vi facts.
4. Generate schema only after the text is final: `python scripts/schema_generator.py --spec spec.json`.

## Scripts (Python 3.9+, standard library only)

| Script | Purpose |
|---|---|
| `scripts/seo_geo_qc_validator.py` | Structure, direct answer, clichés, fear-mongering, FAQ, links, meta/slug, rhythm |
| `scripts/check_cannibalization.py` | Flags page pairs that share one search intent, diacritics-insensitive |
| `scripts/schema_generator.py` | WebPage + Article + FAQPage + BreadcrumbList JSON-LD; only verified Wikidata links |

Run `python scripts/<name> --help` for options. `python -m unittest discover tests` runs the self-tests.

## Gotchas

- Do not let the Western half take over an Eastern page: keep about 80% inside the Eastern system and confine the Western comparison to the bridge section.
- Do not copy classical verses at length; quote at most a line with the source named, and explain it in plain words.
- Keep the direct answer self-contained and between 40 and 60 words; longer gets truncated, shorter lacks substance.
- Evergreen slugs carry no year; put time-bound material (lưu niên, transits) in a clearly dated section.
- If the project has its own rules (banned phrases, reviewer records, URL structure), they override this file. HieuBanThan's are in `references/hieubanthan.md`.
