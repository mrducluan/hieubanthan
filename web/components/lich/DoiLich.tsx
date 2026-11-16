"use client";
// SEO-L5 — công cụ đổi ngày âm ↔ dương. Engine đổi (POST /api/lich/doi), web chỉ hiển thị; không lưu gì.
import { useState } from "react";
import { kemNgonNgu } from "@/lib/sao-client";
import Link from "@/components/khung/Lien";
import { useChuLich } from "@/components/hoang-lich/chu-lich";
import { dinhNgay } from "@/lib/dinh-dang";
import { duongNgay } from "@/lib/hoang-lich";
import { duongLichAm } from "@/lib/lich-am";

interface KetQua {
  duong: { ngay: number; thang: number; nam: number }; am_viet: { ngay: number; thang: number; nam: number; nhuan: boolean };
  am_trung_quoc: { ngay: number; thang: number; nam: number; nhuan: boolean }; lech_lich_trung: boolean;
  can_chi_nam: string; can_chi_thang: string; can_chi_ngay: string; thang_nhuan_nam: number | null; so_ngay_thang: number;
}

const hai = (n: number) => String(n).padStart(2, "0");

export function DoiLich({ homNay }: { homNay: string }) {
  const { c, en, ma } = useChuLich();
  const [chieu, setChieu] = useState<"duong_sang_am" | "am_sang_duong">("duong_sang_am");
  const [y, m, d] = homNay.split("-").map(Number) as [number, number, number];
  const [ngay, setNgay] = useState(d), [thang, setThang] = useState(m), [nam, setNam] = useState(y), [nhuan, setNhuan] = useState(false);
  const [kq, setKq] = useState<KetQua | null>(null), [loi, setLoi] = useState<string | null>(null), [dang, setDang] = useState(false);

  async function doi(e: React.FormEvent) {
    e.preventDefault();
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/lich/doi", kemNgonNgu("/api/lich/doi", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ chieu, ngay, thang, nam, ...(chieu === "am_sang_duong" ? { nhuan } : {}) }) }));
      const j = await r.json();
      if (!r.ok) { setKq(null); setLoi(typeof j?.detail === "string" && !en ? j.detail : c("doi.loi")); }
      else setKq(j as KetQua);
    } catch { setLoi(c("doi.loi_mang")); }
    setDang(false);
  }

  const o = "w-full rounded-xl border border-line bg-surface/60 px-3 py-2 text-fg";
  return (
    <div className="glass rounded-2xl p-5" data-testid="doi-lich">
      <form onSubmit={doi} className="space-y-4">
        <fieldset className="flex flex-wrap gap-2" aria-label={c("doi.chieu")}>
          {([["duong_sang_am", c("doi.duong_am")], ["am_sang_duong", c("doi.am_duong")]] as const).map(([v, t]) => (
            <label key={v} className={`cursor-pointer rounded-full border px-3.5 py-2 text-sm ${chieu === v ? "border-gold text-gold" : "border-line text-fg-muted"}`}>
              <input type="radio" name="chieu" value={v} checked={chieu === v} onChange={() => { setChieu(v); setKq(null); }} className="sr-only" />{t}
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm text-fg-muted">{c("doi.ngay")}<input name="ngay" type="number" inputMode="numeric" min={1} max={31} required value={ngay} onChange={(e) => setNgay(Number(e.target.value))} className={o} /></label>
          <label className="text-sm text-fg-muted">{c("doi.thang")}<input name="thang" type="number" inputMode="numeric" min={1} max={12} required value={thang} onChange={(e) => setThang(Number(e.target.value))} className={o} /></label>
          <label className="text-sm text-fg-muted">{c("doi.nam")}<input name="nam" type="number" inputMode="numeric" min={1901} max={2098} required value={nam} onChange={(e) => setNam(Number(e.target.value))} className={o} /></label>
        </div>
        {chieu === "am_sang_duong" && (
          <label className="flex items-center gap-2 text-sm text-fg-muted"><input type="checkbox" checked={nhuan} onChange={(e) => setNhuan(e.target.checked)} />{` ${c("doi.nhuan")}`}</label>
        )}
        <button type="submit" disabled={dang} className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg disabled:opacity-60">{dang ? c("doi.dang") : c("doi.nut")}</button>
      </form>
      {loi && <p role="alert" className="mt-4 text-sm text-cinnabar">{loi}</p>}
      {kq && (
        <div className="mt-5 space-y-1.5 border-t border-line/60 pt-4 text-sm" aria-live="polite" data-testid="ket-qua-doi-lich">
          {en ? <>
          <p className="text-lg text-fg">{c("doi.kq", { duong: dinhNgay({ nam: kq.duong.nam, thang: kq.duong.thang, ngay: kq.duong.ngay }, ma, "dai"),
            am: `${kq.am_viet.ngay}/${kq.am_viet.thang}${kq.am_viet.nhuan ? c("doi.kq_nhuan") : ""}/${kq.am_viet.nam}` })}</p>
          <p className="text-fg-muted">{c("doi.can_chi", { ngay: kq.can_chi_ngay, thang: kq.can_chi_thang, nam: kq.can_chi_nam, so: String(kq.so_ngay_thang),
            nhuan: kq.thang_nhuan_nam ? c("doi.nam_nhuan", { nam: String(kq.am_viet.nam), thang: String(kq.thang_nhuan_nam) }) : "" })}</p>
          {kq.lech_lich_trung && <p className="text-fg-muted">{c("doi.lech", { am: `${kq.am_trung_quoc.ngay}/${kq.am_trung_quoc.thang}${kq.am_trung_quoc.nhuan ? c("doi.kq_nhuan") : ""}/${kq.am_trung_quoc.nam}` })}</p>}
          <p className="flex flex-wrap gap-3 pt-1">
            {kq.duong.nam >= 1901 && kq.duong.nam <= 2099 &&
              <Link href={duongNgay(`${kq.duong.nam}-${hai(kq.duong.thang)}-${hai(kq.duong.ngay)}`, true)} className="text-gold underline">{c("doi.ngay_tot")}</Link>}
            {kq.am_viet.nam >= 1901 && kq.am_viet.nam <= 2098 &&
              <Link href={duongLichAm(kq.am_viet.nam, true)} className="text-gold underline">{c("doi.ca_nam", { nam: String(kq.am_viet.nam) })}</Link>}
          </p>
          </> : <>
          <p className="text-lg text-fg">Dương lịch <b>{hai(kq.duong.ngay)}/{hai(kq.duong.thang)}/{kq.duong.nam}</b> = âm lịch{" "}
            <b>{kq.am_viet.ngay}/{kq.am_viet.thang}{kq.am_viet.nhuan ? " (nhuận)" : ""}/{kq.am_viet.nam}</b></p>
          <p className="text-fg-muted">Ngày {kq.can_chi_ngay} · tháng {kq.can_chi_thang} · năm {kq.can_chi_nam}. Tháng âm này có {kq.so_ngay_thang} ngày
            {kq.thang_nhuan_nam ? `; năm ${kq.am_viet.nam} nhuận tháng ${kq.thang_nhuan_nam}` : ""}.</p>
          {kq.lech_lich_trung && <p className="text-fg-muted">Lịch Trung Quốc ghi ngày này là {kq.am_trung_quoc.ngay}/{kq.am_trung_quoc.thang}{kq.am_trung_quoc.nhuan ? " (nhuận)" : ""}/{kq.am_trung_quoc.nam} — hai lịch lệch vì tính theo múi giờ khác nhau.</p>}
          <p className="flex flex-wrap gap-3 pt-1">
            {kq.duong.nam >= 1901 && kq.duong.nam <= 2099 &&
              <Link href={`/xem-ngay-tot/${kq.duong.nam}-${hai(kq.duong.thang)}-${hai(kq.duong.ngay)}`} className="text-gold underline">Ngày này tốt hay xấu?</Link>}
            {kq.am_viet.nam >= 1901 && kq.am_viet.nam <= 2098 && /* khớp docNamLich — năm khác không có trang */
              <Link href={`/lich-am/${kq.am_viet.nam}`} className="text-gold underline">Lịch âm cả năm {kq.am_viet.nam}</Link>}
          </p>
          </>}
        </div>
      )}
    </div>
  );
}
