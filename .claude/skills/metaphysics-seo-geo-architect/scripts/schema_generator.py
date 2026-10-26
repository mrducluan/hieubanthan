#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Semantic Knowledge Graph JSON-LD Generator for Eastern & Western Metaphysics Articles.
Automatically maps common metaphysics entities to their official Wikidata URIs for GEO/RAG citation.
"""

import json

WIKIDATA_PREFIX = "https://" + "www.wikidata.org/wiki/"
SCHEMA_CONTEXT = "https://" + "schema.org"

WIKIDATA_ENTITY_QIDS = {
    "Tử Vi Đẩu Số": "Q718998",
    "Bát Tự": "Q1109480",
    "Kinh Dịch": "Q184363",
    "Phong Thủy": "Q170539",
    "Chiêm tinh học": "Q34362",
    "Tarot": "Q131117",
    "Thần số học": "Q182448",
    "Sao Thổ": "Q193",
    "Sao Thủy nghịch hành": "Q1075956",
    "Carl Jung": "Q41532"
}

def generate_schema(page_slug: str, headline: str, description: str, author_name: str, primary_entities: list, mentioned_entities: list, faqs: list) -> str:
    about_list = [
        {"@type": "Thing", "name": name, "sameAs": WIKIDATA_PREFIX + WIKIDATA_ENTITY_QIDS.get(name, "")}
        for name in primary_entities
    ]
    mentions_list = [
        {"@type": "Thing", "name": name, "sameAs": WIKIDATA_PREFIX + WIKIDATA_ENTITY_QIDS.get(name, "")}
        for name in mentioned_entities
    ]
    faq_entities = [
        {
            "@type": "Question",
            "name": item["question"],
            "acceptedAnswer": {"@type": "Answer", "text": item["answer"]}
        }
        for item in faqs
    ]

    schema = {
        "@context": SCHEMA_CONTEXT,
        "@graph": [
            {
                "@type": "Article",
                "@id": f"{page_slug}#article",
                "headline": headline,
                "description": description,
                "author": {
                    "@type": "Person",
                    "name": author_name,
                    "jobTitle": "Senior Metaphysics & Psychological Astrology Advisor"
                },
                "reviewedBy": {
                    "@type": "Organization",
                    "name": "Hội Đồng Thẩm Định Học Thuật Huyền Học Ứng Dụng"
                },
                "about": about_list,
                "mentions": mentions_list
            },
            {
                "@type": "FAQPage",
                "@id": f"{page_slug}#faq",
                "mainEntity": faq_entities
            }
        ]
    }
    return json.dumps(schema, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    sample = generate_schema(
        page_slug="/khong-kiep-cung-quan-loc-gap-tuan-triet/",
        headline="Địa Không Địa Kiếp Cung Quan Lộc Gặp Tuần Triệt Tuổi 30",
        description="Giải mã chi tiết Địa Không Địa Kiếp cung Quan Lộc gặp Tuần Triệt ở ngưỡng tuổi 30.",
        author_name="Chuyên Gia Nghiên Cứu Mệnh Lý Đông - Tây",
        primary_entities=["Tử Vi Đẩu Số"],
        mentioned_entities=["Chiêm tinh học", "Sao Thổ", "Carl Jung"],
        faqs=[
            {
                "question": "Cung Quan Lộc Vô Chính Diệu có Không Kiếp gặp Tuần Triệt thì tốt hay xấu?",
                "answer": "Tạo thành cách cục sát tinh chế ngự không vong, giúp đương số nhạy bén và dễ bứt phá trong lĩnh vực công nghệ, cải tổ."
            }
        ]
    )
    print(sample)
