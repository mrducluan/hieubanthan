"use client";
// QTE — khung hỏi đáp tiếng Anh (Numerology, Tarot): gửi câu qua route web với header ngôn ngữ; hiện lời đáp, "Why we say
// this", câu hỏi tiếp. Câu hỏi không lưu trên máy; không LLM (engine trả lời tất định).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postEn } from "@/lib/en/api";
import { ghi } from "@/lib/do-luong";

export interface TraLoiEn { cau_tra_loi: string; can_cu?: string[]; hoi_tiep?: string[]; xu_ly?: string; phan_loai?: { xu_ly?: string } }

export function HoiEn({ goiY, gui, moDun, loiChao }: { goiY: string[]; gui: (cau: string) => Promise<TraLoiEn>; moDun: string; loiChao: string }) {
  const [cau, setCau] = useState("");
  const [ds, setDs] = useState<{ hoi: string; dap: TraLoiEn }[]>([]);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const hoi = async (q: string) => {
    const t = q.trim();
    if (t.length < 3 || dang) return;
    setDang(true); setLoi(null);
    try {
      const d = await gui(t);
      setDs((x) => [...x, { hoi: t, dap: d }]);
      setCau("");
      ghi("advisor_question_completed", { mo_dun: moDun, ngon_ngu: "en", xu_ly: d.xu_ly ?? d.phan_loai?.xu_ly ?? "tra_loi" });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Something went wrong."); } finally { setDang(false); }
  };
  return (
    <div className="glass rounded-2xl p-5" data-testid="hoi-en">
      <p className="text-sm text-fg-muted">{loiChao}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {goiY.map((g) => <button key={g} type="button" onClick={() => void hoi(g)} className="rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:text-fg" data-testid="goi-y-en">{g}</button>)}
      </div>
      <ol className="mt-4 space-y-4">
        {ds.map((x, i) => (
          <li key={i} data-testid="luot-hoi-en">
            <p className="text-sm font-medium text-fg">{x.hoi}</p>
            <p className="mt-1 whitespace-pre-line text-fg-muted">{x.dap.cau_tra_loi}</p>
            {x.dap.can_cu && x.dap.can_cu.length > 0 && <details className="mt-1 text-xs text-fg-faint"><summary className="cursor-pointer text-gold">Why we say this</summary><ul className="mt-1 list-disc space-y-1 pl-5">{x.dap.can_cu.map((c, k) => <li key={k}>{c}</li>)}</ul></details>}
            {x.dap.hoi_tiep && x.dap.hoi_tiep.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{x.dap.hoi_tiep.map((h) => <button key={h} type="button" onClick={() => void hoi(h)} className="rounded-full border border-gold/40 px-2.5 py-0.5 text-xs text-gold hover:bg-gold/10">{h}</button>)}</div>}
          </li>
        ))}
      </ol>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); void hoi(cau); }}>
        <Input value={cau} onChange={(e) => setCau(e.target.value.slice(0, 300))} placeholder="Type a question…" aria-label="Your question" data-testid="o-hoi-en" />
        <Button type="submit" disabled={dang || cau.trim().length < 3} data-testid="nut-hoi-en">{dang ? "…" : "Ask"}</Button>
      </form>
      {loi && <p role="alert" className="mt-2 text-sm text-cinnabar">{loi}</p>}
      <p className="mt-3 text-xs text-fg-faint">Answers are assembled from a sourced knowledge base, not written by an AI, and are not predictions. Your question is sent only to compute the answer and is not stored with your name.</p>
    </div>
  );
}
