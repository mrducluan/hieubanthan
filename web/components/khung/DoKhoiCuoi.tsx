"use client";
// CTA-2 — đo khối thẻ cuối trang: đặt <DoKhoiCuoi khoi="…"/> NGAY TRONG khối (section/nav). Khi khối hiện ≥ 40% lần
// đầu: end_cta_viewed{lap:0} cho khối + {lap:1, den} cho từng thẻ bù ([data-the-lap]). Bấm link trong khối:
// end_cta_clicked{lap, den, thu_tu}. Chỉ mã khối + đường dẫn trong site, không chữ người dùng. Một lần mỗi lần xem trang.
import { useEffect, useRef } from "react";
import { ghi } from "@/lib/do-luong";

export function DoKhoiCuoi({ khoi }: { khoi: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const goc = ref.current?.parentElement;
    if (!goc) return;
    const trang = location.pathname;
    // Vị trí = thứ tự ô (con trực tiếp của lưới ul / .grid) chứa phần tử, đếm từ 1; ngoài lưới → 0.
    const viTri = (x: HTMLElement | null): number => {
      for (let o = x; o && o !== goc; o = o.parentElement) {
        const cha = o.parentElement;
        if (cha && (cha.tagName === "UL" || cha.classList.contains("grid"))) return [...cha.children].indexOf(o) + 1;
      }
      return 0;
    };
    let daThay = false;
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((ds) => {
      if (daThay || !ds.some((d) => d.isIntersecting)) return;
      daThay = true;
      const lap = [...goc.querySelectorAll<HTMLElement>("[data-the-lap]")];
      ghi("end_cta_viewed", { khoi, trang, lap: 0, so_lap: lap.length });
      lap.forEach((x) => ghi("end_cta_viewed", { khoi, trang, lap: 1, den: x.dataset.theLap, thu_tu: viTri(x) }));
      io?.disconnect();
    }, { threshold: 0.4 });
    io?.observe(goc);
    const bam = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a || !goc.contains(a)) return;
      const o = a.closest<HTMLElement>("[data-the-lap]");
      ghi("end_cta_clicked", { khoi, trang, lap: o ? 1 : 0, den: o ? o.dataset.theLap : "_that", thu_tu: viTri(a) });
    };
    goc.addEventListener("click", bam);
    return () => { io?.disconnect(); goc.removeEventListener("click", bam); };
  }, [khoi]);
  return <span ref={ref} hidden data-do-khoi={khoi} />;
}
