// Phong thuỷ — chữ trang (SEO, đầu trang, giới thiệu + hỏi đáp, khối) sửa được ở CMS "Trang website"; mặc định: lib/so-trang.ts.
import type { Metadata } from "next";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { PhongThuy } from "./PhongThuy";

const DUONG = "/phong-thuy";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
}

export default function Page() {
  return <TrangCongCu duong={DUONG} mang="phong_thuy"><PhongThuy /></TrangCongCu>;
}
