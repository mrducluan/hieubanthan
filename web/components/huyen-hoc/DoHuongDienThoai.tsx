"use client";
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, MapPin, Navigation, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha } from "@/lib/ho-so-nha";
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

function MatLaBan({ doHuong, laBan }: { doHuong: number | null; laBan?: LaBanCaNhan | null }) {
  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-48 w-48" role="img"
      aria-label={(doHuong == null ? "La bàn" : `La bàn: ${Math.round(doHuong)} độ`) + (laBan ? ` — tô hướng tốt của mệnh ${laBan.quai}` : "")}>
      <circle cx="100" cy="100" r="94" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
      <g style={{ transform: `rotate(${-(doHuong ?? 0)}deg)`, transformOrigin: "100px 100px", transition: "transform 0.15s linear" }}>
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
  const chotBanDo = async () => {
    const a = docToaDo(tam), b = docToaDo(truoc);
    if (!a || !b) { setLoi("Dán toạ độ dạng \"10.776, 106.700\" hoặc link bản đồ có toạ độ cho cả hai điểm."); return; }
    setDang(true); setLoi(null);
    try {
      const r = await postJson<KetQuaDoHuong & { khoang_cach_m: number }>("/api/phongthuy/huong-ban-do", { tam: a, truoc: b, ...(sinh ? { sinh } : {}) });
      setKq(r); setKcBanDo(r.khoang_cach_m); setDoSong(r.do_huong);
      onChot?.(r);
      try { luuHoSoNha({ huong_do: r.do_huong, huong: undefined }); } catch { /* bỏ qua */ }
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
      try { luuHoSoNha({ huong_do: r.do_huong, huong: undefined }); } catch { /* bỏ qua */ }   // KC-2: hồ sơ nhà trên máy
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
          ? <>Đứng ở cửa chính, <b className="text-fg">quay lưng vào nhà</b>, giữ điện thoại nằm ngang trước ngực, mặt nhìn ra ngoài. Tránh xa xe, cột thép, loa.</>
          : <>Đứng ở chỗ định kê, giữ điện thoại nằm ngang, <b className="text-fg">xoay người</b> cho kim vào vùng xanh. Bàn làm việc, cửa chính hợp hướng <b className="text-fg">Sinh Khí</b>; đầu giường hợp <b className="text-fg">Diên Niên</b> (vợ chồng) hay <b className="text-fg">Thiên Y</b> (sức khoẻ); bàn học <b className="text-fg">Phục Vị</b>. Không lưu gì.</>}
      </p>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
        <div>
          <MatLaBan doHuong={doSong} laBan={laBan} />
          <p className="text-center font-serif text-2xl text-gold" aria-live="polite">{doSong == null ? "—" : `${Math.round(doSong)}°`}</p>
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
            <Button onClick={batDau} variant="secondary"><Smartphone aria-hidden /> Đo bằng la bàn điện thoại</Button>
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
              <MapPin className="size-3.5" aria-hidden /> Không đo được ở cửa (căn hộ)? Lấy hướng từ bản đồ
            </button>
            {moBanDo && (
              <form className="mt-2 space-y-2 rounded-xl border border-line/70 bg-bg/30 p-3" onSubmit={(e) => { e.preventDefault(); void chotBanDo(); }}>
                <p className="text-xs text-fg-muted">Mở bản đồ, nhấn giữ vào <b className="text-fg">tâm nhà</b> rồi vào <b className="text-fg">điểm ngay trước mặt nhà</b> (ngoài đường / dưới ban công), chép toạ độ hoặc link vào hai ô. Toạ độ chỉ dùng để tính góc, không lưu.</p>
                <Input aria-label="Toạ độ tâm nhà" placeholder="Tâm nhà: 10.7769, 106.7009 hoặc link bản đồ" value={tam} onChange={(e) => setTam(e.target.value.slice(0, 300))} />
                <Input aria-label="Toạ độ điểm trước mặt nhà" placeholder="Điểm trước mặt nhà" value={truoc} onChange={(e) => setTruoc(e.target.value.slice(0, 300))} />
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
