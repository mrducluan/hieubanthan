// Ý3 (2026-11-09) — "Sinh ở {nước}: lập lá số thế nào" — MỘT trang mỗi nước, mọi con số do engine tính (`/v1/sinh-nuoc-ngoai/{ma}`):
// múi giờ chuẩn + mốc đổi giờ mùa hè năm nay từng thành phố, lịch sử giờ mùa hè theo năm sinh mẫu, lệch giờ mặt trời theo kinh
// độ, Nam bán cầu → công tắc "Mùa nơi sinh", ngày lịch âm Việt – Trung lệch trong năm. Web chỉ hiển thị; chữ sửa ở CMS (mẫu cụm).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { DuongDan } from "@/components/khung/DuongDan";
import { HoiDapHien } from "@/components/seo/TraLoiNhanh";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { CHU_NAM_TUOI_EN, chuNamTuoi, lienNN, ngayNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { taoChu } from "@/lib/chu-trang";
import { CHU_SINH_NN } from "@/lib/chu/trang-con";
import { DUONG_SINH_NN, docMaNuoc, duongSinhNN, nuocSinhNN } from "@/lib/sinh-nuoc-ngoai";

type P = { params: Promise<{ nuoc: string }> };

export async function generateMetadata(p: P): Promise<Metadata> {
  const ma = docMaNuoc((await p.params).nuoc);
  const d = ma ? await nuocSinhNN(ma) : null;
  if (!d) return {};
  const utc = d.mui_gio.join(", ");
  const { ngonNgu } = await ngonNguMayChu();
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: chuNamTuoi("en").c("nn.nuoc_seo_tieu_de", { ten: d.ten }),
    moTa: CHU_NAM_TUOI_EN["nn.nuoc_seo_mo_ta"].replace("{ten}", d.ten).replace("{utc}", utc), duongVi: duongSinhNN(ma!) });
  return themHreflangVi(metaTrang({
    tieuDe: `Sinh ở ${d.ten}: lập lá số Tử vi, Bát tự theo giờ nào?`,
    moTa: `Người Việt sinh ở ${d.ten}: nhập giờ địa phương trên giấy khai sinh; múi giờ chuẩn ${utc}, ${d.cong_tac.gio_mat_troi ? "có nơi lệch giờ mặt trời lớn, " : ""}${d.thanh_pho.some((t) => t.gio_mua_he) ? "giờ mùa hè tự trừ" : "không giờ mùa hè"}; ${d.lich_am.ngay_lech.length ? `${d.lich_am.ngay_lech.length} ngày lịch âm Việt – Trung lệch năm ${d.nam}` : `lịch âm Việt – Trung không lệch năm ${d.nam}`}.`,
    duong: duongSinhNN(ma!), md: `${duongSinhNN(ma!)}.md`,
  }), duongSinhNN(ma!));
}

const dau = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export default async function Page(p: P) {
  const ma = docMaNuoc((await p.params).nuoc);
  if (!ma) notFound();
  const d = await nuocSinhNN(ma);
  if (!d) notFound();
  const duong = duongSinhNN(ma);
  const bien = { nuoc: ma, ten: d.ten, nam: String(d.nam) };
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu), chu = t, L = (x: string) => lienNN(en, x);
  const nd = await noiDungTheo(en, duong, bien);
  const c = taoChu(CHU_SINH_NN, nd.chu, ngonNgu);
  const tieuDe = c("dau.tieu_de", bien);
  const dHien = L(duong)!;
  const duongDan = en ? [{ ten: "Hieuban", duong: "/en" }, { ten: t("nn.ten"), duong: L(DUONG_SINH_NN)! }, { ten: d.ten, duong: dHien }]
    : [{ ten: "Trang chủ", duong: "/" }, { ten: "Huyền học", duong: "/huyen-hoc" }, { ten: "Sinh ở nước ngoài", duong: DUONG_SINH_NN }, { ten: d.ten, duong }];
  const dmy = (iso: string) => ngayNN(en, iso);
  const coHe = d.thanh_pho.some((t) => t.gio_mua_he);
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: dHien, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [t("nn.nuoc_ld_ve", { ten: d.ten }), "Birthplace time zone", "Daylight saving time", "Zi Wei Dou Shu chart", "BaZi"] })
          : ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Người Việt ở ${d.ten}`, "Múi giờ nơi sinh", "Giờ mùa hè", "Lá số Tử vi", "Bát tự"] }),
        ldDuongDan(duongDan), ldHoiDap(d.hoi_dap),
      )} />
      <DuongDan ds={duongDan} className="mb-2" nhan={t("c.duong_dan")} />
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label={t("c.tra_loi_nhanh")} className="rounded-2xl border border-gold/30 bg-gold/5 p-5" data-testid="tra-loi-nhanh">
        <p className="eyebrow">{t("c.tra_loi_nhanh")}</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>
      {d.ghi_chu_nuoc && <p className="mt-4 text-sm leading-relaxed text-fg-muted" data-testid="ghi-chu-nuoc">{d.ghi_chu_nuoc}</p>}

      <section className="mt-8" aria-labelledby="bang-tp">
        <h2 id="bang-tp" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{d.cau.mui_gio} {d.cau.gio_mua_he}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm" data-testid="bang-thanh-pho">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{t("nn.cot_tp")}</th><th className="pr-3">{t("nn.cot_chuan")}</th><th className="pr-3">{tp("nn.cot_he", { nam: d.nam })}</th><th className="pr-3">{t("nn.cot_lech")}</th><th>{t("nn.cot_xem_them")}</th></tr></thead>
            <tbody>
              {d.thanh_pho.map((t) => (
                <tr key={t.ma} id={`tp-${t.ma}`} className="scroll-mt-24 border-t border-line/50 align-top">
                  <td className="py-2 pr-3 text-fg">{t.ten}<span className="block text-xs text-fg-faint">{t.zone.replace(/_/g, " ")}</span></td>
                  <td className="pr-3 tabular-nums">{t.nhan_utc}</td>
                  <td className="pr-3 text-fg-muted">{t.gio_mua_he
                    ? t.doi_gio.map((m) => <span key={m.ngay} className="block whitespace-nowrap">{dmy(m.ngay)} {m.gio} → {m.sang}</span>)
                    : chu("nn.khong")}</td>
                  <td className="pr-3 tabular-nums text-fg-muted">{t.lech_mat_troi_phut === null ? "—" : chu("nn.phut", { n: dau(t.lech_mat_troi_phut) })}</td>
                  <td className="text-xs">
                    {t.canh_bao_mat_troi && <span className="block text-gold">{chu("nn.tp_mat_troi")}</span>}
                    {t.nam_ban_cau_kha_dung && <span className="block text-gold">{chu("nn.tp_mua")}</span>}
                    {!t.canh_bao_mat_troi && !t.nam_ban_cau_kha_dung && <span className="text-fg-faint">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-fg-faint">{chu("nn.lech_chu_thich")}</p>
      </section>

      {(d.cong_tac.gio_mat_troi || d.cong_tac.mua_noi_sinh) && (
        <section className="mt-8 rounded-2xl border border-line/70 p-5" aria-labelledby="cong-tac" data-testid="khoi-cong-tac">
          <h2 id="cong-tac" className="text-xl">{tp("nn.hai_cach", { ten: d.ten })}</h2>
          {d.cong_tac.gio_mat_troi && <p className="mt-2 text-sm leading-relaxed text-fg-muted"><b className="text-fg">{chu("nn.hai_cach_mt")}</b> {d.cau.mat_troi}</p>}
          {d.cong_tac.mua_noi_sinh && <p className="mt-2 text-sm leading-relaxed text-fg-muted"><b className="text-fg">{chu("nn.hai_cach_mua")}</b> {d.cau.mua}</p>}
          <p className="mt-3 text-sm">{chu("nn.cong_tac") + " "}<Link href={L("/bat-tu#truong-phai-bat-tu")!} className="text-gold underline">{chu("nn.cuoi_bat_tu")}</Link>{d.cong_tac.gio_mat_troi && <> · <Link href={L("/tu-vi#truong-phai")!} className="text-gold underline">{chu("nn.cuoi_tu_vi")}</Link></>}{". " + chu("nn.cong_tac_ket")}</p>
        </section>
      )}

      <section className="mt-8" aria-labelledby="lich-su">
        <h2 id="lich-su" className="text-2xl">{c("lich_su.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{chu("nn.ls_mo_ta")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm" data-testid="bang-lich-su">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{chu("nn.cot_vung")}</th>{d.nam_mau.map((n) => <th key={n} className="pr-3">{n}</th>)}</tr></thead>
            <tbody>
              {d.lich_su_gio_mua_he.map((z) => (
                <tr key={z.zone} className="border-t border-line/50 align-top">
                  <td className="py-2 pr-3 text-fg">{z.zone.replace(/_/g, " ")}<span className="block text-xs text-fg-faint">{d.thanh_pho.filter((t) => t.zone === z.zone).map((t) => t.ten.split(" (")[0]).slice(0, 3).join(", ")}</span></td>
                  {z.cac_nam.map((o) => (
                    <td key={o.nam} className="pr-3 text-xs text-fg-muted">
                      <span className={o.co ? "text-fg" : ""}>{o.co ? chu("nn.co") : chu("nn.khong_hoa")}</span>
                      <span className="block text-fg-faint">UTC{o.utc_chuan >= 0 ? "+" : "−"}{Math.abs(o.utc_chuan)}</span>
                      {o.moc.map((m) => <span key={m} className="block whitespace-nowrap">{m}</span>)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="lich-am">
        <h2 id="lich-am" className="text-2xl">{c("lich_am.tieu_de", bien)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted" data-testid="lich-am-lech">{d.cau.lich_am} {d.cau.tet}</p>
        {d.lich_am.ngay_lech.length > 0 && (
          <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            {d.lich_am.ngay_lech.map((x) => <li key={x.ngay} className="rounded-lg border border-line/60 px-3 py-1.5 text-fg-muted"><b className="text-fg">{dmy(x.ngay)}</b>{tp("nn.lech_ngay_hai_cham", { viet: x.am_viet, trung: x.am_trung })}</li>)}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="huong-dan">
        <h2 id="huong-dan" className="text-2xl">{c("huong_dan.tieu_de", bien)}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-fg-muted">{d.huong_dan.map((h) => <li key={h}>{h}</li>)}</ol>
        <p className="mt-3 text-sm text-fg-muted">{d.cau.ket}</p>
        <Link href={L("/bat-tu")!} className="mt-3 inline-flex rounded-full bg-gold px-5 py-2 text-sm font-medium text-bg hover:opacity-90" data-testid="nut-lap-la-so">{c("cuoi.nut", bien)}</Link>
      </section>

      <div className="mt-8"><HoiDapHien ds={d.hoi_dap} tieuDe={chu("c.hoi_dap")} /></div>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-6 text-sm text-fg-muted">{chu("nn.nuoc_khac") + " "}<Link href={L(DUONG_SINH_NN)!} className="text-gold underline">{chu("nn.nuoc_khac_link")}</Link>{". " + chu("nn.nguon")}</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-6" />
    </article>
  );
}
