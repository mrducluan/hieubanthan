// BLOG-3 — HTML (bài NotFair) → cây Lexical của trường "Thân bài", để Chủ biên sửa bài trong CMS như bài tự viết.
// Tự viết bộ đọc HTML (không thêm dependency): HTML của NotFair sinh tự động, ít thẻ, đúng cú pháp. Chỉ giữ thứ trình soạn
// có: tiêu đề h2–h4 (h1 trong bài hạ xuống h2 — trang đã có H1 là tiêu đề bài), đoạn, đậm/nghiêng/gạch/mã, link
// (http/https/mailto/đường dẫn trong site), danh sách lồng, trích dẫn, bảng, đường kẻ, ảnh. Bỏ mục lục `nf-toc`
// (web tự dựng mục lục từ H2/H3), script/style/form. Ảnh trả về dạng chỗ giữ `{type:"__anh"}` — nơi gọi tải ảnh vào
// Thư viện ảnh rồi thay bằng nút upload (hàm thayAnh).

export type NutHtml = { ten: string; thuocTinh: Record<string, string>; con: NutHtml[] } | { chu: string };
type Phan = NutHtml & { ten: string; thuocTinh: Record<string, string>; con: NutHtml[] };
export type NutLexical = Record<string, unknown> & { type: string };
export type ChoAnh = { type: "__anh"; src: string; alt: string; chu_thich: string };

const RONG = new Set(["img", "br", "hr", "meta", "link", "input", "source", "wbr", "col", "area", "base", "embed", "track"]);
const BO_HAN = new Set(["script", "style", "noscript", "template", "form", "iframe", "object", "svg", "button", "select", "textarea", "head", "title"]);
const KHOI = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "table", "thead", "tbody", "tfoot",
  "tr", "td", "th", "figure", "figcaption", "div", "section", "article", "main", "header", "footer", "aside", "nav", "hr", "pre"]);

const THUC_THE: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  hellip: "…", laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", copy: "©", reg: "®", middot: "·" };

export function giaiMa(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, k: string) => {
    if (k[0] === "#") {
      const so = k[1] === "x" || k[1] === "X" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return Number.isFinite(so) && so > 0 && so < 0x110000 ? String.fromCodePoint(so) : m;
    }
    return THUC_THE[k.toLowerCase()] ?? m;
  });
}

function docThuocTinh(s: string): Record<string, string> {
  const kq: Record<string, string> = {};
  for (const m of s.matchAll(/([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g)) {
    kq[m[1]!.toLowerCase()] = giaiMa(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return kq;
}

/** Đọc HTML thành cây. Thẻ đóng lệch được bỏ qua; thẻ chưa đóng tự đóng ở cuối. */
export function docHtml(html: string): NutHtml[] {
  const goc: Phan = { ten: "#goc", thuocTinh: {}, con: [] };
  const ngan: Phan[] = [goc];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[^>]*>|<\/\s*([a-z][a-z0-9-]*)\s*>|<([a-z][a-z0-9-]*)((?:\s+[^\s=/>"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?)*)\s*(\/?)>/gi;
  let i = 0;
  const dinh = () => ngan[ngan.length - 1]!;
  const themChu = (t: string) => { if (t) dinh().con.push({ chu: giaiMa(t) }); };
  for (const m of html.matchAll(re)) {
    themChu(html.slice(i, m.index));
    i = m.index! + m[0].length;
    if (m[1]) {
      const ten = m[1].toLowerCase();
      const vt = ngan.map((n) => n.ten).lastIndexOf(ten);
      if (vt > 0) ngan.length = vt;
    } else if (m[2]) {
      const ten = m[2].toLowerCase();
      // <p> không lồng: gặp thẻ khối mới khi đang trong <p> → đóng <p> (như trình duyệt).
      if (KHOI.has(ten)) {
        const p = ngan.map((n) => n.ten).lastIndexOf("p");
        if (p > 0 && ngan.slice(p + 1).every((n) => !KHOI.has(n.ten))) ngan.length = p;
      }
      if (ten === "li" && dinh().ten === "li") ngan.pop();
      if ((ten === "td" || ten === "th") && ["td", "th"].includes(dinh().ten)) ngan.pop();
      const nut: Phan = { ten, thuocTinh: docThuocTinh(m[3] ?? ""), con: [] };
      dinh().con.push(nut);
      if (BO_HAN.has(ten) && !m[4]) {
        // Bỏ nguyên phần thân (script/style…): nhảy tới thẻ đóng tương ứng.
        const dong = html.toLowerCase().indexOf(`</${ten}`, i);
        i = dong < 0 ? html.length : html.indexOf(">", dong) + 1 || html.length;
        continue;
      }
      if (!RONG.has(ten) && !m[4]) ngan.push(nut);
    }
  }
  themChu(html.slice(i));
  return goc.con;
}

// ---------------------------------------------------------------- dựng nút Lexical

const DINH_DANG: Record<string, number> = { strong: 1, b: 1, em: 2, i: 2, s: 4, del: 4, strike: 4, u: 8, code: 16, sub: 32, sup: 64 };
const chu = (text: string, format = 0): NutLexical => ({ type: "text", text, format, detail: 0, mode: "normal", style: "", version: 1 });
const phanTu = (type: string, children: NutLexical[], them: Record<string, unknown> = {}): NutLexical =>
  ({ type, children, direction: "ltr", format: "", indent: 0, version: 1, ...them });
const doan = (children: NutLexical[]) => phanTu("paragraph", children, { textFormat: 0, textStyle: "" });

const laPhan = (n: NutHtml): n is Phan => "ten" in n;
const coLop = (n: Phan, lop: string) => (n.thuocTinh.class ?? "").split(/\s+/).includes(lop);

/** Link giữ được: http(s), mailto, đường dẫn trong site. Còn lại (javascript:, neo #…, data:) → chỉ giữ chữ. */
export function linkHopLe(href: string | undefined): string | null {
  const h = (href ?? "").trim();
  if (/^https?:\/\/[^\s]+$/i.test(h) || /^mailto:[^\s]+$/i.test(h)) return h;
  if (/^\/(?!\/)[^\s]*$/.test(h)) return h;
  return null;
}

type Ngu = { anh: ChoAnh[] };

/** Nội dòng: chữ + định dạng + link + xuống dòng. Ảnh nội dòng được đẩy ra ngoài (ngữ cảnh.anh). */
function noiDong(nodes: NutHtml[], ngu: Ngu, format = 0): NutLexical[] {
  const kq: NutLexical[] = [];
  for (const n of nodes) {
    if (!laPhan(n)) {
      const t = n.chu.replace(/\s+/g, " ");
      if (t) kq.push(chu(t, format));
      continue;
    }
    if (BO_HAN.has(n.ten)) continue;
    if (n.ten === "br") { kq.push({ type: "linebreak", version: 1 }); continue; }
    if (n.ten === "img") { const a = choAnh(n); if (a) ngu.anh.push(a); continue; }
    if (n.ten === "a") {
      const url = linkHopLe(n.thuocTinh.href);
      const con = noiDong(n.con, ngu, format);
      if (url && con.length) {
        kq.push(phanTu("link", con, { version: 3,
          fields: { linkType: "custom", url, newTab: n.thuocTinh.target === "_blank" } }));
      } else kq.push(...con);
      continue;
    }
    kq.push(...noiDong(n.con, ngu, format | (DINH_DANG[n.ten] ?? 0)));
  }
  return kq;
}

/** Bỏ khoảng trắng thừa ở đầu/cuối đoạn và gộp chữ liền kề cùng định dạng. */
function gon(ds: NutLexical[]): NutLexical[] {
  const kq: NutLexical[] = [];
  for (const n of ds) {
    const truoc = kq[kq.length - 1];
    if (n.type === "text" && truoc?.type === "text" && truoc.format === n.format) truoc.text = `${truoc.text}${n.text}`;
    else kq.push(n.type === "text" ? { ...n } : n);
  }
  const dau = kq[0], cuoi = kq[kq.length - 1];
  if (dau?.type === "text") dau.text = String(dau.text).replace(/^\s+/, "");
  if (cuoi?.type === "text") cuoi.text = String(cuoi.text).replace(/\s+$/, "");
  return kq.filter((n) => n.type !== "text" || n.text !== "").filter((n, i, a) =>
    !(n.type === "linebreak" && (i === 0 || i === a.length - 1)));
}

function choAnh(n: Phan, chuThich = ""): ChoAnh | null {
  const src = (n.thuocTinh.src ?? "").trim();
  if (!/^https:\/\//i.test(src)) return null;
  return { type: "__anh", src, alt: (n.thuocTinh.alt ?? "").trim(), chu_thich: chuThich };
}

const chuThuan = (nodes: NutHtml[]): string => nodes.map((n) => (laPhan(n) ? chuThuan(n.con) : n.chu)).join("");

function danhSach(n: Phan, ngu: Ngu): NutLexical {
  const so = n.ten === "ol";
  const muc: NutLexical[] = [];
  let thuTu = 1;
  for (const li of n.con) {
    if (!laPhan(li) || li.ten !== "li") continue;
    const trong = li.con.filter((c) => !(laPhan(c) && (c.ten === "ul" || c.ten === "ol")));
    const long = li.con.filter((c): c is Phan => laPhan(c) && (c.ten === "ul" || c.ten === "ol"));
    // <li><p>…</p></li> → nội dòng của các đoạn, ngăn bằng xuống dòng.
    const nd = gon(trong.flatMap((c, i) => laPhan(c) && c.ten === "p"
      ? [...(i ? [{ type: "linebreak", version: 1 } as NutLexical] : []), ...noiDong(c.con, ngu)] : noiDong([c], ngu)));
    if (nd.length) muc.push(phanTu("listitem", nd, { value: thuTu++ }));
    for (const l of long) muc.push(phanTu("listitem", [danhSach(l, ngu)], { value: thuTu++ }));
  }
  return phanTu("list", muc, { listType: so ? "number" : "bullet", tag: so ? "ol" : "ul", start: 1 });
}

function bang(n: Phan, ngu: Ngu): NutLexical | null {
  const hang: NutLexical[] = [];
  const duyet = (p: Phan, dau: boolean) => {
    for (const c of p.con) {
      if (!laPhan(c)) continue;
      if (["thead", "tbody", "tfoot"].includes(c.ten)) duyet(c, c.ten === "thead");
      else if (c.ten === "tr") {
        const o = c.con.filter((x): x is Phan => laPhan(x) && (x.ten === "td" || x.ten === "th")).map((x) => {
          const tieuDe = dau || x.ten === "th";
          const con = gon(noiDong(x.con.flatMap((y) => (laPhan(y) && y.ten === "p" ? y.con : [y])), ngu));
          return phanTu("tablecell", [doan(con)], { colSpan: Number(x.thuocTinh.colspan) || 1, rowSpan: Number(x.thuocTinh.rowspan) || 1,
            headerState: tieuDe ? 1 : 0, backgroundColor: null });
        });
        if (o.length) hang.push(phanTu("tablerow", o));
      }
    }
  };
  duyet(n, false);
  return hang.length ? phanTu("table", hang) : null;
}

function cacKhoi(nodes: NutHtml[], ngu: Ngu): (NutLexical | ChoAnh)[] {
  const kq: (NutLexical | ChoAnh)[] = [];
  let cho: NutHtml[] = [];   // chữ/thẻ nội dòng nằm trơ ở cấp khối → gom thành một đoạn
  const xaDoan = () => {
    if (!cho.length) return;
    const nd = gon(noiDong(cho, ngu));
    cho = [];
    if (nd.length) kq.push(doan(nd));
  };
  const xaAnh = () => { kq.push(...ngu.anh); ngu.anh = []; };
  for (const n of nodes) {
    if (!laPhan(n) || !KHOI.has(n.ten) && n.ten !== "img") { cho.push(n); continue; }
    xaDoan();
    switch (n.ten) {
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
        const tag = n.ten === "h1" ? "h2" : n.ten === "h5" || n.ten === "h6" ? "h4" : n.ten;
        const nd = gon(noiDong(n.con, ngu));
        if (nd.length) kq.push(phanTu("heading", nd, { tag }));
        break;
      }
      case "p": {
        if (coLop(n, "nf-toc-title")) break;
        const nd = gon(noiDong(n.con, ngu));
        if (nd.length) kq.push(doan(nd));
        break;
      }
      case "ul": case "ol": kq.push(danhSach(n, ngu)); break;
      case "blockquote": {
        const nd = gon(n.con.flatMap((c, i) => laPhan(c) && c.ten === "p"
          ? [...(i ? [{ type: "linebreak", version: 1 } as NutLexical] : []), ...noiDong(c.con, ngu)] : noiDong([c], ngu)));
        if (nd.length) kq.push(phanTu("quote", nd));
        break;
      }
      case "table": { const b = bang(n, ngu); if (b) kq.push(b); break; }
      case "hr": kq.push({ type: "horizontalrule", version: 1 }); break;
      case "img": { const a = choAnh(n); if (a) kq.push(a); break; }
      case "figure": {
        const cap = n.con.find((c): c is Phan => laPhan(c) && c.ten === "figcaption");
        const chuThich = cap ? chuThuan(cap.con).replace(/\s+/g, " ").trim().slice(0, 200) : "";
        const anh: ChoAnh[] = [];
        const tim = (ds: NutHtml[]) => ds.forEach((c) => { if (laPhan(c)) { if (c.ten === "img") { const a = choAnh(c, chuThich); if (a) anh.push(a); } else tim(c.con); } });
        tim(n.con.filter((c) => c !== cap));
        if (anh.length) kq.push(...anh);
        else kq.push(...cacKhoi(n.con.filter((c) => c !== cap), ngu));
        break;
      }
      case "nav": if (coLop(n, "nf-toc")) break; kq.push(...cacKhoi(n.con, ngu)); break;
      case "pre": { const t = chuThuan(n.con).trim(); if (t) kq.push(doan([chu(t, 16)])); break; }
      default: kq.push(...cacKhoi(n.con, ngu));   // div, section, li lạc chỗ, figcaption lạc chỗ…
    }
    xaAnh();
  }
  xaDoan();
  xaAnh();
  return kq;
}

/** HTML → các khối Lexical (ảnh là chỗ giữ `__anh`). */
export function htmlSangKhoi(html: string): (NutLexical | ChoAnh)[] {
  return cacKhoi(docHtml(html), { anh: [] });
}

/** Thay chỗ giữ ảnh bằng nút upload (id ảnh trong Thư viện ảnh); ảnh tải lỗi (null) bị bỏ. Trả về state Lexical đủ gốc. */
export function thayAnh(khoi: (NutLexical | ChoAnh)[], idAnh: (a: ChoAnh) => number | string | null) {
  const children = khoi.flatMap((k): NutLexical[] => {
    if (k.type !== "__anh") return [k as NutLexical];
    const id = idAnh(k as ChoAnh);
    return id == null ? [] : [{ type: "upload", relationTo: "media", value: id, fields: null, format: "", version: 3,
      id: Math.random().toString(16).slice(2, 14).padEnd(12, "0") }];
  });
  return { root: { type: "root", children, direction: "ltr", format: "", indent: 0, version: 1 } };
}

/** Link ra ngoài trang (backlink của bài trao đổi) — để kiểm định cảnh báo khi Chủ biên lỡ xoá. */
export function linkNgoai(html: string, chuSite = /^https?:\/\/(www\.)?hieuban\.com(\/|$)/i): string[] {
  const ds = new Set<string>();
  const duyet = (nodes: NutHtml[]) => nodes.forEach((n) => {
    if (!laPhan(n)) return;
    const u = n.ten === "a" ? linkHopLe(n.thuocTinh.href) : null;
    if (u && /^https?:\/\//i.test(u) && !chuSite.test(u)) ds.add(u);
    duyet(n.con);
  });
  duyet(docHtml(html));
  return [...ds];
}
