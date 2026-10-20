"use client";
// TV-V2 — "Đường bay tứ hoá" (phi tinh tứ hoá 12 cung). Engine tính hết: can từng cung, 48 đường bay, tự hoá,
// Lai nhân cung, đường nổi bật kèm nghĩa (KB, nháp AI). Web chỉ hiển thị và cho bấm sang cung trên lá số.
import { ArrowRight, MessageCircleQuestion, MousePointerClick, RefreshCcw } from "lucide-react";
import { HOA, type ChartInputVao, type DuongBayT, type PhiHoaOutputT } from "@/app/api/tuvi/schema";
import { NhanLop } from "@/components/huyen-hoc/KhoiMoLuoi";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { Button } from "@/components/ui/button";
import { usePost } from "@/lib/goi-api";
import { maPhiHoa } from "@/lib/kiem-chung";
import { cn } from "@/lib/utils";

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
  return <PhiHoaXem d={d} onChonCung={onChonCung} onHoi={onHoi} />;
}

export function PhiHoaXem({ d, onChonCung, onHoi }: { d: PhiHoaOutputT; onChonCung: (chi: string) => void; onHoi: (cau: string) => void }) {
  const chiCua = (ten: string | null) => d.cung.find((c) => c.ten === ten)?.chi ?? null;
  const chon = (ten: string | null) => { const chi = chiCua(ten); if (chi) onChonCung(chi); };
  const theoCung = new Map<string, Map<string, DuongBayT>>();
  for (const x of d.duong_bay) {
    const m = theoCung.get(x.tu_cung) ?? new Map<string, DuongBayT>();
    m.set(x.hoa, x);
    theoCung.set(x.tu_cung, m);
  }

  return (
    <div className="space-y-5" data-testid="phi-hoa-noi-dung">
      <p className="text-sm text-fg-muted">
        Mỗi cung có một thiên can; can đó làm bốn sao hoá Lộc, Quyền, Khoa, Kỵ — sao nằm ở cung nào thì “đường bay” đi tới cung đó.
        Năm sinh <b className="text-fg">{d.can_nam_sinh}</b>
        {d.lai_nhan && <> · Lai nhân cung: <b className="text-gold">{d.lai_nhan.cung}</b> ({d.lai_nhan.can} {d.lai_nhan.chi})</>}.
      </p>

      {d.noi_bat.length > 0 && (
        <div>
          <p className="mb-2"><NhanLop lop="giai" /> <span className="text-xs text-fg-faint">· những đường đáng để ý nhất</span></p>
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="phi-hoa-noi-bat">
            {d.noi_bat.map((n, k) => (
              <li key={`${n.loai}-${k}`} className="glass flex flex-col gap-2 rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn("rounded-full px-2 py-0.5 font-medium", MAU_HOA_DIU[n.duong.hoa] ?? "bg-surface-2 text-fg")}>Hoá {n.duong.hoa}</span>
                  {n.duong.tu_hoa && <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-fg-muted"><RefreshCcw className="size-3" aria-hidden />Tự hoá</span>}
                  {chiCua(n.duong.tu_cung) && chiCua(n.duong.tu_cung) === d.lai_nhan?.chi && <span className="rounded-full border border-gold/50 px-2 py-0.5 text-gold">Lai nhân</span>}
                </div>
                <h3 className="font-serif text-lg leading-snug text-fg">{n.tieu_de}</h3>
                <p className="flex flex-wrap items-center gap-1 text-xs text-fg-faint">
                  <NhanLop lop="tinh" /> <span className="ml-1">{n.duong.tu_cung} (can {n.duong.can})</span>
                  <ArrowRight className="size-3" aria-hidden /> {n.duong.sao} → <b className="text-fg">{n.duong.tu_hoa ? "chính cung đó" : n.duong.den_cung}</b>
                  {n.duong.den_tuan_triet.length > 0 && <span> · gặp {n.duong.den_tuan_triet.join(", ")}</span>}
                </p>
                <p className="text-sm leading-relaxed text-fg-muted">{n.nghia}</p>
                {n.viec_nen_lam && <p className="text-sm"><span className="text-jade">Nên làm:</span> {n.viec_nen_lam}</p>}
                {n.cau_tu_soi && <p className="text-sm text-moon">Tự soi: {n.cau_tu_soi}</p>}
                {n.ghi_chu_tuan_triet && <p className="text-xs text-fg-faint">{n.ghi_chu_tuan_triet}</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => chon(n.duong.den_cung ?? n.duong.tu_cung)}>
                    <MousePointerClick aria-hidden /> Xem cung trên lá số
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onHoi(`Hoá ${n.duong.hoa} từ cung ${n.duong.tu_cung} bay vào cung ${n.duong.den_cung ?? n.duong.tu_cung} nói gì với tôi?`)}>
                    <MessageCircleQuestion aria-hidden /> Hỏi thêm
                  </Button>
                </div>
                <KiemChung loai="phi_hoa" mau={maPhiHoa(n)} phai="phi_tinh" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.luu_nien && (
        <div className="rounded-xl bg-surface-2/40 p-3 text-sm" data-testid="phi-hoa-luu-nien">
          <p className="text-fg">Tứ hoá năm {d.luu_nien.can_chi} ({d.luu_nien.nam}) đi vào lá số của bạn:</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {d.luu_nien.hoa.map((h) => (
              <li key={h.hoa}>
                <button type="button" onClick={() => chon(h.den_cung)} className={cn("rounded-lg px-2.5 py-1 text-xs", MAU_HOA_DIU[h.hoa] ?? "bg-surface-2")}>
                  Hoá {h.hoa} · {h.sao} → {h.den_cung ?? "—"}{h.xung_cung ? ` (chiếu ${h.xung_cung})` : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="group rounded-xl border border-line/70 px-3 py-2 text-sm" data-testid="phi-hoa-bang">
        <summary className="cursor-pointer text-fg-muted hover:text-fg">Bảng đủ 12 cung × 4 hoá ({d.duong_bay.length} đường)</summary>
        <div className="-mx-3 mt-2 overflow-x-auto px-3">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="text-left text-fg-faint">
                <th className="py-1 pr-2 font-medium">Cung (can)</th>
                {HOA.map((h) => <th key={h} className="py-1 pr-2 font-medium">Hoá {h}</th>)}
              </tr>
            </thead>
            <tbody>
              {d.cung.map((c) => {
                const m = theoCung.get(c.ten);
                return (
                  <tr key={c.chi} className="border-t border-line/50 align-top">
                    <td className="py-1.5 pr-2">
                      <button type="button" className="text-left text-fg hover:text-gold" onClick={() => onChonCung(c.chi)}>
                        {c.ten} <span className="text-fg-faint">({c.can} {c.chi})</span>
                      </button>
                      {c.la_menh && <span className="ml-1 text-gold">· Mệnh</span>}
                      {c.la_lai_nhan && <span className="ml-1 text-gold">· Lai nhân</span>}
                    </td>
                    {HOA.map((h) => {
                      const x = m?.get(h);
                      return (
                        <td key={h} className={cn("py-1.5 pr-2", x?.tu_hoa && "font-medium text-fg")}>
                          {x ? <>{x.sao} → {x.tu_hoa ? <span className="text-moon">tự hoá</span> : x.den_cung ?? "—"}</> : "—"}
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
          {d.phai && <>Phái: {d.phai.ten}{d.phai.ghi_chu ? ` — ${d.phai.ghi_chu.replace(/\.$/, "")}` : ""}. </>}
          {d.luu_y.join(" ")}
        </p>
      )}
    </div>
  );
}
