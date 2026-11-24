import test from "node:test";
import assert from "node:assert/strict";
import {
  chuanDo, doHienThi, giaiMa, gocLienTuc, hieuGoc, huongDinhMay, kimMuot, lamTronMau, nhomSoMau, saiSoXauNhat,
} from "./hop-nhat.ts";

const gan = (a, b, sai = 1e-6) => assert.ok(Math.abs(hieuGoc(a, b)) <= sai, `${a} phải gần ${b}`);

test("huongDinhMay: máy nằm phẳng — alpha 90 → 270 (Tây), alpha 0 → 0, alpha 270 → 90", () => {
  gan(huongDinhMay(90, 0, 0), 270);
  gan(huongDinhMay(0, 0, 0), 0);
  gan(huongDinhMay(270, 0, 0), 90);
  gan(huongDinhMay(180, 0, 0), 180);
});

test("huongDinhMay: nghiêng dưới 90° không làm đổi hướng cạnh trên (cột 2 của ma trận quay)", () => {
  // (−sinα·cosβ, cosα·cosβ): α = 90, β = 45 → (−0,7071; 0) → atan2 = −90° = 270°; gamma không tham gia
  gan(huongDinhMay(90, 45, 30), 270);
  gan(huongDinhMay(30, -50, -40), 330);
  gan(huongDinhMay(200, 59, 59), 160);
});

test("huongDinhMay: ngả quá 90° thì hướng lật 180° (chỗ '360 − alpha' sai); dựng đứng → không xác định", () => {
  // α = 90, β = 120: cosβ = −0,5 → (0,5; 0) → 90°
  gan(huongDinhMay(90, 120, 0), 90);
  gan(huongDinhMay(0, 135, 0), 180);
  assert.equal(huongDinhMay(10, 90, 0), null);
  assert.equal(huongDinhMay(Number.NaN, 0, 0), null);
});

test("huongDinhMay: sát 0/360 luôn nằm trong [0, 360)", () => {
  for (const a of [0, 1e-9, 359.999999, 360, 0.02, 359.98]) {
    const h = huongDinhMay(a, 2, -3);
    assert.ok(h >= 0 && h < 360, `alpha ${a} → ${h}`);
  }
  gan(huongDinhMay(0.5, 0, 0), 359.5);
  gan(huongDinhMay(359.5, 0, 0), 0.5);
});

test("giaiMa: Android tuyệt đối, máy xoay ngang cộng góc màn hình; sự kiện không tuyệt đối bị bỏ", () => {
  gan(giaiMa({ alpha: 90, beta: 0, gamma: 0 }, true, 0).do, 270);
  gan(giaiMa({ alpha: 90, beta: 0, gamma: 0 }, true, 90).do, 0);        // 270 + 90 vắt qua Bắc
  gan(giaiMa({ alpha: 90, beta: 0, gamma: 0 }, true, 270).do, 180);
  gan(giaiMa({ alpha: 180, beta: 0, gamma: 0, absolute: true }, false, 0).do, 180);
  assert.equal(giaiMa({ alpha: 180, beta: 0, gamma: 0, absolute: false }, false, 0), null);
  assert.equal(giaiMa({ alpha: null, beta: 0, gamma: 0 }, true, 0), null);
  assert.equal(giaiMa({}, true, 0), null);
});

test("giaiMa: iOS dùng webkitCompassHeading (+ góc màn hình) và giữ NGUYÊN sai số âm", () => {
  const m = giaiMa({ webkitCompassHeading: 350, webkitCompassAccuracy: -1, alpha: 12, beta: 5, gamma: 0 }, false, 90);
  gan(m.do, 80);
  assert.equal(m.saiSo, -1);
  assert.equal(m.nghieng, false);
  assert.equal(giaiMa({ webkitCompassHeading: 10, webkitCompassAccuracy: 15 }, false, 0).saiSo, 15);
  assert.equal(giaiMa({ alpha: 10, beta: 0, gamma: 0 }, true, 0).saiSo, null);
});

test("giaiMa: máy dựng quá 60° đánh dấu nghiêng (cả iOS lẫn Android), dưới ngưỡng thì không", () => {
  assert.equal(giaiMa({ alpha: 10, beta: 61, gamma: 0 }, true).nghieng, true);
  assert.equal(giaiMa({ alpha: 10, beta: 0, gamma: -61 }, true).nghieng, true);
  assert.equal(giaiMa({ alpha: 10, beta: 60, gamma: 60 }, true).nghieng, false);
  assert.equal(giaiMa({ webkitCompassHeading: 10, beta: 75, gamma: 0 }, false).nghieng, true);
  assert.equal(giaiMa({ webkitCompassHeading: 10, beta: 40, gamma: 0 }, false).nghieng, false);
});

test("359,96–359,98 không bao giờ hiện hay gửi thành 360", () => {
  for (const d of [359.5, 359.96, 359.97, 359.98, 359.995, 359.9999, 360, 719.9, -0.2, -0.0000001]) {
    const h = doHienThi(d);
    assert.ok(Number.isInteger(h) && h >= 0 && h <= 359, `doHienThi(${d}) = ${h}`);
    const m = lamTronMau(d);
    assert.ok(m >= 0 && m < 360, `lamTronMau(${d}) = ${m}`);
    const c = chuanDo(d);
    assert.ok(c >= 0 && c < 360, `chuanDo(${d}) = ${c}`);
  }
  assert.equal(doHienThi(359.97), 0);
  assert.equal(lamTronMau(359.996), 0);
  assert.equal(lamTronMau(359.98), 359.98);
  assert.equal(doHienThi(kimMuot([359.96, 359.97, 359.98])), 0);
});

test("kimMuot: vắt qua Bắc ra gần 0 (không phải 180); rỗng → null; mẫu triệt tiêu → mẫu mới nhất", () => {
  gan(kimMuot([359, 1]), 0, 1e-6);
  gan(kimMuot([350, 10, 0]), 0, 1e-6);
  gan(kimMuot([178, 182]), 180, 1e-6);
  assert.equal(kimMuot([]), null);
  assert.equal(kimMuot([0, 180]), 180);
  const k = kimMuot([359.99, 0.01]);
  assert.ok(k >= 0 && k < 360);
});

test("gocLienTuc: 359 → 0 quay 1°, không quay ngược cả vòng", () => {
  assert.equal(gocLienTuc(359, 0), 360);
  assert.equal(gocLienTuc(360, 1), 361);
  assert.equal(gocLienTuc(0, 359), -1);
  assert.equal(gocLienTuc(-1, 2), 2);
  assert.equal(gocLienTuc(725, 10), 730);
  assert.equal(hieuGoc(359, 1), -2);
  assert.equal(hieuGoc(1, 359), 2);
});

test("saiSoXauNhat: âm (chưa hiệu chỉnh) thắng mọi số; còn lại lấy số lớn", () => {
  assert.equal(saiSoXauNhat(null, null), null);
  assert.equal(saiSoXauNhat(null, 12), 12);
  assert.equal(saiSoXauNhat(12, 30), 30);
  assert.equal(saiSoXauNhat(30, 12), 30);
  assert.equal(saiSoXauNhat(12, -1), -1);
  assert.equal(saiSoXauNhat(-1, 5), -1);
  assert.equal(saiSoXauNhat(7, null), 7);
});

test("nhomSoMau: chỉ ra nhóm, không ra con số", () => {
  assert.equal(nhomSoMau(1), "it");
  assert.equal(nhomSoMau(40), "vua");
  assert.equal(nhomSoMau(240), "nhieu");
});
