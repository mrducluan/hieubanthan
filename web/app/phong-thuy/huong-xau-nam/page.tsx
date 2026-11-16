// TDG-1 — "Hướng xấu theo năm": năm âm hiện tại (dựng ở máy chủ) + link năm sau.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { BangHanNam } from "@/components/tuoi/KetQuaTuoi";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { duongHanNam, hanNamCongKhai, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_HAN_NAM } from "@/app/xem-tuoi-lam-nha/noi-dung";
import { CHU_HAN_NAM } from "@/lib/chu/cong-cu";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";
import { taoChu } from "@/lib/chu-trang";

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 8: /en/feng-shui/annual-afflictions là rewrite của trang này — metadata bản Anh từ lib/so-trang-en.ts.
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(ND_HAN_NAM.duong);
  return themHreflangVi(apDungSeo(metaTrang({ tieuDe: "Hướng xấu theo năm: Thái Tuế, Tam Sát, Ngũ Hoàng", moTa: ND_HAN_NAM.moTa, duong: ND_HAN_NAM.duong }), await layNoiDungTrang(ND_HAN_NAM.duong)), ND_HAN_NAM.duong);
}

export default async function Page() {
  const nam = await namAmHienTai();
  const h = await hanNamCongKhai(nam);
  if (!h) throw new Error("engine không phản hồi");
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu);
  return (
    <TrangCongCu duong={ND_HAN_NAM.duong}>
      <div className="mx-auto max-w-3xl space-y-5">
        <TieuDeTrang nho={en ? taoChu(CHU_HAN_NAM, null, "en")("dau.nhan_tren") : CHU_HAN_NAM["dau.nhan_tren"]!.mac_dinh} lon={t("hx.h1")}
          mo_ta={t("hx.loi_dan")} />
        <BangHanNam h={h} ngonNgu={ngonNgu} />
        {!en && <AnhTomTat kieu="huong_xau" nam={nam} className="mt-2" />}
        <p className="flex flex-wrap gap-3 text-sm">
          {[nam - 1, nam + 1, nam + 2].map((n) => <Link key={n} href={lienNN(en, duongHanNam(n))!} className="text-gold underline">{tp("c.nam_n", { nam: n })}</Link>)}
        </p>
      </div>
    </TrangCongCu>
  );
}
