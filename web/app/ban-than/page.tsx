import type { Metadata } from "next";
import { Suspense } from "react";
import { KhungTai } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { BanThan } from "./BanThan";

const META: Metadata = {
  title: "Hồ sơ bản thân",
  description: "Hồ sơ bản thân theo thần số học: số đường đời, sứ mệnh, linh hồn, nhân cách — mỗi số ba lớp: đã tính, diễn giải, tự soi.",
  alternates: { canonical: "/ban-than" },
  openGraph: { title: "Hồ sơ bản thân", description: "Hồ sơ bản thân theo thần số học: số đường đời, sứ mệnh, linh hồn, nhân cách — mỗi số ba lớp: đã tính, diễn giải, tự soi.", url: "/ban-than" },
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
