// Thư viện kiến thức (hub SEO/GEO) — liên kết nội bộ tới mọi chủ đề.
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHU_DE, HINH_CHU_DE, mucLuc } from "@/lib/kien-thuc";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { HinhMang } from "@/components/minh-hoa/TrangTri";
import { goiLd, ldDuongDan, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

export const revalidate = 21600;

const MO_TA = "Ý nghĩa 12 con số thần số học, 64 quẻ Kinh Dịch, 14 chính tinh và 12 cung Tử vi, 10 thập thần, 10 nhật chủ Bát tự — có nguồn, có mặt tối, có câu tự soi.";
const META: Metadata = {
  title: { absolute: "Thư viện kiến thức thần số học, Kinh Dịch, Tử vi, Bát tự" },
  description: MO_TA,
  alternates: { canonical: "/kien-thuc", types: { "text/markdown": "/kien-thuc.md" } },
  openGraph: { title: "Thư viện kiến thức", description: MO_TA, url: "/kien-thuc", images: ["/og?tieu_de=Th%C6%B0%20vi%E1%BB%87n%20ki%E1%BA%BFn%20th%E1%BB%A9c"] },
  twitter: { card: "summary_large_image", title: "Thư viện kiến thức", description: MO_TA },
};

const DUONG = "/kien-thuc";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [ds, nd] = await Promise.all([mucLuc(), layNoiDungTrang(DUONG)]);
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", name: "Thư viện kiến thức", description: MO_TA, url: urlDayDu("/kien-thuc"), inLanguage: "vi-VN" },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Kiến thức", duong: "/kien-thuc" }]),
      )} />
      <p className="eyebrow">Kiến thức</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">{nd.dau.h1 ?? "Thư viện kiến thức"}</h1>
      <LoiDanCms nd={nd} className="mt-3 max-w-2xl text-fg-muted">{MO_TA}</LoiDanCms>
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Object.entries(CHU_DE).map(([k, cd]) => {
          const n = ds.filter((t) => t.loai === cd.loai).length;
          return (
            <Link key={k} href={`/kien-thuc/${k}`} className="glass group flex flex-col rounded-2xl p-6 transition-colors hover:border-gold/50">
              <HinhMang kieu={HINH_CHU_DE[k] ?? "than-so"} className="mb-3 transition-transform group-hover:scale-105" />
              <h2 className="text-2xl">{cd.ten}</h2>
              <p className="mt-2 flex-1 text-sm text-fg-muted">{cd.mo_ta}</p>
              <span className="mt-4 flex items-center gap-1 text-sm text-gold">{n ? `${n} bài` : "Xem"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          );
        })}
      </div>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-12" />
      <Suspense fallback={null}><BaiLienQuanMang mang={null} tieuDe="Bài viết mới" className="mt-12" /></Suspense>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />
    </div>
  );
}
