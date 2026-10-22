// TDG-1 — "Xem tuổi làm nhà, cưới hỏi": công cụ (năm sinh từ hồ sơ trên máy) + mục lục trang theo năm sinh.
import type { Metadata } from "next";
import Link from "next/link";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { CongCuTuoi } from "@/components/tuoi/CongCuTuoi";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { NAM_SINH_SEO, duongLamNha, duongLamNhaNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_LAM_NHA } from "./noi-dung";
import { CHU_LAM_NHA } from "@/lib/chu/cong-cu";
import { taoChu } from "@/lib/chu-trang";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: "Xem tuổi làm nhà, cưới hỏi: Kim lâu, Hoang ốc, Tam tai", moTa: ND_LAM_NHA.moTa, duong: ND_LAM_NHA.duong }), await layNoiDungTrang(ND_LAM_NHA.duong));
}

export default async function Page() {
  const [nam, nd] = await Promise.all([namAmHienTai(), layNoiDungTrang(ND_LAM_NHA.duong)]);
  const c = taoChu(CHU_LAM_NHA, nd.chu);
  return (
    <TrangCongCu duong={ND_LAM_NHA.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={CHU_LAM_NHA["dau.nhan_tren"]!.mac_dinh} lon="Xem tuổi làm nhà, cưới hỏi"
          mo_ta="Tuổi mụ năm định làm có phạm Kim lâu, Hoang ốc, Tam tai không — và năm nào thuận gần nhất." />
        <CongCuTuoi kieu="lam_nha" namMacDinh={nam} />
        <section aria-labelledby="theo-nam-sinh" className="mt-8">
          <h2 id="theo-nam-sinh" className="text-xl">{c("theo_nam.tieu_de")}</h2>
          {[nam, nam + 1].map((n) => (
            <div key={n} className="mt-3">
              <p className="text-sm text-fg-muted">{c("theo_nam.dong", { nam: String(n) })}{" "}
                {/* SEO-L1: bảng cả năm */}
                <Link href={duongLamNhaNam(n)} className="text-gold underline">bảng tuổi năm {n}</Link></p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {NAM_SINH_SEO.map((ns) => <li key={ns}><Link href={duongLamNha(n, ns)} className="vung-cham inline-flex rounded-lg border border-line/70 px-2 py-0.5 text-sm hover:border-gold/50">{ns}</Link></li>)}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </TrangCongCu>
  );
}
