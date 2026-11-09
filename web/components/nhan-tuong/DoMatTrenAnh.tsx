"use client";
// ANH-2 — "Đo trên ảnh": hệ thống hieuban TỰ ĐO, không dùng AI. Người dùng chọn ảnh chân dung của chính mình (ảnh chỉ hiện
// bằng `blob:` trên máy, KHÔNG tải lên), chấm lần lượt 20 điểm mốc theo hướng dẫn (chạm để đặt, kéo để chỉnh, bàn phím
// mũi tên để nhích), web gửi toạ độ chuẩn hoá 0..1 + tỉ lệ khung ảnh tới engine `/v1/nhan-tuong/do-mat`: CALC xoay theo
// đường hai đuôi mắt, đo tỉ lệ "tam đình ngũ nhãn", gợi ý lựa chọn khảo sát → người dùng xác nhận → bài đọc. Web không tính
// gì: hình hướng dẫn là hình tĩnh (khuôn mặt mẫu), không đo. Điểm mốc gương mặt vẫn là dữ liệu nhạy cảm → thoả thuận
// `dm1` (không tích sẵn, rút được) trước khi gửi; không lưu ở đâu.
// ANH-3: chọn ảnh xong, máy người dùng TỰ TÌM điểm mốc (lib/diem-moc-tu-dong — chạy trong trình duyệt, ảnh không đi đâu) và
// đặt sẵn các chấm; người dùng chỉ xem lại, kéo chấm lệch. Không tìm được → chấm tay như cũ.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, RotateCcw, Ruler, ScanFace, ShieldCheck, Undo2, X } from "lucide-react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { DONG_Y_DO_MAT, ngayDongYAnhMat } from "@/lib/dong-y-anh-mat";
import type { KetQuaTim } from "@/lib/diem-moc-tu-dong";
import { postJson } from "@/lib/goi-api";
import type { DiemDo, KhaoSat, TraLoi } from "@/lib/nhan-tuong";
import { cn } from "@/lib/utils";
import { ChamNghieng, type AnhNghieng, type GocNghieng } from "./ChamNghieng";
import { QuetBaGoc, type KetQuaQuet } from "./QuetBaGoc";
import { DanhSachGoiY, type GoiYNet } from "./DanhSachGoiY";

type Diem = { x: number; y: number };
interface KqDo { goi_y: GoiYNet[]; canh_bao: string[];
  so_do: { tam_dinh: { thuong: number; trung: number; ha: number } | null; cao_rong: number; tran_ma: number; ham_ma: number; mat_mat: number; may_khoe: number } }

/** Vị trí các điểm trên KHUÔN MẶT MẪU của hình hướng dẫn (hình tĩnh, không phải số đo của ai). */
const MAU: Record<string, [number, number]> = {
  chan_toc: [50, 14], thai_trai: [30, 36], thai_phai: [70, 36], ma_trai: [27, 48], ma_phai: [73, 48], ham_trai: [33, 72], ham_phai: [67, 72],
  cam: [50, 86], may_trai: [44, 37], may_phai: [56, 37], mat_ngoai_trai: [33, 43], mat_trong_trai: [44, 44], mat_trong_phai: [56, 44],
  mat_ngoai_phai: [67, 43], chan_mui: [50, 60], canh_mui_trai: [44, 58], canh_mui_phai: [56, 58], mep_trai: [41, 69], giua_moi: [50, 68],
  mep_phai: [59, 69], dinh_tai: [20, 38], dai_tai: [21, 60],
};
type TrangThaiTim = null | "dang" | KetQuaTim["trang_thai"];
const LOI_TIM: Record<string, string> = {
  khong_thay: "Máy chưa thấy rõ gương mặt trong ảnh — chọn ảnh chụp thẳng, đủ sáng, hoặc tự chấm theo hướng dẫn bên dưới.",
  nhieu_mat: "Ảnh có nhiều hơn một gương mặt — chọn ảnh chỉ có bạn, hoặc tự chấm các điểm của chính bạn.",
  loi: "Máy này chưa chạy được bộ tự tìm điểm (trình duyệt cũ hoặc thiếu bộ nhớ) — bạn tự chấm theo hướng dẫn bên dưới.",
};
/** Vùng ảnh đang hiện (toạ độ 0..1 của ảnh). Ảnh bán thân: sau khi máy tìm thấy mặt, phóng vào mặt để chấm không chồng nhau. */
type Vung = { x: number; y: number; w: number; h: number };
const CA_ANH: Vung = { x: 0, y: 0, w: 1, h: 1 };
function vungMat(d: Record<string, Diem>): Vung | null {
  const ds = Object.values(d);
  if (ds.length < 4) return null;
  const x0 = Math.min(...ds.map((p) => p.x)), x1 = Math.max(...ds.map((p) => p.x)), y0 = Math.min(...ds.map((p) => p.y)), y1 = Math.max(...ds.map((p) => p.y));
  const bw = x1 - x0, bh = y1 - y0;
  const v = { x: Math.max(0, x0 - bw * 0.45), y: Math.max(0, y0 - bh * 0.22), w: 0, h: 0 };
  v.w = Math.min(1, x1 + bw * 0.45) - v.x; v.h = Math.min(1, y1 + bh * 0.12) - v.y;
  return v.w * v.h > 0.8 ? null : v;                 // mặt đã chiếm gần hết ảnh → không cần phóng
}
const urlBlob = (f: File): string | null => { const u = URL.createObjectURL(f); return u.startsWith("blob:") ? u : null; };
const so = (v: number) => v.toFixed(2).replace(".", ",");

function HinhMau({ dang, da }: { dang: string | null; da: Set<string> }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full" aria-hidden>
      <path d="M50 8 C30 8 22 24 23 42 C24 62 34 84 50 88 C66 84 76 62 77 42 C78 24 70 8 50 8 Z" className="fill-surface/50 stroke-line" strokeWidth={0.8} />
      <path d="M20 40 Q15 48 21 60 M80 40 Q85 48 79 60" className="fill-none stroke-line" strokeWidth={0.8} />
      <path d="M36 37 Q40 34 46 36 M54 36 Q60 34 64 37" className="fill-none stroke-fg-faint" strokeWidth={0.9} />
      <path d="M33 43 Q38 40 44 44 Q38 46 33 43 M56 44 Q62 40 67 43 Q62 46 56 44" className="fill-none stroke-fg-faint" strokeWidth={0.7} />
      <path d="M50 45 L47 58 Q50 61 53 58 Z M41 69 Q50 65 59 69 Q50 73 41 69" className="fill-none stroke-fg-faint" strokeWidth={0.7} />
      {Object.entries(MAU).map(([ma, [x, y]]) => (
        <circle key={ma} cx={x} cy={y} r={ma === dang ? 2.6 : 1.6}
          className={cn(ma === dang ? "fill-gold stroke-bg" : da.has(ma) ? "fill-jade/80 stroke-bg" : "fill-fg-faint/50 stroke-bg")} strokeWidth={0.5} />
      ))}
    </svg>
  );
}

export function DoMatTrenAnh({ ks, daTraLoi, onGoiY, onXem, dangXem }: {
  ks: KhaoSat; daTraLoi: TraLoi; onGoiY: (tl: TraLoi) => void; onXem: () => void; dangXem?: boolean;
}) {
  const dsDiem: DiemDo[] = useMemo(() => ks.diem_do?.diem ?? [], [ks]);
  const batBuoc = useMemo(() => dsDiem.filter((d) => d.bat_buoc).map((d) => d.ma), [dsDiem]);
  const [url, setUrl] = useState<string | null>(null);
  const [tiLe, setTiLe] = useState<number | null>(null);
  const [diem, setDiem] = useState<Record<string, Diem>>({});
  const [dang, setDang] = useState<string | null>(null);
  const [keo, setKeo] = useState<string | null>(null);
  const [tick, setTick] = useState(false);
  const dongY = DONG_Y_DO_MAT.use();
  const [tinh, setTinh] = useState(false);
  const [kq, setKq] = useState<KqDo | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [tim, setTim] = useState<TrangThaiTim>(null);
  const [canXem, setCanXem] = useState<string[]>([]);
  const [vungPhong, setVungPhong] = useState<Vung | null>(null);
  const [nghieng, setNghieng] = useState<Partial<Record<GocNghieng, AnhNghieng>>>({});
  const dsNghieng = useMemo(() => ks.diem_do?.diem_nghieng ?? [], [ks]);
  const doiNghieng = useCallback((goc: GocNghieng, a: AnhNghieng | null) => {
    setNghieng((n) => { const { [goc]: _cu, ...con } = n; return a ? { ...con, [goc]: a } : con; }); setKq(null);
  }, []);
  const nghiengDu = (Object.entries(nghieng) as [GocNghieng, AnhNghieng][])
    .filter(([, a]) => a.tiLe && dsNghieng.every((p) => !p.bat_buoc || a.diem[p.ma]));
  const nghiengThieu = Object.keys(nghieng).length - nghiengDu.length;
  const [phong, setPhong] = useState(true);
  // QBG-1: "Quét 3 góc như Face ID" — ảnh thẳng vào khung chấm điểm, ảnh nghiêng nạp sẵn vào khung chấm đường viền.
  const [quet, setQuet] = useState(false);
  const [nghiengQuet, setNghiengQuet] = useState<Partial<Record<GocNghieng, File>>>({});
  const moQuet = () => { setQuet(true); ghi("chart_interacted", { mo_dun: "nhantuong", kind: "quet_mo" }); };
  const dongQuet = useCallback(() => setQuet(false), []);
  const vung = phong && vungPhong && tiLe ? vungPhong : CA_ANH;
  const phongTo = vung !== CA_ANH;
  const raKhung = (p: Diem) => ({ x: (p.x - vung.x) / vung.w, y: (p.y - vung.y) / vung.h });
  const khung = useRef<HTMLDivElement>(null);
  const anhRef = useRef<HTMLImageElement>(null);
  const luotTim = useRef(0);
  const urlRef = useRef<string | null>(null);
  urlRef.current = url;
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const tiepTheo = useCallback((d: Record<string, Diem>) => dsDiem.find((p) => !d[p.ma])?.ma ?? null, [dsDiem]);
  const chonAnh = (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    const u = urlBlob(f);
    if (!u) return;
    if (url) URL.revokeObjectURL(url);
    luotTim.current++;
    setUrl(u); setTiLe(null); setDiem({}); setKq(null); setLoi(null); setDang(dsDiem[0]?.ma ?? null); setTim(null); setCanXem([]); setVungPhong(null);
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: "do_mat_chon_anh" });
  };
  // Tự tìm điểm mốc trên máy. Chấm người dùng đã đặt trong lúc chờ được GIỮ (không bị đè).
  const tuTim = async (img: HTMLImageElement, deLai: boolean) => {
    const luot = ++luotTim.current;
    setTim("dang"); setKq(null);
    const { timDiemMoc } = await import("@/lib/diem-moc-tu-dong");
    const r = await timDiemMoc(img);
    if (luot !== luotTim.current) return;
    setTim(r.trang_thai);
    if (r.trang_thai !== "xong") {
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "do_mat_tu_tim", ket_qua: r.trang_thai });
      return;
    }
    const xem = ["chan_toc", ...r.thieu].filter((m, i, a) => a.indexOf(m) === i);
    setCanXem(xem);
    setDiem((d) => (deLai ? { ...r.diem } : { ...r.diem, ...d }));
    setVungPhong(vungMat(r.diem)); setPhong(true);
    setDang(r.thieu[0] ?? null);
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: "do_mat_tu_tim", ket_qua: "xong", so_diem: Object.keys(r.diem).length });
  };
  const viTri = (e: { clientX: number; clientY: number }): Diem | null => {
    const r = khung.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return null;
    const rx = (e.clientX - r.left) / r.width, ry = (e.clientY - r.top) / r.height;
    return { x: Math.min(1, Math.max(0, vung.x + rx * vung.w)), y: Math.min(1, Math.max(0, vung.y + ry * vung.h)) };
  };
  // Điểm đang chọn chưa đặt → chạm là ĐẶT (chỉ bắt điểm cũ khi chạm gần như trúng nó, 8 px — cánh mũi chỉ cách chân mũi
  // ~16 px trên điện thoại); điểm đang chọn đã đặt → chạm trong 20 px là KÉO điểm gần nhất.
  const ganNhat = (e: { clientX: number; clientY: number }): string | null => {
    const r = khung.current?.getBoundingClientRect();
    if (!r) return null;
    let tot: string | null = null, kc = dang && !diem[dang] ? 8 : 20;
    for (const [ma, p] of Object.entries(diem)) {
      const k = raKhung(p);
      const d = Math.hypot(r.left + k.x * r.width - e.clientX, r.top + k.y * r.height - e.clientY);
      if (d < kc) { kc = d; tot = ma; }
    }
    return tot;
  };
  const xuong = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = ganNhat(e);
    if (g) { setKeo(g); setDang(g); e.currentTarget.setPointerCapture(e.pointerId); return; }
    const p = viTri(e);
    if (!p || !dang) return;
    const moi = { ...diem, [dang]: p };
    setCanXem((c) => c.filter((m) => m !== dang));
    setDiem(moi); setKq(null);
    setDang(tiepTheo(moi) ?? dang);
  };
  const di = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!keo) return;
    const p = viTri(e);
    if (p) { setDiem((d) => ({ ...d, [keo]: p })); setKq(null); setCanXem((c) => c.filter((m) => m !== keo)); }
  };
  const len = () => setKeo(null);
  const nhich = (e: React.KeyboardEvent) => {
    if (!dang || !diem[dang]) return;
    const b = (e.shiftKey ? 0.02 : 0.004) * vung.w;
    const d = { ArrowLeft: [-b, 0], ArrowRight: [b, 0], ArrowUp: [0, -b], ArrowDown: [0, b] }[e.key];
    if (!d) return;
    e.preventDefault();
    const p = diem[dang]!;
    setDiem({ ...diem, [dang]: { x: Math.min(1, Math.max(0, p.x + d[0]!)), y: Math.min(1, Math.max(0, p.y + d[1]!)) } }); setKq(null);
  };
  const boLuot = () => {
    const daDat = dsDiem.filter((p) => diem[p.ma]).map((p) => p.ma);
    const cuoi = daDat[daDat.length - 1];
    if (!cuoi) return;
    const { [cuoi]: _bo, ...con } = diem;
    setDiem(con); setDang(cuoi); setKq(null);
  };

  const daDat = useMemo(() => new Set(Object.keys(diem)), [diem]);
  const du = batBuoc.every((m) => diem[m]);
  const sanSang = Boolean(url && tiLe && du && (dongY || tick) && !tinh);
  const thongTin = dsDiem.find((p) => p.ma === dang);
  const nhom = ks.diem_do?.nhom ?? {};

  const doNgay = async () => {
    if (!sanSang || !tiLe) return;
    if (!DONG_Y_DO_MAT.da()) DONG_Y_DO_MAT.ghi();
    setTinh(true); setLoi(null); setKq(null);
    try {
      const ng = nghiengDu.map(([goc, a]) => ({ goc, diem: a.diem, ti_le: Number(a.tiLe!.toFixed(4)) }));
      const r = await postJson<KqDo>("/api/nhan-tuong/do-mat", { diem, ti_le: Number(tiLe.toFixed(4)), dong_y: true, ...(ng.length ? { nghieng: ng } : {}) });
      setKq(r);
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "do_mat", so_goi_y: r.goi_y.length, so_diem: Object.keys(diem).length, so_anh_nghieng: nghiengDu.length });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đo được lúc này."); } finally { setTinh(false); }
  };

  const xongQuet = (k: KetQuaQuet) => {
    setQuet(false);
    if (k.thang) chonAnh(k.thang);
    setNghiengQuet({ ...(k.trai ? { nghieng_trai: k.trai } : {}), ...(k.phai ? { nghieng_phai: k.phai } : {}) });
  };
  const coNghiengQuet = Boolean(nghiengQuet.nghieng_trai || nghiengQuet.nghieng_phai);

  if (!dsDiem.length) return null;
  return (
    <div className="space-y-4" data-testid="do-mat">
      {quet && <QuetBaGoc onXong={xongQuet} onDong={dongQuet} />}
      {!url ? (
        <div className="space-y-3">
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/50 bg-bg/40 p-5 text-center text-sm text-fg-muted hover:border-gold hover:text-fg">
            <ImagePlus className="size-7 text-gold" aria-hidden />
            <span className="font-medium text-fg">Chọn hoặc chụp một ảnh chính diện</span>
            <span className="max-w-sm text-xs">Nhìn thẳng, đủ sáng, mặt tự nhiên (không cười), tóc không che trán. Máy bạn tự tìm điểm mốc — ảnh chỉ hiện trên máy, không tải lên.</span>
            <input type="file" accept="image/*" capture="user" className="sr-only" data-testid="do-input" aria-label="Chọn ảnh chân dung (chỉ hiện trên máy)"
              onChange={(e) => { chonAnh(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={moQuet} data-testid="quet-mo"><ScanFace aria-hidden /> Quét 3 góc như Face ID</Button>
            <span className="text-xs text-fg-faint">Máy tự chụp khi bạn nhìn thẳng, rồi quay từ từ sang trái, sang phải.</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div>
            {/* Điện thoại: thẻ hướng dẫn bên cạnh rơi xuống dưới ảnh → dòng này luôn nằm ngay trên chỗ chạm. */}
            <p className="mb-2 rounded-lg border border-gold/40 bg-gold/[0.06] px-3 py-2 text-sm lg:hidden" data-testid="do-dang-cham-dt" aria-hidden>
              {tim === "dang" ? <span className="text-fg-muted">Máy bạn đang tự tìm điểm mốc…</span>
                : thongTin
                ? <><span className="text-xs text-fg-faint">Điểm {dsDiem.indexOf(thongTin) + 1}/{dsDiem.length}: </span><b className="text-fg">{thongTin.ten}</b><span className="block text-xs text-fg-muted">{thongTin.mo}</span></>
                : <span className="text-jade">{tim === "xong" ? "Máy đã đặt sẵn các chấm — kéo chấm nào lệch." : "Đã chấm đủ điểm — kéo chấm nếu cần chỉnh."}</span>}
            </p>
            <div ref={khung} className={cn("relative mx-auto w-full max-w-xl select-none touch-none", phongTo && "overflow-hidden rounded-xl border border-line", dang ? "cursor-crosshair" : "")}
              style={phongTo ? { aspectRatio: `${vung.w * tiLe!} / ${vung.h}` } : undefined}
              onPointerDown={xuong} onPointerMove={di} onPointerUp={len} onPointerCancel={len} data-testid="do-khung" tabIndex={0} onKeyDown={nhich}
              aria-label="Ảnh của bạn — chạm để đặt điểm đang chọn, kéo chấm để chỉnh, mũi tên để nhích">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng */}
              <img ref={anhRef} src={url} alt="Ảnh bạn chọn (chỉ hiện trên máy)" draggable={false} className={cn("block", phongTo ? "absolute" : "w-full rounded-xl border border-line")}
                style={phongTo ? { maxWidth: "none", width: `${100 / vung.w}%`, left: `${(-vung.x / vung.w) * 100}%`, top: `${(-vung.y / vung.h) * 100}%` } : undefined}
                onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight) { setTiLe(i.naturalWidth / i.naturalHeight); void tuTim(i, false); } }} />
              {tim === "dang" && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-bg/40" data-testid="do-dang-tim">
                  <span className="inline-flex items-center gap-2 rounded-full bg-bg/90 px-3 py-1.5 text-sm text-fg shadow"><Loader2 className="size-4 animate-spin text-gold" aria-hidden /> Đang tìm điểm mốc trên máy bạn…</span>
                </div>
              )}
              {dsDiem.map((p, i) => { const k = diem[p.ma] && raKhung(diem[p.ma]!); return k && k.x >= 0 && k.x <= 1 && k.y >= 0 && k.y <= 1 && (
                <span key={p.ma} aria-hidden className={cn("pointer-events-none absolute grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[1.5px] text-[8px] font-semibold",
                  p.ma === dang ? "border-gold bg-gold text-bg" : canXem.includes(p.ma) ? "border-dashed border-gold bg-bg/80 text-gold" : "border-jade bg-bg/70 text-jade")}
                  style={{ left: `${k.x * 100}%`, top: `${k.y * 100}%` }}>{i + 1}</span>
              ); })}
            </div>
            {tim === "xong" && (
              <p className="mt-2 rounded-lg border border-jade/40 bg-jade/[0.06] px-3 py-2 text-xs leading-relaxed text-fg-muted" data-testid="do-tu-tim-xong" aria-live="polite">
                <ScanFace className="mr-1 inline size-3.5 text-jade" aria-hidden />
                Máy bạn đã tự đặt {Object.keys(diem).length} điểm (ảnh không gửi đi đâu). Xem lại từng chấm, kéo chấm nào lệch.
                {canXem.includes("chan_toc") && <> <b className="text-gold">Chân tóc (điểm 1, viền nét đứt)</b> được dò theo màu tóc — kiểm kỹ, nhất là khi tóc mái hoặc hói.</>}
                {" "}Tai không bắt buộc: bấm “Đỉnh tai” trong danh sách để chấm thêm.
              </p>
            )}
            {tim && tim !== "dang" && tim !== "xong" && <p className="mt-2 text-xs text-gold" data-testid="do-tu-tim-loi" aria-live="polite">{LOI_TIM[tim]}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Button size="sm" variant="ghost" onClick={() => { if (anhRef.current) void tuTim(anhRef.current, true); }} disabled={tim === "dang" || !tiLe} data-testid="do-tu-tim"><ScanFace aria-hidden /> Tự tìm lại</Button>
              {vungPhong && <Button size="sm" variant="ghost" onClick={() => setPhong((v) => !v)} data-testid="do-phong">{phong ? "Xem cả ảnh" : "Phóng vào mặt"}</Button>}
              <Button size="sm" variant="ghost" onClick={boLuot} disabled={!daDat.size}><Undo2 aria-hidden /> Bỏ điểm vừa chấm</Button>
              <Button size="sm" variant="ghost" onClick={() => { luotTim.current++; setDiem({}); setDang(dsDiem[0]?.ma ?? null); setKq(null); setTim(null); setCanXem([]); setVungPhong(null); }} disabled={!daDat.size}><RotateCcw aria-hidden /> Chấm tay từ đầu</Button>
              <Button size="sm" variant="ghost" onClick={moQuet} data-testid="quet-lai"><ScanFace aria-hidden /> Quét lại 3 góc</Button>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-1 text-fg-muted hover:text-fg">
                <ImagePlus className="size-3.5" aria-hidden /> Đổi ảnh
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { chonAnh(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              <button type="button" aria-label="Bỏ ảnh" className="ml-auto inline-flex items-center gap-1 text-fg-faint hover:text-fg"
                onClick={() => { luotTim.current++; if (url) URL.revokeObjectURL(url); setUrl(null); setDiem({}); setKq(null); setTim(null); setCanXem([]); setVungPhong(null); }}><X className="size-3.5" aria-hidden /> Bỏ ảnh</button>
            </div>
          </div>
          <aside className="space-y-3">
            <div className="rounded-xl border border-gold/40 bg-gold/[0.06] p-3" data-testid="do-dang-cham" aria-live="polite">
              {thongTin ? (
                <>
                  <p className="text-xs text-fg-faint">Điểm {dsDiem.indexOf(thongTin) + 1}/{dsDiem.length} · {nhom[thongTin.nhom] ?? ""}{thongTin.bat_buoc || (nhom[thongTin.nhom] ?? "").includes("không bắt buộc") ? "" : " · không bắt buộc"}</p>
                  <p className="mt-0.5 font-medium text-fg">{thongTin.ten}</p>
                  <p className="mt-1 text-xs leading-snug text-fg-muted">{thongTin.mo}</p>
                </>
              ) : <p className="text-sm text-jade"><Check className="mr-1 inline size-4" aria-hidden />Đã chấm đủ điểm.</p>}
              <div className="mx-auto mt-2 w-32"><HinhMau dang={dang} da={daDat} /></div>
            </div>
            <ol className="grid max-h-48 grid-cols-2 gap-1 overflow-auto text-[11px] lg:max-h-none lg:grid-cols-1" aria-label="Các điểm cần chấm">
              {dsDiem.map((p, i) => (
                <li key={p.ma}>
                  <button type="button" onClick={() => setDang(p.ma)} aria-current={p.ma === dang ? "step" : undefined}
                    className={cn("flex w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left", p.ma === dang ? "bg-gold/15 text-fg" : "text-fg-muted hover:bg-surface/60")}>
                    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border text-[9px]", diem[p.ma] ? "border-jade text-jade" : "border-line")}>{diem[p.ma] ? "✓" : i + 1}</span>
                    <span className="truncate">{p.ten}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}

      {url && dsNghieng.length > 0 && (
        <details key={coNghiengQuet ? "quet" : "tay"} open={coNghiengQuet || undefined} className="rounded-2xl border border-line/70 bg-bg/40 p-4" data-testid="do-nghieng">
          <summary className="cursor-pointer text-sm font-medium text-fg">Thêm ảnh nghiêng (không bắt buộc) — đo thêm trán, gốc mũi, sống mũi, cằm, tai</summary>
          <p className="mt-2 text-xs leading-relaxed text-fg-muted">Ảnh thẳng không thấy độ nổi của mặt. Một ảnh chụp ngang mặt (quay hẳn 90°) cho hệ thống đo thêm trán gồ hay phẳng, gốc mũi cao hay thấp, sống mũi gồ / thấp, cằm lẹm, vị trí tai. {coNghiengQuet && <b className="text-fg">Ảnh nghiêng vừa quét đã nạp sẵn bên dưới. </b>}Ảnh nghiêng cần bạn tự chấm 9 điểm trên đường viền (máy chỉ tự tìm được ở ảnh chính diện). Một bên là đủ; có cả hai bên thì hai ảnh phải cùng kết quả mới gợi ý. Ảnh cũng chỉ hiện trên máy bạn.</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <ChamNghieng goc="nghieng_trai" ten="Ảnh nghiêng trái" ds={dsNghieng} onDoi={(a) => doiNghieng("nghieng_trai", a)} anhBanDau={nghiengQuet.nghieng_trai} />
            <ChamNghieng goc="nghieng_phai" ten="Ảnh nghiêng phải" ds={dsNghieng} onDoi={(a) => doiNghieng("nghieng_phai", a)} anhBanDau={nghiengQuet.nghieng_phai} />
          </div>
        </details>
      )}

      <div className="rounded-2xl border border-line/70 bg-bg/70 p-4" data-testid="do-thoa-thuan">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg"><ShieldCheck className="size-4 text-gold" aria-hidden /> Thoả thuận đo gương mặt (ảnh không rời máy)</p>
        <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
          Ảnh <b className="text-fg">không rời máy bạn</b>. Điểm mốc do máy bạn tự tìm ngay trong trình duyệt hoặc do bạn chấm. Chỉ toạ độ các điểm đó (ảnh chính diện, và ảnh nghiêng nếu bạn thêm) cùng tỉ lệ khung ảnh được gửi tới máy chủ tính toán của Hiểu Bản Thân <b className="text-fg">một lượt</b> để đo tỉ lệ theo sách tướng; không lưu, không chuyển cho bên thứ ba, không dùng để nhận ra bạn. Ảnh phải là của chính bạn, bạn đủ 18 tuổi.
          Rút thoả thuận ở đây hoặc ở <Link href="/tai-khoan#du-lieu-cua-toi" className="text-gold underline underline-offset-2">Dữ liệu của tôi</Link> · <Link href="/chinh-sach-rieng-tu#anh-mat" className="text-gold underline underline-offset-2">Chính sách riêng tư</Link>.
        </p>
        {dongY ? (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted" data-testid="do-da-dong-y">
            <Check className="size-3.5 text-jade" aria-hidden /> Đã đồng ý ngày {ngayDongYAnhMat(dongY)} (bản {DONG_Y_DO_MAT.phienBan}).
            <button type="button" className="underline underline-offset-2 hover:text-fg" onClick={() => { DONG_Y_DO_MAT.thuHoi(); setTick(false); }}>Rút thoả thuận</button>
          </p>
        ) : (
          <label className="mt-2 flex items-start gap-2 text-sm text-fg">
            <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={tick} onChange={(e) => setTick(e.target.checked)} data-testid="do-dong-y" />
            <span>Tôi đồng ý gửi toạ độ các điểm mốc trên ảnh của chính tôi để đo.</span>
          </label>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={doNgay} disabled={!sanSang} data-testid="do-tinh"><Ruler aria-hidden /> {tinh ? "Đang đo…" : "Đo và gợi ý"}</Button>
          {url && !du && <span className="text-xs text-fg-faint">Còn {batBuoc.filter((m) => !diem[m]).length} điểm bắt buộc.</span>}
          {nghiengDu.length > 0 && <span className="text-xs text-jade" data-testid="do-kem-nghieng">Kèm {nghiengDu.length} ảnh nghiêng.</span>}
          {nghiengThieu > 0 && <span className="text-xs text-fg-faint">Ảnh nghiêng chưa chấm đủ sẽ không được tính.</span>}
        </div>
        {loi && <p className="mt-2 text-sm text-cinnabar" data-testid="do-loi">{loi}</p>}
      </div>

      {kq && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-line/70 bg-surface/40 p-4 text-sm" data-testid="do-so-do">
            <p className="font-medium text-fg">Số đo của bạn</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-fg-muted sm:grid-cols-3">
              {kq.so_do.tam_dinh && <div><dt className="inline">Ba đình: </dt><dd className="inline text-fg">{kq.so_do.tam_dinh.thuong}% · {kq.so_do.tam_dinh.trung}% · {kq.so_do.tam_dinh.ha}%</dd></div>}
              <div><dt className="inline">Cao / ngang gò má: </dt><dd className="inline text-fg">{so(kq.so_do.cao_rong)}</dd></div>
              <div><dt className="inline">Trán / gò má: </dt><dd className="inline text-fg">{so(kq.so_do.tran_ma)}</dd></div>
              <div><dt className="inline">Hàm / gò má: </dt><dd className="inline text-fg">{so(kq.so_do.ham_ma)}</dd></div>
              <div><dt className="inline">Mắt / ngang mặt: </dt><dd className="inline text-fg">{so(kq.so_do.mat_mat)}</dd></div>
              <div><dt className="inline">Ấn Đường / khoé mắt: </dt><dd className="inline text-fg">{so(kq.so_do.may_khoe)}</dd></div>
            </dl>
            {kq.canh_bao.map((c, i) => <p key={i} className="mt-2 text-xs text-gold">{c}</p>)}
            <p className="mt-2 text-xs text-fg-faint">Sắc da, nếp nhăn, độ dày thịt, ánh mắt, giọng nói ảnh không đo được — bạn trả lời ở phần Khảo sát.</p>
          </div>
          <DanhSachGoiY key={JSON.stringify(kq.goi_y)} ks={ks} goiY={kq.goi_y} daTraLoi={daTraLoi} onGoiY={onGoiY} onXem={onXem} dangXem={dangXem} nguon="do"
            chuRong="Các tỉ lệ của bạn nằm trong khoảng cân đối nên hệ thống không gợi ý nét nào nổi bật — trả lời Khảo sát để có bài đọc." />
        </div>
      )}
    </div>
  );
}
