"use client";
// TUAN-V2 — "Tuần này của bạn" trên Hôm nay: KHU RIÊNG (không nằm trong "Đọc thêm về hôm nay"). Bảy ngày của tuần, bấm một
// ngày để xem ngày ấy qua từng môn (thần số · lịch cổ truyền · tuổi · Bát tự · Kinh Dịch) + việc sách lịch ghi hợp + giờ tốt;
// cột bên: tuần này hợp việc gì, mốc trong tuần, phong thuỷ tháng, ngày đáng để ý. Engine ghép và soạn MỌI chữ, mức, nhịp
// (/v1/thanso/tuan); web chỉ vẽ và nhớ ngày đang chọn. Không điểm số, không doạ; màu không đỏ.
import { useEffect, useRef, useState } from "react";
import Link from "@/components/khung/Lien";
import { CalendarDays, Clock3, Compass, Sparkles } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import type { HoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

type Muc = "thuan" | "binh" | "cham" | null;
type Nhip = "thuan" | "kha" | "binh" | "lech" | "cham";
interface Lop { mon: string; ten: string; nhan: string; cau: string; muc: Muc; duong?: string | null }
interface NgayTuan {
  ngay: string; thu: string; so: number; chu_de: string; hoang_dao: boolean; dep: boolean; tuoi: string | null; tuoi_ten: string | null;
  da_qua: boolean; hom_nay: boolean;
  // TUAN-V2 (engine cũ chưa có → khu rơi về bản gọn: lưới + ngày đáng để ý)
  lop?: Lop[]; nhip?: Nhip; tom?: string; viec_tot?: string[]; viec_luu_y?: string | null; gio_tot?: { chi: string; khung: string }[]; am?: string;
}
interface DongNoiBat { loai: "thuan" | "hop_tuoi" | "cham" | "mo_dau" | "khep"; ngay: string; thu: string; tieu_de: string; cau: string; can_cu: string[] }
interface Tuan {
  tu: string; den: string; ngay: NgayTuan[]; noi_bat: DongNoiBat[]; tom_tat: string; luu_y: string;
  viec_tuan?: { ma: string; ten: string; slug: string; ngay: string[] }[]; viec_tuan_luu_y?: string;
  moc?: { loai: string; ngay: string; thu: string; nhan: string; cau: string }[];
  phong_thuy?: { ten: string; loi: string; can_cu: string; thieu_gioi_tinh: boolean; duong: string };
  tuoi?: string | null;
}

const MAU_NB: Record<DongNoiBat["loai"], string> = {
  thuan: "border-jade/40 bg-jade/[0.06]", hop_tuoi: "border-jade/40 bg-jade/[0.06]", cham: "border-[#f0b35c]/40 bg-[#f0b35c]/[0.06]",
  mo_dau: "border-gold/40 bg-gold/[0.06]", khep: "border-moon/40 bg-moon/[0.06]",
};
// Nhịp chung của ngày (engine chấm từ hai lớp có mức: lịch + tuổi). Hổ phách thay đỏ.
const NHIP: Record<Nhip, { ten: string; cham: string; chu: string }> = {
  thuan: { ten: "Thuận", cham: "bg-jade", chu: "text-jade" },
  kha: { ten: "Khá thuận", cham: "bg-jade/50", chu: "text-jade" },
  binh: { ten: "Bình thường", cham: "bg-fg-faint/60", chu: "text-fg-muted" },
  lech: { ten: "Hai chiều", cham: "bg-moon", chu: "text-moon" },
  cham: { ten: "Nên đi chậm", cham: "bg-[#f0b35c]", chu: "text-[#f0b35c]" },
};
const MUC: Record<Exclude<Muc, null>, { ten: string; lop: string }> = {
  thuan: { ten: "Thuận", lop: "border-jade/50 text-jade" },
  binh: { ten: "Bình thường", lop: "border-line text-fg-muted" },
  cham: { ten: "Nên chậm", lop: "border-[#f0b35c]/60 text-[#f0b35c]" },
};
const dm = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;
const THU_NGAN = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function TuanCuaToi({ hoSo, ngay }: { hoSo: HoSo; ngay: string }) {
  const [t, setT] = useState<Tuan | null>(null);
  const [chon, setChon] = useState<string | null>(null);
  const khung = useRef<HTMLElement>(null);
  const bang = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let huy = false;
    fetch("/api/thanso/tuan", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, ngay_xem: ngay,
        ...(hoSo.gioi_tinh === "nam" || hoSo.gioi_tinh === "nu" ? { gioi_tinh: hoSo.gioi_tinh } : {}) }) })
      .then((r) => (r.ok ? (r.json() as Promise<Tuan>) : null))
      .then((j) => { if (!huy && j && Array.isArray(j.ngay) && j.ngay.length === 7) setT(j); else if (!huy) setT(null); })
      .catch(() => { if (!huy) setT(null); });   // lỗi → ẩn khu, không để tuần của hồ sơ / ngày trước
    return () => { huy = true; };
  }, [hoSo.ngay, hoSo.thang, hoSo.nam, hoSo.gioi_tinh, ngay]);
  // Mở từ thông báo sáng thứ Hai (/hom-nay#tuan-nay): khu vẽ SAU khi tải nên tự cuộn tới khi có dữ liệu.
  const coDuLieu = Boolean(t);
  useEffect(() => {
    if (coDuLieu && location.hash === "#tuan-nay") khung.current?.scrollIntoView({ block: "start" });
  }, [coDuLieu]);
  if (!t) return null;   // engine cũ / lỗi mạng → khu tự ẩn

  const dangChon = t.ngay.find((n) => n.ngay === chon) ?? t.ngay.find((n) => n.hom_nay) ?? t.ngay[0]!;
  const chonNgay = (iso: string, nguon: string, cuon = false) => {
    setChon(iso);
    const n = t.ngay.find((x) => x.ngay === iso);
    ghi("chart_interacted", { kind: "tuan_chon_ngay", muc: `${nguon}.${n?.nhip ?? "x"}` });
    if (cuon) bang.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  const nhieuLop = Boolean(dangChon.lop?.length);
  const mocTheoNgay = new Set((t.moc ?? []).map((m) => m.ngay));

  return (
    <section ref={khung} id="tuan-nay" aria-labelledby="tuan-nay-td" data-testid="tuan-cua-toi" data-neo
      className="glass scroll-mt-24 space-y-4 rounded-2xl p-4 sm:p-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="tuan-nay-td" className="text-xl">Tuần này của bạn</h2>
          <span className="text-sm tabular-nums text-fg-muted">{dm(t.tu)} – {dm(t.den)}{t.tuoi ? ` · tuổi ${t.tuoi}` : ""}</span>
        </div>
        <p className="text-sm text-fg-muted">{nhieuLop ? "Bảy ngày tới qua năm cách xem. Bấm một ngày để đọc ngày ấy theo từng môn." : null} {t.tom_tat}</p>
      </header>

      <div className={cn("grid gap-4", nhieuLop && "lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]")}>
        <div className="min-w-0 space-y-3">
          <div role="tablist" aria-label="Bảy ngày của tuần" className="grid grid-cols-7 gap-1.5" data-testid="tuan-luoi">
            {t.ngay.map((n, i) => {
              const dang = n.ngay === dangChon.ngay;
              const nh = n.nhip ? NHIP[n.nhip] : null;
              return (
                <button key={n.ngay} type="button" role="tab" aria-selected={dang} aria-controls="tuan-bang" data-ngay={n.ngay}
                  data-hom-nay={n.hom_nay ? 1 : 0} data-nhip={n.nhip ?? ""} onClick={() => chonNgay(n.ngay, "luoi")}
                  title={`${n.thu} ${dm(n.ngay)} — ngày cá nhân ${n.so}: ${n.chu_de}`}
                  className={cn("vung-cham relative rounded-xl border px-0.5 py-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold",
                    dang ? "border-gold bg-gold/10" : "border-line/60 hover:border-gold/50", n.da_qua && !dang && "opacity-55")}>
                  <span className={cn("block text-[0.7rem]", n.hom_nay ? "font-medium text-gold" : "text-fg-muted")}>
                    {n.hom_nay ? <><span className="sm:hidden">{THU_NGAN[i]}</span><span className="hidden sm:inline">Hôm nay</span></> : THU_NGAN[i]}</span>
                  <span className="block font-serif text-xl leading-tight text-gold">{n.so}</span>
                  <span className="block text-[0.65rem] tabular-nums text-fg-faint">{dm(n.ngay)}</span>
                  <span className="mt-1 flex items-center justify-center gap-1" aria-hidden>
                    {nh ? <span className={cn("size-2 rounded-full", nh.cham)} />
                      : <span className={cn("size-1.5 rounded-full", n.dep ? "bg-jade" : n.hoang_dao ? "bg-gold/70" : "bg-transparent")} />}
                    {mocTheoNgay.has(n.ngay) && <span className="size-1.5 rotate-45 bg-gold" />}
                  </span>
                  <span className="sr-only">{nh ? `${nh.ten}. ` : ""}{n.tuoi_ten && n.tuoi ? `${n.tuoi_ten} với tuổi bạn.` : ""}</span>
                </button>
              );
            })}
          </div>
          {nhieuLop && (
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-fg-faint" aria-hidden>
              {(Object.keys(NHIP) as Nhip[]).map((k) => (
                <span key={k}><i className={cn("mr-1 inline-block size-2 rounded-full align-middle", NHIP[k].cham)} />{NHIP[k].ten.toLowerCase()}</span>
              ))}
              <span><i className="mr-1 inline-block size-1.5 rotate-45 bg-gold align-middle" />có mốc lịch</span>
            </p>
          )}

          {nhieuLop && (
            <div ref={bang} id="tuan-bang" role="tabpanel" aria-live="polite" data-testid="tuan-bang" data-ngay={dangChon.ngay}
              className="scroll-mt-28 space-y-3 rounded-xl border border-line/70 bg-bg/40 p-3 sm:p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="font-serif text-lg">{dangChon.thu} {dm(dangChon.ngay)}{dangChon.am ? <span className="ml-2 text-xs font-sans text-fg-faint">âm lịch {dangChon.am}</span> : null}</h3>
                {dangChon.nhip && <span className={cn("text-sm font-medium", NHIP[dangChon.nhip].chu)} data-testid="tuan-nhip">{NHIP[dangChon.nhip].ten}</span>}
              </div>
              {dangChon.tom && <p className="text-sm">{dangChon.tom}</p>}
              <ul className="divide-y divide-line/50" data-testid="tuan-lop">
                {dangChon.lop!.map((l) => (
                  <li key={l.mon} data-mon={l.mon} className="grid gap-x-3 gap-y-0.5 py-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
                    <span className="text-xs uppercase tracking-wide text-fg-faint sm:pt-0.5">{l.ten}</span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <b className="font-medium text-fg">{l.nhan}</b>
                        {l.muc && <span className={cn("rounded-full border px-2 py-px text-[0.7rem]", MUC[l.muc].lop)}>{MUC[l.muc].ten}</span>}
                      </span>
                      <span className="mt-0.5 block text-sm text-fg-muted">{l.cau}
                        {l.duong && l.mon === "kinh_dich" && <> <Link href={l.duong} className="whitespace-nowrap text-gold hover:underline">Đọc quẻ</Link></>}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {(dangChon.viec_tot?.length ?? 0) > 0 && (
                <p className="flex flex-wrap items-center gap-1.5 text-sm" data-testid="tuan-viec-ngay">
                  <Sparkles className="size-4 shrink-0 text-jade" aria-hidden /><span className="text-fg-muted">Sách lịch ghi hợp:</span>
                  {dangChon.viec_tot!.map((v) => <span key={v} className="rounded-full border border-jade/40 px-2 py-0.5 text-xs text-jade">{v}</span>)}
                </p>
              )}
              {dangChon.viec_luu_y && <p className="text-xs text-fg-faint" data-testid="tuan-viec-luu-y">{dangChon.viec_luu_y}</p>}
              {(dangChon.gio_tot?.length ?? 0) > 0 && (
                <p className="flex flex-wrap items-center gap-1.5 text-sm" data-testid="tuan-gio">
                  <Clock3 className="size-4 shrink-0 text-gold" aria-hidden /><span className="text-fg-muted">Giờ tốt:</span>
                  {dangChon.gio_tot!.map((g) => <span key={g.chi} className="rounded-full border border-line px-2 py-0.5 text-xs tabular-nums text-fg-muted"><b className="font-medium text-fg">{g.chi}</b> {g.khung}</span>)}
                </p>
              )}
              <Link href={`/xem-ngay-tot/${dangChon.ngay}`} className="inline-block text-sm text-gold hover:underline">Xem kỹ ngày {dm(dangChon.ngay)}</Link>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          {(t.viec_tuan?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-line/70 p-3" data-testid="tuan-viec">
              <h3 className="flex items-center gap-1.5 text-sm font-medium"><CalendarDays className="size-4 text-gold" aria-hidden /> Tuần này hợp việc gì</h3>
              <ul className="mt-2 space-y-1.5">
                {t.viec_tuan!.map((v) => (
                  <li key={v.ma} className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="mr-1 text-fg-muted">{v.ten}:</span>
                    {v.ngay.map((iso) => (
                      <button key={iso} type="button" onClick={() => chonNgay(iso, "viec", true)}
                        className={cn("vung-cham rounded-full border px-2 py-0.5 text-xs tabular-nums transition-colors", iso === dangChon.ngay ? "border-gold bg-gold/15 text-gold" : "border-line text-fg hover:border-gold/60")}>
                        {THU_NGAN[t.ngay.findIndex((n) => n.ngay === iso)]} {dm(iso)}
                      </button>
                    ))}
                  </li>
                ))}
              </ul>
              {t.viec_tuan_luu_y && <p className="mt-2 text-[0.7rem] text-fg-faint">{t.viec_tuan_luu_y}</p>}
            </div>
          )}
          {(t.moc?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-line/70 p-3" data-testid="tuan-moc">
              <h3 className="text-sm font-medium">Mốc trong tuần</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {t.moc!.map((m) => (
                  <li key={`${m.loai}.${m.ngay}`}>
                    <button type="button" onClick={() => chonNgay(m.ngay, "moc", true)} className="text-left hover:text-gold">
                      <span className="tabular-nums text-gold">{m.thu} {dm(m.ngay)}</span> — {m.nhan}</button>
                    {m.cau && <span className="block text-xs text-fg-muted">{m.cau}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {t.phong_thuy?.loi && (
            <div className="rounded-xl border border-line/70 p-3" data-testid="tuan-phong-thuy">
              <h3 className="flex items-center gap-1.5 text-sm font-medium"><Compass className="size-4 text-gold" aria-hidden /> {t.phong_thuy.ten}</h3>
              <p className="mt-1.5 text-sm text-fg-muted">{t.phong_thuy.loi}</p>
              <details className="mt-1.5 text-xs text-fg-faint">
                <summary className="cursor-pointer hover:text-fg-muted">Vì sao nói vậy</summary>
                <p className="mt-1">{t.phong_thuy.can_cu}</p>
              </details>
              <Link href={t.phong_thuy.duong} className="mt-1.5 inline-block text-xs text-gold hover:underline">Xem nhà của bạn</Link>
            </div>
          )}
        </div>
      </div>

      {t.noi_bat.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Ngày đáng để ý</h3>
          <ul className="grid gap-2 sm:grid-cols-3" data-testid="tuan-noi-bat">
            {t.noi_bat.map((x) => (
              <li key={x.ngay} data-loai={x.loai} className={cn("rounded-xl border p-3 text-sm", MAU_NB[x.loai])}>
                <p className="font-medium text-fg">{x.tieu_de}</p>
                <p className="mt-1 text-fg-muted">{x.cau}</p>
                <p className="mt-1.5 text-[0.7rem] text-fg-faint">{x.can_cu.join(" · ")}</p>
                {nhieuLop
                  ? <button type="button" onClick={() => chonNgay(x.ngay, "noi_bat", true)} className="mt-1 inline-block text-xs text-gold hover:underline">Xem ngày {dm(x.ngay)} theo từng môn</button>
                  : <Link href={`/xem-ngay-tot/${x.ngay}`} className="mt-1 inline-block text-xs text-gold hover:underline">Xem kỹ ngày {dm(x.ngay)}</Link>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-fg-faint">{t.luu_y} Tử vi và Bát tự theo giờ sinh đọc theo tháng, không theo từng ngày —{" "}
        <Link href="/thoi-gian-toi" className="text-gold hover:underline">xem tháng này ở Thời gian tới</Link>.</p>
    </section>
  );
}
