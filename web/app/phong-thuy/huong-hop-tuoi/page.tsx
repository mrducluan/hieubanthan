// SEO-F → SEO-K → AUD-Q2 (chủ dự án duyệt 2026-11-03): mục lục "tuổi nào hợp hướng nào" — 8 trang CUNG PHI + BẢNG 46 năm
// sinh (1960–2005) × nam / nữ, mỗi dòng có neo #tuoi-{năm} (trang năm cũ 308 về đúng dòng). Dữ liệu do engine tính.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { dsCungPhi, duongTuoi } from "@/lib/kien-thuc";
import { goiLd, ldDuongDan, metaTrang, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

export const revalidate = 21600;

const META: Metadata = metaTrang({
  tieuDe: "Hướng hợp tuổi: tuổi nào hợp hướng nào (1960–2005)",
  moTa: "Bảng cung phi nam và nữ sinh 1960–2005, hướng tốt chung của vợ chồng cùng tuổi, và 8 trang hướng tốt, xấu, cách đặt cửa, bếp, giường theo từng cung (Bát trạch).",
  duong: "/phong-thuy/huong-hop-tuoi",
  md: "/phong-thuy/huong-hop-tuoi.md",
});

const DUONG = "/phong-thuy/huong-hop-tuoi";
const dm = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [{ cung, tuoi }, nd] = await Promise.all([dsCungPhi(), layNoiDungTrang(DUONG)]);
  const vd = tuoi.find((t) => t.nam === 1990);
  return (
    <div className="mx-auto max-w-4xl" data-testid="huong-hop-tuoi">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", name: "Hướng hợp tuổi", url: urlDayDu(DUONG), inLanguage: "vi-VN",
          mainEntity: { "@type": "ItemList", numberOfItems: cung.length,
            itemListElement: cung.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongTuoi(c.slug)), name: c.tieu_de })) } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Phong thuỷ", duong: "/phong-thuy" }, { ten: "Hướng hợp tuổi", duong: DUONG }]),
      )} />
      <p className="eyebrow">Phong thuỷ · Bát trạch</p>
      <h1 className="mt-2 text-3xl leading-tight sm:text-5xl">{nd.dau.h1 ?? "Tuổi nào hợp hướng nào?"}</h1>
      <LoiDanCms nd={nd} className="mt-3 max-w-2xl text-fg-muted">
        Hướng hợp tuổi theo Bát trạch đi theo cung phi (mệnh quái) — tính từ năm sinh và giới tính, chia 8 cung, mỗi cung
        có 4 hướng tốt và 4 hướng nên tránh. Tìm năm sinh trong bảng rồi mở trang cung của mình.
      </LoiDanCms>
      {vd && (
        <section aria-label="Trả lời nhanh" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <p className="eyebrow">Trả lời nhanh</p>
          <p className="mt-2 text-lg leading-relaxed text-fg">
            Hướng hợp tuổi theo Bát trạch do cung phi quyết định, và cung phi của nam, nữ cùng năm thường khác nhau. Ví dụ sinh
            năm 1990 ({vd.can_chi}): nam cung {vd.nam_gioi.quai}, hướng tốt nhất {vd.nam_gioi.tot[0]}; nữ cung {vd.nu_gioi.quai},
            hướng tốt nhất {vd.nu_gioi.tot[0]}. Sinh trước Lập xuân ({dm(vd.lap_xuan)}) thì tính theo năm trước.
          </p>
        </section>
      )}
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />
      {cung.length === 0 ? <p className="mt-8 text-fg-muted">Danh sách đang tải, vui lòng quay lại sau ít phút.</p> : (
        <>
          <section className="mt-8" aria-labelledby="tam-cung">
            <h2 id="tam-cung" className="text-2xl">8 cung phi</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {cung.map((c) => (
                <li key={c.slug}>
                  <Link href={duongTuoi(c.slug)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                    <span className="text-fg">Cung {c.quai}</span>
                    <span className="block text-xs text-fg-faint">{c.nhom}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10" aria-labelledby="bang-tuoi">
            <h2 id="bang-tuoi" className="text-2xl">Bảng cung phi theo năm sinh (1960–2005)</h2>
            <p className="mt-2 text-sm text-fg-muted">Năm tính từ Lập xuân. Cột cuối: hướng tốt chung khi vợ chồng sinh cùng năm.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-fg-faint">
                  <tr><th className="py-2 pr-3 font-normal">Năm sinh</th><th className="py-2 pr-3 font-normal">Lập xuân</th>
                    <th className="py-2 pr-3 font-normal">Nam</th><th className="py-2 pr-3 font-normal">Nữ</th><th className="py-2 font-normal">Vợ chồng cùng năm: hướng tốt chung</th></tr>
                </thead>
                <tbody>
                  {tuoi.map((t) => (
                    <tr key={t.nam} id={t.slug} className="scroll-mt-24 border-t border-line/50 target:bg-gold/10">
                      <td className="py-2 pr-3 text-fg"><b>{t.nam}</b> <span className="text-fg-muted">{t.can_chi}</span></td>
                      <td className="py-2 pr-3 text-fg-muted">{dm(t.lap_xuan)}</td>
                      <td className="py-2 pr-3"><Link href={`${duongTuoi(t.nam_gioi.slug)}#nam-${t.nam}`} className="text-gold underline decoration-gold/40 underline-offset-2">{t.nam_gioi.quai}</Link>
                        <span className="block text-xs text-fg-muted">tốt nhất {t.nam_gioi.tot[0]}</span></td>
                      <td className="py-2 pr-3"><Link href={`${duongTuoi(t.nu_gioi.slug)}#nu-${t.nam}`} className="text-gold underline decoration-gold/40 underline-offset-2">{t.nu_gioi.quai}</Link>
                        <span className="block text-xs text-fg-muted">tốt nhất {t.nu_gioi.tot[0]}</span></td>
                      <td className="py-2 text-fg-muted">{t.huong_chung.length ? t.huong_chung.join(", ") : "không chung — theo người trụ cột"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-12" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />
    </div>
  );
}
