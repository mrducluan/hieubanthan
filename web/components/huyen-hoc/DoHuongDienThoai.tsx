"use client";
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPaste, Compass, ExternalLink, MapPin, Navigation, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { CachLam } from "@/components/huyen-hoc/CachLam";
import { LocateFixed } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

// PT-V1 — đo hướng nhà bằng la bàn điện thoại. Web CHỈ đọc cảm biến và gửi số độ; engine đổi độ → hướng,
// sơn, toạ, trạch, du niên. Luôn có ô nhập tay (máy tính, máy không có la bàn, la bàn nhiễu).

export interface KetQuaDoHuong {
  do_huong: number; huong: string; son_huong: string; do_toa: number; toa: string; son_toa: string;
  canh_bao: string | null; canh_bao_y: string | null; luu_y: string;
  trach: { quai: string; nhom: string };
  menh_quai?: { quai: string; nhom: string };
  du_nien?: { du_nien: string; cat: boolean };
  hop_nhom?: boolean;
}

type SuKienLaBan = DeviceOrientationEvent & { webkitCompassHeading?: number };

/** UI-PT 1 "la bàn sống": bảng 8 hướng → du niên của mệnh quái + nghĩa / "dùng cho" (engine `/menh-quai` trả, KB du_nien). */
export interface LaBanCaNhan {
  quai: string; bang: Record<string, string>; huongCat: string[];
  duNienY?: Record<string, { loai: string; y_nghia: string; dung_cho: string }>;
}
const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
/** Ô 45° đang quay về (ranh giới ±22,5° quanh chính hướng — đúng cách vẽ 8 cung của la bàn). Chỉ để tô màu + đọc nhãn
 *  theo thời gian thực; hướng NHÀ vẫn do engine đổi từ độ khi bấm "Chốt" (sơn, toạ, trạch, cảnh báo ranh giới). */
export function oHuong(doHuong: number): string {
  return HUONG8[Math.round((((doHuong % 360) + 360) % 360) / 45) % 8]!;
}

/** Q3: đọc "vĩ độ, kinh độ" từ chuỗi dán vào — số thuần "10.776, 106.700" hoặc link bản đồ (@lat,lon · q=lat,lon · !3dlat!4dlon). */
export function docToaDo(s: string): [number, number] | null {
  const t = decodeURIComponent(s.trim());
  const mau = [/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, /[?&](?:q|ll|query|center)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/];
  for (const m of mau) {
    const k = m.exec(t);
    if (k) {
      const la = Number(k[1]), lo = Number(k[2]);
      if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) return [la, lo];
    }
  }
  return null;
}
type CoXinQuyen = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/** Độ hướng từ sự kiện cảm biến: iOS cho sẵn webkitCompassHeading; Android cho alpha tuyệt đối (ngược chiều kim). */
function doTuSuKien(e: SuKienLaBan, tuyetDoi: boolean): number | null {
  if (typeof e.webkitCompassHeading === "number") return e.webkitCompassHeading;
  if ((tuyetDoi || e.absolute) && typeof e.alpha === "number") return (360 - e.alpha) % 360;
  return null;
}

function cungLaBan(i: number, r0: number, r1: number) {
  const a0 = ((i * 45 - 22.5 - 90) * Math.PI) / 180, a1 = ((i * 45 + 22.5 - 90) * Math.PI) / 180;
  const p = (r: number, a: number) => `${100 + r * Math.cos(a)} ${100 + r * Math.sin(a)}`;
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

/** Độ nguyên 0–359 (chỉ để hiển thị / kéo mặt la bàn; engine vẫn đổi độ → hướng, sơn khi Chốt). */
const doChuan = (d: number) => ((Math.round(d) % 360) + 360) % 360;

/** Mặt la bàn. Có `onXoay` (máy tính, máy không có cảm biến): kéo xoay bằng chuột / ngón tay, bấm một chữ để đưa nó lên
 *  dưới kim, phím ← → chỉnh 1° (Shift: 15°) — hướng đang ở dưới kim là hướng mặt nhà. */
function MatLaBan({ doHuong, laBan, onXoay }: { doHuong: number | null; laBan?: LaBanCaNhan | null; onXoay?: (d: number) => void }) {
  const keo = useRef<{ goc0: number; d0: number; x0: number; y0: number; da: boolean } | null>(null);
  const [dangKeo, setDangKeo] = useState(false);
  // Góc màn hình của con trỏ quanh tâm mặt la bàn: 0 = trên, theo chiều kim đồng hồ.
  const goc = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return (Math.atan2(e.clientX - (r.left + r.width / 2), r.top + r.height / 2 - e.clientY) * 180) / Math.PI;
  };
  const ten = (doHuong == null ? "La bàn" : `La bàn: ${Math.round(doHuong)} độ`) + (laBan ? ` — tô hướng tốt của mệnh ${laBan.quai}` : "");
  const tuongTac = onXoay ? {
    role: "slider" as const, tabIndex: 0, "aria-valuemin": 0, "aria-valuemax": 359, "aria-valuenow": doHuong == null ? undefined : doChuan(doHuong),
    "aria-label": "Hướng mặt nhà — kéo xoay mặt la bàn hoặc dùng phím mũi tên", "aria-valuetext": doHuong == null ? "chưa chọn" : `${doChuan(doHuong)} độ`,
    "data-testid": "la-ban-keo",
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      keo.current = { goc0: goc(e), d0: doHuong ?? 0, x0: e.clientX, y0: e.clientY, da: false };
      setDangKeo(true);
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      const k = keo.current;
      if (!k) return;
      if (!k.da && Math.hypot(e.clientX - k.x0, e.clientY - k.y0) > 4) k.da = true;
      if (k.da) onXoay(doChuan(k.d0 - (goc(e) - k.goc0)));   // mặt la bàn đi theo tay
    },
    onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => {
      const k = keo.current;
      keo.current = null; setDangKeo(false);
      if (k && !k.da) onXoay(doChuan(k.d0 + goc(e)));        // bấm một điểm → đưa hướng đó lên dưới kim
    },
    onPointerCancel: () => { keo.current = null; setDangKeo(false); },
    onKeyDown: (e: React.KeyboardEvent<SVGSVGElement>) => {
      const buoc = e.shiftKey ? 15 : 1;
      const d = doHuong ?? 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onXoay(doChuan(d + buoc)); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onXoay(doChuan(d - buoc)); }
    },
  } : { role: "img" as const, "aria-label": ten };
  return (
    <svg viewBox="0 0 200 200" className={cn("mx-auto h-48 w-48", onXoay && "cursor-grab touch-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold", dangKeo && "cursor-grabbing")}
      {...tuongTac}>
      <circle cx="100" cy="100" r="94" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
      <g style={{ transform: `rotate(${-(doHuong ?? 0)}deg)`, transformOrigin: "100px 100px", transition: dangKeo ? "none" : "transform 0.15s linear" }}>
        {laBan && HUONG8.map((h, i) => (
          <path key={h} d={cungLaBan(i, 44, 88)} data-testid="la-ban-cung" data-cat={laBan.huongCat.includes(h)}
            fill={laBan.huongCat.includes(h) ? "rgb(var(--jade) / 0.22)" : "rgb(var(--cinnabar) / 0.08)"} stroke="rgb(var(--line) / 0.6)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <line key={i} x1="100" y1="10" x2="100" y2={i % 3 === 0 ? 22 : 16} stroke="rgb(var(--fg-faint))" strokeWidth={i % 3 === 0 ? 2 : 1}
            transform={`rotate(${i * 15} 100 100)`} />
        ))}
        {(["B", "Đ", "N", "T"] as const).map((c, i) => (
          <text key={c} x="100" y="38" textAnchor="middle" fontSize="14" fontWeight="700"
            fill={c === "B" ? "rgb(var(--cinnabar))" : "rgb(var(--fg-muted))"} transform={`rotate(${i * 90} 100 100)`}>{c}</text>
        ))}
      </g>
      <path d="M100 30 L108 100 L100 92 L92 100 Z" fill="rgb(var(--gold))" />
      <circle cx="100" cy="100" r="4" fill="rgb(var(--gold))" />
    </svg>
  );
}

export function DoHuongDienThoai({ sinh, onDungToa, onChot, laBan }: {
  sinh: { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;
  onDungToa?: (doToa: number) => void;
  /** PT-V0: báo kết quả engine vừa đổi (độ hướng nhà) cho khung Khảo sát nhà. */
  onChot?: (kq: KetQuaDoHuong) => void;
  /** UI-PT 1: có mệnh quái → mặt la bàn tô 8 cung + đọc du niên của hướng đang quay về theo thời gian thực. */
  laBan?: LaBanCaNhan | null;
}) {
  const [doSong, setDoSong] = useState<number | null>(null);
  // Hai việc cùng một la bàn: đo hướng NHÀ (chốt → engine → hồ sơ nhà) · tìm hướng TỐT để kê bàn, đầu giường (chỉ đọc sống, không lưu).
  const [cheDo, setCheDo] = useState<"nha" | "ke_do">("nha");
  // UI-PT2 A: loại nhà (hồ sơ nhà trên máy) → căn hộ đo ở ban công / bản đồ, lưu `theo: ban_cong`.
  const nhaLuu = useHoSoNha();
  const canHo = nhaLuu?.loai_nha === "can_ho";
  // UI-PT2 B: định vị bằng GPS điện thoại → điền toạ độ (chỉ dùng tính góc, không lưu, không gửi đi đâu ngoài engine).
  const [dangDinhVi, setDangDinhVi] = useState<"tam" | "truoc" | null>(null);
  const [doChinhXac, setDoChinhXac] = useState<number | null>(null);
  // Sai số của từng điểm lấy bằng định vị (null = gõ / dán tay). Máy tính không có GPS: trình duyệt đoán theo wifi / IP,
  // sai số hàng chục – hàng trăm mét → hai điểm trong một căn nhà không tính được hướng.
  const [saiSo, setSaiSo] = useState<{ tam: number | null; truoc: number | null }>({ tam: null, truoc: null });
  // Máy tính (chuột) → hướng dẫn "chuột phải" thay cho "nhấn giữ".
  const [mayTinh, setMayTinh] = useState(false);
  useEffect(() => { try { setMayTinh(window.matchMedia("(pointer: fine)").matches); } catch { /* bỏ qua */ } }, []);
  const dinhVi = (o: "tam" | "truoc") => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { setLoi("Trình duyệt này không có định vị — nhấn giữ trên bản đồ để chép toạ độ."); return; }
    setDangDinhVi(o); setLoi(null);
    navigator.geolocation.getCurrentPosition((pos) => {
      const v = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
      (o === "tam" ? setTam : setTruoc)(v);
      setDoChinhXac(Math.round(pos.coords.accuracy));
      setSaiSo((s) => ({ ...s, [o]: Math.round(pos.coords.accuracy) }));
      setDangDinhVi(null);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "dinh_vi_gps", diem: o, chinh_xac_m: Math.round(pos.coords.accuracy) });
    }, () => { setDangDinhVi(null); setLoi("Chưa lấy được vị trí (chưa cho phép, hoặc đang ở trong nhà kín). Nhấn giữ trên bản đồ để chép toạ độ."); },
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 });
  };
  const hSong = doSong == null ? null : oHuong(doSong);
  const dnSong = hSong && laBan ? laBan.bang[hSong] ?? null : null;
  const ySong = dnSong && laBan?.duNienY ? laBan.duNienY[dnSong] ?? null : null;
  const [dangDo, setDangDo] = useState(false);
  const [nhap, setNhap] = useState("");
  const [kq, setKq] = useState<KetQuaDoHuong | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const huy = useRef<(() => void) | null>(null);
  // Q3: hướng từ hai điểm bản đồ (tâm nhà → điểm trước mặt nhà) — cho căn hộ không đo được la bàn ở cửa.
  const [moBanDo, setMoBanDo] = useState(false);
  const [tam, setTam] = useState("");
  const [truoc, setTruoc] = useState("");
  const [kcBanDo, setKcBanDo] = useState<number | null>(null);
  /** Dán toạ độ vừa chép (Google Maps trên máy tính: chuột phải → bấm dòng số đầu tiên là đã chép). */
  const dan = async (o: "tam" | "truoc") => {
    try {
      const t = (await navigator.clipboard.readText()).slice(0, 300);
      if (!docToaDo(t)) { setLoi("Bộ nhớ tạm chưa có toạ độ. Trên Google Maps: chuột phải lên mái nhà → bấm dòng số đầu tiên rồi bấm Dán lại."); return; }
      (o === "tam" ? setTam : setTruoc)(t); setSaiSo((s) => ({ ...s, [o]: null })); setLoi(null);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "ban_do_dan", diem: o });
    } catch { setLoi("Trình duyệt chưa cho đọc bộ nhớ tạm — bấm vào ô rồi nhấn Ctrl+V (Mac: ⌘+V)."); }
  };
  /** Mở Google Maps ảnh vệ tinh ở tab mới, căn giữa vị trí gần đúng của máy (nếu bạn cho phép) để tìm mái nhà nhanh.
   *  Tab mở ngay trong cú bấm (không bị chặn cửa sổ bật lên), vị trí đến sau thì đổi địa chỉ tab. Không lưu vị trí. */
  const moBanDoVeTinh = () => {
    const daCo = docToaDo(tam) ?? docToaDo(truoc);
    const url = (p: [number, number] | null) => p
      ? `https://www.google.com/maps/@${p[0].toFixed(6)},${p[1].toFixed(6)},20z/data=!3m1!1e3`
      : "https://www.google.com/maps/@16.0,106.5,6z/data=!3m1!1e3";
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "mo_ban_do_ve_tinh", co_vi_tri: !!daCo });
    if (daCo || typeof navigator === "undefined" || !navigator.geolocation) { window.open(url(daCo), "_blank", "noopener"); return; }
    const w = window.open("about:blank", "_blank");
    if (w) w.opener = null;
    const di = (p: [number, number] | null) => { if (w && !w.closed) w.location.href = url(p); else window.open(url(p), "_blank", "noopener"); };
    navigator.geolocation.getCurrentPosition((pos) => di([pos.coords.latitude, pos.coords.longitude]), () => di(null),
      { enableHighAccuracy: false, timeout: 6_000, maximumAge: 600_000 });
  };
  const chotBanDo = async () => {
    const a = docToaDo(tam), b = docToaDo(truoc);
    if (!a || !b) { setLoi("Dán toạ độ dạng \"10.776, 106.700\" hoặc link bản đồ có toạ độ cho cả hai điểm."); return; }
    setDang(true); setLoi(null);
    try {
      const r = await postJson<KetQuaDoHuong & { khoang_cach_m: number }>("/api/phongthuy/huong-ban-do", { tam: a, truoc: b, ...(sinh ? { sinh } : {}) });
      // Điểm lấy bằng định vị có sai số ≥ nửa khoảng cách hai điểm → góc tính ra gần như ngẫu nhiên: không chốt, không lưu.
      const ss = Math.max(saiSo.tam ?? 0, saiSo.truoc ?? 0);
      if (ss > 0 && r.khoang_cach_m < 2 * ss) {
        setKcBanDo(r.khoang_cach_m);
        setLoi(`Vị trí lấy tự động sai số ±${ss} m, lớn so với khoảng cách hai điểm (${r.khoang_cach_m} m) — hướng tính ra chưa tin được. `
          + (mayTinh ? "Máy tính chỉ đoán vị trí theo wifi; hãy mở Google Maps ảnh vệ tinh, chuột phải lên mái nhà để chép toạ độ." : "Ra ngoài trời, đi xa tâm nhà hơn rồi lấy lại, hoặc nhấn giữ trên bản đồ."));
        ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huong_ban_do_sai_so", sai_so_m: ss });
        return;
      }
      setKq(r); setKcBanDo(r.khoang_cach_m); setDoSong(r.do_huong);
      onChot?.(r);
      try { luuHoSoNha({ huong_do: r.do_huong, huong: undefined, ...(canHo ? { theo: "ban_cong" } : {}) }); } catch { /* bỏ qua */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huong_ban_do" });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa tính được từ hai điểm này."); }
    finally { setDang(false); }
  };

  useEffect(() => () => huy.current?.(), []);

  const batDau = useCallback(async () => {
    setLoi(null);
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setLoi("Trình duyệt này không có la bàn — nhập độ đo bằng la bàn thật ở ô bên dưới.");
      return;
    }
    const DOE = window.DeviceOrientationEvent as CoXinQuyen;
    if (typeof DOE.requestPermission === "function") {
      try {
        if ((await DOE.requestPermission()) !== "granted") { setLoi("Bạn chưa cho phép dùng cảm biến hướng."); return; }
      } catch { setLoi("Không xin được quyền cảm biến hướng."); return; }
    }
    const coTuyetDoi = "ondeviceorientationabsolute" in window;
    const ten = coTuyetDoi ? "deviceorientationabsolute" : "deviceorientation";
    let nhan = false;
    const nghe = (e: Event) => {
      const d = doTuSuKien(e as SuKienLaBan, coTuyetDoi);
      if (d != null) { nhan = true; setDoSong(d); }
    };
    window.addEventListener(ten, nghe);
    huy.current = () => window.removeEventListener(ten, nghe);
    setDangDo(true);
    window.setTimeout(() => {
      if (!nhan) { setLoi("Máy chưa trả hướng la bàn (máy tính, hoặc cảm biến bị tắt) — nhập độ tay ở ô bên dưới."); }
    }, 2500);
  }, []);

  const chot = async (doHuong: number) => {
    setDang(true); setLoi(null);
    try {
      const r = await postJson<KetQuaDoHuong>("/api/phongthuy/do-huong", { do_huong: doHuong, ...(sinh ? { sinh } : {}) });
      setKq(r);
      onChot?.(r);
      try { luuHoSoNha({ huong_do: r.do_huong, huong: undefined, ...(canHo ? { theo: "ban_cong" } : {}) }); } catch { /* bỏ qua */ }   // KC-2: hồ sơ nhà trên máy
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: dangDo ? "la_ban_dien_thoai" : "nhap_do_huong" });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đổi được độ này."); }
    finally { setDang(false); }
  };

  const chotNhap = () => {
    const d = Number(nhap.replace(",", "."));
    if (!(nhap.trim() !== "" && d >= 0 && d < 360)) { setLoi("Độ cần là số từ 0 đến dưới 360 (0 = chính Bắc)."); return; }
    if (cheDo === "ke_do") { setDoSong(d); setLoi(null); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "la_ban_ke_do", nhap_tay: true }); return; }
    void chot(d);
  };

  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="do-huong" data-testid="do-huong">
      <h2 id="do-huong" className="flex items-center gap-2 text-xl"><Navigation className="size-5 text-gold" aria-hidden /> {cheDo === "nha" ? "Đo hướng nhà" : "Tìm hướng tốt để kê đồ"}</h2>
      {laBan && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Dùng la bàn để">
          {([["nha", "Đo hướng nhà"], ["ke_do", "Tìm hướng kê bàn, đầu giường"]] as const).map(([m, t]) => (
            <button key={m} type="button" role="radio" aria-checked={cheDo === m} data-testid={`la-ban-che-do-${m}`}
              onClick={() => { setCheDo(m); if (m === "ke_do") ghi("chart_interacted", { mo_dun: "phongthuy", kind: "la_ban_ke_do" }); }}
              className={cn("rounded-full border px-3 py-1 text-xs", cheDo === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{t}</button>
          ))}
        </div>
      )}
      <p className="mt-1 text-sm text-fg-muted">
        {cheDo === "nha"
          ? canHo
            ? <>Căn hộ: đứng ở <b className="text-fg">ban công hoặc cửa sổ lớn nhất</b>, mặt nhìn ra ngoài, giữ điện thoại nằm ngang trước ngực. Không đo được thì lấy hướng từ bản đồ bên dưới.</>
            : <>Đứng ở cửa chính, <b className="text-fg">quay lưng vào nhà</b>, giữ điện thoại nằm ngang trước ngực, mặt nhìn ra ngoài. Tránh xa xe, cột thép, loa.</>
          : <>Đứng ở chỗ định kê, giữ điện thoại nằm ngang, <b className="text-fg">xoay người</b> cho kim vào vùng xanh. Bàn làm việc, cửa chính hợp hướng <b className="text-fg">Sinh Khí</b>; đầu giường hợp <b className="text-fg">Diên Niên</b> (vợ chồng) hay <b className="text-fg">Thiên Y</b> (sức khoẻ); bàn học <b className="text-fg">Phục Vị</b>. Không lưu gì.</>}
      </p>

      {cheDo === "nha" && <CachLam viec={canHo ? "do_huong_can_ho" : "do_huong"} className="mt-2" />}

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
        <div>
          <MatLaBan doHuong={doSong} laBan={laBan} onXoay={dangDo ? undefined : (d) => { setDoSong(d); setNhap(String(d)); setLoi(null); }} />
          <p className="text-center font-serif text-2xl text-gold" aria-live="polite">{doSong == null ? "—" : `${Math.round(doSong)}°`}</p>
          {!dangDo && (
            <p className="mx-auto max-w-[14rem] text-center text-[11px] text-fg-faint" data-testid="la-ban-keo-goi-y">
              {doSong == null ? "Biết nhà quay về phía nào? " : ""}Kéo xoay mặt la bàn (hoặc bấm vào một chữ, phím ← →) cho hướng mặt nhà nằm dưới kim.
            </p>
          )}
          {laBan && (
            <p className="mt-1 text-center text-[11px] text-fg-faint">
              <span className="mr-1 inline-block size-2 rounded-sm bg-jade/40 align-middle" /> hướng tốt với mệnh {laBan.quai}
              <span className="ml-2 mr-1 inline-block size-2 rounded-sm bg-cinnabar/30 align-middle" /> hướng xấu
            </p>
          )}
        </div>
        <div className="space-y-3">
          {laBan && hSong && (
            <p className="rounded-xl border border-line/70 bg-bg/40 px-3 py-2 text-sm" data-testid="la-ban-song" aria-live="polite">
              Đang quay về <b className="text-fg">{hSong}</b>
              {dnSong && <> · <b className={cn(laBan.huongCat.includes(hSong) ? "text-jade" : "text-cinnabar")}>{dnSong}</b>
                <span className="text-fg-muted"> ({laBan.huongCat.includes(hSong) ? "hướng tốt" : "hướng xấu"} với bạn)</span></>}
              {ySong && <span className="block text-xs text-fg-muted">{ySong.y_nghia} Hợp đặt: {ySong.dung_cho}.</span>}
            </p>
          )}
          {!dangDo ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={batDau} variant="secondary"><Smartphone aria-hidden /> Đo bằng la bàn điện thoại</Button>
              {cheDo === "nha" && doSong != null && (
                <Button onClick={() => chot(doSong)} disabled={dang} data-testid="chot-la-ban-keo">
                  <Compass aria-hidden /> {dang ? "Đang đổi…" : `Chốt hướng ${Math.round(doSong)}°`}
                </Button>
              )}
            </div>
          ) : cheDo === "nha" ? (
            <Button onClick={() => doSong != null && chot(doSong)} disabled={doSong == null || dang}>
              <Compass aria-hidden /> {dang ? "Đang đổi…" : "Chốt hướng này"}
            </Button>
          ) : (
            <p className="text-xs text-fg-faint">Dừng ở hướng ghi đúng việc bạn cần (Sinh Khí · Diên Niên · Thiên Y · Phục Vị) rồi kê theo đó. Muốn lưu hướng NHÀ, chuyển lại “Đo hướng nhà”.</p>
          )}
          <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); chotNhap(); }}>
            <Input aria-label={cheDo === "nha" ? "Độ hướng nhà" : "Độ đo được"} inputMode="decimal" placeholder="hoặc nhập độ, vd 135" value={nhap} className="w-44"
              onChange={(e) => setNhap(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} />
            <Button type="submit" size="sm" variant="ghost" disabled={dang}>Xem</Button>
          </form>
          <div data-testid="huong-ban-do">
            <button type="button" aria-expanded={moBanDo} onClick={() => setMoBanDo((v) => !v)} className="inline-flex items-center gap-1 text-xs text-fg-muted underline-offset-4 hover:underline">
              <MapPin className="size-3.5" aria-hidden /> {canHo ? "Lấy hướng từ bản đồ (căn hộ)" : mayTinh ? "Dùng máy tính? Lấy hướng từ bản đồ vệ tinh" : "Không đo được ở cửa (căn hộ)? Lấy hướng từ bản đồ"}
            </button>
            {moBanDo && (
              <form className="mt-2 space-y-2 rounded-xl border border-line/70 bg-bg/30 p-3" onSubmit={(e) => { e.preventDefault(); void chotBanDo(); }}>
                <p className="text-xs text-fg-muted">{mayTinh
                  ? <>Mở Google Maps ảnh vệ tinh, <b className="text-fg">chuột phải lên giữa mái nhà</b> → bấm dòng số đầu tiên (đã chép) → bấm Dán ở ô Tâm nhà. Làm lại với <b className="text-fg">điểm ngoài đường ngay trước mặt nhà</b>.</>
                  : <>Mở bản đồ, nhấn giữ vào <b className="text-fg">tâm nhà</b> rồi vào <b className="text-fg">điểm ngay trước mặt nhà</b> (ngoài đường / dưới ban công), chép toạ độ hoặc link vào hai ô.</>}
                  {" "}Toạ độ chỉ dùng để tính góc, không lưu.</p>
                <Button type="button" size="sm" variant="secondary" onClick={moBanDoVeTinh} data-testid="mo-ban-do-ve-tinh">
                  <ExternalLink aria-hidden /> Mở Google Maps ảnh vệ tinh
                </Button>
                <CachLam viec={mayTinh ? "ban_do_may_tinh" : "ban_do"} />
                <div className="flex gap-1.5">
                  <Input aria-label="Toạ độ tâm nhà" placeholder="Tâm nhà: 10.7769, 106.7009 hoặc link bản đồ" value={tam} onChange={(e) => { setTam(e.target.value.slice(0, 300)); setSaiSo((s) => ({ ...s, tam: null })); }} />
                  <Button type="button" size="sm" variant="ghost" onClick={() => void dan("tam")} aria-label="Dán vào ô tâm nhà" title="Dán toạ độ vừa chép"><ClipboardPaste aria-hidden /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => dinhVi("tam")} disabled={dangDinhVi != null} aria-label="Lấy vị trí hiện tại làm tâm nhà" title="Đứng giữa nhà rồi bấm"><LocateFixed aria-hidden className={cn(dangDinhVi === "tam" && "animate-pulse")} /></Button>
                </div>
                <div className="flex gap-1.5">
                  <Input aria-label="Toạ độ điểm trước mặt nhà" placeholder="Điểm trước mặt nhà" value={truoc} onChange={(e) => { setTruoc(e.target.value.slice(0, 300)); setSaiSo((s) => ({ ...s, truoc: null })); }} />
                  <Button type="button" size="sm" variant="ghost" onClick={() => void dan("truoc")} aria-label="Dán vào ô điểm trước mặt nhà" title="Dán toạ độ vừa chép"><ClipboardPaste aria-hidden /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => dinhVi("truoc")} disabled={dangDinhVi != null} aria-label="Lấy vị trí hiện tại làm điểm trước mặt nhà" title="Ra trước nhà 15–20 m rồi bấm"><LocateFixed aria-hidden className={cn(dangDinhVi === "truoc" && "animate-pulse")} /></Button>
                </div>
                {doChinhXac != null && <p className="text-xs text-fg-faint" data-testid="gps-chinh-xac">Vị trí vừa lấy chính xác ±{doChinhXac} m{doChinhXac > 15 ? " — khá lệch (trong nhà GPS yếu); điểm trước nhà nên cách tâm ≥ 15 m, hoặc nhấn giữ trên bản đồ." : "."}</p>}
                <Button type="submit" size="sm" variant="secondary" disabled={dang}><MapPin aria-hidden /> Tính hướng từ hai điểm</Button>
                {kcBanDo != null && <p className="text-xs text-fg-faint">Hai điểm cách nhau {kcBanDo} m.</p>}
              </form>
            )}
          </div>
          {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
        </div>
      </div>

      {kq && (
        <div className="mt-5 space-y-3" data-testid="ket-qua-do-huong">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gold/40 bg-gold/[0.06] p-4">
              <p className="eyebrow">Hướng nhà</p>
              <p className="mt-1 font-serif text-2xl">{kq.huong} <span className="text-base text-fg-muted">· sơn {kq.son_huong} · {kq.do_huong}°</span></p>
            </div>
            <div className="rounded-xl border border-line/70 bg-bg/40 p-4">
              <p className="eyebrow">Toạ (lưng nhà)</p>
              <p className="mt-1 font-serif text-2xl">{kq.toa} <span className="text-base text-fg-muted">· sơn {kq.son_toa} · {kq.do_toa}°</span></p>
            </div>
          </div>
          <p className="text-sm">Trạch: <b className="text-gold">{kq.trach.quai}</b> ({kq.trach.nhom}).
            {kq.du_nien && kq.menh_quai && (
              <> Với mệnh {kq.menh_quai.quai} ({kq.menh_quai.nhom}), hướng {kq.huong} là{" "}
                <b className={cn(kq.du_nien.cat ? "text-jade" : "text-cinnabar")}>{kq.du_nien.du_nien}</b> ({kq.du_nien.cat ? "hướng tốt" : "hướng xấu"});
                nhà {kq.hop_nhom ? "cùng nhóm" : "khác nhóm"} với mệnh của bạn{kq.hop_nhom ? "." : " — Bát trạch gợi ý bù bằng vị trí cửa, bếp, giường theo hướng tốt của bạn."}</>
            )}
          </p>
          {kq.canh_bao_y && <p className="rounded-xl bg-cinnabar/10 px-4 py-2.5 text-sm text-cinnabar" data-testid="canh-bao-do">{kq.canh_bao_y}</p>}
          <p className="text-xs text-fg-faint">{kq.luu_y}</p>
          {onDungToa && (
            <Button size="sm" variant="secondary" onClick={() => onDungToa(kq.do_toa)}>Dùng toạ {kq.do_toa}° để lập bàn Huyền Không</Button>
          )}
        </div>
      )}
    </section>
  );
}
