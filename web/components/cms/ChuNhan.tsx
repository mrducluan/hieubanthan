// ND-7 — hiện chữ "Chữ trên trang" có đoạn nhấn `*…*` (màu nhấn do chỗ đặt quyết định). Chữ thuần, không HTML.
import { tachNhan } from "@/lib/chu-trang";

export function ChuNhan({ chu, lopNhan = "text-gold" }: { chu: string; lopNhan?: string }) {
  const ds = tachNhan(chu);
  if (ds.length === 1 && !ds[0]!.nhan) return <>{chu}</>;
  return <>{ds.map((p, i) => (p.nhan ? <span key={i} className={lopNhan}>{p.chu}</span> : <span key={i}>{p.chu}</span>))}</>;
}
