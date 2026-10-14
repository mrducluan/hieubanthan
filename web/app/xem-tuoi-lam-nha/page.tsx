// TDG-1 — "Xem tuổi làm nhà, cưới hỏi": công cụ (năm sinh từ hồ sơ trên máy) + mục lục trang theo năm sinh.
import type { Metadata } from "next";
import Link from "next/link";
import { GioiThieuCongCu } from "@/components/seo/GioiThieuCongCu";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { CongCuTuoi } from "@/components/tuoi/CongCuTuoi";
import { metaTrang } from "@/lib/seo";
import { NAM_SINH_SEO, duongLamNha, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_LAM_NHA } from "./noi-dung";

export const metadata: Metadata = metaTrang({ tieuDe: "Xem tuổi làm nhà, cưới hỏi: Kim lâu, Hoang ốc, Tam tai", moTa: ND_LAM_NHA.moTa, duong: ND_LAM_NHA.duong });

export default async function Page() {
  const nam = await namAmHienTai();
  return (
    <>
      <div className="mx-auto max-w-3xl">
        <TieuDeMuc cap={1} nho="Tuổi dân gian" lon="Xem tuổi làm nhà, cưới hỏi"
          mo_ta="Tuổi mụ năm định làm có phạm Kim lâu, Hoang ốc, Tam tai không — và năm nào thuận gần nhất." />
        <CongCuTuoi kieu="lam_nha" namMacDinh={nam} />
        <section aria-labelledby="theo-nam-sinh" className="mt-8">
          <h2 id="theo-nam-sinh" className="text-xl">Tra nhanh theo năm sinh</h2>
          {[nam, nam + 1].map((n) => (
            <div key={n} className="mt-3">
              <p className="text-sm text-fg-muted">Làm nhà năm {n}:</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {NAM_SINH_SEO.map((ns) => <li key={ns}><Link href={duongLamNha(n, ns)} className="vung-cham inline-flex rounded-lg border border-line/70 px-2 py-0.5 text-sm hover:border-gold/50">{ns}</Link></li>)}
              </ul>
            </div>
          ))}
        </section>
      </div>
      <GioiThieuCongCu {...ND_LAM_NHA} />
    </>
  );
}
