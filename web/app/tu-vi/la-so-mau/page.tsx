// MAU6 — mục lục 6 lá số minh hoạ (nhân vật hư cấu) đọc từng bước. Server Component cho SEO.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { ArrowRight } from "lucide-react";
import { dsLaSoMau } from "@/lib/kien-thuc";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, metaTrang, siteUrl, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { DuongDan } from "@/components/khung/DuongDan";
import { duongDanCum, duongDanCumEn } from "@/lib/duong-dan";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { banAnh } from "@/lib/duong-en";
import { banTiengAnh } from "@/lib/noi-dung-trang";
import { cumEn } from "@/lib/so-trang-en";
import { metaEn, ldThucTheEn } from "@/lib/en/seo";
import { notFound } from "next/navigation";

export const revalidate = 21600;

const META: Metadata = metaTrang({
  tieuDe: "Lá số Tử vi mẫu — đọc từng bước cho người mới",
  moTa: "6 lá số Tử vi minh hoạ được đọc từng bước: Mệnh–Thân, chính tinh, độ sáng, tam phương tứ chính, cách cục, tứ hoá, đại hạn, lưu niên — kèm giải nghĩa thuật ngữ.",
  duong: "/tu-vi/la-so-mau",
});

const DUONG = "/tu-vi/la-so-mau";

export async function generateMetadata(): Promise<Metadata> {
  if ((await ngonNguMayChu()).ngonNgu === "en") {
    // EN-ALL GĐ 4: /en/zi-wei-dou-shu/sample-charts là rewrite của trang này — chữ máy chủ từ lib/so-trang-en.ts (CUM_EN).
    const ce = cumEn(DUONG), en = banAnh(DUONG);
    if (!ce || !en) return { title: { absolute: "Page not found · Hieuban" }, robots: { index: false } };
    return metaEn({ title: ce.tieu_de_seo, description: ce.mo_ta, path: en, vi: DUONG });
  }
  const meta = apDungSeo(META, await layNoiDungTrang(DUONG));
  const en = banTiengAnh(DUONG);
  return en ? { ...meta, alternates: { ...meta.alternates, languages: { vi: DUONG, en, "x-default": DUONG } } } : meta;
}

const DD = duongDanCum({ ten: "Lá số mẫu", duong: "/tu-vi/la-so-mau" });

export default async function Page() {
  if ((await ngonNguMayChu()).ngonNgu === "en") return <TrangEn />;
  const [ds, nd] = await Promise.all([dsLaSoMau(), layNoiDungTrang(DUONG)]);
  // SEO-L3: engine lỗi → 5xx (Google thử lại), không trả trang 200 rỗng.
  if (!ds.length) throw new Error("Engine chưa trả danh sách lá số mẫu");
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(ldDuongDan(DD))} />
      <DuongDan ds={DD} className="mb-4" />
      <p className="eyebrow">Học đọc lá số</p>
      <h1 className="mt-2 text-3xl leading-tight sm:text-5xl">{nd.dau.h1 ?? "Lá số Tử vi mẫu — đọc từng bước"}</h1>
      <LoiDanCms nd={nd} className="mt-4 max-w-2xl text-fg-muted">
        Mỗi lá là một kiểu lá số tiêu biểu, đọc theo đúng thứ tự người xem tử vi vẫn làm: từ cung Mệnh, chính tinh, tam phương
        tứ chính, cách cục, tứ hoá cho tới đại hạn và lưu niên. Thuật ngữ nào cũng có lời giải nghĩa đời thường.
      </LoiDanCms>
      <p className="mt-2 text-sm text-fg-faint">Nhân vật và ngày sinh là hư cấu, chọn để minh hoạ — không phải người thật.</p>
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2" data-testid="ds-la-so-mau">
        {ds.map((m) => (
          <li key={m.slug}>
            <Link href={`/tu-vi/la-so-mau/${m.slug}`} className="glass group block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
              <p className="text-xs uppercase tracking-[0.15em] text-gold">{m.ten}</p>
              <h2 className="mt-1 font-serif text-xl">{m.tieu_de}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{m.mo_ta}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold">Đọc từng bước <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-12" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />
    </div>
  );
}

/** EN-ALL GĐ 4 — mục lục lá số mẫu bản Anh: cùng bố cục bản Việt, chữ từ CUM_EN + engine (tên nhân vật, tiêu đề tiếng Anh). */
async function TrangEn() {
  const ce = cumEn(DUONG), duongEn = banAnh(DUONG);
  if (!ce || !duongEn) notFound();
  const ds = await dsLaSoMau();
  if (!ds.length) throw new Error("Engine chưa trả danh sách lá số mẫu");
  const dd = duongDanCumEn("/tu-vi", { ten: ce.ten, duong: duongEn });
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", "@id": `${urlDayDu(duongEn)}#trang`, name: ce.h1, description: ce.mo_ta, url: urlDayDu(duongEn), inLanguage: "en",
          isPartOf: { "@id": `${siteUrl()}/#website` }, publisher: { "@id": `${siteUrl()}/#to-chuc` },
          about: [ldThucTheEn("tu-vi")].filter(Boolean),
          mainEntity: { "@type": "ItemList", numberOfItems: ds.length,
            itemListElement: ds.map((m, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(banAnh(`${DUONG}/${m.slug}`)!), name: m.tieu_de })) } },
        ldDuongDan(dd),
      )} />
      <DuongDan ds={dd} nhan="Breadcrumb" className="mb-4" />
      <p className="eyebrow">Learn to read a chart</p>
      <h1 className="mt-2 text-3xl leading-tight sm:text-5xl">{ce.h1}</h1>
      <p className="mt-4 max-w-2xl text-fg-muted">{ce.tra_loi.replace("{so}", String(ds.length))}</p>
      <p className="mt-2 text-sm text-fg-faint">The people and birth dates are invented for illustration — not real people.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2" data-testid="ds-la-so-mau">
        {ds.map((m) => (
          <li key={m.slug}>
            <Link href={banAnh(`${DUONG}/${m.slug}`)!} className="glass group block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
              <p className="text-xs uppercase tracking-[0.15em] text-gold">{m.ten}</p>
              <h2 className="mt-1 font-serif text-xl">{m.tieu_de}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{m.mo_ta}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold">Read step by step <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
