"use client";
// Mặt la bàn của khối "Đo hướng nhà": vòng 24 sơn (tên do engine trả — lib/la-ban-24-son), 8 cung tô theo mệnh quái,
// vạch chuẩn cố định ở đỉnh. Chỉ VẼ: ô đang nằm dưới vạch chuẩn được tô sáng, còn hướng / sơn / toạ của KẾT QUẢ luôn lấy
// từ phản hồi engine. Có `onXoay` thì kéo xoay được (chuột, ngón tay, phím mũi tên).
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import type { MucSon24 } from "@/lib/la-ban-24-son";
import { chuanDo, doHienThi, gocLienTuc } from "@/lib/la-kinh/hop-nhat";

/** UI-PT 1 "la bàn sống": bảng 8 hướng → du niên của mệnh quái + nghĩa / "dùng cho" (engine `/menh-quai` trả, KB du_nien). */
export interface LaBanCaNhan {
  quai: string; bang: Record<string, string>; huongCat: string[];
  duNienY?: Record<string, { loai: string; y_nghia: string; dung_cho: string }>;
}
const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
/** Ô 45° đang quay về (ranh giới ±22,5° quanh chính hướng — đúng cách vẽ 8 cung của la bàn). Chỉ để tô màu + đọc nhãn
 *  theo thời gian thực; hướng NHÀ vẫn do engine đổi từ độ khi đo / chốt (sơn, toạ, trạch, cảnh báo ranh giới). */
export function oHuong(doHuong: number): string {
  return HUONG8[Math.round(chuanDo(doHuong) / 45) % 8]!;
}

const diem = (r: number, a: number) => `${(100 + r * Math.cos(a)).toFixed(2)} ${(100 + r * Math.sin(a)).toFixed(2)}`;
/** Hình quạt vành khăn từ `doTu` rộng `rong` độ (0° ở đỉnh, theo chiều kim), giữa hai bán kính. */
function quat(doTu: number, rong: number, r0: number, r1: number) {
  const a0 = ((doTu - 90) * Math.PI) / 180, a1 = ((doTu + rong - 90) * Math.PI) / 180;
  return `M ${diem(r0, a0)} L ${diem(r1, a0)} A ${r1} ${r1} 0 0 1 ${diem(r1, a1)} L ${diem(r0, a1)} A ${r0} ${r0} 0 0 0 ${diem(r0, a0)} Z`;
}
/** Ô sơn đang nằm dưới vạch chuẩn — chỉ để tô sáng ô trên hình (khoảng độ của từng ô là dữ liệu engine). */
function oDuoiVach(son24: MucSon24[] | null | undefined, d: number | null): MucSon24 | null {
  if (!son24 || d == null) return null;
  const x = chuanDo(d);
  return son24.find((s) => (s.do_tu <= s.do_den ? x >= s.do_tu && x < s.do_den : x >= s.do_tu || x < s.do_den)) ?? null;
}

const R_SON = [63, 87] as const, R_CUNG = [37, 61] as const, Y_SON = 25, Y_CHU = 51;

export function MatLaBan({ doHuong, laBan, son24, compact = false, onXoay, tienDo }: {
  doHuong: number | null; laBan?: LaBanCaNhan | null; son24?: MucSon24[] | null; compact?: boolean;
  onXoay?: (d: number) => void;
  /** 0..1 trong lúc "giữ yên" → vẽ vòng tiến độ quanh mặt la bàn. */
  tienDo?: number | null;
}) {
  const keo = useRef<{ goc0: number; d0: number; x0: number; y0: number; da: boolean } | null>(null);
  const [dangKeo, setDangKeo] = useState(false);
  const { c: t, en, quai } = useChuPT();
  const d = doHuong ?? 0;
  // Góc quay cộng dồn (không gói về 0–360) để 359° → 0° chỉ quay 1°, không quay ngược cả vòng.
  const xoay = useRef(-d);
  xoay.current = gocLienTuc(xoay.current, -d);
  const sang = oDuoiVach(son24, doHuong);
  /** Chữ ở nửa dưới MÀN HÌNH (sau khi mặt la bàn quay) thì lật thêm 180° cho khỏi lộn ngược. */
  const lat = (doChu: number, y: number) => {
    const a = chuanDo(doChu - d);
    return `rotate(${doChu} 100 100)${a > 90 && a < 270 ? ` rotate(180 100 ${y})` : ""}`;
  };
  const goc = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return (Math.atan2(e.clientX - (r.left + r.width / 2), r.top + r.height / 2 - e.clientY) * 180) / Math.PI;
  };
  const ten = (doHuong == null ? t("dh.ten_la_ban") : t("dh.ten_la_ban_do", { do: String(doHienThi(doHuong)) })) + (laBan ? t("dh.ten_la_ban_menh", { quai: quai(laBan.quai) }) : "");
  const tuongTac = onXoay ? {
    role: "slider" as const, tabIndex: 0, "aria-valuemin": 0, "aria-valuemax": 359, "aria-valuenow": doHuong == null ? undefined : doHienThi(doHuong),
    "aria-label": t("dh.keo_aria"), "aria-valuetext": doHuong == null ? t("dh.chua_chon") : t("dh.do", { do: String(doHienThi(doHuong)) }),
    "data-testid": compact ? "mini-la-ban-keo" : "la-ban-keo",
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      keo.current = { goc0: goc(e), d0: d, x0: e.clientX, y0: e.clientY, da: false };
      setDangKeo(true);
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      const k = keo.current;
      if (!k) return;
      if (!k.da && Math.hypot(e.clientX - k.x0, e.clientY - k.y0) > 4) k.da = true;
      if (k.da) onXoay(doHienThi(k.d0 - (goc(e) - k.goc0)));   // mặt la bàn đi theo tay
    },
    onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => {
      const k = keo.current;
      keo.current = null; setDangKeo(false);
      if (k && !k.da) onXoay(doHienThi(k.d0 + goc(e)));        // bấm một điểm → đưa hướng đó lên dưới vạch chuẩn
    },
    onPointerCancel: () => { keo.current = null; setDangKeo(false); },
    onKeyDown: (e: React.KeyboardEvent<SVGSVGElement>) => {
      const buoc = e.shiftKey ? 15 : 1;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onXoay(doHienThi(d + buoc)); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onXoay(doHienThi(d - buoc)); }
    },
  } : { role: "img" as const, "aria-label": ten, "data-testid": compact ? "mini-la-ban" : "la-ban-mat" };
  const chuVi = 2 * Math.PI * 98;
  return (
    <svg viewBox="0 0 200 200"
      className={cn("mx-auto block h-auto w-full", compact ? "max-w-[11rem]" : "max-w-[17rem] sm:w-[17rem]",
        onXoay && "cursor-grab touch-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold", dangKeo && "cursor-grabbing")}
      {...tuongTac}>
      <circle cx="100" cy="100" r="96" fill="rgb(var(--surface))" stroke="rgb(var(--line))" />
      <g style={{ transform: `rotate(${xoay.current}deg)`, transformOrigin: "100px 100px", transition: dangKeo ? "none" : "transform 0.15s linear" }}
        className="motion-reduce:!transition-none">
        {Array.from({ length: 72 }, (_, i) => (
          <line key={i} x1="100" y1="5" x2="100" y2={i % 9 === 0 ? 12 : i % 3 === 0 ? 10.5 : 8}
            stroke={i % 9 === 0 ? "rgb(var(--fg-muted))" : "rgb(var(--fg-faint))"} strokeWidth={i % 9 === 0 ? 1.4 : i % 3 === 0 ? 0.8 : 0.4}
            transform={`rotate(${i * 5} 100 100)`} />
        ))}
        {son24?.map((s) => {
          const la = sang?.son === s.son;
          return (
            <g key={s.son}>
              <path d={quat(s.do_tu, chuanDo(s.do_den - s.do_tu) || 15, R_SON[0], R_SON[1])}
                fill={la ? "rgb(var(--gold) / 0.26)" : "none"} stroke={la ? "rgb(var(--gold) / 0.85)" : "rgb(var(--line) / 0.5)"} strokeWidth={la ? 0.9 : 0.4} />
              <text x="100" y={Y_SON} textAnchor="middle" dominantBaseline="central" fontSize={en ? 9 : 7.4} fontWeight={la ? 700 : 500}
                fill={la ? "rgb(var(--gold))" : "rgb(var(--fg-muted))"} transform={lat(s.do_tam, Y_SON)}>
                {en ? s.ky_hieu_han : s.son}
              </text>
            </g>
          );
        })}
        {laBan && HUONG8.map((h, i) => (
          <path key={h} d={quat(i * 45 - 22.5, 45, R_CUNG[0], R_CUNG[1])} data-testid="la-ban-cung" data-cat={laBan.huongCat.includes(h)}
            fill={laBan.huongCat.includes(h) ? "rgb(var(--jade) / 0.24)" : "rgb(var(--fg-faint) / 0.07)"} stroke="rgb(var(--line) / 0.55)" strokeWidth="0.5" />
        ))}
        {(["b", "d", "n", "t"] as const).map((k, i) => (
          <text key={k} x="100" y={Y_CHU} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700"
            fill={k === "b" ? "rgb(var(--gold))" : "rgb(var(--fg-muted))"} transform={lat(i * 90, Y_CHU)}>{t(`dh.chu_${k}`)}</text>
        ))}
      </g>
      {/* vạch chuẩn: hướng nằm dưới vạch này là hướng đang đọc */}
      <path d="M100 15 L95.5 3 L104.5 3 Z" fill="rgb(var(--gold))" pointerEvents="none" />
      <line x1="100" y1="100" x2="100" y2="40" stroke="rgb(var(--gold) / 0.7)" strokeWidth="1.2" strokeLinecap="round" pointerEvents="none" />
      <circle cx="100" cy="100" r="4" fill="rgb(var(--gold))" pointerEvents="none" />
      {tienDo != null && (
        <circle cx="100" cy="100" r="98" fill="none" stroke="rgb(var(--gold))" strokeWidth="2.5" strokeLinecap="round" pointerEvents="none"
          strokeDasharray={chuVi} strokeDashoffset={chuVi * (1 - Math.min(1, Math.max(0, tienDo)))} transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 0.13s linear" }} className="motion-reduce:!transition-none" data-testid="la-ban-vong-do" />
      )}
    </svg>
  );
}
