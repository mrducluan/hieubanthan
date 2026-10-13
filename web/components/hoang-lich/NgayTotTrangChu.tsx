// HL-1 — khối nổi bật thứ hai ở trang chủ (ngay dưới hồ sơ thần số): hoàng lịch hôm nay dựng sẵn ở máy chủ.
// Phần "tuổi bạn" chạy ở trình duyệt từ hồ sơ trên máy (TuoiHomNay).
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { homNayVN, ngayTotCongKhai } from "@/lib/hoang-lich";
import { TuoiHomNay } from "./TuoiHomNay";
import { VongGio } from "./VongGio";

export async function NgayTotTrangChu({ className = "" }: { className?: string }) {
  const iso = homNayVN();
  const d = await ngayTotCongKhai(iso);
  if (!d) return null;
  return (
    <section aria-labelledby="ngay-tot-hom-nay" className={`bau-troi p-5 sm:p-7 ${className}`} data-testid="ngay-tot-trang-chu">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2"><CalendarDays className="size-3.5 text-gold" aria-hidden /> Hoàng lịch hôm nay</p>
          <h2 id="ngay-tot-hom-nay" className="mt-2 text-2xl sm:text-3xl">Hôm nay {d.ngay.split("-").reverse().slice(0, 2).join("/")} có phải ngày tốt?</h2>
          <p className="mt-1 text-sm text-fg-muted">{d.thu} · âm lịch {d.am.chu} · ngày {d.can_chi.ngay}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${d.hoang_dao ? "nhan-sang bg-gold/15 text-gold" : "border border-moon/50 bg-moon/10 text-moon"}`}>
          {d.hoang_dao ? "Hoàng đạo" : "Hắc đạo"} · {d.than.ten}
        </span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3 text-sm">
          <p><span className="text-fg-muted">Trực</span> <b>{d.truc.ten}</b> — {d.truc.y}; hợp {d.truc.hop}.</p>
          <p><span className="text-jade">Nên:</span> {d.nghi.slice(0, 5).map((x) => x.ten).join(", ") || "sách không ghi riêng"}</p>
          <p><span className="text-cinnabar">Kiêng:</span> {d.ky.slice(0, 4).map((x) => x.ten).join(", ") || "sách không ghi riêng"}</p>
          <p className="text-fg-muted">Xung tuổi {d.xung_tuoi.ten}{d.ky_dan_gian.length ? ` · ${d.ky_dan_gian.map((k) => k.ten).join(", ")}` : ""}</p>
          <TuoiHomNay iso={iso} />
        </div>
        <div className="grid grid-cols-[8.5rem_1fr] items-center gap-3 md:grid-cols-1 md:justify-items-center">
          <VongGio gio={d.gio} laHomNay tieuDe={d.than.ten} phuDe="GIỜ TỐT" className="w-full max-w-[13rem]" />
          <div className="md:w-full">
            <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted"><Clock className="size-4 text-gold" aria-hidden />Giờ hoàng đạo</p>
            <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {d.gio_hoang_dao.map((g) => (
                <li key={g.chi} className="rounded-lg border border-gold/30 bg-bg/40 px-2 py-1 text-center text-sm"><b className="text-gold">{g.chi}</b>
                  <span className="block text-[0.7rem] text-fg-muted">{g.khung}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Link href="/xem-ngay-tot" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-gold hover:underline">
        Xem đầy đủ & tìm ngày đẹp cho việc của bạn <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
