"use client";
// TR-1 — bài đọc "Trải bài của bạn": bàn bài đã lật (vẽ đường phẩm giá + hướng nhìn engine tính) phía trên báo cáo khuôn
// doi_song_1 (dùng chung BaoCaoDoiSongView: hộp nổi bật, "Đúng với mình", "Vì sao nói vậy", mục lục). Bấm một lá trên bàn →
// cuộn tới hộp của vị trí đó. Component thuần, không gọi engine.
import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaoCaoDoiSongView } from "@/components/luan-giai/BaoCaoDoiSong";
import { BanTraiBai } from "./BanTraiBai";
import { YNghiaLa, type MucLa } from "./YNghiaLa";
import { ghi } from "@/lib/do-luong";
import { MAU_NGUYEN_TO, TEN_NGUYEN_TO, TEN_SUC, type BaoCaoTarot as Bc, type LaBoBai, type TraiBai } from "@/lib/tarot-chung";

export function BaoCaoTarot({ bc, tb, boLa, ten, chanTrang, cau }: { bc: Bc; tb: TraiBai; boLa: Record<string, LaBoBai>; ten: string; chanTrang?: React.ReactNode;
  /** Câu hỏi người dùng gõ — chỉ có trên máy (engine không trả lại); hiện lại để bài đọc đứng cạnh đúng câu hỏi. */ cau?: string | null }) {
  const vt = bc.da_tinh.vi_tri;
  // TR-5: mở sẵn lá trọng tâm (hộp cốt lõi đầu tiên engine chọn) — người đọc thấy ngay nghĩa một lá, không phải bấm mới có.
  const [chon, setChon] = useState<number | null>(bc.cot_loi[0]?.vi_tri?.so ?? 0);
  const bam = (i: number) => { setChon(i); ghi("chart_interacted", { mo_dun: "tarot", kind: "xem_nghia_la", vi_tri: i + 1 }); };
  // Nghĩa từng lá = hộp của chương "Từng vị trí" engine đã viết (đúng chiều, đúng lĩnh vực được hỏi); thiếu hộp → từ khoá bộ bài.
  const hopViTri = new Map((bc.chuong.find((c) => c.ma === "tung_la")?.hop ?? []).filter((h) => h.vi_tri && h.la).map((h) => [h.vi_tri!.so, h]));
  const muc: MucLa[] = vt.flatMap((v, i) => {
    const h = hopViTri.get(i), lb = boLa[v.id];
    if (!lb) return [];
    return [{ so: i, viTri: v.ten, hoi: h?.vi_tri?.hoi ?? tb.vi_tri[i]?.hoi ?? "", la: lb, nguoc: v.nguoc, tuKhoa: h?.tu_khoa ?? (v.nguoc ? lb.tu_khoa_nguoc ?? [] : lb.tu_khoa),
      noiDung: h?.noi_dung, viec: h?.huong_xu_ly ?? null, tuSoi: h?.cau_tu_soi ?? null }];
  });
  const nt = bc.da_tinh.nguyen_to;
  return (
    <div data-testid="bao-cao-tarot">
      {cau && (
        <p className="mb-3 rounded-xl border border-line/60 bg-bg/40 px-4 py-2.5 text-sm text-fg-muted" data-testid="cau-hoi-da-hoi">
          Bạn hỏi: <span className="text-fg">“{cau}”</span>
        </p>
      )}
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
            <details className="mt-2 text-xs text-fg-faint">
              <summary className="cursor-pointer select-none hover:text-fg-muted">Cách đọc bàn bài</summary>
              <p className="mt-1">Đường vàng liền: hai lá hợp nhau · đường hổ phách đứt: hai lá kéo hai hướng · mũi tên: hướng nhìn của nhân vật trên lá. Chấm dưới lá: {TEN_SUC.tiep_suc} / {TEN_SUC.bi_kim}. Nhãn <b className="text-[#f0b35c]">NGƯỢC</b>: lá rút ngược — đọc nghĩa ngược (năng lượng của lá bị chặn hoặc quay vào trong), không phải điềm xấu.</p>
            </details>
          </div>
        </div>
        <YNghiaLa muc={muc} chon={chon} onChon={bam} className="mt-5 border-t border-line/50 pt-4" ghiChu="Chạm một lá (hoặc lá trên bàn) để xem nghĩa của nó ở đúng vị trí này" />
      </div>
      <BaoCaoDoiSongView bc={bc} ten={ten} nhan="Trải bài của bạn" moSan={["cau_chuyen"]}
        hanhDong={<Button variant="ghost" size="sm" onClick={() => window.print()}><Printer aria-hidden /> In / lưu PDF</Button>} chanTrang={chanTrang} />
    </div>
  );
}
