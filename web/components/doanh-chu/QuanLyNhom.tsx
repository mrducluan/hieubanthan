"use client";
// QLNS-1 — phần dành cho người quản lý dưới Bản đồ đội ngũ: kế hoạch 30 ngày + tình huống dễ gặp với CHÍNH nhóm này.
// Mọi chữ do engine dựng (`luangiai/doanh_chu_quan_ly.py`); web chỉ vẽ + đo lượt (chỉ mã, không tên người).
import { useEffect, useRef, useState } from "react";
import { CalendarCheck2, Check, Copy, MessagesSquare } from "lucide-react";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";
import type { TinhHuongQuanLy, ViecKeHoach } from "@/lib/doanh-chu";
import { ghi as ghiSuKien } from "@/lib/do-luong";

const C = CHU_DOANH_CHU;

export function KeHoach30Ngay({ ds }: { ds: ViecKeHoach[] }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !ds.length) return;
    const ob = new IntersectionObserver((e) => {
      if (e.some((x) => x.isIntersecting)) {
        ghiSuKien("chart_interacted", { mo_dun: "doanh_chu", kind: "ke_hoach_xem", so_viec: ds.length });
        ob.disconnect();
      }
    }, { threshold: 0.3 });
    ob.observe(el);
    return () => ob.disconnect();
  }, [ds.length]);
  if (!ds.length) return null;
  return (
    <section ref={ref} className="glass rounded-3xl p-5 sm:p-6" data-testid="ke-hoach-30-ngay">
      <p className="eyebrow text-jade">{C.ke_hoach.nho}</p>
      <h2 className="mt-1 font-serif text-xl text-fg">{C.ke_hoach.tieu_de}</h2>
      <p className="mt-1 text-xs text-fg-muted">{C.ke_hoach.phu_de}</p>
      <ol className="mt-5 space-y-3">
        {ds.map((v) => (
          <li key={v.ma} className="grid gap-3 rounded-2xl border border-line/70 bg-bg/50 p-4 sm:grid-cols-[6.5rem_1fr]">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
              <CalendarCheck2 className="size-4" aria-hidden /> {v.tuan}
            </p>
            <div>
              <h3 className="text-base font-medium text-fg">{v.tieu_de}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{v.viec}</p>
              <p className="mt-2 text-xs leading-relaxed text-fg-faint"><span className="text-fg-muted">{C.ke_hoach.vi_sao}:</span> {v.vi_sao}</p>
              {v.cach_do && (
                <p className="mt-1 text-xs leading-relaxed text-fg-faint"><span className="text-fg-muted">{C.ke_hoach.cach_do}:</span> {v.cach_do}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TheTinhHuong({ t }: { t: TinhHuongQuanLy }) {
  const [daChep, setDaChep] = useState(false);
  async function chep() {
    try {
      await navigator.clipboard.writeText(t.mo_loi.replace(/^[“"]|[”"]$/g, ""));
      setDaChep(true);
      setTimeout(() => setDaChep(false), 2000);
      ghiSuKien("chart_interacted", { mo_dun: "doanh_chu", kind: "tinh_huong_chep", ma: t.ma });
    } catch { /* trình duyệt chặn clipboard */ }
  }
  return (
    <article className="flex flex-col rounded-2xl border border-line/60 bg-surface/30 p-4" data-ma={t.ma}>
      <h3 className="text-base font-medium text-fg">{t.van_de}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted"><strong className="text-fg">{C.tinh_huong.goc_nhin}:</strong> {t.goc_nhin}</p>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted"><strong className="text-fg">{C.tinh_huong.viec}:</strong> {t.viec}</p>
      <div className="mt-3 rounded-xl border border-jade/30 bg-jade/5 p-3">
        <p className="text-xs font-semibold text-jade">{C.tinh_huong.mo_loi}</p>
        <p className="mt-1 text-sm leading-relaxed text-fg">{t.mo_loi}</p>
        <button type="button" onClick={chep}
          className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-jade underline-offset-4 hover:underline">
          {daChep ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {daChep ? C.tinh_huong.da_chep : C.tinh_huong.chep}
        </button>
      </div>
    </article>
  );
}

export function TinhHuongNhom({ ds }: { ds: TinhHuongQuanLy[] }) {
  if (!ds.length) return null;
  return (
    <section className="glass rounded-3xl p-5 sm:p-6" data-testid="tinh-huong-nhom">
      <p className="eyebrow inline-flex items-center gap-1.5 text-gold"><MessagesSquare className="size-4" aria-hidden /> {C.tinh_huong.nho}</p>
      <h2 className="mt-1 font-serif text-xl text-fg">{C.tinh_huong.tieu_de}</h2>
      <p className="mt-1 text-xs text-fg-muted">{C.tinh_huong.phu_de}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ds.map((t) => <TheTinhHuong key={t.ma} t={t} />)}
      </div>
    </section>
  );
}

/** Lối đi tiếp sau kết quả: mời từng người tự điền (bản riêng của họ), Lịch 12 tháng, Mặt bằng. */
export function BuocTiep({ moLinkMoi }: { moLinkMoi: () => void }) {
  const moTab = (tab: "lich_12" | "mat_bang") => {
    window.dispatchEvent(new CustomEvent("hbt:dieu-hanh-tab", { detail: tab }));
    document.getElementById("cong-cu-dieu-hanh")?.scrollIntoView({ behavior: "smooth", block: "start" });
    ghiSuKien("cross_cta_clicked", { tu: "quan_ly_nhan_su", den: tab });
  };
  const nut = "inline-flex min-h-[44px] items-center rounded-2xl border border-line/70 bg-bg/50 px-4 py-3 text-left text-sm text-fg hover:border-gold/60";
  return (
    <section className="rounded-3xl border border-gold/30 bg-gold/5 p-5 sm:p-6" data-testid="buoc-tiep">
      <h2 className="font-serif text-xl text-fg">{C.buoc_tiep.tieu_de}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button type="button" className={nut} onClick={() => { moLinkMoi(); ghiSuKien("cross_cta_clicked", { tu: "quan_ly_nhan_su", den: "link_moi" }); }}>
          {C.buoc_tiep.moi}
        </button>
        <button type="button" className={nut} onClick={() => moTab("lich_12")}>{C.buoc_tiep.lich}</button>
        <button type="button" className={nut} onClick={() => moTab("mat_bang")}>{C.buoc_tiep.mat_bang}</button>
      </div>
    </section>
  );
}
