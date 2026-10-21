"use client";

import { useEffect, useRef } from "react";

/** Cho các phần tử `.hien-tung` / `.dau-nay` bên trong hiện lần lượt khi khối cuộn tới (CSS ở globals.css, TC-HOOK).
 *  Không JS, giảm chuyển động, hoặc khối đã nằm trong màn hình lúc tải → hiện sẵn, không bao giờ ẩn. */
export function HienKhiThay({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < innerHeight * 0.9) return;
    el.dataset.cho = "";
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { el.dataset.hien = ""; io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className} {...rest}>{children}</div>;
}
