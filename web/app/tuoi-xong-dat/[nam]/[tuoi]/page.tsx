// TDG-1 — trang "Tuổi xông đất năm {năm} cho gia chủ sinh {năm sinh}" (engine dựng). Index: Tết năm nay + Tết tới.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KetQuaXongDat } from "@/components/tuoi/KetQuaTuoi";
import { CungTuoi } from "@/components/tuoi/CungTuoi";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNam, docTuoi, duongHanNam, duongLamNha, duongXongDat, duongXongDatNam, namAmHienTai, xongDatCongKhai, xongDatIndex, NAM_BANG_TU } from "@/lib/tuoi-dan-gian";
import { namTuoiSeo } from "@/lib/nam";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { duongNgay } from "@/lib/hoang-lich";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { slugEnCua } from "@/lib/kien-thuc";
import { CHU_XONG_DAT_CON } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string; tuoi: string }> };

async function doc(p: P) {
  const { nam, tuoi } = await p.params;
  const n = docNam(nam), ns = docTuoi(tuoi);
  return n && ns && ns <= n ? { n, ns } : null;
}

async function metaGoc(p: P): Promise<Metadata> {
  const x = await doc(p);
  if (!x) return {};
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: x.n, nam_sinh: x.ns };
  const index = xongDatIndex(x.n, await namAmHienTai(), x.ns);
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("xdt.seo_tieu_de", b), moTa: c("xdt.seo_mo_ta", b), duongVi: duongXongDat(x.n, x.ns), noindex: !index });
  const m = themHreflangVi(metaTrang({ tieuDe: c("xdt.seo_tieu_de", b), moTa: c("xdt.seo_mo_ta", b), duong: duongXongDat(x.n, x.ns) }), duongXongDat(x.n, x.ns));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const x = await doc(p);
  if (!x) notFound();
  const [d, namAm, namSeo] = await Promise.all([xongDatCongKhai(x.n, x.ns), namAmHienTai(), namTuoiSeo()]);
  if (!d) throw new Error("engine không phản hồi");
  // ND-7: mẫu cụm "/tuoi-xong-dat/{nam}/tuoi-{nam_sinh}" — khối + chữ sửa được ở CMS.
  const duong = duongXongDat(x.n, x.ns);
  const bien = { nam: String(x.n), nam_sinh: String(x.ns), can_chi: d.chu.can_chi, can_chi_nam: d.nam.can_chi };
  const { ngonNgu } = await ngonNguMayChu(), { c: t, en } = chuNamTuoi(ngonNgu);
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_XONG_DAT_CON, nd.chu, ngonNgu);
  const L = (s: string) => lienNN(en, s), dHien = L(duong)!;
  const menhEn = en && x.ns >= 1950 && x.ns <= 2027 ? await slugEnCua("menh_nam", `sinh-nam-${x.ns}-menh-gi`) : null;
  const xemThem = [
    { href: L(duongNgay(d.mung_mot.ngay)), chu: c("xem.mung_mot", bien) },
    { href: L(duongHanNam(x.n)), chu: c("xem.han_nam", bien) },
    { href: L(duongLamNha(x.n, x.ns)), chu: c("xem.lam_nha", bien) },
    ...(x.n >= NAM_BANG_TU ? [{ href: L(duongXongDatNam(x.n)), chu: c("xem.bang_nam", bien) }] : []),
  ].filter((v): v is { href: string; chu: string } => Boolean(v.href));
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: dHien, ten: tieuDe, about: ["First-footing (xong dat)", `${d.nam.can_chi} Lunar New Year`, `Host born ${x.ns} (${d.chu.can_chi})`] })
          : ldTrangWeb({ duong: duongXongDat(x.n, x.ns), ten: tieuDe, about: ["Xông đất", `Tết ${d.nam.can_chi}`, `Tuổi ${d.chu.can_chi}`] }),
        en ? ldDuongDan([{ ten: "Hieuban", duong: "/en" }, { ten: t("xdn.ve"), duong: L("/tuoi-xong-dat")! }, ...(x.n >= NAM_BANG_TU ? [{ ten: t("xdn.tet_n", { nam: x.n }), duong: L(duongXongDatNam(x.n))! }] : []), { ten: tieuDe, duong: dHien }])
          : ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Tuổi xông đất", duong: "/tuoi-xong-dat" }, ...(x.n >= NAM_BANG_TU ? [{ ten: `Tết ${x.n}`, duong: duongXongDatNam(x.n) }] : []), { ten: tieuDe, duong: duongXongDat(x.n, x.ns) }]),
        ldHoiDap([{ hoi: t("xdt.hoi_1", { nam_sinh: x.ns, nam: x.n }),
          dap: d.tuoi_hop.slice(0, 4).map((t) => `${t.nam_sinh} (${t.can_chi})`).join(", ") + "." },
          { hoi: t("xdt.hoi_2"), dap: d.nen_tranh.join("; ") + "." }]),
      )} />
      <nav aria-label={t("c.duong_dan")} className="mb-2 text-sm text-fg-muted"><Link href={L("/tuoi-xong-dat")!} className="hover:underline">{t("xdn.ve")}</Link>{x.n >= NAM_BANG_TU && <> › <Link href={L(duongXongDatNam(x.n))!} className="hover:underline">{chuNamTuoi(ngonNgu).p("xdn.tet_n", { nam: x.n })}</Link></>}</nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <div className="mb-6"><TraLoiNhanh chu={d.tra_loi_nhanh} en={en} /></div>
      <KetQuaXongDat d={d} trangTuoi ngonNgu={ngonNgu} />
      {/* SEO-M: link chéo tới các trang cùng năm / cùng tuổi (trước đây chỉ 2 link trong nội dung chính). */}
      <nav aria-label={t("xdt.xem_them")} className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {xemThem.map((v) => <Link key={v.href} href={v.href} className="text-gold underline">{v.chu}</Link>)}
      </nav>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-6 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href={L("/tuoi-xong-dat")!} className="text-gold underline">{c("cuoi.link", bien)}</Link></p>
      <CungTuoi namSinh={x.ns} canChi={d.chu.can_chi} namSeo={namSeo} namTet={namAm + 1} boQua={duongXongDat(x.n, x.ns)} ngonNgu={ngonNgu} menhEn={menhEn} />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
