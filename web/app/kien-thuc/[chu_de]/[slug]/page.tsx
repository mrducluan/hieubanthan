// Trang kiến thức — Server Component: HTML đầy đủ ngay lần tải đầu (Google, Bing, và bot AI đọc được không cần JS).
// Cấu trúc GEO: tiêu đề = câu hỏi người ta tìm · đoạn "trả lời nhanh" đứng đầu · mục có tiêu đề · hỏi đáp · nguồn ·
// ngày cập nhật · nhãn đã thẩm định (BM-1: bài chưa duyệt không gắn nhãn) · liên kết nội bộ. Schema: Article + FAQPage + BreadcrumbList.
// EEAT-1: dòng tác giả / chủ biên / thẩm định + Person; trang đã thẩm định có WebPage.reviewedBy + lastReviewed.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { MinhHoa } from "@/components/minh-hoa/MinhHoa";
import { DongTacGia } from "@/components/kien-thuc/DongTacGia";
import { GocNhinChuyenGia } from "@/components/kien-thuc/GocNhinChuyenGia";
import { CHUYEN_GIA, idChuyenGia, ldNguoi } from "@/lib/chuyen-gia";
import { CHU_DE, duongTrang, trang, type TrangKienThuc } from "@/lib/kien-thuc";
import { catMoTa, goiLd, ldDuongDan, ldHoiDap, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

type Props = { params: Promise<{ chu_de: string; slug: string }> };

async function tai({ chu_de, slug }: Awaited<Props["params"]>) {
  const cd = CHU_DE[chu_de];
  if (!cd) return null;
  const t = await trang(cd.loai, slug);
  return t ? { cd, t } : null;
}

export async function generateMetadata({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const kq = await tai(params);
  if (!kq) return { title: "Không tìm thấy", robots: { index: false } };
  const { t } = kq;
  const duong = duongTrang(t.loai, t.slug);
  return {
    title: tieuDeSeo(t.tieu_de),
    description: catMoTa(t.mo_ta),
    alternates: { canonical: duong, types: { "text/markdown": `${duong}.md` } },
    robots: { index: t.index, follow: true },
    openGraph: {
      type: "article", title: t.tieu_de, description: t.mo_ta, url: duong, locale: "vi_VN", siteName: TEN_SITE,
      modifiedTime: t.cap_nhat, images: [`/og?tieu_de=${encodeURIComponent(t.tieu_de)}`],
    },
    twitter: { card: "summary_large_image", title: t.tieu_de, description: t.mo_ta },
  };
}

export default async function Page({ params: thamSo }: Props) {
  const params = await thamSo;
  const kq = await tai(params);
  if (!kq) notFound();
  const { cd, t } = kq;
  const duong = duongTrang(t.loai, t.slug);
  const nhap = t.trang_thai !== "da_duyet";
  const tacGia = [t.tac_gia, t.tham_dinh?.nguoi].find((x) => x && CHUYEN_GIA[x]);

  const ld = goiLd(
    {
      "@type": "Article",
      "@id": `${urlDayDu(duong)}#bai`,
      headline: t.tieu_de,
      description: t.mo_ta,
      inLanguage: "vi-VN",
      datePublished: t.cap_nhat,
      dateModified: t.cap_nhat,
      mainEntityOfPage: { "@id": `${urlDayDu(duong)}#trang` },
      image: urlDayDu(`/og?tieu_de=${encodeURIComponent(t.tieu_de)}`),
      // Tác giả là người khi chuyên gia tự viết hoặc đã đọc, sửa, duyệt bài; bài chưa thẩm định ghi tác giả là ban biên tập.
      author: tacGia
        ? { "@id": idChuyenGia(tacGia) }
        : { "@type": "Organization", name: `Ban biên tập ${TEN_SITE}`, url: siteUrl() },
      ...(CHUYEN_GIA[t.chu_bien] ? { editor: { "@id": idChuyenGia(t.chu_bien) } } : {}),
      publisher: { "@id": `${siteUrl()}/#to-chuc` },
      isAccessibleForFree: true,
      isPartOf: { "@id": `${siteUrl()}/#website` },
      about: cd.ten,
      citation: t.nguon,
      ...(nhap ? {} : { creativeWorkStatus: "Published" }),
      abstract: t.tra_loi_nhanh,
    },
    {
      "@type": "WebPage",
      "@id": `${urlDayDu(duong)}#trang`,
      url: urlDayDu(duong),
      name: t.tieu_de,
      inLanguage: "vi-VN",
      isPartOf: { "@id": `${siteUrl()}/#website` },
      ...(t.tham_dinh && CHUYEN_GIA[t.tham_dinh.nguoi]
        ? { reviewedBy: { "@id": idChuyenGia(t.tham_dinh.nguoi) }, lastReviewed: t.tham_dinh.ngay } : {}),
    },
    ...[...new Set([t.chu_bien, t.tac_gia, t.tham_dinh?.nguoi])].map((x) => (x ? CHUYEN_GIA[x] : undefined))
      .filter((cg) => cg !== undefined).map(ldNguoi),
    ldHoiDap(t.hoi_dap),
    ldDuongDan([
      { ten: "Trang chủ", duong: "/" },
      { ten: "Kiến thức", duong: "/kien-thuc" },
      { ten: cd.ten, duong: `/kien-thuc/${params.chu_de}` },
      { ten: t.tieu_de, duong },
    ]),
  );

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={ld} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/kien-thuc" className="hover:text-fg">Kiến thức</Link> ›</li>
          <li><Link href={`/kien-thuc/${params.chu_de}`} className="hover:text-fg">{cd.ten}</Link> ›</li>
        </ol>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl leading-tight sm:text-5xl">{t.tieu_de}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />
            Cập nhật <time dateTime={t.cap_nhat}>{t.cap_nhat.split("-").reverse().join("/")}</time></span>
          {!nhap && <span className="inline-flex items-center gap-1 rounded-full border border-jade/40 px-2.5 py-0.5 text-jade"><ShieldCheck className="size-3.5" aria-hidden /> {t.tac_gia ? "Chuyên gia biên soạn" : "Đã thẩm định"}</span>}
        </div>
        <DongTacGia chu_bien={t.chu_bien} tac_gia={t.tac_gia} tham_dinh={t.tham_dinh} />
      </header>

      <MinhHoa mh={t.minh_hoa} />

      <section aria-label="Trả lời nhanh" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 text-lg leading-relaxed text-fg">{t.tra_loi_nhanh}</p>
      </section>

      {t.goc_nhin && <GocNhinChuyenGia goc_nhin={t.goc_nhin} loai={t.loai} />}

      <div className="mt-8 space-y-8">
        {t.muc.map((m) => (
          <section key={m.tieu_de}>
            <h2 className="text-2xl">{m.tieu_de}</h2>
            {m.doan && <p className="mt-2 leading-relaxed text-fg-muted">{m.doan}</p>}
            {m.danh_sach && (
              <ul className="mt-3 space-y-2">
                {m.danh_sach.map((d) => <li key={d} className="flex gap-2 leading-relaxed text-fg-muted"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden />{d}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>

      {[["trang-con", t.trang_con], ["trang-con-hoa", t.trang_con_hoa]].map(([id, nhom]) => {
        const n = nhom as TrangKienThuc["trang_con"];
        if (!n || n.ds.length === 0) return null;
        return (
          <nav key={id as string} className="mt-10" aria-labelledby={id as string}>
            <h2 id={id as string} className="text-2xl">{n.tieu_de}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {n.ds.map((l) => (
                <li key={l.slug}><Link href={duongTrang(l.loai, l.slug)} className="glass flex items-center justify-between rounded-xl px-4 py-3 text-sm text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">{l.tieu_de}<ArrowRight className="size-4 shrink-0 text-gold/70" aria-hidden /></Link></li>
              ))}
            </ul>
          </nav>
        );
      })}

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">
          {t.hoi_dap.map((h) => (
            <div key={h.hoi} className="rounded-xl border border-line/70 p-4">
              <dt className="font-medium text-fg">{h.hoi}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className="glass mt-10 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <BookOpen className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-fg-muted">Đọc chung chung chỉ là điểm bắt đầu. Xem con số, lá số của <b className="text-fg">chính bạn</b> — có từng bước tính để tự kiểm.</p>
        <Button asChild><Link href={cd.mang}>Xem của tôi <ArrowRight aria-hidden /></Link></Button>
      </aside>

      {(t.lien_quan.length > 0 || (t.lien_ket_ngoai?.length ?? 0) > 0) && (
        <nav className="mt-10" aria-labelledby="lien-quan">
          <h2 id="lien-quan" className="text-xl">Đọc tiếp</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {t.lien_quan.map((l) => (
              <li key={l.slug}><Link href={duongTrang(l.loai, l.slug)} className="inline-flex rounded-full border border-line px-3 py-1.5 text-sm text-fg-muted hover:border-gold/50 hover:text-fg">{l.tieu_de}</Link></li>
            ))}
            {t.lien_ket_ngoai?.map((l) => (
              <li key={l.duong}><Link href={l.duong} className="inline-flex rounded-full border border-gold/40 px-3 py-1.5 text-sm text-fg-muted hover:border-gold hover:text-fg">{l.ten}</Link></li>
            ))}
          </ul>
        </nav>
      )}

      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p className="font-medium text-fg-muted">Nguồn</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">{t.nguon.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="mt-3">Tham khảo văn hoá và tự suy ngẫm — không phải dự báo, không thay thế tư vấn y tế, pháp lý, tài chính.</p>
      </footer>
    </article>
  );
}
