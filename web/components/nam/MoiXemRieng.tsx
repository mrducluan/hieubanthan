"use client";
// CTA-NAM (2026-11-16, chủ dự án yêu cầu) — khối mời cuối các trang "Năm {năm}" (/nam/{năm}, sinh con, cưới hỏi, Tử vi theo
// tuổi) và /lich-am/{năm}: các trang này tính theo NĂM SINH nên ai cùng tuổi cũng đọc như nhau → mời nhập ngày giờ sinh
// ngay tại chỗ (form hồ sơ dùng chung, lưu trên máy) rồi đưa sang lá số Tử vi; đã có hồ sơ thì hiện thẳng các lối đi.
// Bốn lối đi chọn theo nội dung trang (LOI_DI). Khâu THU HÚT → công cụ, đo `cross_cta_viewed` / `cross_cta_clicked`
// {tu: "nam_<trang>", den, ca_nhan} + `profile_created` (NhapHoSo ghi). Chỉ bản Việt (bản Anh chưa mở đủ các mảng này).
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarHeart, Compass, HeartHandshake, Orbit, ScanFace, Sparkles, Sun, Users, type LucideIcon } from "lucide-react";
import Link from "@/components/khung/Lien";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { ghi } from "@/lib/do-luong";
import { tenGoi, useHoSo } from "@/lib/hoso";
import { useNgonNgu } from "@/components/khung/NgonNgu";

export type TrangNam = "nam" | "sinh_con" | "cuoi_hoi" | "tuoi" | "lich_am";
type LoiDi = { ma: string; href: string; ten: string; mo_ta: string; Icon: LucideIcon };

const TU_VI = (nam: number): LoiDi => ({ ma: "tu_vi", href: "/tu-vi", ten: "Lá số Tử vi", Icon: Orbit,
  mo_ta: `12 cung đời bạn, mười năm đang đi và năm ${nam} rơi vào cung nào.` });
const BAT_TU: LoiDi = { ma: "bat_tu", href: "/bat-tu", ten: "Lá số Bát tự", Icon: Sun,
  mo_ta: "Mệnh bạn thừa hành gì, thiếu hành gì, giai đoạn nào thuận." };
const THOI_GIAN = (nam: number): LoiDi => ({ ma: "thoi_gian", href: `/thoi-gian-toi?nam=${nam}`, ten: `Năm ${nam} của riêng bạn`, Icon: Sparkles,
  mo_ta: "Từng tháng trong năm: tháng nên dồn sức, tháng nên đi chậm." });
const PHONG_THUY: LoiDi = { ma: "phong_thuy", href: "/phong-thuy", ten: "Phong thuỷ nhà bạn", Icon: Compass,
  mo_ta: "Hướng hợp tuổi, chỗ kê giường, bàn làm việc trong nhà đang ở." };
const NHAN_TUONG: LoiDi = { ma: "nhan_tuong", href: "/nhan-tuong", ten: "Xem tướng mặt", Icon: ScanFace,
  mo_ta: "Năm nay sách tướng nhìn vào đâu trên gương mặt bạn." };
const HOP_DOI: LoiDi = { ma: "hop_doi", href: "/hop-doi", ten: "Xem hợp đôi", Icon: HeartHandshake,
  mo_ta: "Hai ngày sinh đặt cạnh nhau: chỗ hợp, chỗ cần nhường." };
const HAI_NGUOI: LoiDi = { ma: "hai_nguoi", href: "/tu-vi#hop-tham", ten: "Lá số hai người", Icon: Users,
  mo_ta: "Tử vi của hai bạn nhìn nhau thế nào, có điểm tham khảo." };
const NHA_MINH = (nam: number): LoiDi => ({ ma: "gia_dinh", href: "/gia-dinh", ten: `Năm ${nam} của cả nhà`, Icon: Users,
  mo_ta: "Thêm người nhà: ai năm tuổi, Tam tai, tuổi ai hợp ai." });
const NGAY_TOT: LoiDi = { ma: "ngay_tot", href: "/xem-ngay-tot", ten: "Chọn ngày cho cả nhà", Icon: CalendarHeart,
  mo_ta: "Ngày hợp việc, không xung tuổi cô dâu, chú rể, bố mẹ." };

/** Lối đi theo nội dung trang — lối đầu là nơi form đưa tới sau khi nhập. */
const LOI_DI: Record<TrangNam, (nam: number) => LoiDi[]> = {
  nam: (n) => [TU_VI(n), BAT_TU, THOI_GIAN(n), NHA_MINH(n)],
  tuoi: (n) => [TU_VI(n), BAT_TU, THOI_GIAN(n), NHAN_TUONG],
  sinh_con: (n) => [TU_VI(n), BAT_TU, HOP_DOI, NHA_MINH(n)],
  cuoi_hoi: (n) => [TU_VI(n), HAI_NGUOI, NHA_MINH(n), NGAY_TOT],
  lich_am: (n) => [TU_VI(n), BAT_TU, THOI_GIAN(n), NGAY_TOT],
};
const CHU: Record<TrangNam, { tieu_de: (nam: number) => string; cau: string }> = {
  nam: { tieu_de: (n) => `Năm ${n} với riêng bạn thì sao?`,
    cau: "Trang này nói về năm chung cho mọi người. Hai người cùng tuổi vẫn có hai lá số khác nhau, vì còn ngày và giờ sinh." },
  tuoi: { tieu_de: () => "Cùng tuổi, nhưng không cùng lá số",
    cau: "Phần trên đúng cho mọi người cùng năm sinh. Thêm ngày và giờ sinh, bạn có lá số của riêng mình." },
  sinh_con: { tieu_de: () => "Tuổi hợp mới là một nét. Lá số của bố mẹ nói kỹ hơn",
    cau: "Bảng trên chỉ so năm sinh. Lá số theo ngày giờ sinh cho bạn xem kỹ chuyện con cái, gia đình và những năm nên chú ý." },
  cuoi_hoi: { tieu_de: () => "Hai bạn hợp nhau ở điểm nào?",
    cau: "Tuổi cưới chỉ xét năm sinh cô dâu. Lá số theo ngày giờ sinh cho bạn xem chuyện tình cảm, gia đình của chính mình và của hai người." },
  lich_am: { tieu_de: (n) => `Xem năm ${n} theo ngày giờ sinh của bạn`,
    cau: "Lịch là của chung. Lá số theo ngày giờ sinh cho biết năm này với riêng bạn nên chú ý điều gì." },
};

export function MoiXemRieng({ trang, nam, className }: { trang: TrangNam; nam: number; className?: string }) {
  const en = useNgonNgu().ngonNgu === "en";
  const hoSo = useHoSo();
  const router = useRouter();
  const ref = useRef<HTMLHeadingElement>(null);
  const daGhi = useRef(false);
  const tu = `nam_${trang}`;
  useEffect(() => {
    const el = ref.current;
    if (!el || daGhi.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((ds) => {
      if (ds.some((d) => d.isIntersecting) && !daGhi.current) { daGhi.current = true; ghi("cross_cta_viewed", { tu, ca_nhan: hoSo ? 1 : 0 }); io.disconnect(); }
    }, { threshold: 1 });
    io.observe(el);
    return () => io.disconnect();
  }, [tu, hoSo]);
  if (en) return null;
  const loi = LOI_DI[trang](nam), chinh = loi[0]!, chu = CHU[trang];
  const bam = (den: string) => ghi("cross_cta_clicked", { tu, den, ca_nhan: hoSo ? 1 : 0 });
  const the = (x: LoiDi) => (
    <li key={x.ma}>
      <Link href={x.href} onClick={() => bam(x.ma)}
        className="group flex h-full min-h-[4.5rem] items-start gap-3 rounded-xl border border-line/70 bg-bg/40 p-3 transition-colors hover:border-gold/50">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/[0.07] text-gold"><x.Icon className="size-4" aria-hidden /></span>
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-sm font-medium text-fg">{x.ten}<ArrowRight className="size-3.5 text-gold opacity-0 transition-opacity group-hover:opacity-100" aria-hidden /></span>
          <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{x.mo_ta}</span>
        </span>
      </Link>
    </li>
  );
  return (
    <section aria-labelledby="moi-xem-rieng" data-testid="moi-xem-rieng" data-nosnippet=""
      className={`relative overflow-hidden rounded-3xl border border-gold/45 bg-gradient-to-br from-gold/[0.09] via-surface/70 to-bg/40 p-5 shadow-[0_0_60px_-24px_rgb(var(--gold)/0.55)] sm:p-7 ${className ?? ""}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="relative">
        <p className="eyebrow !text-gold">Của riêng bạn · miễn phí</p>
        <h2 id="moi-xem-rieng" ref={ref} className="mt-2 font-serif text-2xl leading-tight sm:text-[1.75rem]">{chu.tieu_de(nam)}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">{chu.cau}</p>

        {hoSo === undefined ? <div className="mt-5 h-40 animate-pulse rounded-2xl bg-surface/50" aria-hidden />
          : hoSo ? (
            <div className="mt-5" data-testid="moi-xem-rieng-co-ho-so">
              <p className="text-sm text-fg-muted">Hồ sơ của <b className="text-fg">{tenGoi(hoSo)}</b> đã có trên máy này. Chọn một lối để xem:</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">{loi.map(the)}</ul>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
              <div className="rounded-2xl border border-line/70 bg-bg/70 p-4 shadow-card sm:p-5">
                <p className="mb-3 font-serif text-lg">Nhập một lần, xem được mọi mảng</p>
                <NhapHoSo can="day_du" nutGui="Lập lá số của tôi"
                  onXong={() => { ghi("cross_cta_clicked", { tu, den: chinh.ma, ca_nhan: 0, kind: "form" }); router.push(chinh.href); }} />
              </div>
              <div>
                <p className="eyebrow">Nhập xong bạn xem được</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{loi.map(the)}</ul>
              </div>
            </div>
          )}
        <p className="mt-4 text-xs leading-relaxed text-fg-faint">Lời đọc là tham khảo văn hoá, không phải lời tiên đoán.</p>
      </div>
    </section>
  );
}
