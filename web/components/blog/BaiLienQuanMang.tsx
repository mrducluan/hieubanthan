// "Bài viết liên quan" theo mảng — đặt ở trang công cụ, Huyền học, Kiến thức; "Bài viết mới" ở trang chủ. Bài lấy từ CMS,
// ban biên tập bật/tắt + đổi số bài + ghim bài ở CMS → Trang chủ & banner. Chưa có bài / CMS tắt → không hiện gì.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TheLap } from "@/components/khung/TheLap";
import { duongBlog } from "@/lib/blog-gop";
import { anhCms, baiTheoMang, baiTrangChu, type BaiCmsTomTat } from "@/lib/cms";
import { DoKhoiCuoi } from "@/components/khung/DoKhoiCuoi";
import { lopCot, soCanLap, theLap, type TheLap as TheLapT } from "@/lib/the-lap";
import { boLapTrang } from "@/lib/the-lap-cms";

function KhoiBai({ ds, lap, tieuDe, id, className, testId, mang, khoi }: {
  ds: BaiCmsTomTat[]; lap: TheLapT[]; tieuDe: string; id: string; className: string; testId: string; mang?: string; khoi: string;
}) {
  const tong = ds.length + lap.length;
  return (
    <section aria-labelledby={id} className={`mx-auto max-w-5xl ${className}`} data-testid={testId} data-mang={mang}>
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="text-2xl">{tieuDe}</h2>
        <Link href="/blog" className="inline-flex min-h-11 items-center gap-1 text-sm text-gold hover:underline">Tất cả bài viết <ArrowRight className="size-4" aria-hidden /></Link>
      </div>
      <DoKhoiCuoi khoi={khoi} />
      {/* Thẻ bù tắt ở CMS → co số cột theo số bài thật (không lủng ô). */}
      <ul className={`mt-5 grid gap-4 ${tong % 3 === 0 ? "sm:grid-cols-3" : lopCot(tong)}`}>
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
        {lap.map((t) => <TheLap key={t.duong} t={t} kieu="anh" />)}
      </ul>
    </section>
  );
}

/** CTA-2: ít bài hơn số cột → bù thẻ lối đi tiếp (không bù bài mảng khác dưới tiêu đề "liên quan" — sai nghĩa).
 *  `tru` = trang trụ của mảng (cụm kiến thức cùng silo đứng đầu ứng viên); `boQua` = link trang đã hiện ngay trên. */
export async function BaiLienQuanMang({ mang, tieuDe = "Bài viết liên quan", className = "", tru, boQua, duong }: {
  mang: string | null; tieuDe?: string; className?: string; tru?: string; boQua?: string[];
  /** URL trang đang đặt khối — để lấy thẻ ưu tiên của URL đó (Trang website → Lối đi tiếp) */ duong?: string;
}) {
  const [ds, lt] = await Promise.all([baiTheoMang(mang), boLapTrang(duong)]);
  if (!ds.length) return null;
  const lap = theLap(soCanLap(ds.length), { ...lt, tru, boQua });
  return <KhoiBai ds={ds} lap={lap} tieuDe={tieuDe} id="bai-lien-quan-mang" className={className} testId="bai-lien-quan-mang"
    mang={mang ?? "tat_ca"} khoi={mang ? "bai_lien_quan" : "bai_moi"} />;
}

export async function BaiMoiTrangChu({ className = "" }: { className?: string }) {
  const [k, lt] = await Promise.all([baiTrangChu(), boLapTrang("/")]);
  if (!k) return null;
  // Trang chủ đã có thẻ năm mảng ngay trên → bù bằng lối chung (thư viện, Hôm nay, từ điển).
  return <KhoiBai ds={k.ds} lap={theLap(soCanLap(k.ds.length), { ...lt, boQua: ["/"] })} tieuDe={k.tieuDe} id="bai-moi-trang-chu"
    className={className} testId="bai-moi-trang-chu" khoi="bai_moi" />;
}
