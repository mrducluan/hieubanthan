import assert from "node:assert/strict";
import test from "node:test";
import { boBanCong, boNhieuLop, boSan, boSoDo, gopLui } from "./lui-so-do.ts";

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

test("boNhieuLop / boSan: bỏ trường mới của TY-2 gói 2, không có thì null", () => {
  assert.deepEqual(boNhieuLop({ nha: { huong: "Nam", nhieu_lop: { so_lop: 3, lop_chu: 3 } } }), { nha: { huong: "Nam" } });
  assert.equal(boNhieuLop({ nha: { huong: "Nam" } }), null);
  assert.equal(boNhieuLop({}), null);
  assert.deepEqual(boSan({ khung: { rong: 6, sau: 20, san: [[0.3, 0.4]] }, tang: [] }), { khung: { rong: 6, sau: 20 }, tang: [] });
  assert.equal(boSan({ khung: { rong: 6, sau: 20 } }), null);
});

test("gopLui: áp mọi hàm có việc, không có gì thì null", () => {
  const luanGiai = gopLui(boSoDo, boNhieuLop);
  assert.deepEqual(luanGiai({ nha: { nhieu_lop: { so_lop: 2 }, bo_cuc: { so_do: {}, vi_tri: {} } } }), { nha: { bo_cuc: { vi_tri: {} } } });
  assert.equal(luanGiai({ nha: { huong: "Nam" } }), null);
  const viTri = gopLui(boBanCong, boSan);
  const yc = { khung: { rong: 6, sau: 20, san: [[0.3, 0.4]] }, tang: [{ so: 1, vat: [{ loai: "bep" }, { loai: "ban_cong" }] }] };
  assert.deepEqual(viTri(yc), { khung: { rong: 6, sau: 20 }, tang: [{ so: 1, vat: [{ loai: "bep" }] }] });
  assert.deepEqual(viTri({ khung: { rong: 6, sau: 20, san: [[0.3, 0.4]] }, tang: [{ so: 1, vat: [{ loai: "bep" }] }] }),
    { khung: { rong: 6, sau: 20 }, tang: [{ so: 1, vat: [{ loai: "bep" }] }] });
  assert.equal(viTri({ khung: { rong: 6, sau: 20 }, tang: [{ so: 1, vat: [{ loai: "bep" }] }] }), null);
});
