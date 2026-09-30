import type { Metadata } from "next";
import { PhongThuy } from "./PhongThuy";

export const metadata: Metadata = {
  title: "Phong thuỷ",
  description: "Phong thuỷ Bát trạch: mệnh quái theo năm sinh và giới tính, tám hướng du niên, bố trí cửa – chủ – bếp. Quan niệm dân gian ghi rõ, không bán vật phẩm hoá giải.",
  alternates: { canonical: "/phong-thuy" },
  openGraph: { title: "Phong thuỷ", description: "Phong thuỷ Bát trạch: mệnh quái theo năm sinh và giới tính, tám hướng du niên, bố trí cửa – chủ – bếp. Quan niệm dân gian ghi rõ, không bán vật phẩm hoá giải.", url: "/phong-thuy" },
};

export default function Page() {
  return <PhongThuy />;
}
