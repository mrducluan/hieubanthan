import { test } from "node:test";
import assert from "node:assert/strict";
import { chenSauMoDau, coVideo, VIDEO_KW6T } from "./video-kw6t.ts";
import { readdirSync, readFileSync } from "node:fs";
import { maYoutube } from "../lib/video.ts";

test("KW-6T video: đủ 8 bài, slug khớp lô KW-6T, mã YouTube hợp lệ, không trùng", () => {
  const thu = new URL("kw6t/", import.meta.url);
  const slug = new Set(readdirSync(thu).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(new URL(f, thu), "utf8")).slug));
  assert.equal(VIDEO_KW6T.length, 8);
  assert.equal(new Set(VIDEO_KW6T.map((v) => v.ma)).size, 8);
  for (const v of VIDEO_KW6T) {
    assert.ok(slug.has(v.slug), v.slug);
    assert.equal(maYoutube(`https://youtube.com/shorts/${v.ma}?feature=share`), v.ma);
    assert.ok(v.tieu_de.length <= 120 && v.chu_thich.length <= 200);
  }
});

test("KW-6T video: chèn sau đoạn mở đầu, nhận ra video đã có", () => {
  const goc = [{ type: "heading" }, { type: "paragraph" }, { type: "heading" }];
  const khoi = { type: "block", fields: { blockType: "video", url: "https://www.youtube.com/shorts/G_ObyI__Zhk" } };
  const ra = chenSauMoDau(goc, khoi);
  assert.deepEqual(ra.map((n) => n.type), ["heading", "paragraph", "block", "heading"]);
  assert.ok(coVideo(ra, "G_ObyI__Zhk"));
  assert.ok(!coVideo(goc, "G_ObyI__Zhk"));
  assert.equal(chenSauMoDau([{ type: "heading" }], khoi)[0], khoi);
});
