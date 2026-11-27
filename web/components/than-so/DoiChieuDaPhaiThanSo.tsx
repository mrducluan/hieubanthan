"use client";
// Chặng 3.3A — Đối chiếu 5 Trường phái Thần số học (Pitago · Balliett 1908 · Westcott/Sepharial · Phillips · Chaldea Cheiro).
import { useState } from "react";
import { ArrowUpRight, Layers } from "lucide-react";
import Link from "@/components/khung/Lien";

interface PhaiItem {
  ma: string;
  ten_phai: string;
  chi_so_chinh: string;
  nhan_xet: string;
  trich_nguon?: { sach: string; nguyen_van_en: string } | null;
}

interface KetQuaDaPhai {
  khung: { tieu_de: string; phu_de: string; cau_noi_dong_phuong: string };
  nam_phai: PhaiItem[];
  lien_ket_mo_rong: { ten: string; duong: string }[];
}

export function DoiChieuDaPhaiThanSo({
  ngaySinhIso,
  hoTen,
  quyUoc = "tong_het",
  en = false,
}: {
  ngaySinhIso: string;
  hoTen: string;
  quyUoc?: "tong_het" | "tung_phan";
  en?: boolean;
}) {
  const [dangTai, setDangTai] = useState(false);
  const [kq, setKq] = useState<KetQuaDaPhai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  async function taiDaPhai() {
    setDangTai(true);
    setLoi(null);
    try {
      const res = await fetch("/api/thanso/doi-chieu-phai", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(en ? { "x-ngon-ngu": "en" } : {}),
        },
        body: JSON.stringify({
          ngay_sinh: ngaySinhIso,
          ho_ten: hoTen,
          quy_uoc_duong_doi: quyUoc,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(body.error ?? (en ? "Could not load 5-school comparison." : "Chưa tải được đối chiếu 5 trường phái."));
        return;
      }
      setKq(body as KetQuaDaPhai);
    } catch {
      setLoi(en ? "Temporary connection error." : "Mất kết nối tạm thời.");
    } finally {
      setDangTai(false);
    }
  }

  return (
    <section className="my-8 rounded-2xl border border-line/80 bg-surface/35 p-5 sm:p-6" data-testid="doi-chieu-da-phai-thanso">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            {en ? "Multi-School Classical & Modern Comparison" : "Đối chiếu Học thuật Đa phái · Đọc riêng từng phái"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-fg">
            {en ? "Compare 5 Western Numerology Schools" : "Đối chiếu 5 Trường phái Thần số học (Pitago · Balliett · Westcott · Phillips · Chaldea)"}
          </h3>
        </div>
        {!kq && (
          <button
            type="button"
            onClick={taiDaPhai}
            disabled={dangTai}
            data-testid="nut-mo-5-phai-thanso"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/20 disabled:opacity-50"
          >
            <Layers className="size-3.5" aria-hidden />
            {dangTai ? (en ? "Loading…" : "Đang đối chiếu…") : (en ? "Open 5-School View" : "Mở đối chiếu 5 trường phái")}
          </button>
        )}
      </div>

      {loi && <p role="alert" className="mt-3 text-xs text-amber-300">{loi}</p>}

      {kq && (
        <div className="mt-5 space-y-4" data-testid="ket-qua-5-phai-thanso">
          <p className="text-xs leading-relaxed text-fg-muted">{kq.khung.phu_de}</p>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {kq.nam_phai.map((p) => (
              <div key={p.ma} className="rounded-xl border border-line/70 bg-bg/55 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gold">{p.ten_phai}</span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-fg">{p.chi_so_chinh}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fg-muted">{p.nhan_xet}</p>
                {p.trich_nguon && (
                  <div className="mt-2.5 border-t border-line/50 pt-2 text-[11px] text-fg-faint">
                    <p className="font-medium text-fg-muted">{p.trich_nguon.sach}</p>
                    <p className="mt-0.5 italic">&ldquo;{p.trich_nguon.nguyen_van_en}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-jade/35 bg-jade/5 p-4 text-xs">
            <p className="leading-relaxed text-fg-muted">{kq.khung.cau_noi_dong_phuong}</p>
            <div className="mt-2.5 flex flex-wrap gap-3">
              {kq.lien_ket_mo_rong.map((lk) => (
                <Link key={lk.duong} href={en ? `/en${lk.duong}` : lk.duong} className="inline-flex items-center gap-1 font-medium text-jade hover:underline">
                  {lk.ten} <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
