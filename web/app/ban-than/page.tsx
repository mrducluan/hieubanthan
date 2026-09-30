import type { Metadata } from "next";
import { Suspense } from "react";
import { KhungTai } from "@/components/khung/TieuDe";
import { BanThan } from "./BanThan";

export const metadata: Metadata = {
  title: "Hồ sơ bản thân",
  description: "Hồ sơ bản thân theo thần số học: số đường đời, sứ mệnh, linh hồn, nhân cách — mỗi số ba lớp: đã tính, diễn giải, tự soi.",
  alternates: { canonical: "/ban-than" },
  openGraph: { title: "Hồ sơ bản thân", description: "Hồ sơ bản thân theo thần số học: số đường đời, sứ mệnh, linh hồn, nhân cách — mỗi số ba lớp: đã tính, diễn giải, tự soi.", url: "/ban-than" },
};

export default function Page() {
  return (
    <Suspense fallback={<KhungTai />}>
      <BanThan />
    </Suspense>
  );
}
