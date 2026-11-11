// KW-6T — sửa bài cũ theo kế hoạch từ khoá: hàm thuần trên Lexical + kiểm tính nhất quán của kế hoạch.
import assert from "node:assert/strict";
import { test } from "node:test";
import { htmlSangKhoi } from "./html-lexical.ts";
import { apThan, apTruong, chenCuoiMuc, chuCua, KE_HOACH, thayLinkGoc, type Nut } from "./kw6t-bai-cu.ts";

const lex = (html: string) => ({ root: { type: "root", children: htmlSangKhoi(html) as Nut[] } as Nut });

test("link 'Hiểu Bản Thân' về trang chủ → công cụ đúng mảng, chữ liên kết nói rõ công cụ", () => {
  const nd = lex(`<p>Bắt đầu tại <a href="https://hieuban.com">Hiểu Bản Thân</a> hoặc <a href="https://hieuban.com/than-so">xem thần số học</a>.</p>`);
  assert.equal(thayLinkGoc(nd.root, { url: "/tu-vi", chu: "lập lá số Tử vi miễn phí" }), 1);
  const json = JSON.stringify(nd);
  assert.ok(json.includes('"url":"/tu-vi"') && json.includes("lập lá số Tử vi miễn phí"));
  assert.ok(json.includes('"url":"https://hieuban.com/than-so"'), "link khác giữ nguyên");
});

test("chèn vào cuối mục: trước tiêu đề cùng cấp kế tiếp, lùi qua ảnh đứng sát", () => {
  const nd = lex(`<h2>A</h2><p>a1</p><h3>A.1</h3><p>a2</p><h2>B</h2><p>b</p>`);
  const ds = nd.root.children!;
  ds.splice(4, 0, { type: "upload", value: 1 });
  assert.ok(chenCuoiMuc(ds, "A", [{ type: "paragraph", children: [{ type: "text", text: "MỚI" }] }]));
  assert.deepEqual(ds.map((n) => (n.type === "upload" ? "ảnh" : chuCua(n))), ["A", "a1", "A.1", "a2", "MỚI", "ảnh", "B", "b"]);
  assert.ok(chenCuoiMuc(ds, "B", [{ type: "paragraph", children: [{ type: "text", text: "CUỐI" }] }]));
  assert.equal(chuCua(ds[ds.length - 1]!), "CUỐI");
  assert.equal(chenCuoiMuc(ds, "Không có", []), false);
});

test("thay chữ trong từng nút chữ (đoạn có chữ in đậm), cả trả lời nhanh; báo mục không tìm thấy", () => {
  const ke = { slug: "x", thayChu: [["Nếu bạn đang tìm ", ""], ["xem bói", "Xem hợp đôi"]] as [string, string][],
    chen: [{ cuoiMuc: "Không có mục này", html: "<p>x</p>" }] };
  const kq = apThan(lex(`<p>Nếu bạn đang tìm <strong>xem bói</strong>: đọc tỉnh táo.</p>`), ke);
  assert.equal(chuCua(kq.noi_dung.root), "Xem hợp đôi: đọc tỉnh táo.");
  assert.deepEqual(kq.loi, ['không thấy mục "Không có mục này"']);
  const data = apTruong({ tra_loi_nhanh: "Nếu bạn đang tìm xem bói: …", tu_khoa_phu: ["a"] }, { ...ke, phuThem: ["a", "b"] });
  assert.equal(data.tra_loi_nhanh, "Xem hợp đôi: …");
  assert.deepEqual(data.tu_khoa_phu, ["a", "b"]);
  assert.match(String(data.ghi_chu_duyet), /^KW-6T \d{4}-\d{2}-\d{2}/);
});

test("hỏi đáp: đổi câu cũ, thêm câu mới không trùng, tối đa 10", () => {
  const bai = { hoi_dap: [{ cau_hoi: "Cũ?", tra_loi: "x", id: "1" }] };
  const d = apTruong(bai, { slug: "x", hoiDapThay: [["Cũ?", "Mới?"]], hoiDapThem: [{ cau_hoi: "Mới?", tra_loi: "y" }, { cau_hoi: "Khác?", tra_loi: "z" }] });
  assert.deepEqual((d.hoi_dap as { cau_hoi: string }[]).map((h) => h.cau_hoi), ["Mới?", "Khác?"]);
});

test("kế hoạch nhất quán: slug không trùng, bài gộp có đích, từ khoá chính không trùng, link nội bộ đúng dạng", () => {
  const slugs = KE_HOACH.map((k) => k.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const conLai = new Set(KE_HOACH.filter((k) => !k.gopVao).flatMap((k) => [k.slug, k.slugMoi].filter(Boolean) as string[]));
  for (const k of KE_HOACH.filter((x) => x.gopVao)) assert.ok(conLai.has(k.gopVao!), `đích gộp ${k.gopVao}`);
  for (const k of KE_HOACH) for (const s of k.lienQuan ?? []) assert.ok(conLai.has(s), `${k.slug}: bài liên quan ${s} không có trong kế hoạch`);
  const tk = KE_HOACH.map((k) => k.tuKhoaChinh).filter(Boolean);
  assert.equal(new Set(tk).size, tk.length, "từ khoá chính trùng");
  for (const k of KE_HOACH) {
    for (const html of [k.themCuoi ?? "", ...(k.chen ?? []).map((c) => c.html)]) {
      for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
        assert.match(href!, /^\/[a-z0-9-]+(\/[a-z0-9-]+)*(#[a-z-]+)?$/, `${k.slug}: link ${href}`);
        if (href!.startsWith("/blog/")) assert.ok(conLai.has(href!.slice(6)), `${k.slug}: bài ${href} không còn xuất bản`);
      }
    }
    if (k.slugMoi) assert.match(k.slugMoi, /^[a-z0-9-]{10,75}$/);
  }
});

test("bài đổi tiêu đề không còn chữ 'bói' trong tiêu đề, mô tả SEO", () => {
  for (const k of KE_HOACH.filter((x) => x.slugMoi)) {
    const d = k.dat as { tieu_de: string; meta: { title: string; description: string } };
    assert.ok(!/bói/i.test(d.tieu_de + d.meta.title), d.tieu_de);
    assert.ok(d.meta.title.length <= 60 && d.meta.description.length <= 170, d.meta.title);
  }
});
