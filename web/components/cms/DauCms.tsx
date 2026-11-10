"use client";
// ND-2 — đầu trang công cụ từ CMS: page.tsx (máy chủ) đọc "Trang website" rồi bọc công cụ (client) trong DauCms →
// tiêu đề H1, lời dẫn, kiểu chữ và khối "phía trên" đến đúng chỗ trong khung đầu trang của công cụ, mà công cụ không
// phải gọi CMS. Ô trống → công cụ dùng chữ mặc định của chính nó (HTML như khi chưa có CMS).
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { taoChu, thayBienChu, type BangChu, type ChuCms } from "@/lib/chu-trang";
import { lopKieuChu } from "@/lib/kieu-chu";
import type { KieuChu } from "@/lib/noi-dung-trang";

// ND-7: `bang` = bảng chữ của URL (lib/chu/*.ts), `chu` = chữ CMS đã lọc theo bảng → công cụ đọc bằng useChu().
export type TraLoiNhanhDau = { hoi: string; dap: string; lien_ket?: { href: string; ten: string }[] };
type Dau = { h1: string | null; loiDan: string | null; kieuChu: KieuChu | null; khoiTren: ReactNode; bang: BangChu; chu: ChuCms;
  /** SEO-N: "Trả lời nhanh" ngay dưới H1 (TrangCongCu đưa vào từ lib/so-trang.ts). */ traLoi: TraLoiNhanhDau | null };
const RONG: Dau = { h1: null, loiDan: null, kieuChu: null, khoiTren: null, bang: {}, chu: {}, traLoi: null };
const Ctx = createContext<Dau>(RONG);

export function DauCms({ h1 = null, loiDan = null, kieuChu = null, khoiTren = null, bang = {}, chu = {}, traLoi = null, children }: Partial<Dau> & { children: ReactNode }) {
  return <Ctx.Provider value={{ h1, loiDan, kieuChu, khoiTren, bang, chu, traLoi }}>{children}</Ctx.Provider>;
}

/** SEO-N (GEO): câu hỏi + câu trả lời 40–60 chữ ngay dưới H1 — nằm trong <details> (chữ có trong HTML máy chủ cho
 *  Google / bot AI đọc, nhưng gập lại để form nhập vẫn ở màn đầu). Link chỉ trong site. */
export function TraLoiNhanhDau({ className = "mt-4" }: { className?: string }) {
  const t = useDauCms().traLoi;
  if (!t) return null;
  return (
    <details className={`${className} group max-w-2xl rounded-xl border border-gold/25 bg-gold/[0.04] px-4 py-2.5 text-sm`} data-testid="tra-loi-nhanh-dau">
      <summary className="cursor-pointer list-none py-1 text-fg [&::-webkit-details-marker]:hidden">
        <span className="eyebrow mr-2">Trả lời nhanh</span>{t.hoi}
        <span aria-hidden className="ml-1 inline-block text-fg-faint transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <p className="mt-2 leading-relaxed text-fg-muted">{t.dap}</p>
      {!!t.lien_ket?.length && (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {t.lien_ket.filter((l) => l.href.startsWith("/")).map((l) => <a key={l.href} href={l.href} className="text-gold underline-offset-4 hover:underline">{l.ten} →</a>)}
        </p>
      )}
    </details>
  );
}

export const useDauCms = () => useContext(Ctx);
/** Chữ trên trang của URL đang xem (ND-7): `c("dau.nhan_tren")` → chữ CMS hoặc mặc định trong bảng. */
export function useChu() {
  const { bang, chu } = useContext(Ctx);
  return useMemo(() => taoChu(bang, chu), [bang, chu]);
}

/** Lời dẫn dưới H1: chữ CMS (theo kiểu chữ đã chọn) hoặc chữ mặc định của công cụ. */
export function LoiDan({ macDinh, className }: { macDinh?: ReactNode; className?: string }) {
  const d = useDauCms();
  if (d.loiDan) return <p className={className ?? "mt-3 max-w-2xl text-fg-muted"}><span className={lopKieuChu(d.kieuChu) || undefined}><ChuNhan chu={d.loiDan} /></span></p>;
  return macDinh ? <p className={className ?? "mt-3 max-w-2xl text-fg-muted"}>{macDinh}</p> : null;
}

/** Như TieuDeMuc cấp 1 (cùng HTML khi CMS trống) + phủ CMS + khối phía trên — cho công cụ không dùng DauMang
 *  (Thần số, Hợp đôi, Hôm nay). `nho` = mặc định; CMS sửa khoá "dau.nhan_tren" thì thắng (biến {x} lấy từ `bien`). */
export function TieuDeTrang({ nho, lon, mo_ta, bien }: { nho?: string; lon: string; mo_ta?: string; bien?: Record<string, string> }) {
  const d = useDauCms(), kc = lopKieuChu(d.kieuChu);
  const dan = d.loiDan ?? mo_ta;
  const nhoHien = d.chu["dau.nhan_tren"] ? thayBienChu(d.chu["dau.nhan_tren"], bien) : nho;
  return (
    <>
      <header className="mb-5">
        {nhoHien && <p className="eyebrow">{nhoHien}</p>}
        <h1 className="mt-1 text-2xl sm:text-3xl">{d.h1 ? <ChuNhan chu={d.h1} /> : lon}</h1>
        {dan && <p className="mt-2 max-w-2xl text-fg-muted">{d.loiDan ? <span className={kc || undefined}><ChuNhan chu={dan} /></span> : dan}</p>}
        <TraLoiNhanhDau className="mt-3" />
      </header>
      {d.khoiTren && <div className="mb-8">{d.khoiTren}</div>}
    </>
  );
}
