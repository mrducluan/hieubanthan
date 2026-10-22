"use client";
// SEO-L5 — công cụ đổi ngày âm ↔ dương. Engine đổi (POST /api/lich/doi), web chỉ hiển thị; không lưu gì.
import { useState } from "react";
import Link from "next/link";

interface KetQua {
  duong: { ngay: number; thang: number; nam: number }; am_viet: { ngay: number; thang: number; nam: number; nhuan: boolean };
  am_trung_quoc: { ngay: number; thang: number; nam: number; nhuan: boolean }; lech_lich_trung: boolean;
  can_chi_nam: string; can_chi_thang: string; can_chi_ngay: string; thang_nhuan_nam: number | null; so_ngay_thang: number;
}

const hai = (n: number) => String(n).padStart(2, "0");

export function DoiLich({ homNay }: { homNay: string }) {
  const [chieu, setChieu] = useState<"duong_sang_am" | "am_sang_duong">("duong_sang_am");
  const [y, m, d] = homNay.split("-").map(Number) as [number, number, number];
  const [ngay, setNgay] = useState(d), [thang, setThang] = useState(m), [nam, setNam] = useState(y), [nhuan, setNhuan] = useState(false);
  const [kq, setKq] = useState<KetQua | null>(null), [loi, setLoi] = useState<string | null>(null), [dang, setDang] = useState(false);

  async function doi(e: React.FormEvent) {
    e.preventDefault();
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/lich/doi", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ chieu, ngay, thang, nam, ...(chieu === "am_sang_duong" ? { nhuan } : {}) }) });
      const j = await r.json();
      if (!r.ok) { setKq(null); setLoi(typeof j?.detail === "string" ? j.detail : "Ngày không hợp lệ."); }
      else setKq(j as KetQua);
    } catch { setLoi("Chưa đổi được, bạn thử lại sau ít phút."); }
    setDang(false);
  }

  const o = "w-full rounded-xl border border-line bg-surface/60 px-3 py-2 text-fg";
  return (
    <div className="glass rounded-2xl p-5" data-testid="doi-lich">
      <form onSubmit={doi} className="space-y-4">
        <fieldset className="flex flex-wrap gap-2" aria-label="Chiều đổi">
          {([["duong_sang_am", "Dương lịch → Âm lịch"], ["am_sang_duong", "Âm lịch → Dương lịch"]] as const).map(([v, t]) => (
            <label key={v} className={`cursor-pointer rounded-full border px-3.5 py-2 text-sm ${chieu === v ? "border-gold text-gold" : "border-line text-fg-muted"}`}>
              <input type="radio" name="chieu" value={v} checked={chieu === v} onChange={() => { setChieu(v); setKq(null); }} className="sr-only" />{t}
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm text-fg-muted">Ngày<input name="ngay" type="number" inputMode="numeric" min={1} max={31} required value={ngay} onChange={(e) => setNgay(Number(e.target.value))} className={o} /></label>
          <label className="text-sm text-fg-muted">Tháng<input name="thang" type="number" inputMode="numeric" min={1} max={12} required value={thang} onChange={(e) => setThang(Number(e.target.value))} className={o} /></label>
          <label className="text-sm text-fg-muted">Năm<input name="nam" type="number" inputMode="numeric" min={1901} max={2098} required value={nam} onChange={(e) => setNam(Number(e.target.value))} className={o} /></label>
        </div>
        {chieu === "am_sang_duong" && (
          <label className="flex items-center gap-2 text-sm text-fg-muted"><input type="checkbox" checked={nhuan} onChange={(e) => setNhuan(e.target.checked)} /> Tháng nhuận</label>
        )}
        <button type="submit" disabled={dang} className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg disabled:opacity-60">{dang ? "Đang đổi…" : "Đổi ngày"}</button>
      </form>
      {loi && <p role="alert" className="mt-4 text-sm text-cinnabar">{loi}</p>}
      {kq && (
        <div className="mt-5 space-y-1.5 border-t border-line/60 pt-4 text-sm" aria-live="polite" data-testid="ket-qua-doi-lich">
          <p className="text-lg text-fg">Dương lịch <b>{hai(kq.duong.ngay)}/{hai(kq.duong.thang)}/{kq.duong.nam}</b> = âm lịch{" "}
            <b>{kq.am_viet.ngay}/{kq.am_viet.thang}{kq.am_viet.nhuan ? " (nhuận)" : ""}/{kq.am_viet.nam}</b></p>
          <p className="text-fg-muted">Ngày {kq.can_chi_ngay} · tháng {kq.can_chi_thang} · năm {kq.can_chi_nam}. Tháng âm này có {kq.so_ngay_thang} ngày
            {kq.thang_nhuan_nam ? `; năm ${kq.am_viet.nam} nhuận tháng ${kq.thang_nhuan_nam}` : ""}.</p>
          {kq.lech_lich_trung && <p className="text-fg-muted">Lịch Trung Quốc ghi ngày này là {kq.am_trung_quoc.ngay}/{kq.am_trung_quoc.thang}{kq.am_trung_quoc.nhuan ? " (nhuận)" : ""}/{kq.am_trung_quoc.nam} — hai lịch lệch vì tính theo múi giờ khác nhau.</p>}
          <p className="flex flex-wrap gap-3 pt-1">
            <Link href={`/xem-ngay-tot/${kq.duong.nam}-${hai(kq.duong.thang)}-${hai(kq.duong.ngay)}`} className="text-gold underline">Ngày này tốt hay xấu?</Link>
            <Link href={`/lich-am/${kq.am_viet.nam}`} className="text-gold underline">Lịch âm cả năm {kq.am_viet.nam}</Link>
          </p>
        </div>
      )}
    </div>
  );
}
