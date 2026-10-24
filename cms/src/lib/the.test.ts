import assert from "node:assert/strict";
import { test } from "node:test";
import { gopThe, tachThe } from "./the.ts";

test("tách theo dấu phẩy, chấm phẩy, xuống dòng; bỏ khoảng trắng thừa và mục rỗng", () => {
  assert.deepEqual(tachThe("thần số học, Pythagoras ;  số   đường đời\nnăm cá nhân,,"),
    ["thần số học", "Pythagoras", "số đường đời", "năm cá nhân"]);
  assert.deepEqual(tachThe("   "), []);
  assert.deepEqual(tachThe(""), []);
});

test("chữ dán từ Word/Mac (NFD) được chuẩn hoá NFC", () => {
  const nfd = "thần số học".normalize("NFD");
  assert.notEqual(nfd, "thần số học");
  assert.deepEqual(tachThe(nfd), ["thần số học"]);
});

test("gộp: bỏ trùng không phân biệt hoa thường / dạng dấu, giữ thứ tự cũ", () => {
  const kq = gopThe(["thần số học"], ["Thần Số Học", "Pythagoras", "pythagoras"]);
  assert.deepEqual(kq.ds, ["thần số học", "Pythagoras"]);
  assert.deepEqual(kq.trung, ["Thần Số Học", "pythagoras"]);
  assert.deepEqual(kq.vuot, []);
});

test("gộp: dừng ở số tối đa, báo phần không thêm được", () => {
  const kq = gopThe(["a", "b"], ["c", "d", "e"], 3);
  assert.deepEqual(kq.ds, ["a", "b", "c"]);
  assert.deepEqual(kq.vuot, ["d", "e"]);
});

test("gộp: giá trị cũ không phải mảng (trường chưa có dữ liệu) coi như rỗng", () => {
  assert.deepEqual(gopThe(null, ["a"]).ds, ["a"]);
  assert.deepEqual(gopThe(undefined, []).ds, []);
});
