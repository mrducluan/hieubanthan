"use client";
// TM-1 — thanh mảng (lib/thanh-mang.ts): dải điều hướng phụ dính ngay dưới menu chính ở mọi trang của một mảng.
// Máy tính (≥ lg): luôn hiện. Điện thoại: cuộn xuống thì ẩn (nhường chỗ đọc), cuộn lên thì hiện lại — kiểu thanh địa chỉ
// trình duyệt. Chiều cao đang chiếm = biến CSS --tm-h, đặt bằng CSS theo data-an của chính thanh (globals.css, chạy ngay từ
// HTML máy chủ — mở thẳng link #neo cũng không bị che) → scroll-padding-top + top của các thanh dính khác.
// Link thường (Lien, không prefetch). Mục có ?cach=… sáng theo query đọc sau khi mở trang (thanh nằm ở layout, máy chủ
// không biết query → đọc trong effect để không lệch hydrate).
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "@/components/khung/Lien";
import { useChuChung } from "@/components/cms/ChuChung";
import { useDuongVi, useNgonNgu } from "@/components/khung/NgonNgu";
import { banAnh } from "@/lib/duong-en";
import { CHU_KHUNG } from "@/lib/khung-en";
import { ghi } from "@/lib/do-luong";
import { khoaChu, mucDangXem, thanhCua } from "@/lib/thanh-mang";
import { cn } from "@/lib/utils";

export function ThanhMang({ dem = {} }: { dem?: Record<string, number> }) {
  const hien = usePathname() ?? "/";
  // EN-ALL: so khớp theo đường dẫn Việt tương đương (bản Anh: URL /en/… hoặc trang Việt được rewrite).
  const path = useDuongVi();
  const { ngonNgu } = useNgonNgu();
  const en = ngonNgu === "en";
  const k = CHU_KHUNG[ngonNgu];
  const goc = thanhCua(path);
  // Bản Anh: chỉ hiện thanh khi trang trụ đã có bản Anh, và chỉ các mục đã mở; link đổi sang URL Anh.
  const t = goc && (!en || banAnh(goc.tru)) ? goc : null;
  const lienKet = (d: string) => (en ? banAnh(d) : d);
  const c = useChuChung();
  const [an, setAn] = useState(false);
  const [query, setQuery] = useState("");
  const cuon = useRef<HTMLDivElement>(null);
  useEffect(() => { setQuery(window.location.search); }, [hien]);
  const dang = t ? mucDangXem(t, path + query) : -1;
  const dungTrang = (duong: string) => (path + query).replace(/\/$/, "") === duong;

  // Ẩn khi cuộn xuống (chỉ < lg); luôn hiện khi gần đầu trang hoặc khi bàn phím đang ở trong thanh.
  useEffect(() => {
    if (!t) return;
    const mq = matchMedia("(min-width: 1024px)");
    let y = window.scrollY;
    const xem = () => {
      const n = window.scrollY;
      if (mq.matches || n < 160 || cuon.current?.contains(document.activeElement)) setAn(false);
      else if (n > y + 6) setAn(true);
      else if (n < y - 6) setAn(false);
      y = n;
    };
    const doiCo = () => setAn(false);
    window.addEventListener("scroll", xem, { passive: true });
    mq.addEventListener("change", doiCo);
    return () => { window.removeEventListener("scroll", xem); mq.removeEventListener("change", doiCo); };
  }, [t]);

  // Mục đang xem nằm giữa dải (điện thoại cuộn ngang) — chỉnh scrollLeft, không dùng scrollIntoView (sẽ cuộn cả trang).
  useEffect(() => {
    const k = cuon.current, el = k?.querySelector<HTMLElement>("[aria-current]");
    if (k && el) k.scrollLeft = Math.max(0, el.offsetLeft - (k.clientWidth - el.offsetWidth) / 2);
  }, [hien, dang]);

  if (!t) return null;
  return (
    <div
      data-thanh-mang={t.ma} data-an={an ? "1" : "0"}
      // Bàn phím vào thanh đang ẩn (điện thoại) → hiện lại, không để focus nằm trong vùng vô hình.
      onFocusCapture={() => setAn(false)}
      className={cn("sticky top-16 z-30 border-b border-line/50 bg-bg/85 backdrop-blur-lg transition-[transform,opacity] duration-200 print:hidden",
        an && "pointer-events-none -translate-y-full opacity-0")}
    >
      <nav aria-label={k.cac_muc(en ? t.en : t.ten)} className="container">
        <div ref={cuon} className="-mx-4 flex h-11 items-stretch overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          <Link href={lienKet(t.tru)!} className="mr-1.5 flex shrink-0 items-center gap-2 border-r border-line/60 pr-3 font-serif text-[0.95rem] text-fg">
            <span aria-hidden className="grid size-5 place-items-center rounded-full bg-gold/15 text-[0.6rem] text-gold">✦</span>
            {c(`thanh.${t.ma}.ten`) || (en ? t.en : t.ten)}
          </Link>
          <ul className="flex items-stretch">
            {t.muc.map((m, i) => {
              const href = lienKet(m.duong);
              if (!href) return null;
              const on = i === dang, so = m.dem ? dem[m.dem] : undefined, nhan = c(khoaChu(t, m)) || (en ? m.en : m.nhan);
              // Mục mở một CHẾ ĐỘ của trang công cụ (?cach=…): tải lại trang thật — công cụ chỉ đọc query lúc mở trang.
              const Lk = m.duong.includes("?") ? "a" : Link;
              return (
                <li key={m.ma} className="flex">
                  <Lk href={href} onClick={() => ghi("nav_bar_clicked", { tu: t.ma, den: m.ma, trang: path })} aria-current={on ? (dungTrang(m.duong) ? "page" : "location") : undefined} data-muc={m.ma}
                    className={cn("relative flex shrink-0 items-center whitespace-nowrap px-2.5 text-[0.84rem] text-fg-muted transition-colors hover:text-fg",
                      "focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold",
                      i === 0 && "font-medium text-fg",
                      on && "text-gold after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-gold")}>
                    {i === 0 && <span aria-hidden className="mr-1.5 size-1.5 rounded-full bg-gold" />}
                    {nhan}
                    {so ? <span className="ml-1.5 text-[0.7rem] tabular-nums text-fg-faint"><span className="sr-only">, </span>{so}<span className="sr-only">{k.trang}</span></span> : null}
                  </Lk>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
