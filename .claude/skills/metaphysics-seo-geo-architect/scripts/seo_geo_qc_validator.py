#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO, AEO & GEO Automated Quality Control (QC) Validator for Metaphysics Content.
Checks:
1. Banned AI Clichés (Vietnamese LLM filler phrases)
2. Sentence Burstiness (Standard deviation of sentence lengths)
3. AEO Direct Answer Block (40-60 words bolded block after first H2)
4. GEO Structured Table presence
5. Internal Link presence
"""

import re
import sys
import statistics
from pathlib import Path

BANNED_PHRASES = [
    "trong bức tranh toàn cảnh",
    "trong thời đại ngày nay",
    "trong thế giới hiện đại",
    "hãy cùng khám phá",
    "tóm lại,",
    "nhìn chung,",
    "không thể phủ nhận rằng",
    "bài viết này sẽ giúp bạn",
    "như chúng ta đã biết"
]

def check_banned_phrases(text: str) -> list:
    lower_text = text.lower()
    return [phrase for phrase in BANNED_PHRASES if phrase in lower_text]

def calculate_burstiness(text: str) -> dict:
    clean_text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    clean_text = re.sub(r"\|.*?\|", "", clean_text)
    sentences = [s.strip() for s in re.split(r"[.!?]+", clean_text) if len(s.strip().split()) > 2]
    if len(sentences) < 5:
        return {"mean": 0, "stdev": 0, "status": "FAIL (Too few sentences)"}
    word_counts = [len(s.split()) for s in sentences]
    mean_len = round(statistics.mean(word_counts), 2)
    stdev_len = round(statistics.stdev(word_counts), 2)
    status = "PASS" if stdev_len >= 7.5 else "WARN (Low burstiness - vary short and long sentences)"
    return {"mean": mean_len, "stdev": stdev_len, "status": status}

def check_aeo_direct_answer(text: str) -> dict:
    h2_match = re.search(r"^##\s+.+$", text, flags=re.MULTILINE)
    if not h2_match:
        return {"status": "FAIL", "reason": "No H2 heading found"}
    after_h2 = text[h2_match.end():].strip()
    bold_match = re.match(r"^\*\*(.+?)\*\*", after_h2, flags=re.DOTALL)
    if not bold_match:
        return {"status": "FAIL", "reason": "First paragraph after first H2 is not bolded Direct Answer"}
    word_count = len(bold_match.group(1).split())
    if 38 <= word_count <= 68:
        return {"status": "PASS", "word_count": word_count}
    return {"status": "WARN", "word_count": word_count, "reason": "Target 40-60 words for optimal AEO snippet"}

def check_geo_features(text: str) -> dict:
    has_table = bool(re.search(r"\|.*\|.*\n\|[\s:|-]+\|", text))
    internal_links = re.findall(r"\[([^\]]+)\]\((/[^)]+)\)", text)
    return {
        "has_comparison_table": "PASS" if has_table else "FAIL",
        "internal_links_count": len(internal_links),
        "internal_links": internal_links
    }

def audit_markdown_file(filepath: str):
    text = Path(filepath).read_text(encoding="utf-8")
    banned = check_banned_phrases(text)
    burstiness = calculate_burstiness(text)
    aeo = check_aeo_direct_answer(text)
    geo = check_geo_features(text)

    print("=== METAPHYSICS SEO/AEO/GEO QC REPORT ===")
    print(f"1. Anti-AI Clichés Check: {'PASS' if not banned else f'FAIL ({banned})'}")
    print(f"2. Rhythm & Burstiness : {burstiness['status']} (Mean: {burstiness['mean']} words, StDev: {burstiness['stdev']})")
    print(f"3. AEO Direct Answer   : {aeo}")
    print(f"4. GEO Table & Links   : {geo}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python seo_geo_qc_validator.py <path_to_article.md>")
        sys.exit(1)
    audit_markdown_file(sys.argv[1])
