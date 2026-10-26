#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""QC validator for metaphysics SEO / AEO / GEO articles written in Markdown.

Usage:
    python seo_geo_qc_validator.py article.md [--keyword "kw"] [--site example.com]
        [--banned-file list.txt|kb.json] [--skip table,faq] [--strict] [--json]

Optional front matter keys: title, meta_title, meta_description, slug.
Exit code: 0 = no FAIL, 1 = at least one FAIL (or WARN with --strict), 2 = bad input.
Standard library only.
"""
import argparse
import json
import re
import statistics
import sys
import unicodedata
from pathlib import Path

PASS, WARN, FAIL = "PASS", "WARN", "FAIL"

# Regexes, matched against lower-cased prose. Keep the list short and specific.
BANNED_PATTERNS = [
    r"trong bức tranh toàn cảnh", r"trong thời đại ngày nay", r"trong thế giới hiện đại",
    r"trong thế giới ngày nay", r"hãy cùng (khám phá|tìm hiểu)", r"tóm lại[,:]",
    r"nhìn chung[,:]", r"không thể phủ nhận", r"bài viết này sẽ giúp bạn",
    r"như chúng ta đã biết", r"chắc hẳn bạn", r"đóng vai trò (vô cùng |rất )?quan trọng",
    r"không chỉ[^.!?\n]{0,120}?mà còn",
]

# Guarantees of disaster and disease named as a prediction.
FEAR_PATTERNS = [
    r"(chắc chắn|nhất định|tất yếu|sớm muộn gì cũng)\s+(sẽ\s+)?(bị\s+|phải\s+)?"
    r"(ly hôn|ly dị|phá sản|mất việc|mất tiền|chết|tai nạn|goá|góa|bệnh nặng)",
    r"(ly hôn|ly dị|phá sản)\s+là\s+(điều\s+)?(chắc chắn|không thể tránh)",
    r"không thể tránh khỏi", r"hết cứu", r"mạng yểu", r"chết (yểu|sớm)",
    r"số (khổ|goá|góa|hẩm hiu|chết)", r"đại hạn (chết|tử)",
]
DIAGNOSIS_PATTERNS = [
    r"(bị|mắc)\s+(bệnh\s+)?(ung thư|tiểu đường|tim mạch|đột quỵ|trầm cảm|ung bướu|gan nhiễm mỡ|suy thận)",
]
HEALTH_WORDS = r"(sức khoẻ|sức khỏe|bệnh|cơ thể)"
DOCTOR_WORDS = r"(bác sĩ|bác sỹ|y tế|chuyên gia y|thay thế (lời|tư vấn))"

FAQ_HEADING = re.compile(r"^(#{2,3})\s+.*(faq|câu hỏi thường gặp|hỏi đáp|hỏi nhanh).*$", re.I | re.M)
SOURCE_HEADING = re.compile(r"^#{2,3}\s+.*(nguồn|tham khảo|sources?|references?).*$", re.I | re.M)


def nfc(text):
    return unicodedata.normalize("NFC", text)


def split_front_matter(text):
    meta = {}
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, re.S)
    if not m:
        return meta, text
    for line in m.group(1).splitlines():
        k, sep, v = line.partition(":")
        if sep:
            meta[k.strip().lower()] = v.strip().strip("\"'")
    return meta, text[m.end():]


def strip_code(text):
    return re.sub(r"(```|~~~).*?\1", "", text, flags=re.S)


def prose(text):
    """Plain sentences only: no code, tables, headings, link syntax or markup."""
    t = strip_code(text)
    t = "\n".join(l for l in t.splitlines() if not l.lstrip().startswith("|"))
    t = re.sub(r"^\s{0,3}#{1,6}\s+.*$", "", t, flags=re.M)
    t = re.sub(r"^\s*([-*+]|\d+[.)])\s+", "", t, flags=re.M)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", t)
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"[*_`>]", "", t)
    return t


def sentences(text):
    # Split on . ! ? only when followed by whitespace/end, so 29.5 and 1.8 stay whole.
    parts = re.split(r"(?<=[.!?…])\s+|\n{2,}|\n", text)
    return [s.strip() for s in parts if len(s.split()) >= 3]


def headings(text):
    out = []
    for m in re.finditer(r"^(#{1,6})\s+(.*?)\s*#*\s*$", strip_code(text), re.M):
        out.append((len(m.group(1)), m.group(2).strip()))
    return out


def load_banned_extra(path):
    p = Path(path)
    if p.suffix == ".json":
        data = json.loads(p.read_text(encoding="utf-8"))
        items = data.get("cum_cam", []) if isinstance(data, dict) else data
    else:
        items = [l.strip() for l in p.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    return [re.escape(nfc(str(i)).lower()) for i in items]


# ----------------------------- individual checks -----------------------------
def check_h1(meta, body):
    n = sum(1 for lvl, _ in headings(body) if lvl == 1)
    if n == 0 and meta.get("title"):
        return PASS, "title comes from front matter"
    if n == 1:
        return PASS, "one H1"
    return FAIL, f"{n} H1 headings, expected exactly 1"


def check_headings(body):
    hs = headings(body)
    issues, prev, seen = [], 0, {}
    for lvl, title in hs:
        if not title:
            issues.append("empty heading")
        if prev and lvl - prev > 1:
            issues.append(f"level jumps H{prev}->H{lvl} at '{title[:40]}'")
        key = title.lower()
        seen[key] = seen.get(key, 0) + 1
        prev = lvl
    issues += [f"duplicate heading '{k[:40]}'" for k, v in seen.items() if v > 1]
    return (WARN, "; ".join(issues)) if issues else (PASS, f"{len(hs)} headings in order")


def check_direct_answer(body):
    clean = strip_code(body)
    m = re.search(r"^##(?!#)\s+.+$", clean, re.M)
    if not m:
        return FAIL, "no H2 found"
    para = clean[m.end():].strip().split("\n\n")[0].strip()
    bold = re.fullmatch(r"\*\*(.+?)\*\*", para, re.S)
    if not bold or "**" in bold.group(1):
        return FAIL, "first paragraph under the first H2 is not entirely bold"
    plain = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", bold.group(1))
    n = len(plain.split())
    if 40 <= n <= 60:
        return PASS, f"{n} words"
    if 35 <= n <= 65:
        return WARN, f"{n} words, target 40-60"
    return FAIL, f"{n} words, target 40-60"


def check_cliches(text, extra):
    low = nfc(prose(text)).lower()
    hits = sorted({m.group(0) for p in BANNED_PATTERNS + extra for m in re.finditer(p, low)})
    return (FAIL, "found: " + "; ".join(hits)) if hits else (PASS, "none")


def check_fear(text):
    low = nfc(prose(text)).lower()
    hits = sorted({m.group(0) for p in FEAR_PATTERNS + DIAGNOSIS_PATTERNS for m in re.finditer(p, low)})
    if hits:
        return FAIL, "found: " + "; ".join(hits)
    if re.search(HEALTH_WORDS, low) and not re.search(DOCTOR_WORDS, low):
        return WARN, "health topic without a 'does not replace a doctor' line"
    return PASS, "none"


def check_table(body):
    return (PASS, "table present") if re.search(r"^\|.+\|\s*\n\|[\s:|-]+\|", strip_code(body), re.M) \
        else (FAIL, "no Markdown comparison table")


def link_lists(body, site):
    links = re.findall(r"(?<!!)\[[^\]]+\]\(([^)\s]+)", strip_code(body))
    internal, external = [], []
    for u in links:
        if u.startswith(("#", "mailto:")):
            continue
        if u.startswith("/") or (site and site in u):
            internal.append(u)
        elif u.startswith("http"):
            external.append(u)
        else:
            internal.append(u)
    return internal, external


def check_internal(body, site):
    internal, _ = link_lists(body, site)
    return (PASS, f"{len(internal)} internal links") if len(internal) >= 2 \
        else (WARN, f"{len(internal)} internal links, want at least 2")


def check_sources(body, site):
    _, external = link_lists(body, site)
    if external or SOURCE_HEADING.search(strip_code(body)):
        return PASS, f"{len(external)} external links / sources section"
    return WARN, "no external link and no Sources section"


def check_faq(body):
    clean = strip_code(body)
    m = FAQ_HEADING.search(clean)
    if not m:
        return WARN, "no FAQ section"
    level = len(m.group(1))
    rest = clean[m.end():]
    end = re.search(rf"^#{{1,{level}}}\s", rest, re.M)
    section = rest[:end.start()] if end else rest
    q = re.findall(r"^(?:#{3,4}\s+.+\?\s*$|\*\*[^*\n]+\?\*\*|[-*]\s+\*\*[^*\n]+\?\*\*)", section, re.M)
    n = len(q)
    return (PASS, f"{n} questions") if 3 <= n <= 5 else (WARN, f"{n} questions, want 3-5")


def check_keyword(meta, body, keyword):
    kw = nfc(keyword).lower()
    hs = headings(body)
    h1 = next((t for l, t in hs if l == 1), meta.get("title", ""))
    words = nfc(prose(body)).lower().split()
    first100 = " ".join(words[:100])
    issues = []
    if kw not in nfc(h1).lower():
        issues.append("keyword not in H1")
    if kw not in first100:
        issues.append("keyword not in first 100 words")
    total = " ".join(words)
    density = total.count(kw) * len(kw.split()) / max(len(words), 1) * 100
    if density > 3:
        issues.append(f"density {density:.1f}% looks stuffed")
    return (WARN, "; ".join(issues)) if issues else (PASS, f"density {density:.1f}%")


def check_meta(meta, args_slug):
    issues, fails = [], []
    mt = meta.get("meta_title")
    if mt and len(mt) > 60:
        issues.append(f"meta title {len(mt)} chars (max 60)")
    md = meta.get("meta_description")
    if md and not 70 <= len(md) <= 155:
        issues.append(f"meta description {len(md)} chars (want 70-155)")
    slug = args_slug or meta.get("slug")
    if slug:
        s = slug.strip("/")
        if not re.fullmatch(r"[a-z0-9]+(?:[-/][a-z0-9]+)*", s):
            fails.append(f"slug '{slug}' must be lowercase ASCII with hyphens")
        if re.search(r"(?<!\d)20\d\d(?!\d)", s):
            issues.append("year in slug (not evergreen)")
    if fails:
        return FAIL, "; ".join(fails + issues)
    if issues:
        return WARN, "; ".join(issues)
    return PASS, "ok" if (mt or md or slug) else "no meta/slug supplied, not checked"


def check_rhythm(text):
    ss = sentences(prose(text))
    if len(ss) < 5:
        return WARN, f"only {len(ss)} sentences, too few to judge"
    wc = [len(s.split()) for s in ss]
    sd, mean = statistics.pstdev(wc), statistics.mean(wc)
    issues = []
    if sd < 6:
        issues.append("monotone sentence lengths, mix short and long")
    longest = max(wc)
    if longest > 60:
        issues.append(f"a sentence has {longest} words")
    return (WARN, f"mean {mean:.1f}, sd {sd:.1f}; " + "; ".join(issues)) if issues \
        else (PASS, f"mean {mean:.1f}, sd {sd:.1f}")


def run_checks(path, args):
    raw = Path(path).read_text(encoding="utf-8")
    meta, body = split_front_matter(nfc(raw))
    extra = []
    if args.banned_file:
        extra = load_banned_extra(args.banned_file)
    checks = [
        ("h1", *check_h1(meta, body)),
        ("headings", *check_headings(body)),
        ("direct_answer", *check_direct_answer(body)),
        ("cliches", *check_cliches(body, extra)),
        ("fear_diagnosis", *check_fear(body)),
        ("table", *check_table(body)),
        ("internal_links", *check_internal(body, args.site)),
        ("sources", *check_sources(body, args.site)),
        ("faq", *check_faq(body)),
        ("meta_slug", *check_meta(meta, args.slug)),
        ("rhythm", *check_rhythm(body)),
    ]
    if args.keyword:
        checks.append(("keyword", *check_keyword(meta, body, args.keyword)))
    skip = {s.strip() for s in (args.skip or "").split(",") if s.strip()}
    checks = [c for c in checks if c[0] not in skip]
    words = len(prose(body).split())
    return [{"id": i, "status": s, "detail": d} for i, s, d in checks], words


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("file")
    ap.add_argument("--keyword")
    ap.add_argument("--site", help="domain counted as internal, e.g. example.com")
    ap.add_argument("--slug")
    ap.add_argument("--banned-file", help="text file (one phrase per line) or JSON with a cum_cam list")
    ap.add_argument("--skip", help="comma-separated check ids to skip")
    ap.add_argument("--strict", action="store_true", help="treat WARN as failure")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    try:
        results, words = run_checks(args.file, args)
    except (OSError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    n = {k: sum(1 for r in results if r["status"] == k) for k in (PASS, WARN, FAIL)}
    if args.json:
        print(json.dumps({"words": words, "summary": n, "checks": results}, ensure_ascii=False, indent=2))
    else:
        print(f"QC report for {args.file} ({words} words)")
        for r in results:
            print(f"[{r['status']:<4}] {r['id']:<15} {r['detail']}")
        print(f"summary: {n[PASS]} pass, {n[WARN]} warn, {n[FAIL]} fail")
    return 1 if n[FAIL] or (args.strict and n[WARN]) else 0


if __name__ == "__main__":
    sys.exit(main())
