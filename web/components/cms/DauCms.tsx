"use client";
// ND-2 — đầu trang công cụ từ CMS: page.tsx (máy chủ) đọc "Trang website" rồi bọc công cụ (client) trong DauCms →
// tiêu đề H1, lời dẫn, kiểu chữ và khối "phía trên" đến đúng chỗ trong khung đầu trang của công cụ, mà công cụ không
// phải gọi CMS. Ô trống → công cụ dùng chữ mặc định của chính nó (HTML như khi chưa có CMS).
import { createContext, useContext, type ReactNode } from "react";
import { lopKieuChu } from "@/lib/kieu-chu";
import type { KieuChu } from "@/lib/noi-dung-trang";

type Dau = { h1: string | null; loiDan: string | null; kieuChu: KieuChu | null; khoiTren: ReactNode };
const RONG: Dau = { h1: null, loiDan: null, kieuChu: null, khoiTren: null };
const Ctx = createContext<Dau>(RONG);

export function DauCms({ h1 = null, loiDan = null, kieuChu = null, khoiTren = null, children }: Partial<Dau> & { children: ReactNode }) {
  return <Ctx.Provider value={{ h1, loiDan, kieuChu, khoiTren }}>{children}</Ctx.Provider>;
}

export const useDauCms = () => useContext(Ctx);

/** Lời dẫn dưới H1: chữ CMS (theo kiểu chữ đã chọn) hoặc chữ mặc định của công cụ. */
export function LoiDan({ macDinh, className }: { macDinh?: ReactNode; className?: string }) {
  const d = useDauCms();
  if (d.loiDan) return <p className={className ?? "mt-3 max-w-2xl text-fg-muted"}><span className={lopKieuChu(d.kieuChu) || undefined}>{d.loiDan}</span></p>;
  return macDinh ? <p className={className ?? "mt-3 max-w-2xl text-fg-muted"}>{macDinh}</p> : null;
}

/** Như TieuDeMuc cấp 1 (cùng HTML khi CMS trống) + phủ CMS + khối phía trên — cho công cụ không dùng DauMang
 *  (Thần số, Hợp đôi, Hôm nay). */
export function TieuDeTrang({ nho, lon, mo_ta }: { nho?: string; lon: string; mo_ta?: string }) {
  const d = useDauCms(), kc = lopKieuChu(d.kieuChu);
  const dan = d.loiDan ?? mo_ta;
  return (
    <>
      <header className="mb-5">
        {nho && <p className="eyebrow">{nho}</p>}
        <h1 className="mt-1 text-2xl sm:text-3xl">{d.h1 ?? lon}</h1>
        {dan && <p className="mt-2 max-w-2xl text-fg-muted">{d.loiDan && kc ? <span className={kc}>{dan}</span> : dan}</p>}
      </header>
      {d.khoiTren && <div className="mb-8">{d.khoiTren}</div>}
    </>
  );
}
