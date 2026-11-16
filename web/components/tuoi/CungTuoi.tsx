// SEO-K — "Cùng tuổi {can chi} {năm}": link chéo giữa các trang theo năm sinh (mệnh, hướng hợp tuổi, làm nhà, xông đất).
// Anchor có can chi (người ta tìm "tuổi Canh Ngọ 1990"), không chỉ con số. Chỉ dựng link — can chi do ENGINE trả
// (trang gọi truyền vào), web không tự tính (CLAUDE.md: một bộ tính duy nhất).
// EN-ALL GĐ 8: bản Anh chỉ giữ link tới trang đã mở bản Anh; "mệnh theo năm" cần slug Anh của engine (`menhEn`).
import Link from "@/components/khung/Lien";
import { duongTuoi } from "@/lib/kien-thuc";
import { NAM_SINH_SEO, duongLamNha, duongXongDat } from "@/lib/tuoi-dan-gian";
import { duongNamTuoi } from "@/lib/nam";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";

/** AUD-Q1 (2026-11-03): link sang trang theo tuổi của ĐÚNG năm đang được index (`namSeo` = `namTuoiSeo()`), một link mỗi
 *  công cụ — không trỏ vào năm đã noindex; xông đất theo Tết sắp tới (`namTet` = năm âm hiện tại + 1). `boQua`: đường dẫn trang đang xem (không tự trỏ về mình). */
export function CungTuoi({ namSinh, canChi: cc, namSeo, namTet, boQua, ngonNgu = "vi", menhEn = null }: {
  namSinh: number; canChi: string; namSeo: number; namTet: number; boQua?: string; ngonNgu?: "vi" | "en"; menhEn?: string | null;
}) {
  const { c, en } = chuNamTuoi(ngonNgu), b = { can_chi: cc, nam_sinh: namSinh };
  const ds: [string, string][] = [];
  const menhVi = `/bat-tu/menh-theo-nam/sinh-nam-${namSinh}-menh-gi`;
  if (namSinh >= 1950 && namSinh <= 2027 && (!en || menhEn)) ds.push([en ? menhVi.replace(/\/[^/]+$/, `/${menhEn}`) : menhVi, c("ct.menh", b)]);
  if (NAM_SINH_SEO.includes(namSinh)) {
    ds.push([duongTuoi(`tuoi-${namSinh}`), c("ct.huong", b)]);
    ds.push([duongLamNha(namSeo, namSinh), c("ct.lam_nha", { ...b, nam: namSeo })]);
    ds.push([duongXongDat(namTet, namSinh), c("ct.xong_dat", { ...b, tet: namTet })]);
    ds.push([duongNamTuoi(namSeo, namSinh), c("ct.nam_tuoi", { ...b, nam: namSeo })]);
  }
  const loc = ds.filter(([d], i) => d !== boQua && ds.findIndex(([x]) => x === d) === i)
    .flatMap(([d, chu]) => { const h = lienNN(en, d); return h ? [[h, chu] as const] : []; });
  if (!loc.length) return null;
  return (
    <nav className="mt-10" aria-labelledby="cung-tuoi">
      <h2 id="cung-tuoi" className="text-xl">{c("ct.tieu_de", b)}</h2>
      <ul className="mt-3 flex flex-wrap gap-2 text-sm">
        {loc.map(([d, chu]) => (
          <li key={d}><Link href={d} className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 py-2 text-fg-muted hover:border-gold/50 hover:text-fg">{chu}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
