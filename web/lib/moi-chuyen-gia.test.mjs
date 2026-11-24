import test from "node:test";
import assert from "node:assert/strict";
import { nenMoiChuyenGia } from "./moi-chuyen-gia.ts";

const ban = { ai: "ban", van: "hỏi" };
const tl = { ai: "he", van: "trả lời" };

test("mời sau 2 câu trả lời thường", () => {
  assert.equal(nenMoiChuyenGia([ban, tl], false), false);
  assert.equal(nenMoiChuyenGia([ban, tl, ban, tl], false), true);
  assert.equal(nenMoiChuyenGia([ban, tl, ban, tl], true), false);   // đang chờ trả lời
});

test("không bao giờ mời nếu phiên có câu khủng hoảng / từ chối / hỗ trợ", () => {
  assert.equal(nenMoiChuyenGia([ban, tl, ban, { ai: "he", van: "Bạn không một mình…", dacBiet: true }, ban, tl], false), false);
  assert.equal(nenMoiChuyenGia([ban, { ai: "he", van: "x", hoTro: "988" }, ban, tl, ban, tl], false), false);
});

test("câu lỗi / hết lượt không tính; máy chưa chắc hiểu câu thì mời", () => {
  assert.equal(nenMoiChuyenGia([ban, { ai: "he", loi: "Lỗi" }, ban, tl], false), false);
  assert.equal(nenMoiChuyenGia([ban, { ai: "he", van: "x", hoiLai: { cau: "?", chon: [] } }], false), true);
});
