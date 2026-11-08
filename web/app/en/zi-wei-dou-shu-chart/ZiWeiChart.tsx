"use client";
// QTE-1 tuần 5 — Zi Wei Dou Shu chart (tiếng Anh). Engine an sao (/api/tuvi/an-sao-en, cùng lá số bản Việt), web chỉ vẽ:
// lưới 12 cung kiểu truyền thống (Tỵ góc trên trái … Hợi góc dưới phải) trên màn hình rộng, danh sách trên điện thoại.
import { useState } from "react";
import Link from "@/components/khung/Lien";
import { FormSinhEn, type PayloadSinh } from "@/components/en/FormSinhEn";
import { duongStar } from "@/lib/ngon-ngu";
import { ghi } from "@/lib/do-luong";

interface Sao { vi: string; name: string | null; slug: string | null; brightness: string | null; transformation: string | null }
interface Cung {
  vi: string; name: string | null; is_life: boolean; is_body: boolean; stem: { pinyin: string; han: string };
  branch: { vi: string; pinyin: string; han: string; animal: string }; major_stars: Sao[]; minor_stars: string[];
  major_period: { from_age: number; to_age: number; from_year: number; to_year: number } | null;
}
interface KetQua {
  palaces: Cung[]; element_bureau: string; life_master: string; body_master: string; direction: string;
  year: { stem: string; branch: string; animal: string };
  life_palace_stars: { slug: string; name: string; han: string; nature: string; strengths: string; watch_out: string; question: string }[];
}
// vị trí theo địa chi trong lưới 4×4 (hàng, cột)
const VT: Record<string, [number, number]> = { "Tỵ": [1, 1], "Ngọ": [1, 2], "Mùi": [1, 3], "Thân": [1, 4], "Thìn": [2, 1], "Dậu": [2, 4],
  "Mão": [3, 1], "Tuất": [3, 4], "Dần": [4, 1], "Sửu": [4, 2], "Tý": [4, 3], "Hợi": [4, 4] };
const ngan = (s: string | null) => (s ?? "").replace(/ \(.*\)$/, "");

function O({ c }: { c: Cung }) {
  return (
    <div className={`h-full rounded-lg border p-2 text-xs ${c.is_life ? "border-gold/70 bg-gold/5" : "border-line/60"}`}>
      <p className="flex justify-between gap-1 text-[0.7rem] text-fg-faint"><span>{c.stem.han}{c.branch.han} · {c.branch.animal}</span>{c.major_period && <span>{c.major_period.from_age}–{c.major_period.to_age}</span>}</p>
      <p className="mt-1 font-medium text-fg">{ngan(c.name)}{c.is_life ? " ★" : ""}{c.is_body ? " (Body)" : ""}</p>
      <ul className="mt-1 space-y-0.5">
        {c.major_stars.map((s) => (
          <li key={s.vi} className="text-gold">
            {s.slug ? <Link href={duongStar(s.slug)} className="hover:underline">{ngan(s.name)}</Link> : ngan(s.name)}
            {s.brightness && <span className="text-fg-faint"> · {ngan(s.brightness)}</span>}
            {s.transformation && <span className="ml-1 rounded bg-gold/15 px-1 text-[0.65rem] text-fg">{s.transformation}</span>}
          </li>
        ))}
        {c.major_stars.length === 0 && <li className="text-fg-faint">no major star</li>}
      </ul>
      {c.minor_stars.length > 0 && <p className="mt-1 text-[0.7rem] text-fg-muted">{c.minor_stars.map(ngan).join(", ")}</p>}
    </div>
  );
}

export function ZiWeiChart() {
  const [kq, setKq] = useState<KetQua | null>(null);
  async function tinh(p: PayloadSinh) {
    const r = await fetch("/api/tuvi/an-sao-en", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p) });
    if (!r.ok) throw new Error("The calculation service is busy. Please try again in a moment.");
    setKq((await r.json()) as KetQua);
    ghi("reading_started", { mo_dun: "tuvi", ngon_ngu: "en" });
  }
  return (
    <div>
      <FormSinhEn nut="Show my Zi Wei chart" onTinh={tinh} testId="form-ziwei-en" />
      {kq && (
        <section className="mt-10 space-y-8" aria-label="Your Zi Wei Dou Shu chart" data-testid="ket-qua-ziwei-en">
          <div className="hidden grid-cols-4 grid-rows-4 gap-1.5 sm:grid" role="group" aria-label="12 palaces">
            {kq.palaces.map((c) => { const [r, col] = VT[c.branch.vi]!; return <div key={c.branch.vi} style={{ gridRow: r, gridColumn: col }}><O c={c} /></div>; })}
            <div className="flex flex-col items-center justify-center rounded-lg border border-line/40 p-3 text-center text-sm" style={{ gridRow: "2 / span 2", gridColumn: "2 / span 2" }}>
              <p className="font-serif text-lg text-fg">{kq.year.stem} {kq.year.branch} · {kq.year.animal}</p>
              <p className="mt-1 text-fg-muted">{kq.element_bureau}</p>
              <p className="mt-1 text-fg-muted">Life Master {ngan(kq.life_master)} · Body Master {ngan(kq.body_master)}</p>
              <p className="mt-1 text-xs text-fg-faint">Major periods run {kq.direction}</p>
            </div>
          </div>
          <ul className="space-y-2 sm:hidden" aria-label="12 palaces">{kq.palaces.map((c) => <li key={c.branch.vi}><O c={c} /></li>)}</ul>
          {kq.life_palace_stars.map((s) => (
            <div key={s.slug} className="glass rounded-2xl p-5">
              <p className="eyebrow">In your Life Palace</p>
              <h2 className="mt-1 text-2xl">{s.han} {ngan(s.name)}</h2>
              <p className="mt-2 text-fg-muted">{s.nature}. Strengths: {s.strengths}. Watch out for: {s.watch_out}.</p>
              <p className="mt-2 italic text-fg">{s.question}</p>
              <Link href={duongStar(s.slug)} className="mt-3 inline-block text-gold underline">Read more about {ngan(s.name)}</Link>
            </div>
          ))}
          <p className="text-xs text-fg-faint">Brightness follows the Southern (Vietnamese) school; the lunar calendar follows the Vietnamese meridian. For self-reflection, not prediction.</p>
        </section>
      )}
    </div>
  );
}
