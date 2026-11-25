"use client";
// BD-1 — "Bản đồ lá số" Bát tự (thay bản nháp PR #335). Tám chữ của tứ trụ thành một dải 4 cột × 2 hàng bấm được:
// mỗi chữ mở bảng nghĩa bốn lớp (là gì · nằm ở đâu trong đời · nối với chữ nào · năm tới nào chạm vào) + "Vì sao nói vậy".
// Bốn cách xem: Tầng đời (gốc – mầm – hoa – quả, quãng tuổi theo Tam Mệnh Thông Hội) · Người quanh bạn · Năm hành (hai
// cách lấy dụng thần, không chọn thay) · Theo năm (C: kéo năm / đại vận, năm đã qua hai cách nói khác nhau thì hỏi lại —
// dùng chung câu trả lời với khối "Cách nào đúng với bạn?"). Web CHỈ vẽ: lời, quan hệ, tuổi, năm, mức đều do engine.
// Đo: chart_interacted{mo_dun: battu, kind: ban_do_*} — chỉ mã ô / cách xem, không năm, không câu trả lời.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Map as IconMap, X } from "lucide-react";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { TenHienProvider, useTen } from "@/components/khung/TenHien";
import { useChuBatTu } from "@/components/huyen-hoc/chu-bat-tu";
import { usePost } from "@/lib/goi-api";
import { ghi } from "@/lib/do-luong";
import { useCuaLuanGiai } from "@/lib/cta-sao";
import { capNoi, cauDoiChieu, duongNoi, slugHanh, type BanDoBatTu as BD, type LoaiNoi, type MaO, type NamBanDo, type OBanDo } from "@/lib/battu-ban-do";
import { ghiLa, ketQua, khoaLaSo, useCachChinh, useTraLoi, type Cach, type TraLoi } from "@/lib/cach-chinh-battu";
import { cn } from "@/lib/utils";

type Che = "tang" | "nguoi" | "hanh" | "nam";
const CHE: Che[] = ["tang", "nguoi", "hanh", "nam"];
const MAU_LOAI: Record<LoaiNoi, string> = {
  hop: "rgb(233 196 106)", trung: "rgb(233 196 106)", xung: "rgb(217 151 58)",
  hinh: "rgb(185 167 255)", hai: "rgb(185 167 255)", pha: "rgb(185 167 255)",
};
const NET_LOAI: Record<LoaiNoi, string | undefined> = { hop: undefined, trung: undefined, xung: "6 5", hinh: "2 4", hai: "2 4", pha: "2 4" };

type LaSo = { birth_date: string; birth_time?: string | null; gender?: string } & Record<string, unknown>;

export function BanDoBatTu({ laSo }: { laSo: LaSo }) {
  const { data } = usePost<BD>("/api/battu/ban-do", { la_so: laSo });
  if (!data?.o?.length) return null;
  return <TenHienProvider ten={[data.ten_hien]}><BanDo bd={data} khoa={khoaLaSo(laSo)} /></TenHienProvider>;
}

function BanDo({ bd, khoa }: { bd: BD; khoa: string | null }) {
  const { c, tru } = useChuBatTu();
  const ten = useTen();
  const [che, setChe] = useState<Che>("tang");
  const [chon, setChon] = useState<MaO | null>(null);
  const [noiBat, setNoiBat] = useState<string | null>(null);
  const tg = bd.thoi_gian;
  const [nam, setNam] = useState(tg.nam_xem);
  const traLoi = useTraLoi(khoa);
  const chinh = useCachChinh(khoa);
  const cuaLg = useCuaLuanGiai();

  const oTheoMa = useMemo(() => Object.fromEntries(bd.o.map((o) => [o.ma, o])) as Record<MaO, OBanDo>, [bd.o]);
  const cap = useMemo(() => capNoi(bd.o), [bd.o]);
  const namDang = tg.nam.find((n) => n.nam === nam) ?? tg.nam[tg.nam.length - 1]!;
  const chamNam = useMemo(() => new Map((che === "nam" ? namDang.cham : []).map((x) => [x.o, x.loai])), [che, namDang]);
  const sang = new Set<MaO>(
    chon ? [chon, ...oTheoMa[chon]!.noi_voi.map((n) => n.o)]
      : noiBat ? bd.noi_bat.find((x) => x.ma === noiBat)?.o ?? [] : [],
  );
  const capHien = chon ? cap.filter((x) => x.a === chon || x.b === chon) : che === "nam" ? [] : cap;

  const chonO = (ma: MaO) => {
    setNoiBat(null);
    setChon((x) => (x === ma ? null : ma));
    if (chon !== ma) ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_o", o: ma, che });
  };
  const doiChe = (x: Che) => {
    setChe(x); setChon(null); setNoiBat(null);
    ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_che", che: x });
  };
  const moChuong = (ma: string) => {
    ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_chuong", chuong: ma });
    setChon(null);
    if (cuaLg && cuaLg.moDun === "battu" && !cuaLg.daTai) {
      history.replaceState(null, "", `#lg-${ma}`);   // báo cáo tải xong tự mở đúng chương theo #lg-…
      cuaLg.doc();
      requestAnimationFrame(() => document.getElementById("luan-giai")?.scrollIntoView({ block: "start" }));
    } else {
      window.dispatchEvent(new CustomEvent("hbt:mo-chuong", { detail: { mo_dun: "battu", ma } }));
    }
  };

  return (
    <section aria-labelledby="bd-tieu-de" data-testid="ban-do-bat-tu"
      className="glass rounded-3xl p-4 sm:p-6">
      <h2 id="bd-tieu-de" className="flex items-center gap-2 font-serif text-2xl">
        <IconMap className="size-6 text-gold" aria-hidden /> {c("bd.tieu_de")}
      </h2>
      <p className="mt-1.5 text-sm text-fg-muted">{c("bd.dan")}</p>

      <div role="tablist" aria-label={c("bd.xem_theo")} className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {CHE.map((x) => (
          <button key={x} type="button" role="tab" aria-selected={che === x} onClick={() => doiChe(x)}
            data-testid={`bd-che-${x}`}
            className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              che === x ? "border-gold/70 bg-gold/10 text-fg" : "border-line/70 text-fg-muted hover:border-gold/40")}>
            {c(`bd.che.${x}`)}
          </button>
        ))}
      </div>

      {che !== "nam" && bd.noi_bat.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow">{c("bd.noi_bat")}</p>
          <ul className="mt-2 grid gap-2">
            {bd.noi_bat.map((x) => (
              <li key={x.ma}>
                <button type="button" aria-pressed={noiBat === x.ma} data-testid={`bd-noi-bat-${x.ma}`}
                  onClick={() => {
                    setChon(null);
                    setNoiBat((v) => (v === x.ma ? null : x.ma));
                    if (noiBat !== x.ma) ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_noi_bat", ma: x.ma });
                  }}
                  className={cn("w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                    noiBat === x.ma ? "border-gold/60 bg-gold/[0.07] text-fg" : "border-line/60 text-fg-muted hover:border-gold/40")}>
                  {x.cau}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={cn("mt-5 grid gap-5", che !== "nam" && "lg:grid-cols-[minmax(0,1fr)_22rem]")}>
        <div className="min-w-0">
          {/* Đầu cột: tên trụ + tầng đời + quãng tuổi (engine). */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {bd.tru.map((t) => (
              <div key={t.i} className={cn("rounded-lg px-1 py-1", t.dang_o && che === "tang" && "bg-gold/10")}>
                <p className="text-xs font-semibold text-fg">{tru(t.i, "tru")}</p>
                <p className="text-[0.7rem] text-fg-muted">{t.tang}</p>
                {che === "tang" && (
                  <p className="text-[0.68rem] text-fg-faint">
                    {t.tuoi_den == null ? c("bd.tuoi_tu", { tu: String(t.tuoi_tu) }) : c("bd.tuoi", { tu: String(t.tuoi_tu), den: String(t.tuoi_den) })}
                  </p>
                )}
                {che === "tang" && t.dang_o && <p className="text-[0.66rem] font-semibold text-gold">{c("bd.dang_o")}</p>}
              </div>
            ))}
          </div>

          <div className="relative" style={{ paddingBlock: "3rem" }}>
            <svg aria-hidden viewBox="0 -44.44 400 288.89" preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 size-full">
              {capHien.map((x) => (
                <path key={`${x.a}${x.b}${x.loai}`} d={duongNoi(x.a, x.b)} fill="none" stroke={MAU_LOAI[x.loai]}
                  strokeWidth={chon ? 2.2 : 1.3} strokeDasharray={NET_LOAI[x.loai]} vectorEffect="non-scaling-stroke"
                  opacity={chon ? 0.95 : 0.45} />
              ))}
            </svg>
            <div className="relative grid grid-cols-4 grid-rows-2 gap-2" style={{ height: "13.5rem" }}>
              {(["c", "z"] as const).flatMap((h) => [0, 1, 2, 3].map((i) => oTheoMa[`${h}${i}` as MaO])).map((o) => (
                <O key={o.ma} o={o} che={che} chon={chon === o.ma} sang={sang.has(o.ma)} mo={sang.size > 0 && !sang.has(o.ma)}
                  loaiNam={chamNam.get(o.ma)} onChon={() => chonO(o.ma)} />
              ))}
            </div>
          </div>
          {che !== "nam" && <p className="text-[0.7rem] text-fg-faint">{c("bd.chu_giai_noi")}</p>}
          {che === "hanh" && <p className="mt-1 text-[0.7rem] text-fg-faint">{c("bd.chu_giai_hanh")}</p>}
        </div>

        {che === "nam" ? (
          <TheoNam bd={bd} nam={nam} setNam={setNam} namDang={namDang} traLoi={traLoi} khoa={khoa} chinh={chinh} moChuong={moChuong} />
        ) : (
          <BangO o={chon ? oTheoMa[chon]! : null} oTheoMa={oTheoMa} onDong={() => setChon(null)} onChon={chonO} moChuong={moChuong} ten={ten} />
        )}
      </div>
    </section>
  );
}

function O({ o, che, chon, sang, mo, loaiNam, onChon }: {
  o: OBanDo; che: Che; chon: boolean; sang: boolean; mo: boolean; loaiNam?: LoaiNoi; onChon: () => void;
}) {
  const { c } = useChuBatTu();
  const ten = useTen();
  const chu = o.hang === "can" ? ten("can", o.can ?? "") : ten("chi", o.chi ?? "");
  const duoi = che === "nam" && loaiNam ? c(`bd.loai.${loaiNam}`) : o.la_ban ? c("bd.ban")
    : che === "nguoi" ? o.nguoi ?? ""
      : che === "hanh" ? (o.dung ? c(`bd.dung.${o.dung}`) : ten("hanh", o.hanh))
        : che === "nam" ? (loaiNam ? c(`bd.loai.${loaiNam}`) : "")
          : o.thap_than ? ten("thap_than", o.thap_than) : "";
  return (
    <button type="button" onClick={onChon} aria-pressed={chon} data-testid={`bd-o-${o.ma}`}
      aria-label={`${chu} — ${duoi}`}
      data-hanh={slugHanh(o.hanh)}
      style={loaiNam ? { borderColor: MAU_LOAI[loaiNam], boxShadow: `0 0 0 1px ${MAU_LOAI[loaiNam]}` } : undefined}
      className={cn("bd-hanh flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-1 text-center transition",
        "bg-[rgb(var(--bg)/0.82)] hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        che === "hanh" ? "border-[rgb(var(--hanh)/0.55)] bg-[rgb(var(--hanh)/0.12)]" : "border-line/70",
        o.la_ban && "border-gold/70",
        chon && "border-gold ring-2 ring-gold/60", sang && !chon && "border-gold/60", mo && "opacity-45",
        che === "nam" && !loaiNam && "opacity-55")}>
      <span className="font-serif text-[1.65rem] leading-none sm:text-4xl" style={{ color: "rgb(var(--hanh))" }}>{chu}</span>
      <span className={cn("line-clamp-2 max-w-full text-[0.68rem] leading-tight sm:text-xs",
        o.la_ban ? "font-semibold text-gold" : che === "hanh" && o.dung ? "text-fg" : "text-fg-muted")}>{duoi}</span>
    </button>
  );
}

// Máy tính (≥ lg): bảng nghĩa nằm trong khung. Điện thoại: tấm trượt từ đáy, đưa ra <body> qua portal — khung `glass`
// có backdrop-filter tạo lớp xếp chồng riêng, z-index bên trong không thắng được thanh tab dưới.
const MQ = "(min-width: 1024px)";
function useMayTinh() {
  return useSyncExternalStore(
    (f) => { const m = window.matchMedia(MQ); m.addEventListener("change", f); return () => m.removeEventListener("change", f); },
    () => window.matchMedia(MQ).matches,
    () => true,
  );
}

function BangO({ o, oTheoMa, onDong, onChon, moChuong, ten }: {
  o: OBanDo | null; oTheoMa: Record<MaO, OBanDo>; onDong: () => void; onChon: (m: MaO) => void; moChuong: (ma: string) => void;
  ten: ReturnType<typeof useTen>;
}) {
  const { c } = useChuBatTu();
  const tieuDe = useRef<HTMLHeadingElement>(null);
  const mayTinh = useMayTinh();
  useEffect(() => {
    if (!o) return;
    tieuDe.current?.focus({ preventScroll: window.matchMedia(MQ).matches });
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onDong(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [o, onDong]);
  if (!o) {
    return (
      <div className="hidden items-center justify-center rounded-2xl border border-dashed border-line/70 p-6 text-center text-sm text-fg-muted lg:flex">
        {c("bd.cham_de_xem")}
      </div>
    );
  }
  const chuO = (x: OBanDo) => (x.hang === "can" ? ten("can", x.can ?? "") : ten("chi", x.chi ?? ""));
  const bang = (
    <>
      {/* Điện thoại: tấm trượt từ đáy; máy tính: cột phải trong khung. */}
      <div aria-hidden className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={onDong} />
      <div role="dialog" aria-modal="false" aria-labelledby="bd-o-tieu-de" data-testid="bd-bang-o"
        className="fixed inset-x-0 bottom-0 z-[61] max-h-[78vh] pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto rounded-t-3xl border border-line/70 bg-[rgb(var(--bg))] p-5 shadow-2xl
          lg:static lg:z-auto lg:max-h-[34rem] lg:rounded-2xl lg:bg-transparent lg:p-4 lg:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <h3 id="bd-o-tieu-de" ref={tieuDe} tabIndex={-1} className="font-serif text-2xl outline-none">
            <span className="bd-hanh" data-hanh={slugHanh(o.hanh)} style={{ color: "rgb(var(--hanh))" }}>{chuO(o)}</span>
            <span className="ml-2 text-base text-fg-muted">{o.la_ban ? c("bd.ban") : o.thap_than ? ten("thap_than", o.thap_than) : ""}</span>
          </h3>
          <button type="button" onClick={onDong} aria-label={c("bd.dong")} className="rounded-full p-1.5 text-fg-muted hover:text-fg">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <Muc tieu={c("bd.muc.la_gi")} ds={o.la_gi} />
        <Muc tieu={c("bd.muc.o_dau")} ds={o.o_dau} />
        {o.noi_voi.length > 0 && (
          <div className="mt-4">
            <p className="eyebrow">{c("bd.muc.noi_voi")}</p>
            <ul className="mt-1.5 space-y-1.5">
              {o.noi_voi.map((n) => (
                <li key={n.o + n.loai}>
                  <button type="button" onClick={() => onChon(n.o)}
                    className="flex w-full gap-2 rounded-lg px-1 py-1 text-left text-sm text-fg-muted hover:bg-fg/5">
                    <span className="mt-1.5 inline-block h-0.5 w-4 shrink-0" aria-hidden
                      style={{ background: MAU_LOAI[n.loai] }} />
                    <span><b className="font-semibold text-fg">{chuO(oTheoMa[n.o])}</b> · {n.cau}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {o.nam.length > 0 && <Muc tieu={c("bd.muc.nam")} ds={o.nam.map((n) => n.cau)} />}
        <details className="mt-4 rounded-xl border border-line/60 px-3 py-2">
          <summary className="cursor-pointer text-sm text-fg-muted">{c("bd.muc.vi_sao")}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-fg-muted">
            {o.vi_sao.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </details>
        <button type="button" onClick={() => moChuong(o.chuong)} data-testid="bd-doc-chuong"
          className="mt-4 w-full rounded-full border border-gold/60 px-4 py-2 text-sm font-medium text-fg hover:bg-gold/10">
          {c("bd.doc_chuong", { chuong: c(`bd.chuong.${o.chuong}`) })}
        </button>
      </div>
    </>
  );
  return mayTinh ? bang : createPortal(bang, document.body);
}

function Muc({ tieu, ds }: { tieu: string; ds: string[] }) {
  if (!ds.length) return null;
  return (
    <div className="mt-4">
      <p className="eyebrow">{tieu}</p>
      <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-fg">{ds.map((x) => <p key={x}>{x}</p>)}</div>
    </div>
  );
}

function TheoNam({ bd, nam, setNam, namDang, traLoi, khoa, chinh, moChuong }: {
  bd: BD; nam: number; setNam: (n: number) => void; namDang: NamBanDo; traLoi: Record<string, TraLoi>;
  khoa: string | null; chinh?: Cach; moChuong: (ma: string) => void;
}) {
  const { c } = useChuBatTu();
  const tg = bd.thoi_gian;
  const dau = tg.nam[0]!.nam, cuoi = tg.nam[tg.nam.length - 1]!.nam, tong = cuoi - dau || 1;
  const pt = (n: number) => `${((n - dau) / tong) * 100}%`;
  const cau = useMemo(() => cauDoiChieu(bd), [bd]);
  const kq = ketQua({ cau, luat: tg.luat }, traLoi);
  const daTra = cau.filter((x) => traLoi[x.ma] && traLoi[x.ma] !== "khong_nho").length;
  const nhanMuc = (m: string) => tg.lua_chon.find((x) => x.ma === m)?.nhan ?? m;
  const van = namDang.dai_van != null ? tg.dai_van.find((v) => v.i === namDang.dai_van) : undefined;
  const tl = namDang.ma ? traLoi[namDang.ma] : undefined;
  const nghieng: Cach | null = kq.ma === "cach_1" || kq.ma === "nghieng_1" ? "cach_1" : kq.ma === "cach_2" || kq.ma === "nghieng_2" ? "cach_2" : null;

  const tra = (t: TraLoi) => {
    if (!khoa || !namDang.ma) return;
    const moi = { ...traLoi, [namDang.ma]: t };
    ghiLa(khoa, { tra_loi: moi, ...(chinh ? { chinh } : {}) });
    const r = ketQua({ cau, luat: tg.luat }, moi);
    ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_tra_loi", so_cau: r.so_cau, khop_1: r.khop_1, khop_2: r.khop_2 });
  };
  const doi = (d: number) => setNam(Math.min(cuoi, Math.max(dau, nam + d)));

  return (
    <div className="space-y-4" data-testid="bd-theo-nam">
      <div>
        <p className="eyebrow">{c("bd.nam.van")}</p>
        <div className="relative mt-1.5 h-8 overflow-hidden rounded-lg border border-line/60">
          {tg.dai_van.filter((v) => v.den_nam >= dau && v.tu_nam <= cuoi).map((v) => {
            const tu = Math.max(v.tu_nam, dau), den = Math.min(v.den_nam, cuoi);
            const dang = nam >= v.tu_nam && nam <= v.den_nam;
            return (
              <button key={v.i} type="button" onClick={() => setNam(Math.min(cuoi, Math.max(dau, v.tu_nam)))}
                title={v.cau}
                className={cn("absolute inset-y-0 border-r border-line/50 px-1 text-[0.66rem] transition-colors",
                  dang ? "bg-gold/15 text-fg" : "text-fg-faint hover:bg-fg/5")}
                style={{ left: pt(tu), width: `calc(${pt(den + 1)} - ${pt(tu)})` }}>
                <span className="block truncate">{v.tu_tuoi}+</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="relative h-4">
          {tg.nam.filter((n) => n.ma && n.dc).map((n) => (
            <span key={n.nam} aria-hidden className={cn("absolute top-1 size-2 -translate-x-1/2 rounded-full",
              traLoi[n.ma!] ? "bg-gold" : "border border-gold")} style={{ left: pt(n.nam) }} />
          ))}
          <span aria-hidden className="absolute top-0 h-4 w-0.5 -translate-x-1/2 bg-moon" style={{ left: pt(tg.nam_xem) }} />
        </div>
        <input type="range" min={dau} max={cuoi} value={nam} onChange={(e) => setNam(Number(e.target.value))}
          aria-label={c("bd.nam.chon")} data-testid="bd-nam-truot" className="w-full accent-[rgb(233_196_106)]" />
        <div className="mt-1 flex items-center justify-between gap-2">
          <button type="button" onClick={() => doi(-1)} aria-label={c("bd.nam.truoc")} className="rounded-full border border-line/70 p-1.5"><ChevronLeft className="size-4" aria-hidden /></button>
          <p className="font-serif text-xl tabular-nums" aria-live="polite">{nam}</p>
          <div className="flex items-center gap-1.5">
            {nam !== tg.nam_xem && (
              <button type="button" onClick={() => setNam(tg.nam_xem)} className="rounded-full border border-line/70 px-2.5 py-1 text-xs">{c("bd.nam.nay")}</button>
            )}
            <button type="button" onClick={() => doi(1)} aria-label={c("bd.nam.sau")} className="rounded-full border border-line/70 p-1.5"><ChevronRight className="size-4" aria-hidden /></button>
          </div>
        </div>
        <p className="mt-2 text-xs text-fg-faint">{tg.hoi_dan}</p>
      </div>

      <div className="rounded-2xl border border-line/70 p-4" data-testid="bd-the-nam">
        <p className="font-medium text-fg">{namDang.cau}</p>
        {van && <p className="mt-1.5 text-sm text-fg-muted">{van.cau}</p>}
        {namDang.chi_tiet.length > 0
          ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">{namDang.chi_tiet.map((x) => <li key={x}>{x}</li>)}</ul>
          : <p className="mt-2 text-sm text-fg-muted">{c("bd.nam.khong_cham")}</p>}

        {namDang.ma && namDang.dc && namDang.hoi && (
          <div className="mt-4 border-t border-line/60 pt-3">
            <p className="text-sm text-fg">{namDang.hoi}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tg.lua_chon.map((x) => (
                <button key={x.ma} type="button" aria-pressed={tl === x.ma} onClick={() => tra(x.ma)}
                  data-testid={`bd-tra-${x.ma}`}
                  className={cn("rounded-full border px-3 py-1.5 text-sm",
                    tl === x.ma ? "border-gold bg-gold/15 text-fg" : "border-line/70 text-fg-muted hover:border-gold/50")}>
                  {x.nhan}
                </button>
              ))}
            </div>
            {tl && (
              <p className="mt-2 text-sm text-fg-muted" data-testid="bd-hai-cach">
                {tl !== "khong_nho" && <>{c("bd.nam.ban_ke", { tl: nhanMuc(tl) })} </>}
                {c("bd.nam.hai_cach", { ca: tg.cach.cach_1.ten, ma: nhanMuc(namDang.dc[0]), cb: tg.cach.cach_2.ten, mb: nhanMuc(namDang.dc[1]) })}
              </p>
            )}
          </div>
        )}

        {!namDang.qua && (
          <button type="button" onClick={() => moChuong("van_han")}
            className="mt-3 text-left text-sm text-gold underline-offset-4 hover:underline">{tg.nam_toi}</button>
        )}
      </div>

      {cau.length > 0 && (
        <div className="rounded-2xl border border-moon/30 bg-moon/[0.05] p-4 text-sm" data-testid="bd-ket-qua">
          <p className="text-fg-muted">{c("bd.nam.da_tra", { n: String(daTra), tong: String(cau.length) })}</p>
          {kq.ma && <p className="mt-1.5 text-fg">{tg.ket_luan[kq.ma]}</p>}
          {nghieng && khoa && (
            chinh === nghieng
              ? <p className="mt-2 text-xs font-semibold text-gold">{tg.cach[nghieng].ten} · {c("bd.nam.cach_chinh")}</p>
              : (
                <button type="button" onClick={() => {
                  ghiLa(khoa, { tra_loi: traLoi, chinh: nghieng });
                  ghi("chart_interacted", { mo_dun: "battu", kind: "battu_cach_chinh", ket_qua: nghieng, nguon: "ban_do" });
                }} className="mt-2 rounded-full border border-gold/60 px-3 py-1.5 text-xs font-medium text-fg hover:bg-gold/10">
                  {c("bd.nam.dung_cach", { cach: tg.cach[nghieng].ten })}
                </button>
              )
          )}
          <p className="mt-2 text-xs text-fg-faint"><ChuNhan chu={c("bd.ghi_chu")} /></p>
        </div>
      )}
    </div>
  );
}
