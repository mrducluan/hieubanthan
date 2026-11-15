"use client";
// TV-V2 — "Đường bay tứ hoá" (phi tinh tứ hoá 12 cung). Engine tính hết: can từng cung, 48 đường bay, tự hoá,
// Lai nhân cung, đường nổi bật kèm nghĩa (KB, nháp AI). Web chỉ hiển thị và cho bấm sang cung trên lá số.
import { ArrowRight, MessageCircleQuestion, MousePointerClick, RefreshCcw } from "lucide-react";
import { HOA, type ChartInputVao, type DuongBayT, type PhiHoaOutputT } from "@/app/api/tuvi/schema";
import { NhanLop } from "@/components/huyen-hoc/KhoiMoLuoi";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { Button } from "@/components/ui/button";
import { usePost } from "@/lib/goi-api";
import { maPhiHoa } from "@/lib/kiem-chung";
import { useTyLe } from "@/lib/ty-le-kiem-chung";
import { cn } from "@/lib/utils";
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";
import { TenHienProvider } from "@/components/khung/TenHien";

/** Màu dịu theo hoá — Kỵ dùng tông trăng, không đỏ rực. */
export const MAU_HOA_DIU: Record<string, string> = {
  "Lộc": "bg-jade/15 text-jade", "Quyền": "bg-gold/15 text-gold", "Khoa": "bg-[rgb(126_172_255)]/15 text-[rgb(126_172_255)]", "Kỵ": "bg-moon/15 text-moon",
};

export function PhiHoa({ laSo, namXem, onChonCung, onHoi }: {
  laSo: ChartInputVao; namXem?: number; onChonCung: (chi: string) => void; onHoi: (cau: string) => void;
}) {
  const { data: d, loi, thuLai } = usePost<PhiHoaOutputT>("/api/tuvi/phi-hoa", { la_so: laSo, ...(namXem ? { nam_xem: namXem } : {}) });
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (!d) return <KhungTai dong={4} />;
  return <TenHienProvider ten={[(d as { ten_hien?: Record<string, Record<string, string>> }).ten_hien]}><PhiHoaXem d={d} onChonCung={onChonCung} onHoi={onHoi} /></TenHienProvider>;
}

export function PhiHoaXem({ d, onChonCung, onHoi }: { d: PhiHoaOutputT; onChonCung: (chi: string) => void; onHoi: (cau: string) => void }) {
  const { c: t, ten: tn, hoa } = useChuTuVi();
  const tc = (x: string | null | undefined) => (x ? tn("cung", x) : "—");
  const chiCua = (ten: string | null) => d.cung.find((c) => c.ten === ten)?.chi ?? null;
  const chon = (ten: string | null) => { const chi = chiCua(ten); if (chi) onChonCung(chi); };
  const theoCung = new Map<string, Map<string, DuongBayT>>();
  for (const x of d.duong_bay) {
    const m = theoCung.get(x.tu_cung) ?? new Map<string, DuongBayT>();
    m.set(x.hoa, x);
    theoCung.set(x.tu_cung, m);
  }
  // "x% trong N người thấy đúng" khi mã đủ ≥ 30 phiếu (LG-ĐS mục 5) — một lời gọi cho mọi thẻ nổi bật.
  const tyLe = useTyLe(d.noi_bat.map(maPhiHoa));

  return (
    <div className="space-y-5" data-testid="phi-hoa-noi-dung">
      <p className="text-sm text-fg-muted">
        {t("ph.gioi_thieu")}{" "}
        {t("ph.nam_sinh")} <b className="text-fg">{tn("can", d.can_nam_sinh)}</b>
        {d.lai_nhan && <> · {t("ph.lai_nhan")} <b className="text-gold">{tc(d.lai_nhan.cung)}</b> ({tn("can", d.lai_nhan.can)} {tn("chi", d.lai_nhan.chi)})</>}.
      </p>

      {d.noi_bat.length > 0 && (
        <div>
          <p className="mb-2"><NhanLop lop="giai" /> <span className="text-xs text-fg-faint">{t("ph.noi_bat")}</span></p>
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="phi-hoa-noi-bat">
            {d.noi_bat.map((n, k) => (
              <li key={`${n.loai}-${k}`} className="glass flex flex-col gap-2 rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn("rounded-full px-2 py-0.5 font-medium", MAU_HOA_DIU[n.duong.hoa] ?? "bg-surface-2 text-fg")}>{t("ph.hoa", { hoa: hoa(n.duong.hoa) })}</span>
                  {n.duong.tu_hoa && <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-fg-muted"><RefreshCcw className="size-3" aria-hidden />{t("ph.tu_hoa")}</span>}
                  {chiCua(n.duong.tu_cung) && chiCua(n.duong.tu_cung) === d.lai_nhan?.chi && <span className="rounded-full border border-gold/50 px-2 py-0.5 text-gold">{t("ph.lai_nhan_nho")}</span>}
                </div>
                <h3 className="font-serif text-lg leading-snug text-fg">{n.tieu_de}</h3>
                <p className="flex flex-wrap items-center gap-1 text-xs text-fg-faint">
                  <NhanLop lop="tinh" /> <span className="ml-1">{t("ph.can", { cung: tc(n.duong.tu_cung), can: tn("can", n.duong.can) })}</span>
                  <ArrowRight className="size-3" aria-hidden /> {tn("sao", n.duong.sao)} → <b className="text-fg">{n.duong.tu_hoa ? t("ph.chinh_cung") : tc(n.duong.den_cung)}</b>
                  {n.duong.den_tuan_triet.length > 0 && <span>{t("ph.gap", { ds: n.duong.den_tuan_triet.map((x) => tn("sao", x)).join(", ") })}</span>}
                </p>
                <p className="text-sm leading-relaxed text-fg-muted">{n.nghia}</p>
                {n.viec_nen_lam && <p className="text-sm"><span className="text-jade">{t("ph.nen_lam")}</span> {n.viec_nen_lam}</p>}
                {n.cau_tu_soi && <p className="text-sm text-moon">{t("ph.tu_soi", { cau: n.cau_tu_soi })}</p>}
                {n.ghi_chu_tuan_triet && <p className="text-xs text-fg-faint">{n.ghi_chu_tuan_triet}</p>}
                <ViSao canCu={n.can_cu} nho />

                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => chon(n.duong.den_cung ?? n.duong.tu_cung)}>
                    <MousePointerClick aria-hidden /> {t("ph.xem_cung")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onHoi(t("ph.cau_hoi", { hoa: hoa(n.duong.hoa), tu: tc(n.duong.tu_cung), den: tc(n.duong.den_cung ?? n.duong.tu_cung) }))}>
                    <MessageCircleQuestion aria-hidden /> {t("ph.hoi")}
                  </Button>
                </div>
                <KiemChung loai="phi_hoa" mau={maPhiHoa(n)} phai="phi_tinh" tyLe={tyLe[maPhiHoa(n)]} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.luu_nien && (
        <div className="rounded-xl bg-surface-2/40 p-3 text-sm" data-testid="phi-hoa-luu-nien">
          <p className="text-fg">{t("ph.luu_nien", { can_chi: d.luu_nien.can_chi, nam: String(d.luu_nien.nam) })}</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {d.luu_nien.hoa.map((h) => (
              <li key={h.hoa}>
                <button type="button" onClick={() => chon(h.den_cung)} className={cn("rounded-lg px-2.5 py-1 text-xs", MAU_HOA_DIU[h.hoa] ?? "bg-surface-2")}>
                  {t("ph.hoa", { hoa: hoa(h.hoa) })} · {tn("sao", h.sao)} → {tc(h.den_cung)}{h.xung_cung ? t("ph.chieu", { cung: tc(h.xung_cung) }) : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="group rounded-xl border border-line/70 px-3 py-2 text-sm" data-testid="phi-hoa-bang">
        <summary className="cursor-pointer text-fg-muted hover:text-fg">{t("ph.bang", { so: String(d.duong_bay.length) })}</summary>
        <div className="-mx-3 mt-2 overflow-x-auto px-3">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="text-left text-fg-faint">
                <th className="py-1 pr-2 font-medium">{t("ph.cot_cung")}</th>
                {HOA.map((h) => <th key={h} className="py-1 pr-2 font-medium">{t("ph.hoa", { hoa: hoa(h) })}</th>)}
              </tr>
            </thead>
            <tbody>
              {d.cung.map((c) => {
                const m = theoCung.get(c.ten);
                return (
                  <tr key={c.chi} className="border-t border-line/50 align-top">
                    <td className="py-1.5 pr-2">
                      <button type="button" className="text-left text-fg hover:text-gold" onClick={() => onChonCung(c.chi)}>
                        {tc(c.ten)} <span className="text-fg-faint">({tn("can", c.can)} {tn("chi", c.chi)})</span>
                      </button>
                      {c.la_menh && <span className="ml-1 text-gold">{t("ph.menh")}</span>}
                      {c.la_lai_nhan && <span className="ml-1 text-gold">· {t("ph.lai_nhan_nho")}</span>}
                    </td>
                    {HOA.map((h) => {
                      const x = m?.get(h);
                      return (
                        <td key={h} className={cn("py-1.5 pr-2", x?.tu_hoa && "font-medium text-fg")}>
                          {x ? <>{tn("sao", x.sao)} → {x.tu_hoa ? <span className="text-moon">{t("ph.tu_hoa_thuong")}</span> : tc(x.den_cung)}</> : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      {(d.phai || d.luu_y.length > 0) && (
        <p className="text-xs text-fg-faint">
          {d.phai && <>{t("ph.phai", { ten: d.phai.ten })}{d.phai.ghi_chu ? ` — ${d.phai.ghi_chu.replace(/\.$/, "")}` : ""}. </>}
          {d.luu_y.join(" ")}
        </p>
      )}
    </div>
  );
}
