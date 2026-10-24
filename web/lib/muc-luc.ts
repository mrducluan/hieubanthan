// Mục lục bài đọc (blog CMS + bài trao đổi NotFair): gắn id cho H2/H3 trong HTML ĐÃ LỌC và trả danh sách mục để dựng
// cột mục lục dính (components/blog/MucLucBai.tsx). Không chạm nội dung — chỉ thêm thuộc tính id; tiêu đề đã có id (bài
// NotFair) giữ nguyên để link neo cũ còn chạy.
export type MucLuc = { id: string; text: string; cap: 2 | 3 };

const boDau = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
export const idTu = (s: string) => boDau(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "muc";
/** Giải mã 5 thực thể HTML cơ bản — `&amp;` giải SAU CÙNG để "&amp;lt;" không thành "<" (CodeQL: double unescaping). */
export const giaiMaHtml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** Bỏ mọi thẻ HTML bằng cách quét từng ký tự (không regex một lượt — CodeQL: incomplete multi-character sanitization). */
export function boThe(s: string): string {
  let ra = "", trong = false;
  for (const c of s) {
    if (c === "<") trong = true;
    else if (c === ">" && trong) trong = false;
    else if (!trong) ra += c;
  }
  return ra;
}

export function ganIdMucLuc(html: string): { html: string; mucLuc: MucLuc[] } {
  const mucLuc: MucLuc[] = [];
  const daDung = new Map<string, number>();
  const ra = html.replace(/<(h2|h3)(\s[^>]*)?>([\s\S]*?)<\/\1>/g, (_m, tag: string, thuocTinh: string | undefined, ben: string) => {
    const text = giaiMaHtml(boThe(ben)).replace(/\s+/g, " ").trim();
    if (!text) return `<${tag}${thuocTinh ?? ""}>${ben}</${tag}>`;
    const coSan = /\sid="([^"]+)"/.exec(thuocTinh ?? "")?.[1];
    let id = coSan || idTu(text);
    const n = daDung.get(id) ?? 0;
    daDung.set(id, n + 1);
    if (n) id = `${id}-${n + 1}`;
    mucLuc.push({ id, text, cap: tag === "h2" ? 2 : 3 });
    const khac = (thuocTinh ?? "").replace(/\sid="[^"]*"/, "");
    return `<${tag} id="${id}"${khac}>${ben}</${tag}>`;
  });
  return { html: ra, mucLuc };
}

/** Có đáng hiện mục lục không: ≥ 2 mục H2 (một mục thì chỉ là tiêu đề đoạn). */
export const dangHienMucLuc = (ds: MucLuc[]) => ds.filter((m) => m.cap === 2).length >= 2;
