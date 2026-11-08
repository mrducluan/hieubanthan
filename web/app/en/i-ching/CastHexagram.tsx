"use client";
// QTE-1 tuần 7 — gieo quẻ (tiếng Anh). Engine gieo (CSPRNG) và khởi quẻ; web chỉ vẽ 6 hào + quẻ bản / quẻ biến.
// Câu hỏi chỉ để người dùng giữ trong đầu — KHÔNG gửi lên máy chủ.
import { useState } from "react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { duongHexagram } from "@/lib/ngon-ngu";
import { ghi } from "@/lib/do-luong";

interface Hex { number: number; slug: string; name: string; pinyin: string; han: string; meaning: string; advice: string; upper: { pinyin: string; image: string }; lower: { pinyin: string; image: string } }
interface KetQua { lines: { position: number; yang: boolean; changing: boolean }[]; changing_lines: number[]; primary: Hex; changed: Hex | null }

function Hao({ yang, changing }: { yang: boolean; changing: boolean }) {
  return (
    <div className="flex h-4 items-center gap-2">
      {yang ? <span className={`h-3 w-40 rounded-sm ${changing ? "bg-gold" : "bg-fg"}`} />
        : <><span className={`h-3 w-[4.5rem] rounded-sm ${changing ? "bg-gold" : "bg-fg"}`} /><span className={`h-3 w-[4.5rem] rounded-sm ${changing ? "bg-gold" : "bg-fg"}`} /></>}
      {changing && <span className="text-xs text-gold">changing</span>}
    </div>
  );
}

function TheQue({ h, nhan }: { h: Hex; nhan: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="eyebrow">{nhan}</p>
      <h2 className="mt-1 text-2xl">{h.number}. {h.han} {h.pinyin} — {h.name}</h2>
      <p className="mt-1 text-xs text-fg-faint">{h.upper.image} over {h.lower.image}</p>
      <p className="mt-2 text-fg">{h.meaning}</p>
      <p className="mt-2 text-sm text-fg-muted">{h.advice}</p>
      <Link href={duongHexagram(h.slug)} className="mt-3 inline-block text-gold underline">More about hexagram {h.number}</Link>
    </div>
  );
}

export function CastHexagram() {
  const [kq, setKq] = useState<KetQua | null>(null), [loi, setLoi] = useState<string | null>(null), [dang, setDang] = useState(false);
  async function gieo() {
    setLoi(null); setDang(true);
    try {
      const r = await fetch("/api/kinhdich/gieo-en", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      if (!r.ok) throw new Error("The service is busy. Please try again in a moment.");
      setKq((await r.json()) as KetQua);
      ghi("reading_started", { mo_dun: "kinhdich", ngon_ngu: "en" });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Something went wrong."); } finally { setDang(false); }
  }
  return (
    <div>
      <div className="glass rounded-2xl p-5 sm:p-6" data-testid="gieo-en">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-fg-muted">
          <li>Think of one clear question about something you can act on. Keep it in mind — you do not need to type it.</li>
          <li>Press the button once. The six lines are cast with a secure random generator, the same way as three coins thrown six times.</li>
        </ol>
        <Button className="mt-4" onClick={() => void gieo()} disabled={dang}>{dang ? "Casting…" : kq ? "Cast again" : "Cast a hexagram"}</Button>
        {loi && <p className="mt-2 text-sm text-cinnabar" role="alert">{loi}</p>}
      </div>
      {kq && (
        <section className="mt-8 space-y-6" aria-label="Your hexagram" data-testid="ket-qua-que-en">
          <div className="flex flex-col-reverse gap-1.5" aria-label="Six lines, bottom to top">
            {kq.lines.map((l) => <Hao key={l.position} yang={l.yang} changing={l.changing} />)}
          </div>
          <TheQue h={kq.primary} nhan="Your hexagram" />
          {kq.changed && kq.changing_lines.length > 0 && <TheQue h={kq.changed} nhan={`Changing to (lines ${kq.changing_lines.join(", ")})`} />}
          <p className="text-xs text-fg-faint">The I Ching is a tool for reflection, not a fortune. Your question was never sent to our servers.</p>
        </section>
      )}
    </div>
  );
}
