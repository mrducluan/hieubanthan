# Quality control

## Contents
1. Automated checks
2. Fix loop
3. Manual fact-check list
4. Anti-cannibalization and coverage
5. Sign-off

## 1. Automated checks (`scripts/seo_geo_qc_validator.py`)
FAIL blocks publication; WARN is a judgement call. Exit code is 1 when any FAIL exists (or any WARN with `--strict`).

| Check | FAIL when | WARN when |
|---|---|---|
| h1 | zero or several H1 | |
| headings | | skipped level, empty or duplicate heading |
| direct_answer | no bold paragraph under first H2, or outside 35-65 words | outside 40-60 words |
| clichés | any banned phrase | |
| fear_diagnosis | guarantee of disaster, disease named as a prediction | health words without a doctor disclaimer |
| table | no Markdown table | |
| internal_links | | fewer than 2 internal links |
| sources | | no external link and no Sources heading |
| faq | | no FAQ section or not 3-5 questions |
| keyword | | missing from H1 or first 100 words, or density above 3% |
| meta / slug | non-ASCII or uppercase slug | title above 60, description outside 70-155, year in slug |
| rhythm | | monotone sentence lengths, sentences over 60 words |

`--skip table,faq` disables checks that do not apply (a glossary entry has no FAQ). `--banned-file` adds the project's own list. The rhythm check is a readability aid, not an AI-detector.

## 2. Fix loop
Run, fix every FAIL, re-run. Re-reading the whole text after fixing a cliché matters: replacing a phrase with a synonym often keeps the same empty sentence. Delete or make it concrete.

## 3. Manual fact-check list (the script cannot do this)
- Can Chi of the year, month, day and hour in any example: compute with a tool or the project's engine, do not recall.
- Ngũ hành of each star, stem and branch; Đắc/Hãm status of a star in a given palace; palace names.
- Ages and years: Đại vận span, Tuần/Triệt reach, Saturn return (about 29.5 years), retrograde periods.
- Every quoted text: title, chapter and wording exist as cited. If unsure, paraphrase and drop the quote.
- Every number: the source is named or the number is removed.
- Western vs Eastern bridge: stated as analogy, differences named.
Keep a short list "checked / not checked" in the hand-off note.

## 4. Anti-cannibalization and coverage
Confirm the page's intent signature is unique (`check_cannibalization.py`), and that each question in the brief's pool is answered in the body or the FAQ. Mark any unanswered question deliberately deferred to a sibling page, with the link.

## 5. Sign-off
Validator has no FAIL; manual list done; schema generated from the final text; author and reviewer lines are true; all links resolve.
