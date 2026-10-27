// CMS-3 — trang đích /su-kien/{slug}: ban biên tập ghép khối trong CMS (Trang đích) — chiến dịch mời bạn, dịp lễ,
// mùa thi… không cần sửa code. Hết hạn → báo đã kết thúc + noindex. Schema WebPage (+ FAQPage nếu có khối hỏi đáp).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { KhoiTrangDichView } from "@/components/trang-dich/KhoiTrangDich";
import { anhCms, daHetHan, trangDichCms } from "@/lib/cms";
import { catMoTa, goiLd, ldDuongDan, ldHoiDap, metaTrang, urlDayDu } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await trangDichCms((await params).slug);
  if (!t) return { title: "Không tìm thấy", robots: { index: false } };
  const duong = `/su-kien/${t.slug}`;
  const m = metaTrang({ tieuDe: t.tieu_de, moTa: t.mo_ta_seo || t.tieu_de, duong });
  const anh = anhCms(t.anh_chia_se, "og");
  return {
    ...m,
    ...(anh ? { openGraph: { ...m.openGraph, images: [anh.src] }, twitter: { ...m.twitter, images: [anh.src] } } : {}),
    ...(t.noindex || daHetHan(t) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function Page({ params }: Props) {
  const t = await trangDichCms((await params).slug);
  if (!t) notFound();
  const duong = `/su-kien/${t.slug}`;
  const khoi = t.khoi ?? [];
  const coH1 = khoi[0]?.blockType === "dau_trang";
  const hd = khoi.flatMap((k) => (k.blockType === "hoi_dap" ? k.ds.map((x) => ({ hoi: x.cau_hoi, dap: x.tra_loi })) : []));
  return (
    <div className="mx-auto max-w-5xl space-y-14" data-testid="trang-dich">
      <JsonLd data={goiLd(
        { "@type": "WebPage", name: t.tieu_de, description: catMoTa(t.mo_ta_seo || t.tieu_de), url: urlDayDu(duong), inLanguage: "vi-VN",
          dateModified: t.updatedAt },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: t.tieu_de, duong }]),
        ...(hd.length ? [ldHoiDap(hd)] : []),
      )} />
      {daHetHan(t) && (
        <p role="status" className="rounded-2xl border border-line p-4 text-fg-muted" data-testid="da-ket-thuc">
          Chương trình này đã kết thúc. Các công cụ vẫn dùng miễn phí — <Link href="/huyen-hoc" className="text-gold underline">khám phá ngay</Link>.
        </p>
      )}
      {!coH1 && <h1 className="text-4xl sm:text-5xl">{t.tieu_de}</h1>}
      {khoi.map((k, i) => <KhoiTrangDichView key={k.id ?? i} k={k} h1={coH1 && i === 0} />)}
    </div>
  );
}
