"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, Navigation, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/goi-api";
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
type CoXinQuyen = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/** Độ hướng từ sự kiện cảm biến: iOS cho sẵn webkitCompassHeading; Android cho alpha tuyệt đối (ngược chiều kim). */
function doTuSuKien(e: SuKienLaBan, tuyetDoi: boolean): number | null {
  if (typeof e.webkitCompassHeading === "number") return e.webkitCompassHeading;
  if ((tuyetDoi || e.absolute) && typeof e.alpha === "number") return (360 - e.alpha) % 360;
  return null;
}

function MatLaBan({ doHuong }: { doHuong: number | null }) {
  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-48 w-48" role="img" aria-label={doHuong == null ? "La bàn" : `La bàn: ${Math.round(doHuong)} độ`}>
      <circle cx="100" cy="100" r="94" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
      <g style={{ transform: `rotate(${-(doHuong ?? 0)}deg)`, transformOrigin: "100px 100px", transition: "transform 0.15s linear" }}>
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

export function DoHuongDienThoai({ sinh, onDungToa, onChot }: {
  sinh: { birth_date: string; gender: "nam" | "nu" } | null;
  onDungToa?: (doToa: number) => void;
  /** PT-V0: báo kết quả engine vừa đổi (độ hướng nhà) cho khung Khảo sát nhà. */
  onChot?: (kq: KetQuaDoHuong) => void;
}) {
  const [doSong, setDoSong] = useState<number | null>(null);
  const [dangDo, setDangDo] = useState(false);
  const [nhap, setNhap] = useState("");
  const [kq, setKq] = useState<KetQuaDoHuong | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const huy = useRef<(() => void) | null>(null);

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
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: dangDo ? "la_ban_dien_thoai" : "nhap_do_huong" });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đổi được độ này."); }
    finally { setDang(false); }
  };

  const chotNhap = () => {
    const d = Number(nhap.replace(",", "."));
    if (!(nhap.trim() !== "" && d >= 0 && d < 360)) { setLoi("Độ cần là số từ 0 đến dưới 360 (0 = chính Bắc)."); return; }
    void chot(d);
  };

  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="do-huong" data-testid="do-huong">
      <h2 id="do-huong" className="flex items-center gap-2 text-xl"><Navigation className="size-5 text-gold" aria-hidden /> Đo hướng nhà</h2>
      <p className="mt-1 text-sm text-fg-muted">
        Đứng ở cửa chính, <b className="text-fg">quay lưng vào nhà</b>, giữ điện thoại nằm ngang trước ngực, mặt nhìn ra ngoài. Tránh xa xe, cột thép, loa.
      </p>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
        <div>
          <MatLaBan doHuong={doSong} />
          <p className="text-center font-serif text-2xl text-gold" aria-live="polite">{doSong == null ? "—" : `${Math.round(doSong)}°`}</p>
        </div>
        <div className="space-y-3">
          {!dangDo ? (
            <Button onClick={batDau} variant="secondary"><Smartphone aria-hidden /> Đo bằng la bàn điện thoại</Button>
          ) : (
            <Button onClick={() => doSong != null && chot(doSong)} disabled={doSong == null || dang}>
              <Compass aria-hidden /> {dang ? "Đang đổi…" : "Chốt hướng này"}
            </Button>
          )}
          <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); chotNhap(); }}>
            <Input aria-label="Độ hướng nhà" inputMode="decimal" placeholder="hoặc nhập độ, vd 135" value={nhap} className="w-44"
              onChange={(e) => setNhap(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} />
            <Button type="submit" size="sm" variant="ghost" disabled={dang}>Xem</Button>
          </form>
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
