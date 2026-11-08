"use client";
// QTE-1 tuần 3–4 — BaZi calculator (tiếng Anh). Engine tính (/api/battu/la-so-en, cùng phép tính bản Việt), web chỉ hiển thị.
// Ngày giờ sinh chỉ gửi đi để tính, không lưu ở máy chủ; nhớ trên máy này (localStorage) để mở lại.
import { useState } from "react";
import Link from "@/components/khung/Lien";
import { FormSinhEn, type PayloadSinh } from "@/components/en/FormSinhEn";
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
const MAU: Record<string, string> = { Wood: "#3E8A6B", Fire: "#C2553B", Earth: "#B0702B", Metal: "#8A8F99", Water: "#2F6FB0" };

export function BaziCalculator() {
  const [kq, setKq] = useState<KetQua | null>(null);
  async function tinh(p: PayloadSinh) {
    const r = await fetch("/api/battu/la-so-en", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p) });
    if (!r.ok) throw new Error("The calculation service is busy. Please try again in a moment.");
    setKq((await r.json()) as KetQua);
    ghi("reading_started", { mo_dun: "battu", ngon_ngu: "en" });
  }

  const tong = kq ? Object.values(kq.elements).reduce((a, b) => a + b, 0) || 1 : 1;
  return (
    <div>
      <FormSinhEn nut="Show my Four Pillars" onTinh={tinh} testId="form-bazi-en" />

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
