// /blog — mục lục bài blog (bài CMS + bài trao đổi NotFair). SEO-K: phân trang 24 bài/trang — đây là trang 1, trang sau
// ở /blog/trang/{n}; khung chung ở components/blog/TrangBlog.tsx.
import type { Metadata } from "next";
import { TrangBlog, META_BLOG, DUONG_BLOG } from "@/components/blog/TrangBlog";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META_BLOG, await layNoiDungTrang(DUONG_BLOG));
}

export default async function Page() {
  return <TrangBlog n={1} />;
}
