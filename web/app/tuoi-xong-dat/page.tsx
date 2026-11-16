// TDG-1 — "Xem tuổi xông đất": công cụ (gia chủ từ hồ sơ trên máy) + mục lục theo năm sinh cho Tết sắp tới.
import { TomTatNam } from "@/components/seo/TomTatNam";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { CongCuTuoi } from "@/components/tuoi/CongCuTuoi";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { NAM_SINH_SEO, duongXongDat, duongXongDatNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_XONG_DAT } from "../xem-tuoi-lam-nha/noi-dung";
import { CHU_XONG_DAT } from "@/lib/chu/cong-cu";
import { taoChu, thayBienChu } from "@/lib/chu-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 8: /en/vietnamese-customs/first-footer là rewrite của trang này — metadata bản Anh từ lib/so-trang-en.ts.
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(ND_XONG_DAT.duong);
  return themHreflangVi(apDungSeo(metaTrang({ tieuDe: "Xem tuổi xông đất đầu năm hợp gia chủ, giờ đẹp mùng 1", moTa: ND_XONG_DAT.moTa, duong: ND_XONG_DAT.duong }), await layNoiDungTrang(ND_XONG_DAT.duong)), ND_XONG_DAT.duong);
}

export default async function Page() {
  const [namAm, nd] = await Promise.all([namAmHienTai(), layNoiDungTrang(ND_XONG_DAT.duong)]);
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu);
  const tet = namAm + 1, c = taoChu(CHU_XONG_DAT, en ? null : nd.chu, ngonNgu);
  return (
    <TrangCongCu duong={ND_XONG_DAT.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={en ? c("dau.nhan_tren", { tet: String(tet) }) : thayBienChu(CHU_XONG_DAT["dau.nhan_tren"]!.mac_dinh, { tet: String(tet) })} bien={{ tet: String(tet) }} lon={t("xd.h1")}
          mo_ta={t("xd.loi_dan")} />
        <CongCuTuoi kieu="xong_dat" namMacDinh={tet} />
        {!en && <TomTatNam kieu="xong_dat" nam={tet} tieuDe={`Xông đất Tết ${tet}: mùng 1, giờ đẹp, tuổi nên tránh`} nhanLink={`Bảng tuổi xông đất Tết ${tet} cho mọi tuổi gia chủ`} />}
        <section aria-labelledby="theo-nam-sinh" className="mt-8">
          <h2 id="theo-nam-sinh" className="text-xl">{c("theo_nam.tieu_de", { tet: String(tet) })}</h2>
          {/* SEO-L1: bảng cả năm (mọi tuổi gia chủ một trang) */}
          <p className="mt-1 text-sm"><Link href={lienNN(en, duongXongDatNam(tet))!} className="text-gold underline">{tp("xd.bang_link", { tet })}</Link></p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {NAM_SINH_SEO.map((ns) => <li key={ns}><Link href={lienNN(en, duongXongDat(tet, ns))!} className="vung-cham inline-flex rounded-lg border border-line/70 px-2 py-0.5 text-sm hover:border-gold/50">{ns}</Link></li>)}
          </ul>
        </section>
      </div>
    </TrangCongCu>
  );
}
