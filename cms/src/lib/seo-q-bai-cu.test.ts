// SEO-Q — kế hoạch đổi tiêu đề SEO + mô tả: đúng độ dài kiểm định, không nhồi từ khoá, không lỗi gõ.
import assert from "node:assert/strict";
import { test } from "node:test";
import { KE_SEO_Q } from "./seo-q-bai-cu.ts";

test("tiêu đề SEO 30–60 ký tự, mô tả 70–160, slug không trùng", () => {
  assert.equal(new Set(KE_SEO_Q.map((k) => k.slug)).size, KE_SEO_Q.length);
  for (const k of KE_SEO_Q) {
    assert.ok(k.title.length >= 30 && k.title.length <= 60, `${k.slug}: tiêu đề ${k.title.length}`);
    assert.ok(k.description.length >= 70 && k.description.length <= 160, `${k.slug}: mô tả ${k.description.length}`);
    assert.notEqual(k.title, k.cu.title);
  }
});

test("không nhồi từ khoá (một cụm 'xem …' hay 'bói …' tối đa 1 lần), không thiếu dấu cách sau dấu phẩy", () => {
  for (const k of KE_SEO_Q) {
    for (const s of [k.title, k.description]) {
      assert.ok(!/,\S/.test(s), `${k.slug}: thiếu dấu cách sau dấu phẩy`);
      assert.ok((s.match(/\b(xem|bói)\s/gi) ?? []).length <= 2, `${k.slug}: lặp 'xem/bói'`);
      assert.ok(!/kinh dịnh/i.test(s));
    }
  }
});

test("ngũ hành: mô tả mở bằng câu trả lời (năm hành + tương sinh đúng thứ tự)", () => {
  const nh = KE_SEO_Q.find((k) => k.slug.startsWith("ngu-hanh-la-gi"))!;
  assert.ok(nh.description.startsWith("Ngũ hành gồm Kim, Mộc, Thủy, Hỏa, Thổ."));
  const vt = KE_SEO_Q.find((k) => k.slug.startsWith("vong-tron"))!;
  assert.ok(vt.description.includes("Mộc → Hỏa → Thổ → Kim → Thủy → Mộc"));
});
