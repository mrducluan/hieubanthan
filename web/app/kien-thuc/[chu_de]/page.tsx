// Trang chủ đề (vd /kien-thuc/kinh-dich): danh sách mọi bài, render phía server. Schema: CollectionPage + ItemList.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHU_DE, HINH_CHU_DE, duongTrang, mucLuc } from "@/lib/kien-thuc";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { HinhMang } from "@/components/minh-hoa/TrangTri";
import { goiLd, ldDuongDan, urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

// Chủ đề kiến thức → mảng bài CMS (bài viết liên quan cuối trang).
const MANG_CHU_DE: Record<string, string> = {
  "than-so": "than_so", "hop-so": "than_so", "nghe-nghiep": "than_so", "tinh-yeu": "than_so", "nam-ca-nhan": "than_so", "no-nghiep": "than_so",
  "tu-vi": "tu_vi", "cung-tu-vi": "tu_vi", "sao-cung": "tu_vi", "tu-hoa": "tu_vi", "kinh-dich": "kinh_dich", "bat-tu": "bat_tu", "menh-tuoi": "bat_tu", "thap-than": "bat_tu", "nhat-chu": "bat_tu",
};

type Props = { params: Promise<{ chu_de: string }> };

export async function generateMetadata({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const cd = CHU_DE[params.chu_de];
  if (!cd) return { title: "Không tìm thấy", robots: { index: false } };
  return { title: cd.ten, description: cd.mo_ta, alternates: { canonical: `/kien-thuc/${params.chu_de}`, types: { "text/markdown": `/kien-thuc/${params.chu_de}.md` } },
    openGraph: { title: cd.ten, description: cd.mo_ta, url: `/kien-thuc/${params.chu_de}`, images: [`/og?tieu_de=${encodeURIComponent(cd.ten)}`] } };
}

export default async function Page({ params: thamSo }: Props) {
  const params = await thamSo;
  const cd = CHU_DE[params.chu_de];
  if (!cd) notFound();
  const ds = (await mucLuc()).filter((t) => t.loai === cd.loai);
  const duong = `/kien-thuc/${params.chu_de}`;
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", name: cd.ten, description: cd.mo_ta, url: urlDayDu(duong), inLanguage: "vi-VN",
          mainEntity: { "@type": "ItemList", numberOfItems: ds.length,
            itemListElement: ds.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongTrang(t.loai, t.slug)), name: t.tieu_de })) } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Kiến thức", duong: "/kien-thuc" }, { ten: cd.ten, duong }]),
      )} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint"><Link href="/kien-thuc" className="hover:text-fg">Kiến thức</Link> ›</nav>
      <HinhMang kieu={HINH_CHU_DE[params.chu_de] ?? "than-so"} className="mt-4 h-20" />
      <h1 className="mt-3 text-4xl sm:text-5xl">{cd.ten}</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">{cd.mo_ta}</p>
      {ds.length === 0 && <p className="mt-8 text-fg-muted">Thư viện đang được tải lại, bạn quay lại sau ít phút nhé.</p>}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {ds.map((t) => (
          <li key={t.slug}>
            <Link href={duongTrang(t.loai, t.slug)} className="glass block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
              <h2 className="text-lg leading-snug">{t.tieu_de}</h2>
              <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{t.mo_ta}</p>
            </Link>
          </li>
        ))}
      </ul>
      <BaiLienQuanMang mang={MANG_CHU_DE[params.chu_de] ?? null} className="mt-12" />
    </div>
  );
}
