"use client";
// Chặng 3.3B — Chiều sâu 56 Lá Ẩn Phụ ngược (Waite 1910 & Mathers 1888) & Phẩm giá nguyên tố chuỗi bài.
import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "@/components/khung/Lien";

interface LaRut {
  id: string;
  nguoc: boolean;
}

interface KetQuaChieuSau {
  khung: { tieu_de: string; phu_de: string; cau_noi_menh_ly: string };
  so_la_nguoc: number;
  la_nguoc: {
    vi_tri: number;
    id: string;
    ten: string;
    chieu_nguoc_go_mo: string;
    viec_nho_go_nut: string;
    cau_hoi_tu_soi: string;
    trich_waite_1910_nguoc: string;
    trich_mathers_1888_nguoc?: string | null;
  }[];
  pham_gia_nguyen_to: {
    cap_vi_tri: number[];
    cap_la: string;
    cap_nguyen_to: string;
    quan_he: string;
    dien_giai: string;
  }[];
  lien_ket_menh_ly: { ten: string; duong: string }[];
}

export function ChieuSauTraiBai({ la, en = false }: { la: LaRut[]; en?: boolean }) {
  const [kq, setKq] = useState<KetQuaChieuSau | null>(null);

  const keyLa = la.map((x) => `${x.id}:${x.nguoc ? 1 : 0}`).join(",");

  useEffect(() => {
    let huy = false;
    if (!la.length) return;
    fetch("/api/tarot/chieu-sau", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(en ? { "x-ngon-ngu": "en" } : {}),
      },
      body: JSON.stringify({ la }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!huy && d) setKq(d as KetQuaChieuSau);
      })
      .catch(() => {});
    return () => {
      huy = true;
    };
  }, [keyLa, en, la]);

  if (!kq) return null;
  if (kq.so_la_nguoc === 0 && kq.pham_gia_nguyen_to.length === 0) return null;

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-line/80 bg-surface/35 p-5" data-testid="chieu-sau-trai-bai">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
          <Sparkles className="size-3.5" aria-hidden /> {kq.khung.tieu_de}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{kq.khung.phu_de}</p>
      </div>

      {kq.la_nguoc.length > 0 && (
        <div className="space-y-3">
          {kq.la_nguoc.map((l) => (
            <div key={`${l.vi_tri}-${l.id}`} className="rounded-xl border border-line/70 bg-bg/55 p-3.5 text-xs">
              <p className="font-semibold text-fg">
                #{l.vi_tri} · {l.ten} ({en ? "Reversed" : "Lá ngược"})
              </p>
              <p className="mt-1 leading-relaxed text-fg-muted">{l.chieu_nguoc_go_mo}</p>
              <p className="mt-1 font-medium text-jade">{l.viec_nho_go_nut}</p>
              <p className="mt-1 italic text-fg-faint">{l.cau_hoi_tu_soi}</p>
              {l.trich_waite_1910_nguoc && (
                <p className="mt-2 border-t border-line/50 pt-1.5 text-[11px] text-fg-faint">
                  Waite (1910): &ldquo;{l.trich_waite_1910_nguoc}&rdquo;
                  {l.trich_mathers_1888_nguoc ? ` · Mathers (1888): "${l.trich_mathers_1888_nguoc}"` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {kq.pham_gia_nguyen_to.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gold">
            {en ? "Elemental Dignities Across Neighboring Cards (Liber LXXVIII)" : "Phẩm giá nguyên tố giữa các lá liền kề (Liber LXXVIII)"}
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {kq.pham_gia_nguyen_to.map((pg, idx) => (
              <div key={idx} className="rounded-xl border border-line/60 bg-bg/45 p-3 text-xs">
                <p className="font-medium text-fg">
                  {pg.cap_la} <span className="text-gold">({pg.cap_nguyen_to})</span>
                </p>
                <p className="mt-1 leading-relaxed text-fg-muted">{pg.dien_giai}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line/50 pt-3 text-xs text-fg-muted">
        <p>{kq.khung.cau_noi_menh_ly}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {kq.lien_ket_menh_ly.map((lk) => (
            <Link key={lk.duong} href={en ? `/en${lk.duong}` : lk.duong} className="inline-flex items-center gap-1 font-medium text-gold hover:underline">
              {lk.ten} <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
