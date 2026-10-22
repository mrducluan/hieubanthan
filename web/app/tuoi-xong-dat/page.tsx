// TDG-1 — "Xem tuổi xông đất": công cụ (gia chủ từ hồ sơ trên máy) + mục lục theo năm sinh cho Tết sắp tới.
import type { Metadata } from "next";
import Link from "next/link";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { CongCuTuoi } from "@/components/tuoi/CongCuTuoi";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { NAM_SINH_SEO, duongXongDat, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_XONG_DAT } from "../xem-tuoi-lam-nha/noi-dung";
import { CHU_XONG_DAT } from "@/lib/chu/cong-cu";
import { taoChu, thayBienChu } from "@/lib/chu-trang";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: "Xem tuổi xông đất đầu năm hợp gia chủ, giờ đẹp mùng 1", moTa: ND_XONG_DAT.moTa, duong: ND_XONG_DAT.duong }), await layNoiDungTrang(ND_XONG_DAT.duong));
}

export default async function Page() {
  const [namAm, nd] = await Promise.all([namAmHienTai(), layNoiDungTrang(ND_XONG_DAT.duong)]);
  const tet = namAm + 1, c = taoChu(CHU_XONG_DAT, nd.chu);
  return (
    <TrangCongCu duong={ND_XONG_DAT.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={thayBienChu(CHU_XONG_DAT["dau.nhan_tren"]!.mac_dinh, { tet: String(tet) })} bien={{ tet: String(tet) }} lon="Xem tuổi xông đất"
          mo_ta="Tuổi nào hợp xông nhà đầu năm với gia chủ — và giờ hoàng đạo, hướng xuất hành ngày mùng 1." />
        <CongCuTuoi kieu="xong_dat" namMacDinh={tet} />
        <section aria-labelledby="theo-nam-sinh" className="mt-8">
          <h2 id="theo-nam-sinh" className="text-xl">{c("theo_nam.tieu_de", { tet: String(tet) })}</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {NAM_SINH_SEO.map((ns) => <li key={ns}><Link href={duongXongDat(tet, ns)} className="vung-cham inline-flex rounded-lg border border-line/70 px-2 py-0.5 text-sm hover:border-gold/50">{ns}</Link></li>)}
          </ul>
        </section>
      </div>
    </TrangCongCu>
  );
}
