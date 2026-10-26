import type { Metadata } from "next";
import { Suspense } from "react";
import { KhungTai } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { BanThan } from "./BanThan";

const META: Metadata = {
  title: "Hồ sơ bản thân",
  description: "Trang của bạn: bốn con số chủ đạo, nhịp ngày – tháng – năm cá nhân, bản đồ con số và lối tắt sang hợp đôi, huyền học.",
  alternates: { canonical: "/ban-than" },
  // Trang cá nhân (nội dung theo hồ sơ trên máy) — bài đọc công khai để index là /than-so.
  robots: { index: false, follow: true },
  openGraph: { title: "Hồ sơ bản thân", description: "Trang của bạn: bốn con số chủ đạo, nhịp ngày – tháng – năm cá nhân, bản đồ con số và lối tắt sang hợp đôi, huyền học.", url: "/ban-than" },
};

const DUONG = "/ban-than";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const nd = await layNoiDungTrang(DUONG);
  return (
    <>
      <Suspense fallback={<KhungTai />}>
        <BanThan />
      </Suspense>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mx-auto mt-12 max-w-5xl" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mx-auto mt-12 max-w-5xl" />
    </>
  );
}
