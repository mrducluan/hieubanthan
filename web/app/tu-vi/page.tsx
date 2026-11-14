// Tử vi — chữ trang (SEO, đầu trang, giới thiệu + hỏi đáp, khối) sửa được ở CMS "Trang website"; mặc định: lib/so-trang.ts.
// EN-ALL GĐ 4: /en/zi-wei-dou-shu là rewrite của trang này (proxy, `x-ngon-ngu: en`) — metadata bản Anh từ lib/so-trang-en.ts.
import type { Metadata } from "next";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn } from "@/lib/en/seo";
import { AnhLaSoMau } from "./AnhLaSoMau";
import { TuVi } from "./TuVi";

const DUONG = "/tu-vi";

export async function generateMetadata(): Promise<Metadata> {
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(DUONG);
  return apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
}

export default async function Page() {
  // Ảnh lá số mẫu có chữ Việt in sẵn → bản Anh không hiện (EN-ALL).
  const en = (await ngonNguMayChu()).ngonNgu === "en";
  return <TrangCongCu duong={DUONG} mang="tu_vi" sau={en ? undefined : <AnhLaSoMau />}><TuVi /></TrangCongCu>;
}
