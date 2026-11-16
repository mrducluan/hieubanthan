// MT-ĐS B3 — "Xem sao hạn theo tuổi": công cụ (năm sinh + giới tính từ hồ sơ trên máy) + link bảng theo năm. Tập quán,
// miễn phí, không nghi lễ, không vật phẩm; lời ở KB sao_han_kb.json (engine), web chỉ hiển thị.
import { TomTatNam } from "@/components/seo/TomTatNam";
import { namTuoiSeo } from "@/lib/nam";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { CongCuTuoi } from "@/components/tuoi/CongCuTuoi";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { duongSaoHanNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_SAO_HAN } from "../xem-tuoi-lam-nha/noi-dung";
import { CHU_SAO_HAN } from "@/lib/chu/cong-cu";
import { taoChu } from "@/lib/chu-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 8: /en/vietnamese-customs/yearly-star là rewrite của trang này — metadata bản Anh từ lib/so-trang-en.ts.
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(ND_SAO_HAN.duong);
  return themHreflangVi(apDungSeo(metaTrang({ tieuDe: "Xem sao hạn theo tuổi: La Hầu, Kế Đô, Thái Bạch", moTa: ND_SAO_HAN.moTa, duong: ND_SAO_HAN.duong }), await layNoiDungTrang(ND_SAO_HAN.duong)), ND_SAO_HAN.duong);
}

export default async function Page() {
  const [nam, nd, namSeo] = await Promise.all([namAmHienTai(), layNoiDungTrang(ND_SAO_HAN.duong), namTuoiSeo()]);
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu);
  const c = taoChu(CHU_SAO_HAN, en ? null : nd.chu, ngonNgu);
  return (
    <TrangCongCu duong={ND_SAO_HAN.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={en ? c("dau.nhan_tren") : CHU_SAO_HAN["dau.nhan_tren"]!.mac_dinh} lon={t("sh.h1")}
          mo_ta={t("sh.loi_dan")} />
        <CongCuTuoi kieu="sao_han" namMacDinh={nam} />
        {!en && <TomTatNam kieu="sao_han" nam={namSeo} tieuDe={`Sao hạn năm ${namSeo}: tuổi nào gặp La Hầu, Kế Đô, Thái Bạch?`} nhanLink={`Bảng sao hạn năm ${namSeo} cho mọi tuổi, nam và nữ`} />}
        <section aria-labelledby="theo-nam" className="mt-8">
          <h2 id="theo-nam" className="text-xl">{c("theo_nam.tieu_de")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {[nam, nam + 1].map((n) => (
              <li key={n}>{c("theo_nam.dong", { nam: String(n) })}{" "}
                <Link href={lienNN(en, duongSaoHanNam(n))!} className="text-gold underline">{tp("sh.theo_nam_link", { nam: n })}</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </TrangCongCu>
  );
}
