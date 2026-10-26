"use client";
// NHIP-1 — "Nhịp của bạn" ở /ban-than (khâu QUAY LẠI): tháng này, tháng tới, năm cá nhân còn bao nhiêu ngày, năm tới.
// Mọi con số + chủ đề do engine trả (/api/thanso/nhip); web chỉ vẽ. Gợi chủ đề để tự soi, không dự báo.
import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange } from "lucide-react";
import type { HoSo } from "@/lib/hoso";
import { useNhip, type NhipNam, type NhipThang } from "@/lib/nhip";
import { batDauDoc } from "@/lib/do-luong";

function O({ nhan, so, phu, chuDe, nen, noiBat = false }: { nhan: string; so: number; phu: string; chuDe: string | null; nen?: string | null; noiBat?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${noiBat ? "border-gold/40 bg-gold/[0.06]" : "border-line/70 bg-surface/40"}`}>
      <p className="eyebrow">{nhan}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-serif text-4xl text-gold">{so}</span>
        <span className="text-xs text-fg-muted">{phu}</span>
      </div>
      {chuDe && <p className="mt-1 text-sm">{chuDe}</p>}
      {nen && <p className="mt-1 text-xs text-fg-muted">{nen}</p>}
    </div>
  );
}

const tenThang = (t: NhipThang) => `tháng ${t.thang}/${t.nam}`;
const tenNam = (n: NhipNam) => `năm ${n.nam}`;

/** `gon`: trang đã hiện tháng này + năm này kèm "hợp để / để ý" (NhipHienTai) → chỉ hiện tháng tới, năm tới. */
export function NhipCaNhan({ hoSo, className = "", gon = false }: { hoSo: HoSo; className?: string; gon?: boolean }) {
  const nhip = useNhip(hoSo);
  useEffect(() => { if (nhip) batDauDoc("nhip", { kind: "ban_than" }); }, [nhip]);
  if (!nhip) return null;
  const n = nhip.nam_ca_nhan;
  const daQua = Math.round(((n.tong_ngay - n.con_ngay) / n.tong_ngay) * 100);
  return (
    <section aria-labelledby="nhip-ca-nhan" className={`glass rounded-2xl p-5 sm:p-6 ${className}`} data-testid="nhip-ca-nhan">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="nhip-ca-nhan" className="flex items-center gap-2 text-xl"><CalendarRange className="size-5 text-gold" aria-hidden />Nhịp của bạn</h2>
        <Link href="/hom-nay" className="inline-flex items-center gap-1 text-sm text-gold hover:underline">Hôm nay: ngày {nhip.ngay_ca_nhan.so} <ArrowRight className="size-4" aria-hidden /></Link>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-fg-muted">
          <span>Năm cá nhân <b className="text-gold">{n.so}</b> ({tenNam(n)})</span>
          <span data-testid="con-ngay">còn {n.con_ngay} ngày</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={daQua} aria-valuemin={0} aria-valuemax={100}
          aria-label={`Đã qua ${daQua}% năm cá nhân ${n.so}`}>
          <div className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold" style={{ width: `${daQua}%` }} />
        </div>
      </div>
      <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${gon ? "" : "lg:grid-cols-4"}`}>
        {!gon && <O nhan="Tháng này" so={nhip.thang_ca_nhan.so} phu={tenThang(nhip.thang_ca_nhan)} chuDe={nhip.thang_ca_nhan.chu_de} />}
        <O nhan="Tháng tới" so={nhip.thang_toi.so} phu={tenThang(nhip.thang_toi)} chuDe={nhip.thang_toi.chu_de} nen={nhip.thang_toi.nen} noiBat />
        {!gon && <O nhan="Năm này" so={n.so} phu={tenNam(n)} chuDe={n.chu_de} />}
        <O nhan="Năm tới" so={nhip.nam_toi.so} phu={tenNam(nhip.nam_toi)} chuDe={nhip.nam_toi.chu_de} />
      </div>
      <p className="mt-3 text-xs text-fg-faint">{nhip.luu_y}</p>
    </section>
  );
}
