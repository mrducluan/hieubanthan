// TDG-1 — trang "Tuổi {năm sinh} làm nhà năm {năm} được không" (engine dựng nội dung). Index: năm âm hiện tại + năm sau,
// năm sinh 1960–2005; ngoài cửa sổ vẫn xem được, noindex.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KetQuaLamNha } from "@/components/tuoi/KetQuaTuoi";
import { CungTuoi } from "@/components/tuoi/CungTuoi";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNam, docTuoi, duongLamNha, lamNhaCongKhai, lamNhaIndex, namAmHienTai } from "@/lib/tuoi-dan-gian";

type P = { params: Promise<{ nam: string; tuoi: string }> };

async function doc(p: P) {
  const { nam, tuoi } = await p.params;
  const n = docNam(nam), ns = docTuoi(tuoi);
  return n && ns && ns <= n ? { n, ns } : null;
}

export async function generateMetadata(p: P): Promise<Metadata> {
  const x = await doc(p);
  if (!x) return {};
  const m = metaTrang({ tieuDe: `Tuổi ${x.ns} làm nhà năm ${x.n} được không? Kim lâu, Hoang ốc`,
    moTa: `Sinh năm ${x.ns} làm nhà, cưới hỏi năm ${x.n}: tuổi mụ, Kim lâu, Hoang ốc, Tam tai, năm thuận gần nhất và hướng nên giữ yên trong năm.`,
    duong: duongLamNha(x.n, x.ns) });
  return lamNhaIndex(x.n, await namAmHienTai(), x.ns) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const x = await doc(p);
  if (!x) notFound();
  const [d, namAm] = await Promise.all([lamNhaCongKhai(x.n, x.ns), namAmHienTai()]);
  if (!d) throw new Error("engine không phản hồi");
  const tieuDe = `Tuổi ${x.ns} làm nhà năm ${x.n} được không?`;
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: duongLamNha(x.n, x.ns), ten: tieuDe, tomTat: d.ket_luan.chu, about: ["Kim lâu", "Hoang ốc", "Tam tai", `Tuổi ${d.can_chi}`] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem tuổi làm nhà", duong: "/xem-tuoi-lam-nha" }, { ten: tieuDe, duong: duongLamNha(x.n, x.ns) }]),
        ldHoiDap([{ hoi: tieuDe, dap: d.ket_luan.chu }, { hoi: `Tuổi ${x.ns} cưới năm ${x.n} có phạm Kim lâu không?`, dap: d.cuoi_hoi }]),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-tuoi-lam-nha" className="hover:underline">Xem tuổi làm nhà</Link></nav>
      <TieuDeMuc cap={1} nho={`Tuổi ${d.can_chi} · năm ${d.can_chi_nam_xay}`} lon={tieuDe} />
      <KetQuaLamNha d={d} />
      <p className="mt-6 text-sm text-fg-muted">Tính cho chính xác theo ngày sinh của bạn: <Link href="/xem-tuoi-lam-nha" className="text-gold underline">công cụ xem tuổi làm nhà</Link> ·{" "}
        <Link href={duongLamNha(x.n + 1, x.ns)} className="text-gold underline">năm {x.n + 1}</Link></p>
      <CungTuoi namSinh={x.ns} canChi={d.can_chi} namAm={namAm} bo="lam_nha" />
    </div>
  );
}
