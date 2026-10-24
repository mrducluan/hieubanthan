// BLOG-3: HTML bài NotFair → cây Lexical (bộ đọc tự viết, không dependency).
import assert from "node:assert/strict";
import { test } from "node:test";
import { docHtml, giaiMa, htmlSangKhoi, linkHopLe, linkNgoai, thayAnh, type NutLexical } from "./html-lexical.ts";

const MAU = `<h1>Tiêu đề trong bài</h1>
<nav class="nf-toc" aria-label="Mục lục"><p class="nf-toc-title">Mục lục</p><ul><li class="nf-toc-l2"><a href="#a">Phần A</a></li></ul></nav>
<h2 id="a">Phần A &amp; B</h2>
<p style="color:red" onclick="alert(1)">Đoạn <strong>đậm</strong> và <em>nghiêng <b>cả hai</b></em> <a href="javascript:alert(1)">xấu</a> <a href="https://vidu.vn/x" target="_blank">tốt</a></p>
<script>alert("x")</script><style>p{}</style>
<ul><li>một</li><li><p>hai</p><ul><li>con</li></ul></li></ul>
<ol><li>x</li><li>y</li></ol>
<h3 id="b">Phần B</h3><blockquote><p>Trích</p><p>dòng 2</p></blockquote>
<div class="nf-tablewrap"><table><thead><tr><th>Cột 1</th><th>Cột 2</th></tr></thead><tbody><tr><td>a</td><td><p>b</p></td></tr></tbody></table></div>
<figure><img src="https://notfair.co/api/seo/img/1.png" alt="Sơ đồ"><figcaption>Chú thích ảnh</figcaption></figure>
<p>Có ảnh <img src="http://khong-an-toan/x.png" alt="x"> và <img src="https://notfair.co/a.png" alt="nội dòng"> giữa đoạn.</p>
<form action="/x"><input name="p"></form><hr>
<p class="nf-attribution">Bài trao đổi qua NotFair.</p>`;

const loai = (ds: { type: string }[]) => ds.map((k) => k.type);
const chuCua = (n: NutLexical): string =>
  n.type === "text" ? String(n.text) : ((n.children as NutLexical[] | undefined) ?? []).map(chuCua).join("");

test("giải mã thực thể + đọc thuộc tính có dấu nháy", () => {
  assert.equal(giaiMa("A &amp; B &#39;x&#39; &#x1F600; &nbsp;"), "A & B 'x' 😀  ");
  const [a] = docHtml(`<a href='https://x.vn/?a=1&amp;b=2' title="T">l</a>`) as { thuocTinh: Record<string, string> }[];
  assert.equal(a!.thuocTinh.href, "https://x.vn/?a=1&b=2");
});

test("cấu trúc khối: h1→h2, bỏ mục lục/script/form, giữ thứ tự", () => {
  const k = htmlSangKhoi(MAU);
  assert.deepEqual(loai(k), ["heading", "heading", "paragraph", "list", "list", "heading", "quote", "table", "__anh",
    "paragraph", "__anh", "horizontalrule", "paragraph"]);
  assert.equal((k[0] as NutLexical).tag, "h2");
  assert.equal(chuCua(k[1] as NutLexical), "Phần A & B");
  assert.doesNotMatch(JSON.stringify(k), /alert|Mục lục|p\{\}/);
  assert.equal(chuCua(k[12] as NutLexical), "Bài trao đổi qua NotFair.");
});

test("nội dòng: định dạng cộng dồn, link chỉ http(s)/mailto/nội bộ", () => {
  const p = htmlSangKhoi(MAU)[2] as NutLexical;
  const con = p.children as NutLexical[];
  const dam = con.find((c) => c.text === "đậm")!;
  assert.equal(dam.format, 1);
  assert.equal(con.find((c) => c.text === "cả hai")!.format, 3);
  const link = con.filter((c) => c.type === "link");
  assert.equal(link.length, 1);
  assert.deepEqual(link[0]!.fields, { linkType: "custom", url: "https://vidu.vn/x", newTab: true });
  assert.ok(con.some((c) => c.type === "text" && String(c.text).includes("xấu")), "link xấu còn chữ, mất link");
  assert.equal(linkHopLe("/than-so"), "/than-so");
  assert.equal(linkHopLe("//evil.com"), null);
  assert.equal(linkHopLe("#a"), null);
});

test("danh sách lồng + bảng có hàng tiêu đề + trích dẫn nhiều đoạn", () => {
  const k = htmlSangKhoi(MAU) as NutLexical[];
  const ul = k[3]!;
  assert.equal(ul.listType, "bullet");
  const muc = ul.children as NutLexical[];
  assert.deepEqual(muc.map(chuCua), ["một", "hai", "con"]);
  assert.equal(((muc[2]!.children as NutLexical[])[0]!).type, "list");
  assert.equal(k[4]!.listType, "number");
  const bang = k[7]!;
  const hang = bang.children as NutLexical[];
  assert.equal(hang.length, 2);
  const o = (hang[0]!.children as NutLexical[]);
  assert.equal(o[0]!.headerState, 1);
  assert.equal((hang[1]!.children as NutLexical[])[0]!.headerState, 0);
  assert.equal(chuCua((hang[1]!.children as NutLexical[])[1]!), "b");
  assert.deepEqual(((k[6]!.children as NutLexical[]).map((c) => c.type)), ["text", "linebreak", "text"]);
});

test("ảnh: chỉ https, figure lấy chú thích, ảnh nội dòng đưa ra sau đoạn; thay bằng nút upload", () => {
  const k = htmlSangKhoi(MAU);
  const anh = k.filter((x) => x.type === "__anh") as { src: string; alt: string; chu_thich: string }[];
  assert.deepEqual(anh.map((a) => [a.src, a.alt, a.chu_thich]), [
    ["https://notfair.co/api/seo/img/1.png", "Sơ đồ", "Chú thích ảnh"], ["https://notfair.co/a.png", "nội dòng", ""]]);
  const st = thayAnh(k, (a) => (a.alt === "Sơ đồ" ? 7 : null));
  const up = st.root.children.filter((c) => c.type === "upload");
  assert.equal(up.length, 1);
  assert.equal(up[0]!.value, 7);
  assert.equal(up[0]!.relationTo, "media");
  assert.equal(st.root.children.filter((c) => c.type === "__anh").length, 0);
  // Nhập NotFair khi kho ảnh lỗi: ảnh không vào được → đoạn đánh dấu ĐÚNG CHỖ, có link + alt để chèn lại.
  const dd = thayAnh(k, () => null, true);
  const doanDD = dd.root.children.filter((c) => c.type === "paragraph"
    && JSON.stringify(c.children).includes("[Ảnh chưa nhập"));
  assert.equal(doanDD.length, 2);
  assert.match(JSON.stringify(doanDD[0]), /notfair\.co\/api\/seo\/img\/1\.png \(alt: Sơ đồ\)\]/);
  assert.equal(dd.root.children.filter((c) => c.type === "upload").length, 0);
});

test("link ra ngoài (backlink) để kiểm định giữ lại", () => {
  assert.deepEqual(linkNgoai(MAU), ["https://vidu.vn/x"]);
  assert.deepEqual(linkNgoai(`<a href="https://hieuban.com/than-so">x</a><a href="https://a.vn">a</a><a href="https://a.vn">b</a>`), ["https://a.vn"]);
});

test("HTML hỏng không làm sập: thẻ không đóng, thẻ đóng lạc", () => {
  const k = htmlSangKhoi("<p>một <b>hai<p>ba</div></span> bốn<ul><li>x<li>y</ul>");
  assert.deepEqual(loai(k), ["paragraph", "paragraph", "list"]);
  assert.equal(chuCua(k[1] as NutLexical), "ba bốn");
  assert.equal((k[2] as NutLexical & { children: unknown[] }).children.length, 2);
});
