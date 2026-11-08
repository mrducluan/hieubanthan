"use client";
// QTE-1 tuần 6 — Kua number calculator (tiếng Anh). Engine tính (/api/phongthuy/menh-quai-en, năm theo Lập xuân), web chỉ hiển thị.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ghi } from "@/lib/do-luong";

interface Huong { direction: string; star: string; good: boolean; rank: number; meaning: string; best_use: string }
interface KetQua { kua: number; trigram: { pinyin: string; han: string }; group: string; year_used: number; before_start_of_spring: boolean; directions: Huong[] }

export function KuaCalculator() {
  const [ngay, setNgay] = useState(""), [gt, setGt] = useState("");
  const [kq, setKq] = useState<KetQua | null>(null), [loi, setLoi] = useState<string | null>(null), [dang, setDang] = useState(false);
  async function gui(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !gt) return setLoi("Please enter your date of birth and sex at birth.");
    setLoi(null); setDang(true);
    try {
      const r = await fetch("/api/phongthuy/menh-quai-en", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ birth_date: ngay, gender: gt }) });
      if (!r.ok) throw new Error("The calculation service is busy. Please try again in a moment.");
      setKq((await r.json()) as KetQua);
      ghi("reading_started", { mo_dun: "phongthuy", ngon_ngu: "en" });
    } catch (e2) { setLoi(e2 instanceof Error ? e2.message : "Something went wrong."); } finally { setDang(false); }
  }
  const sx = kq ? [...kq.directions].sort((a, b) => a.rank - b.rank) : [];
  return (
    <div>
      <form onSubmit={gui} className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-3 sm:items-end sm:p-6" data-testid="form-kua-en">
        <div className="space-y-2"><Label htmlFor="kua-ngay">Date of birth</Label><Input id="kua-ngay" type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} min="1900-01-01" max="2100-12-31" /></div>
        <div className="space-y-2"><Label htmlFor="kua-gt">Sex at birth</Label>
          <Select id="kua-gt" value={gt} onChange={(e) => setGt(e.target.value)}><option value="">— Choose —</option><option value="nam">Male</option><option value="nu">Female</option></Select></div>
        <Button type="submit" disabled={dang}>{dang ? "Calculating…" : "Find my Kua number"}</Button>
        {loi && <p className="text-sm text-cinnabar sm:col-span-3" role="alert">{loi}</p>}
      </form>
      {kq && (
        <section className="mt-8 space-y-6" aria-label="Your Kua number" data-testid="ket-qua-kua-en">
          <div className="glass rounded-2xl p-5">
            <p className="eyebrow">Your Kua number</p>
            <h2 className="mt-1 text-3xl"><span className="text-gold">{kq.kua}</span> · {kq.trigram.han} {kq.trigram.pinyin} · {kq.group}</h2>
            <p className="mt-2 text-sm text-fg-muted">Calculated for the year {kq.year_used}{kq.before_start_of_spring ? " — you were born before the Start of Spring (around 4 February), so the previous year is used" : ""}.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {sx.map((h) => (
              <li key={h.direction} className={`rounded-xl border p-4 ${h.good ? "border-gold/50" : "border-line/60"}`}>
                <p className="flex items-baseline justify-between gap-2"><b className="text-fg">{h.direction}</b><span className={`text-xs ${h.good ? "text-gold" : "text-fg-faint"}`}>{h.good ? "favourable" : "unfavourable"}</span></p>
                <p className="mt-1 text-sm text-fg">{h.star}</p>
                <p className="mt-1 text-sm text-fg-muted">{h.meaning} Use it for: {h.best_use}.</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-faint">Traditional Eight Mansions rules, for reflection and room planning — not a guarantee of any outcome.</p>
        </section>
      )}
    </div>
  );
}
