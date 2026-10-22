// TDG-1 — trang "Tuổi {năm sinh} làm nhà năm {năm} được không" (engine dựng nội dung). Index: năm âm hiện tại + năm sau,
// năm sinh 1960–2005; ngoài cửa sổ vẫn xem được, noindex.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KetQuaLamNha } from "@/components/tuoi/KetQuaTuoi";
import { goiLd, ldDuongDan, ldHoiDap, metaTrang } from "@/lib/seo";
import { docNam, docTuoi, duongLamNha, lamNhaCongKhai, lamNhaIndex, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_LAM_NHA_CON } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string; tuoi: string }> };

async function doc(p: P) {
  const { nam, tuoi } = await p.params;
  const n = docNam(nam), ns = docTuoi(tuoi);
  return n && ns && ns <= n ? { n, ns } : null;
}

async function metaGoc(p: P): Promise<Metadata> {
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
  const d = await lamNhaCongKhai(x.n, x.ns);
  if (!d) throw new Error("engine không phản hồi");
  // ND-7: mẫu cụm "/xem-tuoi-lam-nha/{nam}/tuoi-{nam_sinh}" — khối + chữ sửa được ở CMS.
  const duong = duongLamNha(x.n, x.ns);
  const bien = { nam: String(x.n), nam_sinh: String(x.ns), can_chi: d.can_chi, can_chi_nam: d.can_chi_nam_xay, nam_sau: String(x.n + 1) };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_LAM_NHA_CON, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem tuổi làm nhà", duong: "/xem-tuoi-lam-nha" }, { ten: tieuDe, duong: duongLamNha(x.n, x.ns) }]),
        ldHoiDap([{ hoi: tieuDe, dap: d.ket_luan.chu }, { hoi: `Tuổi ${x.ns} cưới năm ${x.n} có phạm Kim lâu không?`, dap: d.cuoi_hoi }]),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-tuoi-lam-nha" className="hover:underline">Xem tuổi làm nhà</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <KetQuaLamNha d={d} />
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-6 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href="/xem-tuoi-lam-nha" className="text-gold underline">{c("cuoi.link", bien)}</Link> ·{" "}
        <Link href={duongLamNha(x.n + 1, x.ns)} className="text-gold underline">{c("cuoi.nam_sau", bien)}</Link></p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
