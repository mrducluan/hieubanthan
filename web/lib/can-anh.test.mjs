import assert from "node:assert/strict";
import test from "node:test";
import { apDiem, cssCan, kep01, tinhCan } from "./can-anh.ts";

const gan = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);

test("tinhCan: hai góc đúng bằng hai góc khung → phép đồng nhất", () => {
  const c = tinhCan([0, 0], [1, 1]);
  assert.deepEqual(c, { x1: 0, y1: 0, sx: 1, sy: 1 });
  assert.equal(cssCan(c), "scale(1, 1) translate(0%, 0%)");
  assert.equal(cssCan(null), undefined);
  assert.deepEqual(apDiem(null, [0.3, 0.4]), [0.3, 0.4]);
});

test("tinhCan: trường hợp thường — p1 về (0,0), p2 về (1,1)", () => {
  const c = tinhCan([0.2, 0.1], [0.7, 0.9]);
  gan(c.sx, 2); gan(c.sy, 1.25);
  const a = apDiem(c, [0.2, 0.1]), b = apDiem(c, [0.7, 0.9]), m = apDiem(c, [0.45, 0.5]);
  gan(a[0], 0); gan(a[1], 0); gan(b[0], 1); gan(b[1], 1); gan(m[0], 0.5); gan(m[1], 0.5);
  assert.equal(cssCan(c), "scale(2, 1.25) translate(-20%, -10%)");
});

test("tinhCan: góc sau không nằm dưới – phải đủ xa → null", () => {
  assert.equal(tinhCan([0.5, 0.5], [0.4, 0.9]), null);   // lệch trái
  assert.equal(tinhCan([0.5, 0.5], [0.9, 0.4]), null);   // lệch lên
  assert.equal(tinhCan([0.5, 0.5], [0.53, 0.9]), null);  // quá gần theo chiều ngang
  assert.equal(tinhCan([0.5, 0.5], [0.5, 0.5]), null);
  assert.equal(tinhCan([-0.1, 0], [1, 1]), null);
  assert.equal(tinhCan([0, 0], [Number.NaN, 1]), null);
  assert.ok(tinhCan([0.5, 0.5], [0.56, 0.56]));
});

test("kep01", () => {
  assert.equal(kep01(-1), 0); assert.equal(kep01(2), 1); assert.equal(kep01(0.3), 0.3);
});
