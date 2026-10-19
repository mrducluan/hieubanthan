// TDG-1 — "Hướng xấu theo năm": năm âm hiện tại (dựng ở máy chủ) + link năm sau.
import type { Metadata } from "next";
import Link from "next/link";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { BangHanNam } from "@/components/tuoi/KetQuaTuoi";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { duongHanNam, hanNamCongKhai, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_HAN_NAM } from "@/app/xem-tuoi-lam-nha/noi-dung";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: "Hướng xấu theo năm: Thái Tuế, Tam Sát, Ngũ Hoàng", moTa: ND_HAN_NAM.moTa, duong: ND_HAN_NAM.duong }), await layNoiDungTrang(ND_HAN_NAM.duong));
}

export default async function Page() {
  const nam = await namAmHienTai();
  const h = await hanNamCongKhai(nam);
  if (!h) throw new Error("engine không phản hồi");
  return (
    <TrangCongCu duong={ND_HAN_NAM.duong}>
      <div className="mx-auto max-w-3xl space-y-5">
        <TieuDeTrang nho="Phong thuỷ theo năm" lon="Hướng xấu theo năm"
          mo_ta="Những phía truyền thống khuyên giữ yên — không động thổ, đục phá, sửa chữa lớn — trong năm." />
        <BangHanNam h={h} />
        <p className="flex flex-wrap gap-3 text-sm">
          {[nam - 1, nam + 1, nam + 2].map((n) => <Link key={n} href={duongHanNam(n)} className="text-gold underline">Năm {n}</Link>)}
        </p>
      </div>
    </TrangCongCu>
  );
}
