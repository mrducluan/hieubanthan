// "Bài viết liên quan" theo mảng — đặt ở trang công cụ, Khám phá, Kiến thức; "Bài viết mới" ở trang chủ. Bài lấy từ CMS,
// ban biên tập bật/tắt + đổi số bài + ghim bài ở CMS → Trang chủ & banner. Chưa có bài / CMS tắt → không hiện gì.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { duongBlog } from "@/lib/blog-gop";
import { anhCms, baiTheoMang, baiTrangChu, type BaiCmsTomTat } from "@/lib/cms";

function KhoiBai({ ds, tieuDe, id, className, testId, mang }: { ds: BaiCmsTomTat[]; tieuDe: string; id: string; className: string; testId: string; mang?: string }) {
  return (
    <section aria-labelledby={id} className={`mx-auto max-w-5xl ${className}`} data-testid={testId} data-mang={mang}>
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="text-2xl">{tieuDe}</h2>
        <Link href="/blog" className="inline-flex min-h-11 items-center gap-1 text-sm text-gold hover:underline">Tất cả bài viết <ArrowRight className="size-4" aria-hidden /></Link>
      </div>
      <ul className="mt-5 grid gap-4 sm:grid-cols-3">
        {ds.map((b) => {
          const a = anhCms(b.anh_bia, "nho") ?? anhCms(b.anh_bia, "vua");
          return (
            <li key={b.slug}>
              <Link href={duongBlog(b.slug)} className="glass group flex h-full flex-col overflow-hidden rounded-2xl hover:border-gold/50">
                {a && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.src} alt={a.alt} width={a.w} height={a.h} loading="lazy" className="aspect-video w-full object-cover" />
                )}
                <span className="flex flex-1 flex-col p-4">
                  <span className="font-serif text-lg leading-snug">{b.tieu_de}</span>
                  {b.mo_ta_ngan && <span className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{b.mo_ta_ngan}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export async function BaiLienQuanMang({ mang, tieuDe = "Bài viết liên quan", className = "" }: { mang: string | null; tieuDe?: string; className?: string }) {
  const ds = await baiTheoMang(mang);
  return ds.length ? <KhoiBai ds={ds} tieuDe={tieuDe} id="bai-lien-quan-mang" className={className} testId="bai-lien-quan-mang" mang={mang ?? "tat_ca"} /> : null;
}

export async function BaiMoiTrangChu({ className = "" }: { className?: string }) {
  const k = await baiTrangChu();
  return k ? <KhoiBai ds={k.ds} tieuDe={k.tieuDe} id="bai-moi-trang-chu" className={className} testId="bai-moi-trang-chu" /> : null;
}
