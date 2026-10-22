// SEO-K — /blog/trang/{n} (n ≥ 2): cùng khung với /blog; /blog/trang/1 → 308 về /blog.
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { TrangBlog, metaTrangBlog } from "@/components/blog/TrangBlog";
import { docSoTrang } from "@/lib/phan-trang";

type Props = { params: Promise<{ n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = docSoTrang((await params).n);
  return n && n > 1 ? metaTrangBlog(n) : { robots: { index: false } };
}

export default async function Page({ params }: Props) {
  const n = docSoTrang((await params).n);
  if (n === 1) permanentRedirect("/blog");
  if (!n) notFound();
  return <TrangBlog n={n} />;
}
