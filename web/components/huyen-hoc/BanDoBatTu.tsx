"use client";
// BD-1 — "Bản đồ lá số" Bát tự dạng VÒNG TRÒN (chủ dự án chọn phương án A + C, 2026-11-25).
//  · Bánh xe đời: tâm là chính bạn (vòng vàng = phần sức của lá số đứng về phía bạn) · vòng trong bốn chữ trên, vòng giữa
//    bốn chữ dưới — bốn góc là gốc / mầm / hoa / quả · vòng ngoài là cả đời 0–90 tuổi theo chặng mười năm · kim vàng là năm
//    đang xem, kéo được; chữ nào năm ấy chạm vào thì sáng viền và nhấp nháy.
//  · Năm hành: năm hành xếp theo vòng tương sinh (mũi tên chảy), sao bên trong là tương khắc; vòng to theo tỉ lệ engine
//    tính, tám chữ là vệ tinh quanh hành của mình; vòng vàng = hai cách đọc thấy bạn nên thêm hành ấy (không chọn thay).
// Biểu tượng vector từng hành (HanhVector) có chuyển động nhẹ; tắt hết khi người dùng bật giảm chuyển động.
// Web CHỈ vẽ: lời, quan hệ, tuổi, năm, tỉ lệ, mức đều do engine (/v1/battu/ban-do). Đo: chart_interacted{kind: ban_do_*}
// — chỉ mã ô / hành / cách xem, không năm, không câu trả lời.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Map as IconMap, Pause, Play, X } from "lucide-react";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { TenHienProvider, useTen } from "@/components/khung/TenHien";
import { useChuBatTu } from "@/components/huyen-hoc/chu-bat-tu";
import { HanhVector, MAU_HANH } from "@/components/huyen-hoc/HanhVector";
import { ConGiapVector } from "@/components/huyen-hoc/ConGiapVector";
import { usePost } from "@/lib/goi-api";
import { ghi } from "@/lib/do-luong";
import { useCuaLuanGiai } from "@/lib/cta-sao";
import {
  capNoi, cauDoiChieu, diemTron, gocO, gocTuoi, quat,
  type BanDoBatTu as BD, type HanhBanDo, type LoaiNoi, type MaO, type NamBanDo, type OBanDo,
} from "@/lib/battu-ban-do";
import { ghiLa, ketQua, khoaLaSo, useCachChinh, useTraLoi, type Cach, type TraLoi } from "@/lib/cach-chinh-battu";
import { cn } from "@/lib/utils";

type Che = "banh_xe" | "nam_hanh";
type Chon = { loai: "o"; ma: MaO } | { loai: "hanh"; hanh: string } | null;
const MAU_LOAI: Record<LoaiNoi, string> = {
  hop: "rgb(233 196 106)", trung: "rgb(233 196 106)", xung: "rgb(217 151 58)",
  hinh: "rgb(185 167 255)", hai: "rgb(185 167 255)", pha: "rgb(185 167 255)",
};
const NET_LOAI: Record<LoaiNoi, string | undefined> = { hop: undefined, trung: undefined, xung: "7 6", hinh: "2 5", hai: "2 5", pha: "2 5" };
const mauH = (h: string) => MAU_HANH[h]?.mau ?? "rgb(214 211 230)";
/** Màu mức năm (một nguồn với chương Vận hạn): lục thuận · xám cân bằng · hổ phách cần lưu ý — không đỏ. */
const MAU_MUC: Record<string, string> = { thuan: "rgb(111 211 160)", can_bang: "rgb(150 148 186)", can_chu_dong: "rgb(217 151 58)" };

type LaSo = { birth_date: string; birth_time?: string | null; gender?: string } & Record<string, unknown>;

export function BanDoBatTu({ laSo }: { laSo: LaSo }) {
  const { data } = usePost<BD>("/api/battu/ban-do", { la_so: laSo });
  if (!data?.o?.length || !data.ngu_hanh) return null;
  return <TenHienProvider ten={[data.ten_hien]}><BanDo bd={data} khoa={khoaLaSo(laSo)} /></TenHienProvider>;
}

// --------------------------------------------------------------------------- tiện ích
const MQ_LG = "(min-width: 1024px)";
function useMayTinh() {
  return useSyncExternalStore(
    (f) => { const m = window.matchMedia(MQ_LG); m.addEventListener("change", f); return () => m.removeEventListener("change", f); },
    () => window.matchMedia(MQ_LG).matches,
    () => true,
  );
}
/** Điện thoại hẹp (< 640px): bánh xe bỏ nhãn nhỏ trong ô, chữ vòng ngoài to hơn. */
function useNho() {
  return useSyncExternalStore(
    (f) => { const m = window.matchMedia("(max-width: 639px)"); m.addEventListener("change", f); return () => m.removeEventListener("change", f); },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
}
function useGiamChuyenDong() {
  return useSyncExternalStore(
    (f) => { const m = window.matchMedia("(prefers-reduced-motion: reduce)"); m.addEventListener("change", f); return () => m.removeEventListener("change", f); },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
/** Góc kim năm trôi mượt tới đích; giảm chuyển động → nhảy thẳng. */
function useGocTroi(dich: number, giam: boolean) {
  const [g, setG] = useState(dich);
  const hien = useRef(dich);
  useEffect(() => {
    if (giam) { hien.current = dich; setG(dich); return; }
    let raf = 0;
    const buoc = () => {
      const d = dich - hien.current;
      if (Math.abs(d) < 0.15) { hien.current = dich; setG(dich); return; }
      hien.current += d * 0.16;
      setG(hien.current);
      raf = requestAnimationFrame(buoc);
    };
    raf = requestAnimationFrame(buoc);
    return () => cancelAnimationFrame(raf);
  }, [dich, giam]);
  return g;
}
const bamPhim = (f: () => void) => (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } };

// Sao nền tất định (không ngẫu nhiên lúc vẽ để máy chủ và trình duyệt ra cùng một hình).
const SAO: [number, number, number][] = Array.from({ length: 34 }, (_, i) => {
  const [x, y] = diemTron(268 + ((i * 53) % 28), (i * 137.508) % 360);
  return [Math.round(x), Math.round(y), (i % 3) * 0.35 + 0.5];
});

// --------------------------------------------------------------------------- khung chính
function BanDo({ bd, khoa }: { bd: BD; khoa: string | null }) {
  const { c, tru } = useChuBatTu();
  const [che, setChe] = useState<Che>("banh_xe");
  const [chon, setChon] = useState<Chon>(null);
  const [noiBat, setNoiBat] = useState<string | null>(null);
  const tg = bd.thoi_gian;
  const [nam, setNam] = useState(tg.nam_xem);
  const [chay, setChay] = useState(false);
  const traLoi = useTraLoi(khoa);
  const chinh = useCachChinh(khoa);
  const cuaLg = useCuaLuanGiai();
  const giam = useGiamChuyenDong();

  const oTheoMa = useMemo(() => Object.fromEntries(bd.o.map((o) => [o.ma, o])) as Record<MaO, OBanDo>, [bd.o]);
  const cuoi = tg.nam[tg.nam.length - 1]!.nam;
  const namDang = tg.nam.find((n) => n.nam === nam) ?? tg.nam[tg.nam.length - 1]!;

  // Chạy qua các năm (nút ▶): mỗi bước một năm, tới cuối thì dừng.
  useEffect(() => {
    if (!chay) return;
    const id = window.setInterval(() => setNam((n) => {
      if (n >= cuoi) { setChay(false); return n; }
      return n + 1;
    }), giam ? 1400 : 700);
    return () => window.clearInterval(id);
  }, [chay, cuoi, giam]);

  const chonO = (ma: MaO) => {
    setNoiBat(null);
    setChon((x) => (x?.loai === "o" && x.ma === ma ? null : { loai: "o", ma }));
    ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_o", o: ma, che });
  };
  const chonHanh = (h: string, i: number) => {
    setNoiBat(null);
    setChon((x) => (x?.loai === "hanh" && x.hanh === h ? null : { loai: "hanh", hanh: h }));
    ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_hanh", hanh: i });
  };
  const doiChe = (x: Che) => {
    setChe(x); setChon(null); setNoiBat(null);
    ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_che", che: x });
  };
  const dong = useCallback(() => setChon(null), []);
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
  const sang = new Set<MaO>(
    chon?.loai === "o" ? [chon.ma, ...oTheoMa[chon.ma]!.noi_voi.map((n) => n.o)]
      : noiBat?.startsWith("tru.") ? bd.o.filter((o) => o.tru === Number(noiBat.slice(4))).map((o) => o.ma)
        : noiBat ? bd.noi_bat.find((x) => x.ma === noiBat)?.o ?? [] : [],
  );

  return (
    <section aria-labelledby="bd-tieu-de" data-testid="ban-do-bat-tu"
      className="relative overflow-hidden rounded-3xl border border-line/70 bg-[radial-gradient(ellipse_at_30%_0%,rgb(233_196_106/0.08),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgb(126_172_255/0.07),transparent_60%)] p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="bd-tieu-de" className="flex items-center gap-2 font-serif text-2xl">
            <IconMap className="size-6 text-gold" aria-hidden /> {c("bd.tieu_de")}
          </h2>
          <p className="mt-1.5 max-w-prose text-sm text-fg-muted">{c("bd.dan")}</p>
        </div>
        <div role="tablist" aria-label={c("bd.xem_theo")} className="flex rounded-full border border-line/70 p-1">
          {(["banh_xe", "nam_hanh"] as const).map((x) => (
            <button key={x} type="button" role="tab" aria-selected={che === x} onClick={() => doiChe(x)} data-testid={`bd-che-${x}`}
              className={cn("rounded-full px-4 py-1.5 text-sm transition-colors",
                che === x ? "bg-gold text-[#1a1406] shadow-[0_0_18px_rgb(233_196_106/0.35)]" : "text-fg-muted hover:text-fg")}>
              {c(`bd.che.${x}`)}
            </button>
          ))}
        </div>
      </div>

      {bd.noi_bat.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow">{c("bd.noi_bat")}</p>
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {bd.noi_bat.map((x) => (
              <li key={x.ma} className="min-w-[15rem] lg:min-w-0">
                <button type="button" aria-pressed={noiBat === x.ma} data-testid={`bd-noi-bat-${x.ma}`}
                  onClick={() => {
                    setChon(null);
                    if (che !== "banh_xe") setChe("banh_xe");
                    setNoiBat((v) => (v === x.ma ? null : x.ma));
                    ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_noi_bat", ma: x.ma });
                  }}
                  className={cn("h-full w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors",
                    noiBat === x.ma ? "border-gold/60 bg-gold/[0.08] text-fg" : "border-line/60 text-fg-muted hover:border-gold/40")}>
                  {x.cau}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0">
          <div className="-mx-3 sm:mx-auto sm:w-full sm:max-w-[36rem]">
            {che === "banh_xe"
              ? <BanhXe bd={bd} oTheoMa={oTheoMa} namDang={namDang} setNam={(n) => { setChay(false); setNam(n); }}
                  chon={chon?.loai === "o" ? chon.ma : null} sang={sang} traLoi={traLoi} chonO={chonO} giam={giam} />
              : <NgoiSao bd={bd} namDang={namDang} chon={chon} chonO={chonO} chonHanh={chonHanh} />}
          </div>
          {che === "banh_xe" && (
            <div className="mx-auto mt-1 grid max-w-[36rem] grid-cols-2 gap-1.5 sm:grid-cols-4" data-testid="bd-tang">
              {bd.tru.map((t) => {
                const dang = noiBat === `tru.${t.i}`;
                return (
                  <button key={t.i} type="button" aria-pressed={dang}
                    onClick={() => { setChon(null); setNoiBat(dang ? null : `tru.${t.i}`); ghi("chart_interacted", { mo_dun: "battu", kind: "ban_do_tang", tru: t.i }); }}
                    className={cn("rounded-xl border px-2.5 py-1.5 text-left transition-colors",
                      dang ? "border-gold/70 bg-gold/10" : t.dang_o ? "border-gold/40" : "border-line/60 hover:border-gold/40")}>
                    <span className="block text-xs font-semibold text-fg">{tru(t.i, "tru")} · {t.tang}</span>
                    <span className="block text-[0.7rem] text-fg-muted">
                      {t.tuoi_den == null ? c("bd.tuoi_tu", { tu: String(t.tuoi_tu) }) : c("bd.tuoi", { tu: String(t.tuoi_tu), den: String(t.tuoi_den) })}
                      {t.dang_o && <b className="ml-1 font-semibold text-gold">· {c("bd.dang_o")}</b>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <p className="mx-auto mt-2 max-w-[36rem] text-center text-xs text-fg-faint">
            {che === "banh_xe" ? <>{c("bd.chu_giai_banh_xe")} {c("bd.chu_giai_muc")}</> : c("bd.chu_giai_nam_hanh")}
          </p>
          <ThanhNam bd={bd} nam={nam} setNam={(n) => { setChay(false); setNam(n); }} traLoi={traLoi} chay={chay} setChay={setChay} />
        </div>

        <div className="min-w-0">
          {chon?.loai === "o" && <BangO o={oTheoMa[chon.ma]!} oTheoMa={oTheoMa} onDong={dong} onChon={chonO} moChuong={moChuong} />}
          {chon?.loai === "hanh" && <BangHanh h={bd.ngu_hanh.find((x) => x.hanh === chon.hanh)!} bd={bd} onDong={dong} onChon={chonO} />}
          <TheNam bd={bd} namDang={namDang} traLoi={traLoi} khoa={khoa} chinh={chinh} moChuong={moChuong} anMayTinh={chon !== null} />
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------- A · bánh xe đời
function BanhXe({ bd, oTheoMa, namDang, setNam, chon, sang, traLoi, chonO, giam }: {
  bd: BD; oTheoMa: Record<MaO, OBanDo>; namDang: NamBanDo; setNam: (n: number) => void; chon: MaO | null; sang: Set<MaO>;
  traLoi: Record<string, TraLoi>; chonO: (m: MaO) => void; giam: boolean;
}) {
  const { c, tru } = useChuBatTu();
  const ten = useTen();
  const nho = useNho();
  const tg = bd.thoi_gian;
  const svg = useRef<SVGSVGElement>(null);
  const keo = useRef(false);
  const cham = useMemo(() => new Map(namDang.cham.map((x) => [x.o, x.loai])), [namDang]);
  const namSinh = namDang.nam - namDang.tuoi;
  const dau = tg.nam[0]!.nam, cuoi = tg.nam[tg.nam.length - 1]!.nam;
  const gocKim = useGocTroi(gocTuoi(namDang.tuoi), giam);
  const [kx, ky] = diemTron(262, gocKim);
  const [gx, gy] = diemTron(80, gocKim);
  const nc = oTheoMa.c2;
  const nhatChu = bd.ngu_hanh.find((h) => h.nhat_chu)?.hanh ?? nc.hanh;
  const capTat = useMemo(() => capNoi(bd.o), [bd.o]);
  const capHien = capTat.filter((x) => !chon || x.a === chon || x.b === chon);

  // Kéo kim: góc con trỏ quanh tâm → tuổi → năm (trong dải năm engine trả).
  const theoTro = (e: PointerEvent) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const goc = (((Math.atan2(y, x) * 180) / Math.PI + 90) % 360 + 360) % 360;
    setNam(Math.max(dau, Math.min(cuoi, namSinh + Math.round((goc / 360) * 90))));
  };
  const diemNoi = (ma: MaO) => diemTron(84, gocO(oTheoMa[ma]) + (ma[0] === "c" ? -16 : 16));

  return (
    <svg ref={svg} viewBox="-300 -300 600 600" role="group" aria-label={c("bd.aria_hinh")} className="h-auto w-full touch-pan-y select-none"
      onPointerMove={(e) => { if (keo.current) theoTro(e); }} onPointerUp={() => { keo.current = false; }} onPointerCancel={() => { keo.current = false; }}>
      <defs>
        <radialGradient id="bd-tam" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="rgb(44 40 92)" /><stop offset="100%" stopColor="rgb(12 12 30)" />
        </radialGradient>
        <filter id="bd-sang" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>

      {SAO.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="rgb(236 235 247)" opacity={0.25} />)}

      {/* vòng đời 0–90 tuổi theo chặng mười năm */}
      <g className="bd-vao-vong" style={{ animationDelay: "0.35s" }}>
        {tg.dai_van[0] && tg.dai_van[0].tu_tuoi > 0 && (
          <path d={quat(220, 250, 0.6, gocTuoi(tg.dai_van[0].tu_tuoi) - 0.6)} fill="rgb(20 20 46)" />
        )}
        {tg.dai_van.map((v) => {
          const a0 = gocTuoi(v.tu_tuoi), a1 = Math.min(gocTuoi(v.tu_tuoi + 10), 360);
          if (a0 >= 360) return null;
          const dangDi = namDang.nam >= v.tu_nam && namDang.nam <= v.den_nam;
          const giua = (a0 + a1) / 2, duoi = giua > 90 && giua < 270;
          const [tx, ty] = diemTron(235, giua);
          // Nhãn cong theo vòng; nửa dưới đi ngược chiều để chữ không lộn ngược.
          const [p0x, p0y] = diemTron(232, duoi ? a1 - 1 : a0 + 1), [p1x, p1y] = diemTron(232, duoi ? a0 + 1 : a1 - 1);
          const cung = `M${p0x} ${p0y}A232 232 0 0 ${duoi ? 0 : 1} ${p1x} ${p1y}`;
          return (
            <g key={v.i} className="cursor-pointer" onClick={() => setNam(Math.max(dau, Math.min(cuoi, v.tu_nam)))}>
              <title>{v.cau}</title>
              <path d={quat(220, 250, a0 + 0.6, a1 - 0.6)}
                fill={dangDi ? "rgb(233 196 106 / 0.22)" : v.i % 2 ? "rgb(32 30 72)" : "rgb(40 38 88)"}
                stroke={dangDi ? "rgb(233 196 106 / 0.85)" : "none"} strokeWidth={1.4} />
              {nho || !v.nhan || a1 - a0 < 30
                ? <text x={tx} y={ty + 5} textAnchor="middle" fontSize={nho ? 17 : 11} fontWeight={nho ? 600 : 400} fill={dangDi ? "rgb(233 196 106)" : "rgb(170 168 205)"}>{v.tu_tuoi}</text>
                : <>
                    <path id={`bd-cung-${v.i}`} d={cung} fill="none" />
                    <text fontSize={9.5} fill={dangDi ? "rgb(233 196 106)" : "rgb(170 168 205)"} dy={duoi ? 7 : 3}>
                      <textPath href={`#bd-cung-${v.i}`} startOffset="50%" textAnchor="middle">{`${v.tu_tuoi} · ${v.nhan}`}</textPath>
                    </text>
                  </>}
            </g>
          );
        })}
        {tg.nam.filter((n) => n.muc).map((n) => (
          <path key={`m${n.nam}`} d={quat(252, 258, gocTuoi(n.tuoi) - 1.7, gocTuoi(n.tuoi) + 1.7)} fill={MAU_MUC[n.muc!]}
            opacity={n.nam === namDang.nam ? 1 : 0.75}><title>{`${n.nam}: ${n.nhan_muc}`}</title></path>
        ))}
        {tg.nam.filter((n) => n.ma && n.dc).map((n) => {
          const [x, y] = diemTron(262, gocTuoi(n.tuoi));
          return <circle key={n.nam} cx={x} cy={y} r={2.8} fill={traLoi[n.ma!] ? "rgb(233 196 106)" : "none"} stroke="rgb(233 196 106)" strokeWidth={1} />;
        })}
        <text x={0} y={-274} textAnchor="middle" fontSize={nho ? 14 : 9.5} letterSpacing="2" fill="rgb(150 148 186)">{c("bd.tuoi_vong").toUpperCase()}</text>
      </g>

      {/* bốn trụ: can (vòng trong) + chi (vòng giữa) */}
      <g className="bd-vao-vong" style={{ animationDelay: "0.15s" }}>
        {bd.o.map((o) => {
          const [r0, r1] = o.hang === "can" ? [94, 146] : [150, 204];
          const a = gocO(o), loaiNam = cham.get(o.ma), duoc = chon === o.ma, mo = sang.size > 0 && !sang.has(o.ma);
          const [cx, cy] = diemTron((r0 + r1) / 2, a);
          const [ix, iy] = diemTron((r0 + r1) / 2, a + (o.hang === "can" ? 27 : 29));
          const [nx, ny] = diemTron((r0 + r1) / 2, a - 27);
          const chu = o.hang === "can" ? ten("can", o.can ?? "") : ten("chi", o.chi ?? "");
          const vien = duoc ? "rgb(233 196 106)" : loaiNam ? MAU_LOAI[loaiNam] : o.la_ban ? "rgb(233 196 106 / 0.7)" : "rgb(52 52 92)";
          return (
            <g key={o.ma} role="button" tabIndex={0} aria-pressed={duoc} data-testid={`bd-o-${o.ma}`}
              aria-label={`${chu}, ${tru(o.tru, "tru")}${o.thap_than && !o.la_ban ? `, ${ten("thap_than", o.thap_than)}` : ""}`}
              onClick={() => chonO(o.ma)} onKeyDown={bamPhim(() => chonO(o.ma))}
              className="group cursor-pointer outline-none" style={{ opacity: mo ? 0.3 : 1, transition: "opacity .3s" }}>
              {(duoc || loaiNam) && <path d={quat(r0, r1, a - 43, a + 43)} fill={duoc ? "rgb(233 196 106)" : MAU_LOAI[loaiNam!]} opacity={0.3} filter="url(#bd-sang)" />}
              <path d={quat(r0, r1, a - 43, a + 43)} fill={o.la_ban ? "rgb(48 42 34)" : "rgb(22 22 52)"}
                stroke={vien} strokeWidth={duoc || loaiNam ? 2.4 : 1}
                className="transition-[fill,stroke] duration-200 group-hover:fill-[rgb(36_34_76)] group-focus-visible:stroke-[rgb(233_196_106)]" />
              {o.hang === "can"
                ? <HanhVector hanh={o.hanh} co={nho ? 20 : 17} x={ix} y={iy} mo={0.95} />
                : <ConGiapVector chi={o.chi ?? ""} mau={mauH(o.hanh)} co={nho ? 24 : 21} x={ix} y={iy} />}
              <text x={cx} y={cy + 9} textAnchor="middle" fontSize={(o.hang === "can" ? 23 : 26) * (nho ? 1.18 : 1)} className="font-serif" fill={mauH(o.hanh)}>{chu}</text>
              {(!nho || o.la_ban) && (
                <text x={nx} y={ny + 3} textAnchor="middle" fontSize={nho ? 13 : 8.5} fill={o.la_ban ? "rgb(233 196 106)" : loaiNam ? MAU_LOAI[loaiNam] : "rgb(150 148 186)"}>
                  {o.la_ban ? c("bd.ban") : loaiNam ? c(`bd.loai_ngan.${loaiNam}`) : o.thap_than ? ten("thap_than", o.thap_than) : ""}
                </text>
              )}
              {loaiNam && !duoc && (() => { const [dx, dy] = diemTron(r1 - 8, a + 39); return <circle cx={dx} cy={dy} r={3.2} fill={MAU_LOAI[loaiNam]} className="bd-cham-nam" />; })()}
            </g>
          );
        })}
      </g>

      {/* dây nối các chữ, đi trong lõi */}
      <g className="bd-vao-vong" style={{ animationDelay: "0.5s" }}>
        {capHien.map((x) => {
          const [x1, y1] = diemNoi(x.a), [x2, y2] = diemNoi(x.b);
          return <path key={`${x.a}${x.b}${x.loai}`} d={`M${x1} ${y1}Q0 0 ${x2} ${y2}`} fill="none" stroke={MAU_LOAI[x.loai]}
            strokeWidth={chon ? 2.2 : 1.3} strokeDasharray={NET_LOAI[x.loai]} opacity={chon ? 0.95 : 0.5} strokeLinecap="round" />;
        })}
      </g>

      {/* tâm: chính bạn + vòng sức tự thân */}
      <g className="bd-vao-vong">
        <circle r={66} fill="url(#bd-tam)" stroke="rgb(52 52 92)" />
        <HanhVector hanh={nhatChu} co={70} y={-6} mo={0.2} />
        <circle r={73} fill="none" stroke="rgb(42 42 78)" strokeWidth={6} />
        <circle r={73} fill="none" stroke="rgb(233 196 106)" strokeWidth={6} strokeLinecap="round"
          strokeDasharray={`${(2 * Math.PI * 73 * bd.suc) / 100} ${2 * Math.PI * 73}`} transform="rotate(-90)" />
        <text y={4} textAnchor="middle" fontSize={30} className="font-serif" fill={mauH(nc.hanh)}>{ten("can", nc.can ?? "")}</text>
        <text y={26} textAnchor="middle" fontSize={nho ? 13 : 9.5} fill="rgb(170 168 205)">{nho ? `${bd.suc}%` : c("bd.suc", { n: String(bd.suc) })}</text>
      </g>

      {/* kim năm — kéo được, phím mũi tên đổi năm */}
      <line x1={gx} y1={gy} x2={kx} y2={ky} stroke="rgb(233 196 106)" strokeWidth={1.4} opacity={0.55} pointerEvents="none" />
      <circle cx={kx} cy={ky} r={17} fill="rgb(233 196 106)" opacity={0.28} filter="url(#bd-sang)" pointerEvents="none" />
      <g role="slider" tabIndex={0} aria-label={c("bd.nam.chon")} aria-valuemin={dau} aria-valuemax={cuoi} aria-valuenow={namDang.nam}
        data-testid="bd-kim" className="cursor-grab outline-none active:cursor-grabbing" style={{ touchAction: "none" }}
        onPointerDown={(e) => { keo.current = true; svg.current?.setPointerCapture?.(e.pointerId); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setNam(Math.min(cuoi, namDang.nam + 1)); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setNam(Math.max(dau, namDang.nam - 1)); }
        }}>
        <circle cx={kx} cy={ky} r={20} fill="transparent" />
        <circle cx={kx} cy={ky} r={12.5} fill="rgb(233 196 106)" stroke="rgb(26 20 6)" strokeWidth={1.5} />
        <text x={kx} y={ky + 3.6} textAnchor="middle" fontSize={10} fontWeight={700} fill="rgb(26 20 6)">{String(namDang.nam).slice(2)}</text>
      </g>
    </svg>
  );
}

// --------------------------------------------------------------------------- C · ngôi sao năm hành
function NgoiSao({ bd, namDang, chon, chonO, chonHanh }: {
  bd: BD; namDang: NamBanDo; chon: Chon; chonO: (m: MaO) => void; chonHanh: (h: string, i: number) => void;
}) {
  const { c } = useChuBatTu();
  const ten = useTen();
  const nh = bd.ngu_hanh;
  const tam = nh.map((_, k) => diemTron(148, k * 72));
  const cham = new Map(namDang.cham.map((x) => [x.o, x.loai]));
  const namH = new Set([namDang.hanh_can, namDang.hanh_chi]);
  const rNut = (h: HanhBanDo) => 24 + Math.sqrt(Math.max(h.phan_tram, 0) / 100) * 52;
  return (
    <svg viewBox="-300 -300 600 600" role="group" aria-label={c("bd.che.nam_hanh")} className="h-auto w-full select-none">
      <defs>
        <marker id="bd-mui" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="rgb(111 211 160)" />
        </marker>
        <filter id="bd-sang2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      {SAO.map(([x, y, r], i) => <circle key={i} cx={x * 0.95} cy={y * 0.95} r={r} fill="rgb(236 235 247)" opacity={0.22} />)}
      <g className="bd-vao-vong" style={{ animationDelay: "0.3s" }}>
        {tam.map(([x1, y1], k) => {
          const [x2, y2] = tam[(k + 2) % 5]!;
          return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(217 151 58)" strokeDasharray="4 7" opacity={0.3} />;
        })}
      </g>
      <g className="bd-vao-vong" style={{ animationDelay: "0.2s" }}>
        {nh.map((h, k) => {
          const [x1, y1] = diemTron(208, k * 72 + 17), [x2, y2] = diemTron(208, k * 72 + 55);
          return <path key={h.hanh} d={`M${x1} ${y1}A208 208 0 0 1 ${x2} ${y2}`} fill="none" stroke="rgb(111 211 160)" strokeWidth={1.6}
            strokeDasharray="6 6" opacity={0.65} markerEnd="url(#bd-mui)" className="bd-chay" />;
        })}
      </g>
      {nh.map((h, k) => {
        const [x, y] = tam[k]!, r = rNut(h), duoc = chon?.loai === "hanh" && chon.hanh === h.hanh;
        const chu = bd.o.filter((o) => o.hanh === h.hanh);
        return (
          <g key={h.hanh}>
            <g role="button" tabIndex={0} aria-pressed={duoc} data-testid={`bd-hanh-${k}`}
              aria-label={`${ten("hanh", h.hanh)} ${h.phan_tram}%`}
              onClick={() => chonHanh(h.hanh, k)} onKeyDown={bamPhim(() => chonHanh(h.hanh, k))}
              className="bd-vao-vong cursor-pointer outline-none" style={{ animationDelay: `${0.1 + k * 0.08}s` }}>
              {namH.has(h.hanh) && <circle cx={x} cy={y} r={r + 18} fill={mauH(h.hanh)} opacity={0.3} filter="url(#bd-sang2)" className="bd-cham-nam" />}
              <circle cx={x} cy={y} r={r} fill="rgb(18 18 44)" stroke={mauH(h.hanh)} strokeWidth={duoc ? 3.2 : 2} />
              <HanhVector hanh={h.hanh} co={r * 1.05} x={x} y={y - r * 0.08} mo={0.3} />
              {h.dung === "them" && <>
                <circle cx={x} cy={y} r={r + 7} fill="none" stroke="rgb(233 196 106)" strokeWidth={1.6} />
                <circle cx={x} cy={y} r={r + 11.5} fill="none" stroke="rgb(233 196 106)" strokeWidth={1} opacity={0.7} />
              </>}
              {h.dung === "mot_them" && <circle cx={x} cy={y} r={r + 8} fill="none" stroke="rgb(233 196 106)" strokeWidth={1.4} strokeDasharray="4 4" />}
              {(h.dung === "bot" || h.dung === "mot_bot") && <circle cx={x} cy={y} r={r + 8} fill="none" stroke="rgb(217 151 58)" strokeWidth={1.4} strokeDasharray={h.dung === "bot" ? undefined : "4 4"} />}
              {h.dung === "nguoc" && <circle cx={x} cy={y} r={r + 8} fill="none" stroke="rgb(185 167 255)" strokeWidth={1.4} strokeDasharray="2 4" />}
              <text x={x} y={y + 1} textAnchor="middle" fontSize={16} className="font-serif" fill={mauH(h.hanh)}>{ten("hanh", h.hanh)}</text>
              <text x={x} y={y + 17} textAnchor="middle" fontSize={11} fill="rgb(170 168 205)">{h.phan_tram}%</text>
            </g>
            {chu.map((o, j) => {
              const goc = ((k * 72 + 180 + (j - (chu.length - 1) / 2) * 32) * Math.PI) / 180;
              const sx = x + Math.sin(goc) * (r + 30), sy = y - Math.cos(goc) * (r + 30);
              const loai = cham.get(o.ma);
              return (
                <g key={o.ma} role="button" tabIndex={0} data-testid={`bd-ve-tinh-${o.ma}`}
                  aria-label={o.hang === "can" ? ten("can", o.can ?? "") : ten("chi", o.chi ?? "")}
                  onClick={() => chonO(o.ma)} onKeyDown={bamPhim(() => chonO(o.ma))} className="cursor-pointer outline-none">
                  <line x1={x + Math.sin(goc) * r} y1={y - Math.cos(goc) * r} x2={sx} y2={sy} stroke={mauH(h.hanh)} opacity={0.3} />
                  <circle cx={sx} cy={sy} r={15} fill={o.la_ban ? "rgb(48 42 34)" : "rgb(14 14 34)"}
                    stroke={loai ? MAU_LOAI[loai] : o.la_ban ? "rgb(233 196 106)" : "rgb(52 52 92)"} strokeWidth={loai ? 2.2 : 1} />
                  <text x={sx} y={sy + 3.5} textAnchor="middle" fontSize={9.5} className="font-serif" fill={mauH(h.hanh)}>
                    {(o.hang === "can" ? ten("can", o.can ?? "") : ten("chi", o.chi ?? "")).slice(0, 5)}
                  </text>
                  {loai && <circle cx={sx + 11} cy={sy - 11} r={3} fill={MAU_LOAI[loai]} className="bd-cham-nam" />}
                </g>
              );
            })}
          </g>
        );
      })}
      <g fontSize={10} fill="rgb(150 148 186)">
        <circle cx={-262} cy={262} r={5} fill="none" stroke="rgb(233 196 106)" strokeWidth={1.4} />
        <circle cx={-262} cy={262} r={8} fill="none" stroke="rgb(233 196 106)" opacity={0.7} />
        <text x={-248} y={265}>{c("bd.vong.them")}</text>
        <circle cx={-262} cy={284} r={6} fill="none" stroke="rgb(233 196 106)" strokeDasharray="3 3" />
        <text x={-248} y={287}>{c("bd.vong.mot_them")}</text>
        <circle cx={60} cy={284} r={6} fill="none" stroke="rgb(217 151 58)" />
        <text x={74} y={287}>{c("bd.vong.bot")}</text>
      </g>
    </svg>
  );
}

// --------------------------------------------------------------------------- thanh năm (dưới hình)
function ThanhNam({ bd, nam, setNam, traLoi, chay, setChay }: {
  bd: BD; nam: number; setNam: (n: number) => void; traLoi: Record<string, TraLoi>; chay: boolean; setChay: (v: boolean) => void;
}) {
  const { c } = useChuBatTu();
  const tg = bd.thoi_gian;
  const dau = tg.nam[0]!.nam, cuoi = tg.nam[tg.nam.length - 1]!.nam, tong = cuoi - dau || 1;
  const pt = (n: number) => `${((n - dau) / tong) * 100}%`;
  return (
    <div className="mx-auto mt-3 max-w-[36rem] rounded-2xl border border-line/60 bg-[rgb(var(--bg)/0.5)] px-3 py-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => { if (!chay && nam >= cuoi) setNam(dau); setChay(!chay); }}
          aria-label={chay ? c("bd.nam.dung") : c("bd.nam.chay")} data-testid="bd-chay"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-[#1a1406] shadow-[0_0_16px_rgb(233_196_106/0.4)]">
          {chay ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
        </button>
        <button type="button" onClick={() => setNam(Math.max(dau, nam - 1))} aria-label={c("bd.nam.truoc")} className="rounded-full border border-line/70 p-1.5"><ChevronLeft className="size-4" aria-hidden /></button>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 -top-2 h-3">
            {tg.nam.filter((n) => n.ma && n.dc).map((n) => (
              <span key={n.nam} aria-hidden className={cn("absolute top-0.5 size-1.5 -translate-x-1/2 rounded-full",
                traLoi[n.ma!] ? "bg-gold" : "border border-gold")} style={{ left: pt(n.nam) }} />
            ))}
            <span aria-hidden className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 rounded bg-moon" style={{ left: pt(tg.nam_xem) }} />
          </div>
          <input type="range" min={dau} max={cuoi} value={nam} onChange={(e) => setNam(Number(e.target.value))}
            aria-label={c("bd.nam.chon")} data-testid="bd-nam-truot" className="w-full accent-[rgb(233_196_106)]" />
        </div>
        <button type="button" onClick={() => setNam(Math.min(cuoi, nam + 1))} aria-label={c("bd.nam.sau")} className="rounded-full border border-line/70 p-1.5"><ChevronRight className="size-4" aria-hidden /></button>
        <span className="w-12 text-right font-serif text-xl tabular-nums" aria-live="polite">{nam}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[0.72rem] text-fg-faint">{tg.hoi_dan}</p>
        {nam !== tg.nam_xem && (
          <button type="button" onClick={() => setNam(tg.nam_xem)} className="shrink-0 rounded-full border border-line/70 px-2.5 py-0.5 text-xs">{c("bd.nam.nay")}</button>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- bảng nghĩa (ô / hành)
function TamBang({ children, onDong, tieuDe }: { children: ReactNode; onDong: () => void; tieuDe: ReactNode }) {
  const { c } = useChuBatTu();
  const mayTinh = useMayTinh();
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    h.current?.focus({ preventScroll: window.matchMedia(MQ_LG).matches });
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onDong(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onDong]);
  // Điện thoại: tấm trượt từ đáy, đưa ra <body> (khung có lớp xếp chồng riêng, z-index trong không thắng thanh tab dưới).
  const bang = (
    <>
      <div aria-hidden className="fixed inset-0 z-[60] bg-black/55 lg:hidden" onClick={onDong} />
      <div role="dialog" aria-modal="false" aria-labelledby="bd-bang-tieu-de" data-testid="bd-bang-o"
        className="fixed inset-x-0 bottom-0 z-[61] max-h-[80vh] overflow-y-auto rounded-t-3xl border border-line/70 bg-[rgb(var(--bg))] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl
          lg:static lg:z-auto lg:max-h-[40rem] lg:rounded-2xl lg:bg-[rgb(var(--bg)/0.6)] lg:p-4 lg:shadow-none">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line lg:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <h3 id="bd-bang-tieu-de" ref={h} tabIndex={-1} className="font-serif text-2xl outline-none">{tieuDe}</h3>
          <button type="button" onClick={onDong} aria-label={c("bd.dong")} className="rounded-full p-1.5 text-fg-muted hover:text-fg">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </>
  );
  return mayTinh ? bang : createPortal(bang, document.body);
}

function BieuTuong({ hanh, lop }: { hanh: string; lop: string }) {
  return <svg viewBox="-14 -14 28 28" className={lop} aria-hidden><HanhVector hanh={hanh} co={24} /></svg>;
}

function BangO({ o, oTheoMa, onDong, onChon, moChuong }: {
  o: OBanDo; oTheoMa: Record<MaO, OBanDo>; onDong: () => void; onChon: (m: MaO) => void; moChuong: (ma: string) => void;
}) {
  const { c } = useChuBatTu();
  const ten = useTen();
  const chuO = (x: OBanDo) => (x.hang === "can" ? ten("can", x.can ?? "") : ten("chi", x.chi ?? ""));
  return (
    <TamBang onDong={onDong} tieuDe={
      <span className="flex items-center gap-2">
        {o.hang === "chi"
          ? <svg viewBox="-14 -14 28 28" className="size-9" aria-hidden><ConGiapVector chi={o.chi ?? ""} mau={mauH(o.hanh)} co={24} /></svg>
          : <BieuTuong hanh={o.hanh} lop="size-8" />}
        <span style={{ color: mauH(o.hanh) }}>{chuO(o)}</span>
        <span className="text-base text-fg-muted">{o.la_ban ? c("bd.ban") : o.thap_than ? ten("thap_than", o.thap_than) : ""}</span>
      </span>}>
      {o.dung && <span className="mt-2 inline-block rounded-full border border-gold/50 px-2.5 py-0.5 text-xs text-gold">{c(`bd.dung.${o.dung}`)}</span>}
      <Muc tieu={c("bd.muc.la_gi")} ds={o.la_gi} />
      <Muc tieu={c("bd.muc.o_dau")} ds={o.o_dau} />
      {o.noi_voi.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow">{c("bd.muc.noi_voi")}</p>
          <ul className="mt-1.5 space-y-1">
            {o.noi_voi.map((n) => (
              <li key={n.o + n.loai}>
                <button type="button" onClick={() => onChon(n.o)}
                  className="flex w-full gap-2 rounded-lg px-1.5 py-1.5 text-left text-sm text-fg-muted hover:bg-fg/5">
                  <span className="mt-2 inline-block h-0.5 w-5 shrink-0 rounded" aria-hidden style={{ background: MAU_LOAI[n.loai] }} />
                  <span><b className="font-semibold" style={{ color: mauH(oTheoMa[n.o].hanh) }}>{chuO(oTheoMa[n.o])}</b> · {n.cau}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {o.nam.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow">{c("bd.muc.nam")}</p>
          <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-fg">
            {o.nam.map((n) => (
              <li key={n.nam} className="flex gap-2">
                <span aria-hidden className="mt-2 inline-block size-2 shrink-0 rounded-full" style={{ background: n.muc ? MAU_MUC[n.muc] : "rgb(150 148 186)" }} />
                <span>{n.cau}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <details className="mt-4 rounded-xl border border-line/60 px-3 py-2">
        <summary className="cursor-pointer text-sm text-fg-muted">{c("bd.muc.vi_sao")}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-fg-muted">{o.vi_sao.map((x) => <li key={x}>{x}</li>)}</ul>
      </details>
      <button type="button" onClick={() => moChuong(o.chuong)} data-testid="bd-doc-chuong"
        className="mt-4 w-full rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-[#1a1406] hover:brightness-105">
        {c("bd.doc_chuong", { chuong: c(`bd.chuong.${o.chuong}`) })}
      </button>
    </TamBang>
  );
}

function BangHanh({ h, bd, onDong, onChon }: { h: HanhBanDo; bd: BD; onDong: () => void; onChon: (m: MaO) => void }) {
  const { c } = useChuBatTu();
  const ten = useTen();
  const chu = bd.o.filter((o) => o.hanh === h.hanh);
  const nhan = [h.nhat_chu && c("bd.hanh.nhat_chu"), h.nhieu && c("bd.hanh.nhieu"), h.thieu && c("bd.hanh.thieu")].filter(Boolean) as string[];
  return (
    <TamBang onDong={onDong} tieuDe={
      <span className="flex items-center gap-2">
        <BieuTuong hanh={h.hanh} lop="size-9" />
        <span style={{ color: mauH(h.hanh) }}>{ten("hanh", h.hanh)}</span>
        <span className="text-base text-fg-muted">{c("bd.hanh.phan_tram", { n: String(h.phan_tram) })}</span>
      </span>}>
      {nhan.length > 0 && <p className="mt-2 flex flex-wrap gap-1.5">{nhan.map((x) => <span key={x} className="rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted">{x}</span>)}</p>}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/60">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${h.phan_tram}%`, background: mauH(h.hanh) }} />
      </div>
      <p className="mt-3 text-sm text-fg">{h.y}</p>
      <p className="eyebrow mt-4">{c("bd.hanh.hai_cach")}</p>
      <p className="mt-1 text-sm text-fg">{h.cau_dung ?? c("bd.hanh.khong_noi")}</p>
      <p className="eyebrow mt-4">{c("bd.hanh.chu")}</p>
      {chu.length ? (
        <ul className="mt-1.5 space-y-1">
          {chu.map((o) => (
            <li key={o.ma}>
              <button type="button" onClick={() => onChon(o.ma)} className="w-full rounded-lg px-1.5 py-1.5 text-left text-sm text-fg-muted hover:bg-fg/5">
                <b className="font-serif text-base" style={{ color: mauH(o.hanh) }}>{o.hang === "can" ? ten("can", o.can ?? "") : ten("chi", o.chi ?? "")}</b>
                {" · "}{o.la_ban ? c("bd.ban") : o.nguoi}
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1 text-sm text-fg-muted">{c("bd.hanh.khong_chu")}</p>}
    </TamBang>
  );
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

// --------------------------------------------------------------------------- thẻ năm + đối chiếu năm đã qua
function TheNam({ bd, namDang, traLoi, khoa, chinh, moChuong, anMayTinh }: {
  bd: BD; namDang: NamBanDo; traLoi: Record<string, TraLoi>; khoa: string | null; chinh?: Cach; moChuong: (ma: string) => void; anMayTinh: boolean;
}) {
  const { c } = useChuBatTu();
  const ten = useTen();
  const tg = bd.thoi_gian;
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
  return (
    <div className={cn("space-y-3", anMayTinh && "lg:hidden")} data-testid="bd-theo-nam">
      <div className="rounded-2xl border border-line/70 bg-[rgb(var(--bg)/0.6)] p-4" data-testid="bd-the-nam">
        <div className="flex items-center gap-2">
          <BieuTuong hanh={namDang.hanh_chi} lop="size-7" />
          <p className="font-serif text-lg">{namDang.nam} · {ten("can", namDang.can)} {ten("chi", namDang.chi)}</p>
        </div>
        {namDang.muc && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-fg-muted">{c("bd.nam.muc_chung")}</span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" data-testid="bd-muc-nam"
              style={{ color: MAU_MUC[namDang.muc], background: `color-mix(in srgb, ${MAU_MUC[namDang.muc]} 16%, transparent)` }}>
              {namDang.nhan_muc}
            </span>
            {namDang.mang && <span className="text-xs text-fg-muted">· {namDang.mang}</span>}
          </p>
        )}
        {namDang.y && <p className="mt-2 text-fg">{namDang.y}</p>}
        {(namDang.nen_tranh || namDang.nen_lam) && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="bd-nen-tranh">
            {namDang.nen_tranh && (
              <div className="rounded-xl border border-[rgb(217_151_58/0.45)] bg-[rgb(217_151_58/0.07)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(217_151_58)]">{c("bd.nam.nen_tranh")}</p>
                <p className="mt-1 text-sm text-fg">{namDang.nen_tranh}</p>
              </div>
            )}
            {namDang.nen_lam && (
              <div className="rounded-xl border border-[rgb(111_211_160/0.45)] bg-[rgb(111_211_160/0.07)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(111_211_160)]">{c("bd.nam.nen_lam")}</p>
                <p className="mt-1 text-sm text-fg">{namDang.nen_lam}</p>
              </div>
            )}
          </div>
        )}
        {namDang.khoa && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/40 bg-gold/[0.06] px-3 py-2" data-testid="bd-nam-khoa">
            <p className="text-sm text-fg">{c("bd.nam.khoa", { nam: String(namDang.nam) })}</p>
            <button type="button" onClick={() => moChuong("van_han")} className="shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-[#1a1406]">
              {c("bd.nam.mo_chuong")}
            </button>
          </div>
        )}
        <p className="mt-3 text-sm font-medium text-fg">{namDang.cau}</p>
        {van && <p className="mt-1.5 text-sm text-fg-muted">{van.cau}</p>}
        {namDang.chi_tiet.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">{namDang.chi_tiet.map((x) => <li key={x}>{x}</li>)}</ul>
        )}
        {namDang.ma && namDang.dc && namDang.hoi && (
          <div className="mt-4 border-t border-line/60 pt-3">
            <p className="text-sm text-fg">{namDang.hoi}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tg.lua_chon.map((x) => (
                <button key={x.ma} type="button" aria-pressed={tl === x.ma} onClick={() => tra(x.ma)} data-testid={`bd-tra-${x.ma}`}
                  className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors",
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
      </div>
      {cau.length > 0 && (
        <div className="rounded-2xl border border-moon/30 bg-moon/[0.05] p-4 text-sm" data-testid="bd-ket-qua">
          <p className="font-serif text-base text-fg">{c("bd.cach.tieu_de")}</p>
          <div className="mt-2 grid gap-1.5">
            {(["cach_1", "cach_2"] as const).map((k, i) => (
              <div key={k} data-testid={`bd-${k}`} className={cn("rounded-xl border px-3 py-2", chinh === k ? "border-gold/70 bg-gold/[0.06]" : "border-line/60")}>
                <p className="flex flex-wrap items-center gap-1.5 text-fg">
                  <span className={cn("inline-block size-2 rounded-full", i ? "border-2 border-moon" : "bg-moon")} aria-hidden />
                  <b className="font-medium">{tg.cach[k].ten}</b>
                  {chinh === k && <span className="rounded-full bg-gold px-1.5 py-px text-[0.65rem] font-semibold text-[#1a1406]">{c("bd.nam.cach_chinh")}</span>}
                </p>
                <p className="mt-0.5 text-xs text-fg-muted">{tg.cach[k].mo_ta}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-fg-muted">{c("bd.nam.da_tra", { n: String(daTra), tong: String(cau.length) })}</p>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line/60" aria-hidden>
              <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${(daTra / cau.length) * 100}%` }} />
            </div>
          </div>
          {kq.ma && <p className="mt-1.5 text-fg" data-testid="bd-ket-luan">{tg.ket_luan[kq.ma]}</p>}
          {nghieng && khoa && chinh !== nghieng && (
                <button type="button" onClick={() => {
                  ghiLa(khoa, { tra_loi: traLoi, chinh: nghieng });
                  ghi("chart_interacted", { mo_dun: "battu", kind: "battu_cach_chinh", ket_qua: nghieng, nguon: "ban_do" });
                }} className="mt-2 rounded-full border border-gold/60 px-3 py-1.5 text-xs font-medium text-fg hover:bg-gold/10">
                  {c("bd.nam.dung_cach", { cach: tg.cach[nghieng].ten })}
                </button>
          )}
          <p className="mt-2 text-xs text-fg-faint"><ChuNhan chu={c("bd.ghi_chu")} /></p>
        </div>
      )}
    </div>
  );
}
