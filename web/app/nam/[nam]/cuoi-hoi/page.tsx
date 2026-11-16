// NAM-1 — "Cưới năm {năm}: tuổi nào không phạm Kim lâu?" — Kim lâu theo tuổi mụ CÔ DÂU (chủ dự án chốt 2026-10-30),
// cô dâu tuổi mụ 20–45. Engine `/v1/nam/{nam}/cuoi-hoi`; web hiển thị + lối sang ngày tốt cưới hỏi từng tháng.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNamBang, duongLamNhaNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { cuoiHoiCongKhai, duongCuoiHoi, duongNam, namIndex } from "@/lib/nam";
import { duongViecThang } from "@/lib/hoang-lich";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { CHU_NAM_CUOI_HOI } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: n };
  const index = namIndex(n, await namAmHienTai());
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("ch.seo_tieu_de", b), moTa: c("ch.seo_mo_ta", b), duongVi: duongCuoiHoi(n), noindex: !index });
  const m = themHreflangVi(metaTrang({ tieuDe: c("ch.seo_tieu_de", b), moTa: c("ch.seo_mo_ta", b),
    duong: duongCuoiHoi(n), anh: anhBai({ tieuDe: `Cưới năm ${n}`, mang: "lich" }) }), duongCuoiHoi(n));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const d = await cuoiHoiCongKhai(n);
  if (!d) throw new Error("engine không phản hồi");
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu);
  const duong = duongCuoiHoi(n), bien = { nam: String(n), can_chi: d.can_chi };
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_NAM_CUOI_HOI, nd.chu, ngonNgu);
  const L = (x: string) => lienNN(en, x), nb = { nam: n };
  const tieuDe = c("dau.tieu_de", bien);
  // Năm âm {n} trải từ tháng Tết (năm n) tới tháng 1 năm n + 1 — lối sang ngày tốt cưới hỏi 12 tháng dương lịch từ tháng Tết.
  const t0 = Number(d.tet.slice(5, 7));
  const thang = Array.from({ length: 12 }, (_, i) => { const k = t0 - 1 + i; const y = n + Math.floor(k / 12), m = (k % 12) + 1; return { y, m, href: L(duongViecThang("cuoi-hoi", y, m)) }; })
    .filter((x): x is { y: number; m: number; href: string } => Boolean(x.href));
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: L(duong)!, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`${d.can_chi} year`, "Kim Lau", "Weddings"] })
          : ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Năm ${d.can_chi}`, "Kim lâu", "Cưới hỏi"] }),
        en ? ldDuongDan([{ ten: "Hieuban", duong: "/en" }, { ten: t("muc.ten"), duong: L("/nam")! }, { ten: String(n), duong: L(duongNam(n))! }, { ten: t("ch.ld_ten"), duong: L(duong)! }])
          : ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm", duong: "/nam" }, { ten: `Năm ${n}`, duong: duongNam(n) }, { ten: "Cưới hỏi", duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label={t("c.duong_dan")} className="mb-2 text-sm text-fg-muted"><Link href={L(duongNam(n))!} className="hover:underline">{tp("c.nam_n", nb)}</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label={t("c.tra_loi_nhanh")} className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">{t("c.tra_loi_nhanh")}</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>

      <section className="mt-8" aria-labelledby="bang">
        <h2 id="bang" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{d.cach_tinh}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm" data-testid="bang-cuoi">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{t("ch.cot_co_dau")}</th><th className="pr-3">{t("ch.cot_tuoi_mu")}</th><th className="pr-3">{t("ch.cot_kim_lau")}</th><th>{t("ch.cot_nam_khong")}</th></tr></thead>
            <tbody>{d.ds.map((x) => (
              <tr key={x.nam_sinh} className="border-t border-line/50">
                <td className="py-2 pr-3 text-fg">{x.nam_sinh} <span className="text-fg-faint">{x.can_chi}</span></td>
                <td className="pr-3 tabular-nums text-fg-muted">{x.tuoi_mu}</td>
                <td className={`pr-3 ${x.duoc ? "text-jade" : "text-gold"}`}>{x.kim_lau ?? t("ch.khong_pham")}</td>
                <td className="tabular-nums text-fg-muted">{x.nam_khong_pham ?? "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{d.muon_tuoi}</p>
      </section>

      {thang.length > 0 && <section className="mt-8" aria-labelledby="ngay">
        <h2 id="ngay" className="text-2xl">{c("ngay.tieu_de", bien)}</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {thang.map(({ y, m, href }) => (
            <li key={`${y}-${m}`}><Link href={href} className="inline-flex rounded-full border border-line/70 px-3 py-1.5 hover:border-gold/50">{tp("ch.thang", { thang: m, y })}</Link></li>
          ))}
        </ul>
      </section>}
      <p className="mt-6 rounded-xl border border-line/70 p-4 text-sm leading-relaxed text-fg-muted">{d.ranh_gioi}</p>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">{t("c.hoi_dap")}</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      {!en && <AnhTomTat kieu="cuoi_hoi" nam={n} />}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">{t("ch.cuoi_1") + " "}<Link href={L(duongLamNhaNam(n))!} className="text-gold underline">{tp("ch.cuoi_link_1", nb)}</Link>{". " + t("ch.cuoi_2") + " "}<Link href={L(duongNam(n))!} className="text-gold underline">{tp("ch.cuoi_link_2", nb)}</Link>.</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
