// Banner trang chủ (chiến dịch, sự kiện, bài nổi bật) — ban biên tập đặt ở CMS → "Trang chủ & banner": bật/tắt,
// nhãn, tiêu đề, mô tả, ảnh, nút + link trong site, khung ngày hiện. Tắt / ngoài khung ngày / CMS chưa nối → không hiện.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { anhCms, dangHien, duongLienKet, trangChuCms } from "@/lib/cms";

export async function BannerTrangChu() {
  const b = (await trangChuCms())?.banner;
  if (!b?.bat || !b.tieu_de?.trim() || !dangHien(b)) return null;
  const anh = anhCms(b.anh, "vua");
  const link = b.nut_link ? duongLienKet({ nhan: "", loai: "duong_dan", duong_dan: b.nut_link }) : null;
  return (
    <section aria-labelledby="banner-trang-chu" data-testid="banner-trang-chu"
      className="hien-dan glass vach-sang grid items-center gap-6 overflow-hidden rounded-3xl p-6 sm:p-8 md:grid-cols-[1.3fr_1fr]">
      <div>
        {b.nhan && <p className="eyebrow">{b.nhan}</p>}
        <h2 id="banner-trang-chu" className="mt-2 text-3xl leading-tight sm:text-4xl">{b.tieu_de}</h2>
        {b.mo_ta && <p className="mt-3 max-w-xl text-fg-muted">{b.mo_ta}</p>}
        {link && b.nut_chu && (
          <Link href={link} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 font-medium text-bg transition-transform hover:-translate-y-0.5">
            {b.nut_chu} <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {anh && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={anh.src} alt={anh.alt} width={anh.w} height={anh.h} loading="lazy" className="aspect-video w-full rounded-2xl object-cover" />
      )}
    </section>
  );
}
