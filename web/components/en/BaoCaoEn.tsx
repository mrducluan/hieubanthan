"use client";
// QTE — bản hiển thị tiếng Anh của báo cáo khuôn `doi_song_1` (Tarot /en): chương → đoạn → hộp (tiêu đề, nội dung, việc nên
// làm, "Why we say this" gập). Không Sao / lưu bài (các vòng đó là bản Việt); engine đã dựng mọi chữ.
// HTT-1: thêm nút "Resonates with me / Not quite me" (cùng mã kiểm chứng, phiếu mang ngon_ngu = en — migration 0034) và lớp 2
// "Where the readings meet" khi người đọc đã bấm ≥ 2 hộp.
import { useState } from "react";
import type { BaoCaoDoiSong, ChuongDoiSongMo, Hop, Muc } from "@/components/luan-giai/kieu";
import { GiaoThoa } from "@/components/luan-giai/GiaoThoa";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { cn } from "@/lib/utils";

const NHAN_KC = { hoi: "Does this ring true for you?", dung: "Resonates with me", chua_dung: "Not quite me", da_ghi: "Saved" };

const NHAN_MUC_EN: Record<Muc, string> = { thuan: "Favourable", can_bang: "Mixed", can_chu_dong: "Take care" };
const MAU_MUC: Record<Muc, string> = { thuan: "bg-jade/15 text-jade", can_bang: "bg-bg-2 text-fg-muted", can_chu_dong: "bg-[#f0b35c]/15 text-[#f0b35c]" };
const NHAN_LOAI: Record<Hop["loai"], string> = { cot_loi: "Key point", diem_manh: "Strength", luu_y: "Watch out", loi_khuyen: "What to do", thoi_diem: "Timing" };

export function ChipMuc({ muc }: { muc?: Muc | null }) {
  return muc ? <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", MAU_MUC[muc])}>{NHAN_MUC_EN[muc]}</span> : null;
}

function HopEn({ h, phai }: { h: Hop; phai: string }) {
  const [mo, setMo] = useState(false);
  if (h.dang_xem_lai) return null;
  return (
    <li className="rounded-xl border border-line/60 bg-bg/40 p-4" data-testid="hop-en" data-ma={h.ma_mau}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-fg-faint">
        <span>{h.nhan ?? NHAN_LOAI[h.loai]}</span>
        <ChipMuc muc={h.muc} />
      </div>
      <h4 className="mt-1 font-medium text-fg">{h.tieu_de}</h4>
      {h.noi_dung && <p className="mt-1 text-fg-muted">{h.noi_dung}</p>}
      {h.huong_xu_ly && h.loai === "luu_y" && <p className="mt-2 text-sm text-fg"><span className="text-fg-faint">Try: </span>{h.huong_xu_ly}</p>}
      {h.can_cu && h.can_cu.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setMo(!mo)} className="text-xs text-gold hover:underline" aria-expanded={mo}>{mo ? "Hide" : "Why we say this"}</button>
          {mo && <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-fg-faint">{h.can_cu.map((c, i) => <li key={i}>{c}</li>)}</ul>}
        </div>
      )}
      {h.ma_mau && <KiemChung loai="doi_song" mau={h.ma_mau} phai={h.phai ?? phai} ngonNgu="en" nhan={NHAN_KC} tyLeEngine={h} />}
    </li>
  );
}

export function BaoCaoEn({ bc, moSan = [] }: { bc: BaoCaoDoiSong & { ten?: string; cot_loi?: Hop[] }; moSan?: string[] }) {
  const chuong = bc.chuong.filter((c): c is ChuongDoiSongMo => !c.khoa);
  const phai = bc.phai ?? (bc.mo_dun === "thanso" ? "pitago" : bc.mo_dun === "tarot" ? "tarot_tong_hop" : "nam_phai_viet");
  const [mo, setMo] = useState<Set<string>>(() => new Set([chuong[0]?.ma ?? "", ...moSan]));
  const bat = (ma: string) => setMo((s) => { const n = new Set(s); n.has(ma) ? n.delete(ma) : n.add(ma); return n; });
  return (
    <div data-testid="bao-cao-en">
      {bc.cot_loi && bc.cot_loi.length > 0 && (
        <section className="glass mb-6 rounded-2xl p-5">
          <h3 className="text-lg">What matters most</h3>
          <ul className="mt-3 space-y-3">{bc.cot_loi.slice(0, 3).map((h, i) => <HopEn key={i} h={h} phai={phai} />)}</ul>
        </section>
      )}
      <nav aria-label="Chapters" className="mb-4 flex flex-wrap gap-2 text-xs">
        {chuong.map((c) => <a key={c.ma} href={`#en-${c.ma}`} className="rounded-full border border-line px-2.5 py-1 text-fg-muted hover:text-fg">{c.tieu_de}</a>)}
      </nav>
      <div className="space-y-4">
        {chuong.map((c) => {
          const dang = mo.has(c.ma);
          return (
            <section key={c.ma} id={`en-${c.ma}`} className="glass scroll-mt-24 rounded-2xl p-5" data-testid={`chuong-en-${c.ma}`}>
              <button type="button" onClick={() => bat(c.ma)} className="flex w-full items-start justify-between gap-3 text-left" aria-expanded={dang}>
                <div>
                  <h3 className="text-xl">{c.tieu_de}</h3>
                  {c.cau_hoi && <p className="mt-0.5 text-sm text-fg-faint">{c.cau_hoi}</p>}
                  {!dang && c.tom_tat && <p className="mt-1 text-sm text-fg-muted">{c.tom_tat}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2"><ChipMuc muc={c.muc} /><span className="text-fg-faint" aria-hidden>{dang ? "−" : "+"}</span></div>
              </button>
              {dang && (
                <div className="mt-3 space-y-3">
                  {c.doan_truoc && c.doan.map((d, i) => <p key={i} className="text-fg-muted">{d}</p>)}
                  {c.hop && c.hop.length > 0 && <ul className="space-y-3">{c.hop.map((h, i) => <HopEn key={i} h={h} phai={phai} />)}</ul>}
                  {!c.doan_truoc && c.doan.map((d, i) => <p key={i} className="text-fg-muted">{d}</p>)}
                  {c.mien_tru && <p className="text-xs text-fg-faint">{c.mien_tru}</p>}
                  {c.cau_tu_soi && <p className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-2 text-sm"><span className="text-fg-faint">Ask yourself: </span>{c.cau_tu_soi}</p>}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <GiaoThoa en />
      {bc.ket && <p className="mt-6 text-sm text-fg-muted">{bc.ket}</p>}
    </div>
  );
}
