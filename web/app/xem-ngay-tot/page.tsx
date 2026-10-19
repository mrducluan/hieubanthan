// HL-1 — "Xem ngày tốt hôm nay": máy chủ dựng sẵn thẻ hôm nay (giờ Việt Nam) cho người xem + SEO; hồ sơ trên máy
// thêm phần tuổi xung/hợp ở trình duyệt.
import type { Metadata } from "next";
import Link from "next/link";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { XemNgayTot } from "@/components/hoang-lich/XemNgayTot";
import { homNayVN, ngayTotCongKhai, thangCongKhai } from "@/lib/hoang-lich";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { ND_XEM_NGAY } from "./noi-dung";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: "Xem ngày tốt hôm nay: hoàng đạo, giờ tốt, việc nên làm", moTa: ND_XEM_NGAY.moTa, duong: "/xem-ngay-tot" }), await layNoiDungTrang(ND_XEM_NGAY.duong));
}

export default async function Page() {
  const iso = homNayVN();
  const [d, t] = await Promise.all([ngayTotCongKhai(iso), thangCongKhai(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)))]);
  if (!d) throw new Error("engine lịch không phản hồi");   // → error.tsx, mã 5xx (không index trang lỗi)
  return (
    <TrangCongCu duong={ND_XEM_NGAY.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho="Hoàng lịch mỗi ngày" lon="Xem ngày tốt hôm nay"
          mo_ta="Ngày hoàng đạo hay hắc đạo, giờ tốt, việc sách lịch ghi nên làm và nên kiêng — và ngày này có xung tuổi bạn không." />
        <XemNgayTot banDau={d} thang={t} />
        <p className="mt-4 text-xs text-fg-faint">Đường dẫn cố định của ngày này: <Link href={`/xem-ngay-tot/${iso}`} className="text-gold underline">/xem-ngay-tot/{iso}</Link></p>
      </div>
    </TrangCongCu>
  );
}
