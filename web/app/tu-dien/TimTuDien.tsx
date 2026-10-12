"use client";
// Lọc nhanh trên danh sách đã render ở máy chủ (page.tsx): chỉ bật/tắt thuộc tính hidden, không tính gì.
// PERF-1: danh sách 221 mục không còn là props của component client → bớt một bản sao dữ liệu trong gói RSC.
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export function TimTuDien({ tenMang, tong }: { tenMang: Record<string, string>; tong: number }) {
  const [tim, setTim] = useState("");
  const [mang, setMang] = useState<string>("tat_ca");
  const [soHien, setSoHien] = useState(tong);
  const q = boDau(tim.trim());
  // Chữ không dấu của từng mục — đọc từ HTML một lần khi người dùng bắt đầu lọc (không nhân đôi nội dung trong HTML).
  const chu = useRef<WeakMap<HTMLElement, string>>(new WeakMap());

  useEffect(() => {
    let dem = 0;
    document.querySelectorAll<HTMLElement>("[data-td-muc]").forEach((el) => {
      let t = chu.current.get(el);
      if (q && t === undefined) { t = boDau(el.textContent ?? ""); chu.current.set(el, t); }
      const hien = (mang === "tat_ca" || el.dataset.mang === mang) && (!q || (t ?? "").includes(q));
      el.hidden = !hien;
      if (hien) dem++;
    });
    document.querySelectorAll<HTMLElement>("[data-td-nhom]").forEach((s) => {
      s.hidden = !s.querySelector("[data-td-muc]:not([hidden])");
    });
    setSoHien(dem);
  }, [q, mang]);

  // Đi tới #ma (từ thẻ giải nghĩa) mà mục đang bị bộ lọc ẩn → bỏ lọc rồi cuộn tới.
  useEffect(() => {
    const doc = () => {
      const neo = decodeURIComponent(window.location.hash.slice(1));
      const el = neo ? document.getElementById(neo) : null;
      if (!el?.hasAttribute("data-td-muc")) return;
      setTim(""); setMang("tat_ca");
      requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
    };
    doc();
    window.addEventListener("hashchange", doc);
    return () => window.removeEventListener("hashchange", doc);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm thuật ngữ, vd: hoá kỵ, dụng thần, hào động…"
          aria-label="Tìm thuật ngữ" className="max-w-sm" />
        <div role="radiogroup" aria-label="Lọc theo mảng" className="flex flex-wrap gap-1.5">
          {["tat_ca", ...Object.keys(tenMang)].map((k) => (
            <button key={k} type="button" role="radio" aria-checked={mang === k} onClick={() => setMang(k)}
              className={`min-h-10 rounded-full border px-3.5 py-2 text-sm transition-colors ${mang === k ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg"}`}>
              {k === "tat_ca" ? "Tất cả" : tenMang[k]}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-fg-faint" aria-live="polite">{soHien} thuật ngữ</p>
    </div>
  );
}
