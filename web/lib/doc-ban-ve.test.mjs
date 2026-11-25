import assert from "node:assert/strict";
import test from "node:test";
import { anhSangKhung, anhSangSoDo, canTuKhung, gocNenXoay, xoayDiem, xoayKetQua } from "./can-anh.ts";

const gan = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);

test("anhSangKhung: ảnh rộng hơn khung → dải trên / dưới trống", () => {
  // ảnh 2:1 trong khung vuông: ảnh chiếm nửa giữa theo chiều cao
  const [x, y] = anhSangKhung([0.5, 0], 200, 100, 10, 10);
  gan(x, 0.5); gan(y, 0.25);
  gan(anhSangKhung([0, 1], 200, 100, 10, 10)[1], 0.75);
});

test("anhSangKhung: ảnh hẹp hơn khung → dải trái / phải trống", () => {
  const [x, y] = anhSangKhung([0, 0.3], 100, 300, 5, 5);   // ảnh 1:3 trong khung vuông
  gan(x, 1 / 3); gan(y, 0.3);
});

test("canTuKhung: đường bao máy thấy → phép căn đưa đường bao trùng khung", () => {
  const k = { x0: 0.1, y0: 0.2, x1: 0.9, y1: 0.8 };
  const can = canTuKhung(k, 100, 100, 1, 1);
  assert.ok(can);
  const p = anhSangSoDo([0.1, 0.2], 100, 100, 1, 1, can);
  gan(p[0], 0); gan(p[1], 0);
  const q = anhSangSoDo([0.5, 0.5], 100, 100, 1, 1, can);
  gan(q[0], 0.5); gan(q[1], 0.5);
  assert.equal(anhSangSoDo([0.02, 0.5], 100, 100, 1, 1, can), null);      // ngoài nhà
});

test("xoayDiem khớp cách canvas xoay (theo kim đồng hồ)", () => {
  assert.deepEqual(xoayDiem([0, 0], 90), [1, 0]);
  const h = xoayDiem([0.2, 0.9], 180); gan(h[0], 0.8); gan(h[1], 0.1);
  assert.deepEqual(xoayDiem([0.3, 0.4], 360), [0.3, 0.4]);
  const v = xoayDiem(xoayDiem([0.3, 0.4], 90), 270); gan(v[0], 0.3); gan(v[1], 0.4);
});

test("gocNenXoay: cửa ở dưới → 180, ở trái → 90, đã ở trên → 0", () => {
  assert.equal(gocNenXoay([0.5, 0.95]), 180);
  assert.equal(gocNenXoay([0.03, 0.5]), 90);
  assert.equal(gocNenXoay([0.5, 0.1]), 0);
  assert.equal(gocNenXoay(null), 0);
  assert.equal(gocNenXoay([0.5, 0.5]), 0);       // giữa ảnh: không đoán
});

test("xoayKetQua: xoay chỗ và đường bao cùng lúc", () => {
  const kq = { cho: [{ ma: "cua_chinh", x: 0.5, y: 0.95, do_tin: 0.9, ly_do: "" }], khung: { x0: 0.1, y0: 0.2, x1: 0.9, y1: 0.8 } };
  const r = xoayKetQua(kq, 180);
  gan(r.cho[0].y, 0.05);
  gan(r.khung.x0, 0.1); gan(r.khung.y0, 0.2); gan(r.khung.x1, 0.9); gan(r.khung.y1, 0.8);
});
