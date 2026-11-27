import test from "node:test";
import assert from "node:assert/strict";
import { coChuViet, loiTheoNgonNgu } from "./loi-ngon-ngu.ts";

test("nhận ra chữ Việt có dấu", () => {
  assert.equal(coChuViet("Chưa tải được"), true);
  assert.equal(coChuViet("Could not load"), false);
  assert.equal(coChuViet("Đ"), true);
});

test("bản Anh không hiện lời tiếng Việt", () => {
  assert.equal(loiTheoNgonNgu("Mất kết nối", true, "Connection error."), "Connection error.");
  assert.equal(loiTheoNgonNgu("Bad input", true, "x"), "Bad input");
  assert.equal(loiTheoNgonNgu("Mất kết nối", false, "x"), "Mất kết nối");
  assert.equal(loiTheoNgonNgu(undefined, false, "dự phòng"), "dự phòng");
  assert.equal(loiTheoNgonNgu({ a: 1 }, true, "fb"), "fb");
});
