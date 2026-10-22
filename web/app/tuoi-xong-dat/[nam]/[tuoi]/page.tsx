// TDG-1 — trang "Tuổi xông đất năm {năm} cho gia chủ sinh {năm sinh}" (engine dựng). Index: Tết năm nay + Tết tới.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KetQuaXongDat } from "@/components/tuoi/KetQuaTuoi";
import { CungTuoi } from "@/components/tuoi/CungTuoi";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNam, docTuoi, duongXongDat, duongXongDatNam, namAmHienTai, xongDatCongKhai, xongDatIndex, NAM_BANG_TU } from "@/lib/tuoi-dan-gian";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";
import { CHU_XONG_DAT_CON } from "@/lib/chu/trang-con";

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
  const [d, namAm] = await Promise.all([xongDatCongKhai(x.n, x.ns), namAmHienTai()]);
  if (!d) throw new Error("engine không phản hồi");
  // ND-7: mẫu cụm "/tuoi-xong-dat/{nam}/tuoi-{nam_sinh}" — khối + chữ sửa được ở CMS.
  const duong = duongXongDat(x.n, x.ns);
  const bien = { nam: String(x.n), nam_sinh: String(x.ns), can_chi: d.chu.can_chi, can_chi_nam: d.nam.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_XONG_DAT_CON, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: duongXongDat(x.n, x.ns), ten: tieuDe, about: ["Xông đất", `Tết ${d.nam.can_chi}`, `Tuổi ${d.chu.can_chi}`] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Tuổi xông đất", duong: "/tuoi-xong-dat" }, ...(x.n >= NAM_BANG_TU ? [{ ten: `Tết ${x.n}`, duong: duongXongDatNam(x.n) }] : []), { ten: tieuDe, duong: duongXongDat(x.n, x.ns) }]),
        ldHoiDap([{ hoi: `Gia chủ sinh năm ${x.ns} nên chọn tuổi nào xông đất năm ${x.n}?`,
          dap: d.tuoi_hop.slice(0, 4).map((t) => `${t.nam_sinh} (${t.can_chi})`).join(", ") + "." },
          { hoi: "Nên tránh tuổi nào?", dap: d.nen_tranh.join("; ") + "." }]),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/tuoi-xong-dat" className="hover:underline">Tuổi xông đất</Link>{x.n >= NAM_BANG_TU && <> › <Link href={duongXongDatNam(x.n)} className="hover:underline">Tết {x.n}</Link></>}</nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <KetQuaXongDat d={d} />
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-6 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href="/tuoi-xong-dat" className="text-gold underline">{c("cuoi.link", bien)}</Link></p>
      <CungTuoi namSinh={x.ns} canChi={d.chu.can_chi} namAm={namAm} bo="xong_dat" />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}
