import test from "node:test";
import assert from "node:assert/strict";

// Kiểm tra ngân sách base64 thích ứng cho 1..6 ảnh để tổng không bao giờ vượt DOC_ANH_TONG (4.000.000).
const BASE64_TOI_DA = 1_000_000;
const TONG_BASE64_AN_TOAN = 3_600_000;
const SO_ANH_TOI_DA = 6;

function tranBase64MoiAnh(soAnh) {
  const n = Math.max(1, Math.min(SO_ANH_TOI_DA, Math.round(soAnh)));
  return Math.min(BASE64_TOI_DA, Math.floor(TONG_BASE64_AN_TOAN / n));
}

test("tranBase64MoiAnh: 1-3 ảnh giữ nguyên trần 1MB/ảnh, 4-6 ảnh tự giảm trần để tổng <= 3.6M (< 4M)", () => {
  assert.equal(tranBase64MoiAnh(1), 1_000_000);
  assert.equal(tranBase64MoiAnh(3), 1_000_000);
  assert.equal(tranBase64MoiAnh(4), 900_000);
  assert.equal(tranBase64MoiAnh(6), 600_000);
  for (let n = 1; n <= 6; n++) {
    assert.ok(tranBase64MoiAnh(n) * n <= 3_600_000, `n=${n} vượt ngưỡng 3.6M`);
  }
});
