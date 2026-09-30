import { cn } from "@/lib/utils";

export function TieuDeMuc({ nho, lon, mo_ta, className, id }: { nho?: string; lon: string; mo_ta?: string; className?: string; id?: string }) {
  return (
    <header className={cn("mb-5", className)}>
      {nho && <p className="eyebrow">{nho}</p>}
      <h2 id={id} className="mt-1 text-2xl sm:text-3xl">{lon}</h2>
      {mo_ta && <p className="mt-2 max-w-2xl text-fg-muted">{mo_ta}</p>}
    </header>
  );
}

export function KhungTai({ dong = 3 }: { dong?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: dong }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface/60" />
      ))}
    </div>
  );
}
