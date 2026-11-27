// CV-4 — khối mời nhỏ cuối trang công cụ: người đang tính ngày / thời gian thường đang cân nhắc một việc cụ thể. Máy chủ dựng,
// chỉ link (câu gợi ý cố định đi bằng ?cau=); đo lường theo trang nguồn `tu`.
import { ArrowRight, Target } from "lucide-react";
import Link from "@/components/khung/Lien";
import { CAU_QUYET_DINH, duongCoVan } from "@/lib/cau-hoi-co-van";
import { GhiBamCta } from "@/components/co-van/GhiBamCta";

export function MoiHoiQuyetDinh({ tu, tieuDe, loiDan, className }: { tu: string; tieuDe: string; loiDan: string; className?: string }) {
  return (
    <section className={`glass rounded-2xl p-5 sm:p-6 ${className ?? ""}`} data-testid="moi-hoi-quyet-dinh" aria-label={tieuDe}>
      <h2 className="flex items-center gap-2 font-serif text-xl text-fg"><Target className="size-5 text-gold" aria-hidden /> {tieuDe}</h2>
      <p className="mt-1.5 text-sm text-fg-muted">{loiDan}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {CAU_QUYET_DINH.slice(0, 4).map((q) => (
          <li key={q}>
            <GhiBamCta tu={tu} href={duongCoVan(q)}
              className="inline-flex min-h-10 items-center rounded-full border border-line/70 bg-bg/50 px-3.5 py-1.5 text-xs text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">{q}</GhiBamCta>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <GhiBamCta tu={tu} href="/co-van" className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline">
          Hỏi câu của riêng bạn <ArrowRight className="size-3.5" aria-hidden />
        </GhiBamCta>
      </div>
    </section>
  );
}
