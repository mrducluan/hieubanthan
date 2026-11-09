"use client";
// QBG-1 — "Quét 3 góc như Face ID": mở camera ngay trong trang, máy người dùng tự nhận góc mặt (bộ tìm điểm mốc chạy trong
// trình duyệt, lib/quet-mat-bo-do) và TỰ CHỤP khi đúng góc: nhìn thẳng → quay trái → quay phải. Trong lúc giữ yên, giữ lại
// khung NÉT NHẤT. Khung hình KHÔNG ghi hình, KHÔNG gửi đi: ảnh chụp chỉ thành tệp trong bộ nhớ trình duyệt rồi đi vào luồng cũ
// (ảnh thẳng → tự tìm 20 điểm ANH-3; ảnh nghiêng → chấm đường viền ANH-4) → chỉ toạ độ đi tới engine sau thoả thuận dm1.
// Bộ đo không nạp được → vẫn quét được bằng nút chụp (người dùng tự canh góc theo hướng dẫn).
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ChevronsLeft, ChevronsRight, Loader2, RefreshCcw, SkipForward, X } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { CAC_BUOC, LOI_KHUNG, NGUONG, TEN_BUOC, chonMat, danhGia, gocMat, matDauDoQuayHan, sangVaNet, sangXam, theoKhungHien, tienDo, type Buoc, type GocMat, type LoiKhung } from "@/lib/quet-mat";
import type { BoDoVideo } from "@/lib/quet-mat-bo-do";
import { cn } from "@/lib/utils";

export type KetQuaQuet = Partial<Record<Buoc, File>>;
type TrangThai = "mo_camera" | "cho_bo_do" | "dang_quet" | "tay" | "loi";

const HUONG_DAN: Record<Buoc, string> = {
  thang: "Nhìn thẳng vào máy, giữ yên",
  trai: "Quay đầu từ từ sang TRÁI, tới khi thấy rõ sống mũi và cằm",
  phai: "Quay đầu từ từ sang PHẢI, tới khi thấy rõ sống mũi và cằm",
};
const SO_VACH = 60;

function loiCamera(e: unknown): string {
  const ten = e instanceof DOMException ? e.name : "";
  if (ten === "NotAllowedError" || ten === "SecurityError") return "Bạn chưa cho phép dùng camera. Bấm biểu tượng ổ khoá cạnh địa chỉ trang để cho phép, hoặc dùng “Chọn ảnh”.";
  if (ten === "NotFoundError" || ten === "OverconstrainedError") return "Không tìm thấy camera trên máy này — dùng “Chọn ảnh”.";
  if (ten === "NotReadableError") return "Camera đang bị ứng dụng khác dùng — đóng ứng dụng đó rồi thử lại.";
  return "Chưa mở được camera trên trình duyệt này — dùng “Chọn ảnh”.";
}

/** Vẽ khung hình camera (KHÔNG lật gương — ảnh đúng như người khác nhìn) ra tệp JPEG, cạnh dài ≤ 1600 px. */
function veKhung(v: HTMLVideoElement, c: HTMLCanvasElement): boolean {
  const w = v.videoWidth, h = v.videoHeight;
  if (!w || !h) return false;
  const k = Math.min(1, 1600 / Math.max(w, h));
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext("2d");
  if (!g) return false;
  g.drawImage(v, 0, 0, c.width, c.height);
  return true;
}
const raTep = (c: HTMLCanvasElement, buoc: Buoc) => new Promise<File | null>((ok) =>
  c.toBlob((b) => ok(b ? new File([b], `quet-${buoc}.jpg`, { type: "image/jpeg" }) : null), "image/jpeg", 0.92));

export function QuetBaGoc({ onXong, onDong }: { onXong: (kq: KetQuaQuet) => void; onDong: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const luong = useRef<MediaStream | null>(null);
  const boDo = useRef<BoDoVideo | null>(null);
  const [trangThai, setTrangThai] = useState<TrangThai>("mo_camera");
  const [loi, setLoi] = useState<string | null>(null);
  const [mat, setMat] = useState<"user" | "environment">("user");
  const [buocIdx, setBuocIdx] = useState(0);
  const [kq, setKq] = useState<KetQuaQuet>({});
  const [anhNho, setAnhNho] = useState<Partial<Record<Buoc, string>>>({});
  const [nhac, setNhac] = useState<LoiKhung | null>(null);
  const [td, setTd] = useState(0);
  const [dem, setDem] = useState<number | null>(null);
  const [chop, setChop] = useState(false);
  const buoc = CAC_BUOC[buocIdx] ?? "thang";
  const st = useRef({ buoc, giuTu: 0, giuYaw: 0, netTot: -1, yawMax: 0, matTu: 0, dangChup: false, tLan: 0, xong: false });
  st.current.buoc = buoc;
  const tot = useRef<HTMLCanvasElement | null>(null);
  const nho = useRef<HTMLCanvasElement | null>(null);
  const dongRef = useRef<HTMLButtonElement>(null);

  // ----- camera -----
  const tatCamera = () => { luong.current?.getTracks().forEach((t) => t.stop()); luong.current = null; };
  useEffect(() => {
    let huy = false;
    (async () => {
      setTrangThai("mo_camera"); setLoi(null);
      if (!navigator.mediaDevices?.getUserMedia) { setTrangThai("loi"); setLoi("Trình duyệt này không mở được camera trong trang — dùng “Chọn ảnh”."); return; }
      try {
        tatCamera();
        const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: mat, width: { ideal: 1280 }, height: { ideal: 1280 } } });
        if (huy) { s.getTracks().forEach((t) => t.stop()); return; }
        luong.current = s;
        const v = video.current!;
        v.srcObject = s;
        await v.play().catch(() => undefined);
        setTrangThai(boDo.current ? "dang_quet" : "cho_bo_do");
      } catch (e) {
        if (huy) return;
        setTrangThai("loi"); setLoi(loiCamera(e));
        ghi("chart_interacted", { mo_dun: "nhantuong", kind: "quet_loi", ly_do: e instanceof DOMException ? e.name : "khac" });
      }
    })();
    return () => { huy = true; };
  }, [mat]);
  useEffect(() => () => { tatCamera(); boDo.current?.close(); boDo.current = null; }, []);

  // ----- bộ đo (nạp một lần) -----
  useEffect(() => {
    let huy = false;
    import("@/lib/quet-mat-bo-do").then((m) => m.napBoDoVideo()).then((b) => {
      if (huy) { b.close(); return; }
      boDo.current = b;
      setTrangThai((t) => (t === "cho_bo_do" ? "dang_quet" : t));
    }).catch(() => {
      if (huy) return;
      setTrangThai((t) => (t === "cho_bo_do" || t === "mo_camera" ? "tay" : t));
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "quet_loi", ly_do: "bo_do" });
    });
    return () => { huy = true; };
  }, []);

  // khoá cuộn trang + Esc để đóng
  useEffect(() => {
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dongRef.current?.focus();
    const phim = (e: KeyboardEvent) => { if (e.key === "Escape") onDong(); };
    window.addEventListener("keydown", phim);
    return () => { document.body.style.overflow = cu; window.removeEventListener("keydown", phim); };
  }, [onDong]);

  const datLai = () => { const s = st.current; s.giuTu = 0; s.netTot = -1; setDem(null); };
  /** Sang bước mới: xoá vòng tiến độ + lời nhắc của bước trước (tránh chớp "đủ" xanh nhầm). */
  const sangBuoc = () => { datLai(); st.current.yawMax = 0; st.current.matTu = 0; setTd(0); setNhac(null); setBuocIdx((i) => i + 1); };

  // ----- chụp + sang bước -----
  const chupXong = useCallback(async (c: HTMLCanvasElement, cachChup: "tu_dong" | "tay") => {
    const s = st.current, b = s.buoc;
    s.dangChup = true;
    const tep = await raTep(c, b);
    s.dangChup = false;
    datLai();
    if (!tep) return;
    setChop(true); window.setTimeout(() => setChop(false), 220);
    setAnhNho((a) => ({ ...a, [b]: URL.createObjectURL(tep) }));
    setKq((k) => ({ ...k, [b]: tep }));
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: "quet_chup", buoc: b, cach: cachChup });
    sangBuoc();
  }, []);

  const chupTay = () => {
    const v = video.current;
    if (!v || st.current.dangChup || buocIdx >= CAC_BUOC.length) return;
    const c = document.createElement("canvas");
    if (veKhung(v, c)) void chupXong(c, "tay");
  };
  const boQua = sangBuoc;

  // xong hết bước → trả kết quả
  useEffect(() => {
    if (buocIdx < CAC_BUOC.length || st.current.xong) return;
    st.current.xong = true;
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: "quet_xong", so_goc: Object.keys(kq).length, tu_dong: trangThai === "dang_quet" ? 1 : 0 });
    tatCamera();
    if (kq.thang) onXong(kq); else onDong();
  }, [buocIdx, kq, onXong, onDong, trangThai]);
  const anhNhoRef = useRef(anhNho);
  anhNhoRef.current = anhNho;
  useEffect(() => () => { Object.values(anhNhoRef.current).forEach((u) => u && URL.revokeObjectURL(u)); }, []);

  // ----- vòng nhận góc mặt -----
  useEffect(() => {
    if (trangThai !== "dang_quet") return;
    let raf = 0;
    const vong = () => {
      raf = requestAnimationFrame(vong);
      const v = video.current, bd = boDo.current, s = st.current;
      if (!v || !bd || v.readyState < 2 || s.dangChup || s.xong) return;
      const now = performance.now();
      if (now - s.tLan < 60) return;                      // ~16 lượt/giây là đủ, đỡ nóng máy
      s.tLan = now;
      let ds: { x: number; y: number; z: number }[][] = [];
      try { ds = bd.detectForVideo(v, now).faceLandmarks; } catch { return; }
      const w = v.videoWidth, h = v.videoHeight;
      const { luoi, soMat } = chonMat(ds);
      const g0: GocMat | null = luoi && soMat === 1 ? gocMat(luoi, w, h) : null;
      const g = g0 && theoKhungHien(g0, w, h, v.clientWidth, v.clientHeight);
      if (g && s.buoc !== "thang") s.yawMax = Math.max(s.yawMax, g.yaw * (s.buoc === "trai" ? 1 : -1));

      // độ sáng + độ nét trên vùng mặt thu nhỏ 96 px
      let sang: number | undefined, net = 0;
      const nc = (nho.current ??= document.createElement("canvas"));
      nc.width = 96; nc.height = 96;
      const ng = nc.getContext("2d", { willReadFrequently: true });
      if (ng) {
        const canh = g0 ? Math.max(32, g0.rong * w) : Math.min(w, h) * 0.5;
        const cx = (g0 ? g0.tam.x : 0.5) * w, cy = (g0 ? g0.tam.y : 0.5) * h;
        ng.drawImage(v, cx - canh / 2, cy - canh / 2, canh, canh, 0, 0, 96, 96);
        const r = sangVaNet(sangXam(ng.getImageData(0, 0, 96, 96).data), 96, 96);
        sang = r.sang; net = r.net;
      }

      let dg = danhGia(g, s.buoc, soMat, sang);
      // bước nghiêng: quay quá góc bộ đo còn bám được (mất dấu) sau khi đã quay đúng chiều → vẫn chụp
      if (!dg.ok && ds.length === 0 && matDauDoQuayHan(s.yawMax, s.buoc)) {
        s.matTu ||= now;
        if (now - s.matTu > 250) dg = { ok: true, loi: null };
      } else if (ds.length) s.matTu = 0;
      if (dg.ok && net < 6) dg = { ok: false, loi: "mo" };

      setNhac(dg.loi);
      setTd(g ? tienDo(g, s.buoc) : ds.length === 0 && matDauDoQuayHan(s.yawMax, s.buoc) ? 1 : 0);
      if (!dg.ok) { if (s.giuTu) datLai(); return; }
      // giữ yên: góc không đổi quá ngưỡng, đếm 3-2-1, giữ lại khung nét nhất
      const yaw = g?.yaw ?? s.giuYaw;
      if (!s.giuTu || Math.abs(yaw - s.giuYaw) > NGUONG.rung_do) { s.giuTu = now; s.giuYaw = yaw; s.netTot = -1; }
      if (net > s.netTot) { s.netTot = net; tot.current ??= document.createElement("canvas"); veKhung(v, tot.current); }
      const con = NGUONG.giu_ms - (now - s.giuTu);
      setDem(con > 0 ? Math.ceil((con / NGUONG.giu_ms) * 3) : null);
      if (con <= 0 && tot.current) void chupXong(tot.current, "tu_dong").then(() => { tot.current = null; });
    };
    raf = requestAnimationFrame(vong);
    return () => cancelAnimationFrame(raf);
  }, [trangThai, chupXong]);

  const guong = mat === "user";
  const muiTenTrai = (buoc === "trai") === guong;     // camera trước lật gương: người quay trái → mặt trên màn hình quay sang trái
  const dangLam = buocIdx < CAC_BUOC.length;
  const loiNhac = !nhac ? null
    : nhac === "quay_them" && buoc !== "thang" ? `Quay thêm sang ${buoc === "trai" ? "trái" : "phải"} chút nữa` : LOI_KHUNG[nhac];
  const xanh = td >= 1 && !loiNhac;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="quet-tieu-de" data-testid="quet-ba-goc"
      className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <video ref={video} playsInline muted autoPlay data-testid="quet-video"
        className="absolute inset-0 size-full object-cover" style={guong ? { transform: "scaleX(-1)" } : undefined} />
      <div className={cn("pointer-events-none absolute inset-0 bg-white transition-opacity duration-200", chop ? "opacity-60" : "opacity-0")} aria-hidden />

      {/* đầu: một hàng tiêu đề + trạng thái + đóng; dưới là MỘT dòng hướng dẫn — chừa tối đa chỗ cho khung mặt */}
      <div className="relative z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <p id="quet-tieu-de" className="shrink-0 text-base font-semibold">Quét khuôn mặt</p>
          <p className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-full bg-white/15 px-2.5 py-0.5 text-xs" data-testid="quet-trang-thai" aria-live="polite">
            {trangThai === "mo_camera" ? <><Loader2 className="size-3 shrink-0 animate-spin" aria-hidden /> Đang mở camera…</>
              : trangThai === "cho_bo_do" ? <><Loader2 className="size-3 shrink-0 animate-spin" aria-hidden /> Đang chuẩn bị…</>
              : trangThai === "tay" ? "Bấm nút chụp khi đúng góc"
              : trangThai === "loi" ? "Chưa mở được camera"
              : dem ? <><span className="size-1.5 shrink-0 rounded-full bg-emerald-400" /> Giữ yên — sắp chụp</>
              : <><span className={cn("size-1.5 shrink-0 rounded-full", loiNhac ? "bg-amber-300" : "bg-emerald-400")} /> {loiNhac ? "Đang canh góc" : "Đã thấy khuôn mặt"}</>}
          </p>
          <button ref={dongRef} type="button" onClick={onDong} aria-label="Đóng quét khuôn mặt" data-testid="quet-dong"
            className="ml-auto grid size-10 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25"><X className="size-5" aria-hidden /></button>
        </div>
        {dangLam && trangThai !== "loi" && (
          <p className="mt-3 text-center text-[15px] leading-snug" aria-live="polite" data-testid="quet-huong-dan">
            <b className={cn(loiNhac && trangThai === "dang_quet" ? "text-amber-200" : "text-white")}>{trangThai === "dang_quet" && loiNhac ? loiNhac : HUONG_DAN[buoc]}</b>
          </p>
        )}
      </div>

      {/* giữa: khung oval + vòng vạch tiến độ — chiếm gần hết bề ngang điện thoại */}
      <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center">
        {trangThai === "loi" ? (
          <div className="mx-6 max-w-sm rounded-2xl bg-white/10 p-5 text-center text-sm" data-testid="quet-loi">
            <p>{loi}</p>
            <button type="button" onClick={onDong} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">Quay lại chọn ảnh</button>
          </div>
        ) : (
          <div className="relative aspect-[3/4] w-[min(86vw,58vh)]" data-testid="quet-khung">
            <div className="absolute inset-[7%] rounded-[50%] shadow-[0_0_0_200vmax_rgba(0,0,0,0.55)]" aria-hidden />
            <svg viewBox="0 0 300 400" className="absolute inset-0 size-full" aria-hidden>
              {Array.from({ length: SO_VACH }, (_, i) => {
                const a = (i / SO_VACH) * Math.PI * 2 - Math.PI / 2;
                const rx = 134, ry = 180, d = 12;
                const x1 = 150 + Math.cos(a) * rx, y1 = 200 + Math.sin(a) * ry;
                const x2 = 150 + Math.cos(a) * (rx + d), y2 = 200 + Math.sin(a) * (ry + d);
                const sang = i / SO_VACH < td;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={3.5} strokeLinecap="round"
                  className={cn("transition-colors duration-150", sang ? (xanh ? "stroke-emerald-400" : "stroke-amber-300") : "stroke-white/30")} />;
              })}
            </svg>
            {dem && <span className="absolute inset-0 grid place-items-center text-7xl font-light text-white/90 drop-shadow" data-testid="quet-dem">{dem}</span>}
            {dangLam && buoc !== "thang" && !dem && (
              <span className={cn("absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow animate-pulse motion-reduce:animate-none",
                muiTenTrai ? "left-0" : "right-0")} aria-hidden>
                {muiTenTrai ? <ChevronsLeft className="size-7" /> : <ChevronsRight className="size-7" />}
              </span>
            )}
          </div>
        )}
      </div>

      {/* chân: hàng 3 bước (đủ rộng, không xuống dòng) → hàng nút: đổi camera · chụp · bỏ qua */}
      <div className="relative z-10 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6">
        <ol className="mx-auto grid max-w-md grid-cols-3 gap-1.5" aria-label="Các góc cần quét">
          {CAC_BUOC.map((b, i) => (
            <li key={b} aria-current={i === buocIdx ? "step" : undefined} data-testid={`quet-buoc-${b}`} data-xong={kq[b] ? "1" : "0"}
              className={cn("relative flex h-9 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full px-2 text-xs font-medium",
                i === buocIdx ? "bg-white text-black" : kq[b] ? "bg-emerald-500/35 text-white" : "bg-white/15 text-white/75")}>
              {anhNho[b] && <img src={anhNho[b]} alt="" className="absolute inset-0 size-full object-cover opacity-30" style={guong ? { transform: "scaleX(-1)" } : undefined} />}
              {kq[b] && <Check className="relative size-3.5 shrink-0" aria-hidden />}
              <span className="relative">{TEN_BUOC[b]}</span>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-3 grid max-w-md grid-cols-[1fr_auto_1fr] items-center">
          <button type="button" onClick={() => setMat((m) => (m === "user" ? "environment" : "user"))} aria-label="Đổi camera trước / sau"
            className="grid size-11 place-items-center justify-self-start rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-40" disabled={trangThai === "loi"}><RefreshCcw className="size-5" aria-hidden /></button>
          <button type="button" onClick={chupTay} aria-label={`Chụp ${TEN_BUOC[buoc].toLowerCase()} ngay`} data-testid="quet-chup"
            disabled={!dangLam || trangThai === "loi" || trangThai === "mo_camera"}
            className="grid size-[4.25rem] place-items-center rounded-full border-4 border-white/60 bg-white text-black disabled:opacity-40"><Camera className="size-7" aria-hidden /></button>
          {dangLam && buoc !== "thang" && trangThai !== "loi" ? (
            <button type="button" onClick={boQua} data-testid="quet-bo-qua" aria-label="Bỏ qua góc này (ảnh nghiêng không bắt buộc)"
              className="flex items-center gap-1 justify-self-end rounded-full bg-white/15 px-3 py-2 text-xs hover:bg-white/25">
              <SkipForward className="size-3.5" aria-hidden /> Bỏ qua
            </button>
          ) : <span />}
        </div>
        <p className="mt-2 text-center text-[10px] text-white/55">Camera chỉ chạy trên máy bạn — không ghi hình, không gửi ảnh đi.</p>
      </div>
    </div>
  );
}
