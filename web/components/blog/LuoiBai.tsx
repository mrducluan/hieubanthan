// Lưới bài blog dùng chung cho /blog và /blog/chuyen-muc/{slug}: bài mới nhất nổi bật (rộng hai cột), thẻ có loại bài,
// chuyên mục, ngày, thời gian đọc. Chip chuyên mục là LINK (trang thật, có URL riêng cho SEO) — không lọc bằng JS.
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { duongBlog, type BaiBlog } from "@/lib/blog-gop";
import { NHAN_LOAI, type ChuyenMucCms } from "@/lib/cms";

export const duongChuyenMuc = (slug: string) => `/blog/chuyen-muc/${encodeURIComponent(slug)}`;
const ngayVn = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : null);

/** Chuyên mục có bài, theo số bài giảm dần. */
export function chuyenMucCoBai(ds: BaiBlog[]): (ChuyenMucCms & { so: number })[] {
  const m = new Map<string, ChuyenMucCms & { so: number }>();
  for (const b of ds) for (const c of b.chuyenMuc ?? []) {
    const cu = m.get(c.slug);
    m.set(c.slug, { ...c, so: (cu?.so ?? 0) + 1 });
  }
  return [...m.values()].sort((a, b) => b.so - a.so || a.ten.localeCompare(b.ten, "vi"));
}

export function ChipChuyenMuc({ ds, dangChon }: { ds: (ChuyenMucCms & { so?: number })[]; dangChon?: string }) {
  if (!ds.length) return null;
  const chip = "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";
  return (
    <nav aria-label="Chuyên mục" className="-mx-4 mt-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" data-testid="chip-chuyen-muc">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        <li>
          <Link href="/blog" aria-current={dangChon ? undefined : "page"}
            className={`${chip} ${dangChon ? "border-line/70 text-fg-muted hover:border-gold/50 hover:text-fg" : "border-gold/60 bg-gold/15 text-fg"}`}>Tất cả</Link>
        </li>
        {ds.map((c) => (
          <li key={c.slug}>
            <Link href={duongChuyenMuc(c.slug)} aria-current={dangChon === c.slug ? "page" : undefined}
              className={`${chip} ${dangChon === c.slug ? "border-gold/60 bg-gold/15 text-fg" : "border-line/70 text-fg-muted hover:border-gold/50 hover:text-fg"}`}>
              {c.ten}{c.so ? <span className="ml-1.5 text-xs text-fg-faint">{c.so}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AnhBai({ p, uuTien, lon }: { p: BaiBlog; uuTien: boolean; lon?: boolean }) {
  if (!p.anh) return null;
  const cls = `aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${lon ? "sm:aspect-auto sm:h-full" : ""}`;
  return p.nguon === "notfair" ? (
    <Image src={p.anh.src} alt={p.anh.alt} width={p.anh.w} height={p.anh.h} priority={uuTien}
      sizes={lon ? "(max-width: 640px) 100vw, 640px" : "(max-width: 640px) 100vw, 480px"} className={cls} />
  ) : (
    // Ảnh CMS đã có cỡ webp sẵn (nhỏ/vừa) → thẻ img thường, không qua /_next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.anh.src} alt={p.anh.alt} width={p.anh.w} height={p.anh.h} loading={uuTien ? "eager" : "lazy"}
      fetchPriority={uuTien ? "high" : undefined} className={cls} />
  );
}

function TheBai({ p, i, noiBat }: { p: BaiBlog; i: number; noiBat?: boolean }) {
  const ngay = ngayVn(p.ngay);
  const loai = p.loai && p.loai !== "bai_viet" ? NHAN_LOAI[p.loai] : null;
  const cm = p.chuyenMuc?.[0];
  return (
    <article className={`glass group relative flex h-full flex-col overflow-hidden rounded-2xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${noiBat ? "sm:col-span-2 sm:grid sm:grid-cols-[1.15fr_1fr]" : ""}`}
      data-testid={noiBat ? "bai-noi-bat" : "the-bai"}>
      {p.anh && <div className="overflow-hidden"><AnhBai p={p} uuTien={i < 2} lon={noiBat} /></div>}
      <div className={`flex flex-1 flex-col ${noiBat ? "p-6 sm:p-8" : "p-5"}`}>
        {(loai || cm) && (
          <p className="flex flex-wrap items-center gap-2 text-xs">
            {loai && <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-medium text-gold" data-loai-bai={p.loai}>{loai}</span>}
            {cm && <span className="text-fg-muted">{cm.ten}</span>}
          </p>
        )}
        <h2 className={`mt-2 leading-snug ${noiBat ? "text-2xl sm:text-3xl" : "text-xl"}`}>
          {/* Cả thẻ bấm được nhờ ::after phủ thẻ; link chuyên mục không lồng trong link bài. */}
          <Link href={duongBlog(p.slug)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-gold">
            {p.tieuDe}
          </Link>
        </h2>
        {p.moTa && <p className={`mt-2 flex-1 text-sm text-fg-muted ${noiBat ? "line-clamp-4 sm:text-base" : "line-clamp-3"}`}>{p.moTa}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-fg-faint">
          {ngay && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden /><time dateTime={p.ngay ?? undefined}>{ngay}</time></span>}
          {p.phut ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{p.phut} phút đọc</span> : null}
          <span className="ml-auto inline-flex items-center gap-1 text-gold" aria-hidden>Đọc <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" /></span>
        </div>
      </div>
    </article>
  );
}

export function LuoiBai({ ds, noiBat = true }: { ds: BaiBlog[]; noiBat?: boolean }) {
  return (
    <ul className="mt-8 grid gap-5 sm:grid-cols-2" data-testid="luoi-bai">
      {ds.map((p, i) => (
        <li key={p.slug} className={noiBat && i === 0 ? "sm:col-span-2" : undefined}>
          <TheBai p={p} i={i} noiBat={noiBat && i === 0} />
        </li>
      ))}
    </ul>
  );
}
