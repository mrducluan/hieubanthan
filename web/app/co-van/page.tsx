// Trang "/co-van": Cố vấn quyết định — hỏi bằng lời thường ("có nên mở shop năm sau không?"), đọc ba cách riêng (Nhân · Thiên · Địa),
// không gộp mức, miễn phí, không lưu. CV-4: mở cho tìm kiếm (trước noindex) — có câu trả lời nhanh, hỏi đáp, schema; chữ đầu trang
// sửa được ở CMS "Trang website" (sổ trang). Từ khoá thuộc trang này: "hỏi một quyết định", "có nên mở shop / mua nhà / nghỉ việc"
// (SEO-1: không mang tên môn nào trong tiêu đề / H1 — mỗi môn thuộc trang trụ của nó).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { DuongDan } from "@/components/khung/DuongDan";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { HoiDapHien, TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { KhungTrangCoVan } from "@/components/co-van/KhungTrangCoVan";
import { anhBai, goiLd, ldAnh, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang, siteUrl, urlDayDu } from "@/lib/seo";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

const DUONG = "/co-van";
const MAC = {
  tieuDe: "Có nên mở shop, mua nhà, nghỉ việc? Hỏi theo ngày sinh",
  h1: "Có nên mở shop, mua nhà, nghỉ việc? Hỏi một quyết định, xem ba cách nhìn",
  moTa: "Nêu việc bạn định làm và ngày sinh: hệ thống nói tháng nào hợp, cần chuẩn bị gì, hướng cửa có hợp không, và nói rõ khi các cách xem nhìn khác nhau. Miễn phí, không lưu.",
  loiDan: "Nêu điều bạn đang cân nhắc và ngày sinh (chưa biết giờ sinh vẫn xem được). Ba cách xem đọc riêng: sức của chính bạn, thời điểm của đúng năm hoặc tháng bạn hỏi, và không gian khi việc đụng tới. Khi chúng nói khác nhau, trang nói rõ chứ không chọn thay bạn.",
};

const TRA_LOI = `Cố vấn nhận một câu hỏi về việc bạn định làm (mở cửa hàng, mở quán, mua nhà, nghỉ việc, góp vốn, đầu tư, kết hôn…) cùng ngày sinh,
  rồi đọc ba cách riêng: sức của chính bạn cho việc ấy, thời điểm của đúng năm hoặc tháng bạn hỏi, và không gian (hướng mặt tiền cửa hàng
  hoặc hướng nhà) khi việc đụng tới. Kết quả nói tháng nào hợp để bắt tay vào việc chính, tháng nào nên đi chậm, điều kiện nên có và việc đầu
  tiên nên làm. Hệ thống không trả lời "có" hay "không" thay bạn, và không thay lời khuyên đầu tư hay pháp lý.`.replace(/\s+/g, " ").trim();

const HOI_DAP = [
  { hoi: "Hỏi “có nên mở shop năm sau không”, hệ thống trả lời có hay không?", dap: "Không trả lời thay bạn. Hệ thống nói các cách xem đang nghiêng về thuận, làm được nhưng nên chọn thời điểm, hay nên chuẩn bị thêm; kèm tháng nên bắt đầu, tháng nên đi chậm, điều kiện cần có (vốn dự phòng, hợp đồng thuê, hướng mặt tiền) và việc đầu tiên nên làm. Quyết định vẫn là của bạn." },
  { hoi: "Cần nhập những gì?", dap: "Câu hỏi, ngày sinh và giới tính là đủ. Có giờ sinh thì xem thêm Tử vi và Bát tự đủ tám chữ cho đúng năm bạn hỏi. Việc kinh doanh cần hướng mặt tiền của cửa hàng: lấy từ hồ sơ đã lưu trên máy, đo bằng la bàn điện thoại, hoặc chọn một trong tám hướng." },
  { hoi: "Hướng nhà ở có dùng cho cửa hàng được không?", dap: "Không. Cửa hàng được đọc theo hướng mặt tiền của chính nó (cửa vào, quầy thu ngân, chỗ ngồi của chủ). Nếu cửa hàng nằm ngay trong căn nhà bạn ở thì chọn “cửa hàng ở chính căn nhà này” và hệ thống dùng hướng đó; còn không, cần đo riêng mặt tiền cửa hàng." },
  { hoi: "Hỏi được những việc nào?", dap: "Mở cửa hàng hoặc quán, mở thêm chi nhánh, tự kinh doanh, chuyển việc, đầu tư, góp vốn, mua nhà, kết hôn, chuyện gia đạo và lấy lại sức. Câu hỏi về một người khác, chuyện đã xảy ra, hoặc lúc bạn đang rất khó khăn thì trang chuyển hướng hoặc ưu tiên lời hỗ trợ, không luận thay." },
  { hoi: "Câu hỏi và ngày sinh có được lưu không?", dap: "Không. Câu hỏi và ngày sinh chỉ dùng để tính rồi bỏ; hồ sơ (nếu bạn đã lưu ở các trang khác) nằm trên máy bạn. Ngày sinh của người liên quan chỉ được dùng khi bạn tích xác nhận người ấy đã đồng ý." },
  { hoi: "Khác gì với xem ngày tốt?", dap: "Xem ngày tốt trả lời “ngày nào hợp”. Cố vấn trả lời “có nên làm không, tháng nào hợp, cần chuẩn bị gì” cho đúng việc và đúng năm bạn hỏi, rồi chỉ sang ngày hợp việc trong các tháng ấy." },
];

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: MAC.tieuDe, moTa: MAC.moTa, duong: DUONG }), await layNoiDungTrang(DUONG));
}

export default async function CoVanPage() {
  const nd = await layNoiDungTrang(DUONG);
  const h1 = nd.dau.h1 ?? MAC.h1;
  const dd = [{ ten: "Trang chủ", duong: "/" }, { ten: "Hỏi một quyết định", duong: DUONG }];
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        { ...ldTrangWeb({ duong: DUONG, ten: h1, tomTat: MAC.moTa, about: ["Quyết định", "Chọn thời điểm", "Kinh doanh"] }),
          mainEntity: { "@id": `${urlDayDu(DUONG)}#ung-dung` } },
        {
          "@type": "WebApplication",
          "@id": `${urlDayDu(DUONG)}#ung-dung`,
          name: h1,
          url: urlDayDu(DUONG),
          description: MAC.moTa,
          image: ldAnh(anhBai({ tieuDe: h1 }), h1),        // Image metadata: creator, creditText, copyrightNotice, license, acquireLicensePage
          applicationCategory: "LifestyleApplication",
          operatingSystem: "Web",
          inLanguage: "vi-VN",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
          publisher: { "@id": `${siteUrl()}/#to-chuc` },
          isPartOf: { "@id": `${siteUrl()}/#website` },
        },
        ldDuongDan(dd), ldHoiDap(HOI_DAP),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho="Cố vấn · Nhân – Thiên – Địa" lon={h1} mo_ta={nd.dau.loiDan ?? MAC.loiDan} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mb-6" />
      <div className="mb-8"><TraLoiNhanh chu={TRA_LOI} /></div>
      <KhungTrangCoVan />
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-10" />
      <div className="mt-12"><HoiDapHien ds={HOI_DAP} /></div>
      <p className="mt-10 text-sm text-fg-muted">
        Đọc thêm: <Link href="/xem-ngay-tot" className="text-gold underline">Xem ngày tốt</Link> ·{" "}
        <Link href="/thoi-gian-toi" className="text-gold underline">Thời gian tới của bạn</Link> ·{" "}
        <Link href="/co-van-kinh-doanh" className="text-gold underline">Cố vấn kinh doanh</Link> ·{" "}
        <Link href="/huyen-hoc" className="text-gold underline">Huyền học</Link>
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const revalidate = 21600;
