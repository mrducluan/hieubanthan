import assert from "node:assert/strict";
import test from "node:test";
import * as mk from "./mat-bang-khung.ts";
import { PHONG_CO_CUA, THU_TU_HUONG_CUA, dichDiem, huongCuaMacDinh, kichThuocMacDinh, tinhHopPhong, viTriTuongDoi, xoayHuongCua } from "./mat-bang-khung.ts";

test("tệp chỉ còn hình học hiển thị: không suy dấu hiệu, không tính tâm nhà, không đổi phía cửa ra độ la bàn", () => {
  for (const ten of ["suyDauHieuTuKhung", "tamNhaKhung", "doLaBanCua"]) assert.equal(ten in mk, false, `${ten} phải do máy chủ tính`);
});

test("kichThuocMacDinh: tự co theo khung nhà, không bao giờ lớn hơn nhà", () => {
  for (const loai of ["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "cau_thang"]) {
    for (const [rong, sau] of [[2, 3], [3.5, 10], [5, 15], [12, 12], [40, 6]]) {
      const [w, h] = kichThuocMacDinh(loai, rong, sau);
      assert.ok(w > 0 && h > 0);
      assert.ok(w <= rong, `${loai} rộng ${w} > nhà ${rong}`);
      assert.ok(h <= sau, `${loai} sâu ${h} > nhà ${sau}`);
    }
  }
  const [w, h] = kichThuocMacDinh("phong_ngu_chinh", 3.5, 10);
  assert.ok(w <= 3.5 * 0.75 && h <= 10 * 0.5);
  assert.deepEqual(kichThuocMacDinh("phong_ngu_chinh", 20, 30), [3.2, 3.6]);      // nhà rộng: giữ cỡ chuẩn
});

test("tinhHopPhong: giữ nguyên điểm đã chạm, hộp vẽ luôn nằm gọn trong tường", () => {
  for (const diem of [[0, 0], [1, 1], [0.98, 0.98], [0.02, 0.5], [0.5, 0.01], [1, 0]]) {
    for (const kt of [undefined, [1, 1], [3.9, 19], [99, 99]]) {
      const hop = tinhHopPhong("bep", diem, 4, 20, kt);
      assert.deepEqual(hop.diem, diem);
      assert.ok(hop.x0 >= 0 && hop.x0 + hop.w <= 4 + 1e-9);
      assert.ok(hop.y0 >= 0 && hop.y0 + hop.h <= 20 + 1e-9);
      assert.ok(Math.abs(hop.cx - (hop.x0 + hop.w / 2)) < 1e-9 && Math.abs(hop.cy - (hop.y0 + hop.h / 2)) < 1e-9);
    }
  }
  const giua = tinhHopPhong("ve_sinh", [0.5, 0.5], 10, 10, [2, 2]);
  assert.deepEqual([giua.x0, giua.y0, giua.w, giua.h], [4, 4, 2, 2]);              // không sát tường: tâm hộp = điểm chạm
});

test("tinhHopPhong: điểm giữa cánh cửa nằm đúng cạnh theo phía cửa", () => {
  const h = (hc) => tinhHopPhong("bep", [0.5, 0.5], 10, 10, [2, 4], hc);
  assert.deepEqual([h("truoc").cuaX, h("truoc").cuaY], [5, 3]);
  assert.deepEqual([h("sau").cuaX, h("sau").cuaY], [5, 7]);
  assert.deepEqual([h("trai").cuaX, h("trai").cuaY], [4, 5]);
  assert.deepEqual([h("phai").cuaX, h("phai").cuaY], [6, 5]);
});

test("xoayHuongCua: trước → phải → sau → trái → trước, xoay ngược được", () => {
  assert.deepEqual([...THU_TU_HUONG_CUA], ["truoc", "phai", "sau", "trai"]);
  assert.equal(xoayHuongCua("truoc"), "phai");
  assert.equal(xoayHuongCua("phai"), "sau");
  assert.equal(xoayHuongCua("sau"), "trai");
  assert.equal(xoayHuongCua("trai"), "truoc");
  assert.equal(xoayHuongCua("truoc", -1), "trai");
  let hc = "sau";
  for (let i = 0; i < 4; i++) hc = xoayHuongCua(hc);
  assert.equal(hc, "sau");
});

test("huongCuaMacDinh (chỉ để vẽ mờ) & PHONG_CO_CUA", () => {
  assert.equal(huongCuaMacDinh("cua_chinh", [0.5, 0.03]), "truoc");
  assert.equal(huongCuaMacDinh("phong_ngu_chinh", [0.18, 0.5]), "phai");
  assert.equal(huongCuaMacDinh("ve_sinh", [0.82, 0.5]), "trai");
  assert.deepEqual([...PHONG_CO_CUA], ["phong_ngu_chinh", "bep", "ve_sinh"]);
});

test("dichDiem: dời theo mét, kẹp trong khung, làm tròn 3 chữ số", () => {
  assert.deepEqual(dichDiem([0.5, 0.5], 0.25, 0, 5, 15), [0.55, 0.5]);
  assert.deepEqual(dichDiem([0.5, 0.5], 0, -1, 5, 15), [0.5, 0.433]);
  assert.deepEqual(dichDiem([0.99, 0.01], 1, -1, 5, 15), [1, 0]);
  assert.deepEqual(dichDiem([0, 1], -1, 1, 5, 15), [0, 1]);
});

test("viTriTuongDoi: chia ba theo chiều sâu và chiều ngang của bản vẽ", () => {
  assert.deepEqual(viTriTuongDoi([0.1, 0.1]), { doc: "truoc", ngang: "trai" });
  assert.deepEqual(viTriTuongDoi([0.5, 0.5]), { doc: "giua", ngang: "giua" });
  assert.deepEqual(viTriTuongDoi([0.9, 0.9]), { doc: "sau", ngang: "phai" });
});
