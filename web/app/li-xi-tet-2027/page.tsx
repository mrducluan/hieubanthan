// LX-2027 — Trang mua & quản lý Lì xì Báo cáo Tết Đinh Mùi 2027 (/li-xi-tet-2027).
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang, siteUrl } from "@/lib/seo";
import { thongTinLiXi } from "@/lib/li-xi-may-chu";
import { BanDoTet2027 } from "@/components/li-xi/BanDoTet2027";
import { MuaLiXi } from "./MuaLiXi";

const DUONG = "/li-xi-tet-2027";

export const metadata: Metadata = {
  ...metaTrang({
    tieuDe: "Lì Xì Báo Cáo Tết Đinh Mùi 2027 — Món quà hiểu mình, chọn đúng thời điểm",
    moTa: "Tặng bạn bè, người thân, đối tác Bao Lì Xì số mở trọn Báo cáo Năm Đinh Mùi 2027 (Công việc, Tiền bạc, Gia đình, Sức khoẻ, 12 Tháng & 9 việc lớn). Người nhận tự nhập ngày sinh, riêng tư tuyệt đối.",
    duong: DUONG,
  }),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: `${siteUrl()}${DUONG}`,
    title: "Lì Xì Báo Cáo Tết Đinh Mùi 2027 · Hiểu Bản Thân",
    description: "Gửi tặng phong bao Lì xì Đỏ Son – Vàng Kim mở trọn Báo cáo Năm 2027 cá nhân hoá cho người thân và bạn bè.",
    images: [{ url: `${siteUrl()}/og/li-xi?mau=do_son`, width: 1200, height: 630, alt: "Lì Xì Báo Cáo Tết Đinh Mùi 2027" }],
  },
};

export default async function LiXiTet2027Page() {
  const banDau = await thongTinLiXi();
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "Lì Xì Báo Cáo Tết Đinh Mùi 2027", about: ["Lì xì Tết 2027", "Báo cáo năm Đinh Mùi 2027", "Quà tặng Tết"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm 2027", duong: "/nam/2027" }, { ten: "Lì xì Tết 2027", duong: DUONG }]),
      )} />

      <section className="space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold">Quà Tặng Xuân Đinh Mùi · 2027</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-fg sm:text-5xl">
          Lì Xì Báo Cáo Tết 2027
        </h1>
        <p className="mx-auto max-w-2xl text-base text-fg-muted">
          Một phong bao tinh tế thay lời chúc đầu xuân: người nhận tự mở bao lì xì, tự nhập ngày giờ sinh của chính họ để đọc trọn bản đồ 12 tháng năm Đinh Mùi — công việc, tiền bạc, gia đạo, sức khoẻ và 9 việc lớn.
        </p>
      </section>

      <MuaLiXi banDau={banDau} />

      <BanDoTet2027 />

      <section className="rounded-2xl border border-line/60 bg-bg-2/30 p-5 text-xs leading-relaxed text-fg-muted">
        <p className="font-medium text-fg">Quy định minh bạch & bảo vệ riêng tư (Luật 91/2025)</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Bạn <b>không cần nhập ngày sinh của người nhận</b> — người nhận tự nhập thông tin của chính họ khi mở bao lì xì.</li>
          <li>Bao Lì Xì là quyền mở <b>nội dung Báo cáo Năm 2027</b> dùng 1 lần, hạn nhận tới <b>31/03/2027</b>; không quy đổi thành tiền mặt hay Sao.</li>
          <li>Hoàn tiền 100% khi chưa có bao nào trong đơn được mở (liên hệ hỗ trợ kèm mã đơn). Nội dung mang tính văn hoá tham khảo, không thay lời khuyên y tế hay tài chính.</li>
        </ul>
      </section>
    </div>
  );
}
