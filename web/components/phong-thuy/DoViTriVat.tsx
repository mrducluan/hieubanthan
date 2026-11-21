"use client";
// VT-1 — "Đứng giữa nhà, chĩa điện thoại" (+ khung nhà theo tỉ lệ khi máy không có la bàn), nhiều tầng.
// Web CHỈ đọc cảm biến / điểm chạm rồi gửi số thô (mẫu la bàn, toạ độ 0..1) lên engine `/api/phongthuy/vi-tri-vat`:
// engine lấy trung bình góc, trừ nhiễu theo trục nhà, đổi ra phương / sơn, xét Cửa – Chủ – Bếp từng tầng, du niên với mệnh,
// sao Huyền Không. Số đo chỉ lưu TRÊN MÁY (hồ sơ nhà) khi người dùng bấm Lưu.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Compass, Layers, Plus, Ruler, Trash2 } from "lucide-react";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { KetQuaTamYeu, SachTamYeu, type TamYeuRes } from "@/components/phong-thuy/TamYeuCuaChuBep";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha, type LoaiVat } from "@/lib/ho-so-nha";
import { tenTheo, type TenHien } from "@/lib/ten-hien";
import { cn } from "@/lib/utils";

type DoVat = { mau?: number[]; diem?: [number, number]; sai_so?: number };
type TangDo = Partial<Record<LoaiVat, DoVat>>;

interface VatKq {
  loai: LoaiVat; ten: string; nguon: "la_ban" | "khung"; do: number; do_do: number; phuong: string; quai: string; son: string;
  sat_ranh_8: string | null; chua_on_dinh: boolean; canh_bao: string[];
  du_nien_menh?: { du_nien: string; cat: boolean }; sao?: { van: number; son: number; huong: number };
}
interface ViTriKq {
  lech: { do: number | null; ap_dung: boolean; nhieu_manh: boolean; loi: string };
  tang: { so: number; cua_tang: string; vat: VatKq[]; ghi_chu_cua?: string; chua_du?: string; tam_yeu?: TamYeuRes }[];
  luu_y_tham_khao: string;
  huyen_khong?: { van: number; cuc: string; cuc_ten?: string };
  ten_hien?: TenHien;
}

const VAT_TANG = (so: number): LoaiVat[] =>
  so === 1 ? ["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho"] : ["cau_thang", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho"];
const THOI_GIAN_GHI = 1200;            // ms lấy mẫu mỗi lần ghi
const TOI_DA_MAU = 30;                 // giữ ≤ 30 mẫu / vật (đủ để engine lấy trung bình, hồ sơ máy nhẹ)
const LUOI_N = 4;                      // lưới bỏ phần không xây (nhà chữ L…)

type SuKien = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
type CoXinQuyen = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/** Độ la bàn của cạnh trên máy khi cầm nằm ngang (iOS cho sẵn; Android: 360 − alpha tuyệt đối). Chỉ đọc cảm biến. */
function docDo(e: SuKien, tuyetDoi: boolean): number | null {
  if (typeof e.webkitCompassHeading === "number") return e.webkitCompassHeading;
  if ((tuyetDoi || e.absolute) && typeof e.alpha === "number") return (360 - e.alpha) % 360;
  return null;
}
/** Độ rung của dãy mẫu gần nhất (chênh lớn nhất so với mẫu đầu, theo vòng) — chỉ để hiện chỉ báo, engine mới chấm. */
function doRung(ds: number[]): number {
  if (ds.length < 2) return 0;
  const goc = ds[0]!;
  return Math.max(...ds.map((d) => Math.abs(((d - goc + 540) % 360) - 180)));
}
const thuGon = (ds: number[]) => (ds.length <= TOI_DA_MAU ? ds : Array.from({ length: TOI_DA_MAU }, (_, i) => ds[Math.floor((i * ds.length) / TOI_DA_MAU)]!));

export function DoViTriVat({ sinh }: { sinh?: { birth_date: string; gender: "nam" | "nu"; moc_nam?: string } | null }) {
  const { c, en } = useChuPT();
  const hoSo = useHoSoNha();
  const huongNha = hoSo?.huong_do ?? null;

  const [cheDo, setCheDo] = useState<"la_ban" | "khung">("la_ban");
  const [soTang, setSoTang] = useState(1);
  const [tang, setTang] = useState(1);
  const [doTang, setDoTang] = useState<Record<number, TangDo>>({});
  const [truc, setTruc] = useState<number[] | null>(null);
  const [khung, setKhung] = useState<{ rong: number; sau: number; luoi: boolean[][] | null }>({ rong: 5, sau: 15, luoi: null });
  const [dangDat, setDangDat] = useState<LoaiVat>("cua_chinh");
  const [boLuoi, setBoLuoi] = useState(false);
  const [du18, setDu18] = useState(false);
  const [kq, setKq] = useState<ViTriKq | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTinh, setDangTinh] = useState(false);
  const [daLuu, setDaLuu] = useState(false);
  const daNap = useRef(false);

  // la bàn
  const [bat, setBat] = useState(false);
  const [doSong, setDoSong] = useState<number | null>(null);
  const [nghieng, setNghieng] = useState(false);
  const [dangGhi, setDangGhi] = useState<LoaiVat | "truc" | null>(null);
  const mauSong = useRef<number[]>([]);
  const saiSo = useRef<number | undefined>(undefined);
  const gom = useRef<number[] | null>(null);
  const huy = useRef<(() => void) | null>(null);

  // Máy không la bàn / máy tính → mặc định khung tỉ lệ.
  useEffect(() => {
    try {
      const coCam = "DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches;
      if (!coCam) setCheDo("khung");
    } catch { setCheDo("khung"); }
  }, []);

  // Nạp số đo đã lưu (một lần).
  useEffect(() => {
    if (daNap.current || !hoSo) return;
    daNap.current = true;
    if (hoSo.tang_do?.length) {
      setDoTang(Object.fromEntries(hoSo.tang_do.map((t) => [t.so, t.vat as TangDo])));
      setSoTang(Math.max(...hoSo.tang_do.map((t) => t.so)));
    }
    if (hoSo.truc_mau) setTruc(hoSo.truc_mau);
    if (hoSo.khung) {
      setKhung({ rong: hoSo.khung.rong, sau: hoSo.khung.sau, luoi: hoSo.khung.luoi?.map((r) => [...r].map((x) => x === "1")) ?? null });
      if (hoSo.khung.luoi) setBoLuoi(true);
    }
  }, [hoSo]);

  useEffect(() => () => huy.current?.(), []);

  const batLaBan = useCallback(async () => {
    setLoi(null);
    if (!("DeviceOrientationEvent" in window)) { setLoi(c("dv.khong_cam_bien")); setCheDo("khung"); return; }
    const DOE = window.DeviceOrientationEvent as CoXinQuyen;
    if (typeof DOE.requestPermission === "function") {
      try { if ((await DOE.requestPermission()) !== "granted") { setLoi(c("dv.quyen")); return; } } catch { setLoi(c("dv.quyen")); return; }
    }
    const tuyetDoi = "ondeviceorientationabsolute" in window;
    const ten = tuyetDoi ? "deviceorientationabsolute" : "deviceorientation";
    let nhan = false;
    const nghe = (ev: Event) => {
      const e = ev as SuKien;
      const d = docDo(e, tuyetDoi);
      if (d == null) return;
      nhan = true;
      setDoSong(d);
      setNghieng(typeof e.beta === "number" && Math.abs(e.beta) > 60);
      mauSong.current = [...mauSong.current.slice(-19), d];
      if (typeof e.webkitCompassAccuracy === "number") saiSo.current = e.webkitCompassAccuracy;
      gom.current?.push(d);
    };
    window.addEventListener(ten, nghe);
    huy.current = () => window.removeEventListener(ten, nghe);
    setBat(true);
    window.setTimeout(() => { if (!nhan) { setLoi(c("dv.khong_cam_bien")); setCheDo("khung"); } }, 2500);
  }, [c]);

  const ghiMau = (cho: LoaiVat | "truc") => {
    if (!bat || dangGhi) return;
    gom.current = [];
    setDangGhi(cho);
    window.setTimeout(() => {
      const ds = gom.current ?? [];
      gom.current = null;
      setDangGhi(null);
      if (!ds.length) return;
      const mau = thuGon(ds.map((d) => Math.round(d * 10) / 10));
      setKq(null); setDaLuu(false);
      if (cho === "truc") setTruc(mau);
      else setDoTang((cu) => ({ ...cu, [tang]: { ...(cu[tang] ?? {}), [cho]: { mau, ...(saiSo.current != null ? { sai_so: saiSo.current } : {}) } } }));
      try { navigator.vibrate?.(30); } catch { /* không hỗ trợ */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_ghi", cho, cach: "la_ban" });
    }, THOI_GIAN_GHI);
  };

  const xoaVat = (l: LoaiVat) => {
    setKq(null); setDaLuu(false);
    setDoTang((cu) => { const t = { ...(cu[tang] ?? {}) }; delete t[l]; return { ...cu, [tang]: t }; });
  };

  // ---- khung tỉ lệ
  const svgRef = useRef<SVGSVGElement>(null);
  const datDiem = (ev: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    const x = Math.min(1, Math.max(0, p.x / khung.rong)), y = Math.min(1, Math.max(0, p.y / khung.sau));
    if (boLuoi) {
      const r = Math.min(LUOI_N - 1, Math.floor(y * LUOI_N)), col = Math.min(LUOI_N - 1, Math.floor(x * LUOI_N));
      setKhung((k) => {
        const l = k.luoi ?? Array.from({ length: LUOI_N }, () => Array(LUOI_N).fill(true));
        const moi = l.map((row, i) => row.map((v, j) => (i === r && j === col ? !v : v)));
        return { ...k, luoi: moi };
      });
      setKq(null);
      return;
    }
    setKq(null); setDaLuu(false);
    setDoTang((cu) => ({ ...cu, [tang]: { ...(cu[tang] ?? {}), [dangDat]: { diem: [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000] } } }));
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_ghi", cho: dangDat, cach: "khung" });
    const ds = VAT_TANG(tang);
    const tiep = ds[ds.indexOf(dangDat) + 1];
    if (tiep && !doTang[tang]?.[tiep]) setDangDat(tiep);
  };

  const luoiGui = useMemo(() => {
    if (!khung.luoi || khung.luoi.every((r) => r.every(Boolean))) return undefined;
    return khung.luoi.map((r) => r.map((v) => (v ? "1" : "0")).join(""));
  }, [khung.luoi]);

  const coGi = Object.values(doTang).some((t) => Object.keys(t).length > 0);

  const xem = async () => {
    setDangTinh(true); setLoi(null);
    const tangGui = Object.entries(doTang)
      .map(([so, t]) => ({
        so: Number(so),
        vat: (Object.entries(t) as [LoaiVat, DoVat][]).filter(([, v]) => v.mau || v.diem)
          .map(([loai, v]) => (v.diem ? { loai, diem: v.diem } : { loai, mau: v.mau!, ...(v.sai_so != null ? { sai_so: v.sai_so } : {}) })),
      }))
      .filter((t) => t.vat.length && t.so <= soTang);
    const coDiem = tangGui.some((t) => t.vat.some((v) => "diem" in v));
    try {
      const r = await postJson<ViTriKq>("/api/phongthuy/vi-tri-vat", {
        tang: tangGui,
        ...(huongNha != null ? { huong_nha_do: huongNha } : {}),
        ...(truc ? { truc_mau: truc } : {}),
        ...(coDiem ? { khung: { rong: khung.rong, sau: khung.sau, ...(luoiGui ? { luoi: luoiGui } : {}) } } : {}),
        ...(hoSo?.nam_xay ? { nam_xay: hoSo.nam_xay } : {}),
        ...(sinh ? { sinh } : {}),
        ...(du18 ? { du_18: true } : {}),
      });
      setKq(r);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_xem", so_tang: tangGui.length, co_truc: Boolean(truc), cach: coDiem ? "khung" : "la_ban" });
    } catch { setLoi(c("dv.loi")); }
    finally { setDangTinh(false); }
  };

  // du18 đổi → tính lại để hiện / ẩn nhóm C
  useEffect(() => { if (kq) void xem(); }, [du18]); // eslint-disable-line react-hooks/exhaustive-deps

  const luu = () => {
    const t1 = kq?.tang.find((t) => t.so === 1);
    const viTri: Record<string, string> = {};
    for (const v of t1?.vat ?? []) if (v.loai !== "cau_thang") viTri[v.loai] = v.phuong;
    try {
      luuHoSoNha({
        tang_do: Object.entries(doTang).filter(([so, t]) => Number(so) <= soTang && Object.keys(t).length)
          .map(([so, t]) => ({ so: Number(so), vat: t })),
        ...(truc ? { truc_mau: truc } : {}),
        khung: { rong: khung.rong, sau: khung.sau, ...(luoiGui ? { luoi: luoiGui } : {}) },
        ...(Object.keys(viTri).length ? { bo_cuc: { ...(hoSo?.bo_cuc ?? {}), vi_tri: { ...(hoSo?.bo_cuc?.vi_tri ?? {}), ...viTri } } } : {}),
      });
      setDaLuu(true);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_luu" });
    } catch { /* chế độ riêng tư */ }
  };

  const tenKq = tenTheo(kq?.ten_hien, en);
  const vatTang = VAT_TANG(tang);
  const doHienTai = doTang[tang] ?? {};
  const rung = doRung(mauSong.current);
  const mucRung = rung <= 3 ? "on_dinh" : rung <= 8 ? "hoi_rung" : "nhieu";

  return (
    <section id="vi-tri-vat" aria-labelledby="vi-tri-vat-ten" data-testid="vi-tri-vat" className="glass rounded-2xl p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wider text-gold">{c("dv.nhan")}</p>
      <h2 id="vi-tri-vat-ten" className="mt-1 font-serif text-xl text-fg sm:text-2xl">{c("dv.ten")}</h2>
      <p className="mt-1 text-sm text-fg-muted"><ChuB chu={c("dv.mo_ta")} /></p>

      <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={c("dv.ten")}>
        {([["la_ban", c("dv.cach_la_ban"), Compass], ["khung", c("dv.cach_khung"), Ruler]] as const).map(([m, nhan, Icon]) => (
          <button key={m} type="button" role="radio" aria-checked={cheDo === m} data-testid={`vi-tri-cach-${m}`} onClick={() => setCheDo(m)}
            className={cn("inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
              cheDo === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
            <Icon className="size-3.5 text-gold" aria-hidden /> {nhan}
          </button>
        ))}
      </div>

      {/* Tầng */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs" role="tablist" aria-label={c("dv.tang_ghi_chu")}>
        <Layers className="size-3.5 text-gold" aria-hidden />
        {Array.from({ length: soTang }, (_, i) => i + 1).map((so) => (
          <button key={so} type="button" role="tab" aria-selected={tang === so} data-testid={`vi-tri-tang-${so}`}
            onClick={() => { setTang(so); setDangDat(VAT_TANG(so)[0]!); }}
            className={cn("min-h-[36px] rounded-full border px-3 py-1", tang === so ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
            {c("dv.tang", { so: String(so) })}
          </button>
        ))}
        {soTang < 6 && (
          <button type="button" data-testid="vi-tri-them-tang" onClick={() => { setSoTang(soTang + 1); setTang(soTang + 1); setDangDat("cau_thang"); }}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-fg-muted hover:text-fg">
            <Plus className="size-3.5" aria-hidden /> {c("dv.them_tang")}
          </button>
        )}
        {soTang > 1 && <span className="text-fg-faint">{c("dv.tang_ghi_chu")}</span>}
      </div>

      {cheDo === "la_ban" ? (
        <div className="mt-4 space-y-3">
          {!bat ? (
            <button type="button" data-testid="vi-tri-bat" onClick={() => void batLaBan()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25">
              <Compass className="size-4" aria-hidden /> {c("dv.bat")}
            </button>
          ) : (
            <div className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm" aria-live="polite">
              <p className="text-fg">{c("dv.dang_chi", { do: doSong == null ? "—" : String(Math.round(doSong)) })}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs">
                <span className="cham-muc size-2 rounded-full" data-muc={mucRung === "on_dinh" ? "thuan" : mucRung === "hoi_rung" ? "can_bang" : "can_chu_dong"} />
                {c(`dv.${mucRung}`)}
              </p>
              {nghieng && <p className="mt-1 text-xs text-fg-muted">{c("dv.dung_nghieng")}</p>}
            </div>
          )}
          <p className="text-xs text-fg-muted">{c("dv.cam_may")}</p>

          {tang === 1 && (
            <div className="rounded-xl border border-line/70 bg-surface/30 p-3 text-sm">
              <p className="font-medium text-fg">{c("dv.truc")}</p>
              <p className="mt-0.5 text-xs text-fg-muted">{c("dv.truc_hd")}</p>
              <button type="button" disabled={!bat || Boolean(dangGhi)} onClick={() => ghiMau("truc")} data-testid="vi-tri-ghi-truc"
                className="mt-2 inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-fg disabled:opacity-50">
                {dangGhi === "truc" ? c("dv.dang_ghi") : truc ? <><Check className="size-3.5 text-jade" aria-hidden /> {c("dv.da_truc")}</> : c("dv.ghi_truc")}
              </button>
            </div>
          )}

          <p className="text-sm text-fg">{c("dv.vat_hd")}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {vatTang.map((l) => {
              const v = doHienTai[l];
              return (
                <li key={l} className="flex items-center justify-between gap-2 rounded-xl border border-line/70 bg-surface/40 p-2.5">
                  <button type="button" disabled={!bat || Boolean(dangGhi)} onClick={() => ghiMau(l)} data-testid={`vi-tri-ghi-${l}`}
                    className="min-h-[40px] flex-1 rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-left text-sm text-fg disabled:opacity-50">
                    {dangGhi === l ? c("dv.dang_ghi") : v?.mau ? c("dv.da_ghi", { vat: c(`dv.ten.${l}`), do: String(Math.round(v.mau[0]!)) }) : c("dv.ghi", { vat: c(`dv.ten.${l}`) })}
                  </button>
                  {v && <button type="button" onClick={() => xoaVat(l)} aria-label={`${c("dv.xoa")} ${c(`dv.ten.${l}`)}`} className="p-2 text-fg-faint hover:text-fg"><Trash2 className="size-4" aria-hidden /></button>}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {huongNha == null && <p className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm text-fg-muted" data-testid="vi-tri-can-huong">{c("dv.can_huong")}</p>}
          <p className="text-xs text-fg-muted">{c("dv.khung_hd")}</p>
          <div className="flex flex-wrap items-end gap-3 text-sm">
            {(["rong", "sau"] as const).map((k) => (
              <label key={k} className="flex flex-col gap-1 text-xs text-fg-muted">
                {c(`dv.${k}`)}
                <input type="number" min={1} max={200} step={0.5} value={khung[k]} data-testid={`vi-tri-${k}`}
                  onChange={(e) => { const n = Number(e.target.value); if (n > 0 && n <= 200) { setKhung((x) => ({ ...x, [k]: n })); setKq(null); } }}
                  className="w-24 rounded-lg border border-line bg-bg/40 px-2 py-1.5 text-sm text-fg" />
              </label>
            ))}
            <label className="inline-flex min-h-[36px] items-center gap-2 text-xs text-fg">
              <input type="checkbox" checked={boLuoi} onChange={(e) => setBoLuoi(e.target.checked)} data-testid="vi-tri-bo-luoi" />
              {c("dv.khong_vuong")}
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-fg-muted">{c("dv.dang_dat")}</span>
            {vatTang.map((l) => (
              <button key={l} type="button" aria-pressed={dangDat === l && !boLuoi} data-testid={`vi-tri-dat-${l}`}
                onClick={() => { setDangDat(l); setBoLuoi(false); }}
                className={cn("min-h-[36px] rounded-full border px-2.5 py-1", dangDat === l && !boLuoi ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg",
                  doHienTai[l] && "font-medium")}>
                {c(`dv.ten.${l}`)}{doHienTai[l] ? " ✓" : ""}
              </button>
            ))}
          </div>
          <div className="mx-auto w-full max-w-md">
            <p className="text-center text-[11px] uppercase tracking-wide text-gold">{c("dv.mat_truoc")}{huongNha != null ? ` · ${Math.round(huongNha)}°` : ""}</p>
            <svg ref={svgRef} viewBox={`0 0 ${khung.rong} ${khung.sau}`} preserveAspectRatio="xMidYMid meet" data-testid="vi-tri-khung"
              className="mx-auto block touch-none select-none"
              style={{ aspectRatio: `${khung.rong} / ${khung.sau}`, width: `min(100%, calc(60vh * ${khung.rong / khung.sau}))` }}
              onPointerDown={datDiem} role="group" aria-label={c("dv.khung_hd")}>
              <rect x={0} y={0} width={khung.rong} height={khung.sau} fill="rgb(var(--surface) / 0.5)" stroke="rgb(var(--gold) / 0.7)" strokeWidth={Math.max(khung.rong, khung.sau) / 150} />
              {khung.luoi && khung.luoi.map((row, i) => row.map((v, j) => !v ? (
                <rect key={`${i}-${j}`} x={(j * khung.rong) / LUOI_N} y={(i * khung.sau) / LUOI_N} width={khung.rong / LUOI_N} height={khung.sau / LUOI_N}
                  fill="rgb(var(--bg))" stroke="rgb(var(--line) / 0.5)" strokeWidth={Math.max(khung.rong, khung.sau) / 300} />
              ) : null))}
              {boLuoi && Array.from({ length: LUOI_N - 1 }, (_, i) => i + 1).map((i) => (
                <g key={i} stroke="rgb(var(--line) / 0.7)" strokeWidth={Math.max(khung.rong, khung.sau) / 300} strokeDasharray="0.3 0.3">
                  <line x1={(i * khung.rong) / LUOI_N} y1={0} x2={(i * khung.rong) / LUOI_N} y2={khung.sau} />
                  <line x1={0} y1={(i * khung.sau) / LUOI_N} x2={khung.rong} y2={(i * khung.sau) / LUOI_N} />
                </g>
              ))}
              {(Object.entries(doHienTai) as [LoaiVat, DoVat][]).filter(([, v]) => v.diem).map(([l, v]) => {
                const nho = Math.min(khung.rong, khung.sau), r = nho / 16;
                const x = v.diem![0], y = v.diem![1];
                const neo = x < 0.34 ? "start" : x > 0.66 ? "end" : "middle";
                return (
                  <g key={l}>
                    <circle cx={x * khung.rong} cy={y * khung.sau} r={r} fill="rgb(var(--gold))" />
                    <text x={x * khung.rong} y={y * khung.sau + (y < 0.1 ? r * 3 : -r * 1.6)} textAnchor={neo} fontSize={nho / 9}
                      fill="rgb(var(--fg))">{c(`dv.ten.${l}`)}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {loi && <p className="mt-3 text-sm text-fg-muted">{loi}</p>}

      <div className="mt-4">
        <button type="button" disabled={!coGi || dangTinh} onClick={() => void xem()} data-testid="vi-tri-xem"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25 disabled:opacity-50">
          {dangTinh ? c("dv.dang_tinh") : c("dv.xem")}
        </button>
      </div>

      {kq && (
        <div className="mt-5 space-y-5" aria-live="polite" data-testid="vi-tri-ket-qua">
          <p className="text-xs text-fg-muted">{kq.lech.loi}</p>
          {kq.tang.map((t) => (
            <div key={t.so} className="space-y-3" data-testid={`vi-tri-kq-tang-${t.so}`}>
              <h3 className="text-base font-medium text-fg">{c("dv.tang", { so: String(t.so) })}</h3>
              {t.ghi_chu_cua && <p className="text-xs text-fg-faint">{t.ghi_chu_cua}</p>}
              <ul className="grid gap-2 sm:grid-cols-2">
                {t.vat.map((v) => (
                  <li key={v.loai} className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm" data-testid={`vi-tri-vat-${v.loai}`}>
                    <p className="font-medium text-fg">{v.ten} · {c("dv.phia", { huong: tenKq("huong", v.phuong) })}</p>
                    <p className="text-xs text-fg-muted">{Math.round(v.do)}° · {c("dv.son", { son: tenKq("son", v.son) })}</p>
                    {v.du_nien_menh && (
                      <p className="mt-1 text-xs"><span className="chip-muc rounded-full border px-2 py-0.5" data-muc={v.du_nien_menh.cat ? "thuan" : "can_chu_dong"}>
                        {c("dv.voi_menh", { du_nien: tenKq("du_nien", v.du_nien_menh.du_nien) })}</span></p>
                    )}
                    {v.sao && <p className="mt-1 text-xs text-fg-muted">{c("dv.sao", { van: String(v.sao.van), son: String(v.sao.son), huong: String(v.sao.huong) })}</p>}
                    {v.canh_bao.map((x, i) => <p key={i} className="mt-1 text-xs text-fg-muted">{x}</p>)}
                  </li>
                ))}
              </ul>
              {t.tam_yeu ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-fg">{c("dv.ket_qua_tang", { so: String(t.so) })}</p>
                  <KetQuaTamYeu kq={t.tam_yeu} />
                </div>
              ) : t.chua_du ? <p className="text-xs text-fg-faint">{t.chua_du}</p> : null}
            </div>
          ))}
          {kq.tang.find((t) => t.tam_yeu)?.tam_yeu ? (
            <SachTamYeu kq={kq.tang.find((t) => t.tam_yeu)!.tam_yeu!} coNamSinh={Boolean(sinh)} du18={du18} onDu18={setDu18} />
          ) : <p className="text-[11px] leading-relaxed text-fg-faint">{kq.luu_y_tham_khao}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={luu} data-testid="vi-tri-luu"
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-medium text-gold hover:bg-gold/25">
              {daLuu ? <><Check className="size-3.5" aria-hidden /> {c("dv.da_luu")}</> : c("dv.luu")}
            </button>
            <span className="text-fg-faint">{c("dv.luu_ghi_chu")}</span>
          </div>
        </div>
      )}
    </section>
  );
}

