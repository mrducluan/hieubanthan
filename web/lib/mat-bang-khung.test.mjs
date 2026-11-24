import assert from "node:assert/strict";
import test from "node:test";
import {
  doLaBanCua,
  huongCuaMacDinh,
  kichThuocMacDinh,
  suyDauHieuTuKhung,
  tamNhaKhung,
  tinhHopPhong,
  xoayHuongCua,
} from "./mat-bang-khung.ts";

test("tinhHopPhong: giữ nguyên diem (0..1) cho engine nhưng kẹp hộp hiển thị gọn trong biên nhà", () => {
  const hop = tinhHopPhong("bep", [0.98, 0.98], 4, 20);
  assert.deepEqual(hop.diem, [0.98, 0.98]);
  assert.ok(hop.x0 >= 0 && hop.x0 + hop.w <= 4);
  assert.ok(hop.y0 >= 0 && hop.y0 + hop.h <= 20);
});

test("xoayHuongCua & doLaBanCua: xoay 90° theo kim đồng hồ và quy đổi ra độ la bàn chuẩn", () => {
  assert.equal(xoayHuongCua("truoc"), "phai");
  assert.equal(xoayHuongCua("phai"), "sau");
  assert.equal(xoayHuongCua("sau"), "trai");
  assert.equal(xoayHuongCua("trai"), "truoc");

  // Nhà hướng Nam (180°): cửa mở sang phải (+90°) => hướng Tây (270°)
  assert.deepEqual(doLaBanCua("truoc", 180), { do: 180, phuong: "Nam" });
  assert.deepEqual(doLaBanCua("phai", 180), { do: 270, phuong: "Tây" });
  assert.deepEqual(doLaBanCua("sau", 180), { do: 0, phuong: "Bắc" });
  assert.deepEqual(doLaBanCua("trai", 180), { do: 90, phuong: "Đông" });
});

test("suyDauHieuTuKhung: phát hiện wc_giua_nha, cua_doi_nhau, bep_doi_cua, bep_wc, nha_chu_l", () => {
  const luoiChuL = [
    [true, true, false, false],
    [true, true, false, false],
    [true, true, true, true],
    [true, true, true, true],
  ];
  const tam = tamNhaKhung(luoiChuL);
  assert.ok(tam[0] < 0.5 && tam[1] > 0.5);

  const dh = suyDauHieuTuKhung(
    {
      cua_chinh: { diem: [0.5, 0.04], huong_cua: "truoc" },
      phong_ngu_chinh: { diem: [0.2, 0.5], kich_thuoc: [2.0, 2.5], huong_cua: "phai" },
      ve_sinh: { diem: [0.5, 0.5], kich_thuoc: [1.6, 2.0], huong_cua: "trai" },
      bep: { diem: [0.5, 0.72], kich_thuoc: [2.2, 2.2], huong_cua: "truoc" },
    },
    5,
    15,
    luoiChuL,
  );
  assert.ok(dh.includes("nha_chu_l"), "phải phát hiện nha_chu_l");
  assert.ok(dh.includes("wc_giua_nha"), "phải phát hiện wc_giua_nha");
  assert.ok(dh.includes("cua_doi_nhau"), "phải phát hiện cua_doi_nhau (phòng ngủ mở phải đối WC mở trái)");
  assert.ok(dh.includes("bep_doi_cua"), "phải phát hiện bep_doi_cua (bếp cùng trục cửa chính và mở ra trước)");
});

test("kichThuocMacDinh & huongCuaMacDinh: tự co kích thước và hướng cửa về trục giữa nhà", () => {
  const [w, h] = kichThuocMacDinh("phong_ngu_chinh", 3.5, 10);
  assert.ok(w <= 3.5 * 0.75);
  assert.ok(h <= 10 * 0.5);
  assert.equal(huongCuaMacDinh("cua_chinh", [0.5, 0.03]), "truoc");
  assert.equal(huongCuaMacDinh("phong_ngu_chinh", [0.18, 0.5]), "phai");
  assert.equal(huongCuaMacDinh("ve_sinh", [0.82, 0.5]), "trai");
});
