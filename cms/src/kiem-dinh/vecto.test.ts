// CMS-4: "bài liên quan theo nghĩa" bằng vectơ từ khoá có trọng số (không AI, không pgvector).
import assert from "node:assert/strict";
import { test } from "node:test";
import { doGiong, tachTu, vectoBai, xepHang } from "./vecto.ts";

const BAI = (tieu_de: string, the: string[], than = "") => ({ tieu_de, the, noi_dung: { root: { children: [
  { type: "paragraph", children: [{ type: "text", text: than }] }] } } });

test("tách từ: chữ thường NFC, bỏ hư từ, có cụm hai âm tiết", () => {
  const t = tachTu("Số Chủ Đạo 7 và tình yêu của bạn");
  assert.ok(t.includes("chủ") && t.includes("chủ đạo") && t.includes("tình yêu"));
  assert.ok(!t.includes("và") && !t.includes("của") && !t.includes("bạn"));
});

test("vectơ: tiêu đề/thẻ nặng hơn thân bài, tối đa 40 mục, số gọn", () => {
  const v = vectoBai(BAI("Số chủ đạo 7", ["thần số"], "nghề nghiệp ".repeat(30)));
  assert.ok((v["chủ đạo"] ?? 0) > 0);
  assert.ok(Object.keys(v).length <= 40);
  assert.ok(Object.values(v).every((x) => Number.isFinite(x) && x > 0));
});

test("độ giống: cùng chủ đề > khác chủ đề; xếp hạng bỏ chính nó", () => {
  const a = vectoBai(BAI("Số chủ đạo 7 trong tình yêu", ["thần số", "tình yêu"], "người số 7 cần không gian riêng trong tình yêu"));
  const b = vectoBai(BAI("Số chủ đạo 7 hợp nghề gì", ["thần số"], "số chủ đạo 7 hợp nghiên cứu"));
  const c = vectoBai(BAI("Hướng nhà hợp tuổi Giáp Tý", ["phong thuỷ"], "hướng nhà, mệnh quái, bát trạch"));
  assert.ok(doGiong(a, b) > doGiong(a, c));
  assert.equal(doGiong(a, {}), 0);
  const ds = xepHang(a, [{ id: 1, v: a }, { id: 2, v: b }, { id: 3, v: c }], 1);
  assert.deepEqual(ds.map((x) => x.id), [2]);                       // bài không chung từ nào (điểm 0) bị bỏ
});
