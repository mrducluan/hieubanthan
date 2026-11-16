// TDG-1 — "Xem tuổi làm nhà, cưới hỏi": công cụ (năm sinh từ hồ sơ trên máy) + mục lục trang theo năm sinh.
import { TomTatNam } from "@/components/seo/TomTatNam";
import { namTuoiSeo } from "@/lib/nam";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { CongCuTuoi } from "@/components/tuoi/CongCuTuoi";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { NAM_SINH_SEO, duongLamNha, duongLamNhaNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_LAM_NHA } from "./noi-dung";
import { CHU_LAM_NHA } from "@/lib/chu/cong-cu";
import { taoChu } from "@/lib/chu-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 8: /en/vietnamese-customs/house-building-age là rewrite của trang này — metadata bản Anh từ lib/so-trang-en.ts.
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(ND_LAM_NHA.duong);
  return themHreflangVi(apDungSeo(metaTrang({ tieuDe: "Xem tuổi làm nhà, cưới hỏi: Kim lâu, Hoang ốc, Tam tai", moTa: ND_LAM_NHA.moTa, duong: ND_LAM_NHA.duong }), await layNoiDungTrang(ND_LAM_NHA.duong)), ND_LAM_NHA.duong);
}

export default async function Page() {
  const [nam, nd, namSeo] = await Promise.all([namAmHienTai(), layNoiDungTrang(ND_LAM_NHA.duong), namTuoiSeo()]);
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu);
  const c = taoChu(CHU_LAM_NHA, en ? null : nd.chu, ngonNgu);
  return (
    <TrangCongCu duong={ND_LAM_NHA.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={en ? c("dau.nhan_tren") : CHU_LAM_NHA["dau.nhan_tren"]!.mac_dinh} lon={t("ln.h1")}
          mo_ta={t("ln.loi_dan")} />
        <CongCuTuoi kieu="lam_nha" namMacDinh={nam} />
        {/* SEO-O: câu trả lời của năm sắp tới ngay trang gốc (trước chỉ có ô nhập). */}
        {!en && <TomTatNam kieu="lam_nha" nam={namSeo} tieuDe={`Năm ${namSeo}: tuổi nào làm nhà được?`} nhanLink={`Bảng đủ 46 tuổi làm nhà năm ${namSeo}`} />}
        <section aria-labelledby="theo-nam-sinh" className="mt-8">
          <h2 id="theo-nam-sinh" className="text-xl">{c("theo_nam.tieu_de")}</h2>
          {[nam, nam + 1].map((n) => (
            <div key={n} className="mt-3">
              <p className="text-sm text-fg-muted">{c("theo_nam.dong", { nam: String(n) })}{" "}
                {/* SEO-L1: bảng cả năm */}
                <Link href={lienNN(en, duongLamNhaNam(n))!} className="text-gold underline">{tp("ln.theo_nam_link", { nam: n })}</Link></p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {NAM_SINH_SEO.map((ns) => <li key={ns}><Link href={lienNN(en, duongLamNha(n, ns))!} className="vung-cham inline-flex rounded-lg border border-line/70 px-2 py-0.5 text-sm hover:border-gold/50">{ns}</Link></li>)}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </TrangCongCu>
  );
}
