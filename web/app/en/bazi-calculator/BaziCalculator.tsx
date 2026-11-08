"use client";
// QTE-1 tuần 3–4 — BaZi calculator (tiếng Anh). Engine tính (/api/battu/la-so-en, cùng phép tính bản Việt), web chỉ hiển thị.
// Ngày giờ sinh chỉ gửi đi để tính, không lưu ở máy chủ; nhớ trên máy này (localStorage) để mở lại.
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tenUtc, useDanhSachNuoc, type KetQuaMuiGio } from "@/lib/dia-ly";
import { duongDayMaster } from "@/lib/ngon-ngu";
import { ghi } from "@/lib/do-luong";

interface Can { vi: string; pinyin: string; han: string; element: string; yin_yang: string }
interface Chi { vi: string; pinyin: string; han: string; animal: string; element: string }
interface KetQua {
  pillars: { position: string; stem: Can; branch: Chi; hidden_stems: Can[] }[];
  day_master: { slug: string; name: string; han: string; image: string; nature: string; strengths: string; watch_out: string; question: string };
  ten_gods_stems: string[]; elements: Record<string, number>; element_missing: string[]; element_strongest: string;
  strength: { label: string; ratio: number; in_season: boolean };
  useful_god: { balance_method: string[]; climate_method: string[] };
  luck_pillars: { stem: Can; branch: Chi; from_year: number; to_year: number; from_age: number | null }[];
  warnings: { type: string; text: string }[];
}
const KHOA = "hbt.en.bazi.v1";
const VN = [["vn-north", "Vietnam — North (Hanoi…)", "ha-noi"], ["vn-south", "Vietnam — South (Ho Chi Minh City…)", "tp-ho-chi-minh"]] as const;
const MAU: Record<string, string> = { Wood: "#3E8A6B", Fire: "#C2553B", Earth: "#B0702B", Metal: "#8A8F99", Water: "#2F6FB0" };

export function BaziCalculator() {
  const [ngay, setNgay] = useState(""), [gio, setGio] = useState(""), [gioiTinh, setGioiTinh] = useState("");
  const [nuoc, setNuoc] = useState(""), [tp, setTp] = useState("");
  const [kq, setKq] = useState<KetQua | null>(null), [loi, setLoi] = useState<string | null>(null), [dang, setDang] = useState(false);
  const ds = useDanhSachNuoc(true, "en");
  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(KHOA) ?? "null");
      if (o) { setNgay(o.ngay ?? ""); setGio(o.gio ?? ""); setGioiTinh(o.gioiTinh ?? ""); setNuoc(o.nuoc ?? ""); setTp(o.tp ?? ""); }
    } catch { /* bỏ qua */ }
  }, []);
  const nuocChon = ds?.find((n) => n.ma === nuoc);
  const tpChon = nuocChon && nuocChon.thanh_pho.length === 1 ? nuocChon.thanh_pho[0]!.mui_gio : tp;

  async function tinh(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !/^\d{2}:\d{2}$/.test(gio) || !gioiTinh || !nuoc) return setLoi("Please fill in birth date, time, sex and place of birth.");
    const vn = VN.find((v) => v[0] === nuoc);
    if (!vn && !tpChon) return setLoi("Please choose the state or city of birth.");
    setLoi(null); setDang(true);
    try {
      let noiSinh: Record<string, unknown> = vn ? { noi_sinh: vn[2] } : {};
      if (!vn) {
        const r = await fetch(`/api/dia-ly/mui-gio?${new URLSearchParams({ mui_gio: tpChon, ngay, gio })}`);
        if (!r.ok) throw new Error("Could not work out the time zone for this place.");
        const mg = (await r.json()) as KetQuaMuiGio;
        noiSinh = { noi_sinh: "nuoc_ngoai", utc_noi_sinh: mg.utc_chuan, ...(mg.gio_mua_he ? { gio_mua_he: true } : {}) };
      }
      const r = await fetch("/api/battu/la-so-en", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ birth_date: ngay, birth_time: gio, gender: gioiTinh, ...noiSinh }) });
      const j = await r.json();
      if (!r.ok) throw new Error("The calculation service is busy. Please try again in a moment.");
      setKq(j as KetQua);
      try { localStorage.setItem(KHOA, JSON.stringify({ ngay, gio, gioiTinh, nuoc, tp })); } catch { /* bỏ qua */ }
      ghi("reading_started", { mo_dun: "battu", ngon_ngu: "en" });
    } catch (e2) {
      setLoi(e2 instanceof Error ? e2.message : "Something went wrong.");
    } finally { setDang(false); }
  }

  const tong = kq ? Object.values(kq.elements).reduce((a, b) => a + b, 0) || 1 : 1;
  return (
    <div>
      <form onSubmit={tinh} className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 sm:p-6" data-testid="form-bazi-en">
        <div className="space-y-2"><Label htmlFor="en-ngay">Date of birth</Label><Input id="en-ngay" type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} min="1900-01-01" max="2100-12-31" /></div>
        <div className="space-y-2"><Label htmlFor="en-gio">Time of birth (clock time on the birth certificate)</Label><Input id="en-gio" type="time" value={gio} onChange={(e) => setGio(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="en-gt">Sex at birth (sets the direction of luck pillars)</Label>
          <Select id="en-gt" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
            <option value="">— Choose —</option><option value="nam">Male</option><option value="nu">Female</option>
          </Select></div>
        <div className="space-y-2"><Label htmlFor="en-nuoc">Country of birth</Label>
          <Select id="en-nuoc" value={nuoc} onChange={(e) => { setNuoc(e.target.value); setTp(""); }} disabled={!ds}>
            <option value="">{ds ? "— Choose —" : "Loading…"}</option>
            {VN.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            {ds?.map((n) => <option key={n.ma} value={n.ma}>{n.ten}</option>)}
          </Select></div>
        {nuocChon && nuocChon.thanh_pho.length > 1 && (
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="en-tp">State / city</Label>
            <Select id="en-tp" value={tp} onChange={(e) => setTp(e.target.value)}>
              <option value="">— Choose —</option>
              {nuocChon.thanh_pho.map((t) => <option key={t.ten} value={t.mui_gio}>{t.ten}</option>)}
            </Select></div>
        )}
        <p className="text-xs text-fg-faint sm:col-span-2">We work out the time zone and daylight saving time for your birth date automatically. Your birth data is sent only to calculate the chart, is not stored on our servers, and is remembered on this device only.</p>
        {loi && <p className="text-sm text-cinnabar sm:col-span-2" role="alert">{loi}</p>}
        <div className="sm:col-span-2"><Button type="submit" disabled={dang}>{dang ? "Calculating…" : "Show my Four Pillars"}</Button></div>
      </form>

      {kq && (
        <section className="mt-10 space-y-10" aria-label="Your BaZi chart" data-testid="ket-qua-bazi-en">
          <div>
            <h2 className="text-2xl">Your Four Pillars</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-center text-sm" aria-label="Four Pillars">
                <thead className="text-xs text-fg-faint"><tr><th className="py-2 text-left"> </th>{kq.pillars.map((p) => <th key={p.position} className={p.position === "Day" ? "text-gold" : ""}>{p.position}</th>)}</tr></thead>
                <tbody>
                  <tr className="border-t border-line/50"><th scope="row" className="py-3 text-left text-xs text-fg-faint">Ten God</th>{kq.ten_gods_stems.map((t, i) => <td key={i} className="text-fg-muted">{t}</td>)}</tr>
                  <tr className="border-t border-line/50"><th scope="row" className="py-3 text-left text-xs text-fg-faint">Heavenly Stem</th>{kq.pillars.map((p) => (
                    <td key={p.position}><span className="block font-serif text-2xl" style={{ color: MAU[p.stem.element] }}>{p.stem.han}</span><span className="text-xs text-fg-muted">{p.stem.pinyin} · {p.stem.yin_yang} {p.stem.element}</span></td>))}</tr>
                  <tr className="border-t border-line/50"><th scope="row" className="py-3 text-left text-xs text-fg-faint">Earthly Branch</th>{kq.pillars.map((p) => (
                    <td key={p.position}><span className="block font-serif text-2xl" style={{ color: MAU[p.branch.element] }}>{p.branch.han}</span><span className="text-xs text-fg-muted">{p.branch.pinyin} · {p.branch.animal}</span></td>))}</tr>
                  <tr className="border-t border-line/50"><th scope="row" className="py-3 text-left text-xs text-fg-faint">Hidden stems</th>{kq.pillars.map((p) => (
                    <td key={p.position} className="text-xs text-fg-muted">{p.hidden_stems.map((h) => `${h.han} ${h.pinyin}`).join(" · ")}</td>))}</tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="eyebrow">Your Day Master</p>
            <h2 className="mt-1 text-2xl">{kq.day_master.han} {kq.day_master.name} — {kq.day_master.image}</h2>
            <p className="mt-2 text-fg-muted">Nature: {kq.day_master.nature}. Strengths: {kq.day_master.strengths}. Watch out for: {kq.day_master.watch_out}.</p>
            <p className="mt-2 italic text-fg">{kq.day_master.question}</p>
            <Link href={duongDayMaster(kq.day_master.slug)} className="mt-3 inline-block text-gold underline">Read more about the {kq.day_master.name} Day Master</Link>
          </div>
          <div>
            <h2 className="text-2xl">Five Elements balance</h2>
            <ul className="mt-4 space-y-2" aria-label="Element scores">
              {Object.entries(kq.elements).map(([el, v]) => (
                <li key={el} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3 text-sm">
                  <span>{el}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-line/40"><span className="block h-full rounded-full" style={{ width: `${Math.round((v / tong) * 100)}%`, background: MAU[el] }} /></span>
                  <span className="text-right text-fg-muted">{Math.round((v / tong) * 100)}%</span>
                </li>))}
            </ul>
            <p className="mt-3 text-sm text-fg-muted">Day Master strength: <b className="text-fg">{kq.strength.label}</b> (support ratio {kq.strength.ratio.toFixed(2)}; 0.55 or more is strong, 0.45 or less is weak){kq.strength.in_season ? ", born in a supporting season" : ""}.</p>
            <p className="mt-2 text-sm text-fg-muted">Useful element — we always show both classic methods and do not pick for you: balancing method {kq.useful_god.balance_method.join(", ") || "(chart already balanced)"}; climate method {kq.useful_god.climate_method.join(", ") || "—"}.</p>
          </div>
          <div>
            <h2 className="text-2xl">10-year Luck Pillars</h2>
            <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {kq.luck_pillars.map((l) => (
                <li key={l.from_year} className="rounded-xl border border-line/70 p-3 text-center text-sm">
                  <span className="block font-serif text-xl">{l.stem.han}{l.branch.han}</span>
                  <span className="block text-xs text-fg-muted">{l.stem.pinyin} {l.branch.pinyin} · {l.from_year}–{l.to_year}</span>
                </li>))}
            </ol>
          </div>
          {kq.warnings.length > 0 && <ul className="space-y-1 text-xs text-fg-faint">{kq.warnings.map((w) => <li key={w.type}>• {w.text}</li>)}</ul>}
          <p className="text-xs text-fg-faint">For self-reflection and cultural interest. Not a prediction, and not medical, legal or financial advice.</p>
        </section>
      )}
    </div>
  );
}
