// Kinh Dịch — chữ trang (SEO, đầu trang, giới thiệu + hỏi đáp, khối) sửa được ở CMS "Trang website"; mặc định: lib/so-trang.ts.
// EN-ALL GĐ 6: /en/i-ching là rewrite của trang này (proxy, `x-ngon-ngu: en`) — metadata bản Anh từ lib/so-trang-en.ts.
import type { Metadata } from "next";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn } from "@/lib/en/seo";
import { KinhDich } from "./KinhDich";

const DUONG = "/kinh-dich";

export async function generateMetadata(): Promise<Metadata> {
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(DUONG);
  return apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
}

export default function Page() {
  return <TrangCongCu duong={DUONG} mang="kinh_dich"><KinhDich /></TrangCongCu>;
}
