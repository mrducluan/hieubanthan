import test from "node:test";
import assert from "node:assert/strict";
import { hieuGoc, hopNhatLaBan, kiemTraPhang, trungBinhGoc } from "./hop-nhat.ts";

test("xử lý đúng ranh giới 359° và 1° cho trung bình tuần hoàn = 0°", () => {
  const { mean, std } = trungBinhGoc([359, 1]);
  assert.equal(mean, 0);
  assert.ok(std < 2, `std phải nhỏ, nhận ${std}`);
});

test("lọc bỏ mẫu ngoại lai (spike từ trường) bằng MAD tuần hoàn", () => {
  const mau = [
    { deg: 179.5 },
    { deg: 180.0 },
    { deg: 180.5 },
    { deg: 180.2 },
    { deg: 179.8 },
    { deg: 265.0 }, // spike nhiễu sắt thép
  ];
  const kq = hopNhatLaBan(mau);
  assert.equal(kq.soLoaiBo, 1);
  assert.ok(Math.abs(hieuGoc(kq.mean, 180)) < 0.5, `mean phải gần 180°, nhận ${kq.mean}`);
  assert.ok(kq.onDinhPct >= 99, `ổn định phải >= 99%, nhận ${kq.onDinhPct}`);
});

test("phát hiện độ ổn định R% thấp khi các mẫu phân tán mạnh", () => {
  const kq = hopNhatLaBan([
    { deg: 0 },
    { deg: 90 },
    { deg: 180 },
    { deg: 270 },
  ]);
  assert.ok(kq.R < 0.2 && kq.onDinhPct < 20, `R% phải rất thấp khi phân tán 4 hướng, nhận ${kq.onDinhPct}%`);
});

test("kiểm tra độ phẳng điện thoại qua beta/gamma", () => {
  assert.equal(kiemTraPhang(5, -8).phang, true);
  const nghieng = kiemTraPhang(38, 4);
  assert.equal(nghieng.phang, false);
  assert.equal(nghieng.gocNghieng, 38);
});
