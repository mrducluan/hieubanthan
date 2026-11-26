import test from "node:test";
import assert from "node:assert/strict";
import { giaiMaBanCo, maHoaBanCo } from "./ma-hoa-ban-co.ts";

const MAU_BAN_CO = {
  phien_ban: 1,
  ten_ban_co: "Chuỗi Cà Phê Quận 1 – 2027",
  ghi_chu: "Cân nhắc 2 co-founder và mặt bằng góc Nguyễn Thị Minh Khai",
  doi_tac: [
    { id: "p1", ten: "Trần Quốc Bảo", vai_tro_du_kien: "Tài chính", ngay: 15, thang: 5, nam: 1990, gioi_tinh: "nam", ty_le_du_kien: 50 },
    { id: "p2", ten: "Lê Minh Ánh", vai_tro_du_kien: "Vận hành", ngay: 20, thang: 9, nam: 1992, gioi_tinh: "nu", gio: "08:30", ty_le_du_kien: 50 },
  ],
  mat_bang: [
    { id: "m1", ten_diem: "Số 88 NTMK", loai_hinh: "quan_ca_phe", do_huong: 142.5, nam_xay: 2024, ghi_chu: "Mặt tiền 6m" },
  ],
};

test("E2EE Bàn cờ kinh doanh: mã hoá AES-GCM 256-bit không lộ bản rõ và giải mã tròn vẹn tiếng Việt", async () => {
  const goi = await maHoaBanCo(MAU_BAN_CO, "MatKhauManh#2027");
  assert.equal(goi.v, "hbt_e2ee_v1");
  const chuoiJson = JSON.stringify(goi);
  assert.equal(chuoiJson.includes("Trần Quốc Bảo"), false);
  assert.equal(chuoiJson.includes("1990"), false);
  assert.equal(chuoiJson.includes("142.5"), false);

  const phucHoi = await giaiMaBanCo(goi, "MatKhauManh#2027");
  assert.deepEqual(phucHoi, MAU_BAN_CO);
});

test("E2EE Bàn cờ kinh doanh: từ chối mật khẩu ngắn, sai mật khẩu hoặc bản mã bị can thiệp", async () => {
  await assert.rejects(() => maHoaBanCo(MAU_BAN_CO, "ngan"), /8 ký tự/);
  const goi = await maHoaBanCo(MAU_BAN_CO, "MatKhauDung#2027");
  await assert.rejects(() => giaiMaBanCo(goi, "MatKhauSai#2027"), /Sai mật khẩu/);

  const goiBiSua = { ...goi, ct_b64: goi.ct_b64.slice(0, -4) + (goi.ct_b64.endsWith("AAAA") ? "BBBB" : "AAAA") };
  await assert.rejects(() => giaiMaBanCo(goiBiSua, "MatKhauDung#2027"), /Sai mật khẩu|thay đổi/);
});
