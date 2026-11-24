// CG-2 (chủ dự án duyệt 25/11/2026) — trang mời chuyên gia cộng tác (/hop-tac-chuyen-gia). Theo docs/KE-HOACH-CHUYEN-GIA.md:
// không phí tham gia, không hoa hồng nhiều tầng (CG-1), không hứa thu nhập; tiền câu hỏi khách trả bằng VND, chia theo
// hợp đồng. Không trích dẫn số nghị định trên trang (điều khoản pháp lý nằm trong hợp đồng do luật sư soạn).
// Khung minh hoạ chỉ có TÊN ô (không số liệu lá số giả — lá số mẫu sai còn tệ hơn không có).
// noindex: trang tuyển, không cần thu hút tìm kiếm; lối vào ở /tac-gia.
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
    tieuDe: "Cộng tác chuyên gia Tử vi, Bát tự, Phong thuỷ",
    moTa: "Mời người làm nghề nghiêm túc cộng tác với Hiểu Bản Thân: máy dựng sẵn số liệu lá số, bạn viết lời khuyên và đứng tên. Không phí tham gia, trả bằng VND theo hợp đồng.",
    duong: DUONG,
  }),
  robots: { index: false, follow: true },
};

const LO_TRINH = [
  { bac: "Bước 1 · Viết bài", dieuKien: "Đăng ký, đồng ý quy tắc nội dung", quyenLoi: "Tài khoản viết bài trong CMS, có bộ kiểm nội dung trước khi gửi; bài xuất bản ghi tên bạn." },
  { bac: "Bước 2 · Thẩm định", dieuKien: "Có bài đạt chuẩn, không vi phạm ranh giới", quyenLoi: "Trang hồ sơ riêng ở mục Đội ngũ; ký tên thẩm định và viết khung \"Góc nhìn chuyên gia\" trên trang bạn đã đọc." },
  { bac: "Bước 3 · Trả lời câu hỏi trả phí", dieuKien: "Xác minh danh tính, trao đổi chuyên môn, ký hợp đồng cộng tác", quyenLoi: "Nhận câu hỏi khách trả bằng VND, dùng bảng số liệu dựng sẵn, được chia tiền theo hợp đồng." },
];

const RANH_GIOI = [
  "Không phán định mệnh; không đoán tuổi thọ, bệnh, sống chết, số lô đề; không chọn người tuyển dụng theo lá số.",
  "Không bán bùa, trấn yểm hay vật phẩm \"hoá giải\". Lời khuyên là việc làm cụ thể, tham khảo văn hoá.",
  "Khách trả bằng VND qua Hiểu Bản Thân; Sao (điểm trong ứng dụng) không đổi ra tiền. Tiền cộng tác trả theo hợp đồng, có khấu trừ thuế thu nhập theo quy định.",
  "Không phí tham gia, không hoa hồng nhiều tầng, không hứa mức thu nhập.",
  "Chỉ thấy hồ sơ của người hỏi khi họ tự tích đồng ý cho câu hỏi đó; ảnh chụp hồ sơ tự xoá sau khi trả lời 30 ngày.",
];

/** Khung minh hoạ bảng số liệu chuyên gia thấy — chỉ tên ô, không số liệu. */
const O_MAU = [
  { ten: "Mảng chính · Tử vi", o: ["Cung Mệnh, Cục", "Chính tinh và độ sáng", "Giờ sinh chắc hay ước chừng"] },
  { ten: "Nhìn thêm · Bát tự", o: ["Nhật chủ, sức tự thân", "Hành cần thêm (hai cách)", "Đại vận đang đi"] },
  { ten: "Nhìn thêm · Thần số", o: ["Đường đời, Sứ mệnh", "Năm cá nhân", "Tháng cá nhân"] },
];

export default function HopTacChuyenGiaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "Cộng tác chuyên gia — Hiểu Bản Thân", about: ["Tử vi", "Bát tự", "Phong thuỷ"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Đội ngũ", duong: "/tac-gia" }, { ten: "Cộng tác chuyên gia", duong: DUONG }]),
      )} />

      <section className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Cộng tác chuyên gia · Không phí tham gia</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-fg sm:text-4xl">
          Máy dựng sẵn số liệu, bạn viết lời khuyên và đứng tên
        </h1>
        <p className="max-w-2xl text-base text-fg-muted">
          Hiểu Bản Thân tính lá số Tử vi, Bát tự, Thần số, quẻ Kinh Dịch và phong thuỷ bằng phép tính cố định, có nguồn sách. Phần
          máy không làm được là đọc hoàn cảnh riêng của một người và khuyên cho đúng. Đó là phần chúng tôi mời người làm nghề cùng làm.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button asChild size="lg">
            <Link href="/lien-he">Gửi lời giới thiệu <ArrowRight className="size-4" aria-hidden /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tac-gia">Xem đội ngũ và quy trình thẩm định</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-fg">
          <Calculator className="size-5 text-gold" aria-hidden /> Chuyên gia thấy gì khi nhận một câu hỏi
        </h2>
        <p className="text-sm text-fg-muted">
          Người hỏi tích đồng ý chia sẻ hồ sơ thì bạn bấm một nút là có bảng số liệu của mảng chính và hai mảng nhìn thêm. Bạn đọc,
          rồi tự viết câu trả lời theo ba phần: điều lá số cho thấy, việc nên làm, điều nên để ý.
        </p>
        <Card className="space-y-4 border-gold/25 bg-bg-2/40" data-testid="demo-copilot">
          <p className="border-b border-line/60 pb-3 text-xs text-fg-muted">Khung minh hoạ (chỉ tên ô, không phải lá số của ai)</p>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            {O_MAU.map((k) => (
              <div key={k.ten} className="rounded-xl border border-line/60 p-3">
                <p className="text-xs font-medium text-gold">{k.ten}</p>
                <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
                  {k.o.map((o) => <li key={o}>• {o}: <span className="text-fg-faint">…</span></li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="rounded-xl border border-line/60 bg-bg/60 p-3 text-xs text-fg-muted">
            Trước khi gửi, câu trả lời đi qua bộ kiểm: không tên bệnh, không phán, không số điện thoại hay đường dẫn, không còn chỗ trống chưa viết.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="space-y-2">
          <BookOpenCheck className="size-5 text-gold" aria-hidden />
          <h3 className="font-serif text-lg font-medium text-fg">Đứng tên thật</h3>
          <p className="text-sm text-fg-muted">Trang hồ sơ công khai ở mục Đội ngũ; tên bạn chỉ xuất hiện trên bài bạn đã viết hoặc đã đọc và duyệt.</p>
        </Card>
        <Card className="space-y-2">
          <Users className="size-5 text-gold" aria-hidden />
          <h3 className="font-serif text-lg font-medium text-fg">Nhóm đầu tiên</h3>
          <p className="text-sm text-fg-muted">
            5–10 chuyên gia đầu tiên mỗi mảng được ưu tiên nhận câu hỏi, cùng góp ý công cụ, và nhận tới 80% tiền câu hỏi mình trả lời
            (sau phí thanh toán), ghi trong hợp đồng.
          </p>
        </Card>
        <Card className="space-y-2">
          <ShieldCheck className="size-5 text-gold" aria-hidden />
          <h3 className="font-serif text-lg font-medium text-fg">Kiểm trước khi gửi</h3>
          <p className="text-sm text-fg-muted">Bộ kiểm chặn những câu dễ gây hiểu lầm, giữ uy tín của bạn và của khách.</p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-fg">Ba bước cộng tác</h2>
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
          <Scale className="size-5 text-gold" aria-hidden /> Ranh giới khi làm nghề cùng chúng tôi
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
          <h2 className="font-serif text-xl font-semibold text-fg">Bạn làm nghề nghiêm túc về Tử vi, Bát tự, Phong thuỷ, Kinh Dịch hoặc Thần số?</h2>
          <p className="text-sm text-fg-muted">Gửi vài dòng giới thiệu: mảng bạn theo, số năm, đường dẫn bài viết hoặc kênh công khai.</p>
        </div>
        <Button asChild>
          <Link href="/lien-he">Liên hệ <ArrowRight className="size-4" aria-hidden /></Link>
        </Button>
      </section>
    </div>
  );
}
