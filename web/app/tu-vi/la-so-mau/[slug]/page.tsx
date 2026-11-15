// MAU6 — một lá số minh hoạ đọc từng bước. Server Component: HTML đầy đủ cho máy tìm kiếm; phần lá số SVG +
// thuật ngữ bấm được nằm trong client component (vẫn render sẵn ở server). Web chỉ hiển thị dữ liệu engine.
import { KhoiCms } from "@/components/cms/KhoiCms";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { laSoMau } from "@/lib/kien-thuc";
import { anhBai, catMoTa, goiLd, ldAnh, ldDuongDan, ldThucThe, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";
import { DocLaSoMau } from "./DocLaSoMau";
import { DuongDan } from "@/components/khung/DuongDan";
import { duongDanCum, duongDanCumEn } from "@/lib/duong-dan";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { banAnh } from "@/lib/duong-en";
import { cumEn } from "@/lib/so-trang-en";
import { anhOgEn, catMoTaEn, ldThucTheEn, metaEn, tieuDeVua } from "@/lib/en/seo";

export const revalidate = 21600;

type Props = { params: Promise<{ slug: string }> };

async function metaGoc({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const m = await laSoMau(params.slug);
  if ((await ngonNguMayChu()).ngonNgu === "en") {
    const duongEn = m ? banAnh(`/tu-vi/la-so-mau/${m.slug}`) : null;
    if (!m || !duongEn) return { title: { absolute: "Page not found · Hieuban" }, robots: { index: false } };
    return metaEn({ title: tieuDeVua([`Sample chart: ${m.tieu_de} · Hieuban`, `${m.tieu_de} · Hieuban`, m.tieu_de]),
      description: `${m.mo_ta} Read step by step, with every term explained.`, path: duongEn, vi: `/tu-vi/la-so-mau/${m.slug}`,
      ngayDang: m.ngay_dang, capNhat: m.cap_nhat ?? m.ngay_dang });
  }
  if (!m) return { title: "Không tìm thấy", robots: { index: false } };
  const duong = `/tu-vi/la-so-mau/${m.slug}`;
  const en = banAnh(duong);
  return {
    title: tieuDeSeo(`Lá số mẫu: ${m.tieu_de}`),
    description: catMoTa(`${m.mo_ta} Đọc từng bước, có giải nghĩa thuật ngữ.`),
    alternates: { canonical: duong, ...(en ? { languages: { vi: duong, en, "x-default": duong } } : {}) },
    openGraph: { type: "article", title: m.tieu_de, description: catMoTa(m.mo_ta), url: duong, locale: "vi_VN", siteName: TEN_SITE,
      images: [{ url: anhBai({ tieuDe: m.tieu_de, mang: "tu-vi" }), width: 1200, height: 630, alt: m.tieu_de }] },
    twitter: { card: "summary_large_image", title: m.tieu_de, description: catMoTa(m.mo_ta), images: [anhBai({ tieuDe: m.tieu_de, mang: "tu-vi" })] },
  };
}

export default async function Page({ params: thamSo }: Props) {
  const params = await thamSo;
  const m = await laSoMau(params.slug);
  if (!m) notFound();
  if ((await ngonNguMayChu()).ngonNgu === "en") return <TrangEn m={m} />;
  const duong = `/tu-vi/la-so-mau/${m.slug}`;
  const nd = await layNoiDungTrang(duong, { tieu_de: m.tieu_de });   // ND-5: khối CMS mẫu cụm "Lá số mẫu"
  const ld = goiLd(
    {
      "@type": "Article", "@id": `${urlDayDu(duong)}#bai`, headline: m.tieu_de, description: m.mo_ta, inLanguage: "vi-VN",
      mainEntityOfPage: urlDayDu(duong),
      // BM-1 / EEAT-1 (SEO-K mục 7): bài chưa thẩm định → tác giả là ban biên tập, chủ biên là editor; có ảnh đại diện.
      author: { "@type": "Organization", name: `Ban biên tập ${TEN_SITE}`, url: siteUrl() },
      editor: { "@id": `${siteUrl()}/tac-gia/duc-luan#nguoi` },
      image: ldAnh(anhBai({ tieuDe: m.tieu_de, mang: "tu-vi" }), m.tieu_de),
      publisher: { "@id": `${siteUrl()}/#to-chuc` }, isPartOf: { "@id": `${siteUrl()}/#website` }, isAccessibleForFree: true,
      about: ldThucThe("tu-vi"), articleSection: m.buoc.map((b) => b.tieu_de),
      ...(m.ngay_dang ? { datePublished: m.ngay_dang, dateModified: m.cap_nhat ?? m.ngay_dang } : {}),
    },
    ldDuongDan(duongDanCum({ ten: "Lá số mẫu", duong: "/tu-vi/la-so-mau" }, { ten: m.tieu_de, duong })),
  );
  const [nam, thang, ngay] = m.ngay.split("-");
  return (
    <article className="mx-auto max-w-5xl">
      <JsonLd data={ld} />
      <DuongDan ds={duongDanCum({ ten: "Lá số mẫu", duong: "/tu-vi/la-so-mau" }, { ten: m.tieu_de, duong })} />
      <header className="mt-3">
        <p className="eyebrow">{m.ten} · {m.gioi_tinh === "nam" ? "Nam" : "Nữ"} · sinh {ngay}/{thang}/{nam} lúc {m.gio}</p>
        <h1 className="mt-1 text-3xl leading-tight sm:text-5xl">{m.tieu_de}</h1>
        <p className="mt-3 max-w-3xl text-lg text-fg-muted">{m.mo_ta}</p>
        <p className="mt-2 text-xs text-fg-faint">
          Nhân vật hư cấu, dùng để minh hoạ. Lời đọc ghép từ kho tri thức Hiểu Bản Thân, độ sáng sao theo Nam phái.
        </p>
      </header>
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mt-6" />

      <DocLaSoMau duLieu={m} />
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-12" />

      <aside className="glass mt-12 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center" data-testid="cta-la-so">
        <Sparkles className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-fg-muted">Đã hiểu cách đọc? Lập <b className="text-fg">lá số của chính bạn</b> và đọc theo đúng bảy bước này.</p>
        <Button asChild><Link href="/tu-vi">Xem lá số của bạn <ArrowRight aria-hidden /></Link></Button>
      </aside>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
      <p className="mt-8 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        Tham khảo văn hoá và tự suy ngẫm — không phải dự báo, không thay thế tư vấn y tế, pháp lý, tài chính.
      </p>
    </article>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));

/** EN-ALL GĐ 4 — một lá số mẫu bản Anh: cùng khối (lá số SVG, chi tiết cung, bảy bước) với bản Việt; chữ bước do engine trả
 *  tiếng Anh, chữ cố định của trang ở đây (chưa có CMS tiếng Anh). */
async function TrangEn({ m }: { m: NonNullable<Awaited<ReturnType<typeof laSoMau>>> }) {
  const duongVi = `/tu-vi/la-so-mau/${m.slug}`, duong = banAnh(duongVi), ce = cumEn("/tu-vi/la-so-mau"), cum = banAnh("/tu-vi/la-so-mau");
  if (!duong || !ce || !cum) notFound();
  const dd = duongDanCumEn("/tu-vi", { ten: ce.ten, duong: cum }, { ten: m.tieu_de, duong });
  const anh = anhOgEn(m.tieu_de);
  const ld = goiLd(
    {
      "@type": "Article", "@id": `${urlDayDu(duong)}#bai`, headline: m.tieu_de, description: catMoTaEn(m.mo_ta), inLanguage: "en",
      mainEntityOfPage: urlDayDu(duong),
      author: { "@type": "Organization", name: "Hieuban editorial team", url: urlDayDu("/en") },
      image: ldAnh(anh, m.tieu_de, "en"),
      publisher: { "@id": `${siteUrl()}/#to-chuc` }, isPartOf: { "@id": `${siteUrl()}/#website` }, isAccessibleForFree: true,
      about: ldThucTheEn("tu-vi"), articleSection: m.buoc.map((b) => b.tieu_de),
      translationOfWork: { "@id": `${urlDayDu(duongVi)}#bai` },
      ...(m.ngay_dang ? { datePublished: m.ngay_dang, dateModified: m.cap_nhat ?? m.ngay_dang } : {}),
    },
    ldDuongDan(dd),
  );
  const [nam, thang, ngay] = m.ngay.split("-");
  const congCu = banAnh("/tu-vi");
  return (
    <article className="mx-auto max-w-5xl">
      <JsonLd data={ld} />
      <DuongDan ds={dd} nhan="Breadcrumb" />
      <header className="mt-3">
        <p className="eyebrow">{m.ten} · {m.gioi_tinh === "nam" ? "Male" : "Female"} · born {ngay}/{thang}/{nam} at {m.gio}</p>
        <h1 className="mt-1 text-3xl leading-tight sm:text-5xl">{m.tieu_de}</h1>
        <p className="mt-3 max-w-3xl text-lg text-fg-muted">{m.mo_ta}</p>
        <p className="mt-2 text-xs text-fg-faint">
          An invented person, used for illustration. The reading is put together from the Hieuban knowledge base; star brightness follows the Vietnamese (Southern) school.
        </p>
      </header>
      <DocLaSoMau duLieu={m} />
      {congCu && (
        <aside className="glass mt-12 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center" data-testid="cta-la-so">
          <Sparkles className="size-6 shrink-0 text-gold" aria-hidden />
          <p className="flex-1 text-fg-muted">Got the idea? Set up <b className="text-fg">your own chart</b> and read it with the same seven steps.</p>
          <Button asChild><Link href={congCu}>See your chart <ArrowRight aria-hidden /></Link></Button>
        </aside>
      )}
      <p className="mt-8 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        Cultural reference and self-reflection — not a prediction, and not a substitute for medical, legal or financial advice.
      </p>
    </article>
  );
}
