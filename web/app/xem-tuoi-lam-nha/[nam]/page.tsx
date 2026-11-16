// SEO-L1 — "Tuổi nào làm nhà, cưới hỏi năm {năm}?": bảng 46 tuổi 1960–2005 (Kim lâu, Hoang ốc, Tam tai) do engine ghép
// từ đúng hàm của từng tuổi; link xuống trang từng tuổi. Index cùng cửa sổ với trang con (năm âm hiện tại + năm sau).
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang, urlDayDu } from "@/lib/seo";
import { NAM_BANG_TU, docNamBang, duongHanNam, duongLamNha, duongLamNhaNam, duongXongDatNam, lamNhaNamCongKhai, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { CHU_LAM_NHA_NAM } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: n };
  const namAm = await namAmHienTai(), index = n === namAm || n === namAm + 1;   // cùng cửa sổ trang con
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("lnn.seo_tieu_de", b), moTa: c("lnn.seo_mo_ta", b), duongVi: duongLamNhaNam(n), noindex: !index });
  const m = themHreflangVi(metaTrang({ tieuDe: c("lnn.seo_tieu_de", b), moTa: c("lnn.seo_mo_ta", b),
    duong: duongLamNhaNam(n), anh: anhBai({ tieuDe: `Tuổi nào làm nhà năm ${n}?`, mang: "lich" }) }), duongLamNhaNam(n));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const [d, namAm] = await Promise.all([lamNhaNamCongKhai(n), namAmHienTai()]);
  if (!d) throw new Error("engine không phản hồi");   // → error.tsx (5xx), không để Google index trang lỗi
  const duong = duongLamNhaNam(n), bien = { nam: String(n), can_chi: d.can_chi };
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu);
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_LAM_NHA_NAM, nd.chu, ngonNgu);
  const L = (x: string) => lienNN(en, x), dHien = L(duong)!;
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        { ...(en ? ldTrangWebEn({ duong: dHien, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Kim Lau", "Hoang Oc", "Tam Tai", `${d.can_chi} year`] })
            : ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Kim lâu", "Hoang ốc", "Tam tai", `Năm ${d.can_chi}`] })),
          mainEntity: { "@type": "ItemList", numberOfItems: d.ds.length,
            itemListElement: d.ds.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(L(duongLamNha(n, x.nam_sinh))!), name: t("lnn.ld_muc", { can_chi: x.can_chi, nam_sinh: x.nam_sinh }) })) } },
        en ? ldDuongDan([{ ten: "Hieuban", duong: "/en" }, { ten: t("lnn.ve"), duong: L("/xem-tuoi-lam-nha")! }, { ten: String(n), duong: dHien }])
          : ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem tuổi làm nhà", duong: "/xem-tuoi-lam-nha" }, { ten: `Năm ${n}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label={t("c.duong_dan")} className="mb-2 text-sm text-fg-muted"><Link href={L("/xem-tuoi-lam-nha")!} className="hover:underline">{t("lnn.ve")}</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label={t("c.tra_loi_nhanh")} className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">{t("c.tra_loi_nhanh")}</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>

      <section className="mt-8" aria-labelledby="bang-nam">
        <h2 id="bang-nam" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("bang.mo_ta", bien)}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs text-fg-faint">
              <tr><th className="py-2 pr-3">{t("lnn.cot_nam_sinh")}</th><th className="pr-3">{t("kq.cot_tuoi_mu")}</th><th className="pr-3">{t("kq.cot_kim_lau")}</th><th className="pr-3">{t("kq.cot_hoang_oc")}</th><th className="pr-3">{t("kq.cot_tam_tai")}</th><th>{t("kq.cot_ket_luan")}</th></tr>
            </thead>
            <tbody>
              {d.ds.map((x) => (
                <tr key={x.nam_sinh} className="border-t border-line/50">
                  <td className="py-2 pr-3"><Link href={L(duongLamNha(n, x.nam_sinh))!} className="text-gold underline decoration-gold/40 underline-offset-2">{x.nam_sinh}</Link> <span className="text-fg-faint">{x.can_chi}</span></td>
                  <td className="pr-3">{x.tuoi_mu}</td>
                  <td className="pr-3">{x.kim_lau ?? "—"}</td>
                  <td className={`pr-3 ${x.hoang_oc_xau ? "text-cinnabar" : ""}`}>{x.hoang_oc}</td>
                  <td className="pr-3">{x.tam_tai ? t("c.nam_thu", { n: x.tam_tai }) : "—"}</td>
                  <td className={x.thuan ? "text-jade" : "text-fg-muted"}>{x.thuan ? t("kq.thuan") : t("kq.nen_can_nhac")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-fg-faint">{d.cach_tinh}</p>
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
      {!en && <AnhTomTat kieu="lam_nha" nam={n} />}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href={L("/xem-tuoi-lam-nha")!} className="text-gold underline">{c("cuoi.link", bien)}</Link></p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {n > NAM_BANG_TU && <Link href={L(duongLamNhaNam(n - 1))!} className="text-gold underline">{tp("lnn.nam_n", { nam: n - 1 })}</Link>}
        {n < 2099 && <Link href={L(duongLamNhaNam(n + 1))!} className="text-gold underline">{tp("lnn.nam_n", { nam: n + 1 })}</Link>}
        <Link href={L(duongHanNam(n))!} className="text-gold underline">{tp("lnn.han", { nam: n })}</Link>
        {n >= namAm && <Link href={L(duongXongDatNam(n))!} className="text-gold underline">{tp("lnn.xong_dat", { nam: n })}</Link>}
      </p>
      <p className="mt-6 text-xs text-fg-faint">{d.luu_y}</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
