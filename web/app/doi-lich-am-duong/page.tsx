// SEO-L5 — "Đổi lịch âm dương": công cụ (engine đổi) + lối vào lịch âm từng năm. Khung TrangCongCu (CMS sửa được chữ).
import { TomTatNam } from "@/components/seo/TomTatNam";
import { namAmHienTai } from "@/lib/tuoi-dan-gian";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { DoiLich } from "@/components/lich/DoiLich";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { anhBai, metaTrang } from "@/lib/seo";
import { homNayVN } from "@/lib/hoang-lich";
import { duongLichAm } from "@/lib/lich-am";
import { ND_DOI_LICH } from "./noi-dung";
import { CHU_DOI_LICH } from "@/lib/chu/cong-cu";
import { taoChu } from "@/lib/chu-trang";

export async function generateMetadata(): Promise<Metadata> {
  const tieuDe = "Đổi lịch âm dương: ngày âm hôm nay, can chi";
  return apDungSeo(metaTrang({ tieuDe, moTa: ND_DOI_LICH.moTa, duong: ND_DOI_LICH.duong, anh: anhBai({ tieuDe: "Đổi lịch âm dương", mang: "lich" }) }),
    await layNoiDungTrang(ND_DOI_LICH.duong));
}

export default async function Page() {
  const homNay = homNayVN(), nam = Number(homNay.slice(0, 4));
  const [nd, namAm] = await Promise.all([layNoiDungTrang(ND_DOI_LICH.duong), namAmHienTai()]);
  const c = taoChu(CHU_DOI_LICH, nd.chu);
  return (
    <TrangCongCu duong={ND_DOI_LICH.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={CHU_DOI_LICH["dau.nhan_tren"]!.mac_dinh} lon="Đổi lịch âm dương"
          mo_ta="Đổi ngày dương sang âm và ngược lại theo âm lịch Việt Nam, kèm can chi và tháng nhuận." />
        <DoiLich homNay={homNay} />
        <TomTatNam kieu="lich_am" nam={namAm} tieuDe={`Lịch âm năm ${namAm}: Tết, tháng nhuận, ngày lễ`} nhanLink={`Lịch âm ${namAm} đủ 12 tháng và ngày lễ`} />
        <section aria-labelledby="lich-nam" className="mt-8">
          <h2 id="lich-nam" className="text-xl">{c("nam.tieu_de")}</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {Array.from({ length: 7 }, (_, i) => nam - 2 + i).map((n) => (
              <li key={n}><Link href={duongLichAm(n)} className="vung-cham inline-flex rounded-lg border border-line/70 px-2.5 py-1 text-sm hover:border-gold/50">Lịch âm {n}</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </TrangCongCu>
  );
}
