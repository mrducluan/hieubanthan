"use client";
// NT-1 — hiển thị bài đọc "Gương mặt của bạn": bản đồ mặt tô theo mức engine đã chấm (+ vùng lưu niên năm nay sáng) bên
// cạnh báo cáo khuôn doi_song_1 (dùng chung BaoCaoDoiSongView: hộp nổi bật, "Đúng với mình", "Vì sao nói vậy", mục lục).
// Component thuần: nhận `bc`, không gọi engine. Bấm một vùng → cuộn tới chương nói về vùng đó.
import { useMemo, useState } from "react";
import { ghi } from "@/lib/do-luong";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaoCaoDoiSongView } from "@/components/luan-giai/BaoCaoDoiSong";
import { SachXuaGhi, type KhoiSachGhi } from "@/components/huyen-hoc/SachXuaGhi";
import { BanDoMat } from "./BanDoMat";
import { useChuNhanTuong } from "./chu-nhan-tuong";
import { TEN_HINH, type BaoCaoNhanTuong as Bc, type BoVi, type VungMat } from "@/lib/nhan-tuong";

export function BaoCaoNhanTuong({ bc, boVi, ten, chanTrang }: { bc: Bc; boVi: Record<string, BoVi>; ten: string; chanTrang?: React.ReactNode }) {
  const { t, en } = useChuNhanTuong();
  // EN-ALL GĐ 8: tên hành theo ngôn ngữ (bản Việt: đúng TEN_HINH cũ).
  const hinh = (k: string) => (en ? t(`hanh.${k}`) || k : TEN_HINH[k]);
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
        <BanDoMat en={en} muc={bc.da_tinh.ban_do} sang={namNay?.vung ? [namNay.vung] : []} chon={chon} onChon={bam} nhan={nhanVung}
          ghiChu={namNay ? (en ? <span>{t("bc.nam_nay")} <b className="text-fg">{namNay.ten_bo_vi}</b>{namNay.nhan_ben} {t("bc.tuoi_mu", { tuoi: String(namNay.tuoi) })}</span>
            : <span>Năm nay nhìn vào <b className="text-fg">{namNay.ten_bo_vi}</b>{namNay.nhan_ben} (tuổi mụ {namNay.tuoi})</span>) : undefined} />
        <div>
          <p className="eyebrow">{en ? t("bc.da_quan_sat", { so: String(bc.da_tinh.so_cau), dd: String(bc.da_tinh.so_dac_diem) }) : <>Đã quan sát {bc.da_tinh.so_cau} nét · nhận ra {bc.da_tinh.so_dac_diem} điểm sách xưa có nói</>}</p>
          <h3 className="mt-2 text-2xl">{en ? `${t("bc.dang_mat")} ` : "Dáng mặt: "}<span className="text-gradient-gold">{nh.ten ?? hinh(nh.hinh)}</span></h3>
          <p className="mt-2 text-sm text-fg-muted">
            {en ? (nh.hinh === "pha" ? t("bc.pha")
              : t("bc.hanh", { hanh: hinh(nh.hinh) ?? nh.hinh, pha: nh.troi[1] ? t("bc.pha_chut", { hanh: hinh(nh.troi[1]) ?? nh.troi[1] }) : "" }))
              : nh.hinh === "pha"
              ? "Không nghiêng hẳn về một hành — đa số người là vậy; sách xưa dặn xem theo nét trội nhất."
              : `Dáng mặt mang hành ${TEN_HINH[nh.hinh]}${nh.troi[1] ? `, pha chút ${TEN_HINH[nh.troi[1]]}` : ""}. Chương “Tướng và lá số” đặt hành này cạnh hành lá số Bát tự cần bù.`}
          </p>
          <p className="mt-3 text-xs text-fg-faint">{t("bc.bam_vung")}</p>
          {chon && (
            <p className="mt-2 rounded-lg border border-line/60 bg-bg/40 px-3 py-2 text-sm" data-testid="vung-dang-chon">
              <b className="text-fg">{nhanVung[chon] ?? chon}</b>{Object.values(boVi).find((b) => b.vung === chon)?.nghia ? ` — ${Object.values(boVi).find((b) => b.vung === chon)!.nghia}` : ""}
            </p>
          )}
          {namNay?.bai_ca && (
            <button type="button" aria-expanded={moCa} onClick={() => moBaiCa(!moCa)} data-testid="nut-bai-ca"
              className="mt-2 inline-flex min-h-[44px] items-center text-sm text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold">
              {en ? t("bc.bai_ca", { tuoi: String(namNay.tuoi) }) : <>Sách xưa nói gì về tuổi {namNay.tuoi}</>}
            </button>
          )}
          {moCa && namNay?.bai_ca && (
            <div className="mt-2 rounded-lg border border-gold/30 bg-gold/[0.05] px-3 py-2 text-sm" data-testid="bai-ca-luu-nien">
              <p className="text-xs uppercase tracking-wide text-gold">{t("bc.sach_xua")} · {namNay.bai_ca.sach} — {namNay.bai_ca.ten_bai}</p>
              <p className="mt-1 leading-relaxed">{namNay.bai_ca.y}</p>
              <p lang="zh-Hant" className="mt-1 font-serif text-fg-muted">«{namNay.bai_ca.han}»</p>
              <p className="mt-1 text-xs text-fg-faint">{t("bc.bai_ca_ghi")}</p>
            </div>
          )}
          {bc.da_tinh.phuong_tay_bridges && (
            <div className="mt-4 rounded-xl border border-gold/35 bg-gold/[0.05] p-3.5 text-sm" data-testid="nt-phuong-tay-bridges">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                {en ? "East–West Physiognomy Synthesis · Five Elements (Lillian Bridges)" : "Hợp nhất Đông – Tây · Ngũ Hành Nhân Tướng (Lillian Bridges)"}
              </p>
              <p className="mt-1 font-medium text-fg">
                {en
                  ? (bc.da_tinh.phuong_tay_bridges.ten_en || bc.da_tinh.phuong_tay_bridges.ten || bc.da_tinh.phuong_tay_bridges.hanh)
                  : (bc.da_tinh.phuong_tay_bridges.ten_vi || bc.da_tinh.phuong_tay_bridges.ten || bc.da_tinh.phuong_tay_bridges.hanh)}
              </p>
              {bc.da_tinh.phuong_tay_bridges.nghia_doi_thuong && (
                <p className="mt-1 leading-relaxed text-fg-muted">{bc.da_tinh.phuong_tay_bridges.nghia_doi_thuong}</p>
              )}
              {bc.da_tinh.phuong_tay_bridges.mat_tich_cuc && (
                <p className="mt-1 text-xs text-jade"><b className="font-medium">{en ? "Strengths: " : "Điểm mạnh: "}</b>{bc.da_tinh.phuong_tay_bridges.mat_tich_cuc}</p>
              )}
              {bc.da_tinh.phuong_tay_bridges.mat_tieu_cuc && (
                <p className="mt-0.5 text-xs text-fg-muted"><b className="font-medium text-gold">{en ? "Growth focus: " : "Cần cân bằng: "}</b>{bc.da_tinh.phuong_tay_bridges.mat_tieu_cuc}</p>
              )}
              {bc.da_tinh.phuong_tay_bridges.dong_thuan_dong_tay && (
                <p className="mt-1.5 border-t border-line/50 pt-1.5 text-xs text-fg-muted">{bc.da_tinh.phuong_tay_bridges.dong_thuan_dong_tay}</p>
              )}
              {bc.da_tinh.phuong_tay_bridges.nguon && (
                <p className="mt-1 text-[11px] text-fg-faint">{bc.da_tinh.phuong_tay_bridges.nguon}</p>
              )}
            </div>
          )}
        </div>
      </div>
      <BaoCaoDoiSongView bc={bc} ten={ten} nhan={t("bc.nhan")}
        hanhDong={<Button variant="ghost" size="sm" onClick={() => window.print()}><Printer aria-hidden /> {t("bc.in")}</Button>}
        chanTrang={chanTrang} />
      {/* SX-C: câu sách tướng xưa gắn với đúng các nét đã chọn (engine chọn + đã nói giảm; web chỉ hiển thị). */}
      <div className="mt-8">
        <SachXuaGhi khoi={(bc as { sach_ghi?: KhoiSachGhi | null }).sach_ghi} moDun="nhantuong" tieuDe={t("bc.sach_ghi")} />
      </div>
    </div>
  );
}
