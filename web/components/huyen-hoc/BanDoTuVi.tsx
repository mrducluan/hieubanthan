"use client";
// TV-BD1 — "Bản đồ 12 cung" Tử vi dạng VÒNG TRÒN + MẠNG ĐƯỜNG BAY TỨ HOÁ 2 CHẶNG:
//  · Bánh xe 12 cung: Ngọ ở đỉnh (0°), Tý ở đáy (180°), vạch mức từng cung (lục / xám / hổ phách — 0 màu đỏ),
//    tam giác vàng Tam phương + dây đứt Xung chiếu, huy hiệu Tuần/Triệt đúng vách ngăn, vành Đại hạn 0–90 tuổi (nới theo tuổi lớn nhất) có chữ cong
//    + kim năm kéo được (chuột / chạm / phím mũi tên / nút ▶).
//  · Mạng đường bay: 12 nút cung + cung bậc hai Bézier lọc theo Đáng chú ý · Chuỗi 2 chặng (① -> ②) · Bay vào Mệnh · Tự hoá.
// Web CHỈ vẽ dữ liệu engine (/v1/tuvi/ban-do). Đo PostHog: chart_interacted{mo_dun: "tuvi", kind: "ban_do_*"} — không gửi năm.
import {
  useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore,
  type KeyboardEvent, type PointerEvent, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Compass, MousePointerClick, Pause, Play, Sparkles, X } from "lucide-react";
import type { ChartInputVao } from "@/app/api/tuvi/schema";
import { TenHienProvider } from "@/components/khung/TenHien";
import { tenGon, useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";
import { HanhVector, MAU_HANH } from "@/components/huyen-hoc/HanhVector";
import { ConGiapVector } from "@/components/huyen-hoc/ConGiapVector";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { usePost } from "@/lib/goi-api";
import { ghi } from "@/lib/do-luong";
import { useCuaLuanGiai } from "@/lib/cta-sao";
import { useTyLe, type BangTyLe } from "@/lib/ty-le-kiem-chung";
import {
  chuoiBezierHaiChang, cungBezier, diemTron, gocChi, gocRanhGioi, gocTuoi, khuyenTuHoa, quat, tuoiVong,
  type BanDoTuVi as BD, type ChuoiHaiChang, type CungBanDo, type MaCung, type NamBanDoTV,
} from "@/lib/tuvi-ban-do";
import { cn } from "@/lib/utils";

type Che = "banh_xe" | "duong_bay";
type BoLocBay = "noi_bat" | "chuoi" | "vao_menh" | "tu_hoa";
type Chon = { loai: "o"; ma: MaCung } | { loai: "chuoi"; idx: number } | null;

/** Bảng màu chuẩn không đỏ: lục thuận · xám lam cân bằng · hổ phách cần lưu ý. */
const MAU_MUC: Record<string, string> = {
  thuan: "rgb(111 211 160)",
  can_bang: "rgb(150 148 186)",
  can_chu_dong: "rgb(217 151 58)",
};
/** Bảng màu Tứ Hoá không đỏ: Lộc xanh ngọc · Quyền vàng kim · Khoa lam sao · Kỵ hổ phách. */
const MAU_HOA: Record<string, string> = {
  "Lộc": "rgb(111 211 160)",
  "Quyền": "rgb(233 196 106)",
  "Khoa": "rgb(126 172 255)",
  "Kỵ": "rgb(217 151 58)",
};
const mauH = (h: string) => MAU_HANH[h]?.mau ?? "rgb(214 211 230)";

const CHI_DANH_SACH = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export function BanDoTuVi({
  laSo,
  coBaoCao = true,
  onChonCung,
}: {
  laSo: ChartInputVao;
  coBaoCao?: boolean;
  onChonCung?: (chi: string) => void;
}) {
  const { data } = usePost<BD>("/api/tuvi/ban-do", { la_so: laSo });
  if (!data?.o?.length) return null;
  return (
    <TenHienProvider ten={[data.ten_hien]}>
      {data.vai_doc === "cha_me" && data.loi_vai_doc && (
        <p role="note" data-testid="ban-do-tv-vai-doc"
          className="mb-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-fg-muted">{data.loi_vai_doc}</p>
      )}
      <BanDo bd={data} coBaoCao={coBaoCao} onChonCung={onChonCung} />
    </TenHienProvider>
  );
}

// --------------------------------------------------------------------------- hooks đồng bộ màn hình & chuyển động
const MQ_LG = "(min-width: 1024px)";
function useMayTinh() {
  return useSyncExternalStore(
    (f) => { const m = window.matchMedia(MQ_LG); m.addEventListener("change", f); return () => m.removeEventListener("change", f); },
    () => window.matchMedia(MQ_LG).matches,
    () => true,
  );
}
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
const bamPhim = (f: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); }
};

// Sao nền tất định (SSR === CSR)
const SAO: [number, number, number][] = Array.from({ length: 34 }, (_, i) => {
  const [x, y] = diemTron(274 + ((i * 53) % 26), (i * 137.508) % 360);
  return [Math.round(x), Math.round(y), (i % 3) * 0.35 + 0.5];
});

// --------------------------------------------------------------------------- khung điều phối chính
function BanDo({
  bd,
  coBaoCao,
  onChonCung,
}: {
  bd: BD;
  coBaoCao: boolean;
  onChonCung?: (chi: string) => void;
}) {
  const { c } = useChuTuVi();
  const [che, setChe] = useState<Che>("banh_xe");
  const [boLoc, setBoLoc] = useState<BoLocBay>("noi_bat");
  const [chon, setChon] = useState<Chon>(null);
  const [noiBat, setNoiBat] = useState<string | null>(null);
  const tg = bd.thoi_gian;
  const [nam, setNam] = useState(tg.nam_xem);
  const [chay, setChay] = useState(false);
  const cuaLg = useCuaLuanGiai();
  const giam = useGiamChuyenDong();

  // Chỉ tải tỉ lệ kiểm chứng khi người dùng mở thẻ chuỗi 2 chặng ở tab Mạng đường bay — giữ đúng quy ước LG-ĐS mục 5
  // (tải trang /tu-vi chỉ có duy nhất 1 lượt gọi /api/kiem-chung/ty-le của BaoCaoDoiSong).
  const canTaiTyLe = che === "duong_bay" && chon?.loai === "chuoi";
  const maKiemChung = useMemo(
    () => (canTaiTyLe ? bd.duong_bay.chuoi_chuyen_ky.map((ch) => ch.ma_mau) : []),
    [canTaiTyLe, bd.duong_bay.chuoi_chuyen_ky],
  );
  const tyLe = useTyLe(maKiemChung);

  const oTheoMa = useMemo(
    () => Object.fromEntries(bd.o.map((o) => [o.ma, o])) as Record<MaCung, CungBanDo>,
    [bd.o],
  );
  const cuoi = tg.nam[tg.nam.length - 1]!.nam;
  const namDang = tg.nam.find((n) => n.nam === nam) ?? tg.nam[tg.nam.length - 1]!;

  useEffect(() => {
    if (!chay) return;
    const id = window.setInterval(() => setNam((n) => {
      if (n >= cuoi) { setChay(false); return n; }
      return n + 1;
    }), giam ? 1400 : 700);
    return () => window.clearInterval(id);
  }, [chay, cuoi, giam]);

  const chonO = (ma: MaCung) => {
    setNoiBat(null);
    setChon((x) => (x?.loai === "o" && x.ma === ma ? null : { loai: "o", ma }));
    ghi("chart_interacted", { mo_dun: "tuvi", kind: "ban_do_o", o: ma, che });
  };
  const chonChuoi = (idx: number) => {
    setNoiBat(null);
    setChon((x) => (x?.loai === "chuoi" && x.idx === idx ? null : { loai: "chuoi", idx }));
    ghi("chart_interacted", { mo_dun: "tuvi", kind: "ban_do_chuoi", idx });
  };
  const doiChe = (x: Che) => {
    setChe(x);
    setChon(null);
    setNoiBat(null);
    ghi("chart_interacted", { mo_dun: "tuvi", kind: "ban_do_che", che: x });
  };
  const dong = useCallback(() => setChon(null), []);

  const moChuong = (ma: string) => {
    ghi("chart_interacted", { mo_dun: "tuvi", kind: "ban_do_chuong", chuong: ma });
    setChon(null);
    if (cuaLg && cuaLg.moDun === "tuvi" && !cuaLg.daTai) {
      history.replaceState(null, "", `#lg-${ma}`);
      cuaLg.doc();
      requestAnimationFrame(() => document.getElementById("luan-giai")?.scrollIntoView({ block: "start" }));
    } else {
      window.dispatchEvent(new CustomEvent("hbt:mo-chuong", { detail: { mo_dun: "tuvi", ma } }));
    }
  };

  const sang = useMemo(() => {
    if (chon?.loai === "o") {
      const o = oTheoMa[chon.ma];
      return o ? new Set<MaCung>([chon.ma, o.tam_phuong.xung, ...o.tam_phuong.tam_hop]) : new Set<MaCung>();
    }
    if (chon?.loai === "chuoi") {
      const ch = bd.duong_bay.chuoi_chuyen_ky[chon.idx];
      return ch ? new Set<MaCung>([ch.tu, ch.qua, ch.den]) : new Set<MaCung>();
    }
    if (noiBat) {
      return new Set<MaCung>(bd.noi_bat.find((x) => x.ma === noiBat)?.o ?? []);
    }
    return new Set<MaCung>();
  }, [bd.duong_bay.chuoi_chuyen_ky, bd.noi_bat, chon, noiBat, oTheoMa]);

  return (
    <section
      aria-labelledby="tvbd-tieu-de"
      data-testid="ban-do-tu-vi"
      className="relative overflow-hidden rounded-3xl border border-line/70 bg-[radial-gradient(ellipse_at_30%_0%,rgb(233_196_106/0.08),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgb(126_172_255/0.07),transparent_60%)] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="tvbd-tieu-de" className="flex items-center gap-2 font-serif text-2xl">
            <Compass className="size-6 text-gold" aria-hidden /> {c("bd.tieu_de")}
          </h2>
          <p className="mt-1.5 max-w-prose text-sm text-fg-muted">{c("bd.dan")}</p>
        </div>
        <div role="tablist" aria-label={c("bd.xem_theo")} className="flex rounded-full border border-line/70 p-1">
          {(["banh_xe", "duong_bay"] as const).map((x) => (
            <button
              key={x}
              type="button"
              role="tab"
              aria-selected={che === x}
              onClick={() => doiChe(x)}
              data-testid={`bd-che-${x}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                che === x ? "bg-gold text-[#1a1406] shadow-[0_0_18px_rgb(233_196_106/0.35)]" : "text-fg-muted hover:text-fg",
              )}
            >
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
                <button
                  type="button"
                  aria-pressed={noiBat === x.ma}
                  data-testid={`bd-noi-bat-${x.ma}`}
                  onClick={() => {
                    setChon(null);
                    if (che !== "banh_xe") setChe("banh_xe");
                    setNoiBat((v) => (v === x.ma ? null : x.ma));
                    ghi("chart_interacted", { mo_dun: "tuvi", kind: "ban_do_noi_bat", ma: x.ma });
                  }}
                  className={cn(
                    "h-full w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors",
                    noiBat === x.ma ? "border-gold/60 bg-gold/[0.08] text-fg" : "border-line/60 text-fg-muted hover:border-gold/40",
                  )}
                >
                  {x.cau}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {che === "duong_bay" && (
        <div role="radiogroup" aria-label={c("bd.loc.nhan")} className="mt-4 flex flex-wrap gap-1.5" data-testid="bd-bo-loc-bay">
          {(["noi_bat", "chuoi", "vao_menh", "tu_hoa"] as const).map((k) => {
            const dem = k === "noi_bat" ? bd.duong_bay.noi_bat.length
              : k === "chuoi" ? bd.duong_bay.chuoi_chuyen_ky.length
                : k === "vao_menh" ? bd.duong_bay.vao_menh.length
                  : bd.duong_bay.tu_hoa.length;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={boLoc === k}
                data-testid={`bd-loc-${k}`}
                onClick={() => { setBoLoc(k); setChon(null); }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  boLoc === k ? "border-gold bg-gold/15 text-fg" : "border-line/60 text-fg-muted hover:border-gold/40",
                )}
              >
                {c(`bd.loc.${k}`)} ({dem})
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0">
          <div className="-mx-3 sm:mx-auto sm:w-full sm:max-w-[37rem]">
            {che === "banh_xe" ? (
              <BanhXe12Cung
                bd={bd}
                oTheoMa={oTheoMa}
                namDang={namDang}
                setNam={(n) => { setChay(false); setNam(n); }}
                chon={chon?.loai === "o" ? chon.ma : null}
                sang={sang}
                chonO={chonO}
                giam={giam}
              />
            ) : (
              <MangDuongBay
                bd={bd}
                oTheoMa={oTheoMa}
                boLoc={boLoc}
                chon={chon}
                sang={sang}
                chonO={chonO}
                chonChuoi={chonChuoi}
              />
            )}
          </div>
          <p className="mx-auto mt-2 max-w-[36rem] text-center text-xs text-fg-faint">
            {che === "banh_xe" ? c("bd.chu_giai_banh_xe") : c("bd.chu_giai_bay")}
          </p>
          {che === "banh_xe" && (
            <ThanhNamTV
              bd={bd}
              nam={nam}
              setNam={(n) => { setChay(false); setNam(n); }}
              chay={chay}
              setChay={setChay}
            />
          )}
          {che === "duong_bay" && boLoc === "chuoi" && bd.duong_bay.chuoi_chuyen_ky.length > 0 && (
            <ul className="mx-auto mt-3 grid max-w-[37rem] gap-2 sm:grid-cols-2" data-testid="bd-ds-chuoi">
              {bd.duong_bay.chuoi_chuyen_ky.map((ch, idx) => {
                const dang = chon?.loai === "chuoi" && chon.idx === idx;
                return (
                  <li key={ch.ma_mau + idx}>
                    <button
                      type="button"
                      aria-pressed={dang}
                      data-testid={`bd-the-chuoi-${idx}`}
                      onClick={() => chonChuoi(idx)}
                      className={cn(
                        "w-full rounded-2xl border p-3 text-left text-xs transition-colors",
                        dang ? "border-gold bg-gold/10 text-fg" : "border-line/60 bg-[rgb(var(--bg)/0.45)] text-fg-muted hover:border-gold/40",
                      )}
                    >
                      <span className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[0.68rem] font-semibold",
                        ch.loai === "loc_chuyen_ky" ? "bg-jade/15 text-jade" : "bg-[rgb(217_151_58/0.16)] text-[rgb(217_151_58)]",
                      )}>
                        {c(ch.loai === "loc_chuyen_ky" ? "bd.chuoi.lck" : "bd.chuoi.kck")}
                      </span>
                      <span className="mt-1.5 block font-serif text-sm text-fg">{ch.tieu_de}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {chon?.loai === "o" && (
            <BangCung
              o={oTheoMa[chon.ma]!}
              oTheoMa={oTheoMa}
              coBaoCao={coBaoCao}
              onDong={dong}
              onChon={chonO}
              onChonCung={onChonCung}
              moChuong={moChuong}
            />
          )}
          {chon?.loai === "chuoi" && bd.duong_bay.chuoi_chuyen_ky[chon.idx] && (
            <BangChuoi
              ch={bd.duong_bay.chuoi_chuyen_ky[chon.idx]!}
              oTheoMa={oTheoMa}
              tyLe={tyLe}
              onDong={dong}
              onChon={chonO}
              coBaoCao={coBaoCao}
            />
          )}
          <TheNamTV
            bd={bd}
            oTheoMa={oTheoMa}
            namDang={namDang}
            coBaoCao={coBaoCao}
            moChuong={moChuong}
            chonO={chonO}
            anMayTinh={chon !== null}
          />
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------- Tab 1 · Bánh xe 12 cung & Tam phương tứ chính
function BanhXe12Cung({
  bd,
  oTheoMa,
  namDang,
  setNam,
  chon,
  sang,
  chonO,
  giam,
}: {
  bd: BD;
  oTheoMa: Record<MaCung, CungBanDo>;
  namDang: NamBanDoTV;
  setNam: (n: number) => void;
  chon: MaCung | null;
  sang: Set<MaCung>;
  chonO: (m: MaCung) => void;
  giam: boolean;
}) {
  const { c, ten, hoa } = useChuTuVi();
  const nho = useNho();
  const tg = bd.thoi_gian;
  const svg = useRef<SVGSVGElement>(null);
  const keo = useRef(false);

  const namSinh = namDang.nam - namDang.tuoi + 1;
  const dau = tg.nam[0]!.nam;
  const cuoi = tg.nam[tg.nam.length - 1]!.nam;
  const vong = useMemo(() => tuoiVong(Math.max(...tg.nam.map((x) => x.tuoi), ...tg.dai_van.map((v) => v.den_tuoi))), [tg]);
  const gocKim = useGocTroi(gocTuoi(namDang.tuoi, vong), giam);
  const [kx, ky] = diemTron(264, gocKim);
  const [gx, gy] = diemTron(80, gocKim);

  const cungTamPhuong = oTheoMa[chon ?? "menh"]!;
  const [ax, ay] = diemTron(84, gocChi(cungTamPhuong.chi_so));
  const [bx, by] = diemTron(84, gocChi(oTheoMa[cungTamPhuong.tam_phuong.tam_hop[0]]!.chi_so));
  const [cx, cy] = diemTron(84, gocChi(oTheoMa[cungTamPhuong.tam_phuong.tam_hop[1]]!.chi_so));
  const [xx, xy] = diemTron(84, gocChi(oTheoMa[cungTamPhuong.tam_phuong.xung]!.chi_so));

  const ranhTuan = useMemo(() => {
    const tc = bd.tam.tuan_chi ?? [];
    if (tc.length !== 2) return null;
    const i0 = CHI_DANH_SACH.indexOf(tc[0]!), i1 = CHI_DANH_SACH.indexOf(tc[1]!);
    return i0 >= 0 && i1 >= 0 ? gocRanhGioi(i0, i1) : null;
  }, [bd.tam.tuan_chi]);

  const ranhTriet = useMemo(() => {
    const tc = bd.tam.triet_chi ?? [];
    if (tc.length !== 2) return null;
    const i0 = CHI_DANH_SACH.indexOf(tc[0]!), i1 = CHI_DANH_SACH.indexOf(tc[1]!);
    return i0 >= 0 && i1 >= 0 ? gocRanhGioi(i0, i1) : null;
  }, [bd.tam.triet_chi]);

  const theoTro = (e: PointerEvent) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    const goc = (((Math.atan2(y, x) * 180) / Math.PI + 90) % 360 + 360) % 360;
    const tuoiChon = Math.max(1, Math.round((goc / 360) * vong));
    setNam(Math.max(dau, Math.min(cuoi, namSinh + tuoiChon - 1)));
  };

  return (
    <svg
      ref={svg}
      viewBox="-310 -310 620 620"
      role="group"
      aria-label={c("bd.aria_hinh")}
      className="h-auto w-full touch-pan-y select-none"
      onPointerMove={(e) => { if (keo.current) theoTro(e); }}
      onPointerUp={() => { keo.current = false; }}
      onPointerCancel={() => { keo.current = false; }}
    >
      <defs>
        <radialGradient id="tvbd-tam" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="rgb(44 40 92)" />
          <stop offset="100%" stopColor="rgb(12 12 30)" />
        </radialGradient>
        <filter id="tvbd-sang" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {SAO.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="rgb(236 235 247)" opacity={0.24} />
      ))}

      {/* Vành ngoài Đại hạn 0–90 tuổi + vạch màu 10 năm tới */}
      <g>
        {tg.dong_han && (
          <path
            d={quat(216, 246, 0.5, Math.max(2, gocTuoi(tg.dong_han.den_tuoi + 1, vong) - 0.5))}
            fill="rgb(20 20 46)"
          />
        )}
        {tg.dai_van.map((v) => {
          const a0 = gocTuoi(v.tu_tuoi, vong);
          const a1 = Math.min(gocTuoi(v.den_tuoi + 1, vong), 360);
          if (a0 >= 360 || a1 - a0 < 3) return null;
          const dangDi = namDang.nam >= v.tu_nam && namDang.nam <= v.den_nam;
          const giua = (a0 + a1) / 2;
          const duoi = giua > 90 && giua < 270;
          const [tx, ty] = diemTron(231, giua);
          const [p0x, p0y] = diemTron(229, duoi ? a1 - 1 : a0 + 1);
          const [p1x, p1y] = diemTron(229, duoi ? a0 + 1 : a1 - 1);
          const cung = `M${p0x} ${p0y}A229 229 0 0 ${duoi ? 0 : 1} ${p1x} ${p1y}`;
          return (
            <g key={v.i} className="cursor-pointer" onClick={() => setNam(Math.max(dau, Math.min(cuoi, v.tu_nam)))}>
              <title>{v.cau}</title>
              <path
                d={quat(216, 246, a0 + 0.5, a1 - 0.5)}
                fill={dangDi ? "rgb(233 196 106 / 0.22)" : v.i % 2 ? "rgb(32 30 72)" : "rgb(40 38 88)"}
                stroke={dangDi ? "rgb(233 196 106 / 0.85)" : "none"}
                strokeWidth={1.3}
              />
              {nho || !v.chu_de || a1 - a0 < 28 ? (
                <text
                  x={tx}
                  y={ty + 4}
                  textAnchor="middle"
                  fontSize={nho ? 15 : 10.5}
                  fontWeight={nho ? 600 : 400}
                  fill={dangDi ? "rgb(233 196 106)" : "rgb(170 168 205)"}
                >
                  {v.tu_tuoi}
                </text>
              ) : (
                <>
                  <path id={`tvbd-cung-${v.i}`} d={cung} fill="none" />
                  <text fontSize={9.2} fill={dangDi ? "rgb(233 196 106)" : "rgb(170 168 205)"} dy={duoi ? 6.5 : 3}>
                    <textPath href={`#tvbd-cung-${v.i}`} startOffset="50%" textAnchor="middle">
                      {`${v.tu_tuoi} · ${v.chu_de}`}
                    </textPath>
                  </text>
                </>
              )}
            </g>
          );
        })}
        {tg.nam.filter((n) => n.muc).map((n) => (
          <path
            key={`m${n.nam}`}
            d={quat(249, 256, gocTuoi(n.tuoi, vong) - 1.6, gocTuoi(n.tuoi, vong) + 1.6)}
            fill={MAU_MUC[n.muc!]}
            opacity={n.nam === namDang.nam ? 1 : 0.78}
          >
            <title>{`${n.nam}: ${n.nhan_muc}`}</title>
          </path>
        ))}
        <text x={0} y={-282} textAnchor="middle" fontSize={nho ? 13 : 9.5} letterSpacing="2" fill="rgb(150 148 186)">
          {c("bd.tuoi_vong").toUpperCase()}
        </text>
      </g>

      {/* Vành 12 cung (Ngọ 0° đỉnh, Tý 180° đáy) */}
      <g>
        {bd.o.map((o) => {
          const a = gocChi(o.chi_so);
          const r0 = 88;
          const r1 = 200;
          const duoc = chon === o.ma;
          const laLuuNien = namDang.cung_luu_nien === o.ma;
          const mo = sang.size > 0 && !sang.has(o.ma);
          const hoaNamTaiDay = namDang.hoa_nam.filter((h) => h.den === o.ma);

          const [tx, ty] = diemTron(nho ? 148 : 156, a);
          const [cxChi, cyChi] = diemTron(108, a);
          const tenCung = tenGon(ten("cung", o.cung)).replace(/\s+Palace$/i, "");
          const vien = duoc
            ? "rgb(233 196 106)"
            : laLuuNien
              ? "rgb(233 196 106 / 0.85)"
              : o.la_menh
                ? "rgb(233 196 106 / 0.65)"
                : o.la_than
                  ? "rgb(111 211 160 / 0.6)"
                  : "rgb(52 52 92)";

          return (
            <g
              key={o.ma}
              role="button"
              tabIndex={0}
              aria-pressed={duoc}
              data-testid={`bd-o-${o.ma}`}
              aria-label={c("bd.aria_o", { cung: ten("cung", o.cung), chi: ten("chi", o.chi), muc: o.nhan_muc })}
              onClick={() => chonO(o.ma)}
              onKeyDown={bamPhim(() => chonO(o.ma))}
              className="group cursor-pointer outline-none"
              style={{ opacity: mo ? 0.34 : 1, transition: "opacity .25s" }}
            >
              {(duoc || laLuuNien) && (
                <path
                  d={quat(r0, r1, a - 14.3, a + 14.3)}
                  fill="rgb(233 196 106)"
                  opacity={duoc ? 0.28 : 0.16}
                  filter="url(#tvbd-sang)"
                />
              )}
              <path
                d={quat(r0, r1, a - 14.3, a + 14.3)}
                fill={o.la_menh ? "rgb(48 42 34)" : "rgb(22 22 52)"}
                stroke={vien}
                strokeWidth={duoc || laLuuNien ? 2.2 : 1}
                className="transition-[fill,stroke] duration-200 group-hover:fill-[rgb(36_34_76)] group-focus-visible:stroke-[rgb(233_196_106)]"
              />
              {/* Vạch màu mức của cung sát mép ngoài quạt */}
              <path d={quat(194, 200, a - 13.8, a + 13.8)} fill={MAU_MUC[o.muc]} opacity={0.92} />

              {/* Tên cung */}
              <text
                x={tx}
                y={nho ? ty + 4 : ty - 4}
                textAnchor="middle"
                fontSize={nho ? 12.5 : 10.5}
                fontWeight={o.la_menh ? 700 : 600}
                fill={o.la_menh ? "rgb(233 196 106)" : "rgb(236 235 247)"}
              >
                {tenCung}
              </text>

              {/* Huy hiệu Thân / Lai nhân cung */}
              {o.la_than && !nho && (
                <text x={tx} y={ty + 18} textAnchor="middle" fontSize={7.8} fontWeight={600} fill="rgb(111 211 160)">
                  {c("bd.than_ngan")}
                </text>
              )}
              {o.la_lai_nhan && (() => {
                const [lx, ly] = diemTron(186, a + 10.5);
                return <circle cx={lx} cy={ly} r={3} fill="rgb(233 196 106)"><title>{c("bd.lai_nhan")}</title></circle>;
              })()}

              {/* Chính tinh đầu + địa chi (xếp dọc dưới tên cung để không bao giờ đè nhau ở góc 3h/9h) */}
              {!nho && (
                <>
                  {o.chinh_tinh[0] && (
                    <text
                      x={tx}
                      y={ty + 8}
                      textAnchor="middle"
                      fontSize={8.8}
                      className="font-serif"
                      fill={o.vo_chinh_dieu ? "rgb(150 148 186)" : "rgb(214 211 230)"}
                      opacity={o.vo_chinh_dieu ? 0.72 : 0.95}
                    >
                      {tenGon(ten("sao", o.chinh_tinh[0].sao)).slice(0, 11)}
                    </text>
                  )}
                  <ConGiapVector chi={o.chi} mau={mauH(o.hanh_cung)} co={15} x={cxChi} y={cyChi} />
                </>
              )}

              {/* Chấm tứ hoá lưu niên của năm đang xem */}
              {hoaNamTaiDay.map((h, hi) => {
                const [hx, hy] = diemTron(95, a - 7 + hi * 5.5);
                return (
                  <circle key={h.hoa} cx={hx} cy={hy} r={3.2} fill={MAU_HOA[h.hoa] ?? "rgb(233 196 106)"}>
                    <title>{`${namDang.nam}: ${hoa(h.hoa)}`}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}

        {/* Huy hiệu Tuần / Triệt đặt đúng đường ranh giới cặp cung */}
        {ranhTuan !== null && ranhTriet !== null && Math.abs(ranhTuan - ranhTriet) < 0.1 ? (
          <HuyRanhGioi goc={ranhTuan} nhan={c("ls.tuan_triet")} />
        ) : (
          <>
            {ranhTuan !== null && <HuyRanhGioi goc={ranhTuan} nhan={c("ls.tuan")} />}
            {ranhTriet !== null && <HuyRanhGioi goc={ranhTriet} nhan={c("ls.triet")} />}
          </>
        )}
      </g>

      {/* Lõi Tam Phương Tứ Chính (tam giác vàng Tam hợp + dây đứt hổ phách Xung chiếu) */}
      <g pointerEvents="none" data-testid="bd-tam-phuong">
        <polygon
          points={`${ax},${ay} ${bx},${by} ${cx},${cy}`}
          fill="rgb(233 196 106 / 0.13)"
          stroke="rgb(233 196 106 / 0.78)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <line
          x1={ax}
          y1={ay}
          x2={xx}
          y2={xy}
          stroke="rgb(217 151 58)"
          strokeWidth={1.6}
          strokeDasharray="6 5"
          opacity={0.9}
        />
      </g>

      {/* Tâm bánh xe: Cục + Bản mệnh Nạp âm */}
      <g pointerEvents="none">
        <circle r={68} fill="url(#tvbd-tam)" stroke="rgb(52 52 92)" />
        <HanhVector hanh={bd.tam.hanh_cuc} co={66} y={-4} mo={0.2} />
        <text y={-4} textAnchor="middle" fontSize={nho ? 13 : 11.5} className="font-serif" fontWeight={600} fill={mauH(bd.tam.hanh_cuc)}>
          {tenGon(ten("cuc", bd.tam.cuc))}
        </text>
        <text y={14} textAnchor="middle" fontSize={nho ? 10.5 : 9} fill="rgb(170 168 205)">
          {tenGon(ten("nap_am", bd.tam.nap_am)).slice(0, 18)}
        </text>
      </g>

      {/* Kim năm kéo được + bàn phím mũi tên */}
      <line x1={gx} y1={gy} x2={kx} y2={ky} stroke="rgb(233 196 106)" strokeWidth={1.4} opacity={0.5} pointerEvents="none" />
      <circle cx={kx} cy={ky} r={17} fill="rgb(233 196 106)" opacity={0.28} filter="url(#tvbd-sang)" pointerEvents="none" />
      <g
        role="slider"
        tabIndex={0}
        aria-label={c("bd.nam.chon")}
        aria-valuemin={dau}
        aria-valuemax={cuoi}
        aria-valuenow={namDang.nam}
        data-testid="bd-kim"
        className="cursor-grab outline-none active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => { keo.current = true; svg.current?.setPointerCapture?.(e.pointerId); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setNam(Math.min(cuoi, namDang.nam + 1)); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setNam(Math.max(dau, namDang.nam - 1)); }
        }}
      >
        <circle cx={kx} cy={ky} r={20} fill="transparent" />
        <circle cx={kx} cy={ky} r={12.5} fill="rgb(233 196 106)" stroke="rgb(26 20 6)" strokeWidth={1.5} />
        <text x={kx} y={ky + 3.6} textAnchor="middle" fontSize={10} fontWeight={700} fill="rgb(26 20 6)">
          {String(namDang.nam).slice(2)}
        </text>
      </g>
    </svg>
  );
}

function HuyRanhGioi({ goc, nhan }: { goc: number; nhan: string }) {
  const [x, y] = diemTron(203, goc);
  const w = Math.max(28, nhan.length * 5.8 + 10);
  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none">
      <rect x={-w / 2} y={-8} width={w} height={16} rx={8} fill="rgb(18 18 44)" stroke="rgb(185 167 255 / 0.7)" strokeWidth={1} />
      <text y={3.2} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="rgb(185 167 255)">
        {nhan}
      </text>
    </g>
  );
}

// --------------------------------------------------------------------------- Tab 2 · Mạng lưới Đường bay Tứ Hoá & Chuỗi 2 chặng
function MangDuongBay({
  bd,
  oTheoMa,
  boLoc,
  chon,
  sang,
  chonO,
  chonChuoi,
}: {
  bd: BD;
  oTheoMa: Record<MaCung, CungBanDo>;
  boLoc: BoLocBay;
  chon: Chon;
  sang: Set<MaCung>;
  chonO: (m: MaCung) => void;
  chonChuoi: (idx: number) => void;
}) {
  const { c, ten } = useChuTuVi();
  const nho = useNho();
  const rNut = 212;
  const rCung = 180;

  return (
    <svg viewBox="-310 -310 620 620" role="group" aria-label={c("bd.aria_bay")} className="h-auto w-full select-none">
      <defs>
        <marker id="tvbd-mui-loc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={MAU_HOA["Lộc"]} />
        </marker>
        <marker id="tvbd-mui-quyen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={MAU_HOA["Quyền"]} />
        </marker>
        <marker id="tvbd-mui-khoa" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={MAU_HOA["Khoa"]} />
        </marker>
        <marker id="tvbd-mui-ky" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={MAU_HOA["Kỵ"]} />
        </marker>
      </defs>

      {SAO.map(([x, y, r], i) => (
        <circle key={i} cx={x * 0.96} cy={y * 0.96} r={r} fill="rgb(236 235 247)" opacity={0.2} />
      ))}
      <circle r={rCung} fill="rgb(14 14 34 / 0.45)" stroke="rgb(52 52 92 / 0.55)" strokeDasharray="3 6" />

      {/* Các đường bay 1 chặng (Đáng chú ý / Bay vào Mệnh) */}
      {(boLoc === "noi_bat" || boLoc === "vao_menh") && (() => {
        const ds = boLoc === "noi_bat"
          ? bd.duong_bay.noi_bat.map((n) => ({ key: n.ma, tu: n.tu, den: n.den, hoa: n.hoa, tu_hoa: n.tu_hoa, mo_ta: n.tieu_de }))
          : bd.duong_bay.vao_menh.map((n, i) => ({ key: `vm-${i}`, tu: n.tu, den: n.den, hoa: n.hoa, tu_hoa: n.tu_hoa, mo_ta: n.nghia }));

        if (!ds.length) {
          return <text y={4} textAnchor="middle" fontSize={12} fill="rgb(150 148 186)">{c("bd.loc.khong")}</text>;
        }
        return ds.map((d, idx) => {
          const oTu = oTheoMa[d.tu]!;
          const oDen = oTheoMa[d.den]!;
          const mau = MAU_HOA[d.hoa] ?? "rgb(233 196 106)";
          const mui = d.hoa === "Lộc" ? "url(#tvbd-mui-loc)"
            : d.hoa === "Quyền" ? "url(#tvbd-mui-quyen)"
              : d.hoa === "Khoa" ? "url(#tvbd-mui-khoa)"
                : "url(#tvbd-mui-ky)";
          if (d.tu_hoa) {
            const kh = khuyenTuHoa(rNut + 26, gocChi(oTu.chi_so));
            return (
              <path
                key={d.key}
                d={kh.d}
                fill="none"
                stroke={mau}
                strokeWidth={2}
                strokeDasharray={d.hoa === "Kỵ" ? "5 4" : undefined}
                markerEnd={mui}
              >
                <title>{d.mo_ta}</title>
              </path>
            );
          }
          const cb = cungBezier(rCung, gocChi(oTu.chi_so), gocChi(oDen.chi_so), (idx % 2 ? 1 : -1) * 8);
          const lienQuan = chon?.loai === "o" ? chon.ma === d.tu || chon.ma === d.den : true;
          return (
            <path
              key={d.key}
              d={cb.d}
              fill="none"
              stroke={mau}
              strokeWidth={d.hoa === "Quyền" ? 2.3 : 1.9}
              strokeDasharray={d.hoa === "Kỵ" ? "6 5" : undefined}
              opacity={lienQuan ? 0.92 : 0.25}
              markerEnd={mui}
            >
              <title>{d.mo_ta}</title>
            </path>
          );
        });
      })()}

      {/* Lọc Tự hoá */}
      {boLoc === "tu_hoa" && (
        bd.duong_bay.tu_hoa.length === 0 ? (
          <text y={4} textAnchor="middle" fontSize={12} fill="rgb(150 148 186)">{c("bd.loc.khong")}</text>
        ) : (
          bd.duong_bay.tu_hoa.map((d, idx) => {
            const oTu = oTheoMa[d.tu]!;
            const mau = MAU_HOA[d.hoa] ?? "rgb(233 196 106)";
            const kh = khuyenTuHoa(rNut + 26, gocChi(oTu.chi_so) + idx * 3);
            return (
              <path
                key={`${d.tu}-${d.hoa}`}
                d={kh.d}
                fill="none"
                stroke={mau}
                strokeWidth={2.2}
                strokeDasharray={d.hoa === "Kỵ" ? "5 4" : undefined}
              >
                <title>{d.nghia}</title>
              </path>
            );
          })
        )
      )}

      {/* Lọc Chuỗi 2 chặng A -> B -> C (`chuoi_chuyen_ky`) */}
      {boLoc === "chuoi" && (
        bd.duong_bay.chuoi_chuyen_ky.length === 0 ? (
          <text y={4} textAnchor="middle" fontSize={12} fill="rgb(150 148 186)">{c("bd.loc.khong")}</text>
        ) : (
          bd.duong_bay.chuoi_chuyen_ky.map((ch, idx) => {
            const aTu = gocChi(oTheoMa[ch.tu]!.chi_so);
            const aQua = gocChi(oTheoMa[ch.qua]!.chi_so);
            const aDen = gocChi(oTheoMa[ch.den]!.chi_so);
            const hai = chuoiBezierHaiChang(rCung, aTu, aQua, aDen);
            const dang = chon?.loai === "chuoi" && chon.idx === idx;
            const mo = chon?.loai === "chuoi" && !dang;
            const mau1 = ch.loai === "loc_chuyen_ky" ? MAU_HOA["Lộc"] : MAU_HOA["Kỵ"];
            const mui1 = ch.loai === "loc_chuyen_ky" ? "url(#tvbd-mui-loc)" : "url(#tvbd-mui-ky)";
            return (
              <g
                key={ch.ma_mau + idx}
                role="button"
                tabIndex={0}
                data-testid={`bd-chuoi-${idx}`}
                aria-label={ch.tieu_de}
                onClick={() => chonChuoi(idx)}
                onKeyDown={bamPhim(() => chonChuoi(idx))}
                className="cursor-pointer outline-none"
                style={{ opacity: mo ? 0.22 : 0.96, transition: "opacity .25s" }}
              >
                <title>{ch.tieu_de}</title>
                <path
                  d={hai.chang1}
                  fill="none"
                  stroke={mau1}
                  strokeWidth={dang ? 2.6 : 1.9}
                  strokeDasharray={ch.loai === "ky_chuyen_ky" ? "6 5" : undefined}
                  markerEnd={mui1}
                />
                <path
                  d={hai.chang2}
                  fill="none"
                  stroke={MAU_HOA["Kỵ"]}
                  strokeWidth={dang ? 2.6 : 1.9}
                  strokeDasharray="6 5"
                  markerEnd="url(#tvbd-mui-ky)"
                />
                <g transform={`translate(${hai.giua1[0]},${hai.giua1[1]})`}>
                  <circle r={9.5} fill="rgb(18 18 44)" stroke={mau1} strokeWidth={1.4} />
                  <text y={3.4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={mau1}>1</text>
                </g>
                <g transform={`translate(${hai.giua2[0]},${hai.giua2[1]})`}>
                  <circle r={9.5} fill="rgb(18 18 44)" stroke={MAU_HOA["Kỵ"]} strokeWidth={1.4} />
                  <text y={3.4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={MAU_HOA["Kỵ"]}>2</text>
                </g>
              </g>
            );
          })
        )
      )}

      {/* 12 nút cung xếp tròn */}
      {bd.o.map((o) => {
        const [x, y] = diemTron(rNut, gocChi(o.chi_so));
        const duoc = chon?.loai === "o" && chon.ma === o.ma;
        const laTramGiua = chon?.loai === "chuoi" && bd.duong_bay.chuoi_chuyen_ky[chon.idx]?.qua === o.ma;
        const mo = sang.size > 0 && !sang.has(o.ma);
        const tenNgan = tenGon(ten("cung", o.cung)).replace(/\s+Palace$/i, "");
        return (
          <g
            key={o.ma}
            role="button"
            tabIndex={0}
            aria-pressed={duoc}
            data-testid={`bd-nut-${o.ma}`}
            aria-label={c("bd.aria_o", { cung: ten("cung", o.cung), chi: ten("chi", o.chi), muc: o.nhan_muc })}
            onClick={() => chonO(o.ma)}
            onKeyDown={bamPhim(() => chonO(o.ma))}
            className="cursor-pointer outline-none"
            style={{ opacity: mo ? 0.35 : 1, transition: "opacity .25s" }}
          >
            {laTramGiua && <circle cx={x} cy={y} r={33} fill="none" stroke="rgb(233 196 106)" strokeWidth={1.5} strokeDasharray="3 3" />}
            <circle
              cx={x}
              cy={y}
              r={nho ? 28 : 26}
              fill={o.la_menh ? "rgb(48 42 34)" : "rgb(18 18 44)"}
              stroke={duoc ? "rgb(233 196 106)" : MAU_MUC[o.muc]}
              strokeWidth={duoc ? 2.6 : 1.7}
            />
            <text
              x={x}
              y={y - 1}
              textAnchor="middle"
              fontSize={nho ? 10.5 : 9}
              fontWeight={o.la_menh ? 700 : 600}
              fill={o.la_menh ? "rgb(233 196 106)" : "rgb(236 235 247)"}
            >
              {tenNgan.slice(0, 11)}
            </text>
            <text x={x} y={y + 12} textAnchor="middle" fontSize={8.5} fill="rgb(150 148 186)">
              {ten("chi", o.chi)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// --------------------------------------------------------------------------- Thanh điều khiển năm
function ThanhNamTV({
  bd,
  nam,
  setNam,
  chay,
  setChay,
}: {
  bd: BD;
  nam: number;
  setNam: (n: number) => void;
  chay: boolean;
  setChay: (v: boolean) => void;
}) {
  const { c } = useChuTuVi();
  const tg = bd.thoi_gian;
  const dau = tg.nam[0]!.nam;
  const cuoi = tg.nam[tg.nam.length - 1]!.nam;
  const tong = cuoi - dau || 1;
  const pt = (n: number) => `${((n - dau) / tong) * 100}%`;
  return (
    <div className="mx-auto mt-3 max-w-[36rem] rounded-2xl border border-line/60 bg-[rgb(var(--bg)/0.5)] px-3 py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { if (!chay && nam >= cuoi) setNam(dau); setChay(!chay); }}
          aria-label={chay ? c("bd.nam.dung") : c("bd.nam.chay")}
          data-testid="bd-chay"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-[#1a1406] shadow-[0_0_16px_rgb(233_196_106/0.4)]"
        >
          {chay ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => setNam(Math.max(dau, nam - 1))}
          aria-label={c("bd.nam.truoc")}
          className="rounded-full border border-line/70 p-1.5"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 -top-2 h-3">
            <span aria-hidden className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 rounded bg-moon" style={{ left: pt(tg.nam_xem) }} />
          </div>
          <input
            type="range"
            min={dau}
            max={cuoi}
            value={nam}
            onChange={(e) => setNam(Number(e.target.value))}
            aria-label={c("bd.nam.chon")}
            data-testid="bd-nam-truot"
            className="w-full accent-[rgb(233_196_106)]"
          />
        </div>
        <button
          type="button"
          onClick={() => setNam(Math.min(cuoi, nam + 1))}
          aria-label={c("bd.nam.sau")}
          className="rounded-full border border-line/70 p-1.5"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <span className="w-12 text-right font-serif text-xl tabular-nums" aria-live="polite">{nam}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[0.72rem] text-fg-faint">{tg.hoi_dan}</p>
        {nam !== tg.nam_xem && (
          <button
            type="button"
            onClick={() => setNam(tg.nam_xem)}
            className="shrink-0 rounded-full border border-line/70 px-2.5 py-0.5 text-xs"
          >
            {c("bd.nam.nay")}
          </button>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- Tấm bảng chi tiết (cột phải PC / trượt đáy mobile)
function TamBang({ children, onDong, tieuDe }: { children: ReactNode; onDong: () => void; tieuDe: ReactNode }) {
  const { c } = useChuTuVi();
  const mayTinh = useMayTinh();
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    h.current?.focus({ preventScroll: window.matchMedia(MQ_LG).matches });
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onDong(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onDong]);

  const bang = (
    <>
      <div aria-hidden className="fixed inset-0 z-[60] bg-black/55 lg:hidden" onClick={onDong} />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="tvbd-bang-tieu-de"
        data-testid="bd-bang-o"
        className="fixed inset-x-0 bottom-0 z-[61] max-h-[80vh] overflow-y-auto rounded-t-3xl border border-line/70 bg-[rgb(var(--bg))] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl
          lg:static lg:z-auto lg:max-h-[42rem] lg:rounded-2xl lg:bg-[rgb(var(--bg)/0.6)] lg:p-4 lg:shadow-none"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line lg:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <h3 id="tvbd-bang-tieu-de" ref={h} tabIndex={-1} className="font-serif text-2xl outline-none">{tieuDe}</h3>
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

function BangCung({
  o,
  oTheoMa,
  coBaoCao,
  onDong,
  onChon,
  onChonCung,
  moChuong,
}: {
  o: CungBanDo;
  oTheoMa: Record<MaCung, CungBanDo>;
  coBaoCao: boolean;
  onDong: () => void;
  onChon: (m: MaCung) => void;
  onChonCung?: (chi: string) => void;
  moChuong: (ma: string) => void;
}) {
  const { c, ten } = useChuTuVi();
  const mauMuc = MAU_MUC[o.muc];
  const cacLienDoi: MaCung[] = [o.tam_phuong.xung, ...o.tam_phuong.tam_hop];

  return (
    <TamBang
      onDong={onDong}
      tieuDe={
        <span className="flex flex-wrap items-center gap-2">
          <svg viewBox="-14 -14 28 28" className="size-8 shrink-0" aria-hidden>
            <ConGiapVector chi={o.chi} mau={mauH(o.hanh_cung)} co={22} />
          </svg>
          <span>{ten("cung", o.cung)}</span>
          <span className="text-base text-fg-muted">({ten("can", o.can)} {ten("chi", o.chi)})</span>
        </span>
      }
    >
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ color: mauMuc, background: `color-mix(in srgb, ${mauMuc} 16%, transparent)` }}
        >
          {o.nhan_muc}
        </span>
        {o.la_than && (
          <span className="rounded-full border border-jade/45 px-2 py-0.5 text-xs text-jade">{c("ls.than_cu")}</span>
        )}
        {o.la_lai_nhan && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/45 px-2 py-0.5 text-xs text-gold">
            <Sparkles className="size-3" aria-hidden /> {c("bd.lai_nhan")}
          </span>
        )}
      </div>

      {/* Lớp 1: Cung này nói gì về bạn */}
      <div className="mt-4">
        <p className="eyebrow">{c("bd.muc.la_gi")}</p>
        <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-fg">
          {o.la_gi.map((x) => <p key={x}>{x}</p>)}
        </div>
      </div>

      {/* Lớp 2: Tam phương tứ chính */}
      <div className="mt-4">
        <p className="eyebrow">{c("bd.muc.tam_phuong")}</p>
        <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-fg">
          {o.tam_phuong.cau.map((x) => <p key={x}>{x}</p>)}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cacLienDoi.map((m) => {
            const ok = oTheoMa[m]!;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onChon(m)}
                className="rounded-full border border-line/70 px-2.5 py-1 text-xs text-fg-muted hover:border-gold/50 hover:text-fg"
              >
                {tenGon(ten("cung", ok.cung))}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lớp 3: Đường bay tứ hoá qua cung */}
      {o.bay_cung.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow">{c("bd.muc.bay_cung")}</p>
          <ul className="mt-1.5 space-y-1">
            {o.bay_cung.map((b, idx) => (
              <li key={`${b.chieu}-${b.cung_kia}-${b.hoa}-${idx}`}>
                <button
                  type="button"
                  onClick={() => onChon(b.cung_kia)}
                  className="flex w-full gap-2 rounded-lg px-1.5 py-1.5 text-left text-sm text-fg-muted hover:bg-fg/5"
                >
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-0.5 w-4 shrink-0 rounded"
                    style={{ background: MAU_HOA[b.hoa] ?? "rgb(233 196 106)" }}
                  />
                  <span>{b.cau}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lớp 4: Năm tới chạm vào cung này */}
      {o.nam.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow">{c("bd.muc.nam")}</p>
          <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-fg">
            {o.nam.map((n) => (
              <li key={n.nam} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-2 inline-block size-2 shrink-0 rounded-full"
                  style={{ background: MAU_MUC[n.muc] }}
                />
                <span>{n.cau}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <ViSao canCu={o.vi_sao} nho />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {onChonCung && (
          <button
            type="button"
            onClick={() => { onDong(); onChonCung(o.chi); }}
            data-testid="bd-xem-tren-la-so"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-line/80 px-4 py-2 text-sm text-fg hover:border-gold/50"
          >
            <MousePointerClick className="size-4 text-gold" aria-hidden />
            {c("bd.xem_tren_la_so")}
          </button>
        )}
        {coBaoCao && (
          <button
            type="button"
            onClick={() => moChuong(o.chuong)}
            data-testid="bd-doc-chuong"
            className="w-full rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-[#1a1406] hover:brightness-105"
          >
            {c("bd.doc_chuong", { chuong: c(`bd.chuong.${o.chuong}`) })}
          </button>
        )}
      </div>
    </TamBang>
  );
}

function BangChuoi({
  ch,
  oTheoMa,
  tyLe,
  onDong,
  onChon,
  coBaoCao,
}: {
  ch: ChuoiHaiChang;
  oTheoMa: Record<MaCung, CungBanDo>;
  tyLe: BangTyLe;
  onDong: () => void;
  onChon: (m: MaCung) => void;
  /** false = đang xem lá số người thân (chỉ đọc) → không hiện "Đúng với mình". */
  coBaoCao: boolean;
}) {
  const { c, ten } = useChuTuVi();
  const tram: [MaCung, MaCung, MaCung] = [ch.tu, ch.qua, ch.den];
  return (
    <TamBang
      onDong={onDong}
      tieuDe={<span className="text-xl leading-snug">{ch.tieu_de}</span>}
    >
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className={cn(
          "rounded-full px-2.5 py-0.5 font-semibold",
          ch.loai === "loc_chuyen_ky" ? "bg-jade/15 text-jade" : "bg-[rgb(217_151_58/0.16)] text-[rgb(217_151_58)]",
        )}>
          {c(ch.loai === "loc_chuyen_ky" ? "bd.chuoi.lck" : "bd.chuoi.kck")}
        </span>
      </div>

      {/* Sơ đồ 3 trạm A -> B -> C bấm được */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" data-testid="bd-chuoi-3-tram">
        {tram.map((m, idx) => (
          <span key={`${m}-${idx}`} className="inline-flex items-center gap-1.5">
            {idx > 0 && <ArrowRight className="size-3.5 text-fg-faint" aria-hidden />}
            <button
              type="button"
              onClick={() => onChon(m)}
              className="rounded-full border border-line/70 px-2.5 py-1 text-xs font-medium text-fg hover:border-gold/60"
            >
              {tenGon(ten("cung", oTheoMa[m]!.cung))}
            </button>
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-fg">{ch.nghia}</p>
      {ch.viec_nen_lam && (
        <p className="mt-2.5 rounded-xl border border-jade/35 bg-jade/[0.06] p-3 text-sm text-fg">
          <b className="text-jade">{c("bd.chuoi.nen_lam")}</b> {ch.viec_nen_lam}
        </p>
      )}
      <div className="mt-3">
        <ViSao canCu={ch.can_cu} nho />
      </div>
      <div className="mt-3">
        {coBaoCao && <KiemChung loai="doi_song" mau={ch.ma_mau} phai={ch.phai} tyLe={tyLe[ch.ma_mau]} />}
      </div>
    </TamBang>
  );
}

// --------------------------------------------------------------------------- Thẻ năm chuẩn SAO-2
function TheNamTV({
  bd,
  oTheoMa,
  namDang,
  coBaoCao,
  moChuong,
  chonO,
  anMayTinh,
}: {
  bd: BD;
  oTheoMa: Record<MaCung, CungBanDo>;
  namDang: NamBanDoTV;
  coBaoCao: boolean;
  moChuong: (ma: string) => void;
  chonO: (m: MaCung) => void;
  anMayTinh: boolean;
}) {
  const { c, ten } = useChuTuVi();
  const tg = bd.thoi_gian;
  const van = namDang.dai_han != null ? tg.dai_van.find((v) => v.i === namDang.dai_han) : undefined;
  const oLn = oTheoMa[namDang.cung_luu_nien]!;

  return (
    <div className={cn("space-y-3", anMayTinh && "lg:hidden")} data-testid="bd-theo-nam">
      <div className="rounded-2xl border border-line/70 bg-[rgb(var(--bg)/0.6)] p-4" data-testid="bd-the-nam">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-serif text-lg">
            {namDang.nam} · {ten("can", namDang.can)} {ten("chi", namDang.chi)}
          </p>
          <span className="text-xs text-fg-muted">{c("bd.nam.tuoi", { tuoi: String(namDang.tuoi) })}</span>
        </div>

        {namDang.muc && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-fg-muted">{c("bd.nam.muc_chung")}</span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              data-testid="bd-muc-nam"
              style={{ color: MAU_MUC[namDang.muc], background: `color-mix(in srgb, ${MAU_MUC[namDang.muc]} 16%, transparent)` }}
            >
              {namDang.nhan_muc}
            </span>
            {namDang.mang && <span className="text-xs text-fg-muted">· {namDang.mang}</span>}
          </p>
        )}

        {namDang.y && <p className="mt-2 text-sm leading-relaxed text-fg">{namDang.y}</p>}

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

        {namDang.khoa && coBaoCao && (
          <div
            className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/40 bg-gold/[0.06] px-3 py-2"
            data-testid="bd-nam-khoa"
          >
            <p className="text-sm text-fg">{c("bd.nam.khoa", { nam: String(namDang.nam) })}</p>
            <button
              type="button"
              onClick={() => moChuong("van_han")}
              className="shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-[#1a1406]"
            >
              {c("bd.nam.mo_chuong")}
            </button>
          </div>
        )}

        <p className="mt-3 text-sm font-medium text-fg">{namDang.cau}</p>
        {van && <p className="mt-1.5 text-sm text-fg-muted">{van.cau}</p>}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => chonO(namDang.cung_luu_nien)}
            className="rounded-full border border-line/70 px-2.5 py-0.5 text-xs text-fg-muted hover:border-gold/50 hover:text-fg"
          >
            {tenGon(ten("cung", oLn.cung))} ({ten("chi", oLn.chi)})
          </button>
        </div>
      </div>
    </div>
  );
}
