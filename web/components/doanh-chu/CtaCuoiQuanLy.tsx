// QLNS-2 — khối cuối trang /quan-ly-nhan-su: (1) lời mời chạy bản đồ ngay (cuộn lên công cụ, mở lịch 12 tháng),
// (2) lưới lối đi tiếp sang các trang trụ liên quan — chữ link đúng từ khoá trang đích, đo bằng DoKhoiCuoi như các khối cuối
// trang khác (CTA-2), (3) bài viết liên quan nếu có. Máy chủ hoàn toàn: HTML có đủ link cho máy tìm kiếm, không chờ JS.
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { DoKhoiCuoi } from "@/components/khung/DoKhoiCuoi";
import { TheLap } from "@/components/khung/TheLap";
import { lienKetQuanLy } from "@/lib/quan-ly-lien-ket";
import { lopOCuoi } from "@/lib/the-lap";
import { namTuoiSeo } from "@/lib/nam";

export async function CtaCuoiQuanLy({ duong }: { duong: string }) {
  const the = lienKetQuanLy(await namTuoiSeo());
  return (
    <>
      <section aria-labelledby="di-tiep-quan-ly" className="mx-auto mt-14 max-w-5xl" data-testid="cta-cuoi-quan-ly">
        <DoKhoiCuoi khoi="quan_ly_nhan_su" />
        <div className="rounded-3xl border border-gold/35 bg-gold/[0.06] p-6 sm:p-8" data-testid="cta-chay-ban-do">
          <h2 className="font-serif text-2xl text-fg sm:text-3xl">Chạy bản đồ cho nhóm của bạn trong hai phút</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-fg-muted">
            Nhập ngày sinh của 1–8 người (hoặc gửi link để từng người tự điền), rồi xem 5 hành của cả nhóm, thẻ phối hợp từng
            người và kế hoạch 30 ngày. Miễn phí, không cần tài khoản, ngày sinh không được lưu.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#cong-cu-dieu-hanh"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-gold px-5 py-2.5 font-medium text-bg hover:opacity-90">
              Chạy bản đồ cho nhóm của tôi <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href="#lich-12-thang"
              className="inline-flex min-h-11 items-center rounded-2xl border border-gold/50 px-5 py-2.5 text-fg hover:border-gold">
              Xem lịch 12 tháng của cả đội
            </a>
          </div>
        </div>

        <nav aria-labelledby="di-tiep-quan-ly" className="mt-12">
          <h2 id="di-tiep-quan-ly" className="font-serif text-2xl text-fg">Đi tiếp: xem sâu từng người và từng thời điểm</h2>
          <p className="mt-2 max-w-3xl text-fg-muted">
            Bản đồ đội ngũ cho một khung chung. Mỗi công cụ dưới đây đào sâu một góc; phần cơ bản đều xem miễn phí.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {the.map((t, i) => <TheLap key={t.duong} t={t} kieu="chu" className={lopOCuoi(i, the.length)} />)}
          </ul>
        </nav>
      </section>
      {/* Bài về hợp tác / đồng nghiệp (mảng Hợp đôi) — chưa có bài hoặc CMS tắt → khối tự ẩn. */}
      <Suspense fallback={null}>
        <BaiLienQuanMang mang="hop_doi" tieuDe="Bài viết về hợp tác và đồng nghiệp" className="mt-14" boQua={[duong, ...the.map((t) => t.duong)]} duong={duong} />
      </Suspense>
    </>
  );
}
