// /blog/chuyen-muc/{slug} — bài theo chuyên mục (khung chung components/blog/TrangChuyenMuc.tsx; SEO-K: phân trang
// 24 bài/trang, trang sau ở /blog/chuyen-muc/{slug}/trang/{n}).
import type { Metadata } from "next";
import { TrangChuyenMuc, metaChuyenMuc } from "@/components/blog/TrangChuyenMuc";
import { slugTuUrl } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metaChuyenMuc(slugTuUrl((await params).slug), 1);
}

export default async function Page({ params }: Props) {
  return <TrangChuyenMuc slug={slugTuUrl((await params).slug)} n={1} />;
}
