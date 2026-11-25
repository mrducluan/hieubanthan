// QLNS-2/3 — hàm dựng chữ/alt cho ảnh minh hoạ trang /quan-ly-nhan-su (thuần, nhận kho làm tham số).
import test from "node:test";
import assert from "node:assert/strict";
import { hinhQL, khoaHanh, KIEU_HINH_QL, laKieuHinhQL, vaiTroGon } from "./quan-ly-hinh.ts";

const dm = {
  vai_tro_hanh: [
    { hanh: "Kim", vai_tro: "Kiểm soát tài chính · Pháp chế · Quản trị rủi ro", gia_tri: "x" },
    { hanh: "Mộc", vai_tro: "Mở rộng thị trường · Chiến lược · Phát triển dự án mới", gia_tri: "x" },
    { hanh: "Thủy", vai_tro: "Đối ngoại · Thương lượng · R&D", gia_tri: "x" },
    { hanh: "Hỏa", vai_tro: "Kinh doanh tuyến đầu · Truyền thông", gia_tri: "x" },
    { hanh: "Thổ", vai_tro: "Vận hành · Quy trình · Giữ chân khách hàng", gia_tri: "x" },
  ],
  tinh_huong: Array.from({ length: 7 }, (_, i) => ({ ma: `m${i}`, van_de: `Tình huống số ${i + 1}`, goc_nhin: "g", mo_loi: "m", viec: "v" })),
  ke_hoach_mau: ["1", "2", "3", "4"].map((n) => ({ tuan: `Tuần ${n}`, tieu_de: `Việc tuần ${n}`, y: `Ý tuần ${n}` })),
};

test("khoá hành bỏ dấu: Thủy và Thuỷ là một", () => {
  assert.equal(khoaHanh("Thủy"), "thuy");
  assert.equal(khoaHanh("Thuỷ"), "thuy");
  assert.equal(khoaHanh("Hỏa"), "hoa");
});

test("năm hành: xếp theo chiều tương sinh, mỗi hành hai vai trò đầu, alt nêu đủ năm hành và ≤ 300 ký tự", () => {
  const h = hinhQL("ngu-hanh", dm);
  assert.deepEqual(h.muc.map((m) => m.nhan), ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"]);
  assert.equal(h.muc[0].tieu, vaiTroGon(dm.vai_tro_hanh[1].vai_tro));
  assert.ok(!h.muc[0].tieu.includes("Phát triển"));
  for (const t of ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"]) assert.ok(h.alt.includes(t), t);
  assert.ok(h.alt.length <= 300 && h.alt.length > 60);
});

test("thiếu một hành hoặc kho rỗng → không dựng hình (trang tự ẩn)", () => {
  assert.equal(hinhQL("ngu-hanh", { ...dm, vai_tro_hanh: dm.vai_tro_hanh.slice(1) }), null);
  for (const k of ["ngu-hanh", "tinh-huong", "ke-hoach"]) assert.equal(hinhQL(k, null), null, k);
  assert.equal(hinhQL("ke-hoach", { ...dm, ke_hoach_mau: [] }), null);
});

test("hình tĩnh (văn phòng, ba bước) dựng được khi engine bận; alt đủ nghĩa", () => {
  for (const k of ["van-phong", "quy-trinh"]) {
    const h = hinhQL(k, null);
    assert.ok(h && h.alt.length > 60 && h.alt.length <= 300 && h.chuThich.length > 20, k);
  }
  assert.match(hinhQL("van-phong", null).alt, /năm người/);
});

test("tình huống lấy tối đa sáu; kế hoạch nêu bốn tuần; mọi kiểu đều có alt", () => {
  assert.equal(hinhQL("tinh-huong", dm).muc.length, 6);
  assert.match(hinhQL("ke-hoach", dm).alt, /Tuần 1/);
  for (const k of KIEU_HINH_QL) assert.ok(hinhQL(k, dm).alt.length <= 300, k);
});

test("kiểu hình lạ bị từ chối", () => {
  assert.equal(laKieuHinhQL("van-phong"), true);
  assert.equal(laKieuHinhQL("../etc"), false);
  assert.equal(laKieuHinhQL(null), false);
});
