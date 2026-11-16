// TDG-1 — trang "Tuổi {năm sinh} làm nhà năm {năm} được không" (engine dựng nội dung). Index: năm âm hiện tại + năm sau,
// năm sinh 1960–2005; ngoài cửa sổ vẫn xem được, noindex.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KetQuaLamNha } from "@/components/tuoi/KetQuaTuoi";
import { CungTuoi } from "@/components/tuoi/CungTuoi";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNam, docTuoi, duongLamNha, duongLamNhaNam, lamNhaCongKhai, lamNhaIndex, namAmHienTai, NAM_BANG_TU } from "@/lib/tuoi-dan-gian";
import { namTuoiSeo } from "@/lib/nam";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { slugEnCua } from "@/lib/kien-thuc";
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
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: x.n, nam_sinh: x.ns };
  const index = lamNhaIndex(x.n, await namTuoiSeo(), x.ns);
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("lnt.seo_tieu_de", b), moTa: c("lnt.seo_mo_ta", b), duongVi: duongLamNha(x.n, x.ns), noindex: !index });
  const m = themHreflangVi(metaTrang({ tieuDe: c("lnt.seo_tieu_de", b), moTa: c("lnt.seo_mo_ta", b), duong: duongLamNha(x.n, x.ns) }), duongLamNha(x.n, x.ns));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const x = await doc(p);
  if (!x) notFound();
  const [d, namAm, namSeo] = await Promise.all([lamNhaCongKhai(x.n, x.ns), namAmHienTai(), namTuoiSeo()]);
  if (!d) throw new Error("engine không phản hồi");
  // ND-7: mẫu cụm "/xem-tuoi-lam-nha/{nam}/tuoi-{nam_sinh}" — khối + chữ sửa được ở CMS.
  const duong = duongLamNha(x.n, x.ns);
  const bien = { nam: String(x.n), nam_sinh: String(x.ns), can_chi: d.can_chi, can_chi_nam: d.can_chi_nam_xay, nam_sau: String(x.n + 1) };
  const { ngonNgu } = await ngonNguMayChu(), { c: t, en } = chuNamTuoi(ngonNgu);
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_LAM_NHA_CON, nd.chu, ngonNgu);
  const L = (s: string) => lienNN(en, s), dHien = L(duong)!;
  const menhEn = en && x.ns >= 1950 && x.ns <= 2027 ? await slugEnCua("menh_nam", `sinh-nam-${x.ns}-menh-gi`) : null;
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: dHien, ten: tieuDe, tomTat: d.ket_luan.chu, about: ["Kim Lau", "Hoang Oc", "Tam Tai", `Born ${x.ns} (${d.can_chi})`] })
          : ldTrangWeb({ duong: duongLamNha(x.n, x.ns), ten: tieuDe, tomTat: d.ket_luan.chu, about: ["Kim lâu", "Hoang ốc", "Tam tai", `Tuổi ${d.can_chi}`] }),
        en ? ldDuongDan([{ ten: "Hieuban", duong: "/en" }, { ten: t("lnn.ve"), duong: L("/xem-tuoi-lam-nha")! }, ...(x.n >= NAM_BANG_TU ? [{ ten: String(x.n), duong: L(duongLamNhaNam(x.n))! }] : []), { ten: tieuDe, duong: dHien }])
          : ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem tuổi làm nhà", duong: "/xem-tuoi-lam-nha" }, ...(x.n >= NAM_BANG_TU ? [{ ten: `Năm ${x.n}`, duong: duongLamNhaNam(x.n) }] : []), { ten: tieuDe, duong: duongLamNha(x.n, x.ns) }]),
        ldHoiDap([{ hoi: tieuDe, dap: d.tra_loi_nhanh ?? d.ket_luan.chu }, { hoi: t("lnt.hoi_cuoi", { nam_sinh: x.ns, nam: x.n }), dap: d.cuoi_hoi }]),
      )} />
      <nav aria-label={t("c.duong_dan")} className="mb-2 text-sm text-fg-muted"><Link href={L("/xem-tuoi-lam-nha")!} className="hover:underline">{t("lnn.ve")}</Link>{x.n >= NAM_BANG_TU && <> › <Link href={L(duongLamNhaNam(x.n))!} className="hover:underline">{chuNamTuoi(ngonNgu).p("lnn.nam_n", { nam: x.n })}</Link></>}</nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <div className="mb-6"><TraLoiNhanh chu={d.tra_loi_nhanh} en={en} /></div>
      <KetQuaLamNha d={d} trangTuoi ngonNgu={ngonNgu} />
      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      {!en && <AnhTomTat kieu="lam_nha_tuoi" nam={x.n} ns={x.ns} />}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-6 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href={L("/xem-tuoi-lam-nha")!} className="text-gold underline">{c("cuoi.link", bien)}</Link> ·{" "}
        <Link href={L(duongLamNha(x.n + 1, x.ns))!} className="text-gold underline">{c("cuoi.nam_sau", bien)}</Link></p>
      <CungTuoi namSinh={x.ns} canChi={d.can_chi} namSeo={namSeo} namTet={namAm + 1} boQua={duongLamNha(x.n, x.ns)} ngonNgu={ngonNgu} menhEn={menhEn} />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
