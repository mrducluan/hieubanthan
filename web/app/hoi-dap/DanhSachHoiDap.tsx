"use client";
// Bộ lọc tương tác theo mảng (Tử vi / Bát tự / Thần số / Phong thuỷ / Kinh Dịch / 2027) và chủ đề đời sống cho /hoi-dap.
import { useMemo, useState } from "react";
import Link from "@/components/khung/Lien";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  duongHoiDap,
  NHAN_CHU_DE,
  NHAN_MANG,
  type ChuDeHoiDap,
  type MangHoiDap,
  type TinhHuongHoiDap,
} from "@/lib/hoi-dap-mau";

const CAC_MANG = Object.entries(NHAN_MANG) as [MangHoiDap, string][];
const CAC_CHU_DE = Object.entries(NHAN_CHU_DE) as [ChuDeHoiDap, string][];

export function DanhSachHoiDap({ ds }: { ds: readonly TinhHuongHoiDap[] }) {
  const [mang, setMang] = useState<MangHoiDap | "tat_ca">("tat_ca");
  const [chuDe, setChuDe] = useState<ChuDeHoiDap | "tat_ca">("tat_ca");

  const ketQua = useMemo(
    () => ds.filter((x) => (mang === "tat_ca" || x.mang === mang) && (chuDe === "tat_ca" || x.chuDe === chuDe)),
    [ds, mang, chuDe],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-line/70 bg-bg-2/40 p-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo mảng">
          <span className="text-xs font-medium text-fg-faint">Mảng:</span>
          <button
            type="button"
            onClick={() => setMang("tat_ca")}
            aria-pressed={mang === "tat_ca"}
            data-testid="loc-mang-tat_ca"
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${mang === "tat_ca" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/40"}`}
          >
            Tất cả ({ds.length})
          </button>
          {CAC_MANG.map(([k, ten]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMang(k)}
              aria-pressed={mang === k}
              data-testid={`loc-mang-${k}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${mang === k ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/40"}`}
            >
              {ten}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo chủ đề">
          <span className="text-xs font-medium text-fg-faint">Chủ đề:</span>
          <button
            type="button"
            onClick={() => setChuDe("tat_ca")}
            aria-pressed={chuDe === "tat_ca"}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${chuDe === "tat_ca" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/40"}`}
          >
            Mọi chủ đề
          </button>
          {CAC_CHU_DE.map(([k, ten]) => (
            <button
              key={k}
              type="button"
              onClick={() => setChuDe(k)}
              aria-pressed={chuDe === k}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${chuDe === k ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/40"}`}
            >
              {ten}
            </button>
          ))}
        </div>
      </div>

      {ketQua.length === 0 ? (
        <Card className="p-6 text-center text-sm text-fg-muted" data-testid="hd-rong">
          Chưa có tình huống khớp đồng thời hai bộ lọc này.{" "}
          <button type="button" onClick={() => { setMang("tat_ca"); setChuDe("tat_ca"); }} className="text-gold underline">
            Xem lại tất cả
          </button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-testid="hd-danh-sach">
          {ketQua.map((t) => (
            <Link key={t.slug} href={duongHoiDap(t.slug)} className="group block">
              <Card className="flex h-full flex-col justify-between space-y-3 border-line/70 transition-colors group-hover:border-gold/50">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-medium text-gold">{t.tenMang}</span>
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-fg-muted">{t.tenChuDe}</span>
                  </div>
                  <h2 className="font-serif text-lg font-semibold leading-snug text-fg group-hover:text-gold">
                    {t.cauHoi}
                  </h2>
                  <p className="text-xs leading-relaxed text-fg-muted">{t.tomTat}</p>
                </div>
                <p className="inline-flex items-center gap-1 text-xs font-medium text-gold">
                  Đọc phân tích 3 phần <ArrowRight className="size-3.5" aria-hidden />
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
