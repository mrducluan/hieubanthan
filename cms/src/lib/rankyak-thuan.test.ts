// RY-1 — kiểm bí mật webhook RankYak, đọc thân sự kiện, ngày đăng, bỏ H1 đầu bài.
import assert from "node:assert/strict";
import { test } from "node:test";
import { boH1Dau, daToiNgay, docSuKien, dungBiMatRankYak, tenHeader } from "./rankyak-thuan.ts";

const BI = "0123456789abcdef0123456789abcdef";
const env = { RANKYAK_WEBHOOK_SECRET: BI };

test("bí mật nằm ở header bất kỳ (nguyên chuỗi hoặc Bearer) → đúng", () => {
  assert.equal(dungBiMatRankYak(new Headers({ "x-rankyak-secret": BI }), env), true);
  assert.equal(dungBiMatRankYak(new Headers({ authorization: `Bearer ${BI}` }), env), true);
  assert.equal(dungBiMatRankYak(new Headers({ "x-webhook-secret": ` ${BI} ` }), env), true);
});

test("sai / thiếu bí mật, env thiếu hoặc quá ngắn → sai", () => {
  assert.equal(dungBiMatRankYak(new Headers({ "x-rankyak-secret": `${BI}x` }), env), false);
  assert.equal(dungBiMatRankYak(new Headers({ "content-type": "application/json" }), env), false);
  assert.equal(dungBiMatRankYak(new Headers({ authorization: "Bearer " }), { RANKYAK_WEBHOOK_SECRET: "" }), false);
  assert.equal(dungBiMatRankYak(new Headers({ "x-s": "ngan" }), { RANKYAK_WEBHOOK_SECRET: "ngan" }), false);
});

test("tên header ghi log không kèm giá trị", () => {
  assert.deepEqual(tenHeader(new Headers({ "x-b": BI, "x-a": "1" })), ["x-a", "x-b"]);
});

test("thân bọc {event, status, article}, thân bài trần, lượt thử không bài", () => {
  const bai = { id: 12, title: "T", html: "<p>a</p>" };
  assert.deepEqual(docSuKien({ event: "article.updated", status: "published", article: bai }),
    { event: "article.updated", status: "published", article: bai });
  assert.equal(docSuKien(bai).event, "article.published");
  assert.equal(docSuKien(bai).article?.id, 12);
  assert.deepEqual(docSuKien({ event: "test" }), { event: "test", status: null, article: null });
  assert.equal(docSuKien(null).article, null);
  assert.equal(docSuKien({ event: "article.published", article: { id: 1 } }).article, null);   // thiếu tiêu đề + html
});

test("bài tới ngày đăng: có published_at, hoặc publish_at đã qua", () => {
  const nay = Date.parse("2026-11-21T00:00:00Z");
  assert.equal(daToiNgay({ id: 1, published_at: "2026-11-20T00:00:00Z" }, nay), true);
  assert.equal(daToiNgay({ id: 1, publish_at: "2026-11-20T00:00:00Z" }, nay), true);
  assert.equal(daToiNgay({ id: 1, publish_at: "2026-11-30T00:00:00Z" }, nay), false);
  assert.equal(daToiNgay({ id: 1 }, nay), false);
});

test("bỏ H1 tiêu đề ở đầu thân, giữ phần còn lại", () => {
  assert.equal(boH1Dau("<h1>Tiêu đề</h1><p>Mở bài</p>"), "<p>Mở bài</p>");
  assert.equal(boH1Dau("<div><h1 class='x'>T</h1><p>a</p></div>"), "<div><p>a</p></div>");
  assert.equal(boH1Dau("<p>a</p><h1>giữa bài</h1>"), "<p>a</p><h1>giữa bài</h1>");
});
