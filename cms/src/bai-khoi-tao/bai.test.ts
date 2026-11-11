// BLOG-6 — mọi bài khởi tạo phải qua bộ kiểm định CMS: 0 lỗi, không mục chặn, điểm ≥ 85 (chỉ còn cảnh báo không sửa được
// bằng chữ: ảnh bìa — Chủ biên gắn khi duyệt; chữ ký chuyên gia — người thật ký). Chạy: npm test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { kiemDinhBai } from "../kiem-dinh/kiem-dinh.ts";
import { noiDungLexical, type BaiKhoiTao } from "./bai.ts";

const THU_MUC = new URL(".", import.meta.url);
const docThuMuc = (u: URL): BaiKhoiTao[] => readdirSync(u).filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(new URL(f, u), "utf8")) as BaiKhoiTao);
const ds: BaiKhoiTao[] = docThuMuc(THU_MUC);
// KW-6T tuần 1–2 (thư mục con kw6t/): cùng bộ kiểm định, cùng khuôn dữ liệu.
const dsKw6t: BaiKhoiTao[] = docThuMuc(new URL("kw6t/", THU_MUC));

// Chỉ hai mục này được phép còn cảnh báo: cần người thật (ảnh bìa, chuyên gia ký).
const DUOC_CANH_BAO = new Set(["anh_bia", "chuyen_gia"]);

test("có bài khởi tạo cho đủ ba mảng chưa có bài", () => {
  for (const m of ["kinh_dich", "bat_tu", "phong_thuy"]) assert.ok(ds.some((b) => b.mang === m), `thiếu bài mảng ${m}`);
});

for (const b of [...ds, ...dsKw6t]) {
  test(`kiểm định CMS: ${b.slug}`, () => {
    const kq = kiemDinhBai({ ...b, noi_dung: noiDungLexical(b.html), ky_ten: "ban_bien_tap" });
    const loi = kq.muc.filter((m) => m.muc_do === "loi" || m.chan);
    assert.deepEqual(loi.map((m) => `${m.ma}: ${m.thong_diep}`), []);
    const cb = kq.muc.filter((m) => m.muc_do === "canh_bao" && !DUOC_CANH_BAO.has(m.ma));
    assert.deepEqual(cb.map((m) => `${m.ma}: ${m.thong_diep}`), []);
    assert.ok(kq.diem >= 85, `điểm ${kq.diem}`);
  });
  test(`khuôn dữ liệu: ${b.slug}`, () => {
    assert.match(b.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(b.slug.length <= 75);
    assert.ok(b.tieu_de.length <= 120 && b.mo_ta_ngan.length <= 300 && b.tra_loi_nhanh.length <= 700);
    assert.ok(b.hoi_dap.length >= 3 && b.hoi_dap.length <= 10);
    for (const h of b.hoi_dap) assert.ok(h.cau_hoi.length <= 200 && h.tra_loi.length <= 1200, h.cau_hoi);
    assert.ok(b.the.length <= 12 && b.tu_khoa_phu.length <= 10);
    // Link trong thân bài: chỉ đường dẫn trong site (bài khởi tạo không có backlink ngoài).
    for (const m of b.html.matchAll(/href="([^"]+)"/g)) assert.match(m[1]!, /^\/[a-z0-9\-/#?=&.]*$/, m[1]);
  });
}

test("KW-6T: đủ 8 bài tuần 1–2, slug không trùng lô cũ, mỗi bài 4 ảnh có tệp + alt", () => {
  assert.equal(dsKw6t.length, 8);
  const cu = new Set(ds.map((b) => b.slug));
  for (const b of dsKw6t) {
    assert.ok(!cu.has(b.slug), b.slug);
    assert.equal(b.anh?.length, 4, b.slug);
    assert.equal(b.anh!.filter((a) => a.vi_tri === "bia").length, 1, b.slug);
    for (const a of b.anh!) {
      assert.ok(existsSync(new URL(`kw6t/anh/${a.ten_tep}`, THU_MUC)), a.ten_tep);
      assert.ok(a.alt.length >= 40 && a.alt.length <= 160, `${a.ten_tep}: alt ${a.alt.length} ký tự`);
      // Ảnh trong bài phải có chỗ chèn: một H2/H3 chứa đúng chữ vi_tri.
      if (a.vi_tri !== "bia") assert.ok(new RegExp(`<h[23]>[^<]*${a.vi_tri.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(b.html), `${a.ten_tep}: không thấy H2 "${a.vi_tri}"`);
    }
  }
});
