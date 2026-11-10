"use client";
// KD-V4 — chip "việc hay hỏi" + câu mẫu cho ô hỏi quẻ (cùng khuôn với Tarot TR-5): bấm một chuyện → hai câu mẫu → bấm câu
// là ĐIỀN vào ô (người dùng sửa rồi tự gửi). Danh mục + câu mẫu do engine trả (KB, có test khoá từng câu được hiểu đúng).
import { cn } from "@/lib/utils";

export interface NhomHoi { ma: string; ten: string; chu_de: string | null; cau: string[] }

export function ChipHoi({ ds, nhom, onNhom, cauDangCo, onCau, khoa }: {
  ds: NhomHoi[]; nhom: string | null; onNhom: (g: NhomHoi) => void; cauDangCo: string; onCau: (g: NhomHoi, cau: string) => void; khoa?: boolean;
}) {
  const g = ds.find((x) => x.ma === nhom) ?? null;
  return (
    <div data-testid="chip-hoi">
      <p className="text-sm text-fg-muted">Bạn đang phân vân chuyện gì? Chọn một chuyện để có câu hỏi mẫu, hoặc tự viết bên dưới.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ds.map((x) => (
          <button key={x.ma} type="button" aria-pressed={nhom === x.ma} disabled={khoa} onClick={() => onNhom(x)} data-testid={`nhom-hoi-${x.ma}`}
            className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50", nhom === x.ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:border-gold/40 hover:text-fg")}>{x.ten}</button>
        ))}
      </div>
      {g && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label={`Câu hỏi mẫu về ${g.ten}`}>
          {g.cau.map((q) => (
            <li key={q}>
              <button type="button" disabled={khoa} onClick={() => onCau(g, q)} data-testid="cau-mau"
                className={cn("w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors disabled:opacity-50", cauDangCo.trim() === q ? "border-gold bg-gold/10 text-fg" : "border-line/70 text-fg hover:border-gold/50")}>{q}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
