import test from "node:test";
import assert from "node:assert/strict";
import { chuBiChan, kiemLoiChuc, kiemTen, laLoiChucMau, GIONG_CHUC, LOI_CHUC_MAU, QUAN_HE_CHUC, tietKiemPhanTram } from "./li-xi-tet.ts";

// Cùng bộ câu với supabase/kiem_thu/thu_li_xi_tet_0042.sql (hàm SQL lx_chu_bi_chan).
test("chuBiChan: chặn số điện thoại, link không http, chữ ngân hàng, stk", () => {
  for (const s of ["Gọi 0912 345 678 nhé", "Zl 0912345678", "vào hieuban-qua.top nhận quà", "Vui lòng chuyển khoản phí", "stk của em",
    "nhắn zalo cho mình", "https://x.co", "email a@b", "Bấm vào đây nhận quà", "mã xác nhận gửi bạn"]) assert.equal(chuBiChan(s), true, s);
});

test("chuBiChan: cho lời chúc và tên bình thường, kể cả 6 lời chúc mẫu", () => {
  for (const s of ["Chúc bạn năm Đinh Mùi 2027 vạn sự hanh thông, sức khoẻ dồi dào.", "Anh Minh & gia đình", ...LOI_CHUC_MAU]) {
    assert.equal(chuBiChan(s), false, s);
  }
});

test("kiemTen: không chữ số; kiemLoiChuc: ≤ 160 ký tự", () => {
  assert.equal(kiemTen(""), null);
  assert.equal(kiemTen("Chị Lan"), null);
  assert.ok(kiemTen("Lan 1990"));
  assert.ok(kiemTen("Vietcombank chuyển khoản"));
  assert.equal(kiemLoiChuc(LOI_CHUC_MAU[0]), null);
  assert.ok(kiemLoiChuc("a".repeat(161)));
});

test("QUAN_HE_CHUC × GIONG_CHUC: đủ 12 nhóm × 4 giọng, đều qua bộ lọc, không trùng, đủ dài, nằm trong LOI_CHUC_MAU", () => {
  assert.ok(QUAN_HE_CHUC.length >= 12);
  assert.deepEqual(GIONG_CHUC.map((g) => g.ma), ["am", "trang", "vui", "y"]);
  const thay = new Set();
  for (const q of QUAN_HE_CHUC) {
    for (const g of GIONG_CHUC) {
      const l = q.loi[g.ma];
      assert.ok(l, `${q.ma}/${g.ma} thiếu`);
      assert.equal(kiemLoiChuc(l), null, l);
      assert.ok(l.length <= 160 && l.length >= 40, `${q.ma}/${g.ma}: ${l.length}`);
      assert.ok(!thay.has(l), `trùng: ${l}`);
      thay.add(l);
      assert.equal(laLoiChucMau(l), true);
    }
  }
});

test("giọng 'Ý nghĩa' bám hình ảnh thật của năm trong kho tri thức (ngọn đèn Đinh / nước sông Ngân), mọi lời nhắc năm 2027", () => {
  for (const q of QUAN_HE_CHUC) {
    assert.match(q.loi.y, /đèn|Ngân|ngọn lửa|mưa/i, q.ma);
    for (const g of GIONG_CHUC) assert.match(q.loi[g.ma], /2027/, `${q.ma}/${g.ma}`);
  }
});

test("laLoiChucMau: chỉ đúng mẫu (bỏ khoảng trắng hai đầu)", () => {
  assert.equal(laLoiChucMau(` ${LOI_CHUC_MAU[2]} `), true);
  assert.equal(laLoiChucMau("Chúc bạn vui"), false);
  assert.equal(laLoiChucMau(null), false);
});

test("tietKiemPhanTram: tính từ bảng giá, < 5 % thì không khoe", () => {
  assert.equal(tietKiemPhanTram(99000, 249000, 3), 16);
  assert.equal(tietKiemPhanTram(99000, 399000, 5), 19);
  assert.equal(tietKiemPhanTram(99000, 290000, 3), null);
  assert.equal(tietKiemPhanTram(0, 1, 3), null);
});
