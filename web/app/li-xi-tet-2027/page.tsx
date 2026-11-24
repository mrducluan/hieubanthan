// LX-2027 — Trang mua & quản lý LÌ XÌ TẾT 2027 (/li-xi-tet-2027).
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang, siteUrl } from "@/lib/seo";
import { thongTinLiXi } from "@/lib/li-xi-may-chu";
import { BanDoTet2027 } from "@/components/li-xi/BanDoTet2027";
import { MuaLiXi } from "./MuaLiXi";
import Link from "@/components/khung/Lien";

const DUONG = "/li-xi-tet-2027";

export const metadata: Metadata = {
  ...metaTrang({
    tieuDe: "Lì xì Tết 2027: tặng báo cáo năm Đinh Mùi cho người thân",
    moTa: "Gửi bao lì xì số kèm lời chúc: mỗi bao mở trọn báo cáo Thời gian tới năm 2027 cho một người. Người nhận tự nhập ngày sinh của mình, người tặng không thấy.",
    duong: DUONG,
  }),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: `${siteUrl()}${DUONG}`,
    title: "Lì xì Tết 2027 · Hiểu Bản Thân",
    description: "Gửi bao lì xì kèm lời chúc: mỗi bao mở trọn báo cáo năm 2027 cho một người.",
    images: [{ url: `${siteUrl()}/og/li-xi?mau=do_son&hoa=linh_vat`, width: 1200, height: 630, alt: "Lì xì Tết 2027" }],
  },
};

export default async function LiXiTet2027Page() {
  const banDau = await thongTinLiXi();
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "Lì xì Tết 2027", about: ["Lì xì Tết 2027", "Quà tặng Tết Đinh Mùi 2027", "Thiệp lì xì số 2027"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm 2027", duong: "/nam/2027" }, { ten: "Lì xì Tết 2027", duong: DUONG }]),
      )} />

      <section className="space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold">Quà Tết Đinh Mùi 2027</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-fg sm:text-5xl">
          Lì xì Tết 2027
        </h1>
        <p className="mx-auto max-w-2xl text-base text-fg-muted">
          Thay một lời chúc đầu năm: chọn thiệp, viết vài dòng, gửi link qua Zalo hay Messenger. Người nhận mở bao, tự nhập ngày sinh
          của mình và đọc trọn báo cáo năm 2027 của riêng họ.
        </p>
      </section>

      <MuaLiXi banDau={banDau} />

      <BanDoTet2027 />

      <section className="rounded-2xl border border-line/60 bg-bg-2/30 p-5 text-xs leading-relaxed text-fg-muted">
        <p className="font-medium text-fg">Điều cần biết</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Bạn <b>không nhập ngày sinh của người nhận</b>. Người nhận tự nhập của chính họ khi mở bao; bạn không thấy thông tin đó.</li>
          <li>Mỗi bao mở trọn báo cáo Thời gian tới <b>năm 2027 cho một người</b> (theo ngày sinh), đọc lại được tới hết năm 2027. Hạn nhận bao tới <b>31/03/2027</b>. Bao không đổi ra tiền hay Sao.</li>
          <li>Tên và lời chúc bạn gõ hiện trên trang bao cho người nhận; ảnh xem trước link chỉ dùng lời chúc mẫu. Không ghi số điện thoại, số tài khoản hay đường dẫn.</li>
          <li>Đơn chưa có bao nào được nhận: hoàn tiền đủ, gửi <Link href="/lien-he" className="underline">liên hệ</Link> kèm mã đơn.</li>
        </ul>
      </section>
    </div>
  );
}
