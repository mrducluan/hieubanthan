# Planning: keyword formula, question layers, intent matrix

## Contents
1. Where questions come from
2. Dual-core formula
3. Six question layers
4. Intent signature and cannibalization
5. The 7-column matrix
6. Cluster shape and internal links

## 1. Where questions come from
Real queries first, imagination last. In order of trust: Search Console queries of the site, People Also Ask and autocomplete for the seed term, questions in forums and comment sections, H2s of the current top results. Record the source next to every question (`gsc`, `paa`, `forum`, `serp`, `inferred`). Never write search volumes or difficulty unless a tool gave the number; say "volume unknown".

## 2. Dual-core formula
- **A - Pain-point:** [entity] + [timing / life stage / transit] + [specific life concern: career, marriage, money, turning point]. Example: "Địa Không Địa Kiếp cung Quan Lộc tuổi 30 có nên khởi nghiệp".
- **B - Question-intense:** map the same entity across the six layers below. Head terms alone ("Sao Thái Tuế là gì") are the most contested and the least tied to a decision, so use them only as a hub that links down.

## 3. Six question layers
| Layer | Asks | Example (Tử vi) | Example (Western) |
|---|---|---|---|
| 1 Mechanistic | why / how it works | Vì sao Không Kiếp thuộc Hoả lại gắn với biến động mạnh? | How does the ~29.5-year Saturn cycle work? |
| 2 Conditional | what if a modifier changes | Gặp Tuần khác gặp Triệt thế nào? | Saturn return with a square from Uranus? |
| 3 Timing | when | Bao nhiêu tuổi thì Triệt hết tác dụng? | At what age does the first Saturn return peak? |
| 4 Comparative | vs another star or system | Không Kiếp gặp Triệt khác Kình Đà gặp Tuần ở đâu? | Saturn return vs a Tử vi decade shift? |
| 5 Diagnostic | what real signs show it | Dấu hiệu nào cho thấy giai đoạn này đang diễn ra? | What does it feel like to enter it? |
| 6 Remedial | what to do | Nên chọn nghề và quản lý vốn ra sao? | How to re-plan a career around it? |

A page should cover at least three layers well rather than all six thinly; the rest become FAQ or sibling pages.

## 4. Intent signature and cannibalization
The **intent signature** is one sentence naming the single job the URL does for the searcher ("decide whether to quit a stable job at 30 given this star pair"). Rules:
- Two queries with the same signature get one URL.
- Same entity but different signature (definition vs decision vs timing) gets separate URLs.
- Run `scripts/check_cannibalization.py matrix.json --existing urls.txt`; pairs above the threshold must be merged, re-scoped, or justified in writing.

## 5. The 7-column matrix
Silo/System | Tier (Hub or Spoke) | Primary intent signature | Evergreen URL slug + primary keyword | Question pool (layer + source) | Semantic entities and classical texts | Internal link flow (in/out + natural anchor text).

Slugs are lowercase ASCII without diacritics and without a year. Anchors describe the situation, not the keyword ("cơ chế thử thách của Sao Thổ hồi quy"), never "click here".

## 6. Cluster shape and internal links
1 hybrid hub, 2 Eastern spokes, 2 Western spokes. Hub links to all four; each spoke links back to the hub and to one spoke in the other system where the bridge is honest. Add links to older site pages from `urls.txt`. A cluster is a starting size, not a ceiling.
