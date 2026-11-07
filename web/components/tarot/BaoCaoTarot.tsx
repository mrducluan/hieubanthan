"use client";
// TR-1 — bài đọc "Trải bài của bạn": bàn bài đã lật (vẽ đường phẩm giá + hướng nhìn engine tính) phía trên báo cáo khuôn
// doi_song_1 (dùng chung BaoCaoDoiSongView: hộp nổi bật, "Đúng với mình", "Vì sao nói vậy", mục lục). Bấm một lá trên bàn →
// cuộn tới hộp của vị trí đó. Component thuần, không gọi engine.
import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaoCaoDoiSongView } from "@/components/luan-giai/BaoCaoDoiSong";
import { BanTraiBai } from "./BanTraiBai";
import { MAU_NGUYEN_TO, TEN_NGUYEN_TO, TEN_SUC, type BaoCaoTarot as Bc, type LaBoBai, type TraiBai } from "@/lib/tarot-chung";

export function BaoCaoTarot({ bc, tb, boLa, ten, chanTrang }: { bc: Bc; tb: TraiBai; boLa: Record<string, LaBoBai>; ten: string; chanTrang?: React.ReactNode }) {
  const [chon, setChon] = useState<number | null>(null);
  const vt = bc.da_tinh.vi_tri;
  const bam = (i: number) => {
    setChon(i);
    document.getElementById("lg-tung_la")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const nt = bc.da_tinh.nguyen_to;
  return (
    <div data-testid="bao-cao-tarot">
      <div className="glass mb-8 rounded-2xl p-4 sm:p-6">
        <BanTraiBai tb={tb} la={vt.map((v) => ({ id: v.id, nguoc: v.nguoc }))} lat={vt.map(() => true)} boLa={boLa} pt={bc.da_tinh} chon={chon} onChon={bam} />
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="eyebrow">{bc.da_tinh.ten_trai_bai} · {bc.da_tinh.an_chinh.so}/{bc.da_tinh.an_chinh.tong} lá ẩn chính</p>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-fg-muted">
              {(Object.keys(nt.dem) as (keyof typeof nt.dem)[]).map((k) => (
                <span key={k} className="inline-flex items-center gap-1"><span className="inline-block size-2 rounded-full" style={{ background: MAU_NGUYEN_TO[k].hex }} aria-hidden />{TEN_NGUYEN_TO[k]} {nt.dem[k]}</span>
              ))}
              {nt.troi && <span className="text-fg">· trội {TEN_NGUYEN_TO[nt.troi]}</span>}
            </p>
            <p className="mt-2 text-xs text-fg-faint">Đường vàng liền: hai lá hợp nhau · đường hổ phách đứt: hai lá xung nhau · mũi tên: hướng nhìn của nhân vật trên lá (Marseille). Chấm dưới lá: {TEN_SUC.tiep_suc} / {TEN_SUC.bi_kim}. Bấm một lá để tới hộp của nó.</p>
          </div>
          {chon !== null && vt[chon] && (
            <p className="rounded-lg border border-line/60 bg-bg/40 px-3 py-2 text-sm" data-testid="la-dang-chon">
              <b className="text-fg">{vt[chon].ten_la}{vt[chon].nguoc ? " (ngược)" : ""}</b> — {vt[chon].ten}, {TEN_SUC[vt[chon].suc.suc]}
            </p>
          )}
        </div>
      </div>
      <BaoCaoDoiSongView bc={bc} ten={ten} nhan="Trải bài của bạn"
        hanhDong={<Button variant="ghost" size="sm" onClick={() => window.print()}><Printer aria-hidden /> In / lưu PDF</Button>} chanTrang={chanTrang} />
    </div>
  );
}
