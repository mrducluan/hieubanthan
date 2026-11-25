"use client";
// TET-2027 — Hero Ấn phẩm Xuân Đinh Mùi 2027 ("Đêm Giao Thừa Thiên Hà Thủy") cho trang trụ /nam/2027.
// Tái sử dụng artwork /public/li-xi/ & vector SVG từ HoaTietTet.tsx (sạch CSP-2, 0 CDN, 0 Math.random SSR).
// Giữ nguyên <h1> chính xác và khối "Trả lời nhanh" mở 100% trong visible DOM cho chuẩn SEO/AEO 12 điểm.
import { useId, useState } from "react";
import Link from "@/components/khung/Lien";
import { Flower2, Gift, Sparkles } from "lucide-react";
import { ANH_NEN_GAM_EP_KIM } from "@/lib/li-xi-tet";
import { CanhHoaRoi, CanhHoaXuan, ConDauTrien, TextureGamCo } from "@/components/li-xi/HoaTietTet";

const MAU_LINH_VAT = [
  { ma: "ep_kim", ten: "Ép Kim 24K", nhan: "LINH VẬT ĐINH MÙI · ÉP KIM 24K", anh: "/li-xi/linh-vat-ep-kim.jpg" },
  { ma: "son_mai", ten: "Sơn Mài Thủy", nhan: "LINH VẬT SƠN MÀI · THIÊN HÀ THỦY", anh: "/li-xi/linh-vat-son-mai.jpg" },
  { ma: "thanh_lich", ten: "Thanh Lịch", nhan: "LINH VẬT ĐINH MÙI · THANH LỊCH", anh: "/li-xi/linh-vat-thanh-lich.jpg" },
] as const;

interface Props {
  hrefVeMuc: string;
  nhanVeMuc: string;
  nhanDuongDan: string;
  nhanTren: string;
  tieuDe: string;
  nhanTraLoiNhanh: string;
  traLoiNhanh: string;
  ngayTetHien: string;
  soNgayToiTet: number | null;
  hrefCaNhan: string | null;
  nhanCaNhan: string;
}

export function HeroTet2027({
  hrefVeMuc,
  nhanVeMuc,
  nhanDuongDan,
  nhanTren,
  tieuDe,
  nhanTraLoiNhanh,
  traLoiNhanh,
  ngayTetHien,
  soNgayToiTet,
  hrefCaNhan,
  nhanCaNhan,
}: Props) {
  const patId = useId();
  const [mauIdx, setMauIdx] = useState(0);
  const [hoaRoi, setHoaRoi] = useState(true);
  const linhVat = MAU_LINH_VAT[mauIdx] ?? MAU_LINH_VAT[0];

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-gold/40 p-5 shadow-card sm:p-7"
      style={{
        background:
          "radial-gradient(90% 80% at 12% 8%, rgba(158, 27, 34, 0.52), transparent 62%), radial-gradient(75% 65% at 92% 88%, rgba(111, 211, 181, 0.14), transparent 58%), radial-gradient(60% 60% at 82% 14%, rgba(233, 196, 106, 0.16), transparent 55%), linear-gradient(145deg, #270911 0%, #150c24 55%, #0d1226 100%)",
      }}
      data-testid="hero-tet-2027"
    >
      {/* Nền gấm đỏ son ép kim 24K hoà trộn tinh tế */}
      <img
        src={ANH_NEN_GAM_EP_KIM}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.15] mix-blend-luminosity"
      />
      {/* Vân gấm đồng xu cổ SVG */}
      <TextureGamCo id={`nam-hero-${patId}`} color="#eab64d" />
      {/* Khung viền kép ép kim mảnh */}
      <div className="pointer-events-none absolute inset-2 rounded-[20px] border border-gold/20" aria-hidden />
      {/* Cành hoa xuân trang trí nhẹ ở góc trên (ẩn bớt trên mobile nhỏ để thoáng) */}
      <CanhHoaXuan loai="mai" className="pointer-events-none absolute -left-3 -top-3 hidden size-28 opacity-45 sm:block" />
      <CanhHoaXuan loai="dao" className="pointer-events-none absolute -bottom-3 -right-3 hidden size-28 -scale-x-100 opacity-35 sm:block" />
      {/* Watermark chữ Hán Đinh Mùi (Noto Serif TC) */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-5 top-2 select-none text-7xl leading-none tracking-widest text-gold/[0.07] sm:text-8xl"
        style={{ fontFamily: "var(--font-han), serif" }}
      >
        丁未
      </span>
      {/* Cánh hoa rơi nhẹ — chỉ giới hạn trong khung Hero */}
      {hoaRoi && <CanhHoaRoi mau="#fde047" />}

      <div className="relative z-10 grid items-center gap-6 md:grid-cols-[1.35fr_0.85fr]">
        {/* Cột trái: Breadcrumb + Triện + H1 + Trả lời nhanh + CTA kép */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <nav aria-label={nhanDuongDan} className="text-sm text-fg-muted">
              <Link href={hrefVeMuc} className="hover:text-fg hover:underline">{nhanVeMuc}</Link>
            </nav>
            <button
              type="button"
              onClick={() => setHoaRoi((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-bg/50 px-2.5 py-1 text-[11px] text-fg-muted transition-colors hover:border-gold/60 hover:text-gold"
              aria-pressed={hoaRoi}
            >
              <Flower2 className="size-3 text-gold" aria-hidden />
              <span>Hoa rơi: {hoaRoi ? "Bật" : "Tắt"}</span>
            </button>
          </div>

          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <ConDauTrien />
            <p className="eyebrow text-gold">{nhanTren}</p>
            {soNgayToiTet !== null && soNgayToiTet > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-[#9e1b22]/45 px-2.5 py-0.5 text-[11px] font-medium text-[#fde68a]">
                <Sparkles className="size-3" aria-hidden />
                Còn {soNgayToiTet} ngày tới Tết {ngayTetHien}
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl font-medium leading-tight tracking-tight text-[#fff7e6] sm:text-4xl">
            {tieuDe}
          </h1>

          {/* Khối Trả lời nhanh mở 100% trong visible DOM (chuẩn SEO/AEO 12 điểm) */}
          <section
            aria-label={nhanTraLoiNhanh}
            className="mt-4 rounded-2xl border border-gold/35 bg-bg/60 p-4 backdrop-blur-sm"
          >
            <p className="eyebrow text-gold">{nhanTraLoiNhanh}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-fg sm:text-[15px]">{traLoiNhanh}</p>
          </section>

          {/* CTA kép ngay above-the-fold */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {hrefCaNhan && (
              <Link
                href={hrefCaNhan}
                className="nut-sang inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-bg shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Sparkles className="size-4" aria-hidden />
                {nhanCaNhan}
              </Link>
            )}
            <a
              href="#li-xi-tet-2027"
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/55 bg-[#8b1218]/85 px-4 py-2.5 text-sm font-medium text-[#fff6e5] transition-colors hover:border-[#fde047] hover:bg-[#9e1c1c]"
            >
              <Gift className="size-4 text-[#fde68a]" aria-hidden />
              Tặng Lì Xì Tết 2027 →
            </a>
          </div>
        </div>

        {/* Cột phải: Huy hiệu Linh Vật Đinh Mùi 2027 */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex size-48 items-center justify-center sm:size-52">
            <div
              className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-gold/45 motion-safe:animate-spin-slow"
              aria-hidden
            />
            <div
              className="relative size-44 overflow-hidden rounded-full p-1 shadow-2xl sm:size-[184px]"
              style={{
                background: "linear-gradient(135deg, #f7d983, #8b1218 50%, #e9c46a)",
                boxShadow: "0 0 36px -8px rgba(233,196,106,0.45), 0 18px 34px rgba(0,0,0,0.6)",
              }}
            >
              <img
                src={linhVat.anh}
                alt={linhVat.nhan}
                width={184}
                height={184}
                fetchPriority="high"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>

          <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f7cf68]">
            {linhVat.nhan}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Chọn phong cách Linh Vật Đinh Mùi 2027">
            {MAU_LINH_VAT.map((m, idx) => (
              <button
                key={m.ma}
                type="button"
                onClick={() => setMauIdx(idx)}
                aria-pressed={idx === mauIdx}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  idx === mauIdx
                    ? "border-gold bg-gold/20 font-semibold text-[#fde68a]"
                    : "border-gold/25 bg-bg/55 text-fg-muted hover:border-gold/50 hover:text-fg"
                }`}
              >
                {m.ten}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
