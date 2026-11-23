// SEO-L1 — "Tuổi xông đất Tết {năm}": bảng gia chủ sinh 1960–2005 → 3 tuổi hợp nhất (engine ghép từ đúng hàm của trang
// từng tuổi), tuổi nên tránh, giờ hoàng đạo mùng 1. Index cùng cửa sổ trang con (Tết năm nay + Tết tới).
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang, urlDayDu } from "@/lib/seo";
import { NAM_BANG_TU, docNamBang, duongLamNhaNam, duongXongDat, duongXongDatNam, namAmHienTai, xongDatNamCongKhai } from "@/lib/tuoi-dan-gian";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN, ngayNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { tenTheo } from "@/lib/ten-hien";
import { CHU_XONG_DAT_NAM } from "@/lib/chu/trang-con";
import { NutChiaSeXongDat } from "@/components/chia-se/NutChiaSeXongDat";

type P = { params: Promise<{ nam: string }> };

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: n };
  const namAm = await namAmHienTai(), index = n === namAm || n === namAm + 1;
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("xdn.seo_tieu_de", b), moTa: c("xdn.seo_mo_ta", b), duongVi: duongXongDatNam(n), noindex: !index });
  const m = themHreflangVi(metaTrang({ tieuDe: c("xdn.seo_tieu_de", b), moTa: c("xdn.seo_mo_ta", b),
    duong: duongXongDatNam(n), anh: `/og/xong-dat?nam=${n}` }), duongXongDatNam(n));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const d = await xongDatNamCongKhai(n);
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongXongDatNam(n), bien = { nam: String(n), can_chi: d.nam.can_chi };
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu), ten = tenTheo(d.ten_hien, en);
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_XONG_DAT_NAM, nd.chu, ngonNgu);
  const L = (x: string) => lienNN(en, x), dHien = L(duong)!;
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        { ...(en ? ldTrangWebEn({ duong: dHien, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["First-footing (xong dat)", `${d.nam.can_chi} Lunar New Year`] })
            : ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Xông đất", `Tết ${d.nam.can_chi}`] })),
          mainEntity: { "@type": "ItemList", numberOfItems: d.ds.length,
            itemListElement: d.ds.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(L(duongXongDat(n, x.nam_sinh))!), name: t("xdn.ld_muc", { can_chi: x.can_chi, nam_sinh: x.nam_sinh }) })) } },
        en ? ldDuongDan([{ ten: "Hieuban", duong: "/en" }, { ten: t("xdn.ve"), duong: L("/tuoi-xong-dat")! }, { ten: t("xdn.tet_n", { nam: n }), duong: dHien }])
          : ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Tuổi xông đất", duong: "/tuoi-xong-dat" }, { ten: `Tết ${n}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label={t("c.duong_dan")} className="mb-2 text-sm text-fg-muted"><Link href={L("/tuoi-xong-dat")!} className="hover:underline">{t("xdn.ve")}</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label={t("c.tra_loi_nhanh")} className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">{t("c.tra_loi_nhanh")}</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
        {!en && <NutChiaSeXongDat nam={n} canChi={d.nam.can_chi} nho className="mt-4" />}
      </section>
      {/* QC-G: khách đến từ quảng cáo "tuổi xông đất" → lối sang bài đọc năm của chính họ (trang thu Sao mùa Tết). */}
      {!en && <p className="mt-4"><Link href={`/thoi-gian-toi?nam=${n}`} data-testid="xd-sang-thoi-gian-toi"
        className="inline-flex min-h-11 items-center rounded-full border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10">
        Xem năm {n} của riêng bạn theo ngày sinh →</Link></p>}

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line/70 p-4 text-sm">
          <p className="font-medium text-fg">{tp("xdn.mung_mot", { ngay: ngayNN(en, d.mung_mot.ngay), can_chi: d.mung_mot.can_chi })}</p>
          <p className="mt-1 text-fg-muted">{tp("xdn.gio", { gio: d.mung_mot.gio_hoang_dao.map((g) => `${ten("chi", g.chi)} (${g.khung})`).join(", ") })}</p>
          <p className="mt-1 text-fg-muted">{tp("xdn.huong", { hy: ten("huong", d.mung_mot.huong.hy_than), tai: ten("huong", d.mung_mot.huong.tai_than) })}</p>
        </div>
        <div className="rounded-xl border border-line/70 p-4 text-sm">
          <p className="font-medium text-fg">{t("xdn.nen_tranh")}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-fg-muted">{d.nen_tranh.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="bang-nam">
        <h2 id="bang-nam" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("bang.mo_ta", bien)}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{t("xdn.cot_chu")}</th><th>{t("xdn.cot_hop")}</th></tr></thead>
            <tbody>
              {d.ds.map((x) => (
                <tr key={x.nam_sinh} className="border-t border-line/50">
                  <td className="py-2 pr-3"><Link href={L(duongXongDat(n, x.nam_sinh))!} className="text-gold underline decoration-gold/40 underline-offset-2">{x.nam_sinh}</Link> <span className="text-fg-faint">{x.can_chi}</span></td>
                  <td className="text-fg-muted">{x.tuoi_hop.length ? x.tuoi_hop.map((h) => `${h.nam_sinh} (${h.can_chi})`).join(", ") : t("xdn.xem_chi_tiet")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">{t("c.hoi_dap")}</h2>
        <dl className="mt-4 space-y-4">
          {d.hoi_dap.map((h) => (
            <div key={h.hoi} className="rounded-xl border border-line/70 p-4">
              <dt className="font-medium text-fg">{h.hoi}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      {!en && <AnhTomTat kieu="xong_dat" nam={n} />}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href={L("/tuoi-xong-dat")!} className="text-gold underline">{c("cuoi.link", bien)}</Link></p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {n > NAM_BANG_TU && <Link href={L(duongXongDatNam(n - 1))!} className="text-gold underline">{tp("xdn.tet_n", { nam: n - 1 })}</Link>}
        {n < 2099 && <Link href={L(duongXongDatNam(n + 1))!} className="text-gold underline">{tp("xdn.tet_n", { nam: n + 1 })}</Link>}
        <Link href={L(duongLamNhaNam(n))!} className="text-gold underline">{tp("xdn.lam_nha", { nam: n })}</Link>
      </p>
      <p className="mt-6 text-xs text-fg-faint">{d.luu_y}</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
