// BLOG-7 — chuẩn hoá SEO bài NotFair trong CMS: hàm thuần, tất định.
import assert from "node:assert/strict";
import { test } from "node:test";
import { kiemDinhBai } from "../kiem-dinh/kiem-dinh.ts";
import { catTheoCau, chuanHoaBai, doanMang, kieuDauMoi, slugChuan, tieuDeSeo } from "./chuan-hoa-bai.ts";
import { htmlSangKhoi } from "./html-lexical.ts";

const lex = (html: string) => ({ root: { type: "root", direction: "ltr", format: "", indent: 0, version: 1, children: htmlSangKhoi(html) } });

const HTML = `<p>Thần số học là phương pháp đọc tính cách qua con số rút từ ngày sinh và họ tên. Bài này hướng dẫn cách tính số Đường đời từng bước, kèm ví dụ cụ thể để bạn tự kiểm. Bạn cũng sẽ biết các số bậc thầy nên đọc thế nào cho đúng.</p>
<h2>Thần số học là gì?</h2><p>Thần số học là hệ thống gán ý nghĩa cho các con số từ 1 đến 9 và các số bậc thầy. Người xưa tin mỗi con số mang một nhịp riêng, giúp ta tự soi bản thân.</p>
<h2>Cách tính số Đường đời thế nào?</h2><p>Cộng tất cả chữ số của ngày, tháng, năm sinh rồi rút gọn về một chữ số. Ví dụ sinh 24/10/1988: 2+4+1+0+1+9+8+8 = 33, giữ 33 vì là số bậc thầy.</p>
<h2>Số 7 có hòa hợp với số 2 không?</h2><p>Hai số này thường được mô tả là bổ sung cho nhau: số 7 trầm tư, số 2 mềm mỏng, nên dễ hòa thuận nếu tôn trọng khoảng riêng của nhau.</p>
<p>Xem thêm tại <a href="https://doi-tac.example/bai">đối tác hòa bình</a>.</p>`;

const BAI = {
  tieu_de: "Xem thần số học (Numerology): cách tính và đọc hồ sơ tinh tế cho người mới bắt đầu",
  slug: "xem-than-so-hoc-numerology-cach-tinh-va-đoc-ho-so-tinh-tao",
  noi_dung: lex(HTML), the: ["thần số học", "numerology", "số đường đời"], mang: "chung", loai_bai: "bai_viet",
  meta: { title: "", description: "" },
};

test("slug không dấu, sửa chữ đ sót của NotFair, ≤ 75 ký tự", () => {
  assert.equal(slugChuan("xem-than-so-hoc-numerology-cach-tinh-va-đoc-ho-so-tinh-tao"), "xem-than-so-hoc-numerology-cach-tinh-va-doc-ho-so-tinh-tao");
  const dai = slugChuan("a".repeat(30) + "-" + "b".repeat(30) + "-" + "c".repeat(30));
  assert.ok(dai.length <= 75 && /^[a-z0-9-]+$/.test(dai) && !dai.endsWith("-"));
});

test("kiểu bỏ dấu cũ → mới, không đụng âm tiết có phụ âm cuối / quý", () => {
  assert.equal(kieuDauMoi("hòa hợp, Khỏe mạnh, thủy, Hòa, hoàng, quý, tòa nhà"), "hoà hợp, Khoẻ mạnh, thuỷ, Hoà, hoàng, quý, toà nhà");
});

test("tiêu đề SEO 30–60 và câu cắt đúng ranh giới", () => {
  const t = tieuDeSeo(BAI.tieu_de);
  assert.ok(t.length >= 30 && t.length <= 60, t);
  assert.equal(tieuDeSeo("Bát tự là gì"), "Bát tự là gì");
  const c = catTheoCau("Câu một ngắn. Câu hai dài hơn một chút để đủ độ dài. Câu ba.", 30, 80);
  assert.equal(c, "Câu một ngắn. Câu hai dài hơn một chút để đủ độ dài.");
});

test("đoán mảng theo từ khoá", () => {
  assert.equal(doanMang("Cách gieo quẻ Kinh Dịch bằng 3 đồng xu"), "kinh_dich");
  assert.equal(doanMang("Hướng nhà hợp tuổi theo Bát trạch"), "phong_thuy");
  assert.equal(doanMang("Chuyện trò linh tinh"), "chung");
});

test("chuẩn hoá bài NotFair: điền đủ trường thiếu, giữ link đối tác, điểm kiểm định tăng", () => {
  const truoc = kiemDinhBai({ ...BAI, notfair_lien_ket: ["https://doi-tac.example/bai"] });
  const kq = chuanHoaBai(BAI, { anhBia: 11, anhTomTat: 12, slugDaDung: () => false });
  const d = kq.data as Record<string, any>;
  assert.equal(d.slug, "xem-than-so-hoc-numerology-cach-tinh-va-doc-ho-so-tinh-tao");
  assert.ok(d.meta.title.length >= 30 && d.meta.title.length <= 60);
  assert.ok(d.meta.description.length >= 70 && d.meta.description.length <= 160, d.meta.description);
  assert.equal(d.meta.image, 11);
  assert.equal(d.anh_bia, 11);
  assert.ok(d.mo_ta_ngan && d.tra_loi_nhanh);
  assert.equal(d.tu_khoa_chinh, "thần số học");
  assert.deepEqual(d.tu_khoa_phu, ["numerology", "số đường đời"]);
  assert.equal(d.mang, "than_so");
  assert.equal(d.loai_bai, "huong_dan");
  assert.equal(d.hoi_dap.length, 3);
  assert.equal(kq.muc.length, 3);
  const json = JSON.stringify(d.noi_dung);
  assert.ok(json.includes("dễ hoà thuận"), "đổi kiểu dấu ở chữ thường");
  assert.ok(json.includes("đối tác hòa bình"), "chữ gắn link đối tác giữ nguyên");
  assert.ok(json.includes('"value":12'), "chèn ảnh tóm tắt");
  assert.ok(json.includes("/than-so") && json.includes("/than-so/y-nghia-so"), "thêm liên kết nội bộ");
  const sau = kiemDinhBai({ ...BAI, ...d, notfair_lien_ket: ["https://doi-tac.example/bai"] });
  assert.equal(sau.loi_chan.length, 0);
  assert.ok(sau.diem > truoc.diem + 15, `${truoc.diem} → ${sau.diem}`);
  assert.ok(!sau.muc.some((m) => m.ma === "backlink_notfair" && m.muc_do === "loi"));
});

test("chạy lại lần hai không đổi gì thêm (idempotent)", () => {
  const lan1 = chuanHoaBai(BAI, { slugDaDung: () => false });
  const lan2 = chuanHoaBai({ ...BAI, ...lan1.data } as never, { slugDaDung: () => false });
  assert.deepEqual(lan2.thay_doi, []);
});

test("slug trùng bài khác → thêm hậu tố", () => {
  const kq = chuanHoaBai(BAI, { slugDaDung: (s) => s === "xem-than-so-hoc-numerology-cach-tinh-va-doc-ho-so-tinh-tao" });
  assert.equal((kq.data as { slug: string }).slug, "xem-than-so-hoc-numerology-cach-tinh-va-doc-ho-so-tinh-tao-2");
});

test("tiêu đề SEO giữ vế đầu chứa từ khoá, cắt trước từ nối", () => {
  assert.equal(tieuDeSeo("Xem thần số học (Numerology): cách tính và đọc hồ sơ cho người mới bắt đầu"), "Xem thần số học: cách tính và đọc hồ sơ");
  assert.equal(tieuDeSeo("Hướng nhà hợp tuổi theo Bát trạch — cách tính cung phi từng bước và bảng tra đầy đủ"),
    "Hướng nhà hợp tuổi theo Bát trạch");
});

test("4 ảnh/bài: ảnh lộ trình + ảnh hỏi đáp chèn trước mục H2 giữa và H2 cuối, đúng thứ tự", () => {
  const kq = chuanHoaBai(BAI, { anhBia: 11, anhTomTat: 12, anhPhu: [21, 22], slugDaDung: () => false });
  const goc = (kq.data.noi_dung as { root: { children: { type: string; value?: unknown; tag?: string }[] } }).root.children;
  const vt = (id: number) => goc.findIndex((k) => k.type === "upload" && k.value === id);
  const h2 = goc.map((k, i) => (k.type === "heading" && k.tag === "h2" ? i : -1)).filter((i) => i >= 0);
  assert.ok(vt(12) >= 0 && vt(21) >= 0 && vt(22) >= 0);
  assert.ok(vt(12) < vt(21) && vt(21) < vt(22));
  assert.equal(vt(22), h2[h2.length - 1]! - 1);          // ngay trước H2 cuối
  assert.ok(vt(21) < h2[h2.length - 1]! && vt(21) > h2[0]!);
  assert.ok(kq.thay_doi.some((t) => /lộ trình/i.test(t)) && kq.thay_doi.some((t) => /hỏi đáp|câu hỏi/i.test(t)));
});

test("không có anhPhu → thân bài như cũ (không chèn thêm ảnh)", () => {
  const kq = chuanHoaBai(BAI, { anhBia: 11, anhTomTat: 12, slugDaDung: () => false });
  const goc = (kq.data.noi_dung as { root: { children: { type: string }[] } }).root.children;
  assert.equal(goc.filter((k) => k.type === "upload").length, 1);
});

test("BLOG-9: chuẩn hoá bỏ dòng ghi công NotFair cuối bài đã nhập, chạy lại không đổi thêm", () => {
  const goc = BAI.noi_dung as { root: { children: unknown[] } };
  const ghiCong = { type: "paragraph", version: 1, children: [
    { type: "text", version: 1, text: "Authored with " },
    { type: "link", version: 3, fields: { url: "https://notfair.co" }, children: [{ type: "text", version: 1, text: "NotFair SEO" }] }] };
  const bai = { ...BAI, noi_dung: { root: { ...goc.root, children: [...goc.root.children, ghiCong] } } };
  const kq = chuanHoaBai(bai, { slugDaDung: () => false });
  const than = JSON.stringify((kq.data as Record<string, any>).noi_dung);
  assert.doesNotMatch(than, /Authored with/);
  assert.ok(kq.thay_doi.some((t) => t.includes("Authored with NotFair SEO")), kq.thay_doi.join("\n"));
  const lan2 = chuanHoaBai({ ...bai, ...(kq.data as object) }, { slugDaDung: () => false });
  assert.ok(!lan2.thay_doi.some((t) => t.includes("Authored with")));
});
