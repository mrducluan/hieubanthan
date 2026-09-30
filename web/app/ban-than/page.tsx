import type { Metadata } from "next";
import { Suspense } from "react";
import { KhungTai } from "@/components/khung/TieuDe";
import { BanThan } from "./BanThan";

export const metadata: Metadata = { title: "Hồ sơ bản thân" };

export default function Page() {
  return (
    <Suspense fallback={<KhungTai />}>
      <BanThan />
    </Suspense>
  );
}
