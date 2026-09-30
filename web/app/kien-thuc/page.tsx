// Thư viện kiến thức (hub SEO/GEO) — liên kết nội bộ tới mọi chủ đề.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHU_DE, mucLuc } from "@/lib/kien-thuc";
import { goiLd, ldDuongDan, urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

const MO_TA = "Thư viện kiến thức thần số học, Kinh Dịch và Tử vi: ý nghĩa từng con số, 64 quẻ, 14 chính tinh — có nguồn, có mặt tối, có câu hỏi tự soi.";
export const metadata: Metadata = {
  title: "Thư viện kiến thức thần số học, Kinh Dịch, Tử vi",
  description: MO_TA,
  alternates: { canonical: "/kien-thuc" },
  openGraph: { title: "Thư viện kiến thức", description: MO_TA, url: "/kien-thuc", images: ["/og?tieu_de=Th%C6%B0%20vi%E1%BB%87n%20ki%E1%BA%BFn%20th%E1%BB%A9c"] },
};

export default async function Page() {
  const ds = await mucLuc();
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", name: "Thư viện kiến thức", description: MO_TA, url: urlDayDu("/kien-thuc"), inLanguage: "vi-VN" },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Kiến thức", duong: "/kien-thuc" }]),
      )} />
      <p className="eyebrow">Kiến thức</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Thư viện kiến thức</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">{MO_TA}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Object.entries(CHU_DE).map(([k, cd]) => {
          const n = ds.filter((t) => t.loai === cd.loai).length;
          return (
            <Link key={k} href={`/kien-thuc/${k}`} className="glass group flex flex-col rounded-2xl p-6 transition-colors hover:border-gold/50">
              <h2 className="text-2xl">{cd.ten}</h2>
              <p className="mt-2 flex-1 text-sm text-fg-muted">{cd.mo_ta}</p>
              <span className="mt-4 flex items-center gap-1 text-sm text-gold">{n ? `${n} bài` : "Xem"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
