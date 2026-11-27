import assert from "node:assert/strict";
import test from "node:test";
import { KHOANG_XAY } from "./nha-toi.ts";
import { HUONG_NHANH, NAM_TU_VAN, huongTuCuaHang, huongTuHoSoNha } from "./huong-co-van.ts";

test("hồ sơ nhà: số độ thắng tên hướng; chỉ có tên hướng thì đổi ra số độ giữa ô", () => {
  assert.deepEqual(huongTuHoSoNha({ huong_do: 178.8, huong: "Bắc", nam_xay: 2007 }), { do_huong: 178.8, nam_xay: 2007 });
  assert.deepEqual(huongTuHoSoNha({ huong: "Tây Nam" }), { do_huong: 225 });
  assert.equal(huongTuHoSoNha({}), null);
  assert.equal(huongTuHoSoNha(null), null);
  assert.equal(huongTuHoSoNha({ huong: "Không phải hướng" }), null);
});

test("hồ sơ nhà: chỉ nhớ khoảng năm → năm đại diện nằm đúng khoảng của vận ấy", () => {
  for (const k of KHOANG_XAY) {
    const nam = NAM_TU_VAN[k.van];
    assert.ok(nam >= k.tu && nam <= k.den, `vận ${k.van}: ${nam} ngoài ${k.tu}–${k.den}`);
  }
  assert.deepEqual(huongTuHoSoNha({ huong_do: 90, van_xay: 9 }), { do_huong: 90, nam_xay: 2025 });
  assert.deepEqual(huongTuHoSoNha({ huong_do: 90, nam_xay: 1999, van_xay: 7 }), { do_huong: 90, nam_xay: 1999 });
});

test("hồ sơ cửa hàng: không rõ năm xây thì không gửi năm; có thì gửi", () => {
  assert.deepEqual(huongTuCuaHang({ do_huong: 180, cach_nam: "khong_ro", nam_xay: 2010 }), { do_huong: 180 });
  assert.deepEqual(huongTuCuaHang({ do_huong: 180, cach_nam: "chinh_xac", nam_xay: 2007 }), { do_huong: 180, nam_xay: 2007 });
  assert.equal(huongTuCuaHang(null), null);
});

test("tám hướng nhanh cách đều 45° từ Bắc", () => {
  assert.equal(HUONG_NHANH.length, 8);
  HUONG_NHANH.forEach((h, i) => assert.equal(h.do, i * 45));
});
