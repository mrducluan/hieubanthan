// SEO-K — /blog/chuyen-muc/{slug}/trang/{n} (n ≥ 2); trang 1 → 308 về /blog/chuyen-muc/{slug}.
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { TrangChuyenMuc, metaChuyenMuc } from "@/components/blog/TrangChuyenMuc";
import { duongChuyenMuc } from "@/components/blog/LuoiBai";
import { slugTuUrl } from "@/lib/blog";
import { docSoTrang } from "@/lib/phan-trang";

type Props = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params, n = docSoTrang(p.n);
  return n && n > 1 ? metaChuyenMuc(slugTuUrl(p.slug), n) : { robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const p = await params, n = docSoTrang(p.n), slug = slugTuUrl(p.slug);
  if (n === 1) permanentRedirect(duongChuyenMuc(slug));
  if (!n) notFound();
  return <TrangChuyenMuc slug={slug} n={n} />;
}
