// NAM-1 — "Sinh con năm {năm} hợp tuổi bố mẹ nào?": tuổi bố/mẹ (tuổi mụ 22–52) × tuổi con theo địa chi (nhóm hợp / bình
// thường / dân gian hay nhắc cân nhắc — không điểm số) + quan hệ nạp âm để đọc thêm. Engine `/v1/nam/{nam}/sinh-con`.
// Ranh giới: sức khoẻ của mẹ + lời bác sĩ đi trước con giáp; không khuyên chọn ngày sinh mổ theo tuổi.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import { MoiXemRieng } from "@/components/nam/MoiXemRieng";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNamBang, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { duongCuoiHoi, duongNam, duongSinhCon, namIndex, sinhConCongKhai } from "@/lib/nam";
import { duongTrang, slugEnCua } from "@/lib/kien-thuc";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN, ngayNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { tenTheo } from "@/lib/ten-hien";
import { CHU_NAM_SINH_CON } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };
const MAU = { hop: "text-jade", binh: "text-fg-muted", luu_y: "text-gold" } as const;

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: n };
  const index = namIndex(n, await namAmHienTai());
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("sc.seo_tieu_de", b), moTa: c("sc.seo_mo_ta", b), duongVi: duongSinhCon(n), noindex: !index });
  const m = themHreflangVi(metaTrang({ tieuDe: c("sc.seo_tieu_de", b), moTa: c("sc.seo_mo_ta", b),
    duong: duongSinhCon(n), anh: anhBai({ tieuDe: `Sinh con năm ${n}`, mang: "lich" }) }), duongSinhCon(n));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const d = await sinhConCongKhai(n);
  if (!d) throw new Error("engine không phản hồi");
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu), ten = tenTheo(d.ten_hien, en);
  const duong = duongSinhCon(n), bien = { nam: String(n), can_chi: d.con.can_chi };
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_NAM_SINH_CON, nd.chu, ngonNgu);
  const L = (x: string) => lienNN(en, x), nb = { nam: n };
  const menhVi = duongTrang("menh_nam", `sinh-nam-${n}-menh-gi`);
  const slugMenhEn = en && n <= 2027 ? await slugEnCua("menh_nam", `sinh-nam-${n}-menh-gi`) : null;
  const menh = n > 2027 ? null : en ? (slugMenhEn ? L(menhVi.replace(/\/[^/]+$/, `/${slugMenhEn}`)) : null) : menhVi;
  const hopDoi = L("/hop-doi");
  const tieuDe = c("dau.tieu_de", bien);
  const nhom = (["hop", "binh", "luu_y"] as const).map((k) => ({ k, ds: d.ds.filter((x) => x.nhom === k) }));
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: L(duong)!, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`${d.con.can_chi} year`, "Compatible signs", "Having a baby"] })
          : ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Năm ${d.con.can_chi}`, "Tuổi hợp", "Sinh con"] }),
        en ? ldDuongDan([{ ten: "Hieuban", duong: "/en" }, { ten: t("muc.ten"), duong: L("/nam")! }, { ten: String(n), duong: L(duongNam(n))! }, { ten: t("sc.ld_ten"), duong: L(duong)! }])
          : ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm", duong: "/nam" }, { ten: `Năm ${n}`, duong: duongNam(n) }, { ten: "Sinh con", duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label={t("c.duong_dan")} className="mb-2 text-sm text-fg-muted"><Link href={L(duongNam(n))!} className="hover:underline">{tp("c.nam_n", nb)}</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label={t("c.tra_loi_nhanh")} className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">{t("c.tra_loi_nhanh")}</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>
      <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([[t("sc.o_tuoi_con"), d.con.can_chi], [t("sc.o_menh"), ten("nap_am", d.con.nap_am)], [t("sc.o_tu"), ngayNN(en, d.con.tu)], [t("sc.o_den"), ngayNN(en, d.con.den)]] as const).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line/70 p-3"><dt className="text-xs text-fg-faint">{k}</dt><dd className="mt-0.5 text-sm text-fg">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-fg-faint">{tp("sc.truoc_tet", { tu: ngayNN(en, d.con.tu), can_chi: d.truoc_tet.can_chi, menh: ten("nap_am", d.truoc_tet.nap_am) })}</p>

      <section className="mt-8" aria-labelledby="bang">
        <h2 id="bang" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("bang.mo_ta", bien)}</p>
        {nhom.map(({ k, ds }) => ds.length > 0 && (
          <div key={k} className="mt-5">
            <h3 className={`text-lg ${MAU[k]}`}>{ds[0]!.nhom_nhan}</h3>
            <p className="mt-0.5 text-sm text-fg-muted">{d.loi_nhom[k]}</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm sm:min-w-[30rem]" data-testid={`bang-${k}`}>
                <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{t("sc.cot_bo_me")}</th><th className="pr-3">{t("sc.cot_dia_chi")}</th><th className="hidden sm:table-cell">{t("sc.cot_menh")}</th></tr></thead>
                <tbody>{ds.map((x) => (
                  <tr key={x.nam_sinh} className="border-t border-line/50">
                    <td className="py-2 pr-3 text-fg">{x.nam_sinh} <span className="text-fg-faint">{x.can_chi}</span>
                      <span className="block text-xs text-fg-faint sm:hidden">{ten("nap_am", x.nap_am)} · {x.nap_am_nhan.toLowerCase()}</span></td>
                    <td className="pr-3 text-fg-muted">{x.chi_nhan}</td>
                    <td className="hidden text-fg-muted sm:table-cell">{ten("nap_am", x.nap_am)} · {x.nap_am_nhan.toLowerCase()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
      <p className="mt-4 text-sm text-fg-muted">{t("sc.doc_them")}{" "}
        {menh && <><Link href={menh} className="text-gold underline">{tp("sc.link_menh", nb)}</Link> · </>}
        <Link href={L(duongCuoiHoi(n))!} className="text-gold underline">{tp("sc.link_cuoi", nb)}</Link>{hopDoi && <> ·{" "}
        <Link href={hopDoi} className="text-gold underline">{t("sc.link_hop_doi")}</Link></>}</p>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">{t("c.hoi_dap")}</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      {!en && <AnhTomTat kieu="sinh_con" nam={n} />}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">{t("sc.cuoi") + " "}<Link href={L(duongNam(n))!} className="text-gold underline">{tp("muc.the_ten", { nam: n, can_chi: d.con.can_chi })}</Link>. <span data-testid="luu-y-tap-quan">{d.luu_y}</span></p>
      <MoiXemRieng trang="sinh_con" nam={n} className="mt-10" />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
