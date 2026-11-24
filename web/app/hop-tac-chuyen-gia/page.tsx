// GĐ 2 — Trang tuyển Founding Masters & Hợp tác chuyên gia (/hop-tac-chuyen-gia).
// Khớp docs/KE-HOACH-CHUYEN-GIA.md (CG-1) & kiểm toán pháp lý 11/2026:
//   - 0đ phí tham gia, KHÔNG đa cấp (không hoa hồng nhiều tầng), KHÔNG hứa thu nhập cố định;
//   - Tách bạch Sao (credit nội bộ) và tiền chuyên gia (hieuban.com thu VND trực tiếp → chi trả thù lao CTV + khấu trừ thuế);
//   - Minh hoạ thật cơ chế Co-Pilot 80/20 (Bệnh án Đa Hệ Thống 1 trang + bộ kiểm ranh giới nội dung);
//   - Xác thực danh tính (Luật TMĐT 122/2025) & ranh giới không mê tín (NĐ 38/2021).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { ArrowRight, BookOpenCheck, Calculator, CheckCircle2, Scale, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang } from "@/lib/seo";

const DUONG = "/hop-tac-chuyen-gia";

export const metadata: Metadata = {
  ...metaTrang({
    tieuDe: "Hợp tác Chuyên gia (Founding Masters) — Trợ lý tính toán 5 tầng & Hồ sơ E-E-A-T",
    moTa: "Đồng hành cùng Hiểu Bản Thân: hệ thống tính toán 5 tầng dựng sẵn hồ sơ đa mảng (Tử vi, Bát tự, Thần số, Phong thuỷ), chuyên gia tập trung 20% lời khuyên cốt lõi. 0đ phí tham gia.",
    duong: DUONG,
  }),
  // Giữ noindex cho tới khi chủ dự án duyệt nội dung & luật sư xác nhận khung hợp tác.
  robots: { index: false, follow: false },
};

const LO_TRINH = [
  { bac: "Bậc 1 · Cộng tác viên nội dung", dieuKien: "Đăng ký + đồng ý quy tắc nội dung", quyenLoi: "Tài khoản CMS có bộ kiểm 30 luật SEO/GEO; bài xuất bản ghi tên tác giả + Sao thưởng nội bộ." },
  { bac: "Bậc 2 · Chuyên gia thẩm định", dieuKien: "≥ 5 bài đạt chuẩn, không vi phạm ranh giới", quyenLoi: "Trang hồ sơ riêng chuẩn Knowledge Graph (/tac-gia/<tên>), ký tên thẩm định & Góc nhìn chuyên gia (GN-1)." },
  { bac: "Bậc 3 · Founding Master / Xác minh", dieuKien: "Xác thực danh tính + phỏng vấn chuyên môn + hợp đồng CTV", quyenLoi: "Huy hiệu Đã xác minh, dùng Trợ lý Hồ sơ Đa Mảng (Co-Pilot), nhận câu hỏi trả phí bằng VND và chia sẻ thù lao theo hợp đồng." },
];

const RANH_GIOI = [
  "Không phán định mệnh, không dự báo tuổi thọ, bệnh tật, sống chết, xổ số hay tuyển dụng thay người khác.",
  "Không bán bùa chú, trấn yểm hay vật phẩm \"hoá giải\" — định vị tham khảo văn hoá và phát triển bản thân (lưu ý NĐ 38/2021).",
  "Thu phí trực tiếp bằng VND qua Hiểu Bản Thân (không đổi Sao ra tiền theo NĐ 52/2024); chi trả thù lao CTV theo hợp đồng và khấu trừ thuế theo quy định hiện hành (NĐ 252/2026 — chi tiết xác nhận cùng luật sư/kế toán trước khi mở rộng).",
  "Không thu phí tham gia, không hoa hồng nhiều tầng, không hứa hẹn mức thu nhập cố định; xác thực danh tính chuyên gia theo Luật TMĐT 122/2025 (chi tiết áp dụng xác nhận cùng luật sư).",
  "Bảo vệ dữ liệu cá nhân (Luật 91/2025 + NĐ 356/2025): chỉ thấy hồ sơ khi người hỏi chủ động tích đồng ý cho từng câu, ảnh chụp tự xoá sau 30 ngày.",
];

export default function HopTacChuyenGiaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "Hợp tác Chuyên gia — Hiểu Bản Thân", about: ["Hợp tác chuyên gia", "Founding Masters", "Tử vi", "Bát tự", "Phong thuỷ"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Đội ngũ", duong: "/tac-gia" }, { ten: "Hợp tác chuyên gia", duong: DUONG }]),
      )} />

      <section className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Chương trình Founding Masters · 0đ phí tham gia</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-fg sm:text-4xl">
          Hệ thống lo 80% tính toán & dữ liệu — Chuyên gia tập trung 20% trải nghiệm cốt lõi
        </h1>
        <p className="max-w-2xl text-base text-fg-muted">
          Hiểu Bản Thân không dùng AI để thay thế người làm nghề. Chúng tôi xây bộ máy tính toán tất định 5 tầng (Tử vi, Bát tự, Thần số, Kinh Dịch, Phong thuỷ, Kỳ Môn) để dọn sẵn hồ sơ đa mảng — giúp chuyên gia tiết kiệm thời gian tra cứu và xây dựng uy tín học thuật bền vững.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button asChild size="lg">
            <Link href="/lien-he">
              Đăng ký trao đổi Founding Master <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tac-gia">Xem đội ngũ & quy trình thẩm định</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-fg">
          <Calculator className="size-5 text-gold" aria-hidden />
          Minh hoạ Trợ lý Hồ sơ Đa Mảng (Co-Pilot 80/20)
        </h2>
        <p className="text-sm text-fg-muted">
          Khi người dùng đặt câu hỏi và chủ động đồng ý chia sẻ hồ sơ, bảng điều khiển chuyên gia dựng sẵn bản tóm tắt đa mảng trong 1 cú bấm — chuyên gia đọc 3 phút, biên tập lời khuyên trong 5 phút:
        </p>
        <Card className="space-y-4 border-gold/25 bg-bg-2/40" data-testid="demo-copilot">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3 text-xs text-fg-muted">
            <span>Mẫu minh hoạ (ẩn danh · 0 dữ liệu thật) · Mảng chính: <b className="text-fg">Tử vi</b></span>
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-gold">Tự động dựng từ Engine tất định</span>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-line/60 p-3">
              <p className="text-xs font-medium text-gold">Mảng chính · Tử vi</p>
              <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
                <li>• Mệnh tại Thìn · Thuỷ Nhị Cục</li>
                <li>• Chính tinh: Thiên Phủ (Miếu) · Vũ Khúc</li>
                <li>• Lưu ý giờ sinh: đã xác nhận chính xác</li>
              </ul>
            </div>
            <div className="rounded-xl border border-line/60 p-3">
              <p className="text-xs font-medium text-gold">Đối chiếu · Bát tự</p>
              <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
                <li>• Nhật chủ: Giáp Mộc (vượng vừa)</li>
                <li>• Điều hậu: ưu tiên Đinh Hoả · Canh Kim</li>
                <li>• Đại vận hiện tại: chuyển nhịp 10 năm</li>
              </ul>
            </div>
            <div className="rounded-xl border border-line/60 p-3">
              <p className="text-xs font-medium text-gold">Đối chiếu · Thần số</p>
              <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
                <li>• Đường đời 8 · Sứ mệnh 4</li>
                <li>• Năm cá nhân 1 (khởi đầu chu kỳ mới)</li>
                <li>• Hợp định hướng tái cấu trúc công việc</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl border border-line/60 bg-bg/60 p-3 text-xs text-fg-muted">
            <p className="font-medium text-fg">Khung trả lời 3 phần chuẩn hành nghề (chuyên gia tự viết & duyệt qua bộ kiểm ranh giới):</p>
            <p className="mt-1">1. Căn cứ từ lá số & đối chiếu đa hệ thống → 2. Gợi ý 2–3 việc nên làm → 3. Điều nên cẩn trọng (không phán định mệnh).</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="space-y-2">
          <BookOpenCheck className="size-5 text-gold" aria-hidden />
          <h3 className="font-serif text-lg font-medium text-fg">Thương hiệu học thuật thật</h3>
          <p className="text-sm text-fg-muted">
            Hồ sơ tác giả công khai chuẩn Schema Person (/tac-gia), gắn tên thật lên các bài thẩm định và khối Góc nhìn chuyên gia (GN-1).
          </p>
        </Card>
        <Card className="space-y-2">
          <Users className="size-5 text-gold" aria-hidden />
          <h3 className="font-serif text-lg font-medium text-fg">Ưu đãi Founding Masters</h3>
          <p className="text-sm text-fg-muted">
            Nhóm 5–10 chuyên gia đầu tiên theo mảng được ưu tiên phân bổ câu hỏi trả phí, chia sẻ thù lao CTV cao (80/20) và đồng thiết kế công cụ Co-Pilot.
          </p>
        </Card>
        <Card className="space-y-2">
          <ShieldCheck className="size-5 text-gold" aria-hidden />
          <h3 className="font-serif text-lg font-medium text-fg">Bộ kiểm an toàn 2 lớp</h3>
          <p className="text-sm text-fg-muted">
            Mọi câu trả lời đi qua kiểm tra ranh giới tự động ngay lúc soạn, bảo vệ uy tín cá nhân chuyên gia khỏi các cụm từ nhạy cảm hoặc hiểu lầm pháp lý.
          </p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-fg">Lộ trình hợp tác minh bạch</h2>
        <div className="grid gap-3">
          {LO_TRINH.map((m) => (
            <Card key={m.bac} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium text-gold">{m.bac}</h3>
                <span className="text-xs text-fg-muted">Điều kiện: {m.dieuKien}</span>
              </div>
              <p className="text-sm text-fg">{m.quyenLoi}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-line/70 bg-bg-2/30 p-5">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-fg">
          <Scale className="size-5 text-gold" aria-hidden />
          Cam kết ranh giới hành nghề & pháp lý 2026
        </h2>
        <ul className="space-y-2 text-sm text-fg-muted">
          {RANH_GIOI.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/[0.06] p-6">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-semibold text-fg">Bạn là người làm nghề nghiêm túc về Tử vi, Bát tự, Phong thuỷ, Kinh Dịch hoặc Thần số?</h2>
          <p className="text-sm text-fg-muted">Gửi lời nhắn giới thiệu ngắn (mảng chuyên môn + đường dẫn bài viết/kênh công khai) để đội ngũ trao đổi trực tiếp.</p>
        </div>
        <Button asChild>
          <Link href="/lien-he">Liên hệ ứng tuyển <ArrowRight className="size-4" aria-hidden /></Link>
        </Button>
      </section>
    </div>
  );
}
