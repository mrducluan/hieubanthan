// SEO-K — "Cùng tuổi {can chi} {năm}": link chéo giữa các trang theo năm sinh (mệnh, hướng hợp tuổi, làm nhà, xông đất).
// Anchor có can chi (người ta tìm "tuổi Canh Ngọ 1990"), không chỉ con số. Chỉ dựng link — can chi do ENGINE trả
// (trang gọi truyền vào), web không tự tính (CLAUDE.md: một bộ tính duy nhất).
import Link from "next/link";
import { duongTuoi } from "@/lib/kien-thuc";
import { NAM_SINH_SEO, duongLamNha, duongXongDat } from "@/lib/tuoi-dan-gian";

export function CungTuoi({ namSinh, canChi: cc, namAm, bo }: { namSinh: number; canChi: string; namAm: number; bo?: "huong" | "lam_nha" | "xong_dat" }) {
  const ds: [string, string][] = [];
  if (namSinh >= 1950 && namSinh <= 2025) ds.push([`/bat-tu/menh-theo-nam/sinh-nam-${namSinh}-menh-gi`, `Sinh năm ${namSinh} mệnh gì`]);
  if (bo !== "huong" && NAM_SINH_SEO.includes(namSinh)) ds.push([duongTuoi(`tuoi-${namSinh}`), `Tuổi ${cc} ${namSinh} hợp hướng nào`]);
  if (NAM_SINH_SEO.includes(namSinh)) {
    for (const n of [namAm, namAm + 1]) if (bo !== "lam_nha" || n !== namAm) ds.push([duongLamNha(n, namSinh), `Tuổi ${cc} làm nhà năm ${n}`]);
    ds.push([duongXongDat(namAm + 1, namSinh), `Tuổi xông đất Tết ${namAm + 1} cho gia chủ ${cc}`]);
  }
  const loc = ds.filter(([d], i) => ds.findIndex(([x]) => x === d) === i);
  if (!loc.length) return null;
  return (
    <nav className="mt-10" aria-labelledby="cung-tuoi">
      <h2 id="cung-tuoi" className="text-xl">{`Cùng tuổi ${cc} ${namSinh}`}</h2>
      <ul className="mt-3 flex flex-wrap gap-2 text-sm">
        {loc.map(([d, chu]) => (
          <li key={d}><Link href={d} className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 py-2 text-fg-muted hover:border-gold/50 hover:text-fg">{chu}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
