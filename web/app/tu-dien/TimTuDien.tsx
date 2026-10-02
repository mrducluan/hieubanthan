"use client";
// Lọc nhanh trên danh sách đã render (chỉ ẩn/hiện, không tính gì). Mọi mục vẫn có trong HTML cho máy tìm kiếm.
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { MucTuDien } from "@/lib/kien-thuc";

const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export function TimTuDien({ muc, tenMang }: { muc: MucTuDien[]; tenMang: Record<string, string> }) {
  const [tim, setTim] = useState("");
  const [mang, setMang] = useState<string>("tat_ca");
  const q = boDau(tim.trim());
  const hien = useMemo(() => new Set(muc.filter((m) =>
    (mang === "tat_ca" || m.mo_dun === mang)
    && (!q || boDau([m.ten, ...m.bien_the, m.de_hieu].join(" ")).includes(q))).map((m) => m.ma)), [muc, q, mang]);
  // Đi tới #ma (từ thẻ giải nghĩa) mà mục đang bị bộ lọc ẩn → bỏ lọc rồi cuộn tới.
  const [neo, setNeo] = useState("");
  useEffect(() => {
    const doc = () => setNeo(decodeURIComponent(window.location.hash.slice(1)));
    doc();
    window.addEventListener("hashchange", doc);
    return () => window.removeEventListener("hashchange", doc);
  }, []);
  useEffect(() => {
    if (!neo || !muc.some((m) => m.ma === neo)) return;
    if (!hien.has(neo)) { setTim(""); setMang("tat_ca"); return; }
    document.getElementById(neo)?.scrollIntoView({ block: "start" });
    setNeo("");
  }, [neo, hien, muc]);
  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-wrap gap-3">
        <Input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm thuật ngữ, vd: hoá kỵ, dụng thần, hào động…"
          aria-label="Tìm thuật ngữ" className="max-w-sm" />
        <div role="radiogroup" aria-label="Lọc theo mảng" className="flex flex-wrap gap-1.5">
          {["tat_ca", ...Object.keys(tenMang)].map((k) => (
            <button key={k} type="button" role="radio" aria-checked={mang === k} onClick={() => setMang(k)}
              className={`rounded-full border px-3 py-1.5 text-sm ${mang === k ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg"}`}>
              {k === "tat_ca" ? "Tất cả" : tenMang[k]}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-fg-faint" aria-live="polite">{hien.size} thuật ngữ</p>
      {Object.entries(tenMang).map(([md, ten]) => {
        const ds = muc.filter((m) => m.mo_dun === md);
        if (!ds.some((m) => hien.has(m.ma))) return null;
        return (
          <section key={md} aria-labelledby={`td-${md}`}>
            <h2 id={`td-${md}`} className="mb-3 text-2xl">{ten}</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {ds.map((m) => (
                <div key={m.ma} id={m.ma} hidden={!hien.has(m.ma)} className="glass scroll-mt-24 rounded-xl p-4 target:ring-2 target:ring-gold">
                  <dt className="font-serif text-lg">
                    {m.ten}{m.han && <span className="ml-2 text-base text-fg-faint" style={{ fontFamily: "var(--font-han), serif" }}>{m.han}</span>}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-fg-muted">{m.de_hieu}</dd>
                  {m.vi_du && <dd className="mt-1 text-sm text-fg-faint">Ví dụ: {m.vi_du}</dd>}
                  {m.bien_the.length > 0 && <dd className="mt-1 text-xs text-fg-faint">Còn gọi: {m.bien_the.join(", ")}</dd>}
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
