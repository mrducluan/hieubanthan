// EN-5.2 — "Năm nay theo sao lưu" trong chương Vận hạn (Tử vi): lời đời thường + việc nên làm đứng trước, tên sao chỉ nằm
// trong phần gập "Vì sao nói vậy" (quy tắc thuật ngữ). Engine dựng hết; sao lưu không đổi mức của năm.
import type { SaoLuuNam as SL } from "./kieu";

const KHO = new Set(["kinh", "da", "tang_mon", "bach_ho"]);

export function SaoLuuNam({ sl }: { sl: SL }) {
  return (
    <section className="mt-4 rounded-2xl border border-line/70 p-4" aria-labelledby="sao-luu-nam" data-testid="sao-luu-nam">
      <h4 id="sao-luu-nam" className="text-base font-semibold">Năm {sl.nam} nhìn theo sao lưu</h4>
      <p className="mt-1 text-sm text-fg-muted">Những điểm riêng của năm nay rơi vào mảng nào trong lá số của bạn — đọc thêm, không đổi mức của năm.</p>
      <ul className="mt-3 space-y-2.5">
        {sl.muc.map((m) => (
          <li key={m.ma} className="flex gap-2.5">
            <span aria-hidden className={`mt-2 size-2 shrink-0 rounded-full ${KHO.has(m.ma) ? "bg-gold" : "bg-jade"}`} />
            <span>
              <span className="block text-[0.97rem] leading-relaxed text-fg">{m.loi}</span>
              <span className="block text-sm text-fg-muted">Nên: {m.nen_lam.charAt(0).toLowerCase() + m.nen_lam.slice(1)}</span>
            </span>
          </li>
        ))}
      </ul>
      {sl.kep_loc && <p className="mt-3 text-sm text-fg-muted">{sl.kep_loc.replace(/^[^:]+:\s*/, "").replace(/^./, (x) => x.toUpperCase())}</p>}
      <details className="mt-3 text-xs text-fg-faint">
        <summary className="cursor-pointer">Vì sao nói vậy</summary>
        <ul className="mt-1 space-y-0.5">
          {sl.muc.map((m) => <li key={m.ma}>{m.ten}: cung {m.cac_cung.join(", ")} (năm {sl.can_chi})</li>)}
        </ul>
        {sl.kep_loc && <p className="mt-1">{sl.kep_loc}</p>}
        {sl.loi_chu_y && <p className="mt-1">{sl.loi_chu_y}</p>}
      </details>
    </section>
  );
}
