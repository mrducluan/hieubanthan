"use client";
// CTA-LS — mời lập lá số Tử vi / Bát tự ngay trên trang (thay thẻ "Tạo hồ sơ" mở bảng trượt). Chọn trong 3 phương án:
// (A) nâng thẻ cũ vẫn bắt bấm mở bảng · (B) form ngay trên trang + xem trước thứ sẽ nhận · (C) lá số mẫu mờ làm mồi —
// chọn B: bớt một cú bấm, người đọc thấy đúng thứ mình sẽ nhận, không gọi engine thêm. Hình minh hoạ là hình tĩnh, có
// nhãn "Minh hoạ" — không phải lá số của ai. Chữ sửa được ở CMS (nhóm "Mời lập lá số" trong bảng chữ của trang).
import { useEffect, useRef, type ReactNode } from "react";
import { Check, Clock, MessageCircleQuestion } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { useChu } from "@/components/cms/DauCms";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { ghi } from "@/lib/do-luong";
import type { HoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

type MoDun = "tuvi" | "battu";

/** Còn thiếu gì để lập lá số (hồ sơ thần số chỉ có tên + ngày sinh). */
function conThieu(h: HoSo | null): string[] {
  if (!h) return [];
  return [
    !h.gio && "giờ sinh",
    !h.gioi_tinh && "giới tính",
    !h.noi_sinh && "nơi sinh",
  ].filter(Boolean) as string[];
}

export function MoiLapLaSo({ moDun, hoSo, sauForm }: { moDun: MoDun; hoSo: HoSo | null; sauForm?: ReactNode }) {
  const c = useChu();
  const ref = useRef<HTMLElement>(null);
  const daGhi = useRef(false);
  const thieu = conThieu(hoSo);
  // Đo: thấy khối → bấm gửi (profile_created do NhapHoSo ghi). Một lần mỗi lượt vào trang.
  useEffect(() => {
    const el = ref.current;
    if (!el || daGhi.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((ds) => {
      if (ds.some((d) => d.isIntersecting) && !daGhi.current) { daGhi.current = true; ghi("chart_interacted", { mo_dun: moDun, kind: "moi_lap_thay", co_ho_so: Boolean(hoSo) }); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [moDun, hoSo]);

  const tieuDe = hoSo && thieu.length
    ? c("moi.tieu_de_thieu", { so: String(thieu.length), thieu: thieu.join(", ") })
    : c("moi.tieu_de");
  const nhan = [1, 2, 3, 4].map((i) => c(`moi.nhan_${i}`)).filter(Boolean);

  return (
    <section ref={ref} aria-label={moDun === "tuvi" ? "Lập lá số Tử vi" : "Xem tứ trụ Bát tự"} data-testid="moi-lap-la-so"
      className="relative overflow-hidden rounded-3xl border border-gold/45 bg-gradient-to-br from-gold/[0.09] via-surface/70 to-bg/40 p-5 shadow-[0_0_60px_-24px_rgb(var(--gold)/0.55)] sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-6">
        <div className="lg:col-start-1">
          <p className="eyebrow text-gold">{c("moi.nhan_tren")}</p>
          <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-3xl"><ChuNhan chu={tieuDe} /></h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base">{c("moi.cau_phu")}</p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="rounded-2xl border border-line/70 bg-bg/70 p-4 shadow-card sm:p-5">
            <NhapHoSo macDinh={hoSo} can="day_du" nutGui={c("moi.nut")}
              onXong={() => ghi("chart_interacted", { mo_dun: moDun, kind: "moi_lap_gui", co_ho_so: Boolean(hoSo) })} />
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-fg-faint">
              <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />{c("moi.tran_an")}
            </p>
          </div>
          {sauForm}
        </div>

        <div className="space-y-5 lg:col-start-1 lg:row-start-2">
          {nhan.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-fg">{c("moi.nhan_tieu_de")}</p>
              <ul className="mt-2 space-y-2">
                {nhan.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-fg-muted sm:text-[0.95rem]">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden /><span><ChuNhan chu={t} lopNhan="text-fg" /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <figure className="hidden sm:block">
            {moDun === "tuvi" ? <MinhHoaTuVi /> : <MinhHoaBatTu />}
            <figcaption className="mt-1.5 text-xs text-fg-faint">{c("moi.minh_hoa")}</figcaption>
          </figure>
          <p className="flex items-start gap-1.5 text-xs text-fg-faint">
            <MessageCircleQuestion className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{c("moi.chua_san_sang")}{moDun === "tuvi" && <> <Link href="/tu-vi/la-so-mau" className="text-gold underline underline-offset-2">{c("moi.la_so_mau")}</Link></>}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// Hình minh hoạ tĩnh: khung 12 cung (vòng ngoài lưới 4×4), cung Mệnh sáng, tam phương nối tới hai cung tam hợp.
const CUNG = [
  // [cột, hàng, tên] — vòng 12 cung theo chiều kim đồng hồ từ góc dưới trái (Dần) như lá số in.
  [0, 3, "Mệnh"], [0, 2, "Phụ Mẫu"], [0, 1, "Phúc Đức"], [0, 0, "Điền Trạch"], [1, 0, "Quan Lộc"], [2, 0, "Nô Bộc"],
  [3, 0, "Thiên Di"], [3, 1, "Tật Ách"], [3, 2, "Tài Bạch"], [3, 3, "Tử Tức"], [2, 3, "Phu Thê"], [1, 3, "Huynh Đệ"],
] as const;

function MinhHoaTuVi() {
  const o = 58, w = 54, h = 40;
  const tam = (cot: number, hang: number) => [cot * o + w / 2 + 4, hang * (h + 4) + h / 2 + 4] as const;
  const [mx, my] = tam(0, 3), [qx, qy] = tam(1, 0), [tx, ty] = tam(3, 2);
  return (
    <svg viewBox="0 0 240 184" className="w-full max-w-sm" aria-hidden>
      {CUNG.map(([cot, hang, ten]) => {
        const menh = ten === "Mệnh", sang = ten === "Quan Lộc" || ten === "Tài Bạch";
        return (
          <g key={ten}>
            <rect x={cot * o + 4} y={hang * (h + 4) + 4} width={w} height={h} rx={6}
              className={cn(menh ? "fill-gold/20 stroke-gold" : sang ? "fill-gold/[0.07] stroke-gold/50" : "fill-surface/60 stroke-line")} strokeWidth={menh ? 1.4 : 0.8} />
            <text x={cot * o + 4 + w / 2} y={hang * (h + 4) + 4 + h / 2 + 3.5} textAnchor="middle"
              className={cn("text-[8.5px]", menh ? "fill-gold font-semibold" : "fill-fg-muted")}>{ten}</text>
          </g>
        );
      })}
      <polygon points={`${mx},${my} ${qx},${qy} ${tx},${ty}`} className="fill-gold/[0.06] stroke-gold/60" strokeWidth={0.8} strokeDasharray="3 2" />
      <rect x={64} y={72} width={112} height={38} rx={8} className="fill-bg/90" />
      <text x={120} y={86} textAnchor="middle" className="fill-fg font-serif text-[11px]">Lá số của bạn</text>
      <text x={120} y={102} textAnchor="middle" className="fill-fg-faint text-[8px]">12 cung · từng mảng đời</text>
    </svg>
  );
}

// Bốn trụ (dấu hỏi — chữ của bạn) + năm cột ngũ hành thừa / thiếu.
function MinhHoaBatTu() {
  const tru = ["Năm", "Tháng", "Ngày", "Giờ"];
  const hanh = [["Kim", 0.35], ["Mộc", 0.8], ["Thủy", 0.2], ["Hỏa", 0.55], ["Thổ", 0.65]] as const;
  return (
    <svg viewBox="0 0 260 130" className="w-full max-w-sm" aria-hidden>
      {tru.map((t, i) => (
        <g key={t}>
          <rect x={4 + i * 34} y={18} width={30} height={92} rx={6} className={cn(i === 2 ? "fill-gold/20 stroke-gold" : "fill-surface/60 stroke-line")} strokeWidth={i === 2 ? 1.4 : 0.8} />
          <text x={19 + i * 34} y={12} textAnchor="middle" className="fill-fg-faint text-[8px]">{t}</text>
          <text x={19 + i * 34} y={52} textAnchor="middle" className={cn("font-serif text-[16px]", i === 2 ? "fill-gold" : "fill-fg-muted")}>?</text>
          <text x={19 + i * 34} y={88} textAnchor="middle" className={cn("font-serif text-[16px]", i === 2 ? "fill-gold" : "fill-fg-muted")}>?</text>
        </g>
      ))}
      {hanh.map(([t, v], i) => (
        <g key={t}>
          <rect x={156 + i * 20} y={110 - v * 88} width={13} height={v * 88} rx={3} className={cn(v < 0.3 ? "fill-moon/50" : "fill-gold/60")} />
          <text x={162.5 + i * 20} y={124} textAnchor="middle" className="fill-fg-faint text-[7.5px]">{t}</text>
        </g>
      ))}
    </svg>
  );
}
