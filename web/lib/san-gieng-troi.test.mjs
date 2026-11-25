import assert from "node:assert/strict";
import test from "node:test";
import { daiTai, doiCao, doiSan, hopLe, keoMep, khoiVe, themSan, xoaSan, TOI_DA_SAN } from "./san-gieng-troi.ts";

test("hopLe: khớp điều kiện engine", () => {
  assert.equal(hopLe([]), true);
  assert.equal(hopLe([[0.3, 0.4], [0.65, 0.75]]), true);
  assert.equal(hopLe([[0.4, 0.3]]), false);
  assert.equal(hopLe([[0, 0.2]]), false);
  assert.equal(hopLe([[0.8, 1]]), false);
  assert.equal(hopLe([[0.2, 0.4], [0.3, 0.5]]), false);
});

test("themSan: dải ~1,2 m giữa tại điểm chạm, kẹp trong nhà, chạm trúng dải cũ thì không thêm", () => {
  const r = themSan([], 0.5, 20);
  assert.ok(r);
  assert.equal(r.i, 0);
  assert.ok(Math.abs(r.ds[0][1] - r.ds[0][0] - 0.06) < 1e-6);
  assert.ok(Math.abs((r.ds[0][0] + r.ds[0][1]) / 2 - 0.5) < 1e-6);
  const sat = themSan([], 0.0, 20);              // chạm sát mặt trước → dời vào trong
  assert.ok(sat && sat.ds[0][0] > 0 && hopLe(sat.ds));
  assert.equal(themSan(r.ds, 0.5, 20), null);    // trúng dải cũ
  const hai = themSan(r.ds, 0.2, 20);
  assert.ok(hai && hai.i === 0 && hai.ds.length === 2 && hopLe(hai.ds));
});

test("themSan: không quá 14 dải, khe quá hẹp thì null", () => {
  let ds = [];
  for (let k = 0; k < 20; k++) { const r = themSan(ds, (k + 0.5) / 20, 100); if (r) ds = r.ds; }
  assert.ok(ds.length <= TOI_DA_SAN && hopLe(ds));
  assert.equal(themSan([[0.3, 0.4], [0.42, 0.6]], 0.41, 20), null);
});

test("doiSan / keoMep / doiCao: không chồng dải bên cạnh, không chạm mép nhà", () => {
  const ds = [[0.3, 0.4], [0.65, 0.75]];
  const d = doiSan(ds, 0, 0.6, 20);
  assert.ok(hopLe(d) && d[0][1] < d[1][0]);
  const t = doiSan(ds, 0, -1, 20);
  assert.ok(t[0][0] > 0);
  const m = keoMep(ds, 1, "duoi", 2, 20);
  assert.ok(m[1][1] < 1 && hopLe(m));
  const n = keoMep(ds, 1, "tren", 0.74, 20);
  assert.ok(n[1][1] - n[1][0] >= 0.4 / 20 - 1e-9);
  const c = doiCao(ds, 0, 0.5, 20);
  assert.ok(c[0][1] - c[0][0] > 0.1 && hopLe(c));
  assert.deepEqual(xoaSan(ds, 0), [[0.65, 0.75]]);
});

test("daiTai + khoiVe", () => {
  const ds = [[0.3, 0.4], [0.65, 0.75]];
  assert.equal(daiTai(ds, 0.35), 0);
  assert.equal(daiTai(ds, 0.5), -1);
  assert.deepEqual(khoiVe(ds), [[0, 0.3], [0.4, 0.65], [0.75, 1]]);
  assert.deepEqual(khoiVe([]), [[0, 1]]);
});
