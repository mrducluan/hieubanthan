// Trang Bản đồ Đội ngũ (/ban-do-doi-ngu) — B2B Money Page giúp chủ doanh nghiệp & quản lý nhìn rõ 5 hành đội ngũ,
// sở trường từng cộng sự và cách phối hợp 2 chiều cho 1–8 người. Dữ liệu chỉ tính tức thời, không lưu ngày sinh trên máy chủ.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { DuongDan } from "@/components/khung/DuongDan";
import { KhungDieuHanh } from "@/components/doanh-chu/KhungDieuHanh";
import { JsonLd } from "@/components/seo/JsonLd";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, siteUrl, urlDayDu } from "@/lib/seo";

const DUONG = "/ban-do-doi-ngu";
const CAP_NHAT = "2026-11-24";

const HOI_DAP_DOI_NGU = [
  {
    hoi: "Bản đồ Đội ngũ hoạt động như thế nào?",
    dap: "Bạn nhập ngày sinh của mình và 1–8 cộng sự (hoặc gửi link mời để từng người tự điền). Hệ thống quy đổi sang ngũ hành Bát tự và nhịp năm cá nhân để vẽ Radar cân bằng 5 hành của cả nhóm, chỉ ra lỗ hổng vận hành và gợi ý giao tiếp 2 chiều giữa quản lý với từng người.",
  },
  {
    hoi: "Công cụ này có dùng để chấm điểm hay sàng lọc tuyển dụng không?",
    dap: "Không. Bản đồ Đội ngũ chỉ dùng để tham khảo cách phân bổ vai trò và giao tiếp trong nhóm đã hình thành, không chấm điểm tốt/xấu và không dùng để loại ứng viên hay phân biệt đối xử lao động.",
  },
  {
    hoi: "Ngày sinh của nhân sự có bị lưu trên máy chủ không?",
    dap: "Không. Ngày sinh chỉ đi qua một lượt tính toán rồi xoá ngay; ở chế độ gửi link mời, cộng sự tự điền trên máy của họ và gửi lại mã bảo mật ngắn không lộ ngày sinh gốc.",
  },
  {
    hoi: "Radar 5 hành đội ngũ cho biết điều gì về vận hành?",
    dap: "Mỗi hành đại diện cho một nhóm năng lực vận hành: Mộc (khởi xướng & mở rộng), Hoả (truyền lửa & kinh doanh), Thổ (ổn định & hậu cần), Kim (quy trình, kiểm soát & tài chính), Thuỷ (phân tích, chiến lược & thích ứng). Nhìn biểu đồ giúp bạn biết nhóm đang mạnh trục nào và cần bù bằng quy trình hay vai trò bổ trợ nào.",
  },
  {
    hoi: "Ngoài Radar 5 hành, trang còn hỗ trợ gì cho chủ doanh nghiệp?",
    dap: "Trang có đủ 3 tab điều hành: Bản đồ Đội ngũ (phối hợp 1–8 người), Lịch 12 tháng (chọn tháng thuận để ra mắt, ký kết hay củng cố nội bộ) và Mặt bằng (khảo sát hướng cửa, bố cục cửa hàng/văn phòng).",
  },
  {
    hoi: "Sử dụng Bản đồ Đội ngũ có mất phí hay cần tài khoản không?",
    dap: "Bạn có thể bấm xem thử ngay đội ngũ mẫu 4 vai trò hoặc chạy bản đồ cho nhóm của mình mà không cần tạo tài khoản.",
  },
];

const BANG_5_HANH = [
  ["Mộc", "Khởi xướng & mở rộng", "Phát triển sản phẩm mới, mở thị trường", "Thiếu dễ ì trệ; dư dễ dàn trải quá nhiều dự án"],
  ["Hoả", "Truyền lửa & kết nối", "Bán hàng, đối ngoại, giữ tinh thần nhóm", "Thiếu dễ trầm lắng; dư dễ nóng vội, đốt giai đoạn"],
  ["Thổ", "Ổn định & hậu cần", "Vận hành lõi, giữ khách, điều phối nội bộ", "Thiếu dễ rời rạc; dư dễ bảo thủ, ngại đổi mới"],
  ["Kim", "Quy trình & kỷ luật", "Tài chính, kiểm soát rủi ro, chuẩn hoá SOP", "Thiếu dễ lỏng lẻo số liệu; dư dễ cứng nhắc, chậm quyết"],
  ["Thuỷ", "Chiến lược & linh hoạt", "Nghiên cứu, phân tích dữ liệu, xử lý biến động", "Thiếu dễ thiếu tầm nhìn dài; dư dễ do dự, đổi hướng liên tục"],
];

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const nd = await layNoiDungTrang(DUONG);
  const h1 = nd.dau.h1 ?? CHU_DOANH_CHU.dau_trang.lon;
  const dd = [{ ten: "Trang chủ", duong: "/" }, { ten: "Bản đồ Đội ngũ", duong: DUONG }];
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        {
          ...ldTrangWeb({
            duong: DUONG,
            ten: h1,
            tomTat: CHU_DOANH_CHU.meta.mo_ta,
            about: ["Bản đồ Đội ngũ", "Quản trị đội ngũ", "Bát tự ngũ hành", "Phối hợp nhân sự"],
          }),
          dateModified: CAP_NHAT,
          mainEntity: { "@id": `${urlDayDu(DUONG)}#ung-dung` },
        },
        {
          "@type": "WebApplication",
          "@id": `${urlDayDu(DUONG)}#ung-dung`,
          name: "Bản đồ Đội ngũ",
          url: urlDayDu(DUONG),
          description: CHU_DOANH_CHU.meta.mo_ta,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: "vi-VN",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
          publisher: { "@id": `${siteUrl()}/#to-chuc` },
          isPartOf: { "@id": `${siteUrl()}/#website` },
        },
        ldDuongDan(dd),
        ldHoiDap(HOI_DAP_DOI_NGU),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc
        cap={1}
        nho={CHU_DOANH_CHU.dau_trang.nho}
        lon={h1}
        mo_ta={nd.dau.loiDan ?? CHU_DOANH_CHU.dau_trang.mo_ta}
      />
      <div className="mt-4">
        <TraLoiNhanh chu="Bản đồ Đội ngũ đặt hồ sơ 5 hành Bát tự và nhịp năm cá nhân của chủ doanh nghiệp cạnh 1–8 cộng sự để nhìn rõ trục vận hành đang mạnh, lỗ hổng quy trình cần bù và cách mở lời giảm va chạm 2 chiều. Không lưu ngày sinh trên máy chủ, không dùng để sàng lọc tuyển dụng." />
      </div>
      <div className="mt-6">
        <KhungDieuHanh />
      </div>

      <section aria-labelledby="cam-nang-doi-ngu" className="mx-auto mt-14 max-w-3xl border-t border-line/50 pt-8 text-fg-muted">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cam-nang-doi-ngu" className="text-2xl text-fg">Năm trục vận hành trong Bản đồ Đội ngũ</h2>
          <p className="text-xs text-fg-faint">Cập nhật <time dateTime={CAP_NHAT}>24/11/2026</time></p>
        </div>
        <p className="mt-3 leading-relaxed">
          Khi gom nhiều cá nhân vào một nhóm vận hành, va chạm thường đến từ sự lệch nhịp giữa người thiên mở rộng và người thiên kiểm soát. Bảng dưới đây tóm tắt cách đọc 5 hành trong bối cảnh doanh nghiệp nhỏ và vừa:
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line/70">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 bg-surface/40 text-fg">
                <th className="px-3 py-2.5 font-medium">Hành</th>
                <th className="px-3 py-2.5 font-medium">Trục năng lực</th>
                <th className="px-3 py-2.5 font-medium">Vai trò thường hợp</th>
                <th className="px-3 py-2.5 font-medium">Lưu ý khi thiếu hoặc dư</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {BANG_5_HANH.map((r) => (
                <tr key={r[0]}>
                  <td className="px-3 py-2.5 font-medium text-fg">{r[0]}</td>
                  <td className="px-3 py-2.5">{r[1]}</td>
                  <td className="px-3 py-2.5">{r[2]}</td>
                  <td className="px-3 py-2.5">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 text-xl text-fg">Câu hỏi thường gặp</h3>
        <dl className="mt-3 space-y-4">
          {HOI_DAP_DOI_NGU.map((h) => (
            <div key={h.hoi}>
              <dt className="font-medium text-fg">{h.hoi}</dt>
              <dd className="mt-1 leading-relaxed">{h.dap}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm">
          Đọc thêm:{" "}
          <Link href="/bat-tu" className="text-gold underline">Xem Bát tự online</Link> ·{" "}
          <Link href="/hop-doi" className="text-gold underline">Xem hợp đôi đồng nghiệp</Link> ·{" "}
          <Link href="/phong-thuy" className="text-gold underline">Phong thuỷ văn phòng & mặt bằng</Link> ·{" "}
          <Link href="/goi-xem" className="text-gold underline">Các gói xem luận giải</Link>
        </p>
      </section>
    </div>
  );
}
