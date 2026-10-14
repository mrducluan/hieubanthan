// SEO-F — mục lục 92 trang "tuổi X hợp hướng nào" (1960–2005 × nam/nữ), nhóm theo thập niên.
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { dsTuoiHuong, duongTuoi } from "@/lib/kien-thuc";
import { goiLd, ldDuongDan, metaTrang, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

export const revalidate = 21600;

const META: Metadata = metaTrang({
  tieuDe: "Hướng hợp tuổi: tuổi nào hợp hướng nào (1960–2005)",
  moTa: "Tra hướng nhà, hướng bếp, hướng giường hợp tuổi theo Bát trạch cho nam và nữ sinh từ 1960 đến 2005: mệnh quái, 4 hướng tốt, 4 hướng nên tránh.",
  duong: "/phong-thuy/huong-hop-tuoi",
  md: "/phong-thuy/huong-hop-tuoi.md",
});

const DUONG = "/phong-thuy/huong-hop-tuoi";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [ds, nd] = await Promise.all([dsTuoiHuong(), layNoiDungTrang(DUONG)]);
  const thapNien = Array.from(new Set(ds.map((t) => Math.floor(t.nam / 10) * 10)));
  return (
    <div className="mx-auto max-w-4xl" data-testid="huong-hop-tuoi">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", name: "Hướng hợp tuổi", url: urlDayDu("/phong-thuy/huong-hop-tuoi"), inLanguage: "vi-VN",
          mainEntity: { "@type": "ItemList", numberOfItems: ds.length,
            itemListElement: ds.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongTuoi(t.slug)), name: t.tieu_de })) } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Phong thuỷ", duong: "/phong-thuy" }, { ten: "Hướng hợp tuổi", duong: "/phong-thuy/huong-hop-tuoi" }]),
      )} />
      <p className="eyebrow">Phong thuỷ · Bát trạch</p>
      <h1 className="mt-2 text-3xl leading-tight sm:text-5xl">{nd.dau.h1 ?? "Tuổi nào hợp hướng nào?"}</h1>
      <LoiDanCms nd={nd} className="mt-3 max-w-2xl text-fg-muted">
        Chọn năm sinh và giới tính để xem mệnh quái, 4 hướng tốt, 4 hướng nên tránh, hướng cửa, bếp, giường và bàn làm việc.
        Sinh tháng 1 hoặc đầu tháng 2 thì xem thêm mục “mốc đầu năm” trong từng trang.
      </LoiDanCms>
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />
      {ds.length === 0 ? <p className="mt-8 text-fg-muted">Danh sách đang tải, vui lòng quay lại sau ít phút.</p> : (
        <div className="mt-8 space-y-8">
          {thapNien.map((tn) => (
            <section key={tn} aria-labelledby={`tn-${tn}`}>
              <h2 id={`tn-${tn}`} className="text-xl">Sinh thập niên {tn}</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ds.filter((t) => Math.floor(t.nam / 10) * 10 === tn).map((t) => (
                  <li key={t.slug}>
                    <Link href={duongTuoi(t.slug)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                      <span className="text-fg">{t.gioi_tinh === "nam" ? "Nam" : "Nữ"} {t.nam}</span>
                      <span className="block text-xs text-fg-faint">{t.can_chi} · {t.quai}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-12" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />
    </div>
  );
}
