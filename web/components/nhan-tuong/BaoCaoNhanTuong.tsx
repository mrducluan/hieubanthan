"use client";
// NT-1 — hiển thị bài đọc "Gương mặt của bạn": bản đồ mặt tô theo mức engine đã chấm (+ vùng lưu niên năm nay sáng) bên
// cạnh báo cáo khuôn doi_song_1 (dùng chung BaoCaoDoiSongView: hộp nổi bật, "Đúng với mình", "Vì sao nói vậy", mục lục).
// Component thuần: nhận `bc`, không gọi engine. Bấm một vùng → cuộn tới chương nói về vùng đó.
import { useMemo, useState } from "react";
import { ghi } from "@/lib/do-luong";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaoCaoDoiSongView } from "@/components/luan-giai/BaoCaoDoiSong";
import { BanDoMat } from "./BanDoMat";
import { TEN_HINH, type BaoCaoNhanTuong as Bc, type BoVi, type VungMat } from "@/lib/nhan-tuong";

export function BaoCaoNhanTuong({ bc, boVi, ten, chanTrang }: { bc: Bc; boVi: Record<string, BoVi>; ten: string; chanTrang?: React.ReactNode }) {
  const [chon, setChon] = useState<VungMat | null>(null);
  const [moCa, setMoCa] = useState(false);
  const nhanVung = useMemo(() => Object.fromEntries(Object.values(boVi).map((b) => [b.vung, b.ten])), [boVi]);
  const namNay = bc.chuong.find((c) => c.ma === "nam_nay")?.luu_nien?.nam_nay ?? null;
  const nh = bc.da_tinh.ngu_hinh;
  // Chương đầu tiên có hộp thuộc vùng được bấm → cuộn tới (hộp mang `vung` do engine gắn).
  const chuongCuaVung = (v: string) => bc.chuong.find((c) => !c.khoa && (c.hop ?? []).some((h) => (h as { vung?: string }).vung === v))?.ma ?? null;
  const moBaiCa = (mo: boolean) => {
    setMoCa(mo);
    if (mo) ghi("chart_interacted", { mo_dun: "nhantuong", kind: "sach_xua_mo", muc: "luu_nien" });
  };
  const bam = (v: VungMat) => {
    setChon(v);
    if (namNay?.bai_ca && v === namNay.vung) moBaiCa(true);
    const ma = chuongCuaVung(v);
    if (ma) document.getElementById(`lg-${ma}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div data-testid="bao-cao-nhan-tuong">
      <div className="glass mb-8 grid gap-5 rounded-2xl p-4 sm:p-6 lg:grid-cols-[18rem_1fr] lg:items-center">
        <BanDoMat muc={bc.da_tinh.ban_do} sang={namNay?.vung ? [namNay.vung] : []} chon={chon} onChon={bam} nhan={nhanVung}
          ghiChu={namNay ? <span>Năm nay nhìn vào <b className="text-fg">{namNay.ten_bo_vi}</b>{namNay.nhan_ben} (tuổi mụ {namNay.tuoi})</span> : undefined} />
        <div>
          <p className="eyebrow">Đã quan sát {bc.da_tinh.so_cau} nét · nhận ra {bc.da_tinh.so_dac_diem} điểm sách xưa có nói</p>
          <h3 className="mt-2 text-2xl">Dáng mặt: <span className="text-gradient-gold">{nh.ten ?? TEN_HINH[nh.hinh]}</span></h3>
          <p className="mt-2 text-sm text-fg-muted">
            {nh.hinh === "pha"
              ? "Không nghiêng hẳn về một hành — đa số người là vậy; sách xưa dặn xem theo nét trội nhất."
              : `Dáng mặt mang hành ${TEN_HINH[nh.hinh]}${nh.troi[1] ? `, pha chút ${TEN_HINH[nh.troi[1]]}` : ""}. Chương “Tướng và lá số” đặt hành này cạnh hành lá số Bát tự cần bù.`}
          </p>
          <p className="mt-3 text-xs text-fg-faint">Bấm một vùng trên bản đồ để tới chương nói về vùng đó. Màu là mức sách xưa gán cho nét bạn chọn, không phải điểm.</p>
          {chon && (
            <p className="mt-2 rounded-lg border border-line/60 bg-bg/40 px-3 py-2 text-sm" data-testid="vung-dang-chon">
              <b className="text-fg">{nhanVung[chon] ?? chon}</b>{Object.values(boVi).find((b) => b.vung === chon)?.nghia ? ` — ${Object.values(boVi).find((b) => b.vung === chon)!.nghia}` : ""}
            </p>
          )}
          {namNay?.bai_ca && (
            <button type="button" aria-expanded={moCa} onClick={() => moBaiCa(!moCa)} data-testid="nut-bai-ca"
              className="mt-2 inline-flex min-h-[44px] items-center text-sm text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold">
              Sách xưa nói gì về tuổi {namNay.tuoi}
            </button>
          )}
          {moCa && namNay?.bai_ca && (
            <div className="mt-2 rounded-lg border border-gold/30 bg-gold/[0.05] px-3 py-2 text-sm" data-testid="bai-ca-luu-nien">
              <p className="text-xs uppercase tracking-wide text-gold">Sách xưa · {namNay.bai_ca.sach} — {namNay.bai_ca.ten_bai}</p>
              <p className="mt-1 leading-relaxed">{namNay.bai_ca.y}</p>
              <p lang="zh-Hant" className="mt-1 font-serif text-fg-muted">«{namNay.bai_ca.han}»</p>
              <p className="mt-1 text-xs text-fg-faint">Sách xưa viết cho người thời đó; đây là văn hoá để tham khảo và tự soi, không phải lời đoán trước.</p>
            </div>
          )}
        </div>
      </div>
      <BaoCaoDoiSongView bc={bc} ten={ten} nhan="Gương mặt của bạn"
        hanhDong={<Button variant="ghost" size="sm" onClick={() => window.print()}><Printer aria-hidden /> In / lưu PDF</Button>}
        chanTrang={chanTrang} />
    </div>
  );
}
