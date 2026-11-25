import assert from "node:assert/strict";
import test from "node:test";
import { boBanCong, boSoDo } from "./lui-so-do.ts";

test("boSoDo: bỏ sơ đồ ở bo_cuc và nha.bo_cuc, không có thì null", () => {
  assert.deepEqual(boSoDo({ bo_cuc: { vi_tri: {}, so_do: { rong: 5 } }, goc_nhin: "sach_xua" }), { bo_cuc: { vi_tri: {} }, goc_nhin: "sach_xua" });
  assert.deepEqual(boSoDo({ nha: { huong: "Nam", bo_cuc: { so_do: {}, dau_hieu: {} } } }), { nha: { huong: "Nam", bo_cuc: { dau_hieu: {} } } });
  assert.equal(boSoDo({ bo_cuc: { vi_tri: {} } }), null);
  assert.equal(boSoDo(null), null);
});

test("boBanCong: bỏ chỗ ban công, tầng rỗng bỏ luôn, không có thì null", () => {
  const yc = { tang: [{ so: 1, vat: [{ loai: "bep", diem: [0.1, 0.1] }, { loai: "ban_cong", diem: [0.5, 0.9] }] }, { so: 2, vat: [{ loai: "ban_cong", diem: [0, 0] }] }] };
  assert.deepEqual(boBanCong(yc), { tang: [{ so: 1, vat: [{ loai: "bep", diem: [0.1, 0.1] }] }] });
  assert.equal(boBanCong({ tang: [{ so: 1, vat: [{ loai: "bep" }] }] }), null);
  assert.equal(boBanCong({ tang: [{ so: 1, vat: [{ loai: "ban_cong" }] }] }), null);
});
