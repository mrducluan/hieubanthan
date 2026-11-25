// Trang Quản lý Nhân sự & Bản đồ Đội ngũ (/quan-ly-nhan-su) — B2B Money Page giúp chủ doanh nghiệp & cấp quản lý
// hiểu tính cách nhân viên, giao đúng việc, giảm va chạm và lấp lỗ hổng đội ngũ cho 1–8 cộng sự.
// Dữ liệu chỉ tính tức thời, không lưu ngày sinh trên máy chủ; chỉ dùng tham khảo giao tiếp & phân việc, không sàng lọc tuyển dụng.
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

const DUONG = "/quan-ly-nhan-su";
const CAP_NHAT = "2026-11-25";

const HOI_DAP_NHAN_SU = [
  {
    hoi: "Công cụ quản lý nhân sự & hiểu tính cách nhân viên này hoạt động thế nào?",
    dap: "Bạn nhập ngày sinh của mình và 1–8 cộng sự (hoặc gửi link mời để từng người tự điền). Hệ thống quy đổi sang ngũ hành Bát tự và nhịp năm cá nhân để vẽ Radar cân bằng 5 hành của cả nhóm, chỉ ra lỗ hổng vận hành, sở trường từng người và gợi ý cách mở lời giao tiếp 2 chiều.",
  },
  {
    hoi: "Khác gì với bài test tính cách DISC hay MBTI cho đội nhóm?",
    dap: "Test DISC/MBTI thường mất 20–30 phút làm 40–60 câu hỏi và nhân viên dễ chọn đáp án theo kỳ vọng của sếp. Ở đây bạn chỉ mất 2 phút để thấy ngay cấu trúc 5 hành đội ngũ, điểm dễ va chạm giữa sếp với từng cộng sự và cả nhịp năng lượng năm nay (đang pha tăng tốc hay pha xây nền) mà không cần bài trắc nghiệm dài.",
  },
  {
    hoi: "Công cụ này có dùng để chấm điểm hay sàng lọc tuyển dụng không?",
    dap: "Không. Trang chỉ dùng để tham khảo cách giao tiếp, phân bổ vai trò và phối hợp trong đội ngũ đã hình thành, không chấm điểm tốt/xấu và tuyệt đối không dùng để loại ứng viên hay phân biệt đối xử lao động.",
  },
  {
    hoi: "Ngày sinh của nhân viên có bị lưu trên máy chủ không?",
    dap: "Không. Ngày sinh chỉ đi qua một lượt tính toán rồi xoá ngay; ở chế độ gửi link mời, nhân sự tự điền trên máy của họ và gửi lại một mã bảo mật ngắn không lộ ngày sinh gốc.",
  },
  {
    hoi: "Radar 5 hành giúp giải quyết bài toán giao việc đúng người ra sao?",
    dap: "Mỗi hành ứng với một trục vận hành thực tế: Kim (tài chính, pháp chế, kiểm soát rủi ro), Mộc (mở rộng thị trường, chiến lược, dự án mới), Thuỷ (đối ngoại, thương lượng, phân tích dữ liệu), Hoả (kinh doanh tuyến đầu, truyền thông, truyền lửa), Thổ (vận hành, quy trình, hậu cần, giữ khách). Nhìn Radar giúp sếp biết nhóm đang lệch trục nào để bù bằng quy trình hoặc phân vai hợp lý.",
  },
  {
    hoi: "Ngoài quản lý đội ngũ, trang còn công cụ nào cho chủ doanh nghiệp?",
    dap: "Trang gồm đủ 3 tab điều hành: Quản lý Đội ngũ (phối hợp 1–8 người), Lịch 12 tháng (chọn tháng thuận để ra mắt, ký kết hay củng cố nội bộ) và Mặt bằng (khảo sát hướng cửa, quầy thu ngân và bố cục cửa hàng/văn phòng).",
  },
  {
    hoi: "Sử dụng công cụ quản lý nhân sự này có mất phí hay cần tài khoản không?",
    dap: "Xem đội ngũ mẫu 4 vai trò luôn miễn phí, không cần tài khoản. Chạy bản đồ cho đội ngũ thật hiện đang mở dùng thử; khi bắt đầu tính bằng Sao, số Sao hiện rõ trước khi bạn bấm xem.",
  },
];

// Vai trò theo hành: chép nguyên văn từ engine `calc/doanh_chu._VAI_TRO_HANH` (một nguồn — sửa ở engine thì sửa cả đây).
const BANG_5_HANH = [
  ["Kim", "Kiểm soát tài chính · Pháp chế · Quản trị rủi ro", "Giữ kỷ luật ngân sách, chuẩn hoá tiêu chuẩn chất lượng và ra quyết định tỉnh táo bằng số liệu."],
  ["Mộc", "Mở rộng thị trường · Chiến lược · Phát triển dự án mới", "Tạo đà tăng trưởng, dám tiên phong khai phá sản phẩm hoặc chi nhánh mới cho doanh nghiệp."],
  ["Thuỷ", "Đối ngoại · Thương lượng · R&D & Phân tích dữ liệu", "Linh hoạt xoay chuyển tình thế, giỏi đàm phán khách hàng khó và đọc nhanh biến động thị trường."],
  ["Hoả", "Kinh doanh tuyến đầu · Truyền thông · Truyền lửa đội nhóm", "Tạo năng lượng tích cực, chốt đơn nhanh, xây dựng thương hiệu và kết nối tinh thần tập thể."],
  ["Thổ", "Vận hành · Quy trình · Giữ chân khách hàng & Hậu cần", "Đảm bảo bộ máy chạy đều tay, giữ chữ tín giao hàng đúng hẹn và ổn định nội bộ dài hạn."],
];

const SO_SANH_DISC = [
  ["Thời gian chuẩn bị", "2 phút nhập hoặc gửi link mời, có kết quả ngay", "20–30 phút để từng nhân viên làm 40–60 câu hỏi"],
  ["Độ tự nhiên của dữ liệu", "Tính theo công thức cố định, không bị trả lời đối phó cho đẹp lòng sếp", "Dễ chịu ảnh hưởng tâm trạng lúc làm bài hoặc chọn đáp án chuẩn mực"],
  ["Góc nhìn cả đội ngũ", "Radar 5 hành chỉ rõ trục vận hành đang thừa/thiếu của cả nhóm", "Thường đọc từng hồ sơ rời rạc, phải tự ghép lại bằng tay"],
  ["Nhịp biến động theo năm", "Có sẵn nhịp năm cá nhân (pha tăng tốc hay pha xây nền) để đặt KPI vừa tầm", "Tĩnh theo tính cách cố định, ít phản ánh nhịp năng lượng từng năm"],
  ["Gợi ý giao tiếp 2 chiều", "Chỉ rõ 3 điều sếp nên lưu ý, 2 điều cộng sự tự chỉnh và câu mở lời mẫu", "Chủ yếu mô tả nhóm tính cách chung (D/I/S/C)"],
];

const TINH_HUONG_SEP = [
  {
    van_de: "Nhân viên giỏi chuyên môn nhưng hay phản biện căng, khó góp ý",
    goc_re: "Thường gặp ở nhân sự thiên Kim/Mộc mạnh: trọng lý lẽ, cần thấy mục tiêu và tiêu chuẩn rõ ràng trước khi nhận lệnh.",
    mo_loi: "“Anh cần góc nhìn phản biện của em cho tiêu chuẩn đầu ra mục này — mình chốt mốc đo lường trước rồi em tự chọn cách làm nhé.”",
  },
  {
    van_de: "Team kinh doanh máu lửa nhưng hay sót quy trình, quên báo cáo",
    goc_re: "Đội ngũ thừa Hoả (chốt nhanh, thích tương tác) nhưng mỏng Thổ/Kim (quy trình và kiểm soát chi tiết).",
    mo_loi: "Gỡ việc nhập liệu lặp lại sang checklist 3 bước cuối ngày hoặc ghép cặp 1 nhân sự thiên Thổ hậu cần giữ nhịp bàn giao.",
  },
  {
    van_de: "Hai quản lý chủ chốt đều giỏi nhưng cứ họp chung là căng thẳng",
    goc_re: "Lệch nhịp giữa trục mở rộng (Mộc/Hoả) muốn chạy nhanh và trục kiểm soát rủi ro (Kim/Thổ) muốn chắc từng bước.",
    mo_loi: "Tách rõ vai trong cuộc họp: 15 phút đầu cho trục mở rộng đề xuất phương án, 15 phút sau trục kiểm soát rà rủi ro — không cắt lời chéo pha.",
  },
  {
    van_de: "Nhân sự nòng cốt bỗng chững lại, tụt năng lượng hoặc muốn nhảy việc",
    goc_re: "Nhiều khi không phải do năng lực giảm mà vì người đó đang rơi vào năm cá nhân 4/7/9 (pha cần sắp xếp lại, học sâu hoặc đổi vai trò).",
    mo_loi: "Đặt lịch 1-1 hỏi về tải việc và mục tiêu 6 tháng tới thay vì ép KPI ngắn hạn; giao thêm việc huấn luyện hoặc dự án nền tảng.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const nd = await layNoiDungTrang(DUONG);
  const h1 = nd.dau.h1 ?? CHU_DOANH_CHU.dau_trang.lon;
  const dd = [{ ten: "Trang chủ", duong: "/" }, { ten: "Quản lý nhân sự", duong: DUONG }];
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        {
          ...ldTrangWeb({
            duong: DUONG,
            ten: h1,
            tomTat: CHU_DOANH_CHU.meta.mo_ta,
            about: ["Quản lý nhân sự", "Cách quản lý nhân viên", "Hiểu tính cách nhân viên", "Bản đồ Đội ngũ", "Bát tự ngũ hành"],
          }),
          dateModified: CAP_NHAT,
          mainEntity: { "@id": `${urlDayDu(DUONG)}#ung-dung` },
        },
        {
          "@type": "WebApplication",
          "@id": `${urlDayDu(DUONG)}#ung-dung`,
          name: "Quản lý Nhân sự & Bản đồ Đội ngũ",
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
        ldHoiDap(HOI_DAP_NHAN_SU),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc
        cap={1}
        nho={CHU_DOANH_CHU.dau_trang.nho}
        lon={h1}
        mo_ta={nd.dau.loiDan ?? CHU_DOANH_CHU.dau_trang.mo_ta}
      />
      <div className="mt-4">
        <TraLoiNhanh chu="Công cụ quản lý nhân sự & bản đồ đội ngũ đặt hồ sơ 5 hành Bát tự cùng nhịp năm cá nhân của quản lý cạnh 1–8 nhân viên để hiểu tính cách làm việc, giao đúng người đúng việc, nhìn rõ lỗ hổng quy trình và có sẵn câu mở lời giảm va chạm 2 chiều — mất 2 phút, không lưu ngày sinh, không dùng để sàng lọc tuyển dụng." />
      </div>
      <div className="mt-6">
        <KhungDieuHanh />
      </div>

      <section aria-labelledby="cam-nang-quan-ly" className="mx-auto mt-14 max-w-3xl border-t border-line/50 pt-8 text-fg-muted">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cam-nang-quan-ly" className="text-2xl text-fg">Hiểu tính cách nhân viên theo 5 trục vận hành</h2>
          <p className="text-xs text-fg-faint">Cập nhật <time dateTime={CAP_NHAT}>25/11/2026</time></p>
        </div>
        <p className="mt-3 leading-relaxed">
          Phần lớn xung đột trong đội nhóm không đến từ việc nhân sự thiếu cố gắng, mà do giao sai trục sở trường hoặc lệch nhịp giữa người thiên mở rộng và người thiên kiểm soát. Bảng dưới đây là cách công cụ phân bổ vai trò tham khảo theo 5 hành — dùng để giao việc và trao đổi 1-1 hiệu quả hơn, không dùng để chấm điểm hay loại ứng viên:
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line/70">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 bg-surface/40 text-fg">
                <th className="px-3 py-2.5 font-medium">Hành</th>
                <th className="px-3 py-2.5 font-medium">Vai trò thường hợp</th>
                <th className="px-3 py-2.5 font-medium">Điểm mạnh khi giao đúng việc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {BANG_5_HANH.map((r) => (
                <tr key={r[0]}>
                  <td className="px-3 py-2.5 font-medium text-fg">{r[0]}</td>
                  <td className="px-3 py-2.5">{r[1]}</td>
                  <td className="px-3 py-2.5">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-2xl text-fg">2 phút so với bài test tính cách DISC / MBTI 60 câu</h2>
        <p className="mt-2 leading-relaxed">
          Nhiều quản lý muốn dùng DISC hoặc MBTI để hiểu đội ngũ nhưng ngại bắt nhân sự làm bài trắc nghiệm dài. Hai cách nhìn có thể bổ trợ cho nhau theo những điểm khác biệt sau:
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line/70">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 bg-surface/40 text-fg">
                <th className="px-3 py-2.5 font-medium">Tiêu chí</th>
                <th className="px-3 py-2.5 font-medium">Bản đồ 5 hành (Hiểu Bản Thân)</th>
                <th className="px-3 py-2.5 font-medium">Test tính cách truyền thống (DISC / MBTI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {SO_SANH_DISC.map((r) => (
                <tr key={r[0]}>
                  <td className="px-3 py-2.5 font-medium text-fg">{r[0]}</td>
                  <td className="px-3 py-2.5 text-fg">{r[1]}</td>
                  <td className="px-3 py-2.5">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-2xl text-fg">4 tình huống quản lý nhân viên đau đầu & cách mở lời mẫu</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TINH_HUONG_SEP.map((t) => (
            <article key={t.van_de} className="rounded-xl border border-line/60 bg-surface/30 p-4">
              <h3 className="text-base font-medium text-fg">{t.van_de}</h3>
              <p className="mt-2 text-sm leading-relaxed"><strong className="text-fg">Góc nhìn 5 hành:</strong> {t.goc_re}</p>
              <p className="mt-2 text-sm leading-relaxed"><strong className="text-gold">Gợi ý mở lời:</strong> {t.mo_loi}</p>
            </article>
          ))}
        </div>

        <h3 className="mt-10 text-xl text-fg">Câu hỏi thường gặp về quản lý nhân sự</h3>
        <dl className="mt-3 space-y-4">
          {HOI_DAP_NHAN_SU.map((h) => (
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
