import sanitizeHtml from "sanitize-html";

/**
 * NotFair posts are remote HTML. Keep the allowed markup explicit so a bad
 * response cannot add scripts, inline styles, forms, or unsafe URLs to the
 * host site. The nf-* classes are structural hooks for the stylesheet below.
 */
/** Link nội bộ: đường dẫn tương đối, neo, hoặc tên miền hieuban.com (kể cả www). */
export function laLinkNoiBo(href: string | undefined): boolean {
  const h = (href ?? "").trim();
  if (!h || h.startsWith("#") || (h.startsWith("/") && !h.startsWith("//"))) return true;
  try {
    const host = new URL(h).hostname.toLowerCase();
    return host === "hieuban.com" || host === "www.hieuban.com";
  } catch {
    return false;
  }
}

export function sanitizeNotFairArticleHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "figure", "figcaption", "h1", "h2", "h3", "h4", "img", "nav",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "title", "target", "rel"],
      div: ["class"], h1: ["id"], h2: ["id"], h3: ["id"], h4: ["id"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      li: ["class"], nav: ["aria-label", "class"], p: ["class"],
    },
    allowedClasses: {
      div: ["nf-tablewrap"], li: ["nf-toc-l2", "nf-toc-l3"],
      nav: ["nf-toc"], p: ["nf-attribution", "nf-toc-title"],
    },
    // Mục lục NotFair chèn sẵn trong thân bài (nav.nf-toc) bỏ đi: web dựng mục lục riêng (cột phải dính, scroll-spy —
    // components/blog/MucLucBai.tsx) từ chính các H2/H3, không hiện hai mục lục.
    exclusiveFilter: (f) => f.tag === "nav" && /\bnf-toc\b/.test(f.attribs.class ?? ""),
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    transformTags: {
      // SEO-K (chủ dự án duyệt 2026-10-21): link RA NGOÀI trong bài trao đổi NotFair gắn rel="sponsored nofollow"
      // (chính sách link spam của Google: link trao đổi phải khai báo); link về chính hieuban.com giữ follow.
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: laLinkNoiBo(attribs.href) ? "noopener noreferrer" : "sponsored nofollow noopener noreferrer" },
      }),
      // Trang đã có H1 (tiêu đề bài ở NotFairPostHero) → H1 trong thân bài hạ xuống H2 (mỗi trang đúng một H1).
      h1: "h2",
    },
  });
}
