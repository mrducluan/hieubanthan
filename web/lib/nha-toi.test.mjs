import assert from "node:assert/strict";
import test from "node:test";
import { KHOANG_XAY, namXayGui, nguoiTuGiaDinh } from "./nha-toi.ts";

test("khoảng năm xây khớp vận của engine (vận v bắt đầu năm 1864 + 20·(v−1))", () => {
  for (const k of KHOANG_XAY) {
    assert.equal(k.tu, 1864 + (k.van - 1) * 20);
    assert.equal(k.den, k.tu + 19);
  }
});

test("namXayGui: năm cụ thể thắng; chỉ vận thì gửi vận; không có gì thì rỗng — không bao giờ cả hai", () => {
  assert.deepEqual(namXayGui({ nam_xay: 2008, van_xay: 8 }), { nam_xay: 2008 });
  assert.deepEqual(namXayGui({ van_xay: 8 }), { van_xay: 8 });
  assert.deepEqual(namXayGui({}), {});
  assert.deepEqual(namXayGui(null), {});
});

test("nguoiTuGiaDinh: vai đổi đúng, chỉ năm + giới tính, người thiếu giới tính được đếm, tối đa 6", () => {
  const kq = nguoiTuGiaDinh([
    { vai: "vo_chong", nam_sinh: 1992, gioi_tinh: "nu", ten_goi: "Lan" },
    { vai: "vo_chong", nam_sinh: 1990, gioi_tinh: "nam" },
    { vai: "bo", nam_sinh: 1960, gioi_tinh: "nam" },
    { vai: "con", nam_sinh: 2018 },
    { vai: "ong_ba", nam_sinh: 1940, gioi_tinh: "nu", ngay_sinh: "1940-02-02" },
  ]);
  assert.deepEqual(kq.them, [
    { vai: "vo", nam: 1992, gioi_tinh: "nu" }, { vai: "chong", nam: 1990, gioi_tinh: "nam" },
    { vai: "cha_me", nam: 1960, gioi_tinh: "nam" }, { vai: "khac", nam: 1940, gioi_tinh: "nu" },
  ]);
  assert.equal(kq.thieu_gioi, 1);
  assert.ok(!JSON.stringify(kq).includes("Lan") && !JSON.stringify(kq).includes("1940-02-02"));
  assert.equal(nguoiTuGiaDinh(Array.from({ length: 9 }, () => ({ vai: "con", nam_sinh: 2010, gioi_tinh: "nam" }))).them.length, 6);
});
