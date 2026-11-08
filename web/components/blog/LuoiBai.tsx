// Lưới bài blog dùng chung cho /blog và /blog/chuyen-muc/{slug}: bài mới nhất nổi bật (rộng hai cột), thẻ có loại bài,
// chuyên mục, ngày, thời gian đọc. Chip chuyên mục là LINK (trang thật, có URL riêng cho SEO) — không lọc bằng JS.
import Image from "next/image";
import Link from "@/components/khung/Lien";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { duongBlog, type BaiBlog } from "@/lib/blog-gop";
import { NHAN_LOAI, type ChuyenMucCms } from "@/lib/cms";
import { duongMangBlog, mangCuaBai, THONG_TIN_MANG, type MangBlog } from "@/lib/blog-mang";
import { HinhMang } from "@/components/blog/HinhMang";

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
  // BLOG-7: ảnh thẻ bài sáng nhẹ để không chìm vào nền tối của trang.
  const cls = `aspect-video w-full object-cover brightness-[1.12] contrast-[1.04] transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${lon ? "sm:aspect-auto sm:h-full" : ""}`;
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

const mangBai = (p: BaiBlog): MangBlog => mangCuaBai({ mang: p.mang, tieuDe: p.tieuDe, slug: p.slug, moTa: p.moTa });

/** UI-BLOG: ảnh thật (chưa in chữ) → ảnh; bìa đã in tiêu đề / chưa có ảnh → hình mảng (không lặp tiêu đề, không tải ảnh). */
function HinhThe({ p, i, lon }: { p: BaiBlog; i: number; lon?: boolean }) {
  const m = mangBai(p);
  if (p.anh && !p.anh.coChu) return <div className="overflow-hidden"><AnhBai p={p} uuTien={i < 2} lon={lon} /></div>;
  return <HinhMang mang={m} className={lon ? "aspect-video sm:aspect-auto sm:h-full sm:min-h-72" : "aspect-[16/9]"} />;
}

function TheBai({ p, i, noiBat, an }: { p: BaiBlog; i: number; noiBat?: boolean; /** ẩn nhãn mảng (đang ở trang mảng) */ an?: boolean }) {
  const ngay = ngayVn(p.ngay);
  const loai = p.loai && p.loai !== "bai_viet" ? NHAN_LOAI[p.loai] : null;
  const m = mangBai(p);
  const cm = p.chuyenMuc?.[0];
  return (
    <article className={`glass group relative flex h-full flex-col overflow-hidden rounded-2xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${noiBat ? "sm:grid sm:grid-cols-[1fr_1.1fr]" : ""}`}
      data-testid={noiBat ? "bai-noi-bat" : "the-bai"} data-mang={m}>
      {noiBat ? null : <HinhThe p={p} i={i} />}
      <div className={`flex flex-1 flex-col ${noiBat ? "order-1 p-6 sm:p-9" : "p-5"}`}>
        <p className="flex flex-wrap items-center gap-2 text-xs">
          {noiBat && <span className="rounded-full border border-gold/50 px-2.5 py-0.5 font-medium text-gold">Mới nhất</span>}
          {!an && <span className="font-semibold uppercase tracking-[0.14em] text-gold/90">{THONG_TIN_MANG[m].ten}</span>}
          {loai && <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-medium text-gold" data-loai-bai={p.loai}>{loai}</span>}
          {cm && <span className="text-fg-faint">· {cm.ten}</span>}
        </p>
        <h2 className={`mt-2 text-balance leading-snug ${noiBat ? "text-3xl sm:text-4xl" : "text-xl"}`}>
          {/* Cả thẻ bấm được nhờ ::after phủ thẻ; link chuyên mục không lồng trong link bài. */}
          <Link href={duongBlog(p.slug)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-gold">
            {p.tieuDe}
          </Link>
        </h2>
        {p.moTa && <p className={`mt-3 flex-1 text-fg-muted ${noiBat ? "line-clamp-4 text-base sm:text-lg" : "line-clamp-3 text-sm"}`}>{p.moTa}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-fg-faint">
          {ngay && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden /><time dateTime={p.ngay ?? undefined}>{ngay}</time></span>}
          {p.phut ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{p.phut} phút đọc</span> : null}
          <span className="ml-auto inline-flex items-center gap-1 text-gold" aria-hidden>Đọc <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" /></span>
        </div>
      </div>
      {noiBat ? <div className="order-2"><HinhThe p={p} i={i} lon /></div> : null}
    </article>
  );
}

/** Lưới "Đọc theo chủ đề" trên /blog: mỗi mảng một ô (hình mảng nhỏ + số bài + ≤ 3 tiêu đề + lối vào chuyên đề và công cụ).
 *  Gọn hơn kệ 3 thẻ ảnh: mảng ít bài không để khoảng trống, người đọc quét cả 8 mảng trong một màn hình. */
export function LuoiChuDe({ ds }: { ds: { mang: MangBlog; bai: BaiBlog[]; tong: number }[] }) {
  if (!ds.length) return null;
  return (
    <section aria-labelledby="theo-chu-de" className="mt-16" data-testid="theo-chu-de">
      <h2 id="theo-chu-de" className="text-2xl sm:text-3xl">Đọc theo chủ đề</h2>
      <p className="mt-1 text-sm text-fg-muted">Mỗi môn một chuyên đề — bài mới nhất trước.</p>
      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {ds.map(({ mang, bai, tong }) => {
          const tt = THONG_TIN_MANG[mang];
          const id = `cd-${mang}`;
          return (
            <li key={mang} className="glass flex flex-col rounded-2xl p-5" data-testid="ke-mang" data-mang={mang}>
              <div className="flex items-center gap-4">
                <HinhMang mang={mang} className="size-16 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <h3 id={id} className="text-xl"><Link href={duongMangBlog(mang)} className="hover:text-gold">{tt.ten}</Link></h3>
                  <p className="text-xs text-fg-faint">{tong} bài viết</p>
                </div>
              </div>
              <ul className="mt-4 flex-1 divide-y divide-line/50 text-sm" aria-labelledby={id}>
                {bai.map((p) => (
                  <li key={p.slug} className="py-2.5"><Link href={duongBlog(p.slug)} className="line-clamp-2 text-fg hover:text-gold">{p.tieuDe}</Link></li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Link href={duongMangBlog(mang)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-gold/50 px-4 text-gold hover:bg-gold/10">
                  Chuyên đề {tt.ten} <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link href={tt.duong} className="inline-flex min-h-10 items-center rounded-full border border-line/70 px-4 text-fg-muted hover:border-gold/50 hover:text-fg">{tt.nut}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Thanh mảng trên /blog và trang mảng: link thật (bot đi được), số bài từng mảng. */
export function ThanhMangBlog({ ds, dangChon, tong }: { ds: { mang: MangBlog; so: number }[]; dangChon?: MangBlog; tong: number }) {
  if (ds.length < 2) return null;
  const chip = "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";
  const bat = "border-gold/60 bg-gold/15 text-fg", tat = "border-line/70 text-fg-muted hover:border-gold/50 hover:text-fg";
  return (
    <nav aria-label="Chủ đề Huyền học" className="-mx-4 mt-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" data-testid="thanh-mang-blog">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        <li><Link href="/blog" aria-current={dangChon ? undefined : "page"} className={`${chip} ${dangChon ? tat : bat}`}>Tất cả <span className="text-xs text-fg-faint">{tong}</span></Link></li>
        {ds.map(({ mang, so }) => (
          <li key={mang}><Link href={duongMangBlog(mang)} aria-current={dangChon === mang ? "page" : undefined} className={`${chip} ${dangChon === mang ? bat : tat}`}>
            {THONG_TIN_MANG[mang].ten} <span className="text-xs text-fg-faint">{so}</span></Link></li>
        ))}
      </ul>
    </nav>
  );
}

export function LuoiBai({ ds, noiBat = true, anMang }: { ds: BaiBlog[]; noiBat?: boolean; anMang?: boolean }) {
  return (
    <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="luoi-bai">
      {ds.map((p, i) => (
        <li key={p.slug} className={noiBat && i === 0 ? "sm:col-span-2 lg:col-span-3" : undefined}>
          <TheBai p={p} i={i} noiBat={noiBat && i === 0} an={anMang} />
        </li>
      ))}
    </ul>
  );
}

/** Danh sách gọn (chữ, không ảnh): quét nhanh, vẫn là link thật cho bot. */
export function DanhSachGon({ ds, tieuDe }: { ds: BaiBlog[]; tieuDe: string }) {
  return (
    <section aria-labelledby="ds-gon" className="mt-14" data-testid="danh-sach-gon">
      <h2 id="ds-gon" className="border-b border-line/60 pb-3 text-2xl">{tieuDe}</h2>
      <ul className="divide-y divide-line/50">
        {ds.map((p) => (
          <li key={p.slug} className="group relative flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4">
            <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-gold/90">{THONG_TIN_MANG[mangBai(p)].ten}</span>
            <h3 className="min-w-0 flex-1 text-base leading-snug sm:text-lg">
              <Link href={duongBlog(p.slug)} className="after:absolute after:inset-0 after:content-[''] group-hover:text-gold focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-gold">{p.tieuDe}</Link>
            </h3>
            {p.ngay && <time dateTime={p.ngay} className="text-xs text-fg-faint">{ngayVn(p.ngay)}</time>}
          </li>
        ))}
      </ul>
    </section>
  );
}
