import assert from "node:assert/strict";
import test from "node:test";
import {
  chuoiBezierHaiChang,
  cungBezier,
  diemTron,
  gocChi,
  gocRanhGioi,
  gocTuoi, tuoiVong,
  khuyenTuHoa,
  quat,
} from "./tuvi-ban-do.ts";

const gan = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} !~ ${b}`);

test("gocChi: Ngọ (6) ở đỉnh 0°, Tý (0) ở đáy 180°, Mão (3) ở trái 270°, Dậu (9) ở phải 90°", () => {
  assert.equal(gocChi(6), 0);
  assert.equal(gocChi(7), 30);
  assert.equal(gocChi(9), 90);
  assert.equal(gocChi(0), 180);
  assert.equal(gocChi(3), 270);
  assert.equal(gocChi(5), 330);
});

test("diemTron & gocRanhGioi: đúng hệ toạ độ SVG và vách ngăn Tuần/Triệt", () => {
  const [nx, ny] = diemTron(100, gocChi(6));
  gan(nx, 0);
  gan(ny, -100);
  const [tx, ty] = diemTron(100, gocChi(0));
  gan(tx, 0);
  gan(ty, 100);

  // Cặp chẵn–lẻ Tuần / Triệt luôn nằm đúng vách +15° từ chi chẵn
  assert.equal(gocRanhGioi(6, 7), 15);    // Ngọ–Mùi
  assert.equal(gocRanhGioi(0, 1), 195);   // Tý–Sửu
  assert.equal(gocRanhGioi(10, 11), 135); // Tuất–Hợi
});

test("gocTuoi & quat: kẹp biên 0..90 tuổi và khép kín đường quạt", () => {
  assert.equal(gocTuoi(-5), 0);
  assert.equal(gocTuoi(45), 180);
  assert.equal(gocTuoi(120), 360);
  // Người trên 80 tuổi: vành nới theo tuổi lớn nhất (tròn chục), không kẹp 90.
  assert.equal(tuoiVong(40), 90);
  assert.equal(tuoiVong(94), 100);
  assert.equal(tuoiVong(105), 110);
  assert.equal(gocTuoi(95, 110), (95 / 110) * 360);

  const q = quat(90, 190, -14.4, 14.4);
  assert.match(q, /^M.+A190 190 0 0 1 .+L.+A90 90 0 0 0 .+Z$/);
});

test("cungBezier & chuoiBezierHaiChang: tách hai chặng A -> B -> C kể cả khi C quay về A", () => {
  const b1 = cungBezier(170, 0, 120);
  assert.match(b1.d, /^M.+Q.+ .+$/);
  assert.ok(Number.isFinite(b1.giua[0]) && Number.isFinite(b1.giua[1]));

  // Chuỗi 3 cung khác nhau
  const ba = chuoiBezierHaiChang(170, gocChi(6), gocChi(10), gocChi(2));
  assert.notEqual(ba.chang1, ba.chang2);
  const kcBa = Math.hypot(ba.giua1[0] - ba.giua2[0], ba.giua1[1] - ba.giua2[1]);
  assert.ok(kcBa > 25, `Hai điểm giữa quá sát: ${kcBa}`);

  // Chuỗi hồi cung (A -> B -> A): hai điểm giữa ① và ② vẫn tách rời rõ ràng
  const hoi = chuoiBezierHaiChang(170, gocChi(6), gocChi(0), gocChi(6));
  const kcHoi = Math.hypot(hoi.giua1[0] - hoi.giua2[0], hoi.giua1[1] - hoi.giua2[1]);
  assert.ok(kcHoi > 15, `Chuỗi hồi cung bị trùng nét: ${kcHoi}`);

  const kh = khuyenTuHoa(205, 60);
  assert.match(kh.d, /^M.+Q.+ .+$/);
});
