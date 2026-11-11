// SEO-M — khối "Trả lời nhanh" (câu trả lời trước, do engine dựng) + danh sách hỏi đáp hiển thị.
// Engine cũ (lệch deploy) chưa trả câu → khối tự ẩn. EN-ALL: `en` = nhãn theo bảng lib/chu/kien-thuc.ts chiều `en`.
import { taoChu } from "@/lib/chu-trang";
import { CHU_KIEN_THUC } from "@/lib/chu/kien-thuc";

export function TraLoiNhanh({ chu, en = false }: { chu?: string | null; en?: boolean }) {
  if (!chu) return null;
  const nhan = taoChu(CHU_KIEN_THUC, null, en ? "en" : "vi")("tln.nhan");
  return (
    <section aria-label={nhan} className="rounded-2xl border border-gold/30 bg-gold/5 p-5" data-testid="tra-loi-nhanh">
      <p className="eyebrow">{nhan}</p>
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
