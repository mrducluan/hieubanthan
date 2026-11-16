"use client";
// LA-UI (2026-11-16, chủ dự án yêu cầu) — lịch của MỘT NĂM ÂM: xem từng tháng âm (lưới 7 cột theo thứ, số lớn là ngày âm,
// số nhỏ là ngày dương) hoặc cả năm (12–13 thẻ tháng, mỗi thẻ một dải 29 / 30 vạch từ mùng 1 tới cuối tháng). Chọn trong 3
// phương án agent dựng: A "tờ lịch tháng âm" (chọn) · B "bảng trăng 30 cột" (ô 18px, điện thoại không bấm được ngày, không
// có thứ) · C "lịch treo tường dương – âm" (trùng lịch tháng của /xem-ngay-tot, tháng dương bị cắt ở hai đầu năm âm).
// Mượn của B dải vạch theo ngày âm cho thẻ năm, của C ô tra theo ngày dương. Mọi dữ kiện do engine tính
// (`/v1/lich/nam-ngay/{năm}`): web chỉ vẽ, không tự đổi lịch. `homNay` do máy chủ truyền (giờ Việt Nam) → không lệch hydrate.
// Đo: chart_interacted{mo_dun: "lich_am", kind: chon_thang | xem_nam | chon_ngay | tra_ngay | hom_nay | mo_ngay}.
import { useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ghi } from "@/lib/do-luong";
import { duongNgay } from "@/lib/hoang-lich";
import type { LichNgay, NgayAm, ThangAmNgay } from "@/lib/lich-am";

const THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const THU_DAI = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];
const dmy = (iso: string) => iso.split("-").reverse().join("/");
const dm = (iso: string) => `${Number(iso.slice(8))}/${Number(iso.slice(5, 7))}`;
const tenNgan = (t: ThangAmNgay) => (t.thang === 1 ? "Giêng" : t.thang === 12 ? "Chạp" : String(t.thang));
const ngayAmChu = (a: number) => (a <= 10 ? `Mùng ${a}` : a === 15 ? "Rằm" : `Ngày ${a}`);
/** Tên lễ gọn cho chip / thẻ năm: bỏ phần trong ngoặc ("Tết Nguyên đán (mùng 1 Tết)" → "Tết Nguyên đán"). */
const leGon = (s: string) => s.replace(/\s*\(.*\)$/, "");
const ghiDo = (kind: string, them: Record<string, unknown> = {}) => ghi("chart_interacted", { mo_dun: "lich_am", kind, ...them });

type Vi = { t: number; n: number };   // chỉ số tháng trong d.thang, chỉ số ngày trong tháng

export function LichAmNam({ d, homNay, className }: { d: LichNgay; homNay: string; className?: string }) {
  const viTri = useMemo(() => {
    const m = new Map<string, Vi>();
    d.thang.forEach((t, i) => t.ngay.forEach((n, j) => m.set(n.d, { t: i, n: j })));
    return m;
  }, [d]);
  const coHomNay = viTri.has(homNay);
  const [vi, setVi] = useState<Vi>(() => viTri.get(homNay) ?? { t: 0, n: 0 });
  const [che, setChe] = useState<"thang" | "nam">("thang");
  const dai = useRef<HTMLDivElement>(null);
  const thang = d.thang[vi.t]!, ngay = thang.ngay[vi.n]!;
  const tiet = useMemo(() => new Map(d.tiet_khi.map((x) => [x.ngay, x])), [d]);

  const chon = (v: Vi, kind?: string) => { setVi(v); setChe("thang"); if (kind) ghiDo(kind, { thang: d.thang[v.t]!.thang }); };
  const chonThang = (i: number, kind = "chon_thang") => {
    const t = d.thang[i]!;
    const j = t.ngay.findIndex((n) => n.d === homNay);
    chon({ t: i, n: j >= 0 ? j : 0 }, kind);
    requestAnimationFrame(() => dai.current?.querySelector<HTMLElement>(`[data-thang="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "center" }));
  };
  const buoc = (k: number) => {
    let { t, n } = vi;
    n += k;
    if (n < 0) { if (t === 0) return; t -= 1; n = d.thang[t]!.ngay.length - 1; }
    else if (n >= thang.ngay.length) { if (t === d.thang.length - 1) return; t += 1; n = 0; }
    chon({ t, n });
  };
  const suKien = thang.ngay.filter((n) => n.le?.length || n.tiet);
  const dau = thang.ngay[0]!.thu;   // ô trống trước mùng 1

  return (
    <section aria-labelledby="lich-am-nam" data-testid="lich-am-nam"
      className={`glass relative overflow-hidden rounded-3xl p-3 sm:p-6 ${className ?? ""}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" aria-hidden />
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-60">
          <h2 id="lich-am-nam" className="font-serif text-2xl leading-tight">{`Lịch âm năm ${d.can_chi} ${d.nam}`}</h2>
          <p className="mt-1 text-xs tabular-nums text-fg-faint">{dmy(d.tet)} → {dmy(d.thang[d.thang.length - 1]!.cuoi)} · {d.so_ngay} ngày · {d.thang.length} tháng âm{d.thang_nhuan ? ` · nhuận tháng ${d.thang_nhuan}` : ""}</p>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          <div className="inline-flex rounded-full border border-line bg-bg/60 p-[3px]" role="group" aria-label="Cách xem lịch">
            {([["thang", "Tháng"], ["nam", "Cả năm"]] as const).map(([k, ten]) => (
              <button key={k} type="button" aria-pressed={che === k} data-testid={`lich-am-che-${k}`}
                onClick={() => { setChe(k); if (k === "nam") ghiDo("xem_nam"); }}
                className={`min-h-11 rounded-full px-4 text-sm sm:min-h-9 ${che === k ? "bg-surface-2 text-fg shadow-[inset_0_0_0_1px_rgb(var(--gold)/0.45)]" : "text-fg-muted hover:text-fg"}`}>{ten}</button>
            ))}
          </div>
          {coHomNay && (
            <button type="button" onClick={() => { const v = viTri.get(homNay)!; chon(v, "hom_nay"); }} data-testid="lich-am-hom-nay"
              className="min-h-11 whitespace-nowrap rounded-full border border-gold/50 px-4 text-sm text-gold hover:bg-gold/10">Hôm nay</button>
          )}
        </div>
      </div>

      {/* Thanh tháng âm: Giêng … Chạp (đủ / thiếu / nhuận) — có ở cả hai cách xem. */}
      <div ref={dai} className="-mx-3 mt-3 flex gap-1.5 overflow-x-auto px-3 pb-2 [scrollbar-width:thin] sm:-mx-6 sm:px-6" role="group" aria-label="Chọn tháng âm">
        {d.thang.map((t, i) => {
          const dang = che === "thang" && i === vi.t, nay = coHomNay && viTri.get(homNay)!.t === i;
          return (
            <button key={`${t.thang}${t.nhuan ? "n" : ""}`} type="button" data-thang={i} aria-pressed={dang} onClick={() => chonThang(i)}
              aria-label={`${t.ten}, ${t.so_ngay === 30 ? "tháng đủ" : "tháng thiếu"}, từ ${dmy(t.mung_mot)}${nay ? ", tháng này" : ""}`}
              className={`flex min-h-[3.1rem] min-w-[3.1rem] shrink-0 flex-col items-center justify-center rounded-2xl border px-2 ${dang ? "border-gold/55 bg-surface-2 text-gold" : "border-transparent text-fg-muted hover:border-line"}`}>
              <span className="font-serif text-base leading-tight">{tenNgan(t)}{nay && <span className="ml-1 inline-block size-[5px] rounded-full bg-gold align-middle" aria-hidden />}</span>
              <span className={`text-[11px] leading-tight ${t.nhuan ? "text-moon" : "text-fg-faint"}`}>{t.nhuan ? "nhuận" : t.so_ngay === 30 ? "đủ" : "thiếu"}</span>
            </button>
          );
        })}
      </div>

      {che === "thang" ? (
        <div data-testid="lich-am-thang">
          <div className="mt-2 flex items-start gap-2.5">
            <button type="button" onClick={() => chonThang(vi.t - 1)} disabled={vi.t === 0} aria-label="Tháng âm trước"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg-muted enabled:hover:border-gold/50 enabled:hover:text-gold disabled:opacity-30"><ChevronLeft className="size-5" aria-hidden /></button>
            <div className="min-w-0 flex-1 text-center">
              <h3 className="font-serif text-[1.6rem] leading-tight" aria-live="polite">{thang.ten} <span className="text-gold">· {thang.can_chi}</span></h3>
              <p className="mt-1 text-[13px] tabular-nums text-fg-muted">Dương lịch {dmy(thang.mung_mot)} – {dmy(thang.cuoi)}</p>
            </div>
            <button type="button" onClick={() => chonThang(vi.t + 1)} disabled={vi.t === d.thang.length - 1} aria-label="Tháng âm sau"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg-muted enabled:hover:border-gold/50 enabled:hover:text-gold disabled:opacity-30"><ChevronRight className="size-5" aria-hidden /></button>
          </div>
          <p className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
            <span className={`rounded-full border px-2.5 py-0.5 ${thang.so_ngay === 30 ? "border-gold/40 text-gold" : "border-line text-fg-muted"}`}>{thang.so_ngay === 30 ? "Tháng đủ · 30 ngày" : "Tháng thiếu · 29 ngày"}</span>
            {thang.nhuan && <span className="rounded-full border border-moon/45 px-2.5 py-0.5 text-moon">Tháng nhuận</span>}
            <span className="rounded-full border border-line px-2.5 py-0.5 text-fg-muted"><b className="text-gold">{thang.so_hoang_dao}</b> ngày hoàng đạo</span>
            {thang.so_dep > 0 && <span className="rounded-full border border-jade/35 px-2.5 py-0.5 text-jade">✦ {thang.so_dep} ngày đẹp</span>}
          </p>
          {suKien.length > 0 && (
            <ul className="-mx-3 mt-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0" aria-label={`Ngày lễ và tiết khí trong ${thang.ten.replace(/^Tháng/, "tháng")}`}>
              {suKien.map((n) => (
                <li key={n.d} className="shrink-0">
                  <button type="button" onClick={() => chon({ t: vi.t, n: n.a - 1 }, "chon_ngay")}
                    className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl border border-line bg-surface-2/70 px-3 text-[13px] hover:border-gold/50 sm:min-h-8">
                    <span className={`tabular-nums ${n.le?.length ? "text-gold" : "text-moon"}`}>{n.a <= 10 ? `Mùng ${n.a}` : `Ngày ${n.a}`}</span>
                    <span>{[...(n.le ?? []).map(leGon), ...(n.tiet ? [`tiết ${n.tiet}`] : [])].join(" · ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_15.5rem] md:items-start md:gap-5">
            <div>
              <div className="grid grid-cols-7 gap-[3px] text-center text-[11px] uppercase tracking-wider text-fg-faint sm:gap-[5px]" aria-hidden>
                {THU.map((x) => <span key={x} className="pb-1.5">{x}</span>)}
              </div>
              <ol className="grid grid-cols-7 gap-[3px] sm:gap-[5px]" data-testid="lich-am-luoi">
                {Array.from({ length: dau }, (_, i) => <li key={`r${i}`} aria-hidden />)}
                {thang.ngay.map((n, j) => <ONgay key={n.d} n={n} chon={j === vi.n} nay={n.d === homNay} onClick={() => chon({ t: vi.t, n: j }, "chon_ngay")} />)}
              </ol>
            </div>
            <TheNgayAm n={ngay} thang={thang} nam={d} nay={ngay.d === homNay} tiet={tiet.get(ngay.d)} truoc={() => buoc(-1)} sau={() => buoc(1)}
              dauNam={vi.t === 0 && vi.n === 0} cuoiNam={vi.t === d.thang.length - 1 && vi.n === thang.ngay.length - 1} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line/60 pt-3 text-xs text-fg-muted">
            <label htmlFor="lich-am-tra" className="text-fg-muted">Tra theo ngày dương lịch:</label>
            <input id="lich-am-tra" type="date" min={d.tet} max={d.thang[d.thang.length - 1]!.cuoi} value={ngay.d} data-testid="lich-am-tra"
              onChange={(e) => { const v = viTri.get(e.target.value); if (v) chon(v, "tra_ngay"); }}
              className="min-h-11 rounded-lg border border-line bg-bg/60 px-2 text-sm text-fg [color-scheme:dark] sm:min-h-9" />
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs text-fg-muted" aria-label="Chú thích">
            <li className="inline-flex items-center gap-1.5"><span className="font-serif text-[15px] text-gold" aria-hidden>7</span>Số vàng: hoàng đạo</li>
            <li className="inline-flex items-center gap-1.5"><span className="text-jade" aria-hidden>✦</span>Ngày đẹp</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-[9px] rounded-full border-[1.5px] border-moon" aria-hidden />Mùng 1</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-[9px] rounded-full bg-moon" aria-hidden />Rằm</li>
            <li className="inline-flex items-center gap-1.5"><span className="h-[3px] w-[11px] rounded bg-gold" aria-hidden />Ngày lễ</li>
            <li className="inline-flex items-center gap-1.5"><span className="h-[3px] w-[11px] rounded bg-moon" aria-hidden />Tiết khí</li>
            {coHomNay && <li className="inline-flex items-center gap-1.5"><span className="size-[13px] rounded shadow-[inset_0_0_0_1.5px_rgb(var(--gold))]" aria-hidden />Hôm nay</li>}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-fg-faint">{d.chu_thich}</p>
        </div>
      ) : (
        <div data-testid="lich-am-ca-nam">
          <ul className="mt-2 grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {d.thang.map((t, i) => <TheThang key={`${t.thang}${t.nhuan ? "n" : ""}`} t={t} homNay={homNay} onClick={() => chonThang(i, "chon_thang")} />)}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-x-3.5 gap-y-1.5 border-t border-line/60 pt-3 text-xs text-fg-muted" aria-label="Chú thích">
            <li className="inline-flex items-center gap-1.5"><span className="h-3 w-[5px] rounded-sm bg-gold/80" aria-hidden />Hoàng đạo</li>
            <li className="inline-flex items-center gap-1.5"><span className="h-3 w-[5px] rounded-sm bg-jade" aria-hidden />Ngày đẹp</li>
            <li className="inline-flex items-center gap-1.5"><span className="h-3 w-[5px] rounded-sm bg-fg-faint/30" aria-hidden />Ngày thường</li>
            <li className="inline-flex items-center gap-1.5"><span className="size-[7px] rounded-full bg-moon" aria-hidden />Rằm</li>
            <li>Mỗi vạch là một ngày âm, từ mùng 1 tới cuối tháng. Bấm một tháng để mở tờ lịch.</li>
          </ul>
        </div>
      )}
    </section>
  );
}

function ONgay({ n, chon, nay, onClick }: { n: NgayAm; chon: boolean; nay: boolean; onClick: () => void }) {
  const dauThangDuong = n.d.endsWith("-01");
  const nhan = `${ngayAmChu(n.a)} âm lịch, ${THU_DAI[n.thu]} ${dmy(n.d)}, ${n.hd ? "hoàng đạo" : "hắc đạo"}${n.dep ? ", ngày đẹp" : ""}`
    + `${n.le?.length ? ", " + n.le.join(", ") : ""}${n.tiet ? `, tiết ${n.tiet}` : ""}${nay ? ", hôm nay" : ""}`;
  return (
    <li>
      <button type="button" onClick={onClick} aria-pressed={chon} aria-current={nay ? "date" : undefined} aria-label={nhan} data-ngay={n.d}
        className={`relative flex min-h-[3.75rem] w-full flex-col items-center justify-center rounded-xl border px-0.5 pb-3 pt-4 transition-colors sm:min-h-[4.25rem]
          ${chon ? "border-fg bg-surface-2" : n.le?.length ? "border-gold/40 bg-gold/[0.06] hover:border-gold/70" : "border-line/55 bg-bg/30 hover:border-fg-muted/50"}
          ${nay ? "shadow-[inset_0_0_0_1.5px_rgb(var(--gold))]" : ""}`}>
        {nay && <span className="absolute -top-[7px] left-1 rounded-md bg-gold px-1 text-[11px] font-semibold leading-[1.15] text-bg" aria-hidden>Nay</span>}
        {(n.a === 1 || n.a === 15) && <span className={`absolute left-[5px] size-[9px] rounded-full border-[1.5px] border-moon ${nay ? "top-[9px]" : "top-1"} ${n.a === 15 ? "bg-moon shadow-[0_0_8px_rgb(var(--moon)/0.7)]" : ""}`} aria-hidden />}
        <span className="absolute right-[5px] top-1 text-[11px] leading-none tabular-nums text-fg-faint" aria-hidden>
          {Number(n.d.slice(8))}<span className={dauThangDuong ? "" : "hidden sm:inline"}>/{Number(n.d.slice(5, 7))}</span>
        </span>
        <span className={`font-serif text-[1.3rem] leading-none sm:text-2xl ${n.hd ? "text-gold" : "text-fg"}`} aria-hidden>{n.a}</span>
        <span className="absolute bottom-1 left-[5px] flex gap-[3px]" aria-hidden>
          {n.le?.length ? <span className="h-[3px] w-2.5 rounded bg-gold" /> : null}
          {n.tiet ? <span className="h-[3px] w-2.5 rounded bg-moon" /> : null}
        </span>
        {n.dep && <span className="absolute bottom-0.5 right-1 text-[11px] leading-none text-jade" aria-hidden>✦</span>}
      </button>
    </li>
  );
}

function TheNgayAm({ n, thang, nam, nay, tiet, truoc, sau, dauNam, cuoiNam }: {
  n: NgayAm; thang: ThangAmNgay; nam: LichNgay; nay: boolean; tiet?: { ten: string; nghia: string; gio: string };
  truoc: () => void; sau: () => void; dauNam: boolean; cuoiNam: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line/80 bg-surface-2/55 p-4" data-testid="lich-am-the-ngay" aria-live="polite">
      <p className="text-[13px] tabular-nums text-fg-muted">{THU_DAI[n.thu]}, {dmy(n.d)}{nay && <b className="text-gold"> · Hôm nay</b>}</p>
      <p className="mt-1 font-serif text-[1.55rem] leading-tight"><span className="text-gold">{ngayAmChu(n.a)}</span> {thang.ten.replace(/^Tháng/, "tháng")}</p>
      <p className="mt-0.5 text-[13px] text-fg-muted">Ngày {n.cc} · tháng {thang.can_chi} · năm {nam.can_chi}</p>
      <p className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
        <span className={`rounded-full border px-2.5 py-0.5 ${n.hd ? "border-gold/45 text-gold" : "border-line text-fg-muted"}`}>{n.hd ? "Hoàng đạo" : "Hắc đạo"} · {n.th}</span>
        {n.dep && <span className="rounded-full border border-jade/40 px-2.5 py-0.5 text-jade">✦ Ngày đẹp</span>}
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13.5px]">
        {n.le?.length ? <><dt className="text-fg-faint">Ngày lễ</dt><dd className="text-gold">{n.le.join(" · ")}</dd></> : null}
        {tiet ? <><dt className="text-fg-faint">Tiết khí</dt><dd><span className="text-moon">{tiet.ten}</span> <span className="tabular-nums text-fg-muted">({tiet.gio})</span>
          <span className="block text-xs text-fg-muted">{tiet.nghia}</span></dd></> : null}
        <dt className="text-fg-faint">Trực</dt><dd>{n.tr}</dd>
        {n.ky?.length ? <><dt className="text-fg-faint">Dân gian kiêng</dt><dd>{n.ky.join(", ")}<span className="block text-xs text-fg-muted">Tập quán, để tham khảo.</span></dd></> : null}
      </dl>
      <Link href={duongNgay(n.d)} onClick={() => ghiDo("mo_ngay")} data-testid="lich-am-mo-ngay"
        className="mt-3.5 flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-gold px-4 text-sm font-semibold text-bg hover:brightness-105">Giờ tốt, việc nên làm <ArrowRight className="size-4" aria-hidden /></Link>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={truoc} disabled={dauNam} className="min-h-11 flex-1 rounded-full border border-line text-[13px] text-fg-muted enabled:hover:text-fg disabled:opacity-35">‹ Ngày trước</button>
        <button type="button" onClick={sau} disabled={cuoiNam} className="min-h-11 flex-1 rounded-full border border-line text-[13px] text-fg-muted enabled:hover:text-fg disabled:opacity-35">Ngày sau ›</button>
      </div>
    </div>
  );
}

/** Thẻ tháng trong "Cả năm": dải vạch theo ngày âm (mùng 1 → 29 / 30), rằm có chấm trăng, hôm nay viền vàng. */
function TheThang({ t, homNay, onClick }: { t: ThangAmNgay; homNay: string; onClick: () => void }) {
  const le = t.ngay.filter((n) => n.le?.length), tiet = t.ngay.filter((n) => n.tiet);
  const coNay = t.ngay.some((n) => n.d === homNay);
  return (
    <li>
      <button type="button" onClick={onClick} data-testid="lich-am-the-thang"
        className={`block h-full w-full rounded-2xl border bg-bg/35 p-3 text-left transition-colors hover:border-gold/55 hover:bg-surface-2/50 ${coNay ? "border-gold/50" : "border-line/80"}`}>
        <span className="flex items-center justify-between gap-1.5">
          <span className="whitespace-nowrap font-serif text-lg leading-tight text-fg">{t.ten}</span>
          <span className={`whitespace-nowrap rounded-full border px-1.5 text-[11px] ${t.nhuan ? "border-moon/45 text-moon" : t.so_ngay === 30 ? "border-gold/40 text-gold" : "border-line text-fg-muted"}`}>{t.so_ngay === 30 ? "đủ" : "thiếu"}</span>
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] tabular-nums text-fg-faint">{t.can_chi} · {dm(t.mung_mot)} – {dm(t.cuoi)}</span>
        <span className="mt-2.5 flex items-end gap-px" aria-hidden>
          {t.ngay.map((n) => (
            <span key={n.d} className="relative flex-1">
              {n.a === 15 && <span className="absolute -top-2 left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-moon" />}
              <span className={`block h-3.5 rounded-[2px] ${n.dep ? "bg-jade" : n.hd ? "bg-gold/80" : "bg-fg-faint/25"} ${n.d === homNay ? "outline outline-[1.5px] outline-offset-1 outline-fg" : ""}`} />
              {n.le?.length ? <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded bg-gold" /> : n.tiet ? <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded bg-moon" /> : null}
            </span>
          ))}
        </span>
        <span className="mt-3 block min-h-[2.1rem] text-[11.5px] leading-snug text-fg-muted">
          {le.slice(0, 2).map((n) => <span key={n.d} className="block truncate"><span className="tabular-nums text-gold">{n.a}</span> · {leGon(n.le![0]!)} <span className="text-fg-faint">({THU[n.thu]} {dm(n.d)})</span></span>)}
          {le.length < 2 && tiet.slice(0, 2 - le.length).map((n) => <span key={n.d} className="block truncate"><span className="tabular-nums text-moon">{n.a}</span> · tiết {n.tiet} <span className="text-fg-faint">({dm(n.d)})</span></span>)}
        </span>
        <span className="mt-1 block text-[11px] text-fg-faint"><b className="font-normal text-gold">{t.so_hoang_dao}</b> hoàng đạo{t.so_dep ? <> · <span className="text-jade">{t.so_dep} đẹp</span></> : null}{coNay ? " · tháng này" : ""}</span>
      </button>
    </li>
  );
}
