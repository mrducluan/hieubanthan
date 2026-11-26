import assert from "node:assert/strict";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import test from "node:test";
import { docLoiMoiDoiNgu, giaiMaDongYThanhVien, kyLoiMoiDoiNgu, maHoaDongYThanhVien } from "./doanh-chu-ma.ts";

test("doanh-chu-ma: mã hoá & giải mã tv_token cả khi thiếu giờ (Tam Trụ), khi có giờ (Tứ Trụ) và tương thích ngược nd13-2023-v1", () => {
  const { ma, noi_dung } = kyLoiMoiDoiNgu("Ban điều hành", 1_700_000_000_000);
  const moi = docLoiMoiDoiNgu(ma, 1_700_000_005_000);
  assert.ok(moi);
  assert.equal(moi.nonce, noi_dung.nonce);

  // 0. Tương thích ngược với token 12 khoá phiên bản cũ `nd13-2023-v1` đã cấp trước đó trong cửa sổ 7 ngày
  const ivCu = randomBytes(12);
  const keyCu = createHash("sha256").update("doanh-chu-tv-aes256gcm|chi-dung-khi-phat-trien-local-doanh-chu").digest();
  const cipherCu = createCipheriv("aes-256-gcm", keyCu, ivCu);
  cipherCu.setAAD(Buffer.from("doanh-chu-tv-v1", "utf8"));
  const payloadCu = {
    v: 1,
    scope: "doanh-chu-tv",
    nonce: moi.nonce,
    phien_ban_dong_y: "nd13-2023-v1",
    thoi_diem_dong_y: new Date(1_700_000_005_000).toISOString(),
    exp: 1_700_000_005_000 + 86_400_000,
    biet_danh: "Lan Cũ",
    vai_tro: "CFO",
    ngay: 5,
    thang: 1,
    nam: 1994,
    gioi_tinh: "nu",
  };
  const ctCu = Buffer.concat([cipherCu.update(JSON.stringify(payloadCu), "utf8"), cipherCu.final()]);
  const tokCu = `dc1.${ivCu.toString("base64url")}.${cipherCu.getAuthTag().toString("base64url")}.${ctCu.toString("base64url")}`;
  const gmCu = giaiMaDongYThanhVien(tokCu, moi.nonce, 1_700_000_010_000);
  assert.ok(gmCu, "Token cũ nd13-2023-v1 12 khoá phải giải mã tương thích ngược thành công");
  assert.equal(gmCu.biet_danh, "Lan Cũ");
  assert.equal(gmCu.gio, undefined);

  // 1. Không nhập giờ -> không sinh trường `gio`
  const kqTam = maHoaDongYThanhVien(
    { nonce: moi.nonce, biet_danh: "Minh", vai_tro: "COO", ngay: 10, thang: 3, nam: 1992, gioi_tinh: "nu" },
    1_700_000_005_000,
  );
  const gmTam = giaiMaDongYThanhVien(kqTam.tv_token, moi.nonce, 1_700_000_010_000);
  assert.ok(gmTam);
  assert.equal(gmTam.gio, undefined);

  // 2. Có nhập giờ HH:MM -> bảo toàn chính xác `gio` qua AES-256-GCM
  const kqTu = maHoaDongYThanhVien(
    { nonce: moi.nonce, biet_danh: "Khoa", vai_tro: "CTO", ngay: 18, thang: 6, nam: 1996, gioi_tinh: "nam", gio: "09:30" },
    1_700_000_005_000,
  );
  const gmTu = giaiMaDongYThanhVien(kqTu.tv_token, moi.nonce, 1_700_000_010_000);
  assert.ok(gmTu);
  assert.equal(gmTu.gio, "09:30");

  // 3. Giờ sai định dạng -> từ chối
  assert.throws(() =>
    maHoaDongYThanhVien({
      nonce: moi.nonce, biet_danh: "Sai", vai_tro: "", ngay: 10, thang: 3, nam: 1992, gioi_tinh: "nam", gio: "25:99",
    }),
  );
});
