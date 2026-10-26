# On-page packaging and structured data

## Contents
1. On-page elements
2. Internal links
3. JSON-LD
4. Wikidata links
5. What not to mark up

## 1. On-page elements
- **Slug:** lowercase ASCII, hyphens, no diacritics, no year, 3-6 meaningful words.
- **Meta title:** at most 60 characters, primary keyword near the front, brand last if it fits.
- **Meta description:** 70-155 characters, states the answer or benefit, not a keyword list. It does not affect ranking but affects click-through.
- **Image alt:** describes what the image shows plus the entity, never stuffed.
- **One H1**, sequential heading levels.

## 2. Internal links
At least three contextual links (hub, sibling spoke, one older relevant page). Anchor text is the situation in natural words. Do not link the same target twice in one paragraph.

## 3. JSON-LD
Write a `spec.json` and run `python scripts/schema_generator.py --spec spec.json`:
```json
{
  "url": "https://example.com/than-so/duong-doi-33/",
  "headline": "Số chủ đạo 33 là gì",
  "description": "Giải thích ngắn gọn ...",
  "language": "vi",
  "date_published": "2026-01-15",
  "date_modified": "2026-03-02",
  "publisher": {"name": "Example Co", "url": "https://example.com", "logo": "https://example.com/logo.png"},
  "author": {"name": "Tên người thật", "url": "https://example.com/tac-gia/ten"},
  "reviewer": null,
  "about": ["Thần số học"],
  "mentions": [],
  "faqs": [{"question": "...", "answer": "..."}],
  "breadcrumbs": [{"name": "Trang chủ", "url": "https://example.com/"}, {"name": "Thần số học", "url": "https://example.com/than-so/"}]
}
```
Rules the script enforces: absolute URLs; ISO dates; `author` and `reviewer` are emitted only when given (no placeholder experts - a fabricated reviewer is a misrepresentation); with no author the publisher is credited. `reviewedBy` is a WebPage property, so it sits on the WebPage node, which points to the Article through `mainEntity`.

FAQPage markup: Google limits FAQ rich results to a small set of sites, so expect no visual snippet; it is still harmless structured data for other consumers. Mark up only questions visible on the page.

## 4. Wikidata links
`about` and `mentions` can carry `sameAs` links to Wikidata to disambiguate entities. A wrong ID points a page at the wrong concept, so the generator emits a link only for IDs marked verified. Verify on a machine with internet: `python scripts/schema_generator.py --spec spec.json --entities entities.json --verify`. IDs the script ships with are unverified starting points. For any entity missing from the registry, add `"entity_overrides": {"Name": "Q123"}` to the spec after checking the ID on wikidata.org.

## 5. What not to mark up
No Review/AggregateRating without real reviews, no Person with invented credentials, no markup for content not visible on the page.
