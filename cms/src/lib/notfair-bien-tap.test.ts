// NF-BT — biên tập lại bài NotFair: hàm thuần trên Lexical + tính nhất quán của nội dung (ảnh có tệp, alt, link trong site).
import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
import { htmlSangKhoi } from "./html-lexical.ts";
import { BIEN_TAP, apThanNf, altMoi, viTriDoanKet, THAY_CHU_CHUNG } from "./notfair-bien-tap.ts";
import { chuCua, KE_HOACH, type Nut } from "./kw6t-bai-cu.ts";

const lex = (html: string) => ({ root: { type: "root", children: htmlSangKhoi(html) as Nut[] } as Nut });
const ANH = new URL("../bai-khoi-tao/notfair/anh/", import.meta.url);

test("đoạn kết quảng bá được thay, ảnh mới thành chỗ giữ, cụm sáo được bớt", () => {
  const nd = lex(`<h2>A</h2><p>Một lăng kính văn hoá về phong thủy.</p><h2>B</h2><p>b</p>`
    + `<p>Hiểu Bản Thân cung cấp công cụ và nội dung. Bạn có thể khám phá tại <a href="https://hieuban.com">Hiểu Bản Thân</a>.</p>`);
  const kq = apThanNf(nd, { slug: "x", bia: { ten_tep: "x.webp", alt: "x" }, ket: "<p>Kết mới.</p>",
    chen: [{ cuoiMuc: "A", html: "<h3>Thêm</h3><p>[[ANH:y.webp]]</p><p>số</p>" }] });
  const chu = kq.noi_dung.root.children!.map(chuCua);
  assert.deepEqual(chu, ["A", "Một cách nhìn văn hoá về phong thuỷ.", "Thêm", "[[ANH:y.webp]]", "số", "B", "b", "Kết mới."]);
  assert.deepEqual(kq.anh, ["y.webp"]);
  assert.deepEqual(kq.loi, []);
});

test("không có đoạn quảng bá → thêm đoạn kết ở cuối và báo", () => {
  const kq = apThanNf(lex("<h2>A</h2><p>a</p>"), { slug: "x", bia: { ten_tep: "x.webp", alt: "x" }, ket: "<p>K</p>" });
  assert.equal(chuCua(kq.noi_dung.root.children!.at(-1)!), "K");
  assert.equal(kq.loi.length, 1);
  assert.equal(viTriDoanKet(lex("<p>Hiểu Bản Thân là tên site.</p>").root.children!), -1);
});

test("alt ảnh tự vẽ cũ nói nội dung ảnh, ≤ 160 ký tự; ảnh khác giữ nguyên", () => {
  const muc = ["Bước 1: Ghi ngày sinh", "Bước 2: Chọn cách cộng", "Bước 3: Cộng từng chữ số"];
  assert.equal(altMoi("Tóm tắt nhanh: Tiêu đề", muc, []), "Sơ đồ tóm tắt các ý chính: Ghi ngày sinh; Chọn cách cộng; Cộng từng chữ số");
  assert.equal(altMoi("Câu hỏi thường gặp: T", [], ["Một?", "Hai?"]), "Những câu hỏi thường gặp: Một; Hai");
  assert.equal(altMoi("Ảnh tôi chụp", muc, []), null);
  assert.ok(altMoi("Lộ trình bài viết: T", Array(20).fill("Một mục khá dài để vượt giới hạn"), [])!.length <= 160);
});

test("nội dung biên tập nhất quán: slug không trùng, ảnh có tệp, alt 40–160, mỗi chỗ giữ ảnh có khai báo, link trong site", () => {
  const slugs = BIEN_TAP.map((b) => b.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const conLai = new Set(KE_HOACH.filter((k) => !k.gopVao).flatMap((k) => [k.slug, k.slugMoi].filter(Boolean) as string[]));
  for (const s of slugs) assert.ok(conLai.has(s) || /^(cach-doc-dai-van|vi-du-tinh-so|boi-que-dich|xem-tuong)/.test(s), `bài ${s} lạ`);
  for (const b of BIEN_TAP) {
    for (const a of [b.bia, ...(b.chen ?? []).flatMap((c) => (c.anh ? [c.anh] : []))]) {
      assert.ok(existsSync(new URL(a.ten_tep, ANH)), a.ten_tep);
      assert.ok(a.alt.length >= 40 && a.alt.length <= 160, `${a.ten_tep}: alt ${a.alt.length}`);
    }
    for (const c of b.chen ?? []) {
      const giu = [...c.html.matchAll(/\[\[ANH:([^\]]+)\]\]/g)].map((m) => m[1]);
      assert.deepEqual(giu, c.anh ? [c.anh.ten_tep] : [], `${b.slug}: chỗ giữ ảnh`);
    }
    for (const html of [b.ket, ...(b.chen ?? []).map((c) => c.html)]) {
      for (const [, href] of html.matchAll(/href="([^"]+)"/g)) assert.match(href!, /^\/[a-z0-9\-/#?=_]*$/, `${b.slug}: ${href}`);
    }
    for (const h of b.hoiDapThem ?? []) assert.ok(h.cau_hoi.length <= 200 && h.tra_loi.length <= 1200);
  }
});

test("bảng thay chữ không tạo vòng (chữ thay không chứa lại chữ gốc)", () => {
  for (const [a, b] of THAY_CHU_CHUNG) assert.ok(!b.includes(a), `${a} → ${b}`);
});
