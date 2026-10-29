"use client";
// DH-PC2 — chọn hướng nhà trên ẢNH VỆ TINH ngay trong trang (Google Maps JavaScript API, chủ dự án duyệt 2026-10-27):
// bấm lên mái nhà (điểm 1) → bấm mặt đường ngay trước cửa (điểm 2) → engine đổi hai điểm ra hướng, sơn, trạch như đo la bàn.
// Bản đồ chạy trong khung riêng `/khung/ve-tinh` (CSP riêng — Maps cần 'unsafe-eval', site giữ CSP chặt), chỉ tải khi
// người dùng bấm mở. Khung gửi toạ độ hai điểm qua postMessage; web KHÔNG tự tính góc mà gọi /api/phongthuy/huong-ban-do.
// Toạ độ không lưu. Thiếu khoá NEXT_PUBLIC_GOOGLE_MAPS_KEY → ẩn hẳn, cách dán toạ độ vẫn còn.
import { useEffect, useRef, useState } from "react";
import { Crosshair, LocateFixed, MapPinned, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/goi-api";
import { ghi } from "@/lib/do-luong";
import type { KetQuaDoHuong } from "@/components/huyen-hoc/DoHuongDienThoai";

export const coBanDoVeTinh = () => (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "").trim() !== "";

type Diem = [number, number];
type TinKhung = { nguon: "hbt-ve-tinh"; su_kien: "san" | "loi" | "diem" | "tim" | "vi_tri"; ma?: string; ok?: boolean; buoc?: number; tam?: Diem; truoc?: Diem };
type KetQua = KetQuaDoHuong & { khoang_cach_m: number };

const laDiem = (x: unknown): x is Diem => Array.isArray(x) && x.length === 2 && x.every((v) => typeof v === "number" && Number.isFinite(v))
  && Math.abs(x[0] as number) <= 90 && Math.abs(x[1] as number) <= 180;

export function ChonTrenVeTinh({ sinh, onDung }: {
  sinh: Record<string, unknown> | null;
  /** Người dùng bấm "Dùng hướng này": kết quả engine + hai điểm (để điền lại hai ô toạ độ). */
  onDung: (kq: KetQua, tam: Diem, truoc: Diem) => void;
}) {
  const [mo, setMo] = useState(false);
  const [san, setSan] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [buoc, setBuoc] = useState(0);
  const [hai, setHai] = useState<{ tam: Diem; truoc: Diem } | null>(null);
  const [xem, setXem] = useState<KetQua | null>(null);
  const [dangTinh, setDangTinh] = useState(false);
  const [timKiem, setTimKiem] = useState("");
  const khung = useRef<HTMLIFrameElement>(null);
  const luot = useRef(0);
  const sinhRef = useRef(sinh);
  useEffect(() => { sinhRef.current = sinh; }, [sinh]);

  const lenh = (o: Record<string, unknown>) => khung.current?.contentWindow?.postMessage(o, window.location.origin);

  useEffect(() => {
    if (!mo) return;
    const tinh = async (tam: Diem, truoc: Diem) => {
      const toi = ++luot.current;
      setDangTinh(true); setLoi(null);
      try {
        const kq = await postJson<KetQua>("/api/phongthuy/huong-ban-do", { tam, truoc, ...(sinhRef.current ? { sinh: sinhRef.current } : {}) });
        if (toi === luot.current) setXem(kq);
      } catch (e) {
        if (toi === luot.current) { setXem(null); setLoi(e instanceof Error ? e.message : "Chưa tính được từ hai điểm này."); }
      } finally { if (toi === luot.current) setDangTinh(false); }
    };
    const nghe = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== khung.current?.contentWindow) return;
      const d = e.data as TinKhung;
      if (d?.nguon !== "hbt-ve-tinh") return;
      if (d.su_kien === "san") { setSan(true); setLoi(null); }
      else if (d.su_kien === "loi") {
        setLoi(d.ma === "khoa"
          ? "Bản đồ vệ tinh đang tạm dừng. Bạn vẫn lấy được hướng bằng cách dán toạ độ ở bên dưới."
          : "Chưa tải được bản đồ vệ tinh (mạng chậm hoặc bị chặn). Thử lại sau, hoặc dán toạ độ ở bên dưới.");
      } else if (d.su_kien === "tim") {
        setLoi(d.ok ? null : "Không tìm thấy địa chỉ này — thử tên đường + phường / quận, hoặc kéo bản đồ tới nhà bạn.");
      } else if (d.su_kien === "vi_tri" && !d.ok) {
        setLoi("Chưa lấy được vị trí máy — gõ địa chỉ vào ô tìm, hoặc kéo bản đồ tới nhà bạn.");
      } else if (d.su_kien === "diem") {
        const b = Math.min(2, Math.max(0, Number(d.buoc) || 0));
        setBuoc(b);
        if (b === 2 && laDiem(d.tam) && laDiem(d.truoc)) {
          setHai({ tam: d.tam, truoc: d.truoc });
          void tinh(d.tam, d.truoc);
        } else { luot.current++; setHai(null); setXem(null); setDangTinh(false); }
      }
    };
    window.addEventListener("message", nghe);
    return () => window.removeEventListener("message", nghe);
  }, [mo]);

  if (!coBanDoVeTinh()) return null;

  if (!mo) {
    return (
      <Button type="button" onClick={() => { setMo(true); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "ve_tinh_mo" }); }} data-testid="ve-tinh-mo">
        <MapPinned aria-hidden /> Chọn trên ảnh vệ tinh
      </Button>
    );
  }

  const huongDan = !san ? <>Đang mở bản đồ vệ tinh…</>
    : buoc === 0 ? <>Tìm tới nhà bạn rồi <b className="text-fg">bấm vào giữa mái nhà</b> (điểm 1).</>
      : buoc === 1 ? <>Giờ <b className="text-fg">bấm vào mặt đường ngay trước cửa nhà</b> (điểm 2) — chỗ đứng nhìn thẳng vào cửa chính.</>
        : <>Kéo điểm 1 hoặc 2 để chỉnh. Mũi tên chỉ hướng mặt nhà nhìn ra.</>;

  return (
    <div className="space-y-2 rounded-xl border border-gold/40 bg-bg/40 p-3" data-testid="ve-tinh">
      <form className="flex gap-1.5" onSubmit={(e) => {
        e.preventDefault();
        if (!timKiem.trim()) return;
        lenh({ lenh: "tim", q: timKiem.trim() });
        ghi("chart_interacted", { mo_dun: "phongthuy", kind: "ve_tinh_tim" });
      }}>
        <Input aria-label="Tìm địa chỉ trên bản đồ" placeholder="Gõ địa chỉ, tên đường…" value={timKiem} onChange={(e) => setTimKiem(e.target.value.slice(0, 200))} disabled={!san} />
        <Button type="submit" size="sm" variant="secondary" disabled={!san} aria-label="Tìm"><Search aria-hidden /></Button>
        <Button type="button" size="sm" variant="ghost" disabled={!san} onClick={() => lenh({ lenh: "vi_tri" })} aria-label="Về vị trí của tôi" title="Về vị trí của tôi"><LocateFixed aria-hidden /></Button>
      </form>
      <p className="flex items-start gap-1.5 text-sm text-fg-muted" aria-live="polite" data-testid="ve-tinh-huong-dan">
        <Crosshair className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden /> <span>{huongDan}</span>
      </p>
      <iframe ref={khung} src="/khung/ve-tinh" title="Bản đồ vệ tinh — bấm vào mái nhà rồi mặt đường trước cửa" allow="geolocation; fullscreen"
        className="h-[min(60vh,420px)] w-full rounded-lg border-0 bg-surface" data-testid="ve-tinh-khung" />
      {(xem || dangTinh) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line/70 bg-bg/60 px-3 py-2" data-testid="ve-tinh-ket-qua" aria-live="polite">
          {xem ? (
            <p className="text-sm">Mặt nhà nhìn về <b className="text-gold">{xem.huong}</b> · {Math.round(xem.do_huong)}°
              <span className="text-fg-faint"> · hai điểm cách {Math.round(xem.khoang_cach_m)} m{xem.khoang_cach_m < 5 ? " — hơi gần, chấm điểm 2 xa hơn cho chắc" : ""}</span></p>
          ) : <p className="text-sm text-fg-muted">Đang tính…</p>}
          {xem && hai && (
            <Button type="button" size="sm" disabled={dangTinh} data-testid="ve-tinh-dung" onClick={() => {
              ghi("chart_interacted", { mo_dun: "phongthuy", kind: "ve_tinh_dung" });
              onDung(xem, hai.tam, hai.truoc);
            }}>Dùng hướng này</Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {buoc > 0 ? <Button type="button" size="sm" variant="ghost" onClick={() => lenh({ lenh: "lam_lai" })}><RotateCcw aria-hidden /> Chấm lại</Button> : <span />}
        <p className="text-[11px] text-fg-faint">Ảnh vệ tinh của Google Maps. Toạ độ chỉ dùng để tính góc, không lưu.</p>
      </div>
      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
    </div>
  );
}
