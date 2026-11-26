"use client";
// LX-2027 — Pháo hoa canvas phủ cả màn hình, nổ phía trên phần tử `neo` (bao lì xì). Lõi ở lib/phao-hoa.ts (dùng chung với video Story).
// Chạm trang để bắn thêm; tự dừng khi hết hạt; giảm chuyển động → nơi gọi không render component này.
import { useEffect, useRef, type RefObject } from "react";
import { taoPhaoHoa, type DieuKhienPhaoHoa } from "@/lib/phao-hoa";
import { amChoTrang, amDangTat } from "@/lib/phao-hoa-am";

interface Props {
  /** Đổi giá trị (≥ 1) để bắn một màn pháo hoa mới. */
  kich: number;
  /** Phần tử để pháo nổ phía trên (thường là bao lì xì). */
  neo: RefObject<HTMLElement | null>;
  /** Bảng màu theo thiệp (hex). */
  bangMau: string[];
  /** Chữ xếp bằng hạt ở màn kết (do hệ thống đặt, tối đa 2). */
  chu?: string[];
  /** Chạm trang để bắn thêm (mặc định bật). */
  chamDeBan?: boolean;
  /** Phát tiếng pháo + nhạc Năm mới (người dùng đã bấm; tắt được, nhớ trên máy). */
  tiengDong?: boolean;
}

export function PhaoHoaCanvas({ kich, neo, bangMau, chu, chamDeBan = true, tiengDong = true }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const heRef = useRef<DieuKhienPhaoHoa | null>(null);
  const chuKhoa = (chu ?? []).join("|");
  const mauKhoa = bangMau.join("|");

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const he = taoPhaoHoa({
      am: tiengDong && !amDangTat() ? amChoTrang() : null,
      canvas: cv, rong: window.innerWidth, cao: window.innerHeight, bangMau: mauKhoa.split("|"), chu: chuKhoa ? chuKhoa.split("|") : [],
      vung: () => {
        const r = neo.current?.getBoundingClientRect();
        const rong = window.innerWidth, cao = window.innerHeight;
        // Pháo nổ phía trên bao; nếu bao sát mép trên (hoặc đã cuộn khỏi màn hình) thì dùng vùng trên của khung nhìn để chữ không bị cắt.
        const day = Math.min(Math.max((r ? r.top : cao * 0.6) + 30, 330), cao * 0.74);
        const tam = r ? Math.min(Math.max(r.left + r.width / 2, rong * 0.3), rong * 0.7) : rong / 2;
        return { tam, rong: Math.min(Math.max(r?.width ?? 0, 380), rong * 0.9), day, dinh: Math.max(day - 330, 96) };
      },
    });
    heRef.current = he;
    const doCo = () => he.doiCo(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", doCo);
    return () => { window.removeEventListener("resize", doCo); he.dung(); heRef.current = null; };
  }, [neo, mauKhoa, chuKhoa, tiengDong]);

  useEffect(() => {
    if (kich <= 0) return;
    heRef.current?.banMan();
    // nhạc Năm mới chỉ chơi ở màn đầu (lần bấm đầu); bắn lại thì chỉ có tiếng pháo
    if (kich === 1 && tiengDong && !amDangTat()) { try { amChoTrang()?.nhac(undefined, 0.46); } catch { /* bỏ qua */ } }
  }, [kich, tiengDong]);

  useEffect(() => {
    if (!chamDeBan || kich < 1) return;
    const khiCham = (e: PointerEvent) => {
      const dich = e.target as HTMLElement | null;
      if (dich?.closest("button, a, input, textarea, select, label, [role=button]")) return;
      heRef.current?.banTai(e.clientX, e.clientY);
    };
    window.addEventListener("pointerdown", khiCham);
    return () => window.removeEventListener("pointerdown", khiCham);
  }, [chamDeBan, kich]);

  return <canvas ref={cvRef} className="pointer-events-none fixed inset-0 z-[60] h-screen w-screen" aria-hidden data-testid="lx-phao-canvas" />;
}
