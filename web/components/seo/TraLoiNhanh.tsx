// SEO-M — khối "Trả lời nhanh" (câu trả lời trước, do engine dựng) + danh sách hỏi đáp hiển thị.
// Engine cũ (lệch deploy) chưa trả câu → khối tự ẩn.
export function TraLoiNhanh({ chu }: { chu?: string | null }) {
  if (!chu) return null;
  return (
    <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5" data-testid="tra-loi-nhanh">
      <p className="eyebrow">Trả lời nhanh</p>
      <p className="mt-2 leading-relaxed text-fg">{chu}</p>
    </section>
  );
}

export function HoiDapHien({ ds, id = "hoi-dap" }: { ds?: { hoi: string; dap: string }[] | null; id?: string }) {
  if (!ds?.length) return null;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl">Câu hỏi thường gặp</h2>
      <dl className="space-y-3">{ds.map((h) => (
        <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
      ))}</dl>
    </section>
  );
}
