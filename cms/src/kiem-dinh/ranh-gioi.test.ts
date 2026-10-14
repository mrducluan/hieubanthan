// ND — luật ranh giới cho ô chữ CMS ngoài bài viết (Trang website, Mẫu cụm, chân trang).
import assert from "node:assert/strict";
import { test } from "node:test";
import { kiemRanhGioi, laDuongTrongSite } from "./kiem-dinh.ts";

const chan = (van: string, o?: Parameters<typeof kiemRanhGioi>[1]) => kiemRanhGioi(van, o).filter((m) => m.chan).map((m) => m.ma);

test("chữ sạch: không lỗi chặn", () => {
  assert.deepEqual(chan("Năm hệ thống văn hoá trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng."), []);
});

test("vùng cấm, liên hệ gõ tay, tên nội bộ BM-1 → chặn", () => {
  assert.deepEqual(chan("Xem ngày mua xổ số"), ["vung_cam"]);
  assert.deepEqual(chan("Gọi 0912 345 678 để được tư vấn"), ["lien_he"]);
  assert.deepEqual(chan("Viết thư cho ban@vidu.vn"), ["lien_he"]);
  assert.deepEqual(chan("Lá số tính bằng iztro"), ["ten_noi_bo"]);
  assert.deepEqual(chan("Gọi 115 khi cấp cứu"), []);   // số ngắn (khẩn cấp) không phải số điện thoại gõ tay
});

test("tự nhận thẩm định → chặn, trừ mục được phép nói về quy trình", () => {
  for (const s of ["Bài này đã thẩm định kỹ", "Nội dung được chuyên gia thẩm định", "Thẩm định bởi chuyên gia", "Chuyên gia Đức Luân đã duyệt trang này"]) {
    assert.deepEqual(chan(s), ["tham_dinh_gia"], s);
  }
  assert.deepEqual(chan("Trang đã thẩm định ghi ngày thẩm định.", { choThamDinh: true }), []);
  assert.deepEqual(chan("Ai biên soạn, ai thẩm định"), []);
});

test("lời mời: cấm doạ, đếm ngược (chỉ khi loiMoi)", () => {
  assert.deepEqual(chan("Chỉ còn 2 giờ, mời bạn ngay kẻo lỡ", { loiMoi: true }), ["doa"]);
  assert.deepEqual(chan("Mời bạn cùng xem — cả hai cùng nhận Sao", { loiMoi: true }), []);
});

test("đường dẫn trong site", () => {
  for (const d of ["/", "/tu-vi", "/gioi-thieu#nguon"]) assert.ok(laDuongTrongSite(d), d);
  for (const d of ["//evil.vn", "/\\evil.vn", "https://x.vn", "javascript:alert(1)", "/a b", 3]) assert.ok(!laDuongTrongSite(d), String(d));
});
