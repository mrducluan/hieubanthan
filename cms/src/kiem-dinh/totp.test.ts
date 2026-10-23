// CMS-2: TOTP đúng chuẩn RFC 6238 (vector SHA-1 trong phụ lục B), cửa sổ ±1 bước, chặn dùng lại, cookie ký.
import assert from "node:assert/strict";
import { test } from "node:test";
import { base32, cookieHopLe, giaiMa, kiemMa, maHoa, maTotp, taoCookie, tuBase32 } from "../lib/totp.ts";

const BI = Buffer.from("12345678901234567890");   // khoá thử của RFC 6238 (SHA-1)

test("vector RFC 6238 (8 số → 6 số cuối)", () => {
  // RFC: T=59 → 94287082, T=1111111109 → 07081804, T=1234567890 → 89005924, T=2000000000 → 69279037
  for (const [t, ma] of [[59, "287082"], [1111111109, "081804"], [1234567890, "005924"], [2000000000, "279037"]] as const) {
    assert.equal(maTotp(BI, Math.floor(t / 30)), ma);
  }
});

test("base32 hai chiều", () => {
  assert.equal(base32(BI), "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.deepEqual(tuBase32("gezd gnbv-gy3t qojq gezd gnbv gy3t qojq"), BI);
});

test("kiểm mã: cửa sổ ±1 bước, sai định dạng, chặn dùng lại bước cũ", () => {
  const ms = 1_234_567_890_000, b = Math.floor(ms / 30_000);
  assert.equal(kiemMa(BI, maTotp(BI, b), -1, ms), b);
  assert.equal(kiemMa(BI, maTotp(BI, b - 1), -1, ms), b - 1);
  assert.equal(kiemMa(BI, maTotp(BI, b - 2), -1, ms), null);
  assert.equal(kiemMa(BI, maTotp(BI, b), b, ms), null);          // đã dùng bước này
  assert.equal(kiemMa(BI, "12345", -1, ms), null);
});

test("mã hoá bí mật + cookie ký", () => {
  process.env.PAYLOAD_SECRET = "bi-mat-thu-0123456789abcdef";
  assert.deepEqual(giaiMa(maHoa(BI)), BI);
  assert.equal(giaiMa("hong.hong.hong"), null);
  const c = taoCookie(7, "phien-a", 1_000_000);
  assert.ok(cookieHopLe(c, 7, "phien-a", 1_000_000));
  assert.ok(!cookieHopLe(c, 8, "phien-a", 1_000_000));                       // không dùng được cho người khác
  assert.ok(!cookieHopLe(c, 7, "phien-b", 1_000_000));                       // SEC-2: phiên đăng nhập khác → vô hiệu
  assert.ok(!cookieHopLe(c, 7, "phien-a", 1_000_000 + 9 * 3600 * 1000));      // hết hạn sau 8 giờ
  assert.ok(!cookieHopLe(c.replace(/.$/, "x"), 7, "phien-a", 1_000_000));
});
