// Chiêm tinh phương Tây — bản đồ sao ngày sinh (cung Mặt Trời, Mặt Trăng, Cung Mọc, 12 nhà, góc chiếu, chu kỳ Thổ tinh)
// đặt cạnh Bát tự và Tử vi, không quy đổi, không chấm điểm (CD-1). Engine tính, trang chỉ hiển thị. Câu trả lời nhanh và hỏi
// đáp dựng ở máy chủ (Google, bot AI đọc được không cần JS). Chữ đầu trang sửa được ở CMS "Trang website" (sổ trang).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { DuongDan } from "@/components/khung/DuongDan";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { HoiDapHien, TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { KhungChiemTinh } from "@/components/chiem-tinh/KhungChiemTinh";
import { anhBai, goiLd, ldAnh, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang, siteUrl, urlDayDu } from "@/lib/seo";
import { duongDanCongCu } from "@/lib/duong-dan";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

const DUONG = "/chiem-tinh";
const MAC = {
  tieuDe: "Chiêm tinh online: lập bản đồ sao cá nhân miễn phí",
  h1: "Chiêm tinh: bản đồ sao ngày sinh của bạn nói gì?",
  moTa: "Lập bản đồ sao theo ngày, giờ, nơi sinh: cung Mặt Trời, Mặt Trăng, Cung Mọc, 12 nhà, góc chiếu, đặt cạnh Bát tự và Tử vi. Miễn phí, không lưu dữ liệu.",
  loiDan: "Nhập ngày sinh để xem các hành tinh nằm ở cung hoàng đạo nào lúc bạn ra đời. Có giờ và nơi sinh thì xem thêm Cung Mọc, 12 nhà; chưa biết giờ vẫn xem được cung Mặt Trời và cung Mặt Trăng.",
};

const TRA_LOI = `Chiêm tinh phương Tây đọc vị trí Mặt Trời, Mặt Trăng và các hành tinh trên mười hai cung hoàng đạo vào đúng lúc bạn
  sinh ra. Cung Mặt Trời nói về điều bạn hướng tới, cung Mặt Trăng nói về nhu cầu cảm xúc, Cung Mọc là cách người khác thấy bạn
  lúc đầu. Muốn biết Cung Mọc và 12 nhà cần giờ và nơi sinh; không biết giờ vẫn xem được các hành tinh. Trang đặt bản đồ sao cạnh
  Bát tự và Tử vi để bạn tự so, không đổi qua lại và không chấm điểm.`.replace(/\s+/g, " ").trim();

const HOI_DAP = [
  { hoi: "Chiêm tinh phương Tây là gì?", dap: "Là cách đọc vị trí Mặt Trời, Mặt Trăng và các hành tinh trên mười hai cung hoàng đạo lúc một người sinh ra. Mỗi hành tinh ứng với một mặt của con người (ý chí, cảm xúc, cách nghĩ, cách yêu, cách hành động), cung hoàng đạo cho biết mặt ấy mang sắc thái gì." },
  { hoi: "Không biết giờ sinh có xem được không?", dap: "Được. Không có giờ thì trang không đoán Cung Mọc và 12 nhà, chỉ đọc cung của các hành tinh. Mặt Trăng đi nhanh nên có ngày nó đổi cung trong ngày — trang sẽ ghi rõ nếu ngày sinh của bạn rơi vào trường hợp ấy." },
  { hoi: "Cung Mặt Trời khác cung Mọc thế nào?", dap: "Cung Mặt Trời (cung bạn hay đọc trên báo) tính theo ngày sinh và nói về điều bạn hướng tới. Cung Mọc tính theo giờ và nơi sinh, nói về dáng vẻ và cách bạn bước vào chỗ mới. Hai người cùng ngày sinh nhưng khác giờ có thể khác Cung Mọc." },
  { hoi: "Vì sao không quy đổi sang ngũ hành hay chấm điểm?", dap: "Chiêm tinh phương Tây và Bát tự, Tử vi là các hệ khác nhau: ngũ hành không phải bốn nguyên tố lửa, đất, khí, nước. Trang đặt hai bên cạnh nhau để bạn tự so, không cộng thành một con số." },
  { hoi: "Thổ tinh hồi quy (Saturn Return) là gì?", dap: "Thổ tinh đi hết một vòng hoàng đạo khoảng 29,5 năm. Quanh tuổi 28–30 và 57–60, nó quay lại đúng chỗ lúc bạn sinh — chiêm tinh coi đó là lúc rà lại cam kết và trách nhiệm. Đây là một nhịp để tự nhìn lại, không phải điều đã định." },
  { hoi: "Xem hợp đôi bằng bản đồ sao có cần gì?", dap: "Cần ngày sinh của người kia và người ấy phải đồng ý chia sẻ. Trang chỉ chỉ ra chỗ hai người dễ đồng điệu và chỗ cần thoả thuận, không chấm điểm hợp – khắc, không lưu ngày sinh." },
];

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: MAC.tieuDe, moTa: MAC.moTa, duong: DUONG }), await layNoiDungTrang(DUONG));
}

export default async function ChiemTinhPage() {
  const nd = await layNoiDungTrang(DUONG);
  const h1 = nd.dau.h1 ?? MAC.h1;
  const dd = duongDanCongCu(DUONG, "Chiêm tinh");
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        { ...ldTrangWeb({ duong: DUONG, ten: h1, tomTat: MAC.moTa, about: ["Chiêm tinh", "Bản đồ sao", "Cung hoàng đạo"] }),
          mainEntity: { "@id": `${urlDayDu(DUONG)}#ung-dung` } },
        {
          "@type": "WebApplication",
          "@id": `${urlDayDu(DUONG)}#ung-dung`,
          name: h1,
          url: urlDayDu(DUONG),
          description: MAC.moTa,
          image: ldAnh(anhBai({ tieuDe: h1 }), h1),        // Image metadata (bản quyền ảnh) — cùng khối với primaryImageOfPage của WebPage
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
      <TieuDeMuc cap={1} nho="Huyền học · bản đồ sao" lon={h1} mo_ta={nd.dau.loiDan ?? MAC.loiDan} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mb-6" />
      <div className="mb-8"><TraLoiNhanh chu={TRA_LOI} /></div>
      <KhungChiemTinh />
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-10" />
      <div className="mt-12"><HoiDapHien ds={HOI_DAP} /></div>
      <p className="mt-10 text-sm text-fg-muted">
        Đọc thêm: <Link href="/bat-tu" className="text-gold underline">Xem Bát tự</Link> ·{" "}
        <Link href="/tu-vi" className="text-gold underline">Xem Tử vi</Link> ·{" "}
        <Link href="/huyen-hoc" className="text-gold underline">Huyền học</Link>
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}
