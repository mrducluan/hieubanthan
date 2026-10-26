#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JSON-LD generator (WebPage + Article + FAQPage + BreadcrumbList) for metaphysics pages.

Usage:
    python schema_generator.py --spec spec.json [--entities entities.json] [--verify]
                               [--allow-unverified] [--script-tag]

Design rules (why this script differs from a naive template):
  * author / reviewer are emitted only when given; nothing is invented.
  * Wikidata sameAs links are emitted only for entities marked verified, because a wrong
    ID points the page at the wrong concept. --verify checks IDs online (needs internet).
  * `reviewedBy` is a schema.org WebPage property, so it sits on the WebPage node.
Standard library only. Exit codes: 0 ok, 2 invalid spec.
"""
import argparse
import json
import re
import sys
import urllib.request
from datetime import date

WIKIDATA = "https://www.wikidata.org/wiki/"
ENTITY_DATA = "https://www.wikidata.org/wiki/Special:EntityData/{}.json"

# Starting points only. ALL are UNVERIFIED: confirm with --verify before relying on them.
# `expect` lists label fragments (any language/alias) that a correct entity must contain.
DEFAULT_ENTITIES = {
    "Tử Vi Đẩu Số": {"qid": "Q718998", "expect": ["zi wei", "purple star"], "verified": False},
    "Bát Tự": {"qid": "Q1109480", "expect": ["four pillars", "bazi", "ba zi"], "verified": False},
    "Kinh Dịch": {"qid": "Q184363", "expect": ["i ching", "book of changes"], "verified": False},
    "Phong Thủy": {"qid": "Q170539", "expect": ["feng shui"], "verified": False},
    "Chiêm tinh học": {"qid": "Q34362", "expect": ["astrology"], "verified": False},
    "Tarot": {"qid": "Q131117", "expect": ["tarot"], "verified": False},
    "Thần số học": {"qid": "Q182448", "expect": ["numerology"], "verified": False},
    "Sao Thổ": {"qid": "Q193", "expect": ["saturn"], "verified": False},
    "Carl Jung": {"qid": "Q41532", "expect": ["carl jung", "carl gustav jung"], "verified": False},
}

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}([T ][\d:.+\-Z]+)?$")


def fetch_labels(qid, opener=urllib.request.urlopen):
    """Return all labels and aliases (lower-case) of a Wikidata entity."""
    req = urllib.request.Request(ENTITY_DATA.format(qid), headers={"User-Agent": "schema-generator/2.0"})
    with opener(req, timeout=15) as r:
        data = json.load(r)
    ent = next(iter(data["entities"].values()))
    names = [v["value"] for v in ent.get("labels", {}).values()]
    for lst in ent.get("aliases", {}).values():
        names += [a["value"] for a in lst]
    return [n.lower() for n in names]


def verify_entities(registry, wanted, fetch=fetch_labels):
    """Mark entries verified when a label/alias contains an expected fragment. Returns messages."""
    msgs = []
    for name in wanted:
        e = registry.get(name)
        if not e or e.get("verified"):
            continue
        try:
            labels = fetch(e["qid"])
        except Exception as exc:  # offline, blocked, bad ID
            msgs.append(f"cannot verify {name} ({e['qid']}): {exc}")
            continue
        if any(frag in lab for lab in labels for frag in e.get("expect", [])):
            e["verified"] = True
            msgs.append(f"verified {name} = {e['qid']}")
        else:
            e["verified"] = False
            e["failed"] = True
            msgs.append(f"MISMATCH {name} = {e['qid']} (labels: {', '.join(labels[:4])})")
    return msgs


def thing(name, registry, overrides, allow_unverified, warnings):
    node = {"@type": "Thing", "name": name}
    if name in overrides:
        node["sameAs"] = WIKIDATA + overrides[name]
        return node
    e = registry.get(name)
    if e and not e.get("failed") and (e.get("verified") or allow_unverified):
        node["sameAs"] = WIKIDATA + e["qid"]
    elif e:
        warnings.append(f"sameAs omitted for '{name}': {e['qid']} is not verified")
    else:
        warnings.append(f"sameAs omitted for '{name}': not in registry (add entity_overrides after checking wikidata.org)")
    return node


def person_or_org(p):
    node = {"@type": p.get("type", "Person"), "name": p["name"]}
    if p.get("url"):
        node["url"] = p["url"]
    if p.get("job_title"):
        node["jobTitle"] = p["job_title"]
    if p.get("same_as"):
        node["sameAs"] = p["same_as"]
    return node


def validate(spec):
    errs = []
    for k in ("url", "headline", "description", "date_published", "publisher"):
        if not spec.get(k):
            errs.append(f"missing '{k}'")
    for k in ("url",):
        if spec.get(k) and not str(spec[k]).startswith("https://"):
            errs.append(f"'{k}' must be an absolute https URL")
    for k in ("date_published", "date_modified"):
        if spec.get(k) and not ISO_DATE.match(spec[k]):
            errs.append(f"'{k}' must be ISO 8601 (YYYY-MM-DD)")
    pub = spec.get("publisher") or {}
    if pub and not (pub.get("name") and pub.get("url")):
        errs.append("publisher needs name and url")
    for f in spec.get("faqs", []):
        if not f.get("question") or not f.get("answer"):
            errs.append("every faq needs question and answer")
    for b in spec.get("breadcrumbs", []):
        if not b.get("name") or not str(b.get("url", "")).startswith("https://"):
            errs.append("every breadcrumb needs a name and an absolute https url")
    return errs


def build(spec, registry, allow_unverified=False):
    warnings = []
    url, lang = spec["url"], spec.get("language", "vi")
    overrides = spec.get("entity_overrides", {})
    pub = {"@type": "Organization", "name": spec["publisher"]["name"], "url": spec["publisher"]["url"]}
    if spec["publisher"].get("logo"):
        pub["logo"] = {"@type": "ImageObject", "url": spec["publisher"]["logo"]}

    article = {
        "@type": "Article", "@id": url + "#article", "headline": spec["headline"][:110],
        "description": spec["description"], "inLanguage": lang,
        "datePublished": spec["date_published"],
        "dateModified": spec.get("date_modified", spec["date_published"]),
        "mainEntityOfPage": {"@id": url + "#webpage"}, "publisher": pub,
        "author": person_or_org(spec["author"]) if spec.get("author") else pub,
    }
    if spec.get("image"):
        article["image"] = spec["image"]
    if spec.get("about"):
        article["about"] = [thing(n, registry, overrides, allow_unverified, warnings) for n in spec["about"]]
    if spec.get("mentions"):
        article["mentions"] = [thing(n, registry, overrides, allow_unverified, warnings) for n in spec["mentions"]]

    webpage = {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": spec["headline"],
               "inLanguage": lang, "mainEntity": {"@id": url + "#article"}}
    if spec.get("reviewer"):
        webpage["reviewedBy"] = person_or_org(spec["reviewer"])

    graph = [webpage, article]
    if spec.get("breadcrumbs"):
        webpage["breadcrumb"] = {"@id": url + "#breadcrumb"}
        graph.append({"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": i, "name": b["name"], "item": b["url"]}
            for i, b in enumerate(spec["breadcrumbs"], 1)]})
    if spec.get("faqs"):
        graph.append({"@type": "FAQPage", "@id": url + "#faq", "mainEntity": [
            {"@type": "Question", "name": f["question"],
             "acceptedAnswer": {"@type": "Answer", "text": f["answer"]}} for f in spec["faqs"]]})
    return {"@context": "https://schema.org", "@graph": graph}, warnings


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--spec", required=True)
    ap.add_argument("--entities", help="JSON registry to load; rewritten after --verify")
    ap.add_argument("--verify", action="store_true", help="check Wikidata IDs online")
    ap.add_argument("--allow-unverified", action="store_true", help="emit sameAs for unverified IDs")
    ap.add_argument("--script-tag", action="store_true", help="wrap output in <script type=application/ld+json>")
    args = ap.parse_args(argv)
    try:
        spec = json.load(open(args.spec, encoding="utf-8"))
        registry = json.load(open(args.entities, encoding="utf-8")) if args.entities else json.loads(json.dumps(DEFAULT_ENTITIES))
    except (OSError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    errs = validate(spec)
    if errs:
        print("invalid spec:\n- " + "\n- ".join(errs), file=sys.stderr)
        return 2
    if args.verify:
        names = list(spec.get("about", [])) + list(spec.get("mentions", []))
        for m in verify_entities(registry, names):
            print(m, file=sys.stderr)
        if args.entities:
            json.dump(registry, open(args.entities, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    doc, warnings = build(spec, registry, args.allow_unverified)
    for w in warnings:
        print("warning: " + w, file=sys.stderr)
    out = json.dumps(doc, ensure_ascii=False, indent=2)
    print(f'<script type="application/ld+json">\n{out}\n</script>' if args.script_tag else out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
