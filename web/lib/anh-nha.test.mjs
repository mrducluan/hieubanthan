import test from "node:test";
import assert from "node:assert/strict";
import { BASE64_TOI_DA, SO_ANH_TOI_DA, TONG_BASE64_AN_TOAN, boTienToData, kichThuocThuNho, tongKichThuoc, tranBase64MoiAnh } from "./anh-nha.ts";

test("tranBase64MoiAnh: 1–3 ảnh giữ trần 1 triệu / ảnh, 4–6 ảnh tự hạ trần để tổng ≤ 3,6 triệu", () => {
  assert.equal(SO_ANH_TOI_DA, 6);
  assert.equal(tranBase64MoiAnh(1), BASE64_TOI_DA);
  assert.equal(tranBase64MoiAnh(3), BASE64_TOI_DA);
  assert.equal(tranBase64MoiAnh(4), 900_000);
  assert.equal(tranBase64MoiAnh(6), 600_000);
  for (let n = 1; n <= SO_ANH_TOI_DA; n++) assert.ok(tranBase64MoiAnh(n) * n <= TONG_BASE64_AN_TOAN, `n=${n} vượt tổng`);
});

test("tranBase64MoiAnh: số lạ (0, 7, số âm, NaN, vô cực) được kẹp về 1..6, không bao giờ trả NaN", () => {
  assert.equal(tranBase64MoiAnh(0), BASE64_TOI_DA);
  assert.equal(tranBase64MoiAnh(-3), BASE64_TOI_DA);
  assert.equal(tranBase64MoiAnh(7), 600_000);
  assert.equal(tranBase64MoiAnh(100), 600_000);
  assert.equal(tranBase64MoiAnh(NaN), BASE64_TOI_DA);
  assert.equal(tranBase64MoiAnh(Infinity), BASE64_TOI_DA);
  assert.equal(tranBase64MoiAnh(2.4), BASE64_TOI_DA);
});

test("kichThuocThuNho: cạnh dài về ≤ 1280, giữ tỉ lệ, ảnh nhỏ không phóng to", () => {
  assert.deepEqual(kichThuocThuNho(4000, 3000), [1280, 960]);
  assert.deepEqual(kichThuocThuNho(3000, 4000), [960, 1280]);
  assert.deepEqual(kichThuocThuNho(800, 600), [800, 600]);
  assert.deepEqual(kichThuocThuNho(1280, 1280), [1280, 1280]);
  assert.deepEqual(kichThuocThuNho(0, 0), [1, 1]);
  assert.deepEqual(kichThuocThuNho(5000, 10), [1280, 3]);
  assert.deepEqual(kichThuocThuNho(2000, 1000, 500), [500, 250]);
});

test("boTienToData & tongKichThuoc", () => {
  assert.equal(boTienToData("data:image/jpeg;base64,AAAA"), "AAAA");
  assert.equal(boTienToData("AAAA"), "AAAA");
  assert.equal(tongKichThuoc([{ du_lieu: "abc" }, { du_lieu: "de" }]), 5);
});
