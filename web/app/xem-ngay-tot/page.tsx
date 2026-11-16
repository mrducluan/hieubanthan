// HL-1 — "Xem ngày tốt hôm nay": máy chủ dựng sẵn thẻ hôm nay (giờ Việt Nam) cho người xem + SEO; hồ sơ trên máy
// thêm phần tuổi xung/hợp ở trình duyệt.
import { TomTatNam } from "@/components/seo/TomTatNam";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { XemNgayTot } from "@/components/hoang-lich/XemNgayTot";
import { NgayTotTheoViec } from "@/components/hoang-lich/NgayTotTheoViec";
import { homNayVN, ngayTotCongKhai, thangCongKhai } from "@/lib/hoang-lich";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { ND_XEM_NGAY } from "./noi-dung";
import { CHU_XEM_NGAY } from "@/lib/chu/cong-cu";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn } from "@/lib/en/seo";
import { chuLichMayChu, voiHreflang } from "@/lib/en/lich";
import { GOC_EN, duongNgay } from "@/lib/hoang-lich";

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 8: /en/auspicious-dates là rewrite của trang này — metadata bản Anh từ lib/so-trang-en.ts.
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(ND_XEM_NGAY.duong);
  return voiHreflang(apDungSeo(metaTrang({ tieuDe: "Xem ngày tốt hôm nay: lịch vạn niên, giờ hoàng đạo", moTa: ND_XEM_NGAY.moTa, duong: "/xem-ngay-tot" }), await layNoiDungTrang(ND_XEM_NGAY.duong)),
    ND_XEM_NGAY.duong, GOC_EN);
}

export default async function Page() {
  const { en, c } = await chuLichMayChu();
  const iso = homNayVN();
  const [d, t] = await Promise.all([ngayTotCongKhai(iso), thangCongKhai(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)))]);
  if (!d) throw new Error("engine lịch không phản hồi");   // → error.tsx, mã 5xx (không index trang lỗi)
  if (en) {
    return (
      <TrangCongCu duong={ND_XEM_NGAY.duong}>
        <div className="mx-auto max-w-3xl">
          <TieuDeTrang nho={CHU_XEM_NGAY["dau.nhan_tren"]!.en} lon={c("xnt.lon")} mo_ta={c("xnt.mo_ta")} />
          <XemNgayTot banDau={d} thang={t} />
          <p className="mt-4 text-xs text-fg-faint">{c("xnt.co_dinh")} <Link href={duongNgay(iso, true)} className="text-gold underline">{duongNgay(iso, true)}</Link></p>
          <NgayTotTheoViec className="mt-10" />
        </div>
      </TrangCongCu>
    );
  }
  return (
    <TrangCongCu duong={ND_XEM_NGAY.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={CHU_XEM_NGAY["dau.nhan_tren"]!.mac_dinh} lon="Xem ngày tốt hôm nay"
          mo_ta="Ngày hoàng đạo hay hắc đạo, giờ tốt, việc sách lịch ghi nên làm và nên kiêng — và ngày này có xung tuổi bạn không." />
        <XemNgayTot banDau={d} thang={t} />
        <p className="mt-4 text-xs text-fg-faint">Đường dẫn cố định của ngày này: <Link href={`/xem-ngay-tot/${iso}`} className="text-gold underline">/xem-ngay-tot/{iso}</Link></p>
        <TomTatNam kieu="ngay" ngay={iso} gonDong tieuDe={`Hôm nay ${iso.split("-").reverse().join("/")} tốt hay xấu?`} nhanLink="Xem đủ giờ tốt, việc nên làm của ngày này" />
        <NgayTotTheoViec className="mt-10" />
      </div>
    </TrangCongCu>
  );
}
