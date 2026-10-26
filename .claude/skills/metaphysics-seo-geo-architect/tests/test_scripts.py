import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import seo_geo_qc_validator as qc  # noqa: E402
import schema_generator as sg  # noqa: E402
import check_cannibalization as cc  # noqa: E402

GOOD = os.path.join(ROOT, "examples", "good_article.md")
BAD = os.path.join(ROOT, "examples", "bad_article.md")


def run(main, argv):
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = main(argv)
    return code, out.getvalue(), err.getvalue()


def tmp(text, suffix=".md"):
    f = tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False, encoding="utf-8")
    f.write(text)
    f.close()
    return f.name


def statuses(path, *extra):
    code, out, _ = run(qc.main, [path, "--json", *extra])
    return code, {c["id"]: c["status"] for c in json.loads(out)["checks"]}


class ValidatorTests(unittest.TestCase):
    def test_good_article_passes_strict(self):
        code, _, _ = run(qc.main, [GOOD, "--strict", "--keyword", "sao thổ hồi quy"])
        self.assertEqual(code, 0)

    def test_bad_article_fails_with_exit_1(self):
        code, st = statuses(BAD)
        self.assertEqual(code, 1)
        for k in ("direct_answer", "cliches", "fear_diagnosis", "table"):
            self.assertEqual(st[k], "FAIL", k)

    def test_fear_phrase_is_caught(self):
        p = tmp("# T\n\n## H\n\nAi có sao này chắc chắn sẽ ly hôn và phá sản.\n")
        self.assertEqual(statuses(p)[1]["fear_diagnosis"], "FAIL")

    def test_disease_prediction_is_caught(self):
        p = tmp("# T\n\n## H\n\nNăm nay bạn dễ mắc ung thư nếu gặp sao này.\n")
        self.assertEqual(statuses(p)[1]["fear_diagnosis"], "FAIL")

    def test_health_without_doctor_line_warns(self):
        p = tmp("# T\n\n## H\n\nSao này gắn với sức khoẻ vùng bụng.\n")
        self.assertEqual(statuses(p)[1]["fear_diagnosis"], "WARN")

    def test_decimals_do_not_split_sentences(self):
        ss = qc.sentences("Chu kỳ dài 29.5 năm một vòng quanh Mặt Trời. Câu sau cũng đủ dài rồi.")
        self.assertEqual(len(ss), 2)

    def test_direct_answer_example_inside_code_fence_is_ignored(self):
        p = tmp("# T\n\n```\n## X\n\n**" + "từ " * 50 + "**\n```\n\n## Thật\n\nKhông in đậm.\n")
        self.assertEqual(statuses(p)[1]["direct_answer"], "FAIL")

    def test_two_h1_fail(self):
        p = tmp("# A\n\n# B\n\n## H\n\n**x**\n")
        self.assertEqual(statuses(p)[1]["h1"], "FAIL")

    def test_skip_removes_check(self):
        _, st = statuses(BAD, "--skip", "table,faq")
        self.assertNotIn("table", st)

    def test_banned_file_json_cum_cam(self):
        kb = tmp(json.dumps({"cum_cam": ["năng lượng vũ trụ"]}), ".json")
        p = tmp("# T\n\n## H\n\nBạn nhận năng lượng vũ trụ mỗi ngày.\n")
        self.assertEqual(statuses(p, "--banned-file", kb)[1]["cliches"], "FAIL")

    def test_slug_rules(self):
        p = tmp("---\nslug: Sao-Thổ-2026\n---\n# T\n\n## H\n\n**x**\n")
        self.assertEqual(statuses(p)[1]["meta_slug"], "FAIL")

    def test_missing_file_exit_2(self):
        self.assertEqual(run(qc.main, ["/nonexistent.md"])[0], 2)


SPEC = {
    "url": "https://example.com/a/", "headline": "H", "description": "D",
    "date_published": "2026-01-01",
    "publisher": {"name": "Ex", "url": "https://example.com"},
    "about": ["Sao Thổ", "Nhân tướng học"],
}


class SchemaTests(unittest.TestCase):
    def reg(self):
        return json.loads(json.dumps(sg.DEFAULT_ENTITIES))

    def about(self, doc):
        return next(n for n in doc["@graph"] if n["@type"] == "Article")["about"]

    def test_unverified_and_unknown_entities_have_no_sameas(self):
        doc, warns = sg.build(SPEC, self.reg())
        for a in self.about(doc):
            self.assertNotIn("sameAs", a)
        self.assertEqual(len(warns), 2)

    def test_unknown_entity_never_yields_bare_wikidata_url(self):
        doc, _ = sg.build(SPEC, self.reg(), allow_unverified=True)
        text = json.dumps(doc)
        self.assertNotIn('wiki/"', text)

    def test_verified_entity_gets_sameas(self):
        r = self.reg()
        r["Sao Thổ"]["verified"] = True
        doc, _ = sg.build(SPEC, r)
        self.assertTrue(self.about(doc)[0]["sameAs"].endswith("/Q193"))

    def test_verify_with_fake_fetch(self):
        r = self.reg()
        msgs = sg.verify_entities(r, ["Sao Thổ", "Tarot"], fetch=lambda q: ["saturn", "sao thổ"] if q == "Q193" else ["something else"])
        self.assertTrue(r["Sao Thổ"]["verified"])
        self.assertTrue(r["Tarot"].get("failed"))
        self.assertTrue(any("MISMATCH" in m for m in msgs))
        doc, _ = sg.build(dict(SPEC, about=["Tarot"]), r, allow_unverified=True)
        self.assertNotIn("sameAs", self.about(doc)[0])

    def test_verify_offline_does_not_crash(self):
        def boom(q):
            raise OSError("blocked")
        r = self.reg()
        msgs = sg.verify_entities(r, ["Sao Thổ"], fetch=boom)
        self.assertFalse(r["Sao Thổ"]["verified"])
        self.assertIn("cannot verify", msgs[0])

    def test_no_author_credits_publisher_and_no_reviewer(self):
        doc, _ = sg.build(SPEC, self.reg())
        art = next(n for n in doc["@graph"] if n["@type"] == "Article")
        self.assertEqual(art["author"]["@type"], "Organization")
        self.assertNotIn("reviewedBy", json.dumps(doc))

    def test_reviewer_sits_on_webpage(self):
        doc, _ = sg.build(dict(SPEC, reviewer={"name": "Real Person"}), self.reg())
        wp = next(n for n in doc["@graph"] if n["@type"] == "WebPage")
        self.assertEqual(wp["reviewedBy"]["name"], "Real Person")
        art = next(n for n in doc["@graph"] if n["@type"] == "Article")
        self.assertNotIn("reviewedBy", art)

    def test_validation_errors(self):
        errs = sg.validate({"url": "http://x", "date_published": "01/02/2026"})
        self.assertTrue(any("https" in e for e in errs))
        self.assertTrue(any("ISO" in e for e in errs))
        self.assertTrue(any("headline" in e for e in errs))

    def test_faq_and_breadcrumb_nodes(self):
        spec = dict(SPEC, faqs=[{"question": "Q?", "answer": "A."}],
                    breadcrumbs=[{"name": "Home", "url": "https://example.com/"}])
        doc, _ = sg.build(spec, self.reg())
        types = {n["@type"] for n in doc["@graph"]}
        self.assertTrue({"FAQPage", "BreadcrumbList", "WebPage", "Article"} <= types)


class CannibalizationTests(unittest.TestCase):
    def test_near_duplicate_flagged_and_distinct_not(self):
        rows = [
            {"slug": "/tu-vi/khong-kiep-quan-loc", "keyword": "Địa Không Địa Kiếp cung Quan Lộc"},
            {"slug": "/tu-vi/dia-khong-dia-kiep-cung-quan-loc", "keyword": "địa không địa kiếp ở cung quan lộc"},
            {"slug": "/than-so/duong-doi-33", "keyword": "số đường đời 33 là gì"},
        ]
        found = cc.find_overlaps(rows, [], 0.6)
        self.assertEqual(len(found), 1)

    def test_diacritics_insensitive(self):
        self.assertEqual(cc.norm_tokens("Quan Lộc"), cc.norm_tokens("quan loc"))

    def test_existing_url_compared(self):
        rows = [{"slug": "/tu-vi/cung-quan-loc", "keyword": "cung quan lộc"}]
        found = cc.find_overlaps(rows, ["/tu-vi/cung/quan-loc"], 0.6)
        self.assertEqual(len(found), 1)

    def test_cli_exit_codes(self):
        same = tmp(json.dumps([{"slug": "/a/b-c", "keyword": "b c"}, {"slug": "/x/b-c", "keyword": "b c"}]), ".json")
        self.assertEqual(run(cc.main, [same])[0], 1)
        diff = tmp(json.dumps([{"slug": "/a/foo", "keyword": "foo bar"}, {"slug": "/x/zed", "keyword": "zed qux"}]), ".json")
        self.assertEqual(run(cc.main, [diff])[0], 0)


if __name__ == "__main__":
    unittest.main()
