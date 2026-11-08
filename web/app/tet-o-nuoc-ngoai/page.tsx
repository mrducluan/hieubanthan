// QTE-1 tuần 2 — mục lục "Tết ở nước ngoài": người Việt ở Mỹ, Nhật, Úc, Canada — ngày Tết, giờ giao thừa Việt Nam quy ra giờ
// địa phương. Năm Tết sắp tới do engine chọn (tự trượt sau Tết).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang } from "@/lib/seo";
import { dsTetNuocNgoai, duongTetNuoc } from "@/lib/tet-nuoc-ngoai";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

const DUONG = "/tet-o-nuoc-ngoai";
const MAC = { tieuDe: "Tết ở nước ngoài: ngày Tết, giờ giao thừa Việt Nam theo giờ địa phương",
  moTa: "Người Việt ở Mỹ, Nhật, Úc, Canada: Tết Nguyên đán năm nay rơi vào ngày nào, giao thừa Việt Nam là mấy giờ ở nơi bạn sống, lịch Việt và lịch Trung Quốc có lệch nhau không." };

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ ...MAC, duong: DUONG }), await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [ds, nd] = await Promise.all([dsTetNuocNgoai(), layNoiDungTrang(DUONG)]);
  if (!ds || ds === "khong_co") throw new Error("engine không phản hồi");
  const h1 = nd.dau.h1 ?? `Tết ${ds.nam} ở nước ngoài`;
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: h1, tomTat: MAC.moTa, about: ["Tết Nguyên đán", "Người Việt ở nước ngoài"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Tết ở nước ngoài", duong: DUONG }]),
      )} />
      <TieuDeMuc cap={1} nho="Người Việt ở nước ngoài" lon={h1}
        mo_ta={nd.dau.loiDan ?? "Chọn nơi bạn đang sống để xem ngày Tết, giờ giao thừa Việt Nam quy ra giờ địa phương, và năm nào lịch Việt khác lịch Trung Quốc."} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mb-6" />
      <ul className="grid gap-3 sm:grid-cols-2" data-testid="ds-tet-nuoc">
        {ds.nuoc.map((n) => (
          <li key={n.slug}><Link href={duongTetNuoc(n.slug)} className="block rounded-xl border border-line/70 p-5 hover:border-gold/50">
            <span className="font-serif text-xl text-fg">Tết {ds.nam} ở {n.ten}</span>
            <span className="mt-1 block text-sm text-fg-muted">Ngày Tết, giờ giao thừa Việt Nam theo giờ {n.ten}</span>
          </Link></li>
        ))}
      </ul>
      <section className="mt-8" aria-labelledby="vi-sao">
        <h2 id="vi-sao" className="text-2xl">Vì sao cần trang riêng cho từng nước</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Ngày Tết theo âm lịch Việt Nam giống nhau dù bạn ở đâu, nhưng 0 giờ mùng 1 ở Việt Nam rơi vào giờ khác nhau ở từng nơi — có nơi là sáng hôm trước, có nơi là rạng sáng mùng 1. Úc đang mùa hè nên giờ chênh còn đổi theo giờ mùa hè. Có năm lịch Việt và lịch Trung Quốc lệch nhau một ngày, nên hội Tết của cộng đồng người Hoa ở nơi bạn sống có thể khác ngày.</p>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-8" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}
