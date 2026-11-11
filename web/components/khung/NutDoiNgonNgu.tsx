"use client";
// EN-ALL mục 3.1 — nút đổi ngôn ngữ trỏ tới TRANG TƯƠNG ĐƯƠNG (không về trang chủ). Máy chủ đặt `href` theo bảng đường dẫn;
// khi trang tự khai hreflang (trang kiến thức có slug do engine sinh) thì trình duyệt lấy đúng link `<link rel="alternate"
// hreflang>` của trang — một nguồn với thẻ SEO. Giữ #neo và query an toàn (?cach=…).
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const QUERY_GIU = ["cach", "so"];

export function NutDoiNgonNgu({ href, sang, children, className }: { href: string; sang: "vi" | "en"; children: React.ReactNode; className?: string }) {
  const [dich, setDich] = useState(href);
  const duong = usePathname();
  useEffect(() => {
    let d = href;
    const l = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${sang}"]`);
    if (l?.href) {
      try { const u = new URL(l.href); if (u.origin === location.origin || u.pathname.startsWith("/")) d = u.pathname; } catch { /* giữ href máy chủ */ }
    }
    const q = new URLSearchParams();
    const hien = new URLSearchParams(location.search);
    QUERY_GIU.forEach((k) => { const v = hien.get(k); if (v && /^[\w,.-]{1,40}$/.test(v)) q.set(k, v); });
    setDich(d.split(/[?#]/)[0] + (q.size ? `?${q}` : "") + (/^#[\w-]{1,60}$/.test(location.hash) ? location.hash : ""));
  }, [href, sang, duong]);
  // <a> thường (không next/link): đổi ngôn ngữ là tải lại cả khung trang (html lang, khung, catalog đều đổi).
  return <a href={dich} lang={sang} hrefLang={sang} className={className} data-testid={sang === "vi" ? "doi-tieng-viet" : "doi-tieng-anh"}>{children}</a>;
}
