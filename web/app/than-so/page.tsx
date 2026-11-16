// Thần số học — chữ trang (SEO, đầu trang, giới thiệu + hỏi đáp, khối) sửa được ở CMS "Trang website"; mặc định: lib/so-trang.ts.
import type { Metadata } from "next";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn } from "@/lib/en/seo";
import { ThanSo } from "./ThanSo";

const DUONG = "/than-so";

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 7: /en/numerology là rewrite của trang này (proxy, `x-ngon-ngu: en`) — metadata bản Anh từ lib/so-trang-en.ts.
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(DUONG);
  return apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
}

export default function Page() {
  return <TrangCongCu duong={DUONG} mang="than_so"><ThanSo /></TrangCongCu>;
}
