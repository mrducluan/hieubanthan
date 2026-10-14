// TDG-1 — trang "Tuổi xông đất năm {năm} cho gia chủ sinh {năm sinh}" (engine dựng). Index: Tết năm nay + Tết tới.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KetQuaXongDat } from "@/components/tuoi/KetQuaTuoi";
import { goiLd, ldDuongDan, ldHoiDap, metaTrang } from "@/lib/seo";
import { docNam, docTuoi, duongXongDat, namAmHienTai, xongDatCongKhai, xongDatIndex } from "@/lib/tuoi-dan-gian";

type P = { params: Promise<{ nam: string; tuoi: string }> };

async function doc(p: P) {
  const { nam, tuoi } = await p.params;
  const n = docNam(nam), ns = docTuoi(tuoi);
  return n && ns && ns <= n ? { n, ns } : null;
}

export async function generateMetadata(p: P): Promise<Metadata> {
  const x = await doc(p);
  if (!x) return {};
  const m = metaTrang({ tieuDe: `Tuổi xông đất năm ${x.n} cho gia chủ sinh năm ${x.ns}`,
    moTa: `Gia chủ sinh năm ${x.ns}: tuổi hợp xông đất Tết ${x.n}, tuổi nên tránh, giờ hoàng đạo và hướng xuất hành ngày mùng 1.`,
    duong: duongXongDat(x.n, x.ns) });
  return xongDatIndex(x.n, await namAmHienTai(), x.ns) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const x = await doc(p);
  if (!x) notFound();
  const d = await xongDatCongKhai(x.n, x.ns);
  if (!d) throw new Error("engine không phản hồi");
  const tieuDe = `Tuổi xông đất năm ${x.n} cho gia chủ sinh năm ${x.ns}`;
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Tuổi xông đất", duong: "/tuoi-xong-dat" }, { ten: tieuDe, duong: duongXongDat(x.n, x.ns) }]),
        ldHoiDap([{ hoi: `Gia chủ sinh năm ${x.ns} nên chọn tuổi nào xông đất năm ${x.n}?`,
          dap: d.tuoi_hop.slice(0, 4).map((t) => `${t.nam_sinh} (${t.can_chi})`).join(", ") + "." },
          { hoi: "Nên tránh tuổi nào?", dap: d.nen_tranh.join("; ") + "." }]),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/tuoi-xong-dat" className="hover:underline">Tuổi xông đất</Link></nav>
      <TieuDeMuc cap={1} nho={`Tết ${d.nam.can_chi} · gia chủ ${d.chu.can_chi}`} lon={tieuDe} />
      <KetQuaXongDat d={d} />
      <p className="mt-6 text-sm text-fg-muted">Tính theo ngày sinh đầy đủ của gia chủ: <Link href="/tuoi-xong-dat" className="text-gold underline">công cụ xem tuổi xông đất</Link></p>
    </div>
  );
}
