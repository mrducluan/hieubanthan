// Thân bài CMS là HTML do CMS sinh từ Lexical — web vẫn LỌC lại bằng allowlist (phòng tài khoản CMS bị lộ):
// không script, không style nội dòng, không form, không javascript:; iframe CHỈ video youtube-nocookie;
// ảnh chỉ từ CMS / kho ảnh của CMS.
// Sau khi lọc: gắn id cho H2/H3 (mục lục + link neo), ảnh lazy, link ngoài rel=noopener.
import sanitizeHtml from "sanitize-html";
import { cmsUrl } from "@/lib/cms";

export type MucLucCms = { id: string; text: string; cap: 2 | 3 };

const LOP = ["hbt-ghi-chu", "hbt-ghi-chu-luu_y", "hbt-ghi-chu-meo", "hbt-ghi-chu-tu_soi", "hbt-ghi-chu-tom_tat",
  "hbt-ghi-chu-tieu-de", "hbt-keu-goi", "hbt-trich-dan", "hbt-dich-nghia", "hbt-bang", "hbt-video"];

// Video: CHỈ iframe youtube-nocookie với mã 11 ký tự (+ ?start=giây). Mọi iframe khác bị bỏ.
const VIDEO = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}(\?start=\d{1,6})?$/;

function nguonAnhHopLe(): string[] {
  return [cmsUrl(), (process.env.CMS_ANH_URL || "").replace(/\/+$/, "")].filter(Boolean);
}

const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
const idTu = (s: string) => boDau(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "muc";
const giaiMa = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");

export function locHtmlCms(html: string | null | undefined): { html: string; mucLuc: MucLucCms[] } {
  const nguon = nguonAnhHopLe();
  const anhOk = (u: string) => nguon.some((g) => u.startsWith(`${g}/`));
  const sach = sanitizeHtml(html ?? "", {
    allowedTags: ["p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "sub", "sup", "code", "mark",
      "ul", "ol", "li", "blockquote", "a", "img", "picture", "source", "figure", "figcaption", "aside", "hr",
      "table", "thead", "tbody", "tr", "th", "td", "div", "span", "iframe"],
    allowedAttributes: {
      a: ["href", "target", "rel"], img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
      source: ["srcset", "media", "type"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"],
      ol: ["start"], aside: ["class"], iframe: ["src", "title", "loading", "allowfullscreen", "allow", "referrerpolicy"], p: ["class"], div: ["class"], figure: ["class"], table: ["class"],
    },
    allowedClasses: { aside: LOP, p: LOP, div: LOP, figure: LOP, table: LOP },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: { img: ["https", "http"], a: ["https", "http", "mailto"], iframe: ["https"] },
    allowedIframeHostnames: ["www.youtube-nocookie.com"],
    allowProtocolRelative: false,
    exclusiveFilter: (f) => (f.tag === "img" && !anhOk(f.attribs.src ?? "")) || (f.tag === "iframe" && !VIDEO.test(f.attribs.src ?? "")) || (f.tag === "source" && !anhOk((f.attribs.srcset ?? "").split(/\s/)[0] ?? "")),
    transformTags: {
      a: (tag, a) => {
        const href = a.href ?? "";
        const ngoai = /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?hieuban\.com(\/|$)/.test(href);
        return { tagName: "a", attribs: { href, ...(ngoai ? { rel: "noopener noreferrer", target: "_blank" } : {}) } };
      },
      img: (tag, a) => {
        const srcset = (a.srcset ?? "").split(",").map((x) => x.trim()).filter((x) => anhOk(x.split(/\s/)[0] ?? "")).join(", ");
        const { srcset: _bo, ...con } = a;
        return { tagName: "img", attribs: { ...con, ...(srcset ? { srcset } : {}), loading: "lazy", decoding: "async" } };
      },
      table: () => ({ tagName: "table", attribs: { class: "hbt-bang" } }),
      iframe: (tag, a) => ({ tagName: "iframe", attribs: {
        src: a.src ?? "", title: (a.title || "Video").slice(0, 120), loading: "lazy", allowfullscreen: "",
        allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share", referrerpolicy: "strict-origin-when-cross-origin",
      } }),
    },
  });
  // http chỉ chấp nhận khi chính CMS chạy http (máy dev) — bản thật CMS luôn https.
  const mucLuc: MucLucCms[] = [];
  const daDung = new Map<string, number>();
  const ra = sach.replace(/<(h2|h3)>([\s\S]*?)<\/\1>/g, (_m, tag: string, ben: string) => {
    const text = giaiMa(ben.replace(/<[^>]+>/g, "")).trim();
    let id = idTu(text);
    const n = daDung.get(id) ?? 0;
    daDung.set(id, n + 1);
    if (n) id = `${id}-${n + 1}`;
    mucLuc.push({ id, text, cap: tag === "h2" ? 2 : 3 });
    return `<${tag} id="${id}">${ben}</${tag}>`;
  });
  return { html: ra, mucLuc };
}

/** HTML → Markdown đơn giản cho bản .md (bot AI). Chỉ cần đúng ý, không cần giữ mọi định dạng. */
export function htmlSangMd(html: string): string {
  return giaiMa(html
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, "\n### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, "\n#### $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, "- $1\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)")
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, "**$2**")
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, "*$2*")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, (_m, b: string) => b.replace(/<p[^>]*>/g, "> ").replace(/<\/p>/g, "\n"))
    .replace(/<iframe [^>]*src="https:\/\/www\.youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})[^"]*"[^>]*title="([^"]*)"[^>]*><\/iframe>/g,
      "[Video: $2](https://www.youtube.com/watch?v=$1)\n")
    .replace(/<img [^>]*alt="([^"]*)"[^>]*>/g, "")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/(p|aside|figure|figcaption|ul|ol|table|tr)>/g, "\n")
    .replace(/<[^>]+>/g, ""))
    .replace(/\n{3,}/g, "\n\n").trim();
}
