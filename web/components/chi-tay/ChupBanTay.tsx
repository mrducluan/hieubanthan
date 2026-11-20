"use client";
// CT-2 — "Chụp lòng bàn tay" ở ĐẦU trang Xem chỉ tay. Người dùng chụp / tải ảnh lòng bàn tay của CHÍNH MÌNH; ảnh chỉ hiện bằng
// `blob:` trên máy (giải mã lại qua canvas — xoay đúng chiều, bỏ EXIF), KHÔNG tải lên. Bộ tìm điểm mốc bàn tay chạy trong trình
// duyệt (lib/ban-tay-tu-dong) → 21 toạ độ 0..1 + tỉ lệ khung → `/api/chi-tay/do-tay` (sau thoả thuận ct1) → engine đo tỉ lệ
// bàn tay / ngón, trả nhãn, câu sách theo số đo và TOẠ ĐỘ chín cung trên ảnh của người dùng. Web chỉ vẽ: ảnh + khung xương 21
// điểm (mờ) + vòng cung theo `cung[].vt`; chạm một cung → thẻ nghĩa + lựa chọn tự quan sát (lưu MÃ trên máy, lib/chi-tay-chon)
// → khối "Xem sách xưa nói gì" phía dưới gửi kèm. Không lưu ảnh, không lưu toạ độ. Thiếu mô hình / không thấy tay → chỉ lối tự
// soi theo đồ hình sách + thư viện vân (như trước CT-2).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Hand, ImagePlus, Loader2, RotateCcw, ShieldCheck, Sun, X } from "lucide-react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { urlAnhSach } from "@/lib/anh-tren-may";
import { DONG_Y_CHI_TAY, ngayDongYAnhMat } from "@/lib/dong-y-anh-mat";
import type { DiemTay, KetQuaTimTay } from "@/lib/ban-tay-tu-dong";
import { datCung, datTay, useChonChiTay, type Tay } from "@/lib/chi-tay-chon";
import { usePhaiChiTay } from "@/lib/chi-tay-phai";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";
import { TheDangBanTayFuzzy, type FuzzyTayBridge } from "@/components/nhan-tuong/TheFuzzyTuong";

interface LuaChonCung { ma: string; ten: string }
export interface CungTay { ma: string; han: string; ten: string; ten_ngan?: string; vt: [number, number]; y: string; lua_chon: LuaChonCung[] }
interface NhanDo { ma: string; ten: string; y?: string; vua?: boolean }
interface SachGhiDo { ma: string; han?: string; nhom?: string; loi: string; viec?: string }
/** TK-2 — câu sách phái Tây theo số đo (Benham / Cheiro): lời Việt + nguyên văn tiếng Anh gập. */
interface MucTay { ma: string; ten: string; loi: string; viec?: string; trich?: string; nguon_hien_thi?: string; nhom?: string }
export interface KqDoTay {
  hop_le: boolean; loi: string | null; loi_nhac?: string | null; loi_chu?: string; phai?: "tay";
  nhan?: NhanDo[]; sach_ghi?: SachGhiDo[]; cung?: CungTay[]; bo_nhom_c?: number; cau_ket?: string;
  muc?: MucTay[]; to_hop?: { ma: string; ten: string } | null; goi_y_dang?: string[];
  fuzzy_bridge?: FuzzyTayBridge | null;
}
/** Tên dáng tay phái Tây (mã engine `dang_tay`) — chỉ để ghi lời gợi ý "tự xem dáng nào". */
const TEN_DANG: Record<string, string> = { vuong: "Tay vuông", be: "Tay bè", triet: "Tay nhiều khớp", thon: "Tay thon dài" };

/** Cặp điểm nối thành khung xương bàn tay (thứ tự 21 điểm MediaPipe Hand) — chỉ để vẽ. */
const NOI: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];

const LOI_TIM: Record<string, string> = {
  khong_thay: "Máy chưa thấy rõ bàn tay trong ảnh. Chụp lại: xoè tay, lòng bàn tay hướng vào máy, đủ sáng, nền trơn.",
  nhieu_tay: "Ảnh có hơn một bàn tay. Chụp lại chỉ một tay bạn muốn xem.",
  ngoai_khung: "Bàn tay chưa nằm trọn trong ảnh. Lùi máy ra một chút để thấy cả đầu các ngón và cổ tay.",
  loi: "Máy này chưa chạy được bộ tự tìm điểm mốc bàn tay (trình duyệt cũ hoặc thiếu bộ nhớ).",
};
/** Lời dự phòng khi engine chỉ trả mã lỗi ảnh (hợp đồng: `loi` là mã kèm lời tiếng Việt). */
const LOI_ANH: Record<string, string> = {
  khong_du_diem: "Chưa đủ điểm mốc để đo. Chụp lại cho thấy cả năm ngón và cổ tay.",
  mu_ban_tay: "Ảnh có vẻ là mu bàn tay. Lật tay lại cho lòng bàn tay hướng vào máy rồi chụp lại.",
  tay_nam: "Các ngón đang khép hoặc nắm lại. Xoè rộng các ngón rồi chụp lại.",
  nghieng_qua: "Bàn tay nghiêng quá. Giữ lòng bàn tay song song với máy rồi chụp lại.",
};
const loiAnh = (k: KqDoTay) => k.loi_nhac || k.loi_chu || (k.loi && LOI_ANH[k.loi]) || k.loi || LOI_ANH.khong_du_diem!;
/** Tên ngắn để ghi dưới vòng cung: phần trong ngoặc của tên engine ("Gò dưới ngón giữa (cung Ly)" → "cung Ly"). */
const tenNgan = (c: CungTay) => c.ten_ngan ?? /\(([^)]+)\)\s*$/.exec(c.ten)?.[1] ?? c.ten;

/** Móc kiểm thử e2e: thay bộ tìm điểm mốc (cần camera thật / WebAssembly) bằng 21 điểm dựng sẵn. Chỉ có ở bản dev và bản build
 *  chạy e2e (`NEXT_PUBLIC_E2E=1`); bản production thật biên dịch thành hằng `false` nên đoạn này bị bỏ. */
const CHO_MOC_THU = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_E2E === "1";
function mocThu(tyLe: number): KetQuaTimTay | null {
  if (!CHO_MOC_THU || typeof window === "undefined") return null;
  const h = (window as unknown as { __ctTest?: { diem?: DiemTay[]; ty_le?: number; trang_thai?: string } }).__ctTest;
  if (!h) return null;
  if (h.diem?.length === 21) return { trang_thai: "xong", diem: h.diem, ty_le: h.ty_le ?? tyLe, tay_mp: "Right" };
  return { trang_thai: (["khong_thay", "nhieu_tay", "ngoai_khung", "loi"] as const).find((t) => t === h.trang_thai) ?? "loi" };
}

function HuongDan() {
  return (
    <div className="rounded-2xl border border-line/70 bg-bg/50 p-4" data-testid="ct-huong-dan">
      <p className="text-sm font-semibold text-fg">Chụp thế nào cho máy đo được?</p>
      <div className="mt-3 flex items-start gap-4">
        <svg viewBox="0 0 120 140" className="w-24 shrink-0" role="img" aria-label="Hình minh hoạ: bàn tay xoè, lòng bàn tay hướng vào máy, cổ tay nằm trong khung">
          <rect x="6" y="4" width="108" height="132" rx="12" className="fill-none stroke-gold/50" strokeWidth="1.5" strokeDasharray="5 4" />
          <g className="fill-surface stroke-gold" strokeWidth="1.6">
            <rect x="20" y="62" width="11" height="34" rx="5.5" transform="rotate(-40 31 92)" />
            <rect x="35" y="22" width="11" height="44" rx="5.5" transform="rotate(-12 41 66)" />
            <rect x="49" y="13" width="11" height="52" rx="5.5" />
            <rect x="63" y="20" width="11" height="46" rx="5.5" transform="rotate(10 68 66)" />
            <rect x="75" y="34" width="10" height="36" rx="5" transform="rotate(24 80 70)" />
            <rect x="34" y="58" width="52" height="56" rx="16" />
            <rect x="44" y="108" width="32" height="26" rx="4" />
          </g>
          <path d="M44 92 Q58 84 74 90 M46 80 Q60 74 78 78" className="fill-none stroke-gold/60" strokeWidth="1.2" />
          <circle cx="104" cy="16" r="6" className="fill-gold/70" />
        </svg>
        <ul className="space-y-1.5 text-xs leading-snug text-fg-muted">
          <li className="flex gap-1.5"><Hand className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />Xoè tay, các ngón tách nhau.</li>
          <li className="flex gap-1.5"><Check className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />Lòng bàn tay hướng thẳng vào máy.</li>
          <li className="flex gap-1.5"><Sun className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />Đủ sáng, nền trơn, không loá đèn.</li>
          <li className="flex gap-1.5"><Camera className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />Cả năm đầu ngón và cổ tay nằm trong khung.</li>
        </ul>
      </div>
    </div>
  );
}

export function ChupBanTay() {
  const hs = useHoSo();
  const chon = useChonChiTay();
  const tay: Tay = chon.tay ?? (hs?.gioi_tinh === "nu" ? "phai" : "trai");
  const phai = usePhaiChiTay();
  const daDo = useRef<{ diem: DiemTay[]; tl: number } | null>(null);
  const dongY = DONG_Y_CHI_TAY.use();
  const [tick, setTick] = useState(false);
  const duocChon = Boolean(dongY || tick);
  const [url, setUrl] = useState<string | null>(null);
  const [tyLe, setTyLe] = useState<number | null>(null);
  const [diem, setDiem] = useState<DiemTay[] | null>(null);
  const [tim, setTim] = useState<null | "dang" | Exclude<KetQuaTimTay["trang_thai"], "xong">>(null);
  const [kq, setKq] = useState<KqDoTay | null>(null);
  const [dangDo, setDangDo] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [mo, setMo] = useState<string | null>(null);
  const inChup = useRef<HTMLInputElement>(null);
  const inTai = useRef<HTMLInputElement>(null);
  const luot = useRef(0);
  const urlRef = useRef<string | null>(null);
  urlRef.current = url;
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const boAnh = useCallback(() => {
    luot.current++;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    daDo.current = null;
    setUrl(null); setTyLe(null); setDiem(null); setTim(null); setKq(null); setLoi(null); setMo(null);
  }, []);

  const chonAnh = async (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/") || !duocChon) return;
    if (!DONG_Y_CHI_TAY.da()) DONG_Y_CHI_TAY.ghi();
    const u = await urlAnhSach(f);
    if (!u) { setLoi("Không mở được ảnh này. Thử ảnh khác (JPG, PNG, HEIC đã đổi sang JPG)."); return; }
    boAnh();
    urlRef.current = u;
    setUrl(u);
    ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay", tay });
  };

  const doTay = async (ds: DiemTay[], tl: number, l: number) => {
    setDangDo(true); setLoi(null);
    try {
      const r = await fetch("/api/chi-tay/do-tay", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ dong_y: true, ...(phai === "tay" ? { phai } : {}), tay, ty_le: Number(tl.toFixed(4)), diem: ds, ...(hs ? { ngay_sinh: ngaySinhIso(hs) } : {}) }),
      });
      const d = (await r.json().catch(() => ({}))) as KqDoTay & { error?: string };
      if (l !== luot.current) return;
      if (!r.ok) throw new Error(d.error ?? "Máy chủ đang bận, bạn thử lại sau ít phút.");
      setKq(d);
      if (d.hop_le) ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay_xong", tay, phai, so_cung: d.cung?.length ?? 0, so_nhan: d.nhan?.length ?? 0, so_sach: d.sach_ghi?.length ?? 0 });
      else ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay_loi", ket_qua: d.loi ?? "khong_hop_le" });
    } catch (e) {
      if (l !== luot.current) return;
      setLoi(e instanceof Error ? e.message : "Máy chủ đang bận, bạn thử lại sau ít phút.");
      ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay_loi", ket_qua: "may_chu" });
    } finally { if (l === luot.current) setDangDo(false); }
  };

  const timTay = async (img: HTMLImageElement) => {
    const l = ++luot.current;
    const tl = img.naturalWidth / img.naturalHeight;
    setTyLe(tl); setTim("dang"); setDiem(null); setKq(null);
    let r = mocThu(tl);
    if (!r) {
      try { const { timBanTay } = await import("@/lib/ban-tay-tu-dong"); r = await timBanTay(img); }
      catch { r = { trang_thai: "loi" }; }
    }
    if (l !== luot.current) return;
    if (r.trang_thai !== "xong") {
      setTim(r.trang_thai);
      ghi("chart_interacted", { mo_dun: "chitay", kind: "chup_tay_loi", ket_qua: r.trang_thai });
      return;
    }
    setTim(null); setDiem(r.diem);
    daDo.current = { diem: r.diem, tl: r.ty_le };
    if (!DONG_Y_CHI_TAY.da()) return;           // đã rút thoả thuận trong lúc chờ → không gửi
    await doTay(r.diem, r.ty_le, l);
  };

  // TK-2: đổi phái khi đã có điểm mốc → đo lại theo phái mới (cùng 21 toạ độ, không tìm lại trên ảnh).
  const phaiTruoc = useRef(phai);
  useEffect(() => {
    if (phaiTruoc.current === phai) return;
    phaiTruoc.current = phai;
    setMo(null);
    const d = daDo.current;
    if (!d || !DONG_Y_CHI_TAY.da()) { setKq(null); return; }
    void doTay(d.diem, d.tl, ++luot.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi phái đổi
  }, [phai]);

  // Điện thoại: thẻ cung nằm dưới ảnh → chạm vòng cung thì đưa thẻ vào tầm nhìn.
  const theRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mo || !theRef.current || window.matchMedia?.("(min-width: 1024px)").matches) return;
    const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    theRef.current.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "nearest" });
  }, [mo]);

  const rutDongY = () => { DONG_Y_CHI_TAY.thuHoi(); setTick(false); boAnh(); };
  const cung = useMemo(() => (kq?.hop_le ? kq.cung ?? [] : []), [kq]);
  const dang = cung.find((c) => c.ma === mo) ?? null;
  const soDaChon = cung.filter((c) => chon.cung[c.ma]).length;
  const chonLuaChon = (c: CungTay, lc: string | null) => {
    datCung(c.ma, lc);
    if (lc) ghi("chart_interacted", { mo_dun: "chitay", kind: "cung_tay", cung: c.ma, lua_chon: lc });
  };

  const nutAnh = (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => inChup.current?.click()} disabled={!duocChon} data-testid="ct-chup"><Camera aria-hidden /> Chụp ảnh</Button>
      <Button variant="outline" onClick={() => inTai.current?.click()} disabled={!duocChon} data-testid="ct-tai"><ImagePlus aria-hidden /> Tải ảnh</Button>
    </div>
  );

  return (
    <section aria-labelledby="chup-tay" data-testid="chup-ban-tay"
      className="relative mb-12 overflow-hidden rounded-3xl border border-gold/45 bg-gradient-to-br from-gold/[0.09] via-surface/70 to-bg/40 p-4 sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <input ref={inChup} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden data-testid="ct-input-chup"
        onChange={(e) => { void chonAnh(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={inTai} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden data-testid="ct-input-tai"
        onChange={(e) => { void chonAnh(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="relative">
        <p className="eyebrow text-gold">Từ ảnh tay của bạn · ảnh không rời máy</p>
        <h2 id="chup-tay" className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">Chụp lòng bàn tay — <span className="text-gradient-gold">tám cung hiện trên tay bạn</span></h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted sm:text-base">
          Máy bạn tự tìm 21 điểm mốc (cổ tay, các khớp ngón) ngay trong trình duyệt. Hệ thống đo độ dài ngón so với lòng bàn tay,
          đặt tám cung và Minh Đường lên đúng ảnh của bạn. Bạn chạm từng cung, tự nhìn gò đầy hay trũng, rồi xem sách xưa nói gì.
        </p>

        {/* Chọn tay */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Xem tay nào">
            {(["trai", "phai"] as const).map((t) => (
              <button key={t} type="button" onClick={() => datTay(t)} aria-pressed={tay === t} data-testid={`ct-tay-${t}`}
                className={cn("min-h-[44px] rounded-full border px-4 text-sm", tay === t ? "border-gold/70 bg-gold/15 text-fg" : "border-line text-fg-muted hover:border-gold/50")}>
                {t === "trai" ? "Tay trái" : "Tay phải"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-fg-faint">Sách xưa thường xem nam tay trái, nữ tay phải — bạn chọn.</p>
        </div>

        {!url ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="space-y-4">
              <div className="rounded-2xl border border-line/70 bg-bg/70 p-4" data-testid="ct-thoa-thuan">
                <p className="flex items-center gap-2 text-sm font-semibold text-fg"><ShieldCheck className="size-4 text-gold" aria-hidden /> Thoả thuận đo bàn tay trên ảnh</p>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
                  Ảnh chỉ xử lý trên máy bạn; chỉ 21 toạ độ điểm mốc (và tỉ lệ khung ảnh) được gửi lên để đo, không lưu, không dùng để
                  nhận ra bạn. Rút thoả thuận ở đây hoặc ở <Link href="/tai-khoan#du-lieu-cua-toi" className="text-gold underline underline-offset-2">Dữ liệu của tôi</Link> ·{" "}
                  <Link href="/chinh-sach-rieng-tu#anh-mat" className="text-gold underline underline-offset-2">Chính sách riêng tư</Link>.
                </p>
                {dongY ? (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted" data-testid="ct-da-dong-y">
                    <Check className="size-3.5 text-jade" aria-hidden /> Đã đồng ý ngày {ngayDongYAnhMat(dongY)} (bản {DONG_Y_CHI_TAY.phienBan}).
                    <button type="button" className="min-h-[40px] underline underline-offset-2 hover:text-fg" onClick={rutDongY} data-testid="ct-rut">Rút thoả thuận</button>
                  </p>
                ) : (
                  <label className="mt-2 flex min-h-[40px] cursor-pointer items-start gap-2 text-sm text-fg">
                    <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[rgb(var(--gold))]" checked={tick} onChange={(e) => setTick(e.target.checked)} data-testid="ct-dong-y" />
                    <span>Tôi đồng ý: ảnh chỉ xử lý trên máy tôi; chỉ 21 toạ độ điểm mốc bàn tay được gửi lên để đo, không lưu.</span>
                  </label>
                )}
              </div>
              {nutAnh}
              {!duocChon && <p className="text-xs text-fg-faint">Tích ô đồng ý ở trên để chụp hoặc tải ảnh.</p>}
              {loi && <p className="text-sm text-amber-500" role="alert">{loi}</p>}
            </div>
            <HuongDan />
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="min-w-0">
              <div className="relative mx-auto w-full max-w-sm sm:max-w-md" data-testid="ct-khung">
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng */}
                <img src={url} alt="Ảnh bàn tay bạn chọn (chỉ hiện trên máy)" draggable={false}
                  className="block h-auto w-full select-none rounded-xl border border-line"
                  onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight) void timTay(i); }} />
                {diem && tyLe && (
                  <svg viewBox={`0 0 ${tyLe * 100} 100`} className="pointer-events-none absolute inset-0 size-full" aria-hidden data-testid="ct-xuong">
                    {NOI.map(([a, b]) => (
                      <line key={`${a}-${b}`} x1={diem[a]![0] * tyLe * 100} y1={diem[a]![1] * 100} x2={diem[b]![0] * tyLe * 100} y2={diem[b]![1] * 100}
                        stroke="white" strokeOpacity={0.45} strokeWidth={0.45} strokeLinecap="round" />
                    ))}
                    {diem.map(([x, y], i) => <circle key={i} cx={x * tyLe * 100} cy={y * 100} r={0.7} fill="white" fillOpacity={0.6} />)}
                  </svg>
                )}
                {cung.map((c) => {
                  const da = Boolean(chon.cung[c.ma]);
                  return (
                    <button key={c.ma} type="button" data-testid="ct-cung" data-ma={c.ma} aria-pressed={mo === c.ma}
                      aria-label={`${c.ten}${da ? " — đã chọn" : ""}`} onClick={() => setMo(mo === c.ma ? null : c.ma)}
                      style={{ left: `${c.vt[0] * 100}%`, top: `${c.vt[1] * 100}%` }}
                      className="group absolute flex size-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                      <span className={cn("grid size-9 place-items-center rounded-full border-2 font-serif text-base leading-none shadow transition-transform motion-reduce:transition-none",
                        mo === c.ma ? "scale-110 border-gold bg-gold text-bg" : da ? "border-jade bg-bg/80 text-jade" : "border-gold/90 bg-bg/70 text-fg group-hover:scale-105")}
                        lang="zh-Hant">{c.han}</span>
                      <span className="pointer-events-none absolute top-full mt-0.5 hidden whitespace-nowrap rounded bg-bg/85 px-1.5 text-[0.68rem] leading-tight text-fg sm:block">{tenNgan(c)}</span>
                    </button>
                  );
                })}
                {(tim === "dang" || dangDo) && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-bg/40" data-testid="ct-dang-tim">
                    <span className="inline-flex items-center gap-2 rounded-full bg-bg/90 px-3 py-1.5 text-sm text-fg shadow">
                      <Loader2 className="size-4 animate-spin text-gold motion-reduce:animate-none" aria-hidden />
                      {tim === "dang" ? "Đang tìm điểm mốc trên máy bạn…" : "Đang đo…"}
                    </span>
                  </div>
                )}
              </div>

              {cung.length > 0 && (
                <ul className="mx-auto mt-3 flex max-w-md flex-wrap justify-center gap-1.5" aria-label="Các cung trên ảnh">
                  {cung.map((c) => (
                    <li key={c.ma}>
                      <button type="button" onClick={() => setMo(c.ma)} aria-pressed={mo === c.ma} data-testid="ct-cung-chip" data-ma={c.ma}
                        className={cn("inline-flex min-h-[40px] items-center gap-1 rounded-full border px-3 text-xs",
                          mo === c.ma ? "border-gold/70 bg-gold/15 text-fg" : chon.cung[c.ma] ? "border-jade/60 text-jade" : "border-line text-fg-muted")}>
                        <span lang="zh-Hant" className="font-serif text-sm">{c.han}</span> {tenNgan(c)}
                        {chon.cung[c.ma] && <Check className="size-3.5" aria-hidden />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {(tim && tim !== "dang") || (kq && !kq.hop_le) || loi ? (
                <div className="mx-auto mt-3 max-w-md rounded-xl border border-gold/40 bg-gold/[0.06] p-3 text-sm" role="alert" data-testid="ct-loi">
                  <p>{tim && tim !== "dang" ? LOI_TIM[tim] : kq && !kq.hop_le ? loiAnh(kq) : loi}</p>
                  {(tim === "loi" || loi) && phai === "tay" && (
                    <p className="mt-1.5 text-xs text-fg-muted">
                      Bạn vẫn tự soi được: <a href="#tu-soi-tay" className="text-gold underline underline-offset-2">chọn dáng tay, gò và đường chỉ</a> ở phía dưới.
                    </p>
                  )}
                  {(tim === "loi" || loi) && phai !== "tay" && (
                    <p className="mt-1.5 text-xs text-fg-muted">
                      Bạn vẫn tự soi được: chạm <a href="#tam-cung" className="text-gold underline underline-offset-2">tám cung trên đồ hình sách</a>, rồi chọn{" "}
                      <a href="#tu-soi" className="text-gold underline underline-offset-2">hình vân giống tay mình</a> ở phía dưới.
                    </p>
                  )}
                  <Button size="sm" variant="outline" className="mt-2 min-h-[40px]" onClick={() => { boAnh(); inChup.current?.click(); }} data-testid="ct-chup-lai">
                    <RotateCcw aria-hidden /> Chụp lại
                  </Button>
                </div>
              ) : null}

              <div className="mx-auto mt-3 flex max-w-md flex-wrap items-center justify-center gap-2 text-xs">
                <Button size="sm" variant="ghost" className="min-h-[40px]" onClick={() => inChup.current?.click()}><Camera aria-hidden /> Chụp lại</Button>
                <Button size="sm" variant="ghost" className="min-h-[40px]" onClick={() => inTai.current?.click()}><ImagePlus aria-hidden /> Tải ảnh khác</Button>
                <Button size="sm" variant="ghost" className="min-h-[40px]" onClick={boAnh} data-testid="ct-bo-anh"><X aria-hidden /> Bỏ ảnh</Button>
              </div>
            </div>

            <aside className="space-y-3" aria-live="polite">
              {dang ? (
                <div ref={theRef} className="scroll-mb-24 rounded-2xl border border-gold/40 bg-gold/[0.05] p-4" data-testid="ct-the-cung">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-serif text-3xl text-fg" lang="zh-Hant">{dang.han}</p>
                    <button type="button" onClick={() => setMo(null)} className="min-h-[40px] px-2 text-xs text-fg-muted hover:text-fg">Đóng</button>
                  </div>
                  <p className="mt-1 font-medium text-fg">{dang.ten}</p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed">{dang.y}</p>
                  {dang.lua_chon.length > 0 && (
                    <>
                      <p className="mt-3 text-xs text-fg-faint">Nhìn vùng này trên ảnh (hoặc trên tay thật). Bạn thấy:</p>
                      <div className="mt-2 grid gap-1.5" role="group" aria-label={`Bạn thấy gì ở ${dang.ten}`}>
                        {dang.lua_chon.map((lc) => {
                          const co = chon.cung[dang.ma] === lc.ma;
                          return (
                            <button key={lc.ma} type="button" aria-pressed={co} data-testid="ct-lua-chon" data-ma={lc.ma}
                              onClick={() => chonLuaChon(dang, co ? null : lc.ma)}
                              className={cn("flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-left text-sm",
                                co ? "border-jade/70 bg-jade/10 text-fg" : "border-line text-fg-muted hover:border-gold/50")}>
                              <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", co ? "border-jade bg-jade text-bg" : "border-line")}>
                                {co && <Check className="size-3" aria-hidden />}
                              </span>
                              {lc.ten}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ) : cung.length > 0 ? (
                <div className="rounded-2xl border border-line/70 p-4 text-sm text-fg-muted">
                  Chạm vào một vòng cung trên ảnh (hoặc tên cung bên dưới ảnh) để đọc cung đó nói về gì và chọn điều bạn thấy trên tay mình.
                </div>
              ) : null}

              {kq?.hop_le && (kq.nhan?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-line/70 p-4" data-testid="ct-nhan">
                  <p className="text-sm font-semibold text-fg">Máy đo được trên ảnh</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {kq.nhan!.map((n) => (
                      <li key={n.ma} className={cn("flex gap-1.5", n.vua ? "text-fg-muted" : "text-fg")}>
                        <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", n.vua ? "bg-fg-faint" : "bg-gold")} />
                        <span>{n.ten}{n.y && <span className="block text-xs text-fg-muted">{n.y}</span>}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-fg-faint">Chỉ đo hình dáng (độ dài ngón, lòng bàn tay). Đường chỉ, độ dày gò, màu da: bạn tự nhìn.</p>
                </div>
              )}

              {kq?.hop_le && <TheDangBanTayFuzzy bridge={kq.fuzzy_bridge} />}

              {kq?.hop_le && (kq.sach_ghi?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-line/70 p-4" data-testid="ct-sach-ghi">
                  <p className="text-sm font-semibold text-fg">Sách xưa nói gì về dáng tay này</p>
                  <ul className="mt-2 space-y-3">
                    {kq.sach_ghi!.map((s) => (
                      <li key={s.ma} className="text-sm leading-relaxed">
                        <p>{s.loi}</p>
                        {s.viec && <p className="mt-1 text-xs text-fg-muted"><span className="text-fg">Việc nên làm:</span> {s.viec}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {kq?.hop_le && (kq.bo_nhom_c ?? 0) > 0 && (
                <p className="text-xs text-fg-muted">
                  {hs ? `${kq.bo_nhom_c} câu sách theo dáng tay này chỉ dành cho người từ 18 tuổi, nên không hiện ở đây.`
                    : `${kq.bo_nhom_c} câu sách theo dáng tay này chỉ hiện khi biết bạn đã đủ 18 tuổi — lưu hồ sơ (ngày sinh) để xem đủ.`}
                </p>
              )}
              {kq?.hop_le && kq.phai === "tay" && (kq.to_hop || (kq.goi_y_dang?.length ?? 0) > 0) && (
                <div className="rounded-2xl border border-line/70 p-4 text-sm" data-testid="ct-to-hop">
                  {kq.to_hop && <p className="font-semibold text-fg">{kq.to_hop.ten}</p>}
                  {(kq.goi_y_dang?.length ?? 0) > 0 && (
                    <p className="mt-1 text-fg-muted">
                      Dáng lòng bàn tay này gần với {kq.goi_y_dang!.map((g) => TEN_DANG[g] ?? g).join(" hoặc ")} trong sách Cheiro. Nhìn thêm
                      đầu ngón và khớp rồi <a href="#tu-soi-tay" className="text-gold underline underline-offset-2">tự chọn dáng tay ở dưới</a>.
                    </p>
                  )}
                </div>
              )}
              {kq?.hop_le && kq.phai === "tay" && (kq.muc?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-line/70 p-4" data-testid="ct-muc-tay">
                  <p className="text-sm font-semibold text-fg">Sách chỉ tay phương Tây nói gì về dáng tay này</p>
                  <ul className="mt-2 space-y-3">
                    {kq.muc!.map((m) => (
                      <li key={m.ma} className="text-sm leading-relaxed">
                        <p>{m.loi}</p>
                        {m.viec && <p className="mt-1 text-xs text-fg-muted"><span className="text-fg">Việc nên làm:</span> {m.viec}</p>}
                        {m.trich && (
                          <details className="mt-1 text-xs text-fg-muted">
                            <summary className="cursor-pointer">Nguyên văn</summary>
                            <p lang="en" className="mt-1 italic">“{m.trich}”</p>
                            {m.nguon_hien_thi && <p className="mt-0.5">— {m.nguon_hien_thi}</p>}
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {kq?.hop_le && kq.cau_ket && <p className="text-xs text-fg-faint">{kq.cau_ket}</p>}

              {soDaChon > 0 && (
                <a href="#tu-soi" className="flex min-h-[44px] items-center justify-center rounded-full bg-gold px-5 text-sm font-medium text-bg" data-testid="ct-den-doc">
                  Đã chọn {soDaChon} cung · xem sách xưa nói gì ↓
                </a>
              )}
              {dongY && (
                <p className="text-xs text-fg-faint">
                  Đã đồng ý đo bàn tay ngày {ngayDongYAnhMat(dongY)}.{" "}
                  <button type="button" className="min-h-[40px] underline underline-offset-2 hover:text-fg" onClick={rutDongY}>Rút thoả thuận</button>
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
