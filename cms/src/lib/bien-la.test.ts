// 6b-6: biến lạ trong khối mẫu cụm (vd {nam} trên mẫu "Hướng hợp tuổi theo cung phi") chặn xuất bản.
import assert from "node:assert/strict";
import { test } from "node:test";
import { bienLa, mucBienLa } from "./bien-la.ts";

test("khối dùng biến lạ → lỗi chặn; biến đúng → không lỗi", () => {
  const xau = mucBienLa("Người sinh năm {nam} hợp hướng {tieu_de}", ["tieu_de", "slug"]);
  assert.equal(xau.length, 1);
  assert.equal(xau[0]!.chan, true);
  assert.match(xau[0]!.thong_diep, /\{nam\}/);
  assert.deepEqual(mucBienLa("Về {tieu_de} {slug}", ["tieu_de", "slug"]), []);
  assert.deepEqual(bienLa("{a} {b} {a}", ["b"]), ["a"]);
});
