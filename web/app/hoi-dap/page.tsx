// GĐ 3 — Thư viện Tình huống Hỏi–Đáp Đa Hệ Thống (/hoi-dap).
// Minh bạch: tình huống minh hoạ tổng hợp do Ban biên tập Hiểu Bản Thân xây dựng, Zero-PII, chuẩn NĐ 38/2021.
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang } from "@/lib/seo";
import { TINH_HUONG_HOI_DAP } from "@/lib/hoi-dap-mau";
import { DanhSachHoiDap } from "./DanhSachHoiDap";

const DUONG = "/hoi-dap";

export const metadata: Metadata = metaTrang({
  tieuDe: "Hỏi – Đáp tình huống đời sống đa hệ thống",
  moTa: "12 tình huống minh hoạ tổng hợp về công việc, tài chính, gia đình, nhà cửa và nhịp năm 2027 — đối chiếu Tử vi, Bát tự, Thần số học, Phong thuỷ và Kinh Dịch theo tinh thần thực tế.",
  duong: DUONG,
});

export default function HoiDapPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <JsonLd
        data={goiLd(
          ldTrangWeb({
            duong: DUONG,
            ten: "Hỏi – Đáp tình huống đời sống đa hệ thống",
            tomTat: "Kho tình huống minh hoạ tổng hợp đối chiếu Tử vi, Bát tự, Thần số học, Phong thuỷ và Kinh Dịch.",
            about: ["Hỏi đáp Tử vi", "Hỏi đáp Bát tự", "Thần số học", "Phong thuỷ nhà ở", "Kinh Dịch"],
          }),
          ldDuongDan([
            { ten: "Trang chủ", duong: "/" },
            { ten: "Hỏi – Đáp tình huống", duong: DUONG },
          ]),
        )}
      />

      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Thư viện tình huống · Đa hệ thống</p>
        <h1 className="font-serif text-3xl font-semibold text-fg sm:text-4xl">
          Hỏi – Đáp tình huống đời sống
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-fg-muted sm:text-base">
          Các tình huống minh hoạ tổng hợp từ những câu hỏi thường gặp nhất về công việc, tiền bạc, gia đình, nhà cửa và chọn thời điểm — trình bày rõ cách đối chiếu nhiều hệ thống để ra quyết định thực tế.
        </p>
      </header>

      <DanhSachHoiDap ds={TINH_HUONG_HOI_DAP} />

      <section className="rounded-2xl border border-line/60 bg-bg-2/30 p-4 text-xs leading-relaxed text-fg-muted">
        <b className="text-fg">Ghi chú minh bạch:</b> Mọi mục trên trang này là <i>tình huống minh hoạ tổng hợp</i> do Ban biên tập Hiểu Bản Thân biên soạn (không dùng tên hay dữ liệu cá nhân của bất kỳ khách hàng nào). Nội dung mang tính văn hoá tham khảo và tự soi, không thay thế tư vấn y tế, pháp lý hay đầu tư tài chính.
      </section>
    </div>
  );
}
